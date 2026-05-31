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
5. [ ] Read `docs/ai-system/README.md` (universal AI Project OS layer entry point)
6. [ ] Read `docs/dev/auto-management-protocol.md` (umbrella)
7. [ ] `git branch --show-current`
8. [ ] `git status --short`
9. [ ] `git log --oneline -10`
10. [ ] Read package docs referenced by `AI_HANDOFF.md`
11. [ ] Decide out loud whether this is a fresh session or a continuation; if the session appears bloated/stale, recommend a fresh repo-truth session
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
| Resume into | AI Project OS v1.6 Gate 2A complete. Gate 2B (live dry-run) and Gate 3 (live apply) not started. No active pass. Package 5B blocked. |
| Branch | `main` |
| main HEAD | `a530c56` — merge: complete Google Calendar live dry-run comparison logic |
| Next action | Run `/start`. v1.6 Gate 2A complete — no active pass. Await Coordinator decision on Gate 2B authorization (googleapis install approval + credential setup). Do not start Package 5B without explicit authorization. Do not run Gate 2B or Gate 3 without explicit authorization. |
| OS audit | Gate 2A: 159 pass, 0 warn, 0 fail (`node scripts/os-self-audit.mjs`) |
| Package 5A | COMPLETE — merged `297a221`. 1603 Node tests passing. |
| Package 5B | Not started — blocked pending Coordinator authorization. |
| v1.6 Gate 1 | COMPLETE — merged `5c4bd28` 2026-05-31. |
| v1.6 Gate 2A | COMPLETE — merged `a530c56` 2026-05-31. All 11 classifications implemented and fixture-validated. POSSIBLE_DUPLICATE blocks Gate 3. |
| v1.6 Gate 2B | NOT STARTED — requires Coordinator authorization + googleapis install (`cd scripts && npm install googleapis`) + credential setup. |
| v1.6 Gate 3 | NOT STARTED — requires Gate 2B approved artifact. |
| v1.6 overall | NOT COMPLETE — complete only when Gate 3 live apply succeeds or credential/platform blocker documented. |
| Do not | Start Package 5B; modify `index.html` / `src/**`; run Gate 2B or Gate 3 without authorization; run any `--apply` script without Coordinator approval; install googleapis without Coordinator approval; push or merge without explicit instruction. |
| Authoritative restart prompt for Tower work | `docs/project-control/next-session-prompt.md` |

---

## Decision points if Coordinator returns next session

1. **"Authorize v1.6 Gate 2B."**
   - Approve googleapis install: `cd scripts && npm install googleapis` (does not touch root `package.json`).
   - Configure credentials per `docs/project-control/google-calendar-credentials.example.md`.
   - Run `node scripts/google-calendar-sync-dry-run.mjs --live-readonly`.
   - Save artifact to `local-sync-reports/`; Coordinator reviews delta; record in `google-calendar-sync-log.md`.

2. **"Authorize v1.6 Gate 3."**
   - Requires Gate 2 approved artifact with no unresolved DUPLICATE_DETECTED or ADOPTION_REQUIRED items.
   - Run `node scripts/google-calendar-sync-apply.mjs --apply --confirm-live-calendar-apply --approved-dry-run <path>`.
   - Update sync log; propose state-sync commit.

3. **"Authorize the next product package."**
   - First confirm main is clean and v1.6 state is accurate.
   - Prepare a scoped package prompt per Coordinator direction.
   - Do not begin implementation until explicitly approved.

4. **"Run weekly sync."**
   - Follow `docs/project-control/coordinator-weekly-sync.md` process.

5. **"Update OS layer item X."**
   - Edit only `docs/ai-system/*` or `docs/dev/*` or `docs/qa/*` as appropriate.
   - Log every change in `docs/ai-system/CHANGELOG.md` and `version-history.md`.
   - Do not commit without explicit instruction.
