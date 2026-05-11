# Update Project Records Protocol

**Last updated:** 2026-05-10
**Applies to:** Claude Code (Operator) when receiving a stream response and updating docs

---

## Purpose

Define how Claude Code should update the KeepMees docs from a stream response (Coordinator decision, vendor response, product update, competitor report, etc.) without creating false authority, duplicating content, or silently overwriting locked decisions.

---

## Step 1 — Identify the source and its authority level

Before updating any doc, answer:

| Question | How to answer |
|---|---|
| Which stream produced this content? | Match to the 15-chat model in `docs/ops/stream-sync-protocol.md` |
| Is this a Coordinator decision or a stream proposal? | Only Chat 01 (Coordinator) can lock decisions |
| Has the Coordinator explicitly approved this? | If no: mark as `proposed` or `needs-coordinator-decision` |
| Does this contradict an existing locked decision? | If yes: flag to user before writing anything |

**Do not mark a stream-proposed fact as `locked` unless Coordinator explicitly locked it.**

---

## Step 2 — Identify which docs to update

Use the document update routing table from `docs/ops/stream-sync-protocol.md`:

| Source | Primary docs to update |
|---|---|
| Coordinator decision | `docs/ops/decision-register.md`, relevant strategy docs |
| Product response | `docs/strategy/product-format-bank.md`, `docs/ops/design-readiness-register.md` |
| Development handoff | `docs/strategy/master-project-truth.md`, `docs/ops/backlog-roadmap.md` |
| Vendor research | `docs/ops/vendor-manufacturing-register.md` |
| Competitor report | `docs/ops/competitor-intelligence-register.md` |
| AI Mastery output | `docs/ops/ai-automation-register.md` |
| Packaging stream | `docs/ops/vendor-manufacturing-register.md`, `docs/strategy/product-format-bank.md` |

---

## Step 3 — Read the file before editing

Always use the `Read` tool on a file before editing it. Never trust in-context summaries of file state. The CLAUDE.md rule is: "Use Read before Edit. Never edit a file you have not read in this session."

---

## Step 4 — Apply the correct status label

Use the status vocabulary from `docs/automation/operator-mode/README.md`. Key rules:

- Stream says X is happening → status: `proposed`
- Coordinator explicitly says "this is locked" → status: `locked`
- Physical product target (not a technical constant) → status: `owner-approved-target`
- Something blocked by a named external condition → status: `gated`
- Something deferred without a specific gate → status: `deferred`

---

## Step 5 — Do not duplicate master truth loosely

Reference the Package 2.5A source-of-truth docs rather than creating free-form summaries in new docs. If a piece of information already exists authoritatively in `docs/strategy/master-project-truth.md`, `docs/ops/decision-register.md`, etc., link to it — don't copy it and diverge.

---

## Step 6 — Use LAYER 2 for non-source-backed content

If the update contains analysis, recommendations, or advisory content that is NOT directly source-backed by a Coordinator or stream decision, place it in a `## LAYER 2 — Claude Advisory, Not Yet Coordinator Approved` section at the bottom of the doc. Do not mix advisory content with source-backed facts.

---

## Step 7 — Flag contradictions before writing

If the incoming stream content contradicts a locked decision, **stop and flag the contradiction to the user** before writing any update. Do not silently reconcile the contradiction. Do not rewrite the locked decision without Coordinator authorization.

---

## Step 8 — Report after updating

After updating, report:
1. Which files were changed
2. What was added/changed (summary of key facts)
3. What was marked proposed vs locked
4. Whether any contradictions were found
5. Whether Coordinator approval is needed before these changes go live

---

## Things that require Coordinator authorization before writing to docs

| Scenario | Required action |
|---|---|
| New decision that contradicts an existing locked decision | Stop, flag, ask |
| Changing the status of a locked decision | Stop, flag, ask |
| Adding a physical SKU to the launch target | Stop, flag, ask |
| Declaring a deferred item as now active | Verify Coordinator activation instruction before writing |
| Updating `BOOK_PAGINATION_VERSION` or any pagination constant | Explicitly prohibited without package-level authorization |

---

## What the Operator may update without additional authorization (within an active docs package)

- Adding new information from a source stream to the appropriate register
- Correcting factual errors when backed by source material
- Updating `Last updated` dates
- Adding LAYER 2 advisory sections
- Creating new doc entries using the templates in `docs/automation/templates/`
