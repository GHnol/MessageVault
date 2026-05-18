# E2E Regression Harness — KeepMees / MessageVault

**Package:** 3B (seeded baseline) + 3C (real-file coverage) + 4D (Phase 20) + 4E (Phase 21) + 4E.1 (startup reliability)
**Status:** Active

---

## Purpose

Automated browser regression tests that replace the majority of the manual QA checklist run after each package. Uses Playwright headless Chromium and a proper static file server. Exits with a non-zero code if any critical regression is detected.

---

## Modes

### Seeded baseline mode (default)

Runs the deterministic seeded baseline (phases 1–10). Uses fixed in-memory test data — no file I/O. Suitable for CI and smoke testing after every package.

```bash
node scripts/e2e-regression-harness.mjs
```

### Real-file mode (`--real-files`)

Runs phases 1–10 first, then adds phases 11–19 covering real .txt import, actual browser download, actual file upload/restore, standalone keepsake type chooser, stable error text assertions, optional private chat.db smoke, and capture harness subprocess. Slower; intended for pre-commit full regression.

```bash
node scripts/e2e-regression-harness.mjs --real-files
```

### Headed mode (shows browser — use for debugging failures)

```bash
node scripts/e2e-regression-harness.mjs --headed
node scripts/e2e-regression-harness.mjs --real-files --headed
```

### Headed + slow motion (adds 600ms delay between each action)

```bash
node scripts/e2e-regression-harness.mjs --headed --slow
```

### Via npm (from scripts/ directory)

```bash
cd scripts
npm run e2e
npm run e2e:headed
npm run e2e:real
npm run e2e:real:headed
```

### First-time setup

Playwright and Chromium must be installed. Run once from the `scripts/` directory:

```bash
cd scripts
npm install
npx playwright install chromium
```

---

## Test coverage

### Seeded baseline (phases 1–10, 20–21, 41 tests — always runs)

| Phase | Area | Key assertions |
|---|---|---|
| 1 | App load | Landing visible; no fatal console errors; all KMEngine src/ modules loaded with correct MIME type |
| 2 | Message seed | `seedChatMessages()` populates chatMessagesData; chat view shows; DOM rows match |
| 3 | Selection | Select All sets selectedIndices; selection bar becomes active |
| 4 | Review Your Moments | Continue → review view; review body renders; keepsake groups built |
| 5 | Your Keepsakes | Keepsakes view renders; ks body non-empty |
| 6 | Message Book | Book view opens; pages rendered; page count > 0; timestampMode toggle round-trips |
| 7 | Save project | `captureProjectSnapshot()` returns valid JSON; snapshot passes `validate()` |
| 8 | Reload + restore | Clean reload; project load restores messages, groups, and all three views |
| 9 | Invalid file handling | Invalid JSON and wrong schema version produce no crash; app stays functional |
| 10 | Capture harness smoke | Capture bridge functions (showBookView, renderBookView, etc.) present after load |
| 20 | Product experience readiness consumer bridge | `window.__km.isReadinessAvailable()` true; `EXPERIENCE_STATUS` accessible; `resolveGroupReadiness` returns array; message-book reaches `prototype-preview-supported`; non-book render-planning products are `render-planning-known`; null group safe — Package 4D |
| 21 | Product format availability surface | `[data-testid="format-availability"]` renders in keepsakes card; message-book tag text is "Available for Message Book preview" with `fmt-available` class; non-book tags show "Planned format"; no order/buy/checkout language; bridge call does not crash — Package 4E |

### Real-file coverage (phases 11–19, 23 tests — only with `--real-files`)

| Phase | Area | Key assertions |
|---|---|---|
| 11 | Real .txt import | Fixture loads via `#fileInput` setInputFiles; chat view appears; row count matches fixture |
| 12 | Selection + review from txt | Select all; Continue → review; keepsake groups built from real parsed messages |
| 13 | Actual project download | Save button triggers browser download; downloaded file is valid keepmees JSON with correct message count |
| 14 | Actual file upload + restore | Reload; `#projectFileInput` setInputFiles with downloaded file; chat view + message count + groups all survive |
| 15 | Views after actual restore | Review, Keepsakes, and Message Book all render correctly after a real file restore |
| 16 | Keepsake type chooser | `.ks-card-action-btn` click opens composition view; `chosenTypeId` set on group; back button returns to Keepsakes |
| 17 | Stable error text | Invalid JSON shows `#projectLoadStatus` with `.error` class and expected phrase; wrong version shows error status |
| 18 | Optional chat.db smoke | If `KEEP_MEES_E2E_CHATDB_PATH` is set: file loads without crash; contact picker or status appears (1 test) |
| 19 | Capture harness integration | `capture-message-book-packet.mjs --scenarios a` runs as subprocess and exits 0 |

