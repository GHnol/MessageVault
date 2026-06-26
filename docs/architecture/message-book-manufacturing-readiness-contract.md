# Message Book Manufacturing / Production Readiness Contract

**Status:** Active — introduced in Message Book Manufacturing Readiness 8A (Print Production Boundary + Readiness Matrix).
**Scope:** A local-first, deterministic **readiness boundary and blocker matrix** — only. It is **not** print-file generation, export generation, vendor selection, manufacturing submission, packaging, shipping, checkout, payment, cart/order creation, or order submission, and 8A added none of those. It defines *what must be true* before a Message Book could ever become print-production / export / vendor / manufacturing ready **later**, and reports how far the book is from each step with safe blocker codes. Every downstream production capability is **not implemented** and therefore reported **false**.

---

## Why this exists

KeepMees is broader than Message Book; Message Book is the flagship first product. A Message Book can be proof-approved and even locally marked to continue toward checkout while still being nowhere near production-ready. Before 8A there was no single tested answer to **"what production requirements are still missing for this book?"** — the higher-than-checkout gates (`manufacturingReady`, `vendorReady`, etc.) existed only as opaque `false` stubs on the 7A/7D results, with no explanation of *why* or *what would change them*.

8A fills exactly that gap. It does **not** duplicate the lower layers:

- It does not recompute proof approval (5D/5E), page-limit/composition (6B/6C), the proof-preview phase (6A), checkout eligibility (7A/7B), or order intent (7D/7E).
- It **consumes their results** (a 7A readiness result's `checkoutEligible`; a 7D/7E intent view's `active`) and adds the production-capability gating that did not exist anywhere.
- The print-production *checks* already modelled in `ProductPreflight` (font availability, spine width, safe-area, etc.) remain that module's concern; most are structurally `not-applicable` today because their inputs (stock spec, cover spec, asset manifest) do not exist. 8A is the higher boundary that says those production inputs are **not implemented yet** and names that as a blocker, rather than re-running the checks.

## The four layers are distinct

This is the core product truth 8A locks in. `describeBoundary().distinctFrom` states it in the module, and the integration suite proves it end-to-end:

| Layer | Question | Module |
|---|---|---|
| Proof approval (5D/5E) | Is the proof content signed off on this device? | `ProofApprovalState` / `ProofApprovalUX` |
| Checkout eligibility (7A/7B) | Is the proof safe to proceed toward checkout later? | `MessageBookReadiness` |
| Local order intent (7D/7E) | Has the user saved a local, non-transactional note to continue later? | `MessageBookOrderIntent` |
| **Production readiness (8A)** | **Are the print-spec / export / vendor / manufacturing / packaging requirements met?** | **`MessageBookManufacturingReadiness`** |

A proof can be approved (5D), checkout-eligible (7A), and locally marked to continue (7D/7E) and still be **production-blocked** at 8A — because no print spec is selected, no export pipeline exists, and no vendor is confirmed.

## The readiness ladder

`evaluate(input)` returns a structured matrix. Each rung requires every rung below it:

| Level | Meaning | True when |
|---|---|---|
| `production-boundary-known` | The boundary itself is defined (the floor) | always — this module defines it |
| `export-spec-known` | The book + a print/export spec are ready to export | checkout-eligible **and** local intent (when required) **and** a print spec is selected |
| `print-file-ready` | A print file could be produced | export-spec-known **and** the export pipeline is implemented |
| `vendor-ready` | A vendor could receive the file | print-file-ready **and** a vendor is confirmed |
| `manufacturing-ready` | The book could be manufactured | vendor-ready **and** manufacturing is implemented |
| `packaging-ready` | The book could be packaged | manufacturing-ready **and** packaging is implemented |

`furthestLevel` reports the highest rung reached. In the live app every rung above the floor is **false**, because the repo's genuine production capability (`CAPABILITIES`) is all-false. The full-readiness invariant `packagingReady === (blockers.length === 0)` is swept across the entire 128-row input grid.

## Blocker codes (priority order)

`checkout-not-eligible` → `no-local-intent` → `print-spec-not-selected` → `export-pipeline-not-implemented` → `vendor-not-selected` → `manufacturing-not-implemented` → `packaging-not-implemented`.

`blockers` is collected most-fundamental-first; `primaryBlocker = blockers[0] || null`; `blockerMessages` are safe, non-CTA, non-private labels aligned 1:1 with `blockers`. Each code maps to exactly the requirement whose absence withholds the next rung, so the first blocker determines `furthestLevel`.

## The module — `KMEngine.MessageBookManufacturingReadiness` (`src/products/message-book-manufacturing-readiness.js`)

