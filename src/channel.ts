import { update } from "./client.ts";

type Updater<T> = T | ((prev: T | undefined) => T);

interface ChannelAccessor<T> {
  (): T;
  set(next: Updater<T>): void;
  update(): void;
  readonly provider: Element | null;
  readonly resolved: boolean;
}

interface ChannelContainer<T> {
  value: T;
  provider: Element;
  disposed: boolean;
  accessor: ChannelAccessor<T>;
}

interface Channel<T> {
  provide(root: Node, initial: Updater<T>): ChannelAccessor<T>;
  use(root: Node): ChannelAccessor<T>;
  key: symbol;
  defaultValue: T;
}

const CHANNELS_SYMBOL = Symbol("radi:channels");

function getChannelMap(el: any): Map<symbol, ChannelContainer<any>> {
  if (!el[CHANNELS_SYMBOL]) el[CHANNELS_SYMBOL] = new Map();
  return el[CHANNELS_SYMBOL];
}

export function createChannel<T>(defaultValue: T): Channel<T> {
  const key = Symbol("channel");

  function resolveInitial(prev: T | undefined, init: Updater<T>): T {
    return typeof init === "function"
      ? (init as (p: T | undefined) => T)(prev)
      : (init as T);
  }

  function makeAccessor<T2>(
    container: ChannelContainer<T2>,
  ): ChannelAccessor<T2> {
    const fn: any = () => container.value;
    Object.defineProperties(fn, {
      provider: { get: () => container.provider },
      resolved: { get: () => true },
    });
    fn.set = (next: Updater<T2>) => {
      if (container.disposed) return;
      const prev = container.value;
      const val = typeof next === "function"
        ? (next as (p: T2) => T2)(prev)
        : (next as T2);
      if (val !== prev) {
        container.value = val;
        update(container.provider);
      }
    };
    fn.update = () => {
      if (!container.disposed) update(container.provider);
    };
    return fn;
  }

  function provide(root: Element, initial: Updater<T>): ChannelAccessor<T> {
    const map = getChannelMap(root);
    let container = map.get(key) as ChannelContainer<T> | undefined;
    if (!container) {
      const value = resolveInitial(undefined, initial);
      container = {
        value,
        provider: root,
        disposed: false,
        accessor: undefined as any,
      };
      container.accessor = makeAccessor(container);
      map.set(key, container);
      root.addEventListener(
        "disconnect",
        () => {
          container!.disposed = true;
        },
        { once: true },
      );
    } else if (!container.disposed) {
      const next = resolveInitial(container.value, initial);
      if (next !== container.value) {
        container.value = next;
        update(container.provider);
      }
    }
    return container.accessor;
  }

  function findNearest(start: Element): ChannelContainer<T> | null {
    let cur: any = start;
    while (cur) {
      const map: Map<symbol, ChannelContainer<T>> | undefined =
        cur[CHANNELS_SYMBOL];
      if (map && map.has(key)) {
        const c = map.get(key)!;
        if (!c.disposed) return c;
      }
      cur = cur.parentNode;
    }
    return null;
  }

  function use(root: Element): ChannelAccessor<T> {
    let container: ChannelContainer<T> | null = null;
    let cached = defaultValue;
    let resolved = false;

    const fn: any = () => {
      if (!resolved && root.isConnected) attemptResolve();
      return container ? container.value : cached;
    };

    function attemptResolve() {
      if (resolved) return;
      container = findNearest(root);
      if (container) {
        resolved = true;
        cached = container.value;
        update(root); // Re-render if we were showing default
      }
    }

    Object.defineProperties(fn, {
      provider: { get: () => (container ? container.provider : null) },
      resolved: { get: () => resolved },
    });

    fn.set = (next: Updater<T>) => {
      if (!container) return; // ignore until resolved
      const prev = container.value;
      const val = typeof next === "function"
        ? (next as (p: T) => T)(prev)
        : (next as T);
      if (val !== prev) {
        container.value = val;
        update(container.provider);
      }
    };

    fn.update = () => {
      if (container) update(container.provider);
    };

    if (root.isConnected) {
      attemptResolve();
    } else {
      root.addEventListener(
        "connect",
        () => {
          attemptResolve();
        },
        { once: true },
      );
    }

    return fn as ChannelAccessor<T>;
  }

  return { provide, use, key, defaultValue };
}
