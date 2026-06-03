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
| `.claude/skills/<name>/SKILL.md` | **Skills are canonical** — create SKILL.md with YAML frontmatter (`name:`, `description:`) for each core workflow. Minimum: `start`, `handoff`, `precommit`, `closeout`. Skills are the authoritative protocol definitions. |
| `.claude/commands/README.md` | Short Command Interface — live command wrappers for daily operation |
| `.claude/commands/start.md` | Thin wrapper → delegates to `start` skill |
| `.claude/commands/handoff.md` | Thin wrapper → delegates to `handoff` skill |
| `.claude/commands/precommit.md` | Thin wrapper → delegates to `precommit` skill |
| `.claude/commands/closeout.md` | Thin wrapper → delegates to `closeout` skill |
| `.claude/settings.local.json` | **Not committed.** Each contributor configures their own. |
| `.codex/README.md` | Codex-specific layer — roles, interchangeability, config policy |
| `.codex/config.toml` | **Skip** until the Codex schema is verified for the version in use. Document as backlog. |

No live hooks, no live subagents — unless verified safe in a separately authorized pass. Skills are now the canonical layer and should be created with SKILL.md frontmatter format.

User-invoked command wrappers delegate to skills: plain markdown files in `.claude/commands/` are safe, format-verified, and the primary short entry point for daily operation. The user types `/command`; Claude Code routes to the command file prompt; Claude follows the skill protocol. At minimum, create skills for `start`, `handoff`, `precommit`, `closeout`, then thin command wrappers for each. Copy from KeepMees and adapt.

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

### External board (default: GitHub Projects)

**GitHub Projects is the default external board provider** for any AI Project OS repo (as of v1.3). **Template-copy is the preferred setup path** (as of v1.5); create-from-scratch is the fallback. Set up GitHub Projects before ClickUp. Copy and adapt:

- `docs/project-control/github-projects-setup-policy.md` — approved structure (v1.5 Status vocabulary)
- `docs/project-control/github-projects-source-schema.md` — source schema
- `docs/project-control/github-projects-import-runbook.md` — import process (template-copy section)
- `docs/project-control/github-projects-field-map.example.json` — example field map (safe to commit; placeholder IDs only)
- `docs/project-control/github-projects-sync-log.md` — start fresh
- `docs/project-control/github-projects-template-standard.md` — canonical template standard (v1.5); two-gate model; vocabulary
- `docs/project-control/github-projects-template-copy-runbook.md` — Gate 1/Gate 2 runbook
- `docs/project-control/github-projects-template-config.example.json` — committed example (placeholder IDs only)
- `scripts/github-project-setup-dry-run.mjs` — copy as-is
- `scripts/github-project-setup-apply.mjs` — copy as-is (auto-detects template config; falls back to create-from-scratch)
- `scripts/github-project-import-issues.mjs` — copy as-is
- `scripts/github-project-sync-status.mjs` — copy as-is
- `scripts/github-project-field-map.mjs` — copy as-is
- `scripts/github-project-template-dry-run.mjs` — copy as-is
- `scripts/github-project-template-validate.mjs` — copy as-is
- `scripts/github-project-template-apply.mjs` — copy as-is
- `.claude/skills/github-project-setup/SKILL.md` — copy and adapt project name
- `.claude/commands/github-project-setup.md` — copy as-is
- `.claude/skills/github-project-template/SKILL.md` — copy as-is
- `.claude/commands/github-project-template.md` — copy as-is

**Template-copy path for the new repo:**
1. Complete Gate 2 for the source/template repo (see `github-projects-template-copy-runbook.md`)
2. Write real template IDs to `github-projects-template-config.local.json` (gitignored, never committed)
3. Run `github-project-setup-apply.mjs --apply` — template-copy auto-detected

**ClickUp is an optional adapter.** Copy `clickup-setup-policy.md` only if the project will use ClickUp alongside GitHub Projects.

