import { createElement as h, createRoot, update } from '../../src/client.ts';
import { enableDevTools } from '../../src/devtools.ts';

let dispose = enableDevTools();
function Counter(this: HTMLElement, props: () => { label: string }) {
  let count = 0;
  return h(
    'section',
    { className: 'counter' },
    h('h2', null, () => props().label),
    h('p', { id: 'count' }, () => `Count: ${count}`),
    h('button', {
      onclick: () => {
        count++;
        update(this);
      },
    }, 'Increment'),
  );
}
function App() {
  return h(
    'main',
    null,
    h('p', null, 'Radi DevTools · Development example'),
    h('h1', null, 'See what changed.'),
    h(
      'p',
      null,
      'Open Chrome DevTools → Radi. Record renders, then increment or remount the counter.',
    ),
    h(Counter, { label: 'Counter' }),
  );
}
const root = createRoot(document.getElementById('app')!);
const mount = () => root.render(h(App, null));
mount();
document.getElementById('remount')!.onclick = () => {
  root.unmount();
  mount();
};
document.getElementById('unmount')!.onclick = () => root.unmount();
document.getElementById('disable')!.onclick = () => dispose();
document.getElementById('enable')!.onclick = () => {
  dispose = enableDevTools();
};
