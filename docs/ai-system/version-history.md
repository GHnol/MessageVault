# AI Project OS — Version History

**Status:** ACTIVE (introduced in Package 2.9).
**Use:** Single chronological record of every OS upgrade pass — what it delivered, what backlog it left, and which items should be backfilled to other repos.

Entries are point-in-time. Verify against `CHANGELOG.md` and git history before acting on them.

---

## Version index

| Version | Package | Date | Status |
|---|---|---|---|
| 1.6.3 | AI Project OS v1.6 — Advisory Repair: Sync-Map Read Path | 2026-06-01 | COMPLETE — on branch `fix/google-calendar-sync-map-read-path`; commit pending Coordinator approval; post-repair dry-run: 10 NO_OP, 0 MISSING_LOCAL_MAPPING |
| 1.6.2 | AI Project OS v1.6 — Gate 2D Repair: Canonical OAuth Bootstrap | 2026-05-31 | In progress on branch `docs/google-calendar-oauth-path-alignment`; no OAuth run; no live API; Gate 2D re-run pending after merge |
| 1.6.1 | AI Project OS v1.6 — Gate 2A: Live Dry-Run Comparison Logic | 2026-05-31 | Gate 2A in progress (branch `docs/google-calendar-live-dry-run-logic`, uncommitted); Gate 2B pending googleapis + credentials |
| 1.6.0 | AI Project OS v1.6 — Google Calendar Live Sync, Gate 1 | 2026-05-30 | Gate 1 COMPLETE — merged `5c4bd28`; Gate 2A in progress; Gate 2B/3 pending Coordinator authorization |
| 1.5.0 | AI Project OS v1.5 — Template GitHub Project Standard | 2026-05-26 | complete — Gate 1 merged `7c2c511`; Gate 2 complete 2026-05-27 |
| 1.4.0 | AI Project OS v1.4 — GitHub Projects Live Provisioning Integration | 2026-05-25 | merged (`1623e7e`) |
| 1.3.0 | AI Project OS v1.3 — External Board Provider Update | 2026-05-25 | merged (`3dcf917`) |
| 1.2.0 | AI Project OS v1.2 — External Setup Alignment Patch | 2026-05-25 | merged (`328d81e`) |
| 0.5.0 | AI Project OS Framework Groundwork Pass | 2026-05-25 | merged (`cc7139a`) |
| 0.4.0 | AI Project OS Usability Patch — Short Command Interface | 2026-05-24 | merged (`cb920be`) |
| 0.3.1 | Patch — Post-Commit State Rule | 2026-05-22 | merged (`9be0f81`) |
| 0.3.0 | Package 2.9 — AI Project OS Auto-Management Upgrade Pass | 2026-05-22 | merged (`a20af30`) |
| 0.2.0 | Package 2.8 — KeepMees Project Control Tower | 2026-05-17 | merged (`bdb73db`) |
| 0.1.0 | Package 2.7 — AI Development Operating System Upgrade Pass | 2026-05-17 | merged (`cebdc72`) |

Version numbers are internal to this layer (not semver of any product code). Minor versions increment per OS upgrade pass; patch versions increment per surgical OS process correction.

---

## 1.6.0 — AI Project OS v1.6: Google Calendar Live Sync (2026-05-30)

**Branch:** `docs/google-calendar-live-sync-gate-1` (Gate 1 in progress)
**Status:** Gate 1 in progress; Gate 2 (live dry-run) and Gate 3 (live apply) pending Coordinator authorization

### What this pass adds

- **Google Calendar source records:** `google-calendar-source-records.json` — 10 committed records; `AI_OS_ID:` markers; stable `duplicate_key`.
- **Source schema:** `google-calendar-source-schema.md` — field definitions, routing, classification categories, duplicate prevention.
- **Sync policy:** `google-calendar-sync-policy.md` — gate model, source-of-truth hierarchy, adoption rule, apply safety, .ics fallback role.
- **Sync runbook:** `google-calendar-sync-runbook.md` — step-by-step gate procedures, credential blocker handling, Puzzle alignment.
- **Credentials guide:** `google-calendar-credentials.example.md` — no secrets; preferred auth path; `googleapis` dependency documentation.
- **Canonical sync log:** `google-calendar-sync-log.md` — Gate 1 entry; legacy `calendar-sync-log.md` preserved for 2026-05-17 import.
- **Four scripts:** `google-calendar-source-validate.mjs` (schema validation), `google-calendar-sync-dry-run.mjs` (local + live modes), `google-calendar-sync-apply.mjs` (guarded apply scaffold with GATE_3_AUTHORIZED), `generate-project-calendar.mjs` (ICS from source records with stable UIDs).
- **New skill + command:** `google-calendar-sync` — Gate 1/2/3 distinction, dry-run-first, create/update default, delete/cancel separate approval.

