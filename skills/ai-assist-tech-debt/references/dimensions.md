# Tech Debt Audit Dimensions

> Part of [ai-assist-tech-debt](../SKILL.md) — loaded during Step 3.

## Dimension Activation Table

Detect the project type from filesystem signals and activate applicable dimensions. ALL dimensions apply to every project type. Other dimensions activate based on detected type. Multiple types detected = union of activated dimensions.

| # | Dimension | ALL | W | A | L | C | M | D | DI |
|---|-----------|:---:|:-:|:-:|:-:|:-:|:-:|:-:|:--:|
| 1 | Structure | x | x | x | x | x | x | x | x |
| 2 | Code Quality | x | x | x | x | x | x | x | x |
| 3 | Dead Code | x | x | x | x | x | x | x | x |
| 4 | Error Handling | x | x | x | x | x | x | x | x |
| 5 | Security | x | x | x | x | x | x | x | x |
| 6 | Best Practices | x | x | x | x | x | x | x | x |
| 7 | Comments | x | x | x | x | x | x | x | x |
| 8 | Architecture | x | x | x | x | x | x | x | x |
| 9 | API Design | | x | x | x | | x | | x |
| 10 | Data Model | | | x | | | | x | x |
| 11 | Type System | x | x | x | x | x | x | x | x |
| 12 | Dependency | x | x | x | x | x | x | x | x |
| 13 | Build/CI | x | x | x | x | x | x | x | x |
| 14 | Config | x | x | x | x | x | x | x | x |
| 15 | Deploy/IaC | | x | x | | | | | x |
| 16 | Testing | x | x | x | x | x | x | x | x |
| 17 | Documentation | x | x | x | x | x | x | x | x |
| 18 | Standards | x | x | x | x | x | x | x | x |
| 19 | Compatibility | x | x | x | x | x | x | x | x |
| 20 | Performance | x | x | x | x | x | x | x | x |
| 21 | Observability | | x | x | | x | | | x |
| 22 | i18n/A11y | | x | | | | x | | |

W=Web, A=API, L=Lib, C=CLI, M=Mobile, D=Data, DI=Distributed. Counts: ALL=17, W=21, A=21, L=18, C=18, M=19, D=18, DI=21.

## Project Type Detection Signals

| Type | Key | Signals |
|------|-----|---------|
| Web | WEB | React, Vue, Angular, Svelte, CSS/SCSS, `next.config`, `vite.config`, `webpack.config` |
| API | API | routes/, controllers/, OpenAPI/swagger files, Express/FastAPI/Flask/Spring Boot |
| Library | LIB | exports in package.json, lib/ or src/ with index barrel, published to registry |
| CLI | CLI | bin/ directory, `argparse`, `clap`, `commander`, `yargs`, shebang lines |
| Mobile | MOB | React Native, Flutter, `android/`, `ios/`, `expo`, `capacitor` |
| Data | DATA | migrations/, ORM configs, Prisma schema, Alembic, Knex, Entity Framework |
| Distributed | DI | Docker Compose, Kubernetes manifests, microservices, service mesh, `docker-compose.yml` |

When multiple types are detected, take the union of all activated dimensions.

## Tier Structure Overview

| Tier | Dims | Focus | Description |
|------|------|-------|-------------|
| Tier 1: Code | 1-7 | File-level issues visible to any developer | Structure, quality, dead code, error handling, security surface, best practices, comments |
| Tier 2: Architecture | 8-11 | System-level design and coupling | Architecture patterns, API design, data model, type system |
| Tier 3: Infrastructure | 12-15 | Build, deploy, config, dependencies | Dependency health, CI/CD, configuration management, deployment |
| Tier 4: Quality | 16-19 | Testing, documentation, standards, compatibility | Test infrastructure, docs, coding standards, compatibility debt |
| Tier 5: Operational | 20-22 | Performance, observability, i18n/a11y | Runtime performance, monitoring, internationalization/accessibility |

## Per-Dimension Check Definitions

### Tier 1: Code

#### T1.1 — Structure (ALL, Weight: 5)

**Checks:**
- File length: production code files >300 lines (exclude tests, generated files, vendored code)
- Function/method length: >50 lines
- Directory depth: >5 levels
- File sprawl: >30 files in a single directory
- Circular dependencies between modules
- Module boundary detection: barrel exports (index files), package.json workspaces, monorepo boundaries
- Missing or inconsistent module boundaries (features leaking across boundaries)

