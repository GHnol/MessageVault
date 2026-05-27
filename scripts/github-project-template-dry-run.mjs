#!/usr/bin/env node
/**
 * github-project-template-dry-run.mjs
 * AI Project OS v1.5 — Read-only dry-run for GitHub Project template setup.
 *
 * Checks for a local template config, validates the example config, and shows
 * what template-copy mode would do. No external writes. No mutations.
 *
 * Exit 0 = dry-run complete. Exit 1 = critical preflight failure.
 *
 * Usage:
 *   node scripts/github-project-template-dry-run.mjs [--owner GHnol]
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const args = process.argv.slice(2);
function opt(name) { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }

const OWNER = opt('--owner') || 'GHnol';
const REPO  = opt('--repo') || 'MessageVault';

const EXAMPLE_CONFIG  = 'docs/project-control/github-projects-template-config.example.json';
const LOCAL_CONFIG    = 'docs/project-control/github-projects-template-config.local.json';
const TEMPLATE_STD    = 'docs/project-control/github-projects-template-standard.md';
const COPY_RUNBOOK    = 'docs/project-control/github-projects-template-copy-runbook.md';

function path(rel) { return join(ROOT, rel); }
function exists(rel) { return existsSync(path(rel)); }
function sep() { console.log('─'.repeat(60)); }
function ok(msg)   { console.log(`  [PASS] ${msg}`); }
function fail(msg) { console.log(`  [FAIL] ${msg}`); }
function warn(msg) { console.log(`  [WARN] ${msg}`); }
function info(msg) { console.log(`  [INFO] ${msg}`); }

const now = new Date().toISOString().slice(0, 10);
let exitCode = 0;

console.log('');
sep();
console.log('GITHUB PROJECT TEMPLATE — DRY RUN (AI Project OS v1.5)');
console.log(`Date:  ${now}`);
console.log(`Owner: ${OWNER}   Repo: ${REPO}`);
console.log('Mode:  read-only (no external writes)');
sep();
console.log('');

// ---------------------------------------------------------------------------
// 1. Required docs check
// ---------------------------------------------------------------------------
console.log('1. REQUIRED DOCS');
console.log('');

const requiredDocs = [
  TEMPLATE_STD,
  COPY_RUNBOOK,
  EXAMPLE_CONFIG,
  'docs/project-control/github-projects-setup-policy.md',
  'docs/project-control/external-sync-safety.md',
];

let missingDocs = 0;
for (const doc of requiredDocs) {
  if (exists(doc)) { ok(doc); }
  else { fail(`MISSING: ${doc}`); missingDocs++; }
}

if (missingDocs > 0) {
  console.log(`\n  ERROR: ${missingDocs} required doc(s) missing.`);
  exitCode = 1;
}
console.log('');

// ---------------------------------------------------------------------------
// 2. Template config detection
// ---------------------------------------------------------------------------
console.log('2. TEMPLATE CONFIG DETECTION');
console.log('');

let localConfig = null;
let hasRealTemplate = false;

if (exists(LOCAL_CONFIG)) {
  try {
    localConfig = JSON.parse(readFileSync(path(LOCAL_CONFIG), 'utf8'));
    const isPlaceholder = !localConfig.template_project_id ||
      localConfig.template_project_id === 'PVT_placeholder' ||
      localConfig.template_project_number === 0;
    if (isPlaceholder) {
      warn(`Local config found but contains placeholder IDs — template-copy not yet configured`);
      info('  Complete Gate 2 to populate real template IDs');
      info('  See: docs/project-control/github-projects-template-copy-runbook.md');
    } else {
      hasRealTemplate = true;
      ok(`Local template config found: ${LOCAL_CONFIG}`);
      ok(`Template project: "${localConfig.template_project_title}" (number: ${localConfig.template_project_number})`);
      ok(`Template owner: ${localConfig.template_owner}`);
      info(`  Path: ${localConfig.template_project_url || '(url not set)'}`);
    }
  } catch (e) {
    fail(`Local config parse error: ${e.message}`);
    exitCode = 1;
  }
} else {
  warn(`Local template config not found: ${LOCAL_CONFIG}`);
  info('  Gate 2 not yet complete for this repo.');
  info('  See: docs/project-control/github-projects-template-copy-runbook.md');
}

console.log('');
console.log(`  Setup mode: ${hasRealTemplate ? 'template-copy (preferred)' : 'create-from-scratch (fallback)'}`);
console.log('');

// ---------------------------------------------------------------------------
// 3. Example config validation
// ---------------------------------------------------------------------------
console.log('3. EXAMPLE CONFIG VALIDATION');
console.log('');

if (exists(EXAMPLE_CONFIG)) {
  try {
    const ex = JSON.parse(readFileSync(path(EXAMPLE_CONFIG), 'utf8'));
    const isPlaceholder = ex.template_project_id === 'PVT_placeholder' &&
      (ex.template_project_number === 0 || ex.template_project_number === '0');
    if (isPlaceholder) {
      ok('Example config uses placeholder IDs only (safe to commit)');
    } else {
      fail('Example config contains non-placeholder IDs — real IDs must never be committed');
      exitCode = 1;
    }

    const expectedStatuses = ['Backlog','Ready','In Progress','Review / QA','Waiting / Blocked','Done / Shipped','Deferred','Cancelled'];
    const configStatuses = ex.required_status_options || [];
    const missingStatuses = expectedStatuses.filter(s => !configStatuses.includes(s));
    const extraStatuses = configStatuses.filter(s => !expectedStatuses.includes(s));

    if (missingStatuses.length === 0) {
      ok('Status options match v1.5 canonical vocabulary (8 options)');
    } else {
      fail(`Status options missing v1.5 values: ${missingStatuses.join(', ')}`);
      exitCode = 1;
    }
    if (extraStatuses.length > 0) {
      warn(`Status options contain non-canonical values: ${extraStatuses.join(', ')}`);
    }

    const OLD_VOCAB = ['Not Started','In Review','Blocked','Waiting','Approved','Done'];
    const statusOptionsContent = JSON.stringify(ex.status_options || []);
    const oldFound = OLD_VOCAB.filter(v => statusOptionsContent.includes(`"${v}"`));
    if (oldFound.length === 0) {
      ok('No old vocabulary (v1.3/v1.4) found in status_options');
    } else {
      fail(`Old vocabulary found in status_options: ${oldFound.join(', ')}`);
      exitCode = 1;
    }

    const hasAllFields = (ex.required_fields || []).length >= 13;
    if (hasAllFields) {
      ok(`Required fields present: ${ex.required_fields.length}`);
    } else {
      warn(`Expected 13 required fields, found ${(ex.required_fields || []).length}`);
    }
    const hasAllViews = (ex.required_views || []).length >= 14;
    if (hasAllViews) {
      ok(`Required views present: ${ex.required_views.length}`);
    } else {
      warn(`Expected 14 required views, found ${(ex.required_views || []).length}`);
    }
  } catch (e) {
    fail(`Example config is not valid JSON: ${e.message}`);
    exitCode = 1;
  }
} else {
  fail(`Example config missing: ${EXAMPLE_CONFIG}`);
  exitCode = 1;
}
console.log('');

// ---------------------------------------------------------------------------
// 4. Gitignore check
// ---------------------------------------------------------------------------
console.log('4. GITIGNORE CHECK');
console.log('');

function checkGitignored(relPath) {
  try {
    const result = execFileSync('git', ['check-ignore', '-v', relPath], { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

const localConfigGitignored = checkGitignored(LOCAL_CONFIG);
if (localConfigGitignored) {
  ok(`${LOCAL_CONFIG} is gitignored`);
} else {
  fail(`${LOCAL_CONFIG} is NOT gitignored — add it to .gitignore before Gate 2`);
  exitCode = 1;
}

const exampleConfigGitignored = !checkGitignored(EXAMPLE_CONFIG);
if (exampleConfigGitignored) {
  ok(`${EXAMPLE_CONFIG} is committed (not gitignored) — correct for example files`);
} else {
  warn(`${EXAMPLE_CONFIG} appears to be gitignored — example files should be committed`);
}
console.log('');

// ---------------------------------------------------------------------------
// 5. gh CLI check
// ---------------------------------------------------------------------------
console.log('5. GH CLI CHECK');
console.log('');

try {
  const ghv = execFileSync('gh', ['--version'], { encoding: 'utf8', timeout: 10000 }).split('\n')[0].trim();
  ok(`gh CLI: ${ghv}`);
} catch (e) {
  warn(`gh not found: ${e.message}`);
  info('  Install gh CLI: https://cli.github.com/');
}
console.log('');

// ---------------------------------------------------------------------------
// 6. What would happen on apply
// ---------------------------------------------------------------------------
console.log('6. PLANNED APPLY BEHAVIOR');
console.log('');

if (hasRealTemplate) {
  console.log('  Mode: TEMPLATE-COPY (preferred)');
  console.log(`  Template: "${localConfig.template_project_title}"`);
  console.log(`  Template owner: ${localConfig.template_owner}`);
  console.log(`  Template number: ${localConfig.template_project_number}`);
  console.log('');
  console.log('  When --apply is passed to github-project-setup-apply.mjs:');
  console.log(`    1. Detect template config → auto-select --from-template`);
  console.log(`    2. Call copyProjectV2 (GraphQL mutation)`);
  console.log(`    3. Link copied project to ${OWNER}/${REPO}`);
  console.log(`    4. Write sync map with new project ID and field IDs`);
  console.log(`    5. Append sync log entry`);
} else {
  console.log('  Mode: CREATE-FROM-SCRATCH (fallback — no template configured)');
  console.log('');
  console.log('  When --apply is passed to github-project-setup-apply.mjs:');
  console.log(`    1. No template config detected → create-from-scratch path`);
  console.log(`    2. Create new GitHub Project: "KeepMees Project Control" (owner: ${OWNER})`);
  console.log(`    3. Link project to ${OWNER}/${REPO}`);
  console.log(`    4. Create 13 custom fields`);
  console.log(`    5. Write sync map`);
  console.log(`    6. Append sync log`);
  console.log('');
  console.log('  To enable template-copy path:');
  console.log('    1. Complete Gate 2 per github-projects-template-copy-runbook.md');
  console.log('    2. Populate github-projects-template-config.local.json with real IDs');
  console.log('    3. Re-run this dry-run to verify template mode is detected');
}
console.log('');

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
sep();
if (exitCode === 0) {
  console.log('DRY-RUN COMPLETE — template infrastructure verified');
} else {
  console.log('DRY-RUN COMPLETE — issues found, see [FAIL] items above');
}
console.log('');
console.log('  No external writes performed.');
console.log('  No GitHub Project was created or modified.');
console.log('  No credentials were read or logged.');
console.log('');
sep();

process.exit(exitCode);
