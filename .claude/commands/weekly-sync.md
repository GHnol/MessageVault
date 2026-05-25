This command delegates to the **weekly-sync** skill (`.claude/skills/weekly-sync/SKILL.md`). Approval boundaries unchanged: no commit, push, or external tool writes without Coordinator approval.

Run the KeepMees Coordinator weekly sync.

Read `docs/project-control/coordinator-weekly-sync.md` and follow the weekly process.

Then read:
- `docs/project-control/master-schedule.md`
- `docs/project-control/current-sprint.md`
- `docs/project-control/kanban-board.md`
- `CURRENT_STATE.md`

Then produce:
1. A proposed weekly log entry (date, what was reviewed, what changed)
2. Any sprint or schedule adjustments that are needed
3. Whether any calendar, ClickUp, or TickTick import files need regeneration
4. Any decisions that have been made and need to go into `decision-log.md`
5. Any risks that have changed and need to go into `risk-register.md`

Do not commit without explicit instruction.
Do not update external tools (ClickUp, TickTick, Google Calendar) — propose the changes first.

Full process: `docs/project-control/coordinator-weekly-sync.md`
Calendar sync policy: `docs/project-control/calendar-sync-policy.md`
