# AI Project OS v1.7 — Zero-Fault Closeout Contract: Gate 1 Audit Plan

**Status:** GATE 1 COMPLETE (audit and planning only — no implementation)
**Branch:** `docs/ai-project-os-v1-7-zero-fault-audit`
**Date:** 2026-05-31 (audit basis: HEAD `96033b7`)
**Updated:** 2026-06-01
**Scope:** Audit only. No scripts, skills, commands, or OS protocol docs modified in Gate 1.

---

## 1. Repo Preflight Result

| Field | Value |
|---|---|
| Branch | `docs/ai-project-os-v1-7-zero-fault-audit` |
| HEAD at audit | `96033b7` — docs: sync state after Google Calendar sync-map advisory repair |
| Working tree | Clean |
| Active package | None |
| Package 5B | Not started — blocked |
| AI Project OS v1.6 | COMPLETE — Gate 3 live apply + advisory repair merged `db45e6a` 2026-06-01 |
| MISSING_LOCAL_MAPPING advisory | RESOLVED — post-repair dry-run: 488 events, 10 NO_OP, 0 MISSING_LOCAL_MAPPING |
| OS self-audit | 166 pass, 0 warn, 0 fail — BOOTSTRAP COMPLETE |

---

## 2. Files Inspected

All 43 files listed in the Gate 1 directive were read. Additionally:

- `scripts/*.mjs` — 22 script files inventoried
- `.claude/commands/*.md` — 18 command wrappers confirmed
- `.claude/skills/*/SKILL.md` — 16 skills confirmed
- `.claude/agents/README.md` — readiness placeholder only
- `.claude/settings.json` — DOES NOT EXIST (no repo-level settings committed)
- `scripts/package.json` — googleapis@^173.0.0 + playwright@^1.44.0 in scripts-local dependencies
- `scripts/e2e-regression-harness.mjs` — Playwright harness inspected for phase coverage

---

## 3. Validators Run

| Script | Result |
|---|---|
| `node scripts/os-self-audit.mjs` | 166 pass, 0 warn, 0 fail — BOOTSTRAP COMPLETE |
| `node scripts/project-control-sync-validate.mjs` | 11 pass, 0 warn, 0 fail — VALID |
| `node scripts/project-control-sync-dry-run.mjs` | STRUCTURAL CHECK PASSED — content freshness not checked by script |
| `node scripts/google-calendar-source-validate.mjs` | 151 pass, 0 warn, 0 fail — VALID |
| `node scripts/google-calendar-sync-dry-run.mjs --local-only` | 10 READY_FOR_LIVE_COMPARE — LOCAL VALIDATION PASSED |

All gitignore checks: PASS for all 7 required paths.

Hard-exclusion diff: CLEAN — no app/product/root package/script diffs.

---

## 4. Current OS Enforceability Map

### Automatic (enforced by git or tooling without human action)
- `.gitignore` protections — all sensitive files confirmed gitignored
- No committed pre-commit hooks (`.git/hooks/`) — none authorized yet

### Script-assisted (run on user demand; scripts are read-only)
- `scripts/os-self-audit.mjs` — 166 structural file/pattern checks
- `scripts/project-control-sync-validate.mjs` — Tower doc internal consistency
- `scripts/project-control-sync-dry-run.mjs` — structural file presence only; NOT content freshness
- `scripts/google-calendar-source-validate.mjs` — source record schema
- `scripts/google-calendar-sync-dry-run.mjs --local-only` — local payload generation

### Skill-routed (user invokes; Claude follows protocol)
- `/start` — session startup sequence
- `/closeout` — package closeout + internal sync check
- `/precommit` — pre-commit verification gate
- `/handoff` — state update on trigger phrases
- `/os-audit` — self-audit routing
- All 16 skills

### Approval-gated (requires explicit Coordinator authorization)
- Google Calendar apply (`scripts/google-calendar-sync-apply.mjs --apply`)
- GitHub Projects setup/import apply scripts
- Any live external mutation

### Policy-only (documented requirement; nothing technically prevents violation)
- Rolling `AI_HANDOFF.md` / `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` updates
- Package boundary closeout sequence
- Model routing (agent recommends; user confirms)
- Test runs before commit
- Git identity / remote verification before commit
- Session-start file reads
- Context hygiene decision (fresh vs continue)
- Tool switching handoff sequence
- State freshness maintenance for kanban-board.md, current-sprint.md
- Post-Commit State Rule application (prevent recursive sync commits)

