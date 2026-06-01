# AI Project OS — Future Repo Bootstrap Checklist

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Use:** Step-by-step checklist for bootstrapping the AI Project OS into any new serious repo. Supplement to `docs/ai-system/bootstrap-template.md`.

---

## Pre-flight

Before touching the new repo:

- [ ] Coordinator has explicitly authorized the bootstrap
- [ ] Git identity for the new repo confirmed (`git config user.name` / `user.email`)
- [ ] New repo remote confirmed (`git remote -v`)
- [ ] Branch created: `docs/bootstrap-ai-project-os`
- [ ] Decided: project name, flagship product, first authorized work
- [ ] Decided: GitHub Projects (required), Google Calendar sync (optional), ClickUp (optional)
- [ ] Run a documentation-watch review if any source category has changed since the last review

---

## Required files

### 1. Root agent layer

- [ ] `AGENTS.md` — adapted from KeepMees template; KeepMees project overview replaced; universal contract intact
- [ ] `CLAUDE.md` — adapted; project-specific scope guards and git identity replaced; universal rules intact
- [ ] `.codex/README.md` — adapted; account/repo details replaced; interchangeability section intact
- [ ] `AI_HANDOFF.md` — skeleton; status: idle; no active package
- [ ] `CURRENT_STATE.md` — skeleton; project identity section filled; gates table empty
- [ ] `NEXT_SESSION_PROMPT.md` — skeleton; pointer to first authorized work

### 2. AI System layer (`docs/ai-system/`)

- [ ] `README.md` — adapted project name
- [ ] `universal-standards.md` — copied unchanged
- [ ] `bootstrap-template.md` — copied unchanged
- [ ] `CHANGELOG.md` — started fresh; first entry: "AI Project OS bootstrapped"
- [ ] `version-history.md` — started fresh; row 1: bootstrap commit
- [ ] `os-self-audit-checklist.md` — copied unchanged
- [ ] `documentation-watch-policy.md` — copied unchanged
- [ ] `documentation-watch-sources.md` — copied; Last reviewed reset to "not reviewed" for new repo
- [ ] `documentation-watch-evaluation-template.md` — copied unchanged
- [ ] `documentation-watch-log.md` — started fresh; establishment entry for new repo
- [ ] `bootstrap-copy-forward-guide.md` — copied unchanged
- [ ] `universal-vs-project-specific-map.md` — copied unchanged
- [ ] `future-repo-bootstrap-checklist.md` — copied unchanged (this file)

### 3. Dev workflow protocols (`docs/dev/`)

Copy all; adapt project-specific references only:
- [ ] `auto-management-protocol.md`
- [ ] `agent-scope-boundaries.md`
- [ ] `claude-codex-interchangeability.md`
- [ ] `closeout-sync-contract.md`
- [ ] `context-budget-checklist.md`
- [ ] `context-hygiene-protocol.md`
- [ ] `model-routing-protocol.md`
- [ ] `model-switching-protocol.md`
- [ ] `notification-setup.md`
- [ ] `package-boundary-closeout-protocol.md`
- [ ] `session-restart-protocol.md`
- [ ] `token-efficiency-protocol.md`
- [ ] `tool-batching-protocol.md`
- [ ] `tool-switching-protocol.md`
- [ ] `worktree-and-parallel-session-policy.md`

### 4. QA templates (`docs/qa/`)

Copy all; adapt test runner if needed:
- [ ] `manual-qa-template.md`
- [ ] `package-verification-template.md`
- [ ] `pre-commit-verification-template.md`
- [ ] `release-readiness-template.md`
- [ ] `test-strategy.md`

### 5. Skills (minimum required)

