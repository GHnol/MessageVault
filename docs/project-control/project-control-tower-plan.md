# Project Control Tower — Plan (SUPERSEDED)

**Status:** SUPERSEDED by Package 2.8. The Tower described here has been built.
**Superseded:** 2026-05-17 (Package 2.8).
**Kept for history** — do not treat the old "NOT BUILT" language below as current.

---

## What changed

Package 2.7 created this file as a *plan only* ("NOT BUILT"). Package 2.8 built the full Project Control Tower. The authoritative entry point is now `README.md` in this directory.

## Where the planned components now live

| Planned component | Now delivered as |
|---|---|
| Master roadmap | `master-roadmap.md` |
| Master schedule | `master-schedule.md` |
| Phase gates | `phase-gates.md` |
| Backlog | `backlog.md` |
| Current sprint | `current-sprint.md` |
| Risk register | `risk-register.md` |
| Decision log | `decision-log.md` |
| Kanban board | `kanban-board.md` |
| Calendar | `calendar-spec.md` + `keepmees-project-calendar.ics` |
| ClickUp import | `clickup-import.csv` |
| TickTick layer | `ticktick-import.csv`, `ticktick-weekly-checklist.md`, `ticktick-recurring-routines.md` |
| Coordinator weekly sync | `coordinator-weekly-sync.md` |
| Horizon plans | `next-7-days.md`, `next-30-days.md`, `next-90-days.md` |

## Historical note (preserved)

The Package 2.7 plan established the design rules the built Tower follows: git stays source of truth; the repo-native `.ics` is the single committed calendar (a surgical `.gitignore` exception was added in Package 2.8); no fake certainty; consistency re-derived from `CURRENT_STATE.md`; no scope creep into product. Those rules remain in force — see `README.md`.
