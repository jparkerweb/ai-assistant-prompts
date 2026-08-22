# The handoff: what "Export to LLM" copies and how to act on it

Read this when the user pastes a block that starts with `AI-ASSIST PROTOTYPE HANDOFF v1` (or a JSON object with `"schema": "ai-assist-prototype/handoff@1"`), or when you need to explain to the user what the Deck will hand back.

## What the Deck exports

The Deck has three export buttons:

- **Export to LLM**: copies a human-readable header followed by a fenced JSON block. This is the default; the header lets a person (and you) grasp the decision in two seconds, the JSON carries everything.
- **JSON**: copies only the JSON object (same schema). Some users prefer it for tickets or for a second agent.
- **View**: opens a window with the full export selected for manual copying. The Deck falls back to this automatically when the clipboard is blocked (some browsers refuse `navigator.clipboard` on `file://`), so a pasted handoff may arrive with or without the header, or with a stray leading line.

### The header, line by line

Every line is produced by `buildHandoffText()` in the harness; formats below are exact.

```
AI-ASSIST PROTOTYPE HANDOFF v1
Prototype: <name> (<file>) · web|TUI
Decision: variant <id> "<name>" (<index> of <count>) · screen: <screenId>
  thesis: <variant thesis>
Look: preset <name>[ (modified)]|custom · mode light|dark · viewport fit|mobile|tablet|laptop|desktop
Changed from variant defaults (<n>): <Label> <from>→<to>, <Label> <from>→<to>, …
Custom controls: <id>=<value>, …
Notes: <free text, continuation lines indented two spaces>
Pins (<n>):
  1. [<variantId>/<screen>] <css selector> "<element text>": <note>
Snapshots (<n>): <name> [<variantId> · <preset>], …

```json
{ …the object described below… }
```
```

Lines that have nothing to say are omitted: no `screen:` when the variant has no screens, no `thesis:` line when none was declared, `Dials: all at variant defaults` replaces the `Changed from…` line when nothing moved (`Dials: none exposed (fixed look)` when the prototype was built with `dials: "none"`), and `Custom controls`, `Notes`, `Pins`, `Snapshots` appear only when present. `mode` is absent for TUI prototypes.

### JSON field reference (`ai-assist-prototype/handoff@1`)

| Field | Type | Meaning |
|---|---|---|
| `schema` | string | `ai-assist-prototype/handoff@1`. Treat unknown minor additions as optional. |
| `deckVersion` | string | harness version that produced the export (`1.1.0` today; `1.0.0` exports lack `prototype.dials` / `exposedDials` / `lockedDials`) |
| `exportedAt` | ISO string | when the user pressed Export |
| `instructions` | string | one sentence addressed to any LLM, for agents that do not have this skill |
| `prototype.id` | string | manifest id, also the localStorage key for the user's deck state |
| `prototype.name` | string | manifest name |
| `prototype.file` | string or null | the HTML file name (bare name, not a path) taken from the URL |
| `prototype.kind` | `web` or `tui` | which token system applies |
| `prototype.brief` | string or null | the design question you wrote into the manifest |
| `prototype.dials` | string or string[] | the `manifest.dials` tier (`none`, `essential`, `standard`, `full`) or explicit id list the Deck was built with |
| `prototype.exposedDials` | string[] | ids of the dials the user could actually see and move (built-ins at the tier minus locked ones, plus `extraControls`; macros excluded) |
| `prototype.lockedDials` | string[] | ids locked by `hideControls`; they sit at the variant defaults regardless of presets |
| `decision.variantId` / `variantName` / `thesis` | strings | the variant that was showing when the user exported: this is the choice |
| `decision.index` / `of` | numbers | position in the variant list, for humans |
| `decision.screen` | string or null | the screen that was showing (`null` when the variant has none) |
| `preset.name` | string or null | last preset chip the user pressed for this variant, `null` when none |
| `preset.modified` | boolean or null | `true` when any dial moved after the preset was applied |
| `mode` | `light`, `dark` or null | the Mode dial (null for TUI) |
| `viewport` | string | `fit`, `mobile` (390), `tablet` (820), `laptop` (1280) or `desktop` (1536) |
| `macros` | `{ warmth, energy }` | positions of the Feel macro dials; informational, the primitives they wrote are in `tokens` |
| `tokens` | object | every dial's current primitive value for the chosen variant, keyed by control id (built-in and `extraControls`); numbers are unitless, fonts are library labels |
| `defaults` | object | that variant's defaults (control defaults + `manifest.defaults` + `variant.tokens`) |
| `changes` | array | `{ id, label, from, to }` for each dial that differs from `defaults`, values formatted with units (`10px`, `222°`, `78%`). Includes dials the tier did not expose when a preset or a Feel macro moved them (e.g. `motion` after dragging Energy), so it is the truthful delta even on an `essential` Deck |
| `custom` | object | values of `extraControls` only, for quick reading |
| `css` | string | a complete `:root { --pt-…: …; }` block with every resolved variable (colors as `hsl(...)`, sizes in px, font stacks, shadows, durations), ready to paste into a stylesheet |
| `notes` | string | the Notes textarea, verbatim |
| `pins` | array | `{ n, variantId, screen, selector, text, note }` for every pin across all variants |
| `snapshots` | array | `{ name, variantId, screen, preset, viewport, tokens, at }` for every saved snapshot |
| `variants` | array | `{ id, name, thesis }` for all variants in the file, so you can name the alternatives the user rejected |

