# WhatsApp ZIP / Media Intake — P5 Preflight (Dependency Evaluation + Implementation Plan)

**Status:** PLANNING / FEASIBILITY ONLY — no implementation, no dependency install, no runtime-code change is made or authorized by this document.
**Branch:** `planning/whatsapp-data-foundation-p5-zip-media-preflight` (base `main` @ `e71d671`). Docs-only.
**Recorded:** 2026-06-16 by Claude Code (Opus 4.8).
**Context:** Fifth package of the WhatsApp iOS data-foundation vertical. P1–P4 are COMPLETE (canonical model + contract; hardened text parser; self-ID + participant mapping; group-chat correctness). This preflight decides the safest local-first approach for reading WhatsApp export `.zip` archives and resolving `<attached: FILENAME>` markers to real media, and proposes a concrete P5 sequence. Companion docs: `docs/architecture/whatsapp-ios-data-foundation-plan.md`, `docs/architecture/phase-0-rebuild-decisions.md`.

> This document specifies WHAT to build and how to de-risk it. It does not build it. No `src/**`, `index.html`, `scripts/**`, `package.json`, dependency, or fixture changes are made by this pass.

---

## 0. Executive summary

- **The canonical model is already ZIP-ready.** `createMediaAttachment` carries `present` (tri-state: `true` found / `false` omitted-or-missing / `null` unknown), `byteSize`, `mimeType`, `sourceRef`; `ImportDiagnostics.mediaMissing[]` exists (P1) and is currently unused. Today `<attached: FILE>` → `present:null`, `<Media omitted>` → `present:false`. P5 only needs to **flip `present`/`byteSize`/`mimeType`** from an archive manifest. No model rework is required (a small optional extension at most).
- **Native, no-dependency is feasible** for WhatsApp's ZIP shape because of one key simplification: **the engine only needs the decompressed `_chat.txt` plus a directory *manifest* (filename + size) for media — it does not need to decompress the media bytes.** Media is represented as placeholders/links, not rendered here. So "read a ZIP" reduces to "parse the central directory (cheap) + decompress one text entry."
- **`DecompressionStream` is a per-stream codec, not a ZIP reader.** It supports `gzip` / `deflate` / `deflate-raw` only. Reading a `.zip` still requires parsing the ZIP central directory ourselves; we then pipe each needed entry's raw bytes through `DecompressionStream('deflate-raw')` (method 8) or copy them (method 0 = stored).
- **Recommendation:** pursue the **native no-dependency reader** scoped to WhatsApp's real ZIP shape, with **fflate as an explicitly Coordinator-gated fallback** (vendored pre-Vite, or via `package.json` post-Vite) if a sanitized real fixture reveals ZIP64 / non-UTF-8 / unusual-method archives. **The dependency vs no-dependency call should be its own gate (P5A) decided after seeing a sanitized real `.zip`** — native viability hinges on the actual archive shape, which we cannot confirm from synthetic fixtures alone.
- **No app dependency can be added today without a decision:** the app has **no `package.json` / bundler** (browser IIFE `<script>` tags). fflate would have to be **vendored** as a pinned, audited `src/vendor/fflate.js` now, or deferred to the Vite migration. The native path avoids this entirely.

---

## 1. Native browser options

### 1.1 File API / Blob
- A user-selected `.zip` arrives as a `File` (a `Blob`). `await file.arrayBuffer()` → `ArrayBuffer`; wrap as `Uint8Array`. Fully local, no network. Standard and reliable in all target browsers and in Node 18+ (tests).
- Drag-and-drop yields the same `File` objects. The engine layer should accept a `Uint8Array`/`ArrayBuffer` and stay UI-agnostic (testable in Node), exactly like the existing text adapters accept a string.

