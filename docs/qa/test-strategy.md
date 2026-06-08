# Test Strategy — KeepMees / MessageVault

**Status:** ACTIVE (formalized in Package 2.9; visual regression added in Package 3D; updated to 2039 baseline in Package 3F; E2E Phase 22 added in Package 3G; updated to 2082 baseline in Package 5C; E2E Phase 24 added in Package 5C; updated to 2173 baseline in Package 3I; E2E Phase 25 added in Package 3I; updated to 2269 baseline in Package 3J; E2E Phase 26 added in Package 3K — real-files total 89; E2E Phase 27 added in Package 3L — real-files total 95; updated to 2358 baseline in Package 3M — android-sms-xml-adapter-tests.mjs added; E2E Phase 28 added in Package 3N — real-files total 101; updated to 2450 baseline in Package 3O — instagram-dm-adapter-tests.mjs added; E2E Phase 29 added in Package 3P — real-files total 106; E2E Phase 30 added in Package 3Q — real-files total 112; updated to 2554 baseline in Package 3R — facebook-messenger-adapter-tests.mjs added; E2E Phase 31 added in Package 3S — real-files total 117; E2E Phase 32 added in Package 3T — real-files total 123; updated to 2650 baseline in Package 3U — telegram-adapter-tests.mjs added; E2E Phase 33 added in Package 3V — real-files total 128; E2E Phase 34 added in Package 3W — real-files total 134; updated to 2790 baseline in Package 3X — content-quality-checks-tests.mjs added; E2E Phase 35 added in Package 3X — real-files total 140; updated to 2908 baseline in Package 3Y — conversation-stats-tests.mjs added; E2E Phase 36 added in Package 3Y — real-files total 146; updated to 2962 baseline in Package 3Z — content-quality-checks-tests.mjs enlarged to 184 tests + 4 km-engine smoke; E2E Phase 37 added in Package 3Z — real-files total 153; updated to 3068 baseline in Package 3AA — emoji-analysis-tests.mjs added; E2E Phase 38 added in Package 3AA — real-files total 159; updated to 3174 baseline in Package 3AB — word-analysis-tests.mjs added; E2E Phase 39 added in Package 3AB — real-files total 165; updated to 3273 baseline in Package 3AC — timing-analysis-tests.mjs added; E2E Phase 40 added in Package 3AC — real-files total 171).
**Last updated:** 2026-06-07 (Package 3AC — Message Timing Analysis Engine — IN PROGRESS; test baseline 3273 / 26 suites)
**Owner:** Development stream / Claude Code under Operator Mode.

This document is the single answer to "what tests exist, what should be added, and when do they run?" for KeepMees. It is intentionally first-class — testing is not cleanup-later.

---

## The six layers

KeepMees uses six distinct test layers. Each has a different cost, a different fidelity, and a different trigger.

### Layer 1 — Node unit tests (`src/tests/*.mjs`)

**What:** Pure JavaScript tests, run by `node` directly. No DOM, no browser. Vm-module pattern for any test that needs to load the engine.

**Suites and counts (as of Package 3AC — confirmed baseline 3273 / 26 suites):**

