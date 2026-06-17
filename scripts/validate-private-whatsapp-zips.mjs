#!/usr/bin/env node
/**
 * Private WhatsApp ZIP Validation Harness — Package P5C
 *
 * Validates real / sanitized WhatsApp export `.zip` archives against the
 * production native no-dependency ZIP reader (`KMEngine.WhatsAppZip`) and the
 * canonical import path (`whatsappTxtAdapter.importZip`) WITHOUT exposing any
 * private conversation content. The default output is privacy-safe and meant to
 * be pasted into chat; it carries only counts, booleans, and the engine's fixed
 * diagnostic-code vocabulary — never message text, participant names, phone
 * numbers, or raw filenames.
 *
 * This is the fixture-gated real-archive validation the P5A/P5B preflight
 * (`docs/architecture/whatsapp-zip-media-intake-preflight.md` §10/§11) records
 * as the single residual unknown before P5D ZIP-ingest UI wiring. It commits NO
 * private data: private archives live only in the gitignored
 * `scripts/fixtures/private/whatsapp/` directory.
 *
 * Usage:
 *   node scripts/validate-private-whatsapp-zips.mjs            # scan private dir, privacy-safe report
 *   node scripts/validate-private-whatsapp-zips.mjs --json     # same, machine-readable (still privacy-safe)
 *   node scripts/validate-private-whatsapp-zips.mjs --strict   # exit 1 on WARN as well as FAIL
 *   node scripts/validate-private-whatsapp-zips.mjs --dir PATH  # scan an alternate gitignored directory
 *   node scripts/validate-private-whatsapp-zips.mjs --selftest  # run against in-memory synthetic ZIPs (no private data)
 *   node scripts/validate-private-whatsapp-zips.mjs --debug     # ALSO print raw names — MAY CONTAIN PRIVATE DATA, do NOT paste
 *
 * Exit codes:
 *   0  SKIP (no private fixtures) | all archives PASS/WARN | --selftest OK
 *   1  one or more archives FAIL (or any WARN under --strict) | harness/self-check error
 *
 * Privacy contract: see docs/qa/private-whatsapp-zip-validation.md.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createContext, runInContext } from 'node:vm';
import { deflateRawSync } from 'node:zlib';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DEFAULT_DIR = 'scripts/fixtures/private/whatsapp';

// Engine modules, loaded in dependency order — mirrors the unit-test loader so
// the harness exercises the exact production reader, not a copy.
const MODULES = [
    'src/core/source-platforms.js',
    'src/core/normalized-memory.js',
    'src/core/import-adapters.js',
    'src/core/canonical-conversation.js',
    'src/core/import-adapter-contract.js',
    'src/core/whatsapp-zip-reader.js',
    'src/adapters/whatsapp-txt-adapter.js'
];

// ── Engine loading (production native path, via vm sandbox) ───────────────────

export function loadEngine() {
    const webGlobals = {};
    for (const k of ['DecompressionStream', 'Response', 'TextDecoder', 'TextEncoder']) {
        if (typeof globalThis[k] !== 'undefined') webGlobals[k] = globalThis[k];
    }
    const ctx = createContext(Object.assign({ window: {}, console }, webGlobals));
    for (const m of MODULES) runInContext(readFileSync(join(ROOT, m), 'utf8'), ctx);
    return ctx.window.KMEngine;
}

// ── Privacy-safe summarization (pure) ─────────────────────────────────────────
// Reads ONLY counts / booleans / fixed-vocabulary enum strings off the engine
// results. It never copies a filename, participant name, phone number, message
// body, or any free-form diagnostic value — diagnostics are tallied by `.code`
// alone (the engine's UPPER_SNAKE vocabulary), never by their data-bearing
// fields (e.g. AMBIGUOUS_MEDIA_MATCH.filename, SUSPICIOUS_ENTRY_NAME.name).

const CODE_RE = /^[A-Z][A-Z0-9_]*$/;

// Diagnostic codes that, on an otherwise-valid import, mean "native path worked
// but a human should review this archive" → WARN rather than PASS.
const REVIEW_CODES = [
    'AMBIGUOUS_MEDIA_MATCH',
    'DUPLICATE_MEDIA_BASENAME',
    'DUPLICATE_ARCHIVE_ENTRY',
    'SUSPICIOUS_ENTRY_NAME',
    'UNSUPPORTED_COMPRESSION',
    'INVALID_MEDIA_MANIFEST',
    'TRUNCATED_CENTRAL_DIRECTORY',
    'WEAK_GROUP_EVIDENCE',
    'BAD_TIMESTAMP',
    'CONTRACT_INVALID'
];

function methodLabel(method) {
    if (method === 0) return 'stored';
    if (method === 8) return 'deflate';
    return 'other';
}

function tallyCodes(warnings) {
    const counts = {};
    if (!Array.isArray(warnings)) return counts;
    for (const w of warnings) {
        const code = w && typeof w.code === 'string' ? w.code : null;
        if (!code || !CODE_RE.test(code)) continue;
        counts[code] = (counts[code] || 0) + 1;
    }
    return counts;
}

// Build the privacy-safe per-archive summary from raw engine outputs.
//   cdResult       — KMEngine.WhatsAppZip.readCentralDirectory(bytes)
//   archiveResult  — await KMEngine.WhatsAppZip.readArchive(bytes)
//   conversation   — await adapter.importZip(bytes)
//   contractValid  — Contract.validateConversation(conversation).valid
export function summarizeArchive({ label, cdResult, archiveResult, conversation, contractValid }) {
    const entries = (cdResult && Array.isArray(cdResult.entries)) ? cdResult.entries : [];
    const files = entries.filter(e => e && !e.isDirectory);

    const methodCounts = { stored: 0, deflate: 0, other: 0 };
    let utf8NameEntries = 0, nonUtf8NameEntries = 0, unsupportedMethodCount = 0;
    for (const e of files) {
        methodCounts[methodLabel(e.method)] += 1;
        if (e.utf8) utf8NameEntries += 1; else nonUtf8NameEntries += 1;
        if (e.method !== 0 && e.method !== 8) unsupportedMethodCount += 1;
    }

    const cdReason = cdResult && cdResult.ok === false ? cdResult.reason : null;
    const arReason = archiveResult && archiveResult.ok === false ? archiveResult.reason : null;
    const rejectionReason = archiveResult && archiveResult.ok === true ? null : (arReason || cdReason || null);
    const chatFileFound = !!(archiveResult && (archiveResult.ok === true || archiveResult.chatEntry));
    const encrypted = cdReason === 'ARCHIVE_ENCRYPTED' || arReason === 'ARCHIVE_ENCRYPTED';
    const zip64 = cdReason === 'ARCHIVE_ZIP64_UNSUPPORTED' || arReason === 'ARCHIVE_ZIP64_UNSUPPORTED';

    let messageCount = 0, participantCount = 0, systemEventCount = 0;
    let mediaAttachmentCount = 0, mediaPresentCount = 0, mediaMissingCount = 0, mediaOmittedCount = 0, mediaOtherCount = 0;
    let diagnosticCodeCounts = {};
    if (conversation) {
        messageCount = Array.isArray(conversation.messages) ? conversation.messages.length : 0;
        participantCount = Array.isArray(conversation.participants) ? conversation.participants.length : 0;
        systemEventCount = Array.isArray(conversation.systemEvents) ? conversation.systemEvents.length : 0;
        for (const m of (conversation.messages || [])) {
            for (const a of (m.media || [])) {
                mediaAttachmentCount += 1;
                if (a.present === true) mediaPresentCount += 1;
                else if (a.placeholderReason === 'missing-from-archive') mediaMissingCount += 1;
                else if (a.placeholderReason === 'omitted') mediaOmittedCount += 1;
                else mediaOtherCount += 1;
            }
        }
        const diag = conversation.diagnostics || {};
        diagnosticCodeCounts = tallyCodes(diag.warnings);
    }

    return {
        label,
        fileCount: files.length,
        directoryCount: entries.length - files.length,
        chatFileFound,
        archiveReadable: !!(archiveResult && archiveResult.ok === true),
        rejectionReason: rejectionReason && CODE_RE.test(rejectionReason) ? rejectionReason : (rejectionReason ? 'UNKNOWN' : null),
        encrypted,
        zip64,
        methodCounts,
        encoding: { utf8NameEntries, nonUtf8NameEntries },
        unsupportedMethodCount,
        contractValid: conversation ? !!contractValid : null,
        messageCount,
        participantCount,
        systemEventCount,
        mediaAttachmentCount,
        mediaPresentCount,
        mediaMissingCount,
        mediaOmittedCount,
        mediaOtherCount,
        diagnosticCodeCounts
    };
}

// PASS  — archive read, chat found, contract-valid, ≥1 message, nothing to review.
// WARN  — native path worked but something needs a human eye (missing media,
//         ambiguous/duplicate/suspicious names, unsupported method, empty chat).
// FAIL  — archive rejected, no chat file, or the produced conversation is invalid.
export function classifyArchive(s) {
    if (!s.archiveReadable || !s.chatFileFound || s.contractValid !== true) return 'FAIL';
    const hasReviewCode = Object.keys(s.diagnosticCodeCounts).some(c => REVIEW_CODES.includes(c));
    if (s.messageCount === 0 || s.mediaMissingCount > 0 || s.unsupportedMethodCount > 0 || hasReviewCode) return 'WARN';
    return 'PASS';
}

// Defense-in-depth: assert the summary's SHAPE cannot carry private data. Every
// value must be a number, boolean, null, a whitelisted enum, or a code map keyed
// by the engine's UPPER_SNAKE vocabulary. A filename / name / phone / body cannot
// satisfy these constraints, so a leak would throw here before anything prints.
const ALLOWED_METHOD_KEYS = ['stored', 'deflate', 'other'];
const ALLOWED_REASONS = null; // any UPPER_SNAKE token is allowed (engine reason vocabulary)

export function redactionSelfCheck(s, opts = {}) {
    const problems = [];
    const isCount = v => typeof v === 'number' && isFinite(v) && v >= 0;
    if (!opts.debug && !/^archive #\d+$/.test(String(s.label))) problems.push('label is not a non-identifying index');
    for (const k of ['fileCount', 'directoryCount', 'messageCount', 'participantCount', 'systemEventCount',
        'mediaAttachmentCount', 'mediaPresentCount', 'mediaMissingCount', 'mediaOmittedCount',
        'mediaOtherCount', 'unsupportedMethodCount']) {
        if (!isCount(s[k])) problems.push(`${k} is not a count`);
    }
    for (const k of ['chatFileFound', 'archiveReadable', 'encrypted', 'zip64']) {
        if (typeof s[k] !== 'boolean') problems.push(`${k} is not a boolean`);
    }
    if (!(s.contractValid === true || s.contractValid === false || s.contractValid === null)) problems.push('contractValid is not tri-state');
    if (s.rejectionReason !== null && !CODE_RE.test(String(s.rejectionReason))) problems.push('rejectionReason is not an enum code');
    for (const k of Object.keys(s.methodCounts || {})) {
        if (!ALLOWED_METHOD_KEYS.includes(k) || !isCount(s.methodCounts[k])) problems.push(`methodCounts.${k} invalid`);
    }
    for (const k of ['utf8NameEntries', 'nonUtf8NameEntries']) {
        if (!isCount(s.encoding && s.encoding[k])) problems.push(`encoding.${k} invalid`);
    }
    for (const code of Object.keys(s.diagnosticCodeCounts || {})) {
        if (!CODE_RE.test(code)) problems.push(`diagnostic code "${code}" is not an enum code`);
        if (!isCount(s.diagnosticCodeCounts[code])) problems.push(`diagnosticCodeCounts.${code} is not a count`);
    }
    return problems;
}

// Test/selftest helper: scan a summary (serialized) for known private strings.
// Returns the leaked substrings found (empty array = privacy-safe).
export function findPrivacyLeaks(summary, forbiddenStrings) {
    const hay = JSON.stringify(summary);
    const leaks = [];
    for (const s of (forbiddenStrings || [])) {
        if (s && hay.indexOf(s) !== -1) leaks.push(s);
    }
    return leaks;
}

// ── Per-archive validation (production native path) ───────────────────────────

export async function validateArchive(KMEngine, bytes, label) {
    const Zip = KMEngine.WhatsAppZip;
    const adapter = KMEngine.whatsappTxtAdapter;
    const Contract = KMEngine.ImportAdapterContract;

    const cdResult = Zip.readCentralDirectory(bytes);
    const archiveResult = await Zip.readArchive(bytes);
    const conversation = await adapter.importZip(bytes);
    const contractValid = Contract.validateConversation(conversation).valid;

    const summary = summarizeArchive({ label, cdResult, archiveResult, conversation, contractValid });
    const classification = classifyArchive(summary);

    // Debug block is opt-in and explicitly flagged as possibly-private; it is the
    // ONLY place raw names may appear, and the default report never includes it.
    const debug = {
        chatEntryBasename: archiveResult && archiveResult.chatEntry ? Zip.basename(archiveResult.chatEntry.name) : null,
        entryBasenames: (cdResult.entries || []).filter(e => e && !e.isDirectory).map(e => e.basename),
        rawDiagnostics: (conversation && conversation.diagnostics && conversation.diagnostics.warnings) || []
    };

    return { summary, classification, debug };
}

// ── Directory scan ────────────────────────────────────────────────────────────

export function scanForZips(dirAbs) {
    if (!existsSync(dirAbs)) return [];
    let names;
    try { names = readdirSync(dirAbs); } catch { return []; }
    return names
        .filter(n => /\.zip$/i.test(n))
        .filter(n => { try { return statSync(join(dirAbs, n)).isFile(); } catch { return false; } })
        .sort();
}

// ── Synthetic ZIP construction (selftest only; in-memory, never committed) ────

function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }

export function buildSyntheticZip(entries) {
    const enc = new TextEncoder();
    const toBytes = d => typeof d === 'string' ? enc.encode(d) : (d instanceof Uint8Array ? d : new Uint8Array(d));
    const local = [], central = [], records = [];
    let offset = 0;
    for (const e of entries) {
        const raw = toBytes(e.data == null ? '' : e.data);
        const method = e.method == null ? 0 : e.method;
        const stored = method === 8 ? new Uint8Array(deflateRawSync(raw)) : raw;
        const nameBytes = enc.encode(e.name);
        const flags = 0x0800;
        const lh = [].concat(
            u32(0x04034b50), u16(20), u16(flags), u16(method), u16(0), u16(0),
            u32(0), u32(stored.length), u32(raw.length), u16(nameBytes.length), u16(0)
        );
        records.push({ nameBytes, method, flags, comp: stored.length, unc: raw.length, offset });
        local.push(Uint8Array.from(lh), nameBytes, stored);
        offset += lh.length + nameBytes.length + stored.length;
    }
    const cdStart = offset;
    for (const r of records) {
        const ch = [].concat(
            u32(0x02014b50), u16(20), u16(20), u16(r.flags), u16(r.method), u16(0), u16(0),
            u32(0), u32(r.comp), u32(r.unc), u16(r.nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(r.offset)
        );
        central.push(Uint8Array.from(ch), r.nameBytes);
        offset += ch.length + r.nameBytes.length;
    }
    const cdSize = offset - cdStart;
    const eocd = [].concat(
        u32(0x06054b50), u16(0), u16(0), u16(records.length), u16(records.length),
        u32(cdSize), u32(cdStart), u16(0)
    );
    const parts = local.concat(central, [Uint8Array.from(eocd)]);
    let total = 0; for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let pos = 0; for (const p of parts) { out.set(p, pos); pos += p.length; }
    return out;
}

// Synthetic chats deliberately carry "private-looking" data so the selftest can
// prove none of it reaches the privacy-safe summary.
const SELFTEST_PRIVATE_STRINGS = [
    'Amina', 'Bilal', '+1 555 123 4567', 'secret plan text', 'call me later',
    '00000042-PHOTO.jpg', '00000099-MISSING.jpg'
];

function selftestFixtures() {
    const goodChat =
        '[6/13/24, 9:02:00 AM] Amina: secret plan text\n' +
        '[6/13/24, 9:03:00 AM] Amina: <attached: 00000042-PHOTO.jpg>\n' +
        '[6/13/24, 9:04:00 AM] Bilal: call me later\n';
    const warnChat =
        '[6/13/24, 9:02:00 AM] Amina: secret plan text\n' +
        '[6/13/24, 9:03:00 AM] Amina: <attached: 00000042-PHOTO.jpg>\n' +
        '[6/13/24, 9:04:00 AM] +1 555 123 4567: <attached: 00000099-MISSING.jpg>\n' +
        '[6/13/24, 9:05:00 AM] Bilal: <Media omitted>\n';
    return [
        { label: 'archive #01', expect: 'PASS', bytes: buildSyntheticZip([
            { name: '_chat.txt', data: goodChat, method: 0 },
            { name: '00000042-PHOTO.jpg', data: 'JPEGDATAxxxxxxxxxxxx', method: 8 }
        ]) },
        { label: 'archive #02', expect: 'WARN', bytes: buildSyntheticZip([
            { name: '_chat.txt', data: warnChat, method: 0 },
            { name: '00000042-PHOTO.jpg', data: 'JPEGDATAxxxxxxxxxxxx', method: 0 }
        ]) },
        { label: 'archive #03', expect: 'FAIL', bytes: buildSyntheticZip([
            { name: '00000042-PHOTO.jpg', data: 'JPEGDATA', method: 0 }
        ]) }
    ];
}

// ── Output formatting (privacy-safe) ──────────────────────────────────────────

function fmtCodeMap(map) {
    const keys = Object.keys(map).sort();
    if (keys.length === 0) return '(none)';
    return keys.map(k => `${k}×${map[k]}`).join(', ');
}

export function formatReport(results, opts = {}) {
    const lines = [];
    lines.push('=== Private WhatsApp ZIP Validation — Package P5C ===');
    lines.push('');
    lines.push('PRIVACY-SAFE SUMMARY — safe to share. No message text, participant');
    lines.push('names, phone numbers, or filenames are included below.');
    lines.push('');

    const tally = { PASS: 0, WARN: 0, FAIL: 0 };
    for (const r of results) {
        const s = r.summary;
        tally[r.classification] += 1;
        lines.push(`${s.label}  [${r.classification}]`);
        lines.push(`  files: ${s.fileCount} (dirs ${s.directoryCount})   chat file found: ${s.chatFileFound}   archive readable: ${s.archiveReadable}`);
        lines.push(`  rejection reason: ${s.rejectionReason || '(none)'}   encrypted: ${s.encrypted}   zip64: ${s.zip64}`);
        lines.push(`  compression: stored ${s.methodCounts.stored}, deflate ${s.methodCounts.deflate}, other ${s.methodCounts.other}   unsupported-method entries: ${s.unsupportedMethodCount}`);
        lines.push(`  name encoding: utf8 ${s.encoding.utf8NameEntries}, non-utf8 ${s.encoding.nonUtf8NameEntries}`);
        lines.push(`  contract-valid conversation: ${s.contractValid}`);
        lines.push(`  messages: ${s.messageCount}   participants: ${s.participantCount}   system events: ${s.systemEventCount}`);
        lines.push(`  media: ${s.mediaAttachmentCount} (present ${s.mediaPresentCount}, missing ${s.mediaMissingCount}, omitted ${s.mediaOmittedCount}, other ${s.mediaOtherCount})`);
        lines.push(`  diagnostics (by code): ${fmtCodeMap(s.diagnosticCodeCounts)}`);
        lines.push('');
    }

    lines.push('--- Aggregate ---');
    lines.push(`archives: ${results.length}   PASS ${tally.PASS}   WARN ${tally.WARN}   FAIL ${tally.FAIL}`);
    lines.push('');
    lines.push('Interpretation: PASS = native no-dependency reader handled the archive');
    lines.push('cleanly. WARN = it worked but flagged items to review (missing media,');
    lines.push('duplicate/ambiguous/suspicious names, unsupported method, empty chat).');
    lines.push('FAIL = the archive was rejected, had no chat file, or produced an invalid');
    lines.push('conversation — a candidate trigger to reconsider the gated fflate fallback.');
    lines.push('');
    lines.push('P5D gate: do NOT begin ZIP-ingest UI wiring until at least one real');
    lines.push('sanitized with-media archive (1:1 and group) reaches PASS, or WARN whose');
    lines.push('diagnostics are understood and accepted. See');
    lines.push('docs/qa/private-whatsapp-zip-validation.md.');

    if (opts.debug) {
        lines.push('');
        lines.push('################################################################');
        lines.push('# DEBUG OUTPUT BELOW — MAY CONTAIN PRIVATE DATA (filenames etc.)');
        lines.push('# DO NOT paste this section into chat or any AI assistant.');
        lines.push('################################################################');
        for (const r of results) {
            lines.push('');
            lines.push(`${r.summary.label} debug:`);
            lines.push(`  chat entry basename: ${r.debug.chatEntryBasename}`);
            lines.push(`  entry basenames: ${JSON.stringify(r.debug.entryBasenames)}`);
            lines.push(`  raw diagnostics: ${JSON.stringify(r.debug.rawDiagnostics)}`);
        }
    }

    return lines.join('\n');
}

// ── Selftest ──────────────────────────────────────────────────────────────────

async function runSelftest(opts) {
    const KMEngine = loadEngine();
    const fixtures = selftestFixtures();
    const results = [];
    let failures = 0;

    for (const f of fixtures) {
        const r = await validateArchive(KMEngine, f.bytes, f.label);
        results.push(r);

        const shape = redactionSelfCheck(r.summary, { debug: false });
        if (shape.length) { failures++; console.error(`  SELFTEST FAIL [${f.label}]: shape leak — ${shape.join('; ')}`); }

        const leaks = findPrivacyLeaks(r.summary, SELFTEST_PRIVATE_STRINGS);
        if (leaks.length) { failures++; console.error(`  SELFTEST FAIL [${f.label}]: private data in summary — ${leaks.join(', ')}`); }

        if (r.classification !== f.expect) {
            failures++;
            console.error(`  SELFTEST FAIL [${f.label}]: expected ${f.expect}, got ${r.classification}`);
        }
    }

    console.log(formatReport(results, opts));
    console.log('');
    console.log(`--- Selftest (synthetic in-memory archives, no private data) ---`);
    console.log(failures === 0
        ? 'Selftest PASS: 3/3 synthetic archives classified correctly; privacy-safe summary contains no synthetic private strings; shape self-check clean.'
        : `Selftest FAIL: ${failures} problem(s) — see above.`);
    return failures === 0 ? 0 : 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function main(argv) {
    const args = argv || [];
    const JSON_MODE = args.includes('--json');
    const STRICT = args.includes('--strict');
    const DEBUG = args.includes('--debug');
    const SELFTEST = args.includes('--selftest');
    const dirArgIdx = args.indexOf('--dir');
    const dirRel = dirArgIdx !== -1 && args[dirArgIdx + 1] ? args[dirArgIdx + 1] : DEFAULT_DIR;

    if (SELFTEST) return runSelftest({ debug: DEBUG });

    const dirAbs = resolve(ROOT, dirRel);
    const zips = scanForZips(dirAbs);

    if (zips.length === 0) {
        const payload = {
            result: 'SKIP',
            reason: 'NO_PRIVATE_FIXTURES',
            scannedDir: dirRel,
            note: 'No .zip archives found. Place sanitized WhatsApp exports in the gitignored ' +
                  'directory, then re-run. See docs/qa/private-whatsapp-zip-validation.md.'
        };
        if (JSON_MODE) { console.log(JSON.stringify(payload, null, 2)); return 0; }
        console.log('=== Private WhatsApp ZIP Validation — Package P5C ===');
        console.log('');
        console.log(`SKIP — NO_PRIVATE_FIXTURES`);
        console.log(`Scanned: ${dirRel} (gitignored)`);
        console.log('No .zip archives found there. This is the expected state in a clean');
        console.log('checkout — private archives are never committed. To validate real');
        console.log('archives, place sanitized WhatsApp `.zip` exports in that directory and');
        console.log('re-run. Sanitization + privacy guidance: docs/qa/private-whatsapp-zip-validation.md.');
        console.log('');
        console.log('To prove the harness end-to-end without private data:');
        console.log('  node scripts/validate-private-whatsapp-zips.mjs --selftest');
        return 0;
    }

    const KMEngine = loadEngine();
    const results = [];
    let leaked = false;
    for (let i = 0; i < zips.length; i++) {
        const label = `archive #${String(i + 1).padStart(2, '0')}`;
        const bytes = new Uint8Array(readFileSync(join(dirAbs, zips[i])));
        const r = await validateArchive(KMEngine, bytes, label);
        const shape = redactionSelfCheck(r.summary, { debug: false });
        if (shape.length) {
            leaked = true;
            console.error(`Privacy self-check failed for ${label}: ${shape.join('; ')}`);
        }
        results.push(r);
    }

    if (leaked) {
        console.error('ABORTED: a summary failed the structural privacy self-check; refusing to emit possibly-unsafe output.');
        return 1;
    }

    if (JSON_MODE) {
        console.log(JSON.stringify({
            result: 'VALIDATED',
            scannedDir: dirRel,
            archives: results.map(r => ({ classification: r.classification, summary: r.summary }))
        }, null, 2));
    } else {
        console.log(formatReport(results, { debug: DEBUG }));
    }

    const anyFail = results.some(r => r.classification === 'FAIL');
    const anyWarn = results.some(r => r.classification === 'WARN');
    if (anyFail) return 1;
    if (STRICT && anyWarn) return 1;
    return 0;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
    main(process.argv.slice(2)).then(code => process.exit(code)).catch(err => {
        console.error('Harness error:', err && err.stack ? err.stack : err);
        process.exit(1);
    });
}
