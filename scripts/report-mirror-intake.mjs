#!/usr/bin/env node
/**
 * Report Mirror Intake — AI Project OS v1.7 Gate 3
 *
 * No dependencies. No API calls. No external writes in dry-run mode.
 * Default mode is dry-run. --apply required for any writes to the committed log.
 *
 * Usage:
 *   node scripts/report-mirror-intake.mjs --help
 *   node scripts/report-mirror-intake.mjs --input <path> [--type <type>] [--dry-run]
 *   node scripts/report-mirror-intake.mjs --stdin [--type <type>] [--dry-run]
 *   node scripts/report-mirror-intake.mjs --input <path> --type <type> --apply [--output <path>]
 *   node scripts/report-mirror-intake.mjs --input <path> --redact-only
 *   node scripts/report-mirror-intake.mjs --input <path> --json
 *
 * Exit codes:
 *   0  dry-run or apply succeeded
 *   1  missing input, unsupported type, secret-risk rejection, schema failure, write error
 */

import { existsSync, readFileSync, appendFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);

const HELP        = args.includes('--help') || args.includes('-h');
const APPLY_MODE  = args.includes('--apply');
const REDACT_ONLY = args.includes('--redact-only');
const JSON_MODE   = args.includes('--json');
const STDIN_MODE  = args.includes('--stdin');
const REDACT_RISK = args.includes('--redact-risk-accepted');
const DRY_RUN     = !APPLY_MODE && !REDACT_ONLY;

const inputIdx  = args.indexOf('--input');
const typeIdx   = args.indexOf('--type');
const outputIdx = args.indexOf('--output');

const INPUT_PATH  = inputIdx  !== -1 ? args[inputIdx  + 1] : null;
const TYPE_ARG    = typeIdx   !== -1 ? args[typeIdx   + 1] : null;
const OUTPUT_PATH = outputIdx !== -1 ? args[outputIdx + 1]
  : join(ROOT, 'docs/project-control/report-mirror-log.md');

const VALID_TYPES = [
  'package_closeout', 'commit_closeout', 'merge_closeout',
  'status_sync', 'external_sync', 'planning', 'handoff',
  'incident', 'audit', 'decision',
];

// --- High-risk secret patterns (reject unless --redact-risk-accepted) ---
const HIGH_RISK_PATTERNS = [
  { name: 'GitHub PAT (ghp_)',                  pattern: /ghp_[A-Za-z0-9]{10,}/g },
  { name: 'GitHub fine-grained PAT (github_pat_)', pattern: /github_pat_[A-Za-z0-9_]{10,}/g },
  { name: 'GitHub secret key (ghs_)',           pattern: /ghs_[A-Za-z0-9]{10,}/g },
  { name: 'PEM private key block',              pattern: /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+)?PRIVATE KEY-----/g },
  { name: 'Google OAuth client secret (GOCSPX-)', pattern: /GOCSPX-[A-Za-z0-9_-]{10,}/g },
  { name: 'Google OAuth access token (ya29.)',  pattern: /ya29\.[A-Za-z0-9_\-.]{10,}/g },
  { name: 'Google OAuth refresh token (1//)',   pattern: /1\/\/[A-Za-z0-9_\-]{10,}/g },
];

// --- Redact-in-place patterns (replace value, keep field name) ---
const REDACT_PATTERNS = [
  ...HIGH_RISK_PATTERNS,
  { name: 'client_secret value',   pattern: /"client_secret"\s*:\s*"[^"]{8,}"/g,   replacement: '"client_secret": "[REDACTED]"' },
  { name: 'client_id value',       pattern: /"client_id"\s*:\s*"[^"]{8,}"/g,       replacement: '"client_id": "[REDACTED]"' },
  { name: 'access_token value',    pattern: /"access_token"\s*:\s*"[^"]{8,}"/g,    replacement: '"access_token": "[REDACTED]"' },
  { name: 'refresh_token value',   pattern: /"refresh_token"\s*:\s*"[^"]{8,}"/g,   replacement: '"refresh_token": "[REDACTED]"' },
];

