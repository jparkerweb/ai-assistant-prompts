#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "jparkerweb/ai-assist-skills";
const PREFIX = "ai-assist-";

// --- Colors ---
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  white: "\x1b[97m",
  gray: "\x1b[90m",
};

// --- Version ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const skillsDir = join(repoRoot, "skills");
let version = "?";
try {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
  version = pkg.version;
} catch {}

// --- Banner (figlet "standard" font, assembled from glyphs) ---
const GLYPHS = {
  A: ["    _    ", "   / \\   ", "  / _ \\  ", " / ___ \\ ", "/_/   \\_\\"],
  I: [" ___ ", "|_ _|", " | | ", " | | ", "|___|"],
  "-": ["       ", "       ", "  ___  ", " |___| ", "       "],
  S: [" ____  ", "/ ___| ", "\\___ \\ ", " ___) |", "|____/ "],
  T: [" _____ ", "|_   _|", "  | |  ", "  | |  ", "  |_|  "],
};
const bannerLines = [];
const word = "AI-ASSIST".split("");
for (let row = 0; row < 5; row++) {
  bannerLines.push(word.map((ch) => GLYPHS[ch][row]).join(""));
}
const banner = `
${c.cyan}${bannerLines.join("\n")}${c.reset}
      ${c.white}${c.bold}S K I L L S   S Y N C${c.reset}  ${c.dim}v${version}${c.reset}
`;

function run(cmd, { silent = false } = {}) {
  try {
    return execSync(cmd, {
      cwd: skillsDir,
      encoding: "utf-8",
      stdio: silent ? ["pipe", "pipe", "pipe"] : ["pipe", "pipe", "inherit"],
    }).trim();
  } catch {
    return "";
  }
}

function runInteractive(cmd) {
  try {
    execSync(cmd, { cwd: skillsDir, stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

function step(num, msg) {
  console.log(`${c.cyan}${c.bold}[${num}/3]${c.reset} ${msg}`);
}

function ok(msg) {
  console.log(`  ${c.green}+${c.reset} ${msg}`);
}

function info(msg) {
  console.log(`  ${c.gray}${msg}${c.reset}`);
}

function fail(msg) {
  console.error(`  ${c.red}x${c.reset} ${msg}`);
}

// --- Main ---
console.log(banner);

// --- Step 1: Discover installed ai-assist-* skills ---
step(1, "Scanning installed global skills...");

const json = run("npx skills list -g --json", { silent: true });
if (!json) {
  fail("No global skills found or skills CLI not available.");
  process.exit(1);
}

let allSkills;
try {
  allSkills = JSON.parse(json);
} catch {
  fail("Failed to parse skills list output.");
  process.exit(1);
}

const installedSkills = allSkills.filter((s) => s.name.startsWith(PREFIX));

if (installedSkills.length === 0) {
  info(`No ${PREFIX}* skills currently installed.`);
} else {
  console.log(`  Found ${c.yellow}${installedSkills.length}${c.reset} ${PREFIX}* skill(s) installed:`);
  installedSkills.forEach((s) => info(`  - ${s.name}`));
}

// --- Step 2: Remove each ai-assist-* skill ---
if (installedSkills.length > 0) {
  console.log();
  step(2, `Removing ${c.yellow}${installedSkills.length}${c.reset} installed ${PREFIX}* skills...`);
  for (const skill of installedSkills) {
    process.stdout.write(`  ${c.gray}Removing ${skill.name}...${c.reset}`);
    run(`npx skills remove ${skill.name} -g -y`, { silent: true });
    console.log(` ${c.green}done${c.reset}`);
  }
} else {
  console.log();
  step(2, `${c.dim}Skipping removal (nothing to remove).${c.reset}`);
}

// --- Step 3: Install skills from /skills directory only ---
console.log();
let skillDirs;
try {
  skillDirs = readdirSync(skillsDir).filter((entry) =>
    statSync(join(skillsDir, entry)).isDirectory()
  );
} catch {
  fail(`Could not read skills directory: ${skillsDir}`);
  process.exit(1);
}

step(3, `Select from ${c.yellow}${skillDirs.length}${c.reset} skills in the local ${c.white}${REPO}/skills${c.reset} clone:`);
if (!runInteractive(`npx skills add "${skillsDir}" -g`)) {
  fail("Skills installation canceled or failed.");
  process.exit(1);
}

// --- Done ---
console.log(`
${c.green}${c.bold}  Sync complete!${c.reset} ${c.dim}Selected ${PREFIX}* skills updated.${c.reset}
`);
