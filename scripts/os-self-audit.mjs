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
  'github-project-setup', 'github-project-template',
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
  'github-project-setup', 'github-project-template',
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

// --- Section 6b: GitHub Projects default board provider layer (AI Project OS v1.3) ---
const githubProjectsDocs = [
  'github-projects-setup-policy.md',
  'github-projects-source-schema.md',
  'github-projects-import-runbook.md',
  'github-projects-field-map.example.json',
  'github-projects-sync-log.md',
];
for (const doc of githubProjectsDocs) {
  checkFile(`docs/project-control/${doc} (GitHub Projects layer)`, `docs/project-control/${doc}`);
}
checkFile('.claude/skills/github-project-setup/SKILL.md', '.claude/skills/github-project-setup/SKILL.md');
checkFile('.claude/commands/github-project-setup.md', '.claude/commands/github-project-setup.md');
const githubProjectsScripts = [
  'github-project-setup-dry-run.mjs',
  'github-project-setup-apply.mjs',
  'github-project-import-issues.mjs',
  'github-project-sync-status.mjs',
  'github-project-field-map.mjs',
];
for (const s of githubProjectsScripts) {
  checkFile(`scripts/${s} (GitHub Projects layer)`, `scripts/${s}`);
}
// Verify the github-project-setup skill has valid frontmatter
checkGrep('github-project-setup SKILL.md has name:', '.claude/skills/github-project-setup/SKILL.md', 'name:');
checkGrep('github-project-setup SKILL.md has description:', '.claude/skills/github-project-setup/SKILL.md', 'description:');
// Verify external-sync-map.example.json includes github_projects section
checkGrep('external-sync-map.example.json has github_projects section', 'docs/project-control/external-sync-map.example.json', 'github_projects');
// Verify project-sync-policy.md names GitHub Projects as default
checkGrep('project-sync-policy.md names GitHub Projects as default', 'docs/project-control/project-sync-policy.md', 'GitHub Projects is the default');

// --- Section 6c: GitHub Projects Live Provisioning layer (AI Project OS v1.4) ---
checkFile('scripts/lib/github-projects-client.mjs (v1.4 client library)', 'scripts/lib/github-projects-client.mjs');
checkFile('docs/project-control/github-projects-source-records.example.json (v1.4 source records example)', 'docs/project-control/github-projects-source-records.example.json');
// Verify client library exports required symbols
checkGrep('github-projects-client.mjs exports probeAuth', 'scripts/lib/github-projects-client.mjs', 'export function probeAuth');
checkGrep('github-projects-client.mjs exports parseSourceRecords', 'scripts/lib/github-projects-client.mjs', 'export function parseSourceRecords');
checkGrep('github-projects-client.mjs uses requireApply guard', 'scripts/lib/github-projects-client.mjs', 'requireApply');
// Verify apply scripts import from client library
checkGrep('github-project-setup-apply.mjs imports from client library', 'scripts/github-project-setup-apply.mjs', './lib/github-projects-client.mjs');
checkGrep('github-project-import-issues.mjs imports from client library', 'scripts/github-project-import-issues.mjs', './lib/github-projects-client.mjs');
// Verify sync-status has --live flag
checkGrep('github-project-sync-status.mjs supports --live flag', 'scripts/github-project-sync-status.mjs', '--live');
// Verify source records example has required fields
checkGrep('source-records.example.json has os_id field', 'docs/project-control/github-projects-source-records.example.json', 'os_id');
checkGrep('source-records.example.json has OS ID marker comment pattern', 'docs/project-control/github-projects-source-records.example.json', 'KMVT-');