### Gate status

- **Gate 1:** Repo foundation — in progress (branch `docs/google-calendar-live-sync-gate-1`); commit pending Coordinator approval
- **Gate 2:** Live dry-run — not started; requires separate Coordinator authorization + credentials + `googleapis` install approval
- **Gate 3:** Live apply — not started; requires separate Coordinator authorization + Gate 2 approved artifact

### Backlog

| Item | Reason deferred |
|---|---|
| Gate 2 live dry-run | Separate Coordinator authorization + credential setup + `googleapis` install approval |
| Gate 3 live apply | Separate Coordinator authorization + Gate 2 approved artifact |
| `googleapis` install in `scripts/` | Requires Coordinator approval; not installed in Gate 1 |
| Puzzle v1.6 calendar alignment | After KeepMees Gate 3 complete |

### What should be copied to Puzzle and future repos

`google-calendar-source-schema.md`, `google-calendar-sync-policy.md`, `google-calendar-sync-runbook.md`, `google-calendar-credentials.example.md`, and the four calendar scripts. The skill and command. The `.gitignore` additions for `token.json` and variants. Adapt project name, `os_id` prefix, source records, timezone, and rituals.

---

## 1.5.0 — AI Project OS v1.5: Template GitHub Project Standard (2026-05-26)

**Branch:** Gate 1 merged `7c2c511`; Gate 2 completed on `main` 2026-05-27
**Status:** COMPLETE — Gate 1 merged; Gate 2 complete (dedicated template project created, 13 fields, 14 views)

### What this pass adds

- **Template standard:** `github-projects-template-standard.md` — canonical v1.5 Status vocabulary; two-gate closeout model; preferred template-copy path; canonical fields, views, statuses, owner roles.
- **Template copy runbook:** `github-projects-template-copy-runbook.md` — Gate 1/Gate 2 process; three source options for template; validation steps.
- **Template config example:** `github-projects-template-config.example.json` — committed placeholder example; local config gitignored.
- **Three new scripts:** `github-project-template-dry-run.mjs`, `github-project-template-validate.mjs`, `github-project-template-apply.mjs` — all verified `node --check`; apply script gated by `--apply` and subcommand.
- **New skill + command:** `github-project-template` — SKILL.md with frontmatter; thin command wrapper; two-gate boundary.
- **Canonical Status vocabulary (v1.5):** Backlog, Ready, In Progress, Review / QA, Waiting / Blocked, Done / Shipped, Deferred, Cancelled (8 values; replaces 9-value v1.4 vocabulary).
- **Config-driven template-copy:** `github-project-setup-apply.mjs` auto-detects local template config and selects template-copy over create-from-scratch.
- **Gitignore:** `github-projects-template-config.local.json` protected.

### Gate 2 status

**COMPLETE** (2026-05-27) — Option B: dedicated "AI Project OS Template" project created under GHnol.
- Project: "AI Project OS Template" — GHnol/projects/2 (`PVT_kwHOBuFnQM4BY53W`)
- 13/13 canonical custom fields provisioned via script
- Status field: 8 v1.5 canonical options configured by Founder in GitHub UI
- 14 canonical views created by Founder in GitHub UI; "High Risks" replaces "Risks / Decisions" (GitHub Projects OR-across-fields limitation)
- Local template config written to `github-projects-template-config.local.json` (gitignored)
- Template-copy is now the preferred path for all future AI Project OS repo setups

### Backlog

| Item | Reason deferred |
|---|---|
| Field repair for live KeepMees board (v1.4 → v1.5 Status vocab) | Not needed — live board confirmed at v1.5 canonical (verified 2026-05-27) |

### What should be copied to Puzzle and future repos

`github-projects-template-standard.md`, `github-projects-template-copy-runbook.md`, `github-projects-template-config.example.json`, and the three template scripts. The gitignore addition for `github-projects-template-config.local.json` is universal.

---

## 1.4.0 — AI Project OS v1.4: GitHub Projects Live Provisioning Integration (2026-05-25)

