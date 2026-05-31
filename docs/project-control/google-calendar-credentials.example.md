# Google Calendar Credentials — Setup Guide

**Status:** ACTIVE (introduced in AI Project OS v1.6 Google Calendar Live Sync, Gate 1, 2026-05-30; updated Gate 2D Repair, 2026-05-31 — canonical paths aligned)
**Owner:** Coordinator / Project Control
**Purpose:** Documents the credential setup process for Google Calendar API access. This file contains no secrets, tokens, or credentials. It is committed and safe to share.

---

## Credential safety rules (non-negotiable)

- **Never commit credentials.** No OAuth token, client secret, or refresh token belongs in the repo.
- **Never print tokens.** No script may output a token, client secret, or refresh token to stdout.
- **Never share token files.** Credential files stay on your local machine only.
- **Gate 1 does not use credentials.** Source validation and local dry-run require no credentials.
- **Gate 2 requires read-only credentials.** Live dry-run reads calendar events only.
- **Gate 3 requires read-write credentials.** Apply creates and updates events.

---

## Canonical credential paths (v1.6 Gate 2D Repair standard)

| Role | Canonical path |
|---|---|
| **Credential file** | `docs/project-control/google-calendar-credentials.local.json` |
| **Token file** | `docs/project-control/google-calendar-token.local.json` |

These are the default paths used by all v1.6 scripts. Place credential files at these paths.

## Gitignored credential files

The following files are gitignored and must NEVER be committed:

| File | Purpose |
|---|---|
| `docs/project-control/google-calendar-credentials.local.json` | **Canonical** OAuth2 credential file |
| `docs/project-control/google-calendar-token.local.json` | **Canonical** OAuth2 token written by bootstrap script |
| `google-calendar-credentials.json` | Legacy root credential (supported via `--allow-legacy-root-credentials` only) |
| `token.json` | Legacy root token (supported via `--allow-legacy-root-credentials` only) |
| `**/token.json` | token.json in any subdirectory |
| `google-calendar-token.json` | Alternate token filename |
| `*.oauth-token.json` | Any oauth-token.json file |

These protections are in `.gitignore`. Verify with:
```
git check-ignore -v docs/project-control/google-calendar-credentials.local.json
git check-ignore -v docs/project-control/google-calendar-token.local.json
git check-ignore -v token.json
git check-ignore -v google-calendar-credentials.json
```

---

## Preferred auth path

**User OAuth 2.0** (recommended for solo founder):
- Authorize once via browser.
- Refresh token stored locally in `docs/project-control/google-calendar-token.local.json` (gitignored).
- Simple setup; no service account provisioning needed.
- Credentials expire only if the refresh token is revoked or the app's OAuth consent is withdrawn.

**Service account** (alternative):
- Create a Google Cloud service account; share the calendar with the service account email.
- More secure for multi-user setups; not required for a solo project.
- Requires a service account JSON key file (gitignored).

**v1.6 recommendation:** User OAuth. Service account can be migrated to in a later phase.

---

## Required Google API scope

| Gate | Scope | API |
|---|---|---|
| Gate 2 (dry-run, read-only) | `https://www.googleapis.com/auth/calendar.readonly` | List events, read event details |
| Gate 3 (apply, create/update) | `https://www.googleapis.com/auth/calendar.events` | Create, update events |
| Gate 3 (delete/cancel) | `https://www.googleapis.com/auth/calendar.events` | Same scope; gated by `--delete` flag |

---

## One-time setup steps (Gate 2B prerequisites)

1. **Create a Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create a new project (e.g. "KeepMees Calendar Sync").

2. **Enable Google Calendar API**
   - In the project, go to APIs & Services → Library.
   - Search for "Google Calendar API" and enable it.

3. **Create OAuth 2.0 credentials**
   - Go to APIs & Services → Credentials.
   - Create credentials → OAuth client ID.
   - Application type: Desktop app.
   - Download the credentials JSON file.
   - Save it at the **canonical path**: `docs/project-control/google-calendar-credentials.local.json`
   - Verify it is gitignored: `git check-ignore -v docs/project-control/google-calendar-credentials.local.json`

