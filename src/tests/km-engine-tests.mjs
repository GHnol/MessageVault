/**
 * KM Engine foundation tests.
 * Run with: node src/tests/km-engine-tests.mjs
 *
 * Uses Node's built-in vm module to run the browser IIFE scripts in a
 * simulated window context. No external test framework required.
 */

import { readFileSync }     from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath }    from 'node:url';
import { dirname, join }    from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

const ctx = createContext({ window: {}, console });

function load(rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    try {
        runInContext(code, ctx);
    } catch (e) {
        console.error('Failed to load ' + rel + ':', e.message);
        process.exit(1);
    }
}

// Load in dependency order
load('src/core/source-platforms.js');
load('src/core/normalized-memory.js');
load('src/core/import-adapters.js');
load('src/adapters/txt-export-adapter.js');
load('src/adapters/imessage-chatdb-adapter.js');
load('src/adapters/manual-entry-adapter.js');
load('src/adapters/whatsapp-txt-adapter.js');
load('src/adapters/android-sms-xml-adapter.js');
load('src/adapters/instagram-dm-adapter.js');
load('src/adapters/facebook-messenger-adapter.js');
load('src/adapters/telegram-adapter.js');
load('src/adapters/future-adapter-stubs.js');
load('src/core/project-session.js');
load('src/state/session-serialization.js');
load('src/core/content-quality-checks.js');
load('src/core/conversation-stats.js');
load('src/core/emoji-analysis.js');
load('src/core/word-analysis.js');
load('src/core/timing-analysis.js');
load('src/core/response-time-analysis.js');
load('src/core/message-length-analysis.js');
load('src/core/conversation-initiation.js');
load('src/core/reaction-analysis.js');
load('src/core/canonical-conversation.js');
load('src/core/import-adapter-contract.js');

const { KMEngine } = ctx.window;

let passed = 0, failed = 0;

function suite(name) {
    console.log('\n' + name);
}

function assert(condition, label) {
    if (condition) {
        console.log('  PASS  ' + label);
        passed++;
    } else {
        console.error('  FAIL  ' + label);
        failed++;
    }
}

// ── SOURCE PLATFORMS ─────────────────────────────────────────────────────────

suite('SourcePlatform registry');
assert(Array.isArray(KMEngine.SOURCE_PLATFORMS),                     'SOURCE_PLATFORMS is an array');
assert(KMEngine.SOURCE_PLATFORMS.length >= 11,                       'at least 11 platforms defined');
assert(KMEngine.getSourcePlatform('imessage').status  === 'supported',   'imessage is supported');
assert(KMEngine.getSourcePlatform('txt-export').status === 'supported',  'txt-export is supported');
assert(KMEngine.getSourcePlatform('manual').status    === 'supported',   'manual is supported');
assert(KMEngine.getSourcePlatform('whatsapp').status  === 'supported',   'whatsapp is supported');
assert(KMEngine.getSourcePlatform('android-sms').status === 'supported', 'android-sms is supported');
assert(KMEngine.getSourcePlatform('instagram-dm').status === 'supported',        'instagram-dm is supported');
assert(KMEngine.getSourcePlatform('facebook-messenger').status === 'supported', 'facebook-messenger is supported');
assert(KMEngine.getSourcePlatform('telegram').status  === 'supported',          'telegram is supported');
assert(KMEngine.getSourcePlatform('screenshot-image').status === 'deferred', 'screenshot-image is deferred');
assert(KMEngine.getSourcePlatform('audio-transcript').status === 'deferred', 'audio-transcript is deferred');
assert(KMEngine.getSourcePlatform('video-transcript').status === 'deferred', 'video-transcript is deferred');
assert(KMEngine.getSourcePlatform('nonexistent') === null,           'unknown platform returns null');

// ── NORMALIZED MEMORY — create ───────────────────────────────────────────────

suite('NormalizedMemory.create');
const m1 = KMEngine.NormalizedMemory.create({
    sourcePlatformId: 'txt-export',
    sourceAdapterId:  'txt-export-v1',
    timestamp:        '2024-06-01 09:00:00',
    sender:           'Alex',
    text:             'Hello there',
    reactions:        []
});
assert(typeof m1.id === 'string' && m1.id.startsWith('mem-'), 'id starts with mem-');
assert(m1.senderRole === 'contact',    'senderRole is contact for non-Me sender');
assert(m1.type === 'message',          'type defaults to message');
assert(Array.isArray(m1.reactions),    'reactions field is array');
assert(m1.sourcePlatformId === 'txt-export', 'sourcePlatformId set');

// ── NORMALIZED MEMORY — fromLegacy ───────────────────────────────────────────

