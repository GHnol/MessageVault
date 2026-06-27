# Message Book Vendor / Material Evidence Contract

**Status:** Active — introduced in Message Book Manufacturing Readiness 8I (Vendor Material Evidence Contract + Spine Input Adapter). Engine + tests + docs only; not yet wired into the live app (wiring would be a no-op today because no accepted evidence exists — see "Live integration" below).
**Scope:** A local-first, deterministic, **artifact-free vendor / material evidence-availability contract** — only. It is **not** vendor selection, vendor confirmation, vendor contact, vendor integration, spine rendering, cover generation, spine-width computation, print-file generation, export/PDF generation, file writing, vendor packet creation, manufacturing, packaging, shipping, checkout, payment, cart/order creation, or order submission, and 8I added none of those. It models *what vendor / material evidence must exist and be accepted* before the stock confirmation, binding confirmation, paper thickness, and board thickness that 8H needs can honestly be treated as known, reports each as present or explicitly missing/unaccepted, and **only emits an 8H adapter payload that marks a confirmation true (or supplies a thickness) when the corresponding evidence is genuinely present AND the evidence has been accepted**. It produces no file and confirms nothing on its own.

---

## Why this exists

8H (`MessageBookSpineInputs`) takes opaque `stockConfirmed` / `bindingConfirmed` booleans and an optional vendor-supplied `materialSpec` (paper / board thickness) among its inputs. The live 8F/8G/8H feed supplies those as honest `false` / absent, so 8H honestly reports `stock-confirmation-missing`, the spine width not computable, and the cover blocked. But nothing said **what would have to be true** before those confirmations and thicknesses could honestly be supplied, nor guarded against treating a "vendor confirmation pending" note as if it were a confirmation.

8I attacks that gap **honestly**, without selecting or confirming a vendor or generating anything. It adds a **lower-level, artifact-free contract** that sits **below** 8H and:

- declares the vendor / material **evidence** that 8H's confirmations and thicknesses depend on — an evidence record, an identified evidence source (who / which version / when), stock evidence, binding evidence, paper-thickness evidence, board-thickness evidence, and an explicit acceptance of that evidence for the spine-input feed;
- evaluates each as **present or explicitly missing**, with safe blocker codes;
- treats acceptance as a **separate gate** on top of completeness — complete evidence that has not been accepted still feeds nothing;
- emits an **8H adapter payload** (`toSpineInputMaterial`) that marks a confirmation true (or supplies a thickness) **only when** that specific evidence is present **and** the evidence is accepted (with an identified source);
- never invents a material or vendor fact, and **never treats a "vendor confirmation pending" note as confirmation**.

The honesty determination: **no accepted vendor / material evidence exists in repo truth today.** So the contract reports the evidence missing and emits an adapter payload that keeps 8H exactly where it is — `stock-confirmation-missing`, spine width not computable, cover blocked. 8I does **not** advance 8H; it explains what evidence is still needed.

## The honesty determination — nothing is forced true

The goal is **not** to advance the spine inputs. It is to identify which vendor / material evidence is genuinely available and accepted versus still missing. A confirmation is fed to 8H **only** when its evidence is actually present, accepted, deterministic, and tested.

| Evidence | Source of truth | Live state |
|---|---|---|
| `internal-material-direction-known` | `BOOK_PRODUCTION_DEPS.STOCK` / `.BINDING` (index.html, scope-guarded) | **known** (provisional/locked *direction* — NOT a vendor confirmation) |
| `evidence-source-present` / `evidence-source-identified` | a supplied evidence record's source identity / version / date | **missing** (no evidence record in repo truth) |
| `stock-evidence-present` | vendor-supplied stock confirmation evidence | **missing** (register: "Vendor confirmed: No") |
| `binding-evidence-present` | vendor-supplied binding confirmation evidence | **missing** (register: "Vendor confirmed: No") |
| `paper-thickness-evidence-present` | vendor-supplied paper caliper evidence | **missing** ("capture when vendor is confirmed") |
| `board-thickness-evidence-present` | vendor-supplied cover-board evidence | **missing** ("capture when vendor is confirmed") |
| `evidence-accepted` | explicit acceptance of the supplied evidence for the feed | **missing** (nothing to accept) |

