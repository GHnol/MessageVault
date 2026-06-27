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

// MessageBookSpineInputs is a pure function of its inputs and references no sibling
// module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-spine-inputs.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the REAL 8G render-environment contract that the
// 8H spine/cover feed flows into.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-spine-inputs.js');
    load(ctx, 'src/products/message-book-render-environment.js');
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

// A faithful, in-test mirror of the live BOOK_PRODUCTION_DEPS internal direction
// (index.html, scope-guarded). Used to prove resolveFromContext derives the internal
// stock/binding direction as known from real repo truth without importing index.html.
const LIVE_PRODUCTION_DIRECTION = {
    STOCK:   'matte-premium-text',
    BINDING: 'casebound-hardcover'
};

// The live captured production-dependency truth (captureBookRenderSpec.productionDependencies):
// interior page count is real, but cover is blocked and stock/binding are unconfirmed.
const LIVE_PRODUCTION_DEPS = {
    interiorPageCountConfirmed: true,
    coverGenerationBlocked:     true,
    spineWidthKnown:            false,
    stockConfirmed:             false,
    bindingConfirmed:           false
};

// A faithful in-test mirror of the live BOOK_PRODUCTION_DEPS / BOOK_PARITY geometry,
// used by the 8G integration suite (so the only honestly-missing inputs there are the
// 8H-owned spine/cover ones plus font/emoji).
const LIVE_GEOMETRY = {
    TRIM_IN:        { w: 7, h: 10 },
    BLEED_IN:       0.125,
    SAFE_INSET_IN:  0.125,
    MARGINS_IN:     { inner: 0.875, outer: 0.75, top: 0.75, bottom: 0.75 },
    BINDING:        'casebound-hardcover',
    PDF_SPEC:       'PDF/X-4',
    STOCK:          'matte-premium-text',
    EMOJI_STRATEGY: 'print-safe-set'
};
const LIVE_PARITY = { MODULUS: 2 };

