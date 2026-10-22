import {
  createElement as h,
  renderToReadableStream,
  renderToString,
} from '../src/server.ts';
import { SERVER_RENDERER } from '../src/renderer.ts';

const rows = Number(Deno.args[0] ?? 1000);
const iterations = Number(Deno.args[1] ?? 200);
const mode = Deno.args[2] ?? 'writer';
// Both paths include tree creation, attributes, escaping and serialization.
function page<T>(
  create: (
    tag: string,
    props: Record<string, unknown> | null,
    ...children: (string | number | T | T[])[]
  ) => T,
): T {
  return create(
    'main',
    { className: 'page' },
    Array.from({ length: rows }, (_, i) =>
      create(
        'p',
        { 'data-id': i },
        `Row ${i} <&>`,
        create('b', null, 'value'),
      )),
  );
}
const render = mode === 'adapter'
  ? () => SERVER_RENDERER.renderToString!(page(SERVER_RENDERER.createElement))
  : () => renderToString(page(h));
async function consume(sample: () => void): Promise<number> {
  const reader = renderToReadableStream(page(h)).getReader();
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) return size;
    size += next.value.length;
    sample();
  }
}
for (let i = 0; i < 30; i++) {
  if (mode === 'stream') await consume(() => {});
  else render();
}
const runs = [];
for (let repeat = 0; repeat < 5; repeat++) {
  const before = Deno.memoryUsage();
  let peakHeap = before.heapUsed;
  let peakRss = before.rss;
  const sample = () => {
    const memory = Deno.memoryUsage();
    peakHeap = Math.max(peakHeap, memory.heapUsed);
    peakRss = Math.max(peakRss, memory.rss);
  };
  const start = performance.now();
  let length = 0;
  for (let i = 0; i < iterations; i++) {
    length = mode === 'stream' ? await consume(sample) : render().length;
    sample();
  }
  runs.push({
    rendersPerSecond: iterations * 1000 / (performance.now() - start),
    outputChars: length,
    sampledPeakHeapBytes: peakHeap,
    sampledPeakRssBytes: peakRss,
  });
}
const firstOutputMs = [];
if (mode !== 'adapter') {
  for (let repeat = 0; repeat < 5; repeat++) {
    const start = performance.now();
    const reader = renderToReadableStream(
      h('main', null, 'shell', new Promise(() => {})),
    ).getReader();
    await reader.read();
    firstOutputMs.push(performance.now() - start);
    await reader.cancel();
  }
}
console.log(
  JSON.stringify(
    { runtime: Deno.version, mode, rows, iterations, runs, firstOutputMs },
    null,
    2,
  ),
);
