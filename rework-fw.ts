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
  | ReactiveGenerator
  | VNode;

interface VNode {
  __v: true;
  type: string | ComponentFactory | typeof Fragment;
  props: Record<string, unknown> | null;
  children: Child[];
  _node: Node | Node[] | null;
  readonly ref: Node | Node[];
}

function isVNode(value: unknown): value is VNode {
  return !!value && typeof value === "object" &&
    (value as { __v?: unknown }).__v === true;
}

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
  if (isVNode(child)) {
    const realized = child.ref;
    return Array.isArray(realized) ? realized : [realized];
  }

  if (typeof child === "string" || typeof child === "number") {
    return [document.createTextNode(String(child))];
  }

  if (typeof child === "boolean") {
    return [document.createComment(child ? "true" : "false")];
  }

  if (typeof child === "function") {
    return [createReactiveScope(child as ReactiveGenerator)];
  }

  if (
    typeof child === "object" && child !== null && "subscribe" in child &&
    typeof child.subscribe === "function"
  ) {
    let currentValue: any;
    let initialized = false;
    let subscription: { unsubscribe: () => void } | undefined;

    // deno-lint-ignore no-inner-declarations
    function subscribable(parent: ReactiveGenerator) {
      subscription ??= child.subscribe((value: any) => {
        currentValue = value;
        if (initialized) {
          update(parent);
        }
      });

      on.call(parent, "disconnect", () => {
        subscription?.unsubscribe();
        subscription = undefined;
      }, {
        once: true,
      });
      initialized = true;
      return currentValue;
    }
    return [createReactiveScope(subscribable)];
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

  // @TODO:
  // --1. events must bubble to closest reactive scope only, currently captured at document level
  // --2. rework rendering, must call component first, then render children etc
  //    - comment anchor -> component -> props -> children -> reactives
  // --3. component
  // 4. subscribable
  // --5. props
  // 6. keys

  pendingConnections.push(target);
  const runGenerator = (): Node[] => {
    try {
      const produced = generator(target);
      const producedList: Child[] = Array.isArray(produced)
        ? produced
        : [produced];
      return producedList.flatMap(buildElement);
    } catch (error) {
      console.error("Error in reactive generator:", error);
      target.dispatchEvent(
        new ErrorEvent("error", {
          error,
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );
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
    on.call(target, "disconnect", disconnect, {
      capture: true,
      once: true,
    });
    on("request:update", render, { capture: true });
  }

  on.call(target, "connect", connect, { capture: true, once: true });
}

function traverseReactiveChildren(scopes: Node[], cb: (node: Node) => void) {
  for (const scope of scopes) {
    const xpathResult = document.evaluate(
      ".//comment() | .//*[@host]",
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
      if (c.reactiveChildren || c.reactiveComponent) cb(c);
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

export function render(el: Child | Child[], target: HTMLElement) {
  try {
    const nodes: Node[] = Array.isArray(el)
      ? el.flatMap(buildElement)
      : buildElement(el);
    target.append(...nodes);
    return nodes.length === 1 ? nodes[0] : nodes;
  } finally {
    flush();
  }
}

export function renderClient(el: Child, target: HTMLElement) {
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

function setGlobalStyle(selector: string, declarations: string) {
  const style = document.createElement("style");
  style.type = "text/css";
  style.appendChild(document.createTextNode(`${selector} { ${declarations} }`));
  document.head.appendChild(style);
}
setGlobalStyle("[host]", "display:contents;");

export function createElement(
  type: string | ComponentFactory | typeof Fragment,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
) {
  // Return a lightweight VNode with lazy realization through the ref getter.
  const vnode: VNode = {
    __v: true,
    type,
    props,
    children: childrenRaw,
    _node: null,
    get ref(): Node | Node[] {
      if (this._node) return this._node;
      this._node = realize();
      return this._node;
    },
  };

  const realize = (): Node | Node[] => {
    // Component (function)
    if (typeof type === "function") {
      let instance: Node[] | null = null;
      // let childrenCache: Node[];
      const host = document.createElement(type.name || "host");
      host.setAttribute("host", "");
      host.reactiveComponent = true;

      host.appendChild(
        createReactiveScope(
          (e) => {
            on.call(e, "disconnect", () => {
              pendingDisconnections.push(host);
            }, { once: true, capture: true });
            if (!instance) {
              let cachedProps: Record<string, unknown> | null = null;
              const produced = (type as ComponentFactory).call(
                host,
                () =>
                  cachedProps ??= {
                    ...props,
                    children: childrenRaw.flatMap(buildElement),
                  },
              );
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

    // Fragment: flatten children into nodes
    if (type === Fragment) {
      return childrenRaw.flatMap(buildElement);
    }

    // String element
    if (typeof type === "string") {
      const element = document.createElement(type);
      if (props) {
        for (const key in props) {
          const value = (props as Record<string, unknown>)[key];
          if (!key.startsWith("on") && typeof value === "function") {
            // placeholder for future reactive prop handling
          } else {
            (element as unknown as Record<string, unknown>)[key] = value;
          }
        }
      }
      const builtChildren = childrenRaw.flatMap(buildElement);
      try {
        return element;
      } finally {
        render(builtChildren, element);
      }
    }

    return document.createComment("NOT IMPLEMENTED");
  };

  return vnode as unknown as Node; // external code may still treat as Node-like
}

export function update(node: Node) {
  node.dispatchEvent(new Event("update"));
  traverseReactiveChildren(node.reactiveChildren ?? [node], (childScope) => {
    childScope.dispatchEvent(new Event("update"));
  });
  node.dispatchEvent(new Event("request:update"));
}

export function createRoot(target: HTMLElement) {
  const out: { render(el: Child): Node; root: null | Node } = {
    render(el: Child) {
      return (out.root = renderClient(el, target));
    },
    root: null,
  };
  return out;
}
