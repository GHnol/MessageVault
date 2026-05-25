This command delegates to the **os-audit** skill (`.claude/skills/os-audit/SKILL.md`). Approval boundaries unchanged: no docs updated automatically; no commit or push.

Run the KeepMees AI Project OS self-audit.

Read `docs/ai-system/os-self-audit-checklist.md` and walk through every check.

Run the optional script if available:
```
node --check scripts/os-self-audit.mjs
node scripts/os-self-audit.mjs
```

Report each item as:
- PASS — verified
- WARN — cosmetically stale or optional item missing
- FAIL — required item missing or protection broken

Then give a final determination:
- `BOOTSTRAP COMPLETE` — all required items pass
- `BOOTSTRAP INCOMPLETE` — list what is missing

Hard stops:
- Do not inspect `index.html`, `src/**` — app code is excluded from OS audit
- Do not update any docs without explicit user instruction
- Do not commit or push

Full checklist: `docs/ai-system/os-self-audit-checklist.md`
Full skill: `.claude/skills/os-audit/SKILL.md`
