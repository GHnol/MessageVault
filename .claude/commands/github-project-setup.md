# /github-project-setup

Delegates to `.claude/skills/github-project-setup/SKILL.md`. Read that file for the full protocol.

---

## What this command does

Plan, dry-run, and approval-gate GitHub Projects setup for the KeepMees external board. GitHub Projects is the default external board provider as of AI Project OS v1.3.

---

## Entry point

1. Read `.claude/skills/github-project-setup/SKILL.md` — follow the full protocol.
2. Run the dry-run first: `node scripts/github-project-setup-dry-run.mjs`
3. Report the planned structure to the Coordinator.
4. Do not apply anything unless the Coordinator explicitly approves.

---

## Approval boundary

- Dry-run: allowed at any time.
- Apply (project creation, issue import, field setup): requires explicit Coordinator approval and `--apply` flag on the relevant script.
- Do not run any apply script with `--apply` in this session unless the Coordinator explicitly says to.

---

## Hard stops (always)

- No live GitHub Project creation without approval.
- No live GitHub Issue import without approval.
- No secrets, tokens, or credentials committed.
- No `external-sync-map.local.json` committed.
- No `index.html` or `src/**` touched.
- No `gh auth login` run automatically.
