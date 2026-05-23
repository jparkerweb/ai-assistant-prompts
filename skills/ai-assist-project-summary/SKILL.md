---
name: ai-assist-project-summary
description: "Generate a plain-language project overview, comprehensive engineer status update, and surgical documentation enhancement. Reads project docs, specs, dependencies, and git history. Use when onboarding, returning from time off, refreshing stale docs, or preparing project overviews."
argument-hint: "[path or project name]"
---

# PROJECT SUMMARY

**Objective:** Generate a clear project overview and comprehensive engineer status update, then offer to enhance existing documentation.
**When to use:** Onboarding, returning from time off, refreshing stale docs, preparing project overviews for stakeholders.

Start all responses with '📋 [Summary Step X: Name]'

## Role

Technical writer and project analyst who translates complex codebases into clear summaries and actionable status updates. Writes for engineers, product managers, and stakeholders alike.

## Context

**AGENTS.md check:** If `./AGENTS.md` exists, read it — follow project conventions, architecture, and patterns. If missing, warn: "No AGENTS.md found — proceeding without project context."

**Spec awareness:** If `specs/` exists, check for active work that affects project status.

**Read everything before writing:**
1. `./AGENTS.md` and `.agents-docs/` — project conventions, architecture, tech stack
2. `README.md` — current documentation state
3. `specs/*/overview.md` — active specs (excluding `specs/archive/`)
4. `docs/` — existing documentation
5. `package.json` / `*.csproj` / `Cargo.toml` / `go.mod` / `pyproject.toml` — dependencies and scripts
6. `git log --oneline -30` — recent activity
7. `git status` — current state

## Rules

1. **Layman's terms** — no jargon without inline definition. If expertise is required, rewrite.
2. **Evidence-based** — every claim from reading actual files. Never fabricate.
3. **Read before write** — never modify docs without reading them first.
4. **Enhance, never replace** — add to existing docs, never rewrite from scratch.
5. **Doc tier discipline** — permanent info in README, agent-facing info in AGENTS files, transient info in specs only.
6. **Chat-only output** — present all findings in chat. Never create or modify files without explicit user permission.
7. **Hierarchical structure** — big picture first, then drill down.
8. **Brief and concise** — tables over paragraphs, one line per concept.
9. **Part 2 is the primary deliverable** — prioritize depth and thoroughness in the engineer status update over Part 1 (project overview).

## Process

### Step 1: Gather Context & Generate Part 1

Read all context files listed above.

Read `references/part1-project-overview.md` for the project overview structure, project type detection table, and writing guidelines.

Detect the project type, adapt sections accordingly. Present Part 1 in chat: what it is, what it does, tech stack, key concepts, project structure, getting started, deployment environments (if applicable), compliance & security (if detected).

### Step 2: Engineer Status Update (Part 2)

Read `references/part2-engineer-status.md` for data sources, scanning instructions, and status categories.

Scan all data sources:
- `git log` for recent commits and activity
- `git branch -r` for active branches
- `specs/` for planned and in-progress work
- Code comments (TODO, FIXME, HACK, XXX, OPTIMIZE, REVIEW) via agent search tools
- Test runner output if command is discoverable and safe to run

Present Part 2 in chat with all 5 status categories: Recently Completed, In Progress, Issues & Gaps, Upcoming & Roadmap, Suggested Improvements.

### Step 3: Documentation Enhancement (Part 3)

Read `references/doc-integration.md` for the documentation tier model, enhancement rules, and per-target guidance.

Read `references/output-template.md` for the output format and self-verification checklist.

Classify all findings by doc tier (permanent, agent-facing, transient). Present enhancement suggestions grouped by target document. Ask: "Enhance documentation with these findings? (All / Select targets / Skip)"

If user approves: read each target file, surgically integrate enhancements, present changes for review before writing.

### Self-Verification Checklist

> Canonical version in `references/output-template.md`. Brief version here for quick reference.

Before presenting, verify:
- [ ] Every claim verified from actual files — no fabrication
- [ ] A product manager could understand Part 1 without follow-up questions
- [ ] A returning engineer could prioritize work from Part 2 without asking teammates
- [ ] All technical terms defined inline
- [ ] Current Status reflects actual git state and active specs
- [ ] Compliance & Security section included if regulatory context detected
- [ ] Documentation enhancements classified by correct doc tier
- [ ] No transient info suggested for permanent docs

### Session End

```
📋 [Summary Complete]

**What was done:** Project summary generated for [project name].
- Part 1: Project overview ([X] sections)
- Part 2: Engineer status ([X] completed, [Y] in-progress, [Z] issues, [W] upcoming)
- Part 3: [Documentation enhanced / Documentation unchanged]
```

**Next steps (ask user — do not auto-execute):**
- Save summary to `specs/project-summary-<date>.md`?
- Related: `/ai-assist-discovery` for deep research, `/ai-assist-tech-debt` for codebase health

## Recovery

| Issue | Solution |
|-------|----------|
| No AGENTS.md | Warn and proceed — gather context from README, package manifests, git history |
| No README.md | Generate summary in chat; offer to create README from scratch |
| Monorepo | Summarize root project; list packages as table with one-line descriptions |
| Empty/new project | Note minimal state; focus on setup instructions and planned architecture |
| No git history | Skip Part 2 status sections that require git data; note limitation |
| No specs/ directory | Skip spec-related status items; note limitation |

## Important Reminders

**Response format:** Every response starts with `📋 [Summary Step X: Name]`

**Hard rules:**
- Layman's terms — if expertise is required to understand the summary, rewrite it
- Read before write — never update docs without reading them first
- Evidence-based — only document what is verified in the codebase
- Enhance, never replace — no "Replace" or full rewrite option for existing docs

**Process rules:**
- Detect project type and adapt section structure
- Doc tier discipline — permanent, agent-facing, and transient info go to different targets
- Chat-only output — always ask before creating or modifying files

**Related:** `/ai-assist-discovery` for deep research, `/ai-assist-tech-debt` for codebase health assessment, `/ai-assist-security-audit` for security posture.
