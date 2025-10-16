/** A reactive function returns new child(ren) when invoked with the parent element. */
type ReactiveGenerator = (parent: Element) => Child | Child[];

/** Primitive or structured child value accepted by createElement/buildElement. */
type Child = string | number | boolean | null | undefined | Node | Child[] | ReactiveGenerator;

/** Internal extended element with optional component marker. */
type ComponentElement = HTMLElement & { __component?: Function; [key: string]: unknown };

/* ========================= Fragment Boundary ========================= */

const FRAGMENT_START_TEMPLATE = document.createComment('(');
const FRAGMENT_END_TEMPLATE = document.createComment(')');

/**
 * Create a fresh pair of fragment boundary comments.
 */
function createFragmentBoundary(): { start: Comment; end: Comment } {
  return {
    start: FRAGMENT_START_TEMPLATE.cloneNode() as Comment,
    end: FRAGMENT_END_TEMPLATE.cloneNode() as Comment,
  };
}

/* ========================= Node Normalization ========================= */

/**
 * Recursively flatten arbitrary child shapes (including arrays / nested arrays / fragment arrays)
 * into a flat array of DOM Nodes. Reactive functions are left as-is for higher level handling.
 */
function normalizeToNodes(raw: Child | Child[]): (Node | ReactiveGenerator)[] {
  const out: (Node | ReactiveGenerator)[] = [];
  const stack: any[] = Array.isArray(raw) ? [...raw] : [raw];
  while (stack.length) {
    const item = stack.shift();
    if (item == null) {
      out.push(document.createComment('null'));
      continue;
    }
    if (Array.isArray(item)) {
      stack.unshift(...item);
      continue;
    }
    if (typeof item === 'string' || typeof item === 'number') {
      out.push(document.createTextNode(String(item)));
      continue;
    }
    if (typeof item === 'boolean') {
      out.push(document.createComment(item ? 'true' : 'false'));
      continue;
    }
    if (typeof item === 'function') {
      // This is a reactive generator awaiting mounting context
      out.push(item as ReactiveGenerator);
      continue;
    }
    // Already a Node
    if (item instanceof Node) {
      out.push(item);
    }
  }
  return out;
}

/* ========================= buildElement ========================= */

/**
 * Convert a JSX child value to either:
 * - Node(s) (with fragment boundaries if it was an array)
 * - A reactive generator function (if original child was function)
 * - Comments for booleans/null
 */
function buildElement(child: Child): Child {
  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(String(child));
  }

  if (typeof child === 'boolean') {
    return document.createComment(child ? 'true' : 'false');
  }

  if (typeof child === 'function') {
    return (parent: Element) => {
      const produced = (child as ReactiveGenerator)(parent);
      return normalizeToNodes(([] as Child[]).concat(produced as any).map(buildElement) as any);
    };
  }

  if (Array.isArray(child)) {
    const { start, end } = createFragmentBoundary();
    const built = child
      .map(buildElement)
      .flat(Number.POSITIVE_INFINITY as 1)
      .filter(Boolean) as Child[];
    const nodes = normalizeToNodes(built as any).filter(Boolean) as (Node | ReactiveGenerator)[];
    return [start, ...nodes, end];
  }

  if (child == null) {
    return document.createComment('null');
  }

  return child;
}

/* ========================= Style & Prop Utilities ========================= */

/**
 * Apply a style object to an element.
 */
function applyStyleObject(el: HTMLElement, styleObj: Record<string, string | number>): void {
  for (const k in styleObj) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el.style as any)[k] = styleObj[k];
  }
}

/**
 * Set a property or attribute on an element.
 */
function setPropValue(el: HTMLElement, key: string, value: unknown): void {
  if (key === 'style' && value && typeof value === 'object') {
    applyStyleObject(el, value as Record<string, string | number>);
  } else if (key in el) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any)[key] = value;
  } else {
    el.setAttribute(key, String(value));
  }
}

/* ========================= Reconciliation Core ========================= */

/**
 * Patch text nodes in-place if both are text and changed.
 * @returns true if handled (and no further action needed).
 */
function patchText(a: Node, b: Node): boolean {
  if (a.nodeType === Node.TEXT_NODE && b.nodeType === Node.TEXT_NODE) {
    if ((a as Text).textContent !== (b as Text).textContent) {
      (a as Text).textContent = (b as Text).textContent;
    }
    return true;
  }
  return false;
}

/**
 * Attempt to patch two element nodes in place; returns false if they must be replaced.
 */
