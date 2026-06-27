# Message Book Internal Print-Spec Selection Contract

**Status:** Active — introduced in Message Book Manufacturing Readiness 8C (Print Spec Selection Contract + Export-Spec Gate).
**Scope:** A local-first, deterministic **internal print-spec selection and validation contract** — only. It is **not** print-file generation, export/PDF generation, vendor selection, vendor confirmation, manufacturing submission, packaging, shipping, checkout, payment, cart/order creation, or order submission, and 8C added none of those. It defines and validates *whether an internal, KeepMees-owned print specification is selected and valid for the current Message Book proof*, and bridges that single fact into the 8A production-readiness boundary so the `print-spec-not-selected` blocker can clear.

---

## Why this exists

8A (`MessageBookManufacturingReadiness`) reports a production-readiness ladder whose first blocker above the checkout/intent layers is **`print-spec-not-selected`**. Before 8C there was no module that could ever satisfy it: `printSpecSelected` was a hard-coded `false` in 8A's `CAPABILITIES`, with no contract describing *what* an internal print spec is or *when* it is valid for a proof.

8C fills exactly that gap with the smallest safe step: it defines the **internal print spec** as a selectable, validatable contract and produces the one capability flag 8A already consumes. It is the **first genuine production-capability layer** — and it deliberately stops at "internal spec selected and valid", well short of an export pipeline, a vendor, or any production action.

## The product truth this locks in

An internal print spec is **not** the same as any of the strictly-higher gates, all of which remain not-implemented:

| Layer | Question | State after 8C |
|---|---|---|
| **Internal print spec (8C)** | **Is an internal, KeepMees-owned print spec selected and valid for this proof?** | **Implemented (this contract)** |
| Export pipeline | Could a print/export file actually be produced? | Not implemented |
| Vendor confirmation | Has a real print vendor accepted the spec/file? | Not implemented |
| Production readiness (8A/8B) | Is the full manufacturing ladder above checkout met? | Gated — every rung above export-spec-known is false |

Stated plainly, and enforced by the tests:

- **A local order intent is still not a real order.**
- **A print spec selection is still not a print file.**
- **A print spec selection is still not vendor-ready.**
- **A print spec selection is still not manufacturing-ready.**

## The internal draft spec — repo source of truth

The internal spec encodes the manufacturing decisions recorded as **LOCKED** in `docs/ops/vendor-manufacturing-register.md` ("made and encoded in the software regardless of vendor"):

| Field | Value | Status |
|---|---|---|
| Trim size | `7x10` | LOCKED |
| Binding | `casebound-hardcover` | LOCKED |
| Interior stock | `matte-premium-text` | LOCKED |
| Parity modulus | `2` (even page count) | LOCKED |
| Multi-volume model | `separate-physical-books` | LOCKED |
| PDF spec target | `PDF/X-4` | Locked direction, provisional per vendor |
| Emoji strategy | `print-safe-set` | Locked direction |

**Geometry source of truth is not duplicated.** The authoritative runtime geometry (trim inches, bleed, safe inset, margins, parity modulus) lives in `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` in `index.html` — both scope-guarded. This contract declares the selectable spec **identity** plus the **selection/validation rules**, and *points at* those constants for the numbers; it does not own, restate, or mutate the provisional geometry. The spec descriptor is explicit that it is **`vendorConfirmed: false`** and **`exportPipelineImplemented: false`**.

## Selection states

`evaluate({ selectedSpecId, pageCount, maxPages })` returns a structured result whose `state` is one of:

| State | Meaning |
|---|---|
| `none` | No internal print spec is selected (`selectedSpecId` null/empty/non-string) |
| `unknown` | A spec id was supplied but is not the recognized internal spec |
| `internal-selected` | The internal spec is selected but not yet valid for the proof |
| `internal-valid` | The internal spec is selected **and** valid for the current proof |

## Validation rules

Validity (`internalSpecValid === true`) requires **all** of:

