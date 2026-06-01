---
name: package-start
description: Run the pre-flight sequence for a newly authorized package — confirm authorization, read scope, create branch, and declare the first exact action before touching any file.
---

## Purpose

Prevent unauthorized packages from starting and ensure every new package begins with a clean repo state, an explicitly confirmed scope, and a named branch. The package-start skill is the gate between "authorized" and "in progress."

## When to use

- When the Coordinator has explicitly authorized a new package
- When restarting after a break if no branch exists yet for the authorized package
- When resuming a package that was started but the current session is fresh

**Invocation type:** User-invoked. Requires explicit Coordinator authorization as a hard prerequisite.

## Files to read (in order)

1. `AGENTS.md`
2. `CLAUDE.md`
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`
5. The package instruction document provided by the Coordinator (required — no default)

## Required git preflight

Run in parallel:

- `git branch --show-current`
- `git status --short`
- `git log --oneline -5`

Confirm: remote is correct, git identity matches KeepMees repo, working tree is clean.

Then run the start router in package-start mode:

```
node scripts/start-router.mjs --mode package-start
```

BLOCKED verdicts are hard stops — do not create a branch or begin implementation until resolved.

## Sync obligations

- Before creating the package branch, verify that `AI_HANDOFF.md` status is `closed` (no in-progress work).
- After creating the branch, update `AI_HANDOFF.md` to reflect the new package and branch.
- Update `CURRENT_STATE.md` to show the new active package and branch.
- Update `NEXT_SESSION_PROMPT.md` to point at the package instruction.

These updates are part of the package-start flow, not a separate commit.

## Output format

State out loud, before editing any file:

> Package: … | Branch: … | Objective: … | Approved scope: … | Hard exclusions: … | First exact action: …

Then create the branch and begin.

## Hard stop conditions

- Do not proceed if no package instruction has been provided or explicitly authorized.
- Do not proceed if the working tree has unexpected modified files.
- Do not proceed if `AI_HANDOFF.md` says another agent is mid-task on this branch.
- Do not proceed if being asked to write product/app code with no authorized package.
- Do not proceed if the start router returns a BLOCKED verdict.
- Do not start Package 5B without explicit Coordinator authorization and a clean READY verdict from the start router.
- Do not start a new package inside a bloated session — recommend `/clear` and a fresh session first.

## Approval boundaries

- Does not commit or push.
- Package authorization is the only gate that unlocks this skill.
- Scope guards (pagination constants, `BOOK_PAGINATION_VERSION`, Review view, etc.) remain in force regardless of the package instruction.

## Backed by

`docs/dev/session-restart-protocol.md`
`docs/dev/agent-scope-boundaries.md`
`docs/dev/package-boundary-closeout-protocol.md` § "Next-package gating"
