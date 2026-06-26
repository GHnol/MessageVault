# Message Book Page Composition

**Status:** Active — pagination engine extracted and golden-covered in Message Book Print Proof Fidelity 6B (Page Composition Fidelity + Golden Scenario Coverage); composition-unit generation extracted and golden-covered in 6C (Composition Unit Generation Contract + Golden Coverage).
**Scope:** On-device preview pagination only. This is **not** checkout, printing, manufacturing export, packaging, or vendor handoff, and neither 6B nor 6C added any of those.

---

## Why this exists

Message Book pagination — turning the editorial `messageBookState` into the ordered pages the user reviews as a proof — was implemented entirely inside `index.html` and exercised only indirectly by the Playwright E2E and visual-regression harnesses. There was no deterministic, behaviour-level test that a given book composes into a predictable set of pages, and nothing that locked the page count to the 6A over-limit proof gate. 6B closes that gap by extracting the **pure** pagination math into a tested engine module and golden-covering it, so the proof a user reviews is predictable, testable, and safe to approve.

6B is **behaviour-preserving**: the pagination logic was moved verbatim, the scope-guarded page constants are unchanged (passed into the engine rather than redefined), and no engine state-machine, persistence, or import behaviour changed.

**6C** closes the remaining residual: the **front** of the pipeline, `generateCompositionUnits` (the app-state → composition-units step), was still in `index.html` and golden-covered only indirectly by E2E/VR. 6C moves that math into the same engine as the pure `generateUnits`, leaving `index.html` a thin wrapper, and golden-covers the app-state → units boundary directly. Like 6B it is **behaviour-preserving** — the unit objects are byte/structure-compatible, so `paginateUnits` and the 6A page-limit gate are unaffected. The function is *mostly* pure: the three things it cannot derive from `state` alone (the two editorial text normalizers and the keepsake-group display-name fallback, which depends on global group sequence) are **injected via config**, so the module still owns no app state and no page constants.

## The pipeline

```
messageBookState
  └─ generateCompositionUnits(state, contactName)   (index.html — thin wrapper, injects config)
       └─ KMEngine.BookComposition.generateUnits(state, contactName, config)
            → flat array of composition units  (pure given config; 6C)
  └─ KMEngine.BookComposition.paginateUnits(units, BOOK_COMPOSITION_CONFIG)
       → Page[]  (pure packing: orphan guard, run-splitting, continuation injection)
  └─ KMEngine.BookComposition.enrichPageMetadata(pages, { volumeId, hasTimestamps, pageNumberVisible })
       → Page[]  (physical page numbers, recto/verso, logical page type, counts)
  └─ buildPageDOMElement(page, …)                    (index.html — DOM render, untouched)
```

`renderBookView()` paginates **every** volume to get real page counts, then sets each volume's
over-limit status from the tested bridge:

```
vol.exceedsPageLimit = KMEngine.BookComposition.computePageLimitStatus({
    pageCount: volPages.length,
    maxPages:  state.format.maxPages   // 250
}).exceedsPageLimit;
```

That `exceedsPageLimit` boolean is exactly what `KMEngine.ProofPreviewContract.resolveProofPreviewPhase`
(6A) consumes, so composition and the proof gate cannot drift.

## The module — `KMEngine.BookComposition` (`src/products/book-composition.js`)

Pure, dependency-free (no DOM, no timestamps, no randomness, no I/O) and **owns no page
constants** — page geometry is passed in by the caller, so the scope-guarded
`BOOK_PAGE_LINES` / `BOOK_FEATURED_HEADER_LINES` / `BOOK_CONTINUATION_LINES` remain defined
only in `index.html`.

