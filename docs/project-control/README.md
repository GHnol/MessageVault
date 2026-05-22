# KeepMees Project Control Tower

**Status:** ACTIVE — built in Package 2.8. This is the live repo-native operating system for KeepMees.
**Last updated:** 2026-05-17
**Owner:** Coordinator (Chat 01). Maintained by Claude Code / Codex under Operator Mode.

---

## What this is

The Project Control Tower is the repo-native coordination layer for the entire KeepMees project — from current state through launch readiness and post-launch learning. It exists so KeepMees stops being an endless prompt chain with unclear timing, sequence, ownership, dependencies, and next actions.

It is **not** only a roadmap, Kanban board, calendar, ClickUp import, or TickTick checklist. It is the layer that ties all of those together on top of one source of truth.

---

## Source of truth rule

**Repo docs under `docs/project-control/` are the source of truth.** They are version-controlled, survive chat context loss, and are readable by Claude, Codex, and future agents.

External tools (ClickUp, TickTick, Google Calendar, Kanban tooling) help **execute** the plan. They do **not** override repo truth. If an external tool changes, the Coordinator syncs the change back into these docs — otherwise the repo wins.

Priority order when sources conflict:

1. Current code (git)
2. `docs/` locked decisions, requirements, strategy (`docs/strategy/`, `docs/ops/decision-register.md`)
3. `AGENTS.md` / `CLAUDE.md` / `.codex/README.md`
4. `CURRENT_STATE.md`
5. This Tower (`docs/project-control/`)
6. `docs/command-center/*` (delivered status)
7. External tools (ClickUp / TickTick / Calendar) — lowest; never authoritative

---

## The six layers

| Layer | Where | Role |
|---|---|---|
| 1. Source of truth | `docs/project-control/` (this dir) | Authoritative roadmap, schedule, backlog, gates, decisions, risks |
| 2. Full execution board | `clickup-import.csv` | Whole-project task board (product, dev, design, vendor, packaging, growth, legal, finance, QA) |
| 3. Phase/state visibility | `kanban-board.md` | Work by execution state |
| 4. Calendar rituals | `calendar-spec.md` + `keepmees-project-calendar.ics` | Recurring reviews + milestone gates only — not every task |
| 5. Personal daily execution | `ticktick-import.csv` + `ticktick-weekly-checklist.md` + `ticktick-recurring-routines.md` | Check-off-sized personal tasks only |
| 6. Coordinator ownership | `coordinator-weekly-sync.md` | Weekly process keeping all layers synchronized |

TickTick does **not** replace ClickUp, Kanban, the calendar, or repo docs. It is only the personal check-off layer.

---

## File index

| File | Purpose |
|---|---|
| `README.md` | This file — structure and rules |
| `master-roadmap.md` | Phases 0–15 from current state to post-launch, with package history mapped in |
| `master-schedule.md` | Dated schedule with confidence levels, dependency map, 7/30/90 pointers |
| `current-sprint.md` | The active sprint: goal, tasks, TickTick checklist, closeout template |
| `backlog.md` | Full backlog across 16 lanes with status/priority/phase |
| `kanban-board.md` | Status-column board (full project + current sprint) |
| `phase-gates.md` | Go/no-go gates that prevent fake progress |
| `decision-log.md` | Locked / active / open / deferred / killed decisions |
| `risk-register.md` | Project risk register across 15 categories |
| `calendar-spec.md` | What belongs on the calendar; recurring ritual definitions |
| `keepmees-project-calendar.ics` | Importable Google Calendar file (review rituals + gate placeholders) |
| `clickup-import.csv` | ClickUp-ready task import |
| `ticktick-import.csv` | TickTick-ready personal task import |
| `ticktick-weekly-checklist.md` | Manual weekly checklist for TickTick |
| `ticktick-recurring-routines.md` | Recurring TickTick routine definitions |
| `next-7-days.md` | Practical day-by-day plan |
| `next-30-days.md` | Week-by-week plan |
| `next-90-days.md` | Month-by-month directional plan |
| `coordinator-weekly-sync.md` | Weekly Coordinator synchronization process |
| `next-session-prompt.md` | Copy-paste prompt for the next session |
| `project-control-tower-plan.md` | Superseded Package 2.7 plan stub (kept for history) |
| `project-calendar-spec.md` | Superseded Package 2.7 calendar stub (points to `calendar-spec.md`) |

---

## How to use the Tower

- **Starting a session:** read `CURRENT_STATE.md`, then `current-sprint.md`, then `next-7-days.md`.
- **Weekly:** Coordinator runs `coordinator-weekly-sync.md`.
- **Deciding what to do now:** `current-sprint.md` → `next-7-days.md`.
- **Deciding what is allowed:** `phase-gates.md` + `decision-log.md`.
- **Importing tools:** see import instructions in `calendar-spec.md` (calendar) and the header comments of the CSV files.

## How to update the Tower after a package closes

1. Update `CURRENT_STATE.md` and `docs/command-center/current-status.md` (existing Operator Mode flow).
2. In `docs/project-control/`: move the closed package to history in `master-roadmap.md`, update `master-schedule.md` dates/confidence, refresh `current-sprint.md`, re-rank `backlog.md`, move Kanban cards, update `next-7-days.md` / `next-30-days.md` / `next-90-days.md`.
3. Refresh `clickup-import.csv` / `ticktick-import.csv` / `.ics` only if board/personal/ritual content actually changed.
4. Record what changed and what did not in `coordinator-weekly-sync.md`.

## How to handle changed priorities

Re-rank `backlog.md` and update `current-sprint.md` + the 7/30/90 docs. Do not silently change roadmap phases — record the reason in `decision-log.md`.

## Keeping Package 5A paused

Package 5A (Message Book Proof Approval State Foundation) stays paused until this Tower is complete, reviewed, committed, merged, and explicitly approved by the Coordinator. No proof-approval-state code begins before that. This is enforced by the **Foundation Operating System Gate** in `phase-gates.md`.
