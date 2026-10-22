import { createElement as h, renderToStringAsync } from './server-html.ts';
import type { ServerChild } from './server-html.ts';

export interface StaticPage {
  /** Root-relative route, e.g. / or /guide/getting-started/. */
  path: string;
  title: string;
  /** Called once at build time. May return async server content. */
  render: () => ServerChild;
  head?: ServerChild;
  lang?: string;
  /** URL of a bundled classic script that installs radi/resume. */
  bootstrap?: string;
}

export type StaticWriter = (path: string, html: string) => void | Promise<void>;

function outputPath(route: string): string {
  if (
    !route.startsWith('/') || /[\\%?#:\s<>"|*\u0000-\u001f\u007f]/u.test(route)
  ) {
    throw new TypeError(`Invalid static route: ${route}`);
  }
  const parts = route.slice(1).split('/');
  if (parts.at(-1) === '') parts.pop();
  if (parts.some((part) => !part || part === '.' || part.endsWith('.'))) {
    throw new TypeError(`Invalid static route: ${route}`);
  }
  return [...parts, 'index.html'].join('/');
}

async function renderPage(page: StaticPage): Promise<string> {
  const document = h(
    'html',
    { lang: page.lang ?? 'en' },
    h(
      'head',
      null,
      h('meta', { charset: 'utf-8' }),
      h('meta', {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      }),
      h('title', null, page.title),
      page.head ?? [],
      // Capture is installed before the parser reaches interactive content.
      page.bootstrap ? h('script', { src: page.bootstrap }) : [],
    ),
    h('body', null, page.render()),
  );
  return '<!doctype html>' + await renderToStringAsync(document);
}

/** Generate one document at a time. The caller owns storage and asset bundling. */
export async function generateStaticSite(
  pages: readonly StaticPage[],
  write: StaticWriter,
): Promise<string[]> {
  const paths = pages.map((page) => outputPath(page.path));
  if (new Set(paths).size !== paths.length) {
    throw new TypeError('Duplicate static routes');
  }
  for (const [index, page] of pages.entries()) {
    await write(paths[index], await renderPage(page));
  }
  return paths;
}
