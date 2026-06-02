---
name: report-intake
description: Run the KeepMees report mirror intake sequence — sanitize and preview a closeout or planning report, then apply a sanitized summary to the committed project-control mirror log.
---

## Purpose

Capture sanitized operational summaries from closeout reports, planning gates, handoff packets, and external sync results into `docs/project-control/report-mirror-log.md`. Prevents operational history from living only in chat. Does not commit raw transcripts, credentials, or local artifacts.

## When to use

- At every meaningful package closeout, OS gate closeout, or merge
- After any external sync operation (Google Calendar, GitHub Projects)
- After an external sync consistency check that produced a meaningful FAIL or PASS result (use `--type os_audit` or appropriate type)
- After any major planning change or Coordinator decision
- After any branch handoff (Claude ↔ Codex)
- After an OS audit run with a new verdict
- After an incident or advisory resolution
- When the closeout or handoff skill flags that a mirror entry is needed

**Invocation type:** User-invoked. Also triggered as a required step by the `closeout` and `handoff` skills. The agent must run a mirror check at every meaningful closeout, even without an explicit command.

## Files to read

1. `docs/project-control/report-mirror-policy.md` (what to mirror and what not to)
2. `docs/project-control/report-mirror-schema.md` (field definitions and entry format)
3. `docs/project-control/report-mirror-log.md` (the committed log to append to)
4. `docs/project-control/report-intake-runbook.md` (full process)
5. `docs/dev/closeout-sync-contract.md` (when mirroring is mandatory)

## Required git preflight

Run before any intake operation:

- `git branch --show-current`
- `git status --short`

## Input rules

1. Input must come from `--input <local-path>` or `--stdin`.
2. Local input files must be at `local-report-intake/` or `local-reports/` (gitignored paths).
3. Never pipe raw transcript exports directly to `--apply` without a dry-run review first.
4. For reports that exist only in chat, paste the content into a local ignored file first.
5. If no safe input is available, state `SKIPPED — report exists only in chat; no safe intake path` in the closeout report.

## Redaction rules

1. The script automatically redacts: `ghp_*` tokens, `github_pat_*` tokens, `ghs_*` tokens, `-----BEGIN PRIVATE KEY-----` blocks, `GOCSPX-*` Google client secrets, `ya29.*` access tokens, `1//*` refresh tokens.
2. If high-risk patterns are detected, the script exits 1 and refuses to process unless `--redact-risk-accepted` is provided.
3. Never use `--redact-risk-accepted` unless you have manually verified no actual secrets are present in the input.
4. The script never prints detected secret values in any output.
5. Include redaction notes in the sanitized summary if anything was removed.

## Dry-run behavior

Default mode is dry-run. Dry-run:
- Reads and parses the input
- Runs redaction checks
- Extracts safe metadata
- Validates the detected or specified report type
- Prints a sanitized summary preview to stdout
- Reports what would be appended to `report-mirror-log.md`
- Does not write anything

```
node scripts/report-mirror-intake.mjs --input <path> --type <type> --dry-run
node scripts/report-mirror-intake.mjs --stdin --type <type> --dry-run
```

## Apply behavior

`--apply` appends a sanitized entry to `docs/project-control/report-mirror-log.md`.

Rules:
- Always run dry-run first; review output before apply
- Only apply after Coordinator or agent review of the dry-run output
- Apply does not commit — the updated mirror log is committed in the next closeout commit
- Apply uses the schema format defined in `report-mirror-schema.md`

```
node scripts/report-mirror-intake.mjs --input <path> --type <type> --apply
```

## Output format

**Dry-run output** (to stdout):
```
REPORT INTAKE DRY-RUN
=====================
Report type:     <type>
Source type:     <source_type>
Branch:          <branch>
HEAD:            <head>
Tests/validators: <summary>
External ops:    <summary>
Next action:     <next_action>
Package 5B:      <status>
Redaction notes: <what was redacted>

SANITIZED SUMMARY PREVIEW:
<sanitized summary text>

STATUS: DRY-RUN COMPLETE — no writes. Re-run with --apply to append to report-mirror-log.md.
```

**Apply output** (to stdout):
```
REPORT INTAKE APPLIED
=====================
Entry ID:    <report_id>
Appended to: docs/project-control/report-mirror-log.md
Mirror status: mirrored
```

## Raw transcript files vs report mirror input

Raw transcript files (`raw-transcripts/claude-code/*.md`) are the verbatim final Claude Code response — captured locally by the file-first response protocol. They are NOT the same as report mirror input.

- Raw transcript files are gitignored, local-only, and never committed.
- Report mirror input is sanitized and committed to `report-mirror-log.md`.
- If a raw transcript file exists for a closeout, it may be used as input for `--input` to the report-mirror-intake script, but run `--redact-only` first to confirm no credential-adjacent content is present.
- Never pipe a raw transcript file directly to `--apply` without a dry-run review.

See `docs/dev/raw-transcript-capture-protocol.md` for the file-first protocol.

## Hard stops

- Do not run `--apply` on input that has not passed a dry-run review.
- Do not run `--apply` on raw transcript files without dry-run review.
- Do not run `--apply` if the dry-run reports a secret-risk rejection.
- Do not commit `local-report-intake/` or `local-reports/` files.
- Do not use `--apply` on input from `local-sync-reports/` (external sync artifacts — reference only).
- Do not create live hooks; do not claim automatic transcript capture is implemented.

## Approval boundaries

- Dry-run: no approval needed.
- Apply: requires agent or Coordinator review of the dry-run output first.
- Commit of the updated `report-mirror-log.md`: requires explicit user instruction.
- This skill does not push or merge.

## Backed by

`docs/project-control/report-mirror-policy.md`
`docs/project-control/report-mirror-schema.md`
`docs/project-control/report-intake-runbook.md`
`docs/dev/closeout-sync-contract.md`
