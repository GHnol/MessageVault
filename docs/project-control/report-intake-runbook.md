# Report Intake Runbook — AI Project OS v1.7 Gate 3

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 3 — Report Mirroring and Project-Control Log Intake, 2026-06-01)
**Companion to:** `docs/project-control/report-mirror-policy.md`, `docs/project-control/report-mirror-schema.md`, `scripts/report-mirror-intake.mjs`

---

## Overview

This runbook explains how to create a sanitized mirror entry in `report-mirror-log.md` from a closeout report, planning report, external sync report, or handoff packet.

Default mode for all intake operations is dry-run. Nothing is committed until `--apply` is used and the Coordinator authorizes the commit.

---

## When report mirroring is mandatory

At every meaningful closeout (per `docs/dev/closeout-sync-contract.md`):

- Package closeout (complete, paused, or blocked)
- Merge to main
- OS gate closeout
- External sync operation (dry-run or apply)
- Major planning change (new gate, decision, priority shift)
- Branch handoff (Claude ↔ Codex)
- OS audit run with a new verdict
- Incident or advisory resolution

The closeout or handoff skill will prompt for a mirror status. The agent must state one of:
- `MIRRORED` — sanitized entry added to `report-mirror-log.md`
- `SKIPPED` — with explicit reason
- `NOT NEEDED` — with explicit reason (e.g., trivial cosmetic edit)
- `BLOCKED` — with follow-up (e.g., report contains sensitive data)

---

## Method 1: Script-assisted intake from a local file

**Use when:** the report is available as a local ignored file (e.g., pasted into `local-report-intake/`).

**Step 1 — Create the local file**

```
# Create the local directory if needed (gitignored)
# Paste the report content into a local file
local-report-intake/gate-3-closeout.md
```

**Step 2 — Dry-run the intake**

```
node scripts/report-mirror-intake.mjs \
  --input local-report-intake/gate-3-closeout.md \
  --type package_closeout \
  --dry-run
```

Review the output:
- Confirm the detected report type is correct
- Confirm the extracted metadata (branch, HEAD, tests, next action)
- Confirm redaction notes (what was detected and redacted)
- Confirm no high-risk secrets were found

**Step 3 — Apply (only after Coordinator review)**

```
node scripts/report-mirror-intake.mjs \
  --input local-report-intake/gate-3-closeout.md \
  --type package_closeout \
  --apply
```

This appends a sanitized entry to `docs/project-control/report-mirror-log.md`. It does not commit.

**Step 4 — Review the appended entry**

```
# Review the appended entry
cat docs/project-control/report-mirror-log.md
```

Confirm the sanitized summary is accurate and contains no sensitive data.

**Step 5 — Include in the commit**

The updated `report-mirror-log.md` is staged and committed as part of the Gate closeout commit. It is the only artifact from the local intake that enters the committed repo.

---

## Method 2: Script-assisted intake from stdin

**Use when:** the report exists in chat and cannot be safely exported to a file, or when piping from another command.

```
echo "Closeout report content..." | \
  node scripts/report-mirror-intake.mjs \
  --stdin \
  --type package_closeout \
  --dry-run
```

Or pipe directly:

```
node scripts/my-script.mjs --output-report | \
  node scripts/report-mirror-intake.mjs \
  --stdin \
  --type audit \
  --dry-run
```

For apply:

```
cat local-report-intake/content.md | \
  node scripts/report-mirror-intake.mjs \
  --stdin \
  --type handoff \
  --apply
```

---

## Method 3: Manual paste intake

**Use when:** the report exists only in Claude or ChatGPT chat and there is no safe way to export it to a file.

1. Copy the closeout report text from the chat.
2. Create a local ignored file: `local-report-intake/manual-closeout.md`
3. Paste the content into the local file.
4. Run dry-run intake (Method 1 steps 2–5 above).

**Important:** The paste feeds into the script's sanitization step, not directly into the committed log. The local paste file is ignored by git.

---

## Redact-only mode

**Use when:** you want to see what would be redacted before deciding to apply.

```
node scripts/report-mirror-intake.mjs \
  --input local-report-intake/report.md \
  --redact-only
```

Output shows the sanitized version and lists what was redacted. No entry is appended.

---

