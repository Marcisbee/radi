#!/usr/bin/env node
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const help = `Usage: npx radi create <directory> --template <spa|ssr|ssg|go>

Creates a starter without installing dependencies or overwriting existing files.
Requires Node.js 22 or newer. The Go starter also requires Go and Clang; see its README.`;

async function create() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(help);
    return;
  }
  const [command, directory, flag, template] = args;
  if (
    args.length !== 4 || command !== 'create' || flag !== '--template' ||
    !['spa', 'ssr', 'ssg', 'go'].includes(template) || directory.startsWith('-')
  ) {
    throw new Error(help);
  }
  const target = resolve(directory);
  const entries = await readdir(target).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  if (entries.length) {
    throw new Error('Destination must be empty; no files were changed.');
  }
  await writeTemplate(target, template);
  console.log(`Created ${template} starter in ${target}`);
  console.log(
    '\nNext: enter that directory, then run:\n  npm install\n  npm run dev',
  );
  if (template === 'go') {
    console.log(
      '\nRead README.md for the required Go/Clang environment first.',
    );
  }
}

async function writeTemplate(target, template) {
  const { version } = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url)),
  );
  await mkdir(target, { recursive: true });
  const source = fileURLToPath(
    new URL(`./templates/${template}/`, import.meta.url),
  );
  for (const entry of await readdir(source)) {
    await cp(resolve(source, entry), resolve(target, entry), {
      recursive: true,
      force: false,
      errorOnExist: true,
    });
  }
  await rename(resolve(target, 'gitignore'), resolve(target, '.gitignore'));
  const path = resolve(target, 'package.json');
  const pkg = JSON.parse(await readFile(path));
  pkg.name = basename(target).toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
    'radi-app';
  pkg.dependencies = { radi: version };
  await writeFile(path, JSON.stringify(pkg, null, 2) + '\n');
  if (template === 'go') {
    const mod = resolve(target, 'go.mod');
    await writeFile(
      mod,
      (await readFile(mod, 'utf8')).replace('RADI_VERSION', `v${version}`),
    );
  }
}

create().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
