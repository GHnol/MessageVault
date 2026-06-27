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

// ── Package 5B — PSR restore proofApprovalStates ──────────────────────────────

suite('Package 5B — restore with proofApprovalStates does not produce unknown-field warning');

var pasPendingRecord = {
    productTypeId: 'message-book',
    status: 'pending-review',
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
    submittedAt: '2026-06-02T00:00:00.000Z',
    approvedAt: null, changesRequestedAt: null, revokedAt: null,
    changeRequestReason: null, revokeReason: null, notes: null
};
var fileWithPAS = {
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-pas',
        memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        proofApprovalStates: { 'message-book': pasPendingRecord }
    }
};
var rPAS = PSR.restore(fileWithPAS);
assert(rPAS.success,                                          'restore with proofApprovalStates succeeds');
assert(!rPAS.warnings.some(function (w) {
    return w.indexOf('proofApprovalStates') >= 0;
}), 'proofApprovalStates does NOT produce an unknown-field warning');

suite('Package 5B — restore puts proofApprovalStates in appState');

assert(rPAS.appState.proofApprovalStates !== undefined,
    'appState.proofApprovalStates is present');
assert(typeof rPAS.appState.proofApprovalStates === 'object' &&
       rPAS.appState.proofApprovalStates !== null,
    'appState.proofApprovalStates is a plain object');
assert(rPAS.appState.proofApprovalStates['message-book'] !== undefined,
    'message-book key is present in restored proofApprovalStates');
assert(rPAS.appState.proofApprovalStates['message-book'].status === 'pending-review',
    'proofApprovalStates status survives restore');

suite('Package 5B — restore without proofApprovalStates returns empty object in appState');

var fileNoPAS = {
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-nopas',
        memories: [], selectedMemoryIds: [], keepsakeGroups: []
    }
};
var rNoPAS = PSR.restore(fileNoPAS);
assert(rNoPAS.success,                                        'restore without proofApprovalStates succeeds');
assert(typeof rNoPAS.appState.proofApprovalStates === 'object' &&
       rNoPAS.appState.proofApprovalStates !== null,
    'appState.proofApprovalStates defaults to object when absent');
assert(Object.keys(rNoPAS.appState.proofApprovalStates).length === 0,
    'default proofApprovalStates is empty');

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

// ── Package 5B — proofApprovalStates persistence ─────────────────────────────

suite('Package 5B — createSnapshot includes proofApprovalStates when passed');

var pasStates = { 'message-book': { productTypeId: 'message-book', status: 'pending-review', submittedAt: '2026-06-02T00:00:00.000Z' } };
var snapWithPAS = PP.createSnapshot({
    memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: '',
    proofApprovalStates: pasStates
});
assert(snapWithPAS.projectSession.proofApprovalStates !== undefined,
    'createSnapshot includes proofApprovalStates in projectSession');
assert(typeof snapWithPAS.projectSession.proofApprovalStates === 'object',
    'proofApprovalStates in snapshot is an object');
assert(snapWithPAS.projectSession.proofApprovalStates['message-book'] !== undefined,
    'message-book key present in snapshot proofApprovalStates');
assert(snapWithPAS.projectSession.proofApprovalStates['message-book'].status === 'pending-review',
    'proofApprovalStates status round-trips correctly');

suite('Package 5B — createSnapshot defaults proofApprovalStates safely');

var snapNoPAS = PP.createSnapshot({
    memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: ''
});
assert(typeof snapNoPAS.projectSession.proofApprovalStates === 'object' &&
       !Array.isArray(snapNoPAS.projectSession.proofApprovalStates),
    'omitted proofApprovalStates defaults to plain object');
assert(Object.keys(snapNoPAS.projectSession.proofApprovalStates).length === 0,
    'default proofApprovalStates is empty object');

suite('Package 5B — validate accepts snapshot with proofApprovalStates object');

