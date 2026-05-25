---
name: switch-to-claude
description: Resume KeepMees work after a Codex session — read repo truth, run git preflight, and declare current state before editing anything.
---

## Purpose

Make the Codex → Claude handoff safe by reading repo truth first, not trusting any prior conversation summary. This skill is the Claude-side counterpart to the `switch-to-codex` skill.

## When to use

- Resuming after any Codex session
- After a tool switch where Codex held the active branch
- When the user says "resume from Codex" or runs `/switch-to-claude`

**Invocation type:** User-invoked.

## Files to read (in order)

1. `AGENTS.md`
2. `CLAUDE.md`
3. `AI_HANDOFF.md` (written by Codex)
4. `CURRENT_STATE.md`

## Required git preflight

Run in parallel:

- `git branch --show-current`
- `git status --short`
- `git log --oneline -10`

Verify that the branch in `AI_HANDOFF.md` matches `git branch --show-current`. Verify that HEAD matches what Codex reported.

## Sync obligations

- Do not update state docs during this skill unless the handoff reveals operational misdirection.
- If `AI_HANDOFF.md` is stale or conflicts with git state, stop and ask the Coordinator.

## Output format

State out loud, before editing any file:

> Package: … | Branch: … | HEAD: … | What Codex did: … | Remaining: … | Next action: …

Then proceed.

## Hard stop conditions

- Stop and ask the Coordinator if:
  - `AI_HANDOFF.md` is missing, blank, or conflicts with `git branch --show-current`
  - The handoff branch no longer exists
  - There are unexpected modified files not explained by the handoff
  - The active package is closed but the tree is dirty

Do not trust any prior conversation context. The repo is the source of truth.

## Approval boundaries

- Does not commit, push, or merge.
- Does not start new scope not described in the handoff without Coordinator authorization.

## Backed by

`docs/dev/session-restart-protocol.md`
`docs/dev/tool-switching-protocol.md`
`docs/dev/claude-codex-interchangeability.md`
