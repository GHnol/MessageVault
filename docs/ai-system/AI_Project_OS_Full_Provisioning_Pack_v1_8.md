# AI Project OS — Full Provisioning Pack v1.8

**Version:** 1.8.0
**Status:** COMPLETE — State-Zero Bootstrap Finalization pass, 2026-06-03
**Use:** Step-by-step provisioning sequence for bootstrapping the AI Project OS in a new repo. Use in conjunction with `bootstrap-template.md` (the detailed template) and `future-repo-bootstrap-checklist.md` (the verification checklist).

Supersedes all `v1_4_2` pack references. See `AI_Project_OS_Final_Reference_COMPLETE_v1_8.md` for the single-file orientation document.

---

## What has changed since v1_4_2

If you have an older `v1_4_2` pack, here is what the new pack adds:

| Capability | Added in | What to do |
|---|---|---|
| State-Zero Closeout Rule | v1.8 | Add `docs/dev/state-zero-closeout-protocol.md`; update start-router and state-freshness-check; update skills |
| Start router (`start-router.mjs`) | v1.7.4 | Add script + skill + command; add to startup sequence |
| State freshness check (`state-freshness-check.mjs`) | v1.7.2 | Add script + integrate into closeout/precommit/handoff skills |
| Report mirroring (`report-mirror-intake.mjs`) | v1.7.3 | Add script + policy + schema + log + skill + command |
| External sync consistency (`external-sync-consistency-check.mjs`) | v1.7.5 | Add script + policy + schema + log + fixture + skill + command |
| Documentation-watch framework | v1.7.6 | Add policy + sources + template + log + skill + command + validator |
| Bootstrap copy-forward guidance | v1.7.6 | Add copy-forward guide + universal-vs-project-specific map + future-repo checklist + skill + command + validator |
| Raw transcript Type 1 protocol | Operator Reliability Repair | Add protocol doc + skill + command + check script |
| Completion sound (Stop hook) | Operator Reliability Repair | User-level setup; diagnose with `notification-check.mjs` |
| Notification check script | Operator Reliability Repair | Add `scripts/notification-check.mjs` |

---

## Provisioning sequence

### Step 0 — Pre-flight

- Confirm git identity for the new repo
- Confirm correct remote
- Create bootstrap branch: `docs/bootstrap-ai-project-os`
- Lock the project's flagship product (one paragraph — becomes `AGENTS.md` seed)

### Step 1 — Universal agent layer (root files)

Copy and adapt from KeepMees:
- `AGENTS.md` — rewrite § Project overview; keep universal contract intact
- `CLAUDE.md` — rewrite project-specific rules; keep git/tool/memory/session protocols
- `AI_HANDOFF.md` — skeleton: status `idle`, no active package, active branch `main`
- `CURRENT_STATE.md` — project identity filled; gates table empty
- `NEXT_SESSION_PROMPT.md` — pointer to first authorized work item
- `README.md` — project name + one-paragraph intro

### Step 2 — Tool layer

```
.claude/agents/README.md         — readiness placeholder
.claude/skills/start/SKILL.md    — copy KeepMees start skill; adapt project name
.claude/skills/handoff/SKILL.md  — copy and adapt
.claude/skills/precommit/SKILL.md — copy and adapt
.claude/skills/closeout/SKILL.md  — copy and adapt (includes State-Zero requirement)
.claude/commands/README.md       — short command interface list
.claude/commands/start.md        — thin wrapper
.claude/commands/handoff.md      — thin wrapper
.claude/commands/precommit.md    — thin wrapper
.claude/commands/closeout.md     — thin wrapper
.codex/README.md                 — Codex-specific layer
```

Skills must include State-Zero references (copy from KeepMees v1.8 versions). Command wrappers delegate to skills.

### Step 3 — AI System layer

