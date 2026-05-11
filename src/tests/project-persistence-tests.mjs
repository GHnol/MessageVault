/**
 * Package 3A — Project persistence tests.
 * Run with: node src/tests/project-persistence-tests.mjs
 *
 * Tests ProjectPersistence (serialize/validate/deserialize) and
 * ProjectSessionRestore (restore into app state).
 *
 * Does NOT test ProjectFileIO — that module uses browser APIs (Blob, FileReader)
 * and cannot be loaded in Node.js.
 */

import { readFileSync }              from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath }             from 'node:url';
import { dirname, join }             from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

// ── Shared vm context (window-based IIFE modules) ────────────────────────────

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

load('src/core/source-platforms.js');
load('src/core/normalized-memory.js');
load('src/core/import-adapters.js');
load('src/core/project-session.js');
load('src/state/session-serialization.js');
load('src/state/project-persistence.js');
load('src/state/project-session-restore.js');

const { KMEngine } = ctx.window;
const PP  = KMEngine.ProjectPersistence;
const PSR = KMEngine.ProjectSessionRestore;
const NM  = KMEngine.NormalizedMemory;
const PS  = KMEngine.ProjectSession;

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMem(overrides) {
    return NM.create(Object.assign({
        sourcePlatformId: 'txt-export',
        sourceAdapterId:  'txt-export-v1',
        importIndex:      0,
        timestamp:        '2024-01-01 10:00',
        sender:           'Jane',
        text:             'Hello world'
    }, overrides || {}));
}

function makeGroup(id, msgs, midxs, overrides) {
    return Object.assign({
        id:                id,
        messages:          msgs,
        messageIndices:    midxs || msgs.map(function (_, i) { return i; }),
        customName:        null,
        chosenTypeId:      null,
        lastComposedAt:    null,
        memoryIds:         [],
        sourcePlatformIds: [],
        productDrafts:     [],
        metadata:          {}
    }, overrides || {});
}

function makeMinimalFile() {
    var m1 = makeMem({ importIndex: 0, text: 'Hi there' });
    var m2 = makeMem({ importIndex: 1, sender: 'Me', text: 'Hello back' });
    var memories = [m1, m2];
    var selSet = { forEach: function (fn) { fn(0); fn(1); } };
    var group  = makeGroup('group-1', memories, [0, 1], {
        customName:    'Our chat',
        chosenTypeId:  'message-book'
    });
    return PP.createSnapshot({
        memories:        memories,
        keepsakeGroups:  [group],
        selectedIndices: selSet,
        contactName:     'Jane'
    });
}

// ── ProjectPersistence.validate ───────────────────────────────────────────────

suite('ProjectPersistence.validate');

assert(PP.VERSION === '1', 'VERSION is "1"');

var vNull = PP.validate(null);
assert(!vNull.valid,                         'null → invalid');
assert(vNull.errors.length > 0,              'null → errors populated');

var vBadVer = PP.validate({ keepmeesVersion: '99', projectSession: {
    id: 'x', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }});
assert(!vBadVer.valid,                       'wrong version → invalid');
assert(vBadVer.errors.some(function (e) { return e.includes('Unsupported'); }),
                                             'wrong version → Unsupported error');

var vMissingSession = PP.validate({ keepmeesVersion: '1' });
assert(!vMissingSession.valid,               'missing projectSession → invalid');

var vMissingId = PP.validate({ keepmeesVersion: '1', projectSession: {
    memories: [], selectedMemoryIds: [], keepsakeGroups: [] }});
assert(!vMissingId.valid,                    'missing id → invalid');

var vGood = PP.validate({
    keepmeesVersion: '1',
    exportedAt: new Date().toISOString(),
    projectSession: {
        id: 'sess-1', version: '1', memories: [],
        selectedMemoryIds: [], keepsakeGroups: []
    }
});
assert(vGood.valid,                          'valid minimal object → valid');
assert(vGood.errors.length === 0,            'valid minimal object → no errors');

// ── ProjectPersistence.deserialize ────────────────────────────────────────────

suite('ProjectPersistence.deserialize');

