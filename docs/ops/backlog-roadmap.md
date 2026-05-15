# Backlog and Roadmap — KeepMees / MessageVault

**Last updated:** 2026-05-15
**Updated by:** Claude Code (Package 3C status sync)
**Status:** Active

---

## Delivered packages

### Package 1 — KMEngine engine foundation

**Branch:** merged to main
**Commit:** `1f05970`

Delivered:
- `KMEngine.NormalizedMemory` — canonical message shape with stable deterministic IDs
- `KMEngine.ProjectSession` — session container and lifecycle
- `KMEngine.SessionSerialization` — serialize/restore
- `KMEngine.SOURCE_PLATFORMS` — 3 supported + 5 stub + 3 deferred platforms
- `KMEngine.registerAdapter` + `createImportResult`
- iMessage, .txt, manual entry, and future-stub adapters
- `src/tests/km-engine-tests.mjs`

---

### Package 2 — Product catalog and eligibility foundation

**Branch:** merged to main
**Commit:** `87972c9` (merge: `541a1b8`)

Delivered:
- `KMEngine.ProductStatuses` — status enums (4 axes)
- `KMEngine.ProductCatalog` — 6 products with full status/constraint definitions
- `KMEngine.ProductEligibility` — per-product evaluators + `evaluateAll`
- `KMEngine.KeepsakeGroup` — group data model (create, touch, deriveMemoryIds, deriveSourcePlatformIds, getDisplayName)
- `KMEngine.LegacyKeepsakeTypesBridge` — 4 legacy standalone types
- `src/tests/keepsake-group-tests.mjs` (43 tests)
- `src/tests/product-catalog-tests.mjs` (127 tests)
- `src/tests/product-eligibility-tests.mjs` (76 tests)
- **Total Package 2 tests: 246 passed, 0 failed**

---

### Package 2.5A — Project truth and operating system foundation

**Branch:** `docs/project-truth-operating-system-foundation`
**Status:** COMPLETE — merged to main (feature: `d1c5a44`, merge: `d69dc2c`)

Delivered:
- `docs/strategy/master-project-truth.md`
- `docs/strategy/requirements-bank.md`
- `docs/strategy/feature-bank.md`
- `docs/strategy/product-format-bank.md`
- `docs/architecture/adr-001-app-architecture-path.md`
- `docs/architecture/architecture-roadmap.md`
- `docs/ops/decision-register.md`
- `docs/ops/backlog-roadmap.md` (this file)
- `docs/ops/risk-register.md`
- `docs/ops/deferred-gated-ideas-register.md`
- `docs/ops/competitor-intelligence-register.md`
- `docs/ops/vendor-manufacturing-register.md`
- `docs/ops/design-readiness-register.md`
- `docs/ops/ai-automation-register.md`
- `docs/ops/artifact-index.md`
- `docs/ops/stream-sync-protocol.md`

No app behavior changes. Docs only.

---

### Package 2.5B — AI Mastery automation artifacts

**Branch:** `docs/ai-mastery-automation-artifacts`
**Status:** COMPLETE — merged to main (feature: `bb23e8b`, merge: `aa6402c`)

Delivered:
- `docs/command-center/README.md`
- `docs/command-center/current-status.md`
- `docs/command-center/next-actions.md`
- `docs/command-center/coordinator-dashboard.md`
- `docs/automation/schemas/` — 12 JSON schemas (Draft-07, all validated)
- `docs/automation/templates/` — 10 copy-paste-ready Markdown templates
- `docs/automation/operator-mode/` — 5 Operator Mode protocols

No app code changed. Docs only.

**Note:** Package 2.5B delivers the automation artifact layer (schemas, templates, protocols). Actual external automation via n8n / Make / Zapier remains a later phase and is explicitly not part of this package.

---

### Package 3A — Local project session save and resume foundation

**Branch:** `feature/local-project-session-persistence`
**Status:** COMPLETE — merged to main (feature: `8dcc959`, merge: `b40fa2b`)

