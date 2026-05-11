# Master Project Truth — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** Active

---

## What this document is

Single authoritative reference for what KeepMees is, what it has decided, and what constraints govern all future work. This document does not replace code — it records the *why* and the *what was decided* that the code alone cannot express.

---

## System identity

**KeepMees** is a broad keepsake product-system engine for turning saved digital conversations into physical and digital keepsakes. The product family spans books, merchandise, decor, and packaging — not just Message Book. Message Book is the flagship, not the boundary.

**MessageVault** is the repository name. The brand name exposed to users is KeepMees.

**"Premium" means accessible quality**, not luxury exclusivity. Products should be thoughtful, creative, well-designed, well-made, giftable, and broadly accessible — not only heirloom-priced.

**Project genesis:** The project originated when a user discovered how to extract iMessage conversation data from `chat.db` via SQLite in 2026-03. The core discovery was that iMessage conversations are stored locally as a structured SQLite database, accessible without any Apple export tool. This became the foundation for the iMessage `chat.db` import adapter.

**Core pipeline vision:** Recovered messages → source material → selected content → product-ready layouts → physical or digital keepsakes.

**The emotional use case question drives everything:** Not "what products can messages go on?" but "what emotional use cases do people want to preserve, and which products naturally fit?"

---

## Product philosophy (from Product Overview)

**Source:** KeepMees Product Overview (PDF initially unreadable; full text later supplied by Coordinator and incorporated).

- KeepMees is a premium memory-preservation product — not a chat export tool.
- The core value is: emotional preservation, premium presentation, and a repeatable business around memories people do not want to lose.
- **The strongest wedge:** "preserve the messages that matter most in a form that feels lasting and beautiful" — not "export your messages."
- The user experience must be **meaning-first, not product-first.**
- The correct flow is: source material → find/select meaningful messages → group into keepsake sets → see eligible products → product-specific preview/proof → approval/order readiness.
- Grouping matters because the same messages can belong to different story arcs, gifts, or products.
- Message Book is the clearest flagship because it can hold story, sequence, context, and emotional weight. It anchors the brand but is not the final ceiling.
- The deeper opportunity is larger than books: KeepMees helps people recover, curate, organize, and preserve meaningful parts of digital relationships.
- Immediate focus is message-based keepsakes, especially premium books — this is NOT a signal to stay books-only forever.
- Revenue logic: premium emotional preservation + gifting potential + repeat keepsake creation + product expansion from curated memory sets.
- **Differentiators:** premium emotional design, truthful privacy language, meaning-first flow, strong composition quality, product extensibility, emotional clarity.
- **Brand tone:** premium, emotionally resonant, modern, tasteful, warm, and privacy-conscious.
- **Long-term goal:** become the trusted product people think of when they want to preserve meaningful digital relationships and moments.

**Important reconciliation:** The Product Overview warns against launching every possible product recklessly. That warning does not erase the owner-approved six-product physical first launch target — those six are coherent, emotionally grounded, and each gated by real readiness.

---

## Architecture in one line

A single HTML file loads a modular `KMEngine` namespace via `<script type="module">` tags from `src/`. All state, UI, composition logic, and rendering run entirely in the browser. No server dependency at launch.

---

## Flagship product

**Message Book** — a casebound hardcover printed book, 7×10", containing a curated selection of real messages from a conversation. Paginated, sectioned, multi-volume capable.

All other products in the catalog are product-line-supported stubs only.

---

## Locked production decisions

These decisions are final. Do not revisit without explicit product authority.

| Decision | Value | Locked since |
|---|---|---|
| Trim size | 7×10" | Production planning pass |
| Binding | Casebound hardcover | Production planning pass |
| Interior stock | Single matte/premium text stock at launch | Production planning pass |
| Emoji handling | Standardized print-safe set | Production planning pass |
| Multi-volume model | Separate physical books in one order | Production planning pass |
| Back cover ownership | KeepMees controls; some customer editorial TBD | Production planning pass |
| ISBN / barcode | None at launch | Production planning pass |
| PDF spec | PDF/X-4-friendly | Production planning pass |
| PDF generation | Server-side (not in-browser) | Production planning pass |
| Parity padding | System-owned (`BOOK_PARITY` object, MODULUS=2) | Production foundation pass 1 |
| Customer proof | In-app approval as primary flow | Production planning pass |