- [ ] `.claude/skills/start/SKILL.md` — with YAML frontmatter
- [ ] `.claude/skills/handoff/SKILL.md`
- [ ] `.claude/skills/precommit/SKILL.md`
- [ ] `.claude/skills/closeout/SKILL.md`
- [ ] `.claude/skills/package-start/SKILL.md`
- [ ] `.claude/skills/switch-to-codex/SKILL.md`
- [ ] `.claude/skills/switch-to-claude/SKILL.md`
- [ ] `.claude/skills/weekly-sync/SKILL.md`
- [ ] `.claude/skills/status-summary/SKILL.md`
- [ ] `.claude/skills/os-audit/SKILL.md`
- [ ] `.claude/skills/project-sync-dry-run/SKILL.md`
- [ ] `.claude/skills/project-sync-apply/SKILL.md`
- [ ] `.claude/skills/notification-setup-wizard/SKILL.md`
- [ ] `.claude/skills/start-router/SKILL.md`
- [ ] `.claude/skills/report-intake/SKILL.md`
- [ ] `.claude/skills/external-sync-consistency/SKILL.md`
- [ ] `.claude/skills/documentation-watch/SKILL.md`
- [ ] `.claude/skills/bootstrap-copy-forward/SKILL.md`
- [ ] `.claude/skills/README.md` — updated roster

### 6. Commands (thin wrappers for all skills)

- [ ] `.claude/commands/start.md`
- [ ] `.claude/commands/handoff.md`
- [ ] `.claude/commands/precommit.md`
- [ ] `.claude/commands/closeout.md`
- [ ] `.claude/commands/package-start.md`
- [ ] `.claude/commands/switch-to-codex.md`
- [ ] `.claude/commands/switch-to-claude.md`
- [ ] `.claude/commands/weekly-sync.md`
- [ ] `.claude/commands/status-summary.md`
- [ ] `.claude/commands/os-audit.md`
- [ ] `.claude/commands/project-sync-dry-run.md`
- [ ] `.claude/commands/project-sync-apply.md`
- [ ] `.claude/commands/notification-setup-wizard.md`
- [ ] `.claude/commands/start-router.md`
- [ ] `.claude/commands/report-intake.md`
- [ ] `.claude/commands/external-sync-consistency.md`
- [ ] `.claude/commands/documentation-watch.md`
- [ ] `.claude/commands/bootstrap-copy-forward.md`
- [ ] `.claude/commands/README.md` — updated roster

### 7. Scripts (required validators)

- [ ] `scripts/os-self-audit.mjs`
- [ ] `scripts/start-router.mjs`
- [ ] `scripts/state-freshness-check.mjs`
- [ ] `scripts/report-mirror-intake.mjs`
- [ ] `scripts/external-sync-consistency-check.mjs`
- [ ] `scripts/project-control-sync-validate.mjs`
- [ ] `scripts/project-control-sync-dry-run.mjs`
- [ ] `scripts/setup-claude-notification.ps1`
- [ ] `scripts/documentation-watch-check.mjs`
- [ ] `scripts/bootstrap-copy-forward-audit.mjs`

### 8. GitHub layer

- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — adapted from KeepMees

### 9. Gitignore protections

- [ ] `.gitignore` — universal block in place (see `bootstrap-template.md` § 8)
- [ ] `.claude/settings.local.json` — gitignored
- [ ] `external-sync-map.local.json` — gitignored
- [ ] `local-sync-reports/` — gitignored
- [ ] `local-report-intake/` — gitignored
- [ ] `raw-transcripts/` — gitignored
- [ ] `scripts/node_modules/` — gitignored
- [ ] `token.json`, `**/token.json` — gitignored

---

## Optional external sync adapters

### GitHub Projects (required first external board)

GitHub Projects is the **default external board provider** for any AI Project OS repo.

- [ ] `docs/project-control/github-projects-setup-policy.md` — adapted
- [ ] `docs/project-control/github-projects-source-schema.md` — copied
- [ ] `docs/project-control/github-projects-import-runbook.md` — adapted
- [ ] `docs/project-control/github-projects-field-map.example.json` — adapted placeholder owner/repo
- [ ] `docs/project-control/github-projects-sync-log.md` — started fresh
- [ ] `docs/project-control/github-projects-template-standard.md` — copied
- [ ] `docs/project-control/github-projects-template-copy-runbook.md` — copied
- [ ] `docs/project-control/github-projects-template-config.example.json` — copied
- [ ] `docs/project-control/github-projects-source-records.json` — started fresh with new project issues
- [ ] All GitHub Projects scripts — copied
- [ ] `scripts/lib/github-projects-client.mjs` — copied
- [ ] `.claude/skills/github-project-setup/SKILL.md` — adapted
- [ ] `.claude/skills/github-project-template/SKILL.md` — copied
- [ ] All GitHub commands — copied