suite('NormalizedMemory.fromLegacy');
const legacyMsg  = { timestamp: '2024-06-01 10:00:00', sender: 'Me', text: 'Hi!', reactions: [], isAttachmentOnly: false };
const nm         = KMEngine.NormalizedMemory.fromLegacy(legacyMsg, 'txt-export', 'txt-export-v1', 0);
assert(nm.id.startsWith('mem-'),          'fromLegacy produces stable id');
assert(nm.senderRole === 'self',          'senderRole is self for Me sender');
assert(nm.sender    === 'Me',             'sender preserved');
assert(nm.text      === 'Hi!',            'text preserved');
assert(nm.type      === 'message',        'type is message for non-attachment');
assert(nm.timestamp === '2024-06-01 10:00:00', 'timestamp preserved');

const legacyAttach = { timestamp: '2024-06-01 10:01:00', sender: 'Alex', text: '[Attachment]', reactions: [], isAttachmentOnly: true };
const nmAttach = KMEngine.NormalizedMemory.fromLegacy(legacyAttach, 'txt-export', 'txt-export-v1', 1);
assert(nmAttach.type === 'attachment-placeholder', 'isAttachmentOnly maps to attachment-placeholder type');

const legacyDb = { timestamp: '2024-06-01 11:00:00', sender: 'Alex', text: 'Hey', reactions: [], isAttachmentOnly: false, rowid: 9001 };
const nmDb = KMEngine.NormalizedMemory.fromLegacy(legacyDb, 'imessage', 'imessage-chatdb-v1', 0);
assert(nmDb.sourceNativeId === '9001', 'rowid preserved as sourceNativeId');

// ── NORMALIZED MEMORY — stable IDs ───────────────────────────────────────────

suite('NormalizedMemory — stable ID generation');
const idA = KMEngine.NormalizedMemory.generate_id('txt-export', 'txt-export-v1', 0, '2024-06-01', 'Me', 'Hello');
const idB = KMEngine.NormalizedMemory.generate_id('txt-export', 'txt-export-v1', 0, '2024-06-01', 'Me', 'Hello');
const idC = KMEngine.NormalizedMemory.generate_id('txt-export', 'txt-export-v1', 1, '2024-06-01', 'Me', 'Hello');
assert(idA === idB, 'same inputs produce same ID (stable)');
assert(idA !== idC, 'different import index produces different ID');

// ── TXT EXPORT ADAPTER — normalizeAll ─────────────────────────────────────────

suite('txtExportAdapter.normalizeAll');
const rawMsgs = [
    { timestamp: '2024-06-01 09:00:00', sender: 'Me',   text: 'Hello',        reactions: [], isAttachmentOnly: false },
    { timestamp: '2024-06-01 09:01:00', sender: 'Alex', text: 'Hi back',      reactions: [{ reactor: 'Me', label: 'Liked', emoji: '👍' }], isAttachmentOnly: false },
    { timestamp: '2024-06-01 09:02:00', sender: 'Alex', text: '[Attachment]',  reactions: [], isAttachmentOnly: true  }
];
const normalized = KMEngine.txtExportAdapter.normalizeAll(rawMsgs);
assert(normalized.length === 3,                              'all three messages normalized');
assert(normalized[0].sourcePlatformId === 'txt-export',     'sourcePlatformId set on each message');
assert(normalized[0].sourceAdapterId  === 'txt-export-v1',  'sourceAdapterId set on each message');
assert(normalized[1].reactions[0].emoji === '👍',           'reactions survive normalization');
assert(normalized[0].timestamp === '2024-06-01 09:00:00',   'timestamp survives normalization');
assert(normalized[0].sender === 'Me',                       'sender survives normalization');
assert(normalized[2].type === 'attachment-placeholder',     'attachment-placeholder type assigned');

suite('txtExportAdapter.normalizeAll — malformed rows');
const malformedMsgs = [
    { timestamp: '2024-06-01 09:00:00', sender: 'Me',   text: 'Good row',    reactions: [], isAttachmentOnly: false },
    { timestamp: null,                  sender: null,    text: null,           reactions: [], isAttachmentOnly: false },
    { timestamp: '2024-06-01 09:02:00', sender: 'Alex', text: 'Also good',   reactions: [], isAttachmentOnly: false }
];
const malResult = KMEngine.txtExportAdapter.normalizeAll(malformedMsgs);
assert(malResult.length === 2,                               'malformed row skipped without crash');
assert(KMEngine.txtExportAdapter._lastWarnings.length === 1, 'one warning produced for malformed row');

// ── IMESSAGE CHATDB ADAPTER — normalizeAll ────────────────────────────────────

