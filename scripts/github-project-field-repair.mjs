#!/usr/bin/env node
/**
 * scripts/github-project-field-repair.mjs
 * AI Project OS — Targeted field repair for GitHub ProjectV2 items.
 *
 * Reads source records + live project data to identify and fix:
 *   - External Sync Status not set to 'in-sync' on imported items
 *   - Status values that don't match the AI Project OS status mapping
 *
 * Dry-run by default. Pass --apply to execute mutations.
 *
 * Usage:
 *   node scripts/github-project-field-repair.mjs --owner GHnol --repo MessageVault --project-number 1 --input <source.json>
 *   node scripts/github-project-field-repair.mjs --apply --owner GHnol --repo MessageVault --project-number 1 --input <source.json>
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  probeAuth,
  findProject,
  getProjectFields,
  setFieldSingleSelect,
  parseSourceRecords,
  gql,
} from './lib/github-projects-client.mjs';

// ─── Argument parsing ─────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const flag   = name => args.includes(name);
const opt    = name => { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; };

const APPLY          = flag('--apply');
const OWNER          = opt('--owner')          || 'GHnol';
const REPO           = opt('--repo')           || 'MessageVault';
const PROJECT_NUMBER = parseInt(opt('--project-number') || '1', 10);
const INPUT_PATH     = opt('--input')          || 'docs/project-control/github-projects-source-records.json';

const applyOpts = { apply: APPLY };

// ─── AI Project OS status mapping ─────────────────────────────────────────────
// Maps source-record status values to Project Status option names.

const STATUS_MAP = {
  'Not Started': 'Backlog',
  'Backlog':     'Backlog',
  'Waiting':     'Waiting / Blocked',
  'Blocked':     'Waiting / Blocked',
  'Done':        'Done / Shipped',
  'In Progress': 'In Progress',
  'In Review':   'Review / QA',
  'Deferred':    'Deferred',
  'Approved':    'Ready',
  'Cancelled':   'Cancelled',
};

const TARGET_EXT_SYNC = 'in-sync';

// ─── Logging ──────────────────────────────────────────────────────────────────

const info  = msg => console.log(`[INFO]  ${msg}`);
const ok    = msg => console.log(`[OK]    ${msg}`);
const warn  = msg => console.warn(`[WARN]  ${msg}`);
const skip  = msg => console.log(`[SKIP]  ${msg}`);
const planL = msg => console.log(`[PLAN]  ${msg}`);
const done  = msg => console.log(`[DONE]  ${msg}`);
const abort = msg => { console.error(`\n[ABORT] ${msg}`); process.exit(1); };

// ─── Live project item query ───────────────────────────────────────────────────

function getProjectItemsWithFields(projectId) {
  const query = `query($pid: ID!) {
    node(id: $pid) {
      ... on ProjectV2 {
        items(first: 100) {
          nodes {
            id
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2Field { name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  optionId
                  field { ... on ProjectV2SingleSelectField { name } }
                }
              }
            }
            content { ... on Issue { number title } }
          }
        }
      }
    }
  }`;
  const r = gql(query, { pid: projectId });
  if (!r.ok) return r;
  return { ok: true, items: r.data?.node?.items?.nodes ?? [] };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`github-project-field-repair.mjs — ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log(`Owner: ${OWNER}   Repo: ${REPO}   Project: #${PROJECT_NUMBER}`);
if (!APPLY) console.log('\n  [DRY-RUN] No writes will occur. Pass --apply to execute.\n');

// Preflight
console.log('\n=== Preflight ===\n');

const authR = probeAuth();
if (!authR.ok) abort(`GitHub auth failed: ${authR.error}`);
ok(`GitHub auth OK — login: ${authR.login}`);

const absInput = resolve(INPUT_PATH);
if (!existsSync(absInput)) abort(`Input file not found: ${absInput}`);
ok(`Input file: ${absInput}`);

// Load source records
const rawStr = readFileSync(absInput, 'utf8');
let srResult;
try   { srResult = parseSourceRecords(rawStr); }
catch (e) { abort(`Source record parse error: ${e.message}`); }
if (!srResult.ok) abort(`Source record validation failed: ${srResult.error ?? (srResult.errors ?? []).join('; ')}`);
ok(`Loaded ${srResult.records.length} source records.`);

// Build intended-status index: osId → target Project Status option name
const intendedStatus = {};
for (const r of srResult.records) {
  const mapped = STATUS_MAP[r.status];
  if (!mapped) warn(`No STATUS_MAP entry for "${r.status}" on ${r.os_id} — Status repair will be skipped for this record`);
  intendedStatus[r.os_id] = mapped ?? null;
}

// Resolve project
console.log('\n=== Resolving project ===\n');
const projR = findProject(OWNER, null, PROJECT_NUMBER);
if (!projR.ok)    abort(`Project query failed: ${projR.error}`);
if (!projR.found) abort(`Project #${PROJECT_NUMBER} not found for owner ${OWNER}.`);
const project = projR.project;
ok(`Project: "${project.title}" (id: ${project.id})`);

// Read fields
console.log('\n=== Reading project fields ===\n');
const fieldsR = getProjectFields(project.id);
if (!fieldsR.ok) abort(`Cannot read project fields: ${fieldsR.error}`);

const fieldIndex = {};
for (const f of (fieldsR.fields ?? [])) {
  const entry = { id: f.id, options: {} };
  for (const o of (f.options ?? [])) entry.options[o.name] = o.id;
  fieldIndex[f.name] = entry;
}

const statusField   = fieldIndex['Status'];
const extSyncField  = fieldIndex['External Sync Status'];
if (!statusField)  abort('Status field not found in project.');
if (!extSyncField) abort('External Sync Status field not found in project.');

ok(`Status options: ${Object.keys(statusField.options).join(', ')}`);
ok(`External Sync Status options: ${Object.keys(extSyncField.options).join(', ')}`);

const inSyncOptionId = extSyncField.options[TARGET_EXT_SYNC];
if (!inSyncOptionId) abort(`"${TARGET_EXT_SYNC}" option not found in External Sync Status field.`);

// Read live items
console.log('\n=== Reading live project items ===\n');
const itemsR = getProjectItemsWithFields(project.id);
if (!itemsR.ok) abort(`Cannot read project items: ${itemsR.error}`);
ok(`Found ${itemsR.items.length} project items.`);

// Build repair plan
console.log('\n=== Repair plan ===\n');

const extSyncRepairs = [];
const statusRepairs  = [];
const alreadyCorrect = [];
const warnings       = [];

for (const item of itemsR.items) {
  const vals       = item.fieldValues?.nodes ?? [];
  const osId       = vals.find(v => v.field?.name === 'OS ID')?.text ?? null;
  const curStatus  = vals.find(v => v.field?.name === 'Status')?.name ?? null;
  const curExtSync = vals.find(v => v.field?.name === 'External Sync Status')?.name ?? null;
  const issueNum   = item.content?.number ?? '?';

  if (!osId) {
    warn(`Item ${item.id} (Issue #${issueNum}) has no OS ID — skipping`);
    warnings.push(`Item ${item.id} (Issue #${issueNum}): no OS ID`);
    continue;
  }

  // External Sync Status
  if (curExtSync === TARGET_EXT_SYNC) {
    skip(`${osId} (#${issueNum}): External Sync Status already "${TARGET_EXT_SYNC}"`);
    alreadyCorrect.push(`${osId}: External Sync Status`);
  } else {
    planL(`${osId} (#${issueNum}): External Sync Status ${curExtSync ?? '(none)'} → "${TARGET_EXT_SYNC}"`);
    extSyncRepairs.push({ itemId: item.id, osId, issueNum, from: curExtSync, to: TARGET_EXT_SYNC, optionId: inSyncOptionId });
  }

  // Status
  const intended = intendedStatus[osId];
  if (!intended) {
    warn(`${osId}: no STATUS_MAP entry — skipping Status`);
    warnings.push(`${osId}: Status repair skipped (no mapping)`);
    continue;
  }
  const targetStatusOptionId = statusField.options[intended];
  if (!targetStatusOptionId) {
    warn(`${osId}: Status option "${intended}" not in project — skipping`);
    warnings.push(`${osId}: Status option "${intended}" missing from project`);
    continue;
  }
  if (curStatus === intended) {
    skip(`${osId} (#${issueNum}): Status already "${intended}"`);
    alreadyCorrect.push(`${osId}: Status ("${intended}")`);
  } else {
    planL(`${osId} (#${issueNum}): Status "${curStatus ?? '(none)'}" → "${intended}"`);
    statusRepairs.push({ itemId: item.id, osId, issueNum, from: curStatus, to: intended, optionId: targetStatusOptionId });
  }
}

console.log(`\n  External Sync Status repairs planned: ${extSyncRepairs.length}`);
console.log(`  Status repairs planned:               ${statusRepairs.length}`);
console.log(`  Already correct (skipped):            ${alreadyCorrect.length}`);
if (warnings.length) console.log(`  Warnings:                             ${warnings.length}`);

if (!APPLY) {
  console.log('\n=== DRY-RUN COMPLETE ===');
  console.log('\n  No writes performed. Pass --apply to execute the repairs above.');
  process.exit(0);
}

// Apply
console.log('\n=== APPLY: Setting field values ===\n');
let successCount = 0;
let failCount    = 0;

for (const r of extSyncRepairs) {
  try {
    const res = setFieldSingleSelect(project.id, r.itemId, extSyncField.id, r.optionId, applyOpts);
    if (res.ok) { done(`${r.osId} (#${r.issueNum}): External Sync Status → "${TARGET_EXT_SYNC}"`); successCount++; }
    else        { warn(`${r.osId}: External Sync Status set failed: ${res.error}`); failCount++; }
  } catch (e)  { warn(`${r.osId}: External Sync Status exception: ${e.message}`); failCount++; }
}

for (const r of statusRepairs) {
  try {
    const res = setFieldSingleSelect(project.id, r.itemId, statusField.id, r.optionId, applyOpts);
    if (res.ok) { done(`${r.osId} (#${r.issueNum}): Status → "${r.to}"`); successCount++; }
    else        { warn(`${r.osId}: Status set failed: ${res.error}`); failCount++; }
  } catch (e)  { warn(`${r.osId}: Status exception: ${e.message}`); failCount++; }
}

console.log('\n=== APPLY COMPLETE ===\n');
console.log(`  Succeeded: ${successCount}`);
console.log(`  Failed:    ${failCount}`);
if (failCount > 0) process.exit(1);
