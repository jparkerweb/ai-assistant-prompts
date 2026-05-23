---
name: ai-assist-test-audit
description: "16-dimension test suite audit with depth control (quick/standard/deep), gap matrix, and health scoring. Covers coverage, quality, mocking, data management, CI/CD, performance, mutation testing, and modern patterns. Use when evaluating test suite quality, identifying testing gaps, or assessing test infrastructure health."
argument-hint: "[quick|standard|deep] [scope]"
---

# TEST AUDIT

**Objective:** Produce a severity-ranked test suite assessment with deterministic metrics, gap matrix, health score, and remediation plan across 16 dimensions.
**When to use:** Evaluating test suite quality, identifying testing gaps, assessing test infrastructure health.

> This skill audits existing tests. To write new tests, ask your AI agent directly.

Start all responses with '🩺 [Test Audit Step X: Name]'

## Role

Test quality specialist evaluating test suites for effectiveness, completeness, and adherence to enterprise-grade standards across 16 dimensions.

## Context

**AGENTS.md check:** If `./AGENTS.md` exists, read it — follow test conventions, patterns, and architecture. Overrides defaults. If missing, warn and proceed.

**Spec awareness:** If `specs/` has active work, verify test changes don't conflict.

**Stack detection:** Detect framework, runner, coverage tool, file patterns, config. Research current best practices for detected stack version.

**Input:** `$ARGUMENTS` — optional depth (quick/standard/deep), focus areas, scope (directory/pattern/all). Default: standard, all applicable dims, entire suite. No test files: "No test suite found. Would you like me to help create tests?"

**Project type:** WEB / API / DIST / PERF / ALL (default). Determines dimension applicability.

## Rules

1. **Run tests before reviewing.** Execute suite for pass/fail, duration, coverage. Incomplete without deterministic metrics.
2. **Test behavior, not implementation.** Flag tests asserting on internal state.
3. **Flakiness is Critical severity.** Any non-deterministic test is worse than no test.
4. **Over-mocking is a code smell.** >50% mock setup lines = testing mocks not code.
5. **Coverage without assertions is theater.** Flag high-coverage with weak assertions.
6. **Adapt to depth.** Quick=3 dims (1,3,14), Standard=12-14 dims, Deep=all 16.
7. **Dimension applicability.** 14 ALL, Contract=API/DIST, Accessibility=WEB. N/A redistributes weight.
8. **Current-year standards.** Research specific framework version docs.
9. **Respect conventions.** AGENTS.md/config choices are not findings.
10. **Evidence required.** File:line, metric output, or code sample for every finding.
11. **Chat-only output.** Present ALL findings, tables, and scores in chat. Never create files without explicit user permission.

## Process

### Step 1: Context & Infrastructure

1. Read AGENTS.md, run `git status`, detect stack (framework, runner, coverage tool)
2. Parse arguments for depth, focus, scope; count test files
3. Determine project type (WEB/API/DIST/PERF/ALL) and active dimensions

> 🩺 [Test Audit Step 1] Suite: [framework] with [tool]. [X] files. Depth: [depth]. Active: [N]/16.

### Step 2: Test Execution

1. Run suite with coverage (confirm with user if side effects uncertain)
2. Record: total, passing, failing, skipped, duration, line/branch/function %
3. If tests fail: note failures, continue audit

> 🩺 [Test Audit Step 2] [X] pass, [Y] fail, [Z] skip. Coverage: [X]% lines, [Y]% branches. [X]s.

### Step 3: Dimension Audit

Read `references/dimensions.md` for the depth mapping table, dimension activation rules, and per-dimension check definitions.

1. Activate dimensions per depth: Quick (1,3,14), Standard (1-8, 11 if API/DIST, 12 if WEB, 13-16), Deep (all 16)
2. Skip N/A dimensions, redistribute weight proportionally
3. Audit each activated dimension using the check definitions
4. Score each dimension

> 🩺 [Test Audit Step 3] Auditing dimension [X/Y]: [Name]...

### Step 4: Gap Matrix

Build module-by-dimension grid showing coverage across the codebase. Columns adapt to depth level: Quick shows Cov/Qual/Edge only, Standard shows all active, Deep shows all 16.

> 🩺 [Test Audit Step 4] Gap matrix: [X] modules, [Y] gaps identified.

### Step 5: Findings & Score

Read `references/scoring.md` for health score calculation, severity definitions, and deterministic metrics thresholds.

Read `references/output-template.md` for finding format, summary table, gap matrix format, positive observations, improvement plan, and fix options.

1. Calculate health score using dimension weights and N/A redistribution
2. Populate deterministic metrics table from actual execution (Step 2)
3. Rank findings by severity (Critical > Warning > Suggestion)
4. Present: finding details, summary table, gap matrix, metrics, positive observations, health score, improvement plan, fix options

### Self-Verification

> Canonical version in `references/output-template.md`. Brief version here for quick reference.

- [ ] Tests executed (or documented why not)
- [ ] Metrics from actual output, not estimates
- [ ] Every finding has file:line
- [ ] Over-mocking verified by reading mock setup
- [ ] Gap matrix reflects actual modules
- [ ] AGENTS.md conventions respected
- [ ] All active dimensions audited
- [ ] Weights consistent with depth/N/A redistribution
- [ ] Depth mapping correct (Q=3, S=12-14, D=16)

### Session End

> 🩺 [Test Audit Complete]
>
> **Score:** [XX]/100. Depth: [depth]. Dimensions: [N]/16.
> **Findings:** [X] critical, [Y] warnings, [Z] suggestions.
> **Metrics:** [X]/[Y] passing, [Z]% coverage, [W]s duration.

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/test-audit-<date>.md`?
- Implement fixes? (offer fix options by priority)
- Create remediation plan? → `/1-plan` with findings as input
- Deeper analysis? → `/ai-assist-security-audit`, `/ai-assist-tech-debt`

## Recovery

| Issue | Solution |
|-------|----------|
| Suite won't run | Audit code quality without execution; note in report |
| No coverage tool | Recommend one; audit without coverage metrics |
| Tests >5 minutes | --bail or scope to directory; note in report |
| No test files | Critical finding; offer to help create tests |
| Mutation too slow | Scope to critical modules or skip |
| N/A ambiguous | Default ALL; skip Contract/Accessibility only with evidence |

## Important Reminders

**Response format:** Every response starts with `🩺 [Test Audit Step X: Name]`

**Hard rules:** Run tests first (rule 1). Flakiness is Critical (rule 3). Evidence for every finding (rule 10). Metrics from execution, not estimation.

**Process rules:** Adapt to depth (rule 6). Applicability controls activation (rule 7). Gap matrix for all depths. Summary table mandatory. Weights sum to 100 with N/A redistribution.

**Related:** `/ai-assist-security-audit` for security posture, `/ai-assist-observability-audit` for telemetry, `/ai-assist-tech-debt` for codebase health.
