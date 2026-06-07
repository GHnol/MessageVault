# Architecture Roadmap — KeepMees / MessageVault

**Last updated:** 2026-06-07 (Package 3Z — Extended Content Quality Checks — COMPLETE; impl `4902d50`, merged `ff79f9e`)
**Status:** Active

---

## Architecture posture

`index.html` is the current runtime shell only as an interim bridge. The approved near-term path is modular plain JS extraction into `src/` (KMEngine pattern). Framework and build-system migration is a tracked future decision — deferred, not rejected. Re-evaluate when render/proof architecture stabilizes or when UI state, persistence, proofing, and render specs become too complex for the current shell.

---

## Current architecture (post-Package 3Y)

```
index.html               — entire app: UI, CSS, composition logic, pagination, rendering
src/
  core/
    import-adapters.js        — adapter registry + import result shape
    import-quality-report.js  — KMEngine.ImportQualityReport; compute(memories) pure function; post-import summary metrics — Package 3I
    content-quality-checks.js — KMEngine.ContentQualityChecks; compute(memories) pure function; returns array of advisory issue objects; 9 WARN checks: PHONE_NUMBER_AS_SENDER_NAME, RAW_URL_IN_CONTENT, EMPTY_MESSAGE, DUPLICATE_MESSAGE (adjacent-only), SYSTEM_MESSAGE_IN_OUTPUT — Package 3X; HIGH_ATTACHMENT_RATIO (>80%), VERY_LONG_CONTENT (text.length>1000), SHORT_CONVERSATION (<10 messages), SINGLE_SENDER_DOMINANT (all non-system from 1 sender) — Package 3Z
    conversation-stats.js     — KMEngine.ConversationStats; compute(memories) pure function; returns { busiestDay, busiestDayCount, longestStreakDays, avgMessagesPerDay, totalDays, perSenderStats }; zero-state for empty/invalid; tie-break earliest date; perSenderStats all senders including senderRole:self, sorted count desc/name asc — Package 3Y
    normalized-memory.js      — canonical message model (NormalizedMemory)
    project-session.js        — session container
    source-platforms.js       — source platform registry (whatsapp + android-sms + instagram-dm + facebook-messenger + telegram now 'supported' — Packages 3J + 3M + 3O + 3R + 3U)
    keepsake-group.js         — KeepsakeGroup model
  adapters/
    imessage-chatdb-adapter.js
    txt-export-adapter.js
    manual-entry-adapter.js
    whatsapp-txt-adapter.js        — KMEngine.whatsappTxtAdapter; bracket + hyphen format; parse/normalizeAll/import; ADAPTER_ID whatsapp-txt-v1 — Package 3J
    android-sms-xml-adapter.js     — KMEngine.androidSmsAdapter; SMS Backup & Restore XML; type=1/2 senderRole; MMS attachment placeholder; regex-based DOM-free parser; ADAPTER_ID android-sms-xml-v1 — Package 3M
    instagram-dm-adapter.js        — KMEngine.instagramDmAdapter; Instagram DM JSON export; HTML entity decoding; media+share → attachment-placeholder; senderRole always contact; ADAPTER_ID instagram-dm-json-v1; browser-loaded (Package 3P) — Package 3O/3P
index.html (Instagram sender picker) — #instagramSenderPicker; showInstagramSenderPicker + applyInstagramSelfSender; window.__km.applyInstagramSelfSender; mirrors WhatsApp picker pattern — Package 3Q
index.html (Facebook Messenger sender picker) — #facebookSenderPicker; showFacebookSenderPicker + applyFacebookSelfSender; window.__km.applyFacebookSelfSender; mirrors Instagram DM picker pattern — Package 3T
index.html (Telegram sender picker) — #telegramSenderPicker; showTelegramSenderPicker + applyTelegramSelfSender; window.__km.applyTelegramSelfSender; mirrors Facebook Messenger picker pattern — Package 3W
index.html (content quality panel) — #contentQualityPanel; renderContentQualityPanel(memories); amber/warning tone; appears after any import with advisory issues; window.__km.renderContentQualityPanel; follows #importQualityPanel pattern — Package 3X
index.html (conversation stats panel) — #conversationStatsPanel; renderConversationStatsPanel(memories); indigo tone; chips: busiestDay, longestStreak, avg messages/day, top sender; called at all 11 import/open sites; window.__km.renderConversationStatsPanel — Package 3Y
    facebook-messenger-adapter.js  — KMEngine.facebookMessengerAdapter; Facebook Messenger JSON export; magic_words discriminator (present in FB, absent in Instagram DM); HTML entity decoding; media+share → attachment-placeholder; senderRole always contact; ADAPTER_ID facebook-messenger-json-v1; browser-loaded (Package 3S) — Package 3R/3S
    telegram-adapter.js            — KMEngine.telegramAdapter; Telegram Desktop JSON export; from_id + date_unixtime discriminators; no HTML entity decoding (plain Unicode); extractText() handles string or array-of-entities; hasMedia() checks photo/file/media_type; date_unixtime Unix seconds string → ISO-8601; senderRole always contact; ADAPTER_ID telegram-json-v1; browser-loaded (Package 3V) — Package 3U/3V
    future-adapter-stubs.js        — STUBS array is now empty (all client-side adapters promoted to real implementations)
  state/
    session-serialization.js  — serialize/restore ProjectSession
  products/
    product-statuses.js                — status enums
    product-catalog.js                 — product definitions
    product-eligibility.js             — per-product eligibility evaluators
    legacy-keepsake-types-bridge.js
    product-render-spec.js             — render spec registry (constants + 10 specs)
    product-render-spec-resolver.js    — resolve spec against a KeepsakeGroup
    prototype-preview-registry.js      — preview entry registry (constants + 6 entries for render planning targets)
    prototype-preview-resolver.js      — resolve preview readiness against a KeepsakeGroup
    product-experience-readiness.js    — combined readiness resolver (all 4 layers); EXPERIENCE_STATUS; resolveForProduct/resolveAllForGroup
    product-experience-consumer.js     — app-side bridge to ProductExperienceReadiness; null-safe; view-model layer only
    proof-approval-state.js            — KMEngine.ProofApprovalState; STATUS (5 constants); canTransition; create; transition — Package 5A
    proof-approval-ux.js               — KMEngine.ProofApprovalUX; initialize, getState, submitForReview, getStatusLabel, getAllowedUserActions, serialize, restore — Package 5B
    product-draft-state.js             — KMEngine.ProductDraftState; STATUS (5 constants); canAdvance; create; advance; per-product draft lifecycle — Package 3E
    product-preflight.js               — KMEngine.ProductPreflight; SEVERITY/CHECK_STATUS/CHECK_REGISTRY (10-check mirror); run/runAll; PAGINATION_STABILITY runnable; no manufacturing readiness API — Package 3E
    product-draft-lifecycle.js         — KMEngine.ProductDraftLifecycle; stateless coordinator; getDraft, initDraft, advanceDraft, applyPreflightResult, resetDraft; in-place mutation of group.productDrafts — Package 3F
index.html (keepsakes view)          — buildFormatAvailability() injects .ks-format-availability section per card via ProductExperienceConsumer — Package 4E
index.html (proof panel)             — #bookProofPanel, CSS, renderBookProofPanel(), save/restore wiring — Package 5B
index.html (enterComposition)        — ProductDraft lifecycle wiring: initDraft + advanceDraft none→in-progress on message-book entry; getGroupDraft test helper on window.__km — Package 3G
  tests/
    km-engine-tests.mjs
    keepsake-group-tests.mjs
    product-catalog-tests.mjs
    product-eligibility-tests.mjs
    product-render-spec-tests.mjs
    prototype-preview-registry-tests.mjs
    product-experience-readiness-tests.mjs
    product-experience-consumer-tests.mjs
    proof-approval-state-tests.mjs     — 137 tests; state model, transitions — Package 5A
    proof-approval-ux-tests.mjs        — 77 tests; UX layer API, serialize/restore — Package 5B
    product-draft-state-tests.mjs      — 90 tests; draft lifecycle, transitions, semantic guards — Package 3E
    product-preflight-tests.mjs        — 119 tests; check registry, PAGINATION_STABILITY, aggregate status — Package 3E
    product-draft-lifecycle-tests.mjs  — 104 tests; coordinator API, mutation model, all lifecycle paths, semantic guards — Package 3F
    whatsapp-txt-adapter-tests.mjs          — 91 tests; API shape, canHandle, parsing, multi-line, system messages, media, participants, rawCounts, NormalizedMemory fields, semantic guards — Package 3J
    android-sms-xml-adapter-tests.mjs       — 84 tests; API shape, canHandle accepts/rejects, SMS type=1/2 parsing, senderRole, MMS attachment placeholder, fixture rawCounts, participants, NormalizedMemory fields, provenance, no-throw, importWarnings, semantic guards — Package 3M
    facebook-messenger-adapter-tests.mjs   — 103 tests; API shape, canHandle (accepts/rejects/magic_words discriminator), fixture rawCounts, timestamp conversion, HTML entity decoding, senderRole, text/attachment normalization, NormalizedMemory fields, importWarnings, no-throw, participants, semantic guards — Package 3R
    instagram-dm-adapter-tests.mjs          — 87 tests; API shape, canHandle accepts/rejects, fixture rawCounts, timestamp conversion, HTML entity decoding (sender+content), senderRole, text/attachment normalization, NormalizedMemory fields, importWarnings, no-throw, semantic guards, participants — Package 3O
    telegram-adapter-tests.mjs              — 91 tests; API shape, canHandle (accepts/rejects IG/FB/non-Telegram/from_id discriminator), fixture rawCounts, timestamp (Unix seconds → ISO), sender extraction, text plain/array-entity concatenation, media/attachment detection, senderRole always contact, NormalizedMemory fields, importWarnings, no-throw, participants — Package 3U
```