function patchElement(
  oldEl: Element,
  newEl: Element,
  reconcileChildrenFn: (parent: Element, newKids: Node[]) => void,
): boolean {
  if (oldEl.nodeName !== newEl.nodeName) return false;

  const oAny = oldEl as ComponentElement;
  const nAny = newEl as ComponentElement;

  // Component placeholder update (do NOT re-run component function)
  if (
    oAny.__component &&
    (nAny as any).__componentPending &&
    oAny.__component === (nAny as any).__componentPending.type
  ) {
    if ((oAny as any).__propsRef) {
      (oAny as any).__propsRef.current = (nAny as any).__componentPending.props;
      // Prevent microtask placeholder from mounting component again
      delete (nAny as any).__componentPending;
      // Trigger reactive re-evaluation in subtree
      dispatchEventSink(
        oAny,
        new Event('update', { bubbles: false, cancelable: true, composed: true }),
      );
    }
    return true;
  }

  // Component identity guard (different component types -> replace)
  if (oAny.__component && nAny.__component && oAny.__component !== nAny.__component) {
    return false;
  }

  // Attributes
  const nextAttrs = Array.from(newEl.attributes);
  for (const attr of nextAttrs) {
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  }
  const prevAttrs = Array.from(oldEl.attributes);
  for (const attr of prevAttrs) {
    if (!newEl.hasAttribute(attr.name)) {
      oldEl.removeAttribute(attr.name);
    }
  }

  // Styles
  // if ((oldEl as HTMLElement).style.cssText !== (newEl as HTMLElement).style.cssText)
  (oldEl as HTMLElement).style.cssText = (newEl as HTMLElement).style.cssText;

  // Common mutable props (inputs, etc.)
  // for (const key of PROPS_TO_COPY) {
  //   if (key in newEl) {
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     (oldEl as any)[key] = (newEl as any)[key];
  //   }
  // }

  // Children
  reconcileChildrenFn(oldEl, Array.from(newEl.childNodes));
  return true;
}

/**
 * Generic node list diff. Can target a full parent or a sub-range (when 'before' is provided).
 */
function reconcileNodeLists(
  parent: Element,
  oldNodes: Node[],
  newNodes: Node[],
  before?: Node | null,
): void {
  const max = Math.max(oldNodes.length, newNodes.length);
  for (let i = 0; i < max; i++) {
    const a = oldNodes[i];
    const b = newNodes[i];

    if (!a && b) {
      parent.insertBefore(b, before || null);
      continue;
    }
    if (a && !b) {
      parent.removeChild(a);
      continue;
    }
    if (!a || !b) continue;
    if (a === b) continue;

    if (patchText(a, b)) continue;

    if (a.nodeType === Node.ELEMENT_NODE && b.nodeType === Node.ELEMENT_NODE) {
      if (
        patchElement(a as Element, b as Element, (p, kids) =>
          reconcileNodeLists(p, Array.from(p.childNodes), kids),
        )
      ) {
        continue;
      }
    }

    parent.replaceChild(b, a);
  }
}

/**
 * Reconcile nodes inside a fragment boundary (exclusive of the boundary comments).
 */
function reconcileRange(start: Comment, end: Comment, newNodes: Node[]): void {
  const parent = start.parentNode;
  if (!parent || end.parentNode !== parent) return;
  const oldNodes: Node[] = [];
  let cur = start.nextSibling;
  while (cur && cur !== end) {
    oldNodes.push(cur);
    cur = cur.nextSibling;
  }
  reconcileNodeLists(parent as Element, oldNodes, newNodes, end);
}

/* ========================= Reactive Rendering ========================= */

/**
 * Mount a reactive generator into a container using a fresh fragment boundary.
 */
function setupReactiveRender(container: Element, fn: ReactiveGenerator): void {
  const { start, end } = createFragmentBoundary();
  container.append(start, end);

  const render = () => {
    const produced = fn(container);
    const flat = normalizeToNodes(produced).filter((n): n is Node => n instanceof Node);
    reconcileRange(start, end, flat);
  };

  container.addEventListener('update', render);
  render();
}

/**
 * Helper to mount a Node or reactive generator as a child of an element.
 */
function mountChild(parent: Element, nodeOrFn: Node | ReactiveGenerator): void {
  if (typeof nodeOrFn === 'function') {
    setupReactiveRender(parent, nodeOrFn as ReactiveGenerator);
  } else {
    parent.appendChild(nodeOrFn);
  }
}

/* ========================= Radi Core ========================= */

