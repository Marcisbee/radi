import { createElement as h } from '../src/server.ts';
import { code, section } from './ui.ts';

export const recipes = [
  section(
    'lists',
    'Lists and local state',
    h(
      'p',
      null,
      'Use stable IDs, never array positions or random keys. A retained key keeps its instance; its factory may not run again. Read replacement data through a getter instead of capturing the first item.',
    ),
    code(
      'Editable rows',
      `import { createList, update } from 'radi';

type Item = { id: string; name: string };
function Row(props: () => { read: () => Item }) {
  let draft = '';
  return <li>
    <span>{() => props().read().name}</span>
    <input aria-label="Draft" value={() => draft}
      oninput={(event: Event) => {
        draft = (event.target as HTMLInputElement).value;
      }} />
  </li>;
}

function List() {
  let items: Item[] = [{ id: 'a', name: 'Apple' }, { id: 'b', name: 'Pear' }];
  let byId = new Map(items.map(item => [item.id, item]));
  function replace(next: Item[]) {
    items = next;
    byId = new Map(items.map(item => [item.id, item]));
    update(view as HTMLElement);
  }
  const view = <section>
    <button onclick={() => replace(items.map(item => ({
      ...item, name: item.name + '!',
    })))}>Replace data</button>
    <button onclick={() => replace([...items].reverse())}>Reverse</button>
    <button onclick={() => replace(items.slice(1))}>Remove first</button>
    <ul>{() => createList(key => items.map(({ id }) =>
      key(() => <Row read={() => byId.get(id)!} />, id)
    ))}</ul>
  </section>;
  return view;
}`,
    ),
    h(
      'p',
      null,
      'Type a draft, replace data, then reverse: labels change and drafts follow their IDs. Removing a row discards its local state. Use createKey for one stateful branch; change its key only when you want a reset.',
    ),
  ),
  section(
    'forms',
    'Forms and shared state',
    h(
      'p',
      null,
      'Use native labels, validation and submit events. Read value or checked from the control, change state, then update the smallest view that displays it. Event handlers do not trigger updates automatically.',
    ),
    code(
      'Validated form',
      `import { update } from 'radi';

function Profile() {
  let message = '';
  const view = <form onsubmit={(event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const name = String(new FormData(form).get('name') ?? '').trim();
    message = name ? 'Hello, ' + name : 'Enter a name.';
    update(view as HTMLElement);
  }}>
    <label>Name <input name="name" required /></label>
    <button type="submit">Continue</button>
    <p role="status">{() => message}</p>
  </form>;
  return view;
}`,
    ),
    h(
      'p',
      null,
      'This example only validates locally. For saving, show pending/error/success states, prevent duplicate submissions, and validate again on the server. Catch failures where the operation starts; Suspense shows loading, not an application error boundary.',
    ),
    h(
      'p',
      null,
      'Keep state in the closest shared owner and pass getters and action callbacks to children. Use a channel when a DOM-scoped provider is more convenient.',
    ),
    code(
      'Shared owner',
      `import { update } from 'radi';

function Count(props: () => { read: () => number; increment: () => void }) {
  return <button onclick={() => props().increment()}>{() => props().read()}</button>;
}
function SharedCounter() {
  let count = 0;
  const read = () => count;
  const increment = () => { count++; update(view as HTMLElement); };
  const view = <section>
    <Count read={read} increment={increment} />
    <Count read={read} increment={increment} />
  </section>;
  return view;
}`,
    ),
    h(
      'p',
      null,
      'Both buttons share one value and update together. Keep per-user server state inside the request. Signals are an optional low-level API: current direct signal children can miss their initial subscription during mounting, so use explicit owner updates for reliable shared state.',
    ),
  ),
  section(
    'async',
    'Async work and cleanup',
    h(
      'p',
      null,
      'Cancel the previous request when its input changes. Also guard late results: cancellation alone does not stop every Promise. Cancel on disconnect, and show a retryable error.',
    ),
    code(
      'Search with changing input',
      `import { createAbortSignal, update } from 'radi';

function Search(this: HTMLElement) {
  const lifetime = createAbortSignal(this);
  let request: AbortController | undefined;
  let message = 'Enter a search.';
  lifetime.addEventListener('abort', () => request?.abort(), { once: true });

  async function search(query: string) {
    request?.abort();
    const current = request = new AbortController();
    message = query ? 'Loading…' : 'Enter a search.';
    update(view as HTMLElement);
    if (!query || lifetime.aborted) return;
    try {
      const response = await fetch('/api/search?q=' + encodeURIComponent(query), {
        signal: current.signal,
      });
      if (!response.ok) throw new Error('Request failed');
      const result = await response.text();
      if (current.signal.aborted || current !== request) return;
      message = result || 'No results.';
    } catch {
      if (current.signal.aborted || current !== request) return;
      message = 'Could not load. Submit again to retry.';
    }
    update(view as HTMLElement);
  }

  const view = <form onsubmit={(event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    void search(String(new FormData(form).get('q') ?? '').trim());
  }}>
    <label>Search <input name="q" oninput={(event: Event) => {
      void search((event.target as HTMLInputElement).value.trim());
    }} /></label>
    <button type="submit">Search</button>
    <p role="status">{() => message}</p>
  </form>;
  return view;
}`,
    ),
    h(
      'p',
      null,
      'Provide your own /api/search endpoint returning text. For live search at scale, debounce input and clear the timer on disconnect. Start DOM-dependent work on connect. Dispose subscriptions, timers, observers and router fetchers when their owner disconnects; remove trees through Radi so cleanup runs.',
    ),
    h(
      'p',
      null,
      'createAbortSignalOnUpdate cancels on every update, including one used to show loading. Use it only when that is the intended lifetime; use a separate controller for input-dependent requests as above.',
    ),
  ),
  section(
    'performance',
    'Keep updates small',
    h(
      'p',
      null,
      'update(view) synchronously visits reactive expressions in that subtree. Radi does not batch your calls or infer dependencies. A small runtime cannot make expensive application work free.',
    ),
    h(
      'ul',
      null,
      h(
        'li',
        null,
        'Update the smallest ancestor that contains every changed expression. Group related state changes, then call update once.',
      ),
      h(
        'li',
        null,
        'Keep render expressions pure and cheap. Fetch in an action or lifecycle handler; compute costly derived data when its inputs change.',
      ),
      h(
        'li',
        null,
        'Use keyed rows to preserve state, and paginate or virtualize large lists. Keys do not remove the cost of visiting every row.',
      ),
      h(
        'li',
        null,
        'Coalesce pointer/scroll updates with requestAnimationFrame; cancel the frame on disconnect. Debounce network searches separately.',
      ),
      h(
        'li',
        null,
        'Use memo only with a correct invalidation predicate: true skips work, false recomputes. Include every dependency or the view becomes stale.',
      ),
    ),
    h('h3', null, 'Before shipping'),
    h(
      'p',
      null,
      'Build against the installed Radi version. Try typing, reordering, removal, rapid input changes, failed requests and unmounting during a request. Profile a production build with realistic data and a slower device/network; check long tasks, interaction latency, transferred bytes and cleanup after repeated mounts. Measure before adding caches or memoization.',
    ),
  ),
];
