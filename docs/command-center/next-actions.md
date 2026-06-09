# Next Actions — KeepMees / MessageVault

**Last updated:** 2026-06-08
**Updated by:** Claude Code (Package 3AL — Import Insights Panel Visual Regression Coverage — COMPLETE; impl/merge `a244463`, merged to `main` 2026-06-08; state-sync `71a8b26`; QA harness only — additive `--scenario import-panels` VR scenario + 10 committed panel baselines; Scenario A untouched; no `index.html`/`src`/behavior change; Post-Package-3AL Tower Catch-Up IN PROGRESS — docs-only, stop-before-commit)

Items marked **[NEEDS APPROVAL]** require explicit Coordinator authorization before any work begins.

---

## Immediate (this session or next)

| # | Action | Role | Authorization required |
|---|---|---|---|
| 1 | Authorize next development package — Package 3AL COMPLETE (impl/merge `a244463`, merged to `main` 2026-06-08; state-sync `71a8b26`); Post-Package-3AL Tower Catch-Up IN PROGRESS (docs-only, stop-before-commit); next candidate: TBD; see decision-log.md | Coordinator | **[NEEDS APPROVAL]** |
| 2 | (Optional) Import `.ics`, ClickUp CSV, TickTick CSV | Founder | — |
| 3 | Decide GitHub Projects board setup | Coordinator | **[NEEDS APPROVAL]** |
| 4 | Decide NotebookLM adoption | Coordinator | **[NEEDS APPROVAL]** |
| 5 | Decide `scripts/node_modules` tracked-history cleanup | Coordinator | **[NEEDS APPROVAL]** |
| 6 | (Optional) Install user-level notification hook: run `.\scripts\setup-claude-notification.ps1 -Apply` | Founder / contributors | — |

---

## Next development package (awaiting Coordinator authorization)

**Status: Package 3AL COMPLETE — impl/merge `a244463`, merged to `main` 2026-06-08; state-sync `71a8b26`. Post-Package-3AL Tower Catch-Up IN PROGRESS (docs-only, stop-before-commit). Coordinator decides next package.**

Package 3AL (Import Insights Panel Visual Regression Coverage) is COMPLETE — fast-forward merged to main (`a244463`; state-sync `71a8b26` 2026-06-08). QA harness only — an additive `--scenario import-panels` path in `scripts/visual-regression-harness.mjs` seeds deterministic memories via the existing `window.__km.seedChatMessages` + `window.__km.renderImportInsights` bridges (no `index.html`/`src`/DOM/CSS/app change) and screenshots each visible import-insights panel into `scripts/visual-regression-baselines/import-panels/` (10 committed PNG baselines + manifest). Closes the documented blind spot where Scenario A only captured `#bookCanvas .book-page` and the import-panel zone was never visually checked. Scenario A path/thresholds/filenames/baselines untouched. Verification: Node 3645/30 unchanged; 57/57 seeded; 195/195 real-files; Scenario A VR PASS 4/4 unchanged; import-panels VR PASS 10/10; `--simulate-regression --scenario import-panels` proves detection. The Post-Package-3AL Tower Catch-Up (this docs-only pass) records 3AL across the Tower and is awaiting Coordinator commit authorization.

Package 3AK (Import Insights Registry-Driven Dispatcher Consolidation) is COMPLETE — fast-forward merged to main (`052346f`; state-sync `18019ba` 2026-06-08). Behavior-preserving wiring consolidation completing the Package 3AJ debt-paydown: `renderImportInsights(memories)` now iterates an ordered `IMPORT_INSIGHT_RENDERERS` registry array (the ten existing panel renderers in their exact current order) instead of ten hardcoded calls; all ten `renderXPanel` functions, their individual `window.__km` bridges, the literal `window.__km` bridge block, `window.__km.renderImportInsights`, and all 11 dispatcher call sites are preserved unchanged; the bridge block is deliberately left literal (not generated from the registry). **No new engine, no new panel, no DOM/CSS/panel-order/panel-copy/visibility/behavior change.** Baseline unchanged: 3645 Node / 30 suites; 57/57 seeded; 195/195 real-files; visual regression PASS. The Post-Package-3AK Tower Catch-Up (this docs-only pass) records 3AK across the Tower and is awaiting Coordinator commit authorization.