// --- Section 6d: GitHub Projects template standard layer (AI Project OS v1.5) ---
checkFile('docs/project-control/github-projects-template-standard.md (v1.5 template standard)', 'docs/project-control/github-projects-template-standard.md');
checkFile('docs/project-control/github-projects-template-copy-runbook.md (v1.5 template runbook)', 'docs/project-control/github-projects-template-copy-runbook.md');
checkFile('docs/project-control/github-projects-template-config.example.json (v1.5 template config example)', 'docs/project-control/github-projects-template-config.example.json');
checkFile('scripts/github-project-template-dry-run.mjs (v1.5 template dry-run)', 'scripts/github-project-template-dry-run.mjs');
checkFile('scripts/github-project-template-validate.mjs (v1.5 template validate)', 'scripts/github-project-template-validate.mjs');
checkFile('scripts/github-project-template-apply.mjs (v1.5 template apply)', 'scripts/github-project-template-apply.mjs');
checkFile('.claude/skills/github-project-template/SKILL.md (v1.5 skill)', '.claude/skills/github-project-template/SKILL.md');
checkFile('.claude/commands/github-project-template.md (v1.5 command)', '.claude/commands/github-project-template.md');
checkGrep('github-project-template SKILL.md has name:', '.claude/skills/github-project-template/SKILL.md', 'name:');
checkGrep('github-project-template SKILL.md has description:', '.claude/skills/github-project-template/SKILL.md', 'description:');
checkGitignore('github-projects-template-config.local.json gitignored', 'docs/project-control/github-projects-template-config.local.json');
checkGrep('template-config.example.json uses placeholder ID', 'docs/project-control/github-projects-template-config.example.json', 'PVT_placeholder');
checkGrep('template-standard.md uses v1.5 status vocabulary', 'docs/project-control/github-projects-template-standard.md', 'Done / Shipped');
checkGrep('github-projects-client.mjs REQUIRED_STATUSES uses v1.5 vocab', 'scripts/lib/github-projects-client.mjs', 'Done / Shipped');
checkGrep('github-projects-client.mjs VALID_STATUSES uses v1.5 vocab', 'scripts/lib/github-projects-client.mjs', 'Waiting / Blocked');
checkGrep('github-projects-setup-policy.md uses v1.5 Status vocabulary', 'docs/project-control/github-projects-setup-policy.md', 'Done / Shipped');

