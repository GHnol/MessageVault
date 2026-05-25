#!/usr/bin/env node
/**
 * github-project-import-issues.mjs
 *
 * Dry-run by default. Creates GitHub Issues from repo-generated source
 * records only after Coordinator approval and --apply flag.
 *
 * Default mode: reads planned source records (or --input file if provided)
 * and prints the planned issues without creating them.
 *
 * Apply mode (--apply): requires --input <source-file> pointing to a valid
 * JSON source record file. Creates issues only if the file exists and
 * --apply is present. Not executable in apply mode in this pass.
 *
 * No npm dependencies. No secrets logged. No external writes without --apply.
 * Exit 0 = complete. Exit 1 = error or --apply without valid input.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const APPLY = process.argv.includes('--apply');
const inputIdx = process.argv.indexOf('--input');
const INPUT_FILE = inputIdx !== -1 ? process.argv[inputIdx + 1] : null;

function sep() {
  console.log('─'.repeat(60));
}

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT ISSUE IMPORT');
console.log(`Date:    ${now}`);
console.log(`Mode:    ${APPLY ? 'APPLY' : 'dry-run'}`);
if (INPUT_FILE) console.log(`Input:   ${INPUT_FILE}`);
sep();
console.log('');

// ── Apply guard ───────────────────────────────────────────────────────────────

if (APPLY) {
  if (!INPUT_FILE) {
    console.log('ERROR: --apply requires --input <source-file>');
    console.log('  Example: node scripts/github-project-import-issues.mjs --apply --input source.json');
    console.log('');
    console.log('  The input file must be a JSON array of source records matching');
    console.log('  the schema in docs/project-control/github-projects-source-schema.md');
    process.exit(1);
  }

  if (!existsSync(INPUT_FILE)) {
    console.log(`ERROR: Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  console.log('ERROR: --apply mode is not yet implemented in this version.');
  console.log('');
  console.log('This script is an import scaffold. It validates inputs and prints');
  console.log('planned issues but does not create them. No GitHub Issues will be');
  console.log('created until this script is updated with live API calls.');
  console.log('');
  console.log('To enable apply mode in a future pass:');
  console.log('  1. Get Coordinator approval for issue import.');
  console.log('  2. Verify gh auth status and that the GitHub Project exists.');
  console.log('  3. Update this script with live gh issue create calls.');
  console.log('  4. Run: node scripts/github-project-import-issues.mjs --apply --input <file>');
  console.log('');
  process.exit(1);
}

// ── Dry-run: show planned import ──────────────────────────────────────────────

console.log('DRY-RUN: PLANNED ISSUE IMPORT');
console.log('');
console.log('Source:');
console.log('  Issues are generated from repo-native source records only.');
console.log('  Source schema: docs/project-control/github-projects-source-schema.md');
console.log('  Source docs:   docs/project-control/backlog.md');
console.log('                 docs/project-control/current-sprint.md');
console.log('                 docs/project-control/master-roadmap.md');
console.log('');

if (INPUT_FILE && existsSync(INPUT_FILE)) {
  console.log(`Input file: ${INPUT_FILE}`);
  try {
    const raw = readFileSync(INPUT_FILE, 'utf8');
    const records = JSON.parse(raw);
    const items = Array.isArray(records) ? records : [records];
    console.log(`  Found ${items.length} source record(s):`);
    console.log('');
    for (const item of items) {
      console.log(`  Issue: ${item.title || item.os_id || '(no title)'}`);
      console.log(`    os_id:  ${item.os_id || '(none)'}`);
      console.log(`    type:   ${item.type || '(none)'}`);
      console.log(`    status: ${item.status || '(none)'}`);
      if (item.labels && item.labels.length) {
        console.log(`    labels: ${item.labels.join(', ')}`);
      }
      console.log('');
    }
  } catch (e) {
    console.log(`  ERROR: Could not parse input file: ${e.message}`);
  }
} else {
  console.log('  No --input file provided. Showing generic planned steps:');
  console.log('');
  console.log('  When apply is approved and an input file is provided:');
  console.log('');
  console.log('  For each source record:');
  console.log('    1. gh issue create \\');
  console.log('         --repo GHnol/MessageVault \\');
  console.log('         --title "<title>" \\');
  console.log('         --body "<body with os_id, type, source_file, success_criteria>" \\');
  console.log('         --label "<labels>" \\');
  console.log('         --milestone "<milestone>"');
  console.log('');
  console.log('    2. gh project item-add <project-number> \\');
  console.log('         --owner GHnol \\');
  console.log('         --url <issue-url>');
  console.log('');
  console.log('    3. Set project field values for each issue:');
  console.log('         OS ID, Package, Phase, Lane, Source File,');
  console.log('         Owner Role, Risk Level, Decision Needed, etc.');
  console.log('');
  console.log('    4. Write issue_number, issue_url, project_item_id to');
  console.log('         docs/project-control/external-sync-map.local.json');
}

sep();
console.log('DRY-RUN COMPLETE — NO EXTERNAL WRITES PERFORMED');
console.log('');
console.log('  No GitHub Issues were created.');
console.log('  No GitHub Project items were added.');
console.log('  No credentials were read or logged.');
console.log('');
console.log('  To import: get Coordinator approval, then run:');
console.log('    node scripts/github-project-import-issues.mjs --apply --input <source-file>');
sep();
