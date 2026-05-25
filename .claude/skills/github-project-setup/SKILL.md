---
name: github-project-setup
description: Plan, dry-run, and approval-gate GitHub Projects setup for AI Project OS external boards.
---

## Purpose

Automate and gate the setup of GitHub Projects as the default external board provider for KeepMees and future AI Project OS repos. This skill governs dry-run planning, approval workflow, issue import, and field mapping — without performing any live external writes unless explicitly approved.

## When to use

- Before creating a GitHub Project for any AI Project OS repo
- Before importing GitHub Issues from repo source records
- Before setting GitHub Project field values
- When the Coordinator wants to verify the current GitHub Projects sync status
- When onboarding a new AI Project OS repo to GitHub Projects as the default board

**Invocation type:** User-invoked (`/github-project-setup`). No automated execution.

**Default mode:** Dry-run. Always prints planned actions before any apply.

## Files to read

1. `docs/project-control/github-projects-setup-policy.md` — approved structure, statuses, views, fields, Owner Role rule
2. `docs/project-control/github-projects-source-schema.md` — source record schema and field routing
3. `docs/project-control/github-projects-import-runbook.md` — step-by-step import process
4. `docs/project-control/github-projects-field-map.example.json` — example field map (placeholder IDs only)
5. `docs/project-control/github-projects-sync-log.md` — history of operations
6. `docs/project-control/external-sync-safety.md` — non-negotiable safety rules
7. `docs/project-control/project-sync-policy.md` — sync policy and dry-run/apply workflow

## Required git preflight

Before any action, verify:

```bash
git branch --show-current   # must be on an appropriate branch
git status --short          # working tree must be clean
git remote -v               # must show GHnol/MessageVault
git config user.name        # must show ghnol
git config user.email       # must show nlamptey@outlook.com
```

## Required GitHub preflight

Before any apply, verify:

```bash
gh --version          # gh CLI must be installed
gh auth status        # must show active session for GHnol account
```

Do not run `gh auth login` automatically. Do not change `gh auth` state.

## Dry-run output

Run the dry-run script first:

```bash
node scripts/github-project-setup-dry-run.mjs
```

Dry-run output must include:
- Planned GitHub Project name, owner, repo
- Planned statuses (9)
- Planned views (14)
- Planned custom fields (13) with types
- Field map example validation result
- Safety footer confirming no external writes were performed

## Apply approval boundaries

| Operation | Approval required | Script |
|---|---|---|
| GitHub Project creation | Explicit Coordinator approval | `github-project-setup-apply.mjs --apply` |
| GitHub Issue bulk import | Explicit Coordinator approval + `--input <file>` | `github-project-import-issues.mjs --apply --input <file>` |
| GitHub Project field setup | Explicit Coordinator approval | Part of setup-apply |
| Issue close or archive | Explicit Coordinator approval | Manual or targeted script |

No apply script may run without `--apply` flag. Without `--apply`, all apply scripts print their plan and exit.

## Sync map behavior

- The local sync map lives at `docs/project-control/external-sync-map.local.json` (gitignored).
- After each apply, the sync map is updated with project_id, project_number, issue_number, issue_url, and project_item_id.
- The sync map is never committed.
- The example map (`github-projects-field-map.example.json`) uses placeholder IDs only and is safe to commit.

## Issue import behavior

- Issues are created from repo-native source records only (never from ad-hoc prompts).
- Source schema: `docs/project-control/github-projects-source-schema.md`.
- Source records derive from: `backlog.md`, `current-sprint.md`, `master-roadmap.md`.
- After import: issue_number, issue_url, and project_item_id are written to the local sync map.
- Import is additive — no existing issues are deleted or archived without explicit approval.

## Project field behavior

- GitHub Project custom fields are set from source record field values.
- Field IDs are read from the local sync map (after apply creates the project).
- Field values are set via GitHub CLI or GraphQL — never manually guessed.
- No silent overwrites — if a field has been manually edited in the GitHub Project, surface the conflict.

## Hard stop conditions

- Never write to GitHub Projects, GitHub Issues, or any external API without `--apply` flag and Coordinator approval.
- Never commit `external-sync-map.local.json`.
- Never commit GitHub tokens, OAuth credentials, or any auth material.
- Never run `gh auth login` automatically.
- Never delete or archive GitHub Issues or Project items without explicit approval.
- Never touch `index.html`, `src/**`, or any product code.
- Never execute apply scripts in this docs-only pass.
- If `gh auth status` fails: stop and tell the user to authenticate manually.

## No secrets, no token logging

- Do not print, log, or store GitHub tokens.
- Do not read `~/.config/gh/hosts.yml` or any auth file.
- Do not commit any credential, token, or OAuth file.
- If a script would need a token to proceed in apply mode, print a setup instruction and exit non-zero.

## Backed by

`docs/project-control/github-projects-setup-policy.md`
`docs/project-control/github-projects-import-runbook.md`
`docs/project-control/external-sync-safety.md`
`docs/project-control/project-sync-policy.md`
`scripts/github-project-setup-dry-run.mjs`
`scripts/github-project-setup-apply.mjs`
`scripts/github-project-import-issues.mjs`
`scripts/github-project-sync-status.mjs`
`scripts/github-project-field-map.mjs`
