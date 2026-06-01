#!/usr/bin/env node
/**
 * External Sync Consistency Check — AI Project OS v1.7 Gate 5
 *
 * Read-only validator that compares four layers where available:
 *   Layer 1 — repo source records (google-calendar-source-records.json, github-projects-source-records.json)
 *   Layer 2 — local ignored sync map (docs/project-control/external-sync-map.local.json — never printed raw)
 *   Layer 3 — live external read-only state (--google-calendar --live-readonly or --github-projects --live-readonly)
 *   Layer 4 — committed logs and status docs (sync logs, AI_HANDOFF.md, kanban-board.md, etc.)
 *
 * Local sync map shape normalization (read-only):
 *   apply-script shape: google_calendar.events[os_id] / github_projects.issues[os_id]
 *   example/direct shape: google_calendar[os_id] / github_projects[os_id]
 *   Both shapes are normalized before comparison. Container keys (events, issues, _*) are never treated as os_ids.
 *
 * no raw contents printed — only safe summaries: map present/missing, gitignored status, counts, unresolved os_id counts.
 *
 * No external mutations. No apply. No credentials stored. No raw local map contents printed.
 * No external dependencies. No API calls without explicit --live-readonly flag.
 * No external writes. No mutations of any kind.
 *
 * Modes:
 *   (default / --local-only)
 *     Compare source records against local sync map (if present) and committed logs.
 *     No credentials required. No API calls.
 *
 *   --fixture <path>
 *     Run fixture/mock consistency checks. No credentials. No API calls.
 *     Exits 1 if unexpected failures detected.
 *
 *   --fixture-test
 *     Use with --fixture. Proves the fixture intentionally detects expected issue codes.
 *     Exits 0 when all _expected_issues codes from the fixture file are found in the results.
 *     Exits 1 if any expected code is missing (meaning detection is broken).
 *
 *   --google-calendar [--live-readonly]
 *     Validate Google Calendar source records and optional live read-only comparison.
 *     --live-readonly requires credentials and googleapis in scripts/node_modules/.
 *
 *   --github-projects [--live-readonly]
 *     Validate GitHub Projects source records, field map, and optional live read-only comparison.
 *     --live-readonly requires gh CLI authentication.
 *
 *   --all
 *     Run both --google-calendar and --github-projects checks.
 *
 *   --strict
 *     Convert selected WARNs to FAIL when relevant.
 *
 *   --explain
 *     Show descriptions for each issue code.
 *
 *   --paths
 *     Print all file paths checked.
 *
 *   --json
 *     Output results as JSON.
 *
 *   --output <path>
 *     Write JSON output to this path (must be under local-sync-reports/).
 *
 * Exit behavior:
 *   exit 0 if PASS or WARN only
 *   exit 1 if FAIL exists (or any WARN with --strict)
 *   with --fixture-test: exit 0 if all _expected_issues codes found; exit 1 if any missing
 *
 * Usage:
 *   node scripts/external-sync-consistency-check.mjs
 *   node scripts/external-sync-consistency-check.mjs --json
 *   node scripts/external-sync-consistency-check.mjs --local-only
 *   node scripts/external-sync-consistency-check.mjs --fixture docs/project-control/external-sync-consistency-fixture.example.json
 *   node scripts/external-sync-consistency-check.mjs --fixture docs/project-control/external-sync-consistency-fixture.example.json --fixture-test
 *   node scripts/external-sync-consistency-check.mjs --google-calendar --local-only
 *   node scripts/external-sync-consistency-check.mjs --github-projects --local-only
 *   node scripts/external-sync-consistency-check.mjs --all --local-only
 *   node scripts/external-sync-consistency-check.mjs --explain
 *   node scripts/external-sync-consistency-check.mjs --paths
 *   node scripts/external-sync-consistency-check.mjs --google-calendar --live-readonly --output local-sync-reports/external-sync-consistency-google-calendar-live.json
 *   node scripts/external-sync-consistency-check.mjs --github-projects --live-readonly --output local-sync-reports/external-sync-consistency-github-projects-live.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { execSync, execFileSync } from 'child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const GENERATED_AT = new Date().toISOString();
const SCHEMA_VERSION = '1.7.5';

// File paths
const GCAL_SOURCE_FILE = 'docs/project-control/google-calendar-source-records.json';
const GHP_SOURCE_FILE = 'docs/project-control/github-projects-source-records.json';
const GHP_FIELD_MAP_EXAMPLE = 'docs/project-control/github-projects-field-map.example.json';
const LOCAL_MAP_FILE = 'docs/project-control/external-sync-map.local.json';
const GCAL_SYNC_LOG = 'docs/project-control/google-calendar-sync-log.md';
const GHP_SYNC_LOG = 'docs/project-control/github-projects-sync-log.md';
const AI_HANDOFF = 'AI_HANDOFF.md';
const CREDENTIALS_FILE = 'docs/project-control/google-calendar-credentials.local.json';
const TOKEN_FILE = 'docs/project-control/google-calendar-token.local.json';
const REPORT_DIR = 'local-sync-reports';

// --- Argument parsing ---
const args = process.argv.slice(2);
const hasArg = (flag) => args.includes(flag);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};

const flagLocalOnly = hasArg('--local-only');
const flagJson = hasArg('--json');
const flagStrict = hasArg('--strict');
const flagExplain = hasArg('--explain');
const flagPaths = hasArg('--paths');
const flagFixture = getArg('--fixture');
const flagFixtureTest = hasArg('--fixture-test');
const flagLiveReadonly = hasArg('--live-readonly');
const flagGoogleCalendar = hasArg('--google-calendar');
const flagGithubProjects = hasArg('--github-projects');
const flagAll = hasArg('--all');
const flagOutput = getArg('--output');

const runGcal = flagGoogleCalendar || flagAll || flagFixture || (!flagGithubProjects && !flagGoogleCalendar && !flagAll);
const runGhp = flagGithubProjects || flagAll || flagFixture || (!flagGithubProjects && !flagGoogleCalendar && !flagAll);
const liveMode = flagLiveReadonly && !flagLocalOnly;
const fixtureMode = !!flagFixture;

// --- Issue accumulator ---
const issues = [];
const paths = [];

function addIssue(code, severity, message, detail = null) {
  issues.push({ code, severity, message, detail });
}

function trackPath(label, path) {
  paths.push({ label, path });
}

// --- Helpers ---
function fileExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

function readJSON(relPath) {
  try {
    return JSON.parse(readFileSync(join(ROOT, relPath), 'utf8'));
  } catch {
    return null;
  }
}

function readText(relPath) {
  try {
    return readFileSync(join(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

function isGitignored(relPath) {
  try {
    const result = execSync(`git check-ignore -v "${relPath}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// ============================================================================
// LOCAL MAP NORMALIZATION
// Supports both shapes without printing raw contents.
// apply-script shape: google_calendar.events[os_id] / github_projects.issues[os_id]
// example/direct shape: google_calendar[os_id] / github_projects[os_id]
// Container keys (events, issues, _*) are never treated as os_ids.
// ============================================================================

function normalizeGcalEntries(raw) {
  if (!raw || !raw.google_calendar || typeof raw.google_calendar !== 'object') {
    return { entries: {}, shape: 'none', count: 0 };
  }
  const gcal = raw.google_calendar;

  // apply-script shape: google_calendar.events[os_id]
  if (gcal.events && typeof gcal.events === 'object' && !Array.isArray(gcal.events)) {
    const entries = {};
    for (const [osId, entry] of Object.entries(gcal.events)) {
      if (typeof entry === 'object' && entry !== null && !osId.startsWith('_')) {
        entries[osId] = entry;
      }
    }
    return { entries, shape: 'apply-script-shape', count: Object.keys(entries).length };
  }

  // example/direct shape: google_calendar[os_id]
  // Skip container-like keys: events, issues, _*
  const SKIP_KEYS = new Set(['events', 'issues', '_project_meta', '_field_ids', '_option_ids', '_comment', '_default_board_provider', '_format_version', '_last_updated', '_note']);
  const entries = {};
  for (const [key, entry] of Object.entries(gcal)) {
    if (!key.startsWith('_') && !SKIP_KEYS.has(key) && typeof entry === 'object' && entry !== null) {
      entries[key] = entry;
    }
  }
  return { entries, shape: 'example-shape', count: Object.keys(entries).length };
}

function normalizeGhpEntries(raw) {
  if (!raw || !raw.github_projects || typeof raw.github_projects !== 'object') {
    return { entries: {}, shape: 'none', count: 0 };
  }
  const ghp = raw.github_projects;

  // apply-script shape: github_projects.issues[os_id]
  if (ghp.issues && typeof ghp.issues === 'object' && !Array.isArray(ghp.issues)) {
    const entries = {};
    for (const [osId, entry] of Object.entries(ghp.issues)) {
      if (typeof entry === 'object' && entry !== null && !osId.startsWith('_')) {
        entries[osId] = entry;
      }
    }
    return { entries, shape: 'apply-script-shape', count: Object.keys(entries).length };
  }

  // example/direct shape: github_projects[os_id] (filter out meta/container keys)
  const SKIP_KEYS = new Set(['_project_meta', '_field_ids', '_option_ids', '_comment', 'events', 'issues']);
  const entries = {};
  for (const [key, entry] of Object.entries(ghp)) {
    if (!key.startsWith('_') && !SKIP_KEYS.has(key) && typeof entry === 'object' && entry !== null) {
      entries[key] = entry;
    }
  }
  return { entries, shape: 'example-shape', count: Object.keys(entries).length };
}

// ============================================================================
// CROSS-PLATFORM CHECKS
// ============================================================================

function checkCrossPlatform() {
  const privatePaths = [
    { label: 'external-sync-map.local.json', path: LOCAL_MAP_FILE },
    { label: 'google-calendar-credentials.local.json', path: CREDENTIALS_FILE },
    { label: 'google-calendar-token.local.json', path: TOKEN_FILE },
    { label: 'local-sync-reports/', path: 'local-sync-reports/example.json' },
    { label: 'local-report-intake/', path: 'local-report-intake/example.md' },
    { label: 'raw-transcripts/', path: 'raw-transcripts/example.md' },
  ];

  let allIgnored = true;
  for (const { label, path } of privatePaths) {
    trackPath(`private-ignored: ${label}`, path);
    if (!isGitignored(path)) {
      addIssue('FAIL_EXTERNAL_LOCAL_PRIVATE_FILE_NOT_IGNORED', 'FAIL',
        `Local private path is NOT gitignored: ${label}`,
        `Run: git check-ignore -v ${path}`);
      allIgnored = false;
    }
  }
  if (allIgnored) {
    addIssue('PASS_EXTERNAL_LOCAL_PRIVATE_PATHS_IGNORED', 'PASS',
      'All local/private paths are gitignored.');
  }

  let gitStatus = '';
  try {
    gitStatus = execSync('git status --short', { cwd: ROOT, encoding: 'utf8' });
  } catch { /* ignore */ }

  if (gitStatus.includes('external-sync-map.local.json')) {
    addIssue('FAIL_EXTERNAL_SYNC_MAP_IN_GIT_STATUS', 'FAIL',
      'external-sync-map.local.json appears in git status — must not be staged or tracked.',
      gitStatus.split('\n').filter(l => l.includes('external-sync-map.local.json')).join('\n'));
  }

  const credentialPatterns = [
    'google-calendar-credentials.local.json',
    'google-calendar-token.local.json',
    'github-projects-template-config.local.json',
  ];
  for (const pattern of credentialPatterns) {
    if (gitStatus.includes(pattern)) {
      addIssue('FAIL_EXTERNAL_CREDENTIAL_OR_TOKEN_IN_GIT_STATUS', 'FAIL',
        `Credential/token file appears in git status: ${pattern}`,
        'These files must be gitignored and never staged.');
    }
  }

  const handoffContent = readText(AI_HANDOFF);
  if (handoffContent && handoffContent.includes('gate3_apply_allowed: true') && !handoffContent.includes('COMPLETE')) {
    addIssue('FAIL_EXTERNAL_APPLY_AUTH_MISMATCH', 'FAIL',
      'AI_HANDOFF.md suggests external apply may be authorized but gate status is unclear.',
      'Verify gate3_apply_allowed status before any apply.');
  } else {
    addIssue('PASS_EXTERNAL_NO_APPLY_PENDING', 'PASS',
      'No unauthorized external apply appears pending.');
  }

  if (!liveMode) {
    addIssue('WARN_EXTERNAL_LIVE_NOT_RUN', 'WARN',
      'Live read-only external check was not run.',
      'Run with --google-calendar --live-readonly or --github-projects --live-readonly to check live state.');
  }

  const gcalLogContent = readText(GCAL_SYNC_LOG);
  const ghpLogContent = readText(GHP_SYNC_LOG);
  if (!gcalLogContent || !ghpLogContent) {
    addIssue('WARN_EXTERNAL_LOG_STATUS_LAG', 'WARN',
      'One or more external sync logs are missing or unreadable.',
      'Verify google-calendar-sync-log.md and github-projects-sync-log.md exist.');
  }
}

