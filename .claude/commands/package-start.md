Run the pre-flight sequence for a newly authorized package.

Read in order:
1. `AGENTS.md`
2. `CLAUDE.md`
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`
5. The package instruction document provided by the Coordinator

Run: `git branch --show-current`, `git status --short`, `git log --oneline -5`

Confirm and state out loud:
- The package is explicitly authorized by the Coordinator
- No unauthorized in-progress work exists on this branch
- The approved scope is clear and narrow
- Hard exclusions are listed
- The first exact action is stated before touching any file

Hard stop — do not proceed if:
- No package instruction has been provided or authorized
- The working tree has unexpected modified files
- The handoff says another agent is mid-task on this branch
- You are being asked to write product/app code with no authorized package

Branch naming: create `task/<description>`, `fix/<description>`, or `docs/<description>` — never work directly on `main`.

Full protocol: `docs/dev/session-restart-protocol.md`
Scope boundaries: `docs/dev/agent-scope-boundaries.md`
