# Agent Scope Boundaries

**Applies to:** Any AI coding agent in this repository
**Status:** Active — required operating protocol

This document is the single consolidated list of what agents may and may not do without explicit authorization. It restates and points to authority defined in `AGENTS.md`, `CLAUDE.md`, and the operator-mode protocols.

---

## Always off-limits without explicit instruction

| Area | Location |
|---|---|
| Pagination constants (`BOOK_PAGE_LINES`, `BOOK_HEADER_LINES`, `BOOK_DIVIDER_LINES`, `BOOK_FEATURED_HEADER_LINES`, `BOOK_CONTINUATION_LINES`) | `index.html` |
| `BOOK_PAGINATION_VERSION` | `index.html` |
| `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY` | `index.html` |
| Standalone keepsake flows | `index.html` |
| Review view | `index.html` |
| Locked production decisions | `docs/ops/decision-register.md`, memory |
| `.claude/settings.local.json`, `_source-intake/`, generated outbox/inbox files | repo root / folders |

---

## Requires explicit Coordinator/package authorization

- Starting a new package
- Committing or pushing
- Deploying
- Changing production config
- Adding dependencies (must be explained)
- Any checkout / PDF / cover / vendor-export / visual-redesign work
- Broadening vendor or manufacturing scope
- Restarting external design contracting
- Creating vendor outreach packets
- Reopening locked product decisions
- Building the full Project Control Tower
- Expanding scope mid-package (stop, flag, ask — never self-authorize)

---

## Allowed within an authorized package

- Creating new `src/` modules per the package spec
- Writing tests for new modules
- Creating new `docs/` files (docs packages)
- Running tests and read-only git operations
- Producing closeout and review packets
- Updating continuity files (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`)

---

## Product truth that must be preserved

- Git is truth; repo docs are durable memory.
- Message Book is the flagship, not the project boundary.
- KeepMees is a broad keepsake product system.
- Preview truth (in-app) is distinct from Figma / design truth.
- External designer contracting is paused.
- Vendor / manufacturing and packaging / gifting are gated.
- Do not create product claims the current system does not support.

---

## When a boundary is unclear

Stop and ask. A clarifying question is cheaper than an unwanted change. Note the question in `AI_HANDOFF.md` under blockers; do not work around it.
