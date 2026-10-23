import { devtoolsHook } from './devtools-hook.ts';
import {
  COMPONENT,
  PROPS,
  REACTIVE_ATTRIBUTES,
  REACTIVE_CHILDREN,
  TYPE,
} from './symbols.ts';

type DebugNode = Node & {
  [TYPE]?: { name?: string };
  [COMPONENT]?: unknown;
  [PROPS]?: Record<string, unknown>;
  [REACTIVE_CHILDREN]?: unknown;
  [REACTIVE_ATTRIBUTES]?: unknown;
};
type Stats = { count: number; total: number; last: number };
type Entry = Stats & {
  id: number;
  parent: number | null;
  kind: string;
  name: string;
};
type RenderEvent = {
  id: number;
  name: string;
  phase: string;
  start: number;
  duration: number;
};

declare global {
  interface Window {
    __RADI_DEVTOOLS__?: DevTools;
  }
}

const MAX_NODES = 5000;
const MAX_EVENTS = 500;

function kind(node: DebugNode): string {
  if (node[COMPONENT]) return 'component';
  if (node[REACTIVE_CHILDREN]) return 'reactive';
  if (node[REACTIVE_ATTRIBUTES]) return 'attributes';
  return 'element';
}

function name(node: DebugNode): string {
  if (node[COMPONENT]) return node[TYPE]?.name || 'Anonymous';
  if (node.nodeType === Node.COMMENT_NODE) return 'Reactive expression';
  return (node as Element).localName || node.nodeName;
}

// Do not call application getters, functions, or toJSON while inspecting props.
function preview(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value.slice(0, 200));
  if (typeof value === 'function') return '[Function]';
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  if (typeof value === 'object') return '[Object]';
  return String(value);
}

function props(node: DebugNode) {
  try {
    return Object.entries(Object.getOwnPropertyDescriptors(node[PROPS] || {}))
      .slice(0, 100).map(([key, descriptor]) => ({
        key,
        value: 'value' in descriptor ? preview(descriptor.value) : '[Getter]',
      }));
  } catch {
    return [{ key: '(unavailable)', value: 'Props could not be inspected' }];
  }
}

class DevTools {
  readonly version = 1;
  private ids = new WeakMap<Node, number>();
  private stats = new WeakMap<Node, Stats>();
  private nodes = new Map<number, DebugNode>();
  private nextId = 0;
  private events: RenderEvent[] = [];
  private dropped = 0;
  private recording = false;
  private heartbeat = 0;
  private overlay: HTMLDivElement | undefined;
  private overlayTimer: number | undefined;
  private session = crypto.randomUUID();
  private id = (node: Node) => {
    if (!this.ids.has(node)) this.ids.set(node, ++this.nextId);
    return this.ids.get(node)!;
  };

  private onRender = (node: DebugNode, phase: 'mount' | 'update') => {
    if (performance.now() - this.heartbeat > 3000) this.recording = false;
    if (!this.recording) return;
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      const previous = this.stats.get(node) || { count: 0, total: 0, last: 0 };
      this.stats.set(node, {
        count: previous.count + 1,
        total: previous.total + duration,
        last: duration,
      });
      this.events.push({
        id: this.id(node),
        name: name(node),
        phase,
        start,
        duration,
      });
      if (this.events.length > MAX_EVENTS) {
        this.events.shift();
        this.dropped++;
      }
    };
  };

  snapshot() {
    if (performance.now() - this.heartbeat > 3000) this.recording = false;
    this.heartbeat = performance.now();
    this.nodes = new Map();
    const tree: Entry[] = [];
    const parents = new Map<Node, number>();
    const walker = document.createTreeWalker(
      document,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
    );
    let truncated = false;
    let current = walker.nextNode() as DebugNode | null;
    while (current) {
      const parent = parents.get(current.parentNode!);
      if (
        current !== this.overlay &&
        (parent !== undefined || kind(current) !== 'element')
      ) {
        if (tree.length === MAX_NODES) {
          truncated = true;
          break;
        }
        const nodeId = this.id(current);
        this.nodes.set(nodeId, current);
        parents.set(current, nodeId);
        tree.push({
          id: nodeId,
          parent: parent ?? null,
          kind: kind(current),
          name: name(current),
          ...(this.stats.get(current) || { count: 0, total: 0, last: 0 }),
        });
      }
      current = walker.nextNode() as DebugNode | null;
    }
    return {
      version: 1,
      session: this.session,
      tree,
      events: this.events,
      dropped: this.dropped,
      recording: this.recording,
      truncated,
    };
  }

  private element(node: DebugNode): Element | null {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      return el.getBoundingClientRect().width ? el : el.firstElementChild || el;
    }
    return node.nextSibling instanceof Element
      ? node.nextSibling
      : node.parentElement;
  }

  details(nodeId: number) {
    const node = this.nodes.get(nodeId);
    if (!node?.isConnected) return null;
    const el = this.element(node);
    const rect = el?.getBoundingClientRect();
    const style = el && getComputedStyle(el);
    return {
      name: name(node),
      kind: kind(node),
      props: props(node),
      bounds: rect
        ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        : null,
      layout: style
        ? {
          display: style.display,
          position: style.position,
          zIndex: style.zIndex,
          overflow: style.overflow,
          transform: style.transform,
        }
        : null,
    };
  }

  highlight(nodeId: number) {
    this.hideHighlight();
    const node = this.nodes.get(nodeId);
    if (!node?.isConnected) return false;
    const el = this.element(node);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    this.overlay = document.createElement('div');
    this.overlay.style.cssText =
      `position:fixed;pointer-events:none;z-index:2147483647;box-sizing:border-box;border:2px solid #7687ff;background:#7687ff22;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px`;
    document.documentElement.append(this.overlay);
    this.overlayTimer = window.setTimeout(this.hideHighlight, 1500);
    return true;
  }

  private hideHighlight = () => {
    clearTimeout(this.overlayTimer);
    this.overlay?.remove();
    this.overlay = undefined;
  };

  node(nodeId: number) {
    return this.nodes.get(nodeId) || null;
  }

  record(enabled: boolean) {
    this.recording = enabled === true;
    this.heartbeat = performance.now();
    return this.recording;
  }

  clear() {
    this.stats = new WeakMap();
    this.events = [];
    this.dropped = 0;
  }

  dispose() {
    this.recording = false;
    this.hideHighlight();
    if (devtoolsHook.render === this.onRender) delete devtoolsHook.render;
    this.nodes.clear();
    this.ids = new WeakMap();
    this.clear();
  }

  attach() {
    devtoolsHook.render = this.onRender;
  }
}

/** Enable only in development. Call the returned function on HMR disposal. */
export function enableDevTools(): () => void {
  if (typeof window === 'undefined') return () => {};
  window.__RADI_DEVTOOLS__?.dispose();
  const api = new DevTools();
  api.attach();
  window.__RADI_DEVTOOLS__ = api;
  return () => {
    api.dispose();
    if (window.__RADI_DEVTOOLS__ === api) delete window.__RADI_DEVTOOLS__;
  };
}
