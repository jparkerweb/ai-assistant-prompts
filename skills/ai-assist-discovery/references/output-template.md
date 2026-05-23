# Output Template & Quality Standards

> Part of [ai-assist-discovery](../SKILL.md) — loaded during Step 5.

## Confidence Grading System

Tag key claims with one of these confidence levels:

| Level | Meaning | When to Use |
|-------|---------|-------------|
| **Verified** | Direct observation | Agent read the code, ran the test, checked the version, inspected the file |
| **Corroborated** | Multiple sources agree | 2+ independent sources confirm the same claim |
| **Reported** | Single source | One source claims this, not independently verified |
| **Inferred** | Logical deduction | Reasonable conclusion from available evidence, stated reasoning |
| **Speculative** | Insufficient evidence | Always labeled, always qualified with "may", "could", "possible" |

At `deep` depth, include a confidence distribution summary: "X% verified, Y% corroborated, Z% reported, W% inferred"

## Citation Format

### URLs
Full URL with access date for web sources.
```
React Server Components RFC (https://github.com/reactjs/rfcs/..., accessed 2026-04-06)
```

### File Paths
Relative path from repo root with line number.
```
src/auth/middleware.ts:42
```

### Documentation
Name, version, section.
```
React docs v18.3, Suspense section
```

### Standards
Standard name, specific requirement, note which version was current at research time.
```
OWASP ASVS, requirement 2.1.1 (current version at time of research)
```

## Session End Format

```
🔭 [Discovery Complete]

**What was done:** [type] research on [topic] at [depth] depth.
[X] findings across [Y] sub-topics. [Z] sources consulted.
Confidence: [A]% verified/corroborated, [B]% reported, [C]% inferred.

**Next steps (ask user — do not auto-execute):**
- Save research to `docs/research/<topic>.md` or `specs/research/<topic>.md`?
- Deep-dive into a sub-topic?
- Related: `/ai-assist-project-summary`, `/ai-assist-security-audit`, `/ai-assist-tech-debt`
```

## Self-Verification Checklist

Before presenting findings, verify:
- [ ] Every claim has a cited source
- [ ] Key claims tagged with confidence level
- [ ] Target type correctly identified, methodology matched
- [ ] Depth matches request (scan=concise, standard=frameworks, deep=comprehensive)
- [ ] Template structure followed for target type (see target-templates.md)
- [ ] No fabrication — gaps explicitly marked as "not investigated" or "insufficient data"
- [ ] Source diversity: 5+ at standard, 10+ at deep
- [ ] Source recency: tech sources <2 years old (flag stale sources)
- [ ] Framework outputs present as structured tables/matrices (not prose)
