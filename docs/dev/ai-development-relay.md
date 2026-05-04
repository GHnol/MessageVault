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
- Read `AI_HANDOFF.md` before any edit session. Do not skip this step.
- Do not commit or push without explicit user instruction.
- Scope creep is a relay failure. If you notice a related problem, note it in `AI_HANDOFF.md` and do not fix it unless instructed.
- If work is interrupted mid-task, the agent stopping must update `AI_HANDOFF.md` before exiting. Incomplete handoffs block the next agent.

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