var dBadJson = PP.deserialize('not-valid-json{{{');
assert(!dBadJson.success,                    'malformed JSON → failure');
assert(dBadJson.error.indexOf('parse') >= 0, 'malformed JSON → parse error message');
assert(dBadJson.data === null,               'malformed JSON → data is null');

var dBadVer = PP.deserialize(JSON.stringify({ keepmeesVersion: '999',
    projectSession: { id: 'x', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }}));
assert(!dBadVer.success,                     'future version → failure');

var dGoodStr = PP.deserialize(JSON.stringify({
    keepmeesVersion: '1', exportedAt: new Date().toISOString(),
    projectSession: { id: 'sess-1', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
}));
assert(dGoodStr.success,                     'valid JSON string → success');
assert(dGoodStr.data !== null,               'valid JSON string → data populated');
assert(dGoodStr.error === null,              'valid JSON string → error is null');

var dGoodObj = PP.deserialize({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-1', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
});
assert(dGoodObj.success,                     'valid object passthrough → success');

// ── ProjectPersistence.createSnapshot ────────────────────────────────────────

suite('ProjectPersistence.createSnapshot — basic shape');

var snap = makeMinimalFile();
assert(snap.keepmeesVersion === '1',         'snapshot.keepmeesVersion is "1"');
assert(typeof snap.exportedAt === 'string',  'snapshot.exportedAt is string');
assert(snap.projectSession !== undefined,    'snapshot.projectSession exists');

var ps = snap.projectSession;
assert(typeof ps.id === 'string' && ps.id,  'projectSession.id is set');
assert(ps.version === '1',                   'projectSession.version is "1"');
assert(typeof ps.createdAt === 'string',     'projectSession.createdAt is string');
assert(typeof ps.updatedAt === 'string',     'projectSession.updatedAt is string');
assert(ps.contactName === 'Jane',            'contactName preserved');
assert(Array.isArray(ps.memories),           'memories is array');
assert(ps.memories.length === 2,             'both memories serialized');
assert(Array.isArray(ps.selectedMemoryIds),  'selectedMemoryIds is array');
assert(ps.selectedMemoryIds.length === 2,    'both selected IDs captured');
assert(Array.isArray(ps.keepsakeGroups),     'keepsakeGroups is array');
assert(ps.keepsakeGroups.length === 1,       'one group serialized');

suite('ProjectPersistence.createSnapshot — group thin form');

var g = ps.keepsakeGroups[0];
assert(g.id === 'group-1',                   'group id preserved');
assert(g.customName === 'Our chat',          'customName preserved');
assert(g.chosenTypeId === 'message-book',    'chosenTypeId preserved');
assert(Array.isArray(g.messageIds),          'group.messageIds is array');
assert(g.messageIds.length === 2,            'group.messageIds has 2 entries');
assert(!g.messages,                          'group.messages not present in thin form');
assert(typeof g.messageIds[0] === 'string' && g.messageIds[0].startsWith('mem-'),
                                             'group.messageIds[0] is a mem- id');

suite('ProjectPersistence.createSnapshot — selectedIndices → selectedMemoryIds');

var m1 = makeMem({ importIndex: 0 });
var m2 = makeMem({ importIndex: 1 });
var m3 = makeMem({ importIndex: 2 });
var selOnlyMiddle = { forEach: function (fn) { fn(1); } };
var snapSel = PP.createSnapshot({
    memories: [m1, m2, m3],
    keepsakeGroups: [],
    selectedIndices: selOnlyMiddle,
    contactName: ''
});
assert(snapSel.projectSession.selectedMemoryIds.length === 1,
                                             'only selected index 1 → one memory id');
assert(snapSel.projectSession.selectedMemoryIds[0] === m2.id,
                                             'selectedMemoryId matches m2.id');

suite('ProjectPersistence.createSnapshot — messageBookState');

var snapNoBook = PP.createSnapshot({ memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: '' });
assert(snapNoBook.projectSession.messageBookState === null,
                                             'no messageBookState → null in snapshot');

var fakeBook = {
    format:  { trimWidthIn: 7, trimHeightIn: 10, maxPages: 250 },
    opening: { title: 'Test Book', dedicationEnabled: false, dedicationText: '' },
    body:    { timestampMode: 'on', pageNumberMode: 'on', dividerMode: 'sparse',
               endingMode: 'branded', flowMode: 'sectioned' },
    sections: [{ sourceGroupId: 'g1', orderIndex: 0, included: true, messages: ['stripped'] }],
    volumes:  [{ id: 'vol-1', name: 'Volume 1' }],
    estimatedPageCount: 5, exceedsPageLimit: false
};
var snapBook = PP.createSnapshot({ memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: '', messageBookState: fakeBook });
assert(snapBook.projectSession.messageBookState !== null,    'messageBookState serialized');
var bState = snapBook.projectSession.messageBookState;
assert(bState.opening.title === 'Test Book',                 'opening.title preserved');
assert(bState.body.timestampMode === 'on',                   'body.timestampMode preserved');
assert(!bState.sections[0].messages,                         'sections[].messages stripped');

suite('ProjectPersistence.createSnapshot — provenance and sourceNativeId survive');

var mProv = NM.create({
    sourcePlatformId: 'imessage',
    sourceAdapterId:  'imessage-chatdb-v1',
    importIndex:      7,
    timestamp:        '2024-03-15 14:22',
    sender:           'Alice',
    text:             'native id test',
    sourceNativeId:   'rowid-999',
    provenance:       { importedAt: '2024-03-15T14:22:00Z', adapterVersion: '1' }
});
var snapProv = PP.createSnapshot({
    memories: [mProv], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: ''
});
var restoredMem = snapProv.projectSession.memories[0];
assert(restoredMem.sourceNativeId === 'rowid-999',     'sourceNativeId survives snapshot');
assert(restoredMem.provenance !== null,                'provenance object survives snapshot');

// ── ProjectSessionRestore.restore ─────────────────────────────────────────────

suite('ProjectSessionRestore.restore — basic happy path');

var fileObj = makeMinimalFile();
var r = PSR.restore(fileObj);
assert(r.success,                                        'restore succeeds on valid file');
assert(Array.isArray(r.appState.memories),               'appState.memories is array');
assert(r.appState.memories.length === 2,                 'both memories restored');
assert(Array.isArray(r.appState.selectedIndices),        'selectedIndices is array');
assert(r.appState.selectedIndices.length === 2,          'both selected indices restored');
assert(r.appState.selectedIndices.indexOf(0) >= 0,      'index 0 in selectedIndices');
assert(r.appState.selectedIndices.indexOf(1) >= 0,      'index 1 in selectedIndices');
assert(Array.isArray(r.appState.groups),                 'groups is array');
assert(r.appState.groups.length === 1,                   'one group restored');
assert(r.appState.contactName === 'Jane',                'contactName restored');
assert(r.errors.length === 0,                            'no errors on valid file');

suite('ProjectSessionRestore.restore — group thick form reconstruction');

var rg = r.appState.groups[0];
assert(rg.id === 'group-1',                              'group id preserved');
assert(rg.customName === 'Our chat',                     'customName preserved');
assert(rg.chosenTypeId === 'message-book',               'chosenTypeId preserved');
assert(Array.isArray(rg.messages),                       'group.messages is array');
assert(rg.messages.length === 2,                         'both messages in group');
assert(typeof rg.messages[0] === 'object',               'group.messages[0] is object');
assert(rg.messages[0].text !== undefined,                'group.messages[0] has .text');
assert(Array.isArray(rg.messageIndices),                 'group.messageIndices is array');
assert(rg.messageIndices.length === 2,                   'group.messageIndices has 2 entries');

suite('ProjectSessionRestore.restore — round-trip fidelity');

var mA = makeMem({ importIndex: 0, sender: 'Alice', text: 'Round trip A', sourceNativeId: 'native-A' });
var mB = makeMem({ importIndex: 1, sender: 'Me',    text: 'Round trip B' });
var mC = makeMem({ importIndex: 2, sender: 'Alice', text: 'Round trip C' });
var rtSel = { forEach: function (fn) { fn(0); fn(2); } };
var rtGroup = makeGroup('group-rt', [mA, mC], [0, 2], { customName: 'Faves', chosenTypeId: 'message-book' });
var rtSnap = PP.createSnapshot({
    memories: [mA, mB, mC],
    keepsakeGroups: [rtGroup],
    selectedIndices: rtSel,
    contactName: 'Alice'
});
var rtResult = PSR.restore(rtSnap);
assert(rtResult.success,                                 'round-trip restore succeeds');
var rtMems = rtResult.appState.memories;
assert(rtMems.length === 3,                              'all 3 memories round-trip');
assert(rtMems[0].text === 'Round trip A',                'memory[0] text round-trips');
assert(rtMems[0].sourceNativeId === 'native-A',          'sourceNativeId round-trips');
assert(rtMems[1].text === 'Round trip B',                'memory[1] text round-trips');
assert(rtResult.appState.selectedIndices.includes(0),   'selected index 0 round-trips');
assert(rtResult.appState.selectedIndices.includes(2),   'selected index 2 round-trips');
assert(!rtResult.appState.selectedIndices.includes(1),  'unselected index 1 not in result');
var rtG = rtResult.appState.groups[0];
assert(rtG.messages.length === 2,                        'group has 2 messages round-trip');
assert(rtG.messages[0].text === 'Round trip A',          'group message[0] round-trips');
assert(rtG.messages[1].text === 'Round trip C',          'group message[1] round-trips');
assert(rtG.customName === 'Faves',                       'customName round-trips');
assert(rtG.chosenTypeId === 'message-book',              'chosenTypeId round-trips');

suite('ProjectSessionRestore.restore — invalid / null input');

var rNull = PSR.restore(null);
assert(!rNull.success,                                   'null input → failure');
assert(rNull.appState === null,                          'null input → appState null');
assert(rNull.errors.length > 0,                          'null input → errors present');

var rNoSession = PSR.restore({ keepmeesVersion: '1' });
assert(!rNoSession.success,                              'missing projectSession → failure');

suite('ProjectSessionRestore.restore — missing optional fields handled safely');

var minimal = {
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-min',
        memories: [],
        selectedMemoryIds: [],
        keepsakeGroups: []
    }
};
var rMin = PSR.restore(minimal);
assert(rMin.success,                                     'minimal session restores successfully');
assert(rMin.appState.memories.length === 0,              'empty memories ok');
assert(rMin.appState.selectedIndices.length === 0,       'empty selectedIndices ok');
assert(rMin.appState.groups.length === 0,                'empty groups ok');
assert(rMin.appState.contactName === '',                 'missing contactName defaults to ""');
assert(rMin.appState.messageBookState === null,          'missing messageBookState defaults to null');

