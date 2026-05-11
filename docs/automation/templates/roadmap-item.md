# Roadmap Item

> Use this template to capture a new roadmap milestone or phase entry.
> Schema: `docs/automation/schemas/roadmap-item.schema.json`
> After Coordinator approval, add to `docs/ops/backlog-roadmap.md`.

---

**Item ID:** `ROADMAP-[NNN]`
**Date:** `[YYYY-MM-DD]`
**Name:** `[Milestone or phase name]`
**Phase:** `[engine-foundation | product-system | design-readiness | vendor-readiness | commerce | post-launch]`
**Source:** `[Stream or event that created this milestone]`
**Owner/stream:** `[Coordinator | Development | Product | Vendor | Design]`
**Status:** `[complete | current | proposed | gated | deferred | needs-coordinator-decision]`

---

## Description

> What does this milestone represent? Why is it meaningful for the product?

---

## Success criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Quality gate

> Specific check or approval required before declaring this milestone complete.

`[e.g. All 4 test suites pass. Coordinator review and commit authorization received.]`

---

## Dependencies (must complete first)

- `[Item ID]` — [description]

---

## What this unlocks (on completion)

- [Next milestone or capability]
- [Gate that clears]

---

## Decisions

| Decision | Decision ID | Status |
|---|---|---|
| | | |

---

## Risks

- [Risk 1]

---

## Action requested

> What needs to happen for this milestone to be planned or authorized?

---

## Routing targets

- [ ] Coordinator (Chat 01) — authorize milestone
- [ ] Development (Chat 03) — plan implementation
- [ ] Other: ___

---

## Coordinator sync required at completion?

- [ ] **Yes** — Coordinator must review before milestone is declared complete
- [ ] **No** — closes on quality gate criteria alone
