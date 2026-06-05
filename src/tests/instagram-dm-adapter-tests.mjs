/**
 * Instagram DM JSON adapter tests.
 * Run with: node src/tests/instagram-dm-adapter-tests.mjs
 */

import { createContext, runInContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

function load(ctx, rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    runInContext(code, ctx);
}

function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/core/source-platforms.js');
    load(ctx, 'src/core/normalized-memory.js');
    load(ctx, 'src/core/import-adapters.js');
    load(ctx, 'src/adapters/instagram-dm-adapter.js');
    return ctx.window.KMEngine;
}

const KMEngine = makeCtx();
const adapter  = KMEngine.instagramDmAdapter;

const FIXTURE_PATH = join(ROOT, 'scripts', 'fixtures', 'fake-instagram-dm.json');
const FIXTURE      = readFileSync(FIXTURE_PATH, 'utf8');
const fixtureResult = adapter['import'](FIXTURE);

// ── Inline test data ──────────────────────────────────────────────────────────

const MINIMAL_VALID = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}';

const PHOTO_MSG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"photos":[{"uri":"photos/pic.jpg","creation_timestamp":1640000000}],"type":"Generic"}]}';

const VIDEO_MSG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"videos":[{"uri":"videos/vid.mp4","creation_timestamp":1640000000}],"type":"Generic"}]}';

const SHARE_MSG = '{"participants":[{"name":"bob"}],"messages":[{"sender_name":"bob","timestamp_ms":1640000000000,"share":{"link":"https://www.instagram.com/p/FakePost/","share_text":"Check this"},"type":"Share"}]}';

const MULTI_MSG = '{"participants":[{"name":"Alice"},{"name":"Bob"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hello","type":"Generic"},{"sender_name":"Bob","timestamp_ms":1640000060000,"content":"Hey","type":"Generic"},{"sender_name":"Alice","timestamp_ms":1640000120000,"content":"How are you?","type":"Generic"}]}';

const ENTITY_SENDER_AMP  = '{"participants":[{"name":"Alice & Bob"}],"messages":[{"sender_name":"Alice &amp; Bob","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}';
const ENTITY_SENDER_APOS = '{"participants":[{"name":"Ali\'s"}],"messages":[{"sender_name":"Ali&#39;s","timestamp_ms":1640000000000,"content":"Hello","type":"Generic"}]}';
const ENTITY_SENDER_LT   = '{"participants":[{"name":"<Alice>"}],"messages":[{"sender_name":"&lt;Alice&gt;","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}';

const ENTITY_HEX = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"&#x48;ello","type":"Generic"}]}';

const NO_MESSAGES_JSON    = '{"participants":[{"name":"Alice"}]}';
const EMPTY_MESSAGES_JSON = '{"participants":[{"name":"Alice"}],"messages":[]}';
const NO_TIMESTAMP_JSON   = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","content":"Hi","type":"Generic"}]}';

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }

function assert(condition, label) {
    if (condition) {
        console.log('  PASS  ' + label);
        passed++;
    } else {
        console.error('  FAIL  ' + label);
        failed++;
    }
}

// ── Suite 1 — API shape ───────────────────────────────────────────────────────

suite('Suite 1 — API shape');
assert(adapter !== undefined,                                        'instagramDmAdapter exists on KMEngine');
assert(adapter.id === 'instagram-dm-json-v1',                        'id is instagram-dm-json-v1');
assert(adapter.sourcePlatformId === 'instagram-dm',                  'sourcePlatformId is instagram-dm');
assert(typeof adapter.label === 'string' && adapter.label.length > 0, 'label is a non-empty string');
assert(typeof adapter.canHandle === 'function',                      'canHandle is a function');
assert(typeof adapter.normalizeAll === 'function',                   'normalizeAll is a function');
assert(typeof adapter['import'] === 'function',                      'import is a function');
assert(Array.isArray(adapter._lastWarnings),                         '_lastWarnings is an array');
assert(KMEngine.adapters['instagram-dm-json-v1'] === adapter,        'adapter is registered in KMEngine.adapters');

// ── Suite 2 — canHandle: accepts ──────────────────────────────────────────────

suite('Suite 2 — canHandle: accepts');
assert(adapter.canHandle(MINIMAL_VALID) === true,  'minimal valid JSON → true');
assert(adapter.canHandle(FIXTURE) === true,        'full fixture → true');
assert(adapter.canHandle(PHOTO_MSG) === true,      'photo-only message (no content) → true');
assert(adapter.canHandle(SHARE_MSG) === true,      'share-type message → true');
assert(adapter.canHandle(MULTI_MSG) === true,      'multi-participant multi-message thread → true');
assert(adapter.canHandle('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":0,"content":"","type":"Generic"}]}') === true, 'timestamp_ms: 0 (epoch zero) → true');

// ── Suite 3 — canHandle: rejects ─────────────────────────────────────────────

