import { mount } from 'benchmark-adapter';

const target = document.querySelector('main');
const data = (count, offset = 0) =>
  Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    label: `Row ${offset + i + 1}`,
  }));
let rows = [];
let selected = null;
let pending;
const select = (id) => {
  selected = id;
  pending = adapter.set(rows, selected);
};
let adapter = mount(target, select);
await adapter.set(rows, selected);
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function verify(expected, expectedSelected, previous = new Map()) {
  const actual = [...target.querySelectorAll('tbody > tr')];
  if (actual.length !== expected.length) {
    throw new Error(`Row count: ${actual.length} != ${expected.length}`);
  }
  expected.forEach((row, index) => {
    const node = actual[index];
    if (
      node.dataset.id !== String(row.id) ||
      node.children[0].textContent !== String(row.id) ||
      node.querySelector('button').textContent !== row.label ||
      node.className !== (row.id === expectedSelected ? 'selected' : '')
    ) {
      throw new Error(`Incorrect row ${row.id} at ${index}`);
    }
    if (previous.has(row.id) && previous.get(row.id) !== node) {
      throw new Error(`Keyed row ${row.id} lost DOM identity`);
    }
  });
}

async function reset(count) {
  rows = data(count);
  selected = null;
  await adapter.set([], null);
  await adapter.set(rows, selected);
  verify(rows, selected);
  await frame();
}

function changedLabels(stride) {
  return {
    initial: 1000,
    next: data(1000).map((row, i) =>
      i % stride ? row : { ...row, label: `${row.label} !!!` }
    ),
  };
}

function prepare(name) {
  switch (name) {
    case 'create-1000':
      return { initial: 0, next: data(1000) };
    case 'create-10000':
      return { initial: 0, next: data(10000) };
    case 'replace':
      return { initial: 1000, next: data(1000, 1000) };
    case 'append':
      return { initial: 1000, next: data(2000) };
    case 'update-10th':
      return changedLabels(10);
    case 'update-all':
      return changedLabels(1);
    case 'swap': {
      const next = data(1000);
      [next[1], next[998]] = [next[998], next[1]];
      return { initial: 1000, next };
    }
    case 'reverse':
      return { initial: 1000, next: data(1000).reverse() };
    case 'remove':
      return {
        initial: 1000,
        next: data(1000).filter((row) => row.id !== 500),
      };
    case 'select':
      return { initial: 1000, next: data(1000), selected: 500 };
    case 'clear':
      return { initial: 1000, next: [] };
    case 'unmount':
      return { initial: 1000, next: [] };
    default:
      throw new Error(`Unknown scenario: ${name}`);
  }
}

async function sample(name) {
  const scenario = prepare(name);
  await reset(scenario.initial);
  const previous = new Map(
    [...target.querySelectorAll('tr')].map((
      node,
    ) => [Number(node.dataset.id), node]),
  );
  // Fixtures, snapshots, and validation are deliberately outside the timed interval.
  rows = scenario.next;
  selected = scenario.selected ?? null;
  const start = performance.now();
  if (name === 'unmount') await adapter.unmount();
  else if (name === 'select') {
    target.querySelector('[data-id="500"] button').click();
    await pending;
  } else await adapter.set(rows, selected);
  const commitMs = performance.now() - start;
  // Force layout, then cross a rendering opportunity; this is not an INP measurement.
  target.getBoundingClientRect();
  await frame();
  await frame();
  const frameMs = performance.now() - start;
  verify(scenario.next, scenario.selected ?? null, previous);
  if (name === 'unmount') {
    if (target.childNodes.length) throw new Error('Unmount left DOM behind');
    adapter = mount(target, select);
    await adapter.set([], null);
  }
  return { commitMs, frameMs };
}

async function memory(stage) {
  if (stage === 'mounted') await reset(10000);
  if (stage === 'cycled') {
    for (const _ of Array.from({ length: 10 })) {
      await reset(1000);
      await adapter.unmount();
      adapter = mount(target, select);
    }
  }
  if (stage === 'empty' || stage === 'cycled') {
    rows = [];
    selected = null;
    pending = null;
    await adapter.set(rows, selected);
    verify([], null);
  }
}

window.benchmark = { sample, memory, readyMs: performance.now() };
