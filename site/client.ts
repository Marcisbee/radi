import { resume } from '../src/resume.ts';
import { increment } from './handler.ts';

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
});

document.addEventListener('DOMContentLoaded', () => {
  const menu = document.querySelector<HTMLDialogElement>('#mobile-navigation')!;
  const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
  toggle.hidden = false;
  toggle.addEventListener('click', () => menu.showModal());
  menu.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest('a, [data-close-menu]')) menu.close();
    if (target === menu) {
      const bounds = menu.getBoundingClientRect();
      if (
        event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom
      ) menu.close();
    }
  });
  matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
    if (event.matches) menu.close();
  });
  for (
    const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')
  ) button.hidden = false;
  const links = [
    ...document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'),
  ];
  const headings = [
    ...document.querySelectorAll<HTMLElement>(
      'main section[id], main article[id]',
    ),
  ]
    .filter((heading) => links.some((link) => link.hash === `#${heading.id}`));
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
    observer.observe(section.querySelector('h1, h2, h3')!)
  );
  observer.observe(document.querySelector('footer')!);
  window.addEventListener('hashchange', updateCurrent);
  updateCurrent();
});
