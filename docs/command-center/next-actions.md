# Next Actions — KeepMees / MessageVault

**Last updated:** 2026-06-02
**Updated by:** Claude Code (post-Package-5B weekly sync)

Items marked **[NEEDS APPROVAL]** require explicit Coordinator authorization before any work begins.

---

## Immediate (this session or next)

| # | Action | Role | Authorization required |
|---|---|---|---|
| 1 | Decide next development package — candidates: Package 3D (QA infra), Phase 12 continuation, or ProductDraft/preflight | Coordinator | **[NEEDS APPROVAL]** |
| 2 | (Optional) Import `.ics`, ClickUp CSV, TickTick CSV | Founder | — |
| 3 | Decide GitHub Projects board setup | Coordinator | **[NEEDS APPROVAL]** |
| 4 | Decide NotebookLM adoption | Coordinator | **[NEEDS APPROVAL]** |
| 5 | Decide `scripts/node_modules` tracked-history cleanup | Coordinator | **[NEEDS APPROVAL]** |
| 6 | (Optional) Install user-level notification hook: run `.\scripts\setup-claude-notification.ps1 -Apply` | Founder / contributors | — |

---

## Next development package (awaiting Coordinator authorization)

**Status: Package 5B COMPLETE — merged `dc4f86b` 2026-06-02. Coordinator decides next package.**

Package 5B (Message Book Proof Approval UX Foundation) is COMPLETE — merged to main (`dc4f86b` 2026-06-02). `KMEngine.ProofApprovalUX` with initialize, getState, submitForReview, getStatusLabel, getAllowedUserActions, serialize, restore; `#bookProofPanel` in `index.html`; 1704 Node tests; browser QA 36/36 PASS.
Package 5A (Message Book Proof Approval State Foundation) is COMPLETE — merged to main (`297a221`). `KMEngine.ProofApprovalState` with STATUS constants, `canTransition`, `create`, `transition`; 137 new tests; no UI.
AI Project OS v1.7 (all 6 gates) is COMPLETE — all merged to main 2026-06-01. OS self-audit 304/304 pass.
Operator Reliability Repair is COMPLETE — merged `c27502c` 2026-06-02.
All prior packages (2.7, 2.8, 2.9, 3A–3C, 4A–4E.1, 2.6–2.6.1, 2.5A–2.5B, 1, 2) are COMPLETE — see `docs/command-center/current-status.md`.

**Next package candidates (none authorized):**

| Candidate | Type | External gate? | Risk |
|---|---|---|---|
| Package 3D — Visual Regression Baseline Harness | QA infrastructure | None (Coordinator authorization only) | Low |
| Phase 12 continuation (scoped proof panel interactions) | Product — Phase 12 | None below GATE-04; GATE-04 (full proof UX) requires PDF + checkout | Medium (scope boundary risk) |
| ProductDraft + Preflight Runner | Engine layer | None | Low-Medium |

**"Package 5C" is not defined in the repo.** Do not start or reference it without explicit Coordinator scoping.

No development package has been authorized. The next Coordinator step is to decide the next package.

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
| Next package authorization | Which package to authorize next after Package 5B | Development resumption |
| Tower adoption (founder) | Whether to import `.ics`, ClickUp CSV, TickTick CSV | Personal execution layer; not required for repo to work |
| GitHub Projects setup | Whether to create the KeepMees Command Center board | Tracking infrastructure |
| NotebookLM adoption | Formally adopt or defer | Research/synthesis tooling |
| Designer budget | Re-authorize or continue passive search | Figma execution gate |
| Gift notes at launch | Include in v1 or defer to v1.1 | Packaging SOP and fulfillment spec |

---

## Do NOT start yet

| Item | Reason | Gate |
|---|---|---|
| Next development package | No scope authorized yet | Coordinator authorization |
| `scripts/node_modules` history cleanup | Tracked in git history; separate Coordinator decision | Separate Coordinator decision |
| Physical product previews | Not yet — no renderers implemented for mug, sticker, framed print, notebook, magnet | Coordinator authorization + renderer implementation |
| Product mockups | Not yet — no mockup work authorized | Coordinator authorization |
| Preview renderers | Not yet — renderer-not-implemented for all non-Message Book formats | Coordinator authorization |
| Proof approval UX | Not yet — no proof rendering pipeline | PDF pipeline + checkout |
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
