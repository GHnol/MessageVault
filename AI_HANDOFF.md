# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS v1.6 Gate 2D Repair on branch `docs/google-calendar-oauth-path-alignment`. Uncommitted. Awaiting Coordinator review and commit authorization. Package 5B blocked.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-31`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | `AI Project OS v1.6 Gate 2D Repair` — Canonical OAuth Bootstrap and Credential Path Alignment |
| **Active branch** | `docs/google-calendar-oauth-path-alignment` |
| **main HEAD** | `a3e3cb8` — docs: sync state after v1.6 Gate 2C merge |
| **Last completed pass** | `AI Project OS v1.6 Gate 2C` — merged `041761a` 2026-05-31 |
| **Active package** | None (tooling repair pass) |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (Gate 2D Repair — in progress)

Repair tooling blocker `LIVE_READONLY_DRY_RUN_BLOCKED_TOKEN_BOOTSTRAP_NOT_IMPLEMENTED`. Align credential/token paths to canonical `docs/project-control/` convention. Add OAuth bootstrap support to committed tooling.

Delivered (uncommitted, branch `docs/google-calendar-oauth-path-alignment`):
1. `scripts/google-calendar-auth-bootstrap.mjs` — new canonical OAuth bootstrap script with `--auth-status` and `--init-oauth`.
2. `scripts/google-calendar-sync-dry-run.mjs` — canonical credential/token paths as defaults; `--auth-status`; `--help`; `resolveCredPaths()` with explicit legacy root fallback; `OAUTH_BOOTSTRAP_REQUIRED` message when token missing.
3. `docs/project-control/google-calendar-credentials.example.md` — canonical paths, updated setup steps.
4. `docs/project-control/google-calendar-sync-runbook.md` — Gate 2B prerequisites updated.
5. `.claude/skills/google-calendar-sync/SKILL.md` — canonical paths, new auth commands.
6. `scripts/os-self-audit.mjs` — canonical path gitignore checks; auth-bootstrap file checks.
7. `docs/project-control/google-calendar-sync-log.md` — repair entry.
8. `docs/ai-system/CHANGELOG.md`, `version-history.md` — repair entry.

All validations: OS audit (166 pass, 0 warn, 0 fail), source validate (151 pass), local-only dry-run (10 READY_FOR_LIVE_COMPARE), fixture dry-run (blocked by 7 items as expected), project-control sync validate (11 pass).

No OAuth run. No live API call. No credential contents read or printed.

---

## Gate status (v1.6)

| Gate | Status |
|---|---|
| Gate 1 — Repo Implementation | COMPLETE — merged `5c4bd28` 2026-05-31 |
| Gate 2A — Fixture Logic Implementation | COMPLETE — merged `a530c56` 2026-05-31 |
| Gate 2C — Dependency Hygiene + googleapis Install | COMPLETE — merged `041761a` 2026-05-31 |
| Gate 2D Repair — OAuth Bootstrap + Path Alignment | IN PROGRESS — branch `docs/google-calendar-oauth-path-alignment`, uncommitted |
| Gate 2D — Live Calendar Read-Only Dry-Run | NOT STARTED — requires: Gate 2D Repair merged, OAuth bootstrap run, Coordinator authorization |
| Gate 3 — Live Calendar Apply | NOT STARTED — requires Gate 2D approved artifact |

---

## What is required after Gate 2D Repair merges

1. Coordinator reviews and approves the repair commit.
2. After merge, run: `node scripts/google-calendar-auth-bootstrap.mjs --auth-status` (confirms canonical credential present, token missing).
3. Coordinator authorizes OAuth bootstrap: `node scripts/google-calendar-auth-bootstrap.mjs --init-oauth` (opens browser OAuth, writes `docs/project-control/google-calendar-token.local.json`).
4. Run auth-status again to confirm `STATUS: READY`.
5. Coordinator authorizes live dry-run: `node scripts/google-calendar-sync-dry-run.mjs --live-readonly`.
6. Save artifact to `local-sync-reports/`; Coordinator reviews delta.

googleapis already installed at `scripts/node_modules/googleapis@173.0.0`. No further install required.

---

## Hard exclusions verified (Gate 2D Repair)

- `index.html` — not touched
- `src/**` — not touched
- `public/**` — not touched
- `amplify/**` — not touched
- `package.json`, `package-lock.json` (root) — not touched
- No live Google Calendar API calls
- No OAuth flow
- No credential file contents read or printed
- No token files created
- `external-sync-map.local.json` — not read or written
- No GitHub Project mutations
- No GitHub Issues created
- No Package 5B work
- No Gate 3 or --apply executed
- No secrets, tokens, or credentials staged or committed

---

## Next exact action

Coordinator reviews the repair diff on branch `docs/google-calendar-oauth-path-alignment`. If approved, authorizes commit and merge to main.

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
