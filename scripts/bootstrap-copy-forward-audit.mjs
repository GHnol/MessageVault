#!/usr/bin/env node
/**
 * bootstrap-copy-forward-audit.mjs
 *
 * Validates that the AI Project OS Bootstrap Core copy-forward guidance files
 * exist and contain required structural elements. Checks that the
 * universal-vs-project-specific separation is documented, never-copy rules
 * are explicit, and private/local files are gitignored.
 *
 * No external dependencies. No API calls. No external writes. Read-only.
 * Exit 0 = all required items pass. Exit 1 = one or more required items missing.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
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

function checkGitignore(label, target) {
  try {
    const result = execSync(`git check-ignore -v "${target}" 2>&1`, { cwd: ROOT, encoding: 'utf8' });
    if (result.trim()) {
      report.pass.push(`[PASS] ${label} — gitignored`);
    } else {
      report.fail.push(`[FAIL] ${label} — NOT gitignored: ${target}`);
      failures++;
    }
  } catch {
    report.fail.push(`[FAIL] ${label} — NOT gitignored: ${target}`);
    failures++;
  }
}

// --- Copy-forward guidance files ---
checkFile('docs/ai-system/bootstrap-copy-forward-guide.md exists', 'docs/ai-system/bootstrap-copy-forward-guide.md');
checkFile('docs/ai-system/universal-vs-project-specific-map.md exists', 'docs/ai-system/universal-vs-project-specific-map.md');
checkFile('docs/ai-system/puzzle-alignment-checklist.md exists', 'docs/ai-system/puzzle-alignment-checklist.md');
checkFile('docs/ai-system/future-repo-bootstrap-checklist.md exists', 'docs/ai-system/future-repo-bootstrap-checklist.md');

// --- Universal guidance checks ---
checkGrep('bootstrap-copy-forward-guide.md has Universal assets section', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'Universal assets');
checkGrep('bootstrap-copy-forward-guide.md has Project-specific assets section', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'Project-specific assets');
checkGrep('bootstrap-copy-forward-guide.md has never-copy rule', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'must NEVER be copied');
checkGrep('bootstrap-copy-forward-guide.md lists external-sync-map.local.json as never-copy', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'external-sync-map.local.json');
checkGrep('bootstrap-copy-forward-guide.md lists credentials as never-copy', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'google-calendar-credentials.local.json');
checkGrep('bootstrap-copy-forward-guide.md lists raw-transcripts as never-copy', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'raw-transcripts/');
checkGrep('bootstrap-copy-forward-guide.md links to universal-vs-project-specific-map', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'universal-vs-project-specific-map.md');
checkGrep('bootstrap-copy-forward-guide.md links to puzzle-alignment-checklist', 'docs/ai-system/bootstrap-copy-forward-guide.md', 'puzzle-alignment-checklist.md');

// --- Universal-vs-project-specific map checks ---
checkGrep('universal-vs-project-specific-map.md has Universal column', 'docs/ai-system/universal-vs-project-specific-map.md', 'Universal');
checkGrep('universal-vs-project-specific-map.md has Project-specific column', 'docs/ai-system/universal-vs-project-specific-map.md', 'Project-specific');
checkGrep('universal-vs-project-specific-map.md has Local/private column', 'docs/ai-system/universal-vs-project-specific-map.md', 'Local/private');
checkGrep('universal-vs-project-specific-map.md has never-copy column', 'docs/ai-system/universal-vs-project-specific-map.md', 'Never copy?');
checkGrep('universal-vs-project-specific-map.md covers AGENTS.md', 'docs/ai-system/universal-vs-project-specific-map.md', 'AGENTS.md');
checkGrep('universal-vs-project-specific-map.md covers external-sync-map.local.json', 'docs/ai-system/universal-vs-project-specific-map.md', 'external-sync-map.local.json');
checkGrep('universal-vs-project-specific-map.md covers google-calendar-credentials', 'docs/ai-system/universal-vs-project-specific-map.md', 'google-calendar-credentials.local.json');
checkGrep('universal-vs-project-specific-map.md covers scripts/node_modules', 'docs/ai-system/universal-vs-project-specific-map.md', 'scripts/node_modules/');

// --- Puzzle alignment checklist checks ---
checkGrep('puzzle-alignment-checklist.md has what Puzzle already has section', 'docs/ai-system/puzzle-alignment-checklist.md', 'What Puzzle already has');
checkGrep('puzzle-alignment-checklist.md has what Puzzle still needs section', 'docs/ai-system/puzzle-alignment-checklist.md', 'still needs');
checkGrep('puzzle-alignment-checklist.md has what must NOT be copied section', 'docs/ai-system/puzzle-alignment-checklist.md', 'must NOT be copied');
checkGrep('puzzle-alignment-checklist.md has v1.5 Status vocabulary', 'docs/ai-system/puzzle-alignment-checklist.md', 'Done / Shipped');
checkGrep('puzzle-alignment-checklist.md has authorization reminder', 'docs/ai-system/puzzle-alignment-checklist.md', 'requires explicit Coordinator authorization');
checkGrep('puzzle-alignment-checklist.md has Package 4 paused note', 'docs/ai-system/puzzle-alignment-checklist.md', 'Package 4');

// --- Future repo bootstrap checklist checks ---
checkGrep('future-repo-bootstrap-checklist.md has required files section', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'Required files');
checkGrep('future-repo-bootstrap-checklist.md has verification order', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'Verification order');
checkGrep('future-repo-bootstrap-checklist.md has no-secret rules', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'No-secret rules');
checkGrep('future-repo-bootstrap-checklist.md has GitHub Projects as required', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'GitHub Projects (required');
checkGrep('future-repo-bootstrap-checklist.md has Google Calendar as optional', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'optional');
checkGrep('future-repo-bootstrap-checklist.md has OS self-audit requirement', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'OS self-audit requirement');
checkGrep('future-repo-bootstrap-checklist.md has documentation-watch requirement', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'Documentation-watch requirement');
checkGrep('future-repo-bootstrap-checklist.md has setup order', 'docs/ai-system/future-repo-bootstrap-checklist.md', 'Setup order');

// --- Gitignore safety checks (never-copy file patterns) ---
checkGitignore('external-sync-map.local.json gitignored (copy-forward safety)', 'docs/project-control/external-sync-map.local.json');
checkGitignore('local-sync-reports/ gitignored (copy-forward safety)', 'local-sync-reports/example.json');
checkGitignore('raw-transcripts/ gitignored (copy-forward safety)', 'raw-transcripts/example.md');
checkGitignore('local-report-intake/ gitignored (copy-forward safety)', 'local-report-intake/example.md');
checkGitignore('.claude/settings.local.json gitignored (copy-forward safety)', '.claude/settings.local.json');

// --- Skill and command checks ---
checkFile('.claude/skills/bootstrap-copy-forward/SKILL.md exists', '.claude/skills/bootstrap-copy-forward/SKILL.md');
checkFile('.claude/commands/bootstrap-copy-forward.md exists', '.claude/commands/bootstrap-copy-forward.md');
checkGrep('bootstrap-copy-forward SKILL.md has name:', '.claude/skills/bootstrap-copy-forward/SKILL.md', 'name:');
checkGrep('bootstrap-copy-forward SKILL.md has description:', '.claude/skills/bootstrap-copy-forward/SKILL.md', 'description:');
checkGrep('bootstrap-copy-forward SKILL.md references bootstrap-copy-forward-guide.md', '.claude/skills/bootstrap-copy-forward/SKILL.md', 'bootstrap-copy-forward-guide.md');
checkGrep('bootstrap-copy-forward SKILL.md has never-copy safety rule', '.claude/skills/bootstrap-copy-forward/SKILL.md', 'must never be transferred');

// --- Output ---
console.log('\n=== Bootstrap Copy-Forward Audit ===\n');

if (report.fail.length > 0) {
  console.log('FAILURES (must fix before copy-forward):');
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
  console.log('\nVERDICT: Bootstrap copy-forward guidance is complete and valid. Ready for Coordinator authorization.\n');
  process.exit(0);
} else {
  console.log(`\nVERDICT: Bootstrap copy-forward guidance incomplete — ${failures} required item(s) missing.\n`);
  process.exit(1);
}
