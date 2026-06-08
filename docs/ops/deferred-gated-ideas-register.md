# Deferred and Gated Ideas Register — KeepMees / MessageVault

**Last updated:** 2026-06-08 (America/New_York — Post-Package-3AI Tower Catch-Up, docs-only; Package 3AI was Verification & Harness Reliability Hardening (scripts + docs only) and touched no DEF/GATE items, so register content is unchanged. DEF-11 ReactionAnalysis engine + import-time advisory panel delivered (Package 3AH); DEF-11 in-book reaction rendering remains deferred/gated on the Figma reaction-badge design)
**Status:** Active

---

## How to read this document

**Deferred:** good idea, not in scope for current packages. Can be activated by a Coordinator package instruction.
**Gated:** blocked by a named external condition. Cannot activate until the gate clears.
**Rejected:** considered and ruled out. Do not revisit without new information.

---

## Gated ideas

### GATE-01 — PDF generation pipeline

**Gate:** Vendor confirmed AND `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` returns true
**Description:** Server-side PDF/X-4 generation from a captured `BookRenderSpec`. Includes font embedding, bleed/trim marks, and color space management.
**Pre-work in place:** `captureBookRenderSpec` exists. Preflight check registry exists. Render spec input contract is partially defined.
**What remains when gate clears:** server architecture decision, render spec format finalization, PDF library evaluation, deployment.

---

### GATE-02 — Checkout and order flow

**Gate:** PDF pipeline complete AND commerce readiness status updated to `ready`
**Description:** End-to-end order flow: configure → proof → approve → checkout → submit order to vendor.
**Notes:** ProductCatalog `message-book` currently has `commerceReadinessStatus: 'blocked'`. This status must be explicitly updated by product authority when ready.

---

### GATE-03 — Cover design tooling

**Gate:** `BOOK_PRODUCTION_DEPS.isCoverUnblocked()` returns true
**Description:** Customer-facing tool for configuring back cover content (customer editorial area). Front cover is KeepMees-controlled.
**Notes:** KeepMees controls the cover. Some customer editorial area is TBD. No work until gate clears.

---

### GATE-04 — Proof approval UX

**Gate:** PDF pipeline AND checkout complete
**Description:** In-app proof review where the customer can see a digital facsimile of the final book before it goes to manufacturing.
**Notes:** Current stance is in-app approval as the primary flow. Scope TBD.

---

## Deferred ideas

### DEF-01 — WhatsApp adapter

**Status:** DELIVERED — Package 3J (engine adapter `whatsapp-txt-v1`), Package 3K (UI wiring), Package 3L (self-ID sender picker). Merged to main 2026-06-05.
**Description:** Parse WhatsApp `.txt` chat export. Bracket format `[M/D/YY, H:MM:SS AM] Sender: text` and hyphen format `M/D/YY, H:MM AM - Sender: text`.
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-02 — Android SMS adapter

**Status:** DELIVERED — Package 3M (engine adapter `android-sms-xml-v1`), Package 3N (UI wiring). Merged to main 2026-06-05. Self-ID via `type=2` auto-mapping — no picker needed.
**Description:** Parse SMS Backup & Restore XML backup format. DOM-free regex parser; type=1→contact, type=2→self; MMS attachment-placeholder.
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-03 — Instagram DM adapter

**Status:** DELIVERED — Package 3O (engine adapter `instagram-dm-json-v1`), Package 3P (UI wiring), Package 3Q (self-ID sender picker). Merged to main 2026-06-05. HTML entity decoding; media+share → attachment-placeholder.
**Description:** Parse Instagram data export JSON (single-thread format).
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-04 — Facebook Messenger adapter

**Status:** DELIVERED — Package 3R (engine adapter `facebook-messenger-json-v1`), Package 3S (UI wiring), Package 3T (self-ID sender picker). Merged to main 2026-06-05/06. `magic_words` discriminator distinguishes from Instagram DM; HTML entity decoding; media+share → attachment-placeholder.
**Description:** Parse Facebook data export JSON.
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-05 — Telegram adapter

