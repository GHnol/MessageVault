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

| Tier | Purpose | Examples (today) |
|---|---|---|
| **Light** | Mechanical edits, summaries, classification, checklist generation, small cleanup | Claude Haiku 4.5 |
| **Default** | Normal coding, debugging, tests, docs, implementation | Claude Sonnet 4.6 |
| **Strongest** | Architecture, complex debugging, risky changes, deep review, product/system planning, failed-repeated attempts, final audits | Claude Opus 4.7 |

Model IDs change over time. Tier intent does not.

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

## What this protocol does NOT do

- It does not switch models automatically. The harness exposes manual switching; this protocol guides the manual choice.
- It does not override the user's explicit model preference for a session.
- It does not promise a specific model is in use — model IDs may drift. The tier is the contract; the model is the implementation.

See `model-switching-protocol.md` for the mechanics of switching, `context-hygiene-protocol.md` for when to compact/clear before switching, and `auto-management-protocol.md` for how routing fits the broader auto-management duties.