**Seeded baseline total: 41 tests**
**Real-file total: 23 tests always + 1 conditional (chat.db)**
**Combined total: 64 tests (65 with chat.db)**

---

## Real .txt fixture

Safe fake fixture at `scripts/fixtures/fake-conversation.txt`. Contains 5 deterministic fake messages in pipe-delimited format (`timestamp|sender|text`). Safe to commit — no real user data.

---

## Actual file input coverage

Phases 11 and 14 use Playwright's `setInputFiles()` on the hidden file inputs:

- `#fileInput` (txt import) — triggers `readTxtFile()` and `renderConversation()`
- `#projectFileInput` (project load) — triggers `handleProjectFileLoad()` (async FileReader)

This exercises the real browser file input path without depending on OS-native file picker dialogs.

---

## Actual project file download and upload

Phase 13 uses `page.waitForEvent('download')` with `page.click('#reviewSaveProjectBtn')` to intercept the real Blob download that `ProjectFileIO.save()` creates. The downloaded file is saved to `os.tmpdir()` (never committed), validated as JSON, then uploaded in Phase 14 via `#projectFileInput.setInputFiles()`. The temp file is deleted after the test run.

---

## Standalone keepsake type chooser

Phase 16 tests the full user-click path in the Keepsakes view:
1. Navigate to Keepsakes view.
2. Click `.ks-card-action-btn` — calls `enterComposition()` which sets `chosenTypeId` and shows `#compositionView`.
3. Verify `chosenTypeId` is non-null on the group.
4. Click `#compBackBtn` — returns to Keepsakes via `renderKeepsakesView()`.

This does not test the composition view internals (preview rendering, save keepsake button) — that remains manual QA.

---

## Stable error text

Phase 17 loads project files via `#projectFileInput` and asserts `#projectLoadStatus`:
- Has CSS class `error`
- Text contains a key phrase (`"could not read"`, `"invalid"`, `"version"`, or `"unsupported"`)

Exact error strings are not asserted — phrasing may change. The assertion verifies the error path is reached, not the exact copy.

---

## Optional private chat.db smoke testing

To run a smoke test against your own chat.db:

```bash
KEEP_MEES_E2E_CHATDB_PATH=/path/to/your/chat.db node scripts/e2e-regression-harness.mjs --real-files
```

**Privacy rules — read carefully:**
- Never commit a real `chat.db` to this repository.
- Never commit personal message exports.
- The path provided via `KEEP_MEES_E2E_CHATDB_PATH` is used locally only and is never included in any project snapshot.
- The smoke test only verifies that the app does not crash loading the file. It does not extract or log message content.

The smoke test requires internet access because SQL.js loads from CDN (`cdnjs.cloudflare.com`). If your network blocks the CDN, the test will timeout or show an error status — this is expected behavior, not a harness failure if it's a connectivity issue.

**Why a committed synthetic chat.db fixture is not included:**
The Apple Messages SQLite schema requires specific tables (`message`, `chat`, `chat_message_join`), Apple-internal timestamps (nanoseconds since 2001-01-01), and handle/chat join tables. Generating a minimal correct fixture would require `better-sqlite3` (not installed in `scripts/node_modules`) and ongoing schema maintenance. Since a real chat.db smoke test adds more value than a fragile synthetic one, the committed fixture is deferred.

---

## Capture harness coverage

Phase 10 (seeded) checks that capture bridge functions are present. Phase 19 (real-files) actually runs the capture harness as a subprocess:

```bash
node scripts/capture-message-book-packet.mjs --scenarios a
```

This is the same command used for manual capture runs. Phase 19 asserts exit code 0. If you need full scenario coverage (scenarios a–d), run:

```bash
node scripts/capture-message-book-packet.mjs
```

This is not included in the E2E run to avoid making the harness slow. Run it separately when layout work changes.

---

## Visual fidelity

Visual screenshot diffing is **not covered** by this harness. Failure screenshots are saved to `artifacts/e2e-failures/` for debugging only — they are not used as regression baselines.

Visual regression requires:
- Approved baseline screenshots per scenario
- Pixel-tolerance rules for rendering differences
- A diff tool that can flag layout regressions vs. expected minor variation

This is deferred to a future **Package 3D: Visual Regression Baseline Harness**. Until then, visual fidelity remains manual QA.

---

## How to interpret failures

**Non-zero exit code** — at least one test failed. Check the test output for `✗` lines.

