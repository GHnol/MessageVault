# Development Review Packet

> Use when sending completed work back to Development (Chat 03 / ChatGPT) for review.
> Extended from `docs/dev/development-review-packet-template.md` with KeepMees-specific fields.
> Protocol: `docs/automation/operator-mode/package-closeout-protocol.md`

---

**Branch:** `[branch name]`
**Date:** `[YYYY-MM-DD]`
**Prepared by:** `[Claude Code / agent / human]`
**Task:** `[One-sentence description of what was built]`
**Source:** `[Package name or task reference]`
**Owner/stream:** Development (Chat 03) → Claude Code
**Status:** `[needs-development-review | needs-coordinator-decision | complete]`

---

## Summary

> Concise description of what was done and why it matters.

---

## What was done

- [Change 1]
- [Change 2]

---

## What was NOT done (and why)

> Explicitly out-of-scope items, deferred work, or items noted but not acted on.

- Did not implement: [item] — reason: [out of scope / gated / deferred]

---

## Files changed

| File | Change type | Notes |
|---|---|---|
| `[path]` | [new \| modified \| deleted] | |

---

## Tests

| Test suite | Count | Status | Notes |
|---|---|---|---|
| `km-engine-tests.mjs` | | [passing \| failing \| not-run] | |
| `keepsake-group-tests.mjs` | | | |
| `product-catalog-tests.mjs` | | | |
| `product-eligibility-tests.mjs` | | | |

---

## Manual QA

| Scenario | Result | Notes |
|---|---|---|
| | | |

> Full QA record: `docs/qa/manual-qa-template.md` (or link to filled copy)
> QA required: [yes / no — reason if no]

---

## Scope confirmation

- [ ] No app code changed (docs-only package)
- [ ] `_source-intake/` not committed
- [ ] `.claude/settings.local.json` not committed
- [ ] Scope-guarded constants not touched (BOOK_PAGE_LINES, BOOK_PAGINATION_VERSION, etc.)
- [ ] Locked decisions not silently overridden

---

## Assumptions made

> Decisions made without explicit instruction, and reasoning.

- [Assumption + reasoning]

---

## Decisions

| Decision | Decision ID | Status |
|---|---|---|
| | | |

---

## Risks

- [Risk 1]

---

## Action requested

> What does Development need to do with this review packet?

---

## Routing targets

- [ ] Development (Chat 03) — review and relay Coordinator approval
- [ ] Coordinator (Chat 01) — final authorization
- [ ] Other: ___

---

## Open questions for Development

1. [Question requiring Development or Coordinator decision]

---

## Suggested commit message

```
[type]: [short description]

[body if needed]
```

---

## Coordinator approval required?

- [ ] **Yes** — Coordinator must approve before commit/push/merge
- [ ] **No** — Development stream authorized to proceed

---

## Ready for merge?

- [ ] Tests pass (or explicitly waived — reason: )
- [ ] Manual QA complete (or explicitly waived — reason: )
- [ ] Scope confirmed narrow
- [ ] `AI_HANDOFF.md` updated (if work continues) or cleared (if complete)
- [ ] No uncommitted work on branch
