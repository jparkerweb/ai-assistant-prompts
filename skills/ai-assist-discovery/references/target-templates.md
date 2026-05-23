# Target-Type Documentation Templates

> Part of [ai-assist-discovery](../SKILL.md) — loaded during Step 4.

Use the template matching the detected target type. Each section should contain substantive findings — skip sections only if genuinely not applicable (document why).

## Codebase Template

### Exec Summary
2-3 sentences: what this codebase is, its current state, and the most important finding.

### Architecture Overview
Classify the architecture: monolith, microservices, modular monolith, hybrid. Describe service boundaries, communication patterns, data flow. Include a text-based diagram for complex architectures.

### Dependency Graph
Direct dependencies with version and purpose. Flag: outdated (>2 major versions behind), unmaintained (no commits in 12+ months), high-risk (known CVEs), duplicate (multiple libs solving the same problem). Note transitive dependency risks if detected.

### Code Quality Signals
Lint results (if linter configured), test coverage percentage, type safety (TypeScript strict mode, mypy, etc.), complexity metrics (files >500 lines, functions >50 lines), consistent code style. Source each finding from actual tool output or file inspection.

### Test Coverage & Gaps
Module-by-module coverage if measurable. Identify untested critical paths (auth, payments, data mutations). Note test types present: unit, integration, e2e, contract, performance.

### Build & Deploy
Build system, CI/CD pipeline, deployment strategy (blue-green, rolling, canary), environments, build time. Flag manual steps or missing automation.

### Documentation Assessment
What exists (README, AGENTS.md, API docs, inline comments), what's missing, accuracy of existing docs vs actual code. Flag stale documentation.

### Key Findings
Numbered list of the most important discoveries. Each with confidence tag and source.

### Recommendations (optional)
Clearly labeled as recommendations, not findings. Numbered, actionable, with rationale.

### Sources
All file paths, tool outputs, and external references used.

---

## Technology Template

### Exec Summary
2-3 sentences: what this technology is, its positioning, and the key evaluation finding.

### Technology Overview
What it is, what problem it solves, positioning in the ecosystem, brief history (origin, major versions, trajectory).

### Ecosystem & Community
GitHub stars/issues/response time, package registry downloads (npm, PyPI, NuGet), Stack Overflow tag activity, corporate backing, notable production users. Cite specific numbers with dates.

### Capabilities & Limitations
Feature matrix with evidence. Distinguish between documented capabilities and verified capabilities (tested/observed). Note limitations explicitly — what it cannot do or does poorly.

### Comparison Matrix
vs alternatives the user would likely consider. Criteria x alternatives table with Full/Partial/None/Unknown cells. Source each cell.

### Adoption & Maturity
Gartner/ThoughtWorks radar position if applicable. Notable production deployments. Version stability (breaking changes between versions). LTS policy.

### Integration Requirements
Setup complexity (trivial/moderate/significant), learning curve (hours/days/weeks), migration effort from current stack, compatibility with existing tools.

### Security Posture
CVE history (count, severity, response time), security model (sandboxing, permissions), audit results if public, dependency security.

### Compliance Considerations
Include if applicable: SOC2, HIPAA, GDPR, PCI-DSS, FedRAMP implications. Data residency, encryption at rest/in transit, audit logging.

### Key Findings
Numbered list with confidence tags and sources.

### Recommendations (optional)
Clearly labeled. Actionable with rationale.

### Sources
All URLs (with access date), documentation references (name, version, section), tool outputs.

---

## Domain Template

### Exec Summary
2-3 sentences: what this domain is, its current state, and the most important insight.

### Overview & Key Concepts
Glossary with precise definitions. Explain relationships between concepts. A reader should understand domain vocabulary after this section.

### Current State
Industry snapshot: market size, growth trajectory, key metrics. What's working, what's changing.

### Major Players
Vendors, open-source projects, standards bodies. Market share or adoption data if available. Categorize: established leaders, challengers, niche players.

### Challenges & Open Problems
Unsolved or actively debated issues. Technical limitations, process gaps, industry pain points.

### Regulatory Landscape
Applicable regulations, compliance requirements, enforcement trends. Geographic variations if relevant.

### Stakeholder Map
(standard+ depth) Who cares about this domain and why. Decision-makers, users, regulators, vendors. What each group wants.

### Trends & Projections
Where the domain is heading. Evidence for each trend (not speculation). Timeline if discernible.

### Key Findings
Numbered list with confidence tags and sources.

### Recommendations (optional)
Clearly labeled. Actionable with rationale.

### Sources
All references cited.

---

## Feasibility Template

### Exec Summary
Include a clear verdict: **Feasible** / **Not Feasible** / **Conditionally Feasible** (with conditions stated). 2-3 sentences on the reasoning.

### Concept Description
What exactly is being evaluated. Define scope boundaries — what's in and what's out.

### Technical Prerequisites
What must be true for this to work. Infrastructure, skills, dependencies, data availability. Flag any that are not currently met.

### Prior Art
Who has done this before, with what results. Open-source implementations, published case studies, conference talks. Note scale and context differences.

### Feasibility Assessment
- **Technical feasibility:** Can it be built? What's hard? What's uncertain?
- **Resource requirements:** Team size, skills needed, infrastructure
- **Timeline estimate:** Rough phases with confidence level. Flag unknowns that could blow up the timeline.

### Risk Register
(standard+ depth) See frameworks.md for format. Focus on risks specific to this feasibility question.

### Cost-Benefit Analysis
(standard+ depth) Quantify where possible. Compare to alternatives (including "do nothing").

### Build vs Buy
(if applicable) Compare building in-house vs purchasing/licensing. Include TCO for both paths.

### PoC Scope
The smallest experiment that would validate the hypothesis. What would success look like? What would failure look like? Estimated effort.

### Reversibility Assessment
What happens if we need to undo this? Data migration back, contract termination, team reskilling. Rate: fully reversible / partially reversible / irreversible.

### Key Findings
Numbered list with confidence tags and sources.

### Recommendations (optional)
Clearly labeled. Actionable with rationale.

### Sources
All references cited.

---

## Data Template

### Exec Summary
2-3 sentences: what this data source is, its quality assessment, and the key finding.

### Schema & Description
Field-level documentation. Data types, constraints, relationships. Sample values for key fields (anonymized if sensitive).

### Volume & Quality
Row counts, record freshness, null rates for key fields, consistency checks, duplicate detection. Source all metrics from actual data inspection.

### Access Patterns
Who reads this data (systems, teams), who writes to it, frequency, latency requirements. Peak load patterns if available.

### Privacy Classification
PII field identification, sensitivity levels (public/internal/confidential/restricted), handling requirements per classification. Flag fields that need masking/encryption.

### Lineage
(standard+ depth) Where does this data come from? Where does it go? Transformation steps. Upstream and downstream dependencies.

### Limitations & Gaps
Missing fields, known quality issues, coverage blind spots, temporal gaps. What questions can't be answered with this data?

### Integration Considerations
API access methods, authentication, rate limits, format compatibility (JSON/CSV/Parquet), pagination, error handling. Estimated integration effort.

### Key Findings
Numbered list with confidence tags and sources.

### Recommendations (optional)
Clearly labeled. Actionable with rationale.

### Sources
All references cited.
