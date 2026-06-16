# KeepMees Design Bible — v1

**Status:** APPROVED — creative source of truth for the KeepMees rebuild.
**Approved:** 2026-06-16 by Coordinator (taste authority).
**Spine:** Quiet Monument (modern editorial) · **warmed by** the Keepsake Letter · **disciplined by** the Memoir.
**Companion records:** `docs/design/taste-trial-result.md` (why no tool was selected), `docs/architecture/phase-0-rebuild-decisions.md` (§6 design tooling), `docs/project-control/decision-log.md`.

> This Bible is the durable definition of KeepMees art direction. It is authored deliberately, human-originated, and overrides any generic AI-generated design output. Design tools may translate or accelerate it later; they do not originate it.

---

## 1. North Star thesis

**KeepMees gives ordinary message history the calm, weight, and warmth of a published keepsake — a quiet monument to a relationship, set like a book you'd keep for decades.** Modern editorial confidence, the tenderness of a kept letter, the reading dignity of a fine memoir. Never a chat app, never a dashboard, never sterile. **The words and the people are the hero; everything else gets quietly out of their way.**

## 2. Art-direction summary

A **modern editorial** foundation — confident type hierarchy, generous whitespace, full-bleed media, structure through space and rule rather than boxes — **deliberately warmed**: warm bone/ivory paper tones, a single emotional **oxblood** accent, implied material with one **foil** ceremony moment, and tender-not-kitsch treatment of human moments. **Disciplined by the memoir**: a true book-reading rhythm so long conversations read like literature, not a magazine teaser. Register: *serious-but-warm* — the feeling of opening a beautifully made book about your own life. Preciousness is earned through **restraint plus one moment of ceremony**, never ornament density. The app reading view and the Message Book are **one world**; the book simply adds ceremony.

## 3. Typography direction

- **Display — Fraunces** (modern high-contrast serif; warm, characterful, variable with optical sizing; free + self-hostable). Chosen specifically to avoid the cold Didone/fashion-brand look *and* the generic Playfair/AI-template look. Used confidently and sparingly — one or two weights; impact through scale and space, not many styles.
- **Body — Newsreader** (on-screen reading face; warm, true italics; pairs with Fraunces), at book-grade measure and leading for sustained reading. **Alternative:** Literata for a cozier e-reader warmth. The body carries the memoir discipline.
- **Labels / metadata — small-caps of the body serif**, letterspaced. No geometric/grotesque sans (Inter/Geist read SaaS). A warm humanist sans may be introduced later only if dense functional UI demands it — deferred, not chosen.
- **Licensed upgrade path** (optional, later): Canela / GT Sectra / Tiempos Headline for display. Not needed for v1.
- **Local-first:** self-host all fonts (no CDN call) so nothing leaves the device.

## 4. Color / material direction

Warm throughout — no cool whites, no pure black, no dark default. Provisional hex values, to be contrast-tuned to WCAG AA before implementation:

| Role | Provisional | Use |
|---|---|---|
| Paper (base) | warm bone `~#F4EEE2` | primary reading surface |
| Ivory (raised / ceremony) | `~#FBF7EE` | covers, chapter openers, the "open" moment |
| Ink | warm espresso `~#241F1B` | message text, headings (never pure black) |
| Ink-soft | warm taupe `~#6B5F54` | metadata, captions, secondary text |
| **Accent — oxblood** | `~#6E1A23` | the single emotional accent: emphasis, links, speaker keyline, the foil moment |
| Accent-soft — garnet (derivative only) | `~#8E3A45` | a tonal step of oxblood for dense fills / pressed states — **not** a second brand accent |
| Rule / neutral-mid (stone) | `~#CBBFA9` | hairline rules, quiet structure |
| Foil-gold (**ceremony only**) | antique gold `~#B08A4F` | foil-stamp moments only — **never** a general UI color |

- **Oxblood is the only brand accent.** Garnet exists strictly as oxblood's soft tonal derivative when oxblood is too dense; it carries no independent identity. Foil-gold appears only in ceremony surfaces (cover, "open your book," dedication) — never in reading-view chrome.
- **Material is implied, never literal.** Reading surfaces are flat warm paper-tone (no photographic texture). Material — subtle deboss, foil stamp, a hint of cloth weave — appears only at ceremony moments. Shadows are **paper-on-paper**: low, soft, warm. No floating drop-shadow SaaS cards.

## 5. Layout / editorial grid direction

- **The reading column is the hero:** a strong central measure (~62–72 characters), generous margins, book-like baseline rhythm.
- **Asymmetric editorial grid** with a **wide outer margin** holding quiet marginalia — timestamps, attributions, reactions — keeping the reading column clean (the "annotated edition"). On narrow screens this margin collapses inline / to tap-reveal (see §8).
- **Structure without boxes:** hierarchy from whitespace, **hairline rules**, and type scale — no cards, chips, or panels.
- **Full-bleed media moments** deliberately break the column to give photos and voice weight and rhythm.

