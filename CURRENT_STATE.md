# CURRENT_STATE.md — Durable Project State Snapshot

**Purpose:** The single durable answer to "where is this project right now?" Survives `/clear`, `/compact`, model switch, tool switch, and new sessions. Git is the ultimate source of truth; this file is the fast human/agent-readable summary.

**Update this file:** at every package closeout, before any `/clear` or `/compact`, before a model or tool switch, and before stopping a long session.

---

## Phase 0 Rebuild Decision Checkpoint (2026-06-10)

**The project has shifted from the analytics-package series into a foundation rebuild.** A read-only dogfood audit of the current `index.html` MVP surfaced foundational defects (one-sided WhatsApp rendering, no media/ZIP intake, no real group-chat support, iMessage `attributedBody` message loss, stopword-only word analytics, copy/pluralization defects, a single iMessage-approximation renderer for all platforms). The decision is to rebuild on a credible foundation. **Authoritative record:** `docs/architecture/phase-0-rebuild-decisions.md`. Locked decisions:

1. **Rendering** — original premium KeepMees visual language; preserve platform-faithful data/structure; never clone native-app trade dress.
2. **Design resourcing** — no human designer; AI design stream provides art direction; Coordinator approves taste; Claude Code implements + critiques.
3. **Architecture** — client-side **Vite + React + TypeScript SPA**; staged strangler-fig migration; local-first preserved; no backend; minimal audited runtime deps; `index.html` retained until parity.
4. **Sequencing** — Phase 0 first (architecture, design tooling, fixtures, plan); then data-foundation-first verticals with UX in each; **WhatsApp iOS first vertical**.
5. **Platform priority** — WhatsApp iOS → iMessage → Instagram/Messenger → Telegram; Android SMS + WhatsApp Android deferred until fixtures exist.
6. **Design tooling** — source-of-truth not locked (finalists **Figma vs Subframe**; **Onlook** local-first option; decide via taste trial); **Framer rejected** (privacy); v0/Bolt/Lovable concept-only; verify Subframe privacy terms; **synthetic content only — never real conversations**.
7. **Fixtures** — real sanitized samples required before adapter rebuild; minimal, structure-preserving, redacted; no raw private conversations committed.

**Status:** decisions locked; **no implementation authorized** (no scaffold/deps/app changes). Next: Coordinator-led design-tool taste trial + sanitized WhatsApp iOS fixture gathering. The prior "await next development package" status is superseded by this rebuild direction.

---

## Project identity

- **Product:** KeepMees / MessageVault — single-file web app (`index.html`) plus modular `src/` engine (KMEngine).
- **Flagship:** Message Book. KeepMees is the broader keepsake product system; Message Book is the flagship, **not** the project boundary.
- **Truth model:** Git is truth. Repo docs are durable project memory. Conversation history is **not** durable memory.

---

## State as of last update