Because no evidence record has been supplied or accepted, every evidence state except the internal direction is **missing**, the primary blocker is `material-evidence-missing`, and the 8H adapter feeds `stockConfirmed: false`, `bindingConfirmed: false`, `materialSpec: null`.

These facts are deterministic repo truth, not invented:
- The vendor / manufacturing register (`docs/ops/vendor-manufacturing-register.md`) records **"Vendor confirmed: No — active evaluation, no confirmed selection"**, `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` **false**, and the paper/board thickness among the **"Manufacturing constraints to capture when vendor is confirmed"** (i.e. not yet captured).
- `ProductRenderSpec` records `manufacturingReadinessNotes: 'IngramSpark vendor confirmation pending'`. **A pending note is explicitly NOT a confirmation** — the contract rejects a record that carries only such a note (it has no actual confirmations or thicknesses).
- The internal stock/binding **direction** lives in `BOOK_PRODUCTION_DEPS.STOCK` / `.BINDING` (scope-guarded; pointed at, never duplicated or modified). It is a provisional/locked launch *direction*, **not** vendor evidence.

## Internal direction is distinct from evidence; evidence is distinct from acceptance

The contract **separates** three things the prior layers blurred:

1. A known internal **direction** (`matte-premium-text`, `casebound-hardcover`) produces **no blocker** and does **not** confirm anything — it is not vendor evidence.
2. **Evidence presence** (a record with an identified source and each material fact) is distinct from **acceptance**. Complete evidence that has not been accepted produces the `material-evidence-not-accepted` blocker and feeds nothing.
3. **Acceptance requires provenance.** An `accepted: true` flag with no identified source is void for the feed — accepting unsourced evidence would be the dishonesty this contract exists to prevent.

This separation is enforced by the tests: dropping the internal direction keeps an accepted aggregate true; dropping a piece of evidence, or leaving complete evidence unaccepted, or accepting without a source, all block the feed.

## The layers are distinct

| Layer | Question | Module |
|---|---|---|
| **Vendor / material evidence (8I)** | **What evidence must exist and be accepted before the material facts are honestly known?** | **`MessageBookMaterialEvidence`** |
| Spine / stock / binding inputs (8H) | Which material facts are known, and can the spine width be computed / cover be unblocked? | `MessageBookSpineInputs` (still spine-not-computable) |
| Render-environment inputs (8G) | Which render-environment facts are known once spine + cover are known? | `MessageBookRenderEnvironment` (aggregate still false) |
| Export-pipeline preflight (8E) | What must the export pipeline know — and which inputs are present? | `MessageBookExportPipeline` (artifact generation not implemented) |
| Production readiness (8A/8B) | Is the full manufacturing ladder above checkout met? | `MessageBookManufacturingReadiness` |

8I sits **below** 8H: 8H consumes the confirmations and thicknesses that 8I gates. 8I does not compute the spine width or unblock the cover — those stay 8H's job, and 8H stays honestly blocked until accepted evidence flows through 8I.

Stated plainly, and enforced by the tests:

- **A known internal direction is still not vendor evidence.**
- **A "vendor confirmation pending" note is still not a confirmation.**
- **Accepted evidence is still not a confirmed vendor, a computed spine width, an unblocked cover, a known render environment, artifact generation, a print file, or manufacturing readiness.**
- **No accepted evidence exists in repo truth; 8H stays at `stock-confirmation-missing`, spine not computable, cover blocked.**

## The evidence ladder

`evaluate(input)` returns a structured matrix:

| Level | Meaning | True when |
|---|---|---|
| `material-evidence-contract-known` | The contract is defined (the floor) | always — this module defines it |
| `material-evidence-accepted` | Every required evidence is present and accepted | all blocking evidence is present, source identified, and accepted (no blockers) |

