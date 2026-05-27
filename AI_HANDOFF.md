# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `complete` — AI Project OS v1.5 Gate 2 complete 2026-05-27. Working tree has uncommitted changes (Gate 2 closeout docs — awaiting commit authorization). No active development pass. Package 5B blocked.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-27`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | None — v1.5 Gate 2 complete; awaiting commit authorization for Gate 2 closeout docs |
| **Active branch** | `main` |
| **main HEAD** | `02bb97a` — docs: sync state after v1.5 Gate 1 merge (Gate 2 changes not yet committed) |
| **Last completed pass** | `AI Project OS v1.5 Gate 2` (complete 2026-05-27; awaiting commit) |
| **Active package** | None |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`) |
| **Package 5B** | Not started — blocked pending Coordinator authorization |

---

## Objective (last completed pass)

AI Project OS v1.5 Gate 2 — Live Template Creation (complete 2026-05-27). Dedicated "AI Project OS Template" GitHub Project created under GHnol (Project #2, `PVT_kwHOBuFnQM4BY53W`, https://github.com/users/GHnol/projects/2). 13/13 canonical custom fields provisioned via script. Status field set to 8 v1.5 canonical options by Founder in GitHub UI. 14 canonical views created by Founder. "High Risks" replaces "Risks / Decisions" (GitHub Projects does not support OR across different fields). Local template config written (gitignored). Gate 2 complete — template-copy is now active preferred path. Closeout docs updated but not yet committed — awaiting Coordinator commit authorization.

---

## Delivered scope (v1.5 Gate 1 — COMPLETE, MERGED `7c2c511`)

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

## Work completed (v1.5 Gate 2)

- [x] Gate 2 authorized by Coordinator — Option B: dedicated template project
- [x] Bug fixes applied to `scripts/github-project-template-apply.mjs` (3 bugs: projectId extraction, appendSyncLog format, --project-id flag added)
- [x] "AI Project OS Template" GitHub Project created under GHnol (Project #2, `PVT_kwHOBuFnQM4BY53W`)
- [x] 13/13 canonical custom fields provisioned and confirmed via live GraphQL query
- [x] Status field: 8 v1.5 canonical options configured by Founder in GitHub UI
- [x] 14 canonical views created by Founder in GitHub UI; "High Risks" replaces "Risks / Decisions" (GitHub OR-across-fields limitation)
- [x] All 14 views confirmed via live GraphQL read-only query
- [x] Local template config written: `docs/project-control/github-projects-template-config.local.json` (gitignored)
- [x] Local config validation: 0 fail, 0 warn
- [x] Dry-run post-apply: template-copy mode detected, all sections green
- [x] OS self-audit: 138 pass, 0 warn, 0 fail
- [x] Sync log updated (template-create entry + UI setup entry)
- [x] "Risks / Decisions" → "High Risks" updated in: validate.mjs, client.mjs, example config, setup-policy.md, template-standard.md, external-platform-mapping-guide.md, clickup-setup-policy.md, local config
- [x] CHANGELOG.md and version-history.md updated for v1.5 COMPLETE
- [x] Template standard Gate 2 Status section updated
- [x] State files updated (AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md)

## Work remaining (Gate 2 closeout)

- [ ] Coordinator authorizes commit of Gate 2 closeout changes

---

## Git state

```
Branch (now):    main
main HEAD:       02bb97a — docs: sync state after v1.5 Gate 1 merge
Working tree:    modified (Gate 2 closeout — awaiting commit authorization)
v1.5 Gate 1:     COMPLETE — merged 7c2c511
v1.5 Gate 2:     COMPLETE — live template project exists; closeout docs ready to commit
```

---

## Next exact action

Coordinator authorizes commit of Gate 2 closeout changes with message: `docs: close AI Project OS v1.5 Gate 2 template standard`

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