| Suite | Tests | Coverage |
|---|---|---|
| `timing-analysis-tests.mjs` | 93 | TimingAnalysis.compute(): API shape, empty/null/non-array zero-state, no-valid-timestamps zero-state, single message hour/day, hourlyDistribution 24-slot accuracy, dailyDistribution 7-slot accuracy, peakHour computation (incl. midnight/midnight-edge), peakDayOfWeek computation (incl. Sunday/Saturday), null/missing/invalid/falsy timestamps skipped, peakHour tie-break (lowest index wins), peakDayOfWeek tie-break (lowest index wins), multi-sender sender-agnostic, no-throw on malformed entries, semantic guards (pure, no DOM, only exposes compute, no BOOK_PAGINATION_VERSION/BOOK_PARITY) — Package 3AC |
| `word-analysis-tests.mjs` | 100 | WordAnalysis.compute(): API shape, empty/null/invalid zero-state, attachment-only exclusion, basic word extraction, lowercase normalization, punctuation stripping, word accumulation across messages, totalWords, avgWordsPerMessage (rounded to 1 decimal), topWords sorting/ranking/MAX_TOP=10, tie-breaking (count desc then word asc), topWordSender, topWordSender tie-breaking (wordCount desc then name asc), multi-sender scenario, blank/empty text, malformed/null entries no-throw, fixture behavior, semantic guards — Package 3AB |
| `emoji-analysis-tests.mjs` | 100 | EmojiAnalysis.compute(): API shape, empty/null/invalid zero-state, basic emoji extraction, repeated emoji/count accumulation, totalEmojiCount, uniqueEmojiCount, topEmojis sorting/ranking/MAX_TOP=5, tie-breaking (count desc then emoji string asc), mostEmojifiedSender, mostEmojifiedSender tie-breaking (count desc then name asc), ZWJ+skin-tone sequences, keycap+special sequences, fixture behavior, semantic guards (no ProductDraft/BOOK_PAGINATION_VERSION/BOOK_PARITY, compute is pure, only exposes compute) — Package 3AA |
| `conversation-stats-tests.mjs` | 112 | ConversationStats.compute(): API shape, empty/invalid zero-state, single memory, busiestDay (tie-break, null-ts), longestStreak (consecutive/gap/all-same), totalDays (span), avgMessagesPerDay (rounding/timestamped-only), perSenderStats ordering (count desc, name asc tie-break), includes senderRole:self, excludes blank senders, pct calculation, malformed entries, immutability, semantic guards — Package 3Y |
| `content-quality-checks-tests.mjs` | 184 | ContentQualityChecks.compute(): API shape, empty/invalid input, clean corpus, PHONE_NUMBER_AS_SENDER_NAME (dedup, multiple, false positives), RAW_URL_IN_CONTENT (http/https, edge cases), EMPTY_MESSAGE (whitespace/null, attachment exclusion, example sender), DUPLICATE_MESSAGE (adjacent-only, same-sender, multiple pairs), SYSTEM_MESSAGE_IN_OUTPUT (senderRole:system, WhatsApp/deleted text), issue structure contract, malformed entries, known check types, all-WARN severity, semantic guards — Package 3X; HIGH_ATTACHMENT_RATIO (>80% attachment-only, pct rounding, examples cap), VERY_LONG_CONTENT (text.length>1000, skip attachment-only, examples truncation), SHORT_CONVERSATION (<10 messages, boundary, empty examples), SINGLE_SENDER_DOMINANT (1 unique non-system sender, boundary, senderRole:system excluded), Suite 3 enlarged (≥10 messages) — Package 3Z |
| `telegram-adapter-tests.mjs` | 91 | Telegram JSON adapter: API shape, canHandle (accepts/rejects IG/FB/non-Telegram), from_id discriminator, fixture rawCounts, timestamp (Unix seconds → ISO), sender extraction, text plain/array-entity concatenation, media/attachment detection, senderRole always contact, NormalizedMemory fields, importWarnings, no-throw, participants — Package 3U |
| `facebook-messenger-adapter-tests.mjs` | 98 | Facebook Messenger JSON adapter: API shape, canHandle (accepts/rejects/magic_words discriminator), fixture rawCounts, timestamp conversion, HTML entity decoding (sender + content), senderRole, text normalization, media/attachment normalization (photo/video/audio/share/sticker/gif), NormalizedMemory fields, importWarnings, no-throw, participants, semantic guards — Package 3R |
| `instagram-dm-adapter-tests.mjs` | 87 | Instagram DM JSON adapter: API shape, canHandle (accepts/rejects), fixture rawCounts, timestamp conversion, HTML entity decoding (sender + content), senderRole, text normalization, media/attachment normalization, NormalizedMemory fields, importWarnings, no-throw, semantic guards, participants — Package 3O |
| `android-sms-xml-adapter-tests.mjs` | 84 | Android SMS XML adapter: API shape, canHandle (accepts/rejects), SMS type=1/type=2 parsing, senderRole derivation, MMS attachment placeholder, fixture rawCounts, participants, NormalizedMemory fields, provenance, no-throw, importWarnings, semantic guards — Package 3M |
| `whatsapp-txt-adapter-tests.mjs` | 91 | WhatsApp adapter: API shape, canHandle (bracket/hyphen/rejects), parsing, multi-line, system-message filtering, media placeholders, participants, rawCounts, NormalizedMemory fields, no-throw, semantic guards — Package 3J |
| `import-quality-report-tests.mjs` | 91 | ImportQualityReport.compute(): API shape, all metric fields, edge cases, semantic guards — Package 3I |
| `km-engine-tests.mjs` | 156 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms; +5 whatsapp smoke assertions (Package 3J); +5 android-sms smoke assertions (Package 3M); +5 instagram-dm smoke assertions (Package 3O); +1 facebook-messenger platform assertion + 5 facebook-messenger smoke assertions (Package 3R); +5 telegram smoke assertions (Package 3U); +6 ContentQualityChecks smoke assertions (Package 3X); +6 ConversationStats smoke assertions (Package 3Y); +4 extended CQC smoke assertions (HIGH_ATTACHMENT_RATIO, VERY_LONG_CONTENT, SHORT_CONVERSATION, SINGLE_SENDER_DOMINANT — Package 3Z); +6 EmojiAnalysis smoke assertions (Package 3AA); +6 WordAnalysis smoke assertions (Package 3AB); +6 TimingAnalysis smoke assertions (Package 3AC) |
| `keepsake-group-tests.mjs` | 43 | KeepsakeGroup data model |
| `product-catalog-tests.mjs` | 127 | ProductStatuses, ProductCatalog, required fields |
| `product-eligibility-tests.mjs` | 76 | Per-product eligibility evaluators, LegacyKeepsakeTypesBridge |
| `project-persistence-tests.mjs` | 157 | Snapshot, validate, deserialize, restore; proofApprovalStates; productDrafts validation + restore normalization (Package 3A + 5B + 3E) |
| `operator-inbox-processor-tests.mjs` | 85 | Inbox processor extraction + processFile (Package 2.6, 2.6.1) |
| `product-render-spec-tests.mjs` | 341 | Render specs + resolver; render-planning-target gate (Package 4A) |
| `prototype-preview-registry-tests.mjs` | 215 | Preview registry + resolver (Package 4B) |
| `product-experience-readiness-tests.mjs` | 337 | Combined readiness resolver across all 4 product layers (Package 4C) |
| `product-experience-consumer-tests.mjs` | 35 | Null-safe app-side bridge (Package 4D) |
| `proof-approval-state-tests.mjs` | 155 | Proof approval state model, transitions, withdrawal (pending-review→none) — Package 5A + 5C |
| `proof-approval-ux-tests.mjs` | 102 | Proof approval UX: initialize, submit, withdraw, serialize/restore, getAllowedUserActions, prohibited fields — Package 5B + 5C |
| `product-draft-state-tests.mjs` | 90 | ProductDraft lifecycle state machine, transitions, semantic guards (Package 3E) |
| `product-preflight-tests.mjs` | 119 | Preflight check registry, PAGINATION_STABILITY runner, aggregate status, semantic guards (Package 3E) |
| `product-draft-lifecycle-tests.mjs` | 104 | Lifecycle coordinator API, all lifecycle paths, mutation model, duplicate handling, semantic guards (Package 3F) |

