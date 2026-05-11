# Vendor and Manufacturing Register — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** LAYER 1 (source-backed) for vendor research; LAYER 2 advisory appendix at bottom

---

## Purpose

Track vendor candidates, confirmed vendors, manufacturing constraints, and the decisions that flow from them. This register is the source of truth for manufacturing-related decisions that affect the software (page counts, spec limits, file format requirements).

---

## Current gate state

| Gate | Status |
|---|---|
| Vendor confirmed | No — active evaluation, no confirmed selection |
| `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` | false |
| Commerce readiness (`message-book`) | `blocked` |
| Manufacturing readiness (`message-book`) | `planning` |

No vendor work (cover design, PDF pipeline, checkout) can proceed until a vendor is confirmed and the `isCoverUnblocked()` gate is met.

---

## Locked manufacturing decisions

These decisions are made and encoded in the software regardless of vendor:

| Decision | Value | Status |
|---|---|---|
| Trim size | 7×10" | LOCKED |
| Binding | Casebound hardcover | LOCKED |
| Interior stock | Single matte/premium text stock at launch | LOCKED |
| Stock direction | Middle-ground matte/premium text (NOT uncoated warm, NOT slick coated) | LOCKED |
| Parity (even page count) | Required; `BOOK_PARITY.MODULUS = 2` | LOCKED |
| Multi-volume | Separate physical books in one order | LOCKED |
| No ISBN / barcode at launch | None | LOCKED |
| PDF generation | Server-side only | LOCKED |
| PDF spec target | PDF/X-4-friendly internally (not final vendor law) | LOCKED (provisional — confirm per vendor) |
| Back cover | KeepMees controls; customer editorial area TBD — hybrid model | LOCKED |
| Emoji handling | Standardized print-safe set | LOCKED |
| Proof approval | In-app review + explicit customer accept action | LOCKED |

**Provisional dimensions (safe for planning; confirm per vendor):**

| Dimension | Provisional value |
|---|---|
| Bleed | 0.125" universal floor (can increase) |
| Safe area | 0.125" inside trim on all sides |
| Inner margin | 0.875" |
| Outer margin | 0.75" |
| Top/bottom margins | 0.75" |
| Proof artifact | Watermarked screen-resolution paginated PDF (not press-ready) |

---

