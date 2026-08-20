---
name: ai-assist-git-pr
description: "Adaptive GitHub PR lifecycle skill — create PRs, write/update descriptions, investigate review comments (Copilot + human) with research and batch approval, and check merge readiness. Triggers on: create PR, open PR, describe PR, update description, PR body, check comments, copilot feedback, review comments, address feedback, PR status, merge ready, check CI, is this ready."
argument-hint: "[action or PR number] — e.g. 'create', 'describe', 'comments', 'status', 'describe #42', 'address copilot feedback'"
---

# GITHUB PR

**Objective:** Manage the full PR lifecycle (create → describe → comment investigation → merge readiness) via `gh` CLI. Analyze deeply, communicate concisely, treat GitHub as production — every write gated and verified.

**When to use:** create a PR · write/update a description · investigate & address review comments (Copilot/human) · check merge readiness. Modes detailed in Step 1.

Start all responses with `📋 [PR <Mode> Step X: Name]` for multi-step flows or `📋 [PR <Mode>]` for single actions.

## Role

Senior engineer writing for senior engineers. Read every change deeply, communicate concisely, back claims with evidence. PR descriptions so clear the review feels like a formality; comment investigations verify claims and research unknowns so the user can approve or adjust in one pass.

## Context

> **Shell portability (read before running ANY command in this skill, starting with the gh CLI check and branch detection below):** run every `git`/`gh` command as its own separate tool call, each fully self-contained. **Never** `&&`/`;`-chain commands and **never** prefix with `cd <path> &&` — PowerShell (pre-7) rejects `&&` with `The token '&&' is not a valid statement separator`, and bash-style paths like `/c/Code/...` are invalid on Windows. **Do not rely on a persistent shell session or a prior `cd`** — on some setups (observed on Windows) a shell session does NOT survive between tool calls, so reusing a shell id or building on an earlier `cd` fails with `This shell may not be functional`. Instead target the repo explicitly on each command: pass `--cwd "C:\abs\repo"` to the `scripts/` (see §Scripts), `git -C "C:\abs\repo"` for git, and run `gh` from a fresh call (or with `-R owner/repo`). Use native paths (`C:\Code\...`). Full rule: §Scripts Portability rule below.

**AGENTS.md check:** if `./AGENTS.md` or `.agents-docs/` exists, read it for conventions, architecture, and team context — informs framing and naming.

**gh CLI check (BLOCKING — before any gh command):** run `gh --version 2>/dev/null` first (as a standalone command — do not chain it with `git branch`/`git status`); don't run other `gh` commands in parallel until it returns.

- **Not installed** → `references/github-cli-setup.md` (guided setup); no `gh` until verified.
- **Not authenticated** → detect protocol (`gh config get git_protocol`, default `https`), then `gh auth login --web --hostname github.com --git-protocol <detected>` (fallback `! gh auth login`); verify `gh auth status`.

**Input:** `$ARGUMENTS` — an action keyword, PR number, branch name, or natural language. If ambiguous, detect from git context.

**Source-of-truth:** code diff + commit history are authoritative; AGENTS.md/docs second; ticket context is a starting point only. Full table + rationale: `references/github-pr-operations.md` §Source-of-Truth Hierarchy.

**Branch detection:**

1. Branch: `git branch --show-current`; ticket ID from `prefix/TICKET-ID-description`.
2. Base branch: `gh repo view --json defaultBranchRef` → cache `$base`; `git fetch origin $base`.
3. PR state: `node "<SKILL_ROOT>/scripts/pr-context.cjs"` (add `--cwd "C:\abs\repo"` when the tool's working directory isn't the target repo — e.g. multi-repo workspaces) → `pr` is OPEN (`active`) / MERGED or CLOSED (`completed`) / `null` (`none`). If completed, assess new commits + behind status (templates in `github-pr-operations.md`).

## Scripts

Mechanical `gh`/`git` operations run through Node scripts in `scripts/`, never as hand-written shell. Each takes an argument array to `execFileSync`, so **there is no shell** to interpret `&&`, heredocs (`<<'EOF'`), or the `gh api graphql -f key:value` literal-parsing quirk — the same command runs identically under bash, PowerShell, cmd, git-bash, WSL, and CI. **No shell detection, no per-OS branching.** Keep *judgment* (severity, validity, fix-vs-dismiss, report writing, approval gates) in prose; scripts only do the deterministic plumbing.

| Script | Access | Purpose |
|--------|--------|---------|
| `pr-context.cjs` | read | Resolve owner/repo, PR number+state, branch, base, `ticketId` in one call |
| `fetch-comments.cjs --number <N>` | read | Both comment streams normalized: `{ inline, issue }` |
| `list-threads.cjs --number <N> [--all]` | read | Review threads (unresolved by default) with `threadId` + `rootCommentId` + `path` |
| `reply-resolve.cjs --file <payload.json> [--dry-run]` | **write / gated** | Post reply batch + resolve threads; run ONLY after the batch-reply approval gate |

