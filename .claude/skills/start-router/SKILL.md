---
name: start-router
description: Run the repo-native start router to get a recommended session startup route — fresh session, continue, handoff, or blocked condition — before touching any file.
---

## Purpose

Query the repo-native start router (`scripts/start-router.mjs`) to get a machine-readable verdict on the safest and most appropriate session startup route. Complements `/start` by adding automated routing logic before the file-read sequence.

## When to use

- At the start of any session, before reading state files
- When unsure whether to continue an existing session or start fresh
- Before a model switch, tool switch, or long-running pass
- When the user types `/start-router`

**Invocation type:** User-invoked. Read-only — no file writes, no commits.

## Script

```
node scripts/start-router.mjs
node scripts/start-router.mjs --json
node scripts/start-router.mjs --explain
node scripts/start-router.mjs --paths
node scripts/start-router.mjs --mode fresh
node scripts/start-router.mjs --mode continue
node scripts/start-router.mjs --mode handoff
node scripts/start-router.mjs --mode package-start
node scripts/start-router.mjs --recommend-model
node scripts/start-router.mjs --context-risk
```

## Verdicts and their meaning

| Verdict | Meaning |
|---|---|
| `READY_FRESH_START` | main branch, clean, no active package, Package 5B blocked, 0 FAILs — safe to start fresh |
| `READY_CONTINUE` | authorized branch, handoff matches, 0 FAILs — safe to continue |
| `NEEDS_HANDOFF_UPDATE` | on an active branch but AI_HANDOFF.md does not describe this branch — update before switching |
| `NEEDS_STATE_SYNC` | closeout appears complete but state docs are operationally misleading — run sync check |
| `BLOCKED_DIRTY_TREE` | main branch with uncommitted changes — resolve before proceeding |
| `BLOCKED_WRONG_BRANCH` | branch mismatch with no handoff explanation — ask Coordinator |
| `BLOCKED_PACKAGE_UNAUTHORIZED` | Package 5B or product package unauthorized — stop and ask Coordinator |
| `BLOCKED_EXTERNAL_SYNC_RISK` | private/local files exposed or external apply pending — stop immediately |
| `NEEDS_COORDINATOR_DECISION` | OS gates in progress, next step needs Coordinator authorization |

## Output fields

Human output includes: verdict, branch, HEAD, dirty tree, active package, Package 5B status, latest OS gate, recommended route, command, context, model tier, Plan Mode, tool, WARNs, FAILs, state freshness summary, report mirror summary, external sync summary, Post-Commit State Rule note.

JSON output (`--json`) includes equivalent structured fields plus context_risk when `--recommend-model` or `--context-risk` is set.

## Hard stop conditions

BLOCKED verdicts are hard stops. Do not start implementation work, do not modify files, and do not continue the session until the blocking condition is resolved.

FAILs in the output must be resolved before committing or merging.

## Approval boundaries

- Does not commit, push, merge, or modify files.
- Does not call external APIs.
- Does not read credential or token file contents.

## Backed by

`docs/dev/session-restart-protocol.md`
`docs/dev/context-hygiene-protocol.md`
`docs/dev/auto-management-protocol.md`
