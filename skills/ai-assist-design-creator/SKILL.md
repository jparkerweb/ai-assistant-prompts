---
name: ai-assist-design-creator
description: "Reverse-engineer a website's visual design system from a URL and produce a fully spec-compliant DESIGN.md file (https://github.com/google-labs-code/design.md). The output includes both machine-readable YAML design tokens (colors, typography, spacing, rounded corners, components) and human-readable markdown rationale sections (Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts). Use this skill whenever the user wants to generate a DESIGN.md, create a design system file from a website, capture a site's visual identity, extract design tokens, build a design spec from a URL, clone a site's look and feel, or scaffold a DESIGN.md from scratch. Also triggers on: 'design system from URL', 'generate DESIGN.md', 'extract colors from site', 'what are this site's design tokens', 'capture design from website'."
argument-hint: "[URL of the site to reverse-engineer, or leave blank to be prompted]"
---

# DESIGN.md Creator

Reverse-engineer a website's visual design system and produce a fully spec-compliant `DESIGN.md` file following the [google-labs-code/design.md](https://github.com/google-labs-code/design.md) format.

## What this produces

A `DESIGN.md` file with two layers:
1. **YAML frontmatter** — machine-readable design tokens: colors, typography, spacing, rounded corners, components
2. **Markdown body** — human-readable rationale for each design decision, in 8 canonical sections

The output is ready for agents to consume immediately — no post-processing needed.

## Step 1: Get the URL

If the user provided a URL via `$ARGUMENTS`, use it. Otherwise ask:

> What website should I reverse-engineer? Provide the URL and I'll generate a DESIGN.md from its visual design.
>
> Optionally, also tell me:
> - Where to save the file (default: `DESIGN.md` in the current directory)
> - Whether this is a dark-mode or light-mode site (I'll detect this automatically if you don't know)
> - Any specific components you want captured (buttons, cards, inputs, nav, etc.)

Wait for the URL before proceeding.

## Step 2: Fetch and analyze the site

Fetch the page and all significant visual signals:

1. **Fetch the main URL** — use whichever method your agent environment supports:
   - **`curl`** (works in any agent with shell access): `curl -sL --max-time 15 -A "Mozilla/5.0" "<URL>"` — captures raw HTML including `<style>` blocks and inline CSS
   - **`webfetch` tool** (if your agent provides it natively): use it directly for cleaner content extraction
   - If the initial fetch returns no CSS (JS-heavy SPA), also fetch the page's linked `.css` files: extract `<link rel="stylesheet" href="...">` URLs from the HTML, resolve each href to an absolute URL using the page's final URL after redirects (e.g., `/assets/app.css` → `https://example.com/assets/app.css`, `//cdn.example.com/app.css` → `https://cdn.example.com/app.css`), de-duplicate, then `curl` each one
2. **Identify key sub-pages** — if the site has a component library, style guide, or "About" page, fetch those too (up to 2–3 additional pages) to improve coverage
3. **Look for existing design system artifacts** — check for `/design-tokens.json`, `/tokens.json`, `tailwind.config.js`, or any design system links in the page source

What to extract from the fetched content:

| Signal | Where to look |
|--------|--------------|
| Brand colors | CSS variables (`--color-*`, `--primary`, etc.), inline styles, og:image colors, logo |
| Typography | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing` in CSS |
| Spacing scale | `--spacing-*`, padding/margin patterns, grid gutter values |
| Corner radii | `border-radius` values across buttons, cards, inputs |
| Elevation | `box-shadow`, `backdrop-filter`, `z-index` layering patterns |
| Component styles | Button, card, input, nav, badge styles from class names or CSS |
| Design personality | Logo, imagery, copy tone, overall layout density |

> **Note:** You're inferring from observed CSS/HTML. Be honest about what you can directly observe vs. what you're inferring from visual patterns. Dark-mode sites typically have low-luminance surface colors and high-contrast text; light-mode sites are the inverse. When you can't determine an exact hex value, make a design-coherent choice and note it in the prose.

## Step 3: Build the DESIGN.md

Read `references/design-md-spec.md` for the complete token schema and section rules.

### Token extraction rules

**Colors** — Extract the site's full color role set. At minimum:
- `primary` — main brand/action color
- `secondary` — supporting accent or secondary brand color  
- `neutral` / `surface` — background/surface color
- `on-primary`, `on-surface` — text colors on those surfaces
- Include semantic colors if detectable: `error`, `warning`, `success`
- Name tokens semantically (`primary`, `secondary`, `tertiary`, `neutral`) or use Material Design role names if the site uses a Material-style palette

**Typography** — Identify the main type scale. Typically 5–12 levels:
- Display/headline levels (large, impactful headings)
- Body levels (body-lg, body-md, body-sm)
- Label levels (captions, tags, small UI text)
- Include all detectable properties: `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`
- Dimensions must include units: `px`, `em`, or `rem`

**Spacing** — Extract the spacing scale. Common pattern: a base unit (4px or 8px) with named steps: `xs`, `sm`, `md`, `lg`, `xl`. Also include layout-specific values like `gutter`, `margin`, `container-max`.

**Rounded** — Extract corner radius values. Name them: `sm`, `DEFAULT`, `md`, `lg`, `xl`, `full` (for pill shapes).

**Components** — Capture 4–8 key components. For each, include as many valid properties as observed: `backgroundColor`, `textColor`, `typography` (token ref), `rounded` (token ref), `padding`, `height`, `width`. Use token references like `{colors.primary}` instead of hardcoded hex values wherever possible. Include hover variants as separate entries (e.g., `button-primary-hover`).

### Sections to write

Write all 8 sections in canonical order. Each section combines YAML tokens (defined in frontmatter) with prose rationale. For sections where tokens aren't applicable (Elevation, Shapes, Do's and Don'ts), write prose only.

1. **Overview** — Brand personality, target audience, emotional tone, design style (flat, glassmorphism, neumorphism, material, etc.), key design decisions. 2–4 sentences that give a coherent aesthetic picture.

2. **Colors** — Describe the role of each color palette entry. What does each color *mean* in the design? When is it used? Reference the token names.

3. **Typography** — Describe the font strategy: which typefaces, why they were chosen, how the scale is organized, any special treatments (tight tracking on headlines, text-shadow on dark backgrounds, etc.).

4. **Layout** — Grid system (fluid, fixed, 12-column?), spacing philosophy (8px grid, dense vs. airy), max-width, container strategy.

5. **Elevation & Depth** — How visual hierarchy is communicated: shadows, tonal layers, glassmorphism, borders, z-axis layering. If flat design, describe what replaces shadows.

6. **Shapes** — Corner radius philosophy: sharp/technical, soft/organic, fully rounded pills, mixed. Which components use which radius.

7. **Components** — Walk through the key component tokens and explain the design rationale for each group (action elements, containers, inputs, typography application).

8. **Do's and Don'ts** — 3–5 concrete rules for maintaining design consistency. Things like "always use `{colors.primary}` for CTAs, never `{colors.secondary}`" or "never use pure black (#000000) for text — use `on-surface`".

### YAML frontmatter structure

```yaml
---
name: <Site/Brand Name>
description: <optional one-line brand tagline>
colors:
  primary: "#XXXXXX"
  ...