### 1.2 DecompressionStream — availability and limitations
- **Formats:** `'gzip'`, `'deflate'` (zlib-wrapped), `'deflate-raw'` (raw DEFLATE). **There is no `'zip'` format** — `DecompressionStream` decompresses a single stream; it does not understand the ZIP container (local headers, central directory, EOCD).
- **ZIP mapping:** ZIP compression method `0` = **stored** (copy bytes verbatim); method `8` = **raw DEFLATE** → `DecompressionStream('deflate-raw')`. WhatsApp uses only these two (text usually deflated; already-compressed media usually stored).
- **Availability:** Chromium 80+, Firefox 113+ (2023-05), Safari 16.4+ (2023-03), Node 18+. Broadly available across current evergreen browsers and our Node test runner. Old browsers are out of scope (the rebuild targets evergreen).
- **Shape:** async/streaming (`ReadableStream`). For a single small text entry this is a few lines (`new Response(blob.stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()` or a manual reader). Adds `async` plumbing to the otherwise-synchronous adapter, but `toCanonical` can keep a sync core and the ZIP entry can be decompressed before calling it.

### 1.3 Can native APIs reliably read WhatsApp export ZIPs?
- **Yes, for the manifest + one text entry**, which is all the engine needs. The plan is to **read sizes/offsets/methods/names from the central directory** (not local headers). Reading from the central directory sidesteps the **data-descriptor** problem entirely (when general-purpose bit 3 is set, local-header sizes are 0 and appear *after* the data; the central directory always has the correct sizes). This single design choice removes the most annoying streaming edge case.
- Decompress **only** `_chat.txt`; for media, the manifest (name + uncompressed size + "present") is sufficient. Media bytes can be lazily decompressed later **only if** a future UI needs to display/download a specific file.

### 1.4 Is a no-dependency central-directory reader realistic/safe?
- **Realistic** for WhatsApp's shape with a bounded scope:
  1. Locate **EOCD** (signature `0x06054b50`) by scanning backwards from end (handle the optional ZIP comment / max 64 KB tail).
  2. Walk the **central directory** (`0x02014b50`): per entry read compression method, compressed size, uncompressed size, filename length + bytes, local-header offset, and general-purpose flags (UTF-8 bit 11; encryption bit 0; data-descriptor bit 3).
  3. Build the **manifest** `{ name, method, compressedSize, uncompressedSize, localOffset, utf8 }`. (No decompression yet.)
  4. To extract one entry (`_chat.txt`): read its local header (`0x04034b50`), skip name+extra to the data, then method 0 → slice; method 8 → `DecompressionStream('deflate-raw')`.
  5. Decode filenames as **UTF-8** when bit 11 is set (WhatsApp sets it); otherwise best-effort UTF-8 with a CP437/latin-1 fallback + a diagnostic.
- **Safe** if it **fails loud, not silent** on anything outside the supported envelope:
  - **Encryption** (bit 0) → reject with `ARCHIVE_ENCRYPTED` (WhatsApp exports are not encrypted).
  - **Unsupported compression method** (anything but 0/8) → reject that entry with `UNSUPPORTED_COMPRESSION`.
  - **ZIP64** (sizes/offset = `0xFFFFFFFF`, or >65535 entries, or EOCD64 locator present) → either parse the ZIP64 records or reject with `ARCHIVE_ZIP64_UNSUPPORTED` + fall back to text-only/`present:null`. ZIP64 is the main native-reader risk; likelihood for chat exports is low but **non-zero** for large media collections.
- **Net:** a ~150–250 line, dependency-free, well-tested reader covers WhatsApp's real-world cases; the residual risk (ZIP64, exotic encodings) is contained behind explicit rejections + diagnostics rather than wrong output.

---

## 2. Dependency option (fflate or equivalent)

### 2.1 Candidate: `fflate`
- ~8 KB min+gz, **zero dependencies**, MIT, actively maintained, very widely used, pure JS, runs in browser and Node. `unzipSync(u8)` → `{ [name]: Uint8Array }`; async `unzip` and a streaming `Unzip` exist for memory control. Robustly handles ZIP64, data descriptors, all standard methods, and filename encodings — i.e. exactly the edge cases the native reader must guard.

### 2.2 Bundle / privacy / local-first
- Pure client-side, **no network, no telemetry** → local-first preserved. Bundle cost is negligible (~8 KB).

