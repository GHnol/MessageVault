# CLAUDE.md — Claude Code Instructions

This file contains Claude Code-specific instructions for this repository. It extends `AGENTS.md`; read that file too.

---

## Project

**KeepMees / MessageVault** — `index.html` is the entire application.

---

## Behavior rules

- Default to **no comments** in code. Only add a comment when the *why* is non-obvious.
- Do not write docstrings or multi-line comment blocks.
- Do not add error handling for scenarios that cannot happen.
- Do not add features beyond what the task requires.
- Do not create documentation files unless explicitly asked.
- Do not use emojis in file output unless explicitly asked.

## Git rules

- Never commit or push without explicit user instruction.
- Never amend published commits.
- Never force-push to `main`.
- Never skip pre-commit hooks (`--no-verify`).
- Prefer new commits over amending.

## Tool use

- Use `Read` before `Edit`. Never edit a file you have not read in this session.
- Prefer `Glob` / `Grep` / `Read` over shell equivalents.
- Run independent tool calls in parallel.
- Use `Agent` subagents for broad exploration or to protect the main context window; do not duplicate their work.

## Testing and QA

- Run existing tests when available and relevant.
- For UI or behavior changes: start a dev server and verify the golden path in a browser before reporting complete.
- If you cannot test the UI, say so explicitly rather than claiming success.

## Memory

- Persistent memory lives in `C:\Users\nlamp\.claude\projects\...\memory\`.
- Memory is point-in-time. Verify file-level claims against the current file before acting on them.
- Locked production decisions from memory take precedence over inferred defaults.

## Scope guard

The following are off-limits without explicit instruction:

- Pagination constants (`BOOK_PAGE_LINES`, `BOOK_HEADER_LINES`, `BOOK_DIVIDER_LINES`, etc.)
- `BOOK_PAGINATION_VERSION`
- `BOOK_PRODUCTION_DEPS` and `BOOK_PARITY`
- Standalone keepsake flows
- Review view
