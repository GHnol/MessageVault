# External Platform Mapping Guide

**Status:** ACTIVE (introduced in AI Project OS v1.2 external setup alignment, 2026-05-25)
**Owner:** Coordinator / Project Control
**Companion docs:** `clickup-setup-policy.md`, `project-sync-policy.md`, `external-sync-safety.md`, `external-sync-map.example.json`

---

## Purpose

This guide explains how KeepMees project-control repo docs map to external tools (ClickUp, Google Calendar, TickTick). The repo is the source of truth. External tools execute the plan; they do not override it.

---

## Repo truth (canonical sources)

| File | What it contains |
|---|---|
| `docs/project-control/current-sprint.md` | Active sprint goal, tasks, status, closeout record |
| `docs/project-control/kanban-board.md` | Visual status board by execution state |
| `docs/project-control/backlog.md` | Full backlog across all lanes with status, priority, phase |
| `docs/project-control/master-roadmap.md` | Phases 0–15 with package history |
| `docs/project-control/master-schedule.md` | Dated schedule with confidence levels and dependency map |
| `docs/project-control/risk-register.md` | Project risk register |
| `docs/project-control/decision-log.md` | Locked, active, open, deferred, and killed decisions |
| `docs/project-control/calendar-source-template.md` | Calendar-sync source of truth (stable UIDs, event definitions) |
| `docs/project-control/clickup-import.csv` | ClickUp-ready task import |
| `docs/project-control/ticktick-import.csv` | TickTick-ready personal task import |

These files version-control the project state. If an external tool and a repo doc conflict, the repo doc wins.

---

## ClickUp mapping

### Structure

| ClickUp layer | Value |
|---|---|
| Workspace | Existing user workspace |
| Space | KeepMees |
| Folder | 00 Project Control |
| Primary List | 01 Project Control Board |
| Workflow slices | Saved views and filters inside the primary List |

All project-control tasks — sprint work, backlog, milestones, package tracking, gates, governance — live in the single primary List. See `clickup-setup-policy.md` for the full approved structure and view definitions.

### Repo doc → ClickUp field mapping

| Repo field | ClickUp field |
|---|---|
| Task Name | Task Name |
| Description | Task Description |
| Status | Status (hybrid set — see `clickup-setup-policy.md`) |
| Priority | Priority |
| Lane | Lane (custom field — Dropdown) |
| Phase | Phase (custom field — Text or Number) |
| Start Date | Start Date |
| Due Date | Due Date |
| Dependencies | Dependency links or Dependencies field |
| Success Criteria | Success Criteria (custom field — Text) |
| Risk Level | Risk Level (custom field — Dropdown) |
| Owner | Owner Role (custom field — Dropdown; not ClickUp assignee for AI agents) |
| Tags | Tags |
| Calendar Relevant | Calendar Relevant (custom field — Checkbox) |
| TickTick Relevant | TickTick Relevant (custom field — Checkbox) |
| Source Doc | Source File (custom field — Text) |
| Notes | Notes / Description |

Custom fields not populated by CSV import and requiring manual entry after import: OS ID, Package, Last Repo Sync, External Sync Status.

### Sync map

External task IDs are stored in `external-sync-map.local.json` (gitignored). The map uses one `list_id` for the primary Board and one `external_id` per task. See `external-sync-map.example.json` for the format.

### AI agents as Owner Role

Claude and Codex appear in the Owner Role custom field only. Do not assign AI agents as ClickUp task assignees unless they are real workspace users.

### Import method

Import `clickup-import.csv` into the 01 Project Control Board. Reimport is additive. Log each reimport in `project-sync-log.md`. Do not reimport for minor changes — targeted manual edits in ClickUp are preferred for individual task updates.

---

## Google Calendar mapping

### What belongs on the calendar

Google Calendar is for rituals, reviews, phase gates, and milestone events only. It is not a task board.

| Calendar item type | Examples |
|---|---|
| Recurring reviews | CEO Review, Coordinator Planning Review, Dev Review, Product/Design Review, Project Control Sync |
| Monthly rituals | Monthly roadmap reset, budget review, risk review |
| Phase gate checkpoints | Gate 1 (Foundation OS), Gate 6 (Vendor), Gate 9 (Beta Proof Review), etc. |
| Milestone events | Launch Readiness Review |

Individual backlog tasks, sprint tasks, and daily to-dos belong in ClickUp and TickTick, not Google Calendar.

### Stable event UIDs

Every KeepMees calendar event has a stable UID in `keepmees-<slug>` format (defined in `calendar-source-template.md`). These UIDs ensure that future ICS regeneration with a UID-aware script will not create duplicates.

Google Calendar external event IDs are stored in `external-sync-map.local.json` (gitignored).

### Sync method

Prefer targeted edits in the Google Calendar UI for date changes and minor updates. Use ICS reimport only when recurring rituals change materially or new recurring rituals are added. No delete-and-reimport as the default operating model.

All calendar changes follow the dry-run → approval → apply → log workflow defined in `project-sync-policy.md`.

---

## TickTick mapping

### What belongs in TickTick

TickTick is the personal execution layer. Use it for:

- Today and this-week checklists
- Founder/Coordinator personal reminders
- Lightweight recurring routines
- Task-sized to-dos that do not belong in the project board

TickTick is not the canonical project source of truth. It mirrors a subset of the repo backlog for personal daily execution.

### Repo doc → TickTick mapping

| Source | TickTick content |
|---|---|
| `ticktick-import.csv` | Task-level personal to-dos |
| `ticktick-weekly-checklist.md` | Weekly checklist items |
| `ticktick-recurring-routines.md` | Recurring routine definitions |

### Sync method

Import `ticktick-import.csv` when the weekly checklist or recurring routines change significantly. The import is additive. Log each reimport in `project-sync-log.md`.

Do not push project-level milestones, package deliverables, or phase gates into TickTick. Those belong in ClickUp.

---

## External sync safety summary

All external sync follows these rules regardless of tool:

1. **No silent writes.** Every proposed change surfaces via dry-run before being applied.
2. **No destructive deletes without Coordinator approval.** Never delete a calendar event, ClickUp task, or TickTick item without explicit instruction.
3. **No credentials committed.** ClickUp tokens, Google Calendar OAuth credentials, and TickTick credentials must never be committed to the repo.
4. **External IDs in the ignored local map only.** `external-sync-map.local.json` is gitignored and lives only on each contributor's machine.
5. **`external-sync-map.example.json` uses placeholder IDs only.** It is committed as documentation. It must never contain real external IDs.
6. **Dry-run first, apply only after Coordinator approval.** See `project-sync-policy.md` for the full workflow.
7. **Log every applied change** in `project-sync-log.md`.

Full safety rules: `external-sync-safety.md`.

---

## What this guide does NOT do

- It does not commit or push.
- It does not make API calls to any external service.
- It does not override the Coordinator's decisions about tool adoption or structure.
- It does not authorize live API integration without a separate Coordinator-approved package.
