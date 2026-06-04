# AI-ASSIST Skills

<img src="https://github.com/jparkerweb/ai-assist-skills/blob/main/ai-assist-skills.jpg?raw=true" alt="banner" style="max-height:300px;">

A collection of AI agent skills that automate recurring engineering workflows that can be installed across multiple AI coding assistants.

## Installation

### Sync all skills (recommended)

This single command removes any stale or renamed skills, then installs the latest version of every skill from this repo. Run it any time to stay current:

```bash
npx github:jparkerweb/ai-assist-skills
```

Skills are installed globally via [skills.sh](https://skills.sh) and auto-detected by 40+ AI agents (Claude Code, Cursor, Windsurf, GitHub Copilot, etc.).

<img src="https://github.com/jparkerweb/ai-assist-skills/blob/main/ai-assist-install.jpg?raw=true" style="max-width: 593px;">

## Local Development

When creating or editing a skill, you need to install it locally to test it **before** committing or pushing. The `skills add` command accepts a local path as the source, so it installs directly from your working tree — no git push required.

### Install a single skill from your local repo

```bash
npm run dev:install -- ai-assist-design-creator
```

This is equivalent to:

```bash
npx skills add . -g --skill ai-assist-design-creator -y
```

Both commands install the skill globally from your local working directory, overwriting any previously installed version. Run it again after every edit to pick up your changes.

### Re-install to pick up edits

The same command overwrites the installed copy — there is no separate "update" step:

```bash
npm run dev:install -- ai-assist-design-creator
# edit SKILL.md...
npm run dev:install -- ai-assist-design-creator   # picks up the latest changes
```

### Verify installation

```bash
npx skills list -g | grep ai-assist-design-creator
```

### Re-sync everything from GitHub (restore production state)

Once you're done testing locally and your changes are merged, run the full sync to pull from the remote repo and discard your local install:

```bash
npm run sync
# or
npx github:jparkerweb/ai-assist-skills
```

> **Note:** `npm run dev:install` installs from your local working tree, which means it picks up uncommitted changes. This is intentional — it's the fastest way to iterate on a skill. Just remember to run `npm run sync` afterward to restore a clean state from the remote repo.

## Available Skills

### [ai-assist-changelog-bump](skills/ai-assist-changelog-bump/SKILL.md)
Validates and fixes the `CHANGELOG.md` version number before a PR/commit/push — reads `main` to find the latest version, classifies the branch's changes, computes the correct next semver, drafts or corrects the entry, and keeps `package.json`'s version aligned.

### [ai-assist-design-creator](skills/ai-assist-design-creator/SKILL.md)
Reverse-engineers a website's visual design system from a URL and produces a fully spec-compliant `DESIGN.md` file with YAML design tokens (colors, typography, spacing, rounded corners, components) and human-readable rationale sections.

### [ai-assist-discovery](skills/ai-assist-discovery/SKILL.md)
Deep research and analysis for codebases, technologies, domains, and feasibility assessments with analytical frameworks and confidence-graded findings.

### [ai-assist-git-commit](skills/ai-assist-git-commit/SKILL.md)
Stages and commits changes using a standard commit message format with an `AI Assisted` tag.

### [ai-assist-git-pr](skills/ai-assist-git-pr/SKILL.md)
Adaptive GitHub PR lifecycle — create PRs, generate descriptions, investigate review comments with deep analysis and batch approval, check merge readiness. All via `gh` CLI.

### [ai-assist-npm-update](skills/ai-assist-npm-update/SKILL.md)
Finds every `package.json` under the current directory, runs `npm outdated`, bumps each outdated dependency to its `^<wanted>` (in-range) version, and runs `npm install`. Supports `--dry-run`.

### [ai-assist-observability-audit](skills/ai-assist-observability-audit/SKILL.md)
17-dimension observability posture assessment with tier activation, health scoring, and cost analysis.

### [ai-assist-project-summary](skills/ai-assist-project-summary/SKILL.md)
Generate project overviews with engineer status updates (recent work, in-progress, issues, roadmap) and offer to surgically enhance existing documentation.

### [ai-assist-security-audit](skills/ai-assist-security-audit/SKILL.md)
16-dimension security posture assessment with CWE references, health scoring, and remediation plans.

### [ai-assist-tech-debt](skills/ai-assist-tech-debt/SKILL.md)
22-dimension, 5-tier technical debt audit with weighted health scoring and prioritized remediation.

### [ai-assist-test-audit](skills/ai-assist-test-audit/SKILL.md)
16-dimension test suite audit with depth control (quick/standard/deep), gap matrix, and health scoring.

> **Tip:** All skills are prefixed with `ai-assist-` so you can type `/ai-assist-` in your AI agent to see a list of all available skills (some agents like Windsurf will also recognize them by `@` referencing them).

### Other skills.sh commands

```bash
npx skills list          # Show installed skills
npx skills check         # Check for updates
npx skills update        # Apply updates (won't remove stale skills — use sync above)
npx skills remove        # Uninstall skills
```

**Install a specific skill only:**

```bash
npx skills add jparkerweb/ai-assist-skills -g --skill ai-assist-discovery -y
```

## Skills

### ai-assist-changelog-bump

Validates and fixes the `CHANGELOG.md` version number before a PR, commit, or push.

**Usage:**

```
/ai-assist-changelog-bump
```

The skill will:

1. Read `main`'s CHANGELOG to find the current latest version
2. Classify the branch's changes (new skill, capability, behavior change, or bug fix)
3. Compute the correct next semver and compare it against the branch's entry
4. Draft a new entry or fix the version/date, with approval before writing
5. Align `package.json`'s `version` (if present) with the latest released version

### ai-assist-design-creator

Reverse-engineers a website's visual design system from a URL and produces a fully spec-compliant `DESIGN.md` file.

**Usage:**

```
/ai-assist-design-creator https://example.com
```

### ai-assist-discovery

Deep research and analysis workflow for codebases, technologies, domains, ideas, or data.

**Usage:**

```
/ai-assist-discovery React Server Components feasibility
```

The skill will:

1. Classify the target type (codebase, technology, domain, idea, data) and detect variants
2. Select analytical frameworks appropriate to the target and depth level
3. Gather evidence from multiple authoritative sources with confidence grading
4. Produce structured documentation with executive summary, findings, and framework outputs in chat
5. Optionally save research to `docs/research/`, only after explicit user confirmation

### ai-assist-git-commit

Stages and commits changes using a standard commit message format.

**Prerequisites:**

- Must be in a git repository with uncommitted changes

**Usage:**

```
/ai-assist-git-commit
```

Or pass a commit description directly:

```
/ai-assist-git-commit fix timeout on report export
```

The skill will:

1. Check for staged/unstaged changes
2. Draft a commit message and ask for approval (unless a description was provided)
3. Stage relevant files and create the commit in the format: description, blank line, `AI Assisted`
4. Show the resulting commit for confirmation

### ai-assist-git-pr

Adaptive GitHub PR lifecycle skill with four modes: Create, Describe, Comments, and Status.

**Prerequisites:**

- GitHub CLI (`gh`) v2.83+ installed and authenticated

**Usage:**

```
/ai-assist-git-pr
```

Or describe what you need:

```
/ai-assist-git-pr create a PR
/ai-assist-git-pr describe this PR
/ai-assist-git-pr check comments
/ai-assist-git-pr is this ready to merge?
```

The skill will:

1. Detect the mode from your request (Create, Describe, Comments, or Status)
2. **Create:** Analyze the diff, draft title + body, preview for approval, create via `gh pr create`
3. **Describe:** Analyze the diff, draft an evidence-based description, preview for approval, update via `gh pr edit`
4. **Comments:** Fetch all inline + issue-level comments, investigate each silently (full file context, code path tracing, online research), present a summary-first report with recommended fixes, batch approval with opt-out
5. **Status:** Report merge readiness — CI checks, review approvals, conflicts, draft status, PR size

All operations use `gh` CLI exclusively. Reads are automatic; writes require preview + explicit approval. Never merges, closes, or force pushes.

### ai-assist-npm-update

Bulk-updates outdated npm dependencies across one or more `package.json` files to their in-range "wanted" versions.

**Usage:**

```
/ai-assist-npm-update
/ai-assist-npm-update --dry-run
```

The skill will:

1. Find every `package.json` under the current directory (skipping `node_modules` and other vendored/output folders)
2. Run `npm outdated` for each project
3. Rewrite each outdated dependency's version specifier to `^<wanted>` (the newest version allowed by the existing semver range — not a major-version jump)
4. Run `npm install` in each updated project to refresh the lockfile

Run with `--dry-run` first to preview every change without writing files or installing.

### ai-assist-observability-audit

17-dimension observability posture assessment with tier activation, health scoring, and cost analysis.

**Usage:**

```
/ai-assist-observability-audit
```

The skill will:

1. Detect the observability stack and classify the project tier (Universal/Service/Distributed)
2. Activate applicable dimensions and audit each systematically
3. Perform cross-cutting cost analysis across all telemetry types
4. Produce a health score (0-100) with severity-ranked findings and improvement plan

### ai-assist-project-summary

Generate a project overview with engineer status updates and documentation enhancement.

**Usage:**

```
/ai-assist-project-summary
```

The skill will:

1. Read AGENTS.md, README, specs, package manifests, and git history
2. Detect project type and generate a plain-language project overview
3. Produce an engineer status update: recently completed, in-progress, issues/gaps, roadmap, suggested improvements
4. Offer to surgically enhance existing documentation (README, AGENTS.md) based on findings

### ai-assist-security-audit

16-dimension security posture assessment with CWE references and health scoring.

**Usage:**

```
/ai-assist-security-audit auth crypto
```

The skill will:

1. Detect the tech stack and map the attack surface
2. Run audit tools (npm audit, pip-audit, etc.) for a deterministic baseline
3. Activate and audit applicable dimensions with CWE/CVE references
4. Produce a health score (0-100) with severity-ranked findings and remediation plan

### ai-assist-tech-debt

22-dimension, 5-tier technical debt audit across code, architecture, infrastructure, quality processes, and operations.

**Usage:**

```
/ai-assist-tech-debt
```

The skill will:

1. Detect the tech stack and classify project type (Web/API/CLI/Library/etc.)
2. Run linters, formatters, and audit tools for a deterministic baseline
3. Audit all activated dimensions across 5 tiers with weighted scoring
4. Produce a health score (0-100) with severity-ranked findings and improvement plan

### ai-assist-test-audit

16-dimension test suite audit with depth control (quick/standard/deep).

**Usage:**

```
/ai-assist-test-audit standard
```

The skill will:

1. Detect the test framework and run the test suite for deterministic metrics
2. Activate dimensions based on depth level (quick=3, standard=12-14, deep=16)
3. Audit each dimension and build a module-by-dimension gap matrix
4. Produce a health score (0-100) with severity-ranked findings and improvement plan

## Contributing

To add a new skill:

1. Create a new directory under `skills/` with your skill name (prefixed with `ai-assist-`)
2. Add a `SKILL.md` file with YAML frontmatter (`name`, `description`) and markdown instructions. For larger skills with detailed checklists or scoring models, add a `references/` directory with reference material loaded on-demand.
3. Update this README's "Available Skills" section
4. Add an entry to `CHANGELOG.md`
