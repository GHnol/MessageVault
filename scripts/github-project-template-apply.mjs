#!/usr/bin/env node
/**
 * github-project-template-apply.mjs
 * AI Project OS v1.5 — Create or validate the canonical AI Project OS template
 * GitHub Project.
 *
 * Without --apply  → plan mode: validates config, shows exact operations. No writes.
 * With    --apply  → executes the plan (Gate 2 only — requires Coordinator approval).
 *
 * Subcommands (one required with --apply):
 *   --create-template    Create a new canonical template project
 *   --copy-from-template Copy from configured template into a new project
 *   --validate-template  Read-only: validate the template project exists and matches spec
 *
 * No npm dependencies. No token exposure. No mutations without --apply.
 * Exit 0 = success or plan complete. Exit 1 = error.
 *
 * Usage:
 *   node scripts/github-project-template-apply.mjs [options]
 *
 * Options:
 *   --apply                   Execute (without this flag: plan mode only)
 *   --create-template         Create a new canonical template project
 *   --copy-from-template      Copy template into a new project
 *   --validate-template       Read-only validate the template project
 *   --owner <owner>           GitHub owner (default: GHnol)
 *   --repo <repo>             GitHub repo name (default: MessageVault)
 *   --template-title <title>  Title for new template project (create-template only)
 *   --config <path>           Local template config path (default: local json path)
 *   --help                    Print this help
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const argv = process.argv.slice(2);
const APPLY           = argv.includes('--apply');
const HELP            = argv.includes('--help') || argv.includes('-h');
const CREATE_TEMPLATE = argv.includes('--create-template');
const COPY_FROM       = argv.includes('--copy-from-template');
const VALIDATE        = argv.includes('--validate-template');

function getArg(name) {
  const idx = argv.indexOf(name);
  return idx >= 0 && argv[idx + 1] ? argv[idx + 1] : null;
}

const OWNER         = getArg('--owner') ?? 'GHnol';
const REPO          = getArg('--repo') ?? 'MessageVault';
const TMPL_TITLE    = getArg('--template-title') ?? 'AI Project OS Template';
const LOCAL_CONFIG  = getArg('--config') ??
  'docs/project-control/github-projects-template-config.local.json';
const LOCAL_CONFIG_FULL = join(ROOT, LOCAL_CONFIG);
const EXAMPLE_CONFIG = join(ROOT,
  'docs/project-control/github-projects-template-config.example.json');

function sep() { console.log('─'.repeat(60)); }
function hdr(s) { sep(); console.log(s); sep(); }
function info(msg) { console.log(`  [INFO] ${msg}`); }
function ok(msg) { console.log(`  [PASS] ${msg}`); }
function warn(msg) { console.log(`  [WARN] ${msg}`); }

// ─── Help ─────────────────────────────────────────────────────────────────────

if (HELP) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('\n').slice(0, 30).filter(l => l.startsWith(' *'))
    .map(l => l.replace(/^ \* ?/, '')).join('\n'));
  process.exit(0);
}

// ─── Plan mode header ─────────────────────────────────────────────────────────

const now = new Date().toISOString().slice(0, 10);
console.log('');
hdr(`GITHUB PROJECT TEMPLATE — ${APPLY ? 'APPLY' : 'PLAN MODE'} (AI Project OS v1.5)`);
console.log(`Date:  ${now}`);
console.log(`Owner: ${OWNER}   Repo: ${REPO}`);
console.log(`Mode:  ${APPLY ? 'APPLY (Coordinator-approved)' : 'plan only (no writes)'}`);
console.log('');

// ─── Subcommand validation ─────────────────────────────────────────────────────

if (APPLY && !CREATE_TEMPLATE && !COPY_FROM && !VALIDATE) {
  console.error('[ERROR] --apply requires one of: --create-template, --copy-from-template, --validate-template');
  console.error('  This is a Gate 2 operation. See: docs/project-control/github-projects-template-copy-runbook.md');
  process.exit(1);
}

// ─── Gate check ───────────────────────────────────────────────────────────────

console.log('GATE STATUS');
console.log('');
info('Gate 1: repo infrastructure — COMPLETE (this script exists)');

if (APPLY && (CREATE_TEMPLATE || COPY_FROM)) {
  info('Gate 2: live template creation — requires explicit Coordinator authorization');
  info('  Verify Coordinator has approved Gate 2 before proceeding.');
  console.log('');
}

// ─── Plan mode: show what would happen ────────────────────────────────────────

if (!APPLY) {
  console.log('PLANNED OPERATIONS (plan mode — no writes will occur)');
  console.log('');

  if (CREATE_TEMPLATE) {
    console.log('  --create-template mode');
    info(`1. Verify gh CLI auth (read-only)`);
    info(`2. Create GitHub Project: "${TMPL_TITLE}" (owner: ${OWNER})`);
    info(`3. Configure 13 custom fields (v1.5 canonical spec)`);
    info(`4. Print instructions for manual Status options + 14 views`);
    info(`5. Print new project ID for github-projects-template-config.local.json`);
    info(`   (NOTE: never commits the ID — write to local config manually)`);
  } else if (COPY_FROM) {
    if (existsSync(LOCAL_CONFIG_FULL)) {
      const cfg = (() => { try { return JSON.parse(readFileSync(LOCAL_CONFIG_FULL, 'utf8')); } catch { return null; } })();
      if (cfg && cfg.template_project_id && cfg.template_project_id !== 'PVT_placeholder') {
        console.log('  --copy-from-template mode');
        info(`1. Verify gh CLI auth (read-only)`);
        info(`2. Read template config: ${LOCAL_CONFIG}`);
        info(`3. Copy template: "${cfg.template_project_title}" → new project for ${OWNER}/${REPO}`);
        info(`4. Link copied project to repository ${OWNER}/${REPO}`);
        info(`5. Write sync map with new project ID and field IDs`);
        info(`6. Append sync log entry`);
      } else {
        warn('Local config has placeholder IDs — cannot copy template');
        info('  Complete Gate 2 to populate real template IDs');
        info('  See: docs/project-control/github-projects-template-copy-runbook.md');
      }
    } else {
      warn(`Local config not found: ${LOCAL_CONFIG}`);
      info('  Gate 2 not yet complete. See: docs/project-control/github-projects-template-copy-runbook.md');
    }
  } else if (VALIDATE) {
    console.log('  --validate-template mode (read-only even with --apply)');
    info(`1. Verify gh CLI auth (read-only)`);
    if (existsSync(LOCAL_CONFIG_FULL)) {
      const cfg = (() => { try { return JSON.parse(readFileSync(LOCAL_CONFIG_FULL, 'utf8')); } catch { return null; } })();
      if (cfg && cfg.template_project_id && cfg.template_project_id !== 'PVT_placeholder') {
        info(`2. Confirm template project exists: "${cfg.template_project_title}" (${cfg.template_project_id})`);
        info(`3. Verify 13 custom fields present`);
        info(`4. Verify Status options match v1.5 canonical vocabulary`);
        info(`5. Report any drift`);
      } else {
        warn('Local config has placeholder IDs — nothing to validate live');
      }
    } else {
      warn(`Local config not found: ${LOCAL_CONFIG}`);
      info('  Cannot validate without local template config. Gate 2 required.');
    }
  } else {
    info('No subcommand selected. Available with --apply:');
    info('  --create-template    Create a new canonical template project (Gate 2)');
    info('  --copy-from-template Copy template into a new project (Gate 2)');
    info('  --validate-template  Read-only validate the template project exists (Gate 2)');
  }

  console.log('');
  sep();
  console.log('PLAN MODE COMPLETE — no external writes performed.');
  console.log('');
  console.log('  To apply (Gate 2 — explicit Coordinator approval required):');
  console.log(`    node scripts/github-project-template-apply.mjs --apply --create-template --owner ${OWNER}`);
  console.log(`    node scripts/github-project-template-apply.mjs --apply --validate-template`);
  sep();
  process.exit(0);
}

// ─── Apply mode ───────────────────────────────────────────────────────────────

// Dynamic import of client library only in apply mode
const client = await import('./lib/github-projects-client.mjs');
const {
  probeAuth, probeProjectScope, findProject, createProject, linkProjectToRepo,
  createTextField, createDateField, createSingleSelectField,
  appendSyncLog, REQUIRED_FIELDS, REQUIRED_STATUSES, REQUIRED_VIEWS,
} = client;

// Verify auth
const authR = probeAuth();
if (!authR.ok) {
  console.error(`[FAIL] GitHub auth failed: ${authR.error}`);
  console.error('  Run: gh auth login');
  process.exit(1);
}
ok(`Authenticated as: ${authR.login}`);

if (VALIDATE) {
  // ─── Validate template (read-only even with --apply) ────────────────────────

  hdr('VALIDATE TEMPLATE');

  if (!existsSync(LOCAL_CONFIG_FULL)) {
    console.error(`[FAIL] Local config not found: ${LOCAL_CONFIG}`);
    console.error('  Gate 2 required. See: docs/project-control/github-projects-template-copy-runbook.md');
    process.exit(1);
  }

  let cfg;
  try {
    cfg = JSON.parse(readFileSync(LOCAL_CONFIG_FULL, 'utf8'));
  } catch (e) {
    console.error(`[FAIL] Cannot parse local config: ${e.message}`);
    process.exit(1);
  }

  if (!cfg.template_project_id || cfg.template_project_id === 'PVT_placeholder') {
    console.error('[FAIL] Local config has placeholder IDs. Gate 2 not yet complete.');
    process.exit(1);
  }

  const findR = findProject(cfg.template_owner, cfg.template_project_title, cfg.template_project_number);
  if (!findR.ok || !findR.found) {
    console.error(`[FAIL] Template project not found on GitHub: "${cfg.template_project_title}"`);
    console.error('  Verify the template project exists and the config IDs are correct.');
    process.exit(1);
  }

  ok(`Template project found: "${findR.project.title}" #${findR.project.number}`);
  if (findR.project.id === cfg.template_project_id) {
    ok('Template project ID matches config');
  } else {
    warn(`Template ID mismatch: config=${cfg.template_project_id} github=${findR.project.id}`);
  }

  console.log('');
  console.log('  Validate complete. To verify field/status/view spec, run:');
  console.log(`    node scripts/github-project-template-validate.mjs --config ${LOCAL_CONFIG} --live`);
  console.log('');
  process.exit(0);
}

if (CREATE_TEMPLATE) {
  // ─── Create template project ─────────────────────────────────────────────────

  hdr('CREATE TEMPLATE PROJECT (Gate 2)');
  console.log('');
  info(`Creating template project: "${TMPL_TITLE}" (owner: ${OWNER})`);
  console.log('');

  const scopeR = probeProjectScope();
  if (!scopeR) {
    warn('Project scope probe inconclusive — proceeding; if creation fails, run: gh auth refresh -s project');
  }

  const ownerR = (await import('./lib/github-projects-client.mjs')).resolveOwnerId(OWNER);
  if (!ownerR.ok) {
    console.error(`[FAIL] Cannot resolve owner ID: ${ownerR.error}`);
    process.exit(1);
  }

  const createR = createProject(ownerR.id, TMPL_TITLE, { apply: true });
  if (!createR.ok) {
    console.error(`[FAIL] Create project failed: ${createR.error}`);
    process.exit(1);
  }

  const projectId = createR.projectId;
  const projectNumber = createR.projectNumber;
  ok(`Template project created: ID=${projectId} Number=${projectNumber}`);

  let fieldsCreated = 0;
  for (const field of REQUIRED_FIELDS) {
    let r;
    if (field.dataType === 'TEXT') {
      r = createTextField(projectId, field.name, { apply: true });
    } else if (field.dataType === 'DATE') {
      r = createDateField(projectId, field.name, { apply: true });
    } else if (field.dataType === 'SINGLE_SELECT') {
      r = createSingleSelectField(projectId, field.name, field.options || [], { apply: true });
    }
    if (r && r.ok) {
      fieldsCreated++;
      ok(`Field created: "${field.name}" [${field.dataType}]`);
    } else {
      warn(`Field create failed: "${field.name}" — ${r?.error ?? 'unknown error'}`);
    }
  }

  console.log('');
  ok(`${fieldsCreated}/${REQUIRED_FIELDS.length} fields created`);
  console.log('');
  info('MANUAL STEPS REQUIRED:');
  info('1. Configure Status field options in GitHub Projects UI:');
  for (const s of REQUIRED_STATUSES) info(`   • ${s}`);
  info('2. Create 14 views in GitHub Projects UI:');
  for (const v of REQUIRED_VIEWS) info(`   • ${v}`);
  console.log('');
  info('After manual steps, write to github-projects-template-config.local.json:');
  info(`  template_project_id: "${projectId}"`);
  info(`  template_project_number: ${projectNumber}`);
  info(`  template_project_title: "${TMPL_TITLE}"`);
  info(`  template_owner: "${OWNER}"`);
  info('  (never commit this file — it is gitignored)');
  console.log('');

  appendSyncLog(join(ROOT, 'docs/project-control/github-projects-sync-log.md'), {
    type: 'template-create',
    script: 'scripts/github-project-template-apply.mjs --apply --create-template',
    projectId,
    projectNumber,
    projectTitle: TMPL_TITLE,
    fieldsCreated,
    date: now,
  });

  sep();
  console.log('TEMPLATE CREATION COMPLETE');
  sep();
  process.exit(0);
}

if (COPY_FROM) {
  // ─── Copy from template ───────────────────────────────────────────────────────

  hdr('COPY FROM TEMPLATE (Gate 2)');

  if (!existsSync(LOCAL_CONFIG_FULL)) {
    console.error(`[FAIL] Local config not found: ${LOCAL_CONFIG}`);
    console.error('  Gate 2 required. See: docs/project-control/github-projects-template-copy-runbook.md');
    process.exit(1);
  }

  let cfg;
  try {
    cfg = JSON.parse(readFileSync(LOCAL_CONFIG_FULL, 'utf8'));
  } catch (e) {
    console.error(`[FAIL] Cannot parse local config: ${e.message}`);
    process.exit(1);
  }

  if (!cfg.template_project_id || cfg.template_project_id === 'PVT_placeholder') {
    console.error('[FAIL] Local config has placeholder IDs. Gate 2 not yet complete.');
    process.exit(1);
  }

  info(`Template: "${cfg.template_project_title}" (${cfg.template_project_id})`);
  info(`Target owner: ${OWNER} / ${REPO}`);
  console.log('');

  const ownerR = (await import('./lib/github-projects-client.mjs')).resolveOwnerId(OWNER);
  if (!ownerR.ok) {
    console.error(`[FAIL] Cannot resolve owner ID: ${ownerR.error}`);
    process.exit(1);
  }

  const copyR = (await import('./lib/github-projects-client.mjs')).copyProject(
    cfg.template_project_id, ownerR.id, `${REPO} Project Control`, { apply: true }
  );
  if (!copyR.ok) {
    console.error(`[FAIL] Copy project failed: ${copyR.error}`);
    process.exit(1);
  }

  ok(`Project copied: ID=${copyR.projectId} Number=${copyR.projectNumber}`);
  info(`Write the copied project ID to docs/project-control/external-sync-map.local.json`);
  info('Then run: node scripts/github-project-setup-apply.mjs to link to repo and verify fields');
  console.log('');

  appendSyncLog(join(ROOT, 'docs/project-control/github-projects-sync-log.md'), {
    type: 'template-copy',
    script: 'scripts/github-project-template-apply.mjs --apply --copy-from-template',
    templateId: cfg.template_project_id,
    newProjectId: copyR.projectId,
    newProjectNumber: copyR.projectNumber,
    date: now,
  });

  sep();
  console.log('COPY COMPLETE');
  sep();
  process.exit(0);
}
