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
    load(ctx, 'src/core/import-quality-report.js');
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
// Helpers — build minimal NormalizedMemory-compatible objects for testing
// ─────────────────────────────────────────────────────────────────────────────

function mem(overrides) {
    return Object.assign({
        id:               'mem-test',
        sourcePlatformId: 'imessage',
        sourceAdapterId:  'imessage-chatdb-v1',
        type:             'message',
        timestamp:        '2023-03-15T10:00:00.000Z',
        sender:           'Alice',
        senderRole:       'contact',
        text:             'Hello',
        reactions:        [],
        media:            [],
        unsupported:      false,
        isAttachmentOnly: false
    }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.ImportQualityReport === 'object' && KM.ImportQualityReport !== null,
        'KMEngine.ImportQualityReport is an object');
    assert(typeof KM.ImportQualityReport.compute === 'function',
        'compute is a function');

    const r = KM.ImportQualityReport.compute([mem()]);
    assert(typeof r.totalMessages             === 'number', 'result.totalMessages is a number');
    assert(typeof r.dateRange                 === 'object', 'result.dateRange is an object');
    assert('first'    in r.dateRange,                       'dateRange.first present');
    assert('last'     in r.dateRange,                       'dateRange.last present');
    assert('spanDays' in r.dateRange,                       'dateRange.spanDays present');
    assert(typeof r.uniqueSenderCount         === 'number', 'uniqueSenderCount is a number');
    assert(Array.isArray(r.senderList),                     'senderList is an array');
    assert(typeof r.selfMessageCount          === 'number', 'selfMessageCount is a number');
    assert(typeof r.contactMessageCount       === 'number', 'contactMessageCount is a number');
    assert(typeof r.attachmentOnlyCount       === 'number', 'attachmentOnlyCount is a number');
    assert(typeof r.messagesWithReactionsCount === 'number','messagesWithReactionsCount is a number');
    assert(typeof r.totalReactionCount        === 'number', 'totalReactionCount is a number');
    assert('sourcePlatformId' in r,                         'sourcePlatformId present');
    assert(typeof r.messagesWithoutTimestamp  === 'number', 'messagesWithoutTimestamp is a number');
    assert(typeof r.messagesWithoutText       === 'number', 'messagesWithoutText is a number');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — empty / invalid input
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — empty and invalid input', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const empty = compute([]);
    assert(empty.totalMessages            === 0,    'empty array → totalMessages 0');
    assert(empty.dateRange.first          === null,  'empty → dateRange.first null');
    assert(empty.dateRange.last           === null,  'empty → dateRange.last null');
    assert(empty.dateRange.spanDays       === null,  'empty → dateRange.spanDays null');
    assert(empty.uniqueSenderCount        === 0,    'empty → uniqueSenderCount 0');
    assert(empty.senderList.length        === 0,    'empty → senderList empty');
    assert(empty.selfMessageCount         === 0,    'empty → selfMessageCount 0');
    assert(empty.contactMessageCount      === 0,    'empty → contactMessageCount 0');
    assert(empty.attachmentOnlyCount      === 0,    'empty → attachmentOnlyCount 0');
    assert(empty.totalReactionCount       === 0,    'empty → totalReactionCount 0');
    assert(empty.sourcePlatformId         === null,  'empty → sourcePlatformId null');

    // Non-array inputs
    let threw = false;
    try { compute(null); }      catch (e) { threw = true; }
    assert(!threw, 'compute(null) does not throw');

    threw = false;
    try { compute(undefined); } catch (e) { threw = true; }
    assert(!threw, 'compute(undefined) does not throw');

    threw = false;
    try { compute('bad'); }     catch (e) { threw = true; }
    assert(!threw, 'compute("bad") does not throw');

    const r = compute(null);
    assert(r.totalMessages === 0, 'compute(null) returns zero totalMessages');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — totalMessages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — totalMessages', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    assert(compute([mem()]).totalMessages               === 1, 'single message → 1');
    assert(compute([mem(), mem(), mem()]).totalMessages  === 3, 'three messages → 3');
    assert(compute([mem(), mem()]).totalMessages         === 2, 'two messages → 2');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — dateRange first, last, spanDays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — dateRange', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const single = compute([mem({ timestamp: '2023-01-15T10:00:00.000Z' })]);
    assert(single.dateRange.first    === '2023-01-15T10:00:00.000Z', 'single → first equals timestamp');
    assert(single.dateRange.last     === '2023-01-15T10:00:00.000Z', 'single → last equals timestamp');
    assert(single.dateRange.spanDays === 0,                           'single → spanDays 0');

    const multi = compute([
        mem({ timestamp: '2023-01-15T00:00:00.000Z' }),
        mem({ timestamp: '2023-04-15T00:00:00.000Z' }),
        mem({ timestamp: '2023-02-20T00:00:00.000Z' })
    ]);
    assert(multi.dateRange.first.startsWith('2023-01-15'), 'multi → first is earliest');
    assert(multi.dateRange.last.startsWith('2023-04-15'),  'multi → last is latest');
    assert(typeof multi.dateRange.spanDays === 'number' && multi.dateRange.spanDays > 0,
        'multi → spanDays is positive number');
    assert(multi.dateRange.spanDays === 90, 'Jan 15 to Apr 15 = 90 days');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — invalid and null timestamp handling
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — null and invalid timestamp handling', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const noTs = compute([mem({ timestamp: null })]);
    assert(noTs.messagesWithoutTimestamp === 1, 'null timestamp → counted in messagesWithoutTimestamp');
    assert(noTs.dateRange.first          === null, 'null timestamp → dateRange.first null');

    const badTs = compute([mem({ timestamp: 'not-a-date' })]);
    assert(badTs.messagesWithoutTimestamp === 1, 'invalid timestamp → counted in messagesWithoutTimestamp');
    assert(badTs.dateRange.first          === null, 'invalid timestamp → dateRange.first null');

    const mixed = compute([
        mem({ timestamp: '2023-01-15T00:00:00.000Z' }),
        mem({ timestamp: null }),
        mem({ timestamp: 'bad' }),
        mem({ timestamp: '2023-06-15T00:00:00.000Z' })
    ]);
    assert(mixed.messagesWithoutTimestamp === 2, 'mixed: 2 bad timestamps counted');
    assert(mixed.dateRange.first.startsWith('2023-01-15'), 'mixed: valid first date used');
    assert(mixed.dateRange.last.startsWith('2023-06-15'),  'mixed: valid last date used');
    assert(mixed.totalMessages === 4, 'mixed: all 4 counted in totalMessages regardless of timestamp');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — uniqueSenderCount and senderList
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — uniqueSenderCount and senderList', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const two = compute([
        mem({ sender: 'Alice' }),
        mem({ sender: 'Me',    senderRole: 'self' }),
        mem({ sender: 'Alice' }),
        mem({ sender: 'Me',    senderRole: 'self' })
    ]);
    assert(two.uniqueSenderCount === 2, 'two distinct senders → uniqueSenderCount 2');
    assert(two.senderList.length  === 2, 'senderList has 2 entries');
    assert(two.senderList[0]      === 'Alice', 'first seen sender is first in list');
    assert(two.senderList[1]      === 'Me',    'second seen sender is second in list');

    const one = compute([mem({ sender: 'Bob' }), mem({ sender: 'Bob' })]);
    assert(one.uniqueSenderCount === 1,    'duplicate sender deduped → uniqueSenderCount 1');
    assert(one.senderList[0]     === 'Bob', 'deduped senderList has one entry');

    // null sender does not appear in senderList
    const withNull = compute([mem({ sender: null }), mem({ sender: 'Carol' })]);
    assert(!withNull.senderList.includes(null), 'null sender not in senderList');
    assert(withNull.senderList.includes('Carol'), 'valid sender in senderList');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — selfMessageCount and contactMessageCount
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — selfMessageCount and contactMessageCount', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const r = compute([
        mem({ senderRole: 'self' }),
        mem({ senderRole: 'contact' }),
        mem({ senderRole: 'self' }),
        mem({ senderRole: 'contact' }),
        mem({ senderRole: 'contact' })
    ]);
    assert(r.selfMessageCount    === 2, 'selfMessageCount 2');
    assert(r.contactMessageCount === 3, 'contactMessageCount 3');
    assert(r.selfMessageCount + r.contactMessageCount === r.totalMessages,
        'self + contact = totalMessages');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — attachmentOnlyCount
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — attachmentOnlyCount', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const r = compute([
        mem({ isAttachmentOnly: true,  text: '[Attachment]' }),
        mem({ isAttachmentOnly: false, text: 'Hello' }),
        mem({ isAttachmentOnly: true,  text: '[Attachment]' })
    ]);
    assert(r.attachmentOnlyCount === 2, 'attachmentOnlyCount 2');

    const none = compute([mem({ isAttachmentOnly: false })]);
    assert(none.attachmentOnlyCount === 0, 'no attachments → 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — messagesWithReactionsCount and totalReactionCount
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — reactions', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const r = compute([
        mem({ reactions: [{ reactor: 'Alice', label: 'Loved', emoji: '❤️' }] }),
        mem({ reactions: [] }),
        mem({ reactions: [{ reactor: 'Me', label: 'Liked', emoji: '👍' },
                          { reactor: 'Bob', label: 'Laughed at', emoji: '😂' }] })
    ]);
    assert(r.messagesWithReactionsCount === 2, 'messagesWithReactionsCount 2');
    assert(r.totalReactionCount         === 3, 'totalReactionCount 3');

    const none = compute([mem({ reactions: [] }), mem({ reactions: [] })]);
    assert(none.messagesWithReactionsCount === 0, 'no reactions → messagesWithReactionsCount 0');
    assert(none.totalReactionCount         === 0, 'no reactions → totalReactionCount 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — sourcePlatformId
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — sourcePlatformId', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const r = compute([
        mem({ sourcePlatformId: 'imessage' }),
        mem({ sourcePlatformId: 'txt-export' })
    ]);
    assert(r.sourcePlatformId === 'imessage', 'sourcePlatformId from first memory');

    const txt = compute([mem({ sourcePlatformId: 'txt-export' })]);
    assert(txt.sourcePlatformId === 'txt-export', 'txt-export platform captured');

    const nullPlatform = compute([mem({ sourcePlatformId: null }), mem({ sourcePlatformId: 'imessage' })]);
    assert(nullPlatform.sourcePlatformId === 'imessage', 'null first → falls through to second');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — all-attachment corpus and messagesWithoutText
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — all-attachment corpus and messagesWithoutText', function () {
    const KM = makeCtx();
    const compute = KM.ImportQualityReport.compute;

    const allAttach = compute([
        mem({ isAttachmentOnly: true, text: '[Attachment]' }),
        mem({ isAttachmentOnly: true, text: '[Attachment]' }),
        mem({ isAttachmentOnly: true, text: '[Attachment]' })
    ]);
    assert(allAttach.attachmentOnlyCount === 3,    'all-attachment: attachmentOnlyCount 3');
    assert(allAttach.totalMessages       === 3,    'all-attachment: totalMessages 3');

    const noText = compute([
        mem({ text: null }),
        mem({ text: '' }),
        mem({ text: 'present' })
    ]);
    assert(noText.messagesWithoutText === 2, 'null and empty text counted in messagesWithoutText');

    // Empty text differs from '[Attachment]' — both are "without useful text" but
    // attachmentOnly is a separate signal
    const attachAndNullText = compute([
        mem({ isAttachmentOnly: true, text: '[Attachment]' }),
        mem({ isAttachmentOnly: false, text: null })
    ]);
    assert(attachAndNullText.attachmentOnlyCount === 1, 'attachmentOnly independent of text=null');
    assert(attachAndNullText.messagesWithoutText === 1,  'null text counted; [Attachment] text is not null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — semantic guard: no forbidden fields
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — semantic guard: no forbidden fields', function () {
    const KM = makeCtx();
    const r  = KM.ImportQualityReport.compute([mem()]);

    // No product readiness / proof / commerce / manufacturing fields
    assert(r.proofReady          === undefined, 'no proofReady');
    assert(r.commerceReady       === undefined, 'no commerceReady');
    assert(r.manufacturingReady  === undefined, 'no manufacturingReady');
    assert(r.exportReady         === undefined, 'no exportReady');
    assert(r.orderReady          === undefined, 'no orderReady');
    assert(r.checkoutReady       === undefined, 'no checkoutReady');
    assert(r.estimatedPages      === undefined, 'no estimatedPages');
    assert(r.estimatedVolumes    === undefined, 'no estimatedVolumes');
    assert(r.pdfReady            === undefined, 'no pdfReady');
    assert(r.vendorReady         === undefined, 'no vendorReady');
    assert(r.paymentReady        === undefined, 'no paymentReady');

    // Source file text check — "proof-ready" must not appear in implementation
    const src = readFileSync(
        join(__dirname, '../../src/core/import-quality-report.js'), 'utf8'
    );
    assert(!src.includes('proof-ready'),       'no "proof-ready" in implementation');
    assert(!src.includes('estimatedPages'),     'no "estimatedPages" in implementation');
    assert(!src.includes('estimatedVolumes'),   'no "estimatedVolumes" in implementation');
    assert(!src.includes('checkoutReady'),      'no "checkoutReady" in implementation');
    assert(!src.includes('manufacturingReady'), 'no "manufacturingReady" in implementation');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
