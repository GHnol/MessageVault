# Coordinator Sync Packet

> Use this template to prepare a sync packet for Coordinator (Chat 01).
> Send TO Coordinator: fill "Delivered since last sync" and "Decisions needed."
> Send FROM Coordinator: fill "Decisions locked" and "Next recommended action."
> Schema: `docs/automation/schemas/coordinator-sync-packet.schema.json`

---

**Packet ID:** `CSP-[YYYY-MM-DD]-[NNN]`
**Date:** `[YYYY-MM-DD]`
**Direction:** `[to-coordinator | from-coordinator]`
**Prepared by:** `[Agent name / human]`
**Source:** `[Package name or stream that triggered this sync]`
**Owner/stream:** `[Development | Claude Code | Product | Design | Vendor]`

---

## Summary

> One paragraph. What is this sync about and why is it needed now?

---

## Delivered since last sync

| Item | Status | Commit / notes |
|---|---|---|
| [Package 2.5A docs] | complete | d1c5a44 / d69dc2c |
| [Item 2] | [complete \| in-progress \| blocked] | |

---

## Decisions needed from Coordinator

| # | Question | Urgency | Context |
|---|---|---|---|
| 1 | [Question text] | [immediate \| this-session \| next-session \| low] | [Brief context] |
| 2 | | | |

---

## Decisions locked (Coordinator-approved)

| Decision | Decision ID |
|---|---|
| [Decision text] | DEC-[X]-[NN] |

---

## Risks to flag

- [Risk 1]
- [Risk 2]

---

## Action requested

> What should Coordinator do with this packet?

---

## Routing targets

- [ ] Claude Code — implement authorized package
- [ ] Development (Chat 03) — relay decision
- [ ] Product (Chat 02) — update product truth
- [ ] Design (Chat 07 / 08) — update design stream
- [ ] Vendor (Chat 04) — follow up

---

## Do NOT start (without explicit Coordinator go-ahead)

- [Item 1 — e.g. Package 3]
- [Item 2 — e.g. Checkout flow]

---

## Streams needing sync after this packet

| Stream | Reason |
|---|---|
| Development (Chat 03) | |
| Design (Chat 08) | |

---

## Next recommended action

> One sentence: what should happen next after Coordinator reviews this packet?

---

## Coordinator approval required?

- [x] **Yes** — This packet requires Coordinator review before any action is taken

**Status:** `[pending | approved | rejected]`
