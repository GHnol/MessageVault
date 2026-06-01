Base directory for this skill: C:\Users\nlamp\Documents\Github\ghnol\MessageVault\.claude\skills\bootstrap-copy-forward

This command delegates to the **bootstrap-copy-forward** skill (`.claude/skills/bootstrap-copy-forward/SKILL.md`). It runs the AI Project OS bootstrap copy-forward audit — verifying readiness and producing a structured plan for copying the OS from KeepMees into Puzzle or a future repo.

Read the skill file for the full protocol. Key invariants:
- Read-only audit only; never copies files or modifies repos
- Requires recent OS audit (BOOTSTRAP COMPLETE) and documentation-watch review
- Private files (credentials, tokens, local sync maps, raw transcripts) must never be transferred
- Actual copy requires explicit Coordinator authorization
