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

// MessageBookMaterialEvidence is a pure function of its inputs and references no sibling
// module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-material-evidence.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the REAL 8H spine-input contract that the accepted
// material-evidence adapter feeds into.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-material-evidence.js');
    load(ctx, 'src/products/message-book-spine-inputs.js');
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

// A HYPOTHETICAL, explicitly-labelled evidence fixture — every required vendor / material
// fact supplied AND accepted, with an identified source. The live repo contains NO such
// accepted evidence (Suites 3, 13): the vendor register records "vendor confirmed: No" and
// the paper/board thickness are "capture when vendor is confirmed". This fixture exists
// only to prove the full path works when genuine accepted evidence is supplied.
const ACCEPTED_EVIDENCE = Object.freeze({
    source: Object.freeze({ identity: 'vendor-quote-fixture', version: 'v1', date: '2026-06-27' }),
    stockConfirmed:          true,
    bindingConfirmed:        true,
    paperThicknessPerLeafIn: 0.004,
    boardThicknessIn:        0.118,
    accepted:                true
});
// Spine width that 8H derives for ACCEPTED_EVIDENCE @ 120 pages: 120 * 0.004 + 0.118 = 0.598.
const ACCEPTED_SPINE_WIDTH = 0.598;

function withEvidence(overrides) {
    return Object.assign({}, ACCEPTED_EVIDENCE, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    assert(typeof ME === 'object' && ME !== null, 'KMEngine.MessageBookMaterialEvidence is an object');
    assert(ME.CONTRACT_VERSION === 'kmme1', 'CONTRACT_VERSION is "kmme1"');
    assert(ME.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(typeof ME.LEVEL === 'object' && ME.LEVEL !== null, 'LEVEL is an object');
    assert(typeof ME.STATE === 'object' && ME.STATE !== null, 'STATE is an object');
    assert(typeof ME.BLOCKER === 'object' && ME.BLOCKER !== null, 'BLOCKER is an object');
    assert(Array.isArray(ME.BLOCKER_ORDER), 'BLOCKER_ORDER is an array');
    assert(Array.isArray(ME.REQUIRED_EVIDENCE), 'REQUIRED_EVIDENCE is an array');
    assert(typeof ME.STATUS_TONE === 'object' && ME.STATUS_TONE !== null, 'STATUS_TONE is an object');
    assert(ME.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof ME.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof ME.evaluate === 'function', 'evaluate is a function');
    assert(typeof ME.resolveFromContext === 'function', 'resolveFromContext is a function');
    assert(typeof ME.toSpineInputMaterial === 'function', 'toSpineInputMaterial is a function');
    assert(typeof ME.describeReadiness === 'function', 'describeReadiness is a function');
    assert(typeof ME.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — LEVEL / STATE / BLOCKER constants + frozen
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — constants', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;
    const L = ME.LEVEL, S = ME.STATE, B = ME.BLOCKER;

    assert(L.MATERIAL_EVIDENCE_CONTRACT_KNOWN === 'material-evidence-contract-known', 'LEVEL contract-known');
    assert(L.MATERIAL_EVIDENCE_ACCEPTED === 'material-evidence-accepted', 'LEVEL evidence-accepted');

    assert(S.INTERNAL_MATERIAL_DIRECTION_KNOWN === 'internal-material-direction-known', 'STATE internal direction');
    assert(S.EVIDENCE_SOURCE_PRESENT === 'evidence-source-present', 'STATE evidence-source-present');
    assert(S.EVIDENCE_SOURCE_IDENTIFIED === 'evidence-source-identified', 'STATE evidence-source-identified');
    assert(S.STOCK_EVIDENCE_PRESENT === 'stock-evidence-present', 'STATE stock-evidence-present');
    assert(S.BINDING_EVIDENCE_PRESENT === 'binding-evidence-present', 'STATE binding-evidence-present');
    assert(S.PAPER_THICKNESS_EVIDENCE_PRESENT === 'paper-thickness-evidence-present', 'STATE paper-thickness-evidence-present');
    assert(S.BOARD_THICKNESS_EVIDENCE_PRESENT === 'board-thickness-evidence-present', 'STATE board-thickness-evidence-present');
    assert(S.EVIDENCE_ACCEPTED === 'evidence-accepted', 'STATE evidence-accepted');

    assert(B.MATERIAL_EVIDENCE_MISSING === 'material-evidence-missing', 'BLOCKER material-evidence-missing');
    assert(B.EVIDENCE_SOURCE_MISSING === 'evidence-source-missing', 'BLOCKER evidence-source-missing');
    assert(B.STOCK_EVIDENCE_MISSING === 'stock-evidence-missing', 'BLOCKER stock-evidence-missing');
    assert(B.BINDING_EVIDENCE_MISSING === 'binding-evidence-missing', 'BLOCKER binding-evidence-missing');
    assert(B.PAPER_THICKNESS_EVIDENCE_MISSING === 'paper-thickness-evidence-missing', 'BLOCKER paper-thickness-evidence-missing');
    assert(B.BOARD_THICKNESS_EVIDENCE_MISSING === 'board-thickness-evidence-missing', 'BLOCKER board-thickness-evidence-missing');
    assert(B.MATERIAL_EVIDENCE_NOT_ACCEPTED === 'material-evidence-not-accepted', 'BLOCKER material-evidence-not-accepted');

    // BLOCKER_ORDER covers every BLOCKER exactly once, evidence-missing first, not-accepted last.
    assert(ME.BLOCKER_ORDER.length === Object.keys(B).length, 'BLOCKER_ORDER lists every blocker');
    assert(ME.BLOCKER_ORDER[0] === B.MATERIAL_EVIDENCE_MISSING, 'BLOCKER_ORDER starts with material-evidence-missing');
    assert(ME.BLOCKER_ORDER[ME.BLOCKER_ORDER.length - 1] === B.MATERIAL_EVIDENCE_NOT_ACCEPTED, 'BLOCKER_ORDER ends with material-evidence-not-accepted');

    // Frozen enums.
    assert(Object.isFrozen(L) && Object.isFrozen(S) && Object.isFrozen(B), 'LEVEL/STATE/BLOCKER frozen');
    assert(Object.isFrozen(ME.BLOCKER_ORDER) && Object.isFrozen(ME.REQUIRED_EVIDENCE), 'BLOCKER_ORDER/REQUIRED_EVIDENCE frozen');
    assert(ME.REQUIRED_EVIDENCE.length === Object.keys(S).length, 'REQUIRED_EVIDENCE one per state');

    // Every blocker has a safe non-empty message.
    Object.keys(B).forEach(function (k) {
        assert(typeof ME.blockerMessage(B[k]) === 'string' && ME.blockerMessage(B[k]).length > 0, 'message for ' + B[k]);
    });
    assert(ME.blockerMessage('nope') === '', 'unknown blocker → empty string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — evaluate: no evidence → every blocker, material-evidence-missing primary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — no evidence', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    // No evidence at all → contract floor, every input blocker except not-accepted (there is
    // nothing to accept yet), material-evidence-missing primary.
    [ME.evaluate(), ME.evaluate(null), ME.evaluate({})].forEach(function (r, idx) {
        assert(r.materialEvidenceContractKnown === true, '#' + idx + ' contract is the floor (always known)');
        assert(r.allEvidenceAccepted === false, '#' + idx + ' aggregate false with nothing supplied');
        assert(r.evidencePresent === false, '#' + idx + ' evidence not present');
        assert(r.primaryBlocker === ME.BLOCKER.MATERIAL_EVIDENCE_MISSING, '#' + idx + ' primary blocker is material-evidence-missing');
        assert(r.furthestLevel === ME.LEVEL.MATERIAL_EVIDENCE_CONTRACT_KNOWN, '#' + idx + ' furthest level is the contract floor');
        assert(r.blockers.indexOf(ME.BLOCKER.MATERIAL_EVIDENCE_MISSING) !== -1, '#' + idx + ' material-evidence-missing emitted');
        assert(r.blockers.indexOf(ME.BLOCKER.EVIDENCE_SOURCE_MISSING) !== -1, '#' + idx + ' evidence-source-missing emitted');
        assert(r.blockers.indexOf(ME.BLOCKER.STOCK_EVIDENCE_MISSING) !== -1, '#' + idx + ' stock-evidence-missing emitted');
        assert(r.blockers.indexOf(ME.BLOCKER.BINDING_EVIDENCE_MISSING) !== -1, '#' + idx + ' binding-evidence-missing emitted');
        assert(r.blockers.indexOf(ME.BLOCKER.PAPER_THICKNESS_EVIDENCE_MISSING) !== -1, '#' + idx + ' paper-thickness-evidence-missing emitted');
        assert(r.blockers.indexOf(ME.BLOCKER.BOARD_THICKNESS_EVIDENCE_MISSING) !== -1, '#' + idx + ' board-thickness-evidence-missing emitted');
        // Nothing to accept yet → not-accepted blocker is NOT emitted (it only applies to complete evidence).
        assert(r.blockers.indexOf(ME.BLOCKER.MATERIAL_EVIDENCE_NOT_ACCEPTED) === -1, '#' + idx + ' not-accepted blocker absent with no evidence');
        assert(r.blockerMessages.length === r.blockers.length, '#' + idx + ' a message per blocker');
        // No adapter values invented.
        assert(r.acceptedStockConfirmed === false && r.acceptedBindingConfirmed === false, '#' + idx + ' no accepted confirmations');
        assert(r.acceptedPaperThicknessPerLeafIn === null && r.acceptedBoardThicknessIn === null, '#' + idx + ' no accepted thicknesses');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — malformed evidence → facts missing, not invented
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — malformed evidence', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    // Non-object evidence is treated as absent.
    ['', 'evidence', 0, 42, true, []].forEach(function (bad) {
        const r = ME.evaluate({ evidence: bad });
        if (Array.isArray(bad)) {
            // An array is an object; it simply carries no recognized fields → present but empty.
            assert(r.evidenceSourceIdentified === false, 'array evidence → source not identified');
            assert(r.allEvidenceAccepted === false, 'array evidence → aggregate false');
        } else {
            assert(r.evidencePresent === false, 'non-object evidence (' + JSON.stringify(bad) + ') → not present');
            assert(r.primaryBlocker === ME.BLOCKER.MATERIAL_EVIDENCE_MISSING, 'non-object evidence → material-evidence-missing');
        }
    });

    // Evidence object present but source malformed / partial.
    const noSource = ME.evaluate({ evidence: { stockConfirmed: true } });
    assert(noSource.evidencePresent === true, 'evidence object present');
    assert(noSource.evidenceSourcePresent === false, 'no source object → source not present');
    assert(noSource.evidenceSourceIdentified === false, 'no source object → not identified');
    assert(noSource.blockers.indexOf(ME.BLOCKER.MATERIAL_EVIDENCE_MISSING) === -1, 'present evidence → no material-evidence-missing');
    assert(noSource.blockers.indexOf(ME.BLOCKER.EVIDENCE_SOURCE_MISSING) !== -1, 'no source → evidence-source-missing');

    // Partial source (missing version / date) is not identified.
    const partialSource = ME.evaluate({ evidence: { source: { identity: 'x' } } });
    assert(partialSource.evidenceSourcePresent === true, 'source object present');
    assert(partialSource.evidenceSourceIdentified === false, 'partial source (no version/date) → not identified');
    assert(partialSource.blockers.indexOf(ME.BLOCKER.EVIDENCE_SOURCE_MISSING) !== -1, 'partial source → evidence-source-missing');

    // Empty-string source fields are not identified.
    const blankSource = ME.evaluate({ evidence: { source: { identity: '', version: 'v1', date: '2026-06-27' } } });
    assert(blankSource.evidenceSourceIdentified === false, 'empty-string identity → not identified');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — evidence source missing (acceptance #3)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — evidence source missing', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    // Everything supplied + accepted EXCEPT a source → source blocker, aggregate false,
    // and acceptance is void (acceptance requires provenance).
    const r = ME.evaluate({ evidence: withEvidence({ source: undefined }) });
    assert(r.evidenceSourceIdentified === false, 'no source → not identified');
    assert(r.blockers.indexOf(ME.BLOCKER.EVIDENCE_SOURCE_MISSING) !== -1, 'evidence-source-missing emitted');
    assert(r.evidenceAccepted === false, 'acceptance void without an identified source');
    assert(r.allEvidenceAccepted === false, 'aggregate false without source');
    assert(r.acceptedStockConfirmed === false, 'no stock confirmation fed without an identified source');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — stock evidence missing (acceptance #4)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — stock evidence missing', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    [undefined, false, 'yes', 1].forEach(function (bad) {
        const r = ME.evaluate({ evidence: withEvidence({ stockConfirmed: bad }) });
        assert(r.stockEvidencePresent === false, 'stock evidence ' + JSON.stringify(bad) + ' → not present (strict === true)');
        assert(r.blockers.indexOf(ME.BLOCKER.STOCK_EVIDENCE_MISSING) !== -1, 'stock-evidence-missing emitted');
        assert(r.acceptedStockConfirmed === false, 'no accepted stock confirmation');
        assert(r.allEvidenceAccepted === false, 'aggregate false without stock evidence');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — binding evidence missing (acceptance #5)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — binding evidence missing', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    [undefined, false, 'yes', 1].forEach(function (bad) {
        const r = ME.evaluate({ evidence: withEvidence({ bindingConfirmed: bad }) });
        assert(r.bindingEvidencePresent === false, 'binding evidence ' + JSON.stringify(bad) + ' → not present (strict === true)');
        assert(r.blockers.indexOf(ME.BLOCKER.BINDING_EVIDENCE_MISSING) !== -1, 'binding-evidence-missing emitted');
        assert(r.acceptedBindingConfirmed === false, 'no accepted binding confirmation');
        assert(r.allEvidenceAccepted === false, 'aggregate false without binding evidence');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — paper / board thickness evidence missing or malformed (acceptance #6)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — paper / board thickness evidence missing', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    // Non-positive / non-numeric thicknesses are rejected (zero / negative / NaN / Infinity / string).
    [undefined, 0, -0.01, NaN, Infinity, '0.004'].forEach(function (bad) {
        const noPaper = ME.evaluate({ evidence: withEvidence({ paperThicknessPerLeafIn: bad }) });
        assert(noPaper.paperThicknessEvidencePresent === false, 'paper thickness ' + JSON.stringify(bad) + ' rejected');
        assert(noPaper.blockers.indexOf(ME.BLOCKER.PAPER_THICKNESS_EVIDENCE_MISSING) !== -1, 'paper-thickness-evidence-missing emitted');
        assert(noPaper.acceptedPaperThicknessPerLeafIn === null, 'no accepted paper thickness');

        const noBoard = ME.evaluate({ evidence: withEvidence({ boardThicknessIn: bad }) });
        assert(noBoard.boardThicknessEvidencePresent === false, 'board thickness ' + JSON.stringify(bad) + ' rejected');
        assert(noBoard.blockers.indexOf(ME.BLOCKER.BOARD_THICKNESS_EVIDENCE_MISSING) !== -1, 'board-thickness-evidence-missing emitted');
        assert(noBoard.acceptedBoardThicknessIn === null, 'no accepted board thickness');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — complete evidence but NOT accepted (acceptance gate is separate)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — complete evidence not accepted', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    const r = ME.evaluate({ evidence: withEvidence({ accepted: false }) });
    assert(r.evidenceComplete === true, 'evidence is complete (source + all four present)');
    assert(r.acceptedFlag === false, 'accepted flag is false');
    assert(r.evidenceAccepted === false, 'evidence not accepted');
    assert(r.blockers.length === 1 && r.blockers[0] === ME.BLOCKER.MATERIAL_EVIDENCE_NOT_ACCEPTED, 'only blocker is material-evidence-not-accepted');
    assert(r.primaryBlocker === ME.BLOCKER.MATERIAL_EVIDENCE_NOT_ACCEPTED, 'primary blocker is material-evidence-not-accepted');
    assert(r.allEvidenceAccepted === false, 'aggregate false until accepted');
    // Crucially, complete-but-unaccepted evidence feeds NOTHING into 8H.
    assert(r.acceptedStockConfirmed === false && r.acceptedBindingConfirmed === false, 'unaccepted evidence feeds no confirmation');
    assert(r.acceptedPaperThicknessPerLeafIn === null && r.acceptedBoardThicknessIn === null, 'unaccepted evidence feeds no thickness');

    // accepted:true but no identified source → acceptance is void (provenance required).
    const noSrcAccepted = ME.evaluate({ evidence: withEvidence({ source: { identity: 'x' }, accepted: true }) });
    assert(noSrcAccepted.evidenceAccepted === false, 'accepted flag without identified source → not accepted for feed');
    assert(noSrcAccepted.acceptedStockConfirmed === false, 'no feed without provenance even when accepted flag set');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — accepted evidence → aggregate true + adapter payload (acceptance #7)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — accepted evidence', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    const r = ME.evaluate({
        internalStockDirectionKnown: true,
        internalBindingDirectionKnown: true,
        evidence: ACCEPTED_EVIDENCE
    });
    assert(r.allEvidenceAccepted === true, 'aggregate true only when every evidence present + accepted');
    assert(r.blockers.length === 0, 'no blockers');
    assert(r.primaryBlocker === null, 'no primary blocker');
    assert(r.furthestLevel === ME.LEVEL.MATERIAL_EVIDENCE_ACCEPTED, 'furthest level is material-evidence-accepted');
    assert(r.evidenceAccepted === true, 'evidence accepted for feed');
    Object.keys(ME.STATE).forEach(function (k) {
        assert(r.states[ME.STATE[k]] === true, ME.STATE[k] + ' reported present/true');
    });

    // Adapter payload reflects the accepted evidence — values are NOT hardcoded.
    const m = ME.toSpineInputMaterial(r);
    assert(m.stockConfirmed === true, 'adapter: stock confirmed');
    assert(m.bindingConfirmed === true, 'adapter: binding confirmed');
    assert(m.materialSpec && m.materialSpec.paperThicknessPerLeafIn === 0.004, 'adapter: paper thickness from evidence');
    assert(m.materialSpec && m.materialSpec.boardThicknessIn === 0.118, 'adapter: board thickness from evidence');

    // A different valid evidence spec produces a different adapter payload (not hardcoded).
    const alt = ME.evaluate({ evidence: withEvidence({ paperThicknessPerLeafIn: 0.005, boardThicknessIn: 0.1 }) });
    const altM = ME.toSpineInputMaterial(alt);
    assert(altM.materialSpec.paperThicknessPerLeafIn === 0.005 && altM.materialSpec.boardThicknessIn === 0.1, 'adapter reflects alternate evidence values');

    // Defensive: adapter on empty / null result feeds nothing.
    assert(ME.toSpineInputMaterial().stockConfirmed === false, 'adapter on no result → stock false');
    assert(ME.toSpineInputMaterial().materialSpec === null, 'adapter on no result → materialSpec null');
    assert(ME.toSpineInputMaterial(null).bindingConfirmed === false, 'adapter on null result → binding false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — internal direction distinct from evidence (non-blocking, acceptance #2)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — internal direction distinct from evidence', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    // Known internal direction but NO evidence: direction reported known, but it produces no
    // blocker and does NOT advance the aggregate — a direction is not vendor evidence.
    const r = ME.evaluate({ internalStockDirectionKnown: true, internalBindingDirectionKnown: true });
    assert(r.internalMaterialDirectionKnown === true, 'internal material direction known');
    assert(r.states[ME.STATE.INTERNAL_MATERIAL_DIRECTION_KNOWN] === true, 'state map: internal direction known');
    assert(r.blockers.indexOf('internal-material-direction-missing') === -1, 'known direction emits no direction blocker');
    assert(r.allEvidenceAccepted === false, 'known direction does NOT confirm evidence');
    assert(r.acceptedStockConfirmed === false, 'known direction feeds no stock confirmation');

    // Conversely, dropping the internal direction does NOT block accepted evidence.
    const noDir = ME.evaluate({ evidence: ACCEPTED_EVIDENCE });
    assert(noDir.internalMaterialDirectionKnown === false, 'direction reported missing');
    assert(noDir.allEvidenceAccepted === true, 'missing non-blocking direction → aggregate still true with accepted evidence');

    // Strict boolean: truthy non-true direction is not "known".
    const loose = ME.evaluate({ internalStockDirectionKnown: 1, internalBindingDirectionKnown: 'yes' });
    assert(loose.internalMaterialDirectionKnown === false, 'truthy-but-not-true direction not known');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — higher rungs always reported false (separation, acceptance #2)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — never advances spine/cover/render-env/artifact/print/vendor/manufacturing/packaging', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    [ME.evaluate(), ME.evaluate({ evidence: ACCEPTED_EVIDENCE })].forEach(function (r, idx) {
        assert(r.spineWidthComputable === false, '#' + idx + ' spine-width-computable false');
        assert(r.coverUnblocked === false, '#' + idx + ' cover-unblocked false');
        assert(r.renderEnvironmentKnown === false, '#' + idx + ' render-environment-known false');
        assert(r.exportArtifactGenerationReady === false, '#' + idx + ' artifact generation false');
        assert(r.printFileReady === false, '#' + idx + ' print-file-ready false');
        assert(r.vendorReady === false, '#' + idx + ' vendor-ready false');
        assert(r.manufacturingReady === false, '#' + idx + ' manufacturing-ready false');
        assert(r.packagingReady === false, '#' + idx + ' packaging-ready false');
        assert(r.gatedReason === 'not-implemented', '#' + idx + ' gated reason not-implemented');
    });
    // Even when every piece of evidence is accepted, the higher rungs stay false — accepting
    // evidence is not a confirmed vendor, a computed spine, or a print file.
    const accepted = ME.evaluate({ evidence: ACCEPTED_EVIDENCE });
    assert(accepted.allEvidenceAccepted === true && accepted.spineWidthComputable === false,
        'material-evidence-accepted does not imply spine-width-computable');
    assert(accepted.vendorReady === false, 'material-evidence-accepted does not imply vendor-ready');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — resolveFromContext: honest from LIVE repo truth (no accepted evidence)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — resolveFromContext live repo truth', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    // Live: internal direction is known, but NO material evidence record exists in repo truth.
    const view = ME.resolveFromContext({
        productionDirection: LIVE_PRODUCTION_DIRECTION
        // materialEvidence intentionally omitted — no accepted vendor evidence in repo truth.
    });

    // Internal direction derived known from real repo truth.
    assert(view.input.internalStockDirectionKnown === true, 'internal stock direction known from BOOK_PRODUCTION_DEPS.STOCK');
    assert(view.input.internalBindingDirectionKnown === true, 'internal binding direction known from BOOK_PRODUCTION_DEPS.BINDING');

    // Evidence genuinely missing → honest determination.
    assert(view.result.evidencePresent === false, 'no evidence present on live repo truth');
    assert(view.result.allEvidenceAccepted === false, 'aggregate honestly false on live repo truth');
    assert(view.result.primaryBlocker === ME.BLOCKER.MATERIAL_EVIDENCE_MISSING, 'live primary blocker is material-evidence-missing');
    assert(view.display.tone === ME.STATUS_TONE.GATED, 'display gated on live repo truth');

    // The live adapter payload feeds NOTHING into 8H — exactly the current 8H live input.
    assert(view.spineInputMaterial.stockConfirmed === false, 'live adapter: stock not confirmed');
    assert(view.spineInputMaterial.bindingConfirmed === false, 'live adapter: binding not confirmed');
    assert(view.spineInputMaterial.materialSpec === null, 'live adapter: no material spec');

    // A "vendor confirmation pending"-style note is NOT confirmation: a record that only
    // carries a pending note, with no actual confirmations / thicknesses, stays missing.
    const pending = ME.resolveFromContext({
        productionDirection: LIVE_PRODUCTION_DIRECTION,
        materialEvidence: { source: { identity: 'ingramspark', version: 'pending', date: '2026-05-10' }, note: 'vendor confirmation pending' }
    });
    assert(pending.result.stockEvidencePresent === false, 'pending note is not stock evidence');
    assert(pending.result.allEvidenceAccepted === false, 'pending note does not satisfy the evidence contract');
    assert(pending.spineInputMaterial.stockConfirmed === false, 'pending note feeds no confirmation');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — resolveFromContext: hypothetical accepted evidence (not hardcoded)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — resolveFromContext hypothetical accepted', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    const view = ME.resolveFromContext({
        productionDirection: LIVE_PRODUCTION_DIRECTION,
        materialEvidence:    ACCEPTED_EVIDENCE
    });
    assert(view.result.allEvidenceAccepted === true, 'fully-supplied accepted context → aggregate true');
    assert(view.display.tone === ME.STATUS_TONE.KNOWN, 'fully-supplied accepted context → known display');
    assert(view.spineInputMaterial.stockConfirmed === true && view.spineInputMaterial.bindingConfirmed === true, 'adapter confirms stock + binding');
    assert(view.spineInputMaterial.materialSpec.paperThicknessPerLeafIn === 0.004, 'adapter paper thickness from context');
    assert(view.spineInputMaterial.materialSpec.boardThicknessIn === 0.118, 'adapter board thickness from context');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — integration with the REAL MessageBookSpineInputs (8H)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — integration with MessageBookSpineInputs (8H)', function () {
    const KM = makeIntegrationCtx();
    const ME = KM.MessageBookMaterialEvidence;
    const SI = KM.MessageBookSpineInputs;

    // Helper: feed the 8I adapter output into the REAL 8H, supplying the non-evidence inputs
    // (production direction, cover gate, page count) the caller owns.
    function feed8H(materialEvidence, coverGate, pageCount) {
        const material = ME.resolveFromContext({
            productionDirection: LIVE_PRODUCTION_DIRECTION,
            materialEvidence:    materialEvidence
        }).spineInputMaterial;
        return SI.resolveFromContext({
            productionDirection:    LIVE_PRODUCTION_DIRECTION,
            productionDependencies: {
                coverGenerationBlocked: coverGate,
                stockConfirmed:         material.stockConfirmed,
                bindingConfirmed:       material.bindingConfirmed
            },
            materialSpec: material.materialSpec,
            pageCount:    pageCount
        }).result;
    }

    // LIVE: no evidence + cover gate blocked → 8H stays exactly where it is today.
    const live = feed8H(undefined, true, 120);
    assert(live.primaryBlocker === SI.BLOCKER.STOCK_CONFIRMATION_MISSING, 'live 8I feed keeps 8H at stock-confirmation-missing');
    assert(live.spineWidthComputable === false, 'live: spine width not computable');
    assert(live.spineWidthIn === null, 'live: spine width null');
    assert(live.coverUnblocked === false, 'live: cover still blocked');
    assert(live.allInputsConfirmed === false, 'live: 8H aggregate honestly false');

    // HYPOTHETICAL accepted evidence + cover gate open + page count → 8H computes spine width
    // and unblocks the cover, proving the adapter can honestly advance 8H when evidence exists.
    const confirmed = feed8H(ACCEPTED_EVIDENCE, false, 120);
    assert(confirmed.stockConfirmed === true && confirmed.bindingConfirmed === true, 'accepted evidence → 8H sees confirmations');
    assert(confirmed.spineWidthComputable === true, 'accepted evidence → 8H spine width computable');
    assert(confirmed.spineWidthIn === ACCEPTED_SPINE_WIDTH, 'accepted evidence → 8H spine width = (pages × paper) + board');
    assert(confirmed.coverUnblocked === true, 'accepted evidence + open gate → 8H cover unblocked');
    // But even then 8H never advances the render-env / print / vendor rungs.
    assert(confirmed.renderEnvironmentKnown === false && confirmed.printFileReady === false, '8H still never advances render-env / print-file');

    // Accepted evidence but cover gate STILL closed → cover stays blocked (the gate is not
    // material evidence). Proves 8I alone cannot unblock the cover.
    const gateClosed = feed8H(ACCEPTED_EVIDENCE, true, 120);
    assert(gateClosed.spineWidthComputable === true, 'accepted evidence → spine computable even with gate closed');
    assert(gateClosed.coverUnblocked === false, 'closed cover gate keeps 8H cover blocked despite accepted evidence');

    // PARTIAL accepted evidence (board thickness missing) → 8I feeds stock/binding/paper, and
    // 8H honestly blocks on the genuinely missing board thickness; spine not computable.
    const partial = feed8H(withEvidence({ boardThicknessIn: undefined }), false, 120);
    assert(partial.stockConfirmed === true && partial.bindingConfirmed === true, 'partial: stock/binding still fed');
    assert(partial.paperThicknessKnown === true, 'partial: paper thickness still fed');
    assert(partial.boardThicknessKnown === false, 'partial: board thickness genuinely missing in 8H');
    assert(partial.spineWidthComputable === false, 'partial: spine not computable without board thickness');
    assert(partial.blockers.indexOf(SI.BLOCKER.BOARD_THICKNESS_MISSING) !== -1, 'partial: 8H emits board-thickness-missing');

    // Complete-but-UNACCEPTED evidence → 8I feeds nothing → 8H stays at stock-confirmation-missing.
    const unaccepted = feed8H(withEvidence({ accepted: false }), false, 120);
    assert(unaccepted.primaryBlocker === SI.BLOCKER.STOCK_CONFIRMATION_MISSING, 'unaccepted evidence keeps 8H at stock-confirmation-missing');
    assert(unaccepted.spineWidthComputable === false, 'unaccepted evidence → 8H spine not computable');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — describeReadiness copy matrix + no unsafe claims
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — describeReadiness', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    const gated = ME.describeReadiness(ME.evaluate());
    assert(gated.tone === ME.STATUS_TONE.GATED, 'no evidence → gated tone');
    assert(gated.headline === 'Vendor material evidence is not ready yet', 'gated headline');
    assert(gated.detail === ME.blockerMessage(ME.BLOCKER.MATERIAL_EVIDENCE_MISSING), 'gated detail is primary blocker message');
    assert(gated.blocker === ME.BLOCKER.MATERIAL_EVIDENCE_MISSING, 'gated blocker code present');

    const known = ME.describeReadiness(ME.evaluate({ evidence: ACCEPTED_EVIDENCE }));
    assert(known.tone === ME.STATUS_TONE.KNOWN, 'accepted → known tone');
    assert(known.blocker === null, 'known → no blocker');
    assert(known.detail.indexOf('not implemented') !== -1, 'known detail still says spine width / render env / artifact generation not implemented');

    // Defensive: empty / null result.
    assert(ME.describeReadiness().tone === ME.STATUS_TONE.GATED, 'undefined result → gated');
    assert(ME.describeReadiness(null).tone === ME.STATUS_TONE.GATED, 'null result → gated');

    // No unsafe commerce/production claim in any describeReadiness copy.
    [gated, known].forEach(function (d) {
        const copy = (d.headline + ' ' + d.detail).toLowerCase();
        ['ready to print', 'ready to order', 'ready to export', 'print now', 'order now', 'buy now', 'add to cart', '$'].forEach(function (term) {
            assert(copy.indexOf(term) === -1, 'describeReadiness copy has no unsafe term "' + term + '"');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — describeBoundary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — describeBoundary', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    const b = ME.describeBoundary();
    assert(b.version === 'kmme1', 'boundary version');
    assert(b.artifactFree === true, 'boundary is artifact-free');
    assert(typeof b.doesNot === 'string' && b.doesNot.length > 0, 'doesNot statement present');
    assert(b.doesNot.toLowerCase().indexOf('pending') !== -1, 'doesNot states a pending note is not confirmation');
    assert(Array.isArray(b.separates) && b.separates.indexOf('evidence-acceptance') !== -1, 'separates evidence acceptance');
    assert(b.separates.indexOf('internal-material-direction') !== -1, 'separates internal direction');
    assert(b.separates.indexOf('spine-width-computability') !== -1 && b.separates.indexOf('cover-unblocking') !== -1, 'separates spine computability + cover unblocking');
    assert(Array.isArray(b.notImplemented) && b.notImplemented.indexOf('vendor-confirmation') !== -1 && b.notImplemented.indexOf('manufacturing') !== -1, 'vendor-confirmation/manufacturing listed not-implemented');
    assert(typeof b.evidenceSourceOfTruth === 'string' && b.evidenceSourceOfTruth.indexOf('vendor-manufacturing-register') !== -1, 'points at evidence source of truth');
    assert(typeof b.feedsInto === 'string' && b.feedsInto.indexOf('MessageBookSpineInputs') !== -1, 'documents that it feeds 8H');
    assert(b.distinctFrom && b.distinctFrom.spineInputs && b.distinctFrom.renderEnvironment && b.distinctFrom.manufacturingReadiness, 'distinctFrom spine inputs + render env + manufacturing');
    assert(Array.isArray(b.blockerCodes) && b.blockerCodes.length === ME.BLOCKER_ORDER.length, 'lists the blocker codes');
    // Fresh object each call.
    assert(ME.describeBoundary() !== b, 'describeBoundary returns a fresh object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — purity: deterministic, no mutation, fresh arrays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — purity', function () {
    const ME = makeCtx().MessageBookMaterialEvidence;

    const input = { internalStockDirectionKnown: true, internalBindingDirectionKnown: true, evidence: ACCEPTED_EVIDENCE };
    const frozen = JSON.stringify(input);
    const a = ME.evaluate(input);
    const b = ME.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'evaluate is deterministic');
    assert(JSON.stringify(input) === frozen, 'evaluate does not mutate its input');

    const c = ME.evaluate();
    c.blockers.push('mutated');
    c.blockerMessages.push('mutated');
    assert(ME.evaluate().blockers.indexOf('mutated') === -1, 'evaluate returns a fresh blockers array');
    assert(ME.evaluate().blockerMessages.indexOf('mutated') === -1, 'evaluate returns a fresh blockerMessages array');

    // resolveFromContext does not mutate its argument.
    const ctx = { productionDirection: LIVE_PRODUCTION_DIRECTION, materialEvidence: ACCEPTED_EVIDENCE };
    const ctxFrozen = JSON.stringify(ctx);
    ME.resolveFromContext(ctx);
    assert(JSON.stringify(ctx) === ctxFrozen, 'resolveFromContext does not mutate its argument');

    // toSpineInputMaterial does not mutate its argument.
    const r = ME.evaluate(input);
    const rFrozen = JSON.stringify(r);
    ME.toSpineInputMaterial(r);
    assert(JSON.stringify(r) === rFrozen, 'toSpineInputMaterial does not mutate its argument');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — source carries no commerce/production CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — no commerce/production CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-material-evidence.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT vendor/material evidence, so those nouns legitimately appear.
    // What must never appear is an ACTION that performs commerce/production, or a
    // call-to-action that implies it.
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
