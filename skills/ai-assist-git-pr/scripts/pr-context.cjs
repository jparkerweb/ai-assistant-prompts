#!/usr/bin/env node
"use strict"

// Read-only. Resolves the working PR context in one shot: owner/repo, PR number
// and state, branch, base branch, title, timestamps, and the derived ticket id.
// Replaces the chained `git branch && gh repo view && gh pr view` commands
// that broke under PowerShell (no && operator).
//
// Usage:
//   node pr-context.cjs [--number <N>] [--cwd <repo-dir>]
// If --number is omitted, resolves the PR for the current branch (if any).
// --cwd runs against a repo without a separate shell `cd` (multi-repo / non-
// persistent shell sessions).

const { gh, ghJson, git, parseArgs, applyCwd, output, fail, repoSlug, ticketFromBranch } = require("./lib.cjs")

function main() {
	const args = parseArgs(process.argv)
	applyCwd(args)
	const { owner, repo } = repoSlug()

	const branch = git(["branch", "--show-current"])

	let defaultBranch = null
	try {
		const dr = ghJson(["repo", "view", "--json", "defaultBranchRef"])
		defaultBranch = dr?.defaultBranchRef?.name || null
	} catch {
		/* non-fatal */
	}

	const fields = "number,url,title,state,headRefName,baseRefName,createdAt,isDraft"
	let pr = null
	try {
		const viewArgs = ["pr", "view", "--json", fields]
		if (args.number) viewArgs.splice(2, 0, String(args.number))
		pr = JSON.parse(gh(viewArgs))
	} catch (e) {
		// gh exits non-zero when no PR exists for the branch — that is a valid state.
		// Match only the "no pull requests" message; other exit-1 failures
		// (auth, network, rate limit) must surface rather than be masked as pr: null.
		if (/no( default)? pull requests?/i.test(e.stderr || "")) {
			pr = null
		} else {
			throw e
		}
	}

	output({
		owner,
		repo,
		branch,
		defaultBranch,
		ticketId: ticketFromBranch(branch),
		pr: pr
			? {
					number: pr.number,
					url: pr.url,
					title: pr.title,
					state: pr.state,
					isDraft: pr.isDraft,
					headRefName: pr.headRefName,
					baseRefName: pr.baseRefName,
					createdAt: pr.createdAt,
				}
			: null,
	})
}

try {
	main()
} catch (e) {
	fail(e)
}
