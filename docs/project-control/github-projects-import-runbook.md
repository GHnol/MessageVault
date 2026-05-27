# GitHub Projects Import Runbook

**Status:** ACTIVE (introduced v1.3; apply scripts made real in v1.4; template-copy path added in v1.5)
**Owner:** Coordinator / Project Control
**Purpose:** Step-by-step process for setting up a GitHub Project, importing issues, and syncing project fields. All operations follow the dry-run → approval → apply → log workflow.
**Companion docs:** `github-projects-setup-policy.md`, `github-projects-source-schema.md`, `github-projects-field-map.example.json`, `github-projects-sync-log.md`, `external-sync-safety.md`, `github-projects-template-standard.md`, `github-projects-template-copy-runbook.md`

---

## Overview

This runbook covers three separable operations, each approval-gated:

1. **Project setup** — create or find the GitHub Project, configure views and custom fields
2. **Issue import** — create GitHub Issues from repo-generated source records
3. **Field sync** — update GitHub Project field values after issue import

No operation runs without explicit Coordinator approval. All apply scripts require `--apply` flag. Default mode is dry-run or status output.

---

## Step 0: Pre-flight

### 0a. Dry-run first

Always run the dry-run script before any apply:

```bash
node scripts/github-project-setup-dry-run.mjs
```

This prints the planned GitHub Project structure, fields, statuses, and views. It performs no external writes.

### 0b. Verify gh CLI availability

```bash
gh --version
```

If `gh` is not installed: visit https://cli.github.com and install the GitHub CLI. Do not auto-install.

If `gh` is missing, apply scripts must exit non-zero with clear instructions. Dry-run scripts may continue and show planned actions.

### 0c. Verify gh auth status

```bash
gh auth status
```

Expected: active session for the GHnol account. If not authenticated:

```bash
# User must run this themselves — agents must not run gh auth login automatically
gh auth login
```

Do not change `gh auth` state from a script. Do not run `gh auth login` automatically.

### 0d. Verify repo and owner

```bash
gh repo view GHnol/MessageVault
```

Confirm the remote repo matches. Run `git remote -v` to verify local config.

---

## Step 1: Create or find the GitHub Project

### Dry-run (always first)

```bash
node scripts/github-project-setup-dry-run.mjs
```

Review the planned structure. The output includes:
- Project name: `KeepMees Project Control`
- Owner: `GHnol`
- Views to create (14 views — see `github-projects-setup-policy.md`)
- Statuses to configure (9 statuses)
- Custom fields to add (13 fields)

### Find existing project (if already created)

```bash
gh project list --owner GHnol
```

If the project already exists, note the project number and update `external-sync-map.local.json` with the real `project_number` and `project_id`.

### Create new project (with --apply and Coordinator approval only)

```bash
node scripts/github-project-setup-apply.mjs --apply
```

This script will:
1. Probe GitHub auth and project scope
2. Check for existing project (dedup: no duplicate creation)
3. Create the project if not found (or reuse existing)
4. Link the project to `GHnol/MessageVault` repository
5. Read existing project fields (idempotent: skip already-created fields)
6. Add all 13 missing custom fields via GitHub GraphQL API
7. Write `external-sync-map.local.json` with project ID and field IDs (never committed)
8. Append an entry to `github-projects-sync-log.md`
9. Print remaining manual steps: Status field options + 14 views

### Step 1b: Template-copy path (preferred when Gate 2 is complete)

**Template-copy is the preferred setup path as of AI Project OS v1.5.** If Gate 2 has been completed (real template IDs in `github-projects-template-config.local.json`), `github-project-setup-apply.mjs` automatically selects the template-copy path:

```bash
# With local template config present, this auto-selects template-copy
node scripts/github-project-setup-apply.mjs --apply --owner GHnol --repo MessageVault
```

To validate the template before applying:
```bash
node scripts/github-project-template-dry-run.mjs
node scripts/github-project-template-validate.mjs \
  --config docs/project-control/github-projects-template-config.local.json --live
```

If Gate 2 is not yet complete (no local template config or placeholder IDs), setup-apply falls back to create-from-scratch automatically. See `github-projects-template-standard.md` and `github-projects-template-copy-runbook.md`.

---

## Step 2: Create GitHub Issues from repo source records

### Source records

Issues are created from repo-generated source records only. The source schema is defined in `github-projects-source-schema.md`. Source records are derived from:
- `docs/project-control/backlog.md`
- `docs/project-control/current-sprint.md`
- `docs/project-control/master-roadmap.md`

