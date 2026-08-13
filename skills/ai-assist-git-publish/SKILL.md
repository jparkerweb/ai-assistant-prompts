---
name: ai-assist-git-publish
description: "Publish a GitHub Release when CHANGELOG.md's top version is ahead of the latest published release. Only invoke when the user explicitly types /ai-assist-git-publish. Never auto-trigger from general conversation about releases, tags, or versions."
---

# Git Publish

Publish a GitHub Release for the current repository whenever `CHANGELOG.md`'s top version is ahead of the latest release published on GitHub. This closes the loop after a version bump lands on the default branch — `ai-assist-changelog-bump` computes and merges the version number, this skill turns that merged CHANGELOG entry into an actual GitHub Release.

This skill is only invoked manually by the user — never auto-trigger.

**Prerequisites:** GitHub CLI (`gh`) installed and authenticated, and a git repo with a GitHub remote and a `CHANGELOG.md` at the repo root.

## Workflow

### Step 1 — Preflight

Run `git status --porcelain`. If the output is non-empty, stop immediately — do not switch branches or take any other action. Tell the user:

> Working tree has uncommitted changes. Commit or stash them, then re-run this skill.

Identify the repository and its default branch (never hardcode either — this skill runs in any repo):

```bash
gh repo view --json nameWithOwner,defaultBranchRef -q '.nameWithOwner + " " + .defaultBranchRef.name'
```

Store these as `$REPO` and `$DEFAULT_BRANCH`. If this command fails, the repo has no GitHub remote or `gh` isn't authenticated — report the error verbatim and stop.

If the current branch is not `$DEFAULT_BRANCH`, ask the user before switching:

> Currently on `<branch>`, but releases are published from `$DEFAULT_BRANCH`. Switch to `$DEFAULT_BRANCH` and pull latest? (yes / no)

On "no", stop. On "yes" (or if already on `$DEFAULT_BRANCH`), sync with the remote. Run these as two separate, non-chained commands — never `&&`/`;`-chain `git`/`gh` commands, since PowerShell pre-7 rejects `&&`:

```bash
git checkout $DEFAULT_BRANCH
git pull origin $DEFAULT_BRANCH
```

### Step 2 — Read CHANGELOG.md

Read `CHANGELOG.md` at the repo root. If it doesn't exist, tell the user and stop.

Parse the first version heading as `$CHANGELOG_VERSION`. CHANGELOGs use different heading conventions — all of these are valid and must be handled:

| Style | Example |
|-------|---------|
| Bracketed (Keep a Changelog) | `## [1.8.1] - 2026-08-13` |
| `v`-prefixed | `## v1.8.1 - 2026-08-13` |
| Bracketed + `v` | `## [v1.8.1] - 2026-08-13` |
| Bare | `## 1.8.1` |

Alternate date separators (`–`, `—`, `(2026-08-13)`) and a missing date also count as matches. A tolerant pattern:

```bash
grep -m1 -E '^##[[:space:]]+\[?v?[0-9]+\.[0-9]+\.[0-9]+\]?' CHANGELOG.md
```

Strip any surrounding `[`/`]` and any leading `v` — `$CHANGELOG_VERSION` is always bare semver (`1.8.1`).

Skip `## [Unreleased]` / `## Unreleased` headings — they are not concrete versions. If the top concrete heading is preceded only by an Unreleased section, that's fine; use the first real version. If there is **no** concrete version heading at all, tell the user there's nothing to publish and stop.

Capture the section body — everything from immediately after that heading up to (but not including) the next `##` version heading, or end-of-file if there is no next heading — as `$NOTES_BODY`.

### Step 3 — Determine the latest published release

```bash
gh release view --repo $REPO --json tagName -q .tagName
```

**There is no `latest` argument.** Bare `gh release view` (with no tag) already means "the latest release" — passing the literal word `latest` is treated as a tag name and fails with `release not found`.