Both higher concerns — the spine inputs and the production ladder — are decided elsewhere (8H / 8A) and are reported here as explicitly-false flags (`spineWidthComputable`, `coverUnblocked`, `renderEnvironmentKnown`, `exportArtifactGenerationReady`, `printFileReady`, `vendorReady`, `manufacturingReady`, `packagingReady`) so nothing can imply that accepting the evidence produced a spine, a cover, an artifact, or readiness.

## Blocker codes (priority order)

`material-evidence-missing` → `evidence-source-missing` → `stock-evidence-missing` → `binding-evidence-missing` → `paper-thickness-evidence-missing` → `board-thickness-evidence-missing` → `material-evidence-not-accepted`.

The order follows the evidence dependency chain (the record must exist, then its source must be identified, then each material fact must be evidenced, then the evidence must be accepted). With the live repo truth, the first missing input is `material-evidence-missing`, so it is the primary blocker. The `material-evidence-not-accepted` blocker is emitted **only** once the evidence is otherwise complete (source identified + all four facts present) but the acceptance flag is not set — so it is the single terminal blocker on a complete-but-unaccepted record. `blockers` is collected most-fundamental-first; `primaryBlocker = blockers[0] || null`; `blockerMessages` are safe, non-CTA, non-private labels aligned 1:1.

## The module — `KMEngine.MessageBookMaterialEvidence` (`src/products/message-book-material-evidence.js`)

Fully pure and dependency-free: no DOM, no clock, no `Date`, no randomness, no I/O, no network, no storage, **no record builders**, and **no file output of any kind**. It reads only already-supplied facts and references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmme1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `LEVEL` / `STATE` / `BLOCKER` / `BLOCKER_ORDER` / `STATUS_TONE` — frozen enums.
- `REQUIRED_EVIDENCE` — frozen descriptor array (`{ state, label, source, present, blocking }` per state).
- `GATED_REASON` — `'not-implemented'`.
- `evaluate(input)` → the matrix (`materialEvidenceContractKnown`, `allEvidenceAccepted`, `states` map, the direction / presence / acceptance booleans, the accepted material values, the explicitly-false higher rungs, and diagnostics).
- `blockerMessage(code)` → a short, safe, non-CTA label.
- `resolveFromContext({ productionDirection, materialEvidence? })` → `{ input, result, display, spineInputMaterial }`. Derives the internal stock/binding direction from a `BOOK_PRODUCTION_DEPS`-shaped object (only when the value is a non-empty string) and the evidence from an optional supplied evidence record. Never invents a fact; with no supplied evidence (the live repo state) the evidence is reported missing.
- `toSpineInputMaterial(result)` → `{ stockConfirmed, bindingConfirmed, materialSpec }`. The honest adapter to 8H's existing input path: a confirmation is true only when its evidence is present AND accepted; `materialSpec` carries a thickness only when its evidence is present AND accepted, else `null`. **8H is not modified.** The cover gate, production direction, and page count are not material evidence and stay with the caller.
- `describeReadiness(result)` → a display view-model `{ tone, headline, detail, blocker }`. `STATUS_TONE.GATED` for any unmet result (the live state); `STATUS_TONE.KNOWN` only when every evidence is present and accepted (and even then the detail states the spine width / render environment / artifact generation are not implemented).
- `describeBoundary()` → a plain-language statement of what the contract decides, what it is **distinct from** (spine inputs / render environment / manufacturing readiness), the rungs it separates, the blocker codes, the not-implemented steps, the evidence source of truth, what it feeds into (8H), `artifactFree: true`, and that it renders nothing, confirms nothing, and produces no file. The `doesNot` statement explicitly says a pending note is not confirmation.

### Input / output shape

