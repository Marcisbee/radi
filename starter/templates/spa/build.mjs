import { cp, mkdir } from 'node:fs/promises';
import { build, context } from 'esbuild';

await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('style.css', 'dist/style.css');
const options = {
  entryPoints: ['app.tsx'],
  outfile: 'dist/app.js',
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  jsxImportSource: 'radi',
};
if (process.argv.includes('--serve')) {
  const ctx = await context(options);
  await ctx.watch();
  const { host, port } = await ctx.serve({
    servedir: 'dist',
    host: '127.0.0.1',
    port: Number(process.env.PORT || 3000),
  });
  console.log(`http://${host}:${port}`);
} else {
  await build({ ...options, minify: true });
}
