---
name: status-summary
description: Generate the KeepMees project status summary in two versions — internal (Coordinator/project) and shareable (external/public-safe).
---

## Purpose

Produce a structured, accurate status snapshot that can be shared with advisors, business groups, or used internally by the Coordinator. Prevents accidental exposure of internal technical detail while providing a useful external-facing summary.

## When to use

- When the Coordinator needs a status update for external stakeholders
- After a package closes, to refresh the shareable status
- As part of the weekly sync ritual
- Whenever explicitly requested

**Invocation type:** User-invoked.

## Files to read

1. `CURRENT_STATE.md`
2. `docs/project-control/master-schedule.md`
3. `docs/project-control/shareable-status-summary.md`
4. `docs/project-control/kanban-board.md` (for blocked items)

## Required git preflight

- `git log --oneline -5` (to confirm HEAD and last-closed package)

## Sync obligations

After producing the summaries, ask the Coordinator whether to update `docs/project-control/shareable-status-summary.md`. Only write if the Coordinator confirms the summaries are accurate. Do not auto-update.

## Output format

Two sections:

---

**INTERNAL VERSION** (Coordinator / project work — not for external sharing)

- Current phase and active package
- What is complete (with package numbers)
- What is in progress
- What is next (authorized or pending authorization)
- What is blocked and by what gate
- Decisions pending from the Coordinator
- Key risks
- Test baseline (Node tests / E2E)

---

**SHAREABLE VERSION** (safe for business groups, advisors, external stakeholders)

- One paragraph summary, public-safe, no internal technical debt
- Current phase label (not raw package numbers)
- What is working and has been validated
- What is in active development
- What comes next at a high level
- What decisions are upcoming (no internal detail)
- No unconfirmed commitments, no vendor names if confidential, no pricing/manufacturing detail

---

## What must not appear in the shareable version

- Specific package names and numbers
- Test counts and technical implementation details
- Specific vendor or manufacturer names until confirmed
- Designer hiring status and budget decisions
- Pricing, margin, or manufacturing cost detail
- Internal project risks at the detail level
- The AI Project OS or Claude Code operating infrastructure
- Internal branch mechanics

## Hard stop conditions

- Do not write the shareable version to a file without Coordinator confirmation.
- Do not expose information from the "must not appear" list above.

## Approval boundaries

- The summaries are outputs only; writing to `shareable-status-summary.md` requires explicit Coordinator confirmation.
- Does not commit or push.

## Backed by

`docs/project-control/shareable-status-summary.md`
`docs/project-control/coordinator-weekly-sync.md`
