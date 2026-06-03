# Test Strategy — KeepMees / MessageVault

**Status:** ACTIVE (formalized in Package 2.9; visual regression added in Package 3D; updated to 2039 baseline in Package 3F; E2E Phase 22 added in Package 3G).
**Last updated:** 2026-06-03 (America/New_York)
**Owner:** Development stream / Claude Code under Operator Mode.

This document is the single answer to "what tests exist, what should be added, and when do they run?" for KeepMees. It is intentionally first-class — testing is not cleanup-later.

---

## The six layers

KeepMees uses six distinct test layers. Each has a different cost, a different fidelity, and a different trigger.

### Layer 1 — Node unit tests (`src/tests/*.mjs`)

**What:** Pure JavaScript tests, run by `node` directly. No DOM, no browser. Vm-module pattern for any test that needs to load the engine.

**Suites and counts (as of Package 3F — confirmed baseline 2039):**

| Suite | Tests | Coverage |
|---|---|---|
| `km-engine-tests.mjs` | 96 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms |
| `keepsake-group-tests.mjs` | 43 | KeepsakeGroup data model |
| `product-catalog-tests.mjs` | 127 | ProductStatuses, ProductCatalog, required fields |
| `product-eligibility-tests.mjs` | 76 | Per-product eligibility evaluators, LegacyKeepsakeTypesBridge |
| `project-persistence-tests.mjs` | 157 | Snapshot, validate, deserialize, restore; proofApprovalStates; productDrafts validation + restore normalization (Package 3A + 5B + 3E) |
| `operator-inbox-processor-tests.mjs` | 85 | Inbox processor extraction + processFile (Package 2.6, 2.6.1) |
| `product-render-spec-tests.mjs` | 341 | Render specs + resolver; render-planning-target gate (Package 4A) |
| `prototype-preview-registry-tests.mjs` | 215 | Preview registry + resolver (Package 4B) |
| `product-experience-readiness-tests.mjs` | 337 | Combined readiness resolver across all 4 product layers (Package 4C) |
| `product-experience-consumer-tests.mjs` | 35 | Null-safe app-side bridge (Package 4D) |
| `proof-approval-state-tests.mjs` | 137 | Proof approval state model and transitions (Package 5A) |
| `proof-approval-ux-tests.mjs` | 77 | Proof approval UX layer: initialize, submit, serialize/restore, prohibited fields (Package 5B) |
| `product-draft-state-tests.mjs` | 90 | ProductDraft lifecycle state machine, transitions, semantic guards (Package 3E) |
| `product-preflight-tests.mjs` | 119 | Preflight check registry, PAGINATION_STABILITY runner, aggregate status, semantic guards (Package 3E) |
| `product-draft-lifecycle-tests.mjs` | 104 | Lifecycle coordinator API, all lifecycle paths, mutation model, duplicate handling, semantic guards (Package 3F) |

**Total: 2039 tests.** All must remain green before any commit.

Note: 1935 was the Package 3E baseline. Package 3F added `product-draft-lifecycle-tests.mjs` (104 tests), raising the confirmed baseline to 2039.

**Run:**

```bash
node src/tests/km-engine-tests.mjs
node src/tests/keepsake-group-tests.mjs
# (one command per suite; no test runner orchestrator — by design)
```

Or run all suites individually as part of pre-commit verification.

**When to add tests in this layer:**

- New `src/` modules — always
- New product / catalog / eligibility / render-spec / preview / readiness logic — always
- New persistence / serialization paths — always
- State-transition logic — always (especially proof approval transitions when Package 5A starts)

---

### Layer 2 — E2E seeded harness (Playwright)

**What:** Headless Chromium running the actual `index.html` against deterministic seed data (`scripts/e2e-test-data.mjs`).

**Coverage:** Phases 1–10 + 20 + 21 + 22 + 23 of `scripts/e2e-regression-harness.mjs`. **53 tests.**

**Run:**

```bash
cd scripts && npm run e2e
# or headed:
cd scripts && npm run e2e:headed
```

**Triggers (must run before commit when):**

- `index.html` changed
- Any `src/products/*.js` consumed by the app changed
- `window.__km` bridge changed
- Save/load or persistence layer changed
- Any new UI surface added

---

### Layer 3 — E2E real-files harness

**What:** Same harness, with the `--real-files` flag. Tests phases 11–19 — real .txt import, actual browser download, actual file upload/restore, standalone keepsake type chooser, stable error text, optional chat.db smoke, capture harness subprocess.

**Coverage:** 23 tests (22 always + 1 conditional on local chat.db). Combined seeded + real-files: 64.

**Run:**

```bash
cd scripts && npm run e2e:real
```

**Triggers (must run before commit when):**

- Any real-file import path changed (.txt, .db, etc.)
- Browser download/upload changed
- Standalone keepsake type chooser changed

---

### Layer 4 — Capture harness (visual / packet)

**What:** `scripts/capture-message-book-packet.mjs` — Playwright-driven capture of Message Book rendering for preview packet generation.

**Run:**

```bash
cd scripts && npm run capture:a   # scenario A
cd scripts && npm run capture:b   # scenario B
# etc.
```

**Triggers (must run before commit when):**

- Message Book rendering touched
- Pagination touched (note: pagination constants are scope-guarded)
- Preview composition touched
- `buildKeepsakeCard` or downstream rendering changed

---

### Layer 5 — Visual regression (`scripts/visual-regression-harness.mjs`)

**What:** Per-page screenshot comparison against committed Scenario A baselines using `pixelmatch`. Detects layout regressions in Message Book rendering.

**Run:**

```bash
node scripts/visual-regression-harness.mjs --check
# or
cd scripts && npm run vr:check
```

**Triggers (must run before commit when):**

