# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS Framework Groundwork Pass. Branch `docs/ai-project-os-framework-groundwork` off main at `cb920be`. All 14 sections complete. Awaiting Coordinator commit approval. **Do not commit until the Coordinator explicitly approves.**

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-25`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | `AI Project OS Framework Groundwork Pass` (Sprint 2026-05-B) |
| **Branch** | `docs/ai-project-os-framework-groundwork` |
| **Branch base** | `main at cb920be` — merge: add Short Command Interface to AI Project OS |
| **Status** | All work complete — awaiting Coordinator commit approval |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`, status-sync merged `926ec37`) |

---

## Objective

Complete the AI Project OS framework: make 13 skills canonical (SKILL.md per skill), add 4 new command wrappers, add closeout sync contract, project-control sync foundation, OS self-audit, notification setup wizard, update all Bootstrap Core docs, correct stale project-control state, and update gitignore. No app code touched; no product package started.

---

## Approved scope (all delivered)

**Section 1 — Skills canonical:** 13 skills created at `.claude/skills/*/SKILL.md` each with YAML frontmatter + full protocol

**Section 2 — Command wrappers:** 4 new commands created (`os-audit`, `project-sync-dry-run`, `project-sync-apply`, `notification-setup-wizard`); 10 existing commands updated with skill-delegation header; README rewritten

**Section 3 — Event-triggered sync rule:** Added to `AGENTS.md`, `CLAUDE.md`, `.codex/README.md`, `auto-management-protocol.md`, `package-boundary-closeout-protocol.md`

**Section 4 — Closeout Sync Contract:** `docs/dev/closeout-sync-contract.md` created

**Section 5 — Project Control Sync Automation foundation:** 6 new docs: `project-sync-policy.md`, `project-sync-source-schema.md`, `project-sync-dry-run-format.md`, `external-sync-safety.md`, `external-sync-map.example.json`, `project-sync-log.md`

**Section 6 — Calendar source docs:** (policy-driven; existing calendar docs sufficient — no change needed; policy references closeout-sync-contract.md)

**Section 7 — Notification Setup Wizard:** `scripts/setup-claude-notification.ps1` + `.claude/skills/notification-setup-wizard/SKILL.md` + `.claude/commands/notification-setup-wizard.md`

**Section 8 — OS Self-Audit:** `docs/ai-system/os-self-audit-checklist.md` + `scripts/os-self-audit.mjs` + `.claude/skills/os-audit/SKILL.md` + `.claude/commands/os-audit.md`

**Section 9 — Shareable status summary:** `.claude/skills/status-summary/SKILL.md` updated; command wrapper updated

**Section 10 — Bootstrap Core updated:** `universal-standards.md`, `bootstrap-template.md`, `CHANGELOG.md`, `version-history.md`, `docs/ai-system/README.md` all updated to v0.5.0

**Section 11 — Project-control cleanup:** `current-sprint.md` and `kanban-board.md` fully rewritten to reflect Package 5A done + Sprint 2026-05-B active

**Section 12 — Gitignore safety:** New patterns: `docs/project-control/external-sync-map.local.json`, `*.sync-dryrun.{md,json}`, `local-sync-reports/`, `*.claude-settings-backup-*.json`, `*.oauth-token.json`, `**/oauth-credentials.json`, `google-calendar-credentials.json`

**Section 13 — Checks:** All pass:
- `node --check` on all 3 new .mjs scripts — PASS
- `node scripts/os-self-audit.mjs` — 88 pass, 0 fail, BOOTSTRAP COMPLETE
- `node scripts/project-control-sync-dry-run.mjs` — NO DRIFT
- `node scripts/project-control-sync-validate.mjs` — 11 pass, VALID
- `git diff -- index.html src/` — zero diff (no app code touched)
- `git check-ignore` on all new gitignore patterns — all patterns confirmed active
- `git diff --stat` — 24 files changed (all OS/docs layer only)

**Section 14 — Continuity file updates:** AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md (this update)

---

## Hard exclusions (verified clean)

