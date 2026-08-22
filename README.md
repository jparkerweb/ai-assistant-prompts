# AI-Assist Skills

<img src="https://github.com/jparkerweb/ai-assist-skills/blob/main/ai-assist-skills.jpg?raw=true" alt="banner" style="max-height:300px;">

A collection of AI agent skills that automate recurring engineering workflows that can be installed across multiple AI coding assistants.

## Installation

### Sync all skills (recommended)

This single command removes any stale or renamed skills, then installs the latest version of every skill from this repo. Run it any time to stay current:

```bash
npx --allow-git=all github:jparkerweb/ai-assist-skills
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
npx --allow-git=all github:jparkerweb/ai-assist-skills
```

> **Note:** `npm run dev:install` installs from your local working tree, which means it picks up uncommitted changes. This is intentional — it's the fastest way to iterate on a skill. Just remember to run `npm run sync` afterward to restore a clean state from the remote repo.

## Available Skills

### [ai-assist-changelog-bump](skills/ai-assist-changelog-bump/SKILL.md)
Validates and fixes the `CHANGELOG.md` version number before a PR/commit/push — reads `main` to find the latest version, classifies the branch's changes, computes the correct next semver, drafts or corrects the entry, and keeps `package.json`'s version aligned.

### [ai-assist-design-creator](skills/ai-assist-design-creator/SKILL.md)
Reverse-engineers a website's visual design system from a URL and produces a fully spec-compliant `DESIGN.md` file with YAML design tokens (colors, typography, spacing, rounded corners, components) and human-readable rationale sections.

### [ai-assist-discovery](skills/ai-assist-discovery/SKILL.md)
Deep research and analysis for codebases, technologies, domains, and feasibility assessments with analytical frameworks and confidence-graded findings.

### [ai-assist-dockerize-website](skills/ai-assist-dockerize-website/SKILL.md)
Guides you from a project folder to a working Docker container that serves a static site or documentation folder. Detects whether to serve ready-made HTML, build a site generator's output, or render a raw markdown docs folder; generates a Dockerfile, `.dockerignore`, `docker-compose.yml`, and a README section; then offers to build/smoke-test and publish to Docker Hub or GHCR.

### [ai-assist-git-commit](skills/ai-assist-git-commit/SKILL.md)
Stages and commits changes using a standard commit message format with an `AI Assisted` tag.

### [ai-assist-git-pr](skills/ai-assist-git-pr/SKILL.md)
Adaptive GitHub PR lifecycle — create PRs, generate descriptions, investigate review comments with deep analysis and batch approval, check merge readiness. All via `gh` CLI.

### [ai-assist-git-pr-review](skills/ai-assist-git-pr-review/SKILL.md)
Standards-based code review of a GitHub PR — reads the reviewed repo's agents files (AGENTS.md, `.agents-docs/`, CLAUDE.md), checks the diff against them plus general best practices, then (after approval) posts findings as inline comments and submits a REQUEST_CHANGES review. Review-only: never approves, merges, or pushes.

### [ai-assist-git-publish](skills/ai-assist-git-publish/SKILL.md)
Publishes a GitHub Release when `CHANGELOG.md`'s top version is ahead of the latest published release — derives the repo and default branch from `gh`, matches the repo's existing tag style, and creates the release only after explicit approval. Manual invocation only.

### [ai-assist-npm-update](skills/ai-assist-npm-update/SKILL.md)
Finds every `package.json` under the current directory, runs `npm outdated`, bumps each outdated dependency to its `^<wanted>` (in-range) version, and runs `npm install`. Supports `--dry-run`.

### [ai-assist-observability-audit](skills/ai-assist-observability-audit/SKILL.md)
17-dimension observability posture assessment with tier activation, health scoring, and cost analysis.

### [ai-assist-project-summary](skills/ai-assist-project-summary/SKILL.md)
Generate project overviews with engineer status updates (recent work, in-progress, issues, roadmap) and offer to surgically enhance existing documentation.

### [ai-assist-prototype](skills/ai-assist-prototype/SKILL.md)
Builds self-contained, double-click-to-open HTML prototypes so you can vet an interface before it gets built. One file holds several structurally different variants of a page, app screen, component, or terminal/TUI layout, plus a draggable Design Deck: flip variants, tune fonts, colors, spacing, shape, motion and "feel" with live dials and vibe presets (the dial set is right-sized per prototype: none for a quick structural check, a handful for a component, everything for a design exploration), preview at phone/tablet/desktop widths in light or dark, pin comments on elements, then press **Export to LLM** to copy a handoff block you paste back to the agent so it knows exactly which variant and settings you chose.

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

