# External Sync Safety Rules

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24)
**Owner:** Coordinator / Project Control
**Purpose:** Governs how and when external tools (Google Calendar, ClickUp, TickTick) may be updated from repo state.

These rules are non-negotiable. They apply to every agent, script, and manual process that touches external tool data on behalf of the KeepMees project.

---

## The fundamental safety rules

1. **Dry-run before apply.** Always produce a delta proposal before applying any change to an external tool. No exceptions.
2. **Approval before apply.** All external tool changes require explicit Coordinator approval before being applied.
3. **No destructive deletes without approval.** Never delete a calendar event, ClickUp task, or TickTick item without explicit approval. Propose the delete; wait for confirmation.
4. **No silent overwrites.** Never silently overwrite a user-edited external record. If the external record differs from the repo doc, surface the conflict and ask the Coordinator which version to keep.
5. **Log every applied change.** Every change applied to an external tool must be recorded in `project-sync-log.md` with the date, method, and what changed.
6. **No credentials in the repo.** Never commit API keys, OAuth tokens, client secrets, or any authentication credential. External sync always runs from user-level credentials (never committed).
7. **No API calls from repo scripts.** Scripts in `scripts/` must not make API calls to external services. API scripts, if they ever exist, are gitignored local tools, never committed.

---

## Google Calendar safety

### What may be done without a full reimport

- Edit an individual event's date, time, or description (targeted edit in Google Calendar UI)
- Add a new one-time event (targeted add in Google Calendar UI)
- Mark an event as cancelled without deleting it (use "Remove from calendar" or drag to trash carefully)

### When a full .ics reimport is acceptable

Only when:
1. A stable recurring ritual has changed (time, cadence, duration)
2. New recurring rituals have been added
3. The gate/milestone structure has changed materially
4. The existing `.ics` events have been manually deleted by the user

Before any reimport:
- Propose the full event list delta via dry-run
- Get Coordinator approval
- Delete old events only after the Coordinator confirms

### Why no delete-and-reimport as default

The `.ics` one-time import assigns Google-generated event IDs. Deleting and reimporting creates:
- Duplicate events (if old ones were not fully deleted)
- Lost custom notification settings
- Lost RSVP state or sharing configuration
- Calendar history gaps

Future: when `scripts/generate-project-calendar.mjs` exists with stable UIDs, targeted reimport via stable IDs becomes safe. Until then, targeted edits are the correct method.

### Stable event UIDs

All KeepMees calendar events in `calendar-source-template.md` have stable UIDs in `keepmees-<slug>` format. These UIDs ensure that future `.ics` regeneration with a UID-aware script will not create duplicates.

External Google Calendar event IDs are stored in `external-sync-map.local.json` (gitignored). If the map does not exist locally, targeted edits are the only safe method.

---

## ClickUp safety

### Sync method

ClickUp is updated by re-importing `clickup-import.csv`. The import is additive by default (ClickUp does not auto-delete existing tasks on import). This is safe for adding new tasks and updating statuses.

### Risks to avoid

- Do not import a CSV that removes tasks that the Coordinator has manually managed in ClickUp.
- Do not reimport unless the repo backlog/sprint has changed enough to warrant it.
- If the Coordinator has added custom subtasks or comments in ClickUp, those will not be affected by a CSV reimport (CSV import creates top-level tasks only).

### When to reimport

After significant sprint transitions or major backlog restructures. Not for every package completion.

---

## TickTick safety

### Sync method

TickTick is updated by re-importing `ticktick-import.csv`. Similar additive import — does not delete existing items.

### Risks to avoid

- Do not import TickTick items that are already on the personal list and were manually marked complete by the Coordinator.
- TickTick is the personal execution layer only — small tasks, not project-level milestones.

### When to reimport

When the weekly checklist or recurring routines change significantly. Not for every package completion.

---

## External ID map

### Gitignored (never committed)

`docs/project-control/external-sync-map.local.json`

This file maps stable internal IDs to external tool IDs (Google Calendar event IDs, ClickUp task IDs, TickTick item IDs). It lives only on each contributor's machine and is never committed. Without this file, the agent falls back to "unknown" for external IDs and uses targeted UI edits instead of API-based sync.

### Committed as example only

`docs/project-control/external-sync-map.example.json`

This shows the format of the map file. It contains no real external IDs.

---

## What scripts may never do

- Make HTTP requests to any external API
- Read or write files outside the repo (except local `external-sync-map.local.json`)
- Open authentication flows
- Store credentials of any kind
- Delete files without user confirmation

The `project-control-sync-dry-run.mjs` and `project-control-sync-validate.mjs` scripts in `scripts/` follow all of these rules. They are read-only, local-file-only, dependency-free, and contain no API calls.
