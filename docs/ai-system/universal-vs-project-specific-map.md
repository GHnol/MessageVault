# AI Project OS — Universal vs. Project-Specific Asset Map

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Use:** Definitive table mapping every AI Project OS artifact to its portability classification. Consult before any copy-forward operation.

Column definitions:
- **Universal** — applies to any repo using this OS without modification
- **Project-specific** — applies to KeepMees only; must be rewritten for each repo
- **Local/private** — never committed; must never be copied between repos
- **Copy unchanged?** — can be copied from KeepMees without editing
- **Adapt?** — must be modified before use in a new repo
- **Never copy?** — must not be transferred to another repo under any circumstances

---

## Root continuity files

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `AGENTS.md` | partial | partial | | | yes | | Keep universal contract; replace project overview and scope guards |
| `CLAUDE.md` | partial | partial | | | yes | | Keep git rules, tool use; replace project-specific behavior and scope guards |
| `.codex/README.md` | partial | partial | | | yes | | Keep interchangeability section; replace account/repo details |
| `AI_HANDOFF.md` | skeleton | partial | | | yes (start fresh) | | Create from skeleton; do not inherit KeepMees in-flight state |
| `CURRENT_STATE.md` | skeleton | partial | | | yes (start fresh) | | Create from skeleton; populate with new project identity |
| `NEXT_SESSION_PROMPT.md` | skeleton | partial | | | yes (start fresh) | | Create from skeleton; point to first authorized work |

---

## AI System layer (`docs/ai-system/`)

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `README.md` | yes | partial | | | yes | | Replace project name; keep layer description |
| `universal-standards.md` | yes | | | yes | | | Fully universal; do not modify |
| `bootstrap-template.md` | yes | | | yes | | | Fully universal; do not modify |
| `CHANGELOG.md` | structure only | KeepMees history | | | yes (start fresh) | | Start fresh in new repo |
| `version-history.md` | structure only | KeepMees history | | | yes (start fresh) | | Start fresh in new repo |
| `os-self-audit-checklist.md` | yes | | | yes | | | Universal checklist; do not modify |
| `documentation-watch-policy.md` | yes | | | yes | | | Universal policy |
| `documentation-watch-sources.md` | yes | partial | | | yes (reset reviewed dates) | | Copy categories; reset Last reviewed / Current status |
| `documentation-watch-evaluation-template.md` | yes | | | yes | | | Universal template |
| `documentation-watch-log.md` | structure only | KeepMees log | | | yes (start fresh) | | Start fresh with establishment entry |
| `bootstrap-copy-forward-guide.md` | yes | | | yes | | | Universal guidance |
| `universal-vs-project-specific-map.md` | yes | | | yes | | | This file; fully universal |
| `future-repo-bootstrap-checklist.md` | yes | | | yes | | | Universal checklist |
| `puzzle-alignment-checklist.md` | | KeepMees→Puzzle | | | | never copy | KeepMees-Puzzle specific only |
| `v1-7-zero-fault-audit-plan.md` | | KeepMees-specific | | | | do not copy | KeepMees audit artifact only |

---

## Dev workflow protocols (`docs/dev/`)

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `auto-management-protocol.md` | yes | partial | | | yes | | Adapt scope guard examples; keep protocol intact |
| `agent-scope-boundaries.md` | yes | partial | | | yes | | Adapt KeepMees-specific scope guard list |
| `claude-codex-interchangeability.md` | yes | | | yes | | | |
| `closeout-sync-contract.md` | yes | | | yes | | | Universal contract |
| `context-budget-checklist.md` | yes | | | yes | | | |
| `context-hygiene-protocol.md` | yes | | | yes | | | |
| `model-routing-protocol.md` | yes | | | yes | | | Tier-based, not model-name-specific |
| `model-switching-protocol.md` | yes | | | yes | | | |
| `notification-setup.md` | yes | | | yes | | | |
| `package-boundary-closeout-protocol.md` | yes | partial | | | yes | | Remove Package 5B references in new repo |
| `session-restart-protocol.md` | yes | | | yes | | | |
| `token-efficiency-protocol.md` | yes | | | yes | | | |
| `tool-batching-protocol.md` | yes | | | yes | | | |
| `tool-switching-protocol.md` | yes | | | yes | | | |
| `worktree-and-parallel-session-policy.md` | yes | | | yes | | | |

---

## QA templates (`docs/qa/`)

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `manual-qa-template.md` | yes | | | yes | | | |
| `package-verification-template.md` | yes | | | yes | | | |
| `pre-commit-verification-template.md` | yes | | | yes | | | |
| `release-readiness-template.md` | yes | | | yes | | | |
| `test-strategy.md` | structure | KeepMees-specific | | | yes | | Adapt test framework, baseline, suite names |
| `e2e-regression-harness.md` | | KeepMees-specific | | | | do not copy | KeepMees app-specific |

