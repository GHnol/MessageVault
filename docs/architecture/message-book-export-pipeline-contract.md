# Message Book Export-Pipeline Preflight Contract

**Status:** Active — introduced in Message Book Manufacturing Readiness 8E (Export Pipeline Contract + Artifact-Free Preflight); surfaced read-only in the live app by 8F (Live Export Preflight Status Hook + Dogfood Gate).
**Scope:** A local-first, deterministic, **artifact-free export-pipeline preflight contract** — only. It is **not** print-file generation, export/PDF generation, file writing, vendor packet creation, vendor selection, manufacturing, packaging, shipping, checkout, payment, cart/order creation, or order submission, and 8E added none of those. It defines *what an export pipeline must know* before a real print file could ever be produced, reports which of those inputs are present versus explicitly missing, and **keeps artifact generation explicitly not implemented**. It produces no file of any kind.

---

## Why this exists

8A (`MessageBookManufacturingReadiness`) reports a production-readiness ladder whose blocker, once a valid print spec is selected (8C/8D), becomes **`export-pipeline-not-implemented`**. Before 8E that blocker was one opaque `false` capability (`exportPipelineImplemented`) with no description of *what an export pipeline would actually need to know* or *which of those things already exist*.

8E attacks that blocker **honestly**, without generating anything. It does not flip `exportPipelineImplemented`. Instead it adds a **lower-level, artifact-free contract** that:

- declares the export pipeline's **required inputs** (a valid internal print spec, an approved/current proof, a known page count within bounds, ready composition, a known parity/padding status, the cover/spine/safe-area/render-environment inputs, and a known export target);
- reports each required input as **present or explicitly missing**, with safe blocker codes;
- separates the **knowledge** the pipeline needs from the **generation** it cannot perform, and reports artifact generation and print-file production as explicitly-false rungs.

The honest result: the *contract/inputs* layer can advance (and, when every input is supplied, reach `export-inputs-known`), while **artifact generation and `print-file-ready` remain false** because no generator exists.

## The honesty determination — `exportPipelineImplemented` is NOT flipped

In 8A, `printFileReady = exportSpecKnown && exportPipelineImplemented`. So 8A's `exportPipelineImplemented` capability means **the export pipeline can actually produce a print file** — flipping it true would imply generated print files / production-ready artifacts exist. They do not. Therefore **8E does not flip it.**

8E's bridge maps to 8A's existing input as `exportPipelineImplemented: result.exportArtifactGenerationReady`, and `exportArtifactGenerationReady` is **false** in this package (it requires the genuine, currently-absent `artifactGenerationImplemented` capability). Feeding the 8E bridge into 8A therefore leaves the live answer at **`export-pipeline-not-implemented`** — identical to the 8B/8D no-export-capability path. Only a **future** package that implements a real generator (flipping `artifactGenerationImplemented`, then validating a produced file) could make this true; 8E never does.

## The layers are distinct

| Layer | Question | Module |
|---|---|---|
| Internal print spec (8C/8D) | Is an internal, KeepMees-owned print spec selected and valid for this proof? | `MessageBookPrintSpec` |
| **Export-pipeline preflight (8E)** | **What must the export pipeline know before a real print file could be produced — and which inputs are present?** | **`MessageBookExportPipeline`** |
| Artifact generation (separate) | Could a print/export file actually be produced? | Not implemented |
| Print file (separate) | Has a validated print file actually been produced? | Not implemented |
| Production readiness (8A/8B) | Is the full manufacturing ladder above checkout met? | `MessageBookManufacturingReadiness` |

Stated plainly, and enforced by the tests:

- **Knowing every export input is still not a print file.**
- **Knowing every export input is still not vendor-ready.**
- **Knowing every export input is still not manufacturing-ready.**
- **Artifact generation is not implemented; `print-file-ready` is false.**

## The preflight ladder

`evaluate(input)` returns a structured matrix. Each rung requires every rung below it:

| Level | Meaning | True when |
|---|---|---|
| `export-pipeline-contract-known` | The preflight contract is defined (the floor) | always — this module defines it |
| `export-inputs-known` | Every required export input is present | all 7 required inputs are known |
| `export-artifact-generation-ready` | The pipeline could produce an artifact | export-inputs-known **and** a real generator is implemented |
| `print-file-ready` | A validated print file has been produced | export-artifact-generation-ready **and** the file is validated |
| `vendor-ready` | A vendor could receive the file | print-file-ready **and** a vendor is confirmed |
| `manufacturing-ready` | The book could be manufactured | vendor-ready **and** manufacturing is implemented |
| `packaging-ready` | The book could be packaged | manufacturing-ready **and** packaging is implemented |

