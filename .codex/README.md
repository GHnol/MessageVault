# .codex — Codex Agent Layer

This directory is the Codex-specific operating layer for KeepMees / MessageVault. It is the Codex counterpart to `CLAUDE.md`.

---

## Authority order for Codex

1. `AGENTS.md` — universal agent contract (never override)
2. This `.codex/README.md` — Codex-specific behavior
3. `docs/automation/operator-mode/*` — KeepMees operating procedures
4. Active package instruction from the Coordinator

Codex must read `AGENTS.md` first. This file only adds Codex-specific notes; it does not replace the universal contract.

---

## Codex roles in this project

See `docs/dev/claude-codex-interchangeability.md`. Codex is supported as:

1. Backup implementation agent (owns the branch when Claude Code is unavailable)
2. Reviewer (independent diff review before commit)
3. Debugging specialist
4. Usage-limit fallback
5. Alternative technical reasoning agent

---

## Codex must follow

- Git is truth; repo docs are durable memory. Read the file, not a summary.
- One agent owns the active branch. Read `AI_HANDOFF.md` before any edit.
- No commit/push/deploy without explicit instruction.
- No edits to `index.html` / `src/**` unless the authorized package requires it.
- Scope-guarded areas (pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`, standalone keepsake flows, Review view) are off-limits without explicit instruction.
- Never stage `.claude/settings.local.json`, `_source-intake/`, generated outbox/inbox files, secrets, or `node_modules/`.
- Before any context/tool/model switch: update `AI_HANDOFF.md` + `CURRENT_STATE.md` + `NEXT_SESSION_PROMPT.md` and produce a transfer packet.
- Resume only via `docs/dev/session-restart-protocol.md`.

---

## Codex config

`.codex/config.toml` is **not** committed in this pass — Codex config schema is tool-version-specific and committing an uncertain config risks fake certainty. Local/private Codex config is gitignored (`.codex/config.local.toml`, `.codex/*.local.*`, `.codex/secrets*`).

When a verified shared Codex config is wanted, add it as a separate, explicitly authorized change with the schema validated against the Codex version in use. Until then this README is the Codex contract. (Backlog item.)
