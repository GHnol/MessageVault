# Context Continuity Protocol

**Last updated:** 2026-05-15
**Applies to:** Claude Code and Codex when working in this repository
**Status:** Active — required Operator Mode protocol

---

## Purpose

Prevent context loss, auto-compact events, agent switches, and long-session drift from corrupting in-progress work or causing the next agent to violate scope or repeat completed work.

This protocol defines when to checkpoint, how to hand off, and how to resume — regardless of what caused the interruption.

---

## The core rule

**The repo is the durable memory. Auto-compact is not.**

Auto-compact may silently compress or drop decisions, state, and agreed scope from earlier in the session. An agent that resumes from a vague auto-compact summary and continues implementing is operating on an unreliable foundation.

The only safe resume path is: `AI_HANDOFF.md` + git status + recent commits + approved package docs.

---

## Checkpoint triggers

A checkpoint means: update `AI_HANDOFF.md` with current state. Do this before:

| Trigger | Action |
|---|---|
| Starting any long implementation pass (3+ file edits) | Write intended scope to `AI_HANDOFF.md` before editing |
| Completing each meaningful implementation phase | Update "Work completed" and "Work remaining" in `AI_HANDOFF.md` |
| Before a broad refactor (many files, many functions) | Full checkpoint |
| Before editing many files in a single pass | Full checkpoint |
| Before switching branches | Full checkpoint + confirm nothing uncommitted is lost |
| Before committing | Verify `AI_HANDOFF.md` reflects current state |
| Before merging | Confirm merge plan is documented |
| Before stopping for any reason | Full checkpoint |
| At any auto-compact / context-risk moment | Immediate checkpoint — do not delay |
| When context window approaches ~70% capacity | Begin transfer packet |
| When responses become slower, shorter, or confused | Treat as context pressure — checkpoint now |

**User trigger phrases:** If the user says any of the following, update `AI_HANDOFF.md` immediately and report:

- "checkpoint"
- "handoff"
- "before compact"
- "resume packet"
- "context guard"
- "save state"
- "pause here"

---

## Before-compact behavior

When approaching context limits or receiving a compact signal:

1. **Do not continue implementation.** Finish the current logical unit (one function, one file) if you are mid-step. Do not start a new one.
2. **Write a full checkpoint to `AI_HANDOFF.md`.** All fields required — see the template.
3. **Produce a transfer packet** in the chat (using the format in `claude-codex-relay-protocol.md`).
4. **State clearly** what was done, what remains, and what the next agent should do first.
5. **Do not commit** unless the user explicitly instructs it as part of the handoff.

A transfer packet that says "we discussed X earlier" is not a valid handoff. The packet must be self-contained.

---

## After-compact resume behavior

When resuming after any context event (compact, new session, agent switch):

1. **Read in this exact order before touching any file:**
   1. `AGENTS.md`
   2. `CLAUDE.md` (if you are Claude Code)
   3. `AI_HANDOFF.md`
   4. Run `git status`
   5. Run `git log --oneline -10`
   6. Read the relevant package docs listed in `AI_HANDOFF.md`
   7. Read any specific files listed under "Source-of-truth files to read first"

2. **Confirm out loud** (in the chat) before acting:
   - Current package and branch
   - Current objective
   - Approved scope and hard exclusions
   - What was completed
   - What remains
   - Next exact action

3. **Do not assume** the previous session's in-context state was correct. Verify against current file state.

4. If `AI_HANDOFF.md` is **missing, stale, or contradicts git status**: stop and ask the Coordinator for direction. Do not guess and proceed.

---

## Required handoff content

Every `AI_HANDOFF.md` update must include:

| Field | Required |
|---|---|
| Status (idle / in-progress / blocked / ready-for-review) | Yes |
| Active package | Yes |
| Branch + last commit | Yes |
| Current objective | Yes |
| Approved scope | Yes |
| Hard exclusions | Yes |
| Git state at handoff | Yes |
| Recent commits | Yes |
| Files changed | Yes |
| Work completed | Yes |
| Work remaining | Yes |
| Tests run | Yes |
| Known risks and blockers | Yes |
| Next exact action | Yes |
| Source-of-truth files to read first | Yes |
| Resume prompt for next session | Yes |

Partial handoffs are not valid. If the session ends with an incomplete `AI_HANDOFF.md`, the incoming agent must treat the handoff as missing and ask the Coordinator.

---

## Forbidden behavior

The following are never acceptable:

- Resuming implementation after a compact event without reading `AI_HANDOFF.md` and verifying git state
- Continuing from vague compressed memory of what was agreed earlier in the session
- Treating auto-compact as a sufficient project memory mechanism
- Skipping a checkpoint before stopping mid-task
- Producing a transfer packet that references "what we discussed earlier" without a self-contained summary
- Starting the next package because the current package "seemed complete" in the compact summary — always verify against git and `AI_HANDOFF.md`
- Editing files that are outside the approved package scope based on something remembered from before a compact

---

## Claude Code ↔ Codex switching rules

Claude Code and Codex may not hand off through chat memory alone. The following rules apply to any Claude → Codex or Codex → Claude switch:

**Outgoing agent (before switching):**
1. Complete the current logical unit. Do not stop mid-function or mid-file.
2. Write a full `AI_HANDOFF.md` checkpoint.
3. Produce a transfer packet in the chat.
4. Do not commit unless instructed.

**Incoming agent (before touching anything):**
1. Read `AGENTS.md`
2. Read `CLAUDE.md` (if incoming agent is Claude Code)
3. Read `AI_HANDOFF.md`
4. Run `git status` and `git log --oneline -10`
5. Read the relevant package docs listed in `AI_HANDOFF.md`
6. Read the specific files listed in "Source-of-truth files to read first"

**Incoming agent must confirm before acting:**
- Current package and branch
- Current objective
- Approved scope and hard exclusions
- Files changed so far and their status
- Tests run
- Next exact action

**If `AI_HANDOFF.md` is missing, stale, or conflicts with git status:** stop and ask the Coordinator for direction. Do not begin work based on the transfer packet alone.

---

## How this interacts with AI_HANDOFF.md

`AI_HANDOFF.md` is the compact-safe resume file. This protocol defines when and how to update it. The two documents work together:

- This protocol says **when** to checkpoint and **what** to do before/after context events
- `AI_HANDOFF.md` is the **artifact** produced by those checkpoints
- Together they form the complete continuity system

`AI_HANDOFF.md` is a living template — it should be updated frequently during long tasks, not only at the very end.

---

## How this interacts with package closeout

Package closeout (defined in `package-closeout-protocol.md`) is the end-of-package continuity mechanism. This protocol handles **within-package continuity** — especially long packages where multiple sessions or context events may occur.

Checkpoints during a package do not replace the package closeout. Both are required.

Long packages (those expected to span multiple sessions) should begin with an `AI_HANDOFF.md` checkpoint before the first edit, not only at the end.

---

## How this interacts with command-center docs

Command-center docs (`docs/command-center/`) are updated during the post-merge status sync, not during in-progress work. Do not update command-center docs mid-package to reflect in-progress work — those docs represent completed and merged state only.

`AI_HANDOFF.md` is the correct place to record in-progress state. Command-center docs record delivered state.

---

## How this interacts with the relay protocol

The relay protocol (`claude-codex-relay-protocol.md`) defines the transfer packet format and the resume prompt. This protocol defines the checkpoint triggers and forbidden behaviors that govern when to produce a transfer packet.

When in doubt about format: see the relay protocol.
When in doubt about timing: see this document.
