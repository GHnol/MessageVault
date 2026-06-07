# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `open` — Package 3X — Pre-print Content Quality Checks — IN PROGRESS on branch `feature/preprint-content-quality-checks`.

**Last updated by:** `Claude Code (Sonnet 4.6)` on `2026-06-07`

---

## Package and branch

| Field | Value |
|---|---|
| **Active pass** | Package 3X — Pre-print Content Quality Checks — IN PROGRESS |
| **Active branch** | `feature/preprint-content-quality-checks` (from `main` at `92054fe`) |
| **main HEAD** | `92054fe` — docs: close tower catch-up after source adapter series completion |
| **Last completed pass** | `Weekly Sync / Project Control Tower Catch-Up after Package 3W` — docs `056cdd9`, merged `24810bf`; post-merge state-sync `92054fe` 2026-06-07 |
| **Active package** | Package 3X — Pre-print Content Quality Checks — IN PROGRESS |
| **Last closed package** | `Package 3W — Telegram Self-Identification Sender Picker` — FULLY COMPLETE — impl `a60c6e3`, merged `2bf1900` 2026-06-06 |
| **Prior closed package** | `Package 3V — Telegram JSON UI Wiring` — FULLY COMPLETE — impl `2b232f8`, merged `40a6a78` 2026-06-06 |
| **Package 5C** | COMPLETE — impl `7b00f31`, merged `4733c32` 2026-06-04; user withdrawal (pending-review→none); cancel button; Phase 24 E2E (4 tests); 2082 Node; 57/57 seeded; 80/80 real-files; 27/27 browser QA |
| **Package 5B** | COMPLETE — merged `dc4f86b` 2026-06-02 |
| **Package 3H** | COMPLETE — merged `1297f92` 2026-06-03 |
| **Package 3E** | COMPLETE — merged `4390038` 2026-06-02; `ProductDraftState` + `ProductPreflight`; engine layer only; no app code |

---

## Objective (active pass — Package 3X — Pre-print Content Quality Checks)

Branch: `feature/preprint-content-quality-checks` from `main` at `92054fe`. Authorized by Coordinator 2026-06-07.

**Objective:** Add `KMEngine.ContentQualityChecks.compute(memories)` engine module, Node tests, km-engine smoke, `#contentQualityPanel` UI surface (amber tone), E2E Phase 35, and docs updates. Advisory-only; no vendor/manufacturing scope.

**What is done:**
- `src/core/content-quality-checks.js` — complete IIFE engine module; 5 WARN checks; URL_RE case-insensitive; returns `[]` for empty/invalid input
- `scripts/fixtures/fake-cqc-checks.txt` — 5-message WhatsApp bracket fixture (PHONE_NUMBER, RAW_URL, DUPLICATE)
- `src/tests/content-quality-checks-tests.mjs` — 134 tests / 15 suites — 134/0 PASS
- `src/tests/km-engine-tests.mjs` — loads content-quality-checks.js; ContentQualityChecks smoke suite (+6 → 128 total) — 128/0 PASS
- `index.html` — CSS + dark mode; script tag; `#contentQualityPanel` div; `const contentQualityPanel` binding; `renderContentQualityPanel(memories)` function; called at all 10 same sites as `renderImportQualityPanel`; `window.__km.renderContentQualityPanel` exposed
- `scripts/e2e-regression-harness.mjs` — `CQC_FIXTURE` + `CQC_FIXTURE_COUNT = 5` constants; Phase 35 (6 real-files tests)
- `docs/qa/test-strategy.md` — Package 3X entry updated; Node baseline 2650 → 2790; suites 21 → 22; E2E Layer 3 134 → 140; pre-commit counts updated
- `docs/architecture/architecture-roadmap.md` — header updated; content-quality-checks.js in module map; Package 3X IN PROGRESS entry; "Still expected" planning note removed
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — state docs updated to Package 3X IN PROGRESS

**What remains:** Full verification gate (Node 2790, seeded E2E 57, real-files E2E 140, OS audit, state-freshness, project-control-sync-validate, project-control-sync-dry-run), pre-commit report, then STOP and await commit authorization.

