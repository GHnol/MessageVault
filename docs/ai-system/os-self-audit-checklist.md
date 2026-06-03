# AI Project OS Self-Audit Checklist

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24; updated in v1.3 External Board Provider Update, 2026-05-25; Section 6c added in v1.4 Live Provisioning Integration, 2026-05-25; Section 6d added in v1.5 Template GitHub Project Standard, 2026-05-26; Section 6e added in v1.6 Google Calendar Live Sync, 2026-05-30; Section 6f added in v1.7 Gate 2 State Freshness Validators, 2026-06-01; Section 6g added in v1.7 Gate 3 Report Mirroring, 2026-06-01; Section 6h added in v1.7 Gate 4 Start Router, 2026-06-01; Section 6i added in v1.7 Gate 5 External Sync Consistency Validators, 2026-06-01; Section 6j added in v1.7 Gate 6 Documentation-Watch and Bootstrap Copy-Forward Finalization, 2026-06-01; Section 6k added in Operator Reliability Repair 2026-06-02; Section 6l added in v1.8 State-Zero Bootstrap Finalization 2026-06-03)
**Use:** Run this checklist (via `/os-audit` or `scripts/os-self-audit.mjs`) before claiming a repo is fully bootstrapped with the AI Project OS.

Each item is classified as **Required** (FAIL if missing) or **Recommended** (WARN if missing).

---

## 1. Root continuity files

| Item | Classification | Check |
|---|---|---|
| `AGENTS.md` exists and is non-empty | Required | `Glob AGENTS.md` |
| `CLAUDE.md` exists and is non-empty | Required | `Glob CLAUDE.md` |
| `AI_HANDOFF.md` exists and has a Status field | Required | `Read AI_HANDOFF.md` |
| `CURRENT_STATE.md` exists and has a State table | Required | `Read CURRENT_STATE.md` |
| `NEXT_SESSION_PROMPT.md` exists and has a Current pointer table | Required | `Read NEXT_SESSION_PROMPT.md` |

---

## 2. Tool layer files

| Item | Classification | Check |
|---|---|---|
| `.claude/commands/README.md` exists | Required | `Glob .claude/commands/README.md` |
| `.claude/commands/start.md` exists | Required | `Glob .claude/commands/start.md` |
| `.claude/commands/handoff.md` exists | Required | `Glob .claude/commands/handoff.md` |
| `.claude/commands/precommit.md` exists | Required | `Glob .claude/commands/precommit.md` |
| `.claude/commands/closeout.md` exists | Required | `Glob .claude/commands/closeout.md` |
| `.claude/commands/package-start.md` exists | Required | `Glob .claude/commands/package-start.md` |
| `.claude/commands/switch-to-codex.md` exists | Required | `Glob .claude/commands/switch-to-codex.md` |
| `.claude/commands/switch-to-claude.md` exists | Required | `Glob .claude/commands/switch-to-claude.md` |
| `.claude/commands/weekly-sync.md` exists | Required | `Glob .claude/commands/weekly-sync.md` |
| `.claude/commands/status-summary.md` exists | Required | `Glob .claude/commands/status-summary.md` |
| `.claude/commands/os-audit.md` exists | Required | `Glob .claude/commands/os-audit.md` |
| `.claude/commands/project-sync-dry-run.md` exists | Required | `Glob .claude/commands/project-sync-dry-run.md` |
| `.claude/commands/project-sync-apply.md` exists | Required | `Glob .claude/commands/project-sync-apply.md` |
| `.claude/commands/notification-setup-wizard.md` exists | Required | `Glob .claude/commands/notification-setup-wizard.md` |
| `.codex/README.md` exists | Required | `Glob .codex/README.md` |

---

## 3. Skills (canonical layer)

| Item | Classification | Check |
|---|---|---|
| `.claude/skills/start/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/start/SKILL.md` |
| `.claude/skills/handoff/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/handoff/SKILL.md` |
| `.claude/skills/precommit/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/precommit/SKILL.md` |
| `.claude/skills/closeout/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/closeout/SKILL.md` |
| `.claude/skills/package-start/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/package-start/SKILL.md` |
| `.claude/skills/switch-to-codex/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/switch-to-codex/SKILL.md` |
| `.claude/skills/switch-to-claude/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/switch-to-claude/SKILL.md` |
| `.claude/skills/weekly-sync/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/weekly-sync/SKILL.md` |
| `.claude/skills/status-summary/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/status-summary/SKILL.md` |
| `.claude/skills/os-audit/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/os-audit/SKILL.md` |
| `.claude/skills/project-sync-dry-run/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/project-sync-dry-run/SKILL.md` |
| `.claude/skills/project-sync-apply/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/project-sync-apply/SKILL.md` |
| `.claude/skills/notification-setup-wizard/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/notification-setup-wizard/SKILL.md` |

---

## 4. AI System layer

| Item | Classification | Check |
|---|---|---|
| `docs/ai-system/README.md` exists | Required | `Glob docs/ai-system/README.md` |
| `docs/ai-system/universal-standards.md` exists | Required | `Glob docs/ai-system/universal-standards.md` |
| `docs/ai-system/bootstrap-template.md` exists | Required | `Glob docs/ai-system/bootstrap-template.md` |
| `docs/ai-system/CHANGELOG.md` exists with at least one entry | Required | `Read docs/ai-system/CHANGELOG.md` |
| `docs/ai-system/version-history.md` exists with at least one row | Required | `Read docs/ai-system/version-history.md` |
| `docs/ai-system/os-self-audit-checklist.md` exists (this file) | Required | `Glob docs/ai-system/os-self-audit-checklist.md` |

