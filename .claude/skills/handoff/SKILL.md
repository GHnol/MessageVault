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
   > Package: … | Branch: … | HEAD: … | Done: … | Remaining: … | Blocked: … | Next action: … | Handoff file: updated ✓

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