### Google Calendar live sync (v1.6 — optional but recommended)

**v1.6 adds real live sync via Google Calendar API.** Copy and adapt:

- `docs/project-control/google-calendar-source-schema.md` — copy as-is; defines the field schema
- `docs/project-control/google-calendar-sync-policy.md` — adapt project name and adoption rule
- `docs/project-control/google-calendar-sync-runbook.md` — adapt project name
- `docs/project-control/google-calendar-credentials.example.md` — copy as-is
- `docs/project-control/google-calendar-source-records.json` — populate with the new project's events (use `<project>-` os_id prefix)
- `docs/project-control/google-calendar-sync-log.md` — start fresh
- `scripts/google-calendar-source-validate.mjs` — copy as-is
- `scripts/google-calendar-sync-dry-run.mjs` — copy as-is
- `scripts/google-calendar-sync-apply.mjs` — copy as-is
- `scripts/generate-project-calendar.mjs` — copy as-is; adapt CALENDAR_DOMAIN and CALENDAR_NAME
- `.claude/skills/google-calendar-sync/SKILL.md` — copy and adapt project name
- `.claude/commands/google-calendar-sync.md` — copy as-is
- `.gitignore` additions: `token.json`, `**/token.json`, `google-calendar-token.json` (universal)

Each new project uses its own `external-sync-map.local.json` (gitignored). Do not share event IDs or os_ids between projects.

Other external-tool layers (TickTick, static Calendar `.ics`) are optional per project.

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

## 8b. State-Zero Closeout Rule (universal — travels with the OS, added v1.8)

The State-Zero rule lives in `docs/ai-system/universal-standards.md` and travels to every repo bootstrapped from this template. It complements the Post-Commit State Rule:

- Post-Commit State Rule: hash lag in narrative fields is WARN (cosmetic).
- State-Zero rule: wrong active branch, wrong active package, wrong next action are FAIL (operational) — never cosmetic, even when the handoff status is "complete."

