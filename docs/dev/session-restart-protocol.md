# Session Restart Protocol

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol

---

## When this applies

- A brand-new session
- After `/clear`
- After `/compact`
- After a model switch
- After a tool switch (Claude ↔ Codex)
- After an account switch
- After any context summary or auto-compact event
- Resuming work the next day

In every one of these cases, assume you know nothing that is not in the repo.

---

## The restart sequence (do not skip steps)

1. Read `AGENTS.md`
2. Read `CLAUDE.md` (if Claude Code)
3. Read `AI_HANDOFF.md`
4. Read `CURRENT_STATE.md`
5. Run `git branch --show-current`
6. Run `git status --short`
7. Run `git log --oneline -10`
8. Read the package docs referenced in `AI_HANDOFF.md`
9. Read `NEXT_SESSION_PROMPT.md` for the current pointer
10. **State out loud, before editing anything:** current package, branch, objective, approved scope, hard exclusions, what is done, what remains, next exact action

Only after step 10 may any file be edited.

---

## Verification rules

- The repo is authoritative. If `AI_HANDOFF.md` says something the code or git state contradicts, the code/git state wins — and the stale handoff must be flagged.
- Do not trust any in-context summary of file contents. Open the file.
- Do not resume implementation from a compact summary alone.

---

## Stop conditions

Stop and ask the Coordinator if:

- `AI_HANDOFF.md` is missing, blank, or older than the last commit on the active branch
- The handoff branch and `git branch` disagree
- There are unexplained modified files
- The active package is `closed` but the tree is dirty
- No package is authorized and you are being asked to write product/app code

---

## Output of a correct restart

A short statement in the chat:

> Package: … | Branch: … | Objective: … | Scope: … | Exclusions: … | Done: … | Remaining: … | Next action: …

Then proceed.

---

## Relationship to other protocols

- When to checkpoint before stopping: `context-hygiene-protocol.md`
- Model switch specifics: `model-switching-protocol.md`
- Tool switch specifics: `tool-switching-protocol.md`
- Operator Mode continuity: `docs/automation/operator-mode/context-continuity-protocol.md`
