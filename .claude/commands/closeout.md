Run the KeepMees package boundary closeout sequence.

Read in order:
1. `docs/dev/package-boundary-closeout-protocol.md`
2. `docs/qa/package-verification-template.md`
3. `AI_HANDOFF.md`
4. `CURRENT_STATE.md`

Run package verification: walk through `docs/qa/package-verification-template.md` for the active package.

Then update `AI_HANDOFF.md`, `CURRENT_STATE.md`, and `NEXT_SESSION_PROMPT.md` to reflect package-closed state.

Then produce:
- Closeout report (what was delivered, what was not, what the test baseline is now)
- Proposed commit message for the status-sync commit
- Merge plan (branch → main with `--no-ff`, separate from the implementation merge)
- Recommendation: fresh session or continuation for the next package

Hard stops:
- Do not commit, push, or merge without explicit user instruction
- Do not start the next package inside this session without Coordinator authorization
- Do not mark a package complete if tests are failing or the pre-commit gate has not been run

Full protocol: `docs/dev/package-boundary-closeout-protocol.md`
Verification template: `docs/qa/package-verification-template.md`
