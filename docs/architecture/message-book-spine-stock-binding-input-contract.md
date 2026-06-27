# Message Book Spine / Stock / Binding Input Contract

**Status:** Active — introduced in Message Book Manufacturing Readiness 8H (Spine / Stock / Binding Input Contract + Render Environment Feed). Wired read-only into the live 8F/8G export-preflight feed.
**Scope:** A local-first, deterministic, **artifact-free spine / stock / binding material-input-availability contract** — only. It is **not** vendor selection, vendor confirmation, spine rendering, cover generation, print-file generation, export/PDF generation, file writing, vendor packet creation, manufacturing, packaging, shipping, checkout, payment, cart/order creation, or order submission, and 8H added none of those. It models *which spine / stock / binding / material facts must be known* before a spine width can be computed and a cover can be unblocked, reports each as present or explicitly missing, and **only reports spine width computable (and the cover unblocked) when every required material input is genuinely present**. It produces no file and renders nothing.

---

## Why this exists

8G (`MessageBookRenderEnvironment`) lists `spine-known` and `cover-known` among its required render-environment inputs, but treats them as opaque booleans (`spineWidthKnown`, the cover gate). The live 8F/8G feed fed those as hardcoded `false` / blocked. Neither said **which** spine / stock / binding facts are known versus missing, nor why the spine width cannot yet be computed.

8H attacks that opacity **honestly**, without selecting a vendor or generating anything. It adds a **lower-level, artifact-free contract** that:

- declares the spine pipeline's **material inputs** — internal stock direction, vendor stock confirmation, internal binding direction, vendor binding confirmation, paper thickness, board thickness, confirmed page count, the derived spine-width computability, and the derived cover unblock;
- derives each input **present or explicitly missing** from already-decided repo truth, with safe blocker codes;
- computes the spine width **only when** every required physical input (paper thickness, board thickness, page count) is genuinely present;
- unblocks the cover **only when** the cover gate is open **and** stock + binding are vendor-confirmed **and** the spine width is computable (mirrors 8G `_coverKnown`);
- feeds those two honest facts into 8G's existing `productionDependencies` input path — so the render environment blocks honestly while any material fact is missing, and advances automatically only when all are genuinely known.

The honesty determination: **the spine width is not computable today** and **the cover is still blocked** because the vendor stock/binding confirmations and the vendor-supplied paper/board thickness are genuinely missing. 8H does **not** force the render environment past `spine-missing`; it explains *why* it is blocked.

## The honesty determination — nothing is forced true

The goal is **not** to advance the render environment. It is to identify which spine / stock / binding facts are genuinely available versus still missing. Spine width is reported computable **only** when all required physical inputs are actually present, deterministic, and tested.

| Input | Source of truth | Live state |
|---|---|---|
| `internal-stock-direction-known` | `BOOK_PRODUCTION_DEPS.STOCK` (index.html, scope-guarded) — `matte-premium-text` | **known** (provisional launch direction) |
| `internal-binding-direction-known` | `BOOK_PRODUCTION_DEPS.BINDING` (index.html, scope-guarded) — `casebound-hardcover` | **known** (locked direction) |
| `page-count-known` | captured `BookRenderSpec.productionDependencies.interiorPageCountConfirmed` (6B/6C) | **known** (real paginator page count) |
| `stock-confirmed` | captured production dependency `stockConfirmed` (vendor-supplied) | **missing** (`false`) |
| `binding-confirmed` | captured production dependency `bindingConfirmed` (vendor-supplied) | **missing** (`false`) |
| `paper-thickness-known` | vendor-supplied paper caliper — not in repo truth | **missing** |
| `board-thickness-known` | vendor-supplied cover board — not in repo truth | **missing** |
| `spine-width-computable` | derived: paper + board thickness + page count all present | **missing** (thicknesses absent) |
| `cover-unblocked` | derived: cover gate open + stock + binding confirmed + spine computable | **missing** (blocked/unconfirmed) |

Because the vendor confirmations and the paper/board thickness are genuinely missing, **spine width is not computable** and **the cover stays blocked**. The internal stock/binding *direction* and the page count that *are* present in repo truth are reported known — but a known direction is not a vendor confirmation, and knowing them is not the aggregate.