**Hard exclusions (from Coordinator):** src/products/*, src/state/*, src/core/normalized-memory.js, src/core/import-adapters.js, src/core/import-quality-report.js, adapters, pagination constants, proof/Review/keepsake/checkout/PDF/vendor/manufacturing/GATE-04 scope. No new npm dependencies. No external system mutations.

**Next exact action:** Run verification gate — `node src/tests/content-quality-checks-tests.mjs`, `node src/tests/km-engine-tests.mjs`, `node scripts/e2e-regression-harness.mjs` (seeded), `node scripts/e2e-regression-harness.mjs --real-files`, OS audit, state-freshness, project-control-sync-validate, dry-run. Then produce pre-commit report and STOP for Coordinator commit authorization.

---

## Objective (last completed pass — Weekly Sync / Project Control Tower Catch-Up after Package 3W)

Docs-only operating pass on branch `docs/post-3w-tower-catchup` (from `main` at `e8454fa`). Authorized by Coordinator after Package 3W planning investigation. **COMPLETE — docs `056cdd9`, merged `24810bf` to main 2026-06-07.**

**Objective:** Clean up stale project-control, command-center, architecture, backlog, and decision docs now that the client-side source adapter series is complete through Package 3W. Do not implement Package 3X. No app code.

**What was done (15 files edited, committed, and merged):**
- `docs/project-control/decision-log.md` — stale "after Package 3U" → "after Package 3W"; Package 3X named as next candidate
- `docs/ops/deferred-gated-ideas-register.md` — DEF-01–DEF-05 and DEF-12 marked DELIVERED; DEF-15 updated with Package 3X note
- `docs/ops/backlog-roadmap.md` — stale "Package 3J COMPLETE" section replaced with full adapter series summary; Package 3X named as next candidate
- `docs/project-control/current-sprint.md` — task 22 updated for Package 3X; task 25 added (operating pass Done)
- `docs/project-control/kanban-board.md` — operating pass moved to Done; Package 3X in Backlog
- `docs/project-control/backlog.md` — last-updated date corrected; Package 3X row added to Coordinator lane
- `docs/project-control/master-roadmap.md` — Package 2.8 IN PROGRESS→DONE; all adapter packages added to history table; Phase 3 "Completed work" updated; Phase 12 updated
- `docs/architecture/architecture-roadmap.md` — Package 3X planning note added to "Still expected" section
- `docs/qa/test-strategy.md` — Package 3X planning note added; last-updated date corrected
- `docs/command-center/current-status.md` — last-updated date; Package 3X named in pending decisions
- `docs/command-center/next-actions.md` — Package 3X added as top next-package candidate; action #1 updated
- `docs/project-control/report-mirror-log.md` — RPT-20260607-001 entry added (mirrored)
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — state docs closed out to main

**Hard exclusions confirmed:** no index.html, no src/*, no scripts/e2e-regression-harness.mjs, no scripts/fixtures/*, no tests, no adapters, no product/state/proof/PDF/checkout/vendor/manufacturing/pagination/dependency files.

---

## Objective (last completed pass — Package 3W — Telegram Self-Identification Sender Picker)

Package 3W — Telegram Self-Identification Sender Picker. **COMPLETE — impl `a60c6e3`, merged `2bf1900` to `main` 2026-06-06.**

Branch: `feature/telegram-self-id` — base: `main` at `e8a6fe4`

Authorized files:
- `index.html` — `<div id="telegramSenderPicker">`; `const telegramSenderPicker` binding; `showTelegramSenderPicker(memories)` + `applyTelegramSelfSender(senderName)` (mirror FB pattern); Telegram picker hide in WA branch, non-WA reset block, and restore path; `showTelegramSenderPicker(result.memories)` call in Telegram routing branch; `window.__km.applyTelegramSelfSender` exposed
- `scripts/e2e-regression-harness.mjs` — `TG_ALICE_COUNT = 4` + `TG_BOB_COUNT = 4`; Phase 34 (6 real-files tests)
- `docs/qa/test-strategy.md` — Phase 34 note; real-files baseline 128 → 134; Layer 3 coverage updated
- `docs/architecture/architecture-roadmap.md` — header updated; Package 3W IN PROGRESS entry
- `src/core/source-platforms.js` — telegram notes: sender picker delivered (Package 3W)
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — state docs

Hard exclusions: `src/adapters/telegram-adapter.js`, `src/core/normalized-memory.js`, `src/core/import-adapters.js`, `src/core/import-quality-report.js`, `src/products/*`, `src/state/*`, `scripts/fixtures/fake-telegram-export.json`, pagination constants, proof/Review/keepsake/draft/lifecycle scope, external systems.

**What is done:** Branch `feature/telegram-self-id` created. All 8 authorized files edited. Full verification gate passed: 2650/2650 Node (21 suites, 0 failed), 57/57 seeded E2E, 134/134 real-files E2E (Phase 34: 6/6), visual regression PASS (4/4 pages). Hard exclusions confirmed clean (8 authorized files only). OS audit 324/0/0. Committed `a60c6e3`. Merged `2bf1900` to main 2026-06-06. Post-merge state-sync complete.
**What remains:** Nothing — Package 3W COMPLETE.
**Next exact action:** No active package. Package 3W COMPLETE. Await Coordinator authorization for next package. Do not start any package without explicit Coordinator authorization.

---

## Objective (last completed pass — Package 3V — Telegram JSON UI Wiring)

Package 3V — Telegram JSON UI Wiring. **COMPLETE — impl `2b232f8`, merged `40a6a78` to `main` 2026-06-06.**

Objective: Wire `KMEngine.telegramAdapter` into the browser import flow so users can import Telegram Desktop JSON exports through the existing file upload and drag-and-drop flow.

Authorized files:
- `index.html` — add `telegram-adapter.js` script tag; add Telegram routing guard in `readTxtFile()` after Instagram DM guard, before TXT fallback
- `scripts/e2e-regression-harness.mjs` — add `TELEGRAM_FIXTURE` + `TELEGRAM_FIXTURE_COUNT = 8` constants; add Phase 33 (5 tests)
- `docs/qa/test-strategy.md` — update real-files baseline 123 → 128; add Phase 33 note
- `docs/architecture/architecture-roadmap.md` — mark telegram-adapter.js browser-loaded; add Package 3V entry
- `src/core/source-platforms.js` — update Telegram notes: UI wiring delivered 3V, sender picker pending 3W
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — state docs

Hard exclusions: `src/adapters/telegram-adapter.js`, `src/core/normalized-memory.js`, `src/core/import-adapters.js`, `src/core/import-quality-report.js`, `src/products/*`, `src/state/*`, package files, pagination constants, proof panel, Review view, keepsake flows.

No sender picker in Package 3V. No Telegram picker div. No `__km` bridge addition for Telegram. Sender self-identification deferred to Package 3W.

Routing order in `readTxtFile()` after 3V:
1. WhatsApp TXT → 2. non-WA picker reset → 3. Android SMS XML → 4. Facebook Messenger JSON → 5. Instagram DM JSON → 6. Telegram JSON → 7. legacy TXT fallback

Expected counts after 3V: Node 2650/21 suites (unchanged), seeded E2E 57 (unchanged), real-files E2E 128/128 (+5 Phase 33).

**What is done:** Branch created. State docs updated. All 8 authorized files edited. Full verification gate passed: 2650/2650 Node (21 suites, 0 failed), 57/57 seeded E2E, 128/128 real-files E2E (Phase 33: 5/5), visual regression PASS (4/4 pages). Hard exclusions confirmed clean (8 authorized files only). Committed `2b232f8`. Merged `40a6a78` to main 2026-06-06. Post-merge state-sync complete.
**What remains:** Nothing — Package 3V COMPLETE.
**Next exact action:** No active package. Await Coordinator authorization for Package 3W or next direction. Do not start any package without explicit Coordinator authorization.

---

## Objective (last completed pass — Package 3U — Telegram JSON Adapter)

Package 3U — Telegram JSON Adapter. **COMPLETE — impl `45d0d24`, merged `3f4e0c4` to `main` 2026-06-06.**

Branch: `feature/telegram-json-adapter` — impl commit `45d0d24`, merged to `main` at `3f4e0c4` 2026-06-06.

Files created:
- `src/adapters/telegram-adapter.js` — `KMEngine.telegramAdapter`; ADAPTER_ID `telegram-json-v1`; PLATFORM_ID `telegram`; ADAPTER_VERSION `1`; `canHandle` uses `from_id` + `date_unixtime` positive discriminators + `participants` + `magic_words` negative discriminators; `extractText(text)` handles string or array-of-{type,text} objects; `hasMedia(msg)` checks `photo` string / `file` string / `media_type` non-null; date_unixtime is Unix SECONDS string → parseInt * 1000 → ISO-8601 (isNaN guard); no HTML entity decoding (Telegram plain Unicode); senderRole always `contact`; non-message type → warning; null/empty `from` → warning; registered as both `KMEngine.telegramAdapter` and `KMEngine.adapters['telegram-json-v1']`
- `scripts/fixtures/fake-telegram-export.json` — 10-message fixture: 8 imported (Alice Smith + bob_jones_99; text array entities; photo attachment; file+media_type attachment; empty text array); 2 skipped (service type idx=5; null from idx=6)
- `src/tests/telegram-adapter-tests.mjs` — 91 tests across 17 suites; all 91/91 pass

Files modified:
- `src/adapters/future-adapter-stubs.js` — STUBS array now empty (telegram-json-v1 stub removed)
- `src/core/source-platforms.js` — telegram: status `stub` → `supported`; notes updated (Package 3U adapter delivered; 3V UI wiring + 3W sender picker pending)
- `src/tests/km-engine-tests.mjs` — loads `telegram-adapter.js`; telegram platform assertion updated to `supported`; `telegramAdapter — smoke` suite added (+5 assertions → 122 total)
- `docs/qa/test-strategy.md` — baseline 2554 → 2650; 20 → 21 suites; telegram-adapter-tests.mjs row; km-engine count 117 → 122; Package 3U note
- `docs/architecture/architecture-roadmap.md` — header + section updated to post-Package 3U; telegram-adapter.js in module map; future-adapter-stubs.js noted as empty; Package 3U DELIVERED entry

**Verification results (pre-commit):** 91/91 telegram-adapter-tests.mjs. 122/122 km-engine-tests.mjs. All 21 Node suites green (2650/2650). E2E not required (engine-only; no index.html changes). Visual regression not required. Hard-exclusion diff: authorized files only (no index.html, no e2e harness, no normalized-memory.js, no import-adapters.js, no import-quality-report.js, no products/*, no state/*).

**Next exact action:** No active package. Package 3U COMPLETE. Await Coordinator direction for next package. Do not start any package without explicit Coordinator authorization.

**Hard exclusions verified:**
- `index.html`: not touched
- `scripts/e2e-regression-harness.mjs`: not touched
- `src/core/normalized-memory.js`: not touched
- `src/core/import-adapters.js`: not touched
- `src/core/import-quality-report.js`: not touched
- `src/products/*`: not touched
- `src/state/*`: not touched
- Existing adapter files: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof, draft, lifecycle, readiness, checkout, PDF, vendor, manufacturing, Review view, standalone keepsake flows: not touched
- No dependency installs; no external systems

---

## Objective (last completed pass — Package 3T — Facebook Messenger Self-Identification Sender Picker)

Package 3T — Facebook Messenger Self-Identification Sender Picker. **COMPLETE — impl `b01fbff`, merged `8b11f18` to `main` 2026-06-06.**

Branch: `feature/facebook-messenger-self-id` — base: `main` at `5501d84`

Files modified:
- `index.html` — `<div id="facebookSenderPicker">` after `#instagramSenderPicker`; `const facebookSenderPicker` binding; `showFacebookSenderPicker(memories)` function; `applyFacebookSelfSender(senderName)` function (mirrors Instagram DM picker pattern; uses `replace(/"/g, '&quot;')` + `replace(/</g, '&lt;').replace(/>/g, '&gt;')` escaping for sender names in innerHTML); Facebook picker hide in WA branch (alongside IG hide); Facebook picker hide in non-WA reset block (alongside WA + IG hides); `showFacebookSenderPicker(result.memories)` call in FB routing guard branch; Facebook picker hide in restore path; `applyFacebookSelfSender` exposed on `window.__km`
- `scripts/e2e-regression-harness.mjs` — `FB_ALICE_COUNT = 4` and `FB_CHARLIE_COUNT = 4` constants after `FB_FIXTURE_COUNT`; Phase 32 (6 real-files tests): picker visible → Alice Johnson + charlie_b_99 chips → Alice Johnson → 4 `.me` → selfMessageCount=4 → Skip → 0 `.me` → non-FB TXT reimport hides picker + resets state for Phase 12
- `docs/qa/test-strategy.md` — status line updated (Phase 32 added; real-files total 117→123); Layer 3 What fixed (Phase 30 omission corrected; Phase 32 added; Instagram DM + Facebook Messenger picker descriptions added); Layer 3 Coverage 60→66 / 117→123; pre-commit baseline 117→123; Package 3T COMPLETE note
- `docs/architecture/architecture-roadmap.md` — header updated; Facebook Messenger sender picker line added to architecture tree; Package 3T DELIVERED entry; architecture section updated to post-Package 3T
- `src/core/source-platforms.js` — facebook-messenger notes: "Self-identification deferred to Package 3T" → "Sender picker delivered (Package 3T)"
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — state updated to Package 3T COMPLETE

**Verification results:** 2554/2554 Node (20 suites, 0 failed). E2E seeded 57/57 (unchanged). E2E real-files 123/123 (+6 Phase 32). Visual regression PASS (4/4 pages, baselines unchanged). Hard-exclusion diff: clean (8 authorized files only). OS audit: 324/0/0. project-control-sync-validate: 11/0/0. state-freshness: WARN only (cosmetic hash lag — expected mid-package; corrected in closeout state-sync).

**Manual QA (via Playwright E2E + code inspection):**
- FB fixture imports as 8 rows: ✓ Phase 32 test 1 + 3 (picker visible, 4 `.me` on Alice selection)
- Alice Johnson + charlie_b_99 chips present: ✓ Phase 32 test 2
- Selecting Alice Johnson → 4 `.me`: ✓ Phase 32 test 3
- selfMessageCount = 4 via ImportQualityReport: ✓ Phase 32 test 4
- Skip → 0 `.me`: ✓ Phase 32 test 5
- Non-FB TXT reimport hides picker: ✓ Phase 32 test 6
- WA and IG pickers hidden after FB import: ✓ by code — non-WA reset block runs before FB routing guard; FB branch calls showFacebookSenderPicker only
- Zero console errors: ✓ Phase 32 passes headless Chromium without any surfaced JS errors

**Next exact action:** No active package. Await Coordinator authorization for next package. Do not start any development work without explicit Coordinator instruction.

**Hard exclusions verified:**
- `src/adapters/facebook-messenger-adapter.js`: not touched
- `src/core/normalized-memory.js`: not touched
- `src/core/import-adapters.js`: not touched
- `src/core/import-quality-report.js`: not touched
- `src/products/*`: not touched
- `src/state/*`: not touched
- `scripts/fixtures/fake-facebook-messenger.json`: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof panel, Review view, standalone keepsake flows, draft/preflight/lifecycle: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3S — Facebook Messenger JSON UI Wiring)

Package 3S — Facebook Messenger JSON UI Wiring. **COMPLETE — impl `27b3521`, merged `e326fba` to `main` 2026-06-06.**

Branch: `feature/facebook-messenger-ui-wiring` — base: `main` at `39c4674`

Files modified:
- `index.html` — `<script src="src/adapters/facebook-messenger-adapter.js">` tag (after instagram-dm-adapter.js, before future-adapter-stubs.js); Facebook Messenger routing guard in `readTxtFile()` (after Android SMS guard, before Instagram DM guard — FB must precede IG: Facebook files satisfy Instagram's canHandle; magic_words discriminator in FB's canHandle uniquely excludes Instagram files); no sender picker (self-ID deferred to Package 3T); no accept change (`.txt,.xml,.json` already covers .json); no engine changes
- `scripts/e2e-regression-harness.mjs` — `FB_FIXTURE` + `FB_FIXTURE_COUNT = 8` constants; Phase 31 (5 real-files tests): import → count=8 → IQR panel → sourcePlatformId='facebook-messenger' → TXT reset
- `docs/qa/test-strategy.md` — status line updated (Phase 31 added; real-files total 112→117); Layer 3 coverage updated (60 tests / 117 combined); pre-commit baseline updated (117); Package 3S note added
- `docs/architecture/architecture-roadmap.md` — header updated; Package 3S delivered entry; facebook-messenger-adapter.js marked browser-loaded; Package 3R fixture description corrected (3 text + 5 attachments, not 5+3)
- `src/core/source-platforms.js` — facebook-messenger notes: UI wiring delivered (Package 3S); self-identification deferred to Package 3T
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — state updated to Package 3S in-progress

**Verification results:** 2554/2554 Node (20 suites, 0 failed). 57/57 E2E seeded. 117/117 E2E real-files (Phase 31: 5/5). Visual regression PASS (4/4 pages, baselines unchanged). Hard-exclusion diff: clean (5 authorized files only). OS audit: 324/0/0. project-control-sync-validate: 11/0/0. state-freshness: WARN only (cosmetic hash lag — expected mid-package; operational fields corrected in this update).

**Manual QA (via Playwright E2E + code inspection):**
- Facebook fixture imports as 8 rows: ✓ Phase 31 test 3 (DOM rows + chatMessagesData both === 8)
- sourcePlatformId is 'facebook-messenger': ✓ Phase 31 test 4
- Import Quality Report visible: ✓ Phase 31 test 4
- WA and IG pickers hidden after FB import: ✓ by code — picker reset block (hides both) runs before FB routing guard; FB branch calls no picker
- TXT re-import still works: ✓ Phase 31 test 5 resets to TXT; Phase 12 continues from TXT state (selects + renders correctly)
- Instagram fixture still routes to instagram-dm: ✓ Phases 29/30 both pass (117/117 total including these)
- Zero console errors: ✓ Phase 31 passes headless Chromium without any surfaced JS errors

**Next exact action:** No active package. Await Coordinator authorization for next package. Do not start any development work without explicit Coordinator instruction.

**Hard exclusions verified:**
- `src/adapters/facebook-messenger-adapter.js`: not touched
- `src/adapters/instagram-dm-adapter.js`: not touched
- `src/core/normalized-memory.js`: not touched
- `src/core/import-adapters.js`: not touched
- `src/core/import-quality-report.js`: not touched
- `src/products/*`: not touched
- `src/state/*`: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof panel, Review view, standalone keepsake flows, draft/preflight/lifecycle: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3R — Facebook Messenger JSON Adapter)

Package 3R — Facebook Messenger JSON Adapter. **COMPLETE — impl `f63123d`, merged `b6c85e9` to `main` 2026-06-05.**

Files created:
- `src/adapters/facebook-messenger-adapter.js` — `KMEngine.facebookMessengerAdapter`; ADAPTER_ID `facebook-messenger-json-v1`; PLATFORM_ID `facebook-messenger`; ADAPTER_VERSION `1`; `canHandle` requires `"magic_words"` string probe + `Array.isArray(parsed.magic_words)` structural check (discriminator from Instagram DM); HTML entity decoding (`&#x...;`, `&#...;`, `&apos;`, `&quot;`, `&lt;`, `&gt;`, `&amp;` last); media (photos/videos/audio_files/gifs/files/sticker) + share → attachment-placeholder; senderRole always `contact`; ms-epoch → ISO-8601; `importWarnings` for is_unsent + missing sender_name; registered as both `KMEngine.facebookMessengerAdapter` and `KMEngine.adapters['facebook-messenger-json-v1']`
- `scripts/fixtures/fake-facebook-messenger.json` — 10-message fixture (Alice Johnson + charlie_b_99; 8 imported / 2 skipped; includes `"magic_words":[]`; 5 text + 3 attachment; HTML entities + reactions in content; is_unsent skip + missing-sender skip)
- `src/tests/facebook-messenger-adapter-tests.mjs` — 98 tests across 17 suites (API shape, canHandle accepts, canHandle rejects Instagram DM, canHandle rejects non-Facebook, magic_words discriminator, fixture rawCounts, timestamp conversion, HTML entity decoding sender/content, senderRole, text normalization, media/attachment normalization, NormalizedMemory fields, importWarnings, no-throw, participants, semantic guards)

Files modified:
- `src/adapters/future-adapter-stubs.js` — removed `facebook-messenger-json-v1` stub entry; only telegram-json-v1 remains
- `src/core/source-platforms.js` — facebook-messenger status `'stub'` → `'supported'`; notes updated
- `src/tests/km-engine-tests.mjs` — loads `facebook-messenger-adapter.js` before stubs; updated facebook-messenger platform assertion to `supported`; added `facebookMessengerAdapter — smoke` suite (+5 assertions, 117 total)
- `docs/qa/test-strategy.md` — 2450 → 2554 baseline; 19 → 20 suites; facebook-messenger suite row; Package 3R note
- `docs/architecture/architecture-roadmap.md` — facebook-messenger-adapter.js in module map; Package 3R IN PROGRESS entry

**Verification results:** 98/98 facebook-messenger-adapter-tests.mjs. 117/117 km-engine-tests.mjs. All 20 Node suites green (2554/2554). start-router: NEEDS_COORDINATOR_DECISION (expected — mid-package). state-freshness-check: 3 FAIL (wrong branch in state docs — corrected in this update). project-control-sync-validate: 11 PASS. os-self-audit: 324 PASS. Hard exclusion diff: clean (8 authorized files only).

**Next exact action:** No active package. Await Coordinator authorization for next package. Do not start any development work without explicit Coordinator instruction.

**Hard exclusions verified:**
- `index.html`: not touched
- `scripts/e2e-regression-harness.mjs`: not touched
- `src/adapters/instagram-dm-adapter.js`: not touched
- `src/core/normalized-memory.js`: not touched
- `src/core/import-adapters.js`: not touched
- `src/core/import-quality-report.js`: not touched
- `src/products/*`: not touched
- `src/state/*`: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof panel, Review view, standalone keepsake flows, draft/preflight/lifecycle: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3Q — Instagram DM Self-Identification Sender Picker)

Package 3Q — Instagram DM Self-Identification Sender Picker. **COMPLETE — impl `8ca92c4`, merged `ff1c3ed` to `main` 2026-06-05.**

Branch: `feature/instagram-dm-self-id` — base: `main` at `9b4601d`

Files modified:
- `index.html` — `<div id="instagramSenderPicker">` after `#whatsappSenderPicker`; `const instagramSenderPicker` binding; `showInstagramSenderPicker(memories)` function; `applyInstagramSelfSender(senderName)` function; Instagram picker hide in WA branch before return; Instagram picker hide in non-WA guard block; `showInstagramSenderPicker(result.memories)` call in Instagram branch; Instagram picker hide in restore path; `window.__km.applyInstagramSelfSender` exposed for E2E testability
- `scripts/e2e-regression-harness.mjs` — `IG_ALICE_COUNT=4` + `IG_BOB_COUNT=4` constants; Phase 30 (6 real-files tests): picker visible → Alice Smith + bob_jones_99 chips → Alice Smith→4 .me → IQR selfMessageCount=4 → Skip→0 .me → non-Instagram reimport hides picker
- `docs/qa/test-strategy.md` — status line; Layer 3 count 106→112; pre-commit baseline 106→112; Package 3Q note
- `docs/architecture/architecture-roadmap.md` — header updated; architecture section updated; Package 3Q IN PROGRESS entry
- `src/core/source-platforms.js` — instagram-dm notes: "pending (Package 3Q)" → "delivered (Package 3Q)"
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — branch and active package updated

**Verification results:** 2450/2450 Node (19 suites). E2E seeded 57/57. E2E real-files 112/112 (+6 Phase 30). Visual regression PASS (baselines unchanged). Manual QA 21/21 PASS. Hard exclusion diff clean. OS audit 324/0/0. No engine changes. No adapter changes. No persistence schema changes.

**Next exact action:** No active package. Await Coordinator authorization for next package. Do not start any development work without explicit Coordinator instruction.

**Hard exclusions verified:**
- src/adapters/instagram-dm-adapter.js: not touched
- src/core/normalized-memory.js: not touched
- src/core/import-adapters.js: not touched
- src/core/import-quality-report.js: not touched
- src/products/*: not touched
- src/state/*: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof panel, Review view, standalone keepsake flows, draft/preflight/lifecycle: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3P — Instagram DM JSON UI Wiring)

Package 3P — Instagram DM JSON UI Wiring. **COMPLETE — impl `fa6f6f2`, merged `d99fb84` to `main` 2026-06-05.**

Branch: `feature/instagram-dm-ui-wiring` — base: `main` at `157927a`

Files modified:
- `index.html` — `<script src="src/adapters/instagram-dm-adapter.js">` tag (after android-sms-xml-adapter.js, before future-adapter-stubs.js); `accept=".txt,.xml,.json"` on `#fileInput`; drop hint: "Supports .txt, .xml and .json exports"; ingest card copy updated for .json; Instagram DM routing guard in `readTxtFile()` (after Android SMS guard, before legacy TXT fallback); no sender picker; no `showWhatsAppSenderPicker()` call
- `scripts/e2e-regression-harness.mjs` — `INSTAGRAM_FIXTURE` + `INSTAGRAM_FIXTURE_COUNT=8` constants; Phase 29 (5 real-files tests): import → count=8 → IQR panel → sourcePlatformId='instagram-dm'
- `docs/qa/test-strategy.md` — status line; Layer 3 description + count (44→49 / 101→106); pre-commit baseline 101→106; Package 3P note
- `docs/architecture/architecture-roadmap.md` — module map updated; Package 3P IN PROGRESS entry
- `src/core/source-platforms.js` — instagram-dm notes: "UI wiring delivered (Package 3P). Sender picker pending (Package 3Q)."
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — branch and active package updated

**Verification results:** 2450/2450 Node (19 suites). E2E seeded 57/57. E2E real-files 106/106 (+5 Phase 29). 10/10 manual QA. Hard exclusion diff clean. os-self-audit 324/0/0. No engine changes. Self-ID deferred to Package 3Q.

**Next exact action:** No active package. Await Coordinator authorization for next package. Do not start any development work without explicit Coordinator instruction.

**Hard exclusions verified:**
- index.html: touched only as authorized (script tag, accept, copy, routing guard)
- src/adapters/instagram-dm-adapter.js: not touched
- scripts/e2e-regression-harness.mjs: touched only as authorized (constants + Phase 29)
- src/core/normalized-memory.js: not touched
- src/core/import-adapters.js: not touched
- src/core/import-quality-report.js: not touched
- src/products/*: not touched
- src/state/*: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof panel, Review view, standalone keepsake flows, draft/preflight/lifecycle: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3O — Instagram DM JSON Adapter)

Package 3O — Instagram DM JSON Adapter. **COMPLETE — impl `ebb7a55`, merged `26f2633` to `main` 2026-06-05.**

Branch: `feature/instagram-dm-adapter` — base: `main` at `62c75fd`

Files created:
- `src/adapters/instagram-dm-adapter.js` — `KMEngine.instagramDmAdapter`; ADAPTER_ID `instagram-dm-json-v1`; Instagram DM single-thread JSON export; HTML entity decoder (`&#x...;`, `&#...;`, `&apos;`, `&quot;`, `&lt;`, `&gt;`, `&amp;` last); `hasMedia` covers photos/videos/audio_files/gifs/files/sticker; media + share → attachment-placeholder; senderRole always `contact`; ms-epoch → ISO-8601; `importWarnings` for is_unsent + missing sender_name
- `scripts/fixtures/fake-instagram-dm.json` — 10-message fake fixture (Alice Smith + bob_jones_99; 8 imported / 2 skipped; 5 text + 3 attachment; HTML entities in 3 content fields)
- `src/tests/instagram-dm-adapter-tests.mjs` — 87 tests across 15 suites

Files modified:
- `src/adapters/future-adapter-stubs.js` — removed instagram-dm-json-v1 stub entry
- `src/core/source-platforms.js` — instagram-dm status `'stub'` → `'supported'`; notes updated
- `src/tests/km-engine-tests.mjs` — loads instagram-dm-adapter.js before stubs; updated instagram-dm assertion to `supported`; +5 smoke assertions (111 total)
- `docs/qa/test-strategy.md` — 2358 → 2450 baseline; 18 → 19 suites; instagram-dm suite row; Package 3O note
- `docs/architecture/architecture-roadmap.md` — module map updated; Package 3O DELIVERED entry

**Verification results:** 87/87 instagram-dm-adapter-tests.mjs. 111/111 km-engine-tests.mjs. All 19 Node suites green (2450/2450). start-router: NEEDS_COORDINATOR_DECISION (expected — dirty tree). state-freshness-check: 0 FAILs, 2 cosmetic WARN (hash lag). project-control-sync-validate: 11 PASS. os-self-audit: 324 PASS. Hard exclusion diff: clean.

**Next exact action:** No active package. Await Coordinator authorization for next package. Do not start any development work without explicit Coordinator instruction.

**Hard exclusions verified:**
- index.html: not touched
- scripts/e2e-regression-harness.mjs: not touched
- src/core/normalized-memory.js: not touched
- src/core/import-adapters.js: not touched
- src/core/import-quality-report.js: not touched
- src/products/*: not touched
- src/state/*: not touched
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Proof panel, Review view, standalone keepsake flows, draft/preflight/lifecycle: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3M — Android SMS XML Adapter)

Package 3M — Android SMS XML Adapter. **COMPLETE — impl `e5bc179`, merged `1228f41` to `main` 2026-06-05.**

Branch: `feature/android-sms-xml-adapter` — base: `main` at `b28979c`

Delivered:
- `src/adapters/android-sms-xml-adapter.js` — `KMEngine.androidSmsAdapter`; ADAPTER_ID `android-sms-xml-v1`; PLATFORM_ID `android-sms`; ADAPTER_VERSION `1`; `canHandle(input)` (detects `<smses` root + `/<sms\b/` or `/<mms\b/` message elements); `parseElements(xml)` DOM-free regex-based scanner preserving document order; `normalizeAll(elements)` → `NormalizedMemory[]` with `type=1→contact`, `type=2→self`, MMS→attachment-placeholder; `import(rawText)` full pipeline; millisecond-epoch timestamp conversion; `importWarnings` for missing sender/address; no external dependencies; registered as `KMEngine.androidSmsAdapter` and `KMEngine.adapters['android-sms-xml-v1']`
- `scripts/fixtures/fake-android-sms-backup.xml` — 10-element fake fixture: 8 SMS (6 valid, 1 empty body, 1 missing sender → skipped) + 2 MMS; fake names and numbers only
- `src/adapters/future-adapter-stubs.js` — removed `android-sms-xml-v1` stub entry
- `src/core/source-platforms.js` — android-sms status `'stub'` → `'supported'`; notes updated
- `src/tests/android-sms-xml-adapter-tests.mjs` — 84 tests across 14 suites (API shape, canHandle accepts/rejects, SMS type=1/2 parsing, senderRole, MMS placeholder, fixture rawCounts, participants, NormalizedMemory fields, provenance, no-throw, importWarnings, semantic guards)
- `src/tests/km-engine-tests.mjs` — loads `android-sms-xml-adapter.js` before stubs; updated android-sms platform assertion to `supported`; added 5 smoke assertions (→106 total)
- `docs/qa/test-strategy.md` — baseline updated 2269→2358; android-sms suite row added; Package 3M note
- `docs/architecture/architecture-roadmap.md` — module map updated; Package 3M IN PROGRESS entry

**Verification results:** 84 new tests + 5 km-engine smoke tests = 89 new tests. All 18 test suites green (2358/2358). No E2E required (engine-only; same precedent as Package 3J). No visual regression required. Hard exclusion diff confirmed empty.

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

**Hard exclusions verified:**
- index.html: not touched
- scripts/e2e-regression-harness.mjs: not touched
- src/products/*: not touched
- src/state/*: not touched
- src/core/normalized-memory.js: not touched
- src/core/import-adapters.js: not touched
- src/core/import-quality-report.js: not touched
- ProductDraft, Preflight, Lifecycle, ProofApproval, readiness, render spec, checkout, PDF, vendor, manufacturing, GATE-04, Review view, standalone keepsake flows: not touched
- Pagination constants, BOOK_PAGINATION_VERSION: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3L — WhatsApp Self-Identification)

Package 3L — WhatsApp Self-Identification. **COMPLETE — impl `7540cc6`, merged `16d0ca6` to `main` 2026-06-05.**

Branch: `feature/whatsapp-self-id` — base: `main` at `2e901a4`

Delivered:
- `index.html` — CSS/HTML/JS for `#whatsappSenderPicker` inline panel (`.whatsapp-sender-picker`, `.sender-picker-inner`, `.sender-chip`, `.sender-chip.active`, dark-mode overrides); `#whatsappSenderPicker` div after `#importQualityPanel`; `const whatsappSenderPicker` binding; two targeted changes to `renderConversation()` using `senderRole === 'self' || sender === 'Me'` for bubble class and header detection; new `showWhatsAppSenderPicker(memories)` function; new `applyWhatsAppSelfSender(senderName)` function; picker shown after WA import, hidden after non-WA import and on restore; `applyWhatsAppSelfSender` exposed on `window.__km`
- `scripts/e2e-regression-harness.mjs` — `WA_ALICE_COUNT = 4`, `WA_BOB_COUNT = 4` constants; Phase 27 (6 real-files tests): picker visible; Alice + Bob chips; selecting Alice → 4 `.me`; selfMessageCount = 4; Skip → 0 `.me`; non-WA import hides picker
- `docs/qa/test-strategy.md` — E2E real-files 89→95; Phase 27 note; Layer 3 description updated; pre-commit baseline updated; Package 3L IN PROGRESS entry added
- `docs/architecture/architecture-roadmap.md` — Package 3L IN PROGRESS entry; last-updated header

**Results:** 2269 Node tests, 0 failed (unchanged). E2E seeded 57/57. E2E real-files 95/95 (+6 Phase 27). Visual regression PASS (baselines unchanged; sender picker above capture zone). Manual QA PASS (29/29 Playwright checks: fresh load picker hidden; 8 WA rows; Alice+Bob+Skip chips; Alice→4 me rows, header=Bob; Bob→4 me rows, header=Alice; Skip→0 me; TXT picker hidden; sender=Me fallback works; save+restore preserves senderRole; picker hidden post-restore; re-import re-shows picker; double-click idempotent; 0 console errors).

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

**Hard exclusions verified:**
- src/adapters/whatsapp-txt-adapter.js: not touched
- src/core/normalized-memory.js: not touched
- src/core/import-adapters.js: not touched
- src/core/source-platforms.js: not touched
- src/products/*: not touched
- src/state/*: not touched
- parseMessages(), applyReactions(), renderConversation(), renderImportQualityPanel(): not touched
- Proof approval, ProductDraft, Preflight, Lifecycle: not touched
- Pagination constants, Review view, standalone keepsake flows: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3K — WhatsApp TXT UI Wiring)

Package 3K — WhatsApp TXT UI Wiring. **COMPLETE — impl `bbd2097`, merged `a048d0d` to `main` 2026-06-05.**

Branch: `feature/whatsapp-txt-ui-wiring` — base: `main` at `6eef338`

Delivered: `index.html` WA detection guard + adapter routing in `readTxtFile()`; script tag for `whatsapp-txt-adapter.js`; Phase 26 E2E (5 tests); 2269 Node; 57/57 seeded; 89/89 real-files; visual regression PASS; 9/9 manual QA.

---

## Objective (last completed pass — Package 3J — WhatsApp TXT Adapter)

Package 3J — WhatsApp TXT Adapter. **COMPLETE — impl `96ea7e3`, merged `f1eca34` to `main` 2026-06-05.**

Branch: `feature/whatsapp-txt-adapter` — base: `main` at `037053e`

Delivered (implementation complete; awaiting Coordinator commit approval):
- `scripts/fixtures/fake-whatsapp-chat.txt` — fake-data bracket-format WhatsApp fixture: 1 system notice + 8 messages (1 media, 1 multi-line)
- `src/adapters/whatsapp-txt-adapter.js` — `KMEngine.whatsappTxtAdapter`; ADAPTER_ID `whatsapp-txt-v1`; PLATFORM_ID `whatsapp`; ADAPTER_VERSION `1`; `canHandle(input)` (bracket + hyphen detection); `normalizeAll(parsedMessages)` (system-message skip, media placeholder, provenance, senderRole contact); `import(rawText)` (full pipeline: parse → normalizeAll → participants → createImportResult); bracket regex `[M/D/YY, H:MM:SS AM]` and hyphen regex `M/D/YY, H:MM AM -`; multi-line continuation; MEDIA_RE handles `<Media omitted>` / image / video / audio / sticker / GIF; graceful timestamp fallback; registered as `KMEngine.whatsappTxtAdapter` and `KMEngine.adapters['whatsapp-txt-v1']`
- `src/adapters/future-adapter-stubs.js` — removed `whatsapp-txt-v1` entry; real adapter now owns that ID
- `src/core/source-platforms.js` — WhatsApp status `stub` → `supported`; notes updated to reflect adapter + pending UI wiring
- `src/tests/whatsapp-txt-adapter-tests.mjs` — 91 tests across 14 suites; loads `source-platforms.js`, `normalized-memory.js`, `import-adapters.js`, `whatsapp-txt-adapter.js`; uses fixture file
- `src/tests/km-engine-tests.mjs` — loads `whatsapp-txt-adapter.js` before `future-adapter-stubs.js`; updated whatsapp status assertion to `supported`; added `whatsappTxtAdapter — smoke` suite (5 assertions); suite count +1 (→ 17 suites), test count +5 (→ 101)
- `docs/qa/test-strategy.md` — baseline 2173 → 2269; Package 3J note; 17 suites
- `docs/architecture/architecture-roadmap.md` — current architecture updated; `whatsapp-txt-adapter.js` in module map; Package 3J delivered section

**Results:** 2269 Node tests, 0 failed. E2E not required (engine-only). Visual regression not required. Hard exclusion diff: empty (verified).

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

**Hard exclusions verified:**
- index.html: not touched
- scripts/e2e-regression-harness.mjs: not touched
- src/products/*: not touched
- src/state/*: not touched
- src/core/normalized-memory.js: not touched
- src/core/import-adapters.js: not touched
- src/core/project-session.js: not touched
- Proof panel, ProductDraft, ProductPreflight, ProductDraftLifecycle, product readiness, render spec, checkout, PDF, vendor, manufacturing, GATE-04, Review view, standalone keepsake flows: not touched
- Pagination constants: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3I)

Package 3I — Import Quality Report. **COMPLETE — impl `c0c8f7a`, merged `60cdd31` to `main` 2026-06-04.**

Branch: `feature/import-quality-report` — base: `main` at `725585c`

Delivered:
- `src/core/import-quality-report.js` — `KMEngine.ImportQualityReport` IIFE module; pure `compute(memories)` function; returns totalMessages, dateRange, uniqueSenderCount, senderList, selfMessageCount, contactMessageCount, attachmentOnlyCount, messagesWithReactionsCount, totalReactionCount, sourcePlatformId, messagesWithoutTimestamp, messagesWithoutText; no DOM, no side effects, Node-testable
- `src/tests/import-quality-report-tests.mjs` — 12 suites, 91 tests; covers API shape, empty input, all metric fields, edge cases, semantic guards
- `index.html` — script tag for import-quality-report.js; `#importQualityPanel` div between search bar and chat messages; CSS for panel; `renderImportQualityPanel(memories)` function; called from `readTxtFile()` and `openConversation()` only (not from restore path); exposed on `window.__km`
- `scripts/e2e-regression-harness.mjs` — Phase 25 (4 tests): panel visible after txt import, correct count, date range present, panel hidden on fresh load; placed in real-files block after Phase 11

**Results:** 2173 Node tests, 0 failed. E2E seeded 57/57 (unchanged). E2E real-files 84/84 (+4 Phase 25). Visual regression PASS (baselines unchanged; `#importQualityPanel` above page canvas, not in capture zone). Manual QA 17/17 PASS. Hard exclusion diff: empty.

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

**Hard exclusions verified:**
- src/products/*, src/state/*, src/adapters/*: not touched
- src/core/normalized-memory.js, src/core/import-adapters.js, src/core/project-session.js: not touched
- ProductDraft, Preflight, Lifecycle, ProofApproval modules: not touched
- Restore path (handleProjectFileLoad): panel not called there
- GATE-04, proof, PDF, checkout, vendor, manufacturing: not touched
- Pagination constants, Review view, standalone keepsake flows: not touched
- No new dependencies

---

## Objective (last completed pass — Package 5C)

Package 5C — Proof Panel User Withdrawal and UX Completion. **COMPLETE — impl `7b00f31`, merged `4733c32` to `main` 2026-06-04.**

Branch: `feature/proof-panel-user-withdrawal` — base: `main` at `25bee3e`

Delivered:
- `src/products/proof-approval-state.js` — added `['pending-review', 'none']` to `_allowed` transitions; `transition()` now handles `pending-review→none` (sets `submittedAt=null`, preserves `createdAt`, updates `updatedAt`; no prohibited fields)
- `src/products/proof-approval-ux.js` — added `withdrawSubmission(productTypeId)` method; updated `getAllowedUserActions('pending-review')` to return `['withdraw-submission']`; exposed `withdrawSubmission` on `KMEngine.ProofApprovalUX`
- `index.html` `renderBookProofPanel()` — pending-review branch now includes "Cancel proof review" button (`#bookProofCancelBtn`) + hint text "Removes local proof review marking. No files were sent."; cancel button click handler calls `UX.withdrawSubmission('message-book')` + immediate re-render; added CSS for `.book-proof-cancel-btn` (light + dark mode)
- `src/tests/proof-approval-state-tests.mjs` — Suite 4: +1 allowed assertion; Suite 5: −1 blocked assertion (11 not 12); new Suite 15: withdrawal transition (18 assertions total)
- `src/tests/proof-approval-ux-tests.mjs` — Suite 1: +1 API shape assertion; Suite 8: updated pending-review to `withdraw-submission` (+2 assertions); new Suite 16 + 16b: withdrawSubmission tests (+25 assertions total)
- `scripts/e2e-regression-harness.mjs` — Phase 24 (4 tests): pending-review DOM state, cancel button existence, withdrawal flow, save/restore with pending-review proof state
- `docs/qa/test-strategy.md` — updated Node baseline 2039→2082; E2E seeded 53→57; Phase 24 added
- `docs/architecture/architecture-roadmap.md` — Package 5C entry added
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — updated to Package 5C in-progress state

**Results:** 2082 Node tests, 0 failed. E2E seeded 57/57. E2E real-files 80/80 (verified in Package 5C verification pass). Visual regression PASS (baselines unchanged; proof panel not in capture zone). Browser/manual QA 27/27 PASS. OS audit 324/0/0. Hard exclusions confirmed empty.

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

**Hard exclusions verified:**
- ProductDraftState, ProductPreflight, ProductDraftLifecycle: not touched
- product-experience-readiness.js, product-render-spec.js: not touched
- proofSupported: not flipped; EXPERIENCE_STATUS.PROOF_READY: not changed
- No approve/revoke/request-changes/admin UI added
- No PDF, checkout, order, vendor, manufacturing, digital facsimile scope
- Pagination constants, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS: not touched
- Review view, standalone keepsake flows: not touched
- project-persistence.js, project-session-restore.js: not touched
- No new dependencies installed
- No external systems mutated

---

## Objective (last completed pass — Package 3H)

Package 3H — Draft-Preflight Status Surface and Proof Panel Gate. **COMPLETE — impl `c0ee68d`, merged `1297f92` to `main` 2026-06-03.**

Delivered:
- `index.html` `showBookView()` — auto-runs PAGINATION_STABILITY book check for each real group whose draft is at `in-progress`: advances in-progress → ready-for-preflight → preflight-passed/failed. Uses `ProductPreflight.run('PAGINATION_STABILITY', inputs)` + `createReport([result])` only. `runAll()` not called. 9 vendor-gated checks remain not-applicable.
- `index.html` `renderBookProofPanel()` — gates "Mark ready for proof review" button on all real groups reaching `preflight-passed`. Shows "Book check needs attention before proof review." (preflight-failed) or "Checking whether this book is ready for proof review." (transient) when not yet passed. No "preflight" in user-visible text. No new admin controls.
- `scripts/e2e-regression-harness.mjs` — Phase 22 tests updated (draft now reaches `preflight-passed` on book entry). Phase 23 (6 tests): book-check auto-advance, draft status, proof panel button gate, idempotency, save/restore, ProofApprovalUX independence.
- `docs/qa/test-strategy.md` — E2E seeded 47→53; Phase 23 added; pre-commit baseline counts updated.
- `docs/architecture/architecture-roadmap.md` — Package 3H entry added.

**Results:** 2039 Node tests, 0 failed. E2E seeded 53/53. E2E real-files 76/76. Visual regression PASS (harness captures per-page elements; proof panel not captured). OS audit 324/0/0. Hard exclusions confirmed empty.

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

---

## Objective (prior completed pass — Package 3G)

Package 3G — Session UI Wiring for ProductDraft Lifecycle. **COMPLETE — impl `05f4048`, merged `3192a15` to `main` 2026-06-03.**

Delivered:
- `index.html` — 3 script tags load `product-draft-state.js`, `product-preflight.js`, `product-draft-lifecycle.js` in the browser runtime
- `index.html` `showBookView()` — initializes all real keepsake group drafts and advances none→in-progress on each book view entry (idempotent); active entry point
- `index.html` `enterComposition()` — forward-compat hook for message-book typeId (current code never calls enterComposition with 'message-book'; wired per package instruction)
- `window.__km.getGroupDraft(groupId, typeId)` — test helper for E2E session-level verification
- `scripts/e2e-regression-harness.mjs` — Phase 22 (6 tests): modules loaded, draft init, idempotency, proof panel independence, save/restore persistence
- `docs/qa/test-strategy.md` — E2E seeded 41→47; Phase 22 added
- `docs/architecture/architecture-roadmap.md` — Package 3G wiring entry; architecture section updated

**Results:** 2039 Node tests, 0 failed. E2E seeded 47/47. E2E real-files 70/70. OS audit 324/0/0. Hard exclusions confirmed clean.

**Next exact action:** Coordinator decides next package or operating action. Do not start any package without explicit Coordinator authorization.

---

## Objective (prior pass — AI Project OS v1.8 State-Zero Bootstrap Finalization)

OS reliability repair: enforce State-Zero closeout rule so wrong active branch/package/next-action are blocking FAILs. Harden `state-freshness-check.mjs` and `start-router.mjs` against post-merge stale docs. Update closeout, handoff, precommit, weekly-sync, and start skills. Add v1.8 final reference and provisioning pack. Update OS audit. Update project-control Tower docs. Docs and scripts only.

**COMPLETE — repair commit `25e2939`, merged `cf63b88` to `main` 2026-06-03.**

---

## Objective (prior pass — Package 3F)

Package 3F — ProductDraft Lifecycle Coordinator. **COMPLETE — impl `18f3544`, merged `395629e` to `main` 2026-06-03.**

Delivered (engine layer only):
- `src/products/product-draft-lifecycle.js` — `KMEngine.ProductDraftLifecycle`: stateless coordinator; `getDraft`, `initDraft`, `advanceDraft`, `applyPreflightResult`, `resetDraft`; in-place mutation of `group.productDrafts`; result envelopes `{ success, error, draft }`
- `src/tests/product-draft-lifecycle-tests.mjs` — 104 tests across 9 suites; semantic guards
- `docs/architecture/architecture-roadmap.md` — post-Package 3F update; lifecycle coordinator added to module tree
- `docs/qa/test-strategy.md` — baseline 1935 → 2039; new suite row added

**Results:** 2039 Node tests, 0 failed. No E2E (engine-layer only, no index.html). No visual regression. No `index.html`, no proof approval modules, no readiness gates touched.

---

## Objective (prior pass — Package 3E)

Package 3E — ProductDraft and Preflight Runner Foundation. **COMPLETE — impl `dd4f641`, merged `4390038` to `main` 2026-06-02.**

Delivered (engine layer only):
- `src/products/product-draft-state.js` — `KMEngine.ProductDraftState`: 5-status draft lifecycle (none → in-progress → ready-for-preflight → preflight-passed/failed); create/advance/canAdvance/isValidStatus; immutable, JSON-safe
- `src/products/product-preflight.js` — `KMEngine.ProductPreflight`: 10-check registry mirror; PAGINATION_STABILITY runner; 9 gated checks return not-applicable; aggregate `overallStatus` (passed/failed/incomplete/skipped); **no manufacturing readiness API**
- `src/state/project-persistence.js` — productDrafts array validation + group serialization
- `src/state/project-session-restore.js` — productDrafts restore normalization (drops malformed, warns)
- New suites: `product-draft-state-tests.mjs` (90), `product-preflight-tests.mjs` (119); `project-persistence-tests.mjs` +22 (157)

**Results:** 1935 Node tests, 0 failed. E2E seeded 41/41, real-files 64/64. Visual regression PASS. OS audit 304/304. No `index.html`, no proof approval modules, no readiness gates touched.

---

## Objective (prior pass — Package 3D)

Package 3D — Visual Regression Baseline Harness. **COMPLETE — impl `5a5eaa0`, merged `645f6bd` to `main` 2026-06-02.**

Delivered:
- `scripts/visual-regression-harness.mjs` — 4 modes: `--update-baselines`, `--check`, `--simulate-regression`, `--headed`; port 7333; pixelmatch + pngjs; Scenario A
- `scripts/visual-regression-baselines/scenario-a/` — 4 committed page PNGs + manifest; BOOK_PAGINATION_VERSION=1; ~66 KB total
- `scripts/package.json` — added `pixelmatch`, `pngjs`, `vr:baseline`, `vr:check`
- `.gitignore` — added `visual-regression-output/`
- `docs/qa/visual-regression-guide.md` — usage guide, baseline policy, threshold docs
- `docs/qa/test-strategy.md` — 5 layers → 6 layers; visual regression added as Layer 5
- `docs/qa/e2e-regression-harness.md` — visual fidelity section updated; Package 3D complete reference

**Results:** 1704 Node tests, E2E 41/41 seeded, 64/64 real-files; `--check` exits 0; `--simulate-regression` exits 1 (185,150 px mismatch detected on page 1); no app code touched.

---

## Objective (prior pass — post-Package-5B weekly sync)

Post-Package-5B weekly sync — project-control Tower catch-up (docs only). **COMPLETE — impl `bb45dbb`, merged `522ad12` to `main` 2026-06-02.**

Delivered (15 files, docs-only):
- Marked Package 5B Done across Tower, backlog, command-center, and state docs
- Closed Sprint 2026-06-A; opened Sprint 2026-06-B
- All validators passed (OS audit 304/304, state freshness WARN-only, project-control sync 11/11)
- No app code touched; no external mutations

---

## Objective (prior pass — Operator Reliability Repair)

Operator Reliability Repair — OS/operator workflow only. **COMPLETE — merged `c27502c` to `main` 2026-06-02.**

Delivered:
1. `docs/dev/raw-transcript-capture-protocol.md` (new) — honest file-first response protocol with limitation statement, metadata block format, path convention, and gitignore verification steps.
2. `.claude/skills/raw-transcript-capture/SKILL.md` (new) — skill for executing the file-first protocol at every operationally significant response.
3. `.claude/commands/raw-transcript-capture.md` (new) — thin command wrapper.
4. `scripts/raw-transcript-check.mjs` (new) — dependency-free verification script; confirms gitignore, lists recent transcripts, checks git status.
5. `scripts/notification-check.mjs` (new) — dependency-free diagnostic for PermissionRequest and Stop hook config across all config dirs.
6. `.claude/skills/closeout/SKILL.md` (modified) — added file-first protocol step.
7. `.claude/skills/handoff/SKILL.md` (modified) — added file-first protocol step.
8. `.claude/skills/report-intake/SKILL.md` (modified) — added raw transcript vs mirror distinction.
9. `.claude/skills/weekly-sync/SKILL.md` (modified) — added file-first protocol step.
10. `.claude/commands/README.md` (modified) — added `/raw-transcript-capture` command.
11. `.claude/skills/README.md` (modified) — added skill to roster; updated count to 22.
12. `docs/dev/closeout-sync-contract.md` (modified) — added Raw transcript capture requirement section.
13. `docs/dev/notification-setup.md` (modified) — added completion sound (Stop hook) section + diagnostic script reference.
14. `docs/project-control/report-mirror-policy.md` (modified) — added raw transcript vs mirror distinction section.
15. `docs/project-control/report-intake-runbook.md` (modified) — updated raw transcript export handling.
16. `docs/ai-system/universal-standards.md` (modified) — added raw transcript capture and completion sound to automation table.
17. `docs/ai-system/bootstrap-template.md` (modified) — added raw transcript capture and notification-check to bootstrap template.
18. `docs/ai-system/os-self-audit-checklist.md` (modified) — added Section 6k (16 new checks).
19. `scripts/os-self-audit.mjs` (modified) — added Section 6k checks; total now 304 pass.

**OS audit:** 304 pass, 0 warn, 0 fail — BOOTSTRAP COMPLETE.
**Notification diagnosis:** `Stop` hook is missing in both config dirs (`~/.claude-account-icloud` and `~/.claude`). `Notification` and `PermissionRequest` are configured. Manual step required to add Stop hook — see `docs/dev/notification-setup.md`.

**Next exact action:** Coordinator decides next package or next direction. Do not start any package without explicit authorization.

---

## Objective (last completed pass — Package 5B)

Package 5B — Message Book Proof Approval UX Foundation. **COMPLETE.**

Delivered:
1. `src/products/proof-approval-ux.js` (new) — KMEngine.ProofApprovalUX IIFE module: initialize, getState, submitForReview, getStatusLabel, getAllowedUserActions, serialize, restore.
2. `src/tests/proof-approval-ux-tests.mjs` (new) — 77 tests across 15 suites.
3. `src/state/project-persistence.js` (modified) — proofApprovalStates in createSnapshot and validation.
4. `src/state/project-session-restore.js` (modified) — proofApprovalStates in KNOWN_SESSION_FIELDS, returned in appState.
5. `src/tests/project-persistence-tests.mjs` (modified) — 24 new Package 5B tests.
6. `index.html` (modified) — script tags, #bookProofPanel, CSS, renderBookProofPanel(), save/restore wiring.

**Results:** 1704 Node unit tests, 0 failed. E2E seeded 41/41, real-files 64/64. Browser QA 36/36 PASS_MERGE_READY. No console errors or warnings.

**Implementation commit:** `fb62b5c` | **Merge commit:** `dc4f86b` | **Date:** 2026-06-02

**Next exact action:** Coordinator decides next package or next operating action. Do not start any package without explicit authorization.

---

## Objective (prior completed pass — v1.7 Gate 5)

AI Project OS v1.7 Gate 5 — External Sync Consistency Validators.

**Gate 5 COMPLETE — committed `a9a94e5` 2026-06-01, merged `2b37e13`.** Delivered:
1. `scripts/external-sync-consistency-check.mjs` — dependency-free Node ESM consistency validator. Four layers: source records, local sync map (read-only, privacy-safe), committed logs, live read-only external. Issue codes for Google Calendar, GitHub Projects, cross-platform. CLI: `--json`, `--local-only`, `--fixture`, `--google-calendar`, `--github-projects`, `--all`, `--live-readonly`, `--strict`, `--explain`, `--paths`, `--output`. No mutations.
2. `docs/project-control/external-sync-consistency-policy.md` — policy: four layers, FAIL/WARN/PASS criteria, privacy rules.
3. `docs/project-control/external-sync-consistency-schema.md` — complete issue code reference.
4. `docs/project-control/external-sync-consistency-log.md` — committed log (starts empty).
5. `docs/project-control/external-sync-consistency-fixture.example.json` — fixture with fake data; 8+ scenarios.
6. `.claude/skills/external-sync-consistency/SKILL.md` + `.claude/commands/external-sync-consistency.md` — new skill and command.
7. Skills updated: `closeout`, `precommit`, `weekly-sync`, `project-sync-dry-run`, `report-intake` — consistency check integration.
8. `docs/dev/closeout-sync-contract.md` — External sync consistency requirement section.
9. `scripts/os-self-audit.mjs` — Section 6i checks (~30 new checks).
10. `docs/ai-system/os-self-audit-checklist.md` — Section 6i (24 items).
11. `scripts/start-router.mjs` — Gate 5 awareness; external sync consistency signal.
12. State files, CHANGELOG, version-history, current-sprint, kanban-board updated.

**COMPLETE — committed `a9a94e5` 2026-06-01.**

**Repair applied (post-initial-implementation):** Fixed local sync-map shape parsing (apply-script shape `google_calendar.events[os_id]` and `github_projects.issues[os_id]`), added `--fixture-test` mode, scoped `FAIL_GCAL_POSSIBLE_DUPLICATE` to KeepMees-related events only, fixed googleapis Windows ESM import path, fixed GHP live query to use stdin JSON. Local-only now exits 0 (WARN only). Fixture-test exits 0. GCal live read-only: PASS (6 pass, 0 warn, 0 fail — all 10 source records confirmed). GHP live read-only: PASS (5 pass, 13 warn, 0 fail — all 11 KM-PC-* items found; 13 WARNs are expected due to absent GHP local map section). OS audit: 253 pass, 0 warn, 0 fail.

---

## Objective (last completed pass — v1.7 Gate 4)

AI Project OS v1.7 Gate 4 — Start Router, Context Usage, and Model Routing Hardening.

**Gate 4 COMPLETE — merged `352356b` 2026-06-01.** Delivered:
1. `scripts/start-router.mjs` — dependency-free Node ESM start router. 9 verdicts, 8 CLI modes. Read-only.
2. `.claude/skills/start-router/SKILL.md` + `.claude/commands/start-router.md` — new skill and command.
3. Skills updated: `start`, `package-start`, `handoff`, `switch-to-codex`, `switch-to-claude` — all reference start router.
4. Commands updated: `start.md`, `package-start.md`, `switch-to-codex.md`, `switch-to-claude.md`.
5. `docs/dev/model-routing-protocol.md` — Strongest-tier boundaries, Plan Mode/opusplan section, Scrutinous adoption rule, custom model settings expansion.
6. `docs/dev/session-restart-protocol.md` — start router step added (step 8).
7. `docs/dev/context-hygiene-protocol.md` — start-router row in decision table, repo-native signals section, claude --continue warning.
8. `docs/dev/context-budget-checklist.md` — start router step 1, branch type step 2.
9. `docs/dev/model-switching-protocol.md` — start router step added; no-auto-switching rule.
10. `docs/dev/auto-management-protocol.md` — start router in session-start protocol; command table updated.
11. `docs/ai-system/universal-standards.md` — Scrutinous adoption rule section, startup routing section, automation table updated.
12. `docs/ai-system/os-self-audit-checklist.md` — Section 6h (22 items).
13. `scripts/os-self-audit.mjs` — Section 6h checks (22 new checks).
14. `.gitignore` — `raw-transcripts/` added.
15. `docs/project-control/current-sprint.md` — Gate 4 In Progress.
16. `docs/project-control/kanban-board.md` — Gate 3 Done, Gate 4 In Progress.
17. `docs/ai-system/CHANGELOG.md` — Gate 4 IN PROGRESS entry.
18. `docs/ai-system/version-history.md` — v1.7.4 IN PROGRESS row.
19. State files updated to Gate 4 branch.

---

## Summary (prior completed pass — v1.7 Gate 3)

AI Project OS v1.7 Gate 3 — Report Mirroring and Project-Control Log Intake.

**Gate 3 COMPLETE — merged `a86ae11` 2026-06-01.** Delivered:
1. `scripts/report-mirror-intake.mjs` — dependency-free Node ESM intake script. Default dry-run. `--input`/`--stdin`. `--type`, `--apply`, `--redact-only`, `--json`, `--redact-risk-accepted`. Redacts `ghp_*`, `github_pat_*`, `ghs_*`, PEM blocks, `GOCSPX-*`, `ya29.*`, `1//*`. Never prints secrets. Exit 0/1.
2. `docs/project-control/report-mirror-policy.md` — mirroring policy, what is/isn't mirrored, mandatory vs skip rules, automation distinctions, redaction safeguards.
3. `docs/project-control/report-mirror-schema.md` — schema: 10 report_type values, 4 source_type values, 4 mirror_status values, metadata fields, example (fake data).
4. `docs/project-control/report-mirror-log.md` — durable committed index (starts empty; first entry at Gate 3 closeout).
5. `docs/project-control/report-intake-runbook.md` — full step-by-step runbook.
6. `.claude/skills/report-intake/SKILL.md` + `.claude/commands/report-intake.md` — new skill/command.
7. Skills updated: `closeout`, `handoff`, `precommit`, `start`, `weekly-sync` — all integrated with report mirroring check.
8. `docs/dev/closeout-sync-contract.md` — Report mirroring requirement section + outcome table.
9. `scripts/os-self-audit.mjs` — Section 6g checks (22 new checks); count rises ~179 → ~201.
10. `docs/ai-system/os-self-audit-checklist.md` — Section 6g added (19 items).
11. `.gitignore` — `local-report-intake/` added.
12. State files, CHANGELOG, version-history, current-sprint, kanban-board updated.

**Next exact action:** Coordinator reviews Gate 3 implementation report. If approved, commit and merge Gate 3.

---

## Summary (prior completed pass — v1.7 Gate 2)

AI Project OS v1.7 Gate 2 — Closeout and State Freshness Validators.

**Gate 2 COMPLETE — merged `3db3074` 2026-06-01.** Delivered:
1. `scripts/state-freshness-check.mjs` — dependency-free Node ESM validator. FAIL/WARN/PASS classification. 8 issue codes. CLI: `--json`, `--strict`, `--paths`, `--explain`. Checks: branch alignment, Package 5B, merged branches in kanban, test baseline, gitignore, HEAD lag, changelog/version-history stale status, model ID examples, sprint/kanban copy lag.
2. `docs/dev/closeout-sync-contract.md` — State-Sync Decision Matrix added: FAIL/WARN/PASS table with examples, validator command, Package 5B blocked rule, external apply rule, Post-Commit State Rule reminder.
3. `docs/project-control/kanban-board.md` — Done column with v1.2–v1.7 Gate 1; Gate 2 in In Progress; Sprint 2026-06-A View 2 added.
4. `docs/project-control/current-sprint.md` — Sprint 2026-05-B closed as historical; Sprint 2026-06-A opened with Gate 2 task list.
5. `docs/qa/test-strategy.md` — baseline 1466 → 1603; `proof-approval-state-tests.mjs` (137 tests) added; OS-only validation rule added.
6. `docs/dev/model-routing-protocol.md` — Opus 4.7 → Opus 4.8; model ID rule; custom model settings section; "opusplan" rejected.
7. Skills updated: `closeout`, `precommit`, `handoff`, `start` — all reference `state-freshness-check.mjs`.
8. `scripts/os-self-audit.mjs` — 13 new Section 6f checks; count rises to ~179.
9. `docs/ai-system/os-self-audit-checklist.md` — Section 6f added.
10. `docs/ai-system/CHANGELOG.md`, `version-history.md` — Gate 2 IN PROGRESS entries; v1.6.x stale statuses corrected.
11. State files (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`) updated to Gate 2 branch.

---

## Gate status (v1.6 + advisory repair)

| Gate | Status |
|---|---|
| Gate 1 — Repo Implementation | COMPLETE — merged `5c4bd28` 2026-05-31 |
| Gate 2A — Fixture Logic Implementation | COMPLETE — merged `a530c56` 2026-05-31 |
| Gate 2C — Dependency Hygiene + googleapis Install | COMPLETE — merged `041761a` 2026-05-31 |
| Gate 2D Repair — OAuth Bootstrap + Path Alignment | COMPLETE — merged `fe1315a` 2026-05-31 |
| Gate 2D — Live Calendar Read-Only Dry-Run | COMPLETE — 2026-06-01. 478 events fetched. 10 CREATE, 0 blockers. Artifact: `local-sync-reports/google-calendar-dry-run-live-2026-06-01T00-21-06-514Z.json` |
| Gate 3 — Live Calendar Apply | COMPLETE — 2026-06-01. 10 events created. 0 errors. Post-apply dry-run: all 10 NO_OP, high confidence. |
| Advisory Repair — Sync-Map Read Path | COMPLETE — merged `db45e6a` 2026-06-01. Post-repair live dry-run: 488 events, 10 NO_OP, 0 MISSING_LOCAL_MAPPING, 0 blockers. |

**AI Project OS v1.6 — COMPLETE. Advisory repair merged `db45e6a` 2026-06-01.**

---

## Advisory status

RESOLVED. The `MISSING_LOCAL_MAPPING` advisory from the post-Gate-3 dry-run has been repaired. Root cause was that `runLiveMode` passed an empty map to `compareSourceToEvents`. Fixed by reading `external-sync-map.local.json` and supporting both the apply-script shape and the example shape. Post-repair live dry-run confirms: 0 MISSING_LOCAL_MAPPING, 10 NO_OP, 0 blockers.

---

## Hard exclusions verified (advisory repair)

- `index.html` — not touched
- `src/**` — not touched
- `public/**` — not touched
- `amplify/**` — not touched
- `package.json`, `package-lock.json` (root) — not touched
- No GitHub Project mutations
- No GitHub Issues created
- No Package 5B work
- No events deleted or cancelled
- No credential or token file contents read or printed
- `local-sync-reports/` — gitignored, not staged or committed
- `external-sync-map.local.json` — gitignored, written locally only, not staged or committed
- `google-calendar-token.local.json` — gitignored, not staged or committed
- `google-calendar-credentials.local.json` — gitignored, not staged or committed

---

## Next exact action

No active pass or package. `Weekly Sync / Project Control Tower Catch-Up after Package 3W` COMPLETE — docs `056cdd9`, merged `24810bf` 2026-06-07.

Next session: read this file, verify main at `24810bf`, confirm 2650/2650 Node tests and 134/134 real-files E2E. Await Coordinator authorization for Package 3X (DEF-15 non-vendor subset — Pre-print Content Quality Checks) or next direction. Do not start any package without explicit Coordinator authorization.

Do not commit or push without explicit Coordinator authorization. No external mutations authorized.

---

## Source-of-truth files to read first on resume

1. `AGENTS.md`
2. `CLAUDE.md`
3. This file (`AI_HANDOFF.md`)
4. `CURRENT_STATE.md`
5. `docs/ai-system/README.md`
6. `docs/dev/auto-management-protocol.md`
7. `git status --short` / `git log --oneline -10`

---

## File-level warnings

| File | Warning |
|---|---|
| `index.html` | Scope-guarded constants, Review view, standalone keepsake flows — off-limits without explicit instruction. |
| `src/products/product-experience-readiness.js` | Off-limits — do not touch EXPERIENCE_STATUS.PROOF_READY. |
| `src/state/project-persistence.js` | Off-limits without explicit package instruction. |
| `src/state/session-serialization.js` | Off-limits without explicit package instruction. |
| `docs/project-control/external-sync-map.local.json` | Gitignored, local-only — never commit; do not read or print contents. |
| `scripts/google-calendar-sync-apply.mjs` | `--confirm-live-calendar-apply` flag required for Gate 3. Also requires `--apply`, `--approved-dry-run <path>`, and no unresolved DUPLICATE_DETECTED or ADOPTION_REQUIRED items. |
| `scripts/google-calendar-sync-dry-run.mjs` | `--live-readonly` mode requires credentials + googleapis. Gate 2B not yet authorized. `--fixture` mode requires no credentials. |
| `scripts/node_modules/` | Gitignored. Not tracked in git. googleapis v173.0.0 installed locally. Do not re-track. |
| `docs/ai-system/*` | Universal portable layer. Edit only in dedicated AI Project OS upgrade passes. |
