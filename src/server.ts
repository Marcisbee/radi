/** Server rendering without browser globals. Components are evaluated during rendering. */
import { renderToString } from './server-html.ts';
import type { ServerChild } from './server-html.ts';

export {
  createComment,
  createElement,
  createTextNode,
  Fragment,
  renderToReadableStream,
  renderToString,
  renderToStringAsync,
} from './server-html.ts';
export type {
  ServerChild,
  ServerComponent,
  ServerNode,
} from './server-html.ts';

/** Legacy universal adapter factories remain available for custom renderers. */
export {
  createDomAdapter,
  createRenderer,
  createServerStringAdapter,
  SERVER_RENDERER,
} from './renderer.ts';

export const renderToStringRoot = renderToString;

export function ssr(entry: () => ServerChild): string {
  return renderToString(entry());
}
