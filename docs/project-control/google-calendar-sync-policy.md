# Google Calendar Sync Policy

**Status:** ACTIVE (introduced in AI Project OS v1.6 Google Calendar Live Sync, Gate 1, 2026-05-30)
**Owner:** Coordinator / Project Control
**Companion docs:** `google-calendar-source-schema.md`, `google-calendar-source-records.json`, `google-calendar-sync-runbook.md`, `google-calendar-credentials.example.md`, `google-calendar-sync-log.md`, `external-sync-safety.md`, `calendar-sync-policy.md`
**Companion scripts:** `scripts/google-calendar-source-validate.mjs`, `scripts/google-calendar-sync-dry-run.mjs`, `scripts/google-calendar-sync-apply.mjs`, `scripts/generate-project-calendar.mjs`

---

## Overview

AI Project OS v1.6 establishes **real live sync** between repo source records and Google Calendar. The source of truth is `docs/project-control/google-calendar-source-records.json`. The `.ics` file is a fallback export artifact, not the primary sync path.

Live sync is a three-gate process. Gate 1 (this pass) is repo implementation only. Gate 2 is a read-only dry-run against live Google Calendar. Gate 3 is the approved apply.

---

## Source-of-truth hierarchy

| Priority | Source |
|---|---|
| 1 | `docs/project-control/google-calendar-source-records.json` (committed repo file) |
| 2 | `docs/project-control/google-calendar-sync-log.md` (record of applied changes) |
| 3 | `docs/project-control/external-sync-map.local.json` (local-only; contains actual event IDs) |
| 4 | Live Google Calendar (never authoritative; may diverge from repo truth) |

---

## What belongs in Google Calendar

| Content type | Include? |
|---|---|
| Recurring weekly review rituals | Yes |
| Monthly reviews (Roadmap Reset, Budget, Risk) | Yes |
| Phase gate checkpoint placeholders | Yes |
| Launch readiness review | Yes (as placeholder) |
| Individual sprint tasks or backlog items | No — use GitHub Issues or TickTick |
| Daily to-dos | No — use TickTick |
| Full project board state | No — use GitHub Projects |
| Project truth (decisions, roadmap) | No — stay in repo docs |

Rule: if it is a task, it is not a calendar event. Only reviews, rituals, gates, milestones, and closeouts go to Google Calendar.

---

## GitHub Project Calendar Relevant field relationship

- `calendar_relevant: true` in a GitHub Project source record means the item **may need** calendar representation. It does not automatically create a calendar event.
- `google-calendar-source-records.json` is the source of truth for actual calendar events.
- A GitHub Project item that is `calendar_relevant: true` may link to a calendar `os_id` in its body as a soft link.
- Calendar sync must not create events for every GitHub Project item — only rituals, reviews, gates, milestones, package reviews, closeouts, and roadmap resets.

---

## Gate model

### Gate 1 — Repo Implementation (current gate)

- Source records, schema, scripts, docs, skills/commands, audit checks committed.
- No live Google Calendar mutations.
- No credential files created or used.
- Scripts verified with `node --check` and local-only dry-run.
- v1.6 NOT complete after Gate 1.

### Gate 2 — Live Calendar Dry-Run

- Requires Coordinator to have Google Calendar API credentials configured locally.
- Requires separate Coordinator authorization.
- Run `google-calendar-sync-dry-run.mjs --live` against live Google Calendar (read-only API).
- Compare source records to live calendar; produce classified delta.
- Handle adoption of 2026-05-17 import events (see adoption rule below).
- No mutations.
- If credentials missing: record `GATE_2_BLOCKED: LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING`.
- v1.6 NOT complete after Gate 2.

### Gate 3 — Live Calendar Apply

- Requires separate Coordinator authorization and explicit "proceed with apply" instruction.
- Run `google-calendar-sync-apply.mjs --apply --approved-dry-run <path>`.
- Create and update events only (no delete/cancel by default).
- Write event IDs to `external-sync-map.local.json` (local only, never committed).
- Update `google-calendar-sync-log.md`.
- Delete/cancel requires additional `--delete` flag and separate per-item Coordinator approval.
- v1.6 complete when: live sync test succeeds, OR a documented credential/platform blocker is recorded.

---

## Adoption rule for 2026-05-17 imported events

