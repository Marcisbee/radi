// Type augmentations for custom reactive fields used on Node/HTMLElement
declare global {
  interface Node {
    onconnect?: (e: Event) => void;
    ondisconnect?: (e: Event) => void;
    onupdate?: (e: Event) => void;
    __component?: (anchor: Node) => any;
    __reactive_children?: Node[];
    __tail?: Node | null;
    __render_id?: number;
    __render?: (anchor: Node) => void;
    __memo?: () => boolean;
    __reactive_attributes?: Map<string, (el: HTMLElement) => void>;
    __type?: Function;
    __props?: Record<string, any>;
    __instance?: any;
  }
  interface HTMLElement {
    __attr_descriptors?: Map<string, AttrDescriptor>;
    __reactive_attributes?: Map<string, (el: HTMLElement) => void>;
    __raw_props?: Record<string, any> | null;
    __props?: Record<string, any>;
  }
}

type Child = any;

const connectQueue = new Set<Function>();
function queueConnection(fn: Function) {
  connectQueue.add(fn);
}
function flushConnectionQueue() {
  for (const task of connectQueue) task();
  connectQueue.clear();
}

function sendConnectEvent(target: Node) {
  if (!target.isConnected) {
    return;
  }
  if (target.onconnect || target.__component || target.__reactive_children) {
    queueMicrotask(() => {
      if (!target.isConnected) {
        return;
      }
      target.dispatchEvent(new Event("connect"));
    });
  }
}

function sendDisconnectEvent(target: Node) {
  if (target.isConnected) {
    return;
  }
  if (target.ondisconnect || target.__component || target.__reactive_children) {
    queueMicrotask(() => {
      target.dispatchEvent(new Event("disconnect"));
    });
  }
}

function sendUpdateEvent(target: Node) {
  if (!target.isConnected) {
    return true;
  }
  if (
    target.onupdate || target.__component || target.__reactive_children ||
    target.__reactive_attributes
  ) {
    return target.dispatchEvent(new Event("update", { cancelable: true }));
  }
  return true;
}

function replace(childNew: Node, childOld: Node) {
  // Safe replace (older TS lib may not declare replaceWith on Node)
  (childOld as any).replaceWith
    ? (childOld as any).replaceWith(childNew)
    : childOld.parentNode?.replaceChild(childNew, childOld);
  // flushConnectionQueue();
  sendConnectEvent(childNew);
  sendDisconnectEvent(childOld);
  return childNew;
}

function connect(child: Node, parent: Node) {
  if (
    parent.nodeType === Node.COMMENT_NODE ||
    parent.nodeType === Node.TEXT_NODE
  ) {
    // Preserve ordering of reactive children by appending after the last inserted child for this anchor.
    const tail: Node =
      ((parent as any).__tail && (parent as any).__tail.isConnected)
        ? (parent as any).__tail
        : parent;
    (tail as any).after
      ? (tail as any).after(child)
      : tail.parentNode?.insertBefore(child, tail.nextSibling);
    (parent as any).__tail = child;
    sendConnectEvent(child);
    return child;
  }

  parent.appendChild(child);

  if (child.__component && child.__instance === undefined) {
    // if (parent.isConnected) {
    //   build(child.__component(child), child);
    //   // queueMicrotask(() => {
    //   child.dispatchEvent(new Event("connect"));
    //   // });
    // } else {
    //   runAfterConnected(() => {
    //     build(child.__component(child), child);
    //     // queueMicrotask(() => {
    //     child.dispatchEvent(new Event("connect"));
    //     // });
    //   });
    // }
    // return child;
    queueConnection(() => {
      if (!child.isConnected) {
        return;
      }
      build((child.__component as any)?.(), child);
      // queueMicrotask(() => {
      // child.dispatchEvent(new Event('connect'));
      // });
    });
  }

  sendConnectEvent(child);

  return child;
}