In the live app the ladder reaches **at most `export-inputs-known`** — and only once every input is supplied. Every rung above it is **false** because the genuine `CAPABILITIES` are all-false. The monotonicity invariants (each rung implies every lower rung; the contract floor is always known; missing any input keeps the ladder at the floor) are swept across the full capability grid.

## Required export inputs

| Input | Producer | Live state |
|---|---|---|
| `print-spec-valid` | `MessageBookPrintSpec` (8C/8D) | depends on local selection |
| `proof-approved-current` | `MessageBookReadiness` / `ProofApprovalState` (5D/7A) | depends on proof |
| `page-count-known` | `BookComposition.computePageLimitStatus` (6A/6B) | depends on proof |
| `composition-ready` | `BookComposition.generateUnits` / `paginateUnits` (6B/6C) | depends on proof |
| `parity-known` | `BookComposition` / `MessageBookPrintSpec` parity (6B/8C) | known when a spec is selected |
| `render-environment-known` | `ProductPreflight` render-environment checks | **not available yet** (genuinely missing) |
| `export-target-known` | `MessageBookPrintSpec` PDF/X-4 direction (8C) | known when a recognized spec is selected |

A valid internal print spec is **required before preflight can proceed** — it leads the priority order, so `print-spec-not-valid` is the primary blocker when it is missing.

## Blocker codes (priority order)

`print-spec-not-valid` → `proof-not-approved-current` → `page-count-unknown` → `composition-not-ready` → `parity-unknown` → `render-environment-missing` → `export-target-unknown` → `artifact-generation-not-implemented` (terminal: remains even when every input is known) → `print-file-not-ready` (guards the validated-file rung above a hypothetical implemented generator).

`blockers` is collected most-fundamental-first; `primaryBlocker = blockers[0] || null`; `blockerMessages` are safe, non-CTA, non-private labels aligned 1:1.

## The module — `KMEngine.MessageBookExportPipeline` (`src/products/message-book-export-pipeline.js`)

Fully pure and dependency-free: no DOM, no clock, no `Date`, no randomness, no I/O, no network, no storage, **no record builders**, and **no file output of any kind**. It reads only already-decided facts and references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmep1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `LEVEL` / `INPUT` / `INPUT_ORDER` / `BLOCKER` / `STATUS_TONE` — frozen enums.
- `REQUIRED_INPUTS` — frozen descriptor array (`{ input, label, producer }` per required input).
- `GATED_REASON` — `'not-implemented'`.
- `CAPABILITIES` — frozen record of the repo's **current genuine** export/generation capability; **every flag is `false`** (`artifactGenerationImplemented`, `printFileValidated`, `vendorConfirmed`, `manufacturingImplemented`, `packagingImplemented`).
- `EXPORT_TARGET` — a frozen descriptor of the known PDF/X-4 export **direction** (`status: 'internal-direction'`, `vendorConfirmed: false`, `artifactProduced: false`), pointing at `MessageBookPrintSpec.INTERNAL_DRAFT_SPEC` and the `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` geometry source of truth (not duplicated).
- `evaluate(input)` → the preflight matrix (ladder booleans, `inputs` map, `missingInputs`, diagnostics).
- `blockerMessage(code)` → a short, safe, non-CTA label.
- `describeReadiness(result)` → a display view-model `{ tone, headline, detail, blocker }`. `STATUS_TONE.GATED` for any unmet result (the live state); `STATUS_TONE.READY` only for a `printFileReady` result (a real validated file — unreachable until a generator exists).
- `toManufacturingCapabilities(result)` → `{ exportPipelineImplemented: result.exportArtifactGenerationReady }`. False in this package; the honest bridge to 8A's existing input path. 8A is **not modified**.
- `resolveFromContext({ printSpec, proofApprovedCurrent, compositionReady, renderEnvironmentKnown?, exportTargetKnown?, capabilities? })` → `{ input, result, display }`. Maps a 8C `MessageBookPrintSpec` result (spec validity / page bounds / parity / export-target) plus app-computed proof / composition / render-environment facts into the `evaluate` input. `capabilities` defaults to `CAPABILITIES` (all-false), guaranteeing every generation rung stays false.
- `describeBoundary()` → a plain-language statement of what the preflight decides, what it is **distinct from** (print-spec selection / manufacturing readiness / print-file generation), the rungs it separates, the required inputs, the not-implemented steps, `artifactFree: true`, and — emphatically — that it produces no print/export/PDF file, writes no file, builds no vendor packet, selects no vendor, and begins no manufacturing, packaging, or shipping.

