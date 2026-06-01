#!/usr/bin/env node
/**
 * State Freshness Check — AI Project OS v1.7 Gate 2
 *
 * Reads repo truth and classifies stale state as FAIL, WARN, or PASS.
 * Detects operational misdirection (FAIL) vs cosmetic lag (WARN),
 * following the Post-Commit State Rule from docs/ai-system/universal-standards.md.
 *
 * No external dependencies. No API calls. No external writes. Read-only.
 *
 * Usage:
 *   node scripts/state-freshness-check.mjs
 *   node scripts/state-freshness-check.mjs --json
 *   node scripts/state-freshness-check.mjs --strict
 *   node scripts/state-freshness-check.mjs --paths
 *   node scripts/state-freshness-check.mjs --explain
 *
 * Exit codes:
 *   0  PASS or WARN only (no FAILs)
 *   1  one or more FAILs (or any WARNs under --strict)
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const JSON_MODE = args.includes('--json');
const STRICT    = args.includes('--strict');
const SHOW_PATHS = args.includes('--paths');
const EXPLAIN   = args.includes('--explain');

const issues = [];
const passes = [];

function addIssue(code, severity, file, explanation, fix) {
  issues.push({ code, severity, file, explanation, fix });
}

function addPass(label) {
  passes.push(label);
}

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

function isGitignored(relPath) {
  try {
    const result = execSync(`git check-ignore -v "${relPath}" 2>&1`, {
      cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim().length > 0;
  } catch { return false; }
}

function extract(content, pattern) {
  if (!content) return null;
  const m = content.match(pattern);
  return m ? m[1].trim() : null;
}

// ── 1. Git state ──────────────────────────────────────────────────────────────

const currentBranch = runGit('git branch --show-current');
const currentHead   = runGit('git rev-parse HEAD');
const shortHead     = currentHead.slice(0, 7);
const gitStatus     = runGit('git status --short');
const isDirty       = gitStatus.length > 0;
const recentLog     = runGit('git log --oneline -10');

if (!currentBranch) {
  process.stderr.write('Error: could not determine current git branch. Is this a git repository?\n');
  process.exit(1);
}

const recentHashes = recentLog.split('\n')
  .map(l => { const m = l.match(/^([0-9a-f]+)/); return m ? m[1] : ''; })
  .filter(Boolean);

// ── 2. Read state files ───────────────────────────────────────────────────────

const handoff    = readFileSafe('AI_HANDOFF.md');
const curState   = readFileSafe('CURRENT_STATE.md');
const nextPrompt = readFileSafe('NEXT_SESSION_PROMPT.md');
const sprint     = readFileSafe('docs/project-control/current-sprint.md');
const kanban     = readFileSafe('docs/project-control/kanban-board.md');
const changelog  = readFileSafe('docs/ai-system/CHANGELOG.md');
const verHist    = readFileSafe('docs/ai-system/version-history.md');
const testStrat  = readFileSafe('docs/qa/test-strategy.md');
const modelRoute = readFileSafe('docs/dev/model-routing-protocol.md');

// ── 3. Extract key fields ─────────────────────────────────────────────────────

const handoffBranch  = extract(handoff,    /\*\*Active branch\*\*\s*\|\s*`([^`]+)`/);
const handoffPackage = extract(handoff,    /\*\*Active package\*\*\s*\|\s*([^|\n]+)/);
const handoffNextAct = extract(handoff,    /##\s*Next exact action\s*\n\s*([^\n]+)/);
const curStateBranch = extract(curState,   /\|\s*Active branch\s*\|\s*`([^`]+)`/);
const nextBranch     = extract(nextPrompt, /\|\s*Branch\s*\|\s*`([^`]+)`/);

const inferredPackage   = handoffPackage ? handoffPackage.trim().replace(/\s*\|.*/, '').trim() : 'Unknown';
const inferredNextAction = handoffNextAct || 'See AI_HANDOFF.md § Next exact action';

// HEAD hash references in state docs (for lag detection — short 7-char hashes)
function extractHashes(content) {
  if (!content) return [];
  return [...content.matchAll(/`([0-9a-f]{7,40})`/g)]
    .map(m => m[1])
    .filter(h => /^[0-9a-f]{7,40}$/.test(h));
}

const handoffHashes  = extractHashes(handoff);
const curStateHashes = extractHashes(curState);

