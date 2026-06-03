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
| Resume into | Package 3H COMPLETE — merged `1297f92` 2026-06-03. No active package. Coordinator decides next. |
| Branch | `main` |
| main HEAD | `1297f92` — merge: gate proof panel on draft book check status |
| Next action | Run `/start`. Await Coordinator authorization for next package. |
| Package 3H | COMPLETE — proof panel gated on draft book check (PAGINATION_STABILITY); Phase 23 E2E (6 tests); 2039 Node tests; E2E 53/53 seeded; 76/76 real-files; visual regression PASS |
| Package 3G | COMPLETE — lifecycle modules in browser; showBookView draft init; enterComposition hook; getGroupDraft helper; Phase 22 E2E (6 tests) |
| Package 3F | COMPLETE — `src/products/product-draft-lifecycle.js` + `src/tests/product-draft-lifecycle-tests.mjs`; 2039 Node tests; engine layer; no app code |
| Package 3E | COMPLETE — `src/products/product-draft-state.js` + `product-preflight.js`; engine layer; no manufacturing readiness API; 1935 Node tests |
| Package 3D | COMPLETE — `scripts/visual-regression-harness.mjs`; `vr:baseline` + `vr:check`; Scenario A baselines committed |
| OS audit | Operator Reliability Repair: 304 pass, 0 warn, 0 fail — BOOTSTRAP COMPLETE (`node scripts/os-self-audit.mjs`) |
| State freshness | Run `node scripts/state-freshness-check.mjs` — WARN only (cosmetic hash lag, Post-Commit State Rule) |
| Package 5A | COMPLETE — merged `297a221`. |
| Package 5B | COMPLETE — merged `dc4f86b` 2026-06-02. 1704 Node tests. Browser QA 36/36 PASS. |
| Operator Reliability Repair | Implementation complete — uncommitted. 19 files changed/created. OS audit 304/304. Notification Stop hook missing (manual user setup required — see `docs/dev/notification-setup.md`). |
| v1.7 overall | **COMPLETE** — all 6 gates merged to main 2026-06-01. |
| v1.7 Gate 6 | COMPLETE — committed `99d5515`, merged `f30ea62` 2026-06-01. Docs-watch + bootstrap copy-forward. |
| v1.7 Gate 5 | COMPLETE — merged `2b37e13` 2026-06-01. `scripts/external-sync-consistency-check.mjs` + 253 OS audit checks. |
| v1.7 Gate 4 | COMPLETE — merged `352356b` 2026-06-01. |
| v1.7 Gate 3 | COMPLETE — merged `a86ae11` 2026-06-01. |
| v1.7 Gate 2 | COMPLETE — merged `3db3074` 2026-06-01. |
| v1.7 Gate 1 | COMPLETE — merged `3c641a9` 2026-06-01. |
| Do not | Start any package without explicit Coordinator authorization; modify `index.html` / `src/**` outside an authorized package; run any `--apply` script without approval; push without explicit instruction; stage or commit `external-sync-map.local.json`, `local-sync-reports/`, `local-report-intake/`, `raw-transcripts/`, credentials, or token; browse live docs without explicit Coordinator authorization. |
| Authoritative restart prompt for Tower work | `docs/project-control/next-session-prompt.md` |

---

## Decision points if Coordinator returns next session

1. **"v1.6 COMPLETE (2026-06-01)."**
   - Gate 3 live apply run. 10 events created. 0 errors. Post-apply dry-run: all 10 NO_OP, high confidence.
   - Sync log updated. State-sync commit made on `main`.
   - Advisory: `MISSING_LOCAL_MAPPING` in post-apply dry-run — non-blocking, follow-up scoped pass recommended.

2. **"Authorize the MISSING_LOCAL_MAPPING follow-up advisory pass."**
   - Investigate why `google-calendar-sync-dry-run.mjs --live-readonly` cannot resolve os_id entries from `external-sync-map.local.json` after apply.
   - Fix the read path alignment in the dry-run script. No live calendar mutations.
   - Propose scoped commit once fix is verified.

3. **"Authorize Package 5B."**
   - First confirm main is clean and v1.6 state-sync commit is in place.
   - Prepare a scoped package prompt per Coordinator direction.
   - Do not begin implementation until explicitly approved.

4. **"Run weekly sync."**
   - Follow `docs/project-control/coordinator-weekly-sync.md` process.

5. **"Update OS layer item X."**
   - Edit only `docs/ai-system/*` or `docs/dev/*` or `docs/qa/*` as appropriate.
   - Log every change in `docs/ai-system/CHANGELOG.md` and `version-history.md`.
   - Do not commit without explicit instruction.
