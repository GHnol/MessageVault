---
name: switch-to-codex
description: Prepare a Codex handoff — update AI_HANDOFF.md, confirm clean working tree, and produce the Codex transfer packet for tool switching.
---

## Purpose

Make tool switches safe by ensuring the repo is the complete handoff medium. Chat memory does not transfer between Claude and Codex — only the repo does. This skill produces a transfer packet that lets Codex resume without losing state.

## When to use

- When handing work off to Codex (usage-limit fallback, parallel work, independent review)
- Before a Claude ↔ Codex tool switch at any package boundary
- When explicitly instructed by the Coordinator

**Invocation type:** User-invoked. Semi-automatic: the skill prepares and outputs; the user confirms the switch.

## Files to read

1. `AI_HANDOFF.md` (update before producing packet)
2. `docs/dev/tool-switching-protocol.md`
3. `docs/dev/claude-codex-interchangeability.md`
4. `CURRENT_STATE.md`

## Required git preflight

Run in parallel:

- `git branch --show-current`
- `git status --short`
- `git log --oneline -5`

The working tree must be clean (or uncommitted changes must be explicitly described in the handoff) before switching tools.

## Sync obligations

This skill runs the full handoff sequence (same as the `handoff` skill) before producing the transfer packet. After updating `AI_HANDOFF.md`, verify whether `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` also need updating to prevent misdirection of the incoming Codex session.

## Output format

1. Updated `AI_HANDOFF.md` (same format as `handoff` skill)

2. A Codex transfer block to chat:

   > **CODEX TRANSFER PACKET**
   > Codex startup: Read `AGENTS.md` → `.codex/README.md` → `AI_HANDOFF.md` → `CURRENT_STATE.md` → run `git status --short` and `git log --oneline -5`.
   > State out loud: package, branch, objective, approved scope, hard exclusions, done, remaining, next exact action.
   > Package: … | Branch: … | HEAD: … | Done: … | Remaining: … | Blocked: … | Next action: …

## Hard stop conditions

- Do not hand off with a dirty working tree unless uncommitted changes are intentional and fully described in the handoff.
- `AI_HANDOFF.md` must be current before the switch.
- Do not hand off mid-package without completing the current logical unit or explicitly flagging the break.

## Approval boundaries

- Does not commit, push, or merge.
- The user confirms the switch; the skill only prepares the packet.
- One active editing agent per branch — the switch must be confirmed before Codex begins editing.

## Backed by

`docs/dev/tool-switching-protocol.md`
`docs/dev/claude-codex-interchangeability.md`
`docs/automation/operator-mode/context-continuity-protocol.md`