// Every material/vendor fact genuinely supplied — the hypothetical confirmed path. The
// live repo keeps the vendor confirmations + thicknesses missing (Suites 9/12/13).
const ALL_KNOWN = {
    internalStockDirectionKnown:   true,
    internalBindingDirectionKnown: true,
    stockConfirmed:                true,
    bindingConfirmed:              true,
    paperThicknessPerLeafIn:       0.004,
    boardThicknessIn:              0.118,
    pageCount:                     120,
    coverGenerationBlocked:        false
};
// Spine width for ALL_KNOWN: 120 * 0.004 + 0.118 = 0.598.
const ALL_KNOWN_SPINE_WIDTH = 0.598;

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    assert(typeof SI === 'object' && SI !== null, 'KMEngine.MessageBookSpineInputs is an object');
    assert(SI.CONTRACT_VERSION === 'kmsi1', 'CONTRACT_VERSION is "kmsi1"');
    assert(SI.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(typeof SI.LEVEL === 'object' && SI.LEVEL !== null, 'LEVEL is an object');
    assert(typeof SI.STATE === 'object' && SI.STATE !== null, 'STATE is an object');
    assert(typeof SI.BLOCKER === 'object' && SI.BLOCKER !== null, 'BLOCKER is an object');
    assert(Array.isArray(SI.BLOCKER_ORDER), 'BLOCKER_ORDER is an array');
    assert(Array.isArray(SI.REQUIRED_INPUTS), 'REQUIRED_INPUTS is an array');
    assert(typeof SI.STATUS_TONE === 'object' && SI.STATUS_TONE !== null, 'STATUS_TONE is an object');
    assert(SI.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof SI.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof SI.evaluate === 'function', 'evaluate is a function');
    assert(typeof SI.resolveFromContext === 'function', 'resolveFromContext is a function');
    assert(typeof SI.toRenderEnvironmentInput === 'function', 'toRenderEnvironmentInput is a function');
    assert(typeof SI.describeReadiness === 'function', 'describeReadiness is a function');
    assert(typeof SI.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — LEVEL / STATE / BLOCKER constants + frozen
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — constants', function () {
    const SI = makeCtx().MessageBookSpineInputs;
    const L = SI.LEVEL, S = SI.STATE, B = SI.BLOCKER;

    assert(L.SPINE_INPUTS_CONTRACT_KNOWN === 'spine-inputs-contract-known', 'LEVEL contract-known');
    assert(L.SPINE_INPUTS_KNOWN === 'spine-inputs-known', 'LEVEL spine-inputs-known');

    assert(S.INTERNAL_STOCK_DIRECTION_KNOWN === 'internal-stock-direction-known', 'STATE internal stock direction');
    assert(S.STOCK_CONFIRMED === 'stock-confirmed', 'STATE stock-confirmed');
    assert(S.INTERNAL_BINDING_DIRECTION_KNOWN === 'internal-binding-direction-known', 'STATE internal binding direction');
    assert(S.BINDING_CONFIRMED === 'binding-confirmed', 'STATE binding-confirmed');
    assert(S.PAPER_THICKNESS_KNOWN === 'paper-thickness-known', 'STATE paper-thickness');
    assert(S.BOARD_THICKNESS_KNOWN === 'board-thickness-known', 'STATE board-thickness');
    assert(S.PAGE_COUNT_KNOWN === 'page-count-known', 'STATE page-count');
    assert(S.SPINE_WIDTH_COMPUTABLE === 'spine-width-computable', 'STATE spine-width-computable');
    assert(S.COVER_UNBLOCKED === 'cover-unblocked', 'STATE cover-unblocked');

    assert(B.STOCK_CONFIRMATION_MISSING === 'stock-confirmation-missing', 'BLOCKER stock-confirmation');
    assert(B.BINDING_CONFIRMATION_MISSING === 'binding-confirmation-missing', 'BLOCKER binding-confirmation');
    assert(B.PAPER_THICKNESS_MISSING === 'paper-thickness-missing', 'BLOCKER paper-thickness');
    assert(B.BOARD_THICKNESS_MISSING === 'board-thickness-missing', 'BLOCKER board-thickness');
    assert(B.PAGE_COUNT_MISSING === 'page-count-missing', 'BLOCKER page-count');
    assert(B.SPINE_WIDTH_NOT_COMPUTABLE === 'spine-width-not-computable', 'BLOCKER spine-width-not-computable');
    assert(B.COVER_STILL_BLOCKED === 'cover-still-blocked', 'BLOCKER cover-still-blocked');

    // BLOCKER_ORDER covers every BLOCKER exactly once, stock first, cover last.
    assert(SI.BLOCKER_ORDER.length === Object.keys(B).length, 'BLOCKER_ORDER lists every blocker');
    assert(SI.BLOCKER_ORDER[0] === B.STOCK_CONFIRMATION_MISSING, 'BLOCKER_ORDER starts with stock-confirmation-missing');
    assert(SI.BLOCKER_ORDER[SI.BLOCKER_ORDER.length - 1] === B.COVER_STILL_BLOCKED, 'BLOCKER_ORDER ends with cover-still-blocked');

    // Frozen enums.
    assert(Object.isFrozen(L) && Object.isFrozen(S) && Object.isFrozen(B), 'LEVEL/STATE/BLOCKER frozen');
    assert(Object.isFrozen(SI.BLOCKER_ORDER) && Object.isFrozen(SI.REQUIRED_INPUTS), 'BLOCKER_ORDER/REQUIRED_INPUTS frozen');
    assert(SI.REQUIRED_INPUTS.length === Object.keys(S).length, 'REQUIRED_INPUTS one per state');

    // Every blocker has a safe non-empty message.
    Object.keys(B).forEach(function (k) {
        assert(typeof SI.blockerMessage(B[k]) === 'string' && SI.blockerMessage(B[k]).length > 0, 'message for ' + B[k]);
    });
    assert(SI.blockerMessage('nope') === '', 'unknown blocker → empty string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — evaluate: no inputs known → every blocker, stock-confirmation primary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — no inputs known', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    [SI.evaluate(), SI.evaluate(null), SI.evaluate({})].forEach(function (r, idx) {
        assert(r.spineInputsContractKnown === true, '#' + idx + ' contract is the floor (always known)');
        assert(r.allInputsConfirmed === false, '#' + idx + ' aggregate false with nothing supplied');
        assert(r.blockers.length === SI.BLOCKER_ORDER.length, '#' + idx + ' every blocker present');
        assert(r.primaryBlocker === SI.BLOCKER.STOCK_CONFIRMATION_MISSING, '#' + idx + ' primary blocker is stock-confirmation-missing');
        assert(r.furthestLevel === SI.LEVEL.SPINE_INPUTS_CONTRACT_KNOWN, '#' + idx + ' furthest level is the contract floor');
        assert(r.blockerMessages.length === r.blockers.length, '#' + idx + ' a message per blocker');
        assert(r.spineWidthComputable === false, '#' + idx + ' spine width not computable');
        assert(r.spineWidthIn === null, '#' + idx + ' spine width is null (never invented)');
        assert(r.coverUnblocked === false, '#' + idx + ' cover still blocked');
    });

    // Non-boolean truthy values do not count as confirmed (strict === true).
    const loose = SI.evaluate({
        internalStockDirectionKnown: 1, stockConfirmed: 'yes', internalBindingDirectionKnown: {},
        bindingConfirmed: 'true', paperThicknessPerLeafIn: '0.004', boardThicknessIn: '0.1',
        pageCount: '120', coverGenerationBlocked: 'no'
    });
    assert(loose.allInputsConfirmed === false, 'truthy-but-not-true inputs are not confirmed');
    assert(loose.stockConfirmed === false && loose.bindingConfirmed === false, 'string confirmations rejected');
    assert(loose.paperThicknessKnown === false && loose.pageCountKnown === false, 'string thickness/page-count rejected');
    // coverGenerationBlocked is only opened by an explicit boolean false, not a truthy string.
    assert(loose.coverUnblocked === false, 'non-false cover gate stays blocked');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — internal direction known but vendor confirmations missing
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — internal direction known, vendor confirmation missing', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    // The live shape: directions known, nothing vendor-confirmed, thicknesses absent.
    const r = SI.evaluate({
        internalStockDirectionKnown:   true,
        internalBindingDirectionKnown: true,
        stockConfirmed:                false,
        bindingConfirmed:              false,
        pageCount:                     120,
        coverGenerationBlocked:        true
    });
    // Internal direction is reported known and is DISTINCT from confirmation (acceptance #2).
    assert(r.internalStockDirectionKnown === true, 'internal stock direction known');
    assert(r.internalBindingDirectionKnown === true, 'internal binding direction known');
    assert(r.stockConfirmed === false, 'stock not vendor-confirmed despite known direction');
    assert(r.bindingConfirmed === false, 'binding not vendor-confirmed despite known direction');
    assert(r.states[SI.STATE.INTERNAL_STOCK_DIRECTION_KNOWN] === true, 'state map: internal stock direction known');
    assert(r.states[SI.STATE.STOCK_CONFIRMED] === false, 'state map: stock NOT confirmed');

    // Missing confirmations produce safe blockers (acceptance #3, #4).
    assert(r.blockers.indexOf(SI.BLOCKER.STOCK_CONFIRMATION_MISSING) !== -1, 'stock-confirmation-missing emitted');
    assert(r.blockers.indexOf(SI.BLOCKER.BINDING_CONFIRMATION_MISSING) !== -1, 'binding-confirmation-missing emitted');
    assert(r.primaryBlocker === SI.BLOCKER.STOCK_CONFIRMATION_MISSING, 'primary blocker is stock-confirmation-missing');
    // A known internal direction NEVER produces its own blocker.
    assert(r.blockers.indexOf('internal-stock-direction-missing') === -1, 'known direction emits no direction blocker');
    assert(r.allInputsConfirmed === false, 'aggregate false while confirmations missing');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — missing paper / board thickness → their blockers (acceptance #5)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — missing paper / board thickness', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    // Everything confirmed except paper thickness.
    const noPaper = SI.evaluate(Object.assign({}, ALL_KNOWN, { paperThicknessPerLeafIn: undefined }));
    assert(noPaper.paperThicknessKnown === false, 'paper thickness missing');
    assert(noPaper.blockers.indexOf(SI.BLOCKER.PAPER_THICKNESS_MISSING) !== -1, 'paper-thickness-missing emitted');
    assert(noPaper.spineWidthComputable === false, 'no paper thickness → spine not computable');
    assert(noPaper.spineWidthIn === null, 'no paper thickness → spine width null');

    // Everything confirmed except board thickness.
    const noBoard = SI.evaluate(Object.assign({}, ALL_KNOWN, { boardThicknessIn: undefined }));
    assert(noBoard.boardThicknessKnown === false, 'board thickness missing');
    assert(noBoard.blockers.indexOf(SI.BLOCKER.BOARD_THICKNESS_MISSING) !== -1, 'board-thickness-missing emitted');
    assert(noBoard.spineWidthComputable === false, 'no board thickness → spine not computable');

    // Non-positive thicknesses are rejected (zero / negative / NaN).
    [0, -0.01, NaN].forEach(function (bad) {
        const r = SI.evaluate(Object.assign({}, ALL_KNOWN, { paperThicknessPerLeafIn: bad }));
        assert(r.paperThicknessKnown === false, 'paper thickness ' + bad + ' rejected as not positive');
        assert(r.spineWidthComputable === false, 'non-positive paper thickness → spine not computable');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — page count missing / malformed → its blocker
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — page count missing', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const noPages = SI.evaluate(Object.assign({}, ALL_KNOWN, { pageCount: undefined }));
    assert(noPages.pageCountKnown === false, 'page count missing');
    assert(noPages.blockers.indexOf(SI.BLOCKER.PAGE_COUNT_MISSING) !== -1, 'page-count-missing emitted');
    assert(noPages.spineWidthComputable === false, 'no page count → spine not computable');

    // Non-integer / non-positive page counts are rejected.
    [0, -5, 12.5, NaN, Infinity].forEach(function (bad) {
        const r = SI.evaluate(Object.assign({}, ALL_KNOWN, { pageCount: bad }));
        assert(r.pageCountKnown === false, 'page count ' + bad + ' rejected as not a positive integer');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — spine width computable only when every required input is present (acceptance #6)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — spine width computability', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    // All three physical inputs present → computable, and the documented formula applies.
    const ok = SI.evaluate(ALL_KNOWN);
    assert(ok.spineWidthComputable === true, 'spine width computable when paper + board + page count present');
    assert(ok.spineWidthIn === ALL_KNOWN_SPINE_WIDTH, 'spine width = (pageCount × paperThickness) + boardThickness');

    // Dropping any single required physical input makes spine width not computable.
    ['paperThicknessPerLeafIn', 'boardThicknessIn', 'pageCount'].forEach(function (key) {
        const input = Object.assign({}, ALL_KNOWN);
        input[key] = undefined;
        const r = SI.evaluate(input);
        assert(r.spineWidthComputable === false, 'dropping ' + key + ' → spine not computable');
        assert(r.spineWidthIn === null, 'dropping ' + key + ' → spine width null');
        assert(r.blockers.indexOf(SI.BLOCKER.SPINE_WIDTH_NOT_COMPUTABLE) !== -1, 'dropping ' + key + ' → spine-width-not-computable emitted');
    });

    // A different valid material spec computes a different real spine width (not hardcoded).
    const alt = SI.evaluate(Object.assign({}, ALL_KNOWN, { pageCount: 200, paperThicknessPerLeafIn: 0.005, boardThicknessIn: 0.1 }));
    assert(alt.spineWidthComputable === true, 'alternate material spec is computable');
    assert(alt.spineWidthIn === (200 * 0.005 + 0.1), 'alternate spine width derived from its inputs (1.1)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — cover remains blocked unless stock/binding + spine prerequisites met (acceptance #7)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — cover unblock prerequisites', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    // Full set → cover unblocked.
    assert(SI.evaluate(ALL_KNOWN).coverUnblocked === true, 'cover unblocked when every prerequisite met');

    // Each prerequisite removed individually keeps the cover blocked, even if spine is computable.
    [
        ['stockConfirmed',         false],
        ['bindingConfirmed',       false],
        ['coverGenerationBlocked', true]
    ].forEach(function (pair) {
        const input = Object.assign({}, ALL_KNOWN);
        input[pair[0]] = pair[1];
        const r = SI.evaluate(input);
        assert(r.coverUnblocked === false, pair[0] + ' unmet → cover still blocked');
        assert(r.blockers.indexOf(SI.BLOCKER.COVER_STILL_BLOCKED) !== -1, pair[0] + ' unmet → cover-still-blocked emitted');
    });

    // Spine computable but stock/binding confirmed → cover STILL blocked if gate is closed.
    const gateClosed = SI.evaluate(Object.assign({}, ALL_KNOWN, { coverGenerationBlocked: true }));
    assert(gateClosed.spineWidthComputable === true, 'spine computable with full physical inputs');
    assert(gateClosed.coverUnblocked === false, 'closed cover gate keeps cover blocked even with spine computable');

    // Cover cannot be unblocked when the spine is not computable, regardless of confirmations.
    const noSpine = SI.evaluate(Object.assign({}, ALL_KNOWN, { paperThicknessPerLeafIn: undefined }));
    assert(noSpine.coverUnblocked === false, 'cover blocked while spine not computable (mirrors 8G _coverKnown)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — all known hypothetical → aggregate true (the only true path)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — all inputs confirmed', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const r = SI.evaluate(ALL_KNOWN);
    assert(r.allInputsConfirmed === true, 'aggregate true only when every input present');
    assert(r.blockers.length === 0, 'no blockers');
    assert(r.primaryBlocker === null, 'no primary blocker');
    assert(r.furthestLevel === SI.LEVEL.SPINE_INPUTS_KNOWN, 'furthest level is spine-inputs-known');
    assert(r.spineWidthComputable === true && r.coverUnblocked === true, 'spine computable + cover unblocked');
    Object.keys(SI.STATE).forEach(function (k) {
        assert(r.states[SI.STATE[k]] === true, SI.STATE[k] + ' reported known/true');
    });

    // Dropping any BLOCKING input drops the aggregate back to the contract floor. The
    // internal-direction states are transparency-only and do NOT gate the aggregate.
    ['stockConfirmed', 'bindingConfirmed', 'paperThicknessPerLeafIn', 'boardThicknessIn', 'pageCount'].forEach(function (key) {
        const input = Object.assign({}, ALL_KNOWN);
        input[key] = undefined;
        const r2 = SI.evaluate(input);
        assert(r2.allInputsConfirmed === false, 'dropping blocking input ' + key + ' → aggregate false');
    });
    assert(SI.evaluate(Object.assign({}, ALL_KNOWN, { coverGenerationBlocked: true })).allInputsConfirmed === false,
        'closing the cover gate → aggregate false');

    // Internal direction is non-blocking: dropping it keeps the aggregate true (distinct from confirmation).
    ['internalStockDirectionKnown', 'internalBindingDirectionKnown'].forEach(function (key) {
        const input = Object.assign({}, ALL_KNOWN);
        input[key] = undefined;
        const r3 = SI.evaluate(input);
        assert(r3.allInputsConfirmed === true, 'dropping non-blocking ' + key + ' → aggregate stays true');
        assert(r3.states[key === 'internalStockDirectionKnown' ? SI.STATE.INTERNAL_STOCK_DIRECTION_KNOWN : SI.STATE.INTERNAL_BINDING_DIRECTION_KNOWN] === false, key + ' reported missing but non-blocking');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — higher rungs always reported false (separation, acceptance #2)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — never advances render-env/artifact/print/vendor/manufacturing/packaging', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    [SI.evaluate(), SI.evaluate(ALL_KNOWN)].forEach(function (r, idx) {
        assert(r.renderEnvironmentKnown === false, '#' + idx + ' render-environment-known false');
        assert(r.exportArtifactGenerationReady === false, '#' + idx + ' artifact generation false');
        assert(r.printFileReady === false, '#' + idx + ' print-file-ready false');
        assert(r.vendorReady === false, '#' + idx + ' vendor-ready false');
        assert(r.manufacturingReady === false, '#' + idx + ' manufacturing-ready false');
        assert(r.packagingReady === false, '#' + idx + ' packaging-ready false');
        assert(r.gatedReason === 'not-implemented', '#' + idx + ' gated reason not-implemented');
    });
    // Even when every spine/cover input is known, the higher rungs stay false.
    const known = SI.evaluate(ALL_KNOWN);
    assert(known.allInputsConfirmed === true && known.printFileReady === false,
        'spine-inputs-known does not imply print-file-ready');
    assert(known.renderEnvironmentKnown === false, 'spine-inputs-known does not imply render-environment-known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — resolveFromContext: honest from live repo-truth facts
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — resolveFromContext from live repo truth', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const view = SI.resolveFromContext({
        productionDirection:    LIVE_PRODUCTION_DIRECTION,
        productionDependencies: LIVE_PRODUCTION_DEPS,
        pageCount:              120
        // materialSpec intentionally omitted — vendor-supplied thicknesses are not in repo truth.
    });

    // Internal direction derived known from real repo truth.
    assert(view.input.internalStockDirectionKnown === true, 'internal stock direction known from BOOK_PRODUCTION_DEPS.STOCK');
    assert(view.input.internalBindingDirectionKnown === true, 'internal binding direction known from BOOK_PRODUCTION_DEPS.BINDING');

    // Vendor confirmations + thicknesses genuinely missing.
    assert(view.input.stockConfirmed === false, 'stock not confirmed (live truth)');
    assert(view.input.bindingConfirmed === false, 'binding not confirmed (live truth)');
    assert(view.result.paperThicknessKnown === false, 'paper thickness missing (live truth)');
    assert(view.result.boardThicknessKnown === false, 'board thickness missing (live truth)');
    assert(view.result.pageCountKnown === true, 'page count known (live truth)');

    // Honest determination: spine NOT computable, cover STILL blocked.
    assert(view.result.spineWidthComputable === false, 'spine width not computable on live repo truth');
    assert(view.result.spineWidthIn === null, 'spine width null on live repo truth');
    assert(view.result.coverUnblocked === false, 'cover still blocked on live repo truth');
    assert(view.result.allInputsConfirmed === false, 'aggregate honestly false on live repo truth');
    assert(view.result.primaryBlocker === SI.BLOCKER.STOCK_CONFIRMATION_MISSING, 'live primary blocker is stock-confirmation-missing');
    assert(view.display.tone === SI.STATUS_TONE.GATED, 'display gated on live repo truth');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — resolveFromContext: malformed / absent inputs → facts missing, not invented
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — resolveFromContext honest on malformed input', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const none = SI.resolveFromContext({});
    assert(none.input.internalStockDirectionKnown === false, 'no direction → stock direction missing');
    assert(none.input.internalBindingDirectionKnown === false, 'no direction → binding direction missing');
    assert(none.input.stockConfirmed === false, 'no deps → stock not confirmed');
    assert(none.result.pageCountKnown === false, 'no page count → missing');
    // Absent cover gate defaults to blocked (honest), never invented open.
    assert(none.result.coverUnblocked === false, 'absent cover gate defaults blocked');
    assert(none.result.allInputsConfirmed === false, 'empty context → aggregate false');

    // Empty-string directions are not "known".
    const blankDir = SI.resolveFromContext({ productionDirection: { STOCK: '', BINDING: 'casebound-hardcover' } });
    assert(blankDir.input.internalStockDirectionKnown === false, 'empty STOCK string → direction missing');
    assert(blankDir.input.internalBindingDirectionKnown === true, 'non-empty BINDING string → direction known');

    // A fully-supplied hypothetical context derives known (proves values are not hardcoded false).
    const full = SI.resolveFromContext({
        productionDirection:    LIVE_PRODUCTION_DIRECTION,
        productionDependencies: { coverGenerationBlocked: false, stockConfirmed: true, bindingConfirmed: true },
        materialSpec:           { paperThicknessPerLeafIn: 0.004, boardThicknessIn: 0.118 },
        pageCount:              120
    });
    assert(full.result.spineWidthComputable === true, 'fully-supplied context → spine computable');
    assert(full.result.spineWidthIn === ALL_KNOWN_SPINE_WIDTH, 'fully-supplied context → spine width derived from inputs');
    assert(full.result.coverUnblocked === true, 'fully-supplied context → cover unblocked');
    assert(full.result.allInputsConfirmed === true, 'fully-supplied context → aggregate true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — toRenderEnvironmentInput + integration with REAL 8G render environment
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — integration with MessageBookRenderEnvironment (8G)', function () {
    const KM = makeIntegrationCtx();
    const SI = KM.MessageBookSpineInputs;
    const RE = KM.MessageBookRenderEnvironment;

    // The bridge maps the 8H derived facts onto 8G's existing productionDependencies fields.
    const liveBridge = SI.toRenderEnvironmentInput(SI.resolveFromContext({
        productionDirection: LIVE_PRODUCTION_DIRECTION, productionDependencies: LIVE_PRODUCTION_DEPS, pageCount: 120
    }).result);
    assert(liveBridge.spineWidthKnown === false, 'live bridge: spineWidthKnown false');
    assert(liveBridge.coverGenerationBlocked === true, 'live bridge: cover stays blocked');
    assert(liveBridge.stockConfirmed === false && liveBridge.bindingConfirmed === false, 'live bridge: confirmations false');
    assert(SI.toRenderEnvironmentInput().spineWidthKnown === false, 'no result → bridge false (defensive)');

    // Feeding the live 8H bridge into the REAL 8G keeps 8G honestly at spine-missing.
    const liveRe = RE.resolveFromContext({
        geometry: LIVE_GEOMETRY, parity: LIVE_PARITY,
        productionDependencies: Object.assign({ interiorPageCountConfirmed: true }, liveBridge),
        fontRender: { fontsAvailable: false, emojiStrategyConfirmed: false }
    });
    assert(liveRe.result.renderEnvironmentKnown === false, 'live 8H feed keeps 8G aggregate false');
    assert(liveRe.result.primaryBlocker === RE.BLOCKER.SPINE_MISSING, '8G primary blocker stays spine-missing');
    assert(liveRe.input.spineKnown === false && liveRe.input.coverKnown === false, '8G spine + cover inputs missing');

    // A fully-confirmed 8H hypothetical + known geometry/font advances 8G to fully known —
    // proving the feed can honestly advance 8G when material facts genuinely exist.
    const confirmedBridge = SI.toRenderEnvironmentInput(SI.evaluate(ALL_KNOWN));
    assert(confirmedBridge.spineWidthKnown === true && confirmedBridge.coverGenerationBlocked === false, 'confirmed bridge opens spine + cover');
    const confirmedRe = RE.resolveFromContext({
        geometry: LIVE_GEOMETRY, parity: LIVE_PARITY,
        productionDependencies: Object.assign({ interiorPageCountConfirmed: true }, confirmedBridge),
        fontRender: { fontsAvailable: true, emojiStrategyConfirmed: true }
    });
    assert(confirmedRe.input.spineKnown === true, '8G spine input known when 8H spine computable');
    assert(confirmedRe.input.coverKnown === true, '8G cover input known when 8H cover unblocked');
    assert(confirmedRe.result.renderEnvironmentKnown === true, 'fully-confirmed 8H feed advances 8G to render-environment-known');
    // But even then 8G never advances the artifact/print/vendor rungs.
    assert(confirmedRe.result.printFileReady === false, '8G print-file-ready stays false even when render environment fully known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — describeReadiness copy matrix + no unsafe claims
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — describeReadiness', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const gated = SI.describeReadiness(SI.evaluate());
    assert(gated.tone === SI.STATUS_TONE.GATED, 'no inputs → gated tone');
    assert(gated.headline === 'The spine and cover inputs are not ready yet', 'gated headline');
    assert(gated.detail === SI.blockerMessage(SI.BLOCKER.STOCK_CONFIRMATION_MISSING), 'gated detail is primary blocker message');
    assert(gated.blocker === SI.BLOCKER.STOCK_CONFIRMATION_MISSING, 'gated blocker code present');

    const known = SI.describeReadiness(SI.evaluate(ALL_KNOWN));
    assert(known.tone === SI.STATUS_TONE.KNOWN, 'all known → known tone');
    assert(known.blocker === null, 'known → no blocker');
    assert(known.detail.indexOf('not implemented') !== -1, 'known detail still says render env / artifact generation not implemented');

    // Defensive: empty/null result.
    assert(SI.describeReadiness().tone === SI.STATUS_TONE.GATED, 'undefined result → gated');
    assert(SI.describeReadiness(null).tone === SI.STATUS_TONE.GATED, 'null result → gated');

    // No unsafe commerce/production claim in any describeReadiness copy.
    [gated, known].forEach(function (d) {
        const copy = (d.headline + ' ' + d.detail).toLowerCase();
        ['ready to print', 'ready to order', 'ready to export', 'print now', 'order now', 'buy now', 'add to cart', '$'].forEach(function (term) {
            assert(copy.indexOf(term) === -1, 'describeReadiness copy has no unsafe term "' + term + '"');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — describeBoundary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — describeBoundary', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const b = SI.describeBoundary();
    assert(b.version === 'kmsi1', 'boundary version');
    assert(b.artifactFree === true, 'boundary is artifact-free');
    assert(typeof b.doesNot === 'string' && b.doesNot.length > 0, 'doesNot statement present');
    assert(Array.isArray(b.separates) && b.separates.indexOf('vendor-material-confirmation') !== -1, 'separates vendor confirmation');
    assert(b.separates.indexOf('internal-material-direction') !== -1, 'separates internal direction');
    assert(b.separates.indexOf('spine-width-computability') !== -1 && b.separates.indexOf('cover-unblocking') !== -1, 'separates spine computability + cover unblocking');
    assert(Array.isArray(b.notImplemented) && b.notImplemented.indexOf('cover-generation') !== -1 && b.notImplemented.indexOf('manufacturing') !== -1, 'cover-generation/manufacturing listed not-implemented');
    assert(typeof b.spineWidthFormula === 'string' && b.spineWidthFormula.indexOf('paperThicknessPerLeaf') !== -1, 'documents the spine width formula');
    assert(typeof b.materialSourceOfTruth === 'string' && b.materialSourceOfTruth.indexOf('BOOK_PRODUCTION_DEPS') !== -1, 'points at material source of truth');
    assert(b.distinctFrom && b.distinctFrom.renderEnvironment && b.distinctFrom.exportPipeline && b.distinctFrom.manufacturingReadiness, 'distinctFrom render env + export pipeline + manufacturing');
    assert(Array.isArray(b.blockerCodes) && b.blockerCodes.length === SI.BLOCKER_ORDER.length, 'lists the blocker codes');
    // Fresh object each call.
    assert(SI.describeBoundary() !== b, 'describeBoundary returns a fresh object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — purity: deterministic, no mutation, fresh arrays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — purity', function () {
    const SI = makeCtx().MessageBookSpineInputs;

    const input = Object.assign({}, ALL_KNOWN);
    const frozen = JSON.stringify(input);
    const a = SI.evaluate(input);
    const b = SI.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'evaluate is deterministic');
    assert(JSON.stringify(input) === frozen, 'evaluate does not mutate its input');

    const c = SI.evaluate();
    c.blockers.push('mutated');
    c.blockerMessages.push('mutated');
    assert(SI.evaluate().blockers.indexOf('mutated') === -1, 'evaluate returns a fresh blockers array');
    assert(SI.evaluate().blockerMessages.indexOf('mutated') === -1, 'evaluate returns a fresh blockerMessages array');

    // resolveFromContext does not mutate its argument.
    const ctx = { productionDirection: LIVE_PRODUCTION_DIRECTION, productionDependencies: LIVE_PRODUCTION_DEPS, pageCount: 120 };
    const ctxFrozen = JSON.stringify(ctx);
    SI.resolveFromContext(ctx);
    assert(JSON.stringify(ctx) === ctxFrozen, 'resolveFromContext does not mutate its argument');

    // toRenderEnvironmentInput does not mutate its argument.
    const r = SI.evaluate(input);
    const rFrozen = JSON.stringify(r);
    SI.toRenderEnvironmentInput(r);
    assert(JSON.stringify(r) === rFrozen, 'toRenderEnvironmentInput does not mutate its argument');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — source carries no commerce/production CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — no commerce/production CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-spine-inputs.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT the spine/stock/binding/cover boundary, so those nouns
    // legitimately appear. What must never appear is an ACTION that performs
    // commerce/production, or a call-to-action that implies it.
    ['add to cart', 'addtocart', 'place order', 'placeorder', 'create order', 'createorder',
     'submit order', 'submitorder', 'order now', 'ordernow', 'buy now', 'buynow',
     'pay now', 'paynow', 'checkout session', 'createcheckout', 'send to vendor',
     'submit to vendor', 'send to print', 'print now', 'generate pdf', 'generatepdf',
     'charge(', 'stripe', 'paypal', 'add to bag', 'download('].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source contains no commerce/production CTA/action "' + term + '"');
    });

    // Fully pure: no network/DOM/storage/random/clock side effects at all.
    ['fetch(', 'xmlhttprequest', 'localstorage', 'sessionstorage', 'document.',
     'window.location', 'math.random(', 'new date', 'date.now'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source has no side-effect token "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