// --- Section 6e: Google Calendar live sync layer (AI Project OS v1.6) ---
checkFile('docs/project-control/google-calendar-source-schema.md (v1.6 schema)', 'docs/project-control/google-calendar-source-schema.md');
checkFile('docs/project-control/google-calendar-source-records.json (v1.6 source records)', 'docs/project-control/google-calendar-source-records.json');
checkFile('docs/project-control/google-calendar-sync-policy.md (v1.6 sync policy)', 'docs/project-control/google-calendar-sync-policy.md');
checkFile('docs/project-control/google-calendar-sync-runbook.md (v1.6 sync runbook)', 'docs/project-control/google-calendar-sync-runbook.md');
checkFile('docs/project-control/google-calendar-credentials.example.md (v1.6 credentials guide)', 'docs/project-control/google-calendar-credentials.example.md');
checkFile('docs/project-control/google-calendar-sync-log.md (v1.6 canonical sync log)', 'docs/project-control/google-calendar-sync-log.md');
checkFile('scripts/google-calendar-source-validate.mjs (v1.6 validator)', 'scripts/google-calendar-source-validate.mjs');
checkFile('scripts/google-calendar-sync-dry-run.mjs (v1.6 dry-run)', 'scripts/google-calendar-sync-dry-run.mjs');
checkFile('scripts/google-calendar-sync-apply.mjs (v1.6 apply)', 'scripts/google-calendar-sync-apply.mjs');
checkFile('scripts/generate-project-calendar.mjs (v1.6 ICS generator)', 'scripts/generate-project-calendar.mjs');
checkFile('.claude/skills/google-calendar-sync/SKILL.md (v1.6 skill)', '.claude/skills/google-calendar-sync/SKILL.md');
checkFile('.claude/commands/google-calendar-sync.md (v1.6 command)', '.claude/commands/google-calendar-sync.md');
checkGrep('google-calendar-sync SKILL.md has name:', '.claude/skills/google-calendar-sync/SKILL.md', 'name:');
checkGrep('google-calendar-sync SKILL.md has description:', '.claude/skills/google-calendar-sync/SKILL.md', 'description:');
checkGitignore('token.json gitignored (v1.6)', 'token.json');
checkGitignore('google-calendar-token.json gitignored (v1.6)', 'google-calendar-token.json');
checkGitignore('canonical credentials.local.json gitignored (v1.6 repair)', 'docs/project-control/google-calendar-credentials.local.json');
checkGitignore('canonical token.local.json gitignored (v1.6 repair)', 'docs/project-control/google-calendar-token.local.json');
checkGitignore('external-sync-map.local.json gitignored (v1.6 verify)', 'docs/project-control/external-sync-map.local.json');
checkFile('scripts/google-calendar-auth-bootstrap.mjs (v1.6 repair OAuth bootstrap)', 'scripts/google-calendar-auth-bootstrap.mjs');
checkGrep('google-calendar-auth-bootstrap.mjs has --auth-status mode', 'scripts/google-calendar-auth-bootstrap.mjs', '--auth-status');
checkGrep('google-calendar-auth-bootstrap.mjs has --init-oauth mode', 'scripts/google-calendar-auth-bootstrap.mjs', '--init-oauth');
checkGrep('google-calendar-sync-dry-run.mjs uses canonical credential path', 'scripts/google-calendar-sync-dry-run.mjs', 'CANONICAL_CREDENTIALS_FILE');
checkGrep('google-calendar-sync-dry-run.mjs has --auth-status mode', 'scripts/google-calendar-sync-dry-run.mjs', '--auth-status');
checkGrep('google-calendar-sync-apply.mjs has --confirm-live-calendar-apply guard', 'scripts/google-calendar-sync-apply.mjs', 'confirm-live-calendar-apply');
checkGrep('google-calendar-sync-apply.mjs has --apply hard stop', 'scripts/google-calendar-sync-apply.mjs', 'hasApply');
checkGrep('google-calendar-source-records.json is valid JSON (grep check)', 'docs/project-control/google-calendar-source-records.json', 'os_id');
checkGrep('google-calendar-source-records.json has AI_OS_ID markers', 'docs/project-control/google-calendar-source-records.json', 'AI_OS_ID:');

// --- Section 6f: State freshness validator layer (AI Project OS v1.7 Gate 2) ---
checkFile('scripts/state-freshness-check.mjs (v1.7 state freshness validator)', 'scripts/state-freshness-check.mjs');
checkGrep('state-freshness-check.mjs supports --json flag', 'scripts/state-freshness-check.mjs', '--json');
checkGrep('state-freshness-check.mjs supports --strict flag', 'scripts/state-freshness-check.mjs', '--strict');
checkGrep('state-freshness-check.mjs has FAIL_WRONG_ACTIVE_BRANCH code', 'scripts/state-freshness-check.mjs', 'FAIL_WRONG_ACTIVE_BRANCH');
checkGrep('state-freshness-check.mjs has FAIL_PACKAGE_5B_UNAUTHORIZED code', 'scripts/state-freshness-check.mjs', 'FAIL_PACKAGE_5B_UNAUTHORIZED');
checkGrep('state-freshness-check.mjs has FAIL_TEST_BASELINE_MATERIAL_MISMATCH code', 'scripts/state-freshness-check.mjs', 'FAIL_TEST_BASELINE_MATERIAL_MISMATCH');
checkGrep('state-freshness-check.mjs has FAIL_LOCAL_PRIVATE_FILE_NOT_IGNORED code', 'scripts/state-freshness-check.mjs', 'FAIL_LOCAL_PRIVATE_FILE_NOT_IGNORED');
checkGrep('state-freshness-check.mjs has WARN_HEAD_HASH_LAG code', 'scripts/state-freshness-check.mjs', 'WARN_HEAD_HASH_LAG');
checkGrep('state-freshness-check.mjs does not make external API calls', 'scripts/state-freshness-check.mjs', 'No external dependencies. No API calls. No external writes.');
checkGrep('closeout-sync-contract.md has state-sync decision matrix', 'docs/dev/closeout-sync-contract.md', 'State-Sync Decision Matrix');
checkGrep('closeout-sync-contract.md references state-freshness-check.mjs', 'docs/dev/closeout-sync-contract.md', 'state-freshness-check.mjs');
checkGrep('closeout SKILL.md references state-freshness-check.mjs', '.claude/skills/closeout/SKILL.md', 'state-freshness-check.mjs');
checkGrep('precommit SKILL.md references state-freshness-check.mjs', '.claude/skills/precommit/SKILL.md', 'state-freshness-check.mjs');

