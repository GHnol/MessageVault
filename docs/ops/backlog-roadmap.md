# Backlog and Roadmap — KeepMees / MessageVault

**Last updated:** 2026-05-22
**Updated by:** Claude Code (Package 2.9 status sync)
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

### Package 2.6 — Operator Inbox + Stream Update Processor

**Branch:** `feature/operator-inbox-stream-processor`
**Status:** COMPLETE — merged to main (feature: `23b46b7`, merge: `e7d635d`)

Delivered:
- `operator-inbox/` — folder for pasting stream responses; raw .md files gitignored; `processed/` subfolder tracked
- `operator-outbox/` — folder for generated routing packets; all outputs gitignored; README and .gitkeep tracked
- `scripts/process-operator-inbox.mjs` — stream update processor: reads one inbox .md file and generates 4 output files (routing.md, routing.json, coordinator-summary.md, suggested-prompts.md); CLI supports `--latest` and `--file <path>`
- `scripts/fixtures/operator-inbox/development-closeout-sample.md` — safe fake Development stream closeout fixture
- `scripts/fixtures/operator-inbox/product-response-sample.md` — safe fake Product stream response fixture
- `src/tests/operator-inbox-processor-tests.mjs` — 13 suites, 67 assertions; covers all extraction functions and processFile
- `docs/automation/operator-mode/operator-inbox-protocol.md` — full protocol documentation
- Updated: `.gitignore`, `scripts/package.json` (inbox:latest, inbox scripts), operator-mode README, ai-automation-register, artifact-index

**What this does NOT do:** auto-post to ChatGPT, modify repo docs automatically, commit anything, connect to external services. All output is for human review only. Direct ChatGPT chat-to-chat automation remains not implemented. n8n / Make / Zapier remain not started.

**Tests: 520 Node tests passing, 0 failures** (453 existing + 67 new)

---

### Package 2.6.1 — Operator Inbox Extraction Polish

**Branch:** `fix/operator-inbox-closeout-extraction`
**Status:** COMPLETE — merged to main (feature: `841d28a`, merge: `75a2378`)

Delivered:
- `scripts/process-operator-inbox.mjs` — patched `extractNextActions` (4 new patterns for closeout wording including "Next package:" lines and "Awaiting Coordinator authorization"); patched `extractTestResults` (aggregate "N passed, M failed" and "Total: N/N" fraction patterns)
- `src/tests/operator-inbox-processor-tests.mjs` — Suite 14 added: 18 new assertions covering real closeout wording and regressions
- **Tests: 85 passed, 0 failed** (67 existing + 18 new) | **Cumulative total: 538 tests**

No app behavior changes. Processor and tests only.

---

### Package 4A — ProductRenderSpec Foundation

**Branch:** `feature/product-render-spec-foundation`
**Status:** COMPLETE — merged to main (feature: `f08a7dd`, merge: `1058dc1`)

Delivered:
- `src/products/product-render-spec.js` — 5 render constants (RENDER_STATUS, TEXT_DENSITY, BUBBLE_TREATMENT, REACTION_POLICY, ATTACHMENT_POLICY); `makeRenderSpec` factory; 10 specs covering 6 catalog products + 4 physical-only render planning targets; `KMEngine.ProductRenderSpecs` with `all()`, `get()`, `renderPlanningTargets()`, `catalogAligned()`
- `src/products/product-render-spec-resolver.js` — `KMEngine.ProductRenderSpecResolver` with `resolve(productTypeId, group)` returning blockers/warnings/eligible/memoryCount; passthrough helpers `getSpec()`, `allSpecs()`, `renderPlanningTargetSpecs()`
- `src/tests/product-render-spec-tests.mjs` — 341 assertions across 11 suites; Suite 11 explicitly verifies render planning targets do not imply commerce/manufacturing/public-claim readiness
- `docs/architecture/architecture-roadmap.md` — section heading updated to post-Package 4A; ProductRenderSpec layer added to module tree
- **Tests: 341 passed, 0 failed** (new) | **Cumulative total: 879 tests**

What this does NOT deliver: product preview UI, mug/sticker/framed-print/fridge-magnet renderers, checkout/payment, PDF generation, vendor exports, visual regression work. No app behavior changed.