1. `selectedSpecId` is the known internal spec id (`message-book-internal-7x10-hardcover-v1`).
2. `pageCount` is a positive integer (a printable book has ≥ 1 page).
3. `maxPages` is a known positive number (supplied by the caller from the existing pagination / 6A page-limit signal — this contract does **not** invent a hard page maximum).
4. `pageCount <= maxPages` (equal is within, strictly-greater is over — the same convention as `BookComposition.computePageLimitStatus`).

**Parity is reported, not enforced.** `pageBounds.parityOk` reflects `pageCount % 2 === 0`, but an odd page count within bounds is still valid: KeepMees owns even-page padding via `BOOK_PARITY`, so an odd raw count is padded downstream, not rejected here.

Blocker codes (priority order, `primaryBlocker = blockers[0]`): `print-spec-not-selected` → `print-spec-unknown` → `print-spec-page-count-invalid` → `print-spec-page-bounds-unknown` → `print-spec-over-page-limit`. Each maps to a safe, non-CTA, non-private message.

Downstream gates are always reported as explicitly false so a selection can never imply more than it is: `vendorConfirmationMissing: true`, `exportPipelineMissing: true`, and `vendorReady` / `exportReady` / `manufacturingReady` / `packagingReady` all `false` with `gatedReason: 'not-implemented'`.

## The module — `KMEngine.MessageBookPrintSpec` (`src/products/message-book-print-spec.js`)

Fully pure and dependency-free: no DOM, no clock, no `Date`, no randomness, no I/O, no network, no storage, **no record builders**. It references no sibling module at runtime.

- `CONTRACT_VERSION` — `'kmps1'`.
- `PRODUCT_TYPE_ID` — `'message-book'`.
- `INTERNAL_SPEC_ID` — `'message-book-internal-7x10-hardcover-v1'`.
- `INTERNAL_DRAFT_SPEC` — frozen descriptor (identity + LOCKED facts + provisional direction + `vendorConfirmed:false` + `exportPipelineImplemented:false`).
- `SELECTION_STATE` / `BLOCKER` — frozen enums. `GATED_REASON` — `'not-implemented'`.
- `isKnownSpecId(id)` / `getInternalSpec()` / `blockerMessage(code)`.
- `evaluate({ selectedSpecId, pageCount, maxPages })` → the selection/validation result.
- `toManufacturingCapabilities(result)` → `{ printSpecSelected }` — the bridge to 8A.
- `describeBoundary()` → a plain-language statement of what the contract decides, what an internal spec **is not** (a print file / an export pipeline / a vendor-confirmed spec / manufacturing readiness), the not-implemented gates, and that the geometry source of truth is `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY`.

## Integration with 8A — the existing input path (8A unchanged)

8A's `evaluate` / `resolveFromReadiness` already accept a `printSpecSelected` capability. 8C integrates **through that existing input path** — `message-book-manufacturing-readiness.js` is **not modified**. The bridge lives in the 8C module (so 8A keeps referencing no sibling module at runtime):

```js
const sel  = MessageBookPrintSpec.evaluate({ selectedSpecId, pageCount, maxPages });
const caps = MessageBookPrintSpec.toManufacturingCapabilities(sel);   // { printSpecSelected: <valid> }
const out  = MessageBookManufacturingReadiness.resolveFromReadiness({ readiness, intent, capabilities: caps });
```

`toManufacturingCapabilities` flips **only** `printSpecSelected`, and only when the internal spec is selected **and** valid. All higher capabilities are omitted (8A reads them as `false`). Consequences, all verified against the real 8A engine:

- **No spec / unknown spec / selected-but-invalid spec** → `printSpecSelected: false` → 8A primary blocker stays `print-spec-not-selected`.
- **Valid internal spec** → `printSpecSelected: true` → 8A clears `print-spec-not-selected`, reaches `export-spec-known`, and the next blocker is **`export-pipeline-not-implemented`** — and no higher rung advances (`printFileReady` / `vendorReady` / `manufacturingReady` / `packagingReady` stay `false`).
- A valid spec never jumps the queue: under an ineligible proof, 8A still reports `checkout-not-eligible`.
- The **8B live path is unaffected**: it calls `resolveFromReadiness` with no `capabilities`, so the default all-false `CAPABILITIES` still report `print-spec-not-selected` in the live app until a future package wires a selection in.

