export function setupSearch() {
  const dialog = document.querySelector<HTMLDialogElement>('#search-dialog')!;
  const input = document.querySelector<HTMLInputElement>('#search-input')!;
  const results = document.querySelector('#search-results')!;
  const status = document.querySelector('#search-status')!;
  const sections = [
    ...document.querySelectorAll<HTMLElement>('main section[id]'),
  ];
  const trigger = document.querySelector<HTMLButtonElement>('[data-search]')!;
  trigger.hidden = false;
  trigger.addEventListener('click', () => dialog.showModal());
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
      ? sections.filter((section) =>
        section.textContent?.toLowerCase().includes(query)
      )
      : [];
    results.replaceChildren(...matches.map(searchResult));
    status.textContent = !query
      ? 'Start typing to search the guide.'
      : matches.length
      ? `${matches.length} matching topics`
      : 'No matching topics. Try “update”, “JSX”, or “static”.';
  });
}

function searchResult(section: HTMLElement) {
  const link = document.createElement('a');
  link.href = `#${section.id}`;
  const title = document.createElement('strong');
  title.textContent =
    section.querySelector('h1, h2')?.textContent?.replace(/#$/, '') ?? '';
  const description = document.createElement('span');
  description.textContent =
    section.querySelector('p:not(.eyebrow)')?.textContent ?? '';
  link.append(title, description);
  return link;
}