Copy from KeepMees (keep as-is or start fresh):
```
docs/ai-system/README.md                          — adapt for new repo
docs/ai-system/universal-standards.md             — copy as-is (universal)
docs/ai-system/bootstrap-template.md              — keep a copy for future bootstraps
docs/ai-system/CHANGELOG.md                       — start fresh
docs/ai-system/version-history.md                 — start fresh (row 1 = bootstrap)
docs/ai-system/AI_Project_OS_Final_Reference_COMPLETE_v1_8.md — copy as-is
docs/ai-system/AI_Project_OS_Full_Provisioning_Pack_v1_8.md   — copy as-is (this file)
```

### Step 4 — Dev workflow protocols

Copy all of `docs/dev/` unchanged or adapted:
```
ai-development-relay.md
agent-scope-boundaries.md
auto-management-protocol.md
claude-codex-interchangeability.md
context-budget-checklist.md
context-hygiene-protocol.md
closeout-sync-contract.md                 — includes State-Zero requirement section (v1.8)
model-routing-protocol.md
model-switching-protocol.md
notification-setup.md
package-boundary-closeout-protocol.md
raw-transcript-capture-protocol.md       — Type 1 file-first protocol (Operator Reliability Repair)
session-restart-protocol.md              — includes State-Zero rule section (v1.8)
state-zero-closeout-protocol.md          — NEW in v1.8 (copy as-is, adapt project name)
token-efficiency-protocol.md
tool-batching-protocol.md
tool-switching-protocol.md
worktree-and-parallel-session-policy.md
```

Edit only parts that name KeepMees-specific files (e.g. `BOOK_PAGINATION_VERSION`, `index.html`).

### Step 5 — QA + testing protocols

Copy all of `docs/qa/`:
```
manual-qa-template.md
pre-commit-verification-template.md
release-readiness-template.md
test-strategy.md
package-verification-template.md
```

Adapt test-strategy to the new repo's test runner.

### Step 6 — Scripts (core OS scripts)

Copy all of these from KeepMees unchanged:
```
scripts/start-router.mjs
scripts/state-freshness-check.mjs
scripts/os-self-audit.mjs
scripts/report-mirror-intake.mjs
scripts/raw-transcript-check.mjs
scripts/notification-check.mjs
scripts/project-control-sync-validate.mjs
scripts/project-control-sync-dry-run.mjs
scripts/external-sync-consistency-check.mjs
scripts/documentation-watch-check.mjs
scripts/bootstrap-copy-forward-audit.mjs
scripts/package.json                   — scripts-level dependencies (pixelmatch, pngjs if needed)
```

KeepMees-specific scripts (do NOT copy):
- `scripts/google-calendar-*.mjs` (only if you will use Google Calendar sync)
- `scripts/github-project-*.mjs` (only if you will use GitHub Projects sync)
- `scripts/e2e-regression-harness.mjs` (KeepMees-specific E2E harness)
- `scripts/visual-regression-harness.mjs` (KeepMees-specific VR harness)
- `scripts/capture-message-book-packet.mjs`
- `scripts/generate-project-calendar.mjs`

### Step 7 — AI System OS docs for validation

Copy unchanged:
```
docs/ai-system/documentation-watch-policy.md
docs/ai-system/documentation-watch-sources.md
docs/ai-system/documentation-watch-evaluation-template.md
docs/ai-system/documentation-watch-log.md      — start fresh (first entry: new repo bootstrap)
docs/ai-system/bootstrap-copy-forward-guide.md
docs/ai-system/universal-vs-project-specific-map.md
docs/ai-system/future-repo-bootstrap-checklist.md
docs/ai-system/os-self-audit-checklist.md
```

Adapt `documentation-watch-sources.md` to the new project's actual tooling.

### Step 8 — Additional skills and commands

Copy and adapt from KeepMees:
```
.claude/skills/package-start/SKILL.md
.claude/skills/switch-to-codex/SKILL.md
.claude/skills/switch-to-claude/SKILL.md
.claude/skills/weekly-sync/SKILL.md
.claude/skills/status-summary/SKILL.md
.claude/skills/os-audit/SKILL.md
.claude/skills/project-sync-dry-run/SKILL.md
.claude/skills/project-sync-apply/SKILL.md
.claude/skills/notification-setup-wizard/SKILL.md
.claude/skills/report-intake/SKILL.md
.claude/skills/raw-transcript-capture/SKILL.md
.claude/skills/documentation-watch/SKILL.md
.claude/skills/bootstrap-copy-forward/SKILL.md
.claude/skills/external-sync-consistency/SKILL.md
.claude/skills/README.md
+ matching .claude/commands/*.md wrappers
.claude/commands/README.md
```

