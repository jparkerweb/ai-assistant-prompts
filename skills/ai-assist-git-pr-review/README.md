# ai-assist-git-pr-review Reference Architecture

> For skill authors and AI agents working on or extending the ai-assist-git-pr-review skill.

## What it does

Given a GitHub PR URL, this skill authors a **standards-based code review**: it reads all of the agents files that exist in the PR's repository (on the base branch) — the repo's full documented standards, not just any agents files the PR happens to change — evaluates the diff against those conventions plus general best practices, categorizes each finding by severity (NIT / WARNING / CRITICAL), and — after explicit user approval — posts the findings as inline review comments and submits the review as **REQUEST_CHANGES**.

It is the inverse of `ai-assist-git-pr`: that skill manages *your own* PR and addresses comments you *receive*; this skill *authors* a review on any PR.

## Reference File Inventory

| File | Purpose | Loaded When |
|------|---------|-------------|
| `posting-review.md` | Gathering agents files from the PR repo, reading files at the PR head, inline-comment anchoring rules, the exact `gh api .../reviews` JSON payload, suggestion blocks, verification, and recovery | Before Step 3 (standards gathering onward) |

## Workflow

```
PR URL -> gh CLI check
  |-- parse owner/repo/number
  |-- load PR metadata (state must be OPEN, capture headSha)
  |-- gather agents files from base branch  -> distill a rules checklist
  |-- fetch diff (+ read files at head for context)
  |-- evaluate: standards first, best practices second -> severity per finding
  |-- present ALL findings for approval        [GATED]
  +-- post one REQUEST_CHANGES review (inline comments + summary) [GATED write] -> verify -> report
```

## Safety Model

| Level | Actions | Behavior |
|-------|---------|----------|
| Auto | Read PR metadata, diff, files, agents files; analyze | Execute immediately |
| Gated | Post the review (inline comments + REQUEST_CHANGES) | Preview every comment + approval + verify |
| Blocked | Approve, merge, close, push, edit code, dismiss reviews | Never — review-only |

## External Dependencies

| Dependency | Required | Purpose |
|------------|----------|---------|
| `gh` CLI (authenticated) | Yes | All GitHub operations — PR metadata, diff, file contents, posting the review |
| Agents files in the PR repo | Recommended | Source of the documented standards; without them the review falls back to general best practices only |

## Key Design Notes

- **Reads from the PR's repo, not the local workspace.** The PR under review may be a different project than the current directory, so standards and file context are fetched via `gh api` against `$owner/$repo`.
- **One review, not N comments.** All inline comments are submitted in a single `POST .../reviews` call with `event: REQUEST_CHANGES`, pinned to the head SHA. This is the reliable path (the direct per-comment endpoint is flaky — see `posting-review.md`).
- **Inline comments only — no summary write-up.** The review posts findings as inline comments; the required `body` field is just a one-line navigational placeholder (the API rejects an empty body for REQUEST_CHANGES), never a summary or congratulatory note.
- **Anchoring discipline.** Inline comments only attach to lines in the diff; a finding that can't map to a changed line is anchored to the nearest relevant one or dropped, to avoid 422 errors.
- **Low-noise reviews.** The skill flags documented-rule violations and genuine best-practice risks only — not style merely illustrated in doc examples, and not personal-preference refactors.
