# Stream Update Packet

> Copy this template when routing a stream update into the KeepMees docs system.
> Schema: `docs/automation/schemas/stream-update-packet.schema.json`
> Routing protocol: `docs/automation/operator-mode/stream-routing-protocol.md`

---

**Packet ID:** `SUP-[YYYY-MM-DD]-[NNN]`
**Date:** `[YYYY-MM-DD]`
**Source stream:** `[e.g. Production - Vendor Feasibility (Chat 04)]`
**Stream chat number:** `[01–15]`
**Prepared by:** `[Agent name / human]`
**Update type:** `[decision | vendor-response | product-change | design-update | competitor-intel | risk-update | ai-mastery | packaging-update | development-handoff]`
**Status:** `[locked | current | owner-approved-target | proposed | gated | deferred | needs-coordinator-decision | needs-source]`

---

## Summary

> One paragraph. What changed or was decided in this stream update? What prompted this packet?

---

## Decisions made or proposed

| Decision | Authority | Notes |
|---|---|---|
| [Decision text] | [coordinator-locked \| stream-proposed \| owner-approved] | |

---

## Risks surfaced

- [Risk 1]
- [Risk 2]

---

## Docs to update

| Doc | Update needed |
|---|---|
| `docs/ops/decision-register.md` | |
| `docs/ops/vendor-manufacturing-register.md` | |
| `docs/strategy/product-format-bank.md` | |
| *(add/remove rows as needed)* | |

---

## Action requested

> Specific action the recipient of this packet should take.

---

## Routing targets

- [ ] Coordinator (Chat 01)
- [ ] Development (Chat 03 → Claude Code)
- [ ] Product (Chat 02)
- [ ] Design (Chat 08)
- [ ] Vendor Feasibility (Chat 04)
- [ ] Packaging (Chat 06)
- [ ] Competitors (Chat 11)

---

## Coordinator approval required?

- [ ] **Yes** — Do not act on this packet until Coordinator explicitly approves
- [ ] **No** — Development stream may proceed

---

## Raw source excerpt (optional)

> Paste the key verbatim text from the source chat that backs the decisions above.

```
[paste excerpt here]
```