**Key design decision:** `isRenderPlanningTarget` (not `isLaunchTarget`) is the field name, making explicit that render planning scope does not imply commerce, manufacturing, fulfillment, or public claim readiness.

---

### Package 4B — Prototype Preview Registry Foundation

**Branch:** `feature/prototype-preview-registry-foundation`
**Status:** COMPLETE — merged to main (feature: `eca2329`, merge: `3f939d0`)

Delivered:
- `src/products/prototype-preview-registry.js` — `PREVIEW_STATUS` frozen constant (READY, STUB, NOT_APPLICABLE); `makePreviewEntry` factory; 6 preview entries covering all render planning targets; `KMEngine.PrototypePreviewRegistry` with `all()`, `get(productTypeId)`, `getByPreviewTypeId()`, `architectureKnown()`, `prototypePreviewSupported()`
- `src/products/prototype-preview-resolver.js` — `KMEngine.PrototypePreviewResolver` with `resolve(productTypeId, group?)` returning resolved/previewSupported/blockers/warnings/memoryCount; passthrough helpers; combines registry entry + ProductRenderSpec data
- `src/tests/prototype-preview-registry-tests.mjs` — 215 assertions across 13 suites
- `docs/architecture/architecture-roadmap.md` — section heading updated to post-Package 4B; PrototypePreviewRegistry layer added to module tree
- **Tests: 215 passed, 0 failed** (new) | **Cumulative total: 1094 tests**

What this does NOT deliver: actual preview UI, mug/sticker/framed-print/fridge-magnet/mini-notebook renderers, checkout/payment, PDF generation, vendor exports, visual regression work. No app behavior changed. index.html not touched.

**Key gate:** `prototypePreviewEnabled: true` for Message Book only. All 5 non-book render planning targets have `unsupportedReason: 'renderer-not-implemented'`. Commerce, manufacturing, and public-claim readiness remain gated.

---

## Upcoming packages

### Package 3 remaining scope (not yet scheduled)

The following items from original Package 3 scope are not yet started and not yet authorized as a named package:
- `ProductDraft` model — per-group, per-product draft container
- Preflight runner — executes the 10 checks in `BOOK_PREFLIGHT_CHECK_REGISTRY`
- KeepsakeGroup + product draft lifecycle hooks
- Test coverage for all new modules

---

### Package 4A — ProductRenderSpec Foundation

**Status:** COMPLETE — see Delivered packages above.

---

### Package 4B — Prototype Preview Registry Foundation

**Status:** COMPLETE — see Delivered packages above.

---

### Package 4D — Product Experience Readiness Consumer Foundation

**Branch:** `feature/product-experience-readiness-consumer`
**Status:** COMPLETE — merged to main (feature: `47c402a`, merge: `4747dff`)

Delivered:
- `src/products/product-experience-consumer.js` — null-safe app-side bridge to `ProductExperienceReadiness`; `isAvailable()`, `resolveForGroup()`, `resolveProductForGroup()`, `resolvePreviewableForGroup()`; `KMEngine.ProductExperienceConsumer`
- `src/tests/product-experience-consumer-tests.mjs` — 35 assertions across 13 suites; null-safety, readiness-absent, mutation guard, message-book highest status
- `index.html` — 6 script tags wiring Packages 4A–4D modules into app runtime; `isReadinessAvailable()` and `resolveGroupReadiness(group)` added to `window.__km`
- `scripts/e2e-regression-harness.mjs` — Phase 20 added (6 tests: availability, EXPERIENCE_STATUS, group resolve, message-book status, non-book gated status, null safety)
- **Tests: 35 passed, 0 failed** (new) | **Cumulative total: 1466 Node unit tests** | **Seeded E2E: 35** | **Real-files E2E: 58/58** | **Capture harness scenario A: passed**

What this does NOT deliver: actual preview UI, product cards, preview renderers, proof approval UI, checkout/payment, PDF generation, vendor exports, visual regression work. Existing app behavior, imports, save/load, and Message Book flows preserved.

**Key gate:** Non-Message Book product formats remain `renderer-not-implemented` where applicable. Commerce, manufacturing, proof, and public-claim readiness remain gated.

---

### Package 4C — Product Experience Readiness Resolver Foundation

