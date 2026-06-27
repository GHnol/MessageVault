# Message Book Render-Environment Input Contract

**Status:** Active — introduced in Message Book Manufacturing Readiness 8G (Render Environment Input Contract + Export Preflight Feed). Wired read-only into the live 8F export-preflight status.
**Scope:** A local-first, deterministic, **artifact-free render-environment input-availability contract** — only. It is **not** cover/spine rendering, layout, print-file generation, export/PDF generation, file writing, vendor packet creation, vendor selection, manufacturing, packaging, shipping, checkout, payment, cart/order creation, or order submission, and 8G added none of those. It models *which render-environment facts an export pipeline must know* before a real print artifact could ever be produced, reports each as present or explicitly missing, and **only reports the aggregate known when every required input is genuinely present**. It produces no file and renders nothing.

---

## Why this exists

8E (`MessageBookExportPipeline`) lists `render-environment-known` among its required export inputs, but treated it as a single opaque boolean. The 8F live status fed it a hardcoded `false`. Neither said **which** render-environment facts are known versus missing.

8G attacks that opacity **honestly**, without rendering or generating anything. It adds a **lower-level, artifact-free contract** that:

- declares the export pipeline's **render-environment inputs** — interior structure, trim, bleed, safe-area, parity/padding, spine, cover, font/emoji render availability, and export target;
- derives each input **present or explicitly missing** from already-decided repo truth, with safe blocker codes;
- reports the **aggregate `renderEnvironmentKnown` true only when every required input is genuinely present**;
- feeds that aggregate into 8E's existing `renderEnvironmentKnown` input — so the export preflight blocks honestly while any render fact is missing, and advances automatically only when all are genuinely known.

The honesty determination: **the aggregate is `false` today** because cover, spine width, and font/emoji render availability are genuinely missing. 8G does **not** force the export preflight past `render-environment-missing`; it explains *why* it is blocked.

## The honesty determination — `renderEnvironmentKnown` is NOT forced true

The goal is **not** to advance the export preflight. It is to identify which render-environment facts are genuinely available versus still missing. The aggregate is reported known **only** when all required inputs are actually present, deterministic, and tested.

| Input | Source of truth | Live state |
|---|---|---|
| `interior-structure-known` | captured `BookRenderSpec.productionDependencies.interiorPageCountConfirmed` (6B/6C) | **known** (real paginator page count) |
| `trim-known` | `BOOK_PRODUCTION_DEPS.TRIM_IN` (index.html, scope-guarded) | **known** (7×10) |
| `bleed-known` | `BOOK_PRODUCTION_DEPS.BLEED_IN` | **known** (0.125 in) |
| `safe-area-known` | `BOOK_PRODUCTION_DEPS.SAFE_INSET_IN` / `MARGINS_IN` | **known** |
| `parity-known` | `BOOK_PARITY.MODULUS` (index.html, scope-guarded) | **known** (modulus 2) |
| `export-target-known` | `BOOK_PRODUCTION_DEPS.PDF_SPEC` | **known** (PDF/X-4 direction) |
| `spine-known` | captured `spineWidthKnown` — vendor-supplied paper/board thickness | **missing** (`false`) |
| `cover-known` | cover gate (`coverGenerationBlocked` + stock/binding confirmation) | **missing** (blocked/unconfirmed) |
| `font-render-known` | `ProductPreflight` FONT_AVAILABILITY / EMOJI_STRATEGY_CONFIRMED | **missing** (no render-environment input wired) |

Because spine, cover, and font/emoji render availability are genuinely missing, the aggregate is **`false`**. The geometry / parity / export-target facts that *are* present in repo truth are reported known — but knowing them is not the aggregate.

These facts are deterministic repo truth, not invented:
- The geometry / parity / export-target values live in `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` (scope-guarded; pointed at, never duplicated or modified).
- The cover gate mirrors `BOOK_PRODUCTION_DEPS.isCoverUnblocked` — cover is known only when the gate is unblocked **and** spine width is known **and** stock + binding are confirmed.
- The spine comment in `BOOK_PRODUCTION_DEPS` states spine width = `(pageCount × paperThicknessPerLeaf) + boardThickness — vendor-supplied`; those thicknesses are not in repo truth, so spine is missing.

## The layers are distinct

| Layer | Question | Module |
|---|---|---|
| **Render-environment inputs (8G)** | **Which render-environment facts are genuinely known, and which are missing?** | **`MessageBookRenderEnvironment`** |
| Product preflight checks | Do the render checks pass once rendered outputs exist? | `ProductPreflight` (needs rendered inputs) |
| Export-pipeline preflight (8E) | What must the export pipeline know — and which inputs are present? | `MessageBookExportPipeline` |
| Artifact generation (separate) | Could a print/export file actually be produced? | Not implemented |
| Production readiness (8A/8B) | Is the full manufacturing ladder above checkout met? | `MessageBookManufacturingReadiness` |

8G sits **above** `ProductPreflight`: `ProductPreflight` *runs* the render checks but needs the rendered outputs (asset manifest, render environment, stock spec, cover spec) that the live app does not compute, so with no inputs every render check is `not-applicable`/incomplete. 8G answers the prior question — *are the inputs those checks need even known yet?* — and is not a duplicate.

