# Release Readiness

Use this when evaluating whether the product is ready for a release/launch milestone. This is a gate checklist, not a decision record. It does not authorize a release — the Coordinator does.

---

**Date:** `[YYYY-MM-DD]`
**Release / milestone:** `[name]`
**Evaluated by:** `[agent / human]`
**main HEAD:** `[hash]`

---

## 1. Code and tests

- [ ] All Node unit suites green (count: )
- [ ] Seeded E2E green (count: )
- [ ] Real-files E2E green (count: )
- [ ] Capture harness scenario(s) green
- [ ] No known regressions open
- [ ] Working tree clean; main pushed

## 2. Product gates

| Gate | Required for this release? | Status |
|---|---|---|
| Vendor confirmed | | |
| `isCoverUnblocked()` | | |
| Commerce readiness (message-book) | | |
| Server PDF pipeline | | |
| Designer confirmed | | |
| Figma master built + approved | | |

- [ ] Every gate required for this release is satisfied, or the release scope explicitly excludes gated areas

## 3. Scope and truth

- [ ] No locked product decision violated
- [ ] No product claim beyond what the system supports
- [ ] Preview vs design truth distinction intact
- [ ] Vendor / manufacturing / packaging scope unchanged unless authorized

## 4. Operations

- [ ] `docs/command-center/current-status.md` current
- [ ] `docs/command-center/next-actions.md` current
- [ ] Risk register reviewed; no open H/H risk blocking release
- [ ] Decision register current
- [ ] `CURRENT_STATE.md` current

## 5. Continuity

- [ ] `AI_HANDOFF.md` reflects a clean, closed state
- [ ] No in-progress package mid-flight

---

## Verdict

- [ ] **Ready for the requested milestone**
- [ ] **Not ready** — blockers:

**Blockers before release:**

1.