### 2.3 Maintenance / security risk
- Low: tiny, popular, audited surface, single package, no transitive deps. Still, it would be the **app's first runtime dependency**, so it must be **pinned and the exact vendored copy reviewed** if adopted pre-Vite.

### 2.4 package.json / dependency-policy impact
- The app has **no `package.json` and no bundler** today. Two adoption routes:
  - **(a) Vendor now** — commit a pinned `src/vendor/fflate.js` (audited, version-stamped) loaded via `<script>`. Works with the current architecture; keeps everything local; but "committing third-party code" is itself a dependency decision and must be Coordinator-approved under the *minimal audited dependencies* rule.
  - **(b) Defer to Vite** — add `fflate` to a real `package.json` once the React/TS/Vite migration lands. Cleaner provenance, but **defers ZIP intake** behind the migration.
- Either route is a policy event → belongs in the **P5A gate**, not an inline choice.

---

## 3. Current repo constraints (confirmed)

- **Architecture direction:** Phase 0 locks a future **Vite + React + TypeScript SPA** via staged strangler-fig; today the shipping app is still single-file `index.html` + browser-IIFE `src/*.js` (no bundler, **no root `package.json`** — verified).
- **Local-first / no backend:** all processing in-browser; a ZIP reader must run client-side with no upload. Both native and fflate satisfy this.
- **Minimal audited dependencies:** strong preference for zero deps; any dep is Coordinator-gated. Favors the native path.
- **Existing adapter structure:** `KMEngine.whatsappTxtAdapter.toCanonical(rawText, opts)` already takes an `opts` bag (used by P2 `dateOrder`, P3 `self`, P4 `isGroup`/`title`). P5 extends `opts` (e.g. `opts.mediaManifest`) and/or adds a thin `importZip(uint8, opts)` wrapper. Legacy `import()`/`parseLines`/`canHandle` remain untouched (strangler-fig).
- **Canonical model / MediaAttachment shape (verified):** `createMediaAttachment(f)` → `{ id, kind, filename, mimeType, byteSize, sourceRef, present(tri-state), width, height, durationMs, caption, placeholderReason }`. `ImportDiagnostics` has `mediaMissing[]` (unused today). **No model change strictly required;** an optional small extension (e.g. a `present` reason vocabulary, or an `archive` source field on `SourceMetadata`) may help diagnostics.
- **Existing tests / fixtures:** Node IIFE-in-`vm` suites (`src/tests/*.mjs`) + committed synthetic fixtures under `scripts/fixtures/whatsapp/` (e.g. `ios-group-chat.txt`). E2E uses Playwright `#fileInput.setInputFiles(...)`. **Engine ZIP reading is Node-unit-testable** with in-memory/synthetic archives, fully independent of `index.html`.

---

## 4. WhatsApp ZIP / media implementation design

### 4.1 Expected input shape
- iOS "Export Chat → Attach Media" produces a `.zip` containing `_chat.txt` at the root plus media files alongside (flat), e.g. `00000042-PHOTO-2024-06-13-09-02-00.jpg`, `00000043-AUDIO-...opus`, `.vcf`, `.pdf`. No-media exports are a bare `.txt` (no ZIP). (Android differs — `WhatsApp Chat with X.txt`, `IMG-YYYYMMDD-WAxxxx.jpg`, `FILENAME (file attached)` — and stays deferred.)

### 4.2 Read ZIP locally
- `Uint8Array` → central-directory manifest (native reader from §1.4, or fflate if gated in). Decompress only `_chat.txt`.

### 4.3 Find the `.txt` inside the ZIP
- Prefer an entry named exactly `_chat.txt`; else the unique `*.txt`; else the first `*.txt` (with a `MULTIPLE_TXT_IN_ARCHIVE` diagnostic). If none → `NO_CHAT_TXT_IN_ARCHIVE` error, return an empty-but-valid Conversation.

