# Design Readiness Register — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** LAYER 1 (source-backed) for locked visual decisions; LAYER 2 advisory appendix at bottom

---

## Purpose

Track the design readiness of each surface and product component. "Design ready" means there is a finalized visual spec that engineering can implement. This register prevents implementation work from starting before the design is ready, and flags gaps that need to be resolved.

---

## Current design posture

Visual redesign is explicitly gated (scope guard in `CLAUDE.md`). The current UI is the working implementation UI, not a finalized consumer design. A parallel design execution stream (Figma) has been approved by the Coordinator. Designer hiring is on commercial hold (see below).

**Render toolchain (Coordinator-locked):**
- **Figma** — visual master for the material design system (page masters, components, tokens)
- **KeepMees preview** — composition/behavior truth (what messages land on which pages)
- **ChatGPT Images** — premium hero/marketing renders only (comes after Figma is approved)

Rule: If Figma and Preview disagree on dynamic composition, **Preview wins**. Figma refines the visual system without breaking composition truth.

---

## Visual design system (Coordinator-locked decisions)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/01 Control - Coordinator.md`

### Typography

| Decision | Value | Status |
|---|---|---|
| Headline/display role | Serif | LOCKED |
| Message/UI role | Sans-serif | LOCKED |
| Typography principle | Serif for display, sans for messages and UI-derived content | LOCKED |
| Typography support | Typography supports rhythm; spacing leads | LOCKED |
| Titles scale | Never oversized | LOCKED |
| Exact typeface selection | Within locked roles — deferred to Figma | LOCKED ROLES ONLY |

### Spacing (3-tier system)

| Tier | Value | Applies to |
|---|---|---|
| Tight | 4–8px | Same-sender stacked messages |
| Medium | 12–16px | Sender switches |
| Wide | 24–32px | Conversation sections or emotional beats |

| Decision | Value | Status |
|---|---|---|
| Same-sender grouping | Tight — 4–8px | LOCKED |
| Sender-switch spacing | Medium — 12–16px | LOCKED |
| Section/emotional-beat spacing | Wide — 24–32px | LOCKED |
| Divider system | Whitespace-led; typography-second | LOCKED |
| Page feel | Slightly full preferred over empty | LOCKED |
| Margins | Balanced; generous; nothing cramped | LOCKED |

### Bubble system

| Decision | Value | Status |
|---|---|---|
| Fidelity | 90% faithful to iMessage, 10% refined | LOCKED |
| Alignment | True left/right alignment | LOCKED |
| Width | Max ~60–65% of page; content-based; never stretched | LOCKED |
| Color philosophy | Softened (not garish); blue right / white-gray left | LOCKED |
| Same-sender continuity | Subtle continuation indicator | LOCKED |
| Reactions | Corner-anchored, attached to bubble (see critical rule below) | LOCKED |
| Bubble feel | Authentic conversation, not scrapbook | LOCKED |

**CRITICAL LOCKED RULE — Reaction badge placement:**
- Left message → reaction badge at **top-right** shoulder (slightly overlapping edge)
- Right message → reaction badge at **top-left** shoulder (slightly overlapping edge)
- Max 1 reaction badge per message
- Never floating; never centered inside bubble; never dominant
- Emojis inside messages remain untouched — reaction badge is always separate from message content

### Divider system

| Decision | Value | Status |
|---|---|---|
| Soft dividers | Whitespace-led, no lines or ornaments by default | LOCKED |
| Section dividers | Minimal serif + spacing, not full title pages | LOCKED |
| Featured moments | Emphasis through spacing and composition — NOT labeled, NOT decorative | LOCKED |
| Divider language | Subtle, quiet, supportive, never visually dominant | LOCKED |
| Frequency | Sparse and intentional — not frequent | LOCKED |
| Overall system | Spacing-first, typography-second | LOCKED |
| Date/context text in soft dividers | Optional, only when meaningful — NOT a default | LOCKED |

### Cover system

