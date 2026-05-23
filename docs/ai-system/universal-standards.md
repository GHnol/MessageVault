# Universal AI Project OS Standards

**Status:** ACTIVE (introduced in Package 2.9).
**Last updated:** 2026-05-22 (America/New_York)
**Scope:** Standards that should apply to KeepMees / MessageVault and to any future repo that bootstraps the same AI Project OS layer (Puzzle, and beyond).

This document is intentionally repo-agnostic. KeepMees-specific scope guards, locked decisions, and product truth live in `AGENTS.md`, `CLAUDE.md`, and the operator-mode protocols — not here.

---

## The five non-negotiable invariants

1. **Git is truth.** The session is disposable. The repo is permanent. Never trust an in-context summary of file state — read the file.
2. **Repo docs are durable memory.** Chat history is not durable memory. Auto-compact is not a substitute for `AI_HANDOFF.md`.
3. **One coding agent owns the active branch at a time.** Reviewers and debuggers may advise; they may not commit on a branch they do not own without an explicit recorded handoff.
4. **No commit, push, deploy, or production-config change without explicit user instruction.** This applies even when an agent thinks it is "the right time".
5. **Scope is what the active package instruction says — nothing more.** Out-of-scope opportunities are noted, not pursued.

These invariants are the floor. Tool-specific layers (Claude / Codex / future agents) may add stricter rules; they may never weaken these.

---

## Continuity discipline

### Required files (every repo using this OS)

| File | Role |
|---|---|
| `AGENTS.md` | Universal agent contract |
| `CLAUDE.md` and/or `.codex/README.md` | Tool-specific layers |
| `AI_HANDOFF.md` | In-flight work transfer; compact-safe |
| `CURRENT_STATE.md` | Durable project snapshot |
| `NEXT_SESSION_PROMPT.md` | Restart entry point |
| `docs/ai-system/` | This OS layer |
| `docs/dev/` | Workflow protocols |
| `docs/qa/` | Testing strategy and templates |

### Update cadence

Update `AI_HANDOFF.md` / `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` at meaningful work units, not only at the end of a session. Meaningful units include:

- Completing a package step
- Changing files (after a significant batch, not after every edit)
- Running tests
- Discovering a blocker
- Finishing a plan
- Switching branches
- Preparing for commit
- Reaching a package boundary
- Before model switching
- Before tool switching
- Before long-running work
- When context/usage pressure is high

**Do not wait until the usage limit or the auto-compact warning to write state.** By that point it may be too late.

Policy-driven. The harness does not enforce this; the agent must.

---

## Session model

### Default posture

A fresh Claude Code or Codex session should be able to resume from repo truth without dragging a huge stale transcript. `claude --continue` is **not** the default.

| Situation | Default action |
|---|---|
| Same logical task still live, recent context worth keeping | `/compact` after updating handoff |
| Task at a boundary, package closed, or context bloated | `/clear` after updating handoff; restart from `NEXT_SESSION_PROMPT.md` |
| Brand-new day, repo state has moved | Fresh session from repo truth |
| Auto-compact warning appeared | Update handoff immediately, then decide; never resume implementation from the compact summary alone |

### High uncached context (e.g. 300k+ or 500k+ uncached tokens reported)

This is a context-cost warning, not an error. The default is **not** to continue blindly.

1. Verify `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` are current.
2. Recommend starting a fresh session from repo truth.
3. Only continue the existing session if the active uncached context is genuinely needed and worth the token/time cost. State that judgment out loud.

Policy-driven.

---

## Model routing

See `docs/dev/model-routing-protocol.md` for the full table. Universal summary:

| Work | Model tier |
|---|---|
| Mechanical edits, summaries, classification, checklist generation | Light tier |
| Routine coding, debugging, tests, docs, implementation | Default tier |
| Architecture, complex debugging, risky changes, deep review, final audits, planning | Strongest tier |

Manual model switching must be context-safe — update handoff files first. Do not rely on blind automatic model switching.

Semi-automatic: the agent recommends; the user confirms costly switches.

---

## Package boundary discipline

At a package boundary, the agent must:

1. Run package verification (`docs/qa/package-verification-template.md`).
2. Update `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`.
3. Update Project Control / command-center docs as part of the post-merge status sync (separate commit, separate branch).
4. Propose the commit message and merge plan; do not commit without explicit instruction.
5. Recommend a fresh session for the next package if context is heavy.
6. Refuse to start the next package inside the same bloated session by default.

See `docs/dev/package-boundary-closeout-protocol.md`.

---

## Post-Commit State Rule

