# Token Efficiency Protocol

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol
**Companion to:** `tool-batching-protocol.md`, `context-budget-checklist.md`, `context-hygiene-protocol.md`, `model-routing-protocol.md`.

---

## Principle

Cheap is correct. Expensive should be deliberate. Token cost is real — both in $ and in cache hit rate — and shows up as slower responses, lost decisions in long sessions, and eventual usage-limit blockers.

The OS is honest about three classes of cost:

1. **Input tokens** (what the agent reads).
2. **Output tokens** (what the agent writes).
3. **Cache miss** (re-reading a large transcript across a model switch, long pause, or fresh session).

Most savings come from reducing class 1.

---

## High-leverage rules

### Prefer files and exact paths over pastes

When the user references code, read the file. When the agent references code, cite `path:line`. Do not paste large blobs back into chat as a substitute for reading.

Pasting a 500-line file the agent already has access to costs ~2000 tokens that the read tool would not.

### Prefer scoped searches over whole-repo scans

For a known symbol or path: use `Grep` with `glob:` or a directory `path:` argument. Whole-repo scans should be reserved for:

- Open-ended exploration where the target is genuinely unknown
- Cross-cutting refactors where every reference matters
- Final audits

For "where is `BOOK_PAGINATION_VERSION` set?" → `Grep` with `type:html` and a tight pattern, not a blind `find .`.

### Prefer one structured read over many partial reads

If you need lines 1-200, 400-450, and 800-900 of a 1000-line file, read it once and reuse. Don't issue three reads.

If you need a 20-line excerpt, request only the offset/limit you need — don't pull 2000 lines.

### Prefer parallel independent calls

Independent tool calls in the same turn run in parallel — they cost the same input but save wall-clock time, and they reduce the number of agent turns (which is where transcript bloat compounds).

See `tool-batching-protocol.md`.

### Prefer scripts for repetitive deterministic work

If the change is "rename `oldName` to `newName` in 40 files", a script is one tool call. Forty `Edit` calls is forty tool calls.

For docs-only renames where Edit's `replace_all` covers it, use that. For mechanical transformations across many files, a one-off script is fine — but document it before running.

### Prefer narrow tool subsets

If the work is read-only exploration: use `Explore` subagent or `Glob`/`Grep`/`Read`. Don't load Edit/Write tools the agent won't use.

If the work is a single deterministic rename: use Edit/Write. Don't spawn a subagent for it.

### Keep `AGENTS.md` and `CLAUDE.md` lean

These files load into every session. A 500-line `CLAUDE.md` costs ~2000 tokens per session × every session for the life of the repo. Move rare workflows into dedicated docs under `docs/dev/` and point to them from `AGENTS.md`/`CLAUDE.md` — they load only when needed.

### Move workflows out of chat into skills/docs

Recurring agent workflows (closeout, handoff write-up, package verification) should be backed by a doc the agent reads on demand — not re-derived from memory every session. Currently these are docs; future passes may package them as skills.

---

## What costs more than people think

| Action | Roughly how much |
|---|---|
| Reading a 2000-line file unnecessarily | 8000+ tokens |
| Pasting a long log into chat | 4000–20000+ tokens |
| Whole-repo Grep with broad output | 5000–50000 tokens |
| Long correction chain (5+ "no, like this") | 10000–30000 tokens spread across the turns |
| Re-reading the same file in 4 separate turns | 4× cost |
| Asking an agent to "re-explain" what it just said | 2× cost minimum |
| Cache miss after a long pause | full transcript cost (often 50000–500000+) |

---

## What costs less than people think

| Action | Roughly |
|---|---|
| Scoped `Grep` (e.g. `glob:**/*.md`, narrow pattern, `head_limit`) | Low |
| Targeted `Read` with `offset`/`limit` | Low |
| Parallel tool calls in one turn | Same total cost but fewer turns |
| Asking for a 3-line answer instead of a 30-line answer | Output drops linearly |
| A short, well-scoped subagent invocation | Cheaper than dragging the same exploration through the main context |

---

## Correction-chain avoidance

If the agent's first attempt at a task is wrong, the cheapest recovery is usually:

1. State exactly what's wrong (1–2 sentences).
2. State the desired direction.
3. Let the agent retry in a single revised attempt.

Avoid "no, like this" chains of 5+ corrections — each one re-reads the entire prior context. Better: checkpoint, `/compact` if useful, retry with a sharper prompt.

---

## When you must do an expensive thing

Expensive operations are fine when they're the correct choice. Be deliberate:

- Whole-repo audit for a security review → reasonable
- Reading a large file because the agent needs structural understanding → reasonable
- High thinking on architecture → reasonable

For each expensive operation, state out loud why the cheaper option won't do.

---

## Token efficiency at the boundaries

The single biggest cost saver is **not running the wrong session**:

- Fresh session from repo truth at every package boundary (cache fresh, small transcript)
- Short focused sessions (cache hit on every turn)
- `/clear` at task boundaries (drop irrelevant context)

If a session has grown past the point where the agent loses track of earlier decisions, the cheapest path forward is almost always: checkpoint, `/clear`, restart from `NEXT_SESSION_PROMPT.md`.

See `context-hygiene-protocol.md` for the decision table.

---

## What this protocol does NOT do

- It does not impose a token budget. The user decides the budget.
- It does not force the agent to refuse expensive work — it forces the agent to *be deliberate* about it.
- It does not turn the agent into a token-counter. The agent does not need to track exact counts — it needs to follow the patterns above.
