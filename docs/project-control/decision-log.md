# KeepMees Decision Log

**Last updated:** 2026-06-08 (America/New_York — Package 3AJ — Import Insights Consolidation COMPLETE; impl/merge `92435b7`, merged to `main` 2026-06-08; state-sync `e445212`; behavior-preserving `index.html` wiring consolidation; Post-Package-3AJ Tower Catch-Up IN PROGRESS, docs-only)
**Owner:** Coordinator / Project Control
**Relationship:** This is the Project Control view of decisions. The authoritative record is `docs/ops/decision-register.md` (DEC-* IDs). If they differ, the decision register wins and this view is corrected.

Each decision: decision · status · date · owner lane · rationale · source/context · downstream impact · revisit condition.

---

## Locked decisions (do not reopen without explicit product authority)

| Decision | Status | Date | Owner | Rationale | Source | Downstream impact | Revisit when |
|---|---|---|---|---|---|---|---|
| KeepMees is broader than Message Book | Locked | 2026-05 | Product Strategy | Prevent scope collapse | DEC-ID-01 | All docs preserve product-system framing | New product strategy authority |
| Message Book is the flagship | Locked | 2026-05 | Product Strategy | Focus to reach readiness | DEC-P-01 | Other formats stub-only ahead of MB | Explicit product authority |
| Software support ≠ manufacturing readiness | Locked | 2026-05 | Product Strategy | Honest readiness | DEC-P-08 | Surfaces never imply commerce/manufacturing | — |
| A product may be engine-supported, previewable, not purchasable, not publicly marketable | Locked | 2026-05 | Product Strategy | Truthful capability | DEC-P-08, Pkg 4E | Availability surface gated | — |
| Manual typed messages are first-class | Locked | 2026-05 | Development | Source flexibility | Pkg 1 | manual-entry adapter supported | — |
| Keepsake groups bridge selected source ↔ eligible formats | Locked | 2026-05 | Development | Core model | Pkg 2 | KeepsakeGroup central | — |
| Product eligibility is a core concept | Locked | 2026-05 | Development | Gate formats by content | Pkg 2 | ProductEligibility engine | — |
| Message Book: 7×10" casebound hardcover (unless vendor proof changes) | Locked | 2026-05 | Production | Premium trade format | DEC-P-02/03 | Pagination + vendor constraints | Vendor proof divergence |
| ~250 pages/volume with split logic | Locked | 2026-05 | Production | POD viability | DEC-P-04 | Multi-volume = separate books | Vendor limit divergence |
| Soft composition engine | Locked | 2026-05 | Message Book | Emotional flow | DEC-V-03/05 | Composition pipeline | — |
| Same-sender grouping preserved | Locked | 2026-05 | Message Book | Readability | DEC-V-09 | Spacing tiers | — |
| Emotional pairing preserved | Locked | 2026-05 | Message Book | Meaning-first | DEC-V-05 | Composition rules | — |
| Page break preference: full over empty | Locked | 2026-05 | Message Book | Density | composition | Paginator behavior | — |
| Optional sparse dividers | Locked | 2026-05 | Message Book | Subtle structure | DEC-V-03 | Divider system | — |
| Section flow default; user override to force new page | Locked | 2026-05 | Message Book | Control + flow | composition | Section behavior | — |
| Featured moments allowed | Locked | 2026-05 | Message Book | Emphasis via space | DEC-V-03/05 | Featured page type | — |
| Timestamps toggled at book level | Locked | 2026-05 | Message Book | Consistency | composition | enrichPageMetadata | — |
| Preview must target 1:1 print fidelity (north star) | Locked | 2026-05 | Preview/Print | Quality bar | DEC-V-07 | Phase 6 + Gate 3 | — |
| External paid design contracting paused | Locked | 2026-05 | Design System | Budget gap | RISK-P-03 | Phase 7 blocked | Budget re-authorized |
| Vendor sourcing remains gated | Locked | 2026-05 | Vendor | Avoid scope explosion | DEC-P-08 | Phase 8/9 gated | Vendor confirmed |
| Packaging/gifting remains gated | Locked | 2026-05 | Packaging | Sequence discipline | DEC-P-08 | Phase 10 gated | Phase 9 passed |
| Format availability must not imply commerce/manufacturing/public-claim for non-book | Locked | 2026-05 | Product Strategy | Honest surface | Pkg 4E | Surface copy constrained | — |
| Non-book formats may be architecture-known + planned without being preview-ready/purchasable/manufacturable/public | Locked | 2026-05 | Product Strategy | Honest roadmap | Pkg 4A–4E | Readiness layers gated | — |
| PDF generation server-side only | Locked | 2026-05 | Development | Print quality | DEC-P-06 | No in-browser PDF; Phase 11 | — |
| Proof approval is an in-app explicit action | Locked | 2026-05 | Message Book | Manufacturing safety | DEC-P-09 | Package 5A + Gate 9 | — |
| Deterministic pagination; version-gated | Locked | 2026-05 | Development | Data integrity | DEC-A-03 | Scope-guarded constants | Version bump only |

## Active (governing, may evolve)

| Decision | Status | Date | Owner | Notes |
|---|---|---|---|---|
| AI development relay model (Coordinator/Operator/Executor, package-scoped) | Active | 2026-05 | Coordinator | DEC-O-01 |
| Repo docs are project source of truth | Active | 2026-05 | Coordinator | Reinforced by Tower |
| Claude/Codex interchangeable over repo substrate | Active | 2026-05 | AI Workflow | Package 2.7 |
| Project Control Tower is the coordination layer | Active | 2026-05-17 | Coordinator | Package 2.8 (this) |

## Active (governing, may evolve)

(Row added 2026-06-03)

