# NEXT_SESSION_PROMPT.md — Session Restart Prompt

**Purpose:** Paste-ready prompt and checklist for starting any new Claude Code or Codex session, after `/clear`, after a model switch, after a tool switch, or in a brand-new session. Keeps the project continuous without relying on conversation history.

**Update this file:** before `/clear`, before a model/tool switch, and at every package closeout, so it always points the next session at the right starting state.

---

## Paste-ready resume prompt

> You are resuming work on KeepMees / MessageVault. Do not trust any memory of prior conversation. Read, in this order: `AGENTS.md`, `CLAUDE.md` (if you are Claude Code), `AI_HANDOFF.md`, `CURRENT_STATE.md`. Then run `git status --short` and `git log --oneline -10`. Then state out loud: current package, branch, objective, approved scope, hard exclusions, what is done, what remains, and your exact next action. Do not edit any file until you have done this. Do not commit or push without explicit instruction. If `AI_HANDOFF.md` is missing, stale, or conflicts with git state, stop and ask the Coordinator.

---

## Mandatory startup checklist (every session)

1. [ ] Read `AGENTS.md`
2. [ ] Read `CLAUDE.md` (if Claude Code)
3. [ ] Read `AI_HANDOFF.md`
4. [ ] Read `CURRENT_STATE.md`
5. [ ] `git branch --show-current`
6. [ ] `git status --short`
7. [ ] `git log --oneline -10`
8. [ ] Read package docs referenced by `AI_HANDOFF.md`
9. [ ] State current package, branch, objective, scope, exclusions, done, remaining, next action
10. [ ] Confirm no commit/push without explicit instruction

---

## Stop conditions

Stop and ask the Coordinator if **any** of these are true:

- `AI_HANDOFF.md` is missing, blank, or older than the last commit on the active branch
- `AI_HANDOFF.md` says one branch but `git branch` shows another
- Working tree has unexpected modified files not explained by `AI_HANDOFF.md`
- The active package in `AI_HANDOFF.md` is `closed` but there are uncommitted changes
- No package is authorized and you are being asked to write product/app code

---

## Current pointer (keep this in sync)

| Field | Value |
|---|---|
| Resume into | No package in progress. Package 2.7 COMPLETE and merged (`cebdc72`). |
| Branch | `main` |
| Next authorized target | Project Control Tower pass — NOT yet authorized (Coordinator decision pending) |
| First action | Read `AGENTS.md`/`CLAUDE.md`/`AI_HANDOFF.md`/`CURRENT_STATE.md`, run `git status` + `git log --oneline -10`; do not start code/Tower work without explicit authorization |
| Package 5A | Paused until the Project Control Tower is complete and approved |
| Do not | Build the full Project Control Tower or any Tower artifact until that pass is explicitly authorized |