## How to read a pasted handoff

1. **Detect it.** The first line `AI-ASSIST PROTOTYPE HANDOFF v1`, or a JSON object whose `schema` starts with `ai-assist-prototype/handoff`. If only the JSON arrived, everything you need is still there.
2. **Find the file.** `prototype.file` is a bare file name. Look in `prototypes/` first, then search the repo; if the user moved or renamed it, ask for the path rather than guessing. Read the manifest and the chosen variant's `<template>` from that file: the decision only makes sense next to the structure it refers to.
3. **Restate the decision in one or two lines** before doing anything, so the user can correct a wrong reading cheaply. Name the variant and screen, the preset and whether it was modified, the two or three biggest `changes`, then the notes and pins in the user's words.
4. **Decide the next move**, with the user when the intent is open, or directly when it is obvious from the notes:
   - **Iterate the prototype**: the user wants another round. Derive new variants from the chosen one, honor notes and pins (for example "header from B with sidebar from C" means compose a new variant from those two templates), promote the winner to the first position, set its `tokens` to the exported `tokens` so the dials start where the user left them, rebuild, and hand the file back.
   - **Produce a design spec**: turn `css` / `tokens` into CSS custom properties, a Tailwind theme, or a `DESIGN.md` section (see mapping below). Useful when a designer or another team implements.
   - **Implement for real**: build the feature in the codebase using the chosen variant's structure and the resolved `css` values. The prototype is throwaway code written without tests or error handling; rewrite it properly in the project's framework and component library instead of pasting the template in.

## Mapping tokens to real code

Use `css` (resolved values) when you are implementing with CSS variables; it already contains every derived color, type step, spacing step, radius, shadow and duration. Use `tokens` (the primitives) when you are regenerating or iterating the prototype, because the harness re-derives everything from them.

### CSS custom properties

Paste the `css` block as-is into a global stylesheet and reference `var(--pt-accent)`, `var(--pt-s-4)`, `var(--pt-t-lg)` and so on; or rename the variables to the project's convention with a find-and-replace on `--pt-`.

### Tailwind (v4 `@theme` shown; v3 `theme.extend` is the same mapping)

```css
@theme {
  --color-primary: hsl(140 55% 36%);          /* --pt-accent */
  --color-primary-hover: hsl(140 55% 29%);    /* --pt-accent-hover */
  --color-background: hsl(90 8% 97%);         /* --pt-bg */
  --color-surface: hsl(90 8% 99.8%);          /* --pt-surface */
  --color-text: hsl(90 8% 10%);               /* --pt-text */
  --color-muted: hsl(90 8% 46%);              /* --pt-text-muted */
  --color-border: hsl(90 8% 88%);             /* --pt-border-color */
  --radius-md: 12px;                          /* --pt-radius */
  --font-display: "Fraunces", Georgia, serif; /* --pt-font-display */
  --font-sans: "Inter", system-ui, sans-serif;/* --pt-font-body */
  --spacing: 4px;                             /* --pt-space-unit */
}
```

Type steps map to `--text-*` (or `fontSize` in v3) from `--pt-t-xs` … `--pt-t-5xl`; shadows to `--shadow-*` from `--pt-shadow-sm/md/lg`.

### DESIGN.md (google-labs-code/design.md format, as produced by ai-assist-design-creator)

```yaml
colors:
  primary: "#2E8B57"        # hsl → hex of --pt-accent
  surface: "#FDFDFC"        # --pt-surface
  on-surface: "#1A1C19"     # --pt-text
typography:
  headline-lg:
    fontFamily: Fraunces     # tokens.fontDisplay
    fontSize: 48.8px         # --pt-t-3xl
    fontWeight: 700          # tokens.weightDisplay
  body-md:
    fontFamily: Inter        # tokens.fontBody
    fontSize: 16px           # --pt-size
    lineHeight: 1.55         # tokens.lineHeight
rounded:
  DEFAULT: 12px              # --pt-radius
spacing:
  base: 4px                  # --pt-space-unit
```