suite('Suite 3 — canHandle: rejects');
assert(adapter.canHandle('') === false,          'empty string → false');
assert(adapter.canHandle(42) === false,          'number → false');
assert(adapter.canHandle('not json') === false,  'malformed JSON → false');
assert(adapter.canHandle('{}') === false,        'empty object → false');
assert(adapter.canHandle(EMPTY_MESSAGES_JSON) === false, 'messages array with no timestamp_ms → false');
assert(adapter.canHandle('[]') === false,        'JSON array → false');
assert(adapter.canHandle('[6/1/24, 9:00:00 AM] Alice: Hi') === false, 'WhatsApp bracket TXT → false');
assert(adapter.canHandle('<smses count="1"><sms date="1705305600000" type="1" address="+1555" body="Hi" /></smses>') === false, 'Android SMS XML → false');
assert(adapter.canHandle('2024-06-01 09:00:00 | Me | Hello') === false, 'pipe-delimited TXT → false');

// ── Suite 4 — Fixture import rawCounts ───────────────────────────────────────

suite('Suite 4 — Fixture import rawCounts');
assert(fixtureResult.memories.length === 8,          'memories.length = 8 (8 imported from 10 messages)');
assert(fixtureResult.rawCounts.total === 10,         'rawCounts.total = 10');
assert(fixtureResult.rawCounts.imported === 8,       'rawCounts.imported = 8');
assert(fixtureResult.rawCounts.skipped === 2,        'rawCounts.skipped = 2');
assert(fixtureResult.importWarnings.length === 2,    'importWarnings.length = 2');
assert(fixtureResult.participants.length === 2,      'participants.length = 2');

// ── Suite 5 — Timestamp conversion ───────────────────────────────────────────

suite('Suite 5 — Timestamp conversion');
assert(fixtureResult.memories[0].timestamp === new Date(1609459200000).toISOString(), 'timestamp_ms 1609459200000 → 2021-01-01T00:00:00.000Z');
assert(fixtureResult.memories[1].timestamp === new Date(1609459260000).toISOString(), 'timestamp_ms 1609459260000 → 2021-01-01T00:01:00.000Z');
assert(fixtureResult.memories.every(function (m) { return typeof m.timestamp === 'string'; }), 'all imported memories have string timestamps');
const epochResult = adapter['import']('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":0,"content":"Hi","type":"Generic"}]}');
assert(typeof epochResult.memories[0].timestamp === 'string', 'timestamp_ms: 0 (epoch zero) produces a valid string timestamp');

// ── Suite 6 — HTML entity decoding: sender_name ───────────────────────────────

suite('Suite 6 — HTML entity decoding: sender_name');
const rAmp  = adapter['import'](ENTITY_SENDER_AMP).memories[0];
const rApos = adapter['import'](ENTITY_SENDER_APOS).memories[0];
const rLt   = adapter['import'](ENTITY_SENDER_LT).memories[0];
assert(rAmp.sender  === 'Alice & Bob', '&amp; in sender_name decoded to &');
assert(rApos.sender === "Ali's",       '&#39; in sender_name decoded to single-quote');
assert(rLt.sender   === '<Alice>',     '&lt; and &gt; in sender_name decoded to < and >');
assert(typeof rAmp.sender === 'string' && rAmp.sender.indexOf('&amp;') === -1, 'no raw entity remains in decoded sender');

// ── Suite 7 — HTML entity decoding: content ───────────────────────────────────

suite('Suite 7 — HTML entity decoding: content');
assert(fixtureResult.memories[1].text === 'Really good! Work & life keeping me busy.', '&amp; in content decoded to &');
assert(fixtureResult.memories[3].text === "That's a great photo!",                      '&#39; in content decoded to single-quote');
assert(fixtureResult.memories[6].text === '<So excited> to see you!',                  '&lt; and &gt; in content decoded to < and >');
const hexResult = adapter['import'](ENTITY_HEX).memories[0];
assert(hexResult.text === 'Hello',                                                       '&#x48; hex entity decoded to H');
assert(hexResult.text.indexOf('&#x') === -1,                                             'no raw hex entity remains in decoded content');

// ── Suite 8 — senderRole always contact ──────────────────────────────────────

suite('Suite 8 — senderRole always contact');
assert(fixtureResult.memories[0].senderRole === 'contact', 'text message has senderRole contact');
assert(fixtureResult.memories[2].senderRole === 'contact', 'photo attachment message has senderRole contact');
assert(fixtureResult.memories[5].senderRole === 'contact', 'share message has senderRole contact');
assert(fixtureResult.memories.every(function (m) { return m.senderRole === 'contact'; }), 'all imported memories have senderRole contact');

// ── Suite 9 — Text message normalization ──────────────────────────────────────

suite('Suite 9 — Text message normalization');
const textMem = fixtureResult.memories[0];
assert(textMem.type === 'message',                        'text message has type message');
assert(textMem.isAttachmentOnly === false,                 'text message has isAttachmentOnly false');
assert(textMem.text === 'Hey, how have you been?',        'text message text is set correctly');
assert(textMem.sourcePlatformId === 'instagram-dm',       'text message sourcePlatformId is instagram-dm');
assert(textMem.sourceAdapterId  === 'instagram-dm-json-v1', 'text message sourceAdapterId is instagram-dm-json-v1');

