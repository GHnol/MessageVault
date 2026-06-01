---
name: weekly-sync
description: Run the KeepMees Coordinator weekly sync — read Tower state, propose updates to sprint, schedule, kanban, and external tools, and run the internal sync check.
---

## Purpose

Keep the Project Control Tower current on a weekly cadence. The weekly sync is the scheduled ritual for catching drift between repo docs, external tools (ClickUp, TickTick, Calendar), and actual project state. It also satisfies the internal sync obligation that the auto-management protocol requires after meaningful planning changes.

## When to use

- Every week during the Project Control Sync ritual (Friday 19:30 ET per `calendar-spec.md`)
- After any major planning change, milestone shift, or backlog re-ranking
- When explicitly authorized by the Coordinator

**Invocation type:** User-invoked. Semi-automatic at the weekly ritual — the Coordinator invokes; Claude follows the process. No autonomous execution.

Note: This skill is the escalation path for the internal sync check. After every package closeout, the closeout skill checks whether a weekly sync is needed. If yes, it flags the need — the Coordinator then authorizes and invokes this skill.

## Files to read

1. `docs/project-control/coordinator-weekly-sync.md` (the process)
2. `docs/project-control/master-schedule.md`
3. `docs/project-control/current-sprint.md`
4. `docs/project-control/kanban-board.md`
5. `CURRENT_STATE.md`
6. `docs/project-control/calendar-sync-policy.md` (for calendar staleness check)
7. `docs/project-control/report-mirror-log.md` (for recent closeout context — last mirrored entry date)

## Required git preflight

Run:

- `git status --short`
- `git log --oneline -5`

## Sync obligations

This skill IS the internal sync check for planning-layer changes. After producing the weekly log entry and proposed updates, check:

- `docs/project-control/current-sprint.md` — sprint state accurate?
- `docs/project-control/kanban-board.md` — cards in right columns?
- Backlog, risk register, decision log — anything changed this week?
- `docs/project-control/shareable-status-summary.md` — needs update?
- Calendar staleness — any ritual dates drifted?
- ClickUp/TickTick export staleness — significant enough to re-export?

External tool updates (ClickUp, TickTick, Google Calendar) are dry-run/apply only. Propose before applying; apply only after Coordinator approval.

When external tools (Google Calendar, GitHub Projects) are part of the weekly review, run the external sync consistency check to detect any drift:

```
node scripts/external-sync-consistency-check.mjs --local-only
```

Include the consistency result (PASS/WARN/FAIL) in the weekly sync output. If FAILs exist, flag them for Coordinator resolution before proposing any external sync operation.

## Output format

1. Proposed weekly log entry (date, what was reviewed, what changed)
2. Sprint or schedule adjustments needed (proposed, not applied)
3. Whether calendar, ClickUp, or TickTick files need regeneration
4. Decisions made this week → `decision-log.md`
5. Risks changed → `risk-register.md`
6. Internal sync check result (what was verified, what needs updating)
7. External dry-run delta (if any external tool changes are proposed)

Do not commit without explicit instruction.

## Hard stop conditions

- Do not apply changes to external tools without Coordinator approval.
- Do not add sprint tasks or daily to-dos to the calendar.
- Do not modify locked product decisions.

## Approval boundaries

- All proposed doc updates require user/Coordinator confirmation before writing.
- All external tool updates (ClickUp, TickTick, Calendar) require Coordinator approval before applying.
- This skill does not commit or push.

## Backed by

`docs/project-control/coordinator-weekly-sync.md`
`docs/project-control/calendar-sync-policy.md`
`docs/dev/auto-management-protocol.md`
`docs/dev/closeout-sync-contract.md`