- `MODULE_VERSION` — `'kmbc1'`.
- `msgLineCount(m)` / `runLineCount(run)` / `groupIntoRuns(messages)` — line-cost + run-grouping helpers.
- `generateUnits(state, contactName, config)` (6C) — the front of the pipeline: turns a Message Book editorial state into the flat composition-unit sequence `paginateUnits` consumes (title-page → optional dedication → per-section force-page-break / divider / header / content → optional branded ending). Sections are filtered to the active volume + `included` and sorted by `orderIndex`; `sectionId` is the positional index within that sorted list. `config = { headerLines, dividerLines, featuredHeaderLines, normalizeSingleLine, normalizeDedication, resolveGroupDisplayName }` — the scope-guarded line weights and the three app-coupled dependencies are passed in (the module owns none of them); the dependencies default to total/pure no-ops if omitted, but the renderer always injects the real implementations.
- `splitRunIntoChunks(unit, maxLines)` / `splitRunForPage(unit, availableLines)` — message-boundary run splitting used by the orphan guard and by oversized-run pre-processing.
- `paginateUnits(rawUnits, config)` — packs units into pages. `config = { pageLines, featuredHeaderLines, continuationLines }`. Rule priority: force-page-break → alwaysOwnPage isolation → section-header orphan guard (place / carve opening slice / push to fresh page) → sender-run soft keep-together → normal placement. Injects a synthetic `section-continuation` unit at the top of each page a section spans.
- `enrichPageMetadata(pages, context)` — mutates pages in place with `physicalPageNumber`, `rectoOrVerso`, `volumeId`, `hasTimestamps`, `pageNumberVisible`, `isFeatured`, `messageCount`, `hasDivider`, and `logicalPageType` (`padding-page` / `title-page` / `dedication-page` / `ending-page` / `continuation-page` / `section-page`).
- `computePageLimitStatus({ pageCount, maxPages })` → `{ pageCount, maxPages, exceedsPageLimit }`. The single bridge that turns a real page count into the over-limit boolean the 6A contract reads. Strictly-greater is over the limit; equal-to-max is within. It does **not** restate the proof contract.

## Wiring

`index.html` keeps `generateCompositionUnits` as a **thin wrapper** (6C): it injects the
scope-guarded line weights plus the app-coupled dependencies — `bookEditorial.normalizeSingleLine`,
`bookEditorial.normalizeDedication`, and a `resolveGroupDisplayName` closure over
`keepsakeGroups` + `getGroupDisplayName` — and delegates the math to
`KMEngine.BookComposition.generateUnits`. **No duplicate inline generator is kept** (6B
precedent), so composition units have a single source of truth. The wrapper's `(state, contactName)`
signature is unchanged, so every call site — `renderBookView`, `renderBookCanvas`, the
`ProductPreflight` `PAGINATION_STABILITY` check, and the `window.__km.generateCompositionUnits`
bridge — is untouched. The DOM builders (`renderUnitToDOM`, `buildPageDOMElement`) and the
pagination delegations (`paginateUnits` / `enrichPageMetadata` / `captureBookRenderSpec`) are
unchanged; `BOOK_COMPOSITION_CONFIG` is still built from the existing constants and passed to
`paginateUnits`.

## Golden coverage — `book-composition-tests.mjs`

204 deterministic Node tests (`vm`-loaded, no DOM). Pagination side (6B): line-cost helpers;
empty / one-section / multi-section + order-preserved / force-page-break / continuation-injection /
featured / alwaysOwnPage-isolation scenarios; direct run-splitting + oversized-run pre-split during
pagination; `enrichPageMetadata` metadata + logical-page-type mapping; `computePageLimitStatus`
boundaries; the **composition → page-limit → 6A `ProofPreviewContract` consistency
cross-check** (over-limit → `not-ready-over-limit` blocks approve/re-review for
none/pending-review/stale; under-limit stays reviewable; reversible); determinism + input
purity; and a commerce/production source-scan + DOM/Date/random purity guard.

Unit-generation side (6C, Suites 17–25): frontmatter/backmatter (title always; dedication only
when enabled **and** non-empty after normalization; branded vs plain ending); section ordering by
`orderIndex` with `included` + active-volume filtering and positional `sectionId`; display-name
priority (`customTitle` via `normalizeSingleLine` → `customName` via trim → `resolveGroupDisplayName`
fallback → no header when unresolved); section-header vs featured-header line weights; sparse
dividers (bound into the header, standalone when header-less, excluded for featured); forced page
breaks (and the first-section `si>0` guard); messages vs sender-runs with order/identity preserved,
`showTs` from `timestampMode`, and `featured` propagation; multi-volume scoping with per-volume
`sectionId` re-basing; and determinism + no-state-mutation + a `generateUnits → paginateUnits →
computePageLimitStatus` pipeline-integration check.

## Related

- `docs/architecture/message-book-proof-preview-contract.md` — the 6A proof-preview phase contract that consumes `exceedsPageLimit`.
- `docs/qa/test-strategy.md` — Layer 1 suite registry and baseline.