// --- Section 6g: Report mirroring intake layer (AI Project OS v1.7 Gate 3) ---
checkFile('scripts/report-mirror-intake.mjs (v1.7 report mirror intake script)', 'scripts/report-mirror-intake.mjs');
checkFile('docs/project-control/report-mirror-policy.md (v1.7 report mirror policy)', 'docs/project-control/report-mirror-policy.md');
checkFile('docs/project-control/report-mirror-schema.md (v1.7 report mirror schema)', 'docs/project-control/report-mirror-schema.md');
checkFile('docs/project-control/report-mirror-log.md (v1.7 report mirror log)', 'docs/project-control/report-mirror-log.md');
checkFile('docs/project-control/report-intake-runbook.md (v1.7 report intake runbook)', 'docs/project-control/report-intake-runbook.md');
checkFile('.claude/skills/report-intake/SKILL.md (v1.7 report-intake skill)', '.claude/skills/report-intake/SKILL.md');
checkFile('.claude/commands/report-intake.md (v1.7 report-intake command)', '.claude/commands/report-intake.md');
checkGrep('report-mirror-intake.mjs supports --apply flag', 'scripts/report-mirror-intake.mjs', '--apply');
checkGrep('report-mirror-intake.mjs supports --dry-run / default dry-run', 'scripts/report-mirror-intake.mjs', 'DRY_RUN');
checkGrep('report-mirror-intake.mjs supports --stdin', 'scripts/report-mirror-intake.mjs', '--stdin');
checkGrep('report-mirror-intake.mjs supports --input flag', 'scripts/report-mirror-intake.mjs', '--input');
checkGrep('report-mirror-intake.mjs has redaction for ghp_ tokens', 'scripts/report-mirror-intake.mjs', 'ghp_');
checkGrep('report-mirror-intake.mjs has redaction for github_pat_ tokens', 'scripts/report-mirror-intake.mjs', 'github_pat_');
checkGrep('report-mirror-intake.mjs has redaction for PEM private key blocks', 'scripts/report-mirror-intake.mjs', 'BEGIN');
checkGrep('report-mirror-intake.mjs never prints secret values (HIGH_RISK_PATTERNS)', 'scripts/report-mirror-intake.mjs', 'HIGH_RISK_PATTERNS');
checkGrep('report-mirror-log.md has Purpose section', 'docs/project-control/report-mirror-log.md', '## Purpose');
checkGrep('report-mirror-policy.md explains mirroring vs not mirroring', 'docs/project-control/report-mirror-policy.md', 'What is mirrored vs what is not');
checkGrep('closeout-sync-contract.md has report mirroring requirement', 'docs/dev/closeout-sync-contract.md', 'Report mirroring requirement');
checkGitignore('local-reports/ gitignored (v1.7 Gate 3)', 'local-reports/example.md');
checkGitignore('local-report-intake/ gitignored (v1.7 Gate 3)', 'local-report-intake/example.md');
checkGrep('closeout SKILL.md references report-mirror-intake.mjs', '.claude/skills/closeout/SKILL.md', 'report-mirror-intake.mjs');
checkGrep('handoff SKILL.md references report-mirror-intake.mjs', '.claude/skills/handoff/SKILL.md', 'report-mirror-intake.mjs');

