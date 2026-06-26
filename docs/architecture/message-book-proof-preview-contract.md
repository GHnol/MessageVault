# Message Book Proof Preview Contract

**Status:** Active — introduced in Message Book Print Proof Fidelity 6A (Proof Preview Contract + Fidelity Gap Audit).
**Scope:** Local-first proof review only. This is **not** checkout, printing, manufacturing export, or vendor handoff, and 6A added none of those.

---

## Why this exists

Before 6A the proof-panel "phase" was decided inline in `index.html` `renderBookProofPanel()` and was untested. It also ignored the page-limit signal the app already computes, so a Message Book over its 250-page limit could still read "Ready for proof review" and be approved. 6A extracts that decision into a single tested engine module and closes the page-limit gap, without changing the 5D fingerprint/staleness behaviour or the 5E view-model copy table.

## The four things the contract distinguishes

1. **The editable, generated preview** — `messageBookState` rendered to the on-screen book canvas (`renderBookView` → pagination → pages). The user edits this freely.
2. **The proof surface being reviewed** — that same on-screen preview, whose identity is pinned by the 5D proof fingerprint (`ProofApprovalState.computeProofFingerprint(bookState, contactName)`).
3. **The approvable proof state** — a *reviewable* proof (a phase that is not `not-ready-*`). Approval is recorded on this device by `ProofApprovalUX.approve(...)`.
4. **What is explicitly NOT covered** — reviewing or approving a proof never buys, prints, or sends anything. It implies no checkout, printing, production, or vendor readiness. `ProofPreviewContract.describeScope()` states this in plain language, and the module source is kept free of commerce/production vocabulary (own source-scan test).

## The module — `KMEngine.ProofPreviewContract` (`src/products/proof-preview-contract.js`)

Pure, dependency-free (no DOM, no `Date`, no `Math.random`, no I/O).

- `CONTRACT_VERSION` — `'kmppc1'`.
- `PHASE` — the frozen set of panel phases (a superset of the 5D approval statuses; the `none` status splits into the readiness sub-states `not-ready-empty` / `not-ready-over-limit` / `not-ready-failed` / `not-ready-checking` / `ready`).
- `firstBlockingReason(input)` → `'empty' | 'over-limit' | 'check-failed' | 'checking' | null`. Priority order: empty content, then over the page limit, then a failed book check, then still-checking. `null` means the preview is reviewable.
- `resolveProofPreviewPhase(input)` → the single source of truth for the panel phase. For the pre-submission `none` status it applies the readiness gate above (including the page-limit gate). The page-limit blocker also has **priority over the two actionable post-submission phases**: an over-limit `pending-review` (which would offer **Approve**) or `stale` (which would offer re-review) proof resolves to `not-ready-over-limit` so it cannot be approved or re-reviewed until it fits. **Every other status maps through 1:1** so 5D staleness and the 5E pending → approved → stale flow are otherwise untouched.
- `isReviewablePhase(phase)` → `false` only for the `not-ready-*` phases.
- `describeScope()` → the plain-language descriptor of what the user reviews / what approval means / what it is not yet for.

`input` shape (all already computed by the app): `{ approvalStatus, hasContent, exceedsPageLimit, anyBookCheckFailed, allBookCheckPassed }`.

## The page-limit gate (the 6A fidelity fix)

`renderBookView()` already computes `state.exceedsPageLimit = pages > state.format.maxPages` (max 250) per volume and renders the `.book-limit-warning`. 6A feeds that same signal into `resolveProofPreviewPhase`. When a `none`-status book is over the limit, the panel shows the new `not-ready-over-limit` phase: label "Not ready for proof review", the shared `book-proof-notready` status class, a page-limit hint, and **no actions** — so the book cannot be marked ready and therefore cannot be approved until it fits.

The same blocker has **priority over the actionable post-submission phases**: an over-limit `pending-review` proof (which would otherwise offer **Approve proof**) and an over-limit `stale` proof (which would otherwise offer the re-review submit) both resolve to `not-ready-over-limit` as well — no actions — so a book that is marked ready and *then* edited past the limit cannot be approved, and a stale proof cannot be re-reviewed, until it fits again. Over-limit takes priority because an over-limit proof is not reviewable. The gate is reversible: bringing the book back under the limit restores the prior status and its action (the "Ready for proof review" submit, the Approve action, or the re-review submit) on the next render.

As of Print Proof Fidelity 6B, the page count and the `exceedsPageLimit` boolean fed into `resolveProofPreviewPhase` are produced by the tested composition engine `KMEngine.BookComposition` — the same module that paginates the preview — via `computePageLimitStatus({ pageCount, maxPages })` (strictly-greater is over; equal-to-max is within). The full composition → page count → page-limit → proof-preview-contract path is locked by deterministic golden coverage in `book-composition-tests.mjs`. See `docs/architecture/message-book-page-composition.md`.

## Wiring

`index.html` `renderBookProofPanel()` calls `ProofPreviewContract.resolveProofPreviewPhase(...)` to pick the phase, then renders it through the unchanged 5E `ProofApprovalUX.getProofPanelCopy(phase)` view-model. The prior inline mapping is retained as a defensive fallback if the module is ever unavailable. All committed proof-panel DOM ids (`bookProof{Submit,Approve,Cancel,Resubmit}Btn`), the `book-proof-*` classes, and the E2E-locked `pending-review` text are preserved.

## Known residual

The over-limit blocker covers the pre-submission `ready` path **and** the actionable post-submission phases (`pending-review`, `stale`): a book edited past the page limit after being marked ready cannot be approved, and a stale proof cannot be re-reviewed, until it fits. An `approved` proof is not re-gated here because any proof-affecting over-limit edit changes the 5D fingerprint and moves the approval to `stale` (which is then gated); the engine-only `changes-requested` / `revoked` states expose no approve/re-review action to block. The blocker keys on the page limit specifically, so a still-running or failed book check does not rewrite an already-submitted status — only the page limit does. The 5D approved→stale staleness path and the rest of the 5E pending/approved/stale flow are otherwise unchanged.
