import { createElement } from './server-html.ts';
import type { ServerChild, ServerNode } from './server-html.ts';
import { serializeState } from './resume-state.ts';
import type { ResumeState } from './resume-state.ts';

/** A resumable boundary. Use a valid container tag for the surrounding HTML. */
export function resumable(
  state: ResumeState,
  children: ServerChild,
  tag = 'div',
): ServerNode {
  if (
    !['div', 'section', 'article', 'main', 'aside', 'nav', 'span', 'li', 'td']
      .includes(tag)
  ) {
    throw new TypeError('Unsupported resumption boundary tag');
  }
  return createElement(
    tag,
    { 'data-radi-state': serializeState(state) },
    children,
    createElement('template', { 'data-radi-ready': '' }),
  );
}

/** Bind a click to a key in the trusted client loader registry. */
export function resumeClick(handler: string): { 'data-radi-click': string } {
  if (!handler || handler.length > 256) {
    throw new TypeError('Invalid handler key');
  }
  return { 'data-radi-click': handler };
}
