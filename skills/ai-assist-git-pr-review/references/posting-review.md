# PR Review — Mechanics

> Part of [ai-assist-git-pr-review](../SKILL.md). Loaded before Step 3.
> **Known consumers:** ai-assist-git-pr-review

Everything here is `gh` CLI against an arbitrary PR identified by `$owner/$repo/$number`. The PR may live in a repo that is NOT your current working directory, so always read files and standards from the PR's repo via `gh api`, never from the local filesystem.

## Gathering Agents Files

The standards live in the PR's repo. Find them on the base branch (the branch the PR merges into), so the review measures the PR against the *target* conventions. Enumerate **every** agents file that exists in the repo — this is the source of the rules and is independent of which files the PR changed. Do not restrict this to agents files in the diff; a typical PR modifies zero agents docs yet must still obey all of them.

Resolve the base branch first (from Step 2 metadata, `$baseRef`), then list the **full** tree and filter for agents files:

```bash
gh api repos/$owner/$repo/git/trees/$baseRef?recursive=1 \
  --jq '.tree[] | select(.type=="blob") | .path
        | select(test("(^|/)AGENTS\\.md$|(^|/)CLAUDE\\.md$|(^|/)\\.agents-docs/") )'
```

Read each hit. `gh api` returns file contents base64-encoded — decode:

```bash
gh api repos/$owner/$repo/contents/AGENTS.md?ref=$baseRef --jq '.content' | base64 --decode
```

(On Windows/Git Bash `base64 --decode` works; if unavailable, `gh api .../contents/<path>?ref=$baseRef -H "Accept: application/vnd.github.raw" ` returns raw bytes directly and is simpler — prefer the raw Accept header when you can.)

```bash
gh api repos/$owner/$repo/contents/<path>?ref=$baseRef -H "Accept: application/vnd.github.raw"
```

**Follow the index.** `AGENTS.md` is typically a thin index that links to `.agents-docs/AGENTS-*.md`. Only pull the detailed docs relevant to what the diff touches — if the PR is all C#, read the C#-standards doc and skip the frontend one. This keeps context lean while still grounding findings in the real rules.

