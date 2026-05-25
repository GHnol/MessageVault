#!/usr/bin/env node
/**
 * github-project-setup-dry-run.mjs
 *
 * Reads repo docs and prints the planned GitHub Project structure, fields,
 * statuses, and views. Performs NO external writes of any kind.
 *
 * No npm dependencies. No API calls. No credentials. No external writes.
 * Exit 0 = dry-run complete. Exit 1 = required docs missing.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

function path(rel) {
  return join(ROOT, rel);
}

function exists(rel) {
  return existsSync(path(rel));
}

function sep() {
  console.log('─'.repeat(60));
}

// ── Header ───────────────────────────────────────────────────────────────────

const now = new Date().toISOString().slice(0, 10);
console.log('');
sep();
console.log('GITHUB PROJECT SETUP — DRY RUN');
console.log(`Date:    ${now}`);
console.log('Mode:    dry-run (no external writes)');
console.log('Script:  scripts/github-project-setup-dry-run.mjs');
sep();
console.log('');

// ── Required docs check ───────────────────────────────────────────────────────

const requiredDocs = [
  'docs/project-control/github-projects-setup-policy.md',
  'docs/project-control/github-projects-source-schema.md',
  'docs/project-control/github-projects-import-runbook.md',
  'docs/project-control/github-projects-field-map.example.json',
  'docs/project-control/github-projects-sync-log.md',
];

console.log('REQUIRED DOCS CHECK');
let missing = 0;
for (const doc of requiredDocs) {
  if (exists(doc)) {
    console.log(`  [PASS] ${doc}`);
  } else {
    console.log(`  [FAIL] MISSING: ${doc}`);
    missing++;
  }
}

if (missing > 0) {
  console.log('');
  console.log(`ERROR: ${missing} required doc(s) missing. Run this script after the policy docs are in place.`);
  process.exit(1);
}

console.log('');

// ── Planned project structure ─────────────────────────────────────────────────

console.log('PLANNED GITHUB PROJECT STRUCTURE');
sep();
console.log('');
console.log('Project:');
console.log('  Name:    KeepMees Project Control');
console.log('  Owner:   GHnol');
console.log('  Repo:    GHnol/MessageVault (repo-connected)');
console.log('');

console.log('Statuses (9):');
const statuses = [
  'Not Started',
  'In Progress',
  'In Review',
  'Blocked',
  'Waiting',
  'Approved',
  'Done',
  'Deferred',
  'Cancelled',
];
for (const s of statuses) {
  console.log(`  • ${s}`);
}
console.log('');

console.log('Views (14):');
const views = [
  'Board',
  'Table',
  'Current Sprint',
  'Backlog',
  'Review / QA',
  'Waiting / Blocked',
  'Done',
  'Risks / Decisions',
  'Calendar Relevant',
  'TickTick Relevant',
  'By Package',
  'By Phase',
  'By Lane',
  'Decision Needed',
];
for (const v of views) {
  console.log(`  • ${v}`);
}
console.log('');

console.log('Custom Fields (13):');
const fields = [
  { name: 'OS ID', type: 'text' },
  { name: 'Package', type: 'text' },
  { name: 'Phase', type: 'text' },
  { name: 'Lane', type: 'single_select' },
  { name: 'Source File', type: 'text' },
  { name: 'Last Repo Sync', type: 'date' },
  { name: 'External Sync Status', type: 'single_select' },
  { name: 'Risk Level', type: 'single_select' },
  { name: 'Decision Needed', type: 'checkbox' },
  { name: 'Calendar Relevant', type: 'checkbox' },
  { name: 'TickTick Relevant', type: 'checkbox' },
  { name: 'Owner Role', type: 'single_select' },
  { name: 'Success Criteria', type: 'text' },
];
for (const f of fields) {
  console.log(`  • ${f.name.padEnd(25)} [${f.type}]`);
}
console.log('');

// ── Field map example check ───────────────────────────────────────────────────

console.log('FIELD MAP EXAMPLE');
sep();
const examplePath = 'docs/project-control/github-projects-field-map.example.json';
if (exists(examplePath)) {
  try {
    const raw = readFileSync(path(examplePath), 'utf8');
    const map = JSON.parse(raw);
    console.log(`  owner:         ${map.owner || '(not set)'}`);
    console.log(`  repo:          ${map.repo || '(not set)'}`);
    console.log(`  project_title: ${map.project_title || '(not set)'}`);
    console.log(`  project_number: ${map.project_number} (placeholder)`);
    console.log(`  fields:        ${Object.keys(map.fields || {}).length} field(s) defined`);
    console.log(`  views:         ${(map.views || []).length} view(s) defined`);
    console.log(`  statuses:      ${(map.statuses || []).length} status(es) defined`);
    console.log('  [PASS] Example field map is valid JSON');
  } catch (e) {
    console.log(`  [FAIL] Could not parse example field map: ${e.message}`);
  }
} else {
  console.log(`  [FAIL] Example field map missing: ${examplePath}`);
}
console.log('');

// ── gh CLI check ──────────────────────────────────────────────────────────────

console.log('GH CLI STATUS');
sep();
console.log('  This script does not check gh CLI availability.');
console.log('  To verify before apply, run:');
console.log('    gh --version');
console.log('    gh auth status');
console.log('  Apply scripts will check these automatically before proceeding.');
console.log('');

// ── Safety footer ─────────────────────────────────────────────────────────────

sep();
console.log('DRY-RUN COMPLETE');
console.log('');
console.log('  No external writes performed.');
console.log('  No GitHub Project was created.');
console.log('  No GitHub Issues were created.');
console.log('  No credentials were read or logged.');
console.log('');
console.log('  To apply: get Coordinator approval, then run:');
console.log('    node scripts/github-project-setup-apply.mjs --apply');
console.log('');
sep();
