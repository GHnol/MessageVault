# AI Development Relay Protocol

This document describes how AI coding agents and human reviewers hand off work in this repository.

---

## Participants

| Role | Tool | Responsibilities |
|------|------|-----------------|
| **Development** | ChatGPT Development | Architecture, review, release decisions |
| **Implementation** | Claude Code | Code edits, file operations, test runs |
| **Code generation** | Codex (optional) | Targeted code completion |
| **QA** | Human / Claude Code | Manual QA, browser testing |

---

## Standard relay flow

```
Development (ChatGPT) → Implementation (Claude Code) → QA → Development (ChatGPT)
```

1. **Development** creates a task description with scope, acceptance criteria, and any explicit constraints.
2. **Implementation** reads `AI_HANDOFF.md` and `AGENTS.md` before touching code. Works on a dedicated branch. Does not commit without instruction.
3. **Implementation** updates `AI_HANDOFF.md` when stopping or transferring. Fills in what was done, what remains, and what was tested.
4. **QA** verifies behavior using `docs/qa/manual-qa-template.md`.
5. **Development** reviews via `docs/dev/development-review-packet-template.md` and approves or sends back.

---

## Relay rules

- One active editing agent per branch at a time.
- Read `AGENTS.md`, `CLAUDE.md` (if applicable), and `AI_HANDOFF.md` before any edit session. Do not skip these steps.
- Do not commit or push without explicit user instruction.
- Scope creep is a relay failure. If you notice a related problem, note it in `AI_HANDOFF.md` and do not fix it unless instructed.
- If work is interrupted mid-task, the agent stopping must update `AI_HANDOFF.md` before exiting. Incomplete handoffs block the next agent.

### Context continuity rule

**Auto-compact is not a durable handoff.** A context summary or compact event may silently lose decisions, scope, and state agreed earlier in the session. An agent that resumes from auto-compact alone and continues implementing is operating on an unreliable foundation.

The only safe resume path is: `AI_HANDOFF.md` + `git status` + recent commits + approved package docs.

### Before-limit / before-compact handoff rule

Before reaching context pressure (approximately 70% of context window), before any auto-compact event, or before any agent switch:

1. Complete the current logical unit. Do not stop mid-function or mid-file.
2. Update `AI_HANDOFF.md` with full current state — all required fields.
3. Produce a transfer packet in the chat.
4. State what was done, what remains, and what the next agent should do first.

Do not wait until the context limit hits. Generate the handoff while there is still room to be thorough.

### Resume-from-handoff rule

When resuming after any context event, compact, or agent switch:

1. Read `AGENTS.md`, then `CLAUDE.md` (if applicable), then `AI_HANDOFF.md`.
2. Run `git status` and `git log --oneline -10`.
3. Read the relevant package docs listed in `AI_HANDOFF.md`.
4. Confirm the current package, branch, objective, approved scope, hard exclusions, files changed, tests run, and next exact action.
5. State out loud what you will do first — before touching any file.

**If `AI_HANDOFF.md` is missing, stale, or conflicts with git status:** stop and ask the Coordinator. Do not proceed from memory.

---

## Relay checkpoints

| Checkpoint | Who acts | What happens |
|-----------|----------|-------------|
| Task start | Implementation | Read handoff + AGENTS.md. Confirm scope. |
| Mid-task stop | Implementation | Write handoff with current state. |
| Pre-commit | Human | Confirm tests pass and QA is complete. |
| Pre-merge | Development | Review packet review + approval. |

---

## Branching convention

```
task/<short-description>   — new feature or task
fix/<short-description>    — bug fix
docs/<short-description>   — documentation only
```

Branches off `main`. Merge back to `main` after approval.

---

## Emergency stop

If an agent produces unexpected output or edits outside scope, stop immediately. Do not commit. Document what happened in `AI_HANDOFF.md` under "Blockers" and notify the human.