Fully pure and dependency-free: no DOM, no clock, no `Date`, no randomness, no I/O, no network, no storage, **no record builders**. It reads only already-decided facts and references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmmr1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `LEVEL` / `BLOCKER` / `STATUS_TONE` — frozen enums.
- `GATED_REASON` — `'not-implemented'`.
- `CAPABILITIES` — frozen record of the repo's **current genuine** production capability; **every flag is `false`** (no selected print spec, no export pipeline, no confirmed vendor, no manufacturing, no packaging). The static `7x10 hardcover` design note and the "IngramSpark vendor confirmation pending" note in `ProductRenderSpecs` are **not** a selected machine spec or a confirmed vendor, so they flip no flag.
- `LOCAL_INTENT_REQUIRED` — `true`. Policy: a local order intent (7D/7E) is required before production readiness can begin; checkout eligibility alone is not enough. `evaluate` honors an optional per-call `requireLocalIntent` override so both branches are explicit and testable.
- `evaluate(input)` → the readiness matrix.
- `blockerMessage(code)` → a short, safe, non-CTA label.
- `describeReadiness(result)` → a display view-model `{ tone, headline, detail, blocker }`. `STATUS_TONE.GATED` for any unmet result (the normal, live state); `STATUS_TONE.READY` only for an all-implemented result (unreachable until the repo implements every step).
- `resolveFromReadiness({ readiness, intent, capabilities?, requireLocalIntent? })` → `{ input, result, display }`. The live bridge: maps a 7A `MessageBookReadiness` result (`checkoutEligible`) and a 7D/7E `MessageBookOrderIntent` resolve view (`active`) plus `CAPABILITIES` (default) into the `evaluate` input. Because `CAPABILITIES` is all-false, it **guarantees** every production rung stays false in the live app.
- `describeBoundary()` → a plain-language statement of what the boundary decides, what it is **distinct from** (proof approval / checkout eligibility / local order intent), the separate gates, the not-implemented steps, and — emphatically — that it generates no print/export file, builds no vendor packet or shipping label, selects no vendor, and begins no manufacturing, packaging, or shipping.

### Input shape

| Field | Type | Producer |
|---|---|---|
| `checkoutEligible` | boolean | the 7A/7B `MessageBookReadiness` result's `checkoutEligible` |
| `hasLocalIntent` | boolean | the 7D/7E `MessageBookOrderIntent` resolve view's `active` |
| `requireLocalIntent` | boolean (optional) | defaults to `LOCAL_INTENT_REQUIRED` (`true`) |
| `printSpecSelected` | boolean | `CAPABILITIES.printSpecSelected` (currently `false`) |
| `exportPipelineImplemented` | boolean | `CAPABILITIES.exportPipelineImplemented` (currently `false`) |
| `vendorSelected` | boolean | `CAPABILITIES.vendorSelected` (currently `false`) |
| `manufacturingImplemented` | boolean | `CAPABILITIES.manufacturingImplemented` (currently `false`) |
| `packagingImplemented` | boolean | `CAPABILITIES.packagingImplemented` (currently `false`) |

### Output shape

```
{
  contractVersion: 'kmmr1',
  productTypeId:   'message-book',
  productionBoundaryKnown, exportSpecKnown, printFileReady,
  vendorReady, manufacturingReady, packagingReady,   // ladder booleans
  requireLocalIntent,                                 // policy actually applied
  gatedReason: 'not-implemented',
  furthestLevel,                                      // highest LEVEL reached
  blockers,                                           // BLOCKER codes, priority order
  primaryBlocker,                                     // blockers[0] || null
  blockerMessages                                     // safe per-code labels, 1:1 with blockers
}
```

## Relationship to the existing layers (all intact)

8A is **engine + tests + docs only** — no `index.html`/UI, no `window.__km` bridge (mirroring the 7A/7D engine-only split; a later package could add a read-only status hook as 7B did for 7A). It changes none of the lower modules:

- **5D/5E/6A/6B/6C** — proof fingerprint/staleness, proof-review UX, proof-preview phase, page composition, and unit generation are untouched. Staleness still flows through `checkoutEligible`, so a stale proof re-blocks production at `checkout-not-eligible` (integration suite).
- **7A/7B** — `MessageBookReadiness` remains the source of truth for checkout eligibility; 8A consumes its result and never re-derives it.
- **7C** — the static `ProductRenderSpecs` / `ProductExperienceReadiness` capability alignment is unchanged; `commerceSupported` / `manufacturingSupported` / `publicClaimSupported` stay `false`.
- **7D/7E** — `MessageBookOrderIntent` is unchanged; 8A reads its resolve view's `active` flag.

## What 8A does not do

No print-file generation, no export/PDF generation, no vendor selection or integration, no manufacturing/packaging/shipping behavior, no checkout, payment, cart, real order, or order submission, no address collection, shipping, tax, price, or line-item behavior, no dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI. The module's own source-scan test keeps it free of commerce/production action verbs and side effects (including any `Date`/clock — it is fully pure). Every downstream capability remains `false` until the repo genuinely implements it, at which point the corresponding `CAPABILITIES` flag (and only that flag) would flip.
