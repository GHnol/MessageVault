# AI Project OS — Puzzle Alignment Checklist

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Scope:** Tracks what Puzzle already has from prior alignment work, what it still needs from KeepMees v1.6 and v1.7, and what must not be copied from KeepMees.
**Use:** Consult before any copy-forward operation from KeepMees to Puzzle.

---

## Context

Puzzle was aligned to AI Project OS v1.5 during the v1.5 Template GitHub Project Standard pass. As of Gate 6, KeepMees is at v1.7.5 (Gates 1–5 complete) with Gate 6 in progress. This checklist captures the gap between Puzzle's v1.5 state and KeepMees's v1.7.6 state.

**Package 4 (Puzzle) and Game Pivot Discovery remain paused** unless Coordinator separately authorizes Puzzle work. This checklist is for planning purposes only — do not start Puzzle alignment without explicit Coordinator authorization.

---

## What Puzzle already has (as of v1.5 alignment)

- AI Project OS bootstrap (v1.5 or aligned equivalent):
  - `AGENTS.md` — adapted for Puzzle
  - `CLAUDE.md` — adapted for Puzzle
  - `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — Puzzle-specific
  - `.claude/skills/` — core skills (start, handoff, precommit, closeout, etc.)
  - `.claude/commands/` — command wrappers
  - `docs/ai-system/` — v1.5 universal layer
  - `docs/dev/` — workflow protocols
  - `docs/qa/` — QA templates
- GitHub Projects (v1.5 canonical vocabulary):
  - Puzzle GitHub Project board linked to Puzzle repo
  - v1.5 canonical Status vocabulary: Backlog, Ready, In Progress, Review / QA, Waiting / Blocked, Done / Shipped, Deferred, Cancelled
  - "AI Project OS Template" (GHnol/projects/2) as template source

---

## What Puzzle still needs from KeepMees v1.6

| Item | Status | Notes |
|---|---|---|
| Google Calendar live sync layer (v1.6) | Pending — requires Coordinator authorization | Copy policy, schema, runbook, scripts, skill, command; create Puzzle-specific source records; use `PZ-` os_id prefix |
| Advisory repair: sync-map read path fix | Pending | Copy `google-calendar-sync-dry-run.mjs` fix for local map read |
| `google-calendar-auth-bootstrap.mjs` | Pending | Copy unchanged |
| `.gitignore` additions for `token.json` variants | Pending | Copy gitignore block |
| Canonical credential/token paths | Pending | Adapt to Puzzle credential paths |

---

## What Puzzle still needs from KeepMees v1.7

| Item | From Gate | Status | Notes |
|---|---|---|---|
| `scripts/state-freshness-check.mjs` | Gate 2 | Pending | Copy; adapt Package 5B reference → Puzzle equivalent; adapt test baseline count |
| State-Sync Decision Matrix in closeout-sync-contract.md | Gate 2 | Pending | Copy section unchanged |
| `scripts/report-mirror-intake.mjs` | Gate 3 | Pending | Copy unchanged |
| Report mirror policy, schema, log, runbook | Gate 3 | Pending | Copy structure; start fresh log |
| `scripts/start-router.mjs` | Gate 4 | Pending | Copy; adapt KeepMees-specific state path references |
| Model routing hardening (Scrutinous adoption rule section) | Gate 4 | Pending | Copy model-routing-protocol.md section |
| `raw-transcripts/` gitignore addition | Gate 4 | Pending | Add to Puzzle .gitignore |
| `scripts/external-sync-consistency-check.mjs` | Gate 5 | Pending | Copy unchanged |
| External sync consistency policy, schema, log, fixture | Gate 5 | Pending | Copy policy/schema/template; adapt fixture os_id prefix; start fresh log |
| OS self-audit sections 6f, 6g, 6h, 6i | Gates 2–5 | Pending | Copy checklist sections; update os-self-audit.mjs checks |
| Skills updated: closeout, precommit, weekly-sync, start, handoff | Gates 2–5 | Pending | Apply integration updates to Puzzle skill files |
| `docs/ai-system/documentation-watch-policy.md` | Gate 6 | Pending | Copy unchanged |
| `docs/ai-system/documentation-watch-sources.md` | Gate 6 | Pending | Copy; reset Last reviewed fields |
| `docs/ai-system/documentation-watch-evaluation-template.md` | Gate 6 | Pending | Copy unchanged |
| `docs/ai-system/documentation-watch-log.md` | Gate 6 | Pending | Start fresh with Puzzle establishment entry |
| `docs/ai-system/bootstrap-copy-forward-guide.md` | Gate 6 | Pending | Copy unchanged |
| `docs/ai-system/universal-vs-project-specific-map.md` | Gate 6 | Pending | Copy unchanged |
| `docs/ai-system/future-repo-bootstrap-checklist.md` | Gate 6 | Pending | Copy unchanged |
| OS self-audit section 6j (Gate 6 layer) | Gate 6 | Pending | Copy section |
| Documentation-watch skill and command | Gate 6 | Pending | Copy unchanged |
| Bootstrap-copy-forward skill and command | Gate 6 | Pending | Copy unchanged |
| `scripts/documentation-watch-check.mjs` | Gate 6 | Pending | Copy unchanged |
| `scripts/bootstrap-copy-forward-audit.mjs` | Gate 6 | Pending | Copy unchanged |

---

## What must be adapted (not copied as-is)

| Item | Why adaptation is required |
|---|---|
| `AGENTS.md` | Puzzle project overview, scope guards, and locked truths differ from KeepMees |
| `CLAUDE.md` | Puzzle git identity, repo name, and scope guards differ |
| `state-freshness-check.mjs` | Remove `FAIL_PACKAGE_5B_UNAUTHORIZED` or adapt to Puzzle equivalent; adapt test baseline count |
| `start-router.mjs` | Adapt Package 5B block reference; adapt KeepMees-specific state file assumptions |
| `current-sprint.md` | Puzzle sprint tasks differ |
| `kanban-board.md` | Puzzle board history differs |
| `google-calendar-source-records.json` | Must be Puzzle-specific events with `PZ-` os_id prefix |
| `github-projects-source-records.json` | Must be Puzzle-specific issues |
| `external-sync-consistency-fixture.example.json` | Adapt os_id prefix from `KM-` to `PZ-` |
| `os-self-audit.mjs` Section 3 (skills list) | Adapt if Puzzle does not have all KeepMees-specific skills |

---

## What must NOT be copied into Puzzle

| Item | Why |
|---|---|
| `docs/project-control/external-sync-map.local.json` | Contains KeepMees GCal eventIds and GHP item IDs |
| `docs/project-control/google-calendar-credentials.local.json` | KeepMees OAuth credentials |
| `docs/project-control/google-calendar-token.local.json` | KeepMees OAuth token |
| `docs/project-control/github-projects-template-config.local.json` | KeepMees real template IDs |
| `docs/project-control/google-calendar-source-records.json` | KeepMees events — must not appear in Puzzle calendar |
| `docs/project-control/github-projects-source-records.json` | KeepMees tasks — must not appear in Puzzle board |
| `docs/project-control/google-calendar-sync-log.md` | KeepMees sync history |
| `docs/project-control/github-projects-sync-log.md` | KeepMees sync history |
| `docs/project-control/master-roadmap.md` | KeepMees product phases |
| `docs/project-control/master-schedule.md` | KeepMees dates |
| `docs/project-control/backlog.md` | KeepMees product backlog |
| `docs/project-control/kanban-board.md` | KeepMees cards |
| `docs/project-control/decision-log.md` | KeepMees decisions |
| `docs/project-control/risk-register.md` | KeepMees risks |
| `docs/ai-system/puzzle-alignment-checklist.md` | This file is KeepMees→Puzzle only; Puzzle should not reference it |
| `docs/ai-system/v1-7-zero-fault-audit-plan.md` | KeepMees audit artifact |
| `local-sync-reports/`, `raw-transcripts/`, `local-report-intake/` | Local to KeepMees environment |
| `keepmees-project-calendar.ics` | KeepMees calendar — generate fresh for Puzzle |

---

## GitHub Projects vocabulary reminder

Puzzle's GitHub Project board should preserve the v1.5 canonical vocabulary from KeepMees alignment:

**Status values:**
- Backlog
- Ready
- In Progress
- Review / QA
- Waiting / Blocked
- Done / Shipped
- Deferred
- Cancelled

**External Sync Status values:**
- in-sync
- drift
- unknown
- not-tracked

Do not change these vocabulary values in Puzzle without Coordinator authorization — they are canonical across all AI Project OS boards.

---

## Authorization reminder

- Puzzle alignment work requires explicit Coordinator authorization before any files are copied or modified.
- Package 4 (Puzzle) and Game Pivot Discovery remain paused as of Gate 6.
- This checklist is a planning artifact — it does not authorize work.
- When Coordinator authorizes Puzzle alignment, use this checklist as the gate list and mark items as they complete.
