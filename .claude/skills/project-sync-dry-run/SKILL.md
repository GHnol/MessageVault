---
name: project-sync-dry-run
description: Run a dry-run internal sync check — compare repo project-control docs against actual project state and produce a proposed delta without applying any changes or writing to external systems.
---

## Purpose

Detect drift between repo project-control docs and actual project state before it becomes operationally misleading. Produce a precise delta that the Coordinator can review and approve before any actual updates happen. External systems (Google Calendar, ClickUp, TickTick) are never touched by this skill.

## When to use

- After any meaningful work-unit closeout (package complete, commit completed, merge completed, branch handoff, model/tool switch, project-control change, milestone/gate change, schedule/date change, task/backlog status change, major planning change)
- As part of the internal sync check in the `closeout` skill
- When the Coordinator suspects the Tower docs are drifting from reality
- Before running `project-sync-apply`

**Invocation type:** User-invoked. Also triggered as part of the closeout flow (policy-driven).

**Mode:** Dry-run only. This skill never writes to any file or external system.

## Files to read

1. `docs/project-control/project-sync-policy.md`
2. `docs/project-control/project-sync-dry-run-format.md`
3. `CURRENT_STATE.md`
4. `AI_HANDOFF.md`
5. `docs/project-control/current-sprint.md`
6. `docs/project-control/kanban-board.md`
7. `docs/project-control/master-schedule.md`
8. `docs/project-control/calendar-sync-log.md` (for calendar staleness)

## Required git preflight

- `git log --oneline -5`
- `git status --short`

Also run the optional scripts if available:

```
node --check scripts/project-control-sync-dry-run.mjs
node scripts/project-control-sync-dry-run.mjs
node scripts/external-sync-consistency-check.mjs --local-only
```

The external sync consistency check detects drift between source records, local sync map, and committed logs. Include its PASS/WARN/FAIL result in the dry-run output when external sync tools are within scope.

**Script scope note:** The script performs a **structural check only** — it verifies required files are present. It does not check content freshness, date accuracy, sprint/kanban currency, or external tool state. A "STRUCTURAL CHECK PASSED" result from the script does not mean content is current. The full content-aware drift check is performed by this skill (Claude reading and comparing actual file content).

## Sync obligations

This skill IS the sync check. It produces no changes. After the dry-run, the Coordinator reviews and either approves changes (→ `project-sync-apply`) or accepts the current state.

## Output format

Follow `docs/project-control/project-sync-dry-run-format.md`. Minimum sections:

**INTERNAL DOC DELTA** (repo files that need updating)
- For each stale doc: which field is wrong, what it should say, why it matters

**EXTERNAL TOOL DELTA** (Calendar / ClickUp / TickTick proposed changes)
- Each proposed change classified as: stable recurring / dynamic milestone / backlog task / new ritual
- Recommended method: targeted edit vs full regeneration
- Risk level: low / medium / high

**SKIP RATIONALE** (items that are cosmetically stale but not operationally misleading)

**VERDICT:**
- `DRIFT FOUND` — list proposed changes; recommend `project-sync-apply` after approval
- `NO DRIFT` — state is current; no action needed

Footer: `No external sync was performed. No files were modified by this dry-run.`

## Hard stop conditions

- Never write to external systems (Google Calendar, ClickUp, TickTick).
- Never write to repo files. Dry-run output goes to chat only.
- Do not propose changes that touch app code, `index.html`, or `src/**`.

## Approval boundaries

- This skill is read-only. All output is proposed, not applied.
- The Coordinator approves or rejects each proposed change before `project-sync-apply` runs.

## Backed by

`docs/project-control/project-sync-policy.md`
`docs/project-control/project-sync-dry-run-format.md`
`docs/dev/closeout-sync-contract.md`
`scripts/project-control-sync-dry-run.mjs` (optional)
