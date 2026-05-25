# AI Project OS Self-Audit Checklist

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24; updated in AI Project OS v1.3 External Board Provider Update, 2026-05-25)
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
| `scripts/os-self-audit.mjs` | Recommended | Sections 1–9 + 6b above (file existence, gitignore, Grep-based checks, GitHub Projects layer) |
| `scripts/project-control-sync-validate.mjs` | Recommended | Section 6 — project-control doc consistency |
| `scripts/github-project-setup-dry-run.mjs` | Recommended | GitHub Projects planned structure; validates example field map |
| `scripts/github-project-field-map.mjs` | Recommended | GitHub Projects field map placeholder safety and field coverage |
| `scripts/github-project-sync-status.mjs` | Recommended | Local structural sync status (no API calls) |

All scripts are read-only, dependency-free, and local-file-only. No script makes API calls without `--apply` flag and Coordinator approval.

---

## Passing the audit

The repo passes the OS self-audit when:

- All **Required** items are PASS
- All **Recommended** items are PASS or WARN (WARN is acceptable; document the reason)
- No stale state would misdirect the next agent into the wrong branch, package, scope, or task

Once all required items pass, the repo may be called a **complete Bootstrap Core example** and the pattern may be copied to other repos (Puzzle, etc.).
