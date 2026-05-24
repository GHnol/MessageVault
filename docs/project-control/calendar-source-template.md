# KeepMees Calendar Source Template

**Status:** ACTIVE (introduced in AI Project OS Usability Patch, 2026-05-24)
**Owner:** Coordinator / Project Control
**Purpose:** Repo-native format for describing calendar events before generating or updating the `.ics`. This keeps the calendar spec human-readable and diff-friendly even when the `.ics` binary format is not.

Use this template when proposing a new calendar event or documenting a change to an existing one. Entries here feed `calendar-sync-log.md` and eventually `keepmees-project-calendar.ics` when regeneration is needed.

---

## Template: single event

```
## <Event name>

- **Type:** recurring | one-time | milestone-placeholder
- **Cadence:** weekly / monthly / as-needed / dated
- **Day/time:** <day>, <HH:MM> ET
- **Duration:** <N>m
- **Purpose:** <one sentence — what decision or review happens here>
- **Agenda:** <bullet list of agenda topics>
- **Source doc to review before:** `<doc path>`
- **Output / update after:** <what should change after this event>
- **UID:** <stable unique ID if regenerating the .ics — format: keepmees-<slug>>
- **Status:** active | paused | proposed | removed
- **Last modified:** <YYYY-MM-DD>
- **Notes:** <anything unusual about this event>
```

---

## Current event catalog

### KeepMees CEO Review

- **Type:** recurring
- **Cadence:** weekly
- **Day/time:** Sunday, 19:00 ET
- **Duration:** 60m
- **Purpose:** Founder-level direction and capacity check
- **Agenda:** Review CURRENT_STATE.md; check sprint scope; capacity note; authorize or hold next actions
- **Source doc to review before:** `CURRENT_STATE.md`, `docs/project-control/current-sprint.md`
- **Output / update after:** Sprint scope adjustment; any capacity note
- **UID:** keepmees-ceo-review-weekly
- **Status:** active
- **Last modified:** 2026-05-17

---

### Coordinator Planning Review

- **Type:** recurring
- **Cadence:** weekly
- **Day/time:** Monday, 19:30 ET
- **Duration:** 60m
- **Purpose:** Plan the week and confirm priorities
- **Agenda:** Review next-7-days.md and backlog; confirm sprint tasks; check blockers
- **Source doc to review before:** `docs/project-control/next-7-days.md`, `docs/project-control/backlog.md`
- **Output / update after:** Updated `docs/project-control/current-sprint.md`
- **UID:** keepmees-coordinator-planning-weekly
- **Status:** active
- **Last modified:** 2026-05-17

---

### Development Review

- **Type:** recurring
- **Cadence:** weekly
- **Day/time:** Wednesday, 19:30 ET
- **Duration:** 45m
- **Purpose:** Dev progress, test baseline, package status
- **Agenda:** Review kanban-board.md; E2E status; any in-progress package; test count
- **Source doc to review before:** `docs/project-control/kanban-board.md`, `CURRENT_STATE.md`
- **Output / update after:** Updated Kanban board
- **UID:** keepmees-dev-review-weekly
- **Status:** active
- **Last modified:** 2026-05-17

---

### Product / Design Review

- **Type:** recurring
- **Cadence:** weekly
- **Day/time:** Thursday, 19:30 ET
- **Duration:** 45m
- **Purpose:** Product truth, preview fidelity, design status
- **Agenda:** Review decision-log.md; fidelity risks; design contractor status
- **Source doc to review before:** `docs/project-control/decision-log.md`
- **Output / update after:** New decisions or risks noted
- **UID:** keepmees-product-design-review-weekly
- **Status:** active
- **Last modified:** 2026-05-17

---

### Project Control Sync

- **Type:** recurring
- **Cadence:** weekly
- **Day/time:** Friday, 19:30 ET
- **Duration:** 45m
- **Purpose:** Reconcile all Tower layers and keep docs current
- **Agenda:** Run coordinator-weekly-sync.md process
- **Source doc to review before:** `docs/project-control/` (full Tower)
- **Output / update after:** Updated weekly log in coordinator-weekly-sync.md
- **UID:** keepmees-project-control-sync-weekly
- **Status:** active
- **Last modified:** 2026-05-17

---

### Monthly Roadmap Reset

- **Type:** recurring
- **Cadence:** monthly (1st Sunday)
- **Day/time:** 1st Sunday of month, 17:00 ET
- **Duration:** 90m
- **Purpose:** Re-baseline roadmap and schedule
- **Agenda:** Review master-roadmap.md and master-schedule.md; adjust dates and confidence; re-rank backlog
- **Source doc to review before:** `docs/project-control/master-roadmap.md`, `docs/project-control/master-schedule.md`
- **Output / update after:** Updated roadmap and schedule
- **UID:** keepmees-monthly-roadmap-reset
- **Status:** active
- **Last modified:** 2026-05-17

---

### Monthly Budget / Viability Review

- **Type:** recurring
- **Cadence:** monthly (1st Sunday)
- **Day/time:** 1st Sunday of month, 18:45 ET
- **Duration:** 45m
- **Purpose:** Budget, designer gap, project viability check
- **Agenda:** Finance lane review; risk-register.md R-BUD-1; designer decision status
- **Source doc to review before:** `docs/project-control/risk-register.md`
- **Output / update after:** Budget decision note; designer decision update
- **UID:** keepmees-monthly-budget-review
- **Status:** active
- **Last modified:** 2026-05-17

---

### Monthly Risk Review

- **Type:** recurring
- **Cadence:** monthly (2nd Sunday)
- **Day/time:** 2nd Sunday of month, 17:00 ET
- **Duration:** 60m
- **Purpose:** Full risk register pass
- **Agenda:** Walk all 15 risk categories in risk-register.md; update statuses; flag new risks
- **Source doc to review before:** `docs/project-control/risk-register.md`
- **Output / update after:** Updated risk statuses
- **UID:** keepmees-monthly-risk-review
- **Status:** active
- **Last modified:** 2026-05-17

---

### Phase Gate Review (placeholder)

- **Type:** milestone-placeholder
- **Cadence:** as-needed (at each phase gate crossing)
- **Day/time:** to be scheduled when a gate is approaching
- **Duration:** 60m
- **Purpose:** Verify a phase gate before crossing it
- **Agenda:** Walk phase-gates.md for the gate in question; go/no-go decision
- **Source doc to review before:** `docs/project-control/phase-gates.md`
- **Output / update after:** Gate pass or fail recorded
- **UID:** keepmees-phase-gate-review
- **Status:** active (placeholder)
- **Last modified:** 2026-05-17

---

### Launch Readiness Review (placeholder)

- **Type:** milestone-placeholder
- **Cadence:** one-time (when launch is approaching)
- **Day/time:** low-confidence placeholder — date TBD
- **Duration:** 90m
- **Purpose:** Pre-launch go/no-go review
- **Agenda:** Walk docs/qa/release-readiness-template.md
- **Source doc to review before:** `docs/qa/release-readiness-template.md`
- **Output / update after:** Launch decision
- **UID:** keepmees-launch-readiness-review
- **Status:** active (placeholder)
- **Last modified:** 2026-05-17

---

## How to add a new event

1. Copy the template block above
2. Fill in all fields
3. Assign a stable UID (`keepmees-<slug>`)
4. Update `calendar-spec.md` if the new event changes the recurring cadence
5. Log the addition in `calendar-sync-log.md`
6. Propose the delta via `/calendar-sync-plan` before applying to Google Calendar
