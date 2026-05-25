#!/usr/bin/env node
/**
 * github-project-setup-apply.mjs
 *
 * Creates or copies a GitHub Project and configures required fields.
 *
 * Without --apply  → plan mode: validates prerequisites, shows exact operations,
 *                    performs read-only probes if gh is available. No writes.
 * With    --apply  → executes the plan: creates/copies project, creates fields,
 *                    writes local sync map, updates sync log.
 *
 * No npm dependencies. No token exposure. No mutations without --apply.
 * Exit 0 = success or plan complete. Exit 1 = error or apply prerequisites not met.
 *
 * Usage:
 *   node scripts/github-project-setup-apply.mjs [options]
 *
 * Options:
 *   --apply                      Execute (without this flag: plan mode only)
 *   --owner <owner>              GitHub owner (default: GHnol)
 *   --repo <repo>                GitHub repo name (default: MessageVault)
 *   --project-title <title>      Project title (default: KeepMees Project Control)
 *   --from-template              Copy from a template project instead of creating
 *   --template-project-id <id>   Template project node ID (PVT_...)
 *   --template-project-number <N> Template project number
 *   --template-owner <owner>     Template project owner (defaults to --owner)
 *   --sync-map <path>            Local sync map path (default: docs/project-control/external-sync-map.local.json)
 *   --help                       Print this help
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import {
  getGhVersion, probeAuth, probeProjectScope, checkGitignored,
  readSyncMap, writeSyncMap, mergeSyncMap, appendSyncLog,
  resolveOwnerId, getRepositoryId, findProject, getProjectFields,
  createProject, copyProject, linkProjectToRepo,
  createTextField, createDateField, createSingleSelectField,
  REQUIRED_FIELDS, REQUIRED_STATUSES, REQUIRED_VIEWS,
} from './lib/github-projects-client.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

// ─── Arg parsing ─────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const HELP = argv.includes('--help') || argv.includes('-h');

function getArg(name) {
  const idx = argv.indexOf(name);
  return idx >= 0 && argv[idx + 1] ? argv[idx + 1] : null;
}

const OWNER = getArg('--owner') ?? 'GHnol';
const REPO = getArg('--repo') ?? 'MessageVault';
const PROJECT_TITLE = getArg('--project-title') ?? 'KeepMees Project Control';
const FROM_TEMPLATE = argv.includes('--from-template');
const TEMPLATE_ID = getArg('--template-project-id');
const TEMPLATE_NUMBER = getArg('--template-project-number');
const TEMPLATE_OWNER = getArg('--template-owner') ?? OWNER;
const SYNC_MAP_PATH = getArg('--sync-map') ?? 'docs/project-control/external-sync-map.local.json';
const SYNC_MAP_FULL = join(ROOT, SYNC_MAP_PATH);
const SYNC_LOG_PATH = join(ROOT, 'docs/project-control/github-projects-sync-log.md');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sep() { console.log('─'.repeat(60)); }
function hdr(s) { sep(); console.log(s); sep(); }

function fail(msg) {
  console.error(`\n[FAIL] ${msg}\n`);
  process.exit(1);
}

// ─── Help ─────────────────────────────────────────────────────────────────────

if (HELP) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .match(/\/\*\*([\s\S]*?)\*\//)?.[0] ?? 'See script header for usage.');
  process.exit(0);
}

// ─── Header ───────────────────────────────────────────────────────────────────

const now = new Date().toISOString().slice(0, 10);
console.log('');
hdr(`GITHUB PROJECT SETUP — ${APPLY ? 'APPLY' : 'PLAN MODE'}`);
console.log(`Date:    ${now}`);
console.log(`Mode:    ${APPLY ? 'APPLY (live operations)' : 'plan (read-only probes; no writes)'}`);
console.log(`Owner:   ${OWNER}`);
console.log(`Repo:    ${REPO}`);
console.log(`Title:   ${PROJECT_TITLE}`);
if (FROM_TEMPLATE) {
  console.log(`Template: ${TEMPLATE_OWNER} / number=${TEMPLATE_NUMBER ?? '?'} / id=${TEMPLATE_ID ?? '?'}`);
}
console.log('');

// ─── Required docs check ─────────────────────────────────────────────────────

const requiredDocs = [
  'docs/project-control/github-projects-setup-policy.md',
  'docs/project-control/github-projects-source-schema.md',
  'docs/project-control/github-projects-import-runbook.md',
  'docs/project-control/github-projects-field-map.example.json',
  'docs/project-control/github-projects-sync-log.md',
];
console.log('REQUIRED DOCS');
let missingDocs = 0;
for (const d of requiredDocs) {
  const full = join(ROOT, d);
  if (existsSync(full)) {
    console.log(`  [PASS] ${d}`);
  } else {
    console.log(`  [FAIL] MISSING: ${d}`);
    missingDocs++;
  }
}
console.log('');
if (missingDocs > 0) fail(`${missingDocs} required doc(s) missing.`);

// ─── gh version check ─────────────────────────────────────────────────────────

console.log('GH CLI');
const ghv = getGhVersion();
if (!ghv.ok || !ghv.installed) {
  console.log('  [FAIL] gh CLI not found.');
  console.log('         Install from https://cli.github.com and authenticate.');
  console.log('         Then run: gh auth login');
  if (APPLY) fail('gh CLI required for apply.');
  console.log('');
} else {
  console.log(`  [PASS] gh ${ghv.version} installed`);
  if (!ghv.supportsProjectCmd) {
    console.log(`  [WARN] gh <2.28.0 — "gh project" subcommands unavailable.`);
    console.log(`         Upgrade recommended: https://cli.github.com`);
    console.log(`         This script uses GraphQL directly and will still work.`);
  }
  console.log('');
}

// ─── Auth check ───────────────────────────────────────────────────────────────

let authed = false;
let authLogin = null;
if (ghv.ok && ghv.installed) {
  const auth = probeAuth();
  if (auth.ok) {
    authed = true;
    authLogin = auth.login;
    console.log(`  [PASS] Authenticated as: ${authLogin}`);
  } else {
    console.log(`  [FAIL] Not authenticated: ${auth.error}`);
    console.log('         Run: gh auth login');
    if (APPLY) {
      console.log('');
      fail('Authentication required for apply.');
    }
  }
  console.log('');
}

// ─── Project scope check ──────────────────────────────────────────────────────

let hasScope = false;
if (authed) {
  const scopeR = probeProjectScope();
  if (scopeR.ok) {
    hasScope = true;
    console.log('  [PASS] project scope confirmed');
  } else {
    console.log('  [FAIL] project scope missing or insufficient.');
    console.log('         Run manually: gh auth refresh -s project');
    console.log('         (This script cannot change auth state for you.)');
    if (APPLY) {
      console.log('');
      fail('project scope required for apply.');
    }
  }
  console.log('');
}

// ─── gitignore check ──────────────────────────────────────────────────────────

console.log('GITIGNORE CHECK');
const ignoreCheck = checkGitignored(SYNC_MAP_PATH, ROOT);
if (ignoreCheck.ignored) {
  console.log(`  [PASS] ${SYNC_MAP_PATH} is gitignored`);
} else {
  console.log(`  [FAIL] ${SYNC_MAP_PATH} is NOT gitignored`);
  console.log('         Add it to .gitignore before proceeding.');
  if (APPLY) { console.log(''); fail('Sync map must be gitignored before apply.'); }
}
console.log('');

// ─── Existing sync map ────────────────────────────────────────────────────────

const syncMapResult = readSyncMap(SYNC_MAP_FULL);
const existingSyncMap = syncMapResult.data ?? null;
const existingGP = existingSyncMap?.github_projects;
const knownProjectId = existingGP?._project_meta?.project_id;
const knownProjectNumber = existingGP?._project_meta?.project_number ?? 0;

// ─── Existing project detection ───────────────────────────────────────────────

console.log('PROJECT DETECTION');
let foundProject = null;
let ownerId = null;

if (authed && hasScope) {
  const findR = findProject(OWNER, PROJECT_TITLE, knownProjectNumber > 0 ? knownProjectNumber : null);
  if (findR.ok) {
    ownerId = findR.ownerId;
    if (findR.found) {
      foundProject = findR.project;
      console.log(`  [FOUND] "${foundProject.title}" — number: ${foundProject.number}`);
      console.log(`          URL: ${foundProject.url}`);
      console.log(`          Apply will REUSE existing project (no duplicate creation).`);
    } else {
      console.log(`  [NOT FOUND] "${PROJECT_TITLE}" — will be ${FROM_TEMPLATE ? 'copied from template' : 'created from scratch'}`);
    }
  } else {
    console.log(`  [WARN] Cannot query existing projects: ${findR.error}`);
  }
} else {
  console.log('  [SKIP] Cannot detect existing project (gh unavailable or not authed)');
  if (knownProjectNumber > 0) {
    console.log(`         Local sync map indicates project number: ${knownProjectNumber}`);
  }
}
console.log('');

// ─── Template detection ───────────────────────────────────────────────────────

let templateProject = null;
if (FROM_TEMPLATE && authed && hasScope) {
  console.log('TEMPLATE PROJECT DETECTION');
  const tNumber = TEMPLATE_NUMBER ? parseInt(TEMPLATE_NUMBER, 10) : null;
  const tTitle = null;
  const tR = findProject(TEMPLATE_OWNER, tTitle, tNumber);
  if (tR.ok && tR.found) {
    templateProject = tR.project;
    console.log(`  [FOUND] Template: "${templateProject.title}" #${templateProject.number}`);
    if (templateProject.id === foundProject?.id) {
      console.log('  [FAIL] Template ID is the same as target project — cannot copy self.');
      if (APPLY) fail('Template must be a different project from the target.');
    } else {
      console.log('         Apply will copy this template project.');
    }
  } else {
    console.log(`  [WARN] Template project not found: ${tR.error ?? 'no match'}`);
    console.log('         Falling back to create-from-scratch.');
  }
  console.log('');
}

// ─── Planned operations ───────────────────────────────────────────────────────

console.log('PLANNED OPERATIONS (apply would execute in order)');
let opNum = 1;
const ops = [];

if (!foundProject) {
  if (FROM_TEMPLATE && templateProject) {
    ops.push(`${opNum++}. copyProjectV2(templateId: "${templateProject.id}", ownerId: "<${OWNER} node ID>", title: "${PROJECT_TITLE}")`);
  } else {
    ops.push(`${opNum++}. resolveOwnerId("${OWNER}") → get node ID`);
    ops.push(`${opNum++}. createProjectV2(ownerId: "<node ID>", title: "${PROJECT_TITLE}")`);
  }
  ops.push(`${opNum++}. getRepositoryId("${OWNER}", "${REPO}") → get repo node ID`);
  ops.push(`${opNum++}. linkProjectV2ToRepository(projectId: <new>, repositoryId: <repo>)`);
} else {
  ops.push(`${opNum++}. REUSE existing project #${foundProject.number} (no create)`);
}

ops.push(`${opNum++}. getProjectFields(projectId) → detect existing fields`);
for (const f of REQUIRED_FIELDS) {
  ops.push(`${opNum++}. Create field if missing: "${f.name}" (${f.dataType}${f.options ? `, ${f.options.length} options` : ''})`);
}
ops.push(`${opNum++}. Write sync map: ${SYNC_MAP_PATH}`);
ops.push(`${opNum++}. Append to sync log: docs/project-control/github-projects-sync-log.md`);

for (const op of ops) console.log(`  ${op}`);
console.log('');

// ─── Views (manual step) ──────────────────────────────────────────────────────

console.log('VIEWS — MANUAL SETUP REQUIRED');
console.log('  GitHub Projects view creation is not available via GraphQL API.');
console.log('  After apply, create these 14 views manually in the GitHub Projects UI:');
for (const v of REQUIRED_VIEWS) console.log(`    • ${v}`);
console.log('');

// ─── Status field note ────────────────────────────────────────────────────────

console.log('STATUS FIELD NOTE');
console.log('  The built-in Status field\'s options (Not Started, In Review, etc.) must');
console.log('  be configured manually in the GitHub Projects UI after project creation.');
console.log('  Required statuses:');
for (const s of REQUIRED_STATUSES) console.log(`    • ${s}`);
console.log('');

// ─── Exit here if plan mode ───────────────────────────────────────────────────

if (!APPLY) {
  sep();
  console.log('PLAN MODE COMPLETE — no writes performed.');
  console.log('');
  console.log('To apply (after Coordinator approval):');
  console.log(`  node scripts/github-project-setup-apply.mjs --apply \\`);
  console.log(`    --owner ${OWNER} --repo ${REPO} --project-title "${PROJECT_TITLE}"`);
  if (FROM_TEMPLATE && TEMPLATE_NUMBER) {
    console.log(`    --from-template --template-project-number ${TEMPLATE_NUMBER}`);
  }
  console.log('');
  sep();
  process.exit(0);
}

// ─── APPLY MODE ──────────────────────────────────────────────────────────────
// Everything below this line makes live GitHub API calls.

sep();
console.log('APPLY — executing live operations');
sep();
console.log('');

const applyOpts = { apply: true };
let project = foundProject;
let resolvedOwnerId = ownerId;

// Step 1: Resolve project (create/copy/reuse)
if (!project) {
  if (!resolvedOwnerId) {
    const oidR = resolveOwnerId(OWNER);
    if (!oidR.ok) fail(`Cannot resolve owner ID: ${oidR.error}`);
    resolvedOwnerId = oidR.id;
    console.log(`  [OK] Resolved ${OWNER} node ID: ${resolvedOwnerId.slice(0, 12)}…`);
  }

  if (FROM_TEMPLATE && templateProject) {
    console.log(`  Creating project by copying template #${templateProject.number}…`);
    const copyR = copyProject(templateProject.id, resolvedOwnerId, PROJECT_TITLE, applyOpts);
    if (!copyR.ok) {
      console.log(`  [WARN] Template copy failed: ${copyR.error}`);
      console.log('         Falling back to create-from-scratch.');
    } else {
      project = copyR.project;
      console.log(`  [OK] Project copied: "${project.title}" #${project.number}`);
    }
  }

  if (!project) {
    console.log(`  Creating project "${PROJECT_TITLE}"…`);
    const createR = createProject(resolvedOwnerId, PROJECT_TITLE, applyOpts);
    if (!createR.ok) fail(`Project creation failed: ${createR.error}`);
    project = createR.project;
    console.log(`  [OK] Project created: #${project.number} — ${project.url}`);

    // Link repo
    const repoR = getRepositoryId(OWNER, REPO);
    if (repoR.ok) {
      const linkR = linkProjectToRepo(project.id, repoR.id, applyOpts);
      if (linkR.ok) console.log(`  [OK] Linked repo ${OWNER}/${REPO}`);
      else console.log(`  [WARN] Repo link failed: ${linkR.error}`);
    } else {
      console.log(`  [WARN] Cannot get repo ID: ${repoR.error}`);
    }
  }
} else {
  console.log(`  [REUSE] Project #${project.number} already exists — skipping creation.`);
}
console.log('');

// Step 2: Get existing fields
const fieldsR = getProjectFields(project.id);
if (!fieldsR.ok) fail(`Cannot read project fields: ${fieldsR.error}`);
const existingFields = fieldsR.fields;
const existingFieldNames = new Map(existingFields.map(f => [f.name, f]));
console.log(`  Existing fields detected: ${existingFields.length}`);

// Step 3: Create missing fields
const fieldIds = {};
const optionIds = {};

for (const fd of REQUIRED_FIELDS) {
  if (existingFieldNames.has(fd.name)) {
    const ef = existingFieldNames.get(fd.name);
    fieldIds[fd.key] = ef.id;
    console.log(`  [SKIP] Field exists: "${fd.name}" (${ef.id.slice(0, 12)}…)`);
    if (ef.options) {
      optionIds[fd.key] = {};
      for (const opt of ef.options) optionIds[fd.key][opt.name] = opt.id;
    }
    continue;
  }

  let createR;
  if (fd.dataType === 'TEXT') {
    createR = createTextField(project.id, fd.name, applyOpts);
  } else if (fd.dataType === 'DATE') {
    createR = createDateField(project.id, fd.name, applyOpts);
  } else if (fd.dataType === 'SINGLE_SELECT') {
    createR = createSingleSelectField(project.id, fd.name, fd.options ?? [], applyOpts);
  } else {
    createR = createTextField(project.id, fd.name, applyOpts);
  }

  if (!createR.ok) {
    console.log(`  [WARN] Cannot create field "${fd.name}": ${createR.error}`);
    continue;
  }
  const newField = createR.field;
  fieldIds[fd.key] = newField.id;
  console.log(`  [OK] Created field "${fd.name}" → ${newField.id.slice(0, 12)}…`);
  if (newField.options) {
    optionIds[fd.key] = {};
    for (const opt of newField.options) optionIds[fd.key][opt.name] = opt.id;
  }
}
console.log('');

// Step 4: Write local sync map
const syncUpdates = {
  _project_meta: {
    owner: OWNER,
    repo: REPO,
    project_title: project.title,
    project_number: project.number,
    project_id: project.id,
    project_url: project.url,
    last_synced: now,
    status: 'active',
    _gh_version: ghv.version ?? 'unknown',
  },
  _field_ids: fieldIds,
  _option_ids: optionIds,
};
const merged = mergeSyncMap(existingSyncMap, syncUpdates);
const writeR = writeSyncMap(SYNC_MAP_FULL, merged, applyOpts);
if (!writeR.ok) {
  console.log(`  [WARN] Sync map write failed: ${writeR.error}`);
} else {
  console.log(`  [OK] Sync map written: ${SYNC_MAP_PATH}`);
}

// Step 5: Update sync log
const logEntry = `### ${now} — AI Project OS v1.4: GitHub Project Setup

**Type:** project-setup
**Script:** scripts/github-project-setup-apply.mjs --apply
**Coordinator approval:** required before running --apply
**Owner/Repo:** ${OWNER}/${REPO}

**What changed:**
- Project: "${project.title}" (#${project.number})
- Fields created/verified: ${Object.keys(fieldIds).length}/${REQUIRED_FIELDS.length}

**Local sync map updated:** yes

**Manual steps still required:**
- Create 14 views in GitHub Projects UI (see script output)
- Configure Status field options in GitHub Projects UI`;

const logR = appendSyncLog(SYNC_LOG_PATH, logEntry, applyOpts);
if (!logR.ok) {
  console.log(`  [WARN] Sync log update failed: ${logR.error}`);
} else {
  console.log(`  [OK] Sync log updated`);
}
console.log('');

// ─── Final summary ────────────────────────────────────────────────────────────

sep();
console.log('APPLY COMPLETE');
console.log('');
console.log(`  Project:   "${project.title}" #${project.number}`);
console.log(`  URL:       ${project.url}`);
console.log(`  Fields:    ${Object.keys(fieldIds).length}/${REQUIRED_FIELDS.length} configured`);
console.log(`  Sync map:  ${SYNC_MAP_PATH}`);
console.log('');
console.log('REMAINING MANUAL STEPS:');
console.log('  1. In GitHub Projects UI → Settings → Status field → add statuses:');
for (const s of REQUIRED_STATUSES) console.log(`       • ${s}`);
console.log('  2. In GitHub Projects UI → create 14 views:');
for (const v of REQUIRED_VIEWS) console.log(`       • ${v}`);
console.log('');
console.log('NEXT STEP:');
console.log('  Import issues: node scripts/github-project-import-issues.mjs --apply --input <source-records.json>');
console.log('');
sep();
