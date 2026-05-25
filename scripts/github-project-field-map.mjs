#!/usr/bin/env node
/**
 * github-project-field-map.mjs
 *
 * Reads the example field map and validates required placeholder structure.
 * No external calls. No apply mode. Read-only.
 *
 * No npm dependencies. No API calls. No external writes.
 * Exit 0 = validation passed. Exit 1 = validation failed.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function path(rel) {
  return join(ROOT, rel);
}

function sep() {
  console.log('─'.repeat(60));
}

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT FIELD MAP VALIDATOR');
console.log(`Date:    ${now}`);
console.log('Mode:    read-only validation (no external writes)');
sep();
console.log('');

const EXAMPLE_MAP = 'docs/project-control/github-projects-field-map.example.json';

if (!existsSync(path(EXAMPLE_MAP))) {
  console.log(`[FAIL] Example field map not found: ${EXAMPLE_MAP}`);
  process.exit(1);
}

let map;
try {
  const raw = readFileSync(path(EXAMPLE_MAP), 'utf8');
  map = JSON.parse(raw);
  console.log('[PASS] Example field map is valid JSON');
} catch (e) {
  console.log(`[FAIL] Could not parse example field map: ${e.message}`);
  process.exit(1);
}

let failures = 0;
let warnings = 0;

function check(label, condition, severity = 'fail') {
  if (condition) {
    console.log(`[PASS] ${label}`);
  } else {
    if (severity === 'fail') {
      console.log(`[FAIL] ${label}`);
      failures++;
    } else {
      console.log(`[WARN] ${label}`);
      warnings++;
    }
  }
}

console.log('');
console.log('REQUIRED FIELDS');

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
console.log('PLACEHOLDER SAFETY');

const mapStr = JSON.stringify(map);
check('project_number is 0 (placeholder)', map.project_number === 0, 'warn');
check('project_id contains "placeholder"', mapStr.includes('placeholder'), 'fail');
check('No real GitHub tokens', !mapStr.toLowerCase().includes('ghp_'), 'fail');
check('No real project node IDs (length check)', !mapStr.match(/"PVT_[A-Za-z0-9]{20,}"/));

console.log('');
console.log('FIELD COVERAGE');

const requiredFields = [
  'os_id',
  'package',
  'phase',
  'lane',
  'source_file',
  'last_repo_sync',
  'external_sync_status',
  'risk_level',
  'decision_needed',
  'calendar_relevant',
  'ticktick_relevant',
  'owner_role',
  'success_criteria',
];

for (const fieldKey of requiredFields) {
  check(`Field defined: ${fieldKey}`, fieldKey in (map.fields || {}));
}

console.log('');
console.log('VIEW COVERAGE (minimum 10 expected)');
check('At least 10 views defined', (map.views || []).length >= 10, 'warn');

console.log('');
console.log('OWNER ROLE VALUES');
const ownerRoleField = map.fields && map.fields.owner_role;
if (ownerRoleField && Array.isArray(ownerRoleField.options)) {
  const requiredRoles = ['Founder', 'Coordinator', 'Claude', 'Codex', 'Development'];
  for (const role of requiredRoles) {
    check(`Owner Role option: ${role}`, ownerRoleField.options.includes(role));
  }
} else {
  console.log('[WARN] owner_role field options not found — cannot validate roles');
  warnings++;
}

console.log('');
sep();

if (failures > 0) {
  console.log(`VALIDATION FAILED: ${failures} failure(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`VALIDATION PASSED WITH WARNINGS: 0 failures, ${warnings} warning(s)`);
} else {
  console.log('VALIDATION PASSED: 0 failures, 0 warnings');
}

console.log('');
console.log('  No external writes performed.');
console.log('  No API calls made.');
sep();
