#!/usr/bin/env node
/**
 * Google Calendar Sync Dry-Run Script
 *
 * Modes:
 *   (default / --local-only)
 *     Gate 1: validate source records, generate planned event payloads, no API calls.
 *
 *   --fixture <path>
 *     Gate 2A: compare source records against fixture/mock calendar events.
 *     No API calls. No credentials. Proves comparison logic before live access.
 *     Writes dry-run artifact to local-sync-reports/ (gitignored).
 *
 *   --auth-status
 *     Report credential/token readiness (existence + gitignore checks only).
 *     No credential contents read. No API calls.
 *
 *   --live-readonly  (alias: --live)
 *     Gate 2B: compare against real Google Calendar (read-only).
 *     Requires: googleapis in scripts/node_modules/, credentials, and token locally.
 *     Default credential: docs/project-control/google-calendar-credentials.local.json
 *     Default token:      docs/project-control/google-calendar-token.local.json
 *     Writes dry-run artifact to local-sync-reports/ (gitignored).
 *     Gate 2B requires separate Coordinator authorization.
 *
 *   --output <path>
 *     Write artifact to this path (must be under local-sync-reports/).
 *     Default: local-sync-reports/google-calendar-dry-run-<timestamp>.json
 *
 *   --help, -h
 *     Show usage information.
 *
 *   --credential-path <path>
 *     Override credential file path (must be gitignored).
 *
 *   --token-path <path>
 *     Override token file path (must be gitignored).
 *
 *   --allow-legacy-root-credentials
 *     Allow fallback to root google-calendar-credentials.json / token.json
 *     when canonical paths are absent. Warns LEGACY_ROOT_CREDENTIAL_PATH_USED.
 *
 * googleapis is NOT imported at the top level.
 * Dynamic import is used only inside live mode, so --local-only and --fixture
 * never fail due to missing googleapis.
 *
 * Canonical credential paths (defaults):
 *   docs/project-control/google-calendar-credentials.local.json
 *   docs/project-control/google-calendar-token.local.json
 *
 * OAuth bootstrap (separate script — requires explicit Coordinator authorization):
 *   node scripts/google-calendar-auth-bootstrap.mjs --auth-status
 *   node scripts/google-calendar-auth-bootstrap.mjs --init-oauth
 *
 * Usage:
 *   node scripts/google-calendar-sync-dry-run.mjs
 *   node scripts/google-calendar-sync-dry-run.mjs --local-only
 *   node scripts/google-calendar-sync-dry-run.mjs --fixture docs/project-control/google-calendar-live-events.fixture.json
 *   node scripts/google-calendar-sync-dry-run.mjs --fixture <path> --output local-sync-reports/result.json
 *   node scripts/google-calendar-sync-dry-run.mjs --auth-status
 *   node scripts/google-calendar-sync-dry-run.mjs --live-readonly
 *   node scripts/google-calendar-sync-dry-run.mjs --live-readonly --output local-sync-reports/gate-2d.json
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);
const SOURCE_FILE = 'docs/project-control/google-calendar-source-records.json';
const CANONICAL_CREDENTIALS_FILE = 'docs/project-control/google-calendar-credentials.local.json';
const CANONICAL_TOKEN_FILE = 'docs/project-control/google-calendar-token.local.json';
const LEGACY_CREDENTIALS_FILE = 'google-calendar-credentials.json';
const LEGACY_TOKEN_FILE = 'token.json';
const REPORT_DIR = 'local-sync-reports';
const LOCAL_MAP_FILE = 'docs/project-control/external-sync-map.local.json';

const args = process.argv.slice(2);
const isHelp = args.includes('--help') || args.includes('-h');
const isAuthStatus = args.includes('--auth-status');
const isLive = args.includes('--live') || args.includes('--live-readonly');
const isFixture = args.includes('--fixture');
const isLocalOnly = !isHelp && !isAuthStatus && !isLive && !isFixture;
const allowLegacyRoot = args.includes('--allow-legacy-root-credentials');

const syncMapFixtureIdx = args.indexOf('--sync-map-fixture');
const syncMapFixtureArg = syncMapFixtureIdx >= 0 ? args[syncMapFixtureIdx + 1] : null;

const fixtureIdx = args.indexOf('--fixture');
const fixtureArg = fixtureIdx >= 0 ? args[fixtureIdx + 1] : null;
const outputIdx = args.indexOf('--output');
const outputArg = outputIdx >= 0 ? args[outputIdx + 1] : null;
const credPathIdx = args.indexOf('--credential-path');
const credPathArg = credPathIdx >= 0 ? args[credPathIdx + 1] : null;
const tokenPathIdx = args.indexOf('--token-path');
const tokenPathArg = tokenPathIdx >= 0 ? args[tokenPathIdx + 1] : null;

const VALID_ROLES = ['ritual', 'phase-gate', 'milestone', 'package-review', 'package-closeout', 'budget-review', 'roadmap-reset'];
const VALID_STATUS = ['active', 'paused', 'archived'];

// Classification values — all 11 supported.
const C = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  NO_OP: 'NO_OP',
  ADOPTION_REQUIRED: 'ADOPTION_REQUIRED',
  POSSIBLE_DUPLICATE: 'POSSIBLE_DUPLICATE',
  DUPLICATE_DETECTED: 'DUPLICATE_DETECTED',
  MISSING_LOCAL_MAPPING: 'MISSING_LOCAL_MAPPING',
  MAPPED_EVENT_MISSING_REMOTELY: 'MAPPED_EVENT_MISSING_REMOTELY',
  REMOTE_DRIFT: 'REMOTE_DRIFT',
  NEEDS_MANUAL_REVIEW: 'NEEDS_MANUAL_REVIEW',
  DELETE_CANCEL_CANDIDATE: 'DELETE_CANCEL_CANDIDATE',
};

// Gate 3 apply blockers — these classifications prevent apply from running.
// POSSIBLE_DUPLICATE blocks apply because a fuzzy match may represent an existing event;
// creating without resolution risks a duplicate calendar event.
const APPLY_BLOCKERS = new Set([
  C.DUPLICATE_DETECTED,
  C.ADOPTION_REQUIRED,
  C.POSSIBLE_DUPLICATE,
  C.MAPPED_EVENT_MISSING_REMOTELY,
  C.REMOTE_DRIFT,
  C.NEEDS_MANUAL_REVIEW,
  C.DELETE_CANCEL_CANDIDATE,
]);

// ─── Source record loading and inline validation ───────────────────────────

function loadSourceRecords() {
  const sourcePath = join(ROOT, SOURCE_FILE);
  if (!existsSync(sourcePath)) {
    console.error(`FATAL: Source file not found: ${SOURCE_FILE}`);
    console.error('Run: node scripts/google-calendar-source-validate.mjs');
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(sourcePath, 'utf8'));
  } catch (e) {
    console.error(`FATAL: Source file is not valid JSON: ${e.message}`);
    process.exit(1);
  }
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
    start: { dateTime: r.start, timeZone: r.timezone },
    end: { dateTime: r.end, timeZone: r.timezone },
    extendedProperties: { private: { ai_os_id: r.os_id } },
  };
  if (r.recurrence) {
    payload.recurrence = [`RRULE:${r.recurrence}`];
  }
  return payload;
}

// ─── Comparison utilities (pure — no I/O) ─────────────────────────────────

/**
 * Extract AI_OS_ID value from a Google Calendar event description.
 * Returns the os_id string or null.
 */