## 6. Conversation-rendering direction

The **edited editorial transcript** — the core anti-clone decision.

- **No bubbles, tails, left/right split, platform colors, or read-receipt ticks.** One column, like dialogue set in a book.
- **Each turn:** a **styled speaker mini-header** followed by the message in the reading column; consecutive turns by one person group under a single header.
- **Speaker identity (groups especially):** **name is always present**, paired with a **subtle monogram/initial** and a **restrained warm tone** drawn from the speaker-tone set (§13). The user ("You") gets an anchor tone (oxblood-adjacent). **No rainbow palette, no chat-app color-coding, never color-only identity** — the tone quietly reinforces an always-present name.
- **Metadata in the margin:** timestamps and small notes sit quietly in the outer margin as small-caps.
- **Replies/quotes:** indented blockquote with a thin oxblood left-rule tying back to the referenced line.
- **Reactions — tender, disciplined:** rendered as *meaning*, e.g., a small foil-style mark with "♡ Ama" in small-caps — never an emoji pile, never a like-button. A raw emoji, if shown, is small and contained, never decoration.
- **System notes:** centered quiet italic, like stage directions ("Ama added you to Coast Crew").
- **Media:** full-width plate + quiet caption (sender · date); voice notes as a restrained labeled plate ("Voice message · 0:42") — no skeuomorphic player.

## 7. Message Book / keepsake direction

- **The bound "published edition" of the conversation — the same KeepMees world as the app reading view**, sharing type, color, and rendering language. It is **not** a separate product.
- **The book adds ceremony:** cloth-weave cover (implied) with **foil-stamped** title/monogram and subtle **deboss**; **dedication page** ("For ___"); **chaptering** by era/time; **running heads + folios**; print composition and book-specific layout polish. Clean and restrained (not wedding-album ornate).
- **Truth model:** in-app reading view = *screen truth*; Message Book = *print truth*. Shared system; the book layers cover, dedication, chapter openers, folio furniture, and the single foil moment.
- **Preciousness through restraint** + one foil ceremony — never scripts, florals, or ornament density.

## 8. Mobile direction

- **Same world, scaled** — reading-first. The reading column becomes full width; the **outer margin collapses**, so marginalia (timestamps, reactions) move to **quiet inline positions or tap-reveal**.
- **Media full-width**; section breaks and speaker headers preserved; type steps down but keeps contrast and hierarchy; comfortable touch targets.
- The **"open your book"** ceremony is present but lighter.

## 9. Motion / interaction direction

- **Still & quiet by default** — gentle low-distance fades; honors `prefers-reduced-motion`; no springy/bouncy SaaS micro-interactions, no parallax.
- **One ceremony moment:** the **"open your book"** transition (a single tasteful cover-lift / page-turn) at entry to the Message Book — used once, not throughout.
- Hover/press feedback is subtle, warm, and low.

## 10. Copy / voice direction

- **Warm-literary, sparing, human.** The user's words are the hero, so product copy stays quiet and recedes. Tender without sentimentality; plain but considered; warm second person.
- **Re-language the utilitarian:** "Analytics/Dashboard/Metrics" → "Reflections," "Your year"; "Import file" → "Bring your conversation home."
- **No** hype, exclamation spam, cutesy phrasing, emoji, jargon, or dashboard labels.
- **Provisional strings:** Import — "Bring your conversation home." · Self-ID — "Which voice is yours?" · Empty — "Your story starts when you bring a conversation in." · Ready — "Your book is ready." · Errors — gentle, human, non-technical.

## 11. Anti-pattern veto list

Any hit = reject and rework:

- No **SaaS:** cards, chips, KPI tiles, dashboard widgets, gradient buttons, purple/blue "tech" accents, Inter/Geist default look, floating drop-shadow cards.
- No **chat-app clone:** bubbles, tails, left/right split, platform green/blue, read-receipt ticks, platform icons.
- No **competitor / MyForeverBooks template:** no chat-bubbles-printed-in-a-book, no "screenshot of a chat in a frame." KeepMees renders an *edited editorial transcript*.
- No **feminine/wedding/scrapbook/greeting-card:** body scripts, hearts/florals/washi/stickers, pastel-and-gold palettes, swirly ornament, rainbow speaker colors.
- No **sterile/clinical:** cold museum-white, pure-black-on-white, all-grotesque-sans, finding-aid coldness without warmth.
- No **dashboard framing for emotion:** insights are a written "reflection / feature page," never chips or gauges.
- **Nothing out-shouts the message text.** The words and relationships win every hierarchy contest.

## 12. Component art-direction notes