| Decision | Value | Status |
|---|---|---|
| Philosophy | Who it is about first, not what the product is called | LOCKED |
| Default identity | Names-led (e.g., "Nathaniel & [Name]" style framing) | LOCKED |
| Cover style | Typography-led, minimal | LOCKED |
| Message bubbles on cover | Not recommended as default | LOCKED |
| Launch default | Names-first, minimal, restrained | LOCKED |
| Optional layer later | Title, date range, very restrained short line can support names | LOCKED |
| Layout | Centered, restrained, not overly stylized | LOCKED |
| Spine | Names/title, minimal, aligned with cover typography | LOCKED |
| Back cover | Very minimal (small line, date, or nothing); no product explanation or marketing copy | LOCKED |
| Colors | Neutral, premium base (soft blue, warm off-white, muted gray, deep navy); no loud colors, no gradients | LOCKED |
| Branding | Subtle "quiet maker's mark" on spine or back; never front-dominant | LOCKED |

### Visual priority ladder

| Context | Priority order | Status |
|---|---|---|
| Cover | 1. Names → 2. Supporting info → 3. Material/space | LOCKED |
| Opening spread | 1. Emotional framing → 2. Typography tone → 3. Subtle structure | LOCKED |
| Normal page | 1. Message bubbles → 2. Flow → 3. Reactions → 4. Metadata | LOCKED |
| Featured moment page | 1. The moment → 2. Space → 3. Structure (minimal) | LOCKED |
| Final page | 1. Last emotional impression → 2. Space → 3. Optional subtle close | LOCKED |

**Global rules:**
- Content over structure over metadata
- Emotion over decoration
- Whitespace guides attention
- Nothing competes unnecessarily
- Hierarchy is stable across variation

### Visual style (C Hybrid — locked)

Clean + emotional + slightly textured. NOT ultra-minimal (too sterile). NOT warm + editorial (risks Pinterest aesthetic). Balance of premium, emotional, and modern.

---

## Figma Build Package v1.1

**File name:** `KeepMees Message Book, Figma Build Package v1.1`
**Source:** `_source-intake/keepmees-consolidation-2026-05-09/08 Design - Human Figma Executor Briefs.md`

### Figma file structure (exact page order)

| Page | Frames |
|---|---|
| **00 Cover system** | Cover Master, Cover Stress Test / Short Title, Cover Stress Test / Long Title, Cover QA |
| **01 Interior page masters** | Opening/Title Page Master, Standard Conversation Page Master, Featured Moment Page Master, Section Divider Treatment Master, Final Page Master |
| **02 Components** | Messaging (section), Structural Markers (section), Editorial Blocks (section), Footer Elements (section), Cover Elements (section), Final Blocks (section) |
| **03 Tokens / styles** | Text Styles (frame), Color Roles (frame), Spacing Reference (frame), Radius Logic (frame), Margin Grid (frame) |
| **04 Scenario reconstructions** | Scenario 01/Standard Balanced, Scenario 02/Dense Stack, Scenario 03/Featured Moment, Scenario 04/Multi Section |
| **05 Notes / tensions / handoff** | Preview Mismatches (frame), Allowed Refinements (frame), Needed Dev Inputs (frame), QA Checklist (frame), Discrepancy Log (frame) |

---

## 6 required page masters

| # | Page master | Purpose |
|---|---|---|
| 1 | Cover | First physical impression; names-led, typography-led; premium emotional ownership |
| 2 | Opening / Title Page | Emotional book entry; flexible names-led or title-led; optional dedication |
| 3 | Standard Conversation Page | Core reading experience; messages dominate; quiet metadata |
| 4 | Featured Moment Page | Emotional peak; space-emphasis only; no labels |
| 5 | Section Divider Treatment | Quiet in-flow pause; whitespace-first; restrained typography |
| 6 | Final Page | Quiet emotional close; no product messaging; branded fallback allowed |

---

## Design acceptance rubric (per page type)

### Cover Master