// --- Section 6h: Start router layer (AI Project OS v1.7 Gate 4) ---
checkFile('scripts/start-router.mjs (v1.7 start router)', 'scripts/start-router.mjs');
checkGrep('start-router.mjs supports --json flag', 'scripts/start-router.mjs', '--json');
checkGrep('start-router.mjs supports --explain flag', 'scripts/start-router.mjs', '--explain');
checkGrep('start-router.mjs supports --mode flag', 'scripts/start-router.mjs', '--mode');
checkGrep('start-router.mjs has READY_FRESH_START verdict', 'scripts/start-router.mjs', 'READY_FRESH_START');
checkGrep('start-router.mjs has READY_CONTINUE verdict', 'scripts/start-router.mjs', 'READY_CONTINUE');
checkGrep('start-router.mjs has NEEDS_HANDOFF_UPDATE verdict', 'scripts/start-router.mjs', 'NEEDS_HANDOFF_UPDATE');
checkGrep('start-router.mjs has BLOCKED_DIRTY_TREE verdict', 'scripts/start-router.mjs', 'BLOCKED_DIRTY_TREE');
checkGrep('start-router.mjs has BLOCKED_PACKAGE_UNAUTHORIZED verdict', 'scripts/start-router.mjs', 'BLOCKED_PACKAGE_UNAUTHORIZED');
checkGrep('start-router.mjs has BLOCKED_EXTERNAL_SYNC_RISK verdict', 'scripts/start-router.mjs', 'BLOCKED_EXTERNAL_SYNC_RISK');
checkGrep('start-router.mjs has NEEDS_COORDINATOR_DECISION verdict', 'scripts/start-router.mjs', 'NEEDS_COORDINATOR_DECISION');
checkGrep('start-router.mjs declares no external API calls', 'scripts/start-router.mjs', 'No external API calls. No file writes. No mutations');
checkFile('.claude/skills/start-router/SKILL.md (v1.7 start-router skill)', '.claude/skills/start-router/SKILL.md');
checkFile('.claude/commands/start-router.md (v1.7 start-router command)', '.claude/commands/start-router.md');
checkGrep('start SKILL.md references start-router.mjs', '.claude/skills/start/SKILL.md', 'start-router.mjs');
checkGrep('session-restart-protocol.md references start-router.mjs', 'docs/dev/session-restart-protocol.md', 'start-router.mjs');
checkGrep('auto-management-protocol.md references /start-router command', 'docs/dev/auto-management-protocol.md', '/start-router');
checkGrep('model-routing-protocol.md has scrutinous adoption rule', 'docs/dev/model-routing-protocol.md', 'Scrutinous adoption rule');
checkGrep('model-routing-protocol.md has Plan Mode section', 'docs/dev/model-routing-protocol.md', 'Plan Mode and opusplan');
checkGrep('model-routing-protocol.md rejects opusplan', 'docs/dev/model-routing-protocol.md', 'opusplan');
checkGrep('model-routing-protocol.md has tier-based routing (not brittle model IDs)', 'docs/dev/model-routing-protocol.md', 'Model ID rule');
checkGitignore('raw-transcripts/ gitignored (v1.7 Gate 4)', 'raw-transcripts/example.md');

