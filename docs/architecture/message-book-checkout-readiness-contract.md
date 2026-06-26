# Message Book Checkout Readiness Contract

**Status:** Active — introduced in Message Book Checkout Readiness 7A (Product Eligibility Gate + Readiness Matrix).
**Scope:** A local-first, deterministic **readiness decision** only. It is **not** checkout, payment, cart/order creation, manufacturing, vendor handoff, export, packaging, gifting, or shipping, and 7A added none of those. Certifying "checkout eligible" means a proof is *safe to proceed toward checkout later* — nothing is bought, charged, printed, produced, or sent.

---

## Why this exists

KeepMees is broader than Message Book; Message Book is the flagship first product, not the project boundary. A Message Book can be previewable and even proof-approved while still not being checkout-ready, and checkout readiness is itself separate from manufacturing, vendor, and production readiness. Before 7A there was no single tested answer to **"is this specific book's current proof safe enough to proceed toward checkout?"**

The existing `KMEngine.ProductExperienceReadiness` (4C) answers a different question: whether the **system**, in principle, supports a product **type**, derived from the **static render-spec gates**. Those static gates do not track the live proof-approval state of a particular book — message-book's static `proofSupported` gate is conservative even though proof review shipped in 5D/5E/6A. 7A is an **instance-level** gate that consumes the real proof/page-limit/preflight outputs instead, and is scoped specifically to Message Book.

## The readiness ladder

`evaluate(input)` returns a structured matrix. Each rung requires every rung below it:

| Level | Meaning | True when |
|---|---|---|
| `engine-supported` | The Message Book renderer exists | `engineSupported` (defaults true) |
| `previewable` | There is content to preview | engine-supported **and** `hasContent` |
| `proof-reviewable` | The proof can be reviewed | previewable **and** not over the page limit |
| `proof-approved-current` | The proof is approved for the current content | proof-reviewable **and** `approvalStatus === 'approved'` **and** not stale |
| `checkout-eligible` | Safe to proceed toward checkout later | proof-approved-current **and** no blocking preflight failure |

`furthestLevel` reports the highest rung reached. Higher gates beyond checkout — `manufacturingReady`, `vendorReady`, `productionReady`, `exportReady`, `packagingReady` — are **always `false`** with `gatedReason: 'not-implemented'`; they are separate downstream gates that have not started. The gate never sets them true.

## Checkout eligibility rules

`checkoutEligible` is **true only when all hold** (acceptance #3):

- content exists,
- the proof is reviewable,
- it is not over the page limit,
- the proof is approved,
- the approval is current (not stale),
- no blocking proof/preflight issue remains.

`checkoutEligible` is **false** whenever any of these is true (acceptance #2/#4): no content; over the page limit; proof pending review; proof stale; proof approval missing; proof approval bound to an old fingerprint; a blocking preflight check has failed; or the product is unsupported. The structural invariant `checkoutEligible === (blockers.length === 0)` is tested across the full input grid.

## The module — `KMEngine.MessageBookReadiness` (`src/products/message-book-readiness.js`)

Pure and dependency-free: no DOM, no clock, no randomness, no I/O, no network, no storage. It reads only already-computed facts and references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmbr1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `LEVEL` / `BLOCKER` — frozen enums of the ladder levels and the reason codes.
- `GATED_REASON` — `'not-implemented'`.
- `evaluate(input)` → the readiness matrix (see below).
- `isCheckoutEligible(input)` → boolean convenience.
- `blockerMessage(code)` → a short, safe, non-CTA label for a blocker code.
- `describeBoundary()` → a plain-language statement of what the gate decides and, emphatically, what it does **not** do (buy, charge, order, print, make, package, or ship).

### Input shape

All fields are already computed by the app from existing engine outputs; the gate stays free of app/DOM coupling:

| Field | Type | Producer |
|---|---|---|
| `hasContent` | boolean | the book has ≥1 included, readable message |
| `exceedsPageLimit` | boolean | `BookComposition.computePageLimitStatus(...)` / the 6A `vol.exceedsPageLimit` |
| `approvalStatus` | string | `ProofApprovalState.STATUS` of the proof record (`'none'` when no record) |
| `approvalStale` | boolean | `ProofApprovalState.isApprovalStale(record, currentFingerprint)` |
| `preflightBlockingFailures` | number | `ProductPreflight` report `blockingFailureCount` |
| `engineSupported` | boolean (optional) | defaults `true` (the Message Book renderer is shipped) |

### Output shape

```
{
  contractVersion: 'kmbr1',
  productTypeId:   'message-book',
  engineSupported, previewable, proofReviewable, proofApprovedCurrent, checkoutEligible,  // ladder booleans
  manufacturingReady: false, vendorReady: false, productionReady: false,
  exportReady: false, packagingReady: false, gatedReason: 'not-implemented',              // gated higher levels
  furthestLevel,        // highest LEVEL reached
  blockers,             // BLOCKER codes, priority order (most fundamental first)
  primaryBlocker,       // blockers[0] || null
  blockerMessages       // safe per-code labels, aligned 1:1 with blockers
}
```

### Blocker codes (priority order)

`engine-unsupported` → `no-content` → `over-page-limit` → one proof-status code (`proof-not-submitted` | `proof-pending-review` | `proof-changes-requested` | `proof-revoked` | `proof-approval-stale`) → `preflight-blocking-failure`. Exactly one proof-status blocker is ever emitted.

## Why "blocking" preflight failures, not "incomplete"

`ProductPreflight` distinguishes a check that **failed** (`blockingFailureCount`) from one whose **inputs are not yet available** (`notApplicableCount` → overall `incomplete`). Most manufacturing checks are structurally incomplete today because their inputs (asset manifests, stock specs, vendor confirmation) do not exist yet. Requiring a *complete* preflight would make checkout eligibility unreachable. So 7A blocks checkout only on an actual blocking **failure**; an incomplete preflight is the normal pre-manufacturing state. Full preflight completeness belongs to the separate, still-gated manufacturing readiness.

## Relationship to 5D / 5E / 6A / 6B / 6C (all intact)

- **5D** drives staleness: a proof-affecting edit changes `computeProofFingerprint`, `isApprovalStale` flips true, and the gate reports `proof-approval-stale` and withholds checkout. 7A adds no transition and no fingerprint change.
- **5E** proof-review UX and **6A** proof-preview/page-limit panel behavior are unchanged. 7A reads the same `exceedsPageLimit` signal but is an independent decision: notably, 6A intentionally leaves an `approved` phase reviewable on over-limit (5D handles a changed proof), whereas the 7A checkout gate blocks an over-limit approved proof unconditionally.
- **6B/6C** `BookComposition` is the source of the page count and `exceedsPageLimit` the gate consumes; its behavior is unchanged.

The cross-module consistency (`ProofApprovalState` → `ProofPreviewContract` → `BookComposition` → `MessageBookReadiness`) is locked by Suite 14 of `message-book-readiness-tests.mjs`.

## Wiring

7A is **engine + tests + docs only** — no `index.html` change, no UI, no `window.__km` bridge. `MessageBookReadiness` is available for a later UI/status package to consume; this package adds no checkout button and changes no browser rendering, consistent with the engine-only package precedent (P1/P5A/P5B). The module source is kept free of commerce/production action verbs and side effects (its own source-scan test).
