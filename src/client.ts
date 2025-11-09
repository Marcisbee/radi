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

import { setProps } from "./client.props.ts";
import { bubbleError } from "./error.ts";

type Child = any;

let connectQueue = new Set<Function>();
function queueConnection(fn: Function) {
  connectQueue.add(fn);
}
function flushConnectionQueue() {
  // Iteratively flush queued component build/connect tasks.
  // Nested component hosts can enqueue additional tasks while a task runs.
  // Loop until no new tasks are added to ensure full tree construction in a single cycle.
  while (connectQueue.size) {
    // Performance: Swap sets instead of Array.from() + clear() to avoid allocation
    const tasks = connectQueue;
    connectQueue = new Set();
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
    target.__cleanup || target.__component || target.__reactive_children ||
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
  // Don't send connect event for components - they'll be queued during build
  if (!childNew.__component) {
    sendConnectEvent(childNew);
  }
  sendDisconnectEvent(childOld);
  return childNew;
}

function queueDescendantComponents(root: Node) {
  // Only check direct children - they will recursively handle their own children when connected
  if (!root.hasChildNodes || !root.hasChildNodes()) {
    return;
  }

  const children = root.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if ((child as any).__component && (child as any).__instance === undefined) {
      queueConnection(() => {
        if (!child.isConnected || (child as any).__instance !== undefined) {
          return;
        }
        build((child as any).__component!(child), child);
        sendConnectEvent(child);
      });
    }
  }
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
        build(child.__component!(child), child);
        sendConnectEvent(child);
      });
      return child;
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
      build(child.__component!(child), child);
      // Dispatch connect after initial build (single fire)
      sendConnectEvent(child);
    });
    return child;
  }

  // Queue builds for descendant components if child was created with children before being connected
  if (
    !(child as any).__component && child.hasChildNodes && child.hasChildNodes()
  ) {
    queueDescendantComponents(child);
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
      toDisconnect.dispatchEvent(new Event("disconnect"));
      const cleanupArray = (toDisconnect as any).__cleanup;
      if (cleanupArray) {
        for (const cleanup of cleanupArray) {
          cleanup?.();
        }
      }
    },
  );

  const cleanupArray = (child as any).__cleanup;
  if (cleanupArray) {
    for (const cleanup of cleanupArray) {
      cleanup?.();
    }
  }

  if (child.isConnected) {
    (child as any).remove
      ? (child as any).remove()
      : child.parentNode?.removeChild(child);
  }

  return child;
}

declare global {
  interface HTMLElement {
    __reactive_attributes?: Function[];
    __cleanup?: Function[];
  }
}

function buildRender(parent: Anchor, fn: (parent: Anchor) => any) {
  parent.__render = () => {
    (parent as any).__tail = parent;
    try {
      parent.__reactive_children = diff(
        parent.__reactive_children,
        fn(parent),
        parent,
      );
      flushConnectionQueue();
    } catch (error) {
      bubbleError(error, parent);
      parent.__reactive_children = [];
    }
  };
}

