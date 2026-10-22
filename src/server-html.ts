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

const escapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};
function escape(value: unknown): string {
  return String(value).replace(/[&<>"]/g, (char) => escapes[char]);
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

function openingTag(
  tag: string,
  props: Record<string, unknown> | null,
): string {
  if (!/^[a-zA-Z][\w:.-]*$/.test(tag)) throw new TypeError('Invalid HTML tag');
  let html = `<${tag}`;
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (
        value == null || value === false || typeof value === 'function' ||
        key === 'children' || key === 'key' || key === 'ref' || /^on/i.test(key)
      ) continue;
      const name = key === 'className'
        ? 'class'
        : key === 'tabIndex'
        ? 'tabindex'
        : key;
      if (/[\s"'<>/=\u0000-\u001f]/.test(name) || !name) {
        throw new TypeError('Invalid HTML attribute');
      }
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

type Token = string | PromiseLike<unknown>;
function* textChunks(text: string): Generator<string> {
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + 16384, text.length);
    const code = text.charCodeAt(end - 1);
    if (end < text.length && code >= 0xd800 && code <= 0xdbff) end--;
    yield text.slice(start, end);
    start = end;
  }
}

function* walk(child: ServerChild): Generator<Token> {
  if (child == null || typeof child === 'boolean') {
    yield `<!--${child == null ? 'null' : child}-->`;
  } else if (typeof child === 'string' || typeof child === 'number') {
    const text = escape(child);
    if (text.length <= 16384) yield text;
    else yield* textChunks(text);
  } else if (Array.isArray(child)) {
    for (const item of child) yield* walk(item);
  } else if (typeof child === 'function') {
    yield '<!--$-->';
    yield* walk(child(undefined as unknown as Element));
  } else if (isPromise(child)) {
    yield child;
  } else if (isSubscribable(child)) {
    yield '<!--$-->';
    yield* walk(sample(child));
  } else if (child[nodeKind]) {
    yield* walkNode(child);
  } else {
    throw new TypeError('Unsupported server child');
  }
}

function* walkNode(node: ServerNode): Generator<Token> {
  if (node.type === null && node.props?.comment !== undefined) {
    yield `<!--${escape(node.props.comment).replace(/-/g, '&#45;')}-->`;
    return;
  }
  if (typeof node.type === 'function') {
    yield '<host>';
    yield* walk(component(node));
    yield '</host>';
  } else {
    if (node.type) {
      yield openingTag(node.type, node.props);
      if (voidElements.has(node.type.toLowerCase())) return;
    }
    for (const child of node.children) yield* walk(child);
    if (node.type) yield `</${node.type}>`;
  }
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
  let html = '';
  for (const token of walk(child)) {
    if (typeof token !== 'string') {
      Promise.resolve(token).catch(() => {});
      throw new TypeError(
        'Async content requires renderToReadableStream or renderToStringAsync',
      );
    }
    html += token;
  }
  return html;
}

/** Ordered HTML bytes. Pulls stop at async boundaries and obey consumer backpressure. */
export function renderToReadableStream(
  child: ServerChild,
): ReadableStream<Uint8Array> {
  const stack = [walk(child)];
  const encoder = new TextEncoder();
  let pending: PromiseLike<unknown> | undefined;
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (pending) {
          const value = await pending;
          pending = undefined;
          if (cancelled) return;
          stack.push(walk(value as ServerChild));
        }
        let chunk = '';
        while (stack.length && chunk.length < 16384) {
          const next = stack[stack.length - 1].next();
          if (next.done) {
            stack.pop();
            continue;
          }
          if (typeof next.value !== 'string') {
            pending = Promise.resolve(next.value);
            pending.then(undefined, () => {});
            break;
          }
          chunk += next.value;
        }
        if (chunk) controller.enqueue(encoder.encode(chunk));
        if (!stack.length) controller.close();
        else if (!chunk && pending) return this.pull!(controller);
      } catch (error) {
        stack.length = 0;
        if (!cancelled) controller.error(error);
      }
    },
    cancel() {
      cancelled = true;
      stack.length = 0;
      pending = undefined;
    },
  }, { highWaterMark: 0 });
}

export function renderToStringAsync(child: ServerChild): Promise<string> {
  return new Response(renderToReadableStream(child)).text();
}