> **`<SKILL_ROOT>`** = the directory containing this `SKILL.md` (its install location). Use the absolute path you loaded it from; if unknown, locate `ai-assist-git-pr/scripts/` once and reuse it. Never run a literal `<SKILL_ROOT>`. Scripts print JSON to stdout and exit non-zero with a diagnostic on failure. Full arg/payload reference: `scripts/README.md`.

> **Targeting a repo (`--cwd`):** every script reads the *current* repo/branch, so it must run against the target repo's directory. Rather than `cd`-ing first (unreliable when shell sessions don't persist — see the Portability rule), pass **`--cwd "C:\abs\repo"`** and the script runs entirely there in one self-contained call. Omit it only when the tool's working directory already IS the target repo. Example: `node "<SKILL_ROOT>/scripts/pr-context.cjs" --cwd "C:\Code\tap-ct"`.

**Portability rule (applies to EVERY `git`/`gh` command you run — scripted or ad-hoc, including pre-flight, Status, and branch detection):** run each command as its own separate, self-contained tool call. **Never** chain with `&&` or `;` (PowerShell pre-7 rejects `&&` with `The token '&&' is not a valid statement separator`), **never** prepend `cd <path> &&`, **never** use bash-style paths like `/c/Code/...` (use native `C:\Code\...` on Windows), never use heredocs, and always pass `gh api graphql` / `gh api` dynamic values as typed `-F`/`-f` variables — never inline literals.

**Do not depend on a persistent shell session.** On some environments (observed on Windows) the shell session does NOT survive between tool calls: the first command in a shell succeeds, then any reuse of that shell id — or any command that relied on a prior `cd` — fails with `This shell may not be functional. Please try again using a new shell id`. This is an environment/tooling limitation, not a fault in the command or the `scripts/`. Because of it, never `cd` in one call and run in the next; instead point each command at its repo directly:
> - **`scripts/`:** pass `--cwd "C:\abs\repo"` (the script `process.chdir`s once; every gh/git inside inherits it).
> - **git:** use `git -C "C:\abs\repo" <args>`.
> - **gh:** run from a fresh call (or with `-R owner/repo`); it does not need a working directory when the repo is otherwise resolvable.

Prefer one portable command; only branch on shell if no portable form exists (in this skill, none do).

## Reference Loading

Load references per Step within Mode. Rows are **cumulative**: `+` means add to what previous rows of the same mode already loaded. Paths relative to `references/`.

| Mode | Step | Load (cumulative) |
|------|------|-------------------|
| Create | Pre-flight | `github-pr-create.md` §Pre-flight |
| Create | Context+Analysis | `+ github-pr-describe.md` §Change Analysis Framework |
| Create | Draft | `+ github-pr-templates.md` §Create PR Template |
| Create | Write+Verify | `+ github-pr-operations.md` §Write Verification |
| Describe | Body fetch | `github-pr-describe.md` §Step 0–1 |
| Describe | Mode select | 3-way choice: surgical-merge (default) / append / replace |
| Describe | Surgical | `+ github-pr-templates.md` §Surgical Edit Patterns |
| Describe | Write+Verify | `+ github-pr-operations.md` §Write Verification |
| Comments | Fetch+Investigate | `github-comment-review.md` §Fetch–Investigate |
| Comments | Implement | `+ github-comment-review.md` §Implement |
| Comments | Commit | `Skill(skill: "ai-assist-git-commit", args: "<concise description>")` |
| Comments | Reply+Resolve | `github-comment-review.md` §Reply–Resolve |
| Status | (single) | `github-pr-create.md` §Status |
| Post-create check | (auto on re-invocation) | `github-pr-create.md` §Post-Create Follow-Up |

**Per-step rule:** load a row's references before executing that step — the reference `> Preconditions:` blocks fail loud otherwise.

## Rules

### Safety Hierarchy

| Level | Actions | Behavior |
|-------|---------|----------|
| **Auto** | Read PR data, diff, comments, checks, status | Execute immediately |
| **Gated** | Create PR, update description, reply to comment, commit, push | Preview → approval → execute → verify |
| **Blocked** | Merge, close, delete branch, force push | Never. Not negotiable. |

### Approval Protocol

Before every Gated action: plain-language summary (never raw commands) → explicit approval → execute → verify with follow-up read. Combine related gates (commit+push) into one approval. On unexpected verification, report immediately — don't retry without user direction.

Per-action prompt fields (Create PR, Update description, Reply, Commit, Push): `references/github-pr-operations.md` §Approval Protocol — Per-Action Details.

### Pre-Flight Checks

