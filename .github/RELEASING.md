# npm releases

Pushes and merged PRs on `master` create or update one draft GitHub release.
The next version uses all commits since the highest published stable GitHub
release and selects the largest Conventional Commit bump:

- `fix:` (and `perf:`) increments patch.
- `feat:` increments minor and resets patch.
- `!` in the header or a `BREAKING CHANGE:` / `BREAKING-CHANGE:` footer increments
  minor while on `0.x`, or major after `1.0.0`, resetting lower components.
- Other types and legacy messages fall back to patch.

`deno.json` remains a minimum version. Set it to `1.0.0` deliberately when ready
for a stable API; breaking changes never automatically promote `0.x` to `1.x`.
Without a previous stable release, its version bootstraps the first draft.
With no commits since the previous release, refreshing does nothing.
Further pushes recompute the version and update the same draft, so adding a
feature can change a pending `0.5.1` draft into `0.6.0`.

Use Conventional Commit PR titles and squash merge with that title. The PR-title
check validates syntax; the author and reviewer must classify compatibility
changes correctly. Direct pushes must use the same commit convention.
GitHub generates the notes, which may need editing for changes without PRs.

The draft targets the current `master` commit SHA. Review the tag, target, and
notes, then publish the draft in GitHub. That human action triggers
`publish-npm.yml`: it checks out the release tag, tests, builds with the tag's
version, and publishes `radi` to npm's `latest` channel. It does not push version
commits back to `master`. Prereleases are intentionally skipped; the existing
manual alpha publishing command remains available.

## One-time setup

In GitHub repository settings, allow squash merging and set the default squash
commit title to the PR title and the message to the PR description. Use squash merging for release classification;
ordinary merge/rebase merges retain individual commits and their release signals.
The `Check PR title / title` check should be required in the repository's branch
rules if merges must be prevented when a title is invalid.

In npm's `radi` package settings, add a GitHub Actions trusted publisher:

- Organization/user: `Marcisbee`
- Repository: `radi`
- Workflow filename: `publish-npm.yml`
- Environment: leave empty
- Allow direct `npm publish` if the settings offer allowed actions

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
No npm token secret is needed. GitHub Actions must be enabled and permitted to
write repository contents for draft releases. The workflows use GitHub-hosted
runners and Node 24 with a compatible npm CLI.

## Recovery

Before publication, leave the release as a draft to stop npm publishing. Each
push regenerates draft notes, so make final edits immediately before publishing.
Do not pre-create or move the draft's tag: an existing tag takes precedence over
its target SHA when GitHub publishes a release.

If tests, building, or authentication fails, fix the cause and rerun the failed
publish job. npm versions are immutable: if publication already succeeded,
do not republish or move the tag. Ship a new version for corrections. For a code
failure in the tagged source, merge a fix and publish a new draft instead.
The Draft release workflow can also be run manually on `master` to refresh it.
