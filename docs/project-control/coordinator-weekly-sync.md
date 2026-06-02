# Coordinator Weekly Sync

**Status:** ACTIVE (from Package 2.8 — activates once the Tower is merged).
**Last updated:** 2026-05-17 (America/New_York)
**Owner:** Coordinator (Chat 01)
**Cadence:** Weekly — Project Control Sync, Fridays 19:30 ET (see `calendar-spec.md`).

The Coordinator owns keeping all six layers synchronized. Repo docs are source of truth; external tools (ClickUp / TickTick / Calendar / Kanban) never override the repo unless the Coordinator syncs the change back here.

---

## Inputs the Coordinator needs

- `git log --oneline -10`, `git status`
- `CURRENT_STATE.md`, `AI_HANDOFF.md`
- `docs/command-center/current-status.md`, `next-actions.md`
- This directory: `current-sprint.md`, `backlog.md`, `kanban-board.md`, `master-schedule.md`, `risk-register.md`, `decision-log.md`, `phase-gates.md`
- Any external-tool changes the founder made during the week

## Docs the Coordinator checks (read)

1. `CURRENT_STATE.md` — does it match `git log`?
2. `docs/command-center/current-status.md` — last closed package + main HEAD correct?
3. `phase-gates.md` — any gate now passable or newly blocked?
4. `risk-register.md` — any risk escalated or triggered?
5. `decision-log.md` — any open decision now decidable?

## Docs the Coordinator updates (write)

| Doc | Update when |
|---|---|
| `current-sprint.md` | Always — reflect the week's reality + next sprint if rolling over |
| `next-7-days.md` | Always — refresh for the coming week |
| `kanban-board.md` | When cards move |
| `backlog.md` | When priorities/status change |
| `master-schedule.md` | When dates/confidence change |
| `master-roadmap.md` | At Monthly Roadmap Reset (or when a phase changes state) |
| `risk-register.md` | When a risk changes |
| `decision-log.md` | When a decision is made |
| `next-30-days.md` / `next-90-days.md` | Monthly, or when a milestone shifts materially |
| `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` | When project state or the next pointer changes |
| `weekly log` (below) | Every week — what changed, what did not |

## External tool sync rules

- **ClickUp CSV (`clickup-import.csv`):** refresh only if board-level tasks materially changed. Regenerate from `backlog.md` + `current-sprint.md`. Re-import replaces, does not merge — note this.
- **TickTick (`ticktick-import.csv`, routines, checklist):** refresh only if this-week tasks or routines changed. Keep check-off-sized.
- **Google Calendar (`calendar-spec.md` + `.ics`):** change `calendar-spec.md` first, regenerate the `.ics`, re-import (Google updates by UID). Only when rituals/milestones change.
- **Kanban (`kanban-board.md`):** the file is authoritative; any external Kanban tool mirrors it.
- **Drift handling:** if an external tool was changed and not reflected here, either (a) sync the change into the repo docs, or (b) discard the external change. Never let the external tool silently become truth.

## Weekly process checklist

1. Pull latest `main`; run `git log`/`git status`.
2. Read the check docs above.
3. Update the write docs above.
4. Review gates: did any pass / newly block? Record in `phase-gates.md` + `decision-log.md`.
5. Risk pass (full pass monthly; deltas weekly).
6. Decide next authorized package (or confirm hold). Keep Package 5A paused until its gate passes.
7. Regenerate external tool files only if their content changed.
8. Regenerate `NEXT_SESSION_PROMPT.md` + update `next-session-prompt.md`.
9. Update Claude/Codex handoff: ensure `AI_HANDOFF.md` reflects reality (Operator Mode).
10. Write the weekly log line.

## What gets committed vs. not

- **Committed:** all `docs/project-control/` doc + CSV + the single repo-native `.ics` (`keepmees-project-calendar.ics`), continuity files.
- **Not committed / generated-local:** any ad-hoc exports, scratch reports, `*.pdf`, additional `.ics` variants, anything matching `.gitignore`. Never commit secrets, `_source-intake/`, `.claude/settings.local.json`, operator inbox/outbox content, `node_modules/`.

## Claude/Codex maintenance process

- After every package closeout, Claude/Codex re-syncs the Tower (roadmap history, schedule dates, sprint, Kanban, 7/30/90, decision/risk deltas) as part of Operator Mode status sync.
- Tower edits follow `AGENTS.md` + Operator Mode: no app code, no scope creep, commit only on explicit authorization.
- If a Tower doc conflicts with code or locked decisions, the code/decision wins and the Tower doc is corrected (noted in the weekly log).

---

## Weekly log

| Week (ISO) | main HEAD | Last closed package | Next authorized | Changed | Not changed |
|---|---|---|---|---|---|
| 2026-05-17 | d07804b | Package 2.7 | Package 2.8 (Tower) in review | Project Control Tower built (Package 2.8) | App code; locked decisions; gated phases |
| 2026-05-22 | 9191532 | Package 2.8 | Package 2.9 (AI Project OS auto-management upgrade pass) in progress on `docs/ai-project-os-auto-management-upgrade` | AI Project OS layer added at `docs/ai-system/`; new dev protocols (auto-management, model-routing, token-efficiency, context-budget-checklist, tool-batching, package-boundary-closeout, notification-setup); QA test-strategy + package-verification-template; `.claude/commands/` readiness placeholder; `.gitignore` IDE/log additions; PR template extended; cross-links added to AGENTS/CLAUDE/.codex/.claude readiness READMEs and context-hygiene/model-switching protocols | App code; locked decisions; gated phases; Project Control Tower content (only README + this log touched) |
| 2026-06-02 | f04c5bd | Package 5B (merged `dc4f86b` 2026-06-02) | None — awaiting Coordinator decision on next package | Post-Package-5B Tower catch-up: Package 5B marked Done across Tower/backlog/command-center; Sprint 2026-06-A closed; Sprint 2026-06-B opened; master-schedule, decision-log (Package 3D as candidate), backlog-roadmap, architecture-roadmap, coordinator-dashboard, current-status, next-actions, shareable-status-summary updated; report-mirror-log entry added | App code; locked decisions; gated phases; external tools |

(Add one row per weekly sync. Keep the latest ~12 weeks; archive older rows in a note if it grows.)
