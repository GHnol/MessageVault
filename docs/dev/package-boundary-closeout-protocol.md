# Package Boundary Closeout Protocol

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol
**Distinct from:** `docs/automation/operator-mode/package-closeout-protocol.md` (which covers the *commit/merge/sync mechanics*). This doc covers the *boundary behavior* — what the agent does **before** the user authorizes the commit, and the rules that prevent the next package from starting in a bloated session.

---

## Principle

A package boundary is a hard stop, not a soft transition. The agent must:

- Run package verification.
- Update continuity files.
- Propose commit and merge plan.
- Refuse to silently roll into the next package.
- Recommend a fresh session if context is heavy.

This prevents the most common compound failure: a long session that produced one package successfully, then drifts into the next package with degraded context and gradually breaks scope.

---

## Boundary detection

A package boundary exists when **any** of these are true:

- The active package's "Work remaining" in `AI_HANDOFF.md` is empty.
- All acceptance criteria for the package are met and verified.
- The Coordinator has explicitly closed the package.
- A merge-to-main has happened for the package.
- The status sync after a merge has been completed.

When any one fires, the agent runs the boundary closeout sequence below.

---

## Boundary closeout sequence

1. **Verify scope.** Compare files changed against the authorized package scope. Anything outside scope must be reverted or flagged.

2. **Run package verification.** Use `docs/qa/package-verification-template.md`. Record what was run, what passed, what was skipped (with reason). For KeepMees:
   - Node unit suites (relevant for the package)
   - E2E seeded harness (if behavior was touched)
   - E2E real-files harness (if real-file paths were touched)
   - Capture harness (if Message Book rendering or preview was touched)
   - Docs/package verification (link checks, schema validation, etc.)

3. **Update `AI_HANDOFF.md`.** Status moves to `ready-for-commit` (or `closed` once merge has happened). All required fields filled.

4. **Update `CURRENT_STATE.md`.** Last-closed package and main-HEAD bumped (the main-HEAD update happens after the merge in the status-sync commit, not before).

5. **Update `NEXT_SESSION_PROMPT.md`.** Next-action pointer updated.

6. **Propose commit.** Write the exact recommended commit message in chat. Do not commit without explicit instruction.

7. **Propose merge plan.** Branch name, base, merge flag, push order. Do not push without explicit instruction.

8. **Internal sync check.** Run the closeout sync contract (`docs/dev/closeout-sync-contract.md`). Verify `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`, `docs/project-control/current-sprint.md`, and `docs/project-control/kanban-board.md`. Run `/project-sync-dry-run` if there is suspected drift in calendar or external tool exports. Apply the Post-Commit State Rule: edit only if docs would misdirect the next agent.

9. **Status sync plan.** Identify the docs that need updating in the post-merge status-sync commit (typically `docs/command-center/*`, `docs/ops/artifact-index.md`, `docs/ops/backlog-roadmap.md`, `docs/ops/ai-automation-register.md`, `docs/project-control/coordinator-weekly-sync.md` weekly-log row). Do not perform the sync until the package is merged and the user authorizes it.

10. **Recommend session shape for the next package.** See "Next-package gating" below.

---

## Next-package gating

After a package closes, the next package does **not** start in the same session by default.

| Situation | Default action |
|---|---|
| Same session, low context use (<30% indicator), small package next | Acceptable to continue in-session after confirming with the user |
| Same session, moderate-to-high context use, or non-trivial next package | Recommend `/clear` and restart from `NEXT_SESSION_PROMPT.md` |
| Same session, auto-compact warning visible | Mandatory fresh session — do not start the next package in-session |
| Cross-day or after a long pause | Mandatory fresh session |
| User has not authorized the next package | Stop — do not start anything new |

The agent must state out loud which case applies before proceeding to any next-package work.

---

## Boundary refusals

The agent must refuse to do any of these at a package boundary without explicit authorization:

- Start the next package's implementation
- Self-authorize scope expansion in the closing package "while we're here"
- Roll fix-it commits into the closeout
- Commit or push without instruction
- Skip package verification because "tests look fine from what I remember"
- Treat the in-context summary as the source of truth for what was done — always verify against `git diff` and the file list

If the user explicitly says "do X next", that's authorization. If the user is silent, the agent waits.

---

## Boundary report (what the agent says in chat)

A complete boundary report includes:

1. Package name + status
2. Branch and commit summary (if commit happened)
3. Verification results — which tests/checks ran, results, which were skipped
4. Files changed vs. authorized scope (any out-of-scope items)
5. Continuity files updated (yes/no for each)
6. Proposed commit message
7. Proposed merge plan
8. Proposed status-sync commit plan (branch name, files to update)
9. Recommended session shape for the next package
10. Blockers, if any

This goes in chat. The agent does not auto-commit it to a file.

---

## Status sync as a separate commit

The Command Center / ops status sync is a separate commit on a separate branch (e.g. `docs/sync-command-center-after-package-2-9`). Per the operator-mode package closeout protocol:

1. The package implementation commit goes first.
2. The implementation merges to main.
3. **Then** the status sync branch is created.
4. Status sync commit is `docs:` prefixed.
5. Status sync merges to main.

The agent must not bundle status sync into the implementation commit. They are separate.

See `docs/automation/operator-mode/package-closeout-protocol.md` Step 10 for the exact sync flow.

---

## Post-Commit State Rule (applies to status sync decisions)

Status sync is required when the durable state files would **misdirect the next agent** — not when they are merely cosmetically out of sync with the just-created commit.

Durable state files (`CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md`, `docs/command-center/*`, `docs/project-control/*`) may be a pre-commit snapshot or an expected-post-commit snapshot. The actual commit hash belongs in the post-commit closeout report (chat, PR body, changelog), not inside the file being committed. Future sessions verify `HEAD` during preflight; that verification — not another commit — is the corrective control for stale hashes.

**Spin a follow-up state-sync commit when:** branch name, active package, next-action pointer, hard exclusions, or blocker status would point the next agent at the wrong work.

**Do NOT spin a follow-up state-sync commit when:** only the `main HEAD` field lags by one commit, a doc uses "after this commit lands" phrasing, or a timestamp is mildly stale but the named package / branch / scope / next action are still accurate.

Canonical wording: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule".

---

## When the agent must stop and ask

- Files outside the authorized scope appear in `git status` and weren't predicted by `AI_HANDOFF.md`.
- A test that should have been green is red.
- The package "feels done" but `AI_HANDOFF.md` doesn't match the diff.
- A locked decision appears to have been touched.
- The user says nothing about commit/push for an extended period — do not act on assumption.

Stop, report, wait.

---

## What this protocol does NOT do

- It does not commit or push. Even at a boundary, the agent proposes.
- It does not perform the status sync on its own — that's a separate authorized commit.
- It does not declare a package closed without verification.
- It does not roll multiple packages into one boundary closeout — one package, one boundary.

See `auto-management-protocol.md` for how this fits the larger auto-management duties, and `docs/automation/operator-mode/package-closeout-protocol.md` for the commit/merge mechanics.
