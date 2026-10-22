import { h, render } from 'vue';

export function mount(target, select) {
  return {
    set(rows, selected) {
      render(
        h('table', null, [h(
          'tbody',
          null,
          rows.map((row) =>
            h('tr', {
              key: row.id,
              'data-id': row.id,
              class: selected === row.id ? 'selected' : '',
            }, [
              h('td', null, String(row.id)),
              h('td', null, [
                h('button', { onClick: () => select(row.id) }, row.label),
              ]),
            ])
          ),
        )]),
        target,
      );
    },
    unmount: () => render(null, target),
  };
}
