import { createElement as h } from '../../src/client.ts';
import { fetchRouteData } from '../../src/router.ts';
import type {
  ActionContext,
  RouteContext,
  RouterState,
} from '../../src/router.ts';

export interface PageData {
  id: string;
  title: string;
  visits: number;
}

const endpoint = ({ params }: RouteContext) =>
  `/api/pages/${encodeURIComponent(params.id ?? 'home')}`;

export function loader(context: RouteContext) {
  return fetchRouteData<PageData>(endpoint(context), {
    signal: context.signal,
  });
}

export function action(context: ActionContext) {
  return fetchRouteData(endpoint(context), {
    method: context.method,
    body: context.formData,
    signal: context.signal,
  });
}

export function view(state: RouterState): Node {
  const page = state.data as PageData;
  return h(
    'section',
    null,
    h('h1', null, page.title),
    h('p', null, 'Visits: ', h('output', null, String(page.visits))),
    h('form', { method: 'post' }, h('button', { type: 'submit' }, 'Add visit')),
    h(
      'p',
      null,
      'Route data comes from Go. The shared note stays in the browser.',
    ),
  );
}
