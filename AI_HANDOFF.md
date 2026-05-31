# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `complete` — AI Project OS v1.6 Gate 2D Repair merged `fe1315a` on 2026-05-31. Working tree clean. No active pass. Gate 2D live dry-run pending OAuth bootstrap and Coordinator authorization. Package 5B blocked.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-31`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | None |
| **Active branch** | `main` |
| **main HEAD** | `fe1315a` — merge: align Google Calendar OAuth paths |
| **Last completed pass** | `AI Project OS v1.6 Gate 2D Repair` — Canonical OAuth Bootstrap and Credential Path Alignment — merged `fe1315a` 2026-05-31 |
| **Active package** | None |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (last completed pass)

AI Project OS v1.6 Gate 2D Repair — merged `fe1315a` 2026-05-31. Delivered:
1. `scripts/google-calendar-auth-bootstrap.mjs` — canonical OAuth bootstrap script with `--auth-status` and `--init-oauth`.
2. `scripts/google-calendar-sync-dry-run.mjs` — canonical credential/token paths as defaults; `--auth-status`; `--help`; `resolveCredPaths()`; `OAUTH_BOOTSTRAP_REQUIRED` message when token missing.
3. `scripts/google-calendar-sync-apply.mjs` — canonical credential/token path defaults; `resolveCredPaths()`; legacy paths require `--allow-legacy-root-credentials`.
4. `docs/project-control/google-calendar-credentials.example.md`, `google-calendar-sync-runbook.md` — canonical paths and OAuth bootstrap flow documented.
5. `.claude/skills/google-calendar-sync/SKILL.md` — canonical paths, new auth commands.
6. `scripts/os-self-audit.mjs` — canonical path gitignore checks; auth-bootstrap file checks (166 pass).

No OAuth run. No live API call. No credential contents read or printed.

---

## Gate status (v1.6)

| Gate | Status |
|---|---|
| Gate 1 — Repo Implementation | COMPLETE — merged `5c4bd28` 2026-05-31 |
| Gate 2A — Fixture Logic Implementation | COMPLETE — merged `a530c56` 2026-05-31 |
| Gate 2C — Dependency Hygiene + googleapis Install | COMPLETE — merged `041761a` 2026-05-31 |
| Gate 2D Repair — OAuth Bootstrap + Path Alignment | COMPLETE — merged `fe1315a` 2026-05-31 |
| Gate 2D — Live Calendar Read-Only Dry-Run | NOT STARTED — requires OAuth bootstrap run + Coordinator authorization |
| Gate 3 — Live Calendar Apply | NOT STARTED — requires Gate 2D approved artifact |

---

## What is required for Gate 2D live dry-run

1. Coordinator authorizes OAuth bootstrap: `node scripts/google-calendar-auth-bootstrap.mjs --init-oauth`
   - Opens browser OAuth, writes `docs/project-control/google-calendar-token.local.json` (gitignored).
   - Canonical credential at `docs/project-control/google-calendar-credentials.local.json` is already in place.
2. Verify readiness: `node scripts/google-calendar-auth-bootstrap.mjs --auth-status` — expect `STATUS: READY`.
3. Coordinator authorizes live dry-run: `node scripts/google-calendar-sync-dry-run.mjs --live-readonly`.
4. Save artifact to `local-sync-reports/`; Coordinator reviews classified delta.
5. Record result in `docs/project-control/google-calendar-sync-log.md`.

googleapis already installed at `scripts/node_modules/googleapis@173.0.0`. No further install required.

v1.6 is NOT complete until Gate 3 live apply succeeds, or a documented credential/platform blocker is recorded.

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

Coordinator authorizes OAuth bootstrap (`--init-oauth`), then authorizes Gate 2D live read-only dry-run (`--live-readonly`). No product package work authorized.

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
