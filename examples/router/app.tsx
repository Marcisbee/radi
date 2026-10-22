import { data, defineApp } from 'radi/go';
import type { PageData } from './page.ts';

async function Outlet(props: () => { id: string }) {
  const page = await data<PageData>('page', { id: props().id });
  return (
    <main id='outlet' data-initial={JSON.stringify(page)}>
      <h1>{page.title}</h1>
      <p>
        Visits: <output>{page.visits}</output>
      </p>
    </main>
  );
}

export const app = defineApp((request) => {
  const path = request.url.split('?')[0];
  const id = path === '/'
    ? 'home'
    : decodeURIComponent(path.slice('/pages/'.length).replace(/\/$/, ''));
  return (
    <html lang='en'>
      <head>
        <title>Radi routing example</title>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='stylesheet' href='/assets/style.css' />
      </head>
      <body>
        <header>
          <p>Radi · Non-production routing example</p>
          <nav aria-label='Pages'>
            <a href='/'>Home</a> · <a href='/pages/about'>About</a>
          </nav>
          <p>
            <label>
              Shared note{' '}
              <input id='note' placeholder='Kept while navigating' />
            </label>
          </p>
          <p id='status' role='status'>Starting…</p>
        </header>
        <Outlet id={id} />
        <script type='module' src='/assets/client.js'></script>
      </body>
    </html>
  );
});