### 4.4 Resolve `<attached: FILENAME>` to actual files
- Build a manifest map `name → { size, present:true, mimeType }` from the central directory. During `toCanonical` attachment handling, look up the marker's filename:
  - **found** → `present:true`, `byteSize:size`, `mimeType` from extension, `sourceRef:name`, `placeholderReason:null`.
  - **manifest provided but name absent** → `present:false`, `placeholderReason:'missing-from-archive'`, push to `diagnostics.mediaMissing[]`.
  - **no manifest (txt-only import)** → unchanged P4 behavior: `present:null`, `placeholderReason:'referenced-in-text'`.
- `<Media omitted>` (no filename, no-media export) stays `present:false`, `placeholderReason:'omitted'`.

### 4.5 Missing files
- `present:false` + a `mediaMissing[]` entry (`{ filename, messageIndex }`). Never fabricate bytes.

### 4.6 Duplicate filenames
- ZIP allows duplicate entry names; WhatsApp should not produce them. Manifest keeps the **first** occurrence and records `DUPLICATE_ARCHIVE_ENTRY`. A `<attached:>` that matches a duplicated name resolves to the first and is flagged.

### 4.7 present/missing/omitted in `MediaAttachment.present`
- `true` = filename resolved in the provided archive; `false` = omitted export **or** referenced-but-missing-from-archive (disambiguated by `placeholderReason`: `'omitted'` vs `'missing-from-archive'`); `null` = referenced in a txt-only import where no archive was supplied.

### 4.8 Preserve `sourceRef` safely
- `sourceRef` = the **archive-relative entry name only** (e.g. `00000042-PHOTO-…jpg`). Never an absolute filesystem path, never bytes, never user content. The filename is WhatsApp-generated, not private message text.

### 4.9 Avoid committing real media
- Committed fixtures contain **only synthetic dummy media**. Real exports live in a **gitignored** private dir (new `scripts/fixtures/private/` — see §5). CI/tests never read real media.

### 4.10 Test with synthetic ZIP fixtures only
- Tests build **in-memory synthetic archives** (store + deflate) using Node built-ins (`zlib.deflateRawSync` for method 8; raw byte assembly for method 0) — **no committed binary blob, no dependency**. This exercises the reader against both compression methods, missing/duplicate names, and unsupported-method/ZIP64 rejection paths. An optional small committed `.zip` may be added later if a stable on-disk artifact is wanted, but in-memory construction is preferred (human-reviewable, no opaque binary).

---

## 5. Fixture plan

- **Committed (synthetic, small):** under `scripts/fixtures/whatsapp/`
  - A `_chat.txt` (reuse the P2/P4 group style) whose body references `<attached: …>` markers that match the dummy media names.
  - **Dummy media** — sub-kilobyte, obviously synthetic, extensions mirroring iOS: a 1×1 px `.jpg`/`.png`, a tiny `.opus`/`.mp3`, a 1-line `.vcf`, a minimal 1-page `.pdf`. Example names: `00000042-PHOTO-2024-06-13-09-02-00.jpg`, `00000043-AUDIO-2024-06-13-09-03-00.opus`, `CONTACT-Amina.vcf`, `00000044-DOCUMENT-2024-06-13-09-04-00.pdf`.
  - The synthetic `.zip` is **built at test time in memory** from the above (no committed binary), or — if a stable artifact is preferred — a tiny store-only `.zip` committed alongside.
- **Gitignored (real):** add `scripts/fixtures/private/` to `.gitignore` (NOT present today — `.gitignore` currently ignores `_source-intake/`, `raw-transcripts/`, `screenshots/`, but has **no** dedicated private-fixtures path). Real sanitized exports go here and are never committed.
- **Coordinator fixture asks (for P5A validation):**
  1. sanitized real **1:1 with-media iOS `.zip`**
  2. sanitized real **group with-media iOS `.zip`**
  3. the **Abena/N regression** export (with media if it had any)
  4. if available, one **non-US-locale** with-media export (to confirm filename encoding + ZIP method assumptions)
  - Sanitize per the plan §4.2/§4.3: pseudonymize names, fake phone numbers, neutral message bodies, **preserve line/marker counts, timestamps, `<attached:>` filenames, and the archive's compression methods/structure**; replace each media file with a same-extension, same-name tiny dummy.