---

## Locked pagination constants

These values are encoded in `index.html` and are under scope guard. Do not change without an explicit package instruction.

| Constant | Value |
|---|---|
| `BOOK_PAGE_LINES` | 44 |
| `BOOK_HEADER_LINES` | 4 |
| `BOOK_DIVIDER_LINES` | 3 |
| `BOOK_FEATURED_HEADER_LINES` | 8 |
| `BOOK_CONTINUATION_LINES` | 2 |
| `BOOK_PAGINATION_VERSION` | `'1'` — bump when pagination changes page assignments |

---

## Production foundation objects (in `index.html`)

| Object | Purpose |
|---|---|
| `BOOK_PRODUCTION_DEPS` | Locked direction constants + `isCoverUnblocked()` gate |
| `BOOK_PARITY` | `paddingNeeded()`, `createPaddingPageDescriptor()`, MODULUS=2 |
| `BOOK_PREFLIGHT_SEVERITY` | INFO / WARNING / ERROR enum |
| `BOOK_PREFLIGHT_CHECK_REGISTRY` | 10 named check definitions (schema only, no runners yet) |
| `createPreflightResult(...)` | Factory for preflight check results |
| `createPreflightReport(results)` | Wraps array, exposes `isManufacturingReady()` |
| `captureBookRenderSpec(...)` | Snapshot function — captures render state |

---

## Composition pipeline

```
generateCompositionUnits
    → paginateUnits          (pure data, returns page objects)
    → enrichPageMetadata     (mutates pages in place — adds production fields)
    → buildPageDOMElement    (DOM construction)
```

`enrichPageMetadata(pages, { volumeId, hasTimestamps, pageNumberVisible })` adds:
`physicalPageNumber`, `rectoOrVerso`, `volumeId`, `hasTimestamps`, `pageNumberVisible`,
`isFeatured`, `isPaddingPage`, `messageCount`, `hasDivider`, `logicalPageType`

`logicalPageType` values: `title-page` | `dedication-page` | `section-page` |
`continuation-page` | `ending-page` | `padding-page`

---

## Editorial constraints

Object: `bookEditorial` in `index.html`

| Field | Max |
|---|---|
| Title | 60 characters |
| Dedication | 500 characters |
| Section title | 45 characters |

Behavior: state/canvas NOT updated while over-limit; blur truncates to max then normalizes.

---

## Scope guard

The following are explicitly off-limits without explicit package instruction:

- `BOOK_PAGE_LINES`, `BOOK_HEADER_LINES`, `BOOK_DIVIDER_LINES`, `BOOK_FEATURED_HEADER_LINES`, `BOOK_CONTINUATION_LINES`
- `BOOK_PAGINATION_VERSION`
- `BOOK_PRODUCTION_DEPS` and `BOOK_PARITY`
- Standalone keepsake flows
- Review view
- ProductRenderSpec code
- Checkout / order flow
- PDF generation
- Visual redesign
- Vendor export
- Generated artifact zips

---

## Provisional manufacturing dimensions

Planning defaults only — PROVISIONAL, not locked. Confirm actual values per vendor before any vendor-export work begins (see DEC-P-10 in `docs/ops/decision-register.md`).

| Dimension | Provisional value |
|---|---|
| Bleed | 0.125" universal floor |
| Safe area | 0.125" inside trim |
| Inner margin | 0.875" |
| Outer margin | 0.75" |
| Top / bottom margins | 0.75" |

When a vendor is confirmed, update DEC-P-10 with actual values.

---

## Production viability gates

Three sequential checkpoints gate specific work. None can be bypassed.

**Checkpoint A — Design viability:** Figma master (`KeepMees Message Book, Figma Build Package v1.1`) must pass the design acceptance rubric before any vendor-export or print-pipeline work begins. See `docs/ops/design-readiness-register.md`.

**Checkpoint B — Vendor viability:** A vendor must be confirmed before cover generation begins. Controlled by `isCoverUnblocked()` in `BOOK_PRODUCTION_DEPS`. Cover work is hard-gated until this opens.

