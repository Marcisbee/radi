import { createElement as h, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';

export function mount(target, select) {
  const root = createRoot(target);
  function Table({ rows, selected, done }) {
    useLayoutEffect(done);
    return h(
      'table',
      null,
      h(
        'tbody',
        null,
        rows.map((row) =>
          h(
            'tr',
            {
              key: row.id,
              'data-id': row.id,
              className: selected === row.id ? 'selected' : '',
            },
            h('td', null, row.id),
            h(
              'td',
              null,
              h('button', { onClick: () => select(row.id) }, row.label),
            ),
          )
        ),
      ),
    );
  }
  return {
    set: (rows, selected) =>
      new Promise((resolve) => {
        root.render(h(Table, {
          rows,
          selected,
          done: () => {
            resolve();
          },
        }));
      }),
    unmount: () => root.unmount(),
  };
}
