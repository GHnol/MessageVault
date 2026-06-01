---
name: handoff
description: Update AI_HANDOFF.md with the current session state and produce a transfer packet for the next session or agent.
---

## Purpose

Capture the current work state in `AI_HANDOFF.md` so that the next session, model, or tool can resume without context loss. This is the compact-safe checkpoint skill — it makes the repo the durable record, not the conversation.

## When to use

- Before any `/clear`, `/compact`, model switch, or tool switch
- At any package boundary
- When context/usage pressure is high
- When the user says: "checkpoint", "handoff", "before compact", "resume packet", "context guard", "save state", "pause here"
- Before stopping a long session mid-task

**Invocation type:** User-invoked. Also triggered by user trigger phrases (policy-driven; the agent must recognize the phrases and act).

## Files to read

1. `AI_HANDOFF.md` (current state to update)
2. `CURRENT_STATE.md` (package and branch truth)
3. `NEXT_SESSION_PROMPT.md` (next-action pointer)

## Required git preflight

Run in parallel:

- `git branch --show-current`
- `git status --short`
- `git log --oneline -5`

## Sync obligations

When preparing a handoff after meaningful work, run the start router and state freshness validator to detect misdirection before the next agent picks up:

```
node scripts/start-router.mjs --mode handoff
```

If the start router returns `BLOCKED_*`, resolve the condition before completing the handoff.

Then run the state freshness validator:

```
node scripts/state-freshness-check.mjs
```

FAILs must be resolved before the handoff is complete. WARNs must be noted in the transfer block. See `docs/dev/closeout-sync-contract.md` § "State-Sync Decision Matrix".

Before completing the handoff, determine the report mirror outcome:

- If this handoff closes a meaningful work unit (package, gate, incident): state whether a mirror entry is needed.
- If MIRRORED: run `node scripts/report-mirror-intake.mjs --input <local-path> --type handoff --dry-run` and include the mirror status in the transfer block.
- If SKIPPED or NOT NEEDED: state the reason.
- The incoming agent reads the mirror status from the transfer block before resuming.

See `docs/project-control/report-mirror-policy.md`.

After updating `AI_HANDOFF.md`, check whether `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` also need updating. Apply the Post-Commit State Rule: update only if the docs would misdirect the next agent. Cosmetic HEAD lag does not require a sync commit.

If this handoff is at a package boundary, also check:

- `docs/project-control/current-sprint.md`
- `docs/project-control/kanban-board.md`
- Whether the internal sync check is required (see `docs/dev/closeout-sync-contract.md`)

## Output format

1. Update `AI_HANDOFF.md` with:
   - Status (active / paused / closed)
   - Active package and branch
   - What was done this session
   - What remains
   - What is blocked and why
   - Next exact action for the incoming session
   - File-level warnings

2. Output a transfer block to chat:

   > **TRANSFER PACKET**
   > Package: … | Branch: … | HEAD: … | Done: … | Remaining: … | Blocked: … | Next action: … | Handoff file: updated ✓ | Mirror status: MIRRORED / SKIPPED / NOT NEEDED

## Hard stop conditions

- Do not claim the handoff is complete if `git status --short` shows unexpected uncommitted changes that are not described in the handoff.
- If the working tree is dirty and the changes are intentional, describe them explicitly under "Work remaining."

## Approval boundaries

- Does not commit, push, or merge.
- Writing `AI_HANDOFF.md` is the deliverable — no additional authorization needed for the write itself.
- Any follow-up state-sync commit requires explicit user instruction.

## Backed by

`docs/automation/operator-mode/context-continuity-protocol.md`
`docs/dev/auto-management-protocol.md` (Duty 1: maintain repo-native memory continuously)
`docs/dev/closeout-sync-contract.md`
