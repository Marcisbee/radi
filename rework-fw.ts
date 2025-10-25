// deno-lint-ignore-file no-inner-declarations
import { emit } from "node:process";
import { diff } from "./rework-diff.ts";

export const Fragment = Symbol();

/** A reactive function returns new child(ren) when invoked with the parent element. */
type ReactiveGenerator = (parent: Node) => Child | Child[];

/** Primitive or structured child value accepted by createElement/buildElement. */
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

  for (const task of tasks) {
    task();
  }
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
  interface Event {
    __surgicalUpdate?: boolean;
  }
}

let createNanoEvents = () => ({
  emit(event, ...args) {
    for (
      let callbacks = this.events[event] || [],
        i = 0,
        length = callbacks.length;
      i < length;
      i++
    ) {
      callbacks[i](...args);
    }
  },
  events: {},
  on(event, cb) {
    (this.events[event] ||= []).push(cb);
    return () => {
      this.events[event] = this.events[event]?.filter((i) => cb !== i);
    };
  },
});

const EVENT_BUS = createNanoEvents();

function buildElement(child: Child): Node[] {
  if (typeof child === "string" || typeof child === "number") {
    return [document.createTextNode(String(child))];
  }

  if (typeof child === "boolean") {
    return [document.createComment(child ? "true" : "false")];
  }

  if (typeof child === "function") {
    const target = REACTIVE_TEMPLATE.cloneNode() as Comment & {
      reactiveChildren: Node[];
      reactiveComponent?: boolean;
    };
    // if (DEBUG) {
    target.textContent = String(
      `${child.name2 || child.name || "$"}:${++reactiveIdCounter}`,
    );
    // }
    target.reactiveChildren = [];
    pendingConnections.push(target);

    const runGenerator = (): Node[] => {
      // Execute the generator. If it returns another single reactive function,
      // flatten it (tail-call collapse) so we avoid creating an extra reactive layer.
      const produced: Child | Child[] = (child as ReactiveGenerator)(target);
      // while (typeof produced === "function") {
      //   produced = (produced as ReactiveGenerator)(target);
      // }
      const producedList: Child[] = Array.isArray(produced)
        ? produced
        : [produced];
      return producedList.flatMap(buildElement);
    };

    function render(e?: Event) {
      const isInitial = !e;
      if (isInitial) {
        // console.log("initial", target.nodeValue);

        target.reactiveChildren = inlineDiff(
          target.reactiveChildren,
          runGenerator(),
          target,
        );
        flush();
        return;
      }

      // console.log("update", target.nodeValue);

      if (!target.isConnected) {
        return;
      }

      const isSelf = e.target === target;
      const isAncestor = isSelf || e.target instanceof Element &&
          e.target.contains(target) ||
        e.target.reactiveChildren?.find((ee) =>
          target === ee || ee.contains(target)
        );
      // const isAncestor = e instanceof Element &&
      //   e.contains(target);
      // console.log({ isSelf, isAncestor, e: e.target, currentTarget: target });

      if (!isAncestor) return;

      // target.dispatchEvent(new Event("update"));

      if (isSelf) {
        e.stopPropagation();
      }

      // if (isSelf) {
      // queueMicrotask(() => {
      // let poop = target.reactiveChildren;
      // pendingDisconnections.push(...target.reactiveChildren);
      target.reactiveChildren = inlineDiff(
        target.reactiveChildren,
        runGenerator(),
        target,
      );
      flush();

      // @TODO can this be removed?
      // traverseReactiveChildren(t, (childScope) => {
      //   // if (!childScope.isConnected) {
      //   console.log("-----------");
      //   pendingDisconnections.push(childScope);
      //   // }
      // });
      // flush();

      // Propagate surgical updates to direct reactive children
      // traverseReactiveChildren(target.reactiveChildren, (childScope) => {
      //   console.log("TRAVERSE UPDATE", childScope);
      //   childScope.dispatchEvent(new Event("update"));
      // });
      // flush();
      // });
      // }

      // if (isSelf) {
      //   const ev = new Event("update");
      //   ev.__surgicalUpdate = true;
      //   target.dispatchEvent(ev);
      // }

      // console.log(target, e)

      // flush();
      // Recompute this scope

      // console.log({ pendingConnections, pendingDisconnections });

      // flush();

      // console.log("PROPAGATE SURGICAL UPDATES", target, e.target, e.currentTarget)

      // console.log("EVENT", target);
      // if (target === e.currentTarget) {
      //   console.log("YEEEEP");
      // }

      // if (!target.isConnected) return;

      // const eventTarget = e!.target as Node;
      // const isSelf = eventTarget === target;
      // const isAncestor = eventTarget instanceof Element &&
      //   eventTarget.contains(target) || target.reactiveChildren?.find((ee) => eventTarget.contains(ee));
      // console.log({ isSelf, isAncestor, eventTarget, currentTarget: target });
      // if (!isSelf && !isAncestor) return;

      // // Recompute this scope
      // target.reactiveChildren = inlineDiff(
      //   target.reactiveChildren,
      //   runGenerator(),
      //   target,
      // );

      // if (DEBUG) {
      //   console.log(
      //     "%cU " + target.textContent,
      //     "color: orange",
      //     ...target.reactiveChildren,
      //   );
      // }
      // e.stopPropagation();

      // // If this was a surgical update from an ancestor, don't re-dispatch
      // if (e!.__surgicalUpdate) {
      //   e.stopImmediatePropagation();
      //   flush();
      //   return;
      // }

      // // Propagate surgical updates to direct reactive children
      // traverseReactiveChildren(target.reactiveChildren, (childScope) => {
      //   const ev = new Event("update");
      //   ev.__surgicalUpdate = true;
      //   childScope.dispatchEvent(ev);
      // });

      // // console.log("PROPAGATE SURGICAL UPDATES", target, e.target, e.currentTarget)

      // //   const ev = new Event('update');
      // //   ev.__surgicalUpdate = true;
      // //   target.dispatchEvent(ev);

      // flush();
    }

    // let off: () => void;

    function disconnect() {
      // console.log("disconnect", target.nodeValue);
      if (DEBUG) {
        console.log(
          "%c- " + target.textContent,
          "color: red;background:pink",
          ...target.reactiveChildren,
        );
      }

      document.body.removeEventListener("request:update", render, {
        capture: true,
      });
      // off?.();

      // const parent = target.parentNode;
      for (const el of target.reactiveChildren) {
        if (el.isConnected) {
          el.parentElement?.removeChild?.(el);
          pendingDisconnections.push(el);
        }
      }
      flush();
    }

    function connect() {
      // unsubConnect();
      target.removeEventListener("connect", connect, { capture: true });
      // console.log("connect", target.nodeValue);
      runMicrotasks(() => {
        render();
        // Need to dispatch connect after initial render because when first connect triggers event listeners are not connected in component yet
        target.dispatchEvent(new Event("connect"));
      });
      if (DEBUG) {
        console.log(
          "%c+ " + target.textContent,
          "color: green;background:lightgreen",
          ...target.reactiveChildren,
        );
      }
      target.addEventListener("disconnect", disconnect, {
        capture: true,
        once: true,
        // passive: true,
      });
      // console.log("subscribe connect", target.nodeValue);
      // off = EVENT_BUS.on("update", render);
      document.body.addEventListener("request:update", render, {
        capture: true,
        // passive: true,
      });
    }

    // const unsubConnect = EVENT_BUS.on("connect", (node) => {
    //   if (node === target) {
    //     connect();
    //   }
    // });
    // queueMicrotask(connect);
    // console.log("subscribe connect", target.nodeValue);
    target.addEventListener("connect", connect, {
      capture: true,
      once: true,
      // passive: true,
    });

    return [target];
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

let pendingConnections: Node[] = [];
let pendingDisconnections: Node[] = [];

function traverseReactiveChildren(scopes: Node[], cb: (node: Node) => void) {
  for (const scope of scopes) {
    const xpathResult = document.evaluate(
      ".//comment()",
      scope,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    );
    const commentNodes = [];
    let node = xpathResult.iterateNext();
    while (node) {
      // cb(node);
      commentNodes.push(node);
      node = xpathResult.iterateNext();
    }
    for (const commentNode of commentNodes) {
      if (commentNode.reactiveChildren) {
        cb(commentNode);
      }
    }
  }
}

function flush() {
  // let connects = pendingConnections.splice(0, pendingConnections.length);
  // let disconnects = pendingDisconnections.splice(0, pendingDisconnections.length);

  // Ensure unique items in each array while preserving original order
  const connects = Array.from(new Set(pendingConnections));
  const disconnects = Array.from(new Set(pendingDisconnections));

  pendingConnections = [];
  pendingDisconnections = [];

  // console.log({connects, disconnects})
  for (const node of connects) {
    // EVENT_BUS.emit("connect", node);
    node.dispatchEvent(new Event("connect"));
  }
  for (const node of disconnects) {
    // EVENT_BUS.emit("disconnect", node);
    node.dispatchEvent(new Event("disconnect"));
  }
}

export function render(el: Node | Node[], target: HTMLElement) {
  try {
    // if (target.nodeType === Node.COMMENT_NODE) {
    //   target.replaceWith(...[].concat(el));
    //   return el;
    // }

    if (Array.isArray(el)) {
      target.append(...el);
    } else {
      target.append(el);
    }
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

  inlineDiff(
    [],
    // [].concat(el).flatMap(buildElement),
    buildElement(el),
    comment,
  );

  try {
    return container;
  } finally {
    flush();
  }
}

function inlineDiff(
  a: Node[],
  b: Node[],
  c: Comment | Node,
): Node[] {
  return diff(
    c.parentElement,
    a,
    b,
    (e: Node, method: number) => {
      if ((e as Node).reactiveChildren) {
        if (method === -1) {
          pendingDisconnections.push(e);
        }
        if (method === 1) {
          pendingConnections.push(e);
        }
      } else if (method === -1) {
        traverseReactiveChildren([e], (e2) => {
          pendingDisconnections.push(e2);
        });
      }
      return e;
    },
    c,
  );
}

export function createElement(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...childrenRaw: Child[]
) {
  const children: Node[] = childrenRaw.flatMap(buildElement);

  if (typeof type === "function") {
    // const placeholder = document.createComment("");
    // const anchor = document.createComment("COMPONENT");

    let instance: Node[] | null = null;
    const component = (p: Node & { reactiveComponent?: boolean }) => {
      p.reactiveComponent = true;
      if (!instance) {
        const produced = type.call(p);
        const list: Child[] = Array.isArray(produced) ? produced : [produced];
        instance = list.flatMap(buildElement);
      }
      return instance;
    };

    component.name2 = type.name || "Component";

    // anchor.__elements = [].concat(component);

    return component;

    // try {
    //   return placeholder;
    // } finally {
    //   render(component, placeholder);
    // }
  }

  if (typeof type === "string") {
    const element = document.createElement(type);

    if (props) {
      for (const key in props) {
        const value = props[key];
        if (!key.startsWith("on") && typeof value === "function") {
          // ...
        } else {
          (element as unknown as Record<string, unknown>)[key] = value;
        }
      }
    }

    try {
      return element;
    } finally {
      render(children, element);
      // element.append(...[].concat(...children));
    }
  }

  return document.createComment("NOT IMPLEMENTED");
  // return {
  //   type,
  //   props,
  //   children,
  // }
}

export function update(node: Node) {
  node.dispatchEvent(new Event("update"));
  // queueMicrotask(() => {
  //   node.dispatchEvent(new Event("request:update"));
  // });

  traverseReactiveChildren(node.reactiveChildren ?? [node], (childScope) => {
    childScope.dispatchEvent(new Event("update"));
  });

  node.dispatchEvent(new Event("request:update"));
}

export function createRoot(target: HTMLElement) {
  const out: {
    render(el: Node): Node;
    root: null | Node;
  } = {
    render(el: Node) {
      return out.root = renderClient(el, target);
    },
    root: null,
  };

  return out;
}

// document.body.addEventListener("update", (e) => {
//   e.stopImmediatePropagation();
//   EVENT_BUS.emit("update", e.target);
//   console.log("UPDATE DISPATCHED")
// }, {
//   passive: true,
//   capture: true,
// })
