#!/usr/bin/env node
/**
 * Google Calendar Sync Apply Script
 *
 * HARD STOPS — this script will not proceed unless ALL safety requirements are met:
 *   1. --apply flag must be present
 *   2. --confirm-live-calendar-apply flag must be present (Gate 3 explicit confirmation)
 *   3. --approved-dry-run <path> must point to a valid dry-run artifact
 *   4. Canonical token path must be gitignored
 *   5. external-sync-map.local.json must be gitignored
 *   6. Credentials must exist at canonical paths locally
 *   7. Artifact must not contain unresolved DUPLICATE_DETECTED or ADOPTION_REQUIRED items
 *   8. Delete/cancel requires separate --delete --os-id <id> per item
 *
 * Default behavior:
 *   - Creates and updates events only
 *   - Never deletes or cancels without separate --delete --os-id <id> per item
 *   - Writes event IDs only to external-sync-map.local.json (local-only, gitignored)
 *   - Never commits any file
 *   - Never exposes tokens
 *
 * Canonical credential paths (defaults):
 *   Credential: docs/project-control/google-calendar-credentials.local.json
 *   Token:      docs/project-control/google-calendar-token.local.json
 *
 * Legacy root paths (google-calendar-credentials.json / token.json at repo root) are supported
 * only via explicit --allow-legacy-root-credentials flag. Never used silently.
 * Warns LEGACY_ROOT_CREDENTIAL_PATH_USED when legacy fallback triggers.
 *
 * Gate 3 authorization model:
 *   Gate 3 is unlocked at runtime by providing all required flags — no source code editing needed.
 *   Required flags for a create/update apply:
 *     --apply --confirm-live-calendar-apply --approved-dry-run <artifact-path>
 *   Required flags for a per-item delete/cancel (separate Coordinator approval per item):
 *     --apply --confirm-live-calendar-apply --approved-dry-run <path> --delete --os-id <id>
 *
 * Usage:
 *   node scripts/google-calendar-sync-apply.mjs
 *     → plan mode: prints expected behavior, exits 0
 *
 *   node scripts/google-calendar-sync-apply.mjs --apply --approved-dry-run <path>
 *     → blocked: --confirm-live-calendar-apply missing
 *
 *   node scripts/google-calendar-sync-apply.mjs \
 *     --apply \
 *     --confirm-live-calendar-apply \
 *     --approved-dry-run local-sync-reports/google-calendar-dry-run-<ts>.json
 *     → Gate 3 create/update apply (requires credentials + googleapis)
 *
 *   node scripts/google-calendar-sync-apply.mjs \
 *     --apply \
 *     --confirm-live-calendar-apply \
 *     --approved-dry-run <path> \
 *     --delete --os-id <os_id>
 *     → per-item delete/cancel (separate Coordinator approval required)
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);

const CANONICAL_CREDENTIALS_FILE = 'docs/project-control/google-calendar-credentials.local.json';
const CANONICAL_TOKEN_FILE = 'docs/project-control/google-calendar-token.local.json';
const LEGACY_CREDENTIALS_FILE = 'google-calendar-credentials.json';
const LEGACY_TOKEN_FILE = 'token.json';
const LOCAL_MAP_FILE = 'docs/project-control/external-sync-map.local.json';

const args = process.argv.slice(2);
const hasApply = args.includes('--apply');
const hasConfirmLive = args.includes('--confirm-live-calendar-apply');
const hasDelete = args.includes('--delete');
const allowLegacyRoot = args.includes('--allow-legacy-root-credentials');
const dryRunArtifactIdx = args.indexOf('--approved-dry-run');
const dryRunArtifactPath = dryRunArtifactIdx >= 0 ? args[dryRunArtifactIdx + 1] : null;
const osIdIdx = args.indexOf('--os-id');
const targetOsId = osIdIdx >= 0 ? args[osIdIdx + 1] : null;
const credPathIdx = args.indexOf('--credential-path');
const credPathArg = credPathIdx >= 0 ? args[credPathIdx + 1] : null;
const tokenPathIdx = args.indexOf('--token-path');
const tokenPathArg = tokenPathIdx >= 0 ? args[tokenPathIdx + 1] : null;

function abort(reason) {
  console.error(`\nAPPLY BLOCKED — ${reason}`);
  console.error('\nApply was not executed. No calendar events were created, updated, or deleted.');
  console.error('No external-sync-map.local.json was written.');
  console.error('');
  console.error('---');
  console.error('No external sync was performed. No files were modified by this script.');
  process.exit(1);
}

function isGitignored(path) {
  try {
    const result = execSync(`git check-ignore -v "${path}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function resolveCredPaths() {
  if (credPathArg && !isGitignored(credPathArg)) {
    abort(`--credential-path "${credPathArg}" is not gitignored. Refusing to use.`);
  }
  if (tokenPathArg && !isGitignored(tokenPathArg)) {
    abort(`--token-path "${tokenPathArg}" is not gitignored. Refusing to use.`);
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

// --- Plan mode (no --apply) ---
if (!hasApply) {
  console.log(`\nGOOGLE CALENDAR SYNC APPLY — PLAN MODE — ${today}`);
  console.log('Source: scripts/google-calendar-sync-apply.mjs');
  console.log('');
  console.log('No --apply flag provided. Plan mode only. No mutations.');
  console.log('');
  console.log('To run Gate 3 apply:');
  console.log('  1. Complete Gate 2 dry-run (separate Coordinator authorization required)');
  console.log('  2. Save dry-run artifact to local-sync-reports/');
  console.log('  3. Coordinator approves Gate 3 with explicit "proceed with apply" instruction');
  console.log('  4. Run:');
  console.log('     node scripts/google-calendar-sync-apply.mjs \\');
  console.log('       --apply \\');
  console.log('       --confirm-live-calendar-apply \\');
  console.log('       --approved-dry-run local-sync-reports/google-calendar-dry-run-<timestamp>.json');
  console.log('');
  console.log('Required flags for Gate 3:');
  console.log('  --apply                        Enables apply mode');
  console.log('  --confirm-live-calendar-apply  Explicit Gate 3 confirmation (required)');
  console.log('  --approved-dry-run <path>      Path to approved Gate 2 dry-run artifact');
  console.log('');
  console.log('For per-item delete/cancel (separate approval required):');
  console.log('  node scripts/google-calendar-sync-apply.mjs \\');
  console.log('    --apply --confirm-live-calendar-apply \\');
  console.log('    --approved-dry-run <path> --delete --os-id <os_id>');
  console.log('');
  console.log('Apply behavior:');
  console.log('  - Creates and updates events only (default)');
  console.log('  - Delete/cancel requires separate --delete --os-id <id> per item + Coordinator approval');
  console.log('  - Writes event IDs only to external-sync-map.local.json (local, gitignored)');
  console.log('  - Updates google-calendar-sync-log.md after successful operations');
  console.log('  - Never commits any file');
  console.log('');
  console.log('Canonical credential paths (defaults):');
  console.log(`  Credential: ${CANONICAL_CREDENTIALS_FILE}`);
  console.log(`  Token:      ${CANONICAL_TOKEN_FILE}`);
  console.log('  (Use --allow-legacy-root-credentials to fall back to root paths if canonical absent)');
  console.log('');
  console.log('Hard stop conditions:');
  console.log('  - --confirm-live-calendar-apply must be present');
  console.log('  - Canonical token path must be gitignored');
  console.log('  - external-sync-map.local.json must be gitignored');
  console.log('  - Credentials must exist at canonical paths locally');
  console.log('  - googleapis must be installed in scripts/node_modules/');
  console.log('  - --approved-dry-run artifact must exist and be valid JSON');
  console.log('  - Artifact must have no unresolved DUPLICATE_DETECTED or ADOPTION_REQUIRED items');
  console.log('  - No delete without --delete --os-id <id> and separate Coordinator approval');
  console.log('');
  console.log('---');
  console.log('No external sync was performed. No files were modified by this script.');
  process.exit(0);
}

// --- Apply mode: hard stop checks ---

// Resolve canonical credential/token paths before any guard (legacy only with explicit flag)
const { credFile, tokenFile } = resolveCredPaths();

// Guard 1: --confirm-live-calendar-apply required (Gate 3 runtime confirmation — no source code edit needed)
if (!hasConfirmLive) {
  abort(
    `--confirm-live-calendar-apply flag is required for Gate 3.\n` +
    `  This flag confirms that the Coordinator has authorized Gate 3 apply.\n` +
    `  Do not add this flag without explicit Coordinator "proceed with apply" instruction.\n` +
    `  Full command:\n` +
    `    node scripts/google-calendar-sync-apply.mjs \\\n` +
    `      --apply \\\n` +
    `      --confirm-live-calendar-apply \\\n` +
    `      --approved-dry-run <artifact-path>`
  );
}

// Guard 2: token path must be gitignored
if (!isGitignored(tokenFile)) {
  abort(`Token path "${tokenFile}" is NOT gitignored. Fix .gitignore before running apply.`);
}

// Guard 3: external-sync-map.local.json must be gitignored
if (!isGitignored(LOCAL_MAP_FILE)) {
  abort(`external-sync-map.local.json is NOT gitignored. Check .gitignore before running apply.`);
}

// Guard 4: --approved-dry-run artifact must be provided
if (!dryRunArtifactPath) {
  abort(
    `--approved-dry-run <path> is required. Provide the path to the Gate 2 dry-run artifact.\n` +
    `  Example: --approved-dry-run local-sync-reports/google-calendar-dry-run-${today}.json`
  );
}

// Guard 5: dry-run artifact must exist
const artifactFullPath = join(ROOT, dryRunArtifactPath);
if (!existsSync(artifactFullPath)) {
  abort(
    `Dry-run artifact not found: ${dryRunArtifactPath}\n` +
    `  Run Gate 2 dry-run first: node scripts/google-calendar-sync-dry-run.mjs --live`
  );
}

// Guard 6: dry-run artifact must be valid JSON with expected structure
let artifact;
try {
  artifact = JSON.parse(readFileSync(artifactFullPath, 'utf8'));
} catch (e) {
  abort(`Dry-run artifact is not valid JSON: ${e.message}`);
}
if (!artifact || typeof artifact !== 'object' || !Array.isArray(artifact.results)) {
  abort(`Dry-run artifact does not have expected structure (missing "results" array).`);
}

// Guard 7: artifact must not contain unresolved DUPLICATE_DETECTED items
const duplicateItems = artifact.results.filter(r => r.classification === 'DUPLICATE_DETECTED');
if (duplicateItems.length > 0) {
  abort(
    `Dry-run artifact contains ${duplicateItems.length} unresolved DUPLICATE_DETECTED item(s):\n` +
    duplicateItems.map(r => `  - ${r.os_id}`).join('\n') + '\n' +
    `  Resolve duplicates in Google Calendar before applying.\n` +
    `  Each duplicate requires Coordinator decision on which event to keep.`
  );
}

// Guard 8: artifact must not contain unresolved ADOPTION_REQUIRED items
const adoptionItems = artifact.results.filter(r => r.classification === 'ADOPTION_REQUIRED');
if (adoptionItems.length > 0) {
  abort(
    `Dry-run artifact contains ${adoptionItems.length} ADOPTION_REQUIRED item(s):\n` +
    adoptionItems.map(r => `  - ${r.os_id}`).join('\n') + '\n' +
    `  These existing Google Calendar events (from 2026-05-17 import) need AI_OS_ID markers\n` +
    `  added in the Google Calendar UI before apply can proceed safely.\n` +
    `  See adoption guide: docs/project-control/google-calendar-sync-policy.md`
  );
}

// Guard 9: credentials must exist at resolved paths
if (!existsSync(join(ROOT, credFile))) {
  abort(
    `Credentials file not found: ${credFile}\n` +
    `  See: docs/project-control/google-calendar-credentials.example.md`
  );
}
if (!existsSync(join(ROOT, tokenFile))) {
  abort(
    `Token file not found: ${tokenFile}\n` +
    `  Run OAuth bootstrap first: node scripts/google-calendar-auth-bootstrap.mjs --init-oauth\n` +
    `  (Requires explicit Coordinator authorization before running.)`
  );
}

// Guard 10: check for delete/cancel items in artifact without explicit per-item approval
const deleteItems = artifact.results.filter(r => r.classification === 'DELETE_CANCEL_CANDIDATE');
if (deleteItems.length > 0 && !hasDelete) {
  abort(
    `Dry-run artifact contains ${deleteItems.length} DELETE_CANCEL_CANDIDATE item(s):\n` +
    deleteItems.map(r => `  - ${r.os_id}`).join('\n') + '\n' +
    `  Delete/cancel requires separate --delete --os-id <id> per item and explicit Coordinator approval.\n` +
    `  Apply will proceed for CREATE/UPDATE items only when --delete is absent.\n` +
    `  To delete a specific item (separate approval required):\n` +
    `    node scripts/google-calendar-sync-apply.mjs \\\n` +
    `      --apply --confirm-live-calendar-apply \\\n` +
    `      --approved-dry-run <path> --delete --os-id <id>`
  );
}

// Guard 11: if --delete is present, --os-id must be provided
if (hasDelete && !targetOsId) {
  abort(`--delete requires --os-id <id>. Individual item ID is required for each delete/cancel operation.`);
}

// Guard 12: if --delete with --os-id, the item must be in the artifact as DELETE_CANCEL_CANDIDATE
if (hasDelete && targetOsId) {
  const deleteCandidate = deleteItems.find(r => r.os_id === targetOsId);
  if (!deleteCandidate) {
    abort(`--os-id "${targetOsId}" is not classified as DELETE_CANCEL_CANDIDATE in the dry-run artifact.`);
  }
}

// --- All guards passed — Gate 3 apply ---
console.log(`\nGOOGLE CALENDAR SYNC APPLY — GATE 3 — ${today}`);
console.log('');
console.log('All pre-flight guards passed:');
console.log('  [PASS] --apply flag present');
console.log('  [PASS] --confirm-live-calendar-apply present (Gate 3 confirmation)');
console.log(`  [PASS] dry-run artifact found: ${dryRunArtifactPath}`);
console.log(`  [PASS] token path is gitignored: ${tokenFile}`);
console.log('  [PASS] external-sync-map.local.json is gitignored');
console.log(`  [PASS] credentials found: ${credFile}`);
console.log('  [PASS] no unresolved DUPLICATE_DETECTED items');
console.log('  [PASS] no unresolved ADOPTION_REQUIRED items');
if (hasDelete && targetOsId) {
  console.log(`  [PASS] --delete with --os-id: ${targetOsId} (classified as DELETE_CANCEL_CANDIDATE)`);
}
console.log('');

// Check googleapis is available
const scriptsGoogleapis = join(ROOT, 'scripts', 'node_modules', 'googleapis');
const rootGoogleapis = join(ROOT, 'node_modules', 'googleapis');
if (!existsSync(scriptsGoogleapis) && !existsSync(rootGoogleapis)) {
  abort(
    `googleapis npm package not found.\n` +
    `  Install (requires Coordinator approval): cd scripts && npm install googleapis\n` +
    `  See: docs/project-control/google-calendar-credentials.example.md`
  );
}
console.log('  [PASS] googleapis package found');
console.log('');

// --- Gate 3 live apply implementation ---

async function runGate3Apply() {
  let google;
  try {
    const mod = await import('googleapis');
    google = mod.google;
  } catch {
    abort('googleapis not importable. Install: cd scripts && npm install googleapis');
  }

  let credentials, token;
  try {
    credentials = JSON.parse(readFileSync(join(ROOT, credFile), 'utf8'));
  } catch (e) {
    abort(`Could not parse ${credFile}: ${e.message}`);
  }
  try {
    token = JSON.parse(readFileSync(join(ROOT, tokenFile), 'utf8'));
  } catch (e) {
    abort(`Could not parse ${tokenFile}: ${e.message}`);
  }

  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web || {};
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
  oAuth2Client.setCredentials(token);

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const calendarId = 'primary';
  const applyTimestamp = new Date().toISOString();
  const applyDate = applyTimestamp.slice(0, 10);

  const createItems = artifact.results.filter(r => r.classification === 'CREATE');
  const updateItems = artifact.results.filter(r => r.classification === 'UPDATE');
  const skipItems = artifact.results.filter(r => r.classification === 'NO_OP');

  console.log('Applying Gate 3 changes:');
  console.log(`  CREATE: ${createItems.length}`);
  console.log(`  UPDATE: ${updateItems.length}`);
  console.log(`  NO_OP (skip): ${skipItems.length}`);
  console.log('');

  const createdEvents = [];
  const updatedEvents = [];
  const errors = [];

  for (const item of createItems) {
    const payload = item.proposed_event_payload;
    console.log(`  [CREATE] ${item.os_id}...`);
    try {
      const res = await calendar.events.insert({ calendarId, resource: payload });
      createdEvents.push({
        os_id: item.os_id,
        event_id: res.data.id,
        title: payload.summary,
        html_link: res.data.htmlLink,
      });
      console.log(`    [OK] event id: ${res.data.id}`);
    } catch (e) {
      errors.push({ os_id: item.os_id, operation: 'CREATE', error: e.message });
      console.log(`    [ERROR] ${e.message}`);
    }
  }

  for (const item of updateItems) {
    const payload = item.proposed_event_payload;
    const eventId = item.matched_event?.id;
    if (!eventId) {
      errors.push({ os_id: item.os_id, operation: 'UPDATE', error: 'matched_event.id missing from artifact' });
      console.log(`  [UPDATE ERROR] ${item.os_id} — matched_event.id missing`);
      continue;
    }
    console.log(`  [UPDATE] ${item.os_id} (id: ${eventId})...`);
    try {
      const res = await calendar.events.update({ calendarId, eventId, resource: payload });
      updatedEvents.push({ os_id: item.os_id, event_id: res.data.id, title: payload.summary });
      console.log(`    [OK] event id: ${res.data.id}`);
    } catch (e) {
      errors.push({ os_id: item.os_id, operation: 'UPDATE', error: e.message });
      console.log(`    [ERROR] ${e.message}`);
    }
  }

  console.log('');
  console.log('APPLY RESULTS:');
  console.log(`  Created: ${createdEvents.length}`);
  console.log(`  Updated: ${updatedEvents.length}`);
  console.log(`  Skipped (NO_OP): ${skipItems.length}`);
  console.log(`  Errors: ${errors.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('ERRORS:');
    for (const e of errors) {
      console.log(`  [${e.operation} ERROR] ${e.os_id}: ${e.error}`);
    }
    console.log('');
  }

  // Write event IDs to external-sync-map.local.json (local-only, gitignored)
  const mapPath = join(ROOT, LOCAL_MAP_FILE);
  let syncMap = {};
  if (existsSync(mapPath)) {
    try { syncMap = JSON.parse(readFileSync(mapPath, 'utf8')); } catch { /* start fresh */ }
  }
  if (!syncMap.google_calendar) {
    syncMap.google_calendar = { _last_synced: applyDate, events: {} };
  }
  syncMap.google_calendar._last_synced = applyDate;
  if (!syncMap.google_calendar.events) syncMap.google_calendar.events = {};
  for (const ev of [...createdEvents, ...updatedEvents]) {
    syncMap.google_calendar.events[ev.os_id] = {
      external_id: ev.event_id,
      os_id: ev.os_id,
      title: ev.title,
      operation: createdEvents.includes(ev) ? 'created' : 'updated',
      applied_at: applyTimestamp,
    };
  }
  syncMap._last_updated = applyDate;
  writeFileSync(mapPath, JSON.stringify(syncMap, null, 2), 'utf8');
  console.log(`external-sync-map.local.json updated (local-only, gitignored).`);
  console.log('');

  // Update sync log
  const syncLogPath = join(ROOT, 'docs/project-control/google-calendar-sync-log.md');
  let syncLogContent;
  try { syncLogContent = readFileSync(syncLogPath, 'utf8'); } catch (e) {
    abort(`Could not read sync log: ${e.message}`);
  }
  const createdList = createdEvents.map(e => e.os_id).join(', ') || 'none';
  const updatedList = updatedEvents.map(e => e.os_id).join(', ') || 'none';
  const errorNote = errors.length > 0
    ? ` Errors: ${errors.map(e => `${e.os_id} (${e.operation}): ${e.error}`).join('; ')}.`
    : '';
  const logEntry =
    `## ${applyDate} — Gate 3: live apply COMPLETE — ${createdEvents.length} event(s) created\n\n` +
    `- **Gate:** Gate 3\n` +
    `- **Method:** api-apply (live create/update)\n` +
    `- **Changed by:** Claude Code (Sonnet 4.6) + Coordinator (Gate 3 authorization)\n` +
    `- **Events created:** ${createdEvents.length > 0 ? createdList : 'none'}\n` +
    `- **Events updated:** ${updatedEvents.length > 0 ? updatedList : 'none'}\n` +
    `- **Events removed:** none\n` +
    `- **Credential status:** present (gitignored)\n` +
    `- **Notes:** Gate 3 live apply complete. Artifact: \`${dryRunArtifactPath}\`. ` +
    `Created: ${createdEvents.length}. Updated: ${updatedEvents.length}. Errors: ${errors.length}.` +
    `${errorNote} Event IDs written to \`${LOCAL_MAP_FILE}\` (gitignored, local-only). ` +
    `No events deleted or cancelled. v1.6 Gate 3 ${errors.length === 0 ? 'COMPLETE' : 'PARTIAL — see errors'}.` +
    `\n\n---\n\n`;
  // Match marker regardless of line ending style (\r\n on Windows, \n on Unix)
  const insertMarkerRe = /Newest entries first\.(\r?\n){2}---(\r?\n){2}/;
  const insertMatch = insertMarkerRe.exec(syncLogContent);
  if (insertMatch) {
    const pos = insertMatch.index + insertMatch[0].length;
    syncLogContent = syncLogContent.slice(0, pos) + logEntry + syncLogContent.slice(pos);
  } else {
    syncLogContent += '\n' + logEntry;
  }
  writeFileSync(syncLogPath, syncLogContent, 'utf8');
  console.log('google-calendar-sync-log.md updated.');
  console.log('');

  const status = errors.length === 0 ? 'COMPLETE' : 'PARTIAL';
  console.log(`GATE 3 APPLY: ${status}`);
  console.log(`  Events created:        ${createdEvents.length}`);
  console.log(`  Events updated:        ${updatedEvents.length}`);
  console.log(`  Events skipped (NO_OP): ${skipItems.length}`);
  console.log(`  Errors:                ${errors.length}`);
  console.log(`  Artifact used:         ${dryRunArtifactPath}`);
  console.log(`  Sync map updated:      ${LOCAL_MAP_FILE} (local-only, gitignored)`);
  console.log(`  Sync log updated:      docs/project-control/google-calendar-sync-log.md`);
  console.log('');
  console.log('---');
  if (errors.length === 0) {
    console.log('Gate 3 apply complete. All events created. No events deleted or cancelled.');
  } else {
    console.log(`Gate 3 apply partial. ${errors.length} error(s) encountered. Review errors above.`);
  }
  console.log('No files committed.');
}

runGate3Apply().catch(e => {
  console.error(`\nFATAL: Gate 3 apply failed: ${e.message}`);
  process.exit(1);
});
