# Private WhatsApp ZIP Validation — Package P5C

**Status:** ACTIVE (added in Package P5C — Private WhatsApp ZIP Fixture Validation Harness, 2026-06-17).
**Owner:** Development stream / Claude Code under Operator Mode.
**Script:** `scripts/validate-private-whatsapp-zips.mjs`
**Engine under test:** the production native no-dependency path — `KMEngine.WhatsAppZip` (`src/core/whatsapp-zip-reader.js`) + `KMEngine.whatsappTxtAdapter.importZip` (`src/adapters/whatsapp-txt-adapter.js`).

This is the **fixture-gated real-archive validation** the P5A/P5B preflight (`docs/architecture/whatsapp-zip-media-intake-preflight.md` §10/§11) records as the **single residual unknown** before any ZIP-ingest UI: native correctness is proven against synthetic fixtures but not yet against a sanitized **real** `.zip`. The harness lets us close that gap locally **without committing any private data**.

---

## 1. What the harness does

For each `.zip` it finds in the private fixture directory, it runs the exact production reader and import path and prints a **privacy-safe summary** — counts, booleans, and the engine's fixed diagnostic-code vocabulary only. It never prints message text, participant names, phone numbers, or filenames. It then classifies each archive **PASS / WARN / FAIL** and aggregates the result.

It is local-only. It reads from a gitignored directory, never writes outside stdout, never uploads, and adds no dependency.

---

## 2. Where to place private ZIPs

```
scripts/fixtures/private/whatsapp/
```

This directory is **gitignored** (`.gitignore` → `scripts/fixtures/private/`). It does not exist in a clean checkout — create it locally and drop `.zip` exports in it:

```
scripts/fixtures/private/whatsapp/
├── 1to1-with-media.zip
├── group-with-media.zip
└── ...
```

Filenames are your choice; the default report refers to archives only by index (`archive #01`, `archive #02`, …), never by filename.

---

## 3. How to run validation

```bash
# Scan the private dir and print the privacy-safe report:
node scripts/validate-private-whatsapp-zips.mjs

# Machine-readable (still privacy-safe):
node scripts/validate-private-whatsapp-zips.mjs --json

# Treat WARN as a non-zero exit too (e.g. for a strict local gate):
node scripts/validate-private-whatsapp-zips.mjs --strict

# Prove the harness end-to-end with synthetic in-memory archives (no private data):
node scripts/validate-private-whatsapp-zips.mjs --selftest
```

**With no private fixtures present** (the committed/CI state) the script prints a clear `SKIP — NO_PRIVATE_FIXTURES` and exits `0`. It never fails just because no archives exist.

**Exit codes:** `0` = SKIP, or all archives PASS/WARN, or `--selftest` OK. `1` = at least one archive FAIL (or any WARN under `--strict`), or a harness/self-check error.

---

## 4. What output is safe to share

The **default report and `--json` output are privacy-safe** and intended to be pasted into chat or an AI assistant. They contain only:

- file count and directory count (numbers)
- archive count, and whether a `_chat.txt` was found (boolean)
- whether `importZip` produced a **contract-valid** canonical conversation (boolean)
- message count, participant **count** (never names), system-event count
- media attachment count, and present / missing / omitted / other media counts
- compression-method counts (stored / deflate / other)
- name-encoding counts (utf8 / non-utf8 entries)
- ZIP64 / encrypted / unsupported-method findings (booleans + counts)
- diagnostics tallied **by code only** (e.g. `AMBIGUOUS_MEDIA_MATCH×1`) — never the data the code carries

A structural **privacy self-check** runs before anything prints: every summary value must be a number, boolean, `null`, a whitelisted enum, or a map keyed by the engine's `UPPER_SNAKE` code vocabulary. A filename, name, phone number, or message body cannot satisfy those constraints, so a leak aborts the run instead of printing.

---

## 5. What output is NOT safe to share

Only the opt-in `--debug` flag can emit potentially-private data. It prints, under a loud warning banner, raw entry **basenames**, the chat entry name, and **raw diagnostic objects** (which carry fields like `filename` / `name`). 

