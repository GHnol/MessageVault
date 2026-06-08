# KeepMees Master Roadmap

**Last updated:** 2026-06-08 (America/New_York — post-Package-3AH Tower catch-up; Package 3AH — Reaction Analysis Engine + Panel COMPLETE (engine + import-time advisory panel only); import analytics ENGINE layer complete through 3AH; all DEF-14 engine data points complete)
**Owner:** Coordinator / Project Control
**Source of truth:** this file summarizes `docs/strategy/`, `docs/ops/decision-register.md`, `docs/ops/backlog-roadmap.md`, `docs/command-center/current-status.md`. If they conflict, those win and this is corrected.

> Confidence: **High** = near-term, controllable, low external dependency. **Medium** = depends on internal sequencing. **Low** = gated by external (vendor/designer/PDF infra) or far enough out that dates are directional only.

---

## Package history mapped into phases

Significant foundation work is already done. Completed packages map to phases as follows:

| Package | Maps to phase(s) | Status |
|---|---|---|
| Package 1 — Source + Adapter + NormalizedMemory foundation | Phase 3 | DONE |
| Package 2 — Product Catalog + Eligibility + KeepsakeGroup | Phase 4 | DONE |
| Package 2.5A — Project Truth + Operating System foundation | Phase 0, Phase 1 | DONE |
| Package 2.5B — AI Mastery automation artifacts | Phase 0 | DONE |
| Package 2.6 / 2.6.1 — Operator Inbox + processor (+fix) | Phase 0 | DONE |
| Package 2.7 — AI Development Operating System Upgrade | Phase 0 | DONE |
| Package 2.8 — Project Control Tower | Phase 0 | DONE |
| Package 2.9 — AI Project OS Auto-Management Upgrade | Phase 0 | DONE |
| Package 3A — Local project session save/resume | Phase 3, Phase 5 | DONE |
| Package 3B — Automated E2E regression harness | Phase 0 (QA infra) | DONE |
| Package 3C — Real file import/download/full-path E2E | Phase 0 (QA infra), Phase 3 | DONE |
| Package 4A — ProductRenderSpec foundation | Phase 4, Phase 6 | DONE |
| Package 4B — PrototypePreviewRegistry foundation | Phase 6 | DONE |
| Package 4C — ProductExperienceReadiness foundation | Phase 4, Phase 6 | DONE |
| Package 4D — ProductExperienceConsumer bridge | Phase 4, Phase 6 | DONE |
| Package 4E — Product format availability surface | Phase 1, Phase 4 | DONE |
| Package 4E.1 — E2E startup timing reliability patch | Phase 0 (QA infra) | DONE |
| Package 5A — Message Book Proof Approval State Foundation | Phase 12 | DONE |
| Package 5B — Message Book Proof Approval UX Foundation | Phase 12 | DONE |
| Package 3D — Visual Regression Baseline Harness | Phase 0 (QA infra) | DONE |
| Package 3E — ProductDraft and Preflight Runner Foundation | Phase 12 | DONE |
| Package 3F — ProductDraft Lifecycle Coordinator | Phase 12 | DONE |
| Package 3G — Session UI Wiring for ProductDraft Lifecycle | Phase 12 | DONE |
| Package 3H — Draft-Preflight Status Surface and Proof Panel Gate | Phase 12 | DONE |
| Package 5C — Proof Panel User Withdrawal and UX Completion | Phase 12 | DONE |
| Package 3I — Import Quality Report | Phase 3 | DONE |
| **Client-side source adapter series — ALL COMPLETE (Packages 3J–3W)** | **Phase 3** | **DONE** |
| Package 3J — WhatsApp TXT Adapter | Phase 3 | DONE |
| Package 3K — WhatsApp TXT UI Wiring | Phase 3 | DONE |
| Package 3L — WhatsApp Self-Identification Sender Picker | Phase 3 | DONE |
| Package 3M — Android SMS XML Adapter | Phase 3 | DONE |
| Package 3N — Android SMS UI Wiring | Phase 3 | DONE |
| Package 3O — Instagram DM JSON Adapter | Phase 3 | DONE |
| Package 3P — Instagram DM JSON UI Wiring | Phase 3 | DONE |
| Package 3Q — Instagram DM Self-Identification Sender Picker | Phase 3 | DONE |
| Package 3R — Facebook Messenger JSON Adapter | Phase 3 | DONE |
| Package 3S — Facebook Messenger JSON UI Wiring | Phase 3 | DONE |
| Package 3T — Facebook Messenger Self-Identification Sender Picker | Phase 3 | DONE |
| Package 3U — Telegram JSON Adapter | Phase 3 | DONE |
| Package 3V — Telegram JSON UI Wiring | Phase 3 | DONE |
| Package 3W — Telegram Self-Identification Sender Picker | Phase 3 | DONE |
| **Import analytics layer — ALL COMPLETE (Packages 3I, 3X, 3Y, 3Z, 3AA, 3AB, 3AC, 3AD, 3AE, 3AF, 3AH)** | **Phase 3** | **DONE** |
| Package 3X — Pre-print Content Quality Checks (5 WARN checks) | Phase 3 | DONE |
| Package 3Y — Conversation Statistics Engine | Phase 3 | DONE |
| Package 3Z — Extended Content Quality Checks (+4 WARN checks, 9 total) | Phase 3 | DONE |
| Package 3AA — Emoji Analysis Engine | Phase 3 | DONE |
| Package 3AB — Word Count / Language Analysis Engine | Phase 3 | DONE |
| Package 3AC — Message Timing Analysis Engine | Phase 3 | DONE |
| Package 3AD — Response Time Analysis Engine | Phase 3 | DONE |
| Package 3AE — Message Length Analysis Engine | Phase 3 | DONE |
| Package 3AF — Conversation Initiation Analysis Engine | Phase 3 | DONE |
| Package 3AG — Meta Reaction Capture (Instagram DM + Facebook Messenger adapters; capture-only; no engine/panel) | Phase 3 | DONE |
| Package 3AH — Reaction Analysis Engine + Panel (import-time advisory panel only; no DEF-11 in-book rendering) | Phase 3 | DONE |

