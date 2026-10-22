import { resume } from '../src/resume.ts';
import { increment } from './handler.ts';
import { setupSearch } from './search.ts';

resume(document, { increment: () => Promise.resolve(increment) }, {
  onError: () => {
    const status = document.querySelector('.demo [role=status]');
    if (status) {
      status.textContent = 'Could not update the counter. Please try again.';
    }
  },
});

document.addEventListener('click', async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('[data-copy]');
  if (button) {
    const source = button.closest('figure')?.querySelector('code')?.textContent;
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select code to copy';
    }
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  }
  if (event.target.closest('.mobile-contents a')) {
    document.querySelector<HTMLDetailsElement>('.mobile-contents')!.open =
      false;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  for (
    const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')
  ) button.hidden = false;
  const headings = [
    ...document.querySelectorAll<HTMLElement>('main section[id]'),
  ];
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'),
  ];
  let previous = '';
  const updateCurrent = () => {
    const atEnd = window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;
    const current = atEnd
      ? headings.at(-1)!.id
      : headings.findLast((heading) =>
        heading.getBoundingClientRect().top <= 150
      )?.id ?? 'overview';
    if (current === previous) return;
    previous = current;
    for (const link of links) {
      if (link.hash === `#${current}`) {
        link.setAttribute('aria-current', 'location');
      } else link.removeAttribute('aria-current');
    }
  };
  const observer = new IntersectionObserver(updateCurrent, {
    rootMargin: '-150px 0px 0px 0px',
    threshold: [0, 1],
  });
  headings.forEach((section) =>
    observer.observe(section.querySelector('h1, h2')!)
  );
  observer.observe(document.querySelector('footer')!);
  window.addEventListener('hashchange', updateCurrent);
  updateCurrent();
});