// ============================================================================
// GOOGLE CALENDAR CHECKS
// ============================================================================

function checkGcalSourceRecords(sourceRecords) {
  if (!sourceRecords || !Array.isArray(sourceRecords)) {
    addIssue('FAIL_GCAL_SOURCE_INVALID', 'FAIL',
      'Google Calendar source records are missing or invalid JSON.',
      `Expected at: ${GCAL_SOURCE_FILE}`);
    return false;
  }

  const osIds = sourceRecords.map(r => r.os_id).filter(Boolean);
  const duplicates = osIds.filter((id, i) => osIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    addIssue('FAIL_GCAL_DUPLICATE_DETECTED', 'FAIL',
      `Duplicate os_id values in source records: ${duplicates.join(', ')}`,
      'Each source record must have a unique os_id.');
    return false;
  }

  const required = ['os_id', 'title', 'description', 'calendar_role', 'start', 'end', 'timezone', 'status'];
  let valid = true;
  for (const rec of sourceRecords) {
    for (const field of required) {
      if (!rec[field]) {
        addIssue('FAIL_GCAL_SOURCE_INVALID', 'FAIL',
          `Source record missing required field '${field}': os_id=${rec.os_id || 'unknown'}`);
        valid = false;
      }
    }
    if (rec.description && !rec.description.includes('AI_OS_ID:')) {
      addIssue('FAIL_GCAL_SOURCE_INVALID', 'FAIL',
        `Source record description missing AI_OS_ID marker: os_id=${rec.os_id}`,
        "Every description must contain 'AI_OS_ID: <os_id>'.");
      valid = false;
    }
  }

  if (valid) {
    addIssue('PASS_GCAL_SOURCE_RECORDS_VALID', 'PASS',
      `Google Calendar source records valid: ${sourceRecords.length} records, all os_ids unique, all AI_OS_ID markers present.`);
  }
  return valid;
}

