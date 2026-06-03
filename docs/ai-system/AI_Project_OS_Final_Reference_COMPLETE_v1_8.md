# AI Project OS — Final Reference (COMPLETE) v1.8

**Version:** 1.8.0
**Status:** COMPLETE — State-Zero Bootstrap Finalization pass, 2026-06-03
**Scope:** Canonical single-file reference for the AI Project OS as deployed in KeepMees / MessageVault. Supersedes all older `v1_4_2` pack references.
**Use:** Orientation document for new contributors, agents resuming after a long gap, and copy-forward to new repos.

This document is read-only during an active pass. To update, do so in a dedicated OS upgrade pass.

---

## What the AI Project OS is

The AI Project OS is a repo-native operating system for AI-assisted development. It provides:

1. **Continuity** — durable state files (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`) that survive context windows, model switches, and tool switches
2. **Routing** — automated startup routing (`scripts/start-router.mjs`) to detect stale state before any work starts
3. **Validation** — state freshness checks, OS self-audit, external sync consistency, documentation-watch
4. **Protocols** — session restart, context hygiene, model routing, package boundary closeout, State-Zero closeout
5. **Handoff discipline** — skills (`/closeout`, `/handoff`, `/precommit`, `/start`) that enforce the right steps before switching agents or sessions
6. **Project Control Tower** — living project docs (roadmap, sprint, kanban, backlog, calendar) maintained by weekly sync ritual

---

## Version history (OS layer only)

| Version | Pass | Date | Status |
|---|---|---|---|
| 1.8.0 | State-Zero Bootstrap Finalization | 2026-06-03 | COMPLETE |
| 1.7.6 | Gate 6 — Documentation-Watch + Bootstrap Copy-Forward | 2026-06-01 | COMPLETE |
| 1.7.5 | Gate 5 — External Sync Consistency Validators | 2026-06-01 | COMPLETE |
| 1.7.4 | Gate 4 — Start Router + Model Routing Hardening | 2026-06-01 | COMPLETE |
| 1.7.3 | Gate 3 — Report Mirroring and Project-Control Log Intake | 2026-06-01 | COMPLETE |
| 1.7.2 | Gate 2 — Closeout and State Freshness Validators | 2026-06-01 | COMPLETE |
| 1.7.1 | Gate 1 — Zero-Fault OS Audit and Implementation Plan | 2026-06-01 | COMPLETE |
| 1.6.x | Google Calendar Live Sync (Gates 1–3 + advisory repair) | 2026-05-30–31 | COMPLETE |
| 1.5.0 | Template GitHub Project Standard | 2026-05-26 | COMPLETE |
| 1.4.0 | GitHub Projects Live Provisioning Integration | 2026-05-25 | COMPLETE |
| Operator Reliability Repair | Raw transcript capture + notification | 2026-06-02 | COMPLETE |

Full history: `docs/ai-system/version-history.md`

---

## The five non-negotiable invariants

1. **Git is truth.** The session is disposable. The repo is permanent.
2. **Repo docs are durable memory.** Chat history is not durable.
3. **One coding agent owns the active branch at a time.** Explicit handoff required.
4. **No commit, push, deploy, or production-config change without explicit user instruction.**
5. **Scope is what the active package instruction says — nothing more.**

---

## Startup sequence (every session)

```
node scripts/start-router.mjs
node scripts/state-freshness-check.mjs
```

State-router verdicts:
- `READY_FRESH_START` / `READY_CONTINUE` → safe to proceed
- `NEEDS_STATE_SYNC` → State-Zero violation; fix state docs first
- `BLOCKED_*` → hard stop; ask Coordinator

Files to read in order: `AGENTS.md`, tool layer (`CLAUDE.md`), `AI_HANDOFF.md`, `CURRENT_STATE.md`.

---

## State-Zero Closeout Rule (added v1.8)

At every clean stopping point (post-merge, post-push, pre-session-end), state docs must be fully aligned:

| Field | Required value |
|---|---|
| Active branch | Matches `git branch --show-current` exactly |
| Active package/pass | "None" when no package is running |
| Next action | Points to Coordinator decision, not a closed branch |
| state-freshness-check | 0 FAILs |

**Wrong active branch is always a FAIL, never cosmetic.** The Post-Commit State Rule (which excuses hash lag) does NOT excuse wrong active branch, wrong active package, or wrong next action.

**Post-merge obligation:** After any merge to `main`, verify state docs say "active branch: main" before ending the session.

Protocol: `docs/dev/state-zero-closeout-protocol.md`

---

## Post-Commit State Rule (v0.3.1 — still active, complementary to State-Zero)

Prevents recursive state-sync commit chains. Durable state files may describe pre-commit or expected-post-commit state. Commit hashes belong in post-commit reports, not in committed files. One-commit hash lag is WARN (cosmetic), not FAIL.

**Scope:** Hash lag in narrative/historical fields only. Does NOT apply to wrong active branch, wrong package, wrong next action.

Policy: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule"

---

## Core scripts (current v1.8)

| Script | Purpose | Added |
|---|---|---|
| `scripts/start-router.mjs` | Startup routing (READY/NEEDS/BLOCKED verdicts) | v1.7.4 |
| `scripts/state-freshness-check.mjs` | State-Zero validator (FAIL/WARN/PASS per field) | v1.7.2 |
| `scripts/os-self-audit.mjs` | Full OS bootstrap audit | v0.5.0 |
| `scripts/report-mirror-intake.mjs` | Project-control report intake with redaction | v1.7.3 |
| `scripts/external-sync-consistency-check.mjs` | External sync consistency (GCal, GHP) | v1.7.5 |
| `scripts/documentation-watch-check.mjs` | Docs-watch framework validator | v1.7.6 |
| `scripts/bootstrap-copy-forward-audit.mjs` | Copy-forward guidance validator | v1.7.6 |
| `scripts/raw-transcript-check.mjs` | File-first response record validator | Operator Reliability Repair |
| `scripts/notification-check.mjs` | Notification hook diagnostic | Operator Reliability Repair |

---

## Core skills (current v1.8)

| Skill | Canonical | What it does |
|---|---|---|
| `start` | `.claude/skills/start/SKILL.md` | Session startup with State-Zero check |
| `closeout` | `.claude/skills/closeout/SKILL.md` | Package boundary closeout with State-Zero |
| `handoff` | `.claude/skills/handoff/SKILL.md` | Work transfer with State-Zero |
| `precommit` | `.claude/skills/precommit/SKILL.md` | Pre-commit gate with State-Zero |
| `weekly-sync` | `.claude/skills/weekly-sync/SKILL.md` | Coordinator weekly sync with State-Zero |
| `package-start` | `.claude/skills/package-start/SKILL.md` | Pre-flight for new package |
| `external-sync-consistency` | `.claude/skills/external-sync-consistency/SKILL.md` | External sync check |
| `report-intake` | `.claude/skills/report-intake/SKILL.md` | Project-control report intake |
| `raw-transcript-capture` | `.claude/skills/raw-transcript-capture/SKILL.md` | File-first response record |
| `documentation-watch` | `.claude/skills/documentation-watch/SKILL.md` | Docs-watch evaluation |
| `bootstrap-copy-forward` | `.claude/skills/bootstrap-copy-forward/SKILL.md` | Copy-forward audit |

---

## Universal vs. project-specific separation

Universal assets (copy to any new repo unchanged or adapted):
- `AGENTS.md` template, `CLAUDE.md` template, `.codex/README.md` template
- `docs/ai-system/` (all files)
- `docs/dev/` protocols
- `docs/qa/` templates
- Skills (`start`, `handoff`, `precommit`, `closeout`) + command wrappers
- All scripts listed above
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.gitignore` core block

Project-specific (do NOT copy unchanged):
- `AGENTS.md` § Project overview (rewrite for new project)
- `CLAUDE.md` § scope guards, git identity, locked decisions
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` content
- All `docs/project-control/` content
- All `docs/ops/`, `docs/strategy/`, `docs/command-center/` content
- `docs/ai-system/CHANGELOG.md` and `version-history.md` content (start fresh)

Never copy (local/private):
- `external-sync-map.local.json`, `google-calendar-token.local.json`
- `.claude/settings.local.json`
- `local-sync-reports/`, `local-report-intake/`, `raw-transcripts/`
- `scripts/node_modules/`

Full map: `docs/ai-system/universal-vs-project-specific-map.md`

---

## Supersedes

This document supersedes all older pack references including any `v1_4_2` pack files. The `v1_4_2` artifacts predated the State-Zero rule (v1.8), the start-router (v1.7.4), state-freshness-check (v1.7.2), report mirroring (v1.7.3), external sync consistency (v1.7.5), documentation-watch (v1.7.6), raw transcript Type 1 protocol, and completion-sound notification. Any new repo bootstrapped from this OS must use the v1.8 reference.

---

## Verification

A correctly bootstrapped repo using this reference passes:

```
node scripts/os-self-audit.mjs          # 304+ pass, 0 fail
node scripts/state-freshness-check.mjs  # 0 FAILs
node scripts/start-router.mjs           # READY_FRESH_START or READY_CONTINUE
node scripts/documentation-watch-check.mjs # 0 failures
node scripts/bootstrap-copy-forward-audit.mjs # 0 failures
```