**What to grep/look for:**
- `wc -l` on source files, filter out test/generated patterns
- Import/require statements forming cycles
- `index.ts`, `index.js`, `__init__.py`, `mod.rs` barrel files
- `workspaces` field in package.json or pnpm-workspace.yaml

**Severity guidance:**
- Warning: Files >500L, functions >100L, circular deps between feature modules
- Suggestion: Files 300-500L, functions 50-100L, minor structural inconsistencies

#### T1.2 — Code Quality (ALL, Weight: 4)

**Checks:**
- Naming: inconsistent conventions, ambiguous names, single-letter variables outside loops
- Magic values: hardcoded numbers/strings without named constants
- Duplication: 6+ identical lines across files
- Nesting depth: >4 levels of indentation
- Parameter count: >5 parameters per function
- Boolean blindness: functions taking multiple boolean args without clarity (e.g., `process(true, false, true)`)
- Cognitive complexity: combined nesting × branching (deeply nested conditionals with multiple branches)

**What to grep/look for:**
- Repeated code blocks (manual pattern matching across files)
- Functions with many `bool` parameters
- Deep `if/else/switch` chains
- `TODO` comments about "refactor" or "simplify"

**Severity guidance:**
- Warning: Cognitive complexity makes code error-prone, widespread duplication
- Suggestion: Minor naming issues, occasional magic values

**Language-specific boolean blindness examples:**
- JS/TS: `createElement(true, false, true)` → use options object or named params
- Python: `connect(True, False, True)` → use keyword arguments
- C#/Java: `new Config(true, false, true)` → use builder pattern or enums
- Rust: multiple `bool` args → use enums or newtype wrappers

#### T1.3 — Dead Code (ALL, Weight: 3)

**Checks:**
- Unused exports/functions/classes
- Unreachable code after returns/throws
- Commented-out code blocks >3 lines (single-line comments explaining removal = documentation, not dead code)
- Orphan files not imported anywhere
- Unused dependencies in manifest

**Evidence requirements (ALL THREE must be checked before flagging):**
1. Grep ALL references including dynamic imports, reflection, and string-based lookups (e.g., `require(variable)`, `getattr()`, Java reflection)
2. Check test files — test-only utilities are NOT dead code
3. Check framework conventions — lifecycle hooks, decorators, convention-named files (e.g., `middleware.ts`, `_app.tsx`, `conftest.py`) may be used implicitly by the framework

**What to grep/look for:**
- Export names → search for import/require of those names
- File names → search for references to the file path
- `package.json` dependencies → search for `import`/`require` of each
- Dynamic patterns: `import()`, `require()` with variables, `__import__`, `importlib`

**Severity guidance:**
- Warning: Entire unused modules, significant dead code paths
- Suggestion: Individual unused functions, small commented blocks

#### T1.4 — Error Handling (ALL, Weight: 8)

**Checks:**
- Unhandled async errors (unhandled Promise rejections, Task exceptions, goroutine panics)
- Silent catches: empty catch blocks, catch-and-ignore patterns
- Missing input validation at system boundaries
- Unsafe operations without try/catch (file I/O, network calls, JSON parsing)
- Resource leaks: unclosed file handles, database connections, streams, timers
- Null/undefined boundary issues

**Async error patterns by language:**
- JS/TS: unhandled Promise rejection, missing `.catch()`, async void functions, missing `try/catch` in async handlers
- Python: bare `except:`, `except Exception: pass`, uncaught `asyncio` task exceptions
- C#: `async void` methods (except event handlers), unobserved Task exceptions, missing `ConfigureAwait`
- Go: unchecked `error` return values, goroutine panics without `recover()`
- Rust: `.unwrap()` in production code, unhandled `Result` variants
- Java: swallowed exceptions, `catch (Exception e) {}`, unchecked `CompletableFuture`

**What to grep/look for:**
- `catch` blocks with empty bodies or only logging
- `async` functions without error handling
- `.unwrap()`, `!` (force unwrap), `as!` (force cast)
- File/connection open without corresponding close/dispose/using

**Severity guidance:**
- Critical: Unhandled errors that crash the application or lose data
- Warning: Silent catches hiding real failures, resource leaks under load
- Suggestion: Missing validation on low-risk inputs