All modules expose into `window.KMEngine`. No build step.

---

## Near-term additions (Package 3 and beyond)

DELIVERED (Package 3E, merged `4390038` 2026-06-02):
- `src/products/product-draft-state.js` — ProductDraft lifecycle state model (per-product draft container). Delivered as `ProductDraftState`.
- `src/products/product-preflight.js` — engine-side preflight infrastructure executing checks from a registry mirroring `BOOK_PREFLIGHT_CHECK_REGISTRY`. PAGINATION_STABILITY is fully runnable; the other 9 checks return not-applicable until manufacturing/vendor/PDF inputs exist. No manufacturing readiness API.

DELIVERED (Package 3F, 2026-06-03):
- `src/products/product-draft-lifecycle.js` — stateless lifecycle coordinator bridging `ProductDraftState` and `ProductPreflight` results within a `KeepsakeGroup`. Provides `getDraft`, `initDraft`, `advanceDraft`, `applyPreflightResult`, `resetDraft`. In-place mutation of `group.productDrafts`. No UI wiring; engine layer only.

DELIVERED (Package 3G, 2026-06-03):
- `index.html` — loads `product-draft-state.js`, `product-preflight.js`, `product-draft-lifecycle.js` in the browser runtime. `enterComposition()` initializes the group draft and advances none→in-progress on message-book entry (idempotent). `window.__km.getGroupDraft(groupId, typeId)` test helper for E2E session-level verification. E2E Phase 22 (6 tests): module availability, draft init, idempotency, proof panel independence, save/restore persistence.

