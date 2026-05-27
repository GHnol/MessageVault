# .claude/skills — Skills (Canonical Protocol Layer)

**Status:** ACTIVE — 15 live skills. 13 shipped in AI Project OS Framework Groundwork Pass (2026-05-24); 1 added in v1.3 External Board Provider Update (2026-05-25); 1 added in v1.5 Template GitHub Project Standard (2026-05-26).

---

## Skills are canonical

**Skills** (`.claude/skills/*/SKILL.md`) are the authoritative protocol definitions. Each SKILL.md contains YAML frontmatter (`name:`, `description:`) plus the full protocol: purpose, when to use, files to read, git preflight, sync obligations, output format, hard stop conditions, and approval boundaries.

**Commands** (`.claude/commands/*.md`) are compatibility wrappers — thin delegates that invoke the matching skill workflow. Commands are the daily user interface; skills are the protocol source of truth.

This separation allows the canonical protocol to evolve independently of the command invocation mechanism.

---

## Live skill roster

| Skill | What it does |
|---|---|
| `start` | Session startup — read repo state, declare package/branch/next action |
| `handoff` | Update `AI_HANDOFF.md` and produce transfer packet |
| `precommit` | Walk the pre-commit verification gate |
| `closeout` | Package boundary closeout + internal sync check |
| `package-start` | Pre-flight for newly authorized package |
| `switch-to-codex` | Prepare Codex handoff and transfer packet |
| `switch-to-claude` | Resume from Codex — read repo truth, declare state |
| `weekly-sync` | Coordinator weekly sync; check Tower drift |
| `status-summary` | Generate internal + shareable project status |
| `os-audit` | AI Project OS self-audit; verify bootstrap complete |
| `project-sync-dry-run` | Project-control sync dry-run (no writes, no external changes) |
| `project-sync-apply` | Apply approved sync delta (internal docs + proposed external) |
| `notification-setup-wizard` | Walk notification hook setup (local-only, never committed) |
| `github-project-setup` | Plan, dry-run, and approval-gate GitHub Projects setup for AI Project OS external boards |
| `github-project-template` | Manage the canonical AI Project OS GitHub Project template — dry-run, validate, and Gate 2 apply for template creation and copy |

---

## Invariants for every skill

- Skills are user-invoked. They route Claude through existing protocols — they never invent new authority.
- Skills obey all scope guards and locked-truth rules.
- A skill's output is verified against actual git/file state, never trusted blindly.
- Skills obey the universal AI Project OS layer (`docs/ai-system/universal-standards.md`) and the auto-management umbrella (`docs/dev/auto-management-protocol.md`).
- Skills never commit, push, merge, deploy, or write to external tools — those remain explicit user-instruction steps.
- External sync skills (`project-sync-dry-run`, `project-sync-apply`) are dry-run/approval-gated.
- Skills that write local files (handoff, project-sync-apply) do so only within the repo or user config — never to committed secrets or external APIs.

---

## SKILL.md format

Each SKILL.md uses this frontmatter at the top:

```yaml
---
name: <skill-name>
description: <clear one-sentence description>
---
```

Followed by sections: Purpose, When to use, Files to read, Required git preflight, Sync obligations, Output format, Hard stop conditions, Approval boundaries, Backed by.

---

## How to add a new skill

1. Create `.claude/skills/<name>/SKILL.md`
2. Add YAML frontmatter with `name:` and `description:`
3. Fill in the standard sections
4. Create or update `.claude/commands/<name>.md` as a thin wrapper pointing to the skill
5. Add the skill to the roster table above
6. Add the command to `.claude/commands/README.md`
7. Log in `docs/ai-system/CHANGELOG.md`

See also: `.claude/agents/README.md` (planned subagents), `.claude/commands/README.md` (command roster).
