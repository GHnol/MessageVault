# CURRENT_STATE.md — Durable Project State Snapshot

**Purpose:** The single durable answer to "where is this project right now?" Survives `/clear`, `/compact`, model switch, tool switch, and new sessions. Git is the ultimate source of truth; this file is the fast human/agent-readable summary.

**Update this file:** at every package closeout, before any `/clear` or `/compact`, before a model or tool switch, and before stopping a long session.

---

## Project identity

- **Product:** KeepMees / MessageVault — single-file web app (`index.html`) plus modular `src/` engine (KMEngine).
- **Flagship:** Message Book. KeepMees is the broader keepsake product system; Message Book is the flagship, **not** the project boundary.
- **Truth model:** Git is truth. Repo docs are durable project memory. Conversation history is **not** durable memory.

---

## State as of last update

**Last updated:** `2026-06-07` (Package 3AA — Emoji Analysis Engine — IN PROGRESS; implementation complete, verification pending)
**Updated by:** `Claude Code (Sonnet 4.6)`

| Field | Value |
|---|---|
| main HEAD | `f54e56b` — docs: close post-Package-3Z Tower catch-up |
| Active branch | `feature/emoji-analysis-engine` |
| Active pass | Package 3AA — Emoji Analysis Engine — IN PROGRESS |
| Last completed pass | Post-Package-3Z Tower Catch-Up operating pass — docs `341d714`, merged `058af68` 2026-06-07 |
| Last closed package | `Package 3Z — Extended Content Quality Checks` — FULLY COMPLETE |
| Active package | Package 3AA — Emoji Analysis Engine — IN PROGRESS (implementation complete; verification and Coordinator authorization pending) |
| Test baseline | **3068 Node tests** (24 suites — pending commit); E2E seeded 57/57; E2E real-files 159/159 expected (Phase 38: 6 tests); visual regression PASS expected |
| Package 3AA | IN PROGRESS — `src/core/emoji-analysis.js` (NEW); `scripts/fixtures/fake-emoji-conversation.txt` (NEW); `src/tests/emoji-analysis-tests.mjs` (NEW, 100 tests / 15 suites); `src/tests/km-engine-tests.mjs` (+6 → 144); `index.html` (CSS, script tag, div, binding, renderEmojiAnalysisPanel, 11 call sites, __km); `scripts/e2e-regression-harness.mjs` (Phase 38, 6 tests); docs updated |
| Package 3Z | COMPLETE — impl `4902d50`, merged `ff79f9e` 2026-06-07; extends `KMEngine.ContentQualityChecks.compute()` with 4 new WARN checks: HIGH_ATTACHMENT_RATIO, VERY_LONG_CONTENT, SHORT_CONVERSATION, SINGLE_SENDER_DOMINANT; Suite 3 enlarged + Suites 16–19 added (184 tests / 19 suites); 4 km-engine smoke (→138); Phase 37 E2E (7 tests); `CQC_EXTENDED_FIXTURE_COUNT=6`; 2962/2962 Node; no index.html changes |
| Package 3Y | COMPLETE — impl `ca8d520`, merged `e0539d2` 2026-06-07; `KMEngine.ConversationStats.compute()`; returns busiestDay/busiestDayCount/longestStreakDays/avgMessagesPerDay/totalDays/perSenderStats; zero-state for empty/invalid; perSenderStats includes senderRole:self; `#conversationStatsPanel` indigo panel; `renderConversationStatsPanel(memories)` at 11 call sites; `window.__km.renderConversationStatsPanel`; 112 new tests (`conversation-stats-tests.mjs`, 14 suites) + 6 km-engine smoke (→134); Phase 36 E2E (6 tests, 6/6 PASS); `CST_FIXTURE_COUNT=8`; 2908/2908 Node; 57/57 seeded; 146/146 real-files |
| Package 3X | COMPLETE — impl `e424825`, merged `7bdcdb5` 2026-06-07; `KMEngine.ContentQualityChecks.compute()`; 5 WARN checks (PHONE_NUMBER_AS_SENDER_NAME, RAW_URL_IN_CONTENT, EMPTY_MESSAGE, DUPLICATE_MESSAGE, SYSTEM_MESSAGE_IN_OUTPUT); `#contentQualityPanel` amber panel; `renderContentQualityPanel(memories)` at 10 call sites; `window.__km.renderContentQualityPanel`; 134 new tests (`content-quality-checks-tests.mjs`) + 6 km-engine smoke (→128); Phase 35 E2E (6 tests, 6/6 PASS); `CQC_FIXTURE_COUNT=5`; 2790/2790 Node; 57/57 seeded; 140/140 real-files |
| Package 3W | COMPLETE — impl `a60c6e3`, merged `2bf1900` 2026-06-06; `#telegramSenderPicker` div + `const telegramSenderPicker` binding + `showTelegramSenderPicker` + `applyTelegramSelfSender` + picker hide wires in WA branch / non-WA reset / Telegram branch / restore path + `window.__km.applyTelegramSelfSender`; Phase 34 E2E (6 tests, 6/6 PASS); `TG_ALICE_COUNT=4` + `TG_BOB_COUNT=4`; 2650/2650 Node; 57/57 seeded; 134/134 real-files; visual regression PASS |
| Package 3V | COMPLETE — impl `2b232f8`, merged `40a6a78` 2026-06-06; `telegram-adapter.js` script tag; Telegram routing guard in `readTxtFile()` after Instagram DM guard, before legacy TXT fallback; collision-safe (from_id + date_unixtime discriminators); no sender picker (3W); Phase 33 E2E (5 tests); 2650 Node; 57/57 seeded; 128/128 real-files; visual regression PASS |
| Package 3U | COMPLETE — impl `45d0d24`, merged `3f4e0c4` 2026-06-06; `KMEngine.telegramAdapter`; telegram-json-v1; from_id+date_unixtime discriminators; extractText() for string/array-entity; hasMedia() for photo/file/media_type; Unix seconds → ISO-8601; senderRole always contact; 91 new tests + 5 km-engine smoke (2650 Node / 21 suites); engine-only; telegram platform `supported`; STUBS array now empty; no index.html; UI wiring delivered in Package 3V; self-ID picker deferred to Package 3W |
| Package 3T | COMPLETE — impl `b01fbff`, merged `8b11f18` 2026-06-06; `#facebookSenderPicker` div + `const facebookSenderPicker` binding + `showFacebookSenderPicker` + `applyFacebookSelfSender` + picker hide wires in WA branch / non-WA reset / FB branch / restore path + `window.__km.applyFacebookSelfSender`; Phase 32 E2E (6 tests, 6/6 PASS); `FB_ALICE_COUNT=4` + `FB_CHARLIE_COUNT=4`; 2554/2554 Node; 57/57 seeded; 123/123 real-files; visual regression PASS |
| Package 3S | COMPLETE — merged `e326fba` 2026-06-06; `facebook-messenger-adapter.js` script tag; FB routing guard in `readTxtFile()` (after Android SMS, before Instagram DM — required order; magic_words discriminator prevents IG collision); Phase 31 E2E (5 tests); no sender picker (deferred to 3T); no engine changes; impl `27b3521` |
| Package 3R | COMPLETE — merged `b6c85e9` 2026-06-05; `KMEngine.facebookMessengerAdapter`; facebook-messenger-json-v1; magic_words discriminator (Array.isArray check); HTML entity decoding; media+share → attachment-placeholder; senderRole always contact; 98 new tests (17 suites) + 6 km-engine additions; 2554 Node total / 20 suites; engine-only; facebook-messenger platform `supported`; no UI wiring; no E2E; impl `f63123d` |
| Package 3Q | COMPLETE — merged `ff1c3ed` 2026-06-05; `#instagramSenderPicker` inline picker; `showInstagramSenderPicker` + `applyInstagramSelfSender`; Instagram picker hide in all non-Instagram import paths + restore; `window.__km.applyInstagramSelfSender` exposed; Phase 30 E2E (6 tests); 21/21 manual QA; no engine changes; no adapter changes; no persistence schema changes |
| Package 3P | COMPLETE — merged `d99fb84` 2026-06-05; Instagram DM JSON import routing in `readTxtFile()`; `instagram-dm-adapter.js` script tag; `accept=".txt,.xml,.json"`; drop hint + ingest card copy updated; Phase 29 E2E (5 tests); 10/10 manual QA; no engine changes; no sender picker (self-ID delivered in Package 3Q) |
| Package 3O | COMPLETE — merged `26f2633` 2026-06-05; `KMEngine.instagramDmAdapter`; instagram-dm-json-v1; Instagram DM JSON export; HTML entity decoding; media+share → attachment-placeholder; senderRole always contact; 87 new tests + 5 km-engine smoke; engine-only; instagram-dm platform `supported`; no UI wiring |
| Package 3N | COMPLETE — merged `6d61367` 2026-06-05; Android SMS XML browser import routing; `#fileInput accept=".txt,.xml"`; routing guard in `readTxtFile()`; Phase 28 E2E (6 tests); 19/19 manual QA; no engine changes; no sender picker |
| Package 3M | COMPLETE — merged `1228f41` 2026-06-05; `KMEngine.androidSmsAdapter`; android-sms-xml-v1; SMS B&R XML; DOM-free parser; type=1/2 senderRole; MMS attachment-placeholder; 84 new tests + 5 km-engine smoke; engine-only; android-sms platform `supported`; no UI wiring |
| Package 3L | COMPLETE — merged `16d0ca6` 2026-06-05; `#whatsappSenderPicker` inline picker; `showWhatsAppSenderPicker` + `applyWhatsAppSelfSender`; `renderConversation` senderRole-aware; Phase 27 E2E (6 tests); 29/29 manual QA; no engine changes |
| Package 3K | COMPLETE — merged `a048d0d` 2026-06-05; WhatsApp TXT import routing in `readTxtFile()`; script tag for `whatsapp-txt-adapter.js`; Phase 26 E2E (5 tests); 9/9 manual QA; no engine changes |
| Package 3J | COMPLETE — merged `f1eca34` 2026-06-05; `KMEngine.whatsappTxtAdapter`; bracket + hyphen format; 91 new tests; whatsapp platform `supported`; engine-only; UI wiring delivered in Package 3K |
| Package 3I | COMPLETE — merged `60cdd31` 2026-06-04; `KMEngine.ImportQualityReport.compute()`; `#importQualityPanel` after txt/chat.db import; Phase 25 E2E (4 tests); 17/17 browser QA |
| Package 5C | COMPLETE — merged `4733c32` 2026-06-04; user withdrawal (pending-review→none); cancel button in proof panel; Phase 24 E2E (4 tests); 27/27 browser QA |
| Package 3H | COMPLETE — merged `1297f92` 2026-06-03; PAGINATION_STABILITY auto-check on book view entry; proof panel gated on preflight-passed; Phase 23 E2E (6 tests); no engine changes |
| Package 3G | COMPLETE — merged `3192a15` 2026-06-03; lifecycle modules in browser; showBookView wiring; enterComposition hook; getGroupDraft helper; Phase 22 E2E (6 tests) |
| Package 3F | COMPLETE — merged `395629e` 2026-06-03; `KMEngine.ProductDraftLifecycle`; engine layer; in-place mutation of `group.productDrafts`; no app code |
| OS audit | 324 pass, 0 warn, 0 fail — BOOTSTRAP COMPLETE |
| Package 3E | COMPLETE — merged `4390038` 2026-06-02; `ProductDraftState` + `ProductPreflight`; engine layer; no manufacturing readiness API |
| Package 3D | COMPLETE — merged `645f6bd` 2026-06-02; visual regression harness; Scenario A baselines |
| Package 5B | COMPLETE — merged `dc4f86b` 2026-06-02. Browser QA 36/36 PASS. |
| OS audit | Operator Reliability Repair: 304 pass, 0 warn, 0 fail — BOOTSTRAP COMPLETE |
| Package 5B | COMPLETE — merged `dc4f86b` 2026-06-02. 1704 Node tests. Browser QA 36/36 PASS. |
| v1.7 Gate 6 | COMPLETE — committed `99d5515`, merged `f30ea62` 2026-06-01; docs-watch framework + bootstrap copy-forward guidance + 288 OS audit checks |
| v1.7 Gate 5 | COMPLETE — merged `2b37e13` 2026-06-01; `scripts/external-sync-consistency-check.mjs` + policy/schema/log/fixture/skill + 253 OS audit checks delivered |
| v1.7 Gate 4 | COMPLETE — merged `352356b` 2026-06-01; `scripts/start-router.mjs` + routing hardening + 223 OS audit checks delivered |
| v1.7 Gate 3 | COMPLETE — merged `a86ae11` 2026-06-01; `scripts/report-mirror-intake.mjs` + policy/schema/log/runbook/skill delivered |
| v1.7 Gate 2 | COMPLETE — merged `3db3074` 2026-06-01; `scripts/state-freshness-check.mjs` + decision matrix delivered |
| v1.7 Gate 1 | COMPLETE — merged `3c641a9` 2026-06-01; planning artifact at `docs/ai-system/v1-7-zero-fault-audit-plan.md` |
| v1.5 Gate 2 | COMPLETE — "AI Project OS Template" (GHnol/projects/2); 13 fields; 14 views |
| v1.6 overall | **COMPLETE** — Gate 3 live apply + advisory repair succeeded 2026-06-01 |