DELIVERED (Package 3H, 2026-06-03):
- `index.html` `showBookView()` — auto-runs PAGINATION_STABILITY book check on entry for in-progress drafts: advances in-progress → ready-for-preflight → preflight-passed/failed. Uses `ProductPreflight.run('PAGINATION_STABILITY', inputs)` + `createReport([result])` only; `runAll()` not called; 9 vendor-gated checks remain not-applicable.
- `index.html` `renderBookProofPanel()` — gates "Mark ready for proof review" on all real groups reaching preflight-passed; shows user-facing "Book check complete" / "Book check needs attention" copy (no "preflight" in visible text); no new approve/revoke/request-changes controls.
- E2E Phase 23 (6 tests): book-check auto-advance, draft status verification, proof panel button gate, idempotency, save/restore, ProofApprovalUX independence.

DELIVERED (Package 5C, 2026-06-04):
- `src/products/proof-approval-state.js` — added `pending-review→none` (user withdrawal); see Package 5C closeout.
- `src/products/proof-approval-ux.js` — added `withdrawSubmission(productTypeId)`; `getAllowedUserActions('pending-review')` → `['withdraw-submission']`.
- `index.html` `renderBookProofPanel()` — cancel button + hint + CSS. E2E Phase 24 (4 tests).

DELIVERED (Package 3I, 2026-06-04):
- `src/core/import-quality-report.js` — `KMEngine.ImportQualityReport`; `compute(memories)` pure function; accepts NormalizedMemory[]; returns totalMessages, dateRange, uniqueSenderCount, senderList, selfMessageCount, contactMessageCount, attachmentOnlyCount, messagesWithReactionsCount, totalReactionCount, sourcePlatformId, messagesWithoutTimestamp, messagesWithoutText; no DOM, no side effects, Node-testable; no estimated pages or volumes.
- `index.html` — script tag for `import-quality-report.js`; `#importQualityPanel` div between search bar and chat messages; `renderImportQualityPanel(memories)` function; called from `readTxtFile()` and `openConversation()` only (not from restore path); CSS for `.import-quality-inner` and `.import-quality-chip` (light + dark mode); exposed on `window.__km`.
- `src/tests/import-quality-report-tests.mjs` — 91 tests across 12 suites.
- E2E Phase 25 (4 tests, in real-files block): panel visible, correct count, date range, hidden on fresh load.

DELIVERED (Package 3J, merged `f1eca34` 2026-06-05):
- `src/adapters/whatsapp-txt-adapter.js` — `KMEngine.whatsappTxtAdapter`; ADAPTER_ID `whatsapp-txt-v1`; bracket format `[M/D/YY, H:MM:SS AM] Sender: text` and hyphen format `M/D/YY, H:MM AM - Sender: text`; `canHandle`, `normalizeAll`, `import`; multi-line continuation; system-message skipping; media placeholder (`<Media omitted>` etc → `isAttachmentOnly: true`, text `[Attachment]`); senderRole `contact` for all senders; provenance populated.
- `src/adapters/future-adapter-stubs.js` — removed `whatsapp-txt-v1` entry; real adapter now owns that ID.
- `src/core/source-platforms.js` — WhatsApp platform `status: 'stub'` → `'supported'`; notes updated.
- `scripts/fixtures/fake-whatsapp-chat.txt` — fake-data bracket-format WhatsApp fixture (9 lines: 1 system notice, 8 messages including 1 media, 1 multi-line).
- `src/tests/whatsapp-txt-adapter-tests.mjs` — 91 tests across 14 suites.
- `src/tests/km-engine-tests.mjs` — loads `whatsapp-txt-adapter.js` before stubs; updated whatsapp platform assertion to `supported`; added 5 smoke assertions.