### Output shape

```
{
  contractVersion: 'kmep1',
  productTypeId:   'message-book',
  exportPipelineContractKnown, exportInputsKnown, exportArtifactGenerationReady,
  printFileReady, vendorReady, manufacturingReady, packagingReady,   // ladder booleans
  inputs,                                              // { '<required-input>': bool } (7 inputs)
  missingInputs,                                       // input codes missing, priority order
  artifactGenerationImplemented,                       // echoed; false in this package
  gatedReason: 'not-implemented',
  furthestLevel,                                       // highest LEVEL reached
  blockers,                                            // BLOCKER codes, priority order
  primaryBlocker,                                      // blockers[0] || null
  blockerMessages                                      // safe per-code labels, 1:1 with blockers
}
```

## Relationship to the existing layers (all intact)

8E is **engine + tests + docs only** — no `index.html`/UI, no `window.__km` bridge (mirroring the 8A/8C engine-only split; a later package could add a read-only status hook as 8B/8D did). It changes **no** existing module:

- **5D/5E/6A/6B/6C** — proof approval, proof-preview phase, page composition, and unit generation are untouched. 8E only *reads* the facts they produce (page count, parity, composition readiness).
- **7A/7B/7C/7D/7E** — checkout readiness, the live status hook, the static capability alignment, and order intent are unchanged.
- **8A** — `MessageBookManufacturingReadiness` engine source is **unchanged**. 8E supplies its existing `exportPipelineImplemented` input as honestly-false; the `export-pipeline-not-implemented` blocker is preserved.
- **8B** — the live read-only `#bookManufacturingStatus` path is unchanged (it passes no export capability, so the live app still shows `export-pipeline-not-implemented` once a valid spec is selected).
- **8C/8D** — `MessageBookPrintSpec` and the live `#bookPrintSpecPanel` are unchanged; 8E *reads* a print-spec result via `resolveFromContext`.

WhatsApp P1–P6 and the native no-dependency ZIP path are unchanged. No dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI.

## Live status hook (8F) — visibility only

8F surfaces the 8E contract in the live Message Book app as a **read-only** status, so a user can see *which export inputs are known versus missing and that artifact generation is not implemented* — **without generating anything**. It is dogfood/readiness visibility only.