#### T1.5 — Security (ALL, Weight: 8)

**Surface-level assessment only.** For deep security analysis, use `/ai-assist-security-audit`.

**This dimension checks:**
- Hardcoded secrets: API keys, passwords, tokens, connection strings in source
- Injection patterns: SQL string concatenation, command injection, template injection
- Deprecated crypto: MD5/SHA1 for security, ECB mode, weak key sizes
- Data exposure: PII in logs, verbose error responses, debug endpoints in production
- Missing auth checks: unprotected endpoints, missing RBAC enforcement
- Dependency vulnerabilities: known CVEs in direct dependencies (run `npm audit` / `pip-audit` / `cargo audit`)

**What to grep/look for:**
- `password`, `secret`, `api_key`, `token` as string literals
- SQL string concatenation: `"SELECT.*" +`, f-strings with SQL
- `exec()`, `eval()`, `child_process.exec()` with user input
- `console.log` / `print` / `logger` with request bodies or user data

**Severity guidance:**
- Critical: Hardcoded production secrets, injectable queries
- Warning: Deprecated crypto, missing auth on internal endpoints
- Suggestion: Minor exposure risks, informational findings

#### T1.6 — Best Practices (ALL, Weight: 3)

**Checks:**
- Language version: using outdated language features when newer alternatives exist
- Deprecated APIs: using APIs marked deprecated by the framework/library
- Anti-patterns: known anti-patterns for the detected stack
- Missing type annotations where the project uses types
- Lint rule violations
- Fail-fast violations: errors caught too late in the pipeline
- Framework-version-specific checks: e.g., React class components in a hooks-era codebase, Vue Options API in Composition API project

**What to grep/look for:**
- Framework migration guides for version-specific patterns
- `@deprecated` annotations, deprecation warnings in docs
- Language/framework changelogs for removed/replaced APIs
- Mixing old and new patterns (e.g., `componentDidMount` alongside `useEffect`)

**Severity guidance:**
- Warning: Using deprecated APIs that will be removed in next major version
- Suggestion: Style modernization, minor pattern updates

#### T1.7 — Comments (ALL, Weight: 2)

**Checks:**
- Outdated comments: comments that describe behavior different from the code
- TODO/FIXME age: use `git blame` to detect TODOs older than 6 months
- Commented-out code blocks >3 lines (findings); single-line comments explaining why code was removed (documentation, not findings)
- Missing API documentation on public interfaces
- README accuracy: documented setup/usage matches actual project state

**What to grep/look for:**
- `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP` comments → `git blame` each for age
- Large blocks of `//` or `#` commented code
- Public functions/methods without JSDoc/docstring/XML doc comments
- README instructions → verify they actually work

**Severity guidance:**
- Warning: Misleading comments that could cause bugs, TODOs >1 year old indicating forgotten work
- Suggestion: Missing docs on public APIs, stale TODOs <1 year

### Tier 2: Architecture

#### T2.8 — Architecture (ALL, Weight: 8)

**Checks:**
- Import cycle detection: circular imports between modules/packages
- Coupling: high fan-in/fan-out between modules
- Cohesion: modules with unrelated responsibilities
- Premature abstraction: abstractions with single implementation
- Layer violations: data layer importing from presentation, shared utilities depending on features
- God module detection: modules with >500 imports or >20 exported functions/classes
- Feature scatter: single logical feature spread across >5 directories
- Shared mutable state: global variables, singletons holding mutable state

**Import cycle detection by language:**
- JS/TS: follow `import`/`require` chains, check for A→B→A patterns
- Python: `import` / `from X import Y` chains, runtime import tricks in `__init__.py`
- Go: package import cycles (compiler-enforced but worth noting workarounds)
- C#/Java: namespace/package dependency cycles
- Rust: `mod` and `use` chains (compiler-enforced)

**What to grep/look for:**
- Build a mental import graph: for each module, note what it imports
- Count exports per module (barrel files are a signal)
- Look for `global`, `static mut`, singleton patterns
- Feature-named directories: check if one feature touches >5 separate dirs

**Severity guidance:**
- Critical: Import cycles causing runtime issues, god modules blocking team velocity
- Warning: High coupling between features, feature scatter, shared mutable state
- Suggestion: Premature abstractions, minor cohesion issues

