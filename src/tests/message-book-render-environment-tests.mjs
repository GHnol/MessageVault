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

// MessageBookRenderEnvironment is a pure function of its inputs and references no sibling
// module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-render-environment.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the REAL 8E export-pipeline contract (plus the 8C
// print-spec and 8A manufacturing-readiness boundaries it relates to) that the
// render-environment aggregate feeds.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-render-environment.js');
    load(ctx, 'src/products/message-book-print-spec.js');
    load(ctx, 'src/products/message-book-manufacturing-readiness.js');
    load(ctx, 'src/products/message-book-export-pipeline.js');
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

const SPEC_ID = 'message-book-internal-7x10-hardcover-v1';

// Every required render input present. The genuinely-missing facts (spine/cover/font)
// are set true here only to exercise the all-known path; the live repo state keeps them
// false (Suites 5/9/14).
const ALL_INPUTS = {
    interiorStructureKnown: true,
    trimKnown:              true,
    bleedKnown:             true,
    safeAreaKnown:          true,
    parityKnown:            true,
    spineKnown:             true,
    coverKnown:             true,
    fontRenderKnown:        true,
    exportTargetKnown:      true
};

// A faithful, in-test mirror of the live BOOK_PRODUCTION_DEPS / BOOK_PARITY constants
// (index.html, scope-guarded). Used to prove resolveFromContext derives the geometry
// facts as known from real repo truth without importing index.html.
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

