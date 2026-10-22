const { test } = require('node:test');
const assert = require('node:assert/strict');
const draftRelease = require('./draft-release.cjs');

test('keeps one draft current, then advances after human publication', async () => {
  const releases = [{ id: 1, tag_name: 'v0.4.2', draft: false }];
  let sha = 'first-master-commit';
  let messages = ['fix: repair rendering'];
  const github = {
    paginate: async (method, options, map) => {
      if (method === github.rest.repos.listReleases) return structuredClone(releases);
      assert.equal(options.basehead, `${releases.filter((release) => !release.draft).at(-1).tag_name}...${sha}`);
      return map({ data: { commits: messages.map((message) => ({ commit: { message } })) } });
    },
    rest: { repos: {
      listReleases() {},
      compareCommitsWithBasehead() {},
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

  messages.push('feat: add streaming');
  await draftRelease({ github, context });
  assert.equal(releases.length, 3);
  assert.equal(releases[2].tag_name, 'v0.6.0');

  // A leftover automatic draft of an already published version is not current.
  const stale = { ...releases[1], id: 99, draft: true };
  releases.push(structuredClone(stale));
  const published = structuredClone(releases[1]);
  sha = 'latest-master-commit';
  context.sha = sha;
  await draftRelease({ github, context });
  assert.equal(releases.length, 4);
  assert.equal(releases[2].target_commitish, sha);
  assert.equal(releases[2].tag_name, 'v0.6.0');
  assert.deepEqual(releases[1], published);
  assert.deepEqual(releases[3], stale);
  releases.pop();

  releases.push({ ...releases[2], id: 100, tag_name: 'v0.7.0' });
  await assert.rejects(draftRelease({ github, context }), /Multiple automatic release drafts/);
  releases.pop();

  // An unrelated manual draft must never be overwritten.
  releases[2].body = 'Manual release';
  await assert.rejects(draftRelease({ github, context }), /already exists/);
  assert.equal(releases[2].body, 'Manual release');

  messages = [];
  await draftRelease({ github, context });
  assert.equal(releases.length, 3);
});