## How to handle raw transcript exports

1. **Never commit raw exports.** Claude Code session exports and ChatGPT conversation exports are private.
2. Store them at `local-reports/` or `local-report-intake/` — both are gitignored.
3. Run the intake script in `--redact-only` mode first to preview sanitization.
4. If the redacted version is still too raw (full conversation visible, personal context, etc.), do not use it as intake. Write the sanitized summary manually instead.
5. Never pipe a full raw transcript into `--apply` mode.

---

## How to redact sensitive data

The intake script automatically detects and redacts these patterns:
- `ghp_...` — GitHub personal access tokens
- `github_pat_...` — GitHub fine-grained PATs
- `ghs_...` — GitHub secret keys
- `-----BEGIN PRIVATE KEY-----` — PEM private key blocks
- `GOCSPX-...` — Google OAuth client secrets
- `ya29....` — Google OAuth access tokens
- `1//...` — Google OAuth refresh tokens

For data that the script does not detect automatically:
- Remove it manually before using the file as intake.
- Do not use `--redact-risk-accepted` to bypass the rejection; instead, sanitize the source first.

If the script rejects input due to secret-risk detection:
```
ERROR: High-risk secret pattern detected. Input rejected.
Pattern: [pattern type, not the value]
Use --redact-risk-accepted only after manually verifying no actual secrets are present.
```

To accept risk (only if you have verified no real secrets are present):
```
node scripts/report-mirror-intake.mjs \
  --input local-report-intake/report.md \
  --type package_closeout \
  --dry-run \
  --redact-risk-accepted
```

---

## How to reject or skip a report

If a report cannot be sanitized or has no operational value:

1. In the closeout report (in chat), state the mirror outcome explicitly:
   - `SKIPPED — [reason]`
   - `NOT NEEDED — [reason]`
   - `BLOCKED — report contains credential-adjacent content; follow-up: sanitize and resubmit`

2. Do not run `--apply`. No entry is added to the mirror log.

3. The next session sees the last mirrored entry date in `report-mirror-log.md`. If the gap is large, the Coordinator may request backfill.

---

## How report mirroring interacts with state-freshness-check.mjs

`node scripts/state-freshness-check.mjs` does not check the mirror log. Mirroring is a complementary concern: freshness checks catch stale operational state (wrong branch, wrong package, stale blockers); mirroring captures operational history (what was done, when, on which branch).

Running the freshness check before intake confirms the repo state you are mirroring is current:
```
node scripts/state-freshness-check.mjs
node scripts/report-mirror-intake.mjs --input local-report-intake/report.md --type package_closeout --dry-run
```

---

## How report mirroring interacts with closeout-sync-contract.md

`docs/dev/closeout-sync-contract.md` defines when a sync check is required. Report mirroring is an additional step at every meaningful closeout. The order is:

1. Run `node scripts/state-freshness-check.mjs` (freshness check)
2. Run sync check (verify `AI_HANDOFF.md`, `CURRENT_STATE.md`, sprint, kanban)
3. Run report intake dry-run (`--dry-run`)
4. Coordinator reviews
5. If approved: run `--apply` and include in the closeout commit

---

## CLI quick reference

```
# Help
node scripts/report-mirror-intake.mjs --help

# Dry-run from file
node scripts/report-mirror-intake.mjs --input <path> [--type <type>] [--dry-run]

# Dry-run from stdin
node scripts/report-mirror-intake.mjs --stdin [--type <type>] [--dry-run]

# Apply (write sanitized entry to mirror log)
node scripts/report-mirror-intake.mjs --input <path> --type <type> --apply

# Redact-only preview
node scripts/report-mirror-intake.mjs --input <path> --redact-only

# JSON output
node scripts/report-mirror-intake.mjs --input <path> --json

# Override output path
node scripts/report-mirror-intake.mjs --input <path> --apply --output docs/project-control/report-mirror-log.md

# Accept redaction risk (only after manual verification — no real secrets present)
node scripts/report-mirror-intake.mjs --input <path> --redact-risk-accepted --dry-run
```

---

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Dry-run succeeded or apply succeeded |
| 1 | Missing input, unsupported type, secret-risk rejection (without `--redact-risk-accepted`), missing output path, schema failure, write error |