### Manual (requires human decision)
- Model switching mechanics (Claude Code does not expose programmatic control to agent)
- `/clear`, `/compact`, `/context` invocation
- Fresh-session restart
- Tool switching (Claude ↔ Codex)
- Notification hook installation

### Backlog (documented intent; not installed)
- Pre-commit hooks (`.git/hooks/` or husky)
- CI workflows
- Claude hooks in `.claude/settings.json`
- `.codex/config.toml`
- Worktree automation scripts
- Subagent YAML

---

## 5. v1.7 Gap Report

### 5a. Closeout verification gaps

| Gap | Severity | Current enforcement |
|---|---|---|
| No script verifies state-file freshness (operational vs cosmetic) | HIGH | Policy-only |
| No script detects kanban-board.md / current-sprint.md staleness | HIGH | Policy-only |
| `project-control-sync-dry-run.mjs` is structural only — no content freshness | MEDIUM | Script-assisted (wrong scope) |
| No pre-commit hook fires — tests/checks can be silently skipped | HIGH | Policy-only |
| Closeout internal sync check is policy-driven; nothing blocks skipping it | MEDIUM | Policy-only |
| Git identity check before commit is policy-only | LOW | Policy-only |

**Currently detected staleness:** `kanban-board.md` (last updated 2026-05-26, missing v1.3–v1.6 Done items), `current-sprint.md` (Sprint 2026-05-B closed May 25, no new sprint opened), `backlog.md` (last updated 2026-05-17), `NEXT_SESSION_PROMPT.md` (HEAD pointer at `95d3594`, stale by 3 commits — cosmetic only, not operationally misleading).

**Classification per Post-Commit State Rule:**
- `kanban-board.md` staleness: **OPERATIONALLY MISLEADING** — agent reading it would think v1.3–v1.6 are not Done. Requires update (Gate 2 authorized sync or separate Coordinator-approved sync commit).
- `current-sprint.md` staleness: **OPERATIONALLY MISLEADING** — references a closed sprint from May 25 as if it were active. Requires update.
- `NEXT_SESSION_PROMPT.md` HEAD pointer: **COSMETIC** — all operational fields (branch `main`, no active package, Package 5B blocked) are correct. Does not require immediate fix.

### 5b. State freshness gaps

| Gap | Severity |
|---|---|
| No automated FAIL/WARN classification for state-file drift | HIGH |
| Post-Commit State Rule is documented but not machine-enforced | MEDIUM |
| No script distinguishes operational misdirection from cosmetic HEAD lag | HIGH |
| Source records and sync logs can drift without detection between calendar dry-runs | LOW (manual dry-run covers this on demand) |
| GitHub Project items vs source records: no automated consistency check | MEDIUM |

### 5c. Report mirroring gaps

| Gap | Severity |
|---|---|
| No mechanism to capture OS audit results into a persistent log file | MEDIUM |
| Google Calendar sync log is manually updated (no script-driven append on apply) | LOW (apply script does update it) |
| Session/chat output cannot be programmatically captured into repo | ARCHITECTURAL — not fixable |
| Local-sync-reports/ artifacts are gitignored and ephemeral | BY DESIGN |
| `--structured-output` format exists in dry-run script but no intake script to log it | MEDIUM |
| No per-gate audit trail in repo (only CHANGELOG entries) | MEDIUM |

### 5d. Context usage gaps

| Gap | Severity |
|---|---|
| `/start` always runs full sequence regardless of branch type or active package | LOW |
| No lightweight startup variant for audit-only or OS-only branches | LOW |
| No detection of whether current session is fresh vs stale | ARCHITECTURAL |
| No script advises on `/compact` vs `/clear` vs fresh session | ARCHITECTURAL |
| Context budget checklist is policy-only | LOW |

### 5e. Model/Plan Mode/opusplan routing gaps

| Gap | Severity |
|---|---|
| Model IDs in `model-routing-protocol.md` name specific models (Haiku 4.5, Sonnet 4.6, Opus 4.7) — will become stale as generations advance | MEDIUM |
| Opus 4.7 is referenced but current is Opus 4.8 | MINOR |
| "Plan Mode" has no formal definition or skill — references to `EnterPlanMode` tool are implicit | LOW |
| "opusplan" is undefined jargon — not a Claude Code feature | REJECT |
| Model switching is not programmatically exposed to the agent — "semi-automatic" is the ceiling | ARCHITECTURAL |
| No skill routes tasks through different model tiers automatically | BY DESIGN |

