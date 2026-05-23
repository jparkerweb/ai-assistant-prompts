# Test Audit Dimensions

> Part of [ai-assist-test-audit](../SKILL.md) — loaded during Step 3.

## Depth Mapping

| # | Dimension | Q | S | D | Applies |
|---|-----------|---|---|---|---------|
| 1 | Coverage | X | X | X | ALL |
| 2 | Types | - | X | X | ALL |
| 3 | Quality | X | X | X | ALL |
| 4 | Mocks | - | X | X | ALL |
| 5 | Data | - | X | X | ALL |
| 6 | Architecture | - | X | X | ALL |
| 7 | CI/CD | - | X | X | ALL |
| 8 | Performance | - | X | X | ALL |
| 9 | Documentation | - | - | X | ALL |
| 10 | Mutation | - | - | X | ALL |
| 11 | Contract | - | X | X | API/DIST |
| 12 | Accessibility | - | X | X | WEB |
| 13 | Error Paths | - | X | X | ALL |
| 14 | Edge Cases | X | X | X | ALL |
| 15 | Maintenance | - | X | X | ALL |
| 16 | Modern | - | X | X | ALL |
| | **Total** | **3** | **12-14** | **16** | |

### Depth Selection Guidance

- **Quick:** CI gating, fast feedback, time-sensitive reviews. Coverage + Quality + Edge Cases only (dims 1, 3, 14).
- **Standard (default):** Sprint-level audit, PR reviews, quarterly health checks. All dimensions except Documentation and Mutation (dims 1-8, 11 if API/DIST, 12 if WEB, 13-16).
- **Deep:** Major releases, annual audits, new team onboarding. All 16 dimensions including mutation analysis and documentation assessment.

## Project Type Applicability

- **ALL:** Dimensions 1-10, 13-16 (14 dimensions). Apply to every project regardless of type.
- **API/DIST only:** Dimension 11 (Contract testing). Activate for API services and distributed systems.
- **WEB only:** Dimension 12 (Accessibility testing). Activate for web applications with UI.
- **N/A handling:** When a dimension is not applicable, redistribute its weight proportionally among remaining active dimensions.

## Per-Dimension Check Definitions

Audit each activated dimension using the checks below. For each finding, cite the file:line and dimension number.

### 1 — Coverage (ALL, Q/S/D, Weight: 9)

**Checks:**
- Line, branch, and function coverage percentages from actual test execution
- **Branch coverage emphasis:** Prioritize branch coverage over line coverage — line coverage can be misleading when branches are not exercised
- Uncovered files and modules — identify files with 0% coverage
- **Per-module coverage disparity:** Flag modules where coverage varies by >30% (e.g., `auth/` at 90% but `payments/` at 20%)
- Threshold enforcement in CI — verify coverage gates exist and are enforced
- **Coverage ratcheting:** Recommend ratcheting (coverage cannot decrease) if not already configured
- **Exclusion pattern audit:** Review coverage exclusion configs (istanbul ignore, /* c8 ignore */, [ExcludeFromCodeCoverage]) — flag exclusions hiding testable code

**Severity guidance:**
- Critical: No coverage measurement at all
- Warning: Coverage below thresholds, significant module disparity, excessive exclusions
- Suggestion: Missing ratcheting, branch coverage not tracked separately

### 2 — Types (ALL, S/D, Weight: 7)

**Checks:**
- **Test type inventory:** Scan file names, directory structure, and configs to identify test types present (unit, integration, E2E, smoke, contract, visual regression, accessibility, performance, security, property-based)
- **Test pyramid assessment:** Calculate unit:integration:E2E ratio. Recommended ratio is 70:20:10
- **Inverted pyramid detection:** Flag when E2E or integration tests outnumber unit tests — indicates fragile, slow suites
- Matrix of present vs missing types with priority recommendations
- Identify types that should exist based on project architecture (e.g., API project without contract tests)

**Severity guidance:**
- Warning: Inverted test pyramid, missing critical test type for project kind
- Suggestion: Additional test types that would add value

### 3 — Quality (ALL, Q/S/D, Weight: 14)

Highest-weighted dimension. Test quality directly determines test suite value.

**Checks:**
- **Assertion density:** Flag tests with zero assertions — these provide false coverage without verification. Count average assertions per test
- **AAA structure:** Verify Arrange-Act-Assert (or Given-When-Then) pattern usage. Flag tests mixing arrangement and assertion
- **Determinism:** Grep for `Date.now`, `Math.random`, `setTimeout`, `new Date()`, `System.currentTimeMillis()`, `DateTime.Now` used without mocking/freezing. Each is a flakiness source
- **Flakiness detection:** Grep for `.skip`, `.only`, `@Ignore`, `@Disabled`, `[Ignore]`, `[Skip]`, `pytest.mark.skip`, `pytest.mark.skipif`, `retry`, `flaky`, `xit`, `xdescribe`, `pending`. Flag if >5% of tests are skipped (Warning severity)
- **Independence:** Check for shared mutable state between tests (module-level variables mutated in tests, `beforeAll` setting state consumed across tests)
- Test-to-implementation coupling — tests asserting on internal state rather than behavior
- Naming — tests should describe behavior, not repeat method names

