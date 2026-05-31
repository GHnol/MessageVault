#!/usr/bin/env node
/**
 * Google Calendar Sync Dry-Run Script
 *
 * Gate 1 / local-only mode (--local-only, default):
 *   - Validates source records (calls google-calendar-source-validate logic)
 *   - Generates intended Google Calendar event payloads
 *   - Classifies each as READY_FOR_LIVE_COMPARE or INVALID_SOURCE
 *   - Prints structured report
 *   - Does NOT call Google Calendar API
 *   - Does NOT read or write external-sync-map.local.json
 *   - Does NOT require credentials
 *
 * Gate 2 / live mode (--live):
 *   - Reads source records + local sync map (if present)
 *   - Calls Google Calendar API (read-only)
 *   - Classifies each source record: CREATE, UPDATE, NO_OP, ADOPTION_REQUIRED,
 *     DUPLICATE_DETECTED, MISSING_LOCAL_MAPPING, MAPPED_EVENT_MISSING_REMOTELY,
 *     REMOTE_DRIFT, DELETE_CANCEL_CANDIDATE, NEEDS_MANUAL_REVIEW
 *   - Saves dry-run artifact to local-sync-reports/
 *   - REQUIRES: googleapis npm package installed in scripts/node_modules/
 *   - REQUIRES: google-calendar-credentials.json and token.json locally
 *   - Gate 2 requires separate Coordinator authorization
 *
 * No credentials required in local mode.
 * Exit 0 = pass. Exit 1 = validation failures or live comparison errors.
 *
 * Usage:
 *   node scripts/google-calendar-sync-dry-run.mjs             # local-only (default)
 *   node scripts/google-calendar-sync-dry-run.mjs --local-only
 *   node scripts/google-calendar-sync-dry-run.mjs --live      # Gate 2 (requires credentials + googleapis)
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);
const SOURCE_FILE = 'docs/project-control/google-calendar-source-records.json';
const LOCAL_MAP_FILE = 'docs/project-control/external-sync-map.local.json';
const CREDENTIALS_FILE = 'google-calendar-credentials.json';
const TOKEN_FILE = 'token.json';
const REPORT_DIR = 'local-sync-reports';

const args = process.argv.slice(2);
const isLive = args.includes('--live');
const isLocalOnly = args.includes('--local-only') || !isLive;

const VALID_ROLES = ['ritual', 'phase-gate', 'milestone', 'package-review', 'package-closeout', 'budget-review', 'roadmap-reset'];
const VALID_STATUS = ['active', 'paused', 'archived'];

// --- Load and validate source records ---
function loadSourceRecords() {
  const sourcePath = join(ROOT, SOURCE_FILE);
  if (!existsSync(sourcePath)) {
    console.error(`FATAL: Source file not found: ${SOURCE_FILE}`);
    console.error('Run: node scripts/google-calendar-source-validate.mjs');
    process.exit(1);
  }
  let records;
  try {
    records = JSON.parse(readFileSync(sourcePath, 'utf8'));
  } catch (e) {
    console.error(`FATAL: Source file is not valid JSON: ${e.message}`);
    process.exit(1);
  }
  return records;
}

function validateRecord(r) {
  const errors = [];
  if (!r.os_id || !r.os_id.startsWith('keepmees-')) errors.push('os_id missing or invalid');
  if (!r.title) errors.push('title missing');
  if (!r.description || !r.description.includes(`AI_OS_ID: ${r.os_id}`)) errors.push('description missing AI_OS_ID marker');
  if (!VALID_ROLES.includes(r.calendar_role)) errors.push(`invalid calendar_role: ${r.calendar_role}`);
  if (!r.start || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.start)) errors.push('invalid start datetime');
  if (!r.end || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.end)) errors.push('invalid end datetime');
  if (!r.timezone) errors.push('timezone missing');
  if (!VALID_STATUS.includes(r.status)) errors.push(`invalid status: ${r.status}`);
  if (!r.source_file) errors.push('source_file missing');
  if (r.calendar_relevant !== true) errors.push('calendar_relevant must be true');
  if (r.duplicate_key !== r.os_id) errors.push('duplicate_key must equal os_id');
  return errors;
}

function buildEventPayload(r) {
  const payload = {
    summary: r.title,
    description: r.description,
    start: {
      dateTime: r.start,
      timeZone: r.timezone,
    },
    end: {
      dateTime: r.end,
      timeZone: r.timezone,
    },
    extendedProperties: {
      private: {
        ai_os_id: r.os_id,
      },
    },
  };
  if (r.recurrence) {
    payload.recurrence = [`RRULE:${r.recurrence}`];
  }
  return payload;
}

// --- Local-only mode ---
function runLocalMode(records) {
  console.log(`\nGOOGLE CALENDAR SYNC DRY-RUN — LOCAL MODE — ${today}`);
  console.log('Source: scripts/google-calendar-sync-dry-run.mjs --local-only');
  console.log(`Source records: ${SOURCE_FILE}`);
  console.log('Mode: LOCAL-ONLY — no Google Calendar API calls — Gate 1 verification');
  console.log('');

  const results = [];
  const seenIds = new Set();
  let invalidCount = 0;
  let readyCount = 0;

  for (const r of records) {
    const errors = validateRecord(r);
    const isDup = seenIds.has(r.os_id);
    if (r.os_id) seenIds.add(r.os_id);

    if (errors.length > 0 || isDup) {
      const allErrors = isDup ? [...errors, `duplicate os_id: ${r.os_id}`] : errors;
      results.push({ os_id: r.os_id, classification: 'INVALID_SOURCE', errors: allErrors });
      invalidCount++;
    } else {
      const payload = buildEventPayload(r);
      results.push({ os_id: r.os_id, classification: 'READY_FOR_LIVE_COMPARE', payload });
      readyCount++;
    }
  }

  console.log('LOCAL CLASSIFICATION RESULTS');
  for (const res of results) {
    if (res.classification === 'READY_FOR_LIVE_COMPARE') {
      console.log(`  [READY_FOR_LIVE_COMPARE] ${res.os_id}`);
      console.log(`    title: ${res.payload.summary}`);
      console.log(`    start: ${res.payload.start.dateTime} ${res.payload.start.timeZone}`);
      console.log(`    end: ${res.payload.end.dateTime}`);
      if (res.payload.recurrence) {
        console.log(`    recurrence: ${res.payload.recurrence[0]}`);
      }
      console.log(`    AI_OS_ID marker: present in description`);
      console.log(`    extendedProperties.private.ai_os_id: ${res.os_id} (planned for Gate 3)`);
    } else {
      console.log(`  [INVALID_SOURCE] ${res.os_id || '(no os_id)'}`);
      for (const e of res.errors) {
        console.log(`    ERROR: ${e}`);
      }
    }
    console.log('');
  }

  console.log('SUMMARY');
  console.log(`  READY_FOR_LIVE_COMPARE: ${readyCount}`);
  console.log(`  INVALID_SOURCE: ${invalidCount}`);
  console.log('');
  console.log('LIVE READINESS');
  console.log(`  Credential status: LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING`);
  console.log(`    (expected for Gate 1 — no credentials needed for local mode)`);
  console.log(`  Gate 2 live comparison: not run`);
  console.log(`  To run Gate 2: node scripts/google-calendar-sync-dry-run.mjs --live`);
  console.log(`    (requires googleapis and Google Calendar API credentials)`);
  console.log('');

  if (invalidCount > 0) {
    console.log(`VERDICT: LOCAL VALIDATION FAILED — ${invalidCount} source record(s) have errors.`);
    console.log('Fix all errors before proceeding to Gate 2.');
    console.log('');
    console.log('---');
    console.log('No external sync was performed. No files were modified by this script.');
    process.exit(1);
  } else {
    console.log('VERDICT: LOCAL VALIDATION PASSED');
    console.log(`  All ${readyCount} source records are valid and ready for Gate 2 live comparison.`);
    console.log('  Authorize Gate 2, then run: node scripts/google-calendar-sync-dry-run.mjs --live');
    console.log('');
    console.log('---');
    console.log('No external sync was performed. No files were modified by this script.');
    process.exit(0);
  }
}

// --- Live mode (Gate 2) ---
function runLiveMode() {
  console.log(`\nGOOGLE CALENDAR SYNC DRY-RUN — LIVE MODE — ${today}`);
  console.log('Source: scripts/google-calendar-sync-dry-run.mjs --live');
  console.log('');

  // Check credentials exist
  const credPath = join(ROOT, CREDENTIALS_FILE);
  const tokenPath = join(ROOT, TOKEN_FILE);
  const credMissing = !existsSync(credPath);
  const tokenMissing = !existsSync(tokenPath);

  if (credMissing || tokenMissing) {
    console.log('CREDENTIAL_MISSING — Google Calendar API credentials not found.');
    if (credMissing) console.log(`  Missing: ${CREDENTIALS_FILE}`);
    if (tokenMissing) console.log(`  Missing: ${TOKEN_FILE}`);
    console.log('');
    console.log('To set up credentials, follow:');
    console.log('  docs/project-control/google-calendar-credentials.example.md');
    console.log('');
    console.log('Gate 1 (local-only) operations do not require credentials.');
    console.log('Gate 2 (live dry-run) requires credentials + googleapis npm package.');
    console.log('');
    console.log('Current gate status: LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING');
    console.log('');
    console.log('---');
    console.log('No external sync was performed. No files were modified by this script.');
    process.exit(1);
  }

  // Check googleapis is available (file presence check; dynamic import is Gate 2 runtime behavior)
  const scriptsNodeModules = join(ROOT, 'scripts', 'node_modules', 'googleapis');
  const rootNodeModules = join(ROOT, 'node_modules', 'googleapis');
  const googleapisAvailable = existsSync(scriptsNodeModules) || existsSync(rootNodeModules);

  if (!googleapisAvailable) {
    console.log('DEPENDENCY_MISSING — googleapis npm package not found.');
    console.log('');
    console.log('Gate 2 live dry-run requires the googleapis package.');
    console.log('Install approval question for Coordinator:');
    console.log('  "Approve installation of googleapis in scripts/ directory for Gate 2."');
    console.log('  Install command: cd scripts && npm install googleapis');
    console.log('  This does NOT modify root package.json.');
    console.log('');
    console.log('See: docs/project-control/google-calendar-credentials.example.md');
    console.log('');
    console.log('---');
    console.log('No external sync was performed. No files were modified by this script.');
    process.exit(1);
  }

  // --- GATE 2 LIVE IMPLEMENTATION PLACEHOLDER ---
  // Full live comparison implementation runs in Gate 2 after Coordinator authorizes.
  // The credential and dependency checks above are real and functional.
  // The API comparison logic is the planned Gate 2 implementation.

  console.log('GATE_2_NOT_YET_AUTHORIZED');
  console.log('');
  console.log('Credential and dependency checks passed.');
  console.log('Full live comparison is planned for Gate 2.');
  console.log('Coordinator must authorize Gate 2 before live comparison runs.');
  console.log('');
  console.log('---');
  console.log('No external sync was performed. No files were modified by this script.');
  process.exit(0);
}

// --- Main ---
const records = loadSourceRecords();

if (isLocalOnly) {
  runLocalMode(records);
} else {
  runLiveMode();
}
