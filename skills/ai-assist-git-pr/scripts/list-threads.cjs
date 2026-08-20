#!/usr/bin/env node
"use strict"

// Read-only. Lists review threads for a PR via GraphQL and, by default, only the
// UNRESOLVED ones — the set that Reply+Resolve must act on. Each thread carries
// its node id (for resolveReviewThread), resolved flag, and its root comment's
// path + databaseId so the agent can map a thread to a fix.
//
// All dynamic values are passed as TYPED GraphQL variables (-F owner/name/number),
// never inlined, so gh's literal parser never mangles hyphenated repo names or
// integers.
//
// Usage:
//   node list-threads.cjs --number <N> [--all] [--cwd <repo-dir>]
//   --all   include already-resolved threads too (default: unresolved only)
//   --cwd   run against a repo without a separate shell `cd`

const { ghGraphql, parseArgs, applyCwd, output, fail, repoSlug } = require("./lib.cjs")

const QUERY = `query($owner:String!, $name:String!, $number:Int!, $cursor:String){
  repository(owner:$owner, name:$name){
    pullRequest(number:$number){
      reviewThreads(first:100, after:$cursor){
        pageInfo{ hasNextPage endCursor }
        nodes{
          id
          isResolved
          isOutdated
          comments(first:1){ nodes{ path databaseId author{ login } } }
        }
      }
    }
  }
}`

function main() {
	const args = parseArgs(process.argv)
	applyCwd(args)
	const number = args.number || args._[0]
	if (!number) fail("Usage: node list-threads.cjs --number <N> [--all]")
	const { owner, repo } = repoSlug()

	// Cursor-paginate so PRs with >100 review threads are fully covered — the
	// reconciliation guarantee in SKILL.md depends on every thread being listed.
	const nodes = []
	let cursor = null
	do {
		const vars = {
			owner: { value: owner },
			name: { value: repo },
			number: { value: Number(number), raw: true },
		}
		if (cursor) vars.cursor = { value: cursor }
		const data = ghGraphql(QUERY, vars)
		const page = data.data.repository.pullRequest.reviewThreads
		nodes.push(...page.nodes)
		cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null
	} while (cursor)

	const threads = nodes
		.filter((t) => args.all || !t.isResolved)
		.map((t) => {
			const root = (t.comments.nodes || [])[0] || {}
			return {
				threadId: t.id,
				isResolved: t.isResolved,
				isOutdated: t.isOutdated,
				rootCommentId: root.databaseId || null,
				path: root.path || null,
				author: root.author && root.author.login,
			}
		})

	output({ owner, repo, number: Number(number), count: threads.length, threads })
}

try {
	main()
} catch (e) {
	fail(e)
}
