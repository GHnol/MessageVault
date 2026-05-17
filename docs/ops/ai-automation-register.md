# AI and Automation Register — KeepMees / MessageVault

**Last updated:** 2026-05-16
**Updated by:** Claude Code (Package 4B status sync)
**Status:** LAYER 1 (source-backed); LAYER 2 advisory appendix at bottom

---

## Purpose

Track AI and automation capabilities, their current status, and their relationship to the KeepMees product roadmap. This includes AI features within the product (for users), AI tooling used in development, and the AI-assisted operating system (Operator Mode automation).

---

## AI in development (current)

### Claude Code (primary executor)

**Role:** Primary implementation executor. Works within a Coordinator + Operator + Executor relay model.
**Model:** Claude Sonnet 4.6 (current session)
**Scope:** Package-scoped implementation work. No work outside an authorized package.
**Protocol:** See `docs/ops/stream-sync-protocol.md`.
**Constraints:**
- Scope guard in `CLAUDE.md` explicitly limits what the assistant can touch
- Memory system at `~/.claude/projects/.../memory/` provides cross-session context
- Package 2.5A/2.5B docs are the authoritative cross-session source of truth (supplements memory)
- Does not commit or push without explicit Coordinator instruction

### ChatGPT (Coordinator + product/design/vendor streams)

**Role:** Coordinator intelligence layer and multi-stream product reasoning.
**Streams active:** Coordinator, Product, Design, Vendor/Production, Packaging/Gifting, Competitors, AI Mastery
**Authority:** Coordinator stream (ChatGPT) is the product decision authority. All locked decisions must be Coordinator-approved.

### NotebookLM (research/synthesis layer)

**Status:** Recommended but not yet confirmed as active tool
**Source:** `_source-intake/keepmees-consolidation-2026-05-09/00 AI Mastery Intake Main Chat.md`
**Proposed use:**
- KeepMees Core Strategy notebook (upload competitor teardowns, vendor docs, product philosophy, strategy)
- Competitor Intelligence notebook (Zapptales, MyForeverBooks teardowns, analytics)
- Manufacturing + Vendor Research notebook
- Product Design System notebook
- Audio Overview generation for passive learning while walking/commuting
**Status:** NEEDS COORDINATOR DECISION — whether NotebookLM is formally adopted as a project tool

---

## AI Mastery role clarification

**AI Mastery is NOT the Coordinator.** These are separate roles:

- **Coordinator (ChatGPT, Chat 01):** Owns KeepMees project truth, roadmap, execution routing, stream alignment, and all locked product/architecture decisions. AI Mastery outputs must flow through the Coordinator and be converted into durable KeepMees operating artifacts by the Coordinator.
- **AI Mastery (workflow/automation stream):** Creates workflow architecture, automation logic, prompt templates, schemas, audits, and routing systems. Outputs proposals; does not make product decisions.

AI Mastery outputs that affect KeepMees must be Coordinator-reviewed and Coordinator-approved before being treated as durable project truth.

---

