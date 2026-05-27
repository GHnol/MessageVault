# External Sync Safety Rules

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24; updated in AI Project OS v1.2 external setup alignment, 2026-05-25; updated in AI Project OS v1.3 External Board Provider Update, 2026-05-25)
**Owner:** Coordinator / Project Control
**Purpose:** Governs how and when external tools (GitHub Projects, Google Calendar, ClickUp, TickTick) may be updated from repo state.

These rules are non-negotiable. They apply to every agent, script, and manual process that touches external tool data on behalf of the KeepMees project.

---

## The fundamental safety rules

1. **Dry-run before apply.** Always produce a delta proposal before applying any change to an external tool. No exceptions.
2. **Approval before apply.** All external tool changes require explicit Coordinator approval before being applied.
3. **No destructive deletes without approval.** Never delete a calendar event, GitHub Issue, GitHub Project item, ClickUp task, or TickTick item without explicit approval. Propose the delete; wait for confirmation.
4. **No silent overwrites.** Never silently overwrite a user-edited external record. If the external record differs from the repo doc, surface the conflict and ask the Coordinator which version to keep.
5. **Log every applied change.** Every change applied to an external tool must be recorded in `project-sync-log.md` or `github-projects-sync-log.md` with the date, method, and what changed.
6. **No credentials in the repo.** Never commit API keys, OAuth tokens, GitHub tokens, client secrets, or any authentication credential. External sync always runs from user-level credentials (never committed).
7. **No API calls from repo scripts without --apply.** Scripts in `scripts/` must not make API calls to external services without an explicit `--apply` flag and Coordinator approval. Default mode for all scripts is dry-run or help output.

---

## GitHub Projects and gh CLI safety

### GitHub token and gh auth safety

- **Never commit GitHub tokens (PAT, fine-grained, or classic) of any kind.** This includes tokens starting with `ghp_`, `github_pat_`, or any variation.
- **Never commit OAuth credentials** from `~/.config/gh/hosts.yml` or any gh CLI auth file.
- **Never run `gh auth login` from a script automatically.** If `gh auth status` fails, print clear instructions and exit non-zero. The user must authenticate manually.
- **Never change `gh auth` state from a script.** Do not run `gh auth switch`, `gh auth logout`, or `gh auth token` from a repo script.
- **Never print the output of `gh auth token`** or any command that displays auth tokens.

### Committed vs non-committed files (GitHub Projects)

- `docs/project-control/external-sync-map.local.json` — **never committed.** Contains real GitHub project_id, project_item_id, issue numbers, and issue URLs. Gitignored.
- `docs/project-control/github-projects-template-config.local.json` — **never committed.** Contains real template project ID and configuration. Gitignored. Populated only after Gate 2 is authorized.
- `docs/project-control/github-projects-field-map.example.json` — **committed as example only.** Must contain only fake placeholder IDs. Never real project IDs, issue numbers, or item IDs.
- `docs/project-control/github-projects-template-config.example.json` — **committed as example only.** Must contain only placeholder IDs (`PVT_placeholder`, `template_project_number: 0`). Never real template project IDs.
- GitHub tokens, OAuth credentials, or any GitHub authentication material — **never committed.**

### No destructive project item or issue deletion

Do not delete GitHub Issues or GitHub Project items without explicit Coordinator approval. Propose the delete; wait for confirmation. Closing an issue is preferable to deleting it — GitHub maintains an audit trail for closed issues.

### No silent overwrite of GitHub Project fields

Do not silently overwrite GitHub Project field values that a user has manually set. If the field value in the Project differs from the repo source record, surface the conflict.

### Apply scripts must require explicit approval flags

All apply scripts (`github-project-setup-apply.mjs`, `github-project-import-issues.mjs`) must:
- Require `--apply` to perform any external write.
- Print a warning and exit if `--apply` is absent.
- Verify `gh auth status` before any apply operation.
- Print the exact operations that will run before running them.

### Dry-run scripts must perform no external mutation

`github-project-setup-dry-run.mjs`, `github-project-sync-status.mjs`, and `github-project-field-map.mjs` must never call any external API. Dry-run output goes to stdout only.

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

### Approved structure

ClickUp uses one primary List (01 Project Control Board) inside the KeepMees Space / 00 Project Control Folder. Workflow slices (Current Sprint, Backlog, Review / QA, etc.) are saved views and filters — not separate Lists by default. See `clickup-setup-policy.md` for the full approved structure.

### Committed and non-committed files

- `docs/project-control/external-sync-map.local.json` — **never committed.** Contains real ClickUp task IDs (`external_id`) and the Board `list_id`. Gitignored.
- `docs/project-control/external-sync-map.example.json` — **committed as example only.** Must contain only fake placeholder IDs, never real ClickUp IDs.
- ClickUp API tokens, OAuth credentials, or any ClickUp authentication material — **never committed.**

### AI agents as ClickUp assignees

Do not use ClickUp task assignees for AI agents (Claude, Codex) unless they are real ClickUp workspace users. Assign AI agent ownership via the Owner Role custom field only.

### Sync method

ClickUp is updated by re-importing `clickup-import.csv` into the 01 Project Control Board List. The import is additive by default (ClickUp does not auto-delete existing tasks on import). This is safe for adding new tasks and updating statuses.

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

This shows the format of the map file. It must contain only fake placeholder IDs — never real Google Calendar event IDs, ClickUp task IDs, TickTick item IDs, or any other real external identifiers.

---

## What scripts may never do

- Make HTTP requests to any external API
- Read or write files outside the repo (except local `external-sync-map.local.json`)
- Open authentication flows
- Store credentials of any kind
- Delete files without user confirmation

The `project-control-sync-dry-run.mjs` and `project-control-sync-validate.mjs` scripts in `scripts/` follow all of these rules. They are read-only, local-file-only, dependency-free, and contain no API calls.
