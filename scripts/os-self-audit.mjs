#!/usr/bin/env node
/**
 * OS Self-Audit Script
 *
 * Checks that the repo has all required AI Project OS files, skills, commands,
 * docs, gitignore protections, and policy cross-references.
 *
 * No dependencies. No API calls. No external writes. Read-only local file checks.
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

// --- Section 1: Root continuity files ---
checkFile('AGENTS.md', 'AGENTS.md');
checkFile('CLAUDE.md', 'CLAUDE.md');
checkFile('AI_HANDOFF.md', 'AI_HANDOFF.md');
checkFile('CURRENT_STATE.md', 'CURRENT_STATE.md');
checkFile('NEXT_SESSION_PROMPT.md', 'NEXT_SESSION_PROMPT.md');

// --- Section 2: Tool layer ---
const commands = [
  'start', 'handoff', 'precommit', 'closeout', 'package-start',
  'switch-to-codex', 'switch-to-claude', 'weekly-sync', 'status-summary',
  'os-audit', 'project-sync-dry-run', 'project-sync-apply', 'notification-setup-wizard',
];
checkFile('.claude/commands/README.md', '.claude/commands/README.md');
for (const cmd of commands) {
  checkFile(`.claude/commands/${cmd}.md`, `.claude/commands/${cmd}.md`);
}
checkFile('.codex/README.md', '.codex/README.md');

// --- Section 3: Skills ---
const skills = [
  'start', 'handoff', 'precommit', 'closeout', 'package-start',
  'switch-to-codex', 'switch-to-claude', 'weekly-sync', 'status-summary',
  'os-audit', 'project-sync-dry-run', 'project-sync-apply', 'notification-setup-wizard',
];
for (const skill of skills) {
  const path = `.claude/skills/${skill}/SKILL.md`;
  checkFile(`.claude/skills/${skill}/SKILL.md`, path);
  if (existsSync(join(ROOT, path))) {
    checkGrep(`SKILL.md frontmatter: ${skill}`, path, 'name:');
    checkGrep(`SKILL.md description: ${skill}`, path, 'description:');
  }
}

// --- Section 4: AI system layer ---
checkFile('docs/ai-system/README.md', 'docs/ai-system/README.md');
checkFile('docs/ai-system/universal-standards.md', 'docs/ai-system/universal-standards.md');
checkFile('docs/ai-system/bootstrap-template.md', 'docs/ai-system/bootstrap-template.md');
checkFile('docs/ai-system/CHANGELOG.md', 'docs/ai-system/CHANGELOG.md');
checkFile('docs/ai-system/version-history.md', 'docs/ai-system/version-history.md');
checkFile('docs/ai-system/os-self-audit-checklist.md', 'docs/ai-system/os-self-audit-checklist.md');

// --- Section 5: Dev protocols ---
const devDocs = [
  'auto-management-protocol.md', 'package-boundary-closeout-protocol.md',
  'session-restart-protocol.md', 'closeout-sync-contract.md', 'notification-setup.md',
];
for (const doc of devDocs) {
  checkFile(`docs/dev/${doc}`, `docs/dev/${doc}`);
}
const devDocsRecommended = [
  'model-routing-protocol.md', 'token-efficiency-protocol.md', 'tool-batching-protocol.md',
];
for (const doc of devDocsRecommended) {
  checkFile(`docs/dev/${doc}`, `docs/dev/${doc}`, 'recommended');
}

// --- Section 6: Project control sync foundation ---
const syncDocs = [
  'project-sync-policy.md', 'project-sync-dry-run-format.md',
  'external-sync-safety.md', 'external-sync-map.example.json',
  'project-sync-log.md', 'calendar-sync-policy.md',
];
for (const doc of syncDocs) {
  checkFile(`docs/project-control/${doc}`, `docs/project-control/${doc}`);
}

// --- Section 7: QA templates ---
const qaDocs = [
  'pre-commit-verification-template.md', 'package-verification-template.md', 'test-strategy.md',
];
for (const doc of qaDocs) {
  checkFile(`docs/qa/${doc}`, `docs/qa/${doc}`);
}

// --- Section 8: Gitignore protections ---
checkGitignore('.claude/settings.local.json gitignored', '.claude/settings.local.json');
checkGitignore('.env gitignored', '.env');
checkGitignore('external-sync-map.local.json gitignored', 'docs/project-control/external-sync-map.local.json');

// --- Section 9: Post-Commit State Rule cross-references ---
checkGrep('Post-Commit State Rule in universal-standards.md', 'docs/ai-system/universal-standards.md', 'Post-Commit State Rule');
checkGrep('Post-Commit State Rule in package-boundary-closeout-protocol.md', 'docs/dev/package-boundary-closeout-protocol.md', 'Post-Commit State Rule');
checkGrep('Post-Commit State Rule in auto-management-protocol.md', 'docs/dev/auto-management-protocol.md', 'Post-Commit State Rule');

// --- Output ---
console.log('\n=== AI Project OS Self-Audit ===\n');

if (report.fail.length > 0) {
  console.log('FAILURES (must fix before claiming bootstrap complete):');
  report.fail.forEach(l => console.log(' ', l));
  console.log('');
}

if (report.warn.length > 0) {
  console.log('WARNINGS (recommended; flag but do not block):');
  report.warn.forEach(l => console.log(' ', l));
  console.log('');
}

if (report.pass.length > 0) {
  console.log(`PASS: ${report.pass.length} items verified`);
}

console.log('');
console.log(`Summary: ${report.pass.length} pass, ${warnings} warn, ${failures} fail`);

if (failures === 0) {
  console.log('\nVERDICT: BOOTSTRAP COMPLETE — all required items pass.\n');
  process.exit(0);
} else {
  console.log(`\nVERDICT: BOOTSTRAP INCOMPLETE — ${failures} required item(s) missing.\n`);
  process.exit(1);
}
