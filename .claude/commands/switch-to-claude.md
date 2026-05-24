Resume KeepMees work after a Codex session — read from repo truth, not from session memory.

Run: `git branch --show-current`, `git status --short`, `git log --oneline -10`

Read in order:
1. `AGENTS.md`
2. `CLAUDE.md`
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`

Then state out loud:

> Package: … | Branch: … | HEAD: … | What Codex did: … | Remaining: … | Next action: …

Hard stops — report to Coordinator and do not proceed if:
- `AI_HANDOFF.md` is missing, blank, or conflicts with `git branch --show-current`
- The handoff branch no longer exists
- There are unexpected modified files not explained by the handoff
- The active package is closed but the tree is dirty

Do not trust any prior conversation context. The repo is the source of truth.

Full protocol: `docs/dev/session-restart-protocol.md`
Tool switching: `docs/dev/tool-switching-protocol.md`