**Total: 3273 (Package 3AC baseline).** All must remain green before any commit.

Note: 1935 was the Package 3E baseline. Package 3F added 104 tests (→2039). Package 5C added 43 tests (→2082). Package 3I added 91 tests (`import-quality-report-tests.mjs`), raising the baseline to 2173. Package 3J added 91 tests (`whatsapp-txt-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2269. Package 3M added 84 tests (`android-sms-xml-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2358. Package 3O added 87 tests (`instagram-dm-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2450. Package 3R added 98 tests (`facebook-messenger-adapter-tests.mjs`) + 6 km-engine additions (1 platform assertion + 5 smoke), raising the confirmed baseline to 2554. Package 3U added 91 tests (`telegram-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2650. Package 3X added 134 tests (`content-quality-checks-tests.mjs`) + 6 km-engine smoke tests, raising the confirmed baseline to 2790. Package 3Y added 112 tests (`conversation-stats-tests.mjs`) + 6 km-engine smoke tests, raising the confirmed baseline to 2908 / 23 suites. Package 3Z enlarged `content-quality-checks-tests.mjs` by 50 tests (134→184) + 4 km-engine smoke assertions (134→138), raising the confirmed baseline to 2962 / 23 suites. Package 3AA adds 100 tests (`emoji-analysis-tests.mjs`, 15 suites) + 6 km-engine smoke assertions (138→144), raising the confirmed baseline to 3068 / 24 suites. Package 3AB adds 100 tests (`word-analysis-tests.mjs`, 19 suites) + 6 km-engine smoke assertions (144→150), raising the confirmed baseline to 3174 / 25 suites. Package 3AC adds 93 tests (`timing-analysis-tests.mjs`, 15 suites) + 6 km-engine smoke assertions (150→156), raising the confirmed baseline to **3273 / 26 suites**.

**Run:**

```bash
node src/tests/km-engine-tests.mjs
node src/tests/keepsake-group-tests.mjs
# (one command per suite; no test runner orchestrator — by design)
```

Or run all suites individually as part of pre-commit verification.

**When to add tests in this layer:**

- New `src/` modules — always
- New product / catalog / eligibility / render-spec / preview / readiness logic — always
- New persistence / serialization paths — always
- State-transition logic — always (especially proof approval transitions when Package 5A starts)

---

### Layer 2 — E2E seeded harness (Playwright)

**What:** Headless Chromium running the actual `index.html` against deterministic seed data (`scripts/e2e-test-data.mjs`).

**Coverage:** Phases 1–10 + 20 + 21 + 22 + 23 + 24 of `scripts/e2e-regression-harness.mjs`. **57 tests.** (Phases 25 and 26 are in the real-files harness.)

**Run:**

```bash
cd scripts && npm run e2e
# or headed:
cd scripts && npm run e2e:headed
```

**Triggers (must run before commit when):**

- `index.html` changed
- Any `src/products/*.js` consumed by the app changed
- `window.__km` bridge changed
- Save/load or persistence layer changed
- Any new UI surface added

---

### Layer 3 — E2E real-files harness

**What:** Same harness, with the `--real-files` flag. Tests phases 11–19 + 25 + 26 + 27 + 28 + 29 + 30 + 31 + 32 + 33 + 34 + 35 + 36 + 37 + 38 + 39 + 40 — real .txt import, WhatsApp .txt import, WhatsApp self-identification sender picker, import quality report, Android SMS XML import, Instagram DM JSON import, Instagram DM self-identification sender picker, Facebook Messenger JSON import, Facebook Messenger self-identification sender picker, Telegram Desktop JSON import, Telegram Desktop JSON self-identification sender picker, content quality checks (Phase 35), conversation statistics (Phase 36), extended content quality checks (Phase 37), emoji analysis (Phase 38), word analysis (Phase 39), timing analysis (Phase 40), actual browser download, actual file upload/restore, standalone keepsake type chooser, stable error text, optional chat.db smoke, capture harness subprocess.

**Coverage:** 114 tests (113 always + 1 conditional on local chat.db). Combined seeded + real-files: **171**.

**Run:**

```bash
cd scripts && npm run e2e:real
```

**Triggers (must run before commit when):**

- Any real-file import path changed (.txt, .db, etc.)
- Browser download/upload changed
- Standalone keepsake type chooser changed

---

### Layer 4 — Capture harness (visual / packet)

**What:** `scripts/capture-message-book-packet.mjs` — Playwright-driven capture of Message Book rendering for preview packet generation.

**Run:**

```bash
cd scripts && npm run capture:a   # scenario A
cd scripts && npm run capture:b   # scenario B
# etc.
```

**Triggers (must run before commit when):**

- Message Book rendering touched
- Pagination touched (note: pagination constants are scope-guarded)
- Preview composition touched
- `buildKeepsakeCard` or downstream rendering changed

---

### Layer 5 — Visual regression (`scripts/visual-regression-harness.mjs`)

**What:** Per-page screenshot comparison against committed Scenario A baselines using `pixelmatch`. Detects layout regressions in Message Book rendering.

**Run:**

```bash
node scripts/visual-regression-harness.mjs --check
# or
cd scripts && npm run vr:check
```

**Triggers (must run before commit when):**

- `index.html` rendering logic changed (pagination, section structure, bubble layout)
- Message Book composition engine touched
- `BOOK_PAGINATION_VERSION` bumped

See `docs/qa/visual-regression-guide.md` for full usage, baseline update policy, and threshold documentation.

---

### Layer 6 — Docs / package verification

**What:** No automated runner. Manual verification per `docs/qa/package-verification-template.md`.

**Run:** fill in the template; record results in chat or attached to the package handoff.

**Triggers:** every package closeout.

---

## Required tests by package type

| Package type | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Layer 5 | Layer 6 |
|---|---|---|---|---|---|---|
| Docs-only / OS infrastructure (like 2.7, 2.8, 2.9, v1.x OS passes) | — (run script validators: `os-self-audit.mjs`, `state-freshness-check.mjs`) | — | — | — | — | required |
| `src/` engine module | required | recommended if app-visible | — | — | — | required |
| New product / catalog logic | required | recommended | — | — | — | required |
| New persistence logic | required | required | required | — | — | required |
| New UI surface in `index.html` | recommended | required | required if real-file path | — | — | required |
| Pagination / rendering / preview | required | required | — | required | **required** | required |
| Real-file import path | required | required | required | — | — | required |
| Bug fix that's behavior-visible | recommended | required | required if real-file | — | recommended | required |

"Required" means: run it before commit, or document why it was skipped.

---

## Future packages — testing planning

Package 5A is COMPLETE (merged `297a221`). Its test suite (`proof-approval-state-tests.mjs`, 137 tests) covers the proof approval state model, allowed/forbidden transitions, and decoupling from checkout.

**Package 5B — COMPLETE (merged `dc4f86b` 2026-06-02):**

Package 5B added `proof-approval-ux-tests.mjs` (77 tests) and 15 new persistence tests:

- `proof-approval-ux-tests.mjs` — API shape, initialize/idempotency, getState before/after, submitForReview, double-submit guard, getStatusLabel all 5 statuses, getAllowedUserActions all 5 statuses, serialize JSON-safety, restore rehydrate/null/empty/extra-fields, duplicate-submit-after-restore, prohibited fields guard.
- Project-persistence additions — createSnapshot with proofApprovalStates, default to {}, validate accepts/rejects, round-trip, invalid type rejection.
- Package 5B correction pass — PSR restore: proofApprovalStates in KNOWN_SESSION_FIELDS (no warning), present in appState after restore, defaults to {} when absent from older snapshots.

Layer 2 (E2E seeded 41/41) and Layer 3 (E2E real-files 64/64) pass — no regressions in book view, save/restore, standalone keepsake, or Review view. Manual QA completed per package instruction.

**Package 3AC — Message Timing Analysis Engine (IN PROGRESS — branch `feature/timing-analysis-engine`):**

Package 3AC adds `src/core/timing-analysis.js` (`KMEngine.TimingAnalysis.compute()`) and `#timingAnalysisPanel` UI surface (green tone). Returns `{ peakHour: number|null, peakHourCount: number, peakDayOfWeek: number|null, peakDayOfWeekCount: number, hourlyDistribution: number[24], dailyDistribution: number[7] }`. UTC only — `getUTCHours()` / `getUTCDay()` (Sunday=0). Tie-break: lowest index wins. Zero-state for empty/null/non-array/no-valid-timestamp. New `timing-analysis-tests.mjs` (93 tests, 15 suites). `km-engine-tests.mjs` adds 6 TimingAnalysis smoke assertions (150→156). New Node baseline: **3273 / 26 suites**. Fixture: `scripts/fixtures/fake-timing-analysis.txt` (12 messages — WhatsApp bracket format, 2 senders: Alice/Bob, 3 days). TIMING_FIXTURE_COUNT=12. E2E Phase 40 adds 6 real-files tests: panel hidden on fresh load; panel visible + non-empty after TA fixture import; chatMessagesData.length === 12; panel text contains HH:MM UTC pattern; panel text contains day name; TXT reimport resets state for Phase 12. Layer 3: 171 total (+6 Phase 40). No scope-guarded files touched. No pagination constants, no BOOK_PAGINATION_VERSION, no BOOK_PARITY, no ProductDraft/Preflight/Lifecycle modules.

**Package 3AA — Emoji Analysis Engine (COMPLETE — impl `0e15cfb`, merged `29c4491` 2026-06-07):**

Package 3AA adds `src/core/emoji-analysis.js` (`KMEngine.EmojiAnalysis.compute()`) and `#emojiAnalysisPanel` UI surface (teal tone). Handles ZWJ sequences, skin-tone modifiers, keycap sequences, flag sequences. Returns `{ topEmojis: [{ emoji, count, rank }], totalEmojiCount, uniqueEmojiCount, mostEmojifiedSender: { sender, count } | null }`, MAX_TOP=5, safe zero-state. New `emoji-analysis-tests.mjs` (100 tests, 15 suites). `km-engine-tests.mjs` adds 6 EmojiAnalysis smoke assertions (→144 total). New Node baseline: **3068 / 24 suites**. Fixture: `scripts/fixtures/fake-emoji-conversation.txt` (10 messages — WhatsApp bracket format, 3 senders: Alice emoji-heavy). EA_FIXTURE_COUNT=10. E2E Phase 38 adds 6 real-files tests: panel hidden on fresh load; panel visible + non-empty after EA fixture import; chatMessagesData.length === 10; panel text contains `× N` pattern; panel text contains "sent the most emoji"; TXT reimport resets state for Phase 12. Layer 3: 159 total (+6 Phase 38). No scope-guarded files touched. No pagination constants, no BOOK_PAGINATION_VERSION, no BOOK_PARITY, no ProductDraft/Preflight/Lifecycle modules.

**Package 3Z — Extended Content Quality Checks (COMPLETE — impl `4902d50`, merged `ff79f9e` 2026-06-07):**

Package 3Z extends `src/core/content-quality-checks.js` (`KMEngine.ContentQualityChecks.compute()`) with 4 new advisory WARN checks: HIGH_ATTACHMENT_RATIO (>80% of messages are attachment-only), VERY_LONG_CONTENT (text.length > 1000, skips attachment-only), SHORT_CONVERSATION (<10 total messages), SINGLE_SENDER_DOMINANT (all non-system messages from 1 unique sender). No new panel, no new CSS, no `index.html` structural work — reuses existing `#contentQualityPanel` render path. `content-quality-checks-tests.mjs` expanded: Suite 3 enlarged to ≥10 messages; Suites 16–19 added (50 new tests → 184 total, 19 suites). `km-engine-tests.mjs` adds 4 smoke assertions for the 4 new check types (→138 total). New Node baseline: **2962 / 23 suites** (+54: 50 CQC + 4 km-engine smoke). `scripts/fixtures/fake-cqc-extended.txt` — 6-message WhatsApp bracket fixture; all from Alice Smith; 1 message with >1000 char text + 5 `<Media omitted>` — triggers all 4 new checks. `CQC_EXTENDED_FIXTURE_COUNT = 6`. E2E Phase 37 adds 7 real-files tests: panel visible after extended fixture import; correct message count; SHORT_CONVERSATION issue; HIGH_ATTACHMENT_RATIO issue; VERY_LONG_CONTENT issue; SINGLE_SENDER_DOMINANT issue; TXT reimport resets state for Phase 12. Layer 3: 153 total (+7 Phase 37). No `index.html` changes. No new CSS.

**Package 3Y — Conversation Statistics Engine (COMPLETE — impl `ca8d520`, merged `e0539d2` 2026-06-07):**

Package 3Y adds `src/core/conversation-stats.js` (`KMEngine.ConversationStats.compute()`) and `#conversationStatsPanel` UI surface (indigo tone). Stats: busiestDay, busiestDayCount, longestStreakDays, avgMessagesPerDay, totalDays, perSenderStats (all senders including senderRole:self). New `conversation-stats-tests.mjs` suite (~112 tests, 14 suites). `km-engine-tests.mjs` adds 6 ConversationStats smoke assertions (→134 total). Expected Node baseline: **~2908 / 23 suites**. E2E Phase 36 adds 6 real-files tests: panel hidden before import, visible after CST fixture import, correct message count, busiest day chip present, top sender chip present, TXT reimport resets state for Phase 12. Layer 3: ~146 total. Fixture: `scripts/fixtures/fake-cst-stats.txt` (8 messages — WhatsApp bracket format, 4 days). Not DEF-14 activation — this is import-panel stats only. Hard exclusions: no words shared, no top emojis, no estimated page counts, no book composition stats.

**Package 3X — Pre-print Content Quality Checks (COMPLETE — impl `e424825`, merged `7bdcdb5` 2026-06-07):**

Package 3X (DEF-15 non-vendor subset) adds `src/core/content-quality-checks.js` (`KMEngine.ContentQualityChecks.compute()`) and `#contentQualityPanel` UI surface (amber/warning tone). Five advisory checks: PHONE_NUMBER_AS_SENDER_NAME, RAW_URL_IN_CONTENT, EMPTY_MESSAGE, DUPLICATE_MESSAGE (adjacent-only), SYSTEM_MESSAGE_IN_OUTPUT — all severity WARN. New `content-quality-checks-tests.mjs` suite (134 tests, 15 suites). `km-engine-tests.mjs` adds 6 ContentQualityChecks smoke assertions (→128 total). New Node baseline: **2790 / 22 suites**. E2E Phase 35 adds 6 real-files tests: panel hidden before import, visible after CQC fixture import, correct message count, RAW_URL warning present, PHONE_NUMBER or DUPLICATE present, clean TXT reimport hides panel. Layer 3: 140 total. Fixture: `scripts/fixtures/fake-cqc-checks.txt` (5 messages — WhatsApp bracket format). No vendor/manufacturing inputs. Follows Package 3I (ImportQualityReport) pattern.

**Package 3W — Telegram Self-Identification Sender Picker (COMPLETE — merged `2bf1900` 2026-06-06):**

Package 3W adds no new Node unit tests (no new engine module; senderRole already tested via `import-quality-report-tests.mjs`). Adds E2E Phase 34 (6 real-files tests): sender picker visible after Telegram import; Alice Smith and bob_jones_99 chips present; selecting Alice Smith → 4 `.me` rows; selfMessageCount = 4; selecting Skip → 0 `.me`; non-Telegram TXT reimport hides picker. Node baseline unchanged: 2650 / 21 suites. Layer 2 unchanged: 57 seeded. Layer 3: 134 total when running `npm run e2e:real` (+6 Phase 34). Visual regression PASS expected (sender picker above page canvas capture zone; baselines unaffected). No engine changes. No adapter changes. `#telegramSenderPicker` added to `index.html`; `showTelegramSenderPicker` + `applyTelegramSelfSender` added; `window.__km.applyTelegramSelfSender` exposed.

**Package 3V — Telegram JSON UI Wiring (COMPLETE — merged `40a6a78` 2026-06-06):**

Package 3V adds no new Node unit tests (no new engine module; adapter fully tested in Package 3U). Adds E2E Phase 33 (5 real-files tests): Telegram JSON fixture imports via file input; chat view visible; count = 8 (10 entries − 1 service-type skip − 1 null-from skip); importQualityPanel visible and non-empty; sourcePlatformId = 'telegram'; TXT re-import resets state for later phases. Node baseline unchanged: 2650 / 21 suites. Layer 2 unchanged: 57 seeded. Layer 3: 128 total when running `npm run e2e:real` (+5 Phase 33). Visual regression PASS (baselines unchanged; import panel above page canvas capture zone). No sender picker (Telegram self-ID deferred to Package 3W). No engine changes. `#fileInput` accept already includes `.json` — no change needed. Script tag added for `telegram-adapter.js` (after `facebook-messenger-adapter.js`, before `future-adapter-stubs.js`). Telegram routing guard inserted after Instagram DM and before legacy TXT fallback in `readTxtFile()` — collision-safe: `from_id` + `date_unixtime` discriminators are unique to Telegram; `participants` negative guard prevents IG/FB false positives.

**Package 3U — Telegram JSON Adapter (COMPLETE — merged `3f4e0c4` 2026-06-06):**

Package 3U adds 91 tests in new `telegram-adapter-tests.mjs` (17 suites: API shape + KMEngine.adapters registration, canHandle accepts, canHandle rejects Instagram DM, canHandle rejects Facebook Messenger, canHandle rejects non-Telegram, from_id discriminator, fixture rawCounts, timestamp parsing Unix-seconds → ISO, sender extraction, text plain string, text array entity concatenation, media/attachment detection, senderRole always contact, NormalizedMemory required fields, importWarnings, no-throw robustness, participants). Adds 5 smoke assertions to `km-engine-tests.mjs` (→122 total). New Node baseline: **2650 / 21 suites**. No E2E required (engine-only; no index.html changes). Visual regression not required. Telegram platform `supported`. No HTML entity decoding (Telegram uses plain Unicode). Text field is either a string or array of entities — `extractText()` helper handles both. date_unixtime is Unix SECONDS string, not milliseconds. senderRole always 'contact'. All non-message entries (service type, null from) → importWarnings. UI wiring is Package 3V; self-identification picker is Package 3W.

**Package 3T — Facebook Messenger Self-Identification Sender Picker (COMPLETE — merged `8b11f18` 2026-06-06):**

Package 3T adds no new Node unit tests (no new engine module; senderRole already tested via `import-quality-report-tests.mjs`). Adds E2E Phase 32 (6 real-files tests): sender picker visible after Facebook Messenger import; Alice Johnson and charlie_b_99 chips present; selecting Alice Johnson → 4 `.me` rows; selfMessageCount = 4; selecting Skip → 0 `.me`; non-Facebook TXT reimport hides picker. Node baseline unchanged: 2554 / 20 suites. Layer 2 unchanged: 57 seeded. Layer 3: 123 total when running `npm run e2e:real` (+6 Phase 32). Visual regression PASS expected (sender picker above page canvas capture zone; baselines unaffected). No engine changes. No adapter changes. `#facebookSenderPicker` added to `index.html`; `showFacebookSenderPicker` + `applyFacebookSelfSender` added; `window.__km.applyFacebookSelfSender` exposed.

**Package 3S — Facebook Messenger JSON UI Wiring (COMPLETE — merged to main, Package 3S):**

Package 3S adds no new Node unit tests (no new engine module; adapter fully tested in Package 3R). Adds E2E Phase 31 (5 real-files tests): Facebook Messenger JSON fixture imports via file input; chat view visible; count = 8 (10 messages − 1 is_unsent skip − 1 missing-sender skip); importQualityPanel visible and non-empty; sourcePlatformId = 'facebook-messenger'; TXT re-import resets state for later phases. Node baseline unchanged: 2554 / 20 suites. Layer 2 unchanged: 57 seeded. Layer 3: 117 total when running `npm run e2e:real` (+5 Phase 31). Visual regression PASS (baselines unchanged; import panel above page canvas capture zone). No sender picker (Facebook self-ID deferred to Package 3T). No engine changes. `#fileInput` accept already included `.json` — no change needed. Script tag added for `facebook-messenger-adapter.js`. Facebook routing guard inserted after Android SMS and before Instagram DM in `readTxtFile()` — Facebook must precede Instagram because Facebook files satisfy Instagram's canHandle (both are Meta JSON with participants/messages/timestamp_ms); the magic_words discriminator in Facebook's canHandle uniquely excludes Instagram files.

**Package 3Q — Instagram DM Self-Identification Sender Picker (COMPLETE — merged `ff1c3ed` 2026-06-05):**

Package 3Q adds no new Node unit tests (no new engine module; senderRole already tested via `import-quality-report-tests.mjs`). Adds E2E Phase 30 (6 real-files tests): sender picker visible after Instagram DM import; Alice Smith and bob_jones_99 chips present; selecting Alice Smith → 4 `.me` rows; selfMessageCount = 4; selecting Skip → 0 `.me`; non-Instagram reimport hides picker. Node baseline unchanged: 2450 / 19 suites. Layer 2 unchanged: 57 seeded. Layer 3: 112 total when running `npm run e2e:real` (+6 Phase 30). Visual regression PASS expected (sender picker above page canvas capture zone; baselines unaffected). No engine changes. No adapter changes. `#instagramSenderPicker` added to `index.html`; `showInstagramSenderPicker` + `applyInstagramSelfSender` added; `window.__km.applyInstagramSelfSender` exposed.

**Package 3P — Instagram DM JSON UI Wiring (COMPLETE — merged `d99fb84` 2026-06-05):**

Package 3P adds no new Node unit tests (no new engine module; adapter fully tested in Package 3O). Adds E2E Phase 29 (5 real-files tests): Instagram DM JSON import via file input; chat view visible; count = 8 (10 messages − 1 is_unsent skip − 1 missing-sender skip); importQualityPanel visible and non-empty; sourcePlatformId = 'instagram-dm'. Node baseline unchanged: 2450 / 19 suites. Layer 2 unchanged: 57 seeded. Layer 3: 106 total when running `npm run e2e:real` (+5 Phase 29). Visual regression PASS (baselines unchanged; import panel above page canvas capture zone). No sender picker (self-ID deferred to Package 3Q). No engine changes. `#fileInput` accept updated to `.txt,.xml,.json`. Script tag added for `instagram-dm-adapter.js`.

**Package 3O — Instagram DM JSON Adapter (COMPLETE — merged `26f2633` 2026-06-05):**

Package 3O adds 87 tests in new `instagram-dm-adapter-tests.mjs` (15 suites: API shape, canHandle accepts/rejects, fixture rawCounts, timestamp conversion, HTML entity decoding sender/content, senderRole always contact, text normalization, media/attachment normalization, NormalizedMemory required fields, importWarnings, no-throw, semantic guards, participants extraction). Adds 5 smoke assertions to `km-engine-tests.mjs` (111 total). New Node baseline: 2450. No E2E required (engine-only; no index.html changes). Visual regression not required. No GATE-04 crossing. instagram-dm platform `supported`. All media types (photos, videos, audio_files, gifs, files, sticker) and shares → attachment-placeholder (conservative). HTML entity decoding for text fields. senderRole always 'contact' (self-ID deferred to UI package). UI wiring is a separate follow-on package.

**Package 3N — Android SMS UI Wiring (COMPLETE — merged `6d61367` 2026-06-05):**

Package 3N adds no new Node unit tests (no new engine module; adapter fully tested in Package 3M). Adds E2E Phase 28 (6 real-files tests): Android SMS XML import via file input; chat view visible; count = 9 (10 elements − 1 missing-sender skip); importQualityPanel visible; selfMessageCount = 4 (3 type=2 SMS + 1 MMS msg_box=2 — confirmed no picker needed); sourcePlatformId = 'android-sms'. Node baseline unchanged: 2358. Layer 2 unchanged: 57 seeded. Layer 3: 101 total when running `npm run e2e:real` (+6 Phase 28). Visual regression PASS (baselines unchanged; Android SMS uses same .me/.them bubble CSS). Manual QA 19/19 PASS. No sender picker (type=2 auto-maps to senderRole:self). No engine changes.

**Package 3L — WhatsApp Self-Identification (IN PROGRESS — branch `feature/whatsapp-self-id`, 2026-06-05):**

Package 3L adds no new Node unit tests (no new engine module; senderRole is already tested in Suite 7 of `import-quality-report-tests.mjs`). Adds E2E Phase 27 (6 real-files tests): sender picker visible after WhatsApp import; Alice and Bob chips present; selecting Alice yields 4 `.me` rows; selfMessageCount updates to 4; selecting Skip reverts all to `.them`; re-importing non-WA TXT hides picker. Node baseline unchanged: 2269. Layer 2 unchanged: 57 seeded. Layer 3: 95 total when running `npm run e2e:real` (+6 Phase 27). Visual regression PASS expected (sender picker is in the import UI above the chat canvas; baselines unaffected). No GATE-04 crossing. No engine changes.

**Package 3K — WhatsApp TXT UI Wiring (COMPLETE — merged `a048d0d` 2026-06-05):**

Package 3K adds no new Node unit tests (no new engine module). Adds E2E Phase 26 (5 real-files tests): WhatsApp fixture imports via TXT file input; chat view visible; message count = 8; importQualityPanel visible and non-empty; sourcePlatformId = 'whatsapp'. Node baseline unchanged: 2269. Layer 2 unchanged: 57 seeded. Layer 3: 89 total when running `npm run e2e:real` (+5 Phase 26). Visual regression PASS (baselines unchanged; WhatsApp messages render as 'them' bubbles — same CSS path as any non-Me message). No GATE-04 crossing. Self/sender identification delivered in Package 3L.

**Package 3J — WhatsApp TXT Adapter (COMPLETE — merged `f1eca34` 2026-06-05):**

Package 3J adds 91 tests in new `whatsapp-txt-adapter-tests.mjs` (14 suites: API shape, canHandle bracket, canHandle hyphen, canHandle rejects, fixture import, hyphen import, multi-line continuation, system-message filtering, media placeholders, participants, rawCounts, NormalizedMemory fields, no-throw, semantic guards). Adds 5 smoke assertions to `km-engine-tests.mjs`. Node baseline: 2269. No E2E required (engine-only; no index.html changes). Visual regression not required. No GATE-04 crossing. Engine adapter only; UI wiring delivered in Package 3K.

**Package 3I — Import Quality Report (COMPLETE — merged `60cdd31` 2026-06-04):**

Package 3I adds 91 tests in new `import-quality-report-tests.mjs` (12 suites: API shape, empty input, totalMessages, dateRange, null/invalid timestamps, uniqueSenderCount/senderList, self/contact split, attachmentOnlyCount, reactions, sourcePlatformId, all-attachment corpus, semantic guards). Node baseline: 2173. E2E Phase 25 adds 4 real-files tests: panel visible after txt import, correct count, date range present, panel hidden on fresh load (in real-files block after Phase 11). Layer 2 unchanged: 57 seeded. Layer 3: 84 total when running `npm run e2e:real` (57 seeded + 23 real-files + 4 Phase 25). Visual regression PASS (panel above page canvas, not in capture zone; baselines unchanged). No GATE-04 crossing. Pure additive import flow enhancement.

**Package 3H — Draft-Preflight Status Surface and Proof Panel Gate (COMPLETE — merged `1297f92` 2026-06-03):**

Package 3H adds no new Node unit tests (zero engine module changes). E2E Phase 23 adds 6 seeded tests covering draft book-check auto-advance, proof panel gating, idempotency, save/restore, and ProofApprovalUX independence. Phase 22 tests updated to reflect the new expected state (draft reaches `preflight-passed` on book view entry). Visual regression baselines updated for Scenario A (proof panel appearance changes). Layer 2 target: 53 seeded tests. Layer 3 unchanged: 70 real-files tests.

**Package 5C — Proof Panel User Withdrawal and UX Completion (IN PROGRESS — branch `feature/proof-panel-user-withdrawal`, 2026-06-04):**

Package 5C adds 18 tests to `proof-approval-state-tests.mjs` (Suite 4 +1, Suite 5 −1, new Suite 15 withdrawal transition) and 25 tests to `proof-approval-ux-tests.mjs` (Suite 1 +1 API shape, Suite 8 +2 updated pending-review, new Suites 16+16b withdrawSubmission). Node baseline: 2082. E2E Phase 24 adds 4 seeded tests: pending-review DOM state, cancel button existence, withdrawal flow (cancel → submit button restored), save/restore with pending-review proof state. Layer 2 target: 57 seeded tests. Layer 3: 80 total when running `npm run e2e:real` (57 seeded + 23 real-files; verified in Package 5C verification pass). Visual regression PASS (proof panel not in capture zone; baselines unchanged). No GATE-04 boundary crossed. Local proof withdrawal only.

---

## Pre-commit baseline

Before any commit instruction is acted on, the agent must verify:

1. All 26 Node unit suites green (3273 tests).
2. If `index.html` or `src/` changed: E2E seeded green (57 tests).
3. If real-file paths changed: E2E real-files green (171 total — `npm run e2e:real`).
4. If Message Book rendering changed: relevant capture harness scenario green; visual regression check green (`node scripts/visual-regression-harness.mjs --check`).
5. Manual QA recorded if UI behavior changed (`docs/qa/manual-qa-template.md`).
6. Package verification recorded (`docs/qa/package-verification-template.md`).
7. For OS/docs-only packages: run `node scripts/os-self-audit.mjs` and `node scripts/state-freshness-check.mjs`; no full app suite required.

If any of those is skipped, the agent must say so explicitly with the reason. Silent skipping is not acceptable.

---

## What this strategy does NOT do

- Visual regression for Message Book is now covered by Layer 5 (Package 3D, `scripts/visual-regression-harness.mjs`).
- It does not cover browser smoke tests outside the E2E harness.
- It does not cover load/performance testing.
- It does not cover security testing.
- It does not run on CI (no CI workflows are committed). Tests run locally before commit.

These gaps are documented and tracked — not hidden.

---

## Backlog / known gaps

| Item | Reason it's a gap | Where tracked |
|---|---|---|
| Visual regression for Message Book | Package 3D COMPLETE — Layer 5 active | `scripts/visual-regression-harness.mjs`, `docs/qa/visual-regression-guide.md` |
| Print-preview verification scripts | Vendor-gated | This file |
| Load / performance testing | Not in launch set | This file |
| Security testing pipeline | Future phase | This file |
| CI integration of tests | Not authorized | This file |
| Automated artifact generation checks | Vendor-gated | This file |
| Cross-browser E2E (Firefox, Safari, Edge) | Single-browser is intentional today | This file |

When any of these moves from gap to authorized, add tests **first**, code second.

---

## Pointers

- `docs/qa/manual-qa-template.md` — manual QA record format
- `docs/qa/pre-commit-verification-template.md` — hygiene gate before commit
- `docs/qa/package-verification-template.md` — per-package verification (Package 2.9)
- `docs/qa/release-readiness-template.md` — release gate
- `docs/qa/e2e-regression-harness.md` — E2E harness operating manual
- `docs/qa/visual-regression-guide.md` — visual regression harness (Package 3D)
- `docs/dev/auto-management-protocol.md` — how testing fits the broader OS
