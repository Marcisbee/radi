export function App() {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>Radi SSR</title>
        <link rel='stylesheet' href='/style.css' />
      </head>
      <body>
        <main>
          <p>Radi / SSR</p>
          <h1>Make something yours.</h1>
          <p>
            This page renders on each request. Edit <code>app.tsx</code>{' '}
            to begin.
          </p>
          <p>
            Rendered at <time>{new Date().toISOString()}</time>
          </p>
          <a href='https://radi.js.org'>Read the Radi guide</a>
        </main>
      </body>
    </html>
  );
}
