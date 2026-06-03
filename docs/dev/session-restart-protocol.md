# Session Restart Protocol

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — required operating protocol

---

## Short command

Type `/start` to run this protocol automatically. The `/start` command reads the required files, runs `git` state checks, and produces the state declaration — no pasting needed.

---

## When this applies

- A brand-new session
- After `/clear`
- After `/compact`
- After a model switch
- After a tool switch (Claude ↔ Codex)
- After an account switch
- After any context summary or auto-compact event
- Resuming work the next day

In every one of these cases, assume you know nothing that is not in the repo.

---

## The restart sequence (do not skip steps)

1. Read `AGENTS.md`
2. Read `CLAUDE.md` (if Claude Code)
3. Read `AI_HANDOFF.md`
4. Read `CURRENT_STATE.md`
5. Run `git branch --show-current`
6. Run `git status --short`
7. Run `git log --oneline -10`
8. Run the start router to get a recommended startup route:
   ```
   node scripts/start-router.mjs
   ```
   BLOCKED verdicts are hard stops. NEEDS_* verdicts require action before proceeding. Use the verdict to decide whether to start fresh, continue, or update handoff first.
9. Read the package docs referenced in `AI_HANDOFF.md`
10. Read `NEXT_SESSION_PROMPT.md` for the current pointer
11. **State out loud, before editing anything:** current package, branch, objective, approved scope, hard exclusions, what is done, what remains, next exact action

Only after step 11 may any file be edited.

---

## Verification rules

- The repo is authoritative. If `AI_HANDOFF.md` says something the code or git state contradicts, the code/git state wins — and the stale handoff must be flagged.
- Do not trust any in-context summary of file contents. Open the file.
- Do not resume implementation from a compact summary alone.

### HEAD verification at preflight (Post-Commit State Rule)

Durable state files (`AI_HANDOFF.md`, `CURRENT_STATE.md`, `NEXT_SESSION_PROMPT.md`) are point-in-time snapshots. The `main HEAD` or branch-HEAD value inside them may legitimately lag the actual repo head by one commit — that is expected behavior under the Post-Commit State Rule (`docs/ai-system/universal-standards.md` § "Post-Commit State Rule"), not a bug to fix.

Always verify current `HEAD` during preflight:

- `git rev-parse HEAD`
- `git log --oneline -10`
- `git branch --show-current`

If the recorded HEAD differs from the actual HEAD by one commit and the named package / branch / scope / next action are still accurate, this is a cosmetic mismatch — proceed using the live `git` values. **Do not** propose a state-sync commit just to update the hash; do so only if the docs would misdirect the next agent (wrong branch, wrong package, wrong task, weakened scope, stale blocker).

**State-Zero rule:** Wrong active branch is NEVER cosmetic. If the state docs record a branch that does not match `git branch --show-current` — especially if they reference a merged `docs/sync-*` or `feature/*` branch while on `main` — that is a State-Zero FAIL requiring correction before proceeding. The Post-Commit State Rule does NOT excuse wrong active branch fields; it only excuses hash lag in narrative sections.

**Post-merge obligation:** After any merge to `main`, verify that state docs say "active branch: main" before ending the session. If they still point to the merged branch, run the State-Zero closeout checklist and create a correction commit before pushing.

Full protocol: `docs/dev/state-zero-closeout-protocol.md`

---

## Stop conditions

Stop and ask the Coordinator if:

- `AI_HANDOFF.md` is missing, blank, or older than the last commit on the active branch
- The handoff branch and `git branch` disagree
- There are unexplained modified files
- The active package is `closed` but the tree is dirty
- No package is authorized and you are being asked to write product/app code

---

## Output of a correct restart

A short statement in the chat:

> Package: … | Branch: … | Objective: … | Scope: … | Exclusions: … | Done: … | Remaining: … | Next action: …

Then proceed.

---

## Relationship to other protocols

- When to checkpoint before stopping: `context-hygiene-protocol.md`
- Automated startup routing: `scripts/start-router.mjs` (run at step 8 above)
- Model switch specifics: `model-switching-protocol.md`
- Tool switch specifics: `tool-switching-protocol.md`
- Operator Mode continuity: `docs/automation/operator-mode/context-continuity-protocol.md`
