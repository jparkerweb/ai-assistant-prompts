#!/usr/bin/env node
"use strict"

// WRITE / GATED. Posts replies to addressed inline comments and resolves their
// review threads in one batch. MUST only be run after the skill's batch-reply
// approval gate — it is the executor, not the approval.
//
// Reply bodies (which contain newlines, backticks, `<`/`>`, and code) are passed
// as `-f body=<value>` argv entries, so there is no heredoc and no shell quoting
// to get wrong. Thread ids (underscored node ids) are passed as typed -F GraphQL
// variables, sidestepping gh's literal parser.
//
// Input is a JSON payload via --file <path> (preferred) or stdin:
//   {
//     "number": 889,
//     "replies": [
//       { "commentId": 3562181244, "threadId": "PRRT_...", "body": "Fixed in <sha>. ..." }
//     ]
//   }
// threadId is optional per item; when present and not already resolved, the
// thread is resolved after its reply posts. Use --dry-run to preview actions.
// --cwd <repo-dir> runs against a repo without a separate shell `cd` (pass an
// absolute --file path when combining with --cwd).

const fs = require("fs")
const path = require("path")
const { gh, ghGraphql, parseArgs, applyCwd, readStdin, output, fail, repoSlug } = require("./lib.cjs")

const RESOLVE = `mutation($threadId:ID!){
  resolveReviewThread(input:{threadId:$threadId}){ thread{ isResolved } }
}`

async function loadPayload(args) {
	if (args.file) return JSON.parse(fs.readFileSync(args.file, "utf8"))
	const stdin = await readStdin()
	if (!stdin || typeof stdin !== "object")
		throw new Error("No payload. Pass --file <path> or pipe JSON via stdin.")
	return stdin
}

async function main() {
	const args = parseArgs(process.argv)
	// Resolve --file against the ORIGINAL cwd before applyCwd chdirs elsewhere,
	// so a relative --file combined with --cwd doesn't fail with ENOENT.
	if (args.file && typeof args.file === "string") args.file = path.resolve(args.file)
	applyCwd(args)
	const dryRun = !!args["dry-run"]
	const { owner, repo } = repoSlug()
	const payload = await loadPayload(args)

	const number = payload.number || args.number
	const replies = payload.replies || []
	if (!number) throw new Error("payload.number is required")
	if (!replies.length) throw new Error("payload.replies is empty — nothing to do")

	const results = []
	for (const r of replies) {
		if (!r.commentId || !r.body)
			throw new Error("each reply needs commentId and body")

		if (dryRun) {
			results.push({ commentId: r.commentId, action: "would-reply", willResolve: !!r.threadId })
			continue
		}

		// Post the threaded reply. Exact-string body via argv — no shell.
		const replyJson = JSON.parse(
			gh([
				"api",
				`repos/${owner}/${repo}/pulls/${number}/comments/${r.commentId}/replies`,
				"-f",
				`body=${r.body}`,
			])
		)
		const entry = { commentId: r.commentId, replyId: replyJson.id, resolved: null }

		if (r.threadId) {
			const res = ghGraphql(RESOLVE, { threadId: { value: r.threadId, raw: true } })
			entry.resolved = res.data.resolveReviewThread.thread.isResolved
		}
		results.push(entry)
	}

	output({ owner, repo, number: Number(number), dryRun, count: results.length, results })
}

main().catch(fail)