/**
 * Check local sync map against GCal source records.
 * mapEntries: normalized entries from normalizeGcalEntries() — keys are os_ids, never container keys.
 */
function checkGcalLocalMap(sourceRecords, mapEntries, mapShape) {
  const mapOsIds = Object.keys(mapEntries);
  const sourceOsIds = (sourceRecords || []).map(r => r.os_id);
  const missing = sourceOsIds.filter(id => !mapOsIds.includes(id));

  if (missing.length > 0) {
    addIssue('FAIL_GCAL_SOURCE_MISSING_LOCAL_MAP_ENTRY', 'FAIL',
      `Source records have os_ids not found in local sync map: ${missing.length} missing.`,
      `Missing os_ids: ${missing.join(', ')}`);
  } else {
    addIssue('PASS_GCAL_SOURCE_TO_MAP_ALIGNED', 'PASS',
      `All ${sourceOsIds.length} source record os_ids are present in local sync map (shape: ${mapShape}).`);
  }
}

function checkGcalLogStatus() {
  const logContent = readText(GCAL_SYNC_LOG);
  if (!logContent) {
    addIssue('WARN_GCAL_LOG_LAG', 'WARN',
      'Google Calendar sync log is missing or unreadable.');
    return;
  }
  if (!logContent.includes('Gate 3') || !logContent.includes('COMPLETE')) {
    addIssue('WARN_GCAL_LOG_LAG', 'WARN',
      'Google Calendar sync log does not show Gate 3 COMPLETE.',
      'Verify google-calendar-sync-log.md reflects the v1.6 Gate 3 apply outcome.');
  }
}

async function checkGcalLive(sourceRecords, mapEntries) {
  const credPath = join(ROOT, CREDENTIALS_FILE);
  const tokenPath = join(ROOT, TOKEN_FILE);
  if (!existsSync(credPath) || !existsSync(tokenPath)) {
    addIssue('FAIL_GCAL_LOCAL_MAP_REQUIRED_MISSING', 'FAIL',
      'Live Google Calendar read-only check requires credentials and token files.',
      `Missing: ${!existsSync(credPath) ? CREDENTIALS_FILE : ''} ${!existsSync(tokenPath) ? TOKEN_FILE : ''}`.trim());
    return;
  }

  const nodeMods = join(ROOT, 'scripts', 'node_modules');
  const googleapis = join(nodeMods, 'googleapis');
  if (!existsSync(nodeMods) || !existsSync(googleapis)) {
    addIssue('FAIL_GCAL_LOCAL_MAP_REQUIRED_MISSING', 'FAIL',
      'Live Google Calendar check requires googleapis in scripts/node_modules/.',
      'Install: cd scripts && npm install');
    return;
  }

  let google;
  try {
    // Use explicit build entry point to avoid ESM directory resolution issues on Windows
    const buildPath = join(ROOT, 'scripts', 'node_modules', 'googleapis', 'build', 'src', 'index.js');
    if (!existsSync(buildPath)) throw new Error(`googleapis build entry not found: ${buildPath}`);
    const mod = await import(pathToFileURL(buildPath).href);
    google = mod.google || mod.default?.google;
    if (!google) throw new Error('googleapis imported but google export not found');
  } catch (e) {
    addIssue('FAIL_GCAL_LOCAL_MAP_REQUIRED_MISSING', 'FAIL',
      'Failed to import googleapis. Cannot run live check.',
      String(e.message));
    return;
  }

  try {
    const credentials = JSON.parse(readFileSync(credPath, 'utf8'));
    const token = JSON.parse(readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web || {};
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : undefined);
    oAuth2Client.setCredentials(token);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    let allEvents = [];
    let pageToken;
    do {
      const res = await calendar.events.list({
        calendarId: 'primary',
        maxResults: 250,
        pageToken,
        singleEvents: false,
      });
      allEvents = allEvents.concat(res.data.items || []);
      pageToken = res.data.nextPageToken;
    } while (pageToken);

    const sourceOsIds = (sourceRecords || []).map(r => r.os_id);

    let noOpCount = 0;
    let missingLiveCount = 0;
    let duplicateCount = 0;

    for (const osId of sourceOsIds) {
      const mapEntry = mapEntries[osId];
      if (!mapEntry) continue; // Already reported as FAIL_GCAL_SOURCE_MISSING_LOCAL_MAP_ENTRY if map present

      const externalId = mapEntry.event_id || mapEntry.external_id;

      const matchingEvents = allEvents.filter(e => {
        const descMarker = e.description && e.description.includes(`AI_OS_ID: ${osId}`);
        const extPropMarker = e.extendedProperties?.private?.ai_os_id === osId;
        const idMatch = externalId && e.id === externalId;
        return descMarker || extPropMarker || idMatch;
      });

      if (matchingEvents.length === 0) {
        addIssue('FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY', 'FAIL',
          `Mapped event not found in Google Calendar: os_id=${osId}`,
          'The local map entry exists but no live event matched by AI_OS_ID marker or event ID.');
        missingLiveCount++;
      } else if (matchingEvents.length > 1) {
        addIssue('FAIL_GCAL_DUPLICATE_DETECTED', 'FAIL',
          `Multiple live events found for os_id=${osId}: ${matchingEvents.length} events.`,
          'Duplicate prevention may have failed. Manual review required.');
        duplicateCount++;
      } else {
        noOpCount++;
      }
    }

    // Check for possible duplicates — scoped to source-record titles and AI_OS_ID-bearing events only.
    // Broad title+date matching across all calendar events would produce false positives.
    const sourceTitles = new Set((sourceRecords || []).map(r => r.title));
    const titleDateMap = {};
    for (const event of allEvents) {
      if (!event.summary || !event.start) continue;
      const hasAiMarker = event.description && event.description.includes('AI_OS_ID:');
      const matchesSourceTitle = sourceTitles.has(event.summary);
      if (!hasAiMarker && !matchesSourceTitle) continue; // skip unrelated events
      const key = `${event.summary}::${(event.start.date || event.start.dateTime || '').slice(0, 10)}`;
      if (!titleDateMap[key]) titleDateMap[key] = [];
      titleDateMap[key].push(event.id);
    }
    for (const [key, ids] of Object.entries(titleDateMap)) {
      if (ids.length > 1) {
        addIssue('FAIL_GCAL_POSSIBLE_DUPLICATE', 'FAIL',
          `Possible duplicate KeepMees events for title+date key: ${key} (${ids.length} events)`,
          'Two or more KeepMees-related events share the same title and date. Check AI_OS_ID markers.');
      }
    }

    if (missingLiveCount === 0 && duplicateCount === 0) {
      addIssue('PASS_GCAL_LIVE_NO_OP', 'PASS',
        `Live check: ${noOpCount} events confirmed present. No missing or duplicate events.`);
    }

  } catch (e) {
    addIssue('FAIL_GCAL_REMOTE_DRIFT', 'FAIL',
      'Live Google Calendar read-only check failed with an error.',
      `Error: ${e.message}`);
  }
}

