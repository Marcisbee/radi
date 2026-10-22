import { build } from 'esbuild';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { cpus, platform, release } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

process.chdir(fileURLToPath(new URL('.', import.meta.url)));
const options = { samples: 10, warmup: 3 };
for (const arg of process.argv.slice(2)) {
  const match = /^--(samples|warmup)=(\d+)$/.exec(arg);
  if (!match) {
    throw new Error(`Unknown argument ${arg}; use --samples=N --warmup=N`);
  }
  options[match[1]] = Number(match[2]);
}
if (options.samples < 1) throw new Error('At least one sample is required');
const frameworks = ['radi', 'react', 'preact', 'vue', 'vanilla'];
const scenarios = [
  'create-1000',
  'create-10000',
  'replace',
  'append',
  'update-10th',
  'update-all',
  'swap',
  'reverse',
  'remove',
  'select',
  'clear',
  'unmount',
];
const html = (name) =>
  `<!doctype html><meta charset="utf-8"><title>Benchmark fixture</title>
<style>body{font:16px system-ui}table{border-collapse:collapse}td{padding:2px 8px}.selected{background:#ddd}</style>
<main></main><script type="module" src="/${name}.js"></script>`;

async function bundles() {
  const output = {};
  for (const name of frameworks) {
    const result = await build({
      entryPoints: ['browser.js'],
      bundle: true,
      minify: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      write: false,
      alias: { 'benchmark-adapter': resolve(`adapters/${name}.js`) },
      define: {
        'process.env.NODE_ENV': '"production"',
        __VUE_OPTIONS_API__: 'false',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      },
    });
    output[name] = result.outputFiles[0].contents;
  }
  return output;
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return {
    median: sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    min: sorted[0],
    max: sorted.at(-1),
    samples: values,
  };
}

async function openPage(browser, base, name) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  try {
    await page.goto(`${base}/${name}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => window.benchmark);
  } catch (error) {
    await context.close();
    throw error;
  }
  return { page, context, errors };
}

async function evaluate(page, method, value) {
  let timer;
  try {
    return await Promise.race([
      page.evaluate(([method, value]) => window.benchmark[method](value), [
        method,
        value,
      ]),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${method}/${value} exceeded 30 seconds`)),
          30000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function measure(browser, base, name) {
  const { page, context, errors } = await openPage(browser, base, name);
  try {
    const timings = {};
    for (const scenario of scenarios) {
      const samples = [];
      for (let index = -options.warmup; index < options.samples; index++) {
        const result = await evaluate(page, 'sample', scenario);
        if (index >= 0) samples.push(result);
      }
      timings[scenario] = Object.fromEntries(
        ['commitMs', 'frameMs'].map((
          metric,
        ) => [metric, stats(samples.map((sample) => sample[metric]))]),
      );
    }
    const memory = await measureMemory(page);
    if (errors.length) throw new Error(errors.join('\n'));
    return { timings, memory };
  } finally {
    await context.close();
  }
}

async function measureMemory(page) {
  const cdp = await page.context().newCDPSession(page);
  const measurements = { empty: [], mounted: [], cycled: [] };
  for (let index = 0; index < options.samples; index++) {
    for (const stage of Object.keys(measurements)) {
      await evaluate(page, 'memory', stage);
      await cdp.send('HeapProfiler.collectGarbage');
      const heap = await cdp.send('Runtime.getHeapUsage');
      measurements[stage].push(heap.usedSize);
    }
  }
  await cdp.detach();
  return Object.fromEntries(
    Object.entries(measurements).map(([key, values]) => [key, stats(values)]),
  );
}

async function startup(browser, base, name) {
  const values = [];
  for (let index = 0; index < options.samples; index++) {
    const { page, context, errors } = await openPage(browser, base, name);
    try {
      values.push(await page.evaluate(() => window.benchmark.readyMs));
      if (errors.length) throw new Error(errors.join('\n'));
    } finally {
      await context.close();
    }
  }
  return stats(values);
}

function report(result) {
  const lines = [
    '# Framework comparison',
    '',
    `Run: ${result.environment.date}`,
    '',
    `Radi revision: ${result.environment.revision}; Chromium ${result.environment.browser}.`,
    `${options.samples} measured samples, ${options.warmup} warmups per operation. Lower is better.`,
    '',
    '| Metric (median) | Radi | React | Preact | Vue | Vanilla |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];
  const row = (label, get) =>
    lines.push(
      `| ${label} | ${
        frameworks.map((name) => get(result.frameworks[name]).toFixed(2)).join(
          ' | ',
        )
      } |`,
    );
  row('Application JS, raw KiB', (r) => r.bundle.raw / 1024);
  row('Application JS, gzip KiB', (r) => r.bundle.gzip / 1024);
  row('Application JS, Brotli KiB', (r) => r.bundle.brotli / 1024);
  row('Fresh-context startup, ms', (r) => r.startup.median);
  for (const scenario of scenarios) {
    row(`${scenario}, commit ms`, (r) => r.timings[scenario].commitMs.median);
  }
  for (const scenario of scenarios) {
    row(`${scenario}, frame ms`, (r) => r.timings[scenario].frameMs.median);
  }
  for (const stage of ['empty', 'mounted', 'cycled']) {
    row(`${stage} JS heap, MiB`, (r) => r.memory[stage].median / 1024 ** 2);
  }
  lines.push(
    '',
    'Raw samples, p95, ranges, frame latency, exact versions, and host details are in results.json.',
    'These are local synthetic workloads, not universal rankings. See README.md for methodology and limitations.',
    '',
  );
  return lines.join('\n');
}

const assets = await bundles();
const server = createServer((request, response) => {
  const path = request.url.slice(1);
  const name = path.replace(/\.js$/, '');
  if (!frameworks.includes(name)) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader(
    'Content-Type',
    path.endsWith('.js') ? 'text/javascript' : 'text/html',
  );
  response.end(path.endsWith('.js') ? assets[name] : html(name));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const base = `http://127.0.0.1:${server.address().port}`;
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const result = {
    environment: {
      date: new Date().toISOString(),
      revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
        .trim(),
      dirty: Boolean(
        execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
          .trim(),
      ),
      browser: browser.version(),
      node: process.version,
      platform: platform(),
      release: release(),
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      versions: pkg.devDependencies,
      viewport: '1280x800',
      ...options,
    },
    frameworks: {},
  };
  // Record the rotation so order effects can be checked across complete runs.
  const offset = Math.floor(Date.now() / 1000) % frameworks.length;
  result.environment.order = [
    ...frameworks.slice(offset),
    ...frameworks.slice(0, offset),
  ];
  for (const name of result.environment.order) {
    console.log(`Measuring ${name}...`);
    result.frameworks[name] = {
      bundle: {
        raw: assets[name].length,
        gzip: gzipSync(assets[name]).length,
        brotli: brotliCompressSync(assets[name]).length,
      },
      startup: await startup(browser, base, name),
      ...await measure(browser, base, name),
    };
  }
  await mkdir('results', { recursive: true });
  await writeFile(
    'results/results.json',
    `${JSON.stringify(result, null, 2)}\n`,
  );
  await writeFile('results/report.md', report(result));
  console.log(report(result));
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