DELIVERED (Package 3K, merged `a048d0d` 2026-06-05):
- `index.html` — added `<script src="src/adapters/whatsapp-txt-adapter.js">` tag in adapter block; `readTxtFile()` now detects WhatsApp format via `KMEngine.whatsappTxtAdapter.canHandle(text)` and routes to `adapter.import(text)` before falling through to the existing pipe-delimited path; both paths call `renderConversation` and `renderImportQualityPanel`.
- `scripts/e2e-regression-harness.mjs` — Phase 26 (5 real-files tests): WhatsApp fixture import, chat view, message count = 8, importQualityPanel visible, sourcePlatformId = 'whatsapp'; state reset at end so Phase 12 continues from TXT state.
- Self/sender identification (senderRole = 'self') delivered in Package 3L.

DELIVERED (Package 3N, merged `6d61367` 2026-06-05):
- `index.html` — `<script src="src/adapters/android-sms-xml-adapter.js">` tag; `#fileInput` `accept=".txt,.xml"`; Android SMS routing guard in `readTxtFile()` (after WhatsApp guard + picker reset, before pipe-delimited fallback); drop zone text/hint and landing card copy updated for .xml; no engine changes; no sender picker (type=2 auto-maps to senderRole:self)
- `scripts/e2e-regression-harness.mjs` — Phase 28 (6 real-files tests): import, count=9, IQR panel, selfMessageCount=4, sourcePlatformId='android-sms'; ANDROID_FIXTURE/ANDROID_FIXTURE_COUNT/ANDROID_SELF_COUNT constants

DELIVERED (Package 3L, merged `16d0ca6` 2026-06-05):
- `index.html` — CSS/HTML/JS for `#whatsappSenderPicker` inline panel; two targeted changes to `renderConversation()` to use `senderRole` for bubble classification (with `sender==='Me'` fallback for legacy imports); new `showWhatsAppSenderPicker()` and `applyWhatsAppSelfSender()` functions; picker shown after WA import, hidden after non-WA import and on restore; `applyWhatsAppSelfSender` exposed on `window.__km`.
- `scripts/e2e-regression-harness.mjs` — Phase 27 (6 real-files tests): picker visible; Alice + Bob chips; selecting Alice → 4 `.me` rows; selfMessageCount = 4; Skip → 0 `.me` rows; non-WA import hides picker.
- No engine changes. No persistence changes.

DELIVERED (Package 3Z — Extended Content Quality Checks, impl `4902d50`, merged `ff79f9e` 2026-06-07):
- `src/core/content-quality-checks.js` — 4 new WARN checks appended to existing `compute()`: HIGH_ATTACHMENT_RATIO (attachCount/total > 0.80; excludes zero-attach corpora), VERY_LONG_CONTENT (text.length > 1000; skips isAttachmentOnly + type=attachment-placeholder), SHORT_CONVERSATION (memories.length < 10), SINGLE_SENDER_DOMINANT (nonSystemCount > 0 && uniqueNonSystemSenders.length === 1). Uses existing MAX_EXAMPLES=3 pattern. issue-object shape unchanged. 9 WARN checks total.
- `scripts/fixtures/fake-cqc-extended.txt` — 6-message WhatsApp bracket fixture; all from Alice Smith; 1st message text=1007 chars (VERY_LONG_CONTENT); messages 2–6 `<Media omitted>` (5/6=83% → HIGH_ATTACHMENT_RATIO); 6<10 (SHORT_CONVERSATION); all 6 from Alice (SINGLE_SENDER_DOMINANT).
- `src/tests/content-quality-checks-tests.mjs` — Suite 3 enlarged to 11 messages (≥10; fixes SHORT_CONVERSATION threshold conflict); Suites 16–19 added (HIGH_ATTACHMENT_RATIO, VERY_LONG_CONTENT, SHORT_CONVERSATION, SINGLE_SENDER_DOMINANT); 184 tests / 19 suites.
- `src/tests/km-engine-tests.mjs` — 4 smoke assertions for new check types (→138 total).
- `scripts/e2e-regression-harness.mjs` — `CQC_EXTENDED_FIXTURE` + `CQC_EXTENDED_FIXTURE_COUNT = 6` constants; Phase 37 (7 real-files tests): visible after extended fixture → count=6 → SHORT_CONVERSATION → HIGH_ATTACHMENT_RATIO → VERY_LONG_CONTENT → SINGLE_SENDER_DOMINANT → TXT reimport resets state for Phase 12. Phase 35 test 6 updated from panel-visibility to count assertion.
- `docs/qa/test-strategy.md` — pre-commit baseline 2908→2962 / 23 suites; real-files 146→153; Package 3Z and Phase 37 notes.
- `docs/architecture/architecture-roadmap.md` — this file; Package 3Z entry.

