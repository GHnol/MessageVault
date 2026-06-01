#!/usr/bin/env node
/**
 * Google Calendar OAuth Bootstrap
 *
 * One-time credential setup for Gate 2B live dry-run and Gate 3 apply.
 * Does NOT call calendar event APIs.
 * Does NOT mutate Google Calendar.
 * Does NOT commit any files.
 * Never prints credential or token contents.
 *
 * Modes:
 *   --auth-status   Report credential/token readiness (no contents read, no API calls)
 *   --init-oauth    Run one-time OAuth authorization flow
 *                   (requires explicit Coordinator authorization before running)
 *
 * Canonical credential paths:
 *   Credential: docs/project-control/google-calendar-credentials.local.json
 *   Token:      docs/project-control/google-calendar-token.local.json
 *
 * Path override options:
 *   --credential-path <path>         Override credential file (must be gitignored)
 *   --token-path <path>              Override token file (must be gitignored)
 *   --allow-legacy-root-credentials  Fallback to root credential/token if canonical missing
 *                                    (warns LEGACY_ROOT_CREDENTIAL_PATH_USED)
 *
 * Usage:
 *   node scripts/google-calendar-auth-bootstrap.mjs --auth-status
 *   node scripts/google-calendar-auth-bootstrap.mjs --init-oauth
 *     (requires Coordinator authorization — generates token at canonical path)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);

const CANONICAL_CREDENTIALS_FILE = 'docs/project-control/google-calendar-credentials.local.json';
const CANONICAL_TOKEN_FILE = 'docs/project-control/google-calendar-token.local.json';
const LEGACY_CREDENTIALS_FILE = 'google-calendar-credentials.json';
const LEGACY_TOKEN_FILE = 'token.json';

// calendar.events covers both read (Gate 2B dry-run) and create/update (Gate 3 apply).
// calendar.readonly would block Gate 3 writes — do not revert to readonly-only.
const SCOPE_EVENTS = 'https://www.googleapis.com/auth/calendar.events';

const args = process.argv.slice(2);
const isAuthStatus = args.includes('--auth-status');
const isInitOAuth = args.includes('--init-oauth');
const allowLegacyRoot = args.includes('--allow-legacy-root-credentials');
const credPathIdx = args.indexOf('--credential-path');
const credPathArg = credPathIdx >= 0 ? args[credPathIdx + 1] : null;
const tokenPathIdx = args.indexOf('--token-path');
const tokenPathArg = tokenPathIdx >= 0 ? args[tokenPathIdx + 1] : null;

// ─── Gitignore check ───────────────────────────────────────────────────────

function isPathGitignored(relPath) {
  try {
    const result = execSync(`git check-ignore -v "${relPath.replace(/\\/g, '/')}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// ─── Path resolution ───────────────────────────────────────────────────────

function resolveCredPaths() {
  if (credPathArg && !isPathGitignored(credPathArg)) {
    console.error(`FATAL: --credential-path "${credPathArg}" is not gitignored. Refusing to use.`);
    process.exit(1);
  }
  if (tokenPathArg && !isPathGitignored(tokenPathArg)) {
    console.error(`FATAL: --token-path "${tokenPathArg}" is not gitignored. Refusing to use.`);
    process.exit(1);
  }

  let credFile = credPathArg || CANONICAL_CREDENTIALS_FILE;
  let tokenFile = tokenPathArg || CANONICAL_TOKEN_FILE;

  if (!credPathArg && allowLegacyRoot && !existsSync(join(ROOT, credFile))) {
    if (existsSync(join(ROOT, LEGACY_CREDENTIALS_FILE))) {
      console.log('LEGACY_ROOT_CREDENTIAL_PATH_USED — falling back to google-calendar-credentials.json (root).');
      console.log(`  Canonical preferred: ${CANONICAL_CREDENTIALS_FILE}`);
      credFile = LEGACY_CREDENTIALS_FILE;
    }
  }
  if (!tokenPathArg && allowLegacyRoot && !existsSync(join(ROOT, tokenFile))) {
    if (existsSync(join(ROOT, LEGACY_TOKEN_FILE))) {
      console.log('LEGACY_ROOT_CREDENTIAL_PATH_USED — falling back to token.json (root).');
      console.log(`  Canonical preferred: ${CANONICAL_TOKEN_FILE}`);
      tokenFile = LEGACY_TOKEN_FILE;
    }
  }

  return { credFile, tokenFile };
}

// ─── Auth status mode ──────────────────────────────────────────────────────

function runAuthStatus() {
  console.log(`\nGOOGLE CALENDAR AUTH STATUS — ${today}`);
  console.log('Source: scripts/google-calendar-auth-bootstrap.mjs --auth-status');
  console.log('Mode: AUTH STATUS — existence and gitignore checks only — no contents read');
  console.log('');

  const { credFile, tokenFile } = resolveCredPaths();

  const credExists = existsSync(join(ROOT, credFile));
  const tokenExists = existsSync(join(ROOT, tokenFile));
  const credIgnored = isPathGitignored(credFile);
  const tokenIgnored = isPathGitignored(tokenFile);

  console.log(`Credential file:  ${credFile}`);
  console.log(`  Present:        ${credExists ? 'YES' : 'NO — file missing'}`);
  console.log(`  Gitignored:     ${credIgnored ? 'YES' : 'NO — SAFETY FAILURE'}`);
  console.log('');
  console.log(`Token file:       ${tokenFile}`);
  console.log(`  Present:        ${tokenExists ? 'YES' : 'NO — OAuth bootstrap required'}`);
  console.log(`  Gitignored:     ${tokenIgnored ? 'YES' : 'NO — SAFETY FAILURE'}`);
  console.log('');

  if (!credIgnored) {
    console.log('FATAL: Credential path is not gitignored. Fix .gitignore before proceeding.');
    process.exit(1);
  }
  if (!tokenIgnored) {
    console.log('FATAL: Token path is not gitignored. Fix .gitignore before proceeding.');
    process.exit(1);
  }

  if (!credExists) {
    console.log('STATUS: CREDENTIAL_MISSING');
    console.log(`  Place your Google Cloud OAuth credentials at: ${credFile}`);
    console.log('  See: docs/project-control/google-calendar-credentials.example.md');
    process.exit(1);
  }

  if (!tokenExists) {
    console.log('STATUS: OAUTH_BOOTSTRAP_REQUIRED');
    console.log('  Credential file found. Token not yet generated.');
    console.log('  Run (requires explicit Coordinator authorization):');
    console.log('    node scripts/google-calendar-auth-bootstrap.mjs --init-oauth');
    process.exit(1);
  }

  console.log('STATUS: READY');
  console.log('  Credential and token files are present and gitignored.');
  console.log('  When authorized, run:');
  console.log('    node scripts/google-calendar-sync-dry-run.mjs --live-readonly');
  console.log('');
  console.log('---');
  console.log('No credential or token contents were read. No API calls were made.');
  process.exit(0);
}

// ─── OAuth init mode ───────────────────────────────────────────────────────

async function runInitOAuth() {
  console.log(`\nGOOGLE CALENDAR OAUTH BOOTSTRAP — ${today}`);
  console.log('Source: scripts/google-calendar-auth-bootstrap.mjs --init-oauth');
  console.log('');
  console.log('This will:');
  console.log('  1. Load your Google Cloud OAuth credentials (read-only, not printed).');
  console.log('  2. Generate a Google authorization URL.');
  console.log('  3. Open or print the URL for your browser.');
  console.log('  4. Accept your authorization code from the terminal.');
  console.log('  5. Exchange the code for a token (token contents not printed).');
  console.log(`  6. Save the token to: ${CANONICAL_TOKEN_FILE}`);
  console.log('  7. Verify the token path is gitignored.');
  console.log('');

  const { credFile, tokenFile } = resolveCredPaths();

  // Safety: token path must be gitignored before writing anything
  if (!isPathGitignored(tokenFile)) {
    console.error(`FATAL: Token path "${tokenFile}" is not gitignored. Will not write token.`);
    console.error('Fix .gitignore before running OAuth bootstrap.');
    process.exit(1);
  }

  const credPath = join(ROOT, credFile);
  if (!existsSync(credPath)) {
    console.error(`FATAL: Credential file not found: ${credFile}`);
    console.error('See: docs/project-control/google-calendar-credentials.example.md');
    process.exit(1);
  }

  // Load credentials — contents read here but never printed
  let credentials;
  try {
    credentials = JSON.parse(readFileSync(credPath, 'utf8'));
  } catch (e) {
    console.error(`FATAL: Could not parse credential file: ${e.message}`);
    process.exit(1);
  }

  const credData = credentials.installed || credentials.web;
  if (!credData) {
    console.error('FATAL: Credential file does not contain "installed" or "web" OAuth2 keys.');
    console.error('Download a Desktop application OAuth credential from Google Cloud Console.');
    process.exit(1);
  }

  // googleapis dynamic import — keeps top-level imports dependency-safe
  let google;
  try {
    const mod = await import('googleapis');
    google = mod.google;
  } catch {
    console.error('FATAL: googleapis npm package not found in scripts/node_modules/.');
    console.error('Run (requires Coordinator approval): npm --prefix scripts install googleapis');
    process.exit(1);
  }

  const { client_id, client_secret, redirect_uris } = credData;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris?.[0] || 'urn:ietf:wg:oauth:2.0:oob',
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [SCOPE_EVENTS],
    prompt: 'consent',
  });

  console.log('Open this URL in your browser to authorize KeepMees Calendar Sync:');
  console.log('');
  console.log(authUrl);
  console.log('');

  // Best-effort browser open — URL already printed above as fallback
  try {
    const opener = process.platform === 'win32' ? 'start' :
                   process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${opener} "${authUrl}"`, { stdio: 'ignore' });
    console.log('(Browser opened automatically. If it did not open, copy the URL above.)');
  } catch {
    // Ignore — URL is already printed
  }

  console.log('');
  console.log('After authorizing in your browser, copy the authorization code and paste it below.');
  console.log('');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) => {
    rl.question('Authorization code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!code) {
    console.error('FATAL: No authorization code entered. Aborting.');
    process.exit(1);
  }

  // Exchange code for token — token contents never printed
  let tokens;
  try {
    const result = await oAuth2Client.getToken(code);
    tokens = result.tokens;
  } catch (e) {
    console.error(`FATAL: Token exchange failed: ${e.message}`);
    console.error('Verify the authorization code is correct and not expired, then retry.');
    process.exit(1);
  }

  // Write token to canonical path — existence check already confirmed gitignored
  const tokenPath = join(ROOT, tokenFile);
  try {
    writeFileSync(tokenPath, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (e) {
    console.error(`FATAL: Could not write token file: ${e.message}`);
    process.exit(1);
  }

  // Final gitignore confirmation after write
  const tokenIgnoredAfterWrite = isPathGitignored(tokenFile);
  console.log('');
  console.log('OAuth bootstrap complete.');
  console.log(`  Token saved to: ${tokenFile}`);
  console.log(`  Gitignored:     ${tokenIgnoredAfterWrite ? 'YES' : 'NO — WARNING: verify .gitignore'}`);
  if (!tokenIgnoredAfterWrite) {
    console.log('  WARNING: Token path does not appear gitignored after write. Do not commit this file.');
  }
  console.log('');
  console.log('Next step (requires Coordinator authorization):');
  console.log('  node scripts/google-calendar-sync-dry-run.mjs --live-readonly');
  console.log('');
  console.log('---');
  console.log('No Google Calendar events were read, created, updated, or deleted.');
  console.log('No files were committed.');
}

// ─── Main ──────────────────────────────────────────────────────────────────

if (isAuthStatus) {
  runAuthStatus();
} else if (isInitOAuth) {
  runInitOAuth().catch(e => {
    console.error(`FATAL: ${e.message}`);
    process.exit(1);
  });
} else {
  console.log('');
  console.log('Google Calendar OAuth Bootstrap — AI Project OS v1.6');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/google-calendar-auth-bootstrap.mjs --auth-status');
  console.log('    Show credential/token readiness (no contents read, no API calls)');
  console.log('');
  console.log('  node scripts/google-calendar-auth-bootstrap.mjs --init-oauth');
  console.log('    Run one-time OAuth authorization (requires Coordinator authorization)');
  console.log(`    Credential: ${CANONICAL_CREDENTIALS_FILE}`);
  console.log(`    Token:      ${CANONICAL_TOKEN_FILE}`);
  console.log('');
  console.log('OPTIONS:');
  console.log('  --credential-path <path>         Override credential file (must be gitignored)');
  console.log('  --token-path <path>              Override token file (must be gitignored)');
  console.log('  --allow-legacy-root-credentials  Allow root credential/token fallback');
  console.log('                                   (warns LEGACY_ROOT_CREDENTIAL_PATH_USED)');
  console.log('');
  console.log('SAFETY:');
  console.log('  This script does not call Google Calendar event APIs.');
  console.log('  This script does not create, update, delete, or cancel events.');
  console.log('  Credential and token contents are never printed.');
  console.log('');
  process.exit(0);
}
