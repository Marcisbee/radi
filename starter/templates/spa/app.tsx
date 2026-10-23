import { createRoot, update } from 'radi';

function Counter(this: HTMLElement) {
  let count = 0;
  return (
    <button
      type='button'
      onclick={() => {
        count++;
        update(this);
      }}
    >
      Count: {() => count}
    </button>
  );
}

createRoot(document.getElementById('app')!).render(
  <main>
    <p>Radi / SPA</p>
    <h1>Make something yours.</h1>
    <p>
      This page renders in your browser. Edit <code>app.tsx</code> to begin.
    </p>
    <Counter />
    <p>
      <a href='https://radi.js.org'>Read the Radi guide</a>
    </p>
  </main>,
);