These facts are deterministic repo truth, not invented:
- The internal stock/binding **direction** lives in `BOOK_PRODUCTION_DEPS.STOCK` / `.BINDING` (scope-guarded; pointed at, never duplicated or modified). It is a provisional/locked launch *direction*, explicitly **not** vendor-confirmed (the `BOOK_PRODUCTION_DEPS` header notes it is "provisional for planning — not vendor-confirmed"; `ProductRenderSpec` records `manufacturingReadinessNotes: 'IngramSpark vendor confirmation pending'`).
- The vendor confirmations mirror the captured `productionDependencies` (`stockConfirmed: false`, `bindingConfirmed: false`).
- The spine comment in `BOOK_PRODUCTION_DEPS` states spine width = `(pageCount × paperThicknessPerLeaf) + boardThickness — vendor-supplied`; those thicknesses are not in repo truth, so the spine width is not computable.

## Internal direction is distinct from vendor confirmation

The contract **separates** a known internal *direction* from a vendor *confirmation*. A known direction (`matte-premium-text`, `casebound-hardcover`) produces **no blocker** — but it does **not** confirm stock or binding. The blocking facts are the vendor confirmations, the physical thicknesses, the page count, and the two derived gates. This separation is enforced by the tests: dropping a known internal direction keeps the aggregate true; dropping a vendor confirmation or a thickness blocks it.

## The layers are distinct

| Layer | Question | Module |
|---|---|---|
| **Spine / stock / binding inputs (8H)** | **Which material facts are known, and can the spine width be computed / cover be unblocked?** | **`MessageBookSpineInputs`** |
| Render-environment inputs (8G) | Which render-environment facts are known once spine + cover are known? | `MessageBookRenderEnvironment` (aggregate still false) |
| Product preflight checks | Do the render checks pass once rendered outputs exist? | `ProductPreflight` (needs `stockSpec` / `coverSpec` / rendered inputs) |
| Export-pipeline preflight (8E) | What must the export pipeline know — and which inputs are present? | `MessageBookExportPipeline` |
| Artifact generation (separate) | Could a print/export file actually be produced? | Not implemented |
| Production readiness (8A/8B) | Is the full manufacturing ladder above checkout met? | `MessageBookManufacturingReadiness` |

8H sits **below** 8G: 8G consumes the spine/cover facts that 8H computes. 8H also sits **below** `ProductPreflight`, whose `SPINE_WIDTH_KNOWN` check ("Spine width computed from confirmed page count and stock spec", requires `stockSpec`) and `COVER_INTERIOR_CONSISTENCY` check need a stock/cover spec the live app does not compute. 8H answers the prior question — *are the inputs those checks need even known yet?* — and is not a duplicate.

Stated plainly, and enforced by the tests:

- **Knowing the internal stock/binding direction is still not a vendor confirmation.**
- **Knowing every material input is still not a rendered spine, a generated cover, a known render environment, artifact generation, a print file, vendor-ready, or manufacturing-ready.**
- **The vendor confirmations and the paper/board thickness are missing; the spine width is not computable and the cover stays blocked.**

## The spine-input ladder

`evaluate(input)` returns a structured matrix:

| Level | Meaning | True when |
|---|---|---|
| `spine-inputs-contract-known` | The contract is defined (the floor) | always — this module defines it |
| `spine-inputs-known` | Every required material input is present | all blocking inputs are known (no blockers) |

Both higher concerns — the render environment and the production ladder — are decided elsewhere (8G / 8A) and are reported here as explicitly-false flags (`renderEnvironmentKnown`, `exportArtifactGenerationReady`, `printFileReady`, `vendorReady`, `manufacturingReady`, `packagingReady`) so nothing can imply that knowing the material inputs produced a spine, a cover, an artifact, or readiness.

## Blocker codes (priority order)

`stock-confirmation-missing` → `binding-confirmation-missing` → `paper-thickness-missing` → `board-thickness-missing` → `page-count-missing` → `spine-width-not-computable` → `cover-still-blocked`.

The order follows the material dependency chain (the vendor must confirm the stock and binding; the physical thicknesses and page count feed the spine width; the spine width and confirmations feed the cover). With the live repo truth, the first missing input is `stock-confirmation-missing`, so it is the primary blocker. `blockers` is collected most-fundamental-first; `primaryBlocker = blockers[0] || null`; `blockerMessages` are safe, non-CTA, non-private labels aligned 1:1.

## The module — `KMEngine.MessageBookSpineInputs` (`src/products/message-book-spine-inputs.js`)