```
evaluate({
  internalStockDirectionKnown,   // bool — repo truth (BOOK_PRODUCTION_DEPS.STOCK)
  internalBindingDirectionKnown, // bool — repo truth (BOOK_PRODUCTION_DEPS.BINDING)
  evidence: {                    // a SUPPLIED vendor material evidence record, or null
    source: { identity, version, date },  // provenance
    stockConfirmed,              // bool — vendor stock confirmation evidence
    bindingConfirmed,            // bool — vendor binding confirmation evidence
    paperThicknessPerLeafIn,     // number — vendor paper caliper evidence
    boardThicknessIn,            // number — vendor board thickness evidence
    accepted                     // bool — explicit acceptance for the feed
  } | null
})
=>
{
  contractVersion: 'kmme1',
  productTypeId:   'message-book',
  materialEvidenceContractKnown,             // always true (the floor)
  allEvidenceAccepted,                       // aggregate — true only when all evidence present + accepted
  states,                                    // { '<state>': bool } (8 states)
  internalStockDirectionKnown, internalBindingDirectionKnown, internalMaterialDirectionKnown,
  evidencePresent, evidenceSourcePresent, evidenceSourceIdentified,
  stockEvidencePresent, bindingEvidencePresent,
  paperThicknessEvidencePresent, boardThicknessEvidencePresent,
  evidenceComplete, acceptedFlag, evidenceAccepted,
  acceptedStockConfirmed, acceptedBindingConfirmed,         // for the 8H feed (never invented)
  acceptedPaperThicknessPerLeafIn, acceptedBoardThicknessIn, // number or null
  spineWidthComputable, coverUnblocked,                     // explicitly false — decided by 8H
  renderEnvironmentKnown, exportArtifactGenerationReady, printFileReady,
  vendorReady, manufacturingReady, packagingReady,          // explicitly false — decided elsewhere
  gatedReason: 'not-implemented',
  furthestLevel, blockers, primaryBlocker, blockerMessages
}
```

## Feeding 8H (the adapter)

`toSpineInputMaterial(result)` produces exactly the fields 8H's `resolveFromContext` already consumes:

```
const material = MessageBookMaterialEvidence
    .resolveFromContext({ productionDirection: BOOK_PRODUCTION_DEPS, materialEvidence /* or omitted */ })
    .spineInputMaterial;
// material = { stockConfirmed, bindingConfirmed, materialSpec }

MessageBookSpineInputs.resolveFromContext({
    productionDirection:    BOOK_PRODUCTION_DEPS,
    productionDependencies: { coverGenerationBlocked: <caller>, stockConfirmed: material.stockConfirmed, bindingConfirmed: material.bindingConfirmed },
    materialSpec:           material.materialSpec,
    pageCount:              <caller>
});
```

With no accepted evidence (live), the adapter feeds `stockConfirmed: false`, `bindingConfirmed: false`, `materialSpec: null`, so 8H reports `stock-confirmation-missing`, spine not computable, cover blocked — identical to the current live behavior. Only a future package that supplies and accepts genuine evidence (and, for the cover, opens the cover gate) could advance 8H — the contract never invents it. The integration suite proves both directions against the **real** 8H.

## Live integration — deferred (no-op today)

8I is **engine + tests + docs only**; `index.html` is unchanged. The live 8F/8G/8H export-preflight feed already supplies the spine/cover production dependencies as honest `false` / absent, which is exactly what 8I's adapter produces when no evidence exists. Wiring 8I into the live feed now would route the same `false` values through one more honest layer with **no observable change** and **no live evidence to surface**, so it is deliberately deferred to the future package that first supplies an accepted evidence record. When that happens, the live feed can construct the 8H `productionDependencies`/`materialSpec` via `MessageBookMaterialEvidence.toSpineInputMaterial` instead of the current hardcoded `false`/omitted material spec, and (only then) surface a read-only evidence status. No behavior, copy, or scope-guarded constant changes today.

## Relationship to the existing layers (all intact)

- **5D/5E/6A/6B/6C** — proof approval, proof-preview phase, page composition, and unit generation are untouched.
- **7A/7B/7C/7D/7E** — checkout readiness, live status hook, static capability alignment, and order intent are unchanged.
- **8A** — `MessageBookManufacturingReadiness` engine source is **unchanged**.
- **8B** — the live `#bookManufacturingStatus` path is unchanged.
- **8C/8D** — `MessageBookPrintSpec` and the live `#bookPrintSpecPanel` are unchanged.
- **8E** — `MessageBookExportPipeline` engine source is **unchanged**.
- **8F** — the live `#bookExportPreflightStatus` element and copy are unchanged.
- **8G** — `MessageBookRenderEnvironment` engine source is **unchanged**.
- **8H** — `MessageBookSpineInputs` engine source is **unchanged**; 8I supplies its existing `productionDependencies` (stock/binding) and `materialSpec` (thickness) inputs as honestly-derived (currently false / null) facts gated on accepted evidence.