## Vendor Wave 1 — outreach summary

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/04 Production - Vendor Feasibility Agent.md`
**Wave 1 outreach date:** ~2026-04 (Coordinator-directed)
**Status:** Research complete; no vendor confirmed

### PrintNinja

| Field | Finding |
|---|---|
| Vendor type | Traditional offset print, specialty book manufacturing |
| 7×10" hardcover support | **CONFIRMED** |
| Casebound hardcover | **CONFIRMED** |
| Dust jacket | CONFIRMED — available; printed case beneath jacket requires clarification |
| Cover finishes | Anti-scratch matte lamination, soft-touch matte lamination |
| Interior stock | Premium text stock options available |
| MOQ | **250 copies per title — NOT print-on-demand** |
| POD capable | No — MOQ per title |
| Multi-volume | Treated as separate titles; 250 MOQ applies per title |
| Specialty options | Foil, embossing/debossing, spot UV, cloth, faux leather |
| Proofing | Hard-copy proofing offered; explicit proof approval required |
| Turnaround | 3–4 weeks production after proof approval |
| Shipping limit | Maximum 3 ship-to addresses per order |
| Contact status | **RESPONDED** |
| Wave 1 status | VIABLE for batch/scale; NOT viable for POD/personalized-per-order launch |

**Outstanding questions:**
1. Does custom printing on the underlying case beneath a dust jacket work at 7×10"?
2. Does printed case + jacket change MOQ or pricing?
3. File setup requirements for jacket + underlying case architecture?

---

### BookBaby

| Field | Finding |
|---|---|
| Vendor type | Self-publishing / print-on-demand |
| 7×10" hardcover support | **CONFIRMED** |
| Casebound hardcover | **CONFIRMED** for all trim sizes |
| Dust jacket | Available for nearly all trim sizes |
| Cover finishes | Matte or gloss; refined non-gloss preferred direction |
| Interior stock | Coated or uncoated text stock options available |
| POD capable | Yes — appears POD/direct fulfillment capable |
| Multi-volume | **SYSTEM LIMITATION** — separate projects cannot be combined in one order |
| Contact name | Ashley |
| Contact status | **RESPONDED** |
| Wave 1 status | VIABLE WITH CONDITIONS — multi-volume issue is a blocking concern |

**Multi-volume system limitation:** Each volume requires a separate project with separate file set. Separate projects cannot be linked or coordinated for customer sets. Each volume would require separate order/checkout process. Separate projects CAN ship to same customer, but operationally awkward for the locked multi-volume model.

**Outstanding questions:**
1. Can separate volume projects be operationally coordinated for customer sets?
2. Can separate volumes share order/payment workflow?
3. Can separate volume shipments be coordinated at fulfillment level?

---

### IngramSpark

| Field | Finding |
|---|---|
| Vendor type | Distribution + print-on-demand |
| 7×10" hardcover support | Shown in public trim matrix — requires vendor confirmation |
| Jacketed hardcover at 7×10" | **UNCLEAR** — jacketed rows may not apply to 7×10" in trim matrix |
| Case laminate at 7×10" | Shown as supported in public matrix |
| ISBN/barcode | Supports non-distributable SKU — ISBN exemption for non-retail |
| Contact status | **NO RESPONSE** — one follow-up sent |
| Wave 1 status | PENDING — highest risk if jacket-capable 7×10" is unavailable |

**Critical question:** Is 7×10" available as case laminate ONLY, or does jacketed hardcover also apply at this trim?

---

### Blurb

| Field | Finding |
|---|---|
| Vendor type | Print-on-demand, consumer/creator books |
| 7×10" support | **NOT VIABLE** — closest option is 8×10" Standard Portrait |
| Binding | ImageWrap (different architecture from casebound) |
| Interior stock | Premium Matte 100# paper |
| Large Order Services | Available at 100+ books |
| Dust jacket | Supported |
| Contact status | **RESPONDED** |
| Wave 1 status | **REJECTED** — incompatible with locked 7×10" trim |

Do not use Blurb unless the 7×10" trim is explicitly reopened by product authority. Could be used as pricing benchmark for an 8×10" variant if ever created.

---

### Lulu

| Field | Finding |
|---|---|
| Vendor type | Print-on-demand, creator books |
| 7×10" hardcover support | Not yet confirmed — assumed available, unverified |
| Binding | Hardcover casewrap; hardcover linen with dust jacket |
| Cover finishes | Matte or glossy casewrap |
| POD capable | Yes — no minimum order stated publicly |
| ISBN/barcode | Not required for personal-use or limited-audience books |
| Contact status | **NO RESPONSE** |
| Wave 1 status | OPTIONAL BACKUP — follow up only if IngramSpark fails |

---

## Vendor comparison summary

| Vendor | 7×10" Hardcover | Casebound | Dust Jacket | MOQ | POD Capable | Multi-Volume | Priority | Status |
|---|---|---|---|---|---|---|---|---|
| PrintNinja | ✓ CONFIRMED | ✓ CONFIRMED | ✓ CONFIRMED | 250/title | NO | Separate titles | Tier 1 | VIABLE (batch only) |
| BookBaby | ✓ CONFIRMED | ✓ CONFIRMED | ✓ near all trims | Unknown | YES | SYSTEM LIMIT | Tier 2 | VIABLE W/ CONDITIONS |
| IngramSpark | ? shown | ✓ | ? unclear | Unknown | YES | Unknown | Tier 2 | PENDING |
| Blurb | ✗ (8×10 only) | ImageWrap | ✓ | Unknown | YES | Unknown | Fallback | REJECTED |
| Lulu | ? unconfirmed | ✓ casewrap | ✓ | None public | YES | Unknown | Tier 3 | PENDING |

---

## Manufacturing gate requirements (Message Book)

Must be confirmed before selling:
1. Trim and binding confirmed (7×10" hardcover casebound by chosen vendor)
2. Cover architecture confirmed (casewrap/case laminate/dust jacket options)
3. Interior stock confirmed (readable at premium text stock level, emoji rendering acceptable)
4. Page count rules confirmed (min/max, spine behavior, multi-volume split rules)
5. Proofing confirmed (hard proof or reliable digital proof + explicit approval)
6. No ISBN/barcode confirmed (for direct-to-customer non-retail)
7. Multi-volume operations confirmed (separate volumes producible + shippable + customer-safe)
8. Fulfillment model confirmed (POD vs batch vs preorder vs hybrid)

**Current gate status:** NOT LAUNCH-READY — manufacturability confirmed (PrintNinja), but NOT POD-ready for personalized/direct fulfillment.

---

## Secondary lane (Alibaba/Accio)

**Status:** DO NOT BROADEN YET — closed until Wave 1 responses are fully analyzed.

When secondary lane reopens:
- MOQ and pricing benchmarking only
- Finish option discovery (foil, cloth, ribbon, endsheets)
- Backup manufacturer discovery
- Do NOT use to reopen core product decisions (trim, binding, spec)
- Do NOT source mugs, stickers, wall art, gift wrap, acrylic blocks

---

## Vendor Gating Plan v3

Two distinct product groups must be tracked separately here. See `docs/strategy/product-format-bank.md` for full distinction.

**Physical first launch target (Owner-Approved Strategic Target):** Message Book, Framed Conversation Print, Mug, Mini Keepsake Notebook, Mini Message Sticker Pack, Fridge Magnet — each gated by its own readiness.

**Software ProductCatalog (Package 2 engine foundation):** Message Book, Journal, Mug, Sticker Pack, Wall Art, Gift Wrap — software capability layer, not the physical commerce catalog.

### Manufacturing readiness per product format:

| Product | In Software Catalog | In Physical Launch Target | Packaging Status | Manufacturing Status | Notes |
|---|---|---|---|---|---|
| Message Book | ✓ | ✓ | PackagingResearch | `planning` | Active vendor evaluation |
| Framed Conversation Print | — (legacy type) | ✓ PHYSICAL TARGET | NotPlanned | `not-started` | Separate print + framing vendor; own lane |
| Mug | ✓ | ✓ | NotPlanned | `not-applicable` | Separate sublimation vendor; DEFERRED until breakage tested |
| Mini Keepsake Notebook | — | ✓ PHYSICAL TARGET | NotPlanned | `not-started` | Separate notebook vendor; own lane |
| Mini Message Sticker Pack | ✓ (sticker-pack) | ✓ | NotPlanned | `not-applicable` | Separate digital press/sticker vendor |
| Fridge Magnet | — | ✓ PHYSICAL TARGET | NotPlanned | `not-started` | Separate print/digital vendor; own lane |
| Journal / Diary | ✓ | — | NotPlanned | `not-started` | Depends on Message Book vendor confirmed first |
| Wall Art | ✓ | — | NotPlanned | `not-applicable` | Separate lane — cannot share Message Book packaging |
| Gift Wrap | ✓ | — | NotPlanned | `not-applicable` | DEFERRED — separate product and fulfillment lane |
| Acrylic Block | — | — (future) | NotPlanned | `not-started` | Future premium product; separate premium packaging required |

---

## Packaging — Launch system

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/06 Production - Packaging, Bundling, and Gifting.md`

