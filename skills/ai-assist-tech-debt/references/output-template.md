# Output Template

> Part of [ai-assist-tech-debt](../SKILL.md) — loaded during Step 4.

## Finding Format

Each finding follows this format:

```
**[Severity] [Title]** — Dim [#] | file:line (Conf: H/M)
Issue: [what's wrong and why — "causes [failure mode]"]
**Fix:** [Specific recommendation]
```

Example:
```
**[Warning] Silent Error Swallowing in Payment Handler** — Dim 4 | src/payments/handler.ts:87 (Conf: H)
Issue: Empty catch block on payment processing — causes failed payments to silently disappear, user charged but order not created.
**Fix:** Log error with context, return appropriate error response, add dead-letter queue for failed payments.
```

## Summary Table

Present all findings in a summary table after detailed findings:

```
| # | Severity | Dim | Location | Issue | Fix |
|---|----------|-----|----------|-------|-----|
| 1 | Critical | T1.4 | src/payments/handler.ts:87 | Silent catch on payment | Add error handling + DLQ |
| 2 | Warning | T2.8 | src/features/ | Feature scatter across 7 dirs | Consolidate feature modules |
| 3 | Suggestion | T1.7 | src/utils/helpers.ts:12 | TODO from 2022 | Resolve or remove |
```

## Positive Observations

Include 3-5 things the project does well. Provides balanced assessment and acknowledges good practices:

```
**What's done well:**
- Consistent error handling patterns in API layer — all endpoints return structured errors
- Strong type coverage — <2% `any` usage across 50+ source files
- Dependencies well-maintained — all within 1 major version of latest
- Clean module boundaries — feature directories with barrel exports
- Comprehensive CI pipeline — lint, test, build, deploy stages all present
```

## Improvement Plan

Organize findings into priority tiers:

```
**Improvement Plan:**

**P1 — Critical (fix now):** Active risk.
- #1: Silent payment error handling
- #4: Resource leak in connection pool

**P2 — Warnings (next sprint):** Accumulating debt.
- #2: Feature scatter across directories
- #5: N+1 queries on dashboard endpoint

**P3 — Suggestions (backlog):** Polish and modernization.
- #3: Stale TODOs from 2022
- #6: Missing EditorConfig
```

## Fix Options

After presenting findings, offer the user choices for remediation:

```
How would you like to proceed?
C — Critical findings only
W — Critical + warnings
A — All findings
S — Select specific (e.g., "S 1,3,5" to fix findings #1, #3, #5)
```

After selection: apply fixes one at a time, track progress with `**Patch Progress: X/Y**`, present each change for approval before moving to the next.

## Session End Format

```
🧹 [Tech Debt Complete]
**Score:** [XX]/100. Code [X]/33, Arch [X]/23, Infra [X]/19, Quality [X]/17, Ops [X]/8.
**Findings:** [X] critical, [Y] warnings, [Z] suggestions across [N] dimensions.
**Next steps:** save report, implement fixes, create remediation plan, related skills.
```

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/tech-debt-<date>.md`?
- Implement fixes? (offer by priority tier using fix options above)
- Create remediation plan? → `/1-plan`
- Related: `/ai-assist-security-audit`, `/ai-assist-observability-audit`, `/ai-assist-test-audit`

## Self-Verification Checklist

Before presenting the final report, verify all 9 items:

- [ ] Every finding has file:line reference
- [ ] Every Critical/Warning has concrete risk statement ("causes [failure mode]")
- [ ] Dead code claims grep-verified (all references checked including dynamic imports, tests, framework conventions)
- [ ] Project conventions respected — did not flag patterns chosen by AGENTS.md or project docs
- [ ] Score reflects actual findings — no inflation or deflation
- [ ] All activated dimensions audited — none skipped
- [ ] Tiers 2-5 received real analysis — not just Tier 1 code review
- [ ] Overlap dims (T1.5-Security, T4.16-Testing, T5.21-Observability) are surface-level with cross-references to dedicated skills
- [ ] Weight redistribution correct for N/A dimensions — adjusted weights sum to 100
