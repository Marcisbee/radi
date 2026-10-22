import { createElement as h, createRoot } from '../../src/client.ts';
import { createRouter, RouteError } from '../../src/router.ts';

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

router.subscribe((state) => {
  status.textContent = state.status === 'idle'
    ? 'Ready'
    : state.status === 'submitting'
    ? 'Saving…'
    : 'Loading…';
  outlet.setAttribute('aria-busy', String(state.status !== 'idle'));
  if (state.status !== 'idle') return;
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
  } else if (state.module?.view) root.render(state.module.view(state));
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