var vWithPAS = PP.validate({
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-5b', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        proofApprovalStates: { 'message-book': { productTypeId: 'message-book', status: 'none' } }
    }
});
assert(vWithPAS.valid,   'validate accepts projectSession with proofApprovalStates object');
assert(vWithPAS.errors.length === 0, 'no errors for valid proofApprovalStates');

suite('Package 5B — validate accepts older snapshots without proofApprovalStates');

var vOldSnap = PP.validate({
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-old', memories: [], selectedMemoryIds: [], keepsakeGroups: []
    }
});
assert(vOldSnap.valid,   'validate accepts old snapshot without proofApprovalStates');
assert(vOldSnap.errors.length === 0, 'no errors for absent proofApprovalStates');

suite('Package 5B — round-trip preserves proofApprovalStates');

var rtPAS = { 'message-book': { productTypeId: 'message-book', status: 'pending-review', submittedAt: '2026-06-02T00:00:00.000Z', approvedAt: null } };
var rtSnap5b = PP.createSnapshot({
    memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: '',
    proofApprovalStates: rtPAS
});
var rtJson5b = JSON.stringify(rtSnap5b);
var rtParsed5b = JSON.parse(rtJson5b);
var rtValidate5b = PP.validate(rtParsed5b);
assert(rtValidate5b.valid, 'round-tripped proofApprovalStates snapshot validates');
assert(rtParsed5b.projectSession.proofApprovalStates['message-book'].status === 'pending-review',
    'proofApprovalStates status preserved through JSON round-trip');

suite('Package 5B — invalid proofApprovalStates type fails validation');

var vArrayPAS = PP.validate({
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-bad', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        proofApprovalStates: ['not', 'an', 'object']
    }
});
assert(!vArrayPAS.valid, 'validate rejects array proofApprovalStates');
assert(vArrayPAS.errors.some(function (e) { return e.includes('proofApprovalStates'); }),
    'error message references proofApprovalStates');

var vStringPAS = PP.validate({
    keepmeesVersion: '1',
    projectSession: {
        id: 'sess-bad2', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        proofApprovalStates: 'invalid'
    }
});
assert(!vStringPAS.valid, 'validate rejects string proofApprovalStates');

// ── Package 5D — proof approval fingerprint + stale state persistence ─────────

suite('Package 5D — approved record fingerprint round-trips through snapshot + restore');

var pas5dApproved = { 'message-book': {
    productTypeId: 'message-book',
    status: 'approved',
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    submittedAt: '2026-06-24T00:00:00.000Z',
    approvedAt: '2026-06-24T00:00:00.000Z',
    changesRequestedAt: null, revokedAt: null, staleAt: null,
    changeRequestReason: null, revokeReason: null,
    approvedProofFingerprint: 'kmpf1:deadbeefcafef00d', notes: null
} };
var snap5d = PP.createSnapshot({
    memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: '',
    proofApprovalStates: pas5dApproved
});
var parsed5d = JSON.parse(JSON.stringify(snap5d));
assert(PP.validate(parsed5d).valid, 'approved-with-fingerprint snapshot validates after JSON round-trip');
assert(parsed5d.projectSession.proofApprovalStates['message-book'].approvedProofFingerprint === 'kmpf1:deadbeefcafef00d',
    'approvedProofFingerprint preserved through snapshot JSON round-trip');

var restore5d = PSR.restore(parsed5d);
assert(restore5d.success, 'restore of approved-with-fingerprint succeeds');
assert(restore5d.appState.proofApprovalStates['message-book'].status === 'approved',
    'restored status is approved');
assert(restore5d.appState.proofApprovalStates['message-book'].approvedProofFingerprint === 'kmpf1:deadbeefcafef00d',
    'restored record preserves approvedProofFingerprint');
assert(!restore5d.warnings.some(function (w) { return w.indexOf('proofApprovalStates') >= 0; }),
    'approved-with-fingerprint produces no unknown-field warning');