DELIVERED (Package 3Y — Conversation Statistics Engine, impl `ca8d520`, merged `e0539d2` 2026-06-07):
- `src/core/conversation-stats.js` — `KMEngine.ConversationStats`; IIFE module; `compute(memories)` returns `{ busiestDay, busiestDayCount, longestStreakDays, avgMessagesPerDay, totalDays, perSenderStats }`; zero-state for empty/invalid input; timezone-safe `parseDay()` using `Date.UTC`; busiestDay tie-break: earliest date wins; totalDays = inclusive calendar span; longestStreak counts consecutive unique days; avgMessagesPerDay = timestamped count / totalDays (1 decimal); perSenderStats includes all senders including `senderRole:self`, sorted count desc / name asc; pct = 1 decimal; no DOM, no side effects.
- `scripts/fixtures/fake-cst-stats.txt` — 8-message WhatsApp bracket fixture; Alice (5) + Bob (3); Jan 14–18 with gap at Jan 17; busiestDay=Jan 15 (3 msgs); longestStreak=3 (Jan 14–16); totalDays=5 (span).
- `src/tests/conversation-stats-tests.mjs` — 112 tests across 14 suites.
- `src/tests/km-engine-tests.mjs` — loads `conversation-stats.js`; `ConversationStats — smoke` suite added (+6 → 134 total).
- `index.html` — CSS for `.conversation-stats-panel` + `.conversation-stats-inner` + `.conversation-stats-chip` (indigo tone: light `#e8eaf6`/dark `#0d0f29`); dark mode overrides; `<script src="src/core/conversation-stats.js">` tag after content-quality-checks.js; `<div id="conversationStatsPanel">` after `#contentQualityPanel`; `const conversationStatsPanel` binding; `renderConversationStatsPanel(memories)` function; calls at all 11 import/open sites (same sites as `renderContentQualityPanel` + `openConversation`); `window.__km.renderConversationStatsPanel` exposed.
- `scripts/e2e-regression-harness.mjs` — `CST_FIXTURE` + `CST_FIXTURE_COUNT = 8` constants; Phase 36 (6 real-files tests): hidden before import → visible after CST import → count=8 → busiestDay chip → top-sender chip → TXT reimport resets state for Phase 12.
- `docs/qa/test-strategy.md` — Phase 36 note; real-files baseline 140 → 146; Node baseline 2790 → 2908 (23 suites).
- `docs/architecture/architecture-roadmap.md` — this file; Package 3Y entry.

DELIVERED (Package 3X — Pre-print Content Quality Checks, impl `e424825`, merged `7bdcdb5` 2026-06-07):
- `src/core/content-quality-checks.js` — `KMEngine.ContentQualityChecks`; IIFE module; `compute(memories)` returns array of `{ type, severity, count, examples, message }` issue objects; 5 advisory WARN checks; MAX_EXAMPLES=3; URL_RE case-insensitive; returns `[]` for empty/invalid input; no vendor or manufacturing inputs; follows Package 3I pattern.
- `scripts/fixtures/fake-cqc-checks.txt` — 5-message WhatsApp bracket format fixture; triggers PHONE_NUMBER_AS_SENDER_NAME (`+14155551234`), RAW_URL_IN_CONTENT (`https://example.com/promo`), DUPLICATE_MESSAGE (Alice × 2).
- `src/tests/content-quality-checks-tests.mjs` — 134 tests across 15 suites.
- `src/tests/km-engine-tests.mjs` — loads `content-quality-checks.js`; `ContentQualityChecks — smoke` suite added (+6 → 128 total).
- `index.html` — CSS for `.content-quality-panel` + `.content-quality-inner` + `.content-quality-chip` (amber/warning tone: light `#fff8e1`/dark `#1c1400`); dark mode overrides; `<script src="src/core/content-quality-checks.js">` tag after import-quality-report.js; `<div id="contentQualityPanel">` after `#importQualityPanel`; `const contentQualityPanel` binding; `renderContentQualityPanel(memories)` function; calls at all 10 same sites as `renderImportQualityPanel`; `window.__km.renderContentQualityPanel` exposed.
- `scripts/e2e-regression-harness.mjs` — `CQC_FIXTURE` + `CQC_FIXTURE_COUNT = 5` constants; Phase 35 (6 real-files tests): hidden before import → visible after CQC import → count=5 → RAW_URL warning → PHONE_NUMBER or DUPLICATE warning → clean TXT reimport hides panel + resets state for Phase 12.
- `docs/qa/test-strategy.md` — Phase 35 note; real-files baseline 134 → 140; Node baseline 2650 → 2790 (22 suites).
- `docs/architecture/architecture-roadmap.md` — this file; Package 3X entry.

