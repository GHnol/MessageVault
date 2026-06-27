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

// MessageBookPrintSpec is a pure function of its inputs and references no sibling
// module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-print-spec.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the real production-readiness boundary (8A/8B)
// that consumes the print-spec capability through its existing input path.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
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

const SPEC_ID = 'message-book-internal-7x10-hardcover-v1';

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    assert(typeof PS === 'object' && PS !== null, 'KMEngine.MessageBookPrintSpec is an object');
    assert(PS.CONTRACT_VERSION === 'kmps1', 'CONTRACT_VERSION is "kmps1"');
    assert(PS.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(PS.INTERNAL_SPEC_ID === SPEC_ID, 'INTERNAL_SPEC_ID is the internal draft id');
    assert(typeof PS.INTERNAL_DRAFT_SPEC === 'object' && PS.INTERNAL_DRAFT_SPEC !== null, 'INTERNAL_DRAFT_SPEC is an object');
    assert(typeof PS.SELECTION_STATE === 'object' && PS.SELECTION_STATE !== null, 'SELECTION_STATE is an object');
    assert(typeof PS.BLOCKER === 'object' && PS.BLOCKER !== null, 'BLOCKER is an object');
    assert(PS.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof PS.isKnownSpecId === 'function', 'isKnownSpecId is a function');
    assert(typeof PS.getInternalSpec === 'function', 'getInternalSpec is a function');
    assert(typeof PS.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof PS.evaluate === 'function', 'evaluate is a function');
    assert(typeof PS.toManufacturingCapabilities === 'function', 'toManufacturingCapabilities is a function');
    assert(typeof PS.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — SELECTION_STATE constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — SELECTION_STATE constants', function () {
    const S = makeCtx().MessageBookPrintSpec.SELECTION_STATE;

    assert(S.NONE              === 'none',              'NONE');
    assert(S.UNKNOWN           === 'unknown',           'UNKNOWN');
    assert(S.INTERNAL_SELECTED === 'internal-selected', 'INTERNAL_SELECTED');
    assert(S.INTERNAL_VALID    === 'internal-valid',    'INTERNAL_VALID');
    assert(Object.keys(S).length === 4, 'exactly 4 selection states');

    try { 'use strict'; S.INTERNAL_VALID = 'mutated'; } catch (e) { /* strict throw ok */ }
    assert(S.INTERNAL_VALID === 'internal-valid', 'SELECTION_STATE is immutable (frozen)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — BLOCKER constants + safe messages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — BLOCKER constants', function () {
    const PS = makeCtx().MessageBookPrintSpec;
    const B  = PS.BLOCKER;

    assert(B.SPEC_NOT_SELECTED   === 'print-spec-not-selected',        'SPEC_NOT_SELECTED');
    assert(B.SPEC_UNKNOWN        === 'print-spec-unknown',             'SPEC_UNKNOWN');
    assert(B.PAGE_COUNT_INVALID  === 'print-spec-page-count-invalid',  'PAGE_COUNT_INVALID');
    assert(B.PAGE_BOUNDS_UNKNOWN === 'print-spec-page-bounds-unknown', 'PAGE_BOUNDS_UNKNOWN');
    assert(B.OVER_PAGE_LIMIT     === 'print-spec-over-page-limit',     'OVER_PAGE_LIMIT');

    Object.keys(B).forEach(function (k) {
        const msg = PS.blockerMessage(B[k]);
        assert(typeof msg === 'string' && msg.length > 0, B[k] + ' has a non-empty safe message');
    });
    assert(PS.blockerMessage('not-a-code') === '', 'unknown blocker code → empty message');
    assert(PS.blockerMessage(undefined) === '', 'undefined blocker code → empty message');

    try { 'use strict'; B.SPEC_UNKNOWN = 'mutated'; } catch (e) { /* strict throw ok */ }
    assert(B.SPEC_UNKNOWN === 'print-spec-unknown', 'BLOCKER is immutable (frozen)');

    // The selection blocker code matches the 8A manufacturing blocker it satisfies,
    // so the two layers speak the same word for "print spec not selected".
    assert(B.SPEC_NOT_SELECTED === 'print-spec-not-selected',
        'print-spec-not-selected matches the 8A blocker it clears');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — INTERNAL_DRAFT_SPEC descriptor reflects the LOCKED register facts
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — INTERNAL_DRAFT_SPEC descriptor', function () {
    const PS   = makeCtx().MessageBookPrintSpec;
    const spec = PS.INTERNAL_DRAFT_SPEC;

    assert(spec.specId === SPEC_ID, 'specId is the internal draft id');
    assert(spec.contractVersion === 'kmps1', 'descriptor carries the contract version');
    assert(spec.productTypeId === 'message-book', 'descriptor is message-book scoped');
    assert(spec.status === 'internal-draft', 'status is internal-draft (NOT vendor-confirmed)');

    // LOCKED facts must match the register / BOOK_PRODUCTION_DEPS / BOOK_PARITY exactly.
    assert(spec.locked.trimSize === '7x10', 'LOCKED trim size 7x10');
    assert(spec.locked.binding === 'casebound-hardcover', 'LOCKED binding casebound-hardcover');
    assert(spec.locked.interiorStock === 'matte-premium-text', 'LOCKED stock matte-premium-text');
    assert(spec.locked.parityModulus === 2, 'LOCKED parity modulus 2 (even-page)');
    assert(spec.locked.multiVolumeModel === 'separate-physical-books', 'LOCKED multi-volume separate-physical-books');

    // Locked direction but provisional pending vendor confirmation.
    assert(spec.provisional.pdfSpecTarget === 'PDF/X-4', 'provisional PDF spec target PDF/X-4');
    assert(spec.provisional.emojiStrategy === 'print-safe-set', 'provisional emoji strategy print-safe-set');
    assert(typeof spec.provisional.geometryNote === 'string' && spec.provisional.geometryNote.length > 0,
        'geometry note points at the authoritative runtime constants');
    assert(spec.provisional.geometryNote.indexOf('BOOK_PRODUCTION_DEPS') !== -1,
        'geometry note names BOOK_PRODUCTION_DEPS as the source of truth');

    // The internal spec is explicitly NOT vendor-confirmed and the export pipeline is
    // NOT implemented (the whole point of the boundary).
    assert(spec.vendorConfirmed === false, 'internal spec is NOT vendor-confirmed');
    assert(spec.exportPipelineImplemented === false, 'export pipeline is NOT implemented');

    // Frozen at the top level and on the nested LOCKED block.
    try { 'use strict'; spec.vendorConfirmed = true; } catch (e) { /* ok */ }
    assert(spec.vendorConfirmed === false, 'descriptor is immutable (frozen)');
    try { 'use strict'; spec.locked.trimSize = 'mutated'; } catch (e) { /* ok */ }
    assert(spec.locked.trimSize === '7x10', 'descriptor.locked is immutable (frozen)');

    // getInternalSpec returns that same descriptor.
    assert(PS.getInternalSpec() === spec, 'getInternalSpec returns the internal draft descriptor');
    assert(PS.isKnownSpecId(SPEC_ID) === true, 'isKnownSpecId true for the internal spec id');
    assert(PS.isKnownSpecId('something-else') === false, 'isKnownSpecId false for any other id');
    assert(PS.isKnownSpecId(null) === false, 'isKnownSpecId false for null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — no spec selected → none + print-spec-not-selected
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — no spec selected', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    [undefined, null, {}, { selectedSpecId: null }, { selectedSpecId: '' }].forEach(function (input) {
        const r = PS.evaluate(input);
        const tag = JSON.stringify(input);
        assert(r.state === 'none', tag + ' → state none');
        assert(r.selectedSpecId === null, tag + ' → selectedSpecId null');
        assert(r.knownSpecId === false, tag + ' → knownSpecId false');
        assert(r.internalSpecSelected === false, tag + ' → internalSpecSelected false');
        assert(r.internalSpecValid === false, tag + ' → internalSpecValid false');
        assert(r.pageBounds === null, tag + ' → no pageBounds computed');
        assert(r.primaryBlocker === 'print-spec-not-selected', tag + ' → print-spec-not-selected');
        assert(r.blockers.length === 1, tag + ' → single blocker');
        assert(r.blockerMessages.length === 1 && r.blockerMessages[0].length > 0, tag + ' → safe message');
    });

    // Defensive: a non-string selectedSpecId is treated as none.
    [123, true, {}, []].forEach(function (bad) {
        const r = PS.evaluate({ selectedSpecId: bad });
        assert(r.state === 'none', 'non-string selectedSpecId ' + JSON.stringify(bad) + ' → none');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — unknown spec id is rejected
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — unknown/invalid spec id rejected', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    ['some-other-spec', 'message-book-internal-7x10-hardcover-v2', 'A4-paperback', SPEC_ID + ' '].forEach(function (id) {
        const r = PS.evaluate({ selectedSpecId: id, pageCount: 50, maxPages: 400 });
        assert(r.state === 'unknown', id + ' → state unknown');
        assert(r.knownSpecId === false, id + ' → knownSpecId false');
        assert(r.internalSpecSelected === false, id + ' → not internalSpecSelected');
        assert(r.internalSpecValid === false, id + ' → not internalSpecValid');
        assert(r.primaryBlocker === 'print-spec-unknown', id + ' → print-spec-unknown blocker');
        assert(r.pageBounds === null, id + ' → page bounds not evaluated for an unknown spec');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — valid internal spec selected: page count under / at / over bounds
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — page count under / at / over allowed bounds', function () {
    const PS = makeCtx().MessageBookPrintSpec;
    const MAX = 400;

    // Under the bound → valid.
    const under = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: MAX });
    assert(under.state === 'internal-valid', 'under bound → internal-valid');
    assert(under.internalSpecSelected === true, 'under bound → internalSpecSelected');
    assert(under.internalSpecValid === true, 'under bound → internalSpecValid');
    assert(under.pageBounds.withinBounds === true, 'under bound → withinBounds');
    assert(under.pageBounds.exceedsPageLimit === false, 'under bound → not over');
    assert(under.blockers.length === 0, 'under bound → no blockers');
    assert(under.primaryBlocker === null, 'under bound → no primary blocker');

    // Exactly at the bound → within (equal is within, mirroring computePageLimitStatus).
    const at = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: MAX, maxPages: MAX });
    assert(at.state === 'internal-valid', 'at bound → internal-valid (equal is within)');
    assert(at.internalSpecValid === true, 'at bound → internalSpecValid');
    assert(at.pageBounds.exceedsPageLimit === false, 'at bound → not over');

    // Over the bound → selected but not valid; over-page-limit blocker.
    const over = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: MAX + 1, maxPages: MAX });
    assert(over.state === 'internal-selected', 'over bound → internal-selected (not valid)');
    assert(over.internalSpecSelected === true, 'over bound → still selected');
    assert(over.internalSpecValid === false, 'over bound → NOT valid');
    assert(over.pageBounds.exceedsPageLimit === true, 'over bound → exceedsPageLimit');
    assert(over.primaryBlocker === 'print-spec-over-page-limit', 'over bound → print-spec-over-page-limit');

    // Parity is informational only — an odd page count within bounds is still valid
    // (KeepMees owns even-page padding via BOOK_PARITY; it is not rejected here).
    const odd = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 121, maxPages: MAX });
    assert(odd.internalSpecValid === true, 'odd page count within bounds → still valid');
    assert(odd.pageBounds.parityOk === false, 'odd page count → parityOk false (informational)');
    assert(odd.pageBounds.parityModulus === 2, 'parity modulus reported as 2');
    const even = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: MAX });
    assert(even.pageBounds.parityOk === true, 'even page count → parityOk true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — invalid page count / unknown bounds block validity (but keep selected)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — invalid page count / unknown bounds', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    // Invalid page counts → page-count-invalid, selected but not valid.
    [0, -5, 1.5, NaN, Infinity, '50', null, undefined].forEach(function (pc) {
        const r = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: pc, maxPages: 400 });
        assert(r.internalSpecSelected === true, 'pc=' + pc + ' → still selected');
        assert(r.internalSpecValid === false, 'pc=' + pc + ' → not valid');
        assert(r.primaryBlocker === 'print-spec-page-count-invalid', 'pc=' + pc + ' → page-count-invalid');
        assert(r.state === 'internal-selected', 'pc=' + pc + ' → internal-selected');
    });

    // Valid page count but unknown / non-positive bounds → page-bounds-unknown.
    [undefined, null, 0, -1, NaN, '400'].forEach(function (mx) {
        const r = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: mx });
        assert(r.internalSpecValid === false, 'maxPages=' + mx + ' → not valid');
        assert(r.primaryBlocker === 'print-spec-page-bounds-unknown', 'maxPages=' + mx + ' → page-bounds-unknown');
        assert(r.pageBounds.boundsKnown === false, 'maxPages=' + mx + ' → boundsKnown false');
    });

    // The smallest valid book: exactly one page, within a known bound.
    const onePage = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 1, maxPages: 1 });
    assert(onePage.internalSpecValid === true, 'pageCount 1 within maxPages 1 → valid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — selecting/validating a spec never implies export/vendor/manufacturing
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — selection implies no downstream readiness', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    // Even a fully valid internal selection keeps every downstream gate explicitly false.
    const valid = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 });
    assert(valid.internalSpecValid === true, 'precondition: valid internal spec');
    assert(valid.vendorConfirmationMissing === true, 'valid spec → vendor confirmation still missing');
    assert(valid.exportPipelineMissing === true, 'valid spec → export pipeline still missing');
    assert(valid.vendorReady === false, 'valid spec → vendorReady false');
    assert(valid.exportReady === false, 'valid spec → exportReady false');
    assert(valid.manufacturingReady === false, 'valid spec → manufacturingReady false');
    assert(valid.packagingReady === false, 'valid spec → packagingReady false');
    assert(valid.gatedReason === 'not-implemented', 'valid spec → gatedReason not-implemented');

    // The missing flags hold across every selection state, never flipping true.
    [
        PS.evaluate(),                                                              // none
        PS.evaluate({ selectedSpecId: 'nope' }),                                    // unknown
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 9999, maxPages: 400 }),   // over-limit
        valid                                                                       // valid
    ].forEach(function (r) {
        assert(r.vendorConfirmationMissing === true, 'vendor confirmation missing in state ' + r.state);
        assert(r.exportPipelineMissing === true, 'export pipeline missing in state ' + r.state);
        assert(r.vendorReady === false && r.manufacturingReady === false && r.packagingReady === false,
            'no downstream readiness in state ' + r.state);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — toManufacturingCapabilities bridge (only printSpecSelected, valid-gated)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — toManufacturingCapabilities bridge', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    // Valid internal spec → printSpecSelected true.
    const valid = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 });
    const capsValid = PS.toManufacturingCapabilities(valid);
    assert(capsValid.printSpecSelected === true, 'valid internal spec → printSpecSelected true');
    assert(Object.keys(capsValid).length === 1, 'bridge flips ONLY printSpecSelected (no other key)');
    assert(capsValid.exportPipelineImplemented === undefined, 'bridge does not set exportPipelineImplemented');
    assert(capsValid.vendorSelected === undefined, 'bridge does not set vendorSelected');
    assert(capsValid.manufacturingImplemented === undefined, 'bridge does not set manufacturingImplemented');
    assert(capsValid.packagingImplemented === undefined, 'bridge does not set packagingImplemented');

    // Every non-valid result → printSpecSelected false.
    [
        PS.evaluate(),                                                            // none
        PS.evaluate({ selectedSpecId: 'nope', pageCount: 10, maxPages: 400 }),    // unknown
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 401, maxPages: 400 }),  // over-limit (selected, invalid)
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 0, maxPages: 400 }),    // invalid count
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 10, maxPages: 0 })      // bounds unknown
    ].forEach(function (r) {
        const caps = PS.toManufacturingCapabilities(r);
        assert(caps.printSpecSelected === false, 'non-valid (' + r.state + '/' + r.primaryBlocker + ') → printSpecSelected false');
        assert(Object.keys(caps).length === 1, 'bridge still flips ONLY printSpecSelected');
    });

    // Defensive: null/garbage → printSpecSelected false.
    assert(PS.toManufacturingCapabilities(null).printSpecSelected === false, 'null result → printSpecSelected false');
    assert(PS.toManufacturingCapabilities(undefined).printSpecSelected === false, 'undefined result → printSpecSelected false');
    assert(PS.toManufacturingCapabilities({}).printSpecSelected === false, 'empty result → printSpecSelected false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — describeBoundary disclaims everything above an internal spec
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — describeBoundary', function () {
    const PS = makeCtx().MessageBookPrintSpec;
    const d  = PS.describeBoundary();

    assert(d.version === 'kmps1', 'describeBoundary version');
    assert(typeof d.decides === 'string' && d.decides.length > 0, 'decides is described');
    assert(typeof d.doesNot === 'string' && d.doesNot.length > 0, 'doesNot is described');

    // The internal spec is explicitly less than each higher gate.
    ['a print file', 'an export pipeline', 'a vendor-confirmed spec', 'manufacturing readiness'].forEach(function (x) {
        assert(d.internalSpecIsNot.indexOf(x) !== -1, 'internalSpecIsNot includes "' + x + '"');
    });
    assert(typeof d.distinctFrom.exportPipeline === 'string', 'distinctFrom.exportPipeline');
    assert(typeof d.distinctFrom.vendorConfirmation === 'string', 'distinctFrom.vendorConfirmation');
    assert(typeof d.distinctFrom.productionReadiness === 'string', 'distinctFrom.productionReadiness');
    ['export-pipeline', 'vendor-confirmation', 'manufacturing', 'packaging'].forEach(function (x) {
        assert(d.notImplemented.indexOf(x) !== -1, 'notImplemented includes "' + x + '"');
    });
    assert(d.geometrySourceOfTruth.indexOf('BOOK_PRODUCTION_DEPS') !== -1,
        'geometrySourceOfTruth names BOOK_PRODUCTION_DEPS');
    assert(d.recordedOnDevice === true, 'recordedOnDevice true');

    // Fresh object each call (defensive copy).
    PS.describeBoundary().internalSpecIsNot.push('mutated');
    assert(PS.describeBoundary().internalSpecIsNot.indexOf('mutated') === -1, 'describeBoundary returns a fresh object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — purity: deterministic, no input mutation, fresh arrays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — purity', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    const input = { selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 };
    const frozen = JSON.stringify(input);
    const a = PS.evaluate(input);
    const b = PS.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'evaluate is deterministic');
    assert(JSON.stringify(input) === frozen, 'evaluate does not mutate its input');

    // Returned blockers array is fresh.
    const c = PS.evaluate();
    c.blockers.push('mutated');
    assert(PS.evaluate().blockers.indexOf('mutated') === -1, 'evaluate returns a fresh blockers array');

    // toManufacturingCapabilities does not mutate its argument.
    const r = PS.evaluate(input);
    const rFrozen = JSON.stringify(r);
    PS.toManufacturingCapabilities(r);
    assert(JSON.stringify(r) === rFrozen, 'toManufacturingCapabilities does not mutate its argument');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — source carries no commerce/production CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — no commerce/production CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-print-spec.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT the print/export/vendor boundary, so those nouns legitimately
    // appear. What must never appear is an ACTION that performs commerce/production, or
    // a call-to-action that implies it.
    ['add to cart', 'addtocart', 'place order', 'placeorder', 'create order', 'createorder',
     'submit order', 'submitorder', 'order now', 'ordernow', 'buy now', 'buynow',
     'pay now', 'paynow', 'checkout session', 'createcheckout', 'send to vendor',
     'submit to vendor', 'send to print', 'print now', 'generate pdf', 'generatepdf',
     'charge(', 'stripe', 'paypal', 'add to bag', 'download('].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source contains no commerce/production CTA/action "' + term + '"');
    });

    // Fully pure: no network/DOM/storage/random/clock side effects at all (this module
    // has no record builders, so it uses no Date either).
    ['fetch(', 'xmlhttprequest', 'localstorage', 'sessionstorage', 'document.',
     'window.location', 'math.random(', 'new date', 'date.now'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source has no side-effect token "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — integration: the bridge moves the real 8A blocker as required
// ─────────────────────────────────────────────────────────────────────────────
// The whole point of the contract: a valid internal print spec lets the 8A
// production-readiness boundary advance from `print-spec-not-selected` to
// `export-pipeline-not-implemented`, and no further. No spec keeps it at
// `print-spec-not-selected`. Proven against the REAL MessageBookManufacturingReadiness.
suite('Suite 14 — integration with MessageBookManufacturingReadiness', function () {
    const KM = makeIntegrationCtx();
    const PS = KM.MessageBookPrintSpec;
    const MR = KM.MessageBookManufacturingReadiness;

    // The lower layers are satisfied: checkout-eligible proof with an active local intent.
    const READY_LOWER = { readiness: { checkoutEligible: true }, intent: { active: true } };

    // No print spec selected → 8A stays at print-spec-not-selected.
    const noneCaps = PS.toManufacturingCapabilities(PS.evaluate());
    const noneOut  = MR.resolveFromReadiness(Object.assign({ capabilities: noneCaps }, READY_LOWER));
    assert(noneOut.result.primaryBlocker === 'print-spec-not-selected',
        'no internal spec → 8A blocked at print-spec-not-selected');
    assert(noneOut.result.exportSpecKnown === false, 'no internal spec → export-spec not known');

    // Valid internal spec selected → 8A clears print-spec-not-selected and advances to
    // export-pipeline-not-implemented (the next genuine blocker), and no further.
    const validSel  = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 });
    const validCaps = PS.toManufacturingCapabilities(validSel);
    const validOut  = MR.resolveFromReadiness(Object.assign({ capabilities: validCaps }, READY_LOWER));
    assert(validOut.result.exportSpecKnown === true, 'valid internal spec → export-spec-known (print-spec cleared)');
    assert(validOut.result.primaryBlocker === 'export-pipeline-not-implemented',
        'valid internal spec → next blocker is export-pipeline-not-implemented');
    assert(validOut.result.blockers.indexOf('print-spec-not-selected') === -1,
        'valid internal spec → print-spec-not-selected no longer present');

    // Crucially: nothing above export advances. Vendor / manufacturing / packaging stay false.
    assert(validOut.result.printFileReady === false, 'valid internal spec → print file still not ready');
    assert(validOut.result.vendorReady === false, 'valid internal spec → vendor still not ready');
    assert(validOut.result.manufacturingReady === false, 'valid internal spec → manufacturing still not ready');
    assert(validOut.result.packagingReady === false, 'valid internal spec → packaging still not ready');
    assert(validOut.display.tone === 'gated', 'valid internal spec → 8A status still gated');

    // A selected-but-INVALID internal spec (over page limit) does NOT clear the 8A blocker.
    const overSel  = PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 9999, maxPages: 400 });
    const overCaps = PS.toManufacturingCapabilities(overSel);
    const overOut  = MR.resolveFromReadiness(Object.assign({ capabilities: overCaps }, READY_LOWER));
    assert(overOut.result.primaryBlocker === 'print-spec-not-selected',
        'selected-but-invalid spec → 8A still blocked at print-spec-not-selected (not advanced)');

    // The bridge never advances 8A when the lower layers are not satisfied: a valid
    // internal spec under an ineligible proof is still blocked at checkout-not-eligible.
    const ineligibleOut = MR.resolveFromReadiness({
        readiness: { checkoutEligible: false }, intent: { active: false }, capabilities: validCaps
    });
    assert(ineligibleOut.result.primaryBlocker === 'checkout-not-eligible',
        'valid spec under ineligible proof → still checkout-not-eligible (print spec does not jump the queue)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — 8D display + selection-helper API surface
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — 8D helper API surface', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    assert(typeof PS.SELECTION_TONE === 'object' && PS.SELECTION_TONE !== null, 'SELECTION_TONE is an object');
    assert(PS.SELECTION_TONE.SELECTED === 'selected', 'SELECTION_TONE.SELECTED');
    assert(PS.SELECTION_TONE.UNSELECTED === 'unselected', 'SELECTION_TONE.UNSELECTED');
    assert(PS.SELECTION_TONE.BLOCKED === 'blocked', 'SELECTION_TONE.BLOCKED');
    try { 'use strict'; PS.SELECTION_TONE.SELECTED = 'x'; } catch (e) { /* ok */ }
    assert(PS.SELECTION_TONE.SELECTED === 'selected', 'SELECTION_TONE is frozen');

    assert(typeof PS.describeSelection === 'function', 'describeSelection is a function');
    assert(typeof PS.describeActions === 'function', 'describeActions is a function');
    assert(typeof PS.coerceSelectedSpecId === 'function', 'coerceSelectedSpecId is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — describeSelection copy matrix
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — describeSelection', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    const none = PS.describeSelection(PS.evaluate());
    assert(none.tone === 'unselected', 'no spec → unselected tone');
    assert(none.headline === 'No print specification selected', 'no spec → headline');
    assert(none.detail.length > 0, 'no spec → has detail');

    const valid = PS.describeSelection(PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 }));
    assert(valid.tone === 'selected', 'valid spec → selected tone');
    assert(valid.headline === 'Internal print spec selected', 'valid spec → headline');
    assert(valid.detail === 'Export pipeline is still not implemented.', 'valid spec → export-pipeline-still-missing detail');

    const over = PS.describeSelection(PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 401, maxPages: 400 }));
    assert(over.tone === 'blocked', 'selected-but-over-limit → blocked tone');
    assert(over.headline === 'Internal print spec selected', 'over-limit → still selected headline');
    assert(over.detail.indexOf('page limit') !== -1, 'over-limit → page-limit detail');

    const unknown = PS.describeSelection(PS.evaluate({ selectedSpecId: 'nope', pageCount: 120, maxPages: 400 }));
    assert(unknown.tone === 'blocked', 'unknown spec → blocked tone');
    assert(unknown.headline === 'Print specification not recognized', 'unknown → not-recognized headline');

    // Defensive: null result → unselected.
    const nul = PS.describeSelection(null);
    assert(nul.tone === 'unselected' && nul.headline.length > 0, 'null result → defensive unselected');

    // Fresh object per call.
    const a = PS.describeSelection(PS.evaluate());
    a.headline = 'mutated';
    assert(PS.describeSelection(PS.evaluate()).headline === 'No print specification selected',
        'describeSelection returns a fresh object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — describeActions
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — describeActions', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    const none = PS.describeActions(PS.evaluate());
    assert(none.length === 1 && none[0].action === 'use-spec', 'no spec → offers use-spec');
    assert(none[0].label === 'Use internal print spec', 'use-spec safe label');

    const valid = PS.describeActions(PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 }));
    assert(valid.length === 1 && valid[0].action === 'clear-spec', 'valid spec → offers clear-spec');
    assert(valid[0].label === 'Clear print spec', 'clear-spec safe label');

    const over = PS.describeActions(PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 401, maxPages: 400 }));
    assert(over.length === 1 && over[0].action === 'clear-spec', 'selected-but-invalid → still offers clear-spec');

    const unknown = PS.describeActions(PS.evaluate({ selectedSpecId: 'nope' }));
    assert(unknown.length === 1 && unknown[0].action === 'use-spec', 'unknown → offers use-spec (replace with internal)');

    // Fresh array per call.
    PS.describeActions(PS.evaluate()).push({ action: 'x' });
    assert(PS.describeActions(PS.evaluate()).length === 1, 'describeActions returns a fresh array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — coerceSelectedSpecId (restore coercion)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — coerceSelectedSpecId', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    assert(PS.coerceSelectedSpecId(SPEC_ID) === SPEC_ID, 'known internal id → kept');
    assert(PS.coerceSelectedSpecId('other-spec') === null, 'unknown id → null');
    assert(PS.coerceSelectedSpecId(SPEC_ID + ' ') === null, 'near-miss id → null');
    [null, undefined, 0, 123, true, {}, [], ''].forEach(function (v) {
        assert(PS.coerceSelectedSpecId(v) === null, 'non-known value ' + JSON.stringify(v) + ' → null');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — display helpers carry no unsafe commerce/production claim or CTA
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — display copy safety', function () {
    const PS = makeCtx().MessageBookPrintSpec;

    const results = [
        PS.evaluate(),
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 400 }),
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 401, maxPages: 400 }),
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 0, maxPages: 400 }),
        PS.evaluate({ selectedSpecId: SPEC_ID, pageCount: 120, maxPages: 0 }),
        PS.evaluate({ selectedSpecId: 'nope' })
    ];
    const strings = [];
    results.forEach(function (r) {
        const d = PS.describeSelection(r);
        strings.push(d.headline, d.detail);
        PS.describeActions(r).forEach(function (a) { strings.push(a.label); });
    });
    const blob = strings.join('  ').toLowerCase();

    ['buy', 'pay', 'order now', 'place order', 'add to cart', 'add to bag', 'checkout now',
     'purchase', 'print now', 'send to vendor', 'production ready', 'ready to print',
     'ship ', 'shipping', 'manufactured', 'now available'].forEach(function (term) {
        assert(blob.indexOf(term) === -1, 'display copy contains no unsafe claim/CTA "' + term + '"');
    });
    // Safe affirmative copy IS present.
    assert(blob.indexOf('use internal print spec') !== -1, 'offers the safe select label');
    assert(blob.indexOf('clear print spec') !== -1, 'offers the safe clear label');
    assert(blob.indexOf('export pipeline is still not implemented') !== -1, 'states export pipeline is still not implemented');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — 8D live select/clear/restore mapping into the real 8A boundary
