# Report Mirror Policy — AI Project OS v1.7 Gate 3

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 3 — Report Mirroring and Project-Control Log Intake, 2026-06-01)
**Applies to:** Claude Code and Codex in this repository
**Companion to:** `docs/dev/closeout-sync-contract.md`, `docs/project-control/report-intake-runbook.md`, `scripts/report-mirror-intake.mjs`

---

## Purpose

Report mirroring keeps durable project truth out of chat history. Without mirroring, closeout reports, planning reports, external sync results, handoff packets, and OS audit results exist only in conversation threads — which are ephemeral, session-local, and non-searchable from git.

The goal is not to dump raw chat transcripts into the repo. The goal is to capture sanitized operational summaries — who did what, on which branch, with which outcomes, what comes next — so that the repo itself holds the project's operational history.

---

## What mirroring means

**Mirroring does not mean:**
- Committing raw Claude Code session exports or chat transcripts
- Committing private ChatGPT conversation exports
- Copying full conversation logs into any committed file
- Committing OAuth tokens, credential files, or local sync maps

**Mirroring means:**
- Creating a sanitized summary of a meaningful closeout or planning report
- Capturing key operational facts: branch, HEAD, files changed, tests run, external operations, next action, blockers
- Appending that summary to a committed project-control log (`report-mirror-log.md`)
- Redacting any credential-like or token-like strings before committing

---

## What is mirrored vs what is not

### Committed (via mirror log)

- Sanitized package closeout summary: branch, HEAD, scope, files changed, tests passed, external operations, next action
- Sanitized planning gate report: gate name, decision, authorized scope, blockers, next action
- Sanitized handoff packet summary: package state, branch, what is done, what remains
- Sanitized external sync report summary: operation type, counts, result, external system, no raw event IDs
- Sanitized OS audit result: pass/warn/fail counts, verdict
- Sanitized incident or advisory summary: nature, resolution, no credential contents

### Not committed (stays local or in chat)

- Raw Claude Code transcript or session export
- Raw ChatGPT conversation export
- Local generated report artifacts in `local-reports/` or `local-report-intake/`
- OAuth tokens, API credentials, client secrets
- `docs/project-control/external-sync-map.local.json` contents
- Personal filesystem paths beyond repo-relative paths
- Raw sync artifacts from `local-sync-reports/`
- Any content matching high-risk secret patterns (even if the secret is fake/test)

---

## When a mirror entry is mandatory

A mirror entry is required (MIRRORED or a stated SKIPPED/NOT NEEDED) at every:

| Trigger | Expected mirror outcome |
|---|---|
| Package closeout (any package, any branch) | MIRRORED — summary entry with branch, HEAD, files, tests, next action |
| Merge to main | MIRRORED — merge summary, resulting HEAD |
| Commit closeout on main (state-sync) | MIRRORED — or NOT NEEDED if trivial cosmetic hash lag only |
| OS gate closeout (v1.7 Gate 1, Gate 2, Gate 3...) | MIRRORED |
| External sync operation (Google Calendar, GitHub Projects) | MIRRORED — or SKIPPED with reason for local-only dry-runs |
| Major planning change (new gate, decision, priority shift) | MIRRORED |
| Branch handoff (Claude ↔ Codex) | MIRRORED |
| OS audit run that changes the verdict | MIRRORED |
| Incident or advisory resolution | MIRRORED |

---

## When mirroring can be skipped

| Scenario | Mirror outcome | Reason |
|---|---|---|
| Typo fix or trivial wording cleanup | SKIPPED — no operational value | No scope, no state change |
| Cosmetic Post-Commit State Rule hash lag only | NOT NEEDED | Hash lag is not an operational change |
| Local dry-run with no external operation | SKIPPED — local artifact only | No committed change resulted |
| Validator run with unchanged result | SKIPPED | No new information; last MIRRORED entry still accurate |
| Report contains sensitive data and cannot be sanitized | BLOCKED until sanitized | Must sanitize before committing |

Skipped or not-needed entries must be stated explicitly in the closeout report:
- `SKIPPED — [reason]`
- `NOT NEEDED — [reason]`
- `BLOCKED — [reason; follow-up required]`

