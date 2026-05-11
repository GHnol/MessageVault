# Product Format Bank — KeepMees / MessageVault

**Last updated:** 2026-05-09
**Status:** LAYER 1 (source-backed) for catalog products; LAYER 2 advisory appendix at bottom

---

## Overview

This document is the canonical reference for every product format in the KeepMees catalog. The authoritative runtime definitions for Package 1-2 products live in `src/products/product-catalog.js` and `src/products/product-statuses.js`. This document records the reasoning behind each format's current state, constraints, and the broader product vision.

**Important:** KeepMees is a broad keepsake product-system engine. Message Book is the flagship, not the boundary. The product family is emotionally driven — the question is not "what products can messages go on?" but "what emotional use cases do people want to preserve, and which products naturally fit?"

---

## Status vocabulary

| Axis | Values |
|---|---|
| Software support | `supported` / `partial` / `stub` / `not-started` |
| Commerce readiness | `ready` / `blocked` / `not-applicable` |
| Manufacturing readiness | `ready` / `planning` / `not-started` / `not-applicable` |
| Public claim | `claimable` / `not-yet` / `restricted` |

---

## Product philosophy

**"Premium" = accessible quality, not luxury exclusivity.** Products should be:
- Thoughtful, creative, emotionally resonant
- Well-designed, well-made, giftable
- Broadly accessible, not only heirloom-priced
- Tasteful, non-tacky — not generic custom-merch energy

**Message bubble UI** is a core visual asset. The original iMessage-style bubble UI should often be preserved visually on the final product in a well-designed way. Products are not just surfaces for text — they carry the conversation format itself as the design.

**Content → product engine:** KeepMees is a content-to-product engine, not just a product catalog. Full emotional range (funny, romantic, random, deep, chaotic, meaningful). All use cases supported. Not just romance, not just journaling, not just books.

**Emotional use cases drive product selection:**
- Romantic / anniversary
- Friendship / group memory
- Family / parenting
- Grief / remembrance
- Holidays / birthdays
- Long-distance relationships
- Just-because gifts / everyday encouragement

---

## Product catalog layers

There are five distinct layers in the KeepMees catalog system. Do not conflate them.

**A. Software ProductCatalog foundation (Package 2 delivered):**
The engine's product-family foundation. Currently supports: Message Book, Journal, Mug, Sticker Pack, Wall Art, Gift Wrap. This is the software capability layer — not the physical commerce catalog.

**B. Physical first launch target (CURRENT STRATEGIC TARGET / OWNER-APPROVED TARGET):**
The current owner-approved set of physical SKUs targeted for launch: Message Book, Framed Conversation Print, Mug, Mini Keepsake Notebook, Mini Message Sticker Pack, Fridge Magnet. Physical readiness is gated for each SKU individually (see section below).

**C. Earlier hero mockup / broad product exploration set:**
Earlier product visualization and format exploration — Journal/Diary, Message Book/Photo Album, Wall Art/Poster/Framed Print, Mug, Sticker Sheet, Gift Wrap. This was product-format exploration, not the final physical launch target. Later Mockups/Vendor Strategy stream superseded this as the source of the current physical launch target.

**D. Legacy/prototype standalone composition types:**
Quote Card, Framed Print, Mini Story, Conversation Page. These are prototype composition paths exposed via `LegacyKeepsakeTypesBridge` for engine evaluation only. Not physical launch SKUs unless explicitly promoted.

**E. Future product backlog:**
All other product ideas (pillow, blanket, acrylic block, apparel, etc.) remain in the expanded product vision section below, classified by priority and readiness.

---

## Physical first launch target (Owner-Approved Strategic Target)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/05 Production - Mockups and Vendor Strategy.md`
**Status:** CURRENT STRATEGIC TARGET / OWNER-APPROVED TARGET / PHYSICAL READINESS GATED

The physical first-launch set is a current strategic target, but each SKU remains gated by render/proof quality, vendor feasibility, packaging, pricing, fulfillment, and public-claim readiness.

