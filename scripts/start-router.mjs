#!/usr/bin/env node
/**
 * Start Router — AI Project OS v1.7 Gate 4 (updated Gate 5)
 *
 * Inspects repo state and recommends the appropriate session startup route:
 * fresh session, continuation, handoff update, state sync, or blocked condition.
 *
 * No external dependencies. Node built-ins only.
 * No external API calls. No file writes. No mutations of any kind. Read-only.
 *
 * Usage:
 *   node scripts/start-router.mjs
 *   node scripts/start-router.mjs --json
 *   node scripts/start-router.mjs --explain
 *   node scripts/start-router.mjs --paths
 *   node scripts/start-router.mjs --mode fresh
 *   node scripts/start-router.mjs --mode continue
 *   node scripts/start-router.mjs --mode handoff
 *   node scripts/start-router.mjs --mode package-start
 *   node scripts/start-router.mjs --strict
 *   node scripts/start-router.mjs --recommend-model
 *   node scripts/start-router.mjs --context-risk
 *
 * Exit codes:
 *   0  READY_FRESH_START or READY_CONTINUE (safe to proceed)
 *   1  BLOCKED_* or NEEDS_* verdict, or any FAILs (action required)
 *
 * Verdicts:
 *   READY_FRESH_START         branch is main, clean, no active package, Package 5B blocked, 0 FAILs
 *   READY_CONTINUE            authorized branch, state files agree, 0 FAILs
 *   NEEDS_HANDOFF_UPDATE      active branch but state docs do not describe current work
 *   NEEDS_STATE_SYNC          closeout appears complete but docs point to wrong state
 *   BLOCKED_DIRTY_TREE        main branch with dirty working tree (no private files)
 *   BLOCKED_WRONG_BRANCH      branch mismatch and no handoff explains why
 *   BLOCKED_PACKAGE_UNAUTHORIZED  Package 5B or product package active without Coordinator auth
 *   BLOCKED_EXTERNAL_SYNC_RISK   private/local files exposed or external apply may be pending
 *   NEEDS_COORDINATOR_DECISION    no active package; OS gates in progress; needs Coordinator choice
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// No external dependencies. No API calls. No external writes. Read-only.

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Start Router — AI Project OS v1.7 Gate 4

Usage:
  node scripts/start-router.mjs [options]

Options:
  --json              JSON output
  --explain           Show route rule explanations
  --paths             Show inspected file paths and their existence
  --mode <mode>       Override route context: fresh | continue | handoff | package-start
  --strict            Exit 1 on any WARN (not just FAILs)
  --recommend-model   Include model tier + context risk in output
  --context-risk      Include context risk assessment
  --help              Show this help

Verdicts:
  READY_FRESH_START         Safe to start a fresh session from repo truth
  READY_CONTINUE            Safe to continue current in-progress work
  NEEDS_HANDOFF_UPDATE      Update AI_HANDOFF.md before switching or continuing
  NEEDS_STATE_SYNC          State docs are operationally misleading — run /project-sync-dry-run
  BLOCKED_DIRTY_TREE        Dirty working tree on main branch
  BLOCKED_WRONG_BRANCH      Branch mismatch with no handoff explanation
  BLOCKED_PACKAGE_UNAUTHORIZED  Package 5B or product package unauthorized
  BLOCKED_EXTERNAL_SYNC_RISK   Private files exposed or external apply pending
  NEEDS_COORDINATOR_DECISION    OS work in flight; next step requires Coordinator choice
`);
  process.exit(0);
}

const JSON_MODE       = args.includes('--json');
const EXPLAIN         = args.includes('--explain');
const SHOW_PATHS      = args.includes('--paths');
const STRICT          = args.includes('--strict');
const RECOMMEND_MODEL = args.includes('--recommend-model');
const CONTEXT_RISK    = args.includes('--context-risk');

const modeIdx = args.indexOf('--mode');
const MODE = modeIdx >= 0 && args[modeIdx + 1] ? args[modeIdx + 1] : null;
const VALID_MODES = ['fresh', 'continue', 'handoff', 'package-start'];
if (MODE && !VALID_MODES.includes(MODE)) {
  if (!JSON_MODE) console.error(`Unknown --mode "${MODE}". Valid modes: ${VALID_MODES.join(', ')}`);
  process.exit(1);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function readFileSafe(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try { return readFileSync(full, 'utf8'); } catch { return null; }
}

function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { return ''; }
}

function extract(content, pattern) {
  if (!content) return null;
  const m = content.match(pattern);
  return m ? m[1].trim() : null;
}

function firstMatch(content, patterns) {
  if (!content) return null;
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// ── Git state ──────────────────────────────────────────────────────────────────

const currentBranch = runGit('git branch --show-current');
const currentHead   = runGit('git rev-parse HEAD');
const shortHead     = currentHead.slice(0, 7);
const gitStatus     = runGit('git status --short');
const isDirty       = gitStatus.length > 0;
const recentLog     = runGit('git log --oneline -12');

// Private/local file patterns that must not appear in git status
const PRIVATE_FILE_PATTERNS = [
  'external-sync-map.local.json',
  'google-calendar-token.local.json',
  'google-calendar-credentials.local.json',
  'local-sync-reports/',
  'local-report-intake/',
  'raw-transcripts/',
  '.env',
  '/token.json',
  'settings.local.json',
];
const privateFilesInStatus = PRIVATE_FILE_PATTERNS.filter(p => gitStatus.includes(p));
const hasExposedPrivateFiles = privateFilesInStatus.length > 0;

// ── Read durable state files ───────────────────────────────────────────────────

const INSPECTED_PATHS = [
  'AI_HANDOFF.md',
  'CURRENT_STATE.md',
  'NEXT_SESSION_PROMPT.md',
  'docs/project-control/current-sprint.md',
  'docs/project-control/kanban-board.md',
  'docs/project-control/report-mirror-log.md',
  'docs/project-control/project-sync-log.md',
  'docs/project-control/google-calendar-sync-log.md',
  'docs/project-control/github-projects-sync-log.md',
];

const handoffContent      = readFileSafe('AI_HANDOFF.md');
const stateContent        = readFileSafe('CURRENT_STATE.md');
const nextPromptContent   = readFileSafe('NEXT_SESSION_PROMPT.md');
const sprintContent       = readFileSafe('docs/project-control/current-sprint.md');
const kanbanContent       = readFileSafe('docs/project-control/kanban-board.md');
const mirrorLogContent    = readFileSafe('docs/project-control/report-mirror-log.md');
const syncLogContent      = readFileSafe('docs/project-control/project-sync-log.md');
const calSyncLogContent   = readFileSafe('docs/project-control/google-calendar-sync-log.md');
const ghSyncLogContent    = readFileSafe('docs/project-control/github-projects-sync-log.md');

// ── Extract fields from state docs ────────────────────────────────────────────

// AI_HANDOFF.md
const handoffStatus = extract(handoffContent, /\*\*Status:\*\*\s*`([^`]+)`/);
const handoffBranch = firstMatch(handoffContent, [
  /\|\s*\*\*Active branch\*\*\s*\|\s*`([^`]+)`/,
  /\|\s*Active branch\s*\|\s*`([^`]+)`/,
]);
const handoffActivePass = firstMatch(handoffContent, [
  /\|\s*\*\*Active pass\*\*\s*\|\s*([^\n|]+)/,
]);
const handoffActivePackage = firstMatch(handoffContent, [
  /\|\s*\*\*Active package\*\*\s*\|\s*([^\n|]+)/,
  /\|\s*Active package\s*\|\s*([^\n|]+)/,
]);

const handoffIsComplete = Boolean(handoffStatus && /complete|closed|idle|none/i.test(handoffStatus));
const handoffIsActive   = Boolean(handoffStatus && /active|in.progress|in_progress/i.test(handoffStatus));

// Package 5B detection
const package5BBlocked = Boolean(
  handoffContent && /Package 5B[^`\n]*(?:not started|blocked)/i.test(handoffContent)
);
const package5BUnauthorized = Boolean(
  handoffActivePackage && /package 5b/i.test(handoffActivePackage) &&
  !/blocked|not started/i.test(handoffActivePackage)
);

// CURRENT_STATE.md
const stateActiveBranch = firstMatch(stateContent, [
  /\|\s*Active branch\s*\|\s*`([^`]+)`/,
  /\|\s*\*\*Active branch\*\*\s*\|\s*`([^`]+)`/,
]);
const stateActivePackage = firstMatch(stateContent, [
  /\|\s*Active package\s*\|\s*([^\n|]+)/,
  /\|\s*\*\*Active package\*\*\s*\|\s*([^\n|]+)/,
]);

// Latest completed OS gate
const latestGateText = firstMatch(stateContent, [
  /\|\s*Last completed pass\s*\|\s*([^\n|]+)/,
  /\|\s*\*\*Last completed pass\*\*\s*\|\s*([^\n|]+)/,
]) || firstMatch(handoffContent, [
  /\|\s*Last completed pass\s*\|\s*([^\n|]+)/,
]) || 'unknown (check AI_HANDOFF.md and CURRENT_STATE.md)';

// Sprint state
const gate3InProgress  = Boolean(sprintContent && /gate 3[^)]*in progress/i.test(sprintContent));
const gate4InProgress  = Boolean(sprintContent && /gate 4[^)]*in progress/i.test(sprintContent));
const gate4Queued      = Boolean(sprintContent && /gate 4[^)]*queued/i.test(sprintContent));
const gate5InProgress  = Boolean(sprintContent && /gate 5[^)]*in progress/i.test(sprintContent));
const gate5Queued      = Boolean(sprintContent && /gate 5[^)]*queued/i.test(sprintContent));

// Kanban In Progress
const inProgressSection = kanbanContent
  ? kanbanContent.match(/### In Progress\n([\s\S]*?)(?:\n###|$)/)
  : null;
const inProgressText = inProgressSection ? inProgressSection[1] : '';
const kanbanHasGate3Branch = /ai-project-os-v1-7-report-mirroring-intake/.test(inProgressText);

// Report mirror log
const mirrorHasEntries = Boolean(mirrorLogContent && mirrorLogContent.includes('report_id'));

// External sync risk signals (beyond private files in status)
const externalApplyMentioned = Boolean(
  handoffContent && /external apply[^.]*pending/i.test(handoffContent)
);

// ── Branch classification ──────────────────────────────────────────────────────

const isOnMain              = currentBranch === 'main';
const isOnGateBranch        = /^docs\/ai-project-os-v1-7-/.test(currentBranch);
const isOnTaskBranch        = /^(task|fix|docs)\//.test(currentBranch);
const branchMatchesHandoff  = !handoffBranch || handoffBranch === currentBranch;

// ── Build FAIL and WARN lists ──────────────────────────────────────────────────

const fails = [];
const warns = [];

if (hasExposedPrivateFiles) {
  fails.push({
    code: 'FAIL_PRIVATE_FILES_EXPOSED',
    message: `Private/local files visible in git status: ${privateFilesInStatus.join(', ')}. Verify gitignore protections before proceeding.`,
  });
}

if (package5BUnauthorized) {
  fails.push({
    code: 'FAIL_PACKAGE_5B_UNAUTHORIZED',
    message: 'Package 5B is shown as active without a "blocked" or "not started" qualifier. Requires explicit Coordinator authorization.',
  });
}

if (!branchMatchesHandoff && handoffBranch && handoffBranch !== 'main' && handoffIsActive) {
  warns.push({
    code: 'WARN_BRANCH_MISMATCH',
    message: `AI_HANDOFF.md records branch '${handoffBranch}' but current branch is '${currentBranch}'.`,
  });
}

if (handoffIsActive && isOnMain && !isDirty && handoffBranch && handoffBranch !== 'main') {
  warns.push({
    code: 'WARN_ACTIVE_HANDOFF_ON_MAIN',
    message: `AI_HANDOFF.md shows active work on '${handoffBranch}' but current branch is main (clean tree). State sync may be needed.`,
  });
}

if (kanbanHasGate3Branch && !gate3InProgress) {
  warns.push({
    code: 'WARN_KANBAN_STALE_IN_PROGRESS',
    message: 'Kanban In Progress references Gate 3 branch — may be stale after merge.',
  });
}

// ── Determine verdict ──────────────────────────────────────────────────────────

function determineVerdict() {
  // BLOCKED: private files exposed (highest severity)
  if (hasExposedPrivateFiles) return 'BLOCKED_EXTERNAL_SYNC_RISK';

  // BLOCKED: Package 5B unauthorized
  if (package5BUnauthorized) return 'BLOCKED_PACKAGE_UNAUTHORIZED';

  // BLOCKED: external apply pending
  if (externalApplyMentioned && !handoffIsComplete) return 'BLOCKED_EXTERNAL_SYNC_RISK';

  // BLOCKED: dirty main branch (no private files — already handled above)
  if (isOnMain && isDirty) return 'BLOCKED_DIRTY_TREE';

  // BLOCKED: branch mismatch when handoff is active and branch is not main
  if (!branchMatchesHandoff && handoffIsActive && handoffBranch && handoffBranch !== 'main') {
    // If current branch is a gate branch and handoff explicitly names a different gate branch
    if (isOnGateBranch && handoffBranch !== currentBranch && handoffBranch !== 'main') {
      return 'BLOCKED_WRONG_BRANCH';
    }
    // If current branch is completely unrelated to handoff
    if (!isOnGateBranch && !isOnTaskBranch) {
      return 'BLOCKED_WRONG_BRANCH';
    }
  }

  // NEEDS_HANDOFF_UPDATE: on a gate/task branch but handoff doesn't describe this branch
  if (isOnGateBranch && handoffBranch && handoffBranch !== currentBranch) {
    return 'NEEDS_HANDOFF_UPDATE';
  }
  if (isOnTaskBranch && !isOnGateBranch && handoffBranch && handoffBranch !== currentBranch && handoffIsActive) {
    return 'NEEDS_HANDOFF_UPDATE';
  }

  // READY_CONTINUE: on an authorized gate or task branch, handoff agrees
  if ((isOnGateBranch || isOnTaskBranch) && branchMatchesHandoff) {
    return 'READY_CONTINUE';
  }

  // On main, clean tree
  if (isOnMain && !isDirty) {
    // State docs still point to a non-main active branch (operationally misleading)
    if (stateActiveBranch && stateActiveBranch !== 'main' && !handoffIsComplete) {
      return 'NEEDS_STATE_SYNC';
    }
    // Active handoff on another branch but we're on main (clean) — state needs sync
    if (handoffIsActive && handoffBranch && handoffBranch !== 'main') {
      return 'NEEDS_STATE_SYNC';
    }
    // OS work queued or in progress — Coordinator needs to authorize next step
    if (gate4InProgress || gate4Queued || gate3InProgress || gate5InProgress || gate5Queued) {
      return 'NEEDS_COORDINATOR_DECISION';
    }
    // Clean state — ready for fresh start
    return 'READY_FRESH_START';
  }

  return 'NEEDS_COORDINATOR_DECISION';
}

const baseVerdict = determineVerdict();

// Apply --mode override (adjusts recommendation context, not actual safety check)
function applyModeOverride(v) {
  if (!MODE) return v;
  // Mode overrides only affect READY/NEEDS verdicts — BLOCKED verdicts always stand
  if (v.startsWith('BLOCKED_')) return v;
  switch (MODE) {
    case 'fresh':         return 'READY_FRESH_START';
    case 'continue':      return fails.length > 0 ? v : 'READY_CONTINUE';
    case 'handoff':       return 'NEEDS_HANDOFF_UPDATE';
    case 'package-start': return package5BUnauthorized ? 'BLOCKED_PACKAGE_UNAUTHORIZED' : 'READY_FRESH_START';
    default:              return v;
  }
}

const verdict = applyModeOverride(baseVerdict);

// ── Route recommendation per verdict ──────────────────────────────────────────

const ROUTE_MAP = {
  READY_FRESH_START: {
    route: 'Fresh session from repo truth',
    files_to_read: ['AGENTS.md', 'CLAUDE.md', 'AI_HANDOFF.md', 'CURRENT_STATE.md', 'docs/ai-system/README.md', 'docs/dev/auto-management-protocol.md'],
    command: '/start',
    context: 'fresh_session',
    model_tier: 'default',
    plan_mode: 'optional',
    tool: 'Claude or Codex',
  },
  READY_CONTINUE: {
    route: 'Continue current in-progress work',
    files_to_read: ['AI_HANDOFF.md', 'CURRENT_STATE.md'],
    command: 'Continue — verify handoff is current, then proceed',
    context: 'continue_current_session',
    model_tier: 'default',
    plan_mode: 'optional',
    tool: 'Claude',
  },
  NEEDS_HANDOFF_UPDATE: {
    route: 'Update AI_HANDOFF.md before switching or continuing',
    files_to_read: ['AI_HANDOFF.md', 'CURRENT_STATE.md', 'NEXT_SESSION_PROMPT.md'],
    command: '/handoff',
    context: 'handoff_before_switch',
    model_tier: 'default',
    plan_mode: 'avoid',
    tool: 'Claude',
  },
  NEEDS_STATE_SYNC: {
    route: 'Run internal sync check — state docs may be operationally misleading',
    files_to_read: ['AI_HANDOFF.md', 'CURRENT_STATE.md', 'docs/project-control/current-sprint.md', 'docs/project-control/kanban-board.md'],
    command: 'node scripts/state-freshness-check.mjs then /project-sync-dry-run',
    context: 'compact_first',
    model_tier: 'default',
    plan_mode: 'optional',
    tool: 'Claude',
  },
  BLOCKED_DIRTY_TREE: {
    route: 'Resolve dirty working tree before starting any session',
    files_to_read: ['AI_HANDOFF.md'],
    command: 'git status --short && /handoff to capture state',
    context: 'handoff_before_switch',
    model_tier: 'default',
    plan_mode: 'avoid',
    tool: 'Claude',
  },
  BLOCKED_WRONG_BRANCH: {
    route: 'Verify branch alignment — stop and ask Coordinator',
    files_to_read: ['AI_HANDOFF.md', 'CURRENT_STATE.md'],
    command: 'git branch --show-current && review AI_HANDOFF.md — ask Coordinator',
    context: 'fresh_session',
    model_tier: 'default',
    plan_mode: 'avoid',
    tool: 'Claude',
  },
  BLOCKED_PACKAGE_UNAUTHORIZED: {
    route: 'Stop — Package 5B or product package requires explicit Coordinator authorization',
    files_to_read: ['AI_HANDOFF.md', 'CURRENT_STATE.md'],
    command: 'Report to Coordinator — do not start product work',
    context: 'fresh_session',
    model_tier: 'default',
    plan_mode: 'avoid',
    tool: 'Claude',
  },
  BLOCKED_EXTERNAL_SYNC_RISK: {
    route: 'Stop — private/local files may be exposed or external apply is pending without approval',
    files_to_read: ['AI_HANDOFF.md', '.gitignore'],
    command: 'git check-ignore -v <file> — verify gitignore — report to Coordinator',
    context: 'fresh_session',
    model_tier: 'strongest',
    plan_mode: 'avoid',
    tool: 'Claude',
  },
  NEEDS_COORDINATOR_DECISION: {
    route: 'Report state to Coordinator — await authorization for next gate or package',
    files_to_read: ['AI_HANDOFF.md', 'CURRENT_STATE.md', 'docs/project-control/current-sprint.md'],
    command: '/status-summary then report to Coordinator',
    context: 'fresh_session',
    model_tier: 'default',
    plan_mode: 'optional',
    tool: 'Claude',
  },
};

const recommendation = ROUTE_MAP[verdict] || ROUTE_MAP.NEEDS_COORDINATOR_DECISION;

// ── Summaries ──────────────────────────────────────────────────────────────────

function stateFreshnessSummary() {
  const issues = [];
  if (!branchMatchesHandoff && handoffBranch && handoffBranch !== 'main') {
    issues.push(`Branch mismatch: handoff says '${handoffBranch}', current is '${currentBranch}'.`);
  }
  if (stateActiveBranch && stateActiveBranch !== currentBranch && currentBranch !== 'main') {
    issues.push(`CURRENT_STATE.md active branch '${stateActiveBranch}' differs from current branch.`);
  }
  if (package5BUnauthorized) issues.push('FAIL: Package 5B appears unauthorized-active.');
  if (issues.length === 0) return 'State docs appear aligned with git state.';
  return issues.join(' ');
}

function reportMirrorSummary() {
  if (!mirrorLogContent) return 'report-mirror-log.md not found.';
  if (mirrorHasEntries) return 'Mirror log exists with committed entries.';
  return 'Mirror log exists; no committed entries yet (log starts empty — expected).';
}

function externalSyncSummary() {
  const parts = [];
  if (calSyncLogContent && calSyncLogContent.includes('Gate 3')) parts.push('Google Calendar Gate 3 logged (v1.6 complete).');
  if (ghSyncLogContent) parts.push('GitHub Projects sync log exists.');
  if (syncLogContent) parts.push('Project sync log exists.');
  if (externalApplyMentioned) parts.push('WARNING: external apply may be referenced in handoff.');
  // External sync consistency validator signal (Gate 5)
  const consistencyLogContent = readFileSafe('docs/project-control/external-sync-consistency-log.md');
  if (consistencyLogContent) parts.push('External sync consistency log exists (Gate 5).');
  if (existsSync(join(ROOT, 'scripts/external-sync-consistency-check.mjs'))) {
    parts.push('External sync consistency validator available (scripts/external-sync-consistency-check.mjs).');
  }
  if (parts.length === 0) return 'No external sync signals detected.';
  return parts.join(' ');
}

// ── Assemble output object ─────────────────────────────────────────────────────

const activePackageDisplay = handoffActivePackage
  ? handoffActivePackage.replace(/\s*\|.*/g, '').trim()
  : (stateActivePackage ? stateActivePackage.replace(/\s*\|.*/g, '').trim() : 'None');

