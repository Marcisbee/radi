import { cp } from 'node:fs/promises';
import { build } from 'esbuild';

await build({
  entryPoints: ['server.tsx'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  jsx: 'automatic',
  jsxImportSource: 'radi/server',
});
await cp('style.css', 'dist/style.css');
