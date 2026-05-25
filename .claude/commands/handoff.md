This command delegates to the **handoff** skill (`.claude/skills/handoff/SKILL.md`). It invokes the handoff and checkpoint workflow. Approval boundaries unchanged: no commit, push, or external sync.

Update `AI_HANDOFF.md` with the current session state and produce a transfer packet.

Run: `git branch --show-current`, `git status --short`, `git log --oneline -5`

Update `AI_HANDOFF.md` to reflect:
- Status (active / paused / closed)
- Active package and branch
- What was done in this session (completed steps)
- What remains (incomplete steps)
- What is blocked and why
- Next exact action for the incoming session
- File-level warnings that apply

Then output a transfer block to chat:

> **TRANSFER PACKET**
> Package: … | Branch: … | HEAD: … | Done: … | Remaining: … | Blocked: … | Next action: … | Handoff file: updated ✓

Do not commit. Do not push. The handoff write is the deliverable.

If the working tree is dirty, describe the uncommitted changes in the handoff under "Work remaining."

Full protocol: `docs/automation/operator-mode/context-continuity-protocol.md`
Trigger phrases that invoke this: "checkpoint", "handoff", "before compact", "resume packet", "context guard", "save state", "pause here"
