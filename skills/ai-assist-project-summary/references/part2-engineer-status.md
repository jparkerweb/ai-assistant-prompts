# Part 2: Engineer Status Update

> Part of [ai-assist-project-summary](../SKILL.md) — loaded during Step 2.

This is the primary deliverable of the project summary. Prioritize depth and thoroughness here.

## Data Sources to Scan

Gather data from all available sources before categorizing:

```
git log --oneline -30
git log --since="2 weeks ago" --name-only --format="%h %s (%an, %ar)"
git branch -r --sort=-committerdate
git status
specs/*/ (read overview.md or PLAN-DRAFT-*.md in each)
docs/ (if exists)
```

**Code comment scanning:** Use the agent's native search tool (e.g., Grep) to find TODO, FIXME, HACK, XXX, OPTIMIZE, REVIEW across source files. Exclude: `node_modules`, `vendor`, `dist`, `build`, `.git`, generated files.

**Test runner output:** If a test command is discoverable from `package.json` scripts, `Makefile`, or `AGENTS.md`, run it and capture results. Only run if the command is safe (no destructive side effects, no long-running processes).

> **Portability note:** Prefer the agent's built-in search tools over shell `grep` for cross-platform and cross-agent compatibility.

## Status Categories

### Recently Completed

**Source:** Commits merged to main/develop in last 2 weeks, specs with status "Complete", closed/merged PRs.

**Format:** Bullet list with a brief description and date.

**Include:** What shipped, business impact if discernible from commit messages or specs.

**Example:**
```
- Added ai-assist-git-commit skill for standardized commits (2026-03-27)
- Repository setup with skills.sh compatibility (2026-03-27)
```

**Edge case — no recent completions:** State "No commits merged to main in the last 2 weeks." and move on.

### In Progress

**Source:** Active remote branches (exclude stale >30 days), specs with status "In Progress" or "Draft", uncommitted changes (`git status`), open PRs.

**Format:** Bullet list with branch name, owner (from git log), brief description.

**Flag:** Branches that appear stale or stuck (no commits in >2 weeks but not merged).

**Example:**
```
- feature/add-audit-workflows (owner from git log) — 6 new audit/research skills
  - Last commit: 3 days ago
  - Spec status: Phase 2 in progress
```

**Edge case — no active branches:** State "No active feature branches detected." and move on.

### Issues & Gaps

**Source:** Failing tests (if runnable), TODO/FIXME/HACK comments with file:line, documentation gaps (files referenced in README/AGENTS that don't exist), stale configs, missing test coverage for key modules.

**Format:** Severity-ranked table:

| Severity | Location | Issue | Suggested Action |
|----------|----------|-------|-----------------|
| Critical | tests/auth.test.ts:42 | Test failure: "timeout on token refresh" | Investigate — may indicate broken auth flow |
| Warning | src/api/handler.ts:15 | TODO: add rate limiting | Schedule for next sprint |
| Info | src/utils/legacy.ts:88 | HACK: workaround for SDK bug #123 | Check if SDK bug is fixed |

**Severity definitions:**
- **Critical:** Broken tests, security-related TODOs, missing dependencies, build failures
- **Warning:** Stale code, missing docs, significant TODOs, coverage gaps in critical paths
- **Info:** Enhancement TODOs, minor cleanup, nice-to-have improvements

**Edge case — no issues found:** State "No critical issues or gaps detected." and still include a brief summary of what was checked.

### Upcoming & Roadmap

**Source:** Specs with status "Not Started" or "Planned", documented ideas in `docs/`, roadmap files, deferred bugs mentioned in specs or comments, enhancement comments in code.

**Format:** Prioritized bullet list with source reference.

**Example:**
```
- Security audit redesign (specs/audit-skill-improvements — Phase 4, Not Started)
- Observability audit improvements (specs/audit-skill-improvements — Phase 5, Not Started)
```

**Edge case — no roadmap info:** State "No upcoming work documented in specs or docs." and move on.

### Suggested Improvements

**Source:** Agent analysis during the summary process — patterns noticed, best practice gaps, optimization opportunities, missing tooling, architectural improvements.

**Format:** Numbered list with rationale.

**Rule:** Clearly label as "agent-suggested" — these are recommendations, not issues found in docs.

**Examples:**
1. **Add pre-commit hooks** — no `.husky/` or `.pre-commit-config.yaml` detected. Would catch lint/format issues before commit.
2. **Pin dependency versions** — `package.json` uses `^` ranges for 12 dependencies. Pin exact versions for reproducible builds.
3. **Add CI pipeline** — no `.github/workflows/` or `azure-pipelines.yml` detected. Automated testing would catch regressions early.

**Edge case — no suggestions:** Unlikely, but if the project follows all best practices, state "No significant improvements identified — project follows current best practices."