**Checkpoint C — Pipeline viability:** A server-side PDF pipeline must exist before checkout or delivery flow can be implemented. In-browser PDF generation is excluded by DEC-P-06. No checkout or delivery flow can be completed until this exists.

---

## Physical first launch target (Owner-Approved Strategic Target)

Current owner-approved physical first launch target: **Message Book** + **Framed Conversation Print** (Hero); **Mug** + **Mini Keepsake Notebook** (Core); **Mini Message Sticker Pack** + **Fridge Magnet** (Add-on). All other formats are future expansion only.

This is the *physical* target — distinct from the Package 2 software ProductCatalog (which has a different mix: Message Book, Journal, Mug, Sticker Pack, Wall Art, Gift Wrap). Physical target does not mean any SKU is vendor-ready, commerce-ready, or public-claim-ready.

Full specs: `docs/strategy/product-format-bank.md`. Decision: DEC-P-08.

---

## Locked visual design decisions (summary)

These govern all UI, rendering, and Figma work. Full records: DEC-V-01 through DEC-V-11 in `docs/ops/decision-register.md`. Full Figma specification: `docs/ops/design-readiness-register.md`.

| Decision | Value |
|---|---|
| Visual style | C Hybrid — clean + emotional + slightly textured. NOT ultra-minimal, NOT warm/editorial. |
| Reaction badge placement | Left message → badge at top-right shoulder. Right message → badge at top-left shoulder. Max 1 per message. Never floating, never dominant. |
| Spacing tiers | Tight 4–8px (same sender) / Medium 12–16px (sender switch) / Wide 24–32px (section or emotional beat) |
| Typography roles | Serif for display/headlines; sans-serif for messages and UI-derived content |
| Cover | Names-led; typography-minimal; no message bubbles on front cover; KeepMees appears as quiet maker's mark on spine or back only |
| Bubble fidelity | 90% iMessage faithful, 10% refined. Reactions always rendered and corner-anchored — never dropped |

---

## Phase history

```
db05afd  Initial MVP — chat vault, upload, rendering, export
         ...conversation features, reactions, onboarding...
e6cbc26  Message Book foundation (MB phase start)
06ef29f  Volume and section scaffolding
46b176c  Pagination refinement
a153a6c  Page count alignment to real pagination
1c81c37  Featured sections and continuation flow
c6e4082  Editorial naming and book-level editing (MB5)
03c3db7  Editorial validation and preview constraints (MB5b)
7a03b85  Production metadata and render snapshot groundwork
1f05970  Package 1 — KMEngine source adapters + NormalizedMemory foundation
87972c9  Package 2 — ProductCatalog, ProductEligibility, KeepsakeGroup, LegacyKeepsakeTypesBridge
```

---

## KMEngine module map

| Module | Path | Purpose |
|---|---|---|
| `NormalizedMemory` | `src/core/normalized-memory.js` | Canonical message shape |
| `ProjectSession` | `src/core/project-session.js` | Session container and lifecycle |
| `SessionSerialization` | `src/state/session-serialization.js` | Serialize/restore session |
| `SOURCE_PLATFORMS` | `src/core/source-platforms.js` | Platform registry |
| `import-adapters` | `src/core/import-adapters.js` | Adapter registration + import result shape |
| `KeepsakeGroup` | `src/core/keepsake-group.js` | Group data model |
| `ProductStatuses` | `src/products/product-statuses.js` | Status enums |
| `ProductCatalog` | `src/products/product-catalog.js` | Product definitions |
| `ProductEligibility` | `src/products/product-eligibility.js` | Per-product eligibility engine |
| `LegacyKeepsakeTypesBridge` | `src/products/legacy-keepsake-types-bridge.js` | Bridge for legacy standalone types |

Adapters: `src/adapters/imessage-chatdb-adapter.js`, `txt-export-adapter.js`, `manual-entry-adapter.js`, `future-adapter-stubs.js`

Tests: `src/tests/km-engine-tests.mjs`, `keepsake-group-tests.mjs`, `product-catalog-tests.mjs`, `product-eligibility-tests.mjs`
