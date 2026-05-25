#!/usr/bin/env node
/**
 * github-project-sync-status.mjs
 * AI Project OS v1.4 — Compare local sync map to live GitHub Project state.
 *
 * Default mode: local-only structural status (no API calls).
 * --live mode:  read-only GitHub API queries to show live project field/item state.
 *
 * No external writes. No mutations. No token exposure.
 * Exit 0 = status reported. Exit 1 = critical error.
 *
 * Usage:
 *   node scripts/github-project-sync-status.mjs [--live] [--owner GHnol] [--project-number N]
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import {
  probeAuth,
  readSyncMap,
  findProject,
  getProjectFields,
  getProjectItemIssueIds,
} from './lib/github-projects-client.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }

const LIVE = flag('--live');
const OWNER = opt('--owner') || 'GHnol';
const REPO  = opt('--repo') || 'MessageVault';
const PROJECT_NUMBER_RAW = opt('--project-number');
const SYNC_MAP_PATH = opt('--sync-map') || 'docs/project-control/external-sync-map.local.json';

function path(rel) { return join(ROOT, rel); }
function exists(rel) { return existsSync(path(rel)); }
function sep() { console.log('─'.repeat(60)); }
function ok(msg)   { console.log(`  [PASS] ${msg}`); }
function fail(msg) { console.log(`  [FAIL] ${msg}`); }
function warn(msg) { console.log(`  [WARN] ${msg}`); }
function info(msg) { console.log(`  [INFO] ${msg}`); }

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT SYNC STATUS');
console.log(`Date:    ${now}`);
console.log(`Mode:    ${LIVE ? 'live (read-only API queries)' : 'local structural only (no API calls)'}`);
if (LIVE) console.log(`Owner:   ${OWNER}   Repo: ${REPO}${PROJECT_NUMBER_RAW ? `   Project: #${PROJECT_NUMBER_RAW}` : ''}`);
sep();
console.log('');

// ---------------------------------------------------------------------------
// 1. Policy docs check
// ---------------------------------------------------------------------------
console.log('1. POLICY DOCS');
console.log('');

const policyDocs = [
  'docs/project-control/github-projects-setup-policy.md',
  'docs/project-control/github-projects-source-schema.md',
  'docs/project-control/github-projects-import-runbook.md',
  'docs/project-control/github-projects-field-map.example.json',
  'docs/project-control/github-projects-sync-log.md',
  'docs/project-control/external-sync-safety.md',
];

let policyMissing = 0;
for (const doc of policyDocs) {
  if (exists(doc)) { ok(doc); }
  else { fail(`MISSING: ${doc}`); policyMissing++; }
}
console.log('');

// ---------------------------------------------------------------------------
// 2. Script scaffolding check
// ---------------------------------------------------------------------------
console.log('2. SCRIPT SCAFFOLDING');
console.log('');

const scripts = [
  'scripts/lib/github-projects-client.mjs',
  'scripts/github-project-setup-dry-run.mjs',
  'scripts/github-project-setup-apply.mjs',
  'scripts/github-project-import-issues.mjs',
  'scripts/github-project-sync-status.mjs',
  'scripts/github-project-field-map.mjs',
];

for (const s of scripts) {
  if (exists(s)) { ok(s); }
  else { fail(`MISSING: ${s}`); }
}
console.log('');

// ---------------------------------------------------------------------------
// 3. Local sync map check
// ---------------------------------------------------------------------------
console.log('3. LOCAL SYNC MAP');
console.log('');

const absSyncMap = resolve(SYNC_MAP_PATH);
let localSyncMap = null;
let syncedIssues = {};

if (existsSync(absSyncMap)) {
  try {
    localSyncMap = readSyncMap(absSyncMap).data ?? {};
    const ghSection = localSyncMap?.github_projects || {};
    syncedIssues = ghSection.issues || {};
    const projectMeta = ghSection._project_meta || {};
    info(`Sync map: ${absSyncMap}`);
    info(`Project: "${projectMeta.title || '(unknown)'}" #${projectMeta.project_number || '?'} id: ${projectMeta.project_id || '?'}`);
    console.log(`  GitHub Issues tracked: ${Object.keys(syncedIssues).length}`);
    for (const [osId, entry] of Object.entries(syncedIssues)) {
      const age = entry.synced_at ? ` (synced ${entry.synced_at.slice(0, 10)})` : '';
      console.log(`    ${osId}: Issue #${entry.issue_number || '?'} — "${entry.title || ''}"${age}`);
    }
  } catch (e) {
    warn(`Could not parse sync map: ${e.message}`);
  }
} else {
  info(`No local sync map at ${absSyncMap} — expected before first apply.`);
}
console.log('');

// ---------------------------------------------------------------------------
// 4. Example field map check
// ---------------------------------------------------------------------------
console.log('4. EXAMPLE FIELD MAP');
console.log('');

const exampleMap = 'docs/project-control/github-projects-field-map.example.json';
if (exists(exampleMap)) {
  try {
    const raw = readFileSync(path(exampleMap), 'utf8');
    const map = JSON.parse(raw);
    const mapStr = JSON.stringify(map);
    const hasPlaceholders = mapStr.includes('placeholder');
    const hasTokens = mapStr.toLowerCase().includes('ghp_');
    ok(`${exampleMap} is valid JSON`);
    if (hasPlaceholders && !hasTokens) { ok('Placeholder IDs only — safe to commit'); }
    else if (hasTokens) { fail('Possible real token detected — do not commit'); }
    else { warn('Placeholder check inconclusive'); }
  } catch (e) {
    fail(`Could not parse example field map: ${e.message}`);
  }
} else {
  fail(`MISSING: ${exampleMap}`);
}
console.log('');

// ---------------------------------------------------------------------------
// 5. Live mode — read-only GitHub API queries
// ---------------------------------------------------------------------------
if (LIVE) {
  console.log('5. LIVE GITHUB PROJECT STATUS');
  console.log('');

  // Auth probe
  let login = null;
  try {
    const auth = probeAuth();
    if (auth.ok) {
      login = auth.login;
      ok(`Authenticated as: ${login}`);
    } else {
      fail(`Auth probe failed: ${auth.error}`);
    }
  } catch (e) {
    fail(`Auth probe failed: ${e.message}`);
    console.log('');
    console.log('  Cannot perform live checks without authentication.');
    console.log('');
  }

  if (login) {
    // Project lookup
    const projectNumber = PROJECT_NUMBER_RAW ? parseInt(PROJECT_NUMBER_RAW, 10) : null;
    const projectTitle = localSyncMap?.github_projects?._project_meta?.title || null;

    let liveProject = null;
    try {
      const findR = findProject(OWNER, projectTitle, projectNumber);
      if (findR.ok && findR.found) {
        liveProject = findR.project;
        ok(`Live project: "${liveProject.title}" #${liveProject.number}`);
      } else if (!findR.ok) {
        warn(`Project lookup failed: ${findR.error}`);
      } else {
        info(`No live project found${projectTitle ? ` matching "${projectTitle}"` : ''}. Use --project-number to specify.`);
      }
    } catch (e) {
      warn(`Project lookup failed: ${e.message}`);
    }

    // Fields check
    if (liveProject) {
      try {
        const fieldsR = getProjectFields(liveProject.id);
        if (fieldsR.ok) {
          const fields = fieldsR.fields ?? [];
          ok(`Live fields: ${fields.length} fields found`);
          for (const f of fields) {
            const optCount = f.options ? ` (${f.options.length} options)` : '';
            console.log(`    ${f.name.padEnd(28)} [${f.dataType}]${optCount}`);
          }
        } else {
          warn(`Could not read live fields: ${fieldsR.error}`);
        }
      } catch (e) {
        warn(`Could not read live fields: ${e.message}`);
      }

      // Item count
      try {
        const itemR = getProjectItemIssueIds(liveProject.id);
        if (itemR.ok) {
          const items = itemR.items ?? [];
          ok(`Live items in project: ${items.length}`);
          const syncedCount = Object.keys(syncedIssues).length;
          if (syncedCount > 0) {
            info(`Local sync map tracks ${syncedCount} issues; project has ${items.length} items`);
            if (items.length < syncedCount) {
              warn(`Project has fewer items than sync map — some issues may have been removed from project`);
            }
          }
        } else {
          warn(`Could not read live items: ${itemR.error}`);
        }
      } catch (e) {
        warn(`Could not read live items: ${e.message}`);
      }
    }
  }
  console.log('');
} else {
  // Non-live summary
  console.log('5. LIVE STATUS');
  console.log('');
  info('Pass --live to query GitHub API for live project state.');
  info('Example: node scripts/github-project-sync-status.mjs --live --owner GHnol --project-number 1');
  console.log('');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
sep();
console.log('STATUS SUMMARY');
console.log('');
if (policyMissing > 0) {
  console.log(`  [NEEDS ATTENTION] ${policyMissing} policy doc(s) missing.`);
} else {
  ok('All policy docs present.');
}
if (localSyncMap) {
  console.log(`  Local sync map: present — ${Object.keys(syncedIssues).length} issue(s) tracked`);
} else {
  console.log('  Local sync map: not present (expected before first apply)');
}
if (!LIVE) {
  console.log('  Live GitHub status: not checked (pass --live to query API)');
}
console.log('');
console.log('  No external writes performed.');
sep();
