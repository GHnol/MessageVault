#!/usr/bin/env node
/**
 * documentation-watch-check.mjs
 *
 * Validates that the AI Project OS documentation-watch framework files exist and
 * contain the required policy elements. Does not browse the internet. Does not
 * install anything. Does not mutate any file.
 *
 * No external dependencies. No API calls. No external writes. Read-only.
 * Exit 0 = all required items pass. Exit 1 = one or more required items missing.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

let failures = 0;
let warnings = 0;
const report = { pass: [], warn: [], fail: [] };

function checkFile(label, path, classification = 'required') {
  const full = join(ROOT, path);
  if (existsSync(full)) {
    report.pass.push(`[PASS] ${label}`);
  } else {
    if (classification === 'required') {
      report.fail.push(`[FAIL] ${label} — missing: ${path}`);
      failures++;
    } else {
      report.warn.push(`[WARN] ${label} — missing (recommended): ${path}`);
      warnings++;
    }
  }
}

function checkGrep(label, path, pattern, classification = 'required') {
  const full = join(ROOT, path);
  if (!existsSync(full)) {
    if (classification === 'required') {
      report.fail.push(`[FAIL] ${label} — file missing: ${path}`);
      failures++;
    } else {
      report.warn.push(`[WARN] ${label} — file missing (recommended): ${path}`);
      warnings++;
    }
    return;
  }
  const content = readFileSync(full, 'utf8');
  if (content.includes(pattern)) {
    report.pass.push(`[PASS] ${label}`);
  } else {
    if (classification === 'required') {
      report.fail.push(`[FAIL] ${label} — pattern not found in ${path}: "${pattern}"`);
      failures++;
    } else {
      report.warn.push(`[WARN] ${label} — pattern not found (recommended): "${pattern}" in ${path}`);
      warnings++;
    }
  }
}

// --- Documentation-watch framework files ---
checkFile('docs/ai-system/documentation-watch-policy.md exists', 'docs/ai-system/documentation-watch-policy.md');
checkFile('docs/ai-system/documentation-watch-sources.md exists', 'docs/ai-system/documentation-watch-sources.md');
checkFile('docs/ai-system/documentation-watch-evaluation-template.md exists', 'docs/ai-system/documentation-watch-evaluation-template.md');
checkFile('docs/ai-system/documentation-watch-log.md exists', 'docs/ai-system/documentation-watch-log.md');

// --- Policy content checks ---
checkGrep('documentation-watch-policy.md defines ADOPT classification', 'docs/ai-system/documentation-watch-policy.md', 'ADOPT');
checkGrep('documentation-watch-policy.md defines DEFER classification', 'docs/ai-system/documentation-watch-policy.md', 'DEFER');
checkGrep('documentation-watch-policy.md defines REJECT classification', 'docs/ai-system/documentation-watch-policy.md', 'REJECT');
checkGrep('documentation-watch-policy.md defines MONITOR classification', 'docs/ai-system/documentation-watch-policy.md', 'MONITOR');
checkGrep('documentation-watch-policy.md has official-source-only rule', 'docs/ai-system/documentation-watch-policy.md', 'Only official docs are authoritative');
checkGrep('documentation-watch-policy.md has scrutinous adoption rule', 'docs/ai-system/documentation-watch-policy.md', 'Scrutinous adoption rule');
checkGrep('documentation-watch-policy.md has browsing boundary', 'docs/ai-system/documentation-watch-policy.md', 'Browsing boundary');
checkGrep('documentation-watch-policy.md has adoption criteria', 'docs/ai-system/documentation-watch-policy.md', 'Adoption criteria');
checkGrep('documentation-watch-policy.md has rejection criteria', 'docs/ai-system/documentation-watch-policy.md', 'Rejection criteria');
checkGrep('documentation-watch-policy.md has cadence definition', 'docs/ai-system/documentation-watch-policy.md', 'Cadence');
checkGrep('documentation-watch-policy.md has trigger events', 'docs/ai-system/documentation-watch-policy.md', 'Trigger events');
checkGrep('documentation-watch-policy.md has approval boundary', 'docs/ai-system/documentation-watch-policy.md', 'Approval boundary');

// --- Sources content checks ---
checkGrep('documentation-watch-sources.md covers Claude Code', 'docs/ai-system/documentation-watch-sources.md', 'Claude Code');
checkGrep('documentation-watch-sources.md covers GitHub Projects', 'docs/ai-system/documentation-watch-sources.md', 'GitHub Projects');
checkGrep('documentation-watch-sources.md covers Google Calendar API', 'docs/ai-system/documentation-watch-sources.md', 'Google Calendar API');
checkGrep('documentation-watch-sources.md covers Node.js', 'docs/ai-system/documentation-watch-sources.md', 'Node.js');

// --- Evaluation template content checks ---
checkGrep('evaluation-template.md has review_id field', 'docs/ai-system/documentation-watch-evaluation-template.md', 'review_id');
checkGrep('evaluation-template.md has classification field', 'docs/ai-system/documentation-watch-evaluation-template.md', 'Classification');
checkGrep('evaluation-template.md has ADOPT option', 'docs/ai-system/documentation-watch-evaluation-template.md', 'ADOPT');
checkGrep('evaluation-template.md has Coordinator approval field', 'docs/ai-system/documentation-watch-evaluation-template.md', 'Coordinator approval status');
checkGrep('evaluation-template.md has adoption criteria section', 'docs/ai-system/documentation-watch-evaluation-template.md', 'Adoption criteria assessment');
checkGrep('evaluation-template.md has rejection criteria section', 'docs/ai-system/documentation-watch-evaluation-template.md', 'Rejection criteria assessment');

// --- Log content checks ---
checkGrep('documentation-watch-log.md has Purpose section', 'docs/ai-system/documentation-watch-log.md', '## Purpose');
checkGrep('documentation-watch-log.md has at least one entry', 'docs/ai-system/documentation-watch-log.md', 'DW-');
checkGrep('documentation-watch-log.md documents no-browsing confirmation', 'docs/ai-system/documentation-watch-log.md', 'No-browsing confirmation');

// --- Skill and command checks ---
checkFile('.claude/skills/documentation-watch/SKILL.md exists', '.claude/skills/documentation-watch/SKILL.md');
checkFile('.claude/commands/documentation-watch.md exists', '.claude/commands/documentation-watch.md');
checkGrep('documentation-watch SKILL.md has name:', '.claude/skills/documentation-watch/SKILL.md', 'name:');
checkGrep('documentation-watch SKILL.md has description:', '.claude/skills/documentation-watch/SKILL.md', 'description:');
checkGrep('documentation-watch SKILL.md has ADOPT classification', '.claude/skills/documentation-watch/SKILL.md', 'ADOPT');
checkGrep('documentation-watch SKILL.md has browsing boundary', '.claude/skills/documentation-watch/SKILL.md', 'browsing');
checkGrep('documentation-watch SKILL.md has scrutinous adoption rule', '.claude/skills/documentation-watch/SKILL.md', 'Scrutinous adoption rule');

// --- Output ---
console.log('\n=== Documentation-Watch Framework Check ===\n');

if (report.fail.length > 0) {
  console.log('FAILURES (must fix):');
  report.fail.forEach(l => console.log(' ', l));
  console.log('');
}

if (report.warn.length > 0) {
  console.log('WARNINGS (recommended):');
  report.warn.forEach(l => console.log(' ', l));
  console.log('');
}

if (report.pass.length > 0) {
  console.log(`PASS: ${report.pass.length} items verified`);
}

console.log('');
console.log(`Summary: ${report.pass.length} pass, ${warnings} warn, ${failures} fail`);

if (failures === 0) {
  console.log('\nVERDICT: Documentation-watch framework is installed and valid.\n');
  process.exit(0);
} else {
  console.log(`\nVERDICT: Documentation-watch framework incomplete — ${failures} required item(s) missing.\n`);
  process.exit(1);
}
