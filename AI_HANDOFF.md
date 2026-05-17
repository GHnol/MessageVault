# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `open` — Package 4E implementation complete, awaiting commit authorization

**Last updated by:** `Claude Code`

**Date:** `2026-05-17`

---

## Package and branch

| Field | Value |
|---|---|
| **Active package** | `Package 4E — Product Format Availability Surface Foundation` |
| **Branch** | `feature/product-format-availability-surface` |
| **Branch base** | `main at a2f500e` |
| **Last commit on branch** | `none yet — awaiting commit authorization` |

---

## Objective

Create the first safe product-format availability surface in the app. Expose ProductExperienceReadiness through a conservative UI section inside the "Your Keepsakes" view, showing which formats are known/available/planned/gated per keepsake group. Hard exclusions: no actual preview UI, no product renderers, no proof approval, no commerce/checkout/payment, no PDF generation, no vendor exports, no UI redesign.

New files: none.

Updated files:
- `index.html` — CSS for `.ks-format-availability` (light + dark mode); `buildFormatAvailability(group)` function; wiring inside `buildKeepsakeCard`
- `scripts/e2e-regression-harness.mjs` — Phase 21 added (6 tests: section renders, message-book tag text, fmt-available class, non-book planned labels, no commerce language, no crash)
- `docs/architecture/architecture-roadmap.md` — heading updated to post-Package 4E; `buildFormatAvailability()` noted in module tree
- `AI_HANDOFF.md` — this file

---

## Approved scope

- [x] `index.html` — CSS + `buildFormatAvailability` + wiring in `buildKeepsakeCard`
- [x] `scripts/e2e-regression-harness.mjs` — Phase 21 (6 tests)
- [x] `docs/architecture/architecture-roadmap.md` — heading + note

No new source files created.

---

## Hard exclusions

- Do not implement actual preview UI for any product (mug, sticker, framed print, notebook, magnet, gift wrap, or any future product)
- Do not implement product renderers, proof approval, commerce/checkout/payment, PDF generation, vendor exports
- Do not redesign the Keepsakes view
- Do not commit or push without explicit Coordinator authorization

---

## Git state at handoff

```
Branch:       feature/product-format-availability-surface
main HEAD:    a2f500e — merge: sync operating docs to reflect Package 4D completion
Working tree: 3 modified files (index.html, scripts/e2e-regression-harness.mjs,
              docs/architecture/architecture-roadmap.md)
Staged:       nothing staged
Last push:    No — branch not pushed yet
```

---

## Files changed

| File | What changed | Status |
|---|---|---|
| `index.html` | CSS for `.ks-format-availability` section (light + dark mode); `buildFormatAvailability(group)` function before `buildKeepsakeCard`; 3-line wiring inside `buildKeepsakeCard` after `card.appendChild(meta)` | complete |
| `scripts/e2e-regression-harness.mjs` | Phase 21 added (6 tests between Phase 20 and REAL_FILES block); first test includes full seed→select→continue flow to create real keepsake groups | complete |
| `docs/architecture/architecture-roadmap.md` | Heading to post-Package 4E; `buildFormatAvailability()` noted in module tree comment | complete |

---

## Work completed

- [x] Read all prerequisite files (AGENTS.md, CLAUDE.md, AI_HANDOFF.md, architecture docs, product source files)
- [x] Confirmed git state — on main at a2f500e, clean tree
- [x] Created branch feature/product-format-availability-surface from main at a2f500e
- [x] Added CSS for `.ks-format-availability` section to index.html (light + dark mode)
- [x] Added `buildFormatAvailability(group)` function to index.html before `buildKeepsakeCard`
- [x] Wired `buildFormatAvailability` into `buildKeepsakeCard` (after meta, before action row)
- [x] Added E2E Phase 21 (6 tests) to scripts/e2e-regression-harness.mjs
- [x] Fixed Phase 21 first test to run full seed→select→continue flow (real groups required)
- [x] Updated docs/architecture/architecture-roadmap.md heading to post-Package 4E
- [x] Ran all 10 unit test suites: 1466/1466 passed
- [x] Ran E2E seeded: 41/41 passed (35 existing + 6 new Phase 21)
- [x] Ran E2E real-files: 64/64 passed (58 existing + 6 new Phase 21)
- [x] Ran capture harness scenario A: passed (included in real-files run above)