**Physical first launch target does NOT mean:** vendor-ready, manufacturing-ready, commerce-ready, proof/render-ready, packaging-ready, pricing-ready, fulfillment-ready, or public-claim-ready. Each gate must be cleared per SKU.

```
HERO PRODUCTS (2):
1. Keepsake Message Book
2. Framed Conversation Print

CORE PRODUCTS (2):
3. Mug
4. Mini Keepsake Notebook

ADD-ON PRODUCTS (2):
5. Mini Message Sticker Pack
6. Fridge Magnet
```

**Intentionally NOT included at launch:** Phone cases, blankets, pillows, planners, acrylic blocks, bags
**Rationale:** Too many variables too early; higher risk of inconsistency; can dilute brand clarity at launch

### Framed Conversation Print (HERO)

**Emotional philosophy:** Adapts to the feeling, not just the text. Displayable, proud, shareable, emotionally affirming.

**Content support:** Single message, short exchange, full thread
**Visibility modes:**
- Distance mode: fewer messages, larger text, readable across room (quotes, short exchanges)
- Intimate mode: more content, smaller text, requires proximity (full conversations)

**Orientation:** Portrait only
**Sizes:** 2 sizes max at launch
**Frame:** Included — not optional. 1 signature frame style only (variations in Phase 2)
**Emotional scenario (locked):** Appreciation/praise/encouragement from a close friend (not parent-child) — displayable, proud, shareable

### Mini Keepsake Notebook (CORE)

**Primary use:** Personal — customized notebook for user's own writing
**Inside page variants:**
- Lined (6–7mm) for journaling/general note-taking
- Blank/unruled for sketching and creative freedom

**Message placement:** Cover (primary); back (optional); first page (optional premium touch); interior is actual writing space
**Size:** 1 size only at launch
**Product identity:** Not a "message product" — "a personal object enhanced by memory"

### Mini Message Sticker Pack (ADD-ON)

**Structure:** Flexible count (not fixed)
**Style:** Exact message bubbles (now); stylized versions (later)
**Approach:** User-generated only — no pre-curated themed packs at launch
**Size range:** Small only, uniform set

### Fridge Magnet (ADD-ON)

**Content:** Single message and short exchange
**Principle:** Keep tight, readable, simple

---

## Product doctrine (from Mockups stream)

1. Preserve reality, present it beautifully
2. System does heavy lifting, but user must feel authorship
3. Flexibility allowed only inside a controlled quality framework
4. Not a transcript, not a scrapbook — a preserved conversation object

**Emotional test:** Customer should think: "Wow, I'm amazed."

---

## Catalog products (software ProductCatalog — Package 2 engine foundation)

These are the products supported in the Package 2 software engine (`src/products/product-catalog.js`). This is the software capability layer — **not** the physical first launch target. See the "Product catalog layers" section above for the distinction.

### Message Book (`message-book`)

**Category:** book — **Flagship:** yes — **Source:** `src/products/product-catalog.js`

| Axis | Status |
|---|---|
| Software | `supported` |
| Commerce | `blocked` |
| Manufacturing | `planning` |
| Public claim | `not-yet` |

**Content:** text messages + attachment-placeholder (attachment-only messages warned, not blocked)
**Min guidance:** 5 messages
**Max guidance:** none (multi-volume capable)
**Source compatibility:** all platforms

**Physical spec:**
- Trim: 7×10" casebound hardcover
- Interior stock: single matte/premium text stock at launch
- No ISBN or barcode at launch
- Back cover: KeepMees controls, customer editorial area TBD
- Multi-volume: separate physical books in one order
- Pricing benchmark: MyForeverBooks A5 $45-$128 (no-discount), Zapptales 34-38 EUR

**Known limitations:**
- No checkout or order flow implemented
- No PDF export or print-ready output
- Cover generation blocked on vendor confirmation
- Multi-volume splitting is estimated, not final

**Why commerce is blocked:** vendor/manufacturer not yet confirmed. The `isCoverUnblocked()` gate in `BOOK_PRODUCTION_DEPS` controls cover work.

---

### Journal / Diary (`journal`)

**Category:** book — **Flagship:** no — **Source:** `src/products/product-catalog.js`