**Status:** ACTIVE. Universal across KeepMees, Puzzle, and any future repo bootstrapped from this OS.
**Purpose:** Prevent recursive state-sync loops where durable state files try to perfectly describe the commit that is currently being created.

Do not force durable state files to name or perfectly describe the commit that is currently being created.

For commits that update `CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md`, `docs/command-center/*`, `docs/project-control/*`, or any similar durable state files:

1. The files **may** describe the pre-commit verified state.
2. The files **may** describe the expected post-commit state.
3. The files **may** say "after this commit lands, start X in a fresh session."
4. The actual commit hash belongs in the **post-commit report** (chat message to the user, PR description, changelog entry), not inside the file being committed.
5. The next session **must** verify current `HEAD` during preflight (`git log --oneline -10`, `git rev-parse HEAD`) — durable state hashes are point-in-time and may lag by one commit.
6. A follow-up state-sync commit is required **only** if the docs would misdirect the next agent into the wrong branch, wrong package, wrong task, unsafe scope, or stale blocker.
7. Do **not** create recursive state-sync commits solely because a file used pre-commit language during the commit approval step.

### What counts as "would misdirect the next agent"

Real operational danger — examples that **do** justify a follow-up sync commit:

- Active branch named in `AI_HANDOFF.md` no longer exists or has been renamed.
- Active package recorded as `in-progress` when it has actually been merged and closed.
- Next-action pointer aims at a paused / cancelled / superseded task.
- Hard exclusions are missing or have been weakened.
- A locked blocker has been silently lifted (or a new blocker has been silently introduced).

### What does NOT justify a follow-up sync commit

- The `main HEAD` field lags the actual head by one commit (cosmetic mismatch only).
- A doc uses phrasing like "after this commit lands" or "this commit will be" (pre-commit language — expected and fine).
- The hash for the commit currently being created is not yet inside the file (it cannot be, without recursive amend).
- A timestamp is a few hours stale but the named package, branch, scope, and next action are still accurate.

Cosmetic mismatch, pre-commit language, and "after this lands" wording are **not** sufficient reason to spin a sync commit. The preflight verification step (read repo, run `git log`) is the corrective control — not another commit.

Policy-driven. The agent must apply this rule when proposing or refusing follow-up state-sync commits.

---

## Testing as a first-class concern

Testing is not cleanup-later. Every package that touches behavior must declare:

- Which existing test suites must remain green
- Which new tests it adds (or why it adds none)
- Whether E2E (seeded and real-files) is in scope
- Whether the capture harness or visual regression is in scope
- Pre-commit verification path

See `docs/qa/test-strategy.md` and `docs/qa/package-verification-template.md`.

---

## Token efficiency

Cheap is correct. Expensive should be deliberate.

- Prefer files and exact paths over pasted blobs.
- Prefer scoped searches over whole-repo scans.
- Batch parallel tool calls when independent.
- Use scripts for mechanical transformations.
- Keep `AGENTS.md` and `CLAUDE.md` lean — move rare workflows to dedicated docs.
- Do not duplicate work that a subagent is already doing.

See `docs/dev/token-efficiency-protocol.md` and `docs/dev/tool-batching-protocol.md`.

---

## Tool batching discipline

For refactors, renames, repetitive updates, and repo scans, agents must first produce a batching plan (see `docs/dev/tool-batching-protocol.md`):

1. Files likely affected
2. Search command or script that finds targets
3. Whether a deterministic script can perform the change
4. Verification command
5. Expected files changed
6. Rollback path

Prefer one scoped search/report over many tiny search/read turns. Prefer one patch for related edits over many edit turns.

Policy-driven, with exceptions for genuinely independent edits.

---

## Notification setup

The harness can sound a permission/wait notification at user level. This is **user-level configuration**, not committed private settings. See `docs/dev/notification-setup.md`.

If a contributor uses multiple `CLAUDE_CONFIG_DIR` accounts (e.g. main + iCloud-synced), the hook must be installed in each.

User-level / policy-driven.

---

## Multi-tool relay (Claude ↔ Codex)

Either tool can own the active branch; exactly one does at a time. Chat memory does not transfer between tools. Only the repo transfers.

- Before switching: complete the current logical unit; update handoff files; produce a transfer packet.
- Before resuming as the incoming tool: read `AGENTS.md`, the tool layer, `AI_HANDOFF.md`, run `git status`, read package docs.
- If `AI_HANDOFF.md` is missing/stale/contradicts git: stop and ask.

See `docs/dev/tool-switching-protocol.md` and `docs/dev/claude-codex-interchangeability.md`.

---

## What is automatic, semi-automatic, and policy-driven

Every claim this OS makes is labelled. Status meanings:

1. **Automatic** — enforced by git, the harness, or other tooling without human action.
2. **Semi-automatic** — the agent recommends or prepares; a human confirms.
3. **Policy-driven** — required by repo instructions but **not** technically enforced by any tool. Nothing prevents an agent or user from violating the rule; the discipline is procedural.
4. **User-level setup** — outside the repo; each contributor installs themselves; not committed.
5. **Backlog** — not installed yet; documented intent only.

| Capability | Status (in this repo today) |
|---|---|
| Hard scope guards (BOOK_PAGINATION_VERSION etc.) | Policy-driven (agent must obey; not technically enforced) |
| `.gitignore` protections | Automatic (git engine refuses to add ignored files) |
| Pre-commit hook firing on commit | Backlog — **no pre-commit hook is committed in this repo**. If a hook is added to `.git/hooks/` or via husky, git fires it automatically; until then, this is policy. |
| CI / continuous integration of tests | Backlog — no CI workflows are committed; none authorized. Tests run locally on agent/user discretion. |
| Session-start file reads (`AGENTS.md`, etc.) | Policy-driven |
| Rolling `AI_HANDOFF.md` / `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` updates | Policy-driven |
| Package boundary closeout sequence | Policy-driven |
| Test runs before commit | Policy-driven (the agent must run them; no tool blocks the commit if they are skipped) |
| Git identity / remote correctness before commit/push | Policy-driven — `CLAUDE.md` § "Git identity (KeepMees repo)" requires the agent to run `git remote -v`, `git config user.name`, `git config user.email` before any git push, commit, or gh command. **No hook or script auto-enforces this** unless a future pass adds one. |
| Commit / push / merge | Policy-driven — no commit, push, or merge without explicit user instruction. The agent must wait. (Git itself does not enforce this; the rule is procedural.) |
| Permission/wait notification beep | User-level setup — each contributor installs the hook in their own `CLAUDE_CONFIG_DIR`; once installed, the harness fires it automatically for that contributor; not committed; not enforced on other contributors |
| Model routing (tier per task) | Semi-automatic — agent recommends, user confirms costly switches |
| Model switching mechanics | Manual — the user invokes the switch; the agent recommends a checkpoint first (policy-driven) |
| Tool switching (Claude ↔ Codex) | Semi-automatic — agent writes handoff and produces transfer packet; user confirms the switch |
| Claude/Codex handoff packet generation | Semi-automatic — agent produces; user reviews; the incoming tool must still read `AI_HANDOFF.md` (policy-driven) |
| `/clear`, `/compact`, `/context`, `/usage` | Manual — user-invoked; agent only recommends timing (policy-driven recommendation) |
| Fresh-session restart preference at boundaries | Policy-driven — agent recommends; user decides |
| Token efficiency rules (file reads vs paste, scoped vs whole-repo, etc.) | Policy-driven |
| Tool batching plan format | Policy-driven |
| Custom slash commands (`.claude/commands/*.md`) | Backlog — readiness placeholder only; no live commands committed |
| Project subagents (`.claude/agents/*.md`) | Backlog — readiness placeholder only; no live subagents committed |
| Project skills (`.claude/skills/`) | Backlog — readiness placeholder only; no live skills committed |
| Claude hooks (`.claude/settings.json` hooks block) | Backlog — no hooks committed to the repo; user-level hooks are documented separately in `docs/dev/notification-setup.md` |
| Codex config (`.codex/config.toml`) | Backlog — Codex config schema not verified to this runtime; `.codex/README.md` is the Codex contract |
| Worktree automation | Backlog — `.claude/worktrees/` is gitignored; no automation scripts committed |
| n8n / Make / Zapier workflows | Backlog — future phase |

This list is the single honest answer to "what does the AI Project OS actually do for me right now?" — anything not on it does not yet exist, and any "Policy-driven" / "Backlog" item is not technically enforced.

---

## Reusability

The portable parts of this OS that should travel to other repos:

- `AGENTS.md` template
- `CLAUDE.md` template
- `.codex/README.md` template
- `AI_HANDOFF.md` skeleton
- `CURRENT_STATE.md` skeleton
- `NEXT_SESSION_PROMPT.md` skeleton
- `docs/ai-system/` (this directory) — all five files
- `docs/dev/` protocols
- `docs/qa/` templates
- `.github/PULL_REQUEST_TEMPLATE.md` skeleton
- `.gitignore` core block

KeepMees-specific items (Message Book pagination, vendor/manufacturing gating, Project Control Tower content) do **not** travel. Strip them when bootstrapping a new repo.

See `bootstrap-template.md` for the exact copy-list.