Package 3AJ (Import Insights Consolidation) is COMPLETE — fast-forward merged to main (`92435b7`; state-sync `e445212` 2026-06-08). Behavior-preserving wiring consolidation: a single `renderImportInsights(memories)` dispatcher was added to `index.html` that delegates to the ten existing import-panel renderers (`renderImportQualityPanel` → `renderReactionAnalysisPanel`) in their existing order; the per-panel call clusters at all 11 import/open sites were replaced with one `renderImportInsights(...)` call each (same argument per site). All individual `renderXPanel` functions and their `window.__km` bridges are preserved; `window.__km.renderImportInsights` is added. **No new engine, no new panel, no DOM/CSS/panel-order/panel-copy/visibility/behavior change** — this is debt-paydown of the per-engine wiring sprawl created by the analytics series, not new product surface. Baseline unchanged: 3645 Node / 30 suites; 57/57 seeded; 195/195 real-files; visual regression PASS (panels sit above the page-canvas capture zone). The Post-Package-3AJ Tower Catch-Up (this docs-only pass) records 3AJ across the Tower and is awaiting Coordinator commit authorization.

Package 3AI (Verification & Harness Reliability Hardening) is COMPLETE — fast-forward merged to main (`d4a6c71`; state-sync `803cd64` 2026-06-08). Scripts + docs only: `scripts/e2e-regression-harness.mjs` Phase 1 startup reliability hardened (bounded 3-attempt server re-probe + backoff; richer `waitForKm`/`Harness.run` failure diagnostics) with **no assertion or test-count changes**; baseline docs refreshed without a new stale-number trap (`test-strategy.md` changelog → 3AG/3AH; `current-status.md` detail-lag → 3AH; `pre-commit-verification-template.md` non-staling baseline pointer). No `index.html`, no `src/**`, no new test-runner orchestrator. Baseline unchanged: 3645 Node / 30 suites; 57/57 seeded; 195/195 real-files; visual regression PASS. The Post-Package-3AI Tower Catch-Up (this docs-only pass) records 3AI across the Tower and is awaiting Coordinator commit authorization.

Package 3AH (Reaction Analysis Engine + Panel) is COMPLETE — fast-forward merged to main (`a165122` 2026-06-08; state-sync `c8378c7`). `KMEngine.ReactionAnalysis.compute(memories)` pure IIFE engine added (`src/core/reaction-analysis.js`); returns { totalReactions, messagesWithReactions, topReactionEmojis: [{ emoji, count, rank }] (MAX_TOP=5), topReactor: { reactor, count } | null, mostReactedToSender: { sender, count } | null }; consumes the `NormalizedMemory.reactions[]` captured in Package 3AG; counts by emoji, by reactor, and by reacted-to message sender; sort count desc then string asc; zero-state for empty/invalid/no-reaction. `#reactionAnalysisPanel` rose/crimson panel is an **import-time advisory surface only** (hidden when totalReactions === 0); `renderReactionAnalysisPanel(memories)` called at all 11 import/open sites; `window.__km.renderReactionAnalysisPanel` exposed. `reaction-analysis-tests.mjs` (66 tests / 14 suites, incl. an ImportQualityReport-preservation regression assertion) + 6 km-engine smoke (→180); Phase 44 E2E (6 tests, reuses `fake-instagram-dm.json`); 3645 Node / 30 suites; 57/57 seeded; 195/195 real-files; visual regression PASS. **No DEF-11 in-book reaction rendering, no Message Book reaction badges, no adapter / import-quality-report / normalized-memory changes.** The ReactionAnalysis engine + panel that was the likely 3AG follow-up candidate is now DELIVERED; next candidate: TBD pending Coordinator authorization.

Package 3AG (Meta Reaction Capture) is COMPLETE — fast-forward merged to main (`0331da0` 2026-06-08; state-sync `2e081fe`). Capture-only groundwork: the Instagram DM and Facebook Messenger adapters now map Meta `{ reaction, actor }` into `NormalizedMemory.reactions[]` as canonical `{ reactor, emoji, label }` via new per-adapter `mapReactions()` + `decodeReaction()` helpers (`decodeReaction()` repairs Latin-1-escaped-UTF-8 mojibake with a raw-preserve fallback; malformed-safe). Fixtures enriched (IG 2 clean-unicode; FB 1 mojibake→👍 + 1 clean; 8 imported each unchanged); `ImportQualityReport` reaction counts now real for Meta imports. `instagram-dm-adapter-tests.mjs` 87→101 (Suite 16), `facebook-messenger-adapter-tests.mjs` 98→113 (Suite 18); 3573 Node / 29 suites; 57/57 seeded; 189/189 real-files. **No ReactionAnalysis engine, no reaction panel, no DEF-11 in-book reaction rendering** — those are deferred (a ReactionAnalysis engine + panel is the likely next candidate, TBD pending Coordinator authorization).