**Branch:** `docs/github-projects-live-provisioning` — merged `1623e7e`
**Status:** COMPLETE — merged 2026-05-26

### What this pass adds

- **Client library:** `scripts/lib/github-projects-client.mjs` — all GitHub Projects GraphQL/REST operations; `requireApply()` mutation guard; no shell injection; no token exposure.
- **Real apply scripts:** `github-project-setup-apply.mjs` and `github-project-import-issues.mjs` fully implemented — not skeletons. Can create real GitHub Projects and import real Issues when invoked with `--apply` and Coordinator approval.
- **Three-layer duplicate detection:** local sync map → external OS ID marker search → new record.
- **Incremental sync map writes:** after each issue on apply (safe to re-run on partial failure).
- **Source records example:** `docs/project-control/github-projects-source-records.example.json` (3 records, all fields).
- **Dry-run enhancements:** auth probe, project scope probe, existing project detection, version check, gitignore check, full planned operations list.
- **`--live` flag** on sync-status for read-only API queries.
- **`--local-map` flag** on field-map for local sync map validation.

### Backlog / manual steps required

- GitHub Projects UI: configure 9 Status options after project is created
- GitHub Projects UI: create 14 views after project is created
- OS audit run to verify all 108+ checks still pass

---

## 1.3.0 — AI Project OS v1.3: External Board Provider Update (2026-05-25)

**Branch:** `docs/github-projects-default-board-provider` → merged to `main` as `3dcf917`
**Status:** COMPLETE — merged 2026-05-25

### What this pass adds

- **GitHub Projects as default board:** `github-projects-setup-policy.md` — one repo-connected GitHub Project per project; GitHub Issues as external task records; 14 views, 9 statuses, 13 custom fields; Owner Role custom field (AI agents never as GitHub Assignees); approval-gated setup.
- **GitHub Projects source schema:** `github-projects-source-schema.md` — full field list for source records; field routing table (Issue title/body, labels, milestone, Project custom fields, local sync map only).
- **GitHub Projects import runbook:** `github-projects-import-runbook.md` — step-by-step dry-run/apply process; gh CLI preflight; rollback strategy.
- **Example field map:** `github-projects-field-map.example.json` — committed example with placeholder IDs only; shows all 13 fields, 14 views, 9 statuses, example issue mappings.
- **GitHub Projects sync log:** `github-projects-sync-log.md` — initial entry records policy change with no live writes.
- **Script scaffolding (5 scripts):** `github-project-setup-dry-run.mjs` (reads docs, prints plan, no writes), `github-project-setup-apply.mjs` (apply skeleton, not yet live), `github-project-import-issues.mjs` (dry-run by default, --apply required), `github-project-sync-status.mjs` (local structural status only), `github-project-field-map.mjs` (validates example map, no external calls).
- **New skill:** `.claude/skills/github-project-setup/SKILL.md` — YAML frontmatter, full protocol for GitHub Projects setup.
- **New command:** `.claude/commands/github-project-setup.md` — thin wrapper → delegates to skill.

### Capability deltas (vs. 1.2.0)

| Capability | Before | After | Status |
|---|---|---|---|
| Default external board provider | ClickUp (implied by CSV) | GitHub Projects (explicit policy) | Policy-driven |
| ClickUp status | Implied default | Explicit optional adapter | Policy-driven |
| GitHub Projects setup policy | No policy | `github-projects-setup-policy.md` | Policy-driven |
| GitHub Projects source schema | No schema | `github-projects-source-schema.md` | Policy-driven |
| GitHub Projects import runbook | No runbook | `github-projects-import-runbook.md` | Policy-driven |
| GitHub Projects dry-run script | Not available | `github-project-setup-dry-run.mjs` | User-invoked |
| GitHub Projects apply skeleton | Not available | `github-project-setup-apply.mjs` (skeleton only) | Backlog (not yet live) |
| GitHub Issue import script | Not available | `github-project-import-issues.mjs` (dry-run default) | User-invoked (apply: backlog) |
| GitHub Projects sync status | Not available | `github-project-sync-status.mjs` (local only) | User-invoked |
| Example field map | Not available | `github-projects-field-map.example.json` | Committed (placeholder IDs) |
| github-project-setup skill | Not available | `.claude/skills/github-project-setup/SKILL.md` | User-invoked |
| /github-project-setup command | Not available | `.claude/commands/github-project-setup.md` | User-invoked |
| GitHub token safety rules | Not documented | Explicit in `external-sync-safety.md` | Policy-driven |
| Sync map unified format | ClickUp + Calendar + TickTick | + GitHub Projects | Policy-driven |