function disconnect(child: Node) {
  if (child?.nodeType === Node.COMMENT_NODE && "__reactive_children" in child) {
    for (const cc of child.__reactive_children || []) {
      disconnect(cc);
    }

    if ("__tail" in child) (child as any).__tail = null;
  }

  if (Array.isArray(child)) {
    for (const c of child) {
      disconnect(c);
    }
    return child;
  }

  (child as any).remove
    ? (child as any).remove()
    : child.parentNode?.removeChild(child);
  // flushConnectionQueue();

  sendDisconnectEvent(child);
  // child.dispatchEvent(new Event("disconnect"));
  // for (const el of traverseReactiveChildren([child])) {
  //   el.dispatchEvent(new Event("disconnect"));
  // }

  return child;
}

type AttrDescriptor = {
  key: string;
  kind: "attr" | "style" | "class" | "event";
  reactive?: "pull" | "push";
  get?: () => any;
  teardown?: () => void;
  apply: (el: HTMLElement, value: any) => void;
};

function applyStyle(el: HTMLElement, v: any) {
  if (v == null) {
    el.removeAttribute("style");
    return;
  }
  if (typeof v === "object") {
    el.removeAttribute("style");
    for (const k in v) {
      (el.style as any)[k] = v[k];
    }
    return;
  }
  el.setAttribute("style", v);
}

function applyClass(el: HTMLElement, v: any) {
  if (v == null) {
    el.removeAttribute("class");
    return;
  }
  if (typeof v === "object") {
    for (const cls in v) {
      if (v[cls]) el.classList.add(cls);
      else el.classList.remove(cls);
    }
    if (!el.getAttribute("class") && el.classList.length === 0) {
      el.removeAttribute("class");
    }
    return;
  }
  el.setAttribute("class", v);
}

function applyGeneric(el: HTMLElement, key: string, v: any) {
  if (v === true) {
    el.setAttribute(key, "");
  } else if (v === false || v == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, v);
  }
}

function createDescriptor(
  el: HTMLElement,
  rawKey: string,
  value: any,
): AttrDescriptor {
  const key = rawKey === "className" ? "class" : rawKey;

  if (key.startsWith("on") && typeof value === "function") {
    const eventName = key.substring(2);
    return {
      key,
      kind: "event",
      apply(target) {
        target.addEventListener(eventName, value);
      },
      teardown() {
        el.removeEventListener(eventName, value);
      },
    };
  }

  if (value && typeof value.subscribe === "function") {
    let current: any;
    const sub = value.subscribe((v: any) => {
      current = v;
      descriptorApply(el, key);
    });
    const desc: AttrDescriptor = {
      key,
      kind: key === "style" ? "style" : key === "class" ? "class" : "attr",
      reactive: "push",
      get: () => current,
      apply(target, v) {
        if (key === "style") applyStyle(target, v);
        else if (key === "class") applyClass(target, v);
        else applyGeneric(target, key, v);
      },
      teardown() {
        sub?.unsubscribe?.();
      },
    };
    el.setAttribute("_r", "");
    return desc;
  }

  if (typeof value === "function") {
    const desc: AttrDescriptor = {
      key,
      kind: key === "style" ? "style" : key === "class" ? "class" : "attr",
      reactive: "pull",
      get: () => value(el),
      apply(target, v) {
        if (key === "style") applyStyle(target, v);
        else if (key === "class") applyClass(target, v);
        else applyGeneric(target, key, v);
      },
    };
    el.setAttribute("_r", "");
    return desc;
  }

  return {
    key,
    kind: key === "style" ? "style" : key === "class" ? "class" : "attr",
    apply(target) {
      if (key === "style") applyStyle(target, value);
      else if (key === "class") applyClass(target, value);
      else applyGeneric(target, key, value);
    },
  };
}

function descriptorApply(el: HTMLElement, key: string) {
  const map = el.__attr_descriptors;
  if (!map) return;
  const desc = map.get(key);
  if (!desc) return;
  const v = desc.reactive ? desc.get?.() : undefined;
  desc.apply(el, desc.reactive ? v : undefined);
}

