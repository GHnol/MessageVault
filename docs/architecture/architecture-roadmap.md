# Architecture Roadmap — KeepMees / MessageVault

**Last updated:** 2026-06-02 (Package 5B complete)
**Status:** Active

---

## Architecture posture

`index.html` is the current runtime shell only as an interim bridge. The approved near-term path is modular plain JS extraction into `src/` (KMEngine pattern). Framework and build-system migration is a tracked future decision — deferred, not rejected. Re-evaluate when render/proof architecture stabilizes or when UI state, persistence, proofing, and render specs become too complex for the current shell.

---

## Current architecture (post-Package 5B)

```
index.html               — entire app: UI, CSS, composition logic, pagination, rendering
src/
  core/
    import-adapters.js        — adapter registry + import result shape
    normalized-memory.js      — canonical message model (NormalizedMemory)
    project-session.js        — session container
    source-platforms.js       — source platform registry
    keepsake-group.js         — KeepsakeGroup model
  adapters/
    imessage-chatdb-adapter.js
    txt-export-adapter.js
    manual-entry-adapter.js
    future-adapter-stubs.js
  state/
    session-serialization.js  — serialize/restore ProjectSession
  products/
    product-statuses.js                — status enums
    product-catalog.js                 — product definitions
    product-eligibility.js             — per-product eligibility evaluators
    legacy-keepsake-types-bridge.js
    product-render-spec.js             — render spec registry (constants + 10 specs)
    product-render-spec-resolver.js    — resolve spec against a KeepsakeGroup
    prototype-preview-registry.js      — preview entry registry (constants + 6 entries for render planning targets)
    prototype-preview-resolver.js      — resolve preview readiness against a KeepsakeGroup
    product-experience-readiness.js    — combined readiness resolver (all 4 layers); EXPERIENCE_STATUS; resolveForProduct/resolveAllForGroup
    product-experience-consumer.js     — app-side bridge to ProductExperienceReadiness; null-safe; view-model layer only
    proof-approval-state.js            — KMEngine.ProofApprovalState; STATUS (5 constants); canTransition; create; transition — Package 5A
    proof-approval-ux.js               — KMEngine.ProofApprovalUX; initialize, getState, submitForReview, getStatusLabel, getAllowedUserActions, serialize, restore — Package 5B
index.html (keepsakes view)          — buildFormatAvailability() injects .ks-format-availability section per card via ProductExperienceConsumer — Package 4E
index.html (proof panel)             — #bookProofPanel, CSS, renderBookProofPanel(), save/restore wiring — Package 5B
  tests/
    km-engine-tests.mjs
    keepsake-group-tests.mjs
    product-catalog-tests.mjs
    product-eligibility-tests.mjs
    product-render-spec-tests.mjs
    prototype-preview-registry-tests.mjs
    product-experience-readiness-tests.mjs
    product-experience-consumer-tests.mjs
    proof-approval-state-tests.mjs     — 137 tests; state model, transitions — Package 5A
    proof-approval-ux-tests.mjs        — 77 tests; UX layer API, serialize/restore — Package 5B
```

All modules expose into `window.KMEngine`. No build step.

---

## Near-term additions (Package 3 and beyond)

The following additions are expected without architectural change:

- `src/products/product-draft.js` — ProductDraft model (per-group, per-product draft container)
- `src/core/preflight-runner.js` — executes the 10 checks in `BOOK_PREFLIGHT_CHECK_REGISTRY`
- `src/tests/` — additional test files per new module
- Session UI wiring (save/restore flow surfaced in index.html)

---

## Architectural inflection points

These are decisions that, when triggered, require a deliberate architectural discussion rather than a package-scoped implementation.

### Inflection 1 — Server-side PDF pipeline

**Trigger:** when PDF generation is unblocked (vendor confirmed, cover unblocked gate met)
**Impact:** introduces a server component; `index.html` becomes a client that POSTs a render spec to a server endpoint
**Pre-work required:** `captureBookRenderSpec` must be fully specified; render spec format must be finalized with vendor

### Inflection 2A — Local / session persistence (near-term)

**Trigger:** users must be able to save and resume Message Book projects across sessions — they may take days to construct keepsake sets and must not lose progress
**Impact:** `ProjectSession` serialization (already exists in `SessionSerialization`) must be backed by IndexedDB, export/import session files, or equivalent privacy-preserving local storage
**Pre-work required:** session format versioning; migration path; UI for save/restore (Package 3 scope)

### Inflection 2B — Cloud account persistence (deferred)

**Trigger:** when cross-device account access demand justifies the infrastructure investment
**Impact:** introduces backend auth, cloud storage, account model
**Pre-work required:** local/session persistence (Inflection 2A) must exist first; server infrastructure must be established

### Inflection 3 — Checkout / commerce

**Trigger:** when vendor is confirmed and commerce readiness status changes from `blocked`
**Impact:** introduces order flow, pricing, and likely a server component for order submission
**Pre-work required:** `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` gate must be met; ProductCatalog commerce status updated

### Inflection 4 — Build system introduction

**Trigger:** when `index.html` maintenance burden exceeds acceptable threshold, OR when multiple engineers work on the codebase simultaneously
**Impact:** changes the development and delivery model significantly
**Pre-work required:** deliberate decision on framework and toolchain; migration plan for existing index.html logic

---

## Principles that govern all architecture decisions

1. No message data leaves the user's device during import.
2. The app must remain usable in a browser without any server dependency at launch.
3. Engine logic must remain unit-testable via Node.js `.mjs` files without a browser.
4. Pagination output must remain deterministic; `BOOK_PAGINATION_VERSION` gates changes.
5. PDF output must be server-side when implemented.
