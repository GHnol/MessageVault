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

// MessageBookManufacturingReadiness is a pure function of its inputs and references no
// sibling module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-manufacturing-readiness.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the real lower layers feeding this boundary:
// the 7A/7B checkout-readiness gate and the 7D/7E local order-intent shell.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/proof-approval-state.js');
    load(ctx, 'src/products/proof-preview-contract.js');
    load(ctx, 'src/products/book-composition.js');
    load(ctx, 'src/products/message-book-readiness.js');
    load(ctx, 'src/products/message-book-order-intent.js');
    load(ctx, 'src/products/message-book-print-spec.js');
    load(ctx, 'src/products/message-book-manufacturing-readiness.js');
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

// The state where every production capability is genuinely implemented AND the lower
// layers are satisfied — the only input that reaches full readiness. It is NOT the
// live state (the live capability flags are all false); it exists to prove the ladder
// climbs correctly when inputs allow.
const ALL = Object.freeze({
    checkoutEligible:          true,
    hasLocalIntent:            true,
    printSpecSelected:         true,
    exportPipelineImplemented: true,
    vendorSelected:            true,
    manufacturingImplemented:  true,
    packagingImplemented:      true
});

// The live state: checkout-eligible with a local intent saved, but no production
// capability implemented (CAPABILITIES are all false).
const LIVE_ELIGIBLE = Object.freeze({ checkoutEligible: true, hasLocalIntent: true });