---

## 5. Dev protocols

| Item | Classification | Check |
|---|---|---|
| `docs/dev/auto-management-protocol.md` exists | Required | `Glob docs/dev/auto-management-protocol.md` |
| `docs/dev/package-boundary-closeout-protocol.md` exists | Required | `Glob docs/dev/package-boundary-closeout-protocol.md` |
| `docs/dev/session-restart-protocol.md` exists | Required | `Glob docs/dev/session-restart-protocol.md` |
| `docs/dev/closeout-sync-contract.md` exists | Required | `Glob docs/dev/closeout-sync-contract.md` |
| `docs/dev/notification-setup.md` exists | Required | `Glob docs/dev/notification-setup.md` |
| `docs/dev/model-routing-protocol.md` exists | Recommended | `Glob docs/dev/model-routing-protocol.md` |
| `docs/dev/token-efficiency-protocol.md` exists | Recommended | `Glob docs/dev/token-efficiency-protocol.md` |
| `docs/dev/tool-batching-protocol.md` exists | Recommended | `Glob docs/dev/tool-batching-protocol.md` |

---

## 6. Project control sync foundation

| Item | Classification | Check |
|---|---|---|
| `docs/project-control/project-sync-policy.md` exists | Required | `Glob docs/project-control/project-sync-policy.md` |
| `docs/project-control/project-sync-dry-run-format.md` exists | Required | `Glob docs/project-control/project-sync-dry-run-format.md` |
| `docs/project-control/external-sync-safety.md` exists | Required | `Glob docs/project-control/external-sync-safety.md` |
| `docs/project-control/external-sync-map.example.json` exists | Required | `Glob docs/project-control/external-sync-map.example.json` |
| `docs/project-control/project-sync-log.md` exists | Required | `Glob docs/project-control/project-sync-log.md` |
| `docs/project-control/calendar-sync-policy.md` exists | Required | `Glob docs/project-control/calendar-sync-policy.md` |

---

## 6b. GitHub Projects default board provider layer (AI Project OS v1.3)

Required when the repo has been updated to AI Project OS v1.3 or later.

| Item | Classification | Check |
|---|---|---|
| `docs/project-control/github-projects-setup-policy.md` exists | Required | `Glob docs/project-control/github-projects-setup-policy.md` |
| `docs/project-control/github-projects-source-schema.md` exists | Required | `Glob docs/project-control/github-projects-source-schema.md` |
| `docs/project-control/github-projects-import-runbook.md` exists | Required | `Glob docs/project-control/github-projects-import-runbook.md` |
| `docs/project-control/github-projects-field-map.example.json` exists | Required | `Glob docs/project-control/github-projects-field-map.example.json` |
| `docs/project-control/github-projects-sync-log.md` exists | Required | `Glob docs/project-control/github-projects-sync-log.md` |
| `.claude/skills/github-project-setup/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/github-project-setup/SKILL.md` |
| `.claude/commands/github-project-setup.md` exists | Required | `Glob .claude/commands/github-project-setup.md` |
| `scripts/github-project-setup-dry-run.mjs` exists | Required | `Glob scripts/github-project-setup-dry-run.mjs` |
| `scripts/github-project-setup-apply.mjs` exists | Required | `Glob scripts/github-project-setup-apply.mjs` |
| `scripts/github-project-import-issues.mjs` exists | Required | `Glob scripts/github-project-import-issues.mjs` |
| `scripts/github-project-sync-status.mjs` exists | Required | `Glob scripts/github-project-sync-status.mjs` |
| `scripts/github-project-field-map.mjs` exists | Required | `Glob scripts/github-project-field-map.mjs` |
| `external-sync-map.example.json` has `github_projects` section | Required | `Grep "github_projects" docs/project-control/external-sync-map.example.json` |
| `project-sync-policy.md` names GitHub Projects as default | Required | `Grep "GitHub Projects is the default" docs/project-control/project-sync-policy.md` |
| `github-projects-field-map.example.json` uses placeholder IDs only | Required | `node scripts/github-project-field-map.mjs` (validation passes) |
| No real GitHub tokens, project IDs, or issue numbers in committed files | Required | Visual scan of example JSONs |

The audit does **not** require:
- A real `external-sync-map.local.json` (gitignored; expected to be absent)
- Real GitHub token or auth credentials
- A live GitHub Project to exist
- Real issue numbers or project item IDs

---

## 6c. GitHub Projects live provisioning layer (AI Project OS v1.4)

Required when the repo has been updated to AI Project OS v1.4 or later.

| Item | Classification | Check |
|---|---|---|
| `scripts/lib/github-projects-client.mjs` exists | Required | `Glob scripts/lib/github-projects-client.mjs` |
| `docs/project-control/github-projects-source-records.example.json` exists | Required | `Glob docs/project-control/github-projects-source-records.example.json` |
| `github-projects-client.mjs` exports `probeAuth` | Required | `Grep "export function probeAuth" scripts/lib/github-projects-client.mjs` |
| `github-projects-client.mjs` exports `parseSourceRecords` | Required | `Grep "export function parseSourceRecords" scripts/lib/github-projects-client.mjs` |
| `github-projects-client.mjs` uses `requireApply` guard | Required | `Grep "requireApply" scripts/lib/github-projects-client.mjs` |
| `github-project-setup-apply.mjs` imports from client library | Required | `Grep "./lib/github-projects-client.mjs" scripts/github-project-setup-apply.mjs` |
| `github-project-import-issues.mjs` imports from client library | Required | `Grep "./lib/github-projects-client.mjs" scripts/github-project-import-issues.mjs` |
| `github-project-sync-status.mjs` supports `--live` flag | Required | `Grep "\-\-live" scripts/github-project-sync-status.mjs` |
| `source-records.example.json` has `os_id` field | Required | `Grep "os_id" docs/project-control/github-projects-source-records.example.json` |
| `source-records.example.json` has KMVT- IDs | Required | `Grep "KMVT-" docs/project-control/github-projects-source-records.example.json` |