### 5f. Claude Code custom model settings gaps

| Gap | Severity |
|---|---|
| `.claude/settings.json` does not exist in repo — no project-level model default committed | VERIFIED CORRECT — do not commit without clear need |
| `notification-setup.md` covers hook setup but not model settings | LOW |
| Model ID references in docs will become stale | MEDIUM |
| No doc explains the difference between user-level settings and project-level `.claude/settings.json` | MEDIUM |

### 5g. Documentation-watch gaps

| Gap | Severity |
|---|---|
| No structured evaluation process for new Claude Code features | MEDIUM |
| No tracking of Claude Code release notes or Codex documentation changes | MEDIUM |
| Scrutinous adoption rule is documented but has no review cadence | MEDIUM |
| No sources defined for docs-watch | LOW |

### 5h. Notification gaps

| Gap | Severity |
|---|---|
| No verification step in `/notification-setup-wizard` to confirm hook fires | LOW |
| Event name uncertainty (Notification vs PermissionRequest) is documented but unresolved | LOW |
| Setup wizard requires user to test manually with no automated confirmation | LOW |

### 5i. External sync consistency gaps

| Gap | Severity |
|---|---|
| No script checks Google Calendar live events vs source records between dry-runs | LOW |
| No script checks GitHub Project live items vs source records (outside full setup dry-run) | MEDIUM |
| Google Calendar sync-map (`external-sync-map.local.json`) is gitignored and local-only — no cross-session verification possible | BY DESIGN |
| GitHub Projects `github-project-sync-status.mjs --live` exists but is not run routinely | LOW |

### 5j. Bootstrap Core copy-forward gaps

| Gap | Severity |
|---|---|
| v1.6 Google Calendar layer is not yet documented in `bootstrap-template.md` as a verified complete pattern | MEDIUM |
| Puzzle repo does not exist — no copy has been attempted | NOT URGENT |
| `version-history.md` v1.6.2 row status is stale ("In progress on branch...") | COSMETIC |
| `CHANGELOG.md` v1.6.2 entry header says "IN PROGRESS" | COSMETIC — was the live status at time of write |

---

## 6. Addendum A — State-Sync Commit Strategy

### Current problem

The v1.6 pass produced at minimum four commits to main after the Gate 3 apply: the Gate 3 fix commit (`95d3594`), a state-sync commit recording Gate 3 completion (`1d83026`), the advisory repair merge (`db45e6a`), and a state-sync commit after advisory repair (`96033b7`). `NEXT_SESSION_PROMPT.md` still shows `95d3594` as its HEAD pointer (stale by 3 commits).

This occurred because each implementation commit created a new HEAD that was cosmetically "stale" in state docs, triggering another state-sync commit, which then became stale itself.

### Proposed policy (v1.7 Gate 2 target)

**Decision matrix for state-sync commits:**

| Situation | Action |
|---|---|
| Branch-based work: implementation on feature branch → merge to main | Do NOT include state-sync in the implementation commit. After merge, create one state-sync commit on main that records the final merged HEAD and all operational status. |
| Direct-on-main docs-only work | One commit acceptable if state docs can be made accurate before the commit is created. |
| After a post-merge state-sync commit | STOP. Do not chase the state-sync commit's own HEAD with another state-sync. The next session verifies HEAD at preflight — that is the corrective control. |
| State-sync creates a cosmetic HEAD lag of 1 commit | SKIP. Apply Post-Commit State Rule. |
| State-sync is operationally misleading (wrong branch, wrong package, wrong next-action, stale blocker) | DO update. This is the only valid trigger for a follow-up sync commit. |

**Which fields are operationally important (always sync):**
- Active package status (in-progress / closed / blocked)
- Active branch name
- Next exact action pointer
- Hard exclusion list (if changed)
- Blocker status (if lifted or introduced)

**Which fields are cosmetic (do not trigger sync commit):**
- `main HEAD` hash lag of 1 commit
- Pre-commit phrasing ("after this commit lands")
- Timestamps that are a few hours stale
- Shareable status summary (sync weekly or on major phase change)

**Implementation target:** Add this decision matrix as a table in `docs/dev/closeout-sync-contract.md` in Gate 2. Reference from `universal-standards.md` Post-Commit State Rule section.