**Severity guidance:**
- Critical: Zero-assertion tests (false green), non-deterministic tests without mocking
- Warning: >5% skipped tests, shared mutable state, high coupling
- Suggestion: Naming improvements, AAA structure refinement

### 4 — Mocks (ALL, S/D, Weight: 6)

**Checks:**
- **Mock-to-test ratio:** If >50% of test code is mock setup, the test is testing mocks, not code (smell)
- **Mock drift detection:** Verify mocks match current interfaces — stale mocks that don't reflect actual signatures produce false greens
- **Boundary mocking:** Mocks should be at system boundaries (HTTP, DB, filesystem), not on internal functions
- **Global pollution:** Check for mocks that leak between tests (missing `restore`/`reset`/`clearAllMocks`/`mockReset`)
- Spy overuse — using spies for verification instead of testing observable behavior
- DI patterns — are dependencies injectable for testing?

**Severity guidance:**
- Critical: Mock drift causing false greens
- Warning: Over-mocking (>50% setup), global pollution, boundary violations
- Suggestion: DI improvements, spy reduction

### 5 — Data (ALL, S/D, Weight: 5)

**Checks:**
- **Factory/builder assessment:** Check for test data factories (factory_bot, fishery, AutoFixture, Bogus) vs inline object construction
- **Inline data duplication:** Same test data setup repeated in 5+ files — indicates need for shared factories
- **Test DB strategy:** Evaluate approach — testcontainers, transaction rollback, in-memory DB, or none. Recommend testcontainers for integration tests if not present
- **Sensitive data in fixtures:** Grep for real emails, phone numbers, SSNs, API keys in test fixtures and seed data
- Snapshot data freshness — snapshots reflecting outdated schemas or formats

**Severity guidance:**
- Critical: Sensitive data in test fixtures
- Warning: No test DB strategy for integration tests, excessive inline duplication
- Suggestion: Factory adoption, snapshot refresh

### 6 — Architecture (ALL, S/D, Weight: 5)

**Checks:**
- **Page object model (WEB):** Web projects should use page objects or component abstractions, not raw selectors in tests
- **Custom matcher inventory:** Check for project-specific matchers/assertions that reduce duplication
- **Test utility duplication:** Same helper logic duplicated in multiple test files (>3 files = extract to shared utility)
- **File organization:** Tests colocated with source vs separate `__tests__`/`test/` directory. Consistency matters more than choice
- Test configuration — shared setup, global fixtures, test environment config

**Severity guidance:**
- Warning: Significant utility duplication, inconsistent organization
- Suggestion: Page object adoption, custom matcher opportunities

### 7 — CI/CD (ALL, S/D, Weight: 9)

**Checks:**
- **CI execution verification:** Are tests actually blocking PRs? Check for required status checks, branch protection rules
- **Parallelism:** Is the test suite parallelized in CI? Check for `--parallel`, `--shard`, split configs
- **Flaky quarantine process:** Is there a mechanism to quarantine flaky tests without skipping them?
- **Test result reporting:** Are results posted as PR comments? Coverage diff reported?
- **Required status checks:** Verify test jobs are required, not optional
- Caching — test dependency caching for faster CI runs
- Coverage reporting integration (Codecov, Coveralls, SonarQube)

**Severity guidance:**
- Critical: Tests not blocking PRs (ignored CI failures)
- Warning: No parallelism, no coverage reporting, no flaky quarantine
- Suggestion: Caching optimization, PR comment integration

### 8 — Performance (ALL, S/D, Weight: 5)

**Checks:**
- **Per-test duration:** Flag unit tests >1s and integration tests >5s
- **Suite benchmarks:** Unit suite should complete <30s, integration <5min, full suite <15min
- **Setup overhead:** If >50% of test time is in `beforeAll`/`beforeEach`/`SetUp`/`OneTimeSetUp`, investigate shared setup opportunities
- Serial execution bottlenecks — tests that could run in parallel but don't
- Resource cleanup — tests not releasing connections, file handles, or processes

**Severity guidance:**
- Warning: Suite exceeding benchmarks, excessive setup overhead
- Suggestion: Parallelization opportunities, setup optimization

### 9 — Documentation (ALL, D, Weight: 3)

**Checks:**
- **Test naming conventions:** Tests should describe behavior ("should return 404 when user not found"), not implementation ("test getUserById method")
- **Describe nesting evaluation:** Assess grouping quality — logical hierarchy vs flat list vs excessive nesting
- **BDD patterns:** Evaluate Given/When/Then or Arrange/Act/Assert consistency across suite
- Test plan documentation — do tests trace to requirements or acceptance criteria?

**Severity guidance:**
- Suggestion: Naming improvements, documentation additions, BDD adoption

### 10 — Mutation (ALL, D, Weight: 5)

