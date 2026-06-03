# Coordinator Dashboard — KeepMees / MessageVault

**Last updated:** 2026-06-03
**Updated by:** Claude Code (post-Package-3F state-sync)
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
| Package 4D — Product Experience Readiness Consumer Foundation | COMPLETE | `47c402a` / `4747dff` |
| Package 4E — Product Format Availability Surface Foundation | COMPLETE | `99bdf8f` / `7c87f20` |
| Package 4E.1 — E2E Startup Timing Reliability Patch | COMPLETE | `3c4ce70` / `73dae00` |
| Package 2.7 — AI Development Operating System Upgrade Pass | COMPLETE | `6dde21b` / `cebdc72` |
| Package 2.8 — KeepMees Project Control Tower | COMPLETE | `2a5fb54` / `bdb73db` |
| Package 2.9 — AI Project OS Auto-Management Upgrade Pass | COMPLETE | `81c5069` / `a20af30` |
| Package 5A — Message Book Proof Approval State Foundation | COMPLETE | `e2df2a0` / `297a221` |
| Package 5B — Message Book Proof Approval UX Foundation | COMPLETE | `fb62b5c` / `dc4f86b` |
| Package 3D — Visual Regression Baseline Harness | COMPLETE | `5a5eaa0` / `645f6bd` |
| Package 3E — ProductDraft and Preflight Runner Foundation | COMPLETE | `dd4f641` / `4390038` |
| Package 3F — ProductDraft Lifecycle Coordinator | COMPLETE | `18f3544` / `395629e` |
| Package 3G — Session UI Wiring for ProductDraft Lifecycle | COMPLETE | `05f4048` / `3192a15` |
| AI OS Usability Patch — Short Command Interface | COMPLETE | `f84e759` / `cb920be` |
| AI OS Framework Groundwork — skills canonical, sync contract, audit | COMPLETE | `219f0b3` / `cc7139a` |
| AI Project OS v1.7 (Gates 1–6) | COMPLETE | `3c641a9`→`f30ea62` 2026-06-01 |
| Operator Reliability Repair | COMPLETE | `81b2329` / `c27502c` 2026-06-02 |

Tests: **2039 Node tests passing, 0 failures + 47 seeded E2E + 70 real-files E2E browser tests + visual regression check**. `index.html` app behavior last changed: Package 3G (`05f4048`) — lifecycle modules loaded; `showBookView()` draft init; `enterComposition()` forward-compat hook; `getGroupDraft()` test helper. No rendering, proof panel, readiness gate, or eligibility logic changed. Package 5B (`fb62b5c`) last added proof panel UI (`#bookProofPanel`, CSS, `renderBookProofPanel()`). Package 3F added engine layer only; Package 3G wired it into the browser session. No app/product/vendor/design/manufacturing decisions reopened. No next package authorized.

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

Package 4D (COMPLETE — `4747dff`)
    → Product Experience Readiness Consumer Foundation — DELIVERED
    → All 6 Package 4 modules (render-spec, render-spec-resolver, preview-registry, preview-resolver,
      experience-readiness, experience-consumer) wired into index.html via script tags
    → ProductExperienceConsumer bridge: null-safe isAvailable(), resolveForGroup(), resolveProductForGroup(),
      resolvePreviewableForGroup(); KMEngine.ProductExperienceConsumer
    → isReadinessAvailable() and resolveGroupReadiness(group) added to window.__km
    → E2E Phase 20 (6 tests): availability, EXPERIENCE_STATUS on window, group resolve, message-book status,
      non-book gated status, null safety
    → Real-files E2E: 58/58 passed; capture harness scenario A: passed
    → 35 new unit tests; existing app behavior, imports, save/load, and Message Book flows preserved
    → No preview UI, no product renderers, no proof approval, no checkout/payment added
    → Non-Message Book product formats remain renderer-not-implemented where applicable

Package 4E (COMPLETE — `7c87f20`)
    → Product Format Availability Surface Foundation — DELIVERED
    → Safe "Product formats" section injected per card in Your Keepsakes view via buildFormatAvailability()
    → Message Book label: "Available for Message Book preview" (fmt-available, green) — only when canPreview true
    → Non-book render-planning format labels: "{name}: Planned format" (fmt-planned, grey)
    → Blocked case label: "{name}: {eligibility blocker text}" (fmt-blocked, orange)
    → No non-book preview buttons; no non-book order buttons; no product mockups; no product preview images
    → No commerce, manufacturing-ready, public-claim, or order language
    → E2E Phase 21 (6 tests): section renders, message-book tag text, fmt-available class, non-book planned
      labels, no commerce language, no crash
    → 41 seeded E2E / 64 real-files E2E; capture harness scenario A: passed
    → Existing imports, save/load, standalone keepsakes, and Message Book flows preserved
    → Physical product previews, preview renderers, proof approval, visual regression, commerce, and
      manufacturing work remain not started

Package 4E.1 (COMPLETE — `73dae00`)
    → E2E Startup Timing Reliability Patch — DELIVERED (test-harness only, no app change)

Package 2.7 (COMPLETE — `cebdc72`)
    → AI Development Operating System Upgrade Pass — DELIVERED
    → Universal agent contract refresh; Claude/Codex interchangeability
    → context hygiene / model switching / tool switching / session restart / scope boundaries / worktree protocols
    → CURRENT_STATE.md + NEXT_SESSION_PROMPT.md; QA pre-commit + release-readiness templates
    → docs/project-control readiness (plan, calendar spec, weekly-sync placeholder)
    → hardened .gitignore; Claude agents/skills + Codex README placeholders
    → NOT built: full Project Control Tower, master roadmap, master schedule, Kanban,
      Google Calendar .ics, ClickUp import, TickTick import, n8n/Make/Zapier, Product Package 5A
    → no app code; no product/vendor/design/manufacturing decisions reopened

