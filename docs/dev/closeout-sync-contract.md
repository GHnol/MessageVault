# Closeout Sync Contract

**Status:** ACTIVE (introduced in AI Project OS Framework Groundwork Pass, 2026-05-24)
**Applies to:** Claude Code and Codex in this repository
**Companion to:** `docs/dev/package-boundary-closeout-protocol.md`, `docs/dev/auto-management-protocol.md`

---

## What this contract does

This contract defines what every meaningful work-unit closeout must update, when internal project-control sync is mandatory, when external sync dry-runs are mandatory, and how to avoid recursive state-sync churn. It is the authoritative reference for sync obligations during the `closeout` skill and the `project-sync-dry-run` skill.

---

## Trigger events — what counts as a meaningful closeout

The following events require an internal sync check. Each one is a trigger:

| Event | Internal sync check required |
|---|---|
| Package complete (merged to main) | Yes — mandatory |
| Package paused (blocked, not merged) | Yes — update AI_HANDOFF.md at minimum |
| Package blocked (new external blocker discovered) | Yes — update AI_HANDOFF.md and risk register if relevant |
| Commit completed (on any branch) | Yes — verify that durable state files are not operationally misleading |
| Merge completed (any branch → main) | Yes — mandatory |
| Branch handoff (Claude → Codex or vice versa) | Yes — full handoff skill sequence |
| Model switch | Yes — update all three continuity files before switch |
| Tool switch | Yes — full switch-to-codex or switch-to-claude skill sequence |
| Project-control change (roadmap, sprint, backlog) | Yes — verify Tower docs reflect the change |
| Milestone/gate change (gate crossed or moved) | Yes — update kanban, sprint, schedule |
| Schedule/date change | Yes — update master-schedule.md; calendar dry-run if relevant |
| Task/backlog status change (significant) | Yes — update kanban-board.md and backlog.md |
| Major planning change (new decision, priority shift) | Yes — update decision-log.md and affected Tower docs |

Small cosmetic edits (typo fixes, minor wording), single-file doc cleanups, and trivial in-flight edits do not require a sync check.

---

## What the internal sync check must verify

For each trigger event, the agent checks whether the following are operationally current. "Operationally current" means: would the current state of this file misdirect the next agent into the wrong branch, wrong package, wrong task, unsafe scope, or stale blocker?

| File / artifact | Check |
|---|---|
| `AI_HANDOFF.md` | Status, branch, package, done/remaining, next action — current? |
| `CURRENT_STATE.md` | Last-closed package, active package, active branch, main HEAD — current? |
| `NEXT_SESSION_PROMPT.md` | Next-action pointer and current-pointer table — current? |
| `docs/project-control/current-sprint.md` | Sprint tasks, statuses, blocked items — reflects post-trigger truth? |
| `docs/project-control/kanban-board.md` | Package cards in correct columns? Done items marked? |
| Backlog | Significant status changes captured? |
| Risk register | New blockers added? Lifted blockers cleared? |
| Decision log | New decisions recorded? |
| Shareable status summary | Significantly out of date? (less urgent — update weekly or after a major phase change) |
| Calendar source/export staleness | Has the schedule shifted enough that calendar events are misleading? |
| ClickUp/TickTick export staleness | Has enough changed that reimporting would help the Coordinator? |

---

## When internal doc edits are required vs when they can be skipped

**Required (edit the doc):**
- The doc would misdirect the next agent into the wrong branch, wrong package, wrong task, unsafe scope, or stale blocker.
- A package status changed from in-progress to complete (or paused, or blocked).
- A sprint task changed from Waiting to Done.
- A kanban card belongs in a different column.
- A blocker has been lifted or introduced.
- The next-action pointer in `NEXT_SESSION_PROMPT.md` is no longer accurate.

**Allowed to skip (do not edit):**
- Only the `main HEAD` hash is cosmetically stale by one commit.
- A doc uses "after this commit lands" phrasing — expected and fine.
- A timestamp is a few hours stale but all operational fields (package, branch, scope, next action) are still accurate.
- A field would be identical after the edit (the current wording already reflects post-trigger truth).

