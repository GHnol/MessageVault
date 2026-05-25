---
name: notification-setup-wizard
description: Walk the user through setting up Claude Code permission/wait notifications at the user level — detect config dir, preview the JSON patch, back up existing settings, and optionally apply.
---

## Purpose

Help the contributor configure a notification sound (or OS toast) so Claude Code beeps or alerts when it is waiting for permission or input. This is user-level setup — nothing is committed to the repo. Each contributor installs their own.

## When to use

- When a contributor wants to set up the notification for the first time
- When the notification stopped working after a config dir change
- When switching between multiple `CLAUDE_CONFIG_DIR` accounts (each needs its own hook)

**Invocation type:** User-invoked. Local-only setup. Never committed. Never affects other contributors.

## Files to read

1. `docs/dev/notification-setup.md` (the full setup guide)
2. `scripts/setup-claude-notification.ps1` (the wizard script, if it exists)

## Required git preflight

None. This skill does not touch the repo.

## Sync obligations

None. This skill installs user-level config only. It has no repo sync obligations.

## Output format

Step-by-step wizard:

1. **Detect `CLAUDE_CONFIG_DIR`** — ask the user which config dir is active (default `~/.claude/` or custom like `~/.claude-account-icloud/`)
2. **Locate `settings.json`** — report the exact path
3. **Preview the JSON patch** — show exactly what will be added to the settings file; do not modify yet
4. **Backup prompt** — remind the user to back up their settings file before modification
5. **Apply decision** — the user confirms; then either:
   - Run `scripts/setup-claude-notification.ps1 -Apply` (if on Windows and script exists)
   - Or show the exact JSON to paste manually
6. **Test instructions** — how to test with `/hooks` or by triggering a permission prompt

For Windows: the script uses `[System.Console]::Beep()`. For macOS: uses `afplay /System/Library/Sounds/Ping.aiff`. For Linux: uses `beep` or `paplay`.

If automatic JSON merging is risky (existing settings.json is complex), show the exact patch and instructions instead of modifying directly.

## Hard stop conditions

- Do not commit any user-level settings files (`.claude/settings.json`, `.claude/settings.local.json`).
- Do not overwrite the existing settings file without a backup step.
- If the settings file is complex, prefer showing the manual patch over automated merging.
- Never store credentials or secrets.

## Approval boundaries

- The user must explicitly confirm before the script modifies any file.
- The script defaults to dry-run mode unless `-Apply` flag is passed.
- Nothing from this skill is committed to the repo.

## Backed by

`docs/dev/notification-setup.md`
`scripts/setup-claude-notification.ps1` (if present)
