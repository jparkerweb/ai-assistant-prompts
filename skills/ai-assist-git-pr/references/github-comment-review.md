# Comment Investigation Pipeline

> Part of [ai-assist-git-pr](../SKILL.md) — loaded during Comments mode.
> **Known consumers:** ai-assist-git-pr

This file contains the complete workflow for investigating PR review comments, from fetching through implementation. The workflow is split into two phases: investigation (read-only, auto) and implementation (gated).

## Fetch–Investigate

> **Loaded for:** Comments mode, Fetch+Investigate step (per the per-step Reference Loading table in SKILL.md). Covers the full investigation pipeline up to producing the Report — but does NOT include implementation, commit, reply, or resolve. Those are §Implement and §Reply–Resolve below.

## Workflow Steps

**Phase 1 — Investigation (Auto, read-only):**

1. Resolve owner/repo, PR number, and state in one call: `node "<SKILL_ROOT>/scripts/pr-context.cjs"` (returns `owner`, `repo`, `branch`, `ticketId`, and `pr`). Check the resolved `pr`:
   - **`pr: null`** → abort: "No PR found for this branch."
   - **MERGED** → abort: "PR #N was already merged. Comments can only be investigated on open PRs."
   - **CLOSED** → abort: "PR #N is closed. Comments can only be investigated on open PRs."
   - **OPEN** → proceed with the PR number.
2. Fetch both comment streams in one call (see Fetching Comments below) — no separate inline/issue fetches. **Then reconcile against the thread list before investigating (required — guards against truncated fetches):** run `node "<SKILL_ROOT>/scripts/list-threads.cjs" --number <N> --all` and confirm every `rootCommentId` it returns appears in the comment set you actually read. Large `fetch-comments` output is often truncated to an overflow file; reading that file from a non-zero offset can silently skip comments. For any `rootCommentId` missing from what you read, fetch its body directly (`gh api repos/<owner>/<repo>/pulls/comments/<id> --jq .body`). Do not proceed to investigation until the fetched set and the thread list fully reconcile.
3. If both streams are empty: report "No review comments on this PR" and exit
4. Investigate silently — for each comment, run the full pipeline: categorize (CRITICAL/WARNING/NIT), investigate (full file context, code path tracing, applicability check), research (library docs, codebase patterns), assess (validity/value/risk/confidence). Do NOT present findings incrementally — complete all investigation before presenting.
5. Build report following the Report Template below
6. Present report to user

**Phase 2 — Implementation (Gated):**

7. On user approval: implement approved fixes per the Implementation Protocol below
8. If user says "skip 3,5" — implement only non-excluded fixes
9. Present final diff summary with commit message, branch name, and "this will be visible to the team and trigger CI" — single gated checkpoint covering commit + push together.
10. On approval: commit via `Skill(skill: "ai-assist-git-commit", args: "<concise description>")`, then push immediately. Provide a subject-only description ≤80 chars (e.g., "fix: address Copilot review feedback on auth handler"). Do not author the full commit message body — ai-assist-git-commit owns format, length cap, and footer. If `Skill()` is unavailable, use the inline fallback in §Inline Commit Fallback below.
11. **Reply to comments and resolve threads (required)** — after push, reply to every addressed inline comment and resolve each thread that is not already resolved via `reply-resolve.cjs`. Each reply must cite what changed and why — scaled to complexity but always concise. Trivial fixes get a one-liner; non-trivial fixes cite specific code or evidence, but in plain language, not paragraphs. Never hand-wave. **No congratulatory or filler language** ("Good catch", "Great point", "Thanks", "You're right", etc.) — state the fix directly. Batch all replies into a single preview. One approval for the batch, then post all replies and resolve all unresolved threads.

**Safety boundaries:**
- Steps 1–6 (fetch + investigate + report) are **read-only and auto**
- Steps 7–8 (implement fixes) modify local code files — each fix verified, batch gets single approval gate
- Step 9–10 (commit + push) are one gated action — present all info upfront, one approval covers both
- Step 11 (comment replies) is one gated action — batch preview, one approval, post all
- If anything goes wrong during implementation: revert the failing fix, stop, report — do not continue without user direction

---

## Fetching Comments

Both comment streams are fetched in one shell-free call:

```
node "<SKILL_ROOT>/scripts/fetch-comments.cjs" --number <N>
```

It returns `{ inline: [...], issue: [...] }`:
- **inline** — line-specific review comments (`path` + `line`), where Copilot and human reviewers leave code feedback. Also carries `diffHunk` and `inReplyToId`.
- **issue** — general PR conversation comments (no file/line context).

Both types are investigated identically — inline comments just have richer starting context. `--number` is optional; omit it to resolve the current branch's PR (the script aborts if that PR is not OPEN).

> **`<SKILL_ROOT>`** = the directory containing this skill's `SKILL.md` (its install location). Use the absolute path you loaded the skill from. See §Scripts in SKILL.md for why every gh/git call goes through these scripts.

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

## Implement

> **Loaded for:** Comments mode, Implement step (per the per-step Reference Loading table in SKILL.md). Covers applying approved fixes locally, up to the commit/push gate. Commit itself is delegated via `Skill(skill: "ai-assist-git-commit", …)` per the commit delegation fix.

### Implementation Protocol

After user approves fixes (all or subset):

