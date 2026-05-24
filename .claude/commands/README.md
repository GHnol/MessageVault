# .claude/commands — Short Command Interface

**Status:** ACTIVE (live commands shipped in AI Project OS Usability Patch, 2026-05-24). Format confirmed as plain markdown files in `.claude/commands/`. Each file appears as a slash command matching its filename.

---

## Why live now

The placeholder policy from Package 2.9 ("prefer README + backlog over uncertain live implementation") was appropriate until the format was verified. The format is now confirmed: plain markdown files in `.claude/commands/` with the filename as the command name. No manifest, no frontmatter. The content is the prompt that runs when the command is invoked.

---

## Live command roster

| Command | File | What it does | Backed by |
|---|---|---|---|
| `/start` | `start.md` | Session startup — read repo state, state package/branch/next action | `docs/dev/session-restart-protocol.md` |
| `/handoff` | `handoff.md` | Update `AI_HANDOFF.md` and produce transfer packet | `docs/automation/operator-mode/context-continuity-protocol.md` |
| `/precommit` | `precommit.md` | Walk the pre-commit verification gate | `docs/qa/pre-commit-verification-template.md` |
| `/closeout` | `closeout.md` | Package boundary closeout — verify, update state, propose commit | `docs/dev/package-boundary-closeout-protocol.md` |
| `/package-start` | `package-start.md` | Pre-flight for a newly authorized package | `docs/dev/session-restart-protocol.md` |
| `/switch-to-codex` | `switch-to-codex.md` | Prepare handoff for Codex | `docs/dev/tool-switching-protocol.md` |
| `/switch-to-claude` | `switch-to-claude.md` | Resume from Codex | `docs/dev/session-restart-protocol.md` |
| `/weekly-sync` | `weekly-sync.md` | Coordinator weekly sync | `docs/project-control/coordinator-weekly-sync.md` |
| `/calendar-sync-plan` | `calendar-sync-plan.md` | Calendar delta review (dry run only) | `docs/project-control/calendar-sync-policy.md` |
| `/status-summary` | `status-summary.md` | Generate internal + shareable project status | `docs/project-control/shareable-status-summary.md` |

---

## Invariants for all commands

- Commands are user-invoked. The user types the command; Claude Code routes to the prompt content; Claude follows the protocol. No command runs autonomously.
- Commands route Claude through existing protocols; they never invent new authority.
- A command's output is verified against actual git/file state, never trusted blindly.
- Commands never commit or push — those remain manual, requiring explicit user instruction.
- Commands never start a new package without explicit Coordinator authorization.
- Scope guards (pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`, standalone keepsake flows, Review view) remain off-limits regardless of which command is invoked.

---

## Commands vs Skills

Commands (`.claude/commands/*.md`) are the daily short interface — one invocation drives a full workflow. Skills (`.claude/skills/`) are deeper, reusable workflows that can be composed. See `.claude/skills/README.md` for the distinction.

---

## See also

- `.claude/agents/README.md` — planned subagent roster (placeholder)
- `.claude/skills/README.md` — skill roster and commands-vs-skills distinction
- `docs/dev/auto-management-protocol.md` — the umbrella protocol these commands route Claude through