Confirm that, after any merge to `main`, the state docs (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`) say "active branch: main" before the session ends. A merged sync branch still showing as active is a State-Zero violation.

In the new repo, create `docs/dev/state-zero-closeout-protocol.md` (copy from KeepMees and adapt). Add State-Zero references to the closeout, handoff, precommit, and start skills.

Cross-references that must exist in the new repo:
- `docs/dev/state-zero-closeout-protocol.md` (protocol)
- `docs/dev/closeout-sync-contract.md` § "State-Zero requirement" (contract)
- `docs/dev/session-restart-protocol.md` § "State-Zero rule" (restart)
- `scripts/state-freshness-check.mjs` — State-Zero FAIL_WRONG_ACTIVE_BRANCH rule
- `scripts/start-router.mjs` — NEEDS_STATE_SYNC regardless of handoffIsComplete
- Skills: `closeout`, `handoff`, `precommit`, `start`, `weekly-sync` reference `state-zero-closeout-protocol.md`

---

## 8a. Post-Commit State Rule (universal — travels with the OS)

The Post-Commit State Rule lives in `docs/ai-system/universal-standards.md` and travels to every repo bootstrapped from this template. Confirm it is present in the copied `universal-standards.md` and that the matching cross-references exist in:

- `docs/dev/package-boundary-closeout-protocol.md` (status sync decision section)
- `docs/dev/session-restart-protocol.md` (HEAD verification at preflight)
- `docs/dev/auto-management-protocol.md` (rolling-update bound + quick-reference row)

The rule prevents recursive state-sync commits in any repo using this OS: durable state files may be pre-commit or expected-post-commit snapshots, commit hashes belong in post-commit reports, the next session verifies HEAD during preflight, and follow-up sync commits are spun only when stale wording would misdirect the next agent.

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
- `.gitignore` blocks Claude local settings, secrets, artifacts, local external-sync maps, and raw transcripts.
- The PR template has AI-agent + continuity sections.
- **Skills exist** — at minimum `start`, `handoff`, `precommit`, `closeout` with SKILL.md frontmatter.
- **Start router exists** — `scripts/start-router.mjs` is present and passes `node --check`. Run it at startup: `node scripts/start-router.mjs`.
- **OS self-audit passes** — run `/os-audit` (or `scripts/os-self-audit.mjs`) and receive `BOOTSTRAP COMPLETE`.
- **Closeout sync contract exists** — `docs/dev/closeout-sync-contract.md` is present.
- **Scrutinous adoption rule documented** — `docs/dev/model-routing-protocol.md` has the adoption rule section so new contributors know to evaluate features before adopting them.
- **Documentation-watch framework exists** — `docs/ai-system/documentation-watch-policy.md`, `documentation-watch-sources.md`, `documentation-watch-evaluation-template.md`, and `documentation-watch-log.md` are present. Run `node scripts/documentation-watch-check.mjs` — 0 failures.
- **Bootstrap copy-forward guidance exists** — `docs/ai-system/bootstrap-copy-forward-guide.md`, `universal-vs-project-specific-map.md`, and `future-repo-bootstrap-checklist.md` are present. Run `node scripts/bootstrap-copy-forward-audit.mjs` — 0 failures.

If any of those is missing, the bootstrap is incomplete. The OS self-audit script (`scripts/os-self-audit.mjs`) is the definitive check.

---

## 11. After bootstrap — first project-specific package

Once bootstrap is committed and merged, the first project-specific package can start. Examples:

- **Product strategy package:** create `docs/strategy/` with the project's authoritative truth docs.
- **Architecture package:** create `docs/architecture/` with the first ADR.
- **First feature package:** scoped, with its own `AI_HANDOFF.md` cycle.

Package 5A (KeepMees Message Book Proof Approval State Foundation) is the KeepMees-specific example — not a template. Each project picks its own first authorized package.

---

## What this template intentionally does NOT do

- Does not commit live hooks or subagents (format not yet verified for all repo configurations).
- Does not install n8n / Make / Zapier flows.
- Does not auto-create a GitHub Project or GitHub Issues — setup follows the dry-run/apply workflow in `github-projects-import-runbook.md` with explicit Coordinator approval.
- Does not configure the permission-notification beep at user level — each contributor installs that via `/notification-setup-wizard`; see `docs/dev/notification-setup.md`. Not committed; not shared; not enforced on other contributors.
- Does not make any product decisions for the new project.
- Does not write to external tools (GitHub Projects, Google Calendar, ClickUp, TickTick) — all external sync is dry-run/apply with approval.

**What the template does include (updated in Operator Reliability Repair, 2026-06-02):**
- Skill folders with SKILL.md frontmatter — the canonical protocol layer.
- Thin command wrappers in `.claude/commands/` that delegate to skills.
- Closeout sync contract (`docs/dev/closeout-sync-contract.md`) — mandatory internal sync after meaningful closeouts.
- Project-control sync foundation — policy, dry-run format, external sync safety rules, example ID map.
- OS self-audit (`/os-audit` + `scripts/os-self-audit.mjs`) — required before claiming bootstrap complete.
- Notification setup wizard (`/notification-setup-wizard` + `scripts/setup-claude-notification.ps1`).
- Notification check script (`scripts/notification-check.mjs`) — diagnoses PermissionRequest and Stop hook config.
- Documentation-watch framework — policy, source list, evaluation template, log, skill, command, and validator script.
- Bootstrap copy-forward guidance — universal-vs-project-specific map, Puzzle alignment checklist, future-repo bootstrap checklist, copy-forward skill, command, and audit script.
- Raw transcript capture protocol — file-first response protocol, skill, command, and verification script (`scripts/raw-transcript-check.mjs`). Verbatim final-response capture; gitignored; policy-driven.

These are intentional gaps and additions. They keep the bootstrap safe and copy-pasteable.