suite('chatDbAdapter.normalizeAll');
const dbMsgs = [
    { timestamp: '2024-06-01 09:00:00', sender: 'Me',   text: 'Test', reactions: [], isAttachmentOnly: false, rowid: 101 },
    { timestamp: '2024-06-01 09:01:00', sender: 'Alex', text: 'Back', reactions: [{ reactor: 'Me', label: 'Loved', emoji: '❤️' }], isAttachmentOnly: false, rowid: 102 }
];
const dbNorm = KMEngine.chatDbAdapter.normalizeAll(dbMsgs);
assert(dbNorm.length === 2,                            'both messages normalized');
assert(dbNorm[0].sourcePlatformId === 'imessage',      'sourcePlatformId is imessage');
assert(dbNorm[0].sourceNativeId   === '101',           'rowid preserved as sourceNativeId');
assert(dbNorm[1].reactions[0].emoji === '❤️',          'reactions survive chatdb normalization');
assert(dbNorm[1].timestamp === '2024-06-01 09:01:00',  'timestamp survives chatdb normalization');
assert(dbNorm[0].sender    === 'Me',                   'sender survives chatdb normalization');

suite('chatDbAdapter.normalizeAll — sourceNativeId from rowid');
const withRowid = [
    { timestamp: '2024-06-01 09:00:00', sender: 'Me', text: 'Hi', reactions: [], isAttachmentOnly: false, rowid: 555, guid: 'abc-guid-1' }
];
const normRowid = KMEngine.chatDbAdapter.normalizeAll(withRowid);
assert(normRowid[0].sourceNativeId === '555',      'rowid used as sourceNativeId when present');
assert(normRowid[0].raw.rowid === 555,             'raw.rowid preserved');
assert(normRowid[0].raw.guid === 'abc-guid-1',     'raw.guid preserved');
assert(typeof normRowid[0].provenance.importedAt === 'string', 'provenance.importedAt is populated');
assert(normRowid[0].provenance.adapterVersion === '1',         'provenance.adapterVersion is 1');

suite('chatDbAdapter.normalizeAll — guid fallback when rowid absent');
const withGuidOnly = [
    { timestamp: '2024-06-01 09:00:00', sender: 'Alex', text: 'Hey', reactions: [], isAttachmentOnly: false, rowid: null, guid: 'only-guid-xyz' }
];
const normGuid = KMEngine.chatDbAdapter.normalizeAll(withGuidOnly);
assert(normGuid[0].sourceNativeId === 'only-guid-xyz', 'guid used as sourceNativeId when rowid absent');
assert(normGuid[0].raw.rowid === null,                 'raw.rowid is null when absent');
assert(normGuid[0].raw.guid === 'only-guid-xyz',       'raw.guid preserved in fallback case');

suite('chatDbAdapter.normalizeAll — warns when no native identifier');
const withNoId = [
    { timestamp: '2024-06-01 09:00:00', sender: 'Alex', text: 'Hey', reactions: [], isAttachmentOnly: false, rowid: null, guid: null }
];
const normNoId = KMEngine.chatDbAdapter.normalizeAll(withNoId);
assert(normNoId[0].sourceNativeId === null,             'sourceNativeId is null when both absent');
assert(KMEngine.chatDbAdapter._lastWarnings.some(function(w) {
    return w.message.indexOf('Native identifier unavailable') !== -1;
}), 'warning produced when rowid and guid both absent');

suite('chatDbAdapter.import — missing context.extractMessagesForChat returns unsupported result');
const importNoFn = KMEngine.chatDbAdapter.import({}, {});
assert(importNoFn.memories.length === 0,               'no memories when extractFn missing');
assert(importNoFn.unsupportedItems.length > 0,         'unsupportedItems entry explains the gap');
assert(importNoFn.sourcePlatformId === 'imessage',     'sourcePlatformId still correct');

suite('chatDbAdapter.import — with context.extractMessagesForChat returns valid ImportResult');
const fakeExtract = function (db, chatId) {
    return [
        { timestamp: '2024-06-01 09:00:00', sender: 'Me',   text: 'Via extract fn', reactions: [], isAttachmentOnly: false, rowid: 201 },
        { timestamp: '2024-06-01 09:01:00', sender: 'Alex', text: 'Reply',           reactions: [], isAttachmentOnly: false, rowid: 202 }
    ];
};
const importWithFn = KMEngine.chatDbAdapter.import({}, { chatId: 99, extractMessagesForChat: fakeExtract });
assert(importWithFn.memories.length === 2,             'two memories returned when extractFn supplied');
assert(importWithFn.participants.includes('Me'),        'participants includes Me');
assert(importWithFn.participants.includes('Alex'),      'participants includes Alex');
assert(importWithFn.rawCounts.imported === 2,          'rawCounts.imported is 2');
assert(importWithFn.memories[0].sourcePlatformId === 'imessage', 'memories have correct sourcePlatformId');
assert(importWithFn.memories[0].sourceNativeId === '201',        'rowid propagated through import path');

