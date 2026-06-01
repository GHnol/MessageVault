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

## Scrutinous adoption rule

**Universal across all repos using this OS.**

Do not adopt Claude/Codex features, Plan Mode patterns, hooks, subagents, MCP servers, extended thinking, batch APIs, or automation patterns merely because they are new or sound advanced.

Only adopt if the feature materially improves one or more of:
- Reliability (fewer failures, better recovery)
- Automation (less manual toil for repeatable work)
- Safety (fewer ways to make irreversible mistakes)
- Efficiency (measurable token or time savings)
- Product outcomes (directly benefits the project)

Reject, defer, or monitor if the feature is: semantic sugar, redundant with an existing pattern, hype-driven, immature, too complex for the gain, not compatible with the AI Project OS enforcement model, not enforceable enough to justify maintenance, or not materially helpful for the project.

When in doubt: document as MONITOR in the backlog. Revisit when the feature has a stable track record.

Policy-driven. See `docs/dev/model-routing-protocol.md` § "Scrutinous adoption rule" for the full table.

---

## Session startup routing

The repo includes a native start router (`scripts/start-router.mjs`) that inspects git state, durable state files, and project-control docs to recommend the safest startup route. Run it at the start of every non-trivial session, before reading state files:

```
node scripts/start-router.mjs
```

Verdicts: `READY_FRESH_START`, `READY_CONTINUE`, `NEEDS_HANDOFF_UPDATE`, `NEEDS_STATE_SYNC`, `BLOCKED_DIRTY_TREE`, `BLOCKED_WRONG_BRANCH`, `BLOCKED_PACKAGE_UNAUTHORIZED`, `BLOCKED_EXTERNAL_SYNC_RISK`, `NEEDS_COORDINATOR_DECISION`.

BLOCKED verdicts are hard stops. NEEDS_* verdicts require action before proceeding. READY verdicts confirm it is safe to continue or start fresh.

User-invoked via `/start-router` or as a step in `/start`. Semi-automatic: reads repo state and produces a recommendation; the agent acts on the recommendation.

---

## Short Command Interface and Skills

Long protocols live in repo docs. Daily operation uses short commands that delegate to canonical skills.

**Skills are canonical.** The SKILL.md files in `.claude/skills/*/` are the authoritative protocol definitions. Command files in `.claude/commands/*.md` are compatibility wrappers — thin delegates that invoke the matching skill. This separation allows the canonical protocol to evolve independently of the command invocation mechanism.

**Command wrappers are the daily interface.** The user types `/command`; Claude Code routes to the command file content; Claude follows the protocol.

| Command | Canonical skill | What it does |
|---|---|---|
| `/start` | `.claude/skills/start/SKILL.md` | Session startup from repo truth |
| `/handoff` | `.claude/skills/handoff/SKILL.md` | Update `AI_HANDOFF.md` and produce transfer packet |
| `/precommit` | `.claude/skills/precommit/SKILL.md` | Walk the pre-commit verification gate |
| `/closeout` | `.claude/skills/closeout/SKILL.md` | Package boundary closeout + internal sync check |
| `/package-start` | `.claude/skills/package-start/SKILL.md` | Pre-flight for newly authorized package |
| `/switch-to-codex` | `.claude/skills/switch-to-codex/SKILL.md` | Prepare Codex handoff |
| `/switch-to-claude` | `.claude/skills/switch-to-claude/SKILL.md` | Resume from Codex |
| `/weekly-sync` | `.claude/skills/weekly-sync/SKILL.md` | Coordinator weekly sync |
| `/calendar-sync-plan` | `.claude/skills/project-sync-dry-run/SKILL.md` | Calendar delta review (dry run) |
| `/status-summary` | `.claude/skills/status-summary/SKILL.md` | Generate internal + shareable status |
| `/os-audit` | `.claude/skills/os-audit/SKILL.md` | AI Project OS self-audit |
| `/project-sync-dry-run` | `.claude/skills/project-sync-dry-run/SKILL.md` | Project-control sync dry-run (no writes) |
| `/project-sync-apply` | `.claude/skills/project-sync-apply/SKILL.md` | Apply approved sync delta |
| `/notification-setup-wizard` | `.claude/skills/notification-setup-wizard/SKILL.md` | Notification hook setup (local-only) |