| Axis | Status |
|---|---|
| Software | `stub` |
| Commerce | `not-applicable` |
| Manufacturing | `not-started` |
| Public claim | `not-yet` |

**Content:** text only
**Min guidance:** 10 messages
**Max guidance:** 200 messages

**Emotional fit:** Romantic (anniversary journal), Family/parenting (memory journal), Grief/remembrance (memorial journal)

**Known limitations:** No renderer implemented. Product-line-supported definition only.

---

### Mug (`mug`)

**Category:** merchandise — **Flagship:** no — **Source:** `src/products/product-catalog.js`

| Axis | Status |
|---|---|
| Software | `stub` |
| Commerce | `not-applicable` |
| Manufacturing | `not-started` |
| Public claim | `not-yet` |

**Content:** text only (attachments not printable on mug surface)
**Min guidance:** 1 message
**Max guidance:** 3 messages
**Text cap:** ~80 characters total for comfortable display

**Emotional fit:** Romantic (mug set), Friendship (everyday), Encouragement
**Manufacturing model:** True one-off personalization (sublimation or UV print), blank stocked by vendor, personalized per order, effective MOQ = 1

---

### Sticker Pack (`sticker-pack`)

**Category:** merchandise — **Flagship:** no — **Source:** `src/products/product-catalog.js`

| Axis | Status |
|---|---|
| Software | `stub` |
| Commerce | `not-applicable` |
| Manufacturing | `not-started` |
| Public claim | `not-yet` |

**Content:** text only
**Min guidance:** 4 messages
**Max guidance:** 12 messages
**Per-sticker ideal:** ≤50 characters

**Emotional fit:** Friendship (shared in-jokes), Group memory, Just-because
**Manufacturing model:** True one-off personalization (digital press or sticker printing), effective MOQ = 1

---

### Wall Art (`wall-art`)

**Category:** decor — **Flagship:** no — **Source:** `src/products/product-catalog.js`

| Axis | Status |
|---|---|
| Software | `stub` |
| Commerce | `not-applicable` |
| Manufacturing | `not-started` |
| Public claim | `not-yet` |

**Content:** text only
**Min guidance:** 1 message
**Max guidance:** 5 messages
**Ideal:** 1–3 substantial messages (≥20 characters each)

**Emotional fit:** Romantic (displayed), Family/parenting (home display), Grief/remembrance (framed memorial)
**Manufacturing model:** Batch blanks + one-off decoration (canvas or print-on-demand poster), effective MOQ = 1 with right vendor

---

### Gift Wrap (`gift-wrap`)

**Category:** packaging — **Flagship:** no — **Source:** `src/products/product-catalog.js`

| Axis | Status |
|---|---|
| Software | `stub` |
| Commerce | `not-applicable` |
| Manufacturing | `not-started` |
| Public claim | `not-yet` |

**Content:** text only
**Min guidance:** 1 message
**Max guidance:** 8 messages
**Text cap:** ~200 characters total

**Emotional fit:** All gift occasions — gift wraps the physical keepsake itself
**Manufacturing model:** True one-off personalization (digital/digital-offset print on wrapping paper sheet), effective MOQ = 1 with right vendor

---

## Expanded product vision (PROPOSED — not yet in software)

