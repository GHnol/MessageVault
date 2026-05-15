# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `[idle | in-progress | blocked | ready-for-review]`

**Last updated by:** `[Claude Code | Codex | human]`

**Date:** `[YYYY-MM-DD]`

---

## Package and branch

| Field | Value |
|---|---|
| **Active package** | `[e.g. Package 3C — Real File Import Coverage]` |
| **Branch** | `[e.g. feature/e2e-real-file-import-download-coverage]` |
| **Branch base** | `[e.g. main at 904cf51]` |
| **Last commit on branch** | `[hash — message]` |

---

## Objective

> What is this work trying to accomplish? One or two sentences. Be specific.

---

## Approved scope

> What was explicitly authorized? List the authorized deliverables from the Coordinator's instruction.

- [ ] Deliverable 1
- [ ] Deliverable 2

---

## Hard exclusions

> What was explicitly out of scope or forbidden? Copy from the Coordinator's instruction.

- Do not modify `index.html`
- Do not modify `src/**`
- Do not commit `_source-intake/`
- Do not commit `.claude/settings.local.json`
- Do not start the next package

---

## Git state at handoff

```
Branch:      [branch name]
main HEAD:   [hash — message]
Working tree: [clean | modified files list]
Staged:      [staged files list or "nothing staged"]
Last push:   [Yes / No — last pushed commit hash]
```

---

## Recent commits (relevant to this work)

```
[hash] [message]
[hash] [message]
[hash] [message]
```

---

## Files changed (since last commit or since task start)

| File | What changed | Status |
|---|---|---|
| `path/to/file.js` | [description] | [done / in-progress / untested] |

---

## Work completed

- [x] Item 1 — what was done and verified
- [x] Item 2

---

## Work remaining

- [ ] Item 1 — what still needs to happen
- [ ] Item 2

---

## Tests run

| Suite / command | Result | Notes |
|---|---|---|
| `node src/tests/km-engine-tests.mjs` | pass / fail | [count or failure detail] |
| `node scripts/e2e-regression-harness.mjs` | pass / fail | |
| `node scripts/e2e-regression-harness.mjs --real-files` | pass / fail | |

---

## Manual QA

| Scenario | Result | Notes |
|---|---|---|
| — | — | — |

---

## Known risks and blockers

> Open questions, decisions needed, or things that could go wrong on resume.

| Risk / Blocker | Severity | Notes |
|---|---|---|
| — | — | — |

---

## Next exact action

> One or two sentences: exactly what the next agent or human should do FIRST. Be precise about the file, function, or command.

---

## Source-of-truth files to read first on resume

Before touching anything after a handoff or context event, read these in order:

1. `AGENTS.md` — agent rules and Context Continuity Guard
2. `CLAUDE.md` — Claude Code-specific rules (if incoming agent is Claude Code)
3. This file (`AI_HANDOFF.md`) — current state
4. `git status` — actual working tree state
5. `git log --oneline -10` — recent commit history
6. The relevant package docs (listed in Approved scope above)
7. Any files listed in "Files changed" that will be touched next

---

## Resume prompt for next Claude/Codex session

Copy and paste this prompt to onboard the next agent:

```
You are resuming work on the KeepMees / MessageVault repo.

Before touching anything:
1. Read AGENTS.md
2. Read CLAUDE.md
3. Read AI_HANDOFF.md (this file)
4. Run: git status
5. Run: git log --oneline -10
6. Read the package docs listed in AI_HANDOFF.md under "Source-of-truth files"

Do not assume the previous session's in-context state is correct — verify against current files.
Do not commit or push without explicit user instruction.
Do not start a new package without explicit Coordinator authorization.

Confirm the current package, branch, objective, approved scope, hard exclusions,
files changed, tests run, and next exact action — then state what you will do first
before doing anything.
```

---

## File-level warnings

> Anything the next agent must know before editing specific files.

| File | Warning |
|---|---|
| `index.html` | Single-file app — all logic is here. Read before editing. Do not touch standalone keepsake flows or Review view. |
| `BOOK_PAGE_LINES` / `BOOK_PAGINATION_VERSION` | Locked constants — never change without explicit Coordinator instruction and version bump. |
