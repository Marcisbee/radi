/**
 * Universal renderer abstraction for Radi.
 *
 * Goal:
 * - Allow creating alternative platform renderers (DOM, server string, custom targets).
 * - Mirror the idea of Solid's `createRenderer` but fitted to Radi's simplified
 *   child + reactive generator model.
 *
 * This module does NOT implement full reactivity for non-DOM targets. Server
 * rendering performs a one-time render; reactive children/functions are invoked
 * immediately and flattened.
 *
 * To use:
 *   import { createRenderer } from 'radi/src/renderer.ts';
 *   const {
 *     render,
 *     createElement,
 *     createTextNode,
 *     createComment,
 *     toString // (if serialize capable)
 *   } = createRenderer(domAdapter);
 *
 * For server:
 *   const {
 *     createElement,
 *     renderToString
 *   } = createRenderer(serverStringAdapter);
 *
 * NOTE: This abstraction is intentionally minimal to keep core size small.
 */

import type { Child, ReactiveGenerator, Subscribable } from "./types.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface UniversalNode {
  // Platform-specific node reference (DOM Node, virtual node struct, etc.)
  // Kept as unknown for maximal flexibility.
  readonly node: unknown;
  // Children (for non-DOM adapters that need manual tracking)
  children?: UniversalNode[];
  // Text content storage (server / virtual nodes)
  text?: string;
  comment?: string;
  tag?: string;
  props?: Record<string, unknown>;
  // Internal key (for keyed diffing if implemented later)
  key?: string | null;
}

export interface RendererAdapter {
  // Node creation
  createElement(tag: string): UniversalNode;
  createTextNode(text: string): UniversalNode;
  createComment(text: string): UniversalNode;

  // Property/attribute setting
  setProperty(node: UniversalNode, name: string, value: unknown): void;

  // Tree mutation
  insertNode(
    parent: UniversalNode,
    node: UniversalNode,
    anchor?: UniversalNode | null,
  ): void;
  removeNode(parent: UniversalNode, node: UniversalNode): void;

  // Navigation helpers (used for serialization or future diffing)
  getParentNode(node: UniversalNode): UniversalNode | null;
  getFirstChild(node: UniversalNode): UniversalNode | null;
  getNextSibling(node: UniversalNode): UniversalNode | null;

  // Type helpers
  isTextNode(node: UniversalNode): boolean;
  isCommentNode?(node: UniversalNode): boolean;

  // Optional serialization for server implementations
  serialize?(root: UniversalNode): string;
}

export interface Renderer {
  createElement(
    type: string | ComponentType,
    props: Record<string, unknown> | null,
    ...children: Child[]
  ): UniversalNode;
  createTextNode(text: string): UniversalNode;
  createComment(text: string): UniversalNode;
  render(root: UniversalNode, child: Child): UniversalNode;
  renderToString?(child: Child): string;
  fragment(children: Child[]): UniversalNode;
}

export type ComponentType = (
  props: () => Record<string, unknown>,
) => Child | Child[];

/* -------------------------------------------------------------------------- */
/* Utility Normalization                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Normalize raw child input into an array of concrete values (Nodes, strings, numbers, booleans,
 * functions, subscribables). Server rendering ignores subscribable reactivity (one-shot).
 */
function toChildArray(child: Child | Child[]): Child[] {
  return Array.isArray(child) ? child : [child];
}

function isSubscribableValue(value: unknown): value is Subscribable<unknown> {
  return !!value && typeof value === "object" &&
    typeof (value as { subscribe?: unknown }).subscribe === "function";
}

function _isReactiveFn(value: unknown): value is ReactiveGenerator {
  return typeof value === "function";
}

/* -------------------------------------------------------------------------- */
/* Expansion                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Expand a Child (which may contain reactive functions, arrays, primitives) into concrete primitive
 * values or platform nodes. Reactive generators are invoked immediately (non-streaming SSR).
 */