DELIVERED (Package 3W — Telegram Self-Identification Sender Picker, merged `2bf1900` 2026-06-06):
- `index.html` — `<div id="telegramSenderPicker">` (after `#facebookSenderPicker`); `const telegramSenderPicker` binding; `showTelegramSenderPicker(memories)` + `applyTelegramSelfSender(senderName)` (mirror FB pattern); Telegram picker hide in WA branch, non-WA reset block, and restore path; `showTelegramSenderPicker(result.memories)` call in Telegram routing branch; `window.__km.applyTelegramSelfSender` exposed.
- `scripts/e2e-regression-harness.mjs` — `TG_ALICE_COUNT = 4` + `TG_BOB_COUNT = 4`; Phase 34 (6 real-files tests): picker visible → Alice Smith + bob_jones_99 chips → Alice Smith → 4 `.me` → selfMessageCount = 4 → Skip → 0 `.me` → non-Telegram TXT reimport hides picker + resets state for Phase 12.
- `docs/qa/test-strategy.md` — Phase 34 note; real-files baseline 128 → 134.
- `docs/architecture/architecture-roadmap.md` — this file; Package 3W entry.
- `src/core/source-platforms.js` — Telegram notes: sender picker delivered (Package 3W).

DELIVERED (Package 3V — Telegram JSON UI Wiring, merged `40a6a78` 2026-06-06):
- `index.html` — `<script src="src/adapters/telegram-adapter.js">` tag (after `facebook-messenger-adapter.js`, before `future-adapter-stubs.js`); Telegram routing guard in `readTxtFile()` after Instagram DM guard, before legacy TXT fallback — collision-safe (from_id + date_unixtime discriminators unique to Telegram; participants negative guard prevents IG/FB false positives); no sender picker (deferred to Package 3W); no accept change (`#fileInput` already accepts `.json`); no picker div; no `__km` bridge addition.
- `scripts/e2e-regression-harness.mjs` — `TELEGRAM_FIXTURE` + `TELEGRAM_FIXTURE_COUNT = 8` constants; Phase 33 (5 real-files tests): import → count = 8 → importQualityPanel → sourcePlatformId = 'telegram' → TXT reset.
- `docs/qa/test-strategy.md` — Phase 33 note; real-files baseline 123 → 128.
- `docs/architecture/architecture-roadmap.md` — this file; telegram-adapter.js marked browser-loaded.
- `src/core/source-platforms.js` — Telegram notes: UI wiring delivered (Package 3V); sender picker pending (Package 3W).

DELIVERED (Package 3U — Telegram JSON Adapter, merged `3f4e0c4` 2026-06-06):
- `src/adapters/telegram-adapter.js` — `KMEngine.telegramAdapter`; ADAPTER_ID `telegram-json-v1`; Telegram Desktop JSON export; `canHandle` uses `from_id` + `date_unixtime` as positive discriminators and `participants` + `magic_words` absence as negative discriminators; `extractText(text)` handles string or array-of-entities; `hasMedia(msg)` checks `photo` (string), `file` (string), `media_type` non-null; date_unixtime is Unix SECONDS string → `parseInt * 1000` → ISO-8601; no HTML entity decoding (Telegram uses plain Unicode); senderRole always `contact`; non-message entries (service type, null from) produce importWarnings; registered as `KMEngine.telegramAdapter` and `KMEngine.adapters['telegram-json-v1']`; engine-only (UI wiring Package 3V; self-ID picker Package 3W).
- `scripts/fixtures/fake-telegram-export.json` — 10-message fixture (Alice Smith + bob_jones_99; 8 imported / 2 skipped: service-type + null-from; includes text-array entities, photo attachment, file+media_type attachment, empty text array).
- `src/tests/telegram-adapter-tests.mjs` — 91 tests across 17 suites.
- `src/adapters/future-adapter-stubs.js` — STUBS array now empty; all client-side adapters have real implementations.
- `src/core/source-platforms.js` — telegram status `'stub'` → `'supported'`; notes updated.
- `src/tests/km-engine-tests.mjs` — loads `telegram-adapter.js`; telegram platform assertion updated to `supported`; `telegramAdapter — smoke` suite added (+5 → 122 total).

DELIVERED (Package 3T — Facebook Messenger Self-Identification Sender Picker, merged `8b11f18` 2026-06-06):
- `index.html` — `<div id="facebookSenderPicker">` after `#instagramSenderPicker`; `const facebookSenderPicker` binding; `showFacebookSenderPicker(memories)` function; `applyFacebookSelfSender(senderName)` function; Facebook picker hide in WA branch + non-WA guard block + Facebook branch call + restore path; `window.__km.applyFacebookSelfSender` exposed for E2E testability.
- `scripts/e2e-regression-harness.mjs` — `FB_ALICE_COUNT = 4` and `FB_CHARLIE_COUNT = 4` constants; Phase 32 (6 real-files tests): picker visible; Alice Johnson + charlie_b_99 chips; Alice Johnson → 4 `.me`; selfMessageCount = 4; Skip → 0 `.me`; non-Facebook reimport hides picker.
- No adapter changes. No engine changes. No persistence schema changes.

