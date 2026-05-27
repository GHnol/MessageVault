# GitHub Projects Template Copy Runbook

**Status:** ACTIVE (introduced in AI Project OS v1.5 — Template GitHub Project Standard, 2026-05-26)
**Owner:** Coordinator / Project Control
**Companion docs:** `github-projects-template-standard.md`, `github-projects-template-config.example.json`, `github-projects-import-runbook.md`, `external-sync-safety.md`

---

## Overview

This runbook covers setting up a GitHub Project via the template-copy path. Template-copy is the preferred method for any AI Project OS repo (as of v1.5). Create-from-scratch is the fallback when no validated template exists.

The runbook is split into two gates. Gate 1 is repo infrastructure (no live GitHub mutations). Gate 2 requires explicit Coordinator approval.

---

## Gate 1 — Repo infrastructure (no live mutations)

Gate 1 is completed as part of the AI Project OS v1.5 pass. No live GitHub mutations are performed in Gate 1.

**Gate 1 complete when:**
- `docs/project-control/github-projects-template-standard.md` exists
- `docs/project-control/github-projects-template-config.example.json` exists
- Template scripts exist and pass `node --check`
- OS audit passes with new Section 6d checks

Gate 1 does not require Coordinator authorization beyond the v1.5 implementation directive.

---

## Gate 2 — Live template creation or documented blocker

Gate 2 requires explicit Coordinator authorization.

### Step 0: Decide the template source

Choose one:

**Option A — Designate existing KeepMees Project #1**
- The KeepMees Project #1 is operational with 13 fields and 14 views
- It can serve as the AI Project OS template for future repos
- Required: verify Status options match v1.5 canonical vocabulary (field repair if needed)
- Action: record `PVT_kwHOBuFnQM4BYzCh` and project number `1` in `github-projects-template-config.local.json`

**Option B — Create a dedicated template project**
- Creates a separate project not connected to any repo's Issues
- Advantage: can be frozen as a stable template without drift
- Action: run `node scripts/github-project-template-apply.mjs --apply --create-template`

**Option C — Document a platform blocker**
- If `copyProjectV2` is unavailable or token lacks required scope, document it
- Record in `docs/project-control/github-projects-template-standard.md` under "Gate 2 Status"

---

### Step 1: Pre-flight

```bash
# Check gh CLI
gh --version

# Check auth
gh auth status

# Check required scopes (project scope needed for copyProjectV2)
# Expected: project scope available

# Run template dry-run (no writes)
node scripts/github-project-template-dry-run.mjs

# If template config exists locally, validate it
node scripts/github-project-template-validate.mjs \
  --config docs/project-control/github-projects-template-config.local.json
```

Do not run `gh auth login` automatically. Do not change `gh auth` state from a script.

---

### Step 2: Create or designate the template project

#### Option A — Designate KeepMees Project #1

1. Confirm project fields are set per canonical spec (run `scripts/github-project-field-map.mjs --local-map`)
2. Confirm Status options match v1.5 canonical vocabulary (run field repair if needed)
3. Record template config:

```bash
# Write to github-projects-template-config.local.json (gitignored)
# Do NOT commit this file — it is gitignored
```

The local config format:
```json
{
  "template_provider": "github-projects",
  "template_owner": "GHnol",
  "template_project_number": 1,
  "template_project_id": "PVT_kwHOBuFnQM4BYzCh",
  "template_project_title": "KeepMees Project Control",
  "template_project_url": "https://github.com/users/GHnol/projects/1",
  "fallback_mode": "create-from-scratch"
}
```

#### Option B — Create a dedicated template project

```bash
# Coordinator approval required
node scripts/github-project-template-apply.mjs --apply --create-template \
  --owner GHnol --template-title "AI Project OS Template"
```

After creation:
1. Script prints the new project ID and number
2. Write the IDs to `github-projects-template-config.local.json`
3. Confirm the project has all 13 fields, 8 Status options, 14 views

---

### Step 3: Validate the template

After the template project exists or is designated, validate it against the canonical spec:

```bash
node scripts/github-project-template-validate.mjs \
  --config docs/project-control/github-projects-template-config.local.json \
  --live
```

Validation checks:
- Template project exists on GitHub (read-only API call)
- Project has all 13 required custom fields
- Status field has all 8 v1.5 canonical options
- Owner Role field has all 9 canonical options
- External Sync Status field has all 4 canonical options

Fix any drift before declaring Gate 2 complete.

---

### Step 4: Copy-from-template (for future repos)

With a validated template config, future repos can set up their GitHub Project via:

```bash
node scripts/github-project-setup-apply.mjs --apply \
  --owner <new-owner> --repo <new-repo>
```

The script detects `github-projects-template-config.local.json`, auto-selects `--from-template`, and runs `copyProjectV2`. No manual `--from-template` flag needed.

---

### Step 5: Close Gate 2

Update `docs/project-control/github-projects-template-standard.md` — "Gate 2 Status" section:

```
Gate 2 outcome: [Option A | Option B | Option C]
Template project: <title> (owner: <owner>, number: <N>, id: <PVT_...>)
Date closed: YYYY-MM-DD
Coordinator approval: [name]
```

Log the operation in `github-projects-sync-log.md`.

---

## Safety summary

- No live template creation without explicit Coordinator approval and `--apply` flag.
- Never commit `github-projects-template-config.local.json`.
- Never commit real template project IDs, node IDs, or GitHub tokens.
- Never run `gh auth login` from a script.
- Log every applied operation in `github-projects-sync-log.md`.

Full safety rules: `external-sync-safety.md`.