Package 3AF (Conversation Initiation Analysis Engine) is COMPLETE — fast-forward merged to main (`7f03889` 2026-06-08; state-sync `4ff64b5`). `KMEngine.ConversationInitiation.compute(memories)` engine module added (`src/core/conversation-initiation.js`); returns { totalConversations, topInitiator: { sender, initiationCount } | null, perSenderStats: [{ sender, initiationCount, initiationPct }] }; filters non-system messages with valid timestamps, sorts ascending; a conversation start = first valid message + any message whose gap from the previous valid message >= GAP_THRESHOLD_MS (named constant, 6 hours); topInitiator tie-break sender asc; perSenderStats sorted initiationCount desc then sender asc; initiationPct = count/total × 100 rounded 1 decimal; zero-state for empty/invalid/no-valid input; pure IIFE, no DOM; `#conversationInitiationPanel` pink/magenta CSS wired in `index.html`; `renderConversationInitiationPanel(memories)` called at 11 import/open sites; `window.__km.renderConversationInitiationPanel` exposed; Phase 43 E2E (6 tests); 3544 Node / 29 suites; 57/57 seeded; 189/189 real-files.

Package 3AC (Message Timing Analysis Engine) is COMPLETE — fast-forward merged to main (`74ff910` 2026-06-07). `KMEngine.TimingAnalysis.compute(memories)` engine module added (`src/core/timing-analysis.js`); returns { peakHour, peakHourCount, peakDayOfWeek, peakDayOfWeekCount, hourlyDistribution: number[24], dailyDistribution: number[7] }; UTC-based (getUTCHours / getUTCDay); skips null/falsy/invalid timestamps; zero-state for empty/invalid/no-valid-timestamps; tie-break lowest index wins; pure IIFE, no DOM; `#timingAnalysisPanel` green CSS wired in `index.html`; `renderTimingAnalysisPanel(memories)` called at 11 import/open sites; `window.__km.renderTimingAnalysisPanel` exposed; Phase 40 E2E (6 tests); 3273 Node / 26 suites; 57/57 seeded; 171/171 real-files.

Package 3AB (Word Count / Language Analysis Engine) is COMPLETE — merged to main (`ebf9668` 2026-06-08). `KMEngine.WordAnalysis.compute(memories)` engine module added (`src/core/word-analysis.js`); returns { totalWords, avgWordsPerMessage, topWords: [{word,count,rank}], topWordSender: {sender,wordCount}|null }; MAX_TOP=10; splits on whitespace; strips leading/trailing non-word chars; lowercase; skips attachment-only and blank/null text; tie-break topWords by count desc then word asc; topWordSender tie-break wordCount desc then sender asc; avgWordsPerMessage rounded to 1 decimal; `#wordAnalysisPanel` purple/violet CSS wired in `index.html`; `renderWordAnalysisPanel(memories)` called at 11 import/open sites; `window.__km.renderWordAnalysisPanel` exposed; Phase 39 E2E (6 tests); 3174 Node / 25 suites; 57/57 seeded; 165/165 real-files.

Package 3AA (Emoji Analysis Engine) is COMPLETE — merged to main (`29c4491` 2026-06-07). `KMEngine.EmojiAnalysis.compute(memories)` engine module added (`src/core/emoji-analysis.js`); returns topEmojis (MAX_TOP=5, [{emoji,count,rank}]), totalEmojiCount, uniqueEmojiCount, mostEmojifiedSender; handles ZWJ sequences, skin-tone modifiers, keycap sequences, regional indicator flag pairs; safe zero-state for empty/null/non-array; `#emojiAnalysisPanel` teal CSS scheme wired in `index.html`; `renderEmojiAnalysisPanel(memories)` called at 11 import/open sites; `window.__km.renderEmojiAnalysisPanel` exposed; Phase 38 E2E (6 tests); 3068 Node / 24 suites; 57/57 seeded; 159/159 real-files; partially activates DEF-14.

