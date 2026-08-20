---
name: ai-assist-git-pr-review
description: "Perform a standards-based code review on a GitHub Pull Request, then post the findings as inline review comments and mark the PR as 'Requested changes'. Reads all of the agents files that exist in the repository under review (AGENTS.md, .agents-docs/, CLAUDE.md on the PR's base branch) — the repo's full documented standards, not just any agents files the PR happens to change — checks the diff against them plus general best practices, and gates every write behind explicit approval. Use this skill whenever the user wants to code-review a PR, review a pull request, check a PR against standards, request changes on a PR, or gives you a GitHub PR link and asks for a review. Also triggers on: 'review this PR', 'code review', 'review PR', 'check this pull request', 'request changes', 'review against our standards', or a bare github.com/.../pull/<n> URL with review intent. This is a review-only skill — it never approves, merges, closes, or pushes code."
argument-hint: "[PR URL] — e.g. 'https://github.com/org/repo/pull/42' or 'review https://github.com/org/repo/pull/42'"
---

# PR REVIEW

**Objective:** Review a GitHub PR against documented standards (its agents files) plus general engineering best practices, then — after your explicit approval — post the findings as inline review comments and submit the review as **REQUEST_CHANGES**.

**Role:** Senior reviewer writing for senior engineers. Read the diff deeply, ground every finding in evidence (a cited standard or a concrete code risk), and keep comments short and actionable. A good review reads like it came from a careful teammate, not a linter.

Start each response with `🔍 [PR Review — Step X: Name]` so the user can follow the flow.

## Safety Model

| Level | Actions | Behavior |
|-------|---------|----------|
| **Auto** | Read PR metadata, diff, changed files, agents files, existing review threads; analyze and de-duplicate | Execute immediately |
| **Gated** | Post the review (inline comments + REQUEST_CHANGES) | Preview every comment → explicit approval → post → verify |
| **Blocked** | Approve, merge, close, push, edit code, dismiss reviews | Never. This skill only *requests changes*. |

The single write in this skill is posting the review. Nothing reaches GitHub until the user has seen every comment and approved. This matters because a review is visible to the whole team and notifies the author — surprising them with unreviewed machine output erodes trust in the tool.

## Prerequisites

**gh CLI (BLOCKING — before any `gh` command):** run `gh --version` first. If it fails, the CLI isn't installed — tell the user to install and authenticate GitHub CLI (`gh auth login`), then stop. If `gh auth status` fails, prompt them to authenticate. Don't attempt other `gh` calls until both pass.

## Process

### Step 1: Get the PR link

The PR URL may be in `$ARGUMENTS`. If it isn't, ask: *"Which PR would you like me to review? Paste the GitHub PR link."* Don't guess or assume the current branch — this skill reviews an arbitrary PR by URL, which may live in a different repo than the current directory.

Parse the URL `https://github.com/<owner>/<repo>/pull/<number>` into `$owner`, `$repo`, `$number`. If it doesn't match that shape, ask the user to re-paste a full PR URL.

### Step 2: Load PR context

Fetch metadata (single call):

```bash
gh api repos/$owner/$repo/pulls/$number \
  --jq '{title, state, draft, headSha: .head.sha, baseRef: .base.ref, changedFiles: .changed_files, additions, deletions, author: .user.login}'
```