## AI Mastery Automation Stack

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/AI Mastery Automation Build Pack v1.md`

### Stack status per layer

| Layer | Tool | Role | Status |
|---|---|---|---|
| Source of truth | Markdown + Git (this repo) | Durable records | **APPROVED — active now** |
| Execution board | GitHub Projects | Tracking and status | Recommended — NEEDS SETUP DECISION |
| Reasoning agents | ChatGPT chats (multiple) | Strategy and coordination | **ACTIVE** |
| Implementation | Claude Code | Execution | **ACTIVE** |
| Research library | NotebookLM | Source-grounded synthesis | Recommended — NEEDS ADOPTION DECISION |
| Routing automation | n8n / Make / Zapier | Future automation | Later — do NOT build yet |

**Principle:** Stop making your brain the database. Stop making chat scrolling the source of truth. Stop making manual copy/paste the operating model.

### What gets automated now (via Claude/repo docs)

| Automation candidate | Method | Status |
|---|---|---|
| Repo source-of-truth document creation | Claude Code | ACTIVE (Package 2.5A) |
| Schema creation | Claude Code | COMPLETE (Package 2.5B — bb23e8b) |
| Template creation | Claude Code | COMPLETE (Package 2.5B — bb23e8b) |
| Operator Mode protocol documentation | Claude Code | COMPLETE (Package 2.5B — bb23e8b) |
| Package closeout packets | Claude Code | ACTIVE (used in Packages 1, 2, 2.5A, 2.5B) |
| Stream update packet formatting | Claude Code | READY — template at docs/automation/templates/ |
| Coordinator sync packet formatting | Claude Code | READY — template at docs/automation/templates/ |
| Claude/Codex handoff packet formatting | Claude Code | READY — template at docs/automation/templates/ |
| Artifact index entries | Claude Code | ACTIVE |
| Decision register entries | Claude Code | ACTIVE |
| Requirements/feature bank entries | Claude Code | READY — template at docs/automation/templates/ |

### What gets semi-automated (one paste to Claude)

| Task | Notes |
|---|---|
| Take a Coordinator response → update docs | This session's Task C |
| Take Development handoff → create package closeout | Template exists |
| Take Product response → extract product decisions | PROPOSED |
| Take AI Mastery response → add automation register entries | PROPOSED |
| Take competitor report → update competitor intelligence register | Done this session |
| Create GitHub issue text from backlog item | PROPOSED |
| Create GitHub Project card instructions | PROPOSED |

### What requires manual approval (never auto)

| Item |
|---|
| Next package approval |
| Architecture pivot |
| React/framework decision |
| Vendor commitment |
| Public platform claim |
| Public product claim |
| Paid designer/hiring action |
| Manufacturing readiness declaration |
| Privacy language final approval |
| Manual QA pass/fail |
| Merge to main |
| Roadmap change that affects scope |

### What should never be fully automated

| Item |
|---|
| Product taste judgment |
| Emotional quality judgment |
| Customer-facing promise |
| Privacy posture decisions |
| Final proof acceptance rules |
| Manufacturing launch approval |
| Paid contracts |
| Brand positioning lock |
| Major scope expansion |

---

## GitHub Project: KeepMees Command Center (proposed)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/AI Mastery Automation Build Pack v1.md`
**Status:** PROPOSED — not yet created

**Project name:** KeepMees Command Center

**Proposed views:**
1. Command Board
2. Development Packages
3. Roadmap Timeline
4. Decisions Needed
5. Blocked / Gated
6. Manual QA
7. Stream Sync

**Proposed fields:** Title, Type, Stream, Package, Phase, Status, Priority, Owner/Agent, Start Date, Target Date, Duration Estimate, Dependency, Success Criteria, Quality Gate, Scope Impact, Related Decision, Related Artifact, Related Branch, Related Commit, Manual QA Status, Coordinator Sync Status

**Proposed statuses:** Inbox, Needs Coordinator Triage, Needs Product Decision, Needs Architecture Decision, Ready for Development, In Development, Needs Development Review, Needs Manual QA, Ready to Commit, Merged/Done, Blocked, Gated/Deferred, Rejected

**Status:** NEEDS COORDINATOR DECISION — whether GitHub Projects is the approved execution board

---

## Schema and template inventory (docs/automation/ — Package 2.5B complete)

**Status:** COMPLETE — committed in Package 2.5B (`bb23e8b`, merged `aa6402c`)
**Validation:** All 12 schemas pass JSON.parse validation (JSON Schema Draft-07)

JSON schemas in `docs/automation/schemas/` (12):
- `master-project-truth.schema.json`
- `decision.schema.json`
- `requirement.schema.json`
- `feature.schema.json`
- `backlog-item.schema.json`
- `roadmap-item.schema.json`
- `stream-update-packet.schema.json`
- `routing-packet.schema.json`
- `coordinator-sync-packet.schema.json`
- `ai-handoff-packet.schema.json`
- `automation-register-item.schema.json`
- `artifact-index-item.schema.json`

Templates in `docs/automation/templates/` (10):
- `stream-update-packet.md`
- `routing-packet.md`
- `coordinator-sync-packet.md`
- `package-closeout-packet.md`
- `development-review-packet.md`
- `manual-qa-result.md`
- `decision-record.md`
- `backlog-item.md`
- `roadmap-item.md`
- `ai-automation-item.md`