// The live captured production-dependency truth (captureBookRenderSpec.productionDependencies):
// interior page count is real, but cover is blocked and spine/stock/binding are unconfirmed.
const LIVE_PRODUCTION_DEPS = {
    interiorPageCountConfirmed: true,
    coverGenerationBlocked:     true,
    spineWidthKnown:            false,
    stockConfirmed:             false,
    bindingConfirmed:           false
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    assert(typeof RE === 'object' && RE !== null, 'KMEngine.MessageBookRenderEnvironment is an object');
    assert(RE.CONTRACT_VERSION === 'kmre1', 'CONTRACT_VERSION is "kmre1"');
    assert(RE.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(typeof RE.LEVEL === 'object' && RE.LEVEL !== null, 'LEVEL is an object');
    assert(typeof RE.INPUT === 'object' && RE.INPUT !== null, 'INPUT is an object');
    assert(Array.isArray(RE.INPUT_ORDER), 'INPUT_ORDER is an array');
    assert(Array.isArray(RE.REQUIRED_INPUTS), 'REQUIRED_INPUTS is an array');
    assert(typeof RE.BLOCKER === 'object' && RE.BLOCKER !== null, 'BLOCKER is an object');
    assert(typeof RE.STATUS_TONE === 'object' && RE.STATUS_TONE !== null, 'STATUS_TONE is an object');
    assert(RE.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof RE.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof RE.evaluate === 'function', 'evaluate is a function');
    assert(typeof RE.resolveFromContext === 'function', 'resolveFromContext is a function');
    assert(typeof RE.toExportPipelineInput === 'function', 'toExportPipelineInput is a function');
    assert(typeof RE.describeReadiness === 'function', 'describeReadiness is a function');
    assert(typeof RE.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — LEVEL / INPUT / BLOCKER constants + frozen
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — constants', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;
    const L = RE.LEVEL, I = RE.INPUT, B = RE.BLOCKER;

    assert(L.RENDER_ENVIRONMENT_CONTRACT_KNOWN === 'render-environment-contract-known', 'LEVEL contract-known');
    assert(L.RENDER_ENVIRONMENT_KNOWN === 'render-environment-known', 'LEVEL render-environment-known');

    assert(I.INTERIOR_STRUCTURE_KNOWN === 'interior-structure-known', 'INPUT interior-structure');
    assert(I.TRIM_KNOWN === 'trim-known', 'INPUT trim');
    assert(I.BLEED_KNOWN === 'bleed-known', 'INPUT bleed');
    assert(I.SAFE_AREA_KNOWN === 'safe-area-known', 'INPUT safe-area');
    assert(I.PARITY_KNOWN === 'parity-known', 'INPUT parity');
    assert(I.SPINE_KNOWN === 'spine-known', 'INPUT spine');
    assert(I.COVER_KNOWN === 'cover-known', 'INPUT cover');
    assert(I.FONT_RENDER_KNOWN === 'font-render-known', 'INPUT font-render');
    assert(I.EXPORT_TARGET_KNOWN === 'export-target-known', 'INPUT export-target');

    assert(B.INTERIOR_STRUCTURE_MISSING === 'interior-structure-missing', 'BLOCKER interior-structure');
    assert(B.TRIM_MISSING === 'trim-missing', 'BLOCKER trim');
    assert(B.BLEED_MISSING === 'bleed-missing', 'BLOCKER bleed');
    assert(B.SAFE_AREA_MISSING === 'safe-area-missing', 'BLOCKER safe-area');
    assert(B.PARITY_MISSING === 'parity-missing', 'BLOCKER parity');
    assert(B.SPINE_MISSING === 'spine-missing', 'BLOCKER spine');
    assert(B.COVER_MISSING === 'cover-missing', 'BLOCKER cover');
    assert(B.FONT_RENDER_MISSING === 'font-render-missing', 'BLOCKER font-render');
    assert(B.EXPORT_TARGET_MISSING === 'export-target-missing', 'BLOCKER export-target');

    // INPUT_ORDER covers every INPUT exactly once, interior first, export-target last.
    assert(RE.INPUT_ORDER.length === Object.keys(I).length, 'INPUT_ORDER lists every input');
    assert(RE.INPUT_ORDER[0] === I.INTERIOR_STRUCTURE_KNOWN, 'INPUT_ORDER starts with interior structure');
    assert(RE.INPUT_ORDER[RE.INPUT_ORDER.length - 1] === I.EXPORT_TARGET_KNOWN, 'INPUT_ORDER ends with export target');

    // Frozen enums.
    assert(Object.isFrozen(L) && Object.isFrozen(I) && Object.isFrozen(B), 'LEVEL/INPUT/BLOCKER frozen');
    assert(Object.isFrozen(RE.INPUT_ORDER) && Object.isFrozen(RE.REQUIRED_INPUTS), 'INPUT_ORDER/REQUIRED_INPUTS frozen');
    assert(RE.REQUIRED_INPUTS.length === RE.INPUT_ORDER.length, 'REQUIRED_INPUTS one per input');

    // Every blocker has a safe non-empty message.
    Object.keys(B).forEach(function (k) {
        assert(typeof RE.blockerMessage(B[k]) === 'string' && RE.blockerMessage(B[k]).length > 0, 'message for ' + B[k]);
    });
    assert(RE.blockerMessage('nope') === '', 'unknown blocker → empty string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — evaluate: no inputs known
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — no inputs known', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    [RE.evaluate(), RE.evaluate(null), RE.evaluate({})].forEach(function (r, idx) {
        assert(r.renderEnvironmentContractKnown === true, '#' + idx + ' contract is the floor (always known)');
        assert(r.renderEnvironmentKnown === false, '#' + idx + ' aggregate false with nothing supplied');
        assert(r.missingInputs.length === RE.INPUT_ORDER.length, '#' + idx + ' every input missing');
        assert(r.primaryBlocker === RE.BLOCKER.INTERIOR_STRUCTURE_MISSING, '#' + idx + ' primary blocker is interior-structure-missing');
        assert(r.furthestLevel === RE.LEVEL.RENDER_ENVIRONMENT_CONTRACT_KNOWN, '#' + idx + ' furthest level is the contract floor');
        assert(r.blockers.length === RE.INPUT_ORDER.length, '#' + idx + ' one blocker per missing input');
        assert(r.blockerMessages.length === r.blockers.length, '#' + idx + ' a message per blocker');
    });

    // Non-boolean truthy values do not count as known (strict === true).
    const loose = RE.evaluate({
        interiorStructureKnown: 1, trimKnown: 'yes', bleedKnown: {}, safeAreaKnown: [],
        parityKnown: 'true', spineKnown: 1, coverKnown: 'x', fontRenderKnown: 2, exportTargetKnown: 'PDF'
    });
    assert(loose.renderEnvironmentKnown === false, 'truthy-but-not-true inputs are not known');
    assert(loose.missingInputs.length === RE.INPUT_ORDER.length, 'truthy-but-not-true → still all missing');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — evaluate: each single missing input → its blocker
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — single missing input maps to its blocker', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const PAIRS = [
        ['interiorStructureKnown', RE.BLOCKER.INTERIOR_STRUCTURE_MISSING],
        ['trimKnown',              RE.BLOCKER.TRIM_MISSING],
        ['bleedKnown',             RE.BLOCKER.BLEED_MISSING],
        ['safeAreaKnown',          RE.BLOCKER.SAFE_AREA_MISSING],
        ['parityKnown',            RE.BLOCKER.PARITY_MISSING],
        ['spineKnown',             RE.BLOCKER.SPINE_MISSING],
        ['coverKnown',             RE.BLOCKER.COVER_MISSING],
        ['fontRenderKnown',        RE.BLOCKER.FONT_RENDER_MISSING],
        ['exportTargetKnown',      RE.BLOCKER.EXPORT_TARGET_MISSING]
    ];

    PAIRS.forEach(function (pair) {
        const input = Object.assign({}, ALL_INPUTS);
        input[pair[0]] = false;
        const r = RE.evaluate(input);
        assert(r.renderEnvironmentKnown === false, pair[0] + ' missing → aggregate false');
        assert(r.missingInputs.length === 1, pair[0] + ' missing → exactly one missing input');
        assert(r.primaryBlocker === pair[1], pair[0] + ' missing → ' + pair[1]);
        assert(r.blockerMessages[0] === RE.blockerMessage(pair[1]), pair[0] + ' missing → safe message');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — evaluate: the genuine live partial state (spine/cover/font missing)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — partial inputs known (live repo truth)', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    // Geometry + parity + interior + export-target known; spine/cover/font genuinely missing.
    const r = RE.evaluate({
        interiorStructureKnown: true,
        trimKnown:              true,
        bleedKnown:             true,
        safeAreaKnown:          true,
        parityKnown:            true,
        exportTargetKnown:      true,
        spineKnown:             false,
        coverKnown:             false,
        fontRenderKnown:        false
    });
    assert(r.renderEnvironmentKnown === false, 'aggregate false while spine/cover/font missing');
    assert(r.missingInputs.length === 3, 'exactly three inputs missing');
    assert(r.missingInputs.indexOf(RE.INPUT.SPINE_KNOWN) !== -1, 'spine missing');
    assert(r.missingInputs.indexOf(RE.INPUT.COVER_KNOWN) !== -1, 'cover missing');
    assert(r.missingInputs.indexOf(RE.INPUT.FONT_RENDER_KNOWN) !== -1, 'font-render missing');
    // Spine precedes cover precedes font in priority order.
    assert(r.primaryBlocker === RE.BLOCKER.SPINE_MISSING, 'primary blocker is spine-missing (most fundamental gap)');
    assert(r.inputs[RE.INPUT.TRIM_KNOWN] === true && r.inputs[RE.INPUT.EXPORT_TARGET_KNOWN] === true, 'known facts reported known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — evaluate: all inputs known → aggregate true (the only true path)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — all required inputs known', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const r = RE.evaluate(ALL_INPUTS);
    assert(r.renderEnvironmentKnown === true, 'aggregate true only when every input is known');
    assert(r.missingInputs.length === 0, 'no missing inputs');
    assert(r.blockers.length === 0, 'no blockers');
    assert(r.primaryBlocker === null, 'no primary blocker');
    assert(r.furthestLevel === RE.LEVEL.RENDER_ENVIRONMENT_KNOWN, 'furthest level is render-environment-known');
    Object.keys(RE.INPUT).forEach(function (k) {
        assert(r.inputs[RE.INPUT[k]] === true, RE.INPUT[k] + ' reported known');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — aggregate stays false if ANY one required input is missing
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — aggregate false when any single input is missing', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    Object.keys(ALL_INPUTS).forEach(function (key) {
        const input = Object.assign({}, ALL_INPUTS);
        input[key] = false;
        const r = RE.evaluate(input);
        assert(r.renderEnvironmentKnown === false, 'dropping ' + key + ' → aggregate false');
        assert(r.furthestLevel === RE.LEVEL.RENDER_ENVIRONMENT_CONTRACT_KNOWN, 'dropping ' + key + ' → back to contract floor');
    });

    // And true only for the full set.
    assert(RE.evaluate(ALL_INPUTS).renderEnvironmentKnown === true, 'full set → aggregate true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — higher rungs are always reported false (separation, acceptance #2)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — render-known never advances artifact/print/vendor/manufacturing/packaging', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    [RE.evaluate(), RE.evaluate(ALL_INPUTS)].forEach(function (r, idx) {
        assert(r.exportArtifactGenerationReady === false, '#' + idx + ' artifact generation false');
        assert(r.printFileReady === false, '#' + idx + ' print-file-ready false');
        assert(r.vendorReady === false, '#' + idx + ' vendor-ready false');
        assert(r.manufacturingReady === false, '#' + idx + ' manufacturing-ready false');
        assert(r.packagingReady === false, '#' + idx + ' packaging-ready false');
        assert(r.gatedReason === 'not-implemented', '#' + idx + ' gated reason not-implemented');
    });
    // Even when the aggregate is fully known, the higher rungs stay false.
    assert(RE.evaluate(ALL_INPUTS).renderEnvironmentKnown === true && RE.evaluate(ALL_INPUTS).printFileReady === false,
        'render-environment-known does not imply print-file-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — resolveFromContext: honest from live repo-truth constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — resolveFromContext from live repo truth', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const view = RE.resolveFromContext({
        geometry:               LIVE_GEOMETRY,
        parity:                 LIVE_PARITY,
        productionDependencies: LIVE_PRODUCTION_DEPS,
        fontRender:             { fontsAvailable: false, emojiStrategyConfirmed: false }
    });

    // Geometry / parity / interior / export-target derived as known from real repo truth.
    assert(view.input.trimKnown === true, 'trim known from BOOK_PRODUCTION_DEPS.TRIM_IN');
    assert(view.input.bleedKnown === true, 'bleed known from BLEED_IN');
    assert(view.input.safeAreaKnown === true, 'safe-area known from SAFE_INSET_IN + MARGINS_IN');
    assert(view.input.parityKnown === true, 'parity known from BOOK_PARITY.MODULUS');
    assert(view.input.exportTargetKnown === true, 'export target known from PDF_SPEC');
    assert(view.input.interiorStructureKnown === true, 'interior structure known from interiorPageCountConfirmed');

    // Cover / spine / font genuinely missing.
    assert(view.input.spineKnown === false, 'spine missing (spineWidthKnown false)');
    assert(view.input.coverKnown === false, 'cover missing (coverGenerationBlocked / unconfirmed stock+binding)');
    assert(view.input.fontRenderKnown === false, 'font-render missing (not confirmed)');

    // Honest aggregate: false. The live blocker is spine-missing first.
    assert(view.result.renderEnvironmentKnown === false, 'aggregate honestly false on live repo truth');
    assert(view.result.primaryBlocker === RE.BLOCKER.SPINE_MISSING, 'live primary blocker is spine-missing');
    assert(view.display.tone === RE.STATUS_TONE.GATED, 'display is gated on live repo truth');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — resolveFromContext: malformed / absent geometry → facts missing
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — resolveFromContext honest on malformed geometry', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    // No geometry / parity at all → all geometry facts missing, never invented.
    const none = RE.resolveFromContext({});
    assert(none.input.trimKnown === false, 'no geometry → trim missing');
    assert(none.input.bleedKnown === false, 'no geometry → bleed missing');
    assert(none.input.safeAreaKnown === false, 'no geometry → safe-area missing');
    assert(none.input.exportTargetKnown === false, 'no geometry → export-target missing');
    assert(none.input.parityKnown === false, 'no parity → parity missing');
    assert(none.input.interiorStructureKnown === false, 'no deps → interior missing');
    assert(none.result.renderEnvironmentKnown === false, 'empty context → aggregate false');

    // Malformed values are rejected (NaN / negative / wrong shape).
    const bad = RE.resolveFromContext({
        geometry: { TRIM_IN: { w: 0, h: 10 }, BLEED_IN: -1, SAFE_INSET_IN: NaN, MARGINS_IN: { inner: 0.5 }, PDF_SPEC: '' },
        parity:   { MODULUS: 0 }
    });
    assert(bad.input.trimKnown === false, 'zero trim width → trim missing');
    assert(bad.input.bleedKnown === false, 'negative bleed → bleed missing');
    assert(bad.input.safeAreaKnown === false, 'NaN safe inset / partial margins → safe-area missing');
    assert(bad.input.exportTargetKnown === false, 'empty PDF_SPEC → export-target missing');
    assert(bad.input.parityKnown === false, 'zero modulus → parity missing');

    // A real-but-different valid geometry still derives known (no hardcoded values).
    const alt = RE.resolveFromContext({
        geometry: { TRIM_IN: { w: 6, h: 9 }, BLEED_IN: 0.0625, SAFE_INSET_IN: 0.25, MARGINS_IN: { inner: 1, outer: 0.5, top: 0.5, bottom: 0.5 }, PDF_SPEC: 'PDF/X-1a' },
        parity:   { MODULUS: 4 }
    });
    assert(alt.input.trimKnown && alt.input.bleedKnown && alt.input.safeAreaKnown && alt.input.parityKnown && alt.input.exportTargetKnown,
        'a different well-formed geometry is also known (values not hardcoded)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — resolveFromContext: a fully-confirmed hypothetical CAN go true
// ─────────────────────────────────────────────────────────────────────────────
// Proves the aggregate is reachable honestly — not nailed to false — only when EVERY
// genuinely-missing fact (spine, cover gate, stock+binding, font) is actually supplied.
suite('Suite 11 — fully-confirmed hypothetical aggregates true', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const confirmedDeps = {
        interiorPageCountConfirmed: true,
        coverGenerationBlocked:     false,   // cover gate genuinely unblocked
        spineWidthKnown:            true,    // vendor paper/board thickness supplied
        stockConfirmed:             true,
        bindingConfirmed:           true
    };
    const view = RE.resolveFromContext({
        geometry:               LIVE_GEOMETRY,
        parity:                 LIVE_PARITY,
        productionDependencies: confirmedDeps,
        fontRender:             { fontsAvailable: true, emojiStrategyConfirmed: true }
    });
    assert(view.input.spineKnown === true, 'spine known when spineWidthKnown true');
    assert(view.input.coverKnown === true, 'cover known when gate unblocked + spine + stock + binding');
    assert(view.input.fontRenderKnown === true, 'font-render known when fonts + emoji confirmed');
    assert(view.result.renderEnvironmentKnown === true, 'aggregate true only when every fact is genuinely present');
    assert(view.display.tone === RE.STATUS_TONE.KNOWN, 'display tone is known');

    // Cover stays missing if any one of its sub-conditions is unmet, even with spine known.
    ['coverGenerationBlocked', 'stockConfirmed', 'bindingConfirmed'].forEach(function (flag) {
        const partial = Object.assign({}, confirmedDeps);
        partial[flag] = (flag === 'coverGenerationBlocked') ? true : false;
        const v = RE.resolveFromContext({ geometry: LIVE_GEOMETRY, parity: LIVE_PARITY, productionDependencies: partial, fontRender: true });
        assert(v.input.coverKnown === false, 'cover missing when ' + flag + ' unmet');
        assert(v.result.renderEnvironmentKnown === false, 'aggregate false when ' + flag + ' unmet');
    });

    // Spine known but font absent → still false.
    const noFont = RE.resolveFromContext({ geometry: LIVE_GEOMETRY, parity: LIVE_PARITY, productionDependencies: confirmedDeps, fontRender: { fontsAvailable: true, emojiStrategyConfirmed: false } });
    assert(noFont.result.renderEnvironmentKnown === false, 'emoji unconfirmed → aggregate false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — resolveFromContext: explicit interiorStructureReady override
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — interiorStructureReady override', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    // Explicit false overrides a confirmed page count (e.g. empty book in the live app).
    const off = RE.resolveFromContext({
        geometry: LIVE_GEOMETRY, parity: LIVE_PARITY,
        productionDependencies: LIVE_PRODUCTION_DEPS,
        interiorStructureReady: false
    });
    assert(off.input.interiorStructureKnown === false, 'explicit false overrides interiorPageCountConfirmed');

    // Explicit true is honored when there are no production deps.
    const on = RE.resolveFromContext({ geometry: LIVE_GEOMETRY, parity: LIVE_PARITY, interiorStructureReady: true });
    assert(on.input.interiorStructureKnown === true, 'explicit true honored');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — toExportPipelineInput + integration with REAL 8E export pipeline
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — integration with MessageBookExportPipeline (8E)', function () {
    const KM = makeIntegrationCtx();
    const RE = KM.MessageBookRenderEnvironment;
    const EP = KM.MessageBookExportPipeline;
    const PS = KM.MessageBookPrintSpec;

    // The bridge yields renderEnvironmentKnown only when the aggregate is genuinely true.
    assert(RE.toExportPipelineInput(RE.evaluate()).renderEnvironmentKnown === false, 'aggregate false → bridge false');
    assert(RE.toExportPipelineInput(RE.evaluate(ALL_INPUTS)).renderEnvironmentKnown === true, 'aggregate true → bridge true');
    assert(RE.toExportPipelineInput().renderEnvironmentKnown === false, 'no result → bridge false (defensive)');

    const psResult = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 });
    assert(psResult.internalSpecValid === true, 'real 8C print spec is valid');

    // Live repo-truth render environment (aggregate false) → 8E blocks at render-environment-missing.
    const live = RE.resolveFromContext({
        geometry: LIVE_GEOMETRY, parity: LIVE_PARITY,
        productionDependencies: LIVE_PRODUCTION_DEPS,
        fontRender: { fontsAvailable: false, emojiStrategyConfirmed: false }
    });
    assert(live.result.renderEnvironmentKnown === false, 'live render environment honestly false');
    const epLive = EP.resolveFromContext(Object.assign(
        { printSpec: psResult, proofApprovedCurrent: true, compositionReady: true },
        RE.toExportPipelineInput(live.result)
    ));
    assert(epLive.result.primaryBlocker === EP.BLOCKER.RENDER_ENVIRONMENT_MISSING,
        'feeding the live aggregate keeps 8E at render-environment-missing');
    assert(epLive.result.exportInputsKnown === false, '8E export-inputs-known stays false');
    assert(epLive.result.printFileReady === false, '8E print-file-ready stays false');

    // A fully-confirmed hypothetical render environment (aggregate true) → 8E advances past
    // render-environment to its terminal artifact-generation-not-implemented (never a print file).
    const confirmed = RE.resolveFromContext({
        geometry: LIVE_GEOMETRY, parity: LIVE_PARITY,
        productionDependencies: { interiorPageCountConfirmed: true, coverGenerationBlocked: false, spineWidthKnown: true, stockConfirmed: true, bindingConfirmed: true },
        fontRender: true
    });
    assert(confirmed.result.renderEnvironmentKnown === true, 'hypothetical render environment fully known');
    const epReady = EP.resolveFromContext(Object.assign(
        { printSpec: psResult, proofApprovedCurrent: true, compositionReady: true },
        RE.toExportPipelineInput(confirmed.result)
    ));
    assert(epReady.result.exportInputsKnown === true, 'all 8E inputs known when render environment is fully known');
    assert(epReady.result.primaryBlocker === EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED,
        '8E terminal blocker is artifact-generation-not-implemented (render-known never produces a file)');
    assert(epReady.result.printFileReady === false, '8E print-file-ready stays false even when render environment is fully known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — live 8F honest mapping (mirror of renderBookExportPreflightStatus)
// ─────────────────────────────────────────────────────────────────────────────
// A faithful mirror of how index.html feeds the render-environment aggregate into the
// 8F export-preflight status. The live wiring must keep the existing honest behavior:
// with a valid spec + approved-current proof + ready composition, the export-preflight
// still blocks at render-environment-missing because spine/cover/font are missing.
suite('Suite 14 — live 8F mapping stays honest', function () {
    const KM = makeIntegrationCtx();
    const RE = KM.MessageBookRenderEnvironment;
    const EP = KM.MessageBookExportPipeline;
    const PS = KM.MessageBookPrintSpec;
    const MR = KM.MessageBookManufacturingReadiness;

    // Mirror the index.html live feed exactly: live geometry/parity constants + the live
    // captured production-dependency truth + no confirmed font/emoji availability.
    function liveRenderEnvironmentKnown(compositionReady) {
        return RE.resolveFromContext({
            geometry: LIVE_GEOMETRY,
            parity:   LIVE_PARITY,
            productionDependencies: LIVE_PRODUCTION_DEPS,
            fontRender: { fontsAvailable: false, emojiStrategyConfirmed: false },
            interiorStructureReady: compositionReady
        }).result.renderEnvironmentKnown;
    }

    const validSpec = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 });

    // Valid spec + approved-current proof + ready composition → render-environment-missing.
    const renderKnown = liveRenderEnvironmentKnown(true);
    assert(renderKnown === false, 'live render-environment aggregate is false');
    const live = EP.resolveFromContext({
        printSpec: validSpec, proofApprovedCurrent: true, compositionReady: true,
        renderEnvironmentKnown: renderKnown
    });
    assert(live.result.primaryBlocker === EP.BLOCKER.RENDER_ENVIRONMENT_MISSING, 'live 8F blocker stays render-environment-missing');
    assert(live.display.tone === EP.STATUS_TONE.GATED, 'live 8F tone stays gated');

    // The live result fed through the 8A bridge keeps manufacturing at export-pipeline-not-implemented.
    const caps = Object.assign({}, PS.toManufacturingCapabilities(validSpec), EP.toManufacturingCapabilities(live.result));
    const bridged = MR.resolveFromReadiness({ readiness: { checkoutEligible: true }, intent: { active: true }, capabilities: caps });
    assert(bridged.result.printFileReady === false, '8A print-file-ready stays false on the live path');
    assert(bridged.result.primaryBlocker === 'export-pipeline-not-implemented', '8A stays at export-pipeline-not-implemented');

    // The export-preflight display copy carries no commerce/production CTA.
    const copy = ((live.display.headline || '') + ' ' + (live.display.detail || '')).toLowerCase();
    ['add to cart', 'place order', 'order now', 'buy now', 'pay now', 'checkout', 'print now',
     'generate pdf', 'ready to print', 'ready to order', 'ready to export', '$'].forEach(function (term) {
        assert(copy.indexOf(term) === -1, 'live 8F copy has no unsafe term "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — describeReadiness copy matrix + no unsafe claims
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — describeReadiness', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const gated = RE.describeReadiness(RE.evaluate());
    assert(gated.tone === RE.STATUS_TONE.GATED, 'no inputs → gated tone');
    assert(gated.headline === 'The render environment is not ready yet', 'gated headline');
    assert(gated.detail === RE.blockerMessage(RE.BLOCKER.INTERIOR_STRUCTURE_MISSING), 'gated detail is primary blocker message');
    assert(gated.blocker === RE.BLOCKER.INTERIOR_STRUCTURE_MISSING, 'gated blocker code present');

    const known = RE.describeReadiness(RE.evaluate(ALL_INPUTS));
    assert(known.tone === RE.STATUS_TONE.KNOWN, 'all known → known tone');
    assert(known.blocker === null, 'known → no blocker');
    assert(known.detail.indexOf('not implemented') !== -1, 'known detail still says artifact generation not implemented');

    // Defensive: empty/null result.
    assert(RE.describeReadiness().tone === RE.STATUS_TONE.GATED, 'undefined result → gated');
    assert(RE.describeReadiness(null).tone === RE.STATUS_TONE.GATED, 'null result → gated');

    // No unsafe claim in any describeReadiness copy.
    [gated, known].forEach(function (d) {
        const copy = (d.headline + ' ' + d.detail).toLowerCase();
        ['ready to print', 'ready to order', 'ready to export', 'print now', 'order now', 'buy now', 'add to cart', '$'].forEach(function (term) {
            assert(copy.indexOf(term) === -1, 'describeReadiness copy has no unsafe term "' + term + '"');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — describeBoundary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — describeBoundary', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const b = RE.describeBoundary();
    assert(b.version === 'kmre1', 'boundary version');
    assert(b.artifactFree === true, 'boundary is artifact-free');
    assert(typeof b.doesNot === 'string' && b.doesNot.length > 0, 'doesNot statement present');
    assert(Array.isArray(b.separates) && b.separates.indexOf('export-artifact-generation') !== -1, 'separates artifact generation');
    assert(Array.isArray(b.notImplemented) && b.notImplemented.indexOf('cover') !== -1 && b.notImplemented.indexOf('spine') !== -1, 'cover/spine listed not-implemented');
    assert(typeof b.geometrySourceOfTruth === 'string' && b.geometrySourceOfTruth.indexOf('BOOK_PRODUCTION_DEPS') !== -1, 'points at geometry source of truth');
    assert(b.distinctFrom && b.distinctFrom.exportPipeline && b.distinctFrom.manufacturingReadiness, 'distinctFrom export pipeline + manufacturing');
    // Fresh object each call.
    assert(RE.describeBoundary() !== b, 'describeBoundary returns a fresh object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — purity: deterministic, no mutation, fresh arrays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — purity', function () {
    const RE = makeCtx().MessageBookRenderEnvironment;

    const input = Object.assign({}, ALL_INPUTS);
    const frozen = JSON.stringify(input);
    const a = RE.evaluate(input);
    const b = RE.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'evaluate is deterministic');
    assert(JSON.stringify(input) === frozen, 'evaluate does not mutate its input');

    const c = RE.evaluate();
    c.blockers.push('mutated');
    c.missingInputs.push('mutated');
    assert(RE.evaluate().blockers.indexOf('mutated') === -1, 'evaluate returns a fresh blockers array');
    assert(RE.evaluate().missingInputs.indexOf('mutated') === -1, 'evaluate returns a fresh missingInputs array');

    // resolveFromContext does not mutate its argument.
    const ctx = { geometry: LIVE_GEOMETRY, parity: LIVE_PARITY, productionDependencies: LIVE_PRODUCTION_DEPS, fontRender: { fontsAvailable: false, emojiStrategyConfirmed: false } };
    const ctxFrozen = JSON.stringify(ctx);
    RE.resolveFromContext(ctx);
    assert(JSON.stringify(ctx) === ctxFrozen, 'resolveFromContext does not mutate its argument');

    // toExportPipelineInput does not mutate its argument.
    const r = RE.evaluate(input);
    const rFrozen = JSON.stringify(r);
    RE.toExportPipelineInput(r);
    assert(JSON.stringify(r) === rFrozen, 'toExportPipelineInput does not mutate its argument');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — source carries no commerce/production CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — no commerce/production CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-render-environment.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT the cover/spine/render/export boundary, so those nouns
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
