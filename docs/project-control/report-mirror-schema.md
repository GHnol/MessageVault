# Report Mirror Schema — AI Project OS v1.7 Gate 3

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 3 — Report Mirroring and Project-Control Log Intake, 2026-06-01)
**Companion to:** `docs/project-control/report-mirror-policy.md`, `docs/project-control/report-mirror-log.md`, `scripts/report-mirror-intake.mjs`

---

## Purpose

This schema defines the fields for a committed mirror entry in `report-mirror-log.md`. Mirror entries are sanitized summaries, not raw transcript dumps.

---

## Field definitions

| Field | Type | Required | Description |
|---|---|---|---|
| `report_id` | string | Required | Unique identifier. Format: `RPT-YYYYMMDD-NNN` where NNN is a three-digit sequence per day. |
| `report_type` | enum | Required | Classification of the report. See report type values below. |
| `source_type` | enum | Required | How the input arrived. See source type values below. |
| `source_path` | string | Optional | Local-only file path if applicable. Never committed. Noted as `[local — not committed]` in log. |
| `created_at` | ISO 8601 | Required | When the mirror entry was created. UTC. |
| `workstream` | string | Optional | Which workstream this report covers: `ai-workflow`, `coordinator`, `development`, `qa`, `external-sync`. |
| `package_or_gate` | string | Optional | Package or gate name: e.g., `Package 5A`, `v1.7 Gate 3`, `Advisory Repair`. |
| `branch` | string | Optional | Branch the work was on. |
| `head` | string | Optional | Short HEAD hash (7 chars) at the time of the report. |
| `commits` | string[] | Optional | Relevant commit hashes (short form). |
| `files_changed` | string | Optional | Summary: e.g., `12 files changed`. Not a full file list in the committed entry. |
| `tests_run` | string | Optional | Summary: e.g., `node --check all scripts: PASS`, `os-self-audit: 192 pass, 0 fail`. |
| `validators_run` | string[] | Optional | Which validators were run and their verdicts. |
| `external_operations` | string | Optional | Summary of any external system operations. No raw event IDs. No credential contents. |
| `local_private_files_status` | string | Optional | Confirms private files are gitignored and not staged. |
| `hard_exclusions_confirmed` | boolean | Optional | Whether the hard exclusion list was verified clean. |
| `decisions` | string[] | Optional | Key decisions made during this work unit. |
| `blockers` | string[] | Optional | Current blockers or newly discovered blockers. |
| `risks` | string[] | Optional | Notable risks. |
| `next_action` | string | Optional | Exact next action for the incoming session. |
| `package_5b_status` | string | Optional | State of Package 5B at time of report. |
| `sanitized_summary` | string | Required | Free-text sanitized summary. Must not contain token-like or credential-like strings. |
| `redaction_notes` | string | Optional | What was redacted and why, without including the redacted values. |
| `mirror_status` | enum | Required | One of: `draft`, `mirrored`, `skipped`, `rejected`. |
| `skip_reason` | string | Conditional | Required when `mirror_status` is `skipped`. |
| `follow_up_required` | boolean | Required | Whether a follow-up is needed. |
| `follow_up_items` | string[] | Conditional | Required when `follow_up_required` is true. |

---

## Report type values

| Value | When to use |
|---|---|
| `package_closeout` | Package complete, paused, or blocked. Includes OS gate closeouts. |
| `commit_closeout` | Commit created. Includes state-sync commits. |
| `merge_closeout` | Branch merged to main. |
| `status_sync` | Sprint, kanban, or project-control state updated. |
| `external_sync` | Google Calendar, GitHub Projects, ClickUp, or TickTick operation (dry-run or apply). |
| `planning` | New gate authorized, major planning change, backlog re-ranking, Coordinator decision. |
| `handoff` | Branch handoff between Claude and Codex; tool switch. |
| `incident` | Advisory or blocker discovered, investigated, or resolved. |
| `audit` | OS self-audit run. State freshness check run with a new verdict. |
| `decision` | Standalone decision record — Coordinator decision not otherwise captured in a closeout. |

---

## Source type values

| Value | When to use |
|---|---|
| `manual_paste` | User or agent pasted content into stdin or a local ignored file. No stable transcript export. |
| `local_file` | Input was a local file (ignored path). Script read it via `--input`. |
| `generated_script_output` | Input was piped from a script output. |
| `future_hook_capture` | Reserved for future automatic hook-based capture. Not implemented in Gate 3. |

---

## Mirror status values

| Value | Meaning |
|---|---|
| `draft` | Entry is prepared but not yet appended to the committed log. |
| `mirrored` | Sanitized entry has been appended to `report-mirror-log.md`. |
| `skipped` | Entry was evaluated; no committed log entry is needed (see `skip_reason`). |
| `rejected` | Entry was rejected due to secret-risk or schema failure. Must be sanitized before resubmission. |

---

## Format in report-mirror-log.md

Committed mirror entries in `report-mirror-log.md` use a compact human-readable format, not raw JSON. Each entry is a Markdown section:

```markdown
### RPT-YYYYMMDD-NNN — <report_type> — <package_or_gate>

**Created:** <created_at> | **Branch:** <branch> | **HEAD:** <head> | **Status:** <mirror_status>

<sanitized_summary>

**Tests/validators:** <tests_run>
**External operations:** <external_operations> | **Hard exclusions:** <hard_exclusions_confirmed>
**Next action:** <next_action>
**Package 5B:** <package_5b_status>
**Follow-up:** <follow_up_required> — <follow_up_items>
```

Fields that are empty or not applicable are omitted. Redaction notes appear below the summary if any redaction occurred.

---

## What the committed entry must not contain

- OAuth tokens or API credentials of any kind
- Contents of `.local.json` credential or token files
- Full file listing (summary only)
- Raw git diff output
- Personal filesystem paths beyond repo-relative paths
- Raw session or transcript exports
- Exact content from `local-sync-reports/` or `local-report-intake/` artifacts

---

## Example entry (fake data)

```markdown
### RPT-20260601-001 — package_closeout — v1.7 Gate 3

**Created:** 2026-06-01T00:00:00Z | **Branch:** docs/ai-project-os-v1-7-report-mirroring-intake | **HEAD:** abc1234 | **Status:** mirrored

Gate 3 implementation complete. Added report mirror policy, schema, log, runbook, intake script, and skill. Updated closeout/handoff/precommit/start/weekly-sync skills. OS self-audit updated to 192 pass.

**Tests/validators:** node --check all scripts: PASS; os-self-audit: 192 pass, 0 warn, 0 fail
**External operations:** none | **Hard exclusions:** confirmed
**Next action:** Coordinator reviews Gate 3 implementation report; if approved, commit and merge Gate 3
**Package 5B:** not started — blocked
**Follow-up:** false
```
