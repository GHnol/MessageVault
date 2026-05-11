# Decision Record

> Use this template to capture a new decision for the decision register.
> After Coordinator approval, add the entry to `docs/ops/decision-register.md`.
> Schema: `docs/automation/schemas/decision.schema.json`

---

**Decision ID:** `DEC-[P|A|O|V|ID]-[NN]`
**Date:** `[YYYY-MM-DD]`
**Source:** `[Stream or chat that produced this decision]`
**Owner/stream:** `[Coordinator | Product | Development | Vendor | Design]`
**Status:** `[locked | current | owner-approved-target | proposed | needs-coordinator-decision]`

---

## Decision

> What was decided? State it clearly and concisely.

---

## Rationale

> Why was this decision made? What alternatives were considered and why were they rejected?

---

## Constraints created

> What downstream constraints does this decision create?

- [Constraint 1]
- [Constraint 2]

---

## Affected files or constants

| File / constant | Impact |
|---|---|
| | |

---

## Risks

- [Risk 1]

---

## Supersedes

> If this decision supersedes an earlier one, list the old decision ID here.

`[DEC-X-NN]` — [brief description of superseded decision]

*(Leave blank if new decision)*

---

## Action requested

> What needs to happen next — Coordinator approval, doc update, implementation change?

---

## Routing targets

- [ ] Coordinator (Chat 01) — approve and lock
- [ ] Development (Chat 03) — relay to Claude Code implementation
- [ ] Product (Chat 02) — update product truth
- [ ] Design (Chat 08) — update design system if visual decision
- [ ] Vendor (Chat 04) — update vendor/manufacturing register

---

## Coordinator approval required?

- [x] **Yes** — This decision must be Coordinator-approved before it is treated as locked

**Approval status:** `[pending | approved | rejected]`
