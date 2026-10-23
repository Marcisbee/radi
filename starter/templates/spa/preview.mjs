import { context } from 'esbuild';

const ctx = await context({});
const { host, port } = await ctx.serve({
  servedir: 'dist',
  host: '127.0.0.1',
  port: Number(process.env.PORT || 3000),
});
console.log(`http://${host}:${port}`);
