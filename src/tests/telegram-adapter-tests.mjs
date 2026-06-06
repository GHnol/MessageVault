import { createRequire } from 'module';
import { readFileSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..', '..');

function loadFile(rel) {
    const code = readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, ctx);
}

const ctx = vm.createContext({ window: {}, console });
loadFile('src/core/source-platforms.js');
loadFile('src/core/normalized-memory.js');
loadFile('src/core/import-adapters.js');
loadFile('src/adapters/telegram-adapter.js');

const KMEngine  = ctx.window.KMEngine;
const FIXTURE   = readFileSync(path.join(ROOT, 'scripts/fixtures/fake-telegram-export.json'), 'utf8');

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) {
    currentSuite = name;
}

function assert(cond, label) {
    if (cond) {
        passed++;
    } else {
        failed++;
        console.error(`  FAIL [${currentSuite}] ${label}`);
    }
}

// ── Constants used across suites ─────────────────────────────────────────────

const MINIMAL_TG = '{"messages":[{"id":1,"type":"message","date":"2021-01-01T00:00:00","date_unixtime":"1609459200","from":"Alice","from_id":"user111","text":"Hi"}]}';
const MINIMAL_IG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}';
const MINIMAL_FB = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":[]}';

const fixtureResult = KMEngine.telegramAdapter['import'](FIXTURE);
const fixtureMems   = fixtureResult.memories;

// ── Suite 1 — API shape ───────────────────────────────────────────────────────

suite('telegramAdapter — API shape');
assert(typeof KMEngine.telegramAdapter === 'object' && KMEngine.telegramAdapter !== null,
    'KMEngine.telegramAdapter is a non-null object');
assert(typeof KMEngine.telegramAdapter.canHandle === 'function',
    'canHandle is a function');
assert(typeof KMEngine.telegramAdapter.normalizeAll === 'function',
    'normalizeAll is a function');
assert(typeof KMEngine.telegramAdapter['import'] === 'function',
    'import is a function');
assert(KMEngine.telegramAdapter.id === 'telegram-json-v1',
    'id === telegram-json-v1');
assert(KMEngine.telegramAdapter.sourcePlatformId === 'telegram',
    'sourcePlatformId === telegram');
assert(KMEngine.telegramAdapter.label === 'Telegram Desktop JSON Export v1',
    'label is Telegram Desktop JSON Export v1');
assert(KMEngine.adapters['telegram-json-v1'] === KMEngine.telegramAdapter,
    'registered in KMEngine.adapters under telegram-json-v1');
assert(Array.isArray(KMEngine.telegramAdapter._lastWarnings),
    '_lastWarnings is an array');

// ── Suite 2 — canHandle: accepts ─────────────────────────────────────────────

suite('telegramAdapter — canHandle: accepts');
assert(KMEngine.telegramAdapter.canHandle(MINIMAL_TG) === true,
    'accepts minimal valid Telegram JSON');
assert(KMEngine.telegramAdapter.canHandle(FIXTURE) === true,
    'accepts fixture export');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"id":1,"type":"message","date_unixtime":"1609459200","from_id":"user111","text":"Hi"}]}') === true,
    'accepts message without from field (canHandle only requires from_id)');
assert(KMEngine.telegramAdapter.canHandle(
    '{"name":"Chat","type":"personal_chat","messages":[{"id":1,"type":"message","date_unixtime":"1609459200","from":"Alice","from_id":"user111","text":"ok","extra_key":true}]}') === true,
    'accepts JSON with additional top-level and message-level keys');

// ── Suite 3 — canHandle: rejects Instagram DM ────────────────────────────────

suite('telegramAdapter — canHandle: rejects Instagram DM');
assert(KMEngine.telegramAdapter.canHandle(MINIMAL_IG) === false,
    'rejects MINIMAL_IG (has participants)');
assert(KMEngine.telegramAdapter.canHandle(
    '{"participants":[{"name":"Alice"}],"messages":[{"from_id":"user1","date_unixtime":"1609459200","sender_name":"Alice","timestamp_ms":1640000000000}]}') === false,
    'rejects JSON with participants even if from_id present');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"id":1,"type":"message","date_unixtime":"1609459200","from":"Alice","text":"Hi"}]}') === false,
    'rejects JSON without any from_id string in messages');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"id":1,"type":"message","timestamp_ms":1640000000000,"sender_name":"Alice","text":"Hi"}]}') === false,
    'rejects JSON with timestamp_ms instead of date_unixtime');

// ── Suite 4 — canHandle: rejects Facebook Messenger ──────────────────────────