The ten events imported from `keepmees-project-calendar.ics` on 2026-05-17 do not have `AI_OS_ID:` markers in their descriptions. Before Gate 2 can safely classify and proceed without risk of duplicates, one of these must be true:

1. The Coordinator has manually added `AI_OS_ID: <os_id>` to the description of each existing Google Calendar event, OR
2. The dry-run classifies them as `ADOPTION_REQUIRED` and the Coordinator approves an adoption plan before Gate 3, OR
3. The Coordinator explicitly approves creating new events despite the risk of temporary duplicates (and commits to removing old ones after Gate 3).

The dry-run will produce an adoption guide listing each event's expected `AI_OS_ID` value for manual addition.

**Adoption guide (for Coordinator):**

| Event title | Expected AI_OS_ID to add to description |
|---|---|
| KeepMees CEO Review | `AI_OS_ID: keepmees-ritual-ceo-review-weekly` |
| KeepMees Coordinator Planning Review | `AI_OS_ID: keepmees-ritual-coordinator-planning-weekly` |
| KeepMees Development Review | `AI_OS_ID: keepmees-ritual-dev-review-weekly` |
| KeepMees Product / Design Review | `AI_OS_ID: keepmees-ritual-product-design-review-weekly` |
| KeepMees Project Control Sync | `AI_OS_ID: keepmees-ritual-project-control-sync-weekly` |
| KeepMees Monthly Roadmap Reset | `AI_OS_ID: keepmees-ritual-monthly-roadmap-reset` |
| KeepMees Monthly Budget / Viability Review | `AI_OS_ID: keepmees-ritual-monthly-budget-review` |
| KeepMees Monthly Risk Review | `AI_OS_ID: keepmees-ritual-monthly-risk-review` |
| KeepMees Phase Gate Review | `AI_OS_ID: keepmees-milestone-phase-gate-review` |
| KeepMees Launch Readiness Review | `AI_OS_ID: keepmees-milestone-launch-readiness-review` |

Add the marker as a new line at the end of each event's description in Google Calendar UI.

---

## Duplicate prevention

Primary identity: `AI_OS_ID: <os_id>` substring in live event description.
Secondary identity: Google Calendar event ID in local sync map.
Fallback only: exact title + start date (classified as `POSSIBLE_MATCH`; never auto-accepted).

If two events share the same `AI_OS_ID` marker: classify as `DUPLICATE_DETECTED`; block apply until Coordinator resolves.

---

## Apply safety rules

- Dry-run before apply — always.
- Apply requires `--apply` flag AND `--approved-dry-run <artifact-path>`.
- Apply defaults to create/update only.
- Delete/cancel requires separate `--delete --os-id <id>` per item, separate Coordinator approval.
- Apply refuses to silently overwrite user-edited remote events (external drift detected → block + surface conflict).
- Apply writes event IDs only to `external-sync-map.local.json` (gitignored, never committed).
- Apply updates `google-calendar-sync-log.md` after successful operations.
- Apply never commits any file.

---

## .ics fallback role

After v1.6, the `.ics` file role is:
- **Committed as fallback/export artifact.** `docs/project-control/keepmees-project-calendar.ics` remains in the repo.
- **Not the primary live-sync path.** The Google Calendar API is the primary path.
- **Regenerated from source records** by `scripts/generate-project-calendar.mjs` when material event changes occur.
- **Stable UIDs** in the generated ICS use `<os_id>@keepmees.local` format for duplicate-safe reimport.
- **Manual delete-and-reimport is not the default update path.** Use the API-based dry-run/apply flow instead.

---

## Non-destructive sync rules

1. Never delete a calendar event without explicit per-item Coordinator approval.
2. Never silently overwrite a user-edited Google Calendar event.
3. Never claim live sync is complete without a successful Gate 3 apply or documented blocker.
4. External sync always follows: dry-run → approval → apply → log.
5. The log in `google-calendar-sync-log.md` is the record of every change applied.

---

## Relationship to calendar-sync-policy.md

`docs/project-control/calendar-sync-policy.md` is the legacy policy document introduced in v0.4.0. It describes the static `.ics`-based model and planned automation. After v1.6:

- `google-calendar-sync-policy.md` (this file) is the authoritative policy for live sync.
- `calendar-sync-policy.md` remains as a legacy document with a pointer to this file.
- `google-calendar-sync-log.md` is the canonical sync log for v1.6+ operations.
- `calendar-sync-log.md` remains as a legacy document for the 2026-05-17 initial import record.
