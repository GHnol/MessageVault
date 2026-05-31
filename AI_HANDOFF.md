# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `awaiting-commit-approval` — AI Project OS v1.6 Gate 2C implementation complete on branch `docs/google-calendar-dependency-hygiene`. Working tree has staged deletions (605 node_modules files), and unstaged modifications to `.gitignore`, `scripts/package.json`, `scripts/package-lock.json`. All validations pass. Awaiting Coordinator commit approval before committing or merging.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-31`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | `AI Project OS v1.6 Gate 2C` — Scripts Dependency Hygiene and googleapis Setup |
| **Active branch** | `docs/google-calendar-dependency-hygiene` |
| **main HEAD** | `03169d7` — docs: sync state after v1.6 Gate 2A merge |
| **Last completed pass** | `AI Project OS v1.6 Gate 2A` — Live Read-Only Dry-Run Logic Completion — merged `a530c56` 2026-05-31 |
| **Active package** | None (scripts/infrastructure only) |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (current in-progress pass)

AI Project OS v1.6 Gate 2C — Scripts Dependency Hygiene and googleapis Setup. Delivered on branch `docs/google-calendar-dependency-hygiene`:
1. `.gitignore` updated: `scripts/node_modules/` pattern added (replaces stale comment about historical tracking).
2. `scripts/node_modules/` untracked from git index: `git rm -r --cached scripts/node_modules` staged 605 deletions. Files remain on disk and are now gitignored.
3. googleapis v173.0.0 installed via `npm --prefix scripts install googleapis` (45 packages added, all under `scripts/node_modules/`).
4. `scripts/package.json` and `scripts/package-lock.json` updated with googleapis dependency.
5. All validations pass: source validate (151 pass), local-only dry-run (10 READY_FOR_LIVE_COMPARE), fixture dry-run (Gate 3 blocked by 7 items as expected), OS audit (159 pass), project-control sync validate (11 pass).
6. No credentials, tokens, OAuth, live API calls, or app code changes.

**Commit not yet made** — awaiting Coordinator approval.

---

## Gate status (v1.6)

| Gate | Status |
|---|---|
| Gate 1 — Repo Implementation | COMPLETE — merged `5c4bd28` 2026-05-31 |
| Gate 2A — Fixture Logic Implementation | COMPLETE — merged `a530c56` 2026-05-31 |
| Gate 2C — Dependency Hygiene + googleapis Install | COMPLETE (pending commit + merge approval) — branch `docs/google-calendar-dependency-hygiene` |
| Gate 2B — Live Calendar Dry-Run | NOT STARTED — requires credential setup after Gate 2C merges |
| Gate 3 — Live Calendar Apply | NOT STARTED — requires Gate 2B approved artifact |

---

## What is required for Gate 2B (live dry-run)

1. Coordinator approves Gate 2C commit and merge.
2. Coordinator configures Google Calendar API credentials locally (`google-calendar-credentials.json` + `token.json`).
3. Coordinator optionally adds `AI_OS_ID:` markers to existing Google Calendar events (adoption guide: `docs/project-control/google-calendar-sync-policy.md`).
4. Run: `node scripts/google-calendar-sync-dry-run.mjs --live-readonly`
5. Save dry-run artifact to `local-sync-reports/`.
6. Coordinator reviews and approves classified delta.

v1.6 is NOT complete until Gate 3 live apply succeeds for KeepMees, or a documented credential/platform blocker is recorded.

---

## Hard exclusions verified (Gate 2C)

- `index.html` — not touched
- `src/**` — not touched
- `public/**` — not touched
- `amplify/**` — not touched
- `package.json`, `package-lock.json` (root) — not touched
- No live Google Calendar API calls
- No OAuth flow
- No credential files created, read, or written
- `external-sync-map.local.json` — not read or written
- No GitHub Project mutations
- No GitHub Issues created
- No Package 5B work
- No Gate 3 or --apply executed
- No secrets, tokens, or credentials staged or committed

---

## Next exact action

Coordinator reviews Gate 2C final report and approves commit. If approved:

```
git add .gitignore scripts/package.json scripts/package-lock.json
git commit -m "chore: move scripts dependencies out of git tracking

- stop tracking scripts/node_modules and ignore it going forward
- install googleapis in the scripts dependency area only
- keep scripts/package.json and scripts/package-lock.json as the tracked dependency contract
- preserve Google Calendar credential safety with no OAuth, tokens, API calls, or live sync"
```

Then merge `docs/google-calendar-dependency-hygiene` into `main`. After merge, Gate 2B (credential setup + live dry-run) can proceed.

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
| `scripts/node_modules/` | Now gitignored. 605 files staged for deletion (pending commit). googleapis v173.0.0 installed. Do not re-track. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes. |
