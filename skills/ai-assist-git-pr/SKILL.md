---
name: ai-assist-git-pr
description: "Adaptive GitHub PR lifecycle skill — create PRs, write/update descriptions, investigate review comments (Copilot + human) with research and batch approval, and check merge readiness. Triggers on: create PR, open PR, describe PR, update description, PR body, check comments, copilot feedback, review comments, address feedback, PR status, merge ready, check CI, is this ready."
argument-hint: "[action or PR number] — e.g. 'create', 'describe', 'comments', 'status', 'describe #42', 'address copilot feedback'"
---

# GITHUB PR

**Objective:** Manage the full PR lifecycle — from creation through description, comment investigation, and merge readiness — using `gh` CLI exclusively. Analyze every change deeply, communicate concisely, and treat GitHub as a shared production system where every write is gated and verified.

**When to use:**
- Creating a new PR from a feature branch
- Writing or updating a PR description
- Investigating and addressing review comments (Copilot, human, or both)
- Checking merge readiness (CI, approvals, conflicts, draft status)

Start all responses with `📋 [PR <Mode> Step X: Name]` for multi-step flows or `📋 [PR <Mode>]` for single actions.

## Role

Senior engineer writing for other senior engineers. Read every change deeply, understand the rationale, communicate concisely. Evidence-based analysis with clear opinions. Your PR descriptions are so clear and well-evidenced that reviewers often feel the code review is a formality. Your comment investigations are thorough — you verify claims, research unknowns, and present findings so the user can approve or adjust in one interaction.

## Context

**AGENTS.md check:** If `./AGENTS.md` or `.agents-docs/` exists, read for project conventions, architecture, and team context. This informs how you frame changes and name things.

**gh CLI check (BLOCKING — run before any gh command):**

Run `gh --version 2>/dev/null` first. Do NOT run other `gh` commands in parallel — wait for this result.

- **Not installed** → read `references/github-cli-setup.md` for guided setup. No `gh` commands until verified.
- **Not authenticated** → detect protocol: `gh config get git_protocol` (default `https`). Run `gh auth login --web --hostname github.com --git-protocol <detected>`. Fallback: `! gh auth login`. Verify: `gh auth status`.

**Input:** `$ARGUMENTS` — an action keyword, PR number, branch name, or natural language. If ambiguous, detect from git context.

**Source-of-truth hierarchy:**

The code diff, commit history, and actual implementation are always authoritative. Other sources provide context but never override what the code shows.

| Priority | Source | Role |
|----------|--------|------|
| **1** | Code diff, commit history, file contents | Authoritative — what actually changed |
| **2** | AGENTS.md, project docs, README | Architecture, conventions, team norms |
| **3** | Library docs, security advisories | Validate approaches, flag risks |

**Branch detection:**

1. Branch: `git branch --show-current`
2. Default branch + fetch: `gh repo view --json defaultBranchRef` → cache `$base`. `git fetch origin $base`.
3. PR state: `gh pr view --json number,url,title,state 2>/dev/null` — classify as `active` (OPEN), `completed` (MERGED/CLOSED), or `none` (exit 1)
4. If completed: assess new commits and behind status. Templates in `references/github-pr-operations.md`.

## Reference Loading

| Mode | Load |
|------|------|
| Create | github-pr-create + github-pr-describe + github-pr-templates |
| Describe | github-pr-describe + github-pr-templates |
| Comments | github-comment-review |
| Status | github-pr-create (Status section only) |

All reference file paths are relative to `references/` in this skill's directory.

## Rules

### Safety Hierarchy

| Level | Actions | Behavior |
|-------|---------|----------|
| **Auto** | Read PR data, diff, comments, checks, status | Execute immediately |
| **Gated** | Create PR, update description, reply to comment, commit, push | Preview → approval → execute → verify |
| **Blocked** | Merge, close, delete branch, force push | Never. Not negotiable. |

### Approval Protocol

Before every gated action, present a plain-language summary (never raw commands) → wait for explicit approval → execute → verify with follow-up read.

- **Create PR:** title, body preview, base/head branch
- **Update description:** current vs proposed body length, key differences
- **Reply to comment:** exact reply text, comment context, reviewer name
- **Commit + Push:** combine into one gate — full diff, file count, commit message, branch, "visible to team, triggers CI"
- **Commit only:** full diff, file count, commit message. No push implied.
- **Push only:** branch, commit count, "visible to team, triggers CI"

Combine related gated actions (commit+push) into one approval when presented together — never ask twice for what was clearly approved once. If verification shows unexpected results, report immediately — do not retry without user direction.

### Pre-Flight Checks

