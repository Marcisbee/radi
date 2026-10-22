import { assert, clock, test } from 'jsr:@marcisbee/rion@0.5/test';
import {
  createRouter,
  fetchRouteData,
  matchRoute,
  redirect,
  RouteError,
  RouteRedirect,
} from '../src/router.ts';
import type { Route } from '../src/router.ts';

function fixture(routes: Route[], options = {}) {
  const original = location.href;
  history.replaceState(null, '', '/');
  const router = createRouter({ routes, ...options });
  return {
    router,
    dispose() {
      router.dispose();
      history.replaceState(null, '', original);
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('HTTP data transport preserves server errors and explicit redirect destinations', async () => {
  const data = await fetchRouteData<{ title: string }>('/data');
  assert.equal(data.title, 'From HTTP');
  try {
    await fetchRouteData('/failure');
    throw new Error('Expected HTTP failure');
  } catch (error) {
    assert.equal(error instanceof RouteError, true);
    assert.equal((error as RouteError).status, 503);
    assert.equal((error as RouteError).data, 'Unavailable');
  }
  try {
    await fetchRouteData('/redirect-data');
    throw new Error('Expected redirect');
  } catch (error) {
    assert.equal(error instanceof RouteRedirect, true);
    assert.equal((error as RouteRedirect).location, '/');
  }
});

test('matches static, decoded parameters and splats without accepting missing segments', () => {
  const routes = [{ path: '/*' }, { path: '/pages/:id' }, {
    path: '/pages/new',
  }];
  assert.equal(matchRoute(routes, '/pages/new')!.route.path, '/pages/new');
  assert.equal(
    matchRoute(routes, '/pages/hello%20world/')!.params.id,
    'hello world',
  );
  assert.equal(matchRoute(routes, '/other/path')!.params['*'], 'other/path');
  assert.equal(matchRoute([{ path: '/pages/:id' }], '/pages'), null);
  assert.equal(matchRoute([{ path: '/pages/*' }], '/else'), null);
  assert.equal(matchRoute(routes, '/%ZZ'), null);
});

test('initial server data avoids a read, lazy modules retry, and errors have the destination URL', async () => {
  let loads = 0;
  let attempts = 0;
  const f = fixture([
    {
      path: '/',
      loader: () => {
        loads++;
        return 'read';
      },
    },
    {
      path: '/lazy',
      lazy: async () => {
        if (++attempts === 1) throw new Error('chunk unavailable');
        return { loader: () => 'lazy data' };
      },
    },
  ], { initialData: 'server data' });
  try {
    await f.router.ready;
    assert.equal(f.router.state.data, 'server data');
    assert.equal(loads, 0);
    await f.router.navigate('/lazy');
    assert.equal(f.router.state.error instanceof Error, true);
    assert.equal(location.pathname, '/lazy');
    await f.router.navigate('/lazy');
    assert.equal(f.router.state.data, 'lazy data');
    await f.router.navigate('/missing');
    assert.equal((f.router.state.error as RouteError).status, 404);
    assert.equal(f.router.state.url.pathname, '/missing');
    await f.router.navigate('/');
    assert.equal(loads, 1);
  } finally {
    f.dispose();
  }
});

test('obsolete reads cannot replace newer navigation, even if they ignore abort', async () => {
  const slow = deferred<string>();
  const started = deferred<AbortSignal>();
  const f = fixture([
    { path: '/' },
    {
      path: '/slow',
      loader: ({ signal }) => {
        started.resolve(signal);
        return slow.promise;
      },
    },
    { path: '/fast', loader: ({ url }) => url.searchParams.get('q') },
  ]);
  try {
    await f.router.ready;
    const pending = f.router.navigate('/slow');
    const signal = await started.promise;
    await f.router.navigate('/fast?q=latest');
    assert.equal(signal.aborted, true);
    slow.resolve('obsolete');
    await pending;
    assert.equal(f.router.state.data, 'latest');
    assert.equal(location.pathname, '/fast');
    assert.equal(location.search, '?q=latest');
  } finally {
    f.dispose();
  }
});

test('actions invalidate prefetched data, revalidate, and follow redirects', async () => {
  let value = 0;
  const oldRead = deferred<number>();
  const oldStarted = deferred<void>();
  let reads = 0;
  const f = fixture([
    {
      path: '/',
      loader: () => value,
      action: ({ formData }) => {
        value = Number(formData.get('value'));
        return 'saved';
      },
    },
    {
      path: '/other',
      loader: () => {
        if (++reads === 1) {
          oldStarted.resolve();
          return oldRead.promise;
        }
        return value;
      },
    },
    {
      path: '/redirect',
      action: () => {
        value++;
        redirect('/');
      },
    },
  ], { staleTime: 60_000 });
  try {
    await f.router.ready;
    const prefetch = f.router.prefetch('/other');
    await oldStarted.promise;
    const form = new FormData();
    form.set('value', '7');
    await f.router.submit('/', form);
    assert.equal(f.router.state.data, 7);
    assert.equal(f.router.state.actionData, 'saved');
    oldRead.resolve(0);
    await prefetch;
    await f.router.navigate('/other');
    assert.equal(f.router.state.data, 7);
    await f.router.submit('/redirect', new FormData());
    assert.equal(location.pathname, '/');
    assert.equal(f.router.state.data, 8);
    await f.router.submit('/other', form);
    assert.equal((f.router.state.error as RouteError).status, 405);
  } finally {
    f.dispose();
  }
});

test('prefetch caches are opt-in, bounded and cleared by revalidation', async () => {
  let reads = 0;
  const f = fixture([{ path: '/*', loader: () => ++reads }], {
    staleTime: 60_000,
    cacheSize: 1,
  });
  try {
    await f.router.ready;
    await f.router.prefetch('/one');
    await f.router.navigate('/one');
    assert.equal(reads, 2);
    await f.router.prefetch('/two');
    await f.router.navigate('/one');
    assert.equal(reads, 4);
    await f.router.revalidate();
    assert.equal(reads, 5);
    await clock.fastForward(30_001);
    await f.router.navigate('/one');
    assert.equal(reads, 5);
    await clock.fastForward(30_001);
    await f.router.navigate('/one');
    assert.equal(reads, 6, 'Cache hits must not extend the expiry');
  } finally {
    f.dispose();
  }
});

test('intercepts only ordinary internal links and hash changes do not rerun loaders', async () => {
  let reads = 0;
  const f = fixture([{ path: '/*', loader: () => ++reads }]);
  const root = document.createElement('div');
  root.innerHTML =
    '<a href="/#target"><b>Anchor</b></a><div id="target"></div>';
  document.body.append(root);
  try {
    await f.router.ready;
    f.router.attach(root);
    const anchor = root.querySelector('a')!;
    // Observe cancellation without letting native navigation leave the test runner.
    const click = (settings: MouseEventInit = {}) => {
      let intercepted = false;
      const stop = (event: Event) => {
        intercepted = event.defaultPrevented;
        event.preventDefault();
      };
      document.addEventListener('click', stop, { once: true });
      anchor.querySelector('b')!.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          ...settings,
        }),
      );
      return intercepted;
    };
    assert.equal(click({ ctrlKey: true }), false);
    anchor.setAttribute('download', 'file');
    assert.equal(click(), false);
    anchor.removeAttribute('download');
    anchor.target = '_blank';
    assert.equal(click(), false);
    anchor.target = '';
    anchor.href = 'https://example.com/';
    assert.equal(click(), false);
    anchor.href = '/#target';
    assert.equal(click(), true);
    assert.equal(location.hash, '#target');
    assert.equal(reads, 1);
    f.router.dispose();
    assert.equal(click(), false);
  } finally {
    root.remove();
    f.dispose();
  }
});

