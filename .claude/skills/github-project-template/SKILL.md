---
name: github-project-template
description: Manage the canonical AI Project OS GitHub Project template — dry-run, validate, and Gate 2 apply for template creation and copy.
---

## Purpose

Govern the canonical AI Project OS GitHub Project template standard. This skill covers:

1. Template dry-run (validate infrastructure, show planned behavior)
2. Template config validation (check spec conformance)
3. Gate 2 apply operations (create or designate template — explicit Coordinator approval)

**Template-copy is the preferred GitHub Project setup path as of v1.5.** Create-from-scratch is the fallback when no template is configured.

## When to use

- Before or after completing Gate 2 of the template standard
- When setting up a new AI Project OS repo via template-copy
- When verifying the template config is spec-compliant
- When the Coordinator wants to review template infrastructure state

**Invocation type:** User-invoked (`/github-project-template`). No automated execution.

**Default mode:** Dry-run (plan mode). Apply requires `--apply` and Coordinator approval.

## The Two-Gate Model

| Gate | What | Authorization |
|---|---|---|
| Gate 1 | Repo infrastructure (this skill, scripts, docs) | v1.5 pass authorization |
| Gate 2 | Live template creation or documented blocker | Separate explicit Coordinator approval |

Gate 2 has not yet been authorized for KeepMees as of the v1.5 Gate 1 pass. Do not execute Gate 2 operations without explicit authorization.

## Files to read

1. `docs/project-control/github-projects-template-standard.md` — canonical vocabulary, field set, view set, two-gate model
2. `docs/project-control/github-projects-template-copy-runbook.md` — step-by-step Gate 1/Gate 2 process
3. `docs/project-control/github-projects-template-config.example.json` — committed example config (placeholder IDs only)
4. `docs/project-control/external-sync-safety.md` — safety rules
5. `docs/project-control/github-projects-setup-policy.md` — canonical project structure

## Required git preflight

```bash
git branch --show-current
git status --short
git remote -v
git config user.name
git config user.email
```

## Dry-run

```bash
node scripts/github-project-template-dry-run.mjs --owner GHnol
```

Output includes:
- Required docs check
- Local template config detection (Gate 2 status)
- Example config validation (vocabulary, placeholder safety, field/view counts)
- Gitignore check for local config
- gh CLI availability check
- What apply would do (template-copy or create-from-scratch)

## Validation

```bash
# Validate example config (always safe)
node scripts/github-project-template-validate.mjs

# Validate local config (if Gate 2 complete)
node scripts/github-project-template-validate.mjs \
  --config docs/project-control/github-projects-template-config.local.json

# Validate local config + probe live GitHub (read-only)
node scripts/github-project-template-validate.mjs \
  --config docs/project-control/github-projects-template-config.local.json \
  --live
```

## Apply approval boundaries (Gate 2 — separate Coordinator authorization required)

| Operation | Approval | Script |
|---|---|---|
| Create canonical template project | Explicit Coordinator approval — Gate 2 | `github-project-template-apply.mjs --apply --create-template` |
| Copy from template to new project | Explicit Coordinator approval — Gate 2 | `github-project-template-apply.mjs --apply --copy-from-template` |
| Validate template project (read-only) | Gate 2 authorization + `--apply` flag | `github-project-template-apply.mjs --apply --validate-template` |

No apply script may run mutations without `--apply` flag. Without `--apply`, all scripts show plan mode only.

## Template config files

| File | Rule |
|---|---|
| `docs/project-control/github-projects-template-config.example.json` | Committed, safe — placeholder IDs only |
| `docs/project-control/github-projects-template-config.local.json` | **Never committed** — gitignored; contains real template project IDs |

## Hard stop conditions

- Never run `--apply --create-template` or `--apply --copy-from-template` without Gate 2 authorization.
- Never commit `github-projects-template-config.local.json`.
- Never commit real template project IDs, node IDs, or GitHub tokens.
- Never touch `index.html`, `src/**`, or any product code.
- Never run `gh auth login` automatically.
- If `gh auth status` fails: stop and tell the user to authenticate manually.

## Canonical vocabulary (v1.5)

Status options: `Backlog`, `Ready`, `In Progress`, `Review / QA`, `Waiting / Blocked`, `Done / Shipped`, `Deferred`, `Cancelled`

Old vocab must not appear: `Not Started`, `In Review`, `Blocked`, `Waiting`, `Approved`, `Done`

External Sync Status: `in-sync`, `drift`, `unknown`, `not-tracked`

Owner Role: `Founder`, `Coordinator`, `Claude`, `Codex`, `Development`, `QA`, `Product`, `Vendor`, `Design`

## Backed by

`docs/project-control/github-projects-template-standard.md`
`docs/project-control/github-projects-template-copy-runbook.md`
`docs/project-control/external-sync-safety.md`
`scripts/github-project-template-dry-run.mjs`
`scripts/github-project-template-validate.mjs`
`scripts/github-project-template-apply.mjs`