---

## 6d. GitHub Projects template standard layer (AI Project OS v1.5)

Required when the repo has been updated to AI Project OS v1.5 or later.

| Item | Classification | Check |
|---|---|---|
| `docs/project-control/github-projects-template-standard.md` exists | Required | `Glob docs/project-control/github-projects-template-standard.md` |
| `docs/project-control/github-projects-template-copy-runbook.md` exists | Required | `Glob docs/project-control/github-projects-template-copy-runbook.md` |
| `docs/project-control/github-projects-template-config.example.json` exists | Required | `Glob docs/project-control/github-projects-template-config.example.json` |
| `scripts/github-project-template-dry-run.mjs` exists | Required | `Glob scripts/github-project-template-dry-run.mjs` |
| `scripts/github-project-template-validate.mjs` exists | Required | `Glob scripts/github-project-template-validate.mjs` |
| `scripts/github-project-template-apply.mjs` exists | Required | `Glob scripts/github-project-template-apply.mjs` |
| `.claude/skills/github-project-template/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/github-project-template/SKILL.md` |
| `.claude/commands/github-project-template.md` exists | Required | `Glob .claude/commands/github-project-template.md` |
| `github-projects-template-config.local.json` is gitignored | Required | `git check-ignore -v docs/project-control/github-projects-template-config.local.json` |
| `template-config.example.json` uses placeholder IDs only | Required | `Grep "PVT_placeholder" docs/project-control/github-projects-template-config.example.json` |
| `template-standard.md` names v1.5 canonical Status values | Required | `Grep "Done / Shipped" docs/project-control/github-projects-template-standard.md` |
| `template-standard.md` does not use old vocabulary | Required | No "Not Started", "In Review", "Blocked", "Waiting", "Approved" in standard file |
| `github-projects-client.mjs` REQUIRED_STATUSES uses v1.5 vocab | Required | `Grep "Done / Shipped" scripts/lib/github-projects-client.mjs` |
| `github-projects-client.mjs` VALID_STATUSES uses v1.5 vocab | Required | `Grep "Done / Shipped" scripts/lib/github-projects-client.mjs` |
| `github-projects-setup-policy.md` uses v1.5 Status vocabulary | Required | `Grep "Done / Shipped" docs/project-control/github-projects-setup-policy.md` |

The audit does **not** require:
- A real `github-projects-template-config.local.json` (gitignored; Gate 2 not yet authorized)
- Gate 2 to be complete

---

---

## 6e. Google Calendar live sync layer (AI Project OS v1.6)

Required when the repo has been updated to AI Project OS v1.6 or later.

| Item | Classification | Check |
|---|---|---|
| `docs/project-control/google-calendar-source-schema.md` exists | Required | `Glob docs/project-control/google-calendar-source-schema.md` |
| `docs/project-control/google-calendar-source-records.json` exists | Required | `Glob docs/project-control/google-calendar-source-records.json` |
| `docs/project-control/google-calendar-sync-policy.md` exists | Required | `Glob docs/project-control/google-calendar-sync-policy.md` |
| `docs/project-control/google-calendar-sync-runbook.md` exists | Required | `Glob docs/project-control/google-calendar-sync-runbook.md` |
| `docs/project-control/google-calendar-credentials.example.md` exists | Required | `Glob docs/project-control/google-calendar-credentials.example.md` |
| `docs/project-control/google-calendar-sync-log.md` exists | Required | `Glob docs/project-control/google-calendar-sync-log.md` |
| `scripts/google-calendar-source-validate.mjs` exists | Required | `Glob scripts/google-calendar-source-validate.mjs` |
| `scripts/google-calendar-sync-dry-run.mjs` exists | Required | `Glob scripts/google-calendar-sync-dry-run.mjs` |
| `scripts/google-calendar-sync-apply.mjs` exists | Required | `Glob scripts/google-calendar-sync-apply.mjs` |
| `scripts/generate-project-calendar.mjs` exists | Required | `Glob scripts/generate-project-calendar.mjs` |
| `.claude/skills/google-calendar-sync/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/google-calendar-sync/SKILL.md` |
| `.claude/commands/google-calendar-sync.md` exists | Required | `Glob .claude/commands/google-calendar-sync.md` |
| `token.json` is gitignored | Required | `git check-ignore -v token.json` |
| `**/token.json` pattern is in `.gitignore` | Required | `Grep "token.json" .gitignore` |
| `google-calendar-token.json` is gitignored | Required | `git check-ignore -v google-calendar-token.json` |
| `external-sync-map.local.json` is gitignored | Required | `git check-ignore -v docs/project-control/external-sync-map.local.json` |
| `google-calendar-source-records.json` is valid JSON | Required | `node scripts/google-calendar-source-validate.mjs` |
| All source records pass schema validation | Required | `node scripts/google-calendar-source-validate.mjs` (0 fail) |
| `google-calendar-sync-apply.mjs` has `--confirm-live-calendar-apply` guard | Required | `Grep "confirm-live-calendar-apply" scripts/google-calendar-sync-apply.mjs` |
| `google-calendar-sync-apply.mjs` has --apply hard stop | Required | `Grep "hasApply" scripts/google-calendar-sync-apply.mjs` |

