const { readFileSync } = require('node:fs');
const { header } = require('./release-version.cjs');
const { pull_request: pullRequest } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
if (!header.test(pullRequest.title)) {
  console.error('Use a Conventional Commit title, e.g. fix: repair rendering, feat: add an API, or feat!: replace an API.');
  process.exitCode = 1;
}
