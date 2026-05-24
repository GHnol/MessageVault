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

## Short Command Interface (Claude Code — not Codex)

Claude Code has live slash commands in `.claude/commands/` for daily operations (`/start`, `/handoff`, `/precommit`, `/closeout`, `/switch-to-codex`, etc.). Codex does not use this system — it has no slash command runner. However, Codex follows the same underlying protocols:

- Session start → read `AGENTS.md` → `.codex/README.md` → `AI_HANDOFF.md` → `CURRENT_STATE.md` → `git status` + `git log --oneline -10`
- Handoff → update `AI_HANDOFF.md`; produce transfer block in chat
- Tool switch back to Claude → produce the packet that `/switch-to-claude` expects

When handing off from Claude to Codex, Claude will run `/switch-to-codex` which produces the Codex startup block. Codex reads that block and follows it exactly.

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
- Maintain repo-native memory continuously (Package 2.9 auto-management rule). Do not wait for usage-limit or context warnings to write state.

---

## Codex Package 2.9 protocols

Codex obeys the universal AI Project OS layer as well as the Codex-specific layer:

- Auto-management umbrella → `docs/dev/auto-management-protocol.md`
- Which model for which task → `docs/dev/model-routing-protocol.md` (apply the tier intent to whichever Codex tier is closest)
- Token efficiency → `docs/dev/token-efficiency-protocol.md`
- Context budget checklist → `docs/dev/context-budget-checklist.md`
- Tool batching → `docs/dev/tool-batching-protocol.md`
- Package boundary closeout → `docs/dev/package-boundary-closeout-protocol.md`
- Notification setup (user-level) → `docs/dev/notification-setup.md`
- AI Project OS standards → `docs/ai-system/universal-standards.md`
- Test strategy → `docs/qa/test-strategy.md`
- Package verification template → `docs/qa/package-verification-template.md`

---

## Codex config

`.codex/config.toml` is **not** committed in this pass — Codex config schema is tool-version-specific and committing an uncertain config risks fake certainty. Local/private Codex config is gitignored (`.codex/config.local.toml`, `.codex/*.local.*`, `.codex/secrets*`).

When a verified shared Codex config is wanted, add it as a separate, explicitly authorized change with the schema validated against the Codex version in use. Until then this README is the Codex contract. (Backlog item.)
