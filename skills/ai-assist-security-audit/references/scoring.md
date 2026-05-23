# Scoring Model

> Part of [ai-assist-security-audit](../SKILL.md) — loaded during Step 3.

## Health Score Calculation (0-100)

### Group Weights

| Group | Dimensions | Weight |
|-------|-----------|--------|
| Code Security | 1-AppSec, 10-BizLogic, 13-DoS | 25 |
| Auth & Access | 7-Auth, 11-API | 20 |
| Data Protection | 4-DB, 8-Crypto, 9-Privacy | 15 |
| Supply Chain | 5-CI/CD, 6-Deps, 16-ThirdParty | 15 |
| Secrets & Config | 15-Secrets, 2-Infra, 3-Network | 15 |
| Observability | 14-Logging, 12-ClientSide | 10 |

### N/A Redistribution

When a dimension is not applicable (project type doesn't activate it), redistribute its weight proportionally within its group. For example, if Database Security (dim 4) is N/A for a CLI project, its share of the Data Protection 15% is split between Crypto and Privacy.

### Score Interpretation

| Range | Rating | Action |
|-------|--------|--------|
| 80-100 | Strong security posture | Maintain — address suggestions as backlog items |
| 60-79 | Moderate | Address warnings within current quarter |
| 40-59 | Significant gaps | Prioritize critical findings immediately |
| 0-39 | Critical | Immediate remediation required — pause feature work |

### Scoring Per Dimension

Each activated dimension starts at its proportional share of the group weight. Deduct points per finding:
- **Critical finding:** -50% of dimension's score (minimum 0)
- **Warning:** -25% of dimension's score
- **Suggestion:** -10% of dimension's score

Multiple findings in the same dimension stack, but dimension score floors at 0.

## Severity Definitions

### Critical

Exploitable now with data breach or system compromise risk.
- Known exploit or proof-of-concept exists
- Attack vector is reachable without authentication or with common credentials
- Blast radius includes sensitive data, user accounts, or system control
- Examples: SQL injection in login, hardcoded production API key, unauthenticated admin endpoint

### Warning

Exploitable under specific conditions.
- Requires insider access, specific configuration, or chain of vulnerabilities
- Defense-in-depth gap that increases blast radius if another control fails
- Examples: IDOR requiring authenticated access, missing rate limiting on internal API, weak session timeout

### Suggestion

Hardening opportunity that improves overall posture.
- Not directly exploitable in current configuration
- Best practice alignment, defense-in-depth improvement
- Examples: Missing security headers on static pages, informational CSP improvements, dependency update available

## Confidence Levels

Tag each finding with a confidence level:

| Level | Meaning | Example |
|-------|---------|---------|
| **H** (High) | Direct evidence — code read, tool output, CVE confirmed | `npm audit` reports CVE-2024-XXXX in express 4.17.1 |
| **M** (Medium) | Strong indicators but not directly verified — pattern match, version range | Regex pattern suggests potential ReDoS but not tested with payload |
