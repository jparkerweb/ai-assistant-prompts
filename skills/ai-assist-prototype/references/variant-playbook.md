# Variant playbook: how to plan, author and self-critique prototype variants

Read this before writing the variants for a prototype. It covers what makes variants worth comparing, where to find structural alternatives for a given surface, the content and quality floor, and a checklist to run before handing over.

## The division of labor

**Variants explore structure; dials explore feel.** The Deck already lets the user change fonts, colors, spacing, radius, shadows, density, mode and motion live, so a variant that differs only in those things is wasted. Each variant must disagree with the others about at least two of:

- **Layout**: where things sit (top nav vs sidebar, single column vs split, grid vs list, sticky vs scrolling).
- **Information hierarchy**: what the eye meets first and what is demoted (a table, a hero statement, a summary number, a timeline, a search box).
- **Primary affordance**: the main thing the user does here and how it is offered (a row to open, a big button, inline editing, a command bar, a wizard step).

Defaults: **3 variants**, never more than **5**. Give each a short name and a one-line **thesis** that states the bet ("Table-first: built for scanning thirty plants at once"). If you cannot write a thesis that differs from the others, the variant is not different enough.

Per-variant `tokens` in the manifest may set a default look that suits the structure (a serif for an editorial layout, more density for a ledger), but that is seasoning, not the difference.

## Archetype menus

Pick structurally different starting points from the relevant menu, then adapt them to the brief. One line each; combine or invent when the subject calls for it.

**Landing / marketing page**
- Narrative scroll: a thesis headline, then a sequence of argument sections, proof near the end.
- Product-first: the interface itself (or a live demo) is the hero; copy is secondary.
- Split hero: message left, evidence right (screenshot, numbers, testimonial), features as a compact grid.
- Editorial / long-form: reads like an article with pull quotes and generous measure; the CTA is quiet.
- Comparison-led: opens with "before / after" or "us vs the old way" and lets that carry the page.
- Pricing-forward: the plans are the hero; everything else supports the decision.

**Dashboard / home**
- KPI-first: a row of numbers with trend, then a feed of what needs attention.
- Ledger / table-first: one dense table is the page; filters and bulk actions on top.
- Feed / timeline: chronological cards, newest first; status is implied by what is recent.
- Sidebar + detail: persistent navigation of entities on the left, selected entity on the right.
- Canvas / cards: a board of cards or tiles the user rearranges, with a prominent "add".
- Attention-first: a single "what to do now" panel, everything else collapsed behind it.

**List + detail application**
- Master-detail split: list left, detail right, both always visible.
- Drill-down: a full-width list, click opens a full-width detail (breadcrumb back).
- Inspector: list in the center, a collapsible detail drawer on the right.
- Expandable rows: details unfold inline under the row.
- Search-first: a big search/filter bar, results as cards, detail in a modal.

**Settings**
- Single long form with section anchors.
- Tabbed sections, one tab visible at a time.
- Sidebar navigation of categories with a panel per category.
- Search-first: type to find the setting; defaults shown grouped below.
- Cards per topic with inline toggles and an "advanced" disclosure.

**Onboarding / wizard**
- Linear stepper: one question per step, progress on top.
- Checklist: all steps visible, completed ones tick off, any order.
- Conversational: a single column of prompts and answers that grows.
- Progressive disclosure: the product screen itself, with the next thing to do highlighted.
- Template picker: choose a starting point first, refine second.

**Forms / checkout**
- One long page with sticky summary.
- Accordion of stages (details, shipping, payment).
- Multi-step with review screen.
- Two-column: form left, order/summary right.

**Mobile screens**
- Tab bar app: bottom tabs, stack per tab.
- Feed with floating action button.
- Card stack / swipe decision.
- Full-screen steps with large targets.
- List with bottom sheet for detail.

**Single component** (table, card, navigation, modal, form field)
- Dense vs spacious, inline actions vs overflow menu, grouped vs flat, expand-in-place vs open elsewhere, empty and error states as first-class variants.

**TUI (terminal)**
- Split panes: list on the left, live preview on the right.
- Tabs: one pane at a time, tab strip on top.
- List + preview stacked: list on top, detail below.
- Dashboard widgets: a grid of boxes with one number or sparkline each.
- Wizard / prompt flow: question, answer, next.
- Command palette: a single input with results, everything else ephemeral.

## Content rules

Content is part of the design, and placeholder content hides problems.

- Use the real subject: the product's name, its real entities (plants, invoices, pull requests), realistic quantities (a list of 12, not 3) and realistic shapes (long names that wrap, a missing value, a very large number).
- No lorem ipsum. Write the copy the product would ship: plain verbs, sentence case, consistent names for the same action across a flow ("Publish" on the button, "Published" in the toast).
- Name things by what the user controls, not by how the system works (notifications, not webhook config).
- Empty states and errors are a chance to direct ("No plants yet. Add the first one from the bed you planted last.").
- When the brief lacks content, invent domain-plausible content once and reuse it across variants so the comparison is fair.

## Realism and seeding

