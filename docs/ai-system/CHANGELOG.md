# AI Project OS — Changelog

**Status:** ACTIVE.
**Scope:** This changelog tracks changes to the **AI Project OS layer** of this repo — the agent operating system, the universal standards, the dev/QA protocols, the continuity files, and the AI-facing parts of `.claude/` / `.codex/` / `docs/automation/`.

It is **not** a product changelog. Product-level package history lives in `docs/ops/backlog-roadmap.md` and `docs/command-center/current-status.md`.

Newest entries first.

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
