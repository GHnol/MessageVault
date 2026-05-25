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

## How to avoid recursive state-sync churn

The Post-Commit State Rule (canonical wording: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule") prevents recursive loops:

1. Durable state files may describe the pre-commit verified state or the expected post-commit state.
2. The actual commit hash belongs in the post-commit report (chat, PR body, changelog), not inside the file being committed.
3. The next session verifies HEAD during preflight — that verification is the corrective control for one-commit lag, not another commit.
4. A follow-up state-sync commit is required only when the docs would misdirect the next agent. Cosmetic lag does not qualify.
5. Do not chain sync commits: if sync commit A creates a lag in commit B which creates a lag in commit C — stop at A. The chain is the problem, not the solution.

---

## Required closeout report format

A complete closeout report (produced by the `closeout` skill, output to chat) includes:

1. Package name + status
2. Branch and commit summary (if commit happened)
3. Verification results
4. Files changed vs. authorized scope
5. Internal sync check result — what was verified, what was updated, what was skipped and why
6. External dry-run result (if applicable) — proposed delta or "no external sync needed"
7. Proposed commit message
8. Proposed merge plan
9. Proposed status-sync commit plan
10. Recommended session shape for next package
11. Blockers, if any

---

## What this contract does NOT do

- It does not commit or push — those remain explicit user-instruction steps.
- It does not write to external systems — all external sync is dry-run/apply with approval.
- It does not replace the package verification gate (`docs/qa/package-verification-template.md`).
- It does not override the Post-Commit State Rule.
- It does not invent new project authority — Coordinator decisions are the only product authority.
