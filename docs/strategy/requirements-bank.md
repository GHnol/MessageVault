# Requirements Bank — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** Active

---

## How to read this document

Each requirement has a status: **locked** (no change without product authority), **active** (governing current packages), **deferred** (not in scope for current packages), or **open** (decision pending).

---

## Functional requirements

### Message ingestion

| ID | Requirement | Status |
|---|---|---|
| F-ING-01 | App must accept iMessage/chat.db import via SQL.js (in-browser) | locked |
| F-ING-02 | App must accept pipe-delimited .txt export format | locked |
| F-ING-03 | App must accept manual message entry by the user | locked |
| F-ING-04 | All imported messages must be lifted into NormalizedMemory shape | active |
| F-ING-05 | Stable deterministic memory IDs must be generated per message | locked |
| F-ING-06 | Reactions must be inferred from text patterns in .txt format | locked |

### Message selection and grouping

| ID | Requirement | Status |
|---|---|---|
| F-GRP-01 | Users must be able to select individual messages | locked |
| F-GRP-02 | Users must be able to create named keepsake groups | locked |
| F-GRP-03 | Staging group (`group-staging`) holds unsorted selections | locked |
| F-GRP-04 | Groups must support bulk message moves | locked |
| F-GRP-05 | Groups must track `chosenTypeId` and `lastComposedAt` | active |

### Message Book composition

| ID | Requirement | Status |
|---|---|---|
| F-MB-01 | Messages must be paginatable into 44-line pages | locked |
| F-MB-02 | Pages must be enriched with production metadata before rendering | locked |
| F-MB-03 | Section headers must show sender name and optional timestamp | locked |
| F-MB-04 | Featured sections must be supported (up to `BOOK_FEATURED_HEADER_LINES`) | locked |
| F-MB-05 | Multi-volume splitting must be estimated from page count | locked |
| F-MB-06 | Parity padding must be system-managed, not customer-controlled | locked |
| F-MB-07 | Title, dedication, and section names must enforce character limits | locked |
| F-MB-08 | Editorial field validation must block update while over-limit | locked |

### Product eligibility

| ID | Requirement | Status |
|---|---|---|
| F-ELG-01 | Every product in the catalog must have an eligibility evaluator | active |
| F-ELG-02 | Eligibility results must carry: eligible, score, blockers, warnings, suggestions, readinessNotes | active |
| F-ELG-03 | Legacy standalone types (quote-card, framed-print, mini-story, conversation-page) must remain evaluable via the bridge | active |

### Product catalog

| ID | Requirement | Status |
|---|---|---|
| F-CAT-01 | Catalog must enumerate all 6 products at all times | active |
| F-CAT-02 | Each product must carry software, commerce, manufacturing, and public-claim status | active |
| F-CAT-03 | Flagship product must be identifiable via `flagship()` | active |

---

## Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| NF-01 | App must run entirely in-browser with no required server at launch | locked |
| NF-02 | All message data stays on the user's device (no upload at import time) | locked |
| NF-03 | SQL.js must be the only dependency for chat.db parsing | locked |
| NF-04 | PDF generation must be server-side when implemented | locked |
| NF-05 | All core logic must be testable via Node.js `.mjs` test files | active |
| NF-06 | Pagination output must be deterministic for the same input | locked |
| NF-07 | `BOOK_PAGINATION_VERSION` must be bumped on any change to page assignment logic | locked |

---

## Out-of-scope requirements (deferred / hard blocked)

| ID | Requirement | Status |
|---|---|---|
| D-01 | Checkout and order flow | deferred |
| D-02 | PDF generation / print-ready file export | deferred |
| D-03 | Vendor / manufacturer API integration | deferred |
| D-04 | Cover design tooling | deferred |
| D-05 | Proof approval UX beyond in-app preview | deferred |
| D-06a | Local/session persistence (save-resume across sessions) | near-term — NOT deferred; see architecture-roadmap.md Inflection 2A |
| D-06b | Cloud account / cross-device persistence | deferred |
| D-07 | WhatsApp, Android SMS, Instagram DM, Facebook, Telegram adapters | deferred (stubs exist) |
| D-08 | OCR image import | deferred |
| D-09 | Audio / video transcript import | deferred |
| D-10 | Visual redesign or new design system | deferred |