Operator Mode protocols in `docs/automation/operator-mode/` (5):
- `README.md`
- `update-project-records-protocol.md`
- `package-closeout-protocol.md`
- `stream-routing-protocol.md`
- `claude-codex-relay-protocol.md`

**Note:** These artifacts enable the automation layer but are not the automation itself. Actual external routing automation via n8n / Make / Zapier remains a later phase.

---

## n8n automation (later — do not build yet)

First planned workflow: Chat Export → Routing Packet → Proposed Repo Doc Updates (not auto-merge)

Trigger: New file added to Google Drive folder or GitHub repo folder
Steps: OpenAI node (extract routing packet JSON) → Validation node → Switch node (route by target) → GitHub node (create issue or PR) → Manual approval node (decisions requiring approval)

---

## AI capabilities in the product (planned / deferred)

### DEF — Message curation / recommendation

**Status:** Deferred
**Description:** Use AI to suggest which messages from a conversation are most keepsake-worthy.
**Privacy:** Client-side model preferred; server-side requires explicit opt-in.
**Activate when:** curation UX is identified as top user friction point.

### DEF — Section title generation

**Status:** Deferred
**Description:** AI-suggested section titles based on messages in a section.
**Considerations:** Max 45 characters — well within model capacity. Could run client-side.
**Activate when:** editorial friction data justifies it.

### DEF — Dedication / inscription assistance

**Status:** Deferred
**Description:** AI-assisted writing for dedication page (suggestions, not auto-populated).
**Activate when:** editorial friction data justifies it.

### DEF — OCR-based message import (screenshot)

**Status:** Deferred (gated on server pipeline)
**Description:** Extract messages from conversation screenshots via OCR.
**Activate when:** server infrastructure established.

### DEF — Audio / video transcript import

**Status:** Deferred (gated on server pipeline)
**Description:** Transcribe voice messages or video content into text.
**Activate when:** server infrastructure established.

---

## Test automation (current)

All `src/tests/*.mjs` files are runnable via `node`. No build step.

| Suite | Tests | Status |
|---|---|---|
| `km-engine-tests.mjs` | ~96 (Package 1 baseline) | Must remain green |
| `keepsake-group-tests.mjs` | 43 | Must remain green |
| `product-catalog-tests.mjs` | 127 | Must remain green |
| `product-eligibility-tests.mjs` | 76 | Must remain green |
| `project-persistence-tests.mjs` | 111 | Must remain green — Package 3A |
| `operator-inbox-processor-tests.mjs` | 85 | Must remain green — Package 2.6 / 2.6.1 |
| `product-render-spec-tests.mjs` | 341 | Must remain green — Package 4A |
| `prototype-preview-registry-tests.mjs` | 215 | Must remain green — Package 4B |
| `scripts/e2e-regression-harness.mjs` | 29 seeded (phases 1–10) | Must remain green — Package 3B (Playwright, requires `scripts/node_modules`) |
| `scripts/e2e-regression-harness.mjs --real-files` | 52 total (51 always + 1 conditional chat.db) | Must remain green before real-file path changes — Package 3C |

Required before any future package commit: all 8 Node suites + E2E seeded harness pass. Node total: **1094 tests**. E2E seeded: **29 tests**. E2E real-files: **52 tests** (run with `--real-files` when real-file paths change).

---

## Privacy principles for AI features

1. User message content is private by default. Any feature that sends message content to a server must be explicit opt-in.
2. AI suggestions must be presented as suggestions, not automated actions.
3. AI-generated content in the book (titles, dedications) must be clearly identified as AI-assisted if the user chooses to use it.
4. Client-side AI is preferred over server-side for privacy-sensitive content.
5. KeepMees should never adopt ad-tech tracking defaults that conflict with private-message trust.

---

## AI Mastery hub system (proposed — NEEDS COORDINATOR DECISION)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/00 AI Mastery Intake Main Chat.md`

Six knowledge hubs for the AI Mastery operating model. System of record should be Markdown/Git (not chats). ChatGPT = conversation layer. NotebookLM = research/synthesis layer. n8n = future automation layer.

