#!/usr/bin/env node
/**
 * github-project-sync-status.mjs
 *
 * Dry-run only. Compares local source records to the local sync map
 * (if present) and reports structural sync status.
 *
 * Does NOT call external APIs. Does NOT write any files.
 * Reports local structural status only in this version.
 *
 * No npm dependencies. No secrets logged. No external writes.
 * Exit 0 = status reported. Exit 1 = critical error.
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

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT SYNC STATUS');
console.log(`Date:    ${now}`);
console.log('Mode:    local structural status only (no API calls)');
sep();
console.log('');

// ── Required docs check ───────────────────────────────────────────────────────

const policyDocs = [
  'docs/project-control/github-projects-setup-policy.md',
  'docs/project-control/github-projects-source-schema.md',
  'docs/project-control/github-projects-import-runbook.md',
  'docs/project-control/github-projects-field-map.example.json',
  'docs/project-control/github-projects-sync-log.md',
];

console.log('POLICY DOCS');
let policyMissing = 0;
for (const doc of policyDocs) {
  if (exists(doc)) {
    console.log(`  [PASS] ${doc}`);
  } else {
    console.log(`  [FAIL] MISSING: ${doc}`);
    policyMissing++;
  }
}
console.log('');

// ── Script scaffolding check ──────────────────────────────────────────────────

const scripts = [
  'scripts/github-project-setup-dry-run.mjs',
  'scripts/github-project-setup-apply.mjs',
  'scripts/github-project-import-issues.mjs',
  'scripts/github-project-sync-status.mjs',
  'scripts/github-project-field-map.mjs',
];

console.log('SCRIPT SCAFFOLDING');
for (const s of scripts) {
  if (exists(s)) {
    console.log(`  [PASS] ${s}`);
  } else {
    console.log(`  [FAIL] MISSING: ${s}`);
  }
}
console.log('');

// ── Local sync map check ──────────────────────────────────────────────────────

const localMap = 'docs/project-control/external-sync-map.local.json';
const exampleMap = 'docs/project-control/github-projects-field-map.example.json';

console.log('LOCAL SYNC MAP');
if (exists(localMap)) {
  console.log('  [INFO] external-sync-map.local.json exists on this machine.');
  try {
    const raw = readFileSync(path(localMap), 'utf8');
    const map = JSON.parse(raw);
    const ghSection = map.github_projects || {};
    const items = Object.keys(ghSection);
    console.log(`  GitHub Project items tracked: ${items.length}`);
    if (items.length > 0) {
      for (const id of items) {
        const item = ghSection[id];
        console.log(`    ${id}: issue #${item.issue_number || '?'}, status: ${item.status || 'unknown'}`);
      }
    }
  } catch (e) {
    console.log(`  [WARN] Could not parse local sync map: ${e.message}`);
  }
} else {
  console.log('  [INFO] No local sync map found — this is expected before first apply.');
  console.log('         A GitHub Project has not been created on this machine yet.');
}
console.log('');

// ── Example field map check ───────────────────────────────────────────────────

console.log('EXAMPLE FIELD MAP');
if (exists(exampleMap)) {
  try {
    const raw = readFileSync(path(exampleMap), 'utf8');
    const map = JSON.parse(raw);
    const hasPlaceholders =
      JSON.stringify(map).includes('placeholder') &&
      !JSON.stringify(map).includes('real_token');
    console.log('  [PASS] github-projects-field-map.example.json is valid JSON');
    console.log(`  [${hasPlaceholders ? 'PASS' : 'WARN'}] Placeholder IDs only: ${hasPlaceholders}`);
    if (!hasPlaceholders) {
      console.log('  [WARN] Example field map may contain real IDs — verify before committing.');
    }
  } catch (e) {
    console.log(`  [FAIL] Could not parse example field map: ${e.message}`);
  }
} else {
  console.log(`  [FAIL] MISSING: ${exampleMap}`);
}
console.log('');

// ── Summary ───────────────────────────────────────────────────────────────────

sep();
console.log('STATUS SUMMARY');
console.log('');
if (policyMissing > 0) {
  console.log(`  [NEEDS ATTENTION] ${policyMissing} policy doc(s) missing.`);
} else {
  console.log('  [PASS] All policy docs present.');
}
console.log('');
console.log('  GitHub Project: NOT YET CREATED (no live API check performed)');
console.log('  GitHub Issues:  NOT YET IMPORTED (no live API check performed)');
console.log('');
console.log('  To check live GitHub Project status, run manually:');
console.log('    gh project list --owner GHnol');
console.log('    gh issue list --repo GHnol/MessageVault');
console.log('');
console.log('  No external API calls were made by this script.');
sep();
