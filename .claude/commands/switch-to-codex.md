This command delegates to the **switch-to-codex** skill (`.claude/skills/switch-to-codex/SKILL.md`). Approval boundaries unchanged: no autonomous tool switch; user confirms the switch after the packet is produced.

Prepare a Codex handoff and produce a transfer packet for tool switching.

First: run the handoff sequence — update `AI_HANDOFF.md` with current state (same as `/handoff`).

Run: `git branch --show-current`, `git status --short`, `git log --oneline -5`

Then read `docs/dev/tool-switching-protocol.md`.

Confirm that the working tree is clean or that all in-progress changes are described in the handoff.

Then output a Codex transfer block to chat:

> **CODEX TRANSFER PACKET**
> Codex startup: Read `AGENTS.md` → `.codex/README.md` → `AI_HANDOFF.md` → `CURRENT_STATE.md` → run `git status --short` and `git log --oneline -5`.
> State out loud: package, branch, objective, approved scope, hard exclusions, done, remaining, next exact action.
> Package: … | Branch: … | HEAD: … | Done: … | Remaining: … | Blocked: … | Next action: …

Hard stops:
- Do not hand off with a dirty working tree unless the uncommitted changes are intentional and fully described in the handoff
- `AI_HANDOFF.md` must be current before the switch

Full protocol: `docs/dev/tool-switching-protocol.md`
Claude/Codex interchangeability: `docs/dev/claude-codex-interchangeability.md`
