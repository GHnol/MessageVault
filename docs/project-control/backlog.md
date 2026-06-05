# KeepMees Backlog

**Last updated:** 2026-06-05 (America/New_York — Package 3J)
**Owner:** Coordinator / Project Control

**Status values:** Inbox · Backlog · Ready · In Progress · Waiting / Blocked · Review · Approved · Done · Deferred · Killed
**Priority:** P0 Critical · P1 High · P2 Medium · P3 Low
**Columns:** Task · Priority · Status · Phase · Dependencies · Success criteria · TickTick? · ClickUp? · Calendar?

> Board-sized items only — not every micro-subtask. Detailed package scope lives in `docs/ops/backlog-roadmap.md`.

---

## Lane: Coordinator / Project Control

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Review + approve Project Control Tower | P0 | Done | 0 | — | Tower approved/changes recorded | Y | Y | N |
| Commit + merge Package 2.8 (Operator Mode) | P0 | Done | 0 | approval | Tower on main + status sync | Y | Y | N |
| Activate weekly Coordinator sync ritual | P1 | Ready | 0 | Tower merged | First weekly log entry written | Y | Y | Y |
| Authorize Package 5A after Tower | P1 | Done | 12 | Tower merged | 5A explicitly authorized | Y | Y | N |
| Authorize Package 5B product work | P1 | Done | 12 | v1.7 complete | Package 5B authorized and COMPLETE — merged `dc4f86b` 2026-06-02 | Y | Y | N |
| Decide ClickUp/TickTick/Calendar adoption | P2 | Backlog | 0 | — | Founder choice recorded | Y | N | N |
| Decide scripts/node_modules history cleanup | P3 | Deferred | 0 | — | Decision recorded in decision-log | N | Y | N |

## Lane: Product Strategy

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Keep master-project-truth current | P1 | Ready | 1 | — | Reflects reality each monthly reset | N | Y | Y |
| Guard "KeepMees ≠ only Message Book" framing | P1 | Ready | 1 | — | No doc/surface reduces scope | N | Y | N |
| Prevent unsupported product claims | P0 | Ready | 1 | — | No claim beyond system support | N | Y | N |

## Lane: Development

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Prepare scoped Package 5A prompt | P1 | Done | 12 | 5A authorized | Scoped prompt (no checkout/PDF/renderer) | Y | Y | N |
| Package 5A — Proof Approval State Foundation | P1 | Done | 12 | Tower approved | Proof state model + tests; no app-scope creep | Y | Y | N |
| Package 5B — Proof Approval UX Foundation | P1 | Done | 12 | Package 5A complete | 1704 Node tests; browser QA 36/36 PASS; merged `dc4f86b` 2026-06-02 | Y | Y | N |
| Package 3D — Visual Regression Baseline Harness | P2 | Done | 0 (QA infra) | — | `scripts/visual-regression-harness.mjs`; Scenario A baselines; merged `645f6bd` 2026-06-02 | N | Y | N |
| Package 3E — ProductDraft and Preflight Runner Foundation | P2 | Done | 12 | — | `ProductDraftState` + `ProductPreflight`; PAGINATION_STABILITY runnable; no manufacturing readiness API; merged `4390038` 2026-06-02 | N | Y | N |
| Package 3F — ProductDraft Lifecycle Coordinator | P2 | Done | 12 | Package 3E complete | `KMEngine.ProductDraftLifecycle`; engine layer; 2039 Node tests; merged `395629e` 2026-06-03 | N | Y | N |
| Package 3G — Session UI Wiring for ProductDraft Lifecycle | P2 | Done | 12 | Package 3F complete | lifecycle modules in browser; showBookView draft init; getGroupDraft helper; Phase 22 E2E; merged `3192a15` 2026-06-03 | N | Y | N |
| Package 3H — Draft-Preflight Status Surface and Proof Panel Gate | P2 | Done | 12 | Package 3G complete | PAGINATION_STABILITY auto-check; proof panel gated on preflight-passed; Phase 23 E2E; merged `1297f92` 2026-06-03 | N | Y | N |
| Package 5C — Proof Panel User Withdrawal and UX Completion | P2 | Done | 12 | Package 5B + 3H complete | withdrawal (pending-review→none); cancel button; Phase 24 E2E; 2082 Node; 80/80 real-files; 27/27 browser QA; merged `4733c32` 2026-06-04 | N | Y | N |
| Package 3M — Android SMS XML Adapter | P2 | Done | 3 | none | `KMEngine.androidSmsAdapter`; android-sms-xml-v1; SMS B&R XML; DOM-free parser; type=1/2 senderRole; MMS attachment-placeholder; android-sms platform `supported`; 84 new tests + 5 km-engine smoke; 2358 Node; engine-only; merged `1228f41` 2026-06-05 | N | Y | N |
| Package 3J — WhatsApp TXT Adapter | P2 | Done | 3 | none | `KMEngine.whatsappTxtAdapter`; bracket + hyphen formats; 91 new tests; whatsapp platform `supported`; 2269 Node; engine-only; merged `f1eca34` 2026-06-05 | N | Y | N |
| Package 3I — Import Quality Report | P2 | Done | 3 | none | `KMEngine.ImportQualityReport.compute()`; `#importQualityPanel`; Phase 25 E2E; 2173 Node; 84/84 real-files; 17/17 browser QA; merged `60cdd31` 2026-06-04 | N | Y | N |
| Message Book composition continuation backlog | P2 | Backlog | 5 | — | ProductDraft + lifecycle coordinator + session wiring delivered (3E + 3F + 3G); remaining: preflight runners for gated checks | N | Y | N |
| Maintain E2E + unit baselines green | P1 | Ready | 0 | — | All suites green before any commit | N | Y | N |