Package 3Z (Extended Content Quality Checks) is COMPLETE — merged to main (`ff79f9e` 2026-06-07). `KMEngine.ContentQualityChecks.compute(memories)` extended with 4 new WARN checks: HIGH_ATTACHMENT_RATIO (>80% attachment-only), VERY_LONG_CONTENT (text.length>1000, skip attachment-only), SHORT_CONVERSATION (<10 messages), SINGLE_SENDER_DOMINANT (all non-system from 1 unique sender); `content-quality-checks.js` now 9 WARN checks total; Suite 3 enlarged + Suites 16–19 added (134→184 CQC tests); 4 km-engine smoke added (134→138); Phase 37 E2E (7 tests); `CQC_EXTENDED_FIXTURE_COUNT=6`; 2962 Node (23 suites); 57/57 seeded; 153/153 real-files; no index.html changes; OS audit 324/0/0.

Package 3Y (Conversation Statistics Engine) is COMPLETE — merged to main (`e0539d2` 2026-06-07). `KMEngine.ConversationStats.compute(memories)` engine module added (`src/core/conversation-stats.js`); returns busiestDay, busiestDayCount, longestStreakDays, avgMessagesPerDay, totalDays, perSenderStats; zero-state for empty/invalid; perSenderStats includes all senders including senderRole:self; `#conversationStatsPanel` wired in `index.html` with indigo CSS scheme; `renderConversationStatsPanel(memories)` called at 11 import/open sites; `window.__km.renderConversationStatsPanel` exposed for E2E testability; Phase 36 E2E (6 tests); 2908 Node (23 suites); 57/57 seeded; 146/146 real-files; OS audit 324/0/0.

Package 3X (Pre-print Content Quality Checks) is COMPLETE — merged to main (`7bdcdb5` 2026-06-07). `KMEngine.ContentQualityChecks.compute(memories)` engine module added (`src/core/content-quality-checks.js`); 5 advisory WARN checks: PHONE_NUMBER_AS_SENDER_NAME, RAW_URL_IN_CONTENT, EMPTY_MESSAGE, DUPLICATE_MESSAGE (adjacent-only), SYSTEM_MESSAGE_IN_OUTPUT; `#contentQualityPanel` wired in `index.html` with amber CSS scheme; `renderContentQualityPanel(memories)` called at 10 import/open sites; `window.__km.renderContentQualityPanel` exposed for E2E testability; Phase 35 E2E (6 tests); 2790 Node (22 suites); 57/57 seeded; 140/140 real-files; OS audit 324/0/0.

Package 3W (Telegram Self-Identification Sender Picker) is COMPLETE — merged to main (`2bf1900` 2026-06-06). `#telegramSenderPicker` inline picker added to `index.html`; `showTelegramSenderPicker` + `applyTelegramSelfSender` functions delivered; picker hides on all non-Telegram import paths + restore; `window.__km.applyTelegramSelfSender` exposed for E2E testability; Phase 34 E2E (6 tests); 2650 Node; 57/57 seeded; 134/134 real-files; visual regression PASS. Mirrors Package 3Q (Instagram DM) and Package 3T (Facebook Messenger) sender picker patterns.

Package 3V (Telegram JSON UI Wiring) is COMPLETE — merged to main (`40a6a78` 2026-06-06). `telegram-adapter.js` script tag added to `index.html`; Telegram routing guard inserted in `readTxtFile()` after Instagram DM guard, before legacy TXT fallback; collision-safe (from_id + date_unixtime positive discriminators; participants + magic_words negative discriminators); no sender picker (delivered in Package 3W); Phase 33 E2E (5 tests); 2650 Node; 57/57 seeded; 128/128 real-files; visual regression PASS. Routing order now: WhatsApp TXT → Android SMS XML → Facebook Messenger JSON → Instagram DM JSON → Telegram JSON → legacy TXT fallback.