suite('Package 5D — stale record round-trips through snapshot + restore');

var pas5dStale = { 'message-book': {
    productTypeId: 'message-book',
    status: 'stale',
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    submittedAt: '2026-06-24T00:00:00.000Z',
    approvedAt: '2026-06-24T00:00:00.000Z',
    changesRequestedAt: null, revokedAt: null,
    staleAt: '2026-06-24T01:00:00.000Z',
    changeRequestReason: null, revokeReason: null,
    approvedProofFingerprint: 'kmpf1:00112233aabbccdd', notes: null
} };
var snap5dStale = PP.createSnapshot({
    memories: [], keepsakeGroups: [],
    selectedIndices: { forEach: function () {} }, contactName: '',
    proofApprovalStates: pas5dStale
});
var parsed5dStale = JSON.parse(JSON.stringify(snap5dStale));
assert(PP.validate(parsed5dStale).valid, 'stale snapshot validates after JSON round-trip');
var restore5dStale = PSR.restore(parsed5dStale);
assert(restore5dStale.success, 'restore of stale record succeeds');
assert(restore5dStale.appState.proofApprovalStates['message-book'].status === 'stale',
    'restored status is stale');
assert(restore5dStale.appState.proofApprovalStates['message-book'].staleAt === '2026-06-24T01:00:00.000Z',
    'restored record preserves staleAt');

// ── Package 3E: productDrafts validation ─────────────────────────────────────

suite('Package 3E — productDrafts validation');

// absent → valid (backward compat)
var vNoDrafts = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-nd', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
});
assert(vNoDrafts.valid, 'productDrafts absent → valid (backward compat)');

// null → valid (treated as absent)
var vNullDrafts = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-nul', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        productDrafts: null }
});
assert(vNullDrafts.valid, 'productDrafts null → valid (treated as absent)');

// empty array → valid
var vEmptyDrafts = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-empty', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        productDrafts: [] }
});
assert(vEmptyDrafts.valid, 'productDrafts [] → valid');

// non-array → invalid
var vBadDrafts = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-bad', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        productDrafts: { type: 'object-not-array' } }
});
assert(!vBadDrafts.valid, 'productDrafts non-array object → invalid');
assert(vBadDrafts.errors.some(function (e) { return e.includes('productDrafts'); }),
    'error message references productDrafts');

// string → invalid
var vStrDrafts = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-str', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        productDrafts: 'invalid' }
});
assert(!vStrDrafts.valid, 'productDrafts string → invalid');

// well-formed draft records → valid
var vWellDrafts = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 'sess-well', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        productDrafts: [{ productTypeId: 'message-book', status: 'in-progress',
                          createdAt: '2026-06-02T00:00:00Z', updatedAt: '2026-06-02T00:00:00Z',
                          preflightRunAt: null, notes: null }] }
});
assert(vWellDrafts.valid, 'well-formed ProductDraftState records in productDrafts → valid');

// ── Package 3E: productDrafts restore normalization ───────────────────────────

suite('Package 3E — productDrafts restore normalization');

// Group productDrafts: empty array → preserved
var snapEmpty = PP.createSnapshot({
    memories: [], keepsakeGroups: [
        { id: 'g1', messages: [], messageIndices: [], customName: null,
          chosenTypeId: null, lastComposedAt: null, memoryIds: [], sourcePlatformIds: [],
          productDrafts: [], metadata: {} }
    ], selectedIndices: { forEach: function () {} }, contactName: ''
});
var restEmpty = PSR.restore(snapEmpty);
assert(restEmpty.success, 'restore with empty group productDrafts succeeds');
assert(Array.isArray(restEmpty.appState.groups[0].productDrafts), 'empty productDrafts restored as array');
assert(restEmpty.appState.groups[0].productDrafts.length === 0, 'empty productDrafts has 0 entries');

