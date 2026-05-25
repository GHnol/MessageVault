# AI Project OS — Changelog

**Status:** ACTIVE.
**Scope:** This changelog tracks changes to the **AI Project OS layer** of this repo — the agent operating system, the universal standards, the dev/QA protocols, the continuity files, and the AI-facing parts of `.claude/` / `.codex/` / `docs/automation/`.

It is **not** a product changelog. Product-level package history lives in `docs/ops/backlog-roadmap.md` and `docs/command-center/current-status.md`.

Newest entries first.

---

## 2026-05-24 — AI Project OS Framework Groundwork Pass

**Status:** COMPLETE — merged to main (`cc7139a`). Implementation commit: `219f0b3`.
**Branch:** `docs/ai-project-os-framework-groundwork` (merged)
**Scope:** AI Project OS framework completion. No `index.html`, `src/**`, no product implementation.

### Added (Skills — canonical layer)
- `.claude/skills/start/SKILL.md`
- `.claude/skills/handoff/SKILL.md`
- `.claude/skills/precommit/SKILL.md`
- `.claude/skills/closeout/SKILL.md`
- `.claude/skills/package-start/SKILL.md`
- `.claude/skills/switch-to-codex/SKILL.md`
- `.claude/skills/switch-to-claude/SKILL.md`
- `.claude/skills/weekly-sync/SKILL.md`
- `.claude/skills/status-summary/SKILL.md`
- `.claude/skills/os-audit/SKILL.md`
- `.claude/skills/project-sync-dry-run/SKILL.md`
- `.claude/skills/project-sync-apply/SKILL.md`
- `.claude/skills/notification-setup-wizard/SKILL.md`

### Updated (Command wrappers — now thin delegates to skills)
All existing `.claude/commands/*.md` updated to reference matching skill.
New command wrappers added: `os-audit.md`, `project-sync-dry-run.md`, `project-sync-apply.md`, `notification-setup-wizard.md`.

### Added (Closeout Sync Contract)
- `docs/dev/closeout-sync-contract.md` — what every meaningful closeout must verify; internal vs external sync; classification guide; required closeout report format

### Added (Project Control Sync Foundation)
- `docs/project-control/project-sync-policy.md` — source of truth hierarchy, stable IDs, dry-run/apply workflow, scheduling model, external tool routing
- `docs/project-control/project-sync-source-schema.md` — schema for ritual/milestone/package/task items and external ID map format
- `docs/project-control/project-sync-dry-run-format.md` — exact format for dry-run delta output
- `docs/project-control/external-sync-safety.md` — non-negotiable rules for Google Calendar, ClickUp, TickTick writes
- `docs/project-control/external-sync-map.example.json` — committed example only; local map is gitignored
- `docs/project-control/project-sync-log.md` — log of every project-control sync operation

### Added (OS Self-Audit)
- `docs/ai-system/os-self-audit-checklist.md` — required checklist before claiming bootstrap complete

### Added (Scripts — safe, dependency-free, read-only)
- `scripts/os-self-audit.mjs` — checks all required OS files, skills, commands, gitignore protections, Post-Commit State Rule cross-references
- `scripts/project-control-sync-dry-run.mjs` — reads repo docs, reports drift vs expected state, outputs dry-run format
- `scripts/project-control-sync-validate.mjs` — validates project-control docs are internally consistent
- `scripts/setup-claude-notification.ps1` — walks notification hook setup; dry-run by default; -Apply to modify settings.json

### Updated (Universal standards)
- `docs/ai-system/universal-standards.md` — "Skills are canonical / commands are compatibility wrappers" section; "Closeout sync rule" section; automation table updated (skills: Backlog → User-invoked; commands: updated count and notes; new rows for closeout sync, OS self-audit, notification wizard)

### Updated (Bootstrap template)
- `docs/ai-system/bootstrap-template.md` — Step 2 updated (skill folders + thin command wrappers); Step 10 verification updated (OS self-audit required; closeout sync contract required); "What this template does" updated for v0.5.0

