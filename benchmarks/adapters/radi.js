import {
  createElement as h,
  createList,
  createRoot,
  update,
} from '../../src/client.ts';

export function mount(target, select) {
  let rows = [];
  let byId = new Map();
  let selected = null;
  const root = createRoot(target);
  const table = h(
    'table',
    null,
    h('tbody', null, () =>
      createList((key) =>
        rows.map((row) =>
          key(() =>
            h(
              'tr',
              {
                'data-id': row.id,
                className: () => selected === row.id ? 'selected' : '',
              },
              h('td', null, row.id),
              h(
                'td',
                null,
                h(
                  'button',
                  { onclick: () => select(row.id) },
                  () => byId.get(row.id).label,
                ),
              ),
            ), row.id)
        )
      )),
  );
  root.render(table);
  return {
    set(nextRows, nextSelected) {
      rows = nextRows;
      byId = new Map(rows.map((row) => [row.id, row]));
      selected = nextSelected;
      update(table);
    },
    unmount: () => root.unmount(),
  };
}
