---
name: documentation-watch
description: Run the AI Project OS documentation-watch review — evaluate official tool and platform changes against the scrutinous adoption rule and classify findings as ADOPT, DEFER, REJECT, or MONITOR without browsing live docs unless separately authorized.
---

## Purpose

Evaluate whether official tool, platform, or model changes warrant adoption into the AI Project OS — applying the scrutinous adoption rule so new features are adopted only when useful, safe, non-redundant, and worth the complexity.

Documentation-watch is a **scheduled review process**, not a continuous monitor. It produces a structured evaluation for Coordinator review. No repo behavior changes without Coordinator approval.

## When to use

- Monthly cadence (aligned with Coordinator weekly sync)
- Before any major AI Project OS upgrade pass
- Before copying Bootstrap Core into another repo (Puzzle, future repos)
- When a trigger event occurs (new Claude Code version, GitHub Projects API change, Google Calendar API change, etc.)
- When the Coordinator asks "are there any pending tooling changes to evaluate?"

**Invocation type:** User-invoked. No autonomous execution.

## Files to read

1. `docs/ai-system/documentation-watch-policy.md` (the authoritative policy)
2. `docs/ai-system/documentation-watch-sources.md` (official source categories; what to check)
3. `docs/ai-system/documentation-watch-log.md` (prior review history)
4. `docs/ai-system/documentation-watch-evaluation-template.md` (template for new evaluations)
5. `docs/ai-system/universal-standards.md` § "Scrutinous adoption rule"
6. `docs/dev/model-routing-protocol.md` § "Scrutinous adoption rule"
7. `AI_HANDOFF.md` (current work state — for context)

## Required git preflight

- `git status --short`
- `git log --oneline -5`

## Official-docs browsing boundary

**By default: no live internet browsing.**

Live official-docs browsing requires **explicit Coordinator authorization** before starting. If authorized:
- Use official sources only (Anthropic docs, GitHub docs, Google API docs, Node.js docs, npm docs)
- Avoid blogs, social posts, hype content, unofficial tutorials
- Cite exact official doc and section in the evaluation record
- Do not install tools or change settings during the review
- Classify findings with ADOPT/DEFER/REJECT/MONITOR before reporting

If not authorized: conduct the review from repo truth only. Classify existing knowledge as MONITOR or note "not reviewed — live check not authorized."

## Scrutinous adoption rule

Do not adopt Claude/Codex features, Plan Mode patterns, hooks, subagents, MCP servers, extended thinking, batch APIs, or automation patterns merely because they are new or sound advanced.

Only adopt if the feature materially improves at least one of:
- Reliability (fewer failures, better recovery)
- Automation (less manual toil for repeatable work)
- Safety (fewer ways to make irreversible mistakes)
- Efficiency (measurable token or time savings)
- Product outcomes (directly benefits the project)

Reject or defer if it is: hype, semantic sugar, redundant, immature, too complex for the gain, not enforceable enough, not compatible with AI Project OS, privacy or credential risk, or not universal across KeepMees/Puzzle/future repos.

## Output format

1. Review ID: `DW-YYYY-NNN`
2. Date and reviewer
3. Sources checked (or "not reviewed — live check not authorized")
4. No-browsing confirmation (if applicable)
5. Individual evaluation records for each candidate (use template format)
6. Summary table: candidate | classification | action
7. Recommended log entry for `documentation-watch-log.md`
8. Recommended source status updates for `documentation-watch-sources.md`
9. Any ADOPT candidates → proposed OS upgrade pass scope

Do not commit any changes during the review. Do not browse live docs without explicit Coordinator authorization.

## Hard stop conditions

- Stop and ask if Coordinator has not authorized the review
- Stop and ask if live docs check is being attempted without explicit authorization
- Do not adopt any feature during the review phase — ADOPT classification only means "propose implementation in a dedicated OS upgrade pass"
- Do not install dependencies, change settings.json, or modify repo files during the review

## Approval boundaries

- Classification (ADOPT/DEFER/REJECT/MONITOR) requires Coordinator review before any implementation
- ADOPT items require a separate Coordinator-authorized OS upgrade pass to implement
- This skill does not commit, push, or modify any repo files except proposing log and source file updates for Coordinator approval

## Backed by

`docs/ai-system/documentation-watch-policy.md`
`docs/ai-system/documentation-watch-sources.md`
`docs/ai-system/documentation-watch-evaluation-template.md`
`docs/ai-system/documentation-watch-log.md`
`docs/ai-system/universal-standards.md` § "Scrutinous adoption rule"
`docs/dev/model-routing-protocol.md` § "Scrutinous adoption rule"
`scripts/documentation-watch-check.mjs`
