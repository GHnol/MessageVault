# WhatsApp iOS Data-Foundation Plan

**Status:** PLANNING / SPECIFICATION ONLY — no implementation authorized by this document.
**Branch:** `planning/whatsapp-ios-data-foundation` (base `main` @ `cea39b1`). **Uncommitted** pending separate Coordinator authorization.
**Recorded:** 2026-06-16 by Claude Code (Opus 4.8).
**Context:** First real import-truth vertical. WhatsApp iOS is the first proof platform (the one dogfooded and found broken). Companions: `docs/architecture/phase-0-rebuild-decisions.md`, `docs/design/keepmees-design-bible.md`.

> This plan specifies WHAT to build and in what order. It does not build it. No `index.html`, `src/**`, `scripts/**`, `package.json`, dependency, or fixture changes are made by this planning pass.

**Implementation progress (updated 2026-06-17):** **P1 COMPLETE** (canonical model + adapter contract — impl `bd57c8a`). **P2 COMPLETE** (WhatsApp text parser hardening — impl `8d7ed86`). **P3 COMPLETE** (self-identification + participant mapping — impl `30f0733`). **P4 COMPLETE** (group-chat correctness — impl `5a0217b`; evidence-based group detection, title/roster inference, typed system events). **P5 PREFLIGHT COMPLETE** (ZIP/media intake dependency evaluation + implementation plan — docs `7acd0e5`; full evaluation in `docs/architecture/whatsapp-zip-media-intake-preflight.md`). All merged to `main`. **P5A IMPLEMENTED — awaiting commit authorization** (Native ZIP Reader Spike + Dependency Decision Gate — branch `feature/whatsapp-data-foundation-p5a-native-zip-reader-spike`; **engine/test only, no deps, no `package.json`, no UI**): new `src/core/whatsapp-zip-reader.js` (`KMEngine.WhatsAppZip` native no-dependency central-directory reader) + adapter `opts.mediaManifest` resolution + async `importZip`; Node 3980→**4068 / 32 suites**, E2E 57/57 + 195/195 and VR Scenario A 4/4 unchanged. **P5A finding:** the native no-dependency path passes full synthetic coverage — **recommend continuing native-only**, with sanitized real-`.zip` validation recorded as a fixture-gated risk (vendored/pinned fflate remains a Coordinator-gated fallback only; final dependency decision is the Coordinator's to ratify). **P5B COMPLETE** (WhatsApp ZIP Canonical Intake Consolidation + Edge-Case Hardening — impl `6c91dc2`, merged to `main`; engine/test only; Node →**4140 / 32 suites**). **P5C IMPLEMENTED — awaiting commit authorization** (Private WhatsApp ZIP Fixture Validation Harness — branch `feature/whatsapp-data-foundation-p5c-private-zip-validation`; **local validation tooling + tests + docs only, no `index.html`/UI/deps, no real ZIP/media committed**): new `scripts/validate-private-whatsapp-zips.mjs` validates real/sanitized WhatsApp `.zip` exports against the production native path (`KMEngine.WhatsAppZip`/`importZip`) and emits a privacy-safe summary (counts/booleans/diagnostic-codes only — never message text, names, phones, or filenames); SKIPs cleanly with no fixtures; `--selftest` proves the pipeline on synthetic archives; `whatsapp-zip-reader-tests.mjs` 117→135 (Suite 16); Node 4140→**4158 / 32 suites**, E2E 57/57 + 195/195 and VR Scenario A 4/4 unchanged. **P5C is the real-archive validation gate for P5D** — `.zip` ingest UI stays blocked until a real sanitized with-media archive reaches PASS (or an understood WARN). Guidance: `docs/qa/private-whatsapp-zip-validation.md`. See the package-breakdown table in §5 for per-package status; `AI_HANDOFF.md` / `CURRENT_STATE.md` carry the live state.

---

## 1. Current WhatsApp adapter reality

### 1.1 What exists now
- **`src/adapters/whatsapp-txt-adapter.js`** — `KMEngine.whatsappTxtAdapter`, adapter id `whatsapp-txt-v1`, platform `whatsapp`, version `1`.
  - Two line formats via regex: **bracket** `[M/D/YY, H:MM:SS AM] Sender: text` and **hyphen** `M/D/YY, H:MM AM - Sender: text`.
  - `canHandle()` sniffs the first non-empty line against those two regexes.
  - `parseLines()` builds raw messages, appending non-matching non-blank lines as multi-line continuation.
  - `normalizeAll()` maps to `NormalizedMemory`; **system messages skipped**, malformed (missing sender/timestamp) skipped, media-placeholder detection.
  - `import()` returns an ImportResult: `memories`, `participants` (distinct senders, first-seen order), `importWarnings`, `rawCounts {total, imported, skipped}`.
- **Self-ID lives in `index.html`** (not the adapter): `showWhatsAppSenderPicker()` + `applyWhatsAppSelfSender()` (≈ lines 4532–4575) — a post-import UI step that flips `senderRole` to `self` for the chosen sender by **string name match**.
- **Renderer is binary** (`index.html` ≈ 5582, 5624): `((m.senderRole === 'self' || m.sender === 'Me') ? 'me' : 'them')`.
- **`src/core/import-quality-report.js`** — advisory diagnostics (totals, date range, unique senders, self/contact counts, attachment-only count, reaction counts, messages without timestamp/text).
- **Synthetic fixture** `scripts/fixtures/fake-whatsapp-chat.txt` — fictional 1:1 (Alice/Bob), US bracket format, one system line, one `<Media omitted>`.
- **Tests** `src/tests/whatsapp-txt-adapter-tests.mjs` — 14 suites (API shape, canHandle, fixture import, hyphen, multi-line, system filtering, media placeholders, participants, rawCounts, NormalizedMemory fields, empty/invalid, semantic guard).

### 1.2 Known parser weaknesses
- **Fragile timestamps:** `tryParseTimestamp()` calls `new Date("6/1/24, 9:00:00 AM")` — non-ISO, engine/locale-dependent; on failure it stores the **raw string** as `timestamp`, which then fails downstream `Date.parse` (counted as "without timestamp"). No explicit format parsing.
- **US-only / 12-hour assumption:** regex requires `M/D/YY` slashes + `AM/PM`. Real iOS exports are **locale-dependent**: `D/M/YY`, `DD/MM/YYYY`, `YYYY-MM-DD`, `DD.MM.YY`; **24-hour** times (no AM/PM); a **narrow no-break space** (U+202F) or NBSP (U+00A0) before AM/PM; localized AM/PM markers. Many real iOS exports will **fail `canHandle`** or **mis-order day/month**.
- **Invisible characters:** iOS prefixes some lines (esp. system lines and `<attached:>`) with a **LTR mark U+200E**; not stripped → breaks classification and matching.
- **Naive system detection:** `isSystem = (no ": " present)`. Misses/mislabels real system lines and a normal line that happens to lack `": "`; system lines are **discarded**, not preserved.
- **Multi-line blank loss:** continuation requires a non-blank line, so intentional blank lines inside a message are dropped.

### 1.3 One-sided rendering / self-ID issue
- The adapter **hardcodes `senderRole: 'contact'` for every message** (`whatsapp-txt-adapter.js:95`). Nobody is `self` at import time.
- Self-ID is a **post-import UI patch** the user must run; if skipped, **everything renders as "them"** (one-sided).
- There is **no participant identity in the model** — `sender` is a bare string; `self` is a per-message role set by name match. A display-name change or phone-number-as-name silently fragments identity.

### 1.4 Current media / ZIP gap
- Only **no-media placeholders** handled (`<Media omitted>`, `image/video/audio/sticker/GIF omitted`) → `text:'[Attachment]'`, `isAttachmentOnly:true`, `type:'attachment-placeholder'`.
- **No `<attached: FILENAME>` handling, no ZIP intake anywhere.** `media[]` is **never populated**. No file linking, no present/missing detection, no MediaAttachment shape.

### 1.5 Current group-chat gap
- **No group vs 1:1 distinction.** Participants = distinct sender strings.
- Renderer is **binary me/them** → all non-self speakers collapse into **one "them" lane**; no per-speaker identity/label in groups.
- Group **system events** ("X created group", "X added Y", "X left", subject/icon changes) are **skipped**, so the group's structure and social events are lost.

---

## 2. Target canonical model needs

A new, richer model built **alongside** the legacy `NormalizedMemory` (strangler-fig; legacy renderer untouched until the Bible-driven UI consumes the new model). Proposed pure builders (engine-only, deterministic ids, no DOM):

- **Conversation** — `{ id, platform, exportVariant (ios|android), isGroup, title, participants[], messages[], systemEvents[], dateRange{first,last}, source (SourceMetadata), diagnostics (ImportDiagnostics) }`.
- **Participant** — `{ id (stable), displayName, handle (phone/username|null), isSelf, aliases[] (name changes), messageCount }`. Self is a **participant-level** flag, not a per-message string match.
- **Message** — `{ id, conversationId, participantId, timestamp (ISO + rawTs + tzAssumption), type (text|media|system-ref|deleted|unsupported), text, media[] (MediaAttachment), reactions[] (Reaction), replyTo (Reply|null), editedAt|isEdited, isDeleted, sourceNativeId, raw }`.
- **MessageGroup** — `{ participantId, messages[], startTs, endTs }` (same-speaker run; a **derived** view, computed not stored, to feed editorial rendering).
- **MediaAttachment** — `{ id, kind (image|video|audio|voice|sticker|gif|document|contact|location), filename, mimeType, byteSize, sourceRef (zip path), present (file found vs omitted), width|height|durationMs|caption|placeholderReason }`.
- **Reaction** — `{ reactor (participantId), emoji, label }` (formalize the Meta-adapter shape). Note: **WhatsApp text exports contain no reactions** — field exists, WhatsApp leaves it empty.
- **Reply / Quote** — `{ quotedMessageId|null, quotedText|null, available (bool) }`. Note: **WhatsApp text exports do not mark replies** — `available:false` for WhatsApp txt; field reserved for sources that do.
- **SystemEvent** — `{ id, timestamp, kind (encryption-notice|group-create|add-participant|remove-participant|leave|subject-change|icon-change|name-change|number-change|disappearing-messages|missed-call|deleted-message|edited-notice|unknown), actors[], text, raw }`. **Preserved, not dropped.**
- **SourceMetadata** — `{ platform, exportVariant, originalFilename, detectedDateFormat, detectedLocale, twelveOrTwentyFourHour, fileHash, importedAt, adapterId, adapterVersion }`.
- **ImportDiagnostics** — `{ counts {total, imported, skipped, system, media, deleted, unparsed}, skipReasons[], unparsedLines[], ambiguousDates[], mediaMissing[], selfIdentified (bool), formatConfidence, warnings[] }`.

**Gap summary vs. today:** Conversation/Participant/MessageGroup/MediaAttachment/SystemEvent/Reply do not exist; Reaction/SourceMetadata/ImportDiagnostics are partial. `NormalizedMemory` ≈ a flat Message.

---

## 3. WhatsApp iOS export formats to support

> Exact byte-level conventions **must be confirmed against real sanitized fixtures** (§4). Below is the expected surface to design against.

- **1:1 no-media `.txt`** — single `_chat.txt`; lines `[date, time] Sender: text`; iOS uses brackets, usually with seconds; locale date order; possible U+202F before AM/PM; possible U+200E prefixes.
- **1:1 with-media `.zip`** — `_chat.txt` + media files; messages reference media via `<attached: FILENAME>` (iOS). No-media exports use `<Media omitted>` (and `image/audio/video/sticker/GIF omitted`, `Contact card omitted`, `location: <url>`).
- **group no-media `.txt`** — as 1:1 plus multiple senders and **system lines** (group create, add/remove, subject/icon changes).
- **group with-media `.zip`** — group `_chat.txt` + media files.
- **ZIP filenames / folder structure (expected; confirm):** iOS ZIP contains `_chat.txt` at root with media files alongside (flat); attachment filenames follow a `<id>-<TYPE>-<date>-<seq>.<ext>` style (e.g., `00000042-PHOTO-2024-06-01-09-02-00.jpg`), plus `.opus` voice notes, `.vcf` contacts, `.pdf`/docs. (Android differs: `WhatsApp Chat with X.txt`, `IMG-YYYYMMDD-WAxxxx.jpg`, `FILENAME (file attached)` — **deferred**.)
- **Timestamp / date formats:** `M/D/YY`, `D/M/YY`, `DD/MM/YYYY`, `YYYY-MM-DD`, `DD.MM.YY`; 12-hour (`h:mm[:ss] AM/PM`, U+202F separator) or 24-hour (`HH:mm[:ss]`); iOS brackets vs Android `... -`.
- **System message formats (expected wording):** "Messages and calls are end-to-end encrypted…", "You created group "X"", "You added ~Name", "X left", "X changed the subject from "A" to "B"", "X changed this group's icon", "X changed their phone number", "This message was deleted" / "You deleted this message", "Missed voice/video call", edited suffix "<This message was edited>". Often U+200E-prefixed.
- **Media markers:** iOS `<attached: FILENAME>`; Android `FILENAME (file attached)`; no-media `<Media omitted>` / `image omitted` / `audio omitted` / `video omitted` / `sticker omitted` / `GIF omitted` / `Contact card omitted` / `location: <url>`.

---

## 4. Fixture protocol

### 4.1 Exact fixtures needed from the Coordinator (into a gitignored private dir)
1. 1:1 **no-media** iOS `.txt`
2. 1:1 **with-media** iOS `.zip`
3. group **no-media** iOS `.txt`
4. group **with-media** iOS `.zip`
5. the specific **real broken regression sample** (the Abena/N case named in the original Phase 0 handoff)
6. (if available) one **non-US-locale** export (D/M order or 24-hour) to lock locale handling

### 4.2 Sanitize without destroying parser structure
- Replace each real name with a **consistent pseudonym** (same person → same pseudonym, so participant mapping still exercises).
- Replace phone numbers with **format-valid fakes**; replace message bodies with neutral text **but preserve line count, timestamps, sender positions, system-line wording patterns, `<attached:>`/omitted markers, and filenames**.
- **Keep WhatsApp boilerplate verbatim** (encryption notice, system phrasings) — it is not private and is parser-relevant.
- Preserve the original **date format, separators, and invisible characters** (U+202F/U+200E) — they are exactly what the parser must handle.

### 4.3 Dummy media rules
- Replace every real media file with a **tiny valid dummy** of the **same extension** and **same filename** (so `<attached:>` linking still resolves): e.g., 1×1 px PNG/JPG, a sub-second `.opus`/`.mp3`, a 1-line `.vcf`, a 1-page `.pdf`. Never include real photos/audio/video.

### 4.4 Commit / gitignore policy
- **Commit (synthetic, small):** sanitized fixtures under `scripts/fixtures/whatsapp/…` (txt + a small synthetic `.zip` built from dummy media).
- **Gitignore (real):** raw real exports under a **new private dir** — recommend `scripts/fixtures/private/` added to `.gitignore` (today `_source-intake/`, `raw-transcripts/`, `screenshots/` are ignored; there is **no** dedicated private-fixtures path yet).
- **Never commit:** real names, phone numbers, real message content, real media, real ZIPs, or anything derived from a real conversation that is not fully sanitized.

---

## 5. Proposed implementation package breakdown

Coordinator's six packages are sound. **Recommended resequence** (deliver visible import-truth first; defer the heaviest/dependency-bearing ZIP work):

| Order | Package | Layer | Notes |
|---|---|---|---|
| **P1** ✅ COMPLETE | Canonical model + parser/adapter contracts + ImportDiagnostics shape | engine-only | Pure builders for all 10 entities; adapter contract; **no behavior change** (built alongside legacy). Impl `bd57c8a`, merged to `main` 2026-06-16. |
| **P2** ✅ COMPLETE | WhatsApp text parser hardening | engine-only | Locale-aware date parsing, U+202F/U+200E handling, 24-hour, robust system-line classification → **SystemEvent preserved**, edited/deleted markers, multi-line fix. Delivered via `whatsappTxtAdapter.toCanonical(rawText, opts)` (strangler-fig — legacy `import()` untouched). Impl `8d7ed86`, merged to `main` 2026-06-16; Node 3769→3890. |
| **P3** *(was P4)* ✅ COMPLETE | Self-identification + participant mapping | engine-only | Participant roster with stable ids; **self at participant level** via `opts.self` (exact / normalized / alias / phone-like / participant-id match); only the unique match flips `isSelf`; ambiguous/no-match/invalid recorded in `ImportDiagnostics`; the **one-sided-sender regression test** landed. Impl `30f0733`, merged to `main` 2026-06-16; Node 3890→3938. |
| **P4** *(was P5)* 🔄 IN PROGRESS | Group-chat correctness | engine-only (no UI this package) | Group vs 1:1 via evidence (multi-speaker / create / add-remove / leave / subject / icon, `opts.isGroup` override, `WEAK_GROUP_EVIDENCE`); per-speaker identity retained (no "them" collapse); **title/subject inferred**; system events typed + `conversationId`-linked, **actors + `rosterEvidence`** captured (non-speakers not invented). Branch `feature/whatsapp-data-foundation-p4-group-chat-correctness`; Node 3938→3980; awaiting commit authorization. |
| **P5** *(was P3)* 🔍 PREFLIGHT | WhatsApp ZIP / media intake | engine + **dependency decision** | `<attached:>` linking; MediaAttachment populated; present/missing; local-first ZIP read. **Preflight COMPLETE (docs):** recommend **native no-dependency reader** (`DecompressionStream('deflate-raw')` + a central-directory manifest; decompress only `_chat.txt`, manifest-only for media), with **vendored/pinned fflate as a Coordinator-gated fallback (P5A)** decided against a sanitized real `.zip`. Sub-sequence: **P5A** decision gate → **P5B** engine reader + canonical resolution (no UI) → **P5C** edge cases/diagnostics → **(later) P5D** `.zip` ingest UI. **P5A IMPLEMENTED (awaiting commit authorization):** `src/core/whatsapp-zip-reader.js` (`KMEngine.WhatsAppZip`) native central-directory reader + adapter `opts.mediaManifest`/`importZip`; synthetic in-memory coverage passes (Node 3980→4068 / 32 suites); **finding = native no-dependency is sufficient — recommend native-only, real-`.zip` validation fixture-gated, fflate remains a gated fallback**. Note: P5A delivered the P5B engine reader + canonical resolution together with the spike (still no UI); P5C edge cases (encrypted/ZIP64/unsupported/duplicate/no-or-multiple-chat) are also covered by the spike's rejection tests. Full evaluation: `docs/architecture/whatsapp-zip-media-intake-preflight.md`. |
| **P6** ✅ COMPLETE | Import diagnostics + test-coverage consolidation | diagnostics + tests + docs (+ small UI status) | Consolidated the import diagnostic vocabulary across the native reader, adapter/`importZip`, the private validation harness, and the browser ZIP status path, documented as one canonical vocabulary in `docs/qa/private-whatsapp-zip-validation.md` §11 (fatal reasons vs non-fatal notices; dual-nature `UNSUPPORTED_COMPRESSION`). Fixed two `index.html` `zipFailureMessage` inconsistencies (added plain-language `UNSUPPORTED_COMPRESSION`; removed the dead `TRUNCATED_CENTRAL_DIRECTORY` fatal case); harness `export`s `REVIEW_CODES` for the lock test (no output change). `whatsapp-zip-reader-tests.mjs` 135→147 (Suite 17 — vocabulary lock); no engine logic change, no deps, no fflate, no real fixtures. Branch `feature/whatsapp-data-foundation-p6-import-diagnostics-consolidation`; Node 4158→4170; awaiting commit authorization. **Real-world ZIP import remains fixture-gated.** |

**Why resequence:** the user-visible complaints are **identity, groups, and one-sided rendering** (P3/P4) — these need no ZIP and deliver truth fastest. **ZIP/media (P5)** is the heaviest and the only package likely to need a dependency, so it follows once the text/identity foundation is solid. **Tests are required in every package**; P6 consolidates rather than being the first place tests appear.

---

## 6. Test strategy

- **Unit tests:** date/locale parser (M/D vs D/M, 24h, U+202F), system-line classifier, `<attached:>`/omitted marker parser, participant resolver, each canonical builder.
- **Fixture tests:** synthetic sanitized fixtures (1:1 txt, group txt, with-media manifest, synthetic zip).
- **One-sided sender regression (flagship):** after self-ID, **exactly one** participant is `self`; in a **group**, every non-self speaker keeps a **distinct** identity (assert NOT collapsed to a single "them").
- **Group-chat tests:** multi-party rosters, system events preserved, participant change handling.
- **Media placeholder tests:** `<Media omitted>` → placeholder; `<attached: file>` → MediaAttachment with `present` true/false depending on ZIP contents.
- **Malformed export tests:** truncated lines, mixed/locale formats, missing AM/PM, U+202F/U+200E, empty, very large, non-WhatsApp input rejected.
- **Privacy / sanitization tests:** a guard test scanning committed fixtures for real-looking phone numbers / emails; a test that the sanitization preserves structure (same line/marker counts).
- **Harness:** run under the existing Node suite runner + `scripts/e2e-regression-harness.mjs` (add WhatsApp iOS phases using sanitized fixtures). **Visual-regression baselines must stay unchanged** (these packages are engine-only; no UI rebuild here).

---

## 7. Boundaries

- **Out of scope:** any UI/visual rebuild (Design-Bible L2 packages); Message Book composition; pagination; React/Vite migration; non-WhatsApp platforms; **WhatsApp Android** (deferred); WhatsApp reaction analysis (no reactions in export); proof/checkout/vendor/manufacturing.
- **Do not touch yet:** `index.html` rendering beyond the **minimal self-ID/participant wiring** needed by P3/P4 (prefer engine-only; keep the legacy renderer working via strangler-fig); pagination constants / `BOOK_*`; Review view; standalone keepsake flows; existing analytics panels.
- **UI/design work waits:** the Bible-driven conversation view (edited-editorial-transcript), per-speaker editorial rendering, and media tiles are **L2 implementation packages** gated on (a) the Design Bible and (b) this data foundation. This vertical produces the **correct model**; the UI consumes it later.

---

## 8. Exact first implementation package recommendation (P1)

**Package P1 — Canonical Import Model + Adapter Contract (engine-only, behavior-preserving).**

- **Branch:** `feature/whatsapp-data-foundation-p1-canonical-model`
- **Files likely touched:**
  - NEW `src/core/canonical-conversation.js` — builders for Conversation, Participant, Message, MediaAttachment, Reaction, Reply, SystemEvent, SourceMetadata, ImportDiagnostics (pure; deterministic ids; no DOM). (May split into a small set of modules.)
  - NEW `src/core/import-adapter-contract.js` — the adapter interface + a validation helper.
  - NEW `src/tests/canonical-conversation-tests.mjs` — full unit coverage; register in the Node suite runner.
  - `docs/architecture/architecture-roadmap.md`, `docs/qa/test-strategy.md` — record the new model + counts.
  - Possibly `src/core/source-platforms.js` — add an `exportVariant` enum if needed.
- **Files explicitly forbidden:** `index.html` (no rendering change in P1); pagination constants / `BOOK_*` / `BOOK_PAGINATION_VERSION` / `BOOK_PRODUCTION_DEPS`; `src/products/*`, `src/state/*`; Review view; proof/checkout/vendor; other adapters; **any `package.json` / dependency file** (no deps in P1); **no ZIP**; **no real-data fixtures**.
- **Acceptance criteria:** pure builders with deterministic ids; full unit tests green; **no behavior change** to the existing import/render path (legacy `NormalizedMemory` + renderer untouched — strangler-fig); the new types cover all 10 target entities; adapter-contract validator present; existing Node + E2E + visual-regression baselines **unchanged**.
- **Validators to run:** full Node suite (`scripts/run-all-node-tests.mjs` or equivalent), `scripts/e2e-regression-harness.mjs` (seeded + real-files), `scripts/visual-regression-harness.mjs` (Scenario A + import-panels — must be unchanged), `scripts/os-self-audit.mjs`, `scripts/project-control-sync-validate.mjs`, `scripts/state-freshness-check.mjs`.
- **Stop-before-commit report:** exact changed-file list; Node/E2E test counts before→after; confirmation **no `index.html`/UI/behavior change**; confirmation **no dependency added**; confirmation legacy import path untouched; validator results; proposed commit message. **Stop before commit; await Coordinator authorization.**

---

## 9. Risks / open questions

- **ZIP dependency decision (P5):** local-first ZIP read — native `DecompressionStream` + a minimal central-directory reader, vs a tiny audited lib (e.g., `fflate`). Any dependency needs Coordinator approval (minimal-audited-deps rule). No upload — all in-browser.
- **Locale date ambiguity:** `D/M` vs `M/D` is genuinely ambiguous for days ≤ 12. Strategy needed: detect from export locale if present, infer from out-of-range days, else prompt the user; record the assumption in `SourceMetadata`.
- **Strangler-fig coexistence / cutover:** how long the legacy `NormalizedMemory` + binary renderer run alongside the new Conversation model before the Bible-driven UI cuts over.
- **Fixtures gate reality:** the plan cannot be fully validated without the Coordinator's **sanitized real iOS exports** (esp. the Abena/N regression case). Format specifics in §3 are "confirm against fixtures."
- **Reactions / replies absent in WhatsApp txt:** confirm acceptance that the model carries these fields but WhatsApp txt leaves them empty/`available:false`.
- **Edited / deleted messages:** decide representation (iOS "<This message was edited>" suffix; "This message was deleted") — proposed as `isEdited` / `isDeleted` + a SystemEvent where appropriate.

---

## 10. Persistence note
This planning doc is **uncommitted** on `planning/whatsapp-ios-data-foundation`. To make it durable, a follow-up Coordinator authorization can commit it (Green-Path docs-only) or fold it into the P1 package. The full plan is also captured in the planning-pass chat report.
