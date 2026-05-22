# Context Budget Checklist

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol
**Use:** Short pre-flight checklist the agent runs before any non-trivial multi-step pass (refactor, OS upgrade, package implementation, broad audit). Output is one or two lines stating the budget plan — not a long doc.

---

## When to run this checklist

Run it before starting:

- A multi-file refactor
- A new package implementation
- A broad audit or scan
- A long document upgrade pass (like Package 2.9)
- Any work the agent estimates will need 30+ tool calls
- After resuming from a stale or possibly bloated session

Skip it for:

- One-line fixes
- Single-file edits with known scope
- Read-only Q&A

---

## The checklist

State the answers out loud (briefly) before the first edit:

1. **Task shape:** what kind of work — mechanical batch, exploration, implementation, audit?
2. **Estimated tool-call budget:** rough order of magnitude (5? 50? 500?).
3. **Search shape:** scoped (file/dir specified) or whole-repo (justified why)?
4. **Reads needed:** which files, which line ranges if known.
5. **Batching:** which calls can run in parallel.
6. **Script path:** does any part justify a one-off script over many Edit calls?
7. **Subagent path:** does any part justify delegating to `Explore` or `general-purpose`?
8. **Tier:** which model tier is right (`model-routing-protocol.md`).
9. **Context state:** is current session fresh, or already loaded? If already heavy, recommend `/clear` first.
10. **Handoff state:** is `AI_HANDOFF.md` current enough that a context event would not lose work?

---

## Output format

A single short paragraph in chat, then proceed. Example:

> Refactor pass. ~30 tool calls. Scoped to `docs/dev/`. Parallel reads of the 9 existing files, then sequential writes for 7 new files plus 5 updates. No script needed. Default tier. Session fresh. Handoff current.

That's it. The checklist is a discipline, not a deliverable.

---

## What this checklist does NOT do

- It does not need to be precise. Order-of-magnitude is enough.
- It does not have to be written to a file — saying it in chat is the format.
- It does not block the work — if the budget is tight, plan accordingly and proceed.

---

## Anti-patterns this catches

| Anti-pattern | What the checklist catches |
|---|---|
| Whole-repo Grep when one dir is enough | Step 3 forces "scoped or whole-repo? why?" |
| Reading 10 files one at a time | Step 5 forces "which files, which ranges" |
| Running 30 sequential edits when a script would do it once | Step 6 |
| Spawning a subagent for a 1-file task | Step 7 |
| Using strongest tier for routine edits | Step 8 |
| Starting a heavy refactor in an already-bloated session | Step 9 |
| Editing without `AI_HANDOFF.md` being current | Step 10 |

See `token-efficiency-protocol.md` and `tool-batching-protocol.md` for the underlying rules.
