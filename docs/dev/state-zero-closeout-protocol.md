# State-Zero Closeout Protocol

**Status:** ACTIVE (introduced in AI Project OS v1.8 — State-Zero Bootstrap Finalization, 2026-06-03)
**Applies to:** Claude Code and Codex in this repository and any future repo bootstrapped from this OS
**Companion to:** `docs/dev/closeout-sync-contract.md`, `docs/ai-system/universal-standards.md` § "Post-Commit State Rule"

---

## What State-Zero means

**State-Zero** is the condition where, at every clean stopping point (after a merge, after a state-sync push, before any package boundary), the operational state docs are fully aligned with the actual repo state:

| Field | State-Zero requirement |
|---|---|
| Active branch in `AI_HANDOFF.md` | Matches `git branch --show-current` exactly |
| Active branch in `CURRENT_STATE.md` | Matches `git branch --show-current` exactly |
| Active branch in `NEXT_SESSION_PROMPT.md` | Matches `git branch --show-current` exactly |
| Active package/pass | `None` when no package is actively being implemented |
| Next action | Points to Coordinator decision, not a closed branch or completed pass |
| State freshness FAILs | Zero — `node scripts/state-freshness-check.mjs` exits 0 |
| Start-router | Does not return `NEEDS_STATE_SYNC` due to stale operational fields |

State-Zero is **not** the same as zero hash lag. Historical hash references in narrative sections, CHANGELOG entries, and completed-package tables are WARN (cosmetic). State-Zero applies only to the **operational routing fields** that determine which branch, package, and next action the next agent will use.

---

## When State-Zero is required

State-Zero must be achieved **before**:

- Any final push to `main`
- Any final merge to `main`
- Any closeout report that proposes a commit or merge
- Any tool or model switch
- Any session end when another session will continue the same work

State-Zero must be verified by running:

```
node scripts/state-freshness-check.mjs
node scripts/start-router.mjs
```

Both must report 0 FAILs. If either reports a FAIL on any operational field (branch, package, next action, or current HEAD), **fix before pushing or closing out**.

---

## What is a FAIL (never cosmetic)

The following are always FAIL conditions. They cannot be dismissed as cosmetic, and they cannot be excused by the Post-Commit State Rule:

| Condition | Why it is FAIL, not cosmetic |
|---|---|
| Active branch field ≠ `git branch --show-current` | The next agent resumes on the wrong branch |
| Active branch references a `docs/sync-*` or `feature/*` branch while on `main` | Post-merge stale state: the sync branch has been merged; pointing to it misdirects the next agent |
| Active package/pass non-none when no package is running | The next agent may start unauthorized work in the named package's context |
| Next action points to a completed branch or closed package | The next agent starts by trying to resume dead work |
| State doc says "in progress" / "pending merge" for a merge that already happened | The next agent believes a merge still needs to happen and may try to redo it |
| State doc says "pending push" for a push that already happened | Same misdirection risk |
| `state-freshness-check.mjs` returns any FAIL on operational fields | Any FAIL from the validator is operational; none are cosmetic |

---

## What is WARN only (Post-Commit State Rule applies)

The Post-Commit State Rule (`docs/ai-system/universal-standards.md` § "Post-Commit State Rule") prevents recursive state-sync commit chains. Under this rule:

| Condition | Classification |
|---|---|
| Historical hash references in narrative sections | WARN — cosmetic |
| Historical hash references in completed-package tables | WARN — cosmetic |
| Commit hash lag of one commit in `main HEAD` or branch HEAD fields, when branch/package/next-action are correct | WARN — cosmetic |
| CHANGELOG entries with "IN PROGRESS" status for completed-but-archived passes | WARN — cosmetic |
| Timestamp is a few hours stale; all operational fields accurate | WARN — cosmetic |
| Old `version-history.md` entries with stale branch status for merged branches | WARN — cosmetic |

**Important limitation:** The Post-Commit State Rule does NOT apply to wrong active branch, wrong active package, or wrong next action. Those are operational fields, not hash lag. The Post-Commit State Rule only prevents chasing the "latest hash" in a state doc that is already operational correct.

---

## The recurring stale-doc failure mode

