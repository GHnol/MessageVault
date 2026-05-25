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

## Context Continuity Guard

- Do not rely on auto-compact as project memory. The repo is the durable source of truth — not the session summary.
- Before any long task: confirm the current package, branch, objective, and approved scope by reading `AI_HANDOFF.md`, `AGENTS.md`, and the relevant package docs.
- During long tasks: maintain a rolling handoff state. Know what is done, what remains, and what is blocked.
- Before stopping, compacting, switching agents, or approaching context pressure: update `AI_HANDOFF.md` or produce a full transfer packet. Do not stop mid-task without a written handoff.
- After any context summary or compact: resume from `AI_HANDOFF.md`, git status, recent commits, and approved package docs — not from vague session memory.
- If uncertain about scope, current state, or prior decisions: stop and ask. Do not guess.

**User trigger phrases:** If the user says "checkpoint", "handoff", "before compact", "resume packet", or "context guard" — update `AI_HANDOFF.md` immediately and report what was done, what remains, and what comes next.

Full protocol: `docs/automation/operator-mode/context-continuity-protocol.md`

## Short Command Interface (added AI Project OS Usability Patch; skills canonical from Framework Groundwork Pass)

The user should not need to paste long startup, handoff, closeout, precommit, status, or tool-switch prompts during daily work. Long protocols live in repo docs. Daily operation uses short slash commands.

**Skills are canonical.** Command files (`.claude/commands/*.md`) are compatibility wrappers — thin delegates that invoke the matching skill workflow. The skill in `.claude/skills/<name>/SKILL.md` is the authoritative protocol definition.

| Command | What it does | Canonical skill | Backed by |
|---|---|---|---|
| `/start` | Session startup — read repo state, state package/branch/next action | `.claude/skills/start/SKILL.md` | `docs/dev/session-restart-protocol.md` |
| `/handoff` | Update `AI_HANDOFF.md` and produce a transfer packet | `.claude/skills/handoff/SKILL.md` | `docs/automation/operator-mode/context-continuity-protocol.md` |
| `/precommit` | Walk the pre-commit verification gate | `.claude/skills/precommit/SKILL.md` | `docs/qa/pre-commit-verification-template.md` |
| `/closeout` | Package boundary closeout — verify, update state, run sync check, propose commit | `.claude/skills/closeout/SKILL.md` | `docs/dev/package-boundary-closeout-protocol.md` |
| `/package-start` | Pre-flight for a newly authorized package | `.claude/skills/package-start/SKILL.md` | `docs/dev/session-restart-protocol.md` |
| `/switch-to-codex` | Prepare handoff for Codex | `.claude/skills/switch-to-codex/SKILL.md` | `docs/dev/tool-switching-protocol.md` |
| `/switch-to-claude` | Resume from Codex | `.claude/skills/switch-to-claude/SKILL.md` | `docs/dev/session-restart-protocol.md` |
| `/weekly-sync` | Coordinator weekly sync | `.claude/skills/weekly-sync/SKILL.md` | `docs/project-control/coordinator-weekly-sync.md` |
| `/calendar-sync-plan` | Calendar delta review (dry run) | `.claude/skills/project-sync-dry-run/SKILL.md` | `docs/project-control/calendar-sync-policy.md` |
| `/status-summary` | Generate internal + shareable project status | `.claude/skills/status-summary/SKILL.md` | `docs/project-control/shareable-status-summary.md` |
| `/os-audit` | AI Project OS self-audit | `.claude/skills/os-audit/SKILL.md` | `docs/ai-system/os-self-audit-checklist.md` |
| `/project-sync-dry-run` | Project-control sync dry-run (no writes) | `.claude/skills/project-sync-dry-run/SKILL.md` | `docs/project-control/project-sync-policy.md` |
| `/project-sync-apply` | Apply approved sync delta | `.claude/skills/project-sync-apply/SKILL.md` | `docs/project-control/external-sync-safety.md` |
| `/notification-setup-wizard` | Walk notification hook setup (local-only) | `.claude/skills/notification-setup-wizard/SKILL.md` | `docs/dev/notification-setup.md` |

Command files live in `.claude/commands/*.md`. Commands are user-invoked: the user types the command; Claude Code routes to the prompt content; Claude follows the protocol. Commands route Claude through existing protocols — they never invent new authority, never commit or push without approval, and never start a new package without Coordinator authorization. If Claude Code command support varies by version, the `.md` files serve as short paste-ready entry points.