suite('ProjectSessionRestore.restore — stale selectedMemoryId produces warning');

var mOnly = makeMem({ importIndex: 0, text: 'only mem' });
var staleFile = {
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-stale',
        memories: [mOnly],
        selectedMemoryIds: [mOnly.id, 'mem-does-not-exist'],
        keepsakeGroups: []
    }
};
var rStale = PSR.restore(staleFile);
assert(rStale.success,                                   'stale id does not crash restore');
assert(rStale.appState.selectedIndices.length === 1,     'only valid id becomes index');
assert(rStale.warnings.length > 0,                       'stale id produces warning');
assert(rStale.warnings.some(function (w) {
    return w.indexOf('does-not-exist') >= 0;
}), 'warning names the missing id');

suite('ProjectSessionRestore.restore — group with missing messageId produces warning');

var mG1 = makeMem({ importIndex: 0, text: 'group mem' });
var fileWithBadGroup = {
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-badgroup',
        memories: [mG1],
        selectedMemoryIds: [],
        keepsakeGroups: [{
            id: 'group-bad',
            messageIds: [mG1.id, 'mem-ghost'],
            messageIndices: [0, 99],
            customName: null,
            chosenTypeId: null
        }]
    }
};
var rBadGroup = PSR.restore(fileWithBadGroup);
assert(rBadGroup.success,                                'missing group message id does not fail restore');
assert(rBadGroup.appState.groups[0].messages.length === 1,
                                                         'only the valid message is in group');