### What is intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- `docs/project-control/clickup-setup-policy.md` — preserved; ClickUp remains optional adapter
- `docs/project-control/clickup-import.csv` — valid as-is; no structural change
- No live GitHub Project created
- No GitHub Issues imported
- No live API integration of any kind
- No Package 5B planning or implementation
- No secrets or credentials

### Backlog

| Item | Reason deferred |
|---|---|
| Live `github-project-setup-apply.mjs` with GraphQL mutations | Needs explicit Coordinator approval + active session testing |
| Live `github-project-import-issues.mjs` --apply execution | Needs approved source record file + Coordinator approval |
| GitHub Project views configuration (some views need UI) | View creation via API may require GraphQL mutations not yet wired |
| `external-sync-map.local.json` populated with real IDs | Requires live project creation first |

### What should be copied to Puzzle and future repos

`github-projects-setup-policy.md`, `github-projects-source-schema.md`, `github-projects-import-runbook.md`, and the 5 GitHub Projects scripts are universal patterns — adapt project name and owner when copying. The example field map and skill/command can be copied as-is and adapted. The safety additions to `external-sync-safety.md` are universal and should be part of the standard bootstrap template.

---

## 1.2.0 — AI Project OS v1.2: External Setup Alignment Patch (2026-05-25)

**Branch:** `docs/align-clickup-setup-ai-os-v1-2` (merged `328d81e`)
**Implementation commit:** `1c76444`
**Status:** COMPLETE — merged 2026-05-25

### What this patch adds

- **ClickUp setup policy:** `docs/project-control/clickup-setup-policy.md` — one primary Project Control Board List; AI OS workflow lanes as saved views/filters, not default separate Lists; hybrid status set; 13 required custom fields; Owner Role as custom field (not ClickUp assignee); one list_id per sync map; per-task external_id.
- **External platform mapping guide:** `docs/project-control/external-platform-mapping-guide.md` — repo doc → ClickUp field mapping; calendar item type guidance; TickTick scope boundaries; external sync safety summary.

### Capability deltas (vs. 0.5.0)

| Capability | Before | After | Status |
|---|---|---|---|
| ClickUp structure definition | Implied by CSV; no explicit policy | Explicit one-List policy with saved views/filters | Policy-driven |
| AI OS lanes in ClickUp | No guidance | Saved views/filters, not separate Lists by default | Policy-driven |
| Custom field definition | Partial (CSV columns only) | Full list of 13 required custom fields | Policy-driven |
| Owner Role rule for AI agents | Not documented | Explicit: custom field only, not ClickUp assignee | Policy-driven |
| External platform mapping | No guide | `external-platform-mapping-guide.md` | Policy-driven |
| external-sync-map.local.json rule | Gitignored; brief mention | Explicitly: never committed; ClickUp list_id and task IDs live here only | Policy-driven |
| example map safety | Noted as example | Explicitly: must contain only placeholder IDs, never real IDs | Policy-driven |

### What is intentionally NOT changed

- `index.html`, `src/**`, `scripts/**` — no product or app code
- `docs/project-control/clickup-import.csv` — valid as-is for import into 01 Project Control Board; no structural change required
- No live ClickUp API integration
- No Google Calendar API implementation
- No external writes
- Package 5B — not started; no planning work for 5B

### Backlog

| Item | Reason deferred |
|---|---|
| Add OS ID, Package, Last Repo Sync, External Sync Status columns to clickup-import.csv | CSV structurally valid without them; fields populated manually after import; requires Coordinator decision on format |
| Live ClickUp API sync | Needs API token (never committed) + Coordinator-authorized package |

### What should be copied to Puzzle and future repos

`clickup-setup-policy.md` and `external-platform-mapping-guide.md` are KeepMees-specific in their task content but the structural patterns (one primary List, saved views/filters, Owner Role custom field, local sync map) apply universally to any AI Project OS repo. Adapt and copy when bootstrapping Puzzle.

The changes to `project-sync-policy.md` and `external-sync-safety.md` (explicit rules on committed vs non-committed files, AI agent assignee rule) are universal and should be part of the standard bootstrap template.

---

## 0.5.0 — AI Project OS Framework Groundwork Pass (2026-05-24)

**Branch:** `docs/ai-project-os-framework-groundwork` (merged `cc7139a`)
**Status:** COMPLETE — merged 2026-05-25