// Well-formed draft record → preserved
var wellDraft = { productTypeId: 'message-book', status: 'in-progress',
                  createdAt: '2026-06-02T00:00:00Z', updatedAt: '2026-06-02T00:00:00Z',
                  preflightRunAt: null, notes: null };
var snapWell = PP.createSnapshot({
    memories: [], keepsakeGroups: [
        { id: 'g2', messages: [], messageIndices: [], customName: null,
          chosenTypeId: null, lastComposedAt: null, memoryIds: [], sourcePlatformIds: [],
          productDrafts: [wellDraft], metadata: {} }
    ], selectedIndices: { forEach: function () {} }, contactName: ''
});
var restWell = PSR.restore(snapWell);
assert(restWell.success, 'restore with well-formed group productDrafts succeeds');
assert(restWell.appState.groups[0].productDrafts.length === 1, 'well-formed draft preserved');
assert(restWell.appState.groups[0].productDrafts[0].productTypeId === 'message-book',
    'well-formed draft productTypeId preserved');

// Malformed draft record → dropped with warning
var badDraft = { notAProductTypeId: 'oops', status: 42 };
var snapBad = PP.createSnapshot({
    memories: [], keepsakeGroups: [
        { id: 'g3', messages: [], messageIndices: [], customName: null,
          chosenTypeId: null, lastComposedAt: null, memoryIds: [], sourcePlatformIds: [],
          productDrafts: [wellDraft, badDraft], metadata: {} }
    ], selectedIndices: { forEach: function () {} }, contactName: ''
});
var restBad = PSR.restore(snapBad);
assert(restBad.success, 'restore with one malformed draft still succeeds');
assert(restBad.appState.groups[0].productDrafts.length === 1, 'malformed draft dropped');
assert(restBad.warnings.some(function (w) { return w.includes('malformed') || w.includes('productDraft'); }),
    'malformed draft drop emits warning');

// Group productDrafts absent → []
var snapAbsent = PP.createSnapshot({
    memories: [], keepsakeGroups: [
        { id: 'g4', messages: [], messageIndices: [], customName: null,
          chosenTypeId: null, lastComposedAt: null, memoryIds: [], sourcePlatformIds: [],
          metadata: {} }
    ], selectedIndices: { forEach: function () {} }, contactName: ''
});
var restAbsent = PSR.restore(snapAbsent);
assert(restAbsent.success, 'restore with absent group productDrafts succeeds');
assert(Array.isArray(restAbsent.appState.groups[0].productDrafts), 'absent productDrafts → array');
assert(restAbsent.appState.groups[0].productDrafts.length === 0, 'absent productDrafts → empty array');

// ── Package 3E: proofApprovalStates behavior unchanged ───────────────────────

suite('Package 3E — proofApprovalStates behavior unchanged (regression)');
var snapPAS = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} },
    contactName: '', proofApprovalStates: { 'message-book': { productTypeId: 'message-book',
        status: 'pending-review', createdAt: '2026-06-02T00:00:00Z',
        updatedAt: '2026-06-02T00:00:00Z', submittedAt: '2026-06-02T00:00:00Z',
        approvedAt: null, changesRequestedAt: null, revokedAt: null,
        changeRequestReason: null, revokeReason: null, notes: null } }
});
var restPAS = PSR.restore(snapPAS);
assert(restPAS.success, 'proofApprovalStates snapshot restores successfully');
assert(typeof restPAS.appState.proofApprovalStates === 'object', 'proofApprovalStates restored as object');
assert(restPAS.appState.proofApprovalStates['message-book'] !== undefined,
    'proofApprovalStates entry preserved');

// ── 7E: messageBookOrderIntent persistence ───────────────────────────────────

// A representative local-only, non-transactional order-intent record (the shape
// produced by KMEngine.MessageBookOrderIntent). Persistence treats it as an opaque
// plain object — it carries no price/cart/order/payment/address field.
var orderIntentRecord = {
    productTypeId: 'message-book',
    status: 'intent-draft-local',
    nonTransactional: true,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
    intentAt: '2026-06-26T00:00:00.000Z',
    blockedAt: null,
    blockedReason: null,
    clearedAt: null,
    notes: null
};

