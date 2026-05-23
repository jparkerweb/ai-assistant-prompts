---
name: ai-assist-observability-audit
description: "17-dimension observability audit with tier activation, health scoring, and cost analysis. Covers logging, metrics, tracing, alerting, SLOs, profiling, security observability, and developer experience. Use when assessing observability posture, identifying telemetry gaps, or optimizing observability costs."
argument-hint: "[dimension or scope]"
---

# OBSERVABILITY AUDIT

**Objective:** Produce a tier-activated, cost-aware observability posture assessment with health score and prioritized improvement plan across 17 dimensions.
**When to use:** Assessing observability posture, identifying telemetry gaps, auditing cost efficiency, preparing for production readiness, optimizing observability spend.

Start all responses with '📡 [Obs Audit Step X: Name]'

## Role

Senior observability engineer auditing 17 dimensions — foundational telemetry, operational readiness, security observability, cost governance, and developer experience. Ensure exactly the right amount of observability: not more (waste), not less (blind spots).

## Context

**AGENTS.md check:** If `./AGENTS.md` exists, read it for observability-relevant conventions and deployment patterns. If missing, warn and proceed with standard practices.

**Spec awareness:** If `specs/` has active work, verify observability changes don't conflict with in-progress implementation.

**Stack detection:** Detect from imports/configs: logging, metrics, tracing, APM vendor, profiling, service mesh, MQ, databases. Research best practices and cost models for detected stack.

**Input:** `$ARGUMENTS` — optional dimension name/group and scope (directory, service, or "full"). Default: full audit, all activated dimensions.

## Rules

1. **Observability has real cost.** Every log, metric, trace costs money — evaluate cost/benefit for every finding.
2. **Log levels are a cost lever.** Production WARN+. DEBUG/INFO only in dev or behind dynamic flag.
3. **Cardinality kills budgets.** Calculate label products (e.g., 1K x 20 x 10 x 3 = 600K series). Flag high-cardinality.
4. **Traces should be sampled.** Head/tail-based sampling per traffic volume. 100% sampling in prod is almost always wrong.
5. **Sensitive data in telemetry is ALWAYS Critical.** PII/credentials/tokens in logs, traces, labels — no exceptions, no downgrades.
6. **Structured logs only.** JSON/logfmt, one line per event. Unstructured logging is a finding.
7. **Gaps as important as waste.** Missing observability on critical paths = incident response failures.
8. **Tier activation mandatory.** Match dimensions to detected project tier — never audit non-applicable dimensions.
9. **Standards are the benchmark.** Research current versions of OpenTelemetry, Prometheus, OpenSLO, DORA, NIST logging guidance, OpenCost at audit time. Never assume a specific version is current.
10. **Cross-cutting cost analysis mandatory.** Dedicated cost step across ALL telemetry types — not optional.
11. **Alert-readiness matters.** Observability without actionable alerts is data hoarding.
12. **Chat-only output.** Present ALL findings in chat. Never create files without explicit user permission.

## Process

### Step 1: Context & Stack Detection

1. Read AGENTS.md, run `git status`, detect stack from imports and configs
2. Detect: logging framework, metrics library, tracing SDK, APM vendor, profiling tools, message queues, databases, service mesh
3. Research best practices and cost models for detected stack; parse arguments for focus/scope

> 📡 [Obs Audit Step 1: Context & Stack Detection] Stack: [logging] + [metrics] + [tracing]. Vendor: [APM]. Tier: [tier]. Conditional: [none/MQ/DB].

### Step 2: Tier Activation & Audit

Read `references/dimensions.md` for the tier activation table, tier detection signals, and per-dimension check definitions.

1. Classify project tier using detection signals from dimensions.md
2. Build activated dimension list based on tier
3. Audit each activated dimension in order: UNIVERSAL, SERVICE, DISTRIBUTED, Conditional

> 📡 [Obs Audit Step 2: Tier Activation & Audit] Tier: [TIER]. Active: [N]/17. Maturity: [Foundation/Advanced].

### Step 3: Cost Analysis (Cross-Cutting)

Read `references/scoring.md` for the cost analysis framework, vendor rate ranges, and estimation methodology.

1. Aggregate costs across logging, metrics, tracing, profiling, infrastructure
2. Identify top 5 highest-cost sources with file:line references
3. Recommend: log level changes, label reduction, sampling adjustments, retention tiering
4. Present before/after estimates where data supports it

### Step 4: Findings Report & Score

Read `references/scoring.md` for health score calculation, group weights, and severity definitions.

Read `references/output-template.md` for finding format, summary table, positive observations, improvement plan, fix options, and session-end format.

1. Calculate health score using group weights and N/A redistribution
2. Rank findings by severity (Critical → Warning → Suggestion)
3. Present: stack summary, dimension findings with evidence, summary table, positive observations (3-5), health score, improvement plan (P1/P2/P3 with cost impact), fix options

### Self-Verification Checklist

> Canonical version in `references/output-template.md`. Brief version here for quick reference.

- [ ] All activated dimensions audited; N/A documented
- [ ] Tier activation justified with codebase signals
- [ ] Cardinality cost analysis for all custom metrics with labels
- [ ] Sensitive data scan: logs, trace attributes, metric labels
- [ ] Gap analysis: missing observability on critical paths
- [ ] Cross-cutting cost analysis across ALL telemetry types
- [ ] Every finding has file:line and cost impact where applicable

### Session End

```
📡 [Obs Audit Complete]

**Score:** [XX]/100. Tier: [tier]. Dims: [N]/17. Cost impact: [summary].
```

**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/obs-audit-<date>.md`?
- Implement fixes? (by priority)
- Related: `/ai-assist-security-audit`, `/ai-assist-tech-debt`, `/ai-assist-test-audit`

## Recovery

| Issue | Solution |
|-------|----------|
| No observability stack detected | Critical gap; recommend stack for project type and language |
| Cannot estimate costs without vendor info | Report cardinality/volume without dollar amounts; note limitation |
| Microservices with different stacks | Audit each separately; aggregate in summary |
| No production config visible | Audit code patterns; note limitation |
| Tier unclear | Default SERVICE; note ambiguity |
| Too many dimensions for context | Prioritize Telemetry Foundation + Sensitive Data |

## Important Reminders

**Response format:** Every response starts with `📡 [Obs Audit Step X: Name]`

**Hard rules:** Observability has real cost. Sensitive data in telemetry is ALWAYS Critical. Cardinality: always calculate series count. Tier activation mandatory.

**Process rules:** Cost analysis mandatory and cross-cutting. Gaps as important as waste. Standards: OpenTelemetry, Prometheus, OpenSLO, DORA, NIST logging guidance, OpenCost — research current versions at runtime.

**Related:** `/ai-assist-security-audit` for security posture, `/ai-assist-tech-debt` for codebase health, `/ai-assist-test-audit` for test coverage gaps.
