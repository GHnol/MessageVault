# .claude/agents — Project Subagent Readiness

**Status:** Readiness placeholder. No live subagent definition files are shipped in this pass. This documents the planned roster so a future authorized pass can add them with verified frontmatter.

---

## Why placeholder, not live files

Subagent definition files are tool-specific (YAML frontmatter: `name`, `description`, `tools`, model). Shipping live agent files now risks encoding tool names or behavior that may not match the running Claude Code version — i.e. fake certainty. Per the upgrade instruction, prefer a README + backlog over uncertain live implementation.

Live subagents are added only in a separately authorized pass, after the frontmatter format is verified against the Claude Code version in use.

---

## Planned subagent roster

| Subagent | Purpose |
|---|---|
| `keepmees-code-reviewer` | Reviews diffs for scope creep, regressions, secrets, debug output |
| `keepmees-qa-reviewer` | Verifies QA templates filled, tests run, manual QA where required |
| `keepmees-product-boundary-reviewer` | Flags reopened locked decisions, out-of-scope product/vendor/design claims |
| `keepmees-architecture-reviewer` | Reviews structural/architecture changes against the ADR and roadmap |
| `keepmees-docs-handoff-reviewer` | Checks `AI_HANDOFF.md` / `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` completeness |
| `keepmees-preview-fidelity-reviewer` | Guards preview-vs-design truth distinction |
| `keepmees-project-control-reviewer` | Checks Project Control docs stay derived, not drifting |

---

## Invariants for any future subagent

- Subagents advise; they do not commit on a branch they do not own.
- Subagents inherit all scope guards and locked-truth rules.
- A subagent's summary is intent, not proof — its output must be verified against the actual diff.
- Subagents obey the universal AI Project OS layer (`docs/ai-system/universal-standards.md`) and the auto-management umbrella (`docs/dev/auto-management-protocol.md`).
- Subagents that perform package-boundary or verification work back to `docs/dev/package-boundary-closeout-protocol.md` and `docs/qa/package-verification-template.md` — they do not invent new closeout rules.

(Backlog item: implement verified live subagent files in a dedicated authorized pass.)

See also: `.claude/skills/README.md` (planned skills), `.claude/commands/README.md` (planned custom slash commands, added Package 2.9).