suite('7E — createSnapshot includes messageBookOrderIntent when passed');
var snapOI = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} },
    contactName: '', messageBookOrderIntent: orderIntentRecord
});
assert(snapOI.projectSession.messageBookOrderIntent !== null &&
       typeof snapOI.projectSession.messageBookOrderIntent === 'object',
    'createSnapshot includes messageBookOrderIntent in projectSession');
assert(snapOI.projectSession.messageBookOrderIntent.status === 'intent-draft-local',
    'order-intent status carried into snapshot');
assert(snapOI.projectSession.messageBookOrderIntent.nonTransactional === true,
    'order-intent record stays non-transactional in snapshot');

suite('7E — createSnapshot defaults messageBookOrderIntent to null when absent / non-object');
var snapNoOI = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} }, contactName: ''
});
assert(snapNoOI.projectSession.messageBookOrderIntent === null,
    'omitted messageBookOrderIntent defaults to null');
var snapArrOI = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} },
    contactName: '', messageBookOrderIntent: ['nope']
});
assert(snapArrOI.projectSession.messageBookOrderIntent === null,
    'array messageBookOrderIntent coerced to null in snapshot');

suite('7E — validate accepts object / null / absent and rejects array messageBookOrderIntent');
var vWithOI = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookOrderIntent: orderIntentRecord }
});
assert(vWithOI.valid, 'validate accepts projectSession with messageBookOrderIntent object');
var vNullOI = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookOrderIntent: null }
});
assert(vNullOI.valid, 'validate accepts null messageBookOrderIntent');
var vAbsentOI = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
});
assert(vAbsentOI.valid, 'validate accepts absent messageBookOrderIntent (back-compat)');
var vArrOI = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookOrderIntent: ['x'] }
});
assert(!vArrOI.valid && vArrOI.errors.some(function (e) { return e.indexOf('messageBookOrderIntent') >= 0; }),
    'validate rejects array messageBookOrderIntent with a referencing error');

suite('7E — restore puts messageBookOrderIntent in appState without unknown-field warning');
var rOI = PSR.restore(snapOI);
assert(rOI.success, 'restore with messageBookOrderIntent succeeds');
assert(rOI.appState.messageBookOrderIntent !== null &&
       rOI.appState.messageBookOrderIntent.status === 'intent-draft-local',
    'order-intent record survives restore into appState');
assert(!rOI.warnings.some(function (w) { return w.indexOf('messageBookOrderIntent') >= 0; }),
    'messageBookOrderIntent does NOT produce an unknown-field warning');

suite('7E — restore without messageBookOrderIntent defaults to null');
var rNoOI = PSR.restore(snapNoOI);
assert(rNoOI.success && rNoOI.appState.messageBookOrderIntent === null,
    'absent messageBookOrderIntent restores as null');

suite('7E — round-trip preserves messageBookOrderIntent through JSON');
var rtOIParsed = JSON.parse(JSON.stringify(snapOI));
assert(PP.validate(rtOIParsed).valid, 'round-tripped messageBookOrderIntent snapshot validates');
var rtOIRestore = PSR.restore(rtOIParsed);
assert(rtOIRestore.appState.messageBookOrderIntent.status === 'intent-draft-local',
    'order-intent status preserved through JSON round-trip');
assert(rtOIRestore.appState.messageBookOrderIntent.intentAt === '2026-06-26T00:00:00.000Z',
    'order-intent timestamps preserved through JSON round-trip');

// ── 8D — messageBookPrintSpecSelection persistence ──────────────────────────────

var PRINT_SPEC_ID = 'message-book-internal-7x10-hardcover-v1';

