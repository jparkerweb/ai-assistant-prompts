# Scoring Model

> Part of [ai-assist-tech-debt](../SKILL.md) — loaded during Step 4.

## Tier Weights

Health score is 0-100, distributed across 5 tiers:

| Tier | Dimensions | Weight |
|------|-----------|--------|
| Code (1-7) | Structure, Code Quality, Dead Code, Error Handling, Security, Best Practices, Comments | 33 |
| Architecture (8-11) | Architecture, API Design, Data Model, Type System | 23 |
| Infrastructure (12-15) | Dependency, Build/CI, Config, Deployment | 19 |
| Quality (16-19) | Testing, Documentation, Standards, Compatibility | 17 |
| Operational (20-22) | Performance, Observability, i18n/A11y | 8 |

## N/A Redistribution Formula

When a dimension is not activated for the project type, redistribute its weight proportionally across remaining active dimensions:

```
adjusted_weight = base_weight × (100 / sum_of_active_weights)
```

**Example:** A CLI project has 18 active dimensions. Dims 9, 10, 15, 21, 22 are N/A. Sum of active base weights = 82. Each active dimension's adjusted weight = `base_weight × (100 / 82)`.

The tier totals after redistribution still sum to 100.

## Per-Dimension Scoring (0-10 Scale)

Each activated dimension is scored 0-10:

| Score | Meaning |
|-------|---------|
| 10 | Exemplary — no findings, strong practices |
| 8-9 | Good — minor suggestions only |
| 6-7 | Acceptable — some warnings, manageable debt |
| 4-5 | Concerning — multiple warnings or 1 critical |
| 2-3 | Poor — critical findings, significant debt |
| 0-1 | Severe — fundamental issues across the dimension |

**Contribution to health score:**

```
dim_contribution = (dim_score / 10) × adjusted_weight
```

**Final score:**

```
health_score = sum of all dim_contributions (rounded to nearest integer)
```

## Score Interpretation

| Range | Rating | Action |
|-------|--------|--------|
| 80-100 | Healthy | Maintain — address suggestions as backlog items |
| 60-79 | Moderate debt | Plan remediation within current quarter |
| 40-59 | Significant debt | Prioritize critical findings, allocate dedicated sprint capacity |
| 0-39 | Critical debt | Pause feature work — immediate remediation required |

## Severity Definitions

### Critical

Security risk, data loss potential, or crash/outage risk.
- Exploitable vulnerabilities or data integrity risks
- Errors that cause application crashes or data corruption
- Issues that block deployment or development
- Examples: unhandled errors losing user data, hardcoded production secrets, circular deps causing runtime failures

### Warning

Bug-prone, performance-degrading, or maintainability-declining patterns.
- Patterns likely to cause bugs under specific conditions
- Performance issues that degrade under load
- Architecture issues that slow development velocity
- Examples: N+1 queries on high-traffic endpoints, god modules blocking team work, silent error swallowing

### Suggestion

Cleanup, consistency, or modernization opportunities.
- Not directly causing bugs or performance issues currently
- Improves codebase health, readability, or developer experience
- Aligns with modern best practices
- Examples: minor naming inconsistencies, missing EditorConfig, outdated but functional patterns
