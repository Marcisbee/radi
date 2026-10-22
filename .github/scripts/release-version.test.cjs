const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { nextVersion } = require('./release-version.cjs');

test('selects the largest semantic bump and keeps 0.x breaking releases below 1.0', () => {
  for (const [previous, messages, expected] of [
    ['v0.5.0', ['fix(dom): preserve keys'], '0.5.1'],
    ['v0.5.2', ['fix: repair keys', 'feat(ssr): add streaming'], '0.6.0'],
    ['v0.5.2', ['feat!: replace renderer'], '0.6.0'],
    ['v1.5.2', ['feat: add streaming', 'fix!: remove old API'], '2.0.0'],
    ['v1.5.2', ['refactor: change API\n\nBREAKING CHANGE: old API removed'], '2.0.0'],
    ['v1.5.2', ['refactor: change API\n\nBREAKING-CHANGE: old API removed'], '2.0.0'],
    ['v1.5.2', ['feat: add API'], '1.6.0'],
    ['v1.5.2', ['docs: explain usage', 'Update README', 'Merge pull request #12'], '1.5.3'],
    ['v1.5.2', ['docs: explain feat! syntax'], '1.5.3'],
  ]) assert.equal(nextVersion(previous, messages), expected);
});

test('PR title command accepts release signals and rejects missing or malformed titles', () => {
  const directory = mkdtempSync(join(tmpdir(), 'radi-title-'));
  const event = join(directory, 'event.json');
  try {
    for (const [title, status] of [
      ['feat(renderer)!: replace API', 0], ['fix: repair rendering', 0],
      ['ci: update release workflow', 0], ['Update rendering', 1],
      ['feat: ', 1], ['feat: add API\nfix: hidden title', 1],
      ['fix: $(echo unsafe)', 0],
    ]) {
      writeFileSync(event, JSON.stringify({ pull_request: { title } }));
      const result = spawnSync(process.execPath, [join(__dirname, 'check-pr-title.cjs')], {
        env: { ...process.env, GITHUB_EVENT_PATH: event }, encoding: 'utf8',
      });
      assert.equal(result.status, status, `${title}: ${result.stderr}`);
    }
  } finally {
    rmSync(directory, { recursive: true });
  }
});