---

## Delivered packages (summary)

Authoritative table: `docs/command-center/current-status.md`. Packages 1 → 4E.1, 2.7, 2.8, 2.9, 5A, 5B, 3D, and 3E are COMPLETE and merged. Test baseline: **1935 Node unit tests** (14 suites) + 41 seeded E2E + 23 real-files E2E (64 combined) + visual regression check, all green. Package 5A added `proof-approval-state.js` (state model); 5B added `proof-approval-ux.js` + `#bookProofPanel`; 3D added the visual regression harness; 3E added `product-draft-state.js` + `product-preflight.js` (engine layer, no app code, no manufacturing readiness API).

---

## Gates (do not cross without authorization)

| Gate | Status |
|---|---|
| Foundation Operating System (Gate 1) | Passed by Package 2.8; strengthened by Packages 2.9, v1.3–v1.6 |
| Vendor confirmed | NO — evaluation in progress |
| `isCoverUnblocked()` | false |
| Commerce readiness (message-book) | blocked |
| Server PDF pipeline | not started |
| Designer confirmed | COMMERCIAL HOLD |
| Figma master built + approved | not started |

---

## Locked truths (do not reopen without explicit product authority)

- Message Book pagination constants and `BOOK_PAGINATION_VERSION` are scope-guarded.
- Standalone keepsake flows and Review view are off-limits without explicit instruction.
- External designer contracting is paused.
- Vendor / manufacturing scope is gated.
- Packaging / gifting scope is gated.
- Preview truth (in-app) is distinct from Figma / design truth.

