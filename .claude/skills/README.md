# .claude/skills — Project Skill Readiness

**Status:** Readiness placeholder. No live skill definitions are shipped in this pass. This documents the planned skills so a future authorized pass can add them with verified structure.

---

## Why placeholder, not live skills

Skill packaging (folder structure, manifest fields, invocation) is tool-version-specific. Shipping live skills now risks fake certainty about the format. Per the upgrade instruction, prefer README + backlog over uncertain live implementation. Live skills are added only in a separately authorized pass after the format is verified against the Claude Code version in use.

---

## Planned skill roster

| Skill | What it would do | Backed by |
|---|---|---|
| `repo-startup-check` | Run the session-restart sequence and print the state summary | `docs/dev/session-restart-protocol.md` |
| `summarize-changes` | Summarize `git diff` for review | — |
| `pre-commit-review` | Walk the pre-commit verification checklist | `docs/qa/pre-commit-verification-template.md` |
| `write-handoff` | Produce a complete `AI_HANDOFF.md` checkpoint | `docs/automation/operator-mode/context-continuity-protocol.md` |
| `closeout-report` | Produce a package closeout report | `docs/automation/operator-mode/package-closeout-protocol.md` |
| `qa-verification` | Drive the manual QA + release readiness templates | `docs/qa/*` |
| `preview-fidelity-check` | Check preview-vs-design truth | `docs/dev/agent-scope-boundaries.md` |
| `product-boundary-check` | Flag scope/locked-truth violations | `docs/dev/agent-scope-boundaries.md` |
| `project-control-sync-check` | Confirm Project Control docs stay derived | `docs/project-control/*` |

---

## Invariants for any future skill

- Skills automate existing protocols; they never invent new authority.
- Skills obey all scope guards and locked-truth rules.
- A skill's output is verified against actual git/file state, never trusted blindly.
- Skills obey the universal AI Project OS layer (`docs/ai-system/universal-standards.md`) and the auto-management umbrella (`docs/dev/auto-management-protocol.md`).
- A skill that drives package verification, package boundary closeout, or pre-commit hygiene must back to the corresponding template / protocol — `docs/qa/package-verification-template.md`, `docs/dev/package-boundary-closeout-protocol.md`, `docs/qa/pre-commit-verification-template.md`.

(Backlog item: implement verified live skills in a dedicated authorized pass.)

See also: `.claude/agents/README.md` (planned subagents), `.claude/commands/README.md` (planned custom slash commands, added Package 2.9).