#### T2.9 — API Design (W/A/L/M/DI, Weight: 5)

**Checks:**
- Naming consistency: REST conventions, RPC naming patterns
- Response format consistency: error shapes, pagination, envelope patterns
- Error standards: consistent error codes and messages across endpoints
- Schema validation: request/response schema enforcement
- API versioning: versioning strategy (URL path, header, query param), backward compatibility
- Pagination: cursor vs offset, default/max limits
- Idempotency: idempotency keys for non-GET mutations, retry-safe operations

**What to grep/look for:**
- Route definitions: consistency in naming (plural nouns, kebab-case, etc.)
- Error response shapes across different handlers
- `/v1/`, `/v2/` or `Accept-Version` headers
- `Idempotency-Key` header handling, unique constraint on operations

**Severity guidance:**
- Warning: Inconsistent error formats, missing pagination on list endpoints, no idempotency on payment/mutation endpoints
- Suggestion: Minor naming inconsistencies, missing versioning strategy

#### T2.10 — Data Model (A/D/DI, Weight: 5)

**Checks:**
- Missing schemas: data flowing through the system without validation
- Schema drift: migration files out of sync with model definitions
- Missing indexes: queries on unindexed columns (check query patterns vs index definitions)
- N+1 query detection: ORM patterns that generate N+1 queries
- Migration safety: irreversible migrations, data loss risks
- Audit trail: missing created_at/updated_at, no soft delete where needed
- Missing constraints: nullable columns that should be required, missing unique constraints

**N+1 detection by ORM:**
- Sequelize/TypeORM: `.find()` in a loop, missing `include`/`relations`
- Django: accessing related objects in loops without `select_related`/`prefetch_related`
- Entity Framework: lazy loading in loops without `.Include()`
- Prisma: nested reads without explicit `include`
- SQLAlchemy: accessing lazy-loaded relationships in loops

**Schema drift detection:**
- Compare migration files (ordered by timestamp) with current model definitions
- Check for columns in migrations not reflected in models and vice versa
- Look for manual SQL in migrations that bypass the ORM

**What to grep/look for:**
- Model definitions vs migration files
- `.find()`, `.query()` inside `for`/`forEach`/`map` loops
- Missing `@Index`, `db_index=True`, `[Index]` decorators
- `nullable: true` on fields that should be required

**Severity guidance:**
- Critical: Schema drift causing runtime errors, missing constraints on financial data
- Warning: N+1 queries on high-traffic paths, missing indexes on frequently queried columns
- Suggestion: Missing audit columns, minor schema inconsistencies

#### T2.11 — Type System (ALL, Weight: 5)