The following product formats have been identified by the Coordinator and product/vendor streams as natural extensions of the KeepMees product system. None are in software. All are PROPOSED status.

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/05 Production - Mockups and Vendor Strategy.md`, `04 Production - Vendor Feasibility Agent.md`

### Core expansion tier (strongest emotional fit + manufacturing viability)

| Product | Emotional fit | Manufacturing model | Bubble UI viable? | Priority |
|---|---|---|---|---|
| Pillow | Romantic, grief, family | True one-off (sublimation/DTG) | Yes | High |
| Blanket | Romantic, grief, family, friendship | True one-off (sublimation/DTG) | Yes (repeating pattern or featured message) | High |
| Magnet | Friendship, family, encouragement | True one-off (digital print) | Yes | High |
| Photo album / Memory album | Family, romantic, grief | Batch blanks + one-off decoration | Partially | Medium |
| Planner | Romantic, friendship, everyday | Batch blanks + one-off decoration | On cover | Medium |

### Secondary expansion tier (viable but need tighter design taste)

| Product | Emotional fit | Manufacturing model | Bubble UI viable? | Priority |
|---|---|---|---|---|
| Phone / tablet / laptop case | Friendship, romantic, everyday | True one-off (UV print / sublimation) | Yes (small format) | Medium |
| Laptop stickers | Friendship, everyday | True one-off (digital print) | Yes | Medium |
| Bag / tote | Friendship, group, everyday | True one-off (DTG / embroidery) | Partially | Medium |
| Pajamas | Romantic, family | True one-off (DTG) | On panel | Lower |

### Later / novelty tier (not recommended for core launch)

| Product | Notes |
|---|---|
| Socks | Novelty-driven; less universally compelling |
| Rug | Niche unless framed as very premium home item |
| Car sticker | More novelty, less keepsake |
| Acrylic block | Listed in Vendor Gating Plan v3 as future format. Premium display object. Not a near-term priority. |
| Clothing (apparel) | Broad category; needs careful design taste; not recommended for launch |

### Important manufacture note on expanded products
MOQ applies to the **blank item** (sublimation blank pillow, DTG blank hoodie, etc.), not the finished personalized product. A partner that stocks blanks and prints on-demand per order allows effective MOQ = 1 for finished personalized items. This model is standard for mugs, pillows, blankets, and phone cases via sublimation or DTG vendors.

---

## Legacy standalone types (LegacyKeepsakeTypesBridge)

These are composition types from the pre-catalog system. They produce standalone keepsake outputs (not physical products) and are exposed through `KMEngine.LegacyKeepsakeTypesBridge` for engine-level evaluation only. They are not in the ProductCatalog.

| ID | Label | Eligibility rule |
|---|---|---|
| `quote-card` | Quote Card | 1–3 messages; at least one ≥12 characters |
| `framed-print` | Framed Print | 2–8 messages; total text ≤600 characters |
| `mini-story` | Mini Story | ≥5 messages; total text ≥80 characters |
| `conversation-page` | Conversation Page | ≥4 messages; ≥2 distinct senders |

These types are frozen — do not add new legacy types or modify existing eligibility rules without an explicit package instruction.

---

## Category summary (current software + proposed vision)

| Category | In software now | Proposed additions |
|---|---|---|
| book | message-book, journal | photo album / memory album, planner |
| merchandise | mug, sticker-pack | pillow, blanket, magnet, pajamas, clothing, cases, bags |
| decor | wall-art | acrylic block (future) |
| packaging | gift-wrap | — |

---

## LAYER 2 — Claude Advisory, Not Yet Coordinator Approved

### Advisory: Product catalog expansion should be sequenced by emotional use case, not by manufacturing convenience

The strongest near-term expansion candidates after Message Book are:
1. **Pillow** — grief/romantic, strong emotional logic, sublimation POD is mature
2. **Blanket** — romantic/family, high perceived value, DTG/sublimation POD is viable
3. **Magnet** — friendship/everyday, low price point, strong giftability, easy to produce
4. **Sticker Pack** — friendship/group, very low price point, impulse gift, digital print

These four plus Message Book and Mug create a meaningful launch range from low-cost (magnets, stickers) to mid-price (mug, pillow) to premium (blanket, book).

### Advisory: Photo album consideration

A photo album or memory album (with printed message bubbles as spreads alongside photos) is a natural complement to Message Book. It occupies a different use case (photo + text combined) and a different emotional position (family documentation, travel memory). This is worth a product design investigation. NOT recommending implementation now.

### Advisory: Software product-format-bank needs updating for expanded catalog

The current `ProductCatalog` in software has 6 products. The intended product vision is broader. The AI Mastery Build Pack explicitly lists: "Message Book, journal/diary, mug, sticker pack, wall art/framed print, gift wrap, photo album, acrylic block, cards, planner, cases, apparel/textiles." A future software update should expand the catalog when product and Coordinator approve the next phase.
