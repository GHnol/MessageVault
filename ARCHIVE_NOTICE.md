# ARCHIVE NOTICE

**Gate 0 founder approval date:** 2026-07-22
**Status:** Permanently feature-frozen
**Final prototype commit:** `f19a8a4` (2026-06-27)
**Former identity:** MessageVault (repository name), KeepMees (product name)

---

## Permanent feature freeze

This repository is closed to product development. No new features, no bug fixes, no refactors, no dependency upgrades, no architecture work. The freeze is permanent, not a pause. There is no condition under which development resumes here.

## Archive purpose

The repository is retained as **historical evidence** of the pre-reset KeepMees prototype: what was built, what was decided and why, what was tested, and how it failed founder-led real-data testing. It supports research, autopsy, and explicitly reviewed salvage. It serves no other function.

## Demolition boundary

Gate 0 approved **full product reconstitution**, not repair. The prototype is treated as demolished. The rebuilt KeepMees product starts from approved planning and design gates — product/brand, data/privacy, UX/design, architecture, master specification — not from this codebase.

The boundary is absolute in one direction: this repository may inform the rebuild, but it may not constrain it.

## No-automatic-port rule

**No source code, contract, schema, document, or decision transfers automatically.**

Salvage from this repository requires, per item:

1. Explicit identification of the item.
2. Evidence that it is correct and still applicable under the new product's approved specification.
3. Explicit founder approval to carry it forward.

Absent all three, an item stays here. Copying by convenience, by pattern-matching, or by "it already works" is not salvage.

## Retired authority

The following were authoritative in this repository and are **retired as active authority** for the rebuilt product:

- Message Book constraints — pagination constants, `BOOK_PAGINATION_VERSION`, composition rules, parity contracts, proof and print-proof contracts.
- Launch product tables and format/eligibility tables.
- Manufacturing assumptions — print specs, render environment, export pipeline, spine/stock/binding inputs, material evidence contracts.
- Vendor assumptions — vendor selection, capability, and confirmation state.
- Commerce and fulfillment assumptions — checkout readiness, order intent, packaging, gifting.
- Physical-product locks of every kind.

Manufacturing, vendors, commerce, and fulfillment are **parked** and stay outside the active roadmap until the digital platform is complete.

The KeepMees Design Bible (`docs/design/keepmees-design-bible.md`) is **reference material only**, not final design authority.

## Retained historical value

Genuinely valuable as history, and worth reading before rebuilding:

- The failure record and the reasoning that led to reconstitution.
- Platform export research and the fixture corpus.
- Local-first processing and product-neutral memory groups — retained as **concepts to re-derive**, not as implementations to port.
- The decision, risk, and vendor registers as a record of what was considered.
- Evidence of where documentation sprawl outgrew its usefulness.

## Restrictions on future changes

Permitted: archival metadata, historical-accuracy corrections, security redaction, and licensing clarification.

Not permitted: feature work, bug fixes, behavior changes, dependency changes, new architecture, and any change that would make this repository read as an active product.

## Approved future repository names

| Name | Purpose |
|---|---|
| `KeepMees-Prototype-Archive` | This repository, after rename. Frozen historical archive. |
| `KeepMees` | The new, clean, canonical product repository. Created separately, later, after the approved gates. |

No other repository name is approved.

## Historical reference vs. active product authority

**Historical reference** answers "what did we do, and what did we learn?" That is all this repository provides.

**Active product authority** answers "what must the product do, and how must it be built?" That authority lives exclusively in the new KeepMees repository and its approved gate documents.

Treating anything here as active authority is the specific failure mode this notice exists to prevent.

---

See `docs/archive/keepmees-gate-0-decision.md` for the twelve approved Gate 0 decisions.
