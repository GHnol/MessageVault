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
| main HEAD | `89a17d0` — docs: mark Package 4E.1 closed in handoff file |
| Last closed package | `Package 4E.1 — E2E Startup Timing Reliability Patch` (merge `73dae00`) |
| Active package | `Package 2.7 — AI Development Operating System Upgrade Pass` (docs/infra only, in progress, uncommitted) |
| Active branch | `docs/ai-development-operating-system-upgrade` |
| Next package | Not authorized — Coordinator decision pending |

---

## Delivered packages (summary)

Authoritative table: `docs/command-center/current-status.md`. Packages 1 → 4E.1 are COMPLETE and merged. Test baseline: 1466 Node unit tests + 41 seeded E2E + 64 real-files E2E, all green.

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

Next development package, Package 5A, full Project Control Tower build, checkout/PDF/cover work, framework migration, visual redesign. See `docs/command-center/next-actions.md` "Do NOT start yet".

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