suite('chatDbAdapter — import does not reference KMEngine.extractMessagesForChat');
assert(typeof KMEngine.extractMessagesForChat === 'undefined', 'extractMessagesForChat is not on KMEngine');
const importNoGlobal = KMEngine.chatDbAdapter.import({}, {});
assert(importNoGlobal.memories.length === 0, 'import without context.extractFn does not crash or reference missing global');

// ── MANUAL ENTRY ADAPTER ──────────────────────────────────────────────────────

suite('manualEntryAdapter.createMemory — valid entry');
const manualResult = KMEngine.manualEntryAdapter.createMemory({
    sender:    'Me',
    timestamp: '2024-06-01T10:00:00.000Z',
    text:      'A handwritten note'
});
assert(manualResult.success === true,                   'valid manual entry succeeds');
assert(manualResult.memory.type === 'manual-note',      'type is manual-note');
assert(manualResult.memory.provenance.manualEntry === true, 'manual provenance recorded');
assert(manualResult.memory.text === 'A handwritten note',   'text preserved');
assert(manualResult.memory.sender === 'Me',             'sender preserved');

suite('manualEntryAdapter.createMemory — blank text rejected');
const blankResult = KMEngine.manualEntryAdapter.createMemory({ sender: 'Me', text: '   ' });
assert(blankResult.success === false,                   'blank text rejected');
assert(blankResult.errors.length > 0,                   'errors reported for blank text');

suite('manualEntryAdapter.createMemory — missing sender rejected');
const noSenderResult = KMEngine.manualEntryAdapter.createMemory({ text: 'Hello' });
assert(noSenderResult.success === false,                'missing sender rejected');
assert(noSenderResult.errors.length > 0,               'errors reported for missing sender');

suite('manualEntryAdapter.import — batch with one invalid');
const batchResult = KMEngine.manualEntryAdapter.import([
    { sender: 'Me',   text: 'Valid entry', timestamp: '2024-06-01T09:00:00Z' },
    { sender: '',     text: '' },
    { sender: 'Alex', text: 'Also valid' }
]);
assert(batchResult.memories.length === 2,               'two valid entries imported');
assert(batchResult.importWarnings.length === 1,         'one warning for the invalid entry');
assert(batchResult.rawCounts.skipped === 1,             'rawCounts.skipped is 1');

// ── WHATSAPP TXT ADAPTER — smoke ──────────────────────────────────────────────

suite('whatsappTxtAdapter — smoke');
assert(KMEngine.whatsappTxtAdapter !== undefined,             'whatsappTxtAdapter exists on KMEngine');
assert(KMEngine.adapters['whatsapp-txt-v1'] === KMEngine.whatsappTxtAdapter, 'whatsapp-txt-v1 registered in KMEngine.adapters');
assert(KMEngine.whatsappTxtAdapter.canHandle('[6/1/24, 9:00:00 AM] Alice: Hi') === true, 'canHandle returns true for bracket format');
const waResult = KMEngine.whatsappTxtAdapter['import']('[6/1/24, 9:00:00 AM] Alice: Hi\n[6/1/24, 9:01:00 AM] Bob: Hey\n');
assert(waResult.sourcePlatformId === 'whatsapp',             'import() returns ImportResult with sourcePlatformId whatsapp');
assert(Array.isArray(waResult.memories) && waResult.memories.length === 2, 'import() returns memories array with correct count');

// ── ANDROID SMS XML ADAPTER — smoke ──────────────────────────────────────────

suite('androidSmsAdapter — smoke');
assert(KMEngine.androidSmsAdapter !== undefined,                     'androidSmsAdapter exists on KMEngine');
assert(KMEngine.adapters['android-sms-xml-v1'] === KMEngine.androidSmsAdapter, 'android-sms-xml-v1 registered in KMEngine.adapters');
assert(KMEngine.androidSmsAdapter.canHandle('<smses count="1"><sms date="1705305600000" type="1" address="+1555" body="Hi" readable_date="Jan 15, 2024" contact_name="Alice" /></smses>') === true, 'canHandle returns true for SMS Backup & Restore XML');
const smsResult = KMEngine.androidSmsAdapter['import']('<smses count="1"><sms date="1705305600000" type="1" address="+15559990001" body="Hello" readable_date="Jan 15, 2024 8:00:00 AM" contact_name="Alice" /></smses>');
assert(Array.isArray(smsResult.memories) && smsResult.memories.length === 1, 'import() returns memories array with correct count');
assert(smsResult.sourcePlatformId === 'android-sms',                'import() returns ImportResult with sourcePlatformId android-sms');

