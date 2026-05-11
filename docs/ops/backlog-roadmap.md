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
**Status:** In progress (correction pass underway — not yet committed)

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

### Package 2.5B — Automation scaffold (PROPOSED — not yet approved)

**Branch:** TBD
**Status:** PROPOSED — requires explicit Coordinator authorization before execution

Proposed scope:
- `docs/command-center/` (README, master-project-truth JSON, current-status, next-actions)
- `docs/strategy/positioning-bank.md`
- `docs/architecture/source-platform-architecture.md`
- `docs/architecture/product-system-architecture.md`
- `docs/ops/sprint-package-plan.md`
- `docs/ops/coordinator-sync-log.md`
- `docs/automation/schemas/` (12 schema files)
- `docs/automation/templates/` (10 template files)
- `docs/automation/operator-mode/` (5 protocol files)

**Do not execute until Coordinator explicitly authorizes Package 2.5B.**

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