**Invariants for every command in every repo using this OS:**
- Commands are user-invoked. No command runs autonomously.
- Commands route Claude through existing protocols — they never invent new authority.
- Commands never commit or push — those require explicit user instruction.
- Commands never start a new package without explicit Coordinator authorization.
- Scope guards remain in force regardless of which command is invoked.
- If Claude Code command support varies by version, the `.md` files still serve as short paste-ready prompt entry points.

When bootstrapping a new repo: create skill folders in `.claude/skills/` with SKILL.md frontmatter (name, description), then create thin command wrappers in `.claude/commands/`. Start with `start`, `handoff`, `precommit`, `closeout`.

See `docs/ai-system/bootstrap-template.md` § 2 for the bootstrap step.

## Closeout sync rule

Every meaningful work-unit closeout must trigger an internal sync check. This rule is universal across every repo bootstrapped from this OS.

Meaningful closeouts include: package complete/paused/blocked, commit completed, merge completed, branch handoff, model switch, tool switch, project-control change, milestone/gate change, schedule/date change, significant task/backlog status change, major planning change.

The sync check verifies that durable state files (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`) and project-control docs (`current-sprint.md`, `kanban-board.md`) are not operationally misleading. Apply the Post-Commit State Rule: edit only if stale wording would misdirect the next agent.

External systems (Google Calendar, ClickUp, TickTick) remain dry-run/apply with Coordinator approval. Never write to external systems without explicit approval.

Full contract: `docs/dev/closeout-sync-contract.md`

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
| Custom slash commands (`.claude/commands/*.md`) | User-invoked — 19 command wrappers committed; each delegates to matching skill. Commands: `/start`, `/start-router`, `/handoff`, `/precommit`, `/closeout`, `/package-start`, `/switch-to-codex`, `/switch-to-claude`, `/weekly-sync`, `/calendar-sync-plan`, `/status-summary`, `/os-audit`, `/project-sync-dry-run`, `/project-sync-apply`, `/notification-setup-wizard`, `/github-project-setup`, `/github-project-template`, `/google-calendar-sync`, `/report-intake`. No automatic execution; approval boundaries unchanged. |
| Project skills (`.claude/skills/*/SKILL.md`) | User-invoked — 18 skills with YAML frontmatter committed; skills are the canonical protocol layer; commands are compatibility wrappers. Skills: `start`, `start-router`, `handoff`, `precommit`, `closeout`, `package-start`, `switch-to-codex`, `switch-to-claude`, `weekly-sync`, `status-summary`, `os-audit`, `project-sync-dry-run`, `project-sync-apply`, `notification-setup-wizard`, `github-project-setup`, `github-project-template`, `google-calendar-sync`, `report-intake`. |
| Session startup router (`scripts/start-router.mjs`) | Semi-automatic — reads git state + durable state files; recommends READY/NEEDS/BLOCKED verdict; agent acts on recommendation; user confirms on BLOCKED |
| Google Calendar live sync (`/google-calendar-sync`) | User-invoked — validates source records, runs local or live dry-run, and (after Gate 3 authorization) applies creates/updates. Three-gate model: Gate 1 repo foundation, Gate 2 read-only live dry-run, Gate 3 live apply. All mutations require `--apply` + approved artifact + Coordinator authorization. Delete/cancel requires separate per-item approval. |
| Project subagents (`.claude/agents/*.md`) | Backlog — readiness placeholder only; no live subagents committed |
| Closeout internal sync check | Policy-driven — mandatory after every meaningful closeout; the `closeout` skill runs it; no tool auto-enforces it |
| Project-control sync (external tools) | Semi-automatic dry-run / approval-gated apply — `/project-sync-dry-run` produces the delta; Coordinator approves; `/project-sync-apply` applies |
| OS self-audit (`/os-audit`) | User-invoked — run before claiming bootstrap complete; optional `scripts/os-self-audit.mjs` for scripted check |
| Notification wizard (`/notification-setup-wizard`) | User-level setup — local only; not committed; once installed, harness fires for that contributor |
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