The audit does **not** require:
- A real `external-sync-map.local.json` (gitignored; populated only after Gate 3)
- Google Calendar API credentials (not required for Gate 1)
- `googleapis` npm package installed (required only for Gate 2/3)
- Live Google Calendar events to exist
- Gate 2 or Gate 3 to be complete

---

---

## 6f. State freshness validator layer (AI Project OS v1.7 Gate 2)

Required when the repo has been updated to AI Project OS v1.7 Gate 2 or later.

| Item | Classification | Check |
|---|---|---|
| `scripts/state-freshness-check.mjs` exists | Required | `Glob scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` supports `--json` flag | Required | `Grep "\-\-json" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` supports `--strict` flag | Required | `Grep "\-\-strict" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` has `FAIL_WRONG_ACTIVE_BRANCH` code | Required | `Grep "FAIL_WRONG_ACTIVE_BRANCH" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` has `FAIL_PACKAGE_5B_UNAUTHORIZED` code | Required | `Grep "FAIL_PACKAGE_5B_UNAUTHORIZED" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` has `FAIL_TEST_BASELINE_MATERIAL_MISMATCH` code | Required | `Grep "FAIL_TEST_BASELINE_MATERIAL_MISMATCH" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` has `FAIL_LOCAL_PRIVATE_FILE_NOT_IGNORED` code | Required | `Grep "FAIL_LOCAL_PRIVATE_FILE_NOT_IGNORED" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` has `WARN_HEAD_HASH_LAG` code | Required | `Grep "WARN_HEAD_HASH_LAG" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` declares no external API calls | Required | `Grep "No external dependencies. No API calls." scripts/state-freshness-check.mjs` |
| `docs/dev/closeout-sync-contract.md` has State-Sync Decision Matrix | Required | `Grep "State-Sync Decision Matrix" docs/dev/closeout-sync-contract.md` |
| `docs/dev/closeout-sync-contract.md` references `state-freshness-check.mjs` | Required | `Grep "state-freshness-check.mjs" docs/dev/closeout-sync-contract.md` |
| `closeout` SKILL.md references `state-freshness-check.mjs` | Required | `Grep "state-freshness-check.mjs" .claude/skills/closeout/SKILL.md` |
| `precommit` SKILL.md references `state-freshness-check.mjs` | Required | `Grep "state-freshness-check.mjs" .claude/skills/precommit/SKILL.md` |

The audit does **not** require:
- The script to produce zero FAILs in every repo state (FAILs are expected on an in-progress implementation branch before state docs are updated)
- A specific verdict — PASS, WARN, and FAIL are all valid outputs depending on current state

---

## 6g. Report mirroring intake layer (AI Project OS v1.7 Gate 3)

Required when the repo has been updated to AI Project OS v1.7 Gate 3 or later.

| Item | Classification | Check |
|---|---|---|
| `scripts/report-mirror-intake.mjs` exists | Required | `Glob scripts/report-mirror-intake.mjs` |
| `docs/project-control/report-mirror-policy.md` exists | Required | `Glob docs/project-control/report-mirror-policy.md` |
| `docs/project-control/report-mirror-schema.md` exists | Required | `Glob docs/project-control/report-mirror-schema.md` |
| `docs/project-control/report-mirror-log.md` exists | Required | `Glob docs/project-control/report-mirror-log.md` |
| `docs/project-control/report-intake-runbook.md` exists | Required | `Glob docs/project-control/report-intake-runbook.md` |
| `.claude/skills/report-intake/SKILL.md` exists | Required | `Glob .claude/skills/report-intake/SKILL.md` |
| `.claude/commands/report-intake.md` exists | Required | `Glob .claude/commands/report-intake.md` |
| `report-mirror-intake.mjs` supports `--apply` flag | Required | `Grep "\-\-apply" scripts/report-mirror-intake.mjs` |
| `report-mirror-intake.mjs` supports `--stdin` | Required | `Grep "\-\-stdin" scripts/report-mirror-intake.mjs` |
| `report-mirror-intake.mjs` has `ghp_` redaction | Required | `Grep "ghp_" scripts/report-mirror-intake.mjs` |
| `report-mirror-intake.mjs` has PEM block redaction | Required | `Grep "BEGIN" scripts/report-mirror-intake.mjs` |
| `report-mirror-intake.mjs` uses HIGH_RISK_PATTERNS (never prints values) | Required | `Grep "HIGH_RISK_PATTERNS" scripts/report-mirror-intake.mjs` |
| `report-mirror-log.md` has Purpose section | Required | `Grep "## Purpose" docs/project-control/report-mirror-log.md` |
| `report-mirror-policy.md` explains what is and is not mirrored | Required | `Grep "What is mirrored vs what is not" docs/project-control/report-mirror-policy.md` |
| `closeout-sync-contract.md` has report mirroring requirement | Required | `Grep "Report mirroring requirement" docs/dev/closeout-sync-contract.md` |
| `local-reports/` is gitignored | Required | `git check-ignore -v local-reports/example.md` |
| `local-report-intake/` is gitignored | Required | `git check-ignore -v local-report-intake/example.md` |
| `closeout` SKILL.md references `report-mirror-intake.mjs` | Required | `Grep "report-mirror-intake.mjs" .claude/skills/closeout/SKILL.md` |
| `handoff` SKILL.md references `report-mirror-intake.mjs` | Required | `Grep "report-mirror-intake.mjs" .claude/skills/handoff/SKILL.md` |

