# ClickUp Setup Policy

**Status:** ACTIVE (introduced in AI Project OS v1.2 external setup alignment, 2026-05-25)
**Owner:** Coordinator / Project Control
**Companion docs:** `external-platform-mapping-guide.md`, `project-sync-policy.md`, `external-sync-safety.md`, `external-sync-map.example.json`

---

## Approved ClickUp structure

The KeepMees ClickUp setup uses one primary Project Control Board. Do not create six separate Lists for workflow lanes by default.

| Layer | Value |
|---|---|
| Workspace | Existing user workspace |
| Space | KeepMees |
| Folder | 00 Project Control |
| Primary List | 01 Project Control Board |

All project-control work — sprints, backlog, milestones, gates, risks, decisions — lives in the single primary List. AI OS governance lanes and workflow slices are expressed as saved views and filters, not separate Lists.

---

## Saved views and filters (inside 01 Project Control Board)

Create these as saved views or filter presets inside the primary List:

| View name | Filter logic |
|---|---|
| Current Sprint | Status = In Progress or Waiting, due date within sprint window |
| Backlog | Status = Not Started or Backlog, not in current sprint |
| Review / QA | Status = In Review |
| Waiting / Blocked | Status = Waiting or Blocked |
| Done | Status = Done or Approved |
| Risks / Decisions | Decision Needed = Yes, or Risk Level = High |
| Calendar Relevant | Calendar Relevant = Yes |
| TickTick Relevant | TickTick Relevant = Yes |
| By Package | Group by Package field |
| By Phase | Group by Phase field |
| By Lane | Group by Lane field |
| Decision Needed | Decision Needed = Yes |

These views replace the need for separate Lists in the default single-team setup.

### When separate Lists become acceptable

Separate ClickUp Lists for Current Sprint, Backlog, Review / QA, etc. are a future scaling option only. Switch to separate Lists if:

- The primary Board has grown large enough that ClickUp performance or usability is meaningfully degraded
- The team has expanded to the point where separate ownership per List is operationally necessary
- The Coordinator explicitly decides the separate-List model is better for the current team size

Do not create separate Lists speculatively or by default.

---

## Recommended hybrid statuses

These statuses apply to the single primary List and support both product/engineering workflow and AI OS governance:

| Status | Meaning |
|---|---|
| Not Started | Task exists but no work has begun |
| In Progress | Actively being worked |
| In Review | Implementation done; awaiting review or approval |
| Blocked | Cannot proceed due to an external dependency or decision |
| Waiting | On hold pending action from another party |
| Approved | Explicitly approved by Coordinator; may proceed or archive |
| Done | Completed and verified |
| Deferred | Explicitly pushed to a future phase |
| Cancelled | Killed; will not be done |

---

## Required custom fields

Add the following custom fields to the 01 Project Control Board List:

| Field name | Type | Purpose |
|---|---|---|
| OS ID | Text | Stable internal ID (`keepmees-<category>-<slug>`) |
| Package | Text | Package this task belongs to (e.g. `Package 5A`) |
| Phase | Text or Number | Project phase (0–15) |
| Lane | Dropdown | Execution lane (matches `backlog.md` lane names) |
| Source File | Text | Relative path to the canonical repo doc |
| Last Repo Sync | Date | When this task was last synced from repo docs |
| External Sync Status | Dropdown | `in-sync`, `drift`, `unknown`, `not-tracked` |
| Risk Level | Dropdown | `Low`, `Medium`, `High` |
| Decision Needed | Checkbox | Yes if task is blocked by an open decision |
| Calendar Relevant | Checkbox | Yes if this task or its deadline belongs on Google Calendar |
| TickTick Relevant | Checkbox | Yes if this task belongs in the TickTick personal execution layer |
| Owner Role | Dropdown | Role responsible (see Owner Role rule below) |
| Success Criteria | Text | What "done" looks like; matches `Success Criteria` in repo doc |

---

## Owner Role rule

Use the Owner Role custom field to identify who owns a task. Do not use ClickUp task assignees for AI agents unless the agent corresponds to a real ClickUp user in the workspace.

Allowed Owner Role values:

- Founder
- Coordinator
- Claude
- Codex
- Development
- Vendor
- Design
- Product
- QA

Human ClickUp assignees (the ClickUp assignee field, not Owner Role) should only be set to real workspace users. AI agents (Claude, Codex) appear in Owner Role only.

---

## Sync map rule

- Use **one primary list_id** for the 01 Project Control Board.
- Store the list_id in `docs/project-control/external-sync-map.local.json` (gitignored, never committed).
- Use stable per-task `external_id` values in the sync map — one ClickUp task ID per repo task.
- See `external-sync-map.example.json` for the map format.
- Do not commit `external-sync-map.local.json`.
- Do not commit ClickUp API tokens or OAuth credentials of any kind.

---

## Import method

Import `docs/project-control/clickup-import.csv` into the 01 Project Control Board List. The import is additive — ClickUp does not auto-delete existing tasks on reimport. After import, manually set custom field values that could not be mapped from the CSV (OS ID, Package, Last Repo Sync, External Sync Status).

Reimport only when the repo backlog or sprint has changed enough to warrant it. Log all reimports in `docs/project-control/project-sync-log.md`.

---

## What this policy does NOT do

- It does not commit or push.
- It does not make ClickUp API calls.
- It does not override the Coordinator's structural decisions about the workspace.
- It does not authorize separate Lists without an explicit Coordinator decision.
