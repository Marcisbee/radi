import { update } from "./main.ts";

export function createSignal<T = any>(initialValue: T) {
  let value = initialValue;

  const subscribers: Node[] = [];

  const addSubscriber = (node: Node) => {
    if (subscribers.indexOf(node) === -1) subscribers.push(node);
  };

  const removeSubscriber = (node: Node) => {
    const idx = subscribers.indexOf(node);
    if (idx !== -1) subscribers.splice(idx, 1);
  };

  const attachNodeListeners = (node: Node) => {
    const onConnect = (e: Event) => {
      e.stopImmediatePropagation();
      addSubscriber(node);
    };
    const onDisconnect = (e: Event) => {
      e.stopImmediatePropagation();
      removeSubscriber(node);
    };
    node.addEventListener("connect", onConnect);
    node.addEventListener("disconnect", onDisconnect);
  };

  return ((...args: [] | [T | ((map: T) => any)]) => {
    if (args.length === 0) {
      return value;
    }

    const newValue = args[0];

    if (newValue instanceof Node) {
      attachNodeListeners(newValue);
      return value;
    }

    if (typeof newValue === "function") {
      const mapper = newValue as (map: T) => T;
      return (el: Node) => {
        attachNodeListeners(el);
        return mapper(value);
      };
    }

    try {
      value = newValue as T;
      return value;
    } finally {
      for (const target of subscribers) {
        update(target);
      }
    }
  }) as {
    (): T;
    (newValue: T | ((map: T) => any)): T;
  };
}