1. **Pre-flight** — `git status`: if uncommitted changes exist, warn and ask how to proceed before making more changes.
2. **Implement** each approved fix in order.
3. **Verify each fix** — re-read the modified file after writing. Confirm the change is correct, complete, and no data was lost or truncated.
4. **Regression check** — did the fix break anything nearby (imports, type signatures, dependent code)?
5. **Run tests** if available — detect from project config (`npm test`, `pytest`, etc.).
6. **Complexity guard** — if a fix turns out more complex than expected (new dependencies, interface changes, multi-file refactor), STOP that fix, flag it, suggest delegating to `/investigate` or `/fix`. Do NOT attempt risky changes without user direction.
7. **Auto-revert on regression** — if any fix introduces a failure (test, type error, import break), revert immediately (`git checkout -- <file>`), report what happened. Do not continue to the next fix until user decides.
8. **Final diff + commit/push gate**

   > **Preconditions** (do NOT proceed until ALL true):
   > - ✅ All approved fixes from §Implement have been applied locally
   > - ✅ `git status` shows the expected modified files only
   > - ✅ A concise commit description has been determined (≤80 chars; full format owned by ai-assist-git-commit)
   > - ✅ User has approved the commit + push as a combined gate
   >
   > Commit MUST be delegated via `Skill(skill: "ai-assist-git-commit", args: "<concise description>")`. Do not author the message body in this skill. If `Skill()` is unavailable, follow the inline fallback rules in §Inline Commit Fallback below.

   Final diff + commit/push gate — present all changes (file count, full diff), the **concise description ≤80 chars** that will be passed to ai-assist-git-commit, and the branch name. Frame as: "visible to team, triggers CI". On yes: commit via `Skill(skill: "ai-assist-git-commit", args: "<concise description>")`, then push. Do not author the commit message body in this skill. The commit skill enforces format (subject ≤80, ticket footer, AI Assisted). If `Skill()` is unavailable, use the inline fallback in §Inline Commit Fallback below.

## Reply–Resolve

> **Loaded for:** Comments mode, Reply+Resolve step (per the per-step Reference Loading table in SKILL.md). Covers posting replies that cite the fix commit and resolving the GraphQL review threads. Runs only after the commit + push step (steps 9–10) is complete.

9. **Reply to addressed comments and resolve threads (required)**

   > **Preconditions** (do NOT proceed until ALL true):
   > - ✅ The fix commit (or batch of commits) has been pushed (steps 9–10 complete)
   > - ✅ Each reply text cites the fix commit SHA
   > - ✅ Unresolved thread IDs have been fetched via `list-threads.cjs`
   > - ✅ User has approved the batch reply + resolve action (Gated)
   >
   > If any precondition is unmet, STOP and report which one. Do not run `reply-resolve.cjs`.

   After push, fetch the unresolved threads and map each to its root comment:

   ```
   node "<SKILL_ROOT>/scripts/list-threads.cjs" --number <N>
   ```

   Build a batch of replies for every addressed inline comment. Each reply must cite what changed and why — scaled to complexity but always concise. Trivial fixes get a one-liner; non-trivial fixes cite specific code or evidence, but in plain language, not paragraphs. Never hand-wave. **No congratulatory or filler language** — do not open with "Good catch", "Great point", "Thanks", "You're right", or similar; state the fix directly (e.g. "Removed the unused local in `<sha>`.", not "Good catch — removed the unused local."). Match each reply to its comment via `rootCommentId` and its `threadId` from the `list-threads` output.

   **Preview first (Gated):** present the full batch (file, reply text) as a single gated preview. Confirm with a no-write dry run:

   ```
   node "<SKILL_ROOT>/scripts/reply-resolve.cjs" --file <payload.json> --dry-run
   ```

   On approval, post all replies and resolve all unresolved threads in one shell-free batch:

   ```
   node "<SKILL_ROOT>/scripts/reply-resolve.cjs" --file <payload.json>
   ```

   The payload is `{ "number": <N>, "replies": [ { "commentId": <id>, "threadId": "<id>", "body": "<reply, citing the SHA>" } ] }`. Omit `threadId` to reply without resolving. Reply bodies pass through as exact strings (newlines, backticks, `<`/`>`, `COUNT(*)` all safe — no heredoc, no shell quoting). Verify every returned item has a `replyId` and `resolved: true`.

## Inline Commit Fallback

Use this fallback **only** if `Skill(skill: "ai-assist-git-commit", …)` invocation is unavailable in the current agent environment. The format must match what ai-assist-git-commit produces.

**Format:**
```
<subject ≤80 chars>

<TICKET-ID>
AI Assisted
```

**Rules (subset of ai-assist-git-commit/SKILL.md):**
1. Subject is one line, ≤80 characters
2. Body absent by default; only add 1–2 short sentences if the subject genuinely cannot capture the change (3 lines absolute ceiling)
3. Ticket ID is extracted from the branch name (`prefix/TICKET-ID-description`)
4. Footer is exactly: blank line + `<TICKET-ID>` + `AI Assisted`
5. No "Claude Code", "GitHub Copilot", "Generated by" or other AI tool attributions
6. No enumerated review-fix lists, phase recaps, change inventories, or PR-summary copies in the body

Write the message to a temp file and commit with `git commit -F` to preserve formatting. This is the only cross-shell-safe form — a bash heredoc (`"$(cat <<'EOF' … )"`) is a parse error in PowerShell, and multiple `-m` flags insert a blank line between each, breaking the consecutive `<TICKET-ID>` / `AI Assisted` footer:

```
# write to .git/COMMIT_EDITMSG_AI_ASSIST.txt (any tool), then:
git commit -F .git/COMMIT_EDITMSG_AI_ASSIST.txt
# then delete the temp file
```

Prefer `Skill()` delegation whenever possible — it is the single source of truth for commit format.
