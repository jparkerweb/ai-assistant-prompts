# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.5.0] - 2026-08-20

### Added

- **ai-assist-git-pr**: Adds cross-platform Node helpers for deterministic PR context, comment retrieval, thread listing, and gated reply-and-resolve operations.
- **CI**: Adds a pull-request check that requires `CHANGELOG.md` to advance beyond the base branch version.

### Changed

- **ai-assist-git-pr**: Strengthens portable command execution, surgical PR-description updates, post-create checks, comment handling, and write verification.
- **ai-assist-git-pr-review**: De-duplicates findings against existing review threads before requesting changes.
- **sync**: Installs selected skills interactively from the local clone instead of reinstalling every skill from GitHub.

## [1.4.0] - 2026-08-13

### Added

- **ai-assist-git-publish**: Publishes a GitHub Release when `CHANGELOG.md`'s top version is ahead of the latest release published on GitHub, closing the loop after `ai-assist-changelog-bump` lands a version bump. Derives the repository and default branch from `gh repo view` (never hardcoded), parses bracketed/`v`-prefixed/bare version headings, compares versions numerically, matches the repo's existing tag style, and creates the release via `gh release create --notes-file --target <default branch>` only after explicit approval. Manual invocation only — never auto-triggers.

## [1.3.1] - 2026-08-13

### Changed

- **ai-assist-changelog-bump**: Now recognizes both `## [x.y.z]` and `## vx.y.z` version headings (plus `## [vx.y.z]`, bare `## x.y.z`, and alternate date separators) instead of assuming the bracketed Keep a Changelog style. Detects the CHANGELOG's existing heading style and writes new entries to match it, never converting or mixing styles, and strips brackets/`v` prefixes before comparing versions or aligning `package.json`.

## [1.3.0] - 2026-07-05

### Added

- **ai-assist-git-pr-review**: Performs a standards-based code review on a GitHub Pull Request, then (after explicit approval) posts the findings as inline review comments and submits the review as `REQUEST_CHANGES`. Reads the reviewed repo's full documented standards from its agents files (`AGENTS.md`, `.agents-docs/`, `CLAUDE.md`) on the PR's base branch, checks the diff against them plus general best practices, and categorizes each finding CRITICAL/WARNING/NIT. Review-only — never approves, merges, closes, or pushes. The inverse of `ai-assist-git-pr`. Includes `references/posting-review.md` (gathering agents files, anchoring rules, the exact `gh api` review payload, suggestion blocks, verification, and recovery).

## [1.2.0] - 2026-06-28

### Added

- **ai-assist-dockerize-website**: Guides the user through containerizing and serving a static website or documentation folder with Docker. Inspects the project to classify it (ready-to-serve static HTML, a buildable site generator, or a raw markdown docs folder), generates a `Dockerfile`, `.dockerignore`, `docker-compose.yml`, and a "Running with Docker" README section, then offers to build and smoke-test the container and publish the image to Docker Hub or GHCR. Uses `nginx:alpine` for static content and a multi-stage build when the site must be generated. Includes `references/recipes.md` (per-generator multi-stage Dockerfiles, SPA fallback, non-root, Caddy) and `references/registry-publish.md`.

## [1.1.0] - 2026-06-03

### Added

- **ai-assist-npm-update**: Finds every `package.json` under the current directory, runs `npm outdated`, bumps each outdated dependency to its `^<wanted>` (in-range) version preserving file formatting, and runs `npm install` per updated project. Includes a bundled Node script (`scripts/npm-update.mjs`) with `--dry-run` and `--root` options.
- **ai-assist-changelog-bump**: Validates and fixes the `CHANGELOG.md` version number before a PR/commit/push — reads `main` to find the latest version, classifies the branch's changes, computes the correct next semver, drafts or corrects the entry, and keeps `package.json`'s `version` aligned with the latest released version.

## [1.0.0] - 2026-05-23

### Added

Initial release. Nine AI agent skills, all prefixed with `ai-assist-`, plus the `npm run sync` installer (`bin/sync.mjs`).

- **ai-assist-design-creator**: Reverse-engineers a website's visual design system from a URL and produces a fully spec-compliant `DESIGN.md` file with YAML design tokens (colors, typography, spacing, rounded corners, components) and human-readable rationale sections.
- **ai-assist-discovery**: Deep research and analysis workflow for codebases, technologies, domains, ideas, or data, with analytical frameworks and confidence-graded findings.
- **ai-assist-git-commit**: Stages and commits changes using a standard commit message format with an `AI Assisted` tag.
- **ai-assist-git-pr**: Adaptive GitHub PR lifecycle skill (Create, Describe, Comments, Status) via `gh` CLI, with gated writes and merge-readiness checks.
- **ai-assist-observability-audit**: 17-dimension observability posture assessment with tier activation, health scoring, and cost analysis.
- **ai-assist-project-summary**: Generates project overviews with engineer status updates and offers surgical documentation enhancement.
- **ai-assist-security-audit**: 16-dimension security posture assessment with CWE references, health scoring, and remediation plans.
- **ai-assist-tech-debt**: 22-dimension, 5-tier technical debt audit with weighted health scoring and prioritized remediation.
- **ai-assist-test-audit**: 16-dimension test suite audit with depth control (quick/standard/deep), gap matrix, and health scoring.
