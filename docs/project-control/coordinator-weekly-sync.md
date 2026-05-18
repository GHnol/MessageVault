# Coordinator Weekly Sync (PLACEHOLDER)

**Status:** Placeholder for a recurring Coordinator ritual. Not yet an active process. Activated only when the Project Control Tower pass is authorized.

---

## Intent

A short, repeatable weekly pass where the Coordinator reconciles plan vs. reality from durable repo state — not from chat memory.

---

## Proposed weekly checklist (when active)

1. Read `CURRENT_STATE.md` and `docs/command-center/current-status.md`
2. Confirm last closed package and main HEAD against `git log --oneline`
3. Review `docs/command-center/next-actions.md` — still accurate?
4. Review `docs/ops/risk-register.md` — any new or escalated risk?
5. Review gate table — any gate cleared or newly blocked?
6. Decide the next authorized package (or confirm hold)
7. Update `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` pointers
8. Record decisions in `docs/ops/decision-register.md` if any were made

---

## Weekly log

| Week (ISO date) | main HEAD | Last closed package | Next authorized | Notes |
|---|---|---|---|---|
| _(first real entry added when this ritual is activated)_ | | | | |

---

## Not active yet

This ritual does not run until the Coordinator authorizes the Project Control Tower pass. Until then, package authorization continues through the existing operator-mode flow.
