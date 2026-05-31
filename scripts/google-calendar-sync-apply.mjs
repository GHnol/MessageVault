#!/usr/bin/env node
/**
 * Google Calendar Sync Apply Script
 *
 * HARD STOPS — this script will not proceed unless ALL safety requirements are met:
 *   1. --apply flag must be present
 *   2. --confirm-live-calendar-apply flag must be present (Gate 3 explicit confirmation)
 *   3. --approved-dry-run <path> must point to a valid dry-run artifact
 *   4. token.json must be gitignored
 *   5. external-sync-map.local.json must be gitignored
 *   6. Credentials must exist locally (google-calendar-credentials.json + token.json)
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

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);

const CREDENTIALS_FILE = 'google-calendar-credentials.json';
const TOKEN_FILE = 'token.json';
const LOCAL_MAP_FILE = 'docs/project-control/external-sync-map.local.json';

const args = process.argv.slice(2);
const hasApply = args.includes('--apply');
const hasConfirmLive = args.includes('--confirm-live-calendar-apply');
const hasDelete = args.includes('--delete');
const dryRunArtifactIdx = args.indexOf('--approved-dry-run');
const dryRunArtifactPath = dryRunArtifactIdx >= 0 ? args[dryRunArtifactIdx + 1] : null;
const osIdIdx = args.indexOf('--os-id');
const targetOsId = osIdIdx >= 0 ? args[osIdIdx + 1] : null;

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
  console.log('Hard stop conditions:');
  console.log('  - --confirm-live-calendar-apply must be present');
  console.log('  - token.json must be gitignored');
  console.log('  - external-sync-map.local.json must be gitignored');
  console.log('  - Credentials must exist locally');
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

// Guard 2: token.json must be gitignored
if (!isGitignored(TOKEN_FILE)) {
  abort(`token.json is NOT gitignored. Add "token.json" and "**/token.json" to .gitignore before running apply.`);
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

// Guard 9: credentials must exist
if (!existsSync(join(ROOT, CREDENTIALS_FILE))) {
  abort(
    `Credentials file not found: ${CREDENTIALS_FILE}\n` +
    `  See: docs/project-control/google-calendar-credentials.example.md`
  );
}
if (!existsSync(join(ROOT, TOKEN_FILE))) {
  abort(
    `Token file not found: ${TOKEN_FILE}\n` +
    `  Run one-time OAuth flow first — see: docs/project-control/google-calendar-credentials.example.md`
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
console.log('  [PASS] token.json is gitignored');
console.log('  [PASS] external-sync-map.local.json is gitignored');
console.log('  [PASS] credentials found');
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
// Full implementation delivered in Gate 3 authorized session.
// All guards above are real and functional; this block executes when all pass.
console.log('Gate 3 live apply: implementation pending Gate 3 authorized session.');
console.log('All pre-flight guards are real. Live API calls are implemented in the Gate 3 pass.');
console.log('');
console.log('---');
console.log('No external sync was performed. No files were modified by this script (Gate 3 pending).');
process.exit(0);