function withInput(over) {
    return Object.assign({}, ALL, over);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    assert(typeof MR === 'object' && MR !== null, 'KMEngine.MessageBookManufacturingReadiness is an object');
    assert(MR.CONTRACT_VERSION === 'kmmr1', 'CONTRACT_VERSION is "kmmr1"');
    assert(MR.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(typeof MR.LEVEL === 'object' && MR.LEVEL !== null, 'LEVEL is an object');
    assert(typeof MR.BLOCKER === 'object' && MR.BLOCKER !== null, 'BLOCKER is an object');
    assert(typeof MR.STATUS_TONE === 'object' && MR.STATUS_TONE !== null, 'STATUS_TONE is an object');
    assert(MR.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof MR.CAPABILITIES === 'object' && MR.CAPABILITIES !== null, 'CAPABILITIES is an object');
    assert(MR.LOCAL_INTENT_REQUIRED === true, 'LOCAL_INTENT_REQUIRED is true');
    assert(typeof MR.evaluate === 'function', 'evaluate is a function');
    assert(typeof MR.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof MR.describeReadiness === 'function', 'describeReadiness is a function');
    assert(typeof MR.resolveFromReadiness === 'function', 'resolveFromReadiness is a function');
    assert(typeof MR.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — LEVEL constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — LEVEL constants', function () {
    const L = makeCtx().MessageBookManufacturingReadiness.LEVEL;

    assert(L.PRODUCTION_BOUNDARY_KNOWN === 'production-boundary-known', 'PRODUCTION_BOUNDARY_KNOWN');
    assert(L.EXPORT_SPEC_KNOWN         === 'export-spec-known',         'EXPORT_SPEC_KNOWN');
    assert(L.PRINT_FILE_READY          === 'print-file-ready',          'PRINT_FILE_READY');
    assert(L.VENDOR_READY              === 'vendor-ready',              'VENDOR_READY');
    assert(L.MANUFACTURING_READY       === 'manufacturing-ready',       'MANUFACTURING_READY');
    assert(L.PACKAGING_READY           === 'packaging-ready',           'PACKAGING_READY');

    // Frozen.
    try { 'use strict'; L.PACKAGING_READY = 'mutated'; } catch (e) { /* strict throw ok */ }
    assert(L.PACKAGING_READY === 'packaging-ready', 'LEVEL is immutable (frozen)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — BLOCKER constants + safe messages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — BLOCKER constants', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;
    const B  = MR.BLOCKER;

    assert(B.CHECKOUT_NOT_ELIGIBLE           === 'checkout-not-eligible',           'CHECKOUT_NOT_ELIGIBLE');
    assert(B.NO_LOCAL_INTENT                 === 'no-local-intent',                 'NO_LOCAL_INTENT');
    assert(B.PRINT_SPEC_NOT_SELECTED         === 'print-spec-not-selected',         'PRINT_SPEC_NOT_SELECTED');
    assert(B.EXPORT_PIPELINE_NOT_IMPLEMENTED === 'export-pipeline-not-implemented', 'EXPORT_PIPELINE_NOT_IMPLEMENTED');
    assert(B.VENDOR_NOT_SELECTED             === 'vendor-not-selected',             'VENDOR_NOT_SELECTED');
    assert(B.MANUFACTURING_NOT_IMPLEMENTED   === 'manufacturing-not-implemented',   'MANUFACTURING_NOT_IMPLEMENTED');
    assert(B.PACKAGING_NOT_IMPLEMENTED       === 'packaging-not-implemented',       'PACKAGING_NOT_IMPLEMENTED');

    // Every blocker code resolves to a non-empty safe message.
    Object.keys(B).forEach(function (k) {
        const msg = MR.blockerMessage(B[k]);
        assert(typeof msg === 'string' && msg.length > 0, B[k] + ' has a non-empty message');
    });
    assert(MR.blockerMessage('not-a-code') === '', 'unknown blocker code → empty message');
    assert(MR.blockerMessage(undefined) === '', 'undefined blocker code → empty message');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — CAPABILITIES reflect current genuine (all-false) repo state (#3, #4)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — CAPABILITIES are all false', function () {
    const C = makeCtx().MessageBookManufacturingReadiness.CAPABILITIES;

    assert(C.printSpecSelected         === false, 'printSpecSelected false (no selected print spec)');
    assert(C.exportPipelineImplemented === false, 'exportPipelineImplemented false (no export pipeline)');
    assert(C.vendorSelected            === false, 'vendorSelected false (no confirmed vendor)');
    assert(C.manufacturingImplemented  === false, 'manufacturingImplemented false (no manufacturing)');
    assert(C.packagingImplemented      === false, 'packagingImplemented false (no packaging)');

    const keys = Object.keys(C);
    assert(keys.length === 5, 'exactly 5 capability flags');
    assert(keys.every(function (k) { return C[k] === false; }), 'every capability flag is false');

    try { 'use strict'; C.vendorSelected = true; } catch (e) { /* strict throw ok */ }
    assert(C.vendorSelected === false, 'CAPABILITIES is immutable (frozen)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — default/empty input → boundary known, everything else blocked
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — empty input', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;
    const r  = MR.evaluate();

    assert(r.contractVersion === 'kmmr1', 'contractVersion echoed');
    assert(r.productTypeId === 'message-book', 'productTypeId echoed');
    assert(r.productionBoundaryKnown === true, 'production boundary is always known (the floor)');
    assert(r.exportSpecKnown === false, 'export spec not known');
    assert(r.printFileReady === false, 'print file not ready');
    assert(r.vendorReady === false, 'vendor not ready');
    assert(r.manufacturingReady === false, 'manufacturing not ready');
    assert(r.packagingReady === false, 'packaging not ready');
    assert(r.gatedReason === 'not-implemented', 'gatedReason is not-implemented');
    assert(r.furthestLevel === 'production-boundary-known', 'furthest level is the floor');

    // All seven blockers, checkout-not-eligible first.
    assert(r.blockers.length === 7, 'all seven blockers present for empty input');
    assert(r.primaryBlocker === 'checkout-not-eligible', 'primary blocker is checkout-not-eligible');
    assert(r.blockerMessages.length === r.blockers.length, 'blockerMessages aligns 1:1 with blockers');
    assert(r.blockerMessages.every(function (m) { return typeof m === 'string' && m.length > 0; }),
        'every blocker message is non-empty');
    assert(r.requireLocalIntent === true, 'requireLocalIntent echoes the policy default (true)');

    // evaluate(null) is equivalent to empty input (defensive).
    const rn = MR.evaluate(null);
    assert(rn.blockers.length === 7 && rn.primaryBlocker === 'checkout-not-eligible', 'evaluate(null) is defensive');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — missing checkout eligibility blocks production readiness (#4)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — checkout eligibility is required', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    // Even with every other requirement met, no checkout eligibility blocks everything.
    const r = MR.evaluate(withInput({ checkoutEligible: false }));
    assert(r.exportSpecKnown === false, 'no checkout eligibility → export spec not known');
    assert(r.printFileReady === false && r.vendorReady === false, 'no checkout eligibility → nothing above ready');
    assert(r.manufacturingReady === false && r.packagingReady === false, 'no checkout eligibility → manufacturing/packaging false');
    assert(r.blockers.indexOf('checkout-not-eligible') === 0, 'checkout-not-eligible is the primary blocker');
    assert(r.furthestLevel === 'production-boundary-known', 'furthest level stays the floor');

    // checkout-not-eligible outranks a missing local intent.
    const r2 = MR.evaluate(withInput({ checkoutEligible: false, hasLocalIntent: false }));
    assert(r2.primaryBlocker === 'checkout-not-eligible', 'checkout-not-eligible outranks no-local-intent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — missing local intent blocks production readiness when required (#5)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — local intent requirement', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    // Default policy requires a local intent: eligible + no intent → no-local-intent.
    const r = MR.evaluate(withInput({ hasLocalIntent: false }));
    assert(r.exportSpecKnown === false, 'eligible but no local intent → export spec not known');
    assert(r.blockers.indexOf('no-local-intent') !== -1, 'no-local-intent blocker present');
    assert(r.primaryBlocker === 'no-local-intent', 'no-local-intent is primary (checkout eligible)');

    // With the intent saved, the no-local-intent blocker clears (other gates may remain).
    const r2 = MR.evaluate(withInput({ hasLocalIntent: true }));
    assert(r2.blockers.indexOf('no-local-intent') === -1, 'intent saved → no-local-intent clears');
    assert(r2.exportSpecKnown === true, 'eligible + intent + print spec → export spec known');

    // The policy can be turned off per-call: then local intent is not required.
    const r3 = MR.evaluate(withInput({ hasLocalIntent: false, requireLocalIntent: false }));
    assert(r3.requireLocalIntent === false, 'requireLocalIntent echoes the per-call override');
    assert(r3.blockers.indexOf('no-local-intent') === -1, 'override off → no no-local-intent blocker');
    assert(r3.exportSpecKnown === true, 'override off → export spec known without intent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — missing print/export spec blocks production readiness (#6)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — print spec required', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const r = MR.evaluate(withInput({ printSpecSelected: false }));
    assert(r.exportSpecKnown === false, 'no print spec → export spec not known');
    assert(r.printFileReady === false, 'no print spec → print file not ready');
    assert(r.blockers.indexOf('print-spec-not-selected') !== -1, 'print-spec-not-selected blocker present');
    assert(r.primaryBlocker === 'print-spec-not-selected', 'print-spec-not-selected is primary when checkout+intent satisfied');
    assert(r.furthestLevel === 'production-boundary-known', 'furthest level stays the floor without a print spec');

    const r2 = MR.evaluate(withInput({ printSpecSelected: true, exportPipelineImplemented: false }));
    assert(r2.exportSpecKnown === true, 'print spec selected → export spec known');
    assert(r2.furthestLevel === 'export-spec-known', 'furthest level reaches export-spec-known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — export pipeline gate
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — export pipeline required for a print file', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const r = MR.evaluate(withInput({ exportPipelineImplemented: false }));
    assert(r.exportSpecKnown === true, 'spec known');
    assert(r.printFileReady === false, 'no export pipeline → print file not ready');
    assert(r.vendorReady === false, 'no export pipeline → vendor not ready');
    assert(r.blockers.indexOf('export-pipeline-not-implemented') !== -1, 'export-pipeline blocker present');
    assert(r.primaryBlocker === 'export-pipeline-not-implemented', 'export-pipeline is primary at this rung');
    assert(r.furthestLevel === 'export-spec-known', 'furthest level is export-spec-known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — vendor gate blocks vendor/manufacturing readiness (#7)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — vendor required', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const r = MR.evaluate(withInput({ vendorSelected: false }));
    assert(r.printFileReady === true, 'print file ready (pipeline implemented)');
    assert(r.vendorReady === false, 'no vendor → vendor not ready');
    assert(r.manufacturingReady === false, 'no vendor → manufacturing not ready');
    assert(r.packagingReady === false, 'no vendor → packaging not ready');
    assert(r.primaryBlocker === 'vendor-not-selected', 'vendor-not-selected is primary at this rung');
    assert(r.furthestLevel === 'print-file-ready', 'furthest level is print-file-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — manufacturing gate
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — manufacturing required', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const r = MR.evaluate(withInput({ manufacturingImplemented: false }));
    assert(r.vendorReady === true, 'vendor ready');
    assert(r.manufacturingReady === false, 'no manufacturing → manufacturing not ready');
    assert(r.packagingReady === false, 'no manufacturing → packaging not ready');
    assert(r.primaryBlocker === 'manufacturing-not-implemented', 'manufacturing-not-implemented is primary at this rung');
    assert(r.furthestLevel === 'vendor-ready', 'furthest level is vendor-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — packaging gate
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — packaging required', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const r = MR.evaluate(withInput({ packagingImplemented: false }));
    assert(r.manufacturingReady === true, 'manufacturing ready');
    assert(r.packagingReady === false, 'no packaging → packaging not ready');
    assert(r.primaryBlocker === 'packaging-not-implemented', 'packaging-not-implemented is the only/primary blocker');
    assert(r.blockers.length === 1, 'exactly one blocker remains');
    assert(r.furthestLevel === 'manufacturing-ready', 'furthest level is manufacturing-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — full ladder reaches packaging-ready only when everything is met
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — full readiness', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;
    const r  = MR.evaluate(ALL);

    assert(r.productionBoundaryKnown === true, 'boundary known');
    assert(r.exportSpecKnown === true, 'export spec known');
    assert(r.printFileReady === true, 'print file ready');
    assert(r.vendorReady === true, 'vendor ready');
    assert(r.manufacturingReady === true, 'manufacturing ready');
    assert(r.packagingReady === true, 'packaging ready');
    assert(r.blockers.length === 0, 'no blockers when everything is implemented');
    assert(r.primaryBlocker === null, 'no primary blocker');
    assert(r.furthestLevel === 'packaging-ready', 'furthest level is packaging-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — ladder invariants swept over the full input grid
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — ladder invariants over the full grid', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;
    const L  = MR.LEVEL;

    let packagingMatchesNoBlockers = true;
    let monotone                   = true;
    let furthestMatches            = true;
    let primaryMatches             = true;
    let messagesAlign              = true;
    let boundaryAlwaysKnown        = true;

    // 7 booleans: checkout, intent, printSpec, exportPipeline, vendor, manufacturing, packaging.
    for (let mask = 0; mask < 128; mask++) {
        const input = {
            checkoutEligible:          !!(mask & 1),
            hasLocalIntent:            !!(mask & 2),
            printSpecSelected:         !!(mask & 4),
            exportPipelineImplemented: !!(mask & 8),
            vendorSelected:            !!(mask & 16),
            manufacturingImplemented:  !!(mask & 32),
            packagingImplemented:      !!(mask & 64)
        };
        const r = MR.evaluate(input);

        // packagingReady (full readiness) iff there are no blockers.
        if (r.packagingReady !== (r.blockers.length === 0)) packagingMatchesNoBlockers = false;

        // Each rung true implies every lower rung true.
        const rungs = [r.productionBoundaryKnown, r.exportSpecKnown, r.printFileReady,
                       r.vendorReady, r.manufacturingReady, r.packagingReady];
        for (let k = 1; k < rungs.length; k++) {
            if (rungs[k] && !rungs[k - 1]) monotone = false;
        }

        // furthestLevel is the highest true rung.
        const order = [L.PRODUCTION_BOUNDARY_KNOWN, L.EXPORT_SPEC_KNOWN, L.PRINT_FILE_READY,
                       L.VENDOR_READY, L.MANUFACTURING_READY, L.PACKAGING_READY];
        let highest = 0;
        for (let k = 0; k < rungs.length; k++) { if (rungs[k]) highest = k; }
        if (r.furthestLevel !== order[highest]) furthestMatches = false;

        // primaryBlocker is blockers[0] (or null).
        const expectedPrimary = r.blockers.length ? r.blockers[0] : null;
        if (r.primaryBlocker !== expectedPrimary) primaryMatches = false;

        // blockerMessages aligns 1:1 and is all non-empty.
        if (r.blockerMessages.length !== r.blockers.length) messagesAlign = false;
        if (!r.blockerMessages.every(function (m) { return typeof m === 'string' && m.length > 0; })) messagesAlign = false;

        if (r.productionBoundaryKnown !== true) boundaryAlwaysKnown = false;
    }

    assert(packagingMatchesNoBlockers, 'packagingReady === (no blockers) across the full grid');
    assert(monotone, 'each rung implies every lower rung across the full grid');
    assert(furthestMatches, 'furthestLevel is the highest true rung across the full grid');
    assert(primaryMatches, 'primaryBlocker === blockers[0] across the full grid');
    assert(messagesAlign, 'blockerMessages aligns 1:1 and is non-empty across the full grid');
    assert(boundaryAlwaysKnown, 'productionBoundaryKnown is always true across the full grid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — blocker priority order
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — blocker priority order', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    // With nothing satisfied, blockers appear in the fixed priority order.
    const expected = [
        'checkout-not-eligible', 'no-local-intent', 'print-spec-not-selected',
        'export-pipeline-not-implemented', 'vendor-not-selected',
        'manufacturing-not-implemented', 'packaging-not-implemented'
    ];
    const r = MR.evaluate({ checkoutEligible: false, hasLocalIntent: false });
    assert(JSON.stringify(r.blockers) === JSON.stringify(expected), 'blockers are in the fixed priority order');

    // Satisfying lower requirements shifts the primary blocker up the ladder.
    assert(MR.evaluate(withInput({ checkoutEligible: false })).primaryBlocker === 'checkout-not-eligible', '1: checkout');
    assert(MR.evaluate(withInput({ hasLocalIntent: false })).primaryBlocker === 'no-local-intent', '2: intent');
    assert(MR.evaluate(withInput({ printSpecSelected: false })).primaryBlocker === 'print-spec-not-selected', '3: print spec');
    assert(MR.evaluate(withInput({ exportPipelineImplemented: false })).primaryBlocker === 'export-pipeline-not-implemented', '4: export');
    assert(MR.evaluate(withInput({ vendorSelected: false })).primaryBlocker === 'vendor-not-selected', '5: vendor');
    assert(MR.evaluate(withInput({ manufacturingImplemented: false })).primaryBlocker === 'manufacturing-not-implemented', '6: manufacturing');
    assert(MR.evaluate(withInput({ packagingImplemented: false })).primaryBlocker === 'packaging-not-implemented', '7: packaging');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — separation: with current CAPABILITIES, production stays false even when
// checkout-eligible AND a local intent is saved (#2, #3)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — production stays gated under live capabilities', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    // resolveFromReadiness applies the all-false CAPABILITIES by default.
    const live = MR.resolveFromReadiness({
        readiness: { checkoutEligible: true },
        intent:    { active: true }
    });
    assert(live.result.exportSpecKnown === false, 'checkout-eligible + intent still NOT export-spec-known (no print spec)');
    assert(live.result.printFileReady === false, 'still not print-file-ready');
    assert(live.result.vendorReady === false, 'still not vendor-ready');
    assert(live.result.manufacturingReady === false, 'still not manufacturing-ready');
    assert(live.result.packagingReady === false, 'still not packaging-ready');
    assert(live.result.primaryBlocker === 'print-spec-not-selected',
        'lower layers satisfied → the next real blocker is print-spec-not-selected');
    assert(live.result.blockers.indexOf('checkout-not-eligible') === -1, 'no checkout blocker (eligible)');
    assert(live.result.blockers.indexOf('no-local-intent') === -1, 'no intent blocker (saved)');
    assert(live.display.tone === 'gated', 'live status is gated, never ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — describeReadiness copy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — describeReadiness copy', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    // Every gated result → gated tone with the safe primary blocker message.
    [
        { checkoutEligible: false },
        withInput({ hasLocalIntent: false }),
        withInput({ printSpecSelected: false }),
        withInput({ vendorSelected: false })
    ].forEach(function (input, idx) {
        const view = MR.describeReadiness(MR.evaluate(input));
        assert(view.tone === 'gated', 'case ' + idx + ' → gated tone');
        assert(view.headline === 'Print production is not available yet', 'case ' + idx + ' → gated headline');
        assert(typeof view.detail === 'string' && view.detail.length > 0, 'case ' + idx + ' → non-empty detail');
        assert(typeof view.blocker === 'string' && view.blocker.length > 0, 'case ' + idx + ' → carries primary blocker code');
    });

    // Full readiness → ready tone (reachable only via all-implemented input).
    const ready = MR.describeReadiness(MR.evaluate(ALL));
    assert(ready.tone === 'ready', 'all implemented → ready tone');
    assert(ready.blocker === null, 'ready → no blocker');
    assert(ready.detail.length > 0, 'ready → non-empty detail');

    // Defensive: null/empty result degrades safely to gated.
    const dn = MR.describeReadiness(null);
    assert(dn.tone === 'gated' && dn.blocker === null, 'null result → safe gated view');

    // The copy never makes an unsafe commerce/production claim.
    const blob = JSON.stringify([
        MR.describeReadiness(MR.evaluate({})),
        MR.describeReadiness(MR.evaluate(ALL))
    ]).toLowerCase();
    ['buy', 'pay', 'order now', 'add to cart', 'ship', 'print now', 'ready to print', 'in production']
        .forEach(function (term) {
            assert(blob.indexOf(term) === -1, 'display copy avoids unsafe claim "' + term + '"');
        });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — describeBoundary separates the four layers and disclaims production (#2)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — describeBoundary', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;
    const d  = MR.describeBoundary();

    assert(d.version === 'kmmr1', 'version echoed');
    assert(typeof d.doesNot === 'string' && d.doesNot.length > 0, 'doesNot statement present');
    assert(typeof d.distinctFrom === 'object' && d.distinctFrom !== null, 'distinctFrom present');
    assert(typeof d.distinctFrom.proofApproval === 'string', 'distinct from proof approval');
    assert(typeof d.distinctFrom.checkoutEligibility === 'string', 'distinct from checkout eligibility');
    assert(typeof d.distinctFrom.localOrderIntent === 'string', 'distinct from local order intent');
    assert(Array.isArray(d.separateGates) && d.separateGates.indexOf('vendor') !== -1, 'separateGates lists vendor');
    assert(Array.isArray(d.notImplemented) && d.notImplemented.length >= 5, 'notImplemented lists the gated steps');

    // No affirmative commerce/production field on the boundary descriptor. (The
    // doesNot disclaimer deliberately names shipping/manufacturing in the NEGATIVE, so
    // this checks for field names that would only appear as affirmative values.)
    const blob = JSON.stringify(d).toLowerCase();
    ['price', 'cart', 'payment', 'invoice', 'ordernumber', 'order-number']
        .forEach(function (term) {
            assert(blob.indexOf(term) === -1, 'boundary descriptor has no "' + term + '" field');
        });

    // Defensive copy: mutating the returned object does not affect the next call.
    d.separateGates.push('mutated');
    assert(MR.describeBoundary().separateGates.indexOf('mutated') === -1, 'describeBoundary returns a fresh object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — resolveFromReadiness bridge
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — resolveFromReadiness bridge', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    // Maps checkoutEligible + intent.active + CAPABILITIES into the evaluate input.
    const out = MR.resolveFromReadiness({ readiness: { checkoutEligible: true }, intent: { active: true } });
    assert(out.input.checkoutEligible === true, 'maps readiness.checkoutEligible');
    assert(out.input.hasLocalIntent === true, 'maps intent.active → hasLocalIntent');
    assert(out.input.printSpecSelected === false, 'applies CAPABILITIES.printSpecSelected (false)');
    assert(out.input.vendorSelected === false, 'applies CAPABILITIES.vendorSelected (false)');
    assert(typeof out.result === 'object' && out.result !== null, 'attaches result');
    assert(typeof out.display === 'object' && out.display !== null, 'attaches display');

    // A non-eligible readiness → checkout-not-eligible primary.
    const blocked = MR.resolveFromReadiness({ readiness: { checkoutEligible: false }, intent: { active: false } });
    assert(blocked.result.primaryBlocker === 'checkout-not-eligible', 'ineligible readiness → checkout blocker');

    // intent.active strictly: any non-true value is treated as no intent.
    const noIntent = MR.resolveFromReadiness({ readiness: { checkoutEligible: true }, intent: {} });
    assert(noIntent.input.hasLocalIntent === false, 'missing intent.active → no local intent');
    assert(noIntent.result.primaryBlocker === 'no-local-intent', 'eligible, no intent → no-local-intent');

    // Null-safe across the board.
    const empty = MR.resolveFromReadiness();
    assert(empty.input.checkoutEligible === false && empty.result.primaryBlocker === 'checkout-not-eligible',
        'resolveFromReadiness() is defensive');
    const partial = MR.resolveFromReadiness({});
    assert(partial.result.primaryBlocker === 'checkout-not-eligible', 'empty args → checkout blocker');

    // A caller may inject a hypothetical capability set (e.g. for a future package's
    // tests) without the module hard-coding it.
    const hypothetical = MR.resolveFromReadiness({
        readiness: { checkoutEligible: true },
        intent:    { active: true },
        capabilities: {
            printSpecSelected: true, exportPipelineImplemented: true,
            vendorSelected: true, manufacturingImplemented: true, packagingImplemented: true
        }
    });
    assert(hypothetical.result.packagingReady === true, 'injected full capabilities → fully ready');
    assert(hypothetical.display.tone === 'ready', 'injected full capabilities → ready tone');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — purity: deterministic, no input mutation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 20 — purity', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const input = withInput({ vendorSelected: false });
    const frozen = JSON.stringify(input);
    const a = MR.evaluate(input);
    const b = MR.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'evaluate is deterministic');
    assert(JSON.stringify(input) === frozen, 'evaluate does not mutate its input');

    const args = { readiness: { checkoutEligible: true }, intent: { active: true } };
    const argsFrozen = JSON.stringify(args);
    MR.resolveFromReadiness(args);
    assert(JSON.stringify(args) === argsFrozen, 'resolveFromReadiness does not mutate its argument');

    // Returned blockers array is a fresh array (mutating it does not affect the next call).
    a.blockers.push('mutated');
    assert(MR.evaluate(input).blockers.indexOf('mutated') === -1, 'evaluate returns a fresh blockers array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 21 — source carries no commerce/production CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 21 — no commerce/production CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-manufacturing-readiness.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT the print/export/vendor/manufacturing/packaging boundary, so
    // those nouns legitimately appear. What must never appear is an ACTION that performs
    // commerce/production, or a call-to-action that implies it.
    ['add to cart', 'addtocart', 'place order', 'placeorder', 'create order', 'createorder',
     'submit order', 'submitorder', 'order now', 'ordernow', 'buy now', 'buynow',
     'pay now', 'paynow', 'checkout session', 'createcheckout', 'send to vendor',
     'submit to vendor', 'send to print', 'print now', 'generate pdf', 'generatepdf',
     'charge(', 'stripe', 'paypal', 'add to bag', 'download('].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source contains no commerce/production CTA/action "' + term + '"');
    });

    // Fully pure: no network/DOM/storage/random/clock side effects at all (this module
    // has no record builders, so unlike the order-intent shell it uses no Date either).
    ['fetch(', 'xmlhttprequest', 'localstorage', 'sessionstorage', 'document.',
     'window.location', 'math.random(', 'new date', 'date.now'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source has no side-effect token "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 22 — integration with the real lower layers (7A gate + 7D/7E intent) (#14)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 22 — integration with MessageBookReadiness + MessageBookOrderIntent', function () {
    const KM  = makeIntegrationCtx();
    const MBR = KM.MessageBookReadiness;
    const OI  = KM.MessageBookOrderIntent;
    const MR  = KM.MessageBookManufacturingReadiness;

    // A genuinely checkout-eligible proof, via the real 7A gate.
    const eligibleResult = MBR.evaluate({
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
    });
    assert(eligibleResult.checkoutEligible === true, '7A gate certifies the eligible proof');

    // A real, active local intent on that eligible proof, via the real 7D/7E shell.
    const started   = OI.startIntent(OI.create().state, eligibleResult);
    const intentView = OI.resolve(started.state, eligibleResult);
    assert(intentView.active === true, '7D/7E intent is active on the eligible proof');

    // Even with the lower layers fully satisfied, production stays gated on the
    // not-implemented capabilities — the genuine current state (#3).
    const live = MR.resolveFromReadiness({ readiness: eligibleResult, intent: intentView });
    assert(live.result.exportSpecKnown === false, 'real eligible + intent → still not export-spec-known');
    assert(live.result.manufacturingReady === false && live.result.packagingReady === false,
        'real eligible + intent → manufacturing/packaging still false');
    assert(live.result.primaryBlocker === 'print-spec-not-selected',
        'with checkout + intent satisfied, print-spec-not-selected is the next real blocker');
    assert(live.display.tone === 'gated', 'live integration status is gated');

    // Every real ineligible 7A result blocks production with checkout-not-eligible, and
    // the intent shell reports the note inactive under it.
    [
        { hasContent: false },                                    // no content
        { exceedsPageLimit: true },                               // over page limit
        { approvalStatus: 'pending-review' },                     // pending
        { approvalStatus: 'approved', approvalStale: true },      // 5D staleness
        { preflightBlockingFailures: 1 }                          // blocking preflight failure
    ].forEach(function (over) {
        const r = MBR.evaluate(Object.assign({
            engineSupported: true, hasContent: true, exceedsPageLimit: false,
            approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
        }, over));
        assert(r.checkoutEligible === false, 'precondition: ' + JSON.stringify(over) + ' is ineligible');

        const view = OI.resolve(started.state, r);
        assert(view.active === false, 'intent inactive under ineligible readiness ' + JSON.stringify(over));

        const prod = MR.resolveFromReadiness({ readiness: r, intent: view });
        assert(prod.result.primaryBlocker === 'checkout-not-eligible',
            'production blocked by checkout-not-eligible under ineligible readiness ' + JSON.stringify(over));
        assert(prod.result.packagingReady === false, 'production not ready under ineligible readiness ' + JSON.stringify(over));
    });

    // 5D staleness drives the boundary end-to-end: an approved proof that goes stale
    // flips production back to checkout-not-eligible.
    const freshApproved = MBR.evaluate({
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
    });
    const wentStale = MBR.evaluate({
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: true, preflightBlockingFailures: 0
    });
    assert(MR.resolveFromReadiness({ readiness: freshApproved, intent: OI.resolve(started.state, freshApproved) })
        .result.primaryBlocker === 'print-spec-not-selected', 'fresh approval → print-spec is the next blocker');
    assert(MR.resolveFromReadiness({ readiness: wentStale, intent: OI.resolve(started.state, wentStale) })
        .result.primaryBlocker === 'checkout-not-eligible', '5D staleness → production re-blocked on checkout');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 23 — 8B live status-hook input mapping (mirrors renderBookManufacturingStatus)
// ─────────────────────────────────────────────────────────────────────────────
// The live hook calls, verbatim:
//   MMR.resolveFromReadiness({
//       readiness: <7A/7B MessageBookReadiness result>,
//       intent:    { active: !!(orderIntentView && orderIntentView.active) }
//   })
// where orderIntentView is the 7D/7E MessageBookOrderIntent.resolve(...) view. This suite
// reproduces that exact mapping against the real lower layers and the defensive coercion
// of a missing/undefined intent view.
suite('Suite 23 — 8B live status-hook input mapping', function () {
    const KM  = makeIntegrationCtx();
    const MBR = KM.MessageBookReadiness;
    const OI  = KM.MessageBookOrderIntent;
    const MR  = KM.MessageBookManufacturingReadiness;

    // Exactly what index.html does: build active from a (possibly missing) resolve view.
    function liveActive(orderIntentView) {
        return !!(orderIntentView && orderIntentView.active);
    }
    function liveResolve(readinessResult, orderIntentView) {
        return MR.resolveFromReadiness({
            readiness: readinessResult,
            intent:    { active: liveActive(orderIntentView) }
        });
    }

    const eligible = MBR.evaluate({
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
    });
    const ineligible = MBR.evaluate({
        engineSupported: true, hasContent: false, exceedsPageLimit: false,
        approvalStatus: 'none', approvalStale: false, preflightBlockingFailures: 0
    });
    assert(eligible.checkoutEligible === true,  'precondition: eligible 7A result');
    assert(ineligible.checkoutEligible === false, 'precondition: ineligible 7A result');

    // (#3) checkout-not-eligible: ineligible readiness → checkout blocker, gated tone.
    const noneRec = OI.create().state;
    const ineligView = OI.resolve(noneRec, ineligible);
    const a = liveResolve(ineligible, ineligView);
    assert(a.result.primaryBlocker === 'checkout-not-eligible', '#3 ineligible readiness → checkout-not-eligible');
    assert(a.display.tone === 'gated', '#3 ineligible readiness → gated tone');

    // (#4) no-local-intent: eligible readiness, but no saved local intent (record 'none').
    const eligNoIntentView = OI.resolve(noneRec, eligible);
    assert(eligNoIntentView.active === false, 'no saved intent → resolve view inactive');
    const b = liveResolve(eligible, eligNoIntentView);
    assert(b.input.checkoutEligible === true, '#4 maps eligible readiness through');
    assert(b.input.hasLocalIntent === false, '#4 inactive intent view → hasLocalIntent false');
    assert(b.result.primaryBlocker === 'no-local-intent', '#4 eligible + no intent → no-local-intent');
    assert(b.display.tone === 'gated', '#4 eligible + no intent → gated tone');

    // (#5) eligible + active local intent → the next production blocker, never "ready".
    const started = OI.startIntent(noneRec, eligible);
    const activeView = OI.resolve(started.state, eligible);
    assert(activeView.active === true, 'started intent on eligible proof → active view');
    const c = liveResolve(eligible, activeView);
    assert(c.input.hasLocalIntent === true, '#5 active intent view → hasLocalIntent true');
    assert(c.result.primaryBlocker === 'print-spec-not-selected', '#5 eligible + active intent → print-spec-not-selected');
    assert(c.result.exportSpecKnown === false && c.result.packagingReady === false,
        '#5 production rungs stay false under live capabilities');
    assert(c.display.tone === 'gated', '#5 eligible + active intent → still gated');

    // Defensive coercion the live code performs: a missing/undefined/null intent view is
    // treated as no local intent (so an eligible proof falls to no-local-intent, never ready).
    assert(liveActive(undefined) === false, 'undefined intent view → active false');
    assert(liveActive(null) === false, 'null intent view → active false');
    assert(liveResolve(eligible, undefined).result.primaryBlocker === 'no-local-intent',
        'eligible + undefined intent view → no-local-intent');
    assert(liveResolve(eligible, {}).result.primaryBlocker === 'no-local-intent',
        'eligible + empty intent view → no-local-intent');

    // The live hook passes no capabilities, so every live-reachable state stays gated.
    [a, b, c].forEach(function (r) {
        assert(r.result.packagingReady === false, 'live mapping never reaches packaging readiness');
        assert(r.display.tone === 'gated', 'live mapping is gated in every reachable state');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 24 — 8B copy / status matrix (what the read-only panel renders)
// ─────────────────────────────────────────────────────────────────────────────
// The panel renders display.headline + display.detail with the book-manufacturing-<tone>
// class. This locks the exact safe copy for every live-reachable state and proves no copy
// implies production is ready or invites a commerce/production action.
suite('Suite 24 — 8B copy / status matrix', function () {
    const MR = makeCtx().MessageBookManufacturingReadiness;

    const GATED_HEADLINE = 'Print production is not available yet';

    // The four live-reachable input combinations (checkout eligibility × local intent),
    // resolved through the live bridge with the default all-false CAPABILITIES.
    const MATRIX = [
        { elig: false, active: false, blocker: 'checkout-not-eligible',
          detail: 'This Message Book is not checkout-eligible yet.' },
        { elig: false, active: true,  blocker: 'checkout-not-eligible',
          detail: 'This Message Book is not checkout-eligible yet.' },
        { elig: true,  active: false, blocker: 'no-local-intent',
          detail: 'No local intent to continue has been saved on this device yet.' },
        { elig: true,  active: true,  blocker: 'print-spec-not-selected',
          detail: 'A print production specification has not been selected yet.' }
    ];

    const renderedCopy = [];
    MATRIX.forEach(function (row) {
        const out = MR.resolveFromReadiness({
            readiness: { checkoutEligible: row.elig },
            intent:    { active: row.active }
        });
        const d = out.display;
        const tag = 'elig=' + row.elig + ',active=' + row.active;
        assert(d.tone === 'gated', tag + ' → gated tone (#6 never ready)');
        assert(d.headline === GATED_HEADLINE, tag + ' → safe gated headline');
        assert(d.blocker === row.blocker, tag + ' → primary blocker ' + row.blocker);
        assert(d.detail === row.detail, tag + ' → exact safe detail');
        assert(out.result.packagingReady === false, tag + ' → production not ready');
        renderedCopy.push(d.headline, d.detail);
    });

    // (#6, #12) No live-reachable copy may imply production is ready or invite a
    // commerce/production action. Scan the actual rendered strings.
    const blob = renderedCopy.join('  ').toLowerCase();
    ['ready to print', 'order now', 'buy now', 'buy ', 'add to cart', 'add to bag',
     'pay now', 'purchase', 'checkout now', 'print now', 'ship ', 'shipping',
     'now available', 'in production', 'production complete', 'manufactured'].forEach(function (term) {
        assert(blob.indexOf(term) === -1, 'rendered copy contains no unsafe claim/CTA "' + term + '"');
    });

    // The live default (all-false CAPABILITIES) can never produce the ready tone, no matter
    // the lower-layer state — describeReadiness only goes ready when packagingReady is true.
    [true, false].forEach(function (elig) {
        [true, false].forEach(function (active) {
            const out = MR.resolveFromReadiness({ readiness: { checkoutEligible: elig }, intent: { active: active } });
            assert(out.display.tone !== 'ready', 'live default never reaches ready tone (elig=' + elig + ',active=' + active + ')');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 25 — 8C print-spec input path: the real bridge clears print-spec-not-selected
// ─────────────────────────────────────────────────────────────────────────────
// 8C adds KMEngine.MessageBookPrintSpec, whose toManufacturingCapabilities() feeds
// this boundary's EXISTING capabilities input path (8A is not modified). A valid
// internal print spec must move the primary blocker from `print-spec-not-selected`
// to `export-pipeline-not-implemented`, and no further. Proven against the real 7A
// gate + 7D/7E intent shell + 8C print-spec contract.
suite('Suite 25 — 8C print-spec input path', function () {
    const KM  = makeIntegrationCtx();
    const MBR = KM.MessageBookReadiness;
    const OI  = KM.MessageBookOrderIntent;
    const PS  = KM.MessageBookPrintSpec;
    const MR  = KM.MessageBookManufacturingReadiness;

    assert(typeof PS === 'object' && PS !== null, 'MessageBookPrintSpec is available to the integration');

    // Build the genuine lower layers: a checkout-eligible proof with an active intent.
    const eligible = MBR.evaluate({
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
    });
    const started    = OI.startIntent(OI.create().state, eligible);
    const activeView = OI.resolve(started.state, eligible);
    assert(eligible.checkoutEligible === true && activeView.active === true,
        'precondition: checkout-eligible proof with an active local intent');

    // Without a print spec, the live default keeps 8A at print-spec-not-selected.
    const defaultOut = MR.resolveFromReadiness({ readiness: eligible, intent: activeView });
    assert(defaultOut.result.primaryBlocker === 'print-spec-not-selected',
        'no print spec (live default) → print-spec-not-selected');

    // The real 8C bridge for a valid internal spec → printSpecSelected true → 8A clears
    // print-spec-not-selected and advances exactly one rung to export-pipeline-not-implemented.
    const validSel  = PS.evaluate({ selectedSpecId: PS.INTERNAL_SPEC_ID, pageCount: 120, maxPages: 400 });
    assert(validSel.internalSpecValid === true, 'precondition: valid internal print spec');
    const caps = PS.toManufacturingCapabilities(validSel);
    assert(caps.printSpecSelected === true && Object.keys(caps).length === 1,
        'bridge flips only printSpecSelected');

    const withSpec = MR.resolveFromReadiness({ readiness: eligible, intent: activeView, capabilities: caps });
    assert(withSpec.result.exportSpecKnown === true, 'valid internal spec → export-spec-known');
    assert(withSpec.result.primaryBlocker === 'export-pipeline-not-implemented',
        'valid internal spec → next blocker is export-pipeline-not-implemented');
    assert(withSpec.result.blockers.indexOf('print-spec-not-selected') === -1,
        'valid internal spec → print-spec-not-selected cleared');

    // No higher rung advances: vendor / manufacturing / packaging readiness stay false.
    assert(withSpec.result.printFileReady === false, 'print file still not ready');
    assert(withSpec.result.vendorReady === false, 'vendor still not ready');
    assert(withSpec.result.manufacturingReady === false, 'manufacturing still not ready');
    assert(withSpec.result.packagingReady === false, 'packaging still not ready');
    assert(withSpec.display.tone === 'gated', '8A status stays gated even with a valid print spec');

    // A selected-but-invalid spec (over the page limit) does NOT clear the blocker.
    const overCaps = PS.toManufacturingCapabilities(
        PS.evaluate({ selectedSpecId: PS.INTERNAL_SPEC_ID, pageCount: 9999, maxPages: 400 })
    );
    const overOut = MR.resolveFromReadiness({ readiness: eligible, intent: activeView, capabilities: overCaps });
    assert(overOut.result.primaryBlocker === 'print-spec-not-selected',
        'selected-but-invalid internal spec → 8A still print-spec-not-selected');

    // A valid spec never jumps the lower-layer queue: an ineligible proof stays at
    // checkout-not-eligible even with printSpecSelected true.
    const ineligible = MBR.evaluate({
        engineSupported: true, hasContent: false, exceedsPageLimit: false,
        approvalStatus: 'none', approvalStale: false, preflightBlockingFailures: 0
    });
    const ineligibleOut = MR.resolveFromReadiness({
        readiness: ineligible, intent: { active: false }, capabilities: caps
    });
    assert(ineligibleOut.result.primaryBlocker === 'checkout-not-eligible',
        'valid spec under ineligible proof → checkout-not-eligible (print spec does not advance the lower gates)');

    // 8A's own default behavior is unchanged: a no-capabilities call still reports
    // print-spec-not-selected (8B live path is unaffected by 8C).
    const eightBLive = MR.resolveFromReadiness({ readiness: eligible, intent: { active: true } });
    assert(eightBLive.result.primaryBlocker === 'print-spec-not-selected',
        '8B live path (no capabilities) is unchanged by 8C');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 26 — 8D live status-hook mapping (renderBookManufacturingStatus with print spec)
// ─────────────────────────────────────────────────────────────────────────────
// 8D feeds renderBookManufacturingStatus a third argument (the 8C print-spec result) and
// maps it to a capabilities object via toManufacturingCapabilities. This suite reproduces
// that exact call against the real 7A gate, 7D/7E shell, and 8C contract, and proves: no
// print spec keeps print-spec-not-selected; a valid spec advances to
// export-pipeline-not-implemented; an invalid spec does not; and a no-capabilities call
// (the 8B path) is unchanged.
suite('Suite 26 — 8D print-spec live status-hook mapping', function () {
    const KM  = makeIntegrationCtx();
    const MBR = KM.MessageBookReadiness;
    const OI  = KM.MessageBookOrderIntent;
    const PS  = KM.MessageBookPrintSpec;
    const MR  = KM.MessageBookManufacturingReadiness;

    // Exactly what index.html renderBookManufacturingStatus does in 8D.
    function liveManufacturing(readinessResult, orderIntentView, printSpecResult) {
        const capabilities = (PS && PS.toManufacturingCapabilities && printSpecResult)
            ? PS.toManufacturingCapabilities(printSpecResult)
            : undefined;
        return MR.resolveFromReadiness({
            readiness:    readinessResult,
            intent:       { active: !!(orderIntentView && orderIntentView.active) },
            capabilities: capabilities
        });
    }

    // Lower layers satisfied: checkout-eligible proof with an active local intent.
    const eligible = MBR.evaluate({
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
    });
    const activeIntent = OI.resolve(OI.startIntent(OI.create().state, eligible).state, eligible);
    assert(eligible.checkoutEligible === true && activeIntent.active === true, 'precondition: eligible + active intent');

    // No print-spec result (null) → 8B default → print-spec-not-selected.
    assert(liveManufacturing(eligible, activeIntent, null).result.primaryBlocker === 'print-spec-not-selected',
        'no print-spec result → print-spec-not-selected');

    // The exact 8B call shape (third arg omitted/undefined) is unchanged.
    assert(liveManufacturing(eligible, activeIntent, undefined).result.primaryBlocker === 'print-spec-not-selected',
        '8B no-capabilities path unchanged');

    // Valid internal spec result → advances to export-pipeline-not-implemented.
    const validRes = PS.evaluate({ selectedSpecId: PS.INTERNAL_SPEC_ID, pageCount: 120, maxPages: 400 });
    const withSpec = liveManufacturing(eligible, activeIntent, validRes);
    assert(withSpec.result.primaryBlocker === 'export-pipeline-not-implemented',
        'valid print-spec result → export-pipeline-not-implemented');
    assert(withSpec.result.exportSpecKnown === true && withSpec.result.packagingReady === false,
        'valid print-spec result → export-spec-known, no higher rung');
    assert(withSpec.display.tone === 'gated', 'valid print-spec result → still gated');

    // Over-limit print-spec result → does not advance.
    const overRes = PS.evaluate({ selectedSpecId: PS.INTERNAL_SPEC_ID, pageCount: 9999, maxPages: 400 });
    assert(liveManufacturing(eligible, activeIntent, overRes).result.primaryBlocker === 'print-spec-not-selected',
        'over-limit print-spec result → still print-spec-not-selected');

    // A valid spec never advances when a lower gate is unmet.
    const ineligible = MBR.evaluate({
        engineSupported: true, hasContent: false, exceedsPageLimit: false,
        approvalStatus: 'none', approvalStale: false, preflightBlockingFailures: 0
    });
    assert(liveManufacturing(ineligible, { active: false }, validRes).result.primaryBlocker === 'checkout-not-eligible',
        'valid spec under ineligible proof → checkout-not-eligible');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