- **state != "open"** → stop: "PR #N is <state>. Reviews can only be posted on open PRs." (A closed/merged PR can't receive a REQUEST_CHANGES review.)
- Capture `headSha` — you'll pin the review to it so comments land on the exact revision you reviewed.
- If it's a draft, note it but continue (drafts can still be reviewed).

### Step 3: Gather the standards (the agents files)

The whole point of this review is conformance to *this repo's* documented standards, so read them from the PR's repo — not the local workspace, which may be a different project. **These are the agents files that exist in the repository, which define the standards — not merely the agents files the PR happens to modify.** A PR usually doesn't touch the agents docs at all; you still read the repo's full set to know the rules the changed code must follow. See `references/posting-review.md` §Gathering Agents Files for the exact `gh api` calls. In short:

1. List the **entire** repo tree on the PR's base branch and find every agents file present in the repo: `AGENTS.md`, `CLAUDE.md`, anything under `.agents-docs/`, and any `AGENTS.md`/`CLAUDE.md` in subdirectories. Do this against the full tree, independent of what the PR changed.
2. Read them. `AGENTS.md` files are usually a lightweight index that links to detailed docs under `.agents-docs/` — follow the links for any area the diff touches (e.g. if the PR changes C# code, read the C# coding-standards doc).
3. Distill a working checklist of concrete, checkable rules (commit format, naming, layering/wrapper boundaries, test structure, forbidden patterns, etc.). Keep the rules and *where each came from* so every finding can cite its source.

If the repo has **no** agents files, tell the user and offer to proceed on general best practices alone — the review is weaker without documented standards, so let them decide.

### Step 4: Fetch the diff and review

Get the changed files and the diff:

```bash
gh pr diff $number --repo $owner/$repo
```

For any changed file where you need full surrounding context (not just the hunk), read it from the PR head: see `references/posting-review.md` §Reading a File at the PR Head. Don't review from hunks alone when a rule depends on context the hunk doesn't show (e.g. "private methods below public methods" needs the whole class).

**Evaluate each change against, in priority order:**
1. **Documented standards** from Step 3 — the primary bar. A violation of a written team rule is always worth flagging.
2. **General best practices** — obvious bugs, security issues (injection, secrets, auth gaps), missing null/error handling, race conditions, performance cliffs, and clear maintainability problems, even when no agents file mentions them.

**What NOT to flag (this matters — over-flagging erodes trust in the review):**
- **Style the docs only *illustrate*, not *mandate*.** A code sample in an agents doc shows one way to write something; it is not a rule. Bracket-quoting object names, `BEGIN/END` wrappers, brace placement, and similar formatting choices are not findings unless a doc states them as an explicit requirement ("must", "always", a rule in prose — not just an example snippet). When in doubt, treat it as illustrative and stay silent.
- **Personal-preference refactors** with no functional or documented basis. If you'd only be substituting your taste for the author's, don't comment.
- **Speculative concerns** you can't ground in the diff, a cited standard, or a concrete risk. Every comment must trace to a rule or a real problem — if you can't name the basis, drop it.

A short review of real issues is worth far more than a long one padded with style opinions.

**Categorize each finding by severity** (this is what the user asked to see so they can triage NIT vs must-fix):

| Severity | Meaning | Examples |
|----------|---------|----------|
| **CRITICAL** | Must fix before merge — correctness, security, or data-loss risk; or a hard team rule that will break CI/deploy | SQL injection, leaked secret, null deref on a hot path, wrong commit format that the CI gate rejects, calling ServiceRepositories directly when the repo forbids it |
| **WARNING** | Should fix — bug risk, missing validation/error handling, a documented convention violated, measurable perf issue | Swallowed exception, missing test for new logic, naming that violates the coding-standards doc, N+1 query |
| **NIT** | Optional — style, readability, minor refactor with no functional impact | Import ordering, comment wording, a slightly cleaner idiom |

Anchor each finding to a specific `path` + `line` **that appears in the diff** (`side: RIGHT` for added/context lines, `LEFT` for deleted). This skill posts **inline comments only — no summary write-up of the PR.** A finding that doesn't map neatly to a changed line should be anchored to the nearest related changed line (e.g. attach a "missing test" note to the new file's `CREATE`/signature line); if it genuinely can't be tied to any changed line, drop it rather than writing a prose summary. See `references/posting-review.md` §Anchoring Rules.

Be disciplined about noise: don't invent findings to look thorough. If the PR is genuinely clean, it's fine to end up with only one or two comments — quality over volume.

### Step 5: De-duplicate against existing review threads

Before presenting anything, read the review activity that is **already on the PR** and classify each of your candidate findings as either **new** or **already-raised**. Other reviewers — human teammates and bots like GitHub Copilot and Devin Review — have often already raised the same points, and the author may have fixed them, replied with a rationale, or consciously declined. You must **not silently repost** an already-raised point (that relitigates a settled thread and signals you didn't read it) — but you must **not silently drop it either**. Instead, set already-raised findings aside and surface them to the user in Step 6 as items to review, so *they* decide whether the prior dismissal/resolution was actually correct. This step is mandatory, not optional. See `references/posting-review.md` §Gathering Existing Review Threads for the exact `gh api`/GraphQL calls. In short:

1. Fetch **all** prior review activity: inline review comments (`/pulls/$number/comments`), review summaries (`/pulls/$number/reviews`), and issue-level comments (`/issues/$number/comments`) — from every author, including bots (`Copilot`, `devin-ai-integration[bot]`, etc.) and the PR author's own replies. Also pull each thread's **resolved/outdated** status via GraphQL, which is a strong "already handled" signal.
2. For every candidate finding from Step 4, check whether an existing thread already covers the same issue on the same file/area. Classify it as **already-raised** if any of these hold (record *which* signal, *who* raised it, and *how* it was handled — replied/declined/resolved/outdated/fixed — you'll show this in Step 6):
   - A prior comment makes substantially the same point (even if worded differently or at a slightly different line).
   - The author (or anyone) **replied** to that thread dismissing it with a rationale or explaining it's intentional.
   - The thread is marked **resolved** or **outdated**, or the code it pointed at has since changed (a fix likely landed).
3. Everything else is a **new** finding. For each already-raised finding, also form a quick judgment: does the prior resolution look sound, or does it seem prematurely dismissed / not actually addressed? You'll present that assessment alongside the item so the user can decide whether to re-raise it.

Both buckets go to the user in Step 6 — **new** findings as proposed comments, **already-raised** findings as review items. Never auto-post an already-raised finding; only include it in the posted review if the user explicitly tells you to re-raise it.

### Step 6: Present findings for approval (GATED)

Show the user the complete set of inline comments before anything is posted. Use this structure:

```
🔍 Review of PR #<n> — <title>
Standards source: <which agents files informed this>

New findings — will be posted if approved (<count>):
1. [CRITICAL] <path>:<line> — <one-line finding> (cites: <standard or "best practice">)
   > <the exact comment body that will be posted>
2. [WARNING]  <path>:<line> — ...
3. [NIT]      <path>:<line> — ...

Already raised by others — NOT posted, for your review (<count>):
A1. [was WARNING] <path>:<line> — <finding>
    raised by: <Copilot/Devin Review/reviewer>  |  status: <replied/declined/resolved/outdated/fixed>
    their resolution: <one-line summary of the existing thread's outcome>
    my read: <"resolution looks sound" | "may be prematurely dismissed because ...">
A2. ...
```

**Number every item** so the user can refer to it precisely: new findings are `1, 2, 3, ...`; already-raised items use an `A` prefix (`A1, A2, ...`) so the two lists never collide. Present **both** buckets every time:
- **New findings** are the proposed comments, subject to the usual approval below.
- **Already raised** findings are shown so the user can judge whether each was correctly handled — this is the point of Step 5, not just a courtesy list. For each, include who raised it, how it was resolved, and your read on whether that resolution holds up. Do **not** pre-select these for posting.

If Step 5 produced **no new findings**, still present the "Already raised" list (it may be the whole review) and recommend **posting nothing** unless the user wants to re-raise one — do not fabricate new findings to fill the review. An already-raised item is added to the posted review **only** when the user explicitly asks to re-raise it; when they do, post it as a normal new inline comment using the combined footer described below and briefly acknowledge the prior thread in the body so it doesn't read as a blind duplicate.

Each comment body should be short, specific, and get straight to the point. Open with the substance — the finding itself — not the severity; leading with `**[WARNING]**`/`**[CRITICAL]**` reads as aggressive. For a documented-standard violation, name the doc/rule; for a best-practice finding, state the risk in one line. Where a fix is obvious and small, include a GitHub suggestion block (see `references/posting-review.md` §Suggestion Blocks).

**Every inline comment ends with the combined footer `_[SEVERITY] - AI Assisted_` on its own line after a blank line.** The severity is absent from the finding text and appears only in this footer, so the posted body looks like `...undercut the performance goal of this PR.\n\n_[WARNING] - AI Assisted_`. This keeps priority discoverable without leading aggressively and preserves the team's attribution convention. (In the Step 6 preview you still lead each line with the severity — that's for the user's triage; only the *posted body* moves it to the combined footer.)

**Tone:** write like a direct, respectful teammate. No congratulatory or filler language ("Great job!", "Nice work!", "Solid PR overall") — it adds noise and reads as padding. State the issue and what to do about it, nothing more.

Then ask: *"Post this as a REQUEST_CHANGES review? Refer to items by number — you can approve all the new findings, drop specific ones (e.g. 'drop 3' or 'keep only 1 and 2'), edit any wording, or re-raise an already-raised item if you think it was wrongly dismissed (e.g. 're-raise A2')."*

Wait for explicit approval. Apply any edits/removals and re-show only if the user changed something substantive.

### Step 7: Post the review (GATED write)

**Post-nothing terminal state (check first):** if no new findings remain and the user did not re-raise any already-raised item, there is nothing to submit. Do **not** POST a review — a REQUEST_CHANGES with no inline comments (just the placeholder body) is rejected by the API and would be noise anyway. Skip straight to Step 8 and use the "no review posted" report variant. Only proceed with the POST below when there is at least one approved comment to include.

On approval, build the JSON payload and submit **one** review containing all approved inline comments, with `event: "REQUEST_CHANGES"` and `commit_id` pinned to `headSha`. The GitHub API requires a non-empty `body` for REQUEST_CHANGES, but this is **not** a place for a findings summary — use a single neutral navigational line (e.g. `"Requested changes - details in the inline comments."`) and put all substance in the inline comments. Keep every comment body **ASCII-only** — em-dashes, curly quotes, and other non-ASCII characters get mangled into `?` by shells (notably Windows PowerShell). Exact payload shape, per-shell commands, and encoding guidance: `references/posting-review.md` §Posting the Review.

**Verify after posting:** re-read the PR's reviews and confirm a REQUEST_CHANGES review from your account exists with the expected comment count. If the count mismatches or a comment was rejected (usually a `line` not in the diff → 422), report exactly what failed and don't silently retry — see §Recovery in the reference.

### Step 8: Report

When a review was posted:

```
🔍 [PR Review — Complete]
PR: #<n> — <title> (<url>)
Result: REQUEST_CHANGES posted — <X> inline comments (<c> CRITICAL, <w> WARNING, <n> NIT)
Standards: <agents files used>
```

When nothing was posted (all candidates were already-raised and none re-raised, or the PR was clean):

```
🔍 [PR Review — Complete]
PR: #<n> — <title> (<url>)
Result: No review posted — <reason: all N candidate findings already covered by existing threads / PR clean>
Already-raised (not reposted): <count>   New findings: 0
Standards: <agents files used>
```

## Recovery

- **422 on posting** — almost always an inline comment anchored to a line not present in the diff. Re-anchor that finding to a valid changed line (or drop it if it can't be tied to one), then repost. Full detection and fix: `references/posting-review.md` §Recovery.
- **Wrong PR reviewed** — a review can't be deleted via CLI, but a REQUEST_CHANGES can be superseded. Stop and tell the user; don't try to "fix" it by posting more reviews.
- **Rate limit (403)** — wait and retry, or ask the user to continue later.

## Reference Loading

Load `references/posting-review.md` before Step 3 (it covers gathering agents files, reading files at the PR head, gathering existing review threads for Step 5 de-duplication, anchoring rules, the exact review payload, suggestion blocks, and recovery). Everything else lives in this file.

## Related

- `/ai-assist-git-pr` — create/describe PRs and address review comments *received* on your own PR (this skill is the inverse: it *authors* a review on someone's PR)
