# Model Routing Protocol

**Applies to:** Claude Code in this repository (and any agent with a choice of model)
**Status:** Active — required operating protocol
**Distinct from:** `model-switching-protocol.md` (which covers the act of switching mid-session). This doc covers *which model to pick for which task*.

---

## Why routing matters

Picking the wrong model is the most common avoidable cost in this repo:

- Strongest model on a mechanical edit burns tokens without lifting quality.
- Light model on architecture or a risky change produces confident-but-shallow output.
- High thinking on a one-line fix is waste; default thinking on a deep audit is undersized.

Routing is semi-automatic: the agent recommends, the user confirms when the choice is costly.

---

## Tier definitions (model-agnostic)

The repo uses three tiers, named by capability rather than by specific model so the routing remains stable across model generations:

| Tier | Purpose | Examples (current as of 2026-06-01) |
|---|---|---|
| **Light** | Mechanical edits, summaries, classification, checklist generation, small doc cleanup, low-risk report formatting | Claude Haiku 4.5 |
| **Default** | Normal implementation, test fixes, script changes, doc and OS workflow implementation, normal debugging, most package work | Claude Sonnet 4.6 |
| **Strongest** | Architecture, complex debugging, high-risk validators, external sync logic, final audits, repeated failures, broad planning, irreversible or hard-to-rollback changes, product decisions with structural consequences | Claude Opus 4.8 |

**Model ID rule:** the "Examples" column lists currently known IDs but will become stale as generations advance. Always verify the current model list against `CLAUDE.md` § Environment or the Anthropic model documentation before treating a specific ID as mandatory. The tier intent is the durable contract; the model ID is the current implementation of that tier.

**Do not use Strongest tier for routine mechanical edits, doc syncs, or summary work** — it burns tokens without improving quality. Reserve it for the conditions in the Strongest row above.

---

## Routing matrix

| Task type | Default tier | Notes |
|---|---|---|
| Single-file mechanical rename / typo / formatting fix | Light | If the rename touches scope-guarded constants, escalate to Strongest |
| Status-sync doc edits, command-center updates | Light | Mechanical; deterministic |
| Closeout report generation from a known template | Light or Default | Light if template is followed literally; Default if synthesis is needed |
| Standard feature implementation in `src/products/` (e.g. a new resolver) | Default | Strongest if the spec involves cross-layer semantics |
| New Node test suite for an existing module | Default | Light if just adding parallel assertions to an existing pattern |
| E2E harness phase addition | Default | Strongest if reliability/timing is involved |
| Bug investigation when the cause is unknown | Default first; Strongest if 2+ failed attempts | Update handoff before tier change |
| Architecture or ADR work | Strongest | Always |
| Editing scope-guarded constants (`BOOK_PAGE_LINES` etc.) | Strongest | Always |
| Migration of pagination/persistence/serialization | Strongest | Always |
| Final pre-commit audit on a non-trivial change | Strongest | Worth the cost |
| Final pre-merge review | Strongest | Worth the cost |
| Routine git status / git log read-only operations | Light | No model debate needed |
| Project Control Tower passes / OS upgrade passes | Strongest | Always |
| Coordinator-weekly-sync write-ups | Default | Light if no decisions changed |

---

## High thinking

Reserve "high thinking" (extended reasoning) for:

- Hard reasoning under ambiguity
- Architecture and cross-cutting design
- Risky changes (locked constants, persistence, pagination)
- Final audits before merge
- Any task that has failed twice

Do **not** turn on high thinking for routine mechanical edits, doc syncs, or summary work — it wastes budget without lifting quality.

---

## Decision flow before changing tier

Before switching tier in a live session:

1. Why is the switch needed? State the trigger out loud.
2. Is this an in-session switch, or should the session be checkpointed and restarted in the new tier?
3. Update all three continuity files if the session is long.
4. Run `git status` and `git log --oneline -10`.
5. Recommend the cheaper / safer of two roughly equivalent paths.

Costly switches always pass through the user for confirmation. "Costly" means: a long session, a large uncached transcript, or a mid-flight implementation that needs to preserve in-context state.

---

## Cost-aware patterns

Patterns that should be the default unless context says otherwise:

