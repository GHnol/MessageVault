---
name: precommit
description: Walk the KeepMees pre-commit verification gate — run all required checks and return a GO or NO-GO recommendation before any commit is created.
---

## Purpose

Ensure every commit meets the verification gate before the user authorizes it. Prevents broken state from reaching main. The agent walks every check and reports pass/fail/skip for each.

## When to use

- Before proposing any commit message
- Before asking the user to approve a commit
- As a mandatory step in the package boundary closeout sequence

**Invocation type:** User-invoked. Also required as part of the closeout flow (policy-driven at package boundaries).

## Files to read

1. `docs/qa/pre-commit-verification-template.md` (the full checklist)
2. `CLAUDE.md` § "Git identity (KeepMees repo)" (identity preflight)
3. `AI_HANDOFF.md` (what the diff should contain)

## Required git preflight

Run in parallel:

- `git diff --stat HEAD`
- `git status --short`
- `git remote -v`
- `git config user.name`
- `git config user.email`

## Sync obligations

Run the state freshness validator as part of the pre-commit gate:

```
node scripts/state-freshness-check.mjs
```

If FAILs are reported, they must be resolved before recommending commit. WARNs must be disclosed. Apply the Post-Commit State Rule: WARN_HEAD_HASH_LAG is cosmetic and does not block commit. See `docs/dev/closeout-sync-contract.md` § "State-Sync Decision Matrix".

For OS/docs-only packages (no app or `src/` changes): the state freshness check and `node scripts/os-self-audit.mjs` satisfy the pre-commit verification gate. Full app/E2E suites are not required.

For meaningful closeout commits, verify the report mirror status before recommending commit:
- If the commit is a package closeout, gate closeout, or merge closeout: confirm the mirror outcome is `MIRRORED`, `SKIPPED`, or `NOT NEEDED`.
- If the mirror outcome is `BLOCKED`: resolve the block before committing.
- State the mirror outcome in the pre-commit report.

See `docs/project-control/report-mirror-policy.md`.

If the verification reveals state docs are stale enough to misdirect the next agent, flag it and recommend a sync update before commit.

## Output format

For each check in the template, report one of:

- `PASS` — verified
- `FAIL` — reason; what must be fixed
- `SKIP` — reason; whether the skip is safe for this commit

Then a final recommendation:

- **GO:** all required checks pass; commit is safe to propose
- **NO-GO:** list which checks failed; what must be fixed before committing

Do not create the commit. The commit happens only after explicit user instruction.

## Hard stop conditions

- Never use `--no-verify`. If a hook fails, diagnose the root cause.
- Do not propose a commit when tests are failing.
- Do not propose a commit when the diff includes scope-guarded files that were not in the authorized package.

## Approval boundaries

- Does not create a commit.
- Does not push.
- Verification is the only output; the commit step requires explicit user instruction.

## Backed by

`docs/qa/pre-commit-verification-template.md`
`CLAUDE.md` § "Git identity (KeepMees repo)"
