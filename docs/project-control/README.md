# Project Control — KeepMees / MessageVault

**Status:** Readiness layer only. The full Project Control Tower is **not built** and **not authorized** in this pass (Package 2.7).

---

## Purpose

This directory prepares the repo for a future Project Control Tower pass without pre-building it. It holds the plan, the calendar/schedule spec, and the Coordinator weekly-sync placeholder so the next pass can be executed cleanly and consistently.

---

## What lives here

| File | Purpose | State |
|---|---|---|
| `README.md` | This file | Active |
| `project-control-tower-plan.md` | Scope and structure of the future Tower pass | Plan only |
| `project-calendar-spec.md` | How calendar/schedule export will work when built | Spec only |
| `coordinator-weekly-sync.md` | Recurring Coordinator status-sync placeholder | Placeholder |

---

## What is NOT here yet (deliberately)

Master roadmap, master schedule, phase-gate board, backlog board, sprint board, Kanban, Google Calendar `.ics`, ClickUp import CSV, TickTick personal layer, risk/decision boards. These are the **next** Project Control Tower pass — see the plan file.

---

## Source-of-truth relationship

Project Control docs **summarize and schedule**; they do not override:

1. Current code (git)
2. `docs/` locked decisions, requirements, strategy
3. `AGENTS.md` / `CLAUDE.md`
4. `CURRENT_STATE.md` (durable snapshot)
5. `docs/command-center/*` (delivered status)

If Project Control content ever conflicts with the above, the above wins and the Project Control doc is corrected.