// --- Report type detection heuristics ---
const TYPE_HEURISTICS = [
  { type: 'audit',            signals: ['os self-audit', 'os-self-audit', 'self-audit', 'bootstrap complete', 'scripts/os-self-audit'] },
  { type: 'handoff',          signals: ['transfer packet', 'ai_handoff', 'handoff', 'tool switch', 'switch-to-codex', 'switch-to-claude'] },
  { type: 'external_sync',    signals: ['google calendar', 'github projects', 'clickup', 'ticktick', 'external sync', 'dry-run result', 'events fetched'] },
  { type: 'merge_closeout',   signals: ['merged to main', 'merge commit', 'merge branch', 'merged branch'] },
  { type: 'planning',         signals: ['coordinator authorized', 'gate authorized', 'sprint planning', 'backlog', 'authorize', 'gate 3 pending'] },
  { type: 'incident',         signals: ['advisory', 'incident', 'blocker discovered', 'bug', 'root cause', 'repair'] },
  { type: 'commit_closeout',  signals: ['commit created', 'commit hash', 'git commit', 'committed:'] },
  { type: 'package_closeout', signals: ['package closeout', 'gate closeout', 'gate 3', 'gate 2', 'gate 1', 'closeout report', 'package complete', 'package paused', 'package blocked', 'implementation complete', 'v1.7'] },
  { type: 'status_sync',      signals: ['state sync', 'status sync', 'sprint update', 'kanban', 'current-sprint', 'ai_handoff.md updated'] },
  { type: 'decision',         signals: ['decision:', 'decided:', 'decision log', 'coordinator decided'] },
];

function detectType(text) {
  const lower = text.toLowerCase();
  for (const { type, signals } of TYPE_HEURISTICS) {
    if (signals.some(s => lower.includes(s))) return type;
  }
  return null;
}

// --- Git helpers ---
function runGit(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { return ''; }
}

