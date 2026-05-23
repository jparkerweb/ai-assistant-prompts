# Comment Investigation Pipeline

> Part of [ai-assist-git-pr](../SKILL.md) — loaded during Comments mode.
> **Known consumers:** ai-assist-git-pr

This file contains the complete workflow for investigating PR review comments, from fetching through implementation. The workflow is split into two phases: investigation (read-only, auto) and implementation (gated).

## Workflow Steps

**Phase 1 — Investigation (Auto, read-only):**

1. Derive owner/repo: `gh repo view --json owner,name --jq '[.owner.login, .name] | join("/")'` — fallback: parse `git remote get-url origin`
2. Get PR number and verify state: `gh pr view --json number,state 2>/dev/null` — check:
   - **No PR (exit code 1)** → abort: "No PR found for this branch."
   - **MERGED** → abort: "PR #N was already merged. Comments can only be investigated on open PRs."
   - **CLOSED** → abort: "PR #N is closed. Comments can only be investigated on open PRs."
   - **OPEN** → proceed with PR number.
3. Fetch inline review comments (see Fetching Comments below)
4. Fetch issue-level comments (see Fetching Comments below)
5. If both fetches return empty: report "No review comments on this PR" and exit
6. Investigate silently — for each comment, run the full pipeline: categorize (CRITICAL/WARNING/NIT), investigate (full file context, code path tracing, applicability check), research (library docs, codebase patterns), assess (validity/value/risk/confidence). Do NOT present findings incrementally — complete all investigation before presenting.
7. Build report following the Report Template below
8. Present report to user

**Phase 2 — Implementation (Gated):**

9. On user approval: implement approved fixes per the Implementation Protocol below
10. If user says "skip 3,5" — implement only non-excluded fixes
11. Present final diff summary with commit message, branch name, and "this will be visible to the team and trigger CI" — single gated checkpoint covering commit + push together.
12. On approval: commit via `/ai-assist-git-commit address PR review feedback`, then push immediately.
13. **Reply to comments and resolve threads (required)** — after push, reply to every addressed inline comment and resolve each thread that is not already resolved. Each reply must cite what changed and why — scaled to complexity but always concise. Trivial fixes get a one-liner; non-trivial fixes cite specific code or evidence, but in plain language, not paragraphs. Never hand-wave. Batch all replies into a single preview. One approval for the batch, then post all replies and resolve all unresolved threads.

**Safety boundaries:**
- Steps 1–8 (fetch + investigate + report) are **read-only and auto**
- Steps 9–10 (implement fixes) modify local code files — each fix verified, batch gets single approval gate
- Step 11–12 (commit + push) are one gated action — present all info upfront, one approval covers both
- Step 13 (comment replies) is one gated action — batch preview, one approval, post all
- If anything goes wrong during implementation: revert the failing fix, stop, report — do not continue without user direction

---

## Fetching Comments

Two fetch paths — both required for complete coverage:

**Inline review comments** (line-specific, where Copilot and human reviewers leave feedback):
```
gh api repos/{owner}/{repo}/pulls/{number}/comments --jq '.[] | {id, author: .user.login, body, path, line: .original_line, side, created_at, in_reply_to_id}'
```

**Issue-level comments** (general PR conversation, no file/line context):
```
gh pr view --json comments --jq '.comments[] | {author: .author.login, body, createdAt}'
```

Key difference: inline comments have `path` + `line` for file context; issue-level comments do not. Both types are investigated identically — inline comments just have richer starting context.

## Comment Categorization

Three severity levels based on the comment AND the code it references:

| Severity | Criteria | Examples |
|----------|----------|----------|
| **CRITICAL** | Security vulnerabilities, data loss risk, crash/panic paths, auth bypass | SQL injection, unvalidated input on auth endpoint, unchecked null on payment path |
| **WARNING** | Bug risk, bad practice, missing validation, error handling gaps, measurable perf issues | Missing null check, swallowed exceptions, N+1 query, race condition |
| **NIT** | Style preferences, naming, minor readability, optional refactors | Variable naming, import order, comment wording, slightly cleaner approach |

**Rules:**
- Categorize by analyzing BOTH the comment text AND the referenced code — "this looks wrong" on a security-sensitive line is CRITICAL, not a NIT
- Reviewer attribution (author name) is metadata, not an organizing axis
- Identify reviewer type: Copilot bot accounts (`copilot`, `github-actions[bot]`) vs human reviewers — treat both identically for investigation

## Investigation Protocol

For each comment, complete ALL steps before forming an opinion:

1. **Read full file context** — open the file at the referenced path, read the surrounding function/class/module. Do not rely on diff hunks alone.
2. **Trace the code path** — identify callers (grep for function name), consumers (who imports this module), side effects (DB writes, API calls, state mutations), dependencies.
3. **Check applicability** — does the concern apply to THIS specific context, or is it a generic suggestion that doesn't fit? (e.g., "add error handling" on a function that already delegates errors to a caller)
4. **Identify stakeholders** — who is affected if this code is wrong: end users, internal engineers, support team, downstream services.

Do all investigation silently — no incremental output during analysis.

## Research Protocol

When a comment references a library, convention, security pattern, or best practice:

1. **Research** — use web search or context7 MCP for library docs. Consult official docs, OWASP guidelines, language specs, framework documentation.
2. **Verify the claim** — does the referenced practice actually apply here? Is the cited version/API correct? Does the codebase already follow this pattern elsewhere?
3. **Cross-reference with codebase** — grep for the convention in question. If the codebase consistently does it differently, that's relevant context.
4. **State confidence** based on evidence quality:

| Confidence | Criteria |
|-----------|----------|
| 90%+ | Multiple authoritative sources confirm |
| 70–89% | One authoritative source |
| 50–69% | Conflicting sources or limited evidence |
| Below 50% | Flag as "Needs Discussion" |

Apply enterprise quality bar: SOLID principles, DRY, security posture, scalability, maintainability, readability, modern paradigms, cost implications.

## Assessment Framework

For each investigated comment, assess four dimensions:

| Dimension | High | Med | Low |
|-----------|------|-----|-----|
| **Validity** | Verified correct — evidence from code, docs, or authoritative sources confirms the issue | Likely correct but depends on context the reviewer may not have seen | Incorrect — the concern doesn't apply to this code path, or is based on outdated info |
| **Value** | Prevents bugs, security vulnerabilities, data loss, or production incidents | Improves maintainability, readability, or long-term code health | Cosmetic preference or subjective style choice with no measurable impact |
| **Risk** | Fix touches shared interfaces, public APIs, or cross-service contracts — requires extensive testing | Fix is localized but changes observable behavior — verify with targeted tests | Fix is isolated with no side effects — safe to apply without additional testing |
| **Confidence** | 90%+ — multiple authoritative sources confirm, codebase evidence aligns | 70–89% — one authoritative source, or codebase evidence supports but no external confirmation | Below 70% — conflicting sources, limited evidence, or unable to verify |

Also assess: end-user impact, regression potential, test coverage implications, deployment risk.

**Decision logic:** Score each dimension. Use the lowest-scoring dimension to guide the verdict:
- If **Validity is Low** → Dismiss (the concern doesn't apply)
- If **Confidence is Low** → Needs Discussion (not enough evidence to act)
- If **Value is Low** AND **Risk is not Low** → Dismiss (cosmetic fix with non-trivial risk isn't worth it)
- Otherwise → **Fix**, prioritized by: Value (high first), then Risk (high-risk fixes need more careful implementation)

**Every comment gets exactly one verdict:**
- **Fix** — with the optimal approach described, implementation steps, and any files affected
- **Dismiss** — with evidence-based rationale citing specific code, docs, or sources (not just "disagree")
- **Needs Discussion** — with the specific question that must be answered before a verdict is possible

## Report Template

Present findings in this exact structure:

**1. Executive summary header:**
```
## [PR Review] N comments — X fixes recommended, Y dismissed, Z need discussion
```

**2. Recommended Fixes** — grouped by logical concern (feature, component, service boundary), not by file or reviewer. Within each group, order by severity (CRITICAL > WARNING > NIT). Per item:
- Severity tag, issue title, reviewer attribution
- Assessment summary, evidence found
- Proposed fix approach, confidence percentage

**3. Dismissed** — one line per item:
```
- {Reviewer} — {file}:{line} "{comment snippet}" → {Rationale}
```

**4. Needs Discussion** (if any) — items where the agent couldn't reach a confident verdict, with the specific question that needs answering.

**5. Summary table:**
```
| # | Concern | Issue | Severity | Source | Confidence | Action |
```

**6. Batch approval prompt:**
```
Apply all X fixes? Or exclude by number (e.g., "skip 3,5"), or "discuss N".
```

**Grouping logic:** detect logical groupings by analyzing file paths and change relationships — files in the same service/feature directory or sharing imports/types form a logical group. Fall back to file-based grouping when changes are isolated.

## Implementation Protocol

After user approves fixes (all or subset):

1. **Pre-flight** — `git status`: if uncommitted changes exist, warn and ask how to proceed before making more changes.
2. **Implement** each approved fix in order.
3. **Verify each fix** — re-read the modified file after writing. Confirm the change is correct, complete, and no data was lost or truncated.
4. **Regression check** — did the fix break anything nearby (imports, type signatures, dependent code)?
5. **Run tests** if available — detect from project config (`npm test`, `pytest`, etc.).
6. **Complexity guard** — if a fix turns out more complex than expected (new dependencies, interface changes, multi-file refactor), STOP that fix, flag it, suggest delegating to `/investigate` or `/fix`. Do NOT attempt risky changes without user direction.
7. **Auto-revert on regression** — if any fix introduces a failure (test, type error, import break), revert immediately (`git checkout -- <file>`), report what happened. Do not continue to the next fix until user decides.
8. **Final diff + commit/push gate** — present all changes, proposed commit message, branch name, and "this will be visible to the team and trigger CI" as a single approval. On yes: commit via `/ai-assist-git-commit`, then push immediately. One gate, not two.
9. **Reply to addressed comments and resolve threads (required)** — after push, build a batch of replies for every addressed inline comment. Each reply must cite what changed and why — scaled to complexity but always concise. Trivial fixes get a one-liner; non-trivial fixes cite specific code or evidence, but in plain language, not paragraphs. Never hand-wave. Post each reply: `gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies -f body="<reply>"`. Then resolve each thread that is not already resolved via GraphQL: `gh api graphql -f query='mutation { resolveReviewThread(input:{threadId:"<thread_id>"}) { thread { isResolved } } }'`. Fetch thread IDs with: `gh api graphql -f query='{ repository(owner:"<owner>", name:"<repo>") { pullRequest(number:<N>) { reviewThreads(first:50) { nodes { id isResolved comments(first:1) { nodes { path body } } } } } } }'` — filter results to only threads where `isResolved: false` before resolving. Present the full batch (file, reply text) as a single gated preview. On approval, post all replies, resolve all unresolved threads, and verify.