**Branch:** `feature/product-experience-readiness-foundation`
**Status:** COMPLETE — merged to main (feature: `367dfc7`, merge: `879c244`)

Delivered:
- `src/products/product-experience-readiness.js` — `EXPERIENCE_STATUS` frozen constant (11 values); `_userLabels` map; `_mergeUnique` deduplication helper; `_deriveExperienceStatus` (with `systemPreviewReady` flag for BLOCKED vs RENDER_PLANNING_KNOWN distinction); `_deriveNextDependency`; `_deriveInternalNotes`; `_safeUnknown`; `resolveForProduct`; `resolveAllForGroup`; `resolvePreviewableForGroup`; `resolveBlockedForGroup`; `resolveByStatus`; `KMEngine.ProductExperienceReadiness`; `KMEngine.EXPERIENCE_STATUS`
- `src/tests/product-experience-readiness-tests.mjs` — 337 assertions across 15 suites; Suite 15 explicitly proves system dependency blockers and content eligibility blockers are both preserved in the same readiness output
- `docs/architecture/architecture-roadmap.md` — section heading updated to post-Package 4C; ProductExperienceReadiness layer added to module tree
- **Tests: 337 passed, 0 failed** (new) | **Cumulative total: 1431 tests**

Key semantic guard: For a non-previewable product where the group also fails eligibility (e.g., mug with too many messages), the readiness output preserves BOTH the system dependency issue (`preview-not-supported`, `renderer-not-implemented`) in top-level `blockers` AND the content-specific eligibility issue in `eligibilityResult.blockers`. Neither is hidden.

What this does NOT deliver: actual preview UI, product cards, preview renderers, proof approval UI, checkout/payment, PDF generation, vendor exports, visual regression work. No app behavior changed. index.html not touched.

---

### Package 4E — Product Format Availability Surface Foundation

**Branch:** `feature/product-format-availability-surface`
**Status:** COMPLETE — merged to main (feature: `99bdf8f`, merge: `7c87f20`)

Delivered:
- `index.html` — CSS for `.ks-format-availability` section (light + dark mode); `buildFormatAvailability(group)` function; wiring inside `buildKeepsakeCard` after meta row
- `scripts/e2e-regression-harness.mjs` — Phase 21 added (6 tests: section renders, message-book tag text, fmt-available class, non-book planned labels, no commerce language, no crash)
- `docs/architecture/architecture-roadmap.md` — section heading updated to post-Package 4E; `buildFormatAvailability()` noted in module tree
- **Tests: 1466 Node unit tests, 0 failed (unchanged)** | **Seeded E2E: 41/41** | **Real-files E2E: 64/64** | **Capture harness scenario A: passed**

Visible copy delivered:
- Section header: "Product formats"
- Message Book (canPreview true): "Available for Message Book preview" — fmt-available (green)
- Non-book render-planning formats: "{displayName}: Planned format" — fmt-planned (grey)
- Message Book blocked case: "Message Book: {eligibility blocker}" — fmt-blocked (orange)
- Journal, Sticker Pack, Wall Art, Gift Wrap: NOT shown (isRenderPlanningTarget: false)

What this does NOT deliver: physical product previews, product mockups, preview renderers for any non-book format, proof approval UI, checkout/payment, PDF generation, vendor exports, visual regression work. No changes to existing keepsake flows, save/load, imports, or Message Book rendering.

**Known non-blocking note:** seeded E2E startup timing flap occurred once (navigate-to-app test); repeated runs passed cleanly. Logged as future harness reliability improvement, not a content regression.

**Key gate:** Non-Message Book product formats remain planned and gated. No non-book format has a preview button, order button, or commerce path. Message Book remains the only active/current preview path.

---

### Package 4E.1 — E2E Startup Timing Reliability Patch

**Branch:** `fix/e2e-startup-readiness-reliability`
**Status:** COMPLETE — merged to main (feature: `3c4ce70`, merge: `73dae00`)

Delivered:
- `scripts/e2e-regression-harness.mjs` — `waitForServer` readiness probe before Chromium launch; improved `waitForKm` diagnostic error; one bounded logged retry on Phase 1 initial navigation
- `docs/qa/e2e-regression-harness.md` — phases 20+21 coverage rows, test counts (41 seeded / 23 real-file / 64 combined), startup reliability section
- **Seeded E2E: 3 consecutive 41/41 runs | Real-files E2E: 64/64 | Capture harness scenario A: passed | unit baselines green**

