# Claude Code ↔ Codex Interchangeability

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating model
**See also:** `tool-switching-protocol.md`, `docs/automation/operator-mode/claude-codex-relay-protocol.md`

---

## Why this exists

The project must keep moving even if one tool hits a usage limit, is unavailable, or is the wrong tool for a specific task. Claude Code and Codex are treated as interchangeable agents over the same durable substrate: **git + repo docs**. Neither tool's chat memory is part of the project.

---

## Codex roles

Codex is explicitly supported as:

1. **Backup implementation agent** — owns the active branch and implements when Claude Code is unavailable or at a usage limit.
2. **Reviewer** — independent review of Claude Code's diff before commit.
3. **Debugging specialist** — isolates hard bugs Claude Code cannot pin down.
4. **Usage-limit fallback** — continuity path when Claude Code cannot continue.
5. **Alternative technical reasoning agent** — a second reasoning path for architecture or risk calls.

Claude Code holds the symmetric roles when Codex is the primary.

---

## The shared contract

Both tools obey the same universal contract:

- `AGENTS.md` is the universal agent contract (applies to all tools).
- `CLAUDE.md` extends `AGENTS.md` with Claude-specific behavior. A Codex-specific layer lives in `.codex/README.md`.
- `AI_HANDOFF.md` is the only valid work-transfer channel between tools.
- `CURRENT_STATE.md` is the durable project snapshot.
- `NEXT_SESSION_PROMPT.md` is the restart entry point.

---

## Handoff rules (either direction)

Outgoing tool: finish the current logical unit, update `AI_HANDOFF.md` (+ `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` if state changed), produce a transfer packet, do not commit unless instructed.

Incoming tool: read `AGENTS.md` → tool-specific layer → `AI_HANDOFF.md` → `CURRENT_STATE.md` → `git status` → `git log` → referenced package docs. Then state package, branch, objective, scope, exclusions, done, remaining, next action. If the handoff is missing/stale/conflicting: stop and ask the Coordinator.

---

## Branch ownership

Exactly one tool owns the active branch at any moment. Reviewers and debuggers advise but do not commit to a branch they do not own without an explicit ownership handoff recorded in `AI_HANDOFF.md`.

---

## Invariants regardless of tool

- Git is truth; repo docs are durable memory.
- No blind edits; no commit/push without explicit instruction.
- Scope-guarded areas are off-limits to every tool.
- Locked product/vendor/design truth is preserved by every tool.
