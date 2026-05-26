# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `complete` — AI Project OS v1.4 GitHub Projects Live Provisioning Integration merged to `main` (`1623e7e`). Working tree clean. No active in-flight work. Coordinator decides next pass.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-25`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | None — v1.4 complete; Coordinator decides next pass or product package |
| **Active branch** | `main` (no active feature branch) |
| **main HEAD** | `1623e7e` — merge: implement GitHub Projects live provisioning integration |
| **Last completed pass** | `AI Project OS v1.4 — GitHub Projects Live Provisioning Integration` (merged `1623e7e`) |
| **Active package** | None — Coordinator decides next product package |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`, status-sync merged `926ec37`) |
| **Package 5B** | Not started |

---

## Objective (active pass)

AI Project OS v1.4 — GitHub Projects Live Provisioning Integration. Make the GitHub Projects apply scripts (`github-project-setup-apply.mjs` and `github-project-import-issues.mjs`) real and apply-capable. Add client library (`scripts/lib/github-projects-client.mjs`). Implement three-layer duplicate detection. Dry-run-first/explicit-approval/no-live-apply-during-verification/no-token-exposure. No app code; no Package 5B work.

---

## Delivered scope (v1.4 pass — COMPLETE)

### New files
- `scripts/lib/github-projects-client.mjs` — CREATED (full client library)
- `docs/project-control/github-projects-source-records.example.json` — CREATED (3 example source records)

### Fully rewritten (skeleton → real apply-capable)
- `scripts/github-project-setup-apply.mjs` — REWRITTEN (real apply; plan mode with probes)
- `scripts/github-project-import-issues.mjs` — REWRITTEN (real apply; 3-layer dedup; incremental sync map)

### Enhanced
- `scripts/github-project-setup-dry-run.mjs` — ENHANCED (gh version, auth probe, project discovery, planned ops list)
- `scripts/github-project-sync-status.mjs` — ENHANCED (`--live` flag for read-only API queries)
- `scripts/github-project-field-map.mjs` — ENHANCED (`--local-map` flag for local sync map validation)

### Updated docs
- `docs/ai-system/CHANGELOG.md` — v1.4 entry added
- `docs/ai-system/version-history.md` — v1.4 row added
- `docs/project-control/github-projects-import-runbook.md` — updated for real apply scripts
- `.claude/skills/github-project-setup/SKILL.md` — removed skeleton hard stop; updated dry-run section
- `AI_HANDOFF.md` — this file (updated to v1.4 active)
- `CURRENT_STATE.md` — updated
- `NEXT_SESSION_PROMPT.md` — updated

---

## Hard exclusions verified

- `index.html` — not touched
- `src/**` — not touched
- No live GitHub API apply during implementation verification
- No real GitHub Project created; no real GitHub Issues imported
- No `external-sync-map.local.json` written during verification
- No secrets, tokens, or credentials committed
- No Package 5B planning or implementation

---

## Work completed (v1.4 pass)

- [x] Branch created: `docs/github-projects-live-provisioning`
- [x] `scripts/lib/github-projects-client.mjs` — written and verified (`node --check`)
- [x] `scripts/github-project-setup-apply.mjs` — rewritten (real apply); verified (`node --check`)
- [x] `scripts/github-project-import-issues.mjs` — rewritten (real apply); verified (`node --check`)
- [x] `scripts/github-project-setup-dry-run.mjs` — enhanced; verified (`node --check`, dry-run executed)
- [x] `scripts/github-project-sync-status.mjs` — enhanced; verified (`node --check`, dry-run executed)
- [x] `scripts/github-project-field-map.mjs` — enhanced; verified (`node --check`, ran: 0 fail, 0 warn)
- [x] `docs/project-control/github-projects-source-records.example.json` — created
- [x] `docs/ai-system/CHANGELOG.md` — v1.4 entry added
- [x] `docs/ai-system/version-history.md` — v1.4 row added
- [x] `docs/project-control/github-projects-import-runbook.md` — updated
- [x] `.claude/skills/github-project-setup/SKILL.md` — updated
- [x] State files updated (AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md)

- [x] OS self-audit: **118 pass, 0 warn, 0 fail** (post-v1.4)
- [x] `docs/ai-system/os-self-audit-checklist.md` — Section 6c added (10 new v1.4 checks)
- [x] `scripts/os-self-audit.mjs` — Section 6c checks added (118 total, up from 108)

## Work remaining (v1.4 pass)

- [x] Pre-commit verification gate (Coordinator-driven)
- [x] Coordinator approves commit
- [x] Commit on branch
- [x] Push branch
- [x] Merge to main — COMPLETE (merged `1623e7e`)

---

## Git state

```
Branch (now):    main
main HEAD:       1623e7e — merge: implement GitHub Projects live provisioning integration
Working tree:    clean
v1.4:            merged 1623e7e — COMPLETE
```

---

## Next exact action

No active in-flight work. Await Coordinator authorization for next product package or OS pass.

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
| `scripts/os-self-audit.mjs`, `scripts/project-control-sync-dry-run.mjs`, etc. | New OS scripts from this pass — safe to run (read-only); do not modify without a new OS upgrade pass. |
| `scripts/node_modules/` | Historically tracked. Do NOT untrack without Coordinator decision. |
| `.claude/settings.local.json`, `_source-intake/`, `operator-inbox/*.md`, `operator-outbox/*` | Gitignored — never commit. |
| `docs/project-control/external-sync-map.local.json` | Gitignored — never commit. |
| `docs/project-control/keepmees-project-calendar.ics` | Repo-native committed `.ics` — protected by a single `.gitignore` exception. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes; log every change in `docs/ai-system/CHANGELOG.md` and `version-history.md`. |
