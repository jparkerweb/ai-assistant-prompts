---
name: ai-assist-npm-update
description: "Bulk-update outdated npm dependencies across one or more package.json files. Finds every package.json in the current working directory (recursively, skipping node_modules), runs npm outdated, bumps each outdated dependency to its 'wanted' version prefixed with ^, then runs npm install. Use whenever the user wants to update npm dependencies, bump packages to their wanted versions, refresh package.json versions, or run npm outdated and apply the results — including across a monorepo or multiple projects at once. Triggers on: update npm packages, update dependencies, bump npm versions, npm outdated, refresh package.json."
argument-hint: "[--dry-run] [--root <path>]"
---

# npm Update

Update outdated npm dependencies across every `package.json` under the current working directory. For each project the skill bumps each outdated dependency's version specifier to `^<wanted>` (the "wanted" version reported by `npm outdated`, i.e. the highest version satisfying the existing semver range), then runs `npm install` to refresh the lockfile and `node_modules`.

This is a deterministic, scripted workflow — run the bundled script rather than performing the steps by hand.

## When to use

Invoke when the user wants to update npm dependencies to their latest in-range versions, refresh `package.json` version numbers, or apply `npm outdated` results in bulk. Works for a single project or a whole monorepo with many `package.json` files.

## What "wanted" means

`npm outdated` reports three versions per package: **current** (installed), **wanted** (the newest version allowed by the existing semver range in `package.json`), and **latest** (the newest published). This skill updates to **wanted** — the safe, in-range upgrade — not `latest`. After the bump, the specifier is rewritten as `^<wanted>` so future installs allow compatible minor/patch updates.

## Workflow

### Step 1 — (Recommended) Preview with a dry run

Run the script with `--dry-run` first to show the user exactly which dependencies would change, without writing any files or installing:

```bash
node skills/ai-assist-npm-update/scripts/npm-update.mjs --dry-run
```

Use the path to `scripts/npm-update.mjs` relative to wherever the skill is installed. Present the listed changes to the user and confirm before applying — dependency bumps modify lockfiles and can affect builds.

### Step 2 — Apply the updates

Once confirmed (or if the user asked to just do it), run without `--dry-run`:

```bash
node skills/ai-assist-npm-update/scripts/npm-update.mjs
```

The script will, for each `package.json` it finds:

1. Run `npm outdated --json --long` in that project's directory.
2. For every outdated dependency (across `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`), rewrite its version specifier to `^<wanted>`.
3. Write `package.json` back, preserving the original indentation and trailing newline.
4. Run `npm install` in that directory to update the lockfile and `node_modules`.

Projects that are already up to date are left untouched.

### Step 3 — Report

Summarize for the user: which projects were updated, which dependencies were bumped (and from/to what), and flag any project where `npm install` failed so they can investigate.

## What the script handles

- **Recursive discovery** of `package.json` files, skipping `node_modules`, `.git`, `dist`, `build`, `vendor`, and other vendored/VCS/output folders so it only touches real project manifests.
- **Non-semver specs** (git URLs, `file:` links, `MISSING`) are skipped — only normal `x.y.z` version ranges are rewritten.
- **`npm outdated` exit code** — npm exits non-zero when packages are outdated; the script captures the JSON output regardless.
- **Formatting preservation** — keeps the file's existing indentation and trailing newline so diffs stay minimal.

## Options

- `--dry-run` — list every change without writing files or running `npm install`.
- `--root <path>` — search a directory other than the current working directory.

## Notes

- Requires Node.js and npm on the PATH (the script invokes `npm` directly).
- Updating to `wanted` stays within existing semver ranges, so it's low-risk — but it still changes lockfiles. After running, suggest the user run their build/tests to confirm nothing broke.
- Version specifiers are always rewritten as `^<wanted>` regardless of the original form (`~`, exact, `>=`). If specific packages deliberately use `~` or exact pins, review the diff before committing.
- If the project is a publishable library (has `files` or `publishConfig` in `package.json`), review any `peerDependencies` changes before committing — bumping them changes the declared compatibility range for consumers of your package.
- This skill does not upgrade to `latest` (major-version) versions. If the user wants major upgrades, that's a different, riskier operation — tell them to use a tool like `npm-check-updates` instead.