Delivered:
- `src/state/project-persistence.js` — `KMEngine.ProjectPersistence`: snapshot creation, schema validation, deserialization
- `src/state/project-session-restore.js` — `KMEngine.ProjectSessionRestore`: restores thick app state from file; ID→index map; controlled warnings without crashing
- `src/state/project-file-io.js` — `KMEngine.ProjectFileIO`: browser save (Blob/URL) and load (FileReader) — browser-only, not tested in Node
- `index.html` — Save Project buttons in chat header, Review Your Moments, Your Keepsakes, and Message Book; Load Project card on landing page; full event wiring
- `src/tests/project-persistence-tests.mjs` (111 tests) — validate, deserialize, createSnapshot, restore suites — vm module pattern, no DOM required
- **Package 3A tests: 111 passed, 0 failed** | **Cumulative total: 453 tests passing**
- Browser QA: passed (save/load round-trip verified across all 4 entry points)

---

### Package 3B — Automated E2E Regression Harness Foundation

**Branch:** `feature/e2e-regression-harness-foundation`
**Status:** COMPLETE — merged to main (feature: `0ce973a`, merge: `40b4bba`)

Delivered:
- `scripts/e2e-regression-harness.mjs` — Playwright headless Chromium harness; 10 phases, 29 tests; port 7332; proper static file server with correct MIME types; failure screenshots to `artifacts/e2e-failures/`
- `scripts/e2e-test-data.mjs` — deterministic NormalizedMemory-compatible seed data (8 messages, fixed IDs and timestamps)
- `index.html` — `window.__km` test harness bridge entries: `seedChatMessages`, `showKeepsakesView`, `showReviewView`, `getSelectedCount`, `captureProjectSnapshot`
- `scripts/package.json` — `e2e` and `e2e:headed` npm scripts
- `docs/qa/e2e-regression-harness.md` — harness documentation
- `.gitignore` — `artifacts/e2e-failures/` excluded
- **E2E tests: 29 passed, 0 failed** | **Node unit tests: 453 passing (all suites green)**

---

### Package 3C — Real File Import, Download, and Full-Path E2E Coverage

**Branch:** `feature/e2e-real-file-import-download-coverage`
**Status:** COMPLETE — merged to main (feature: `f8379d0`, merge: `904cf51`)

Delivered:
- `scripts/e2e-regression-harness.mjs` — extended with phases 11–19 (`--real-files` flag); 22 new tests + 1 optional; total 51 tests (52 with chat.db)
- `scripts/fixtures/fake-conversation.txt` — safe fake pipe-delimited fixture (5 messages, deterministic, no real user data)
- `scripts/package.json` — `e2e:real` and `e2e:real:headed` npm scripts added
- `docs/qa/e2e-regression-harness.md` — full rewrite documenting both modes, all phases, privacy rules, fixture policy, visual regression deferred to Package 3D
- **Seeded baseline unchanged:** phases 1–10 (29 tests) remain the default, suitable for CI after every package
- **Real-file coverage:** phases 11–19 cover real .txt import, actual browser download, actual file upload/restore, standalone keepsake type chooser, stable error text assertions, optional private chat.db smoke, capture harness subprocess
- **Node unit tests: 453 passing (unchanged)** | **E2E seeded: 29 passing** | **E2E real-files: 52 passing (51 always + 1 conditional)**

---

## Upcoming packages

### Package 3 remaining scope (not yet scheduled)

The following items from original Package 3 scope are not yet started and not yet authorized as a named package:
- `ProductDraft` model — per-group, per-product draft container
- Preflight runner — executes the 10 checks in `BOOK_PREFLIGHT_CHECK_REGISTRY`
- KeepsakeGroup + product draft lifecycle hooks
- Test coverage for all new modules

---

### Package 4 — (To be defined)

**Status:** Not started. Awaiting Package 3 completion and Coordinator direction.

Possible scope areas:
- Source adapter completions (WhatsApp, Android SMS) — if prioritized
- Additional preflight checks with runners
- Render spec finalization (not ProductRenderSpec code — spec document only)

---

## Gated packages (require external trigger)

| Package | Gate condition |
|---|---|
| PDF pipeline | Vendor confirmed; `isCoverUnblocked()` gate met |
| Commerce / checkout | PDF pipeline complete; commerce readiness = `ready` |
| Cover design tooling | `isCoverUnblocked()` gate met |
| Proof approval UX | PDF pipeline + checkout complete |

These packages cannot begin until their gates are explicitly cleared by product authority.