---

## Project control docs (`docs/project-control/`)

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `README.md` | structure | partial | | | yes | | Adapt project name |
| `project-sync-policy.md` | yes | | | yes | | | |
| `project-sync-dry-run-format.md` | yes | | | yes | | | |
| `project-sync-source-schema.md` | yes | | | yes | | | |
| `external-sync-safety.md` | yes | | | yes | | | Universal safety rules |
| `external-sync-map.example.json` | yes | | | yes | | | Contains placeholder IDs only |
| `project-sync-log.md` | structure | KeepMees log | | | yes (start fresh) | | Start fresh |
| `external-sync-consistency-policy.md` | yes | | | yes | | | |
| `external-sync-consistency-schema.md` | yes | | | yes | | | |
| `external-sync-consistency-log.md` | structure | KeepMees log | | | yes (start fresh) | | Start fresh |
| `external-sync-consistency-fixture.example.json` | yes | partial | | | yes | | Adapt os_id prefix for new project |
| `github-projects-setup-policy.md` | yes | partial | | | yes | | Adapt owner/project name |
| `github-projects-source-schema.md` | yes | | | yes | | | |
| `github-projects-import-runbook.md` | yes | partial | | | yes | | Adapt project-specific references |
| `github-projects-field-map.example.json` | yes | partial | | | yes | | Update placeholder owner/repo |
| `github-projects-sync-log.md` | structure | KeepMees log | | | yes (start fresh) | | Start fresh |
| `github-projects-template-standard.md` | yes | | | yes | | | |
| `github-projects-template-copy-runbook.md` | yes | | | yes | | | |
| `github-projects-template-config.example.json` | yes | | | yes | | | Placeholder IDs only |
| `github-projects-source-records.json` | | KeepMees-specific | | | | start fresh | KeepMees issues only |
| `github-projects-source-records.example.json` | yes | | | yes | | | |
| `google-calendar-source-schema.md` | yes | | | yes | | | |
| `google-calendar-sync-policy.md` | yes | partial | | | yes | | Adapt project name, adoption rule |
| `google-calendar-sync-runbook.md` | yes | partial | | | yes | | Adapt project name |
| `google-calendar-credentials.example.md` | yes | | | yes | | | |
| `google-calendar-sync-log.md` | structure | KeepMees log | | | yes (start fresh) | | Start fresh |
| `google-calendar-source-records.json` | | KeepMees-specific | | | | start fresh | KeepMees events only |
| `report-mirror-policy.md` | yes | | | yes | | | |
| `report-mirror-schema.md` | yes | | | yes | | | |
| `report-mirror-log.md` | structure | KeepMees log | | | yes (start fresh) | | Start fresh |
| `report-intake-runbook.md` | yes | | | yes | | | |
| `master-roadmap.md` | | KeepMees-specific | | | | start fresh | Product phases specific to KeepMees |
| `master-schedule.md` | | KeepMees-specific | | | | start fresh | |
| `current-sprint.md` | structure | KeepMees-specific | | | | start fresh | |
| `kanban-board.md` | structure | KeepMees-specific | | | | start fresh | |
| `backlog.md` | structure | KeepMees-specific | | | | start fresh | |
| `decision-log.md` | structure | KeepMees-specific | | | | start fresh | |
| `risk-register.md` | structure | KeepMees-specific | | | | start fresh | |
| `shareable-status-summary.md` | structure | KeepMees-specific | | | | start fresh | |
| `phase-gates.md` | | KeepMees-specific | | | | start fresh | |
| `calendar-sync-policy.md` | structure | partial | | | yes | | Legacy; superseded by google-calendar-sync-policy |
| `external-sync-map.local.json` | | | yes (private) | | | never copy | Real external IDs |
| `google-calendar-credentials.local.json` | | | yes (private) | | | never copy | Real OAuth credentials |
| `google-calendar-token.local.json` | | | yes (private) | | | never copy | Real OAuth token |
| `github-projects-template-config.local.json` | | | yes (private) | | | never copy | Real template IDs |

---