function mountDescriptor(el: HTMLElement, desc: AttrDescriptor) {
  el.__attr_descriptors ??= new Map();
  const existing = el.__attr_descriptors.get(desc.key);
  if (existing) {
    existing.teardown?.();
    if (existing.kind !== "event" && !desc.reactive) {
      el.removeAttribute(existing.key);
    }
  }
  el.__attr_descriptors.set(desc.key, desc);
  if (desc.reactive) {
    el.__reactive_attributes ??= new Map<string, (node: HTMLElement) => void>();
    el.__reactive_attributes.set(
      desc.key,
      (node) => descriptorApply(node as HTMLElement, desc.key),
    );
  } else {
    if (el.__reactive_attributes?.has(desc.key)) {
      el.__reactive_attributes.delete(desc.key);
    }
  }
  if (desc.kind === "event") {
    desc.apply(el, undefined);
  } else {
    descriptorApply(el, desc.key);
  }
}

function unmountMissing(el: HTMLElement, nextKeys: Set<string>) {
  if (!el.__attr_descriptors) return;
  for (const [key, desc] of el.__attr_descriptors) {
    if (!nextKeys.has(key)) {
      desc.teardown?.();
      if (desc.kind !== "event") {
        el.removeAttribute(key);
      }
      el.__attr_descriptors.delete(key);
      el.__reactive_attributes?.delete(key);
    }
  }
}

function updateProps(el: HTMLElement, props: Record<string, any> | null) {
  const keys = props ? Object.keys(props) : [];
  const normalized = keys.map((k) => k === "className" ? "class" : k);
  const set = new Set(normalized);
  unmountMissing(el, set);
  for (const rawKey of keys) {
    const value = props![rawKey];
    const desc = createDescriptor(el, rawKey, value);
    mountDescriptor(el, desc);
  }
  el.__raw_props = props;
}

declare global {
  interface HTMLElement {
    __attr_descriptors?: Map<string, AttrDescriptor>;
    __reactive_attributes?: Map<string, (el: HTMLElement) => void>;
    __raw_props?: Record<string, any> | null;
  }
}

function buildRender(parent: Anchor, fn: (parent: Anchor) => any) {
  parent.__render = () => {
    (parent as any).__tail = parent;
    parent.__reactive_children = ([] as any[]).concat(
      diff(parent.__reactive_children, fn(parent), parent),
    );
  };
}

