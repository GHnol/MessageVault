# Next Actions — KeepMees / MessageVault

**Last updated:** 2026-06-05
**Updated by:** Claude Code (post-Package-3J state-sync)

Items marked **[NEEDS APPROVAL]** require explicit Coordinator authorization before any work begins.

---

## Immediate (this session or next)

| # | Action | Role | Authorization required |
|---|---|---|---|
| 1 | Decide next development package — Package 3I complete (DEF-12 activated); candidates: WhatsApp adapter (DEF-01), Android SMS adapter (DEF-02), further Phase 12 continuation (below GATE-04), preflight runners for 9 vendor-gated checks, or another authorized direction | Coordinator | **[NEEDS APPROVAL]** |
| 2 | (Optional) Import `.ics`, ClickUp CSV, TickTick CSV | Founder | — |
| 3 | Decide GitHub Projects board setup | Coordinator | **[NEEDS APPROVAL]** |
| 4 | Decide NotebookLM adoption | Coordinator | **[NEEDS APPROVAL]** |
| 5 | Decide `scripts/node_modules` tracked-history cleanup | Coordinator | **[NEEDS APPROVAL]** |
| 6 | (Optional) Install user-level notification hook: run `.\scripts\setup-claude-notification.ps1 -Apply` | Founder / contributors | — |

---

## Next development package (awaiting Coordinator authorization)

**Status: Package 3J COMPLETE — merged `f1eca34` 2026-06-05. Coordinator decides next package.**

Package 3J (WhatsApp TXT Adapter) is COMPLETE — merged to main (`f1eca34` 2026-06-05). `KMEngine.whatsappTxtAdapter` — bracket and hyphen WhatsApp export format; canHandle, normalizeAll, import; system-message filtering; media placeholders (`<Media omitted>` etc → `isAttachmentOnly: true`); multi-line continuation; participants in first-seen order; senderRole `contact` for all senders (Me inference deferred); 91 new tests (`whatsapp-txt-adapter-tests.mjs`); 5 km-engine smoke assertions; 2269 Node; whatsapp platform `stub` → `supported`. Engine-only; no index.html wiring.

Package 3I (Import Quality Report) is COMPLETE — merged to main (`60cdd31` 2026-06-04). `KMEngine.ImportQualityReport.compute()` engine module; `#importQualityPanel` shows message count, date span, sender count, attachments, reactions after txt and chat.db imports; Phase 25 E2E (4 tests); 2173 Node; 84/84 real-files; 17/17 browser QA. DEF-12 from deferred-gated-ideas-register is now activated and COMPLETE.
Package 5C (Proof Panel User Withdrawal and UX Completion) is COMPLETE — merged to main (`4733c32` 2026-06-04). `renderBookProofPanel()` pending-review branch now includes "Cancel proof review" button + "Removes local proof review marking. No files were sent." hint. Cancel calls `ProofApprovalUX.withdrawSubmission()` (pending-review→none). `ProofApprovalState` extended with pending-review→none transition. Phase 24 E2E (4 tests); 57 seeded / 80 real-files total. 27/27 browser QA PASS. GATE-04, checkout, PDF, vendor, manufacturing, admin, and readiness gate exclusions confirmed.
Package 3H (Draft-Preflight Status Surface and Proof Panel Gate) is COMPLETE — merged to main (`1297f92` 2026-06-03). `showBookView()` auto-runs PAGINATION_STABILITY book check for in-progress drafts and advances to preflight-passed/failed. `renderBookProofPanel()` gated on all real groups reaching preflight-passed. Phase 23 E2E (6 tests); 53 seeded / 76 real-files total. No engine changes. "preflight" not in user-visible text. GATE-04, checkout, PDF, vendor, manufacturing, and readiness gate exclusions confirmed.
Package 3G (Session UI Wiring for ProductDraft Lifecycle) is COMPLETE — merged to main (`3192a15` 2026-06-03). Lifecycle modules loaded in browser; `showBookView()` initializes group drafts (none→in-progress, idempotent); `enterComposition()` forward-compat hook; `window.__km.getGroupDraft()` test helper; Phase 22 E2E (6 tests).
Package 3F (ProductDraft Lifecycle Coordinator) is COMPLETE — merged to main (`395629e` 2026-06-03).
Package 3E (ProductDraft and Preflight Runner Foundation) is COMPLETE — merged to main (`4390038` 2026-06-02).
Package 3D (Visual Regression Baseline Harness) is COMPLETE — merged to main (`645f6bd` 2026-06-02).
Package 5B (Message Book Proof Approval UX Foundation) is COMPLETE — merged to main (`dc4f86b` 2026-06-02).
Package 5A (Message Book Proof Approval State Foundation) is COMPLETE — merged to main (`297a221`).
AI Project OS v1.7 (all 6 gates) is COMPLETE — all merged to main 2026-06-01. OS self-audit 304/304 pass.
All prior packages (2.7, 2.8, 2.9, 3A–3C, 4A–4E.1, 2.6–2.6.1, 2.5A–2.5B, 1, 2) are COMPLETE — see `docs/command-center/current-status.md`.

**Next package candidates (none authorized):**

| Candidate | Type | External gate? | Risk |
|---|---|---|---|
| Phase 12 continuation (scoped proof panel interactions) | Product — Phase 12 | None below GATE-04; GATE-04 (full proof UX) requires PDF + checkout | Medium (scope boundary risk) |
| Preflight runners for vendor-gated checks | Engine layer | Vendor/manufacturing inputs gated | Gated until vendor confirmed |

**Package 3J is now COMPLETE.** No development package has been authorized after Package 3J. The next Coordinator step is to decide the next package.

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
