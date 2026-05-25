# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — AI Project OS v1.3 External Board Provider Update. Implementation files written on branch `docs/github-projects-default-board-provider`. Awaiting Coordinator commit approval.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-25`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | `AI Project OS v1.3 — External Board Provider Update` (docs/scripts/config only) |
| **Active branch** | `docs/github-projects-default-board-provider` |
| **main HEAD** | `a0e27aa` — merge: sync operating docs after ClickUp setup alignment |
| **Last completed pass** | `AI Project OS v1.2 — External Setup Alignment Patch` (merged `328d81e`) |
| **Active package** | None — Coordinator decides next product package |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`, status-sync merged `926ec37`) |
| **Package 5B** | Not started |

---

## Objective (active pass)

AI Project OS v1.3 External Board Provider Update. Makes GitHub Projects the default external board provider for KeepMees and future AI Project OS repos. Demotes ClickUp to optional adapter. Adds setup policy, source schema, import runbook, example field map, sync log, 5 dry-run/apply scripts, and a new github-project-setup skill/command. Updates project-sync-policy, external-platform-mapping-guide, external-sync-safety, CHANGELOG, version-history, bootstrap-template. No app code; no live GitHub API writes; no Package 5B work.

---

## Delivered scope (v1.3 pass)

### New files — docs
- `docs/project-control/github-projects-setup-policy.md` — CREATED
- `docs/project-control/github-projects-source-schema.md` — CREATED
- `docs/project-control/github-projects-import-runbook.md` — CREATED
- `docs/project-control/github-projects-field-map.example.json` — CREATED
- `docs/project-control/github-projects-sync-log.md` — CREATED

### New files — scripts
- `scripts/github-project-setup-dry-run.mjs` — CREATED (safe, read-only)
- `scripts/github-project-setup-apply.mjs` — CREATED (skeleton, not yet live)
- `scripts/github-project-import-issues.mjs` — CREATED (dry-run default)
- `scripts/github-project-sync-status.mjs` — CREATED (local only)
- `scripts/github-project-field-map.mjs` — CREATED (validator, no external calls)

### New files — skill/command
- `.claude/skills/github-project-setup/SKILL.md` — CREATED
- `.claude/commands/github-project-setup.md` — CREATED

### Updated files
- `docs/project-control/project-sync-policy.md` — GitHub Projects as default; ClickUp optional; sync map unified
- `docs/project-control/external-platform-mapping-guide.md` — reframed around GitHub Projects first; ClickUp labeled optional adapter
- `docs/project-control/external-sync-safety.md` — GitHub token/gh auth safety added
- `.claude/skills/README.md` — new skill added to roster
- `.claude/commands/README.md` — new command added to roster
- `docs/ai-system/CHANGELOG.md` — v1.3 entry added
- `docs/ai-system/version-history.md` — v1.3 entry added
- `docs/ai-system/bootstrap-template.md` — Step 6 updated to prefer GitHub Projects
- `AI_HANDOFF.md` — this file
- `CURRENT_STATE.md` — updated
- `NEXT_SESSION_PROMPT.md` — updated

---

## Hard exclusions verified

- `index.html` — not touched
- `src/**` — not touched
- `docs/project-control/clickup-import.csv` — not modified
- `docs/project-control/clickup-setup-policy.md` — not modified; preserved as optional adapter
- No live GitHub API integration; no GitHub Project created; no issues imported
- No external writes of any kind; no secrets; no tokens committed
- No Package 5B planning or implementation

---

## Work completed (v1.3 pass)

- [x] Branch created: `docs/github-projects-default-board-provider`
- [x] 5 new docs created (`github-projects-*.md`)
- [x] 1 new example JSON created (`github-projects-field-map.example.json`)
- [x] 5 new scripts created (dry-run/apply scaffolding)
- [x] 1 new skill created (`.claude/skills/github-project-setup/SKILL.md`)
- [x] 1 new command created (`.claude/commands/github-project-setup.md`)
- [x] 3 existing project-control docs updated (sync policy, mapping guide, sync safety)
- [x] 2 existing skill/command READMEs updated (roster entries added)
- [x] 3 AI-system docs updated (CHANGELOG, version-history, bootstrap-template)
- [x] State files updated (AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md)
- [x] Script syntax checked (node --check)
- [x] Dry-run scripts executed and verified
- [ ] Coordinator commit approval (awaiting)
- [ ] Commit and merge to main

---

## Git state

```
Branch (now):    docs/github-projects-default-board-provider
main HEAD:       a0e27aa — merge: sync operating docs after ClickUp setup alignment
Working tree:    files written; not yet committed
Pushed:          No — awaiting Coordinator commit approval
```

---

## Next exact action

Coordinator reviews and approves → commit with message below → merge to main → push main. Then Coordinator decides next product package or OS action.

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