---

## 7. Addendum B — Playwright and Test Trustworthiness Audit

### Test baseline (as of v1.6 HEAD `96033b7`)

| Layer | Count | Runner | Last confirmed |
|---|---|---|---|
| Node unit tests | 1603 (1466 prior + 137 from Package 5A) | `node src/tests/*.mjs` | Package 5A merge |
| E2E seeded (Playwright) | 41 | `cd scripts && npm run e2e` | Package 5A merge |
| E2E real-files (Playwright) | 23 | `cd scripts && npm run e2e:real` | Package 5A merge |
| Capture harness | Multiple scenarios | `cd scripts && npm run capture:a/b/c/d` | As needed |

Note: `docs/qa/test-strategy.md` still says "Total: 1466 tests" — needs update to 1603 to reflect Package 5A.

### E2E harness phase coverage (seeded)

Phases 1–10 cover the primary add-messages, view, navigate, group, filter, and search flows. Phases 20+21 cover additional seeded flows. Phase 7 saves a snapshot; Phase 8 restores from it. Phase 13 downloads; Phase 14 uploads/restores.

### Test trustworthiness map

**Covered and reliable:**
- Core engine logic — unit tests (very strong; 1603 assertions across 10 suites)
- Product catalog and eligibility logic — unit tests
- Persistence / serialization / restore — unit tests + E2E seeded + E2E real-files
- Proof approval state transitions — unit tests (Package 5A added 137 tests for this state model)
- Message import, add, view — E2E seeded
- Save/restore cycle — E2E seeded + real-files
- File upload / download — E2E real-files
- Operator inbox processing — unit tests

**Covered but weak:**
- UI visual rendering — Playwright checks visibility and text content, not pixel fidelity
- Error handling paths — may not be asserted deterministically in all branches
- Multi-session persistence across browser close/reopen — coverage uncertain
- Keepsake group flows (Phase 15) — present but assertion depth unclear without full harness read

**Not covered (known gaps):**
- Visual regression / print layout (Package 3D scope — not authorized)
- Cross-browser (single Chromium only — by design)
- PDF/print fidelity (vendor-gated)
- Checkout / commerce flow (not built)
- Proof approval UI wiring (Package 5A added state model only; no UI wiring yet)
- CI integration (no CI workflows committed)
- Server PDF generation pipeline

**Requires manual review:**
- Message Book pagination visual output
- Preview packet quality and fidelity
- Font rendering, spacing, layout — only verifiable by human visual inspection

**Requires future regression tests (before or during Package 5B):**
- Proof approval state → UI surface wiring
- Any new UI surface added by Package 5B
- End-to-end proof approval flow from initial review through approval

### Pre-Package-5B test coverage matrix requirement

Before Package 5B begins any UI-touching work:

1. All 1603 unit tests green.
2. Both E2E harnesses green (41 seeded + 23 real-files = 64 total).
3. Any new product behavior in Package 5B must have corresponding Layer 1 tests before the code ships.
4. Any new UI surface in Package 5B must have E2E coverage.
5. `docs/qa/test-strategy.md` must be updated to 1603 before Gate 2.

### v1.7 QA hardening recommendation (Gate 2)

- Update `test-strategy.md` test count from 1466 to 1603.
- Add a row to the test layer matrix for "Proof approval state" (Layer 1 — covered, Package 5A).
- Add a coverage target table for Package 5B in `test-strategy.md`.
- No new test infrastructure needed for v1.7 — the existing layers are the right shape.

---

## 8. Proposed v1.7 Gate Structure

### Evaluation of recommended structure

The Coordinator-proposed 6-gate structure is appropriate. One adjustment: Gate 2 should also include the overdue kanban/sprint state sync and test-strategy doc update, since these are operationally misleading and quick to fix.

### Revised gate structure

| Gate | Name | Scope |
|---|---|---|
| Gate 1 | Zero-Fault OS Audit and Implementation Plan | THIS GATE — planning only, no implementation |
| Gate 2 | Closeout and State Freshness Validators + Overdue Syncs | New freshness validator script; state-sync decision matrix; stale kanban/sprint update; test-strategy.md count update; model-routing-protocol.md ID refresh |
| Gate 3 | Report Mirroring and Project-Control Log Intake | Structured OS audit log; intake pattern for script output; per-gate audit trail |
| Gate 4 | Start Router, Context Usage, and Model Routing Hardening | `/start` lightweight variant; context budget script aid; model routing doc stabilization |
| Gate 5 | External Sync Consistency Validators | Read-only Google Calendar consistency script; GitHub Projects consistency check |
| Gate 6 | Documentation-Watch, Bootstrap Copy-Forward, and Finalization | Docs-watch evaluation template; bootstrap-template.md v1.7 update; version-history cleanup |

