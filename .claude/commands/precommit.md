This command delegates to the **precommit** skill (`.claude/skills/precommit/SKILL.md`). It invokes the pre-commit verification gate. Approval boundaries unchanged: no commit created.

Run the KeepMees pre-commit verification gate.

Read `docs/qa/pre-commit-verification-template.md` and walk through every check.

Then run: `git diff --stat HEAD`, `git status`

Report for each check:
- PASS — verified
- FAIL — reason
- SKIP — reason and whether the skip is safe for this commit

Then give a go / no-go recommendation:
- GO: all required checks pass; commit is safe to propose
- NO-GO: which checks failed; what must be fixed before committing

Do not create the commit. The commit happens only after the user gives explicit instruction.

Do not use `--no-verify`. If a hook fails, diagnose the root cause — do not bypass it.

Full protocol: `docs/qa/pre-commit-verification-template.md`
Git identity preflight (required before any commit): `CLAUDE.md` § "Git identity (KeepMees repo)"
