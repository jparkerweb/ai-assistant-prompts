"use strict"

// Shell-free execution layer for the ai-assist-git-pr skill.
//
// Every gh/git call goes through execFileSync with an ARGUMENT ARRAY, never a
// shell string. Node passes argv straight to the binary, so there is no shell
// to interpret &&, heredocs (<<'EOF'), or the `gh api graphql -f key:value`
// literal-parsing quirk. The same script runs identically under bash,
// PowerShell, cmd, git-bash, WSL, and CI — no shell detection, no per-OS branch.

const { execFileSync } = require("child_process")

// Run a binary with an arg array. Returns trimmed stdout. On failure throws an
// Error whose message includes the binary, args, and captured stderr/stdout.
const run = (bin, args, opts = {}) => {
	try {
		return execFileSync(bin, args, {
			encoding: "utf8",
			maxBuffer: 64 * 1024 * 1024,
			stdio: ["pipe", "pipe", "pipe"],
			input: opts.input,
			cwd: opts.cwd,
		}).trim()
	} catch (e) {
		const stderr = (e.stderr || "").toString().trim()
		const stdout = (e.stdout || "").toString().trim()
		const detail = stderr || stdout || e.message
		const err = new Error(`${bin} ${args.join(" ")}\n${detail}`)
		err.status = typeof e.status === "number" ? e.status : 1
		err.stdout = stdout
		err.stderr = stderr
		throw err
	}
}

const gh = (args, opts) => run("gh", args, opts)
const git = (args, opts) => run("git", args, opts)

const ghJson = (args, opts) => {
	const out = gh(args, opts)
	return out ? JSON.parse(out) : null
}

// GraphQL via gh, passing dynamic values ONLY as typed -F/-f variables. This is
// the fix for values that gh's literal parser mangles: repo names with hyphens
// (tap-db_UI), integers (number:889), and node IDs with underscores
// (PRRT_kwDOEP1_Gs6QBYPj). `vars` maps name -> {value, raw}; raw:true emits -F
// (typed: Int/ID/Boolean), otherwise -f (string).
const ghGraphql = (query, vars = {}) => {
	const args = ["api", "graphql", "-f", `query=${query}`]
	for (const [name, spec] of Object.entries(vars)) {
		const flag = spec && spec.raw ? "-F" : "-f"
		const value = spec && Object.hasOwn(spec, "value") ? spec.value : spec
		args.push(flag, `${name}=${value}`)
	}
	const out = gh(args)
	const parsed = out ? JSON.parse(out) : null
	if (parsed && parsed.errors)
		throw new Error("GraphQL error: " + JSON.stringify(parsed.errors))
	return parsed
}

const parseArgs = (argv) => {
	const args = {}
	const positional = []
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i]
		if (arg.startsWith("--")) {
			const [key, ...rest] = arg.slice(2).split("=")
			args[key] = rest.length
				? rest.join("=")
				: argv[i + 1] && !argv[i + 1].startsWith("--")
					? argv[++i]
					: true
		} else {
			positional.push(arg)
		}
	}
	return { ...args, _: positional }
}

// Honor an optional --cwd/--repo flag so a script can run against a repo without
// relying on the shell's working directory. This matters in multi-repo
// workspaces (cwd may be a different repo) and on setups where a persistent
// shell session does NOT survive between tool calls — so a separate `cd` step
// followed by `node <script>` is not reliable. Applied once at startup via
// process.chdir; every gh/git call inherits the process cwd, so nothing else
// needs threading. No-op when the flag is absent.
const applyCwd = (args) => {
	const dir = args && (args.cwd || args.repo)
	if (dir && dir !== true) process.chdir(dir)
}

const readStdin = () =>
	new Promise((resolve) => {
		if (process.stdin.isTTY) return resolve(null)
		let data = ""
		process.stdin.setEncoding("utf8")
		process.stdin.on("data", (chunk) => (data += chunk))
		process.stdin.on("end", () => {
			try {
				resolve(JSON.parse(data))
			} catch {
				resolve(data.trim() || null)
			}
		})
	})

const output = (data) =>
	console.log(
		typeof data === "string" ? data : JSON.stringify(data, null, "\t")
	)

const fail = (msg) => {
	console.error(typeof msg === "string" ? msg : msg && msg.message)
	process.exitCode = 1
	process.exit()
}

// owner/repo from gh; falls back to parsing the origin remote URL.
const repoSlug = () => {
	try {
		const r = ghJson(["repo", "view", "--json", "owner,name"])
		if (r && r.owner && r.name) return { owner: r.owner.login, repo: r.name }
	} catch {
		/* fall through to remote parse */
	}
	const url = git(["remote", "get-url", "origin"])
	const m = url.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/)
	if (!m) throw new Error("Could not determine owner/repo from origin: " + url)
	return { owner: m[1], repo: m[2] }
}

// Ticket ID from a branch name like prefix/PROJECT-11555-description.
const ticketFromBranch = (branch) => {
	const m = (branch || "").match(/([A-Z][A-Z0-9]+-\d+)/)
	return m ? m[1] : null
}

module.exports = {
	run,
	gh,
	git,
	ghJson,
	ghGraphql,
	parseArgs,
	applyCwd,
	readStdin,
	output,
	fail,
	repoSlug,
	ticketFromBranch,
}
