import { data, defineApp } from 'radi/go';

async function Title() {
  const row = await data<{ title: string }>('page', { id: 'home' });
  return <h1>{row.title}</h1>;
}

export const app = defineApp(() => (
  <html lang="en">
    <head><title>Radi with Go</title></head>
    <body><p>Streaming from Go and embedded V8.</p><Title /></body>
  </html>
));