typography:
  headline-lg:
    fontFamily: <font>
    fontSize: <Npx>
    fontWeight: <number>
    lineHeight: <1.2 or 24px>
    letterSpacing: <-0.02em or 1px>
  ...
rounded:
  sm: <Npx or Nrem>
  ...
spacing:
  base: <Npx>
  ...
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    ...
  ...
---
```

## Step 4: Validate and save

After generating the content:

1. **Self-check** these things before writing the file:
   - All token references (`{path.to.token}`) resolve to a defined token
   - Color values start with `#` followed by 6 hex digits
   - All dimension values have units (`px`, `em`, `rem`) — no bare numbers except: font weights, unitless line-height multipliers, and `spacing` values (which may be unitless ratios or column counts per the spec)
   - Section order matches the canonical order (Overview → Colors → Typography → Layout → Elevation & Depth → Shapes → Components → Do's and Don'ts)
   - Component properties: canonical keys (`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`) pass the linter silently; unknown keys are accepted by the spec but will produce a linter warning — flag them in the confidence notes

2. **Check for an existing file** at the target path before writing:
   - If `DESIGN.md` (or the user-specified path) already exists, warn the user: "A `DESIGN.md` already exists at this path. Overwrite, save as `DESIGN-<site-name>.md`, or cancel?" Wait for their choice before writing.
   - If no file exists, proceed directly.

3. **Save the file** as `DESIGN.md` in the current working directory (or the path the user specified).

4. **Tell the user** what was generated:

> `DESIGN.md` saved.
>
> **Design system:** [Name]  
> **Style:** [e.g., Glassmorphism / Flat / Material / Custom]  
> **Colors:** [N tokens] — [brief palette description]  
> **Typography:** [N levels] — [font family names]  
> **Components:** [list of captured components]
>
> **Confidence notes:**
> - [Any values that were inferred rather than directly observed]
> - [Any sections that had limited CSS data and required design judgment]
>
> Want me to refine any section, add more components, or lint the file with `npx @google/design.md lint DESIGN.md`?

## Recovery

| Situation | How to handle |
|-----------|--------------|
| `webfetch` not available | Fall back to `curl -sL --max-time 15 -A "Mozilla/5.0" "<URL>"` — available in any agent with shell access |
| Site blocks fetch (403/429) | Ask user to paste relevant CSS, screenshot, or describe the design manually |
| JS-heavy SPA with no inline CSS | Fetch the JS bundle URL if visible; also try fetching linked `.css` files directly; ask user for computed styles or a screenshot as a last resort |
| Can't determine exact hex values | Make design-coherent color choices; note them as "inferred" in prose and confidence notes |
| Site uses a known design system (Material, Ant, Chakra, Tailwind UI) | Note this in the Overview — tokens will align with that system's defaults |
| No typography found | Default to system fonts (Inter, -apple-system) and note it |
| User wants lint | Run `npx @google/design.md lint DESIGN.md` and surface any errors/warnings |

## Rules

- Never fabricate specific brand hex values with false certainty — if you inferred a color, say so
- All token cross-references must point to defined tokens — no dangling refs
- Dimensions must always have units (exception: unitless `lineHeight` multipliers like `1.5` are valid)
- The YAML frontmatter is normative; prose is explanatory context — don't contradict one with the other
- Output goes in the current working directory as `DESIGN.md` unless the user specifies otherwise
- If a section has genuinely no applicable content (e.g., a flat design with no elevation), include it briefly and explain: "This design system uses flat tonal layering rather than shadows — see Colors for the tonal surface stack"