// ── INSTAGRAM DM ADAPTER — smoke ─────────────────────────────────────────────

suite('instagramDmAdapter — smoke');
assert(KMEngine.instagramDmAdapter !== undefined,                             'instagramDmAdapter exists on KMEngine');
assert(KMEngine.adapters['instagram-dm-json-v1'] === KMEngine.instagramDmAdapter, 'instagram-dm-json-v1 registered in KMEngine.adapters');
const MINIMAL_IG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}';
assert(KMEngine.instagramDmAdapter.canHandle(MINIMAL_IG) === true,            'canHandle returns true for minimal valid Instagram DM JSON');
const igResult = KMEngine.instagramDmAdapter['import'](MINIMAL_IG);
assert(igResult.sourcePlatformId === 'instagram-dm',                          'import() returns ImportResult with sourcePlatformId instagram-dm');
assert(Array.isArray(igResult.memories) && igResult.memories.length === 1,    'import() returns memories array with correct count');

// ── FACEBOOK MESSENGER ADAPTER — smoke ───────────────────────────────────────

suite('facebookMessengerAdapter — smoke');
assert(KMEngine.facebookMessengerAdapter !== undefined,                                  'facebookMessengerAdapter exists on KMEngine');
assert(KMEngine.adapters['facebook-messenger-json-v1'] === KMEngine.facebookMessengerAdapter, 'facebook-messenger-json-v1 registered in KMEngine.adapters');
const MINIMAL_FB = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":[]}';
assert(KMEngine.facebookMessengerAdapter.canHandle(MINIMAL_FB) === true,                 'canHandle returns true for minimal valid Facebook Messenger JSON');
const fbResult = KMEngine.facebookMessengerAdapter['import'](MINIMAL_FB);
assert(fbResult.sourcePlatformId === 'facebook-messenger',                               'import() returns ImportResult with sourcePlatformId facebook-messenger');
assert(Array.isArray(fbResult.memories) && fbResult.memories.length === 1,               'import() returns memories array with correct count');

// ── TELEGRAM ADAPTER — smoke ─────────────────────────────────────────────────

suite('telegramAdapter — smoke');
const MINIMAL_TG_KM = '{"messages":[{"id":1,"type":"message","date":"2021-01-01T00:00:00","date_unixtime":"1609459200","from":"Alice","from_id":"user111","text":"Hi"}]}';
assert(KMEngine.telegramAdapter !== undefined,                                   'telegramAdapter exists on KMEngine');
assert(KMEngine.adapters['telegram-json-v1'] === KMEngine.telegramAdapter,       'telegram-json-v1 registered in KMEngine.adapters');
assert(KMEngine.telegramAdapter.canHandle(MINIMAL_TG_KM) === true,              'canHandle returns true for minimal valid Telegram JSON');
const tgResult = KMEngine.telegramAdapter['import'](MINIMAL_TG_KM);
assert(tgResult.sourcePlatformId === 'telegram',                                 'import() returns ImportResult with sourcePlatformId telegram');
assert(Array.isArray(tgResult.memories) && tgResult.memories.length === 1,       'import() returns memories array with correct count');

// ── PROJECT SESSION schema ────────────────────────────────────────────────────

suite('ProjectSession.create and validate');
const session = KMEngine.ProjectSession.create({
    memories:          [normalized[0], normalized[1]],
    selectedMemoryIds: [normalized[0].id],
    keepsakeGroups:    [{ id: 'group-1', messageIds: [normalized[0].id], customName: 'First Contact' }],
    productDrafts:     []
});
assert(typeof session.id === 'string',                  'session has id');
assert(session.version   === '1',                       'session has version 1');
assert(session.memories.length  === 2,                  'memories included');
assert(session.selectedMemoryIds.length === 1,          'selectedMemoryIds included');
assert(session.keepsakeGroups[0].customName === 'First Contact', 'keepsakeGroups included');
assert(session.productDrafts !== undefined,             'productDrafts placeholder present');
assert(KMEngine.ProjectSession.validate(session),       'validate() passes for valid session');
assert(!KMEngine.ProjectSession.validate(null),         'validate() fails for null');
assert(!KMEngine.ProjectSession.validate({ memories: 'wrong-type' }), 'validate() fails if memories is not array');

// ── SESSION SERIALIZATION round-trip ─────────────────────────────────────────