### Step 9 — GitHub layer

Copy from KeepMees:
```
.github/PULL_REQUEST_TEMPLATE.md
```

Adapt the AI-agent + continuity sections to the new project. CI workflows are not part of the AI Project OS bootstrap.

### Step 10 — Gitignore protections

Start with the universal block (see `bootstrap-template.md` § 8 for the exact text). Add:
```
raw-transcripts/
local-reports/
local-report-intake/
local-sync-reports/
```

### Step 11 — Optional external sync layer

**GitHub Projects (default, required for Tower-style projects):**
Copy and adapt github-projects-* scripts, policies, and runbooks. Run Gate 1 dry-run before live apply.

**Google Calendar live sync (optional):**
Copy and adapt google-calendar-* scripts, policies, and runbooks. Run Gate 1 → 2 → 3 sequence.

**ClickUp / TickTick (optional):**
Copy templates only; no live API scripts committed.

### Step 12 — First commit

```
git add AGENTS.md CLAUDE.md AI_HANDOFF.md CURRENT_STATE.md NEXT_SESSION_PROMPT.md \
        .claude/ .codex/ docs/ai-system/ docs/dev/ docs/qa/ \
        scripts/start-router.mjs scripts/state-freshness-check.mjs \
        scripts/os-self-audit.mjs scripts/report-mirror-intake.mjs \
        scripts/raw-transcript-check.mjs scripts/notification-check.mjs \
        scripts/documentation-watch-check.mjs scripts/bootstrap-copy-forward-audit.mjs \
        scripts/project-control-sync-validate.mjs scripts/project-control-sync-dry-run.mjs \
        .github/PULL_REQUEST_TEMPLATE.md .gitignore
```

Commit message:
```
docs: bootstrap AI Project OS v1.8

- universal agent contract + Claude/Codex layers
- AI system docs (README, universal standards, bootstrap template, v1.8 reference, changelog)
- dev workflow protocols including State-Zero closeout protocol
- QA test strategy and package verification template
- OS validation scripts (start-router, state-freshness, os-self-audit, report-mirror, etc.)
- PR template + .gitignore protections
```

### Step 13 — Verification

Run in order:
```
node scripts/start-router.mjs                  # READY_FRESH_START expected
node scripts/state-freshness-check.mjs         # 0 FAILs expected
node scripts/os-self-audit.mjs                 # BOOTSTRAP COMPLETE expected
node scripts/documentation-watch-check.mjs     # 0 failures expected
node scripts/bootstrap-copy-forward-audit.mjs  # 0 failures expected
```

A fresh agent (Claude Code or Codex) must be able to read `AGENTS.md` → tool layer → `AI_HANDOFF.md` → `CURRENT_STATE.md` and state out loud what to do next.

---

## Key lessons from KeepMees → Puzzle copy-forward

1. **State-Zero was not enforced.** State docs pointed to merged sync branches after merge, causing Gate 0 housekeeping at every startup. The fix: update state docs to say `main` after merge, before ending the session.
2. **Post-Commit State Rule scope was too broad.** Agents used it to excuse wrong active branch (which is never cosmetic). The fix: add explicit State-Zero FAIL classification that cannot be waived.
3. **Start-router had a gap.** When handoff status was "complete", it skipped the NEEDS_STATE_SYNC check even if active branch was wrong. The fix: remove the `!handoffIsComplete` guard on branch mismatch.
4. **Bootstrap pack was stale.** The `v1_4_2` pack predated 6 major OS upgrade passes. The fix: this v1.8 pack.

See `docs/dev/state-zero-closeout-protocol.md` § "The recurring stale-doc failure mode" for the full post-mortem.