test('dispose cancels pending work and removes history subscriptions', async () => {
  const started = deferred<AbortSignal>();
  const pending = deferred<number>();
  const f = fixture([{
    path: '/',
    loader: ({ signal }) => {
      started.resolve(signal);
      return pending.promise;
    },
  }]);
  const signal = await started.promise;
  let notifications = 0;
  f.router.subscribe(() => notifications++);
  f.router.dispose();
  pending.resolve(1);
  await f.router.ready;
  window.dispatchEvent(new PopStateEvent('popstate'));
  assert.equal(signal.aborted, true);
  assert.equal(notifications, 1);
  f.dispose();
});

test('fetchers isolate data, errors and redirects from navigation and each other', async () => {
  let reads = 0;
  const f = fixture([
    { path: '/', loader: () => ++reads },
    {
      path: '/reaction/:id',
      action: ({ params, method }) => ({ id: params.id, method }),
    },
    { path: '/login', action: () => redirect('/signed-in') },
    {
      path: '/denied',
      action: () => {
        throw new RouteError(403, 'Forbidden');
      },
    },
  ]);
  try {
    await f.router.ready;
    const route = f.router.state;
    const url = location.href;
    const length = history.length;
    let notifications = 0;
    f.router.subscribe(() => notifications++);
    const first = f.router.createFetcher<{ id: string; method: string }>();
    const second = f.router.createFetcher<number>();
    await first.submit('/reaction/42', new FormData(), 'DELETE');
    assert.equal(first.state.data?.id, '42');
    assert.equal(first.state.data?.method, 'DELETE');
    assert.equal(reads, 1, 'Actions must not reload the route');
    await second.load('/');
    assert.equal(second.state.data, 2);
    await first.submit('/denied', new FormData());
    assert.equal((first.state.error as RouteError).status, 403);
    assert.equal(first.state.data?.id, '42', 'Retain previous data on failure');
    await first.submit('/login', new FormData());
    assert.equal((first.state.error as RouteRedirect).location, '/signed-in');
    await first.submit('/', new FormData());
    assert.equal((first.state.error as RouteError).status, 405);
    await first.load('/missing');
    assert.equal((first.state.error as RouteError).status, 404);
    assert.equal(f.router.state, route);
    assert.equal(notifications, 1);
    assert.equal(second.state.data, 2);
    assert.equal(location.href, url);
    assert.equal(history.length, length);
  } finally {
    f.dispose();
  }
});

