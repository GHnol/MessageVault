# Design Tool Taste-Trial Brief

**Status:** Planning aid. **Not implementation.** Run by the Coordinator outside the repo; Claude Code does not run the trial.

**Recorded:** 2026-06-10 by Claude Code (Opus 4.8). Companion to `docs/architecture/phase-0-rebuild-decisions.md` (§6 Design tooling status).

**Hard rule:** Use **synthetic / fictional content only** (provided below). **Never** paste a real conversation, export, photo, or `chat.db` into any design tool.

---

## 1. Trial purpose

Resolve the design **source-of-truth** decision by evaluating actual KeepMees-specific outputs, not tool research. Research can verify capabilities and privacy posture; it cannot decide **taste**. The trial answers: which workflow produces the strongest *premium KeepMees direction* with the cleanest handoff to Claude Code (owned React/TS/Tailwind) and an acceptable privacy posture? The goal is a **direction**, not a finished product.

## 2. Candidates

- **(A) Figma-led** — Figma as visual/brand/token source of truth; handoff via Dev Mode MCP + Code Connect.
- **(B) Subframe-led** — design surface emits owned React + Tailwind directly; Claude Code consumes via MCP.
- **(C) Onlook local-first** — open-source, self-hostable, edits real `.tsx`. *Feasibility caveat: Onlook is Next.js-scoped today — run it in a throwaway Next.js sandbox and judge the **output**, not the stack; porting to Vite is Claude Code's job later.*

Other tools (Figma Make, Figma AI, Stitch/Gemini, v0, Bolt.new, Lovable, Magic Patterns, Polymet, Superflex) remain **deferred** and are **not** in this trial. Framer is **rejected** (privacy).

## 3. Synthetic KeepMees brand seed (paste verbatim into every tool)

> "KeepMees turns personal message history into a premium, emotional keepsake — a 'Message Book.' The visual language is original, warm, and editorial: think fine stationery and a quiet memoir, not a chat app. Calm neutrals with one warm accent, generous whitespace, refined serif display + clean sans body, soft paper-like surfaces. **Do NOT imitate WhatsApp, iMessage, Messenger, Instagram, or Telegram** — no platform bubble colors, gradients, shapes, icons, or layouts. Preserve the *structure* of a conversation (who spoke, grouping, timestamps, replies, reactions, attachments, system notes) in an original KeepMees style."

## 4. Synthetic sample conversation (100% fictional — use everywhere)

**1:1 thread — "Ama" ↔ "You" (Kofi):**
```
[Mon, 10:02] Ama: Heya Kofi! Made it to the coast 🌊
[Mon, 10:03] You: amazing!! send a photo when you can
[Mon, 10:05] Ama: [Photo]
[Mon, 10:05] Ama: ↩ replying to "send a photo" — here you go 😄   (reaction: ❤️ from You)
[Tue, 18:40] You: thinking about that trip we said we'd take
[Tue, 18:41] Ama: let's actually do it this year
```

**Group thread — "Ama", "Kojo", "Esi", "You":**
```
— System: Esi added You to "Coast Crew" —
[Sat, 09:12] Kojo: who's driving 🚗
[Sat, 09:13] Esi: I can! 4 seats
[Sat, 09:13] Ama: bringing snacks 🍪🍫   (reactions: 👍 from Kojo, 😋 from Esi)
[Sat, 09:15] You: ↩ replying to Esi "4 seats" — perfect, count me in
[Sat, 09:20] Kojo: [Voice message]
— System: Ama changed the group name to "Coast Crew 2026" —
```

This exercises every required element: 1:1 + group speakers, system messages, attachment/voice placeholders, reply/quote, reactions, and multi-day timestamps (date dividers).

## 5. Per-tool prompts

**Figma (Make/AI, or manual + Dev Mode MCP):**
> "Design a premium, original KeepMees design system and the screens in §6 using the brand seed and the synthetic conversation. Define color/type/spacing/radius/shadow as **variables (tokens)**. Build reusable components (Message, MessageGroup, SystemNote, ReactionRow, ReplyQuote, MediaTile, ParticipantLabel). Mobile + desktop frames. No native-app trade dress."

