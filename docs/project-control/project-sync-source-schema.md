# Project Sync Source Schema

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24)
**Owner:** Coordinator / Project Control
**Purpose:** Defines the schema for project-control sync items. Agents and scripts use this schema when reading repo docs to generate a dry-run delta or validate internal consistency.

---

## Item types

Every sync item belongs to one of these types:

| Type | Description | External tool targets |
|---|---|---|
| `ritual` | Recurring meeting or review cadence | Google Calendar (stable, recurring event) |
| `milestone` | Phase gate checkpoint or major delivery date | Google Calendar (dynamic, date-based event) |
| `package` | An authorized development package | ClickUp (task/card) |
| `sprint` | A sprint (1–2 week work window) | ClickUp (sprint column) |
| `task` | An individual backlog or sprint task | ClickUp, TickTick |
| `decision` | A locked or open project decision | Decision log only (not external by default) |
| `risk` | A project risk entry | Risk register only (not external by default) |

---

## Required fields per item type

### ritual

```yaml
id: keepmees-ritual-<slug>          # stable — never changes
name: <human name>
type: ritual
cadence: weekly | monthly | as-needed
day: <day of week or "1st Sunday">
time: <HH:MM ET>
duration_minutes: <integer>
purpose: <one sentence>
status: active | paused | proposed | removed
last_modified: <YYYY-MM-DD>
source_doc: <relative path to canonical doc>
```

### milestone

```yaml
id: keepmees-milestone-<slug>       # stable — never changes
name: <human name>
type: milestone
date: <YYYY-MM-DD>                  # approximate or TBD
confidence: high | medium | low | tbd
purpose: <one sentence>
status: future | approaching | passed | removed
last_modified: <YYYY-MM-DD>
source_doc: <relative path to canonical doc>
```

### package

```yaml
id: keepmees-package-<slug>         # stable — never changes
name: <human name, e.g. Package 5A>
type: package
status: authorized | in-progress | complete | paused | blocked | deferred
branch: <branch name or "none">
merge_commit: <hash or "pending" or "none">
completed_date: <YYYY-MM-DD or "">
source_doc: <relative path to canonical doc>
```

### task

```yaml
id: keepmees-task-<slug>            # stable — never changes
name: <human name>
type: task
lane: <lane name from backlog.md>
priority: P0 | P1 | P2 | P3
status: backlog | ready | in-progress | blocked | done | deferred | killed
phase: <phase number>
owner: <role or name>
source_doc: <relative path to canonical doc>
```

---

## External ID map

Stable external IDs (Google Calendar event IDs, ClickUp task IDs, TickTick item IDs) are stored in the local external-sync map. This file is gitignored — it lives only on each contributor's machine:

**Gitignored (never committed):** `docs/project-control/external-sync-map.local.json`

**Committed as example only:** `docs/project-control/external-sync-map.example.json`

See `external-sync-map.example.json` for the format.

---

## ID stability rule

A stable ID must never change once assigned, even if:
- The item is renamed
- The date shifts
- The status changes
- The item is moved to a different tool

IDs are assigned when an item is first created. If an item is split into two items, the original ID stays with the primary successor; a new ID is assigned to the split.

If an item is killed or removed, its ID is retired (kept in the external-sync map with `status: removed`) so it is never reused.

---

## Schema validation

Run `scripts/project-control-sync-validate.mjs` to check that the canonical docs are internally consistent:
- All IDs are unique
- All required fields are present
- Dates are parseable
- Status values are from the allowed set
- Referenced source docs exist

The validator is read-only and does not connect to external systems.