Convert `hsl()` to hex for DESIGN.md (its linter wants `#RRGGBB`). If the repo already has a `DESIGN.md`, update the relevant tokens rather than replacing the file.

## Reading specific fields well

- `changes` is the highest-signal field: it lists what the user deliberately moved away from the defaults you chose. A radius bump and a font swap tell you more than the full token dump.
- `macros` only record where the Warmth and Energy sliders sit; the primitives they wrote (`neutralHue`, `accentSat`, `weightDisplay`, …) are already in `tokens`. Do not re-apply macros on top.
- `pins` carry a CSS selector (`main > section.hero > h1`, capped at five levels, ids short-circuit it) plus up to 60 characters of the element's text and the user's note. Resolve the selector against the variant's `<template>` to find the element they meant; the text snippet is your fallback when the selector no longer matches after edits. Pins from variants other than the decision are still relevant ("I liked this part of B").
- `snapshots` are alternative looks the user saved to compare. If there are several and the notes do not say which won, ask; the decision's `tokens` are what was on screen at export time, not necessarily a snapshot.
- `preset.modified: true` means the preset name no longer fully describes the look; lean on `changes` and `tokens`, not the name.
- `viewport` tells you what width the user was judging at; `mobile` or `tablet` is a hint that responsive behavior mattered to them.

## The iteration loop

1. Promote the chosen variant to first in `manifest.variants` (the Deck opens on the first variant unless the URL carries `#v=<id>`).
2. Copy the exported `tokens` into that variant's `tokens` (or into `manifest.defaults` when every new variant should start from the same look).
3. Add the new variants derived from notes and pins; retire the ones the user clearly rejected unless they asked to keep them for comparison.
4. Keep the same `manifest.id` so the user's deck position, notes, pins and snapshots persist across rebuilds; bump the id only when starting a genuinely new exploration (old state would otherwise leak in).
5. Rebuild with `scripts/build-prototype.mjs`, validate, and tell the user the file path plus the `#v=` hash that opens straight on the new variant.

## Edge cases

- **Older `deckVersion`**: be lenient; fields may be missing or named slightly differently. The decision, tokens and notes are the essentials.
- **Clipboard blocked**: the user copied from the View window; the paste may lack the first line or include UI text. Detect by the `schema` field.
- **JSON only**: the user pressed JSON. Same fields, no header; restate from the JSON.
- **Two handoffs pasted**: the user is comparing. Diff `decision` and `changes` between them, summarize the difference in a few lines, and ask which one wins (or build a variant that merges them if the notes say so).
- **File moved or renamed**: `prototype.file` no longer resolves. Ask for the path; do not rebuild from memory.
- **Pins that do not resolve**: the template changed since the pin was made. Use the text snippet and the note, and say which pin you could not place.

## Worked example

Pasted by the user:

```
AI-ASSIST PROTOTYPE HANDOFF v1
Prototype: Garden Companion · dashboard (garden-dashboard.html) · web
Decision: variant beds "Garden beds" (2 of 3) · screen: home
  thesis: Sidebar of beds on the left, cards per plant on the right; spatial, like walking the garden.
Look: preset Almanac (modified) · mode light · viewport laptop
Changed from variant defaults (4): Display font Fraunces→Newsreader, Accent hue 140°→25°, Corner radius 16px→6px, Sidebar width 260px→300px
Custom controls: sidebarWidth=300, chartStyle=dots
Notes: Keep the card grid but use the Ledger variant's top nav instead of the sidebar brand block
Pins (1):
  1. [beds/home] main.content > h1 "Today in the garden": too big, make it the size of the Ledger heading

```json
{ "schema": "ai-assist-prototype/handoff@1", "decision": { "variantId": "beds", "screen": "home" }, "preset": { "name": "Almanac", "modified": true }, "changes": [ … ], "tokens": { … }, "css": ":root { … }", … }
```
```

An ideal response starts with a restatement, then the next move:

> You picked **Garden beds** (sidebar + plant cards) at laptop width, on the **Almanac** preset with a warmer accent (hue 25), Newsreader for display, 6px radius, a 300px sidebar and dot charts. Notes: keep the card grid but take the Ledger's top nav; pin: the "Today in the garden" heading should shrink to the Ledger heading size.
>
> Next I will build a fourth variant, "Beds + top nav", that composes the Ledger header over the Garden beds grid with the h1 at `--pt-t-2xl`, set its tokens to your exported values, and put it first in the file. Want that, or should I go straight to implementing it in `src/routes/dashboard`?