// ── CHECK A: Branch alignment ─────────────────────────────────────────────────
// FAIL if state docs record a branch that does not match the current git branch.

function checkBranchAlignment(docName, docBranch) {
  if (!docBranch) {
    addIssue('FAIL_WRONG_ACTIVE_BRANCH', 'FAIL', docName,
      `Cannot extract active branch from ${docName}. The next agent cannot determine the correct branch.`,
      `Ensure ${docName} has a clearly formatted "Active branch" or "Branch" field.`);
    return;
  }
  if (docBranch !== currentBranch) {
    addIssue('FAIL_WRONG_ACTIVE_BRANCH', 'FAIL', docName,
      `${docName} records active branch as "${docBranch}" but current git branch is "${currentBranch}". ` +
      `The next agent would resume on the wrong branch.`,
      `Update the branch field in ${docName} to "${currentBranch}". ` +
      `If you just created a new implementation branch, update state docs before any other edits.`);
  } else {
    addPass(`${docName}: branch matches git ("${currentBranch}")`);
  }
}

checkBranchAlignment('AI_HANDOFF.md', handoffBranch);
checkBranchAlignment('CURRENT_STATE.md', curStateBranch);
if (nextPrompt) checkBranchAlignment('NEXT_SESSION_PROMPT.md', nextBranch);

// ── CHECK B: Package 5B not started or authorized ────────────────────────────
// FAIL if any state doc shows Package 5B as active without a blocker qualifier.

function checkPkg5B(docName, content) {
  if (!content) return;
  const matches = [...content.matchAll(/Package\s*5B[^\n]{0,250}/gi)];
  for (const m of matches) {
    const ctx = m[0].toLowerCase();
    const hasActive = /\bin progress\b|\bimplementing\b|\bstarted\b/.test(ctx) &&
                      !/not started/.test(ctx);
    const hasAuth   = /\bauthorized\b/.test(ctx) &&
                      !/until.*authorized|coordinator.*authoriz|neither authorized|not.*authorized/.test(ctx);
    if (hasActive || hasAuth) {
      addIssue('FAIL_PACKAGE_5B_UNAUTHORIZED', 'FAIL', docName,
        `${docName} may show Package 5B as started or authorized without a blocking qualifier. ` +
        `Package 5B must remain blocked until v1.7 is complete and the Coordinator explicitly authorizes product work.`,
        `Verify Package 5B status language in ${docName}. ` +
        `Correct wording: "Not started — blocked until v1.7 complete and Coordinator authorization."`);
      return;
    }
  }
  addPass(`${docName}: Package 5B not shown as started or authorized`);
}

for (const doc of [
  { name: 'AI_HANDOFF.md', content: handoff },
  { name: 'CURRENT_STATE.md', content: curState },
  { name: 'NEXT_SESSION_PROMPT.md', content: nextPrompt },
]) {
  checkPkg5B(doc.name, doc.content);
}

// ── CHECK C: Kanban "In Progress" column — no merged branches ────────────────
// FAIL if known-merged implementation branches appear as active work in View 1.

const knownMergedBranches = [
  'docs/google-calendar-live-sync-gate-1',
  'docs/google-calendar-live-dry-run-logic',
  'docs/google-calendar-oauth-path-alignment',
  'fix/google-calendar-sync-map-read-path',
  'docs/ai-project-os-v1-7-zero-fault-audit',
];

if (kanban) {
  // Extract View 1 In Progress section (ends at the next ### heading)
  const inProgMatch = kanban.match(/##\s*View 1[\s\S]*?###\s*In Progress\s*\n([\s\S]*?)(?=\n###|\n##|$)/);
  if (inProgMatch) {
    const inProgContent = inProgMatch[1];
    const isEmpty = inProgContent.trim() === '' ||
                    /^\s*-?\s*_?\(empty[^)]*\)_?\s*$/m.test(inProgContent);
    if (isEmpty) {
      addPass('Kanban View 1 "In Progress" is empty — no stale active work items');
    } else {
      let foundStaleBranch = false;
      for (const branch of knownMergedBranches) {
        if (inProgContent.includes(branch)) {
          addIssue('FAIL_STATUS_SYNC_BRANCH_STALE_ACTIVE', 'FAIL',
            'docs/project-control/kanban-board.md',
            `Kanban "In Progress" column references merged branch "${branch}". ` +
            `This work is complete and the card should be in Done.`,
            `Move the card referencing "${branch}" to the Done column in kanban-board.md.`);
          foundStaleBranch = true;
        }
      }
      if (!foundStaleBranch) {
        addPass('Kanban View 1 "In Progress" does not contain known merged-branch references');
      }
    }
  } else {
    addPass('Kanban In Progress section parsed (no stale branch references detected)');
  }
}

