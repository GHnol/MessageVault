# Tool Batching Protocol

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol
**Companion to:** `token-efficiency-protocol.md`, `context-budget-checklist.md`.

---

## Principle

Many small sequential tool calls cost more (in tokens, turns, and wall time) than a few batched or scripted ones. Batching is the default for repetitive deterministic work.

This protocol defines:

1. When to batch in parallel (independent calls in one turn).
2. When to write a script instead of many edits.
3. When to delegate to a subagent.
4. What a "batching plan" looks like for a refactor.

---

## Parallel tool calls (independent work in one turn)

When two or more tool calls have **no data dependency** between them, issue them in a single turn so they run in parallel.

Examples that should be parallel:

- Reading 5 different files at session start.
- Running `git status`, `git branch --show-current`, `git log --oneline -10` together.
- Globbing for multiple unrelated patterns.
- Writing 5 unrelated new files.

Examples that **cannot** be parallel:

- "Read file A, then edit based on what it says."
- "Run a test, then update the handoff with the result."
- "Search for X, then edit each match."

When in doubt: if call B's arguments depend on call A's output, they are sequential. Otherwise, parallel.

---

## Batching plan for refactors and broad updates

Before starting a multi-file refactor, rename, or repetitive update, write a batching plan in chat. The plan has six fields:

1. **Files likely affected** — a list, or a glob.
2. **Search command** — the exact `Grep` or `Glob` that finds the targets.
3. **Change shape** — what each edit looks like (one-line replacement? structural rewrite? new file from template?).
4. **Whether a script can do it** — yes/no, and which tool would run it.
5. **Verification command** — what to run after to confirm the change worked.
6. **Rollback path** — what `git` command undoes this if something goes wrong.

A two-minute batching plan saves an hour of one-edit-at-a-time work.

### Example

> **Batching plan: rename `oldHelper` to `newHelper`**
> 1. Affected files: `Grep` for `oldHelper` in `src/**` and `scripts/**`.
> 2. Search: `Grep pattern="oldHelper" output_mode="files_with_matches"`.
> 3. Change: in each file, `Edit replace_all=true` from `oldHelper` to `newHelper`.
> 4. Script: not needed — `replace_all` covers it.
> 5. Verify: `Grep pattern="oldHelper"` should return zero matches; existing Node tests still green.
> 6. Rollback: `git checkout src/ scripts/` if the test suite breaks.

---

## When to write a one-off script instead of editing

Write a script (and run it once) when:

- The transformation is mechanical and deterministic (rename, format change, header insertion).
- It applies to many files (~10+).
- Manual edits would be error-prone or slow.
- The change is reversible via git.

Do **not** write a script when:

- The change requires per-file judgment.
- The change affects scope-guarded code (do those by hand, deliberately).
- The script would itself be more complex than the manual edit.

Scripts written for one-off use should be deleted after, or kept in `scripts/` with a clear comment indicating purpose.

---

## When to delegate to a subagent

Delegate to `Explore` or `general-purpose` when:

- The exploration is broad enough that running it inline would bloat the main context.
- The agent will need to read many files to answer one question.
- The work is genuinely parallel to another stream of work the main agent is doing.

Do **not** delegate when:

- The target is known (just `Read` the file).
- A single `Grep` would answer the question.
- The agent has already done the same exploration in this session (don't double-spend tokens).

See the Agent tool description for delegation rules.

---

## Tool selection cheat sheet

| Want to | Tool |
|---|---|
| Find files by name pattern | `Glob` |
| Find files by content / regex | `Grep` (with `glob:` or `path:` scope) |
| Read a file with known path | `Read` (with `offset`/`limit` if large) |
| Edit a known string in one file | `Edit` |
| Edit the same string everywhere in one file | `Edit` with `replace_all: true` |
| Create a new file | `Write` |
| Rewrite a file entirely | `Write` (after `Read`-ing it) |
| Run a shell command | `Bash` or `PowerShell` (PowerShell preferred on Windows) |
| Explore broadly with read-only access | `Agent subagent_type=Explore` |
| Run a complex multi-step task in isolation | `Agent subagent_type=general-purpose` |

---

## What NOT to do

- Do not loop `Read` + `Edit` calls one file at a time when a script could batch them.
- Do not run `Bash` for tasks that have dedicated tools (file search, content search, file reads, file edits).
- Do not paste long file contents into chat — read the file directly.
- Do not spawn subagents redundantly — if work has already been delegated, do not also do it inline.
- Do not run whole-repo scans without a justification line in chat.

---

## Verification step

After a batching plan executes, run the planned verification:

- Did the search return zero remaining matches (for a rename)?
- Did the tests still pass (for a code change)?
- Did the docs still parse / link / render (for a docs change)?

If verification fails, follow the rollback path before continuing.

---

## What this protocol does NOT do

- It does not install batching plugins or extensions. Native tools cover the work.
- It does not make batching mandatory for trivial tasks. A one-file fix is one Edit call.
- It does not over-engineer simple changes — three similar lines is fine.

Plugins for batching are off-limits without explicit user authorization. Any proposed plugin must document:

- Source and maintainer
- Permissions
- Security risk
- Whether it sends code externally
- Whether it changes files automatically
- Rollback strategy
- Whether native shell/script batching can solve the same problem

If native batching covers the case, prefer native.
