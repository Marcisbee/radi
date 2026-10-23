const $ = (id) => document.getElementById(id);
let snapshot;
let view = 'components';
let selected = null;
let pending = false;
let timer;
const collapsed = new Set();
const closedSections = new Set();
const bridge = 'window.__RADI_DEVTOOLS__';
document.documentElement.dataset.theme = chrome.devtools.panels.themeName;
chrome.devtools.panels.setThemeChangeHandler((theme) => {
  document.documentElement.dataset.theme = theme;
});

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
      document.body.dataset.connected = 'false';
      resetSelection();
      $('empty').hidden = false;
      $('inspector').hidden = true;
      $('status').textContent = result
        ? 'Unsupported bridge version'
        : 'Radi bridge not detected';
      return;
    }
    if (snapshot?.session !== result.session) {
      resetSelection();
      collapsed.clear();
    }
    document.body.dataset.connected = 'true';
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
    document.body.dataset.connected = 'false';
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
  const performanceView = view === 'performance';
  document.body.dataset.view = view;
  $('notice').textContent = performanceView
    ? `Latest ${events.length} render calls. ${dropped} older calls discarded. Inclusive durations overlap.`
    : `DOM nesting · Reactive expressions may own following siblings.${
      truncated ? ' First 5,000 nodes shown.' : ''
    }`;
  $('notice').title = $('notice').textContent;
  const longest = Math.max(0, ...events.map((event) => event.duration));
  $('metrics').textContent = performanceView
    ? `${events.length} recorded calls · ${longest.toFixed(2)} ms longest call`
    : `${
      tree.filter((node) => node.kind === 'component').length
    } components · ${tree.length} layers`;
  $('name-column').textContent = performanceView
    ? 'Render call'
    : view === 'layers'
    ? 'DOM layer'
    : 'Component';
  $('type-column').textContent = performanceView ? 'Phase' : 'Type';
  $('count-column').textContent = performanceView ? 'At, ms' : 'Calls';
  $('time-column').textContent = performanceView ? 'Duration, ms' : 'Last, ms';
  const firstStart = Math.min(...events.map((event) => event.start));
  const rows = performanceView
    ? [...events].reverse().map((row) => ({
      ...row,
      depth: 0,
      offset: row.start - firstStart,
      longest,
    }))
    : treeRows(tree);
  renderRows(rows, performanceView);
}

function treeRows(tree) {
  const ancestors = new Map();
  const rows = [];
  const parents = new Set();
  for (const node of tree) {
    const parent = ancestors.get(node.parent);
    if (view !== 'layers' && node.kind !== 'component') {
      ancestors.set(node.id, parent);
      continue;
    }
    const row = {
      ...node,
      depth: parent ? parent.depth + 1 : 0,
      hidden: parent && (parent.hidden || collapsed.has(parent.id)),
    };
    ancestors.set(node.id, row);
    if (parent) parents.add(parent.id);
    rows.push(row);
  }
  return rows.map((row) => ({ ...row, expandable: parents.has(row.id) }));
}

function renderRows(rows, performanceView) {
  const filter = $('filter').value.toLowerCase();
  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    if (row.hidden && !filter || !row.name.toLowerCase().includes(filter)) {
      continue;
    }
    fragment.append(rowButton(row, performanceView));
  }
  if (!fragment.childNodes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-tree';
    empty.textContent = performanceView
      ? 'Record renders, then interact with your app.'
      : 'No matching nodes.';
    fragment.append(empty);
  }
  const focused = document.activeElement?.dataset?.focus;
  const scrollTop = $('tree').scrollTop;
  $('tree').replaceChildren(fragment);
  if (focused) {
    [...$('tree').querySelectorAll('[data-focus]')].find((node) =>
      node.dataset.focus === focused
    )?.focus({ preventScroll: true });
  }
  $('tree').scrollTop = scrollTop;
}

function cell(className, value) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = value;
  return span;
}

function rowButton(row, performanceView) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tree-row';
  wrapper.style.paddingLeft = `${Math.min(row.depth, 16) * 14}px`;
  const branch = document.createElement('button');
  branch.className = 'branch';
  branch.disabled = !row.expandable;
  branch.dataset.focus = `branch-${row.id}`;
  branch.setAttribute(
    'aria-label',
    `${collapsed.has(row.id) ? 'Expand' : 'Collapse'} ${row.name}`,
  );
  if (row.expandable) {
    branch.setAttribute('aria-expanded', String(!collapsed.has(row.id)));
  }
  branch.addEventListener('click', () => {
    collapsed.has(row.id) ? collapsed.delete(row.id) : collapsed.add(row.id);
    render();
  });
  const button = document.createElement('button');
  button.className = 'node';
  button.dataset.id = Number(row.id);
  button.dataset.focus = `node-${row.id}-${row.start ?? ''}`;
  button.dataset.kind = row.kind || 'component';
  button.setAttribute('aria-pressed', String(selected === row.id));
  const duration = cell('duration', '');
  duration.append(
    cell('', (performanceView ? row.duration : row.last).toFixed(2)),
  );
  if (performanceView) {
    duration.style.setProperty(
      '--duration',
      `${row.longest ? row.duration / row.longest * 90 : 0}%`,
    );
  }
  button.append(
    cell('node-name', row.name),
    cell('kind', row.phase || row.kind),
    cell('calls', performanceView ? row.offset.toFixed(1) : row.count),
    duration,
  );
  button.addEventListener('click', () =>
    select(row.id).catch(() => {
      $('status').textContent = 'Selection unavailable. Refresh to reconnect.';
    }));
  wrapper.append(branch, button);
  return wrapper;
}

function section(title, entries) {
  const group = document.createElement('details');
  group.className = 'property-group';
  group.open = !closedSections.has(title);
  const heading = document.createElement('summary');
  heading.textContent = title;
  const list = document.createElement('dl');
  for (const [key, value] of entries) {
    const property = document.createElement('div');
    property.className = 'property';
    const term = document.createElement('dt');
    term.textContent = key;
    const definition = document.createElement('dd');
    definition.textContent = String(value);
    definition.dataset.type = /^-?\d+(\.\d+)?$/.test(String(value))
      ? 'number'
      : 'string';
    property.append(term, definition);
    list.append(property);
  }
  group.append(heading, list);
  group.addEventListener('toggle', () => {
    group.open ? closedSections.delete(title) : closedSections.add(title);
  });
  return [group];
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
