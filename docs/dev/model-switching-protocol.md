# Model Switching Protocol

**Applies to:** Claude Code in this repository (and any agent that can change underlying model)
**Status:** Active — required operating protocol

---

## The warning is not an error

Claude Code may warn that switching models will be slower and use more tokens because the current conversation is cached for the current model, and the next response on the new model re-reads the full history uncached.

This is a **context-cost and continuity warning**, not a failure. Do not treat it as an error. Treat it as a prompt to checkpoint before switching.

---

## Before switching models in a long or important session

Update all three durable files:

- `AI_HANDOFF.md`
- `CURRENT_STATE.md`
- `NEXT_SESSION_PROMPT.md`

The update must include:

1. Current branch
2. `git status`
3. Recent commits
4. Changed files
5. Completed work
6. Remaining work
7. Current objective
8. Blockers
9. Risks
10. Tests/checks run
11. Tests/checks not run
12. Exact next command sequence
13. Exact restart prompt
14. Recommended commit message if at a good commit point

---

## Which model for which work

| Work type | Model |
|---|---|
| Routine mechanical edits, small doc changes, status syncs | Current / default model |
| Architecture, deep review, complex debugging | Strongest available model (e.g. Opus) |
| High-risk changes (scope-guarded areas, persistence, pagination-adjacent) | Strongest available model |
| Repeated failed attempts on the same problem | Switch up a model tier, after a handoff checkpoint |
| Major planning, Project Control Tower passes | Strongest available model |

---

## Decision flow

1. Run the start router first: `node scripts/start-router.mjs --recommend-model` — use the context_risk output to inform the switch decision.
2. If the session is large but the **same task is still active**: `/compact` before switching (preserve useful context cheaply).
3. If the task is at a boundary, the session is messy, or context is bloated: update handoff files, `/clear`, switch model, then restart from `NEXT_SESSION_PROMPT.md`.
4. Never rely on chat history alone across a model switch.
5. Git remains the source of truth. Repo docs remain durable memory.
6. Do not commit or push as a side effect of a model switch unless explicitly instructed.
7. Do not claim automatic model switching — Claude Code does not expose programmatic model control to the agent. Switching is manual (user invokes) or semi-automatic (agent recommends, user confirms). Token/context counts are user-observed or harness-reported, not agent-queryable.
8. Do not switch to the strongest tier for routine mechanical edits — see `model-routing-protocol.md` for tier guidance.

---

## Relationship to other protocols

- **Which model for which task** (routing decisions, distinct from switching mechanics): `model-routing-protocol.md`
- Timing of when to checkpoint: `context-hygiene-protocol.md`
- Handoff artifact format: `AI_HANDOFF.md` + `docs/automation/operator-mode/claude-codex-relay-protocol.md`
- Tool (Claude↔Codex) switching: `tool-switching-protocol.md`
- Umbrella auto-management duties: `auto-management-protocol.md`