**PASS:** Premium and personal immediately. Names-first or ownership-led feel is clear. Minimal, calm, not scrapbook-like. Strong hierarchy. Works across short and long titles. Consistent with rest of book tone.
**FAIL:** Feels templated, promotional, or decorative-first. Overuses metadata. Looks like a generic photo book. Requires per-book manual layout invention.

### Opening / Title Page

**PASS:** Calm emotional entry. Dedication feels intentional and elegant. Strong title hierarchy. Breathing room without emptiness. Matches system restraint. Names-led and title-led variants both supported.
**FAIL:** Feels utilitarian. Dedication feels pasted in. Overcrowded or too sparse. Typography fights cover or conversation pages. Rigid title-first rule imposed.

### Standard Conversation Page

**PASS:** Immediately believable as message-derived. Tight same-sender density reads naturally. Left/right alignment unmistakable. Metadata is quiet. Content dominates. Stable across dense and light scenarios.
**FAIL:** Bubbles feel cartoonish, oversized, or app-screenshot literal. Same-sender spacing too loose. Reactions float or detach. Page looks empty, noisy, or mechanically arranged.

### Featured Moment Page

**PASS:** Emotional emphasis increases clearly. Still belongs to the same system. Whitespace supports meaning. Featured treatment feels earned, not flashy. Emphasis comes only from space, pacing, and composition. Fresh-page start behavior supported.
**FAIL:** Becomes a different design language. Over-stylizes emotion. Breaks composition truth from Preview. Looks like poster art. Featured label or explicit badge introduced.

### Section Divider Treatment

**PASS:** Pause is felt through space first. Divider is quiet and premium. Section title is clear. Transition rhythm supports reading.
**FAIL:** Divider becomes decorative event design. Too much ornament. Too dense or too blank without purpose. Inconsistent with the rest of the book. Decorative rule by default.

### Final Page

**PASS:** Feels complete and warm. Brand presence is restrained. Ending has dignity and closure. Leaves emotional afterglow.
**FAIL:** Abrupt stop. Over-branded. Feels like a checkout or marketing page. Different tonal language from the book.

### Cross-system pass conditions

- High authenticity
- Intentional density
- Premium and emotionally resonant tone
- Stable hierarchy
- Content-first presentation
- Strong consistency across all masters
- NOT templated, NOT scrapbook-like, NOT cheap-looking

---

## Component inventory (full)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/08 Design - Human Figma Executor Briefs.md`

### Messaging components

| Component | Variants | Key rules |
|---|---|---|
| Message bubble left | Single, top of stack, middle of stack, bottom of stack, standalone, with reaction, with timestamp | Internal padding fixed; text-to-edge balance fixed; reaction anchor fixed |
| Message bubble right | Same as left, mirrored for side and color role | Same rules, opposite alignment |
| Stacked same-sender states | Two-message stack, three-plus stack, middle continuation, stack ending before sender switch | Tight same-sender spacing; continuity logic; sender-switch spacing increase |
| Reaction badge | Single emoji, double emoji if needed, left-anchor, right-anchor | Corner-anchored; slight overlap with bubble edge; scale relative to bubble |

### Structural marker components

| Component | Variants | Key rules |
|---|---|---|
| Timestamp | Centered below message group, paired with marker system, hidden | Distance from content fixed; small type scale |
| Date marker | Standalone, between conversation groups, hidden | Spacing above/below fixed; aligned within reading column |
| Section header | Standard section start, compact start signal | Header-to-content spacing fixed; placement within margin grid |
| Continuation marker | Continued, section continuation, hidden | Top-of-page placement; reserved breathing space before content |
| Page number | Left page, Right page, Hidden | Footer margin and trim offset fixed |

### Editorial block components

| Component | Variants | Key rules |
|---|---|---|
| Dedication block | Short, multi-line, empty-state fallback | Surrounding spacing fixed; max width behavior; line spacing |
| Cover text block | Names-led, title-led, names+title, names+title+date range, long-title handling | Text block alignment fixed; inter-line rhythm; edge offset behavior |
| Final-page branded fallback block | Brand only, brand + closing line, brand + archival note | Brand-to-copy spacing fixed; placement in final-page zone |

