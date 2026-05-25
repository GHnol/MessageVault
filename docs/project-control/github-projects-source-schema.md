# GitHub Projects Source Schema

**Status:** ACTIVE (introduced in AI Project OS v1.3 External Board Provider Update, 2026-05-25)
**Owner:** Coordinator / Project Control
**Purpose:** Defines the repo-native source model for generating GitHub Issues and GitHub Project rows. Agents and scripts use this schema when generating dry-run output or creating import records.
**Companion docs:** `github-projects-setup-policy.md`, `github-projects-import-runbook.md`, `project-sync-source-schema.md`

---

## Source record fields

A GitHub Projects source record contains the following fields:

| Field | Required | Description |
|---|---|---|
| `os_id` | Yes | Stable internal ID (`keepmees-<category>-<slug>`) — never changes once assigned |
| `title` | Yes | GitHub Issue title — concise, action-oriented |
| `body` | Yes | GitHub Issue body — full description, context, acceptance criteria |
| `type` | Yes | Item type: `ritual`, `milestone`, `package`, `sprint`, `task`, `decision`, `risk` |
| `package` | No | Package this item belongs to (e.g. `Package 5A`) |
| `phase` | No | Project phase number (0–15) |
| `lane` | No | Execution lane — matches `backlog.md` lane names |
| `status` | Yes | Current status from approved status set |
| `priority` | No | `P0`, `P1`, `P2`, `P3` |
| `risk_level` | No | `Low`, `Medium`, `High` |
| `decision_needed` | No | `true` or `false` |
| `calendar_relevant` | No | `true` or `false` |
| `ticktick_relevant` | No | `true` or `false` |
| `owner_role` | No | Role from allowed Owner Role set |
| `source_file` | Yes | Relative path to the canonical repo doc that defines this item |
| `success_criteria` | No | What "done" looks like |
| `dependencies` | No | List of `os_id` values this item depends on |
| `labels` | No | GitHub Issue labels to apply (e.g. `task`, `package`, `gate`, `risk`, `decision`) |
| `milestone` | No | GitHub Milestone name or number to associate the issue with |
| `external_id` | No | ClickUp task ID (if also tracked in ClickUp); stored in local sync map only |
| `project_item_id` | No | GitHub Project item node ID — stored in local sync map only after import |
| `issue_number` | No | GitHub Issue number — stored in local sync map only after creation |
| `issue_url` | No | GitHub Issue URL — stored in local sync map only after creation |
| `last_repo_sync` | No | ISO 8601 date of last sync from repo docs to external tool |
| `external_sync_status` | No | `in-sync`, `drift`, `unknown`, `not-tracked` |

---

## Field routing: where each field goes

### GitHub Issue title and body

| Source field | GitHub Issue destination |
|---|---|
| `title` | Issue title |
| `body` | Issue body (markdown) |
| `os_id` | Embedded in body as metadata block |
| `type` | Embedded in body |
| `source_file` | Embedded in body |
| `success_criteria` | Section in body |
| `dependencies` | Section in body (as linked issues where possible) |

### GitHub Issue labels

| Source field | GitHub Issue label |
|---|---|
| `type` | Label matching type value (e.g. `task`, `package`, `gate`, `risk`, `decision`) |
| `labels` | Additional labels as specified in source record |
| `risk_level = High` | Label `risk-high` |
| `decision_needed = true` | Label `decision-needed` |
| `calendar_relevant = true` | Label `calendar` |

### GitHub Milestone

| Source field | GitHub Milestone |
|---|---|
| `milestone` | Milestone name or number (must exist before import) |
| `package` | If milestone = package name |

### GitHub Project custom fields

| Source field | GitHub Project custom field |
|---|---|
| `os_id` | OS ID |
| `package` | Package |
| `phase` | Phase |
| `lane` | Lane |
| `source_file` | Source File |
| `last_repo_sync` | Last Repo Sync |
| `external_sync_status` | External Sync Status |
| `risk_level` | Risk Level |
| `decision_needed` | Decision Needed |
| `calendar_relevant` | Calendar Relevant |
| `ticktick_relevant` | TickTick Relevant |
| `owner_role` | Owner Role |
| `success_criteria` | Success Criteria |

### Local sync map only (never committed)

| Source field | Stored in |
|---|---|
| `project_item_id` | `external-sync-map.local.json` → `github_projects[os_id].project_item_id` |
| `issue_number` | `external-sync-map.local.json` → `github_projects[os_id].issue_number` |
| `issue_url` | `external-sync-map.local.json` → `github_projects[os_id].issue_url` |
| `external_id` (ClickUp) | `external-sync-map.local.json` → `clickup[os_id].external_id` |

---

## Source record example (YAML)

```yaml
os_id: keepmees-task-proof-approval-state
title: "Package 5A: Message Book Proof Approval State Foundation"
body: |
  Implement the proof approval state model for the Message Book product.

  ## Context
  This package adds `proof-approval-state.js` — state model only; no UI wiring.

  ## Success Criteria
  - `src/state/proof-approval-state.js` exists and exports the state model
  - 1603 Node unit tests pass
  - No UI changes

  ## OS ID
  `keepmees-task-proof-approval-state`

  ## Source
  `docs/project-control/backlog.md`
type: package
package: Package 5A
phase: 5
lane: Development
status: Done
priority: P1
risk_level: Low
decision_needed: false
calendar_relevant: false
ticktick_relevant: false
owner_role: Claude
source_file: docs/project-control/backlog.md
success_criteria: "proof-approval-state.js exists; 1603 tests pass; no UI changes"
labels:
  - package
  - done
milestone: ""
```

---

## ID stability rule

A stable `os_id` must never change once assigned, even if:
- The item is renamed
- The date shifts
- The status changes
- The item is moved between tools

If an item is killed or removed, its `os_id` is retired (kept in the local sync map with `status: removed`) so it is never reused.

---

## Schema validation

The source schema is validated by source records in repo docs (backlog, sprint, roadmap). Future script (`scripts/github-project-sync-status.mjs`) will compare local source records to the local sync map if present.

Source records are read-only from the script perspective. Scripts generate import output from source records — they never write back to source files.