- `index.html` rendering logic changed (pagination, section structure, bubble layout)
- Message Book composition engine touched
- `BOOK_PAGINATION_VERSION` bumped

See `docs/qa/visual-regression-guide.md` for full usage, baseline update policy, and threshold documentation.

---

### Layer 6 — Docs / package verification

**What:** No automated runner. Manual verification per `docs/qa/package-verification-template.md`.

**Run:** fill in the template; record results in chat or attached to the package handoff.

**Triggers:** every package closeout.

---

## Required tests by package type

| Package type | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Layer 5 | Layer 6 |
|---|---|---|---|---|---|---|
| Docs-only / OS infrastructure (like 2.7, 2.8, 2.9, v1.x OS passes) | — (run script validators: `os-self-audit.mjs`, `state-freshness-check.mjs`) | — | — | — | — | required |
| `src/` engine module | required | recommended if app-visible | — | — | — | required |
| New product / catalog logic | required | recommended | — | — | — | required |
| New persistence logic | required | required | required | — | — | required |
| New UI surface in `index.html` | recommended | required | required if real-file path | — | — | required |
| Pagination / rendering / preview | required | required | — | required | **required** | required |
| Real-file import path | required | required | required | — | — | required |
| Bug fix that's behavior-visible | recommended | required | required if real-file | — | recommended | required |

"Required" means: run it before commit, or document why it was skipped.

---

## Future packages — testing planning

Package 5A is COMPLETE (merged `297a221`). Its test suite (`proof-approval-state-tests.mjs`, 137 tests) covers the proof approval state model, allowed/forbidden transitions, and decoupling from checkout.

**Package 5B — COMPLETE (merged `dc4f86b` 2026-06-02):**

Package 5B added `proof-approval-ux-tests.mjs` (77 tests) and 15 new persistence tests:

- `proof-approval-ux-tests.mjs` — API shape, initialize/idempotency, getState before/after, submitForReview, double-submit guard, getStatusLabel all 5 statuses, getAllowedUserActions all 5 statuses, serialize JSON-safety, restore rehydrate/null/empty/extra-fields, duplicate-submit-after-restore, prohibited fields guard.
- Project-persistence additions — createSnapshot with proofApprovalStates, default to {}, validate accepts/rejects, round-trip, invalid type rejection.
- Package 5B correction pass — PSR restore: proofApprovalStates in KNOWN_SESSION_FIELDS (no warning), present in appState after restore, defaults to {} when absent from older snapshots.

Layer 2 (E2E seeded 41/41) and Layer 3 (E2E real-files 64/64) pass — no regressions in book view, save/restore, standalone keepsake, or Review view. Manual QA completed per package instruction.

**Package 3H — Draft-Preflight Status Surface and Proof Panel Gate (COMPLETE — merged `1297f92` 2026-06-03):**

Package 3H adds no new Node unit tests (zero engine module changes). E2E Phase 23 adds 6 seeded tests covering draft book-check auto-advance, proof panel gating, idempotency, save/restore, and ProofApprovalUX independence. Phase 22 tests updated to reflect the new expected state (draft reaches `preflight-passed` on book view entry). Visual regression baselines updated for Scenario A (proof panel appearance changes). Layer 2 target: 53 seeded tests. Layer 3 unchanged: 70 real-files tests.

---

## Pre-commit baseline

Before any commit instruction is acted on, the agent must verify:

1. All 15 Node unit suites green (2039 tests).
2. If `index.html` or `src/` changed: E2E seeded green (53 tests).
3. If real-file paths changed: E2E real-files green (70 total).
4. If Message Book rendering changed: relevant capture harness scenario green; visual regression check green (`node scripts/visual-regression-harness.mjs --check`).
5. Manual QA recorded if UI behavior changed (`docs/qa/manual-qa-template.md`).
6. Package verification recorded (`docs/qa/package-verification-template.md`).
7. For OS/docs-only packages: run `node scripts/os-self-audit.mjs` and `node scripts/state-freshness-check.mjs`; no full app suite required.

If any of those is skipped, the agent must say so explicitly with the reason. Silent skipping is not acceptable.

---

## What this strategy does NOT do

- Visual regression for Message Book is now covered by Layer 5 (Package 3D, `scripts/visual-regression-harness.mjs`).
- It does not cover browser smoke tests outside the E2E harness.
- It does not cover load/performance testing.
- It does not cover security testing.
- It does not run on CI (no CI workflows are committed). Tests run locally before commit.

These gaps are documented and tracked — not hidden.

---

## Backlog / known gaps

| Item | Reason it's a gap | Where tracked |
|---|---|---|
| Visual regression for Message Book | Package 3D COMPLETE — Layer 5 active | `scripts/visual-regression-harness.mjs`, `docs/qa/visual-regression-guide.md` |
| Print-preview verification scripts | Vendor-gated | This file |
| Load / performance testing | Not in launch set | This file |
| Security testing pipeline | Future phase | This file |
| CI integration of tests | Not authorized | This file |
| Automated artifact generation checks | Vendor-gated | This file |
| Cross-browser E2E (Firefox, Safari, Edge) | Single-browser is intentional today | This file |

When any of these moves from gap to authorized, add tests **first**, code second.

---

## Pointers

- `docs/qa/manual-qa-template.md` — manual QA record format
- `docs/qa/pre-commit-verification-template.md` — hygiene gate before commit
- `docs/qa/package-verification-template.md` — per-package verification (Package 2.9)
- `docs/qa/release-readiness-template.md` — release gate
- `docs/qa/e2e-regression-harness.md` — E2E harness operating manual
- `docs/qa/visual-regression-guide.md` — visual regression harness (Package 3D)
- `docs/dev/auto-management-protocol.md` — how testing fits the broader OS