---

## 9. Gate Detail Specifications

### Gate 2 — Closeout and State Freshness Validators + Overdue Syncs

**Objective:** Add the one missing validator (state freshness), formalize the state-sync decision matrix, clear operationally misleading stale state in kanban/sprint, and fix cosmetic doc issues.

**Files likely to change:**
- `scripts/state-freshness-check.mjs` — NEW script
- `docs/dev/closeout-sync-contract.md` — add state-sync decision matrix table
- `docs/project-control/kanban-board.md` — update Done column with v1.3–v1.6
- `docs/project-control/current-sprint.md` — close Sprint 2026-05-B, open v1.7 sprint
- `docs/qa/test-strategy.md` — update count from 1466 to 1603
- `docs/dev/model-routing-protocol.md` — refresh model ID references (note current models)
- `docs/ai-system/os-self-audit-checklist.md` — add freshness check row if needed
- `docs/ai-system/CHANGELOG.md` — Gate 2 entry
- `docs/ai-system/version-history.md` — v1.7 Gate 2 row
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — status update

**New script: `scripts/state-freshness-check.mjs`**
- Read `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`
- Compare active branch, active package, next-action against git state
- FAIL if: active branch no longer exists; package recorded as in-progress but no branch matches; next-action points to a superseded task
- WARN if: HEAD hash lags by 1 commit; timestamp is stale but operational fields are correct; "after this commit lands" language present
- PASS if: all operational fields would correctly route the next agent
- No external API calls. No writes.

**Dry-run first:** Run `state-freshness-check.mjs` in dry-run output mode before any edits.

**Approval boundaries:**
- New script: Coordinator reviews proposed FAIL/WARN logic before implementation
- Kanban/sprint updates: Coordinator approves proposed content before editing
- No external mutations

**Verification:**
- `node scripts/os-self-audit.mjs` — must still pass 166+ items
- `node scripts/state-freshness-check.mjs` — must pass for current repo state
- All other validators pass

**Expected commit message:**
```
docs: AI Project OS v1.7 Gate 2 — closeout validators and state freshness

- add scripts/state-freshness-check.mjs (operational vs cosmetic staleness)
- add state-sync decision matrix to closeout-sync-contract.md
- update kanban-board.md Done column with v1.3–v1.6 completions
- open Sprint 2026-06-A (v1.7) in current-sprint.md
- update test-strategy.md test count to 1603 (Package 5A)
- refresh model ID references in model-routing-protocol.md
```

---

### Gate 3 — Report Mirroring and Project-Control Log Intake

**Objective:** Add structured OS audit logging so audit results persist in the repo. Create an intake pattern for piping script output to committed log files.

**Files likely to change:**
- `scripts/os-self-audit-log-intake.mjs` — NEW (append structured audit result to log)
- `docs/ai-system/os-audit-log.md` — NEW (running log of audit results per pass)
- `docs/dev/closeout-sync-contract.md` — add report mirroring section
- `docs/ai-system/os-self-audit-checklist.md` — add log intake check
- `docs/ai-system/CHANGELOG.md`, `version-history.md` — Gate 3 entries

**Design constraint:** Session transcript cannot be captured automatically. Only script output can be piped and logged. Recommendation: keep log intake manual (agent pastes summary into intake script or runs script with flags); do not attempt to auto-capture chat history.

**Dry-run first:** Produce example log format before implementing script.

**Approval boundaries:** Coordinator reviews log format and intake script design before implementation.

**Expected commit message:**
```
docs: AI Project OS v1.7 Gate 3 — report mirroring and OS audit log

- add scripts/os-self-audit-log-intake.mjs
- add docs/ai-system/os-audit-log.md (running audit history)
- add report mirroring section to closeout-sync-contract.md
```

---

### Gate 4 — Start Router, Context Usage, and Model Routing Hardening

**Objective:** Add a lightweight `/start` variant for OS-only branches; stabilize model routing docs against model-ID churn; clarify Plan Mode.

