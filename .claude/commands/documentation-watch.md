Base directory for this skill: C:\Users\nlamp\Documents\Github\ghnol\MessageVault\.claude\skills\documentation-watch

This command delegates to the **documentation-watch** skill (`.claude/skills/documentation-watch/SKILL.md`). It invokes the AI Project OS documentation-watch review — evaluating official tool and platform changes against the scrutinous adoption rule without browsing live docs unless separately authorized.

Read the skill file for the full protocol. Key invariants:
- No live internet browsing without explicit Coordinator authorization
- All findings classified as ADOPT, DEFER, REJECT, or MONITOR
- No repo behavior changes without separate Coordinator-authorized OS upgrade pass
- Scrutinous adoption rule applies: adopt only what materially improves reliability, automation, safety, efficiency, or product outcomes
- Never install dependencies or change settings during the review