Once the bump merges, [`ai-assist-git-publish`](#ai-assist-git-publish) turns that CHANGELOG entry into a GitHub Release.

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

### ai-assist-dockerize-website

Guides you through containerizing and serving a simple website or documentation folder with Docker.

**Prerequisites:**

- Docker installed (Docker Desktop on Windows/Mac) to build and run the container — though the skill can generate the files without it

**Usage:**

```
/ai-assist-dockerize-website
/ai-assist-dockerize-website ./docs --port 8080
```

The skill will:

1. Inspect the project and classify it — ready-to-serve static HTML, a buildable site (Vite/Astro/MkDocs/Hugo/etc.), or a raw markdown docs folder
2. Confirm what to serve, the host port, and image/container names (pre-filled from the detection)
3. Generate a `Dockerfile` (single- or multi-stage), `.dockerignore`, `docker-compose.yml`, and a "Running with Docker" README section
4. Offer to build the image and smoke-test that it serves an HTTP 200
5. Optionally walk through publishing the image to Docker Hub or GHCR

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

### ai-assist-git-pr-review

Standards-based code review of a GitHub Pull Request that posts findings as inline comments and requests changes. The inverse of `ai-assist-git-pr`: that skill manages your own PR, this one authors a review on someone else's.

**Prerequisites:**

- GitHub CLI (`gh`) installed and authenticated

**Usage:**

```
/ai-assist-git-pr-review https://github.com/org/repo/pull/42
```

The skill will:

1. Parse the PR URL and load PR metadata (must be open; pins the review to the head SHA)
2. Gather the reviewed repo's documented standards from its agents files on the base branch and distill a rules checklist
3. Evaluate the diff — documented standards first, general best practices second — and categorize each finding CRITICAL/WARNING/NIT
4. Present every inline comment for approval before anything is posted (gated)
5. Post one REQUEST_CHANGES review with all approved inline comments, then verify it landed

Review-only: it never approves, merges, closes, or pushes code.

### ai-assist-git-publish

Publishes a GitHub Release when `CHANGELOG.md`'s top version is ahead of the latest release on GitHub. Closes the loop after [`ai-assist-changelog-bump`](#ai-assist-changelog-bump) lands a version bump on the default branch.

**Prerequisites:**

- GitHub CLI (`gh`) installed and authenticated
- A GitHub remote and a `CHANGELOG.md` at the repo root

**Usage:**

```
/ai-assist-git-publish
```

The skill will:

1. Require a clean working tree, then derive the repo and default branch from `gh repo view` (asking before switching branches)
2. Parse the top concrete version heading from `CHANGELOG.md` (bracketed, `v`-prefixed, or bare) and capture its section body as release notes
3. Compare it numerically against the latest published release — if it isn't ahead, no-op and stop
4. Present the proposed tag, title, target, and notes for approval before anything is written
5. Create the release via `gh release create --notes-file --target <default branch>`, then verify and report the release URL

Read-only against your files: it never edits `CHANGELOG.md`, runs `git tag`, or pushes.

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

### ai-assist-prototype

Builds a self-contained HTML prototype with several structurally different variants and a draggable Design Deck, so you can vet an interface (web page, app screen, component, flow, or terminal/TUI layout) before building it, then hand your decision back to the agent.

**Prerequisites:**

- Node.js 18+ (the bundled build/validate scripts have no dependencies)
- Any modern browser to open the generated file (no server needed)

**Usage:**

```
/ai-assist-prototype settings page for our SaaS app, 3 variants
/ai-assist-prototype TUI for a CI triage tool, split panes vs tabs
```

Or paste an export back to continue the loop:

```
/ai-assist-prototype AI-ASSIST PROTOTYPE HANDOFF v1 ...
```

The skill will:

1. Pin down the brief (subject, audience, the design question, web or TUI, how many variants) and reuse what the repo already has (`DESIGN.md`, Tailwind/CSS tokens, real content)
2. Plan 3 (max 5) structurally different variants, each with a name and a one-line thesis, and right-size the Deck to the scope (`dials`: `none` for a structure-only check, `essential` for a component, `standard` for a screen, `full` for a design exploration, plus only the custom controls you will actually tune)
3. Author `prototypes/<slug>.parts.html` (manifest + variant templates that consume the harness tokens) and assemble `prototypes/<slug>.html` with `scripts/build-prototype.mjs`, which also validates it
4. Verify it renders (optionally driving the page through `window.__PT__` with browser tools) and hand it over with a short guide to the Deck
5. When you paste the **Export to LLM** block back, restate your decision (variant, preset, changed dials, notes, pins) and either iterate the prototype, turn the tokens into a design spec, or implement the winner for real

Variants explore structure; dials explore feel; the export closes the loop. Works from `file://`, no dependencies, safe to email to a PM or designer.

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
