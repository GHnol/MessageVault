# Stream Sync Protocol — KeepMees / MessageVault

**Last updated:** 2026-05-10
**Status:** Active

---

## Purpose

Define the operating model for AI-assisted development on KeepMees. This protocol governs how the Coordinator, Operator, and Executor roles interact, how packages are authorized and executed, and how context is maintained across sessions.

---

## Roles

### Coordinator

The human product authority. Defines what gets built, in what order, and why. Issues package instructions. Authorizes scope. Makes locked decisions. Resolves ambiguity.

**Responsibilities:**
- Define and authorize each package before execution begins
- Specify hard constraints for each package (what is off-limits)
- Review and approve or reject work before it is committed
- Update strategy documents when locked decisions change

---

### Operator

An AI assistant (currently Claude Code / Sonnet 4.6) operating in conversation with the Coordinator. Receives package instructions, reads context, executes work, and reports back.

**Responsibilities:**
- Read `CLAUDE.md`, `AGENTS.md`, and relevant docs before executing
- Execute only within the authorized package scope
- Report blockers immediately rather than guessing
- Do not commit or push without explicit instruction
- Do not start a new package without explicit authorization
- Do not touch scope-guarded areas without explicit authorization
- Produce closeout reports after each package

---

### Executor

The Operator acting in its implementation capacity — writing code, creating files, running tests.

---

## Package lifecycle

```
1. Coordinator defines package
       ↓
2. Coordinator issues package instruction (in conversation)
       ↓
3. Operator reads context (CLAUDE.md, docs/, memory/)
       ↓
4. Operator executes package work
       ↓
5. Operator reports: files created/changed, tests, git status
       ↓
6. Coordinator reviews
       ↓
7. Coordinator issues commit instruction (explicit)
       ↓
8. Operator commits (never on its own initiative)
       ↓
9. Coordinator issues push instruction (explicit) or requests PR
       ↓
10. Coordinator issues closeout report request
        ↓
11. Operator produces closeout report
        ↓
12. Coordinator authorizes next package (or pauses)
```

---

## Context maintenance

### Session context (within a conversation)

The active conversation. The Operator has full context of everything said in the session.

### Cross-session context (memory)

Persistent memory at `~/.claude/projects/.../memory/`. Contains user profile, project context, feedback, and references. Point-in-time — may be stale. Always verify file-level claims against current code.

### Repo-based context (docs/)

This documentation package. Authoritative source of truth. Does not go stale. Takes precedence over memory when they conflict.

**Priority order when sources conflict:**
1. Current code (what is actually in the repo right now)
2. This docs/ package (locked decisions, requirements, strategy)
3. CLAUDE.md (behavior rules)
4. Memory (may be stale — verify before acting)
5. Session conversation (may contradict earlier decisions — flag the conflict)

---

## Scope authorization

Work that requires **explicit authorization** from the Coordinator before proceeding:

- Any change to scope-guarded constants (BOOK_PAGE_LINES, BOOK_PAGINATION_VERSION, etc.)
- Any change to standalone keepsake flows or Review view
- Any work involving ProductRenderSpec code, checkout, PDF generation, visual redesign, or vendor export
- Committing or pushing code
- Starting a new package
- Making a locked production decision (vendor, trim, binding, etc.)

Work that the Operator may proceed with **without additional authorization** once a package is active:

- Creating new `src/` modules per the package specification
- Writing tests for new modules
- Creating new `docs/` files (docs-only packages)
- Running tests
- Running git status, git log, git diff (read-only git operations)

---

## Closeout report format

After each package is committed and pushed, the Operator produces a closeout report containing:

1. Feature branch name
2. Feature commit hash
3. Merge commit hash on main
4. Final main commit hash
5. Files committed (list)
6. Final automated test results
7. Final git status
8. Whether main is pushed
9. Whether working tree is clean
10. Whether any local-only files remain
11. Scope confirmation (what was explicitly excluded)

---

## Package naming convention

| Type | Format | Example |
|---|---|---|
| Feature package | `feat/<short-description>` or package number | `Package 2` |
| Docs package | `docs/<description>` | `Package 2.5` |
| Fix / correction | Suffix `-correction` | `Package 1-correction` |
| Branch | `feat/...` or `docs/...` | `docs/project-truth-operating-system-foundation` |

---

## Communication norms

- The Operator does not start work silently. It confirms its understanding of the package before executing, or flags any ambiguity.
- The Operator does not self-authorize scope expansion. If package instructions imply work in a gated area, the Operator flags it and asks rather than proceeding.
- The Operator does not suppress test failures. If tests fail, it reports the failure before any other action.
- The Operator does not editorialize about locked decisions in commit messages or code. Locked is locked.

---

## Stream map (15-chat operating model)

**Source:** `_source-intake/keepmees-consolidation-2026-05-09/00 AI Mastery Intake Main Chat.md`

KeepMees operates across 15 dedicated ChatGPT chats and one Claude Code executor stream. The Coordinator integrates all streams.