assert(rBadGroup.warnings.some(function (w) {
    return w.indexOf('mem-ghost') >= 0;
}), 'warning names the missing messageId');

suite('ProjectSessionRestore.restore — unknown session fields warned');

var fileUnknown = {
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-unk',
        memories: [],
        selectedMemoryIds: [],
        keepsakeGroups: [],
        unknownFutureField: { data: 'something' }
    }
};
var rUnk = PSR.restore(fileUnknown);
assert(rUnk.success,                                     'unknown field does not break restore');
assert(rUnk.warnings.some(function (w) {
    return w.indexOf('unknownFutureField') >= 0;
}), 'unknown field produces warning');

suite('ProjectSessionRestore.restore — messageBookState preserved');

var fileWithBook = makeMinimalFile();
fileWithBook.projectSession.messageBookState = {
    format:  { trimWidthIn: 7, trimHeightIn: 10, maxPages: 250 },
    opening: { title: 'Saved Book', dedicationEnabled: true, dedicationText: 'With love' },
    body:    { timestampMode: 'off', pageNumberMode: 'on',
               dividerMode: 'none', endingMode: 'branded', flowMode: 'sectioned' },
    sections: [],
    volumes:  [{ id: 'vol-1', name: 'Volume 1', estimatedPageCount: 0 }],
    estimatedPageCount: 0, exceedsPageLimit: false
};
var rBook = PSR.restore(fileWithBook);
assert(rBook.success,                                    'restore with messageBookState succeeds');
assert(rBook.appState.messageBookState !== null,         'messageBookState not null after restore');
assert(rBook.appState.messageBookState.opening.title === 'Saved Book',
                                                         'opening.title restored');