Record the raw tag as `$LATEST_TAG` (used in Step 6 to match the repo's existing tag style), then strip any leading `v` to get `$RELEASE_VERSION`. If the command exits non-zero for **any** reason (no releases yet, transient error, etc.), set `$RELEASE_VERSION = "0.0.0"` and `$LATEST_TAG = ""` — no error-text matching is needed since the outcome is the same either way.

### Step 4 — Compare versions

Compare `$CHANGELOG_VERSION` vs `$RELEASE_VERSION` as a numeric `(major, minor, patch)` tuple. Never do a plain string/lexicographic compare — e.g. `"1.9.0" > "1.10.0"` is true as strings but wrong numerically.

### Step 5 — Not ahead: no-op

If `$CHANGELOG_VERSION` ≤ `$RELEASE_VERSION`, print a simple status message showing both versions and stop:

> CHANGELOG top version ($CHANGELOG_VERSION) is not ahead of the latest published release ($RELEASE_VERSION). Nothing to publish.

No error is raised and no release is created.

### Step 6 — Ahead: compute and confirm

If `$CHANGELOG_VERSION` > `$RELEASE_VERSION`, compute:

- `tag` — match the repo's existing tag style. If `$LATEST_TAG` starts with `v`, use `"v$CHANGELOG_VERSION"`; if it's a bare semver, use `"$CHANGELOG_VERSION"`. If there are no prior releases (`$LATEST_TAG` is empty), check existing git tags with `git tag --list --sort=-v:refname | head -5` and follow their style; default to `"v$CHANGELOG_VERSION"` when there's nothing to infer from.
- `title = "$CHANGELOG_VERSION"`
- `notes = "# What's New 🎉\n\n$NOTES_BODY"`

Present all of it to the user and wait for an explicit yes/no answer before any write happens:

> 🚀 [Publish Release — $REPO]
>
> CHANGELOG is ahead of the latest published release:
> - **Current release:** $RELEASE_VERSION
> - **CHANGELOG top version:** $CHANGELOG_VERSION
>
> Proposed release:
> - **Tag:** $tag
> - **Title:** $title
> - **Target:** $DEFAULT_BRANCH
> - **Notes:**
> ```
> $notes
> ```
>
> Publish this release? (yes / no)

### Step 7 — Publish (on approval)

On "yes", write `$notes` to a temp file — never pass multiline text inline via `--notes`, that regresses into a quoting bug — then create the release targeting the default branch:

**bash:**

```bash
NOTES_FILE=$(mktemp)
printf '%s' "$notes" > "$NOTES_FILE"
gh release create "$tag" --repo "$REPO" --title "$title" --notes-file "$NOTES_FILE" --target "$DEFAULT_BRANCH"
rm -f "$NOTES_FILE"
```

**PowerShell:**

```powershell
$NotesFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $NotesFile -Value $notes
gh release create "$tag" --repo "$Repo" --title "$title" --notes-file "$NotesFile" --target "$DefaultBranch"
Remove-Item -Path $NotesFile
```

Always delete the temp file afterward, regardless of whether the `gh release create` command succeeded or failed.

**Failure handling — already-exists classification:** if `gh release create` exits non-zero, inspect the error text.

- If and only if it contains the substring `already exists` (real output: `HTTP 422: Validation Failed` / `Release.tag_name already exists`), report this to the user as already published, not as a raw CLI error:

  > This version ($CHANGELOG_VERSION) was already published as a release — nothing more to do.

- Every other failure (auth, network, permissions, etc.) must be surfaced to the user verbatim. Never silently reclassify a genuine failure as "already published."

### Step 8 — Verify

Confirm the release now exists and report its URL:

```bash
gh release view "$tag" --repo "$REPO"
```

Report the release URL to the user.

## Rules

- Only run when the user explicitly invokes `/ai-assist-git-publish` — never auto-trigger
- Never modify `CHANGELOG.md`, `package.json`, or any other file — this skill only reads them
- Never run a local `git tag` or `git push` — tag creation is delegated entirely to `gh release create --target $DEFAULT_BRANCH`
- Never hardcode the repository or the default branch — always derive both from `gh repo view`
- Never switch branches without asking, and never proceed with a dirty working tree
- Match the repo's existing tag style (`v1.2.3` vs `1.2.3`) rather than assuming a `v` prefix
- Support all common CHANGELOG heading styles (`## [x.y.z]`, `## vx.y.z`, `## [vx.y.z]`, `## x.y.z`) and always compare bare semver numerically, never as strings
- Always use `--notes-file`, never inline multiline `--notes`
- Always clean up the temp notes file, even on a mid-run error
- Always get explicit user approval before any write (Step 6) — no release is created without a yes
- On a latest-release lookup failure (Step 3), treat it as "no prior release" (baseline `0.0.0`) — no error-text matching needed
- On a `gh release create` failure (Step 7), only reclassify as already-published when the error contains `already exists` — every other failure must be shown verbatim, never swallowed
- This skill is idempotent and safe to re-run at any time — re-running after a successful publish hits the Step 5 no-op, and re-running after a race-lost publish hits the Step 7 already-exists handling