### What this pass adds

- **Skills as canonical layer:** 13 skill folders with SKILL.md frontmatter; commands become compatibility wrappers. Skills: `start`, `handoff`, `precommit`, `closeout`, `package-start`, `switch-to-codex`, `switch-to-claude`, `weekly-sync`, `status-summary`, `os-audit`, `project-sync-dry-run`, `project-sync-apply`, `notification-setup-wizard`.
- **Closeout sync contract:** `docs/dev/closeout-sync-contract.md` — mandatory internal sync check after every meaningful work-unit closeout.
- **Project-control sync foundation:** `project-sync-policy.md`, `project-sync-source-schema.md`, `project-sync-dry-run-format.md`, `external-sync-safety.md`, `external-sync-map.example.json`, `project-sync-log.md`.
- **OS self-audit:** `docs/ai-system/os-self-audit-checklist.md` + `scripts/os-self-audit.mjs`.
- **Notification setup wizard:** `scripts/setup-claude-notification.ps1` + skill + command wrapper.
- **Safe scripts (4):** `os-self-audit.mjs`, `project-control-sync-dry-run.mjs`, `project-control-sync-validate.mjs`, `setup-claude-notification.ps1`. All read-only, dependency-free, no external writes.

### Capability deltas (vs. 0.4.0)

| Capability | Before | After | Status |
|---|---|---|---|
| Skills | Placeholder README only | 13 live SKILL.md files with frontmatter | User-invoked |
| Commands | Full protocol in command file | Thin wrapper → delegates to skill | User-invoked |
| Post-package sync | Manual / ad hoc | Mandatory internal sync check via closeout-sync-contract | Policy-driven |
| External sync | No policy | Dry-run/apply with approval; stable IDs; external safety rules | Semi-automatic |
| OS self-audit | Not available | `/os-audit` + `scripts/os-self-audit.mjs` | User-invoked |
| Notification setup | Manual instructions only | `/notification-setup-wizard` + PowerShell script (dry-run default) | User-level setup |
| Project-control drift detection | Ad hoc | `/project-sync-dry-run` + script | User-invoked |
| Bootstrap verification | Informal checklist | Formal `os-self-audit-checklist.md` + script | User-invoked |

### What is intentionally NOT changed

- `index.html`, `src/**` (app/product code)
- Scope-guarded constants and product gates
- No Google Calendar API implementation (dry-run/apply only)
- No live Claude hooks committed
- Package 5A — complete; no new product package authorized

### Backlog

| Item | Reason deferred |
|---|---|
| Live Google Calendar API sync | Needs OAuth credentials (never committed) + authorized package |
| `scripts/generate-project-calendar.mjs` | Needs stable UID design + Coordinator authorization |
| Additional commands (`/context-budget`, `/scope-check`) | Can be added in a future pass |
| CI workflows | Not authorized; tests run locally |

### What should be copied to Puzzle and future repos

All of `docs/ai-system/`, all of `docs/dev/` (including `closeout-sync-contract.md`), all of `docs/qa/` templates, `.claude/skills/` pattern (adapt to new project), `.claude/commands/` wrappers, `scripts/os-self-audit.mjs`, `scripts/project-control-sync-dry-run.mjs`, `scripts/project-control-sync-validate.mjs`, `scripts/setup-claude-notification.ps1`. KeepMees-specific project-control content does not travel.

---

## 0.4.0 — AI Project OS Usability Patch — Short Command Interface (2026-05-24)

**Branch:** `docs/ai-project-os-usability-patch`
**Merge commit:** `cb920be`
**Status:** merged to main

### What this patch adds

- **Short Command Interface:** 10 live command files in `.claude/commands/` replacing pasted protocols for daily startup, handoff, precommit, closeout, tool switching, weekly sync, calendar sync, and status summary.
- **Calendar Sync Layer planning:** `calendar-sync-policy.md`, `calendar-source-template.md`, `calendar-sync-log.md` — planning docs for future automated calendar sync without Google Calendar API implementation yet.
- **Shareable Status Summary:** `docs/project-control/shareable-status-summary.md` — internal and public-safe status in one file.
- **Notification docs refresh:** PermissionRequest hook guidance, double-beep warning, Windows toast fallback, CLAUDE_CONFIG_DIR troubleshooting added to `notification-setup.md`.
- **State correction:** stale status-sync branch language removed from `CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md`; version 0.3.1 status corrected in this file.

