# Claude / Codex Relay Protocol

**Last updated:** 2026-05-10
**Applies to:** Claude Code (Operator) when approaching context limits or handing off to another AI agent

---

## Purpose

Define the exact process for transferring work between Claude Code sessions (or to a Codex instance) when a session approaches its context limit. A poor handoff causes the next agent to make wrong assumptions, redo work, or violate scope.

---

## When to trigger a transfer

Trigger a transfer packet when ANY of the following occur:
- Context window is approaching 75–80% capacity
- A complex multi-step task cannot be completed in the current session
- The user explicitly requests a handoff
- The Operator is stopping work mid-task

**Do not wait until the limit hits.** Generate the transfer packet while there is still room to be thorough.

---

## Transfer packet format

Use this exact format. Do not omit sections.

```
TRANSFER PACKET

Date: [YYYY-MM-DD]
Current Task: [package name or task description]
Status: [% complete]
Branch: [current branch name]
Last Commit: [hash + message]
Files Modified (since last commit): [list]

What Was Done:
[Summary of completed work in this session]

What Remains:
[Summary of what the next agent must complete]

Known Issues:
[Any open questions, bugs, or uncertainties the next agent must know]

Test Results: [all-passing | some-failing | not-run | not-applicable]
Test Details: [which suites ran, counts, any failures]

Next Work:
[Exactly what the next agent should do FIRST — be precise]

Context Needed:
[Critical context the next agent needs that isn't in the code or docs]

Scope Guard Reminder:
[Specific scope-guarded constants or flows the next agent must not touch]

Do Not Commit: true (unless user explicitly instructs)
```

Schema: `docs/automation/schemas/ai-handoff-packet.schema.json`
Template: `docs/automation/templates/` (use the ai-handoff-packet fields)

---

## Standard sendoff prompt (to generate transfer packet)

When a session is approaching limits, the user can send:

> "You are approaching usage limits. Generate a complete TRANSFER PACKET right now. Include everything the next agent needs to continue this work seamlessly. Be thorough. Do not skip context."

---

## Standard resume prompt (for the next agent)

When starting from a transfer packet:

> "A previous agent just reached usage limits and passed off to you. Analyze the TRANSFER PACKET below. Confirm you understand current status, what was done, what's left. State what you will do next. Resume the work exactly where it was left."

---

## What the incoming agent must do before touching anything

1. Read `AI_HANDOFF.md` first (if it exists — update it during the transfer)
2. Read `CLAUDE.md` and `AGENTS.md`
3. Read the transfer packet carefully
4. Read the current state of relevant source files (do not trust in-context summaries)
5. Confirm understanding of what was done and what remains
6. State explicitly what it will do next BEFORE starting

---

## Rules the incoming agent must follow

- Do NOT assume the previous agent's in-context state is correct — verify against current files
- Do NOT commit or push without explicit user instruction
- Do NOT start a new package without explicit authorization
- Do NOT touch scope-guarded areas (BOOK_PAGE_LINES, BOOK_PAGINATION_VERSION, BOOK_PRODUCTION_DEPS, BOOK_PARITY, standalone keepsake flows, Review view)
- Do NOT stage `_source-intake/` or `.claude/settings.local.json`
- Do NOT make locked decisions — the next agent inherits the package scope, not product authority

---

## Update AI_HANDOFF.md during transfer

Before the current session ends, update `AI_HANDOFF.md` with:
- Status: `in-progress`
- Branch: current branch
- What was done
- What remains
- Blockers
- File-level warnings
- Suggested next step

---

## Context limit warning signs

- Responses becoming slower or truncated
- The assistant losing track of earlier decisions made in the session
- Confusion about file state that was established earlier
- Repeated questions about things already answered

When these appear: generate the transfer packet immediately.

---

## Cache window and scheduling notes

Anthropic prompt cache TTL is approximately 5 minutes. If the next session begins more than 5 minutes after the transfer packet is generated, the new session starts uncached. The Transfer Packet must be self-contained enough that the new session can operate correctly without cached context.

A Transfer Packet that references "what we discussed earlier" is not a Transfer Packet — it is an incomplete handoff.
