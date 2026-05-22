# TickTick Recurring Routines

**Last updated:** 2026-05-17 (America/New_York)
**Owner:** Founder (personal execution)
**Purpose:** Define the small set of recurring TickTick tasks that keep the operating rhythm without overloading. These mirror the calendar rituals (`calendar-spec.md`) as personal check-offs. They do not replace the calendar or repo docs.

Each routine: name · recurrence · priority · list · tags · notes · linked source · when to change/delete.

---

| Routine | Recurrence | Priority | List | Tags | Notes | Linked source | Change/delete when |
|---|---|---|---|---|---|---|---|
| KeepMees CEO Review | Weekly, Sun | High | KeepMees - Coordinator | #keepmees #review | Capacity + direction check | `calendar-spec.md`, `current-sprint.md` | If cadence changes in calendar-spec |
| Coordinator weekly plan | Weekly, Mon | High | KeepMees - Coordinator | #keepmees #review | Pick this week's 1–3 tasks | `next-7-days.md` | Cadence change |
| Project Control Sync | Weekly, Fri | High | KeepMees - Coordinator | #keepmees #review | Run `coordinator-weekly-sync.md` | `coordinator-weekly-sync.md` | Cadence change |
| Weekly closeout + repo update | Weekly, Fri | High | KeepMees - This Week | #keepmees | Update current-sprint/kanban/CURRENT_STATE | `current-sprint.md` | Process change |
| Monthly Roadmap Reset | Monthly, 1st Sun | Medium | KeepMees - Coordinator | #keepmees #review | Re-baseline roadmap/schedule | `master-roadmap.md` | Cadence change |
| Monthly Budget review | Monthly, 1st Sun | Medium | KeepMees - Coordinator | #keepmees #review | Designer gap / viability | `risk-register.md` (R-BUD-1) | Budget resolved |
| Monthly Risk review | Monthly, 2nd Sun | Medium | KeepMees - Coordinator | #keepmees #review | Full risk pass | `risk-register.md` | Cadence change |
| Confirm gated items still paused | Weekly, Mon | Medium | KeepMees - Waiting / Blocked | #keepmees #blocked | Vendor/design/packaging stay gated | `phase-gates.md` | Gate opens |

---

## Setup notes

- Create these as repeating tasks in TickTick (or import once and set recurrence manually — TickTick CSV import does not carry recurrence reliably, so set recurrence in-app).
- Keep the total small. If routines feel like noise, delete the lowest-value one rather than ignoring all.
- Recurrence times track `calendar-spec.md`. If the calendar changes, update there first, then adjust these routines.

## Hard rule

Routines are reminders to **run a process that updates the repo**, not the process itself. The output of every routine lands in `docs/project-control/`, never only in TickTick.
