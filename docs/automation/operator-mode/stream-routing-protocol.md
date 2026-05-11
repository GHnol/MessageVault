# Stream Routing Protocol

**Last updated:** 2026-05-10
**Applies to:** Claude Code (Operator) and Development stream (Chat 03) when routing stream updates

---

## Purpose

Define how stream updates from the 15-chat operating model are routed to the correct docs, the correct recipients, and the correct action queues — without creating routing confusion, false authority, or scope drift.

---

## The routing problem

KeepMees operates across 15 ChatGPT streams plus Claude Code. Each stream produces decisions, updates, and risks. Without routing discipline:
- Proposed facts get treated as locked decisions
- Updates land in the wrong docs
- Coordinator loses visibility into what changed
- Claude Code receives contradictory or out-of-scope instructions

---

## Stream authority map

| Stream | Chat # | Authority level | Can lock decisions? |
|---|---|---|---|
| Control — Coordinator | 01 | Highest — product authority | YES — only stream that can lock decisions |
| Product — Core Strategy | 02 | Proposes product decisions | Proposes only |
| Development — Core Build | 03 | Proposes technical decisions | Proposes only |
| Production — Vendor Feasibility | 04 | Reports vendor facts | Proposes only |
| Production — Mockups and Vendor Strategy | 05 | Proposes product specs | Proposes only |
| Production — Packaging, Bundling, Gifting | 06 | Proposes packaging decisions | Proposes only |
| Design — Designer Hiring | 07 | Proposes hiring decisions | Proposes only |
| Design — Figma Executor Briefs | 08 | Proposes design specs | Proposes only |
| Design — Product Mockup Generation | 09 | Produces visual references | No authority |
| Brand — Logo Drafts | 10 | Produces brand assets | No authority |
| Competitors — Master Analysis | 11 | Reports competitive intelligence | No authority |
| Competitors — Zapptales Teardown | 12 | Reports competitive intelligence | No authority |
| Competitors — MyForeverBooks Teardown | 13 | Reports competitive intelligence | No authority |
| Tools — Claude Code and Git Workflow | 14 | Development tooling support | No authority |
| Tools — Accio Prompt Generation | 15 | Sourcing research support | No authority |
| Claude Code | — | Implementation executor | No authority |

---

## Routing table (stream → docs)

| Incoming source | Primary target docs |
|---|---|
| Coordinator decision (Chat 01) | `docs/ops/decision-register.md` + relevant strategy docs |
| Product response (Chat 02) | `docs/strategy/product-format-bank.md`, `docs/ops/design-readiness-register.md` |
| Development handoff (Chat 03) | `docs/strategy/master-project-truth.md`, `docs/ops/backlog-roadmap.md` |
| Vendor feasibility (Chat 04) | `docs/ops/vendor-manufacturing-register.md` |
| Mockups and vendor strategy (Chat 05) | `docs/strategy/product-format-bank.md`, `docs/ops/vendor-manufacturing-register.md` |
| Packaging stream (Chat 06) | `docs/ops/vendor-manufacturing-register.md`, `docs/strategy/product-format-bank.md` |
| Design briefs (Chat 08) | `docs/ops/design-readiness-register.md` |
| Competitors (Chat 11/12/13) | `docs/ops/competitor-intelligence-register.md` |
| AI Mastery output | `docs/ops/ai-automation-register.md` |

---

## Routing steps

### When a stream update arrives:

**Step 1 — Classify the update**
- Is it a Coordinator decision (locked authority) or a stream proposal (proposed only)?
- Which of the 15 streams produced it?
- What doc category does it belong to?

**Step 2 — Create a stream update packet**
Use the template at `docs/automation/templates/stream-update-packet.md`. Fill in:
- `sourceStream`, `updateType`, `status`
- `decisions` (with authority level: `coordinator-locked` / `stream-proposed` / `owner-approved`)
- `docsToUpdate`, `coordinatorApprovalRequired`

**Step 3 — Determine if Coordinator approval is required**

Coordinator approval is required before updating docs if:
- The update changes a locked decision
- The update marks a proposed item as locked
- The update adds a SKU to the physical launch target
- The update contradicts an existing locked decision
- The update proposes a new package or scope expansion

**Step 4 — Update the appropriate docs**
Follow `docs/automation/operator-mode/update-project-records-protocol.md`.

**Step 5 — Create a routing packet for any required actions**
Use the template at `docs/automation/templates/routing-packet.md`.

**Step 6 — Report the routing outcome**
After updating, report to the user:
- What was updated
- What is now `proposed` vs `locked`
- Whether Coordinator approval is needed
- What next actions are created

---

## Routing decision tree

```
Stream update arrives
    ├─ Is this from Coordinator (Chat 01)?
    │       ├─ YES → Can mark as "locked" after Coordinator explicitly states so
    │       └─ NO → Mark as "proposed" or "needs-coordinator-decision"
    │
    ├─ Does it contradict an existing locked decision?
    │       ├─ YES → Stop, flag, ask before writing
    │       └─ NO → Continue
    │
    ├─ Does it add a physical SKU or expand the launch target?
    │       ├─ YES → Coordinator approval required
    │       └─ NO → Continue
    │
    └─ Route to correct target docs and create routing packet
```

---

## Do NOT route to docs

- Raw chat transcript excerpts (use as source evidence, not as doc content)
- Speculative ideas without source backing (use LAYER 2 advisory sections)
- Personal observations that aren't project decisions (don't document)
- Items that already exist in docs with the same authority level (don't duplicate)