---

## 6. Proposed P5 implementation sequence

| Order | Package | Layer | Gate / notes |
|---|---|---|---|
| **P5A** | Dependency vs no-dependency decision + native-reader spike validated against a sanitized real `.zip` | docs + (optional throwaway spike) | **Coordinator gate.** Confirms native viability on real archive shape; decides native-only vs vendored-fflate. May touch dependency policy → separate approval. |
| **P5B** | Engine ZIP reader + canonical media resolution | engine-only, no UI | `src/core/whatsapp-zip-reader.js` (`KMEngine.WhatsAppZip`: `readArchive` manifest, `extractText`, `findChatTxt`); `whatsappTxtAdapter.importZip(uint8, opts)` + `toCanonical` `opts.mediaManifest` resolution; populate `present`/`byteSize`/`mimeType`/`mediaMissing`. Node unit tests with in-memory synthetic archives. Legacy path + `index.html` untouched. |
| **P5C** | Media-resolution edge cases + diagnostics + (optional) committed synthetic fixture | engine + tests | Missing file, duplicate name, store vs deflate, unsupported-method/encrypted/ZIP64 rejection, `mediaMissing` diagnostics, `NO_CHAT_TXT`/`MULTIPLE_TXT` handling. |
| **(later, separate) P5D** | UI / ingest wiring | `index.html` (gated) | `#fileInput accept=".zip"`, drag-drop, route `.zip` → `importZip`; mirrors the P3K-style "UI after engine" split. **Not part of the engine packages**; separately authorized. |

**Why this order:** P5A resolves the only true unknown (real ZIP shape → native vs dep) before any code. P5B/P5C deliver and harden the engine with zero UI risk and zero `index.html` change (consistent with P1–P4). UI wiring (P5D) follows once the engine is proven, keeping each package narrow and reversible.

---

## 7. Risk assessment

| Risk | Severity | Mitigation |
|---|---|---|
| **Browser compatibility** (DecompressionStream) | Low | Chromium 80+/FF 113+/Safari 16.4+/Node 18+ all supported; rebuild targets evergreen. Feature-detect and degrade to `present:null` + diagnostic if absent. |
| **Dependency risk** (if fflate adopted) | Low–Med | Tiny/audited/zero-dep, but it'd be the app's first runtime dep; pre-Vite it must be **vendored + pinned + reviewed**; gated at P5A. |
| **ZIP parsing edge cases** (ZIP64, data descriptors, CP437 names, encryption) | Med | Read from **central directory** (kills data-descriptor issue); reject encrypted/unsupported-method/ZIP64 **loudly** with diagnostics; UTF-8 with CP437 fallback. Fixture-gated against a real `.zip`. |
| **Large-file memory** | Low–Med | **Manifest-only** for media (no media decompression); decompress just `_chat.txt`; lazy/streamed extraction if a UI later needs a specific file. |
| **Privacy** (real media leak) | Low (if disciplined) | Gitignore `scripts/fixtures/private/`; synthetic-only committed fixtures; `sourceRef` = filename only; never commit real bytes; never upload. |
| **Real-fixture uncertainty** | Med | The native reader's correctness depends on the **actual** WhatsApp ZIP shape; P5A blocks on a sanitized real `.zip`. Until then, synthetic coverage proves the mechanism but not the format assumptions. |

---

## 8. Open questions for the Coordinator

1. **Dependency stance:** is the team willing to **vendor a pinned fflate** pre-Vite if the native reader proves insufficient, or must ZIP intake **wait for the Vite migration** before any dependency? (Drives P5A.)
2. **Real fixtures:** can the Coordinator provide the sanitized real with-media `.zip` exports in §5 (esp. the Abena/N case) so P5A can validate the native reader against true archive shape?
3. **Committed artifact preference:** in-memory synthetic ZIP construction in tests (preferred — human-reviewable, no binary) vs a small committed `.zip` binary?
4. **UI timing:** keep `.zip` ingest wiring (`index.html`) as a separate gated P5D after the engine, consistent with the P1–P4 engine-first pattern? (Recommended: yes.)
5. **Model extension scope:** acceptable to add small diagnostic fields (e.g. richer `placeholderReason` vocabulary, an archive marker on `SourceMetadata`) under the "small model/diagnostic extension" allowance, or keep the model frozen and carry everything in diagnostics?

