# Token contract: manifest, dials, CSS variables, and the PT bridge

This is the reference for everything a variant can rely on from the harness (`assets/template.html`, deck v1.1.0). Read it when you author variants, add custom controls, or script against a prototype with browser tools.

**Contents**

1. [Authoring model](#1-authoring-model)
2. [Manifest schema](#2-manifest-schema)
3. [Web control set](#3-web-control-set)
4. [TUI control set](#4-tui-control-set)
5. [Derived CSS variables](#5-derived-css-variables)
6. [Base styles and helper classes](#6-base-styles-and-helper-classes)
7. [Writing variant CSS so the dials work](#7-writing-variant-css-so-the-dials-work)
8. [Screens and flows](#8-screens-and-flows)
9. [The PT bridge (inside a variant)](#9-the-pt-bridge-inside-a-variant)
10. [window.__PT__ (parent window automation API)](#10-window__pt__-parent-window-automation-api)
11. [Storage, URL state, keyboard](#11-storage-url-state-keyboard)

## 1. Authoring model

You never hand-edit the harness. You write a **parts file** that holds only two things: the manifest (`<script type="application/json" id="pt-manifest">`) and one `<template data-variant="ID">` per variant. Then you run `node <skill-dir>/scripts/build-prototype.mjs --parts <parts.html> --out prototypes/<slug>.html`, which splices your parts into the template, sets the `<title>`, writes one self-contained HTML file, and runs `validate-prototype.mjs` on it. Re-run the same command after every edit.

At runtime the Deck mounts the current variant into its **own iframe document**. Consequences you can lean on: plain selectors (`h1`, `.hero`) never leak between variants, real `@media` queries work because the Deck's viewport buttons resize that document, inline `<script>` blocks run at parse time inside that document, and the harness writes every token as a CSS custom property on that document's `<html>` element (plus a few `data-*` attributes). Variants consume tokens with `var(--pt-…)`; that is the whole contract.

## 2. Manifest schema

`"schema": "ai-assist-prototype/manifest@1"`. Unknown keys are ignored.

| Field | Type | Default | Purpose |
|---|---|---|---|
| `schema` | string | required | `ai-assist-prototype/manifest@1` |
| `id` | slug | required | Keys browser storage (`ai-assist-prototype:<id>`). Give every prototype its own id or saved dial state collides. |
| `name` | string | required | Shown in the Deck header, the `<title>`, and every export. |
| `kind` | `web` \| `tui` | `web` | Selects the derive function and base styles. TUI mode derives `data-mode` from the theme's background lightness. |
| `brief` | string | none | The design question, audience, and what "good" looks like. Travels with every export, so write it for the agent that will read the handoff. |
| `controls` | `web` \| `tui` | same as `kind` | Which built-in control set the Deck shows. Keep it equal to `kind`. |
| `dials` | `none` \| `essential` \| `standard` \| `full` \| string[] | `standard` | How much of the built-in set the Deck exposes (see "Dial tiers" below). A string array is an explicit allowlist of built-in ids. Always set it deliberately; the validator warns when it is missing. |
| `defaults` | partial token map | `{}` | Global default overrides applied before per-variant `tokens`. Use it to seed the prototype from a repo's DESIGN.md, Tailwind theme or CSS variables (accent hue, fonts, radius), and to fix the value of any dial the tier does not expose. |
| `extraControls` | array | `[]` | Custom dials, see below. Appear in the Deck under their `group` (default "Custom"); groups holding custom dials open by default. Always shown, whatever the tier. |
| `hideControls` | string[] | `[]` | Built-in control ids to **lock**: no row in the Deck, and neither presets nor the Feel macros move them, so they sit at `defaults` / `variant.tokens` for good (a mandated brand font, a fixed base size). Different from a dial the tier merely leaves out, which presets and macros can still move. |
| `presets` | `{ name: partial token map }` | `{}` | Extra preset chips. Merged over the built-ins; same name overrides. A preset is applied on top of the variant's defaults, not on top of the current state. Locked keys in a preset are ignored. |
| `hidePresets` | `true` \| string[] | `[]` | `true` removes every built-in preset chip (your `presets` stay); an array removes the named ones. Presets are also hidden automatically when the tier exposes no dials. |
| `fonts` | array of `{ label, stack, gf?, cat? }` | `[]` | Extra entries for the font pickers. `stack` is the CSS font-family value, `gf` the Google Fonts family string (e.g. `Inter:wght@300..900`) if it should be loaded, `cat` one of `sans`, `serif`, `mono`, `display`. |
| `tuiThemes` | `{ name: { bg, fg, dim, accent, accent2, sel, border, ok, warn, err } }` | `{}` | Extra terminal palettes (hex). Missing keys fall back to "Default dark". |
| `variants` | array | required, non-empty | See below. Order is the Deck order. |

**`variants[]`**

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Must match `<template data-variant="ID">`. Used in the URL hash and the export. |
| `name` | string | Shown in the Deck nav and the export. |
| `thesis` | string | One line: what this variant bets on. Shown under the nav and exported. |
| `tokens` | partial token map | Per-variant default dial values (e.g. an editorial variant defaulting to a serif). "Reset dials" returns to these. |
| `screens` | `[{ id, name }]` or `string[]` | Optional. Declares the screen tabs; if omitted the Deck discovers screens from `data-screen` attributes after mount. |

**`extraControls[]`**

| Field | Notes |
|---|---|
| `id` | Unique, must not collide with a built-in id. Becomes a key in `tokens` and in the export's `custom` object. |
| `label`, `group`, `help` | Deck label, group heading (default "Custom"), tooltip. |
| `type` | `range` (needs `min`, `max`, optional `step`, `unit`), `select` / `segment` (need `options`: strings or `{ value, label }`), `toggle` (boolean), `font` (optional `cat` filter), `color` (hex), `text`. |
| `default` | Required in practice; without it the dial starts empty. |
| `var` | Optional CSS custom property name (`--x-sidebar-w`). When present the harness sets it on the variant document's `<html>` every time the value changes: `range` values get `unit` appended (degrees excepted), `toggle` becomes `"1"` / `"0"`, `font` becomes the font stack, everything else is the raw string. Without `var`, only scripts can read the value (`PT.tokens().id`), so reach for `PT.on('tokens', …)` in that case. |

**Dial tiers (`manifest.dials`)**

The Deck should be as big as the question, not as big as the harness. Pick the tier in the plan (SKILL.md, "Right-size the Deck"); `extraControls` are added on top of any tier, `hideControls` subtracts from it.

| Tier | Web dials exposed | TUI dials exposed | Typical use |
|---|---|---|---|
| `none` | only the light/dark toggle in the toolbar; no groups, no presets, no sync, no snapshots, no reset | nothing (variant nav, viewports, notes, pins, export only) | structure-only comparisons, a single component with a fixed brand look, a throwaway sanity check |
| `essential` | Feel (warmth, energy), Type (display font, body font), Color (mode, accent hue), Shape (radius), Space (density); 8 rows | theme, font, font size, border glyphs | a component, a widget, a small screen where feel matters but nobody will tune tracking |
| `standard` (default) | essential + base size, type scale, accent sat/light, neutral hue, border width, elevation, container width; 16 rows, Feel/Type open, Color/Shape/Space collapsed | essential + accent override, line height, columns, rows, cursor, window chrome | a page or app screen, most prototypes |
| `full` | all 27 (adds line height, tracking, weights, 2nd hue shift, neutral tint, surface depth, contrast, motion) | all 14 (adds bold headings, padding, cursor blink, scanlines) | design-system and brand explorations, dark-first passes, when the user is a designer who wants every knob |
| `[ids]` | exactly the listed built-in ids | same | when a tier is almost right; e.g. `["mode", "accentHue", "radius", "density"]` |

Decks with eight or fewer rows open every group; larger ones open Feel (or Theme), Type and any group holding custom dials. Dials a tier leaves out still exist: `defaults` and `variant.tokens` set them, presets and the Feel macros move them, and the export's `changes` lists them when they differ from the variant's defaults. `hideControls` is the stronger tool: a locked dial never moves.

## 3. Web control set

All values are stored per variant. Macros are the exception: they write to the primitive dials listed and are exported separately under `macros`; they never appear in `tokens`.

| id | Label | Group | Type | Range / options | Default | Drives |
|---|---|---|---|---|---|---|
| `warmth` | Warmth | Feel | range (macro) | -1 .. 1, step 0.05 | 0 | Sets `neutralHue` (215 when cool, 35 when warm) and `neutralSat` (0 .. 18 by distance from 0). |
| `energy` | Energy | Feel | range (macro) | 0 .. 1, step 0.05 | 0.5 | Sets `accentSat` 45..96, `weightDisplay` 500..800, `elevation` 0.5..4, `motion` 0.4..1.6, `typeScale` 1.18..1.34, `contrast` 0.9..1.15. |
| `fontDisplay` | Display font | Type | font | font library | Inter | `--pt-font-display` |
| `fontBody` | Body font | Type | font | font library | Inter | `--pt-font-body` |
| `fontSize` | Base size | Type | range | 13 .. 20 px, step 0.5 | 16 | `--pt-size`, root of the type scale |
| `typeScale` | Type scale | Type | range | 1.1 .. 1.5, step 0.01 | 1.25 | ratio between `--pt-t-*` steps |
| `lineHeight` | Line height | Type | range | 1.2 .. 1.9, step 0.05 | 1.55 | `--pt-lh` |
| `tracking` | Tracking | Type | range | -0.04 .. 0.1 em, step 0.005 | 0 | `--pt-tracking` |
| `weightDisplay` | Display weight | Type | range | 300 .. 900, step 100 | 700 | `--pt-weight-display` |
| `weightBody` | Body weight | Type | range | 300 .. 600, step 100 | 400 | `--pt-weight-body` |
| `mode` | Mode | Color | segment | light, dark | light | `data-mode` and the light/dark branch of every color role |
| `accentHue` | Accent hue | Color | range | 0 .. 360 | 222 | `--pt-accent*`, `--pt-accent-2`, `--pt-accent-h` |
| `accentSat` | Accent sat. | Color | range | 0 .. 100 % | 78 | accent saturation, also ok/warn/err saturation (clamped) |
| `accentLight` | Accent light. | Color | range | 25 .. 70 % | 50 | accent lightness; `--pt-on-accent` flips to dark text above 62 |
| `accent2Shift` | 2nd hue shift | Color | range | -180 .. 180, step 5 | 150 | `--pt-accent-2` = accent hue + shift |
| `neutralHue` | Neutral hue | Color | range | 0 .. 360 | 222 | hue of bg, surfaces, text, borders |
| `neutralSat` | Neutral tint | Color | range | 0 .. 30 % | 8 | saturation of the neutrals (0 = pure gray) |
| `surfaceTint` | Surface depth | Color | range | 0 .. 1, step 0.05 | 0.4 | distance between `--pt-bg`, `--pt-surface`, `--pt-surface-2` |
| `contrast` | Contrast | Color | range | 0.7 .. 1.3, step 0.05 | 1 | text, muted and border lightness distance from the background |
| `radius` | Corner radius | Shape | range | 0 .. 32 px | 10 | `--pt-radius` and the sm/lg/xl multiples |
| `borderWidth` | Border width | Shape | range | 0 .. 3 px, step 0.5 | 1 | `--pt-border` |
| `elevation` | Elevation | Shape | range | 0 .. 5, step 0.5 | 2 | strength of `--pt-shadow-sm/md/lg` (0 = none) |
| `density` | Density | Space | range | 0.6 .. 1.6, step 0.05 | 1 | multiplies `--pt-space-unit` and every `--pt-s-*` step |
| `containerWidth` | Container | Space | range | 640 .. 1600 px, step 20 | 1200 | `--pt-container` |
| `motion` | Motion | Motion | range | 0 .. 2, step 0.1 | 1 | `--pt-motion`, `--pt-dur-*` (0 disables transitions) |

Built-in web presets (partial token maps applied over variant defaults): `Neutral`, `Calm`, `Bold`, `Editorial`, `Playful`, `Technical`, `Midnight` (dark), `Mono`.

Font library labels (use these exact strings in `fontDisplay` / `fontBody` / `tuiFont` and in presets): sans `Inter`, `IBM Plex Sans`, `Manrope`, `Space Grotesk`, `DM Sans`, `Work Sans`, `Figtree`, `Outfit`, `Archivo`, `Public Sans`, `Nunito`, `Rubik`, `Plus Jakarta Sans`, `System UI`; serif `Fraunces`, `Playfair Display`, `Lora`, `Source Serif 4`, `Newsreader`, `DM Serif Display`, `Libre Baskerville`, `Crimson Pro`, `Instrument Serif`, `Georgia`; mono `JetBrains Mono`, `IBM Plex Mono`, `Fira Code`, `Space Mono`, `DM Mono`, `Courier Prime`, `System Mono`. Google Fonts are loaded lazily into the variant document (and degrade to the fallback stack offline). An unknown label is used verbatim with a system fallback.

## 4. TUI control set

| id | Label | Group | Type | Range / options | Default | Drives |
|---|---|---|---|---|---|---|
| `tuiTheme` | Theme | Theme | select | Default dark, Default light, Dracula, Nord, Gruvbox dark, Solarized dark, Solarized light, One dark, Catppuccin mocha, Tokyo night, Monochrome, Amber CRT, Green phosphor (+ `manifest.tuiThemes`) | Default dark | the whole `--pt-tui-*` palette, `--pt-tui-backdrop`, `data-mode` |
| `tuiAccentHue` | Accent override | Theme | range | -1 .. 360 | -1 | -1 keeps the theme accent; otherwise `--pt-tui-accent` and `--pt-tui-cursor` become that hue |
| `tuiFont` | Font | Type | font (mono only) | mono library | JetBrains Mono | `--pt-tui-font`, `--pt-font-mono` |
| `tuiFontSize` | Font size | Type | range | 11 .. 22 px, step 0.5 | 14 | `--pt-tui-size` |
| `tuiLineHeight` | Line height | Type | range | 1 .. 1.6, step 0.05 | 1.25 | `--pt-tui-lh` |
| `tuiBold` | Bold headings | Type | toggle | | true | `data-tui-bold`; when false `.bold` and `b` render at weight 400 |
| `tuiCols` | Columns | Terminal | range | 60 .. 200, step 2 | 100 | `--pt-tui-cols` (minimum width of `.tui` in `ch`; the pane grows to fit longer lines) |
| `tuiRows` | Rows | Terminal | range | 20 .. 60 | 32 | `--pt-tui-rows` (min-height of `.tui`) |
| `tuiBorders` | Border glyphs | Terminal | select | single, rounded, double, heavy, ascii, none | single | `data-tui-borders`; the harness transliterates box-drawing characters inside every `.tui` element |
| `tuiPadding` | Padding | Terminal | range | 0 .. 3 ch | 1 | `--pt-tui-pad` |
| `tuiCursor` | Cursor | Terminal | select | block, bar, underline | block | `data-tui-cursor`, styles `.cursor` |
| `tuiBlink` | Cursor blink | Terminal | toggle | | true | `data-tui-blink` |
| `tuiChrome` | Window chrome | Terminal | toggle | | true | `data-tui-chrome`; hides `.tui-titlebar` and the window shadow when false |
| `tuiScanlines` | CRT scanlines | Terminal | toggle | | false | `data-tui-scanlines`; overlay on `.tui-window` |

Author box drawing with the **single** glyph set (`─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`); the Deck swaps them for rounded, double, heavy, ASCII or spaces live. Built-in TUI presets: `Default`, `Hacker`, `Retro`, `Modern`, `Minimal`, `Paper`.

## 5. Derived CSS variables

The harness recomputes these from the dials on every change and sets them on the variant document's `<html>` (also inlined in the initial markup, so there is no flash).

**Fonts and type (web)**

| Variable | Value |
|---|---|
| `--pt-font-display`, `--pt-font-body` | stacks for the selected fonts |
| `--pt-font-mono` | JetBrains Mono stack (fixed in web mode; in TUI mode equals `--pt-tui-font`) |
| `--pt-size` | `fontSize` px |
| `--pt-lh`, `--pt-tracking` | `lineHeight` (unitless), `tracking` em |
| `--pt-weight-display`, `--pt-weight-body` | numeric weights |
| `--pt-t-xs` | size / scale |
| `--pt-t-sm` | size / sqrt(scale) |
| `--pt-t-md` | size |
| `--pt-t-lg`, `--pt-t-xl`, `--pt-t-2xl`, `--pt-t-3xl`, `--pt-t-4xl`, `--pt-t-5xl` | size × scale^1 .. ^6 (at 16px / 1.25: 20, 25, 31.25, 39.06, 48.83, 61.04 px) |

**Color roles (web)**, all `hsl()` strings built from the hue/sat/light dials, with a light and a dark branch chosen by `mode`:

| Variable | Role |
|---|---|
| `--pt-bg` | page background |
| `--pt-surface` | cards, panels (lighter than bg in light mode, raised in dark) |
| `--pt-surface-2` | hover / alternate rows / wells |
| `--pt-text`, `--pt-text-muted` | body text, secondary text |
| `--pt-border-color` | hairlines and borders |
| `--pt-accent`, `--pt-accent-hover` | primary action color and its hover |
| `--pt-accent-soft`, `--pt-accent-soft-text` | tinted background + readable text on it (badges, selected rows) |
| `--pt-on-accent` | text on solid accent (white, or near-black when the accent is light) |
| `--pt-accent-2` | secondary accent (accent hue + `accent2Shift`) |
| `--pt-ok`, `--pt-warn`, `--pt-err` | semantic greens/ambers/reds that follow the accent saturation |
| `--pt-accent-h`, `--pt-accent-s`, `--pt-accent-l`, `--pt-neutral-h`, `--pt-neutral-s` | raw components for your own `hsl(var(--pt-accent-h) var(--pt-accent-s) 90%)` mixes |

**Shadows, space, shape, layout, motion (web)**

| Variable | Value |
|---|---|
| `--pt-shadow-sm`, `--pt-shadow-md`, `--pt-shadow-lg` | layered shadows scaled by `elevation` (`none` at 0); tinted by the neutral hue |
| `--pt-space-unit` | 4px × `density` |
| `--pt-s-1` .. `--pt-s-9` | 4, 8, 12, 16, 24, 32, 48, 64, 96 px × `density` |
| `--pt-radius` | `radius` px |
| `--pt-radius-sm`, `--pt-radius-lg`, `--pt-radius-xl` | radius × 0.5, 1.5, 2.5 |
| `--pt-radius-full` | 9999px |
| `--pt-border` | `borderWidth` px |
| `--pt-container` | `containerWidth` px |
| `--pt-motion` | the raw multiplier |
| `--pt-dur-fast`, `--pt-dur-mid`, `--pt-dur-slow` | 120, 220, 420 ms × `motion` |
| `--pt-ease` | `cubic-bezier(.2,.7,.2,1)` |

**TUI palette and layout** (`kind: "tui"`)

| Variable | Value |
|---|---|
| `--pt-tui-bg`, `--pt-tui-fg`, `--pt-tui-dim` | terminal background, foreground, dim text |
| `--pt-tui-accent`, `--pt-tui-accent2` | highlights |
| `--pt-tui-sel`, `--pt-tui-border` | selection background, frame border |
| `--pt-tui-ok`, `--pt-tui-warn`, `--pt-tui-err` | status colors |
| `--pt-tui-cursor` | cursor color (follows the accent) |
| `--pt-tui-backdrop` | page background behind the terminal window |
| `--pt-tui-font`, `--pt-tui-size`, `--pt-tui-lh` | monospace stack, px size, unitless line height |
| `--pt-tui-cols`, `--pt-tui-rows`, `--pt-tui-pad` | integers consumed by `.tui` sizing |

**Custom variables**: every `extraControls` entry with a `var` is emitted as-is (see section 2).

**`<html>` attributes on the variant document**: `data-kind` (`web` / `tui`), `data-variant` (current id), `data-mode` (`light` / `dark`), and for TUI `data-tui-cursor`, `data-tui-blink`, `data-tui-chrome`, `data-tui-scanlines`, `data-tui-borders`, `data-tui-bold`. Use them for selectors such as `html[data-mode="dark"] .hero { … }`.

## 6. Base styles and helper classes

Every variant document receives a small base stylesheet. It is a convenience floor, not a component library; variants should still style their own structure.

Base rules: `box-sizing: border-box` everywhere; `body` gets the body font, `--pt-size`, `--pt-lh`, `--pt-tracking`, `--pt-weight-body`, `--pt-text` on `--pt-bg`; `h1..h6` use the display font and weight with tight line height (`h1` = `--pt-t-3xl`, `h2` = `--pt-t-2xl`, `h3` = `--pt-t-xl`, `h4` = `--pt-t-lg`); `a` is `--pt-accent`; `code`, `kbd`, `pre` use `--pt-font-mono`; form controls inherit font and color; `:focus-visible` draws a 2px accent outline; `::selection` uses the soft accent; `[data-screen][hidden]` is forced to `display: none`; `prefers-reduced-motion: reduce` collapses all animations and transitions.

| Class | What it gives you |
|---|---|
| `.pt-container` | max-width `--pt-container`, centered, inline padding `--pt-s-5` |
| `.pt-card` | surface background, `--pt-border` border, `--pt-radius`, `--pt-shadow-sm`, padding `--pt-s-5` |
| `.pt-btn` | inline-flex button with border, radius, weight 600, hover to `--pt-surface-2`, transitions on `--pt-dur-fast` |
| `.pt-btn-primary` | solid accent button with `--pt-on-accent` text and accent hover |
| `.pt-btn-ghost` | borderless, transparent button |
| `.pt-input` | full-width input with surface background and `--pt-radius-sm` |
| `.pt-badge` | pill in `--pt-accent-soft` / `--pt-accent-soft-text` at `--pt-t-xs` |
| `.pt-muted` | `--pt-text-muted` |
| `.pt-eyebrow` | small uppercase accent label with tracking |
| `.pt-divider` | horizontal rule using `--pt-border-color` |

TUI helpers (only meaningful with `kind: "tui"`): `.tui-stage` (full-height centered backdrop), `.tui-window` (rounded frame with shadow), `.tui-titlebar` with `.dots` (three `i` elements) and `.title`, `.tui` (the `<pre>` grid: monospace, `white-space: pre`, min-width from `--pt-tui-cols`, min-height from `--pt-tui-rows`, padding from `--pt-tui-pad`), color spans `.fg-accent` / `.accent`, `.fg-accent2` / `.accent2`, `.fg-dim` / `.dim`, `.fg-ok` / `.ok`, `.fg-warn` / `.warn`, `.fg-err` / `.err`, backgrounds `.bg-sel` / `.sel`, `.bg-accent`, `.inv`, emphasis `.bold` / `b`, `.ul`, `.it`, and `.cursor` (a one-character span styled by `data-tui-cursor` and blinking when `data-tui-blink` is true).

## 7. Writing variant CSS so the dials work

The Deck can only move what reads a token. Anything hardcoded is frozen, and the validator warns about it.

| Instead of | Write |
|---|---|
| `background: #fff` / `#0f0f0f` | `background: var(--pt-surface)` (or `--pt-bg`, `--pt-surface-2`) |
| `color: #333` / `#888` | `color: var(--pt-text)` / `var(--pt-text-muted)` |
| `color: #2563eb` for links, icons, emphasis | `color: var(--pt-accent)`; tinted areas `var(--pt-accent-soft)` with `var(--pt-accent-soft-text)` |
| `font-size: 32px` | `font-size: var(--pt-t-2xl)` (pick the nearest step; `clamp()` between two steps is fine) |
| `padding: 24px` / `gap: 16px` | `padding: var(--pt-s-5)` / `gap: var(--pt-s-4)` |
| `border-radius: 12px` | `border-radius: var(--pt-radius)` (`-sm`, `-lg`, `-xl`, `-full` for pills) |
| `border: 1px solid #e5e7eb` | `border: var(--pt-border) solid var(--pt-border-color)` |
| `box-shadow: 0 4px 12px rgba(0,0,0,.1)` | `box-shadow: var(--pt-shadow-md)` |
| `font-family: Inter, sans-serif` | `font-family: var(--pt-font-display)` for headings and brand, `var(--pt-font-body)` for text, `var(--pt-font-mono)` for code |
| `transition: all .2s` | `transition: background var(--pt-dur-fast) var(--pt-ease)` (explicit properties) |
| `max-width: 1200px` | `max-width: var(--pt-container)` |

Allowed hardcoding: decorative illustration (a gradient "photo", a chart fill) can use fixed colors, although `linear-gradient(135deg, var(--pt-accent-soft), var(--pt-accent-2))` usually looks more integrated. Tiny structural values (a 2px indicator bar, a 1px hairline inside an illustration) are fine.

Responsive: write normal `@media (max-width: 720px) { … }` rules. The Deck's viewport buttons (Fit, 390, 820, 1280, 1536) resize the variant's own document, so those queries fire exactly as they would in production. Check each variant at least at 390 and 1280.

Grid pitfall: in a sidebar layout, `grid-template-columns: var(--x-sidebar-w, 260px) 1fr` lets the content column grow to its content's intrinsic width and a card grid inside it overflows horizontally. Use `minmax(0, 1fr)` for the flexible column (or `min-width: 0` on the child).

Do not reference the parent page, `window.top`, or other variants. Do not add `<link>` or `<script src>`; the prototype must stay self-contained.

## 8. Screens and flows

A variant can hold several screens (list, detail, settings, wizard steps). Wrap each in an element with `data-screen="id"` and an optional `data-screen-name="Label"`. Mark every screen except the first with the `hidden` attribute so the initial paint is correct; after mount the harness shows the current screen and hides the rest (`[data-screen][hidden] { display: none !important }`).

- Declare `"screens": [{ "id": "home", "name": "Today" }, { "id": "plant", "name": "Plant" }]` on the variant in the manifest for stable tab labels. If you omit it, the Deck discovers screens from the DOM after mount (label = `data-screen-name` or the id).
- Navigate from inside the variant with `PT.go('plant')` (for example from a click handler on rows or cards). The Deck's screen tabs and the `[` / `]` keys do the same. The current screen is stored per variant and exported in `decision.screen`.
- `PT.on('screen', id => …)` fires after every change if you need to reset scroll or state.

Keep screens inside one variant when they share a structure. If two flows differ structurally, make them separate variants instead.

## 9. The PT bridge (inside a variant)

The harness defines `window.PT` in the variant document before your markup is parsed, so inline `<script>` blocks can use it immediately. Scripts run at parse time; elements later in the markup do not exist yet, so put scripts at the end of the template or wait for `PT.on('ready')`.

| Member | Purpose |
|---|---|
| `PT.root` | the variant's `document` (identical to `document` inside the iframe; use whichever reads better) |
| `PT.go(screenId)` | switch screens |
| `PT.screen()` | current screen id, or `null` when the variant has no screens |
| `PT.tokens()` | a copy of the current dial values (`{ fontDisplay: 'Inter', radius: 10, sidebarWidth: 260, … }`), including custom controls |
| `PT.vars()` | the derived CSS variable map (`{ '--pt-accent': 'hsl(…)', … }`) |
| `PT.variant()` | the manifest entry of the current variant |
| `PT.on('tokens', (tokens, vars) => …)` | runs after every dial change; use it for custom controls without a `var` (for example toggle a class or re-render a chart) |
| `PT.on('screen', id => …)` | runs after every screen change |
| `PT.on('ready', () => …)` | runs once the whole variant document is parsed and the first screen/token pass is applied |
| `PT.note(text)` | appends a line to the Deck's Notes (for example from a "suggest" button in the prototype) |
| `PT.version` | deck version string |

Runtime errors thrown by variant scripts are caught and shown in the Deck's status line as "variant script error" and logged to the console, so broken scripts are visible during review.

## 10. `window.__PT__` (parent window automation API)

For agents with browser tools (Claude in Chrome, Playwright) verifying a prototype, the top-level page exposes `window.__PT__`:

| Member | Purpose |
|---|---|
| `version`, `manifest`, `controls`, `allControls`, `dials`, `locked`, `presets` | read-only introspection: `controls` is what the Deck renders at the chosen tier, `allControls` every definition (locked and tier-trimmed included), `dials` the manifest tier, `locked` the `hideControls` ids |
| `state` | live deck state (current variant `v`, per-variant `tokens`, `macros`, `viewport`, `notes`, `pins`, `snaps`, `sync`) |
| `variant(id)` | switch variant; returns a Promise that resolves when the new document is parsed (mounting is asynchronous in Chrome) |
| `ready()` | Promise for the current mount |
| `setToken(id, value)`, `setMacro(id, value)`, `applyPreset(name)`, `go(screenId)` | same effects as using the Deck; `setToken` on a locked id and `setMacro` on a macro the tier does not expose are ignored, `setToken` on a tier-trimmed id works |
| `handoff()` | the export object (schema `ai-assist-prototype/handoff@1`) |
| `handoffText()` | the exact text that "Export to LLM" copies |
| `frame()` | the current iframe element; `frame().contentDocument` is the variant document |

Typical verification snippet: `await __PT__.variant('beds'); __PT__.applyPreset('Midnight'); __PT__.frame().contentDocument.documentElement.style.getPropertyValue('--pt-bg')`.

## 11. Storage, URL state, keyboard

- State persists in `localStorage` under `ai-assist-prototype:<manifest.id>`: current variant and screen, per-variant dial values and preset, macros, sync flag, viewport, deck position/collapse/open groups, notes, pins, snapshots. It is flushed on `pagehide`. Clearing site data resets the deck; changing `manifest.id` starts fresh.
- The URL hash mirrors the current variant (`#v=beds`) so a link or reload lands on the same variant.
- "Sync dials across variants" (the 🔗 button, on by default) applies dial, preset, macro and reset changes to every variant; turn it off to tune one variant independently. Export always describes the current variant.
- Keyboard (ignored while typing in a field): `←` `→` variants, `[` `]` screens, `` ` `` collapse the Deck, `Shift+E` export, `Shift+S` snapshot, `Shift+A` annotate mode, `Esc` leaves annotate mode or closes the handoff window; double-click a dial label to reset that dial.
- Viewport presets: Fit (fills the window), 390×844, 820×1180, 1280×800, 1536×960, rendered as a framed device that scrolls inside itself.
