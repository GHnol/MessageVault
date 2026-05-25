#!/usr/bin/env node
/**
 * Project Control Sync Dry-Run Script
 *
 * Reads repo project-control docs and reports drift vs. expected state.
 * Outputs a proposed delta in the dry-run format defined by
 * docs/project-control/project-sync-dry-run-format.md.
 *
 * No dependencies. No API calls. No external writes. Read-only local files only.
 * Outputs to stdout. Exit 0 = no drift. Exit 1 = drift found.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);

const internalDelta = [];
const skipRationale = [];

function readFile(rel) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

// --- Check AI_HANDOFF.md status vs CURRENT_STATE.md ---
const handoff = readFile('AI_HANDOFF.md');
const currentState = readFile('CURRENT_STATE.md');

if (!handoff) {
  internalDelta.push({
    file: 'AI_HANDOFF.md',
    field: 'file existence',
    current: 'missing',
    should_be: 'present',
    why: 'AI_HANDOFF.md is required for every session to resume from repo truth',
    classification: 'operationally-misleading',
  });
}

if (!currentState) {
  internalDelta.push({
    file: 'CURRENT_STATE.md',
    field: 'file existence',
    current: 'missing',
    should_be: 'present',
    why: 'CURRENT_STATE.md is required as the durable project snapshot',
    classification: 'operationally-misleading',
  });
}

// --- Check project-control docs exist ---
const pcDocs = [
  'docs/project-control/current-sprint.md',
  'docs/project-control/kanban-board.md',
  'docs/project-control/project-sync-policy.md',
  'docs/project-control/project-sync-dry-run-format.md',
  'docs/project-control/external-sync-safety.md',
  'docs/project-control/project-sync-log.md',
  'docs/project-control/calendar-sync-policy.md',
];
for (const doc of pcDocs) {
  if (!existsSync(join(ROOT, doc))) {
    internalDelta.push({
      file: doc,
      field: 'file existence',
      current: 'missing',
      should_be: 'present',
      why: `${doc} is part of the project-control sync foundation`,
      classification: 'operationally-misleading',
    });
  }
}

// --- Check skill SKILL.md files exist ---
const skills = [
  'start', 'handoff', 'precommit', 'closeout', 'package-start',
  'switch-to-codex', 'switch-to-claude', 'weekly-sync', 'status-summary',
  'os-audit', 'project-sync-dry-run', 'project-sync-apply', 'notification-setup-wizard',
];
for (const skill of skills) {
  const path = `.claude/skills/${skill}/SKILL.md`;
  if (!existsSync(join(ROOT, path))) {
    internalDelta.push({
      file: path,
      field: 'file existence',
      current: 'missing',
      should_be: 'present with name/description frontmatter',
      why: `Skills are the canonical protocol layer; ${skill} is required`,
      classification: 'operationally-misleading',
    });
  }
}

// --- Check command wrappers exist ---
const commands = [
  'start', 'handoff', 'precommit', 'closeout', 'package-start',
  'switch-to-codex', 'switch-to-claude', 'weekly-sync', 'status-summary',
  'os-audit', 'project-sync-dry-run', 'project-sync-apply', 'notification-setup-wizard', 'calendar-sync-plan',
];
for (const cmd of commands) {
  const path = `.claude/commands/${cmd}.md`;
  if (!existsSync(join(ROOT, path))) {
    internalDelta.push({
      file: path,
      field: 'file existence',
      current: 'missing',
      should_be: 'present as command wrapper pointing to skill',
      why: `Command wrapper is the daily user interface for ${cmd}`,
      classification: 'operationally-misleading',
    });
  }
}

// --- Output ---
console.log(`PROJECT-CONTROL STRUCTURAL CHECK — ${today}`);
console.log('Source: scripts/project-control-sync-dry-run.mjs');
console.log('Trigger: manual or post-closeout check');
console.log('Scope: structural integrity only — checks required file presence, not content freshness.');
console.log('Note: Content freshness, date accuracy, and external tool currency require');
console.log('      Coordinator review or a future content-aware sync script.');
console.log('');

console.log('MISSING FILES (structural check)');
if (internalDelta.length === 0) {
  console.log('  (none — all required files present)');
} else {
  for (const item of internalDelta) {
    console.log(`  FILE: ${item.file}`);
    console.log(`    FIELD: ${item.field}`);
    console.log(`    CURRENT: ${item.current}`);
    console.log(`    SHOULD BE: ${item.should_be}`);
    console.log(`    WHY: ${item.why}`);
    console.log(`    CLASSIFICATION: ${item.classification}`);
  }
}

console.log('');
console.log('NOT CHECKED BY THIS SCRIPT');
console.log('  Content freshness of current-sprint.md, kanban-board.md, AI_HANDOFF.md, CURRENT_STATE.md');
console.log('  Date accuracy of calendar, schedule, or milestone docs');
console.log('  ClickUp / TickTick export currency vs. current backlog');
console.log('  External tool delta (requires Coordinator review — use /project-sync-dry-run skill)');
console.log('  Run /project-sync-dry-run for a full content-aware check by Claude.');

console.log('');
if (internalDelta.length > 0) {
  console.log(`VERDICT: STRUCTURAL ISSUES FOUND`);
  console.log(`  Missing required files: ${internalDelta.length}`);
  console.log(`  Recommended action: Restore missing files, then re-run this check.`);
  console.log(`  For a full content drift check, run /project-sync-dry-run (Coordinator-reviewed).`);
  console.log('');
  console.log('---');
  console.log('No external sync was performed. No files were modified by this script.');
  process.exit(1);
} else {
  console.log('VERDICT: STRUCTURAL CHECK PASSED');
  console.log('  No required project-control files are missing.');
  console.log('  Content freshness was not verified by this script.');
  console.log('  Calendar/task/status currency still requires Coordinator review');
  console.log('  or a future content-aware sync script.');
  console.log('');
  console.log('---');
  console.log('No external sync was performed. No files were modified by this script.');
  process.exit(0);
}
