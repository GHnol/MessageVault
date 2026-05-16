# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `closed` — Package 4A COMPLETE, merged to main, status sync complete

**Last updated by:** `Claude Code`

**Date:** `2026-05-15`

---

## Package and branch

| Field | Value |
|---|---|
| **Active package** | `Package 4A — ProductRenderSpec Foundation` |
| **Branch** | `feature/product-render-spec-foundation` |
| **Branch base** | `main at 75a2378` |
| **Last commit on branch** | `none yet — awaiting commit authorization` |

---

## Objective

Create the ProductRenderSpec foundation layer between ProductEligibility and preview/proof rendering:
- `src/products/product-render-spec.js` — spec registry with 5 constants (RENDER_STATUS, TEXT_DENSITY, BUBBLE_TREATMENT, REACTION_POLICY, ATTACHMENT_POLICY), `makeRenderSpec` factory, 10 specs covering all 6 catalog products + 4 physical-only render planning targets, and `KMEngine.ProductRenderSpecs` with `all()`, `get()`, `renderPlanningTargets()`, `catalogAligned()`
- `src/products/product-render-spec-resolver.js` — `KMEngine.ProductRenderSpecResolver` with `resolve(productTypeId, group)`, `getSpec()`, `allSpecs()`, `renderPlanningTargetSpecs()`
- `src/tests/product-render-spec-tests.mjs` — 341 assertions across 11 suites; Suite 11 explicitly verifies that `isRenderPlanningTarget` does not imply commerce/manufacturing/publicClaim readiness
- `docs/architecture/architecture-roadmap.md` — section heading updated to post-Package 4A; new files added to module tree

---

## Approved scope

- [x] `src/products/product-render-spec.js` — new file
- [x] `src/products/product-render-spec-resolver.js` — new file
- [x] `src/tests/product-render-spec-tests.mjs` — new file
- [x] `docs/architecture/architecture-roadmap.md` — add ProductRenderSpec layer entry

No other files changed.

---

## Hard exclusions

- Do not modify `index.html`
- Do not modify `src/**` app modules beyond the 2 new products/ files
- Do not implement ProductDraft, preflight runner, or session persistence
- Do not start any new package
- Do not commit or push without explicit Coordinator authorization

---

## Git state at handoff

```
Branch:       feature/product-render-spec-foundation
main HEAD:    75a2378 — merge: add Operator Inbox closeout extraction improvements
Working tree: 3 new untracked files, 1 modified file, nothing staged
Staged:       nothing staged
Last push:    No — branch not pushed yet
```

---

## Files changed

| File | What changed | Status |
|---|---|---|
| `src/products/product-render-spec.js` | New — 5 constants, makeRenderSpec factory, 10 specs, KMEngine.ProductRenderSpecs; field renamed isRenderPlanningTarget (not isLaunchTarget); renderPlanningTargets() method | complete |
| `src/products/product-render-spec-resolver.js` | New — resolve(productTypeId, group); renderPlanningTargetSpecs() passthrough | complete |
| `src/tests/product-render-spec-tests.mjs` | New — 341 assertions across 11 suites; Suite 11: isRenderPlanningTarget does not imply commerce/manufacturing/publicClaim readiness | complete |
| `docs/architecture/architecture-roadmap.md` | Updated heading to post-Package 4A; added 2 product files + 1 test file to tree | complete |

---

## Work completed