**Rule:** If in doubt, check whether the stale wording would cause the next agent to do the wrong thing. If yes, edit. If no, skip.

---

## When external sync dry-run is mandatory

Run a `project-sync-dry-run` after:
- A package closes (to check whether calendar milestones, ClickUp, or TickTick need updating)
- A schedule or date changes materially
- A new phase gate is crossed or added
- The weekly sync ritual (mandatory at Project Control Sync — Friday)
- When the Coordinator suspects Tower drift

Do not run an external dry-run for:
- Cosmetic doc cleanups
- Purely internal OS/dev protocol updates
- Single-commit hotfixes with no schedule or task impact

---

## External sync safety rules

External tool writes (Google Calendar, ClickUp, TickTick) are **always** dry-run/apply with approval. The rules:

1. Always produce a delta before applying.
2. Classify each proposed change: stable recurring ritual / dynamic milestone / task / new ritual.
3. Wait for explicit Coordinator approval.
4. Apply only after approval.
5. No destructive deletes without approval.
6. No silent overwrites of external user edits.
7. Log every applied change in `docs/project-control/project-sync-log.md`.
8. Never store credentials, OAuth tokens, or API keys in the repo.

See `docs/project-control/external-sync-safety.md` for the full safety rules.

---

## How to classify stale state

| Stale state type | Classification | Action |
|---|---|---|
| HEAD hash lags by one commit, all other fields accurate | Cosmetic | Skip — preflight `git log` is the corrective control |
| Active package still shows "in progress" after merge | Operationally misleading | Edit — required |
| Branch name in AI_HANDOFF.md no longer exists | Operationally misleading | Edit — required |
| Sprint task still "In Progress" after package close | Operationally misleading | Edit — required |
| Kanban card in wrong column post-package | Operationally misleading | Edit — required |
| Risk register missing a new blocker | Operationally misleading | Edit — required |
| A timestamp is a few hours stale, all operational fields accurate | Cosmetic | Skip |
| Shareable status summary 1 week stale with no major phase change | Minor staleness | Defer to weekly sync |
| Calendar event date slightly off (< 1 week) | Minor staleness | Note in weekly sync; dry-run before adjusting |

---

## State-Sync Decision Matrix (AI Project OS v1.7)

Run the freshness validator before proposing a commit or merge:

```
node scripts/state-freshness-check.mjs
node scripts/state-freshness-check.mjs --json
node scripts/state-freshness-check.mjs --strict
```

### FAIL — must fix before commit / merge / next package

A FAIL means the doc would misdirect the next agent into unsafe or wrong work. Fix before committing.

| Condition | Code | Example |
|---|---|---|
| State doc records a branch that does not match `git branch --show-current` | `FAIL_WRONG_ACTIVE_BRANCH` | `AI_HANDOFF.md` says `main` but current branch is `docs/ai-project-os-v1-7-*` |
| Active package shown as "in progress" for an already-merged branch | `FAIL_WRONG_ACTIVE_PACKAGE` | Handoff says Package 5A in progress after `297a221` merged |
| Package 5B shown as started or authorized without a blocker qualifier | `FAIL_PACKAGE_5B_UNAUTHORIZED` | `Active package: Package 5B — implementing proof approval UI` |
| Implementation branch shown as active after merge | `FAIL_STATUS_SYNC_BRANCH_STALE_ACTIVE` | Kanban In Progress contains `docs/google-calendar-live-sync-gate-1` after merge |
| Completed gate still marked in-progress in a way that authorizes wrong work | `FAIL_COMPLETED_GATE_MARKED_IN_PROGRESS` | v1.6 Gate 3 marked NOT COMPLETE in a state doc used to decide whether to run apply |
| External apply shown as authorized when it is not | `FAIL_EXTERNAL_APPLY_AUTH_MISMATCH` | Handoff says `gate3_apply_allowed: true` without Coordinator approval |
| Local/private file not protected by `.gitignore` | `FAIL_LOCAL_PRIVATE_FILE_NOT_IGNORED` | `external-sync-map.local.json` not gitignored |
| Test baseline materially wrong in a way that affects package verification | `FAIL_TEST_BASELINE_MATERIAL_MISMATCH` | `test-strategy.md` says 1466 tests but confirmed baseline is 1603 |
| Kanban In Progress column references a merged/closed implementation branch | `FAIL_STATUS_SYNC_BRANCH_STALE_ACTIVE` | `fix/google-calendar-sync-map-read-path` in In Progress after merge |

