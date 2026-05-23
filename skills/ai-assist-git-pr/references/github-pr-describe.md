# PR Description & Analysis

> Part of [ai-assist-git-pr](../SKILL.md) — loaded during Create and Describe modes for context gathering, diff analysis, and description drafting.
> See also: github-pr-create.md (Create/Status workflows), github-pr-templates.md (body templates and scaling rules).
> **Known consumers:** ai-assist-git-pr

This file contains the shared analysis and drafting logic used by both Create and Describe modes. Create Mode loads this file alongside github-pr-create.md; Describe Mode loads this as its primary workflow reference.

---

## Context Gathering

Build a complete picture before writing anything. Collect from all available sources, weighted by the source-of-truth hierarchy (code is always authoritative).

**Diff source:** Create mode uses `git diff origin/$base...HEAD`. Describe mode uses a fresh `gh pr diff` (do NOT reuse cached diff).

1. **Code diff** (authoritative) — read every changed file fully, not just diff hunks. Understand surrounding context, callers, dependencies.
2. **Commit history** (authoritative) — `git log origin/$base..HEAD --format='%h %s'`. Commit messages reveal intent, sequencing, and scope evolution. Multiple commits may tell a different story than the final diff alone.
3. **Changed file contents** (authoritative) — for non-trivial changes, read the full file to understand what the change fits into. Trace imports, callers, consumers, side effects.
4. **Project docs** — AGENTS.md, .agents-docs/, README, architectural docs. Understand conventions, naming, patterns the reviewer expects.
5. **External research** (as needed) — if the diff touches libraries, security patterns, or unfamiliar APIs, verify approaches against official docs, advisories, or trusted sources. Don't speculate about correctness — confirm it.

---

## Change Analysis Framework

For every changed file in the PR, complete this analysis before writing a single word of the description. This is internal analysis — most of it won't appear in the output, but it ensures the description is accurate and well-grounded.

### Per-File Analysis

For each file in the diff:

1. **What category is this change?**
   - Bug fix (corrects wrong behavior)
   - Feature (adds new behavior)
   - Refactor (changes structure, same behavior)
   - Config (settings, environment, build)
   - Test (new or updated tests)
   - Docs (documentation, comments)
   - Cleanup (formatting, imports, dead code removal)

2. **What's the behavioral impact?**
   - Does this change what the system *does*? (behavior change)
   - Does this change how it *does it*? (implementation change)
   - Does this change how it's *built/deployed/configured*? (infrastructure change)
   - No behavioral impact? (cleanup/docs)

3. **Why was this change needed?**
   - Look at the surrounding code for context
   - Check if the diff references error messages or specific conditions
   - If a bug fix: what was the original bug? How does this fix it?
   - If a feature: what user/system need does this serve?

4. **Is there risk here?**
   - Does this change a critical path (auth, payments, data integrity)?
   - Does it change shared interfaces that other code depends on?
   - Could it break existing behavior?
   - Is there adequate test coverage for the change?

### Cross-File Analysis

After analyzing individual files, look at the changes as a whole:

1. **What's the story?** Can you explain the entire PR in one sentence? If not, the PR might have mixed concerns — note this.

2. **How do files relate?** A model change + migration + API update + test = one coherent feature. A model change + unrelated config fix = mixed concerns.

3. **What's the primary change vs. supporting changes?** Usually 1-3 files are the "real" change and the rest are consequences (imports, types, tests, config). The description should lead with the primary change.

4. **What's NOT changed that you'd expect?** Missing tests for new behavior? Missing migration for a schema change? Note gaps — reviewers will catch them anyway, and mentioning them builds trust.

### Context Reconciliation

After per-file and cross-file analysis, reconcile all gathered sources before drafting:

1. **Commits vs. diff** — Do commit messages tell a story the final diff obscures? Sequential commits may reveal: failed approaches that were reverted, incremental refactors, scope changes mid-development. Use commit narrative to explain *why* the final state looks the way it does.

2. **Code vs. project conventions** — Does the change follow patterns from AGENTS.md and existing code? If it introduces a new pattern, call that out as a key decision. If it deviates from conventions, explain why.

3. **Code vs. external sources** — If the diff touches libraries, security-sensitive code, or unfamiliar APIs, were approaches validated against official docs or trusted sources? Flag unverified patterns honestly rather than assuming correctness.

**Rule: when sources conflict, the code wins.** The description describes the PR, not the plan, not what should have been built. Describe what the code actually does.

### Diff Reading Techniques

#### Additions (+ lines)

For each addition, identify what it enables that didn't exist before:
- New functions/methods — determine their purpose and callers
- New error handling — identify what failure was previously unhandled
- New conditions/branches — determine what edge case is now covered
- New config — identify what was hardcoded and is now configurable

