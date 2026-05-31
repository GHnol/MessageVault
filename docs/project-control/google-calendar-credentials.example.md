# Google Calendar Credentials — Setup Guide

**Status:** ACTIVE (introduced in AI Project OS v1.6 Google Calendar Live Sync, Gate 1, 2026-05-30)
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

## Gitignored credential files

The following files are gitignored and must NEVER be committed:

| File | Purpose |
|---|---|
| `google-calendar-credentials.json` | OAuth2 client_id and client_secret (downloaded from Google Cloud Console) |
| `token.json` | OAuth2 refresh token written by the googleapis Node SDK |
| `**/token.json` | token.json in any subdirectory |
| `google-calendar-token.json` | Alternate token filename |
| `docs/project-control/google-calendar-token.local.json` | Token if stored in project-control dir |
| `*.oauth-token.json` | Any oauth-token.json file |

These protections are in `.gitignore`. Verify with:
```
git check-ignore -v token.json
git check-ignore -v google-calendar-credentials.json
```

---

## Preferred auth path

**User OAuth 2.0** (recommended for solo founder):
- Authorize once via browser.
- Refresh token stored locally in `token.json` (gitignored).
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

## One-time setup steps (Gate 2 prerequisites)

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
   - Save it as `google-calendar-credentials.json` in the repo root or `docs/project-control/`.
   - Verify it is gitignored: `git check-ignore -v google-calendar-credentials.json`.

4. **Run the one-time authorization flow**
   - The script `scripts/google-calendar-sync-dry-run.mjs --live` will detect missing credentials and print instructions.
   - Follow the printed URL to authorize in your browser.
   - The script saves a refresh token to `token.json` (gitignored).
   - Verify it is gitignored: `git check-ignore -v token.json`.

5. **Verify credentials work**
   ```
   node scripts/google-calendar-sync-dry-run.mjs --live
   ```
   If credentials are valid, the script will list your calendars and proceed to compare source records to live events.

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

The sync scripts detect credential absence and print clear guidance:

```
CREDENTIAL_MISSING — Google Calendar API credentials not found.

Expected credential file: google-calendar-credentials.json
Expected token file: token.json

To set up credentials, follow:
  docs/project-control/google-calendar-credentials.example.md

Gate 1 (local-only) operations do not require credentials.
Gate 2 (live dry-run) and Gate 3 (apply) require credentials.

Current gate status: LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING
```

Scripts exit non-zero with code `CREDENTIAL_MISSING` when credentials are absent in live mode.

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