### Capability deltas (vs. 0.3.1)

| Capability | Before | After | Status |
|---|---|---|---|
| Daily startup | Paste long prompt or read session-restart-protocol.md manually | `/start` command file | User-invoked |
| Checkpoint / handoff | Paste long handoff prompt | `/handoff` command file | User-invoked |
| Pre-commit verification | Paste pre-commit checklist or read template manually | `/precommit` command file | User-invoked |
| Package closeout | Paste closeout prompt | `/closeout` command file | User-invoked |
| Tool switching | Paste tool-switching prompt | `/switch-to-codex`, `/switch-to-claude` command files | User-invoked |
| Weekly sync | Paste weekly-sync prompt | `/weekly-sync` command file | User-invoked |
| Calendar sync planning | No structured process | `/calendar-sync-plan` command file + planning docs | User-invoked; API automation Backlog |
| Shareable status | No structured output | `/status-summary` command file + `shareable-status-summary.md` | User-invoked |
| Status-sync stale language | Misleading in AI_HANDOFF.md, CURRENT_STATE.md, NEXT_SESSION_PROMPT.md | Corrected | Done |
| v0.3.1 status | Incorrectly showed PROPOSED | Corrected to merged | Done |

### What is intentionally NOT changed

- `index.html`, `src/**`, `scripts/**`
- Scope-guarded constants and product gates
- Google Calendar API implementation (planning docs only)
- Live hooks, subagents, skill packages (format not yet verified)

### Backlog

| Item | Reason deferred |
|---|---|
| `scripts/generate-project-calendar.mjs` | Needs explicit Coordinator authorization + stable UID design |
| `scripts/sync-project-calendar.mjs` | Needs Google Calendar API credentials (never committed) + authorized package |
| Additional commands (`/context-budget`, `/scope-check`, `/batch-plan`, `/qa-verify`) | Can be added in a future pass when needed |

---

## 0.3.1 — Patch — Post-Commit State Rule (2026-05-22)

**Branch:** `docs/post-commit-state-rule`
**Merge commit:** `9be0f81` — merge: clarify post-commit state handling
**Status:** merged to main
**main HEAD before patch:** `3ce8657` (Package 2.9 status-sync merge)

### What this patch adds

A universal Post-Commit State Rule that prevents recursive state-sync loops. Durable state files (`CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md`, `docs/command-center/*`, `docs/project-control/*`) may be a pre-commit or expected-post-commit snapshot. Commit hashes belong in the post-commit closeout report (chat, PR description, changelog), not amended into the file being committed. Future sessions verify HEAD during preflight; that verification is the corrective control for one-commit lag — not another sync commit.

### Files changed

| File | Change |
|---|---|
| `docs/ai-system/universal-standards.md` | Added top-level "Post-Commit State Rule" section (canonical wording, seven numbered clauses, misdirection examples) |
| `docs/dev/package-boundary-closeout-protocol.md` | Added "Post-Commit State Rule (applies to status sync decisions)" after the status-sync-as-separate-commit section |
| `docs/dev/session-restart-protocol.md` | Added "HEAD verification at preflight (Post-Commit State Rule)" subsection under Verification rules |
| `docs/dev/auto-management-protocol.md` | Bound the rolling-update duty with the rule; added quick-reference row |
| `docs/ai-system/bootstrap-template.md` | Added § 8a so the rule travels to every future repo bootstrapped from this OS |
| `docs/ai-system/CHANGELOG.md` | Entry for this patch |
| `docs/ai-system/version-history.md` | This row + section |

### Capability deltas (vs. 0.3.0)

| Capability | Before | After | Automatic / Semi-auto / Policy |
|---|---|---|---|
| Post-Commit State Rule | Implicit; agents sometimes spun follow-up state-sync commits purely to update HEAD hashes in committed docs | Explicit universal rule with canonical wording in `universal-standards.md` and aligned cross-references in three dev protocols and the bootstrap template | Policy-driven |

### What is intentionally NOT changed

- `index.html`, `src/**`, `scripts/**` (app/product code) — off limits
- `CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md` — their recorded `main HEAD` (`a20af30`) lags the actual `main` HEAD (`3ce8657`) by one commit. Under the new rule this is **cosmetic** and is **not** sufficient reason for a follow-up state-sync commit; the next session will reconcile via preflight `git log` / `git rev-parse HEAD`
- `docs/command-center/*`, `docs/project-control/*` — scanned; no conflicting wording was found
- Package 5A — remains paused
- Locked product/vendor/manufacturing decisions

