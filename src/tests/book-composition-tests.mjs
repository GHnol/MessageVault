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

// Load the composition engine alongside the 6A proof-preview contract so the
// page-limit consistency suite can exercise the real composition → over-limit →
// proof-gate path end to end.
function makeKM() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/book-composition.js');
    load(ctx, 'src/products/proof-preview-contract.js');
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

function eq(actual, expected, label) {
    assert(actual === expected, label + ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
}

function suite(name, fn) {
    console.log('\n' + name);
    fn();
}

// ── Deterministic page geometry for packing scenarios ────────────────────────
// Small budget so multi-page behaviour is reachable with tiny fixtures.
// RUN_MAX_LINES = pageLines - featuredHeaderLines = 6.
const CFG = { pageLines: 10, featuredHeaderLines: 4, continuationLines: 2 };

// ── Unit builders (mirror generateCompositionUnits output shape) ─────────────
function msg(text, reactions) {
    return reactions ? { text: text, reactions: reactions } : { text: text };
}
function runUnit(sender, messages, lines, sectionId, featured) {
    return {
        type: 'sender-run', lines: lines, atomic: true,
        run: { sender: sender, messages: messages },
        contactName: 'N', showTs: false,
        featured: !!featured, sectionId: sectionId
    };
}
function messageUnit(lines, sectionId, featured) {
    return { type: 'message', lines: lines, atomic: true, m: msg('x'),
             showTs: false, featured: !!featured, sectionId: sectionId };
}
function sectionHeader(displayName, sectionId, hasDivider) {
    return { type: 'section-header', lines: CFG.featuredHeaderLines + (hasDivider ? 1 : 0),
             hasDivider: !!hasDivider, keepWithNext: true,
             displayName: displayName, featured: false, sectionId: sectionId };
}
function featuredHeader(displayName, sectionId) {
    return { type: 'featured-header', lines: CFG.featuredHeaderLines, keepWithNext: true,
             displayName: displayName, featured: true, sectionId: sectionId };
}
const titlePage    = { type: 'title-page', alwaysOwnPage: true };
const dedicationPg = { type: 'dedication-page', alwaysOwnPage: true };
const endingPage   = { type: 'ending-page', alwaysOwnPage: true };
const forceBreak   = { type: 'force-page-break' };

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const BC = makeKM().BookComposition;
    assert(typeof BC === 'object' && BC !== null, 'KMEngine.BookComposition is an object');
    eq(BC.MODULE_VERSION, 'kmbc1', 'MODULE_VERSION is "kmbc1"');
    ['msgLineCount', 'runLineCount', 'groupIntoRuns', 'splitRunIntoChunks',
     'splitRunForPage', 'paginateUnits', 'enrichPageMetadata', 'computePageLimitStatus']
        .forEach(function (fn) {
            assert(typeof BC[fn] === 'function', fn + ' is a function');
        });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — line-cost helpers
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — line-cost helpers', function () {
    const BC = makeKM().BookComposition;

    eq(BC.msgLineCount({ text: '' }), 2, 'empty text → 2 (attachment placeholder)');
    eq(BC.msgLineCount({}), 2, 'missing text → 2');
    eq(BC.msgLineCount({ text: 'x' }), 2, '1 char → 1 textLine + gap = 2');
    eq(BC.msgLineCount({ text: 'a'.repeat(35) }), 2, '35 chars → 1 textLine + gap = 2');
    eq(BC.msgLineCount({ text: 'a'.repeat(36) }), 3, '36 chars → 2 textLines + gap = 3');
    eq(BC.msgLineCount({ text: 'hi', reactions: [{ emoji: '❤' }] }), 3, 'reactions add 1 line');

    eq(BC.runLineCount({ messages: [{ text: 'hi' }, { text: 'yo' }] }), 5,
        'runLineCount = 1 attribution + 2 + 2');

    const runs = BC.groupIntoRuns([{ sender: 'A' }, { sender: 'A' }, { sender: 'B' }]);
    eq(runs.length, 2, 'groupIntoRuns merges consecutive same-sender');
    eq(runs[0].messages.length, 2, 'first run has 2 messages');
    eq(runs[1].sender, 'B', 'second run is the other sender');
    eq(BC.groupIntoRuns([]).length, 0, 'groupIntoRuns([]) → []');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — empty / no-content state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — empty / no-content composition', function () {
    const BC = makeKM().BookComposition;
    eq(BC.paginateUnits([], CFG).length, 0, 'no units → no pages');

    const pages = BC.paginateUnits([messageUnit(3, 0)], CFG);
    eq(pages.length, 1, 'a single fitting message → 1 page');
    eq(pages[0].sectionId, 0, 'content sectionId tracked onto the page');
    eq(pages[0].isSectionStart, false, 'no header → not a section start');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — alwaysOwnPage isolation (opening / ending frontmatter+backmatter)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — alwaysOwnPage isolation', function () {
    const BC = makeKM().BookComposition;
    const pages = BC.paginateUnits([titlePage, messageUnit(3, 0), endingPage], CFG);
    eq(pages.length, 3, 'title + body + ending → 3 pages');
    eq(pages[0].units[0].type, 'title-page', 'page 1 is the title page');
    eq(pages[1].units[0].type, 'message', 'page 2 is the body content');
    eq(pages[2].units[0].type, 'ending-page', 'page 3 is the ending page');

    const dd = BC.paginateUnits([titlePage, dedicationPg, endingPage], CFG);
    eq(dd.length, 3, 'three alwaysOwnPage units → three isolated pages');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — one small section
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — one small section', function () {
    const BC = makeKM().BookComposition;
    const pages = BC.paginateUnits([sectionHeader('Sec A', 0), runUnit('A', [msg('hi')], 3, 0)], CFG);
    eq(pages.length, 1, 'header + small run fit on one page');
    eq(pages[0].isSectionStart, true, 'page opens the section');
    eq(pages[0].sectionId, 0, 'page carries the sectionId');
    eq(pages[0].sectionDisplayName, 'Sec A', 'page carries the section display name');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — multiple sections, order preserved
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — multiple sections preserve order', function () {
    const BC = makeKM().BookComposition;
    const pages = BC.paginateUnits([
        sectionHeader('Sec A', 0), runUnit('A', [msg('a')], 3, 0),
        sectionHeader('Sec B', 1), runUnit('B', [msg('b')], 3, 1)
    ], CFG);
    eq(pages.length, 2, 'two sections that cannot co-fit → two pages');
    eq(pages[0].sectionId, 0, 'first page is section 0');
    eq(pages[1].sectionId, 1, 'second page is section 1');
    eq(pages[0].sectionDisplayName, 'Sec A', 'section 0 label preserved');
    eq(pages[1].sectionDisplayName, 'Sec B', 'section 1 label preserved');
    assert(pages[0].isSectionStart && pages[1].isSectionStart, 'both pages are section starts');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — manual page break (force-page-break)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — force-page-break splits content', function () {
    const BC = makeKM().BookComposition;
    const pages = BC.paginateUnits([
        runUnit('A', [msg('a')], 3, 0), forceBreak, runUnit('B', [msg('b')], 3, 1)
    ], CFG);
    eq(pages.length, 2, 'explicit break forces a second page even when content would co-fit');
    eq(pages[0].units[0].run.sender, 'A', 'first page has run A');
    eq(pages[1].units[0].run.sender, 'B', 'second page has run B');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — section-spanning continuation injection
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — continuation injection on section-spanning pages', function () {
    const BC = makeKM().BookComposition;
    // header(5) + msg(3) fills to 8; second msg(3) tips to 11 → flush; third msg
    // opens a continuation page with an injected section-continuation unit.
    const pages = BC.paginateUnits([
        sectionHeader('Long', 0),
        messageUnit(3, 0), messageUnit(3, 0), messageUnit(3, 0)
    ], CFG);
    assert(pages.length >= 2, 'a section longer than one page spans multiple pages');
    const cont = pages[1];
    eq(cont.isSectionContinuation, true, 'continuation page flagged');
    eq(cont.units[0].type, 'section-continuation', 'continuation page opens with a cont unit');
    eq(cont.units[0].displayName, 'Long', 'continuation carries the section label');
    eq(cont.sectionId, 0, 'continuation stays in the same section');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — featured sections
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — featured sections carry the featured flag', function () {
    const BC = makeKM().BookComposition;
    const pages = BC.paginateUnits([featuredHeader('Fav', 0), runUnit('A', [msg('a')], 2, 0, true)], CFG);
    eq(pages.length, 1, 'featured header + small run on one page');
    eq(pages[0].featured, true, 'page marked featured');
    eq(pages[0].isSectionStart, true, 'featured page opens the section');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — run splitting (direct)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — splitRunIntoChunks / splitRunForPage', function () {
    const BC = makeKM().BookComposition;

    const big = runUnit('A', [msg('aa'), msg('bb'), msg('cc')], 7, 0); // runLineCount 7
    const chunks = BC.splitRunIntoChunks(big, 6);
    eq(chunks.length, 2, 'oversized run splits into 2 chunks at message boundaries');
    eq(chunks[0].isContinuation, false, 'first chunk is not a continuation');
    eq(chunks[1].isContinuation, true, 'second chunk is a continuation');

    const single = runUnit('A', [msg('only')], 2, 0);
    eq(BC.splitRunIntoChunks(single, 1).length, 1, 'single-message run is indivisible');

    const three = runUnit('A', [msg('a'), msg('b'), msg('c')], 4, 0); // each msg = 2 lines
    const fit = BC.splitRunForPage(three, 4); // attribution(1)+first(2)=3 fits, +next would be 5>4
    assert(fit.opening !== null && fit.continuation !== null, 'partial fit splits into opening+continuation');
    const none = BC.splitRunForPage(three, 1);
    assert(none.opening === null && none.continuation === three, 'nothing fits → all is continuation');
    const all = BC.splitRunForPage(three, 100);
    assert(all.opening === three && all.continuation === null, 'all fits → no continuation');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — oversized run is pre-split during pagination
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — pagination pre-splits oversized runs', function () {
    const BC = makeKM().BookComposition;
    // One run of runLineCount 7 > RUN_MAX_LINES(6): paginate must break it apart so
    // no single emitted run unit exceeds the safe max.
    const pages = BC.paginateUnits([runUnit('A', [msg('aa'), msg('bb'), msg('cc')], 7, 0)], CFG);
    const runUnits = [];
    pages.forEach(function (p) { p.units.forEach(function (u) { if (u.type === 'sender-run') runUnits.push(u); }); });
    assert(runUnits.length >= 2, 'oversized run emitted as multiple chunks');
    assert(runUnits.every(function (u) { return u.lines <= CFG.pageLines; }), 'no chunk exceeds the page budget');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — enrichPageMetadata
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — enrichPageMetadata', function () {
    const BC = makeKM().BookComposition;
    const pages = [
        { units: [{ type: 'title-page' }], featured: false },
        { units: [{ type: 'dedication-page' }], featured: false },
        { units: [{ type: 'sender-run' }, { type: 'message' }], featured: false, isSectionContinuation: true },
        { units: [{ type: 'ending-page' }], featured: false },
        { units: [{ type: 'section-header', hasDivider: true }, { type: 'message' }], featured: true },
        { units: [{ type: 'message' }], featured: false, isPaddingPage: true }
    ];
    const ret = BC.enrichPageMetadata(pages, { volumeId: 'vol-1', hasTimestamps: true, pageNumberVisible: false });

    assert(ret === pages, 'returns the same array (mutates in place)');
    eq(pages[0].physicalPageNumber, 1, 'physical page numbers are 1-based');
    eq(pages[0].rectoOrVerso, 'recto', 'page 1 is recto (odd)');
    eq(pages[1].rectoOrVerso, 'verso', 'page 2 is verso (even)');
    eq(pages[0].volumeId, 'vol-1', 'volumeId passthrough');
    eq(pages[0].hasTimestamps, true, 'hasTimestamps passthrough');
    eq(pages[0].pageNumberVisible, false, 'pageNumberVisible passthrough');

    eq(pages[0].logicalPageType, 'title-page', 'title-page type');
    eq(pages[1].logicalPageType, 'dedication-page', 'dedication-page type');
    eq(pages[2].logicalPageType, 'continuation-page', 'continuation-page type');
    eq(pages[3].logicalPageType, 'ending-page', 'ending-page type');
    eq(pages[4].logicalPageType, 'section-page', 'section-page type');
    eq(pages[5].logicalPageType, 'padding-page', 'padding-page type (priority over content)');

    eq(pages[2].messageCount, 2, 'messageCount counts message + sender-run units');
    eq(pages[4].hasDivider, true, 'hasDivider true when a section-header carries a divider');
    eq(pages[4].isFeatured, true, 'isFeatured mirrors page.featured');
    eq(pages[0].isPaddingPage, false, 'isPaddingPage defaults to false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — computePageLimitStatus
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — computePageLimitStatus', function () {
    const BC = makeKM().BookComposition;
    eq(BC.computePageLimitStatus({ pageCount: 3, maxPages: 10 }).exceedsPageLimit, false, 'under limit → false');
    eq(BC.computePageLimitStatus({ pageCount: 5, maxPages: 5 }).exceedsPageLimit, false, 'equal to limit → within (false)');
    eq(BC.computePageLimitStatus({ pageCount: 11, maxPages: 10 }).exceedsPageLimit, true, 'over limit → true');

    const s = BC.computePageLimitStatus({ pageCount: 7, maxPages: 4 });
    eq(s.pageCount, 7, 'echoes pageCount');
    eq(s.maxPages, 4, 'echoes maxPages');

    eq(BC.computePageLimitStatus({}).exceedsPageLimit, false, 'missing inputs → 0/0 → false');
    eq(BC.computePageLimitStatus({ pageCount: -3, maxPages: 1 }).pageCount, 0, 'negative pageCount clamped to 0');
    eq(BC.computePageLimitStatus(undefined).maxPages, 0, 'undefined input safe');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — composition → page-limit → 6A proof-preview contract consistency
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — page-limit status is consistent with the proof-preview contract', function () {
    const KM  = makeKM();
    const BC  = KM.BookComposition;
    const PPC = KM.ProofPreviewContract;

    // Five full-page messages → five real pages (page count from the paginator).
    const overUnits = [];
    for (let i = 0; i < 5; i++) overUnits.push(messageUnit(CFG.pageLines, 0));
    const pages = BC.paginateUnits(overUnits, CFG);
    eq(pages.length, 5, 'composition yields 5 physical pages');

    const over  = BC.computePageLimitStatus({ pageCount: pages.length, maxPages: 3 });
    const under = BC.computePageLimitStatus({ pageCount: pages.length, maxPages: 10 });
    eq(over.exceedsPageLimit, true, '5 pages over a 3-page limit');
    eq(under.exceedsPageLimit, false, '5 pages under a 10-page limit');

    // Over-limit blocks every actionable review phase (AC #4, #5, #7).
    eq(PPC.resolveProofPreviewPhase({ approvalStatus: 'none', hasContent: true,
        exceedsPageLimit: over.exceedsPageLimit, anyBookCheckFailed: false, allBookCheckPassed: true }),
        'not-ready-over-limit', 'none + over-limit → not-ready-over-limit');
    eq(PPC.resolveProofPreviewPhase({ approvalStatus: 'pending-review', exceedsPageLimit: over.exceedsPageLimit }),
        'not-ready-over-limit', 'pending-review + over-limit → not-ready-over-limit (Approve removed)');
    eq(PPC.resolveProofPreviewPhase({ approvalStatus: 'stale', exceedsPageLimit: over.exceedsPageLimit }),
        'not-ready-over-limit', 'stale + over-limit → not-ready-over-limit (re-review removed)');

    // Under-limit stays reviewable (AC #6) and reversible (AC #7).
    eq(PPC.resolveProofPreviewPhase({ approvalStatus: 'pending-review', exceedsPageLimit: under.exceedsPageLimit }),
        'pending-review', 'pending-review + under-limit → pending-review (Approve available)');
    eq(PPC.resolveProofPreviewPhase({ approvalStatus: 'none', hasContent: true,
        exceedsPageLimit: under.exceedsPageLimit, anyBookCheckFailed: false, allBookCheckPassed: true }),
        'ready', 'none + under-limit + checks pass → ready');

    assert(PPC.isReviewablePhase('not-ready-over-limit') === false, 'over-limit phase is not reviewable');
    assert(PPC.isReviewablePhase('ready') === true && PPC.isReviewablePhase('pending-review') === true,
        'ready and pending-review are reviewable');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — determinism and input purity
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — determinism and purity', function () {
    const BC = makeKM().BookComposition;
    const units = [
        sectionHeader('Sec A', 0), messageUnit(3, 0), messageUnit(3, 0), messageUnit(3, 0),
        sectionHeader('Sec B', 1), runUnit('B', [msg('a'), msg('b')], 5, 1)
    ];
    const before = JSON.stringify(units);
    const a = BC.paginateUnits(units, CFG);
    const b = BC.paginateUnits(units, CFG);
    assert(JSON.stringify(a) === JSON.stringify(b), 'same input → identical pages (deterministic)');
    assert(JSON.stringify(units) === before, 'paginateUnits does not mutate the input units');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — no commerce/production vocabulary in source (parity with 6A)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — source is free of commerce/production vocabulary', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/book-composition.js'),
        'utf8'
    ).toLowerCase();

    ['checkout', 'payment', 'order', 'commerce', 'manufacturing', 'vendor',
     'fulfillment', 'export', 'purchase'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'book-composition.js source does not reference "' + term + '"');
    });
    ['buy now', 'order now', 'add to cart', 'pay now', 'print now', 'production ready',
     'production-ready', 'print ready', 'print-ready', 'order ready', 'send to print',
     'send to vendor', 'submit to vendor'].forEach(function (cta) {
        assert(src.indexOf(cta) === -1, 'book-composition.js source contains no CTA "' + cta + '"');
    });

    // Purity: no DOM, no Date, no Math.random in the engine source.
    ['document.', 'createelement', 'appendchild', 'innerhtml', 'queryselector',
     'math.random', 'new date', 'date.now'].forEach(function (bad) {
        assert(src.indexOf(bad) === -1, 'book-composition.js source contains no "' + bad + '"');
    });
});

console.log('\n' + (failed === 0 ? 'PASS' : 'FAIL') + ' — ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
