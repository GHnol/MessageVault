# Artifact Index — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** Active

---

## Purpose

Authoritative index of every significant file in the repository — what it is, what it does, and where it fits in the system. This is a navigational aid, not a replacement for reading the source.

---

## Application

| File | Type | Purpose |
|---|---|---|
| `index.html` | Application | Entire app: UI, CSS, composition logic, pagination, rendering. Do not edit without reading. |
| `README.md` | Documentation | Repository README (minimal) |
| `CLAUDE.md` | AI instructions | Claude Code behavior rules, scope guard, git rules |

---

## KMEngine core modules

| File | Exports | Purpose |
|---|---|---|
| `src/core/import-adapters.js` | `KMEngine.adapters`, `KMEngine.registerAdapter`, `KMEngine.createImportResult` | Adapter registry and import result shape |
| `src/core/normalized-memory.js` | `KMEngine.NormalizedMemory` | Canonical message model; stable ID generation |
| `src/core/project-session.js` | `KMEngine.ProjectSession` | Session container (create, touch, validate) |
| `src/core/source-platforms.js` | `KMEngine.SOURCE_PLATFORMS`, `KMEngine.getSourcePlatform` | Platform registry (3 supported, 5 stub, 3 deferred) |
| `src/core/keepsake-group.js` | `KMEngine.KeepsakeGroup` | Group data model (create, touch, display name, derived IDs) |

---

## KMEngine adapters

| File | Exports | Purpose |
|---|---|---|
| `src/adapters/imessage-chatdb-adapter.js` | Registered via `KMEngine.registerAdapter` | iMessage chat.db SQL adapter (SQL.js) |
| `src/adapters/txt-export-adapter.js` | Registered via `KMEngine.registerAdapter` | Pipe-delimited .txt export adapter |
| `src/adapters/manual-entry-adapter.js` | Registered via `KMEngine.registerAdapter` | Manual message entry adapter |
| `src/adapters/future-adapter-stubs.js` | Stubs only | WhatsApp, Android SMS, Instagram DM, Facebook, Telegram |

---

## KMEngine state

| File | Exports | Purpose |
|---|---|---|
| `src/state/session-serialization.js` | `KMEngine.SessionSerialization` | Serialize/restore `ProjectSession`; `captureFromApp` |

---

## KMEngine products

| File | Exports | Purpose |
|---|---|---|
| `src/products/product-statuses.js` | `KMEngine.ProductStatuses` | Status enums (SOFTWARE, COMMERCE, MANUFACTURING, PUBLIC_CLAIM) |
| `src/products/product-catalog.js` | `KMEngine.ProductCatalog` | 6 product definitions; `all()`, `get()`, `flagship()`, `byCategory()` |
| `src/products/product-eligibility.js` | `KMEngine.ProductEligibility` | Per-product eligibility evaluators; `evaluate()`, `evaluateAll()` |
| `src/products/legacy-keepsake-types-bridge.js` | `KMEngine.LegacyKeepsakeTypesBridge` | 4 legacy standalone types (quote-card, framed-print, mini-story, conversation-page) |

---

## Tests

| File | Test count | Covers |
|---|---|---|
| `src/tests/km-engine-tests.mjs` | See Package 1 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms |
| `src/tests/keepsake-group-tests.mjs` | 43 | KeepsakeGroup create/touch/displayName/deriveMemoryIds/deriveSourcePlatformIds |
| `src/tests/product-catalog-tests.mjs` | 127 | ProductStatuses, ProductCatalog all/get/flagship/byCategory, required fields |
| `src/tests/product-eligibility-tests.mjs` | 76 | ProductEligibility per-product evaluators, LegacyKeepsakeTypesBridge |

---

## Documentation

### Strategy

| File | Purpose |
|---|---|
| `docs/strategy/master-project-truth.md` | Authoritative project overview, locked decisions, module map |
| `docs/strategy/requirements-bank.md` | Functional and non-functional requirements |
| `docs/strategy/feature-bank.md` | Delivered, planned, and deferred features |
| `docs/strategy/product-format-bank.md` | Product catalog details with format specs and constraints |

### Architecture

| File | Purpose |
|---|---|
| `docs/architecture/adr-001-app-architecture-path.md` | ADR for single-file app + KMEngine + SQL.js decisions |
| `docs/architecture/architecture-roadmap.md` | Current architecture, near-term additions, inflection points |

### Operations

| File | Purpose |
|---|---|
| `docs/ops/artifact-index.md` | This file |
| `docs/ops/backlog-roadmap.md` | Package history and upcoming package plan |
| `docs/ops/decision-register.md` | Locked decisions with rationale |
| `docs/ops/risk-register.md` | Technical, product, and operational risks |
| `docs/ops/deferred-gated-ideas-register.md` | Deferred and gated features with gate conditions |
| `docs/ops/competitor-intelligence-register.md` | Competitor and market context |
| `docs/ops/vendor-manufacturing-register.md` | Vendor candidates, manufacturing constraints |
| `docs/ops/design-readiness-register.md` | Design status by surface |
| `docs/ops/ai-automation-register.md` | AI features and automation tooling |
| `docs/ops/stream-sync-protocol.md` | AI development relay protocol |

---

## Locked / scope-guarded items (do not touch without authorization)

| Item | Location | Why locked |
|---|---|---|
| `BOOK_PAGE_LINES = 44` | `index.html:6681` | Pagination constant; changes require version bump |
| `BOOK_HEADER_LINES = 4` | `index.html:6682` | Pagination constant |
| `BOOK_DIVIDER_LINES` | `index.html` | Pagination constant |
| `BOOK_FEATURED_HEADER_LINES` | `index.html` | Pagination constant |
| `BOOK_CONTINUATION_LINES` | `index.html` | Pagination constant |
| `BOOK_PAGINATION_VERSION = '1'` | `index.html:6696` | Version gate for pagination changes |
| `BOOK_PRODUCTION_DEPS` | `index.html:6700` | Locked direction constants |
| `BOOK_PARITY` | `index.html:6726` | Parity padding; system-owned |
| Standalone keepsake flows | `index.html` | Explicitly off-limits |
| Review view | `index.html` | Explicitly off-limits |
