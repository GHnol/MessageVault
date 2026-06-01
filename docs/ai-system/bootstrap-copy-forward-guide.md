# AI Project OS — Bootstrap Copy-Forward Guide

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Use:** Definitive copy-forward guidance for bringing AI Project OS from KeepMees (the reference implementation) into Puzzle or any future serious repo. Read this before any copy-forward operation.

---

## Purpose

KeepMees / MessageVault is the reference implementation of the AI Project OS. This guide defines exactly what copies unchanged, what must be adapted per-repo, and what must never be copied. It prevents KeepMees project state, calendar events, product scope guards, and local credentials from accidentally leaking into Puzzle or future repos.

See `docs/ai-system/universal-vs-project-specific-map.md` for the full artifact table.
See `docs/ai-system/puzzle-alignment-checklist.md` for Puzzle-specific alignment work.
See `docs/ai-system/future-repo-bootstrap-checklist.md` for the step-by-step bootstrap sequence.

---

## Universal assets — copy unchanged (or nearly unchanged)

These assets travel to every repo bootstrapped from this OS. Copy them from KeepMees and adapt only where explicitly noted.

### AI System layer
- `docs/ai-system/README.md` — adapt: replace KeepMees name; keep layer description intact
- `docs/ai-system/universal-standards.md` — **copy unchanged** (repo-agnostic; remove nothing)
- `docs/ai-system/bootstrap-template.md` — **copy unchanged**
- `docs/ai-system/CHANGELOG.md` — **start fresh** in new repo; do not copy KeepMees history
- `docs/ai-system/version-history.md` — **start fresh** in new repo
- `docs/ai-system/os-self-audit-checklist.md` — **copy unchanged** (checklist is universal)
- `docs/ai-system/documentation-watch-policy.md` — **copy unchanged** (policy is universal)
- `docs/ai-system/documentation-watch-sources.md` — copy and reset `Last reviewed` to "not reviewed" for the new repo
- `docs/ai-system/documentation-watch-evaluation-template.md` — **copy unchanged**
- `docs/ai-system/documentation-watch-log.md` — **start fresh** with a single establishment entry for the new repo
- `docs/ai-system/bootstrap-copy-forward-guide.md` — **copy unchanged**
- `docs/ai-system/universal-vs-project-specific-map.md` — **copy unchanged**
- `docs/ai-system/future-repo-bootstrap-checklist.md` — **copy unchanged**
- `docs/ai-system/puzzle-alignment-checklist.md` — **do not copy** (KeepMees→Puzzle specific)

### Dev workflow protocols (copy all, adapt project-specific names only)
- `docs/dev/auto-management-protocol.md` — adapt: replace KeepMees-specific scope guards in examples
- `docs/dev/agent-scope-boundaries.md`
- `docs/dev/claude-codex-interchangeability.md`
- `docs/dev/closeout-sync-contract.md` — copy unchanged
- `docs/dev/context-budget-checklist.md`
- `docs/dev/context-hygiene-protocol.md`
- `docs/dev/model-routing-protocol.md` — copy unchanged (tier-based, not model-name-specific)
- `docs/dev/model-switching-protocol.md`
- `docs/dev/notification-setup.md`
- `docs/dev/package-boundary-closeout-protocol.md` — adapt: remove Package 5B references
- `docs/dev/session-restart-protocol.md`
- `docs/dev/token-efficiency-protocol.md`
- `docs/dev/tool-batching-protocol.md`
- `docs/dev/tool-switching-protocol.md`
- `docs/dev/worktree-and-parallel-session-policy.md`

### QA templates (copy all, adapt test runner if needed)
- `docs/qa/manual-qa-template.md`
- `docs/qa/package-verification-template.md`
- `docs/qa/pre-commit-verification-template.md`
- `docs/qa/release-readiness-template.md`
- `docs/qa/test-strategy.md` — adapt: update test framework, baseline count, suite names

### Skills (canonical protocol layer)
Copy all `.claude/skills/*/SKILL.md` files. These are universal workflows. Adapt only where skill content names KeepMees-specific files:
- `start`, `handoff`, `precommit`, `closeout`, `package-start` — adapt scope guard examples
- `switch-to-codex`, `switch-to-claude` — adapt repo name
- `weekly-sync`, `status-summary`, `os-audit` — adapt project name
- `project-sync-dry-run`, `project-sync-apply`, `notification-setup-wizard` — copy unchanged
- `start-router` — copy unchanged (reads repo state dynamically)
- `report-intake` — copy unchanged
- `external-sync-consistency` — copy unchanged
- `github-project-setup`, `github-project-template` — adapt owner/repo name
- `google-calendar-sync` — adapt project name and os_id prefix
- `documentation-watch`, `bootstrap-copy-forward` — **copy unchanged**

### Commands (thin wrappers — copy all, near-unchanged)
All `.claude/commands/*.md` files. Adapt: replace KeepMees name in descriptions. The command files themselves are minimal; the skills contain the substance.

### Scripts (copy all that are universal)
- `scripts/os-self-audit.mjs` — copy unchanged; it reads state dynamically
- `scripts/start-router.mjs` — adapt: Package 5B reference, KeepMees-specific state file expectations
- `scripts/state-freshness-check.mjs` — adapt: Package 5B reference, test baseline count
- `scripts/report-mirror-intake.mjs` — **copy unchanged**
- `scripts/external-sync-consistency-check.mjs` — **copy unchanged**
- `scripts/project-control-sync-validate.mjs` — copy and adapt project-control doc list
- `scripts/project-control-sync-dry-run.mjs` — copy and adapt project-control doc list
- `scripts/setup-claude-notification.ps1` — **copy unchanged**
- `scripts/documentation-watch-check.mjs` — **copy unchanged**
- `scripts/bootstrap-copy-forward-audit.mjs` — **copy unchanged**
- GitHub Projects scripts (`github-project-*.mjs`) — **copy unchanged** (config-driven)
- Google Calendar scripts — copy and adapt `CALENDAR_DOMAIN`, `CALENDAR_NAME`, os_id prefix; start with no source records

