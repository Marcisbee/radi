const { version: baseline } = require('../../deno.json');
const marker = '<!-- radi-automatic-release -->';
const stable = /^(?:v)?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const compare = (a, b) => {
  const left = a.replace(/^v/, '').split('.').map(Number);
  const right = b.replace(/^v/, '').split('.').map(Number);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
};

module.exports = async ({ github, context }) => {
  if (!stable.test(baseline)) throw new Error('deno.json needs a stable version');
  const repo = context.repo;
  const releases = await github.paginate(github.rest.repos.listReleases, repo);
  const previous = releases.filter((release) =>
    !release.draft && !release.prerelease && stable.test(release.tag_name)
  ).sort((a, b) => compare(b.tag_name, a.tag_name))[0];
  const parts = previous?.tag_name.replace(/^v/, '').split('.').map(Number);
  const next = parts ? `${parts[0]}.${parts[1]}.${parts[2] + 1}` : baseline;
  const version = compare(baseline, next) > 0 ? baseline : next;
  const tag = `v${version}`;
  const drafts = releases.filter((release) => release.draft && release.body?.includes(marker));
  if (drafts.length > 1) throw new Error('Multiple automatic release drafts exist');
  if (releases.some((release) => release.tag_name === tag && release.id !== drafts[0]?.id)) {
    throw new Error(`Release ${tag} already exists`);
  }
  const target = context.sha;
  const { data: notes } = await github.rest.repos.generateReleaseNotes({
    ...repo,
    tag_name: tag,
    target_commitish: target,
    ...(previous ? { previous_tag_name: previous.tag_name } : {}),
  });
  const release = {
    ...repo,
    tag_name: tag,
    target_commitish: target,
    name: tag,
    body: `${marker}\n${notes.body}`,
    draft: true,
    prerelease: false,
  };
  if (drafts[0]) {
    await github.rest.repos.updateRelease({ ...release, release_id: drafts[0].id });
  } else {
    await github.rest.repos.createRelease(release);
  }
};
