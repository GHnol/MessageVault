# AI Project OS — Version History

**Status:** ACTIVE (introduced in Package 2.9).
**Use:** Single chronological record of every OS upgrade pass — what it delivered, what backlog it left, and which items should be backfilled to other repos.

Entries are point-in-time. Verify against `CHANGELOG.md` and git history before acting on them.

---

## Version index

| Version | Package | Date | Status |
|---|---|---|---|
| 0.4.0 | AI Project OS Usability Patch — Short Command Interface | 2026-05-24 | in progress |
| 0.3.1 | Patch — Post-Commit State Rule | 2026-05-22 | merged (`9be0f81`) |
| 0.3.0 | Package 2.9 — AI Project OS Auto-Management Upgrade Pass | 2026-05-22 | merged (`a20af30`) |
| 0.2.0 | Package 2.8 — KeepMees Project Control Tower | 2026-05-17 | merged (`bdb73db`) |
| 0.1.0 | Package 2.7 — AI Development Operating System Upgrade Pass | 2026-05-17 | merged (`cebdc72`) |

Version numbers are internal to this layer (not semver of any product code). Minor versions increment per OS upgrade pass; patch versions increment per surgical OS process correction.

---

## 0.4.0 — AI Project OS Usability Patch — Short Command Interface (2026-05-24)

**Branch:** `docs/ai-project-os-usability-patch` (pending)
**Status:** in progress

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