DELIVERED (Package 3S — Facebook Messenger JSON UI Wiring):
- `index.html` — `<script src="src/adapters/facebook-messenger-adapter.js">` tag (after instagram-dm-adapter.js, before future-adapter-stubs.js); Facebook Messenger routing guard in `readTxtFile()` (after Android SMS guard, before Instagram DM guard — order is required: FB must precede IG because Facebook files satisfy Instagram's canHandle; magic_words discriminator in FB's canHandle uniquely excludes Instagram files); no sender picker (self-ID deferred to Package 3T); `#fileInput` accept unchanged (`.txt,.xml,.json` already covers .json); no engine changes.
- `scripts/e2e-regression-harness.mjs` — `FB_FIXTURE` + `FB_FIXTURE_COUNT = 8` constants; Phase 31 (5 real-files tests): import → count=8 → IQR panel → sourcePlatformId='facebook-messenger' → TXT reset.
- `src/core/source-platforms.js` — facebook-messenger notes updated: UI wiring delivered (Package 3S); self-identification deferred to Package 3T.

DELIVERED (Package 3R, merged `b6c85e9` 2026-06-05):
- `src/adapters/facebook-messenger-adapter.js` — `KMEngine.facebookMessengerAdapter`; ADAPTER_ID `facebook-messenger-json-v1`; Facebook Messenger JSON export; `magic_words` discriminator distinguishes from Instagram DM; HTML entity decoding; media+share → attachment-placeholder (conservative); senderRole always `contact` (self-ID deferred to UI package); ms-epoch timestamps → ISO-8601; `importWarnings` for `is_unsent` and missing sender_name; no DOM, no external dependencies; engine-only.
- `src/adapters/future-adapter-stubs.js` — removed `facebook-messenger-json-v1` stub entry; real adapter now owns that ID.
- `src/core/source-platforms.js` — facebook-messenger platform `status: 'stub'` → `'supported'`; notes updated.
- `scripts/fixtures/fake-facebook-messenger.json` — 10-message fake fixture (2 participants: Alice Johnson + charlie_b_99; 8 imported / 2 skipped; 3 text + 5 attachment-placeholders; HTML entities; reactions field present; magic_words: []).
- `src/tests/facebook-messenger-adapter-tests.mjs` — 98 tests across 17 suites.
- `src/tests/km-engine-tests.mjs` — loads `facebook-messenger-adapter.js` before stubs; updated facebook-messenger platform assertion to `supported`; +5 smoke assertions (117 total).

DELIVERED (Package 3Q, merged `ff1c3ed` 2026-06-05):
- `index.html` — `<div id="instagramSenderPicker">` after `#whatsappSenderPicker`; `const instagramSenderPicker` binding; `showInstagramSenderPicker(memories)` function; `applyInstagramSelfSender(senderName)` function; Instagram picker hide in WA branch + non-WA guard block + Instagram branch call + restore path; `window.__km.applyInstagramSelfSender` exposed for E2E testability.
- `scripts/e2e-regression-harness.mjs` — `IG_ALICE_COUNT = 4` and `IG_BOB_COUNT = 4` constants; Phase 30 (6 real-files tests): picker visible; Alice Smith + bob_jones_99 chips; Alice Smith → 4 `.me`; selfMessageCount = 4; Skip → 0 `.me`; non-Instagram reimport hides picker.
- No adapter changes. No engine changes. No persistence schema changes.

DELIVERED (Package 3P, merged `d99fb84` 2026-06-05):
- `index.html` — `<script src="src/adapters/instagram-dm-adapter.js">` tag (after android-sms-xml-adapter.js, before future-adapter-stubs.js); `#fileInput` `accept=".txt,.xml,.json"`; Instagram DM routing guard in `readTxtFile()` (after Android SMS guard, before legacy TXT fallback); drop zone hint updated to "Supports .txt, .xml and .json exports"; landing card copy updated for .json; no engine changes; no sender picker (self-ID deferred to Package 3Q)
- `scripts/e2e-regression-harness.mjs` — Phase 29 (5 real-files tests): Instagram DM JSON import, count=8, IQR panel visible, sourcePlatformId='instagram-dm'; INSTAGRAM_FIXTURE/INSTAGRAM_FIXTURE_COUNT constants