Stated plainly, and enforced by the tests:

- **Knowing the render inputs is still not a rendered cover or spine.**
- **Knowing every render input is still not artifact generation, a print file, vendor-ready, or manufacturing-ready.**
- **Cover, spine, and font/emoji render availability are missing; the aggregate is false.**

## The render-environment ladder

`evaluate(input)` returns a structured matrix:

| Level | Meaning | True when |
|---|---|---|
| `render-environment-contract-known` | The contract is defined (the floor) | always — this module defines it |
| `render-environment-known` | Every required render input is present | all 9 required inputs are known |

Both higher concerns — artifact generation and the production ladder — are decided elsewhere (8E / 8A) and are reported here as explicitly-false flags (`exportArtifactGenerationReady`, `printFileReady`, `vendorReady`, `manufacturingReady`, `packagingReady`) so nothing can imply that knowing the render inputs produced an artifact.

## Required render inputs (priority order)

`interior-structure-known` → `trim-known` → `bleed-known` → `safe-area-known` → `parity-known` → `spine-known` → `cover-known` → `font-render-known` → `export-target-known`.

The order follows the render-pipeline dependency chain (the interior must exist, then its geometry, then the spine — which needs the interior page count and stock — then the cover, which needs the spine, then the font/render runtime, then the export target). With the live repo truth, the first missing input is `spine-known`, so `spine-missing` is the primary blocker.

## Blocker codes (priority order)

`interior-structure-missing` → `trim-missing` → `bleed-missing` → `safe-area-missing` → `parity-missing` → `spine-missing` → `cover-missing` → `font-render-missing` → `export-target-missing`.

`blockers` is collected most-fundamental-first; `primaryBlocker = blockers[0] || null`; `blockerMessages` are safe, non-CTA, non-private labels aligned 1:1.

## The module — `KMEngine.MessageBookRenderEnvironment` (`src/products/message-book-render-environment.js`)

Fully pure and dependency-free: no DOM, no clock, no `Date`, no randomness, no I/O, no network, no storage, **no record builders**, and **no file output of any kind**. It reads only already-decided facts and references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmre1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `LEVEL` / `INPUT` / `INPUT_ORDER` / `BLOCKER` / `STATUS_TONE` — frozen enums.
- `REQUIRED_INPUTS` — frozen descriptor array (`{ input, label, source, present }` per required input).
- `GATED_REASON` — `'not-implemented'`.
- `evaluate(input)` → the matrix (`renderEnvironmentContractKnown`, `renderEnvironmentKnown`, `inputs` map, `missingInputs`, the explicitly-false higher rungs, and diagnostics).
- `blockerMessage(code)` → a short, safe, non-CTA label.
- `resolveFromContext({ geometry, parity, productionDependencies, fontRender, interiorStructureReady? })` → `{ input, result, display }`. Derives each render fact honestly from repo-truth-shaped objects: trim/bleed/safe-area/export-target from `BOOK_PRODUCTION_DEPS`-shaped geometry (only when the values are finite/well-formed), parity from `BOOK_PARITY`-shaped modulus, interior/spine/cover from the captured production dependencies (cover mirrors `isCoverUnblocked`), and font/emoji availability from an explicit signal. Never invents a fact.
- `toExportPipelineInput(result)` → `{ renderEnvironmentKnown: result.renderEnvironmentKnown }`. True only when the aggregate is genuinely true; the honest bridge to 8E's existing input path. **8E is not modified.**
- `describeReadiness(result)` → a display view-model `{ tone, headline, detail, blocker }`. `STATUS_TONE.GATED` for any unmet result (the live state); `STATUS_TONE.KNOWN` only when every input is present (and even then the detail states artifact generation is not implemented).
- `describeBoundary()` → a plain-language statement of what the contract decides, what it is **distinct from** (export pipeline / product preflight / manufacturing readiness), the rungs it separates, the required inputs, the not-implemented steps, the geometry source of truth, `artifactFree: true`, and that it renders nothing and produces no file.

### Output shape

```
{
  contractVersion: 'kmre1',
  productTypeId:   'message-book',
  renderEnvironmentContractKnown,            // always true (the floor)
  renderEnvironmentKnown,                    // aggregate — true only when all 9 inputs known
  inputs,                                    // { '<render-input>': bool } (9 inputs)
  missingInputs,                             // input codes missing, priority order
  exportArtifactGenerationReady, printFileReady, vendorReady,
  manufacturingReady, packagingReady,        // explicitly false — decided elsewhere
  gatedReason: 'not-implemented',
  furthestLevel,                             // highest LEVEL reached
  blockers,                                  // BLOCKER codes, priority order
  primaryBlocker,                            // blockers[0] || null
  blockerMessages                            // safe per-code labels, 1:1 with blockers
}
```

## Live integration (8F export-preflight feed) — visibility only

