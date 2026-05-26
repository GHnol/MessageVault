#!/usr/bin/env node
/**
 * github-project-import-issues.mjs
 * AI Project OS v1.4 — Import source records as GitHub Issues into a ProjectV2.
 *
 * Dry-run mode (default): parse + validate records, check duplicates, print plan.
 * Apply mode (--apply):   create issues, add to project, set all fields, update sync map/log.
 *
 * Usage:
 *   node scripts/github-project-import-issues.mjs --input <source.json> --owner GHnol --repo MessageVault --project-number 1
 *   node scripts/github-project-import-issues.mjs --apply --input <source.json> --owner GHnol --repo MessageVault --project-number 1
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  probeAuth,
  probeProjectScope,
  checkGitignored,
  readSyncMap,
  writeSyncMap,
  mergeSyncMap,
  appendSyncLog,
  findProject,
  getProjectFields,
  searchIssueByOsId,
  getIssueNodeId,
  addProjectItem,
  setFieldText,
  setFieldSingleSelect,
  setFieldDate,
  createGhIssue,
  parseSourceRecords,
} from './lib/github-projects-client.mjs';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }

if (flag('--help') || flag('-h')) {
  console.log(`
github-project-import-issues.mjs — Import source records into a GitHub ProjectV2

Usage:
  node scripts/github-project-import-issues.mjs [options]

Options:
  --apply                    Execute writes (default: dry-run only)
  --input <path>             Path to source records JSON file (required)
  --owner <owner>            GitHub org or user (default: GHnol)
  --repo <repo>              GitHub repo name (default: MessageVault)
  --project-number <num>     GitHub Project number (required for apply)
  --sync-map <path>          Path to local sync map (default: docs/project-control/external-sync-map.local.json)
  --help                     Show this help

Dry-run (no --apply):
  Parses and validates source records, checks duplicates, prints create/skip plan.
  No GitHub writes. No sync map writes.

Apply mode (--apply):
  All dry-run checks first, then creates issues, adds to project, sets all fields.
  Updates sync map after each issue (incremental — safe to re-run on partial failure).
  Appends sync log entry at completion.
`);
  process.exit(0);
}

const APPLY = flag('--apply');
const INPUT_PATH = opt('--input');
const OWNER = opt('--owner') || 'GHnol';
const REPO = opt('--repo') || 'MessageVault';
const PROJECT_NUMBER_RAW = opt('--project-number');
const SYNC_MAP_PATH = opt('--sync-map') || 'docs/project-control/external-sync-map.local.json';

const applyOpts = { apply: APPLY };

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
const abort   = msg => { console.error(`\n[ABORT] ${msg}`); process.exit(1); };
const warn    = msg => console.warn(`[WARN]  ${msg}`);
const info    = msg => console.log(`[INFO]  ${msg}`);
const ok      = msg => console.log(`[OK]    ${msg}`);
const skip    = msg => console.log(`[SKIP]  ${msg}`);
const planMsg = msg => console.log(`[PLAN]  ${msg}`);
const done    = msg => console.log(`[DONE]  ${msg}`);

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------
function runPreflight() {
  console.log('\n=== Preflight ===\n');

  if (!INPUT_PATH) abort('--input <path> is required.');
  const absInput = resolve(INPUT_PATH);
  if (!existsSync(absInput)) abort(`Input file not found: ${absInput}`);
  ok(`Input file: ${absInput}`);

  let login;
  try {
    const authResult = probeAuth();
    if (!authResult.ok) abort(`GitHub auth failed: ${authResult.error}`);
    login = authResult.login;
    ok(`GitHub auth OK — login: ${login}`);
  } catch (e) {
    abort(`GitHub auth probe failed: ${e.message}`);
  }

  try {
    const scopeR = probeProjectScope();
    if (scopeR.ok) { ok('GitHub Projects read scope detected.'); }
    else { warn(`Project scope probe failed: ${scopeR.error}`); }
  } catch (e) {
    warn(`Project scope probe error: ${e.message}`);
  }

  const ignoreR = checkGitignored(SYNC_MAP_PATH, process.cwd());
  if (ignoreR.ignored) {
    ok(`Sync map is gitignored: ${SYNC_MAP_PATH}`);
  } else {
    warn(`Sync map is NOT gitignored: ${SYNC_MAP_PATH}`);
    if (APPLY) abort('Sync map must be gitignored before running --apply.');
  }

  return { login };
}

// ---------------------------------------------------------------------------
// Load and validate source records
// ---------------------------------------------------------------------------
function loadSourceRecords(absInput) {
  console.log('\n=== Parsing source records ===\n');
  const rawStr = readFileSync(absInput, 'utf8');
  let result;
  try {
    result = parseSourceRecords(rawStr);
  } catch (e) {
    abort(`Source record validation error: ${e.message}`);
  }
  if (!result.ok) {
    const errMsg = result.error ?? (result.errors ?? []).join('; ');
    abort(`Source record validation failed: ${errMsg}`);
  }
  ok(`Loaded ${result.records.length} valid source records.`);
  return result.records;
}

// ---------------------------------------------------------------------------
// Resolve project (apply mode only)
// ---------------------------------------------------------------------------
function resolveProject(owner, projectNumber) {
  console.log('\n=== Resolving project ===\n');
  const r = findProject(owner, null, projectNumber);
  if (!r.ok) abort(`Project query failed: ${r.error}`);
  if (!r.found) abort(`Project #${projectNumber} not found for owner ${owner}.`);
  ok(`Project: "${r.project.title}" (id: ${r.project.id})`);
  return r.project;
}

// ---------------------------------------------------------------------------
// Build field index: { fieldName -> { id, dataType, options: { name -> id } } }
// ---------------------------------------------------------------------------
function buildFieldIndex(projectId) {
  const r = getProjectFields(projectId);
  if (!r.ok) throw new Error(`Cannot read project fields: ${r.error}`);
  const index = {};
  for (const f of (r.fields ?? [])) {
    const entry = { id: f.id, dataType: f.dataType, options: {} };
    if (f.options) {
      for (const opt of f.options) entry.options[opt.name] = opt.id;
    }
    index[f.name] = entry;
  }
  return index;
}

// ---------------------------------------------------------------------------
// Duplicate detection (three layers)
// ---------------------------------------------------------------------------
function detectDuplicates(records, owner, repo, existingSyncMap) {
  console.log('\n=== Duplicate detection ===\n');

  const syncedIssues = existingSyncMap?.github_projects?.issues || {};
  const localSynced = new Set(Object.keys(syncedIssues));

  const results = [];

  for (const record of records) {
    const osId = record.os_id;

    // Layer 1: local sync map
    if (localSynced.has(osId)) {
      skip(`${osId} — in local sync map (Issue #${syncedIssues[osId]?.issue_number})`);
      results.push({ record, action: 'skip', reason: 'local-sync-map' });
      continue;
    }

    // Layer 2: GitHub search for OS ID marker in issue body
    let found = false;
    let externalIssue = null;
    try {
      const searchR = searchIssueByOsId(owner, repo, osId);
      if (searchR.found) {
        found = true;
        externalIssue = searchR.issue;
      }
    } catch (e) {
      warn(`External search for ${osId} failed (treating as new): ${e.message}`);
    }

    if (found && externalIssue) {
      skip(`${osId} — found external Issue #${externalIssue.number}: "${externalIssue.title}"`);
      results.push({
        record, action: 'skip', reason: 'external-search',
        existingIssueNumber: externalIssue.number,
        existingNodeId: externalIssue.node_id,
      });
      continue;
    }

    planMsg(`${osId} — "${record.title}" → will create`);
    results.push({ record, action: 'create' });
  }

  const toCreate = results.filter(r => r.action === 'create').length;
  const toSkip   = results.filter(r => r.action === 'skip').length;
  console.log(`\n  To create: ${toCreate}   To skip: ${toSkip}`);

  return results;
}

// ---------------------------------------------------------------------------
// Field assignment map
// ---------------------------------------------------------------------------
const FIELD_MAP = [
  { fieldName: 'OS ID',                key: 'os_id',             type: 'TEXT' },
  { fieldName: 'Package',              key: 'package',           type: 'TEXT' },
  { fieldName: 'Phase',                key: 'phase',             type: 'TEXT' },
  { fieldName: 'Lane',                 key: 'lane',              type: 'SINGLE_SELECT' },
  { fieldName: 'Source File',          key: 'source_file',       type: 'TEXT' },
  { fieldName: 'Owner Role',           key: 'owner_role',        type: 'SINGLE_SELECT' },
  { fieldName: 'Risk Level',           key: 'risk_level',        type: 'SINGLE_SELECT' },
  { fieldName: 'Decision Needed',      key: 'decision_needed',   type: 'TEXT' },
  { fieldName: 'Calendar Relevant',    key: 'calendar_relevant', type: 'TEXT' },
  { fieldName: 'TickTick Relevant',    key: 'ticktick_relevant', type: 'TEXT' },
  { fieldName: 'Success Criteria',     key: 'success_criteria',  type: 'TEXT' },
  { fieldName: 'Last Repo Sync',       key: '_today',            type: 'DATE' },
  { fieldName: 'External Sync Status', key: '_sync_status',      type: 'SINGLE_SELECT' },
];

// ---------------------------------------------------------------------------
// Apply a single record
// ---------------------------------------------------------------------------
function applyOneRecord(record, project, fieldIndex, syncMapUpdates, owner, repo) {
  const osId = record.os_id;
  info(`Creating issue for ${osId}: "${record.title}" ...`);

  // Create GitHub Issue
  let issueNumber;
  try {
    const created = createGhIssue(
      owner, repo,
      record.title,
      record.body,
      record.labels,
      record.milestone || null,
      applyOpts
    );
    if (!created.ok) { warn(`  createGhIssue failed: ${created.error}`); return null; }
    issueNumber = created.number;
    info(`  Created Issue #${issueNumber}`);
  } catch (e) {
    warn(`  Failed to create issue for ${osId}: ${e.message}`);
    return null;
  }

  // Get node ID
  let issueNodeId;
  try {
    const nodeR = getIssueNodeId(owner, repo, issueNumber);
    if (!nodeR.ok) { warn(`  Could not get node ID for #${issueNumber}: ${nodeR.error}`); return { issueNumber, issueNodeId: null, itemId: null }; }
    issueNodeId = nodeR.nodeId;
    info(`  Node ID: ${issueNodeId}`);
  } catch (e) {
    warn(`  getIssueNodeId failed: ${e.message}`);
    return { issueNumber, issueNodeId: null, itemId: null };
  }

  // Add to project
  let itemId;
  try {
    const itemR = addProjectItem(project.id, issueNodeId, applyOpts);
    if (!itemR.ok) { warn(`  Failed to add Issue #${issueNumber} to project: ${itemR.error}`); return { issueNumber, issueNodeId, itemId: null }; }
    itemId = itemR.itemId;
    info(`  Project item: ${itemId}`);
  } catch (e) {
    warn(`  addProjectItem failed: ${e.message}`);
    return { issueNumber, issueNodeId, itemId: null };
  }

  // Set custom fields
  const today = new Date().toISOString().slice(0, 10);

  for (const { fieldName, key, type } of FIELD_MAP) {
    const fieldEntry = fieldIndex[fieldName];
    if (!fieldEntry) { warn(`  Field "${fieldName}" not found in project`); continue; }

    let value;
    if (key === '_today')            value = today;
    else if (key === '_sync_status') value = 'in-sync';
    else value = record[key];

    if (!value) continue;

    try {
      if (type === 'TEXT') {
        setFieldText(project.id, itemId, fieldEntry.id, String(value), applyOpts);
        info(`  Set ${fieldName} = "${value}"`);
      } else if (type === 'SINGLE_SELECT') {
        const optionId = fieldEntry.options[value];
        if (!optionId) { warn(`  Option "${value}" not found in "${fieldName}"`); continue; }
        setFieldSingleSelect(project.id, itemId, fieldEntry.id, optionId, applyOpts);
        info(`  Set ${fieldName} = "${value}"`);
      } else if (type === 'DATE') {
        setFieldDate(project.id, itemId, fieldEntry.id, value, applyOpts);
        info(`  Set ${fieldName} = "${value}"`);
      }
    } catch (e) {
      warn(`  Failed to set "${fieldName}": ${e.message}`);
    }
  }

  // Set built-in Status field
  if (record.status) {
    const statusField = fieldIndex['Status'];
    if (statusField) {
      const optionId = statusField.options[record.status];
      if (optionId) {
        try {
          setFieldSingleSelect(project.id, itemId, statusField.id, optionId, applyOpts);
          info(`  Set Status = "${record.status}"`);
        } catch (e) { warn(`  Failed to set Status: ${e.message}`); }
      } else {
        warn(`  Status option "${record.status}" not in project — configure manually in GitHub Projects UI`);
      }
    }
  }

  done(`${osId} — Issue #${issueNumber} created and configured.`);

  syncMapUpdates[osId] = {
    issue_number: issueNumber,
    issue_node_id: issueNodeId,
    project_item_id: itemId,
    synced_at: new Date().toISOString(),
    title: record.title,
  };

  return { issueNumber, issueNodeId, itemId };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const mode = APPLY ? 'APPLY' : 'DRY-RUN';
  console.log(`\ngithub-project-import-issues.mjs — ${mode}`);
  console.log(`Owner: ${OWNER}   Repo: ${REPO}   Project: #${PROJECT_NUMBER_RAW || '(not set)'}`);
  console.log(`Input: ${INPUT_PATH || '(not set)'}   Sync map: ${SYNC_MAP_PATH}`);
  if (!APPLY) console.log('\n  [DRY-RUN] No writes will occur. Pass --apply to execute.\n');

  runPreflight();
  const absInput = resolve(INPUT_PATH);
  const records = loadSourceRecords(absInput);

  // Load existing sync map
  const absSyncMap = resolve(SYNC_MAP_PATH);
  let existingSyncMap = {};
  if (existsSync(absSyncMap)) {
    try {
      const smR = readSyncMap(absSyncMap);
      existingSyncMap = smR.data ?? {};
      ok(`Loaded sync map: ${absSyncMap}`);
    } catch (e) { warn(`Could not read sync map (starting fresh): ${e.message}`); }
  } else {
    info(`No sync map at ${absSyncMap} — starting fresh.`);
  }

  // Duplicate detection (works in both modes, uses local map + REST search)
  const planResults = detectDuplicates(records, OWNER, REPO, existingSyncMap);
  const toCreate = planResults.filter(r => r.action === 'create');
  const toSkip   = planResults.filter(r => r.action === 'skip');

  if (!APPLY) {
    console.log('\n=== DRY-RUN COMPLETE ===\n');
    console.log(`  Would create: ${toCreate.length}`);
    console.log(`  Would skip:   ${toSkip.length} (already synced or found externally)`);
    if (toCreate.length > 0) {
      console.log('\n  Issues to create:');
      for (const r of toCreate) console.log(`    - [${r.record.os_id}] ${r.record.title}`);
    }
    console.log('\n  Pass --apply to execute.\n');
    process.exit(0);
  }

  // --- APPLY: resolve project and fields (needs read:project scope) ---
  if (!PROJECT_NUMBER_RAW) abort('--project-number <num> is required for --apply.');
  const projectNumber = parseInt(PROJECT_NUMBER_RAW, 10);
  if (isNaN(projectNumber) || projectNumber < 1) abort(`Invalid --project-number: ${PROJECT_NUMBER_RAW}`);

  const project = resolveProject(OWNER, projectNumber);

  console.log('\n=== Reading project fields ===\n');
  let fieldIndex;
  try {
    fieldIndex = buildFieldIndex(project.id);
    ok(`Found ${Object.keys(fieldIndex).length} fields: ${Object.keys(fieldIndex).join(', ')}`);
  } catch (e) {
    abort(`Failed to read project fields: ${e.message}`);
  }

  // Create issues
  console.log('\n=== APPLY: Creating issues ===\n');

  if (toCreate.length === 0) { info('Nothing to create — all records already synced.'); }

  const syncMapUpdates = {};
  let successCount = 0;
  let failCount = 0;

  for (const item of toCreate) {
    try {
      const result = applyOneRecord(item.record, project, fieldIndex, syncMapUpdates, OWNER, REPO);
      if (result && result.issueNumber) {
        successCount++;
        // Write sync map incrementally after each success
        const merged = mergeSyncMap(existingSyncMap, { github_projects: { issues: syncMapUpdates } });
        const writeR = writeSyncMap(absSyncMap, merged, applyOpts);
        if (!writeR.ok) warn(`Sync map write failed: ${writeR.error}`);
      } else {
        failCount++;
      }
    } catch (e) {
      warn(`Unexpected error for ${item.record.os_id}: ${e.message}`);
      failCount++;
    }
  }

  // Append sync log
  const logPath = resolve('docs/project-control/github-projects-sync-log.md');
  if (existsSync(logPath)) {
    const createdIds = Object.keys(syncMapUpdates);
    const entry = [
      `### Import — ${new Date().toISOString().slice(0, 10)}`,
      ``,
      `- **Script:** github-project-import-issues.mjs`,
      `- **Owner/Repo:** ${OWNER}/${REPO}`,
      `- **Project:** #${projectNumber} "${project.title}"`,
      `- **Input:** ${INPUT_PATH}`,
      `- **Records processed:** ${toCreate.length}`,
      `- **Created:** ${successCount}`,
      `- **Skipped:** ${toSkip.length}`,
      `- **Failed:** ${failCount}`,
      createdIds.length > 0 ? `- **OS IDs created:** ${createdIds.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const logR = appendSyncLog(logPath, entry, applyOpts);
    if (!logR.ok) warn(`Could not update sync log: ${logR.error}`);
    else ok('Sync log updated.');
  } else {
    warn(`Sync log not found at ${logPath} — skipping.`);
  }

  console.log('\n=== APPLY COMPLETE ===\n');
  console.log(`  Created: ${successCount}`);
  console.log(`  Skipped: ${toSkip.length}`);
  console.log(`  Failed:  ${failCount}`);
  console.log(`  Sync map: ${absSyncMap}`);

  if (failCount > 0) {
    console.log('\n  [WARN] Some records failed. Re-run with --apply to retry (sync map prevents duplicates).\n');
    process.exit(1);
  }
  console.log('\n  All records processed successfully.\n');
}

main().catch(e => { console.error(`\n[FATAL] ${e.message}`); process.exit(1); });
