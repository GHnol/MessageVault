# KeepMees Kanban Board

**Last updated:** 2026-05-17 (America/New_York)
**Owner:** Coordinator / Project Control
**Purpose:** Visual status board. Visibility tool only — not the project brain. Source of truth remains `backlog.md` + roadmap.

**Columns:** Inbox · Backlog · Ready · In Progress · Waiting / Blocked · Review · Approved · Done · Deferred · Killed
**Card fields:** task · lane · priority · phase · owner · due · source · success · deps · notes

---

## View 1 — Full project overview

### Inbox
- _(empty — new ideas land here first)_

### Backlog
- **Prepare Package 5A prompt** · Development · P1 · Ph12 · Claude · due ~05-26 · src `current-sprint.md` · success: scoped prompt · deps: 5A authorized · notes: no checkout/PDF/renderer
- **Define preview-fidelity verification approach** · Preview/Print · P2 · Ph6 · Dev · src `master-roadmap.md` · success: approach doc · deps: Phase 5 · notes: no redesign
- **Message Book composition continuation** · Message Book · P2 · Ph5 · Dev · src `docs/ops/backlog-roadmap.md` · success: ProductDraft/preflight scoped
- **Gift notes v1 vs v1.1 decision** · Packaging · P2 · Ph10 · Coordinator · success: decision recorded
- **Maintain release-readiness checklist** · Launch · P2 · Ph13 · Coordinator
- **Decide ClickUp/TickTick/Calendar adoption** · Coordinator · P2 · Ph0 · Founder

### Ready
- **Activate weekly Coordinator sync** · Coordinator · P1 · Ph0 · Coordinator · src `coordinator-weekly-sync.md` · deps: Tower merged
- **Preserve deterministic pagination invariants** · Message Book · P0 · Ph5 · Dev · notes: scope-guarded
- **Prevent unsupported product claims** · Product Strategy · P0 · Ph1
- **Run E2E + unit before any commit** · QA · P0 · Ph0
- **Monthly budget / viability review** · Finance · P2 · Ph0 · recurring

### In Progress
- **Review + approve Project Control Tower** · Coordinator · P0 · Ph0 · Coordinator · due 05-23 · success: approve/changes recorded

### Waiting / Blocked
- **Commit + merge Package 2.8** · Coordinator+Claude · P0 · Ph0 · blocked by approval
- **Authorize Package 5A** · Coordinator · P1 · Ph12 · blocked by Tower merge (Foundation OS Gate)
- **Package 5A — Proof Approval State Foundation** · Development · P1 · Ph12 · paused
- **Vendor confirmation decision** · Vendor · P1 · Ph9 · blocked: vendor replies (outside repo)
- **Hold Figma execution until designer confirmed** · Design · P1 · Ph7 · blocked: budget decision
- **Hold packaging spec until vendor real** · Packaging · P2 · Ph10 · blocked: Phase 9

### Review
- _(empty)_

### Approved
- _(empty — Tower lands here after Coordinator approval, before merge)_

### Done
- Packages 1, 2, 2.5A, 2.5B, 2.6, 2.6.1, 2.7, 3A, 3B, 3C, 4A, 4B, 4C, 4D, 4E, 4E.1 · see `docs/command-center/current-status.md`
- **Figma Build Package v1.1 brief** · Design · Ph7 · written, preserved

### Deferred
- n8n/Make/Zapier automation · AI Workflow · Ph0
- Future format expansion · Product System Expansion · Ph15
- Adjacent competitor teardown · Competitor Intel · Ph15
- Privacy language final review · Legal/Business · Ph13
- `scripts/node_modules` history cleanup · Coordinator · Ph0

### Killed
- _(none)_

---

## View 2 — Current sprint (Sprint 2026-05-A, 05-17 → 05-23)

### In Progress
- Review the full Project Control Tower · Coordinator · P0

### Waiting / Blocked
- Approve/changes on Tower · Coordinator · P0 (decision-needed)
- Commit + merge Package 2.8 · P0 (blocked by approval)
- Authorize Package 5A · P1 (blocked by merge)

### Ready
- Keep vendor/design/packaging paused; no outreach · Coordinator · P0

### Backlog (sprint-optional)
- Import .ics / ClickUp CSV / TickTick CSV · Founder · P2
- Prepare Package 5A prompt · Claude · P1 (after authorize)

### Done (this sprint)
- _(none yet — Tower build itself completes when merged)_

---

## Board rules

- A card moves right only when its success criteria progress; **Done** requires criteria met + repo docs updated.
- Keep the board readable: no microcards. Package-level and decision-level cards only.
- Coordinator reconciles this board during the weekly Project Control Sync; external Kanban tooling (if adopted) mirrors this file, never overrides it.