assert(rBook.appState.messageBookState.opening.dedicationText === 'With love',
                                                         'dedicationText restored');
assert(rBook.appState.messageBookState.body.timestampMode === 'off',
                                                         'body.timestampMode restored');

suite('ProjectSessionRestore.restore — manual entry memory survives round-trip');

var mManual = NM.create({
    sourcePlatformId: 'manual',
    sourceAdapterId:  'manual-v1',
    importIndex:      0,
    timestamp:        '2024-06-01 09:00',
    sender:           'Me',
    text:             'A manually entered message',
    sourceNativeId:   null,
    provenance:       null
});
var manualSnap = PP.createSnapshot({
    memories:        [mManual],
    keepsakeGroups:  [],
    selectedIndices: { forEach: function () {} },
    contactName:     ''
});
var manualResult = PSR.restore(manualSnap);
assert(manualResult.success,                             'manual memory restore succeeds');
assert(manualResult.appState.memories[0].text === 'A manually entered message',
                                                         'manual memory text round-trips');
assert(manualResult.appState.memories[0].sourcePlatformId === 'manual',
                                                         'sourcePlatformId round-trips for manual');

suite('ProjectSessionRestore.restore — staging group (group-staging) survives round-trip');

var mSt = makeMem({ importIndex: 0, text: 'staging msg' });
var stagingGroup = makeGroup('group-staging', [mSt], [0]);
var stagingSnap = PP.createSnapshot({
    memories:        [mSt],
    keepsakeGroups:  [stagingGroup],
    selectedIndices: { forEach: function () {} },
    contactName:     ''
});
var stagingResult = PSR.restore(stagingSnap);
assert(stagingResult.success,                            'staging group restore succeeds');
assert(stagingResult.appState.groups[0].id === 'group-staging',
                                                         'group-staging id preserved');
assert(stagingResult.appState.groups[0].messages.length === 1,
                                                         'staging group message restored');

// ── ProjectPersistence + SessionSerialization compatibility ───────────────────

suite('Compatibility — ProjectPersistence.validate accepts ProjectSession.create output wrapped in file envelope');

var psSession = PS.create({
    id: 'sess-compat', memories: [], selectedMemoryIds: [], keepsakeGroups: []
});
var compat = {
    keepmeesVersion: PP.VERSION,
    exportedAt: new Date().toISOString(),
    projectSession: psSession
};
var vCompat = PP.validate(compat);
assert(vCompat.valid,                                    'ProjectSession.create output validates as projectSession');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────');
console.log('  Passed: ' + passed);
console.log('  Failed: ' + failed);
console.log('─────────────────────────────────────');

if (failed > 0) process.exit(1);
