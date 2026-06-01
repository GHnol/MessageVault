# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS v1.7 Gate 1 audit complete. Planning artifact created. Awaiting Coordinator review and Gate 2 authorization.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-06-01`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | `AI Project OS v1.7 — Zero-Fault Closeout Contract` — Gate 1 (audit and planning) |
| **Active branch** | `docs/ai-project-os-v1-7-zero-fault-audit` |
| **main HEAD** | `96033b7` — docs: sync state after Google Calendar sync-map advisory repair |
| **Last completed pass** | `AI Project OS v1.6 advisory repair` — sync-map read path — merged `db45e6a` 2026-06-01 |
| **Active package** | None (v1.7 is OS-layer work, not a product package) |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked until v1.7 complete + explicit Coordinator authorization |

---

## Objective (active pass — v1.7 Gate 1)

AI Project OS v1.7 Gate 1 — Zero-Fault OS Audit and Implementation Plan.

**Gate 1 is complete.** Delivered:
1. Full audit of all 43+ OS docs, 22 scripts, 18 commands, 16 skills, 1 agents placeholder, 5 validators.
2. Enforceability map: automatic / script-assisted / skill-routed / approval-gated / policy-only / manual / backlog.
3. Gap report across 10 audit dimensions (closeout, freshness, mirroring, context, model routing, custom settings, docs-watch, notifications, external sync, bootstrap copy-forward).
4. State-sync commit strategy decision matrix (addendum A).
5. Playwright and test trustworthiness map (addendum B) — 1603 tests confirmed; `test-strategy.md` count stale (says 1466).
6. 6-gate v1.7 implementation plan with per-gate file targets, script specs, and commit messages.
7. Classification of all v1.7 candidates: IMPLEMENT NOW / IMPLEMENT LATER / MANUAL ONLY / REJECT / MONITOR.
8. Identified stale state: `kanban-board.md` and `current-sprint.md` are operationally misleading (v1.3–v1.6 not in Done; Sprint 2026-05-B shows as active).
9. Planning artifact: `docs/ai-system/v1-7-zero-fault-audit-plan.md`.

No scripts, skills, commands, or OS protocol docs modified in Gate 1.

---

## Gate status (v1.6 + advisory repair)

| Gate | Status |
|---|---|
| Gate 1 — Repo Implementation | COMPLETE — merged `5c4bd28` 2026-05-31 |
| Gate 2A — Fixture Logic Implementation | COMPLETE — merged `a530c56` 2026-05-31 |
| Gate 2C — Dependency Hygiene + googleapis Install | COMPLETE — merged `041761a` 2026-05-31 |
| Gate 2D Repair — OAuth Bootstrap + Path Alignment | COMPLETE — merged `fe1315a` 2026-05-31 |
| Gate 2D — Live Calendar Read-Only Dry-Run | COMPLETE — 2026-06-01. 478 events fetched. 10 CREATE, 0 blockers. Artifact: `local-sync-reports/google-calendar-dry-run-live-2026-06-01T00-21-06-514Z.json` |
| Gate 3 — Live Calendar Apply | COMPLETE — 2026-06-01. 10 events created. 0 errors. Post-apply dry-run: all 10 NO_OP, high confidence. |
| Advisory Repair — Sync-Map Read Path | COMPLETE — merged `db45e6a` 2026-06-01. Post-repair live dry-run: 488 events, 10 NO_OP, 0 MISSING_LOCAL_MAPPING, 0 blockers. |

**AI Project OS v1.6 — COMPLETE. Advisory repair merged `db45e6a` 2026-06-01.**

---

## Advisory status

RESOLVED. The `MISSING_LOCAL_MAPPING` advisory from the post-Gate-3 dry-run has been repaired. Root cause was that `runLiveMode` passed an empty map to `compareSourceToEvents`. Fixed by reading `external-sync-map.local.json` and supporting both the apply-script shape and the example shape. Post-repair live dry-run confirms: 0 MISSING_LOCAL_MAPPING, 10 NO_OP, 0 blockers.

---

## Hard exclusions verified (advisory repair)

- `index.html` — not touched
- `src/**` — not touched
- `public/**` — not touched
- `amplify/**` — not touched
- `package.json`, `package-lock.json` (root) — not touched
- No GitHub Project mutations
- No GitHub Issues created
- No Package 5B work
- No events deleted or cancelled
- No credential or token file contents read or printed
- `local-sync-reports/` — gitignored, not staged or committed
- `external-sync-map.local.json` — gitignored, written locally only, not staged or committed
- `google-calendar-token.local.json` — gitignored, not staged or committed
- `google-calendar-credentials.local.json` — gitignored, not staged or committed

---

## Next exact action

Coordinator reviews `docs/ai-system/v1-7-zero-fault-audit-plan.md` Gate 1 report. If approved:
1. Authorize v1.7 Gate 2 (Closeout and State Freshness Validators).
2. Specify any reclassifications (IMPLEMENT NOW ↔ LATER ↔ REJECT).
3. Confirm kanban/sprint stale state correction is in scope for Gate 2.
4. This branch (`docs/ai-project-os-v1-7-zero-fault-audit`) needs a commit and merge to main before Gate 2 begins.

Do not start Gate 2 without Coordinator approval. Do not start Package 5B. Do not push without explicit instruction.

---

## Source-of-truth files to read first on resume

1. `AGENTS.md`
2. `CLAUDE.md`
3. This file (`AI_HANDOFF.md`)
4. `CURRENT_STATE.md`
5. `docs/ai-system/README.md`
6. `docs/dev/auto-management-protocol.md`
7. `git status --short` / `git log --oneline -10`

---

## File-level warnings

| File | Warning |
|---|---|
| `index.html` | Scope-guarded constants, Review view, standalone keepsake flows — off-limits without explicit instruction. |
| `src/products/product-experience-readiness.js` | Off-limits — do not touch EXPERIENCE_STATUS.PROOF_READY. |
| `src/state/project-persistence.js` | Off-limits without explicit package instruction. |
| `src/state/session-serialization.js` | Off-limits without explicit package instruction. |
| `docs/project-control/external-sync-map.local.json` | Gitignored, local-only — never commit; do not read or print contents. |
| `scripts/google-calendar-sync-apply.mjs` | `--confirm-live-calendar-apply` flag required for Gate 3. Also requires `--apply`, `--approved-dry-run <path>`, and no unresolved DUPLICATE_DETECTED or ADOPTION_REQUIRED items. |
| `scripts/google-calendar-sync-dry-run.mjs` | `--live-readonly` mode requires credentials + googleapis. Gate 2B not yet authorized. `--fixture` mode requires no credentials. |
| `scripts/node_modules/` | Gitignored. Not tracked in git. googleapis v173.0.0 installed locally. Do not re-track. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes. |
