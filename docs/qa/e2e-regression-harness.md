# E2E Regression Harness — KeepMees / MessageVault

**Package:** 3B
**Status:** Active

---

## Purpose

Automated browser regression tests that replace the majority of the manual QA checklist run after each package. Uses Playwright headless Chromium and a proper static file server. Exits with a non-zero code if any critical regression is detected.

---

## How to run

### From repo root (recommended)

```bash
node scripts/e2e-regression-harness.mjs
```

### Headed mode (shows browser window — use for debugging failures)

```bash
node scripts/e2e-regression-harness.mjs --headed
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
```

### First-time setup

Playwright and Chromium must be installed. Run once from the `scripts/` directory:

```bash
cd scripts
npm install
npx playwright install chromium
```

---

## What it covers

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

**Total tests: 29**

---

## What it does not cover

- Visual/pixel fidelity — use the capture harness (`node scripts/capture-message-book-packet.mjs`) for layout screenshots
- Real chat.db import — seeded test data only
- Composition view and individual keepsake type chooser — requires complex multi-step user interaction; addressed by manual QA
- Preflight checks — no runner implemented yet
- Checkout, PDF generation, vendor exports
- Cloud sync, login, auth
- Performance benchmarks

---

## How to interpret failures

**Non-zero exit code** — at least one test failed. Check the test output for `✗` lines.

**Failure screenshots** — saved automatically to `artifacts/e2e-failures/` (gitignored). Each failure produces a full-page PNG named after the test that failed.

**"KMEngine modules not loaded"** — most likely the static server is not serving `src/` files with a `text/javascript` MIME type. The harness server handles this; the capture harness server does not. If you switch servers, verify MIME types.

**"window.__km not defined"** — the inline harness bridge in `index.html` failed to execute. Check for JavaScript syntax errors in the `window.__km` block.

**Phase 8 failures (restore)** — if Phase 7 (save) also failed, Phase 8 failures are downstream and not independent. Fix the save phase first.

**Phase 9 passes but app shows error UI** — expected behavior. The tests only verify the app does not crash; they do not verify that the error message text is correct.

---

## Headed / debug mode

Run with `--headed` to see what the browser is doing. Add `--slow` to slow down each step by 600ms. Use `--headed` any time a test fails and you need to observe the app state at failure time.

---

## What manual QA remains after this automation

After the harness passes, a short spot check is still needed for:

- Visual rendering quality (bubble layout, typography, date separators) — not verified by automated tests
- Composition view and keepsake type chooser interaction
- Any view or interaction that changed in the current package (targeted spot check only)
- Standalone keepsake composition flow (full user path through type selection)

**Before Package 3B:** manual QA was a full checklist across all views after every package.

**After Package 3B:** run the harness first. If it passes, manual QA is a quick focused spot check on anything that visually changed in that package.

---

## Adding new tests

Add a new `harness.run(name, async page => { ... })` block in the relevant phase section of `scripts/e2e-regression-harness.mjs`. Throw an error (via `assert()` or explicitly) to fail the test. Do not add tests that bypass real app behavior — assert against actual DOM state and actual window.__km values.

Test data lives in `scripts/e2e-test-data.mjs`. If a new test needs different data, add it there with a fixed timestamp base (deterministic).

---

## Static server

The harness uses a proper static file server (port 7332) that serves all files under the repo root with correct MIME types. This is distinct from the capture harness server (port 7331), which serves only `index.html` for all paths. Both can run simultaneously if needed.

---

## Capture harness (separate command)

The existing capture harness is a separate tool for generating Preview Handoff screenshots:

```bash
node scripts/capture-message-book-packet.mjs --scenarios a
```

It is not part of the regression harness run. Run it separately when you need layout captures for design work.
