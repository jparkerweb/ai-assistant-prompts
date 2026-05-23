# Output Template

> Part of [ai-assist-observability-audit](../SKILL.md) — loaded during Step 4.

## Finding Format

Each finding follows this format:

```
**[Severity] [Title]** — file:line (Conf: H/M) [Dimension]
[Issue description + cost impact where applicable]
**Fix:** [Specific remediation]
```

Example:
```
**[Critical] PII in Log Statements** — src/services/UserService.cs:87 (Conf: H) [1-Logging]
User email and phone number logged at INFO level in authentication flow. Estimated 50K log entries/day containing PII. Violates GDPR/SOC2 requirements and exposes sensitive data in log aggregation platform.
**Fix:** Replace `_logger.LogInformation("User login: {Email}, {Phone}", user.Email, user.Phone)` with `_logger.LogInformation("User login: {UserId}", user.Id)`. Add PII redaction middleware to logging pipeline.
```

## Summary Table

Present all findings in a summary table after the detailed findings:

```
| # | Severity | Dim | Location | Issue (7-15 words) | Cost Impact | Recommendation (7-15 words) |
|---|----------|-----|----------|---------------------|-------------|------------------------------|
| 1 | Critical | 1-Logging | src/services/UserService.cs:87 | PII logged in auth flow, 50K entries/day | Compliance risk | Redact PII, log user ID only |
| 2 | Warning | 2-Metrics | src/metrics/CustomMetrics.cs:23 | user_id label creates 600M series | ~$18K/mo | Remove user_id from metric labels |
| 3 | Suggestion | 17-DX | — | No local observability dev stack | Eng productivity | Add docker-compose with Jaeger + Grafana |
```

## Positive Observations

Include 3-5 things the project does well. This provides balanced assessment and acknowledges good observability practices:

```
**What's done well:**
- Structured JSON logging with correlation IDs across all services
- OpenTelemetry SDK properly configured with batch span processor
- Health check endpoints test real dependencies (database, cache, downstream APIs)
- SLOs defined and tracked for all customer-facing endpoints
- Dashboards managed as code in Terraform with CI/CD deployment
```

## Improvement Plan

Organize findings into priority tiers with cost impact:

```
**Improvement Plan:**

**P1 — Critical (fix now):** Active risk or significant waste.
- #1: PII in log statements — compliance risk, immediate remediation
- #4: No health checks on payment service — undetected outages

**P2 — Warnings (next sprint):** Gaps that will cause problems at scale.
- #2: High-cardinality metrics — ~$18K/mo waste, growing
- #5: Missing SLOs on API gateway — no reliability target

**P3 — Suggestions (backlog):** Optimization and maturity improvements.
- #3: Local dev observability stack — engineer productivity
- #6: Dashboard consolidation — reduce cognitive load
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
📡 [Obs Audit Complete]
**Score:** [XX]/100. Tier: [tier]. Dims: [N]/17. Cost impact: [summary].
**Next steps (ask user — do not auto-execute):**
- Save report to `specs/audit-reports/obs-audit-<date>.md`?
- Implement fixes? (by priority)
- Related: `/ai-assist-security-audit`, `/ai-assist-tech-debt`, `/ai-assist-test-audit`
```

## Self-Verification Checklist

Before presenting the final report, verify:

- [ ] All activated dimensions audited; N/A dimensions documented with rationale
- [ ] Tier activation justified with specific codebase signals (imports, configs, manifests)
- [ ] Cardinality analysis performed for all custom metrics with labels — series count calculated
- [ ] Sensitive data scan completed: logs, trace attributes, metric labels checked for PII/credentials
- [ ] Gap analysis performed: missing observability on critical paths identified
- [ ] Cross-cutting cost analysis across ALL telemetry types — top 5 cost drivers identified
- [ ] Every finding has file:line reference and cost impact where applicable
