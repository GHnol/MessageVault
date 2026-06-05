import { createContext, runInContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function load(ctx, relPath) {
    const abs  = join(__dirname, '../../', relPath);
    const code = readFileSync(abs, 'utf8');
    runInContext(code, ctx);
}

function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/core/source-platforms.js');
    load(ctx, 'src/core/normalized-memory.js');
    load(ctx, 'src/core/import-adapters.js');
    load(ctx, 'src/adapters/android-sms-xml-adapter.js');
    return ctx.window.KMEngine;
}

const KMEngine = makeCtx();
const adapter  = KMEngine.androidSmsAdapter;

const FIXTURE_PATH = join(__dirname, '../../scripts/fixtures/fake-android-sms-backup.xml');
const FIXTURE      = readFileSync(FIXTURE_PATH, 'utf8');

// Minimal inline XML snippets — no real user data
const MINIMAL_SMS  = '<smses count="1"><sms date="1705305600000" type="1" address="+15559990001" body="Hello" readable_date="Jan 15, 2024 8:00:00 AM" contact_name="Alice" /></smses>';
const MINIMAL_MMS  = '<smses count="1"><mms date="1705305600000" msg_box="1" address="+15559990001" contact_name="Alice" readable_date="Jan 15, 2024 8:00:00 AM" /></smses>';
const SMS_MMS_BOTH = '<smses count="2"><sms date="1705305600000" type="2" address="+15559990001" body="Hi" readable_date="Jan 15, 2024 8:00:00 AM" contact_name="Alice" /><mms date="1705309200000" msg_box="1" address="+15559990001" contact_name="Alice" readable_date="Jan 15, 2024 9:00:00 AM" /></smses>';
const SINGLE_QUOTE = "<smses count='1'><sms date='1705305600000' type='1' address='+15559990001' body='Hi' readable_date='Jan 15, 2024' contact_name='Alice' /></smses>";
const SMS_TYPE1    = '<smses count="1"><sms date="1705305600000" type="1" address="+15559990001" body="Received message" readable_date="Jan 15, 2024 8:00:00 AM" contact_name="Robin" /></smses>';
const SMS_TYPE2    = '<smses count="1"><sms date="1705309200000" type="2" address="+15559990001" body="Sent message" readable_date="Jan 15, 2024 9:00:00 AM" contact_name="Robin" /></smses>';
const SMS_NO_CONTACT = '<smses count="1"><sms date="1705305600000" type="1" address="+15559990002" body="No contact name" readable_date="Jan 15, 2024 8:00:00 AM" contact_name="null" /></smses>';
const MMS_INBOX    = '<smses count="1"><mms date="1705305600000" msg_box="1" address="+15559990001" contact_name="Robin" readable_date="Jan 15, 2024 8:00:00 AM" /></smses>';
const MMS_SENT     = '<smses count="1"><mms date="1705305600000" msg_box="2" address="+15559990001" contact_name="Robin" readable_date="Jan 15, 2024 8:00:00 AM" /></smses>';

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error('  FAIL:', label);
    }
}

