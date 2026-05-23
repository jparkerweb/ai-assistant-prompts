# Analytical Frameworks

> Part of [ai-assist-discovery](../SKILL.md) — loaded during Step 1.

## Framework Definitions

### Decision Matrix

Weighted criteria x alternatives scoring.

- **Structure:** Criteria rows, alternative columns. Each cell: score (1-5).
- **Weight rationale:** Assign weights (1-5) to each criterion with a brief justification for why that weight.
- **Scoring rubric:** 1 = Does not meet / absent. 2 = Partially meets / significant gaps. 3 = Meets basic requirements. 4 = Exceeds requirements. 5 = Best-in-class / gold standard.
- **Sensitivity analysis:** After scoring, test whether changing the highest-weighted criterion's weight by +/- 1 changes the winner. If yes, flag the decision as weight-sensitive.
- **When to use:** Comparing 2+ alternatives with quantifiable criteria. Standard+ depth.
- **Common pitfall:** Weighting criteria after seeing results (confirmation bias). Set weights before scoring.

### SWOT

Strengths, Weaknesses, Opportunities, Threats — 2x2 grid.

- **Structure:** 3-5 items per quadrant. Each item: one sentence + evidence source.
- **Quadrant prompts by target type:**
  - Technology: S=competitive advantages, W=limitations/gaps, O=ecosystem growth/adoption trends, T=competitors/deprecation risks
  - Domain: S=established practices, W=industry pain points, O=emerging trends, T=regulatory/disruption risks
  - Codebase: S=well-designed areas, W=tech debt hotspots, O=improvement potential, T=scaling/maintenance risks
- **"So what" action items:** Each finding gets a one-line action: leverage (S), address (W), pursue (O), mitigate (T).
- **When to use:** Holistic assessment of a single entity. Standard+ depth for technology and domain targets.
- **Common pitfall:** Listing observations without implications. Every SWOT item should drive a decision or action.

### Risk Register

Structured risk tracking with probability and impact assessment.

- **Columns:** ID, Description, Probability (H/M/L), Impact (H/M/L), Mitigation, Owner, Status
- **Probability criteria:** H = >70% likely, M = 30-70%, L = <30%. Base on evidence, not gut feel.
- **Impact criteria:** H = project failure / >$100K / data loss, M = significant delay / rework, L = minor inconvenience / workaround exists.
- **When to use:** Feasibility assessments, migration paths, major decisions. Standard+ depth.
- **Common pitfall:** Listing only obvious risks. Probe for second-order effects and dependencies between risks.

### ADR (Architecture Decision Record)

Structured decision documentation.

- **Sections:** Status (proposed/accepted/deprecated/superseded), Context (forces at play — constraints, requirements, goals), Decision (what we decided and why), Consequences (positive, negative, and neutral trade-offs — be honest about downsides).
- **When to use:** Architecture decisions, "build vs buy", technology selection. Deep depth.
- **Common pitfall:** Omitting rejected alternatives. Document what was considered and why it was rejected.

### PESTLE

Political, Economic, Social, Technological, Legal, Environmental analysis.

- **Structure:** One row per factor. Columns: Factor, Current State, Trend Direction (up/stable/down), Relevance to Decision.
- **When to use:** Domain research, market analysis, long-term strategic decisions. Deep depth.
- **Common pitfall:** Treating all factors as equally relevant. Focus on factors that actually influence the decision.

### TCO (Total Cost of Ownership)

Comprehensive cost analysis across the full lifecycle.

- **Cost categories:** Licensing, infrastructure, integration effort, training, ongoing maintenance, opportunity cost.
- **Projections:** Present 1-year and 3-year totals. Flag assumptions.
- **When to use:** Vendor evaluation, technology comparison, build vs buy. Standard+ depth.
- **Common pitfall:** Ignoring hidden costs (migration, training, integration). Include the full adoption lifecycle.

### Comparison Table

Feature-level comparison across alternatives.

- **Structure:** Criteria rows x alternative columns. Cells: Full support / Partial / None / Unknown.
- **Source required:** Cite the source for each cell (docs page, test result, community report).
- **When to use:** Side-by-side technology or tool comparison. All depths.
- **Common pitfall:** Comparing marketing claims instead of verified capabilities.

## Target-Type to Framework Mapping

| Target | Standard Depth | Deep Depth (adds) |
|--------|---------------|-------------------|
| Codebase | Architecture classification, Dependency health | Tech debt heatmap, API surface audit, DORA signals |
| Technology | Decision matrix, Comparison table | SWOT, TCO, Vendor lock-in, Community health score |
| Domain | Stakeholder map, Current state summary | PESTLE, Maturity model, Trend timeline |
| Idea/Feasibility | Risk register, Cost-benefit sketch | Build vs buy, ADR, Resource requirements, Reversibility |
| Data | Quality assessment, Schema summary | Lineage map, Privacy classification, Compliance matrix |

**Variant frameworks:** Vendor Eval adds TCO + Comparison + lock-in. Migration adds Risk register + current-vs-target + checklist. Competitive adds Comparison + gap analysis. Architecture Decision adds ADR + trade-off matrix.

## Depth Levels

| Level | Sources | Frameworks | Output Length | Use When |
|-------|---------|-----------|--------------|----------|
| scan | 3-5 | Skip | ~500-800 words | Quick orientation, landscape overview |
| standard (default) | 5-10 | 2-3 key frameworks with full outputs | ~1500-3000 words | Informed decision-making, technology evaluation |
| deep | 10+ | All applicable, with triangulation | ~3000-5000 words | Major decisions, vendor selection, architecture changes |

## Variant Detection Rules

Detect variants from user input and adapt accordingly:

| Pattern | Variant | Adds to Standard Workflow |
|---------|---------|--------------------------|
| Technology + pricing/SLA | **Vendor Evaluation** | TCO analysis, lock-in assessment, contract review |
| Idea + migration steps | **Migration Path** | Current-state audit, rollback strategy, migration checklist |
| Technology + "our system vs products" | **Competitive Analysis** | Feature matrix, gap analysis, market positioning |
| Codebase + "rewrite/refactor/replace" | **Architecture Decision** | ADR, trade-off matrix, reversibility assessment |

**How variant detection modifies workflow:**
- Framework selection: variant-specific frameworks are added to the standard set, not replacing
- Output structure: variant sections appear after the standard template sections
- Depth override: variants may justify upgrading from scan to standard (flag this to user)