suite('SessionSerialization.serialize / restore round-trip');
const json = KMEngine.SessionSerialization.serialize(session);
assert(typeof json === 'string',                                     'serialize returns a string');
assert(json.indexOf(session.id) !== -1,                              'session id appears in JSON');
const restored = KMEngine.SessionSerialization.restore(json);
assert(restored.success === true,                                    'restore succeeds');
assert(restored.session.id === session.id,                           'id survives round-trip');
assert(restored.session.memories.length === 2,                       'memories survive round-trip');
assert(restored.session.selectedMemoryIds[0] === normalized[0].id,  'selectedMemoryIds survive round-trip');
assert(restored.session.keepsakeGroups[0].customName === 'First Contact', 'keepsakeGroups survive round-trip');
assert(restored.session.productDrafts !== undefined,                 'productDrafts survive round-trip');

suite('SessionSerialization.restore — bad input');
const badRestore = KMEngine.SessionSerialization.restore('not-valid-json');
assert(badRestore.success === false, 'bad JSON returns failure result');
assert(badRestore.error !== null,    'error message present for bad JSON');
assert(badRestore.session === null,  'session is null on failure');

// ── CONTENT QUALITY CHECKS — smoke ───────────────────────────────────────────

suite('ContentQualityChecks — smoke');
assert(KMEngine.ContentQualityChecks !== undefined,                  'ContentQualityChecks exists on KMEngine');
assert(typeof KMEngine.ContentQualityChecks.compute === 'function',  'compute is a function');
const cqcEmpty = KMEngine.ContentQualityChecks.compute([]);
assert(Array.isArray(cqcEmpty) && cqcEmpty.length === 0,             'compute([]) returns empty array');
const cqcUrl = KMEngine.ContentQualityChecks.compute([{
    sender: 'Alice', senderRole: 'contact', text: 'Check https://example.com',
    type: 'message', isAttachmentOnly: false
}]);
assert(Array.isArray(cqcUrl) && cqcUrl.length > 0,                  'URL memory produces at least one issue');
assert(cqcUrl[0].type === 'RAW_URL_IN_CONTENT',                     'RAW_URL_IN_CONTENT is first issue for URL-only corpus');
assert(cqcUrl[0].severity === 'WARN',                               'issue severity is WARN');
const cqcAttach = KMEngine.ContentQualityChecks.compute([
    { sender: 'A', senderRole: 'contact', text: '', type: 'attachment-placeholder', isAttachmentOnly: true },
    { sender: 'A', senderRole: 'contact', text: '', type: 'attachment-placeholder', isAttachmentOnly: true },
    { sender: 'A', senderRole: 'contact', text: '', type: 'attachment-placeholder', isAttachmentOnly: true },
    { sender: 'A', senderRole: 'contact', text: '', type: 'attachment-placeholder', isAttachmentOnly: true },
    { sender: 'A', senderRole: 'contact', text: '', type: 'attachment-placeholder', isAttachmentOnly: true },
    { sender: 'B', senderRole: 'contact', text: 'Hello', type: 'message', isAttachmentOnly: false }
]);
assert(cqcAttach.some(function (i) { return i.type === 'HIGH_ATTACHMENT_RATIO'; }),
    'HIGH_ATTACHMENT_RATIO detected for >80% attachment corpus');
const cqcLong = KMEngine.ContentQualityChecks.compute([{
    sender: 'A', senderRole: 'contact', text: 'x'.repeat(1001), type: 'message', isAttachmentOnly: false
}]);
assert(cqcLong.some(function (i) { return i.type === 'VERY_LONG_CONTENT'; }),
    'VERY_LONG_CONTENT detected for text > 1000 chars');
const cqcShort = KMEngine.ContentQualityChecks.compute([{
    sender: 'A', senderRole: 'contact', text: 'Hi', type: 'message', isAttachmentOnly: false
}]);
assert(cqcShort.some(function (i) { return i.type === 'SHORT_CONVERSATION'; }),
    'SHORT_CONVERSATION detected for corpus < 10 messages');
const cqcDomSender = KMEngine.ContentQualityChecks.compute([
    { sender: 'Alice', senderRole: 'contact', text: 'A', type: 'message', isAttachmentOnly: false },
    { sender: 'Alice', senderRole: 'contact', text: 'B', type: 'message', isAttachmentOnly: false }
]);
assert(cqcDomSender.some(function (i) { return i.type === 'SINGLE_SENDER_DOMINANT'; }),
    'SINGLE_SENDER_DOMINANT detected when all non-system messages from one sender');

// ── CONVERSATION STATS — smoke ────────────────────────────────────────────────