### Layout wrapper components

| Component |
|---|
| Conversation column container |
| Footer safe zone container |
| Cover text area container |

---

## Token system (role-based naming)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/08 Design - Human Figma Executor Briefs.md`

Rule: Do NOT lock exact font families or hex values in token names — only preserve serif-for-display and sans-for-message/UI-derived roles. Exact values are locked during Figma execution.

### Text styles (10 roles)

| Token | Role |
|---|---|
| Display / Cover Primary | Serif — names, title on cover |
| Display / Opening Primary | Serif — names/title on opening page |
| Display / Divider Title | Serif — section divider title |
| Body / Message | Sans — message bubble text |
| Body / Dedication | Sans or serif — dedication block |
| Meta / Timestamp | Sans — timestamps |
| Meta / Date Marker | Sans — date markers |
| Meta / Continuation | Sans — continuation labels |
| Meta / Page Number | Sans — page numbers |
| Brand / Quiet Close | Brand-restrained — final page |

### Color roles (11 roles)

| Token | Role |
|---|---|
| Color / Page / Background | Page background |
| Color / Bubble / Left | Left bubble background |
| Color / Bubble / Right | Right bubble background |
| Color / Bubble / Text / Left | Left bubble text |
| Color / Bubble / Text / Right | Right bubble text |
| Color / Meta / Primary | Timestamps, date markers |
| Color / Meta / Secondary | Continuation markers, page numbers |
| Color / Divider / Quiet | Section divider title |
| Color / Cover / Base | Cover background |
| Color / Cover / Text | Cover text |
| Color / Brand / Quiet | Final-page brand element |

### Spacing tokens (10 roles)

| Token | Applies to |
|---|---|
| Space / Bubble / Tight Stack | Same-sender stacked messages |
| Space / Bubble / Sender Switch | Space between sender switches |
| Space / Marker / Above | Space above structural markers |
| Space / Marker / Below | Space below structural markers |
| Space / Section / Standard | Standard section spacing |
| Space / Section / Emphasis | Featured/emphasized section spacing |
| Space / Page / Top | Page top margin |
| Space / Page / Bottom | Page bottom margin |
| Space / Footer / Safe | Footer safe zone height |
| Space / Cover / Edge Offset | Cover edge offset |

### Radius logic (5 roles)

| Token | Applies to |
|---|---|
| Radius / Bubble / Standard | Default bubble corner radius |
| Radius / Bubble / Stacked Top | Top bubble in same-sender stack |
| Radius / Bubble / Stacked Middle | Middle bubble in same-sender stack |
| Radius / Bubble / Stacked Bottom | Bottom bubble in same-sender stack |
| Radius / Badge / Reaction | Reaction badge shape |

### Margin system (7 roles)

| Token | Applies to |
|---|---|
| Margin / Outer | Outer page margin |
| Margin / Inner | Inner page margin (binding side) |
| Margin / Top | Top page margin |
| Margin / Bottom | Bottom page margin |
| Column / Conversation Width | Message column width |
| Header / Safe Zone | Header safe zone height |
| Footer / Safe Zone | Footer safe zone height |

---

## Preview-mirror rules

**Must mirror Preview exactly (structural truth):**
- Real pagination outcomes and page breaks
- Section break placement
- Continuation behavior
- Divider presence/absence and placement
- Featured moment placement and fresh-page behavior
- Message ordering and left/right alignment
- Same-sender grouping structure
- Presence/absence of timestamps, date markers, reactions, section headers
- Engine-determined density outcomes
- Any overflow or carry behavior

**May refine visually (without changing structure):**
- Bubble color softness and edge polish
- Typography refinement within locked roles
- Subtle spacing polish (not altering structure)
- Divider restraint and typographic elegance
- Footer/metadata subtlety
- Cover material presentation
- Featured header visual richness (no labels)
- Ink/paper/production-minded texture cues