async function runGcalChecks(fixtureData) {
  trackPath('gcal-source-records', GCAL_SOURCE_FILE);
  trackPath('local-sync-map', LOCAL_MAP_FILE);
  trackPath('gcal-sync-log', GCAL_SYNC_LOG);

  if (fixtureMode && fixtureData) {
    checkGcalFixture(fixtureData);
    return;
  }

  const sourceRecords = readJSON(GCAL_SOURCE_FILE);
  if (!checkGcalSourceRecords(sourceRecords)) return;

  const localMapPath = join(ROOT, LOCAL_MAP_FILE);
  if (existsSync(localMapPath)) {
    const raw = readJSON(LOCAL_MAP_FILE);
    if (!raw) {
      addIssue('WARN_GCAL_LOCAL_MAP_MISSING', 'WARN',
        'Local sync map file exists but could not be parsed.',
        `Path: ${LOCAL_MAP_FILE}`);
    } else {
      const { entries, shape, count } = normalizeGcalEntries(raw);
      addIssue('PASS_GCAL_LOCAL_MAP_PRESENT', 'PASS',
        `Local sync map present with google_calendar section: ${count} entries (shape: ${shape}).`);
      checkGcalLocalMap(sourceRecords, entries, shape);
    }
  } else {
    if (liveMode) {
      addIssue('FAIL_GCAL_LOCAL_MAP_REQUIRED_MISSING', 'FAIL',
        'Local sync map is required for live consistency check but is absent.',
        `Expected: ${LOCAL_MAP_FILE}`);
    } else {
      addIssue('WARN_GCAL_LOCAL_MAP_MISSING', 'WARN',
        'Local sync map is absent.',
        'Expected after v1.6 Gate 3 apply. Absent is expected before first apply.');
    }
  }

  checkGcalLogStatus();

  if (liveMode) {
    const raw = readJSON(LOCAL_MAP_FILE);
    const mapEntries = raw ? normalizeGcalEntries(raw).entries : {};
    await checkGcalLive(sourceRecords, mapEntries);
  } else {
    addIssue('WARN_GCAL_LIVE_NOT_RUN', 'WARN',
      'Google Calendar live read-only check was not run.',
      'Add --live-readonly to run live check against Google Calendar API.');
  }
}

function checkGcalFixture(fixtureData) {
  const sourceRecords = fixtureData.google_calendar_source_records || [];
  // For fixture mode, use the fixture's local map directly — normalized same way
  const fixtureMapRaw = fixtureData.local_sync_map || null;
  const liveEvents = fixtureData.google_calendar_live_events || null;

  if (!checkGcalSourceRecords(sourceRecords)) return;

  let mapEntries = {};
  let mapShape = 'none';

  if (!fixtureMapRaw || !fixtureMapRaw.google_calendar) {
    addIssue('WARN_GCAL_LOCAL_MAP_MISSING', 'WARN',
      'Fixture has no local_sync_map.google_calendar section.');
  } else {
    const normalized = normalizeGcalEntries(fixtureMapRaw);
    mapEntries = normalized.entries;
    mapShape = normalized.shape;
    addIssue('PASS_GCAL_LOCAL_MAP_PRESENT', 'PASS',
      `Fixture local map present with google_calendar section: ${normalized.count} entries (shape: ${mapShape}).`);
    checkGcalLocalMap(sourceRecords, mapEntries, mapShape);
  }

  if (!liveEvents) {
    addIssue('WARN_GCAL_LIVE_NOT_RUN', 'WARN',
      'Fixture has no google_calendar_live_events section — live comparison skipped.');
    return;
  }

  const sourceOsIds = sourceRecords.map(r => r.os_id);

  for (const osId of sourceOsIds) {
    const mapEntry = mapEntries[osId];

    const matchingEvents = liveEvents.filter(e => {
      const descMarker = e.description && e.description.includes(`AI_OS_ID: ${osId}`);
      const extPropMarker = e.extendedProperties?.private?.ai_os_id === osId;
      const idMatch = mapEntry && e.id === (mapEntry.event_id || mapEntry.external_id);
      return descMarker || extPropMarker || idMatch;
    });

    if (!mapEntry) {
      // Already reported by checkGcalLocalMap — add per-record context only if not already reported
      addIssue('FAIL_GCAL_SOURCE_MISSING_LOCAL_MAP_ENTRY', 'FAIL',
        `Source record has no local map entry: os_id=${osId}`,
        'After apply is complete, all source records should have local map entries.');
    } else if (matchingEvents.length === 0) {
      addIssue('FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY', 'FAIL',
        `Source record mapped but fixture event not found: os_id=${osId}`,
        'The local map entry exists but no fixture event matched.');
    } else if (matchingEvents.length > 1) {
      addIssue('FAIL_GCAL_DUPLICATE_DETECTED', 'FAIL',
        `Multiple fixture events for os_id=${osId}: ${matchingEvents.length}`,
        'Duplicate events detected in fixture — deduplication required.');
    } else {
      addIssue('PASS_GCAL_LIVE_NO_OP', 'PASS',
        `Fixture: os_id=${osId} maps to exactly one live event with AI_OS_ID marker.`);
    }
  }

  // Check for possible duplicates in fixture events
  const titleDateMap = {};
  for (const e of liveEvents) {
    if (!e.summary || !e.start) continue;
    const key = `${e.summary}::${(e.start.date || e.start.dateTime || '').slice(0, 10)}`;
    if (!titleDateMap[key]) titleDateMap[key] = [];
    titleDateMap[key].push(e.id);
  }
  for (const [key, ids] of Object.entries(titleDateMap)) {
    if (ids.length > 1) {
      addIssue('FAIL_GCAL_POSSIBLE_DUPLICATE', 'FAIL',
        `Possible duplicate fixture events for title+date key: ${key} (${ids.length} events)`,
        'Events with identical title and date may be duplicates.');
    }
  }
}

