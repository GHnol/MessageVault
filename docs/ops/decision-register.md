# Decision Register — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** Active

---

## How to read this document

Each entry is a decision that was made and is now locked or governing. Decisions are **not** reversed here — use a new entry to supersede an old one, leaving the old one intact with a "superseded by" note.

Format: **Decision** → **Rationale** → **Status** → **Constraints it creates**

---

## Product decisions

### DEC-P-01 — Message Book is the flagship product

**Decision:** Message Book (casebound hardcover, 7×10") is the sole launch-ready physical product. All other catalog entries are product-line-supported stubs only.
**Rationale:** Focus is required to reach manufacturing readiness. Multi-product launch creates unsustainable scope.
**Status:** Locked
**Constraints:** All software effort prioritizes Message Book. Other products must not receive renderer or commerce work ahead of Message Book reaching manufacturing readiness.

---

### DEC-P-02 — Physical book trim is 7×10"

**Decision:** 7×10" trim size.
**Rationale:** Standard trade book size. Works with most print-on-demand vendors. Comfortable for extended reading.
**Status:** Locked
**Constraints:** All pagination constants and page layout decisions assume 7×10". Changing trim requires re-deriving `BOOK_PAGE_LINES` and bumping `BOOK_PAGINATION_VERSION`.

---

### DEC-P-03 — Binding is casebound hardcover at launch

**Decision:** Casebound hardcover only at launch. No softcover or spiral-bound option.
**Rationale:** Positioning as a premium keepsake. Hardcover conveys permanence and value.
**Status:** Locked
**Constraints:** Vendor selection must support casebound hardcover. Softcover as a future option is not off the table but is not in scope.

---

### DEC-P-04 — Multi-volume model is separate physical books in one order

**Decision:** When a conversation exceeds one book's page capacity, it produces separate physical books (volumes), all in one order.
**Rationale:** Binding a single super-thick volume is not commercially viable with standard print-on-demand vendors. Separate books preserve physical quality.
**Status:** Locked
**Constraints:** Multi-volume splitting logic in the paginator is estimative, not final. Final split points will be re-evaluated against actual vendor page limits.

---

### DEC-P-05 — No ISBN or barcode at launch

**Decision:** Books will not carry an ISBN or retail barcode at launch.
**Rationale:** KeepMees books are personal keepsakes, not retail products. ISBNs are not required and add operational overhead.
**Status:** Locked

---

### DEC-P-06 — PDF generation is server-side only

**Decision:** When PDF generation is implemented, it must be server-side. In-browser PDF libraries are excluded.
**Rationale:** Print-quality PDF/X-4-friendly output requires font embedding and color management that in-browser libraries cannot deliver.
**Status:** Locked
**Constraints:** No checkout or delivery flow can be completed until a server PDF pipeline exists.

---

### DEC-P-07 — Parity padding is system-owned

**Decision:** Parity padding (ensuring even page count for binding) is managed by `BOOK_PARITY`. Customers cannot control or remove padding pages.
**Rationale:** Improper page count creates binding defects. This must be invisible to the customer.
**Status:** Locked
**Constraints:** `BOOK_PARITY.MODULUS = 2`. `paddingNeeded()` must be called before any render spec is captured.

---

## Architecture decisions

### DEC-A-01 — Single-file app (index.html)

See `docs/architecture/adr-001-app-architecture-path.md`.

---

### DEC-A-02 — KMEngine namespace for all engine modules

**Decision:** All engine logic exports into `window.KMEngine` via IIFE. No global pollution. No ES module-only design for in-browser code.
**Rationale:** Allows the same source files to be loaded in-browser (window.KMEngine) and in Node.js tests (without a DOM). Avoids any build step.
**Status:** Locked for current architecture phase.
**Constraints:** New engine modules must follow the IIFE + KMEngine pattern. Test files use `.mjs` and directly import the relevant source file.

---

### DEC-A-03 — Deterministic pagination; version-gated changes

**Decision:** `BOOK_PAGINATION_VERSION` must be bumped whenever pagination logic changes which page a message lands on.
**Rationale:** Saved sessions reference page assignments. An unexpected layout change for a saved book is a data integrity failure.
**Status:** Locked
**Constraints:** Any change to `BOOK_PAGE_LINES`, `BOOK_HEADER_LINES`, `BOOK_DIVIDER_LINES`, or the paginator algorithm triggers a version bump and requires a migration note.

---

## Operational decisions

### DEC-O-01 — AI development relay model

**Decision:** Development uses a Coordinator + Operator + Executor model with package-scoped work units. No work proceeds outside a defined package unless explicitly authorized.
**Rationale:** Maintains control over scope, quality, and context across AI-assisted sessions.
**Status:** Active
**Constraints:** See `docs/ops/stream-sync-protocol.md`.

---

### DEC-O-02 — Scope guard on production constants

**Decision:** The following are explicitly off-limits without package-level authorization: `BOOK_PAGE_LINES`, `BOOK_HEADER_LINES`, `BOOK_DIVIDER_LINES`, `BOOK_FEATURED_HEADER_LINES`, `BOOK_CONTINUATION_LINES`, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`, standalone keepsake flows, Review view.
**Rationale:** These constants and flows are stable production decisions. Accidental changes introduce hard-to-detect regressions.
**Status:** Locked

---

## Visual design decisions

These decisions were locked through the Coordinator + Product design stream. Source: `_source-intake/keepmees-consolidation-2026-05-09/01 Control - Coordinator.md`.

### DEC-V-01 — Typography roles

**Decision:** Serif for display/headlines; sans-serif for messages and UI-derived content. Typography supports rhythm; spacing leads. Titles never oversized.
**Status:** Locked
**Constraints:** All future UI, page masters, and Figma work must respect these roles. Do not mix roles.

---

### DEC-V-02 — Bubble system fidelity

**Decision:** 90% faithful to iMessage visual, 10% refined. True left/right alignment. Softened color philosophy. Subtle same-sender continuity indicator. Reactions are corner-anchored and attached to bubble.
**Status:** Locked
**Constraints:** Reactions must be rendered and visible, not dropped. Bubble fidelity is a core competitive differentiator.

---

### DEC-V-03 — Divider visual system

**Decision:** Soft dividers: whitespace-led, no lines or ornaments by default. Section dividers: minimal serif + spacing, not full title pages. Featured moments: emphasis through spacing and composition — NOT labeled, NOT decorative. Frequency: sparse and intentional. System: spacing-first, typography-second. Any date/context text in soft dividers is optional and only used when meaningful.
**Status:** Locked
**Constraints:** Divider and featured-moment treatments must stay clearly distinct. Transition ≠ emphasis.

---

### DEC-V-04 — Cover system

**Decision:** Default cover is names-led (relational identity, e.g. "Nathaniel & [Name]"). Typography-led, minimal. No message bubbles on cover as default. KeepMees brand appears as "quiet maker's mark" on spine or back — never front-dominant. Colors: neutral premium (soft blue, warm off-white, muted gray, deep navy). No loud colors, no gradients.
**Status:** Locked
**Constraints:** Names-driven is the flagship default cover. Optional customization (title, date range, short line) can support it, but should not overpower it. Cover expressive variants are future expansion, not launch scope.

---

### DEC-V-05 — Visual priority ladder

**Decision:** Five-context visual priority system is locked:
- Cover: names → supporting info → material/space
- Opening spread: emotional framing → typography tone → subtle structure (opening line optional)
- Normal page: message bubbles → flow → reactions → metadata
- Featured moment page: the moment → space → structure (minimal; no labels)
- Final page: last emotional impression → space → optional subtle close (user choice first; subtle branded ending allowed as fallback)

Global rules: content over structure over metadata; emotion over decoration; whitespace guides attention; hierarchy is stable across variation.
**Status:** Locked
**Constraints:** Nothing should compete unnecessarily with messages. Metadata must not dominate over conversation content.

---

### DEC-V-06 — Render toolchain

**Decision:** Three-layer render stack:
1. Figma — visual master for material design system (page masters, components, tokens)
2. KeepMees preview — composition/behavior truth for personalized page flow
3. ChatGPT Images — premium hero/marketing renders only (derives from Figma-approved layouts)

Rule: If Figma and Preview disagree on dynamic composition behavior, Preview wins. ChatGPT Images comes after Figma is approved.
**Status:** Locked
**Constraints:** Figma is the design master. The engine is the dynamic composition authority. Image renders are not composition authority.

---

### DEC-V-07 — Launch fidelity position

**Decision:** North star remains 1:1 exact print fidelity. Practical near-term launch requirement is composition-faithful and visually very close — not yet guaranteed line-for-line manufacturing identity. Layout structure, spacing rhythm, and bubble rendering must match the Figma master. Exact line breaks and exact pagination edges may still differ slightly at launch.
**Status:** Locked
**Constraints:** Do not start measurement-engine overhaul or broad visual redesign in the editorial validation pass. Exact pixel-perfect page treatment is a future milestone.

---

## Product identity decisions

### DEC-ID-01 — KeepMees is a product system, not a Message Book synonym

**Decision:** KeepMees is the overall brand and product-system engine. Message Book is one KeepMees offering — the flagship, but not the boundary. The product family is designed to expand across book, merchandise, decor, and packaging categories.
**Rationale:** Early development conflated KeepMees with Message Book. This was explicitly corrected by the Coordinator. Keeping the distinction clear prevents future products from inheriting Message Book assumptions unintentionally.
**Status:** Locked
**Constraints:** All code, docs, and product language must preserve this distinction. `KMEngine` is the umbrella; Message Book is one mode.

---

### DEC-ID-02 — "Premium" means accessible quality, not luxury exclusivity

**Decision:** KeepMees products should feel thoughtful, creative, emotionally resonant, well-designed, well-made, and giftable. Broadly accessible, not only heirloom-priced. Tasteful and non-tacky — not "custom merch" energy.
**Rationale:** An early vendor/product stream (Accio prompt) drifted toward luxury archival objects. This was explicitly corrected by the Coordinator.
**Status:** Locked
**Constraints:** Pricing strategy, manufacturing choices, and product design should all balance emotional logic with accessibility.

---

## Additional locked visual decisions (from full source read)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/05 Production - Mockups and Vendor Strategy.md` and `01 Control - Coordinator.md`

### DEC-V-08 — Reaction badge placement (critical rule)

**Decision:** Reaction badges are placed at the upper outer shoulder of the bubble, slightly overlapping as a small attached badge. Left message → reaction at top-right. Right message → reaction at top-left. Max 1 reaction per message. Never floating, never centered inside bubble, never dominant. Emojis inside messages remain untouched — reaction badge is always separate from message content.
**Status:** Locked
**Constraints:** This is a visual fidelity rule and a competitive differentiator. It must be preserved in all rendering, Figma components, and code implementation.

---

### DEC-V-09 — 3-tier spacing system

**Decision:** Three spacing tiers govern conversation layout: Tight (4–8px) between same-sender stacked messages; Medium (12–16px) between sender switches; Wide (24–32px) between conversation sections or emotional beats.
**Status:** Locked
**Constraints:** These tier values are locked at the principle level. Exact pixel values are to be confirmed in Figma. No single spacing value should be applied uniformly across all these contexts.

---

### DEC-V-10 — Visual style (C Hybrid)

**Decision:** KeepMees visual style is "C Hybrid" — clean + emotional + slightly textured. NOT ultra-minimal (too sterile). NOT warm + editorial (risks Pinterest aesthetic). The balance point is premium, emotional, and modern.
**Status:** Locked
**Constraints:** Figma execution must maintain this balance. Designs that feel sterile, over-decorated, or Pinterest-adjacent are not acceptable.

---

### DEC-V-11 — Paper stock direction

**Decision:** Interior stock is middle-ground matte/premium text stock at launch. NOT uncoated warm (too absorbent). NOT slick coated (too harsh for reading). Warm enough to feel like a real keepsake; clean enough for message UI; less harsh than coated; less absorbent than uncoated.
**Status:** Locked
**Constraints:** Vendor selection must support this stock direction. Do not reopen toward glossy or standard coated stock.

---

## Additional product decisions (from full source read)

### DEC-P-08 — Physical first launch target

**Decision:** The current owner-approved physical first launch target is: Hero (Message Book, Framed Conversation Print); Core (Mug, Mini Keepsake Notebook); Add-on (Mini Message Sticker Pack, Fridge Magnet). Phone cases, blankets, pillows, planners, acrylic blocks, and bags are explicitly NOT included at launch.
**Rationale:** Too many products at launch creates inconsistency and dilutes brand clarity. Each of the six is emotionally coherent and manufacturably distinct.
**Status:** OWNER-APPROVED STRATEGIC TARGET — physical readiness gated per SKU
**Constraints:** This is the strategic physical target, not a declaration of manufacturing, commerce, or public-claim readiness for any individual SKU. Each SKU clears its own render/proof, vendor, packaging, pricing, fulfillment, and public-claim gates. Do not expand the physical launch set without explicit product authority. Software may support additional formats (stubs) without requiring physical launch. This set is distinct from the Package 2 software ProductCatalog (which has a different product mix).

---

### DEC-P-09 — Proof approval is an in-app explicit action

**Decision:** In-app proof review with explicit customer accept action is the primary and locked proof flow. Downloadable proof is a secondary supporting option only. Manufacturing only proceeds after in-app review and explicit customer approval.
**Status:** Locked
**Constraints:** Do not implement a checkout flow that bypasses proof approval. Proof approval must be a recorded, explicit action.

---

### DEC-P-10 — Provisional manufacturing dimensions

**Decision:** The following are provisional planning defaults (safe to use, but must be confirmed per vendor): Bleed 0.125" universal floor; Safe area 0.125" inside trim; Inner margin 0.875"; Outer margin 0.75"; Top/bottom margins 0.75".
**Status:** PROVISIONAL (not locked — confirm per vendor)
**Constraints:** Do not treat these as final. When vendor is confirmed, update this entry with actual confirmed values.
