# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS v1.6 Gate 2A complete (fixture validation). Branch: `docs/google-calendar-live-dry-run-logic`. Working tree: 2 modified files uncommitted. Gate 2B (live dry-run) requires googleapis install approval + credentials. Package 5B blocked.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-31`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | `AI Project OS v1.6 Gate 2A` — live dry-run logic implementation |
| **Active branch** | `docs/google-calendar-live-dry-run-logic` |
| **main HEAD** | `54867a8` — docs: sync state after v1.6 Gate 1 merge |
| **Last completed pass** | `AI Project OS v1.6 Gate 1` — Google Calendar live sync repo foundation — merged `5c4bd28` 2026-05-31 |
| **Active package** | None |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (last completed pass)

AI Project OS v1.6 Gate 2A — Live Dry-Run Comparison Logic Implementation (in-progress, uncommitted on branch `docs/google-calendar-live-dry-run-logic`). Delivered: full comparison logic in `scripts/google-calendar-sync-dry-run.mjs` (fixture mode `--fixture`, live mode scaffold `--live-readonly`), fixture file `docs/project-control/google-calendar-live-events.fixture.json` exercising all 11 classification values, dry-run artifact schema. No live API calls. googleapis not installed. credentials not configured. Gate 2B can run `--live-readonly` when googleapis installed + credentials ready.

---

## Gate status (v1.6)

| Gate | Status |
|---|---|
| Gate 1 — Repo Implementation | COMPLETE — merged `5c4bd28` 2026-05-31 |
| Gate 2A — Fixture Logic Implementation | IN PROGRESS — branch `docs/google-calendar-live-dry-run-logic`, uncommitted |
| Gate 2B — Live Calendar Dry-Run | NOT STARTED — requires googleapis install approval + credentials |
| Gate 3 — Live Calendar Apply | NOT STARTED — requires Gate 2B approved artifact |

---

## What is required for Gate 2B (live dry-run)

1. Coordinator approves commit + merge of Gate 2A branch.
2. Coordinator approves `googleapis` npm package install in `scripts/` directory:
   `cd scripts && npm install googleapis`
3. Coordinator configures Google Calendar API credentials locally (`google-calendar-credentials.json` + `token.json`).
4. Coordinator optionally adds `AI_OS_ID:` markers to existing Google Calendar events (adoption guide: `docs/project-control/google-calendar-sync-policy.md`).
5. Run: `node scripts/google-calendar-sync-dry-run.mjs --live-readonly`
6. Save dry-run artifact to `local-sync-reports/`.
7. Coordinator reviews and approves classified delta.

v1.6 is NOT complete until Gate 3 live apply succeeds for KeepMees, or a documented credential/platform blocker is recorded.

---

## Hard exclusions verified

- `index.html` — not touched
- `src/**` — not touched
- `public/**` — not touched
- `amplify/**` — not touched
- `package.json`, `package-lock.json` — not touched
- No live Google Calendar mutations
- No OAuth flow
- No credential files created, read, or written
- `external-sync-map.local.json` — not read or written
- No GitHub Project mutations
- No GitHub Issues created
- No Package 5B work
- No v1.7 automation implemented
- No secrets, tokens, or credentials committed

---

## Next exact action

1. Coordinator reviews Gate 2A work on branch `docs/google-calendar-live-dry-run-logic`.
2. Coordinator approves commit message: `docs: complete Google Calendar live dry-run comparison logic`
3. Coordinator approves merge to `main`.
4. Then: Coordinator decides whether to authorize Gate 2B (live dry-run) — approve googleapis install + credential setup.

Do not commit, push, or merge without Coordinator approval.

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
| `scripts/node_modules/` | Historically tracked. Do NOT untrack without Coordinator decision. Do NOT install googleapis without Coordinator approval. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes. |