**What is NOT allowed as "refinement":**
- Moving page breaks
- Changing section starts
- Moving featured moments
- Inventing new transitions
- Treating placeholder Preview styling as canon

---

## Mixed-event page treatment

A mixed-event page is one that contains more than one structural event (e.g., carry-over from Section A + new start of Section B).

**Rule:** Preserve the exact visible top-to-bottom order shown in the isolated page crop. Do NOT let flattened page metadata override the visible crop order. Preserve carry-at-top, new-section-lower behavior where it appears.

**Source priority order:**
1. Isolated page crop (PRIMARY)
2. Page order / scenario sequence (SECONDARY)
3. BookRenderSpec context (TERTIARY)
4. Flattened page metadata (LAST RESORT)

---

## Figma execution order

1. Build tokens/styles first (text, color, spacing, radius, margin)
2. Build core messaging components (bubbles, stacked states, reaction badge)
3. Build structural marker components (timestamp, date marker, section header, continuation marker, page number)
4. Build editorial block components (dedication block, cover text block, final-page fallback block)
5. Build layout wrapper components
6. Build Standard Conversation Page master first (system truth for interiors)
7. Build Opening/Title Page and Cover
8. Build Featured Moment Page and Section Divider Treatment
9. Build Final Page
10. Reconstruct preview-derived scenarios using approved masters
11. Document notes/tensions/handoff; return focused discrepancy list

---

