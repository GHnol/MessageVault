# AI_HANDOFF.md — Work Transfer Record

Update this file whenever you stop mid-task, approach context pressure, or hand off to another agent. The incoming agent reads this before touching anything.

**This file is the compact-safe handoff.** Auto-compact summaries are not a substitute for updating this file. If a context event happens and this file is not current, the incoming session must stop and ask the Coordinator for direction before proceeding.

---

## Status snapshot

**Status:** `in-progress` — Package 2.7 (AI Development Operating System Upgrade Pass), docs/infrastructure only, NOT committed, NOT pushed

**Last updated by:** `Claude Code (Opus 4.7)`

**Date:** `2026-05-17`

---

## Package and branch

| Field | Value |
|---|---|
| **Active package** | `Package 2.7 — AI Development Operating System Upgrade Pass` |
| **Branch** | `docs/ai-development-operating-system-upgrade` |
| **Branch base** | `main at 89a17d0` |
| **Feature commit** | NOT YET CREATED — do not commit without explicit instruction |
| **Merge commit** | NOT YET CREATED |

---

## Objective

Upgrade repo-level AI development operating infrastructure only: universal agent contract, Claude/Codex interchangeability, session restart, model switching, context hygiene, worktree policy, QA templates, and Project Control Tower readiness. No product behavior, UI, `index.html`, or `src/**` changes. This is NOT Package 5A and NOT the full Project Control Tower build.

---

## Approved scope

- Create/update universal + Claude + Codex operating docs
- Create `docs/dev/` workflow protocols, `docs/qa/` templates, `docs/project-control/` readiness docs
- Harden `.gitignore`
- README placeholders for hooks/subagents/skills (no live tool-specific configs)

## Hard exclusions

- No `index.html` / `src/**` edits
- No commit, no push, no deploy
- No live hooks / live subagents / live skills / `.codex/config.toml` / shared `.claude/settings.json`
- No untracking of already-tracked `scripts/node_modules/`
- No reopening locked product/vendor/design decisions
- No full Project Control Tower artifacts (roadmap/schedule/Kanban/ICS/ClickUp/TickTick)

---

## Work completed

- [x] Phase A inspection complete
- [x] Gap report delivered
- [x] AI_HANDOFF.md continuity checkpoint
- [x] Phase B complete: 18 files created, 6 modified
- [x] `.gitignore` hardened and verified (privacy ignores intact, new patterns confirmed via `git check-ignore`)
- [x] Verification run: `git status --short`, `git diff --stat`, ignore probes — clean and in scope
- [x] Final report delivered

## Work remaining

- [ ] Coordinator review of this docs/infra pass
- [ ] Commit + push only when explicitly authorized (NOT done in this pass)

---

## Git state

```
Branch:       docs/ai-development-operating-system-upgrade
Branch base:  main at 89a17d0
Working tree: in progress (docs/infra files being created)
Pushed:       No
```

---

## Next exact action for incoming session

1. Read `AGENTS.md`, `CLAUDE.md`, this file
2. Run `git status --short` and `git diff --stat`
3. If Phase B incomplete: continue creating Phase B files per the Package 2.7 instruction
4. **Do not commit or push** without explicit Coordinator instruction

---

## Source-of-truth files to read first on resume

1. `AGENTS.md`
2. `CLAUDE.md`
3. This file (`AI_HANDOFF.md`)
4. `git status` / `git log --oneline -10`
5. The Package 2.7 instruction (from Coordinator)

---

## File-level warnings

| File | Warning |
|---|---|
| `index.html` | Off-limits this pass. Single-file app — scope-guarded constants, Review view, standalone keepsake flows. |
| `src/**` | Off-limits this pass. |
| `scripts/node_modules/` | Historically tracked (605 files). Do NOT untrack in this pass — backlog item only. |
| `.claude/settings.local.json` | Gitignored — never commit. |
| `operator-inbox/*.md`, `operator-outbox/*` | Gitignored — never commit generated/private files. |
| `_source-intake/` | Gitignored — never commit. |