| Component | Role | Art direction | Must avoid |
|---|---|---|---|
| **Message** | one utterance | text in the reading column, espresso ink, book leading; emphasis via space | bubble, tail, fill, border |
| **MessageGroup** | consecutive turns, one speaker | one speaker mini-header; turns stacked beneath with tight rhythm | re-labeling every line; alternating sides |
| **SystemNote** | non-message event | centered quiet italic, ink-soft, hairline space | badges, pills, colored banners |
| **ReactionRow** | reactions to a message | tender margin mark — small-caps "♡ Ama" / contained glyph | raw emoji pile, count chips, like-button |
| **ReplyQuote** | quoted/replied line | indented blockquote, thin oxblood left-rule, ink-soft quote | nested bubbles, screenshot of quote |
| **MediaTile** | photo / voice / attachment | full-width plate + quiet caption; voice = restrained labeled plate | drop-shadow card, skeuomorphic player, polaroid frame |
| **ParticipantLabel** | speaker identity | **name always** + subtle monogram + restrained warm tone from the speaker set | color-only identity, avatar-bubble, rainbow set |
| **DateDivider** | day/era break | centered small-caps date between hairline rules — present but **quiet** | loud banner, sticky pill, colored bar |

## 13. Token-role list

Defined as **semantic roles** (not raw values) so a future *evening* theme can remap the same roles without redesign — this is how v1 keeps dark mode possible while shipping warm-light as the only default. Values provisional (AA-tune before implementation).

**Color — surfaces**
- `--paper` warm bone (base reading surface)
- `--paper-raised` ivory (ceremony / cover / chapter opener)

**Color — ink**
- `--ink` warm espresso (primary text)
- `--ink-soft` warm taupe (metadata, captions, secondary)
- `--ink-faint` (disabled / faintest text — derived)

**Color — accent (oxblood only)**
- `--accent` oxblood (the single brand accent)
- `--accent-soft` garnet (tonal derivative of `--accent` for dense fills / pressed states — *not* an independent accent)

**Color — structure**
- `--rule` stone hairline
- `--neutral-mid` quiet warm neutral

**Color — ceremony**
- `--foil` antique gold (foil-stamp ceremony surfaces only)

**Color — speaker tones** (restrained, muted, warm — name always present; tone reinforces, never sole identity)
- `--speaker-self` (oxblood-adjacent anchor for "You")
- `--speaker-1 … --speaker-5` (a small muted warm set — e.g., clay, olive-khaki, umber, dusty plum-brown, ochre-brown — assigned deterministically; extend by harmonized derivation if a group exceeds the set, never by adding bright hues)

**Type — family**
- `--font-display` Fraunces · `--font-body` Newsreader (alt Literata) · `--font-label` body-serif small-caps

**Type — scale & rhythm**
- `--display-xl … --display-s`, `--text-l … --text-xs` (book-grade modular scale)
- `--leading-body`, `--measure` (~62–72ch), `--tracking-smallcaps`

**Space & structure**
- `--space-1 … --space-n` (baseline-grid-derived)
- `--hairline` (rule width)
- `--radius` (near-square, ~0–2px — editorial, not rounded cards)

**Surface depth & material**
- `--shadow-paper` (low, soft, warm paper-on-paper; used sparingly)
- `--deboss`, `--foil-stamp` (ceremony-component treatments only)

**Motion**
- `--motion-quiet` (duration), `--ease-quiet`, `--motion-ceremony` (the single "open your book" transition); all gated by `prefers-reduced-motion`

**Theming note:** one default theme (`warm-light`) binds these roles now. A future `evening` theme would remap `--paper`/`--ink`/etc. only — no component or token-name changes. Components must consume roles, never hardcode raw colors.

## 14. Open questions / downstream refinements (none blocking)

v1 is internally complete and locked. The following are refinements for the design-system/implementation phase, not gates to approval:

- Exact hex values + WCAG AA contrast tuning (especially oxblood-on-bone, ink-soft-on-bone, speaker tones).
- Final speaker-tone count and deterministic assignment rule (overflow-by-derivation).
- Precise type scale steps and mobile step-downs.
- Voice-note / attachment plate exact treatment.
- Message Book chaptering logic (by month vs. by time-gap "era") — settle when the book view is built.
- Whether to take the licensed display upgrade later (Fraunces is the committed v1 choice).

## 15. Governance

- **Coordinator is the taste authority.** Visual/art-direction decisions are the Coordinator's call.
- **This Bible is the creative source of truth and overrides generic AI-generated design output.** Figma / Subframe / Onlook output, AI-generated screens, and competitor/template aesthetics never override this document. Any conflict resolves in favor of the Bible.
- **Claude Code** structures, critiques (feasibility, accessibility, responsiveness, edge cases, maintainability), and implements — but only after a separately authorized package. If design direction is missing, Claude Code stops and asks rather than inventing a mediocre UI.
- **Design tools are secondary executors only** (L1 token store / handoff, or L2 implementation acceleration), engaged later, never as originators.
- **Changes** to this Bible are made deliberately, approved by the Coordinator, and versioned (v1 → v2 …); they are not silent rewrites.
