# KeepMees Master Schedule

**Last updated:** 2026-05-25 (America/New_York)
**Assumed "today":** Monday, 2026-05-25
**Owner:** Coordinator / Project Control
**Confidence labels:** High / Medium / Low. Low = gated by external dependency or far enough out that dates are directional only. Dates are planning targets, not promises.

> This schedule summarizes `master-roadmap.md` + `phase-gates.md` + `docs/command-center/current-status.md`. It does not invent dates for unauthorized packages. Founder capacity assumption: limited evenings/weekends (founder has a separate full-time role) — schedule is intentionally not hour-packed.

---

## Phase schedule

| Phase | Window | Confidence | Gating dependency |
|---|---|---|---|
| 0 — Project Control Tower / AI OS | 2026-04 → 2026-05-23 | High | none |
| 1 — Product Truth Stabilization | ongoing maintenance | High | none |
| 2 — Message Book MVP Preview | DONE (2026-03) | High | none |
| 3 — Source Intake / Selection | DONE | High | none |
| 4 — Keepsake Grouping / Eligibility | DONE | High | none |
| 5 — Message Book Composition Engine | DONE core; refinements rolling | High/Medium | none |
| 6 — Print-Faithful Preview | 2026-07 → 2026-09 (est.) | Medium → Low | Phase 7 |
| 7 — Design System Alignment | 2026-Q3 (est.) | Low | designer budget decision |
| 8 — Manufacturing Readiness | 2026-Q3/Q4 (est.) | Low | Phase 7 + vendor |
| 9 — Vendor Readiness / Proofing | 2026-Q3/Q4 (est.) | Low | vendor responses |
| 10 — Packaging / Gifting | 2026-Q4 (est.) | Low | Phase 9 |
| 11 — Checkout / Sale Readiness | 2026-Q4+ (est.) | Low | vendor + server PDF |
| 12 — Beta Proof Review (Package 5A foundation) | starts after Tower approval (~2026-05-26) | Medium (5A) / Low (full beta) | Foundation OS Gate |
| 13 — Launch Readiness | 2026-Q4 / 2027-Q1 (directional) | Low | Phases 6–12 |
| 14 — Launch | directional, not promised | Low | Phase 13 |
| 15 — Post-Launch Learning / Expansion | post-launch | Low | Phase 14 |

---

## Milestone schedule

| Milestone | Target date | Confidence |
|---|---|---|
| Project Control Tower built | 2026-05-17 | High (done in this package) |
| Tower reviewed + merged | 2026-05-20 → 2026-05-23 | High |
| Package 5A authorized (post-Tower) | ~2026-05-24 → 2026-05-26 | Medium |
| Package 5A — Proof Approval State Foundation delivered | ~2026-06-06 (est.) | Medium |
| Preview fidelity verification approach defined | 2026-06 (est.) | Medium |
| Designer budget decision | unscheduled — Coordinator-owned | Low |
| Figma master accepted (Checkpoint A) | 2026-Q3 (est.) | Low |
| Vendor confirmed (Checkpoint B) | 2026-Q3/Q4 (est.) | Low |
| Server PDF pipeline exists (Checkpoint C) | 2026-Q4 (est.) | Low |
| Launch readiness review | 2026-Q4 / 2027-Q1 (directional) | Low |

---

## Review schedule (rituals — see `calendar-spec.md`)

| Review | Cadence | Day/time (ET) |
|---|---|---|
| KeepMees CEO Review | Weekly | Sun 19:00, 60m |
| Coordinator Planning Review | Weekly | Mon 19:30, 60m |
| Development Review | Weekly | Wed 19:30, 45m |
| Product / Design Review | Weekly | Thu 19:30, 45m |
| Project Control Sync | Weekly | Fri 19:30, 45m |
| Monthly Roadmap Reset | Monthly | 1st Sun 17:00, 90m |
| Monthly Budget / Viability Review | Monthly | 1st Sun 18:45, 45m |
| Monthly Risk Review | Monthly | 2nd Sun 17:00, 60m |

Next concrete instances: CEO Review 2026-05-17; Coordinator 2026-05-18; Development 2026-05-20; Product/Design 2026-05-21; Project Control Sync 2026-05-22; Monthly Roadmap Reset + Budget 2026-06-07; Monthly Risk Review 2026-06-14.

---

## Decision deadlines

| Decision | Needed by | Owner | Impact if missed |
|---|---|---|---|
| Approve/merge Project Control Tower | 2026-05-23 | Coordinator | Package 5A stays paused |
| Authorize Package 5A after Tower | ~2026-05-26 | Coordinator | Development idle |
| Designer budget re-authorization | ASAP (no hard date) | Coordinator | Phase 7+ stays Low/blocked |
| ClickUp / TickTick / Calendar adoption | optional, founder choice | Founder | Execution stays repo-only (acceptable) |
| `scripts/node_modules` history cleanup | non-urgent | Coordinator | Repo hygiene only |

---

## Dependency map

```
Tower (Phase 0) ──gate──> Package 5A (Phase 12 foundation)
Phase 5 (composition) ──> Phase 6 (print-faithful preview)
Phase 7 (design master) ──> Phase 6 fidelity + Phase 8
designer budget ──> Phase 7
vendor confirmation ──> Phase 8/9 ──> isCoverUnblocked() ──> Phase 11 cover/PDF
server PDF infra ──> Phase 11 checkout
Phase 9/10/11 ──> Phase 13 ──> Phase 14 ──> Phase 15
```

---

## Status buckets

- **Gated (external):** Phases 7, 8, 9, 10, 11 — designer budget, vendor confirmation, server PDF infra.
- **Blocked:** Figma execution (no confirmed designer); cover work (`isCoverUnblocked()`=false).
- **Active:** None — v1.4 OS pass complete; no active pass or product package as of 2026-05-25. Coordinator decides next authorized work.

---

## Recommended priority order (now)

1. Review + approve + merge the Project Control Tower (Package 2.8).
2. (Founder, optional) import `.ics`, ClickUp CSV, TickTick CSV.
3. Authorize Package 5A; Claude prepares the 5A package prompt.
4. Execute Package 5A — Message Book Proof Approval State Foundation (scope-limited, no checkout/PDF/preview-renderer).
5. Define preview-fidelity verification approach (Phase 6 prep, no redesign).
6. Keep vendor/design/packaging gated; no external outreach.

---

## Next 7 / 30 / 90 (pointers)

- Next 7 days → `next-7-days.md`
- Next 30 days → `next-30-days.md`
- Next 90 days → `next-90-days.md`

---

## What should NOT happen yet

Checkout, server PDF, cover design, preview renderers for non-book formats, visual redesign, framework migration, vendor outreach expansion, design hiring restart, n8n/Make/Zapier automation, Package 5A before Tower approval, any public product/manufacturing claim.