Package 3U (Telegram JSON Adapter) is COMPLETE — merged to main (`3f4e0c4` 2026-06-06). `KMEngine.telegramAdapter`; telegram-json-v1; from_id+date_unixtime discriminators; extractText() for string/array-entity; hasMedia() for photo/file/media_type; date_unixtime Unix seconds → ISO-8601; no HTML entity decoding; senderRole always contact; engine-only; 91 new tests (telegram-adapter-tests.mjs) + 5 km-engine smoke; 2650 Node / 21 suites; STUBS array now empty; UI wiring delivered in Package 3V; self-ID picker deferred to Package 3W.

Package 3T (Facebook Messenger Self-Identification Sender Picker) is COMPLETE — merged to main (`8b11f18` 2026-06-06). `#facebookSenderPicker` inline picker; `showFacebookSenderPicker` + `applyFacebookSelfSender`; sender names HTML-escaped in innerHTML; picker hides on all non-Facebook import paths + restore; `window.__km.applyFacebookSelfSender` exposed; Phase 32 E2E (6 tests); 2554 Node; 57/57 seeded; 123/123 real-files; visual regression PASS; no engine/adapter/persistence changes. Mirrors Instagram DM picker (Package 3Q) and WhatsApp picker (Package 3L) patterns.

Package 3I (Import Quality Report) is COMPLETE — merged to main (`60cdd31` 2026-06-04). `KMEngine.ImportQualityReport.compute()` engine module; `#importQualityPanel` shows message count, date span, sender count, attachments, reactions after txt and chat.db imports; Phase 25 E2E (4 tests); 2173 Node; 84/84 real-files; 17/17 browser QA. DEF-12 from deferred-gated-ideas-register is now activated and COMPLETE.
Package 5C (Proof Panel User Withdrawal and UX Completion) is COMPLETE — merged to main (`4733c32` 2026-06-04). `renderBookProofPanel()` pending-review branch now includes "Cancel proof review" button + "Removes local proof review marking. No files were sent." hint. Cancel calls `ProofApprovalUX.withdrawSubmission()` (pending-review→none). `ProofApprovalState` extended with pending-review→none transition. Phase 24 E2E (4 tests); 57 seeded / 80 real-files total. 27/27 browser QA PASS. GATE-04, checkout, PDF, vendor, manufacturing, admin, and readiness gate exclusions confirmed.
Package 3H (Draft-Preflight Status Surface and Proof Panel Gate) is COMPLETE — merged to main (`1297f92` 2026-06-03). `showBookView()` auto-runs PAGINATION_STABILITY book check for in-progress drafts and advances to preflight-passed/failed. `renderBookProofPanel()` gated on all real groups reaching preflight-passed. Phase 23 E2E (6 tests); 53 seeded / 76 real-files total. No engine changes. "preflight" not in user-visible text. GATE-04, checkout, PDF, vendor, manufacturing, and readiness gate exclusions confirmed.
Package 3G (Session UI Wiring for ProductDraft Lifecycle) is COMPLETE — merged to main (`3192a15` 2026-06-03). Lifecycle modules loaded in browser; `showBookView()` initializes group drafts (none→in-progress, idempotent); `enterComposition()` forward-compat hook; `window.__km.getGroupDraft()` test helper; Phase 22 E2E (6 tests).
Package 3F (ProductDraft Lifecycle Coordinator) is COMPLETE — merged to main (`395629e` 2026-06-03).
Package 3E (ProductDraft and Preflight Runner Foundation) is COMPLETE — merged to main (`4390038` 2026-06-02).
Package 3D (Visual Regression Baseline Harness) is COMPLETE — merged to main (`645f6bd` 2026-06-02).
Package 5B (Message Book Proof Approval UX Foundation) is COMPLETE — merged to main (`dc4f86b` 2026-06-02).
Package 5A (Message Book Proof Approval State Foundation) is COMPLETE — merged to main (`297a221`).
AI Project OS v1.7 (all 6 gates) is COMPLETE — all merged to main 2026-06-01. OS self-audit 304/304 pass.
All prior packages (2.7, 2.8, 2.9, 3A–3C, 4A–4E.1, 2.6–2.6.1, 2.5A–2.5B, 1, 2) are COMPLETE — see `docs/command-center/current-status.md`.

**Next package candidates (none authorized):**

| Candidate | Type | External gate? | Risk |
|---|---|---|---|
| TBD — Coordinator to decide | TBD | TBD | — |
| Phase 12 continuation (preflight runners for vendor-gated checks) | Engine layer | Vendor/manufacturing inputs gated | Gated until vendor confirmed |