export const Radi = {
  Fragment: 'fragment',

  /**
   * Lightweight JSX factory.
   * - Supports functional components.
   * - Supports fragments (Radi.Fragment).
   * - Handles reactive child functions.
   */
  createElement(
    type: string | Function,
    props: Record<string, unknown> | null,
    ...childrenRaw: Child[]
  ): Node | Node[] {
    const builtChildren = childrenRaw.map(buildElement);
    const normalizedChildren = normalizeToNodes(builtChildren as any);

    // JSX Fragment
    if (type === 'fragment') {
      const { start, end } = createFragmentBoundary();
      const fragmentNodes: Node[] = [];
      for (const c of normalizedChildren) {
        if (typeof c === 'function') {
          // Defer mounting; reactive inside fragment wrapper
          const placeholder = document.createComment('deferred-reactive');
          fragmentNodes.push(placeholder);
          // After return, user code won't have appended yet. So we schedule microtask to mount.
          queueMicrotask(() => {
            const parent = placeholder.parentNode as Element | null;
            if (parent) {
              setupReactiveRender(parent, c as ReactiveGenerator);
              parent.removeChild(placeholder);
            }
          });
        } else {
          fragmentNodes.push(c);
        }
      }
      return [start, ...fragmentNodes, end];
    }

    // Functional Component (single execution with props getter; subsequent renders supply placeholder)
    if (typeof type === 'function') {
      const placeholder = document.createElement(
        'cmp-' + (type.name || 'component'),
      ) as ComponentElement & {
        __componentPending?: { type: Function; props: any };
      };
      placeholder.style.display = 'contents';
      (placeholder as any).__componentPending = {
        type,
        props: { ...(props || {}), children: builtChildren },
      };

      // Mount once in a microtask (after insertion so parent reconciliation completes)
      queueMicrotask(() => {
        const pending = (placeholder as any).__componentPending;
        if (!pending) return; // already mounted or discarded
        // Proceed with mounting even if not yet connected (supports nested component placeholders)
        // Prevent double mount
        if ((placeholder as any).__mounted) return;

        const propsRef = { current: pending.props };
        const propsGetter = () => propsRef.current;

        // Mark as mounted component
        placeholder.__component = pending.type;
        (placeholder as any).__propsRef = propsRef;
        (placeholder as any).__mounted = true;
        delete (placeholder as any).__componentPending;

        // Execute component body ONCE
        const output = buildElement(pending.type.call(placeholder, propsGetter));

        // Normalize and mount output
        if (Array.isArray(output)) {
          const nodes = normalizeToNodes(output as any);
          for (const n of nodes) mountChild(placeholder, n as any);
        } else if (typeof output === 'function') {
          setupReactiveRender(placeholder, output as ReactiveGenerator);
        } else if (output instanceof Node) {
          placeholder.appendChild(output);
        } else {
          placeholder.appendChild(document.createTextNode(String(output)));
        }
      });

      return placeholder;
    }

    // Native Element
    const element = document.createElement(type) as ComponentElement;

    if (props) {
      for (const key in props) {
        const value = props[key];
        if (key.startsWith('on') && typeof value === 'function') {
          element.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
        } else if (typeof value === 'function') {
          // Reactive prop function
          const evaluate = () => {
            const v = (value as (el: Element) => unknown)(element);
            setPropValue(element, key, v);
          };
          element.addEventListener('update', evaluate);
          evaluate();
        } else {
          setPropValue(element, key, value);
        }
      }
    }

    for (const c of normalizedChildren) {
      mountChild(element, c as any);
    }

    return element;
  },

  /**
   * Render a root node (or array / fragment) into a container, clearing previous content.
   */
  render(node: Node | Node[] | (Node | Node[])[], container: HTMLElement): void {
    container.innerHTML = '';
    const flat = normalizeToNodes(node as any).filter((n): n is Node => n instanceof Node);
    for (const n of flat) {
      container.appendChild(n);
    }
  },
};

/* ========================= Update & Lifecycle Events ========================= */

export const updateEvent = new Event('update', {
  bubbles: false,
  cancelable: true,
  composed: true,
});

/**
 * Dispatch an update event to an element subtree (reactive props & functions re-evaluate).
 */
export function update(root: Node): void {
  dispatchEventSink(root, updateEvent);
}

/**
 * Walk an element subtree (snapshot first) and dispatch an event to each element node.
 */
export function dispatchEventSink(el: Node, event: Event): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
  const list: Element[] = [];
  let current: Node | null = walker.currentNode;
  if (current?.nodeType === Node.ELEMENT_NODE) list.push(current as Element);
  while ((current = walker.nextNode())) {
    if (current.nodeType === Node.ELEMENT_NODE) list.push(current as Element);
  }
  for (const n of list) {
    n.dispatchEvent(event);
  }
}

/**
 * Create an AbortSignal bound to element disconnect.
 */
export function createAbortSignal(target: Element): AbortSignal {
  const controller = new AbortController();
  target.addEventListener('disconnect', () => controller.abort());
  return controller.signal;
}

/* ========================= Connection Events ========================= */

export const connectedEvent = new Event('connect', {
  bubbles: false,
  cancelable: true,
  composed: true,
});
export const disconnectedEvent = new Event('disconnect', {
  bubbles: false,
  cancelable: true,
  composed: true,
});

/**
 * Global mutation observer to emit connect / disconnect events.
 */
const connectionObserverRoot = document.documentElement || document;

const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const added of Array.from(m.addedNodes)) {
      if (added.nodeType === Node.ELEMENT_NODE) {
        const el = added as Element;
        if ((el as any).isConnected) {
          dispatchEventSink(el, connectedEvent);
        }
      }
    }
    for (const removed of Array.from(m.removedNodes)) {
      if (removed.nodeType === Node.ELEMENT_NODE) {
        dispatchEventSink(removed as Element, disconnectedEvent);
      }
    }
  }
});

observer.observe(connectionObserverRoot, { childList: true, subtree: true });