The audit does **not** require:
- An existing committed mirror entry in `report-mirror-log.md` (the log starts empty)
- `local-report-intake/` directory to exist locally (it is created on first use)

---

## 6h. Start router layer (AI Project OS v1.7 Gate 4)

Required when the repo has been updated to AI Project OS v1.7 Gate 4 or later.

| Item | Classification | Check |
|---|---|---|
| `scripts/start-router.mjs` exists | Required | `Glob scripts/start-router.mjs` |
| `start-router.mjs` supports `--json` flag | Required | `Grep "\-\-json" scripts/start-router.mjs` |
| `start-router.mjs` supports `--explain` flag | Required | `Grep "\-\-explain" scripts/start-router.mjs` |
| `start-router.mjs` supports `--mode` flag | Required | `Grep "\-\-mode" scripts/start-router.mjs` |
| `start-router.mjs` has `READY_FRESH_START` verdict | Required | `Grep "READY_FRESH_START" scripts/start-router.mjs` |
| `start-router.mjs` has `READY_CONTINUE` verdict | Required | `Grep "READY_CONTINUE" scripts/start-router.mjs` |
| `start-router.mjs` has `NEEDS_HANDOFF_UPDATE` verdict | Required | `Grep "NEEDS_HANDOFF_UPDATE" scripts/start-router.mjs` |
| `start-router.mjs` has `BLOCKED_DIRTY_TREE` verdict | Required | `Grep "BLOCKED_DIRTY_TREE" scripts/start-router.mjs` |
| `start-router.mjs` has `BLOCKED_PACKAGE_UNAUTHORIZED` verdict | Required | `Grep "BLOCKED_PACKAGE_UNAUTHORIZED" scripts/start-router.mjs` |
| `start-router.mjs` has `BLOCKED_EXTERNAL_SYNC_RISK` verdict | Required | `Grep "BLOCKED_EXTERNAL_SYNC_RISK" scripts/start-router.mjs` |
| `start-router.mjs` has `NEEDS_COORDINATOR_DECISION` verdict | Required | `Grep "NEEDS_COORDINATOR_DECISION" scripts/start-router.mjs` |
| `start-router.mjs` declares no external API calls | Required | `Grep "No external API calls" scripts/start-router.mjs` |
| `.claude/skills/start-router/SKILL.md` exists | Required | `Glob .claude/skills/start-router/SKILL.md` |
| `.claude/commands/start-router.md` exists | Required | `Glob .claude/commands/start-router.md` |
| `start` SKILL.md references `start-router.mjs` | Required | `Grep "start-router.mjs" .claude/skills/start/SKILL.md` |
| `session-restart-protocol.md` references `start-router.mjs` | Required | `Grep "start-router.mjs" docs/dev/session-restart-protocol.md` |
| `auto-management-protocol.md` references `/start-router` command | Required | `Grep "/start-router" docs/dev/auto-management-protocol.md` |
| `model-routing-protocol.md` has scrutinous adoption rule | Required | `Grep "Scrutinous adoption rule" docs/dev/model-routing-protocol.md` |
| `model-routing-protocol.md` has Plan Mode section | Required | `Grep "Plan Mode and opusplan" docs/dev/model-routing-protocol.md` |
| `model-routing-protocol.md` rejects opusplan | Required | `Grep "opusplan" docs/dev/model-routing-protocol.md` |
| `model-routing-protocol.md` preserves tier-based routing (not brittle model IDs) | Required | `Grep "Model ID rule" docs/dev/model-routing-protocol.md` |
| `raw-transcripts/` is gitignored | Required | `git check-ignore -v raw-transcripts/example.md` |

The audit does **not** require:
- The start router to produce a READY verdict in all repo states (it should produce NEEDS_HANDOFF_UPDATE on an in-progress branch with a stale handoff — that is correct behavior)
- A specific mode to be in use at audit time

---

## 6i. External sync consistency validator layer (AI Project OS v1.7 Gate 5)

Required when the repo has been updated to AI Project OS v1.7 Gate 5 or later.