suite('telegramAdapter — canHandle: rejects Facebook Messenger');
assert(KMEngine.telegramAdapter.canHandle(MINIMAL_FB) === false,
    'rejects MINIMAL_FB (has magic_words and participants)');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"from_id":"user1","date_unixtime":"1609459200","from":"Alice"}],"magic_words":[]}') === false,
    'rejects JSON with magic_words only (no participants)');
assert(KMEngine.telegramAdapter.canHandle(
    '{"participants":[],"magic_words":[],"messages":[{"from_id":"user1","date_unixtime":"1609459200","from":"Alice"}]}') === false,
    'rejects JSON with both participants and magic_words');

// ── Suite 5 — canHandle: rejects non-Telegram inputs ─────────────────────────

suite('telegramAdapter — canHandle: rejects non-Telegram inputs');
assert(KMEngine.telegramAdapter.canHandle('') === false,
    'rejects empty string');
assert(KMEngine.telegramAdapter.canHandle(null) === false,
    'rejects null');
assert(KMEngine.telegramAdapter.canHandle('Hello, how are you today?') === false,
    'rejects plain text');
assert(KMEngine.telegramAdapter.canHandle('<sms><message body="Hi"/></sms>') === false,
    'rejects XML');
assert(KMEngine.telegramAdapter.canHandle('[10/05/21, 9:00:00 AM] Alice: Hey') === false,
    'rejects WhatsApp TXT format');
assert(KMEngine.telegramAdapter.canHandle('{bad json: true,}') === false,
    'rejects malformed JSON');

// ── Suite 6 — canHandle: from_id discriminator ───────────────────────────────

suite('telegramAdapter — canHandle: from_id discriminator');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"id":1,"type":"message","date_unixtime":"1609459200","from":"Alice","text":"Hi"}]}') === false,
    'returns false when no message has from_id');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"id":1,"type":"message","date_unixtime":"1609459200","from":"Alice","from_id":111,"text":"Hi"}]}') === false,
    'returns false when from_id is a number (not a string)');
assert(KMEngine.telegramAdapter.canHandle(
    '{"messages":[{"id":1,"type":"message","date_unixtime":"1609459200","from":"Alice","from_id":"user111","text":"Hi"}]}') === true,
    'returns true when from_id is a string');

// ── Suite 7 — Fixture: rawCounts ─────────────────────────────────────────────

suite('telegramAdapter — fixture: rawCounts');
assert(fixtureResult.rawCounts !== undefined && typeof fixtureResult.rawCounts === 'object',
    'rawCounts is an object');
assert(fixtureResult.rawCounts.total === 10,
    'rawCounts.total === 10 (all 10 messages in fixture)');
assert(fixtureResult.rawCounts.imported === 8,
    'rawCounts.imported === 8 (service + null-from skipped)');
assert(fixtureResult.rawCounts.skipped === 2,
    'rawCounts.skipped === 2 (service + null-from)');
assert(fixtureMems.length === 8,
    'memories array has 8 entries');
assert(fixtureResult.sourcePlatformId === 'telegram',
    'sourcePlatformId === telegram');
assert(fixtureResult.adapterVersion === '1',
    'adapterVersion === 1');

// ── Suite 8 — Timestamp parsing ───────────────────────────────────────────────

suite('telegramAdapter — timestamp parsing');
assert(typeof fixtureMems[0].timestamp === 'string',
    'timestamp is a string for a valid date_unixtime');
assert(fixtureMems[0].timestamp === '2021-06-01T09:00:00.000Z',
    'timestamp converts seconds to correct ISO string (1622538000 → 2021-06-01T09:00:00.000Z)');

const noTs = KMEngine.telegramAdapter.normalizeAll([
    { id: 2, type: 'message', from: 'Alice', from_id: 'user1', text: 'hi' }
]);
assert(noTs.length === 1 && noTs[0].timestamp === null,
    'timestamp is null when date_unixtime is absent');

const nanTs = KMEngine.telegramAdapter.normalizeAll([
    { id: 3, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: 'not-a-number', text: 'hi' }
]);
assert(nanTs.length === 1 && nanTs[0].timestamp === null,
    'timestamp is null when date_unixtime parses to NaN');

const numTs = KMEngine.telegramAdapter.normalizeAll([
    { id: 4, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: 1622538000, text: 'hi' }
]);
assert(numTs.length === 1 && numTs[0].timestamp === null,
    'timestamp is null when date_unixtime is a number (not a string)');

// ── Suite 9 — Sender extraction ───────────────────────────────────────────────

suite('telegramAdapter — sender extraction');
assert(fixtureMems[0].sender === 'Alice Smith',
    'sender extracted correctly from from field (Alice Smith)');