// --- Metadata extraction ---
function extractMeta(text) {
  const meta = {};

  const branchM = text.match(/\b(?:branch|active branch|current branch)\s*[:|]\s*([^\s\n`'"]+)/i);
  if (branchM) meta.branch = branchM[1].replace(/[`'"]/g, '');

  const headM = text.match(/\b(?:HEAD|head|commit|hash)\s*[:|]?\s*`?([0-9a-f]{7,40})`?/i);
  if (headM) meta.head = headM[1].slice(0, 7);

  const filesM = text.match(/(\d+)\s+files?\s+changed/i);
  if (filesM) meta.files_changed = filesM[0];

  const testsM = text.match(/(?:tests?|checks?|validators?)\s*(?:run|passed|pass|result)[:\s]+([^\n.]+)/i);
  if (testsM) meta.tests_run = testsM[1].trim().slice(0, 120);

  const nextM = text.match(/(?:next (?:exact )?action|next action)[:\s]+([^\n]+)/i);
  if (nextM) meta.next_action = nextM[1].trim().slice(0, 200);

  const pkg5bM = text.match(/package 5b[:\s]+([^\n]+)/i);
  if (pkg5bM) meta.package_5b_status = pkg5bM[1].trim().slice(0, 100);

  const extOpsM = text.match(/external (?:operations?|ops?|sync)[:\s]+([^\n]+)/i);
  if (extOpsM) meta.external_operations = extOpsM[1].trim().slice(0, 150);

  return meta;
}

// --- Redaction ---
function detectHighRisk(text) {
  const found = [];
  for (const { name, pattern } of HIGH_RISK_PATTERNS) {
    const fresh = new RegExp(pattern.source, pattern.flags);
    if (fresh.test(text)) found.push(name);
  }
  return found;
}

function applyRedaction(text) {
  let redacted = text;
  const notes = [];
  for (const { name, pattern, replacement } of REDACT_PATTERNS) {
    const fresh = new RegExp(pattern.source, pattern.flags);
    if (fresh.test(redacted)) {
      notes.push(`Redacted: ${name}`);
      redacted = redacted.replace(new RegExp(pattern.source, pattern.flags),
        replacement || '[REDACTED]');
    }
  }
  return { redacted, notes };
}

// --- Summary generation ---
function buildSanitizedSummary(text, reportType, meta) {
  // Take at most 800 chars of the input as the base for the summary,
  // stripping any lines that look like credential patterns
  const lines = text.split('\n')
    .filter(l => !l.match(/ghp_|github_pat_|ghs_|GOCSPX-|ya29\.|BEGIN PRIVATE KEY/))
    .slice(0, 40)
    .join('\n')
    .slice(0, 800)
    .trim();

  const parts = [`Report type: ${reportType}`];
  if (meta.branch) parts.push(`Branch: ${meta.branch}`);
  if (meta.head)   parts.push(`HEAD: ${meta.head}`);
  if (lines) parts.push(`\nContent summary (sanitized):\n${lines}`);
  if (meta.next_action) parts.push(`\nNext action: ${meta.next_action}`);

  return parts.join('\n');
}

// --- Entry ID generation ---
function generateEntryId() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `RPT-${ymd}-${seq}`;
}

// --- Format mirror entry for appending ---
function formatMirrorEntry(entryId, reportType, meta, sanitizedSummary, redactionNotes, createdAt) {
  const lines = [];
  lines.push('');
  lines.push(`### ${entryId} — ${reportType}${meta.package_or_gate ? ` — ${meta.package_or_gate}` : ''}`);
  lines.push('');

  const headerParts = [`**Created:** ${createdAt}`];
  if (meta.branch) headerParts.push(`**Branch:** ${meta.branch}`);
  if (meta.head)   headerParts.push(`**HEAD:** ${meta.head}`);
  headerParts.push('**Status:** mirrored');
  lines.push(headerParts.join(' | '));
  lines.push('');

  lines.push(sanitizedSummary.replace(/^Report type:.*\n?/, '').trim());
  lines.push('');

  const detailParts = [];
  if (meta.tests_run)           detailParts.push(`**Tests/validators:** ${meta.tests_run}`);
  if (meta.external_operations) detailParts.push(`**External operations:** ${meta.external_operations}`);
  if (meta.next_action)         detailParts.push(`**Next action:** ${meta.next_action}`);
  if (meta.package_5b_status)   detailParts.push(`**Package 5B:** ${meta.package_5b_status}`);
  if (detailParts.length > 0)   lines.push(detailParts.join(' | '));

  if (redactionNotes.length > 0) {
    lines.push(`**Redaction notes:** ${redactionNotes.join('; ')}`);
  }
  lines.push('');

  return lines.join('\n');
}

// --- Entry index update ---
function updateIndexInLog(logPath, entryId, reportType, meta, createdAt) {
  const content = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
  const emptyRow = '| — | — | — | — | — | — | — |';
  const newRow = `| ${entryId} | ${reportType} | ${meta.package_or_gate || '—'} | ${meta.branch || '—'} | ${meta.head || '—'} | mirrored | ${createdAt.slice(0, 10)} |`;
  const updated = content.replace(emptyRow, `${newRow}\n${emptyRow}`);
  if (updated !== content) return updated;
  // If placeholder row is already replaced, just return content unchanged (entry appended below)
  return content;
}

// --- HELP ---
if (HELP) {
  console.log(`
Report Mirror Intake — AI Project OS v1.7 Gate 3

Usage:
  node scripts/report-mirror-intake.mjs --help
  node scripts/report-mirror-intake.mjs --input <path> [--type <type>] [--dry-run]
  node scripts/report-mirror-intake.mjs --stdin [--type <type>] [--dry-run]
  node scripts/report-mirror-intake.mjs --input <path> --type <type> --apply [--output <path>]
  node scripts/report-mirror-intake.mjs --input <path> --redact-only
  node scripts/report-mirror-intake.mjs --input <path> --json

Flags:
  --input <path>            Read report from local file (must be in gitignored path)
  --stdin                   Read report from stdin
  --type <type>             Report type (auto-detected if omitted)
  --dry-run                 Preview only — no writes (default)
  --apply                   Append sanitized entry to committed mirror log
  --output <path>           Override output path (default: docs/project-control/report-mirror-log.md)
  --redact-only             Show redacted output only; do not append
  --json                    Output result as JSON
  --redact-risk-accepted    Allow processing despite high-risk secret pattern detection
                            (only use after manually verifying no actual secrets are present)

Valid report types:
  ${VALID_TYPES.join(', ')}

Exit codes:
  0  dry-run or apply succeeded
  1  missing input, unsupported type, secret-risk rejection, schema failure, write error

Policy: docs/project-control/report-mirror-policy.md
Runbook: docs/project-control/report-intake-runbook.md
`);
  process.exit(0);
}

// --- Input validation ---
if (!STDIN_MODE && !INPUT_PATH) {
  console.error('ERROR: Provide --input <path> or --stdin. Use --help for usage.');
  process.exit(1);
}

if (INPUT_PATH && !existsSync(join(ROOT, INPUT_PATH)) && !existsSync(INPUT_PATH)) {
  console.error(`ERROR: Input file not found: ${INPUT_PATH}`);
  process.exit(1);
}

if (TYPE_ARG && !VALID_TYPES.includes(TYPE_ARG)) {
  console.error(`ERROR: Unsupported report type: "${TYPE_ARG}"`);
  console.error(`Valid types: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

// --- Read input ---
async function readInput() {
  if (STDIN_MODE) {
    return new Promise((resolve) => {
      const lines = [];
      const rl = createInterface({ input: process.stdin, terminal: false });
      rl.on('line', l => lines.push(l));
      rl.on('close', () => resolve(lines.join('\n')));
    });
  }
  const fullPath = existsSync(join(ROOT, INPUT_PATH)) ? join(ROOT, INPUT_PATH) : INPUT_PATH;
  return readFileSync(fullPath, 'utf8');
}

// --- Main ---
async function main() {
  const rawText = await readInput();

  if (!rawText || rawText.trim().length === 0) {
    console.error('ERROR: Input is empty.');
    process.exit(1);
  }

  // 1. High-risk check
  const highRiskFound = detectHighRisk(rawText);
  if (highRiskFound.length > 0 && !REDACT_RISK) {
    console.error('ERROR: High-risk secret pattern detected. Input rejected.');
    console.error('Patterns detected (values not shown):');
    highRiskFound.forEach(p => console.error(`  - ${p}`));
    console.error('');
    console.error('Options:');
    console.error('  1. Remove the sensitive content from the input file and retry.');
    console.error('  2. Use --redact-risk-accepted only if you have verified no actual secrets are present.');
    process.exit(1);
  }

  // 2. Redact
  const { redacted: sanitizedText, notes: redactionNotes } = applyRedaction(rawText);

  if (REDACT_ONLY) {
    console.log('REDACT-ONLY OUTPUT');
    console.log('==================');
    console.log(sanitizedText);
    if (redactionNotes.length > 0) {
      console.log('\nRedaction notes:');
      redactionNotes.forEach(n => console.log(`  - ${n}`));
    } else {
      console.log('\nNo redactions applied.');
    }
    process.exit(0);
  }

  // 3. Type detection
  const reportType = TYPE_ARG || detectType(sanitizedText);
  const typeConfidence = TYPE_ARG ? 'specified' : (reportType ? 'auto-detected' : 'unknown');

  if (!reportType) {
    console.error('ERROR: Could not detect report type. Provide --type <type>.');
    console.error(`Valid types: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  if (!VALID_TYPES.includes(reportType)) {
    console.error(`ERROR: Unsupported report type: "${reportType}"`);
    process.exit(1);
  }

  // 4. Extract metadata
  const meta = extractMeta(sanitizedText);
  if (!meta.branch) meta.branch = runGit('git branch --show-current') || undefined;
  if (!meta.head)   meta.head   = (runGit('git rev-parse HEAD') || '').slice(0, 7) || undefined;

  // 5. Build sanitized summary
  const sanitizedSummary = buildSanitizedSummary(sanitizedText, reportType, meta);

  // 6. Build result object
  const createdAt = new Date().toISOString();
  const entryId   = generateEntryId();

  const result = {
    entry_id:           entryId,
    report_type:        reportType,
    type_confidence:    typeConfidence,
    source_type:        STDIN_MODE ? 'manual_paste' : 'local_file',
    source_path:        INPUT_PATH ? '[local — not committed]' : '[stdin]',
    created_at:         createdAt,
    branch:             meta.branch,
    head:               meta.head,
    files_changed:      meta.files_changed,
    tests_run:          meta.tests_run,
    external_operations: meta.external_operations,
    next_action:        meta.next_action,
    package_5b_status:  meta.package_5b_status,
    sanitized_summary:  sanitizedSummary,
    redaction_notes:    redactionNotes,
    high_risk_detected: highRiskFound.length > 0,
    redact_risk_accepted: REDACT_RISK,
    mirror_status:      APPLY_MODE ? 'mirrored' : 'draft',
    follow_up_required: false,
  };

  // 7. Output
  if (JSON_MODE && !APPLY_MODE) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  if (DRY_RUN || !APPLY_MODE) {
    console.log('REPORT INTAKE DRY-RUN');
    console.log('=====================');
    console.log(`Report type:      ${reportType} (${typeConfidence})`);
    console.log(`Source type:      ${result.source_type}`);
    if (meta.branch)             console.log(`Branch:           ${meta.branch}`);
    if (meta.head)               console.log(`HEAD:             ${meta.head}`);
    if (meta.files_changed)      console.log(`Files changed:    ${meta.files_changed}`);
    if (meta.tests_run)          console.log(`Tests/validators: ${meta.tests_run}`);
    if (meta.external_operations) console.log(`External ops:     ${meta.external_operations}`);
    if (meta.next_action)        console.log(`Next action:      ${meta.next_action}`);
    if (meta.package_5b_status)  console.log(`Package 5B:       ${meta.package_5b_status}`);
    if (redactionNotes.length > 0) {
      console.log(`Redaction notes:  ${redactionNotes.join('; ')}`);
    } else {
      console.log('Redaction notes:  none');
    }
    if (highRiskFound.length > 0) {
      console.log(`High-risk patterns (redacted): ${highRiskFound.join(', ')}`);
    }
    console.log('');
    console.log('SANITIZED SUMMARY PREVIEW:');
    console.log('---------------------------');
    console.log(sanitizedSummary);
    console.log('');
    console.log('STATUS: DRY-RUN COMPLETE — no writes.');
    console.log('Re-run with --apply to append to report-mirror-log.md.');
    process.exit(0);
  }

  // 8. Apply — write to committed mirror log
  if (APPLY_MODE) {
    const logPath = OUTPUT_PATH;
    if (!existsSync(logPath)) {
      console.error(`ERROR: Output file not found: ${logPath}`);
      console.error('Ensure docs/project-control/report-mirror-log.md exists before running --apply.');
      process.exit(1);
    }

    const entry = formatMirrorEntry(
      entryId, reportType, meta, sanitizedSummary, redactionNotes, createdAt
    );

    // Update index table row
    const currentContent = readFileSync(logPath, 'utf8');
    const emptyRow = '| — | — | — | — | — | — | — |';
    const newRow = `| ${entryId} | ${reportType} | ${meta.package_or_gate || '—'} | ${meta.branch || '—'} | ${meta.head || '—'} | mirrored | ${createdAt.slice(0, 10)} |`;

    let updatedContent;
    if (currentContent.includes(emptyRow)) {
      updatedContent = currentContent.replace(emptyRow, `${newRow}\n${emptyRow}`);
    } else {
      updatedContent = currentContent;
    }

    // Replace the placeholder text for "Entry detail" section
    const detailPlaceholder = '*(Entries will be appended here by `node scripts/report-mirror-intake.mjs --apply`.)* ';
    const detailPlaceholderAlt = '*(Entries will be appended here by `node scripts/report-mirror-intake.mjs --apply`.)*';

    if (updatedContent.includes(detailPlaceholder)) {
      updatedContent = updatedContent.replace(detailPlaceholder, entry.trim());
    } else if (updatedContent.includes(detailPlaceholderAlt)) {
      updatedContent = updatedContent.replace(detailPlaceholderAlt, entry.trim());
    } else {
      // Append to end of file
      updatedContent = updatedContent.trimEnd() + '\n' + entry;
    }

    try {
      const { writeFileSync } = await import('fs');
      writeFileSync(logPath, updatedContent, 'utf8');
    } catch (err) {
      console.error(`ERROR: Could not write to ${logPath}: ${err.message}`);
      process.exit(1);
    }

    if (JSON_MODE) {
      result.mirror_status = 'mirrored';
      result.output_path = logPath;
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('REPORT INTAKE APPLIED');
      console.log('=====================');
      console.log(`Entry ID:      ${entryId}`);
      console.log(`Appended to:   ${logPath}`);
      console.log(`Mirror status: mirrored`);
      console.log(`Report type:   ${reportType}`);
      if (meta.branch) console.log(`Branch:        ${meta.branch}`);
      if (meta.head)   console.log(`HEAD:          ${meta.head}`);
      if (redactionNotes.length > 0) console.log(`Redacted:      ${redactionNotes.join('; ')}`);
    }
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
