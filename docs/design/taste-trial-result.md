# Design Tool Taste-Trial — Result

**Status:** COMPLETE — outcome accepted by Coordinator.
**Recorded:** 2026-06-16.
**Companions:** `docs/design/taste-trial-brief.md` (the brief that was run), `docs/design/keepmees-design-bible.md` (the approved replacement source of truth), `docs/architecture/phase-0-rebuild-decisions.md` (§6).

---

## Outcome

**No design tool was approved as the creative source of truth for KeepMees.** Neither tested tool is selected as an art-direction originator. Human-curated art direction — the KeepMees Design Bible — is the creative source of truth instead.

## What was tested

| Tool | Status | Score | Verdict |
|---|---|---|---|
| Figma Make | Tested | 41/70 | Rejected as art-direction originator |
| Subframe | Tested | 37/70 | Rejected as art-direction originator |
| Onlook | Skipped | — | Deferred (skipped after the first two results made continuing low-value) |

Trial conditions: synthetic content only (per the brief). Artifacts (screenshots/notes) were reviewed locally, read-only; none were committed to the repo, and no generated design or code was imported.

## Why both tested tools were rejected

- Both produced **cookie-cutter, generic AI / competitor-style design** — not premium, not emotionally excellent, not original enough for KeepMees.
- The failure was a **method** failure, not a tool defect: asking a generative tool to *originate* art direction from a short brief makes it regress to its training prior, and that prior is "generic AI-SaaS / competitor UI." Two independent tools converging on the same failure confirmed the binding constraint was shared (under-specified art direction), not tool-specific.
- The original pass/fail rubric was **too mechanical** — passing "editable React/Tailwind," "has tokens," and "has components" measures implementation hygiene, not taste. Taste must be a **dominant gate judged against a defined standard**, which did not exist until the Design Bible.

## Decisions recorded

- No tool is the creative source of truth. The **KeepMees Design Bible v1** is.
- **Figma** and **Subframe** may remain useful later as **secondary execution / handoff tools** (Figma as a token store / handoff surface; Subframe as an implementation accelerator / component-code reference) — never as originators. Subframe's privacy/training terms remain unverified and must be gated before any real use.
- **Onlook** remains **deferred** (revisit only if/when it supports the Vite target; same secondary-executor role question).
- **Generic AI-generated design is explicitly rejected as the foundation** of the KeepMees visual identity.

## Key lesson

**AI tools may translate or accelerate design; they do not originate KeepMees art direction.** Art direction is human-originated, deliberate, and defined in the Design Bible. Tools are subordinate executors that must conform to the Bible, not the other way around.