- Before planning, look for an existing design system: `DESIGN.md` (see the `ai-assist-design-creator` skill), `tailwind.config.*`, global CSS variables, a theme file. Seed `manifest.defaults` from it (accent hue/sat/light, neutral hue, display/body fonts if they exist in the font library, radius). A prototype that already looks like the product is judged on structure, which is the point.
- Reuse the product's navigation labels, brand name and vocabulary; a prototype in a vacuum makes every variant look fine.
- Placeholder art: CSS gradients, inline SVG shapes, or small data URIs. Never remote images; they break offline and the file must stay portable.
- Keep the file light (the validator warns above 1.5 MB).

## Interaction budget

Light interactivity helps people judge a design, so include it where it clarifies the structure: tabs, hover states, opening a detail screen, toggling a filter, a modal. Rules:

- In-memory data only. No `fetch`, no storage, no backend; hardcode arrays inside the variant script.
- Use the PT bridge for screens (`PT.go`) and for reacting to dials (`PT.on('tokens', …)`). Keep scripts under ~60 lines per variant.
- Do not wire real mutations. A button that "saves" can show a toast or move an item in memory.
- Interactive states should be reachable with the keyboard (real buttons, not clickable divs).

## Quality floor

Build to this floor without announcing it:

- Responsive: check each variant at 390, 820 and 1280 with the Deck's viewport buttons. No horizontal overflow, no clipped content, touch targets at least 40px on the mobile width.
- Tokens, not literals: colors, fonts, type sizes, spacing, radius and shadows come from `var(--pt-…)` (see `references/token-contract.md`). The validator warns about literals; fix the ones that matter.
- Both modes: flip light/dark; text stays readable on every surface, accents still contrast with backgrounds.
- Focus visible (the base styles provide an outline; do not remove it), semantic elements (`nav`, `main`, `button`, `table` with headers), labels on inputs.
- Reduced motion honored (the base styles already collapse transitions; do not add JS animations that ignore it).
- Scripts error-free: the Deck status line shows variant script errors.

## Aesthetic guidance

Commit to a direction for each variant and execute it with restraint.

- Decide the look before coding: name the structure, the one signature element (a bold numeral, a colored rail, an unusual hero treatment, a distinctive empty state) and what stays quiet. One memorable thing per variant; everything around it should be disciplined.
- Typography carries personality. Pair a display and a body face deliberately and set a clear scale; the Deck can change faces later, but the hierarchy is your job.
- Structure should encode meaning: numbered sections only when order matters, dividers where content actually changes, badges only for states.
- Avoid the three generic "AI default" looks unless the brief asks for them: cream background with a high-contrast serif and a terracotta accent; near-black with a single neon accent; a broadsheet of hairlines and zero radius. They are fine choices when chosen; they are defaults when they appear regardless of subject.
- Motion only where it serves: a hover lift on clickable cards, a reveal on a detail screen. Scattered animation reads as generated.
- Match complexity to the thesis: a dense ledger needs precise alignment and tabular numerals; a calm feed needs generous measure and fewer borders.
- Take a look with fresh eyes (or a screenshot) and remove one thing before handing over.

## Self-critique checklist

Run through this before handing the prototype over:

1. Can I state each variant's thesis in one line, and are all theses different in layout, hierarchy or primary affordance?
2. Does every variant use the product's real content and vocabulary, with realistic quantities?
3. At 390 px: nothing overflows, the primary action is reachable, text is legible.
4. At 1280 px: the layout uses the width deliberately (no lonely 640 px column unless the thesis is "narrow and calm").
5. Light and dark both read well; the accent still contrasts.
6. Dials move things: change Density, Radius, Accent hue and the fonts once and watch each variant respond.
7. Screens (if any) navigate both ways and the Deck's screen tabs stay in sync.
8. No remote assets, no external scripts, validator reports zero errors and only intentional warnings.
9. Scripts are small, in-memory, and free of errors in the Deck status line.
10. Each variant has one signature element and no accidental decoration; the three generic AI looks appear only if the brief asked for them.
11. The Deck matches the scope: `manifest.dials` is set on purpose (`none` for a structure-only check, `essential` for a component, `standard` for a screen, `full` for a design exploration), custom controls are the two or three things the user will actually tune, and anything that must not move is locked with `hideControls` and fixed in `defaults`.

**When variants come out too similar**: keep the best one, and redo another with an explicit structural constraint written at the top of its template as a comment ("no cards, no grid: a single table is the page" or "sidebar navigation, detail always visible"). Two drafts that share a layout are one variant.

## Naming, saving, lifecycle

- Save to `prototypes/<slug>.html` at the project root by default (create the folder); put it next to the feature if the team already keeps design artifacts there. Keep the parts file alongside (`prototypes/<slug>.parts.html`) so the prototype can be rebuilt and iterated.
- One prototype file answers one question. Start a new file for a different surface rather than piling variants into one.
- If the team wants the exploration as a primary source, commit the prototype (and its parts) on a branch or under `prototypes/`; the winning decision gets implemented in real code, not by shipping the prototype.
- Never ship the harness or the variant markup into production. Implementation rewrites the chosen structure with the product's real components, using the exported tokens and notes as the spec.