## Skills and commands

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `.claude/skills/README.md` | yes | partial | | | yes | | Update skill count and roster |
| `.claude/commands/README.md` | yes | partial | | | yes | | Update command roster |
| `.claude/skills/start/SKILL.md` | yes | partial | | | yes | | Adapt scope guard examples |
| `.claude/skills/handoff/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/precommit/SKILL.md` | yes | partial | | | yes | | Adapt scope guard examples |
| `.claude/skills/closeout/SKILL.md` | yes | partial | | | yes | | Adapt scope guard examples |
| `.claude/skills/package-start/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/switch-to-codex/SKILL.md` | yes | partial | | | yes | | Adapt repo name |
| `.claude/skills/switch-to-claude/SKILL.md` | yes | partial | | | yes | | Adapt repo name |
| `.claude/skills/weekly-sync/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/status-summary/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/os-audit/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/project-sync-dry-run/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/project-sync-apply/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/notification-setup-wizard/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/start-router/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/report-intake/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/external-sync-consistency/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/github-project-setup/SKILL.md` | yes | partial | | | yes | | Adapt owner/project references |
| `.claude/skills/github-project-template/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/google-calendar-sync/SKILL.md` | yes | partial | | | yes | | Adapt project name, os_id prefix |
| `.claude/skills/documentation-watch/SKILL.md` | yes | | | yes | | | |
| `.claude/skills/bootstrap-copy-forward/SKILL.md` | yes | | | yes | | | |
| All `.claude/commands/*.md` | yes | partial | | | yes | | Thin wrappers; adapt project name if referenced |
| `.claude/agents/README.md` | yes | | | yes | | | |

---

## Scripts

| Artifact | Universal | Project-specific | Local/private | Copy unchanged? | Adapt? | Never copy? | Notes |
|---|---|---|---|---|---|---|---|
| `scripts/os-self-audit.mjs` | yes | | | yes | | | Reads state dynamically |
| `scripts/start-router.mjs` | yes | partial | | | yes | | Adapt Package 5B reference, KeepMees state paths |
| `scripts/state-freshness-check.mjs` | yes | partial | | | yes | | Adapt Package 5B reference, test baseline |
| `scripts/report-mirror-intake.mjs` | yes | | | yes | | | |
| `scripts/external-sync-consistency-check.mjs` | yes | | | yes | | | |
| `scripts/project-control-sync-validate.mjs` | yes | partial | | | yes | | Adapt doc list |
| `scripts/project-control-sync-dry-run.mjs` | yes | partial | | | yes | | Adapt doc list |
| `scripts/setup-claude-notification.ps1` | yes | | | yes | | | |
| `scripts/documentation-watch-check.mjs` | yes | | | yes | | | |
| `scripts/bootstrap-copy-forward-audit.mjs` | yes | | | yes | | | |
| `scripts/google-calendar-source-validate.mjs` | yes | | | yes | | | |
| `scripts/google-calendar-sync-dry-run.mjs` | yes | partial | | | yes | | Adapt calendar domain |
| `scripts/google-calendar-sync-apply.mjs` | yes | | | yes | | | |
| `scripts/generate-project-calendar.mjs` | yes | partial | | | yes | | Adapt CALENDAR_DOMAIN, CALENDAR_NAME |
| `scripts/google-calendar-auth-bootstrap.mjs` | yes | | | yes | | | |
| `scripts/github-project-setup-dry-run.mjs` | yes | | | yes | | | |
| `scripts/github-project-setup-apply.mjs` | yes | | | yes | | | |
| `scripts/github-project-import-issues.mjs` | yes | | | yes | | | |
| `scripts/github-project-sync-status.mjs` | yes | | | yes | | | |
| `scripts/github-project-field-map.mjs` | yes | | | yes | | | |
| `scripts/github-project-template-dry-run.mjs` | yes | | | yes | | | |
| `scripts/github-project-template-validate.mjs` | yes | | | yes | | | |
| `scripts/github-project-template-apply.mjs` | yes | | | yes | | | |
| `scripts/lib/github-projects-client.mjs` | yes | | | yes | | | |
| `scripts/node_modules/` | | | yes (private) | | | never copy | Locally installed; regenerate per machine |

---

## Local/private files — never copy

| Artifact | Classification | Why |
|---|---|---|
| `docs/project-control/external-sync-map.local.json` | Local/private | Real external IDs (GCal eventIds, GHP item IDs) |
| `docs/project-control/google-calendar-credentials.local.json` | Local/private | OAuth client credentials |
| `docs/project-control/google-calendar-token.local.json` | Local/private | OAuth token |
| `docs/project-control/github-projects-template-config.local.json` | Local/private | Real template project IDs |
| `local-sync-reports/*.json` | Local/private | Dry-run artifacts |
| `local-report-intake/*.md` | Local/private | Intake staging files |
| `raw-transcripts/` | Local/private | Session transcripts |
| `.claude/settings.local.json` | Local/private | User-level Claude config |
| `CLAUDE.local.md` | Local/private | User-level Claude override |
| `.codex/config.local.toml` | Local/private | Codex local config |
| `.env`, `*.local.env` | Local/private | Environment variables and secrets |

These are enforced by `.gitignore`. Verify gitignore coverage before any copy-forward operation.
