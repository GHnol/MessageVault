# Next Actions — KeepMees / MessageVault

**Last updated:** 2026-05-10

Items marked **[NEEDS APPROVAL]** require explicit Coordinator authorization before any work begins.

---

## Immediate (this session or next)

| # | Action | Role | Authorization required |
|---|---|---|---|
| 1 | Coordinator to evaluate and authorize next development package | Coordinator | **[NEEDS APPROVAL]** |
| 2 | Decide GitHub Projects board setup | Coordinator | **[NEEDS APPROVAL]** |
| 3 | Decide NotebookLM adoption | Coordinator | **[NEEDS APPROVAL]** |

---

## Next development package (Package 3 — awaiting Coordinator authorization)

**Do not start without explicit authorization.**

Proposed scope:
- `src/products/product-draft.js` — `ProductDraft` model (per-group, per-product draft container)
- `src/core/preflight-runner.js` — executes the 10 checks in `BOOK_PREFLIGHT_CHECK_REGISTRY`
- Session save/restore UI flow wired to `SessionSerialization` (local/session persistence — DEF-08a)
- `KeepsakeGroup` + product draft lifecycle hooks
- Test coverage for all new modules

Does NOT include: checkout, PDF generation, cover design, visual redesign, cloud account persistence.
No technical gate blocking Package 3 — authorization gate only.

---

## Vendor actions (outside repo — Chat 04 / Chat 05 work)

| Action | Priority |
|---|---|
| Follow up IngramSpark on 7×10" jacketed hardcover availability | HIGH — highest risk if unavailable |
| PrintNinja follow-up: printed case under jacket at 7×10" | HIGH |
| BookBaby follow-up: multi-volume coordination between separate projects | HIGH |
| Decide whether to follow up Lulu (optional backup) | LOW |
| Hold on Blurb unless 7×10" trim is reopened | N/A — REJECTED |

---

## Design actions (outside repo — Chat 07 / Chat 08 work)

| Action | Priority |
|---|---|
| Coordinator decision on Alexander Weaver budget re-authorization | HIGH — blocks all Figma execution |
| If budget reopened: contract Alexander Weaver per Stage 3 terms | Follows budget decision |
| If budget remains closed: continue passive outreach within $1,200 budget | Medium |
| Figma execution cannot begin until designer is confirmed | BLOCKED |

---

## Decisions needed from Coordinator (no action items for Development until decided)

| Decision | What needs deciding | Downstream impact |
|---|---|---|
| Package 3 authorization | Approve, defer, or redirect scope | Development package timing |
| GitHub Projects setup | Whether to create the KeepMees Command Center board | Tracking infrastructure |
| NotebookLM adoption | Formally adopt or defer | Research/synthesis tooling |
| Designer budget | Re-authorize or continue passive search | Figma execution gate |
| Gift notes at launch | Include in v1 or defer to v1.1 | Packaging SOP and fulfillment spec |

---

## Do NOT start yet

| Item | Reason | Gate |
|---|---|---|
| Package 3 | Awaiting Coordinator authorization | Coordinator decision |
| Checkout / order flow | Vendor not confirmed; commerce blocked | Vendor confirmed + PDF pipeline |
| PDF generation pipeline | Server infra not established; vendor not confirmed | Vendor confirmed |
| Cover design work | `isCoverUnblocked()` = false | Vendor confirmed |
| React / framework migration | Deferred — re-evaluate after render/proof architecture stabilizes | Architecture inflection |
| Cloud account persistence | Deferred post-launch | Post-launch + server infra |
| Visual redesign | Explicitly gated | Coordinator + Design stream authorization |
| n8n / Make automation workflows | Later — do not build yet | Future phase |
| docs/automation expansions beyond Package 2.5B | Package 2.5B is complete; no further automation artifact scope authorized | Coordinator decision |
| Acrylic block, apparel, or blanket manufacturing | Not in launch set | Product authority decision |
| Public product claims | Not yet — public-claim status not ready for any SKU | Multiple gates |