**Last updated:** `2026-06-08` (**Package 3AK — Import Insights Registry-Driven Dispatcher Consolidation COMPLETE** — impl/merge `052346f`, fast-forward merged to `main` 2026-06-08; post-merge state-sync (this update). Behavior-preserving wiring consolidation completing the Package 3AJ debt-paydown: `renderImportInsights(memories)` in `index.html` now iterates an ordered `IMPORT_INSIGHT_RENDERERS` registry array (the ten existing panel renderers in their exact current order) instead of ten hardcoded calls; all ten `renderXPanel` functions, their individual `window.__km` bridges, the literal `window.__km` bridge block, `window.__km.renderImportInsights`, and all 11 dispatcher call sites preserved unchanged; bridge block remains literal (not generated from the registry). No new engine, no new panel, no DOM/CSS/order/copy/visibility/behavior change. Baseline unchanged: 3645 Node / 30 suites; 57/57 seeded; 195/195 real-files; visual regression PASS (4/4 baselines unchanged). **Post-Package-3AK Tower Catch-Up COMPLETE** — docs `dd0ce0e`, closeout `034d181`, merged to `main` 2026-06-08. **Package 3AL — Import Insights Panel Visual Regression Coverage COMPLETE** — impl/merge `a244463`, fast-forward merged to `main` 2026-06-08; post-merge state-sync (this update). QA harness only — additive `--scenario import-panels` VR scenario capturing the ten import-insights panels via `window.__km.renderImportInsights`; 10 committed panel baselines + manifest; no `index.html`/`src`/behavior change; Scenario A VR PASS 4/4 unchanged; new import-panels VR PASS 10/10; simulate proves detection. **Post-Package-3AL Tower Catch-Up COMPLETE** — docs `a7c5676`, fast-forward merged to `main` 2026-06-08; post-merge closeout state-sync (this update); report-mirror entries `RPT-20260608-017` + `RPT-20260608-018` finalized. **Package 3AM — Import-Panels VR Verification-Gate Integration COMPLETE** — docs `beb95a4`, fast-forward merged to `main` 2026-06-08 (Green Path); post-merge closeout state-sync (this update). Docs/QA-only — wired the import-panels VR scenario into the `test-strategy.md` pre-commit gate + pre-commit template + VR guide; no app/script/baseline/count change. Active branch `main`; no active pass; no active package. Next development candidate: TBD pending Coordinator authorization. **Package 3AJ — Import Insights Consolidation remains CLOSED/COMPLETE** — impl/merge `92435b7`, state-sync `e445212`, merged to `main` 2026-06-08. **Post-Package-3AJ Tower Catch-Up remains CLOSED/COMPLETE** — docs `1260aa1`, closeout `dfeb63b`, merged to `main` 2026-06-08. **Package 3AI — Verification & Harness Reliability Hardening remains CLOSED/COMPLETE** — impl `d4a6c71`, state-sync `803cd64`, Tower Catch-Up `106f500`, closeout `a84c4f9`. Post-Package-3AI Tower Catch-Up remains CLOSED/COMPLETE. Package 3AH COMPLETE — impl `a165122`; Post-Package-3AH Tower Catch-Up COMPLETE — docs `a65d080`, closeout `47d459a`)
**Updated by:** `Claude Code (Opus 4.8)`