suite('ConversationStats — smoke');
assert(KMEngine.ConversationStats !== undefined,                       'ConversationStats exists on KMEngine');
assert(typeof KMEngine.ConversationStats.compute === 'function',       'compute is a function');
const cstEmpty = KMEngine.ConversationStats.compute([]);
assert(typeof cstEmpty === 'object' && cstEmpty !== null,              'compute([]) returns an object');
assert(cstEmpty.busiestDay === null && cstEmpty.perSenderStats.length === 0, 'compute([]) returns zero-state');
const cstCorpus = KMEngine.ConversationStats.compute([{
    sender: 'Alice', senderRole: 'contact', timestamp: '2024-01-15T10:00:00.000Z',
    type: 'message', isAttachmentOnly: false
}]);
assert(typeof cstCorpus.busiestDay === 'string',                       'non-empty corpus returns string busiestDay');
assert(Array.isArray(cstCorpus.perSenderStats),                        'non-empty corpus returns perSenderStats array');

// ── EMOJI ANALYSIS — smoke ────────────────────────────────────────────────────

suite('EmojiAnalysis — smoke');
assert(KMEngine.EmojiAnalysis !== undefined,                           'EmojiAnalysis exists on KMEngine');
assert(typeof KMEngine.EmojiAnalysis.compute === 'function',           'compute is a function');
const eaEmpty = KMEngine.EmojiAnalysis.compute([]);
assert(typeof eaEmpty === 'object' && eaEmpty !== null,                'compute([]) returns an object');
assert(eaEmpty.totalEmojiCount === 0 && eaEmpty.topEmojis.length === 0, 'compute([]) returns zero-state');
assert(eaEmpty.mostEmojifiedSender === null,                           'compute([]) mostEmojifiedSender === null');
const eaCorpus = KMEngine.EmojiAnalysis.compute([{
    sender: 'Alice', text: 'Hello 😊', type: 'message', isAttachmentOnly: false
}]);
assert(eaCorpus.totalEmojiCount === 1,                                 'non-empty corpus returns totalEmojiCount 1');

// ── WORD ANALYSIS — smoke ─────────────────────────────────────────────────────

suite('WordAnalysis — smoke');
assert(KMEngine.WordAnalysis !== undefined,                            'WordAnalysis exists on KMEngine');
assert(typeof KMEngine.WordAnalysis.compute === 'function',            'compute is a function');
const waEmpty = KMEngine.WordAnalysis.compute([]);
assert(typeof waEmpty === 'object' && waEmpty !== null,                'compute([]) returns an object');
assert(waEmpty.totalWords === 0 && waEmpty.topWords.length === 0,      'compute([]) returns zero-state');
assert(waEmpty.topWordSender === null,                                 'compute([]) topWordSender === null');
const waCorpus = KMEngine.WordAnalysis.compute([{
    sender: 'Alice', text: 'hello world', type: 'message', isAttachmentOnly: false
}]);
assert(waCorpus.totalWords === 2,                                      'non-empty corpus returns totalWords 2');

// ── TIMING ANALYSIS — smoke ───────────────────────────────────────────────────

suite('TimingAnalysis — smoke');
assert(KMEngine.TimingAnalysis !== undefined,                          'TimingAnalysis exists on KMEngine');
assert(typeof KMEngine.TimingAnalysis.compute === 'function',          'compute is a function');
const taEmpty = KMEngine.TimingAnalysis.compute([]);
assert(typeof taEmpty === 'object' && taEmpty !== null,                'compute([]) returns an object');
assert(taEmpty.peakHour === null && taEmpty.peakDayOfWeek === null,    'compute([]) returns zero-state');
assert(Array.isArray(taEmpty.hourlyDistribution) && taEmpty.hourlyDistribution.length === 24, 'compute([]) hourlyDistribution has 24 slots');
assert(Array.isArray(taEmpty.dailyDistribution) && taEmpty.dailyDistribution.length === 7,   'compute([]) dailyDistribution has 7 slots');

// ── RESPONSE TIME ANALYSIS — smoke ────────────────────────────────────────────

suite('ResponseTimeAnalysis — smoke');
assert(KMEngine.ResponseTimeAnalysis !== undefined,                                            'ResponseTimeAnalysis exists on KMEngine');
assert(typeof KMEngine.ResponseTimeAnalysis.compute === 'function',                            'compute is a function');
const rtaEmpty = KMEngine.ResponseTimeAnalysis.compute([]);
assert(typeof rtaEmpty === 'object' && rtaEmpty !== null,                                      'compute([]) returns an object');
assert(rtaEmpty.avgResponseTimeMs === 0 && rtaEmpty.fastestResponder === null,                 'compute([]) returns zero-state');
assert(Array.isArray(rtaEmpty.perSenderStats) && rtaEmpty.perSenderStats.length === 0,        'compute([]) perSenderStats is empty array');
assert(Object.keys(KMEngine.ResponseTimeAnalysis).length === 1,                                'ResponseTimeAnalysis exposes only compute');

// ── MESSAGE LENGTH ANALYSIS — smoke ──────────────────────────────────────────

