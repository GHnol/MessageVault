---
name: closeout
description: Run the KeepMees package boundary closeout sequence — verify scope and tests, update continuity files, run the internal sync check, and propose commit and merge plan.
---

## Purpose

Force a hard stop at package boundaries. Prevent the next package from starting in a bloated session. Ensure every package closes with verified tests, updated state docs, and a proposed (not auto-executed) commit and merge plan.

## When to use

- When a package's "Work remaining" is empty and all acceptance criteria are met
- When the Coordinator explicitly closes a package
- When a merge-to-main has happened for the package
- At the end of any status-sync branch

**Invocation type:** User-invoked. Policy-driven at package boundaries — the agent must run this sequence even without an explicit command.

## Files to read

1. `docs/dev/package-boundary-closeout-protocol.md`
2. `docs/qa/package-verification-template.md`
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`
5. `docs/dev/closeout-sync-contract.md`

## Required git preflight

Run in parallel:

- `git diff --stat HEAD`
- `git status --short`
- `git log --oneline -10`

## Sync obligations

Run the state freshness validator before recommending commit or merge:

```
node scripts/state-freshness-check.mjs
```

If FAILs are reported, fix them before proceeding. WARNs must be disclosed in the closeout report. See `docs/dev/closeout-sync-contract.md` § "State-Sync Decision Matrix" for FAIL/WARN/PASS criteria.

After package verification and continuity file updates, run the internal sync check defined in `docs/dev/closeout-sync-contract.md`. The sync check verifies:

- `CURRENT_STATE.md` — updated with last-closed package
- `AI_HANDOFF.md` — status set to `closed` or `ready-for-commit`
- `NEXT_SESSION_PROMPT.md` — next-action pointer updated
- `docs/project-control/current-sprint.md` — sprint task status reflects package completion
- `docs/project-control/kanban-board.md` — package card moved to Done
- Whether backlog, risk register, decision log, or shareable status need updating
- Calendar and external tool staleness assessment (dry-run only)

Apply the Post-Commit State Rule: actual edits are required only when docs would misdirect. Cosmetic HEAD lag alone does not require a follow-up commit.

External sync (ClickUp, TickTick, Google Calendar) remains dry-run/apply and is approval-gated. Never write to external systems without explicit Coordinator approval.

## Output format

A complete boundary report to chat:

1. Package name + status
2. Branch and commit summary (if commit happened)
3. Verification results (which tests/checks ran, results, which were skipped and why)
4. Files changed vs. authorized scope
5. Continuity files updated (yes/no for each)
6. Internal sync check result
7. Proposed commit message (exact text)
8. Proposed merge plan (branch → main, `--no-ff`, push order)
9. Proposed status-sync commit plan (branch name, files to update)
10. Recommended session shape for the next package
11. Blockers, if any

## Hard stop conditions

- Do not commit, push, or merge without explicit user instruction.
- Do not start the next package inside this session without Coordinator authorization.
- Do not mark a package complete if tests are failing or the pre-commit gate has not been run.
- Do not skip package verification because "tests look fine from memory."

## Approval boundaries

- All outputs are proposals — commit, merge, and external sync require explicit user instruction.
- Status-sync commit is a separate authorized step after the implementation merge.
- External tool updates (ClickUp, TickTick, Calendar) are dry-run only until the Coordinator approves.

## Backed by

`docs/dev/package-boundary-closeout-protocol.md`
`docs/dev/closeout-sync-contract.md`
`docs/qa/package-verification-template.md`
`docs/automation/operator-mode/package-closeout-protocol.md`
