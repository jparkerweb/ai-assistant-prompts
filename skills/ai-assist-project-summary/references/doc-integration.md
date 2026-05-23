# Part 3: Documentation Integration

> Part of [ai-assist-project-summary](../SKILL.md) — loaded during Step 3.

## Documentation Tier Model

Classify all findings by the correct documentation tier before suggesting enhancements:

| Tier | Target Files | What Goes Here | What Does NOT Go Here |
|------|-------------|----------------|----------------------|
| Permanent | README.md, human-facing docs in `docs/` | Stable info: project overview, setup, architecture, env vars, structure, getting started, compliance | In-progress work, temporary state, unmerged features, active branch details |
| Agent-facing | AGENTS.md, `.agents-docs/` | Conventions, patterns, architecture detail, build/test commands, may reference upcoming features or planned changes | Ephemeral task details, personal notes |
| Transient | `specs/` (not committed) | Active plans, in-progress implementation, temporary state, task tracking | N/A — this is the correct home for transient info |

## Enhancement Rules

These rules are mandatory. Violations risk data loss or documentation corruption.

1. **Read before write** — always read the full target file before proposing any change
2. **Enhance, never replace** — add missing info, fix stale content, improve organization. Never rewrite from scratch unless the file doesn't exist
3. **Preserve important content** — compliance docs, security notes, team contacts, setup instructions are never removed even if they seem redundant
4. **Doc tier discipline** — in-progress work goes to specs only. Upcoming features can go in AGENTS files but NOT README. Only stable, verified facts go in README
5. **Surgical changes** — each change is a targeted edit. The engineer reviewing the diff sees exactly what changed and why
6. **No "Replace" option** — the only options are "Enhance existing docs" or "Skip"
7. **README = quick start** — everything an engineer needs to get going fast: overview, setup, structure, commands. References deeper docs for detail
8. **Verify accuracy** — every enhancement must be verified against actual code. Do not propagate stale information from the summary into docs

## Enhancement Workflow

1. After presenting Parts 1 and 2, classify all findings by doc tier
2. Present enhancement suggestions grouped by target document:

```
Documentation Enhancement Suggestions

**README.md:**
- [Enhancement 1 — what to add/improve and why]
- [Enhancement 2]

**AGENTS.md / .agents-docs/:**
- [Enhancement 1]

**No changes needed:** [files that are already complete/accurate]
```

3. Ask: "Enhance documentation with these findings? (All / Select targets / Skip)"
4. If user approves: read each target file, surgically integrate enhancements. Present changes for review before writing.

## Per-Target Guidance

### README.md Enhancements

**Do add:**
- Missing setup steps discovered during Part 1 scanning
- Stale tech stack info (corrected version numbers, deprecated tools)
- Missing environment variable documentation
- Missing directories in project structure section
- Missing "Getting Started" prerequisites
- Broken internal link fixes

**Do NOT add:**
- Active branch info or in-progress work
- TODO items or spec references
- Unmerged features
- Agent-specific conventions (those go in AGENTS.md)

### AGENTS.md / .agents-docs/ Enhancements

**Do add:**
- Newly discovered build/test/lint commands
- Architecture descriptions that have drifted from code
- Missing file path conventions or patterns
- Upcoming features or planned architectural changes (acceptable here)
- Updated tech stack versions

**Do NOT add:**
- Personal notes or ephemeral task details
- Information already covered in README.md (avoid duplication)
