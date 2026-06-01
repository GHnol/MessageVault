This command delegates to the **start-router** skill (`.claude/skills/start-router/SKILL.md`). Approval boundaries unchanged: read-only, no commit, push, or external sync.

Run the repo-native start router to get a recommended session startup route.

```
node scripts/start-router.mjs
node scripts/start-router.mjs --json
node scripts/start-router.mjs --explain
node scripts/start-router.mjs --paths
node scripts/start-router.mjs --mode fresh
node scripts/start-router.mjs --mode continue
node scripts/start-router.mjs --mode handoff
node scripts/start-router.mjs --mode package-start
node scripts/start-router.mjs --recommend-model
node scripts/start-router.mjs --context-risk
```

Report the verdict to the user. BLOCKED verdicts are hard stops — do not proceed until the condition is resolved. NEEDS_* verdicts require action before switching tools or contexts.

After getting a READY verdict, proceed with `/start` (for fresh session) or continue with `/handoff` check (for continuation).

Full protocol: `.claude/skills/start-router/SKILL.md`
