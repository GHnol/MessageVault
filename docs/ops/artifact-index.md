# Artifact Index — KeepMees / MessageVault

**Last updated:** 2026-05-17
**Updated by:** Claude Code (Package 2.7 status sync)
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
| `CLAUDE.md` | AI instructions | Claude-specific layer; extends `AGENTS.md`; scope guard, git rules, continuity + session/model/tool protocol pointers (Package 2.7) |
| `AGENTS.md` | AI instructions | Universal agent contract for all AI coding agents; tool-layering model, continuity rules, switching protocol table (Package 2.7) |
| `AI_HANDOFF.md` | Handoff / resume file | Compact-safe work transfer record; updated before any context event, agent switch, or mid-task stop |
| `CURRENT_STATE.md` | Continuity file | Durable project-state snapshot — survives /clear, /compact, model/tool switch (Package 2.7) |
| `NEXT_SESSION_PROMPT.md` | Continuity file | Paste-ready session restart prompt + mandatory startup checklist (Package 2.7) |
| `.codex/README.md` | AI instructions | Codex-specific layer; roles, interchangeability, config policy (Package 2.7, placeholder) |
| `.claude/agents/README.md` | AI instructions | Planned subagent roster (Package 2.7, readiness placeholder — no live agents) |
| `.claude/skills/README.md` | AI instructions | Planned skill roster (Package 2.7, readiness placeholder — no live skills) |

---

## Operator Inbox system (Package 2.6)

| File | Type | Purpose |
|---|---|---|
| `operator-inbox/README.md` | Documentation | How to create inbox files, run the processor, and file naming convention |
| `operator-inbox/.gitkeep` | Tracker | Keeps inbox folder tracked; raw .md files are gitignored |
| `operator-inbox/processed/.gitkeep` | Tracker | Keeps processed subfolder tracked |
| `operator-outbox/README.md` | Documentation | How to interpret outbox outputs and use them for routing |
| `operator-outbox/.gitkeep` | Tracker | Keeps outbox folder tracked; generated .md/.json files are gitignored |
| `scripts/process-operator-inbox.mjs` | Script | Stream update processor — reads inbox .md file, generates 4 output files in operator-outbox/ |
| `scripts/fixtures/operator-inbox/development-closeout-sample.md` | Test fixture | Safe fake Development stream closeout for processor testing |
| `scripts/fixtures/operator-inbox/product-response-sample.md` | Test fixture | Safe fake Product stream response for processor testing |
| `src/tests/operator-inbox-processor-tests.mjs` | Tests | 67 tests: detectStream, extract*, classifyRoutingTargets, generateRouting*, processFile, unknown stream, empty content |
| `docs/automation/operator-mode/operator-inbox-protocol.md` | Protocol | Full operator inbox protocol: purpose, naming, running, outputs, privacy rules, n8n path |

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
| `src/products/product-render-spec.js` | `KMEngine.ProductRenderSpecs`, 5 render constants | Render spec registry: 10 specs (6 catalog + 4 physical-only render planning targets); `all()`, `get()`, `renderPlanningTargets()`, `catalogAligned()` — Package 4A |
| `src/products/product-render-spec-resolver.js` | `KMEngine.ProductRenderSpecResolver` | Resolve render spec against KeepsakeGroup; returns blockers, warnings, eligible, memoryCount — Package 4A |
| `src/products/prototype-preview-registry.js` | `KMEngine.PrototypePreviewRegistry`, `PREVIEW_STATUS`, `makePreviewEntry` | Preview entry registry: 6 entries for render planning targets; `all()`, `get()`, `getByPreviewTypeId()`, `architectureKnown()`, `prototypePreviewSupported()`; prototypePreviewEnabled: true for Message Book only — Package 4B |
| `src/products/prototype-preview-resolver.js` | `KMEngine.PrototypePreviewResolver` | Resolve preview readiness against KeepsakeGroup; combines registry entry + ProductRenderSpec; returns previewSupported, blockers, warnings — Package 4B |
| `src/products/product-experience-readiness.js` | `KMEngine.ProductExperienceReadiness`, `KMEngine.EXPERIENCE_STATUS` | Combined readiness resolver across all 4 product layers (catalog + eligibility + render spec + preview); EXPERIENCE_STATUS (11 values); resolveForProduct, resolveAllForGroup, resolvePreviewableForGroup, resolveBlockedForGroup, resolveByStatus — Package 4C |
| `src/products/product-experience-consumer.js` | `KMEngine.ProductExperienceConsumer` | Null-safe app-side bridge to ProductExperienceReadiness; isAvailable(), resolveForGroup(), resolveProductForGroup(), resolvePreviewableForGroup(); view-model layer only — Package 4D |

---

## Tests