### HUB 01 — Workflow Blueprints
**Purpose:** Store, refine, maintain reusable workflow blueprints created through AI Mastery system.
**Maturity levels:** Draft → Active v1 → Tested → Optimized → Automation Candidate → Archived

### HUB 02 — Tool Research
**Purpose:** Structured, current, practical library of tools that optimize life, work, learning, development, automation, research.
**Status categories:** Adopt now / Test soon / Watch later / Use only for niche cases / Avoid for now / Replaced by better option

### HUB 03 — Agent Prompts
**Purpose:** Store, refine, version, organize reusable prompts for AI workflows.
**Quality standard:** Complete, context-rich, role-specific, output-specific, operational, clear on constraints, clear on what not to do, reusable, versioned.
**Prompt types:** Starter / Handoff / Analysis / Research / Coding / Review / QA / Routing / Export / Automation / Business evaluation / Learning

### HUB 04 — Automation Builds
**Purpose:** Store, design, prioritize, refine automation builds.
**Maturity levels:** Idea → Candidate → Designed → Manual v1 → Prototype → Active → Optimized → Parked → Rejected → Deprecated
**Prioritization rule:** Prioritize automations that are repeated often, time-consuming, annoying, high-value, low-risk, easy to test, connected to KeepMees / development / AI Mastery.

### HUB 05 — Case Studies
**Purpose:** Turn real workflows, problems, experiments, AI-assisted improvements into reusable case studies.
**Maturity levels:** Draft → Captured → Analyzed → Reusable → Business-Relevant → Archived

### HUB 06 — Business Ideas
**Purpose:** Capture, evaluate, refine, prioritize AI-native business ideas.
**Maturity levels:** Spark → Captured → Roughly Evaluated → Promising → Validation Candidate → Build Candidate → Parked → Rejected
**Scoring (1–5 each):** Pain severity, Buyer clarity, AI leverage, Speed to MVP, Founder fit, Revenue potential, Differentiation

---

## AI Mastery routing output format

Every major problem should generate this routing output for the hub system:

```
AI MASTERY ROUTING OUTPUT

Update HUB 01 Workflow Blueprints: [finished workflow summary]
Update HUB 02 Tool Research: [tools mentioned, current recommendation, why]
Update HUB 03 Agent Prompts: [reusable prompt]
Update HUB 04 Automation Builds: [automation backlog item]
Update HUB 05 Case Studies: [lesson from this real workflow]
Update HUB 06 Business Ideas: [possible monetizable idea]
Dedicated chat to create: [name + first message]
```

---

## Competitor intelligence automation (from AI Mastery Main Chat)

**Current process (manual):** For each competitor: create new chat → visit pages → take screenshots → copy text → write notes → upload to teardown agent → agent updates dossier → export report → save chat → move to next competitor.

**What should stay human:** Product-owner notes and emotional reads ("feels scrapbook-like", "feels trustworthy"), strategic calls, final "KeepMees should do this" decisions.

**What can be automated (future):**

| Work | Current | Better |
|---|---|---|
| Website page discovery | Manual browsing | AI-assisted URL inventory |
| Screenshots | Manual per page | Playwright full-page screenshots |
| Page text | Copy/paste | Firecrawl or Apify |
| File naming | Manual | Auto folder/filename convention |
| Report export | ChatGPT | + machine-readable source index |
| Final thesis | Main analysis agent | + NotebookLM cross-document synthesis |

**Future automation tool stack:**
- **Playwright** — full-page screenshots, desktop/mobile capture, repeatable browser flows
- **Firecrawl or Apify** — crawling competitor sites, extracting clean Markdown for LLMs
- **n8n** — URL submitted → crawler → screenshots saved → page text extracted → AI card generated → files to Drive → report task created
- **NotebookLM** — completed reports, chat exports, PDFs, cross-document synthesis, audio summaries

---

## GitHub Project: KeepMees Command Center (proposed)

**Status:** PROPOSED — NEEDS COORDINATOR DECISION on whether GitHub Projects is the approved execution board

**Project name:** KeepMees Command Center