// ── Suite 10 — Media / attachment normalization ───────────────────────────────

suite('Suite 10 — Media/attachment normalization');
const photoMem = fixtureResult.memories[2];
const videoMem = fixtureResult.memories[4];
const shareMem = fixtureResult.memories[5];
assert(photoMem.type === 'attachment-placeholder', 'photo message → type attachment-placeholder');
assert(photoMem.isAttachmentOnly === true,         'photo message → isAttachmentOnly true');
assert(photoMem.text === '[Attachment]',           'photo message → text [Attachment]');
assert(videoMem.type === 'attachment-placeholder', 'video message → type attachment-placeholder');
assert(videoMem.isAttachmentOnly === true,         'video message → isAttachmentOnly true');
assert(shareMem.type === 'attachment-placeholder', 'share message → type attachment-placeholder');
assert(shareMem.isAttachmentOnly === true,         'share message → isAttachmentOnly true');
assert(shareMem.text === '[Attachment]',           'share message → text [Attachment]');

// ── Suite 11 — NormalizedMemory required fields ───────────────────────────────

suite('Suite 11 — NormalizedMemory required fields');
const mem0 = fixtureResult.memories[0];
assert(typeof mem0.id === 'string' && mem0.id.startsWith('mem-'), 'id starts with mem-');
assert(mem0.sourcePlatformId === 'instagram-dm',                   'sourcePlatformId = instagram-dm');
assert(mem0.sourceAdapterId  === 'instagram-dm-json-v1',           'sourceAdapterId = instagram-dm-json-v1');
assert(Array.isArray(mem0.reactions),                              'reactions is an array');
assert(typeof mem0.sender === 'string' && mem0.sender.length > 0, 'sender is a non-empty string');
assert(typeof mem0.timestamp === 'string',                         'timestamp is a string');
assert(mem0.type === 'message' || mem0.type === 'attachment-placeholder', 'type is message or attachment-placeholder');

// ── Suite 12 — importWarnings behavior ───────────────────────────────────────

suite('Suite 12 — importWarnings behavior');
const warns = fixtureResult.importWarnings;
assert(warns.some(function (w) { return w.message.indexOf('is_unsent') !== -1; }),      'is_unsent message produces a warning');
assert(warns.some(function (w) { return w.message.indexOf('sender_name') !== -1; }),    'missing sender_name produces a warning');
assert(typeof warns[0].index === 'number',    'warning has numeric index');
assert(typeof warns[0].message === 'string',  'warning has string message');

// ── Suite 13 — Empty / malformed input does not throw ────────────────────────

suite('Suite 13 — Empty/malformed input does not throw');
const emptyResult = adapter['import']('');
assert(emptyResult.memories.length === 0 && emptyResult.rawCounts.total === 0, 'empty string → 0 memories, no throw');
const whitespaceResult = adapter['import']('   ');
assert(whitespaceResult.memories.length === 0, 'whitespace-only string → 0 memories');
const badJsonResult = adapter['import']('not json at all');
assert(badJsonResult.memories.length === 0 && badJsonResult.importWarnings.length > 0, 'malformed JSON → 0 memories + parse error warning');
const numResult = adapter['import'](42);
assert(numResult.memories.length === 0, 'number input → 0 memories');
const noMsgResult = adapter['import'](NO_MESSAGES_JSON);
assert(noMsgResult.memories.length === 0 && noMsgResult.rawCounts.total === 0, 'JSON without messages array → 0 memories');

// ── Suite 14 — Semantic guards ────────────────────────────────────────────────

suite('Suite 14 — Semantic guards');
assert(mem0.proof === undefined,                       'no proof field on NormalizedMemory');
assert(mem0.checkout === undefined,                    'no checkout field on NormalizedMemory');
assert(mem0.manufacturing === undefined,               'no manufacturing field on NormalizedMemory');
assert(mem0.estimatedPages === undefined,              'no estimatedPages field on NormalizedMemory');
assert(mem0.estimatedVolumes === undefined,            'no estimatedVolumes field on NormalizedMemory');
assert(mem0.orderId === undefined,                     'no orderId field on NormalizedMemory');
assert(adapter.isManufacturingReady === undefined,     'no isManufacturingReady field on adapter');

// ── Suite 15 — Participants extraction ───────────────────────────────────────

suite('Suite 15 — Participants extraction');
const parts = fixtureResult.participants;
assert(Array.isArray(parts),                              'participants is an array');
assert(parts[0] === 'Alice Smith' && parts[1] === 'bob_jones_99', 'participants in first-seen order from imported memories');
assert(new Set(parts).size === parts.length,              'no duplicate participants');
assert(parts.length === 2,                                'participant count matches unique sender count');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
