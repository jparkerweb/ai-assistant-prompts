---
name: ai-assist-git-commit
description: "Stage and commit changes using the team's standard commit message format. Only invoke when the user explicitly types /ai-assist-git-commit. Never auto-trigger from general conversation about commits or git."
argument-hint: "[optional commit description]"
---

# Git Commit

Stages and commits changes using a standard commit message format. This skill is only invoked manually by the user — never auto-trigger.

## Commit Message Format

```
<description>

AI Assisted
```

- **Line 1**: A concise description of what changed and why
- **Line 2**: Blank
- **Line 3**: The literal text `AI Assisted`

## Workflow

### Step 1 — Check for changes

Run `git status` (never use the `-uall` flag) and `git diff` (staged and unstaged) to see what has changed.

If there are no changes to commit, tell the user and stop.

### Step 2 — Determine the commit description

Review the staged and unstaged changes from Step 1 to understand what was done.

If the user provided a description as an argument (e.g., `/ai-assist-git-commit fix timeout on report export`), use that as the commit description.

Otherwise, draft a concise commit description (1-2 sentences) based on the changes. Focus on the "why" rather than the "what". Present it to the user for approval:

> Here's the commit I'll create:
>
> ```
> <description>
>
> AI Assisted
> ```
>
> Stage and commit these changes? (Yes / Edit / No)

- **Yes**: Proceed to Step 3
- **Edit**: Ask what they'd like to change, then re-present
- **No**: Stop without committing

If the user provided a description as an argument, skip the approval prompt and proceed directly to Step 3.

### Step 3 — Stage and commit

Stage the relevant changed files. Prefer adding specific files by name rather than `git add -A` or `git add .` — avoid accidentally staging sensitive files (`.env`, credentials) or large binaries. If unsure which files to include, ask the user.

Create the commit using the format from above. Pass the message via a heredoc to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
<description>

AI Assisted
EOF
)"
```

**Do not push to the remote.** Only commit locally.

### Step 4 — Confirm

After committing, run `git log -1` and show the user the resulting commit to confirm it was created correctly.

## Rules

- Never push to the remote repository — this skill only creates local commits
- Never amend existing commits unless the user explicitly asks
- Never skip git hooks (no `--no-verify`)
- Never include "Claude Code" or similar AI tool attributions in the commit message — `AI Assisted` on its own line is the only attribution used
- If a pre-commit hook fails, diagnose and fix the issue, then create a **new** commit (do not amend)
- Do not stage files that likely contain secrets (`.env`, `credentials.json`, etc.) — warn the user if they specifically request it
