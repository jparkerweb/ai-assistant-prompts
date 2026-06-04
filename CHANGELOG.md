# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-06-03

### Added

- **ai-assist-npm-update**: Finds every `package.json` under the current directory, runs `npm outdated`, bumps each outdated dependency to its `^<wanted>` (in-range) version preserving file formatting, and runs `npm install` per updated project. Includes a bundled Node script (`scripts/npm-update.mjs`) with `--dry-run` and `--root` options.
- **ai-assist-changelog-bump**: Validates and fixes the `CHANGELOG.md` version number before a PR/commit/push — reads `main` to find the latest version, classifies the branch's changes, computes the correct next semver, and drafts or corrects the entry.

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