The following failure mode caused Gate 0 housekeeping before Package 3G planning (2026-06-03) and is the specific problem this protocol addresses:

1. A state-sync branch (e.g. `docs/sync-after-package-3f-product-draft-lifecycle`) correctly updates state docs to point to itself as the active branch.
2. The state-sync branch is merged to `main`.
3. After merge, the state docs still say "active branch: `docs/sync-after-package-3f-product-draft-lifecycle`".
4. The next session starts, runs `/start`, and finds state docs pointing to a merged-and-deleted branch.
5. Gate 0 housekeeping is required before normal work can begin.

This is unacceptable. The fix is a two-part obligation:

**Part 1 — during state-sync:** After a merge to `main`, the state-sync branch must be updated to say "active branch: `main`" before the push. This must happen before the closeout is considered complete.

**Part 2 — at startup:** `start-router.mjs` must detect when state docs point to a non-main branch while on `main`, and return `NEEDS_STATE_SYNC` (a hard block) rather than allowing the session to proceed. This must happen regardless of whether the handoff status is "complete."

---

## State-Zero closeout checklist

Before proposing any final commit or merge:

1. **Run:** `node scripts/state-freshness-check.mjs` — must report 0 FAILs
2. **Run:** `node scripts/start-router.mjs` — must not return `NEEDS_STATE_SYNC` or any BLOCKED verdict
3. **Verify:** `AI_HANDOFF.md` active branch matches `git branch --show-current`
4. **Verify:** `CURRENT_STATE.md` active branch matches `git branch --show-current`
5. **Verify:** `NEXT_SESSION_PROMPT.md` Branch field matches `git branch --show-current` (or the target branch after merge)
6. **Verify:** Active package/pass is `None` if no package is running
7. **Verify:** Next action says "Coordinator decides" or the actual next action — not a reference to a closed branch

If any of these fail, update the state docs before committing.

---

## Post-merge obligation

After any merge to `main`:

1. Switch to `main` (`git checkout main && git pull --ff-only`)
2. Update the three state docs to say "active branch: `main`", "active package: None", "next action: Coordinator decision"
3. Run `node scripts/state-freshness-check.mjs` — must report 0 FAILs
4. Run `node scripts/start-router.mjs` — must return `READY_FRESH_START` or `NEEDS_COORDINATOR_DECISION` (not `NEEDS_STATE_SYNC`)
5. If a state-sync commit is needed (because the state docs would misdirect), create one on a brief `docs/fix-active-branch-*` branch and merge it — then verify again

This obligation is mandatory. It is not cosmetic. It is not covered by the Post-Commit State Rule (which only prevents hash-lag chasing, not branch-field correction).

---

## Relationship to other protocols

| Protocol | Relationship |
|---|---|
| `docs/ai-system/universal-standards.md` § Post-Commit State Rule | State-Zero and the Post-Commit State Rule co-exist. PCSR applies to hash lag; State-Zero applies to operational fields. Neither overrides the other. |
| `docs/dev/closeout-sync-contract.md` § State-Sync Decision Matrix | State-Zero adds a blocking layer on top of the FAIL classification. State-freshness FAILs are not just to "fix before commit" — they must be fixed before any push or session close. |
| `docs/dev/session-restart-protocol.md` | Step 8 (start-router) must return `READY_FRESH_START` or `READY_CONTINUE`, not `NEEDS_STATE_SYNC`. If it returns `NEEDS_STATE_SYNC`, that is a hard stop — run the State-Zero checklist before proceeding. |
| `scripts/state-freshness-check.mjs` | The canonical validator for State-Zero compliance. 0 FAILs = State-Zero on operational fields. |
| `scripts/start-router.mjs` | The routing guard. Must not return `NEEDS_STATE_SYNC` when it should return `BLOCKED_WRONG_BRANCH` or `NEEDS_STATE_SYNC` for wrong active branch fields. |

---

## Backed by

`docs/dev/closeout-sync-contract.md` — full closeout contract  
`docs/ai-system/universal-standards.md` — Post-Commit State Rule (co-exists, does not override)  
`scripts/state-freshness-check.mjs` — canonical State-Zero validator  
`scripts/start-router.mjs` — routing guard