## Designer hiring stream

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/07 Design - Message Book Designer Hiring.md`
**Status:** COMMERCIAL HOLD — Alexander Weaver selected; pricing above current budget

### Process (3-stage async)

- **Stage 1:** Written fit assessment + curated proof review (async, message-only — no calls)
- **Stage 2:** Full freelancer brief + MessageBook handoff PDF review; approach, timeline, pricing, questions
- **Stage 3:** Preview Handoff Package v1 + Human Figma Executor Brief v1 + Discrepancy Log review; milestone plan

### Candidate status (final)

| Candidate | Status | Notes |
|---|---|---|
| Alexander Weaver | **COMMERCIAL HOLD — leading finalist** | Strongest portfolio (editorial, print, book-like). Quoted £2,800 vs $1,200 posted budget. All 3 stages complete. Remains available if contracting reopens. |
| Christel Mulongoy | **SECONDARY / PASSIVE HOLD** | Strong general design talent; portfolio reads brand/digital rather than book/editorial. Not advanced to Stage 2. |
| Amine Kaddari | Passive hold — awaiting Stage 1 proof | |
| Sara | Passive hold — awaiting Stage 1 proof | |
| vino_costa | Passive hold | |
| Olivier Darbonville | Passive hold — Figma confirmation needed | |
| Bato | Self-selected out | |
| NICKELFOX | Reject — agency posture, not editorial specialist | |
| Kofax Agency | Reject — not relevant editorial signal | |
| Dil Nawaz | Reject — generic positioning, weak proposal | |

### Alexander Weaver standard terms (if contracting reopens)

- 50% upfront to begin
- 50% on receipt of final files
- Work agreement form for signature
- 2–3 week timeline (Week 1: setup + first master; Week 2: buildout + checkpoint; Week 3 if needed: polish + handoff)

### Evaluation criteria (for future candidates)

1. Editorial/print layout taste (typography, calm hierarchy, premium rhythm, reading objects — NOT dashboards)
2. Figma systems skill (real components, variants, tokens, organized files, scalable structure)
3. Ability to follow source truth (work from constraints; Preview is structural truth)
4. Premium aesthetic judgment (restraint, emotional maturity, non-generic, not decorative for its own sake)
5. Conversation/UI sensitivity (understand message bubbles, preserve authenticity)
6. Communication/professionalism (clear proposals, async-first, no call pressure)

### Budget

- First milestone budget: $1,000–$1,200 USD (original posted amount)
- Alexander's quote: £2,000 (Stage 2), £2,800 (Stage 3) — above current budget
- Process paused — not ghosted; Alexander remains benchmark if budget is resolved

### Hiring platforms

- **Dribbble** (Primary): design-focused, editorial taste visible
- **Contra** (Secondary): editorial designer pools, publishing-adjacent
- **Upwork** (Fallback): broader supply, higher noise

---

## App surface inventory

| Surface | Design status | Notes |
|---|---|---|
| Landing / onboarding | Working implementation | Not consumer-finalized |
| Ingestion flow | Working implementation | |
| Chat view | Working implementation | |
| Message selection | Working implementation | |
| Keepsake group management | Working implementation | |
| Book composition / preview | Working implementation | Composition authority (Preview wins) |
| Editorial fields (title, dedication, section names) | Working implementation | Editorial constraints implemented |
| Review view | Working implementation | Explicitly off-limits for changes |

---

## Physical product surface inventory

| Surface | Design status | Notes |
|---|---|---|
| Book interior layout | Partially defined | Pagination constants locked; Figma visual spec not yet built |
| Book cover (front) | Not started | Blocked; `isCoverUnblocked()` gate not met; visual direction locked |
| Book cover (back) | Not started | KeepMees controls; customer editorial area TBD |
| Book spine | Not started | Depends on volume page count |
| Section divider pages | Not started | Visual language locked in system |
| Title / Opening page | Not started | Role defined; Figma master needed |
| Dedication page | Not started | Max 500 chars; blank = no page renders |
| Featured moment page | Not started | Visual language locked in system |
| Ending / Final page | Not started | Quiet close; branded fallback allowed |
| Padding page | Not started | System-managed; minimal design |

---

## Design decisions locked in software

| Decision | Where encoded |
|---|---|
| 44 lines per page | `BOOK_PAGE_LINES` in index.html |
| Section header height (4 lines) | `BOOK_HEADER_LINES` in index.html |
| Featured section header height (8 lines) | `BOOK_FEATURED_HEADER_LINES` in index.html |
| Section divider height (3 lines) | `BOOK_DIVIDER_LINES` in index.html |
| Continuation cost (2 lines) | `BOOK_CONTINUATION_LINES` in index.html |
| Title max 60 chars | `bookEditorial.TITLE_MAX` in index.html |
| Dedication max 500 chars | `bookEditorial.DEDICATION_MAX` in index.html |
| Section title max 45 chars | `bookEditorial.SECTION_TITLE_MAX` in index.html |
| Emoji: standardized print-safe set | Locked production decision |
| Interior stock: single matte/premium | Locked production decision |

---

## Design readiness gates

| Gate | Condition | Affects |
|---|---|---|
| Cover design unblocked | `isCoverUnblocked()` = true (vendor confirmed) | Front cover, back cover, spine |
| Interior visual spec finalized | Figma page masters built + Coordinator/Product approved | Page layout, typography, section dividers |
| Designer confirmed | Stage 3 complete, agreement signed, budget resolved | All Figma execution work |
| Consumer UI design | Post-working-implementation phase | All app surfaces |

---

## LAYER 2 — Claude Advisory, Not Yet Coordinator Approved

### Advisory: Figma executor gap remains open

Contracting with Alexander Weaver is on commercial hold (pricing above current budget). The Figma Build Package v1.1 brief is written and complete. Design execution cannot begin until either:
1. Budget is resolved and Alexander is contracted, OR
2. Coordinator authorizes a different path (alternate designer, in-house execution, or AI design execution)

### Advisory: Reactions/tapbacks must be in Figma component inventory

The `reaction badge` component is required in the Figma component inventory. This is directly tied to the KeepMees competitive differentiator of rendering reactions that MyForeverBooks parses but does not display. It must be designed at the system level in Figma before being implemented in code.

### Advisory: Visual system is locked at principle level; exact values not yet locked

Font families, exact hex color values, exact corner radii, and exact spacing values were intentionally left for real rendering tests in Figma. Do not attempt to specify them in code before the Figma master exists.
