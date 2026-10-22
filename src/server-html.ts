import { isSubscribable } from './types.ts';
import type { Subscribable } from './types.ts';

export type ServerChild =
  | string
  | number
  | boolean
  | null
  | undefined
  | ServerNode
  | ServerChild[]
  | ((parent: Element) => ServerChild)
  | PromiseLike<unknown>
  | Subscribable<unknown>;
export type ServerComponent<
  P extends Record<string, unknown> = Record<string, unknown>,
> = (props: () => P) => ServerChild;

const nodeKind = Symbol('server node');
export interface ServerNode {
  readonly [nodeKind]: true;
  readonly type: string | ServerComponent | null;
  readonly props: Record<string, unknown> | null;
  readonly children: ServerChild[];
}

export function createElement<P extends Record<string, unknown>>(
  type: string | ServerComponent<P> | typeof Fragment,
  props: P | null,
  ...children: ServerChild[]
): ServerNode {
  return {
    [nodeKind]: true,
    type: type === Fragment ? null : type as string | ServerComponent,
    props,
    children,
  };
}

export function Fragment(children: ServerChild[]): ServerNode {
  return { [nodeKind]: true, type: null, props: null, children };
}

function escape(value: unknown): string {
  const text = String(value);
  let index = text.search(/[&<>"]/);
  if (index === -1) return text;
  let html = text.slice(0, index);
  let start = index;
  while (index < text.length) {
    const code = text.charCodeAt(index);
    const replacement = code === 38
      ? '&amp;'
      : code === 60
      ? '&lt;'
      : code === 62
      ? '&gt;'
      : code === 34
      ? '&quot;'
      : '';
    if (replacement) {
      html += text.slice(start, index) + replacement;
      start = index + 1;
    }
    index++;
  }
  return html + text.slice(start);
}

const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);
const lengthStyle =
  /^(width|height|fontSize|margin|marginTop|marginRight|marginBottom|marginLeft|padding|paddingTop|paddingRight|paddingBottom|paddingLeft|top|right|bottom|left|border.*(Width|Radius))$/;

function styleText(style: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (
      value == null || value === '' || typeof value === 'boolean' ||
      typeof value === 'object' || typeof value === 'function'
    ) continue;
    let text = String(value);
    if (
      lengthStyle.test(key) && (typeof value === 'number' || /^\d+$/.test(text))
    ) {
      if (text !== '0') continue;
      text = '0px';
    }
    const name = key.startsWith('--')
      ? key
      : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    parts.push(`${name}: ${text};`);
  }
  return parts.join(' ');
}

interface Tag {
  open: string;
  close: string;
}
const tags = new Map<string, Tag>();
const attributes = new Set<string>();

function tagInfo(name: string): Tag {
  let tag = tags.get(name);
  if (tag) return tag;
  if (!/^[a-zA-Z][\w:.-]*$/.test(name)) throw new TypeError('Invalid HTML tag');
  tag = {
    open: `<${name}`,
    close: voidElements.has(name.toLowerCase()) ? '' : `</${name}>`,
  };
  if (name.length <= 64) {
    if (tags.size === 256) tags.clear();
    tags.set(name, tag);
  }
  return tag;
}

