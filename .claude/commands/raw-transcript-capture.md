This command delegates to the **raw-transcript-capture** skill (`.claude/skills/raw-transcript-capture/SKILL.md`).

## What it does

Executes the file-first response protocol: composes the full final response, writes it to `raw-transcripts/claude-code/<timestamp>-<task>.md` (gitignored), confirms the file does not appear in `git status`, then returns the same content in chat with a metadata block appended.

## Approval boundaries

- Does not commit, push, or merge.
- Raw transcript files are gitignored — they are local only, never committed.
- This command does not alter `AI_HANDOFF.md` or any repo state.

## Backed by

`.claude/skills/raw-transcript-capture/SKILL.md`
`docs/dev/raw-transcript-capture-protocol.md`
`scripts/raw-transcript-check.mjs`
