---
name: project-sync-apply
description: Apply an approved project-control sync delta — update internal repo docs and propose external tool changes, after Coordinator approval of a dry-run result.
---

## Purpose

Apply the changes approved after a `project-sync-dry-run`. This skill updates internal repo docs and prepares (but does not automatically execute) external tool changes. External system writes require the Coordinator to separately authorize and perform them.

## When to use

- After the Coordinator has reviewed and approved a `project-sync-dry-run` output
- Never before a dry-run has been reviewed and approved

**Invocation type:** User-invoked. Approval-gated — requires explicit Coordinator approval of a specific dry-run delta before running.

**External sync:** Dry-run/apply. Internal doc updates can be applied directly after approval. External system changes (Google Calendar, ClickUp, TickTick) are proposed and must be performed manually or via a separately authorized script.

## Files to read

1. The approved dry-run delta (from the chat or a saved proposal)
2. `docs/project-control/project-sync-policy.md`
3. `docs/project-control/external-sync-safety.md`
4. `docs/project-control/project-sync-log.md`

## Required git preflight

- `git status --short` (working tree should be clean before applying)
- `git branch --show-current`

## Sync obligations

After applying internal doc updates, add an entry to `docs/project-control/project-sync-log.md` recording what was changed, what was proposed to external tools, and what remains pending.

## Output format

1. List of internal repo files updated (each with what changed)
2. External tool changes proposed (not applied):
   - Google Calendar: list events to add/edit/remove; recommend targeted edit vs `.ics` regeneration
   - ClickUp: list task/column changes proposed
   - TickTick: list item changes proposed
3. Log entry added to `docs/project-control/project-sync-log.md`
4. Proposed commit message for the sync commit (if internal doc changes warrant a commit)

Footer for external tool section: `External sync proposed only. No external writes performed. Coordinator must apply these changes manually or authorize a separate script run.`

## Hard stop conditions

- Do not apply any changes not in the approved dry-run delta.
- Do not write to external systems (Google Calendar, ClickUp, TickTick).
- Do not delete external tool records without explicit approval.
- Do not apply without a specific approved delta — do not infer approval from context.

## Approval boundaries

- Internal doc updates: apply after explicit Coordinator approval of the dry-run.
- External tool changes: propose only; the Coordinator applies manually.
- Commit of the sync changes: requires explicit user instruction.

## Backed by

`docs/project-control/project-sync-policy.md`
`docs/project-control/external-sync-safety.md`
`docs/project-control/project-sync-log.md`
`docs/dev/closeout-sync-contract.md`
