# Raw Transcript Capture Protocol — AI Project OS Operator Reliability Repair

**Status:** ACTIVE (introduced in Operator Reliability Repair, 2026-06-02; corrected 2026-06-02)
**Applies to:** Claude Code in this repository
**Companion to:** `docs/project-control/report-mirror-policy.md`, `docs/dev/closeout-sync-contract.md`

---

## Purpose

Provide a reliable local record of every operationally significant Claude Code final response. This is operator reliability infrastructure — not a product feature, not report mirroring, and not a substitute for `AI_HANDOFF.md`.

**Report mirroring** (Gate 3) captures *sanitized operational summaries* committed to the repo. This protocol captures *the planned final response content* locally, for operator review and debugging only. The two are complementary and distinct.

---

## Two types of capture — understand the difference

### Type 1: File-first final-response record (CURRENTLY IMPLEMENTED)

Claude composes the full intended final response, writes it to a local gitignored file using the `Write` tool, then returns the same planned content in chat.

**What this IS:**
- The canonical response record for every operationally significant turn
- Written from the same planned content as the chat response
- Captured before the chat response is returned
- Reliable for operator review of what Claude intended to output

**What this IS NOT:**
- A byte-for-byte capture of the exact text streamed to the terminal
- A true terminal transcript
- Technically guaranteed to be identical to what the user sees in the Claude Code terminal window

**Why it falls short of a true terminal transcript:** Claude Code streams tokens to the terminal as they are generated. The `Write` tool call executes before streaming begins, writing Claude's planned content. The streamed terminal output is then generated from the same plan, but is a fresh generation event. Minor differences (whitespace, line endings, slight phrasing variation during re-generation) can exist between the file and the exact terminal output.

**The honest claim when using Type 1:** "File-first response record written — substantive content matches planned response; not a byte-for-byte terminal transcript."

---

### Type 2: True terminal transcript capture (NOT YET IMPLEMENTED)

A true terminal transcript captures the exact bytes that appeared in the Claude Code terminal window — the actual streamed output. This requires terminal-level or process-level logging outside of Claude itself.

**What a true terminal transcript would provide:**
- Byte-for-byte record of the exact streamed terminal output
- Captures any differences between Claude's plan and its actual streamed output
- Operator-verifiable proof that the file matches what was seen in the terminal

**This is not yet implemented.** The options below are safe approaches to evaluate in a future authorized pass.

#### Safe terminal transcript options to evaluate

These require no new dependencies if using built-in OS/terminal features:

1. **PowerShell `Start-Transcript` / `Stop-Transcript`**
   - Native PowerShell cmdlet; no external dependencies
   - Captures everything printed to the PowerShell session
   - Usage: `Start-Transcript -Path "raw-transcripts/terminal/<timestamp>.log" -Append` at session start; `Stop-Transcript` at end
   - Limitation: captures all terminal output, not only Claude responses; may include tool call output and system messages
   - Safety: file must be gitignored; do not capture sessions containing credential output

2. **Terminal profile logging (if supported by the terminal emulator)**
   - Windows Terminal, iTerm2, and some other emulators have built-in session logging
   - No code changes required; configured in terminal preferences
   - Limitation: captures all terminal content for the session

3. **Wrapper script (tee-style) around the `claude` binary**
   - A thin wrapper script that pipes `claude` stdout/stderr through `tee` to a log file
   - Example: `claude "$@" 2>&1 | tee -a "raw-transcripts/terminal/$(date +%Y%m%d-%H%M%S).log"`
   - Limitation: may interleave tool call output with response text; requires care about what gets logged
   - No new npm dependencies required

4. **OS-level process logging**
   - Scripts, logging services, or audit tools at the OS level
   - Most powerful but most complex

**Constraints that apply to any terminal transcript implementation:**
- Output path must be gitignored — `raw-transcripts/` is already covered
- No credentials, tokens, local sync map contents, or private file contents may be present in the log
- No dependencies may be installed without separate Coordinator authorization
- Any new automation must be documented in this protocol before use

**Authorization required:** A future authorized pass must evaluate and implement one of the above options before claiming "true terminal transcript capture active." Do not implement any terminal capture mechanism without explicit Coordinator authorization.

---

## File-first response protocol (Type 1 — currently enforced procedurally)

**Applies to:** every Claude Code prompt that ends with a final response of operational significance — not only closeouts. Minor one-line answers, tool-result acknowledgements, and status checks are excluded.

**Operational significance examples:**
- Package closeout or handoff reports
- Pre-commit gate reports
- Weekly sync reports
- OS audit results
- Operator Reliability Repair reports
- Any structured report the Coordinator has asked to be captured

**When in doubt:** capture it. A surplus of local files in the ignored directory is harmless.

### Steps

1. **Compose** the full final response in context before beginning any output.
2. **Write** the composed response to the designated path using the `Write` tool. This must happen before the final response text appears in chat.
3. **Path convention:**
   ```
   raw-transcripts/claude-code/<YYYY-MM-DD>T<HHmmss>-<short-task-slug>.md
   ```
   Examples:
   - `raw-transcripts/claude-code/2026-06-02T143022-package-5b-closeout.md`
   - `raw-transcripts/claude-code/2026-06-02T150410-weekly-sync-report.md`
   - `raw-transcripts/claude-code/2026-06-02T161200-os-audit-result.md`