assert(fixtureMems[1].sender === 'bob_jones_99',
    'sender extracted correctly from from field (bob_jones_99)');

const trimmed = KMEngine.telegramAdapter.normalizeAll([
    { id: 5, type: 'message', from: '  Alice Smith  ', from_id: 'user1', date_unixtime: '1622538000', text: 'hi' }
]);
assert(trimmed.length === 1 && trimmed[0].sender === 'Alice Smith',
    'sender is trimmed of surrounding whitespace');

const whitespaceOnly = KMEngine.telegramAdapter.normalizeAll([
    { id: 6, type: 'message', from: '   ', from_id: 'user1', date_unixtime: '1622538000', text: 'hi' }
]);
assert(whitespaceOnly.length === 0,
    'whitespace-only from field causes message to be skipped (warning emitted)');

assert(fixtureMems.every(m => typeof m.sender === 'string' && m.sender.length > 0),
    'all 8 fixture memories have a non-empty string sender');

// ── Suite 10 — Text: plain string ────────────────────────────────────────────

suite('telegramAdapter — text: plain string');
assert(fixtureMems[0].text === 'Hey, how are you?',
    'plain text string is preserved as-is');

const ampersand = KMEngine.telegramAdapter.normalizeAll([
    { id: 7, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000', text: 'Alice &amp; Bob' }
]);
assert(ampersand.length === 1 && ampersand[0].text === 'Alice &amp; Bob',
    'HTML entities are NOT decoded (no entity decoding unlike Instagram/Facebook)');

assert(fixtureMems[0].type === 'message',
    'type === message for plain text message');
assert(fixtureMems[0].isAttachmentOnly === false,
    'isAttachmentOnly === false for plain text message');

// ── Suite 11 — Text: array entities ──────────────────────────────────────────

suite('telegramAdapter — text: array entities');
assert(fixtureMems[5].text === null,
    'text=[] (empty array) produces null text');

const bareStrings = KMEngine.telegramAdapter.normalizeAll([
    { id: 8, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000', text: ['Hello ', 'world'] }
]);
assert(bareStrings.length === 1 && bareStrings[0].text === 'Hello world',
    'bare string items in text array are concatenated');

const objItems = KMEngine.telegramAdapter.normalizeAll([
    { id: 9, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000',
      text: [{ type: 'bold', text: 'Bold' }, { type: 'italic', text: ' text' }] }
]);
assert(objItems.length === 1 && objItems[0].text === 'Bold text',
    '{type, text} objects: text property is extracted and concatenated');

const mixedItems = KMEngine.telegramAdapter.normalizeAll([
    { id: 10, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000',
      text: ['Start ', { type: 'bold', text: 'middle' }, ' end'] }
]);
assert(mixedItems.length === 1 && mixedItems[0].text === 'Start middle end',
    'mixed bare strings and {type,text} objects are concatenated in order');

assert(fixtureMems[2].text === 'Check out this link when you can!',
    'fixture message 1003 entity array concatenates to correct plain text');

const noTextItems = KMEngine.telegramAdapter.normalizeAll([
    { id: 11, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000',
      text: [{ type: 'bold' }] }
]);
assert(noTextItems.length === 1 && noTextItems[0].text === null,
    'array with only items that have no .text property produces null');

// ── Suite 12 — Media / attachment detection ───────────────────────────────────

suite('telegramAdapter — media / attachment detection');
const photoMem = KMEngine.telegramAdapter.normalizeAll([
    { id: 12, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000',
      photo: 'photos/img.jpg', text: '' }
]);
assert(photoMem.length === 1 && photoMem[0].isAttachmentOnly === true,
    'photo string triggers isAttachmentOnly=true');

const fileMem = KMEngine.telegramAdapter.normalizeAll([
    { id: 13, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000',
      file: 'files/doc.pdf', text: '' }
]);
assert(fileMem.length === 1 && fileMem[0].isAttachmentOnly === true,
    'file string triggers isAttachmentOnly=true');

const mediaMem = KMEngine.telegramAdapter.normalizeAll([
    { id: 14, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000',
      media_type: 'voice_message', text: '' }
]);
assert(mediaMem.length === 1 && mediaMem[0].isAttachmentOnly === true,
    'non-null media_type triggers isAttachmentOnly=true');

const noMedia = KMEngine.telegramAdapter.normalizeAll([
    { id: 15, type: 'message', from: 'Alice', from_id: 'user1', date_unixtime: '1622538000', text: 'plain' }
]);
assert(noMedia.length === 1 && noMedia[0].isAttachmentOnly === false,
    'no photo/file/media_type leaves isAttachmentOnly=false');

assert(fixtureMems[3].text === '[Attachment]',
    'attachment placeholder text is [Attachment]');
assert(fixtureMems[3].type === 'attachment-placeholder',
    'attachment type is attachment-placeholder');
assert(fixtureMems[3].isAttachmentOnly === true && fixtureMems[4].isAttachmentOnly === true,
    'fixture messages 1004 and 1005 both have isAttachmentOnly=true');

// ── Suite 13 — senderRole ─────────────────────────────────────────────────────

suite('telegramAdapter — senderRole always contact');
assert(fixtureMems[0].senderRole === 'contact',
    'senderRole is contact for Alice Smith');
assert(fixtureMems[7].senderRole === 'contact',
    'senderRole is contact for bob_jones_99 (last message)');
assert(fixtureMems.every(m => m.senderRole === 'contact'),
    'all 8 fixture memories have senderRole=contact');

// ── Suite 14 — NormalizedMemory fields ───────────────────────────────────────

suite('telegramAdapter — NormalizedMemory fields');
assert(typeof fixtureMems[0].id === 'string' && fixtureMems[0].id.length > 0,
    'id is a non-empty string');
assert(fixtureMems[0].sourcePlatformId === 'telegram',
    'sourcePlatformId === telegram');
assert(fixtureMems[0].sourceAdapterId === 'telegram-json-v1',
    'sourceAdapterId === telegram-json-v1');
assert(fixtureMems[0].sourceNativeId === null,
    'sourceNativeId is null (Telegram has no native message ID surface on NormalizedMemory)');
assert(fixtureMems[0].timestamp === '2021-06-01T09:00:00.000Z',
    'timestamp correctly derived from date_unixtime');
assert(fixtureMems[0].sender === 'Alice Smith',
    'sender === Alice Smith');
assert(fixtureMems[0].senderRole === 'contact',
    'senderRole === contact');
assert(Array.isArray(fixtureMems[0].reactions) && fixtureMems[0].reactions.length === 0,
    'reactions is an empty array');
assert(fixtureMems[0].provenance.adapterVersion === '1',
    'provenance.adapterVersion === 1');

// ── Suite 15 — importWarnings ─────────────────────────────────────────────────

suite('telegramAdapter — importWarnings');
assert(Array.isArray(fixtureResult.importWarnings),
    'importWarnings is an array');
assert(fixtureResult.importWarnings.length === 2,
    'importWarnings has 2 entries (service message + null-from message)');
assert(fixtureResult.importWarnings[0].index === 5,
    'first warning index === 5 (service message at messages[5])');
assert(typeof fixtureResult.importWarnings[0].message === 'string' &&
    fixtureResult.importWarnings[0].message.toLowerCase().includes('service'),
    'first warning message mentions service');
assert(fixtureResult.importWarnings[1].index === 6,
    'second warning index === 6 (null-from message at messages[6])');
assert(typeof fixtureResult.importWarnings[1].message === 'string' &&
    fixtureResult.importWarnings[1].message.toLowerCase().includes('from'),
    'second warning message mentions from');

// ── Suite 16 — No-throw robustness ───────────────────────────────────────────

suite('telegramAdapter — no-throw robustness');
let threw = false;
try { KMEngine.telegramAdapter['import'](''); } catch (e) { threw = true; }
assert(!threw, 'import(\'\') does not throw');

threw = false;
try { KMEngine.telegramAdapter['import'](null); } catch (e) { threw = true; }
assert(!threw, 'import(null) does not throw');

threw = false;
try { KMEngine.telegramAdapter['import']('{invalid json'); } catch (e) { threw = true; }
assert(!threw, 'import with invalid JSON does not throw');

const emptyResult = KMEngine.telegramAdapter['import']('{"messages":[]}');
assert(emptyResult.rawCounts.total === 0 && emptyResult.rawCounts.imported === 0,
    'import with empty messages array returns zero counts');

threw = false;
try { KMEngine.telegramAdapter.normalizeAll(null); } catch (e) { threw = true; }
assert(!threw, 'normalizeAll(null) does not throw');

// ── Suite 17 — Participants ───────────────────────────────────────────────────

suite('telegramAdapter — participants');
assert(Array.isArray(fixtureResult.participants),
    'participants is an array');
assert(fixtureResult.participants.length === 2,
    'participants has 2 unique senders');
assert(fixtureResult.participants.includes('Alice Smith'),
    'participants includes Alice Smith');
assert(fixtureResult.participants.includes('bob_jones_99'),
    'participants includes bob_jones_99');
assert(new Set(fixtureResult.participants).size === fixtureResult.participants.length,
    'participants has no duplicates');

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\ntelegram-adapter-tests: ${passed}/${total} passed`);
if (failed > 0) process.exit(1);