Fully pure and dependency-free: no DOM, no clock, no `Date`, no randomness, no I/O, no network, no storage, **no record builders**, and **no file output of any kind**. It reads only already-decided facts and references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmsi1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `LEVEL` / `STATE` / `BLOCKER` / `BLOCKER_ORDER` / `STATUS_TONE` — frozen enums.
- `REQUIRED_INPUTS` — frozen descriptor array (`{ state, label, source, present, blocking }` per state).
- `GATED_REASON` — `'not-implemented'`.
- `evaluate(input)` → the matrix (`spineInputsContractKnown`, `allInputsConfirmed`, `states` map, the internal-direction / confirmation / derived booleans, `spineWidthIn` (number or `null`), the explicitly-false higher rungs, and diagnostics).
- `blockerMessage(code)` → a short, safe, non-CTA label.
- `resolveFromContext({ productionDirection, productionDependencies, materialSpec?, pageCount? })` → `{ input, result, display }`. Derives each material fact honestly: the internal stock/binding direction from a `BOOK_PRODUCTION_DEPS`-shaped object (only when the value is a non-empty string), the vendor confirmations and cover gate from the captured production dependencies, the paper/board thickness from an optional vendor-supplied material spec (only when finite and positive), and the page count from an explicit confirmed count. Never invents a fact; an absent cover gate defaults to blocked.
- `toRenderEnvironmentInput(result)` → `{ spineWidthKnown, coverGenerationBlocked, stockConfirmed, bindingConfirmed }`. Maps the 8H derived facts onto 8G's existing `productionDependencies` fields — `spineWidthKnown` true only when the spine width is computable, the cover gate open only when the cover is unblocked. The honest bridge to 8G's existing input path. **8G is not modified.** The merge with 8G's interior-structure input stays with the caller.
- `describeReadiness(result)` → a display view-model `{ tone, headline, detail, blocker }`. `STATUS_TONE.GATED` for any unmet result (the live state); `STATUS_TONE.KNOWN` only when every input is present (and even then the detail states the render environment and artifact generation are not implemented).
- `describeBoundary()` → a plain-language statement of what the contract decides, what it is **distinct from** (render environment / export pipeline / manufacturing readiness), the rungs it separates, the documented spine-width formula, the blocker codes, the not-implemented steps, the material source of truth, `artifactFree: true`, and that it renders nothing and produces no file.

### Output shape

```
{
  contractVersion: 'kmsi1',
  productTypeId:   'message-book',
  spineInputsContractKnown,                  // always true (the floor)
  allInputsConfirmed,                        // aggregate — true only when all blocking inputs known
  states,                                    // { '<state>': bool } (9 states)
  internalStockDirectionKnown, internalBindingDirectionKnown,
  stockConfirmed, bindingConfirmed,
  paperThicknessKnown, boardThicknessKnown, pageCountKnown,
  spineWidthComputable,                      // paper + board + page count all present
  spineWidthIn,                              // (pageCount × paperThickness) + boardThickness, else null
  coverUnblocked,                            // gate open + stock + binding + spine computable
  renderEnvironmentKnown, exportArtifactGenerationReady, printFileReady,
  vendorReady, manufacturingReady, packagingReady,   // explicitly false — decided elsewhere
  gatedReason: 'not-implemented',
  furthestLevel,                             // highest LEVEL reached
  blockers,                                  // BLOCKER codes, priority order
  primaryBlocker,                            // blockers[0] || null
  blockerMessages                            // safe per-code labels, 1:1 with blockers
}
```

## Live integration (8F/8G export-preflight feed) — visibility only

`index.html` loads `src/products/message-book-spine-inputs.js` and `renderBookExportPreflightStatus(...)` derives the spine/stock/binding/cover `productionDependencies` it feeds into 8G from `MessageBookSpineInputs.resolveFromContext` + `toRenderEnvironmentInput`, passing the live `BOOK_PRODUCTION_DEPS` internal direction and the live captured production-dependency truth (`coverGenerationBlocked: true`, `stockConfirmed: false`, `bindingConfirmed: false`) with no vendor material spec. The result — `spineWidthKnown: false`, cover blocked — is merged with 8G's `interiorPageCountConfirmed` input and passed to `MessageBookRenderEnvironment.resolveFromContext`. The 8G aggregate stays **`false`**, so the export-preflight status keeps showing the same honest blocker — `render-environment-missing` — that 8F/8G showed before. The only change is that the spine/cover facts are now **computed by the spine-input contract against real constants** rather than hardcoded literals; behavior and copy are unchanged. The feed reads the scope-guarded geometry constants but does **not** modify them, generates nothing, writes no file, and adds no button or handler. The render-environment status element is outside `#bookCanvas`, so Scenario A visual regression is unaffected.

