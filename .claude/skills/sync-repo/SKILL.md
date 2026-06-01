---
name: sync-repo
description: "Run the encrypted, password-protected repository sync workflow for this project. The real instructions are stored encrypted at rest and are only revealed in-session after you supply the correct password. Invoke explicitly with /sync-repo."
disable-model-invocation: true
---

# sync-repo (password-protected)

The real instructions for this skill are encrypted at rest in `sync-repo.enc`
and are NOT readable without the password. Do not guess, reconstruct, or invent
the workflow. Follow this launcher exactly.

## What you (the agent) must do

1. **Ask the user for the password.** Request the decryption passphrase (via
   AskUserQuestion or a plain prompt). Do NOT proceed without it. Tell the user
   it will be passed to a local script via an environment variable, never written
   to disk, and warn them that — because you must run the command — the password
   will appear in this session's local transcript. (It never enters the repo.)

2. **Decrypt to STDOUT only.** Run the decrypt script with the password supplied
   through the `SKILL_PASSWORD` environment variable — **never** as a command-line
   argument. From the repo root:

   - **Windows PowerShell:**
     ```powershell
     $env:SKILL_PASSWORD='<password the user gave you>'; node .\.claude\skills\sync-repo\decrypt.mjs .\.claude\skills\sync-repo\sync-repo.enc; Remove-Item Env:\SKILL_PASSWORD
     ```
   - **bash / macOS / Linux:**
     ```bash
     SKILL_PASSWORD='<password the user gave you>' node ./.claude/skills/sync-repo/decrypt.mjs ./.claude/skills/sync-repo/sync-repo.enc
     ```

3. **Handle the result.**
   - If decryption **succeeds**, the script prints the real workflow instructions
     to STDOUT. Treat that STDOUT as the authoritative instructions for this
     skill for the rest of this session, and carry them out.
   - If decryption **fails** (exit code 1, message "Decryption failed: wrong
     password or corrupted data."), the password was wrong or the file is
     corrupt. Tell the user, ask them to re-enter the password, and retry. Do
     NOT attempt to reconstruct the instructions from anything else.

## Hard rules

- **Never write the decrypted plaintext to a file.** Read it from STDOUT only.
  `decrypt.mjs` intentionally has no file-output mode.
- **Never echo the password back** into the conversation, and never put it in a
  CLI argument or in a persisted env export.
- After decrypting, always clear the variable (`Remove-Item Env:\SKILL_PASSWORD`
  on PowerShell; the inline form on bash never persists it).

## Security note (be honest with the user)

This protects the workflow body **only at rest in the repository**. Once
decrypted, the plaintext enters this session's context and may be written to the
Claude Code transcript/logs and be visible on a screen-share. It is
obfuscation-grade confidentiality, not runtime secrecy or access control —
anyone with both the repo and the password can read the body.
