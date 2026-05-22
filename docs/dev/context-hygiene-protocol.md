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

---

## High uncached context protocol (added in Package 2.9)

When Claude Code reports unusually high uncached token/context cost (e.g. 300k+, 500k+):

1. **Do not continue blindly.** A long uncached transcript is a continuity warning, not normal operation.
2. **Do not default to `claude --continue`.** Long stale sessions drag the full transcript into every turn, are slow, and increase the risk of dropped decisions.
3. **Require that `AI_HANDOFF.md`, `CURRENT_STATE.md`, and `NEXT_SESSION_PROMPT.md` are current.** Update first if not.
4. **Recommend a fresh session from repo truth.** A fresh Claude session in this repo should be able to resume from `AGENTS.md` + `CLAUDE.md` + `AI_HANDOFF.md` + `CURRENT_STATE.md` + git state, without dragging the prior transcript.
5. **Continue the existing session only if the active uncached context is genuinely needed** and the user accepts the cost. State that judgment out loud before continuing.

The goal: project truth lives in repo files, not in an endless chat transcript. The session is disposable; the repo is permanent.

See `docs/dev/auto-management-protocol.md` § "High uncached context protocol" for the broader auto-management context.

---

## Fresh-session preference

Default to a fresh repo-truth session at every package boundary, after any merge to main, after a long debugging chain, after any explicit checkpoint/handoff trigger phrase, and any time uncached context exceeds the user's tolerance.

Continue an existing session only when: same logical task is mid-flight, active context is genuinely useful and small, no package boundary has been reached.