## Event-triggered internal sync rule (added AI Project OS Framework Groundwork Pass)

Every meaningful work-unit closeout must trigger an internal sync check via the `closeout` skill or the `project-sync-dry-run` skill. The sync check is mandatory (policy-driven) after:

- Package complete, paused, or blocked
- Commit completed
- Merge completed
- Branch handoff (Claude ↔ Codex)
- Model switch
- Tool switch
- Project-control change (roadmap, sprint, backlog)
- Milestone/gate change
- Schedule/date change
- Task/backlog status change (significant)
- Major planning change

The sync check verifies: `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`, `docs/project-control/current-sprint.md`, `docs/project-control/kanban-board.md`, and staleness of calendar/external tool exports.

External systems (Google Calendar, ClickUp, TickTick) remain dry-run/apply and approval-gated. Never write to external systems without Coordinator approval.

Full contract: `docs/dev/closeout-sync-contract.md`

## Session, context, model, and tool protocols

`AGENTS.md` is the universal contract; this file extends it. For continuity decisions, follow:

- **Umbrella auto-management duties → `docs/dev/auto-management-protocol.md`**
- Restarting / after `/clear` / `/compact` / new session → `docs/dev/session-restart-protocol.md`
- `/clear` vs `/compact` vs `/context`, high context/usage, auto-compact warnings, high uncached context → `docs/dev/context-hygiene-protocol.md`
- **Which model for which task** (routing decisions) → `docs/dev/model-routing-protocol.md`
- Switching Claude model in-session (mechanics) → `docs/dev/model-switching-protocol.md`
- Switching tool (Claude ↔ Codex) → `docs/dev/tool-switching-protocol.md`
- Codex roles / interchangeability → `docs/dev/claude-codex-interchangeability.md`
- Worktrees / parallel sessions → `docs/dev/worktree-and-parallel-session-policy.md`
- Full scope boundary list → `docs/dev/agent-scope-boundaries.md`
- Token-efficiency discipline → `docs/dev/token-efficiency-protocol.md`
- Pre-flight context budget at session start → `docs/dev/context-budget-checklist.md`
- Tool batching (parallel calls, scripts, plan format) → `docs/dev/tool-batching-protocol.md`
- Package boundary closeout behavior → `docs/dev/package-boundary-closeout-protocol.md`
- Permission/wait notification setup (user-level) → `docs/dev/notification-setup.md`
- Universal AI Project OS standards → `docs/ai-system/universal-standards.md`
- AI Project OS layer index → `docs/ai-system/README.md`

Durable continuity files to keep current: `CURRENT_STATE.md` (project snapshot), `AI_HANDOFF.md` (work transfer), `NEXT_SESSION_PROMPT.md` (restart entry point). A model-switch or context warning is a cost/continuity warning, not an error — checkpoint these files, then proceed.

## Session model — fresh vs continuation (added Package 2.9)

- `claude --continue` of long stale sessions is **not** the default. Prefer a fresh session that resumes from repo truth.
- At every package boundary, after any merge to main, after a long debugging chain, or when the harness reports high uncached context (e.g. 300k+ / 500k+): recommend a fresh session.
- Continue an existing session only when: same logical task is mid-flight, active context is genuinely useful and small, no package boundary has been reached.

## Testing protocols (added Package 2.9)

- Overall test strategy → `docs/qa/test-strategy.md`
- Per-package verification (run at every package boundary) → `docs/qa/package-verification-template.md`
- Pre-commit hygiene gate → `docs/qa/pre-commit-verification-template.md`
- Release readiness → `docs/qa/release-readiness-template.md`
- Manual QA result format → `docs/qa/manual-qa-template.md`
- E2E harness operating manual → `docs/qa/e2e-regression-harness.md`

## Git identity (KeepMees repo)

This repo belongs to: KeepMees  
GitHub account: ghnol  
Git user.name: ghnol  
Git user.email: nlamptey@outlook.com

Before running any git push, commit, or gh command:
1. Run `git remote -v` — must show the KeepMees MessageVault remote
2. Run `git config user.name` and `git config user.email` — must show ghnol / nlamptey@outlook.com
3. Do NOT run `gh auth switch` under any circumstances
4. Do NOT change any remote URL without confirming first
5. If anything looks wrong, stop and tell the user before proceeding