// ─────────────────────────────────────────────────────────────────────────────
// Reproduces exactly what index.html renderBookPrintSpecPanel + renderBookManufacturingStatus
// do: evaluate the local selection against live page bounds, bridge it via
// toManufacturingCapabilities, and resolve the real 8A boundary with the lower gates satisfied.
suite('Suite 20 — 8D live mapping into MessageBookManufacturingReadiness', function () {
    const KM = makeIntegrationCtx();
    const PS = KM.MessageBookPrintSpec;
    const MR = KM.MessageBookManufacturingReadiness;

    const READY_LOWER = { readiness: { checkoutEligible: true }, intent: { active: true } };
    function live(selectedSpecId, pageCount, maxPages) {
        const result = PS.evaluate({ selectedSpecId: selectedSpecId, pageCount: pageCount, maxPages: maxPages });
        const caps   = PS.toManufacturingCapabilities(result);
        return MR.resolveFromReadiness(Object.assign({ capabilities: caps }, READY_LOWER));
    }

    // No spec selected → blocked at print-spec-not-selected.
    assert(live(null, 120, 400).result.primaryBlocker === 'print-spec-not-selected',
        'no selection → print-spec-not-selected');

    // Select the internal spec, under the limit → advances to export-pipeline-not-implemented.
    const sel = live(PS.INTERNAL_SPEC_ID, 120, 400);
    assert(sel.result.exportSpecKnown === true, 'valid selection → export-spec-known');
    assert(sel.result.primaryBlocker === 'export-pipeline-not-implemented',
        'valid selection → next blocker export-pipeline-not-implemented');
    assert(sel.result.printFileReady === false && sel.result.vendorReady === false &&
        sel.result.manufacturingReady === false && sel.result.packagingReady === false,
        'valid selection → no higher production rung advances');
    assert(sel.display.tone === 'gated', 'valid selection → 8A still gated');

    // Selected but over the page limit → does NOT advance.
    assert(live(PS.INTERNAL_SPEC_ID, 401, 400).result.primaryBlocker === 'print-spec-not-selected',
        'selected-but-over-limit → still print-spec-not-selected');

    // Clear (back to null) → blocked again.
    assert(live(null, 120, 400).result.primaryBlocker === 'print-spec-not-selected',
        'cleared selection → print-spec-not-selected');

    // Restore path: a persisted KNOWN id coerces through and revalidates against bounds.
    const restoredKnown = PS.coerceSelectedSpecId(PS.INTERNAL_SPEC_ID);
    assert(restoredKnown === PS.INTERNAL_SPEC_ID, 'known persisted id restores');
    assert(live(restoredKnown, 120, 400).result.primaryBlocker === 'export-pipeline-not-implemented',
        'restored selection revalidates → advances when under limit');
    assert(live(restoredKnown, 401, 400).result.primaryBlocker === 'print-spec-not-selected',
        'restored selection revalidates → does NOT advance when over limit');

    // Restore path: a persisted UNKNOWN id coerces to null → no advance.
    const restoredUnknown = PS.coerceSelectedSpecId('stale-or-unknown-spec');
    assert(restoredUnknown === null, 'unknown persisted id coerces to null');
    assert(live(restoredUnknown, 120, 400).result.primaryBlocker === 'print-spec-not-selected',
        'restored unknown selection → print-spec-not-selected');

    // A valid selection never jumps an unsatisfied lower gate.
    const caps = PS.toManufacturingCapabilities(PS.evaluate({ selectedSpecId: PS.INTERNAL_SPEC_ID, pageCount: 120, maxPages: 400 }));
    const ineligible = MR.resolveFromReadiness({ readiness: { checkoutEligible: false }, intent: { active: false }, capabilities: caps });
    assert(ineligible.result.primaryBlocker === 'checkout-not-eligible',
        'valid selection under ineligible proof → checkout-not-eligible (does not jump the queue)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