- `index.html` — zero diff confirmed
- `src/**` — zero diff confirmed
- No product package started; no product feature implemented
- No live Google Calendar, ClickUp, or TickTick API writes
- No `.claude/settings.local.json` edited; no secrets committed
- No commit created (waiting for explicit Coordinator approval)

---

## Work completed

- [x] 13 skills created (`start`, `handoff`, `precommit`, `closeout`, `package-start`, `switch-to-codex`, `switch-to-claude`, `weekly-sync`, `status-summary`, `os-audit`, `project-sync-dry-run`, `project-sync-apply`, `notification-setup-wizard`)
- [x] 4 new command wrappers; 10 existing updated; READMEs rewritten
- [x] `docs/dev/closeout-sync-contract.md` created
- [x] 6 new project-control sync foundation docs created
- [x] `scripts/os-self-audit.mjs` + `scripts/project-control-sync-dry-run.mjs` + `scripts/project-control-sync-validate.mjs` created and passing
- [x] `scripts/setup-claude-notification.ps1` created
- [x] `docs/ai-system/os-self-audit-checklist.md` created
- [x] All Bootstrap Core docs updated to v0.5.0
- [x] `current-sprint.md` + `kanban-board.md` corrected
- [x] `.gitignore` extended with 7 new patterns
- [x] All 4 validation checks pass (audit 88/0, dry-run NO DRIFT, validate 11/0, app-diff zero)
- [x] Windows ESM path fix applied to all 3 .mjs scripts (`fileURLToPath`)
- [x] `docs/ai-system/README.md` file index updated to include `os-self-audit-checklist.md`
- [x] AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md updated (this run)

## Work remaining

- [ ] **Coordinator explicitly approves the commit** — required before any commit
- [ ] Once approved: commit with message `docs: complete AI Project OS framework groundwork`
- [ ] Merge branch to main (Coordinator instruction required)

---

## Git state

```
Branch:       docs/ai-project-os-framework-groundwork
Base:         cb920be (main) — merge: add Short Command Interface to AI Project OS
Working tree: 51 files modified/new (all docs/OS layer; zero app code)
Committed:    nothing yet on this branch — all changes are uncommitted
Push:         not pushed — do not push without explicit instruction
```

---

## Next exact action

Wait for Coordinator commit approval. When approved, run `/precommit` to walk the verification gate, then commit:

```
docs: complete AI Project OS framework groundwork

- Make 13 skills canonical (.claude/skills/*/SKILL.md) — authoritative protocol layer
- Add 4 new command wrappers; update 10 existing to delegate to skills
- Add closeout sync contract (docs/dev/closeout-sync-contract.md)
- Add project-control sync foundation (policy, schema, dry-run format, safety, example map, log)
- Add OS self-audit checklist + script (node scripts/os-self-audit.mjs → 88 pass)
- Add notification setup wizard (PS1 script + skill + command)
- Update Bootstrap Core to v0.5.0 (universal-standards, bootstrap-template, CHANGELOG, version-history, README)
- Correct stale project-control state (current-sprint.md, kanban-board.md)
- Extend .gitignore for local sync maps, dry-run outputs, notification backups, credentials
```

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
| `scripts/**` | New OS scripts (`os-self-audit.mjs`, `project-control-sync-dry-run.mjs`, `project-control-sync-validate.mjs`, `setup-claude-notification.ps1`) are part of this OS pass and are fine. Do not modify `index.html`-adjacent scripts without package authorization. |
| `scripts/node_modules/` | Historically tracked. Do NOT untrack without Coordinator decision. |
| `.claude/settings.local.json`, `_source-intake/`, `operator-inbox/*.md`, `operator-outbox/*` | Gitignored — never commit. |
| `docs/project-control/external-sync-map.local.json` | Gitignored — never commit. |
| `docs/project-control/keepmees-project-calendar.ics` | Repo-native committed `.ics` — protected by a single `.gitignore` exception. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes; log every change in `docs/ai-system/CHANGELOG.md` and `version-history.md`. |