4. **Confirm gitignored:** run `git check-ignore -v raw-transcripts/claude-code/<file>` or `git status --short` and confirm the file does not appear.
5. **Return** the same composed content as the chat response.
6. **Include** the capture status block at the end of the response.

### Capture status block

Include one of these at the end of every response:

**When file was written before the chat response (Type 1 — normal):**
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

**When true terminal transcript capture is active (Type 2 — not yet implemented):**
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

**When the file was NOT written before the response:**
```
---
**Response record:** `raw-transcripts/claude-code/<filename>`
**Capture type:** File-first response record (Type 1) — post-hoc
**Written before final response:** no — response returned first; file written after
**Note:** Post-hoc capture; not guaranteed to match exactly.
---
```

**When capture failed:**
```
---
**Response record:** not written — [reason]
**Capture type:** none — capture failed
**Note:** Response in chat only.
---
```

**When sensitive data prevented capture:**
```
---
**Response record:** not written — response contains sensitive data that cannot be redacted
**Capture type:** skipped
**Note:** Response in chat only; operator may manually sanitize and save if needed.
---
```

**Claude must not use the phrase "raw transcript exact match" unless a verified Type 2 terminal capture mechanism is active.**

---

## Verification script

```
node scripts/raw-transcript-check.mjs
```

This script (dependency-free, read-only) verifies Type 1 infrastructure:
- `raw-transcripts/` is gitignored
- `raw-transcripts/claude-code/` exists or will exist on first use
- `git check-ignore` confirms the path is covered
- Lists the 5 most recently modified files in `raw-transcripts/claude-code/` (if any)
- Reports whether any files accidentally appear in `git status --short`

This script does NOT verify Type 2 (true terminal transcript) readiness — that mechanism is not yet implemented.

Exit 0 = Type 1 infrastructure ready. Exit 1 = infrastructure issue.

---

## What file-first response records must contain

A file-first response record must contain:

- The full final response, verbatim as composed
- All structured sections (no omissions)
- No condensed summaries — if the response has 10 numbered sections, the file has all 10
- The capture status block (or a note explaining why the protocol was not used)

A file-first response record must NOT contain:

- Credentials, tokens, OAuth secrets, or private file contents
- Content from `external-sync-map.local.json` or `google-calendar-token.local.json`
- Anything that would be rejected by the report mirror intake script's redaction checks
- Personal filesystem paths beyond repo-relative paths

If a response unavoidably contains sensitive data, redact before writing. Note the redaction in the capture status block.

---

## Path and gitignore status

`raw-transcripts/` is already covered by `.gitignore`. No new gitignore entry is needed.

```
# Confirmed gitignore entry (line 29 of .gitignore as of 2026-06-02):
raw-transcripts/
```

To verify at any time:
```
git check-ignore -v raw-transcripts/claude-code/example.md
```

Expected output: `.gitignore:<line>:raw-transcripts/	raw-transcripts/claude-code/example.md`

---

## Relationship to report mirroring

| | File-first response record (Type 1) | True terminal transcript (Type 2) | Report mirroring |
|---|---|---|---|
| **Status** | Implemented — procedurally enforced | Not yet implemented | Implemented (Gate 3) |
| **Purpose** | Planned response record for operator review | Exact terminal output record | Sanitized operational summary for repo history |
| **Committed** | No — local only, gitignored | No — local only, gitignored | Yes — `report-mirror-log.md` |
| **Content** | Full planned response | Exact streamed terminal bytes | Key operational facts only |
| **Identity with terminal** | Substantive match; not byte-for-byte guaranteed | Byte-for-byte guaranteed | Not applicable |
| **Trigger** | Every operationally significant final response | All Claude Code output (if enabled) | Every meaningful closeout event |

---

## What is enforced vs what is procedural

| Mechanism | Status |
|---|---|
| `raw-transcripts/` gitignored | **Automatic** — git engine refuses to add |
| File-first record written before response | **Policy-driven** — Claude must follow the protocol; no harness enforcement |
| Type 1 substantive content match | **Policy-driven** — Claude claims file-first; exact identity with terminal cannot be technically guaranteed |
| Capture status block included in response | **Policy-driven** — Claude must include it; no harness enforcement |
| `scripts/raw-transcript-check.mjs` verifies Type 1 infrastructure | **Semi-automatic** — script runs on demand |
| True terminal transcript capture (Type 2) | **Not yet implemented** — future authorized pass required |

---

## Backed by

`docs/dev/closeout-sync-contract.md` — when capture is mandatory (all meaningful closeouts)
`docs/project-control/report-mirror-policy.md` — distinction between file-first record and committed mirror
`scripts/raw-transcript-check.mjs` — Type 1 infrastructure verification
`.claude/skills/raw-transcript-capture/SKILL.md` — the invocable skill