Phase names below do **not** imply zero progress — read the "completed work" line in each phase.

---

## Phase 0 — Project Control Tower and AI Operating System

- **Purpose:** Repo-native operating system: project truth, automation artifacts, continuity protocols, and this Tower.
- **Start / End:** 2026-04 (Package 2.5A) → target close 2026-05-23 (Tower review/merge). **Confidence: High**
- **Entry criteria:** Project exists; AI relay model defined.
- **Exit criteria:** Tower built, reviewed, merged; `coordinator-weekly-sync.md` active; continuity protocols in force.
- **Deliverables:** 2.5A/2.5B/2.6/2.7 (DONE); Package 2.8 Tower (IN PROGRESS).
- **Completed work:** all operating docs, schemas, templates, operator-mode protocols, continuity/model/tool/session protocols, QA templates.
- **Dependencies:** none external.
- **Risks:** Tower drift vs. repo (mitigated by weekly sync); over-process.
- **Owner lane:** Coordinator / Project Control.
- **Success criteria:** A new session can resume correctly from repo docs alone; Package 5A unpauses only via the Foundation Operating System Gate.
- **Next review:** Weekly Project Control Sync (Fridays).

## Phase 1 — Product Truth Stabilization

- **Purpose:** Lock and keep current what KeepMees is, what is decided, and what is gated.
- **Start / End:** 2026-04 → ongoing (maintenance). **Confidence: High**
- **Entry:** Strategy docs exist.
- **Exit:** `master-project-truth.md` + `decision-register.md` reflect reality; product-format availability surface ships without implying commerce/manufacturing readiness (DONE, Package 4E).
- **Deliverables:** strategy bank, decision register, format availability surface.
- **Completed work:** Packages 2.5A, 4E. Locked decisions DEC-P/V/ID recorded.
- **Dependencies:** none external.
- **Risks:** KeepMees reduced to Message Book; fake product claims.
- **Owner lane:** Product Strategy.
- **Success criteria:** No doc or surface implies readiness a SKU does not have.
- **Next review:** Monthly Roadmap Reset.

## Phase 2 — Message Book MVP Preview Foundation

