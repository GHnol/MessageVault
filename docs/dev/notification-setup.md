# Notification Setup — Permission / Wait Sound

**Applies to:** Claude Code users on this repository (each contributor configures their own)
**Status:** User-level setup — documented, **not** committed as a private setting
**Why this is documented, not committed:** A shared Windows-only PowerShell beep would fail silently on macOS/Linux contributors. A shared macOS-only `afplay` would fail silently on Windows. The right answer is: each user configures their own at their `CLAUDE_CONFIG_DIR`, and the repo documents the patterns.

---

## What this gets you

Claude Code can fire shell commands on harness events (e.g. when it is waiting for permission to run a tool, or when the assistant finishes a response). With this setup configured at user level, the harness will sound a notification so the user knows to come back to the terminal.

This is especially useful when:

- The agent runs long batches and you walk away from the terminal.
- The agent hits a permission prompt and is silently waiting for `y`.
- You're working in another window and want a cue when the assistant is done thinking.

---

## Where the user-level config lives

Claude Code reads settings from a `CLAUDE_CONFIG_DIR`. The default is `~/.claude/`. If you use a non-default location (e.g. an iCloud-synced directory like `~/.claude-account-icloud/`), that becomes the active config dir.

The settings file is `~/.claude/settings.json` (or equivalent in your config dir). This is **not** a repo file — it is per-user.

**If you use multiple `CLAUDE_CONFIG_DIR` accounts**, install the hook in **each** of them. Otherwise the beep will work for one account and silently do nothing for the other.

---

## Configuration pattern

Add a `hooks` block to your user-level `settings.json`. The exact hook event names available depend on your Claude Code version — check `/help` or the Claude Code docs for the current event names. Common event names include:

- `Notification` (capital N) — fires when the harness wants to alert you, including permission prompts. This is the primary hook for "waiting for permission" beeps.
- `Stop` — fires when Claude finishes a turn (useful for "done thinking" beep).
- `PreToolUse` — fires before a tool runs (fires more frequently than `Notification`).

The hook value is a shell command. Keep it fast (< 250 ms) — long-running hooks slow every turn.

**Note on casing:** Claude Code may use `camelCase`, `PascalCase`, or `snake_case` depending on version. If `Notification` does not fire, try `notification`. Check the Claude Code release notes for your installed version.

---

## PermissionRequest hook (test fallback)

If `Notification` is not firing for permission prompts, try `PermissionRequest` as an alternative:

```json
{
  "hooks": {
    "PermissionRequest": "powershell -NoProfile -Command \"[console]::beep(880,250)\""
  }
}
```

This is a fallback; confirm which event name your Claude Code version uses before relying on it.

---

## Double-beep behavior

If you register both `Notification` and `PermissionRequest`, you may hear two beeps for the same permission prompt — once when the request is queued and once when the notification fires. This is expected if both events fire for the same action. Use a different pitch to distinguish them, or choose one hook type only.

If you hear unexpected double-beeps, remove one of the hooks and observe whether the behavior changes.

---

---

## Windows — PowerShell beep

A short, safe beep on the default console speaker:

```json
{
  "hooks": {
    "notification": "powershell -NoProfile -Command \"[console]::beep(880,250)\""
  }
}
```

- `880` is the frequency in Hz (A5 — pleasant, not piercing).
- `250` is the duration in milliseconds (short).

Test it manually first:

```powershell
powershell -NoProfile -Command "[console]::beep(880,250)"
```

If you hear a beep, the command works. If not, your system may have muted the console beeper — try a system sound instead:

```powershell
powershell -NoProfile -Command "[System.Media.SystemSounds]::Asterisk.Play()"
```

---

## macOS — afplay system sound

```json
{
  "hooks": {
    "notification": "afplay /System/Library/Sounds/Glass.aiff"
  }
}
```

Other built-in macOS sounds in `/System/Library/Sounds/`: `Ping.aiff`, `Pop.aiff`, `Tink.aiff`, `Submarine.aiff`. Pick whichever you'll notice but won't annoy you.

