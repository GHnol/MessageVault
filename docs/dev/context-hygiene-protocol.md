# Context Hygiene Protocol — /clear, /compact, and High Context

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol
**Relationship:** This is the developer-facing companion to `docs/automation/operator-mode/context-continuity-protocol.md`. The operator-mode doc governs Operator Mode; this doc governs day-to-day context decisions for any agent.

---

## Core principle

A Claude Code or Codex session must never be the only place project state exists. Git is truth. Repo docs are durable memory. The session is disposable.

Before any context-destroying or context-degrading event, durable state must already be written to:

- `AI_HANDOFF.md` — in-flight work transfer
- `CURRENT_STATE.md` — durable project snapshot
- `NEXT_SESSION_PROMPT.md` — how the next session restarts

---

## Trigger signals

Treat any of the following as a context-hygiene trigger:

- High context usage indicator
- High uncached token count
- Auto-compact warning
- "/clear to start fresh" suggestion
- Model switch warning
- Long session age
- Repeated failed attempts at the same step
- Usage-limit risk
- Responses becoming slower, shorter, or losing earlier decisions

When a trigger appears, **do not blindly clear, compact, or continue.** Run the decision table below.

---

## Decision table

| Situation | Action |
|---|---|
| Need to see what is consuming context | Use `/context`. Do not guess. |
| Same task still active, useful context worth keeping | Update handoff files, then `/compact`. |
| Switching to a different task | Update handoff files, close out current work, then `/clear`. |
| After a task/package closeout | Update `CURRENT_STATE.md` + `NEXT_SESSION_PROMPT.md`, then `/clear`. |
| Repeated failed attempts on the same step | Update handoff files, `/clear`, restart from `NEXT_SESSION_PROMPT.md`, consider model switch (see `model-switching-protocol.md`). |
| Context bloated but repo handoff is current | Safe to `/clear`. |
| Context bloated and repo handoff is NOT current | Update handoff files first. Never `/clear` on a stale handoff. |

---

## Required pre-event update content

Before `/clear`, `/compact`, restart, tool switch, account switch, model switch, or context-heavy continuation, the handoff update must include:

1. Current branch
2. `git status`
3. Recent commits
4. Files changed
5. Files intentionally not changed
6. Exact task objective
7. Completed work
8. Remaining work
9. Blockers
10. Risks
11. Tests/checks run
12. Tests/checks not run
13. Exact next command sequence
14. Exact next-session prompt
15. Recommended commit message if at a good commit point

A handoff that says "we discussed this earlier" is not a valid handoff.

---

## Hard rules

- Never rely on conversation history alone for project continuity.
- Persistent project rules live in `AGENTS.md` and `CLAUDE.md`.
- Current state lives in `CURRENT_STATE.md`.
- Restart instructions live in `NEXT_SESSION_PROMPT.md`.
- Work transfer lives in `AI_HANDOFF.md`.
- Git remains the source of truth.
- Do not commit or push as a side effect of context hygiene unless explicitly instructed.
