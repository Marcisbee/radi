export function mount(target, select) {
  const table = document.createElement('table');
  const body = table.appendChild(document.createElement('tbody'));
  const nodes = new Map();
  target.append(table);
  return {
    set(rows, selected) {
      const ids = new Set(rows.map((row) => row.id));
      for (const [id, node] of nodes) {
        if (!ids.has(id)) {
          node.remove();
          nodes.delete(id);
        }
      }
      let cursor = body.firstChild;
      for (const row of rows) {
        let node = nodes.get(row.id);
        if (!node) {
          node = document.createElement('tr');
          node.dataset.id = row.id;
          node.appendChild(document.createElement('td')).textContent = row.id;
          const button = node.appendChild(document.createElement('td'))
            .appendChild(document.createElement('button'));
          button.onclick = () => select(row.id);
          nodes.set(row.id, node);
        }
        const button = node.lastChild.firstChild;
        if (button.textContent !== row.label) button.textContent = row.label;
        const className = selected === row.id ? 'selected' : '';
        if (node.className !== className) node.className = className;
        if (node !== cursor) body.insertBefore(node, cursor);
        cursor = node.nextSibling;
      }
    },
    unmount() {
      table.remove();
      nodes.clear();
    },
  };
}