### Google Calendar live sync (optional — only when calendar coordination needed)

- [ ] `docs/project-control/google-calendar-source-schema.md` — copied
- [ ] `docs/project-control/google-calendar-sync-policy.md` — adapted project name
- [ ] `docs/project-control/google-calendar-sync-runbook.md` — adapted
- [ ] `docs/project-control/google-calendar-credentials.example.md` — copied
- [ ] `docs/project-control/google-calendar-sync-log.md` — started fresh
- [ ] `docs/project-control/google-calendar-source-records.json` — started fresh with new project events and new os_id prefix
- [ ] All Google Calendar scripts — copied; adapt `CALENDAR_DOMAIN`, `CALENDAR_NAME`, os_id prefix
- [ ] `.claude/skills/google-calendar-sync/SKILL.md` — adapted
- [ ] Gitignore additions for credentials and token variants

### ClickUp (optional adapter)

- [ ] `docs/project-control/clickup-setup-policy.md` — adapted if ClickUp is used
- [ ] ClickUp-specific gitignore additions

---

## No-secret rules

At every stage, verify:

- [ ] No real API tokens, OAuth tokens, or credentials in any committed file
- [ ] No real external system IDs (GCal eventIds, GHP item IDs, ClickUp task IDs) in any committed file
- [ ] No personal email addresses in committed configs
- [ ] `git check-ignore -v` passes for all private file patterns

---

## Setup order

1. Pre-flight and branch
2. Root agent layer (AGENTS.md, CLAUDE.md, continuity files)
3. AI System layer (`docs/ai-system/`)
4. Dev protocols and QA templates
5. Skills and commands
6. Scripts
7. GitHub layer and gitignore
8. GitHub Projects setup (required)
9. Google Calendar setup (if applicable)
10. First commit

---

## Verification order

Before claiming bootstrap complete:

1. `node --check` all scripts
2. `node scripts/documentation-watch-check.mjs` — 0 failures
3. `node scripts/bootstrap-copy-forward-audit.mjs` — 0 failures
4. `node scripts/os-self-audit.mjs` — BOOTSTRAP COMPLETE, 0 failures
5. `node scripts/state-freshness-check.mjs` — 0 FAILs
6. `node scripts/project-control-sync-validate.mjs` — VALID
7. `git check-ignore -v` for all private file patterns
8. `git diff -- <product-code-path>` — empty (no product code touched)
9. Fresh agent test: a new Claude Code session should be able to read AGENTS.md → tool layer → AI_HANDOFF.md → CURRENT_STATE.md and declare what to do next

---

## First commit recommendation

```
docs: bootstrap AI Project OS

- universal agent contract (AGENTS.md, CLAUDE.md, .codex/README.md)
- continuity files (AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md)
- AI system layer (README, universal standards, bootstrap template, changelog, version history, docs-watch, copy-forward)
- dev workflow protocols
- QA templates
- skills and command wrappers
- validators (os-self-audit.mjs, start-router.mjs, state-freshness-check.mjs, etc.)
- PR template + gitignore protections
```

Do not push or merge without explicit Coordinator instruction.

---

## OS self-audit requirement

Run `node scripts/os-self-audit.mjs` and verify `BOOTSTRAP COMPLETE` with 0 failures before claiming the bootstrap is complete. The audit is the definitive check — checklist items above are the setup sequence; the audit is the gate.

---

## Documentation-watch requirement

Before copying Bootstrap Core into a new serious repo, run a documentation-watch review. Check if any source categories have had significant changes since the last review. If ADOPT items are found, implement them in a dedicated OS upgrade pass before completing the bootstrap.
