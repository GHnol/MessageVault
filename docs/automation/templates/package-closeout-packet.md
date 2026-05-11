# Package Closeout Packet

> Use this template after a package is committed and merged to main.
> Claude Code produces this packet. Coordinator reviews it.
> Protocol: `docs/automation/operator-mode/package-closeout-protocol.md`

---

**Package:** `[Package name — e.g. Package 2.5A]`
**Date:** `[YYYY-MM-DD]`
**Prepared by:** `[Claude Code / agent]`
**Source:** `[Branch name]`
**Owner/stream:** Development (Chat 03) → Claude Code
**Status:** `[complete | needs-coordinator-review]`

---

## Summary

> One paragraph. What did this package deliver and why does it matter?

---

## Commit record

| Item | Value |
|---|---|
| Feature branch | `[branch name]` |
| Feature commit | `[hash]` |
| Merge commit | `[hash]` |
| Final main HEAD | `[hash]` |
| Pushed to remote | yes / no |
| Working tree clean | yes / no |

---

## Files committed

| File | Change type | Notes |
|---|---|---|
| `[path]` | [new \| modified \| deleted] | |

*(list all committed files)*

---

## Decisions made or confirmed in this package

| Decision | Decision ID | Status |
|---|---|---|
| | | |

---

## Test results

| Suite | Count | Status |
|---|---|---|
| `km-engine-tests.mjs` | | [passing \| failing \| not-run] |
| `keepsake-group-tests.mjs` | | |
| `product-catalog-tests.mjs` | | |
| `product-eligibility-tests.mjs` | | |
| **Total** | | |

---

## Scope confirmation

> What was explicitly excluded from this package?

- Did not touch: `index.html`, `src/`, application code
- Did not touch: [other excluded items]
- Did not commit: `_source-intake/`, `.claude/settings.local.json`

---

## Risks surfaced

| Risk | Likelihood | Impact |
|---|---|---|
| | | |

---

## What remains (if anything)

- [Item 1 — carry-forward to next package or defer register]

---

## Action requested

> What should Coordinator or Development do next?

---

## Routing targets

- [ ] Coordinator (Chat 01) — review and authorize next package
- [ ] Development (Chat 03) — acknowledge closeout; prepare next package
- [ ] Other: ___

---

## Coordinator approval required?

- [x] **Yes** — Coordinator must authorize the next package before it begins

**Next package recommendation:** `[Package name or "awaiting Coordinator direction"]`
