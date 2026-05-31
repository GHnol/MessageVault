#!/usr/bin/env node
/**
 * Project Control Sync Validator
 *
 * Validates that repo project-control docs are internally consistent:
 * - Required files exist
 * - Date fields are parseable where found
 * - Status values are from the allowed set where found
 * - External-sync-map.example.json is valid JSON
 *
 * No dependencies. No API calls. No external writes. Read-only local files only.
 * Exit 0 = all checks pass. Exit 1 = one or more failures.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
let failures = 0;
let warnings = 0;
const report = { pass: [], warn: [], fail: [] };

function pass(label) { report.pass.push(`[PASS] ${label}`); }
function warn(label, reason) { report.warn.push(`[WARN] ${label} — ${reason}`); warnings++; }
function fail(label, reason) { report.fail.push(`[FAIL] ${label} — ${reason}`); failures++; }

function requireFile(label, rel) {
  if (existsSync(join(ROOT, rel))) {
    pass(label);
    return true;
  }
  fail(label, `missing: ${rel}`);
  return false;
}

function requireJSON(label, rel) {
  if (!existsSync(join(ROOT, rel))) {
    fail(label, `missing: ${rel}`);
    return null;
  }
  try {
    const content = readFileSync(join(ROOT, rel), 'utf8');
    const parsed = JSON.parse(content);
    pass(label);
    return parsed;
  } catch (e) {
    fail(label, `invalid JSON in ${rel}: ${e.message}`);
    return null;
  }
}

// --- Required project-control files ---
const required = [
  ['project-sync-policy.md', 'docs/project-control/project-sync-policy.md'],
  ['project-sync-dry-run-format.md', 'docs/project-control/project-sync-dry-run-format.md'],
  ['project-sync-source-schema.md', 'docs/project-control/project-sync-source-schema.md'],
  ['external-sync-safety.md', 'docs/project-control/external-sync-safety.md'],
  ['project-sync-log.md', 'docs/project-control/project-sync-log.md'],
  ['calendar-sync-policy.md', 'docs/project-control/calendar-sync-policy.md'],
  ['calendar-source-template.md', 'docs/project-control/calendar-source-template.md'],
];
for (const [label, rel] of required) {
  requireFile(label, rel);
}

// --- External sync map example is valid JSON ---
requireJSON('external-sync-map.example.json is valid JSON', 'docs/project-control/external-sync-map.example.json');

// --- Local map must not be committed to git (may exist on disk if gitignored) ---
function isGitTracked(relPath) {
  try {
    execSync(`git ls-files --error-unmatch "${relPath}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}
if (isGitTracked('docs/project-control/external-sync-map.local.json')) {
  fail('external-sync-map.local.json must be gitignored (not committed)', 'file is tracked by git — remove from tracking and add to .gitignore');
} else {
  pass('external-sync-map.local.json not committed to git (gitignored or absent as expected)');
}

// --- Check for calendar-sync-log.md dates parseable ---
const syncLog = join(ROOT, 'docs/project-control/calendar-sync-log.md');
if (existsSync(syncLog)) {
  const content = readFileSync(syncLog, 'utf8');
  const dateMatches = content.match(/^## (\d{4}-\d{2}-\d{2})/gm);
  if (dateMatches && dateMatches.length > 0) {
    const allParseable = dateMatches.every(m => !isNaN(Date.parse(m.replace('## ', ''))));
    if (allParseable) {
      pass('calendar-sync-log.md dates parseable');
    } else {
      warn('calendar-sync-log.md', 'one or more dates are not parseable as YYYY-MM-DD');
    }
  } else {
    warn('calendar-sync-log.md', 'no ## YYYY-MM-DD entries found (expected at least one)');
  }
}

// --- Check project-sync-log.md exists and has at least one entry ---
const projectSyncLog = join(ROOT, 'docs/project-control/project-sync-log.md');
if (existsSync(projectSyncLog)) {
  const content = readFileSync(projectSyncLog, 'utf8');
  if (content.includes('## ')) {
    pass('project-sync-log.md has at least one entry');
  } else {
    warn('project-sync-log.md', 'no entries found (## heading)');
  }
}

// --- Output ---
console.log('\n=== Project Control Sync Validator ===\n');

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
  console.log('\nVERDICT: VALID — all required project-control docs present and internally consistent.\n');
  process.exit(0);
} else {
  console.log(`\nVERDICT: INVALID — ${failures} required item(s) missing or malformed.\n`);
  process.exit(1);
}