| Item | Classification | Check |
|---|---|---|
| `scripts/external-sync-consistency-check.mjs` exists | Required | `Glob scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` supports `--json` flag | Required | `Grep "\-\-json" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` supports `--local-only` flag | Required | `Grep "\-\-local-only" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` supports `--fixture` flag | Required | `Grep "\-\-fixture" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` supports `--live-readonly` flag | Required | `Grep "\-\-live-readonly" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `PASS_GCAL_SOURCE_RECORDS_VALID` code | Required | `Grep "PASS_GCAL_SOURCE_RECORDS_VALID" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `FAIL_GCAL_SOURCE_INVALID` code | Required | `Grep "FAIL_GCAL_SOURCE_INVALID" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY` code | Required | `Grep "FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `FAIL_GCAL_DUPLICATE_DETECTED` code | Required | `Grep "FAIL_GCAL_DUPLICATE_DETECTED" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `PASS_GHP_SOURCE_RECORDS_VALID` code | Required | `Grep "PASS_GHP_SOURCE_RECORDS_VALID" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `FAIL_GHP_FIELD_VALUE_DRIFT` code | Required | `Grep "FAIL_GHP_FIELD_VALUE_DRIFT" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `FAIL_GHP_DUPLICATE_OS_ID` code | Required | `Grep "FAIL_GHP_DUPLICATE_OS_ID" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` has `PASS_EXTERNAL_LOCAL_PRIVATE_PATHS_IGNORED` code | Required | `Grep "PASS_EXTERNAL_LOCAL_PRIVATE_PATHS_IGNORED" scripts/external-sync-consistency-check.mjs` |
| `external-sync-consistency-check.mjs` confirms no mutation occurred | Required | `Grep "no_mutation_occurred" scripts/external-sync-consistency-check.mjs` |
| `docs/project-control/external-sync-consistency-policy.md` exists | Required | `Glob docs/project-control/external-sync-consistency-policy.md` |
| `docs/project-control/external-sync-consistency-schema.md` exists | Required | `Glob docs/project-control/external-sync-consistency-schema.md` |
| `docs/project-control/external-sync-consistency-log.md` exists | Required | `Glob docs/project-control/external-sync-consistency-log.md` |
| `docs/project-control/external-sync-consistency-fixture.example.json` exists | Required | `Glob docs/project-control/external-sync-consistency-fixture.example.json` |
| `.claude/skills/external-sync-consistency/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/external-sync-consistency/SKILL.md` |
| `.claude/commands/external-sync-consistency.md` exists | Required | `Glob .claude/commands/external-sync-consistency.md` |
| `closeout` SKILL.md references `external-sync-consistency-check.mjs` | Required | `Grep "external-sync-consistency-check.mjs" .claude/skills/closeout/SKILL.md` |
| `precommit` SKILL.md references `external-sync-consistency-check.mjs` | Required | `Grep "external-sync-consistency-check.mjs" .claude/skills/precommit/SKILL.md` |
| `closeout-sync-contract.md` has external sync consistency requirement | Required | `Grep "External sync consistency requirement" docs/dev/closeout-sync-contract.md` |

The audit does **not** require:
- A real `external-sync-map.local.json` (gitignored; expected to be absent before apply)
- Live Google Calendar credentials or googleapis install
- gh CLI authentication
- Any external sync apply to have been completed

---

## 6j. Documentation-watch and Bootstrap copy-forward layer (AI Project OS v1.7 Gate 6)

Required when the repo has been updated to AI Project OS v1.7 Gate 6 or later.

| Item | Classification | Check |
|---|---|---|
| `docs/ai-system/documentation-watch-policy.md` exists | Required | `Glob docs/ai-system/documentation-watch-policy.md` |
| `docs/ai-system/documentation-watch-sources.md` exists | Required | `Glob docs/ai-system/documentation-watch-sources.md` |
| `docs/ai-system/documentation-watch-evaluation-template.md` exists | Required | `Glob docs/ai-system/documentation-watch-evaluation-template.md` |
| `docs/ai-system/documentation-watch-log.md` exists | Required | `Glob docs/ai-system/documentation-watch-log.md` |
| `docs/ai-system/bootstrap-copy-forward-guide.md` exists | Required | `Glob docs/ai-system/bootstrap-copy-forward-guide.md` |
| `docs/ai-system/universal-vs-project-specific-map.md` exists | Required | `Glob docs/ai-system/universal-vs-project-specific-map.md` |
| `docs/ai-system/puzzle-alignment-checklist.md` exists | Required | `Glob docs/ai-system/puzzle-alignment-checklist.md` |
| `docs/ai-system/future-repo-bootstrap-checklist.md` exists | Required | `Glob docs/ai-system/future-repo-bootstrap-checklist.md` |
| `documentation-watch-policy.md` has ADOPT/DEFER/REJECT/MONITOR classifications | Required | `Grep "ADOPT" docs/ai-system/documentation-watch-policy.md` |
| `documentation-watch-policy.md` has official-source-only rule | Required | `Grep "Only official docs are authoritative" docs/ai-system/documentation-watch-policy.md` |
| `documentation-watch-policy.md` has scrutinous adoption rule | Required | `Grep "Scrutinous adoption rule" docs/ai-system/documentation-watch-policy.md` |
| `documentation-watch-policy.md` has browsing boundary | Required | `Grep "Browsing boundary" docs/ai-system/documentation-watch-policy.md` |
| `documentation-watch-log.md` has at least one entry | Required | `Grep "DW-" docs/ai-system/documentation-watch-log.md` |
| `bootstrap-copy-forward-guide.md` has never-copy rule | Required | `Grep "must NEVER be copied" docs/ai-system/bootstrap-copy-forward-guide.md` |
| `universal-vs-project-specific-map.md` has never-copy column | Required | `Grep "Never copy?" docs/ai-system/universal-vs-project-specific-map.md` |
| `universal-vs-project-specific-map.md` covers external-sync-map.local.json | Required | `Grep "external-sync-map.local.json" docs/ai-system/universal-vs-project-specific-map.md` |
| `puzzle-alignment-checklist.md` has authorization reminder | Required | `Grep "requires explicit Coordinator authorization" docs/ai-system/puzzle-alignment-checklist.md` |
| `future-repo-bootstrap-checklist.md` has OS self-audit requirement | Required | `Grep "OS self-audit requirement" docs/ai-system/future-repo-bootstrap-checklist.md` |
| `.claude/skills/documentation-watch/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/documentation-watch/SKILL.md` |
| `.claude/commands/documentation-watch.md` exists | Required | `Glob .claude/commands/documentation-watch.md` |
| `.claude/skills/bootstrap-copy-forward/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/bootstrap-copy-forward/SKILL.md` |
| `.claude/commands/bootstrap-copy-forward.md` exists | Required | `Glob .claude/commands/bootstrap-copy-forward.md` |
| `scripts/documentation-watch-check.mjs` exists | Required | `Glob scripts/documentation-watch-check.mjs` |
| `scripts/bootstrap-copy-forward-audit.mjs` exists | Required | `Glob scripts/bootstrap-copy-forward-audit.mjs` |

