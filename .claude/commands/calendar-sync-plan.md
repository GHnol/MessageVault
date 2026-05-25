This command routes through the **project-sync-dry-run** skill (`.claude/skills/project-sync-dry-run/SKILL.md`) for calendar-specific sync checks, and the **calendar-sync-policy** (`docs/project-control/calendar-sync-policy.md`) for rules. No live API sync. Approval boundaries unchanged: no Google Calendar writes, no `.ics` delete/reimport without Coordinator approval.

Review the KeepMees calendar sync state and propose a delta if needed.

Read in order:
1. `docs/project-control/calendar-sync-policy.md`
2. `docs/project-control/calendar-source-template.md`
3. `docs/project-control/calendar-sync-log.md`
4. `docs/project-control/calendar-spec.md`
5. `docs/project-control/master-schedule.md`

Then:
1. Identify what has changed in the project schedule since the last calendar sync
2. Classify each change: stable recurring ritual vs dynamic milestone
3. Propose the delta (events to add, update, or remove) as a dry-run description — no changes yet
4. Flag any recurring rituals that may have drifted from their spec
5. State whether `.ics` regeneration is needed and what would change

Output format:
> **CALENDAR DELTA (DRY RUN)**
> Last sync: … | Events to add: … | Events to update: … | Events to remove: … | Recurring rituals: stable/needs-review | .ics regen needed: yes/no

Hard stops:
- Do not implement Google Calendar API calls
- Do not delete or reimport the full calendar — propose targeted delta only
- Do not commit calendar changes without explicit Coordinator approval
- Do not add small tasks to the calendar — those belong in TickTick/ClickUp

Full policy: `docs/project-control/calendar-sync-policy.md`
