# GitHub Projects Template Standard

**Status:** ACTIVE (introduced in AI Project OS v1.5 — Template GitHub Project Standard, 2026-05-26)
**Owner:** Coordinator / Project Control
**Companion docs:** `github-projects-template-copy-runbook.md`, `github-projects-template-config.example.json`, `github-projects-setup-policy.md`, `github-projects-import-runbook.md`, `external-sync-safety.md`

---

## Purpose

This document defines the canonical AI Project OS GitHub Project template standard. It governs:

1. The canonical vocabulary for Status field options (v1.5)
2. The canonical field set (13 fields)
3. The canonical view set (14 views)
4. The template-copy path as the preferred GitHub Project setup method
5. The two-gate closeout model for template implementation

---

## The Two-Gate Closeout Model

v1.5 implements GitHub Project template infrastructure in two gates. Both gates are required; neither may be skipped or merged.

### Gate 1 — Repo infrastructure (this pass)

Gate 1 establishes the repo-side foundation:

- This standard doc
- Template config example (`github-projects-template-config.example.json`)
- Template copy runbook (`github-projects-template-copy-runbook.md`)
- Template scripts: `github-project-template-dry-run.mjs`, `github-project-template-validate.mjs`, `github-project-template-apply.mjs`
- Updated `github-project-setup-apply.mjs` — config-driven template-copy-first logic
- Updated skills, commands, bootstrap template, OS audit

Gate 1 does NOT create a live GitHub Project, copy a template, or write any local template config. No live GitHub mutations are performed in Gate 1.

**Gate 1 complete condition:** all files above committed and OS audit passing.

### Gate 2 — Live template creation or documented blocker (separate authorization)

Gate 2 requires explicit Coordinator authorization (separate from Gate 1).

Gate 2 options:
- **Option A:** Designate the existing KeepMees Project #1 as the canonical AI Project OS template (note its project ID in `github-projects-template-config.local.json`)
- **Option B:** Create a dedicated template project: `node scripts/github-project-template-apply.mjs --apply --create-template`
- **Option C:** Confirm a platform or permission blocker that prevents template creation; record it in this file under "Gate 2 Status" section below

v1.5 is **not complete** until Gate 2 closes with one of these outcomes.

**Gate 2 complete condition:** a real template project ID is recorded in `github-projects-template-config.local.json` (gitignored, never committed), OR a documented platform blocker is recorded in this file.

---

## Gate 2 Status

**Status:** `pending` — awaiting Coordinator authorization.

*Update this section when Gate 2 closes:*
```
Gate 2 outcome: [Option A | Option B | Option C]
Template project: <title> (owner: <owner>, number: <N>, id: <PVT_...>)
Date closed: YYYY-MM-DD
Coordinator approval: [name]
```

---

## Template-Copy as Preferred Setup Path

**Template-copy is the preferred GitHub Project setup path for any AI Project OS repo as of v1.5.**

Rationale:
- A template project has all 13 custom fields, all 8 Status options, and all 14 views pre-configured
- Copying a template takes one GraphQL mutation (`copyProjectV2`) instead of many sequential creates
- A validated template guarantees the canonical vocabulary is correct before any issue import runs
- Teams that bootstrap the OS in a new repo can skip the manual field/view setup entirely

**Create-from-scratch is the fallback**, used only when:
- No template config file exists (`github-projects-template-config.local.json` absent)
- The template config contains placeholder IDs (not yet populated with a real template)
- Gate 2 has not been completed for this repo

The `github-project-setup-apply.mjs` script detects the local template config at startup and automatically chooses the correct path.

---

## Canonical Status Vocabulary (v1.5)

**Effective:** AI Project OS v1.5.

These are the only valid Status field options for any AI Project OS GitHub Project. The old vocabulary (v1.3/v1.4) is retired.

| Status value | Meaning |
|---|---|
| `Backlog` | Issue exists but no work has begun |
| `Ready` | Scoped, unblocked, ready to start |
| `In Progress` | Actively being worked |
| `Review / QA` | Implementation done; awaiting review, QA, or approval |
| `Waiting / Blocked` | Cannot proceed — waiting on external dependency, decision, or third party |
| `Done / Shipped` | Completed, verified, and merged/shipped |
| `Deferred` | Explicitly pushed to a future phase |
| `Cancelled` | Killed; will not be done |

**Old vocabulary (must not appear in new or updated files):**

