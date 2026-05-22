# Next 30 Days

**Window:** 2026-05-17 → 2026-06-16 (America/New_York)
**Owner:** Coordinator / Project Control
**Confidence:** Weeks 1–2 High · Weeks 3–4 Medium · beyond Medium/Low

---

## Week 1 — 2026-05-17 → 05-23 — Project Control Tower Landing
- **Outcome:** Tower reviewed, approved, merged; execution layers available; Package 5A authorized.
- Tasks: review Tower → approve → Operator Mode merge → status sync → (optional) import tools → authorize Package 5A.
- Gate: **Foundation Operating System Gate** must pass before Package 5A.
- Review point: Project Control Sync, Fri 05-22.
- Risks: founder capacity (R-CAP-1) — fallback in `next-7-days.md`.
- Success: Tower on main; 5A authorized or explicitly held with reason.

## Week 2 — 2026-05-24 → 05-30 — Package 5A Kickoff
- **Outcome:** Package 5A (Message Book Proof Approval State Foundation) scoped and implementation started.
- Tasks: Claude drafts scoped 5A prompt → Coordinator confirms scope → begin 5A (state model + tests only).
- Gate: none new; Gate 9 (Beta/Proof) is the eventual target, not this week.
- Review point: Development Review Wed 05-27; Project Control Sync Fri 05-29.
- Decisions: confirm 5A scope excludes checkout/PDF/preview-renderer.
- Risks: scope creep into checkout/PDF — guard via `phase-gates.md` Gate 9.
- Success: 5A under way, green baseline maintained.

## Week 3 — 2026-05-31 → 06-06 — Package 5A Delivery
- **Outcome:** Package 5A delivered (proof approval state foundation + tests), reviewed.
- Tasks: complete 5A implementation → E2E + unit green → Operator Mode closeout (on authorization).
- Gate: Gate 4 (MB MVP) remains green; 5A feeds Gate 9 readiness.
- Review point: Development Review Wed 06-03; Project Control Sync Fri 06-05.
- Decisions: 5A merge authorization.
- Risks: pagination/scope-guard regression — enforce scope guard.
- Success: 5A merged; Tower re-synced post-closeout.

## Week 4 — 2026-06-07 → 06-13 — Monthly resets + Phase 6 prep
- **Outcome:** Monthly Roadmap Reset + Budget review done; preview-fidelity verification approach defined (no redesign).
- Tasks: run Monthly Roadmap Reset + Budget (Sun 06-07) → re-baseline schedule → draft preview-fidelity approach doc.
- Gate: Gate 3 (Preview Fidelity) preparation only.
- Review point: Monthly Roadmap Reset 06-07; Development/Product reviews midweek.
- Decisions: designer budget revisit (if any movement); next package after 5A.
- Risks: R-BUD-1 (designer gap); R-FID-1 (fidelity overclaim) — keep DEC-V-07 honest.
- Success: roadmap re-based with current confidence; fidelity approach documented.

## Days 29–30 — 2026-06-14 → 06-16 — Risk review + next sprint
- **Outcome:** Monthly Risk Review (Sun 06-14); next sprint planned.
- Tasks: full risk pass → update statuses → plan Sprint 2026-06.
- Review point: Monthly Risk Review 06-14.
- Success: risk register current; next sprint defined and not overloaded.

---

## 30-day gates summary

| Gate | Target | Confidence |
|---|---|---|
| Foundation Operating System Gate | Week 1 (~05-23) | High |
| MB MVP Gate (stays green) | continuous | High |
| Beta/Proof Review Gate (progress, not pass) | Weeks 2–3 via Package 5A | Medium |
| Preview Fidelity Gate (prep only) | Week 4 | Medium |

## What must NOT happen in 30 days

Checkout, server PDF, cover design, preview renderers, visual redesign, framework migration, vendor outreach, design hiring restart, n8n/Make/Zapier, any public product/manufacturing/launch claim, Package 5A before Tower merge.