function diff(valueOld: any, valueNew: any, parent: Node): Node[] {
  if (parent.__render_id === currentUpdateId) {
    return (parent.__reactive_children as Node[]) || [];
  }

  if (valueNew?.__single_keyed && valueNew.__single_keyed === true) {
    const oldArray = Array.isArray(valueOld) ? valueOld : null;
    const oldKey = oldArray?.__key;
    const newKey = valueNew.key;

    if (oldKey === newKey && oldArray) {
      // Key unchanged: reuse old node without re-rendering
      return oldArray;
    } else {
      // Key changed or new: build fresh
      const newNode = build(valueNew.renderFn(), parent);
      const result = Array.isArray(newNode) ? newNode : [newNode];
      (result as any).__key = newKey;
      (result as any).__node = newNode;

      // Disconnect old node if key changed
      if (oldArray?.__node) {
        disconnect(oldArray.__node);
      } else if (valueOld instanceof Node) {
        // Disconnect old non-keyed element when switching to keyed
        disconnect(valueOld);
      } else if (Array.isArray(valueOld)) {
        // Disconnect old non-keyed array elements
        for (const toDelete of valueOld) {
          if (toDelete instanceof Node) {
            disconnect(toDelete);
          }
        }
      }

      return result;
    }
  }

  if (valueNew?.__keyed && valueNew.__keyed === true) {
    const oldMap = (valueOld as any)?.__key_map || new Map();
    const newMap = new Map();
    const arrayOut: Node[] = [];
    const usedNodes = new Set();
    const arrayOld = Array.isArray(valueOld)
      ? valueOld
      : (valueOld ? [valueOld] : []);

    for (let i = 0; i < valueNew.items.length; i++) {
      const item = valueNew.items[i];
      const oldNode = oldMap.get(item.key);

      if (oldNode) {
        usedNodes.add(oldNode);

        // Check if item is at same position as before
        const oldIndex = arrayOld.indexOf(oldNode);
        const positionChanged = oldIndex !== i;

        if (positionChanged) {
          // Position changed: re-render and reposition
          const newContent = item.renderFn();
          const [reusedNode] = diff([oldNode], [newContent], parent);
          const nodeToUse = reusedNode || oldNode;
          arrayOut.push(nodeToUse);
          newMap.set(item.key, nodeToUse);
        } else {
          // Position unchanged: reuse as-is
          arrayOut.push(oldNode);
          newMap.set(item.key, oldNode);
        }
      } else {
        // New item: build from scratch
        const newNode = build(item.renderFn(), parent) as Node;
        arrayOut.push(newNode);
        newMap.set(item.key, newNode);
      }
    }

    // Reposition DOM nodes to match arrayOut order
    let previousNode: Node | null = null;
    for (const node of arrayOut) {
      const actualNode = Array.isArray(node) ? node[0] : node;
      if (actualNode && actualNode.isConnected) {
        if (previousNode) {
          // Insert after previous node
          if (actualNode.previousSibling !== previousNode) {
            if ((previousNode as any).after) {
              (previousNode as any).after(actualNode);
            } else {
              previousNode.parentNode?.insertBefore(
                actualNode,
                previousNode.nextSibling,
              );
            }
          }
        }
        previousNode = actualNode;
      }
    }

    for (const [_key, node] of oldMap) {
      if (!usedNodes.has(node)) {
        disconnect(node);
      }
    }

    (arrayOut as any).__key_map = newMap;

    // Clean up old nodes that are not in the new array
    for (const toDelete of arrayOld) {
      if (toDelete instanceof Node && arrayOut.indexOf(toDelete) === -1) {
        disconnect(toDelete);
      }
    }

    flushConnectionQueue();
    return arrayOut;
  }

  // Handle cleanup when switching from keyed to non-keyed
  if ((valueOld as any)?.__key_map) {
    const oldMap = (valueOld as any).__key_map;
    for (const [_key, node] of oldMap) {
      disconnect(node);
    }
  }

  const arrayOld = Array.isArray(valueOld) ? valueOld : [valueOld];
  const arrayNew = Array.isArray(valueNew) ? valueNew : [valueNew];
  const arrayOut = Array(arrayNew.length);
  const disconnected = new Set();

  let i = 0;
  for (const itemNew of arrayNew) {
    const ii = i++;
    const itemOld = arrayOld[ii];

    if (itemOld === undefined) {
      arrayOut[ii] = build(itemNew, parent);
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
          if (itemOld.__type !== itemNew.__type) {
            replace(itemNew, itemOld);
            disconnected.add(itemOld);
            build(itemNew.__component(itemNew), itemNew);
            queueConnection(() => {
              if (!itemNew.isConnected) {
                return;
              }
              sendConnectEvent(itemNew);
            });
            arrayOut[ii] = itemNew;
            continue;
          }

          itemOld.__key = itemNew.__key;
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

        setProps(itemOld, itemNew.__attrs || {});

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
        disconnected.add(itemOld);
        arrayOut[ii] = itemNew;
        continue;
      }
    }

    if (
      (parent.nodeType === Node.COMMENT_NODE ||
        parent.nodeType === Node.TEXT_NODE) &&
      itemOld?.nodeType
    ) {
      if (!itemOld.isConnected) {
        arrayOut[ii] = itemOld;
        continue;
      }
      const builtNode = build(itemNew, parent) as Node;
      arrayOut[ii] = replace(builtNode, itemOld as Node);
      disconnected.add(itemOld);
      // flush batched after main diff loop
      // flushConnectionQueue();
      // Ensure nested component hosts built under a newly inserted element (within a reactive anchor)
      // are flushed synchronously so snapshots see their inner content immediately.
      // arrayOut[ii] = builtNode;
      continue;
    }

    arrayOut[ii] = build(itemNew, parent);
    if (itemOld && itemOld !== arrayOut[ii]) {
      // Only disconnect if we truly replaced with a different instance
      disconnect(itemOld);
      disconnected.add(itemOld);
    }
  }

  for (const toDelete of arrayOld) {
    if (
      toDelete instanceof Node && arrayOut.indexOf(toDelete) === -1 &&
      !disconnected.has(toDelete)
    ) {
      disconnect(toDelete);
    }
  }

  flushConnectionQueue();

  return arrayOut;
}

