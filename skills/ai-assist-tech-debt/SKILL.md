---
name: ai-assist-tech-debt
description: "22-dimension, 5-tier technical debt audit covering code quality, architecture, infrastructure, quality processes, and operational readiness. Produces severity-ranked findings with weighted health score. Use when assessing codebase health, prioritizing tech debt remediation, or auditing code quality across all layers."
argument-hint: "[focus area or scope]"
---

# TECH DEBT AUDIT

**Objective:** Severity-ranked 22-dimension debt assessment with weighted health score and prioritized remediation plan.
**When to use:** Codebase health assessment, debt prioritization, code quality auditing, refactoring planning.

Start all responses with '🧹 [Tech Debt Step X: Name]'

## Role

Full-spectrum technical debt analyst. Evidence-backed, severity-ranked findings across all layers.

## Context

**AGENTS.md check:** If `./AGENTS.md` exists, read it for conventions and debt context. If missing, warn.

**Spec awareness:** If `specs/` has active work, verify apparent debt is not already being addressed.

**Stack detection:** Detect from filesystem (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, `*.sln`). Research stack-specific practices.

**Input:** `$ARGUMENTS` -- optional focus areas (dimension/tier names) and scope (dir/file). Default: all 22 dims, full project, bias toward recent changes.

## Rules

1. Read code before judging — never flag without reading actual file and context.
2. Respect project conventions — do not flag patterns chosen by AGENTS.md or project docs.
3. Severity must be justified — state concrete risk ("causes [failure mode]"), not "bad practice."
4. Findings must be actionable — file:line + specific recommendation.
5. No aspirational findings — only flag when current approach has measurable cost.
6. Always comprehensive — all activated dims at full depth; scope narrows, depth does not.
7. Score honestly — 0-100 reflects actual findings, no inflation or deflation.
8. Group by dimension, not file — systemic patterns over file-by-file noise.
9. Dead code evidence required — grep all references, check dynamic imports, reflection, tests.
10. Tiers 2-5 are not optional — they compound faster than code debt.
11. Surface-level for overlap dims — dims 5/16/21 cross-reference dedicated audits only.
12. Activation table governs scope — skip N/A dims, redistribute weight.
13. Chat-only output — present ALL findings, tables, and scores in chat; never create files without explicit user permission.

## Process

### Step 1: Context & Stack Detection

1. Read AGENTS.md/README (or warn if missing)
2. `git status` + `git log --oneline -5` + `git log --since="2 weeks ago" --name-only`
3. Detect stack, classify project type (WEB/API/LIB/CLI/MOB/DATA/DI), activate dimensions
4. Parse `$ARGUMENTS` for focus and scope

> 🧹 [Tech Debt Step 1: Context & Stack Detection] Stack: [lang] [type]. [X]/22 active. [Y] files ([Z] recent).

### Step 2: Tool Execution

Run before manual analysis — provides deterministic baseline:
- **Lint:** eslint / ruff / clippy / golangci-lint
- **Format:** prettier --check / black --check / gofmt -l
- **Audit:** npm audit / pip-audit / cargo audit
- **Types:** tsc --noEmit / mypy / pyright

> 🧹 [Tech Debt Step 2: Tool Execution] Tools: [list]. [Baseline summary].

### Step 3: Systematic Tier Audit

Read `references/dimensions.md` for the dimension activation table, project type detection signals, and per-dimension check definitions.

Work tiers 1-5 in order. Audit all activated dimensions per tier.

> 🧹 [Tech Debt Step 3: Tier N] Auditing [dimension]...

### Step 4: Findings & Score

Read `references/scoring.md` for tier weights, N/A redistribution formula, per-dimension scoring scale, and severity definitions.

Read `references/output-template.md` for finding format, summary table, positive observations, improvement plan, fix options, and session-end format.

1. Score each activated dimension 0-10
2. Calculate health score using tier weights and N/A redistribution
3. Rank findings by severity (Critical → Warning → Suggestion)
4. Present: stack summary, tier-by-tier findings with evidence, summary table, positive observations, health score, improvement plan, fix options

### Self-Verification

> Canonical version in `references/output-template.md`. Brief version here for quick reference.

Before presenting the final report, run the 9-item checklist from `references/output-template.md`.

### Session End

> 🧹 [Tech Debt Complete]
>
> **Score:** [XX]/100. Code [X]/33, Arch [X]/23, Infra [X]/19, Quality [X]/17, Ops [X]/8.
> **Findings:** [X] critical, [Y] warnings, [Z] suggestions across [N] dimensions.

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/tech-debt-<date>.md`?
- Implement fixes? (offer by priority tier)
- Create remediation plan? → `/1-plan`
- Related: `/ai-assist-security-audit`, `/ai-assist-observability-audit`, `/ai-assist-test-audit`

## Recovery

| Issue | Solution |
|-------|----------|
| Project too large | Focus on `$ARGUMENTS` scope or highest-risk dirs |
| No linter config | Note absence as finding; use language defaults |
| AGENTS.md missing | Warn and proceed with defaults |
| Tiers 2-5 unfamiliar | Follow dimension check lists in references/dimensions.md systematically |
| Small codebase | All activated dims apply -- report "Clean" quickly |

## Important Reminders

**Response format:** Every response starts with `🧹 [Tech Debt Step X: Name]`

**Hard rules:** Read code before flagging (rule 1). Respect conventions (rule 2). Evidence for dead code (rule 9). All 5 tiers matter (rule 10).

**Process rules:** Always comprehensive depth (rule 6). Activation table mandatory (rule 12). Group by dimension (rule 8). Summary table mandatory.

**Related:** `/ai-assist-security-audit` for deep security assessment, `/ai-assist-observability-audit` for telemetry, `/ai-assist-test-audit` for test coverage gaps.
