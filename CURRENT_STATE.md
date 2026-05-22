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

**Last updated:** `2026-05-22`
**Updated by:** `Claude Code (Opus 4.7)`

| Field | Value |
|---|---|
| main HEAD | `a20af30` — merge: upgrade AI Project OS auto-management |
| Last closed package | `Package 2.9 — AI Project OS Auto-Management Upgrade Pass` (implementation `81c5069`, merge `a20af30`); status sync in progress on `docs/sync-command-center-after-package-2-9` |
| Active package | None — Coordinator decides next |
| Active branch | `docs/sync-command-center-after-package-2-9` (status-sync pending merge to main) |
| Next authorized target | Coordinator decides whether to authorize Package 5A — Foundation Operating System Gate was passed by Package 2.8 and the AI Project OS auto-management layer is now in place |
| Package 5A | Still paused — awaits explicit Coordinator authorization (independent of Package 2.9 closure) |

---

## Delivered packages (summary)

Authoritative table: `docs/command-center/current-status.md`. Packages 1 → 4E.1 and Packages 2.7, 2.8, 2.9 are COMPLETE and merged. Test baseline: 1466 Node unit tests + 41 seeded E2E + 23 real-files E2E (64 combined), all green. Packages 2.7, 2.8, 2.9 added operating infrastructure only (no app code).

---

## Gates (do not cross without authorization)

| Gate | Status |
|---|---|
| Foundation Operating System (Gate 1) | Passed by Package 2.8; further strengthened by Package 2.9 (universal AI Project OS layer + auto-management protocols) |
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

Package 5A, checkout/PDF/cover work, framework migration, visual redesign, preview renderers, vendor outreach, design hiring restart. The Project Control Tower (Package 2.8) and the AI Project OS auto-management layer (Package 2.9) are both BUILT and MERGED. App code is unchanged.

---

## Where to look — AI Project OS layer (Package 2.9)

| Question | File |
|---|---|
| What is the AI Project OS layer? | `docs/ai-system/README.md` |
| Universal standards across repos | `docs/ai-system/universal-standards.md` |
| How to bootstrap a new repo with this OS | `docs/ai-system/bootstrap-template.md` |
| OS-level changelog | `docs/ai-system/CHANGELOG.md` |
| OS version history (Package 2.7 → 2.8 → 2.9 → ...) | `docs/ai-system/version-history.md` |
| Umbrella auto-management duties | `docs/dev/auto-management-protocol.md` |
| Which model for which task | `docs/dev/model-routing-protocol.md` |
| Token-efficiency discipline | `docs/dev/token-efficiency-protocol.md` |
| Pre-flight context budget | `docs/dev/context-budget-checklist.md` |
| Tool batching | `docs/dev/tool-batching-protocol.md` |
| Package boundary closeout | `docs/dev/package-boundary-closeout-protocol.md` |
| Notification setup (user-level) | `docs/dev/notification-setup.md` |
| Test strategy | `docs/qa/test-strategy.md` |
| Per-package verification | `docs/qa/package-verification-template.md` |
| Planned custom slash commands (placeholder) | `.claude/commands/README.md` |

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
| Next session prompt (Tower) | `next-session-prompt.md` |

---

## Where to look

| Question | File |
|---|---|
| Universal agent rules | `AGENTS.md` |
| Claude-specific rules | `CLAUDE.md` |
| Codex-specific rules | `.codex/README.md` |
| In-flight work transfer | `AI_HANDOFF.md` |
| How to restart a session | `NEXT_SESSION_PROMPT.md` |
| Delivered package state | `docs/command-center/current-status.md` |
| What to do / not start | `docs/command-center/next-actions.md` |
| Risks | `docs/ops/risk-register.md` |
| Decisions | `docs/ops/decision-register.md` |
| AI Project OS standards (universal) | `docs/ai-system/universal-standards.md` |
| Auto-management umbrella | `docs/dev/auto-management-protocol.md` |
