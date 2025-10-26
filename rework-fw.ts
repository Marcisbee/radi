import { diff } from "./rework-diff.ts";

export const Fragment = Symbol();

type ComponentFactory = (
  this: Node & { reactiveComponent?: boolean },
) => Child | Child[];
type ReactiveGenerator = (parent: Node) => Child | Child[];
type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | Node
  | Child[]
  | ReactiveGenerator;

const tasks = new Set<() => void>();
let microtaskScheduled = false;

function runMicrotasks(task: () => void) {
  tasks.add(task);
  if (microtaskScheduled) return;
  microtaskScheduled = true;
  document.body.dispatchEvent(
    new Event("request:microtask", { cancelable: true }),
  );
}

document.body.addEventListener("request:microtask", (e) => {
  e.stopImmediatePropagation();
  e.stopPropagation();
  for (const task of tasks) task();
  tasks.clear();
  microtaskScheduled = false;
}, { capture: true });

const REACTIVE_TEMPLATE = document.createComment("<>");
const FRAGMENT_START_TEMPLATE = document.createComment("<>");
const FRAGMENT_END_TEMPLATE = document.createComment("</>");
const DEBUG = false;
let reactiveIdCounter = 0;

declare global {
  interface Node {
    reactiveChildren?: Node[];
    reactiveComponent?: boolean;
  }
}

let pendingConnections: Node[] = [];
let pendingDisconnections: Node[] = [];

interface ReactiveScope extends Comment {
  reactiveChildren: Node[];
  reactiveComponent?: boolean;
}

function buildElement(child: Child): Node[] {
  if (typeof child === "string" || typeof child === "number") {
    return [document.createTextNode(String(child))];
  }
  if (typeof child === "boolean") {
    return [document.createComment(child ? "true" : "false")];
  }
  if (typeof child === "function") {
    return [createReactiveScope(child as ReactiveGenerator)];
  }
  if (Array.isArray(child)) {
    const fragmentChildren = child.flatMap(buildElement);
    return [
      FRAGMENT_START_TEMPLATE.cloneNode(),
      ...fragmentChildren,
      FRAGMENT_END_TEMPLATE.cloneNode(),
    ];
  }
  if (child == null) {
    return [document.createComment("null")];
  }
  return [child as Node];
}

function isAncestorHelper(eventTarget: Node, root: Node): boolean {
  if (eventTarget === root) return true;

  // We'll interleave walking up the DOM/host chain from eventTarget with a
  // traversal of the root's reactiveChildren tree in a single loop. As we
  // climb ancestors we add them to a set; as we traverse reactiveChildren we
  // check membership against that set (or direct equality to eventTarget).
  const ancestors = new Set<Node>();
  const seen = new Set<Node>();
  let cur: Node | null = eventTarget;

  // Initialize stack with root's reactive children (if any).
  const rootRc =
    (root as Node & { reactiveChildren?: Node[] }).reactiveChildren;
  const stack: Node[] = rootRc ? rootRc.slice() : [];

  while (cur || stack.length) {
    if (cur) {
      if (cur === root) return true;
      ancestors.add(cur);
      // climb into shadow host if present (for ShadowRoot) without using `any`
      const host = (cur as ShadowRoot).host as Node | undefined;
      cur = host ?? cur.parentNode;
      continue;
    }

    const n = stack.pop()!;
    if (ancestors.has(n) || n === eventTarget) return true;

    const rc = (n as Node & { reactiveChildren?: Node[] }).reactiveChildren;
    if (rc && !seen.has(n)) {
      seen.add(n);
      // push children onto stack for DFS
      for (let i = rc.length - 1; i >= 0; i--) stack.push(rc[i]);
    }
  }

  return false;
}

const on = document.addEventListener;
const off = document.removeEventListener;