The audit does **not** require:
- A live documentation-watch review to have been completed (the framework being installed is sufficient)
- Puzzle alignment to be complete (the checklist documents the gap; completion requires separate Coordinator authorization)
- Any external copy-forward operation to have been performed

---

## 6k. Raw transcript capture and notification reliability layer (Operator Reliability Repair, 2026-06-02)

Required when the repo has been updated to include the Operator Reliability Repair pass.

| Item | Classification | Check |
|---|---|---|
| `docs/dev/raw-transcript-capture-protocol.md` exists | Required | `Glob docs/dev/raw-transcript-capture-protocol.md` |
| `raw-transcript-capture-protocol.md` has file-first protocol section | Required | `Grep "File-first response protocol" docs/dev/raw-transcript-capture-protocol.md` |
| `raw-transcript-capture-protocol.md` has honest type distinction (Type 2 not yet implemented) | Required | `Grep "Not yet implemented" docs/dev/raw-transcript-capture-protocol.md` |
| `raw-transcript-capture-protocol.md` has metadata block format | Required | `Grep "Written before final response" docs/dev/raw-transcript-capture-protocol.md` |
| `scripts/raw-transcript-check.mjs` exists | Required | `Glob scripts/raw-transcript-check.mjs` |
| `scripts/notification-check.mjs` exists | Required | `Glob scripts/notification-check.mjs` |
| `.claude/skills/raw-transcript-capture/SKILL.md` exists with frontmatter | Required | `Read .claude/skills/raw-transcript-capture/SKILL.md` |
| `.claude/commands/raw-transcript-capture.md` exists | Required | `Glob .claude/commands/raw-transcript-capture.md` |
| `raw-transcripts/` is gitignored | Required | `git check-ignore -v raw-transcripts/example.md` |
| `closeout-sync-contract.md` has file-first response record requirement | Required | `Grep "File-first response record requirement" docs/dev/closeout-sync-contract.md` |
| `closeout` SKILL.md references `raw-transcript-capture-protocol.md` | Required | `Grep "raw-transcript-capture-protocol.md" .claude/skills/closeout/SKILL.md` |
| `handoff` SKILL.md references `raw-transcript-capture-protocol.md` | Required | `Grep "raw-transcript-capture-protocol.md" .claude/skills/handoff/SKILL.md` |
| `report-mirror-policy.md` distinguishes raw transcript from mirror | Required | `Grep "Raw transcript capture vs report mirroring" docs/project-control/report-mirror-policy.md` |
| `universal-standards.md` has raw transcript capture entry in automation table | Required | `Grep "Raw transcript capture" docs/ai-system/universal-standards.md` |
| `notification-setup.md` has completion sound (Stop hook) section | Required | `Grep "Completion sound" docs/dev/notification-setup.md` |
| `notification-check.mjs` checks for Stop hook | Required | `Grep "Stop hook" scripts/notification-check.mjs` |

The audit does **not** require:
- Any raw transcript file to exist in `raw-transcripts/claude-code/` (the directory is created on first use)
- The notification hooks to already be installed (user-level setup; the diagnostic script checks status)
- Byte-for-byte proof of file-chat identity (the protocol documents this as technically unenforceable)

---

## 6l. State-Zero closeout reliability layer (AI Project OS v1.8, 2026-06-03)

| Item | Classification | Check |
|---|---|---|
| `docs/dev/state-zero-closeout-protocol.md` exists | Required | `Glob docs/dev/state-zero-closeout-protocol.md` |
| `state-zero-closeout-protocol.md` defines State-Zero | Required | `Grep "State-Zero means" docs/dev/state-zero-closeout-protocol.md` |
| `state-zero-closeout-protocol.md` has wrong-active-branch FAIL rule | Required | `Grep "Active branch field ≠" docs/dev/state-zero-closeout-protocol.md` |
| `state-zero-closeout-protocol.md` has post-merge obligation | Required | `Grep "Post-merge obligation" docs/dev/state-zero-closeout-protocol.md` |
| `state-zero-closeout-protocol.md` has PCSR limitation statement | Required | `Grep "Post-Commit State Rule does NOT" docs/dev/state-zero-closeout-protocol.md` |
| `state-zero-closeout-protocol.md` has closeout checklist | Required | `Grep "State-Zero closeout checklist" docs/dev/state-zero-closeout-protocol.md` |
| `closeout-sync-contract.md` has State-Zero requirement section | Required | `Grep "State-Zero requirement" docs/dev/closeout-sync-contract.md` |
| `session-restart-protocol.md` has State-Zero rule | Required | `Grep "State-Zero rule" docs/dev/session-restart-protocol.md` |
| `universal-standards.md` has State-Zero Closeout Rule section | Required | `Grep "State-Zero Closeout Rule" docs/ai-system/universal-standards.md` |
| `bootstrap-template.md` includes State-Zero requirement | Required | `Grep "State-Zero Closeout Rule" docs/ai-system/bootstrap-template.md` |
| `closeout` SKILL.md references `state-zero-closeout-protocol.md` | Required | `Grep "state-zero-closeout-protocol.md" .claude/skills/closeout/SKILL.md` |
| `handoff` SKILL.md references `state-zero-closeout-protocol.md` | Required | `Grep "state-zero-closeout-protocol.md" .claude/skills/handoff/SKILL.md` |
| `precommit` SKILL.md references `state-zero-closeout-protocol.md` | Required | `Grep "state-zero-closeout-protocol.md" .claude/skills/precommit/SKILL.md` |
| `start` SKILL.md references `state-zero-closeout-protocol.md` | Required | `Grep "state-zero-closeout-protocol.md" .claude/skills/start/SKILL.md` |
| `weekly-sync` SKILL.md references `state-zero-closeout-protocol.md` | Required | `Grep "state-zero-closeout-protocol.md" .claude/skills/weekly-sync/SKILL.md` |
| `state-freshness-check.mjs` FAIL_WRONG_ACTIVE_BRANCH has State-Zero note | Required | `Grep "State-Zero rule" scripts/state-freshness-check.mjs` |
| `state-freshness-check.mjs` POST_COMMIT_RULE_NOTE clarifies hash-lag-only scope | Required | `Grep "Post-Commit State Rule does NOT" scripts/state-freshness-check.mjs` |
| `start-router.mjs` NEEDS_STATE_SYNC fires on stale branch regardless of handoffIsComplete | Required | `Grep "State-Zero FAIL" scripts/start-router.mjs` |
| `state-zero-closeout-protocol.md` references `state-freshness-check.mjs` | Required | `Grep "state-freshness-check.mjs" docs/dev/state-zero-closeout-protocol.md` |
| `state-zero-closeout-protocol.md` references `start-router.mjs` | Required | `Grep "start-router.mjs" docs/dev/state-zero-closeout-protocol.md` |

