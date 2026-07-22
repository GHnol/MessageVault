# KeepMees — Gate 0 Decision Record

**Founder approval date:** 2026-07-22
**Scope:** Disposition of the pre-reset KeepMees prototype (developed under the repository name MessageVault) and the terms of the product rebuild.
**Status:** Approved. Binding on this repository and on the rebuilt product.

This record preserves the twelve approved Gate 0 decisions. It is the authoritative record of *why* this repository is archived.

---

## The twelve approved decisions

### 1. Full product reconstitution rather than incremental repair

The prototype failed founder-led real-data testing across import fidelity, identity, media, statistics, state, curation, UX, design, and product direction. The failures are foundational, not local. KeepMees is rebuilt from an approved specification rather than repaired in place.

### 2. Permanent feature freeze of the current repository

The prototype repository is closed to product development permanently. No features, no fixes, no refactors. The freeze has no expiry and no resumption condition.

### 3. Rename the current GitHub repository and local folder to KeepMees-Prototype-Archive

The repository's identity changes to reflect what it is. `GHnol/MessageVault` becomes `GHnol/KeepMees-Prototype-Archive`, and the local working folder is renamed to match.

### 4. Create a clean canonical KeepMees repository only after later planning/design gates

The new repository is created only after the product/brand, data/privacy, UX/design, architecture, and master-specification gates are approved. It is not created early, and it is not seeded from this repository.

### 5. Retire book constraints, launch product tables, vendor assumptions, and manufacturing locks as active authority

Message Book constraints, pagination and composition locks, launch product and format tables, vendor assumptions, and manufacturing locks lose active authority. They remain readable history. Any equivalent in the rebuilt product must be established fresh.

### 6. Treat the current Design Bible as reference material, not final authority

`docs/design/keepmees-design-bible.md` records design thinking worth reading. It is not the design authority for the rebuilt product. Final design authority is established at the UX/design gate.

### 7. Retain local-first processing and product-neutral memory groups as concepts to re-derive

Two ideas survive as *concepts*, not as code or contracts: local-first processing of the user's data, and product-neutral memory groups. Both must be re-derived and re-specified in the rebuild. Neither ports as an implementation.

### 8. Require complete export packages and known-answer fixtures before claiming platform support

No platform may be claimed as supported without a complete real export package and known-answer fixtures proving correct handling. Partial or inferred support is not support. This directly addresses the import-fidelity and identity failures.

### 9. Port no source code automatically

No source file transfers to the new repository by default. Salvage is per-item, evidence-backed, and explicitly approved. Convenience is not a justification.

### 10. Replace documentation sprawl with a smaller authoritative system in the rebuilt product

The prototype's documentation outgrew its usefulness and diluted authority across too many files. The rebuilt product uses a small set of genuinely authoritative documents.

### 11. Keep manufacturing, vendors, commerce, and fulfillment outside the active roadmap until the digital platform is complete

Physical product, vendors, commerce, and fulfillment are parked. They re-enter the roadmap only once the digital platform is complete. Building toward manufacturing before the digital product worked was a material misallocation in the prototype.

### 12. Require founder approval at every phase gate and complete vertical slice

Work advances only through founder approval at each phase gate and at each complete vertical slice. No phase self-certifies, and no slice is considered done without approval.

---

## Consequences for this repository

- It is historical evidence and a salvage source only.
- Nothing in it is automatically authoritative for the rebuilt KeepMees product.
- See `ARCHIVE_NOTICE.md` for the freeze terms and permitted future changes.
- See `README.md` for the archive summary.

## Naming

**KeepMees** is the product name. **MessageVault** refers only to the former prototype/repository identity and is not used for the rebuilt product.