Report mirroring is required as a **check** at every closeout. It is not required as a **committed log entry** every time.

---

## Automation: what is and is not automatic

### Script-assisted (implemented in Gate 3)

- Local file intake via `--input <path>`
- Stdin intake via `--stdin`
- Redaction check and pattern detection
- Safe metadata extraction (branch, HEAD, files, tests, next action)
- Sanitized preview in dry-run mode
- Append to `docs/project-control/report-mirror-log.md` with `--apply`
- Report schema validation

### Manual paste (supported in Gate 3)

- User or agent pastes a closeout report into a local ignored file under `local-report-intake/`
- User or agent pipes text into stdin
- Used when a report exists only in Claude or ChatGPT chat and no safe transcript file exists
- Does not mean raw chat history is committed — the paste feeds into the script's sanitization step, not directly into the committed log

### Future automatic (deferred — not implemented in Gate 3)

Claude Code transcript and session output hook capture. This would require:
- A stable, documented, privacy-safe transcript output format from the Claude Code harness
- A verified hook mechanism that captures only the current session (not all sessions)
- A clear understanding of what private data may appear in transcripts
- Coordinator authorization and a separate gate

**Do not claim automatic transcript capture is implemented in Gate 3.** It is not. Hook-based capture is MONITOR/IMPLEMENT LATER.

---

## Redaction safeguards

The intake script redacts or rejects any input containing:

- `ghp_` GitHub personal access token patterns
- `github_pat_` GitHub fine-grained PAT patterns
- `ghs_` GitHub secret key patterns
- `-----BEGIN PRIVATE KEY-----` or similar PEM block headers
- `GOCSPX-` Google OAuth client secret patterns
- `ya29.` Google OAuth access token patterns
- `1//` Google OAuth refresh token patterns
- Generic `client_secret` + value patterns
- Content that was read from credential or token files

If high-risk secret patterns are detected, the script exits 1 and refuses to process unless `--redact-risk-accepted` is explicitly provided. The script never prints detected secret values in output.

---

## Post-Commit State Rule

The Post-Commit State Rule applies to mirror entries:

- A mirror entry may describe the pre-commit verified state or the expected post-commit state.
- Commit hashes belong in the mirror entry body, not in the committed summary only after the commit lands.
- Cosmetic HEAD lag in a mirror entry does not require a follow-up mirror entry.
- The next session verifies HEAD during preflight; that verification is the corrective control.

Canonical rule: `docs/ai-system/universal-standards.md` § "Post-Commit State Rule"

---

## Package 5B

Package 5B remains blocked until AI Project OS v1.7 all gates are complete and the Coordinator explicitly authorizes product work. No report mirror entry authorizes Package 5B. No report mirror entry changes this rule.

---

## Raw transcript capture vs report mirroring

These are distinct and complementary — not alternatives:

| | Raw transcript capture | Report mirroring |
|---|---|---|
| **Purpose** | Full verbatim final response for operator review | Sanitized operational summary for repo history |
| **Committed** | No — local only, gitignored | Yes — `report-mirror-log.md` |
| **Content** | Full verbatim response | Stripped down to key operational facts |
| **Trigger** | Every operationally significant final response | Every meaningful closeout event |
| **Path** | `raw-transcripts/claude-code/` | `docs/project-control/report-mirror-log.md` |

A raw transcript file for a closeout may be used as input to the `report-mirror-intake.mjs` script. Always run `--redact-only` first to confirm no credential-adjacent content is present before passing to `--apply`.

Protocol: `docs/dev/raw-transcript-capture-protocol.md`
Script: `scripts/raw-transcript-check.mjs`

---

## Local paths for raw artifacts

Raw transcripts, local report artifacts, and generated intake files must stay at:

- `raw-transcripts/claude-code/` — gitignored (verbatim final response files)
- `local-reports/` — gitignored
- `local-report-intake/` — gitignored
- `local-sync-reports/` — gitignored

These paths are covered by `.gitignore`. Do not commit files from these paths.