### Backlog created by this patch

None.

### What should be copied to Puzzle and future repos

The Post-Commit State Rule is universal and copies through `docs/ai-system/universal-standards.md` plus the cross-referenced sections in `docs/dev/package-boundary-closeout-protocol.md`, `docs/dev/session-restart-protocol.md`, `docs/dev/auto-management-protocol.md`, and `docs/ai-system/bootstrap-template.md`. These files are already on the bootstrap copy list.

### Blockers before returning to Package 5A

None added by this patch. Package 5A remains paused pending explicit Coordinator authorization.

---

## 0.3.0 — Package 2.9 — AI Project OS Auto-Management Upgrade Pass (2026-05-22)

**Branch:** `docs/ai-project-os-auto-management-upgrade`
**Implementation commit:** `81c5069`
**Merge commit:** `a20af30`
**main HEAD after merge:** `a20af30` (post-merge status sync follows on a separate `docs/sync-command-center-after-package-2-9` branch)

### Capability deltas (vs. 0.2.0)

| Capability | Before | After | Automatic / Semi-auto / Policy |
|---|---|---|---|
| Universal AI Project OS docs | Implicit, scattered across `AGENTS.md` and `docs/dev/` | Explicit `docs/ai-system/` directory with README, standards, bootstrap, changelog, version-history | Policy-driven |
| Model routing (which model for which task) | Not documented | `docs/dev/model-routing-protocol.md` | Semi-auto (agent recommends, user confirms) |
| Token efficiency rules | Implicit | `docs/dev/token-efficiency-protocol.md` | Policy-driven |
| Context budget at session start | Implicit | `docs/dev/context-budget-checklist.md` | Policy-driven |
| Tool batching plan format | Implicit | `docs/dev/tool-batching-protocol.md` | Policy-driven |
| Package boundary closeout | Embedded in `package-closeout-protocol.md` | Dedicated `docs/dev/package-boundary-closeout-protocol.md` covering boundary recommendation + fresh-session preference | Policy-driven |
| Auto-management umbrella | Not present | `docs/dev/auto-management-protocol.md` | Policy-driven |
| Permission notification (beep on wait) | Not documented | `docs/dev/notification-setup.md` (user-level) | User-level setup — each contributor installs themselves; once installed, the harness fires it for that contributor; not committed; not enforced on other contributors |
| Test strategy first-class | Implicit | `docs/qa/test-strategy.md` | Policy-driven |
| Package verification template | Not present | `docs/qa/package-verification-template.md` | Policy-driven |
| Custom slash commands placeholder | Not present | `.claude/commands/README.md` (readiness only) | Backlog |
| High-uncached-context trigger | Not documented | New section in `context-hygiene-protocol.md` | Policy-driven |
| Fresh-session preference over `claude --continue` | Not documented | Explicit in `auto-management-protocol.md` and `CLAUDE.md` | Policy-driven |
| AI-OS-level changelog | Mixed into product changelogs | `docs/ai-system/CHANGELOG.md` | Policy-driven |
| Bootstrap template for future repos | Not present | `docs/ai-system/bootstrap-template.md` | Policy-driven |

### What automatic actually means here

- The harness fires user-level hooks if a contributor installs them (none committed to this repo; see `docs/dev/notification-setup.md`).
- Git enforces `.gitignore` patterns (genuinely automatic — the git engine refuses to add ignored files).
- Pre-commit hooks fire if a contributor configures them in `.git/hooks/` or via husky. **No pre-commit hook is committed to this repo today.**
- No CI workflows are committed (no `.github/workflows/*`). Tests run locally before commit at agent/user discretion.
- Git identity / remote correctness is **policy-driven only** — `CLAUDE.md` requires the agent to verify `git remote -v` + `git config user.name` + `git config user.email` before any push/commit/gh command, but no hook or script auto-enforces this. If a future pass adds a `pre-commit` or `pre-push` hook that fails when identity is wrong, that becomes automatic; until then it is procedural.
- Everything else listed under "Policy-driven" depends on the agent obeying the rule. The OS does **not** enforce these via code.

### Backlog created by this pass

Items deferred but documented:

| Item | Reason | Where tracked |
|---|---|---|
| Live Claude hooks committed to `.claude/settings.json` | Tool-version-specific; PowerShell beep would fail silently on macOS/Linux contributors | `.claude/agents/README.md`, this file |
| Live Claude subagent YAML | Tool-version-specific frontmatter | `.claude/agents/README.md` |
| Live Claude skill packages | Tool-version-specific format | `.claude/skills/README.md` |
| Live Claude custom slash commands | Tool-version-specific format | `.claude/commands/README.md` |
| `.codex/config.toml` | Codex config schema not verified | `.codex/README.md` |
| Worktree automation scripts | Not needed at current cadence | `docs/dev/worktree-and-parallel-session-policy.md` |
| Browser smoke tests (separate from E2E) | Not authorized | `docs/qa/test-strategy.md` |
| Visual regression tests | Package 3D scope | `docs/qa/test-strategy.md` |
| Print-preview verification scripts | Vendor-gated | `docs/qa/test-strategy.md` |
| Artifact generation checks | Not in launch set | `docs/qa/test-strategy.md` |
| Real `package-closeout.sh` / `session-launcher.sh` | Useful but unproven; defer until shape is settled | `docs/dev/package-boundary-closeout-protocol.md` |
| n8n / Make / Zapier flows | Future phase | `docs/ops/ai-automation-register.md` |
| GitHub Projects board | Coordinator decision pending | `docs/command-center/next-actions.md` |
| NotebookLM adoption | Coordinator decision pending | `docs/command-center/next-actions.md` |

### What should be copied to Puzzle and future repos

All of `docs/ai-system/`, all of `docs/dev/`, all of `docs/qa/` templates, `.github/PULL_REQUEST_TEMPLATE.md`, `.gitignore` universal block, and the four root continuity files. KeepMees-specific items (Tower content, BOOK_* constants, vendor/manufacturing gates) do not travel.

### Project Control Tower alignment notes

The Tower (`docs/project-control/`) is project-specific and stays as-is. Package 2.9 adds the universal OS layer beside it; the Tower remains the live coordination layer for KeepMees. No Tower content was rewritten.

`docs/project-control/README.md` adds a one-line cross-reference to `docs/ai-system/`. `coordinator-weekly-sync.md` adds a 2026-05-22 weekly-log row noting the OS pass.

### Blockers before returning to Package 5A

None added by this pass. The Foundation Operating System Gate (`docs/project-control/phase-gates.md` Gate 1) was passed by Package 2.8. Package 5A remains paused pending explicit Coordinator authorization — that authorization is the only gate.

---

## 0.2.0 — Package 2.8 — KeepMees Project Control Tower (2026-05-17)

**Branch:** `docs/project-control-tower`
**Feature commit:** `2a5fb54`
**Merge commit:** `bdb73db`

OS-layer effect: introduced the live `docs/project-control/` Tower (22 files) as the project's repo-native coordination layer. Project-specific content does not travel via the bootstrap template, but the *pattern* of having a Tower does.

Capability deltas vs. 0.1.0: live roadmap, schedule, sprint, backlog, kanban, gates, decisions, risks, calendar `.ics`, ClickUp/TickTick imports, 7/30/90-day plans, coordinator-weekly-sync, next-session-prompt.

Foundation Operating System Gate (Gate 1) became passable.

---

## 0.1.0 — Package 2.7 — AI Development Operating System Upgrade Pass (2026-05-17)

**Branch:** `docs/ai-development-operating-system-upgrade`
**Feature commit:** `6dde21b`
**Merge commit:** `cebdc72`

OS-layer effect: introduced `AGENTS.md` as the universal contract; `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` as continuity files; the first `docs/dev/` protocols (session-restart, context-hygiene, model-switching, tool-switching, scope-boundaries, worktree, Claude/Codex interchangeability); QA pre-commit + release-readiness templates; `.claude/agents` + `.claude/skills` + `.codex` readiness placeholders; hardened `.gitignore`.

Capability deltas vs. pre-2.7: durable continuity files, formal Claude/Codex interchangeability, dedicated dev workflow protocols, dedicated QA templates.

---

## How to add a new entry

When an OS upgrade pass closes, add a row to the version index and a full section above. Include:

1. Branch + commit hashes
2. Capability deltas vs. the previous version
3. What automatic actually means for the new capabilities (label each: automatic / semi-auto / policy-driven / user-level / backlog)
4. Backlog created by the pass
5. What should be copied to other repos
6. Project Control Tower alignment notes
7. Blockers before the next authorized product package

Do not pre-fill version numbers — increment when the pass closes.