WhatsApp P1–P6 and the native no-dependency ZIP path are unchanged. No dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign.

## What 8I does not do

No vendor selection, confirmation, contact, or integration, no spine rendering, no cover generation, no spine-width computation, no print-file generation, no export/PDF generation, **no file writing or artifact creation of any kind**, no vendor packet creation, no manufacturing/packaging/shipping behavior, no checkout, payment, cart, real order, or order submission, no address collection, shipping, tax, price, SKU, or line-item behavior, no dependency, no `package.json`, no import/WhatsApp/ZIP change, no UI redesign. It does **not** flip `renderEnvironmentKnown`, `exportPipelineImplemented`, mark `print-file-ready` true, or mark vendor/manufacturing/packaging ready — all remain false/gated. It does **not** compute a spine width or unblock a cover — those stay 8H's job. The module's own source-scan test keeps it free of commerce/production action verbs and side effects (including any `Date`/clock — it is fully pure). A confirmation becomes true, and a thickness is supplied, only when the repo genuinely makes accepted vendor evidence available.

## Coverage

`message-book-material-evidence-tests.mjs` (361, 19 suites): API shape; `LEVEL` / `STATE` (8) / `BLOCKER` (7) / `STATUS_TONE` frozen enums + `BLOCKER_ORDER` / `REQUIRED_EVIDENCE` coverage + safe messages; no evidence → contract-known floor with every input blocker (not the not-accepted blocker, which only applies to complete evidence) and `material-evidence-missing` primary; malformed evidence (non-object → absent; partial/blank source → not identified); missing evidence source → `evidence-source-missing` + acceptance void; missing stock / binding evidence (strict `=== true`, truthy-not-true rejected) → their blockers; missing/malformed paper/board thickness (zero/negative/NaN/Infinity/string rejected) → their blockers; complete-but-unaccepted evidence → single `material-evidence-not-accepted` blocker, feeds nothing, and an accepted flag without an identified source is void; accepted evidence → aggregate true at `material-evidence-accepted` with an adapter payload whose values are derived from the evidence (a different valid spec derives a different payload — not hardcoded) and a defensive null-result adapter; internal direction distinct from evidence (known direction is non-blocking and does not confirm; dropping it keeps an accepted aggregate true; truthy-not-true direction rejected); the higher rungs (spine/cover/render-env/artifact/print/vendor/manufacturing/packaging) always false even when the aggregate is true; `resolveFromContext` honest from live repo truth (direction known, no evidence → `material-evidence-missing` primary, adapter feeds nothing, and a pending-note record stays missing) and from a hypothetical accepted context (adapter feeds, not hardcoded); an **integration cross-check against the REAL `MessageBookSpineInputs` (8H)** proving the live 8I feed keeps 8H at `stock-confirmation-missing` / spine not computable / cover blocked, a fully-accepted 8I hypothetical + an open cover gate + a page count advances 8H to spine computable + cover unblocked (and even then 8H never reaches `print-file-ready`), a closed cover gate keeps 8H's cover blocked despite accepted evidence, partial accepted evidence (board missing) feeds stock/binding/paper while 8H honestly blocks on the missing board, and complete-but-unaccepted evidence keeps 8H at `stock-confirmation-missing`; `describeReadiness` copy matrix + no-unsafe-claim scan; `describeBoundary` disclaimers (incl. the pending-note-is-not-confirmation statement and the 8H feed pointer); purity (deterministic + no input/argument mutation + fresh arrays); and a no-commerce/production-CTA + no-side-effect (incl. no `Date`/no file output) source-scan.