- **Purpose:** A working in-browser Message Book preview from selected messages.
- **Start / End:** 2026-03 (MB foundation commits) → substantially DONE; refinements ongoing. **Confidence: High (built), Medium (1:1 fidelity)**
- **Entry:** Source intake + normalized memory.
- **Exit:** Book view renders paginated, sectioned, multi-volume-capable output.
- **Deliverables:** pagination engine, section/volume scaffolding, editorial constraints.
- **Completed work:** historical MB phase (e6cbc26 → 7a03b85), Package 3A persistence.
- **Dependencies:** Phase 3, Phase 4.
- **Risks:** preview ≠ final print.
- **Owner lane:** Message Book.
- **Success criteria:** Deterministic pagination; saved books restore identically.
- **Next review:** Weekly Development Review.

## Phase 3 — Source Intake and Message Selection Flow

- **Purpose:** Import real conversations and select meaningful messages.
- **Start / End:** Package 1 → **COMPLETE through Package 3AH** (all client-side source adapters delivered; import analytics ENGINE layer IQR → CQC → ConversationStats → ExtendedCQC → EmojiAnalysis → WordAnalysis → TimingAnalysis → ResponseTimeAnalysis → MessageLengthAnalysis → ConversationInitiation → ReactionAnalysis complete through 3AH; Package 3AG adds Meta reaction capture in the Instagram DM + Facebook Messenger adapters (capture-only, no engine/panel); Package 3AH adds the ReactionAnalysis engine + import-time advisory `#reactionAnalysisPanel` (no DEF-11 in-book rendering); E2E phases 11–19 + 25–44 covered). **Confidence: High**
- **Entry:** Adapter registry.
- **Exit:** iMessage chat.db / .txt / manual entry import; WhatsApp, Android SMS, Instagram DM, Facebook Messenger, Telegram JSON imports; self-ID sender pickers; import quality report; content quality checks (9 WARN); conversation stats; emoji analysis; word analysis; timing analysis (peak hour/day of week); response time analysis (avg response time, fastest responder); message length analysis (avg chars/msg, longest message sender); conversation initiation analysis (who starts conversations, gap-based); reaction analysis (top reaction emoji, top reactor, most-reacted-to sender — import-time advisory panel); selection → review flow; real-file E2E green.
- **Deliverables:** adapters, NormalizedMemory, selection UI, Import Quality Report, Content Quality Checks, Conversation Stats, Emoji Analysis, Word Analysis, Timing Analysis, Response Time Analysis, Message Length Analysis, Conversation Initiation Analysis, Reaction Analysis, sender pickers, E2E phases 11–19 + 25–44.
- **Completed work:** Packages 1, 3A, 3C, 3I, 3J, 3K, 3L, 3M, 3N, 3O, 3P, 3Q, 3R, 3S, 3T, 3U, 3V, 3W, 3X, 3Y, 3Z, 3AA, 3AB, 3AC, 3AD, 3AE, 3AF, 3AG, 3AH. Package 3AG (Meta Reaction Capture) maps Meta `{ reaction, actor }` into `NormalizedMemory.reactions[]` in the Instagram DM + Facebook Messenger adapters (capture-only groundwork; no ReactionAnalysis engine, no panel, no DEF-11 in-book rendering). Package 3AH (Reaction Analysis Engine + Panel) adds `KMEngine.ReactionAnalysis.compute()` + `#reactionAnalysisPanel` (import-time advisory panel only) consuming that captured reaction data — no DEF-11 in-book rendering, no Message Book reaction badges, no adapter/import-quality-report/normalized-memory changes. All 5 client-side platform adapters delivered and `supported`. `future-adapter-stubs.js` STUBS array now empty. Import analytics layer (IQR + CQC 9 checks + ConversationStats + EmojiAnalysis + WordAnalysis + TimingAnalysis + ResponseTimeAnalysis + MessageLengthAnalysis + ConversationInitiation + ReactionAnalysis) complete. All DEF-14 engine-layer data points complete through Package 3AB; Package 3AC adds peak hour/day-of-week analysis beyond DEF-14 scope; Package 3AD adds response time analysis beyond DEF-14 scope; Package 3AE adds message length analysis beyond DEF-14 scope; Package 3AF adds conversation initiation analysis beyond DEF-14 scope; Package 3AH adds reaction summary analysis beyond DEF-14 scope.
- **Dependencies:** none external.
- **Risks:** future macOS/iOS chat.db schema change (RISK in `docs/ops/risk-register.md`).
- **Owner lane:** Development.
- **Success criteria:** Real .txt, .xml, .json, and chat.db import without crash; selection persists; sender identification working for all ambiguous-sender platforms.
- **Next review:** Weekly Development Review. Import analytics ENGINE layer complete through Package 3AH; Package 3AG (Meta Reaction Capture) adds Meta reaction capture in the Instagram DM + Facebook Messenger adapters (capture-only; no engine/panel; no DEF-11 in-book rendering), and Package 3AH (Reaction Analysis Engine + Panel) consumes that captured data via `KMEngine.ReactionAnalysis.compute()` + `#reactionAnalysisPanel` (import-time advisory panel only — no DEF-11 in-book rendering). All DEF-14 engine-layer data points complete (total messages → IQR; story span + most active day + longest streak + messages by person → ConversationStats; top emojis → EmojiAnalysis; words shared → WordAnalysis). Package 3AC (TimingAnalysis) adds peak hour and day-of-week distribution beyond DEF-14 scope. Package 3AD (ResponseTimeAnalysis) adds average response time, fastest responder, and per-sender response stats beyond DEF-14 scope. Package 3AE (MessageLengthAnalysis) adds avg chars per message, longest message sender, and per-sender char stats beyond DEF-14 scope. Package 3AF (ConversationInitiation) adds conversation-start counts, top initiator, and per-sender initiation stats beyond DEF-14 scope. Package 3AH (ReactionAnalysis) adds top reaction emoji, top reactor, and most-reacted-to sender beyond DEF-14 scope. DEF-14 Stats Page surface remains deferred until book editor is consumer-ready. Next development candidate: **TBD — awaiting Coordinator authorization**.

