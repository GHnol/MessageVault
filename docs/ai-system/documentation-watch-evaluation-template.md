# AI Project OS — Documentation-Watch Evaluation Template

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Use:** Reusable template for documenting individual tool/platform evaluations during a documentation-watch review. Copy this template to create a new evaluation record in `documentation-watch-log.md` or a dedicated evaluation file.

---

## How to use

1. Copy the template below into a new entry in `documentation-watch-log.md`, or into a standalone file if the evaluation is extensive.
2. Fill in all fields. Mark unknown fields as `N/A` or `not assessed`.
3. Assign a classification: ADOPT, DEFER, REJECT, or MONITOR.
4. Submit to Coordinator for review before any implementation begins.
5. After decision, update the status field and log the outcome.

---

## Evaluation record template

```
---
review_id: DW-YYYY-NNN
date: YYYY-MM-DD
reviewer: Claude Code (model) / Coordinator / [name]
---

### Tool / platform
[Name of the tool, platform, or feature being evaluated]

### Official source checked
[Name of the official documentation source]

### Source URL or doc identifier
[URL, doc section name, or release note identifier — do not browse unless Coordinator approved live docs check]

### Change summary
[One paragraph: what changed or what was found; what the official docs say]

### Affected AI OS area
[Which part of the OS is affected: skills, commands, scripts, hooks, settings, gitignore, bootstrap, external sync, model routing, other]

### Candidate action
[What could be done: adopt a new flag, update a script, add a skill, change a default, etc.]

### Classification
[ADOPT / DEFER / REJECT / MONITOR]

### Adoption criteria assessment
- Reliability improvement: [yes / no / partial — explain]
- Automation improvement: [yes / no / partial — explain]
- Safety improvement: [yes / no / partial — explain]
- Efficiency improvement: [yes / no / partial — explain]
- Product outcome improvement: [yes / no / partial — explain]

### Rejection criteria assessment
- Hype: [yes / no]
- Semantic sugar: [yes / no]
- Redundant: [yes / no]
- Immature: [yes / no]
- Too complex for the gain: [yes / no]
- Not enforceable enough: [yes / no]
- Not compatible with AI Project OS: [yes / no]
- Privacy or credential risk: [yes / no]
- Not universal: [yes / no — explain if KeepMees-specific]

### Complexity
[Low / Medium / High — implementation effort; maintenance burden]

### Risk
[Low / Medium / High — risk of breaking existing workflows; risk of credential exposure; risk of scope creep]

### Privacy / credential impact
[None / Low / Medium / High — does this change touch credential handling, local-private files, external auth?]

### Compatibility with KeepMees
[Yes / No / Partial — explain any KeepMees-specific concerns]

### Compatibility with Puzzle
[Yes / No / Partial / N/A — would this work in Puzzle if bootstrapped from this OS?]

### Compatibility with future repos
[Yes / No / Partial — is this universal or KeepMees-specific?]

### Implementation scope
[If ADOPT: what files would change, what scripts would be created, what Coordinator authorization is needed]

### Validation required
[If ADOPT: what checks confirm the implementation is correct and safe]

### Rollback plan
[If ADOPT: how to undo this change if it breaks something]

### Decision
[ADOPT: proceed to OS upgrade pass / DEFER: revisit date or trigger / REJECT: final / MONITOR: revisit next cycle]

### Coordinator approval status
[Pending / Approved / Rejected / Deferred]

### Follow-up issue or task ID
[If applicable: backlog item, sprint task, or OS upgrade pass that will implement this]
```

---

## Classification guide

| Classification | When to use | Coordinator action needed |
|---|---|---|
| ADOPT | All adoption criteria met; official docs verified; implementation scoped | Yes — authorize OS upgrade pass |
| DEFER | Potentially useful but immature or not needed now | No — log with revisit date |
| REJECT | Fails rejection criteria; not worth the complexity | No — log reason; close |
| MONITOR | Unclear; track for future review | No — add to watch list |

---

## Notes on "not reviewed" entries

If a source was not checked in the current review cycle, write:

```
Not reviewed in this cycle — [reason or trigger that would prompt review]
```

Do not invent or assume current official-doc facts that were not verified.
