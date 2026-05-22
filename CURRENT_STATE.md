# CURRENT_STATE.md — Durable Project State Snapshot

**Purpose:** The single durable answer to "where is this project right now?" Survives `/clear`, `/compact`, model switch, tool switch, and new sessions. Git is the ultimate source of truth; this file is the fast human/agent-readable summary.

**Update this file:** at every package closeout, before any `/clear` or `/compact`, before a model or tool switch, and before stopping a long session.

---

## Project identity

- **Product:** KeepMees / MessageVault — single-file web app (`index.html`) plus modular `src/` engine (KMEngine).
- **Flagship:** Message Book. KeepMees is the broader keepsake product system; Message Book is the flagship, **not** the project boundary.
- **Truth model:** Git is truth. Repo docs are durable project memory. Conversation history is **not** durable memory.

---

## State as of last update

**Last updated:** `2026-05-17`
**Updated by:** `Claude Code (Opus 4.7)`

| Field | Value |
|---|---|
| main HEAD | `bdb73db` — merge: add KeepMees project control tower |
| Last closed package | `Package 2.8 — KeepMees Project Control Tower` (feature `2a5fb54`, merge `bdb73db`) |
| Active package | None — no package in progress |
| Active branch | `main` (status-sync `docs/sync-command-center-after-package-2-8` pending merge) |
| Next authorized target | None — Coordinator reviews the committed Tower and decides whether to authorize Package 5A |
| Package 5A | Still paused — Foundation Operating System Gate now passable; awaits explicit Coordinator authorization |

---

## Delivered packages (summary)

Authoritative table: `docs/command-center/current-status.md`. Packages 1 → 4E.1 and Packages 2.7, 2.8 are COMPLETE and merged. Test baseline: 1466 Node unit tests + 41 seeded E2E + 64 real-files E2E, all green. Packages 2.7 and 2.8 added operating infrastructure only (no app code).

---

## Gates (do not cross without authorization)

| Gate | Status |
|---|---|
| Vendor confirmed | NO — evaluation in progress |
| `isCoverUnblocked()` | false |
| Commerce readiness (message-book) | blocked |
| Server PDF pipeline | not started |
| Designer confirmed | COMMERCIAL HOLD |
| Figma master built + approved | not started |

---

## Locked truths (do not reopen without explicit product authority)

- Message Book pagination constants and `BOOK_PAGINATION_VERSION` are scope-guarded.
- Standalone keepsake flows and Review view are off-limits without explicit instruction.
- External designer contracting is paused.
- Vendor / manufacturing scope is gated.
- Packaging / gifting scope is gated.
- Preview truth (in-app) is distinct from Figma / design truth.

---

## What is NOT started

Package 5A, checkout/PDF/cover work, framework migration, visual redesign, preview renderers, vendor outreach, design hiring restart. Project Control Tower is now BUILT and MERGED — Coordinator review of the committed Tower is the next coordination step. See `docs/command-center/next-actions.md` "Do NOT start yet".

---

## Where to look — Project Control Tower (Package 2.8)

| Question | File |
|---|---|
| Tower overview + how layers fit | `docs/project-control/README.md` |
| Phases 0–15 with package history | `docs/project-control/master-roadmap.md` |
| Dated, confidence-labelled schedule | `docs/project-control/master-schedule.md` |
| Current sprint | `docs/project-control/current-sprint.md` |
| Backlog (16 lanes) | `docs/project-control/backlog.md` |
| Kanban board | `docs/project-control/kanban-board.md` |
| Phase gates (11) | `docs/project-control/phase-gates.md` |
| Decision log | `docs/project-control/decision-log.md` |
| Project risk register | `docs/project-control/risk-register.md` |
| Calendar + importable .ics | `docs/project-control/calendar-spec.md`, `keepmees-project-calendar.ics` |
| ClickUp / TickTick imports | `clickup-import.csv`, `ticktick-import.csv`, `ticktick-weekly-checklist.md`, `ticktick-recurring-routines.md` |
| 7 / 30 / 90 day plans | `next-7-days.md`, `next-30-days.md`, `next-90-days.md` |
| Weekly sync process | `coordinator-weekly-sync.md` |
| Next session prompt | `next-session-prompt.md` |

---

## Where to look

| Question | File |
|---|---|
| Universal agent rules | `AGENTS.md` |
| Claude-specific rules | `CLAUDE.md` |
| In-flight work transfer | `AI_HANDOFF.md` |
| How to restart a session | `NEXT_SESSION_PROMPT.md` |
| Delivered package state | `docs/command-center/current-status.md` |
| What to do / not start | `docs/command-center/next-actions.md` |
| Risks | `docs/ops/risk-register.md` |
| Decisions | `docs/ops/decision-register.md` |
