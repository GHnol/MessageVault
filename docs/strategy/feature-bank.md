# Feature Bank — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** Active

---

## Delivered features

### Ingestion and chat display

| Feature | Package / commit | Notes |
|---|---|---|
| iMessage chat.db SQL import (SQL.js) | Initial MVP | In-browser SQL parsing |
| .txt export pipe-delimited import | Initial MVP | |
| Manual entry | Initial MVP | |
| Reaction reconstruction | Initial MVP | Text-pattern matching for .txt; SQL for chat.db |
| Grouped message stacking (consecutive sender) | Initial MVP | |
| Conversation search and selection states | MB phase | |
| Onboarding / trust flow for local file ingestion | Pre-MB phase | |
| NormalizedMemory lift for all imports | Package 1 | Stable memory IDs |
| Source platform registry | Package 1 | `KMEngine.SOURCE_PLATFORMS` |
| Import adapter framework | Package 1 | `KMEngine.registerAdapter` |

### Keepsake grouping

| Feature | Package / commit | Notes |
|---|---|---|
| Persistent multi-set keepsake grouping | MB phase | |
| Bulk select and move | MB phase | |
| Staged group (group-staging) | MB phase | |
| Set naming (custom + auto-numbered) | MB phase | |
| `KeepsakeGroup` engine model | Package 2 | Canonical group shape with memoryIds, sourcePlatformIds |

### Message Book composition

| Feature | Package / commit | Notes |
|---|---|---|
| Book foundation and entry flow | MB phase | |
| Volume and section scaffolding | MB phase | |
| Pagination (44-line pages, sections, featured) | MB4d+ | |
| Section ordering | MB5 | |
| Featured section / continuation flow | MB5 | |
| Page count alignment | MB5 | |
| Editorial naming (title, dedication, section titles) | MB5 | |
| Editorial validation (max limits, blur-truncate) | MB5b | |
| Production metadata (enrichPageMetadata) | Production foundation | |
| Parity padding (`BOOK_PARITY`) | Production foundation | |
| Preflight check registry (schema, no runners yet) | Production foundation | |
| Render snapshot (`captureBookRenderSpec`) | Production foundation | |

### Product system

| Feature | Package / commit | Notes |
|---|---|---|
| `ProductStatuses` enums | Package 2 | |
| `ProductCatalog` (6 products) | Package 2 | |
| `ProductEligibility` per-product evaluators | Package 2 | |
| `LegacyKeepsakeTypesBridge` | Package 2 | 4 legacy standalone types |

---

## Features in progress / next packages

See `docs/ops/backlog-roadmap.md` for package-level breakdown.

| Feature | Target package | Notes |
|---|---|---|
| ProductDraft model | Package 3 | Draft per group per product |
| Preflight runner (check execution) | Package 3 | Against the 10-check registry |
| Session save/restore flow | Package 3 | UI wired to `SessionSerialization` |
| KeepsakeGroup + product draft lifecycle hooks | Package 3 | |

---

## Deferred features

| Feature | Reason deferred | See |
|---|---|---|
| Checkout / order flow | Commerce not ready; vendor unconfirmed | `docs/ops/deferred-gated-ideas-register.md` |
| PDF generation | Server-side; infra not in scope | `docs/ops/deferred-gated-ideas-register.md` |
| Cover design tooling | Cover unblocked gate not met | `docs/ops/deferred-gated-ideas-register.md` |
| Proof approval UX | Tied to PDF and checkout | `docs/ops/deferred-gated-ideas-register.md` |
| WhatsApp adapter | Stub exists; no priority | `docs/ops/deferred-gated-ideas-register.md` |
| Android SMS adapter | Stub exists; no priority | `docs/ops/deferred-gated-ideas-register.md` |
| Instagram DM adapter | Stub exists; no priority | `docs/ops/deferred-gated-ideas-register.md` |
| Facebook Messenger adapter | Stub exists; no priority | `docs/ops/deferred-gated-ideas-register.md` |
| Telegram adapter | Stub exists; no priority | `docs/ops/deferred-gated-ideas-register.md` |
| OCR image import | Requires server pipeline | `docs/ops/deferred-gated-ideas-register.md` |
| Audio / video transcript import | Requires server pipeline | `docs/ops/deferred-gated-ideas-register.md` |
| Local/session persistence (save/resume projects) | Near-term, not deferred — see Package 3 / Inflection 2A | `docs/ops/deferred-gated-ideas-register.md` |
| Cloud account / cross-device persistence | Out of scope for launch | `docs/ops/deferred-gated-ideas-register.md` |
| Visual redesign / new design system | Explicitly gated | `docs/ops/deferred-gated-ideas-register.md` |
