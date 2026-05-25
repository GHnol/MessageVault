# Project Control Sync Policy

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24; updated in AI Project OS v1.2 external setup alignment, 2026-05-25)
**Owner:** Coordinator / Project Control
**Companion docs:** `project-sync-dry-run-format.md`, `project-sync-source-schema.md`, `external-sync-safety.md`, `project-sync-log.md`, `clickup-setup-policy.md`, `external-platform-mapping-guide.md`
**Companion commands:** `/project-sync-dry-run`, `/project-sync-apply`

---

## Source of truth hierarchy

Repo docs under `docs/project-control/` are the authoritative source of truth. External tools execute the plan — they do not override repo truth.

| Priority | Source |
|---|---|
| 1 | Current code (git) |
| 2 | Locked decisions (`docs/strategy/`, `docs/ops/decision-register.md`) |
| 3 | `AGENTS.md` / `CLAUDE.md` / `.codex/README.md` |
| 4 | `CURRENT_STATE.md` |
| 5 | `docs/project-control/` (Tower) |
| 6 | External tools (ClickUp / TickTick / Calendar) — lowest; never authoritative |

If an external tool and a repo doc conflict, the repo doc wins. The Coordinator syncs external changes back into the repo doc — not the reverse.

---

## What needs a sync and what does not

### Always sync after:

- A package closes (merged to main)
- A sprint transitions (old sprint closes, new sprint opens)
- A milestone or phase gate changes
- A blocker is lifted or introduced
- A significant schedule shift (> 1 week on a gate or package window)
- A major planning decision (priority reorder, scope change, new backlog lane)
- The weekly Project Control Sync ritual

### Never sync (no action needed) for:

- Cosmetic commit hash lag in state docs (cosmetic only; preflight `git log` is the control)
- Minor timestamp staleness with no operational field change
- Single-file doc cleanups with no schedule or task impact
- Purely internal OS/dev protocol updates with no Tower impact

---

## Stable IDs

Every project-control item that maps to an external tool uses a stable internal ID. These IDs survive renames and reschedules.

### Stable internal ID format

`keepmees-<category>-<slug>`

Examples:
- `keepmees-ritual-ceo-review-weekly`
- `keepmees-gate-foundation-os`
- `keepmees-package-5b` (when authorized)

Stable external IDs (Google Calendar event IDs, ClickUp task IDs, TickTick item IDs) are stored in the local external-sync map (`docs/project-control/external-sync-map.local.json`), which is gitignored and never committed. The example map (`external-sync-map.example.json`) is committed as documentation only.

---

## Dry-run / apply workflow

Every sync follows this sequence:

1. Run `/project-sync-dry-run` — produce the proposed delta in chat
2. Coordinator reviews the delta
3. Coordinator approves or rejects each proposed change
4. Run `/project-sync-apply` with only the approved changes
5. Log the result in `project-sync-log.md`

**Never apply without a reviewed dry-run.** Never apply more changes than the Coordinator approved.

---

## Scheduling model

### Recurring rituals (stable)

Recurring rituals (CEO Review, Planning Review, Development Review, etc.) are stable events. Their times, cadences, and purposes should not change without a deliberate decision. Changes to stable rituals require:

1. A decision entry in `decision-log.md`
2. An update to `calendar-spec.md`
3. A calendar sync dry-run and apply

### Dynamic milestones (can move)

Phase gate checkpoint dates, package authorization windows, and launch readiness dates can move earlier (if ahead) or later (if behind). Date shifts for dynamic milestones do not require a new decision log entry unless the shift is more than 30 days or indicates a fundamental scope change.

Dynamic milestone updates are proposed via `/project-sync-dry-run` and applied via `/project-sync-apply` (targeted Google Calendar edits — no full `.ics` reimport for date-only changes).

### Small tasks (stay out of calendar)

Sprint tasks, backlog items, and daily to-dos belong in ClickUp and TickTick, not Google Calendar. If it is a task, it is not a calendar event.

---

## ClickUp structure (approved)

ClickUp is organized around one primary Project Control Board. Do not create separate Lists for workflow lanes by default. Workflow slices (Current Sprint, Backlog, Review / QA, Waiting / Blocked, Done, Risks / Decisions) are saved views and filters inside the primary List.

| ClickUp layer | Value |
|---|---|
| Space | KeepMees |
| Folder | 00 Project Control |
| Primary List | 01 Project Control Board |
| Sync map | One `list_id` for the Board; one `external_id` per task |
| Saved views | Current Sprint, Backlog, Review / QA, Waiting / Blocked, Done, Risks / Decisions, and more |

Separate Lists are a future scaling option only, not the default. See `clickup-setup-policy.md` for the full approved structure and custom field definitions.

Live ClickUp API integration remains future and approval-gated. The current sync method is CSV import (`clickup-import.csv`) following the dry-run/apply workflow.

---

## External tool routing

| Content type | Primary tool | Secondary |
|---|---|---|
| Recurring weekly/monthly reviews | Google Calendar | — |
| Phase gate placeholders | Google Calendar | — |
| Launch readiness review | Google Calendar (low-confidence placeholder) | — |
| Full project execution board | ClickUp (01 Project Control Board) | — |
| Personal daily check-off list | TickTick | — |
| Project truth (decisions, roadmap, sprint) | Repo docs | — |
| Individual backlog items | ClickUp | Repo `backlog.md` |

---

## Import freshness

| Tool | When to reimport |
|---|---|
| Google Calendar | Only when stable ritual changes or new rituals added — not for every schedule shift. Targeted edits are preferred for date-only changes. |
| ClickUp | After major sprint transitions or significant backlog restructure. Export `clickup-import.csv` from repo and import. |
| TickTick | When the weekly checklist or recurring routines change. Export from `ticktick-import.csv` and `ticktick-recurring-routines.md`. |

Reimport does not replace manual user edits in external tools. Log reimports in `project-sync-log.md`.

---

## Non-destructive sync rules

1. Never delete an external event/task without Coordinator approval.
2. Never silently overwrite a user-edited external record.
3. When in doubt, propose and ask — do not apply unilaterally.
4. External sync always follows dry-run → approval → apply → log.
5. The log in `project-sync-log.md` is the record of every external change applied.

---

## Scripts (safe, dependency-free, read-only)

Two optional scripts support this policy. Both are read-only — no API calls, no external writes, no credentials:

| Script | What it does |
|---|---|
| `scripts/project-control-sync-dry-run.mjs` | **Structural integrity check only** — verifies required project-control files are present; does not check content freshness, dates, calendar accuracy, or external tool currency. Use `/project-sync-dry-run` for a full content-aware dry-run by Claude. |
| `scripts/project-control-sync-validate.mjs` | Validates that repo project-control docs are internally consistent (dates parseable, JSON valid, required files present) |

Both scripts exit non-zero only for clearly missing or malformed required fields. They report warnings separately from failures. They never connect to external systems.

---

## What this policy does NOT do

- It does not commit or push.
- It does not run Google Calendar, ClickUp, or TickTick API calls.
- It does not invent new project authority.
- It does not override the Coordinator's planning decisions.
