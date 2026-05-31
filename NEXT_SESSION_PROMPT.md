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
| Resume into | AI Project OS v1.6 Gate 2D Repair complete. Gate 2D live dry-run and Gate 3 not started. No active pass. Package 5B blocked. |
| Branch | `main` |
| main HEAD | `fe1315a` — merge: align Google Calendar OAuth paths |
| Next action | Run `/start`. Gate 2D Repair merged. Await Coordinator authorization for OAuth bootstrap (`--init-oauth`) then Gate 2D live read-only dry-run. Do not start Package 5B without explicit authorization. Do not run `--init-oauth` or `--live-readonly` without explicit authorization. |
| OS audit | Gate 2D Repair: 166 pass, 0 warn, 0 fail (`node scripts/os-self-audit.mjs`) |
| Package 5A | COMPLETE — merged `297a221`. 1603 Node tests passing. |
| Package 5B | Not started — blocked pending Coordinator authorization. |
| v1.6 Gate 1 | COMPLETE — merged `5c4bd28` 2026-05-31. |
| v1.6 Gate 2A | COMPLETE — merged `a530c56` 2026-05-31. All 11 classifications implemented and fixture-validated. |
| v1.6 Gate 2C | COMPLETE — merged `041761a` 2026-05-31. `googleapis@173.0.0` installed locally under `scripts/`. |
| v1.6 Gate 2D Repair | COMPLETE — merged `fe1315a` 2026-05-31. Canonical OAuth paths aligned. `scripts/google-calendar-auth-bootstrap.mjs` added. |
| v1.6 Gate 2D live dry-run | NOT STARTED — canonical credential at `docs/project-control/google-calendar-credentials.local.json`. Token missing. Requires `--init-oauth` (Coordinator authorization) then `--live-readonly` (Coordinator authorization). |
| v1.6 Gate 3 | NOT STARTED — requires Gate 2D live dry-run approved artifact. |
| v1.6 overall | NOT COMPLETE — complete only when Gate 3 live apply succeeds or credential/platform blocker documented. |
| Do not | Start Package 5B; modify `index.html` / `src/**`; run `--init-oauth` or `--live-readonly` without authorization; run any `--apply` script without Coordinator approval; push or merge without explicit instruction. |
| Authoritative restart prompt for Tower work | `docs/project-control/next-session-prompt.md` |

---

## Decision points if Coordinator returns next session

1. **"Authorize v1.6 Gate 2D live dry-run."**
   - googleapis already installed (`googleapis@173.0.0` under `scripts/node_modules/` — gitignored).
   - Canonical credential already at `docs/project-control/google-calendar-credentials.local.json` (gitignored).
   - Authorize OAuth bootstrap: `node scripts/google-calendar-auth-bootstrap.mjs --init-oauth` (opens browser OAuth, writes `docs/project-control/google-calendar-token.local.json`).
   - Verify: `node scripts/google-calendar-auth-bootstrap.mjs --auth-status` — expect `STATUS: READY`.
   - Authorize live dry-run: `node scripts/google-calendar-sync-dry-run.mjs --live-readonly`.
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
