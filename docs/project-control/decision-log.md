# KeepMees Decision Log

**Last updated:** 2026-06-02 (America/New_York)
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

## Open decisions (need a call)

| Decision | Status | Owner | Notes |
|---|---|---|---|
| Exact timeline confidence for launch | Open | Coordinator | Currently Low/directional only |
| ClickUp adoption + import timing | Open | Founder | Optional; repo works without it |
| Google Calendar import timing | Open | Founder | Optional |
| TickTick adoption timing | Open | Founder | Optional |
| Clean tracked `scripts/node_modules` history | Open | Coordinator | Hygiene only; separate decision |
| Framework/refactor timing | Open | Development | Deferred; re-evaluate post render/proof |
| Next product package after Package 3E | Open | Coordinator | Package 3E COMPLETE (merged `4390038` 2026-06-02); ProductDraft model + preflight foundation delivered; candidates: scoped Phase 12 continuation, preflight runners for gated checks (vendor-gated), or another QA/OS pass |

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