| File | Test count | Covers |
|---|---|---|
| `src/tests/km-engine-tests.mjs` | ~96 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms |
| `src/tests/keepsake-group-tests.mjs` | 43 | KeepsakeGroup create/touch/displayName/deriveMemoryIds/deriveSourcePlatformIds |
| `src/tests/product-catalog-tests.mjs` | 127 | ProductStatuses, ProductCatalog all/get/flagship/byCategory, required fields |
| `src/tests/product-eligibility-tests.mjs` | 76 | ProductEligibility per-product evaluators, LegacyKeepsakeTypesBridge |
| `src/tests/project-persistence-tests.mjs` | 111 | ProjectPersistence validate/deserialize/createSnapshot, ProjectSessionRestore restore — Package 3A |
| `scripts/e2e-regression-harness.mjs` | 41 seeded + 23 real-files (64 total) | Browser E2E: seeded baseline phases 1–10 + 20 + 21 (Packages 3B + 4D + 4E) + real-file phases 11–19 (Package 3C, `--real-files` flag) |
| `src/tests/operator-inbox-processor-tests.mjs` | 85 | Processor: detectStream, extractAll, generateRouting*, processFile — Package 2.6; Suite 14 added Package 2.6.1 |
| `src/tests/product-render-spec-tests.mjs` | 341 | ProductRenderSpecs, ProductRenderSpecResolver, gate values, render planning targets, no commerce/manufacturing/publicClaim readiness implied — Package 4A |
| `src/tests/prototype-preview-registry-tests.mjs` | 215 | PrototypePreviewRegistry all/get/getByPreviewTypeId/architectureKnown/prototypePreviewSupported, PrototypePreviewResolver resolve, unknown-type safe results, non-book stubs, no mutation — Package 4B |
| `src/tests/product-experience-readiness-tests.mjs` | 337 | ProductExperienceReadiness resolveForProduct/resolveAllForGroup/resolvePreviewableForGroup/resolveBlockedForGroup/resolveByStatus; EXPERIENCE_STATUS hierarchy; system dependency + content eligibility coexistence (Suite 15); no mutation; catalog-only stubs — Package 4C |
| `src/tests/product-experience-consumer-tests.mjs` | 35 | ProductExperienceConsumer isAvailable/resolveForGroup/resolveProductForGroup/resolvePreviewableForGroup; null-safety; readiness-absent fallbacks; mutation guard; message-book highest status — Package 4D |
| `scripts/e2e-test-data.mjs` | — | Deterministic NormalizedMemory seed data for E2E harness — Package 3B |
| `scripts/fixtures/fake-conversation.txt` | — | Safe fake pipe-delimited .txt fixture (5 messages) for real import testing — Package 3C |

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

### QA (Package 3B — `0ce973a` / 3C — `f8379d0` / 2.6 — `23b46b7` / 4E.1 — `3c4ce70` / 2.7 — `6dde21b`)

| File | Purpose |
|---|---|
| `docs/qa/e2e-regression-harness.md` | How to run the E2E harness (seeded + real-files), phase coverage incl. 20+21, test counts (41/23/64), startup reliability section, privacy/fixture policy — updated Package 4E.1 |
| `docs/qa/manual-qa-template.md` | Manual QA result template (golden path, edge cases, regression) |
| `docs/qa/pre-commit-verification-template.md` | Pre-commit hygiene gate: working tree, diff sanity, tests, continuity, identity (Package 2.7) |
| `docs/qa/release-readiness-template.md` | Release/milestone readiness gate checklist (Package 2.7) |

### Dev workflow protocols (Package 2.7 — `6dde21b`)

| File | Purpose |
|---|---|
| `docs/dev/ai-development-relay.md` | Relay flow; Codex 5-role interchangeable model (updated Package 2.7) |
| `docs/dev/development-review-packet-template.md` | Template for sending completed work to Development review |
| `docs/dev/claude-codex-interchangeability.md` | Codex roles, shared contract, handoff rules |
| `docs/dev/session-restart-protocol.md` | Mandatory restart sequence after any session/context/model/tool event |
| `docs/dev/context-hygiene-protocol.md` | /clear vs /compact vs /context decision table; pre-event update content |
| `docs/dev/model-switching-protocol.md` | Model-switch checkpoint rules; which model for which work |
| `docs/dev/tool-switching-protocol.md` | Claude↔Codex handoff rules; branch ownership |
| `docs/dev/agent-scope-boundaries.md` | Consolidated allowed/off-limits/authorization-required list |
| `docs/dev/worktree-and-parallel-session-policy.md` | Worktree + parallel session governance |

### Project Control readiness (Package 2.7 — `6dde21b`, readiness only — Tower NOT built)

| File | Purpose |
|---|---|
| `docs/project-control/README.md` | Entry point; what is and is not built |
| `docs/project-control/project-control-tower-plan.md` | Scope/structure of the future Tower pass |
| `docs/project-control/project-calendar-spec.md` | How calendar/schedule export will work when built |
| `docs/project-control/coordinator-weekly-sync.md` | Recurring Coordinator sync placeholder (not active yet) |

### Automation — Operator Mode Protocols (Package 2.5B — `bb23e8b` / Context Guard Patch — see below)

| File | Purpose |
|---|---|
| `docs/automation/operator-mode/README.md` | Entry point: core rules, status vocabulary, source-of-truth priority, authorization table |
| `docs/automation/operator-mode/context-continuity-protocol.md` | **Context Continuity Guard Patch** — checkpoint triggers, before/after-compact behavior, Claude/Codex switching rules, forbidden behaviors |
| `docs/automation/operator-mode/update-project-records-protocol.md` | 8-step protocol for updating docs from stream responses without false authority |
| `docs/automation/operator-mode/package-closeout-protocol.md` | 10-step commit/merge/closeout process with exact git commands; updated with mid-package continuity rules |
| `docs/automation/operator-mode/stream-routing-protocol.md` | Stream authority map, routing table, and routing decision tree for the 15-chat model |
| `docs/automation/operator-mode/claude-codex-relay-protocol.md` | Transfer packet format and Claude/Codex relay protocol; updated with handoff-based continuation requirement |

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
