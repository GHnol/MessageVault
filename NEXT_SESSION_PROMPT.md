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
| Resume into | Package 3U — Telegram JSON Adapter — IN PROGRESS; implementation complete; awaiting commit instruction |
| Branch | `feature/telegram-json-adapter` |
| main HEAD | `8b11f18` — merge: add Facebook Messenger self-identification sender picker (Package 3T) |
| Next action | Run `/start`. Read `AI_HANDOFF.md`. Confirm branch `feature/telegram-json-adapter`. Verify 2650/2650 Node tests green. Await Coordinator commit instruction. Do not commit or push without explicit instruction. |
| Package 3U | IN PROGRESS — `KMEngine.telegramAdapter`; telegram-json-v1; from_id+date_unixtime discriminators; extractText() for string/array entities; hasMedia() for photo/file/media_type; Unix seconds → ISO-8601; senderRole always contact; 91 new tests (telegram-adapter-tests.mjs) + 5 km-engine smoke; 2650 Node / 21 suites; engine-only; telegram platform `supported`; STUBS array now empty; no index.html |
| Package 3T | COMPLETE — impl `b01fbff`, merged `8b11f18` 2026-06-06; `#facebookSenderPicker` + `showFacebookSenderPicker` + `applyFacebookSelfSender` + picker hide wires + `window.__km.applyFacebookSelfSender`; Phase 32 E2E (6 tests); 2554/2554 Node; 57/57 seeded; 123/123 real-files; visual regression PASS |
| Package 3S | COMPLETE — `facebook-messenger-adapter.js` script tag; FB routing guard in `readTxtFile()` (after Android SMS, before Instagram DM — required order); Phase 31 E2E (5 tests); 2554/2554 Node; 57/57 seeded; 117/117 real-files; visual regression PASS; no sender picker (deferred to 3T); no engine changes; impl `27b3521`, merged `e326fba` 2026-06-06 |
| Package 3R | COMPLETE — `KMEngine.facebookMessengerAdapter`; facebook-messenger-json-v1; magic_words discriminator (Array.isArray check); HTML entity decoding; media+share → attachment-placeholder; senderRole always contact; 98 new tests (17 suites) + 6 km-engine additions; 2554 Node / 20 suites; engine-only; facebook-messenger platform `supported`; no UI wiring; no E2E; impl `f63123d`, merged `b6c85e9` 2026-06-05 |
| Package 3Q | COMPLETE — `#instagramSenderPicker` inline picker; `showInstagramSenderPicker` + `applyInstagramSelfSender`; picker hides on all non-Instagram paths + restore; `window.__km.applyInstagramSelfSender` exposed; Phase 30 E2E (6 tests); 112/112 real-files; 21/21 manual QA; no engine/adapter/persistence changes; impl `8ca92c4`, merged `ff1c3ed` 2026-06-05 |
| Package 3P | COMPLETE — Instagram DM JSON routing in `readTxtFile()`; `instagram-dm-adapter.js` script tag; `accept=".txt,.xml,.json"`; Phase 29 E2E (5 tests); 106/106 real-files; 10/10 manual QA; no engine changes; no sender picker (delivered in Package 3Q); impl `fa6f6f2`, merged `d99fb84` 2026-06-05 |
| Package 3O | COMPLETE — `KMEngine.instagramDmAdapter`; instagram-dm-json-v1; Instagram DM JSON export; HTML entity decoding; media+share → attachment-placeholder; senderRole always contact; 87 new tests + 5 km-engine smoke (2450 Node total / 19 suites); engine-only; instagram-dm platform `supported`; no UI wiring; impl `ebb7a55`, merged `26f2633` 2026-06-05 |
| Package 3M | COMPLETE — `KMEngine.androidSmsAdapter`; android-sms-xml-v1; SMS Backup & Restore XML; DOM-free parser; type=1/2 senderRole; MMS attachment-placeholder; android-sms platform `supported`; 84 new tests + 5 km-engine smoke (2358 Node total); engine-only; no UI wiring; no E2E; no visual regression; impl `e5bc179`, merged `1228f41` 2026-06-05 |
| Package 3L | COMPLETE — `#whatsappSenderPicker` inline picker; `showWhatsAppSenderPicker` + `applyWhatsAppSelfSender`; `renderConversation` senderRole-aware; Phase 27 E2E (6 tests); 29/29 manual QA; 2269 Node; 57/57 seeded; 95/95 real-files; visual regression PASS; no engine changes; merged `16d0ca6` 2026-06-05 |
| Package 3K | COMPLETE — `readTxtFile()` WhatsApp detection guard; `whatsapp-txt-adapter.js` script tag; Phase 26 E2E (5 tests); 2269 Node; 57/57 seeded; 89/89 real-files; visual regression PASS; 9/9 manual QA; merged `a048d0d` 2026-06-05 |
| Package 3J | COMPLETE — `KMEngine.whatsappTxtAdapter`; bracket + hyphen formats; 91 new tests (`whatsapp-txt-adapter-tests.mjs`); 5 km-engine smoke tests; 2269 Node; E2E not required; engine-only; whatsapp platform `supported`; merged `f1eca34` 2026-06-05 |
| Package 3I | COMPLETE — `KMEngine.ImportQualityReport.compute()`; `#importQualityPanel` after txt/chat.db import; Phase 25 E2E (4 tests); 2173 Node; 57/57 seeded; 84/84 real-files; 17/17 browser QA; merged `60cdd31` 2026-06-04 |
| Package 5C | COMPLETE — user withdrawal (pending-review→none); cancel button in proof panel; Phase 24 E2E (4 tests); 2082 Node; 57/57 seeded; 80/80 real-files; 27/27 browser QA; merged `4733c32` 2026-06-04 |
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
