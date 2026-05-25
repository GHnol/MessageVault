---
name: os-audit
description: Run the KeepMees AI Project OS self-audit — check required files, skills, commands, docs, gitignore protections, and stale state that would misdirect the next agent.
---

## Purpose

Verify that KeepMees is a complete, working Bootstrap Core example. The OS audit checks that all required files exist, all skills and command wrappers are present, all safety protections are in place, and no stale state exists that would misdirect the next agent.

Run this before claiming the repo is "fully bootstrapped" with the AI Project OS, and after any major OS upgrade pass.

## When to use

- After any AI Project OS upgrade pass (Package 2.7, 2.8, 2.9, framework groundwork, etc.)
- Before proposing that the OS bootstrap is complete
- When the Coordinator asks "is the OS complete?"
- Before copying this OS to another repo (Puzzle, etc.)

**Invocation type:** User-invoked.

## Files to read

1. `docs/ai-system/os-self-audit-checklist.md` (the canonical checklist)
2. `docs/ai-system/README.md`
3. `docs/ai-system/universal-standards.md`
4. `.gitignore`
5. `AI_HANDOFF.md`

## Required git preflight

- `git status --short` (working tree must be clean for an authoritative audit)
- `git log --oneline -5`

Also run the optional script if available:

```
node --check scripts/os-self-audit.mjs
node scripts/os-self-audit.mjs
```

## Sync obligations

If the audit finds stale state docs that would misdirect the next agent, flag them and recommend updates. Do not auto-update without confirmation.

Apply the Post-Commit State Rule: cosmetic HEAD lag alone is not a failure. Flag as a warning, not a failure.

## Output format

A structured audit report:

**FAILURES** (missing required files or broken protections — must fix before claiming bootstrap complete)
**WARNINGS** (stale state, cosmetic lag, optional items missing — flag but do not block)
**PASS** (items verified)

For each item: status, evidence, recommended action.

Final determination:
- `BOOTSTRAP COMPLETE` — all required items pass
- `BOOTSTRAP INCOMPLETE` — list what is missing

## Hard stop conditions

- Do not claim bootstrap complete if any FAILURE remains.
- Do not inspect `index.html`, `src/**`, or `scripts/**` (app code — hard-excluded from OS audit).

## Approval boundaries

- Does not update any docs automatically.
- Does not commit or push.
- If the audit finds problems, proposes fixes; the Coordinator or user approves each fix.

## Backed by

`docs/ai-system/os-self-audit-checklist.md`
`docs/ai-system/universal-standards.md` § "What is automatic, semi-automatic, and policy-driven"
`scripts/os-self-audit.mjs` (optional script)
