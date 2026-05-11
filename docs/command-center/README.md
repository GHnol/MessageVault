# Command Center — KeepMees / MessageVault

**Last updated:** 2026-05-10

---

## Purpose

Single entry point for understanding where the KeepMees project is, what is in progress, what needs decisions, and what not to start. These docs are navigation aids and status summaries — not decision records.

**Source of truth priority (when sources conflict):**
1. Current code (what is actually in the repo right now)
2. `docs/` Package 2.5A docs (locked decisions, requirements, strategy)
3. `CLAUDE.md` (behavior rules for Claude Code)
4. `memory/` (point-in-time, may be stale — verify before acting)
5. Session conversation (may contradict earlier decisions — flag the conflict)

---

## Files in this directory

| File | Purpose |
|---|---|
| `README.md` | This file — navigation guide |
| `current-status.md` | Snapshot of delivered packages, active work, test state, git state, gate status |
| `next-actions.md` | Prioritized next steps for each role — what to do now, what to decide, what not to start |
| `coordinator-dashboard.md` | Full Coordinator overview — product identity, stream status, key decisions, blocked items, gate map |

---

## What this command center is NOT

- Not a substitute for the Package 2.5A source-of-truth docs
- Not a place to record locked decisions (use `docs/ops/decision-register.md`)
- Not a place to record product truth (use `docs/strategy/master-project-truth.md`)
- Not a place to record architecture decisions (use `docs/architecture/adr-001-app-architecture-path.md`)
- Not authoritative over code (always read the actual file before acting)

---

## Key reference pointers

| Topic | File |
|---|---|
| Locked decisions | `docs/ops/decision-register.md` |
| Project overview and philosophy | `docs/strategy/master-project-truth.md` |
| Physical launch target vs software catalog | `docs/strategy/product-format-bank.md` |
| Architecture posture and inflection points | `docs/architecture/architecture-roadmap.md` |
| Package history and upcoming packages | `docs/ops/backlog-roadmap.md` |
| Vendor and manufacturing status | `docs/ops/vendor-manufacturing-register.md` |
| Design readiness and Figma status | `docs/ops/design-readiness-register.md` |
| Competitor intelligence | `docs/ops/competitor-intelligence-register.md` |
| Deferred and gated ideas | `docs/ops/deferred-gated-ideas-register.md` |
| AI and automation stack | `docs/ops/ai-automation-register.md` |
| Stream sync protocol | `docs/ops/stream-sync-protocol.md` |
| Automation templates | `docs/automation/templates/` |
| Automation schemas | `docs/automation/schemas/` |
| Operator mode protocols | `docs/automation/operator-mode/` |
