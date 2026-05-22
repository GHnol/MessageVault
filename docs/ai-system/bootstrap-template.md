# AI Project OS Bootstrap Template

**Status:** ACTIVE (introduced in Package 2.9).
**Last updated:** 2026-05-22 (America/New_York)
**Use:** Provisioning pattern for installing the AI Project OS layer in a new repo (e.g. Puzzle, or any future project).

This is a real pattern, not a vague checklist. Follow it top to bottom for a new repo, and the new repo will have the same continuity / model-routing / testing / handoff discipline as KeepMees.

KeepMees-specific scope (Message Book, vendor gating, etc.) is **not** part of this template — it is layered on top after bootstrap.

---

## 0. Pre-flight

Before touching the new repo:

- Confirm git identity for the new repo (`git config user.name` / `user.email` — must match the new project's account).
- Confirm the new repo's remote is correct (`git remote -v`).
- Confirm you have permission to create branches and push.
- Decide the project's flagship product and lock it in a one-paragraph statement (this becomes the seed for `AGENTS.md` § Project overview).

Do **not** start the bootstrap on `main`. Create a branch like `docs/bootstrap-ai-project-os`.

---

## 1. Universal agent layer (root files)

Copy and adapt:

| File | Source pattern | What to change |
|---|---|---|
| `AGENTS.md` | KeepMees `AGENTS.md` | Replace `KeepMees / MessageVault` project overview; keep the universal contract intact; keep tool-layering, durable continuity, switching protocol table |
| `CLAUDE.md` | KeepMees `CLAUDE.md` | Replace project-specific behavior rules and scope guards; keep git rules, tool use rules, memory rules, session/context protocols |
| `AI_HANDOFF.md` | KeepMees skeleton | Empty initial state: status `idle`, no active package |
| `CURRENT_STATE.md` | KeepMees skeleton | Project identity section filled; gates table empty or project-specific |
| `NEXT_SESSION_PROMPT.md` | KeepMees skeleton | Pointer to first authorized work item |
| `README.md` | Minimal | Project name + one-paragraph intro |

---

## 2. Tool layer

| Directory | What to create |
|---|---|
| `.claude/agents/README.md` | Readiness placeholder (planned subagent roster) — copy KeepMees pattern, edit roles to match new project |
| `.claude/skills/README.md` | Readiness placeholder (planned skill roster) |
| `.claude/commands/README.md` | Readiness placeholder (planned custom slash commands) |
| `.claude/settings.local.json` | **Not committed.** Each contributor configures their own. |
| `.codex/README.md` | Codex-specific layer — roles, interchangeability, config policy |
| `.codex/config.toml` | **Skip** until the Codex schema is verified for the version in use. Document as backlog. |

No live hooks, no live subagents, no live skills, no live custom slash commands — unless verified safe in a separately authorized pass.

---

## 3. AI System layer (this directory)

| File | What it does |
|---|---|
| `docs/ai-system/README.md` | Explain the AI Project OS for this repo |
| `docs/ai-system/universal-standards.md` | Copy from KeepMees; standards travel as-is |
| `docs/ai-system/bootstrap-template.md` | Keep a copy in the new repo too, so the next bootstrap is easier |
| `docs/ai-system/CHANGELOG.md` | Start fresh; first entry is "AI Project OS bootstrapped" |
| `docs/ai-system/version-history.md` | Start fresh; row 1 is the bootstrap commit |

---

## 4. Dev workflow protocols

Copy all of `docs/dev/`:

- `ai-development-relay.md`
- `agent-scope-boundaries.md`
- `auto-management-protocol.md`
- `claude-codex-interchangeability.md`
- `context-budget-checklist.md`
- `context-hygiene-protocol.md`
- `development-review-packet-template.md`
- `model-routing-protocol.md`
- `model-switching-protocol.md`
- `notification-setup.md`
- `package-boundary-closeout-protocol.md`
- `session-restart-protocol.md`
- `token-efficiency-protocol.md`
- `tool-batching-protocol.md`
- `tool-switching-protocol.md`
- `worktree-and-parallel-session-policy.md`

Edit only the parts that name KeepMees-specific files (e.g. `BOOK_PAGINATION_VERSION`). The universal logic stays.

---

## 5. QA + testing protocols

Copy all of `docs/qa/`:

- `manual-qa-template.md`
- `pre-commit-verification-template.md`
- `release-readiness-template.md`
- `test-strategy.md`
- `package-verification-template.md`

Adapt the test-strategy doc to whatever test runner the new repo uses (Node, pytest, Go, etc.).

---

## 6. Project control layer (optional but recommended)

If the new project will benefit from the Tower pattern, copy the structure of `docs/project-control/` but not the KeepMees content:

- `README.md` — adapt the six-layer rules
- `master-roadmap.md`, `master-schedule.md`, `current-sprint.md` — start fresh
- `backlog.md`, `kanban-board.md`, `phase-gates.md`, `decision-log.md`, `risk-register.md` — start fresh, populate as decisions land
- `calendar-spec.md` — adapt rituals
- `coordinator-weekly-sync.md` — adapt to the new project's cadence
- `next-session-prompt.md` — adapt the resume prompt

External-tool layers (ClickUp/TickTick/Calendar `.ics`) are optional per project.

If the new project is small, skip this whole layer and rely on `AI_HANDOFF.md` + a single `BACKLOG.md` instead.

---

## 7. GitHub layer

| File | What to create |
|---|---|
| `.github/PULL_REQUEST_TEMPLATE.md` | Copy KeepMees pattern with AI-agent + continuity sections |

CI workflows (`.github/workflows/`) are **not** part of the AI Project OS bootstrap. Add them per project, separately.

---

## 8. Gitignore protections

Start with this universal block (project-specific entries get appended):

```
# Claude Code — local / private (never commit)
.claude/settings.local.json
.claude/worktrees/
CLAUDE.local.md

# Codex — local / private config (never commit)
.codex/config.local.toml
.codex/*.local.*
.codex/secrets*

# Secrets / credentials (never commit)
.env
.env.*
*.local.env
**/secrets.json
**/credentials.json
aws-credentials*
*.pem

# Generated artifacts / exports / local reports (never commit)
artifacts/
*.pdf
*.ics
local-reports/
screenshots/
.tmp-ai/
_source-intake/

# IDE / OS / log noise
*.log
.DS_Store
*.swp
*.swo
.idea/
.vscode/

# Dependencies
node_modules/
```

If the project commits a specific generated file (like KeepMees does with `keepmees-project-calendar.ics`), add a surgical `!` exception.

---

## 9. First commit

After all the files above exist:

```
git add AGENTS.md CLAUDE.md AI_HANDOFF.md CURRENT_STATE.md NEXT_SESSION_PROMPT.md \
        .claude/agents/README.md .claude/skills/README.md .claude/commands/README.md \
        .codex/README.md \
        docs/ai-system/ docs/dev/ docs/qa/ \
        .github/PULL_REQUEST_TEMPLATE.md \
        .gitignore
```

Commit message pattern:

```
docs: bootstrap AI Project OS

- universal agent contract + Claude/Codex layers
- AI system docs (README, universal standards, bootstrap template, changelog, version history)
- dev workflow protocols (model routing, token efficiency, batching, package boundary, notification setup, etc.)
- QA test strategy and package verification template
- PR template + .gitignore protections
```

Do **not** push or merge without explicit project-owner instruction.

---

## 10. Verification

The new repo passes bootstrap when:

- A fresh agent (Claude Code or Codex) can read `AGENTS.md` → tool layer → `AI_HANDOFF.md` → `CURRENT_STATE.md` and state out loud what to do next.
- `docs/ai-system/CHANGELOG.md` has an entry for the bootstrap.
- `version-history.md` has the bootstrap row.
- `.gitignore` blocks Claude local settings, secrets, and artifacts.
- The PR template has AI-agent + continuity sections.

If any of those is missing, the bootstrap is incomplete.

---

## 11. After bootstrap — first project-specific package

Once bootstrap is committed and merged, the first project-specific package can start. Examples:

- **Product strategy package:** create `docs/strategy/` with the project's authoritative truth docs.
- **Architecture package:** create `docs/architecture/` with the first ADR.
- **First feature package:** scoped, with its own `AI_HANDOFF.md` cycle.

Package 5A (KeepMees Message Book Proof Approval State Foundation) is the KeepMees-specific example — not a template. Each project picks its own first authorized package.

---

## What this template intentionally does NOT do

- Does not commit live hooks, subagents, skills, or slash commands.
- Does not install n8n / Make / Zapier flows.
- Does not auto-create a GitHub Project board.
- Does not configure the permission-notification beep at user level (each contributor does that themselves — see `docs/dev/notification-setup.md`).
- Does not make any product decisions for the new project.

These are intentional gaps. They keep the bootstrap safe and copy-pasteable.