**Checks:**
- `any` proliferation: excessive use of `any` (TS), `object` (C#), `Any` (Python), `interface{}` (Go)
- Missing return type annotations on public functions
- Generic usage: missing generics where type safety would prevent bugs
- Implicit type conversions: coercion bugs, `==` vs `===`
- Untyped external boundaries: API responses, config, environment variables without type validation
- Null safety: nullable types without null checks, optional chaining gaps

**`any` proliferation metrics:**
- Count `any`/`unknown` usage across the codebase
- Distinguish intentional `any` (e.g., generic middleware) from lazy `any` (avoiding proper typing)
- Flag files with >5 `any` annotations as hotspots

**What to grep/look for:**
- `: any`, `as any`, `<any>` in TypeScript
- Missing type hints in Python (`def foo(x, y):` without annotations)
- `interface{}` / `any` in Go
- `dynamic` in C#, raw types in Java
- `!` (non-null assertion) usage frequency

**Severity guidance:**
- Warning: `any` on public API boundaries, missing null checks causing runtime errors
- Suggestion: Internal `any` usage, missing return types on private functions

### Tier 3: Infrastructure

#### T3.12 — Dependency (ALL, Weight: 6)

**Checks:**
- Outdated major versions: dependencies >1 major version behind
- Abandoned packages: no commits or releases in >2 years
- Unpinned versions: ranges that could introduce breaking changes
- Duplicate dependencies: same package at multiple versions
- Unnecessary dependencies: packages that could be replaced with stdlib
- License compatibility: GPL dependencies in proprietary code, license conflicts
- Security advisories: known CVEs (run audit tools)

**Abandoned package detection:**
- Check last publish date in registry (npm: `npm view <pkg> time`, PyPI: release dates)
- Check GitHub activity: last commit, open issues ratio, maintainer count
- Flag packages with no activity >2 years as risk

**What to grep/look for:**
- `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `*.csproj`
- Version ranges: `^`, `~`, `>=`, `*` (prefer exact pins)
- `npm ls --all` / `pip list --outdated` / `cargo outdated`
- LICENSE files in node_modules or dependency metadata

**Severity guidance:**
- Critical: Dependencies with known exploitable CVEs
- Warning: Abandoned packages in critical paths, >2 major versions behind, license conflicts
- Suggestion: Minor version lag, loose version ranges

#### T3.13 — Build/CI (ALL, Weight: 5)

**Checks:**
- Missing CI pipeline: no GitHub Actions, GitLab CI, Jenkins, etc.
- Incomplete pipeline: missing lint, test, build, or deploy stages
- No linting in CI: lint runs locally but not enforced in CI
- Hardcoded values in CI: secrets, URLs, versions in workflow files
- No caching: CI rebuilds everything from scratch each run
- No branch protection: missing required reviews, status checks, or merge restrictions
- CI duration: pipelines taking >15 minutes (optimization opportunity)

**What to grep/look for:**
- `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`
- Workflow steps: check for lint, test, build stages
- `actions/cache`, `cache:` directives
- Branch protection rules (check via `gh api`)
- Hardcoded URLs, versions, or credentials in CI files

**Severity guidance:**
- Warning: No CI pipeline, missing test stage, no branch protection
- Suggestion: Missing caching, CI duration optimization, minor pipeline gaps

#### T3.14 — Config (ALL, Weight: 4)

**Checks:**
- Hardcoded configuration: URLs, ports, feature flags embedded in source code
- No environment separation: same config for dev/staging/prod
- Secrets committed: `.env` files in git, credentials in config files
- No config validation: missing schema/type validation on startup
- `.env.example` drift: `.env.example` doesn't match actual required variables

**`.env.example` drift detection:**
- Compare variables in `.env.example` with variables actually referenced in code (`process.env.X`, `os.environ`, `env::var`)
- Flag variables in code but missing from `.env.example`
- Flag variables in `.env.example` but never referenced in code

**What to grep/look for:**
- `process.env`, `os.environ`, `env::var`, `Environment.GetEnvironmentVariable`
- `.env`, `.env.local`, `.env.production` in `.gitignore`
- Config files with environment-specific values hardcoded
- Startup validation: Joi/Zod/Pydantic config schemas

**Severity guidance:**
- Critical: Secrets committed to git
- Warning: No env separation, missing config validation, significant .env.example drift
- Suggestion: Minor hardcoded values, cosmetic config issues

#### T3.15 — Deployment (W/A/DI, Weight: 4)

**Checks:**
- No containerization where expected (web/API projects)
- Dockerfile issues: large images, no multi-stage, running as root
- No health checks: missing liveness/readiness probes
- No graceful shutdown: missing SIGTERM handling, connection draining
- No Infrastructure as Code: manual provisioning
- No rollback strategy: missing blue-green, canary, or rollback procedures
- Hardcoded infrastructure: environment-specific values in deployment configs

**Health check validation:**
- Check for `/health`, `/healthz`, `/ready` endpoints
- Verify health checks test actual dependencies (DB, cache, external services)
- Check K8s manifests for `livenessProbe` and `readinessProbe`

**Graceful shutdown verification:**
- Check for SIGTERM/SIGINT handlers
- Verify in-flight request completion before exit
- Check for connection pool draining, queue consumer stop

**What to grep/look for:**
- `Dockerfile`, `docker-compose.yml`, K8s manifests
- `HEALTHCHECK`, `livenessProbe`, `readinessProbe`
- `process.on('SIGTERM')`, `signal.signal(signal.SIGTERM)`, `Runtime.getRuntime().addShutdownHook`
- Multi-stage builds: `FROM ... AS build` patterns

**Severity guidance:**
- Warning: No health checks on production services, no graceful shutdown, running as root
- Suggestion: Image size optimization, missing IaC for non-critical infra

### Tier 4: Quality

#### T4.16 — Testing (ALL, Weight: 7)

**Surface-level assessment only.** For deep test analysis, use `/ai-assist-test-audit`.

**This dimension checks:**
- Test infrastructure: test runner configured and working
- Coverage gaps: critical paths without test coverage
- Assertion quality: meaningful assertions vs. "it doesn't crash"
- Test isolation: tests depending on external state or execution order
- Flaky tests: timing-dependent, network-dependent tests
- Error path coverage: error conditions tested, not just happy paths

**What to grep/look for:**
- Test directories and files: `__tests__/`, `*.test.*`, `*.spec.*`, `test_*.py`, `*_test.go`
- Test runner config: `jest.config`, `pytest.ini`, `vitest.config`
- Coverage config: `--coverage`, `.nycrc`, `coverage` in CI
- Assertion patterns: `expect()`, `assert`, `should`
- Test count vs source file count ratio

**Severity guidance:**
- Warning: No test infrastructure, critical business logic untested, flaky tests in CI
- Suggestion: Missing edge case tests, low coverage in non-critical areas

#### T4.17 — Documentation (ALL, Weight: 3)

**Checks:**
- Missing or stale README: no setup instructions, outdated information
- No API documentation: public APIs without endpoint docs
- No architecture docs: complex system with no overview
- Undocumented environment variables: required env vars not listed anywhere
- Tribal knowledge: setup steps that only work with undocumented context
- Doc freshness: documentation last updated >6 months ago while code changed significantly

**Doc freshness check:**
- `git log -1 --format="%ai" -- README.md` vs recent code changes
- Compare documented setup steps with actual dependency requirements
- Check if documented API endpoints match actual route definitions

**What to grep/look for:**
- `README.md` existence and content quality
- API docs: Swagger/OpenAPI files, JSDoc/docstring coverage
- `CONTRIBUTING.md`, `ARCHITECTURE.md`, `docs/` directory
- Env var references in code vs documentation

**Severity guidance:**
- Warning: No README, critical setup steps undocumented, env vars undocumented
- Suggestion: Stale docs, missing architecture overview, incomplete API docs

#### T4.18 — Standards (ALL, Weight: 3)

**Checks:**
- No formatter configured: missing Prettier, Black, gofmt, rustfmt
- No linter configured: missing ESLint, ruff, clippy, golangci-lint
- Inconsistent formatting: mixed tabs/spaces, inconsistent quote style
- No pre-commit hooks: formatting/linting not enforced before commit
- No commit conventions: inconsistent commit message format
- EditorConfig: missing `.editorconfig` for cross-editor consistency

**EditorConfig/formatter/linter validation:**
- Check for `.editorconfig`, `.prettierrc`, `.eslintrc`, `ruff.toml`, `clippy.toml`
- Verify formatter/linter configs are not conflicting
- Check if CI runs the same lint/format checks as local development
- Verify pre-commit hooks: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`

**What to grep/look for:**
- Config files: `.editorconfig`, `.prettierrc`, `.eslintrc.*`, `ruff.toml`, `.golangci.yml`
- Pre-commit: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`
- CI steps that run lint/format
- `package.json` scripts: `lint`, `format`, `check`

**Severity guidance:**
- Warning: No linter in CI, inconsistent formatting across team
- Suggestion: Missing EditorConfig, no pre-commit hooks, minor config gaps

#### T4.19 — Compatibility (ALL, Weight: 4)

**Checks:**
- Deprecated dependencies: using packages marked deprecated by maintainers
- Framework version gaps: >1 major version behind current stable
- Language version debt: using EOL or near-EOL language runtime
- Stale shims/polyfills: polyfills for features now supported by minimum target
- Dual pattern detection: codebase mixing old and new patterns (e.g., callbacks + promises, class + functional components)
- EOL runtime detection: Node.js, Python, .NET, Java versions past end-of-life

**EOL runtime detection:**
- Check `.nvmrc`, `.python-version`, `global.json`, runtime config files
- Compare against known EOL dates for the runtime
- Flag runtimes within 6 months of EOL as warnings, past EOL as critical

**Dual-pattern detection:**
- Identify coexisting old/new patterns that indicate incomplete migration
- Examples: callbacks + async/await, class components + hooks, Options API + Composition API
- Distinguish intentional coexistence (migration in progress with plan) from neglect

**What to grep/look for:**
- Runtime version files: `.nvmrc`, `.python-version`, `global.json`, `go.mod`
- `engines` field in `package.json`
- Polyfill imports: `core-js`, `@babel/polyfill`, shimmed APIs
- Mixed patterns: `new Promise` + `async/await`, `componentDidMount` + `useEffect`

**Severity guidance:**
- Critical: EOL runtime with known security vulnerabilities
- Warning: EOL runtime, >2 major versions behind on framework, widespread dual patterns
- Suggestion: Minor version lag, isolated legacy patterns

### Tier 5: Operational

#### T5.20 — Performance (ALL, Weight: 4)

**Checks:**
- N+1 queries: database queries in loops (see also T2.10)
- No caching: repeated expensive operations without caching strategy
- Quadratic/exponential algorithms: nested loops over growing data sets
- Sync-in-async: blocking operations in async context
- Unbounded operations: operations without limits, pagination, or timeouts
- Memory leak patterns: growing collections without cleanup, event listener accumulation, closure captures

**Memory leak patterns by context:**
- JS/TS: event listeners not removed, setInterval without clearInterval, closures capturing large objects, growing Maps/Sets
- Python: circular references without weak refs, growing module-level lists, unclosed generators
- C#: event handler subscriptions without unsubscription, static collections, undisposed IDisposable
- Go: goroutine leaks (started but never stopped), growing slices in long-lived structs

**Unbounded operation detection:**
- API endpoints without pagination (returning all records)
- File processing without size limits
- Queue consumers without batch limits
- Recursive operations without depth limits

**What to grep/look for:**
- Database calls inside loops (see T2.10 N+1 patterns)
- `setTimeout`/`setInterval` without cleanup
- `addEventListener` without corresponding `removeEventListener`
- Missing `LIMIT` in SQL queries, missing pagination params
- `while(true)` or unbounded recursion without depth check

**Severity guidance:**
- Warning: N+1 on high-traffic endpoints, unbounded operations, memory leak patterns
- Suggestion: Missing caching opportunities, minor algorithmic improvements

#### T5.21 — Observability (W/A/C/DI, Weight: 3)

**Surface-level assessment only.** For deep observability analysis, use `/ai-assist-observability-audit`.

**This dimension checks:**
- Structured logging: using structured log format (JSON) vs. unstructured string concatenation
- Log levels: appropriate use of debug/info/warn/error levels
- Correlation IDs: request tracing across services (especially DI projects)
- Basic metrics: application exposes health/performance metrics

**What to grep/look for:**
- Logger imports and configuration
- `console.log` vs structured logger usage
- `correlation-id`, `request-id`, `trace-id` in middleware
- `/metrics`, Prometheus client, StatsD, OpenTelemetry imports

**Severity guidance:**
- Warning: No structured logging in production API/web service, no correlation IDs in distributed system
- Suggestion: Missing metrics endpoint, inconsistent log levels

#### T5.22 — i18n/A11y (W/M, Weight: 1)

**Checks:**
- Hardcoded user-facing strings (not using i18n library/framework)
- No i18n setup: missing translation infrastructure
- Locale assumptions: hardcoded date/number/currency formats
- Missing ARIA attributes on interactive elements
- No keyboard navigation support
- Missing alt text on images
- Semantic HTML: using `<div>` for buttons/links/headings, missing landmark elements

**WCAG 2.2 quick-check items:**
- Color contrast: text meets minimum contrast ratios (4.5:1 normal, 3:1 large)
- Focus indicators: visible focus styles on interactive elements
- Touch target size: minimum 24x24 CSS pixels (WCAG 2.2 Level AA)
- Heading hierarchy: logical heading order (h1 → h2 → h3, no skips)
- Form labels: every input has an associated label

**What to grep/look for:**
- i18n libraries: `react-intl`, `i18next`, `vue-i18n`, `gettext`, `flutter_localizations`
- Hardcoded strings in JSX/templates (not wrapped in `t()` or `<FormattedMessage>`)
- `<div onClick=`, `<span onClick=` (should be `<button>`)
- `<img` without `alt` attribute
- ARIA: `role=`, `aria-label`, `aria-describedby`

**Severity guidance:**
- Warning: No i18n in user-facing app targeting multiple locales, critical a11y barriers (no keyboard nav)
- Suggestion: Minor a11y improvements, missing ARIA on non-critical elements
