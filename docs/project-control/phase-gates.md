# KeepMees Phase Gates

**Last updated:** 2026-05-17 (America/New_York)
**Owner:** Coordinator / Project Control
**Purpose:** Gates prevent premature expansion and fake progress. A gate must genuinely pass before the work it guards may begin. No gate may be bypassed without an explicit, recorded Coordinator decision.

Each gate: purpose · entry criteria · exit criteria · required artifacts · required decisions · verification · owner lane · failure conditions · what cannot happen before pass.

---

## Gate 1 — Foundation Operating System Gate

- **Purpose:** Ensure the repo-native operating system + Project Control Tower exist and are merged before resuming product development (Package 5A).
- **Entry:** Package 2.8 Tower built.
- **Exit:** Tower reviewed, approved, committed, merged to main; status sync done; `coordinator-weekly-sync.md` active.
- **Required artifacts:** all `docs/project-control/` files; updated `CURRENT_STATE.md`.
- **Required decisions:** Coordinator approval of the Tower; explicit Package 5A authorization.
- **Verification:** `git log` shows Tower merge; Operator Mode closeout report produced.
- **Owner lane:** Coordinator / Project Control.
- **Failure conditions:** Tower not merged; Package 5A started while Tower unapproved.
- **Cannot happen before pass:** Package 5A code; any new product development package.

## Gate 2 — Product Truth Gate

- **Purpose:** Keep product scope honest (KeepMees ≠ only Message Book; no unsupported claims).
- **Entry:** strategy + decision register exist.
- **Exit:** `master-project-truth.md` + `decision-register.md` current; format-availability surface implies no commerce/manufacturing readiness (DONE, Package 4E).
- **Required artifacts:** strategy bank; decision register; format availability surface.
- **Required decisions:** locked DEC-P/V/ID set respected.
- **Verification:** doc review at Monthly Roadmap Reset.
- **Owner lane:** Product Strategy.
- **Failure conditions:** any doc/surface claims readiness a SKU lacks; KeepMees reduced to Message Book.
- **Cannot happen before pass:** public product claims; marketing of unbuilt capability.

## Gate 3 — Preview Fidelity Gate

- **Purpose:** Distinguish composition-faithful (near-term) from 1:1 print fidelity (north star) honestly (DEC-V-07).
- **Entry:** composition engine stable (Phase 5).
- **Exit:** documented, bounded delta between preview and the Figma master; no claim of pixel-perfect print before verified.
- **Required artifacts:** preview-fidelity verification approach; delta doc.
- **Required decisions:** acceptance of near-term fidelity position.
- **Verification:** comparison against Figma master once it exists.
- **Owner lane:** Preview and Print Fidelity.
- **Failure conditions:** claiming print fidelity not yet verified; redesign started without authorization.
- **Cannot happen before pass:** marketing "exact print" claims; print-pipeline lock-in.

## Gate 4 — Message Book MVP Gate

- **Purpose:** Confirm Message Book preview MVP is real (import → select → group → compose → preview → save/restore).
- **Entry:** Phases 2–5 complete.
- **Exit:** E2E green across the full path incl. real files; deterministic pagination; save/restore identical.
- **Required artifacts:** E2E harness pass (seeded + real-files); persistence tests.
- **Required decisions:** none new.
- **Verification:** `node scripts/e2e-regression-harness.mjs` (+ `--real-files`).
- **Owner lane:** Message Book / QA.
- **Failure conditions:** pagination nondeterminism; restore mismatch.
- **Cannot happen before pass:** proof approval marketed as ready; checkout.
- **Status:** substantially PASSED (foundation in place; refinements rolling).

## Gate 5 — Manufacturing Readiness Gate

- **Purpose:** Replace provisional manufacturing dimensions (DEC-P-10) with vendor-confirmed values.
- **Entry:** Phase 7 progress + a real vendor candidate.
- **Exit:** confirmed trim/bleed/margins/stock; preflight registry runnable.
- **Required artifacts:** updated DEC-P-10; preflight runners.
- **Required decisions:** vendor-confirmed dimensions.
- **Verification:** preflight report `isManufacturingReady()` logic exercised.
- **Owner lane:** Production / Manufacturing.
- **Failure conditions:** treating provisional dims as final; fake manufacturing readiness.
- **Cannot happen before pass:** vendor export; manufacturing claims.

## Gate 6 — Vendor Readiness Gate

