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

// MessageBookExportPipeline is a pure function of its inputs and references no sibling
// module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-export-pipeline.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the REAL 8C print-spec contract and the REAL 8A
// production-readiness boundary that the export-pipeline preflight relates to.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
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

// A complete set of "all inputs present" flags (every required export input known).
// Generation capabilities still default false.
const ALL_INPUTS = {
    printSpecValid:         true,
    proofApprovedCurrent:   true,
    pageCountKnown:         true,
    compositionReady:       true,
    parityKnown:            true,
    renderEnvironmentKnown: true,
    exportTargetKnown:      true
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    assert(typeof EP === 'object' && EP !== null, 'KMEngine.MessageBookExportPipeline is an object');
    assert(EP.CONTRACT_VERSION === 'kmep1', 'CONTRACT_VERSION is "kmep1"');
    assert(EP.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(typeof EP.LEVEL === 'object' && EP.LEVEL !== null, 'LEVEL is an object');
    assert(typeof EP.INPUT === 'object' && EP.INPUT !== null, 'INPUT is an object');
    assert(Array.isArray(EP.INPUT_ORDER), 'INPUT_ORDER is an array');
    assert(Array.isArray(EP.REQUIRED_INPUTS), 'REQUIRED_INPUTS is an array');
    assert(typeof EP.BLOCKER === 'object' && EP.BLOCKER !== null, 'BLOCKER is an object');
    assert(typeof EP.STATUS_TONE === 'object' && EP.STATUS_TONE !== null, 'STATUS_TONE is an object');
    assert(EP.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof EP.CAPABILITIES === 'object' && EP.CAPABILITIES !== null, 'CAPABILITIES is an object');
    assert(typeof EP.EXPORT_TARGET === 'object' && EP.EXPORT_TARGET !== null, 'EXPORT_TARGET is an object');
    assert(typeof EP.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof EP.evaluate === 'function', 'evaluate is a function');
    assert(typeof EP.toManufacturingCapabilities === 'function', 'toManufacturingCapabilities is a function');
    assert(typeof EP.describeReadiness === 'function', 'describeReadiness is a function');
    assert(typeof EP.resolveFromContext === 'function', 'resolveFromContext is a function');
    assert(typeof EP.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — LEVEL ladder constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — LEVEL constants', function () {
    const L = makeCtx().MessageBookExportPipeline.LEVEL;

    assert(L.EXPORT_PIPELINE_CONTRACT_KNOWN   === 'export-pipeline-contract-known',   'EXPORT_PIPELINE_CONTRACT_KNOWN');
    assert(L.EXPORT_INPUTS_KNOWN              === 'export-inputs-known',              'EXPORT_INPUTS_KNOWN');
    assert(L.EXPORT_ARTIFACT_GENERATION_READY === 'export-artifact-generation-ready', 'EXPORT_ARTIFACT_GENERATION_READY');
    assert(L.PRINT_FILE_READY                 === 'print-file-ready',                 'PRINT_FILE_READY');
    assert(L.VENDOR_READY                     === 'vendor-ready',                     'VENDOR_READY');
    assert(L.MANUFACTURING_READY              === 'manufacturing-ready',              'MANUFACTURING_READY');
    assert(L.PACKAGING_READY                  === 'packaging-ready',                  'PACKAGING_READY');
    assert(Object.keys(L).length === 7, 'exactly 7 levels');

    try { 'use strict'; L.PRINT_FILE_READY = 'mutated'; } catch (e) { /* strict throw ok */ }
    assert(L.PRINT_FILE_READY === 'print-file-ready', 'LEVEL is immutable (frozen)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — INPUT + INPUT_ORDER + REQUIRED_INPUTS
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — INPUT constants', function () {
    const EP = makeCtx().MessageBookExportPipeline;
    const I  = EP.INPUT;

    assert(I.PRINT_SPEC_VALID         === 'print-spec-valid',         'PRINT_SPEC_VALID');
    assert(I.PROOF_APPROVED_CURRENT   === 'proof-approved-current',   'PROOF_APPROVED_CURRENT');
    assert(I.PAGE_COUNT_KNOWN         === 'page-count-known',         'PAGE_COUNT_KNOWN');
    assert(I.COMPOSITION_READY        === 'composition-ready',        'COMPOSITION_READY');
    assert(I.PARITY_KNOWN             === 'parity-known',             'PARITY_KNOWN');
    assert(I.RENDER_ENVIRONMENT_KNOWN === 'render-environment-known', 'RENDER_ENVIRONMENT_KNOWN');
    assert(I.EXPORT_TARGET_KNOWN      === 'export-target-known',      'EXPORT_TARGET_KNOWN');
    assert(Object.keys(I).length === 7, 'exactly 7 required inputs');

    // INPUT_ORDER lists every input, print-spec first (required before preflight proceeds).
    assert(EP.INPUT_ORDER.length === 7, 'INPUT_ORDER has 7 entries');
    assert(EP.INPUT_ORDER[0] === I.PRINT_SPEC_VALID, 'print spec is first in priority order');
    Object.keys(I).forEach(function (k) {
        assert(EP.INPUT_ORDER.indexOf(I[k]) !== -1, 'INPUT_ORDER includes ' + I[k]);
    });

    // REQUIRED_INPUTS describes each input with a label + producer.
    assert(EP.REQUIRED_INPUTS.length === 7, 'REQUIRED_INPUTS has 7 entries');
    EP.REQUIRED_INPUTS.forEach(function (r) {
        assert(EP.INPUT_ORDER.indexOf(r.input) !== -1, 'REQUIRED_INPUTS entry input is a known input: ' + r.input);
        assert(typeof r.label === 'string' && r.label.length > 0, 'REQUIRED_INPUTS entry has a label');
        assert(typeof r.producer === 'string' && r.producer.length > 0, 'REQUIRED_INPUTS entry has a producer');
    });

    // INPUT_ORDER is a defensive copy via describeBoundary (frozen at source).
    try { 'use strict'; EP.INPUT_ORDER.push('mutated'); } catch (e) { /* ok */ }
    assert(EP.INPUT_ORDER.length === 7, 'INPUT_ORDER is frozen');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — BLOCKER constants + safe messages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — BLOCKER constants + messages', function () {
    const EP = makeCtx().MessageBookExportPipeline;
    const B  = EP.BLOCKER;

    assert(B.PRINT_SPEC_NOT_VALID                === 'print-spec-not-valid',                'PRINT_SPEC_NOT_VALID');
    assert(B.PROOF_NOT_APPROVED_CURRENT          === 'proof-not-approved-current',          'PROOF_NOT_APPROVED_CURRENT');
    assert(B.PAGE_COUNT_UNKNOWN                  === 'page-count-unknown',                  'PAGE_COUNT_UNKNOWN');
    assert(B.COMPOSITION_NOT_READY               === 'composition-not-ready',               'COMPOSITION_NOT_READY');
    assert(B.PARITY_UNKNOWN                      === 'parity-unknown',                      'PARITY_UNKNOWN');
    assert(B.RENDER_ENVIRONMENT_MISSING          === 'render-environment-missing',          'RENDER_ENVIRONMENT_MISSING');
    assert(B.EXPORT_TARGET_UNKNOWN               === 'export-target-unknown',               'EXPORT_TARGET_UNKNOWN');
    assert(B.ARTIFACT_GENERATION_NOT_IMPLEMENTED === 'artifact-generation-not-implemented', 'ARTIFACT_GENERATION_NOT_IMPLEMENTED');
    assert(B.PRINT_FILE_NOT_READY                === 'print-file-not-ready',                'PRINT_FILE_NOT_READY');
    assert(Object.keys(B).length === 9, 'exactly 9 blocker codes');

    // Every code has a non-empty safe message.
    Object.keys(B).forEach(function (k) {
        const msg = EP.blockerMessage(B[k]);
        assert(typeof msg === 'string' && msg.length > 0, 'message present for ' + B[k]);
    });
    assert(EP.blockerMessage('nonsense') === '', 'unknown code → empty message');

    try { 'use strict'; B.PRINT_SPEC_NOT_VALID = 'x'; } catch (e) { /* ok */ }
    assert(B.PRINT_SPEC_NOT_VALID === 'print-spec-not-valid', 'BLOCKER is frozen');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — CAPABILITIES all-false + EXPORT_TARGET + STATUS_TONE
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — CAPABILITIES + EXPORT_TARGET', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // Genuine repo capability — every flag false (no generator, no produced/validated file).
    assert(EP.CAPABILITIES.artifactGenerationImplemented === false, 'artifactGenerationImplemented false');
    assert(EP.CAPABILITIES.printFileValidated === false, 'printFileValidated false');
    assert(EP.CAPABILITIES.vendorConfirmed === false, 'vendorConfirmed false');
    assert(EP.CAPABILITIES.manufacturingImplemented === false, 'manufacturingImplemented false');
    assert(EP.CAPABILITIES.packagingImplemented === false, 'packagingImplemented false');
    assert(Object.values(EP.CAPABILITIES).every(function (v) { return v === false; }), 'every capability is false');
    try { 'use strict'; EP.CAPABILITIES.artifactGenerationImplemented = true; } catch (e) { /* ok */ }
    assert(EP.CAPABILITIES.artifactGenerationImplemented === false, 'CAPABILITIES is frozen');

    // EXPORT_TARGET is a known DIRECTION, never a produced or vendor-confirmed artifact.
    assert(EP.EXPORT_TARGET.format === 'PDF/X-4', 'export target format PDF/X-4');
    assert(EP.EXPORT_TARGET.status === 'internal-direction', 'export target is an internal direction');
    assert(EP.EXPORT_TARGET.vendorConfirmed === false, 'export target not vendor-confirmed');
    assert(EP.EXPORT_TARGET.artifactProduced === false, 'export target artifact not produced');
    assert(EP.EXPORT_TARGET.specSourceOfTruth.indexOf('BOOK_PRODUCTION_DEPS') !== -1, 'export target points at geometry source of truth');

    assert(EP.STATUS_TONE.GATED === 'gated', 'STATUS_TONE.GATED');
    assert(EP.STATUS_TONE.READY === 'ready', 'STATUS_TONE.READY');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — evaluate: empty/null input → contract-known floor, all inputs missing
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — evaluate empty/null', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    [EP.evaluate(), EP.evaluate(null), EP.evaluate({})].forEach(function (r) {
        assert(r.contractVersion === 'kmep1', 'contractVersion echoed');
        assert(r.productTypeId === 'message-book', 'productTypeId echoed');

        // The contract is always known; nothing above it.
        assert(r.exportPipelineContractKnown === true, 'contract-known floor always true');
        assert(r.exportInputsKnown === false, 'no inputs → export-inputs not known');
        assert(r.exportArtifactGenerationReady === false, 'artifact generation not ready');
        assert(r.printFileReady === false, 'print file not ready');
        assert(r.vendorReady === false && r.manufacturingReady === false && r.packagingReady === false,
            'vendor/manufacturing/packaging not ready');

        assert(r.furthestLevel === EP.LEVEL.EXPORT_PIPELINE_CONTRACT_KNOWN, 'furthest level is the contract floor');

        // Every required input is missing, plus the terminal generation blocker.
        assert(r.missingInputs.length === 7, 'all 7 inputs missing');
        assert(r.primaryBlocker === EP.BLOCKER.PRINT_SPEC_NOT_VALID, 'primary blocker is print-spec-not-valid');
        assert(r.blockers[r.blockers.length - 1] === EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED,
            'artifact-generation-not-implemented is the terminal blocker');
        assert(r.blockerMessages.length === r.blockers.length, 'messages 1:1 with blockers');
        assert(r.artifactGenerationImplemented === false, 'artifactGenerationImplemented echoed false');
        assert(r.gatedReason === 'not-implemented', 'gatedReason not-implemented');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — a valid internal print spec is REQUIRED before preflight proceeds (#4)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — print spec required first', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // Every OTHER input present, but no valid print spec → print-spec-not-valid leads.
    const noSpec = EP.evaluate(Object.assign({}, ALL_INPUTS, { printSpecValid: false }));
    assert(noSpec.exportInputsKnown === false, 'no valid spec → inputs not known');
    assert(noSpec.primaryBlocker === EP.BLOCKER.PRINT_SPEC_NOT_VALID,
        'no valid spec → print-spec-not-valid is the primary blocker even with all other inputs');
    assert(noSpec.inputs['print-spec-valid'] === false, 'print-spec-valid input reported false');
    assert(noSpec.inputs['render-environment-known'] === true, 'other inputs still reported present');

    // With a valid spec (and all other inputs) the spec blocker is gone.
    const withSpec = EP.evaluate(ALL_INPUTS);
    assert(withSpec.blockers.indexOf(EP.BLOCKER.PRINT_SPEC_NOT_VALID) === -1,
        'valid spec → print-spec-not-valid no longer present');
    assert(withSpec.exportInputsKnown === true, 'valid spec + all inputs → export-inputs-known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — valid print spec but individual missing export inputs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — valid spec, individual missing inputs', function () {
    const EP = makeCtx().MessageBookExportPipeline;
    const B  = EP.BLOCKER;

    // Each input, when the only missing one, surfaces as the primary blocker.
    const cases = [
        ['proofApprovedCurrent',   B.PROOF_NOT_APPROVED_CURRENT],
        ['pageCountKnown',         B.PAGE_COUNT_UNKNOWN],
        ['compositionReady',       B.COMPOSITION_NOT_READY],
        ['parityKnown',            B.PARITY_UNKNOWN],
        ['renderEnvironmentKnown', B.RENDER_ENVIRONMENT_MISSING],
        ['exportTargetKnown',      B.EXPORT_TARGET_UNKNOWN]
    ];
    cases.forEach(function (pair) {
        const flag = pair[0], expected = pair[1];
        const input = Object.assign({}, ALL_INPUTS);
        input[flag] = false;
        const r = EP.evaluate(input);
        assert(r.exportInputsKnown === false, flag + ' missing → inputs not known');
        assert(r.primaryBlocker === expected, flag + ' missing → primary blocker ' + expected);
        assert(r.exportArtifactGenerationReady === false, flag + ' missing → artifact generation not ready');
        assert(r.printFileReady === false, flag + ' missing → print file not ready');
    });

    // The render-environment input — the genuinely-missing live input — is honest about
    // cover/spine/safe-area.
    const noRender = EP.evaluate(Object.assign({}, ALL_INPUTS, { renderEnvironmentKnown: false }));
    assert(EP.blockerMessage(noRender.primaryBlocker).toLowerCase().indexOf('cover') !== -1,
        'render-environment-missing message names cover/spine/safe-area inputs');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — parity known vs unknown
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — parity known vs unknown', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    const parityUnknown = EP.evaluate(Object.assign({}, ALL_INPUTS, { parityKnown: false }));
    assert(parityUnknown.inputs['parity-known'] === false, 'parity unknown → input false');
    assert(parityUnknown.missingInputs.indexOf('parity-known') !== -1, 'parity unknown listed as missing');
    assert(parityUnknown.exportInputsKnown === false, 'parity unknown → inputs not known');

    const parityKnown = EP.evaluate(ALL_INPUTS);
    assert(parityKnown.inputs['parity-known'] === true, 'parity known → input true');
    assert(parityKnown.missingInputs.indexOf('parity-known') === -1, 'parity known not in missing list');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — all inputs known but artifact generation NOT implemented (#6, #14, #17)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — inputs known, generation not implemented', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // The honest terminal live state: every export input known, but no generator.
    const r = EP.evaluate(ALL_INPUTS);
    assert(r.exportInputsKnown === true, 'all inputs → export-inputs-known');
    assert(r.furthestLevel === EP.LEVEL.EXPORT_INPUTS_KNOWN, 'furthest level is export-inputs-known');
    assert(r.exportArtifactGenerationReady === false, 'artifact generation NOT ready (no generator)');
    assert(r.printFileReady === false, 'print file NOT ready (artifact-free)');
    assert(r.primaryBlocker === EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED,
        'the remaining blocker is artifact-generation-not-implemented');
    assert(r.blockers.length === 1, 'exactly one blocker remains when all inputs are known');
    assert(r.vendorReady === false && r.manufacturingReady === false && r.packagingReady === false,
        'downstream production rungs remain false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — ladder monotonicity invariants (full grid sweep)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — ladder invariants', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // Sweep the 5 generation capabilities (32 combos) under all-inputs-known, asserting
    // each rung implies every lower rung and the contract floor is always known.
    const caps = ['artifactGenerationImplemented', 'printFileValidated', 'vendorConfirmed', 'manufacturingImplemented', 'packagingImplemented'];
    for (let mask = 0; mask < 32; mask++) {
        const input = Object.assign({}, ALL_INPUTS);
        for (let b = 0; b < caps.length; b++) input[caps[b]] = !!(mask & (1 << b));
        const r = EP.evaluate(input);

        assert(r.exportPipelineContractKnown === true, 'contract-known floor always true (mask ' + mask + ')');
        if (r.exportArtifactGenerationReady) assert(r.exportInputsKnown, 'artifact-ready ⇒ inputs-known (mask ' + mask + ')');
        if (r.printFileReady)      assert(r.exportArtifactGenerationReady, 'print-file ⇒ artifact-ready (mask ' + mask + ')');
        if (r.vendorReady)         assert(r.printFileReady, 'vendor ⇒ print-file (mask ' + mask + ')');
        if (r.manufacturingReady)  assert(r.vendorReady, 'manufacturing ⇒ vendor (mask ' + mask + ')');
        if (r.packagingReady)      assert(r.manufacturingReady, 'packaging ⇒ manufacturing (mask ' + mask + ')');
    }

    // Without all inputs, the ladder can never climb past the contract floor regardless
    // of capability flags.
    for (let mask = 0; mask < 32; mask++) {
        const input = Object.assign({}, ALL_INPUTS, { renderEnvironmentKnown: false });
        for (let b = 0; b < caps.length; b++) input[caps[b]] = !!(mask & (1 << b));
        const r = EP.evaluate(input);
        assert(r.exportInputsKnown === false, 'missing input ⇒ never inputs-known (mask ' + mask + ')');
        assert(r.exportArtifactGenerationReady === false, 'missing input ⇒ never artifact-ready (mask ' + mask + ')');
        assert(r.printFileReady === false, 'missing input ⇒ never print-file-ready (mask ' + mask + ')');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — hypothetical generation chain (separation of the rungs)
// ─────────────────────────────────────────────────────────────────────────────
// These are LOGIC tests over injected hypothetical capability flags — they prove the
// ladder is correctly wired so a FUTURE real generator would flow through. They make no
// claim that the repo has any of these capabilities (it does not; the defaults are false).
suite('Suite 12 — hypothetical generation chain', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // Inputs known + (hypothetical) generator implemented → artifact-generation-ready,
    // but print-file still requires a validated file.
    const genOnly = EP.evaluate(Object.assign({}, ALL_INPUTS, { artifactGenerationImplemented: true }));
    assert(genOnly.exportArtifactGenerationReady === true, 'hypothetical generator → artifact-generation-ready');
    assert(genOnly.printFileReady === false, 'artifact-ready alone is NOT print-file-ready');
    assert(genOnly.primaryBlocker === EP.BLOCKER.PRINT_FILE_NOT_READY, 'remaining blocker is print-file-not-ready');

    // + validated file → print-file-ready; vendor/manufacturing/packaging still separate.
    const fileReady = EP.evaluate(Object.assign({}, ALL_INPUTS, {
        artifactGenerationImplemented: true, printFileValidated: true
    }));
    assert(fileReady.printFileReady === true, 'generator + validated file → print-file-ready');
    assert(fileReady.vendorReady === false, 'print-file-ready is NOT vendor-ready');
    assert(fileReady.blockers.length === 0, 'print-file-ready → no export-pipeline blockers remain');

    // Full chain → packaging-ready (only when every flag is set).
    const full = EP.evaluate(Object.assign({}, ALL_INPUTS, {
        artifactGenerationImplemented: true, printFileValidated: true,
        vendorConfirmed: true, manufacturingImplemented: true, packagingImplemented: true
    }));
    assert(full.packagingReady === true, 'every flag set → packaging-ready');
    assert(full.furthestLevel === EP.LEVEL.PACKAGING_READY, 'furthest level packaging-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — toManufacturingCapabilities bridge (honest, never flips true here)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — toManufacturingCapabilities bridge', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // Live / all-inputs-known but no generator → exportPipelineImplemented false.
    const live = EP.toManufacturingCapabilities(EP.evaluate(ALL_INPUTS));
    assert(live.exportPipelineImplemented === false,
        'inputs known but no generator → exportPipelineImplemented false (artifact-free)');
    assert(Object.keys(live).length === 1, 'bridge maps ONLY exportPipelineImplemented');
    assert(live.printSpecSelected === undefined, 'bridge does not set printSpecSelected');
    assert(live.vendorSelected === undefined, 'bridge does not set vendorSelected');

    // Empty / null result → false.
    assert(EP.toManufacturingCapabilities().exportPipelineImplemented === false, 'undefined → false');
    assert(EP.toManufacturingCapabilities(null).exportPipelineImplemented === false, 'null → false');
    assert(EP.toManufacturingCapabilities({}).exportPipelineImplemented === false, 'empty result → false');

    // Derived from exportArtifactGenerationReady: a HYPOTHETICAL artifact-ready result
    // would map to true (proving correctness-by-construction for a future real generator).
    const hypothetical = EP.evaluate(Object.assign({}, ALL_INPUTS, { artifactGenerationImplemented: true }));
    assert(hypothetical.exportArtifactGenerationReady === true, 'hypothetical artifact-ready');
    assert(EP.toManufacturingCapabilities(hypothetical).exportPipelineImplemented === true,
        'bridge tracks exportArtifactGenerationReady (future real generator would flow through)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — describeReadiness copy matrix
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — describeReadiness', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // Live default → gated, with the safe primary blocker message.
    const gated = EP.describeReadiness(EP.evaluate(ALL_INPUTS));
    assert(gated.tone === 'gated', 'inputs-known but no generator → gated tone');
    assert(gated.blocker === EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED, 'gated blocker is artifact-generation-not-implemented');
    assert(gated.detail === EP.blockerMessage(EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED), 'gated detail is the safe blocker message');
    assert(gated.headline.length > 0, 'gated headline present');

    // No inputs → gated with print-spec-not-valid.
    const empty = EP.describeReadiness(EP.evaluate());
    assert(empty.tone === 'gated' && empty.blocker === EP.BLOCKER.PRINT_SPEC_NOT_VALID, 'empty → gated print-spec-not-valid');

    // null result degrades safely.
    const nul = EP.describeReadiness(null);
    assert(nul.tone === 'gated' && typeof nul.headline === 'string', 'null result → safe gated view-model');

    // The ready tone is reachable ONLY for a print-file-ready result (a real validated
    // file) — unreachable with the genuine all-false CAPABILITIES.
    const ready = EP.describeReadiness(EP.evaluate(Object.assign({}, ALL_INPUTS, {
        artifactGenerationImplemented: true, printFileValidated: true
    })));
    assert(ready.tone === 'ready', 'print-file-ready (hypothetical) → ready tone');
    // Confirm it cannot be reached from the genuine default capability set.
    const liveCapsView = EP.resolveFromContext({
        printSpec: { internalSpecValid: true, knownSpecId: true, pageBounds: { pageCountValid: true, boundsKnown: true, withinBounds: true, parityOk: true } },
        proofApprovedCurrent: true, compositionReady: true, renderEnvironmentKnown: true
    });
    assert(liveCapsView.display.tone === 'gated', 'genuine default capabilities → never ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — describeBoundary disclaims everything above the preflight
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — describeBoundary', function () {
    const EP = makeCtx().MessageBookExportPipeline;
    const d  = EP.describeBoundary();

    assert(d.version === 'kmep1', 'describeBoundary version');
    assert(typeof d.decides === 'string' && d.decides.length > 0, 'decides described');
    assert(typeof d.doesNot === 'string' && d.doesNot.length > 0, 'doesNot described');
    assert(d.artifactFree === true, 'artifactFree true');
    assert(d.recordedOnDevice === true, 'recordedOnDevice true');

    assert(typeof d.distinctFrom.printSpecSelection === 'string', 'distinctFrom.printSpecSelection');
    assert(typeof d.distinctFrom.manufacturingReadiness === 'string', 'distinctFrom.manufacturingReadiness');
    assert(typeof d.distinctFrom.printFileGeneration === 'string', 'distinctFrom.printFileGeneration');

    ['export-pipeline-contract', 'export-inputs', 'artifact-generation', 'print-file', 'vendor', 'manufacturing'].forEach(function (x) {
        assert(d.separates.indexOf(x) !== -1, 'separates includes "' + x + '"');
    });
    ['artifact-generation', 'print-file-generation', 'vendor-confirmation', 'manufacturing', 'packaging'].forEach(function (x) {
        assert(d.notImplemented.indexOf(x) !== -1, 'notImplemented includes "' + x + '"');
    });
    assert(d.requiredInputs.length === 7, 'requiredInputs lists 7 inputs');

    // Fresh object each call (defensive copy).
    EP.describeBoundary().separates.push('mutated');
    assert(EP.describeBoundary().separates.indexOf('mutated') === -1, 'describeBoundary returns a fresh object');
    EP.describeBoundary().requiredInputs.push('mutated');
    assert(EP.describeBoundary().requiredInputs.indexOf('mutated') === -1, 'requiredInputs is a fresh copy');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — resolveFromContext maps already-decided result objects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — resolveFromContext', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    // A valid 8C-shaped print-spec result + an approved proof + ready composition + render env.
    const validPrintSpec = {
        internalSpecValid: true,
        knownSpecId: true,
        pageBounds: { pageCountValid: true, boundsKnown: true, withinBounds: true, parityOk: true }
    };
    const view = EP.resolveFromContext({
        printSpec: validPrintSpec,
        proofApprovedCurrent: true,
        compositionReady: true,
        renderEnvironmentKnown: true
    });
    assert(view.input.printSpecValid === true, 'maps internalSpecValid → printSpecValid');
    assert(view.input.pageCountKnown === true, 'maps pageBounds.withinBounds → pageCountKnown');
    assert(view.input.parityKnown === true, 'maps pageBounds.parityOk presence → parityKnown');
    assert(view.input.exportTargetKnown === true, 'known internal spec → exportTargetKnown');
    assert(view.result.exportInputsKnown === true, 'all facts → export-inputs-known');
    assert(view.result.primaryBlocker === EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED,
        'default (all-false) capabilities → artifact-generation-not-implemented');
    assert(view.display.tone === 'gated', 'gated display');

    // No print spec → print-spec-not-valid, and page/parity/target also unknown (no spec context).
    const noSpec = EP.resolveFromContext({ printSpec: { internalSpecValid: false }, proofApprovedCurrent: true });
    assert(noSpec.input.printSpecValid === false, 'no valid spec');
    assert(noSpec.input.pageCountKnown === false, 'no spec → page count not known');
    assert(noSpec.input.parityKnown === false, 'no spec → parity not known');
    assert(noSpec.input.exportTargetKnown === false, 'no known spec → export target not known');
    assert(noSpec.result.primaryBlocker === EP.BLOCKER.PRINT_SPEC_NOT_VALID, 'no valid spec → print-spec-not-valid');

    // The render-environment input is genuinely missing by default (live state).
    const liveMissingRender = EP.resolveFromContext({ printSpec: validPrintSpec, proofApprovedCurrent: true, compositionReady: true });
    assert(liveMissingRender.input.renderEnvironmentKnown === false, 'render env defaults missing');
    assert(liveMissingRender.result.primaryBlocker === EP.BLOCKER.RENDER_ENVIRONMENT_MISSING,
        'live state (no render env) → render-environment-missing');

    // Genuine default capabilities keep every generation rung false.
    assert(view.result.printFileReady === false && view.result.vendorReady === false, 'default caps → no generation rungs');

    // Empty / null args degrade safely.
    assert(EP.resolveFromContext().result.exportPipelineContractKnown === true, 'empty args → safe floor');
    assert(EP.resolveFromContext(null).result.primaryBlocker === EP.BLOCKER.PRINT_SPEC_NOT_VALID, 'null args → print-spec-not-valid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — purity: deterministic, no input mutation, fresh arrays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — purity', function () {
    const EP = makeCtx().MessageBookExportPipeline;

    const input = Object.assign({}, ALL_INPUTS);
    const frozen = JSON.stringify(input);
    const a = EP.evaluate(input);
    const b = EP.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'evaluate is deterministic');
    assert(JSON.stringify(input) === frozen, 'evaluate does not mutate its input');

    // Returned blockers array is fresh.
    const c = EP.evaluate();
    c.blockers.push('mutated');
    assert(EP.evaluate().blockers.indexOf('mutated') === -1, 'evaluate returns a fresh blockers array');

    // toManufacturingCapabilities does not mutate its argument.
    const r = EP.evaluate(input);
    const rFrozen = JSON.stringify(r);
    EP.toManufacturingCapabilities(r);
    assert(JSON.stringify(r) === rFrozen, 'toManufacturingCapabilities does not mutate its argument');

    // resolveFromContext does not mutate its argument.
    const ctx = { printSpec: { internalSpecValid: true, knownSpecId: true, pageBounds: { pageCountValid: true, boundsKnown: true, withinBounds: true, parityOk: true } }, proofApprovedCurrent: true };
    const ctxFrozen = JSON.stringify(ctx);
    EP.resolveFromContext(ctx);
    assert(JSON.stringify(ctx) === ctxFrozen, 'resolveFromContext does not mutate its argument');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — source carries no commerce/production CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — no commerce/production CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-export-pipeline.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT the export/print/vendor boundary, so those nouns legitimately
    // appear. What must never appear is an ACTION that performs commerce/production, or a
    // call-to-action that implies it.
    ['add to cart', 'addtocart', 'place order', 'placeorder', 'create order', 'createorder',
     'submit order', 'submitorder', 'order now', 'ordernow', 'buy now', 'buynow',
     'pay now', 'paynow', 'checkout session', 'createcheckout', 'send to vendor',
     'submit to vendor', 'send to print', 'print now', 'generate pdf', 'generatepdf',
     'charge(', 'stripe', 'paypal', 'add to bag', 'download('].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source contains no commerce/production CTA/action "' + term + '"');
    });

    // Fully pure: no network/DOM/storage/random/clock side effects at all (this module has
    // no record builders, so it uses no Date either).
    ['fetch(', 'xmlhttprequest', 'localstorage', 'sessionstorage', 'document.',
     'window.location', 'math.random(', 'new date', 'date.now'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source has no side-effect token "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — integration with the REAL 8C print spec + 8A manufacturing readiness
// ─────────────────────────────────────────────────────────────────────────────
// The honesty thesis of 8E: reaching `export-inputs-known` advances only the KNOWLEDGE
// layer; it does NOT advance the 8A production ladder past `export-pipeline-not-implemented`,
// because no print file can be produced. Proven against the REAL sibling modules.
suite('Suite 19 — integration with MessageBookPrintSpec + MessageBookManufacturingReadiness', function () {
    const KM = makeIntegrationCtx();
    const PS = KM.MessageBookPrintSpec;
    const MR = KM.MessageBookManufacturingReadiness;
    const EP = KM.MessageBookExportPipeline;

    // A real, valid 8C internal print-spec selection for a proof under the page limit.
    const psResult = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 });
    assert(psResult.internalSpecValid === true, 'real print spec is valid');

    // The 8E preflight reaches export-inputs-known with the real print-spec facts +
    // an approved proof + ready composition + render-environment inputs supplied.
    const ep = EP.resolveFromContext({
        printSpec: psResult,
        proofApprovedCurrent: true,
        compositionReady: true,
        renderEnvironmentKnown: true
    });
    assert(ep.result.exportInputsKnown === true, '8E reaches export-inputs-known with real 8C facts');
    assert(ep.result.printFileReady === false, '8E never reports print-file-ready (artifact-free)');
    assert(ep.result.primaryBlocker === EP.BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED,
        '8E terminal blocker is artifact-generation-not-implemented');

    // The lower layers (7A/7D-7E) are satisfied; map BOTH the real 8C print-spec capability
    // and the 8E export-pipeline capability into 8A's existing capabilities input path.
    const READY_LOWER = { readiness: { checkoutEligible: true }, intent: { active: true } };
    const caps = Object.assign(
        {},
        PS.toManufacturingCapabilities(psResult),  // { printSpecSelected: true }
        EP.toManufacturingCapabilities(ep.result)  // { exportPipelineImplemented: false }
    );
    assert(caps.printSpecSelected === true, '8C bridge → printSpecSelected true');
    assert(caps.exportPipelineImplemented === false, '8E bridge → exportPipelineImplemented false (artifact-free)');

    const out = MR.resolveFromReadiness(Object.assign({ capabilities: caps }, READY_LOWER));
    // The print spec cleared `print-spec-not-selected`; 8E did NOT advance past export.
    assert(out.result.exportSpecKnown === true, 'valid print spec → 8A export-spec-known');
    assert(out.result.primaryBlocker === 'export-pipeline-not-implemented',
        '8E reaching export-inputs-known does NOT advance 8A past export-pipeline-not-implemented');
    assert(out.result.printFileReady === false, '8A print-file-ready stays false');
    assert(out.result.vendorReady === false && out.result.manufacturingReady === false && out.result.packagingReady === false,
        '8A vendor/manufacturing/packaging stay false');

    // Honesty cross-check: feeding the 8E bridge NEVER flips 8A's exportPipelineImplemented
    // true with the genuine capabilities — it is identical to the 8B/8D no-export-capability path.
    const noExportCaps = MR.resolveFromReadiness(Object.assign({ capabilities: PS.toManufacturingCapabilities(psResult) }, READY_LOWER));
    assert(noExportCaps.result.primaryBlocker === 'export-pipeline-not-implemented',
        'without the export capability 8A is already at export-pipeline-not-implemented');
    assert(out.result.primaryBlocker === noExportCaps.result.primaryBlocker,
        '8E bridge leaves the 8A live answer unchanged (does not advance it)');

    // A HYPOTHETICAL real generator (artifactGenerationImplemented + printFileValidated) is the
    // ONLY thing that would let exportPipelineImplemented flow true into 8A — proving the
    // wiring is correct-by-construction while this package never produces that state.
    const futureEp = EP.evaluate(Object.assign({}, ALL_INPUTS, { artifactGenerationImplemented: true }));
    const futureCaps = Object.assign({}, PS.toManufacturingCapabilities(psResult), EP.toManufacturingCapabilities(futureEp));
    assert(futureCaps.exportPipelineImplemented === true, 'hypothetical generator → exportPipelineImplemented true');
    const futureOut = MR.resolveFromReadiness(Object.assign({ capabilities: futureCaps }, READY_LOWER));
    assert(futureOut.result.printFileReady === true, 'hypothetical generator → 8A print-file-ready (wiring correct)');
    // ...but with the genuine repo defaults that never happens.
    assert(EP.CAPABILITIES.artifactGenerationImplemented === false, 'genuine default keeps the generator absent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
