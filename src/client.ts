// Type augmentations for custom reactive fields used on Node/HTMLElement
// declare global {
//   interface Node {
//     onconnect?: (e: Event) => void;
//     ondisconnect?: (e: Event) => void;
//     onupdate?: (e: Event) => void;
//     __component?: (anchor: Node) => any;
//     __reactive_children?: Node[];
//     __tail?: Node | null;
//     __render_id?: number;
//     __render?: (anchor: Node) => void;
//     __memo?: () => boolean;
//     __reactive_attributes?: Map<string, (el: HTMLElement) => void>;
//     __type?: Function;
//     __props?: Record<string, any>;
//     __instance?: any;
//   }
//   interface HTMLElement {
//     __attr_descriptors?: Map<string, AttrDescriptor>;
//     __reactive_attributes?: Map<string, (el: HTMLElement) => void>;
//     __raw_props?: Record<string, any> | null;
//     __props?: Record<string, any>;
//   }
// }

type Child = any;

const connectQueue = new Set<Function>();
function queueConnection(fn: Function) {
  connectQueue.add(fn);
}
function flushConnectionQueue() {
  // Iteratively flush queued component build/connect tasks.
  // Nested component hosts can enqueue additional tasks while a task runs.
  // Loop until no new tasks are added to ensure full tree construction in a single cycle.
  while (connectQueue.size) {
    const tasks = Array.from(connectQueue);
    connectQueue.clear();
    for (const task of tasks) {
      try {
        task();
      } catch (err) {
        // Swallow to avoid aborting remaining connection tasks; surface minimally.
        console.error("connection task error", err);
      }
    }
  }
}

function sendConnectEvent(target: Node) {
  if (target.onconnect || target.__component || target.__reactive_children) {
    if (!target.isConnected) {
      return;
    }
    target.dispatchEvent(new Event("connect"));
  }
}

function sendDisconnectEvent(target: Node) {
  if (target.isConnected) {
    return;
  }
  if (target.ondisconnect || target.__component || target.__reactive_children) {
    target.dispatchEvent(new Event("disconnect"));
  }
}

function sendUpdateEvent(target: Node) {
  // Prevent duplicate dispatch within the same update cycle
  if ((target as any).__update_id === currentUpdateId) {
    return true;
  }
  if (!target.isConnected) {
    return true;
  }
  if (
    target.onupdate || target.__component || target.__reactive_children ||
    target.__reactive_attributes
  ) {
    (target as any).__update_id = currentUpdateId;
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

    // Synchronously build component hosts when mounted under a reactive anchor
    // so their inner content is available in the same update cycle (no queued delay).
    if (child.__component && child.__instance === undefined) {
      queueConnection(() => {
        if (!child.isConnected) {
          return;
        }
        build((child.__component as any)?.(), child);
        sendConnectEvent(child);
      });
    }

    sendConnectEvent(child);
    return child;
  }

  parent.appendChild(child);

  if (child.__component && child.__instance === undefined) {
    // Queue component build for normal element parents; flush will occur at root render.
    queueConnection(() => {
      if (!child.isConnected) {
        return;
      }
      build((child.__component as any)?.(), child);
      // Dispatch connect after initial build (single fire)
      sendConnectEvent(child);
    });
    return child;
  }

  sendConnectEvent(child);

  return child;
}

function disconnect(child: Node) {
  if (Array.isArray(child)) {
    for (const c of child) {
      disconnect(c);
    }
    return child;
  }

  traverseReactiveChildren(child?.__reactive_children || [child]).forEach(
    (toDisconnect) => {
      queueMicrotask(() => {
        toDisconnect.dispatchEvent(new Event("disconnect"));
        const descs = (toDisconnect as any).__attr_descriptors;
        if (descs) {
          for (const [, desc] of descs) {
            try {
              desc.teardown?.();
            } catch {
              /* ignore teardown errors */
            }
          }
          descs.clear?.();
        }
        toDisconnect.__reactive_attributes?.clear?.();
      });
    },
  );

  const descs = (child as any).__attr_descriptors;
  if (descs) {
    for (const [, desc] of descs) {
      try {
        desc.teardown?.();
      } catch {
        /* ignore teardown errors */
      }
    }
    descs.clear?.();
  }
  child.__reactive_attributes?.clear?.();

  if (child.isConnected) {
    (child as any).remove
      ? (child as any).remove()
      : child.parentNode?.removeChild(child);
  }

  sendDisconnectEvent(child);
  return child;
}

