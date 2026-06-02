#!/usr/bin/env node
/**
 * Raw Transcript Check — Type 1 (File-First Response Record) Infrastructure
 *
 * Verifies that the file-first response record infrastructure is ready:
 * raw-transcripts/ is gitignored, the directory exists or will be created on
 * first use, and no transcript files accidentally appear in git status.
 *
 * This script validates Type 1 (file-first response record) readiness ONLY.
 * Type 2 (true terminal transcript capture) is not yet implemented and is
 * NOT checked by this script.
 *
 * No dependencies. No API calls. No external writes. Read-only local checks.
 * Exit 0 = Type 1 infrastructure ready. Exit 1 = one or more failures.
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TRANSCRIPT_DIR = join(ROOT, 'raw-transcripts', 'claude-code');
const PROBE_PATH = join('raw-transcripts', 'claude-code', 'example.md');

let failures = 0;
const lines = [];

function pass(msg) { lines.push(`[PASS] ${msg}`); }
function fail(msg) { lines.push(`[FAIL] ${msg}`); failures++; }
function info(msg) { lines.push(`[INFO] ${msg}`); }
function warn(msg) { lines.push(`[WARN] ${msg}`); }

// --- Check 1: raw-transcripts/ is gitignored ---
try {
  const result = execSync(`git check-ignore -v "${PROBE_PATH}"`, { cwd: ROOT, encoding: 'utf8' });
  if (result.trim()) {
    pass(`raw-transcripts/claude-code/ is gitignored (matched by: ${result.trim().split(':')[0]})`);
  } else {
    fail('raw-transcripts/claude-code/ is NOT gitignored — add raw-transcripts/ to .gitignore');
  }
} catch {
  fail('raw-transcripts/claude-code/ is NOT gitignored — git check-ignore returned no match');
}

// --- Check 2: No raw transcript files appear in git status ---
try {
  const status = execSync('git status --short', { cwd: ROOT, encoding: 'utf8' });
  const transcriptLines = status.split('\n').filter(l => l.includes('raw-transcripts'));
  if (transcriptLines.length === 0) {
    pass('No raw-transcripts/ files appear in git status --short');
  } else {
    fail(`raw-transcripts/ files appear in git status — they should be gitignored:\n    ${transcriptLines.join('\n    ')}`);
  }
} catch {
  warn('Could not run git status --short — skipping status check');
}

// --- Check 3: List recent transcript files ---
if (existsSync(TRANSCRIPT_DIR)) {
  try {
    const files = readdirSync(TRANSCRIPT_DIR)
      .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
      .map(f => ({ name: f, mtime: statSync(join(TRANSCRIPT_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 5);

    if (files.length === 0) {
      info('raw-transcripts/claude-code/ exists but contains no .md/.txt files yet — expected for a fresh setup');
    } else {
      info(`Recent transcript files (most recent first):`);
      files.forEach(f => lines.push(`        ${f.name}`));
    }
    pass('raw-transcripts/claude-code/ directory exists');
  } catch (e) {
    warn(`Could not list raw-transcripts/claude-code/ contents: ${e.message}`);
  }
} else {
  info('raw-transcripts/claude-code/ directory does not exist yet — it will be created on first file-first response');
  pass('raw-transcripts/claude-code/ absence is expected for fresh setups');
}

// --- Check 4: Protocol doc exists ---
const protocolDoc = join(ROOT, 'docs', 'dev', 'raw-transcript-capture-protocol.md');
if (existsSync(protocolDoc)) {
  pass('docs/dev/raw-transcript-capture-protocol.md exists');
} else {
  fail('docs/dev/raw-transcript-capture-protocol.md is missing — run Operator Reliability Repair');
}

// --- Check 5: Skill exists ---
const skillFile = join(ROOT, '.claude', 'skills', 'raw-transcript-capture', 'SKILL.md');
if (existsSync(skillFile)) {
  pass('.claude/skills/raw-transcript-capture/SKILL.md exists');
} else {
  fail('.claude/skills/raw-transcript-capture/SKILL.md is missing');
}

// --- Output ---
console.log('\n=== Raw Transcript Check (Type 1: File-First Response Record) ===\n');
lines.forEach(l => console.log(' ', l));
console.log('');
console.log(`Summary: ${lines.filter(l => l.startsWith('[PASS]')).length} pass, ${failures} fail`);
console.log('');
console.log('Note: This check validates Type 1 (file-first response record) infrastructure only.');
console.log('      Type 2 (true terminal transcript capture) is not yet implemented.');

if (failures === 0) {
  console.log('\nVERDICT: PASS — Type 1 file-first response record infrastructure ready.\n');
  process.exit(0);
} else {
  console.log(`\nVERDICT: FAIL — ${failures} issue(s) found.\n`);
  process.exit(1);
}
