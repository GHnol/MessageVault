This command delegates to the **start** skill (`.claude/skills/start/SKILL.md`). It invokes the session startup workflow. Approval boundaries unchanged: no commit, push, merge, or external sync.

Run the KeepMees session startup sequence.

Read, in this order:
1. `AGENTS.md`
2. `CLAUDE.md`
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`
5. `docs/ai-system/README.md`
6. `docs/dev/auto-management-protocol.md`

Then run: `git branch --show-current`, `git status --short`, `git log --oneline -10`

Then run the start router and state freshness validator:
```
node scripts/start-router.mjs
node scripts/state-freshness-check.mjs
```

A BLOCKED verdict from the start router is a hard stop — do not edit any file until resolved.

Then state out loud — before editing any file:

> Package: … | Branch: … | Objective: … | Scope: … | Exclusions: … | Done: … | Remaining: … | Next action: …

Hard stops — report to Coordinator and do not proceed if:
- `AI_HANDOFF.md` is missing, blank, or its branch conflicts with `git branch --show-current`
- The handoff says status-sync is in progress but `git log` shows it already merged
- The active package is listed as in-progress but the working tree is clean and main HEAD has moved
- No package is authorized and the task involves product or app code

Do not edit any file until the startup statement is complete.

Full protocol: `docs/dev/session-restart-protocol.md`
Auto-management umbrella: `docs/dev/auto-management-protocol.md`
