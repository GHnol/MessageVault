# .claude/commands — Short Command Interface

**Status:** ACTIVE. Commands are thin wrappers that delegate to canonical skills in `.claude/skills/*/SKILL.md`. Format confirmed: plain markdown files in `.claude/commands/` with the filename as the command name.

---

## Skills are canonical — commands are compatibility wrappers

**Skills** (`.claude/skills/*/SKILL.md`) contain the authoritative protocol. **Commands** (this directory) are the daily invocation interface — each one is a thin prompt that routes Claude to the matching skill.

When a command is invoked, Claude follows the skill protocol. The command file itself only needs to identify the skill, state the approval boundaries, and provide enough context for Claude to start.

---

## Live command roster

| Command | Canonical skill | What it does | Backed by |
|---|---|---|---|
| `/start` | `start` | Session startup — read repo state, run start router, state package/branch/next action | `docs/dev/session-restart-protocol.md` |
| `/start-router` | `start-router` | Run start router — get READY/NEEDS/BLOCKED verdict before any file edit | `scripts/start-router.mjs` |
| `/handoff` | `handoff` | Update `AI_HANDOFF.md` and produce transfer packet | `docs/automation/operator-mode/context-continuity-protocol.md` |
| `/precommit` | `precommit` | Walk the pre-commit verification gate | `docs/qa/pre-commit-verification-template.md` |
| `/closeout` | `closeout` | Package boundary closeout + internal sync check | `docs/dev/package-boundary-closeout-protocol.md` |
| `/package-start` | `package-start` | Pre-flight for a newly authorized package | `docs/dev/session-restart-protocol.md` |
| `/switch-to-codex` | `switch-to-codex` | Prepare handoff for Codex | `docs/dev/tool-switching-protocol.md` |
| `/switch-to-claude` | `switch-to-claude` | Resume from Codex | `docs/dev/session-restart-protocol.md` |
| `/weekly-sync` | `weekly-sync` | Coordinator weekly sync | `docs/project-control/coordinator-weekly-sync.md` |
| `/calendar-sync-plan` | `project-sync-dry-run` | Calendar delta review (dry run only) | `docs/project-control/calendar-sync-policy.md` |
| `/status-summary` | `status-summary` | Generate internal + shareable project status | `docs/project-control/shareable-status-summary.md` |
| `/os-audit` | `os-audit` | AI Project OS self-audit | `docs/ai-system/os-self-audit-checklist.md` |
| `/project-sync-dry-run` | `project-sync-dry-run` | Project-control sync dry-run (no writes) | `docs/project-control/project-sync-policy.md` |
| `/project-sync-apply` | `project-sync-apply` | Apply approved sync delta (approval-gated) | `docs/project-control/external-sync-safety.md` |
| `/notification-setup-wizard` | `notification-setup-wizard` | Walk notification hook setup (local-only) | `docs/dev/notification-setup.md` |
| `/github-project-setup` | `github-project-setup` | Plan, dry-run, and approval-gate GitHub Projects setup | `docs/project-control/github-projects-setup-policy.md` |
| `/github-project-template` | `github-project-template` | Manage AI Project OS GitHub Project template (dry-run, validate, Gate 2 apply) | `docs/project-control/github-projects-template-standard.md` |
| `/google-calendar-sync` | `google-calendar-sync` | Run Google Calendar live sync — validate, dry-run, and (Gate 3) apply | `docs/project-control/google-calendar-sync-policy.md` |
| `/report-intake` | `report-intake` | Run the report mirror intake sequence — sanitize and preview a closeout report, then apply sanitized summary to mirror log | `docs/project-control/report-mirror-policy.md` |
| `/external-sync-consistency` | `external-sync-consistency` | Run the external sync consistency validator — compare source records, local map, logs, and optional live read-only state | `docs/project-control/external-sync-consistency-policy.md` |

---

## Invariants for all commands

- Commands are user-invoked. The user types the command; Claude Code routes to the prompt content; Claude follows the protocol. No command runs autonomously.
- Commands delegate to the matching skill — they never invent new authority.
- A command's output is verified against actual git/file state, never trusted blindly.
- Commands never commit or push — those remain manual, requiring explicit user instruction.
- Commands never start a new package without explicit Coordinator authorization.
- Scope guards (pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`, standalone keepsake flows, Review view) remain off-limits regardless of which command is invoked.
- External sync commands (`/project-sync-dry-run`, `/project-sync-apply`, `/calendar-sync-plan`) are dry-run/approval-gated. No external writes without Coordinator approval.

---

## See also

- `.claude/skills/README.md` — canonical skill definitions (the protocol source of truth)
- `.claude/agents/README.md` — planned subagent roster (placeholder)
- `docs/dev/auto-management-protocol.md` — the umbrella protocol these commands route Claude through
