const { test } = require('node:test');
const assert = require('node:assert/strict');
const draftRelease = require('./draft-release.cjs');

test('keeps one draft current, then advances after human publication', async () => {
  const releases = [{ id: 1, tag_name: 'v0.4.2', draft: false }];
  let sha = 'first-master-commit';
  const github = {
    paginate: async () => structuredClone(releases),
    rest: { repos: {
      listReleases() {},
      generateReleaseNotes: async () => ({ data: { body: 'Generated notes' } }),
      createRelease: async (release) => releases.push({ ...release, id: releases.length + 1 }),
      updateRelease: async ({ release_id, ...release }) => {
        Object.assign(releases.find(({ id }) => id === release_id), release);
      },
    } },
  };
  const context = { repo: { owner: 'Marcisbee', repo: 'radi' }, sha };
  await draftRelease({ github, context });
  assert.equal(releases[1].tag_name, 'v0.5.0');
  assert.equal(releases[1].draft, true);
  assert.equal(releases[1].target_commitish, sha);

  sha = 'second-master-commit';
  context.sha = sha;
  await draftRelease({ github, context });
  assert.equal(releases.length, 2);
  assert.equal(releases[1].tag_name, 'v0.5.0');
  assert.equal(releases[1].target_commitish, sha);

  releases[1].draft = false;
  await draftRelease({ github, context });
  assert.equal(releases[2].tag_name, 'v0.5.1');
  assert.equal(releases[2].draft, true);

  // An unrelated manual draft must never be overwritten.
  releases[2].body = 'Manual release';
  await assert.rejects(draftRelease({ github, context }), /already exists/);
  assert.equal(releases[2].body, 'Manual release');
});