**Failure screenshots** — saved automatically to `artifacts/e2e-failures/` (gitignored). Each failure produces a full-page PNG named after the test that failed.

**"KMEngine modules not loaded"** — most likely the static server is not serving `src/` files with a `text/javascript` MIME type. The harness server handles this; the capture harness server does not. If you switch servers, verify MIME types.

**"window.__km was not defined within 10s"** — the inline harness bridge in `index.html` failed to execute within the timeout. Check for JavaScript syntax errors in the `window.__km` block, and confirm all `src/` modules were served correctly.

**"Static server at … did not become ready"** — the Node HTTP server did not respond on port 7332 within 1 second (10 × 100 ms probes). Check that no other process is holding port 7332.

**Phase 8 failures (restore)** — if Phase 7 (save) also failed, Phase 8 failures are downstream and not independent. Fix the save phase first.

**Phase 14 failures (upload restore)** — if Phase 13 (download) also failed, Phase 14 failures are downstream. Fix the download phase first.

**Phase 9 passes but app shows error UI** — expected behavior. The tests only verify the app does not crash; they do not verify that the error message text is correct. Phase 17 (`--real-files`) adds text assertions.

**Phase 18 timeout (chat.db smoke)** — most likely SQL.js failed to load from CDN. Check internet access. If network is unavailable, skip by not setting `KEEP_MEES_E2E_CHATDB_PATH`.

**Phase 19 failure (capture harness)** — the capture harness subprocess failed. Run `node scripts/capture-message-book-packet.mjs --scenarios a` manually to see the full output.

---

## Headed / debug mode

Run with `--headed` to see what the browser is doing. Add `--slow` to slow down each step by 600ms. Use `--headed` any time a test fails and you need to observe the app state at failure time.

---

## What manual QA remains after this automation

After the harness passes, a short spot check is still needed for:

- Visual rendering quality (bubble layout, typography, date separators) — not verified by automated tests
- Composition view internals (preview rendering, keepsake save confirmation banner)
- Any view or interaction that changed in the current package (targeted spot check only)
- OS-native file picker dialog behavior (harness bypasses with setInputFiles)
- Full capture scenario suite (scenarios b–d) if layout or pagination changed

**Before Package 3B:** manual QA was a full checklist across all views after every package.

**After Package 3C:** run the seeded harness first. If it passes and no real-file paths changed, manual QA is a quick focused spot check on anything that visually changed. If real-file paths changed, also run `--real-files`.

---

## Adding new tests

Add a new `harness.run(name, async page => { ... })` block in the relevant phase section of `scripts/e2e-regression-harness.mjs`. Throw an error (via `assert()` or explicitly) to fail the test. Do not add tests that bypass real app behavior — assert against actual DOM state and actual window.__km values.

For tests that do not require a browser page (subprocess, file I/O), use `harness.runNode(name, async () => { ... })` instead.

Seeded test data lives in `scripts/e2e-test-data.mjs`. If a new seeded test needs different data, add it there with a fixed timestamp base (deterministic).

Real-file fixture data lives in `scripts/fixtures/`. Add new fixture files there. Never add real user data or real chat exports to this directory.

---

## Startup reliability (Package 4E.1)

Three measures guard against intermittent startup timing failures on Windows:

1. **Server readiness probe** — after `startServer()`, the harness sends a bounded HTTP GET to `http://127.0.0.1:7332/index.html` (10 × 100 ms). If the server is not responding after all probes, the harness exits with a diagnostic rather than launching Chromium into a race.

2. **Improved `waitForKm` error** — if `window.__km` is not defined within 10 s, the thrown error names both the `window.__km` block and module serving as likely causes, making the failure easier to diagnose.

3. **One bounded startup retry** — the initial `page.goto` + `waitForKm` sequence in Phase 1, test 1 retries once if it fails. The retry is logged (`[startup retry]`). Only applies to the very first navigation; all other tests do not retry.

These changes affect only `scripts/e2e-regression-harness.mjs` — no product behavior is changed.

---

## Static server

The harness uses a proper static file server (port 7332) that serves all files under the repo root with correct MIME types. This is distinct from the capture harness server (port 7331), which serves only `index.html` for all paths. Both can run simultaneously if needed (Phase 19 does this).

---

## Capture harness (separate command)

The existing capture harness is a separate tool for generating Preview Handoff screenshots:

```bash
node scripts/capture-message-book-packet.mjs --scenarios a
```

It is not part of the default regression harness run. Run it separately when you need layout captures for design work. Phase 19 (`--real-files`) verifies scenario A exits cleanly as part of full regression.