**Status:** DELIVERED — Package 3U (engine adapter `telegram-json-v1`), Package 3V (UI wiring), Package 3W (self-ID sender picker). Merged to main 2026-06-06. `from_id` + `date_unixtime` discriminators; extractText() for string/array-of-entities; date_unixtime Unix seconds → ISO-8601; plain Unicode (no HTML entity decoding needed).
**Description:** Parse Telegram Desktop JSON export.
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-06 — OCR image import

**Status:** Deferred
**Description:** Extract text from screenshots of conversations via OCR.
**Effort:** High. Requires server-side pipeline (no acceptable in-browser OCR at production quality).
**Activate when:** server infrastructure is established.

---

### DEF-07 — Audio / video transcript import

**Status:** Deferred
**Description:** Transcribe audio or video messages into text for inclusion.
**Effort:** High. Requires server-side transcription pipeline.
**Activate when:** server infrastructure is established.

---

### DEF-08a — Local / session persistence (save and resume)

**Status:** Near-term — NOT deferred
**Description:** Allow users to save a Message Book project and resume it later, potentially across multiple sessions. Users may take days to construct a keepsake set and must not lose progress. `SessionSerialization` (Package 1) provides the serialization schema. This is the foundation-critical path — IndexedDB, export/import session files, or equivalent privacy-preserving local storage.
**Effort:** Medium. Schema groundwork exists in `ProjectSession` and `SessionSerialization`. Package 3 includes session save/restore UI.
**Activate when:** Package 3 (already planned).

---

### DEF-08b — Cloud account and cross-device persistence

**Status:** Deferred
**Description:** Allow users to save sessions to the cloud and access them across devices. Distinct from local/session persistence — this requires auth, backend infrastructure, and account model.
**Effort:** High. Requires backend infrastructure, auth, and storage.
**Activate when:** post-launch, when persistence demand justifies the infrastructure investment. Local/session persistence (DEF-08a) must exist first.

---

### DEF-09 — Journal product renderer

**Status:** Deferred
**Description:** Full renderer for the Journal product (cataloged, not yet implemented).
**Effort:** High. Requires its own composition pipeline.
**Activate when:** Message Book reaches manufacturing readiness and Journal is next priority.

---

### DEF-10 — Build system introduction

**Status:** Deferred
**Description:** Introduce a bundler (Vite or similar) to split index.html into components and enable tree-shaking, TypeScript, etc.
**Effort:** High. Requires migration of existing index.html logic.
**Activate when:** `index.html` maintenance burden exceeds threshold OR team grows.

---

### DEF-11 — Reactions / tapbacks rendering

