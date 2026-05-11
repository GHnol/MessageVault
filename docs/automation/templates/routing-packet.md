# Routing Packet

> Use this template to route a specific action or decision to the right recipient.
> Schema: `docs/automation/schemas/routing-packet.schema.json`
> Routing protocol: `docs/automation/operator-mode/stream-routing-protocol.md`

---

**Packet ID:** `RP-[YYYY-MM-DD]-[NNN]`
**Date:** `[YYYY-MM-DD]`
**Origin:** `[Stream name or agent that created this packet]`
**Subject:** `[One-line subject — max 120 characters]`
**Urgency:** `[immediate | this-session | next-session | low]`
**Linked stream update packet:** `SUP-[...]` *(if applicable)*

---

## Destination

- [ ] Coordinator (Chat 01)
- [ ] Development — ChatGPT (Chat 03)
- [ ] Claude Code (executor)
- [ ] Product (Chat 02)
- [ ] Design (Chat 07 / 08)
- [ ] Vendor Feasibility (Chat 04)
- [ ] Packaging (Chat 06)
- [ ] Competitors (Chat 11)
- [ ] AI Mastery

---

## Summary

> What happened that created this routing packet? What does the recipient need to know?

---

## Action required

> Exact action the destination should take. Be specific.

---

## Do NOT start

> Items the recipient must not begin as a result of this packet.

- [Item 1]
- [Item 2]

---

## Owner/stream

**Owner:** `[Person or stream responsible for acting]`

---

## Status

**Status:** `[proposed | needs-coordinator-decision | gated | current | owner-approved-target]`

---

## Coordinator approval required?

- [ ] **Yes** — Do not proceed until Coordinator explicitly approves
- [ ] **No** — Proceed per standard protocol

**Approval status:** `[pending | approved | rejected | not-required]`
