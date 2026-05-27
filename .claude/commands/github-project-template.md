# /github-project-template

Delegates to `.claude/skills/github-project-template/SKILL.md`. Read that file for the full protocol.

---

## What this command does

Manage the canonical AI Project OS GitHub Project template standard (v1.5). Template-copy is the preferred GitHub Project setup path. This command covers dry-run, validation, and Gate 2 apply operations.

---

## Entry point

1. Read `.claude/skills/github-project-template/SKILL.md` — follow the full protocol.
2. Run the dry-run first: `node scripts/github-project-template-dry-run.mjs`
3. Report infrastructure state and Gate 2 status to the Coordinator.
4. Do not apply Gate 2 operations unless the Coordinator explicitly authorizes Gate 2.

---

## Gate model

| Gate | Requires |
|---|---|
| Gate 1 — repo infrastructure | v1.5 pass authorization (already done) |
| Gate 2 — live template creation | Separate explicit Coordinator approval |

Gate 2 has NOT been authorized as of the v1.5 Gate 1 pass. Do not proceed with Gate 2 without explicit authorization.

---

## Approval boundary

- Dry-run and validation: allowed at any time.
- `--apply --validate-template` (read-only): requires explicit Coordinator authorization (Gate 2).
- `--apply --create-template` or `--apply --copy-from-template`: requires explicit Gate 2 Coordinator authorization.

---

## Hard stops (always)

- No live template creation without explicit Gate 2 authorization.
- No secrets, tokens, or credentials committed.
- No `github-projects-template-config.local.json` committed.
- No `index.html` or `src/**` touched.
- No `gh auth login` run automatically.
