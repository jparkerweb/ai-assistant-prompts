---
name: ai-assist-changelog-bump
description: "Validate and fix the CHANGELOG.md version number before opening a PR, commiting, or pushing changes, and keep package.json's version aligned with it. Reads main branch to determine the current latest version, classifies changes on the current branch, and proposes the correct next semver. Use this skill when the user mentions changelog, version number, preparing a PR, release version, semver check, or says 'check the changelog', 'what version should this be', 'prepare for PR', or 'fix the version'. Also use proactively when you notice a CHANGELOG entry that may have an incorrect version number."
---

# Local Changelog Validator

Ensure the CHANGELOG.md entry for the current branch has the correct semver version before a PR is opened, commit is made, or changes are pushed. This skill exists because parallel branches independently pick version numbers that collide or leap-frog when merged — this validates against main's actual state right before the PR.

## Workflow

### Step 1 — Gather state

Run these commands to understand the current situation:

```bash
# 1. Current latest version on main
git show main:CHANGELOG.md | head -20

# 2. Current branch name (for ticket ID extraction)
git branch --show-current

# 3. What this branch changed (commit subjects)
git log main...HEAD --oneline

# 4. Files changed on this branch
git diff main...HEAD --name-only

# 5. Current package.json version, if the repo has one (for alignment)
git show main:package.json | grep '"version"'
```

Extract from main's CHANGELOG:
- The **latest version number** (first `## [x.y.z]` line)
- The **date** of that version

If a `package.json` exists, also note its `version` field — it should track the CHANGELOG's latest released version, and this skill keeps the two aligned (see Step 6).

Extract from the branch:
- The **list of changed files** to classify the change type
- The **commit messages** for changelog entry content

### Step 2 — Classify the change

Determine the change type by examining what was modified on this branch:

| Signal | Classification | Version Bump | Heading |
|--------|---------------|--------------|---------|
| New directory under `skills/` with a `SKILL.md` | New skill | **Minor** (x.Y.0) | `### Added` |
| New capability added to existing skill | New capability | **Patch** (x.y.Z) | `### Added` |
| Behavioral changes to existing skill(s) or docs | Behavior change | **Patch** (x.y.Z) | `### Changed` |
| Bug fix to existing skill(s) | Bug fix | **Patch** (x.y.Z) | `### Fixed` |
| Mix of the above | Use the **highest** bump (minor > patch) | Combine headings |

These rules come from `.agents-docs/AGENTS-contributing.md` — if they've been updated, defer to the current version of that file.

### Step 3 — Compute the correct version

Starting from main's latest version:
- **Minor bump:** increment the middle number, reset patch to 0 (e.g., `1.8.1` → `1.9.0`)
- **Patch bump:** increment the last number (e.g., `1.8.1` → `1.8.2`)

Use today's date in `YYYY-MM-DD` format.

### Step 4 — Check the current branch's CHANGELOG

Read the current `CHANGELOG.md` on the branch. Look for:

1. **No entry exists yet for this branch's work** — the branch hasn't added a version entry above main's latest. Proceed to Step 5 to draft one.

2. **An entry exists but the version is wrong** — the branch has a version entry, but it doesn't match the computed correct version (common when branches were rebased or other PRs merged first). Report the discrepancy:

   ```
   Version check for branch: {branch-name}

   Main is at:      {main-version}
   Branch claims:   {branch-version}  
   Correct version: {computed-version} ({classification})

   The version needs to be updated: {branch-version} → {computed-version}
   ```

   Ask: "Update the version to {computed-version}? (yes / no)"

3. **An entry exists and the version is correct** — report success:

   ```
   Version check for branch: {branch-name}

   Main is at:      {main-version}
   Branch version:  {branch-version} ({classification})

   Version is correct. CHANGELOG is ready for PR.
   ```

   Stop here unless the user asks for content changes.

### Step 5 — Draft or fix the CHANGELOG entry

**If no entry exists**, draft a new one based on the commits and changed files. Follow Keep a Changelog format:

```markdown
## [{computed-version}] - {YYYY-MM-DD}

### {Added|Changed|Fixed}

- **{skill-or-area}**: {concise description of what changed and why}
```

Present the draft and ask for approval before writing.

**If the version is wrong**, update only the version number and date — preserve the existing content unless the user asks for content changes too.

**If the date is stale** (entry exists with correct version but old date), update to today's date since this is when the PR will be opened.

After any changes, show the final CHANGELOG entry for confirmation.

### Step 6 — Align package.json (if it exists)

If the repo has a `package.json` with a `version` field, keep it in sync with the CHANGELOG's latest **released** version (the newest `## [x.y.z]` heading that is a real version, not `[Unreleased]`).

- After settling the CHANGELOG version in Step 5, read `package.json` and compare its `version` to that version.
- If they differ, update `package.json`'s `version` to match — change **only** the `version` field, preserving all other keys, ordering, and formatting (indentation, trailing newline).
- If they already match, leave `package.json` untouched and note it's already aligned.
- If the CHANGELOG's top entry is still `[Unreleased]` (no concrete version yet), do **not** touch `package.json` — there's no released version to align to. Mention that package.json will be bumped once the entry is given a real version.

Show the `version` change (old → new) for confirmation alongside the CHANGELOG entry. If a `package-lock.json` exists, remind the user it should be refreshed (e.g., via `npm install`) so the lockfile's top-level version matches — but don't run it automatically.

## Rules

- Never create a version entry without checking main first — the whole point is to derive the version from main's current state
- Always present changes before writing — the user should see and approve the CHANGELOG entry
- Keep bullet points concise — one sentence per change, focused on what changed and why
- If multiple change types exist (Added + Changed), use multiple headings under the same version
- The date should reflect when the PR is being prepared (today), not when the work started
- If the branch has no meaningful changes vs main (e.g., only non-skill files changed), say so and ask if a CHANGELOG entry is actually needed
- Keep `package.json`'s `version` aligned with the CHANGELOG's latest released version — only edit the `version` field, never reformat or reorder the rest of the file
- Never align `package.json` to an `[Unreleased]` heading — only to a concrete `x.y.z` version