Test manually:

```bash
afplay /System/Library/Sounds/Glass.aiff
```

---

## Linux — paplay or aplay

If `pulseaudio` is running:

```json
{
  "hooks": {
    "notification": "paplay /usr/share/sounds/freedesktop/stereo/complete.oga"
  }
}
```

If `alsa` only:

```json
{
  "hooks": {
    "notification": "aplay /usr/share/sounds/alsa/Front_Center.wav"
  }
}
```

Test manually before adding to the hook.

---

## Windows — popup / toast fallback (if terminal audio is silent)

If `[console]::beep()` produces no sound (muted console beeper or Hyper-V console), use a Windows toast notification instead:

```powershell
powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Claude is waiting for permission.', 'KeepMees Claude Code', 0)"
```

Or a balloon tooltip (quicker, non-blocking):

```powershell
powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(3000, 'Claude Code', 'Waiting for permission.', [System.Windows.Forms.ToolTipIcon]::Info); Start-Sleep 4; $n.Dispose()"
```

Test it manually before adding it to the hook. Balloon tips may not appear on all Windows 11 configurations depending on Focus Assist settings.

---

## Terminal bell fallback

If you just want a quick `\a` bell and your terminal has bell sound enabled:

```json
{
  "hooks": {
    "notification": "printf '\\a'"
  }
}
```

Works across platforms but depends on the terminal emulator honoring the bell. Many modern terminals mute it by default — check the terminal preferences first.

---

## Multiple events

You can register hooks on multiple events:

```json
{
  "hooks": {
    "notification": "powershell -NoProfile -Command \"[console]::beep(880,250)\"",
    "stop": "powershell -NoProfile -Command \"[console]::beep(660,150)\""
  }
}
```

A different pitch on `stop` vs `notification` lets you tell "Claude is asking for permission" apart from "Claude finished a turn" without looking at the screen.

---

## Multi-account setup

If your project uses multiple Claude Code config directories (e.g. a main account and an iCloud-synced one), install the hook block in **each** of:

- `~/.claude/settings.json`
- `~/.claude-account-icloud/settings.json` (or whatever your second config dir is)
- Any other `CLAUDE_CONFIG_DIR` you've configured

Otherwise the beep will work for the account whose config has the hook and silently no-op for the others.

To find your active config dir:

```bash
echo $CLAUDE_CONFIG_DIR
```

If empty, the default is `~/.claude/`.

---

## Completion sound (Stop hook) — manual setup required

> **Status: Manual setup required — not repo-enforceable.**
>
> The `Stop` hook fires when Claude finishes a turn. It is not committed to the repo and cannot be enforced from the repo. Each user must add it manually to their own `CLAUDE_CONFIG_DIR/settings.json`. After adding it, verify with `node scripts/notification-check.mjs`.

The `PermissionRequest` hook fires when Claude is waiting for tool permission. The **completion sound** — the sound that fires when Claude finishes a turn — requires a separate `Stop` hook. These are two distinct hook events.

If you hear a permission sound but no completion sound, the `Stop` hook is missing from your settings.json.

### Adding the Stop hook

Add a `Stop` entry alongside any existing hooks in your user-level `settings.json`:

```json
{
  "hooks": {
    "Notification": "powershell -NoProfile -Command \"[console]::beep(880,250)\"",
    "Stop": "powershell -NoProfile -Command \"[console]::beep(660,200)\""
  }
}
```

Use a different pitch (660 Hz vs 880 Hz) so you can distinguish "done thinking" from "waiting for permission."

**This change must be made in each `CLAUDE_CONFIG_DIR` you use for KeepMees work.** See § "Multi-account setup" and § "CLAUDE_CONFIG_DIR troubleshooting" below.

The repo cannot enforce this setting — it is user-level only. No repo file, script, or hook can install it for you. The `setup-claude-notification.ps1` script installs `PermissionRequest` only; the `Stop` hook must be added manually until the wizard is updated in a future authorized pass.

### Diagnosing your current notification config

After adding the hook, verify it was applied correctly:

