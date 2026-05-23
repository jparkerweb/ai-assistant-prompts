# PR Operations Reference

> Part of [ai-assist-git-pr](../SKILL.md) — operational details for procedures, verification, and recovery across all modes.
> See also: SKILL.md (orchestrator with concise rules), github-pr-create.md (Create/Status workflows), github-pr-describe.md (Describe workflow, analysis framework).
> **Known consumers:** ai-assist-git-pr

This file contains the detailed operational procedures that SKILL.md references in summary form. Consult this file for full verification tables, per-action approval details, complete recovery procedures, and post-merge assessment message templates.

## Source-of-Truth Hierarchy

| Priority | Source | Role |
|----------|--------|------|
| **1 — Authoritative** | Code diff, commit history, file contents | What actually changed and why (commit messages) |
| **2 — Project context** | AGENTS.md, .agents-docs/, README, project docs | Architecture, conventions, patterns, team norms |
| **3 — External** | Library docs, security advisories, best practices | Validate approaches, flag risks, confirm patterns |

The code diff and commit history are the only authoritative sources. The branch may contain a different fix than any prior plan described, a partial fix, a follow-up fix, or work that expanded beyond the original scope. Always verify the description against the code.

## Post-Merge Branch Assessment

When `$pr_state = completed` (PR is MERGED or CLOSED), assess the branch state and report context to guide mode detection:

**Check for new commits beyond `$base`:** `git log origin/$base..HEAD --oneline`
**Check if behind `$base`:** `git merge-base --is-ancestor origin/$base HEAD` (exit 1 = behind)

Report using these templates:

- **New commits + behind main:** "Previous PR #N was merged. You have X new commits and your branch is behind `origin/$base`. Rebase recommended before creating a new PR."
- **New commits + up to date:** "Previous PR #N was merged. You have X new commits ready for a new PR."
- **No new commits:** "Previous PR #N was merged. No new commits on this branch."

## Approval Protocol — Per-Action Details

Before every gated action, present a plain-language summary — never raw commands:

- **Create PR:** Show title, body preview, base branch, head branch
- **Update description:** Show current body length vs proposed, key differences
- **Reply to comment:** Show exact reply text, which comment, reviewer name
- **Commit + Push:** When both are needed, combine into one gate. Show full `git diff`, file count, commit message, branch name, and "this will be visible to the team and trigger CI". One approval covers both. Verify push: `git log origin/<branch>..HEAD` must be empty.
- **Commit only:** Show full `git diff`, file count, commit message. No push implied.
- **Push only:** Show branch name, commit count, "this will be visible to the team and trigger CI". Always `git push -u origin <branch>` — `-u` is idempotent.

Wait for explicit "yes" / approval. After execution, verify with a follow-up read. If verification shows unexpected results, report immediately — do not retry without user direction. Combine related gated actions (commit+push) into one approval when presented together — never ask twice for what was clearly approved once.

## Write Verification

After every write operation, verify the result immediately:

| Write | Verification |
|-------|-------------|
| Create PR | `gh pr view --json url,title,body` — URL exists, title matches, body non-empty |
| Update description | `gh pr view --json body --jq '.body \| length'` — matches expected length |
| Commit | `git log -1 --format='%H %s'` — hash exists, message matches |
| Push | `git log origin/<branch>..HEAD` — empty after successful push |
| File write | Re-read the file — content matches, no truncation |

If verification fails: stop, report expected vs actual, do not proceed.

## Self-Verification Checklist

Before presenting results to user:

- PR data is from a fresh GET (not stale cache)
- All URLs and PR numbers are correct
- Write operations were approved before execution
- Write operations were verified after execution
- No data was overwritten without user seeing the original
- No force flags were used in any command
- **Comments mode only:** All addressed threads replied to AND resolved (verified via GraphQL)

## Recovery

| Issue | Solution |
|-------|----------|
| No PR for current branch | Ask user to create one or specify PR number |
| `gh` not installed | Read `references/github-cli-setup.md` — guided setup detects OS, installs via package manager, authenticates |
| `gh` not authenticated | Run `gh auth status` — if unauthenticated, run `gh auth login --web`. If browser doesn't open, tell user: `! gh auth login` |
| Diff too large (100+ files) | Group by directory, summarize at module level |
| No git repo detected | Ask for PR number explicitly |
| `gh api` returns 404 | Check repo access permissions |
| `gh api` rate limited (403) | Wait and retry, or ask user to continue later |
| Created PR with wrong title/body | `gh pr edit` to fix immediately |
| Updated description, overwrote user content | Old body was shown in preview — user can restore |
| Replied to wrong comment | Cannot delete via API — warn user, suggest manual GitHub UI deletion |
| Committed bad code fix | `git revert HEAD` — present to user for approval, do not auto-execute |
| Pushed bad commit | **STOP.** Inform immediately. Do NOT force push. Suggest `git revert` + new push |
| Verification failed after write | Report expected vs actual, do not retry without user direction |

## Important Reminders

**Analysis depth:** Read every file, every line. The description's credibility comes from thorough understanding, not template-filling.

**Brevity is the goal.** Deep analysis enables short output. A 500-line diff should produce a 20-line description.

**Safety hierarchy is non-negotiable.** Reads are auto. Writes are gated with preview + approval + verification. Merges/closes/force-push are blocked.

**Never push without explicit request.** Creating a PR does not imply pushing. Committing does not imply pushing. When commit+push are both needed, combine into one gate with all info upfront — but push alone (e.g., pre-flight push before PR creation) is still its own gate.

**Never force push.** No `--force`, no `--force-with-lease`, no `--force-if-includes`. If the user insists, explain the risk and suggest they do it manually.

**Agent-agnostic.** This skill works in any AI agent with shell access (Claude Code, Cursor, Windsurf, Copilot, etc.). Commands are examples within narrative steps — agents adapt syntax to their environment.