- **Purpose:** Confirm a vendor for 7×10" casebound hardcover; open `isCoverUnblocked()`.
- **Entry:** vendor evaluation underway.
- **Exit:** one confirmed vendor meeting locked specs; cover work unblocked.
- **Required artifacts:** vendor confirmation in `docs/ops/vendor-manufacturing-register.md`.
- **Required decisions:** vendor selection (Coordinator).
- **Verification:** `isCoverUnblocked()` = true with rationale.
- **Owner lane:** Vendor Feasibility.
- **Failure conditions:** cover/PDF work before confirmation.
- **Cannot happen before pass:** cover design; PDF pipeline; checkout.

## Gate 7 — Packaging Readiness Gate

- **Purpose:** Packaging + gifting only after vendor + fulfillment are real.
- **Entry:** Gate 6 passed.
- **Exit:** packaging SOP + gift-notes decision (v1 vs v1.1).
- **Required artifacts:** packaging spec; gifting decision record.
- **Required decisions:** gift notes scope.
- **Verification:** SOP reviewed.
- **Owner lane:** Packaging / Gifting.
- **Failure conditions:** premature SOP; gifting scope creep.
- **Cannot happen before pass:** packaging procurement; gifting marketing.

## Gate 8 — Checkout / Sale Readiness Gate

- **Purpose:** Commerce only after proof approval + server PDF pipeline (DEC-P-06, DEC-P-09).
- **Entry:** Gate 6 + server PDF pipeline exists.
- **Exit:** checkout that cannot bypass proof approval; recorded explicit approval.
- **Required artifacts:** PDF pipeline; checkout flow; proof-approval coupling.
- **Required decisions:** commerce/legal prerequisites.
- **Verification:** checkout path test proving proof-approval precondition.
- **Owner lane:** Development / Legal-Business Ops.
- **Failure conditions:** checkout bypasses proof; in-browser PDF.
- **Cannot happen before pass:** taking orders; payment integration.

## Gate 9 — Beta / Proof Review Gate

- **Purpose:** In-app proof approval state with explicit accept (DEC-P-09). Package 5A is the foundation.
- **Entry:** Gate 1 passed (Tower approved); Phases 5–6 sufficient.
- **Exit:** proof approval state model + recorded explicit customer approval; beta proof review run.
- **Required artifacts:** Package 5A deliverables; proof approval UX.
- **Required decisions:** Package 5A authorization.
- **Verification:** tests for proof state transitions; no checkout coupling.
- **Owner lane:** Message Book / Development.
- **Failure conditions:** proof state leaking into checkout/PDF scope.
- **Cannot happen before pass:** marketing proof approval as live; launch.

## Gate 10 — Launch Gate

- **Purpose:** All prerequisite gates green; truthful privacy/pricing; fulfillment ready.
- **Entry:** Gates 2–9 sufficiently passed.
- **Exit:** `docs/qa/release-readiness-template.md` passes; first orders fulfillable.
- **Required artifacts:** release readiness sign-off.
- **Required decisions:** Coordinator launch authorization.
- **Verification:** release readiness checklist complete.
- **Owner lane:** Launch Readiness.
- **Failure conditions:** any gate faked; privacy overclaim.
- **Cannot happen before pass:** public launch; order intake.

## Gate 11 — Post-Launch Learning Gate

- **Purpose:** Expansion decisions evidence-driven, each format gated independently.
- **Entry:** launched with real data.
- **Exit:** validated learnings; next-format decision recorded.
- **Required artifacts:** post-launch learning summary.
- **Required decisions:** expansion go/no-go per format.
- **Verification:** evidence reviewed at Monthly Roadmap Reset.
- **Owner lane:** Product Strategy / Product System Expansion.
- **Failure conditions:** premature multi-format expansion; KeepMees collapsed to one product.
- **Cannot happen before pass:** new physical formats into launch set.

---

## Standing separations these gates preserve

- Software support vs. physical/manufacturing readiness are distinct (a product may be engine-supported + previewable yet not purchasable or publicly claimable).
- Preview/behavior truth vs. Figma/design truth are distinct (Preview wins on dynamic composition — DEC-V-06).
- Message Book is the flagship without reducing KeepMees to only Message Book (DEC-ID-01).
- Vendor/manufacturing, design hiring, and packaging/gifting remain gated.
- No fake product, manufacturing, or launch claims.
