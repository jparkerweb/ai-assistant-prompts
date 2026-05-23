# ai-assist-git-pr Reference Architecture

> For skill authors and AI agents working on or extending the ai-assist-git-pr skill.

## Reference File Inventory

| File | Purpose | Loaded When |
|------|---------|-------------|
| `github-pr-create.md` | Create and Status mode workflows — pre-flight, push check, PR creation, merge readiness reporting | Create or Status mode |
| `github-pr-describe.md` | Context gathering, Change Analysis Framework, Describe Mode workflow — shared analysis logic for both Create and Describe modes | Create or Describe mode |
| `github-pr-templates.md` | PR body templates: small (<5 files), medium (5-15), large (15+), title format, writing guidelines, scaling rules | Create or Describe mode |
| `github-comment-review.md` | Comments mode workflow + investigation pipeline: fetch, categorize, investigate, research, assess, report, comment replies, implementation protocol | Comments mode |
| `github-cli-setup.md` | gh CLI installation and authentication setup — OS detection, package manager install, browser OAuth, verification | gh CLI not detected |
| `github-pr-operations.md` | Operational appendix — source-of-truth hierarchy, post-merge assessment, approval details, write verification, self-verification checklist, full recovery table, important reminders | All modes (consulted as needed) |

**Naming convention:** `{system}-{concern}.md` — `github-` prefix + descriptive concern suffix.

## Progressive Loading Pattern

SKILL.md is the orchestrator. It detects the user's intent, routes to a mode, and loads only the references that mode needs:

```
User request -> SKILL.md checks gh CLI
  |-- gh missing  -> github-cli-setup (install + auth flow)
  |-- gh present  -> fetch main, detect PR state
      |-- PR OPEN       -> detect mode (existing flow)
      |   |-- Create   -> github-pr-create + github-pr-describe + github-pr-templates
      |   |-- Describe  -> github-pr-describe + github-pr-templates
      |   |-- Comments  -> github-comment-review
      |   +-- Status    -> github-pr-create (Status section only)
      |-- PR MERGED/CLOSED + new commits -> Create (new PR)
      |-- PR MERGED/CLOSED + no commits  -> Inform (no action)
      +-- No PR history -> detect mode (existing flow)
```

Each reference file is self-contained with a context header so an agent reading it understands what it is without reading SKILL.md first.

## External Dependencies

| Dependency | Required | Purpose |
|------------|----------|---------|
| `gh` CLI v2.83+ | Yes | All GitHub operations (PR CRUD, diff, checks, reviews, inline comments) |
| context7 MCP server | Optional | Library doc research during comment investigation |

## Cross-Skill Usage

This skill does not currently have consumers (no other skills invoke it). If future skills need GitHub PR data, the recommended pattern is Skill tool delegation:

```
Skill(skill: "ai-assist-git-pr", args: "status")
```

The skill would detect the action and return structured data.

## Safety Model

| Level | Actions | Behavior |
|-------|---------|----------|
| Auto | Read PR, diff, comments, checks, status | Execute immediately |
| Gated | Create PR, update description, reply to comment, commit, push | Preview + approval + verify |
| Blocked | Merge, close, delete branch, force push | Never allowed |
