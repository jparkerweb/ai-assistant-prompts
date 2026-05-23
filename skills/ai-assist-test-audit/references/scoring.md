# Scoring Model

> Part of [ai-assist-test-audit](../SKILL.md) — loaded during Step 5.

## Per-Dimension Weights (Sum = 100)

| # | Dimension | Weight | # | Dimension | Weight |
|---|-----------|--------|---|-----------|--------|
| 1 | Coverage | 9 | 9 | Documentation | 3 |
| 2 | Types | 7 | 10 | Mutation | 5 |
| 3 | Quality | 14 | 11 | Contract | 5 |
| 4 | Mocks | 6 | 12 | Accessibility | 5 |
| 5 | Data | 5 | 13 | Error Paths | 7 |
| 6 | Architecture | 5 | 14 | Edge Cases | 5 |
| 7 | CI/CD | 9 | 15 | Maintenance | 6 |
| 8 | Performance | 5 | 16 | Modern | 4 |
| | | | | **Total** | **100** |

### N/A Redistribution

When a dimension is not applicable (project type doesn't activate it), redistribute its weight proportionally among remaining active dimensions. For example, if Contract (dim 11, weight 5) is N/A for a WEB project, its 5 points are distributed proportionally across the other active dimensions based on their relative weights.

**Quick mode scaling:** Quick activates 3 dimensions (Coverage=9, Quality=14, Edge Cases=5, raw total=28). Scale to 100: Coverage=32.1, Quality=50.0, Edge Cases=17.9.

## Deterministic Metrics

These metrics MUST come from actual test execution output — never estimated or assumed.

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Tests passing | X/Y | 100% | Pass/Fail |
| Line coverage | X% | 80% | Pass (>=80) / Warning (60-79) / Fail (<60) |
| Branch coverage | X% | 70% | Pass (>=70) / Warning (50-69) / Fail (<50) |
| Suite duration | Xs | <30s unit, <5min integration | Pass/Warning |
| Flaky count | X | 0 | Pass (0) / Fail (>0) |
| Skipped count | X (Y%) | <5% | Pass (<5%) / Warning (5-10%) / Fail (>10%) |

## Score Interpretation

| Range | Rating | Action |
|-------|--------|--------|
| 80-100 | Strong test suite | Maintain — address suggestions as backlog items |
| 60-79 | Moderate | Address warnings within current quarter |
| 40-59 | Significant gaps | Prioritize critical findings — test quality at risk of false confidence |
| 0-39 | Critical | Immediate remediation required — suite provides false confidence, may be worse than no tests |

### Scoring Per Dimension

Each activated dimension starts at its proportional share of 100 (after N/A redistribution). Deduct points per finding:
- **Critical finding:** -50% of dimension's score (minimum 0)
- **Warning:** -25% of dimension's score
- **Suggestion:** -10% of dimension's score

Multiple findings in the same dimension stack, but dimension score floors at 0.

## Severity Definitions

### Critical

Tests that actively harm — false confidence, non-determinism, or bypassed gates.
- Flaky tests — non-deterministic failures erode trust and mask real failures
- Zero-assertion tests — pass without verifying anything, inflating coverage
- Ignored CI failures — test suite runs but doesn't block merging
- False green — tests pass but don't test what they claim (mock drift, stale snapshots)

### Warning

Gaps that reduce test suite effectiveness without actively misleading.
- Coverage gaps on critical paths — authentication, payment, data validation untested
- Over-mocking — >50% mock setup means testing mocks, not code
- Missing error path coverage — happy path only, no failure scenarios
- No CI gating — tests exist but don't block PRs
- >5% skipped tests — accumulated debt reducing effective coverage

### Suggestion

Improvements for long-term health and developer experience.
- Naming conventions — unclear test names reduce debugging speed
- Organization — inconsistent structure increases onboarding time
- Modernization — outdated patterns that have better alternatives
- Advanced testing — mutation testing, property-based testing, contract testing adoption
