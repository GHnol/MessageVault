# Message Book Page Composition

**Status:** Active — engine extracted and golden-covered in Message Book Print Proof Fidelity 6B (Page Composition Fidelity + Golden Scenario Coverage).
**Scope:** On-device preview pagination only. This is **not** checkout, printing, manufacturing export, packaging, or vendor handoff, and 6B added none of those.

---

## Why this exists

Message Book pagination — turning the editorial `messageBookState` into the ordered pages the user reviews as a proof — was implemented entirely inside `index.html` and exercised only indirectly by the Playwright E2E and visual-regression harnesses. There was no deterministic, behaviour-level test that a given book composes into a predictable set of pages, and nothing that locked the page count to the 6A over-limit proof gate. 6B closes that gap by extracting the **pure** pagination math into a tested engine module and golden-covering it, so the proof a user reviews is predictable, testable, and safe to approve.

6B is **behaviour-preserving**: the pagination logic was moved verbatim, the scope-guarded page constants are unchanged (passed into the engine rather than redefined), `generateCompositionUnits` and the DOM render layer stay in `index.html`, and no engine state-machine, persistence, or import behaviour changed.

## The pipeline

```
messageBookState
  └─ generateCompositionUnits(state, contactName)   (index.html — app-state coupled)
       → flat array of composition units
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
- `splitRunIntoChunks(unit, maxLines)` / `splitRunForPage(unit, availableLines)` — message-boundary run splitting used by the orphan guard and by oversized-run pre-processing.
- `paginateUnits(rawUnits, config)` — packs units into pages. `config = { pageLines, featuredHeaderLines, continuationLines }`. Rule priority: force-page-break → alwaysOwnPage isolation → section-header orphan guard (place / carve opening slice / push to fresh page) → sender-run soft keep-together → normal placement. Injects a synthetic `section-continuation` unit at the top of each page a section spans.
- `enrichPageMetadata(pages, context)` — mutates pages in place with `physicalPageNumber`, `rectoOrVerso`, `volumeId`, `hasTimestamps`, `pageNumberVisible`, `isFeatured`, `messageCount`, `hasDivider`, and `logicalPageType` (`padding-page` / `title-page` / `dedication-page` / `ending-page` / `continuation-page` / `section-page`).
- `computePageLimitStatus({ pageCount, maxPages })` → `{ pageCount, maxPages, exceedsPageLimit }`. The single bridge that turns a real page count into the over-limit boolean the 6A contract reads. Strictly-greater is over the limit; equal-to-max is within. It does **not** restate the proof contract.

## Wiring

`index.html` keeps `generateCompositionUnits` (it reads `keepsakeGroups`, `bookEditorial`, and
`getGroupDisplayName`) and the DOM builders (`renderUnitToDOM`, `buildPageDOMElement`). The
former pagination functions are now thin delegations to the module (preserving the existing
call sites and the `window.__km` bridge entries `generateCompositionUnits` / `paginateUnits` /
`enrichPageMetadata` / `captureBookRenderSpec`). `BOOK_COMPOSITION_CONFIG` is built from the
existing constants and passed to `paginateUnits`.

## Golden coverage — `book-composition-tests.mjs`

127 deterministic Node tests (`vm`-loaded, no DOM): line-cost helpers; empty / one-section /
multi-section + order-preserved / force-page-break / continuation-injection / featured /
alwaysOwnPage-isolation scenarios; direct run-splitting + oversized-run pre-split during
pagination; `enrichPageMetadata` metadata + logical-page-type mapping; `computePageLimitStatus`
boundaries; the **composition → page-limit → 6A `ProofPreviewContract` consistency
cross-check** (over-limit → `not-ready-over-limit` blocks approve/re-review for
none/pending-review/stale; under-limit stays reviewable; reversible); determinism + input
purity; and a commerce/production source-scan + DOM/Date/random purity guard.

## Related

- `docs/architecture/message-book-proof-preview-contract.md` — the 6A proof-preview phase contract that consumes `exceedsPageLimit`.
- `docs/qa/test-strategy.md` — Layer 1 suite registry and baseline.
