# Phase 0 — Rebuild Decision Checkpoint

**Status:** Planning / decisions locked. **No implementation authorized.** No scaffold, no dependencies, no `package.json`, no Vite/React/TypeScript setup, no app/`src`/`scripts` changes.

**Recorded:** 2026-06-10 by Claude Code (Opus 4.8), on branch `docs/phase-0-rebuild-decision-checkpoint` (base `main` @ `3e49f00`). Not committed at time of writing.

**Provenance:** Coordinator decisions made during the "Product Foundation Reality Audit & Reconstruction" review — a read-only audit of the current `index.html` MVP plus two adversarially-verified deep-research passes on AI design tooling. This document is the authoritative record of the locked Phase 0 decisions; it complements `docs/architecture/adr-001-app-architecture-path.md` and `docs/architecture/architecture-roadmap.md`.

> **Why this exists.** The current product is a single ~9,720-line `index.html` MVP plus a partially-extracted `src/` engine. Dogfooding exposed foundational defects: WhatsApp imports render one-sided (every sender hard-coded `contact`); there is no media or ZIP intake anywhere; group chats are not really supported (binary me/them renderer, no per-speaker labels); modern iMessage messages are silently lost (extraction reads only `m.text`, never `attributedBody`); word analytics return stopword soup (no stopword filtering); copy has pluralization/grammar defects and raw phone-number sender labels; and a single iMessage-approximation renderer is used for every platform. The decision is to **rebuild on a credible foundation rather than patch the MVP.** The decisions below govern that rebuild.

---

## 1. Rendering

- Original premium KeepMees visual language.
- Preserve platform-faithful **data and structure**: sender identity, group speakers, message grouping, timestamps, replies/quotes, reactions, attachments/media, system messages, deleted/unsupported placeholders, and platform/source metadata.
- **Do not clone native-app trade dress** — no platform-specific bubble colors, shapes, gradients, iconography, or layouts. Escalate to a real IP/trademark attorney before shipping anything that visually resembles a named app.

## 2. Design resourcing

- No professional human designer.
- An AI design stream provides art direction and design artifacts.
- The Coordinator approves taste / visual direction.
- Claude Code implements the approved design in-repo and critiques feasibility, accessibility, responsiveness, edge cases, state handling, and maintainability. If design direction is missing, Claude Code stops and asks rather than inventing a mediocre UI.

## 3. Architecture

- Approved direction: **client-side Vite + React + TypeScript SPA.**
- **Staged strangler-fig migration** — port pure engine/domain logic first, then rebuild the UI view-by-view. **No big-bang rewrite.**
- **Local-first / in-browser processing preserved. No backend. Nothing leaves the device at runtime.**
- Minimal, audited runtime dependencies.
- The existing `index.html` stays available until replacement flows prove parity; retire only at a defined cutover.

## 4. Sequencing

- **Phase 0 first:** architecture, design tooling, fixture readiness, and rebuild plan.
- Then **data-foundation-first verticals**, each shipped with its UX (functionality and UX developed together, not deferred).
- **WhatsApp iOS is the first proof vertical.**

## 5. Platform priority

1. WhatsApp iOS (first)
2. iMessage (Mac)
3. Instagram / Messenger (Meta)
4. Telegram

**Deferred** until fixtures are available: Android SMS, WhatsApp Android.

## 6. Design tooling status

- **Final source-of-truth tool is NOT locked.** Current finalists: **Figma** vs **Subframe**; **Onlook** is the local-first option. To be decided by a Coordinator-led hands-on **taste trial** using synthetic content.
- **Framer rejected for now** on privacy grounds (only published privacy statement is Version 1.6 / Jan 2021; broad ML-analysis-of-Content right; no AI-training opt-out).
- **v0 / Bolt.new / Lovable / etc. = concept-exploration only** unless later proven otherwise.
- **Subframe privacy / training terms still require verification** before adoption (its capabilities and Claude Code MCP support are verified; its data posture was not examined).
- **Synthetic / sanitized content only** in all design tools. **Real private conversations must never be pasted into any design tool.**
- Evidence note: Figma Make, Figma AI, Google Stitch / Gemini, Bolt.new, Magic Patterns, Polymet, and Superflex remain **unevaluated** — no surviving verified evidence yet.

## 7. Fixture protocol

- Real, sanitized fixtures required before adapter rebuild.
- Minimal samples only; preserve parser-relevant structure; redact private content; use dummy media where possible.
- No raw, full private conversations committed.
- gitignored private fixtures may be used only with explicit Coordinator approval.

---

## Out of scope for this checkpoint (hard)

No implementation, scaffold, dependency install, `package.json`, Vite/React/TypeScript setup, app code, `index.html`, `src/**`, or `scripts/**` changes; no Tower catch-up; no branch deletion; no commit. This document is a decision record only.

## Open items (carried)

- **Source-of-truth taste trial** — Figma vs Subframe vs Onlook, Coordinator-led, synthetic content. (A taste-trial brief has been prepared separately.)
- **Privacy-vs-handoff cost path** — paid Figma seats vs self-hosted Onlook / Penpot.
- **Pre-adoption verification of the winner** — Subframe privacy/training terms, or Figma privacy/training settings, or Onlook Vite compatibility.
- **IP-attorney review before launch** (trade-dress).
- **Optional third research pass** on still-unevaluated tools, or deprioritize them in favor of the verified Subframe / Onlook / Figma cluster.
