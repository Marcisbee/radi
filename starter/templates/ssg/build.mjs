import { cp, rm } from 'node:fs/promises';
import { build } from 'esbuild';

await rm('dist', { recursive: true, force: true });
await build({
  entryPoints: ['pages.tsx'],
  outfile: '.radi-pages.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  jsx: 'automatic',
  jsxImportSource: 'radi/server',
});
try {
  await import('./.radi-pages.mjs');
} finally {
  await rm('.radi-pages.mjs', { force: true });
}
await cp('style.css', 'dist/style.css');
if (process.argv.includes('--serve')) await import('./preview.mjs');