**Package 3AL is now COMPLETE — the latest complete package** (Import Insights Panel Visual Regression Coverage; QA harness only — additive `--scenario import-panels` VR scenario + 10 committed panel baselines; Scenario A untouched; no `index.html`/`src`/behavior change). The latest *engine* work remains Package 3AH (ReactionAnalysis + #reactionAnalysisPanel, import-time advisory only), which is DELIVERED. Package 3AI (Verification & Harness Reliability Hardening; scripts + docs only), Package 3AJ (Import Insights Consolidation), Package 3AK (registry-driven dispatcher), and Package 3AL are all complete. No development package has been authorized after Package 3AL. Post-Package-3AL Tower Catch-Up (docs-only) is IN PROGRESS (stop-before-commit). The next Coordinator step is to decide the next package (candidate TBD).

---

## Vendor actions (outside repo — Chat 04 / Chat 05 work)

| Action | Priority |
|---|---|
| Follow up IngramSpark on 7×10" jacketed hardcover availability | HIGH — highest risk if unavailable |
| PrintNinja follow-up: printed case under jacket at 7×10" | HIGH |
| BookBaby follow-up: multi-volume coordination between separate projects | HIGH |
| Decide whether to follow up Lulu (optional backup) | LOW |
| Hold on Blurb unless 7×10" trim is reopened | N/A — REJECTED |

---

## Design actions (outside repo — Chat 07 / Chat 08 work)

| Action | Priority |
|---|---|
| Coordinator decision on Alexander Weaver budget re-authorization | HIGH — blocks all Figma execution |
| If budget reopened: contract Alexander Weaver per Stage 3 terms | Follows budget decision |
| If budget remains closed: continue passive outreach within $1,200 budget | Medium |
| Figma execution cannot begin until designer is confirmed | BLOCKED |

---

## Decisions needed from Coordinator (no action items for Development until decided)

| Decision | What needs deciding | Downstream impact |
|---|---|---|
| Next package authorization | Which package to authorize next after Package 5B | Development resumption |
| Tower adoption (founder) | Whether to import `.ics`, ClickUp CSV, TickTick CSV | Personal execution layer; not required for repo to work |
| GitHub Projects setup | Whether to create the KeepMees Command Center board | Tracking infrastructure |
| NotebookLM adoption | Formally adopt or defer | Research/synthesis tooling |
| Designer budget | Re-authorize or continue passive search | Figma execution gate |
| Gift notes at launch | Include in v1 or defer to v1.1 | Packaging SOP and fulfillment spec |

---

## Do NOT start yet

| Item | Reason | Gate |
|---|---|---|
| Next development package | No scope authorized yet | Coordinator authorization |
| `scripts/node_modules` history cleanup | Tracked in git history; separate Coordinator decision | Separate Coordinator decision |
| Physical product previews | Not yet — no renderers implemented for mug, sticker, framed print, notebook, magnet | Coordinator authorization + renderer implementation |
| Product mockups | Not yet — no mockup work authorized | Coordinator authorization |
| Preview renderers | Not yet — renderer-not-implemented for all non-Message Book formats | Coordinator authorization |
| Proof approval UX | Not yet — no proof rendering pipeline | PDF pipeline + checkout |
| Checkout / order flow | Vendor not confirmed; commerce blocked | Vendor confirmed + PDF pipeline |
| PDF generation pipeline | Server infra not established; vendor not confirmed | Vendor confirmed |
| Cover design work | `isCoverUnblocked()` = false | Vendor confirmed |
| React / framework migration | Deferred — re-evaluate after render/proof architecture stabilizes | Architecture inflection |
| Cloud account persistence | Deferred post-launch | Post-launch + server infra |
| Visual redesign | Explicitly gated | Coordinator + Design stream authorization |
| n8n / Make automation workflows | Later — do not build yet | Future phase |
| docs/automation expansions beyond Package 2.5B | Package 2.5B is complete; no further automation artifact scope authorized | Coordinator decision |
| Acrylic block, apparel, or blanket manufacturing | Not in launch set | Product authority decision |
| Public product claims | Not yet — public-claim status not ready for any SKU | Multiple gates |
