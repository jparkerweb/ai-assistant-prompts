# Part 1: Project Overview Guide

> Part of [ai-assist-project-summary](../SKILL.md) — loaded during Step 1.

## What to Extract

Build these sections from the project's actual files. Every claim must be verified — never fabricate.

### What It Is

One paragraph in plain English. No jargon without inline definition. A product manager should understand this without follow-up questions.

### What It Does

Key features and capabilities as a bulleted list. Derive from README, AGENTS.md, package manifests, and code inspection.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | e.g., TypeScript 5.x |
| Runtime | e.g., Node.js 20 |
| Framework | e.g., Next.js 14 |
| Build | e.g., Webpack, Vite, MSBuild |
| CI/CD | e.g., GitHub Actions, Azure DevOps |
| Key Libraries | Top 5-8 most important dependencies |
| Config | e.g., YAML, environment variables, App.config |
| Monitoring | e.g., Datadog, Application Insights, none detected |

### Key Concepts

Define domain-specific terms a new engineer wouldn't know. Present as a table:

| Term | Meaning |
|------|---------|
| [Domain term] | [Plain-language definition] |

### Project Structure

High-level directory tree with 1-line descriptions per directory. Show only the first 2 levels unless deeper structure is important.

```
project-root/
├── src/           # Application source code
├── tests/         # Test suites
├── docs/          # Documentation
└── scripts/       # Build and deployment scripts
```

### Getting Started

Concrete, numbered steps: clone, install prerequisites, configure secrets/env vars, build, run, test. Include actual commands from the project.

### Deployment Environments

Include if applicable (skip for libraries, CLIs, or projects without deployment):

| Environment | Servers/Infra | Config Source |
|-------------|--------------|---------------|
| Dev | localhost | .env.local |
| Staging | [servers] | [config source] |
| Production | [servers] | [config source] |

### Compliance & Security

Include if regulatory context detected (SOC2, HIPAA, GDPR, PCI-DSS, FedRAMP, etc.):
- Data handling requirements
- Access control model
- Audit trail capabilities
- Relevant standards and certifications

## Project Type Detection

Detect the project type to adapt the summary structure:

| Type | Signals | Focus Sections | Key Questions |
|------|---------|----------------|---------------|
| Microservice | Dockerfile, k8s/, API routes | API surface, deployment, health checks | What does it own? Who calls it? |
| Library | exports in package.json, lib/ | Public API, install, usage examples | What problem does it solve? |
| CLI | bin in package.json, argparse | Commands, options, configuration | What commands exist? |
| Data Pipeline | ETL scripts, migrations, DAGs | Data flow, sources/sinks, scheduling | What data moves where? How often? |
| Monorepo | workspaces, multiple packages | Package index, relationships, shared tools | What packages exist? How do they relate? |
| Windows Service | .sln, Windows service registration, App.config | Service lifecycle, deployment, monitoring | What events trigger processing? |
| Skill/Prompt Collection | SKILL.md files, no build system | Skill inventory, installation, usage | What skills exist? How are they installed? |

## Writing Guidelines

### Layman's Terms

Define jargon inline. If expertise is required to understand a sentence, rewrite it.

| Bad (jargon-heavy) | Good (plain-language) |
|--------------------|-----------------------|
| "Implements pub/sub event-driven architecture with CQRS for eventual consistency" | "Services communicate through a message queue — changes publish events that other services pick up" |
| "Leverages React hydration with SSR for optimal TTFB" | "Pages load fast because the server pre-renders HTML, then the browser adds interactivity" |
| "RESTful CRUD interface over the domain model" | "An API that lets other systems create, read, update, and delete records" |

### Structure Rules

- **Tables over paragraphs** — present structured data as tables, always.
- **One line per concept** — no multi-sentence bullets.
- **Big picture first** — what it is, then what it does, then how.

### Stakeholder Framing

Tailor depth to the likely audience:
- **Product managers:** features, roadmap, user impact
- **New engineers:** setup, architecture, where things live
- **Compliance officers:** data handling, access controls, audit capabilities