### WARN — disclose in closeout report; no follow-up sync commit required unless escalated

A WARN means the doc is cosmetically stale but does not authorize wrong work. Include in the closeout report; fix when convenient but do not spin a state-sync commit solely for this.

| Condition | Code | Example |
|---|---|---|
| HEAD hash in state doc lags by one or more commits; branch/package/task pointer is correct | `WARN_HEAD_HASH_LAG` | `AI_HANDOFF.md` says HEAD `3c641a9` but actual HEAD is `2645ebb` (one state-sync commit ahead) |
| CHANGELOG entry says "IN PROGRESS" for a completed/merged pass | `WARN_CHANGELOG_STATUS_LAG` | v1.6 Gate 2A entry still says `Status: IN PROGRESS` after v1.6 is fully merged |
| version-history entry says "In progress on branch" for a merged branch | `WARN_VERSION_HISTORY_STATUS_LAG` | `docs/google-calendar-oauth-path-alignment` listed as in-progress after merge |
| Timestamp in state doc is a few hours or days stale but operational fields are accurate | `WARN_TIMESTAMP_STALE` | `Last updated: 2026-05-31` when today is `2026-06-01` |
| Model ID examples in routing docs name a superseded model generation | `WARN_MODEL_EXAMPLE_REFRESH_NEEDED` | `model-routing-protocol.md` says Opus 4.7 but current is Opus 4.8 |
| Project-control docs are behind but do not authorize wrong work | `WARN_PROJECT_CONTROL_COPY_LAG` | `kanban-board.md` missing v1.5/v1.6 in Done; `current-sprint.md` closed with no new sprint |

### PASS — no action required

PASS means the field is current, or any lag is cosmetic and covered by the Post-Commit State Rule.

| Condition | Example |
|---|---|
| Branch, package, and next-action all match git state | `AI_HANDOFF.md` says `docs/ai-project-os-v1-7-*`, git agrees |
| Package 5B correctly shows "blocked" or "not started" | `Package 5B: Not started — blocked until v1.7 complete and Coordinator authorization` |
| No external apply authorized without explicit approval artifact | Apply guards in place; `gate3_apply_allowed: false` |
| All local/private files are gitignored | `external-sync-map.local.json` → matched by `.gitignore` |
| Test baseline reflects the actual confirmed count | `test-strategy.md` says 1603 (Package 5A baseline) |
| Cosmetic HEAD lag is the only issue; operational fields are correct | Branch and package are correct; one-commit hash lag only |

### Package 5B permanent rule

**Package 5B remains blocked until ALL of the following are true:**
1. v1.7 all gates are complete and merged.
2. The Coordinator explicitly authorizes Package 5B product work in that session.
3. A fresh session is started and reads the authorization from AI_HANDOFF.md.

The validator (`FAIL_PACKAGE_5B_UNAUTHORIZED`) flags any state doc that shows Package 5B as active without all three conditions verified.

### External apply authorization rule

**No external system may be mutated without explicit Coordinator approval AND a valid approved artifact:**

- Google Calendar: requires `--apply` + `--approved-dry-run <path>` + `--confirm-live-calendar-apply`; `gate3_apply_allowed: true` in the approved artifact.
- GitHub Projects: requires `--apply` + explicit Coordinator authorization in the session.
- ClickUp / TickTick: approval-gated via `/project-sync-apply` only.

The validator (`FAIL_EXTERNAL_APPLY_AUTH_MISMATCH`) flags any state doc that shows external apply as authorized or pending when it is not.

### Post-Commit State Rule reminder

Do not spin a state-sync commit solely because of cosmetic HEAD hash lag. Durable state files may describe the pre-commit verified state or the expected post-commit state. Commit hashes belong in post-commit reports (chat, PR body, changelog) — not amended into the committed file. The next session verifies HEAD during preflight; that verification is the corrective control.