// ============================================================================
// GITHUB PROJECTS CHECKS
// ============================================================================

function checkGhpSourceRecords(sourceRecords) {
  if (!sourceRecords || !Array.isArray(sourceRecords)) {
    addIssue('FAIL_GHP_SOURCE_INVALID', 'FAIL',
      'GitHub Projects source records are missing or invalid JSON.',
      `Expected at: ${GHP_SOURCE_FILE}`);
    return false;
  }

  const osIds = sourceRecords.map(r => r.os_id).filter(Boolean);
  const duplicates = osIds.filter((id, i) => osIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    addIssue('FAIL_GHP_DUPLICATE_OS_ID', 'FAIL',
      `Duplicate os_id values in GitHub Projects source records: ${duplicates.join(', ')}`,
      'Each source record must have a unique os_id.');
    return false;
  }

  const required = ['os_id', 'title', 'type', 'status', 'owner_role'];
  let valid = true;
  for (const rec of sourceRecords) {
    for (const field of required) {
      if (!rec[field]) {
        addIssue('FAIL_GHP_SOURCE_INVALID', 'FAIL',
          `Source record missing required field '${field}': os_id=${rec.os_id || 'unknown'}`);
        valid = false;
      }
    }
  }

  if (valid) {
    addIssue('PASS_GHP_SOURCE_RECORDS_VALID', 'PASS',
      `GitHub Projects source records valid: ${sourceRecords.length} records, all os_ids unique.`);
  }
  return valid;
}

function checkGhpFieldMap() {
  trackPath('ghp-field-map-example', GHP_FIELD_MAP_EXAMPLE);
  const fieldMap = readJSON(GHP_FIELD_MAP_EXAMPLE);
  if (!fieldMap) {
    addIssue('FAIL_GHP_FIELD_MAP_INVALID', 'FAIL',
      'GitHub Projects field map example is missing or invalid JSON.',
      `Expected at: ${GHP_FIELD_MAP_EXAMPLE}`);
    return false;
  }

  const raw = readText(GHP_FIELD_MAP_EXAMPLE) || '';
  if (!raw.includes('placeholder') && !raw.includes('PVT_placeholder')) {
    addIssue('FAIL_GHP_FIELD_MAP_INVALID', 'FAIL',
      'GitHub Projects field map example may contain real IDs instead of placeholders.',
      'Example files must use placeholder values only.');
    return false;
  }

  addIssue('PASS_GHP_FIELD_MAP_VALID', 'PASS',
    'GitHub Projects field map example is valid JSON with placeholder IDs.');
  return true;
}

/**
 * Check local sync map against GHP source records.
 * mapEntries: normalized entries from normalizeGhpEntries() — keys are os_ids, never container keys.
 */
function checkGhpLocalMap(sourceRecords, mapEntries, mapShape) {
  const sourceOsIds = (sourceRecords || []).map(r => r.os_id);
  const mapOsIds = Object.keys(mapEntries);
  const missing = sourceOsIds.filter(id => !mapOsIds.includes(id));

  if (missing.length > 0) {
    addIssue('FAIL_GHP_SOURCE_MISSING_LOCAL_MAP_ENTRY', 'FAIL',
      `Source records have os_ids not found in GitHub Projects local sync map: ${missing.length} missing.`,
      `Missing os_ids: ${missing.join(', ')}`);
  } else {
    addIssue('PASS_GHP_SOURCE_TO_MAP_ALIGNED', 'PASS',
      `All ${sourceOsIds.length} source record os_ids are present in GitHub Projects local sync map (shape: ${mapShape}).`);
  }
}

