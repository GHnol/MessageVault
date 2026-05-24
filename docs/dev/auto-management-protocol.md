# Auto-Management Protocol

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol
**Relationship:** Umbrella protocol. Ties together session-restart, context-hygiene, model-switching, model-routing, token-efficiency, tool-batching, package-boundary-closeout, notification-setup, and tool-switching.

---

## What "auto-management" actually means

It does **not** mean the agent decides for the user. It means the agent **continuously maintains repo-native state** so that:

- A fresh agent can take over without context loss.
- A model switch, tool switch, or context event does not corrupt in-flight work.
- Package boundaries force closeout, not casual continuation.
- The agent recommends the right model and the right session shape — and asks before doing anything costly or risky.

**Honest about enforcement (read this carefully):** in this repo today, almost every rule in this protocol is **policy-driven** — required by these docs but **not** technically auto-enforced by any committed hook, script, or tool. The exceptions are `.gitignore` protections (git engine enforces) and user-level notification hooks (each contributor installs themselves; once installed, the harness fires them for that contributor). Everything else depends on the agent obeying the rule. See `docs/ai-system/universal-standards.md` § "What is automatic, semi-automatic, and policy-driven" for the full per-capability label. Each section below states whether the rule is automatic, semi-automatic, policy-driven, user-level, or backlog.

---

## The five auto-management duties

### 1. Maintain repo-native memory continuously

Policy-driven.

- Update `AI_HANDOFF.md` after meaningful work units, not only at the end of a session.
- Update `CURRENT_STATE.md` at every package closeout, before any `/clear` or `/compact`, before a model or tool switch, and before stopping a long session.
- Update `NEXT_SESSION_PROMPT.md` whenever the next-action pointer changes.

If the user invokes any trigger phrase — "checkpoint", "handoff", "before compact", "resume packet", "context guard", "save state", "pause here" — update `AI_HANDOFF.md` immediately and report.

**Post-Commit State Rule bound on this duty.** Continuous updates do **not** mean every commit must amend or be followed by a state-sync commit. Durable state files may be a pre-commit or expected-post-commit snapshot; the actual commit hash for the commit being created belongs in the post-commit closeout report, not inside the file itself. Spin a follow-up state-sync commit only when the docs would misdirect the next agent (wrong branch, wrong package, wrong task, weakened scope, stale blocker). Cosmetic HEAD lag or "after this commit lands" wording is not sufficient reason. Canonical wording: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule".

### 2. Detect and force package boundaries

Policy-driven.

When work reaches a package boundary:

1. Run package verification (`docs/qa/package-verification-template.md`).
2. Update all three continuity files.
3. Update Project Control / command-center docs as a separate post-merge status-sync commit on a separate branch.
4. Propose the commit message and merge plan.
5. Do not commit or push without explicit instruction.
6. Do not start the next package inside the same bloated session by default. Recommend a fresh session.

See `package-boundary-closeout-protocol.md`.

### 3. Recommend the right model and session shape

Semi-automatic.

- Routine mechanical edits → light/default tier.
- Architecture, risky changes, deep review, final audits → strongest tier.
- High thinking only for hard reasoning, not for routine edits.

Before any costly model switch (long active session), update continuity files first. See `model-routing-protocol.md` and `model-switching-protocol.md`.

### 4. Protect context proactively

Policy-driven.

- Watch for high uncached context (e.g. 300k+ or 500k+ tokens).
- Watch for "high context", "high usage", or auto-compact warnings.
- Use `/context` to diagnose; `/usage` to monitor; `/compact` when same task still useful; `/clear` at boundaries.
- Prefer fresh-session restart from repo truth over long `claude --continue` of stale sessions.
- See `context-hygiene-protocol.md`.

### 5. Batch tool calls and prefer scripts

Policy-driven.

- Independent tool calls run in parallel.
- Refactors and mechanical edits get a batching plan before any tool call.
- Prefer one scoped search/report over many tiny search/read turns.
- Prefer scripts for repetitive deterministic transformations.
- See `tool-batching-protocol.md` and `token-efficiency-protocol.md`.

---

## Session-start protocol (run at the start of every session)

This is the standard session-restart sequence (see `session-restart-protocol.md`), plus auto-management additions:

1. Read `AGENTS.md`.
2. Read `CLAUDE.md` (if Claude Code) or `.codex/README.md` (if Codex).
3. Read `AI_HANDOFF.md`.
4. Read `CURRENT_STATE.md`.
5. Read `NEXT_SESSION_PROMPT.md`.
6. Run `git branch --show-current`, `git status --short`, `git log --oneline -10`.
7. Read the package docs referenced by `AI_HANDOFF.md`.
8. Read `docs/project-control/current-sprint.md` if relevant.
9. Decide out loud whether this is a fresh session or a continuation.
10. Decide out loud whether the session appears bloated or stale (long `claude --continue`, large uncached context, repeated failures, slow responses).
11. If bloated/stale: recommend a fresh repo-truth session before doing anything else.
12. Otherwise: state package, branch, objective, scope, exclusions, done, remaining, next exact action.

Only after step 12 may any file be edited.

---

## Rolling state update triggers

Update `AI_HANDOFF.md` and `CURRENT_STATE.md` after **any** of these, not only at the end of a session:

- Completing a package step
- Changing files (after a meaningful batch)
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

**Do not wait until the usage limit or auto-compact warning to write state.** By that point, it may be too late.

---

## High uncached context protocol

