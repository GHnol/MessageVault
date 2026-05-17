# Risk Register — KeepMees / MessageVault

**Last updated:** 2026-05-17
**Updated by:** Claude Code (Package 4E status sync)
**Status:** Active

---

## Risk format

Each risk has: **ID**, **Description**, **Likelihood** (L/M/H), **Impact** (L/M/H), **Status** (open/mitigated/closed), **Mitigation**.

---

## Technical risks

### RISK-T-01 — Pagination regression from constant change

**Likelihood:** M | **Impact:** H | **Status:** Mitigated

**Description:** A change to `BOOK_PAGE_LINES` or related constants silently changes which page messages land on, corrupting saved sessions and changing the published book layout without the user knowing.

**Mitigation:** Scope guard in `CLAUDE.md` and `docs/ops/decision-register.md` (DEC-O-02) explicitly locks these constants. `BOOK_PAGINATION_VERSION` bump is required for any such change. Tests verify pagination output against known inputs.

---

### RISK-T-02 — index.html becomes unmaintainable before framework migration

**Likelihood:** M | **Impact:** M | **Status:** Open

**Description:** As `index.html` grows, it becomes harder to navigate, edit, and review. A single large file increases the risk of accidental changes to unrelated sections. The larger KeepMees gets, the more expensive a late architecture correction becomes.

**Mitigation:** KMEngine modular extraction is the approved near-term path — progressively moving testable logic into `src/` modules. Package 3A added 3 new modules to `src/state/` without growing `index.html` unmaintainably. Package 3B added a Playwright-based E2E harness that catches behavioral regressions automatically, reducing the cost of future changes. Package 3C extended the harness to cover real file import, actual browser downloads, actual upload/restore, and capture harness integration — 51 tests total. Package 2.6 added the Operator Inbox automation layer (processor + tests) with no app code changes. Package 2.6.1 patched Operator Inbox extraction patterns. Package 4A added the ProductRenderSpec foundation (render spec registry, resolver, 341 tests) with no app code changes. Package 4B added the PrototypePreviewRegistry foundation (preview entry registry, resolver, 215 tests) with no app code changes. Package 4C added the ProductExperienceReadiness foundation (combined readiness resolver across all 4 product layers, 337 tests) with no app code changes. Package 4D wired all Package 4 modules into index.html and added the ProductExperienceConsumer bridge layer (35 tests) — 1466 Node tests total. Package 4E added the product-format availability surface to the Your Keepsakes view via `buildFormatAvailability()` — 41 seeded E2E / 64 real-files E2E, no new Node unit tests required. Framework / build-system migration is a tracked future decision (deferred, not rejected) — see `docs/architecture/adr-001-app-architecture-path.md`. Re-evaluate when render/proof architecture stabilizes or when UI state, persistence, proofing, and render specs become too complex for the current shell.

---

### RISK-T-03 — SQL.js breaks on a future macOS / iOS chat.db schema change

**Likelihood:** L | **Impact:** H | **Status:** Open

**Description:** Apple may change the schema of `chat.db` in a future macOS or iOS release, breaking the iMessage adapter without warning.

**Mitigation:** The iMessage adapter is isolated in `src/adapters/imessage-chatdb-adapter.js`. A schema change requires an adapter update only, not an index.html change. Monitoring for Apple platform changes is the operator's responsibility.

---

### RISK-T-04 — NormalizedMemory ID collisions

**Likelihood:** L | **Impact:** M | **Status:** Mitigated

**Description:** Two messages with identical timestamp, sender, and text prefix could generate the same memory ID, breaking deduplication and group membership.

**Mitigation:** Memory ID generation incorporates `importIndex` (position in import batch), which distinguishes messages that are otherwise identical. See `src/core/normalized-memory.js:generateMemoryId`.

---

### RISK-T-05 — Server-side PDF pipeline is more complex than anticipated

**Likelihood:** H | **Impact:** M | **Status:** Open

**Description:** Implementing production-quality PDF/X-4 output (font embedding, bleed/trim, color management) is non-trivial and may require significant server infrastructure.

**Mitigation:** Explicitly deferred until vendor is confirmed. `captureBookRenderSpec` is in place to define the input contract. No work starts until the gate is cleared.

---

## Product / market risks

### RISK-P-01 — Vendor not confirmed; commerce blocked indefinitely

**Likelihood:** M | **Impact:** H | **Status:** Open

**Description:** The `isCoverUnblocked()` gate is not yet met. Without a confirmed vendor, no checkout flow, PDF generation, or cover design work can proceed.

**Mitigation:** This is a business dependency, not a technical one. The software stack is otherwise ready to extend. No action required on the engineering side until vendor is confirmed.

---

### RISK-P-02 — Multi-volume splitting estimates are wrong at actual vendor limits

**Likelihood:** M | **Impact:** M | **Status:** Open

**Description:** Current multi-volume split logic is estimative. The actual vendor's page limits per book may differ from the estimates in the paginator.

**Mitigation:** Multi-volume split points will be re-evaluated against final vendor specs before any order flow is implemented. The paginator is not hard-coded to a specific vendor limit; it uses a configurable threshold.

---

## Operational risks

### RISK-P-03 — Designer budget gap delays Figma execution

**Likelihood:** H | **Impact:** H | **Status:** Open

**Description:** The top designer candidate (Alexander Weaver) quoted £2,800 total (Stage 2 + Stage 3) against a posted budget of $1,200. Current status: COMMERCIAL HOLD. Secondary candidate (Christel Mulongoy) on PASSIVE HOLD. No designer is currently confirmed. Without a confirmed Figma executor, the Figma master (`KeepMees Message Book, Figma Build Package v1.1`) cannot be built, which blocks Design Viability Checkpoint A and downstream vendor-export work.

**Mitigation:** Coordinator must either re-authorize a higher budget for Alexander Weaver, continue passive outreach for candidates within budget, or authorize self-execution of Figma briefs against the detailed brief specs in `docs/ops/design-readiness-register.md`. No design execution can begin until this is resolved.

---

### RISK-O-01 — AI session context loss corrupts work-in-progress

**Likelihood:** M | **Impact:** M | **Status:** Mitigated

**Description:** AI development sessions have context limits. A session that loses important context mid-implementation may produce work that contradicts locked decisions.

**Mitigation:** The Package 2.5A/B documentation system is the primary mitigation. Durable repo-based source-of-truth replaces chat scrolling. See also `docs/ops/stream-sync-protocol.md`.

---

### RISK-O-02 — Scope creep into gated areas

**Likelihood:** M | **Impact:** H | **Status:** Mitigated

**Description:** An AI assistant may make changes to checkout, PDF, visual design, or scope-guarded constants without explicit authorization.

**Mitigation:** `CLAUDE.md` scope guard is the primary control. `docs/ops/decision-register.md` documents the rationale. Package-scoped instructions from the Coordinator are the authorization mechanism.
