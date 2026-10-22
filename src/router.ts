/** Optional browser routing and data lifecycle, independent of the DOM renderer. */
export interface RouteContext {
  url: URL;
  params: Readonly<Record<string, string>>;
  signal: AbortSignal;
}

export interface ActionContext extends RouteContext {
  formData: FormData;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface RouteModule {
  loader?: (context: RouteContext) => unknown | Promise<unknown>;
  action?: (context: ActionContext) => unknown | Promise<unknown>;
  view?: (state: RouterState) => Node | Node[];
}

export interface Route extends RouteModule {
  /** Absolute path with :parameters or a final * wildcard. */
  path: string;
  lazy?: () => Promise<RouteModule>;
}

export interface RouteMatch {
  route: Route;
  params: Readonly<Record<string, string>>;
}

export interface RouterState {
  url: URL;
  match: RouteMatch | null;
  module: RouteModule | null;
  data: unknown;
  actionData: unknown;
  error: unknown;
  status: 'idle' | 'loading' | 'submitting';
}

export class RouteError extends Error {
  constructor(public status: number, public data: unknown) {
    super(`Route request failed (${status})`);
  }
}

export class RouteRedirect {
  constructor(public location: string) {}
}

/** Throw from a loader/action to navigate without committing its data. */
export function redirect(location: string): never {
  throw new RouteRedirect(location);
}

/** JSON transport for Go or any HTTP server; authorization stays on the server. */
export async function fetchRouteData<T = unknown>(
  input: string | URL,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  const response = await fetch(input, { ...init, headers });
  const location = response.headers.get('X-Radi-Location');
  if (response.ok && location) redirect(location);
  const json = response.headers.get('Content-Type')?.includes('json');
  const data = response.status === 204
    ? null
    : json
    ? await response.json()
    : await response.text();
  if (!response.ok) throw new RouteError(response.status, data);
  if (response.status !== 204 && !json) {
    throw new Error('Expected JSON route data');
  }
  return data as T;
}

function segments(path: string): string[] {
  return path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

/** Static segments win over parameters; parameters win over wildcards. */
export function matchRoute(
  routes: readonly Route[],
  pathname: string,
): RouteMatch | null {
  let parts: string[];
  try {
    parts = segments(pathname).map(decodeURIComponent);
  } catch {
    return null;
  }
  const candidates = routes.map((route) => ({
    route,
    parts: segments(route.path),
  }));
  candidates.sort((a, b) => {
    const rank = (part?: string) =>
      part === '*' ? 0 : part?.startsWith(':') ? 1 : part ? 2 : 3;
    const longest = a.parts.length > b.parts.length ? a.parts : b.parts;
    for (const [i] of longest.entries()) {
      const difference = rank(b.parts[i]) - rank(a.parts[i]);
      if (difference) return difference;
    }
    return 0;
  });
  for (const candidate of candidates) {
    const params: Record<string, string> = Object.create(null);
    let index = 0;
    for (const part of candidate.parts) {
      if (part === '*') {
        params['*'] = parts.slice(index).join('/');
        index = parts.length;
        break;
      }
      if (index >= parts.length) break;
      if (part.startsWith(':')) params[part.slice(1)] = parts[index];
      else if (part !== parts[index]) break;
      index++;
    }
    const complete = candidate.parts.at(-1) === '*'
      ? index === parts.length && index >= candidate.parts.length - 1
      : index === candidate.parts.length && index === parts.length;
    if (complete) return { route: candidate.route, params };
  }
  return null;
}

export interface RouterOptions {
  routes: readonly Route[];
  /** Data serialized by the server for the initial URL. Omit to run its loader. */
  initialData?: unknown;
  /** Cache is opt-in and bounded. Never cache across identities. */
  staleTime?: number;
  cacheSize?: number;
}

/** One router owns the window history. Call dispose() before replacing it. */
export function createRouter(options: RouterOptions) {
  for (const route of options.routes) {
    if (
      !route.path.startsWith('/') ||
      segments(route.path).slice(0, -1).includes('*')
    ) {
      throw new Error(`Invalid route path: ${route.path}`);
    }
  }
  let state: RouterState = {
    url: new URL(window.location.href),
    match: null,
    module: null,
    data: undefined,
    actionData: undefined,
    error: undefined,
    status: 'idle',
  };
  let active: AbortController | undefined;
  let disposed = false;
  let epoch = 0;
  const listeners = new Set<(state: RouterState) => void>();
  const modules = new Map<Route, Promise<RouteModule>>();
  const cache = new Map<string, { data: unknown; expires: number }>();
  const prefetches = new Set<AbortController>();
  const detachments = new Set<() => void>();
  const staleTime = Math.max(0, options.staleTime ?? 0);
  const cacheSize = Math.max(0, options.cacheSize ?? 20);
  if (!Number.isFinite(staleTime) || !Number.isSafeInteger(cacheSize)) {
    throw new Error(
      'Cache duration and size must be finite non-negative numbers',
    );
  }
  const key = (url: URL) => url.pathname + url.search;
  const emit = (next: RouterState) => {
    state = next;
    for (const listener of listeners) listener(state);
  };
  const invalidate = () => {
    epoch++;
    cache.clear();
  };
  const save = (url: URL, data: unknown, version: number) => {
    if (!staleTime || !cacheSize || version !== epoch || disposed) return;
    cache.delete(key(url));
    cache.set(key(url), { data, expires: Date.now() + staleTime });
    while (cache.size > cacheSize) cache.delete(cache.keys().next().value!);
  };
  const getModule = (route: Route): Promise<RouteModule> => {
    let module = modules.get(route);
    if (!module) {
      module = Promise.resolve().then(async () => ({
        ...route,
        ...await route.lazy?.(),
      }));
      modules.set(route, module);
      module.catch(() => modules.delete(route));
    }
    return module;
  };
  const resolve = (to: string | URL) => {
    const url = new URL(to, window.location.href);
    if (url.origin !== window.location.origin) {
      throw new Error('Router URLs must be same-origin');
    }
    return url;
  };
  const load = async (url: URL, signal: AbortSignal, fresh = false) => {
    const match = matchRoute(options.routes, url.pathname);
    if (!match) throw new RouteError(404, 'Route not found');
    const module = await getModule(match.route);
    signal.throwIfAborted();
    const version = epoch;
    const cached = cache.get(key(url));
    const hit = !fresh && cached && cached.expires > Date.now();
    const data = hit
      ? cached.data
      : await module.loader?.({ url, params: match.params, signal });
    signal.throwIfAborted();
    if (!hit) save(url, data, version);
    return { match, module, data };
  };
  const commitURL = (url: URL, mode: 'push' | 'replace' | 'none') => {
    if (mode === 'push') history.pushState(null, '', url);
    if (mode === 'replace') history.replaceState(history.state, '', url);
  };
  const scroll = (url: URL) => {
    if (url.hash) {
      try {
        document.getElementById(decodeURIComponent(url.hash.slice(1)))
          ?.scrollIntoView();
      } catch { /* Malformed anchors have no target. */ }
    } else window.scrollTo(0, 0);
  };
  async function transition(
    url: URL,
    mode: 'push' | 'replace' | 'none',
    action?: { formData: FormData; method: ActionContext['method'] },
    fresh = false,
    initial = false,
  ): Promise<void> {
    if (disposed) return;
    active?.abort();
    const controller = active = new AbortController();
    const { signal } = controller;
    emit({
      ...state,
      status: action ? 'submitting' : 'loading',
      error: undefined,
    });
    let actionData: unknown;
    try {
      if (action) {
        invalidate();
        const match = matchRoute(options.routes, url.pathname);
        if (!match) throw new RouteError(404, 'Route not found');
        const module = await getModule(match.route);
        signal.throwIfAborted();
        if (!module.action) throw new RouteError(405, 'Route has no action');
        actionData = await module.action({
          ...action,
          url,
          params: match.params,
          signal,
        });
        signal.throwIfAborted();
        invalidate();
      }
      const result = initial && 'initialData' in options
        ? await initialResult(url, signal)
        : await load(url, signal, fresh || !!action);
      signal.throwIfAborted();
      commitURL(url, mode);
      emit({ url, ...result, actionData, error: undefined, status: 'idle' });
      if (mode !== 'none') scroll(url);
    } catch (error) {
      if (action) invalidate();
      if (signal.aborted) return;
      if (error instanceof RouteRedirect) {
        if (action) invalidate();
        await followRedirect(error, url, mode);
        return;
      }
      commitURL(url, mode);
      emit({
        url,
        match: matchRoute(options.routes, url.pathname),
        module: null,
        data: undefined,
        actionData,
        error,
        status: 'idle',
      });
    }
  }
  let redirects = 0;
  async function followRedirect(
    error: RouteRedirect,
    from: URL,
    mode: 'push' | 'replace' | 'none',
  ) {
    try {
      if (++redirects > 10) throw new Error('Too many route redirects');
      const url = resolve(new URL(error.location, from));
      await transition(
        url,
        mode === 'none' ? 'replace' : mode,
        undefined,
        true,
      );
    } catch (error) {
      emit({ ...state, error, status: 'idle' });
    } finally {
      redirects--;
    }
  }
  async function initialResult(url: URL, signal: AbortSignal) {
    const match = matchRoute(options.routes, url.pathname);
    if (!match) throw new RouteError(404, 'Route not found');
    const module = await getModule(match.route);
    signal.throwIfAborted();
    return { match, module, data: options.initialData };
  }
  const onPopState = () => {
    void transition(new URL(location.href), 'none');
  };
  async function navigate(
    to: string | URL,
    settings: { replace?: boolean } = {},
  ) {
    const url = resolve(to);
    if (
      !disposed && state.status === 'idle' && !state.error &&
      key(url) === key(state.url) && url.hash !== state.url.hash
    ) {
      commitURL(url, settings.replace ? 'replace' : 'push');
      emit({ ...state, url });
      scroll(url);
      return;
    }
    await transition(url, settings.replace ? 'replace' : 'push');
  }
  window.addEventListener('popstate', onPopState);
  const ready = transition(state.url, 'none', undefined, false, true);

  return {
    get state() {
      return state;
    },
    ready,
    subscribe(listener: (state: RouterState) => void) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
    navigate,
    async submit(
      to: string | URL,
      formData: FormData,
      method: ActionContext['method'] = 'POST',
    ) {
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        throw new Error('Invalid action method');
      }
      await transition(resolve(to), 'push', { formData, method });
    },
    async revalidate() {
      invalidate();
      await transition(new URL(location.href), 'none', undefined, true);
    },
    invalidate,
    async prefetch(to: string | URL) {
      if (disposed) return;
      const controller = new AbortController();
      prefetches.add(controller);
      try {
        await load(resolve(to), controller.signal);
      } finally {
        prefetches.delete(controller);
      }
    },
    /** Opt-in link interception. Native modified/external/download clicks pass through. */
    attach(target: HTMLElement | Document = document) {
      if (disposed) throw new Error('Router is disposed');
      const click = (event: MouseEvent) => {
        if (
          event.defaultPrevented || event.button || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey
        ) return;
        const anchor = event.composedPath().find((node) =>
          node instanceof HTMLAnchorElement
        ) as HTMLAnchorElement | undefined;
        if (
          !anchor || !anchor.hasAttribute('href') ||
          anchor.relList.contains('external') ||
          anchor.hasAttribute('download') ||
          anchor.hasAttribute('data-radi-reload') ||
          (anchor.target && anchor.target !== '_self') ||
          document.querySelector('base[target]')
        ) return;
        const url = new URL(anchor.href);
        if (
          url.origin !== location.origin ||
          !matchRoute(options.routes, url.pathname)
        ) return;
        event.preventDefault();
        void navigate(url);
      };
      target.addEventListener('click', click as EventListener);
      const detach = () =>
        target.removeEventListener('click', click as EventListener);
      detachments.add(detach);
      return () => {
        detach();
        detachments.delete(detach);
      };
    },
    dispose() {
      disposed = true;
      active?.abort();
      for (const controller of prefetches) controller.abort();
      for (const detach of detachments) detach();
      window.removeEventListener('popstate', onPopState);
      listeners.clear();
      cache.clear();
    },
  };
}