| Decision | Status | Date | Owner | Notes |
|---|---|---|---|---|
| State-Zero Closeout Rule: wrong active branch is always FAIL, not cosmetic | Active | 2026-06-03 | AI Workflow | v1.8 — closes the gap where post-merge stale docs required Gate 0 housekeeping. Post-Commit State Rule (hash lag) and State-Zero (operational fields) are co-existing, not competing. |

## Open decisions (need a call)

| Decision | Status | Owner | Notes |
|---|---|---|---|
| Exact timeline confidence for launch | Open | Coordinator | Currently Low/directional only |
| ClickUp adoption + import timing | Open | Founder | Optional; repo works without it |
| Google Calendar import timing | Open | Founder | Optional |
| TickTick adoption timing | Open | Founder | Optional |
| Clean tracked `scripts/node_modules` history | Open | Coordinator | Hygiene only; separate decision |
| Framework/refactor timing | Open | Development | Deferred; re-evaluate post render/proof |
| Next development package after Package 3X | Decided | Coordinator | Package 3Y COMPLETE — impl `ca8d520`, merged `e0539d2` 2026-06-07; Package 3Z COMPLETE — impl `4902d50`, merged `ff79f9e` 2026-06-07; Package 3AA COMPLETE — impl `0e15cfb`, merged `29c4491` 2026-06-07; Package 3AB COMPLETE — impl `9290b8e`, merged `ebf9668` 2026-06-08; Package 3AC — Message Timing Analysis Engine COMPLETE — impl `74ff910`, merged to `main` 2026-06-07; `KMEngine.TimingAnalysis.compute()`; `#timingAnalysisPanel` green panel; 93 new tests (15 suites); 3273 Node / 26 suites; Package 3AD — Response Time Analysis Engine COMPLETE — impl `6fe873c`, merged to `main` 2026-06-07; `KMEngine.ResponseTimeAnalysis.compute()`; `#responseTimePanel` orange/rose panel; 81 response-time tests + 6 km-engine smoke; 3360 Node / 27 suites; Package 3AE — Message Length Analysis Engine COMPLETE — impl `dde558c`, merged to `main` 2026-06-08; `KMEngine.MessageLengthAnalysis.compute()`; `#messageLengthPanel` cyan/sky-blue panel; 82 message-length tests + 6 km-engine smoke; 3448 Node / 28 suites; Package 3AF — Conversation Initiation Analysis Engine COMPLETE — impl `7f03889`, merged to `main` 2026-06-08; state-sync `4ff64b5`; `KMEngine.ConversationInitiation.compute()`; `#conversationInitiationPanel` pink/magenta panel; GAP_THRESHOLD_MS = 6h; 90 conversation-initiation tests + 6 km-engine smoke; Phase 43 E2E (6 tests); 3544 Node / 29 suites; Package 3AG — Meta Reaction Capture COMPLETE — impl `0331da0`, merged to `main` 2026-06-08, state-sync `2e081fe`; Instagram DM + Facebook Messenger adapters map Meta `{reaction,actor}` → `NormalizedMemory.reactions[]` (capture-only; no ReactionAnalysis engine/panel; no DEF-11 in-book rendering); 3573 Node / 29 suites; Package 3AH — Reaction Analysis Engine + Panel COMPLETE — impl `a165122`, merged to `main` 2026-06-08, state-sync `c8378c7`; `KMEngine.ReactionAnalysis.compute()` + `#reactionAnalysisPanel` (import-time advisory panel only) consuming the reactions[] captured in Package 3AG; 66 reaction-analysis tests (incl. IQR-preservation regression) + 6 km-engine smoke (→180); Phase 44 E2E (6 tests); 3645 Node / 30 suites; NO DEF-11 in-book rendering, NO Message Book reaction badges; Package 3AI — Verification & Harness Reliability Hardening COMPLETE — impl `d4a6c71`, merged to `main` 2026-06-08, state-sync `803cd64`; scripts + docs only (E2E harness Phase 1 startup reliability hardened with NO assertion/count changes; baseline docs refreshed without a new stale-number trap); no app code, no `index.html`, no `src/**`, no new test-runner orchestrator; baseline unchanged 3645 Node / 30 suites; Package 3AJ — Import Insights Consolidation COMPLETE — impl/merge `92435b7`, merged to `main` 2026-06-08, state-sync `e445212`; behavior-preserving `index.html` wiring consolidation (`renderImportInsights` dispatcher delegating to the 10 import-panel renderers; 11 per-panel call clusters → one dispatcher call each; all `renderXPanel` functions + `window.__km` bridges preserved); NO new engine/panel, NO DOM/CSS/order/copy/visibility/behavior change; baseline unchanged 3645 Node / 30 suites / 57 seeded / 195 real-files / VR PASS; next candidate: **TBD — awaiting Coordinator authorization** |

## Deferred

| Item | Owner | Revisit when |
|---|---|---|
| n8n/Make/Zapier automation | AI Workflow | Future phase |
| Future product format expansion | Product System Expansion | Post-launch evidence |
| Adjacent competitor teardown | Competitor Intelligence | When strategically relevant |
| Visual redesign | Design System | Coordinator + Design authorization |
| Cloud account persistence | Development | Post-launch + server infra |

## Killed

| Option | Date | Reason | Revisit |
|---|---|---|---|
| Blurb as vendor | 2026-05 | 8×10" only, not 7×10" | Only if 7×10" trim reopened (not planned) |
| In-browser PDF generation | 2026-05 | Cannot meet print quality (DEC-P-06) | Not revisited |
| Multi-product reckless launch | 2026-05 | Dilutes brand; unsustainable scope | Post-launch, evidence-gated only |