Trigger: Claude Code reports unusually high uncached token/context cost (e.g. 300k+, 500k+).

1. Do not continue blindly.
2. Do not treat `claude --continue` as the default.
3. Require that `AI_HANDOFF.md`, `CURRENT_STATE.md`, and `NEXT_SESSION_PROMPT.md` are current. Update if not.
4. Recommend a fresh session from repo truth.
5. Only continue the existing session if the active uncached context is genuinely needed and worth the token/time cost. State that judgment out loud.

Goal: a fresh Claude session in the repo should be able to resume from repo truth without dragging the full ancient transcript.

---

## Model switching protection

Before any model switch in a long or important session:

1. Update `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`.
2. Run `git status` and `git log --oneline -10`.
3. Recommend whether to switch in-session, `/compact` first, `/clear` first, or start fresh.

Do not rely on blind automatic model switching. Use semi-automatic routing: agent recommends → user confirms.

See `model-switching-protocol.md` (when to switch) and `model-routing-protocol.md` (which model to pick).

---

## Codex relay readiness

Prepare a Codex handoff **before** usage limits or context bloat become blockers — not after. When a Codex handoff becomes likely:

1. Stop starting new work.
2. Ensure `AI_HANDOFF.md` / `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` are current.
3. Run `git status`.
4. Produce a transfer packet (format: `docs/automation/operator-mode/claude-codex-relay-protocol.md`).
5. One active editing agent per branch. No tool switch without handoff. No branch merge without verification.

Assumption: Claude may hit limits **before** the user can ask it to update the handoff, so state must be updated continuously during work — not only at the end.

---

## Testing as part of auto-management

The agent must:

- Document the test strategy (see `docs/qa/test-strategy.md`).
- Document the per-package verification (see `docs/qa/package-verification-template.md`).
- Run available tests before recommending commit.
- Surface missing tests as part of the handoff.
- For new packages: include tests wherever feasible from the beginning — not as later cleanup.

Tests this matters for in KeepMees: state transitions, serialization/restore, product eligibility, proof approval transitions (Package 5A), preview/composition fidelity, package boundary regressions, docs/package verification, E2E seeded + real-file, capture harness when Message Book rendering or preview packet behavior is touched.

---

## Notification (permission/wait sound)

User-level config (not committed).

Set up at the user level so Claude Code beeps when it waits for user permission or input. If using multiple `CLAUDE_CONFIG_DIR` accounts (e.g. main + iCloud-synced), install in each.

See `notification-setup.md`.

---

## Fresh-session preference

Default: when context is heavy, recommend a fresh session. The repo is the durable substrate — a fresh agent should be able to resume from repo truth without the full prior transcript.

Acceptable defaults to a fresh session:

- At any package boundary
- After any merge to main
- After a long debugging chain (>1 hour or many failed attempts)
- After any explicit "checkpoint"/"handoff" trigger phrase
- When uncached context cost exceeds the user's tolerance

Acceptable to continue an existing session:

- Same logical task is mid-flight
- Active context is genuinely useful and small
- Within the same package, no boundary reached

---

## What this protocol does NOT do

- It does not commit or push for you. Even at boundaries, the agent proposes; the user authorizes.
- It does not auto-switch models. The harness does not expose programmatic model switching to the agent in this version of Claude Code; claiming it would be fake automation.
- It does not auto-compact. The user (or the harness) chooses.
- It does not silently rewrite continuity files when their structure is uncertain. If a continuity file format change is needed, do it in a dedicated OS upgrade pass and log it in `docs/ai-system/CHANGELOG.md`.

The OS is honest about which parts are policy and which parts are automatic. See `docs/ai-system/universal-standards.md` § "What is automatic, semi-automatic, and policy-driven".

---

## Short Command Interface

The commands in `.claude/commands/` are the daily short interface to this protocol. Use them instead of pasting prompts:

| Command | What it automates |
|---|---|
| `/start` | Session startup (Duty 1: repo-native memory read + 12-step sequence) |
| `/handoff` | Checkpoint / state update (Duty 1: trigger phrases) |
| `/precommit` | Pre-commit gate |
| `/closeout` | Package boundary closeout (Duty 2) |
| `/package-start` | New package pre-flight |
| `/switch-to-codex` | Codex relay (Codex relay readiness section) |
| `/switch-to-claude` | Resume from Codex |
| `/weekly-sync` | Weekly Tower sync |
| `/status-summary` | Project state summary |

See `.claude/commands/README.md` for the full roster.

---

## Quick reference

| Trigger | Action |
|---|---|
| Session start | Run the 12-step session-start sequence |
| File edits begin (any batch) | First batch only: capture intent in `AI_HANDOFF.md` |
| Tests run | Update `AI_HANDOFF.md` with results |
| Branch switch | Update `AI_HANDOFF.md`; never auto-stash |
| Model switch | Update all three continuity files first |
| Tool switch (Claude↔Codex) | Update all three; produce transfer packet |
| Approaching context limit | Update handoff; recommend `/compact` or `/clear` per `context-hygiene-protocol.md` |
| Auto-compact warning | Stop new work; checkpoint; produce transfer packet |
| Package boundary | Full closeout per `package-boundary-closeout-protocol.md` |
| User says "checkpoint" / "handoff" / etc. | Update `AI_HANDOFF.md` immediately and report |
| Considering a follow-up state-sync commit | Apply Post-Commit State Rule (`docs/ai-system/universal-standards.md`); spin one only if docs would misdirect the next agent, not for cosmetic HEAD lag |
