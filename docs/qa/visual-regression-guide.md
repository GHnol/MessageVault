# Visual Regression Guide — Package 3D

**Status:** ACTIVE (introduced in Package 3D — Visual Regression Baseline Harness, 2026-06-02)
**Script:** `scripts/visual-regression-harness.mjs`
**Baselines:** `scripts/visual-regression-baselines/scenario-a/`
**Output:** `visual-regression-output/` (gitignored — generated locally)

---

## What Package 3D does

The visual regression harness captures per-page screenshots of Message Book rendering in a deterministic seeded scenario and compares them against committed baseline images. Any layout regression — pagination breaking, components disappearing, rendering artifacts, structural changes — is detected before it reaches a commit.

This is QA infrastructure only. It does not change app behavior, `index.html`, `src/**`, or pagination constants.

---

## Running the harness

### Check current rendering against baselines

```bash
node scripts/visual-regression-harness.mjs --check
# or
cd scripts && npm run vr:check
```

Exit code 0 = all pages pass. Exit code 1 = at least one page failed.

### Update baselines (after an intentional rendering change)

```bash
node scripts/visual-regression-harness.mjs --update-baselines
# or
cd scripts && npm run vr:baseline
```

**Baseline updates require Coordinator authorization** — see "When baselines may be updated" below.

### Debug mode (shows browser)

```bash
node scripts/visual-regression-harness.mjs --headed
node scripts/visual-regression-harness.mjs --update-baselines --headed
```

### Custom threshold

```bash
node scripts/visual-regression-harness.mjs --check --threshold 0.2
```

Threshold is a percentage of total pixels. Default is 0.1%.

### Simulate a regression (verify the harness detects failures)

```bash
node scripts/visual-regression-harness.mjs --simulate-regression
```

Injects a visible CSS change at runtime (red border + pink background on page 1), runs the check, and exits 1. Does not modify any repo files. After running, the normal `--check` will still pass.

---

## Where baselines live

Committed baseline PNGs are in `scripts/visual-regression-baselines/scenario-a/`:

- `page-01.png`, `page-02.png`, ... `page-NN.png` — per-page baseline screenshots
- `manifest.json` — page count, `BOOK_PAGINATION_VERSION`, capture timestamp, viewport, threshold default

These files are tracked in git. They represent the approved visual state of Scenario A Message Book rendering at the time of their last update.

---

## Where generated output lives

`visual-regression-output/` at the repo root is gitignored. It contains:

- `scenario-a/current/` — screenshots taken during the most recent `--check` run
- `scenario-a/diff/` — diff PNGs for any pages that failed (colored: red = mismatch, black = match)

You can open diff PNGs directly to see exactly which pixels changed.

---

## When baselines may be updated

Baseline updates are appropriate when:

1. An intentional rendering change is made to `index.html` or the composition engine (Message Book layout, typography, section structure)
2. A `BOOK_PAGINATION_VERSION` bump occurs
3. A Playwright/Chromium update changes rendering at the sub-pixel level (minor anti-aliasing changes)
4. The Scenario A scenario content changes

**Before updating baselines:**
1. Confirm the visual change is intentional and has been reviewed
2. Get explicit Coordinator authorization
3. Run `--update-baselines`, review the generated PNGs carefully
4. Commit the updated PNGs along with the code change that caused them

**Never update baselines to make a failing check pass without understanding why the check failed.**

---

## Threshold behavior

The default threshold is **0.1% of total pixels** (approximately 1,300 pixels in a 1440×900 page). This value:
- Catches real layout regressions (a moved element, a missing line, a width change)
- Tolerates minor sub-pixel anti-aliasing variation from rendering differences
- Was validated against Scenario A with stable consistent rendering (0 mismatch on identical captures)

If you see consistent flakiness (failing on identical content), increase the threshold with `--threshold 0.2` and investigate. Do not blindly increase the threshold to silence real regressions.

---

## Expected failure behavior

When `--check` fails:

1. Exit code 1 is returned
2. Per-page results show `FAIL` with the mismatch pixel count and percentage
3. Diff images are written to `visual-regression-output/scenario-a/diff/`
4. The failing page name and diff path are printed to stdout

Example failure output:
```
FAIL  page-02.png  —  4210 px (2.2319% > threshold 0.1000%)
      diff: visual-regression-output\scenario-a\diff\page-02-diff.png
```

Open the diff PNG to see which pixels changed.

---

## Screenshot brittleness risks

| Risk | Mitigation |
|---|---|
| Chromium update changes sub-pixel rendering | Intentional; treat as baseline update event |
| Layout settling timing (render not complete) | 600ms wait inherited from capture harness pattern |
| Sticky header overlapping page crops | `km-capture-mode` CSS class suppresses sticky header (same as capture harness) |
| Threshold too tight → false positives | Tune with `--threshold`; default 0.1% was stable in testing |
| Different DPI/scale settings | Fixed 1440×900 headless viewport; Playwright normalizes rendering |

---

## Why Scenario A only (initial scope)

Scenario A (Short / Balanced) was selected for the initial baseline because:
- It has the fewest pages (4 pages at initial capture), minimizing binary commit size
- It exercises all structural page types (title/opening, sections, ending)
- It is deterministic and stable — the same input always produces the same pages
- Scenarios B, C, D can be added as future extensions if warranted

Extension of baselines to additional scenarios requires Coordinator authorization.

---

## Scenario A content

Scenario A seeds a short balanced conversation (3 sections, 15 messages total) via `scripts/message-book-scenarios.mjs`. No real user data. The seed is deterministic and safe to commit.

---

## Harness internals

- Port: 7333 (distinct from capture harness port 7331 and E2E harness port 7332)
- Viewport: 1440×900
- Server: static file server from repo root (same MIME-type-aware pattern as E2E harness)
- Capture: per `.book-page` element via Playwright `locator.screenshot()` with `km-capture-mode` active
- Comparison: `pixelmatch` (pure JS, no native binaries) with `pngjs` for PNG decoding
- No `index.html` changes required; no new `window.__km` hooks required
