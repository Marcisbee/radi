import { createElement as h, createRoot, update } from '../../src/client.ts';
import { createRouter, RouteError } from '../../src/router.ts';
import type { PageData } from './page.ts';

const outlet = document.getElementById('outlet')!;
const root = createRoot(outlet);
const status = document.getElementById('status')!;
const router = createRouter({
  routes: [
    { path: '/', lazy: () => import('./page.ts') },
    { path: '/pages/:id', lazy: () => import('./page.ts') },
  ],
  initialData: JSON.parse(outlet.dataset.initial!),
  staleTime: 10_000,
  cacheSize: 5,
});

let disposeReaction: (() => void) | undefined;
function mountReaction(initial: PageData) {
  let page = initial;
  const fetcher = router.createFetcher<PageData>();
  const reaction = h(
    'div',
    { id: 'reaction' },
    h('button', {
      type: 'button',
      disabled: () => fetcher.state.status !== 'idle',
      onclick: () =>
        fetcher.submit(
          location.href,
          new FormData(),
          page.reacted ? 'DELETE' : 'PUT',
          {
            invalidate: [location.href],
          },
        ),
    }, () => page.reacted ? 'Remove reaction' : 'Add reaction'),
    h(
      'span',
      { role: 'status' },
      () =>
        fetcher.state.error
          ? ' Could not save reaction. Try again.'
          : fetcher.state.status !== 'idle'
          ? ' Saving…'
          : page.reacted
          ? ' 1 reaction'
          : ' 0 reactions',
    ),
  );
  document.getElementById('reaction')!.replaceWith(reaction);
  fetcher.subscribe((state) => {
    if (state.data) page = state.data;
    update(reaction);
  });
  return () => fetcher.dispose();
}

router.subscribe((state) => {
  status.textContent = state.status === 'idle'
    ? 'Ready'
    : state.status === 'submitting'
    ? 'Saving…'
    : 'Loading…';
  outlet.setAttribute('aria-busy', String(state.status !== 'idle'));
  if (state.status !== 'idle') return;
  disposeReaction?.();
  if (state.error) {
    const message = state.error instanceof RouteError
      ? `Request failed: ${state.error.status}`
      : 'Could not load this page.';
    root.render(
      h(
        'section',
        null,
        h('h1', null, message),
        h('button', { onclick: () => router.revalidate() }, 'Retry'),
      ),
    );
  } else if (state.module?.view) {
    root.render(state.module.view(state));
    disposeReaction = mountReaction(state.data as PageData);
  }
});
router.attach();
document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !outlet.contains(form)) return;
  event.preventDefault();
  void router.submit(location.href, new FormData(form));
});
document.querySelectorAll<HTMLAnchorElement>('nav a').forEach((link) => {
  link.addEventListener('pointerenter', () => {
    void router.prefetch(link.href).catch(() => {});
  });
  link.addEventListener('focus', () => {
    void router.prefetch(link.href).catch(() => {});
  });
});
