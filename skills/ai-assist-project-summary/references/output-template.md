# Output Template

> Part of [ai-assist-project-summary](../SKILL.md) — loaded during Step 3.

## Part 1: Project Overview

```markdown
## [Project Name] — What It Is

[One paragraph: what this project is in plain English. No jargon without inline definition.]

---

### What It Does
[Key features/capabilities — bulleted list]

### Tech Stack
[Table: Layer | Technology]

### Key Concepts
[Table: Term | Meaning — define domain-specific terms]

### Project Structure
[High-level directory tree with 1-line descriptions]

### Getting Started
[Numbered steps: prerequisites, clone, configure, build, run, test]

### Deployment Environments
[Table: Environment | Servers | Config Source — if applicable]

### Compliance & Security
[If regulatory context detected: data handling, access controls, audit trail]
```

## Part 2: Engineer Status Update

```markdown
---

## Engineer Status Update

### Recently Completed
[Bullet list with descriptions and dates]

### In Progress
[Bullet list with branch names, owners, descriptions]

### Issues & Gaps
[Severity-ranked table: | Severity | Location | Issue | Suggested Action |]

### Upcoming & Roadmap
[Prioritized bullet list with source references]

### Suggested Improvements
[Numbered list — clearly labeled as agent-suggested recommendations]
```

## Part 3: Documentation Enhancement Suggestions

```markdown
---

Documentation Enhancement Suggestions

**README.md:**
- [Enhancement — what to add/improve and why]

**AGENTS.md / .agents-docs/:**
- [Enhancement]

**No changes needed:** [files that are already complete/accurate]

Enhance documentation with these findings? (All / Select targets / Skip)
```

## Session End

```markdown
[Summary Complete]

**What was done:** Project summary generated for [project name].
- Part 1: Project overview ([X] sections)
- Part 2: Engineer status ([X] completed, [Y] in-progress, [Z] issues, [W] upcoming)
- Part 3: [Documentation enhanced / Documentation unchanged]
```

**Next steps (ask user — do not auto-execute):**
- Save summary to `specs/project-summary-<date>.md`?
- Related: `/ai-assist-discovery` for deep research, `/ai-assist-tech-debt` for codebase health

## Self-Verification Checklist

Before presenting, verify:
- [ ] Every claim verified from actual files — no fabrication
- [ ] A product manager could understand Part 1 without follow-up questions
- [ ] A returning engineer could prioritize work from Part 2 without asking teammates
- [ ] All technical terms defined inline
- [ ] Current Status reflects actual git state and active specs
- [ ] Compliance & Security section included if regulatory context detected
- [ ] Documentation enhancements classified by correct doc tier
- [ ] No transient info suggested for permanent docs