const output = {
  verdict,
  branch: currentBranch || '(none — not in a git repo)',
  head: shortHead || '(unknown)',
  dirty_tree: isDirty,
  active_package: activePackageDisplay,
  package_5b_status: package5BUnauthorized
    ? 'UNAUTHORIZED — FAIL (must resolve)'
    : (package5BBlocked ? 'blocked — not started (correct)' : 'not explicitly referenced as active (check AI_HANDOFF.md)'),
  latest_completed_os_gate: latestGateText,
  recommended_route: recommendation.route,
  recommended_files_to_read: recommendation.files_to_read,
  recommended_command: recommendation.command,
  context_recommendation: recommendation.context,
  model_tier_recommendation: recommendation.model_tier,
  plan_mode_recommendation: recommendation.plan_mode,
  tool_recommendation: recommendation.tool,
  warns: warns.map(w => `${w.code}: ${w.message}`),
  fails: fails.map(f => `${f.code}: ${f.message}`),
  state_freshness_summary: stateFreshnessSummary(),
  report_mirror_summary: reportMirrorSummary(),
  external_sync_summary: externalSyncSummary(),
  post_commit_state_rule_note: 'Cosmetic HEAD lag (one commit) is expected under the Post-Commit State Rule — verify branch, package, and task pointer accuracy, not just the hash.',
};