function expandChild(
  value: Child | Child[],
  _adapter: RendererAdapter,
  invokeReactive: (fn: ReactiveGenerator) => Child | Child[],
): Child[] {
  const queue = toChildArray(value);
  const out: Child[] = [];
  while (queue.length) {
    const item = queue.shift();
    if (item == null) {
      out.push(null);
      continue;
    }
    if (Array.isArray(item)) {
      queue.unshift(...item);
      continue;
    }
    if (typeof item === "function") {
      const produced = invokeReactive(item as ReactiveGenerator);
      queue.unshift(...toChildArray(produced));
      continue;
    }
    out.push(item);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Node Construction Helpers                                                   */
/* -------------------------------------------------------------------------- */

/** Build a platform node from a single primitive child (string/number/boolean/null). */
function buildPrimitiveNode(
  value: unknown,
  adapter: RendererAdapter,
): UniversalNode {
  if (value == null) return adapter.createComment("null");
  switch (typeof value) {
    case "string":
    case "number":
      return adapter.createTextNode(String(value));
    case "boolean":
      return adapter.createComment(value ? "true" : "false");
    default:
      return adapter.createComment("unsupported");
  }
}

/* -------------------------------------------------------------------------- */
/* createRenderer Implementation                                               */
/* -------------------------------------------------------------------------- */

export function createRenderer(adapter: RendererAdapter): Renderer {
  /**
   * Internal reactive invocation strategy: for universal/server we just run once.
   */
  const runReactive = (fn: ReactiveGenerator): Child | Child[] => {
    // Universal/server: invoke once; no retained reactive root element required.
    try {
      return fn(undefined as unknown as Element);
    } catch {
      return []; // swallow errors; represent as empty output
    }
  };
  function isUniversalNode(val: unknown): val is UniversalNode {
    return !!val && typeof val === "object" &&
      "node" in (val as Record<string, unknown>);
  }

  /**
   * Materialize a set of children under a parent node.
   */
  function insertChildren(parent: UniversalNode, rawChildren: Child[]): void {
    const expanded = expandChild(rawChildren, adapter, runReactive);
    for (const child of expanded) {
      if (child instanceof Node) {
        // Skip raw DOM Node objects in universal/server adapter paths.
        continue;
      }
      if (isSubscribableValue(child)) {
        // Server/universal initial snapshot: subscribe immediately then ignore future updates.
        try {
          let initialSeen = false;
          child.subscribe((val) => {
            if (initialSeen) return;
            initialSeen = true;
            const prim = buildPrimitiveNode(val, adapter);
            adapter.insertNode(parent, prim);
          });
        } catch {
          adapter.insertNode(parent, adapter.createComment("sub-error"));
        }
        continue;
      }
      if (isUniversalNode(child)) {
        adapter.insertNode(parent, child);
        continue;
      }
      const node = buildPrimitiveNode(child, adapter);
      adapter.insertNode(parent, node);
    }
  }

  /**
   * Fragment creation using comment boundary markers (or adapter-equivalent).
   */
  function fragment(children: Child[]): UniversalNode {
    // Simplified fragment representation as a lightweight element wrapper
    const frag = adapter.createElement("radi-fragment");
    insertChildren(frag, children);
    return frag;
  }

  /**
   * Create a universal element or component instance.
   */
  function createElement(
    type: string | ComponentType,
    props: Record<string, unknown> | null,
    ...children: Child[]
  ): UniversalNode {
    if (typeof type === "function") {
      // Fragment sentinel: if the caller passes the internal fragment helper directly
      // (e.g. h(Fragment, null, ...children)), treat it as a fragment with provided children.
      if ((type as unknown) === fragment) {
        return fragment(children);
      }
      const propsObj = { ...(props || {}) };
      const propsGetter = () => propsObj as Record<string, unknown>;
      let produced: Child | Child[] = [];
      try {
        produced = type(propsGetter);
      } catch {
        produced = ["component-error"];
      }
      const componentWrapper = adapter.createElement("radi-host");
      adapter.setProperty(componentWrapper, "style", "display: contents;");
      insertChildren(
        componentWrapper,
        expandChild(produced, adapter, runReactive),
      );
      return componentWrapper;
    }

    const el = adapter.createElement(type);
    if (props) {
      for (const k in props) {
        const v = props[k];
        try {
          adapter.setProperty(el, k, v);
        } catch {
          /* ignore prop set failures */
        }
      }
    }
    insertChildren(el, children);
    return el;
  }

  /**
   * Render a child into a root container (mutative). For server virtual adapters,
   * root is a synthetic UniversalNode root.
   */
  function render(root: UniversalNode, child: Child): UniversalNode {
    const arr = expandChild(child, adapter, runReactive);
    insertChildren(root, arr);
    return root;
  }

  /**
   * Server-side string rendering if adapter provides serialize().
   * Builds a temporary root, inserts content, then serializes.
   */
  function renderToString(child: Child): string {
    if (typeof adapter.serialize !== "function") {
      throw new Error("Adapter does not support serialization");
    }
    // const root = adapter.createElement("radi-root-ssr");
    // render(root, child);
    return adapter.serialize(child);
  }

  return {
    createElement,
    createTextNode: adapter.createTextNode,
    createComment: adapter.createComment,
    render,
    fragment,
    renderToString: adapter.serialize ? renderToString : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Minimal DOM Adapter (example)                                              */
/* -------------------------------------------------------------------------- */

/**
 * A lightweight DOM adapter example for browsers.
 * This is intentionally minimal; real client integration likely uses existing main.ts APIs.
 */
export function createDomAdapter(doc: Document = document): RendererAdapter {
  type DomWrap = UniversalNode;

  function wrap(node: Node, extra?: Partial<UniversalNode>): DomWrap {
    return { node, ...extra };
  }

  return {
    createElement(tag: string): DomWrap {
      return wrap(doc.createElement(tag), { tag });
    },
    createTextNode(text: string): DomWrap {
      return wrap(doc.createTextNode(text), { text });
    },
    createComment(text: string): DomWrap {
      return wrap(doc.createComment(text), { comment: text });
    },
    setProperty(node: DomWrap, name: string, value: unknown): void {
      const n = node.node as any;
      if (name === "style" && value && typeof value === "object") {
        Object.assign(n.style, value as Record<string, unknown>);
        return;
      }
      if (name.startsWith("on") && typeof value === "function") {
        const evt = name.slice(2).toLowerCase();
        n.addEventListener(evt, value);
        return;
      }
      if (name in n) {
        n[name] = value;
      } else {
        n.setAttribute?.(name, String(value));
      }
    },
    insertNode(parent: DomWrap, node: DomWrap, anchor?: DomWrap | null): void {
      const p = parent.node as Node & ParentNode;
      const child = node.node as Node;
      if (anchor?.node instanceof Node) {
        p.insertBefore(child, anchor.node);
      } else {
        p.appendChild(child);
      }
    },
    removeNode(parent: DomWrap, node: DomWrap): void {
      const p = parent.node as Node & ParentNode;
      const c = node.node as Node;
      if (c.parentNode === p) p.removeChild(c);
    },
    getParentNode(node: DomWrap): DomWrap | null {
      const p = (node.node as Node).parentNode;
      return p ? wrap(p) : null;
    },
    getFirstChild(node: DomWrap): DomWrap | null {
      const c = (node.node as Node).firstChild;
      return c ? wrap(c) : null;
    },
    getNextSibling(node: DomWrap): DomWrap | null {
      const n = (node.node as Node).nextSibling;
      return n ? wrap(n) : null;
    },
    isTextNode(node: DomWrap): boolean {
      return (node.node as Node).nodeType === Node.TEXT_NODE;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Minimal Server String Adapter (example)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Very small server adapter that builds a tree of virtual nodes and serializes to HTML.
 * This does not escape attributes rigorously (caller should ensure safe values).
 */
export function createServerStringAdapter(): RendererAdapter {
  interface VNode {
    type: "element" | "text" | "comment" | "root";
    tag?: string;
    text?: string;
    comment?: string;
    props?: Record<string, unknown>;
    children: VNode[];
    parent?: VNode | null;
  }

  function make(type: VNode["type"], init: Partial<VNode> = {}): UniversalNode {
    const vnode: VNode = { type, children: [], parent: null, ...init };
    return {
      node: vnode,
      tag: vnode.tag,
      text: vnode.text,
      comment: vnode.comment,
      props: vnode.props,
      children: [] as UniversalNode[],
    };
  }

  function unwrap(u: UniversalNode): VNode {
    return u.node as VNode;
  }

  const adapter: RendererAdapter = {
    createElement(tag: string): UniversalNode {
      return make("element", { tag, props: {} });
    },
    createTextNode(text: string): UniversalNode {
      return make("text", { text });
    },
    createComment(text: string): UniversalNode {
      return make("comment", { comment: text });
    },
    setProperty(node: UniversalNode, name: string, value: unknown): void {
      const v = unwrap(node);
      if (!v.props) v.props = {};
      v.props[name] = value;
    },
    insertNode(
      parent: UniversalNode,
      node: UniversalNode,
      anchor?: UniversalNode | null,
    ): void {
      const p = unwrap(parent);
      const c = unwrap(node);
      c.parent = p;
      if (!anchor) {
        p.children.push(c);
      } else {
        const a = unwrap(anchor);
        const idx = p.children.indexOf(a);
        if (idx >= 0) {
          p.children.splice(idx, 0, c);
        } else {
          p.children.push(c);
        }
      }
    },
    removeNode(parent: UniversalNode, node: UniversalNode): void {
      const p = unwrap(parent);
      const c = unwrap(node);
      const i = p.children.indexOf(c);
      if (i >= 0) p.children.splice(i, 1);
      c.parent = null;
    },
    getParentNode(node: UniversalNode): UniversalNode | null {
      const v = unwrap(node).parent;
      return v ? { node: v } as UniversalNode : null;
    },
    getFirstChild(node: UniversalNode): UniversalNode | null {
      const v = unwrap(node).children[0];
      return v ? { node: v } as UniversalNode : null;
    },
    getNextSibling(node: UniversalNode): UniversalNode | null {
      const v = unwrap(node);
      if (!v.parent) return null;
      const siblings = v.parent.children;
      const idx = siblings.indexOf(v);
      const next = siblings[idx + 1];
      return next ? { node: next } as UniversalNode : null;
    },
    isTextNode(node: UniversalNode): boolean {
      return unwrap(node).type === "text";
    },
    serialize(root: UniversalNode): string {
      const v = unwrap(root);
      function esc(val: unknown): string {
        return String(val)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }
      function walk(n: VNode): string {
        switch (n.type) {
          case "text":
            return esc(n.text ?? "");
          case "comment":
            return `<!--${esc(n.comment ?? "")}-->`;
          case "element": {
            const attrs = n.props
              ? Object.entries(n.props)
                // Include null-valued attributes (serialized as "null"); omit only undefined and functions.
                .filter(([attr, val]) =>
                  val !== undefined && typeof val !== "function"
                )
                .map(([attr, val]) => {
                  const rendered = val === null ? "null" : val;
                  return `${attr}="${esc(rendered)}"`;
                }).join(" ")
              : "";
            const open = attrs ? `<${n.tag} ${attrs}>` : `<${n.tag}>`;
            const childrenHTML = n.children.map(walk).join("");
            return `${open}${childrenHTML}</${n.tag}>`;
          }
          case "root":
            return n.children.map(walk).join("");
          default:
            return "";
        }
      }
      if (v.type === "root") return walk(v);
      // Wrap non-root in a synthetic root for serialization
      const syntheticRoot: VNode = {
        type: "root",
        children: [v],
        parent: null,
      };
      return walk(syntheticRoot);
    },
  };

  return adapter;
}

/* -------------------------------------------------------------------------- */
/* Convenience Exports                                                        */
/* -------------------------------------------------------------------------- */

export const DOM_RENDERER = createRenderer(createDomAdapter());
export const SERVER_RENDERER = createRenderer(createServerStringAdapter());