function diff(valueOld: any, valueNew: any, parent: Node): Node[] {
  if (parent.__render_id === currentUpdateId) {
    // Already processed this branch for this update; return the last known children if tracked
    return (parent.__reactive_children as Node[]) || [];
  }

  const arrayOld = Array.isArray(valueOld) ? valueOld : [valueOld];
  const arrayNew = Array.isArray(valueNew) ? valueNew : [valueNew];
  const arrayOut = Array(arrayNew.length);

  let i = 0;
  for (const itemNew of arrayNew) {
    const ii = i++;
    const itemOld = arrayOld[ii];

    if (itemOld === undefined) {
      arrayOut[ii] = build(itemNew, parent);
      continue;
    }

    if (Array.isArray(itemOld)) {
      if (Array.isArray(itemNew)) {
        const output = diff(itemOld, itemNew, parent);
        arrayOut[ii] = Array.isArray(output) ? output : [output];
        continue;
      }
    }

    if (itemOld === itemNew) {
      arrayOut[ii] = itemOld;
      continue;
    }

    if (
      itemOld.nodeType === Node.COMMENT_NODE &&
      "__reactive_children" in itemOld
    ) {
      itemOld.__render_id = itemNew.__render_id;
      if (typeof itemNew === "function") {
        // Handled by updater(...)
        buildRender(itemOld, itemNew);
        arrayOut[ii] = itemOld;
        continue;
      }

      if (
        itemNew.nodeType === Node.COMMENT_NODE &&
        "__reactive_children" in itemNew
      ) {
        // Handled by updater(...)
        arrayOut[ii] = itemOld;
        continue;
      }
    }

    if (itemOld.nodeType === Node.TEXT_NODE) {
      if (typeof itemNew === "string" || typeof itemNew === "number") {
        itemOld.nodeValue = itemNew;
        arrayOut[ii] = itemOld;
        continue;
      }

      if (itemNew?.nodeType === Node.TEXT_NODE) {
        itemOld.nodeValue = itemNew.nodeValue;
        arrayOut[ii] = itemOld;
        continue;
      }
    }

    if (itemOld.nodeType === Node.ELEMENT_NODE) {
      if (
        itemNew?.nodeType === Node.ELEMENT_NODE &&
        itemOld.nodeName === itemNew.nodeName
      ) {
        if (itemNew.__component) {
          itemOld.__render_id = itemNew.__render_id;
          if (
            itemOld.__props?.key !== itemNew.__props?.key ||
            itemOld.__type !== itemNew.__type
          ) {
            // connectQueue.clear();
            replace(itemNew, itemOld);
            // flushConnectionQueue();
            build(itemNew.__component(), itemNew);
            arrayOut[ii] = itemNew;
            continue;
          }

          itemOld.__props = itemNew.__props;
          itemOld.__component = itemNew.__component;
          // buildRender(itemOld as any, itemOld.__component);
          arrayOut[ii] = itemOld;
          continue;
        }

        if (itemNew.__raw_props) {
          updateProps(itemOld as HTMLElement, itemNew.__raw_props);
        } else {
          updateProps(itemOld as HTMLElement, null);
        }

        diff(
          Array.from(itemOld.childNodes),
          Array.from(itemNew.childNodes),
          itemOld,
        );

        arrayOut[ii] = itemOld;
        continue;
      }

      if (itemNew?.nodeType === Node.ELEMENT_NODE) {
        itemOld.__render_id = itemNew.__render_id;
        replace(itemNew, itemOld);
        arrayOut[ii] = itemNew;
        continue;
      }

      // arrayOut[ii] = build(itemNew, parent);
      // disconnect(itemOld);
      // continue;
    }

    // console.warn('DANGER', { itemNew, itemOld });
    // For reactive anchor parents, preserve relative ordering on replacement
    if (
      (parent.nodeType === Node.COMMENT_NODE ||
        parent.nodeType === Node.TEXT_NODE) &&
      itemOld?.nodeType
    ) {
      const builtNode = build(itemNew, parent) as Node;
      replace(builtNode, itemOld as Node);
      disconnect(itemOld as Node);
      arrayOut[ii] = builtNode;
      continue;
    }

    arrayOut[ii] = build(itemNew, parent);
    disconnect(itemOld);
  }

  for (const toRemove of arrayOld.slice(arrayNew.length)) {
    disconnect(toRemove);
  }

  return arrayOut;
}

function runUpdate(target: Node) {
  if (!sendUpdateEvent(target)) {
    return false;
  }
  // target.dispatchEvent(new Event("update"));
  if (target.isConnected && target.__render_id !== currentUpdateId) {
    if ("__render" in target) {
      if (!(target as any).__memo?.()) {
        (target as any).__render?.(target);
      }
    } else if ("__reactive_attributes" in target) {
      for (
        const update of (target as any).__reactive_attributes?.values?.() || []
      ) {
        (update as any)(target as any);
      }
    }
    target.__render_id = currentUpdateId;
  }
  return true;
}

function updater(target: Node) {
  // console.log("UPDATE", currentUpdateId, target);

  if (!runUpdate(target)) {
    return;
  }

  if (target.__reactive_children) {
    // target.dispatchEvent(new Event("update"))
    for (
      const toUpdate of traverseReactiveChildren(
        [].concat(target.__reactive_children || []),
      )
    ) {
      // toUpdate.dispatchEvent(new Event("update"))
      runUpdate(toUpdate);
    }
  } else {
    for (const toUpdate of traverseReactiveChildren([target])) {
      // toUpdate.dispatchEvent(new Event("update"))
      runUpdate(toUpdate);
    }
  }
}

class UpdateEvent extends Event {
  constructor(public node: Node) {
    super("update");
  }
}

const updateTarget = new EventTarget();
updateTarget.addEventListener(
  "update",
  (e) => {
    e.stopImmediatePropagation();
    currentUpdateId += 1;
    connectQueue.clear();
    const node = (e as any).node;
    if (node instanceof Node) {
      updater(node);
    }
  },
  { capture: true, passive: true },
);

