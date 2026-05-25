# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in progress` — AI Project OS v1.2 external setup alignment patch. Docs-only. No product/app code. Active branch: `docs/align-clickup-setup-ai-os-v1-2`. Awaiting Coordinator commit approval.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-05-25`

---

## Package and branch

| Field | Value |
|---|---|
| **Active patch** | `AI Project OS v1.2 — External Setup Alignment Patch` (docs-only) |
| **Active branch** | `docs/align-clickup-setup-ai-os-v1-2` (in progress — awaiting commit approval) |
| **Last completed pass** | `AI Project OS Framework Groundwork Pass` (Sprint 2026-05-B) |
| **Last merged branch** | `docs/sync-after-ai-project-os-framework-groundwork` → main (`863461a`) |
| **main HEAD** | `863461a` — merge: sync operating docs after AI Project OS framework groundwork |
| **Active package** | None — Coordinator decides next product package |
| **Prior closed package** | `Package 5A — Message Book Proof Approval State Foundation` (merged `297a221`, status-sync merged `926ec37`) |

---

## Objective (current patch)

Docs-only external setup alignment. Standardize the ClickUp structure (one primary Board, saved views/filters, not six default Lists), add external platform mapping guide, update sync policy and external-sync-safety docs, add AI Project OS v1.2 entries to CHANGELOG and version-history. No app code; no live API integration; no Package 5B work.

---

## Delivered scope (v1.2 patch, pending commit approval)

- `docs/project-control/clickup-setup-policy.md` — CREATED: approved ClickUp structure, saved views/filters, hybrid statuses, 13 custom fields, Owner Role rule, sync map rule
- `docs/project-control/external-platform-mapping-guide.md` — CREATED: repo doc → ClickUp/Calendar/TickTick mapping, platform scope boundaries, safety summary
- `docs/project-control/project-sync-policy.md` — UPDATED: ClickUp structure section added; external tool routing updated; companion docs updated
- `docs/project-control/external-sync-safety.md` — UPDATED: ClickUp structure note; local map never-commit rule; example map placeholder rule; AI agent assignee rule
- `docs/ai-system/CHANGELOG.md` — UPDATED: v1.2 entry added at top
- `docs/ai-system/version-history.md` — UPDATED: v1.2.0 row + section added at top

---

## Hard exclusions verified

- `index.html` — not touched
- `src/**` — not touched
- `scripts/**` — not touched
- `docs/project-control/clickup-import.csv` — inspected only; not modified
- No live API integration; no external writes; no secrets

---

## Work completed

- [x] Branch created: `docs/align-clickup-setup-ai-os-v1-2`
- [x] 2 new docs created
- [x] 4 existing docs updated
- [x] AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md updated (branch correction)
- [ ] Coordinator commit approval
- [ ] Commit
- [ ] Merge to main
- [ ] Push main

---

## Git state

```
Branch (now):    docs/align-clickup-setup-ai-os-v1-2
main HEAD:       863461a — merge: sync operating docs after AI Project OS framework groundwork
Pushed:          main is current on origin; patch branch not yet pushed
```

---

## Next exact action

Coordinator reviews the final report and approves commit. Then: commit with approved message → merge to main → push main.

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