// ── CHECK D: Test baseline ────────────────────────────────────────────────────
// FAIL if test-strategy.md still records 1466 as the current Node unit test count.
// The confirmed baseline after Package 5A is 1603.

if (testStrat) {
  const has1466 = /\b1466\b/.test(testStrat);
  const has1603 = /\b1603\b/.test(testStrat);
  if (has1466 && !has1603) {
    addIssue('FAIL_TEST_BASELINE_MATERIAL_MISMATCH', 'FAIL', 'docs/qa/test-strategy.md',
      'test-strategy.md records 1466 as the Node unit test count. ' +
      'The confirmed baseline after Package 5A is 1603 (1466 prior + 137 new). ' +
      'Pre-commit verification instructions reference this count; using 1466 means 137 tests are invisible to the gate.',
      'Update all "1466" references in test-strategy.md to "1603". ' +
      'Add the proof-approval-state-tests.mjs row to the Layer 1 suite table. ' +
      'Update the pre-commit baseline section.');
  } else if (has1466 && has1603) {
    addIssue('WARN_PROJECT_CONTROL_COPY_LAG', 'WARN', 'docs/qa/test-strategy.md',
      'test-strategy.md contains both "1466" and "1603" — the old count may not be fully removed.',
      'Verify all pre-commit baseline references use 1603, not 1466. Remove all stale 1466 references.');
  } else {
    addPass('docs/qa/test-strategy.md: test baseline reflects current count (1603)');
  }
}

// ── CHECK E: Gitignore protections for private/local files ───────────────────
// FAIL if any private file path is not gitignored.

const privateFilePaths = [
  'docs/project-control/external-sync-map.local.json',
  'docs/project-control/google-calendar-credentials.local.json',
  'docs/project-control/google-calendar-token.local.json',
  '.claude/settings.local.json',
  'CLAUDE.local.md',
  'local-sync-reports/example.json',
  'scripts/node_modules/example-package/file.js',
];

for (const f of privateFilePaths) {
  if (isGitignored(f)) {
    addPass(`gitignored: ${f}`);
  } else {
    addIssue('FAIL_LOCAL_PRIVATE_FILE_NOT_IGNORED', 'FAIL', f,
      `"${f}" is not matched by any .gitignore rule. If created, it could be accidentally staged and committed, exposing credentials or local state.`,
      `Add "${f}" or an appropriate glob pattern to .gitignore.`);
  }
}

// ── CHECK F: HEAD hash lag in state docs ──────────────────────────────────────
// WARN if state docs reference commit hashes that are not among the 20 most recent.
// Per Post-Commit State Rule: this is cosmetic lag, not operational misdirection.

function detectHeadLag(docName, hashes) {
  if (!hashes || hashes.length === 0) return;
  const laggedRefs = hashes.filter(h =>
    !recentHashes.some(rh => rh.startsWith(h.slice(0, 7)) || h.startsWith(rh.slice(0, 7)))
  );
  if (laggedRefs.length > 0) {
    const examples = [...new Set(laggedRefs)].slice(0, 3).join(', ');
    addIssue('WARN_HEAD_HASH_LAG', 'WARN', docName,
      `${docName} contains commit hash reference(s) (${examples}...) not found in the 20 most recent commits. ` +
      `This is cosmetic lag per the Post-Commit State Rule. ` +
      `It does not require a fix unless branch, package, or next-action fields are also wrong.`,
      'No action required if operational fields (branch, package, next action) are accurate. ' +
      'Update the hash only during the next meaningful state-sync commit.');
  } else {
    addPass(`${docName}: HEAD hash references are current or close to current`);
  }
}

detectHeadLag('AI_HANDOFF.md', handoffHashes);
detectHeadLag('CURRENT_STATE.md', curStateHashes);

// ── CHECK G: CHANGELOG.md — IN PROGRESS markers for completed work ────────────
// WARN if CHANGELOG has "IN PROGRESS" status markers for v1.6 entries (all merged).

