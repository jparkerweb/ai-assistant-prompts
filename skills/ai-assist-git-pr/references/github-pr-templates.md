# PR Description Template

> Part of [ai-assist-git-pr](../SKILL.md) — loaded during Create (Step 4) and Describe (Step 4) modes.
> **Known consumers:** ai-assist-git-pr

## Template Structure

Use this template as a starting point. Adapt sections based on the PR size and type — small PRs skip the table, large PRs may need subsections. The goal is always: minimum viable description that covers everything.

---

### For Small PRs (1-5 files, single concern)

```markdown
## Summary

[1-2 sentences: what this PR does and why. Plain language. A manager should understand this.]

## Changes

- [Behavioral change 1 — what it does and why]
- [Behavioral change 2]
- [If relevant: what was removed and why]

## Test Plan

- [ ] [How to verify this works]

AI Assisted
```

**Example:**

```markdown
## Summary

Increases the Provisioning API timeout from 30s to 5 minutes (configurable via web.config) — large clients were hitting the default timeout when retrieving MS Teams lists.

## Changes

- New `ProvisioningServiceTimeoutSeconds` setting in web.config (default: 300s)
- `TimeoutSeconds` added to debug logs for API calls so timeout issues are visible in Splunk
- Timeout value read from config at startup, not hardcoded

## Test Plan

- [ ] Verify large client Teams retrieval completes without timeout
- [ ] Confirm timeout value appears in debug logs

AI Assisted
```

---

### For Medium PRs (5-15 files, clear scope)

```markdown
## Summary

[1-2 sentences: the problem and the solution at a high level.]

## What Changed

| Area | Change | Why |
|------|--------|-----|
| [component/module] | [brief change] | [rationale] |
| [component/module] | [brief change] | [rationale] |
| [component/module] | [brief change] | [rationale] |

## Key Decisions

- **[Decision 1]:** [Brief rationale — why this approach over alternatives]
- **[Decision 2]:** [Brief rationale]

## Test Plan

- [ ] [Verification step]
- [ ] [Verification step]

AI Assisted
```

---

### For Large PRs (15+ files, multiple concerns)

```markdown
## Summary

[1-2 sentences: the high-level change. Keep this scannable.]

[If applicable: "This PR is large because [reason] — [suggestion to review by area]".]

## What Changed

### [Area/Module 1]

| File | Change | Why |
|------|--------|-----|
| `path/to/file.ts` | [what changed] | [why] |
| `path/to/other.ts` | [what changed] | [why] |

### [Area/Module 2]

| File | Change | Why |
|------|--------|-----|
| `path/to/file.ts` | [what changed] | [why] |

## Key Decisions

- **[Decision 1]:** [Rationale]
- **[Decision 2]:** [Rationale]

## Risks & Notes

- [Anything the reviewer should pay extra attention to]
- [Known limitations or follow-up work]

## Test Plan

- [ ] [Verification step]
- [ ] [Verification step]

AI Assisted
```

---

## Create PR Template

Used by Create mode to generate both title and body for new PRs.

### Title Format

`<imperative verb> <key change>` — max 72 characters.

- Use imperative mood: "Add", "Fix", "Update", "Remove", "Refactor"
- Describe the primary behavioral change, not implementation detail

**Examples:**
- `Add user authentication middleware`
- `Fix PDF export timeout for large clients`
- `Remove deprecated provisioning endpoints`

### Body

Use the small/medium/large template above based on diff scope:

| Files Changed | Diff Lines Added | Template |
|--------------|------------------|----------|
| 1-5 | < 100 | Small |
| 5-15 | 100-500 | Medium |
| 15+ | 500+ | Large |

When in doubt, use Medium. Complexity trumps file count — a 3-file auth change may warrant Medium.

---

## Writing Guidelines

### Summary Section

The summary is the most important line. It should:
- Be 1-2 sentences max
- Explain the **problem** and **solution**, not just list changes
- Use plain language — a non-engineer should roughly understand it
- Not start with "This PR..." (the reader knows it's a PR)

**Bad:** "This PR updates several files to fix issues with the PDF export system."
**Good:** "PDF exports were failing for large clients due to cascading timeouts across all three rendering engines. Adds retry logic and circuit breaking to handle transient failures gracefully."

### Change Table

Tables are the fastest way for reviewers to understand multi-file changes. Keep cells short — fragments, not sentences.

| Area | Change | Why |
|------|--------|-----|
| `PdfWriter` | Circuit breaker on Playwright server | Prevents cascading failures when server is unhealthy |
| `VaultService` | Retry transient HTTP errors (429, 503) | Single failures were killing entire export jobs |
| `appsettings.json` | Configurable timeout (default 5min) | Large clients need more time, value was hardcoded |

**Rules for the table:**
- "Area" = component name or file path (whichever is more meaningful)
- "Change" = what the code does differently now (imperative: "Add", "Remove", "Change")
- "Why" = the actual reason, not a restatement of the change

### Key Decisions

Only include decisions where:
- There was a meaningful alternative you didn't choose
- The approach might surprise a reviewer
- The reasoning isn't obvious from the code

Skip this section entirely for straightforward changes.

### Test Plan

Bullet-point checklist. Each item should be:
- Specific enough that someone else could verify it
- Focused on behavior, not implementation ("exports complete for 1000+ items" not "loop handles edge case")

### Things to Avoid

- **File-by-file narration.** "Updated foo.ts, updated bar.ts, updated baz.ts" tells reviewers nothing. Group by behavior/concern.
- **Repeating the diff.** The reviewer can read the diff. Explain what the diff *means*.
- **Excessive detail on trivial changes.** Import reorders, formatting, typo fixes — mention once if at all ("minor cleanup" as a bullet).
- **Hedging language.** "I think this should fix..." — if you're not sure, investigate more before describing it.
- **Emojis in section headers.** Keep it clean and professional.

### Scaling the Description

| PR Size | Description Length | Sections |
|---------|-------------------|----------|
| 1-3 files | 5-10 lines | Summary + Changes bullets |
| 4-10 files | 10-20 lines | Summary + Change table + Test plan |
| 10-25 files | 20-35 lines | Summary + Grouped table + Key decisions + Test plan |
| 25+ files | 35-50 lines | Summary + Module sections + Decisions + Risks + Test plan |

These are guidelines, not rules. A 3-file PR that changes critical auth logic might need more than 10 lines. A 30-file rename might need 5.
