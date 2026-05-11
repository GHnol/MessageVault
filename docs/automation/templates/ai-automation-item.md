# AI Automation Item

> Use this template to capture a new automation candidate for `docs/ops/ai-automation-register.md`.
> Schema: `docs/automation/schemas/automation-register-item.schema.json`
> Routing: route through Coordinator if the automation touches Coordinator-owned decisions or streams.

---

**Item ID:** `AUTO-[NNN]`
**Date:** `[YYYY-MM-DD]`
**Name:** `[Human-readable automation name]`
**Category:** `[workflow-blueprint | tool-research | agent-prompt | automation-build | case-study | business-idea | product-ai-feature]`
**Source:** `[Stream or AI Mastery hub that produced this item]`
**Owner/stream:** `[AI Mastery | Coordinator | Development | Product]`
**Status:** `[proposed | in-progress | active | deferred | gated | rejected | needs-coordinator-decision]`
**Maturity level:** `[idea | candidate | designed | manual-v1 | prototype | active | optimized | parked | rejected | deprecated]`

---

## Description

> What does this automation do? What manual work does it replace or reduce?

---

## Method

> How is this automation implemented?
> `[Claude Code | n8n | Manual (one-paste-to-Claude) | NotebookLM | GitHub Actions | Make | Zapier | Other]`

---

## Prioritization (1–5, higher = more important)

| Axis | Score | Notes |
|---|---|---|
| Repeated often | | |
| Time consuming | | |
| High value | | |
| Low risk | | |
| Easy to test | | |
| Connected to KeepMees / development / AI Mastery | | |

---

## Privacy notes

> Does this automation handle message content or private user data? If so, note constraints.

`[e.g. Does not touch message content. OR: Client-side only; no server upload of message data.]`

---

## Activate when

> What condition triggers activation of this automation?

`[e.g. Coordinator approves NotebookLM as project tool. OR: Repeated 3+ times per session.]`

---

## Decisions

| Decision | Status |
|---|---|
| | |

---

## Risks

- [Risk 1]

---

## Action requested

> What needs to happen for this automation to move forward?

---

## Routing targets

- [ ] Coordinator (Chat 01) — approve for adoption
- [ ] AI Mastery — develop workflow blueprint
- [ ] Development (Chat 03) — implement via Claude Code
- [ ] Other: ___

---

## Coordinator approval required?

- [ ] **Yes** — This automation requires Coordinator decision before activation
- [ ] **No** — Activate when gate condition is met

**Approval status:** `[pending | approved | rejected | not-required]`
