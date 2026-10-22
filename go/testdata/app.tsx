import { data, defineApp } from '../../src/go.ts';
import { createElement, Fragment } from '../../src/server-html.ts';

export const app = defineApp((request) => {
  const path = request.url.split('?')[0];
  if (path === '/data') return data('read');
  if (path === '/loop') { while (true) {} }
  if (path === '/microtasks') {
    return new Promise(() => {
      const loop = () => Promise.resolve().then(loop);
      loop();
    });
  }
  if (path === '/heap') {
    const arrays = [];
    while (true) arrays.push(new Array(100000).fill('memory'));
  }
  if (path === '/error') throw new Error('private-secret');
  if (path === '/reject') return Promise.reject(new Error('private-secret'));
  if (path === '/late-error') return <main>shell{Promise.reject(new Error('private-secret'))}</main>;
  if (path === '/never') return new Promise(() => {});
  if (path === '/calls') return Promise.all(Array.from({ length: 50 }, () => data('read')));
  if (path === '/large') return 'x'.repeat(20000000);
  if (path === '/slow') {
    return <main>{Array.from({ length: 10000 }, () => () => data<string>('chunk'))}</main>;
  }
  if (path === '/isolation') {
    const state = globalThis as typeof globalThis & { seen?: boolean };
    const result = state.seen ? 'leaked' : 'fresh';
    state.seen = true;
    return result;
  }
  return <main>shell{data<string>('read')}<br />tail 🦊</main>;
});
