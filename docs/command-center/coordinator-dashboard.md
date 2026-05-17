# Coordinator Dashboard — KeepMees / MessageVault

**Last updated:** 2026-05-16
**Updated by:** Claude Code (Package 4C status sync)
**For:** Coordinator (ChatGPT Chat 01)

> This dashboard gives Coordinator the high-level view of all streams, decisions, gates, and risks. For detail, follow the links to Package 2.5A source-of-truth docs.

---

## Product identity

- **KeepMees** — broad keepsake product-system engine for turning meaningful digital conversations into physical and digital keepsakes
- **Message Book** — flagship product (casebound hardcover, 7×10"), not the boundary of the brand
- **Premium means accessible quality**, not luxury exclusivity: thoughtful, well-designed, giftable, broadly accessible
- **Strongest wedge:** "preserve the messages that matter most in a form that feels lasting and beautiful" — not "export your messages"
- **Meaning-first, not product-first** user experience

Full philosophy: `docs/strategy/master-project-truth.md`

---

## Physical first launch target (6 SKUs — Owner-Approved Strategic Target)

Each SKU is gated by its own render/proof, vendor, packaging, pricing, fulfillment, and public-claim readiness.

| Tier | SKU | Packaging status | Manufacturing status |
|---|---|---|---|
| Hero | Message Book | PackagingResearch | `planning` |
| Hero | Framed Conversation Print | NotPlanned | `not-started` |
| Core | Mug | NotPlanned | `not-applicable` |
| Core | Mini Keepsake Notebook | NotPlanned | `not-started` |
| Add-on | Mini Message Sticker Pack | NotPlanned | `not-applicable` |
| Add-on | Fridge Magnet | NotPlanned | `not-started` |

**Important:** Software ProductCatalog (Package 2) has a different mix: Message Book, Journal, Mug, Sticker Pack, Wall Art, Gift Wrap. These are not the same list.

Full detail: `docs/strategy/product-format-bank.md` | `docs/ops/vendor-manufacturing-register.md`

---

## Software delivery state

| Package | Status | Commit |
|---|---|---|
| Package 1 — KMEngine foundation | COMPLETE | `1f05970` |
| Package 2 — ProductCatalog, Eligibility, KeepsakeGroup | COMPLETE | `87972c9` / `541a1b8` |
| Package 2.5A — 16 source-of-truth docs | COMPLETE | `d1c5a44` / `d69dc2c` |
| Package 2.5B — Automation artifacts | COMPLETE | `bb23e8b` / `aa6402c` |
| Package 3A — Local project session save and resume foundation | COMPLETE | `8dcc959` / `b40fa2b` |
| Package 3B — Automated E2E regression harness foundation | COMPLETE | `0ce973a` / `40b4bba` |
| Package 3C — Real file import, download, and full-path E2E coverage | COMPLETE | `f8379d0` / `904cf51` |
| Package 2.6 — Operator Inbox + Stream Update Processor | COMPLETE | `23b46b7` / `e7d635d` |
| Package 2.6.1 — Operator Inbox Extraction Polish | COMPLETE | `841d28a` / `75a2378` |
| Package 4A — ProductRenderSpec Foundation | COMPLETE | `f08a7dd` / `1058dc1` |
| Package 4B — Prototype Preview Registry Foundation | COMPLETE | `eca2329` / `3f939d0` |
| Package 4C — Product Experience Readiness Resolver Foundation | COMPLETE | `367dfc7` / `879c244` |

Tests: **1431 Node tests passing, 0 failures + 29 seeded E2E + 52 real-files E2E browser tests**. App code last changed: Package 3B (`0ce973a`) — Packages 3C, 2.6, 2.6.1, 4A, 4B, and 4C added module/test/docs coverage only, no app code changes.

---

## Architecture posture

- `index.html` is the current runtime shell — **interim only**, not permanent architecture
- Approved near-term path: modular KMEngine extraction into `src/`
- Framework/build-system migration: deferred (tracked future decision), NOT rejected
- Local/session persistence: DELIVERED — Package 3A (`8dcc959`)
- Cloud account persistence: deferred post-launch

ADR: `docs/architecture/adr-001-app-architecture-path.md` | Roadmap: `docs/architecture/architecture-roadmap.md`

---

## Gate map (what unlocks what)

```
Vendor confirmed
    → isCoverUnblocked() = true
        → Cover design work
        → PDF pipeline development
            → Checkout / order flow
                → Proof approval UX

Package 3B (COMPLETE — `40b4bba`)
    → Automated E2E Regression Harness Foundation — DELIVERED

Package 3C (COMPLETE — `904cf51`)
    → Real File Import, Download, and Full-Path E2E Coverage — DELIVERED

Package 2.6 (COMPLETE — `e7d635d`)
    → Operator Inbox + Stream Update Processor — DELIVERED

Package 2.6.1 (COMPLETE — `75a2378`)
    → Operator Inbox Extraction Polish — DELIVERED

Package 4A (COMPLETE — `1058dc1`)
    → ProductRenderSpec Foundation — DELIVERED
    → Render planning target terminology (isRenderPlanningTarget) established
    → Commerce/manufacturing/public-claim readiness explicitly gated for all non-Message Book formats
    → 341 new tests; no app behavior changed

Package 4B (COMPLETE — `3f939d0`)
    → Prototype Preview Registry Foundation — DELIVERED
    → PREVIEW_STATUS constants, makePreviewEntry factory, 6 preview registry entries
    → prototypePreviewEnabled: true for Message Book only; 5 non-book formats remain renderer-not-implemented stubs
    → PrototypePreviewResolver: resolve(), blockers (preview-not-supported, engine-not-supported, etc.)
    → 215 new tests; no app behavior changed; index.html not touched
    → Commerce/manufacturing/public-claim readiness remains gated for all non-Message Book formats

Package 4C (COMPLETE — `879c244`)
    → Product Experience Readiness Resolver Foundation — DELIVERED
    → EXPERIENCE_STATUS constants (11 values: unknown → unsupported → catalog-known → eligibility-known →
      render-planning-known → prototype-preview-supported → proof-ready → commerce-ready →
      manufacturing-ready → public-claim-ready; BLOCKED as special state)
    → Combined readiness resolver: catalog + eligibility + render spec + preview registry → one output per product/group
    → resolveForProduct, resolveAllForGroup, resolvePreviewableForGroup, resolveBlockedForGroup, resolveByStatus
    → Semantic guard: system dependency blockers (renderer-not-implemented) and content eligibility blockers
      are BOTH preserved in readiness output — Suite 15 regression test proves this
    → 337 new tests; no app behavior changed; index.html not touched
    → Commerce, manufacturing, proof, and public-claim gates remain separate readiness concepts — all false currently

Next package (not yet authorized)
    → Awaiting Coordinator evaluation and authorization after Package 4C closeout

Designer confirmed (budget resolved)
    → Figma execution begins
        → Design Viability Checkpoint A
            → Vendor export work
```

---

## Decisions needed (NEEDS COORDINATOR)

| Decision | Decision type | Urgency |
|---|---|---|
| Evaluate and authorize next package after Package 4C closeout | Roadmap decision | High — Package 4C complete; development paused pending authorization |
| GitHub Projects board setup | Tool adoption | Medium |
| NotebookLM adoption | Tool adoption | Medium |
| Designer budget re-authorization | Budget decision | High — blocks Figma |
| Gift notes at launch | Product decision | Medium — needed before packaging SOP |
| Wave 1B packaging vendor outreach (Packlane, noissue) | Vendor decision | Medium |

---

## Vendor stream status

| Vendor | Status | Priority |
|---|---|---|
| PrintNinja | VIABLE (batch/scale only; 250 MOQ/title) | Tier 1 |
| BookBaby | VIABLE WITH CONDITIONS (multi-volume system limit) | Tier 2 |
| IngramSpark | PENDING — no response | Tier 2 — HIGH RISK |
| Blurb | REJECTED (8×10" only, not 7×10") | Closed |
| Lulu | PENDING (optional backup) | Tier 3 |

Full detail: `docs/ops/vendor-manufacturing-register.md`

---

## Design stream status

| Item | Status |
|---|---|
| Figma Build Package v1.1 brief | COMPLETE — written and ready |
| Alexander Weaver (top candidate) | COMMERCIAL HOLD — £2,800 quoted vs $1,200 budget |
| Christel Mulongoy | SECONDARY / PASSIVE HOLD |
| Other candidates (Amine Kaddari, Sara, vino_costa, Olivier Darbonville) | Passive hold |
| Figma execution | BLOCKED — no confirmed designer |

Full detail: `docs/ops/design-readiness-register.md`

---

## Competitor intelligence summary

| Competitor | Status | Key threat |
|---|---|---|
| Zapptales | ACTIVE (EU focus, 34–38 EUR) | Established brand in EU market |
| MyForeverBooks | ACTIVE (US, $74.98–$128.98, A5) | US market presence, photo rendering |
| PrintMyChats | NOT a real competitor (static waitlist, no commerce) | None |
| Keepster | DISCONTINUED August 2023 | None |

KeepMees winning lane: premium emotional design, privacy-first, meaning-first flow, 7×10" hardcover format, reaction rendering.

Full detail: `docs/ops/competitor-intelligence-register.md`

---

## AI and automation stack status

| Layer | Tool | Status |
|---|---|---|
| Source of truth | Markdown + Git (this repo) | ACTIVE — approved |
| Reasoning agents | ChatGPT (15 chats) | ACTIVE |
| Implementation | Claude Code | ACTIVE |
| Execution board | GitHub Projects | Recommended — NEEDS COORDINATOR DECISION |
| Research library | NotebookLM | Recommended — NEEDS COORDINATOR DECISION |
| Routing automation | n8n / Make | LATER — do not build yet |

Full detail: `docs/ops/ai-automation-register.md`

---

## Risk summary

| Risk | Likelihood | Impact | Status |
|---|---|---|---|
| Designer budget gap delays Figma | H | H | Open |
| Vendor not confirmed; commerce blocked | M | H | Open |
| index.html grows unmaintainable before migration | M | M | Mitigated (modular extraction) |
| PDF pipeline more complex than anticipated | H | M | Deferred (gated) |
| Multi-volume split estimates wrong at vendor limits | M | M | Open |
| IngramSpark 7×10" jacketed unavailable | M | H | Open |
| AI session context loss | M | M | Mitigated (Package 2.5A docs) |

Full detail: `docs/ops/risk-register.md`

---

## Locked decisions summary (most critical)

| ID | Decision | Status |
|---|---|---|
| DEC-P-01 | Message Book is flagship product | Locked |
| DEC-P-02 | 7×10" trim | Locked |
| DEC-P-03 | Casebound hardcover at launch | Locked |
| DEC-P-06 | PDF generation server-side only | Locked |
| DEC-P-08 | 6-product physical first launch target | Owner-Approved Strategic Target |
| DEC-A-01 | Single-file app (index.html) — ACTIVE INTERIM | Active Interim |
| DEC-A-03 | Deterministic pagination; version-gated | Locked |
| DEC-V-02 | Bubble system fidelity (90% iMessage) | Locked |
| DEC-V-08 | Reaction badge placement (CRITICAL) | Locked |

Full register: `docs/ops/decision-register.md`
