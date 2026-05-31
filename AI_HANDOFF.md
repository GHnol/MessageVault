# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS v1.6 Gate 1 implementation complete on branch `docs/google-calendar-live-sync-gate-1`. All Gate 1 files created, scripts verified, OS self-audit passes (159 pass, 0 warn, 0 fail). Awaiting Coordinator commit authorization for Gate 1.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-30`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | AI Project OS v1.6 — Google Calendar Live Sync, Gate 1 |
| **Active branch** | `docs/google-calendar-live-sync-gate-1` |
| **main HEAD** | `e448053` — docs: close AI Project OS v1.5 Gate 2 template standard |
| **Last completed pass** | `AI Project OS v1.5 Gate 2` (complete 2026-05-27) |
| **Active package** | None (OS pass only) |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (current pass)

AI Project OS v1.6 Gate 1 — Google Calendar Live Sync Repo Foundation. Gate 1 is repo implementation only. No live Google Calendar mutations. Gate 2 (live dry-run) and Gate 3 (live apply) require separate Coordinator authorization.

---

## Work completed (Gate 1)

- [x] `.gitignore` updated: added `token.json`, `**/token.json`, `google-calendar-token.json`, `docs/project-control/google-calendar-token.local.json`
- [x] `docs/project-control/google-calendar-source-schema.md` created
- [x] `docs/project-control/google-calendar-source-records.json` created (10 events)
- [x] `docs/project-control/google-calendar-sync-policy.md` created
- [x] `docs/project-control/google-calendar-sync-runbook.md` created
- [x] `docs/project-control/google-calendar-credentials.example.md` created
- [x] `docs/project-control/google-calendar-sync-log.md` created (Gate 1 entry recorded)
- [x] `docs/project-control/calendar-sync-log.md` updated (marked LEGACY, pointer to new log)
- [x] `docs/project-control/calendar-sync-policy.md` updated (marked LEGACY for static .ics model)
- [x] `scripts/google-calendar-source-validate.mjs` created (151 pass, 0 warn, 0 fail)
- [x] `scripts/google-calendar-sync-dry-run.mjs` created (10/10 READY_FOR_LIVE_COMPARE)
- [x] `scripts/google-calendar-sync-apply.mjs` created and repaired: `GATE_3_AUTHORIZED = false` replaced with `--confirm-live-calendar-apply` runtime flag; `DUPLICATE_DETECTED` and `ADOPTION_REQUIRED` guards added; plan mode verified
- [x] `scripts/generate-project-calendar.mjs` created (ICS regenerated successfully)
- [x] `scripts/project-control-sync-validate.mjs` fixed (git ls-files check replaces existsSync)
- [x] `.claude/skills/google-calendar-sync/SKILL.md` created
- [x] `.claude/commands/google-calendar-sync.md` created
- [x] `scripts/os-self-audit.mjs` updated: Section 6e added
- [x] `scripts/project-control-sync-dry-run.mjs` updated: new required files added
- [x] `docs/ai-system/CHANGELOG.md` updated: v1.6 entry added
- [x] `docs/ai-system/version-history.md` updated: v1.6 row added
- [x] `docs/ai-system/os-self-audit-checklist.md` updated: Section 6e added
- [x] `docs/ai-system/universal-standards.md` updated: counts 17/16; calendar layer entry
- [x] `docs/ai-system/bootstrap-template.md` updated: Google Calendar live sync layer added
- [x] `.claude/skills/README.md` updated: count 16; google-calendar-sync row added
- [x] `.claude/commands/README.md` updated: /google-calendar-sync row added
- [x] OS self-audit: 159 pass, 0 warn, 0 fail
- [x] Source validation: 151 pass, 0 warn, 0 fail
- [x] Local dry-run: 10/10 READY_FOR_LIVE_COMPARE
- [x] Apply plan mode: exits correctly with guard summary
- [x] ICS regenerated with stable os_id UIDs and AI_OS_ID markers
- [x] Gitignore protections verified: token.json, **/token.json, google-calendar-token.json, google-calendar-*.local.json, **/google-calendar-*.local.json, external-sync-map.local.json (gaps closed in repair pass)
- [x] Product files confirmed untouched: index.html, src/**, public/**, amplify/**, package.json

## Work remaining (Gate 1 closeout)

- [ ] Coordinator authorizes Gate 1 commit

## Work remaining (Gate 2 — separate authorization)

- [ ] Coordinator authorizes Gate 2
- [ ] Coordinator approves `googleapis` install in `scripts/` directory
- [ ] Coordinator configures Google Calendar API credentials locally
- [ ] Coordinator adds AI_OS_ID: markers to existing Google Calendar events (adoption guide in google-calendar-sync-policy.md)
- [ ] Run `node scripts/google-calendar-sync-dry-run.mjs --live`
- [ ] Review and approve dry-run delta

## Work remaining (Gate 3 — separate authorization)

- [ ] Coordinator authorizes Gate 3 with explicit "proceed with apply" instruction
- [ ] Run apply with approved dry-run artifact
- [ ] Update sync log; propose state-sync commit
- [ ] v1.6 complete or document credential/platform blocker

---

## Git state

```
Branch:         docs/google-calendar-live-sync-gate-1
main HEAD:      e448053 — docs: close AI Project OS v1.5 Gate 2 template standard
Working tree:   modified (Gate 1 implementation — awaiting commit authorization)
v1.5 Gate 1:    COMPLETE — merged 7c2c511
v1.5 Gate 2:    COMPLETE — merged e448053
v1.6 Gate 1:    IN PROGRESS — implementation complete; commit pending
v1.6 Gate 2:    NOT STARTED — requires separate Coordinator authorization
v1.6 Gate 3:    NOT STARTED — requires separate Coordinator authorization
```

---

## Next exact action

Coordinator reviews Gate 1 report and authorizes commit with message:
`docs: add Google Calendar live sync foundation`

---

## Hard exclusions verified

- `index.html` — not touched
- `src/**` — not touched
- `public/**` — not touched
- `amplify/**` — not touched
- `package.json`, `package-lock.json` — not touched
- No live Google Calendar mutations
- No credential files created or used
- `external-sync-map.local.json` — not read or written by Gate 1 scripts
- No GitHub Project mutations
- No GitHub Issues created
- No Package 5B work
- No v1.7 automation implemented
- No secrets, tokens, or credentials committed

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
| `docs/project-control/google-calendar-sync-apply.mjs` | GATE_3_AUTHORIZED = false in Gate 1. Set to true ONLY when Gate 3 is explicitly authorized. |
| `scripts/google-calendar-sync-dry-run.mjs` | --live mode guards: credential check and googleapis check are functional; full live comparison runs in Gate 2 only after authorization. |
| `scripts/node_modules/` | Historically tracked. Do NOT untrack without Coordinator decision. Do NOT install googleapis without Coordinator approval. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes. |