### Gitignore (copy core block, append project-specific entries)
The universal block from `docs/ai-system/bootstrap-template.md` § 8 covers:
- Claude/Codex local settings
- Secrets and credentials
- Generated artifacts and local reports
- OS noise (`.DS_Store`, `*.log`, IDE files)
- Dependencies (`node_modules/`)
- AI Project OS private paths (`external-sync-map.local.json`, `local-sync-reports/`, `raw-transcripts/`, `local-report-intake/`)

---

## Project-specific assets — must be adapted per repo

These files exist in KeepMees but contain KeepMees-specific product scope, project identities, calendar events, or task lists. Do not copy them wholesale — create new versions for the target repo.

| File | Why it must be adapted |
|---|---|
| `AGENTS.md` | Contains KeepMees project overview, scope guards, locked truths |
| `CLAUDE.md` | Contains KeepMees-specific behavior rules, git identity, scope guards |
| `.codex/README.md` | Contains KeepMees account/repo details |
| `AI_HANDOFF.md` | Contains KeepMees in-flight state; start fresh |
| `CURRENT_STATE.md` | Contains KeepMees project snapshot; start fresh |
| `NEXT_SESSION_PROMPT.md` | Contains KeepMees-specific restart pointer; start fresh |
| `docs/project-control/current-sprint.md` | KeepMees sprint tasks |
| `docs/project-control/kanban-board.md` | KeepMees cards and history |
| `docs/project-control/backlog.md` | KeepMees product backlog |
| `docs/project-control/master-roadmap.md` | KeepMees phases and milestones |
| `docs/project-control/master-schedule.md` | KeepMees schedule dates |
| `docs/project-control/decision-log.md` | KeepMees decisions |
| `docs/project-control/risk-register.md` | KeepMees risks |
| `docs/project-control/google-calendar-source-records.json` | KeepMees calendar events; start fresh |
| `docs/project-control/github-projects-source-records.json` | KeepMees GitHub issues; start fresh |
| `docs/project-control/google-calendar-sync-log.md` | KeepMees sync history; start fresh |
| `docs/project-control/github-projects-sync-log.md` | KeepMees sync history; start fresh |
| `docs/ai-system/v1-7-zero-fault-audit-plan.md` | KeepMees-specific v1.7 audit plan; archive only |
| `docs/ai-system/puzzle-alignment-checklist.md` | KeepMees→Puzzle specific; do not copy to other repos |
| `docs/command-center/current-status.md` | KeepMees package delivery history |
| `keepmees-project-calendar.ics` | KeepMees generated ICS; generate fresh per project |

---

## Local/private assets — must NEVER be copied

These files are gitignored and must never be committed to any repo or transferred between repos:

| File | Why |
|---|---|
| `docs/project-control/external-sync-map.local.json` | Contains real external system IDs for KeepMees |
| `docs/project-control/google-calendar-credentials.local.json` | KeepMees OAuth client credentials |
| `docs/project-control/google-calendar-token.local.json` | KeepMees OAuth token |
| `docs/project-control/github-projects-template-config.local.json` | KeepMees real template IDs |
| `local-sync-reports/*.json` | KeepMees dry-run artifacts |
| `local-report-intake/*.md` | KeepMees local intake staging |
| `raw-transcripts/` | KeepMees session transcripts |
| `scripts/node_modules/` | Locally installed dependencies |
| `.claude/settings.local.json` | User-level Claude config |
| `CLAUDE.local.md` | User-level Claude override |

**Rule:** If a file contains real external system IDs, OAuth tokens, real API credentials, or per-user config, it must never be copied to another repo. This is a hard safety rule — not a recommendation.

---

## What each copy-forward operation requires

Before starting any copy-forward operation:

1. Run `/os-audit` on KeepMees — confirm `BOOTSTRAP COMPLETE` with 0 failures.
2. Run `node scripts/bootstrap-copy-forward-audit.mjs` — confirm all universal files exist.
3. Run a documentation-watch review on the sources most likely to have changed.
4. Create the target repo with a fresh `AGENTS.md`, `CLAUDE.md`, and continuity files.
5. Copy universal assets from the list above.
6. Start a new CHANGELOG and version-history in the target repo.
7. Run `node scripts/os-self-audit.mjs` in the target repo — confirm bootstrap complete.
8. Do not push or merge the bootstrap branch until audit passes.

---

## Puzzle-specific alignment

See `docs/ai-system/puzzle-alignment-checklist.md` for what Puzzle already has, what it still needs from v1.6 and v1.7, and what must not be inherited from KeepMees.

---

## Related files

| File | Purpose |
|---|---|
| `docs/ai-system/universal-vs-project-specific-map.md` | Full artifact table: universal vs. project-specific vs. never-copy |
| `docs/ai-system/puzzle-alignment-checklist.md` | Puzzle-specific alignment work |
| `docs/ai-system/future-repo-bootstrap-checklist.md` | Step-by-step bootstrap sequence for any new repo |
| `docs/ai-system/bootstrap-template.md` | Original bootstrap provisioning pattern |
| `docs/ai-system/documentation-watch-policy.md` | Docs-watch review required before copy-forward |
| `scripts/bootstrap-copy-forward-audit.mjs` | Script validating copy-forward readiness |