function extractDescMarker(description) {
  if (!description || typeof description !== 'string') return null;
  const m = description.match(/AI_OS_ID:\s*([^\s\n]+)/);
  return m ? m[1].trim() : null;
}

/**
 * Strip timezone offset from a dateTime string so local times can be compared.
 * "2026-05-17T19:00:00-04:00" → "2026-05-17T19:00:00"
 */
function normalizeDateTime(dt) {
  if (!dt || typeof dt !== 'string') return '';
  return dt.replace(/[+-]\d{2}:\d{2}$/, '').replace(/Z$/, '');
}

/**
 * Normalize recurrence to a sorted array of bare RRULE strings.
 * ["RRULE:FREQ=WEEKLY;BYDAY=SU"] → ["FREQ=WEEKLY;BYDAY=SU"]
 */
function normalizeRecurrence(recurrence) {
  if (!recurrence) return [];
  if (Array.isArray(recurrence)) {
    return recurrence.map(r => r.replace(/^RRULE:/i, '').trim()).sort();
  }
  if (typeof recurrence === 'string' && recurrence.trim()) {
    return [recurrence.replace(/^RRULE:/i, '').trim()];
  }
  return [];
}

function dedupByEventId(events) {
  const seen = new Set();
  return events.filter(ev => {
    if (!ev.id || seen.has(ev.id)) return false;
    seen.add(ev.id);
    return true;
  });
}

/**
 * Jaccard similarity between two event title strings (word-level, case-insensitive).
 * Returns 0.0–1.0.
 */