- [x] Read AGENTS.md, CLAUDE.md, AI_HANDOFF.md
- [x] Read docs/strategy/master-project-truth.md
- [x] Read docs/strategy/product-format-bank.md
- [x] Read docs/strategy/requirements-bank.md
- [x] Read docs/strategy/feature-bank.md
- [x] Read docs/architecture/adr-001-app-architecture-path.md
- [x] Read docs/architecture/architecture-roadmap.md
- [x] Read docs/ops/backlog-roadmap.md
- [x] Read src/products/product-catalog.js, product-statuses.js, product-eligibility.js
- [x] Read src/tests/product-catalog-tests.mjs (vm loading pattern)
- [x] git status confirmed: on main, clean, up to date at 75a2378
- [x] Created branch feature/product-render-spec-foundation
- [x] Wrote src/products/product-render-spec.js
- [x] Wrote src/products/product-render-spec-resolver.js
- [x] Wrote src/tests/product-render-spec-tests.mjs
- [x] Edited docs/architecture/architecture-roadmap.md
- [x] Renamed isLaunchTarget → isRenderPlanningTarget; launchTargets() → renderPlanningTargets(); launchTargetSpecs() → renderPlanningTargetSpecs()
- [x] Added Suite 11 (18 new assertions): isRenderPlanningTarget does not imply commerce/manufacturing/publicClaim
- [x] All tests pass: 341/341 new + 538/538 existing = 879 total

## Work remaining

- [ ] Coordinator commit authorization
- [ ] Stage and commit 4 files + AI_HANDOFF.md on `feature/product-render-spec-foundation`
- [ ] Push branch, merge to main, push main
- [ ] Post-merge status sync if required

---

## Tests run

| Suite / command | Result | Notes |
|---|---|---|
| `node src/tests/product-render-spec-tests.mjs` | 341 passed, 0 failed | new — 11 suites; Suite 11 verifies render planning targets do not imply commerce/manufacturing/publicClaim readiness |
| `node src/tests/km-engine-tests.mjs` | 96/96 | no regression |
| `node src/tests/keepsake-group-tests.mjs` | 43/43 | no regression |
| `node src/tests/product-catalog-tests.mjs` | 127/127 | no regression |
| `node src/tests/product-eligibility-tests.mjs` | 76/76 | no regression |
| `node src/tests/project-persistence-tests.mjs` | 111/111 | no regression |
| `node src/tests/operator-inbox-processor-tests.mjs` | 85/85 | no regression |

---

## Known issues / remaining minor gaps

None. Implementation is complete and all tests pass.

---

## Next exact action

Await Coordinator commit authorization. When authorized, stage and commit:
```
src/products/product-render-spec.js
src/products/product-render-spec-resolver.js
src/tests/product-render-spec-tests.mjs
docs/architecture/architecture-roadmap.md
AI_HANDOFF.md
```

Suggested commit message:
```
feat: add ProductRenderSpec foundation (render spec registry and resolver)
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
You are resuming Package 4A — ProductRenderSpec Foundation on branch
feature/product-render-spec-foundation (base: main at 75a2378).

Status: 4 files created/modified, all 861 tests pass (323 new + 538 existing),
awaiting commit authorization.

Files modified (only these four + AI_HANDOFF.md):
- src/products/product-render-spec.js — NEW: 10 specs, 5 constants, makeRenderSpec factory; isRenderPlanningTarget (not isLaunchTarget); renderPlanningTargets()
- src/products/product-render-spec-resolver.js — NEW: resolve(productTypeId, group); renderPlanningTargetSpecs()
- src/tests/product-render-spec-tests.mjs — NEW: 341 assertions; Suite 11 verifies no commerce/manufacturing/publicClaim implied
- docs/architecture/architecture-roadmap.md — MODIFIED: added ProductRenderSpec to module tree

Do NOT commit or push without explicit Coordinator authorization.
Do NOT modify index.html or any src app modules beyond the approved scope.
Do NOT start any new package.
```

---

## File-level warnings

| File | Warning |
|---|---|
| `index.html` | Single-file app — do not touch. |
| `src/**` (except `src/tests/` and the 2 new products/ files) | Do not modify app modules. |
| `operator-outbox/*.md`, `operator-outbox/*.json` | Gitignored — never commit generated outbox files |
| `operator-inbox/*.md` (except README, .gitkeep) | Gitignored — never commit real inbox files |