## Phase 4 — Keepsake Grouping and Product Eligibility

- **Purpose:** Bridge selected source material to eligible product formats.
- **Start / End:** Package 2 → DONE. **Confidence: High**
- **Entry:** NormalizedMemory + selection.
- **Exit:** KeepsakeGroup model; per-product eligibility; readiness resolver + consumer bridge.
- **Deliverables:** Packages 2, 4A–4E.
- **Completed work:** ProductCatalog, ProductEligibility, KeepsakeGroup, render spec, preview registry, experience readiness/consumer, availability surface.
- **Dependencies:** Phase 3.
- **Risks:** eligibility drift vs. real product constraints.
- **Owner lane:** Development / Product Strategy.
- **Success criteria:** Non-book formats remain architecture-known without implying purchasability.
- **Next review:** Monthly Roadmap Reset.

## Phase 5 — Message Book Composition Engine

- **Purpose:** Soft composition: grouping, emotional pairing, section flow, featured moments, parity padding.
- **Start / End:** 2026-03 historical → substantially DONE; continuation backlog open. **Confidence: High (core), Medium (refinements)**
- **Entry:** Phase 2.
- **Exit:** Composition rules locked (DEC-P-04/07, DEC-V-03/05); paginator deterministic + version-gated.
- **Deliverables:** generateCompositionUnits → paginateUnits → enrichPageMetadata → buildPageDOMElement.
- **Completed work:** composition pipeline, parity, editorial validation.
- **Dependencies:** Phase 4.
- **Risks:** pagination regression (scope-guarded constants).
- **Owner lane:** Message Book.
- **Success criteria:** Same input → same pages; `BOOK_PAGINATION_VERSION` honored.
- **Next review:** Weekly Development Review.

## Phase 6 — Print-Faithful Preview

- **Purpose:** Move from composition-faithful to 1:1 print fidelity (north star).
- **Start / End:** partial now → target window 2026-07+ (gated by design alignment). **Confidence: Medium → Low**
- **Entry:** Phase 5 + product readiness layers (4A–4E DONE).
- **Exit:** Preview matches Figma master structure; line-break/pagination edge differences understood and bounded (DEC-V-07).
- **Deliverables:** render spec consumption in preview; fidelity verification harness (future).
- **Completed work:** ProductRenderSpec/PreviewRegistry/ExperienceReadiness foundations.
- **Dependencies:** Phase 7 (design system).
- **Risks:** preview drifting from print reality; design not available.
- **Owner lane:** Preview and Print Fidelity.
- **Success criteria:** Documented, bounded delta between preview and Figma master.
- **Next review:** Phase Gate — Preview Fidelity Gate.

