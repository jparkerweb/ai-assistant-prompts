# Scoring Model

> Part of [ai-assist-observability-audit](../SKILL.md) — loaded during Step 4.

## Health Score Calculation (0-100)

### Group Weights

| Group | Dimensions | Weight |
|-------|-----------|--------|
| Telemetry Foundation | 1-Logging, 2-Metrics, 3-Tracing | 20 |
| Operational Readiness | 4-Health Checks, 5-Alerting, 8-Incident Mgmt | 20 |
| Service Intelligence | 6-Dashboards, 7-SLI/SLO, 10-Capacity | 15 |
| Security & Cost | 14-Security Obs, 15-Cost Obs | 5 |
| Advanced | 9-Profiling, 11-Distributed, 16-Chaos | 10 |
| Ecosystem | 12-Event-Driven, 13-Database, 17-DX | 10 |
| Sensitive Data (cross-cutting) | Evaluated across dims 1, 3, 14 | 20 |

**Total: 100**

### Sensitive Data — Cross-Cutting Assessment

Sensitive Data is a **separate cross-cutting assessment** that evaluates whether PII, credentials, tokens, or other sensitive data leak into telemetry (logs, trace attributes, metric labels). It does NOT double-count the Telemetry Foundation or Security & Cost groups:

- **Telemetry Foundation (20)** evaluates logging/metrics/tracing **functionality and completeness** — are logs structured? Are metrics instrumented? Are traces propagated?
- **Security & Cost (5)** evaluates security observability **capabilities and cost governance** — are audit trails in place? Is cost tracked?
- **Sensitive Data (20)** evaluates a **separate concern**: is sensitive data leaking into any telemetry signal? This is assessed by scanning across dims 1 (log content), 3 (trace/span attributes), and 14 (security event content) specifically for PII, credentials, and tokens.

The weights are balanced to accommodate this cross-cutting concern: Telemetry Foundation is 20 (not 25) and Security & Cost is 5 (not 10) compared to a naive allocation, because Sensitive Data carries its own dedicated 20-point weight reflecting its critical importance.

### N/A Redistribution

When a dimension is not applicable (project tier doesn't activate it), redistribute its weight proportionally within its group. For example, if Distributed System Obs (dim 11) is N/A for a single-service project, its share of the Advanced 10% is split between Profiling and Chaos Readiness.

### Score Interpretation

| Range | Rating | Action |
|-------|--------|--------|
| 80-100 | Strong observability posture | Maintain — address suggestions as backlog items |
| 60-79 | Moderate | Address warnings within current quarter |
| 40-59 | Significant blind spots | Prioritize critical findings — gaps causing incidents |
| 0-39 | Critical — flying blind | Immediate remediation required — service is unobservable |

### Scoring Per Dimension

Each activated dimension starts at its proportional share of the group weight. Deduct points per finding:
- **Critical finding:** -50% of dimension's score (minimum 0)
- **Warning:** -25% of dimension's score
- **Suggestion:** -10% of dimension's score

Multiple findings in the same dimension stack, but dimension score floors at 0.

**Sensitive Data override:** Any PII, credentials, or tokens found in telemetry is ALWAYS Critical severity regardless of other context. A single sensitive data finding in any telemetry signal deducts from the Sensitive Data cross-cutting score.

## Severity Definitions

### Critical

Active risk of data exposure, significant cost waste, or operational blindness.
- Sensitive data (PII, credentials, tokens) present in logs, traces, or metric labels
- Observability cost waste exceeding $10K/month (identifiable and quantifiable)
- Missing health checks on production services (undetected outages)
- No logging on critical business paths (zero visibility into failures)
- No alerting on production services (incidents discovered by users)

### Warning

Gaps on important paths or practices that will cause problems at scale.
- Observability gaps on critical paths (partial coverage, missing error handling instrumentation)
- High cardinality metrics (>10K series on a single metric, trending toward cost/performance impact)
- Missing SLOs on customer-facing services (no objective reliability target)
- No alerting on dependency health (upstream/downstream failures undetected)
- Unsampled tracing in production with >1K req/s (cost growing unbounded)
- Missing runbooks for >50% of alerts

### Suggestion

Optimization opportunities and advanced capabilities.
- Cost optimization (log level tuning, metric consolidation, retention tiering)
- Developer experience improvements (local stack, better search, SDK abstractions)
- Advanced capabilities not yet adopted (continuous profiling, chaos engineering, SLO-based alerting)
- Dashboard consolidation or cleanup
- Observability-as-code migration from manual configuration

## Cost Analysis Framework

### Vendor Rate Ranges (Illustrative)

These are approximate ranges for budgetary estimation. Actual rates vary by vendor, volume tier, and contract.

| Signal | Rate Range | Unit |
|--------|-----------|------|
| Logging | $0.50 - $3.00 | per GB ingested/month |
| Metrics | $0.03 - $0.10 | per active series/month |
| Traces | $0.20 - $1.50 | per GB ingested/month |
| Profiling | $0.00 - $0.50 | per host/month |

### Cost Estimation Methodology

1. **Estimate log volume:** Calculate daily log volume from log line count x average line size. Project monthly. Identify what percentage is actionable vs noise. Estimate cost: `(monthly GB) x (vendor rate)`.

2. **Calculate metric series count:** For each custom metric, compute label cardinality product. Sum all series across all metrics. Estimate cost: `(total series) x (vendor rate)`. Identify top 5 metrics by series count.

3. **Estimate trace volume:** Calculate: `(daily requests) x (avg spans per request) x (avg span size in KB) x (sampling rate)`. Project monthly GB. Estimate cost: `(monthly GB) x (vendor rate)`.

4. **Identify top 5 cost drivers:** Rank all telemetry sources by estimated monthly cost. For each: source description, file:line reference, estimated monthly cost, optimization opportunity.

5. **Present optimization with before/after:** For each cost optimization recommendation, show:
   - **Before:** Current estimated cost with current configuration
   - **After:** Projected cost after optimization
   - **Savings:** Monthly and annual projected savings
   - **Trade-off:** What visibility is reduced (if any) and acceptable risk

### Cost Red Flags

Flag immediately when detected:
- DEBUG/TRACE logging enabled in production (10-100x normal log volume)
- High-cardinality metric labels containing user identifiers
- 100% trace sampling on high-traffic services
- No retention tiering (all data at hot-tier pricing for full retention)
- Duplicate telemetry (same data sent to multiple backends without deduplication)