function createReactiveScope(generator: ReactiveGenerator): ReactiveScope {
  const target = REACTIVE_TEMPLATE.cloneNode() as ReactiveScope;
  target.textContent = String(
    `${generator.name || "$"}:${++reactiveIdCounter}`,
  );
  target.reactiveChildren = [];

  // const originalAddEventListener = target.addEventListener;
  // const originalRemoveEventListener = target.removeEventListener;

  // keep reactive listeners in a closure-scoped map: eventName -> (originalListener -> wrapper)
  const reactiveListeners = new Map<
    string,
    Map<EventListenerOrEventListenerObject, EventListener>
  >();

  target.addEventListener = function (
    name: string,
    listener?: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (
      name === "update" || name === "connect" || name === "disconnect" ||
      name === "request:update"
    ) {
      return on.call(target, name, listener, options);
    }

    if (!listener) return;

    let byName = reactiveListeners.get(name);
    if (!byName) {
      byName = new Map();
      reactiveListeners.set(name, byName);
    }

    const handler: EventListener = (e: Event) => {
      const eventTarget = e.target as Node;
      if (!isAncestorHelper(eventTarget, target)) return;

      if (typeof listener === "function") {
        (listener as EventListener)(e);
      } else if (
        typeof listener === "object" &&
        listener !== null &&
        "handleEvent" in listener &&
        typeof (listener as EventListenerObject).handleEvent === "function"
      ) {
        (listener as EventListenerObject).handleEvent(e);
      }
    };

    document.addEventListener(name, handler, { capture: true });
    byName.set(listener, handler);
  };

  // @TODO:
  // 1. events must bubble to closest reactive scope only, currently captured at document level
  // 2. rework rendering, must call component first, then render children etc
  //    - comment anchor -> component -> props -> children -> reactives
  // 3. component
  // 4. subscribable
  // 5. props
  // 6. keys

  target.removeEventListener = function (
    name: string,
    listener?: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ) {
    if (
      name === "update" || name === "connect" || name === "disconnect" ||
      name === "request:update"
    ) {
      return off.call(target, name, listener, options);
    }

    const byName = reactiveListeners.get(name);
    if (!byName) return;

    if (listener) {
      const wrapper = byName.get(listener);
      if (wrapper) {
        document.removeEventListener(name, wrapper, { capture: true });
        byName.delete(listener);
      }
    } else {
      // remove all listeners for this event name
      for (const wrapper of byName.values()) {
        document.removeEventListener(name, wrapper, { capture: true });
      }
      reactiveListeners.delete(name);
      return;
    }

    if (byName.size === 0) reactiveListeners.delete(name);
  };

  // target.addEventListener2 = (name: string, cb: any) => {
  //   return document.body.call(target, name, ...args);
  // };
  // target.removeEventListener2 = (name: string, ...args: any[]) => {
  //   return originalRemoveEventListener.call(target, name, ...args);
  // };

  pendingConnections.push(target);
  const runGenerator = (): Node[] => {
    try {
      const produced = generator(target);
      const producedList: Child[] = Array.isArray(produced)
        ? produced
        : [produced];
      return producedList.flatMap(buildElement);
    } catch (e) {
      target.dispatchEvent(new Event("error", { bubbles: true }));
      console.error("Error in reactive generator:", e);
      return [document.createComment("error")];
    }
  };
  attachReactiveListeners(target, runGenerator);
  return target;
}

function attachReactiveListeners(
  target: ReactiveScope,
  runGenerator: () => Node[],
) {
  const apply = () => {
    target.reactiveChildren = inlineDiff(
      target.reactiveChildren,
      runGenerator(),
      target,
    );
  };

  function render(e?: Event) {
    const isInitial = !e;
    if (isInitial) {
      apply();
      flush();
      return;
    }
    if (!target.isConnected) return;
    const isSelf = e!.target === target;
    const eventTarget = e!.target as Node;
    const isAncestor = isAncestorHelper(target, eventTarget);
    // const isAncestor = isSelf ||
    //   (eventTarget instanceof Element && eventTarget.contains(target)) ||
    //   eventTarget.reactiveChildren?.find((n) =>
    //     target === n || n.contains(target)
    //   );
    if (!isAncestor) return;
    if (isSelf) e!.stopPropagation();
    apply();
    flush();
  }

  function disconnect() {
    if (DEBUG) {
      console.log(
        "%c- " + target.textContent,
        "color:red;background:pink",
        ...target.reactiveChildren,
      );
    }
    document.body.removeEventListener("request:update", render, {
      capture: true,
    });
    for (const el of target.reactiveChildren) {
      if (el.isConnected) {
        el.parentElement?.removeChild?.(el);
        pendingDisconnections.push(el);
      }
    }
    flush();
  }

  function connect() {
    target.removeEventListener("connect", connect, { capture: true });
    runMicrotasks(() => {
      render();
      // Fire a second connect so nested scopes created during first render can observe it
      target.dispatchEvent(new Event("connect"));
    });
    if (DEBUG) {
      console.log(
        "%c+ " + target.textContent,
        "color:green;background:lightgreen",
        ...target.reactiveChildren,
      );
    }
    target.addEventListener("disconnect", disconnect, {
      capture: true,
      once: true,
    });
    document.body.addEventListener("request:update", render, { capture: true });
  }

  target.addEventListener("connect", connect, { capture: true, once: true });
}