function runUpdate(target: Node) {
  if (!sendUpdateEvent(target)) {
    return false;
  }
  if (target.isConnected && target.__render_id !== currentUpdateId) {
    if ("__render" in target) {
      target.__render?.(target);
      // } else if ("__reactive_attributes" in target && target.__reactive_attributes?.length) {
      //   // for (
      //   //   const update of target.__reactive_attributes?.values?.() || []
      //   // ) {
      //   target.dispatchEvent(new Event("update"));
      //   // sendUpdateEvent();
      //     // update(target as any);
      //   // }
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
    // connectQueue.clear();
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
      "__reactive_children" in scope || "__cleanup" in scope ||
      "__reactive_attributes" in scope ||
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
        "__reactive_children" in node || "__cleanup" in scope ||
        "__reactive_attributes" in node ||
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

function build(a: any, parent: Node): BuiltNode {
  if (Array.isArray(a)) {
    return a.map((child) => build(child, parent));
  }

  if (a?.__single_keyed) {
    const node = build(a.renderFn(), parent);
    const result = Array.isArray(node) ? node : [node];
    (result as any).__key = a.key;
    (result as any).__node = node;
    return result;
  }

  if (a?.__keyed) {
    const keyMap = new Map();
    const nodes = a.items.map((item: KeyedItem) => {
      const node = build(item.renderFn(), parent);
      keyMap.set(item.key, node);
      return node;
    });
    // Store key map on the returned nodes array so it can be retrieved during diff
    (nodes as any).__key_map = keyMap;
    return nodes;
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

  // Handle Promise values (async components)
  if (a instanceof Promise) {
    // Create a temporary anchor for the async component
    const anchor = document.createComment("$async") as any as Anchor;
    connect(anchor, parent);
    anchor.__render_id = currentUpdateId;

    // Suspend immediately while waiting for the Promise to resolve
    suspend(anchor);

    // Handle Promise resolution
    a.then((resolvedValue) => {
      if (anchor.isConnected) {
        try {
          // Build the resolved value
          const built = build(resolvedValue, parent);
          anchor.__reactive_children = Array.isArray(built)
            ? (built as Node[])
            : [built as Node];
          // Unsuspend and trigger update
          unsuspend(anchor);
          update(anchor);
        } catch (error) {
          bubbleError(error, anchor);
          anchor.__reactive_children = [];
        }
      }
    }).catch((error) => {
      if (anchor.isConnected) {
        // Handle Promise rejection
        bubbleError(error, anchor);
        anchor.__reactive_children = [];
        // Still need to unsuspend to avoid hanging the Suspense boundary
        unsuspend(anchor);
        update(anchor);
      }
    });

    buildRender(anchor, () => anchor.__reactive_children || []);
    return anchor;
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
    if (props) {
      setProps(element, props);
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
        if (!anchor.__instance || props?.key !== anchor.__props?.key) {
          return (anchor.__instance = type.call(
            anchor,
            () => (anchor.__props),
          ));
        }
        return anchor.__instance;
      } catch (error) {
        bubbleError(error, anchor, type?.name);
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

type KeyedItem = { renderFn: () => any; key: any };

export function createList(
  fn: (key: (renderFn: () => any, keyValue: any) => any) => any[],
) {
  const items: Array<{ renderFn: () => any; key: any }> = [];
  const keyFn = (renderFn: () => any, keyValue: any): any => {
    items.push({ renderFn, key: keyValue });
    return null; // Return value not used
  };
  fn(keyFn);
  return { __keyed: true, items };
}

/**
 * Creates a keyed element or component that only re-renders when the key changes.
 * The component instance and its internal state are preserved as long as the key remains the same.
 *
 * @param renderFn - Function that returns the element/component to render
 * @param keyValue - Unique key to identify this element/component
 * @returns A marker object for the keyed element
 *
 * @example
 * ```tsx
 * function Counter() {
 *   let count = 0;
 *   return () => <div>Count: {count++}</div>;
 * }
 *
 * function App() {
 *   let activeTab = "home";
 *
 *   return (
 *     <div>
 *       {() => createKey(() => <Counter />, activeTab)}
 *     </div>
 *   );
 * }
 * // When activeTab changes, Counter remounts (count resets to 0)
 * // When activeTab stays the same, Counter instance is preserved (count increments)
 * ```
 */
export function createKey(renderFn: () => any, keyValue: any) {
  return { __single_keyed: true, renderFn, key: keyValue };
}

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

/**
 * Dispatch a fresh "suspend" event from a descendant node.
 * Returns true if not prevented.
 */
export function suspend(target: Node): boolean {
  return target.dispatchEvent(
    new Event("suspend", {
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  );
}

/**
 * Dispatch a fresh "unsuspend" event from a descendant node.
 * Returns true if not prevented.
 */
export function unsuspend(target: Node): boolean {
  return target.dispatchEvent(
    new Event("unsuspend", {
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  );
}

/**
 * Suspense component
 * Shows fallback while one or more descendants are suspended.
 * Child components that perform async work should call suspend(node) before starting
 * and unsuspend(node) when resolved. Multiple overlapping suspensions are reference-counted.
 *
 * This implementation relies on the updated component build queue:
 * - Suspense host builds first, installs listeners.
 * - Descendant component builds that trigger suspend will bubble upward correctly.
 */
export function Suspense(
  this: HTMLElement,
  props: JSX.PropsWithChildren<{ fallback: () => JSX.Element }>,
) {
  const signal = createAbortSignal(this);
  // Track number of active suspensions.
  let pending = 0;
  // Start by assuming children should render; suspend events may arrive during child build.
  let showChildren = true;

  const onSuspend = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending === 0 && showChildren) {
      showChildren = false;
      update(this);
    }
    pending++;
  };

  const onUnsuspend = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending > 0) pending--;
    if (pending === 0 && !showChildren) {
      showChildren = true;
      update(this);
    }
  };

  this.addEventListener("suspend", onSuspend, { signal });
  this.addEventListener("unsuspend", onUnsuspend, { signal });

  const template = createElement("suspense", {
    style: ({ display: () => (showChildren ? "contents" : "none") }),
  }, () => props().children);

  return [
    template,
    () => showChildren ? null : props().fallback(),
  ];
}