## Lane: Design System

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Hold Figma execution until designer confirmed | P1 | Waiting/Blocked | 7 | budget decision | No paid design work until authorized | N | Y | N |
| Keep Figma Build Package v1.1 brief ready | P2 | Done | 7 | — | Brief preserved, not re-scoped | N | Y | N |

## Lane: Preview and Print Fidelity

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Define preview-fidelity verification approach | P2 | Backlog | 6 | Phase 5 | Approach doc; no redesign started | N | Y | N |
| Document preview vs Figma delta (DEC-V-07) | P2 | Backlog | 6 | design master | Bounded, documented delta | N | Y | N |

## Lane: Message Book

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Preserve deterministic pagination invariants | P0 | Ready | 5 | — | Scope-guarded constants untouched | N | Y | N |
| Proof approval UX (after 5A state model) | P2 | Backlog | 12 | Package 5A | UX spec; no checkout coupling | N | Y | N |

## Lane: Product System Expansion

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Keep non-book formats architecture-known only | P1 | Ready | 4 | — | No purchasability/manufacturing implied | N | Y | N |
| Future format expansion (post-launch) | P3 | Deferred | 15 | launch data | Evidence-driven, gated per format | N | N | N |

## Lane: Vendor Feasibility

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Track vendor candidates (no new outreach) | P1 | Waiting/Blocked | 9 | vendor replies | Status current; no scope expansion | N | Y | Y |
| Vendor confirmation decision | P1 | Waiting/Blocked | 9 | replies | One vendor meeting locked specs | N | Y | N |

## Lane: Packaging / Gifting

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Hold packaging spec until vendor real | P2 | Waiting/Blocked | 10 | Phase 9 | Gated; no premature SOP | N | Y | N |
| Gift notes v1 vs v1.1 decision | P2 | Backlog | 10 | — | Decision recorded | N | Y | N |

## Lane: Competitor Intelligence

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Maintain competitor register (reuse only) | P3 | Backlog | 1 | — | Register current; no new teardown now | N | Y | N |
| Adjacent teardown (later) | P3 | Deferred | 15 | — | Scheduled only when relevant | N | N | N |

## Lane: Growth / Marketing

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| No public claims pre-launch | P0 | Ready | 13 | — | No marketing claim beyond system | N | Y | N |
| Launch messaging draft (later) | P3 | Deferred | 13 | Phase 13 | Drafted only at launch readiness | N | N | N |

## Lane: Legal / Business Ops

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Privacy language final review (later) | P1 | Deferred | 13 | Phase 11 | Truthful, not overclaimed | N | Y | N |
| Commerce/legal prerequisites (later) | P2 | Deferred | 11 | vendor+PDF | Scoped at checkout readiness | N | Y | N |

## Lane: Finance / Budget

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Monthly budget / viability review | P2 | Ready | 0 | — | Run monthly; recorded | Y | Y | Y |
| Designer budget decision input | P1 | Waiting/Blocked | 7 | — | Coordinator decision enabled | N | Y | N |

## Lane: AI Workflow / Agent System

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| AI Project OS v1.8 — State-Zero Bootstrap Finalization | P1 | Done | 0 | — | State-Zero protocol + hardened scripts + v1.8 pack; repair `25e2939`, merged `cf63b88` 2026-06-03; 324 OS audit checks | N | Y | N |
| Maintain Tower after each package | P1 | Ready | 0 | — | Tower re-synced post-closeout | N | Y | N |
| Keep continuity protocols in force | P1 | Ready | 0 | — | Sessions resume from repo only | N | Y | N |
| n8n/Make/Zapier automation | P3 | Deferred | 0 | — | Not built now; future phase | N | N | N |

## Lane: QA / Testing

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Run E2E + unit before any commit | P0 | Ready | 0 | — | Green baseline enforced | N | Y | N |
| Preview fidelity verification harness (later) | P2 | Deferred | 6 | Phase 6 | Scoped when fidelity work starts | N | Y | N |

## Lane: Launch Readiness

| Task | Pri | Status | Phase | Deps | Success criteria | TT | CU | Cal |
|---|---|---|---|---|---|---|---|---|
| Maintain release-readiness checklist | P2 | Backlog | 13 | — | `docs/qa/release-readiness-template.md` used | N | Y | N |
| Launch readiness review (later, low conf.) | P3 | Deferred | 13 | Phases 6–12 | Run only when gates near-green | N | N | Y |

---

## Backlog hygiene

- Re-rank during Coordinator weekly sync.
- A task is **Done** only when its success criteria are met and reflected in repo docs.
- Deferred ≠ Killed. Killed items are not revisited without new information.
- Items marked `CU=N, TT=N` are repo-tracked only (strategic/guardrail items) — intentionally not pushed to external tools.
