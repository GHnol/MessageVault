# Project Sync Dry-Run Format

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24)
**Owner:** Coordinator / Project Control
**Purpose:** Defines the exact output format for `/project-sync-dry-run` and `scripts/project-control-sync-dry-run.mjs`. Any agent or script producing a sync dry-run must follow this format so the Coordinator can review and approve the delta consistently.

---

## Format overview

A dry-run output has five sections:

1. Header (summary line)
2. Internal Doc Delta
3. External Tool Delta
4. Skip Rationale
5. Verdict and Footer

All five sections are required. Empty sections must still appear with "(none)" rather than being omitted.

---

## Section 1: Header

```
CALENDAR/SYNC DRY RUN — <date>
Source: <agent or script name>
Trigger: <what event triggered this dry-run>
Last sync: <date of last sync from project-sync-log.md, or "unknown">
```

---

## Section 2: Internal Doc Delta

Lists repo files that need updating. For each stale item:

```
FILE: <relative file path>
  FIELD: <field name or location in the file>
  CURRENT: <what it says now>
  SHOULD BE: <what it should say>
  WHY: <why this matters — misdirection risk or operational impact>
  CLASSIFICATION: operationally-misleading | minor-staleness | cosmetic
```

Items classified as `cosmetic` are listed here only if the script found them; they do not require action.

If no internal docs need updating: `(none — all internal docs current)`

---

## Section 3: External Tool Delta

Lists proposed changes to Google Calendar, ClickUp, and TickTick. For each proposed change:

```
TOOL: Google Calendar | ClickUp | TickTick
  ITEM ID: <stable internal ID, e.g. keepmees-ritual-ceo-review-weekly>
  ACTION: add | update | remove
  EXTERNAL ID: <known external ID from external-sync-map.local.json, or "unknown">
  CHANGE: <what to change — date, name, time, status, etc.>
  CLASSIFICATION: stable-recurring | dynamic-milestone | backlog-task | new-ritual
  METHOD: targeted-edit | ics-regeneration | csv-reimport | manual
  RISK: low | medium | high
  RATIONALE: <why this change is needed>
```

If no external changes are proposed: `(none — all external tools current)`

**Important:** External changes in this section are proposed only. Nothing is applied by the dry-run.

---

## Section 4: Skip Rationale

Lists items that were examined but determined to be cosmetically stale or operationally not needed:

```
ITEM: <what was examined>
  STATUS: cosmetic-lag | within-tolerance | no-external-impact
  REASON: <why it was skipped>
```

If nothing was skipped: `(none — all examined items classified above)`

---

## Section 5: Verdict and Footer

```
VERDICT: DRIFT FOUND | NO DRIFT

<if DRIFT FOUND>
  Internal doc changes needed: <count>
  External tool changes proposed: <count>
  Recommended action: Run /project-sync-apply after Coordinator approval.

<if NO DRIFT>
  State is current. No action needed.

---

No external sync was performed. No files were modified by this dry-run.
Approval required before running /project-sync-apply.
```

---

## Classification guide for agents

### operationally-misleading (always edit)
- Active package still shows "in progress" after merge
- Branch name in AI_HANDOFF.md no longer exists
- Sprint task still "In Progress" after package close
- Kanban card in wrong column post-package
- Risk register missing a new blocker
- Next-action pointer in NEXT_SESSION_PROMPT.md is no longer accurate

### minor-staleness (edit during weekly sync)
- Shareable status summary is > 1 week stale after a major phase change
- Calendar event date is off by > 1 week
- ClickUp board is significantly behind the current kanban state

### cosmetic (skip)
- HEAD hash lags by one commit, all other fields accurate
- Timestamp is a few hours stale, all operational fields accurate
- A doc uses "after this commit lands" phrasing
- Calendar event date is off by < 1 week with no milestone significance

---

## Example dry-run output (abbreviated)

```
CALENDAR/SYNC DRY RUN — 2026-05-24
Source: project-sync-dry-run skill
Trigger: Package 5A complete — AI Project OS Framework Groundwork Pass starting
Last sync: 2026-05-24 (Package 5A closeout)

INTERNAL DOC DELTA
  FILE: docs/project-control/current-sprint.md
    FIELD: Sprint tasks → Package 5A status
    CURRENT: "Waiting / Blocked — blocked by Tower merge"
    SHOULD BE: "Done — Package 5A merged to main (297a221)"
    WHY: Sprint still shows Package 5A as blocked; it is complete
    CLASSIFICATION: operationally-misleading

  FILE: docs/project-control/kanban-board.md
    FIELD: Waiting / Blocked → Package 5A card
    CURRENT: "Package 5A — Proof Approval State Foundation · paused"
    SHOULD BE: Moved to Done column
    WHY: Package 5A is complete and merged
    CLASSIFICATION: operationally-misleading

EXTERNAL TOOL DELTA
  (none — no calendar, ClickUp, or TickTick changes proposed at this time)

SKIP RATIONALE
  ITEM: CURRENT_STATE.md main HEAD field
    STATUS: cosmetic-lag
    REASON: HEAD lags by one commit (926ec37 vs cb920be); all other fields accurate; preflight git log is the corrective control

VERDICT: DRIFT FOUND
  Internal doc changes needed: 2
  External tool changes proposed: 0
  Recommended action: Run /project-sync-apply after Coordinator approval.

---
No external sync was performed. No files were modified by this dry-run.
Approval required before running /project-sync-apply.
```