type AttrDescriptor = {
  key: string;
  kind: "attr" | "style" | "class" | "event";
  reactive?: "pull" | "push";
  get?: () => any;
  teardown?: () => void;
  apply: (el: HTMLElement, value?: any) => void;
  raw?: any;
};

function applyStyle(el: HTMLElement, v: any) {
  if (v == null) {
    if (el.hasAttribute("style")) el.removeAttribute("style");
    return;
  }
  if (typeof v === "object") {
    for (const k in v) {
      const next = v[k];
      if ((el.style as any)[k] !== next) {
        (el.style as any)[k] = String(next);
      }
    }
    return;
  }
  const next = String(v);
  if (el.getAttribute("style") !== next) el.setAttribute("style", next);
}

function applyClass(el: HTMLElement, v: any) {
  if (v == null) {
    if (el.hasAttribute("class")) el.removeAttribute("class");
    return;
  }
  if (typeof v === "object") {
    for (const cls in v) {
      const should = !!v[cls];
      const has = el.classList.contains(cls);
      if (should && !has) el.classList.add(cls);
      else if (!should && has) el.classList.remove(cls);
    }
    if (el.classList.length === 0 && el.hasAttribute("class")) {
      el.removeAttribute("class");
    }
    return;
  }
  const next = String(v);
  if (el.getAttribute("class") !== next) el.setAttribute("class", next);
}

function applyGeneric(el: HTMLElement, key: string, v: any) {
  if (key === "value" && (el as any).value !== undefined) {
    if (v == null || v === false) {
      if ((el as any).value !== "") (el as any).value = "";
      if (el.hasAttribute("value")) el.removeAttribute("value");
      return;
    }
    const next = String(v);
    if ((el as any).value !== next) (el as any).value = next;
    if (el.getAttribute("value") !== next) el.setAttribute("value", next);
    return;
  }

  if (v === true) {
    if (!el.hasAttribute(key)) el.setAttribute(key, "");
    return;
  }
  if (v === false || v == null) {
    if (el.hasAttribute(key)) el.removeAttribute(key);
    return;
  }
  const next = String(v);
  if (el.getAttribute(key) !== next) el.setAttribute(key, next);
}

