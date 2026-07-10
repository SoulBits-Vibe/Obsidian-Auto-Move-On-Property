# Agent Instructions

This repository is an Obsidian community plugin. Before committing, tagging, or publishing a release, complete the checklist below. Do not guess. Inspect the current source, generated files, package metadata, Git state, and GitHub release state.

Use the official Obsidian developer docs as the source of truth:

- https://docs.obsidian.md/Home
- https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- https://docs.obsidian.md/oo/plugin

## Obsidian Pre-Release Checklist

### Source Checks

- Run `npm run build` and fix all TypeScript errors.
- Check Obsidian community plugin scanner findings before releasing. Treat scanner errors as release blockers.
- Search for direct style assignments such as `.style.`. Prefer Obsidian-approved helpers such as `setCssStyles`, `setCssProps`, or CSS classes.
- Check for APIs newer than the declared `minAppVersion` in `manifest.json` and `versions.json`.
- Check for deprecated Obsidian APIs in `node_modules/obsidian/obsidian.d.ts`.
- Avoid unnecessary type assertions and unsafe assignments from `any`. Load unknown data as `unknown`, validate it, then assign typed settings.
- If a replacement API is newer than `minAppVersion`, do not use it unless the release intentionally raises `minAppVersion`.

### Settings UI Checks

- Do not add a top-level heading that says `Settings`, `General`, or the plugin name. Obsidian already shows the plugin name in the settings sidebar.
- Use `new Setting(containerEl).setName(...).setHeading()` only for real section headings.
- Do not create heading elements directly with `createEl("h1")`, `createEl("h2")`, or similar.
- Keep settings labels short, concrete, and user-facing.
- Prefer standard Obsidian setting components over custom HTML when a standard component exists.

### Public Metadata Checks

- Confirm the canonical public author identity before every release. For this plugin, Obsidian metadata should use lowercase `soulbits-vibe` exactly, even if GitHub displays the account with different casing.
- Check and update author metadata anywhere it appears in project files, including:
  - `manifest.json`
  - `README.md`
  - `LICENSE`
  - release notes
  - GitHub repository URLs
  - generated or bundled release files
- In `manifest.json`, keep author metadata consistent:
  - `"author": "soulbits-vibe"`
  - `"authorUrl": "https://github.com/soulbits-vibe"`
- Search tracked files for outdated author names, private identifiers, local paths, private notes, secrets, API keys, tokens, and internal references before committing.
- Public author references for this project should use `soulbits-vibe` exactly.
- Before a public commit, confirm the local Git author identity is appropriate.
- Use the GitHub noreply identity unless the user explicitly asks otherwise:
  - `soulbits-vibe <soulbits-vibe@users.noreply.github.com>`

### Version Bump Checks

- Bump the version consistently in:
  - `manifest.json`
  - `package.json`
  - `package-lock.json`
  - `versions.json`
- Add the new version to `versions.json` with the correct minimum Obsidian version.
- Rebuild after the version bump so `main.js` matches `main.ts`.
- Confirm the version in `manifest.json` matches the intended Git tag and GitHub Release.

### Release Checks

- Inspect the exact diff before committing.
- Run `git diff --check`.
- Commit only intended files.
- Push `main`.
- Create and push the matching version tag.
- Create a GitHub Release for the tag.
- Attach the required Obsidian release files:
  - `main.js`
  - `manifest.json`
  - `styles.css`, only if the plugin has one
- Verify the GitHub Release is not a draft, is not a prerelease unless intended, is marked latest when appropriate, and contains the required assets.

### Final Confirmation

- Confirm `git status --short --branch` is clean and synced.
- Confirm the latest GitHub Release version matches `manifest.json`.
- Confirm the release assets can be seen on GitHub.
- Tell the user exactly what was pushed, tagged, and released.

## Signature

Written for future agents by Codex, an OpenAI coding agent.
