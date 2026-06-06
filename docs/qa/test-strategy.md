# Test Strategy — KeepMees / MessageVault

**Status:** ACTIVE (formalized in Package 2.9; visual regression added in Package 3D; updated to 2039 baseline in Package 3F; E2E Phase 22 added in Package 3G; updated to 2082 baseline in Package 5C; E2E Phase 24 added in Package 5C; updated to 2173 baseline in Package 3I; E2E Phase 25 added in Package 3I; updated to 2269 baseline in Package 3J; E2E Phase 26 added in Package 3K — real-files total 89; E2E Phase 27 added in Package 3L — real-files total 95; updated to 2358 baseline in Package 3M — android-sms-xml-adapter-tests.mjs added; E2E Phase 28 added in Package 3N — real-files total 101; updated to 2450 baseline in Package 3O — instagram-dm-adapter-tests.mjs added; E2E Phase 29 added in Package 3P — real-files total 106; E2E Phase 30 added in Package 3Q — real-files total 112; updated to 2554 baseline in Package 3R — facebook-messenger-adapter-tests.mjs added; E2E Phase 31 added in Package 3S — real-files total 117).
**Last updated:** 2026-06-06 (America/New_York)
**Owner:** Development stream / Claude Code under Operator Mode.

This document is the single answer to "what tests exist, what should be added, and when do they run?" for KeepMees. It is intentionally first-class — testing is not cleanup-later.

---

## The six layers

KeepMees uses six distinct test layers. Each has a different cost, a different fidelity, and a different trigger.

### Layer 1 — Node unit tests (`src/tests/*.mjs`)

**What:** Pure JavaScript tests, run by `node` directly. No DOM, no browser. Vm-module pattern for any test that needs to load the engine.

**Suites and counts (as of Package 3R — confirmed baseline 2554):**

| Suite | Tests | Coverage |
|---|---|---|
| `facebook-messenger-adapter-tests.mjs` | 98 | Facebook Messenger JSON adapter: API shape, canHandle (accepts/rejects/magic_words discriminator), fixture rawCounts, timestamp conversion, HTML entity decoding (sender + content), senderRole, text normalization, media/attachment normalization (photo/video/audio/share/sticker/gif), NormalizedMemory fields, importWarnings, no-throw, participants, semantic guards — Package 3R |
| `instagram-dm-adapter-tests.mjs` | 87 | Instagram DM JSON adapter: API shape, canHandle (accepts/rejects), fixture rawCounts, timestamp conversion, HTML entity decoding (sender + content), senderRole, text normalization, media/attachment normalization, NormalizedMemory fields, importWarnings, no-throw, semantic guards, participants — Package 3O |
| `android-sms-xml-adapter-tests.mjs` | 84 | Android SMS XML adapter: API shape, canHandle (accepts/rejects), SMS type=1/type=2 parsing, senderRole derivation, MMS attachment placeholder, fixture rawCounts, participants, NormalizedMemory fields, provenance, no-throw, importWarnings, semantic guards — Package 3M |
| `whatsapp-txt-adapter-tests.mjs` | 91 | WhatsApp adapter: API shape, canHandle (bracket/hyphen/rejects), parsing, multi-line, system-message filtering, media placeholders, participants, rawCounts, NormalizedMemory fields, no-throw, semantic guards — Package 3J |
| `import-quality-report-tests.mjs` | 91 | ImportQualityReport.compute(): API shape, all metric fields, edge cases, semantic guards — Package 3I |
| `km-engine-tests.mjs` | 117 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms; +5 whatsapp smoke assertions (Package 3J); +5 android-sms smoke assertions (Package 3M); +5 instagram-dm smoke assertions (Package 3O); +1 facebook-messenger platform assertion + 5 facebook-messenger smoke assertions (Package 3R) |
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

**Total: 2554 tests.** All must remain green before any commit.

Note: 1935 was the Package 3E baseline. Package 3F added 104 tests (→2039). Package 5C added 43 tests (→2082). Package 3I added 91 tests (`import-quality-report-tests.mjs`), raising the baseline to 2173. Package 3J added 91 tests (`whatsapp-txt-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2269. Package 3M added 84 tests (`android-sms-xml-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2358. Package 3O added 87 tests (`instagram-dm-adapter-tests.mjs`) + 5 km-engine smoke tests, raising the confirmed baseline to 2450. Package 3R added 98 tests (`facebook-messenger-adapter-tests.mjs`) + 6 km-engine additions (1 platform assertion + 5 smoke), raising the confirmed baseline to 2554.

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

**What:** Same harness, with the `--real-files` flag. Tests phases 11–19 + 25 + 26 + 27 + 28 + 29 + 31 — real .txt import, WhatsApp .txt import, WhatsApp self-identification sender picker, import quality report, Android SMS XML import, Instagram DM JSON import, Facebook Messenger JSON import, actual browser download, actual file upload/restore, standalone keepsake type chooser, stable error text, optional chat.db smoke, capture harness subprocess.

**Coverage:** 60 tests (59 always + 1 conditional on local chat.db). Combined seeded + real-files: **117**.

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

1. All 20 Node unit suites green (2554 tests).
2. If `index.html` or `src/` changed: E2E seeded green (57 tests).
3. If real-file paths changed: E2E real-files green (117 total — `npm run e2e:real`).
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
