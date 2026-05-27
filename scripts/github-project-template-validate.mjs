#!/usr/bin/env node
/**
 * github-project-template-validate.mjs
 * AI Project OS v1.5 — Validate a GitHub Project template config file against
 * the canonical AI Project OS specification.
 *
 * Validates structure, vocabulary, and optionally probes live GitHub state
 * (read-only) when --live is passed.
 *
 * No external writes. No mutations.
 * Exit 0 = config valid. Exit 1 = validation errors found.
 *
 * Usage:
 *   node scripts/github-project-template-validate.mjs [options]
 *
 * Options:
 *   --config <path>   Config file to validate (default: example config)
 *   --live            Also probe GitHub to confirm template project exists (read-only)
 *   --owner <owner>   Override owner for live check (default: from config)
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const args = process.argv.slice(2);
function opt(name) { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }
function flag(name) { return args.includes(name); }

const LIVE = flag('--live');
const CONFIG_PATH = opt('--config') ||
  'docs/project-control/github-projects-template-config.example.json';

function path(rel) { return join(ROOT, rel); }
function sep() { console.log('─'.repeat(60)); }
function ok(msg)   { console.log(`  [PASS] ${msg}`); }
function fail(msg) { console.log(`  [FAIL] ${msg}`); }
function warn(msg) { console.log(`  [WARN] ${msg}`); }
function info(msg) { console.log(`  [INFO] ${msg}`); }

const CANONICAL_STATUSES = [
  'Backlog','Ready','In Progress','Review / QA',
  'Waiting / Blocked','Done / Shipped','Deferred','Cancelled',
];

const CANONICAL_FIELDS = [
  'OS ID','Package','Phase','Lane','Source File','Last Repo Sync',
  'External Sync Status','Risk Level','Decision Needed','Calendar Relevant',
  'TickTick Relevant','Owner Role','Success Criteria',
];

const CANONICAL_VIEWS = [
  'Board','Table','Current Sprint','Backlog','Review / QA',
  'Waiting / Blocked','Done','High Risks','Calendar Relevant',
  'TickTick Relevant','By Package','By Phase','By Lane','Decision Needed',
];

const CANONICAL_OWNER_ROLES = [
  'Founder','Coordinator','Claude','Codex','Development',
  'QA','Product','Vendor','Design',
];

const CANONICAL_EXT_SYNC_STATUS = ['in-sync','drift','unknown','not-tracked'];

const OLD_VOCAB = ['Not Started','In Review','Blocked','Waiting','Approved',
  'Done','not-synced','ready-for-sync','sync-error'];

let failures = 0;
let warnings = 0;

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT TEMPLATE — CONFIG VALIDATION (AI Project OS v1.5)');
console.log(`Date:   ${now}`);
console.log(`Config: ${CONFIG_PATH}`);
console.log(`Mode:   ${LIVE ? 'local + live GitHub probe (read-only)' : 'local only'}`);
sep();
console.log('');

// ---------------------------------------------------------------------------
// 1. File existence
// ---------------------------------------------------------------------------
console.log('1. CONFIG FILE');
console.log('');

const configFull = path(CONFIG_PATH);
if (!existsSync(configFull)) {
  fail(`Config file not found: ${CONFIG_PATH}`);
  failures++;
  console.log('');
  sep();
  console.log(`Summary: 0 pass, ${warnings} warn, ${failures} fail`);
  process.exit(1);
}
ok(`Config file exists: ${CONFIG_PATH}`);

let config;
try {
  config = JSON.parse(readFileSync(configFull, 'utf8'));
  ok('Config is valid JSON');
} catch (e) {
  fail(`Config is not valid JSON: ${e.message}`);
  failures++;
  console.log('');
  sep();
  console.log(`Summary: 1 pass, ${warnings} warn, ${failures} fail`);
  process.exit(1);
}
console.log('');

// ---------------------------------------------------------------------------
// 2. Required top-level fields
// ---------------------------------------------------------------------------
console.log('2. REQUIRED FIELDS');
console.log('');

const requiredKeys = ['template_provider','template_owner','template_project_number',
  'template_project_id','template_project_title','fallback_mode'];

for (const key of requiredKeys) {
  if (config[key] !== undefined && config[key] !== null && config[key] !== '') {
    ok(`${key}: ${JSON.stringify(config[key])}`);
  } else {
    fail(`Missing or empty: ${key}`);
    failures++;
  }
}

if (config.template_provider && config.template_provider !== 'github-projects') {
  fail(`template_provider must be "github-projects", got "${config.template_provider}"`);
  failures++;
}

if (config.fallback_mode && config.fallback_mode !== 'create-from-scratch') {
  warn(`Non-standard fallback_mode: "${config.fallback_mode}" (expected "create-from-scratch")`);
  warnings++;
}
console.log('');

// ---------------------------------------------------------------------------
// 3. Placeholder safety
// ---------------------------------------------------------------------------
console.log('3. PLACEHOLDER SAFETY');
console.log('');

const isExampleFile = CONFIG_PATH.includes('.example.');
const hasPlaceholder = config.template_project_id === 'PVT_placeholder' ||
  config.template_project_number === 0;

if (isExampleFile) {
  if (hasPlaceholder) {
    ok('Example config uses placeholder IDs only (safe to commit)');
  } else {
    fail('Example config must use placeholder IDs — never commit real IDs');
    failures++;
  }
} else {
  if (hasPlaceholder) {
    warn('Local config contains placeholder IDs — Gate 2 not yet complete');
    warnings++;
    info('  See: docs/project-control/github-projects-template-copy-runbook.md');
  } else {
    ok('Local config has real template project ID');
    ok(`Template ID: ${config.template_project_id}`);
    ok(`Template number: ${config.template_project_number}`);
  }
}
console.log('');

// ---------------------------------------------------------------------------
// 4. Old vocabulary check
// ---------------------------------------------------------------------------
console.log('4. VOCABULARY CHECK');
console.log('');

const statusOptsStr = JSON.stringify(config.status_options || []);
const extSyncStr = JSON.stringify(config.external_sync_status_options || []);
const vocabCheckStr = statusOptsStr + extSyncStr;
const oldFound = OLD_VOCAB.filter(v => vocabCheckStr.includes(`"${v}"`));

if (oldFound.length === 0) {
  ok('No old vocabulary (v1.3/v1.4) found in status/sync fields');
} else {
  fail(`Old vocabulary found in status/sync fields: ${oldFound.join(', ')}`);
  fail('Replace with canonical v1.5 values (see github-projects-template-standard.md)');
  failures++;
}
console.log('');

// ---------------------------------------------------------------------------
// 5. Status options
// ---------------------------------------------------------------------------
console.log('5. STATUS OPTIONS');
console.log('');

const configStatuses = config.required_status_options || [];
if (configStatuses.length === 0) {
  warn('No required_status_options defined in config');
  warnings++;
} else {
  const missing = CANONICAL_STATUSES.filter(s => !configStatuses.includes(s));
  const extra   = configStatuses.filter(s => !CANONICAL_STATUSES.includes(s));
  if (missing.length === 0) {
    ok(`All ${CANONICAL_STATUSES.length} canonical status options present`);
  } else {
    fail(`Missing canonical status options: ${missing.join(', ')}`);
    failures++;
  }
  if (extra.length > 0) {
    warn(`Non-canonical status options: ${extra.join(', ')}`);
    warnings++;
  }
}
console.log('');

// ---------------------------------------------------------------------------
// 6. Required fields
// ---------------------------------------------------------------------------
console.log('6. REQUIRED FIELDS');
console.log('');

const configFields = config.required_fields || [];
if (configFields.length === 0) {
  warn('No required_fields defined in config');
  warnings++;
} else {
  const missing = CANONICAL_FIELDS.filter(f => !configFields.includes(f));
  if (missing.length === 0) {
    ok(`All ${CANONICAL_FIELDS.length} canonical fields present`);
  } else {
    fail(`Missing canonical fields: ${missing.join(', ')}`);
    failures++;
  }
}
console.log('');

// ---------------------------------------------------------------------------
// 7. Required views
// ---------------------------------------------------------------------------
console.log('7. REQUIRED VIEWS');
console.log('');

const configViews = config.required_views || [];
if (configViews.length === 0) {
  warn('No required_views defined in config');
  warnings++;
} else {
  const missing = CANONICAL_VIEWS.filter(v => !configViews.includes(v));
  if (missing.length === 0) {
    ok(`All ${CANONICAL_VIEWS.length} canonical views present`);
  } else {
    fail(`Missing canonical views: ${missing.join(', ')}`);
    failures++;
  }
}
console.log('');

// ---------------------------------------------------------------------------
// 8. Owner Role options
// ---------------------------------------------------------------------------
console.log('8. OWNER ROLE OPTIONS');
console.log('');

const configOwnerRoles = config.required_owner_role_options || [];
if (configOwnerRoles.length === 0) {
  warn('No required_owner_role_options defined in config');
  warnings++;
} else {
  const missing = CANONICAL_OWNER_ROLES.filter(r => !configOwnerRoles.includes(r));
  if (missing.length === 0) {
    ok(`All ${CANONICAL_OWNER_ROLES.length} canonical owner role options present`);
  } else {
    fail(`Missing canonical owner role options: ${missing.join(', ')}`);
    failures++;
  }
}
console.log('');

// ---------------------------------------------------------------------------
// 9. External Sync Status options
// ---------------------------------------------------------------------------
console.log('9. EXTERNAL SYNC STATUS OPTIONS');
console.log('');

const configExtSync = config.required_external_sync_status_options || [];
if (configExtSync.length === 0) {
  warn('No required_external_sync_status_options defined in config');
  warnings++;
} else {
  const missing = CANONICAL_EXT_SYNC_STATUS.filter(s => !configExtSync.includes(s));
  if (missing.length === 0) {
    ok(`All ${CANONICAL_EXT_SYNC_STATUS.length} canonical external sync status options present`);
  } else {
    fail(`Missing canonical external sync status options: ${missing.join(', ')}`);
    failures++;
  }
}
console.log('');

// ---------------------------------------------------------------------------
// 10. Live probe (optional, read-only)
// ---------------------------------------------------------------------------
if (LIVE) {
  console.log('10. LIVE GITHUB PROBE (read-only)');
  console.log('');

  if (isExampleFile || hasPlaceholder) {
    warn('Skipping live probe — config has placeholder IDs');
    warnings++;
  } else {
    try {
      const { probeAuth, findProject } = await import('./lib/github-projects-client.mjs');
      const authR = probeAuth();
      if (!authR.ok) {
        fail(`GitHub auth failed: ${authR.error}`);
        failures++;
      } else {
        ok(`Authenticated as: ${authR.login}`);
        const findR = findProject(
          config.template_owner,
          config.template_project_title,
          config.template_project_number
        );
        if (findR.ok && findR.found) {
          ok(`Template project found: "${findR.project.title}" #${findR.project.number}`);
          if (findR.project.id === config.template_project_id) {
            ok('Template project ID matches config');
          } else {
            fail(`Template project ID mismatch: config has ${config.template_project_id}, GitHub has ${findR.project.id}`);
            failures++;
          }
        } else {
          fail(`Template project not found on GitHub: "${config.template_project_title}"`);
          failures++;
        }
      }
    } catch (e) {
      fail(`Live probe error: ${e.message}`);
      failures++;
    }
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
sep();
const total = failures + warnings;
console.log(`Summary: ${failures} fail, ${warnings} warn`);
if (failures === 0 && warnings === 0) {
  console.log('\nVERDICT: CONFIG VALID — all canonical spec checks pass.\n');
} else if (failures === 0) {
  console.log(`\nVERDICT: CONFIG ACCEPTABLE — 0 failures, ${warnings} warning(s).\n`);
} else {
  console.log(`\nVERDICT: CONFIG INVALID — ${failures} failure(s) must be fixed.\n`);
}
sep();

process.exit(failures > 0 ? 1 : 0);