```
node scripts/notification-check.mjs
```

This script (dependency-free, read-only):
- Detects all Claude Code config dirs (default, iCloud account dir, `CLAUDE_CONFIG_DIR` env)
- Reports which hook events are configured in each settings.json
- Reports `[PASS]` or `[WARN]` for `Stop` (completion sound) and `Notification`/`PermissionRequest`
- Prints manual test instructions

**Required outcome after adding the Stop hook:** `[PASS] Stop hook is configured` for every config dir used for KeepMees work.

Run it any time you suspect a hook is not firing.

### Completion sound — manual test

1. Run any Claude Code prompt that generates a response.
2. When Claude finishes and the prompt returns, you should hear the completion sound.
3. If not heard: test the `Stop` hook command directly in PowerShell:
   ```powershell
   powershell -NoProfile -Command "[console]::beep(660,200)"
   ```
4. If no sound: check Windows volume mixer → find your terminal app → unmute.
5. If still no sound: try a system sound instead:
   ```powershell
   powershell -NoProfile -Command "[System.Media.SystemSounds]::Asterisk.Play()"
   ```

---

## What NOT to do

- **Do not commit your hook config to the repo.** `~/.claude/settings.json` is a personal preference. Each contributor's OS, sound preferences, and audio setup differ.
- **Do not commit `.claude/settings.local.json` either** — it is gitignored on purpose.
- **Do not embed long-running commands in hooks.** Anything > 250 ms slows every turn. Use a quick sound or a non-blocking notification.
- **Do not pipe stderr/stdout from the hook into the agent.** Hooks run silently; their output is not chat input. If the hook fails, the harness will surface the error itself.
- **Do not use the hook to alter repo state.** Hooks are for side-effects on your machine (sound, system notification), not for editing files.

---

## Verification

After saving the hook config, restart Claude Code (or run `/help` to confirm the config reloaded). Run any command that triggers a permission prompt. If you hear the sound, the hook is firing.

If you don't hear anything:

1. Test the underlying command in your terminal directly — does the beep work outside Claude?
2. Confirm the hook event name matches your Claude Code version.
3. Check `CLAUDE_CONFIG_DIR` — make sure the hook landed in the active config dir.
4. Try a simpler command (e.g. a single system sound) to rule out the hook command itself.

---

## CLAUDE_CONFIG_DIR troubleshooting

Claude Code reads its config from `CLAUDE_CONFIG_DIR`. If that environment variable is not set, the default is `~/.claude/` on Unix and `%USERPROFILE%\.claude\` on Windows.

To confirm your active config dir:

```powershell
# Windows
$env:CLAUDE_CONFIG_DIR
# If empty, the active dir is:
"$env:USERPROFILE\.claude"
```

```bash
# Unix / macOS
echo $CLAUDE_CONFIG_DIR
# If empty: ~/.claude/
```

**KeepMees-specific:** this project uses an iCloud-synced config directory at `~/.claude-account-icloud/`. The hooks must be installed in that directory's `settings.json`, not in `~/.claude/settings.json`, for them to fire during KeepMees work sessions.

To verify you are editing the correct file, run:

```powershell
# Windows — show which settings.json exists in the iCloud dir
Get-Item "$env:USERPROFILE\.claude-account-icloud\settings.json"
```

If the file does not exist, create it with a minimal JSON object before adding the hooks block:

```json
{
  "hooks": {
    "Notification": "powershell -NoProfile -Command \"[console]::beep(880,250)\""
  }
}
```

After saving, restart Claude Code and trigger a permission prompt to verify.

---

## Why this is a doc, not a committed setting

Three reasons:

1. **Cross-platform safety.** A Windows beep config breaks on macOS contributors and vice versa.
2. **Personal preference.** Sound choice is taste — the repo shouldn't dictate it.
3. **Per-account multiplicity.** Each contributor's `CLAUDE_CONFIG_DIR` setup is their own; the repo doesn't know how many they have or where they live.

The repo's responsibility is to document the patterns. The contributor's responsibility is to install them locally.