## Phase 7 — Design System Alignment

- **Purpose:** Figma master (`KeepMees Message Book, Figma Build Package v1.1`) built and accepted (Design Viability Checkpoint A).
- **Start / End:** BLOCKED → low-confidence window 2026-Q3. **Confidence: Low (gated)**
- **Entry:** Confirmed Figma executor (designer budget resolved).
- **Exit:** Figma master passes acceptance rubric.
- **Deliverables:** page masters, components, tokens.
- **Completed work:** Figma Build Package v1.1 brief written.
- **Dependencies:** designer budget decision (Alexander Weaver commercial hold).
- **Risks:** designer budget gap (H/H — `docs/ops/risk-register.md`).
- **Owner lane:** Design System.
- **Success criteria:** Accepted Figma master; preview/design truth distinction preserved (DEC-V-06).
- **Next review:** Monthly Roadmap Reset / Budget Review.

## Phase 8 — Manufacturing Readiness Planning

- **Purpose:** Confirm trim/bleed/margins/stock against a real vendor (replace provisional DEC-P-10).
- **Start / End:** gated → low-confidence 2026-Q3/Q4. **Confidence: Low (gated)**
- **Entry:** Phase 7 + vendor candidate.
- **Exit:** Confirmed manufacturing dimensions; preflight registry runnable.
- **Deliverables:** confirmed DEC-P-10 values; preflight runners (future package).
- **Completed work:** preflight schema registry, provisional dimensions.
- **Dependencies:** vendor.
- **Risks:** estimates wrong at real vendor limits.
- **Owner lane:** Production / Manufacturing.
- **Success criteria:** No fake manufacturing readiness; values vendor-confirmed.
- **Next review:** Manufacturing Readiness Gate.

## Phase 9 — Vendor Readiness and Proofing

- **Purpose:** Confirm a vendor for 7×10" casebound hardcover; clear `isCoverUnblocked()`.
- **Start / End:** gated → low-confidence 2026-Q3/Q4. **Confidence: Low (gated)**
- **Entry:** Phase 8 progress.
- **Exit:** Vendor confirmed; cover work unblocked; proof spec validated.
- **Deliverables:** vendor confirmation, proof spec.
- **Completed work:** vendor research (PrintNinja viable; BookBaby conditional; IngramSpark pending; Blurb rejected; Lulu optional).
- **Dependencies:** vendor responses (Chat 04/05 — outside repo).
- **Risks:** vendor not confirmed indefinitely; IngramSpark 7×10" jacketed unavailable.
- **Owner lane:** Vendor Feasibility.
- **Success criteria:** One confirmed vendor meeting locked specs.
- **Next review:** Vendor Readiness Gate.

## Phase 10 — Packaging and Gifting Readiness

- **Purpose:** Define packaging + gift-note system at launch quality.
- **Start / End:** gated → low-confidence 2026-Q4. **Confidence: Low (gated)**
- **Entry:** Phase 9.
- **Exit:** Packaging SOP + gifting decision (gift notes v1 vs v1.1).
- **Deliverables:** packaging spec, gifting flow.
- **Completed work:** 4-component packaging system captured (source intake).
- **Dependencies:** vendor, fulfillment.
- **Risks:** packaging complexity; gifting scope creep.
- **Owner lane:** Packaging / Gifting.
- **Success criteria:** Packaging gated until vendor + fulfillment real.
- **Next review:** Packaging Readiness Gate.

## Phase 11 — Checkout / Sale Readiness

- **Purpose:** Commerce path: checkout after proof approval, server PDF pipeline.
- **Start / End:** gated → low-confidence 2026-Q4+. **Confidence: Low (gated)**
- **Entry:** Phase 9 + server PDF pipeline (DEC-P-06).
- **Exit:** Checkout that cannot bypass proof approval (DEC-P-09).
- **Deliverables:** PDF pipeline, checkout, order flow.
- **Completed work:** none (correctly not started).
- **Dependencies:** vendor confirmed; PDF infra.
- **Risks:** PDF pipeline more complex than anticipated.
- **Owner lane:** Development / Legal-Business Ops.
- **Success criteria:** No checkout without proof approval; no in-browser PDF.
- **Next review:** Checkout / Sale Readiness Gate.