Test-harness reliability only. No product, UI, or readiness logic change.

---

### Package 2.7 — AI Development Operating System Upgrade Pass

**Branch:** `docs/ai-development-operating-system-upgrade`
**Status:** COMPLETE — merged to main (feature: `6dde21b`, merge: `cebdc72`)

Delivered (docs / operating infrastructure only — no app code):
- `AGENTS.md` upgraded as the universal agent contract; tool-layering model; rules 11–15; durable continuity files; switching protocol table
- `CLAUDE.md` refreshed as the Claude-specific layer (protocol pointers)
- `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` added (durable snapshot + restart entry point)
- `docs/dev/`: `context-hygiene-protocol.md`, `model-switching-protocol.md`, `tool-switching-protocol.md`, `session-restart-protocol.md`, `agent-scope-boundaries.md`, `worktree-and-parallel-session-policy.md`, `claude-codex-interchangeability.md`; `ai-development-relay.md` Codex 5-role model
- `docs/qa/`: `pre-commit-verification-template.md`, `release-readiness-template.md`
- `docs/project-control/`: `README.md`, `project-control-tower-plan.md`, `project-calendar-spec.md`, `coordinator-weekly-sync.md` (readiness only)
- `.codex/README.md`; `.claude/agents/README.md`, `.claude/skills/README.md` (placeholders)
- `.github/PULL_REQUEST_TEMPLATE.md` continuity checkboxes
- `.gitignore` hardened (Claude/Codex local, secrets/`.env*`, worktrees, broad artifacts, PDFs, `.ics`, `node_modules/`, local reports)

What this did NOT build: full Project Control Tower, master roadmap, master schedule, Kanban board, Google Calendar `.ics`, ClickUp import, TickTick import, n8n/Make/Zapier automation, Product Package 5A. No app behavior, product, vendor, design, or manufacturing decisions reopened.

**Backlog note:** `scripts/node_modules` tracked-history cleanup remains a separate Coordinator decision, not part of Package 2.7. Live Claude hooks/subagents/skills and `.codex/config.toml` deferred to a separately authorized pass.

---

### Package 2.8 — KeepMees Project Control Tower

**Branch:** `docs/project-control-tower`
**Status:** COMPLETE — merged to main (feature: `2a5fb54`, merge: `bdb73db`)

Delivered (docs / repo-native operating system only — no app code):
- `docs/project-control/README.md` (full Tower index + 6-layer rules)
- `master-roadmap.md` — Phases 0–15 with completed-package mapping
- `master-schedule.md` — dated, confidence-labelled (High / Medium / Low)
- `current-sprint.md` — Sprint 2026-05-A: Project Control Tower Landing
- `backlog.md` — 16 lanes, status/priority/phase/dependency/success per item
- `kanban-board.md` — full project + current-sprint views, 10 status columns
- `phase-gates.md` — 11 gates with entry/exit/artifacts/verification
- `decision-log.md` — locked / active / open / deferred / killed
- `risk-register.md` — project view across 15 categories
- `calendar-spec.md` + committed `keepmees-project-calendar.ics` (VTIMEZONE America/New_York, 12 events, unique UIDs)
- `clickup-import.csv` (17 cols × 30 rows), `ticktick-import.csv` (10 cols × 18 rows), `ticktick-weekly-checklist.md`, `ticktick-recurring-routines.md`
- `next-7-days.md`, `next-30-days.md`, `next-90-days.md`
- `coordinator-weekly-sync.md` — active weekly process, `next-session-prompt.md`
- Surgical `.gitignore` exception so the repo-native `.ics` is trackable
- 2 Package 2.7 stubs superseded (`project-control-tower-plan.md`, `project-calendar-spec.md`) with history preserved

What this did NOT build/change: no app code; no checkout/PDF/preview-renderers; no vendor outreach; no design hiring restart; no n8n/Make/Zapier; no Product Package 5A. No locked product/vendor/design/manufacturing decisions reopened.

