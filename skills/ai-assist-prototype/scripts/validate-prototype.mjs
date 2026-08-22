#!/usr/bin/env node
/**
 * validate-prototype.mjs : deterministic checks for a prototype built from
 * ai-assist-prototype/assets/template.html.
 *
 *   node validate-prototype.mjs <prototype.html> [--json] [--strict]
 *
 * Exit code 0 = no errors (warnings allowed), 1 = errors found (or, with
 * --strict, any warnings). Zero dependencies; Node 18+.
 *
 * What it checks
 *   - the manifest JSON parses and has the fields the harness needs
 *   - every manifest variant has a matching <template data-variant="…"> (and vice versa)
 *   - the harness block is present and intact enough to run
 *   - the file is self-contained: no external scripts/styles (Google Fonts allowed),
 *     remote images/iframes only warned about
 *   - extraControls / presets / variant token overrides reference real control ids
 *   - each variant's CSS actually consumes the token system (hardcoded colors,
 *     font-families, radii and shadows are warned about, because the Deck's dials
 *     cannot move them)
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const asJson = args.includes('--json');
const strict = args.includes('--strict');

if (!file) {
  console.error('Usage: node validate-prototype.mjs <prototype.html> [--json] [--strict]');
  process.exit(2);
}

const errors = [];
const warnings = [];
const info = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let html;
try {
  html = fs.readFileSync(file, 'utf8');
} catch (e) {
  console.error(`Cannot read ${file}: ${e.message}`);
  process.exit(2);
}
const bytes = Buffer.byteLength(html, 'utf8');
info.push(`file: ${path.resolve(file)} (${(bytes / 1024).toFixed(1)} KB)`);
if (bytes > 5 * 1024 * 1024) err(`File is ${(bytes / 1024 / 1024).toFixed(1)} MB. Prototypes should stay small enough to email; inline images are usually the culprit.`);
else if (bytes > 1.5 * 1024 * 1024) warn(`File is ${(bytes / 1024 / 1024).toFixed(1)} MB. Consider SVG/CSS placeholders instead of embedded photos.`);

/* ------------------------------------------------------------ manifest */
let manifest = null;
const mm = html.match(/<script[^>]*id=["']pt-manifest["'][^>]*>([\s\S]*?)<\/script>/i);
if (!mm) err('No <script type="application/json" id="pt-manifest"> block found.');
else {
  try { manifest = JSON.parse(mm[1]); }
  catch (e) { err(`Manifest JSON does not parse: ${e.message}`); }
}

/* ------------------------------------------------------------- harness */
const harnessMarker = html.match(/<!--\s*pt-harness v([\d.]+)\s*-->/);
const harnessScript = html.match(/<script[^>]*id=["']pt-harness["'][^>]*>([\s\S]*?)<\/script>\s*<\/body>/i);
if (!harnessMarker) err('Harness marker <!-- pt-harness vX.Y.Z --> is missing. Rebuild the file from assets/template.html.');
else info.push(`harness: v${harnessMarker[1]}`);
if (!harnessScript) err('Harness <script id="pt-harness"> is missing or is not the last script before </body>.');
else {
  for (const needle of ['__PT_BRIDGE__', 'buildHandoff', 'AI-ASSIST PROTOTYPE HANDOFF', 'pt-deck']) {
    if (!harnessScript[1].includes(needle)) err(`Harness looks modified or truncated (missing "${needle}"). Regenerate from assets/template.html and paste sections 1 and 2 back in.`);
  }
}
if (!/id=["']pt-stage["']/.test(html) || !/id=["']pt-deck["']/.test(html)) err('Harness DOM (#pt-stage / #pt-deck) is missing.');
if (/PROTOTYPE_NAME/.test(html)) warn('The <title> still says PROTOTYPE_NAME. Replace it with the prototype name.');

// Known control ids come from the harness itself so this script never drifts from the template.
const knownControlIds = new Set();
if (harnessScript) for (const m of harnessScript[1].matchAll(/\{\s*id:\s*'([A-Za-z0-9_]+)'\s*,\s*group:/g)) knownControlIds.add(m[1]);
const webIds = new Set([...knownControlIds].filter((id) => !id.startsWith('tui')));
const tuiIds = new Set([...knownControlIds].filter((id) => id.startsWith('tui')));
// Dial tiers are declared in the harness as strict JSON (`const TIERS = {...};`) so they can be read here without drift.
let TIERS = null;
if (harnessScript) { const tm = harnessScript[1].match(/const TIERS = (\{[^;]*\});/); if (tm) { try { TIERS = JSON.parse(tm[1]); } catch (e) { TIERS = null; } } }
const TIER_NAMES = ['none', 'essential', 'standard', 'full'];

/* ------------------------------------------------------------ templates */
const templates = new Map();
const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, '');
for (const m of htmlNoComments.matchAll(/<template\s+data-variant=["']([^"']+)["'][^>]*>([\s\S]*?)<\/template>/gi)) {
  if (templates.has(m[1])) err(`Duplicate <template data-variant="${m[1]}">.`);
  templates.set(m[1], m[2]);
}
if (!templates.size) err('No <template data-variant="…"> blocks found.');

/* ------------------------------------------------------- manifest rules */
let activeIds = knownControlIds;
if (manifest) {
  if (manifest.schema !== 'ai-assist-prototype/manifest@1') warn(`manifest.schema is "${manifest.schema}"; expected "ai-assist-prototype/manifest@1".`);
  if (!manifest.id || !/^[a-z0-9][a-z0-9-_]*$/i.test(String(manifest.id))) err('manifest.id must be a short slug (letters, digits, dashes). It keys the browser storage for this prototype.');
  if (manifest.id === 'example-prototype') warn('manifest.id is still "example-prototype". Give each prototype its own id so saved dial state does not collide.');
  if (!manifest.name) err('manifest.name is required.');
  if (!manifest.brief || String(manifest.brief).startsWith('Replace this')) warn('manifest.brief is missing or still the placeholder. The brief travels with every export, so state the design question.');
  const kind = manifest.kind || 'web';
  if (!['web', 'tui'].includes(kind)) err(`manifest.kind must be "web" or "tui" (got "${kind}").`);
  const controls = manifest.controls || kind;
  if (!['web', 'tui'].includes(controls)) err(`manifest.controls must be "web" or "tui" (got "${controls}").`);
  if (controls !== kind) warn(`manifest.kind is "${kind}" but manifest.controls is "${controls}". Usually they match.`);
  // activeIds = every control the harness knows for this set (hidden ones included: they are still valid keys in defaults/tokens).
  activeIds = new Set(controls === 'tui' ? tuiIds : webIds);
  const lockedIds = new Set();
  for (const id of (manifest.hideControls || [])) { if (!activeIds.has(id)) warn(`hideControls lists unknown control "${id}".`); else lockedIds.add(id); }

  // Dial tier: how much of the built-in set the Deck exposes.
  let exposed = null;
  if (manifest.dials == null) warn('manifest.dials is not set (the Deck defaults to "standard"). Right-size it: "none" | "essential" | "standard" | "full" | [control ids]. See SKILL.md "Right-size the Deck".');
  else if (Array.isArray(manifest.dials)) {
    exposed = new Set();
    for (const id of manifest.dials) { if (!activeIds.has(id)) warn(`manifest.dials lists unknown control "${id}".`); else exposed.add(id); }
    if (!exposed.size) warn('manifest.dials is an empty list; that equals "none". Write "none" if that is the intent.');
  } else if (!TIER_NAMES.includes(manifest.dials)) err(`manifest.dials must be one of ${TIER_NAMES.join(' | ')} or an array of control ids (got ${JSON.stringify(manifest.dials)}).`);
  else if (manifest.dials === 'full') exposed = new Set(activeIds);
  else if (TIERS && TIERS[controls] && TIERS[controls][manifest.dials]) exposed = new Set(TIERS[controls][manifest.dials]);
  if (exposed == null && TIERS && TIERS[controls]) exposed = new Set(TIERS[controls].standard);
  if (exposed) { for (const id of lockedIds) exposed.delete(id); }
  if (manifest.hidePresets != null && manifest.hidePresets !== true && manifest.hidePresets !== false && !Array.isArray(manifest.hidePresets)) err('manifest.hidePresets must be true or an array of preset names.');
  const nExposed = exposed ? [...exposed].filter((id) => !['warmth', 'energy', 'mode'].includes(id)).length : null;
  if (exposed) info.push(`deck: dials ${Array.isArray(manifest.dials) ? '[custom list]' : (manifest.dials || 'standard (default)')} · ${nExposed} built-in dial(s) exposed${lockedIds.size ? ` · locked: ${[...lockedIds].join(', ')}` : ''}${manifest.hidePresets === true ? ' · built-in presets hidden' : ''}`);
  if (exposed && nExposed === 0 && (manifest.hidePresets === true || manifest.hidePresets == null) && manifest.dials !== 'none' && !Array.isArray(manifest.dials)) warn('Every built-in dial is hidden; set "dials": "none" instead of hiding them one by one.');

  const extra = manifest.extraControls || [];
  const validTypes = ['range', 'select', 'segment', 'toggle', 'font', 'color', 'text'];
  const seenExtra = new Set();
  for (const c of extra) {
    if (!c || !c.id) { err('An extraControls entry has no id.'); continue; }
    if (seenExtra.has(c.id) || activeIds.has(c.id)) err(`extraControls id "${c.id}" collides with another control.`);
    seenExtra.add(c.id); activeIds.add(c.id);
    if (!validTypes.includes(c.type)) err(`extraControls "${c.id}" has unknown type "${c.type}" (valid: ${validTypes.join(', ')}).`);
    if (c.type === 'range' && (typeof c.min !== 'number' || typeof c.max !== 'number')) err(`extraControls "${c.id}" (range) needs numeric min and max.`);
    if ((c.type === 'select' || c.type === 'segment') && !Array.isArray(c.options)) err(`extraControls "${c.id}" (${c.type}) needs an options array.`);
    if (c.default === undefined) warn(`extraControls "${c.id}" has no default; the dial will start empty.`);
    if (c.var && !/^--[A-Za-z0-9_-]+$/.test(c.var)) err(`extraControls "${c.id}".var must be a CSS custom property name like "--x-sidebar-w".`);
    if (!c.var) warn(`extraControls "${c.id}" has no "var"; only scripts (PT.tokens()) can read it, CSS cannot.`);
    else if (![...templates.values()].some((t) => t.includes(c.var))) warn(`extraControls "${c.id}" sets ${c.var} but no variant references it.`);
  }
  if (extra.length > 8) warn(`${extra.length} extraControls. Custom dials should be the few things this prototype's user will actually want to tune; fold the rest into variant defaults.`);
  const checkTokenKeys = (obj, where) => { for (const k of Object.keys(obj || {})) if (!activeIds.has(k)) warn(`${where} sets unknown control "${k}" (it will be ignored).`); };
  checkTokenKeys(manifest.defaults, 'manifest.defaults');
  for (const [name, p] of Object.entries(manifest.presets || {})) {
    checkTokenKeys(p, `preset "${name}"`);
    for (const k of Object.keys(p || {})) if (lockedIds.has(k)) warn(`preset "${name}" sets "${k}", which hideControls locks; presets never move locked dials, so that key is ignored.`);
  }

  if (!Array.isArray(manifest.variants) || !manifest.variants.length) err('manifest.variants must be a non-empty array.');
  else {
    const ids = new Set();
    manifest.variants.forEach((v, i) => {
      if (!v || !v.id) { err(`variants[${i}] has no id.`); return; }
      if (ids.has(v.id)) err(`Duplicate variant id "${v.id}".`);
      ids.add(v.id);
      if (!v.name) warn(`Variant "${v.id}" has no name (shown in the Deck and the export).`);
      if (!v.thesis) warn(`Variant "${v.id}" has no thesis. One line on what this variant bets on helps the user compare and the agent interpret the export.`);
      if (!templates.has(v.id)) err(`Variant "${v.id}" has no <template data-variant="${v.id}">.`);
      checkTokenKeys(v.tokens, `variant "${v.id}".tokens`);
      const tpl = templates.get(v.id) || '';
      const screenIdsInTpl = [...tpl.matchAll(/data-screen=["']([^"']+)["']/g)].map((m) => m[1]);
      if (Array.isArray(v.screens) && v.screens.length) {
        for (const s of v.screens) { const sid = typeof s === 'string' ? s : s && s.id; if (sid && !screenIdsInTpl.includes(sid)) warn(`Variant "${v.id}" declares screen "${sid}" but its template has no element with data-screen="${sid}".`); }
      } else if (screenIdsInTpl.length > 1) info.push(`variant "${v.id}": ${[...new Set(screenIdsInTpl)].length} screens discovered from data-screen attributes`);
    });
    for (const id of templates.keys()) if (!ids.has(id)) warn(`<template data-variant="${id}"> exists but is not listed in manifest.variants (it will never show).`);
    if (manifest.variants.length === 1 && manifest.variants[0].id === 'a' && /Starter variant/.test(templates.get('a') || '')) warn('The starter example variant is still in the file. Replace it with real variants.');
    if (manifest.variants.length > 5) warn(`${manifest.variants.length} variants. More than five stops being meaningfully different; consider trimming.`);
  }
}

/* ------------------------------------------------- self-containment */
const stripHarness = harnessScript ? html.replace(harnessScript[0], '') : html;
for (const m of stripHarness.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)) err(`External script "${m[1]}". Prototypes must be self-contained (inline the code).`);
for (const m of stripHarness.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)) {
  if (!/^https:\/\/fonts\.googleapis\.com\//.test(m[1])) err(`External stylesheet "${m[1]}". Only Google Fonts are allowed (they degrade gracefully offline).`);
}
for (const m of stripHarness.matchAll(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi)) {
  if (!/^https:\/\/fonts\.googleapis\.com\//.test(m[1])) err(`External stylesheet "${m[1]}". Only Google Fonts are allowed.`);
}
const remoteImgs = [...stripHarness.matchAll(/<(?:img|source|video|audio)[^>]*\ssrc=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]);
if (remoteImgs.length) warn(`${remoteImgs.length} remote media URL(s) (e.g. ${remoteImgs[0]}). They break offline and can change; prefer inline SVG, CSS art, or small data: URIs.`);
for (const m of stripHarness.matchAll(/<iframe[^>]*\ssrc=["'](https?:\/\/[^"']+)["']/gi)) warn(`Remote iframe "${m[1]}".`);
for (const m of stripHarness.matchAll(/@import\s+(?:url\()?["']?(https?:\/\/[^"')]+)/gi)) { if (!/fonts\.googleapis\.com/.test(m[1])) err(`CSS @import of "${m[1]}". Inline it.`); }
for (const m of stripHarness.matchAll(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/g)) { warn(`Network call (${m[0].trim()}) found in a variant. Prototypes should run on in-memory data.`); break; }

/* ------------------------------------------------------ token lint */
function lintVariant(id, tpl, kind) {
  const styles = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  const inline = [...tpl.matchAll(/\sstyle=["']([^"']*)["']/gi)].map((m) => m[1]).join(';\n');
  const css = styles + '\n' + inline;
  if (!styles.trim() && !inline.trim()) { info.push(`variant "${id}": no CSS (relies on base styles only)`); return; }
  const declsWithoutVar = (prop) => [...css.matchAll(new RegExp(`(?:^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, 'gi'))].map((m) => m[1].trim()).filter((v) => !/var\(--/.test(v));
  const hardColors = [...css.matchAll(/(?:#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\()/gi)].filter((m) => {
    const before = css.slice(Math.max(0, m.index - 40), m.index);
    return !/var\(--[^)]*$/.test(before) && !/url\([^)]*$/.test(before) && !/--[\w-]+\s*:\s*[^;]*$/.test(before);
  });
  const tokenRefs = (css.match(/var\(--pt-/g) || []).length;
  if (!tokenRefs) warn(`variant "${id}": no var(--pt-…) references at all. The Deck's dials will not move this variant. See references/token-contract.md.`);
  if (hardColors.length) warn(`variant "${id}": ${hardColors.length} hardcoded color(s) (${[...new Set(hardColors.map((m) => m[0]))].slice(0, 4).join(', ')}…). Use --pt-bg/--pt-surface/--pt-text/--pt-accent… so Color dials work. Decorative illustrations are the acceptable exception.`);
  const fams = declsWithoutVar('font-family');
  if (fams.length) warn(`variant "${id}": ${fams.length} font-family declaration(s) not using --pt-font-display/--pt-font-body/--pt-font-mono (e.g. "${fams[0].slice(0, 40)}").`);
  const radii = declsWithoutVar('border-radius').filter((v) => !/^(0|50%|9999px|999px|100%|inherit|0px)$/.test(v)).filter((v) => !/^(?:[0-4](?:\.\d+)?px\s*)+$/.test(v));
  if (radii.length) warn(`variant "${id}": ${radii.length} border-radius value(s) not using --pt-radius/--pt-radius-sm/lg/xl/full (e.g. "${radii[0]}").`);
  const shadows = declsWithoutVar('box-shadow').filter((v) => !/^(none|inherit)$/.test(v));
  if (shadows.length) warn(`variant "${id}": ${shadows.length} box-shadow value(s) not using --pt-shadow-sm/md/lg (e.g. "${shadows[0].slice(0, 40)}").`);
  if (kind !== 'tui') {
    const fontSizes = declsWithoutVar('font-size').filter((v) => /px|rem|em/.test(v));
    if (fontSizes.length > 2) warn(`variant "${id}": ${fontSizes.length} fixed font-size value(s). Prefer --pt-t-xs … --pt-t-5xl so the type dials work.`);
    const spacing = [...css.matchAll(/(?:^|[;{\s])(?:padding|margin|gap|row-gap|column-gap)(?:-[a-z]+)?\s*:\s*([^;}]+)/gi)].map((m) => m[1]).filter((v) => /\d+px/.test(v) && !/var\(--pt-s/.test(v));
    if (spacing.length > 6) warn(`variant "${id}": ${spacing.length} spacing declarations use fixed px instead of --pt-s-1 … --pt-s-9; the Density dial will not affect them.`);
  } else {
    if (!/class=["'][^"']*\btui\b/.test(tpl)) warn(`variant "${id}" (TUI): no <pre class="tui"> found; the terminal dials target .tui elements.`);
  }
  if (/<script[\s\S]*?<\/script>/i.test(tpl) && !/PT\./.test(tpl)) info.push(`variant "${id}": has a script that does not use the PT bridge (fine if it is self-contained)`);
}
if (manifest && Array.isArray(manifest.variants)) for (const v of manifest.variants) if (v && templates.has(v.id)) lintVariant(v.id, templates.get(v.id), manifest.kind || 'web');

/* --------------------------------------------------------------- report */
const result = { file: path.resolve(file), ok: errors.length === 0 && (!strict || warnings.length === 0), errors, warnings, info };
if (asJson) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`ai-assist-prototype validator · ${path.basename(file)}`);
  for (const i of info) console.log(`  · ${i}`);
  if (manifest && Array.isArray(manifest.variants)) console.log(`  · ${manifest.variants.length} variant(s): ${manifest.variants.map((v) => v && v.id).join(', ')} · kind ${manifest.kind || 'web'}`);
  for (const e of errors) console.log(`  ✖ ${e}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s). Fix the errors before handing the prototype over.` : `\nOK · 0 errors, ${warnings.length} warning(s).`);
}
process.exit(result.ok ? 0 : 1);
