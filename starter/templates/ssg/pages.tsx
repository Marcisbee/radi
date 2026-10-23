import { generateStaticSite } from 'radi/static';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

await generateStaticSite([
  {
    path: '/',
    title: 'Radi SSG',
    head: <link rel='stylesheet' href='/style.css' />,
    render: () => (
      <main>
        <p>Radi / SSG</p>
        <h1>Make something yours.</h1>
        <p>
          This page is generated at build time. Edit <code>pages.tsx</code>{' '}
          to begin.
        </p>
        <a href='/about/'>About this starter</a>
      </main>
    ),
  },
  {
    path: '/about/',
    title: 'About / Radi SSG',
    head: <link rel='stylesheet' href='/style.css' />,
    render: () => (
      <main>
        <h1>Just HTML.</h1>
        <p>
          Deploy the dist directory to a static host. No server runtime is
          needed.
        </p>
        <a href='/'>Back home</a>
      </main>
    ),
  },
], async (path, html) => {
  const file = join('dist', path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
});
