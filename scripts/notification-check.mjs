#!/usr/bin/env node
/**
 * Notification Check
 *
 * Reads the active Claude Code settings.json and reports which notification
 * hooks are configured. Checks both the default config dir and the
 * KeepMees-specific iCloud config dir.
 *
 * No dependencies. No external writes. Read-only local checks.
 * Exit 0 = hooks found. Exit 1 = no hooks found or config missing.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();

// Known config dirs to check for this environment
const CONFIG_DIRS = [];

// CLAUDE_CONFIG_DIR env var takes priority
if (process.env.CLAUDE_CONFIG_DIR) {
  CONFIG_DIRS.push({ label: 'CLAUDE_CONFIG_DIR (env)', path: process.env.CLAUDE_CONFIG_DIR });
}

// Default path
const defaultDir = process.platform === 'win32'
  ? join(process.env.USERPROFILE || HOME, '.claude')
  : join(HOME, '.claude');
CONFIG_DIRS.push({ label: 'default (~/.claude)', path: defaultDir });

// KeepMees iCloud-synced dir (documented in notification-setup.md)
const icloudDir = process.platform === 'win32'
  ? join(process.env.USERPROFILE || HOME, '.claude-account-icloud')
  : join(HOME, '.claude-account-icloud');
if (existsSync(icloudDir)) {
  CONFIG_DIRS.push({ label: 'iCloud account dir (~/.claude-account-icloud)', path: icloudDir });
}

const KNOWN_HOOK_EVENTS = [
  { key: 'Notification', desc: 'Fires when harness wants to alert user (permission prompts, etc.)' },
  { key: 'notification', desc: 'Lowercase alias — fires on some Claude Code versions' },
  { key: 'Stop', desc: 'Fires when Claude finishes a turn (completion sound)' },
  { key: 'stop', desc: 'Lowercase alias — fires on some Claude Code versions' },
  { key: 'PermissionRequest', desc: 'Fires on permission prompts (use if Notification does not fire)' },
  { key: 'PreToolUse', desc: 'Fires before every tool call (high frequency — use carefully)' },
];

let globalPass = true;
const output = [];

function heading(s) { output.push(`\n=== ${s} ===`); }
function line(s) { output.push(s); }

heading('Notification Check — KeepMees Claude Code');

for (const configEntry of CONFIG_DIRS) {
  line(`\n--- Config dir: ${configEntry.label}`);
  line(`    Path: ${configEntry.path}`);

  const settingsFile = join(configEntry.path, 'settings.json');

  if (!existsSync(configEntry.path)) {
    line(`    [INFO] Directory does not exist — Claude Code has not been run with this config dir, or the path is wrong.`);
    continue;
  }

  if (!existsSync(settingsFile)) {
    line(`    [WARN] settings.json not found at ${settingsFile}`);
    line(`    [WARN] No hooks are configured for this config dir.`);
    line(`    [FIX]  Run: .\\scripts\\setup-claude-notification.ps1 -ConfigDir "${configEntry.path}"`);
    line(`    [FIX]  Or see: docs/dev/notification-setup.md`);
    globalPass = false;
    continue;
  }

  let settings = null;
  try {
    const raw = readFileSync(settingsFile, 'utf8');
    settings = JSON.parse(raw);
    line(`    [PASS] settings.json found and valid JSON`);
  } catch (e) {
    line(`    [FAIL] settings.json could not be parsed: ${e.message}`);
    globalPass = false;
    continue;
  }

  const hooks = settings.hooks || {};
  const foundHooks = [];
  const missingHooks = [];

  for (const event of KNOWN_HOOK_EVENTS) {
    const value = hooks[event.key];
    if (value !== undefined) {
      // Handle both string and array hook formats
      const entries = Array.isArray(value) ? value : [value];
      foundHooks.push({ event: event.key, desc: event.desc, entries });
    }
  }

  // Check specifically for Stop/stop — this is the "completion sound" hook
  const hasStop = hooks['Stop'] !== undefined || hooks['stop'] !== undefined;
  const hasPermissionRequest = hooks['PermissionRequest'] !== undefined || hooks['Notification'] !== undefined || hooks['notification'] !== undefined;

  if (foundHooks.length === 0) {
    line(`    [WARN] No notification hooks found in settings.json`);
    line(`    [FIX]  Run: .\\scripts\\setup-claude-notification.ps1 -ConfigDir "${configEntry.path}"`);
    line(`    [FIX]  For completion sound: add "Stop" hook — see docs/dev/notification-setup.md`);
    globalPass = false;
  } else {
    line(`    [PASS] ${foundHooks.length} hook event(s) configured:`);
    for (const h of foundHooks) {
      const count = h.entries.length;
      line(`      Hook: ${h.key || h.event}`);
      line(`      Desc: ${h.desc}`);
      line(`      Entries: ${count} entry/entries`);
      // Show command preview (first entry only, truncated)
      if (typeof h.entries[0] === 'string') {
        const preview = h.entries[0].slice(0, 80);
        line(`      Command: ${preview}${h.entries[0].length > 80 ? '...' : ''}`);
      } else if (h.entries[0]?.hooks?.[0]?.command) {
        const preview = h.entries[0].hooks[0].command.slice(0, 80);
        line(`      Command: ${preview}${h.entries[0].hooks[0].command.length > 80 ? '...' : ''}`);
      }
    }
  }

  // Completion sound specific diagnosis
  line('');
  line(`    --- Completion sound diagnosis ---`);
  if (hasStop) {
    line(`    [PASS] Stop hook is configured — Claude will fire a sound when it finishes a turn`);
  } else {
    line(`    [WARN] No Stop hook found — completion sound will NOT fire when Claude finishes a turn`);
    line(`    [FIX]  Add a "Stop" hook to settings.json:`);
    line(`           "Stop": "powershell -NoProfile -Command \\"[console]::beep(660,200)\\""`);
    line(`    [FIX]  Or run the setup wizard and add Stop hook manually.`);
    line(`    [INFO] See: docs/dev/notification-setup.md § "Multiple events"`);
    if (!globalPass) { /* already false */ } else { globalPass = false; }
  }

  if (hasPermissionRequest) {
    line(`    [PASS] Permission/notification hook is configured — Claude will fire a sound when waiting for permission`);
  } else {
    line(`    [WARN] No Notification/PermissionRequest hook found — no sound when Claude waits for permission`);
    line(`    [FIX]  Run: .\\scripts\\setup-claude-notification.ps1 -ConfigDir "${configEntry.path}"`);
    globalPass = false;
  }
}

// --- Multi-account warning ---
if (CONFIG_DIRS.length > 2) {
  line(`\n[INFO] Multiple config dirs detected. Hooks must be present in EACH config dir used for KeepMees.`);
  line(`[INFO] See: docs/dev/notification-setup.md § "Multi-account setup"`);
}

// --- Manual test instructions ---
line('\n--- Manual test instructions ---');
line('1. Test permission sound: run any command that triggers a permission prompt in Claude Code.');
line('   You should hear the permission hook sound.');
line('2. Test completion sound: run any Claude prompt. When Claude finishes its response, you should hear the Stop hook sound.');
line('3. If no sound: test the command directly in PowerShell:');
line('   powershell -NoProfile -Command "[console]::beep(880,250)"');
line('4. If beep command fails: check Windows volume mixer for your terminal app.');
line('5. Full guide: docs/dev/notification-setup.md');

// --- Output ---
output.forEach(l => console.log(l));
console.log('');
console.log(`Verdict: ${globalPass ? 'PASS — notification hooks verified' : 'WARN — one or more hooks missing or config dir not found'}`);
console.log('');

process.exit(globalPass ? 0 : 1);