---

## 9. Recommendation (summary)

Pursue **native, no-dependency ZIP reading** scoped to WhatsApp's archive shape, exploiting "decompress only `_chat.txt`; manifest-only for media." Keep **fflate (vendored/pinned, or post-Vite)** as an explicitly **Coordinator-gated fallback (P5A)** if a sanitized real `.zip` exposes ZIP64/encoding cases that make a correct native reader uneconomical. Deliver the engine first (P5B/P5C, no `index.html`), gate UI wiring separately (P5D). The canonical model already supports the outcome — P5 is additive and low-risk to the existing engine, with the **single real unknown (real ZIP shape) resolved at the P5A gate before any code is written**.

---

## 10. P5A spike result (2026-06-17)

**Status:** P5A spike IMPLEMENTED on `feature/whatsapp-data-foundation-p5a-native-zip-reader-spike` — **engine/test only, zero dependencies, no `package.json`, no `index.html`, no UI** — awaiting Coordinator commit authorization.

**What was built (engine + tests only):**
- `src/core/whatsapp-zip-reader.js` — `KMEngine.WhatsAppZip`: `readCentralDirectory` (EOCD-from-tail with comment validation; per-entry name/method/sizes/offset/UTF-8 flag), `findChatTxt` (exact `_chat.txt` preference; **rejects zero or multiple** candidates), `buildMediaManifest` (name+size+method, **no media decompression**; duplicate-basename + unsupported-method diagnostics), `extractText`/`extractEntryBytes` (method 0 verbatim; method 8 via `DecompressionStream('deflate-raw')`), `readArchive` (orchestration). Realm-robust (`ArrayBuffer.isView`, manual UTF-8) so central-directory parsing needs no Web APIs.
- `src/adapters/whatsapp-txt-adapter.js` — `toCanonical` gains `opts.mediaManifest` resolution (§4.4/§4.5/§4.7/§4.8 behavior exactly) + async `importZip(uint8, opts)`. `src/core/canonical-conversation.js` and `src/core/import-adapter-contract.js` **unchanged** (model was already ZIP-ready, per §0).
- Tests: `src/tests/whatsapp-zip-reader-tests.mjs` (62, in-memory synthetic ZIPs via Node `zlib` — **no committed binary**), `whatsapp-txt-adapter-tests.mjs` +19 (Suites 40–42), `km-engine-tests.mjs` +7. Node 3980→**4068 / 32 suites**; E2E 57/57 + 195/195; VR Scenario A 4/4 — all green. `.gitignore` adds `scripts/fixtures/private/`.

**Decision outcome (recommendation — Coordinator to ratify):** the **native no-dependency reader is sufficient** for WhatsApp's documented export shape and passes full synthetic coverage across both compression methods and every rejection path (encrypted / ZIP64 sentinel / unsupported method / missing-or-multiple chat file / duplicate media / truncation). **Recommend continuing native-only**; **do not add fflate**. The one residual unknown remains **real archive shape** — native correctness is proven against synthetic fixtures but not yet against a sanitized real `.zip`. Per the §6 decision rule, this is the "native passes synthetic; only blocker is lack of sanitized real ZIPs" branch: **continue no-dependency and record real-fixture validation as a gate** (gather sanitized 1:1 + group with-media exports, incl. the Abena/N case, into the now-gitignored `scripts/fixtures/private/`). fflate stays a Coordinator-gated fallback only if a real archive later exposes ZIP64/exotic-encoding cases.

**Remaining fixture-gated risk:** ZIP64 and non-UTF-8/CP437 filename archives are currently **rejected loudly** (not mis-parsed); whether WhatsApp ever produces them for large media collections can only be confirmed against real exports.
