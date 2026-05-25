# AI Project OS — KeepMees / MessageVault

**Status:** ACTIVE (introduced in Package 2.9 — AI Project OS Auto-Management Upgrade Pass).
**Last updated:** 2026-05-22 (America/New_York)
**Owner:** Coordinator (Chat 01). Maintained by Claude Code / Codex under Operator Mode.

---

## What this directory is

`docs/ai-system/` is the universal AI Project OS layer for KeepMees / MessageVault. It is the place where the project-OS rules, standards, and reusable patterns live — separate from product strategy (`docs/strategy/`), product operations (`docs/ops/`), or the live Project Control Tower (`docs/project-control/`).

This is the layer that should be:

- Generalizable across repos (KeepMees, Puzzle, future projects)
- Stable across packages (changes are versioned, not silent rewrites)
- Useful to any AI coding agent that walks into the repo cold

It is **not** a replacement for `AGENTS.md`, `CLAUDE.md`, or the operator-mode protocols. It is the layer that ties them together and explains why they exist.

---

## How it fits the existing layers

| Layer | Where | Role |
|---|---|---|
| Universal agent contract | `AGENTS.md` (root) | Rules every AI agent obeys |
| Claude-specific layer | `CLAUDE.md` (root) | Claude Code behavior on top of `AGENTS.md` |
| Codex-specific layer | `.codex/README.md` | Codex behavior on top of `AGENTS.md` |
| Continuity files | `AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md` (root) | Repo-native memory |
| Operator-mode procedures | `docs/automation/operator-mode/` | KeepMees-specific operating procedures |
| Dev workflow protocols | `docs/dev/` | Session, context, model, tool, scope, batching, notification protocols |
| QA + testing | `docs/qa/` | Test strategy, manual QA, pre-commit, package verification, release readiness |
| **AI Project OS (this dir)** | `docs/ai-system/` | Universal standards, bootstrap template, version history, changelog |
| Project Control Tower | `docs/project-control/` | Live roadmap, schedule, sprint, gates, decisions, risks |
| Product strategy | `docs/strategy/`, `docs/architecture/`, `docs/ops/` | Product truth and registers |

The AI Project OS layer is the **portable** layer — the part you would copy into a new repo to bootstrap the same operating standard.

---

## File index

| File | Purpose |
|---|---|
| `README.md` | This file — what this layer is and how it fits |
| `universal-standards.md` | Universal standards that should apply to KeepMees and future repos |
| `bootstrap-template.md` | Provisioning pattern for spinning up the AI Project OS in a new repo |
| `CHANGELOG.md` | OS-level changelog — what changed in the AI Project OS itself, version by version |
| `version-history.md` | Versioned record of OS upgrade passes (Package 2.7, 2.8, 2.9, ...) and what they delivered |
| `os-self-audit-checklist.md` | Checklist for verifying AI Project OS bootstrap completeness; companion to `scripts/os-self-audit.mjs` |

---

## What this layer does NOT do

- It does not commit code on your behalf.
- It does not enforce hooks (the harness does that; this layer documents how to configure them at user level).
- It does not switch models, switch tools, or compact context automatically — those remain manual or semi-automatic.
- It does not replace product strategy, the Project Control Tower, or the operator-mode protocols.
- It does not invent new product authority — Coordinator decisions remain the only product authority.

If a document in this layer makes a behavioral claim, that claim is either:

1. **Automatic** — the harness or repo enforces it without human action.
2. **Semi-automatic** — the agent recommends or prepares; a human confirms.
3. **Policy-driven** — the agent must follow the rule; nothing technically prevents violation.

Every claim in this layer is labelled with one of those three.

---

## Reading order for a fresh agent

1. `AGENTS.md` (universal contract — always read first)
2. `CLAUDE.md` or `.codex/README.md` (your tool layer)
3. `AI_HANDOFF.md` (in-flight state)
4. `CURRENT_STATE.md` (durable snapshot)
5. This file (`docs/ai-system/README.md`)
6. `docs/ai-system/universal-standards.md`
7. `docs/dev/auto-management-protocol.md` (umbrella protocol)
8. Active package instruction

---

## Maintenance

- **Who edits:** Coordinator + Claude/Codex under Operator Mode.
- **When edits ship:** in dedicated OS upgrade passes (Package 2.7, 2.8, 2.9, ...). Do not silently rewrite this layer mid-product-package.
- **Version-history rule:** any meaningful change must add a row to `version-history.md` and `CHANGELOG.md`.
- **Bootstrap rule:** `bootstrap-template.md` should stay copy-pasteable into a fresh repo. Do not let it accumulate KeepMees-specific assumptions.
