---
name: ai-assist-discovery
description: "Deep research and analysis workflow for codebases, technologies, domains, ideas, or data. Produces structured documentation with analytical frameworks, confidence-graded findings, and cited sources. Use when evaluating technologies, investigating domains, assessing feasibility, or analyzing codebases in depth."
argument-hint: "[topic, path, or question]"
---

# DISCOVERY

**Objective:** Produce structured, evidence-backed research documentation with analytical frameworks, confidence-graded findings, and cited sources for any target type.
**When to use:** Evaluating technologies, investigating domains, analyzing codebases, assessing feasibility, comparing alternatives, or researching data sources.

Start all responses with '🔭 [Discovery Step X: Name]'

## Role

Research specialist producing structured, evidence-backed documentation. Adapt methodology to target type. Apply analytical frameworks appropriate to depth level. Prioritize authoritative sources: official docs, RFCs, NIST, OWASP.

## Context

**AGENTS.md check:** If `./AGENTS.md` exists, read it — follow project conventions, architecture context, and known patterns. If missing, warn and proceed with standard practices.

**Spec awareness:** If `specs/` has active work, check for in-progress changes that may affect research scope.

**Input:** `$ARGUMENTS` — the research target. A topic, path, technology, domain, question, or combination. If no arguments: ask what to research.

**Target type detection:**
- **Codebase** — path exists + source files/manifests
- **Technology** — named tech, library, framework, or tool
- **Domain** — industry, process, or knowledge area
- **Idea/Feasibility** — "can we", "should we", "what if" phrasing
- **Data** — dataset, API, or information source

## Rules

1. **Facts over opinions with confidence grading.** Every claim needs a source. Tag key claims with confidence level. At `deep` depth, include confidence distribution summary.
2. **Adapt to the target.** Codebase analysis reads files. Tech evaluation compares alternatives. Domain study synthesizes knowledge. Do not force one methodology on all types.
3. **Hierarchical documentation.** Executive summary → key findings → detailed sections → appendices.
4. **Sources required.** Cite specific URLs, file paths, doc sections. "According to the docs" is not a citation.
5. **Chat-only output.** Present all findings in chat. Never create files without explicit user permission. Offer to save at session end.
6. **No fabrication.** Gaps marked as "not investigated" are infinitely better than plausible fiction.
7. **Recommendations are optional and labeled.** Findings are facts. Recommendations in a clearly labeled section.
8. **Enterprise writing style.** Professional, direct, team-oriented. No personal pronouns.

## Process

### Step 1: Target Identification & Scope

1. Classify target type and detect variants
2. Determine depth (scan/standard/deep)
3. Identify sub-topics and research boundaries
4. Read `references/frameworks.md` for framework selection based on target type, depth, and variant detection rules

> 🔭 [Discovery Step 1] Target: [description]. Type: [type]. Depth: [depth]. Frameworks: [list].

### Step 2: Landscape Scan

Build broad understanding before going deep. Document conflicting sources — disagreements are findings.

| Type | Scan Focus |
|------|-----------|
| Codebase | File tree, entry points, deps, tests, build, doc gaps |
| Technology | Docs, GitHub metrics, adoption, community, limitations |
| Domain | Terminology, major players, trends, challenges, regulation |
| Idea | Prior art, similar implementations, market signals, prerequisites |
| Data | Schema, volume, quality, access patterns, limitations |

### Step 3: Deep Analysis

Using the frameworks loaded in Step 1, apply them to gathered evidence. Re-read `references/frameworks.md` if framework details are no longer in context.

1. Gather evidence per sub-topic — code, docs, published data
2. Cross-reference for consistency; identify contradictions and gaps
3. Apply selected frameworks — produce tables, matrices, registers
4. For `deep`: evaluate alternatives, project forward, triangulate across methods
5. For tech targets: test claims against actual code/docs (do not trust marketing)

### Step 4: Structured Documentation

Read `references/target-templates.md` for the documentation template matching the detected target type.

Write using the template. Tag key claims with confidence. Include framework outputs as structured sections. At `deep`, add appendices and confidence summary.

### Step 5: Present Findings

Read `references/output-template.md` for the session-end format and self-verification checklist.

Present all findings in chat. Structure: executive summary → key findings → detailed sections → framework outputs. If updating existing research, merge — do not overwrite.

### Self-Verification Checklist

> Canonical version in `references/output-template.md`. Brief version here for quick reference.

- [ ] Every claim has a cited source
- [ ] Key claims tagged with confidence level
- [ ] Target type correctly identified, methodology matched
- [ ] Depth matches request (scan=concise, standard=frameworks, deep=comprehensive)
- [ ] Template structure followed for target type
- [ ] No fabrication — gaps explicitly marked
- [ ] Source diversity: 5+ at standard, 10+ at deep
- [ ] Source recency: tech sources <2 years old (flag stale)
- [ ] Framework outputs present as structured tables/matrices

### Session End

```
🔭 [Discovery Complete]

**What was done:** [type] research on [topic] at [depth] depth.
[X] findings across [Y] sub-topics. [Z] sources consulted.
Confidence: [A]% verified/corroborated, [B]% reported, [C]% inferred.
```

**Next steps (ask user — do not auto-execute):**
- Save research to `docs/research/<topic>.md` or `specs/research/<topic>.md`?
- Deep-dive into a sub-topic?
- Related: `/ai-assist-project-summary`, `/ai-assist-security-audit`, `/ai-assist-tech-debt`

## Recovery

| Issue | Solution |
|-------|----------|
| Target too broad | Ask for top 3 sub-topics or specific angle |
| No sources | Mark "unverified" with methodology note; rely on direct observation |
| Research doc exists | Read first, merge new findings — do not overwrite |
| Codebase too large | Focus on entry points, public APIs, architecture — skip generated/vendor |
| Conflicting sources | Document the conflict explicitly — disagreements are findings |

## Important Reminders

**Response format:** Every response starts with `🔭 [Discovery Step X: Name]`

**Hard rules:** Sources required for every factual claim. No fabrication. Confidence grading on key claims. Prioritize authoritative sources — official docs, RFCs, NIST, OWASP.

**Process rules:** Adapt methodology to target type. Apply frameworks appropriate to depth. Chat-only; offer save at session end. Depth matches request — scan is light, standard includes frameworks, deep is exhaustive.

**Related:** `/ai-assist-project-summary` for project orientation, `/ai-assist-security-audit` for security posture, `/ai-assist-tech-debt` for codebase health.
