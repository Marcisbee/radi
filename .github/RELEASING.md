# npm releases

The same repository tag versions the Go module and `radi/go` npm entry point.
The npm package also contains the `radi create` executable and all four starter
templates. Generated projects pin that package's version; the Go starter pins
the matching repository tag. No separate initializer package or publisher is
needed. Check release tooling validates generated SPA/SSR/SSG projects from an
npm tarball; Go embedded server validates the generated Go binary. These checks
substitute the unreleased local artifacts for dependencies until the release
tag and npm version exist. Publish the normal draft release to make the new
generator available through `npx radi@latest`.
The Go embedded server workflow must pass before publishing; it also builds a
Linux amd64 example artifact. See [Go build and release instructions](../docs/go-server.md).

## CI cost limits

Superseded PR checks are cancelled automatically. Source/path filters avoid Go,
package, and documentation jobs when their inputs have not changed. Job limits
are 10 minutes for Go and publishing, 8 for package checks, 5 for documentation,
3 for drafting, and 2 for titles. Compiler/browser installation steps stop after
3 minutes. A timeout is a failed check, never a successful validation.

Client/package and Go checks run on relevant PRs or manual dispatch, not again
on every push to master. Go uses one race-enabled test run across all packages;
the extra 20-second soak check runs only on manual dispatch or a published
release. The Go/browser integration remains part of relevant PR checks.

This assumes changes go through checked PRs. After a direct push to master,
manually run **Check release tooling** and, for Go/server/router changes,
**Go embedded server** on that revision before release. Manual Go validation
also provides the pre-release soak check. Documentation deployment and draft
release creation still run on master; npm publishing still validates the tag.

The Go browser check uses the runner's preinstalled Google Chrome via
`RADI_BROWSER_CHANNEL=chrome`, avoiding a second browser/dependency installation.
Local Go checks default to Playwright's bundled Chromium. Other browser checks
install only Chromium's headless shell. Keep the exact Playwright
version in workflows and browser tests aligned, including the Rion dependency
resolution in deno.lock. Playwright 1.64.1 supports the Go job's Ubuntu 26.04
runner; the former 1.56.1 pin did not. Go example artifacts are built/uploaded
only on release and retained for 7 days; PR documentation builds do not upload
deployment artifacts. Release publishing and master documentation deployment
are not cancelled by newer PRs.

When intentionally pausing paid CI, a commit containing `[skip ci]` skips push
and pull-request workflows. Such a commit is not CI-validated: before release,
push a normal commit or otherwise obtain passing checks for the release source.

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
Automatic drafts at or below the latest published stable version are left
untouched and excluded from draft selection. Multiple future automatic drafts
still stop the workflow for investigation; manual drafts are never overwritten.

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
