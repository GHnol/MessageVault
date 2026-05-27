# GitHub Projects Setup Policy

**Status:** ACTIVE (introduced in AI Project OS v1.3 External Board Provider Update, 2026-05-25; Status vocabulary updated to v1.5 canonical in 2026-05-26)
**Owner:** Coordinator / Project Control
**Companion docs:** `github-projects-source-schema.md`, `github-projects-import-runbook.md`, `github-projects-field-map.example.json`, `github-projects-sync-log.md`, `external-platform-mapping-guide.md`, `external-sync-safety.md`, `clickup-setup-policy.md`, `github-projects-template-standard.md`, `github-projects-template-copy-runbook.md`

---

## Default external board provider

**GitHub Projects is the default external board provider for KeepMees and future AI Project OS repos.**

GitHub Projects is the default because:

- It is repo-native — no separate workspace, no separate account required.
- It is git-native — issues, commits, and branches link directly.
- It is issue-native — GitHub Issues are the external task records.
- It is the best-fit tool for Claude/Codex development workflows where AI agents operate from the repo.
- The project (Puzzle) was manually set up in GitHub Projects, confirming the tool is in use.

ClickUp is an **optional adapter**, not the default board provider. See `clickup-setup-policy.md` for ClickUp structure when in use.

---

## Approved GitHub Projects structure

The default target is **one repo-connected GitHub Project per project.**

| Layer | Value |
|---|---|
| GitHub Project name | KeepMees Project Control |
| Type | Board (repo-connected, linked to GHnol/MessageVault) |
| Ownership | github.com/GHnol (same account as the repo) |
| Default views | See view list below |
| Task records | GitHub Issues (repo-native) |
| Board fields | GitHub Project custom fields |

---

## Approved GitHub Project views

Create these as saved views inside the GitHub Project:

| View name | Purpose |
|---|---|
| Board | Default Kanban-style board — by status |
| Table | Flat table of all items with all fields |
| Current Sprint | Items in active sprint window |
| Backlog | Items with status Backlog |
| Review / QA | Items with status Review / QA |
| Waiting / Blocked | Items with status Waiting / Blocked |
| Done | Items with status Done / Shipped or Cancelled |
| High Risks | Items where Risk Level = High (GitHub Projects does not support OR across different fields; Decision Needed is a separate view) |
| Calendar Relevant | Items where Calendar Relevant = true |
| TickTick Relevant | Items where TickTick Relevant = true |
| By Package | Grouped by Package field |
| By Phase | Grouped by Phase field |
| By Lane | Grouped by Lane field |
| Decision Needed | Items where Decision Needed = true |

---

## Canonical Status options (v1.5)

**These are the only valid Status values as of AI Project OS v1.5.**

| Status | Meaning |
|---|---|
| Backlog | Issue exists but no work has begun |
| Ready | Scoped, unblocked, ready to start |
| In Progress | Actively being worked |
| Review / QA | Implementation done; awaiting review, QA, or approval |
| Waiting / Blocked | Cannot proceed — waiting on external dependency, decision, or third party |
| Done / Shipped | Completed, verified, and merged/shipped |
| Deferred | Explicitly pushed to a future phase |
| Cancelled | Killed; will not be done |

Old vocabulary (v1.3/v1.4 — must not appear in new or updated files): `Not Started`, `In Review`, `Blocked`, `Waiting`, `Approved`, `Done`

See `github-projects-template-standard.md` for the full migration table.

---

## Recommended custom fields

Add the following custom fields to the GitHub Project:

| Field name | Type | Purpose |
|---|---|---|
| OS ID | Text | Stable internal ID (`keepmees-<category>-<slug>`) |
| Package | Text | Package this issue belongs to (e.g. `Package 5A`) |
| Phase | Text or Number | Project phase (0–15) |
| Lane | Single select | Execution lane (matches `backlog.md` lane names) |
| Source File | Text | Relative path to the canonical repo doc |
| Last Repo Sync | Date | When this issue was last synced from repo docs |
| External Sync Status | Single select | `in-sync`, `drift`, `unknown`, `not-tracked` |
| Risk Level | Single select | `Low`, `Medium`, `High` |
| Decision Needed | Checkbox | True if issue is blocked by an open decision |
| Calendar Relevant | Checkbox | True if this item or its deadline belongs on Google Calendar |
| TickTick Relevant | Checkbox | True if this item belongs in the TickTick personal execution layer |
| Owner Role | Single select | Role responsible (see Owner Role rule below) |
| Success Criteria | Text | What "done" looks like; matches `Success Criteria` in repo doc |

---

## Owner Role rule

Use the Owner Role custom field to identify who owns a task. Do not use GitHub Assignees for AI agents unless the agent corresponds to a real GitHub user.

Allowed Owner Role values:

- Founder
- Coordinator
- Claude
- Codex
- Development
- Vendor
- Design
- Product
- QA

**GitHub Assignees should only be set to real GitHub users.** AI agents (Claude, Codex) appear in Owner Role only — never as GitHub Assignees.

---

## GitHub Issues as external task records

GitHub Issues are the primary external task record format for GitHub Projects.

| Repo concept | GitHub Projects equivalent |
|---|---|
| Backlog task | GitHub Issue |
| Sprint task | GitHub Issue (linked to current milestone or sprint) |
| Package | GitHub Milestone or Project field (Package) |
| Phase gate | GitHub Issue with label `gate` and Phase field |
| Risk entry | GitHub Issue with label `risk` |
| Decision | GitHub Issue with label `decision` |

Issue titles and bodies are generated from repo source records (see `github-projects-source-schema.md`). Labels, milestone, and project field values are set at import time.

---

## Sync map rule

- Use one **project_id** and one **project_number** per GitHub Project.
- Store the project_id, project_number, and per-issue `issue_number`, `issue_url`, and `project_item_id` in `docs/project-control/external-sync-map.local.json` (gitignored, never committed).
- See `github-projects-field-map.example.json` for the map format.
- Do not commit `external-sync-map.local.json`.
- Do not commit GitHub tokens, OAuth credentials, or any GitHub authentication material.

One local sync map can track GitHub Project, GitHub Issue, GitHub Project item, Google Calendar, ClickUp, and TickTick IDs. The map format extends `external-sync-map.example.json`.

---

## Approval gates

| Operation | Approval required |
|---|---|
| GitHub Project creation | Explicit Coordinator approval |
| GitHub Issue bulk import | Explicit Coordinator approval |
| GitHub Project field setup | Explicit Coordinator approval |
| GitHub Project view setup | Explicit Coordinator approval |
| Issue close or archive | Explicit Coordinator approval |

No live GitHub Project creation or issue import happens without explicit approval. Scripts must require `--apply` and print a warning without it.

---

## Template-copy as preferred setup path (v1.5)

**Template-copy is the preferred GitHub Project setup path as of AI Project OS v1.5.**

When a validated template config (`github-projects-template-config.local.json`) is present:
- `github-project-setup-apply.mjs` auto-detects it and uses `--from-template`
- No manual `--from-template` flag needed

When no template config is present (or it has placeholder IDs):
- `github-project-setup-apply.mjs` falls back to create-from-scratch
- Create-from-scratch creates 13 custom fields individually

See `github-projects-template-standard.md` and `github-projects-template-copy-runbook.md` for the two-gate model and Gate 2 authorization requirements.

---

## What this policy does NOT do

- It does not commit or push.
- It does not create GitHub Projects or GitHub Issues automatically.
- It does not commit GitHub project IDs, issue numbers, or auth tokens.
- It does not override the Coordinator's decisions about board structure.
- It does not authorize live API integration without a separate Coordinator-approved package.
