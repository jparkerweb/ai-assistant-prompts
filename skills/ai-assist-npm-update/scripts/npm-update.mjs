#!/usr/bin/env node
// ai-assist-npm-update
//
// Finds every package.json under the current working directory (skipping
// node_modules and other vendored/VCS folders), runs `npm outdated` for each,
// bumps every outdated dependency to its "wanted" version prefixed with `^`,
// and runs `npm install` in each project that changed.
//
// Flags:
//   --dry-run   Show what would change, but don't write package.json or install.
//   --root <p>  Search root (defaults to process.cwd()).
//
// Exit code is 0 on success, 1 if any project failed to update or install.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rootIdx = args.indexOf("--root");
const ROOT = rootIdx !== -1 && args[rootIdx + 1] ? args[rootIdx + 1] : process.cwd();

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "bower_components",
  "vendor",
  ".next",
  ".nuxt",
  "dist",
  "build",
  "coverage",
]);

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

// Use execSync with plain command strings so the platform shell resolves npm
// (on Windows the `npm.cmd` shim must run through a shell). All commands below
// are static — no interpolation of untrusted input — so this is injection-safe.

/** Recursively collect package.json paths, skipping vendored/VCS dirs. */
function findPackageJsons(dir, found = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      findPackageJsons(full, found);
    } else if (entry.isFile() && entry.name === "package.json") {
      found.push(full);
    }
  }
  return found;
}

/** Detect the JSON indentation used by a raw file (defaults to 2 spaces). */
function detectIndent(raw) {
  const m = raw.match(/^[ \t]+(?="|')/m);
  if (!m) return 2;
  return m[0].includes("\t") ? "\t" : m[0].length;
}

/** Run `npm outdated --json` in dir. npm exits 1 when packages are outdated,
 *  so capture stdout regardless of exit code. Returns parsed object or {}. */
function getOutdated(dir) {
  let stdout = "";
  try {
    stdout = execSync("npm outdated --json --long", {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    // Exit code 1 (outdated found) lands here with output on err.stdout.
    stdout = err.stdout ? err.stdout.toString() : "";
  }
  if (!stdout.trim()) return {};
  try {
    return JSON.parse(stdout);
  } catch {
    return {};
  }
}

const SEMVERISH = /^\d+\.\d+\.\d+/;

function processProject(pkgPath) {
  const dir = pkgPath.slice(0, -"package.json".length) || ".";
  const rel = relative(ROOT, pkgPath) || "package.json";

  const outdated = getOutdated(dir);
  const names = Object.keys(outdated);
  if (names.length === 0) {
    console.log(`✓ ${rel} — all dependencies up to date`);
    return { changed: false, ok: true };
  }

  let raw, pkg;
  try {
    raw = readFileSync(pkgPath, "utf8");
    pkg = JSON.parse(raw);
  } catch (err) {
    console.error(`  ✗ ${rel} — could not read or parse: ${err.message}`);
    return { changed: false, ok: false };
  }
  const indent = detectIndent(raw);

  const changes = [];
  for (const name of names) {
    // A package can map to an array if multiple dependents request it.
    const info = Array.isArray(outdated[name]) ? outdated[name][0] : outdated[name];
    const wanted = info && info.wanted;
    if (!wanted || !SEMVERISH.test(wanted)) continue; // skip git/url/MISSING specs

    for (const field of DEP_FIELDS) {
      if (pkg[field] && Object.prototype.hasOwnProperty.call(pkg[field], name)) {
        const before = pkg[field][name];
        const after = `^${wanted}`;
        if (before !== after) {
          pkg[field][name] = after;
          changes.push({ name, field, before, after });
        }
      }
    }
  }

  if (changes.length === 0) {
    console.log(`✓ ${rel} — outdated reported, but no version specs needed changing`);
    return { changed: false, ok: true };
  }

  console.log(`\n${dryRun ? "[dry-run] " : ""}${rel} — ${changes.length} dependenc${changes.length === 1 ? "y" : "ies"} to bump:`);
  for (const c of changes) {
    console.log(`    ${c.name} (${c.field}): ${c.before} → ${c.after}`);
  }

  if (dryRun) return { changed: true, ok: true };

  const trailingNewline = raw.endsWith("\n") ? "\n" : "";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + trailingNewline);

  console.log(`    running npm install in ${dir} ...`);
  try {
    execSync("npm install", { cwd: dir, stdio: "inherit" });
    console.log(`    ✓ installed`);
    return { changed: true, ok: true };
  } catch {
    console.error(`    ✗ npm install failed in ${dir}`);
    return { changed: true, ok: false };
  }
}

function main() {
  console.log(`Searching for package.json files under: ${ROOT}`);
  const pkgs = findPackageJsons(ROOT);
  if (pkgs.length === 0) {
    console.log("No package.json files found.");
    return;
  }
  console.log(`Found ${pkgs.length} package.json file(s).\n`);

  let changedCount = 0;
  let failed = 0;
  for (const pkgPath of pkgs) {
    const res = processProject(pkgPath);
    if (res.changed) changedCount++;
    if (!res.ok) failed++;
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(
    `Summary: ${pkgs.length} project(s) scanned, ${changedCount} updated${dryRun ? " (dry-run, nothing written)" : ""}.`
  );
  if (failed > 0) {
    console.error(`${failed} project(s) had a failed npm install.`);
    process.exit(1);
  }
}

main();