### 4-component system (LOCKED)

Every Message Book order uses this uniform system. Gift and self-purchase orders share the same physical packaging.

```
OUTER LAYER
  └─ Plain protective shipper (Kraft corrugated literature mailer — Uline S-16961 reference)
     └─ INNER LAYER
        ├─ Message Book (wrapped in tissue/soft paper)
        ├─ Privacy seal (on inner wrap — see options below)
        ├─ Single insert card
        └─ [OPTIONAL] Gift note (if feature enabled at checkout — GATED)
```

**Design philosophy:** Magic on the inside, discretion on the outside. Outer package is plain and unbranded. Inner reveal is intentional and premium.

### Component specifications

| Component | Spec | Vendor |
|---|---|---|
| Outer shipper | Plain corrugated book/literature/easy-fold mailer; unbranded; privacy-safe | Uline (stock, S-16961 reference) → Packlane (future custom) |
| Inner wrap | Tissue or soft paper wrap | noissue (branded) or generic |
| Privacy seal | See options below | Uline stock OR noissue branded |
| Insert card | Single card per order; no variants | Printing vendor TBD |

### Privacy seal options

**Option A (RECOMMENDED) — Inner Destructible Seal**
- Destructible tamper-resistant label applied to tissue/paper wrap
- Gives recipient deliberate "break to reveal" moment
- Tamper-evident on removal (void message shown)
- Cannot be resealed or reused
- Emotionally private tone, not security-heavy
- Vendor: Uline stock tamper-resistant/destructible labels

