# AGENTS.md

This file provides guidance to AI coding agents like Claude Code (claude.ai/code), Cursor AI, Codex, Gemini CLI, GitHub Copilot, Devin, and other AI coding assistants when working with code in this repository.

## Project Overview

AI-ASSIST Skills is a collection of AI agent skills. Each skill automates a recurring workflow and can be installed across multiple AI coding assistants (Claude Code, Cursor, Windsurf, GitHub Copilot, etc.) via [skills.sh](https://skills.sh) or manual copy.

This is **not** a traditional application — there are no build steps, test suites, or runtime processes. The deliverables are markdown-based skill definition files (`SKILL.md`) consumed by AI agents.

## Git Commit Messages

All commits must follow this format:

```
<description>

AI Assisted
```

A concise description on the first line, then a blank line, then the literal text `AI Assisted` on its own line.

## Local Development

When authoring or editing a skill, install it locally for testing **before** committing or pushing. The `skills add` command accepts a local path, so it reads directly from your working tree.

```bash
# Install a single skill from your local working tree
npm run dev:install -- <skill-name>

# Example
npm run dev:install -- ai-assist-design-creator
```

This is equivalent to `npx skills add . -g --skill <skill-name> -y`. Re-run the same command after each edit — it overwrites the installed copy in place.

To verify:
```bash
npx skills list -g | grep <skill-name>
```

To restore the production state from GitHub after your changes are merged:
```bash
npm run sync
```

> The local install picks up uncommitted changes by design. This is the intended dev loop — edit → install → test → repeat. See [README.md](./README.md#local-development) for the full workflow.

## Architecture

Skills live in `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`, `argument-hint`) and markdown instructions that AI agents follow at runtime. Larger skills add a `references/` directory with reference material loaded on-demand. The repo has no application code — just skill definitions, the sync script in `bin/`, and documentation.

## Contributing

Adding a new skill requires creating a directory under `skills/` (prefixed with `ai-assist-`), writing a `SKILL.md`, and updating `README.md` and `CHANGELOG.md`.
