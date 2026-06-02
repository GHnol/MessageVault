---
name: raw-transcript-capture
description: Execute the file-first response record protocol — write the full planned final response to a local gitignored file before returning it in chat, and include the capture status block. This is Type 1 capture; it is not a byte-for-byte terminal transcript.
---

## Purpose

Capture the full planned final Claude Code response into a local gitignored file under `raw-transcripts/claude-code/` before or at the same time as it is returned in chat. This is operator reliability infrastructure — not report mirroring, not a product feature.

**Two types of capture exist.** This skill implements Type 1 only:

| Type | Status | What it provides |
|---|---|---|
| **Type 1: File-first response record** | IMPLEMENTED (this skill) | Claude's planned response written to file before chat output; substantive match |
| **Type 2: True terminal transcript** | NOT YET IMPLEMENTED | Exact byte-for-byte terminal output; requires terminal-level logging |

Claude must state the correct capture type in the status block. It must not claim "raw transcript exact match" unless Type 2 is active and verified.

## When to use

- Before returning any operationally significant final response:
  - Package closeout or handoff reports
  - Pre-commit gate reports
  - Weekly sync reports
  - OS audit results
  - Operator Reliability Repair reports
  - Any structured report the Coordinator has asked to be captured
- When the Coordinator invokes `/raw-transcript-capture` explicitly
- As a step within the `closeout`, `handoff`, and `precommit` skills

Minor one-line responses, tool-result acknowledgements, status checks, and conversational back-and-forth do not require capture.

**Invocation type:** User-invoked. Also required as a step within closeout and handoff workflows.

## Files to read

1. `docs/dev/raw-transcript-capture-protocol.md` — full protocol, type definitions, honest limitation statement

## Protocol steps (Type 1)

1. **Compose** the full final response in context. Do not begin returning it in chat yet.
2. **Confirm gitignore:** run `git check-ignore -v raw-transcripts/example.md` — must confirm `raw-transcripts/` is covered.
3. **Write** the composed response to a file:
   ```
   raw-transcripts/claude-code/<YYYY-MM-DD>T<HHmmss>-<short-task-slug>.md
   ```
4. **Confirm** the file does not appear in `git status --short`.
5. **Return** the same composed content as the chat response.
6. **Append** the capture status block at the end of the chat response.

## Capture status block — required values

Use **exactly one** of the following at the end of every captured response:

**File written before response — Type 1, normal:**
```
---
**Response record:** `raw-transcripts/claude-code/<filename>`
**Capture type:** File-first response record (Type 1)
**Written before final response:** yes
**Gitignored:** yes
**Appears in git status:** no
**Note:** Substantive content matches planned response. Not a byte-for-byte terminal transcript.
---
```

**True terminal transcript active — Type 2 (not yet available):**
```
---
**Response record:** `raw-transcripts/terminal/<filename>`
**Capture type:** True terminal transcript (Type 2)
**Terminal logging active:** yes
**Gitignored:** yes
**Appears in git status:** no
**Note:** Byte-for-byte terminal output captured.
---
```

**Capture failed:**
```
---
**Response record:** not written — [reason]
**Capture type:** none — capture failed
**Note:** Response in chat only.
---
```

**Claim rules:**
- Say "File-first response record written" when Type 1 is used
- Say "True terminal transcript capture active" only when Type 2 is verified and active
- Say "Capture failed" when neither succeeded
- NEVER say "raw transcript exact match" when only Type 1 is in use

## Hard stop conditions

- Do not include credentials, tokens, local sync map contents, or private file contents in the record file.
- Do not commit the file — it is gitignored and must stay local.
- Do not claim "byte-for-byte terminal transcript" — that claim requires Type 2. Type 1 is "file-first response record."
- If the response contains sensitive data that cannot be redacted, skip file write and use the "capture skipped" status block.

## Verification

```
node scripts/raw-transcript-check.mjs
```

Verifies Type 1 infrastructure: gitignore, directory, protocol doc, skill file. Does not verify Type 2 readiness (not yet implemented).

## Approval boundaries

- Does not commit, push, or merge.
- Writing to `raw-transcripts/claude-code/` is always safe — files are gitignored.
- The Coordinator may delete or archive raw transcript files at any time.
- Implementing Type 2 (true terminal transcript) requires explicit Coordinator authorization.

## Backed by

`docs/dev/raw-transcript-capture-protocol.md`
`scripts/raw-transcript-check.mjs`
