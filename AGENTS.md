# AGENTS.md — AI Coding Agent Instructions

This file applies to all AI coding agents working in this repository (Claude Code, Codex, ChatGPT Development, etc.).

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

## When in doubt

Ask. Do not guess at scope. A clarifying question is cheaper than an unwanted change.