#### Deletions (- lines)

For each deletion, determine why the code was removed:
- Hardcoded values removed — check if replaced with config
- Logic removed — verify whether moved elsewhere or no longer needed
- Workarounds removed — confirm the underlying issue was fixed

#### Modifications (adjacent +/- lines)

Modifications are often the highest-impact changes. For each:
- Parameter changes — determine what new capabilities the arguments enable
- Condition changes — identify whether logic was broadened or narrowed and why
- Return value changes — trace impact on all callers
- Error message changes — note improved diagnostics

#### Patterns Across the Diff

Detect these patterns and describe them as patterns, not as individual file changes:
- **Same change in many files:** Rename, API migration, or convention update — describe the pattern once, not per-file
- **New file + many small changes:** The new file is the feature; small changes wire it in — lead with the new file
- **Deleted file + new file:** Replacement — explain what was wrong with the old approach
- **Config + code changes:** The config enables or controls the code change — connect them in the description

### Prioritizing What Goes in the Description

Not every change deserves equal space. Rank by reviewer impact:

| Priority | What Goes Here | Space |
|----------|---------------|-------|
| **High** | Behavioral changes, new features, bug fixes, security changes | Detailed bullet or table row |
| **Medium** | Design decisions, non-obvious implementation choices | Key Decisions section |
| **Low** | Test additions, config plumbing, import changes | Brief mention or omit |
| **Skip** | Formatting, comment-only changes, auto-generated updates | Don't mention unless they're the entire PR |

### Common PR Patterns

#### Bug Fix PR
- Lead with: what was broken, for whom, how badly
- Explain: root cause (specifically), fix approach, why this fix is correct
- Evidence: error messages, logs, reproduction steps if relevant

#### Feature PR
- Lead with: what users/systems can now do that they couldn't before
- Explain: key design choices and trade-offs
- Note: what's NOT included (follow-up work, known limitations)

#### Refactor PR
- Lead with: why the refactor was needed (not "code was messy")
- Explain: what's structurally different and why it's better
- Assure: behavior is unchanged (and how you verified)

#### Dependency/Config PR
- Lead with: what changed and why (security patch? new feature needed? deprecation?)
- Note: any breaking changes or behavior differences
- Version numbers if relevant

#### Multi-Concern PR
- Lead with: acknowledge it touches multiple areas
- Organize: group changes by concern, not by file
- Suggest: review order if it matters

---

## Describe Mode

**Trigger:** "describe", "update description", "PR body", "write description"
**Safety:** Gated

### Steps

**Step 0 — Pre-flight:**
Fetch existing PR: `gh pr view --json number,url,title,body,state`. Check:
- **No PR (exit code 1)** → abort: "No PR found for this branch. Create one first?"
- **MERGED** → abort: "PR #N was already merged. Create a new PR first, then describe it."
- **CLOSED** → abort: "PR #N is closed. Create a new PR first, then describe it."
- **OPEN** → proceed. If non-empty body: "This PR already has a description ([N] chars). Replace entirely, or append?" Gate on user's choice.

**Step 1 — Find PR:**
`gh pr view --json number,url,title,body` — capture PR number, current body.

**Step 2 — Fetch fresh diff:**
`gh pr diff` — stale data guard: do NOT reuse cached diff from a previous mode.

**Step 3 — Gather full context:**
Follow the Context Gathering procedure above. Use the fresh diff from Step 2 as the code diff source.

**Step 4 — Analyze and synthesize:**
Apply the Change Analysis Framework above. Reconcile all gathered sources against the actual code following the Context Reconciliation rules above. Read `references/github-pr-templates.md` — select the template matching this PR's size (small: 1-5 files, medium: 5-15, large: 15+).

**Step 5 — Draft description:**
Draft following the selected template structure exactly — use the `| Area | Change | Why |` table for medium+ PRs, include Key Decisions when non-obvious choices were made, and end with Test Plan. Ground content in what the code shows, enriched by project context where it aligns. Evidence-based (cite specific files/lines), concise (no filler, no restating the diff). End with `AI Assisted`.

**Step 6 — Preview (gated):**
Present proposed description alongside note of what's being replaced (old body length). This is a gated action.

**Step 7 — Update PR:**
On approval: write body to temp file, re-read to verify, run `gh pr edit <number> --body-file <path>`.

**Step 8 — Verify:**
`gh pr view --json body --jq '.body | length'` — confirm non-zero. If length doesn't match expected (>10% mismatch), re-read full body and report discrepancy.

> 📋 [PR Describe] Updated description for PR #[N] — [url]