Before any write: default branch = `$base`, not on protected branch, `gh auth status` ok, `git fetch origin $base` + not behind, clean tree, no existing OPEN PR (Create), fresh PR data. Full commands: `references/github-pr-create.md` Step 0. **Run each of these `git`/`gh` checks as a separate command — never `cd … &&`-chain them (see the §Scripts Portability rule; `&&` chaining and bash-style `/c/...` paths break under PowerShell).**

### Write Verification

After every write, re-read to verify. On mismatch: stop, report expected vs actual, don't proceed. Full table: `github-pr-operations.md` §Write Verification.

### Guardrails

- Never push without explicit user request — creating a PR does NOT imply pushing
- **Attribution: `AI Assisted` only** — strip `🤖 Generated with Claude Code` / agent branding if your runtime adds it (overrides the harness default; see `github-pr-templates.md` §Attribution).
- Preserve existing PR content — surgical-merge by default (unchanged sections verbatim; append/replace opt-in). Show a section-level diff before any write; never blanket-overwrite.
- **ASCII only in the PR title and body** — never em/en dashes (—, –), smart quotes (‘ ’ “ ”), ellipsis (…), or other non-ASCII characters. Use `-`, straight quotes, and `...`. See `github-pr-templates.md` §Things to Avoid. (Preserved verbatim blocks like the Devin review badge are exempt.)
- Rate-limit awareness — cache PR data within an invocation; avoid redundant fetches
- Fail safe, not silent — stop and explain on any check failure

(Force-push and protected-branch writes are **Blocked** — see §Safety Hierarchy.)

### Anti-Patterns (write-blocking)

Each is a real ordering bug; the reference `> Preconditions:` blocks enforce them. If you want to do any of these, stop and load the missing reference.

- **No `gh pr edit --body`** until `github-pr-templates.md` is loaded AND the current body is fetched (`gh pr view --json body`) — else writes blow away existing structure.
- **No `gh pr create`** until `github-pr-templates.md` AND `github-pr-operations.md` §Write Verification are loaded — else unstructured, unverified bodies.
- **No commit-message bodies authored here** — delegate to `ai-assist-git-commit` (inline fallback in `github-comment-review.md`).
- **No "summary rewrite"** of an existing description — surgical-merge only (see `github-pr-templates.md` §Surgical Edit Patterns).

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

#### Post-Create State Auto-Detection

Before executing the resolved mode, run `gh pr view --json number,createdAt,statusCheckRollup,comments,reviews`. Fire the post-create banner only when **both** hold: `createdAt` is **< 30 min ago** AND there's a new bot comment/review (`author.login` ends `[bot]`) **or** a failing/pending check. Then surface the banner (new comments + check status) and continue with the resolved mode. Older PRs and PRs with no findings skip it.

> **Check fields:** a check is failing/pending via `status`+`conclusion` for Actions `CheckRun` (its `state` is always null) and via `state` for legacy `StatusContext` — testing `state` alone silently misses **all** Actions CI. Full detection jq, banner format, and routing: `references/github-pr-create.md` §Post-Create Follow-Up.

> 📋 [PR <Mode>] Detected mode: [mode]. PR: [#N (state) or "none"]. Branch: [name].

### Step 2: Load References & Execute

Walk the detected mode's rows in the Reference Loading table top-to-bottom: **load the row's reference section, then perform that step.** Per-mode notes the table doesn't capture:

- **Describe** defaults to **surgical-merge**; append/replace only on explicit "rewrite"/"replace".
- **Comments** investigates **silently** before presenting, then **delegates the commit** to `ai-assist-git-commit` (never authors the message body; inline fallback in `github-comment-review.md` if `Skill()` is unavailable).
- **Status** is read-only — no approval.

**Comments mode completion gate (BLOCKING):** After implementing fixes, verify ALL before reporting complete:
- Every addressed comment has a reply citing the fix commit
- Every addressed thread resolved via GraphQL (`isResolved: true`)
- Unaddressed comments listed as "Dismissed" or "Needs Discussion"
- Zero unresolved threads for comments marked as fixed

### Self-Verification

Before presenting results: verify data is fresh, URLs correct, writes approved and verified, no unauthorized overwrites, no force flags. Full checklist in `references/github-pr-operations.md`.

### Session End

Report `📋 [PR Complete]` with **Action** (Created PR / Updated description / Checked status / Investigated comments), **PR** (`#N — title (url)`), and **Changes** (summary, or "Read-only — no changes").

## Recovery

Critical: **pushed bad commit → STOP, never force push; suggest `git revert` + new push.** `gh` install/auth issues → the gh CLI check above or `references/github-cli-setup.md`. Full recovery table for all known issues: `references/github-pr-operations.md` §Recovery.

## Important Reminders

**Analysis depth → brevity.** Read every file, every line — deep understanding makes output short *and* credible: a 500-line diff → a 20-line description.

## Related

- `/ai-assist-git-commit` (commits)