---

## What is NOT started

Checkout/PDF/cover work, framework migration, visual redesign, preview renderers, vendor outreach, design hiring restart. v1.6 Gate 2 and Gate 3 (live Google Calendar sync) require separate Coordinator authorization. `index.html` app behavior is unchanged. No UI wiring for proof approval has been added.

---

## Where to look — AI Project OS layer (v1.6 — Google Calendar Live Sync)

| Question | File |
|---|---|
| What is the AI Project OS layer? | `docs/ai-system/README.md` |
| Universal standards across repos | `docs/ai-system/universal-standards.md` |
| How to bootstrap a new repo | `docs/ai-system/bootstrap-template.md` |
| OS-level changelog | `docs/ai-system/CHANGELOG.md` |
| OS version history | `docs/ai-system/version-history.md` |
| Umbrella auto-management duties | `docs/dev/auto-management-protocol.md` |
| v1.6 calendar source records | `docs/project-control/google-calendar-source-records.json` |
| v1.6 calendar source schema | `docs/project-control/google-calendar-source-schema.md` |
| v1.6 calendar sync policy (authoritative) | `docs/project-control/google-calendar-sync-policy.md` |
| v1.6 calendar sync runbook | `docs/project-control/google-calendar-sync-runbook.md` |
| v1.6 credential safety guide | `docs/project-control/google-calendar-credentials.example.md` |
| v1.6 canonical sync log | `docs/project-control/google-calendar-sync-log.md` |
| Short command interface | `.claude/commands/README.md` — 17 commands |
| Skills (canonical protocol layer) | `.claude/skills/README.md` — 16 skills |
| Closeout sync contract | `docs/dev/closeout-sync-contract.md` |
| OS self-audit | `docs/ai-system/os-self-audit-checklist.md` + `scripts/os-self-audit.mjs` |

