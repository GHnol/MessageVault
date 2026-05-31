## Purpose

Walk the Google Calendar live sync workflow — validate source records, run local or live dry-run, and (after Gate 3 authorization) apply to Google Calendar.

## Delegates to

`.claude/skills/google-calendar-sync/SKILL.md` — canonical protocol.

## Approval boundaries

- Does not commit, push, or merge.
- Does not create, update, or delete calendar events without explicit Gate 3 Coordinator authorization.
- Does not skip the dry-run step.
- Does not start Package 5B.
- Scope guards remain in force.

## Backed by

- `docs/project-control/google-calendar-sync-policy.md`
- `docs/project-control/google-calendar-sync-runbook.md`
- `docs/project-control/external-sync-safety.md`
