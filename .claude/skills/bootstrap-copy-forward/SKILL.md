---
name: bootstrap-copy-forward
description: Run the AI Project OS bootstrap copy-forward audit — verify copy-forward readiness and produce a structured plan for copying the OS from KeepMees into Puzzle or a future repo.
---

## Purpose

Ensure that Bootstrap Core is ready to copy forward and that the copy operation will not leak KeepMees-specific state, credentials, or product scope into the target repo.

This skill reads and validates the copy-forward guide, universal-vs-project-specific map, Puzzle alignment checklist, and future repo checklist. It produces a structured report: what is ready, what needs adaptation, what must never be copied.

## When to use

- Before copying Bootstrap Core from KeepMees into Puzzle
- Before bootstrapping any new serious repo from KeepMees
- When the Coordinator asks "is the OS ready to copy forward?"
- After a major OS upgrade pass (v1.5, v1.6, v1.7, etc.)
- As part of the pre-copy documentation-watch review

**Invocation type:** User-invoked. No autonomous execution.

## Files to read

1. `docs/ai-system/bootstrap-copy-forward-guide.md` (definitive copy-forward guidance)
2. `docs/ai-system/universal-vs-project-specific-map.md` (full artifact table)
3. `docs/ai-system/puzzle-alignment-checklist.md` (Puzzle-specific gap list)
4. `docs/ai-system/future-repo-bootstrap-checklist.md` (bootstrap sequence)
5. `docs/ai-system/bootstrap-template.md` (original provisioning pattern)
6. `docs/ai-system/documentation-watch-log.md` (most recent docs-watch review)
7. `AI_HANDOFF.md` (current work state)
8. `CURRENT_STATE.md` (project snapshot)

## Required git preflight

- `git status --short` (working tree must be clean for an authoritative copy-forward audit)
- `git log --oneline -5`
- `node scripts/bootstrap-copy-forward-audit.mjs`

## Sync obligations

A bootstrap copy-forward audit is a read-only assessment — it does not modify any files. If the audit finds problems, propose fixes for Coordinator approval before starting the copy operation.

## Output format

1. Copy-forward readiness verdict: READY / NOT READY / READY WITH CAVEATS
2. Bootstrap complete status (from last OS audit result)
3. Documentation-watch review status (date of last review; any ADOPT items pending)
4. Universal asset list: files ready to copy unchanged
5. Adapt-required list: files that need changes per target repo
6. Never-copy list: files that must not be transferred
7. Puzzle-specific gap summary (from checklist)
8. Future-repo bootstrap steps remaining
9. Recommended pre-copy actions
10. Gitignore verification result

Do not start any copy operation without Coordinator authorization. Do not modify any files in either repo during the audit.

## Hard stop conditions

- Stop if OS self-audit has not been run recently or produced failures
- Stop if documentation-watch review has not been run before copy to a serious repo
- Stop if any private/local file (external-sync-map.local.json, credentials, tokens) is at risk of being included
- Stop if target repo identity (git user, remote, branch) is not confirmed before any file is staged

## Approval boundaries

- This skill produces a readiness report — it does not copy files
- The actual copy operation requires explicit Coordinator authorization
- Private files must never be transferred, regardless of any Coordinator instruction — this is a hard safety rule

## Backed by

`docs/ai-system/bootstrap-copy-forward-guide.md`
`docs/ai-system/universal-vs-project-specific-map.md`
`docs/ai-system/puzzle-alignment-checklist.md`
`docs/ai-system/future-repo-bootstrap-checklist.md`
`docs/ai-system/bootstrap-template.md`
`docs/ai-system/documentation-watch-policy.md`
`scripts/bootstrap-copy-forward-audit.mjs`