function suite(name, fn) {
    console.log('\n' + name);
    fn();
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 1 — API shape', function () {
    assert(adapter !== undefined && adapter !== null,                         'androidSmsAdapter exists on KMEngine');
    assert(adapter.id === 'android-sms-xml-v1',                              'id is android-sms-xml-v1');
    assert(adapter.sourcePlatformId === 'android-sms',                       'sourcePlatformId is android-sms');
    assert(typeof adapter.label === 'string' && adapter.label.length > 0,    'label is a non-empty string');
    assert(typeof adapter.canHandle === 'function',                           'canHandle is a function');
    assert(typeof adapter.normalizeAll === 'function',                        'normalizeAll is a function');
    assert(typeof adapter['import'] === 'function',                           'import is a function');
    assert(Array.isArray(adapter._lastWarnings),                              '_lastWarnings is an array');
    assert(KMEngine.adapters['android-sms-xml-v1'] === adapter,              'adapter registered in KMEngine.adapters');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — canHandle: accepts
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 2 — canHandle: accepts', function () {
    assert(adapter.canHandle(MINIMAL_SMS) === true,         '<smses> + <sms> → true');
    assert(adapter.canHandle(MINIMAL_MMS) === true,         '<smses> + <mms> → true');
    assert(adapter.canHandle(SMS_MMS_BOTH) === true,        '<smses> with <sms> and <mms> → true');
    assert(adapter.canHandle(SINGLE_QUOTE) === true,        'single-quoted attributes → true');
    assert(adapter.canHandle(FIXTURE) === true,             'full fixture file → true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — canHandle: rejects
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 3 — canHandle: rejects', function () {
    assert(adapter.canHandle('') === false,                                         'empty string → false');
    assert(adapter.canHandle('   ') === false,                                      'whitespace-only → false');
    assert(adapter.canHandle(42) === false,                                         'number input → false');
    assert(adapter.canHandle('Me|Alex|2024-01-01|Hello there') === false,           'pipe-delimited TXT → false');
    assert(adapter.canHandle('[6/1/24, 9:00:00 AM] Alice: Hi') === false,           'WhatsApp bracket format → false');
    assert(adapter.canHandle('<html><body>Hello</body></html>') === false,           'HTML without <smses> → false');
    assert(adapter.canHandle('<smses count="0"></smses>') === false,                '<smses> with no messages → false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — SMS field parsing: type=1 (received)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 4 — SMS field parsing: type=1 (received)', function () {
    const result = adapter['import'](SMS_TYPE1);
    const mem    = result.memories[0];
    assert(result.memories.length === 1,                  'one memory produced');
    assert(mem.sender === 'Robin',                        'sender = contact_name');
    assert(mem.senderRole === 'contact',                  'senderRole = contact for type=1');
    assert(mem.text === 'Received message',               'text = body attribute');
    assert(mem.type === 'message',                        'type = message');
    assert(mem.isAttachmentOnly === false,                 'isAttachmentOnly = false');
    assert(typeof mem.timestamp === 'string' && mem.timestamp.length > 0, 'timestamp is a string');
    assert(mem.timestamp === '2024-01-15T08:00:00.000Z',  'timestamp parsed from millisecond epoch');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — SMS field parsing: type=2 (sent)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 5 — SMS field parsing: type=2 (sent)', function () {
    const result = adapter['import'](SMS_TYPE2);
    const mem    = result.memories[0];
    assert(result.memories.length === 1,                 'one memory produced');
    assert(mem.sender === 'Me',                          'sender = Me for type=2');
    assert(mem.senderRole === 'self',                    'senderRole = self for type=2');
    assert(mem.text === 'Sent message',                  'text = body attribute');
    assert(mem.type === 'message',                       'type = message');
    assert(mem.timestamp === '2024-01-15T09:00:00.000Z', 'timestamp parsed from millisecond epoch');
    assert(mem.isAttachmentOnly === false,                'isAttachmentOnly = false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — senderRole derivation
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 6 — senderRole derivation', function () {
    const r1 = adapter['import'](SMS_TYPE1).memories[0];
    assert(r1.senderRole === 'contact',              'type=1 → senderRole contact');

    const r2 = adapter['import'](SMS_TYPE2).memories[0];
    assert(r2.senderRole === 'self',                 'type=2 → senderRole self');

    const r3 = adapter['import'](SMS_NO_CONTACT).memories[0];
    assert(r3.senderRole === 'contact',              'type=1 with contact_name="null" → senderRole still contact');
    assert(r3.sender === '+15559990002',             'falls back to address when contact_name is "null"');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — MMS attachment placeholder handling
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 7 — MMS attachment placeholder handling', function () {
    const inboxResult = adapter['import'](MMS_INBOX);
    const inboxMem    = inboxResult.memories[0];
    assert(inboxResult.memories.length === 1,              'one memory from MMS inbox');
    assert(inboxMem.type === 'attachment-placeholder',     'MMS type = attachment-placeholder');
    assert(inboxMem.isAttachmentOnly === true,             'MMS isAttachmentOnly = true');
    assert(inboxMem.text === '[Attachment]',               'MMS text = [Attachment]');
    assert(inboxMem.senderRole === 'contact',              'msg_box=1 → senderRole contact');
    assert(inboxMem.sender === 'Robin',                    'msg_box=1 → sender = contact_name');

    const sentResult = adapter['import'](MMS_SENT);
    const sentMem    = sentResult.memories[0];
    assert(sentMem.senderRole === 'self',                  'msg_box=2 → senderRole self');
    assert(sentMem.sender === 'Me',                        'msg_box=2 → sender = Me');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — Fixture import rawCounts
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 8 — Fixture import rawCounts', function () {
    const result = adapter['import'](FIXTURE);
    assert(result.rawCounts.total === 10,       'rawCounts.total = 10 (8 SMS + 2 MMS)');
    assert(result.rawCounts.imported === 9,     'rawCounts.imported = 9 (7 valid SMS + 2 MMS)');
    assert(result.rawCounts.skipped === 1,      'rawCounts.skipped = 1 (malformed SMS)');
    assert(result.memories.length === 9,        'memories.length = 9');
    assert(result.importWarnings.length === 1,  'importWarnings.length = 1');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — Participants first-seen order
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 9 — Participants first-seen order', function () {
    const result = adapter['import'](FIXTURE);
    const parts  = result.participants;
    assert(Array.isArray(parts),            'participants is an array');
    assert(parts[0] === 'Jordan',           'first participant is Jordan (first SMS is type=1 from Jordan)');
    assert(parts[1] === 'Me',              'second participant is Me (second SMS is type=2)');
    assert(parts[2] === 'Casey',           'third participant is Casey (third SMS is type=1 from Casey)');
    assert(parts[3] === 'Alex',            'fourth participant is Alex (sixth SMS, empty body)');
    assert(parts.length === 4,             'no duplicate participants');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — NormalizedMemory required fields
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 10 — NormalizedMemory required fields', function () {
    const result = adapter['import'](FIXTURE);
    const mem    = result.memories[0];
    assert(typeof mem.id === 'string' && mem.id.startsWith('mem-'), 'id starts with mem-');
    assert(mem.sourcePlatformId === 'android-sms',                  'sourcePlatformId = android-sms');
    assert(mem.sourceAdapterId  === 'android-sms-xml-v1',           'sourceAdapterId = android-sms-xml-v1');
    assert(Array.isArray(mem.reactions) && mem.reactions.length === 0, 'reactions = []');
    assert(typeof mem.sender === 'string' && mem.sender.length > 0, 'sender is a non-empty string');
    assert(typeof mem.timestamp === 'string',                        'timestamp is a string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — Provenance and adapterVersion
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 11 — Provenance and adapterVersion', function () {
    const result = adapter['import'](FIXTURE);
    const mem    = result.memories[0];
    assert(typeof mem.provenance === 'object' && mem.provenance !== null, 'provenance is an object');
    assert(typeof mem.provenance.importedAt === 'string',                 'provenance.importedAt is a string');
    assert(mem.provenance.adapterVersion === '1',                         'provenance.adapterVersion = 1');
    assert(result.adapterVersion === '1',                                 'ImportResult.adapterVersion = 1');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — Empty and malformed input does not throw
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 12 — Empty and malformed input does not throw', function () {
    let r;
    assert((r = adapter['import'](''), r.memories.length === 0),          'empty string → 0 memories, no throw');
    assert((r = adapter['import']('   '), r.memories.length === 0),       'whitespace-only → 0 memories, no throw');
    assert((r = adapter['import']('not xml at all'), r.memories.length === 0), 'non-XML text → 0 memories, no throw');
    assert((r = adapter['import']('<smses count="0"></smses>'), r.memories.length === 0), 'empty <smses> → 0 memories, no throw');
    assert((r = adapter['import']('<smses><sms /></smses>'), true),        'bare <sms/> inside <smses> → no throw');
    assert((r = adapter['import'](42), r.memories.length === 0),          'number input → 0 memories, no throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — importWarnings behavior
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 13 — importWarnings behavior', function () {
    const result = adapter['import'](FIXTURE);
    const warn   = result.importWarnings[0];
    assert(result.importWarnings.length === 1,                  'fixture produces exactly 1 warning');
    assert(typeof warn.index === 'number',                      'warning has numeric index');
    assert(typeof warn.message === 'string',                    'warning has string message');
    assert(warn.message.indexOf('SMS') !== -1 || warn.message.indexOf('sender') !== -1,
                                                                'warning message references SMS or sender');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — Semantic guards
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 14 — Semantic guards', function () {
    const result = adapter['import'](FIXTURE);
    const mem    = result.memories[0];
    assert(mem.proof               === undefined, 'no proof field on NormalizedMemory');
    assert(mem.checkout            === undefined, 'no checkout field on NormalizedMemory');
    assert(mem.manufacturing       === undefined, 'no manufacturing field on NormalizedMemory');
    assert(mem.page                === undefined, 'no page field on NormalizedMemory');
    assert(adapter.isManufacturingReady === undefined, 'no isManufacturingReady on adapter');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