**Checks:**
- **Tool presence:** Check for mutation testing tools — Stryker (JS/TS), mutmut (Python), cargo-mutants (Rust), pitest (Java/Kotlin)
- **Score interpretation:** >80% mutation score = good, 60-80% = adequate, <60% = weak test effectiveness
- **Surviving mutants on critical paths:** Flag surviving mutations in authentication, payment, data validation, and other critical modules
- Recommend tool installation if absent — mutation testing reveals assertion quality better than coverage

**Severity guidance:**
- Warning: <60% mutation score on critical paths
- Suggestion: Tool adoption if absent, score improvement targets

### 11 — Contract (API/DIST, S/D, Weight: 5)

N/A for non-API/DIST projects — redistribute weight proportionally.

**Checks:**
- **Consumer-driven contracts:** Check for Pact or similar consumer-driven contract testing
- **Schema validation:** OpenAPI/Swagger or AsyncAPI schema validation in tests
- **Contract versioning:** Are contracts versioned? Breaking change detection?
- Event contracts — async message contracts for event-driven systems
- Provider verification — does the provider run consumer contract tests?

**Severity guidance:**
- Warning: API without any contract testing, schema drift between spec and implementation
- Suggestion: Pact adoption, AsyncAPI contracts for event-driven systems

### 12 — Accessibility (WEB, S/D, Weight: 5)

N/A for non-WEB projects — redistribute weight proportionally.

**Checks:**
- **axe-core integration:** Check for automated accessibility testing (jest-axe, cypress-axe, @axe-core/playwright)
- **WCAG 2.2 coverage:** Verify tests cover Level A and AA success criteria
- **Testing Library query priority:** Prefer `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId`. Flag heavy `getByTestId` usage as it bypasses accessibility verification
- Keyboard navigation testing — tab order, focus management, keyboard traps
- ARIA attribute testing — roles, labels, live regions

**Severity guidance:**
- Warning: No accessibility testing in web project, heavy getByTestId usage
- Suggestion: axe-core adoption, WCAG coverage expansion, query priority improvement

### 13 — Error Paths (ALL, S/D, Weight: 7)

**Checks:**
- **Error boundary testing (React/web):** Verify error boundaries are tested for graceful degradation
- **Exception type specificity:** Tests should assert specific exception types, not just "throws any exception"
- **Network failure simulation:** Check for tests simulating network errors, timeouts, 5xx responses
- **Timeout handling coverage:** Verify timeout scenarios are tested (request timeouts, connection timeouts, idle timeouts)
- Retry logic — test retry with backoff, max retries, circuit breakers
- Graceful degradation — test fallback behavior when dependencies fail

**Severity guidance:**
- Warning: No network failure tests, no timeout testing, generic exception assertions
- Suggestion: Error boundary tests, retry logic coverage, circuit breaker testing

### 14 — Edge Cases (ALL, Q/S/D, Weight: 5)

**Checks:**
- **Boundary value analysis:** Test with 0, 1, max-1, max, max+1 for numeric inputs. Empty string, single char, max length for strings
- **Null/undefined/empty:** Verify handling of null, undefined, empty arrays, empty objects, empty strings
- **Unicode/i18n:** Test with non-ASCII characters, RTL text, emoji, multi-byte characters
- **Concurrent access:** Test race conditions, parallel mutations, optimistic locking
- Negative testing — invalid inputs, malformed data, out-of-range values

**Severity guidance:**
- Warning: No boundary testing on critical inputs, no null handling tests
- Suggestion: Unicode coverage, concurrency testing, expanded negative tests

### 15 — Maintenance (ALL, S/D, Weight: 6)

**Checks:**
- **Skipped test debt:** Count skipped tests and determine age via `git blame`. Skipped tests >30 days old are likely dead code
- **Orphaned test files:** Test files with no corresponding source file (deleted source, test left behind)
- **Test-to-code ratio:** 1:1 to 3:1 is healthy. <1:1 suggests under-testing. >3:1 suggests over-testing or redundancy
- **Snapshot staleness:** Snapshots not updated when source changes — may be auto-accepted without review
- Commented-out tests — dead code that should be deleted or re-enabled
- Redundant tests — multiple tests verifying identical behavior

**Severity guidance:**
- Warning: >5% skipped tests, significant orphaned files, ratio outside healthy range
- Suggestion: Snapshot refresh, commented-out test cleanup, redundancy reduction

### 16 — Modern (ALL, S/D, Weight: 4)

**Checks:**
- **Testing Library best practices (WEB):** Prefer user-event over fireEvent, use screen queries, avoid container queries
- **Testcontainers adoption:** Recommend for integration tests — real databases instead of in-memory fakes
- **Snapshot testing assessment:** Evaluate snapshot usage — small focused snapshots good, large component snapshots fragile
- **Type-safe test data generation:** Check for typed factories (ts-auto-mock, @mswjs/data, AutoFixture) vs untyped object literals
- Parallel test execution — are tests designed for parallel safety?
- Modern assertion libraries — expect vs assert, fluent assertions

**Severity guidance:**
- Suggestion: Testing Library migration, testcontainers adoption, type-safe factories, snapshot reduction
