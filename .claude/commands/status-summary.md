Generate the KeepMees project status summary in two versions: internal and shareable.

Read:
1. `CURRENT_STATE.md`
2. `docs/project-control/master-schedule.md`
3. `docs/project-control/shareable-status-summary.md`

Then output both versions:

---

**INTERNAL VERSION** (Coordinator / project work — not for external sharing)

- Current phase and active package
- What is complete (with package numbers)
- What is in progress
- What is next (authorized or pending authorization)
- What is blocked and by what gate
- Decisions pending from the Coordinator
- Key risks
- Test baseline (Node tests / E2E)

---

**SHAREABLE VERSION** (safe for business groups, advisors, external stakeholders)

- One paragraph summary, public-safe, no internal technical debt
- Current phase label (not raw package numbers)
- What is working and has been validated
- What is in active development
- What comes next at a high level
- What decisions are upcoming (no internal detail)
- No unconfirmed commitments, no vendor names if confidential, no pricing/manufacturing detail

---

Ask before updating `docs/project-control/shareable-status-summary.md` — only write it if the Coordinator confirms the summaries are accurate.