**Subframe:**
> "Create a premium, original KeepMees UI (React + Tailwind) for the screens in §6. Use a token-based theme (color/type/spacing/radius/shadow). Build reusable conversation components (Message, MessageGroup, SystemNote, ReactionRow, ReplyQuote, MediaTile, ParticipantLabel). Responsive (mobile + desktop). Original visual language — do not imitate any messaging app."

**Onlook (Next.js sandbox):**
> "Scaffold a small Next.js + Tailwind sandbox and build the KeepMees screens in §6 in an original premium style with a token theme and reusable conversation components, editing real `.tsx`. Mobile + desktop. No native-app trade dress." *(Judge the generated React/Tailwind and how editable the real code is.)*

## 6. Minimum screens / components

1. Premium landing / import-choice screen
2. WhatsApp import + "which sender is you?" (self-ID) screen
3. **Rebuilt conversation view** showing: 1:1 messages, **group speakers**, system messages, attachment/media placeholders, reply/quote, reactions, timestamps/date dividers
4. Import insights / analytics area — reimagined as something **useful**, not a chip-dump
5. Message Book preview entry point (first book-preview screen)
6. A **mobile** layout of the conversation view

## 7. Evaluation rubric (score each 1–5, per tool)

Premium emotional keepsake feel · Original KeepMees language (no native-app cloning) · Conversation readability · Group-chat clarity · Media/reply/reaction handling · Accessibility (semantic sender identity, contrast, focus) · Mobile responsiveness · Copy quality · Design-system consistency · Component reusability · React/TS/Tailwind implementation fit · Ease of Claude Code handoff · Privacy/training posture · Legal/trade-dress safety.

## 8. Pass/fail disqualifiers (any one = disqualified regardless of score)

- ❌ Resembles a named app's trade dress (platform bubble colors/shapes/gradients/icons/layout).
- ❌ Requires pasting real conversations to function.
- ❌ Output is throwaway (not editable React/Tailwind).
- ❌ No token/theme system.

## 9. Artifacts to collect from each tool

- Screenshots of every screen, **desktop + mobile** (PNG).
- Code export: the generated **React/TS/Tailwind** (zip or repo), even if rough.
- **Token/theme file** (JSON or theme config).
- Component inventory (reusable pieces produced).
- A 3-line note on editability + handoff friction.

Save under a local `taste-trial/<tool>/` folder — **local only; not committed** unless separately authorized.

## 10. Privacy checklist (before pasting anything)

- ☐ **Synthetic content only** — use §3/§4; never a real conversation, export, photo, or `chat.db`.
- ☐ No real names, numbers, emails, or images anywhere.
- ☐ Figma: **verify "Content Training" is OFF** before starting (opt-out on lower tiers).
- ☐ Subframe: **check its data/training terms** (unverified — treat as train-by-default until confirmed).
- ☐ Onlook: prefer the **self-hosted/local** run for maximum data control.
- ☐ v0/Bolt/Lovable: **not in this trial**.
- ☐ No purchases without Coordinator approval (free tiers / trials only).

## 11. Winner decision rule

Taste is the Coordinator's call; the rubric makes the comparison honest, not automatic. Decision rule: **eliminate on the §8 disqualifiers first**, then pick the highest combined score on the three weightiest axes for KeepMees — *premium emotional feel* (the whole product), *Claude Code handoff fit* (owned React/TS/Tailwind + MCP), and *privacy posture*. Expected trade-off shape: **Subframe** likely wins handoff; **Figma** likely wins design-system depth/brand; **Onlook** likely wins privacy. On a taste tie, handoff + privacy break it.

## 12. Remaining checks before final adoption (post-trial)

- Verify the **winner's** privacy/training terms (Subframe) **or** settings (Figma) **or** Vite compatibility (Onlook).
- Confirm **seat/cost** path (paid Figma Dev seat vs self-hosted Onlook/Penpot).
- Confirm the **token → Tailwind** pipeline (DTCG JSON → Style Dictionary → Tailwind theme).
- Schedule **IP-attorney review** before launch (trade-dress).