- `--debug` is **off by default**.
- Its output is for **local triage only** (e.g. understanding *why* a real archive WARNed/FAILed).
- **Do NOT paste `--debug` output into chat, an AI assistant, a ticket, or a commit.** It may contain real filenames, which can embed real names.

Also never share: the `.zip` files themselves, extracted media, screenshots of the archive contents, or absolute local paths.

---

## 6. How to interpret PASS / WARN / FAIL

| Verdict | Meaning | Action |
|---|---|---|
| **PASS** | The native no-dependency reader handled the archive cleanly: chat found, contract-valid conversation, ≥1 message, no review-worthy diagnostics. | The native path works for this archive shape. |
| **WARN** | It worked, but flagged something to review: missing media (`<attached:>` referenced but not in the archive), `<Media omitted>`, ambiguous/duplicate/suspicious entry names, an unsupported compression method, or an empty chat. | Inspect with `--debug` locally. A WARN whose diagnostics are understood and accepted still satisfies the P5D gate. |
| **FAIL** | The archive was rejected (encrypted / ZIP64 / no central directory / decompression unavailable), had no `_chat.txt`, or produced an invalid conversation. | A FAIL on a genuine WhatsApp export is the **trigger to reconsider the Coordinator-gated fflate fallback** — capture the privacy-safe summary and escalate. |

A FAIL caused by ZIP64 or non-UTF-8/CP437 filenames specifically is the case the preflight flags as the only thing that could overturn the "native no-dependency" decision.

---

## 7. How this gates P5D (ZIP UI wiring)

**Do not begin Package P5D (the `.zip` ingest UI in `index.html`) until at least one real sanitized with-media archive — ideally both a 1:1 and a group export — reaches PASS, or WARN whose diagnostics are understood and accepted.** This keeps the engine-first, UI-last sequence (P1–P5B pattern) honest: we wire the upload surface only after the native reader is proven against real archive shape, not just synthetic fixtures.

If real archives FAIL in ways the native reader cannot economically handle (e.g. ZIP64 at scale), the dependency decision returns to the Coordinator (vendored/pinned fflate as the gated fallback) **before** P5D — not after.

---

## 8. Sanitizing a real export (so it can live locally as a fixture)

The point of sanitization is to keep the **archive shape** the native reader depends on while removing private content. Preserve structure; replace content.

**Preserve:**
- the ZIP container structure and folder layout
- the `_chat.txt` location and exact name
- every `[timestamp] Sender: …` line structure and each `<attached: FILENAME>` marker
- each media file's **archive-relative filename** (the name the `<attached:>` marker points to)
- the compression method per entry where possible (stored vs deflate)

**Replace:**
- message bodies → safe dummy text of similar length
- participant display names → consistent fake names (same fake name everywhere that real name appeared)
- phone numbers → consistent fake numbers
- real media files → **tiny dummy files of the same archive-relative filename** (a 1-byte placeholder is fine; the harness reads only the manifest, never media bytes)

**Never:**
- commit the `scripts/fixtures/private/` directory or anything in it
- commit real media, screenshots, or raw exports
- upload a real export anywhere

A sanitized fixture that keeps the structure but carries only dummy content is **not** private and could, if ever needed, be promoted to a committed synthetic fixture — but the default is to keep all of it gitignored and local.

---

## 9. Fixtures to gather (request to Coordinator / user — local only)

Provide these **locally only**, sanitized per §8, into `scripts/fixtures/private/whatsapp/`:

1. a sanitized real **1:1 with-media** WhatsApp iOS ZIP export
2. a sanitized real **group with-media** WhatsApp iOS ZIP export
3. the **Abena/N regression** export, if available (the one-sided-sender case the rebuild flagged)
4. a **non-US-locale with-media** export, if available (to exercise D/M date order and non-ASCII names/filenames)

Each one validated through this harness moves the "real archive shape" risk from open to closed and unblocks the P5D gate.

---

## 10. Test coverage

The harness's privacy-safe summarization and classification are covered by `src/tests/whatsapp-zip-reader-tests.mjs` **Suite 16** (synthetic archives carrying private-looking data, asserting the summary leaks none of it and classifies PASS/WARN/FAIL). The script's built-in `--selftest` runs the same proof end-to-end at runtime. See `docs/qa/test-strategy.md`.
