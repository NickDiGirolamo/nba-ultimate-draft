# Release Workflow

This project is already linked to Vercel and should treat `main` as the production branch.

## Recommended thread roles

### Worker threads

- Create or switch to a feature branch such as `codex/landing-refresh`
- Make code changes
- Commit finished work
- Open a preview deployment if you want a Vercel check before production
- Do not push `main` directly to production from a worker thread

### Release thread

- Owns final integration and production pushes
- Avoids feature editing unless a small release fix is required
- Pulls approved commits together on `main`
- Runs the final verification step
- Pushes `main` so Vercel updates the live URL

## Safe operating rule

Only the release thread should push `main`.

That keeps Vercel production tied to one controlled branch and prevents multiple threads from racing in the same working tree.

Direct pushing from a thread is still fine when that thread is intentionally acting as the release thread. The important distinction is not the button or terminal used to push; it is that the release thread owns the final status check, stages only intended product files, and pushes a verified `main` commit.

## Suggested release flow

1. A worker thread finishes work on its own branch and commits it.
2. The release thread reviews the approved branch or commit.
3. The release thread updates `main` by merging or cherry-picking that approved work.
4. The release thread runs:

```bash
npm run release:check
```

5. If the check passes, the release thread pushes:

```bash
git push origin main
```

6. Vercel deploys the new `main` commit to the live site.

## Staging guardrails

Before staging a release, inspect both tracked and untracked changes:

```bash
git status --short --branch
git diff --name-status
git ls-files --others --exclude-standard
```

Avoid `git add -A` from the repository root when there are local scratch folders, generated temp files, or nested worktrees present. Stage the intended product files explicitly, especially newly referenced files such as components and assets under `public/`.

If `npm run release:check -- -AllowDirty` passes, that only proves the current local files can build. Before production deploy, commit the intended changes and run the normal clean check:

```bash
npm run release:check
```

## What `npm run release:check` does

- Confirms the current branch is `main`
- Confirms the working tree is clean by default
- Runs the production build

If you need to validate while local edits are still present, you can override the clean-tree check:

```bash
npm run release:check -- -AllowDirty
```

That should be the exception, not the normal release path.

## Recommended branch naming

- `codex/<task-name>` for Codex thread work
- `feat/<task-name>` for larger user-managed features
- `fix/<task-name>` for focused bug fixes

## Practical note for this workspace

Because all threads share the same project files, the safest habit is:

- do feature work in worker threads
- commit finished work before handing it off
- let the release thread integrate only committed changes

If you want even stronger isolation later, use separate local clones or worktrees for release work.
