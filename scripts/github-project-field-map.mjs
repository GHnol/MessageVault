#!/usr/bin/env node
/**
 * github-project-field-map.mjs
 * AI Project OS v1.4 — Validate example field map and optional local sync map.
 *
 * No external calls. No apply mode. Read-only.
 *
 * Usage:
 *   node scripts/github-project-field-map.mjs [--local-map <path>]
 *
 * Options:
 *   --local-map <path>    Also validate a local sync map (gitignored, never committed)
 *                         Default: docs/project-control/external-sync-map.local.json
 *   --help                Show this help
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }

if (flag('--help') || flag('-h')) {
  console.log(`
github-project-field-map.mjs — Validate example field map and optional local sync map

Usage:
  node scripts/github-project-field-map.mjs [--local-map <path>]

Options:
  --local-map <path>    Validate a local sync map (default: docs/project-control/external-sync-map.local.json)
  --help                Show this help

No API calls. No external writes. Read-only.
`);
  process.exit(0);
}

const LOCAL_MAP_FLAG = opt('--local-map');
const DEFAULT_LOCAL_MAP = 'docs/project-control/external-sync-map.local.json';

function path(rel) { return join(ROOT, rel); }
function sep() { console.log('─'.repeat(60)); }

let failures = 0;
let warnings = 0;

function ok(msg)   { console.log(`  [PASS] ${msg}`); }
function fail(msg) { console.log(`  [FAIL] ${msg}`); failures++; }
function warn(msg) { console.log(`  [WARN] ${msg}`); warnings++; }
function info(msg) { console.log(`  [INFO] ${msg}`); }

function check(label, condition, severity = 'fail') {
  if (condition) { ok(label); }
  else if (severity === 'fail') { fail(label); }
  else { warn(label); }
}

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT FIELD MAP VALIDATOR');
console.log(`Date:    ${now}`);
console.log('Mode:    read-only validation (no external writes)');
sep();
console.log('');

// ---------------------------------------------------------------------------
// 1. Example field map validation
// ---------------------------------------------------------------------------
console.log('1. EXAMPLE FIELD MAP');
console.log('');

const EXAMPLE_MAP = 'docs/project-control/github-projects-field-map.example.json';

if (!existsSync(path(EXAMPLE_MAP))) {
  fail(`Example field map not found: ${EXAMPLE_MAP}`);
  console.log('');
  console.log(`  ${failures} failure(s). Cannot continue.`);
  process.exit(1);
}

let map;
try {
  const raw = readFileSync(path(EXAMPLE_MAP), 'utf8');
  map = JSON.parse(raw);
  ok('Example field map is valid JSON');
} catch (e) {
  fail(`Could not parse example field map: ${e.message}`);
  process.exit(1);
}

console.log('');
console.log('  Required fields:');
check('owner field present', typeof map.owner === 'string' && map.owner.length > 0);
check('repo field present', typeof map.repo === 'string' && map.repo.length > 0);
check('project_title field present', typeof map.project_title === 'string' && map.project_title.length > 0);
check('project_number field present', map.project_number !== undefined);
check('project_id field present', typeof map.project_id === 'string' && map.project_id.length > 0);
check('fields object present', typeof map.fields === 'object' && map.fields !== null);
check('views array present', Array.isArray(map.views) && map.views.length > 0);
check('statuses array present', Array.isArray(map.statuses) && map.statuses.length > 0);
check('labels array present', Array.isArray(map.labels) && map.labels.length > 0);
check('local_sync_map_path present', typeof map.local_sync_map_path === 'string');
check('example_issue_mappings present', typeof map.example_issue_mappings === 'object');

console.log('');
console.log('  Placeholder safety:');
const mapStr = JSON.stringify(map);
check('project_number is 0 (placeholder)', map.project_number === 0, 'warn');
check('project_id contains "placeholder"', mapStr.includes('placeholder'));
check('No real GitHub tokens (ghp_)', !mapStr.toLowerCase().includes('ghp_'));
check('No real project node IDs', !mapStr.match(/"PVT_[A-Za-z0-9]{20,}"/));

console.log('');
console.log('  Custom field coverage (13 required):');
const requiredFields = [
  'os_id', 'package', 'phase', 'lane', 'source_file',
  'last_repo_sync', 'external_sync_status', 'risk_level',
  'decision_needed', 'calendar_relevant', 'ticktick_relevant',
  'owner_role', 'success_criteria',
];
for (const fieldKey of requiredFields) {
  check(`Field defined: ${fieldKey}`, fieldKey in (map.fields || {}));
}

console.log('');
console.log('  View coverage:');
check('At least 10 views defined', (map.views || []).length >= 10, 'warn');
check('At least 14 views defined', (map.views || []).length >= 14, 'warn');

console.log('');
console.log('  Status coverage:');
const requiredStatuses = ['Not Started','In Progress','In Review','Blocked','Waiting','Approved','Done','Deferred','Cancelled'];
for (const s of requiredStatuses) {
  check(`Status defined: ${s}`, (map.statuses || []).includes(s));
}

console.log('');
console.log('  Owner role options:');
const ownerRoleField = map.fields && map.fields.owner_role;
if (ownerRoleField && Array.isArray(ownerRoleField.options)) {
  const requiredRoles = ['Founder', 'Coordinator', 'Claude', 'Codex', 'Development'];
  for (const role of requiredRoles) {
    check(`Owner Role option: ${role}`, ownerRoleField.options.includes(role));
  }
} else {
  warn('owner_role field options not found — cannot validate roles');
}
console.log('');

// ---------------------------------------------------------------------------
// 2. Local sync map validation (optional)
// ---------------------------------------------------------------------------
const localMapPath = LOCAL_MAP_FLAG || DEFAULT_LOCAL_MAP;
const absLocalMap = resolve(localMapPath);

console.log('2. LOCAL SYNC MAP');
console.log('');

if (existsSync(absLocalMap)) {
  info(`Found: ${absLocalMap}`);
  let localMap;
  try {
    localMap = JSON.parse(readFileSync(absLocalMap, 'utf8'));
    ok('Local sync map is valid JSON');
  } catch (e) {
    fail(`Could not parse local sync map: ${e.message}`);
    localMap = null;
  }

  if (localMap) {
    const mapStr2 = JSON.stringify(localMap);

    // Safety: must not contain real tokens
    check('No GitHub tokens in local sync map', !mapStr2.toLowerCase().includes('ghp_'));
    check('No passwords in local sync map', !mapStr2.toLowerCase().includes('password'));

    // Structure checks
    const ghSection = localMap.github_projects || {};
    const projectMeta = ghSection._project_meta || {};
    const fieldIds = ghSection._field_ids || {};
    const issues = ghSection.issues || {};

    check('github_projects section present', 'github_projects' in localMap);
    check('_project_meta present', '_project_meta' in ghSection, 'warn');
    check('_field_ids present', '_field_ids' in ghSection, 'warn');

    if (projectMeta.project_id) {
      info(`Project ID: ${projectMeta.project_id}`);
      info(`Project title: "${projectMeta.title || '(unknown)'}"`);
      info(`Project number: ${projectMeta.project_number || '?'}`);
    }

    const fieldCount = Object.keys(fieldIds).length;
    info(`Field IDs defined: ${fieldCount}`);
    info(`Issues tracked: ${Object.keys(issues).length}`);

    for (const [osId, entry] of Object.entries(issues)) {
      const age = entry.synced_at ? ` (synced ${entry.synced_at.slice(0, 10)})` : '';
      console.log(`    ${osId}: Issue #${entry.issue_number || '?'} — "${entry.title || ''}"${age}`);
    }
  }
} else {
  info(`No local sync map at ${absLocalMap} — expected before first apply.`);
  info('This is normal if no apply has been run yet.');
}
console.log('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
sep();

if (failures > 0) {
  console.log(`VALIDATION FAILED: ${failures} failure(s), ${warnings} warning(s)`);
} else if (warnings > 0) {
  console.log(`VALIDATION PASSED WITH WARNINGS: 0 failures, ${warnings} warning(s)`);
} else {
  console.log('VALIDATION PASSED: 0 failures, 0 warnings');
}

console.log('');
console.log('  No external writes performed.');
console.log('  No API calls made.');
sep();

process.exit(failures > 0 ? 1 : 0);