// --- Section 6i: External sync consistency validator layer (AI Project OS v1.7 Gate 5) ---
checkFile('scripts/external-sync-consistency-check.mjs (v1.7 external sync consistency validator)', 'scripts/external-sync-consistency-check.mjs');
checkGrep('external-sync-consistency-check.mjs supports --json flag', 'scripts/external-sync-consistency-check.mjs', '--json');
checkGrep('external-sync-consistency-check.mjs supports --local-only flag', 'scripts/external-sync-consistency-check.mjs', '--local-only');
checkGrep('external-sync-consistency-check.mjs supports --fixture flag', 'scripts/external-sync-consistency-check.mjs', '--fixture');
checkGrep('external-sync-consistency-check.mjs supports --live-readonly flag', 'scripts/external-sync-consistency-check.mjs', '--live-readonly');
checkGrep('external-sync-consistency-check.mjs supports --google-calendar flag', 'scripts/external-sync-consistency-check.mjs', '--google-calendar');
checkGrep('external-sync-consistency-check.mjs supports --github-projects flag', 'scripts/external-sync-consistency-check.mjs', '--github-projects');
checkGrep('external-sync-consistency-check.mjs has PASS_GCAL_SOURCE_RECORDS_VALID code', 'scripts/external-sync-consistency-check.mjs', 'PASS_GCAL_SOURCE_RECORDS_VALID');
checkGrep('external-sync-consistency-check.mjs has FAIL_GCAL_SOURCE_INVALID code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_GCAL_SOURCE_INVALID');
checkGrep('external-sync-consistency-check.mjs has FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY');
checkGrep('external-sync-consistency-check.mjs has FAIL_GCAL_DUPLICATE_DETECTED code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_GCAL_DUPLICATE_DETECTED');
checkGrep('external-sync-consistency-check.mjs has PASS_GHP_SOURCE_RECORDS_VALID code', 'scripts/external-sync-consistency-check.mjs', 'PASS_GHP_SOURCE_RECORDS_VALID');
checkGrep('external-sync-consistency-check.mjs has FAIL_GHP_SOURCE_INVALID code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_GHP_SOURCE_INVALID');
checkGrep('external-sync-consistency-check.mjs has FAIL_GHP_FIELD_VALUE_DRIFT code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_GHP_FIELD_VALUE_DRIFT');
checkGrep('external-sync-consistency-check.mjs has FAIL_GHP_DUPLICATE_OS_ID code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_GHP_DUPLICATE_OS_ID');
checkGrep('external-sync-consistency-check.mjs has PASS_EXTERNAL_LOCAL_PRIVATE_PATHS_IGNORED code', 'scripts/external-sync-consistency-check.mjs', 'PASS_EXTERNAL_LOCAL_PRIVATE_PATHS_IGNORED');
checkGrep('external-sync-consistency-check.mjs has FAIL_EXTERNAL_SYNC_MAP_IN_GIT_STATUS code', 'scripts/external-sync-consistency-check.mjs', 'FAIL_EXTERNAL_SYNC_MAP_IN_GIT_STATUS');
checkGrep('external-sync-consistency-check.mjs never prints raw local map contents', 'scripts/external-sync-consistency-check.mjs', 'no raw contents printed');
checkGrep('external-sync-consistency-check.mjs confirms no mutation occurred', 'scripts/external-sync-consistency-check.mjs', 'no_mutation_occurred');
checkFile('docs/project-control/external-sync-consistency-policy.md (v1.7 consistency policy)', 'docs/project-control/external-sync-consistency-policy.md');
checkFile('docs/project-control/external-sync-consistency-schema.md (v1.7 consistency schema)', 'docs/project-control/external-sync-consistency-schema.md');
checkFile('docs/project-control/external-sync-consistency-log.md (v1.7 consistency log)', 'docs/project-control/external-sync-consistency-log.md');
checkFile('docs/project-control/external-sync-consistency-fixture.example.json (v1.7 fixture)', 'docs/project-control/external-sync-consistency-fixture.example.json');
checkFile('.claude/skills/external-sync-consistency/SKILL.md (v1.7 external-sync-consistency skill)', '.claude/skills/external-sync-consistency/SKILL.md');
checkFile('.claude/commands/external-sync-consistency.md (v1.7 external-sync-consistency command)', '.claude/commands/external-sync-consistency.md');
checkGrep('external-sync-consistency SKILL.md has name:', '.claude/skills/external-sync-consistency/SKILL.md', 'name:');
checkGrep('external-sync-consistency SKILL.md has description:', '.claude/skills/external-sync-consistency/SKILL.md', 'description:');
checkGrep('closeout SKILL.md references external-sync-consistency-check.mjs', '.claude/skills/closeout/SKILL.md', 'external-sync-consistency-check.mjs');
checkGrep('precommit SKILL.md references external-sync-consistency-check.mjs', '.claude/skills/precommit/SKILL.md', 'external-sync-consistency-check.mjs');
checkGrep('closeout-sync-contract.md has external sync consistency requirement', 'docs/dev/closeout-sync-contract.md', 'External sync consistency requirement');

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
