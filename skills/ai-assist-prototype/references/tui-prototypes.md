# TUI prototypes (terminal UIs rendered in the browser)

Read this when the prototype is for a terminal program rather than a web page or app screen.

## When to pick `kind: "tui"`

Choose the TUI kind when the user is designing something that runs in a terminal: a CLI with an interactive interface, a curses-style dashboard, a REPL, a wizard that walks through steps in the shell, or anything they describe with ncurses, Ink, Bubble Tea, Textual, ratatui, blessed, tview, prompt_toolkit or similar.

The prototype renders a fake terminal inside the browser. That is the point: stakeholders can vet layout, information hierarchy, focus and selection states, key bindings and color themes before a single line of TUI framework code exists, and they can do it by double-clicking a file. It is not a runnable program. Once a variant wins, offer to scaffold the real thing in the framework they use (see the mapping table at the end).

## Manifest differences

```json
{
  "schema": "ai-assist-prototype/manifest@1",
  "id": "pr-triage-tui",
  "name": "pr-triage · TUI",
  "kind": "tui",
  "controls": "tui",
  "brief": "…",
  "presets": {},
  "variants": [ { "id": "panes", "name": "Split panes", "thesis": "…" } ]
}
```

- `kind: "tui"` switches the base CSS, the derivation and the export (`mode` is `null` in the handoff).
- `controls: "tui"` loads the terminal dial set instead of the web one. There is no light/dark Mode dial: the theme decides, and the harness sets `html[data-mode]` to `dark` or `light` from the theme's background lightness.
- Built-in TUI presets (chips in the Deck), each a partial token set applied on top of the variant defaults:

| Preset | What it sets |
|---|---|
| Default | variant defaults (theme `Default dark`, single borders, JetBrains Mono) |
| Hacker | `Green phosphor` theme, scanlines on, `ascii` borders, Courier Prime |
| Retro | `Amber CRT` theme, scanlines on, `double` borders, window chrome off |
| Modern | `Catppuccin mocha`, `rounded` borders, JetBrains Mono, line height 1.35 |
| Minimal | `Monochrome`, borders `none`, chrome off, bold headings off |
| Paper | `Solarized light`, `single` borders, IBM Plex Mono |

- Add your own presets under `manifest.presets` (same shape, keys are TUI control ids) and your own palettes under `manifest.tuiThemes`:

```json
"tuiThemes": { "Acme": { "bg": "#101418", "fg": "#e7ecf1", "dim": "#7f8a96", "accent": "#5ad1b5", "accent2": "#f5c451", "sel": "#1d2a36", "border": "#2f3d4b", "ok": "#6ee7a8", "warn": "#f5c451", "err": "#ff7a90" } }
```
Missing keys fall back to `Default dark`. The theme shows up in the Theme dial automatically.

## Authoring a TUI variant

Wrap every variant in the terminal chrome the base CSS knows about, and put the screen itself in a `<pre class="tui">`:

```html
<template data-variant="panes">
<div class="tui-stage"><div class="tui-window">
  <div class="tui-titlebar"><span class="dots"><i></i><i></i><i></i></span><span class="title">pr-triage · acme/web · 100×32</span></div>
<pre class="tui">…screen text…</pre>
</div></div>
</template>
```

Rules that keep the dials working:

- **Draw boxes with single-line glyphs only**: `─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼`. The Border glyphs dial transliterates those eleven characters to `rounded`, `double`, `heavy`, `ascii` or `none` (spaces) at runtime, and back. Anything else (`═`, `╭`, `━`) is left untouched, so a mixed drawing will not switch as a whole.
- **Keep every line exactly the column width.** `.tui` is `white-space: pre`; the Columns dial sets its minimum width (`calc(var(--pt-tui-cols) * 1ch + padding)`) and the pane grows to fit longer lines (scrolling only once the viewport is narrower than the pane). Overlong lines therefore widen the whole window; shorter lines leave a ragged right edge. Pad with ordinary spaces, never tabs, and count columns (a quick `node -e` that prints `line.length` per line is worth it for anything over a dozen lines).
- **Pick one fixed width per variant** (80, 100 or 120 columns are the honest choices) and state it in the titlebar, for example `100×32`. Set the manifest variant `tokens` to match: `"tokens": { "tuiCols": 100, "tuiRows": 32 }`. Use the Columns dial afterwards only to see how the layout degrades when the user's terminal is narrower, or add an explicit "compact 80-col" variant when that matters.
- **Color comes from classes, not inline styles.** Wrap runs of text in `<span class="…">` from the table below; the theme dial restyles them all. Markup inside `<pre>` is fine; only the text nodes count toward the column width.
- **Glyph width matters.** Box drawing and block characters are single width; emoji and many symbols are double width and will break alignment. Prefer `●○✓✗▸▪·` style glyphs.
- **No CSS is usually needed.** The validator reports "no CSS (relies on base styles only)" for TUI variants as information, not a warning. If you add a `<style>`, consume `--pt-tui-*` variables rather than hex values.

