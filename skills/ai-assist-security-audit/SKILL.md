---
name: ai-assist-security-audit
description: "16-dimension security posture assessment with adaptive activation, health scoring, and remediation plan. Covers application security, infrastructure, auth, crypto, privacy, supply chain, and more. Use when assessing security posture, auditing code for vulnerabilities, reviewing compliance, or preparing for security reviews."
argument-hint: "[focus areas] [scope]"
---

# SECURITY AUDIT

**Objective:** Produce a severity-ranked, CWE-referenced security posture assessment with health score and actionable remediation plan.
**When to use:** Assessing security posture, auditing code, reviewing compliance (HIPAA/SOC2/PCI-DSS/GDPR), preparing for security reviews.

Start all responses with '🔐 [Security Audit Step X: Name]'

## Role

Senior security engineer conducting a full-spectrum posture assessment. Prioritize by real-world exploitability, cite CWEs/CVEs, produce actionable findings.

## Context

**AGENTS.md check:** If `./AGENTS.md` exists, read it — follow security-relevant conventions, architecture, and data handling. If missing, warn and proceed with standard practices.

**Spec awareness:** If `specs/` has active work, verify security changes don't conflict with in-progress implementation.

**Stack detection:** Detect language, framework, package manager, auth libraries, API frameworks, deployment targets from filesystem. Research current CVEs and best practices for the detected stack.

**Input:** `$ARGUMENTS` — optional focus areas and scope. Default: full audit, all activated dimensions.

## Rules

1. **Always-current standards.** Research and apply the latest versions of OWASP, ASVS, CWE, SLSA, NIST, and all other referenced standards at audit time. Never assume a specific version is current. Use the full standard, not just "Top 10" or "Top 25" subsets.
2. **Run audit tools first.** `npm audit` / `pip-audit` / `cargo audit` / `govulncheck` / `dotnet list package --vulnerable` before manual analysis.
3. **Map attack surface first.** Inputs, outputs, auth boundaries, data flows, integrations.
4. **Severity by exploitability.** Vector reachable? Blast radius? Known exploit/PoC?
5. **Every finding needs evidence.** File:line, CVE/CWE, or tool output.
6. **Remediation must be specific.** Exact code change, library upgrade, or config setting.
7. **All 16 dimensions are the checklist.** Audit every activated dimension. N/A = documented with rationale.
8. **Secrets detection thorough.** Grep for hardcoded keys, tokens, passwords, cloud-specific patterns.
9. **Chat-only output.** All findings in chat. Never create files without explicit user permission.

## Process

### Step 1: Context & Attack Surface

1. Read AGENTS.md, run `git status`, detect stack
2. Run audit tools (npm/pip/cargo audit)
3. Research current CVEs for detected framework versions
4. Read `references/dimensions.md` for scope detection rules and the STRIDE threat model
5. Map attack surface using STRIDE: entry points, auth boundaries, data flows, config files
6. Parse arguments for focus areas and determine scope (focused/branch/full)

> 🔐 [Security Audit Step 1: Context & Attack Surface] Stack: [tech]. Surface: [X] entry points, [Y] auth boundaries. Scope: [scope]. Activating dimensions.

### Step 2: Activate & Audit Dimensions

Read `references/dimensions.md` for the dimension activation table and per-dimension check definitions.

1. Activate dimensions based on detected project type
2. Audit each activated dimension in priority order (highest risk first): Secrets, Deps, Auth, AppSec, API, Infra, Crypto, BizLogic, Privacy, Network, CI/CD, ClientSide, DoS, Logging, Database, ThirdParty
3. If AI/LLM components detected: also audit against the AI/LLM security checks in dimensions.md

> 🔐 [Security Audit] Activated [X]/16 dimensions. Auditing dimension [N]: [Name]...

### Step 3: Findings Report & Score

Read `references/scoring.md` for health score calculation, severity definitions, and confidence levels.

Read `references/output-template.md` for finding format, summary table, positive observations, improvement plan, fix options, and session-end format.

1. Calculate health score using group weights and N/A redistribution
2. Rank findings by severity (Critical → Warning → Suggestion)
3. Present: stack summary, dimension findings with evidence, summary table, positive observations, health score, improvement plan, fix options

### Self-Verification Checklist

> Canonical version in `references/output-template.md`. Brief version here for quick reference.

- [ ] All activated dimensions audited; N/A dimensions documented
- [ ] Audit tools run (or documented why not)
- [ ] Every finding has file:line + CWE
- [ ] Severity reflects exploitability, not theoretical worst case
- [ ] Remediation verified against current framework docs
- [ ] No false positives from aspirational standards

### Session End

```
🔐 [Security Audit Complete]

**Score:** [XX]/100. [X] critical, [Y] warnings, [Z] suggestions across [N] dimensions.
```

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/security-<date>.md`?
- Fix findings? (use fix options from report)
- Related: `/ai-assist-observability-audit`, `/ai-assist-tech-debt`, `/ai-assist-test-audit`

## Recovery

| Issue | Solution |
|-------|----------|
| No package manifest | Audit code-level security; note deps not assessed |
| Audit tool unavailable | Manual CVE search; note limitation |
| Monorepo | Audit each workspace; aggregate in summary |
| No auth system | Note absence — appropriate for CLI, finding for web service |
| N/A dimensions | Document rationale; redistribute health score weights |

## Important Reminders

**Response format:** Every response starts with `🔐 [Security Audit Step X: Name]`

**Hard rules:** Always-current standards — research latest versions at runtime. Run audit tools first. Evidence for every finding. All 16 dimensions are the checklist.

**Process rules:** Attack surface first with STRIDE. Dimension activation is mandatory. Remediation must be specific — exact code changes, not general advice.

**Related:** `/ai-assist-observability-audit` for telemetry assessment, `/ai-assist-tech-debt` for codebase health, `/ai-assist-test-audit` for test coverage gaps.