async function checkGhpLive(sourceRecords, mapEntries) {
  try {
    execSync('gh auth status', { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    addIssue('FAIL_GHP_LOCAL_MAP_REQUIRED_MISSING', 'FAIL',
      'Live GitHub Projects check requires gh CLI authentication.',
      'Run: gh auth login');
    return;
  }

  try {
    let viewerLogin;
    try {
      const result = execSync('gh api graphql -f query="{ viewer { login } }"', {
        cwd: ROOT, encoding: 'utf8', stdio: 'pipe'
      });
      const parsed = JSON.parse(result);
      viewerLogin = parsed.data?.viewer?.login;
    } catch {
      addIssue('FAIL_GHP_PROJECT_NOT_FOUND', 'FAIL',
        'Failed to authenticate with GitHub API via gh CLI.',
        'Check gh auth status and token scopes.');
      return;
    }

    let projectData;
    try {
      const projectQuery = `{
        user(login: "${viewerLogin}") {
          projectV2(number: 1) {
            id title
            fields(first: 30) {
              nodes {
                ... on ProjectV2Field { id name }
                ... on ProjectV2SingleSelectField { id name options { id name } }
              }
            }
            items(first: 100) {
              totalCount
              nodes {
                id
                content { ... on Issue { number title body state } }
                fieldValues(first: 20) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue { field { ... on ProjectV2SingleSelectField { name } } name }
                    ... on ProjectV2ItemFieldTextValue { field { ... on ProjectV2Field { name } } text }
                  }
                }
              }
            }
          }
        }
      }`;
      // Use stdin JSON to avoid shell escaping issues with multi-line queries
      const result = execFileSync('gh', ['api', 'graphql', '--input', '-'], {
        cwd: ROOT,
        encoding: 'utf8',
        input: JSON.stringify({ query: projectQuery }),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      projectData = JSON.parse(result).data?.user?.projectV2;
    } catch (e) {
      addIssue('FAIL_GHP_PROJECT_NOT_FOUND', 'FAIL',
        'Could not query KeepMees GitHub Project #1.',
        `Error: ${e.message || 'unknown'}. Project may not exist or token lacks read:project scope.`);
      return;
    }

    if (!projectData) {
      addIssue('FAIL_GHP_PROJECT_NOT_FOUND', 'FAIL',
        'GitHub Project #1 not found for this user.');
      return;
    }

    addIssue('PASS_GHP_LIVE_PROJECT_FOUND', 'PASS',
      `GitHub Project found: "${projectData.title}" with ${projectData.items.totalCount} items.`);

    const fields = (projectData.fields.nodes || []).filter(f => f.name);
    if (fields.length < 10) {
      addIssue('WARN_GHP_VIEW_MANUAL_ONLY', 'WARN',
        `Only ${fields.length} fields found. Expected ~13 custom fields.`);
    }

    const items = projectData.items.nodes || [];
    const sourceOsIds = (sourceRecords || []).map(r => r.os_id);

    const liveOsIdMap = {};
    for (const item of items) {
      const body = item.content?.body || '';
      const match = body.match(/<!--\s*ai-os-id:\s*([^\s>]+)\s*-->/);
      if (match) {
        const osId = match[1];
        if (liveOsIdMap[osId]) {
          addIssue('FAIL_GHP_PROJECT_ITEM_MISSING', 'FAIL',
            `Duplicate Project item for os_id=${osId}.`);
        } else {
          liveOsIdMap[osId] = item;
        }
      }
    }

    let alignedCount = 0;
    for (const osId of sourceOsIds) {
      const mapEntry = mapEntries[osId];
      const liveItem = liveOsIdMap[osId];

      if (!mapEntry && !liveItem) continue;

      if (mapEntry && !liveItem) {
        addIssue('FAIL_GHP_PROJECT_ITEM_MISSING', 'FAIL',
          `Local map has entry for os_id=${osId} but no matching live Project item.`);
        continue;
      }

      if (!mapEntry && liveItem) {
        addIssue('WARN_GHP_LOCAL_MAP_MISSING', 'WARN',
          `Live Project item found for os_id=${osId} but no local map entry.`);
        continue;
      }

      const srcRecord = (sourceRecords || []).find(r => r.os_id === osId);
      if (srcRecord && liveItem.fieldValues) {
        const fieldVals = liveItem.fieldValues.nodes || [];
        const statusField = fieldVals.find(fv => fv.field?.name === 'Status');
        if (statusField && srcRecord.status && statusField.name !== srcRecord.status) {
          addIssue('FAIL_GHP_FIELD_VALUE_DRIFT', 'FAIL',
            `Field value drift for os_id=${osId}: Status='${statusField.name}' in GitHub but '${srcRecord.status}' in source records.`);
        } else {
          alignedCount++;
        }
      } else {
        alignedCount++;
      }
    }

    if (alignedCount > 0) {
      addIssue('PASS_GHP_LIVE_ITEMS_ALIGNED', 'PASS',
        `${alignedCount} source record items confirmed aligned in live GitHub Project.`);
    }

    addIssue('WARN_GHP_VIEW_MANUAL_ONLY', 'WARN',
      'GitHub Project views cannot be fully validated by script.',
      'Views must be verified manually in GitHub UI.');

  } catch (e) {
    addIssue('FAIL_GHP_PROJECT_NOT_FOUND', 'FAIL',
      'Live GitHub Projects read-only check failed.',
      `Error: ${e.message}`);
  }
}

async function runGhpChecks(fixtureData) {
  trackPath('ghp-source-records', GHP_SOURCE_FILE);
  trackPath('ghp-field-map-example', GHP_FIELD_MAP_EXAMPLE);
  trackPath('local-sync-map', LOCAL_MAP_FILE);
  trackPath('ghp-sync-log', GHP_SYNC_LOG);

  if (fixtureMode && fixtureData) {
    checkGhpFixture(fixtureData);
    return;
  }

  const sourceRecords = readJSON(GHP_SOURCE_FILE);
  if (!checkGhpSourceRecords(sourceRecords)) return;

  checkGhpFieldMap();

  const localMapPath = join(ROOT, LOCAL_MAP_FILE);
  let mapEntries = {};
  let mapShape = 'none';

  if (existsSync(localMapPath)) {
    const raw = readJSON(LOCAL_MAP_FILE);
    if (!raw) {
      addIssue('WARN_GHP_LOCAL_MAP_MISSING', 'WARN',
        'Local sync map file exists but could not be parsed.',
        `Path: ${LOCAL_MAP_FILE}`);
    } else {
      const normalized = normalizeGhpEntries(raw);
      mapEntries = normalized.entries;
      mapShape = normalized.shape;
      if (normalized.count === 0) {
        // Local map exists (e.g. from GCal apply) but no github_projects section or empty issues list.
        // This is expected when GHP import apply has not been run on this machine.
        // For live checks: we can still query the project, but cross-reference against local map won't be possible.
        addIssue('WARN_GHP_LOCAL_MAP_MISSING', 'WARN',
          'Local sync map present but has no github_projects section (count: 0).',
          'Expected after GitHub Projects import apply. Absent section is expected before first apply. Live check will proceed without local map cross-reference.');
      } else {
        addIssue('PASS_GHP_LOCAL_MAP_PRESENT', 'PASS',
          `Local sync map present with github_projects section: ${normalized.count} entries (shape: ${mapShape}).`);
        checkGhpLocalMap(sourceRecords, mapEntries, mapShape);
      }
    }
  } else {
    if (liveMode) {
      addIssue('FAIL_GHP_LOCAL_MAP_REQUIRED_MISSING', 'FAIL',
        'Local sync map is required for live GHP consistency check but is absent.',
        `Expected: ${LOCAL_MAP_FILE}`);
    } else {
      addIssue('WARN_GHP_LOCAL_MAP_MISSING', 'WARN',
        'GitHub Projects local sync map is absent.',
        'Expected after first import apply. Absent is expected before first apply.');
    }
  }

  if (liveMode) {
    await checkGhpLive(sourceRecords, mapEntries);
  } else {
    addIssue('WARN_GHP_LIVE_NOT_RUN', 'WARN',
      'GitHub Projects live read-only check was not run.',
      'Add --live-readonly to query live GitHub Projects state.');
  }
}

function checkGhpFixture(fixtureData) {
  const sourceRecords = fixtureData.github_projects_source_records || [];
  const fixtureMapRaw = fixtureData.local_sync_map || null;
  const liveItems = fixtureData.github_project_live_items || null;

  if (!checkGhpSourceRecords(sourceRecords)) return;

  let mapEntries = {};
  let mapShape = 'none';

  if (!fixtureMapRaw || !fixtureMapRaw.github_projects) {
    addIssue('WARN_GHP_LOCAL_MAP_MISSING', 'WARN',
      'Fixture has no local_sync_map.github_projects section.');
  } else {
    const normalized = normalizeGhpEntries(fixtureMapRaw);
    mapEntries = normalized.entries;
    mapShape = normalized.shape;
    addIssue('PASS_GHP_LOCAL_MAP_PRESENT', 'PASS',
      `Fixture local map present with github_projects section: ${normalized.count} entries (shape: ${mapShape}).`);
    checkGhpLocalMap(sourceRecords, mapEntries, mapShape);
  }

  if (!liveItems) {
    addIssue('WARN_GHP_LIVE_NOT_RUN', 'WARN',
      'Fixture has no github_project_live_items section — live comparison skipped.');
    return;
  }

  const sourceOsIds = sourceRecords.map(r => r.os_id);

  const liveOsIdMap = {};
  for (const item of liveItems) {
    const osId = item.os_id || (item.body && item.body.match(/<!--\s*ai-os-id:\s*([^\s>]+)\s*-->/)?.[1]);
    if (osId) {
      if (liveOsIdMap[osId]) {
        addIssue('FAIL_GHP_PROJECT_ITEM_MISSING', 'FAIL',
          `Fixture has duplicate Project item for os_id=${osId}.`);
      } else {
        liveOsIdMap[osId] = item;
      }
    }
  }

  for (const osId of sourceOsIds) {
    const mapEntry = mapEntries[osId];
    const liveItem = liveOsIdMap[osId];

    if (!mapEntry) {
      addIssue('FAIL_GHP_SOURCE_MISSING_LOCAL_MAP_ENTRY', 'FAIL',
        `Fixture: source record has no local map entry: os_id=${osId}`);
    } else if (!liveItem) {
      addIssue('FAIL_GHP_PROJECT_ITEM_MISSING', 'FAIL',
        `Fixture: local map entry for os_id=${osId} has no corresponding live item.`);
    } else {
      const srcRecord = sourceRecords.find(r => r.os_id === osId);
      if (srcRecord && liveItem.field_values) {
        if (liveItem.field_values.status !== srcRecord.status) {
          addIssue('FAIL_GHP_FIELD_VALUE_DRIFT', 'FAIL',
            `Fixture field value drift for os_id=${osId}: Status='${liveItem.field_values.status}' vs source='${srcRecord.status}'`);
        } else {
          addIssue('PASS_GHP_LIVE_ITEMS_ALIGNED', 'PASS',
            `Fixture: os_id=${osId} is aligned between source, local map, and live item.`);
        }
      } else {
        addIssue('PASS_GHP_LIVE_ITEMS_ALIGNED', 'PASS',
          `Fixture: os_id=${osId} maps to a live item.`);
      }
    }
  }
}

// ============================================================================
// LOCAL MAP SUMMARY (privacy-safe — no raw contents printed)
// ============================================================================

function buildLocalMapSummary() {
  const localMapPath = join(ROOT, LOCAL_MAP_FILE);
  const gitignored = isGitignored(LOCAL_MAP_FILE);

  if (!existsSync(localMapPath)) {
    return {
      local_map_present: false,
      local_map_gitignored: gitignored,
      google_calendar_entries_count: 0,
      github_projects_entries_count: 0,
      unresolved_os_ids: [],
      duplicate_os_ids: [],
      map_shape_detected: null,
    };
  }

  const raw = readJSON(LOCAL_MAP_FILE);
  if (!raw) {
    return {
      local_map_present: true,
      local_map_gitignored: gitignored,
      local_map_parse_error: true,
      google_calendar_entries_count: 0,
      github_projects_entries_count: 0,
      unresolved_os_ids: [],
      duplicate_os_ids: [],
      map_shape_detected: 'parse_error',
    };
  }

  // Normalize both sections — never expose raw values
  const gcal = normalizeGcalEntries(raw);
  const ghp = normalizeGhpEntries(raw);

  // Detect unresolved: entries missing a real external_id (placeholder or absent)
  const unresolvedOsIds = [];
  for (const [osId, entry] of Object.entries(gcal.entries)) {
    const extId = entry.event_id || entry.external_id;
    if (!extId || extId.includes('placeholder') || extId.includes('gcal_event_id_here')) {
      unresolvedOsIds.push(`gcal:${osId}`);
    }
  }
  for (const [osId, entry] of Object.entries(ghp.entries)) {
    const projItemId = entry.project_item_id || entry.external_id;
    if (!projItemId || projItemId.includes('placeholder')) {
      unresolvedOsIds.push(`ghp:${osId}`);
    }
  }

  // Detect cross-section os_id duplicates (should not happen in practice)
  const allOsIds = [...Object.keys(gcal.entries), ...Object.keys(ghp.entries)];
  const seen = new Set();
  const duplicateOsIds = [];
  for (const id of allOsIds) {
    if (seen.has(id)) duplicateOsIds.push(id);
    seen.add(id);
  }

  // Combine shape description
  const shapeDesc = gcal.shape !== 'none' ? gcal.shape : (ghp.shape !== 'none' ? ghp.shape : 'empty');

  return {
    local_map_present: true,
    local_map_gitignored: gitignored,
    google_calendar_entries_count: gcal.count,
    github_projects_entries_count: ghp.count,
    unresolved_os_ids: unresolvedOsIds,
    duplicate_os_ids: duplicateOsIds,
    map_shape_detected: shapeDesc,
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  let fixtureData = null;
  if (fixtureMode) {
    const fixturePath = flagFixture.startsWith('/') ? flagFixture : join(ROOT, flagFixture);
    if (!existsSync(fixturePath)) {
      console.error(`[ERROR] Fixture file not found: ${flagFixture}`);
      process.exit(1);
    }
    try {
      fixtureData = JSON.parse(readFileSync(fixturePath, 'utf8'));
    } catch (e) {
      console.error(`[ERROR] Failed to parse fixture: ${e.message}`);
      process.exit(1);
    }
  }

  // Always run cross-platform checks
  checkCrossPlatform();

  if (runGcal) await runGcalChecks(fixtureData);
  if (runGhp) await runGhpChecks(fixtureData);

  // Remove superseded null-severity issues
  const filteredIssues = issues.filter(i => i.severity !== null && i.severity !== undefined);

  // Build local map summary (privacy-safe — no raw content)
  const localMapSummary = buildLocalMapSummary();

  // Classify results
  const fails = filteredIssues.filter(i => i.severity === 'FAIL');
  const warns = filteredIssues.filter(i => i.severity === 'WARN');
  const passes = filteredIssues.filter(i => i.severity === 'PASS');

  // --strict: convert selected WARNs to FAIL
  let strictFails = [];
  if (flagStrict) {
    strictFails = warns.filter(w =>
      w.code === 'WARN_GCAL_LOCAL_MAP_MISSING' ||
      w.code === 'WARN_GHP_LOCAL_MAP_MISSING'
    );
  }

  const totalFails = fails.length + strictFails.length;
  const totalWarns = warns.length - strictFails.length;
  const totalPasses = passes.length;

  const overallStatus = totalFails > 0 ? 'FAIL' : totalWarns > 0 ? 'WARN' : 'PASS';

  const result = {
    schema_version: SCHEMA_VERSION,
    generated_at: GENERATED_AT,
    mode: fixtureMode ? 'fixture' : liveMode ? 'live-readonly' : 'local-only',
    flags: {
      local_only: flagLocalOnly,
      live_readonly: flagLiveReadonly,
      strict: flagStrict,
      fixture: flagFixture || null,
      fixture_test: flagFixtureTest,
      google_calendar: runGcal,
      github_projects: runGhp,
    },
    overall_status: overallStatus,
    summary: { pass: totalPasses, warn: totalWarns, fail: totalFails },
    local_map_summary: localMapSummary,
    issues: filteredIssues.map(i => ({
      code: i.code,
      severity: strictFails.includes(i) ? 'FAIL (strict)' : i.severity,
      message: i.message,
      ...(flagExplain && i.detail ? { detail: i.detail } : {}),
    })),
    no_mutation_occurred: true,
    no_apply_run: true,
    no_external_write: true,
  };

  if (flagPaths) result.paths_checked = paths;

  // --fixture-test mode: prove all expected issue codes are detected
  if (flagFixtureTest && fixtureData) {
    const expectedCodes = fixtureData._expected_issues || [];
    if (expectedCodes.length === 0) {
      console.log('[FIXTURE-TEST] No _expected_issues defined in fixture. Defaulting to standard exit behavior.');
    } else {
      const foundCodes = new Set(filteredIssues.map(i => i.code));
      const missing = expectedCodes.filter(c => !foundCodes.has(c));
      const found = expectedCodes.filter(c => foundCodes.has(c));
      console.log('\n=== Fixture Test Mode ===\n');
      console.log(`Expected issue codes: ${expectedCodes.length}`);
      console.log(`Found:   ${found.length} — ${found.join(', ')}`);
      if (missing.length > 0) {
        console.log(`Missing: ${missing.length} — ${missing.join(', ')}`);
        console.log('\nFIXTURE TEST FAIL — expected issue codes not detected. Validator logic may be broken.\n');
        process.exit(1);
      } else {
        console.log('\nFIXTURE TEST PASS — all expected issue codes detected. Fixture proves detection works.\n');
        // Print brief summary
        console.log(`Counts: ${totalPasses} pass, ${totalWarns} warn, ${totalFails} fail (expected FAILs are intentional fixture scenarios)`);
        console.log('\nMutation confirmation:');
        console.log('  No external mutation occurred.');
        console.log('  No apply was run.');
        console.log('  No local sync map was written.\n');
        process.exit(0);
      }
    }
  }

  if (flagJson || flagOutput) {
    const json = JSON.stringify(result, null, 2);
    if (flagOutput) {
      if (!flagOutput.startsWith('local-sync-reports/')) {
        console.error('[ERROR] --output path must be under local-sync-reports/');
        process.exit(1);
      }
      const outDir = join(ROOT, REPORT_DIR);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(join(ROOT, flagOutput), json, 'utf8');
      console.log(`[OUTPUT] Written to ${flagOutput}`);
    }
    if (flagJson) console.log(json);
  } else {
    console.log('\n=== External Sync Consistency Check — AI Project OS v1.7 Gate 5 ===\n');
    console.log(`Mode:    ${result.mode}${liveMode ? ' (live read-only)' : ''}`);
    console.log(`Status:  ${overallStatus}`);
    console.log(`Summary: ${totalPasses} pass, ${totalWarns} warn, ${totalFails} fail\n`);

    console.log('Local map:');
    console.log(`  present:          ${localMapSummary.local_map_present}`);
    console.log(`  gitignored:       ${localMapSummary.local_map_gitignored}`);
    console.log(`  gcal entries:     ${localMapSummary.google_calendar_entries_count}`);
    console.log(`  ghp entries:      ${localMapSummary.github_projects_entries_count}`);
    console.log(`  unresolved os_id: ${localMapSummary.unresolved_os_ids.length}`);
    console.log(`  duplicate os_id:  ${localMapSummary.duplicate_os_ids.length}`);
    console.log(`  map shape:        ${localMapSummary.map_shape_detected || 'absent'}\n`);

    if (fails.length > 0) {
      console.log('FAILURES:');
      fails.forEach(i => {
        console.log(`  [FAIL] ${i.code}`);
        console.log(`         ${i.message}`);
        if (flagExplain && i.detail) console.log(`         → ${i.detail}`);
      });
      console.log('');
    }

    if (warns.length > 0) {
      console.log('WARNINGS:');
      warns.forEach(i => {
        console.log(`  [WARN] ${i.code}`);
        console.log(`         ${i.message}`);
        if (flagExplain && i.detail) console.log(`         → ${i.detail}`);
      });
      console.log('');
    }

    if (passes.length > 0) {
      console.log(`PASS: ${passes.length} checks passed`);
      if (flagExplain) passes.forEach(i => console.log(`  [PASS] ${i.code}: ${i.message}`));
    }

    console.log('');
    console.log('Mutation confirmation:');
    console.log('  No external mutation occurred.');
    console.log('  No apply was run.');
    console.log('  No event was created/updated/deleted/cancelled.');
    console.log('  No GitHub Project or Issue mutation occurred.');
    console.log('  No local sync map was written.');
    if (flagPaths) {
      console.log('\nPaths checked:');
      paths.forEach(p => console.log(`  ${p.label}: ${p.path}`));
    }
    console.log('');
  }

  process.exit(totalFails > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('[ERROR] Unhandled error in external-sync-consistency-check.mjs:', e.message);
  process.exit(1);
});