**Status:** Deferred — in-book rendering not started. **Capture + analysis groundwork advanced:** Package 3AG (Meta Reaction Capture, COMPLETE 2026-06-08 — impl `0331da0`) maps Instagram DM + Facebook Messenger reactions (Meta `{ reaction, actor }`) into `NormalizedMemory.reactions[]` as `{ reactor, emoji, label }`; iMessage chat.db tapbacks are also parsed upstream. Package 3AH (Reaction Analysis Engine + Panel, COMPLETE 2026-06-08 — impl `a165122`) now consumes that captured reaction data: `KMEngine.ReactionAnalysis.compute()` + `#reactionAnalysisPanel` surface it as an **import-time advisory panel only** (top reaction emojis, top reactor, most-reacted-to sender). The in-book corner-anchored reaction *rendering* (this DEF) **remains deferred/gated on the Figma reaction-badge design** — Package 3AH did NOT add in-book rendering or Message Book reaction badges.
**Description:** Render iMessage reactions/tapbacks (heart, thumbs-up, haha, etc.) in the book as corner-anchored badges attached to bubbles.
**Effort:** Medium. The raw tapback data is available in the export; it's a parser + renderer gap.
**Priority:** HIGH — this is a competitive differentiator vs MyForeverBooks (which parses but doesn't render them).
**Locked visual decision:** Reactions are corner-anchored, attached to bubble (DEC-V-02 in decision-register).
**Activate when:** visual design system is implemented in Figma + reaction badge component is designed.

---

### DEF-12 — Import Quality Report

**Status:** DELIVERED — Package 3I (merged `60cdd31` 2026-06-04). `KMEngine.ImportQualityReport.compute()` pure function; `#importQualityPanel` surfaces totalMessages, dateRange, uniqueSenderCount, senderList, selfMessageCount, contactMessageCount, attachmentOnlyCount, totalReactionCount, sourcePlatformId after every import. Estimated pages/volumes not included (scoped out per package instruction).
**Description:** After import, show a quality report: messages found, date range, sender count, self/contact split, attachments, reactions.
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-13 — Project library as keepsake shelf

**Status:** Deferred
**Description:** Replace the utilitarian project list with a visual "shelf" of book projects showing cover thumbnail, project title, source conversation label, stage/status, date range, page/volume estimate, and last edited date.
**Effort:** Medium.
**Priority:** Medium — important for emotional brand experience but not blocking.
**Competitive context:** MyForeverBooks' project library shows raw phone numbers and functions like an admin dashboard. KeepMees should make it feel like a personal keepsake archive.
**Activate when:** UI redesign phase begins.

---

### DEF-14 — Stats page

**Status:** Deferred (engine-layer data points complete through Package 3AB; Stats Page surface deferred)
**Description:** A modular stats page within the book showing: total messages, story span, messages by each person, top emojis, words shared, most active day, longest streak.
**Effort:** Medium.
**Priority:** Medium — strong engagement feature; emotionally resonant.
**Note:** Tone should be adjustable — playful stats work for couples/friends; memorial books need a gentler treatment.
**Engine-layer progress:** All 7 DEF-14 data points now have engine-layer delivery — total messages (Package 3I / ImportQualityReport); story span, most active day, longest streak, messages by person (Package 3Y / ConversationStats); top emojis (Package 3AA / EmojiAnalysis); words shared (Package 3AB / WordAnalysis). The actual in-book Stats Page surface remains deferred. Package 3AC (TimingAnalysis) delivers peak hour and day-of-week distribution as an additional engine capability beyond the original DEF-14 data points. Package 3AD (ResponseTimeAnalysis) delivers average response time, fastest responder, and per-sender response stats as additional engine capability beyond the original DEF-14 data points. Package 3AE (MessageLengthAnalysis) delivers average chars per message, longest message sender, and per-sender char stats as additional engine capability beyond the original DEF-14 data points. Package 3AF (ConversationInitiation) delivers conversation-start counts (who initiates conversations, detected from >= 6h timestamp gaps), top initiator, and per-sender initiation counts + percentages as additional engine capability beyond the original DEF-14 data points. Package 3AG (Meta Reaction Capture) is not a DEF-14 data point; it captures reaction data in the Instagram DM + Facebook Messenger adapters (capture-only groundwork). Package 3AH (ReactionAnalysis) delivers reaction summary stats — top reaction emoji, top reactor, and most-reacted-to sender — as an additional engine capability beyond the original DEF-14 data points; these surface in the import-time advisory `#reactionAnalysisPanel`. The in-book Stats Page surface remains deferred.
**Activate when:** book editor is consumer-ready.

---

### DEF-15 — Pre-print Review Assistant (cleanup checks)

**Status:** DELIVERED — Package 3X (5 WARN checks, merged `7bdcdb5` 2026-06-07) + Package 3Z (4 additional WARN checks, merged `ff79f9e` 2026-06-07). `KMEngine.ContentQualityChecks.compute()` now has 9 total WARN checks: PHONE_NUMBER_AS_SENDER_NAME, RAW_URL_IN_CONTENT, EMPTY_MESSAGE, DUPLICATE_MESSAGE (adjacent-only), SYSTEM_MESSAGE_IN_OUTPUT (Package 3X); HIGH_ATTACHMENT_RATIO (>80% attachment-only), VERY_LONG_CONTENT (text.length>1000), SHORT_CONVERSATION (<10 messages), SINGLE_SENDER_DOMINANT (all non-system from 1 unique sender) (Package 3Z). Vendor-gated manufacturing checks (bleed, trim, cover dimensions) remain gated until vendor confirmed.
**Description:** A polished cleanup check system before proof generation. Checks for: raw long links, duplicate messages, phone numbers as names, system messages in output, empty messages (content-quality subset, no vendor/manufacturing inputs required). Vendor-gated manufacturing checks (bleed, trim, cover dimensions) remain gated until vendor confirmed.
**Effort:** Delivered.
**Activate when:** N/A — delivered.

---

### DEF-16 — Gift cards

**Status:** Deferred
**Description:** Purchasable gift cards/credits allowing someone to gift a KeepMees product without touching the recipient's private messages. Should feel beautiful — designed e-gift card visuals, occasion themes, scheduled delivery, printable PDF certificate, recipient landing page.
**Effort:** Medium-High. Requires commerce infrastructure.
**Competitive context:** MyForeverBooks offers $25-$150 gift cards; theirs look generic. KeepMees gift card should feel like the start of the keepsake experience.
**Activate when:** commerce/checkout flow is complete.

---

### DEF-17 — NotebookLM integration as research layer

**Status:** Deferred (NEEDS COORDINATOR DECISION)
**Description:** Upload project materials (competitor teardowns, vendor docs, strategy docs, product philosophy) to NotebookLM notebooks for source-grounded strategic synthesis and audio overview generation.
**Effort:** Low operational effort; one-time setup per notebook.
**Activate when:** Coordinator approves NotebookLM as an official project tool.

---

### DEF-18 — AI-assisted message curation

**Status:** Deferred
**Description:** Use an AI model to suggest which messages from a conversation are most keepsake-worthy. Helps users find emotionally meaningful moments faster.
**Effort:** Medium. Client-side model preferred; server-side requires explicit opt-in by user.
**Privacy:** Message content is private by default. Server-side inference requires explicit opt-in.
**Activate when:** curation UX is identified as a top user friction point via usage data.

---

### DEF-19 — AI section title generation

**Status:** Deferred
**Description:** AI-suggested section titles based on the messages within a section. Max 45 characters — well within model capacity. Could run client-side.
**Effort:** Low-medium. Section title character limit is already enforced by `bookEditorial`.
**Privacy:** Same rule as DEF-18 — client-side preferred.
**Activate when:** editorial friction data justifies it.

---

### DEF-20 — AI dedication / inscription assistance

**Status:** Deferred
**Description:** AI-assisted writing for the dedication page — suggestions only, not auto-populated. User retains full control and authorship.
**Effort:** Low. Max dedication length is 500 characters.
**Privacy:** Dedication content does not include message data; lower sensitivity than DEF-18/19.
**Activate when:** editorial friction data justifies it.

---

### DEF-21 — Photo and media rendering in book interior

**Status:** Deferred
**Description:** Render actual photos and media attachments from iMessage conversations in the book. Currently, attachment-only messages are warned (not blocked) and appear as placeholders. True media rendering requires server-side processing, image scaling, and print-quality output.
**Effort:** High. Requires server-side image pipeline; print-quality resolution constraints apply.
**Competitive context:** MyForeverBooks renders photos. This is a gap that matters for conversations with significant photo history.
**Activate when:** server infrastructure is established and Message Book reaches manufacturing readiness.

---

## Rejected ideas

### REJ-01 — In-browser PDF generation

**Status:** Rejected
**Reason:** In-browser PDF libraries (jsPDF, PDFKit-browser, etc.) cannot produce print-quality PDF/X-4 output with proper font embedding and color management. This is a hard requirement for a physical keepsake product.
**Do not revisit** unless a browser-native PDF specification meeting print-quality requirements emerges.

---

### REJ-02 — Softcover option at launch

**Status:** Rejected for launch
**Reason:** Casebound hardcover is a positioning decision. Softcover dilutes the premium keepsake value proposition.
**Future consideration:** Softcover is not permanently ruled out — it could be a future lower-cost option. Not in scope for launch.