Package 2.8 (COMPLETE — `bdb73db`)
    → KeepMees Project Control Tower — DELIVERED
    → Full repo-native operating system under docs/project-control/ (22 files)
    → Master roadmap (Phases 0–15), master schedule (dated + confidence labels), 
      current sprint, backlog (16 lanes), Kanban board, 11 phase gates, 
      decision log, project risk register
    → Calendar layer: calendar-spec.md + committed keepmees-project-calendar.ics 
      (surgical .gitignore exception); 12 events incl. weekly rituals + monthly 
      reviews + gate-review placeholders
    → External layers: clickup-import.csv (17×30), ticktick-import.csv (10×18), 
      ticktick-weekly-checklist.md, ticktick-recurring-routines.md
    → Horizon plans: next-7-days, next-30-days, next-90-days
    → Process: coordinator-weekly-sync.md (active), next-session-prompt.md
    → 2 Package 2.7 stubs superseded with history preserved
    → no app code; no locked decisions reopened

Package 2.9 (COMPLETE — `a20af30`)
    → AI Project OS Auto-Management Upgrade Pass — DELIVERED
    → Universal AI Project OS layer at docs/ai-system/ (5 files: README, 
      universal-standards, bootstrap-template, CHANGELOG, version-history)
    → 7 new dev protocols: auto-management (umbrella), model-routing, 
      token-efficiency, context-budget-checklist, tool-batching, 
      package-boundary-closeout, notification-setup
    → 2 new QA docs: test-strategy, package-verification-template
    → .claude/commands/README.md readiness placeholder (no live commands)
    → Cross-links added across AGENTS, CLAUDE, .codex, .claude/agents, 
      .claude/skills, context-hygiene, model-switching, PR template
    → .gitignore extended (IDE/OS/log noise + defensive Codex patterns)
    → Honest enforcement labels: every capability classified as automatic, 
      semi-automatic, policy-driven, user-level, or backlog
    → No app code; no live hooks/subagents/skills/slash commands shipped; 
      no locked decisions reopened; Package 5A still paused

Package 5A (COMPLETE — `297a221`)
    → ProofApprovalState: STATUS constants, canTransition, create, transition
    → 137 new Node tests; no UI; no index.html changes

AI OS Framework Groundwork Pass (COMPLETE — `cc7139a`)
    → 13 skills canonical, closeout sync contract, OS self-audit, notification wizard
    → Bootstrap Core v0.5.0; project-control sync foundation; no app code

Package 5B (COMPLETE — `dc4f86b` 2026-06-02)
    → Proof approval UX foundation: KMEngine.ProofApprovalUX + index.html #bookProofPanel + persistence
    → 1704 Node tests; browser QA 36/36 PASS

Package 3D (COMPLETE — `645f6bd` 2026-06-02)
    → Visual Regression Baseline Harness: scripts/visual-regression-harness.mjs
    → Scenario A 4-page baselines committed; BOOK_PAGINATION_VERSION=1; pixelmatch comparison
    → vr:baseline + vr:check npm scripts; --simulate-regression mode verified
    → No app code, no index.html, no src/**

Package 3E (COMPLETE — `4390038` 2026-06-02)
    → ProductDraft and Preflight Runner Foundation: ProductDraftState + ProductPreflight
    → 5-status draft lifecycle; PAGINATION_STABILITY runner; 9 gated checks not-applicable
    → aggregate overallStatus incomplete while gated; NO manufacturing readiness API
    → productDrafts persistence/restore; engine layer only, no index.html

Package 3F (COMPLETE — `395629e` 2026-06-03)
    → ProductDraft Lifecycle Coordinator: KMEngine.ProductDraftLifecycle
    → getDraft, initDraft, advanceDraft, applyPreflightResult, resetDraft
    → in-place mutation of group.productDrafts; result envelopes {success, error, draft}
    → 104 tests (9 suites incl. semantic guards); 2039 Node tests total; engine layer only, no index.html

Coordinator decides next package ← current position
    → Candidates: scoped Phase 12 continuation (proof panel interactions, below GATE-04)
    → OR: session UI wiring for draft/preflight state (engine complete in 3E + 3F)
    → OR: preflight runners for vendor-gated checks (gated until vendor confirmed)
    → "Package 5C" is NOT defined — do not start without explicit Coordinator scoping

Designer confirmed (budget resolved)
    → Figma execution begins
        → Design Viability Checkpoint A
            → Vendor export work
```

---

## Decisions needed (NEEDS COORDINATOR)

| Decision | Decision type | Urgency |
|---|---|---|
| Decide next package after Package 3E | Roadmap decision | High — Package 3E complete; candidates in `decision-log.md` |
| Founder adoption of `.ics` / ClickUp CSV / TickTick CSV imports | Tool adoption | Optional |
| `scripts/node_modules` tracked-history cleanup | Repo hygiene decision | Low — backlog |
| GitHub Projects board setup | Tool adoption | Medium |
| NotebookLM adoption | Tool adoption | Medium |
| Designer budget re-authorization | Budget decision | High — blocks Figma / Phase 7+ |
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