| Old value | Replace with |
|---|---|
| `Not Started` | `Backlog` |
| `In Review` | `Review / QA` |
| `Blocked` | `Waiting / Blocked` |
| `Waiting` | `Waiting / Blocked` |
| `Approved` | `Done / Shipped` (if the item closed), `In Progress` (if work continues), or remove |
| `Done` | `Done / Shipped` |

The live KeepMees Project #1 has been manually migrated to v1.5 vocabulary (confirmed via read-only live check 2026-05-27). Source records in the repo use v1.5 vocabulary. The board is in sync — no field repair pass is needed for KeepMees.

---

## Canonical External Sync Status Vocabulary (unchanged from v1.3)

| Value | Meaning |
|---|---|
| `in-sync` | Repo record matches live board item |
| `drift` | Repo record and live board item differ |
| `unknown` | Live state not verified |
| `not-tracked` | No corresponding live board item |

**Old vocabulary (must not appear):** `not-synced`, `ready-for-sync`, `sync-error`

---

## Canonical Field Set (13 fields, minimum)

Every AI Project OS GitHub Project must have these fields:

| Field name | Type | Options |
|---|---|---|
| OS ID | Text | — |
| Package | Text | — |
| Phase | Text | — |
| Lane | Single select | Development, Product, Design, QA, Vendor, Operations, Growth, Legal, Finance, OS Infrastructure, AI Agent, Coordinator, Founder, Backlog |
| Source File | Text | — |
| Last Repo Sync | Date | — |
| External Sync Status | Single select | in-sync, drift, unknown, not-tracked |
| Risk Level | Single select | Low, Medium, High |
| Decision Needed | Checkbox | — |
| Calendar Relevant | Checkbox | — |
| TickTick Relevant | Checkbox | — |
| Owner Role | Single select | Founder, Coordinator, Claude, Codex, Development, QA, Product, Vendor, Design |
| Success Criteria | Text | — |

**Note:** Decision Needed and Calendar Relevant are provisioned as Text fields in the current API layer (GitHub Projects API does not reliably support Checkbox via GraphQL). The template standard lists them as Checkbox for semantic clarity; scripts use TEXT.

---

## Canonical View Set (14 views)

Every AI Project OS GitHub Project must have these saved views:

| View name | Filter / Group |
|---|---|
| Board | Default Kanban by Status |
| Table | All items, all fields |
| Current Sprint | Active sprint items |
| Backlog | Status = Backlog |
| Review / QA | Status = Review / QA |
| Waiting / Blocked | Status = Waiting / Blocked |
| Done | Status = Done / Shipped or Cancelled |
| Risks / Decisions | Risk Level = High or Decision Needed = true |
| Calendar Relevant | Calendar Relevant = true |
| TickTick Relevant | TickTick Relevant = true |
| By Package | Grouped by Package |
| By Phase | Grouped by Phase |
| By Lane | Grouped by Lane |
| Decision Needed | Decision Needed = true |

---

## Canonical Owner Role Options

`Founder`, `Coordinator`, `Claude`, `Codex`, `Development`, `QA`, `Product`, `Vendor`, `Design`

AI agents (Claude, Codex) appear in Owner Role only — never as GitHub Assignees (no real GitHub user account).

---

## Template Config Files

| File | Status | Contents |
|---|---|---|
| `docs/project-control/github-projects-template-config.example.json` | **Committed** (safe) | Placeholder IDs only; schema example |
| `docs/project-control/github-projects-template-config.local.json` | **Gitignored** (never commit) | Real template project IDs and configuration |

The local config is written manually or by the apply script in Gate 2. Without it, setup-apply falls back to create-from-scratch.

---

## Migration Path from v1.3 / v1.4

If a repo was set up under AI Project OS v1.3 or v1.4:

1. The live GitHub Project may use old Status vocabulary (9 options) — verify with a read-only live check first. KeepMees Project #1 completed this migration manually (confirmed 2026-05-27).
2. Source records in the repo should be migrated to v1.5 vocab. Scripts now validate against the v1.5 vocabulary.
3. If live board field repair is needed, Gate 2 for the repo includes a field repair pass using `github-project-field-repair.mjs` to align the live board with v1.5 Status options.
4. The example files (`github-projects-field-map.example.json`, `external-sync-map.example.json`) are updated to v1.5 vocab as part of this pass.

---

## What This Standard Does NOT Do

- It does not create a live GitHub Project.
- It does not mutate GitHub Projects, GitHub Issues, or any external API.
- It does not commit real project IDs, template IDs, or credentials.
- It does not override Coordinator decisions about project structure.
- It does not authorize the next product package.