**Recommended board columns:**
Inbox → Needs Coordinator Triage → Ready for Product Decision → Ready for Development → In Development → Needs AI Coding Handoff → Needs Manual QA → Blocked → Ready to Commit → Committed / Done → Deferred / Backlog

**Recommended task fields:**
Title, Stream, Phase, Sprint, Priority, Status, Start date, Target date, Estimate, Confidence, Dependencies, Success criteria, Scope impact, Quality gate, Related chat, Related prompt, Related file/mockup, Related branch/commit, Coordinator sync status, Manual QA status

---

## LAYER 2 — Claude Advisory, Not Yet Coordinator Approved

### Advisory: AI Mastery implementation sequence status

1. Capture Package 2 final closeout from Claude ✓ (done)
2. Send Development the Package 2 closeout review request ✓ (done)
3. Run Package 2.5A in Claude Code — source-of-truth docs only ✓ (complete — `d1c5a44` / `d69dc2c`)
4. Coordinator reviews Package 2.5A and authorizes commit ✓ (done)
5. Commit and merge Package 2.5A ✓ (done)
6. Coordinator authorizes Package 2.5B ✓ (done)
7. Run Package 2.5B in Claude Code — automation artifacts ✓ (complete — `bb23e8b` / `aa6402c`)
8. Coordinator evaluates and authorizes Package 3A ✓ (done)
9. Run Package 3A in Claude Code — local project session save/load ✓ (complete — `8dcc959` / `b40fa2b`)
10. Execute Package 3B — Automated E2E Regression Harness Foundation ✓ (complete — `0ce973a` / `40b4bba`)
11. Execute Package 3C — Real File Import, Download, and Full-Path E2E Coverage ✓ (complete — `f8379d0` / `904cf51`)
12. Execute Package 2.6 — Operator Inbox + Stream Update Processor ✓ (complete — `23b46b7` / `e7d635d`)
13. Execute Package 2.6.1 — Operator Inbox Extraction Polish ✓ (complete — `841d28a` / `75a2378`)
14. Execute Package 4A — ProductRenderSpec Foundation ✓ (complete — `f08a7dd` / `1058dc1`)
15. Execute Package 4B — Prototype Preview Registry Foundation ✓ (complete — `eca2329` / `3f939d0`)
16. **Next: Coordinator evaluates and authorizes next package** ← current position

### Advisory: What Package 2.5B does and does not deliver

**Delivered:** Schemas, templates, and Operator Mode protocols. These are static artifacts — the grammar and structure for how automation will work.

**Not delivered (later phase):** Actual running automations. n8n / Make / Zapier workflows, GitHub Projects board configuration, and NotebookLM setup remain outside the repo and are pending Coordinator decisions.

**GitHub Projects and NotebookLM remain pending Coordinator decisions** — whether to adopt them, and if so when. Do not treat them as active stack components until explicitly confirmed.

---

### Advisory: Package 4B — Prototype Preview Registry Foundation (2026-05-16)

**Status:** COMPLETE — merged to main (`eca2329` / `3f939d0`); no app behavior changed; index.html not touched

**What was added:**
- `src/products/prototype-preview-registry.js` — `PREVIEW_STATUS` constant (READY, STUB, NOT_APPLICABLE); `makePreviewEntry` factory; 6 preview entries for render planning targets; `KMEngine.PrototypePreviewRegistry` with `all()`, `get()`, `getByPreviewTypeId()`, `architectureKnown()`, `prototypePreviewSupported()`
- `src/products/prototype-preview-resolver.js` — `KMEngine.PrototypePreviewResolver` with `resolve(productTypeId, group?)` returning previewSupported/blockers/warnings; combines PrototypePreviewRegistry + ProductRenderSpec
- `src/tests/prototype-preview-registry-tests.mjs` — 215 assertions across 13 suites
- `docs/architecture/architecture-roadmap.md` — PrototypePreviewRegistry layer added to module tree

**Key gate:** `prototypePreviewEnabled: true` for Message Book only. All 5 non-book render planning targets have `unsupportedReason: 'renderer-not-implemented'` and remain `prototypePreviewEnabled: false`. Commerce, manufacturing, and public-claim readiness remain gated for all non-Message Book formats.

