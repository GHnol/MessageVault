# Backlog and Roadmap — KeepMees / MessageVault

**Last updated:** 2026-05-10
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

## Upcoming packages

### Package 3 — ProductDraft, session lifecycle, and local persistence

**Status:** Not started
**Scope (planned, subject to Coordinator authorization):**
- `ProductDraft` model — per-group, per-product draft container
- Preflight runner — executes the 10 checks in `BOOK_PREFLIGHT_CHECK_REGISTRY`
- Session save/restore UI flow wired to `SessionSerialization` (local/session persistence — DEF-08a)
- KeepsakeGroup + product draft lifecycle hooks
- Test coverage for all new modules

**Blocked by:** None. Architecture and eligibility foundation are in place.
**Does not include:** checkout, PDF generation, cover design, visual redesign, cloud account persistence.

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
