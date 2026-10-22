/** Production SSR comparison. Run each case in a fresh process. */
type Props = Record<string, unknown>;
type Create = (
  type: string | ((props: never) => unknown),
  props: Props | null,
  ...children: unknown[]
) => unknown;
type Output =
  | string
  | Promise<string>
  | ReadableStream<Uint8Array>
  | Promise<ReadableStream<Uint8Array>>;
interface Adapter {
  create: Create;
  render: (tree: unknown) => Output;
}

const framework = Deno.args[0] ?? 'radi';
const workload = Deno.args[1] ?? 'elements';
const transport = Deno.args[2] ?? 'string';
const rows = Number(Deno.args[3] ?? 1000);
const iterations = Number(Deno.args[4] ?? 200);
if (Deno.env.get('NODE_ENV') !== 'production') {
  throw new Error('Set NODE_ENV=production');
}
if (
  !['elements', 'components'].includes(workload) ||
  !['string', 'stream'].includes(transport)
) {
  throw new Error(
    'Usage: server-compare.ts radi|react|preact|vue elements|components string|stream [rows] [iterations]',
  );
}
if (
  !Number.isSafeInteger(rows) || rows < 1 ||
  !Number.isSafeInteger(iterations) || iterations < 1
) throw new Error('Positive integer rows and iterations required');

async function adapter(): Promise<Adapter> {
  if (framework === 'radi') {
    const m = await import('../src/server.ts');
    return {
      create: m.createElement as Create,
      render: (transport === 'stream'
        ? m.renderToReadableStream
        : m.renderToString) as Adapter['render'],
    };
  }
  if (framework === 'react') {
    const m = await import('npm:react@19.2.0');
    const s = await import('npm:react-dom@19.2.0/server');
    return {
      create: m.createElement as Create,
      render: (transport === 'stream'
        ? s.renderToReadableStream
        : s.renderToStaticMarkup) as Adapter['render'],
    };
  }
  if (framework === 'preact') {
    const m = await import('npm:preact@10.26.8');
    const s = await import('npm:preact-render-to-string@6.5.13');
    const stream = await import('npm:preact-render-to-string@6.5.13/stream');
    return {
      create: m.h as Create,
      render: (transport === 'stream'
        ? stream.renderToReadableStream
        : s.renderToString) as Adapter['render'],
    };
  }
  if (framework === 'vue') return vueAdapter();
  throw new Error(`Unknown framework: ${framework}`);
}

async function vueAdapter(): Promise<Adapter> {
  const m = await import('npm:vue@3.5.22');
  const s = await import('npm:@vue/server-renderer@3.5.22');
  const create = m.h as (
    tag: unknown,
    props: Props | null,
    children: unknown,
  ) => unknown;
  return {
    create: (tag, props, ...children) =>
      create(tag, props, children.length === 1 ? children[0] : children),
    render:
      (transport === 'stream'
        ? s.renderToWebStream
        : s.renderToString) as Adapter['render'],
  };
}

const { create: h, render } = await adapter();
function row(i: number): unknown {
  return h('p', { 'data-id': i }, `Row ${i} <&`, h('b', null, 'value'));
}
function Row(input: never): unknown {
  const props = framework === 'radi'
    ? (input as () => Props)()
    : input as Props;
  const child = row(props.i as number);
  // Radi emits a host boundary; peers emit it explicitly for identical output.
  return framework === 'radi' ? child : h('host', null, child);
}
function page(): unknown {
  return h(
    'main',
    framework === 'react' ? { className: 'page' } : { class: 'page' },
    Array.from(
      { length: rows },
      (_, i) => workload === 'components' ? h(Row, { i }) : row(i),
    ),
  );
}
async function output(): Promise<string> {
  const result = await render(page());
  return typeof result === 'string' ? result : new Response(result).text();
}
const expected = '<main class="page">' +
  Array.from({ length: rows }, (_, i) => {
    const html = `<p data-id="${i}">Row ${i} &lt;&amp;<b>value</b></p>`;
    return workload === 'components' ? `<host>${html}</host>` : html;
  }).join('') + '</main>';
if (await output() !== expected) {
  throw new Error('Rendered HTML differs from the fixture');
}
for (let warmup = 0; warmup < 100; warmup++) await output();
const samples: number[] = [];
for (let repeat = 0; repeat < 5; repeat++) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) await output();
  samples.push(iterations * 1000 / (performance.now() - start));
}
console.log(
  JSON.stringify({
    framework,
    workload,
    transport,
    rows,
    iterations,
    warmups: 100,
    outputChars: expected.length,
    runtime: Deno.version,
    rendersPerSecond: samples,
    median: samples.toSorted((a, b) => a - b)[2],
  }),
);
// React's scheduler can keep a MessageChannel alive after measurement.
Deno.exit(0);