suite('MessageLengthAnalysis — smoke');
assert(KMEngine.MessageLengthAnalysis !== undefined,                                           'MessageLengthAnalysis exists on KMEngine');
assert(typeof KMEngine.MessageLengthAnalysis.compute === 'function',                           'compute is a function');
const mlaEmpty = KMEngine.MessageLengthAnalysis.compute([]);
assert(typeof mlaEmpty === 'object' && mlaEmpty !== null,                                      'compute([]) returns an object');
assert(mlaEmpty.avgCharsPerMessage === 0 && mlaEmpty.longestMessage === null,                  'compute([]) returns zero-state');
assert(Array.isArray(mlaEmpty.perSenderStats) && mlaEmpty.perSenderStats.length === 0,        'compute([]) perSenderStats is empty array');
assert(Object.keys(KMEngine.MessageLengthAnalysis).length === 1,                               'MessageLengthAnalysis exposes only compute');

// ── CONVERSATION INITIATION ANALYSIS — smoke ─────────────────────────────────

suite('ConversationInitiation — smoke');
assert(KMEngine.ConversationInitiation !== undefined,                                          'ConversationInitiation exists on KMEngine');
assert(typeof KMEngine.ConversationInitiation.compute === 'function',                          'compute is a function');
const ciEmpty = KMEngine.ConversationInitiation.compute([]);
assert(typeof ciEmpty === 'object' && ciEmpty !== null,                                        'compute([]) returns an object');
assert(ciEmpty.totalConversations === 0 && ciEmpty.topInitiator === null,                      'compute([]) returns zero-state');
assert(Array.isArray(ciEmpty.perSenderStats) && ciEmpty.perSenderStats.length === 0,           'compute([]) perSenderStats is empty array');
assert(Object.keys(KMEngine.ConversationInitiation).length === 1,                              'ConversationInitiation exposes only compute');

// ── REACTION ANALYSIS — smoke ────────────────────────────────────────────────

suite('ReactionAnalysis — smoke');
assert(KMEngine.ReactionAnalysis !== undefined,                                                'ReactionAnalysis exists on KMEngine');
assert(typeof KMEngine.ReactionAnalysis.compute === 'function',                                'compute is a function');
const raEmpty = KMEngine.ReactionAnalysis.compute([]);
assert(typeof raEmpty === 'object' && raEmpty !== null,                                         'compute([]) returns an object');
assert(raEmpty.totalReactions === 0 && raEmpty.topReactor === null,                             'compute([]) returns zero-state');
assert(Array.isArray(raEmpty.topReactionEmojis) && raEmpty.topReactionEmojis.length === 0,      'compute([]) topReactionEmojis is empty array');
assert(Object.keys(KMEngine.ReactionAnalysis).length === 1,                                     'ReactionAnalysis exposes only compute');

// ── CANONICAL CONVERSATION + ADAPTER CONTRACT — smoke ────────────────────────

suite('CanonicalConversation — smoke');
assert(KMEngine.CanonicalConversation !== undefined,                 'CanonicalConversation exists on KMEngine');
assert(typeof KMEngine.CanonicalConversation.createConversation === 'function', 'createConversation is a function');
const ccPar = KMEngine.CanonicalConversation.createParticipant({ displayName: 'Alex', isSelf: false });
const ccMsg = KMEngine.CanonicalConversation.createMessage({ participantId: ccPar.id, timestamp: '2024-06-01T09:00:00.000Z', text: 'Hi', importIndex: 0 });
const ccConv = KMEngine.CanonicalConversation.createConversation({
    platform:     'whatsapp',
    participants: [ccPar],
    messages:     [ccMsg],
    source:       KMEngine.CanonicalConversation.createSourceMetadata({ platform: 'whatsapp' }),
    diagnostics:  KMEngine.CanonicalConversation.createImportDiagnostics({})
});
assert(typeof ccConv.id === 'string' && ccConv.id.indexOf('cnv-') === 0, 'conversation has deterministic cnv- id');
assert(ccConv.messages.length === 1 && ccConv.messages[0].participantId === ccPar.id, 'message links to participant');

suite('ImportAdapterContract — smoke');
assert(KMEngine.ImportAdapterContract !== undefined,                 'ImportAdapterContract exists on KMEngine');
assert(typeof KMEngine.ImportAdapterContract.validateConversation === 'function', 'validateConversation is a function');
assert(KMEngine.ImportAdapterContract.validateConversation(ccConv).valid === true, 'valid canonical conversation passes the contract');
assert(KMEngine.ImportAdapterContract.validateAdapter(KMEngine.whatsappTxtAdapter).valid === true, 'existing whatsapp adapter satisfies the adapter interface contract');

// ── SUMMARY ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