function traverseReactiveChildren(scopes: Node[], cb: (node: Node) => void) {
  for (const scope of scopes) {
    const xpathResult = document.evaluate(
      ".//comment()",
      scope,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    );
    const commentNodes: Node[] = [];
    let node = xpathResult.iterateNext();
    while (node) {
      commentNodes.push(node);
      node = xpathResult.iterateNext();
    }
    for (const c of commentNodes) {
      if (c.reactiveChildren) cb(c);
    }
  }
}

function flush() {
  const connects = Array.from(new Set(pendingConnections));
  const disconnects = Array.from(new Set(pendingDisconnections));
  pendingConnections = [];
  pendingDisconnections = [];
  for (const node of connects) node.dispatchEvent(new Event("connect"));
  for (const node of disconnects) node.dispatchEvent(new Event("disconnect"));
}

export function render(el: Node | Node[], target: HTMLElement) {
  try {
    if (Array.isArray(el)) target.append(...el);
    else target.append(el);
    return el;
  } finally {
    flush();
  }
}

export function renderClient(el: Node, target: HTMLElement) {
  const container = document.createElement("app");
  const comment = document.createComment("app");
  container.appendChild(comment);
  target.appendChild(container);
  inlineDiff([], buildElement(el), comment);
  try {
    return container;
  } finally {
    flush();
  }
}

function inlineDiff(a: Node[], b: Node[], c: Comment | Node): Node[] {
  return diff(
    c.parentElement,
    a,
    b,
    (e: Node, method: number) => {
      if ((e as Node).reactiveChildren) {
        if (method === -1) pendingDisconnections.push(e);
        if (method === 1) pendingConnections.push(e);
      } else if (method === -1) {
        traverseReactiveChildren([e], (e2) => pendingDisconnections.push(e2));
      }
      return e;
    },
    c,
  );
}

function setGlobalStyle(selector, declarations) {
  // declarations is a string like: "color: red; font-weight: bold;"
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(`${selector} { ${declarations} }`));
  document.head.appendChild(style);
}
setGlobalStyle('[host]', 'display:contents;');

export function createElement(
  type: string | ComponentFactory | typeof Fragment,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
) {
  if (typeof type === "function") {
    let instance: Node[] | null = null;
    let children: Node[];
    const host = document.createElement(type.name || "host");
    host.setAttribute("host", "");

    // host.style.display = "contents";
    host.reactiveComponent = true;

    host.appendChild(
      createReactiveScope(
        () => {
          if (!instance) {
            const produced = (type as ComponentFactory).call(host, () => ({
              ...props,
              get children() {
                return children ??= childrenRaw.flatMap(buildElement);
              },
            }));
            const list: Child[] = Array.isArray(produced)
              ? produced
              : [produced];
            instance = list.flatMap(buildElement);
          }
          return instance;
        },
      ),
    );

    pendingConnections.push(host);

    return host;
  }
  const children: Node[] = childrenRaw.flatMap(buildElement);
  if (type === Fragment) return children;
  if (typeof type === "string") {
    const element = document.createElement(type);
    if (props) {
      for (const key in props) {
        const value = props[key];
        if (!key.startsWith("on") && typeof value === "function") {
          // placeholder for future reactive prop handling
        } else {
          (element as unknown as Record<string, unknown>)[key] = value;
        }
      }
    }
    try {
      return element;
    } finally {
      render(children, element);
    }
  }
  return document.createComment("NOT IMPLEMENTED");
}

export function update(node: Node) {
  node.dispatchEvent(new Event("update"));
  traverseReactiveChildren(node.reactiveChildren ?? [node], (childScope) => {
    childScope.dispatchEvent(new Event("update"));
  });
  node.dispatchEvent(new Event("request:update"));
}

export function createRoot(target: HTMLElement) {
  const out: { render(el: Node): Node; root: null | Node } = {
    render(el: Node) {
      return (out.root = renderClient(el, target));
    },
    root: null,
  };
  return out;
}