**What this does NOT deliver:** actual preview UI, physical product renderers, checkout/payment, PDF generation, vendor exports, visual regression work.

**1094 Node tests passing, 0 failures.**

---

### Advisory: Package 4A — ProductRenderSpec Foundation (2026-05-15)

**Status:** COMPLETE — merged to main (`f08a7dd` / `1058dc1`); no app behavior changed; index.html not touched

**What was added:**
- `src/products/product-render-spec.js` — 5 render constants; `makeRenderSpec` factory; 10 specs; `KMEngine.ProductRenderSpecs` with `all()`, `get()`, `renderPlanningTargets()`, `catalogAligned()`
- `src/products/product-render-spec-resolver.js` — `KMEngine.ProductRenderSpecResolver` with `resolve(productTypeId, group)` returning blockers/warnings/eligible
- `src/tests/product-render-spec-tests.mjs` — 341 assertions; Suite 11 verifies render planning targets do not imply commerce/manufacturing/public-claim readiness
- `docs/architecture/architecture-roadmap.md` — ProductRenderSpec layer added to module tree

**Key design decision:** `isRenderPlanningTarget` field name makes explicit that render architecture scope does not imply commerce, manufacturing, fulfillment, or public claim readiness.

**What this does NOT deliver:** product preview UI, physical product renderers, checkout/payment, PDF generation, vendor exports, visual regression work.

**879 Node tests passing, 0 failures.**

---

### Advisory: Package 2.6 — Operator Inbox + Stream Update Processor (2026-05-15)

**Status:** COMPLETE — merged to main (`23b46b7` / `e7d635d`); local file-based only; no external API calls

**What was added:**
- `operator-inbox/` — folder for pasting stream responses (raw files gitignored)
- `operator-outbox/` — folder for generated routing packets (all outputs gitignored)
- `scripts/process-operator-inbox.mjs` — processor script: reads one inbox .md file and generates 4 output files
- `src/tests/operator-inbox-processor-tests.mjs` — 40+ tests covering all extraction functions and processFile
- `scripts/fixtures/operator-inbox/development-closeout-sample.md` — safe fake Development fixture
- `scripts/fixtures/operator-inbox/product-response-sample.md` — safe fake Product fixture
- `docs/automation/operator-mode/operator-inbox-protocol.md` — full protocol documentation

**Processor outputs** (per input file):
- `*.routing.md` — human-readable routing packet
- `*.routing.json` — machine-readable (conforms to `docs/automation/schemas/routing-packet.schema.json`)
- `*.coordinator-summary.md` — one-page Coordinator review summary
- `*.suggested-prompts.md` — copy-paste prompts for routing

**What this does NOT do:** auto-post to ChatGPT, modify repo docs, commit anything, connect to external services. All output is for human review only.

**Future n8n path:** The processor is subprocess-friendly. A future n8n Execute Command node can wrap it and route the `.routing.json` output automatically.

---

### Advisory: Context Continuity Guard Patch (2026-05-15)

**Status:** Implemented — docs only, no app code changes

**What was added:**
- `docs/automation/operator-mode/context-continuity-protocol.md` — new required Operator Mode protocol defining checkpoint triggers, before/after-compact behavior, Claude/Codex switching rules, and forbidden behaviors
- `AI_HANDOFF.md` — strengthened as the compact-safe resume file; all required fields documented
- `AGENTS.md` — Context Continuity Guard rule added (rule set #6)
- `CLAUDE.md` — Context Continuity Guard section added
- `docs/dev/ai-development-relay.md` — before-limit, resume-from-handoff, and auto-compact prohibition rules added
- `docs/automation/operator-mode/claude-codex-relay-protocol.md` — handoff-based continuation requirement added; Claude/Codex interchange rules strengthened
- `docs/automation/operator-mode/package-closeout-protocol.md` — mid-package continuity checkpoint requirement added

**Core principle:** Auto-compact is not accepted as a durable handoff. The only safe resume path is `AI_HANDOFF.md` + `git status` + recent commits + approved package docs.