function validateAttribute(name: string): void {
  if (attributes.has(name)) return;
  if (/[\s"'<>/=\u0000-\u001f]/.test(name) || !name) {
    throw new TypeError('Invalid HTML attribute');
  }
  if (name.length <= 64) {
    if (attributes.size === 256) attributes.clear();
    attributes.add(name);
  }
}

function openingTag(
  tag: Tag,
  props: Record<string, unknown> | null,
): string {
  let html = tag.open;
  if (props) {
    for (const key in props) {
      if (!Object.hasOwn(props, key)) continue;
      const value = props[key];
      if (
        value == null || value === false || typeof value === 'function' ||
        key === 'children' || key === 'key' || key === 'ref' || /^on/i.test(key)
      ) continue;
      const name = key === 'className'
        ? 'class'
        : key === 'tabIndex'
        ? 'tabindex'
        : key;
      validateAttribute(name);
      const text = name === 'style' && typeof value === 'object'
        ? styleText(value as Record<string, unknown>)
        : value === true
        ? ''
        : String(value);
      if (name === 'style' && !text) continue;
      html += ` ${name}="${escape(text)}"`;
    }
  }
  return html + '>';
}

function sample(source: Subscribable<unknown>): ServerChild {
  let value: unknown = null;
  let active = true;
  const cleanup = source.subscribe((next) => {
    if (active) {
      value = next;
      active = false;
    }
  });
  active = false;
  if (typeof cleanup === 'function') cleanup();
  else cleanup?.unsubscribe();
  return value as ServerChild;
}

function component(node: ServerNode): ServerChild {
  const type = node.type as ServerComponent;
  try {
    const props = { ...node.props, children: node.children };
    const result = type(() => props);
    return isPromise(result)
      ? Promise.resolve(result).catch(() => `ERROR:${type.name || 'Anonymous'}`)
      : result;
  } catch {
    return `ERROR:${type.name || 'Anonymous'}`;
  }
}

function isPromise(value: unknown): value is PromiseLike<unknown> {
  return !!value && typeof value === 'object' &&
    typeof (value as PromiseLike<unknown>).then === 'function';
}

export function createTextNode(text: string): ServerChild {
  return text;
}
export function createComment(text: string): ServerNode {
  return {
    [nodeKind]: true,
    type: null,
    props: { comment: text },
    children: [],
  };
}

export function renderToString(child: ServerChild): string {
  if (typeof child === 'string') return escape(child);
  if (typeof child === 'number') return String(child);
  if (child == null) return '<!--null-->';
  if (typeof child === 'boolean') return child ? '<!--true-->' : '<!--false-->';
  if (Array.isArray(child)) return renderChildren(child);
  if (typeof child === 'function') {
    return '<!--$-->' + renderToString(child(undefined as unknown as Element));
  }
  if (nodeKind in child) return renderNode(child);
  if (isSubscribable(child)) return '<!--$-->' + renderToString(sample(child));
  if (isPromise(child)) {
    Promise.resolve(child).catch(() => {});
    throw new TypeError(
      'Async content requires renderToReadableStream or renderToStringAsync',
    );
  }
  throw new TypeError('Unsupported server child');
}

function renderChildren(children: ServerChild[]): string {
  let html = '';
  for (const child of children) html += renderToString(child);
  return html;
}

function renderNode(node: ServerNode): string {
  const { type, props, children } = node;
  if (type === null) {
    return props?.comment !== undefined
      ? `<!--${escape(props.comment).replace(/-/g, '&#45;')}-->`
      : renderChildren(children);
  }
  if (typeof type === 'function') {
    return '<host>' + renderToString(component(node)) + '</host>';
  }
  const tag = tagInfo(type);
  const open = openingTag(tag, props);
  return tag.close ? open + renderChildren(children) + tag.close : open;
}

interface Frame {
  children: ServerChild[];
  index: number;
  close: string;
}

class StreamWriter {
  frames: Frame[] = [];
  pending: PromiseLike<unknown> | undefined;
  text = '';
  offset = 0;
  html = '';

  push(children: ServerChild[], close = ''): void {
    this.frames.push({ children, index: 0, close });
  }

  nextChunk(): string {
    this.html = '';
    while (this.html.length < 16384) {
      if (this.text) {
        this.writeText();
        continue;
      }
      const frame = this.frames[this.frames.length - 1];
      if (!frame) break;
      if (frame.index >= frame.children.length) {
        this.html += frame.close;
        this.frames.pop();
      } else {
        this.visit(frame.children[frame.index++]);
        if (this.pending) break;
      }
    }
    return this.html;
  }

  writeText(): void {
    let end = Math.min(this.offset + 16384, this.text.length);
    const code = this.text.charCodeAt(end - 1);
    if (end < this.text.length && code >= 0xd800 && code <= 0xdbff) end--;
    this.html += this.text.slice(this.offset, end);
    this.offset = end;
    if (end === this.text.length) {
      this.text = '';
      this.offset = 0;
    }
  }

  visit(child: ServerChild): void {
    if (typeof child === 'string') {
      const text = escape(child);
      if (text.length <= 16384) this.html += text;
      else this.text = text;
    } else if (typeof child === 'number') this.html += child;
    else if (child == null || typeof child === 'boolean') {
      this.html += `<!--${child == null ? 'null' : child}-->`;
    } else if (Array.isArray(child)) this.push(child);
    else if (typeof child === 'function') {
      this.html += '<!--$-->';
      this.push([child(undefined as unknown as Element)]);
    } else if (nodeKind in child) this.visitNode(child);
    else if (isSubscribable(child)) {
      this.html += '<!--$-->';
      this.push([sample(child)]);
    } else if (isPromise(child)) {
      this.pending = Promise.resolve(child);
      this.pending.then(undefined, () => {});
    } else throw new TypeError('Unsupported server child');
  }

  visitNode(node: ServerNode): void {
    const { type, props, children } = node;
    if (type === null && props?.comment !== undefined) {
      this.html += `<!--${escape(props.comment).replace(/-/g, '&#45;')}-->`;
    } else if (typeof type === 'function') {
      this.html += '<host>';
      this.push([component(node)], '</host>');
    } else {
      if (type) {
        const tag = tagInfo(type);
        this.html += openingTag(tag, props);
        if (!tag.close) return;
      }
      this.push(children, type ? `</${type}>` : '');
    }
  }

  clear(): void {
    this.frames.length = 0;
    this.pending = undefined;
    this.text = this.html = '';
  }
}

/** Ordered HTML bytes. Pulls stop at async boundaries and obey consumer backpressure. */
export function renderToReadableStream(
  child: ServerChild,
): ReadableStream<Uint8Array> {
  const writer = new StreamWriter();
  writer.push([child]);
  const encoder = new TextEncoder();
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        do {
          if (writer.pending) {
            const value = await writer.pending;
            writer.pending = undefined;
            if (cancelled) return;
            writer.push([value as ServerChild]);
          }
          const chunk = writer.nextChunk();
          if (chunk) controller.enqueue(encoder.encode(chunk));
          if (!writer.frames.length && !writer.text) controller.close();
          if (chunk) return;
        } while (writer.pending);
      } catch (error) {
        writer.clear();
        if (!cancelled) controller.error(error);
      }
    },
    cancel() {
      cancelled = true;
      writer.clear();
    },
  }, { highWaterMark: 0 });
}

export function renderToStringAsync(child: ServerChild): Promise<string> {
  return new Response(renderToReadableStream(child)).text();
}
