# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS v1.5 Gate 1 (Template GitHub Project Standard — repo infrastructure) in progress on branch `docs/ai-project-os-template-github-project-standard`. All repo files created, edited, and verified. OS self-audit: **138 pass, 0 warn, 0 fail**. Awaiting Coordinator review of Gate 1 report and explicit commit approval.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-27`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | AI Project OS v1.5 — Template GitHub Project Standard (Gate 1 only) |
| **Active branch** | `docs/ai-project-os-template-github-project-standard` |
| **main HEAD** | `11a218a` — docs: sync state after GitHub Project board closeout merge |
| **Branch HEAD** | `11a218a` (no commits yet on this branch — all changes are uncommitted) |
| **Last completed pass** | `GitHub Project board closeout` (merged `83ad8e0`) |
| **Active package** | OS v1.5 Gate 1 — repo infrastructure only; no live GitHub mutations |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (active pass)

AI Project OS v1.5 Gate 1 — Template GitHub Project Standard (repo infrastructure). Add canonical template standard docs, scripts, skill, and command. Update client library to v1.5 canonical Status vocabulary (8 values). Add config-driven template-copy auto-detection to setup-apply. Add Section 6d to OS self-audit (16 new checks). Migrate all source records to v1.5 vocabulary. Gate 1 = repo docs/scripts only; no live GitHub mutations. Gate 2 (live template creation) requires separate Coordinator authorization.

---

## Delivered scope (v1.5 Gate 1 — COMPLETE, AWAITING COMMIT APPROVAL)

### New files
- `docs/project-control/github-projects-template-standard.md` — canonical template standard (v1.5 two-gate model, Status vocabulary, field/view/owner specs)
- `docs/project-control/github-projects-template-copy-runbook.md` — Gate 1/Gate 2 runbook
- `docs/project-control/github-projects-template-config.example.json` — placeholder-only example config (committed)
- `scripts/github-project-template-dry-run.mjs` — template dry-run (all sections pass)
- `scripts/github-project-template-validate.mjs` — template config validator
- `scripts/github-project-template-apply.mjs` — Gate 2 apply script (plan mode default; requires --apply)
- `.claude/skills/github-project-template/SKILL.md` — canonical skill
- `.claude/commands/github-project-template.md` — thin command wrapper

### Modified files
- `scripts/lib/github-projects-client.mjs` — REQUIRED_STATUSES and VALID_STATUSES updated to v1.5 canonical 8 values
- `scripts/github-project-setup-apply.mjs` — config-driven template-copy auto-detection added
- `scripts/github-project-setup-dry-run.mjs` — status count made dynamic (REQUIRED_STATUSES.length)
- `scripts/os-self-audit.mjs` — Section 6d added (16 new v1.5 checks); commands/skills arrays updated to 15
- `docs/project-control/github-projects-setup-policy.md` — v1.5 Status vocabulary, template-copy path
- `docs/project-control/github-projects-source-records.json` — all statuses migrated to v1.5 vocabulary
- `docs/project-control/github-projects-import-runbook.md` — Step 1b template-copy path added
- `docs/project-control/external-sync-safety.md` — template config files added to committed vs non-committed table
- `docs/project-control/project-sync-policy.md` — template-copy preferred path note added
- `docs/ai-system/CHANGELOG.md` — v1.5 entry added; v1.4 status fixed to COMPLETE
- `docs/ai-system/version-history.md` — v1.5 row added; v1.4 row fixed
- `docs/ai-system/bootstrap-template.md` — §6 updated for template-copy path + new files
- `docs/ai-system/universal-standards.md` — commands/skills counts updated (14 → 16 / 13 → 15)
- `docs/ai-system/os-self-audit-checklist.md` — Section 6d added (15 audit checks)
- `.claude/skills/README.md` — count updated to 15; github-project-template row added
- `.claude/commands/README.md` — github-project-template row added
- `.claude/skills/github-project-setup/SKILL.md` — v1.5 template-copy paragraph added
- `.gitignore` — github-projects-template-config.local.json gitignored

---

## Hard exclusions verified

- `index.html` — not touched
- `src/**` — not touched
- No live GitHub mutations performed
- No GitHub Project created, copied, or modified
- No GitHub Issues created, modified, or deleted
- No Project fields, views, or items touched
- `external-sync-map.local.json` — not touched
- No secrets, tokens, or credentials committed
- No Package 5B planning or implementation

---

## Work completed (v1.5 Gate 1)

- [x] Branch created: `docs/ai-project-os-template-github-project-standard`
- [x] All 8 new files created and verified (`node --check`)
- [x] All 19 existing files updated
- [x] Source records migrated to v1.5 vocabulary (Done→Done/Shipped, Not Started→Backlog, Waiting→Waiting/Blocked, Deferred→In Progress for KM-PC-011)
- [x] Vocabulary check fix: old-vocab detection scoped to `status_options` only (not full config JSON), fixing false positive on "Done" view name
- [x] `node scripts/github-project-template-dry-run.mjs` — PASS (all sections green)
- [x] `node scripts/github-project-template-validate.mjs docs/project-control/github-projects-template-config.example.json` — 0 fail, 0 warn
- [x] `node scripts/os-self-audit.mjs` — **138 pass, 0 warn, 0 fail**
- [x] `git check-ignore -v docs/project-control/github-projects-template-config.local.json` — GITIGNORED at .gitignore:84
- [x] `git diff -- index.html src public amplify package.json` — empty (no product code touched)
- [x] State files updated (AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md)
- [x] Gate 1 report produced

## Work remaining (v1.5 Gate 1)

- [ ] Coordinator reviews Gate 1 report
- [ ] Coordinator approves commit
- [ ] Commit on branch and push
- [ ] PR and merge to main (Coordinator approval)

## Work NOT started (Gate 2 — separate authorization required)

- [ ] Create/designate canonical AI Project OS Template GitHub Project (live mutation)
- [ ] Populate `github-projects-template-config.local.json` with real IDs
- [x] Live KeepMees board Status options already on v1.5 canonical vocabulary (confirmed 2026-05-27 via read-only live check — no field repair needed)

---

## Git state

```
Branch (now):    docs/ai-project-os-template-github-project-standard
main HEAD:       11a218a — docs: sync state after GitHub Project board closeout merge
Working tree:    DIRTY (all v1.5 Gate 1 changes uncommitted — awaiting Coordinator approval)
v1.5 Gate 1:     in-progress (not yet committed)
```

---

## Next exact action

Coordinator reviews Gate 1 report. On approval: commit all Gate 1 changes on branch.

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
