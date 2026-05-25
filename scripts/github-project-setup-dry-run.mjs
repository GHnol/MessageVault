#!/usr/bin/env node
/**
 * github-project-setup-dry-run.mjs
 * AI Project OS v1.4 — Read-only pre-flight for GitHub Project setup.
 *
 * Reads repo docs, probes GitHub auth and project scope, checks for an existing
 * project, and prints the full planned setup operation list.
 *
 * No external writes. No mutations. No token exposure.
 * Exit 0 = dry-run complete. Exit 1 = critical preflight failure.
 *
 * Usage:
 *   node scripts/github-project-setup-dry-run.mjs [--owner GHnol] [--project-title "..."] [--project-number N]
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import {
  probeAuth,
  probeProjectScope,
  checkGitignored,
  findProject,
  REQUIRED_FIELDS,
  REQUIRED_STATUSES,
  REQUIRED_VIEWS,
} from './lib/github-projects-client.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; }

const OWNER = opt('--owner') || 'GHnol';
const REPO  = opt('--repo') || 'MessageVault';
const PROJECT_TITLE = opt('--project-title') || 'KeepMees Project Control';
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
let exitCode = 0;

console.log('');
sep();
console.log('GITHUB PROJECT SETUP — DRY RUN');
console.log(`Date:    ${now}`);
console.log(`Owner:   ${OWNER}   Repo: ${REPO}`);
console.log(`Project: "${PROJECT_TITLE}"`);
console.log('Mode:    read-only (no external writes)');
sep();
console.log('');

// ---------------------------------------------------------------------------
// 1. Required docs check
// ---------------------------------------------------------------------------
console.log('1. REQUIRED DOCS');
console.log('');

const requiredDocs = [
  'docs/project-control/github-projects-setup-policy.md',
  'docs/project-control/github-projects-source-schema.md',
  'docs/project-control/github-projects-import-runbook.md',
  'docs/project-control/github-projects-field-map.example.json',
  'docs/project-control/github-projects-sync-log.md',
  'docs/project-control/external-sync-safety.md',
];

let missingDocs = 0;
for (const doc of requiredDocs) {
  if (exists(doc)) { ok(doc); }
  else { fail(`MISSING: ${doc}`); missingDocs++; }
}

if (missingDocs > 0) {
  console.log('');
  console.log(`  ERROR: ${missingDocs} required doc(s) missing. Resolve before apply.`);
  exitCode = 1;
}
console.log('');

// ---------------------------------------------------------------------------
// 2. gh CLI version check
// ---------------------------------------------------------------------------
console.log('2. GH CLI VERSION');
console.log('');

let ghVersion = null;
try {
  ghVersion = execFileSync('gh', ['--version'], { encoding: 'utf8', timeout: 10000 }).split('\n')[0].trim();
  ok(`gh version: ${ghVersion}`);

  // Parse semver to check for project subcommand support (added in v2.28.0)
  const match = ghVersion.match(/(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    const [, major, minor] = match.map(Number);
    const hasProjectCmd = major > 2 || (major === 2 && minor >= 28);
    if (hasProjectCmd) {
      ok('gh project subcommand available (v2.28.0+)');
    } else {
      warn(`gh version ${major}.${minor}.x < 2.28.0 — "gh project" subcommand unavailable`);
      info('  Apply script uses GraphQL fallback path automatically. No action needed.');
    }
  }
} catch (e) {
  fail(`gh not found or not executable: ${e.message}`);
  info('  Install gh CLI: https://cli.github.com/');
  exitCode = 1;
}
console.log('');

// ---------------------------------------------------------------------------
// 3. GitHub auth probe
// ---------------------------------------------------------------------------
console.log('3. GITHUB AUTH');
console.log('');

let authLogin = null;
try {
  const authResult = probeAuth();
  authLogin = authResult.login;
  ok(`Authenticated as: ${authLogin}`);
} catch (e) {
  fail(`Auth probe failed: ${e.message}`);
  info('  Run: gh auth login');
  exitCode = 1;
}
console.log('');

// ---------------------------------------------------------------------------
// 4. GitHub Projects scope probe
// ---------------------------------------------------------------------------
console.log('4. GITHUB PROJECTS SCOPE');
console.log('');

if (authLogin) {
  try {
    probeProjectScope();
    ok('project:read scope available');
  } catch (e) {
    warn(`Project scope probe inconclusive: ${e.message}`);
    info('  If project creation fails, run: gh auth refresh -s project');
  }
} else {
  info('  Skipped (no auth)');
}
console.log('');

// ---------------------------------------------------------------------------
// 5. Sync map gitignore check
// ---------------------------------------------------------------------------
console.log('5. SYNC MAP GITIGNORE');
console.log('');

try {
  const ignoreR = checkGitignored(SYNC_MAP_PATH, ROOT);
  if (ignoreR.ignored) { ok(`${SYNC_MAP_PATH} is gitignored`); }
  else { fail(`${SYNC_MAP_PATH} is NOT gitignored — add it to .gitignore before apply`); exitCode = 1; }
} catch (e) {
  warn(`Could not verify gitignore status: ${e.message}`);
}
console.log('');

// ---------------------------------------------------------------------------
// 6. Existing project detection (read-only)
// ---------------------------------------------------------------------------
console.log('6. EXISTING PROJECT DETECTION');
console.log('');

let existingProject = null;
if (authLogin) {
  try {
    const projectNumber = PROJECT_NUMBER_RAW ? parseInt(PROJECT_NUMBER_RAW, 10) : null;
    const findR = findProject(OWNER, PROJECT_TITLE, projectNumber);
    if (findR.ok && findR.found) {
      existingProject = findR.project;
      ok(`Existing project found: "${existingProject.title}" #${existingProject.number} (id: ${existingProject.id})`);
      info('  Apply will reuse this project (no duplicate created).');
    } else if (!findR.ok) {
      warn(`Project query failed: ${findR.error}`);
      info('  Apply will attempt to create project. If it already exists, duplicate prevention will detect it.');
    } else {
      info(`No existing project found matching "${PROJECT_TITLE}" — apply will create it.`);
    }
  } catch (e) {
    warn(`Project detection failed: ${e.message}`);
    info('  Apply will attempt to create project. If it already exists, duplicate prevention will detect it.');
  }
} else {
  info('  Skipped (no auth)');
}
console.log('');

// ---------------------------------------------------------------------------
// 7. Planned operations
// ---------------------------------------------------------------------------
console.log('7. PLANNED OPERATIONS');
console.log('');

let opNum = 1;
const planOp = msg => console.log(`  ${opNum++}. ${msg}`);

if (!existingProject) {
  planOp(`Create GitHub Project: "${PROJECT_TITLE}" (owner: ${OWNER})`);
  planOp(`Link project to repository: ${OWNER}/${REPO}`);
} else {
  planOp(`Reuse existing project: "${existingProject.title}" #${existingProject.number}`);
}

for (const field of REQUIRED_FIELDS) {
  planOp(`Create field: "${field.name}" [${field.dataType}]`);
}

planOp('Write sync map with project ID and all field IDs');
planOp('Append sync log entry');
console.log('');

// ---------------------------------------------------------------------------
// 8. Planned fields
// ---------------------------------------------------------------------------
console.log('8. PLANNED CUSTOM FIELDS (13)');
console.log('');
for (const f of REQUIRED_FIELDS) {
  const optNote = f.options ? ` — options: ${f.options.slice(0, 3).join(', ')}${f.options.length > 3 ? '...' : ''}` : '';
  console.log(`  • ${f.name.padEnd(28)} [${f.dataType}]${optNote}`);
}
console.log('');

// ---------------------------------------------------------------------------
// 9. Required statuses
// ---------------------------------------------------------------------------
console.log('9. REQUIRED STATUS OPTIONS (9) — manual UI step');
console.log('');
console.log('  The built-in Status field is created automatically by GitHub Projects.');
console.log('  Default options (Todo, In Progress, Done) must be replaced manually.');
console.log('');
for (const s of REQUIRED_STATUSES) {
  console.log(`  • ${s}`);
}
console.log('');
console.log('  After apply: GitHub Projects UI → Project Settings → Fields → Status → Edit options');
console.log('');

// ---------------------------------------------------------------------------
// 10. Required views
// ---------------------------------------------------------------------------
console.log('10. REQUIRED VIEWS (14) — manual UI step');
console.log('');
console.log('  GitHub GraphQL API does not support view creation. Create manually:');
console.log('');
let vNum = 1;
for (const v of REQUIRED_VIEWS) {
  console.log(`  ${vNum++}. ${v}`);
}
console.log('');

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
sep();
if (exitCode === 0) {
  console.log('DRY-RUN COMPLETE — ready for apply');
} else {
  console.log('DRY-RUN COMPLETE — issues found, see [FAIL] items above');
}
console.log('');
console.log('  No external writes performed.');
console.log('  No GitHub Project was created or modified.');
console.log('  No credentials were read or logged.');
console.log('');
if (exitCode === 0) {
  console.log('  To apply (Coordinator approval required):');
  console.log(`    node scripts/github-project-setup-apply.mjs --apply --owner ${OWNER} --repo ${REPO}`);
}
sep();

process.exit(exitCode);
