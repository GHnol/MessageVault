# Project Control Tower — Plan (NOT BUILT)

**Status:** Plan only. Building the Tower requires a dedicated, separately authorized Coordinator pass. This document describes what that pass will produce and how it will stay consistent with the repo. It builds nothing.

---

## Goal of the future pass

A single, low-friction control layer that lets the Coordinator see and steer: roadmap, schedule, phase gates, backlog, current sprint, risks, decisions, and a personal execution layer — without the layer becoming a second source of truth that drifts from git.

---

## Planned components (future pass)

| Component | Description | Source of truth it summarizes |
|---|---|---|
| Master roadmap | Phases and milestones | `docs/ops/backlog-roadmap.md`, decisions |
| Master schedule | Dated plan with dependencies | roadmap + gates |
| Phase gates | Explicit go/no-go conditions | `docs/command-center/current-status.md` gate table |
| Backlog | Prioritized, classified items | `docs/ops/backlog-roadmap.md` |
| Current sprint | Active authorized package(s) | `AI_HANDOFF.md`, `CURRENT_STATE.md` |
| Risk register view | Surfaced risks | `docs/ops/risk-register.md` |
| Decision log view | Locked decisions | `docs/ops/decision-register.md` |
| Kanban board | Flow state | derived |
| Google Calendar import | `.ics` (generated, gitignored) | schedule |
| ClickUp import | CSV (generated, gitignored) | backlog + schedule |
| TickTick personal layer | Owner execution checklist | schedule |
| Coordinator weekly sync | Recurring update ritual | `coordinator-weekly-sync.md` |

---

## Hard design rules for the future pass

1. **Git stays the source of truth.** Tower artifacts summarize; they never override code or locked docs.
2. **Generated artifacts are gitignored** (`.ics`, CSVs, exports) — never committed.
3. **One owner** (Coordinator) for the weekly update ritual.
4. **No fake certainty** — dates and estimates are marked as estimates until gated dependencies clear.
5. **Consistency check** — every Tower refresh re-derives from `CURRENT_STATE.md` + command-center docs, not from memory.
6. **No scope creep into product** — the Tower tracks work; it does not authorize or change product/vendor/design scope.

---

## Readiness this pass delivered (Package 2.7)

- `docs/project-control/` exists with README, this plan, calendar spec, weekly-sync placeholder
- `.gitignore` already excludes generated `.ics`, exports, local reports
- `CURRENT_STATE.md` exists as the stable input the Tower will summarize
- Continuity protocols exist so Tower passes survive context/model/tool switches

## Blockers before building the Tower

- Coordinator authorization for a dedicated Project Control Tower pass
- Decision on tooling adoption (GitHub Projects board, NotebookLM) — currently `NEEDS COORDINATOR DECISION`
- Confirmation of which export targets are actually wanted (Calendar / ClickUp / TickTick)