| Chat # | Name | Tool | Role |
|---|---|---|---|
| 01 | Control - Coordinator | ChatGPT | Main command center; product authority; integrates all streams; issues final decisions; manages cross-stream alignment |
| 02 | Product - Core Strategy | ChatGPT | Core KeepMees and Message Book product idea; positioning, customer value, product scope, experience, user journey, business logic |
| 03 | Development - Core Build Stream | ChatGPT relaying to Claude Code | Technical execution; message intake pipeline; preview/rendering; code architecture; engineering tasks; development blockers |
| 04 | Production - Vendor Feasibility Agent | ChatGPT | Core book manufacturing feasibility; vendor outreach; print specs; feasibility packets; production risk classification |
| 05 | Production - Mockups and Vendor Strategy | ChatGPT | Bridges product mockups, vendor-readiness, production planning; preview handoff packages; print-safe planning |
| 06 | Production - Packaging, Bundling, and Gifting | ChatGPT | Packaging, unboxing, gifting, bundling, privacy seal, kitting, presentation — separate from core book architecture |
| 07 | Design - Message Book Designer Hiring | ChatGPT | External designer scouting, evaluation, outreach, async screening — CURRENTLY PAUSED (commercial hold) |
| 08 | Design - Human Figma Executor Briefs | ChatGPT | Execution-ready Figma briefs; locked design rules; source materials; discrepancy handling; QA support |
| 09 | Design - Product Mockup Generation | ChatGPT | Visual product mockups; realistic product imagery; page composition; bubble visuals; cover; packaging visuals |
| 10 | Brand - Logo Drafts | ChatGPT | Early KeepMees brand identity; logo drafts; quick brand visuals; lightweight brand asset stream |
| 11 | Competitors - Master Analysis | ChatGPT | Central competitor synthesis; strategic implications; market comparison; product/UX/pricing/marketing implications |
| 12 | Competitors - Zapptales Teardown | ChatGPT | Dedicated Zapptales teardown; website, product flow, analytics, ads, strengths/weaknesses |
| 13 | Competitors - MyForeverBooks Teardown | ChatGPT | Dedicated MyForeverBooks teardown; iMessage import; pricing; analytics; marketing |
| 14 | Tools - Claude Code and Git Workflow | ChatGPT | Support for Claude Code, VS Code, PowerShell, Git, GitHub; development tooling workflow |
| 15 | Tools - Accio Prompt Generation | ChatGPT | Prompt support for Accio/Alibaba sourcing research; vendor discovery; production/sourcing research |
| — | Claude Code (this tool) | Claude Code | Code execution only — takes instructions from Development stream (Chat 03) |

### Stream operating rules

- Each stream has a dedicated ChatGPT chat. Do not mix concerns across streams.
- Coordinator (Chat 01) is the only authority who can make locked decisions. Product, Design, Vendor streams can propose; Coordinator approves.
- Development stream (Chat 03) relays Coordinator-approved decisions to Claude Code for implementation.
- Claude Code executes within package scope only. Claude Code does not make product decisions.
- All streams report back to Coordinator. Coordinator routes decisions to the appropriate implementation stream.
- Competitor intelligence (Chat 11, 12, 13) and vendor research (Chat 04, 05) streams feed into Coordinator decisions.

### Claude Code / Codex handoff protocol

When a Claude Code session approaches context limits, a transfer packet must be generated before the limit is hit:

```
TRANSFER PACKET

Current Task: [task name]
Status: [% complete]
Files Modified: [list]
Current Branch: [branch name]
Last Commit: [hash + message]
What Was Done: [summary]
What's Left: [summary]
Known Issues: [list]
Test Results: [pass/fail summary]
Next Work: [exactly what to do next]
Context Needed: [critical context for next agent]
```

**Standard "before limit" sendoff prompt:**
"You are approaching usage limits. Generate a complete TRANSFER PACKET right now. Include everything the next agent needs to continue this work seamlessly. Be thorough. Do not skip context."

**Standard "continue from another agent" prompt:**
"A previous agent just reached usage limits and passed off to you. Analyze the TRANSFER PACKET below. Confirm you understand current status, what was done, what's left. State what you will do next. Resume the work exactly where it was left."

---

## Document update protocol

When a Coordinator decision, product response, development handoff, or competitor report is received, update the appropriate docs:

| Source | Documents to update |
|---|---|
| Coordinator decision | `docs/ops/decision-register.md`, relevant strategy docs |
| Product response | `docs/strategy/product-format-bank.md`, `docs/ops/design-readiness-register.md` |
| Development handoff | `docs/strategy/master-project-truth.md`, `docs/ops/backlog-roadmap.md` |
| Vendor research | `docs/ops/vendor-manufacturing-register.md` |
| Competitor report | `docs/ops/competitor-intelligence-register.md` |
| AI Mastery output | `docs/ops/ai-automation-register.md` |
| Packaging stream | `docs/ops/vendor-manufacturing-register.md`, `docs/strategy/product-format-bank.md` |
