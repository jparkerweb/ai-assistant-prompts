# DESIGN.md Format Specification

> Part of [ai-assist-design-creator](../SKILL.md) — loaded during Step 3 (Build) and Step 4 (Validate). Contains the full token schema, valid component properties, linting rules, naming conventions, and a minimal valid example.

Source: https://github.com/google-labs-code/design.md

---

## File Structure

```
---
<YAML frontmatter: design tokens>
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
```

The YAML block is **optional** but strongly recommended — it's what makes the file machine-readable. The markdown sections provide rationale and context for agents applying the design.

---

## Token Schema

```yaml
version: alpha         # optional
name: <string>         # required: brand/system name
description: <string>  # optional

colors:
  <name>: "#RRGGBB"   # must start with # + 6 hex digits (sRGB)

typography:
  <level-name>:
    fontFamily: <string>
    fontSize: <Dimension>       # e.g. 48px, 1.5rem
    fontWeight: <number>        # 100–900 (bare number or quoted string)
    lineHeight: <Dimension|number>  # "1.5" = unitless multiplier (valid), "24px" also valid
    letterSpacing: <Dimension>  # e.g. -0.02em, 0.1em
    fontFeature: <string>       # optional: CSS font-feature-settings value
    fontVariation: <string>     # optional: CSS font-variation-settings value

rounded:
  <level>: <Dimension>  # e.g. sm: 4px, md: 8px, full: 9999px

spacing:
  <level>: <Dimension|number>  # number = unitless ratio/column count

components:
  <component-name>:
    backgroundColor: <Color|TokenRef|rgba()>
    textColor: <Color|TokenRef>
    typography: <TokenRef>      # e.g. "{typography.body-md}"
    rounded: <TokenRef>         # e.g. "{rounded.lg}"
    padding: <Dimension>
    height: <Dimension>
    width: <Dimension>
    size: <Dimension>
  <component-name-hover>:      # variants are separate entries
    backgroundColor: <...>
```

---

## Type Reference

| Type | Format | Examples |
|------|--------|---------|
| Color | `#` + 6 hex digits (sRGB) | `"#1A1C1E"`, `"#ffffff"` |
| Dimension | number + unit | `48px`, `1.5rem`, `-0.02em`, `16px` |
| Token Reference | `{path.to.token}` | `{colors.primary}`, `{rounded.lg}`, `{typography.body-md}` |
| Typography object | map of font properties | see schema above |
| Unitless number | bare number | `1.6` (line-height multiplier), `700` (font weight) |

> `rgba()` values are valid for `backgroundColor` in components (e.g., glassmorphism surfaces).

---

## Valid Component Properties

`backgroundColor` · `textColor` · `typography` · `rounded` · `padding` · `size` · `height` · `width`

Any other property is accepted with a warning by the linter.

---

## Section Order (canonical)

Sections must appear in this order when present. Sections may be omitted but must not be reordered.

| # | Heading | Aliases |
|---|---------|---------|
| 1 | Overview | Brand & Style |
| 2 | Colors | |
| 3 | Typography | |
| 4 | Layout | Layout & Spacing |
| 5 | Elevation & Depth | Elevation |
| 6 | Shapes | |
| 7 | Components | |
| 8 | Do's and Don'ts | |

---

## Linting Rules (what the CLI checks)

| Rule | Severity | Description |
|------|----------|-------------|
| `broken-ref` | error | Token refs like `{colors.primary}` that don't resolve |
| `missing-primary` | warning | Colors defined but no `primary` color exists |
| `contrast-ratio` | warning | Component bg/text pairs below WCAG AA (4.5:1) |
| `orphaned-tokens` | warning | Color tokens defined but never referenced in components |
| `token-summary` | info | Count of tokens per section |
| `missing-sections` | info | Spacing/rounded absent when other tokens exist |
| `missing-typography` | warning | Colors defined but no typography tokens |
| `section-order` | warning | Sections out of canonical order |

Run: `npx @google/design.md lint DESIGN.md`

---

## Common Naming Conventions

### Color token names (Material-style)
`primary`, `on-primary`, `primary-container`, `on-primary-container`  
`secondary`, `on-secondary`, `secondary-container`, `on-secondary-container`  
`tertiary`, `on-tertiary`, `tertiary-container`, `on-tertiary-container`  
`surface`, `on-surface`, `surface-variant`, `on-surface-variant`  
`surface-container-lowest` → `surface-container-low` → `surface-container` → `surface-container-high` → `surface-container-highest`  
`outline`, `outline-variant`, `error`, `on-error`, `background`, `on-background`

### Typography level names (common patterns)
Display: `display-lg`, `display-md`, `display-sm`  
Headline: `headline-xl`, `headline-lg`, `headline-md`, `headline-sm`  
Body: `body-lg`, `body-md`, `body-sm`  
Label: `label-lg`, `label-md`, `label-sm`, `label-caps`  
Caption: `caption`

### Component naming pattern
Base: `button-primary`, `button-secondary`, `card-standard`, `input-field`, `badge`  
Variants: `button-primary-hover`, `button-primary-active`, `card-standard-hover`

---

## Minimal valid example

```markdown
---
name: Example System
colors:
  primary: "#4F46E5"
  on-primary: "#ffffff"
  surface: "#f9fafb"
  on-surface: "#111827"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  base: 8px
  sm: 8px
  md: 16px
  lg: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "#4338ca"
---

## Overview
Clean, professional SaaS aesthetic. Indigo-anchored palette with generous whitespace and Inter typography.

## Colors
- **Primary (#4F46E5):** Indigo for all CTAs and interactive elements.
- **Surface (#f9fafb):** Light gray page background.
- **On-Surface (#111827):** Near-black for body text.

## Typography
Inter is used throughout for its neutral geometric clarity. Headlines use tight line-height for impact; body uses generous line-height for readability.

## Layout
8px base grid. Max-width 1280px with 32px outer margins. 12-column grid on desktop, fluid on mobile.

## Elevation & Depth
Flat tonal layering: white cards on gray backgrounds. Subtle `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` for card separation. No heavy shadows.

## Shapes
Uniform 8px corner radius across all interactive elements for a modern but not overly rounded feel. Pills (full) reserved for tags and badges only.

## Components
Primary buttons use indigo fill with white text. Hover state darkens to #4338ca.

## Do's and Don'ts
- **Do** use `{colors.primary}` for all primary actions — never secondary or tertiary
- **Don't** use pure black (#000000) for text — use `{colors.on-surface}`
- **Do** maintain 8px spacing rhythm for all internal component spacing
```