### Emphasis and color classes inside `.tui`

| Class | Use for |
|---|---|
| `accent` (alias `fg-accent`) | the app name, the active tab, the prompt chevron, anything "primary" |
| `accent2` (alias `fg-accent2`) | a secondary highlight: branch names, secondary keys |
| `dim` (alias `fg-dim`) | metadata, timestamps, help text, inactive items |
| `ok`, `warn`, `err` | status glyphs and words: `✓ passing`, `● running`, `✗ failing` |
| `sel` (alias `bg-sel`) | the selected row or the focused pane title; combine with `bold` |
| `bg-accent` | a strongly highlighted chip or the active tab in a tab bar |
| `inv` | inverse video, ideal for key hints in the bottom bar: `<span class="inv"> q </span> quit` |
| `bold`, `<b>` | headings and labels (the Bold headings dial can turn these off) |
| `ul`, `it` | underline and italic, use sparingly |
| `cursor` | one `<span class="cursor"> </span>` where the caret sits; Cursor and Cursor blink dials style it as block, bar or underline |

### TUI dials and what they drive

| Dial (id) | Range / options | Drives |
|---|---|---|
| Theme (`tuiTheme`) | Default dark, Default light, Dracula, Nord, Gruvbox dark, Solarized dark, Solarized light, One dark, Catppuccin mocha, Tokyo night, Monochrome, Amber CRT, Green phosphor, plus `tuiThemes` | `--pt-tui-bg`, `-fg`, `-dim`, `-accent`, `-accent2`, `-sel`, `-border`, `-ok`, `-warn`, `-err`, `-cursor`, `-backdrop`; `html[data-mode]` |
| Accent override (`tuiAccentHue`) | -1 … 360 | replaces `--pt-tui-accent` and `--pt-tui-cursor` with a hue-based color; -1 keeps the theme accent |
| Font (`tuiFont`) | monospace fonts from the library | `--pt-tui-font` (and `--pt-font-mono`) |
| Font size (`tuiFontSize`) | 11 … 22 px | `--pt-tui-size` |
| Line height (`tuiLineHeight`) | 1 … 1.6 | `--pt-tui-lh` |
| Bold headings (`tuiBold`) | on/off | `html[data-tui-bold]`, turns `.bold` and `<b>` to normal weight when off |
| Columns (`tuiCols`) | 60 … 200 | `--pt-tui-cols`, the pane minimum width in `ch` |
| Rows (`tuiRows`) | 20 … 60 | `--pt-tui-rows`, the pane min-height |
| Border glyphs (`tuiBorders`) | single, rounded, double, heavy, ascii, none | transliterates box glyphs in every `.tui`; `html[data-tui-borders]` |
| Padding (`tuiPadding`) | 0 … 3 ch | `--pt-tui-pad` (inner padding of the pane) |
| Cursor (`tuiCursor`) | block, bar, underline | `html[data-tui-cursor]` |
| Cursor blink (`tuiBlink`) | on/off | `html[data-tui-blink]` |
| Window chrome (`tuiChrome`) | on/off | `html[data-tui-chrome]`; hides the titlebar, border radius and shadow |
| CRT scanlines (`tuiScanlines`) | on/off | `html[data-tui-scanlines]`; overlay on `.tui-window` |

Custom `extraControls` work exactly as for web prototypes (for example a `select` for "density: cozy/compact" that your variant script reads through `PT.tokens()`).

## Structural variant ideas

Variants must disagree about structure; the theme and glyph dials already cover "feel". Pick two to four of these that genuinely fit the tool:

- **Split panes**: list on the left, live preview or detail on the right; everything visible, needs width.
- **Tabbed single pane**: Queue / Diff / Checks tabs; fits 80 columns, one thing at a time.
- **List + preview drawer**: a full-width list with a short preview strip pinned at the bottom.
- **Dashboard of widgets**: several bordered boxes (status, sparkline, recent events) for monitoring tools.
- **Wizard / steps**: one question per screen with a progress line, for setup and migration CLIs.
- **Command palette first**: a prompt at the top, results below, like a fuzzy finder.
- **Log tail + status bar**: streaming output with a sticky header and key-hint footer, for long-running jobs.

