#!/usr/bin/env node
"use strict"

// Read-only. Fetches BOTH comment streams for a PR and returns normalized JSON:
//   - inline: line-anchored review comments (path + line), where Copilot/humans
//     leave code feedback
//   - issue: general PR conversation comments (no file/line)
// Replaces the two hand-written `gh api ... --jq` snippets so the jq shape can
// never drift and quoting is never an issue.
//
// Usage:
//   node fetch-comments.cjs [--number <N>] [--cwd <repo-dir>]

const { gh, ghJson, parseArgs, applyCwd, output, fail, repoSlug } = require("./lib.cjs")

function prNumber(args) {
	if (args.number) return String(args.number)
	const pr = ghJson(["pr", "view", "--json", "number,state"])
	if (!pr) throw new Error("No PR found for the current branch.")
	if (pr.state !== "OPEN")
		throw new Error(`PR #${pr.number} is ${pr.state}. Comments can only be reviewed on OPEN PRs.`)
	return String(pr.number)
}

function main() {
	const args = parseArgs(process.argv)
	applyCwd(args)
	const { owner, repo } = repoSlug()
	const number = prNumber(args)

	// Inline review comments — paginated to cover large reviews.
	const raw = JSON.parse(
		gh([
			"api",
			"--paginate",
			`repos/${owner}/${repo}/pulls/${number}/comments`,
		])
	)
	const inline = raw.map((c) => ({
		id: c.id,
		author: c.user && c.user.login,
		body: c.body,
		path: c.path,
		line: c.original_line != null ? c.original_line : c.line,
		side: c.side,
		diffHunk: c.diff_hunk,
		inReplyToId: c.in_reply_to_id || null,
		createdAt: c.created_at,
		url: c.html_url,
	}))

	// Issue-level comments.
	const issueRaw = ghJson(["pr", "view", number, "--json", "comments"])
	const issue = ((issueRaw && issueRaw.comments) || []).map((c) => ({
		author: c.author && c.author.login,
		body: c.body,
		createdAt: c.createdAt,
		url: c.url,
	}))

	output({ owner, repo, number: Number(number), inline, issue })
}

try {
	main()
} catch (e) {
	fail(e)
}
