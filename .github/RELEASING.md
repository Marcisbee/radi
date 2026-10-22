# npm releases

Pushes and merged PRs on `master` create or update one draft GitHub release.
The next version is a patch above the highest published stable GitHub release,
or `deno.json`'s version if that is higher. The first draft on the current
history is `v0.5.0`. Raise `deno.json` before merging to choose a minor or major
release. Direct commits also trigger draft updates; GitHub generates the notes,
which may need editing for changes without PRs.

The draft targets the current `master` commit SHA. Review the tag, target, and
notes, then publish the draft in GitHub. That human action triggers
`publish-npm.yml`: it checks out the release tag, tests, builds with the tag's
version, and publishes `radi` to npm's `latest` channel. It does not push version
commits back to `master`. Prereleases are intentionally skipped; the existing
manual alpha publishing command remains available.

## One-time setup

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