- **Two-pass route:** explore + draft on Default tier; final review on Strongest. Cheaper than running both on Strongest.
- **Light-tier first triage:** for unknown bugs that might be 1-line typos, run a Light triage pass before reaching for Strongest.
- **Strongest tier from the start:** when the task is explicitly architecture/risky/locked-constant adjacent.
- **Same-tier compaction:** prefer `/compact` over model switch when the same tier still fits the task.

---

## Routing across tool boundaries

Claude / Codex / future agents may have different tiers. When the active tool exposes fewer tiers, route by the tier *intent*:

- Codex on a complex debug → still use the strongest Codex option available
- Future agent on a mechanical edit → use the light option even if names differ

The tier intent (in the routing matrix) is portable; the model IDs are not.

---

## Plan Mode and opusplan

**Plan Mode** (`EnterPlanMode` tool) is a Claude Code built-in, not a separate skill. It is useful when:
- Planning architecture or complex multi-file work before editing
- Working in unfamiliar code where consequences are hard to assess
- Evaluating risky changes before committing to an approach
- Broad refactors spanning many files

It is **not** needed for:
- Tiny mechanical edits with clear scope
- Single-file fixes where the action is obvious
- Routine doc updates that follow a known template

**"opusplan"** is not a Claude Code concept or feature. Do not use this term. Do not invent routing logic around it.

If switching into Plan Mode or Strongest tier in a long active session: update `AI_HANDOFF.md`, `CURRENT_STATE.md`, and `NEXT_SESSION_PROMPT.md` first if meaningful work is in progress. If context is bloated, prefer compact or fresh restart before switching to a heavier model.

Model switching is **semi-automatic**: the agent recommends the tier and the switch rationale; the user confirms when the switch is costly (long session, large uncached context, mid-flight implementation).

Do not claim automatic model switching — the harness does not expose programmatic model control to the agent.

---

## Custom model settings

- Project-level `.claude/settings.json` with a model key is **not** committed in this repo — no proof it is safe or stable across Claude Code versions and contributor setups.
- User-level model preference is set by the user in their own config, not by the agent.
- The agent recommends a tier; the user selects the specific model within that tier.
- Custom model settings may vary by account, plan, and Claude Code version. Do not hard-code fragile model IDs as universal project law — use tiers for durable policy.
- `.claude/settings.local.json` remains local and gitignored (never commit it).
- Do not commit `.claude/settings.json` unless the setting is shared, safe, non-secret, and explicitly approved by the Coordinator.

---

## Scrutinous adoption rule

Do not adopt Claude/Codex features, Plan Mode patterns, hooks, subagents, MCP servers, extended thinking, batch APIs, or automation patterns merely because they are new or sound advanced.

Only adopt if they materially improve one or more of:
- **Reliability** — fewer failures, better recovery
- **Automation** — less manual toil for repeatable work
- **Safety** — fewer ways to make irreversible mistakes
- **Efficiency** — measurable token or time savings
- **Product outcomes** — directly benefits KeepMees or future repos

**Reject, defer, or monitor** if the feature is:
- Semantic sugar with no reliability or automation gain
- Redundant with an existing pattern that already works
- Hype-driven or immature (beta, undocumented, unstable API)
- Too complex for the gain (adds maintenance burden without proportional value)
- Not compatible with the AI Project OS enforcement model
- Not enforceable enough to justify the maintenance cost
- Not materially helpful for KeepMees, Puzzle, or future repos

When in doubt: document the feature in the backlog as MONITOR, and revisit when it has a stable track record.

## What this protocol does NOT do

- It does not switch models automatically. The harness exposes manual switching; this protocol guides the manual choice.
- It does not override the user's explicit model preference for a session.
- It does not promise a specific model is in use — model IDs may drift. The tier is the contract; the model is the current implementation of that tier.
- It does not add "opusplan" routing — that term has no technical meaning in this repo.
- It does not claim context usage can be automatically inspected. Token counts are user-observed or reported by Claude Code UI; the agent cannot programmatically query them.

See `model-switching-protocol.md` for the mechanics of switching, `context-hygiene-protocol.md` for when to compact/clear before switching, `auto-management-protocol.md` for how routing fits the broader auto-management duties, and `scripts/start-router.mjs` for the session startup routing recommendation tool.
