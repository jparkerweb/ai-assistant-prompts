# ai-assist-git-pr scripts

Shell-free `gh`/`git` helpers for the `ai-assist-git-pr` skill. They exist so the
skill behaves identically on every platform.

## Why scripts (not inline shell)

Hand-written `gh`/`git` command strings in the reference docs broke in three
recurring ways, all shell-related:

1. **`&&` chaining** — Windows PowerShell (pre-7) rejects `&&`, so chained
   context commands failed.
2. **heredoc commit/reply bodies** — `"$(cat <<'EOF' … EOF)"` is bash-only; it
   is a parse error in PowerShell.
3. **`gh api graphql -f key:value` literals** — gh mis-parses hyphenated repo
   names (`tap-db_UI`), integers (`number:889`), and underscored node ids
   (`PRRT_…`) when they are inlined.

Every script here runs `gh`/`git` via `execFileSync(bin, [...argv])` — an
**argument array**, never a shell string. Node hands argv straight to the
binary, so there is no shell to interpret `&&`, heredocs, or `-f` literals. One
implementation covers bash, PowerShell, cmd, git-bash, WSL, and CI with **no
shell detection and no per-OS branching**.

GraphQL dynamic values are always passed as typed variables (`-F name=value` for
`Int`/`ID`/`Boolean`, `-f name=value` for strings) via `lib.cjs`'s `ghGraphql`.

## Requirements

- Node 18+ (uses global `fetch`-free stdlib only; no npm deps)
- `gh` CLI installed and authenticated (`gh auth status`)
- Run against the target git repository (scripts read the current repo/branch)

Invoke with the skill's install path:

```
node "<SKILL_ROOT>/scripts/<script>.cjs" [args]
```

### Targeting a repo: `--cwd`

Every script accepts an optional **`--cwd <repo-dir>`** (alias `--repo`). It
`process.chdir`s once at startup so all `gh`/`git` calls run against that repo,
letting the script run from anywhere in a single self-contained command:

```
node "<SKILL_ROOT>/scripts/pr-context.cjs" --cwd "C:\Code\tap-ct"
```

Use it instead of a separate `cd` step. This matters for multi-repo workspaces
(the process cwd may be a different repo) and for environments where a
persistent shell session does **not** survive between calls — so a `cd` in one
call followed by `node <script>` in the next is unreliable (fails with
`This shell may not be functional`). When combining `--cwd` with
`reply-resolve.cjs --file`, pass an **absolute** `--file` path. Omit `--cwd`
when the working directory already is the target repo.

## Scripts

| Script | Access | Description |
|--------|--------|-------------|
| `pr-context.cjs [--number N]` | read | `{ owner, repo, branch, defaultBranch, ticketId, pr }`. `pr` is `null` when the branch has no PR. |
| `fetch-comments.cjs [--number N]` | read | `{ owner, repo, number, inline[], issue[] }`. Inline items include `path`, `line`, `diffHunk`, `inReplyToId`. Aborts if the resolved PR is not OPEN (when `--number` omitted). |
| `list-threads.cjs --number N [--all]` | read | `{ …, threads[] }` with `threadId`, `isResolved`, `rootCommentId`, `path`. Unresolved-only unless `--all`. |
| `reply-resolve.cjs --file <path> [--dry-run]` | **write / gated** | Posts a reply batch and resolves threads. Run ONLY after the skill's batch-reply approval gate. `--dry-run` previews without writing. |

### `reply-resolve.cjs` payload

```json
{
  "number": 889,
  "replies": [
    { "commentId": 3562181244, "threadId": "PRRT_...", "body": "Fixed in <sha>. Reused @ThreadTotalCount instead of a second COUNT(*)." }
  ]
}
```

- `commentId` and `body` are required per item; `threadId` is optional (omit to
  reply without resolving).
- `body` is sent as an exact string — newlines, backticks, `<`/`>`, and
  `COUNT(*)` are all safe, no escaping needed.
- Pass the payload with `--file <path>` (preferred) or piped JSON on stdin.
- Output lists `replyId` and `resolved` per item; verify all resolved before
  reporting complete.

## Conventions

- `lib.cjs` is the only shared module: `gh`/`git`/`ghJson`/`ghGraphql`,
  `parseArgs`, `applyCwd`, `readStdin`, `output`, `fail`, `repoSlug`,
  `ticketFromBranch`.
- Read scripts are safe to run anytime (Auto). `reply-resolve.cjs` is the only
  writer and is Gated by the skill — the script is the executor, not the
  approval.
- All scripts print JSON to stdout and exit non-zero with a diagnostic to stderr
  on failure.
