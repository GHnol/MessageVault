---
name: start
description: Run the KeepMees session startup sequence — read repo state, run git preflight, and declare current package, branch, and next action before touching any file.
---

## Purpose

Ensure every session begins from repo truth, not from stale conversation memory. This skill is the canonical startup sequence for all Claude Code and Codex sessions.

## When to use

- Any brand-new Claude Code session
- After `/clear`, `/compact`, a model switch, a tool switch, or an account switch
- After any context summary or auto-compact event
- Resuming work the next day or after a long pause

**Invocation type:** User-invoked. The user types `/start`; Claude routes to this skill. Nothing runs automatically.

## Files to read (in order)

1. `AGENTS.md`
2. `CLAUDE.md` (Claude Code) or `.codex/README.md` (Codex)
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`
5. `docs/ai-system/README.md`
6. `docs/dev/auto-management-protocol.md`

## Required git preflight

Run all three in parallel:

- `git branch --show-current`
- `git status --short`
- `git log --oneline -10`

Also: `git rev-parse HEAD` to verify HEAD against what the durable state files record.

## Sync obligations

- Check that `AI_HANDOFF.md`, `CURRENT_STATE.md`, and `NEXT_SESSION_PROMPT.md` reflect the current HEAD and package state.
- If recent closeout context is needed, read `docs/project-control/report-mirror-log.md` for the latest mirrored state. The most recent entry date shows when the last operational summary was committed.
- After the git preflight, run the start router and the state freshness validator to detect misdirection before touching anything:

  ```
  node scripts/start-router.mjs
  node scripts/state-freshness-check.mjs
  ```

  Start router BLOCKED verdicts are hard stops. NEEDS_* verdicts require action before proceeding.
  Freshness validator FAIL results are hard stop conditions. WARN results are informational — apply the Post-Commit State Rule.
- If the start router returns `NEEDS_HANDOFF_UPDATE`, update `AI_HANDOFF.md` before continuing.
- If the start router returns `NEEDS_STATE_SYNC`, run `node scripts/state-freshness-check.mjs` and apply the State-Sync Decision Matrix.
- If any state doc would misdirect the next agent (wrong branch, wrong package, stale blocker), flag it and ask the Coordinator before proceeding.
- Do not update state docs during startup unless the startup reveals operational misdirection. Cosmetic HEAD lag alone does not require a sync commit.

## Output format

A single declaration to chat, before any file is edited:

> Package: … | Branch: … | Objective: … | Scope: … | Exclusions: … | Done: … | Remaining: … | Next action: …

Then proceed.

## Hard stop conditions

Stop and ask the Coordinator before editing anything if:

- `AI_HANDOFF.md` is missing, blank, or older than the last commit on the active branch
- The handoff branch and `git branch --show-current` disagree
- There are unexplained modified files in the working tree
- The active package is `closed` but the tree is dirty
- No package is authorized and the task involves product or app code

## Approval boundaries

- Does not commit, push, or merge.
- Does not start any package without explicit Coordinator authorization.
- Does not rewrite scope guards, locked decisions, or state docs without explicit instruction.

## Backed by

`docs/dev/session-restart-protocol.md` — full 10-step sequence.
`docs/dev/auto-management-protocol.md` — umbrella protocol.
`scripts/start-router.mjs` — automated routing; run after git preflight.
`scripts/state-freshness-check.mjs` — state freshness validator.
