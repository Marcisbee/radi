import { defineApp } from 'radi/go';

export const app = defineApp((request) => (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <title>Radi Go</title>
    </head>
    <body>
      <main>
        <h1>Radi with Go</h1>
        <p>This page renders inside embedded V8. Edit app.tsx to begin.</p>
        <p>Request: {request.url}</p>
        <a href='https://radi.js.org'>Read the Radi guide</a>
      </main>
    </body>
  </html>
));