// const updateEventId = `update:${Date.now()}`;
let currentUpdateId: number = 0;
// document.addEventListener(
//   updateEventId,
//   (e) => {
//     e.stopImmediatePropagation();
//     if (e.target instanceof Node) {
//       updater(e.target);
//     }
//   },
//   { capture: true },
// );

function traverseReactiveChildren(scopes: Node[]) {
  const reactive: Anchor[] = [];

  for (const scope of scopes) {
    const xpathResult = document.evaluate(
      ".//comment() | .//*[@_r] | .//host",
      scope,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null,
    );
    let node = xpathResult.iterateNext();
    while (node) {
      if (
        "__reactive_children" in node || "__reactive_attributes" in node ||
        "__component" in node
      ) {
        reactive.push(node as any);
      }
      node = xpathResult.iterateNext();
    }
  }
  return reactive;
}

type BuiltNode = (Node | Node[]) | BuiltNode[];
type Anchor = Node & {
  __reactive_children: Node[];
  __render_id: number;
  __render: (anchor: Anchor) => void;
};
type ComponentHost = Node & {
  __type: Function;
  __key: string | undefined;
  __instance: BuiltNode;
  __component: (anchor: ComponentHost) => BuiltNode;
};

let i = 0;
function build(a: any, parent: Node): BuiltNode {
  if (Array.isArray(a)) {
    return a.map((child) => build(child, parent));
  }

  if (typeof a === "string") {
    const node = document.createTextNode(a);
    connect(node, parent);
    return node;
  }

  if (typeof a === "number") {
    const node = document.createTextNode(String(a));
    connect(node, parent);
    return node;
  }

  if (typeof a === "boolean") {
    const node = document.createComment(String(a));
    connect(node, parent);
    return node;
  }

  if (a == null) {
    const node = document.createComment("null");
    connect(node, parent);
    return node;
  }

  if (typeof a?.subscribe === "function") {
    const b = a;
    let value: unknown;
    let anchor: Node | null = null;
    const unsub = b.subscribe((v: unknown) => {
      value = v;
      if (anchor) {
        update(anchor);
      }
    });
    a = (e: Node): unknown => {
      anchor = e;
      (e as Node).addEventListener?.("disconnect", () => {
        (unsub as any)?.unsubscribe?.();
      }, { once: true });
      return value;
    };
  }

  if (typeof a === "function") {
    const anchor = document.createComment("$") as any as Anchor;
    // const anchor = document.createComment("$" + i++) as any as Anchor;
    connect(anchor, parent);
    anchor.__render_id = currentUpdateId;
    const built = build(a(anchor), parent);
    anchor.__reactive_children = Array.isArray(built)
      ? (built as Node[])
      : [built as Node];
    buildRender(anchor, a);
    return anchor;
  }

  connect(a, parent);
  return a;
}

export const Fragment = Symbol("Fragment");

export function createElement(
  type: string | Function,
  props: null | Record<string, any>,
  ...children: any[]
): Node {
  if (typeof type === "string") {
    const element = document.createElement(type);
    element.__raw_props = props;
    if (props) {
      updateProps(element, props);
    }
    build(children, element);
    return element;
  }

  if (typeof type === "function") {
    const host = document.createElement("host") as any as ComponentHost;
    host.__type = type;
    host.__props = { ...(props || {}), children };
    host.__component = (anchor) => {
      try {
        if (!host.__instance || props?.key !== host.__props?.key) {
          return (host.__instance = type.call(host, () => (host.__props)));
        }
        return host.__instance;
      } catch (error) {
        queueMicrotask(() => {
          if (
            host.dispatchEvent(
              new ErrorEvent("error", {
                error,
                bubbles: true,
                composed: true,
                cancelable: true,
              }),
            )
          ) {
            console.error(type?.name, error);
          }
        });
      }
      return `(ERROR in ${type?.name})`;
    };
    return host;
  }

  if (type === Fragment) {
    return [].concat(children || []) as any;
  }

  return document.createTextNode("<UNHANDLED>");
}