**Standing rule:** repo docs under `docs/project-control/` are the source of truth; ClickUp / TickTick / Google Calendar / Kanban tooling never override the repo. Tower maintenance is `coordinator-weekly-sync.md`.

---

### Package 2.9 — AI Project OS Auto-Management Upgrade Pass

**Branch:** `docs/ai-project-os-auto-management-upgrade`
**Status:** COMPLETE — merged to main (feature: `81c5069`, merge: `a20af30`)

Delivered (docs / operating infrastructure only — no app code):
- `docs/ai-system/` — universal AI Project OS layer (5 files: README, universal-standards, bootstrap-template, CHANGELOG, version-history)
- `docs/dev/` — 7 new protocols: auto-management (umbrella), model-routing, token-efficiency, context-budget-checklist, tool-batching, package-boundary-closeout, notification-setup; plus extensions to context-hygiene (high-uncached-context section, fresh-session preference) and model-switching (cross-link to routing)
- `docs/qa/` — test-strategy.md (first-class testing strategy across 5 layers); package-verification-template.md (per-package verification gate)
- `.claude/commands/README.md` — readiness placeholder (no live custom slash commands)
- Cross-links added across `AGENTS.md`, `CLAUDE.md`, `.codex/README.md`, `.claude/agents/README.md`, `.claude/skills/README.md`
- `.github/PULL_REQUEST_TEMPLATE.md` — model-tier / package-verification / boundary-closeout rows
- `.gitignore` — IDE/OS/log noise patterns + defensive Codex patterns
- Light touches to `docs/project-control/README.md` (note about `docs/ai-system/`) and `coordinator-weekly-sync.md` (2026-05-22 weekly-log row)
- Continuity files updated (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`)
- Honest enforcement labels applied throughout: every capability classified as automatic / semi-automatic / policy-driven / user-level / backlog

What this did NOT build/change: no app code; no `index.html` / `src/**` / `scripts/**` changes (verified by `git diff` returning 0 lines); no checkout/PDF/preview-renderers; no vendor outreach; no design hiring restart; no n8n/Make/Zapier; no Product Package 5A; no live Claude hooks / subagents / skills / custom slash commands (only readiness placeholders); no `.codex/config.toml`; no Project Control Tower content rewritten. No locked product/vendor/design/manufacturing decisions reopened.

**Standing rule established:** `docs/ai-system/` is the universal portable AI Project OS layer that travels to future repos via `bootstrap-template.md`. Project Control Tower remains KeepMees-specific. The two layers are siblings.

**Foundation Operating System Gate (Gate 1)** remains passed (from Package 2.8). Package 2.9 strengthens the same gate by adding the universal OS layer on top. Package 5A still requires explicit Coordinator authorization.

---

### Coordinator review + Package 5A decision — (next coordination step)

**Status:** Not started. Coordinator reviews the merged Project Control Tower (Package 2.8) and AI Project OS layer (Package 2.9) and decides whether to authorize **Package 5A — Message Book Proof Approval State Foundation** (Phase 12 foundation, Gate 9 target). The Foundation Operating System Gate (`docs/project-control/phase-gates.md` Gate 1) is passed; Package 5A still requires explicit Coordinator authorization before any code begins. Scope-limited (proof approval STATE model + tests only; no checkout, no PDF, no preview renderers).

---

### Package 4F and beyond — (To be defined)

**Status:** Not started. Awaiting Coordinator direction.

Possible scope areas for future packages:
- ProductDraft model — per-group, per-product draft container
- Preflight runner — executes the 10 checks in BOOK_PREFLIGHT_CHECK_REGISTRY
- Source adapter completions (WhatsApp, Android SMS) — if prioritized
- Preview renderer implementation for non-book formats — requires Coordinator authorization
- Visual regression harness — requires Coordinator authorization (Package 3D scope)

---

## Gated packages (require external trigger)

| Package | Gate condition |
|---|---|
| PDF pipeline | Vendor confirmed; `isCoverUnblocked()` gate met |
| Commerce / checkout | PDF pipeline complete; commerce readiness = `ready` |
| Cover design tooling | `isCoverUnblocked()` gate met |
| Proof approval UX | PDF pipeline + checkout complete |

These packages cannot begin until their gates are explicitly cleared by product authority.
