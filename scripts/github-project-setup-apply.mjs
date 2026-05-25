#!/usr/bin/env node
/**
 * github-project-setup-apply.mjs
 *
 * APPLY SKELETON — NOT YET LIVE.
 *
 * This script describes the steps to create a GitHub Project and configure
 * fields, statuses, and views via the GitHub CLI and GraphQL API.
 *
 * In this version, NO external API calls are made. The script prints the
 * exact gh CLI commands and GraphQL operations that would run, then exits.
 *
 * To run in apply mode in a future pass: Coordinator must approve, the script
 * must be updated with live GraphQL mutations, and --apply must be passed.
 *
 * No npm dependencies. No secrets logged. No external writes in this version.
 * Exit 0 = dry-run/help complete. Exit 1 = --apply called (not yet implemented).
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const APPLY = process.argv.includes('--apply');

function sep() {
  console.log('─'.repeat(60));
}

const now = new Date().toISOString().slice(0, 10);

console.log('');
sep();
console.log('GITHUB PROJECT SETUP — APPLY SKELETON');
console.log(`Date:    ${now}`);
console.log(`Mode:    ${APPLY ? 'APPLY (not yet implemented)' : 'dry-run / help'}`);
sep();
console.log('');

// ── Apply guard ───────────────────────────────────────────────────────────────

if (APPLY) {
  console.log('ERROR: --apply mode is not yet implemented in this version.');
  console.log('');
  console.log('This script is an apply skeleton. It prints the planned commands but');
  console.log('does not execute API calls. No external mutation is implemented here.');
  console.log('');
  console.log('To enable apply mode in a future pass:');
  console.log('  1. Get Coordinator approval for GitHub Project creation.');
  console.log('  2. Update this script with live GraphQL mutations.');
  console.log('  3. Verify gh auth status and repo ownership.');
  console.log('  4. Run: node scripts/github-project-setup-apply.mjs --apply');
  console.log('');
  process.exit(1);
}

// ── Planned apply steps ───────────────────────────────────────────────────────

console.log('PLANNED APPLY STEPS (not yet executed)');
console.log('');
console.log('Step 1: Verify gh CLI and auth');
console.log('  gh --version');
console.log('  gh auth status');
console.log('  git remote -v  # must show GHnol/MessageVault');
console.log('');
console.log('Step 2: Check for existing project');
console.log('  gh project list --owner GHnol');
console.log('  # If found: note project_number; skip creation');
console.log('');
console.log('Step 3: Create GitHub Project');
console.log('  gh project create --owner GHnol --title "KeepMees Project Control"');
console.log('  # Note the returned project number');
console.log('');
console.log('Step 4: Add custom fields via GraphQL');
console.log('  # For each field in github-projects-setup-policy.md:');
console.log('  gh api graphql -f query=\'');
console.log('    mutation {');
console.log('      addProjectV2Field(input: {');
console.log('        projectId: "<project-id>"');
console.log('        dataType: TEXT');
console.log('        name: "OS ID"');
console.log('      }) { projectV2Field { id } }');
console.log('    }');
console.log('  \'');
console.log('  # Repeat for all 13 custom fields');
console.log('');
console.log('Step 5: Configure statuses');
console.log('  # Update the built-in Status field options via GraphQL');
console.log('  # Statuses: Not Started, In Progress, In Review, Blocked,');
console.log('  #            Waiting, Approved, Done, Deferred, Cancelled');
console.log('');
console.log('Step 6: Create views');
console.log('  # Views must be created via the GitHub Projects UI or GraphQL');
console.log('  # 14 views: Board, Table, Current Sprint, Backlog, ...');
console.log('  # (View creation via API may require additional GraphQL mutations)');
console.log('');
console.log('Step 7: Write local sync map');
console.log('  # Write project_id and project_number to:');
console.log('  # docs/project-control/external-sync-map.local.json');
console.log('  # (gitignored — never committed)');
console.log('');
console.log('Step 8: Log operation');
console.log('  # Append entry to docs/project-control/github-projects-sync-log.md');
console.log('');

sep();
console.log('NO EXTERNAL MUTATION IMPLEMENTED IN THIS VERSION');
console.log('');
console.log('  No GitHub Project was created.');
console.log('  No API calls were made.');
console.log('  No credentials were read or logged.');
console.log('');
console.log('  To proceed: get Coordinator approval, update this script with');
console.log('  live GraphQL mutations, then run with --apply.');
sep();
