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
    load(ctx, 'src/products/product-statuses.js');
    load(ctx, 'src/products/product-catalog.js');
    load(ctx, 'src/products/product-render-spec.js');
    load(ctx, 'src/products/product-render-spec-resolver.js');
    load(ctx, 'src/products/prototype-preview-registry.js');
    load(ctx, 'src/products/prototype-preview-resolver.js');
    return ctx.window.KMEngine;
}

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
// Suite 1 — Registry module exists
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — Registry module exists', function () {
    const KM = makeCtx();
    assert(typeof KM.PrototypePreviewRegistry === 'object' && KM.PrototypePreviewRegistry !== null,
        'KMEngine.PrototypePreviewRegistry is an object');
    assert(typeof KM.PrototypePreviewRegistry.all               === 'function', '.all() is a function');
    assert(typeof KM.PrototypePreviewRegistry.get               === 'function', '.get() is a function');
    assert(typeof KM.PrototypePreviewRegistry.getByPreviewTypeId === 'function', '.getByPreviewTypeId() is a function');
    assert(typeof KM.PrototypePreviewRegistry.architectureKnown  === 'function', '.architectureKnown() is a function');
    assert(typeof KM.PrototypePreviewRegistry.prototypePreviewSupported === 'function',
        '.prototypePreviewSupported() is a function');
    assert(typeof KM.PREVIEW_STATUS === 'object' && KM.PREVIEW_STATUS !== null,
        'KMEngine.PREVIEW_STATUS is exported');
    assert(typeof KM.makePreviewEntry === 'function', 'KMEngine.makePreviewEntry is exported');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — PREVIEW_STATUS constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — PREVIEW_STATUS constants', function () {
    const KM = makeCtx();
    const PS = KM.PREVIEW_STATUS;
    assert(PS.READY          === 'ready',          'PREVIEW_STATUS.READY = ready');
    assert(PS.STUB            === 'stub',           'PREVIEW_STATUS.STUB = stub');
    assert(PS.NOT_APPLICABLE  === 'not-applicable', 'PREVIEW_STATUS.NOT_APPLICABLE = not-applicable');
    const keys = Object.keys(PS);
    assert(keys.length === 3, 'PREVIEW_STATUS has exactly 3 keys');
    let frozen = true;
    try { PS.EXTRA = 'x'; } catch (e) { /* expected */ }
    assert(PS.EXTRA === undefined, 'PREVIEW_STATUS is frozen');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — Registry.all() count and entry shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — Registry.all() count and entry shape', function () {
    const KM      = makeCtx();
    const entries = KM.PrototypePreviewRegistry.all();
    assert(Array.isArray(entries), 'all() returns an array');
    assert(entries.length === 6,   'all() returns exactly 6 entries (one per render planning target)');
    entries.forEach(function (e, i) {
        assert(typeof e.productTypeId           === 'string',  'entry[' + i + '].productTypeId is string');
        assert(typeof e.previewTypeId           === 'string',  'entry[' + i + '].previewTypeId is string');
        assert(typeof e.displayName             === 'string',  'entry[' + i + '].displayName is string');
        assert(typeof e.previewStatus           === 'string',  'entry[' + i + '].previewStatus is string');
        assert(typeof e.architectureKnown       === 'boolean', 'entry[' + i + '].architectureKnown is boolean');
        assert(typeof e.prototypePreviewEnabled === 'boolean', 'entry[' + i + '].prototypePreviewEnabled is boolean');
        assert(typeof e.previewRendererNotes    === 'string',  'entry[' + i + '].previewRendererNotes is string');
        assert('unsupportedReason' in e,                       'entry[' + i + '].unsupportedReason is present');
    });
    const a1 = KM.PrototypePreviewRegistry.all();
    const a2 = KM.PrototypePreviewRegistry.all();
    assert(a1 !== a2, 'all() returns a new array each call (no external mutation)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — Registry.get() by productTypeId
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — Registry.get() by productTypeId', function () {
    const KM = makeCtx();
    const mb = KM.PrototypePreviewRegistry.get('message-book');
    assert(mb !== null,                              'get(message-book) returns an entry');
    assert(mb.productTypeId === 'message-book',      'get(message-book).productTypeId matches');
    assert(mb.previewTypeId === 'message-book-preview', 'get(message-book).previewTypeId matches');

    const ids = [
        'message-book', 'framed-conversation-print', 'mug',
        'mini-keepsake-notebook', 'mini-message-sticker-pack', 'fridge-magnet'
    ];
    ids.forEach(function (id) {
        const e = KM.PrototypePreviewRegistry.get(id);
        assert(e !== null,               'get(' + id + ') returns an entry');
        assert(e.productTypeId === id,   'get(' + id + ').productTypeId matches');
    });

    assert(KM.PrototypePreviewRegistry.get('journal')     === null, 'get(journal) returns null (catalog-only, not a render planning target)');
    assert(KM.PrototypePreviewRegistry.get('sticker-pack') === null, 'get(sticker-pack) returns null');
    assert(KM.PrototypePreviewRegistry.get('wall-art')     === null, 'get(wall-art) returns null');
    assert(KM.PrototypePreviewRegistry.get('gift-wrap')    === null, 'get(gift-wrap) returns null');
    assert(KM.PrototypePreviewRegistry.get('unknown')      === null, 'get(unknown) returns null');
    assert(KM.PrototypePreviewRegistry.get('')             === null, 'get("") returns null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — Registry.getByPreviewTypeId()
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — Registry.getByPreviewTypeId()', function () {
    const KM = makeCtx();
    const mb = KM.PrototypePreviewRegistry.getByPreviewTypeId('message-book-preview');
    assert(mb !== null,                         'getByPreviewTypeId(message-book-preview) returns an entry');
    assert(mb.productTypeId === 'message-book', 'getByPreviewTypeId maps back to productTypeId');

    const previewIds = [
        'message-book-preview',
        'framed-conversation-print-preview',
        'mug-preview',
        'mini-keepsake-notebook-preview',
        'mini-message-sticker-pack-preview',
        'fridge-magnet-preview',
    ];
    previewIds.forEach(function (pid) {
        assert(KM.PrototypePreviewRegistry.getByPreviewTypeId(pid) !== null,
            'getByPreviewTypeId(' + pid + ') returns an entry');
    });

    assert(KM.PrototypePreviewRegistry.getByPreviewTypeId('unknown-preview') === null,
        'getByPreviewTypeId(unknown-preview) returns null');
    assert(KM.PrototypePreviewRegistry.getByPreviewTypeId('') === null,
        'getByPreviewTypeId("") returns null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — architectureKnown()
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — architectureKnown()', function () {
    const KM   = makeCtx();
    const list = KM.PrototypePreviewRegistry.architectureKnown();
    assert(Array.isArray(list), 'architectureKnown() returns an array');
    list.forEach(function (e) {
        assert(e.architectureKnown === true, e.productTypeId + ' has architectureKnown: true');
    });
    assert(list.length === 1, 'exactly 1 entry has architectureKnown: true (message-book only at this stage)');
    assert(list[0].productTypeId === 'message-book', 'architectureKnown()[0] is message-book');

    const notKnown = KM.PrototypePreviewRegistry.all().filter(function (e) { return !e.architectureKnown; });
    assert(notKnown.length === 5, '5 entries have architectureKnown: false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — prototypePreviewSupported()
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — prototypePreviewSupported()', function () {
    const KM   = makeCtx();
    const list = KM.PrototypePreviewRegistry.prototypePreviewSupported();
    assert(Array.isArray(list), 'prototypePreviewSupported() returns an array');
    list.forEach(function (e) {
        assert(e.prototypePreviewEnabled === true,
            e.productTypeId + ' has prototypePreviewEnabled: true');
    });
    assert(list.length === 1, 'exactly 1 entry has prototypePreviewEnabled: true (message-book only)');
    assert(list[0].productTypeId === 'message-book', 'prototypePreviewSupported()[0] is message-book');

    const unsupported = KM.PrototypePreviewRegistry.all().filter(function (e) { return !e.prototypePreviewEnabled; });
    assert(unsupported.length === 5, '5 entries have prototypePreviewEnabled: false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — Message Book entry is the only preview-ready entry
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — Message Book entry values', function () {
    const KM = makeCtx();
    const mb = KM.PrototypePreviewRegistry.get('message-book');
    assert(mb.prototypePreviewEnabled === true,              'message-book: prototypePreviewEnabled is true');
    assert(mb.architectureKnown       === true,              'message-book: architectureKnown is true');
    assert(mb.previewStatus           === KM.PREVIEW_STATUS.READY, 'message-book: previewStatus is READY');
    assert(mb.unsupportedReason       === null,              'message-book: unsupportedReason is null');
    assert(mb.previewTypeId           === 'message-book-preview', 'message-book: previewTypeId matches');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — Non-book render planning target entries have stub values
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — Non-book entries have correct stub values', function () {
    const KM = makeCtx();
    const nonBook = [
        'framed-conversation-print', 'mug', 'mini-keepsake-notebook',
        'mini-message-sticker-pack', 'fridge-magnet'
    ];
    nonBook.forEach(function (id) {
        const e = KM.PrototypePreviewRegistry.get(id);
        assert(e.prototypePreviewEnabled === false,
            id + ': prototypePreviewEnabled is false');
        assert(e.architectureKnown === false,
            id + ': architectureKnown is false');
        assert(e.previewStatus === KM.PREVIEW_STATUS.STUB,
            id + ': previewStatus is STUB');
        assert(e.unsupportedReason === 'renderer-not-implemented',
            id + ': unsupportedReason is renderer-not-implemented');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — All registry entries reference valid ProductRenderSpec IDs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — Registry entries reference valid ProductRenderSpec render planning target IDs', function () {
    const KM      = makeCtx();
    const rptIds  = KM.ProductRenderSpecs.renderPlanningTargets().map(function (s) { return s.productTypeId; });
    const entries = KM.PrototypePreviewRegistry.all();
    assert(entries.length === rptIds.length,
        'registry entry count equals render planning target count (' + rptIds.length + ')');
    entries.forEach(function (e) {
        assert(rptIds.indexOf(e.productTypeId) !== -1,
            'registry entry ' + e.productTypeId + ' has a matching ProductRenderSpec render planning target');
        const spec = KM.ProductRenderSpecs.get(e.productTypeId);
        assert(spec !== null,
            'ProductRenderSpecs.get(' + e.productTypeId + ') is not null');
        assert(spec.isRenderPlanningTarget === true,
            e.productTypeId + ': corresponding render spec has isRenderPlanningTarget: true');
    });
    rptIds.forEach(function (id) {
        assert(KM.PrototypePreviewRegistry.get(id) !== null,
            'ProductRenderSpec render planning target ' + id + ' has a registry entry');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — Resolver: unknown product type returns safe result
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — Resolver: unknown product type returns safe result', function () {
    const KM = makeCtx();
    const r  = KM.PrototypePreviewResolver.resolve('unknown-product');
    assert(r.resolved         === false,              'unknown: resolved is false');
    assert(r.previewSupported === false,              'unknown: previewSupported is false');
    assert(r.entry            === null,               'unknown: entry is null');
    assert(r.renderSpec       === null,               'unknown: renderSpec is null');
    assert(Array.isArray(r.blockers),                 'unknown: blockers is array');
    assert(r.blockers.indexOf('unknown-product-type') !== -1, 'unknown: blockers contains unknown-product-type');
    assert(r.memoryCount      === 0,                  'unknown: memoryCount is 0');
    assert(r.underMinRequired === false,              'unknown: underMinRequired is false');

    const r2 = KM.PrototypePreviewResolver.resolve('journal');
    assert(r2.resolved         === false,             'journal (catalog-only): resolved is false');
    assert(r2.previewSupported === false,             'journal: previewSupported is false');
    assert(r2.blockers.indexOf('unknown-product-type') !== -1, 'journal: unknown-product-type blocker');

    const r3 = KM.PrototypePreviewResolver.resolve('');
    assert(r3.resolved === false, 'empty string: resolved is false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — Resolver: message-book resolves with previewSupported: true
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — Resolver: message-book with adequate group resolves correctly', function () {
    const KM = makeCtx();

    function makeMsg(text) { return { text: text, sender: 'Alice', timestamp: Date.now() }; }

    const group5 = { messages: [makeMsg('a'), makeMsg('b'), makeMsg('c'), makeMsg('d'), makeMsg('e')] };
    const r = KM.PrototypePreviewResolver.resolve('message-book', group5);
    assert(r.resolved            === true,          'message-book(5 msgs): resolved is true');
    assert(r.previewSupported    === true,          'message-book(5 msgs): previewSupported is true');
    assert(r.blockers.length     === 0,             'message-book(5 msgs): no blockers');
    assert(r.memoryCount         === 5,             'message-book(5 msgs): memoryCount is 5');
    assert(r.underMinRequired    === false,         'message-book(5 msgs): underMinRequired is false');
    assert(r.entry  !== null,                      'message-book: entry is present');
    assert(r.renderSpec !== null,                  'message-book: renderSpec is present');
    assert(r.entry.productTypeId  === 'message-book', 'message-book: entry.productTypeId matches');
    assert(r.renderSpec.productTypeId === 'message-book', 'message-book: renderSpec.productTypeId matches');

    const r0 = KM.PrototypePreviewResolver.resolve('message-book', { messages: [] });
    assert(r0.resolved         === true,           'message-book(0 msgs): resolved is true');
    assert(r0.previewSupported === false,          'message-book(0 msgs): previewSupported is false (below min)');
    assert(r0.blockers.indexOf('below-minimum-memory-count') !== -1,
        'message-book(0 msgs): below-minimum-memory-count blocker');
    assert(r0.underMinRequired === true,           'message-book(0 msgs): underMinRequired is true');

    const rNull = KM.PrototypePreviewResolver.resolve('message-book', null);
    assert(rNull.previewSupported === false,       'message-book(null group): previewSupported is false');
    assert(rNull.blockers.indexOf('below-minimum-memory-count') !== -1,
        'message-book(null group): below-minimum-memory-count blocker');

    const attachGroup = { messages: [{ isAttachmentOnly: true }] };
    const rAtt = KM.PrototypePreviewResolver.resolve('message-book', attachGroup);
    assert(rAtt.hasAttachmentOnlyMessages === true, 'message-book: detects attachment-only messages');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — Resolver: non-book products have preview-not-supported blocker
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — Resolver: non-book products have preview-not-supported blocker', function () {
    const KM = makeCtx();
    const nonBook = [
        'framed-conversation-print', 'mug', 'mini-keepsake-notebook',
        'mini-message-sticker-pack', 'fridge-magnet'
    ];
    function msgs(n) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push({ text: 'msg' + i, sender: 'A' });
        return arr;
    }

    nonBook.forEach(function (id) {
        const r = KM.PrototypePreviewResolver.resolve(id, { messages: msgs(5) });
        assert(r.resolved         === true,  id + ': resolved is true (entry exists)');
        assert(r.previewSupported === false, id + ': previewSupported is false');
        assert(r.blockers.indexOf('preview-not-supported') !== -1,
            id + ': blockers contains preview-not-supported');
        assert(r.blockers.indexOf('engine-not-supported') !== -1,
            id + ': blockers contains engine-not-supported');
        assert(r.entry      !== null, id + ': entry is not null');
        assert(r.renderSpec !== null, id + ': renderSpec is not null');
    });

    const specsBefore = KM.ProductRenderSpecs.all().map(function (s) { return s.productTypeId; });
    KM.PrototypePreviewResolver.resolve('mug', { messages: msgs(3) });
    const specsAfter  = KM.ProductRenderSpecs.all().map(function (s) { return s.productTypeId; });
    assert(specsBefore.join(',') === specsAfter.join(','), 'resolve() does not mutate ProductRenderSpecs');

    const catBefore = KM.ProductCatalog.all().map(function (p) { return p.id; });
    KM.PrototypePreviewResolver.resolve('message-book', { messages: msgs(5) });
    const catAfter  = KM.ProductCatalog.all().map(function (p) { return p.id; });
    assert(catBefore.join(',') === catAfter.join(','), 'resolve() does not mutate ProductCatalog');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