function titleSimilarity(a, b) {
  if (!a || !b) return 0;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const aN = norm(a);
  const bN = norm(b);
  if (aN === bN) return 1.0;
  const wordsA = new Set(aN.split(/\s+/));
  const wordsB = new Set(bN.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function datePart(dt) {
  return dt ? String(dt).slice(0, 10) : '';
}

/**
 * Compare a source record's intended payload against a live Google Calendar event.
 * Returns an array of human-readable diff strings.
 * Empty array = no difference = NO_OP candidate.
 */
function comparePayload(record, liveEvent) {
  const diffs = [];

  // Title
  if (liveEvent.summary !== record.title) {
    diffs.push(`title: source="${record.title}" live="${liveEvent.summary}"`);
  }

  // Start dateTime (normalize to strip tz offset before comparing)
  const liveStart = normalizeDateTime(liveEvent.start?.dateTime || '');
  if (liveStart && liveStart !== record.start) {
    diffs.push(`start: source="${record.start}" live="${liveStart}"`);
  }

  // End dateTime
  const liveEnd = normalizeDateTime(liveEvent.end?.dateTime || '');
  if (liveEnd && liveEnd !== record.end) {
    diffs.push(`end: source="${record.end}" live="${liveEnd}"`);
  }

  // Timezone
  if (liveEvent.start?.timeZone && liveEvent.start.timeZone !== record.timezone) {
    diffs.push(`timezone: source="${record.timezone}" live="${liveEvent.start.timeZone}"`);
  }

  // Recurrence
  const srcRrules = normalizeRecurrence(record.recurrence);
  const liveRrules = normalizeRecurrence(liveEvent.recurrence);
  if (JSON.stringify(srcRrules) !== JSON.stringify(liveRrules)) {
    diffs.push(`recurrence: source=${JSON.stringify(srcRrules)} live=${JSON.stringify(liveRrules)}`);
  }

  // AI_OS_ID description marker
  const liveHasMarker = !!(liveEvent.description && liveEvent.description.includes(`AI_OS_ID: ${record.os_id}`));
  if (!liveHasMarker) {
    diffs.push(`description: AI_OS_ID: ${record.os_id} marker missing in live event`);
  }

  // extendedProperties.private.ai_os_id
  const liveExtOsId = liveEvent.extendedProperties?.private?.ai_os_id;
  if (liveExtOsId !== record.os_id) {
    diffs.push(`extendedProperties.private.ai_os_id: source="${record.os_id}" live="${liveExtOsId || '(missing)'}"`);
  }

  return diffs;
}

function summarizeEvent(ev) {
  if (!ev) return null;
  return {
    id: ev.id || '(no id)',
    summary: ev.summary || '',
    start: ev.start?.dateTime || ev.start?.date || '',
    end: ev.end?.dateTime || ev.end?.date || '',
    has_desc_marker: !!extractDescMarker(ev.description),
    desc_marker_value: extractDescMarker(ev.description) || null,
    has_ext_prop: !!(ev.extendedProperties?.private?.ai_os_id),
    ext_prop_value: ev.extendedProperties?.private?.ai_os_id || null,
  };
}

// ─── Classification engine (pure — no I/O) ────────────────────────────────

/**
 * Classify a single source record against indexed live/fixture events.
 *
 * @param {Object} record - source record
 * @param {Object} ctx
 *   byDescMarker  - { [os_id]: [liveEvent, ...] } indexed by AI_OS_ID desc marker
 *   byExtProp     - { [os_id]: [liveEvent, ...] } indexed by extendedProperties.private.ai_os_id
 *   fixtureLocalMap - simulated external-sync-map entries { [os_id]: { external_id, ... } }
 *   liveEvents    - full array of live/fixture events (for title/date fallback)
 * @returns action object
 */
function classifySourceRecord(record, { byDescMarker, byExtProp, fixtureLocalMap, liveEvents }) {
  const base = {
    os_id: record.os_id,
    source_record: {
      os_id: record.os_id,
      title: record.title,
      start: record.start,
      end: record.end,
      timezone: record.timezone,
      recurrence: record.recurrence || '',
      status: record.status,
      calendar_role: record.calendar_role,
    },
  };

  // ── Gather all live events matching by AI_OS_ID markers ──
  const byDesc = byDescMarker[record.os_id] || [];
  const byExt = byExtProp[record.os_id] || [];
  const managedMatches = dedupByEventId([...byDesc, ...byExt]);

  // ── DUPLICATE_DETECTED: 2+ live events carry the same AI_OS_ID ──
  if (managedMatches.length >= 2) {
    return {
      ...base,
      classification: C.DUPLICATE_DETECTED,
      confidence: 'high',
      apply_blocker: true,
      reason: `${managedMatches.length} live events match AI_OS_ID "${record.os_id}". Duplicates must be resolved before Gate 3 apply.`,
      matched_event: null,
      duplicate_candidates: managedMatches.map(summarizeEvent),
      adoption_candidate: null,
      proposed_event_payload: null,
      identity_markers: null,
      required_resolution: 'Coordinator must remove or merge duplicate events in Google Calendar UI, then re-run dry-run.',
    };
  }

  // ── Single managed match: NO_OP, UPDATE, or REMOTE_DRIFT ──
  if (managedMatches.length === 1) {
    const match = managedMatches[0];
    const diffs = comparePayload(record, match);
    const hasTimeDiff = diffs.some(d => d.startsWith('start:') || d.startsWith('end:') || d.startsWith('timezone:'));
    const inLocalMap = !!(fixtureLocalMap[record.os_id]);

    let classification, reason;
    if (diffs.length === 0) {
      classification = C.NO_OP;
      reason = 'Live event matches source record exactly. No action needed.';
    } else if (hasTimeDiff) {
      // Time/date change on a managed event indicates external drift.
      classification = C.REMOTE_DRIFT;
      reason = `Managed event (AI_OS_ID confirmed) has time or date differences suggesting external edits: ${diffs.filter(d => d.startsWith('start:') || d.startsWith('end:') || d.startsWith('timezone:')).join('; ')}.`;
    } else {
      classification = C.UPDATE;
      reason = `Managed event (AI_OS_ID confirmed) has field differences from source: ${diffs.join('; ')}.`;
    }

    const action = {
      ...base,
      classification,
      confidence: 'high',
      apply_blocker: APPLY_BLOCKERS.has(classification),
      reason,
      matched_event: summarizeEvent(match),
      duplicate_candidates: null,
      adoption_candidate: null,
      identity_markers: {
        description_marker: {
          planned: `AI_OS_ID: ${record.os_id}`,
          present_in_live: !!(match.description && match.description.includes(`AI_OS_ID: ${record.os_id}`)),
        },
        ext_prop: {
          planned: record.os_id,
          present_in_live: !!(match.extendedProperties?.private?.ai_os_id),
        },
      },
      missing_local_mapping: !inLocalMap,
      required_resolution: APPLY_BLOCKERS.has(classification)
        ? 'Coordinator must review and resolve conflict before Gate 3 apply.'
        : null,
    };

    if (diffs.length > 0) {
      action.diffs = diffs;
      action.proposed_event_payload = buildEventPayload(record);
    }

    return action;
  }

  // ── No managed match ──

  // MAPPED_EVENT_MISSING_REMOTELY: local sync map has an entry but the event is gone.
  if (fixtureLocalMap[record.os_id]) {
    const mappedId = fixtureLocalMap[record.os_id].external_id;
    const foundInLive = liveEvents.some(ev => ev.id === mappedId);
    if (!foundInLive) {
      return {
        ...base,
        classification: C.MAPPED_EVENT_MISSING_REMOTELY,
        confidence: 'high',
        apply_blocker: true,
        reason: `Local sync map records event ID "${mappedId}" for this os_id, but no event with that ID exists in the calendar. The event may have been deleted externally.`,
        matched_event: null,
        duplicate_candidates: null,
        adoption_candidate: null,
        proposed_event_payload: buildEventPayload(record),
        identity_markers: null,
        required_resolution: 'Coordinator must decide: remove map entry and re-run (event will be re-created in Gate 3), or investigate the deletion.',
      };
    }
  }

  // ── Title/date fallback for adoption matching ──
  const sourceDate = datePart(record.start);

  // Exact title + same start date — unmarked events only
  const exactTitleMatches = liveEvents.filter(ev => {
    const evDate = datePart(ev.start?.dateTime || ev.start?.date || '');
    return (
      ev.summary === record.title &&
      evDate === sourceDate &&
      !extractDescMarker(ev.description) &&
      !ev.extendedProperties?.private?.ai_os_id
    );
  });

  // Fuzzy title match — unmarked, not already exact-matched
  const fuzzyMatches = liveEvents.filter(ev => {
    if (exactTitleMatches.includes(ev)) return false;
    if (extractDescMarker(ev.description) || ev.extendedProperties?.private?.ai_os_id) return false;
    return ev.summary !== record.title && titleSimilarity(ev.summary, record.title) > 0.5;
  });

  if (exactTitleMatches.length >= 2) {
    return {
      ...base,
      classification: C.NEEDS_MANUAL_REVIEW,
      confidence: 'medium',
      apply_blocker: true,
      reason: `Multiple live events (${exactTitleMatches.length}) match by exact title and start date, none with AI_OS_ID marker. Cannot determine safe adoption target automatically.`,
      matched_event: null,
      duplicate_candidates: exactTitleMatches.map(summarizeEvent),
      adoption_candidate: null,
      proposed_event_payload: buildEventPayload(record),
      identity_markers: null,
      required_resolution: 'Coordinator must identify the correct event and add AI_OS_ID marker manually, then re-run dry-run.',
    };
  }

  if (exactTitleMatches.length === 1) {
    return {
      ...base,
      classification: C.ADOPTION_REQUIRED,
      confidence: 'medium',
      apply_blocker: true,
      reason: `Existing live event matches by exact title and start date but has no AI_OS_ID marker. Likely a 2026-05-17 imported event. Must be adopted before Gate 3 can safely create a new event.`,
      matched_event: null,
      adoption_candidate: summarizeEvent(exactTitleMatches[0]),
      duplicate_candidates: null,
      proposed_event_payload: buildEventPayload(record),
      identity_markers: {
        description_marker: { planned: `AI_OS_ID: ${record.os_id}`, present_in_live: false },
        ext_prop: { planned: record.os_id, present_in_live: false },
      },
      required_resolution: `Add "AI_OS_ID: ${record.os_id}" to the end of the existing event's description in Google Calendar UI, then re-run dry-run. See adoption guide: docs/project-control/google-calendar-sync-policy.md`,
    };
  }

  if (fuzzyMatches.length >= 1) {
    const best = fuzzyMatches[0];
    const sim = Math.round(titleSimilarity(best.summary, record.title) * 100);
    return {
      ...base,
      classification: C.POSSIBLE_DUPLICATE,
      confidence: 'low',
      apply_blocker: true,
      reason: `Weak title match found (${sim}% similarity: "${best.summary}") but no AI_OS_ID marker. May be an existing event under a different name. Gate 3 apply is blocked until resolved to prevent creating a duplicate calendar event.`,
      matched_event: null,
      adoption_candidate: summarizeEvent(best),
      duplicate_candidates: fuzzyMatches.length > 1 ? fuzzyMatches.slice(1).map(summarizeEvent) : null,
      proposed_event_payload: buildEventPayload(record),
      identity_markers: {
        description_marker: { planned: `AI_OS_ID: ${record.os_id}`, present_in_live: false },
        ext_prop: { planned: record.os_id, present_in_live: false },
      },
      required_resolution: `Coordinator must choose one of: (1) confirm the fuzzy match is unrelated — remove it from the live calendar or rename it so it no longer matches, then re-run dry-run; (2) adopt/match it — add "AI_OS_ID: ${record.os_id}" to the existing event description and re-run dry-run (event will re-classify as NO_OP or UPDATE); (3) explicitly approve creating a new event despite possible duplicate risk (Coordinator confirmation required before Gate 3).`,
    };
  }

  // No match at all.
  // Archived/paused source records with no live event: no action needed (report only).
  if (record.status === 'archived' || record.status === 'paused') {
    return {
      ...base,
      classification: C.DELETE_CANCEL_CANDIDATE,
      confidence: 'medium',
      apply_blocker: true,
      reason: `Source record status is "${record.status}" and no live managed event found. If an event was previously created, it may need removal. Report only.`,
      matched_event: null,
      duplicate_candidates: null,
      adoption_candidate: null,
      proposed_event_payload: null,
      identity_markers: null,
      required_resolution: 'Coordinator must confirm whether an event exists and approve per-item delete if needed.',
    };
  }

  return {
    ...base,
    classification: C.CREATE,
    confidence: 'high',
    apply_blocker: false,
    reason: 'No matching live event found. Gate 3 apply will create this event.',
    matched_event: null,
    duplicate_candidates: null,
    adoption_candidate: null,
    proposed_event_payload: buildEventPayload(record),
    identity_markers: {
      description_marker: { planned: `AI_OS_ID: ${record.os_id}`, present_in_live: false },
      ext_prop: { planned: record.os_id, present_in_live: false },
    },
    required_resolution: null,
  };
}

/**
 * Compare all source records against a list of live/fixture events.
 * Pure function — no I/O.
 *
 * @param {Array} sourceRecords
 * @param {Array} liveEvents - Google Calendar event objects (real or fixture)
 * @param {Object} options
 *   fixtureLocalMap - simulated local sync map (fixture only)
 *   calendarId      - string, if known
 * @returns {Array} actions
 */
function compareSourceToEvents(sourceRecords, liveEvents, options = {}) {
  const { fixtureLocalMap = {}, calendarId = 'unknown' } = options;

  // Index live events by AI_OS_ID markers
  const byDescMarker = {};
  const byExtProp = {};
  for (const ev of liveEvents) {
    const descOsId = extractDescMarker(ev.description);
    if (descOsId) {
      (byDescMarker[descOsId] = byDescMarker[descOsId] || []).push(ev);
    }
    const extOsId = ev.extendedProperties?.private?.ai_os_id;
    if (extOsId) {
      (byExtProp[extOsId] = byExtProp[extOsId] || []).push(ev);
    }
  }

  const sourceOsIds = new Set(sourceRecords.map(r => r.os_id));
  const consumedEventIds = new Set();

  // Classify each source record
  const actions = [];
  for (const record of sourceRecords) {
    const action = classifySourceRecord(record, { byDescMarker, byExtProp, fixtureLocalMap, liveEvents });

    if (action.matched_event) consumedEventIds.add(action.matched_event.id);
    if (action.duplicate_candidates) action.duplicate_candidates.forEach(c => consumedEventIds.add(c.id));
    if (action.adoption_candidate) consumedEventIds.add(action.adoption_candidate.id);

    actions.push(action);
  }

  // Live managed events not matching any source record → DELETE_CANCEL_CANDIDATE
  const allLiveManagedOsIds = new Set([...Object.keys(byDescMarker), ...Object.keys(byExtProp)]);
  for (const liveOsId of allLiveManagedOsIds) {
    if (!sourceOsIds.has(liveOsId)) {
      const candidates = dedupByEventId([...(byDescMarker[liveOsId] || []), ...(byExtProp[liveOsId] || [])]);
      for (const ev of candidates) {
        if (!consumedEventIds.has(ev.id)) {
          consumedEventIds.add(ev.id);
          actions.push({
            os_id: liveOsId,
            classification: C.DELETE_CANCEL_CANDIDATE,
            confidence: 'high',
            apply_blocker: true,
            reason: `Live managed event with AI_OS_ID "${liveOsId}" has no corresponding source record. Source was removed or this event was created outside the current sync scope.`,
            source_record: null,
            matched_event: summarizeEvent(ev),
            duplicate_candidates: null,
            adoption_candidate: null,
            proposed_event_payload: null,
            identity_markers: null,
            required_resolution: 'Coordinator must explicitly approve per-item deletion via --delete --os-id <id> in Gate 3. Report only for now.',
          });
        }
      }
    }
  }

  return actions;
}

// ─── Artifact builder ──────────────────────────────────────────────────────

function buildArtifact(actions, options = {}) {
  const { mode, sourceCount, liveCount, calendarId, localMapDiagnostics } = options;

  const summary = {};
  for (const cls of Object.values(C)) summary[cls] = 0;
  for (const a of actions) summary[a.classification] = (summary[a.classification] || 0) + 1;

  const gate3Blockers = actions
    .filter(a => a.apply_blocker)
    .map(a => ({ os_id: a.os_id, classification: a.classification, reason: a.reason }));

  const deleteCancelCandidates = actions
    .filter(a => a.classification === C.DELETE_CANCEL_CANDIDATE)
    .map(a => ({ os_id: a.os_id, matched_event: a.matched_event, required_resolution: a.required_resolution }));

  const warnings = actions
    .filter(a => a.missing_local_mapping)
    .map(a => ({ os_id: a.os_id, classification: a.classification, note: 'MISSING_LOCAL_MAPPING advisory — no local sync map entry for this os_id' }));

  return {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    mode,
    source_records_count: sourceCount,
    ...(mode === 'live'
      ? { live_events_count: liveCount }
      : mode === 'fixture'
        ? { fixture_events_count: liveCount }
        : {}),
    calendar_id: calendarId || null,
    summary,
    blockers_count: gate3Blockers.length,
    warnings_count: warnings.length,
    gate3_apply_allowed: gate3Blockers.length === 0,
    gate3_blockers: gate3Blockers,
    delete_cancel_candidates: deleteCancelCandidates,
    warnings,
    results: actions,
    notes: [
      'Artifact is local-only and gitignored. Do not commit.',
      'DELETE_CANCEL_CANDIDATE items require separate per-item Coordinator approval before Gate 3.',
      'POSSIBLE_DUPLICATE is advisory — does not block Gate 3 apply.',
      'ADOPTION_REQUIRED items must be resolved (AI_OS_ID added to existing event) before Gate 3.',
      mode === 'fixture'
        ? 'Generated from fixture/mock data. Re-run with --live-readonly for real Google Calendar comparison (Gate 2B).'
        : '',
    ].filter(Boolean),
    ...(localMapDiagnostics ? { local_map_diagnostics: localMapDiagnostics } : {}),
  };
}

// ─── Output path guard ─────────────────────────────────────────────────────

function isPathGitignored(relPath) {
  try {
    const result = execSync(`git check-ignore -v "${relPath.replace(/\\/g, '/')}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function resolveOutputPath(outputArg, mode) {
  if (outputArg) return outputArg.replace(/\\/g, '/');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${REPORT_DIR}/google-calendar-dry-run-${mode}-${ts}.json`;
}

function writeArtifact(artifact, relPath) {
  if (!isPathGitignored(relPath)) {
    console.log(`WARN: Output path "${relPath}" is not gitignored. Artifact not written.`);
    console.log('Artifact must be under local-sync-reports/ (which is gitignored).');
    return null;
  }
  const fullPath = join(ROOT, relPath);
  const dirPath = join(ROOT, REPORT_DIR);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
  writeFileSync(fullPath, JSON.stringify(artifact, null, 2), 'utf8');
  return relPath;
}

// ─── Credential/token path resolution ─────────────────────────────────────

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

// ─── Local sync map loading (read-only) ───────────────────────────────────

/**
 * Load and normalize the local Google Calendar sync map (read-only).
 * Supports both the apply-script shape (google_calendar.events[os_id])
 * and the example shape (google_calendar[os_id] directly).
 * Never writes, never stages, never commits.
 */
function loadLocalSyncMap(filePath) {
  const fullPath = join(ROOT, filePath);
  const result = {
    local_map_path: filePath,
    local_map_present: existsSync(fullPath),
    local_map_read: false,
    entries: {},
    local_map_entries_count: 0,
    map_shape_detected: 'none',
    warnings: [],
    errors: [],
  };

  if (!result.local_map_present) {
    result.warnings.push('local_map_not_found — MISSING_LOCAL_MAPPING advisory will apply to all source records with live matches');
    return result;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(fullPath, 'utf8'));
    result.local_map_read = true;
  } catch (e) {
    result.errors.push(`failed to parse sync map: ${e.message}`);
    return result;
  }

  const gcal = raw.google_calendar;
  if (!gcal || typeof gcal !== 'object') {
    result.warnings.push('google_calendar section missing or invalid in sync map');
    return result;
  }

  if (gcal.events && typeof gcal.events === 'object') {
    // Apply-script shape: google_calendar.events[os_id]
    result.map_shape_detected = 'apply';
    for (const [osId, entry] of Object.entries(gcal.events)) {
      if (typeof entry === 'object' && entry !== null) {
        result.entries[osId] = entry;
      }
    }
  } else {
    // Example shape: google_calendar[os_id] directly (skip metadata keys)
    result.map_shape_detected = 'example';
    for (const [key, entry] of Object.entries(gcal)) {
      if (key.startsWith('_')) continue;
      if (typeof entry === 'object' && entry !== null && entry.external_id) {
        result.entries[key] = entry;
      }
    }
  }

  result.local_map_entries_count = Object.keys(result.entries).length;
  return result;
}

/**
 * Build safe local sync map diagnostics for the artifact.
 * Never includes raw event IDs or credential paths.
 */
function buildLocalMapDiagnostics(mapResult, sourceOsIds) {
  const resolved = sourceOsIds.filter(id => !!mapResult.entries[id]);
  const unresolved = sourceOsIds.filter(id => !mapResult.entries[id]);
  return {
    local_map_path: mapResult.local_map_path,
    local_map_present: mapResult.local_map_present,
    local_map_read: mapResult.local_map_read,
    local_map_entries_count: mapResult.local_map_entries_count,
    source_records_with_local_map_count: resolved.length,
    source_records_missing_local_map_count: unresolved.length,
    unresolved_os_ids: unresolved,
    map_shape_detected: mapResult.map_shape_detected,
    warnings: mapResult.warnings,
    errors: mapResult.errors,
  };
}

// ─── Help mode ─────────────────────────────────────────────────────────────

function runHelp() {
  console.log(`
Google Calendar Sync Dry-Run — AI Project OS v1.6
Usage: node scripts/google-calendar-sync-dry-run.mjs [mode] [options]

MODES (default: --local-only)
  (no flag)         Local-only validation — no API calls, no credentials needed
  --local-only      Same as default
  --fixture <path>  Fixture/mock comparison — no API calls, no credentials needed
  --sync-map-fixture <path>
                    External sync map fixture (JSON, example shape) — used with --fixture
                    to test sync-map read path without the embedded fixtureLocalMap.
                    Must be a committed file with fake placeholder IDs only.
  --auth-status     Credential/token readiness check (existence + gitignore only)
  --live-readonly   Live Google Calendar comparison, read-only (Gate 2B)
                    Requires: credentials + token + Coordinator authorization
  --help, -h        Show this help

CANONICAL CREDENTIAL PATHS (defaults)
  Credential: ${CANONICAL_CREDENTIALS_FILE}
  Token:      ${CANONICAL_TOKEN_FILE}

CREDENTIAL/TOKEN OPTIONS
  --credential-path <path>         Override credential file (must be gitignored)
  --token-path <path>              Override token file (must be gitignored)
  --allow-legacy-root-credentials  Fallback to root credential/token paths if canonical missing
                                   (warns LEGACY_ROOT_CREDENTIAL_PATH_USED)

OUTPUT OPTIONS
  --output <path>   Artifact output path (must be under local-sync-reports/)
                    Default: local-sync-reports/google-calendar-dry-run-<timestamp>.json

OAUTH BOOTSTRAP (requires explicit Coordinator authorization)
  Check readiness:  node scripts/google-calendar-auth-bootstrap.mjs --auth-status
  Generate token:   node scripts/google-calendar-auth-bootstrap.mjs --init-oauth
                    (writes ${CANONICAL_TOKEN_FILE})

SAFETY
  --live-readonly never creates, updates, deletes, or cancels calendar events.
  --apply is not part of this script. Gate 3 uses google-calendar-sync-apply.mjs.
  Artifacts are written only to local-sync-reports/ (gitignored).
  Credentials and tokens are never printed.
`);
  process.exit(0);
}

// ─── Auth status mode ──────────────────────────────────────────────────────

function runAuthStatus() {
  console.log(`\nGOOGLE CALENDAR AUTH STATUS — ${today}`);
  console.log('Source: scripts/google-calendar-sync-dry-run.mjs --auth-status');
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

  if (!credIgnored || !tokenIgnored) {
    console.log('FATAL: A credential or token path is not gitignored. Fix before proceeding.');
    process.exit(1);
  }

  if (!credExists) {
    console.log('STATUS: CREDENTIAL_MISSING');
    console.log(`  Place credentials at: ${credFile}`);
    console.log('  See: docs/project-control/google-calendar-credentials.example.md');
    process.exit(1);
  }

  if (!tokenExists) {
    console.log('STATUS: OAUTH_BOOTSTRAP_REQUIRED');
    console.log('  Credential file found. Token not yet generated.');
    console.log('  Run OAuth bootstrap (requires explicit Coordinator authorization):');
    console.log('    node scripts/google-calendar-auth-bootstrap.mjs --init-oauth');
    process.exit(1);
  }

  console.log('STATUS: READY');
  console.log('  Credential and token files are present and gitignored.');
  console.log('  When authorized, run:');
  console.log('    node scripts/google-calendar-sync-dry-run.mjs --live-readonly');
  console.log('');
  console.log('---');
  console.log('No credentials or tokens were read. No API calls were made.');
  process.exit(0);
}

// ─── Shared result printer ──────────────────────────────────────────────────

function printComparisonResults(actions) {
  console.log('CLASSIFICATION RESULTS');
  for (const a of actions) {
    const blockerTag = a.apply_blocker ? ' [BLOCKS GATE 3]' : '';
    console.log(`  [${a.classification}]${blockerTag} ${a.os_id}`);
    console.log(`    confidence: ${a.confidence}`);
    console.log(`    reason: ${a.reason}`);
    if (a.matched_event) {
      console.log(`    matched event: id=${a.matched_event.id} "${a.matched_event.summary}"`);
    }
    if (a.adoption_candidate) {
      console.log(`    adoption candidate: id=${a.adoption_candidate.id} "${a.adoption_candidate.summary}"`);
    }
    if (a.duplicate_candidates) {
      console.log(`    duplicate candidates: ${a.duplicate_candidates.map(c => c.id).join(', ')}`);
    }
    if (a.diffs) {
      console.log(`    diffs: ${a.diffs.join(' | ')}`);
    }
    if (a.missing_local_mapping) {
      console.log(`    advisory: MISSING_LOCAL_MAPPING — no local sync map entry for this os_id`);
    }
    if (a.required_resolution) {
      console.log(`    resolution: ${a.required_resolution}`);
    }
    console.log('');
  }
}

function printComparisonSummary(actions) {
  const counts = {};
  for (const a of actions) counts[a.classification] = (counts[a.classification] || 0) + 1;

  console.log('SUMMARY');
  for (const [cls, count] of Object.entries(counts)) {
    console.log(`  ${cls}: ${count}`);
  }
  console.log('');

  const blockers = actions.filter(a => a.apply_blocker);
  const gate3Allowed = blockers.length === 0;
  console.log(`GATE 3 APPLY: ${gate3Allowed ? 'ALLOWED — no blockers' : `BLOCKED — ${blockers.length} blocker(s)`}`);
  if (!gate3Allowed) {
    for (const b of blockers) {
      console.log(`  - [${b.classification}] ${b.os_id}`);
    }
  }
  console.log('');

  return gate3Allowed;
}

// ─── Local-only mode (Gate 1 verification — unchanged behavior) ────────────

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
      results.push({ os_id: r.os_id, classification: 'READY_FOR_LIVE_COMPARE', payload: buildEventPayload(r) });
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
  console.log('  Credential status: LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING');
  console.log('    (expected for local mode — no credentials needed)');
  console.log('  Gate 2A fixture validation: node scripts/google-calendar-sync-dry-run.mjs --fixture docs/project-control/google-calendar-live-events.fixture.json');
  console.log('  Gate 2B live comparison: node scripts/google-calendar-sync-dry-run.mjs --live-readonly');
  console.log('    (requires googleapis in scripts/ and Google Calendar API credentials)');
  console.log('');

  if (invalidCount > 0) {
    console.log(`VERDICT: LOCAL VALIDATION FAILED — ${invalidCount} source record(s) have errors.`);
    console.log('Fix all errors before proceeding to Gate 2.');
  } else {
    console.log('VERDICT: LOCAL VALIDATION PASSED');
    console.log(`  All ${readyCount} source records are valid and ready for Gate 2 comparison.`);
  }

  console.log('');
  console.log('---');
  console.log('No external sync was performed. No files were modified by this script.');
  process.exit(invalidCount > 0 ? 1 : 0);
}

// ─── Fixture mode (Gate 2A — no credentials, no googleapis) ───────────────

function runFixtureMode(records, fixturePath, outputArg) {
  console.log(`\nGOOGLE CALENDAR SYNC DRY-RUN — FIXTURE MODE — ${today}`);
  console.log('Source: scripts/google-calendar-sync-dry-run.mjs --fixture');
  console.log(`Source records: ${SOURCE_FILE}`);
  console.log(`Fixture: ${fixturePath}`);
  console.log('Mode: FIXTURE — no Google Calendar API calls — Gate 2A logic validation');
  console.log('');

  const fixtureFullPath = join(ROOT, fixturePath);
  if (!existsSync(fixtureFullPath)) {
    console.error(`FATAL: Fixture file not found: ${fixturePath}`);
    process.exit(1);
  }

  let fixture;
  try {
    fixture = JSON.parse(readFileSync(fixtureFullPath, 'utf8'));
  } catch (e) {
    console.error(`FATAL: Fixture file is not valid JSON: ${e.message}`);
    process.exit(1);
  }

  const liveEvents = fixture.events || [];
  const calendarId = fixture.calendarId || 'fixture-calendar';

  let fixtureLocalMap, localMapResult;
  if (syncMapFixtureArg) {
    localMapResult = loadLocalSyncMap(syncMapFixtureArg);
    fixtureLocalMap = localMapResult.entries;
    if (localMapResult.errors.length > 0) {
      console.error(`FATAL: Sync map fixture error: ${localMapResult.errors[0]}`);
      process.exit(1);
    }
    console.log(`Sync map fixture: ${syncMapFixtureArg}`);
    console.log(`  Entries: ${localMapResult.local_map_entries_count} (shape: ${localMapResult.map_shape_detected})`);
  } else {
    fixtureLocalMap = fixture.fixtureLocalMap || {};
    localMapResult = {
      local_map_path: 'embedded-fixture-local-map',
      local_map_present: true,
      local_map_read: true,
      entries: fixtureLocalMap,
      local_map_entries_count: Object.keys(fixtureLocalMap).filter(k => !k.startsWith('_')).length,
      map_shape_detected: 'fixture-embedded',
      warnings: [],
      errors: [],
    };
    console.log(`Fixture local map entries: ${localMapResult.local_map_entries_count} (embedded in fixture file)`);
  }
  console.log(`Fixture events: ${liveEvents.length}`);
  console.log('');

  const invalidRecords = records.filter(r => validateRecord(r).length > 0);
  if (invalidRecords.length > 0) {
    console.error(`FATAL: ${invalidRecords.length} source record(s) are invalid. Run: node scripts/google-calendar-source-validate.mjs`);
    process.exit(1);
  }

  const actions = compareSourceToEvents(records, liveEvents, { fixtureLocalMap, calendarId });

  printComparisonResults(actions);
  const gate3Allowed = printComparisonSummary(actions);

  const sourceOsIds = records.map(r => r.os_id);
  const localMapDiagnostics = buildLocalMapDiagnostics(localMapResult, sourceOsIds);

  const artifact = buildArtifact(actions, {
    mode: 'fixture',
    sourceCount: records.length,
    liveCount: liveEvents.length,
    calendarId,
    localMapDiagnostics,
  });

  const relPath = resolveOutputPath(outputArg, 'fixture');
  const writtenPath = writeArtifact(artifact, relPath);

  if (writtenPath) {
    console.log(`Dry-run artifact written to: ${writtenPath}`);
    console.log('  (gitignored — local only, do not commit)');
  }

  console.log('');
  console.log(`VERDICT: FIXTURE VALIDATION ${gate3Allowed ? 'PASS — no blockers' : 'BLOCKED — resolve blockers before Gate 3'}`);
  console.log(`  Source records: ${records.length}`);
  console.log(`  Fixture events: ${liveEvents.length}`);
  console.log('');
  console.log('---');
  console.log('No external sync was performed. No files were modified by this script.');
  process.exit(0);
}

// ─── Live mode (Gate 2B — requires googleapis + credentials) ───────────────
// Implemented but NOT run in Gate 2A. Use --live-readonly when Gate 2B is authorized.

async function runLiveMode(records, outputArg) {
  console.log(`\nGOOGLE CALENDAR SYNC DRY-RUN — LIVE MODE — ${today}`);
  console.log('Source: scripts/google-calendar-sync-dry-run.mjs --live-readonly');
  console.log('Gate 2B — requires credentials + googleapis + separate Coordinator authorization');
  console.log('');

  // Credential/token path resolution (canonical first; legacy only with --allow-legacy-root-credentials)
  const { credFile, tokenFile } = resolveCredPaths();
  const credPath = join(ROOT, credFile);
  const tokenPath = join(ROOT, tokenFile);
  const credMissing = !existsSync(credPath);
  const tokenMissing = !existsSync(tokenPath);

  if (credMissing || tokenMissing) {
    if (credMissing) {
      console.log('CREDENTIAL_MISSING — Google Calendar credential file not found.');
      console.log(`  Expected: ${credFile}`);
      console.log('  See: docs/project-control/google-calendar-credentials.example.md');
    }
    if (tokenMissing) {
      console.log('OAUTH_BOOTSTRAP_REQUIRED — Google Calendar token not found.');
      console.log(`  Expected: ${tokenFile}`);
      if (!credMissing) {
        console.log('  Credential file is present. Run OAuth bootstrap to generate the token:');
        console.log('    node scripts/google-calendar-auth-bootstrap.mjs --init-oauth');
        console.log('  (Requires explicit Coordinator authorization before running.)');
      }
    }
    console.log('');
    console.log('Current gate status: LIVE_READINESS_BLOCKED_CREDENTIALS_MISSING');
    console.log('---');
    console.log('No external sync was performed. No files were modified by this script.');
    process.exit(1);
  }

  // googleapis availability check via dynamic import — does not block --local-only or --fixture
  let google;
  try {
    const mod = await import('googleapis');
    google = mod.google;
  } catch {
    console.log('LIVE_READINESS_BLOCKED_DEPENDENCY_MISSING — googleapis npm package not found.');
    console.log('');
    console.log('Gate 2B live dry-run requires the googleapis package in scripts/node_modules/.');
    console.log('Coordinator approval required before installing:');
    console.log('  Package: googleapis');
    console.log('  Install command: cd scripts && npm install googleapis');
    console.log('  This does NOT modify root package.json or root package-lock.json.');
    console.log('');
    console.log('See: docs/project-control/google-calendar-credentials.example.md');
    console.log('');
    console.log('---');
    console.log('No external sync was performed. No files were modified by this script.');
    process.exit(1);
  }

  // Load credentials (read-only — content not printed)
  let credentials, token;
  try {
    credentials = JSON.parse(readFileSync(credPath, 'utf8'));
  } catch (e) {
    console.error(`FATAL: Could not parse ${credFile}: ${e.message}`);
    process.exit(1);
  }
  try {
    token = JSON.parse(readFileSync(tokenPath, 'utf8'));
  } catch (e) {
    console.error(`FATAL: Could not parse ${tokenFile}: ${e.message}`);
    process.exit(1);
  }

  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web || {};
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
  oAuth2Client.setCredentials(token);

  const calendarId = 'primary';

  // Load local sync map (read-only) — provides os_id → event_id mappings from Gate 3 apply
  const localMapResult = loadLocalSyncMap(LOCAL_MAP_FILE);
  console.log(`Local sync map: ${LOCAL_MAP_FILE}`);
  console.log(`  Present: ${localMapResult.local_map_present ? 'YES' : 'NO'}`);
  if (localMapResult.local_map_read) {
    console.log(`  Entries: ${localMapResult.local_map_entries_count} (shape: ${localMapResult.map_shape_detected})`);
  } else if (localMapResult.errors.length > 0) {
    console.log(`  Read error: ${localMapResult.errors[0]}`);
  }
  for (const w of localMapResult.warnings) {
    console.log(`  Warning: ${w}`);
  }
  console.log('');

  // Validate source records before making any API call
  const invalidRecords = records.filter(r => validateRecord(r).length > 0);
  if (invalidRecords.length > 0) {
    console.error(`FATAL: ${invalidRecords.length} source record(s) are invalid. Fix before Gate 2.`);
    process.exit(1);
  }

  // Fetch events — read-only, no mutations
  console.log(`Fetching events from Google Calendar (read-only, calendar: ${calendarId})...`);
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  let liveEvents = [];
  let pageToken;
  try {
    do {
      const res = await calendar.events.list({
        calendarId,
        maxResults: 250,
        singleEvents: false,
        showDeleted: false,
        pageToken,
      });
      liveEvents.push(...(res.data.items || []));
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  } catch (e) {
    console.error(`FATAL: Google Calendar API error: ${e.message}`);
    console.error('Verify credentials are valid and the Calendar API is enabled in Google Cloud.');
    process.exit(1);
  }

  console.log(`Fetched ${liveEvents.length} events from calendar "${calendarId}".`);
  console.log('');

  const actions = compareSourceToEvents(records, liveEvents, { fixtureLocalMap: localMapResult.entries, calendarId });

  printComparisonResults(actions);
  const gate3Allowed = printComparisonSummary(actions);

  const sourceOsIds = records.map(r => r.os_id);
  const localMapDiagnostics = buildLocalMapDiagnostics(localMapResult, sourceOsIds);

  const artifact = buildArtifact(actions, {
    mode: 'live',
    sourceCount: records.length,
    liveCount: liveEvents.length,
    calendarId,
    localMapDiagnostics,
  });

  const relPath = resolveOutputPath(outputArg, 'live');
  const writtenPath = writeArtifact(artifact, relPath);

  if (writtenPath) {
    console.log(`Dry-run artifact written to: ${writtenPath}`);
    console.log('  (gitignored — local only, do not commit)');
  }

  console.log('');
  console.log(`VERDICT: LIVE DRY-RUN ${gate3Allowed ? 'PASS — Gate 3 apply is allowed' : 'BLOCKED — resolve blockers before Gate 3'}`);
  console.log('');
  console.log('---');
  console.log('No Google Calendar events were created, updated, or deleted. Read-only.');
  console.log('No external-sync-map.local.json was written.');
  console.log('No files were committed.');
}

// ─── Main ──────────────────────────────────────────────────────────────────

if (isHelp) {
  runHelp();
} else if (isAuthStatus) {
  runAuthStatus();
} else {
  const records = loadSourceRecords();

  if (isLocalOnly) {
    runLocalMode(records);
  } else if (isFixture) {
    if (!fixtureArg) {
      console.error('FATAL: --fixture requires a file path argument.');
      console.error('  Example: --fixture docs/project-control/google-calendar-live-events.fixture.json');
      process.exit(1);
    }
    runFixtureMode(records, fixtureArg, outputArg);
  } else if (isLive) {
    runLiveMode(records, outputArg).catch(e => {
      console.error(`FATAL: ${e.message}`);
      process.exit(1);
    });
  }
}