## Relationship to the existing layers (all intact)

- **5D/5E/6A/6B/6C** — proof approval, proof-preview phase, page composition, and unit generation are untouched. 8H only *reads* facts they produce (the real page count).
- **7A/7B/7C/7D/7E** — checkout readiness, live status hook, static capability alignment, and order intent are unchanged.
- **8A** — `MessageBookManufacturingReadiness` engine source is **unchanged**.
- **8B** — the live `#bookManufacturingStatus` path is unchanged.
- **8C/8D** — `MessageBookPrintSpec` and the live `#bookPrintSpecPanel` are unchanged.
- **8E** — `MessageBookExportPipeline` engine source is **unchanged**.
- **8F** — the live `#bookExportPreflightStatus` element and copy are unchanged; only the source of the spine/cover deps changed (hardcoded literals → contract-derived, identical values).
- **8G** — `MessageBookRenderEnvironment` engine source is **unchanged**; 8H supplies its existing `productionDependencies` (spine/cover) inputs as honestly-derived (currently spine-not-computable / cover-blocked) facts.

WhatsApp P1–P6 and the native no-dependency ZIP path are unchanged. No dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign.

## What 8H does not do

No vendor selection, confirmation, or contact, no spine rendering, no cover generation, no print-file generation, no export/PDF generation, **no file writing or artifact creation of any kind**, no vendor packet creation, no manufacturing/packaging/shipping behavior, no checkout, payment, cart, real order, or order submission, no address collection, shipping, tax, price, SKU, or line-item behavior, no dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign. It does **not** flip `renderEnvironmentKnown`, `exportPipelineImplemented`, mark `print-file-ready` true, or mark vendor/manufacturing/packaging ready — all remain false/gated. The module's own source-scan test keeps it free of commerce/production action verbs and side effects (including any `Date`/clock — it is fully pure). Spine width becomes computable, and the cover unblocked, only when the repo genuinely makes the vendor confirmations and the paper/board thickness known.

## Coverage

`message-book-spine-inputs-tests.mjs` (**290**, 17 suites): API shape; `LEVEL` / `STATE` (9) / `BLOCKER` (7) / `STATUS_TONE` frozen enums + `BLOCKER_ORDER` / `REQUIRED_INPUTS` coverage + safe messages; no inputs → contract-known floor with every blocker and `stock-confirmation-missing` primary (strict `=== true`, truthy-not-true rejected, non-boolean cover gate stays blocked); internal direction known but vendor confirmation missing (the live shape — direction distinct from confirmation, no direction blocker); missing paper/board thickness (incl. zero/negative/NaN rejection) → their blockers + spine not computable; page count missing/malformed (non-integer/non-positive rejected); spine width computable only when paper + board + page count all present, with the documented formula applied and a different valid spec deriving a different width (not hardcoded); cover remains blocked unless the gate is open + stock/binding confirmed + spine computable; all-known hypothetical → aggregate true at `spine-inputs-known` (and dropping any blocking input drops it, while dropping a non-blocking internal direction keeps it true); the higher rungs (render-env/artifact/print/vendor/manufacturing/packaging) always false even when the aggregate is true; `resolveFromContext` honest from live repo truth (direction known, confirmations + thicknesses missing → `stock-confirmation-missing` primary) and honest on malformed/absent input (no fact invented; a fully-supplied context derives known, proving values are not hardcoded); `toRenderEnvironmentInput` mapping; an **integration cross-check against the REAL `MessageBookRenderEnvironment` (8G)** proving the live 8H feed keeps 8G at `spine-missing` while a fully-confirmed 8H hypothetical + known geometry/font advances 8G to `render-environment-known` (and even then 8G never produces a print file); `describeReadiness` copy matrix + no-unsafe-claim scan; `describeBoundary` disclaimers; purity (deterministic + no input/argument mutation + fresh arrays); and a no-commerce/production-CTA + no-side-effect (incl. no `Date`/no file output) source-scan.
