# Test Strategy — KeepMees / MessageVault

**Status:** ACTIVE (formalized in Package 2.9; reflects the actual test surface as of main HEAD `9191532`).
**Last updated:** 2026-05-22 (America/New_York)
**Owner:** Development stream / Claude Code under Operator Mode.

This document is the single answer to "what tests exist, what should be added, and when do they run?" for KeepMees. It is intentionally first-class — testing is not cleanup-later.

---

## The five layers

KeepMees uses five distinct test layers. Each has a different cost, a different fidelity, and a different trigger.

### Layer 1 — Node unit tests (`src/tests/*.mjs`)

**What:** Pure JavaScript tests, run by `node` directly. No DOM, no browser. Vm-module pattern for any test that needs to load the engine.

**Suites and counts (as of main HEAD `9191532`):**

| Suite | Tests | Coverage |
|---|---|---|
| `km-engine-tests.mjs` | ~96 | NormalizedMemory, ProjectSession, SessionSerialization, adapters, source platforms |
| `keepsake-group-tests.mjs` | 43 | KeepsakeGroup data model |
| `product-catalog-tests.mjs` | 127 | ProductStatuses, ProductCatalog, required fields |
| `product-eligibility-tests.mjs` | 76 | Per-product eligibility evaluators, LegacyKeepsakeTypesBridge |
| `project-persistence-tests.mjs` | 111 | Snapshot, validate, deserialize, restore (Package 3A) |
| `operator-inbox-processor-tests.mjs` | 85 | Inbox processor extraction + processFile (Package 2.6, 2.6.1) |
| `product-render-spec-tests.mjs` | 341 | Render specs + resolver; render-planning-target gate (Package 4A) |
| `prototype-preview-registry-tests.mjs` | 215 | Preview registry + resolver (Package 4B) |
| `product-experience-readiness-tests.mjs` | 337 | Combined readiness resolver across all 4 product layers (Package 4C) |
| `product-experience-consumer-tests.mjs` | 35 | Null-safe app-side bridge (Package 4D) |

**Total: 1466 tests.** All must remain green before any commit.

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

**Coverage:** Phases 1–10 + 20 + 21 of `scripts/e2e-regression-harness.mjs`. **41 tests.**

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

### Layer 5 — Docs / package verification

**What:** No automated runner. Manual verification per `docs/qa/package-verification-template.md`.

**Run:** fill in the template; record results in chat or attached to the package handoff.

**Triggers:** every package closeout.

---

## Required tests by package type

| Package type | Layer 1 | Layer 2 | Layer 3 | Layer 4 | Layer 5 |
|---|---|---|---|---|---|
| Docs-only / OS infrastructure (like 2.7, 2.8, 2.9) | — | — | — | — | required |
| `src/` engine module | required | recommended if app-visible | — | — | required |
| New product / catalog logic | required | recommended | — | — | required |
| New persistence logic | required | required | required | — | required |
| New UI surface in `index.html` | recommended | required | required if real-file path | — | required |
| Pagination / rendering / preview | required | required | — | required | required |
| Real-file import path | required | required | required | — | required |
| Bug fix that's behavior-visible | recommended | required | required if real-file | — | required |

"Required" means: run it before commit, or document why it was skipped.

---

## Future packages — testing planning

When Package 5A (Message Book Proof Approval State Foundation) starts, plan tests **from the beginning**, not after the code is written.

Specific layers Package 5A must cover:

- **Proof approval state transitions** — Layer 1 (Node unit tests). State machine: not-yet-reviewed → in-review → approved → revoked → (re-)approved; with allowed and forbidden transitions.
- **Serialization / restore** of proof state across save/load — Layer 1 + Layer 2 + Layer 3.
- **Product eligibility coupling** — Layer 1 (the proof state must not silently affect which products are eligible).
- **No checkout / PDF coupling** — Layer 1 must explicitly assert that proof state remains decoupled from checkout flow (which doesn't exist yet).

Tests planned and named **before** Package 5A coding starts go in the Package 5A spec, not in this doc.

---

## Pre-commit baseline

Before any commit instruction is acted on, the agent must verify:

1. All 10 Node unit suites green (1466 tests).
2. If `index.html` or `src/` changed: E2E seeded green (41 tests).
3. If real-file paths changed: E2E real-files green (64 total).
4. If Message Book rendering changed: relevant capture harness scenario green.
5. Manual QA recorded if UI behavior changed (`docs/qa/manual-qa-template.md`).
6. Package verification recorded (`docs/qa/package-verification-template.md`).

If any of those is skipped, the agent must say so explicitly with the reason. Silent skipping is not acceptable.

---

## What this strategy does NOT do

- It does not cover visual regression. That's planned (Package 3D scope, not authorized).
- It does not cover browser smoke tests outside the E2E harness.
- It does not cover load/performance testing.
- It does not cover security testing.
- It does not run on CI (no CI workflows are committed). Tests run locally before commit.

These gaps are documented and tracked — not hidden.

---

## Backlog / known gaps

| Item | Reason it's a gap | Where tracked |
|---|---|---|
| Visual regression for Message Book | Package 3D scope — not authorized | `docs/ops/backlog-roadmap.md` |
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
- `docs/qa/e2e-regression-harness.md` — harness operating manual
- `docs/dev/auto-management-protocol.md` — how testing fits the broader OS
