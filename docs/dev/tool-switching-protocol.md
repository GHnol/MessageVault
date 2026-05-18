# Tool Switching Protocol — Claude Code ↔ Codex ↔ Other Agents

**Applies to:** Any AI coding agent in this repository
**Status:** Active — required operating protocol
**See also:** `docs/dev/claude-codex-interchangeability.md` (role model), `docs/automation/operator-mode/claude-codex-relay-protocol.md` (transfer packet format)

---

## Principle

One coding agent owns the active branch at a time. A tool switch (Claude Code → Codex, Codex → Claude Code, or to any other agent) is a handoff, never a silent continuation. Chat memory does not transfer between tools. Only the repo transfers.

---

## Outgoing agent — before switching tools

1. Finish the current logical unit (one function, one file). Do not stop mid-implementation.
2. Update `AI_HANDOFF.md` with all required fields.
3. Update `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` if the project state changed.
4. Produce a transfer packet in the chat (format: `claude-codex-relay-protocol.md`).
5. Do not commit or push unless explicitly instructed.

## Incoming agent — before touching anything

1. Read `AGENTS.md`
2. Read `CLAUDE.md` (if the incoming agent is Claude Code)
3. Read `AI_HANDOFF.md`
4. Read `CURRENT_STATE.md`
5. `git status --short`
6. `git log --oneline -10`
7. Read the package docs referenced by `AI_HANDOFF.md`
8. State current package, branch, objective, scope, exclusions, files changed, tests run, next exact action

**If `AI_HANDOFF.md` is missing, stale, or conflicts with git state: stop and ask the Coordinator. Do not proceed from the transfer packet alone.**

---

## When to switch tools

| Reason | Switch to |
|---|---|
| Claude Code at usage limit | Codex (fallback implementer) |
| Need an independent review of Claude's work | Codex (reviewer) |
| Hard bug Claude cannot isolate | Codex (debugging specialist), or back to Claude with fresh context |
| Need a second technical reasoning path | Codex (alternative reasoning) |
| Codex blocked / unavailable | Claude Code |

The branch owner is whichever single agent is currently implementing. Reviewers and debuggers advise; they do not commit on a branch they do not own without an explicit handoff.

---

## Hard rules

- No blind edits after a tool switch — verify against current files, not the transfer packet alone.
- No commit/push without explicit instruction.
- No scope expansion across a switch — the incoming agent inherits package scope, not product authority.
- Scope-guarded areas remain off-limits regardless of which tool is active.
