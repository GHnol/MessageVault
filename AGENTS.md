# AGENTS.md — AI Coding Agent Instructions

This file is the **universal agent contract**. It applies to every AI coding agent working in this repository (Claude Code, Codex, ChatGPT Development, and any other).

**Tool layering:**
- `AGENTS.md` — universal contract (this file). Never overridden.
- `CLAUDE.md` — Claude Code-specific behavior. Extends this file.
- `.codex/README.md` — Codex-specific behavior. Extends this file.
- `docs/automation/operator-mode/*` — KeepMees operating procedures.
- Active package instruction — what the current session is authorized to do.

An agent reads the universal contract first, then its own tool layer, then operating procedures, then the package instruction.

---

## Project overview

**KeepMees / MessageVault** — Single-file web app (`index.html`) for the Message Book product.

- Do not touch standalone keepsake flows.
- Do not touch the Review view unless explicitly instructed.
- Do not modify application behavior unless the task explicitly requires it.
- Do not refactor code beyond the stated task scope.

---

## Core rules

1. **Git is source of truth.** Never trust in-context summaries of file state. Read the file.
2. **One branch per task.** Never work directly on `main`.
3. **One active editing agent per branch.** If you are picking up work from another agent, read `AI_HANDOFF.md` first.
4. **Do not commit or push unless explicitly instructed by the user.**
5. **Keep changes narrow.** Fix the stated problem. Do not clean up surrounding code.
6. **Preserve existing behavior** unless the task explicitly requires changing it.
7. **Run relevant tests or explain why they were not run.**
8. **Manual QA is required before commit for any UI or behavior change.** Document results in `docs/qa/manual-qa-template.md`.
9. **Update `AI_HANDOFF.md` before stopping** if your work is incomplete or being transferred.
10. **Do not claim work is complete** unless you have verified tests pass and manual QA requirements are met or explicitly waived.
11. **Do not deploy, change production config, or edit secrets** without explicit approval.
12. **Do not add dependencies** without explaining why.
13. **Do not make product claims** the current system does not support.
14. **Preserve locked truth:** Message Book is the flagship, not the project boundary; KeepMees is a broad keepsake system; preview truth is distinct from design truth; external designer contracting is paused; vendor/manufacturing and packaging/gifting are gated.
15. **Provide exact commands, exact results, and an exact changed-file list.** Provide a recommended commit message whenever work reaches a good commit point.

---

## Durable continuity files

The session is disposable. The repo is permanent. These files are the durable memory — keep them current:

| File | Role |
|---|---|
| `AGENTS.md` / `CLAUDE.md` / `.codex/README.md` | Persistent rules |
| `CURRENT_STATE.md` | Durable project snapshot — where the project is now |
| `AI_HANDOFF.md` | In-flight work transfer |
| `NEXT_SESSION_PROMPT.md` | How the next session restarts |

Update `AI_HANDOFF.md`, `CURRENT_STATE.md`, and `NEXT_SESSION_PROMPT.md` before any major stop, context compaction, `/clear`, `/compact`, model switch, tool switch, account switch, or branch handoff.

---

## Context, model, and tool switching

| Situation | Protocol |
|---|---|
| Restarting any session / after `/clear` / `/compact` / new day | `docs/dev/session-restart-protocol.md` |
| `/clear` vs `/compact` vs `/context` decision, high context/usage | `docs/dev/context-hygiene-protocol.md` |
| Switching Claude model (e.g. to Opus) | `docs/dev/model-switching-protocol.md` |
| Switching tool (Claude ↔ Codex) | `docs/dev/tool-switching-protocol.md` |
| Codex roles and interchangeability | `docs/dev/claude-codex-interchangeability.md` |
| Parallel work / worktrees | `docs/dev/worktree-and-parallel-session-policy.md` |
| Full scope boundary list | `docs/dev/agent-scope-boundaries.md` |

A model-switch or context warning is a **cost/continuity warning, not an error**. Checkpoint, then proceed.

---

## Branch naming

```
task/<short-description>
fix/<short-description>
docs/<short-description>
```

---

## Handoff protocol

When stopping mid-task or handing off to another agent:

1. Write current state to `AI_HANDOFF.md`.
2. Include: what was done, what remains, what is blocked, and any file-level warnings.
3. Do not delete or overwrite a prior handoff without reading it first.

---

## Files agents must not modify without explicit instruction

- `index.html` pagination constants (`BOOK_PAGE_LINES`, `BOOK_HEADER_LINES`, etc.)
- `BOOK_PAGINATION_VERSION`
- `BOOK_PRODUCTION_DEPS`
- Any locked production decisions documented in memory

---

## Context Continuity Guard

Context limits, auto-compact events, and agent switches are known risks in long sessions. These rules prevent context loss from corrupting in-progress work.

1. **Do not rely on auto-compact as project memory.** Auto-compact may silently drop decisions made earlier in the session. The repo docs are the durable source of truth — not the session summary.
2. **Before any long task, confirm:** current package, branch, objective, and approved scope. Read `AI_HANDOFF.md`, `CLAUDE.md`, `AGENTS.md`, and the relevant package docs before touching code.
3. **During long tasks, maintain a rolling handoff summary.** At all times, know what you have done, what remains, and what is blocked. Do not let this state exist only in active context.
4. **Before stopping, compacting, switching agents, hitting context pressure, or asking the user to continue later:** update `AI_HANDOFF.md` or produce a full transfer packet. Never abandon a task mid-stream without a written handoff.
5. **After any context summary or compact event:** resume only from repo truth — `AI_HANDOFF.md`, git status, recent commits, and approved package docs. Do not resume from vague compressed memory of what was discussed.
6. **If uncertain about scope, current state, or prior decisions:** stop and ask rather than guessing. A clarifying question is cheaper than an unwanted change.

**User trigger phrases:** If the user says "checkpoint", "handoff", "before compact", "resume packet", or "context guard" — update `AI_HANDOFF.md` immediately.

Full protocol: `docs/automation/operator-mode/context-continuity-protocol.md`

---

## When in doubt

Ask. Do not guess at scope. A clarifying question is cheaper than an unwanted change.
