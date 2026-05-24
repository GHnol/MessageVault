# KeepMees Calendar Sync Policy

**Status:** ACTIVE (introduced in AI Project OS Usability Patch, 2026-05-24)
**Owner:** Coordinator / Project Control
**Companion docs:** `calendar-spec.md`, `calendar-source-template.md`, `calendar-sync-log.md`
**Companion command:** `/calendar-sync-plan` (`.claude/commands/calendar-sync-plan.md`)

---

## Current state of calendar sync

The KeepMees project calendar exists as a repo-native `.ics` file:

- `docs/project-control/keepmees-project-calendar.ics`

This file was generated once (Package 2.8, 2026-05-17) and committed. The original import into Google Calendar was a one-time manual action.

**The current `.ics` is a static snapshot.** It reflects the schedule and rituals as of 2026-05-17. It has not been regenerated since. This is acceptable as long as the recurring rituals are stable and no milestone dates have shifted materially.

---

## The static-import problem

A one-time `.ics` import into Google Calendar creates events with Google-assigned event IDs. If you delete those events and reimport the `.ics`, Google creates new events with new IDs. This causes:

- Duplicate events if the old ones were not fully deleted
- Lost custom notification settings on the old events
- Lost RSVP state or sharing if others were invited
- Calendar history gaps

**Rule: do not delete and reimport the full calendar to update it.** Targeted updates (edit individual events in Google Calendar for date shifts; add new events manually) are preferable to a full reimport unless the change is large and fundamental.

---

## What belongs in the calendar vs other tools

| Content type | Tool |
|---|---|
| Recurring weekly/monthly review rituals | Calendar (stable, recurring) |
| Phase gate checkpoint placeholders | Calendar (as approximate dates) |
| Launch readiness review | Calendar (low-confidence placeholder) |
| Sprint tasks and daily to-dos | TickTick / ClickUp |
| Full project board state | ClickUp / Kanban |
| Project truth (decisions, roadmap) | Repo docs |
| Individual backlog items | ClickUp |

Rule: if it is a task, it is not a calendar event. If it is a recurring review or a milestone gate checkpoint, it belongs on the calendar.

---

## Stable vs dynamic calendar content

### Stable (should not change unless the review cadence itself changes)

- KeepMees CEO Review — weekly, Sun 19:00
- Coordinator Planning Review — weekly, Mon 19:30
- Development Review — weekly, Wed 19:30
- Product / Design Review — weekly, Thu 19:30
- Project Control Sync — weekly, Fri 19:30
- Monthly Roadmap Reset — monthly, 1st Sun 17:00
- Monthly Budget / Viability Review — monthly, 1st Sun 18:45
- Monthly Risk Review — monthly, 2nd Sun 17:00

If these shift, update `calendar-spec.md` first, log the change, then regenerate the `.ics`.

### Dynamic (move as the schedule changes)

- Phase gate checkpoint dates (Gate 1, Gate 2, etc.)
- Package authorization windows
- Launch readiness review date

Dynamic items should be proposed as a delta before applying. They do not trigger a full `.ics` regeneration — targeted edits in Google Calendar are sufficient for date shifts.

---

## When to regenerate the `.ics`

Regenerate the `.ics` only when:

1. A stable recurring ritual has changed (time, cadence, duration)
2. New recurring rituals have been added
3. The gate/milestone structure has changed materially (new phases, removed phases)
4. The existing `.ics` events in Google Calendar have been manually deleted

Otherwise, edit individual events in Google Calendar directly and log the change in `calendar-sync-log.md`.

---

## Dry-run / apply workflow

Before any calendar change, propose a delta:

1. List the events to add, update, or remove
2. Classify each as stable recurring, dynamic milestone, or new ritual
3. Recommend method: Google Calendar edit (targeted) vs `.ics` regeneration (full)
4. Wait for Coordinator approval
5. Apply the change
6. Log it in `calendar-sync-log.md`

Use `/calendar-sync-plan` to generate the dry-run proposal.

---

## Future automation (not yet implemented)

Two scripts are planned but not yet authorized or implemented:

### `scripts/generate-project-calendar.mjs`

Would generate the full `keepmees-project-calendar.ics` from a repo-native source of truth (JSON or markdown template) rather than requiring manual `.ics` editing. Stable recurring events would have stable UIDs so reimporting does not create duplicates.

### `scripts/sync-project-calendar.mjs`

Would apply delta updates to Google Calendar via the Google Calendar API, using stable event IDs. Would require OAuth credentials (never committed), dry-run mode, and an apply flag.

**Neither script exists yet.** Do not implement either without explicit Coordinator authorization and a separately authorized package.

---

## What NOT to do

- Do not store API credentials in the repo
- Do not run Google Calendar API calls from this repo without an authorized package
- Do not delete the committed `.ics` file — it is protected by a `.gitignore` exception
- Do not add individual sprint tasks or daily to-dos to the calendar
- Do not apply calendar changes without Coordinator approval

---

## Relationship to other docs

- `calendar-spec.md` — canonical ritual definitions (source of truth for what goes on the calendar)
- `calendar-source-template.md` — how to describe a new calendar event before generating it
- `calendar-sync-log.md` — record of every calendar change applied
- `master-schedule.md` — phase schedule (drives dynamic milestone dates)
- `coordinator-weekly-sync.md` — weekly process that includes calendar review