## Work remaining

- [ ] Coordinator commit authorization
- [ ] Stage and commit 3 modified files + AI_HANDOFF.md on `feature/product-format-availability-surface`
- [ ] Push branch, merge to main, push main
- [ ] Post-merge status sync if required by Coordinator

---

## Tests run

| Suite / command | Result | Notes |
|---|---|---|
| `node src/tests/product-experience-consumer-tests.mjs` | 35 passed, 0 failed | no regression |
| `node src/tests/product-experience-readiness-tests.mjs` | 337 passed, 0 failed | no regression |
| `node src/tests/prototype-preview-registry-tests.mjs` | 215 passed, 0 failed | no regression |
| `node src/tests/product-render-spec-tests.mjs` | 341 passed, 0 failed | no regression |
| `node src/tests/operator-inbox-processor-tests.mjs` | 85 passed, 0 failed | no regression |
| `node src/tests/project-persistence-tests.mjs` | 111 passed, 0 failed | no regression |
| `node src/tests/product-eligibility-tests.mjs` | 76 passed, 0 failed | no regression |
| `node src/tests/product-catalog-tests.mjs` | 127 passed, 0 failed | no regression |
| `node src/tests/keepsake-group-tests.mjs` | 43 passed, 0 failed | no regression |
| `node src/tests/km-engine-tests.mjs` | 96 passed, 0 failed | no regression |
| `node scripts/e2e-regression-harness.mjs` | 41 passed, 0 failed | 35 existing + 6 new Phase 21 |
| `node scripts/e2e-regression-harness.mjs --real-files` | 64 passed, 0 failed | 58 existing + 6 new Phase 21; includes capture harness scenario A |
| **Total Node unit tests** | **1466 passed, 0 failed** | unchanged from Package 4D |

---

## Known issues / remaining minor gaps

None. All tests pass. The format availability surface is a pure read layer over ProductExperienceConsumer — no new product logic, no rendering changes beyond the new section.

---

## Next exact action

Await Coordinator commit authorization. When authorized, stage and commit:
```
index.html
scripts/e2e-regression-harness.mjs
docs/architecture/architecture-roadmap.md
AI_HANDOFF.md
```

Suggested commit message:
```
feat: add product format availability surface to Keepsakes view
```

---

## Source-of-truth files to read first on resume

1. `AGENTS.md`
2. `CLAUDE.md`
3. This file (`AI_HANDOFF.md`)
4. `git status`
5. `git log --oneline -10`

---

## Resume prompt for next Claude/Codex session

```
You are resuming Package 4E — Product Format Availability Surface Foundation on branch
feature/product-format-availability-surface (base: main at a2f500e).

Status: 3 files modified, all tests pass (1466 Node unit tests + 41 E2E seeded +
64 E2E real-files including capture harness scenario A), awaiting commit authorization.

Files modified (only these three + AI_HANDOFF.md):
- index.html — CSS for .ks-format-availability section (light + dark); buildFormatAvailability(group)
  function; wiring inside buildKeepsakeCard after card.appendChild(meta)
- scripts/e2e-regression-harness.mjs — Phase 21 added (6 tests between Phase 20 and REAL_FILES);
  first test includes full reload→seed→selectAll→continue flow to create real groups
- docs/architecture/architecture-roadmap.md — heading to post-Package 4E

Do NOT commit or push without explicit Coordinator authorization.
Do NOT implement actual preview UI, renderers, checkout, PDF, or vendor exports.
Do NOT start any new package.
```

---

## File-level warnings

| File | Warning |
|---|---|
| `index.html` | Single-file app — edit only the CSS block, the buildFormatAvailability function, and the wiring inside buildKeepsakeCard. |
| `src/**` (except `src/tests/` and approved products/ files) | Do not modify app modules beyond approved scope. |
| `operator-outbox/*.md`, `operator-outbox/*.json` | Gitignored — never commit generated outbox files |
| `operator-inbox/*.md` (except README, .gitkeep) | Gitignored — never commit real inbox files |
