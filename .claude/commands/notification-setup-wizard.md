This command delegates to the **notification-setup-wizard** skill (`.claude/skills/notification-setup-wizard/SKILL.md`). Local-only setup — nothing committed to the repo. User-level config only.

Walk the Claude Code notification setup wizard.

Read `docs/dev/notification-setup.md` first.

Then run the setup wizard:

1. Ask which `CLAUDE_CONFIG_DIR` is active (default `~/.claude/` or custom path)
2. Locate the `settings.json` file and report the exact path
3. Preview the JSON patch — show exactly what will be added; do not modify yet
4. Remind the user to back up their settings file
5. Ask if the user wants to:
   - Run `scripts/setup-claude-notification.ps1 -Apply` (Windows, if script exists)
   - Or see the exact JSON to paste manually
6. If applying: run the script or show the manual patch
7. Explain how to test with `/hooks` or a permission prompt trigger

For multiple `CLAUDE_CONFIG_DIR` accounts: remind the user to install the hook in each.

Hard stops:
- Do not commit any user-level settings files
- Do not overwrite settings without backup step
- Default to dry-run preview; only modify file when user explicitly confirms
- Never store credentials or secrets

Full setup guide: `docs/dev/notification-setup.md`
Full skill: `.claude/skills/notification-setup-wizard/SKILL.md`
PowerShell script: `scripts/setup-claude-notification.ps1` (if present)
