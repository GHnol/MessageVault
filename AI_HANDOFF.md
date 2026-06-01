# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `complete` — AI Project OS v1.6 advisory repair MERGED to main 2026-06-01. Merge commit: `db45e6a`. main HEAD: `db45e6a`. Working tree clean. 166 OS audit pass. Package 5B blocked.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-06-01`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | None |
| **Active branch** | `main` |
| **main HEAD** | `db45e6a` — merge: Google Calendar sync-map read path advisory repair |
| **Last completed pass** | `AI Project OS v1.6 advisory repair` — sync-map read path — merged `db45e6a` 2026-06-01 |
| **Active package** | None |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (last completed pass)

Advisory repair — Google Calendar sync-map read path — 2026-06-01. Delivered:
1. Root cause identified: `runLiveMode` in `scripts/google-calendar-sync-dry-run.mjs` passed `fixtureLocalMap: {}` (empty) to `compareSourceToEvents`, never reading `external-sync-map.local.json`.
2. Fix: `loadLocalSyncMap()` function added — reads `external-sync-map.local.json` in read-only mode, supports apply-script shape (`google_calendar.events[os_id]`) and example shape (`google_calendar[os_id]` directly).
3. `buildLocalMapDiagnostics()` added — safe diagnostics section in artifact (no raw event IDs or credentials).
4. `--sync-map-fixture <path>` flag added to fixture mode — proves read path without live calendar access.
5. New fixture file: `docs/project-control/google-calendar-external-sync-map.fixture.json` (fake placeholder IDs only).
6. `docs/project-control/google-calendar-sync-log.md` updated with repair entry.
7. Post-repair live dry-run: 488 events fetched, 10 NO_OP, 0 MISSING_LOCAL_MAPPING, 0 blockers, `gate3_apply_allowed: true`.
8. OS self-audit: 166 pass, 0 warn, 0 fail. Hard-exclusion diff: clean.

No credential or token contents printed. No events deleted or cancelled.

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

Advisory repair merged to `main` (`db45e6a`). Coordinator authorizes next product package (Package 5B or other). No product package work authorized without explicit instruction. Push to `origin/main` pending separate Coordinator authorization.

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