Canonical rule: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule"

---

## How to avoid recursive state-sync churn

The Post-Commit State Rule (canonical wording: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule") prevents recursive loops:

1. Durable state files may describe the pre-commit verified state or the expected post-commit state.
2. The actual commit hash belongs in the post-commit report (chat, PR body, changelog), not inside the file being committed.
3. The next session verifies HEAD during preflight — that verification is the corrective control for one-commit lag, not another commit.
4. A follow-up state-sync commit is required only when the docs would misdirect the next agent. Cosmetic lag does not qualify.
5. Do not chain sync commits: if sync commit A creates a lag in commit B which creates a lag in commit C — stop at A. The chain is the problem, not the solution.

---

## Report mirroring requirement

Every meaningful closeout must state a report mirror outcome. The outcome is one of:

| Outcome | Meaning | When to use |
|---|---|---|
| `MIRRORED` | Sanitized entry added to `report-mirror-log.md` | Package closeout, gate closeout, merge closeout, external sync apply, major planning change, tool switch handoff, incident resolution, OS audit with new verdict |
| `SKIPPED` | No committed entry; reason stated | Local-only dry-run with no external operation; trivial cosmetic edit with no operational value; validator run with unchanged result |
| `NOT NEEDED` | No operational value; reason stated | Cosmetic Post-Commit State Rule hash lag only; tiny typo correction |
| `BLOCKED` | Report contains sensitive data; follow-up required | Report was rejected due to secret-risk detection; sanitize before resubmitting |

Report mirroring is required as a **check** at every meaningful closeout. It is not required as a **committed log entry** every time.

Examples:
- Package closeout with hashes, files, and next action → `MIRRORED`
- State-sync commit for cosmetic hash lag only → `NOT NEEDED`
- Local-only `--dry-run` with no apply → `SKIPPED — local artifact only`
- Report pasted from chat contains an accidentally included credential pattern → `BLOCKED until sanitized`

Script:
```
node scripts/report-mirror-intake.mjs --input <path> --type <type> --dry-run
node scripts/report-mirror-intake.mjs --input <path> --type <type> --apply
```

Policy: `docs/project-control/report-mirror-policy.md`
Runbook: `docs/project-control/report-intake-runbook.md`

---

## Required closeout report format

A complete closeout report (produced by the `closeout` skill, output to chat) includes:

1. Package name + status
2. Branch and commit summary (if commit happened)
3. Verification results
4. Files changed vs. authorized scope
5. Internal sync check result — what was verified, what was updated, what was skipped and why
6. Report mirror outcome — `MIRRORED` / `SKIPPED` / `NOT NEEDED` / `BLOCKED` with reason
7. External dry-run result (if applicable) — proposed delta or "no external sync needed"
8. Proposed commit message
9. Proposed merge plan
10. Proposed status-sync commit plan
11. Recommended session shape for next package
12. Blockers, if any

---

## External sync consistency requirement (AI Project OS v1.7 Gate 5)

When external sync files changed in a pass (source records, sync logs, sync map, or any `google-calendar-*` / `github-projects-*` policy/runbook files), the external sync consistency validator must be run before the closeout is proposed:

```
node scripts/external-sync-consistency-check.mjs
node scripts/external-sync-consistency-check.mjs --local-only
```

FAIL results block the closeout. WARN results must be disclosed in the closeout report. PASS allows proceeding.

| Outcome | Required action |
|---|---|
| PASS | Include in closeout report; proceed |
| WARN | Disclose in closeout report; explain each WARN; may proceed unless escalated |
| FAIL | Fix before proposing commit; do not proceed until resolved |

Policy: `docs/project-control/external-sync-consistency-policy.md`
Schema: `docs/project-control/external-sync-consistency-schema.md`
Log: `docs/project-control/external-sync-consistency-log.md`

---

## What this contract does NOT do

- It does not commit or push — those remain explicit user-instruction steps.
- It does not write to external systems — all external sync is dry-run/apply with approval.
- It does not replace the package verification gate (`docs/qa/package-verification-template.md`).
- It does not override the Post-Commit State Rule.
- It does not invent new project authority — Coordinator decisions are the only product authority.
