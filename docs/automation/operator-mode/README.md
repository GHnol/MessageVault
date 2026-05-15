# Operator Mode Protocols — KeepMees / MessageVault

**Last updated:** 2026-05-10

---

## What operator mode is

Operator mode is the set of rules Claude Code follows when operating inside the KeepMees AI development relay system. It is the bridge between the Coordinator's intent and the code and docs that get committed to the repo.

These protocols do not replace `CLAUDE.md` or `AGENTS.md`. They extend them with KeepMees-specific operating procedures.

**Hierarchy:**
1. `CLAUDE.md` — hard rules (never override)
2. `AGENTS.md` — AI agent rules (never override)
3. These operator mode protocols — KeepMees-specific operating procedures
4. Active package instructions — what the current session is authorized to do

---

## Files in this directory

| File | Purpose |
|---|---|
| `README.md` | This file — overview of operator mode |
| `context-continuity-protocol.md` | **Required** — when to checkpoint, before-compact and after-compact behavior, Claude/Codex switching rules, forbidden behaviors |
| `update-project-records-protocol.md` | How to update docs from stream responses without creating false authority |
| `package-closeout-protocol.md` | How to create and deliver a package closeout packet |
| `stream-routing-protocol.md` | How to route stream updates to the right docs and recipients |
| `claude-codex-relay-protocol.md` | Transfer packet format and relay protocol for Claude/Codex session handoffs |

---

## Core operator mode rules (always active)

**Do not:**
- Commit or push without explicit user instruction
- Start a new package without explicit Coordinator authorization
- Touch scope-guarded constants (BOOK_PAGE_LINES, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS, BOOK_PARITY, etc.)
- Touch standalone keepsake flows or Review view
- Modify application code during docs-only packages
- Stage or commit `_source-intake/`
- Stage or commit `.claude/settings.local.json`
- Mark a stream-proposed fact as coordinator-locked unless Coordinator explicitly locked it
- Self-authorize scope expansion — flag and ask instead
- Suppress test failures — report before any other action

**Do:**
- Read `CLAUDE.md`, `AGENTS.md`, `AI_HANDOFF.md`, and relevant docs before executing
- Read the actual file before editing (never trust context summaries for file state)
- Report blockers immediately rather than guessing
- Execute only within the authorized package scope
- Produce closeout reports after each package
- Distinguish proposed facts from locked facts in all docs
- Run tests when they are available and relevant

---

## Status vocabulary (use consistently)

| Status | Meaning |
|---|---|
| `locked` | Coordinator-approved, immutable without explicit product authority |
| `current` | Active governing decision (may evolve) |
| `owner-approved-target` | Owner-stated strategic direction, gated by real readiness |
| `proposed` | Surfaced but not yet Coordinator-approved |
| `gated` | Blocked by an external named condition |
| `deferred` | Good idea, out of scope for current packages |
| `rejected` | Considered and ruled out — do not revisit without new information |
| `needs-source` | Claim exists but source backing is missing |
| `needs-coordinator-decision` | Coordinator has not yet ruled on this |
| `needs-product-decision` | Product stream has not yet ruled on this |
| `needs-development-review` | Development stream has not yet reviewed this |
| `needs-vendor-input` | Awaiting vendor response or confirmation |
| `needs-design-input` | Awaiting design stream input |

---

## Source of truth priority

When sources conflict, use this priority order:

1. Current code (what is actually in the repo right now)
2. `docs/` Package 2.5A docs (locked decisions, requirements, strategy)
3. `CLAUDE.md` (behavior rules)
4. `memory/` (point-in-time, may be stale — verify before acting)
5. Session conversation (may contradict earlier decisions — flag the conflict)

---

## What requires explicit Coordinator authorization

| Action | Required authorization |
|---|---|
| Starting a new package | Explicit Coordinator package instruction |
| Committing or pushing code | Explicit user instruction |
| Touching scope-guarded constants | Explicit package instruction naming the constant |
| Marking a proposed fact as locked | Coordinator statement of approval |
| Any work involving checkout, PDF, cover design, visual redesign, vendor export | Explicit package instruction |
| Expanding scope mid-package | Stop, flag, ask — do not self-authorize |

---

## What the Operator may proceed with (within an active authorized package)

- Creating new `src/` modules per the package specification
- Writing tests for new modules
- Creating new `docs/` files (docs-only packages)
- Running tests
- Running git status, git log, git diff (read-only git operations)
- Producing closeout reports
