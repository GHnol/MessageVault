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
load('src/adapters/future-adapter-stubs.js');
load('src/core/project-session.js');
load('src/state/session-serialization.js');

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
assert(KMEngine.getSourcePlatform('android-sms').status === 'stub',      'android-sms is stub');
assert(KMEngine.getSourcePlatform('instagram-dm').status === 'stub',     'instagram-dm is stub');
assert(KMEngine.getSourcePlatform('telegram').status  === 'stub',        'telegram is stub');
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

// ── SUMMARY ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