**Option B — Outer Flap Tamper-Evident Seal**
- Applied to outer flap of shipping carton
- Shows void message on removal
- More clinical feel than Option A
- Not recommended as primary seal

**Option C — Premium Branded Sticker Seal**
- Custom branded sticker on inner wrap
- Tamper-proof, cracks on removal
- More bespoke/branded feel
- Vendor: noissue custom tamper-proof sticker rolls
- Higher cost/lead time; future upgrade

### Insert card purpose

- Explains emotional purpose of KeepMees
- Can include privacy language, care note, or short branded message
- One card per order; no variants at launch

---

## Packaging vendors

| Vendor | Category | Assessment | Launch Ready | Notes |
|---|---|---|---|---|
| Uline | Stock shipper + seals | Practical, low-friction | YES | Book/literature mailers in stock; S-16961 reference; tamper labels available |
| Packlane | Custom packaging | Suitable for growth | NO (launch) | Custom mailer boxes; too expensive/high MOQ at launch |
| Packhelp | Rigid gift boxes | Premium only | NO (deferred) | €16.38/unit at 120-unit MOQ; future premium tier or PR box |
| noissue | Branded seals/tissue | Brand-forward option | OPTIONAL | Custom tamper-proof sticker rolls; higher cost/lead time |
| ShipBob | 3PL / kitting | Meets requirements | YES | Kitting, branded unboxing, gift notes, inventory infrastructure |
| ShipMonk | 3PL / kitting | Meets requirements | YES | Similar capabilities to ShipBob |

**3PL selection criteria (must support):**
- Branded unboxing
- Custom packaging
- Marketing inserts
- Gift notes
- Real inventory/reporting infrastructure

---

## Packaging — Software fields to plan

These fields should be designed in software now, though not all are required at launch:

| Field | Status | Purpose |
|---|---|---|
| `GiftNoteText` | PLAN NOW — GATED for launch | Gift note content |
| `GiftNoteEnabled` | PLAN NOW — GATED for launch | Feature toggle |
| `GiftNoteCharacterLimit` | PLAN NOW | Max characters |
| `GiftRecipientName` | PLAN NOW | Separates buyer from recipient |
| `GiftRecipientEmail` | PLAN NOW | Gift flow |
| `GiftRecipientShippingName` | PLAN NOW | Shipping label |
| `IsGiftOrder` | PLAN NOW | Boolean flag |
| `PackagingOptionId` | PLAN NOW — locked to 1 at launch | Future packaging upgrades |
| `PackagingOptionStatus` | PLAN NOW | Per-option readiness |
| `PrivacySealIncluded` | PLAN NOW | Boolean for inclusion in pack-out |
| `ProductPackagingReadinessStatus` | PLAN NOW — CRITICAL | Gates product formats by packaging readiness |

---

## PackagingReadinessStatus (8-value enum)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/06 Production - Packaging, Bundling, and Gifting.md`