## What 8C does not do

No print-file generation, no export/PDF generation, no vendor selection, confirmation, or integration, no manufacturing/packaging/shipping behavior, no checkout, payment, cart, real order, or order submission, no address collection, shipping, tax, price, or line-item behavior, no dependency, no `package.json`, no import/WhatsApp/ZIP change, and no UI (engine + tests + docs only). The module's own source-scan test keeps it free of commerce/production action verbs and side effects (including any `Date`/clock — it is fully pure). The scope-guarded `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` constants are read-only references, never modified.

## Coverage

`src/tests/message-book-print-spec-tests.mjs` (**306**, 14 suites): API shape; `SELECTION_STATE` / `BLOCKER` frozen enums + safe messages; the `INTERNAL_DRAFT_SPEC` descriptor matching the LOCKED register facts + `vendorConfirmed`/`exportPipelineImplemented` false + frozen + geometry pointer; no-spec / unknown-spec / valid-spec selection; page count **under / at / over** allowed bounds + invalid count + unknown bounds; parity reported-not-enforced; selection implies no downstream readiness; the `toManufacturingCapabilities` bridge (only `printSpecSelected`, valid-gated, defensive); `describeBoundary`; purity (deterministic + no input mutation + fresh arrays); a no-commerce/production-CTA + no-side-effect source-scan; and a real-`MessageBookManufacturingReadiness` integration proving the `print-spec-not-selected` → `export-pipeline-not-implemented` transition.

`src/tests/message-book-manufacturing-readiness-tests.mjs` Suite 25 (324 → **340**) proves the same transition from the 8A side against the real 7A gate + 7D/7E intent shell + 8C print-spec contract, and that the 8B live (no-capabilities) path is unchanged.

---

## 8D — Live Print Spec Selection + Production Status Bridge

**Status:** Active — introduced in Message Book Manufacturing Readiness 8D. 8D wires this 8C contract into the live Message Book app as a **local-only** print-spec selection/status surface, and bridges a selected-and-valid internal spec into the 8B production-readiness status so the live app advances from `print-spec-not-selected` to `export-pipeline-not-implemented` once the lower gates are satisfied. It is still not export, not PDF generation, not vendor selection, not manufacturing, not checkout, not payment, and not order submission.

### Engine additions (8D)

`KMEngine.MessageBookPrintSpec` gains a small, pure display + selection-helper layer (no DOM, no clock, no I/O):

- `SELECTION_TONE` — frozen `{ SELECTED: 'selected', UNSELECTED: 'unselected', BLOCKED: 'blocked' }`.
- `describeSelection(result)` → `{ tone, headline, detail }`. `internal-valid` → selected tone + "Export pipeline is still not implemented."; a selected-but-invalid (over-limit / bounds-unknown / page-count-invalid) or unknown spec → blocked tone + the safe blocker message; nothing selected → unselected tone + "No print specification selected".
- `describeActions(result)` → `[{ action, label }]`. Offers `use-spec` "Use internal print spec" when no internal spec is selected, and `clear-spec` "Clear print spec" when one is. No commerce/production CTA (guarded by the suite scan).
- `coerceSelectedSpecId(value)` → the known internal id when the stored value is exactly that id, otherwise `null` — the safe restore coercion.

### Live wiring (`index.html`)

`index.html` loads `src/products/message-book-print-spec.js` and renders a read-write `#bookPrintSpecPanel` — a sibling of the 7B `#bookReadinessStatus`, 7E `#bookOrderIntentPanel`, and 8B `#bookManufacturingStatus`, **outside `#bookCanvas`** (so VR Scenario A, which captures only `#bookCanvas` pages, is unaffected). On each `renderBookProofPanel()`:

1. `renderBookPrintSpecPanel(readinessResult, state)` evaluates the local selection (`messageBookPrintSpecSelection`) against the live proof page bounds — `state.estimatedPageCount` (active-volume page count) and `state.format.maxPages` (the same numbers the proof flow already computed) — via `evaluate()`, renders the selection status + the **Use internal print spec** / **Clear print spec** control, and returns the result.
2. `renderBookManufacturingStatus(readinessResult, orderIntentView, printSpecResult)` bridges that result via `toManufacturingCapabilities` into 8A's existing `capabilities.printSpecSelected` input. With no result (or no print-spec module) it omits `capabilities`, so 8B's all-false default is preserved.

Selecting the internal spec is local-only (`messageBookPrintSpecSelection = INTERNAL_SPEC_ID`); it is never a vendor-confirmed spec and implies no export / vendor / manufacturing / packaging readiness. The selection is **revalidated against the current page bounds on every render**, so an over-limit book never advances even with a spec selected.

### Persistence (8D)

A single optional `projectSession.messageBookPrintSpecSelection` field (a **string** spec id or `null`) mirrors the 7E `messageBookOrderIntent` pattern: `ProjectPersistence.createSnapshot` carries the string (non-string / empty → `null`), `validate` requires a string or `null` if present (older snapshots still validate), and `ProjectSessionRestore` lists it in `KNOWN_SESSION_FIELDS` (no unknown-field warning) and returns it raw. `handleProjectFileLoad` restores it through `coerceSelectedSpecId` (unknown / malformed → `null`); the current page bounds re-govern it on the next render, so a restored selection can never advance production on its own.

### Live status matrix (8D)

| `messageBookPrintSpecSelection` | page bounds | `#bookPrintSpecPanel` | 8B manufacturing status (lower gates satisfied) |
|---|---|---|---|
| `null` | — | "No print specification selected" + Use control | `print-spec-not-selected` |
| internal id | within | "Internal print spec selected" + "Export pipeline is still not implemented." + Clear | **`export-pipeline-not-implemented`** |
| internal id | over limit | "Internal print spec selected" + over-limit detail + Clear | `print-spec-not-selected` |

The 8B manufacturing status only *advances* when the lower gates (checkout eligibility + local intent, `LOCAL_INTENT_REQUIRED = true`) are also satisfied; a valid spec never jumps an unmet lower gate (`checkout-not-eligible` / `no-local-intent` still show first).

### 8D coverage

`message-book-print-spec-tests.mjs` 306 → **377** (Suites 15–20: helper API surface, `describeSelection` / `describeActions` copy matrices, `coerceSelectedSpecId`, a display-copy safety scan, and a real-8A live select/clear/restore-revalidate mapping). `message-book-manufacturing-readiness-tests.mjs` 340 → **348** (Suite 26 — the live `renderBookManufacturingStatus` 8D mapping: no spec → `print-spec-not-selected`, valid spec → `export-pipeline-not-implemented`, over-limit → no advance, 8B no-capabilities path unchanged). `project-persistence-tests.mjs` 183 → **198** (the `messageBookPrintSpecSelection` snapshot/validate/restore round-trip). 8D adds no export/PDF/print/vendor-packet generation, selects no vendor, and adds no checkout/payment/cart/order/order-submission/manufacturing/packaging behavior; no dependency; the 8A engine source and the 8B no-capabilities path are unchanged; `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` are read-only references.

---

## Relationship to the 8E export-pipeline preflight

Message Book Manufacturing Readiness 8E adds `KMEngine.MessageBookExportPipeline` — an artifact-free **export-pipeline preflight** that sits one rung above this contract. It **reads** a `MessageBookPrintSpec.evaluate` result (via `resolveFromContext`): a valid internal spec satisfies the export pipeline's `print-spec-valid` input, and a recognized internal spec also supplies the `export-target-known` (PDF/X-4 direction) and the `parity-known` / `page-count-known` facts. This contract is **unchanged** by 8E — 8E adds no helper here and selects no spec; it only consumes this contract's result. Crucially, a valid internal print spec is **not** an export pipeline: even when 8E reaches `export-inputs-known`, artifact generation remains not implemented and the 8A blocker stays at `export-pipeline-not-implemented`. See `docs/architecture/message-book-export-pipeline-contract.md`.
