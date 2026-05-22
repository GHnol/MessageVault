# .claude/commands — Custom Slash Command Readiness

**Status:** Readiness placeholder (introduced in Package 2.9). No live custom slash command files are shipped in this pass. This documents the planned commands so a future authorized pass can add them with verified structure.

---

## Why placeholder, not live commands

Custom slash command file format (folder structure, manifest fields, invocation, namespacing) is tool-version-specific. Shipping live command files now risks encoding format details that may not match the running Claude Code version — i.e. fake certainty.

Per the project-OS upgrade policy, prefer README + backlog over uncertain live implementation. Live commands are added only in a separately authorized pass after the format is verified against the Claude Code version in use.

---

## Planned custom slash command roster

| Command | What it would do | Backed by |
|---|---|---|
| `/repo-startup` | Run the session-restart sequence and print the state summary | `docs/dev/session-restart-protocol.md` |
| `/context-budget` | Run the 10-step context-budget checklist | `docs/dev/context-budget-checklist.md` |
| `/checkpoint` | Update `AI_HANDOFF.md` with current state and produce a transfer-packet block | `docs/automation/operator-mode/context-continuity-protocol.md` + `claude-codex-relay-protocol.md` |
| `/package-verify` | Walk the package verification template and record results | `docs/qa/package-verification-template.md` |
| `/pre-commit-verify` | Walk the pre-commit verification template | `docs/qa/pre-commit-verification-template.md` |
| `/closeout-report` | Produce a full closeout report for the active package | `docs/automation/operator-mode/package-closeout-protocol.md` + `docs/dev/package-boundary-closeout-protocol.md` |
| `/boundary-check` | Detect whether the current state is at a package boundary; recommend session shape for next package | `docs/dev/package-boundary-closeout-protocol.md` |
| `/route-model` | Recommend a model tier for the next task based on the routing matrix | `docs/dev/model-routing-protocol.md` |
| `/batch-plan` | Produce a batching plan for a refactor (the six-field format) | `docs/dev/tool-batching-protocol.md` |
| `/qa-verify` | Drive the manual QA and release readiness templates | `docs/qa/*` |
| `/scope-check` | Flag any current changes against the scope-boundaries doc | `docs/dev/agent-scope-boundaries.md` |
| `/sync-status` | Identify which `docs/command-center/*` and `docs/ops/*` files need updating in the post-merge status sync | `docs/automation/operator-mode/package-closeout-protocol.md` Step 10 |

---

## Invariants for any future custom slash command

- Slash commands automate existing protocols; they never invent new authority.
- A slash command's output is verified against actual git/file state, never trusted blindly.
- A slash command never commits or pushes — those remain manual.
- A slash command never starts a new package without explicit Coordinator authorization.
- Scope guards (pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`, standalone keepsake flows, Review view) remain off-limits regardless of which command is invoked.

---

## Backlog item

Implement verified live custom slash command files in a dedicated authorized pass, after the format is confirmed against the Claude Code version in use. Until then this README is the contract for what each command would do.

See also:

- `.claude/agents/README.md` — planned subagent roster (placeholder)
- `.claude/skills/README.md` — planned skill roster (placeholder)
- `docs/dev/auto-management-protocol.md` — the umbrella protocol these commands would automate
