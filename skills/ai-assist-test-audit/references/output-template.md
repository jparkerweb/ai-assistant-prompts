# Output Template

> Part of [ai-assist-test-audit](../SKILL.md) — loaded during Step 5.

## Finding Format

Each finding follows this format:

```
**[Severity] [Title]** — Dim [#] | file:line (Conf: H/M)
Issue: [what's wrong]
Impact: [why it matters]
**Fix:** [Specific remediation]
```

Example:
```
**[Critical] Zero-Assertion Test Inflating Coverage** — Dim 3 | tests/auth/login.test.ts:42 (Conf: H)
Issue: Test calls login() but has no assertions — passes regardless of return value.
Impact: Inflates coverage by 12 lines while verifying nothing. Login bugs won't be caught.
**Fix:** Add assertions: `expect(result.token).toBeDefined(); expect(result.user.id).toBe(testUser.id);`
```

## Summary Table

Present all findings in a summary table after the detailed findings:

```
| # | Severity | Dim | Location | Issue (7-15 words) | Fix (7-15 words) |
|---|----------|-----|----------|---------------------|-------------------|
| 1 | Critical | 3-Quality | tests/auth/login.test.ts:42 | Zero-assertion test inflating coverage by 12 lines | Add token and user assertions |
| 2 | Warning | 4-Mocks | tests/api/users.test.ts:15 | Mock setup is 65% of test — testing mocks not code | Extract setup, mock at boundary only |
| 3 | Suggestion | 9-Doc | tests/utils/*.test.ts | Test names describe methods, not behavior | Rename to "should [behavior] when [condition]" |
```

## Gap Matrix

Module-by-dimension grid showing coverage across the codebase:

```
| Module | Cov | Typ | Qual | Mock | Data | Arch | CI | Perf | Doc | Mut | Ctr | A11y | Err | Edge | Mnt | Mod | Gaps |
|--------|-----|-----|------|------|------|------|----|------|-----|-----|-----|------|-----|------|-----|-----|------|
| auth/  |  V  |  V  |  T   |  V   |  X   |  V   | V  |  V   |  -  |  -  |  -  |  -   |  X   |  T   |  V   |  V   |  3   |
| api/   |  V  |  T  |  V   |  X   |  V   |  V   | V  |  V   |  -  |  -  |  V  |  -   |  V   |  V   |  V   |  V   |  2   |
```

Legend: V = good, T = partial, X = gap, - = N/A.

**Depth-based columns:**
- Quick: Show Cov, Qual, Edge only
- Standard: All active dimensions
- Deep: All 16 dimensions

## Deterministic Metrics Table

Reference `references/scoring.md` for the metrics table format and thresholds. Do not duplicate the table definition — use the thresholds from scoring.md and populate with actual execution values.

## Positive Observations

Include 3-5 things the test suite does well:

```
**What's done well:**
- Comprehensive integration test coverage on payment flow (95% branch coverage)
- Clean factory pattern for test data — consistent across 40+ test files
- CI pipeline runs full suite on every PR with coverage gates enforced
- Good use of testcontainers for database integration tests
- Error paths well-tested in authentication module
```

## Improvement Plan

Organize findings into priority tiers:

```
**Improvement Plan:**

**P1 — Critical (fix now):** False confidence and flakiness.
- #1: Zero-assertion tests in login flow
- #4: Flaky date-dependent test in billing

**P2 — Warnings (next sprint):** Coverage and quality gaps.
- #2: Over-mocking in API tests
- #5: No error path tests for payment processing

**P3 — Suggestions (backlog):** Maintainability and modernization.
- #3: Test naming conventions
- #6: Migrate from enzyme to Testing Library
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
🩺 [Test Audit Complete]

**Score:** [XX]/100. Depth: [depth]. Dimensions: [N]/16.
**Findings:** [X] critical, [Y] warnings, [Z] suggestions.
**Metrics:** [X]/[Y] passing, [Z]% coverage, [W]s duration.
**Next steps:** save report, implement fixes, create remediation plan, related skills.
```

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/test-audit-<date>.md`?
- Implement fixes? (offer fix options by priority)
- Create remediation plan? Use `/1-plan` with findings as input
- Deeper analysis? `/ai-assist-security-audit`, `/ai-assist-tech-debt`

## Self-Verification Checklist

Before presenting the final report, verify all 9 items:
- [ ] Tests executed (or documented why not)
- [ ] Metrics from actual test execution output, not estimates
- [ ] Every finding has file:line reference
- [ ] Over-mocking verified by reading actual mock setup code
- [ ] Gap matrix reflects actual modules in the codebase
- [ ] AGENTS.md conventions respected — project choices are not findings
- [ ] All active dimensions for the selected depth were audited
- [ ] Weights are consistent with depth level and N/A redistribution
- [ ] Depth mapping is correct (Quick=3 dims, Standard=12-14, Deep=16)