DELIVERED (Package 3O, merged `26f2633` 2026-06-05):
- `src/adapters/instagram-dm-adapter.js` — `KMEngine.instagramDmAdapter`; ADAPTER_ID `instagram-dm-json-v1`; Instagram DM single-thread JSON export format; HTML entity decoder (named + decimal + hex character references; `&amp;` last to prevent double-decode); `hasMedia` covers photos/videos/audio_files/gifs/files/sticker; media and share objects → attachment-placeholder (conservative); senderRole always `contact` (self-ID deferred to UI package); millisecond-epoch timestamps → ISO-8601; `importWarnings` for `is_unsent` and missing sender_name; no DOM, no external dependencies; engine-only.
- `src/adapters/future-adapter-stubs.js` — removed `instagram-dm-json-v1` stub entry; real adapter now owns that ID.
- `src/core/source-platforms.js` — instagram-dm platform `status: 'stub'` → `'supported'`; notes updated.
- `scripts/fixtures/fake-instagram-dm.json` — 10-message fake fixture (2 participants: Alice Smith + bob_jones_99; 8 imported / 2 skipped; 5 text + 3 attachment; HTML entities in 3 content fields; 1 is_unsent skip + 1 missing-sender skip).
- `src/tests/instagram-dm-adapter-tests.mjs` — 87 tests across 15 suites.
- `src/tests/km-engine-tests.mjs` — loads `instagram-dm-adapter.js` before stubs; updated instagram-dm platform assertion to `supported`; +5 smoke assertions (111 total).
- No `index.html` changes. No E2E changes. UI wiring is a separate follow-on package.

DELIVERED (Package 3M, merged `1228f41` 2026-06-05):
- `src/adapters/android-sms-xml-adapter.js` — `KMEngine.androidSmsAdapter`; ADAPTER_ID `android-sms-xml-v1`; SMS Backup & Restore XML format; regex-based DOM-free parser (works in Node without jsdom); `canHandle` detects `<smses>` root with `<sms\b` or `<mms\b` message elements; `type=1` → senderRole `contact`, `type=2` → senderRole `self`; MMS elements normalized as attachment-placeholder (conservative); millisecond-epoch timestamps converted to ISO-8601; `importWarnings` for missing sender/address; no DOM, no external dependencies; engine-only.
- `src/adapters/future-adapter-stubs.js` — removed `android-sms-xml-v1` stub entry.
- `src/core/source-platforms.js` — android-sms platform `status: 'stub'` → `'supported'`; notes updated.
- `scripts/fixtures/fake-android-sms-backup.xml` — 10-element fake fixture (8 SMS, 2 MMS; 1 malformed/skipped).
- `src/tests/android-sms-xml-adapter-tests.mjs` — 84 tests across 14 suites.
- `src/tests/km-engine-tests.mjs` — loads `android-sms-xml-adapter.js` before stubs; updated android-sms platform assertion to `supported`; +5 smoke assertions.
- No `index.html` changes. No E2E changes. UI wiring is a separate follow-on package.

Still expected without architectural change:
- Preflight runners for the 9 vendor/manufacturing-gated checks (gated until vendor confirmed)
- `src/tests/` — additional test files per new module

---

## Architectural inflection points

These are decisions that, when triggered, require a deliberate architectural discussion rather than a package-scoped implementation.

### Inflection 1 — Server-side PDF pipeline

**Trigger:** when PDF generation is unblocked (vendor confirmed, cover unblocked gate met)
**Impact:** introduces a server component; `index.html` becomes a client that POSTs a render spec to a server endpoint
**Pre-work required:** `captureBookRenderSpec` must be fully specified; render spec format must be finalized with vendor

### Inflection 2A — Local / session persistence (near-term)

**Trigger:** users must be able to save and resume Message Book projects across sessions — they may take days to construct keepsake sets and must not lose progress
**Impact:** `ProjectSession` serialization (already exists in `SessionSerialization`) must be backed by IndexedDB, export/import session files, or equivalent privacy-preserving local storage
**Pre-work required:** session format versioning; migration path; UI for save/restore (Package 3 scope)

### Inflection 2B — Cloud account persistence (deferred)

**Trigger:** when cross-device account access demand justifies the infrastructure investment
**Impact:** introduces backend auth, cloud storage, account model
**Pre-work required:** local/session persistence (Inflection 2A) must exist first; server infrastructure must be established

### Inflection 3 — Checkout / commerce

**Trigger:** when vendor is confirmed and commerce readiness status changes from `blocked`
**Impact:** introduces order flow, pricing, and likely a server component for order submission
**Pre-work required:** `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` gate must be met; ProductCatalog commerce status updated

### Inflection 4 — Build system introduction

**Trigger:** when `index.html` maintenance burden exceeds acceptable threshold, OR when multiple engineers work on the codebase simultaneously
**Impact:** changes the development and delivery model significantly
**Pre-work required:** deliberate decision on framework and toolchain; migration plan for existing index.html logic

---

## Principles that govern all architecture decisions

1. No message data leaves the user's device during import.
2. The app must remain usable in a browser without any server dependency at launch.
3. Engine logic must remain unit-testable via Node.js `.mjs` files without a browser.
4. Pagination output must remain deterministic; `BOOK_PAGINATION_VERSION` gates changes.
5. PDF output must be server-side when implemented.
