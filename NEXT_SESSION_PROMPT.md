# NEXT_SESSION_PROMPT.md — Session Restart Prompt

**Purpose:** Paste-ready prompt and checklist for starting any new Claude Code or Codex session, after `/clear`, after a model switch, after a tool switch, or in a brand-new session. Keeps the project continuous without relying on conversation history.

**Update this file:** before `/clear`, before a model/tool switch, and at every package closeout, so it always points the next session at the right starting state.

---

## Paste-ready resume prompt

> You are resuming work on KeepMees / MessageVault. Do not trust any memory of prior conversation. Read, in this order: `AGENTS.md`, `CLAUDE.md` (if you are Claude Code), `AI_HANDOFF.md`, `CURRENT_STATE.md`, `docs/ai-system/README.md`, `docs/dev/auto-management-protocol.md`. Then run `git status --short` and `git log --oneline -10`. Then state out loud: current package, branch, objective, approved scope, hard exclusions, what is done, what remains, and your exact next action. Do not edit any file until you have done this. Do not commit or push without explicit instruction. If `AI_HANDOFF.md` is missing, stale, or conflicts with git state, stop and ask the Coordinator.

---

## Mandatory startup checklist (every session)

1. [ ] Read `AGENTS.md`
2. [ ] Read `CLAUDE.md` (if Claude Code) or `.codex/README.md` (if Codex)
3. [ ] Read `AI_HANDOFF.md`
4. [ ] Read `CURRENT_STATE.md`
5. [ ] Read `docs/ai-system/README.md` (new in Package 2.9 — universal AI Project OS layer entry point)
6. [ ] Read `docs/dev/auto-management-protocol.md` (umbrella)
7. [ ] `git branch --show-current`
8. [ ] `git status --short`
9. [ ] `git log --oneline -10`
10. [ ] Read package docs referenced by `AI_HANDOFF.md`
11. [ ] Decide out loud whether this is a fresh session or a continuation; if the session appears bloated/stale (long `claude --continue`, large uncached context, repeated failures), recommend a fresh repo-truth session
12. [ ] State current package, branch, objective, scope, exclusions, done, remaining, next action
13. [ ] Confirm no commit/push without explicit instruction

---

## Stop conditions

Stop and ask the Coordinator if **any** of these are true:

- `AI_HANDOFF.md` is missing, blank, or older than the last commit on the active branch
- `AI_HANDOFF.md` says one branch but `git branch` shows another
- Working tree has unexpected modified files not explained by `AI_HANDOFF.md`
- The active package in `AI_HANDOFF.md` is `closed` but there are uncommitted changes
- No package is authorized and you are being asked to write product/app code
- The session is bloated / stale and uncached context is high — checkpoint and recommend fresh restart before continuing

---

## Current pointer (keep this in sync)

| Field | Value |
|---|---|
| Resume into | Package 2.9 (AI Project OS Auto-Management Upgrade Pass) — implementation complete on branch `docs/ai-project-os-auto-management-upgrade`; awaiting Coordinator review and explicit commit instruction |
| Branch | `docs/ai-project-os-auto-management-upgrade` |
| main HEAD | `9191532` |
| Next coordination step | Coordinator reviews the diff; gives explicit "approved — run closeout" instruction if approved |
| Package 5A | Still paused — Foundation Operating System Gate (`docs/project-control/phase-gates.md` Gate 1) was passed by Package 2.8; Package 5A requires separate explicit Coordinator authorization (independent of Package 2.9 status) |
| Do not | Start Package 5A or any product/app code without explicit authorization; do not modify `index.html` / `src/**` / `scripts/**`; do not commit/push without explicit instruction; do not update `docs/ops/*` or `docs/command-center/*` in this pass (those belong to the post-merge status sync) |
| Authoritative restart prompt for Tower work | `docs/project-control/next-session-prompt.md` |

---

## Decision points if Coordinator returns to this session

1. **"Approve Package 2.9, run closeout."**
   - Pre-commit verify per `docs/qa/pre-commit-verification-template.md`
   - Stage explicitly (no `git add -A`)
   - Commit with the recommended message in `AI_HANDOFF.md`
   - Push branch
   - Merge to `main` with `--no-ff`
   - Push `main`
   - Open a separate `docs/sync-command-center-after-package-2-9` branch for the status sync (update `docs/command-center/*` + `docs/ops/artifact-index.md` + `docs/ops/backlog-roadmap.md` + `docs/ops/ai-automation-register.md`)
   - Update `CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md` to closed state
   - Produce the closeout report

2. **"Package 2.9 changes: \<list\>"**
   - Apply only the listed changes
   - Re-validate
   - Do not commit until re-approved

3. **"Authorize Package 5A."**
   - Confirm Package 2.9 is merged first
   - Confirm Foundation Operating System Gate (Gate 1) status in `phase-gates.md`
   - Prepare a scoped Package 5A package prompt (proof approval STATE model + tests only; NO checkout, NO PDF, NO preview renderers)
   - Do not begin Package 5A implementation until the prompt is reviewed and explicitly approved