---

## Where to look — Project Control Tower

| Question | File |
|---|---|
| Tower overview | `docs/project-control/README.md` |
| Phases 0–15 | `docs/project-control/master-roadmap.md` |
| Schedule | `docs/project-control/master-schedule.md` |
| Current sprint | `docs/project-control/current-sprint.md` |
| Backlog | `docs/project-control/backlog.md` |
| Kanban board | `docs/project-control/kanban-board.md` |
| Phase gates | `docs/project-control/phase-gates.md` |
| Decision log | `docs/project-control/decision-log.md` |
| Risk register | `docs/project-control/risk-register.md` |
| Calendar + .ics | `docs/project-control/calendar-spec.md`, `keepmees-project-calendar.ics` |

---

## Where to look

| Question | File |
|---|---|
| Universal agent rules | `AGENTS.md` |
| Claude-specific rules | `CLAUDE.md` |
| Codex-specific rules | `.codex/README.md` |
| In-flight work transfer | `AI_HANDOFF.md` |
| How to restart a session | `NEXT_SESSION_PROMPT.md` |
| Delivered package state | `docs/command-center/current-status.md` |
| AI Project OS standards | `docs/ai-system/universal-standards.md` |
| Auto-management umbrella | `docs/dev/auto-management-protocol.md` |
