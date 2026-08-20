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

> **Run each command below as its own separate tool call.** Do not `&&`/`;`-chain them and do not prefix with `cd <path> &&` — PowerShell rejects `&&` (`The token '&&' is not a valid statement separator`) and bash-style `/c/...` paths. See the §Scripts Portability rule in SKILL.md.

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

Build a complete picture before writing anything. Collect from all available sources — code is authoritative.

Read `references/github-pr-describe.md` — follow the Context Gathering procedure. Use `git diff origin/$base...HEAD` for the code diff.

**Step 3 — Analyze and synthesize:**

Apply the Change Analysis Framework from `references/github-pr-describe.md`. Then reconcile:
- Does the code match the ticket intent? Note divergences.
- Are there changes not explained by the ticket? (Follow-up fixes, scope expansion, opportunistic cleanup.) Describe them on their own merits.
- Are there ticket requirements NOT addressed in this PR? Don't mention them in the description — they're not in this PR.

Read `references/github-pr-templates.md` — select the template matching this PR's size (small: 1-5 files, medium: 5-15, large: 15+). Generate title: `<TICKET-ID>: <imperative verb> <key change>` (max 72 chars).

Draft PR body following the selected template structure exactly — use the `| Area | Change | Why |` table for medium+ PRs, include Key Decisions when non-obvious choices were made, and end with Test Plan. Ground content in what the code shows, enriched by project context where it aligns. End with `AI Assisted` only — never append `🤖 Generated with Claude Code` or any agent branding (strip it if your runtime adds it; see `github-pr-templates.md` §Attribution).

**Step 4 — Preview (gated):**
Present title and full body to user. This is a gated action — require explicit approval before proceeding.

**Step 5 — Create PR:**

> **Preconditions** (do NOT proceed until ALL true):
> - ✅ `github-pr-describe.md` §Change Analysis Framework has been read in this session
> - ✅ `github-pr-templates.md` §Create Template has been read in this session
> - ✅ `github-pr-operations.md` §Write Verification has been read in this session
> - ✅ Pre-flight checks from Step 0 all passed
> - ✅ User has approved the title + body preview (Gated)
>
> If any precondition is unmet, STOP and report which one. Do not run `gh pr create`.

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

---

## Post-Create Follow-Up

> **Loaded by:** SKILL.md Step 1 Post-Create State Auto-Detection sub-rule, when `gh pr view --json createdAt` returns a value < 30 minutes ago AND there are new bot comments / failing or pending checks.

### Reality

After `gh pr create` returns, expect a 1–3 minute lag before Copilot's automated review lands and CI checks complete. Users frequently re-invoke `/ai-assist-git-pr` on the same branch within that window expecting the skill to surface the new state.

### Detection Query

Run once at the start of every invocation that resolves to Comments / Status / ambiguous mode AND has an active OPEN PR:

Capture `status` AND `conclusion` AND `state` for every check — GitHub Actions checks (`CheckRun`) leave `state` null and report via `status`/`conclusion`; only legacy `StatusContext` checks populate `state`. The jq below pre-computes `failing` / `pending` flags so the trigger never has to guess which field family applies:

```bash
gh pr view --json number,createdAt,reviewDecision,statusCheckRollup,comments,reviews \
  --jq '{
    number,
    createdAt,
    ageMinutes: (((now - (.createdAt | fromdateiso8601)) / 60) | floor),
    reviewDecision,
    checks: [.statusCheckRollup[] | {name: (.name // .context), status, state, conclusion}],
    failing: [.statusCheckRollup[] | select(
      (.conclusion // "" | IN("FAILURE","ERROR","CANCELLED","TIMED_OUT","ACTION_REQUIRED")) or
      (.state      // "" | IN("FAILURE","ERROR"))
    )] | length,
    pending: [.statusCheckRollup[] | select(
      (.status // "" | IN("QUEUED","IN_PROGRESS","PENDING")) or
      (.state  // "" | IN("PENDING","EXPECTED"))
    )] | length,
    botComments: [.comments[] | select((.author.login // "") | endswith("[bot]")) | {author: .author.login, createdAt}],
    botReviews: [.reviews[] | select((.author.login // "") | endswith("[bot]")) | {author: .author.login, state, submittedAt}]
  }'
```

### Trigger Conditions

Surface the post-create banner when ALL true:

- `ageMinutes < 30` — covers Copilot review latency (<2 min typical) plus normal CI (<25 min typical). Adjust if your CI pipeline runs longer.
- `botComments` non-empty OR `botReviews` non-empty OR `failing > 0` OR `pending > 0`

> **Note on `botComments`:** the query lists *all* bot comments on the PR, not only those newer than `createdAt`. Because the `ageMinutes < 30` gate already bounds this to freshly-created PRs, the distinction rarely matters — but on a PR that had bot comments before a force-update, treat the list as "current bot comments," not strictly "new since create." Eyeball `createdAt` on each before claiming it's new.

### Banner Format

```
📋 [Post-Create Follow-Up Detected]

PR #N — [title]
Created [N]m ago — [URL]

Bot comments / reviews:
  • <author>: <state or comment summary> ([Nm] ago)

Check status:
  • <check name>: <state> [conclusion if any]

Continuing with [mode]...
```

### Routing After Banner

- If the user's intent was **Status**: present the banner; the banner already contains the check status, so no further work needed unless they ask for next steps.
- If the user's intent was **Comments**: present the banner, then continue normally — the new bot comments are now part of the Comments-mode pipeline.
- If the user's intent was **ambiguous**: present the banner, then ask: *"Address bot comments now, or check status only?"*
- If the user's intent was **Create** but a PR already exists (post-create re-invocation pattern): present the banner, then suggest: *"PR already exists. Did you mean `address comments` or `check status`?"*

### Anti-Patterns

- **Do not** silently auto-fix bot comments without explicit user approval (Comments-mode gate still applies)
- **Do not** suppress the banner if findings exist — visibility is the point
- **Do not** trigger the banner for PRs > 30 minutes old (those are normal Comments-mode invocations, not post-create follow-ups)