TUI-specific content rules:

- Always include a **key hint bar** on the last line (`<span class="inv"> a </span> approve …`) and a **status line** (item count, filter, position). Users judge a TUI by whether they know what to press.
- Show the **focused pane and the selected row** explicitly (`sel` + `bold`, a `▸` marker, a highlighted title). A TUI with nothing selected reads as dead.
- Use **realistic data**: real-looking identifiers, ages, authors, mixed statuses, one long title that truncates with `…`.
- If the flow has a modal (confirm, help, filter), show it **as a second screen** (`data-screen="help"`) rather than a second variant; screens are navigable from the Deck with `[` and `]` and from your own script with `PT.go('help')`.
- Put the terminal title and size in the titlebar; it doubles as documentation of the assumed width.

## Screens

`data-screen` works in TUI variants exactly as in web variants: several `<div data-screen="list">…</div>` blocks (each holding its own `.tui-window`), the first one visible, the others with the `hidden` attribute, and an optional `screens` array in the manifest to name them. A list screen, a detail screen and a help overlay are the common trio.

## Compact example

A 60-column "deploy status" pane that shows the classes in use (shortened; real variants fill the rows):

```html
<template data-variant="status">
<div class="tui-stage"><div class="tui-window">
  <div class="tui-titlebar"><span class="dots"><i></i><i></i><i></i></span><span class="title">shipit · status · 60×14</span></div>
<pre class="tui"><span class="bold accent"> shipit</span> <span class="dim">prod · eu-west-1</span>                <span class="dim">? help  q quit</span>
┌ Services ────────────────────────────────────────────────┐
│<span class="sel bold"> ▸ api         v2.14.0  <span class="ok">● healthy</span>   3/3   12m ago     </span>│
│   web         v2.14.0  <span class="ok">● healthy</span>   2/2   12m ago      │
│   worker      v2.13.9  <span class="warn">● degraded</span>  1/2   41m ago      │
│   scheduler   v2.13.9  <span class="err">✗ down</span>      0/1   2h ago       │
├ Log ─────────────────────────────────────────────────────┤
│ <span class="dim">14:02:11</span> api      rollout complete                       │
│ <span class="dim">14:02:40</span> worker   <span class="warn">restart loop: OOMKilled</span>               │
└──────────────────────────────────────────────────────────┘
 <span class="inv"> r </span> rollback  <span class="inv"> l </span> logs  <span class="inv"> s </span> scale  <span class="inv"> j/k </span> move     <span class="dim">1/4</span>
 <span class="accent">›</span> <span class="cursor"> </span>
</pre>
</div></div>
</template>
```

Notes on the example: the selected row uses `sel` + `bold` and a `▸` marker; statuses use `ok`/`warn`/`err`; the last two lines are the key hints and the prompt with the cursor; every border glyph is single-line so the Border glyphs dial can restyle the whole frame.

## Handing off to real code

The export carries the chosen theme palette (resolved hex values inside `css` as `--pt-tui-*`), the font, columns and rows, and the border style. Map them like this when scaffolding the real TUI:

| Export value | Ink (React) | Bubble Tea (lipgloss) | Textual (Python) | ratatui (Rust) |
|---|---|---|---|---|
| `--pt-tui-accent`, `-fg`, `-dim`, `-ok`, `-warn`, `-err` | `<Text color="#…">` | `lipgloss.Color("#…")` in styles | CSS variables in the app's `.tcss` | `Style::default().fg(Color::Rgb(...))` |
| `--pt-tui-sel` (selected row) | `backgroundColor` | `.Background(...)` on the selected item style | `:focus` / `.-selected` rules | highlight style on `List`/`Table` |
| `tuiBorders` | `borderStyle="single|round|double|bold"` on `<Box>` | `lipgloss.NormalBorder()/RoundedBorder()/DoubleBorder()/ThickBorder()` | `border: solid|round|double|heavy` | `BorderType::Plain|Rounded|Double|Thick` |
| `tuiCols` × `tuiRows` | the layout you designed for; handle narrower with `useStdout().columns` | `tea.WindowSizeMsg` branches | `on_resize` / responsive CSS | `Layout` constraints |
| `tuiFont` | n/a (terminal decides) but note the assumed glyph width | n/a | n/a | n/a |

The variant's structure (which panes, which tabs, which key bindings) is the real deliverable; re-implement it in the framework's idioms rather than translating the `<pre>` literally.
