import { strict as assert } from 'node:assert';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { join, resolve } from 'node:path';
import { chromium } from 'npm:playwright@1.64.1';

const repo = resolve(import.meta.dirname!, '..');
const npm = Deno.build.os === 'windows' ? 'npm.cmd' : 'npm';
const goOnly = Deno.env.get('RADI_TEST_GO') === '1';

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 180_000,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}\n${
      result.error ?? ''
    }`,
  );
  return result.stdout;
}

async function ready(url: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return await response.text();
      await response.body?.cancel();
    } catch { /* Wait for the process to bind. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

Deno.test({
  name: goOnly
    ? 'packed generator creates a runnable Go app'
    : 'packed generator creates runnable SPA, SSR, and SSG apps without overwriting files',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await Deno.mkdir(join(repo, 'dist'), { recursive: true });
    const work = await Deno.makeTempDir({
      dir: join(repo, 'dist'),
      prefix: 'starters-',
    });
    const browser = goOnly ? undefined : await chromium.launch({
      channel: Deno.env.get('RADI_BROWSER_CHANNEL') || undefined,
      args: ['--no-sandbox'],
    });
    try {
      const packed = JSON.parse(
        run(
          npm,
          ['pack', '--json', '--pack-destination', work],
          join(repo, 'npm'),
        ),
      );
      const tarball = join(work, packed[0].filename);
      const initializer = JSON.parse(
        run(
          npm,
          ['pack', '--json', '--pack-destination', work],
          join(repo, 'npm-starter'),
        ),
      );
      run(npm, [
        'install',
        '--no-audit',
        '--no-fund',
        join(work, initializer[0].filename),
      ], work);
      const create = (directory: string, template: string) =>
        run(npm, [
          'create',
          'radi',
          '--yes',
          '--',
          directory,
          '--template',
          template,
        ], work);
      for (const template of goOnly ? ['go'] : ['spa', 'ssr', 'ssg']) {
        const directory = join(work, `my ${template}`);
        if (template === 'ssg') await Deno.mkdir(directory);
        create(directory, template);
        assert.equal(
          (await Deno.stat(join(directory, '.gitignore'))).isFile,
          true,
        );
        const pkg = JSON.parse(
          await Deno.readTextFile(join(directory, 'package.json')),
        );
        const published = JSON.parse(
          await Deno.readTextFile(join(repo, 'npm/package.json')),
        );
        assert.equal(pkg.dependencies.radi, published.version);
        // Test the unreleased artifact, not an older registry version.
        run(npm, ['install', '--no-audit', '--no-fund', tarball], directory);
        if (template === 'go') {
          const mod = await Deno.readTextFile(join(directory, 'go.mod'));
          assert.ok(
            mod.includes(`github.com/Marcisbee/radi v${published.version}`),
          );
          run('go', [
            'mod',
            'edit',
            `-replace=github.com/Marcisbee/radi=${repo}`,
          ], directory);
        }
        run(npm, ['run', 'build'], directory);
        const port = goOnly ? 4388 : 4387;
        const process = spawn(
          template === 'go' ? './server' : 'node',
          template === 'go'
            ? []
            : [template === 'ssr' ? 'dist/server.js' : 'preview.mjs'],
          {
            cwd: directory,
            stdio: 'ignore',
            env: {
              ...Deno.env.toObject(),
              PORT: String(port),
              RADI_ADDR: `127.0.0.1:${port}`,
            },
          },
        );
        try {
          const url = `http://127.0.0.1:${port}`;
          const html = await ready(url);
          if (template === 'spa') {
            const page = await browser!.newPage();
            await page.goto(url);
            await page.getByRole('button', { name: 'Count: 0', exact: true })
              .click();
            await page.getByRole('button', { name: 'Count: 1', exact: true })
              .waitFor();
            await page.close();
          } else if (template === 'ssr') {
            assert.match(html, /Rendered at/);
            assert.match(html, /<time>\d{4}-/);
            assert.notEqual(await (await fetch(url)).text(), html);
            assert.equal((await fetch(`${url}/missing`)).status, 404);
          } else if (template === 'ssg') {
            assert.match(html, /generated at build time/);
            assert.doesNotMatch(html, /<script/);
            const about = await (await fetch(`${url}/about/`)).text();
            assert.match(about, /Just HTML/);
          } else {
            assert.match(html, /Radi with Go/);
            const path = await (await fetch(`${url}/hello?name=%3Cscript%3E`))
              .text();
            assert.match(path, /Request: \/hello\?name=%3Cscript%3E/);
          }
        } finally {
          if (process.exitCode === null) {
            const exited = once(process, 'exit');
            process.kill('SIGTERM');
            await exited;
          }
        }
      }
      if (!goOnly) {
        const occupied = join(work, 'occupied');
        await Deno.mkdir(occupied);
        await Deno.writeTextFile(
          join(occupied, 'keep.txt'),
          'Keep this content.',
        );
        for (
          const [directory, template, message] of [
            [occupied, 'spa', /Destination must be empty/],
            [join(work, 'invalid'), 'unknown', /Usage:/],
          ] as const
        ) {
          const result = spawnSync(npm, [
            'create',
            'radi',
            '--yes',
            '--',
            directory,
            '--template',
            template,
          ], { cwd: work, encoding: 'utf8' });
          assert.notEqual(result.status, 0);
          assert.match(result.stderr, message);
        }
        assert.equal(
          await Deno.readTextFile(join(occupied, 'keep.txt')),
          'Keep this content.',
        );
        assert.deepEqual(
          [...Deno.readDirSync(occupied)].map((entry) => entry.name),
          ['keep.txt'],
        );
        assert.equal(
          await Deno.stat(join(work, 'invalid')).catch(() => null),
          null,
        );
      }
    } finally {
      await browser?.close();
      await Deno.remove(work, { recursive: true });
    }
  },
});
