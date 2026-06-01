# AI Project OS — Documentation-Watch Policy

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Scope:** Defines the process for evaluating official tooling and platform changes that may affect AI Project OS workflows.
**Owner:** Coordinator. Executed by Claude Code / Codex under Operator Mode.

---

## Purpose

Keep the AI Project OS aligned with official tool and platform behavior — without chasing hype, shipping unproven features, or adding complexity for its own sake.

The documentation-watch process is a **scheduled review**, not a continuous monitor. It runs on a defined cadence or when triggered by a notable tooling event. Its output is a structured evaluation that goes to the Coordinator for a decision. No repo behavior changes without Coordinator approval.

---

## Cadence

| Review type | Recommended cadence |
|---|---|
| Routine review | Monthly or before major OS upgrades |
| Triggered review | See trigger events below |
| Pre-copy-forward review | Before copying Bootstrap Core into another serious repo |

**Default:** Monthly, aligned with the Coordinator weekly sync ritual. If the previous month produced no trigger events and no significant tooling changes, the review may be marked "no-op" in the log and skipped for implementation.

---

## Trigger events

Run a documentation-watch review when any of the following occurs:

- Claude Code major release or significant feature change
- Codex tooling change (model, API, CLI)
- GitHub Projects API or CLI change
- GitHub Actions change relevant to OS hooks or CI
- Google Calendar API or OAuth library major version change
- OpenAI or Anthropic model or tooling policy change relevant to OS workflows
- Repeated workflow failure caused by a tooling assumption (e.g., a flag no longer exists)
- Before copying Bootstrap Core into another serious repo (Puzzle, future repos)
- Before starting a new v1.x OS upgrade pass

---

## Source policy

**Only official docs are authoritative for adoption decisions.**

| Source type | Use | Notes |
|---|---|---|
| Official product docs (Anthropic, OpenAI, GitHub, Google) | Source of truth | Required for ADOPT decisions |
| Official release notes or changelogs | Source of truth | Required for ADOPT or REJECT decisions |
| Official API reference | Source of truth | Required for any behavior claim |
| Unofficial blog posts, tutorials, social posts | Lead only | Can be noted to prompt investigation; never the adoption basis |
| Hype content, second-hand summaries | Do not use | Not a valid source for any claim |
| Internal repo behavior and confirmed scripts | Source of truth for current OS state | Read from repo files, not chat memory |

**Browsing boundary:** By default, Gate 6 and subsequent routine reviews do not authorize live internet browsing. If Coordinator explicitly approves a live official-docs check, that check must:

- Use official sources only
- Avoid non-official content as a source of truth
- Cite the exact official doc and section in the evaluation record
- Classify findings as ADOPT, DEFER, REJECT, or MONITOR
- Require Coordinator approval before any repo behavior changes
- Never install tools or change settings during a docs-watch review

---

## Evaluation classifications

Every candidate feature or change must be classified into one of four buckets:

| Classification | Meaning | Action |
|---|---|---|
| **ADOPT** | Feature materially improves at least one adoption criterion; official docs verified; implementation scoped | Propose implementation in a dedicated OS upgrade pass; require Coordinator authorization |
| **DEFER** | Feature may be useful but is immature, unclear, or not yet needed; revisit later | Log with revisit date or trigger; no implementation |
| **REJECT** | Feature fails one or more rejection criteria; not worth the complexity, risk, or maintenance | Log reason; do not implement |
| **MONITOR** | Not yet clear; track for future review | Add to watch list; revisit on next cadence |

---

## Adoption criteria

Only adopt a feature if it materially improves at least one of:

- **Reliability** — fewer failures, better recovery, more consistent behavior
- **Automation** — less manual toil for repeatable work without adding risk
- **Safety** — fewer ways to make irreversible mistakes; better credential or scope protection
- **Efficiency** — measurable token or time savings; reduced toil
- **Product outcomes** — directly benefits KeepMees or future repos bootstrapped from this OS

"Materially improves" means a concrete, observable improvement — not theoretical or aspirational.

---

## Rejection criteria

Reject or defer if the feature is any of the following:

- **Hype** — widely discussed but not verified to improve the above criteria
- **Semantic sugar** — different syntax for the same result; no material improvement
- **Redundant** — duplicates an existing pattern already working well
- **Immature** — early access, preview, beta, or lacks stable official docs
- **Too complex for the gain** — adds maintenance, understanding burden, or failure modes that outweigh the benefit
- **Not enforceable enough** — the improvement depends on agents reliably obeying a new rule, but there is no reasonable way to verify compliance
- **Not compatible with AI Project OS** — conflicts with the enforcement model, continuity discipline, or scope boundaries
- **Privacy or credential risk** — touches credential handling, external auth, or local-private file handling in a way that increases risk
- **Not universal** — useful only in KeepMees-specific scenarios and would not be appropriate in Puzzle or future repos

---

## Scrutinous adoption rule

**Universal across all repos using this OS. Not negotiable.**

Do not adopt Claude/Codex features, Plan Mode patterns, hooks, subagents, MCP servers, extended thinking, batch APIs, or automation patterns merely because they are new or sound advanced.

Apply the adoption criteria and rejection criteria above to every candidate. When in doubt: classify as MONITOR. Document the reason. Revisit when the feature has a stable track record and official docs.

The scrutinous adoption rule is enforced procedurally — no tool prevents adoption, but the OS audit and the Coordinator review are the checkpoints.

See also: `docs/dev/model-routing-protocol.md` § "Scrutinous adoption rule" and `docs/ai-system/universal-standards.md` § "Scrutinous adoption rule".

---

## Approval boundary

- Documentation-watch reviews **recommend** changes.
- **Implementation** still requires a separate Coordinator authorization and a dedicated OS upgrade pass.
- Documentation-watch never installs dependencies, changes settings.json, or modifies any repo file during the review phase.
- If a live official-docs check is needed, it requires separate Coordinator authorization before browsing begins.

---

## Integration with weekly sync and closeout

- The **weekly sync** skill checks for pending docs-watch items (any classification not yet resolved).
- The **closeout** skill notes if documentation-watch log or sources changed and whether a mirror entry is needed.
- The **os-audit** skill verifies that the docs-watch policy, sources, template, and log exist as required items.

---

## Related files

| File | Purpose |
|---|---|
| `docs/ai-system/documentation-watch-sources.md` | Official source categories; what to check; adoption risk per category |
| `docs/ai-system/documentation-watch-evaluation-template.md` | Reusable template for individual evaluations |
| `docs/ai-system/documentation-watch-log.md` | Durable committed log of review sessions and outcomes |
| `.claude/skills/documentation-watch/SKILL.md` | Skill for invoking the docs-watch review process |
| `.claude/commands/documentation-watch.md` | Command wrapper for `/documentation-watch` |
| `scripts/documentation-watch-check.mjs` | Script that validates the docs-watch framework files exist |
| `docs/ai-system/universal-standards.md` | Universal scrutinous adoption rule |
| `docs/dev/model-routing-protocol.md` | Full scrutinous adoption rule table |
