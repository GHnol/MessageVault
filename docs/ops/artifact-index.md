# Artifact Index — KeepMees / MessageVault

**Last updated:** 2026-05-11
**Updated by:** Claude Code (Package 3B status sync)
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
| `src/state/project-persistence.js` | `KMEngine.ProjectPersistence` | Snapshot creation, schema validation, deserialization — Package 3A |
| `src/state/project-session-restore.js` | `KMEngine.ProjectSessionRestore` | Restore thick app state from file; ID→index map; controlled warnings — Package 3A |
| `src/state/project-file-io.js` | `KMEngine.ProjectFileIO` | Browser save (Blob/URL) and load (FileReader); browser-only — Package 3A |

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
| `src/tests/km-engine-tests.mjs` | ~96 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms |
| `src/tests/keepsake-group-tests.mjs` | 43 | KeepsakeGroup create/touch/displayName/deriveMemoryIds/deriveSourcePlatformIds |
| `src/tests/product-catalog-tests.mjs` | 127 | ProductStatuses, ProductCatalog all/get/flagship/byCategory, required fields |
| `src/tests/product-eligibility-tests.mjs` | 76 | ProductEligibility per-product evaluators, LegacyKeepsakeTypesBridge |
| `src/tests/project-persistence-tests.mjs` | 111 | ProjectPersistence validate/deserialize/createSnapshot, ProjectSessionRestore restore — Package 3A |
| `scripts/e2e-regression-harness.mjs` | 29 | Browser E2E: app load, seed, selection, review, keepsakes, book, save/load, invalid file, harness smoke — Package 3B |
| `scripts/e2e-test-data.mjs` | — | Deterministic NormalizedMemory seed data for E2E harness — Package 3B |

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

### Command Center (Package 2.5B — `bb23e8b`)

| File | Purpose |
|---|---|
| `docs/command-center/README.md` | Entry point and navigation guide for command center docs |
| `docs/command-center/current-status.md` | Point-in-time snapshot of package delivery, git state, gates, and stream sync |
| `docs/command-center/next-actions.md` | Immediate actions, upcoming package proposals, and do-not-start list |
| `docs/command-center/coordinator-dashboard.md` | High-level Coordinator overview: product, delivery, gates, decisions, risks |

### Automation — Schemas (Package 2.5B — `bb23e8b`)

All schemas use JSON Schema Draft-07. All 12 validated.

| File | Purpose |
|---|---|
| `docs/automation/schemas/decision.schema.json` | Schema for decision register entries |
| `docs/automation/schemas/requirement.schema.json` | Schema for requirements bank entries |
| `docs/automation/schemas/feature.schema.json` | Schema for feature bank entries |
| `docs/automation/schemas/backlog-item.schema.json` | Schema for backlog/roadmap items |
| `docs/automation/schemas/roadmap-item.schema.json` | Schema for roadmap milestones |
| `docs/automation/schemas/stream-update-packet.schema.json` | Schema for routing stream updates from the 15-chat model |
| `docs/automation/schemas/routing-packet.schema.json` | Schema for routing packets (destination, urgency, do-not-start) |
| `docs/automation/schemas/coordinator-sync-packet.schema.json` | Schema for Coordinator sync packets (to/from Coordinator) |
| `docs/automation/schemas/ai-handoff-packet.schema.json` | Schema for Transfer Packets between Claude/Codex sessions |
| `docs/automation/schemas/automation-register-item.schema.json` | Schema for AI automation register items |
| `docs/automation/schemas/artifact-index-item.schema.json` | Schema for artifact index entries |
| `docs/automation/schemas/master-project-truth.schema.json` | Machine-readable mirror of master-project-truth.md |

### Automation — Templates (Package 2.5B — `bb23e8b`)

| File | Purpose |
|---|---|
| `docs/automation/templates/stream-update-packet.md` | Template for routing stream updates from any of the 15 chats |
| `docs/automation/templates/routing-packet.md` | Template for routing packets |
| `docs/automation/templates/coordinator-sync-packet.md` | Template for Coordinator sync packets |
| `docs/automation/templates/package-closeout-packet.md` | Template for package closeout reports |
| `docs/automation/templates/development-review-packet.md` | Template for development review packets |
| `docs/automation/templates/manual-qa-result.md` | Template for manual QA results (includes scope-guard confirmation checklist) |
| `docs/automation/templates/decision-record.md` | Template for decision register entries |
| `docs/automation/templates/backlog-item.md` | Template for backlog items |
| `docs/automation/templates/roadmap-item.md` | Template for roadmap milestones |
| `docs/automation/templates/ai-automation-item.md` | Template for AI automation register items |

### QA (Package 3B — `0ce973a`)

| File | Purpose |
|---|---|
| `docs/qa/e2e-regression-harness.md` | How to run the E2E regression harness, what it covers, how to interpret failures, how to add tests |

### Automation — Operator Mode Protocols (Package 2.5B — `bb23e8b`)

| File | Purpose |
|---|---|
| `docs/automation/operator-mode/README.md` | Entry point: core rules, status vocabulary, source-of-truth priority, authorization table |
| `docs/automation/operator-mode/update-project-records-protocol.md` | 8-step protocol for updating docs from stream responses without false authority |
| `docs/automation/operator-mode/package-closeout-protocol.md` | 10-step commit/merge/closeout process with exact git commands |
| `docs/automation/operator-mode/stream-routing-protocol.md` | Stream authority map, routing table, and routing decision tree for the 15-chat model |
| `docs/automation/operator-mode/claude-codex-relay-protocol.md` | Transfer packet format and relay protocol for Claude/Codex session handoffs |

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
