# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — Package 4B implementation complete, awaiting commit authorization

**Last updated by:** `Claude Code`

**Date:** `2026-05-15`

---

## Package and branch

| Field | Value |
|---|---|
| **Active package** | `Package 4B — Prototype Preview Registry Foundation` |
| **Branch** | `feature/prototype-preview-registry-foundation` |
| **Branch base** | `main at 8ab2a3a` |
| **Last commit on branch** | `none yet — awaiting commit authorization` |

---

## Objective

Create the Prototype Preview Registry foundation layer between ProductRenderSpec and actual preview/proof rendering:
- `src/products/prototype-preview-registry.js` — preview entry registry with `PREVIEW_STATUS` constant (READY, STUB, NOT_APPLICABLE), `makePreviewEntry` factory, 6 entries covering all render planning targets, `KMEngine.PrototypePreviewRegistry` with `all()`, `get(productTypeId)`, `getByPreviewTypeId()`, `architectureKnown()`, `prototypePreviewSupported()`
- `src/products/prototype-preview-resolver.js` — `KMEngine.PrototypePreviewResolver` with `resolve(productTypeId, group?)`, `getEntry()`, `allEntries()`, `previewSupportedEntries()`; combines registry entry + ProductRenderSpec data; returns blockers/warnings/previewSupported
- `src/tests/prototype-preview-registry-tests.mjs` — 215 assertions across 13 suites
- `docs/architecture/architecture-roadmap.md` — section heading updated to post-Package 4B; new files added to module tree

---

## Approved scope

- [x] `src/products/prototype-preview-registry.js` — new file
- [x] `src/products/prototype-preview-resolver.js` — new file
- [x] `src/tests/prototype-preview-registry-tests.mjs` — new file
- [x] `docs/architecture/architecture-roadmap.md` — add PrototypePreviewRegistry layer entry

No other files changed.

---

## Hard exclusions

- Do not modify `index.html`
- Do not modify `src/**` app modules beyond the 2 new products/ files
- Do not implement actual preview UI, physical product renderers, PDF, checkout, or cover design
- Do not start any new package
- Do not commit or push without explicit Coordinator authorization

---

## Git state at handoff

```
Branch:       feature/prototype-preview-registry-foundation
main HEAD:    8ab2a3a — docs: mark Package 4A closed in handoff file
Working tree: 3 new untracked files, 2 modified files, nothing staged
Staged:       nothing staged
Last push:    No — branch not pushed yet
```

---

## Files changed

| File | What changed | Status |
|---|---|---|
| `src/products/prototype-preview-registry.js` | New — PREVIEW_STATUS constant, makePreviewEntry factory, 6 entries (1 READY + 5 STUB), KMEngine.PrototypePreviewRegistry; prototypePreviewEnabled: true for message-book only | complete |
| `src/products/prototype-preview-resolver.js` | New — resolve(productTypeId, group?); blockers: unknown-product-type, preview-not-supported, engine-not-supported, below-minimum-memory-count, attachment-only-messages-present; KMEngine.PrototypePreviewResolver | complete |
| `src/tests/prototype-preview-registry-tests.mjs` | New — 215 assertions across 13 suites | complete |
| `docs/architecture/architecture-roadmap.md` | Updated heading to post-Package 4B; added 2 product files + 1 test file to tree | complete |

---

## Work completed

- [x] Read AGENTS.md, CLAUDE.md, AI_HANDOFF.md
- [x] Read docs/strategy/master-project-truth.md
- [x] Read docs/strategy/product-format-bank.md
- [x] Read docs/architecture/architecture-roadmap.md
- [x] Read docs/ops/backlog-roadmap.md
- [x] Read src/products/product-catalog.js
- [x] Read src/products/product-eligibility.js
- [x] Read src/products/product-render-spec.js
- [x] Read src/products/product-render-spec-resolver.js
- [x] git pull confirmed: on main at 8ab2a3a, clean
- [x] Created branch feature/prototype-preview-registry-foundation
- [x] Wrote src/products/prototype-preview-registry.js
- [x] Wrote src/products/prototype-preview-resolver.js
- [x] Wrote src/tests/prototype-preview-registry-tests.mjs
- [x] Edited docs/architecture/architecture-roadmap.md
- [x] All tests pass: 215/215 new + 879/879 existing = 1094 total

## Work remaining

- [ ] Coordinator commit authorization
- [ ] Stage and commit 4 files + AI_HANDOFF.md on `feature/prototype-preview-registry-foundation`
- [ ] Push branch, merge to main, push main
- [ ] Post-merge status sync if required

---

## Tests run

| Suite / command | Result | Notes |
|---|---|---|
| `node src/tests/prototype-preview-registry-tests.mjs` | 215 passed, 0 failed | new — 13 suites |
| `node src/tests/km-engine-tests.mjs` | 96/96 | no regression |
| `node src/tests/keepsake-group-tests.mjs` | 43/43 | no regression |
| `node src/tests/product-catalog-tests.mjs` | 127/127 | no regression |
| `node src/tests/product-eligibility-tests.mjs` | 76/76 | no regression |
| `node src/tests/project-persistence-tests.mjs` | 111/111 | no regression |
| `node src/tests/operator-inbox-processor-tests.mjs` | 85/85 | no regression |
| `node src/tests/product-render-spec-tests.mjs` | 341/341 | no regression |

---

## Known issues / remaining minor gaps

None. Implementation is complete and all tests pass.

---

## Next exact action

Await Coordinator commit authorization. When authorized, stage and commit:
```
src/products/prototype-preview-registry.js
src/products/prototype-preview-resolver.js
src/tests/prototype-preview-registry-tests.mjs
docs/architecture/architecture-roadmap.md
AI_HANDOFF.md
```

Suggested commit message:
```
feat: add PrototypePreviewRegistry foundation (preview entry registry and resolver)
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
You are resuming Package 4B — Prototype Preview Registry Foundation on branch
feature/prototype-preview-registry-foundation (base: main at 8ab2a3a).

Status: 4 files created/modified, all 1094 tests pass (215 new + 879 existing),
awaiting commit authorization.

Files modified (only these four + AI_HANDOFF.md):
- src/products/prototype-preview-registry.js — NEW: PREVIEW_STATUS constant, makePreviewEntry factory,
  6 entries for render planning targets; prototypePreviewEnabled: true for message-book only
- src/products/prototype-preview-resolver.js — NEW: resolve(productTypeId, group?); blockers:
  unknown-product-type, preview-not-supported, engine-not-supported, below-minimum-memory-count,
  attachment-only-messages-present; combines PrototypePreviewRegistry + ProductRenderSpec
- src/tests/prototype-preview-registry-tests.mjs — NEW: 215 assertions across 13 suites
- docs/architecture/architecture-roadmap.md — MODIFIED: updated heading to post-Package 4B;
  added 2 product files + 1 test file to module tree

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