**Files likely to change:**
- `.claude/skills/start/SKILL.md` — add lightweight variant (or add routing condition)
- `.claude/commands/start.md` — add routing note
- `docs/dev/model-routing-protocol.md` — add "verify model IDs against current Anthropic model list before using" note; switch to tier-first with IDs as examples
- `docs/dev/context-budget-checklist.md` — add branch-type routing step

**Design constraint:** Claude Code model switching is NOT programmatically exposed. Do not add fake automation. Keep routing semi-automatic (agent recommends, user confirms).

**Reject in this gate:**
- Automatic model switching scripts
- "opusplan" terminology
- Plan Mode as a separate skill (it is a tool built into Claude Code, not a skill)

**Approval boundaries:** Coordinator reviews start router logic before any skill edits.

**Expected commit message:**
```
docs: AI Project OS v1.7 Gate 4 — start router and model routing hardening

- add lightweight start variant for OS/docs-only branches
- stabilize model routing docs against model-ID generation churn
- clarify Plan Mode (built-in tool, not a skill)
```

---

### Gate 5 — External Sync Consistency Validators

**Objective:** Add read-only consistency checks for Google Calendar and GitHub Projects without mutating anything.

**Files likely to change:**
- `scripts/google-calendar-consistency-check.mjs` — NEW (read-only; requires live credentials; reports whether source records match live events by AI_OS_ID scan)
- `scripts/github-project-consistency-check.mjs` — NEW (read-only; requires gh CLI auth; reports whether source records match live project items)
- `docs/project-control/google-calendar-sync-runbook.md` — add post-Gate-3 consistency check step
- `docs/project-control/github-projects-import-runbook.md` — add post-setup consistency check step

**Design constraint:** Both scripts must be read-only, flag `--live` as required for API access, and never mutate external systems.

**Approval boundaries:** Coordinator authorizes any live API read (these scripts require credentials). Gate 5 may run in local-only structural mode without credentials — local mode checks JSON validity only.

**Expected commit message:**
```
docs: AI Project OS v1.7 Gate 5 — external sync consistency validators

- add scripts/google-calendar-consistency-check.mjs (read-only live check)
- add scripts/github-project-consistency-check.mjs (read-only live check)
- add consistency check steps to sync runbooks
```

---

### Gate 6 — Documentation-Watch, Bootstrap Copy-Forward, and Finalization

**Objective:** Define a structured docs-watch evaluation process; update bootstrap-template.md with v1.6/v1.7 elements; finalize version-history stale rows; produce v1.7 COMPLETE marker.

**Files likely to change:**
- `docs/dev/docs-watch-evaluation-template.md` — NEW (template for evaluating new Claude Code / Codex features)
- `docs/ai-system/bootstrap-template.md` — update § 6 with v1.7 elements; verify v1.6 Google Calendar section is complete
- `docs/ai-system/version-history.md` — fix v1.6.2 stale "In progress" status; add v1.7.x rows
- `docs/ai-system/CHANGELOG.md` — Gate 6 / v1.7 COMPLETE entry
- `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` — v1.7 COMPLETE

**Docs-watch evaluation template (proposed structure):**
- Feature name and source (e.g. Claude Code changelog, Anthropic API docs)
- What it claims to do
- Does it improve: reliability / automation / safety / efficiency / product outcomes?
- Is it mature enough to adopt? (check: stable API, not in beta, has documentation)
- Complexity vs gain ratio
- Classification: ADOPT / DEFER / REJECT / MONITOR
- Adoption path if ADOPT (which gate, which files)

**No web browsing authorized in Gate 1.** Sources to evaluate in Gate 6: Claude Code changelog (local `CLAUDE.md` / release notes), Codex documentation, Anthropic API docs changes. Coordinator must explicitly authorize any web browsing session.

**Expected commit message:**
```
docs: AI Project OS v1.7 Gate 6 — docs-watch template and bootstrap finalization

- add docs/dev/docs-watch-evaluation-template.md
- update bootstrap-template.md for v1.6/v1.7
- fix version-history stale rows
- v1.7 COMPLETE
```

---

## 10. What Should NOT Be Implemented in v1.7

