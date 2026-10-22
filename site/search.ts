export function setupSearch() {
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')!;
  const input = document.querySelector<HTMLInputElement>('#search-input')!;
  const results = document.querySelector('#search-results')!;
  const status = document.querySelector('#search-status')!;
  const sections = [
    ...document.querySelectorAll<HTMLElement>(
      'main section[id], main article[id]',
    ),
  ].map((element) => {
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('article, button, .anchor-mark').forEach((node) =>
      node.remove()
    );
    return {
      id: element.id,
      title:
        element.querySelector('h1, h2, h3')?.textContent?.replace(/#$/, '') ??
          '',
      text: [...copy.querySelectorAll('p, pre, h1, h2, h3')].map((node) =>
        node.textContent
      ).join(' ').replace(/\s+/g, ' '),
    };
  });
  for (
    const trigger of document.querySelectorAll<HTMLButtonElement>(
      '[data-search]',
    )
  ) {
    trigger.hidden = false;
    trigger.addEventListener('click', () => dialog.showModal());
  }
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else dialog.showModal();
    }
  });
  dialog.querySelector('[data-close-search]')!.addEventListener(
    'click',
    () => dialog.close(),
  );
  results.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a');
    if (!link) return;
    dialog.close();
    const target = document.querySelector<HTMLElement>(link.hash);
    target?.setAttribute('tabindex', '-1');
    target?.focus({ preventScroll: true });
  });
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const matches = query
      ? sections.filter((section) => section.text.toLowerCase().includes(query))
      : [];
    results.replaceChildren(
      ...matches.map((section) => searchResult(section, query)),
    );
    status.textContent = !query
      ? 'Start typing to search the guide.'
      : matches.length
      ? `${matches.length} matching topics`
      : 'No matching topics. Try “update”, “JSX”, or “static”.';
  });
}

function searchResult(
  section: { id: string; title: string; text: string },
  query: string,
) {
  const link = document.createElement('a');
  link.href = `#${section.id}`;
  const title = document.createElement('strong');
  highlight(title, section.title, query);
  const description = document.createElement('span');
  const match = section.text.toLowerCase().indexOf(query);
  const start = Math.max(0, match - 60);
  const end = Math.min(section.text.length, match + query.length + 100);
  const excerpt = (start ? '…' : '') + section.text.slice(start, end) +
    (end < section.text.length ? '…' : '');
  highlight(description, excerpt, query);
  link.append(title, description);
  return link;
}

function highlight(target: HTMLElement, text: string, query: string) {
  let cursor = 0;
  const lower = text.toLowerCase();
  let match = lower.indexOf(query);
  while (match !== -1) {
    target.append(text.slice(cursor, match));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(match, match + query.length);
    target.append(mark);
    cursor = match + query.length;
    match = lower.indexOf(query, cursor);
  }
  target.append(text.slice(cursor));
}