### Updated (Dev protocols — event-triggered sync rule)
- `docs/dev/auto-management-protocol.md` — Duty 2 expanded with internal sync check requirement; Quick reference rows added
- `docs/dev/package-boundary-closeout-protocol.md` — Step 8 (internal sync check) added before Status sync plan
- `docs/dev/closeout-sync-contract.md` — new file (listed above)

### Updated (Agent layers — event-triggered sync rule)
- `AGENTS.md` — event-triggered sync rule added; protocol table updated
- `CLAUDE.md` — Short Command Interface table expanded with new commands and skill column; event-triggered sync rule section added
- `.codex/README.md` — event-triggered sync rule section added

### Updated (Project-control docs — stale state corrected)
- `docs/project-control/current-sprint.md` — updated to reflect Package 5A complete, AI Project OS Framework Groundwork Pass active
- `docs/project-control/kanban-board.md` — Package 5A moved to Done; cards updated post-Package 5A

### Updated (Gitignore)
- `.gitignore` — added `external-sync-map.local.json` and generated dry-run output patterns

### Intentionally NOT changed
- `index.html`, `src/**`, `scripts/**` (except new OS scripts above)
- Pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`
- Standalone keepsake flows, Review view
- No Google Calendar API implementation
- Product roadmap content in Tower (unchanged except stale-state corrections)
- No live Claude hooks committed

---

## 2026-05-24 — AI Project OS Usability Patch

**Status:** IN PROGRESS — docs/config only; no product/app changes.
**Branch:** `docs/ai-project-os-usability-patch` (pending)
**Scope:** AI Project OS usability improvements only. No `index.html`, `src/**`, `scripts/**`, no product implementation, no vendor/design/checkout work.

### Added (Short Command Interface — universal)
- `.claude/commands/start.md` — session startup from repo truth
- `.claude/commands/handoff.md` — AI_HANDOFF.md update + transfer packet
- `.claude/commands/precommit.md` — pre-commit verification gate
- `.claude/commands/closeout.md` — package boundary closeout
- `.claude/commands/package-start.md` — new package pre-flight
- `.claude/commands/switch-to-codex.md` — Codex handoff
- `.claude/commands/switch-to-claude.md` — resume from Codex
- `.claude/commands/weekly-sync.md` — Coordinator weekly sync
- `.claude/commands/calendar-sync-plan.md` — calendar delta dry run
- `.claude/commands/status-summary.md` — internal + shareable status

### Added (Calendar Sync Layer planning)
- `docs/project-control/calendar-sync-policy.md` — when/how to sync the calendar, dry-run/apply workflow, future script plan
- `docs/project-control/calendar-source-template.md` — repo-native format for calendar events (stable UIDs, all current events catalogued)
- `docs/project-control/calendar-sync-log.md` — record of every calendar change applied

### Added (Shareable Status Summary)
- `docs/project-control/shareable-status-summary.md` — internal + public-safe status in one file

### Updated (universal standards)
- `docs/ai-system/universal-standards.md` — new "Short Command Interface" section; automation table updated (custom slash commands: Backlog → User-invoked)
- `docs/ai-system/bootstrap-template.md` — Step 2 updated to include live command files; bootstrap instructions clarified
- `docs/ai-system/CHANGELOG.md` — Post-Commit State Rule entry corrected (PROPOSED → COMPLETE); this entry
- `docs/ai-system/version-history.md` — version 0.3.1 corrected; version 0.4.0 row added

### Updated (dev protocols)
- `docs/dev/auto-management-protocol.md` — Short Command Interface reference added to quick reference
- `docs/dev/session-restart-protocol.md` — `/start` command reference added
- `docs/dev/notification-setup.md` — PermissionRequest hook guidance, double-beep warning, Windows toast fallback, CLAUDE_CONFIG_DIR troubleshooting

### Updated (agent layers)
- `AGENTS.md` — Short Command Interface row added to protocol table
- `CLAUDE.md` — new "Short Command Interface" section with full command table
- `.codex/README.md` — note about Claude Code commands vs Codex equivalents
- `.claude/commands/README.md` — updated from placeholder to live; old planned roster replaced with live roster
- `.claude/skills/README.md` — Commands vs Skills distinction added

### Corrected (stale state)
- `CURRENT_STATE.md` — HEAD updated to `926ec37`; stale status-sync branch removed
- `AI_HANDOFF.md` — status-sync "in progress" language corrected; work-remaining cleared
- `NEXT_SESSION_PROMPT.md` — HEAD updated; stale "status sync will bump this" language removed

### Intentionally NOT changed
- `index.html`, `src/**`, `scripts/**`
- Pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`
- Standalone keepsake flows, Review view
- Live Claude hooks, subagents, skill packages
- No Google Calendar API implementation (planning docs only)
- Product roadmap content in `docs/project-control/` (Tower content unchanged)

---

## 2026-05-22 — AI Project OS Patch: Post-Commit State Rule

**Status:** COMPLETE — merged to main (`9be0f81` merge).
**Branch:** `docs/post-commit-state-rule`
**Scope:** AI Project OS process correction only — no product/app changes; Package 5A remains paused.

### Added (universal)
- `docs/ai-system/universal-standards.md` — new top-level section "Post-Commit State Rule" with full wording (seven numbered clauses, "what counts as misdirection" examples, "what does NOT justify a follow-up sync" examples)

### Updated (dev protocols — cross-links to the canonical rule)
- `docs/dev/package-boundary-closeout-protocol.md` — new "Post-Commit State Rule (applies to status sync decisions)" section after the existing "Status sync as a separate commit" section
- `docs/dev/session-restart-protocol.md` — new "HEAD verification at preflight (Post-Commit State Rule)" subsection under "Verification rules"
- `docs/dev/auto-management-protocol.md` — Post-Commit State Rule bound on Duty 1 (Maintain repo-native memory continuously) + new quick-reference row

### Updated (bootstrap)
- `docs/ai-system/bootstrap-template.md` — new § 8a confirming the rule travels to every repo bootstrapped from this OS

### Intentionally NOT changed (per scope limits)
- `index.html`, `src/**`, `scripts/**`
- `CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md` — the `main HEAD` value in these files lags by one commit (cosmetic only); under the new rule this is **not** a reason for a follow-up state-sync commit
- `docs/command-center/*`, `docs/project-control/*` — no conflicting wording was found
- Package 5A — remains paused

### Rule purpose

Prevent recursive state-sync loops where durable state files try to perfectly describe the commit that is currently being created. Commit hashes belong in post-commit reports and next-session preflight verification — not amended into the committed file itself.

### Universality

The rule applies to KeepMees, Puzzle, and every future repo bootstrapped from `docs/ai-system/bootstrap-template.md`.

---

## 2026-05-22 — Package 2.9: AI Project OS Auto-Management Upgrade Pass

**Status:** COMPLETE — merged to main.
**Branch:** `docs/ai-project-os-auto-management-upgrade`
**Implementation commit:** `81c5069` — docs: upgrade AI Project OS auto-management
**Merge commit:** `a20af30` — merge: upgrade AI Project OS auto-management
**main HEAD after merge:** `a20af30` (post-merge status sync follows on a separate branch)

**Scope (docs / config / infrastructure only — no app code):**

### Added (universal)
- `docs/ai-system/README.md` — entry point to the AI Project OS layer
- `docs/ai-system/universal-standards.md` — repo-agnostic standards
- `docs/ai-system/bootstrap-template.md` — reusable bootstrap pattern for future repos
- `docs/ai-system/CHANGELOG.md` — this file
- `docs/ai-system/version-history.md` — OS upgrade pass history

### Added (dev workflow)
- `docs/dev/auto-management-protocol.md` — umbrella protocol tying the OS together
- `docs/dev/model-routing-protocol.md` — which model for which task (distinct from model-switching)
- `docs/dev/token-efficiency-protocol.md` — context-cost discipline
- `docs/dev/context-budget-checklist.md` — short pre-flight checklist
- `docs/dev/tool-batching-protocol.md` — batching plan format and rules
- `docs/dev/package-boundary-closeout-protocol.md` — boundary closeout + fresh-session preference
- `docs/dev/notification-setup.md` — user-level permission notification setup (Windows / macOS / Linux)

### Added (QA)
- `docs/qa/test-strategy.md` — first-class testing strategy
- `docs/qa/package-verification-template.md` — per-package verification gate

### Added (placeholders)
- `.claude/commands/README.md` — readiness placeholder for custom slash commands (no live commands shipped)

### Updated (universal layer)
- `AGENTS.md` — protocol pointer table extended with Package 2.9 protocols; auto-management rule added
- `CLAUDE.md` — Package 2.9 protocol pointers; explicit guidance that long `claude --continue` of stale sessions is not the default
- `.codex/README.md` — Package 2.9 protocol pointers
- `.claude/agents/README.md` — cross-references updated
- `.claude/skills/README.md` — cross-references updated

### Updated (existing protocols)
- `docs/dev/context-hygiene-protocol.md` — high-uncached-context section (300k+ / 500k+ trigger) + fresh-session-from-repo-truth preference
- `docs/dev/model-switching-protocol.md` — cross-link to `model-routing-protocol.md`

### Updated (gitignore)
- `.gitignore` — added IDE/OS/log noise patterns (`*.log`, `.DS_Store`, `*.swp`/`*.swo`, `.idea/`, `.vscode/`), Codex defensive patterns

### Updated (PR template)
- `.github/PULL_REQUEST_TEMPLATE.md` — pointer additions for AI-OS protocol checks

### Updated (Project Control compatibility — light touches only)
- `docs/project-control/README.md` — note that `docs/ai-system/` is the universal OS home
- `docs/project-control/coordinator-weekly-sync.md` — weekly-log row for the 2026-05-22 sync

### Continuity files (Phase 3)
- `AI_HANDOFF.md` — Package 2.9 status snapshot
- `CURRENT_STATE.md` — refresh
- `NEXT_SESSION_PROMPT.md` — Package 2.9 pointer

### Intentionally NOT changed
- `index.html`, `src/**`, `scripts/**` (app/product code) — off limits for this pass
- `BOOK_PAGINATION_VERSION` and other scope-guarded constants
- Locked product, vendor, design, manufacturing decisions
- Live Claude hooks, live subagent YAML, live skill packages, live custom slash command files
- `.codex/config.toml`
- n8n / Make / Zapier flows
- Project Control Tower content (roadmap, backlog, kanban, gates — not rewritten)
- `docs/ops/` registers (deferred to a post-merge status sync; same pattern as Package 2.7 and 2.8)
- `docs/command-center/*` (deferred to the same post-merge status sync)
- Package 5A — remains paused

### Backlog created by this pass
See `version-history.md` row for Package 2.9 and the "Advanced backlog" section at the bottom of `docs/ai-system/version-history.md`.

---

## 2026-05-17 — Package 2.8: KeepMees Project Control Tower

(Pre-existing event; logged here for OS-layer continuity.)

OS-layer effect: introduced the live `docs/project-control/` Tower as the project's repo-native coordination layer. The Tower is project-specific (KeepMees roadmap, schedule, gates, etc.) and does not travel via the bootstrap template, but the *pattern* of having a Tower does. Documented in `docs/ai-system/bootstrap-template.md` § 6.

---

## 2026-05-17 — Package 2.7: AI Development Operating System Upgrade Pass

(Pre-existing event; logged here for OS-layer continuity.)

OS-layer effect: introduced `AGENTS.md` as the universal contract, `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` as durable continuity files, and the initial `docs/dev/` protocols (session-restart, context-hygiene, model-switching, tool-switching, scope-boundaries, worktree, Claude/Codex interchangeability). Pre-Package 2.9, these protocols existed but the AI System layer (`docs/ai-system/`) did not — Package 2.9 introduces that layer.

---

## How to add a new entry

Each entry should be self-contained: scope, what was added, what was updated, what was intentionally not changed, backlog created. New entries go at the top.

When an entry refers to commits, fill in the hashes at closeout, not before — placeholder hashes are misleading.
