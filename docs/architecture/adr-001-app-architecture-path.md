# ADR-001 — Application Architecture Path

**Date:** 2026-05-09
**Status:** ACTIVE INTERIM DECISION
**Deciders:** KeepMees product authority

> **Interim notice:** index.html remains the current runtime shell only as an interim bridge. The approved near-term path is modular plain JS extraction into `src/`. Framework/build-system migration remains a tracked future decision — it is deferred, not rejected. This ADR governs the current phase only.

---

## Context

KeepMees needed an architecture that could:
- Run in a consumer browser with no install
- Operate entirely offline at import time (message data never leaves the device)
- Support incremental delivery (ship features package by package without a build system)
- Be maintained and extended by a single operator working with an AI coding assistant

---

## Decision

### Single-file HTML application

`index.html` is the entire application. All UI, CSS, and in-app logic live here. This is the authoritative runtime file.

**Why:** eliminates build toolchain complexity, enables direct browser testing without a server, keeps the entire user-facing surface in one reviewable file.

### KMEngine modular namespace (external `src/` modules)

Engine logic that can be unit-tested or reused is extracted to `src/` modules, each exporting into the `window.KMEngine` namespace via IIFE. Loaded into `index.html` via `<script type="module">` tags.

```
index.html
    ↳ <script type="module" src="src/...">
          → window.KMEngine.ProductCatalog
          → window.KMEngine.NormalizedMemory
          → window.KMEngine.KeepsakeGroup
          ...
```

**Why:** allows Node.js `.mjs` test files to import modules directly without a browser, while index.html still loads the same source files. No transpilation or bundling required.

### In-browser SQL.js for iMessage

The iMessage chat.db (SQLite) is parsed entirely in-browser using SQL.js (WASM). No message data is uploaded to any server during import.

**Why:** privacy guarantee. Users can import sensitive conversations without trusting a third-party server.

### Server-side PDF generation (future, deferred)

When print-ready PDF output is implemented, it must be generated server-side. In-browser PDF generation (jsPDF, etc.) is not acceptable for a print-quality product.

**Why:** print-quality PDF/X-4-friendly files require font embedding, precise color management, and bleed/trim control that in-browser PDF libraries cannot reliably provide at production quality.

---

## Consequences

### Accepted constraints

- All state lives in browser memory for the current session. Cloud account / cross-device persistence is deferred. Local/session persistence (IndexedDB, export/import session files, or equivalent privacy-preserving storage) is a near-term foundation requirement — users must not lose progress across sessions that take days to construct.
- `index.html` will grow, but this is an interim condition. KMEngine modular extraction progressively moves testable logic out. The build system / framework decision remains open and tracked.
- The `src/` modules use ES module syntax for testability but are wrapped in IIFEs to avoid polluting global scope when loaded in-browser.

### Explicitly deferred (tracked future decisions — not rejected)

- React / Vue / Angular or any component framework — re-evaluate when render/proof architecture stabilizes or when UI state, product previews, persistence, proofing, and render specs become too complex for the current shell
- Webpack / Vite / Rollup build system — re-evaluate when index.html maintenance burden exceeds threshold or team grows
- Service workers

### Hard rejections (do not revisit without new information)

- In-browser PDF generation for print output
- Any import that uploads message content to a third-party server

---

## Future revision trigger

This ADR should be revisited when any of the following occur:
- `index.html` exceeds a maintainability threshold (subjective, but ~8,000+ lines with more planned)
- A server-side component is introduced for PDF generation
- A user account / persistence layer is added
- The team grows beyond a single operator model
