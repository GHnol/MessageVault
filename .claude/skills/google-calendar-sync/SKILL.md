---
name: google-calendar-sync
description: Run Google Calendar live sync — validate source records, run local or live dry-run, and (after Gate 3 authorization) apply creates/updates to Google Calendar.
---

## Purpose

This skill governs all Google Calendar sync operations for the AI Project OS v1.6 Google Calendar Live Sync layer. It routes the agent through the correct gate (Gate 1, Gate 2, or Gate 3) based on current authorization and credential status.

## When to use

- To validate source records before any gate
- To run the local dry-run (Gate 1 verification, no credentials needed)
- To run the live dry-run against Google Calendar (Gate 2, requires authorization + credentials)
- To apply creates/updates to Google Calendar (Gate 3, requires explicit Coordinator "proceed with apply" instruction)
- To regenerate the committed .ics fallback from source records
- When auditing credential safety or gitignore protections

**Invocation type:** User-invoked. The user types `/google-calendar-sync`; Claude routes to this skill. Nothing runs automatically.

## Files to read (always)

1. `docs/project-control/google-calendar-sync-policy.md`
2. `docs/project-control/google-calendar-source-records.json`
3. `docs/project-control/google-calendar-sync-log.md`
4. `docs/project-control/external-sync-map.example.json` (schema reference only)

## Files to read (as needed)

- `docs/project-control/google-calendar-source-schema.md` — field definitions
- `docs/project-control/google-calendar-sync-runbook.md` — step-by-step gate procedures
- `docs/project-control/google-calendar-credentials.example.md` — credential setup guide
- `docs/project-control/external-sync-safety.md` — non-negotiable safety rules

## Gate model

### Gate 1 — Repo Implementation (no credentials needed)

- Validate source records: `node scripts/google-calendar-source-validate.mjs`
- Run local dry-run: `node scripts/google-calendar-sync-dry-run.mjs --local-only`
- Regenerate .ics: `node scripts/generate-project-calendar.mjs`
- Verify audit passes: `node scripts/os-self-audit.mjs`
- **No Google Calendar API calls. No credentials. No external mutations.**

### Gate 2 — Live Dry-Run (read-only Google Calendar comparison)

- Requires separate Coordinator authorization.
- Requires Google Calendar API credentials locally (`google-calendar-credentials.json`, `token.json`).
- Requires `googleapis` npm package in `scripts/node_modules/`.
- Run: `node scripts/google-calendar-sync-dry-run.mjs --live`
- Save artifact to `local-sync-reports/google-calendar-dry-run-<timestamp>.json`.
- **No calendar mutations.**

### Gate 3 — Live Apply (creates and updates only)

- Requires separate Coordinator "proceed with apply" instruction.
- Requires Gate 2 dry-run artifact with no unresolved DUPLICATE_DETECTED or ADOPTION_REQUIRED items.
- Run: `node scripts/google-calendar-sync-apply.mjs --apply --confirm-live-calendar-apply --approved-dry-run <path>`
- The `--confirm-live-calendar-apply` flag is the runtime Gate 3 confirmation. No source code editing required.
- Apply defaults to create/update only.
- **Delete/cancel requires separate per-item authorization (see below).**

## Dry-run-first requirement

Never run apply without a previously completed and Coordinator-reviewed dry-run.

If the dry-run artifact is missing or stale (more than 24 hours old), re-run the dry-run before proceeding.

## Create/update default apply behavior

The apply script defaults to create/update only:
- `CREATE`: creates new event; writes event ID to local sync map.
- `UPDATE`: updates existing event using event ID from local sync map.
- Refuses to proceed if `DUPLICATE_DETECTED` or `ADOPTION_REQUIRED` items exist and are unresolved.

## Delete/cancel separate approval requirement

Delete and cancel are NOT part of the default apply run. Each deletion requires:

1. A `DELETE_CANCEL_CANDIDATE` classification in the dry-run artifact.
2. Coordinator approves the deletion explicitly, per item.
3. Run with: `--apply --approved-dry-run <path> --delete --os-id <id>`

Never batch-delete. Each item is a separate command invocation with a separate Coordinator approval.

## external-sync-map.local.json local-only rule

- The local sync map (`docs/project-control/external-sync-map.local.json`) is gitignored and never committed.
- Gate 1: do not read or write the local sync map.
- Gate 2: read-only if present (to check known event IDs).
- Gate 3: write event IDs after successful creation/update.
- The apply script verifies the map is gitignored before any write.

## Credential safety

- Never commit credentials.
- Never print tokens.
- Verify gitignore before apply: `git check-ignore -v token.json`
- If credentials are missing: record `LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING` in sync log; do not fail Gate 1.

## Output format

Structured output for all scripts, designed for v1.7 automatic mirroring:

```
GOOGLE CALENDAR <OPERATION> — <MODE> — <DATE>
Source: <script>
[Classified results per os_id]
SUMMARY: create N | update N | no-op N | flag N
VERDICT: PASS | FAIL | BLOCKED
---
No external sync was performed.
```

## Hard stop conditions

Stop and ask the Coordinator before taking any action if:

- `AI_HANDOFF.md` is missing or the handoff branch and current branch disagree
- Gate 2 or Gate 3 authorization is not confirmed in the current session
- Dry-run artifact is missing but `--apply` was requested
- `DUPLICATE_DETECTED` or `ADOPTION_REQUIRED` items exist in the artifact
- `token.json` is not gitignored
- `external-sync-map.local.json` is not gitignored
- Any file that should not be touched (index.html, src/**, etc.) would be affected

## Approval boundaries

- Does not commit, push, or merge.
- Does not create, update, or delete calendar events without `--apply` and explicit authorization.
- Does not start Package 5B.
- Does not implement v1.7 automation.
- All external changes require dry-run → approval → apply → log.

## Backed by

- `docs/project-control/google-calendar-sync-policy.md`
- `docs/project-control/google-calendar-sync-runbook.md`
- `docs/project-control/external-sync-safety.md`
- `docs/ai-system/universal-standards.md` (closeout sync rule, Post-Commit State Rule)