test('fetcher supersession and disposal suppress late results even when work ignores abort', async () => {
  const old = deferred<string>();
  const started = deferred<AbortSignal>();
  const f = fixture([
    { path: '/' },
    {
      path: '/slow',
      action: ({ signal }) => {
        started.resolve(signal);
        return old.promise;
      },
    },
    { path: '/fast', loader: () => 'fresh' },
  ]);
  try {
    await f.router.ready;
    const fetcher = f.router.createFetcher<string>();
    const pending = fetcher.submit('/slow', new FormData());
    const signal = await started.promise;
    await fetcher.load('/fast');
    old.resolve('obsolete');
    await pending;
    assert.equal(signal.aborted, true);
    assert.equal(fetcher.state.data, 'fresh');
    for (const disposeRouter of [false, true]) {
      const result = deferred<string>();
      const began = deferred<AbortSignal>();
      const route: Route = {
        path: '/pending',
        loader: ({ signal }) => {
          began.resolve(signal);
          return result.promise;
        },
      };
      const other = fixture([{ path: '/' }, route]);
      await other.router.ready;
      const task = other.router.createFetcher();
      const loading = task.load('/pending');
      const abort = await began.promise;
      let calls = 0;
      task.subscribe(() => calls++);
      if (disposeRouter) other.router.dispose();
      else task.dispose();
      result.resolve('too late');
      await loading;
      assert.equal(abort.aborted, true);
      assert.equal(calls, 1);
      other.dispose();
    }
  } finally {
    f.dispose();
  }
});

test('targeted invalidation preserves unrelated cache entries and rejects stale prefetch fills', async () => {
  const old = deferred<number>();
  const started = deferred<void>();
  let reads = 0;
  let value = 0;
  const f = fixture([
    { path: '/' },
    {
      path: '/item',
      loader: () => {
        if (++reads === 1) {
          started.resolve();
          return old.promise;
        }
        return value;
      },
      action: () => ++value,
    },
    { path: '/unrelated', loader: () => ++reads },
  ], { staleTime: 60_000 });
  try {
    await f.router.ready;
    const pending = f.router.prefetch('/item?q=1');
    await started.promise;
    await f.router.prefetch('/unrelated');
    const fetcher = f.router.createFetcher();
    await fetcher.submit('/item', new FormData(), 'POST', {
      invalidate: ['/item?q=1#ignored'],
    });
    old.resolve(0);
    await pending;
    await f.router.navigate('/unrelated');
    assert.equal(reads, 2);
    await f.router.navigate('/item?q=1');
    assert.equal(f.router.state.data, 1);
    assert.equal(reads, 3);
    f.router.invalidate(['/item?q=2']);
    await f.router.navigate('/item?q=1');
    assert.equal(reads, 3, 'Query strings identify distinct cache entries');
    await fetcher.submit('/item', new FormData());
    await f.router.navigate('/unrelated');
    assert.equal(
      reads,
      4,
      'Default mutation invalidation remains conservative',
    );
  } finally {
    f.dispose();
  }
});

Object.assign(globalThis, { routerTestResult: await test.run() });