if (RECOMMEND_MODEL || CONTEXT_RISK) {
  output.context_risk = {
    is_dirty: isDirty,
    has_exposed_private_files: hasExposedPrivateFiles,
    branch_matches_handoff: branchMatchesHandoff,
    handoff_is_active: handoffIsActive,
    recommend_fresh_session: ['READY_FRESH_START', 'NEEDS_COORDINATOR_DECISION', 'NEEDS_STATE_SYNC', 'BLOCKED_WRONG_BRANCH', 'BLOCKED_PACKAGE_UNAUTHORIZED'].includes(verdict),
    recommend_compact_first: verdict === 'READY_CONTINUE' && isDirty,
    recommend_handoff_update: ['NEEDS_HANDOFF_UPDATE', 'BLOCKED_DIRTY_TREE'].includes(verdict),
    recommend_clear_and_restart: verdict.startsWith('BLOCKED_') || verdict === 'NEEDS_STATE_SYNC',
  };
}

// ── Output ─────────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  console.log(JSON.stringify(output, null, 2));
} else {
  const w = (...lines) => lines.forEach(l => console.log(l));

  w('');
  w('=== Start Router — AI Project OS v1.7 Gate 5 ===');
  w('');
  w(`Verdict:              ${verdict}`);
  w(`Branch:               ${output.branch}`);
  w(`HEAD:                 ${output.head}`);
  w(`Dirty tree:           ${isDirty}`);
  w(`Active package:       ${output.active_package}`);
  w(`Package 5B:           ${output.package_5b_status}`);
  w(`Latest OS gate:       ${latestGateText}`);
  w('');
  w(`Recommended route:    ${recommendation.route}`);
  w(`Recommended command:  ${recommendation.command}`);
  w(`Context:              ${recommendation.context}`);
  w(`Model tier:           ${recommendation.model_tier}`);
  w(`Plan Mode:            ${recommendation.plan_mode}`);
  w(`Tool:                 ${recommendation.tool}`);
  w('');
  w('Files to read next:');
  recommendation.files_to_read.forEach(f => w(`  - ${f}`));
  w('');

  if (output.fails.length > 0) {
    w('FAILs (must resolve before proceeding):');
    output.fails.forEach(f => w(`  [FAIL] ${f}`));
    w('');
  }

  if (output.warns.length > 0) {
    w('WARNs (informational):');
    output.warns.forEach(wn => w(`  [WARN] ${wn}`));
    w('');
  }

  if (output.fails.length === 0 && output.warns.length === 0) {
    w('No FAILs. No WARNs.');
    w('');
  }

  w(`State freshness:      ${output.state_freshness_summary}`);
  w(`Report mirror:        ${output.report_mirror_summary}`);
  w(`External sync:        ${output.external_sync_summary}`);
  w('');
  w('Post-Commit State Rule note:');
  w(`  ${output.post_commit_state_rule_note}`);
  w('');

  if (SHOW_PATHS) {
    w('Paths inspected:');
    INSPECTED_PATHS.forEach(p => {
      const exists = existsSync(join(ROOT, p));
      w(`  ${exists ? '[found]' : '[missing]'} ${p}`);
    });
    w('');
  }

  if (EXPLAIN) {
    w('Route rules:');
    w('  READY_FRESH_START         — main branch, clean tree, no active package, Package 5B blocked, 0 FAILs');
    w('  READY_CONTINUE            — authorized branch, handoff matches current branch, 0 FAILs');
    w('  NEEDS_HANDOFF_UPDATE      — on gate/task branch but AI_HANDOFF.md does not describe this branch');
    w('  NEEDS_STATE_SYNC          — closeout appears complete but state docs are operationally misleading');
    w('  BLOCKED_DIRTY_TREE        — main branch with uncommitted changes (private files absent)');
    w('  BLOCKED_WRONG_BRANCH      — branch mismatch and handoff does not explain why');
    w('  BLOCKED_PACKAGE_UNAUTHORIZED — Package 5B or product package active without Coordinator auth');
    w('  BLOCKED_EXTERNAL_SYNC_RISK   — private/local files exposed in git status, or external apply pending');
    w('  NEEDS_COORDINATOR_DECISION   — OS gates in progress; next step requires Coordinator authorization');
    w('');
    w('Priority order (highest to lowest):');
    w('  BLOCKED_EXTERNAL_SYNC_RISK > BLOCKED_PACKAGE_UNAUTHORIZED > BLOCKED_DIRTY_TREE >');
    w('  BLOCKED_WRONG_BRANCH > NEEDS_HANDOFF_UPDATE > NEEDS_STATE_SYNC >');
    w('  NEEDS_COORDINATOR_DECISION > READY_CONTINUE > READY_FRESH_START');
    w('');
  }

  if ((RECOMMEND_MODEL || CONTEXT_RISK) && output.context_risk) {
    const cr = output.context_risk;
    w('Context risk assessment:');
    w(`  Recommend fresh session:   ${cr.recommend_fresh_session}`);
    w(`  Recommend compact first:   ${cr.recommend_compact_first}`);
    w(`  Recommend handoff update:  ${cr.recommend_handoff_update}`);
    w(`  Recommend clear + restart: ${cr.recommend_clear_and_restart}`);
    w(`  Branch matches handoff:    ${cr.branch_matches_handoff}`);
    w(`  Handoff is active:         ${cr.handoff_is_active}`);
    w('');
  }

  if (MODE) {
    w(`Mode override: --mode ${MODE} applied.`);
    w('');
  }
}

// ── Exit code ──────────────────────────────────────────────────────────────────

const isBlockedOrNeeds = verdict.startsWith('BLOCKED_') || verdict.startsWith('NEEDS_');
const hasFails = output.fails.length > 0;
const hasWarns = output.warns.length > 0;

if (STRICT) {
  process.exit((hasFails || hasWarns || isBlockedOrNeeds) ? 1 : 0);
} else {
  process.exit((hasFails || isBlockedOrNeeds) ? 1 : 0);
}