## Phase 12 — Beta Proof Review

- **Purpose:** In-app proof approval state + explicit customer accept (DEC-P-09).
- **Start / End:** Package 5A→5C + 3E–3H foundation layers COMPLETE. Full beta still gated by GATE-04 (PDF pipeline + checkout). **Confidence: High** (foundation), **Low** (full beta — gated)
- **Entry:** Foundation Operating System Gate passed (Tower approved); Phase 5/6 sufficient.
- **Exit:** Proof approval state model + recorded explicit approval. Full proof UX (facsimile) gated by GATE-04.
- **Deliverables:** Package 5A (proof state model) ✓, Package 5B (proof approval UX foundation) ✓, Package 5C (user withdrawal) ✓, Packages 3E–3H (ProductDraft + preflight + lifecycle + UI wiring) ✓. Remaining: preflight runners for 9 vendor/manufacturing-gated checks (gated until vendor confirmed).
- **Completed work:** Packages 5A, 5B, 5C, 3E, 3F, 3G, 3H — all merged to main.
- **Dependencies:** Tower approval ✓; composition engine ✓; vendor (for GATE-04 crossing).
- **Risks:** scope creep into checkout/PDF.
- **Owner lane:** Message Book / Development.
- **Success criteria:** Proof state foundation only below GATE-04; no checkout/PDF/preview renderer scope without explicit authorization.
- **Next review:** Beta / Proof Review Gate.

## Phase 13 — Launch Readiness

- **Purpose:** All gates green; legal/privacy language final; pricing set.
- **Start / End:** Low-confidence directional 2026-Q4 / 2027-Q1. **Confidence: Low**
- **Entry:** Phases 6–12 sufficiently complete.
- **Exit:** Launch readiness checklist (`docs/qa/release-readiness-template.md`) passes.
- **Deliverables:** launch checklist sign-off.
- **Dependencies:** vendor, design, PDF, packaging, checkout.
- **Risks:** schedule uncertainty; privacy overclaims.
- **Owner lane:** Launch Readiness.
- **Success criteria:** No fake launch promises; every gate genuinely cleared.
- **Next review:** Launch Readiness Review.

## Phase 14 — Launch

- **Purpose:** First real Message Book orders fulfilled.
- **Start / End:** Low-confidence directional — date deliberately not promised. **Confidence: Low**
- **Entry:** Phase 13 passed.
- **Exit:** First orders shipped; support path live.
- **Dependencies:** all prior phases.
- **Risks:** fulfillment, demand, support load.
- **Owner lane:** Launch Readiness / Legal-Business Ops.
- **Success criteria:** Real fulfilled orders; promises match reality.
- **Next review:** Launch Gate.

## Phase 15 — Post-Launch Learning and Product Expansion

- **Purpose:** Learn from launch; expand toward broader keepsake formats (journal, mug, sticker pack, wall art, gift wrap, etc.).
- **Start / End:** post-launch, directional only. **Confidence: Low**
- **Entry:** Phase 14.
- **Exit:** Validated learnings; next-format decision.
- **Dependencies:** launch data.
- **Risks:** premature expansion; KeepMees reduced to one product.
- **Owner lane:** Product Strategy / Product System Expansion.
- **Success criteria:** Expansion driven by evidence, each format gated independently.
- **Next review:** Post-Launch Learning Gate.

---

## Critical path (summary)

Phase 0 (Tower) → Phase 12 foundation (Package 5A) → Phase 6 (print-faithful preview) ⟂ Phase 7 (design) → Phase 8/9 (manufacturing/vendor) → Phase 10 (packaging) → Phase 11 (checkout/PDF) → Phase 13 → Phase 14 → Phase 15.

External gates (designer budget, vendor confirmation, server PDF infra) are the dominant schedule risk; everything from Phase 7 onward is **Low confidence** until those clear.