**Distill a checklist.** Turn the prose into concrete, checkable rules and remember each rule's source doc, e.g.:
- Wrapper boundary: controllers must call Wrappers, not ServiceRepositories (from .agents-docs/AGENTS-important-patterns.md)
- Private methods below public methods (from AGENTS.md §C# Coding Standards)

Every inline comment you later post should trace back to one of these rules or to a named best practice.

## Reading a File at the PR Head

When a rule needs whole-file context the diff hunk doesn't show, read the file at the PR's head SHA (the exact revision under review):

```bash
gh api repos/$owner/$repo/contents/<path>?ref=$headSha -H "Accept: application/vnd.github.raw"
```

Use the diff (`gh pr diff $number --repo $owner/$repo`) to know *what* changed; read the full file only when context matters (class layout, whether a helper already exists, import order across the file, etc.).

## Anchoring Rules

Inline review comments can only attach to lines that appear in the PR diff:

- **Added lines** (`+` in the diff) → `side: "RIGHT"`, `line` = the line number in the new file.
- **Deleted lines** (`-` in the diff) → `side: "LEFT"`, `line` = the line number in the old file.
- **Context lines** (unchanged, shown around a hunk) → usually `side: "RIGHT"` and commentable, but not always.
- **Multi-line comment** → set `start_line` (+ `start_side`) and `line` to the last line of the range.

`line` is the actual file line number, **not** the diff position. Trying to anchor to a non-diff line returns HTTP 422.

This skill posts **inline comments only** — it does not write a prose summary of the PR. So a finding that concerns a file or area rather than one specific changed line (e.g. "there's no test file for this new service", or "these three methods repeat the same block") should be **anchored to the nearest relevant changed line** — for a whole-file concern, the file's `CREATE`/signature line or the most representative changed line works well. If a finding genuinely can't be tied to any line in the diff, drop it rather than inventing a summary comment to hold it.

## Posting the Review

Build the payload as JSON and post it as **one** review via the `/reviews` endpoint. The `-f "comments[0][path]=..."` form does **not** produce a valid array and will fail — send real JSON.

**Keep all text ASCII-only.** This is the most common way a posted review comes out wrong: em-dashes (`—`), curly quotes, `§`, arrows, and other non-ASCII characters get silently mangled into `?` when the JSON travels through a shell (especially Windows PowerShell here-strings / `Out-File`, which default to a non-UTF-8 code page). Use plain ASCII in every `body` — `--` or ` - ` instead of `—`, straight quotes, "section" instead of `§`. If you truly need a non-ASCII character, write the payload file with explicit UTF-8-no-BOM (see the PowerShell path below) rather than relying on shell defaults.

### Write the payload to a file, then post

Writing to a file (rather than an inline heredoc) sidesteps most quoting and encoding traps and lets you re-read exactly what you're about to send.

**bash / zsh:**
```bash
cat > /tmp/review.json << 'REVIEW_JSON'
{
  "commit_id": "<headSha>",
  "event": "REQUEST_CHANGES",
  "body": "Requested changes - details in the inline comments.",
  "comments": [
    {
      "path": "Src/WebUI/Controllers/FooController.cs",
      "line": 42,
      "side": "RIGHT",
      "body": "Controllers must call the Wrapper, not `ServiceRepositories` directly (AGENTS-important-patterns.md, Wrapper boundary). Route this through `IFooWrapper`.\n\n_[CRITICAL] - AI Assisted_"
    },
    {
      "path": "Src/WebUI/Controllers/FooController.cs",
      "start_line": 55,
      "line": 58,
      "side": "RIGHT",
      "body": "Consider extracting this block into a private helper for readability.\n\n_[NIT] - AI Assisted_"
    }
  ]
}
REVIEW_JSON
gh api repos/$owner/$repo/pulls/$number/reviews --method POST --input /tmp/review.json
```

**Windows PowerShell** (the here-string is fine, but write the file with UTF-8-no-BOM so nothing gets mangled — do **not** use `Out-File -Encoding utf8`, which adds a BOM on Windows PowerShell 5.x):
```powershell
$json = @'
{
  "commit_id": "<headSha>",
  "event": "REQUEST_CHANGES",
  "body": "Requested changes - details in the inline comments.",
  "comments": [
    { "path": "path/to/File.cs", "line": 42, "side": "RIGHT", "body": "...finding...\n\n_[WARNING] - AI Assisted_" }
  ]
}
'@
[System.IO.File]::WriteAllText("$env:TEMP\review.json", $json, (New-Object System.Text.UTF8Encoding($false)))
Get-Content "$env:TEMP\review.json" -Raw | gh api repos/$owner/$repo/pulls/$number/reviews --method POST --input -
```

Notes:
- `commit_id` pins the review to the revision you actually reviewed — if new commits land later, your comments stay attached to the right lines.
- `event: "REQUEST_CHANGES"` requires a non-empty `body`, so the API will 422 on an empty string. Keep it to a single neutral navigational line as shown — **not** a summary of findings and never congratulatory. All substance lives in the inline `comments`.
- Substitute `$owner/$repo/$number` and the real `headSha` before running.
- Escape newlines inside JSON string values as `\n`, and escape any literal `"` in comment bodies as `\"`.
- **Every inline comment body ends with a `_[SEVERITY] - AI Assisted_` footer** (preceded by `\n\n`) — severity goes here, not at the start of the comment (leading with it reads as aggressive). Matches the team's `AI Assisted` attribution convention. The review summary body does not need it.
- **Always verify after posting (below)** and re-read the rendered bodies — mangled characters show up there even when the POST returns 200.

### Fixing a review after posting

If the POST succeeded but a body came out wrong (e.g. mangled characters), you don't have to start over:
- **An inline comment body:** `gh api repos/$owner/$repo/pulls/comments/<comment_id> --method PATCH -F "body=@<utf8-file>"` (get `<comment_id>` from the verify step).
- **The review summary body:** `gh api repos/$owner/$repo/pulls/$number/reviews/<review_id> --method PUT -F "body=@<utf8-file>"`.

Reviews cannot be deleted via the API, so fix in place rather than posting a second review.

### Suggestion Blocks

For a small, obvious fix, include a GitHub suggestion so the author can accept it in one click. Put it in the comment `body` (remember to `\n`-escape for JSON):

```
**[WARNING]** Missing null guard.
```suggestion
if (foo is null) return NotFound();
```
```

The suggested code must be the exact replacement for the commented line(s); for multi-line replacements anchor the comment across the full range with `start_line`/`line`.

## Verify After Posting

```bash
gh api repos/$owner/$repo/pulls/$number/reviews \
  --jq '.[] | select(.user.login=="'"$(gh api user --jq .login)"'") | {state, submitted_at, body}'
```

Confirm a `REQUEST_CHANGES` review exists from your account. Then confirm the inline comment count:

```bash
gh api repos/$owner/$repo/pulls/$number/comments --jq 'length'
```

## Recovery

| Symptom | Cause | Fix |
|---------|-------|-----|
| **422 Unprocessable Entity** on POST | An inline comment's `line`/`side` isn't a line in the diff | Identify the offending comment, re-anchor to a valid changed line (or drop it if it can't be tied to one), repost. Do not retry unchanged. |
| **422 mentioning `pull_request_review_thread`** | Line not commentable (e.g. unchanged line outside a hunk) | Re-anchor to the nearest changed line, or drop the finding. |
| **403 rate limited** | Too many API calls | Wait and retry, or resume later. |
| **404** | No access to the repo, or wrong owner/repo/number | Check the URL and that `gh auth status` has access to that repo. |
| Review posted to the wrong PR | Wrong URL parsed | A CLI review can't be deleted; stop and tell the user. Don't post more reviews to compensate. |

Never repost blindly after a failure — a partial success can leave duplicate comments. Read the error, fix the specific payload, and repost once.