| Field | Value |
|---|---|
| main HEAD | `beb95a4` — docs: wire import-panels VR into pre-commit guidance (Package 3AM); pre-closeout-commit value |
| Active branch | `main` |
| Active pass | None |
| Last completed pass | Post-Package-3AL Tower Catch-Up — docs `a7c5676`, fast-forward merged to `main` 2026-06-08 |
| Last closed package | `Package 3AM — Import-Panels VR Verification-Gate Integration` — FULLY COMPLETE (Green Path docs/QA-only; wired the import-panels VR scenario into the pre-commit gate; no app/script/baseline/count change) — docs `beb95a4`, fast-forward merged to `main` 2026-06-08 |
| Active package | None |
| Test baseline | **3645 Node tests** (30 suites); E2E seeded 57/57; E2E real-files 195/195; visual regression PASS (unchanged by Package 3AJ — behavior-preserving wiring consolidation) |
| Package 3AL | COMPLETE — impl/merge `a244463`, fast-forward merged to `main` 2026-06-08; QA harness only — `scripts/visual-regression-harness.mjs` gained an additive `--scenario import-panels` path seeding deterministic memories via `window.__km.seedChatMessages` + `window.__km.renderImportInsights` and screenshotting each visible import-panel into `scripts/visual-regression-baselines/import-panels/` (10 PNG baselines + manifest); Scenario A path/thresholds/filenames/baselines untouched; NO `index.html`, NO `src/**`, NO `scripts/e2e-regression-harness.mjs`, NO fixtures; Node 3645/30 unchanged; 57 seeded; 195 real-files; Scenario A VR PASS 4/4 unchanged; import-panels VR PASS 10/10; simulate proves detection |
| Package 3AK | COMPLETE — impl/merge `052346f`, fast-forward merged to `main` 2026-06-08; `index.html` `renderImportInsights(memories)` now iterates an ordered `IMPORT_INSIGHT_RENDERERS` registry array (the 10 panel renderers in exact current order) instead of 10 hardcoded calls; all 10 `renderXPanel` functions + individual `window.__km` bridges + literal `window.__km` bridge block + `window.__km.renderImportInsights` + all 11 call sites preserved; bridge block deliberately left literal (not generated from registry); docs (architecture-roadmap, test-strategy) + state docs updated; NO new engine/panel, NO DOM/CSS/order/copy/visibility/behavior change; baseline unchanged 3645 / 30 / 57 / 195 / VR PASS |
| Package 3AJ | COMPLETE — impl/merge `92435b7`, fast-forward merged to `main` 2026-06-08; `index.html` `renderImportInsights(memories)` dispatcher delegating to the 10 import-panel renderers in order; 11 per-panel call clusters replaced with one dispatcher call each; all `renderXPanel` functions + `window.__km` bridges preserved; `window.__km.renderImportInsights` added; docs (architecture-roadmap, test-strategy) + state docs updated; NO new engine/panel, NO DOM/CSS/order/copy/visibility/behavior change; baseline unchanged 3645 / 30 / 57 / 195 / VR PASS |
| Package 3AI | COMPLETE — impl `d4a6c71`, fast-forward merged to `main` 2026-06-08; scripts + docs only; E2E harness Phase 1 startup reliability hardened (bounded server-re-probe + backoff retry; `waitForKm`/`Harness.run` failure-path diagnostics) with NO assertion/count changes; `docs/qa/test-strategy.md` changelog → 3AG/3AH; `docs/command-center/current-status.md` detail-lag → 3AH; `docs/qa/pre-commit-verification-template.md` non-staling baseline pointer (no hardcoded numbers); NO `index.html`, NO `src/**`, NO new test-runner orchestrator; baseline unchanged 3645 / 30 / 57 / 195 / VR PASS |
| Package 3AH | COMPLETE — impl `a165122`, fast-forward merged to `main` 2026-06-08; `src/core/reaction-analysis.js` (NEW) `KMEngine.ReactionAnalysis.compute()` → { totalReactions, messagesWithReactions, topReactionEmojis:[{emoji,count,rank}] MAX_TOP=5, topReactor:{reactor,count}|null, mostReactedToSender:{sender,count}|null }; reads `NormalizedMemory.reactions[]` captured in 3AG; `#reactionAnalysisPanel` rose/crimson panel (hidden when totalReactions===0); `reaction-analysis-tests.mjs` (66 tests / 14 suites incl. IQR-preservation regression); km-engine +6 → 180; Phase 44 E2E (6 tests, reuses fake-instagram-dm.json); 3645 Node / 30 suites; 57 seeded; 195 real-files; visual regression PASS; NO adapter / import-quality-report / normalized-memory changes; NO DEF-11 in-book rendering |
| Package 3AG | COMPLETE — impl `0331da0`, fast-forward merged to `main` 2026-06-08; Instagram DM + Facebook Messenger adapters map `msg.reactions` (Meta `{reaction,actor}`) → `NormalizedMemory.reactions[]` canonical `{reactor,emoji,label}`; per-adapter `mapReactions()` + `decodeReaction()` (Latin-1-escaped-UTF-8 mojibake repair + raw-preserve fallback, malformed-safe); fixtures enriched (IG 2 clean-unicode; FB 1 mojibake→👍 + 1 clean; 8 imported each unchanged); `instagram-dm-adapter-tests.mjs` 87→101 (Suite 16), `facebook-messenger-adapter-tests.mjs` 98→113 (Suite 18); 3573 Node / 29 suites; 57 seeded; 189 real-files; `ImportQualityReport` reaction counts now real for Meta imports; NO engine/panel (deferred to 3AH), NO `index.html`, NO book reaction rendering |
| Package 3AF | COMPLETE — impl `7f03889`, merged to `main` 2026-06-08; `src/core/conversation-initiation.js` (NEW); `scripts/fixtures/fake-conversation-initiation.txt` (NEW); `src/tests/conversation-initiation-tests.mjs` (NEW, 90 tests / 20 suites); `src/tests/km-engine-tests.mjs` (+6 → 174); `index.html` (pink/magenta CSS, script tag, `#conversationInitiationPanel`, binding, `renderConversationInitiationPanel`, 11 call sites, `__km`); `scripts/e2e-regression-harness.mjs` (Phase 43, 6 tests); `KMEngine.ConversationInitiation.compute()` returns { totalConversations, topInitiator, perSenderStats }; GAP_THRESHOLD_MS = 6h; 3544 Node / 29 suites; 57 seeded; 189 real-files |
| Package 3AE | COMPLETE — impl `dde558c`, merged to `main` 2026-06-08; `src/core/message-length-analysis.js` (NEW); `scripts/fixtures/fake-message-length.txt` (NEW); `src/tests/message-length-analysis-tests.mjs` (NEW, 82 tests / 15 suites); `src/tests/km-engine-tests.mjs` (+6 → 168); `index.html` (CSS, script tag, div, binding, renderMessageLengthPanel, 11 call sites, __km); `scripts/e2e-regression-harness.mjs` (Phase 42, 6 tests); docs updated |
| Package 3AD | COMPLETE — impl `6fe873c`, merged to `main` 2026-06-07; `src/core/response-time-analysis.js` (NEW); `scripts/fixtures/fake-response-time.txt` (NEW); `src/tests/response-time-analysis-tests.mjs` (NEW, 81 tests / 18 suites); `src/tests/km-engine-tests.mjs` (+6 → 162); `index.html` (CSS, script tag, div, binding, renderResponseTimePanel, 11 call sites, __km); `scripts/e2e-regression-harness.mjs` (Phase 41, 6 tests); docs updated |
| Package 3AC | COMPLETE — impl `74ff910`, merged to `main` 2026-06-07; `src/core/timing-analysis.js` (NEW); `scripts/fixtures/fake-timing-analysis.txt` (NEW); `src/tests/timing-analysis-tests.mjs` (NEW, 93 tests / 15 suites); `src/tests/km-engine-tests.mjs` (+6 → 156); `index.html` (CSS, script tag, div, binding, renderTimingAnalysisPanel, 11 call sites, __km); `scripts/e2e-regression-harness.mjs` (Phase 40, 6 tests); docs updated |
| Package 3AB | COMPLETE — impl `9290b8e`, merged `ebf9668` 2026-06-08; `src/core/word-analysis.js` (NEW); `scripts/fixtures/fake-word-analysis.txt` (NEW); `src/tests/word-analysis-tests.mjs` (NEW, 100 tests / 19 suites); `src/tests/km-engine-tests.mjs` (+6 → 150); `index.html` (CSS, script tag, div, binding, renderWordAnalysisPanel, 11 call sites, __km); `scripts/e2e-regression-harness.mjs` (Phase 39, 6 tests); docs updated |
| Package 3AA | COMPLETE — impl `0e15cfb`, merged `29c4491` 2026-06-07; `src/core/emoji-analysis.js` (NEW); `scripts/fixtures/fake-emoji-conversation.txt` (NEW); `src/tests/emoji-analysis-tests.mjs` (NEW, 100 tests / 15 suites); `src/tests/km-engine-tests.mjs` (+6 → 144); `index.html` (CSS, script tag, div, binding, renderEmojiAnalysisPanel, 11 call sites, __km); `scripts/e2e-regression-harness.mjs` (Phase 38, 6 tests); docs updated |
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