suite('8D — createSnapshot carries messageBookPrintSpecSelection string');
var snapPS = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} },
    contactName: '', messageBookPrintSpecSelection: PRINT_SPEC_ID
});
assert(snapPS.projectSession.messageBookPrintSpecSelection === PRINT_SPEC_ID,
    'createSnapshot carries the selected print spec id');

suite('8D — createSnapshot defaults messageBookPrintSpecSelection to null when absent / non-string');
var snapNoPS = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} }, contactName: ''
});
assert(snapNoPS.projectSession.messageBookPrintSpecSelection === null,
    'omitted print-spec selection defaults to null');
var snapBadPS = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} },
    contactName: '', messageBookPrintSpecSelection: { id: 'x' }
});
assert(snapBadPS.projectSession.messageBookPrintSpecSelection === null,
    'non-string print-spec selection coerced to null in snapshot');
var snapEmptyPS = PP.createSnapshot({
    memories: [], keepsakeGroups: [], selectedIndices: { forEach: function () {} },
    contactName: '', messageBookPrintSpecSelection: ''
});
assert(snapEmptyPS.projectSession.messageBookPrintSpecSelection === null,
    'empty-string print-spec selection coerced to null in snapshot');

suite('8D — validate accepts string / null / absent and rejects non-string messageBookPrintSpecSelection');
var vStrPS = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookPrintSpecSelection: PRINT_SPEC_ID }
});
assert(vStrPS.valid, 'validate accepts string print-spec selection');
var vNullPS = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookPrintSpecSelection: null }
});
assert(vNullPS.valid, 'validate accepts null print-spec selection');
var vAbsentPS = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
});
assert(vAbsentPS.valid, 'validate accepts absent print-spec selection (back-compat)');
var vBadPS = PP.validate({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookPrintSpecSelection: { id: 'x' } }
});
assert(!vBadPS.valid && vBadPS.errors.some(function (e) { return e.indexOf('messageBookPrintSpecSelection') >= 0; }),
    'validate rejects non-string print-spec selection with a referencing error');

suite('8D — restore puts messageBookPrintSpecSelection in appState without unknown-field warning');
var rPS = PSR.restore(snapPS);
assert(rPS.success, 'restore with print-spec selection succeeds');
assert(rPS.appState.messageBookPrintSpecSelection === PRINT_SPEC_ID,
    'print-spec selection survives restore into appState');
assert(!rPS.warnings.some(function (w) { return w.indexOf('messageBookPrintSpecSelection') >= 0; }),
    'messageBookPrintSpecSelection does NOT produce an unknown-field warning');

suite('8D — restore without messageBookPrintSpecSelection defaults to null');
var rNoPS = PSR.restore(snapNoPS);
assert(rNoPS.success && rNoPS.appState.messageBookPrintSpecSelection === null,
    'absent print-spec selection restores as null');

suite('8D — restore drops a non-string persisted print-spec selection to null');
var rBadPS = PSR.restore({
    keepmeesVersion: '1',
    projectSession: { id: 's1', memories: [], selectedMemoryIds: [], keepsakeGroups: [],
        messageBookPrintSpecSelection: { id: 'x' } }
});
assert(rBadPS.appState.messageBookPrintSpecSelection === null,
    'non-string persisted selection restores as null');

suite('8D — round-trip preserves messageBookPrintSpecSelection through JSON');
var rtPSParsed = JSON.parse(JSON.stringify(snapPS));
assert(PP.validate(rtPSParsed).valid, 'round-tripped print-spec snapshot validates');
var rtPSRestore = PSR.restore(rtPSParsed);
assert(rtPSRestore.appState.messageBookPrintSpecSelection === PRINT_SPEC_ID,
    'print-spec selection preserved through JSON round-trip');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────');
console.log('  Passed: ' + passed);
console.log('  Failed: ' + failed);
console.log('─────────────────────────────────────');

if (failed > 0) process.exit(1);