`index.html` loads `src/products/message-book-render-environment.js` and `renderBookExportPreflightStatus(...)` derives the `renderEnvironmentKnown` it feeds into 8E from `MessageBookRenderEnvironment.resolveFromContext`, passing the live `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` geometry and the live captured production-dependency truth (`coverGenerationBlocked: true`, `spineWidthKnown: false`, `stockConfirmed: false`, `bindingConfirmed: false`) plus an unconfirmed font/emoji signal. The aggregate is **`false`**, so the export-preflight status keeps showing the same honest blocker — `render-environment-missing` — that 8F showed before. The only change is that the value is now **computed by the render-environment contract against real constants** rather than a hardcoded literal; behavior and copy are unchanged. The feed reads the scope-guarded geometry constants but does **not** modify them, generates nothing, writes no file, and adds no button or handler. The render-environment status element is outside `#bookCanvas`, so Scenario A visual regression is unaffected.

## Relationship to the existing layers (all intact)

- **5D/5E/6A/6B/6C** — proof approval, proof-preview phase, page composition, and unit generation are untouched. 8G only *reads* facts they produce (interior page structure).
- **7A/7B/7C/7D/7E** — checkout readiness, live status hook, static capability alignment, and order intent are unchanged.
- **8A** — `MessageBookManufacturingReadiness` engine source is **unchanged**.
- **8B** — the live `#bookManufacturingStatus` path is unchanged.
- **8C/8D** — `MessageBookPrintSpec` and the live `#bookPrintSpecPanel` are unchanged.
- **8E** — `MessageBookExportPipeline` engine source is **unchanged**; 8G supplies its existing `renderEnvironmentKnown` input as an honestly-derived (currently false) aggregate.
- **8F** — the live `#bookExportPreflightStatus` element and copy are unchanged; only the source of the `renderEnvironmentKnown` value changed (hardcoded `false` → contract-derived `false`).
- **8H** — `MessageBookSpineInputs` (`docs/architecture/message-book-spine-stock-binding-input-contract.md`) decomposes 8G's opaque `spine-known` / cover-gate inputs into the internal stock/binding direction, the vendor stock/binding confirmation, the paper/board thickness, the page count, and the derived spine-width computability + cover unblock. It feeds 8G's existing `productionDependencies` (`spineWidthKnown` / cover gate / stock / binding) input path with honestly-derived facts — currently spine-not-computable / cover-blocked — so the 8G aggregate stays false. **8G engine source is unchanged**; 8H supplies its inputs, it does not modify it.

WhatsApp P1–P6 and the native no-dependency ZIP path are unchanged. No dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign.

## What 8G does not do

No cover/spine rendering or layout, no print-file generation, no export/PDF generation, **no file writing or artifact creation of any kind**, no vendor packet creation, no vendor selection or integration, no manufacturing/packaging/shipping behavior, no checkout, payment, cart, real order, or order submission, no address collection, shipping, tax, price, SKU, or line-item behavior, no dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign. It does **not** flip `exportPipelineImplemented`, mark `print-file-ready` true, or mark vendor/manufacturing/packaging ready — all remain false/gated. The module's own source-scan test keeps it free of commerce/production action verbs and side effects (including any `Date`/clock — it is fully pure). `renderEnvironmentKnown` becomes true only when the repo genuinely makes cover, spine, and font/emoji render availability known.

## Coverage

`message-book-render-environment-tests.mjs` (**307**, 18 suites): API shape; `LEVEL` / `INPUT` (9) / `BLOCKER` (9) / `STATUS_TONE` frozen enums + `INPUT_ORDER` / `REQUIRED_INPUTS` coverage + safe messages; no inputs → contract-known floor with all 9 missing and `interior-structure-missing` primary (strict `=== true`, truthy-not-true rejected); each individual missing input → its blocker; the genuine live partial state (geometry/parity/interior/export-target known, spine/cover/font missing → `spine-missing` primary); all inputs known → aggregate true at `render-environment-known`; aggregate stays false when **any** single input is dropped; the higher rungs (artifact/print/vendor/manufacturing/packaging) always false even when the aggregate is true; `resolveFromContext` honest from live `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` repo truth (aggregate false, spine-missing primary) and honest on malformed/absent geometry (no fact invented; a different well-formed geometry also derives known, proving values are not hardcoded); a fully-confirmed hypothetical that aggregates **true** only when spine + cover gate + stock + binding + font/emoji are all genuinely supplied (with cover staying missing if any sub-condition is unmet); the `interiorStructureReady` override; `toExportPipelineInput` true only when the aggregate is true; an **integration cross-check against the REAL `MessageBookExportPipeline` (8E)** proving the live aggregate keeps 8E at `render-environment-missing` while a fully-confirmed hypothetical advances 8E to its terminal `artifact-generation-not-implemented` (never a print file); a **live 8F mapping** mirror proving the export-preflight stays at `render-environment-missing`/`gated` and the 8A bridge stays at `export-pipeline-not-implemented`; `describeReadiness` copy matrix + no-unsafe-claim scan; `describeBoundary` disclaimers; purity (deterministic + no input/argument mutation + fresh arrays); and a no-commerce/production-CTA + no-side-effect (incl. no `Date`/no file output) source-scan.