Do not create issues from ad-hoc prompts or unverified sources.

### Dry-run issue list

```bash
node scripts/github-project-import-issues.mjs \
  --input docs/project-control/github-projects-source-records.example.json \
  --owner GHnol --repo MessageVault --project-number 1
```

Dry-run output:
- Parses and validates all source records (schema validation)
- Checks local sync map for already-synced OS IDs (layer 1 dedup)
- Searches GitHub for issues with matching OS ID markers (layer 2 dedup)
- Prints create/skip plan — no external writes

### Create issues (with --apply and Coordinator approval only)

```bash
node scripts/github-project-import-issues.mjs --apply \
  --input docs/project-control/github-projects-source-records.example.json \
  --owner GHnol --repo MessageVault --project-number 1
```

Requirements before running:
- Coordinator has reviewed and approved the dry-run output
- `--apply` flag is present
- `--input <source-file>` points to a valid source records JSON file
- `gh auth status` confirms active session for GHnol
- `gh` token has `repo` and `read:project` / `write:project` scopes
- GitHub Project exists and `external-sync-map.local.json` has project_id (Step 1 complete)

This script will (per record, in order):
1. Validate all source records and check for duplicates
2. Create one GitHub Issue (`gh issue create`) per new source record
3. Embed OS ID marker in issue body for future dedup
4. Add the issue to the GitHub Project (GraphQL `addProjectV2ItemById`)
5. Set all 13 custom field values via GraphQL mutations
6. Set the built-in Status field if the option exists
7. Write issue_number, issue_node_id, and project_item_id to `external-sync-map.local.json` after each issue (incremental — safe to re-run on partial failure)
8. Append a summary entry to `github-projects-sync-log.md`

Re-running with `--apply` is safe: the sync map and GitHub OS ID marker prevent duplicate issues.

### Add issues to project (if created separately)

If issues were created outside this script:

```bash
gh project item-add <project-number> --owner GHnol --url <issue-url>
```

---

## Step 3: Set project field values

### Using GitHub CLI

```bash
# Set a text field
gh project item-edit --project-id <project-id> --id <item-id> --field-id <field-id> --text "<value>"

# Set a single-select field
gh project item-edit --project-id <project-id> --id <item-id> --field-id <field-id> --single-select-option-id <option-id>

# Set a date field
gh project item-edit --project-id <project-id> --id <item-id> --field-id <field-id> --date "YYYY-MM-DD"
```

### Using GitHub GraphQL API

```graphql
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "<project-id>"
    itemId: "<item-id>"
    fieldId: "<field-id>"
    value: { text: "<value>" }
  }) {
    projectV2Item {
      id
    }
  }
}
```

The apply script (`scripts/github-project-setup-apply.mjs`) handles field setup as part of project creation. The field-map script (`scripts/github-project-field-map.mjs`) validates the example field map structure.

---

## Step 4: Write local sync map

After apply, write the local sync map:

```
docs/project-control/external-sync-map.local.json
```

This file is gitignored and lives only on each contributor's machine. The format extends `external-sync-map.example.json` with a `github_projects` section. See `github-projects-field-map.example.json` for the format.

**Never commit `external-sync-map.local.json`.**

---

## Step 5: Log the operation

Every apply operation must be logged in `github-projects-sync-log.md`:

- Date
- Operation type (project-setup / issue-import / field-sync)
- What was created or updated
- Script used
- Coordinator who approved
- Any issues or warnings

---

## Rollback strategy

### If issues were created by mistake

1. Do not delete issues without explicit Coordinator approval.
2. To undo a batch import: close newly created issues only — do not delete them. GitHub Issues have an audit trail.
3. Script to close a single issue: `gh issue close <issue-number> --repo GHnol/MessageVault`
4. Bulk close: list issue numbers from `external-sync-map.local.json` and close one at a time.

**Never destructively delete GitHub Issues, Project items, or Project views without explicit Coordinator approval.**

### If the project was created by mistake

Do not delete the project without explicit Coordinator approval. Record the project_id in the local sync map for future reference.

---

## Safety summary

- No live project creation without explicit approval and `--apply` flag.
- No issue creation without explicit approval and `--apply` flag.
- Never commit `external-sync-map.local.json`.
- Never commit GitHub tokens or auth credentials.
- Never run `gh auth login` from a script.
- Never delete or archive project items without explicit approval.
- Dry-run always runs first. Apply only runs after Coordinator approval.
- Log every applied operation in `github-projects-sync-log.md`.

Full safety rules: `external-sync-safety.md`.