| Item | Reason |
|---|---|
| Automatic model switching | Not exposed by Claude Code API to the agent; claiming it would be fake |
| "opusplan" routing | Not a real Claude Code feature; undefined jargon |
| Automatic session compaction | User-invoked by design; agent can only recommend |
| Automatic report capture from chat/session | Chat history is not accessible to scripts; architectural constraint |
| Live hooks in `.claude/settings.json` committed to repo | User-level config; cross-platform incompatibility; each contributor installs their own |
| Subagent YAML in `.claude/agents/` | Format not verified for this runtime version; backlog item |
| n8n / Make / Zapier workflows | Future phase; not needed now |
| CI workflows (`.github/workflows/`) | Not authorized; tests run locally |
| Automatic GitHub Issues creation on closeout | Violates core rule: no external mutations without approval |
| Automatic calendar event creation on sprint change | Violates dry-run/apply policy |
| Worktree automation scripts | Not needed at current cadence |

---

## 11. What Should Be Deferred (Beyond v1.7)

| Item | Reason |
|---|---|
| Visual regression tests | Package 3D scope; vendor-gated; not authorized |
| CI integration | Not authorized; no dependency identified |
| Cross-browser E2E | Single Chromium intentional today |
| Print/PDF verification scripts | Vendor-gated |
| Puzzle repo bootstrap | No Puzzle repo exists yet |
| ClickUp live API sync | Not prioritized; GitHub Projects is default |
| TickTick live API sync | Low priority; manual import sufficient |
| `.codex/config.toml` | Schema not verified for current Codex version |
| Server PDF pipeline | Future phase; not authorized |

---

## 12. What Should Be Rejected as Hype, Bloat, or Unsafe

| Item | Classification | Reason |
|---|---|---|
| opusplan | REJECT — jargon | Not a Claude Code concept; no technical meaning |
| Automatic model escalation hooks | REJECT — hype | Not implementable; would require harness changes |
| MCP server integration for project state | REJECT — bloat | Adds external dependency; current file-based approach is reliable and auditable |
| Subagent orchestration for routine closeout | REJECT — complexity | Adds indirection without reliability gain; policy-driven closeout is sufficient |
| LLM-powered freshness detection | REJECT — hype | Expensive, non-deterministic; script-based checks are better |
| Auto-compaction triggers based on token estimates | REJECT — unreliable | Agent does not have accurate token count access; policy recommendation is sufficient |
| Scheduled external automations (GitHub Actions) | REJECT — not authorized | No CI/CD authorized; all external mutations require Coordinator approval |

---

## 13. Package 5B Status

**BLOCKED — remains blocked until v1.7 is complete and Coordinator explicitly authorizes product work.**

No product implementation, no UI work, no app code, no `index.html` or `src/**` changes are authorized during v1.7.

---

## 14. MISSING_LOCAL_MAPPING Advisory Status

**RESOLVED.** Sync-map read path advisory repair was completed and merged (`db45e6a` 2026-06-01). Post-repair live dry-run confirmed: 488 events fetched, 10 source records, 10 NO_OP, 0 MISSING_LOCAL_MAPPING, 0 blockers. No further action needed on this advisory.

---

## 15. Recommended Next Action

**Coordinator reviews this Gate 1 report, then authorizes v1.7 Gate 2.**

Specific items for Coordinator review:
1. Confirm the 6-gate structure (with the addition of overdue kanban/sprint sync to Gate 2).
2. Approve the `state-freshness-check.mjs` FAIL/WARN logic as proposed.
3. Confirm that `kanban-board.md` and `current-sprint.md` stale state should be corrected in Gate 2 (not deferred).
4. Confirm that `test-strategy.md` count update (1466 → 1603) is in scope for Gate 2.
5. Confirm rejection of opusplan, automatic model switching, and committed hooks.
6. Any items the Coordinator wants to reclassify (IMPLEMENT NOW ↔ LATER ↔ REJECT).

Once the Coordinator approves, create a dedicated v1.7 Gate 2 branch and begin implementation.

---

## 16. Recommended Commit Message

```
docs: plan AI Project OS v1.7 zero-fault hardening

- audit closeout, state freshness, report mirroring, context, model routing, and external sync enforcement gaps
- classify v1.7 features by reliability value, complexity, and enforcement level
- define 6-gate implementation structure for validators, report intake, routing, docs-watch, and bootstrap finalization
- identify stale kanban/sprint state as operationally misleading (Gate 2 target)
- add state-sync commit decision matrix and Playwright test trustworthiness map
- keep Package 5B blocked until OS foundation hardening is complete
```