- **Read-only `#bookExportPreflightStatus`** — `index.html` loads `src/products/message-book-export-pipeline.js` and renders a status element that is a sibling of the 7B readiness / 7E order-intent / 8B manufacturing / 8D print-spec panels and **outside `#bookCanvas`** (so the Scenario A visual regression, which captures only `#bookCanvas` pages, is unaffected). It registers **no buttons and no handlers**.
- **Live input mapping (existing live facts only)** — `renderBookExportPreflightStatus(...)` calls `MessageBookExportPipeline.resolveFromContext` with:
  - `printSpec` — the **8D** `renderBookPrintSpecPanel` result (spec validity, page bounds → page-count/parity, recognized spec → export-target);
  - `proofApprovedCurrent` — `approvalStatus === 'approved' && !approvalStale` (the 5D fingerprint staleness signal this panel already computes);
  - `compositionReady` — `hasContent && !state.exceedsPageLimit` (the 6A/6B page-limit gate the proof flow already computes);
  - `renderEnvironmentKnown` — **`false`**. The live app computes no cover/spine/safe-area/render-environment inputs (`ProductPreflight`'s render-environment checks are not wired), so this input is **honestly reported missing rather than invented**.
  - `capabilities` — omitted, so the engine applies its all-false `CAPABILITIES` default; every generation rung stays false.
- **What the live status shows.** Tone is always `gated` (the `ready` tone is unreachable). With no/invalid spec → *"A valid internal print specification has not been selected yet."*; with a valid spec but a not-approved/stale proof → *"The proof has not been approved, or the approval is out of date."*; with a valid spec + approved-current proof + ready composition → the next honest missing input, **`render-environment-missing`**: *"Cover, spine, safe-area, and render-environment inputs are not available yet."* Because render-environment is genuinely missing in the live app, the live status never advances to `export-target-unknown` or `artifact-generation-not-implemented` as the primary blocker — those are reachable only in tests that supply the render-environment input.
- **Export inputs known ≠ generated artifact.** Even with every input supplied (a test-only scenario), the terminal blocker is `artifact-generation-not-implemented` and `print-file-ready` stays false. The live hook **never flips `exportPipelineImplemented`**, never marks `print-file-ready` true, and never reports vendor/manufacturing/packaging ready — all remain false/gated.

8F is **`index.html` + tests + docs only**. The 8E engine source is **unchanged** (no display helpers were needed — `resolveFromContext`/`describeReadiness` already produce the view-model). 8A/8B/8C/8D, 7A–7E, and 5D/5E/6A/6B/6C are intact; no export/PDF/print-file/vendor-packet generation, no file writing, no vendor selection, no checkout/payment/cart/order/order-submission, no address/shipping/tax/price/SKU/line-item, no manufacturing/packaging, no dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign.

## What 8E does not do

No print-file generation, no export/PDF generation, **no file writing or export artifact creation of any kind**, no vendor packet creation, no vendor selection or integration, no manufacturing/packaging/shipping behavior, no checkout, payment, cart, real order, or order submission, no address collection, shipping, tax, price, SKU, or line-item behavior, no dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI. The module's own source-scan test keeps it free of commerce/production action verbs and side effects (including any `Date`/clock — it is fully pure). `exportPipelineImplemented`, `print-file-ready`, vendor, manufacturing, and packaging readiness all remain **false** until the repo genuinely implements a real generator, at which point the corresponding capability flag (and only that flag) would flip.

## Coverage

`message-book-export-pipeline-tests.mjs` (**589**, 20 suites — 466/19 in 8E, +123/+1 in 8F): API shape; `LEVEL` (7-rung) / `INPUT` (7) / `BLOCKER` (9) / `CAPABILITIES` (all-false) / `EXPORT_TARGET` frozen enums + safe messages; empty/null → contract-known floor with all inputs missing; **a valid print spec is required first** (`print-spec-not-valid` leads even with every other input present); each individual missing input → its blocker; parity known vs unknown; **all inputs known but artifact generation not implemented → `export-inputs-known` + terminal `artifact-generation-not-implemented`, `print-file-ready` false**; full 32-combo ladder-invariant sweep (each rung implies every lower rung; missing inputs never climb past the floor); a hypothetical generation chain proving the rungs are separated and correctly wired; the `toManufacturingCapabilities` bridge (`exportPipelineImplemented` false in this package, true only for a hypothetical artifact-ready result); `describeReadiness` copy matrix (ready unreachable with genuine defaults); `describeBoundary` disclaimers; `resolveFromContext` mapping from a real 8C result; purity (deterministic + no input/argument mutation + fresh arrays); a no-commerce/production-CTA + no-side-effect (incl. no `Date`/no file output) source-scan; and an **integration cross-check against the REAL `MessageBookPrintSpec` (8C) and `MessageBookManufacturingReadiness` (8A)** proving that reaching `export-inputs-known` does **not** advance 8A past `export-pipeline-not-implemented`, that the 8E bridge leaves the 8A live answer unchanged, and that only a hypothetical real generator could ever flow `exportPipelineImplemented` true. **Suite 20 (8F)** locks the live `renderBookExportPreflightStatus` input mapping with a faithful mirror of the index.html derivation: a missing/invalid print spec blocks at `print-spec-not-valid`; a valid spec + approved-current proof + ready composition advances to the next honest blocker `render-environment-missing` (render-environment honestly absent in the live app); a stale approval falls back to `proof-not-approved-current`; over-limit content makes `composition-ready` false; every live result keeps `exportPipelineImplemented`/`print-file-ready`/`vendor`/`manufacturing`/`packaging` false and the tone `gated` (never `ready`); the rendered copy carries no commerce/production CTA or "ready to print/order/export" claim; and the live result fed into the 8A bridge keeps 8A at `export-pipeline-not-implemented`.
