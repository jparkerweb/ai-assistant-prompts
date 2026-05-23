# GitHub CLI Setup

> Part of [ai-assist-git-pr](../SKILL.md) — loaded when gh CLI is not installed.
> See also: SKILL.md Context section (auth check runs inline there).
> **Known consumers:** ai-assist-git-pr

This guide is for the **agent** to execute, not a manual the user reads. The agent does all the work — detecting the OS, installing gh, authenticating — and only asks the user for approval before installing or when browser interaction is required.

**Philosophy:** Detect → explain briefly → offer to do it → execute (with approval) → verify. Minimize user effort. Maximize automation.

## Step 1: Install gh CLI (if missing)

Check first:

```bash
gh --version 2>/dev/null && echo "GH_OK" || echo "GH_MISSING"
```

**If `GH_OK`:** Skip to Step 2.

**If `GH_MISSING`:** Detect the OS and available package manager, then offer to install:

```bash
OS="unknown"
PKG=""
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  OS="windows"
  command -v winget &>/dev/null && PKG="winget"
  command -v scoop &>/dev/null && PKG="${PKG:-scoop}"
  command -v choco &>/dev/null && PKG="${PKG:-choco}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  OS="macos"
  command -v brew &>/dev/null && PKG="brew"
elif [[ "$OSTYPE" == "linux"* ]]; then
  OS="linux"
  command -v apt-get &>/dev/null && PKG="apt"
  command -v dnf &>/dev/null && PKG="${PKG:-dnf}"
  command -v yum &>/dev/null && PKG="${PKG:-yum}"
fi
echo "OS: $OS | Package manager: ${PKG:-none found}"
```

Tell the user:

> GitHub CLI (`gh`) is required but not installed. I can install it for you using `[detected package manager]`.
>
> **OK to proceed?**

On approval, run the appropriate command:

| OS | Package Manager | Install Command |
|----|----------------|-----------------|
| Windows | winget | `winget install --id GitHub.cli` |
| Windows | scoop | `scoop install gh` |
| Windows | choco | `choco install gh -y` |
| macOS | brew | `brew install gh` |
| Linux | apt | `sudo apt update && sudo apt install -y gh` |
| Linux | dnf | `sudo dnf install -y gh` |
| Linux | yum | `sudo yum install -y gh` |

**If the default package repo doesn't include gh** (common on older Linux distros), add the official GitHub CLI repository first. See https://github.com/cli/cli/blob/trunk/docs/install_linux.md for repo setup commands per distro.

**If no package manager detected**, tell the user:

> I couldn't detect a package manager. Install GitHub CLI manually from https://cli.github.com, then restart your terminal and try again.

After installation, verify:

```bash
gh --version
```

Do not proceed until this returns a version number.

## Step 2: Authenticate (if needed)

Check first:

```bash
gh auth status 2>/dev/null && echo "AUTH_OK" || echo "AUTH_MISSING"
```

**If `AUTH_OK`:** Skip to Step 3.

**If `AUTH_MISSING`:** Tell the user:

> gh needs to authenticate with GitHub. I'll start the login — a browser window will open for you to complete the OAuth flow.

Detect any existing git protocol preference: `gh config get git_protocol 2>/dev/null`. If set (typically `ssh` or `https`), preserve it. If not set (fresh install), default to `https`. Run: `gh auth login --web --hostname github.com --git-protocol <detected-or-https>`. This prints a one-time code and opens a browser — the user enters the code and authorizes.

**If the command hangs or the browser doesn't open** (non-interactive shell), tell the user:

> The browser didn't open automatically. Run this in your terminal: `! gh auth login`
> (The `!` prefix runs the command in this session.)

After auth completes, verify: `gh auth status`. Do not proceed until this shows an active account.

## Step 3: Final Verification

Run the all-in-one diagnostic:

```bash
echo "=== GitHub CLI ===" && gh --version && echo "" && echo "=== Authentication ===" && gh auth status
```

If all checks pass, tell the user:

> Setup complete! GitHub CLI is installed and authenticated. Resuming your original request...

If any check fails, loop back to the relevant step.

## Troubleshooting

| Symptom | Likely Cause | Agent Action |
|---------|-------------|--------------|
| `gh: command not found` after install | Not on PATH; terminal needs restart | Suggest: close and reopen terminal, or `! hash -r` to refresh PATH |
| `gh auth login` returns 401 | OAuth flow not completed or expired | Re-run `gh auth login --web` |
| `gh auth login` hangs / no browser | Non-interactive shell | Tell user: `! gh auth login` to run interactively |
| Corporate SSO / proxy issues | Enterprise network restrictions | Suggest: `gh auth login --with-token` using a PAT from github.com/settings/tokens |
| `gh auth status` shows wrong account | Authenticated to personal instead of org | Run `gh auth logout` then `gh auth login --web` with correct account |