4. **Check auth readiness**
   ```
   node scripts/google-calendar-auth-bootstrap.mjs --auth-status
   ```
   This reports whether the credential file is present and gitignored, and whether the token is present — without reading any contents.

5. **Run the one-time OAuth bootstrap (requires explicit Coordinator authorization)**
   ```
   node scripts/google-calendar-auth-bootstrap.mjs --init-oauth
   ```
   - The script generates a Google authorization URL and opens it in your browser.
   - Authorize in your browser and paste the code back in the terminal.
   - The script saves the refresh token to `docs/project-control/google-calendar-token.local.json` (gitignored).
   - Token contents are never printed.
   - Verify the token path is gitignored: `git check-ignore -v docs/project-control/google-calendar-token.local.json`

6. **Verify readiness**
   ```
   node scripts/google-calendar-sync-dry-run.mjs --auth-status
   ```
   Expected: `STATUS: READY`

7. **Run live read-only dry-run (requires separate Coordinator authorization)**
   ```
   node scripts/google-calendar-sync-dry-run.mjs --live-readonly
   ```
   Reads calendar events only. No mutations.

---

## Dependency requirement (googleapis)

The Gate 2 and Gate 3 scripts require the `googleapis` npm package for Google Calendar API access.

| Detail | Value |
|---|---|
| Package | `googleapis` |
| Version (recommended) | `^144.0.0` or latest stable |
| Install location | `scripts/` directory (scripts-local, not root package) |
| Install command | `cd scripts && npm install googleapis` |
| Root package.json | **Do NOT modify.** Install only in scripts/ dependency area. |

**Gate 1 does not install this package.** Installation requires separate Coordinator approval.

**Coordinator approval question for Gate 2:**
> "Approve installation of `googleapis` npm package in the `scripts/` directory for Gate 2 live dry-run. Package: `googleapis`, latest stable. Install command: `cd scripts && npm install googleapis`. This does not modify root `package.json`."

The local dry-run scripts (Gate 1 only) are dependency-free. Only Gate 2+ live API calls require `googleapis`.

---

## Detecting missing credentials

Use the auth status check (no file contents read):
```
node scripts/google-calendar-auth-bootstrap.mjs --auth-status
node scripts/google-calendar-sync-dry-run.mjs --auth-status
```

When the token is missing but credentials are present, the scripts report:
```
STATUS: OAUTH_BOOTSTRAP_REQUIRED
  Credential file found. Token not yet generated.
  Run OAuth bootstrap (requires explicit Coordinator authorization):
    node scripts/google-calendar-auth-bootstrap.mjs --init-oauth
```

When the credential file is missing:
```
STATUS: CREDENTIAL_MISSING
  Place credentials at: docs/project-control/google-calendar-credentials.local.json
  See: docs/project-control/google-calendar-credentials.example.md
```

Scripts exit non-zero when credentials or token are absent in live mode.

---

## Credential blocker handling

If credentials cannot be configured (e.g. Google Cloud access not available, OAuth consent screen limitations):

1. Record the blocker in `google-calendar-sync-log.md`:
   ```
   ## YYYY-MM-DD — Gate 2 blocked: credentials unavailable
   - Status: BLOCKED
   - Reason: <specific reason>
   - Unblock path: <what would allow credentials to be set up>
   ```
2. v1.6 Gate 2 and Gate 3 are considered blocked (not failed).
3. v1.6 is still considered complete when the blocker is documented with a clear unblock path.
4. Run Gate 2 and Gate 3 when the blocker is resolved.

---

## Gate 1 credential status

Gate 1 does NOT run the OAuth flow. Gate 1 does NOT create any credential files.

Gate 1 local dry-run validates source records against the schema only — no Google API calls.

The credential setup described above is required ONLY for Gate 2 and Gate 3.