function createDescriptor(
  el: HTMLElement,
  rawKey: string,
  value: any,
): AttrDescriptor {
  const key = rawKey === "className" ? "class" : rawKey;

  // Event
  if (key.startsWith("on") && typeof value === "function") {
    const eventName = key.slice(2).toLowerCase();
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

  const kind: AttrDescriptor["kind"] = key === "style"
    ? "style"
    : key === "class"
    ? "class"
    : "attr";

  // Subscribable (push reactive)
  if (value && typeof value.subscribe === "function") {
    let current: any;
    const unsub = value.subscribe((v: any) => {
      current = v;
      descriptorApply(el, key);
    });
    el.setAttribute("_r", "");
    return {
      key,
      kind,
      reactive: "push",
      get: () => current,
      apply(target, v) {
        if (kind === "style") applyStyle(target, v);
        else if (kind === "class") applyClass(target, v);
        else applyGeneric(target, key, v);
      },
      teardown() {
        try {
          if (typeof unsub === "function") (unsub as any)();
          else unsub?.unsubscribe?.();
        } catch {
          /* ignore */
        }
      },
    };
  }

  // Function (pull reactive)
  if (typeof value === "function") {
    el.setAttribute("_r", "");
    return {
      key,
      kind,
      reactive: "pull",
      get: () => value(el),
      apply(target, v) {
        if (kind === "style") applyStyle(target, v);
        else if (kind === "class") applyClass(target, v);
        else applyGeneric(target, key, v);
      },
    };
  }

  // Static
  return {
    key,
    kind,
    raw: value,
    apply(target) {
      if (kind === "style") applyStyle(target, value);
      else if (kind === "class") applyClass(target, value);
      else applyGeneric(target, key, value);
    },
  };
}

function descriptorApply(el: HTMLElement, key: string) {
  const desc = el.__attr_descriptors?.get(key);
  if (!desc) return;
  if (!desc.reactive) {
    desc.apply(el);
    return;
  }
  try {
    const v = desc.get?.();
    desc.apply(el, v);
  } catch (error) {
    if (el.isConnected) bubbleError(error, el, "attr:" + key);
    else queueMicrotask(() => bubbleError(error, el, "attr:" + key));
  }
}

function mountDescriptor(el: HTMLElement, desc: AttrDescriptor) {
  el.__attr_descriptors ??= new Map();
  const existing = el.__attr_descriptors.get(desc.key);
  // Fast static no-op
  if (
    existing &&
    !existing.reactive &&
    !desc.reactive &&
    existing.kind === desc.kind &&
    Object.is(existing.raw, desc.raw)
  ) {
    return;
  }

  if (existing) {
    existing.teardown?.();
  }

  el.__attr_descriptors.set(desc.key, desc);

  if (desc.reactive) {
    el.__reactive_attributes ??= new Map();
    el.__reactive_attributes.set(
      desc.key,
      (node) => descriptorApply(node as HTMLElement, desc.key),
    );
  } else {
    el.__reactive_attributes?.delete(desc.key);
  }

  // Defer guarded evaluation through descriptorApply (ensures bubbling after insertion)
  descriptorApply(el, desc.key);
}

function unmountMissing(el: HTMLElement, nextKeys: Set<string>) {
  if (!el.__attr_descriptors) return;
  for (const [key, desc] of el.__attr_descriptors) {
    if (!nextKeys.has(key)) {
      desc.teardown?.();
      if (desc.kind !== "event") el.removeAttribute(key);
      el.__attr_descriptors.delete(key);
      el.__reactive_attributes?.delete(key);
    }
  }
}

function updateProps(el: HTMLElement, props: Record<string, any> | null) {
  const keys = props ? Object.keys(props) : [];
  const normalized = keys.map((k) => (k === "className" ? "class" : k));
  unmountMissing(el, new Set(normalized));
  for (const rawKey of keys) {
    mountDescriptor(el, createDescriptor(el, rawKey, props![rawKey]));
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

function bubbleError(error: any, target: Node, name?: string) {
  if (
    target.dispatchEvent(
      new ErrorEvent("error", {
        error,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    )
  ) {
    console.error(name || target, error);
  }
}

function buildRender(parent: Anchor, fn: (parent: Anchor) => any) {
  parent.__render = () => {
    (parent as any).__tail = parent;
    try {
      parent.__reactive_children = ([] as any[]).concat(
        diff(parent.__reactive_children, fn(parent), parent),
      );
    } catch (error) {
      bubbleError(error, parent);
    }
  };
}

function diff(valueOld: any, valueNew: any, parent: Node): Node[] {
  if (parent.__render_id === currentUpdateId) {
    return (parent.__reactive_children as Node[]) || [];
  }

  const arrayOld = Array.isArray(valueOld) ? valueOld : [valueOld];
  const arrayNew = Array.isArray(valueNew) ? valueNew : [valueNew];
  const arrayOut = Array(arrayNew.length);

  // Build map of old keyed nodes (elements or component hosts)
  const keyedOld = new Map<any, Node>();
  const consumed = new Set<Node>();
  for (const o of arrayOld) {
    const key = o?.__props?.key ?? o?.__raw_props?.key;
    if (key !== undefined) keyedOld.set(key, o);
  }

  let i = 0;
  for (const itemNew of arrayNew) {
    const ii = i++;
    let itemOld = arrayOld[ii];

    // If new item has a key, prefer matching old keyed node (even if at different index)
    const keyNew = itemNew?.__props?.key ?? itemNew?.__raw_props?.key;
    let consumedByKey = false;
    if (keyNew !== undefined && keyedOld.has(keyNew)) {
      itemOld = keyedOld.get(keyNew)!;
      consumed.add(itemOld);
      consumedByKey = true;
    }
    // If index fallback points at a node already consumed by a different keyed position, treat as missing
    if (!consumedByKey && itemOld && consumed.has(itemOld)) {
      itemOld = undefined as any;
    }

    if (itemOld === undefined) {
      arrayOut[ii] = build(itemNew, parent);
      flushConnectionQueue();
      continue;
    }

    if (Array.isArray(itemOld) && Array.isArray(itemNew)) {
      arrayOut[ii] = diff(itemOld, itemNew, parent);
      continue;
    }

    if (itemOld === itemNew) {
      arrayOut[ii] = itemOld;
      if (
        parent.nodeType === Node.COMMENT_NODE ||
        parent.nodeType === Node.TEXT_NODE
      ) {
        (parent as any).__tail = itemOld;
      }
      continue;
    }

    if (
      itemOld.nodeType === Node.COMMENT_NODE && "__reactive_children" in itemOld
    ) {
      itemOld.__render_id = itemNew.__render_id;
      if (typeof itemNew === "function") {
        buildRender(itemOld, itemNew);
        arrayOut[ii] = itemOld;
        if (
          parent.nodeType === Node.COMMENT_NODE ||
          parent.nodeType === Node.TEXT_NODE
        ) {
          (parent as any).__tail = itemOld;
        }
        continue;
      }

      if (
        itemNew.nodeType === Node.COMMENT_NODE &&
        "__reactive_children" in itemNew
      ) {
        arrayOut[ii] = itemOld;
        if (
          parent.nodeType === Node.COMMENT_NODE ||
          parent.nodeType === Node.TEXT_NODE
        ) {
          (parent as any).__tail = itemOld;
        }
        continue;
      }
    }

    if (itemOld.nodeType === Node.TEXT_NODE) {
      if (typeof itemNew === "string" || typeof itemNew === "number") {
        if (itemOld.nodeValue !== String(itemNew)) {
          itemOld.nodeValue = itemNew;
        }
        arrayOut[ii] = itemOld;
        if (
          parent.nodeType === Node.COMMENT_NODE ||
          parent.nodeType === Node.TEXT_NODE
        ) {
          (parent as any).__tail = itemOld;
        }
        continue;
      }

      if (itemNew?.nodeType === Node.TEXT_NODE) {
        if (itemOld.nodeValue !== itemNew.nodeValue) {
          itemOld.nodeValue = itemNew.nodeValue;
        }
        arrayOut[ii] = itemOld;
        if (
          parent.nodeType === Node.COMMENT_NODE ||
          parent.nodeType === Node.TEXT_NODE
        ) {
          (parent as any).__tail = itemOld;
        }
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
            build(itemNew.__component(), itemNew);
            replace(itemNew, itemOld);
            arrayOut[ii] = itemNew;
            continue;
          }

          itemOld.__props = itemNew.__props;
          itemOld.__component = itemNew.__component;
          arrayOut[ii] = itemOld;

          if (
            parent.nodeType === Node.COMMENT_NODE ||
            parent.nodeType === Node.TEXT_NODE
          ) {
            (parent as any).__tail = itemOld;
          }

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
        if (
          parent.nodeType === Node.COMMENT_NODE ||
          parent.nodeType === Node.TEXT_NODE
        ) {
          (parent as any).__tail = itemOld;
        }
        continue;
      }

      if (itemNew?.nodeType === Node.ELEMENT_NODE) {
        itemOld.__render_id = itemNew.__render_id;
        replace(itemNew, itemOld);
        arrayOut[ii] = itemNew;
        continue;
      }
    }

    if (
      (parent.nodeType === Node.COMMENT_NODE ||
        parent.nodeType === Node.TEXT_NODE) &&
      itemOld?.nodeType
    ) {
      const builtNode = build(itemNew, parent) as Node;
      replace(builtNode, itemOld as Node);
      disconnect(itemOld as Node);
      // Ensure nested component hosts built under a newly inserted element (within a reactive anchor)
      // are flushed synchronously so snapshots see their inner content immediately.
      flushConnectionQueue();
      arrayOut[ii] = builtNode;
      continue;
    }

    arrayOut[ii] = build(itemNew, parent);
    if (itemOld && itemOld !== arrayOut[ii]) {
      // Only disconnect if we truly replaced with a different instance
      disconnect(itemOld);
    }
  }

  // Remove any old nodes not reused (account for nested array fragments)
  const flatten = (arr: any[]): Node[] =>
    arr.flatMap((v) => Array.isArray(v) ? flatten(v) : [v]).filter((n) =>
      n && (n as any).nodeType
    ) as Node[];
  const usedNodes = new Set(flatten(arrayOut));
  for (const old of arrayOld) {
    // Skip array wrappers (their children may be reused individually)
    if (Array.isArray(old)) continue;
    if (!usedNodes.has(old)) {
      disconnect(old);
    }
  }

  // Ensure DOM order matches arrayOut when parent is a normal element node
  if (parent.nodeType === Node.ELEMENT_NODE) {
    const ordered = flatten(arrayOut).filter((n) =>
      n.isConnected && n.parentNode === parent
    );
    let prev: Node | null = null;
    for (const child of ordered) {
      if (prev === null) {
        if (child !== parent.firstChild) {
          parent.insertBefore(child, parent.firstChild);
        }
      } else if (prev.nextSibling !== child) {
        parent.insertBefore(child, prev.nextSibling);
      }
      prev = child;
    }
  } else if (
    parent.nodeType === Node.COMMENT_NODE ||
    parent.nodeType === Node.TEXT_NODE
  ) {
    // Reactive anchor parent: reorder sibling nodes after the anchor
    const container = parent.parentNode;
    if (container) {
      const ordered = flatten(arrayOut).filter((n) =>
        n.isConnected && n.parentNode === container
      );
      let base: Node = parent;
      for (const child of ordered) {
        if (child.parentNode !== container) continue;
        if (base.nextSibling !== child) {
          container.insertBefore(child, base.nextSibling);
        }
        base = child;
      }
    }
  }

  // // Ensure DOM order matches arrayOut
  // const ordered = flatten(arrayOut);
  // if (parent.nodeType === Node.ELEMENT_NODE) {
  //   const fragment = document.createDocumentFragment();
  //   fragment.append(...ordered);
  //   // for (const child of ordered) {
  //   //   // if (child.parentNode === parent) {
  //   //     fragment.append(child);
  //   //   // }
  //   // }
  //   parent.appendChild(fragment);
  // } else if (
  //   parent.nodeType === Node.COMMENT_NODE ||
  //   parent.nodeType === Node.TEXT_NODE
  // ) {
  //   const container = parent.parentNode;
  //   if (container) {
  //     const fragment = document.createDocumentFragment();
  //         fragment.append(...ordered);
  //     container.insertBefore(fragment, parent.nextSibling);
  //   }
  // }

  return arrayOut;
}

function runUpdate(target: Node) {
  if (!sendUpdateEvent(target)) {
    return false;
  }
  if (target.isConnected && target.__render_id !== currentUpdateId) {
    if ("__render" in target) {
      target.__render?.(target);
    } else if ("__reactive_attributes" in target) {
      for (
        const update of target.__reactive_attributes?.values?.() || []
      ) {
        update(target as any);
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

// function updater(target: Node) {
//   if (!runUpdate(target)) return;
//   for (const toUpdate of traverseReactiveChildren([target])) {
//     if (toUpdate !== target) {
//       runUpdate(toUpdate);
//     }
//   }
// }

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

// in performance tests this is slower:
// function traverseReactiveChildren(scopes: Node[]): Node[] {
//   const reactive: Node[] = [];
//   function collectReactive(node: Node) {
//     if (
//       "__reactive_children" in node ||
//       "__reactive_attributes" in node ||
//       "__component" in node
//     ) {
//       reactive.push(node);
//     }
//     for (let i = 0; i < node.childNodes.length; i++) {
//       collectReactive(node.childNodes[i]);
//     }
//   }
//   for (const scope of scopes) {
//     collectReactive(scope);
//   }
//   return reactive;
// }

function traverseReactiveChildren(scopes: Node[]) {
  const reactive: Anchor[] = [];

  for (const scope of scopes) {
    // Include the scope itself if it is reactive (anchor, attributes, or component host)
    if (
      "__reactive_children" in scope || "__reactive_attributes" in scope ||
      "__component" in scope
    ) {
      reactive.push(scope as any);
    }

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
        if (typeof unsub === "function") {
          try {
            (unsub as any)();
          } catch {
            /* ignore cleanup errors */
          }
        } else {
          (unsub as any)?.unsubscribe?.();
        }
      }, { once: true });
      return value;
    };
  }

  if (typeof a === "function") {
    const anchor = document.createComment("$") as any as Anchor;
    // const anchor = document.createComment("$" + i++) as any as Anchor;
    connect(anchor, parent);
    anchor.__render_id = currentUpdateId;
    try {
      const built = build(a(anchor), parent);
      anchor.__reactive_children = Array.isArray(built)
        ? (built as Node[])
        : [built as Node];
    } catch (error) {
      // Bubble errors thrown during initial reactive generator execution
      bubbleError(error, anchor);
      anchor.__reactive_children = [];
    }
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
        bubbleError(error, host, type?.name);
      }
      return `ERROR:${type?.name}`;
    };
    return host;
  }

  if (type === Fragment) {
    return [].concat(children || []) as any;
  }

  return document.createTextNode("<UNHANDLED>");
}

interface Root {
  render(el: Child): Node;
  root: Node | null;
  unmount(): void;
}

export function createRoot(target: HTMLElement): Root {
  const out: Root = {
    render(el: Child): Node {
      try {
        if (out.root) {
          // Attempt component host reconciliation: same type + same key => reuse host
          const oldHost = out.root as any;
          const newHost = el as any;
          if (
            oldHost?.__type &&
            newHost?.__type &&
            oldHost.__type === newHost.__type &&
            oldHost.__props?.key === newHost.__props?.key
          ) {
            oldHost.__props = newHost.__props;
            update(oldHost);
            return (out.root = oldHost);
          }
          // Different component type or key: full remount
          disconnect(out.root);
          out.root = build(el, target) as Node;
          return out.root;
        }
        // First render for this root instance: clear any stray existing nodes
        if (!out.root && target.firstChild) {
          while (target.firstChild) target.removeChild(target.firstChild);
        }
        return (out.root = build(el, target) as Node);
      } finally {
        flushConnectionQueue();
        if (
          !el.__component && !el.__reactive_children &&
          !el.__reactive_children
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

export function memo(fn: (anchor: Node) => any, shouldMemo: () => boolean) {
  let cached: any;
  let initialized = false;
  return (anchor: Node) => {
    // Attach skip predicate for reactive anchors
    anchor.__memo = shouldMemo;
    // Recompute only if not initialized or predicate says "do not memo"
    if (!initialized || !shouldMemo()) {
      cached = fn(anchor);
      initialized = true;
    }
    return cached;
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