if (changelog) {
  const inProgressMarkers = [...changelog.matchAll(/\*\*Status:\*\*\s*IN PROGRESS/gi)];
  if (inProgressMarkers.length > 0) {
    addIssue('WARN_CHANGELOG_STATUS_LAG', 'WARN', 'docs/ai-system/CHANGELOG.md',
      `CHANGELOG.md has ${inProgressMarkers.length} "IN PROGRESS" status marker(s) for entries ` +
      `that are likely complete (all v1.6 gates are merged). ` +
      `These are write-time snapshots — they do not block work but are cosmetically stale.`,
      'Update status markers to COMPLETE for all merged v1.6 CHANGELOG entries. ' +
      'Can be done as part of the Gate 2 CHANGELOG update.');
  } else {
    addPass('CHANGELOG.md: no stale "IN PROGRESS" status markers');
  }
}

// ── CHECK H: version-history.md — stale "In progress on branch" entries ───────
// WARN if version-history records branches as "In progress" when they have been merged.

if (verHist) {
  const staleEntries = [...verHist.matchAll(/In progress on branch `([^`]+)`/gi)];
  if (staleEntries.length > 0) {
    const staleBranches = [...new Set(staleEntries.map(m => m[1]))];
    addIssue('WARN_VERSION_HISTORY_STATUS_LAG', 'WARN', 'docs/ai-system/version-history.md',
      `version-history.md records ${staleBranches.length} branch(es) as "In progress" ` +
      `(${staleBranches.join(', ')}), but these branches appear to be merged. ` +
      `These rows are cosmetically stale.`,
      'Update these rows to reflect the actual merged status, commit hash, and COMPLETE state.');
  } else {
    addPass('version-history.md: no stale "In progress on branch" entries');
  }
}

// ── CHECK I: Model routing — stale model ID examples ─────────────────────────
// WARN if model-routing-protocol.md references a model generation that has been superseded.

if (modelRoute) {
  if (/Opus 4\.7/.test(modelRoute) && !/Opus 4\.8/.test(modelRoute)) {
    addIssue('WARN_MODEL_EXAMPLE_REFRESH_NEEDED', 'WARN', 'docs/dev/model-routing-protocol.md',
      'model-routing-protocol.md references "Opus 4.7" in the Examples column but the current ' +
      'strongest-tier model is Opus 4.8. The tier-based routing policy is still correct; ' +
      'only the "Examples (today)" column is stale.',
      'Update the "Examples (today)" column for the Strongest tier to reference Opus 4.8. ' +
      'Preserve tier-based routing as the durable standard. ' +
      'Do not hard-code model IDs as mandatory — always present them as current examples only.');
  } else if (/Opus 4\.8/.test(modelRoute)) {
    addPass('docs/dev/model-routing-protocol.md: model ID examples reference Opus 4.8 (current)');
  } else {
    addIssue('WARN_MODEL_EXAMPLE_REFRESH_NEEDED', 'WARN', 'docs/dev/model-routing-protocol.md',
      'model-routing-protocol.md does not clearly reference the current Strongest-tier model. ' +
      'Verify the Examples column is up to date.',
      'Check the Strongest tier Examples column against the current Anthropic model list and update if needed.');
  }
}

// ── CHECK J: Current sprint staleness ─────────────────────────────────────────
// WARN if current-sprint.md shows only a CLOSED sprint with no new sprint opened.

if (sprint) {
  const sprintClosed = /CLOSED/.test(sprint);
  const hasNewSprint = /Sprint 2026-06/.test(sprint);
  if (sprintClosed && !hasNewSprint) {
    addIssue('WARN_PROJECT_CONTROL_COPY_LAG', 'WARN', 'docs/project-control/current-sprint.md',
      'current-sprint.md shows the last sprint as CLOSED with no new sprint entry. ' +
      'v1.7 Gate 2 work has begun on a new branch.',
      'Add a new sprint entry for v1.7 Gate 2 work (Sprint 2026-06-A) to current-sprint.md.');
  } else {
    addPass('docs/project-control/current-sprint.md: sprint appears current');
  }
}

// ── CHECK K: Kanban Done column — v1.x completions ───────────────────────────
// WARN if key completed AI Project OS passes are missing from the Done column.

if (kanban) {
  const doneMatch = kanban.match(/###\s*Done\s*\n([\s\S]*?)(?=\n###|\n##|$)/);
  if (doneMatch) {
    const doneContent = doneMatch[1];
    const required = [
      { label: 'v1.5', pattern: /v1\.5|Template GitHub Project/ },
      { label: 'v1.6', pattern: /v1\.6|Google Calendar Live Sync/ },
    ];
    const missing = required.filter(r => !r.pattern.test(doneContent));
    if (missing.length > 0) {
      addIssue('WARN_PROJECT_CONTROL_COPY_LAG', 'WARN', 'docs/project-control/kanban-board.md',
        `Kanban "Done" column is missing entries for: ${missing.map(m => m.label).join(', ')}. ` +
        `The AI Project OS v1.5 and v1.6 upgrade passes are complete but may not appear in Done.`,
        'Add Done entries for all completed AI Project OS upgrade passes (v1.5, v1.6, v1.7 Gate 1) to kanban-board.md. ' +
        'Include merge commit hash for each.');
    } else {
      addPass('Kanban Done column includes expected v1.5 and v1.6 completion entries');
    }
  }
}

// ── Compute verdict ───────────────────────────────────────────────────────────

const failIssues = issues.filter(i => i.severity === 'FAIL');
const warnIssues = issues.filter(i => i.severity === 'WARN');
const passCount  = passes.length;

let verdict = 'PASS';
if (warnIssues.length > 0) verdict = 'WARN';
if (failIssues.length > 0) verdict = 'FAIL';

// ── Output ────────────────────────────────────────────────────────────────────

const POST_COMMIT_RULE_NOTE =
  'HEAD hash lag of 1 commit in state docs is WARN (cosmetic), not FAIL per the Post-Commit State Rule. ' +
  'The corrective control is preflight git log — not a follow-up state-sync commit. ' +
  'See docs/ai-system/universal-standards.md § "Post-Commit State Rule".';

if (JSON_MODE) {
  const out = {
    verdict,
    current_branch: currentBranch,
    current_head: shortHead,
    dirty_working_tree: isDirty,
    active_package_inferred: inferredPackage,
    next_action_inferred: inferredNextAction,
    fail_count: failIssues.length,
    warn_count: warnIssues.length,
    pass_count: passCount,
    post_commit_state_rule_note: POST_COMMIT_RULE_NOTE,
    issues: issues.map(i => ({
      code: i.code,
      severity: i.severity,
      file: i.file,
      explanation: i.explanation,
      recommended_fix: i.fix,
    })),
    passes: (SHOW_PATHS || EXPLAIN) ? passes : undefined,
  };
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log('\n=== State Freshness Check ===\n');
  console.log(`Verdict:          ${verdict}`);
  console.log(`Branch (git):     ${currentBranch}`);
  console.log(`HEAD (git):       ${shortHead}`);
  console.log(`Dirty tree:       ${isDirty}`);
  console.log(`Active package:   ${inferredPackage}`);
  console.log(`Next action:      ${inferredNextAction.slice(0, 80)}${inferredNextAction.length > 80 ? '...' : ''}`);
  console.log(`FAILs:            ${failIssues.length}`);
  console.log(`WARNs:            ${warnIssues.length}`);
  console.log(`PASSes:           ${passCount}`);

  if (failIssues.length > 0) {
    console.log('\n--- FAILURES (must fix before commit / merge / next package) ---');
    for (const i of failIssues) {
      console.log(`\n[FAIL] ${i.code}`);
      console.log(`  File:  ${i.file}`);
      console.log(`  Issue: ${i.explanation}`);
      console.log(`  Fix:   ${i.fix}`);
    }
  }

  if (warnIssues.length > 0) {
    console.log('\n--- WARNINGS (disclose in closeout report; no sync commit required unless operationally misleading) ---');
    for (const i of warnIssues) {
      console.log(`\n[WARN] ${i.code}`);
      console.log(`  File:  ${i.file}`);
      console.log(`  Issue: ${i.explanation}`);
      console.log(`  Fix:   ${i.fix}`);
    }
  }

  if ((SHOW_PATHS || EXPLAIN) && passes.length > 0) {
    console.log('\n--- PASSES ---');
    for (const p of passes) console.log(`  [PASS] ${p}`);
  }

  console.log('\n--- Post-Commit State Rule ---');
  console.log(POST_COMMIT_RULE_NOTE);
  console.log('');
}

// ── Exit code ─────────────────────────────────────────────────────────────────

if (failIssues.length > 0) process.exit(1);
if (STRICT && warnIssues.length > 0) process.exit(1);
process.exit(0);
