This command delegates to the **project-sync-dry-run** skill (`.claude/skills/project-sync-dry-run/SKILL.md`). Dry-run only — no files modified, no external writes. Approval boundaries unchanged.

Run the internal project-control sync dry-run.

Read:
1. `docs/project-control/project-sync-policy.md`
2. `docs/project-control/project-sync-dry-run-format.md`
3. `CURRENT_STATE.md`
4. `AI_HANDOFF.md`
5. `docs/project-control/current-sprint.md`
6. `docs/project-control/kanban-board.md`

Run the optional script if available:
```
node scripts/project-control-sync-dry-run.mjs
```

Produce a delta report following `docs/project-control/project-sync-dry-run-format.md`:
- Internal doc delta (repo files that need updating)
- External tool delta (Calendar / ClickUp / TickTick proposed changes — dry-run only)
- Skip rationale (cosmetically stale but not operationally misleading)
- Verdict: DRIFT FOUND or NO DRIFT

Footer (required): `No external sync was performed. No files were modified by this dry-run.`

Hard stops:
- Never write to external systems
- Never modify repo files — chat output only
- Apply Post-Commit State Rule: cosmetic HEAD lag is not drift

Full skill: `.claude/skills/project-sync-dry-run/SKILL.md`
Full policy: `docs/project-control/project-sync-policy.md`