---

## 7. QA templates

| Item | Classification | Check |
|---|---|---|
| `docs/qa/pre-commit-verification-template.md` exists | Required | `Glob docs/qa/pre-commit-verification-template.md` |
| `docs/qa/package-verification-template.md` exists | Required | `Glob docs/qa/package-verification-template.md` |
| `docs/qa/test-strategy.md` exists | Required | `Glob docs/qa/test-strategy.md` |

---

## 8. Gitignore protections

| Item | Classification | Check |
|---|---|---|
| `.claude/settings.local.json` is gitignored | Required | `git check-ignore -v .claude/settings.local.json` |
| `.env` is gitignored | Required | `git check-ignore -v .env` |
| `external-sync-map.local.json` is gitignored | Required | `git check-ignore -v docs/project-control/external-sync-map.local.json` |
| Generated dry-run outputs are gitignored | Recommended | Check for `*.sync-dryrun.md` pattern |

---

## 9. Post-Commit State Rule

| Item | Classification | Check |
|---|---|---|
| Post-Commit State Rule present in `universal-standards.md` | Required | `Grep "Post-Commit State Rule" docs/ai-system/universal-standards.md` |
| Cross-reference in `package-boundary-closeout-protocol.md` | Required | `Grep "Post-Commit State Rule" docs/dev/package-boundary-closeout-protocol.md` |
| Cross-reference in `auto-management-protocol.md` | Required | `Grep "Post-Commit State Rule" docs/dev/auto-management-protocol.md` |

---

## 10. Stale state check

Run these checks to detect operational misdirection:

- Does `AI_HANDOFF.md` status match actual git state?
- Does `CURRENT_STATE.md` active package match `AI_HANDOFF.md`?
- Does `NEXT_SESSION_PROMPT.md` current pointer match actual HEAD and package state?
- Does `docs/project-control/kanban-board.md` reflect post-merge package states?

Flag any item where stale wording would misdirect the next agent. Apply the Post-Commit State Rule: cosmetic HEAD lag alone is a WARN, not a FAIL.

---

## Scripts

| Script | Classification | What it checks |
|---|---|---|
| `scripts/os-self-audit.mjs` | Recommended | Sections 1–9 + 6b + 6c + 6d + 6e + 6f + 6g + 6h (file existence, gitignore, Grep-based checks, GitHub Projects, Google Calendar, state freshness, report mirroring, and start router layers) |
| `scripts/project-control-sync-validate.mjs` | Recommended | Section 6 — project-control doc consistency |
| `scripts/google-calendar-source-validate.mjs` | Recommended | Section 6e — Google Calendar source record schema validation |
| `scripts/generate-project-calendar.mjs` | Recommended | Generates committed .ics from source records (no API calls) |
| `scripts/github-project-setup-dry-run.mjs` | Recommended | GitHub Projects planned structure; validates example field map |
| `scripts/github-project-field-map.mjs` | Recommended | GitHub Projects field map placeholder safety and field coverage |
| `scripts/github-project-sync-status.mjs` | Recommended | Local structural sync status (no API calls) |
| `scripts/external-sync-consistency-check.mjs` | Recommended | Section 6i — compare source records, local sync map, committed logs, and optional live read-only state |
| `scripts/documentation-watch-check.mjs` | Recommended | Section 6j — validate that documentation-watch policy/sources/template/log exist and contain required elements |
| `scripts/bootstrap-copy-forward-audit.mjs` | Recommended | Section 6j — validate copy-forward guide, universal-vs-project-specific map, Puzzle checklist, future-repo checklist, and gitignore safety |

All scripts are read-only, dependency-free (for local-only mode), and produce no external writes. No script makes API calls without `--live-readonly` flag and Coordinator authorization.

---

## Passing the audit

The repo passes the OS self-audit when:

- All **Required** items are PASS
- All **Recommended** items are PASS or WARN (WARN is acceptable; document the reason)
- No stale state would misdirect the next agent into the wrong branch, package, scope, or task

Once all required items pass, the repo may be called a **complete Bootstrap Core example** and the pattern may be copied to other repos (Puzzle, etc.).
