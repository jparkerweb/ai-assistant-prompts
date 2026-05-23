# PR Create & Status Operations

> Part of [ai-assist-git-pr](../SKILL.md) — loaded during Create and Status modes.
> See also: github-pr-describe.md (context gathering, diff analysis, description drafting — loaded alongside this file for Create mode).
> **Known consumers:** ai-assist-git-pr

This file contains the workflow steps for creating PRs and checking merge readiness. Create Mode references github-pr-describe.md for shared context gathering and analysis logic. Status is a standalone read-only check.

---

## Create Mode

**Trigger:** "create", "open", "new PR"
**Safety:** Gated

### Steps

**Step 0 — Pre-flight:**

Detect the repo's default branch first — never assume a branch name (often main, develop or master):
- `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` → cache as `$base`

Then run these checks using `$base`:

1. **Protected branch** — refuse if current branch matches `$base` or other protected patterns. Adapt to the repo — some teams protect `develop`, `release/*`, `canary`, etc.
2. **Auth** — `gh auth status`
3. **Freshness** — `git fetch origin $base`
4. **Commits ahead** — `git log origin/$base..HEAD --oneline`. If empty: abort, nothing to PR.
5. **Behind check** — `git merge-base --is-ancestor origin/$base HEAD`. Exit 1 = behind.
6. **Push check** — `git ls-remote --heads origin "$branch"` (empty = no remote). `git rev-list --count origin/$branch..HEAD 2>/dev/null || echo "all"` (count unpushed).

   **Combine rebase + push into one gate.** Assess both checks (5-6) before presenting any approval. Present a single prompt covering all needed actions:

   - **Behind + unpushed:** "Branch is behind `origin/$base` and has X unpushed commits. I'll rebase onto `$base` and push — this will be visible to the team and trigger CI. Proceed?"
   - **Behind only:** "Branch is behind `origin/$base`. Rebase recommended before creating PR. Proceed?"
   - **Unpushed only:** "X unpushed commits on `$branch`. Push will be visible to the team and trigger CI. Proceed?"
   - **Neither:** continue to Step 1.

   On approval, execute in order: rebase first (if behind), then push (if unpushed). On rebase conflict: stop, report conflicting files, let user resolve. On dirty tree: stop, tell user to commit or stash first. Push: `git push -u origin "$branch"` (`-u` is idempotent). Verify: `git log origin/$branch..HEAD --oneline` — must be empty.

**Step 1 — Check for existing PR:**
`gh pr view --json number,url,state 2>/dev/null` — check existence AND state:
- **OPEN PR exists** → suggest Describe: "PR #N is already open. Update its description instead?"
- **MERGED/CLOSED PR exists** → proceed with Create. Note: "Creating new PR (follows previously merged PR #N)."
- **No PR (exit code 1)** → proceed with Create.

**Step 2 — Gather full context:**

Build a complete picture before writing anything. Collect from all available sources — code is always authoritative.

Read `references/github-pr-describe.md` — follow the Context Gathering procedure. Use `git diff origin/$base...HEAD` for the code diff.

**Step 3 — Analyze and synthesize:**

Apply the Change Analysis Framework from `references/github-pr-describe.md`. Then reconcile:
- What is the coherent story of the change? Lead with the primary change.
- Are there changes that look like separate concerns? (Follow-up fixes, scope expansion, opportunistic cleanup.) Describe them on their own merits.
- What's NOT changed that a reviewer would expect? Note gaps honestly.

Read `references/github-pr-templates.md` — select the template matching this PR's size (small: 1-5 files, medium: 5-15, large: 15+). Generate title: `<imperative verb> <key change>` (max 72 chars).

Draft PR body following the selected template structure exactly — use the `| Area | Change | Why |` table for medium+ PRs, include Key Decisions when non-obvious choices were made, and end with Test Plan. Ground content in what the code shows, enriched by project context where it aligns.

**Step 4 — Preview (gated):**
Present title and full body to user. This is a gated action — require explicit approval before proceeding.

**Step 5 — Create PR:**
On approval: write body to a temp file, re-read the temp file to verify content is complete, then run `gh pr create --title "<title>" --body-file <path>`. Omit `--base` to use repo default; if user specified a different base, pass `--base <branch>`.

**Step 6 — Verify:**
`gh pr view --json url --jq '.url'` — confirm PR was created. Report URL to user.

> 📋 [PR Create] Created PR #[N]: [title] — [url]

---

## Status Mode

**Trigger:** "ready", "status", "CI", "merge", "checks"
**Safety:** Auto (read-only — no approval needed)

### Steps

**Step 1 — Fetch PR data:**
```
gh pr view --json state,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,isDraft,additions,deletions,changedFiles,baseRefName,headRefName
```

Check state first:
- **MERGED** → skip merge-readiness checks. Show merged report (Step 3).
- **CLOSED** → show closed report (Step 3).
- **OPEN** → proceed with full merge-readiness report.

**Step 2 — Fetch CI checks:**
```
gh pr checks
```

**Step 3 — Present merge readiness report:**

```
📋 [PR Status] PR #[N]: [title]

Merge State:    [CLEAN/BLOCKED/BEHIND/UNKNOWN] (from mergeStateStatus)
CI Checks:      [X passed, Y failed, Z pending] (from statusCheckRollup)
Review:         [APPROVED/CHANGES_REQUESTED/REVIEW_REQUIRED/none] (from reviewDecision)
Conflicts:      [MERGEABLE/CONFLICTING/UNKNOWN] (from mergeable)
Draft:          [Yes/No] (from isDraft)
Size:           [+additions/-deletions] across [changedFiles] files
Base:           [baseRefName] ← [headRefName]
```

If all green: "Ready to merge."
If blocked: list each blocker with what needs to happen.

**If state is MERGED:**

```
📋 [PR Status] PR #[N]: [title] — MERGED

Merged into:   [baseRefName] ← [headRefName]
Size:          [+additions/-deletions] across [changedFiles] files
```

**If state is CLOSED:**

```
📋 [PR Status] PR #[N]: [title] — CLOSED

Status:        Closed without merging
Size:          [+additions/-deletions] across [changedFiles] files
```
