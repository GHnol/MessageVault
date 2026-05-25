This command delegates to the **project-sync-apply** skill (`.claude/skills/project-sync-apply/SKILL.md`). Approval-gated — requires Coordinator to have reviewed and approved a specific dry-run delta first. No autonomous external writes.

Apply an approved project-control sync delta.

Before running this command, confirm:
1. A `project-sync-dry-run` has been reviewed and approved by the Coordinator
2. The specific approved delta is clear and named

Read:
1. The approved dry-run delta (from chat or saved proposal)
2. `docs/project-control/project-sync-policy.md`
3. `docs/project-control/external-sync-safety.md`

Then:
1. Apply only the approved internal repo doc changes
2. Propose (do not apply) external tool changes (Calendar, ClickUp, TickTick)
3. Add an entry to `docs/project-control/project-sync-log.md`
4. Propose a commit message for the sync commit if internal changes warrant it

Footer for external section (required): `External sync proposed only. No external writes performed. Coordinator must apply changes manually or authorize a separate script run.`

Hard stops:
- Do not apply changes not in the approved dry-run delta
- Do not write to external systems (Google Calendar, ClickUp, TickTick)
- Do not commit without explicit user instruction

Full skill: `.claude/skills/project-sync-apply/SKILL.md`
External safety rules: `docs/project-control/external-sync-safety.md`
