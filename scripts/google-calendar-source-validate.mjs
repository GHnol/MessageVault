#!/usr/bin/env node
/**
 * Google Calendar Source Record Validator
 *
 * Validates docs/project-control/google-calendar-source-records.json against
 * the schema defined in docs/project-control/google-calendar-source-schema.md.
 *
 * No dependencies. No API calls. No external writes. Read-only local files only.
 * Exit 0 = all checks pass. Exit 1 = one or more failures.
 *
 * Usage:
 *   node scripts/google-calendar-source-validate.mjs
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE_FILE = 'docs/project-control/google-calendar-source-records.json';

let failures = 0;
let warnings = 0;
const report = { pass: [], warn: [], fail: [] };

function pass(label) { report.pass.push(`[PASS] ${label}`); }
function warn(label, reason) { report.warn.push(`[WARN] ${label} — ${reason}`); warnings++; }
function fail(label, reason) { report.fail.push(`[FAIL] ${label} — ${reason}`); failures++; }

const VALID_ROLES = ['ritual', 'phase-gate', 'milestone', 'package-review', 'package-closeout', 'budget-review', 'roadmap-reset'];
const VALID_STATUS = ['active', 'paused', 'archived'];
const VALID_TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'UTC', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
];
const CREDENTIAL_PATTERNS = ['token', 'secret', 'oauth', 'credential', 'api_key', 'access_key'];

function isValidISODatetime(str) {
  if (typeof str !== 'string') return false;
  const m = str.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  if (!m) return false;
  const d = new Date(str + 'Z');
  return !isNaN(d.getTime());
}

function isValidRrule(str) {
  if (!str) return true;
  return /^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/.test(str);
}

function containsCredentialString(obj) {
  const json = JSON.stringify(obj).toLowerCase();
  return CREDENTIAL_PATTERNS.some(p => json.includes(p));
}

function looksLikeEventId(str) {
  if (typeof str !== 'string') return false;
  return /^[a-z0-9_]{15,}$/i.test(str) && !str.startsWith('keepmees-');
}

// --- Load source file ---
const sourcePath = join(ROOT, SOURCE_FILE);
if (!existsSync(sourcePath)) {
  fail('source file exists', `missing: ${SOURCE_FILE}`);
  printReport();
  process.exit(1);
}

let records;
try {
  const raw = readFileSync(sourcePath, 'utf8');
  records = JSON.parse(raw);
  pass('source file is valid JSON');
} catch (e) {
  fail('source file is valid JSON', e.message);
  printReport();
  process.exit(1);
}

if (!Array.isArray(records)) {
  fail('source file is an array', 'top-level value is not a JSON array');
  printReport();
  process.exit(1);
}

pass(`source file contains ${records.length} records`);

// --- Per-record validation ---
const seenIds = new Set();

for (let i = 0; i < records.length; i++) {
  const r = records[i];
  const ctx = `record[${i}] (${r.os_id || 'NO_ID'})`;

  // Required: os_id
  if (!r.os_id || typeof r.os_id !== 'string' || !r.os_id.startsWith('keepmees-')) {
    fail(`${ctx} os_id`, 'missing or does not start with "keepmees-"');
  } else {
    pass(`${ctx} os_id format`);
  }

  // os_id uniqueness
  if (r.os_id) {
    if (seenIds.has(r.os_id)) {
      fail(`${ctx} os_id uniqueness`, `duplicate os_id: ${r.os_id}`);
    } else {
      seenIds.add(r.os_id);
      pass(`${ctx} os_id unique`);
    }
  }

  // Required: title
  if (!r.title || typeof r.title !== 'string' || r.title.trim() === '') {
    fail(`${ctx} title`, 'missing or empty');
  } else {
    pass(`${ctx} title present`);
  }

  // Required: description with AI_OS_ID marker
  if (!r.description || typeof r.description !== 'string') {
    fail(`${ctx} description`, 'missing');
  } else if (!r.description.includes('AI_OS_ID:')) {
    fail(`${ctx} description has AI_OS_ID marker`, 'AI_OS_ID: marker not found in description');
  } else {
    const expectedMarker = `AI_OS_ID: ${r.os_id}`;
    if (!r.description.includes(expectedMarker)) {
      fail(`${ctx} AI_OS_ID marker matches os_id`, `expected "AI_OS_ID: ${r.os_id}" in description`);
    } else {
      pass(`${ctx} description has correct AI_OS_ID marker`);
    }
  }

  // Required: calendar_role
  if (!VALID_ROLES.includes(r.calendar_role)) {
    fail(`${ctx} calendar_role`, `"${r.calendar_role}" is not one of: ${VALID_ROLES.join(', ')}`);
  } else {
    pass(`${ctx} calendar_role valid`);
  }

  // Required: start
  if (!isValidISODatetime(r.start)) {
    fail(`${ctx} start`, `"${r.start}" is not a valid ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS)`);
  } else {
    pass(`${ctx} start format valid`);
  }

  // Required: end
  if (!isValidISODatetime(r.end)) {
    fail(`${ctx} end`, `"${r.end}" is not a valid ISO 8601 datetime (YYYY-MM-DDTHH:MM:SS)`);
  } else {
    pass(`${ctx} end format valid`);
  }

  // start < end
  if (isValidISODatetime(r.start) && isValidISODatetime(r.end)) {
    if (new Date(r.start + 'Z') >= new Date(r.end + 'Z')) {
      fail(`${ctx} start before end`, 'start is not before end');
    } else {
      pass(`${ctx} start is before end`);
    }
  }

  // Required: timezone
  if (!VALID_TIMEZONES.includes(r.timezone)) {
    warn(`${ctx} timezone`, `"${r.timezone}" not in known list — may still be valid; verify manually`);
  } else {
    pass(`${ctx} timezone recognized`);
  }

  // Optional: recurrence
  if (r.recurrence !== undefined && r.recurrence !== '') {
    if (!isValidRrule(r.recurrence)) {
      fail(`${ctx} recurrence`, `"${r.recurrence}" does not look like a valid RRULE`);
    } else {
      pass(`${ctx} recurrence format valid`);
    }
  }

  // Required: status
  if (!VALID_STATUS.includes(r.status)) {
    fail(`${ctx} status`, `"${r.status}" is not one of: ${VALID_STATUS.join(', ')}`);
  } else {
    pass(`${ctx} status valid`);
  }

  // Required: source_file
  if (!r.source_file || typeof r.source_file !== 'string') {
    fail(`${ctx} source_file`, 'missing');
  } else if (!existsSync(join(ROOT, r.source_file))) {
    warn(`${ctx} source_file`, `file not found: ${r.source_file}`);
  } else {
    pass(`${ctx} source_file exists`);
  }

  // Required: calendar_relevant = true
  if (r.calendar_relevant !== true) {
    fail(`${ctx} calendar_relevant`, 'must be true for all records in this file');
  } else {
    pass(`${ctx} calendar_relevant is true`);
  }

  // Required: duplicate_key matches os_id
  if (r.duplicate_key !== r.os_id) {
    fail(`${ctx} duplicate_key`, `"${r.duplicate_key}" must equal os_id "${r.os_id}"`);
  } else {
    pass(`${ctx} duplicate_key matches os_id`);
  }

  // No credential strings anywhere in record
  if (containsCredentialString(r)) {
    fail(`${ctx} no credential strings`, 'record contains a credential-like string (token, secret, oauth, credential, api_key, access_key)');
  } else {
    pass(`${ctx} no credential strings`);
  }

  // No actual event IDs (long lowercase alphanumeric strings that don't start with keepmees-)
  const checkFields = ['title', 'description', 'source_file', 'notes'];
  for (const f of checkFields) {
    if (r[f] && typeof r[f] === 'string') {
      const words = r[f].split(/\s+/);
      for (const w of words) {
        if (looksLikeEventId(w)) {
          warn(`${ctx} ${f} may contain event ID`, `suspicious token: "${w}" — verify it is not a real Google Calendar event ID`);
        }
      }
    }
  }
}

// --- Check local sync map is not committed to git (may exist locally if gitignored) ---
function isGitTracked(relPath) {
  try {
    const result = execSync(`git ls-files --error-unmatch "${relPath}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}
const localMapRel = 'docs/project-control/external-sync-map.local.json';
if (isGitTracked(localMapRel)) {
  fail('external-sync-map.local.json not committed', 'file is tracked by git — remove from tracking and add to .gitignore');
} else {
  pass('external-sync-map.local.json not committed to git (gitignored or absent as expected)');
}

// --- Output ---
function printReport() {
  console.log('\n=== Google Calendar Source Record Validator ===\n');

  if (report.fail.length > 0) {
    console.log('FAILURES:');
    report.fail.forEach(l => console.log(' ', l));
    console.log('');
  }

  if (report.warn.length > 0) {
    console.log('WARNINGS:');
    report.warn.forEach(l => console.log(' ', l));
    console.log('');
  }

  console.log(`PASS: ${report.pass.length} items verified`);
  console.log(`Summary: ${report.pass.length} pass, ${warnings} warn, ${failures} fail`);

  if (failures === 0) {
    console.log('\nVERDICT: VALID — all source records pass schema validation.\n');
    console.log('Source records are ready for Gate 2 live comparison.');
    console.log('Run: node scripts/google-calendar-sync-dry-run.mjs --local-only');
  } else {
    console.log(`\nVERDICT: INVALID — ${failures} failure(s) found.\n`);
    console.log('Fix all failures before proceeding to Gate 2.');
  }

  console.log('\n---');
  console.log('No external sync was performed. No files were modified by this script.');
}

printReport();
process.exit(failures === 0 ? 0 : 1);