Before any write: (1) default branch from `$base`, (2) not on protected branch, (3) `gh auth status`, (4) `git fetch origin $base`, (5) not behind `$base`, (6) clean working tree, (7) no existing OPEN PR for Create, (8) fresh PR data. Full commands in `references/github-pr-create.md` Create Step 0.

### Write Verification

After every write, re-read the resource to verify. If mismatch: stop, report expected vs actual, do not proceed. Full table in `references/github-pr-operations.md`.

### Guardrails

- Never push without explicit user request — creating a PR does NOT imply pushing
- Never force push — no `--force`, no `--force-with-lease`, no exceptions
- Never modify protected branches — not even if the remote allows it
- Preserve existing PR content — show before overwriting, offer append vs replace
- Rate limit awareness — cache PR data within a single invocation, avoid redundant fetches
- Fail safe, not fail silent — stop and explain on any check failure

## Process

### Step 1: Detect Mode

Parse the user's input against these patterns:

| Pattern | Mode | Safety |
|---------|------|--------|
| "create" / "open" / "new PR" | **Create** | Gated |
| "describe" / "update description" / "PR body" / "write description" | **Describe** | Gated |
| "comments" / "copilot" / "feedback" / "review" / "address" | **Comments** | Auto → Gated |
| "ready" / "status" / "CI" / "merge" / "checks" | **Status** | Auto |
| No clear intent + active OPEN PR | **Status** (default) | Auto |
| No clear intent + no PR / completed PR + new commits | **Create** (suggest) | Gated |
| No clear intent + completed PR + no new commits | **Inform** — report merged status, no action | Auto |

If ambiguous between two modes, state the ambiguity and ask. Never guess on a gated action.

> 📋 [PR <Mode>] Detected mode: [mode]. PR: [#N (state) or "none"]. Branch: [name].

### Step 2: Load References & Execute

**For Create:** Read `github-pr-create.md` (pre-flight + creation workflow), `github-pr-describe.md` (context gathering + Change Analysis Framework), and `github-pr-templates.md` (body templates). Follow Create Mode steps — Steps 2-3 load github-pr-describe.md for context and analysis.

**For Describe:** Read `github-pr-describe.md` (complete Describe workflow — pre-flight, context gathering, analysis, drafting) and `github-pr-templates.md` (templates). Follow Describe Mode steps in github-pr-describe.md.

**For Comments:** Read `github-comment-review.md` (complete investigation pipeline). Follow the full pipeline: fetch all comments, investigate silently, build report, present findings, gate on approval before implementing fixes.

**For Status:** Read `github-pr-create.md` (Status section only). Present the merge readiness report — read-only, no approval needed.

**Comments mode completion gate (BLOCKING):** After implementing fixes, verify ALL before reporting complete:
- Every addressed comment has a reply citing the fix commit
- Every addressed thread resolved via GraphQL (`isResolved: true`)
- Unaddressed comments listed as "Dismissed" or "Needs Discussion"
- Zero unresolved threads for comments marked as fixed

### Self-Verification

Before presenting results: verify data is fresh, URLs correct, writes approved and verified, no unauthorized overwrites, no force flags. Full checklist in `references/github-pr-operations.md`.

### Session End

```
📋 [PR Complete]

Action:   [Created PR / Updated description / Checked status / Investigated comments]
PR:       #[N] — [title] ([url])
Changes:  [summary of what was done, or "Read-only — no changes"]
```

## Recovery

| Issue | Solution |
|-------|----------|
| `gh` not installed | Read `references/github-cli-setup.md` — guided setup |
| `gh` not authenticated | `gh auth login --web`. Fallback: `! gh auth login` |
| No PR for current branch | Ask user to create one or specify PR number |
| Previous PR merged | Detected automatically — routes to Create for new PR |
| Pushed bad commit | **STOP.** Never force push. Suggest `git revert` + new push |

Full recovery table in `references/github-pr-operations.md`.

## Important Reminders

**Analysis depth:** Read every file, every line. Description credibility comes from thorough understanding, not template-filling.

**Brevity is the goal.** Deep analysis enables short output. A 500-line diff should produce a 20-line description.

**Agent-agnostic.** This skill works in any AI agent with shell access. Commands are examples — agents adapt to their environment.

**Safety hierarchy is non-negotiable.** Reads are auto. Writes are gated. Merges/closes/force-push are blocked.

**Never push without explicit request.** Creating a PR or committing does not imply pushing. When commit+push are both needed, combine into one gate — but push alone is still its own gate.

**Never force push.** No `--force`, no `--force-with-lease`, no `--force-if-includes`. If the user insists, explain the risk and suggest they do it manually.

## Related

- `/ai-assist-git-commit` — for staging and committing changes
