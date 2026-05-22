# KeepMees Calendar Spec

**Last updated:** 2026-05-17 (America/New_York)
**Owner:** Coordinator / Project Control
**Companion file:** `keepmees-project-calendar.ics` (importable)
**Supersedes:** `project-calendar-spec.md` (Package 2.7 stub).

---

## What calendar rituals are

Calendar rituals are recurring **review and decision events** plus dated **milestone/gate checkpoints**. They orient the founder and force regular review. They are not a task list.

## What belongs on the calendar

- Weekly review rituals (CEO, Coordinator, Development, Product/Design, Project Control Sync)
- Monthly reviews (Roadmap Reset, Budget/Viability, Risk)
- Phase gate review checkpoints (as dated placeholders)
- Launch-readiness review (low-confidence placeholder)

## What does NOT belong on the calendar

- Individual backlog tasks
- Micro to-dos (those go to TickTick)
- Full board state (that is ClickUp/Kanban)
- Project truth (that is repo docs)

Rule: if it is a task, it is not a calendar event. If it is a recurring review or a milestone gate, it is.

---

## Recurring cadence (defaults — America/New_York)

> These are reasonable defaults chosen because no better repo truth specified times. Adjust in this file first, then regenerate the `.ics`.

| Event | Cadence | Day/time | Duration | Purpose | Source doc to review | Output / update after |
|---|---|---|---|---|---|---|
| KeepMees CEO Review | Weekly | Sun 19:00 | 60m | Founder-level direction, capacity check | `CURRENT_STATE.md`, `current-sprint.md` | Adjust sprint scope; capacity note |
| Coordinator Planning Review | Weekly | Mon 19:30 | 60m | Plan the week, confirm priorities | `next-7-days.md`, `backlog.md` | Update `current-sprint.md` |
| Development Review | Weekly | Wed 19:30 | 45m | Dev progress, test baseline | `kanban-board.md`, E2E status | Update Kanban |
| Product / Design Review | Weekly | Thu 19:30 | 45m | Product truth, fidelity, design status | `decision-log.md`, fidelity risks | Note decisions/risks |
| Project Control Sync | Weekly | Fri 19:30 | 45m | Reconcile all Tower layers | full `docs/project-control/` | Run `coordinator-weekly-sync.md` |
| Monthly Roadmap Reset | Monthly | 1st Sun 17:00 | 90m | Re-baseline roadmap/schedule | `master-roadmap.md`, `master-schedule.md` | Update roadmap/schedule |
| Monthly Budget / Viability Review | Monthly | 1st Sun 18:45 | 45m | Budget, designer gap, viability | Finance lane, `risk-register.md` (R-BUD-1) | Budget decision note |
| Monthly Risk Review | Monthly | 2nd Sun 17:00 | 60m | Full risk pass | `risk-register.md` | Update risk statuses |
| Phase Gate Review | As needed | dated placeholder | 60m | Verify a gate before crossing | `phase-gates.md` | Gate pass/fail record |
| Launch Readiness Review | Low-confidence placeholder | dated placeholder | 90m | Pre-launch go/no-go | `docs/qa/release-readiness-template.md` | Launch decision |

Each event description in the `.ics` contains: purpose, agenda, expected output, source doc, and what to update afterward.

---

## How to import into Google Calendar

1. Open Google Calendar (web).
2. Settings (gear) → **Import & export**.
3. Under **Import**, choose `docs/project-control/keepmees-project-calendar.ics`.
4. Select the target calendar (a dedicated "KeepMees" calendar is recommended).
5. Click **Import**. Recurring events will populate from their first dated instance.
6. Optionally set notifications per recurring event after import.

## How to update the calendar

1. Edit cadence/milestones **here first** (this file).
2. Regenerate `keepmees-project-calendar.ics` to match.
3. Re-import (Google merges by UID; events with the same UID update rather than duplicate).
4. Record the change in `coordinator-weekly-sync.md`.

## How to avoid calendar overload

- Max ~5 weekly recurring events + 3 monthly + sparse gate placeholders.
- Never add per-task events.
- If the calendar feels noisy, cut events here and regenerate — do not add more.

---

## Assumptions (flagged)

- Times are evening ET because the founder has a separate full-time role (limited daytime availability — see R-CAP-1).
- 2026-05-17 is a Sunday; weekly anchors derive from that week.
- Monthly events use 1st/2nd Sunday of each month.
- Phase gate and launch dates are **Low-confidence placeholders**; they exist to force review, not to promise delivery.
