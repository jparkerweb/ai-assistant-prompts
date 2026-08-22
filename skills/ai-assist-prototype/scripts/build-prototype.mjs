#!/usr/bin/env node
/**
 * build-prototype.mjs : assemble a self-contained prototype from a "parts" file
 * (your manifest + variant templates) and the skill's harness template.
 *
 *   node build-prototype.mjs --parts <parts.html> --out <prototype.html> [--title "Name"] [--template <template.html>] [--no-validate]
 *
 * The parts file contains ONLY what you author:
 *   <script type="application/json" id="pt-manifest">{ ... }</script>
 *   <template data-variant="a"> ... </template>
 *   <template data-variant="b"> ... </template>
 *
 * This script splices those into assets/template.html (sections 1 and 2),
 * sets the <title>, writes the output, and runs validate-prototype.mjs on it.
 * You never have to copy or retype the harness by hand.
 *
 * Rebuilding is idempotent: run it again after editing the parts file.
 * Zero dependencies; Node 18+.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt; };
const partsPath = opt('parts');
const outPath = opt('out');
const templatePath = opt('template', path.join(here, '..', 'assets', 'template.html'));
const titleArg = opt('title');
const noValidate = args.includes('--no-validate');

if (!partsPath || !outPath) {
  console.error('Usage: node build-prototype.mjs --parts <parts.html> --out <prototype.html> [--title "Name"] [--template <template.html>] [--no-validate]');
  process.exit(2);
}
const read = (p, what) => { try { return fs.readFileSync(p, 'utf8'); } catch (e) { console.error(`Cannot read ${what} at ${p}: ${e.message}`); process.exit(2); } };
const template = read(templatePath, 'harness template');
const parts = read(partsPath, 'parts file');

// Locate the editable region in the template: from the MANIFEST marker up to (not including) the HARNESS marker.
const startMarker = template.indexOf('<!-- ======================= 1. MANIFEST (edit)');
const endMarker = template.indexOf('<!-- ======================= 3. HARNESS (do not edit)');
if (startMarker < 0 || endMarker < 0 || endMarker <= startMarker) {
  console.error('The template is missing its section markers (1. MANIFEST / 3. HARNESS). Restore assets/template.html from the skill.');
  process.exit(2);
}

// Sanity-check the parts.
const manifestMatch = parts.match(/<script[^>]*id=["']pt-manifest["'][^>]*>([\s\S]*?)<\/script>/i);
if (!manifestMatch) { console.error('The parts file has no <script type="application/json" id="pt-manifest"> block.'); process.exit(1); }
let manifest;
try { manifest = JSON.parse(manifestMatch[1]); } catch (e) { console.error('Manifest JSON in the parts file does not parse: ' + e.message); process.exit(1); }
const partsNoComments = parts.replace(/<!--[\s\S]*?-->/g, '');
const templateIds = [...partsNoComments.matchAll(/<template\s+data-variant=["']([^"']+)["']/gi)].map((m) => m[1]);
if (!templateIds.length) { console.error('The parts file has no <template data-variant="…"> blocks.'); process.exit(1); }
if (/<script[^>]*id=["']pt-harness["']/i.test(parts)) { console.error('The parts file contains a harness block. Parts must hold only the manifest and the variant templates.'); process.exit(1); }

const name = titleArg || manifest.name || 'Prototype';
let out = template.slice(0, startMarker)
  + '<!-- ======================= 1. MANIFEST (edit) ======================= -->\n'
  + parts.trim() + '\n\n'
  + template.slice(endMarker);
out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>' + String(name).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])) + ' · prototype</title>');

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, out);
console.log(`Built ${path.resolve(outPath)} (${(Buffer.byteLength(out, 'utf8') / 1024).toFixed(1)} KB) · ${templateIds.length} variant template(s): ${templateIds.join(', ')}`);

if (!noValidate) {
  const validator = path.join(here, 'validate-prototype.mjs');
  if (fs.existsSync(validator)) {
    const r = spawnSync(process.execPath, [validator, outPath], { stdio: 'inherit' });
    process.exit(r.status == null ? 1 : r.status);
  }
}
