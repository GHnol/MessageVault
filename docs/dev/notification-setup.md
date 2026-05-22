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

Add a `hooks` block to your user-level `settings.json`. The exact hook names available depend on your Claude Code version — check `/help` or the Claude Code docs for the current event names. Common ones include:

- `pre_tool_use` — fires before a tool runs (useful for "needs permission" beeps if the harness gates the tool).
- `stop` — fires when Claude finishes a turn (useful for "done thinking" beep).
- `notification` — fires when the harness wants to alert you (useful for permission prompts).

The hook value is a shell command. Keep it fast (< 250 ms) — long-running hooks slow every turn.

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

## Why this is a doc, not a committed setting

Three reasons:

1. **Cross-platform safety.** A Windows beep config breaks on macOS contributors and vice versa.
2. **Personal preference.** Sound choice is taste — the repo shouldn't dictate it.
3. **Per-account multiplicity.** Each contributor's `CLAUDE_CONFIG_DIR` setup is their own; the repo doesn't know how many they have or where they live.

The repo's responsibility is to document the patterns. The contributor's responsibility is to install them locally.
