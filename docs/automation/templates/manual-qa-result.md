# Manual QA Result

> Extended from `docs/qa/manual-qa-template.md` with KeepMees-specific fields.
> Required before commit for any UI or behavior change.
> Docs-only packages are exempt (document the waiver).

---

**Date:** `[YYYY-MM-DD]`
**Branch:** `[branch name]`
**Tested by:** `[human / Claude Code]`
**Task / Package:** `[link or short description]`
**Source:** `[Package or feature name]`
**Owner/stream:** `[Development / QA]`
**Status:** `[pass | pass-with-notes | fail | waived]`

---

## Environment

| Field | Value |
|---|---|
| Browser | |
| OS | |
| Screen size / device | |
| Any special setup | |

---

## QA waiver (if applicable)

> If manual QA is being waived, state the reason here. Docs-only packages and pure schema/template packages are valid waiver candidates.

**Waiver reason:** `[docs-only | no-behavior-change | explicitly-waived-by-coordinator | other]`

---

## Golden path

> The core scenario that must work.

| Step | Expected | Actual | Pass/Fail |
|---|---|---|---|
| 1. | | | |
| 2. | | | |
| 3. | | | |

---

## Edge cases

| Scenario | Expected | Actual | Pass/Fail |
|---|---|---|---|
| | | | |

---

## Regression checks

> Features adjacent to the change that must still work.

| Feature | Pass/Fail | Notes |
|---|---|---|
| iMessage chat.db import | | |
| Message Book composition and pagination | | |
| Editorial field validation | | |
| Product eligibility evaluation | | |

---

## KeepMees-specific checks

| Check | Pass/Fail | Notes |
|---|---|---|
| Scope-guarded constants unchanged (BOOK_PAGE_LINES etc.) | | |
| BOOK_PAGINATION_VERSION unchanged (or bumped correctly) | | |
| No standalone keepsake flow or Review view changes | | |
| Source intake not committed | | |
| No secrets or credentials in staged files | | |

---

## Screenshots / recordings

> Required for any UI change.

---

## Result

- [ ] **Pass** — ready for commit
- [ ] **Pass with notes** — notes below
- [ ] **Fail** — do not commit; details below
- [ ] **Waived** — reason documented above

**Notes:**

---

## Action requested

> What should Development or Coordinator do with this QA result?

---

## Routing targets

- [ ] Development (Chat 03) — review result and relay authorization
- [ ] Coordinator (Chat 01) — if fail or notes require decision

---

## Coordinator approval required?

- [ ] **Yes** — QA result requires Coordinator decision before proceeding
- [ ] **No** — proceed per standard protocol
