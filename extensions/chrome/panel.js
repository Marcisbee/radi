const $ = (id) => document.getElementById(id);
let snapshot;
let view = 'components';
let selected = null;
let pending = false;
let timer;
const bridge = 'window.__RADI_DEVTOOLS__';

function evaluate(expression) {
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(expression, (result, exception) => {
      if (exception?.isException || exception?.isError) {
        reject(new Error('Cannot inspect this page'));
      } else resolve(result);
    });
  });
}

function resetSelection() {
  selected = null;
  $('selection').textContent = 'Select a component';
  $('details').textContent = 'Select a row to inspect its props and layout.';
  $('highlight').disabled = $('inspect').disabled = true;
}

async function refresh() {
  if (pending || document.hidden) return;
  pending = true;
  try {
    const result = await evaluate(`${bridge}?.snapshot()`);
    if (!result || result.version !== 1 || !Array.isArray(result.tree)) {
      snapshot = null;
      resetSelection();
      $('empty').hidden = false;
      $('inspector').hidden = true;
      $('status').textContent = result
        ? 'Unsupported bridge version'
        : 'Radi bridge not detected';
      return;
    }
    if (snapshot?.session !== result.session) resetSelection();
    snapshot = result;
    $('empty').hidden = true;
    $('inspector').hidden = false;
    $('status').textContent = result.recording
      ? 'Recording renders'
      : 'Connected';
    $('record').textContent = result.recording
      ? 'Stop recording'
      : 'Record renders';
    $('record').setAttribute('aria-pressed', String(result.recording));
    render();
    if (selected !== null) await select(selected, false);
  } catch {
    $('status').textContent =
      'Cannot inspect this page. Open a regular app tab.';
    $('inspector').hidden = true;
    resetSelection();
  } finally {
    pending = false;
  }
}

function render() {
  if (!snapshot) return;
  const { tree, events, dropped, truncated } = snapshot;
  const filter = $('filter').value.toLowerCase();
  const performance = view === 'performance';
  $('notice').textContent = performance
    ? `Latest ${events.length} render calls. ${dropped} older calls discarded. Durations overlap for nested calls; do not sum them.`
    : `Layers follow DOM nesting; reactive expressions can own following siblings.${
      truncated ? ' Showing the first 5,000 nodes.' : ''
    }`;
  $('metrics').textContent = performance
    ? `${events.length} recorded calls · ${
      events.length
        ? Math.max(...events.map((event) => event.duration)).toFixed(2)
        : '0.00'
    } ms longest call`
    : `${
      tree.filter((node) => node.kind === 'component').length
    } components · ${tree.length} layers`;
  const rows = performance ? [...events].reverse() : tree;
  const visible = new Map();
  const depths = new Map();
  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const show = performance || view === 'layers' || row.kind === 'component';
    visible.set(row.id, show ? row.id : visible.get(row.parent));
    const parent = visible.get(row.parent);
    const depth = performance ? 0 : parent ? (depths.get(parent) || 0) + 1 : 0;
    depths.set(row.id, depth);
    if (!show || !row.name.toLowerCase().includes(filter)) continue;
    fragment.append(rowButton(row, depth, performance));
  }
  if (!fragment.childNodes.length) {
    fragment.append(document.createTextNode(
      performance
        ? 'Record renders, then interact with your app.'
        : 'No matching nodes.',
    ));
  }
  const focused = document.activeElement?.dataset?.id;
  $('tree').replaceChildren(fragment);
  if (focused) {
    $('tree').querySelector(`[data-id="${Number(focused)}"]`)?.focus();
  }
}

function rowButton(row, depth, performance) {
  const button = document.createElement('button');
  button.className = 'node';
  button.dataset.id = Number(row.id);
  button.setAttribute('aria-pressed', String(selected === row.id));
  button.style.paddingLeft = `${9 + Math.min(depth, 12) * 14}px`;
  const label = document.createElement('span');
  label.textContent = performance ? `${row.name} · ${row.phase}` : row.name;
  const metric = document.createElement('small');
  metric.textContent = performance
    ? `${row.duration.toFixed(2)} ms`
    : `${row.kind} · ${row.count} calls`;
  button.append(label, metric);
  button.addEventListener('click', () =>
    select(row.id).catch(() => {
      $('status').textContent = 'Selection unavailable. Refresh to reconnect.';
    }));
  return button;
}

function section(title, entries) {
  const heading = document.createElement('h3');
  heading.textContent = title;
  const list = document.createElement('dl');
  for (const [key, value] of entries) {
    const term = document.createElement('dt');
    term.textContent = key;
    const definition = document.createElement('dd');
    definition.textContent = String(value);
    list.append(term, definition);
  }
  return [heading, list];
}

async function select(id, redraw = true) {
  selected = Number(id);
  const session = snapshot?.session;
  const details = await evaluate(`${bridge}?.details(${selected})`);
  if (selected !== Number(id) || session !== snapshot?.session) return;
  $('highlight').disabled = $('inspect').disabled = !details;
  $('selection').textContent = details?.name || 'Node unmounted';
  $('details').replaceChildren();
  if (details) {
    $('details').append(
      ...section('Props', details.props.map(({ key, value }) => [key, value])),
    );
    $('details').append(
      ...section(
        'Bounds (CSS pixels)',
        Object.entries(details.bounds || {}).map((
          [key, value],
        ) => [key, value.toFixed(1)]),
      ),
    );
    $('details').append(
      ...section('Layout', Object.entries(details.layout || {})),
    );
  } else {$('details').textContent =
      'This node is no longer mounted. Its recorded render remains in the timeline.';}
  if (redraw) render();
}

async function command(expression) {
  try {
    await evaluate(expression);
    await refresh();
  } catch {
    $('status').textContent = 'Command failed. Refresh to reconnect.';
  }
}

for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    view = button.dataset.view;
    for (const tab of document.querySelectorAll('[data-view]')) {
      tab.setAttribute('aria-pressed', String(tab === button));
    }
    render();
  });
}
$('filter').addEventListener('input', render);
$('refresh').addEventListener('click', refresh);
$('record').addEventListener(
  'click',
  () => command(`${bridge}?.record(${!snapshot?.recording})`),
);
$('clear').addEventListener('click', () => command(`${bridge}?.clear()`));
$('highlight').addEventListener(
  'click',
  () => command(`${bridge}?.highlight(${Number(selected)})`),
);
$('inspect').addEventListener(
  'click',
  () => command(`inspect(${bridge}?.node(${Number(selected)}))`),
);
window.start = () => {
  clearInterval(timer);
  refresh();
  timer = setInterval(refresh, 1000);
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) command(`${bridge}?.record(false)`);
  else window.start();
});
window.addEventListener('pagehide', () => {
  clearInterval(timer);
  evaluate(`${bridge}?.record(false)`).catch(() => {});
});
window.start();