```
NotPlanned              — not yet considered for this product
SoftwareSupportedOnly   — in software, not physically launched
PackagingResearch       — active vendor/design research phase
VendorIdentified        — packaging vendor selected
PrototypePackaging      — prototype being tested
FulfillmentTest         — fulfillment SOP being tested
ApprovedForPhysicalSale — cleared for commerce
Paused                  — on hold
```

**Status:** NEEDS COORDINATOR DECISION — proposed enum, not yet added to software. If approved, add to `src/products/product-statuses.js` or a dedicated packaging module.

**Core rule:** KeepMees can be broad in software, but narrow and controlled in physical packaging until each product format clears its own packaging gate.

---

## Packaging — What NOT to launch

Explicitly excluded from launch packaging scope:
- Rigid magnetic gift boxes (Packhelp — €16.38/unit, too expensive)
- Occasion-specific packaging variants (romantic, memorial, anniversary, etc.)
- Multiple physical packaging SKUs
- Ribbons, complex box inserts
- Handwritten-note operations
- Perishables, flowers, food, candles, fragrance (different vendor category, timing risk)
- Mug packaging (until drop-tested)
- Wall art packaging (separate lane)
- Acrylic block packaging (future premium product)
- Sticker pack packaging (unless bundled post-launch)

---

## Manufacturing constraints to capture when vendor is confirmed

| Item | Required |
|---|---|
| Maximum pages per volume | Hard vendor limit for pagination |
| Minimum pages per volume | Affects volume splitting |
| Accepted PDF spec | PDF/X-4, PDF/X-1a, or other |
| Color mode | CMYK vs RGB |
| Bleed and safe zone | Replaces provisional 0.125" values |
| Font embedding requirements | Affects PDF pipeline |
| Turnaround time (standard/rush) | Affects customer promise |
| File submission method | API, FTP, portal |
| Proof delivery method | Digital, physical, or both |

---

## Software impact when vendor is confirmed

| Software area | Impact |
|---|---|
| `paginateUnits` / volume splitting | Multi-volume split threshold becomes hard vendor limit (not estimate) |
| `captureBookRenderSpec` | Render spec format must match vendor file spec |
| PDF pipeline | Server architecture must produce vendor-compliant files |
| Preflight check registry | Some checks become runnable (page count, bleed, color) |
| `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` | Gate condition met; cover work unblocked |
| `message-book` `commerceReadinessStatus` | Update from `blocked` to `ready` (or `partial`) |

---

## LAYER 2 — Claude Advisory, Not Yet Coordinator Approved

### Advisory: Recommended next vendor steps

1. Send PrintNinja follow-up on printed case under jacket at 7×10"
2. Send BookBaby follow-up on multi-volume operations coordination
3. Chase IngramSpark for 7×10" hardcover/jacket configuration confirmation
4. Decide whether to send Lulu optional follow-up
5. Hold on Blurb unless 8×10" variant is explicitly approved
6. Wave 1B packaging outreach (Packlane + noissue) — separate from book vendor
7. ShipBob/ShipMonk kitting decision deferred until fulfillment model confirmed

### Advisory: Vendor response classification framework

When classifying incoming vendor responses:
- **Real manufacturing constraint** → affects design or development decisions
- **Vendor preference only** → one vendor's opinion, not law
- **Design implication** → what changes in the cover/interior design
- **Development implication** → what changes in the PDF pipeline or spec
- **Product implication** → what changes in the launch offering

### Advisory: Gift note launch decision needed

Gift notes are feasible now (ShipBob and ShipMonk both support it). The decision to include at launch vs. Phase 1.1 adds QA, moderation rules, fulfillment output specs, and character limit enforcement. Recommend deciding before packaging SOP is written.

### Advisory: Pack-out SOP needed before fulfillment commitment

A pack-out SOP and BOM (Bill of Materials) must be created before committing to a 3PL partner. Recommend testing 3 physical variants before committing:
1. Plain outer + inner seal
2. Plain outer + belly band
3. Plain outer + inner seal + gift note
