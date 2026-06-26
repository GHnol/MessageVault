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
    ['msgLineCount', 'runLineCount', 'groupIntoRuns', 'generateUnits', 'splitRunIntoChunks',
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
    const rawSrc = readFileSync(
        join(__dirname, '../../src/products/book-composition.js'),
        'utf8'
    ).toLowerCase();

    // `orderIndex` is the section sort-key field on messageBookState (a sequence
    // position, not commerce vocabulary). Neutralize the identifier before the
    // bare-term scan so it does not false-positive on "order"; a standalone
    // commerce "order" (e.g. "place an order") is still rejected.
    const src = rawSrc.replace(/orderindex/g, 'seqindex');

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

// ═════════════════════════════════════════════════════════════════════════════
// generateUnits (6C) — composition-unit generation golden coverage
// ═════════════════════════════════════════════════════════════════════════════
// The 6C extraction. Deterministic injected deps make the app-coupled bits — the
// editorial text normalizers and the keepsake-group display-name fallback —
// observable in isolation. The line weights mirror the real scope-guarded
// pagination constants (BOOK_HEADER_LINES/BOOK_DIVIDER_LINES/BOOK_FEATURED_HEADER_LINES).
const GEN_CFG = {
    headerLines:         4,
    dividerLines:        3,
    featuredHeaderLines: 8,
    // Mirrors bookEditorial.normalizeSingleLine: collapses ALL internal whitespace.
    normalizeSingleLine: function (t) {
        return String(t == null ? '' : t).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    },
    // Mirrors bookEditorial.normalizeDedication: trims; collapses 3+ blank lines.
    normalizeDedication: function (t) {
        return String(t == null ? '' : t).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    },
    // Mirrors keepsakeGroups.find(...) -> getGroupDisplayName(...); '' when unresolved.
    resolveGroupDisplayName: function (id) {
        return ({ g1: 'Keepsake Set 1', g2: 'Keepsake Set 2' })[id] || '';
    }
};

function mkState(overrides) {
    return Object.assign({
        activeVolumeId: 'v1',
        volumes: [{ id: 'v1', name: 'Volume 1' }],
        sections: [],
        opening: { dedicationEnabled: false, dedicationText: '', title: '' },
        body: { timestampMode: 'off', dividerMode: 'off', endingMode: 'plain', pageNumberMode: 'off' }
    }, overrides || {});
}

function mkSection(overrides) {
    return Object.assign({
        volumeId: 'v1', included: true, orderIndex: 0,
        featured: false, forcePageBreakBefore: false,
        sourceGroupId: null, customTitle: '', customName: '',
        preserveSameSenderRuns: false, messages: []
    }, overrides || {});
}

function types(units)      { return units.map(function (u) { return u.type; }); }
function ofType(units, t)  { return units.filter(function (u) { return u.type === t; }); }

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — generateUnits frontmatter & backmatter (title / dedication / ending)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — generateUnits frontmatter & backmatter', function () {
    const BC = makeKM().BookComposition;

    // Empty state → just the title page.
    const empty = BC.generateUnits(mkState(), 'Ada', GEN_CFG);
    eq(empty.length, 1, 'empty state → only the title page');
    eq(empty[0].type, 'title-page', 'first unit is the title page');
    eq(empty[0].alwaysOwnPage, true, 'title page is alwaysOwnPage');
    eq(empty[0].contactName, 'Ada', 'title page carries the contactName');
    assert(Array.isArray(empty[0].volumeSections) && empty[0].volumeSections.length === 0,
        'title page carries the (empty) volumeSections');
    assert(empty[0].state && empty[0].state.body, 'title page carries the state reference');

    // No config → still total and safe (defaults applied), title page present.
    const noCfg = BC.generateUnits(mkState(), 'Ada');
    eq(noCfg.length, 1, 'no config → defaults applied, still produces the title page');
    eq(noCfg[0].type, 'title-page', 'no-config path still yields the title page');

    // Dedication enabled + real text → dedication page right after the title.
    const ded = BC.generateUnits(mkState({
        opening: { dedicationEnabled: true, dedicationText: '  For you  ', title: '' }
    }), 'Ada', GEN_CFG);
    eq(types(ded)[1], 'dedication-page', 'enabled non-empty dedication → dedication page after title');
    eq(ded[1].alwaysOwnPage, true, 'dedication page is alwaysOwnPage');

    // Enabled but whitespace-only → normalizeDedication empties it → no page.
    const dedBlank = BC.generateUnits(mkState({
        opening: { dedicationEnabled: true, dedicationText: '   \n\n   ', title: '' }
    }), 'Ada', GEN_CFG);
    eq(ofType(dedBlank, 'dedication-page').length, 0, 'whitespace-only dedication → no dedication page');

    // Disabled → no page even with text present.
    const dedOff = BC.generateUnits(mkState({
        opening: { dedicationEnabled: false, dedicationText: 'For you', title: '' }
    }), 'Ada', GEN_CFG);
    eq(ofType(dedOff, 'dedication-page').length, 0, 'disabled dedication → no dedication page');

    // Branded ending → ending page last; plain → none.
    const branded = BC.generateUnits(mkState({
        body: { timestampMode: 'off', dividerMode: 'off', endingMode: 'branded', pageNumberMode: 'off' }
    }), 'Ada', GEN_CFG);
    const bt = types(branded);
    eq(bt[bt.length - 1], 'ending-page', 'branded ending → ending page is last');
    eq(branded[branded.length - 1].alwaysOwnPage, true, 'ending page is alwaysOwnPage');

    const plain = BC.generateUnits(mkState({
        body: { timestampMode: 'off', dividerMode: 'off', endingMode: 'plain', pageNumberMode: 'off' }
    }), 'Ada', GEN_CFG);
    eq(ofType(plain, 'ending-page').length, 0, 'plain ending → no ending page');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — section ordering, included & volume filters, sectionId basing
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — section ordering, included & volume filters', function () {
    const BC = makeKM().BookComposition;

    const state = mkState({
        sections: [
            mkSection({ orderIndex: 2, customName: 'C', messages: [{ sender: 'A', text: 'c' }] }),
            mkSection({ orderIndex: 0, customName: 'A', messages: [{ sender: 'A', text: 'a' }] }),
            mkSection({ orderIndex: 1, customName: 'B', messages: [{ sender: 'A', text: 'b' }] }),
            mkSection({ orderIndex: 3, included: false, customName: 'X', messages: [{ sender: 'A', text: 'x' }] }),
            mkSection({ orderIndex: 4, volumeId: 'v2', customName: 'Y', messages: [{ sender: 'A', text: 'y' }] })
        ]
    });
    const units = BC.generateUnits(state, 'N', GEN_CFG);

    const headers = ofType(units, 'section-header').map(function (u) { return u.displayName; });
    eq(headers.join(','), 'A,B,C', 'sections emitted in orderIndex order; excluded & other-volume dropped');

    const headerUnits = ofType(units, 'section-header');
    eq(headerUnits[0].sectionId, 0, 'first emitted section has sectionId 0');
    eq(headerUnits[1].sectionId, 1, 'second emitted section has sectionId 1');
    eq(headerUnits[2].sectionId, 2, 'third emitted section has sectionId 2 (positional, not orderIndex)');

    const msgs = ofType(units, 'message');
    eq(msgs.map(function (m) { return m.m.text; }).join(','), 'a,b,c', 'messages follow section order');
    eq(msgs[0].sectionId, 0, 'message a belongs to section 0');
    eq(msgs[2].sectionId, 2, 'message c belongs to section 2');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — display-name resolution priority (title > name > group fallback)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — display-name resolution priority', function () {
    const BC = makeKM().BookComposition;

    // customTitle wins and is routed through normalizeSingleLine (internal whitespace collapses).
    const t = BC.generateUnits(mkState({
        sections: [mkSection({ customTitle: '  Our   First\nChapter ', customName: 'ignored', sourceGroupId: 'g1', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(t, 'section-header')[0].displayName, 'Our First Chapter',
        'customTitle wins and is normalized (internal whitespace collapsed)');

    // customName (no customTitle) is trimmed only — internal double space survives.
    const n = BC.generateUnits(mkState({
        sections: [mkSection({ customName: '  Keep  Spaces  ', sourceGroupId: 'g1', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(n, 'section-header')[0].displayName, 'Keep  Spaces',
        'customName is trimmed only (distinct from normalizeSingleLine)');

    // Neither custom field → resolveGroupDisplayName fallback.
    const g = BC.generateUnits(mkState({
        sections: [mkSection({ sourceGroupId: 'g2', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(g, 'section-header')[0].displayName, 'Keepsake Set 2', 'falls back to resolveGroupDisplayName');

    // Unresolved group + no custom → '' → no header unit, content still emitted.
    const u = BC.generateUnits(mkState({
        sections: [mkSection({ sourceGroupId: 'missing', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(u, 'section-header').length, 0, 'no resolvable name → no section-header emitted');
    eq(ofType(u, 'message').length, 1, 'content still emitted even without a header');
    eq(ofType(u, 'message')[0].sectionId, 0, 'header-less content still carries its sectionId');

    // Whitespace-only customTitle is treated as absent → next priority (customName).
    const wsTitle = BC.generateUnits(mkState({
        sections: [mkSection({ customTitle: '   ', customName: 'Fallback', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(wsTitle, 'section-header')[0].displayName, 'Fallback',
        'whitespace-only customTitle skipped in favor of customName');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — section-header vs featured-header and line weights
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 20 — section-header vs featured-header and line weights', function () {
    const BC = makeKM().BookComposition;

    // Non-featured first section: section-header, no divider, header weight only.
    const plain = BC.generateUnits(mkState({
        sections: [mkSection({ customName: 'Sec', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    const sh = ofType(plain, 'section-header')[0];
    eq(sh.lines, GEN_CFG.headerLines, 'section-header line weight = headerLines (no divider)');
    eq(sh.hasDivider, false, 'no divider on a first non-sparse section');
    eq(sh.keepWithNext, true, 'section-header keepWithNext');
    eq(sh.featured, false, 'section-header not featured');
    eq(types(plain).indexOf('force-page-break'), -1, 'non-featured first section emits no page break');

    // Featured section: featured-header (featured weight) preceded by a force-page-break — even first.
    const feat = BC.generateUnits(mkState({
        sections: [mkSection({ featured: true, customName: 'Fav', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(types(feat)[1], 'force-page-break', 'featured section is preceded by a force-page-break (even first)');
    const fh = ofType(feat, 'featured-header')[0];
    assert(fh, 'featured section emits a featured-header');
    eq(fh.lines, GEN_CFG.featuredHeaderLines, 'featured-header weight = featuredHeaderLines');
    eq(fh.featured, true, 'featured-header carries the featured flag');
    eq(fh.keepWithNext, true, 'featured-header keepWithNext');
    eq(ofType(feat, 'section-header').length, 0, 'featured section emits no plain section-header');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 21 — sparse dividers (bound / standalone / featured-excluded)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 21 — sparse dividers', function () {
    const BC = makeKM().BookComposition;
    const sparseBody = { timestampMode: 'off', dividerMode: 'sparse', endingMode: 'plain', pageNumberMode: 'off' };

    // First section (si=0) gets no divider; the second binds the divider into its header.
    const two = BC.generateUnits(mkState({
        body: sparseBody,
        sections: [
            mkSection({ orderIndex: 0, customName: 'A', messages: [{ sender: 'A', text: 'a' }] }),
            mkSection({ orderIndex: 1, customName: 'B', messages: [{ sender: 'A', text: 'b' }] })
        ]
    }), 'N', GEN_CFG);
    const hs = ofType(two, 'section-header');
    eq(hs[0].hasDivider, false, 'first section (si=0) has no sparse divider');
    eq(hs[0].lines, GEN_CFG.headerLines, 'first header weight excludes divider');
    eq(hs[1].hasDivider, true, 'second section binds a sparse divider into its header');
    eq(hs[1].lines, GEN_CFG.headerLines + GEN_CFG.dividerLines, 'second header weight includes divider');
    eq(ofType(two, 'divider').length, 0, 'bound divider is not a standalone divider unit');

    // Second section with NO resolvable name under sparse → standalone divider unit, no header.
    const noName = BC.generateUnits(mkState({
        body: sparseBody,
        sections: [
            mkSection({ orderIndex: 0, customName: 'A', messages: [{ sender: 'A', text: 'a' }] }),
            mkSection({ orderIndex: 1, sourceGroupId: 'missing', messages: [{ sender: 'A', text: 'b' }] })
        ]
    }), 'N', GEN_CFG);
    const dv = ofType(noName, 'divider');
    eq(dv.length, 1, 'header-less sparse section emits a standalone divider');
    eq(dv[0].lines, GEN_CFG.dividerLines, 'standalone divider weight = dividerLines');

    // Featured second section under sparse → no divider (featured excluded); page break + featured-header.
    const featSparse = BC.generateUnits(mkState({
        body: sparseBody,
        sections: [
            mkSection({ orderIndex: 0, customName: 'A', messages: [{ sender: 'A', text: 'a' }] }),
            mkSection({ orderIndex: 1, featured: true, customName: 'Fav', messages: [{ sender: 'A', text: 'b' }] })
        ]
    }), 'N', GEN_CFG);
    eq(ofType(featSparse, 'divider').length, 0, 'featured section takes a page break, not a sparse divider');
    eq(ofType(featSparse, 'featured-header').length, 1, 'featured section emits a featured-header under sparse');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 22 — forced page breaks
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 22 — forced page breaks', function () {
    const BC = makeKM().BookComposition;

    // forcePageBreakBefore on a later section → force-page-break before it; no sparse divider on it.
    const forced = BC.generateUnits(mkState({
        body: { timestampMode: 'off', dividerMode: 'sparse', endingMode: 'plain', pageNumberMode: 'off' },
        sections: [
            mkSection({ orderIndex: 0, customName: 'A', messages: [{ sender: 'A', text: 'a' }] }),
            mkSection({ orderIndex: 1, forcePageBreakBefore: true, customName: 'B', messages: [{ sender: 'A', text: 'b' }] })
        ]
    }), 'N', GEN_CFG);
    eq(ofType(forced, 'force-page-break').length, 1, 'second section emits a force-page-break');
    const bHeader = ofType(forced, 'section-header').filter(function (u) { return u.displayName === 'B'; })[0];
    eq(bHeader.hasDivider, false, 'forced-break section does not also get a sparse divider');
    eq(bHeader.lines, GEN_CFG.headerLines, 'forced-break section header weight excludes divider');

    // forcePageBreakBefore on the FIRST section (si=0) → no break (guarded by si>0).
    const firstForced = BC.generateUnits(mkState({
        sections: [mkSection({ orderIndex: 0, forcePageBreakBefore: true, customName: 'A', messages: [{ sender: 'A', text: 'a' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(firstForced, 'force-page-break').length, 0, 'first section never emits a leading page break');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 23 — messages vs sender-runs, order, showTs, featured propagation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 23 — messages vs sender-runs, order & flags', function () {
    const BC = makeKM().BookComposition;

    const msgs = [
        { sender: 'A', text: 'one' }, { sender: 'A', text: 'two' }, { sender: 'B', text: 'three' }
    ];

    // preserveSameSenderRuns=false → one message unit per message, order preserved, showTs from body.
    const flat = BC.generateUnits(mkState({
        body: { timestampMode: 'on', dividerMode: 'off', endingMode: 'plain', pageNumberMode: 'off' },
        sections: [mkSection({ customName: 'S', preserveSameSenderRuns: false, messages: msgs })]
    }), 'N', GEN_CFG);
    const mu = ofType(flat, 'message');
    eq(mu.length, 3, 'one message unit per message');
    eq(mu.map(function (u) { return u.m.text; }).join(','), 'one,two,three', 'message order preserved');
    eq(mu[0].lines, BC.msgLineCount(msgs[0]), 'message line cost from msgLineCount');
    eq(mu[0].atomic, true, 'message unit is atomic');
    eq(mu[0].showTs, true, 'timestampMode on → showTs true');
    eq(mu[0].sectionId, 0, 'message carries the sectionId');

    // preserveSameSenderRuns=true → grouped runs; consecutive A merged, then B.
    const runs = BC.generateUnits(mkState({
        body: { timestampMode: 'off', dividerMode: 'off', endingMode: 'plain', pageNumberMode: 'off' },
        sections: [mkSection({ customName: 'S', preserveSameSenderRuns: true, messages: msgs })]
    }), 'N', GEN_CFG);
    const ru = ofType(runs, 'sender-run');
    eq(ru.length, 2, 'consecutive same-sender messages merged into runs');
    eq(ru[0].run.sender, 'A', 'first run is sender A');
    eq(ru[0].run.messages.length, 2, 'first run holds both A messages');
    eq(ru[1].run.sender, 'B', 'second run is sender B');
    eq(ru[0].lines, BC.runLineCount(ru[0].run), 'run line cost from runLineCount');
    eq(ru[0].showTs, false, 'timestampMode off → showTs false');

    // Featured section propagates its featured flag onto content units.
    const feat = BC.generateUnits(mkState({
        sections: [mkSection({ featured: true, customName: 'F', messages: [{ sender: 'A', text: 'x' }] })]
    }), 'N', GEN_CFG);
    eq(ofType(feat, 'message')[0].featured, true, 'featured flag propagates to content units');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 24 — multi-volume assignment (active-volume scoping, sectionId re-basing)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 24 — multi-volume assignment', function () {
    const BC = makeKM().BookComposition;

    const base = {
        volumes: [{ id: 'v1', name: 'Volume 1' }, { id: 'v2', name: 'Volume 2' }],
        sections: [
            mkSection({ volumeId: 'v1', orderIndex: 0, customName: 'V1-A', messages: [{ sender: 'A', text: 'a' }] }),
            mkSection({ volumeId: 'v2', orderIndex: 0, customName: 'V2-A', messages: [{ sender: 'A', text: 'b' }] }),
            mkSection({ volumeId: 'v2', orderIndex: 1, customName: 'V2-B', messages: [{ sender: 'A', text: 'c' }] })
        ]
    };

    const v1 = BC.generateUnits(mkState(Object.assign({ activeVolumeId: 'v1' }, base)), 'N', GEN_CFG);
    eq(ofType(v1, 'section-header').map(function (u) { return u.displayName; }).join(','), 'V1-A',
        'active volume v1 yields only v1 sections');

    const v2 = BC.generateUnits(mkState(Object.assign({ activeVolumeId: 'v2' }, base)), 'N', GEN_CFG);
    eq(ofType(v2, 'section-header').map(function (u) { return u.displayName; }).join(','), 'V2-A,V2-B',
        'active volume v2 yields only v2 sections, in order');
    eq(ofType(v2, 'section-header')[0].sectionId, 0, 'first v2 section is sectionId 0 (re-based per volume)');
    eq(ofType(v2, 'section-header')[1].sectionId, 1, 'second v2 section is sectionId 1');
    eq(v2[0].volumeSections.length, 2, 'title page volumeSections scoped to the active volume');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 25 — determinism, purity (no state mutation), and pipeline integration
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 25 — determinism, purity & pipeline integration', function () {
    const BC = makeKM().BookComposition;

    const state = mkState({
        body: { timestampMode: 'off', dividerMode: 'sparse', endingMode: 'branded', pageNumberMode: 'off' },
        opening: { dedicationEnabled: true, dedicationText: 'For N', title: 'Title' },
        sections: [
            mkSection({ orderIndex: 0, customName: 'A', preserveSameSenderRuns: true, messages: [{ sender: 'A', text: 'a' }, { sender: 'A', text: 'b' }] }),
            mkSection({ orderIndex: 1, featured: true, customTitle: 'Fav', messages: [{ sender: 'B', text: 'c' }] })
        ]
    });

    const before = JSON.stringify(state);
    const a = BC.generateUnits(state, 'N', GEN_CFG);
    const b = BC.generateUnits(state, 'N', GEN_CFG);
    eq(JSON.stringify(state), before, 'generateUnits does not mutate the input state');
    assert(JSON.stringify(a) === JSON.stringify(b), 'same state → identical units (deterministic)');

    // Generated units feed paginateUnits unchanged → real pages; frontmatter stays isolated.
    const pages = BC.paginateUnits(a, CFG);
    assert(pages.length >= 1, 'generated units paginate into at least one page');
    eq(pages[0].units[0].type, 'title-page', 'first page is the title page (frontmatter isolated)');

    // The page-limit bridge consumes the real page count.
    const status = BC.computePageLimitStatus({ pageCount: pages.length, maxPages: 1 });
    eq(status.exceedsPageLimit, pages.length > 1, 'computePageLimitStatus consistent with the real page count');
});

console.log('\n' + (failed === 0 ? 'PASS' : 'FAIL') + ' — ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
