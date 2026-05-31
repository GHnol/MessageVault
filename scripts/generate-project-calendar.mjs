#!/usr/bin/env node
/**
 * Generate Project Calendar (.ics) from Source Records
 *
 * Reads docs/project-control/google-calendar-source-records.json and generates
 * docs/project-control/keepmees-project-calendar.ics with stable UIDs
 * derived from os_id and AI_OS_ID markers in event descriptions.
 *
 * No dependencies. No API calls. No external writes beyond the .ics file.
 * Exit 0 = success. Exit 1 = error.
 *
 * Usage:
 *   node scripts/generate-project-calendar.mjs             # writes .ics
 *   node scripts/generate-project-calendar.mjs --dry-run   # prints .ics to stdout, does not write
 *   node scripts/generate-project-calendar.mjs --check     # validate source records only, no output
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE_FILE = 'docs/project-control/google-calendar-source-records.json';
const OUTPUT_FILE = 'docs/project-control/keepmees-project-calendar.ics';
const CALENDAR_DOMAIN = 'keepmees.local';
const CALENDAR_NAME = 'KeepMees Project Control';
const PRODID = '-//KeepMees//Project Control Tower//EN';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isCheck = args.includes('--check');
const today = new Date().toISOString().slice(0, 10);

// --- Load source records ---
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

if (!Array.isArray(records)) {
  console.error('FATAL: Source file must be a JSON array.');
  process.exit(1);
}

// --- Basic validation ---
const errors = [];
for (const r of records) {
  if (!r.os_id) errors.push(`Record missing os_id: ${JSON.stringify(r).slice(0, 60)}`);
  if (!r.title) errors.push(`${r.os_id}: missing title`);
  if (!r.start || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.start)) errors.push(`${r.os_id}: invalid start`);
  if (!r.end || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.end)) errors.push(`${r.os_id}: invalid end`);
  if (!r.timezone) errors.push(`${r.os_id}: missing timezone`);
}

if (errors.length > 0) {
  console.error('VALIDATION ERRORS:');
  errors.forEach(e => console.error('  ' + e));
  console.error('\nFix source records before generating .ics.');
  console.error('Run: node scripts/google-calendar-source-validate.mjs');
  process.exit(1);
}

if (isCheck) {
  console.log(`Source records valid: ${records.length} records`);
  console.log('No .ics generated (--check mode).');
  process.exit(0);
}

// --- ICS helpers ---
function formatDtStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatDtLocal(isoStr) {
  return isoStr.replace(/[-:]/g, '').replace('T', 'T');
}

function foldLine(line) {
  const MAX = 75;
  const CONTINUATION = '\r\n ';
  if (line.length <= MAX) return line;
  const parts = [];
  let remaining = line;
  parts.push(remaining.slice(0, MAX));
  remaining = remaining.slice(MAX);
  while (remaining.length > 0) {
    parts.push(remaining.slice(0, MAX - 1));
    remaining = remaining.slice(MAX - 1);
  }
  return parts.join(CONTINUATION);
}

function escapeIcsText(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

function buildVEvent(r) {
  const uid = `${r.os_id}@${CALENDAR_DOMAIN}`;
  const dtStamp = formatDtStamp();
  const dtStart = formatDtLocal(r.start);
  const dtEnd = formatDtLocal(r.end);
  const summary = escapeIcsText(r.title);
  const description = escapeIcsText(r.description);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${r.timezone}:${dtStart}`,
    `DTEND;TZID=${r.timezone}:${dtEnd}`,
  ];

  if (r.recurrence) {
    lines.push(`RRULE:${r.recurrence}`);
  }

  lines.push(`SUMMARY:${summary}`);
  lines.push(`DESCRIPTION:${description}`);
  lines.push('END:VEVENT');

  return lines.map(foldLine).join('\r\n');
}

const VTIMEZONE_BLOCK = `BEGIN:VTIMEZONE
TZID:America/New_York
X-LIC-LOCATION:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;

// --- Build .ics ---
const vEvents = records.map(buildVEvent).join('\r\n');

const icsContent = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  `PRODID:${PRODID}`,
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  `X-WR-CALNAME:${CALENDAR_NAME}`,
  'X-WR-TIMEZONE:America/New_York',
  VTIMEZONE_BLOCK,
  vEvents,
  'END:VCALENDAR',
].join('\r\n') + '\r\n';

// --- Output ---
if (isDryRun) {
  console.log(icsContent);
  console.log(`\n--- DRY RUN: .ics not written to disk (${records.length} events) ---`);
} else {
  const outputPath = join(ROOT, OUTPUT_FILE);
  writeFileSync(outputPath, icsContent, 'utf8');
  console.log(`Generated: ${OUTPUT_FILE}`);
  console.log(`Events: ${records.length}`);
  console.log(`UIDs: <os_id>@${CALENDAR_DOMAIN} format (stable across regenerations)`);
  console.log(`AI_OS_ID markers: included in all event descriptions`);
  console.log('');
  console.log('NOTE: This regenerated .ics uses new stable UIDs based on os_id.');
  console.log('  Existing Google Calendar events have old UIDs from the 2026-05-17 import.');
  console.log('  Reimporting this .ics will create new events — not update old ones.');
  console.log('  Use the API-based dry-run/apply flow (Gate 2/3) for live sync.');
  console.log('  The .ics is the fallback export artifact, not the primary sync path.');
  console.log('');
  console.log('---');
  console.log('No external sync was performed. Only the .ics file was written locally.');
}

process.exit(0);