export function createRoot(target: HTMLElement) {
  interface Root {
    render(el: Child): Node;
    root: Node | null;
    unmount(): void;
  }
  const out: Root = {
    render(el: Child): Node {
      try {
        return (out.root = build(el, target) as Node);
      } finally {
        flushConnectionQueue();
        if (
          !el.__component && !el.__reactive_children && !el.__reactive_children
        ) {
          el.dispatchEvent(new Event("connect"));
        }
      }
    },
    root: null,
    unmount() {
      if (out.root) {
        disconnect(out.root);
        out.root = null;
      }
    },
  };
  return out;
}

export function update(target: Node) {
  return updateTarget.dispatchEvent(new UpdateEvent(target));
  // return target.dispatchEvent(new Event(updateEventId));
}

export function memo(fn: () => any, shouldMemo: () => boolean) {
  return (anchor: any) => {
    (anchor as any).__memo = shouldMemo;
    return fn(anchor);
  };
}

// function Counter(this: HTMLElement, props: any) {
//   let count = props().start || 0;
//   console.log('render only once');
//   return (
//     <button
//       style={() =>
//         'color: #' +
//         ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0')
//       }
//       onclick={() => {
//         count++;
//         this.dispatchEvent(new Event('update'));
//       }}
//     >
//       {() => count}
//     </button>
//   );
// }

// function PassThru(this: HTMLElement, props: any) {
//   console.log('FIRST');

//   this.addEventListener('error', (e) => {
//     console.log('ERROR????', e);
//   });

//   return <h1 style="color:orange">{() => props().children}</h1>;
// }

// function Child(this: HTMLElement, props: any) {
//   throw new Error('poop');
//   console.log('SECOND');
//   return <i>Poop</i>;
// }

// function App(this: HTMLElement) {
//   let count = 0;

//   return (
//     <div>
//       <h1>Hello {() => (count % 2 ? 'world' : <i>Mars</i>)}!</h1>
//       <h3>{() => Math.random()}</h3>
//       <h3>{Math.random()}</h3>
//       <div>
//         {'A '}
//         {() => {
//           console.log('A1');
//           const color =
//             '#' +
//             ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0');
//           return [
//             [
//               [
//                 [
//                   [
//                     String(count),
//                     h(
//                       'strong',
//                       {
//                         style: 'color:' + color,
//                       },
//                       ' B ',
//                       color
//                     ),
//                   ],
//                 ],
//                 ' (',
//                 () => (
//                   console.log('A2'),
//                   () => (console.log('A3'), count % 2 ? 'Hey' : null)
//                 ),
//                 ')',
//               ],
//               1,
//             ],
//           ];
//         }}
//       </div>
//       <PassThru>
//         A <Child /> B
//       </PassThru>
//       <button
//         type="button"
//         onclick={() => {
//           count++;
//           this.dispatchEvent(new Event('update'));
//         }}
//       >
//         asd
//       </button>
//       <hr />
//       {() => (
//         console.log('EVERY TIME', count), (<Counter key={count} start={5} />)
//       )}
//       {memo(
//         () => (
//           console.log('EVERY SECOND', count),
//           (<Counter key={count} start={5} />)
//         ),
//         () => count % 2
//       )}
//     </div>
//   );
// }

// console.clear();
// render(<App />, document.body);

export function createAbortSignal(target: Node): AbortSignal {
  const controller = new AbortController();
  target.addEventListener("disconnect", () => controller.abort(), {
    once: true,
  });
  return controller.signal;
}

export function createAbortSignalOnUpdate(target: Node): AbortSignal {
  const controller = new AbortController();
  function onAbort() {
    target.removeEventListener("update", onAbort);
    target.removeEventListener("disconnect", onAbort);
  }
  controller.signal.addEventListener("abort", onAbort, { once: true });
  target.addEventListener("update", () => controller.abort(), { once: true });
  target.addEventListener("disconnect", () => controller.abort(), {
    once: true,
  });
  return controller.signal;
}
