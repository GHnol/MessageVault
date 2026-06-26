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

// MessageBookReadiness is a pure function of its inputs and references no sibling
// module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-readiness.js');
    return ctx.window.KMEngine;
}

// The integration suite cross-checks the real producers feeding the gate.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/proof-approval-state.js');
    load(ctx, 'src/products/proof-preview-contract.js');
    load(ctx, 'src/products/book-composition.js');
    load(ctx, 'src/products/message-book-readiness.js');
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

// A fully checkout-eligible input: content, under the page limit, an approved and
// current proof, and no blocking preflight failure.
const ELIGIBLE = Object.freeze({
    engineSupported:           true,
    hasContent:                true,
    exceedsPageLimit:          false,
    approvalStatus:            'approved',
    approvalStale:             false,
    preflightBlockingFailures: 0
});

function withInput(over) {
    return Object.assign({}, ELIGIBLE, over);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const MBR = makeCtx().MessageBookReadiness;

    assert(typeof MBR === 'object' && MBR !== null, 'KMEngine.MessageBookReadiness is an object');
    assert(MBR.CONTRACT_VERSION === 'kmbr1', 'CONTRACT_VERSION is "kmbr1"');
    assert(MBR.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(typeof MBR.LEVEL === 'object' && MBR.LEVEL !== null, 'LEVEL is an object');
    assert(typeof MBR.BLOCKER === 'object' && MBR.BLOCKER !== null, 'BLOCKER is an object');
    assert(MBR.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    assert(typeof MBR.evaluate === 'function', 'evaluate is a function');
    assert(typeof MBR.isCheckoutEligible === 'function', 'isCheckoutEligible is a function');
    assert(typeof MBR.blockerMessage === 'function', 'blockerMessage is a function');
    assert(typeof MBR.describeBoundary === 'function', 'describeBoundary is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — LEVEL constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — LEVEL constants', function () {
    const L = makeCtx().MessageBookReadiness.LEVEL;

    assert(L.UNSUPPORTED            === 'unsupported',            'UNSUPPORTED');
    assert(L.ENGINE_SUPPORTED       === 'engine-supported',      'ENGINE_SUPPORTED');
    assert(L.PREVIEWABLE            === 'previewable',            'PREVIEWABLE');
    assert(L.PROOF_REVIEWABLE       === 'proof-reviewable',      'PROOF_REVIEWABLE');
    assert(L.PROOF_APPROVED_CURRENT === 'proof-approved-current','PROOF_APPROVED_CURRENT');
    assert(L.CHECKOUT_ELIGIBLE      === 'checkout-eligible',     'CHECKOUT_ELIGIBLE');

    // Frozen.
    try { 'use strict'; L.CHECKOUT_ELIGIBLE = 'mutated'; } catch (e) { /* strict throw ok */ }
    assert(L.CHECKOUT_ELIGIBLE === 'checkout-eligible', 'LEVEL is immutable (frozen)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — BLOCKER constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — BLOCKER constants', function () {
    const B = makeCtx().MessageBookReadiness.BLOCKER;

    assert(B.ENGINE_UNSUPPORTED         === 'engine-unsupported',         'ENGINE_UNSUPPORTED');
    assert(B.NO_CONTENT                 === 'no-content',                 'NO_CONTENT');
    assert(B.OVER_PAGE_LIMIT            === 'over-page-limit',            'OVER_PAGE_LIMIT');
    assert(B.PROOF_NOT_SUBMITTED        === 'proof-not-submitted',        'PROOF_NOT_SUBMITTED');
    assert(B.PROOF_PENDING_REVIEW       === 'proof-pending-review',       'PROOF_PENDING_REVIEW');
    assert(B.PROOF_CHANGES_REQUESTED    === 'proof-changes-requested',    'PROOF_CHANGES_REQUESTED');
    assert(B.PROOF_REVOKED              === 'proof-revoked',              'PROOF_REVOKED');
    assert(B.PROOF_APPROVAL_STALE       === 'proof-approval-stale',       'PROOF_APPROVAL_STALE');
    assert(B.PREFLIGHT_BLOCKING_FAILURE === 'preflight-blocking-failure', 'PREFLIGHT_BLOCKING_FAILURE');

    // Every blocker code resolves to a non-empty safe message.
    const MBR = makeCtx().MessageBookReadiness;
    Object.keys(B).forEach(function (k) {
        const msg = MBR.blockerMessage(B[k]);
        assert(typeof msg === 'string' && msg.length > 0, B[k] + ' has a non-empty message');
    });
    assert(MBR.blockerMessage('not-a-code') === '', 'unknown blocker code → empty message');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — fully checkout-eligible happy path
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — checkout-eligible happy path', function () {
    const MBR = makeCtx().MessageBookReadiness;
    const r = MBR.evaluate(ELIGIBLE);

    assert(r.productTypeId === 'message-book', 'result is scoped to message-book');
    assert(r.engineSupported === true,      'engineSupported true');
    assert(r.previewable === true,          'previewable true');
    assert(r.proofReviewable === true,      'proofReviewable true');
    assert(r.proofApprovedCurrent === true, 'proofApprovedCurrent true');
    assert(r.checkoutEligible === true,     'checkoutEligible true for current approved proof');
    assert(r.furthestLevel === 'checkout-eligible', 'furthestLevel is checkout-eligible');
    assert(Array.isArray(r.blockers) && r.blockers.length === 0, 'no blockers');
    assert(r.primaryBlocker === null, 'primaryBlocker is null');
    assert(MBR.isCheckoutEligible(ELIGIBLE) === true, 'isCheckoutEligible convenience matches');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — checkout eligibility is FALSE for every blocking condition
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — checkout-ineligible matrix (acceptance #2, #4)', function () {
    const MBR = makeCtx().MessageBookReadiness;
    const B = MBR.BLOCKER;

    const cases = [
        // [label, input-override, expected primary blocker]
        ['no content',                 { hasContent: false },                              B.NO_CONTENT],
        ['over page limit',            { exceedsPageLimit: true },                         B.OVER_PAGE_LIMIT],
        ['proof pending review',       { approvalStatus: 'pending-review' },               B.PROOF_PENDING_REVIEW],
        ['proof stale (status)',       { approvalStatus: 'stale' },                        B.PROOF_APPROVAL_STALE],
        ['approved but old fingerprint', { approvalStatus: 'approved', approvalStale: true }, B.PROOF_APPROVAL_STALE],
        ['proof approval missing',     { approvalStatus: 'none' },                         B.PROOF_NOT_SUBMITTED],
        ['changes requested',          { approvalStatus: 'changes-requested' },            B.PROOF_CHANGES_REQUESTED],
        ['proof revoked',             { approvalStatus: 'revoked' },                       B.PROOF_REVOKED],
        ['engine unsupported',         { engineSupported: false },                         B.ENGINE_UNSUPPORTED],
        ['blocking preflight failure', { preflightBlockingFailures: 1 },                   B.PREFLIGHT_BLOCKING_FAILURE]
    ];

    cases.forEach(function (c) {
        const r = MBR.evaluate(withInput(c[1]));
        assert(r.checkoutEligible === false, c[0] + ' → checkoutEligible false');
        assert(r.blockers.indexOf(c[2]) !== -1, c[0] + ' → reports blocker ' + c[2]);
        assert(r.primaryBlocker === r.blockers[0], c[0] + ' → primaryBlocker is first blocker');
        assert(r.furthestLevel !== 'checkout-eligible', c[0] + ' → furthestLevel is not checkout-eligible');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — readiness ladder monotonicity + furthestLevel
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — ladder monotonicity', function () {
    const MBR = makeCtx().MessageBookReadiness;

    // unsupported floor
    const u = MBR.evaluate(withInput({ engineSupported: false, hasContent: false, approvalStatus: 'none' }));
    assert(u.engineSupported === false, 'unsupported: engineSupported false');
    assert(u.previewable === false && u.proofReviewable === false, 'unsupported: nothing above engine');
    assert(u.furthestLevel === 'unsupported', 'unsupported: furthestLevel is unsupported');

    // engine-supported but no content → previewable false (you need content to preview)
    const eng = MBR.evaluate(withInput({ hasContent: false, approvalStatus: 'none' }));
    assert(eng.engineSupported === true && eng.previewable === false, 'no content: engine yes, preview no');
    assert(eng.furthestLevel === 'engine-supported', 'no content: furthestLevel engine-supported');

    // previewable but over limit → proofReviewable false
    const prev = MBR.evaluate(withInput({ exceedsPageLimit: true, approvalStatus: 'none' }));
    assert(prev.previewable === true && prev.proofReviewable === false, 'over limit: preview yes, proof-review no');
    assert(prev.furthestLevel === 'previewable', 'over limit: furthestLevel previewable');

    // proof-reviewable but not yet approved → proofApprovedCurrent false
    const rev = MBR.evaluate(withInput({ approvalStatus: 'pending-review' }));
    assert(rev.proofReviewable === true && rev.proofApprovedCurrent === false, 'pending: review yes, approved-current no');
    assert(rev.furthestLevel === 'proof-reviewable', 'pending: furthestLevel proof-reviewable');

    // approved+current but a blocking preflight failure → checkout false
    const appr = MBR.evaluate(withInput({ preflightBlockingFailures: 2 }));
    assert(appr.proofApprovedCurrent === true && appr.checkoutEligible === false,
        'preflight failure: approved-current yes, checkout no');
    assert(appr.furthestLevel === 'proof-approved-current', 'preflight failure: furthestLevel proof-approved-current');

    // For any input, each rung implies every rung below it.
    [u, eng, prev, rev, appr, MBR.evaluate(ELIGIBLE)].forEach(function (r, idx) {
        if (r.checkoutEligible)     assert(r.proofApprovedCurrent, 'case ' + idx + ': checkout ⇒ approved-current');
        if (r.proofApprovedCurrent) assert(r.proofReviewable,      'case ' + idx + ': approved-current ⇒ reviewable');
        if (r.proofReviewable)      assert(r.previewable,          'case ' + idx + ': reviewable ⇒ previewable');
        if (r.previewable)          assert(r.engineSupported,      'case ' + idx + ': previewable ⇒ engine-supported');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — checkoutEligible ⇔ no blockers (structural invariant)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — checkoutEligible equals (blockers.length === 0)', function () {
    const MBR = makeCtx().MessageBookReadiness;

    const statuses = ['none', 'pending-review', 'approved', 'changes-requested', 'revoked', 'stale'];
    let combos = 0;
    [true, false].forEach(function (hasContent) {
        [true, false].forEach(function (overLimit) {
            statuses.forEach(function (st) {
                [true, false].forEach(function (stale) {
                    [0, 1].forEach(function (pf) {
                        const r = MBR.evaluate({
                            hasContent: hasContent,
                            exceedsPageLimit: overLimit,
                            approvalStatus: st,
                            approvalStale: stale,
                            preflightBlockingFailures: pf
                        });
                        assert(r.checkoutEligible === (r.blockers.length === 0),
                            'invariant holds for ' + [hasContent, overLimit, st, stale, pf].join('/'));
                        combos++;
                    });
                });
            });
        });
    });
    assert(combos === 2 * 2 * 6 * 2 * 2, 'covered the full ' + combos + '-combination grid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — higher gates remain explicitly false (acceptance #4, #15)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — manufacturing/vendor/production/export/packaging gated false', function () {
    const MBR = makeCtx().MessageBookReadiness;

    // True even when the book is fully checkout-eligible: these are separate gates.
    [ELIGIBLE, {}, withInput({ approvalStatus: 'none' })].forEach(function (inp, idx) {
        const r = MBR.evaluate(inp);
        assert(r.manufacturingReady === false, 'case ' + idx + ': manufacturingReady false');
        assert(r.vendorReady === false,        'case ' + idx + ': vendorReady false');
        assert(r.productionReady === false,    'case ' + idx + ': productionReady false');
        assert(r.exportReady === false,        'case ' + idx + ': exportReady false');
        assert(r.packagingReady === false,     'case ' + idx + ': packagingReady false');
        assert(r.gatedReason === 'not-implemented', 'case ' + idx + ': gatedReason not-implemented');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — blocker priority order + safe messages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — blocker priority + safe messages', function () {
    const MBR = makeCtx().MessageBookReadiness;
    const B = MBR.BLOCKER;

    // Multiple problems at once: order is engine → content → over-limit → proof → preflight.
    const r = MBR.evaluate({
        engineSupported: false,
        hasContent: false,
        exceedsPageLimit: true,
        approvalStatus: 'pending-review',
        preflightBlockingFailures: 1
    });
    assert(r.blockers[0] === B.ENGINE_UNSUPPORTED, 'engine-unsupported is first');
    assert(r.blockers[1] === B.NO_CONTENT,        'no-content is second');
    assert(r.blockers[2] === B.OVER_PAGE_LIMIT,   'over-page-limit is third');
    assert(r.blockers[3] === B.PROOF_PENDING_REVIEW, 'proof status is fourth');
    assert(r.blockers[4] === B.PREFLIGHT_BLOCKING_FAILURE, 'preflight failure is last');
    assert(r.primaryBlocker === B.ENGINE_UNSUPPORTED, 'primaryBlocker is the most fundamental');

    // Exactly one proof-status blocker is ever emitted.
    const proofCodes = [B.PROOF_NOT_SUBMITTED, B.PROOF_PENDING_REVIEW, B.PROOF_CHANGES_REQUESTED,
        B.PROOF_REVOKED, B.PROOF_APPROVAL_STALE];
    const proofCount = r.blockers.filter(function (c) { return proofCodes.indexOf(c) !== -1; }).length;
    assert(proofCount === 1, 'exactly one proof-status blocker emitted');

    // blockerMessages aligns 1:1 with blockers and carries safe, non-CTA strings.
    assert(r.blockerMessages.length === r.blockers.length, 'blockerMessages aligns with blockers');
    r.blockerMessages.forEach(function (m, i) {
        assert(m === MBR.blockerMessage(r.blockers[i]), 'blockerMessages[' + i + '] matches code');
        const low = m.toLowerCase();
        ['buy', 'pay', 'order now', 'add to cart', 'checkout now', 'print now'].forEach(function (cta) {
            assert(low.indexOf(cta) === -1, 'message has no CTA "' + cta + '"');
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — defaults + defensive inputs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — defaults + defensive inputs', function () {
    const MBR = makeCtx().MessageBookReadiness;
    const B = MBR.BLOCKER;

    // undefined / null / {} never throw; default to engine-supported, no content.
    [undefined, null, {}].forEach(function (inp) {
        const r = MBR.evaluate(inp);
        assert(r.engineSupported === true, 'default engineSupported true for ' + JSON.stringify(inp));
        assert(r.previewable === false, 'no content by default → not previewable');
        assert(r.checkoutEligible === false, 'no content by default → not checkout-eligible');
        assert(r.primaryBlocker === B.NO_CONTENT, 'default primary blocker is no-content');
    });

    // Unknown approval status is treated as "no usable approval".
    const unk = MBR.evaluate(withInput({ approvalStatus: 'banana' }));
    assert(unk.blockers.indexOf(B.PROOF_NOT_SUBMITTED) !== -1, 'unknown status → proof-not-submitted');
    assert(unk.checkoutEligible === false, 'unknown status → not eligible');

    // Non-number / negative / zero preflight counts are treated as no failure.
    [undefined, 'x', -3, 0, NaN].forEach(function (pf) {
        const r = MBR.evaluate(withInput({ preflightBlockingFailures: pf }));
        assert(r.blockers.indexOf(B.PREFLIGHT_BLOCKING_FAILURE) === -1,
            'preflightBlockingFailures=' + String(pf) + ' → no preflight blocker');
        assert(r.checkoutEligible === true, 'preflightBlockingFailures=' + String(pf) + ' → still eligible');
    });

    // engineSupported only blocks when strictly false (not merely falsy-by-absence handling).
    assert(MBR.evaluate(withInput({ engineSupported: undefined })).engineSupported === true,
        'engineSupported undefined defaults true');
    assert(MBR.evaluate(withInput({ engineSupported: false })).engineSupported === false,
        'engineSupported false respected');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — purity: deterministic + no input mutation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — purity (deterministic, no mutation)', function () {
    const MBR = makeCtx().MessageBookReadiness;

    const input = withInput({ exceedsPageLimit: true, approvalStatus: 'pending-review',
        preflightBlockingFailures: 1 });
    const snapshot = JSON.stringify(input);

    const a = MBR.evaluate(input);
    const b = MBR.evaluate(input);
    assert(JSON.stringify(a) === JSON.stringify(b), 'same input yields identical result');
    assert(JSON.stringify(input) === snapshot, 'evaluate does not mutate its input');

    // Returned arrays are independent per call (no shared mutable state).
    a.blockers.push('tampered');
    const c = MBR.evaluate(input);
    assert(c.blockers.indexOf('tampered') === -1, 'mutating a returned result does not affect later calls');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — describeBoundary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — describeBoundary', function () {
    const MBR = makeCtx().MessageBookReadiness;
    const d = MBR.describeBoundary();

    assert(d && typeof d === 'object', 'describeBoundary returns an object');
    assert(d.version === 'kmbr1', 'carries the contract version');
    assert(typeof d.decides === 'string' && d.decides.indexOf('checkout') !== -1,
        'states it decides checkout readiness');
    assert(d.recordedOnDevice === true, 'recordedOnDevice true');
    assert(typeof d.doesNot === 'string'
        && d.doesNot.toLowerCase().indexOf('does not') !== -1,
        'doesNot disclaims commerce/production actions');
    assert(Array.isArray(d.separateGates) && d.separateGates.indexOf('manufacturing') !== -1
        && d.separateGates.indexOf('vendor') !== -1,
        'separateGates enumerates the downstream gates');

    // No affirmative commerce/production readiness fields.
    assert(d.orderCreated === undefined && d.purchased === undefined && d.printed === undefined,
        'boundary exposes no affirmative commerce/production fields');

    // Defensive copy.
    const d2 = MBR.describeBoundary();
    assert(d2 !== d, 'fresh object each call');
    assert(d2.separateGates !== d.separateGates, 'fresh separateGates array each call');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — source carries no commerce/production ACTION or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — no commerce/production action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-readiness.js'),
        'utf8'
    ).toLowerCase();

    // The module is ABOUT the checkout/manufacturing/vendor gates, so those nouns
    // legitimately appear. What must never appear is an ACTION that performs commerce
    // or production, or a call-to-action that would imply it.
    ['add to cart', 'addtocart', 'createorder', 'create order', 'placeorder', 'place order',
     'submitorder', 'createcheckout', 'checkout session', 'buy now', 'pay now', 'order now',
     'send to vendor', 'submit to vendor', 'send to print', 'print now', 'charge(',
     'stripe', 'paypal'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source contains no commerce CTA/action "' + term + '"');
    });

    // No side effects: pure decision module only. Call-form tokens are used so the
    // module's own purity documentation (e.g. the phrase "no Math.random") is not a
    // false positive — only an actual invocation would match.
    ['fetch(', 'xmlhttprequest', 'localstorage', 'sessionstorage', 'document.',
     'window.location', 'new date(', 'date.now(', 'math.random('].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source has no side-effect token "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — integration: real producers feed the gate consistently
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — integration with ProofApprovalState / ProofPreviewContract / BookComposition', function () {
    const KM  = makeIntegrationCtx();
    const PAS = KM.ProofApprovalState;
    const PPC = KM.ProofPreviewContract;
    const BC  = KM.BookComposition;
    const MBR = KM.MessageBookReadiness;

    // A minimal proof-affecting book state.
    const bookState = {
        format:  { trimWidthIn: 7, trimHeightIn: 10, maxPages: 250 },
        opening: { title: 'For Sam', dedicationEnabled: false, dedicationText: '' },
        body:    { timestampMode: 'daily', dividerMode: 'sparse', endingMode: 'branded', flowMode: 'runs' },
        volumes: [],
        sections: [
            { sourceGroupId: 'g1', orderIndex: 0, included: true,
              messages: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }] }
        ]
    };
    const contactName = 'Sam';

    // Approve the proof, bound to the current fingerprint.
    const fp = PAS.computeProofFingerprint(bookState, contactName);
    let rec = PAS.create({ productTypeId: 'message-book' }).state;
    rec = PAS.transition(rec, 'pending-review').state;
    rec = PAS.transition(rec, 'approved', { proofFingerprint: fp }).state;

    // Page-limit status from the composition engine (well under the limit).
    const within = BC.computePageLimitStatus({ pageCount: 12, maxPages: 250 });
    assert(within.exceedsPageLimit === false, 'within-limit page count is not over the limit');

    // Build the gate input from the real producers.
    function gateInput(currentFp, pageStatus) {
        return {
            hasContent:                true,
            exceedsPageLimit:          pageStatus.exceedsPageLimit,
            approvalStatus:            rec.status,
            approvalStale:             PAS.isApprovalStale(rec, currentFp),
            preflightBlockingFailures: 0
        };
    }

    // 1) Current approved proof, under the limit → checkout eligible, and the
    //    proof-preview phase is reviewable.
    const okInput = gateInput(fp, within);
    const okR = MBR.evaluate(okInput);
    assert(okR.checkoutEligible === true, 'current approved + within limit → checkout eligible');
    const okPhase = PPC.resolveProofPreviewPhase({
        approvalStatus: okInput.approvalStatus, hasContent: true,
        exceedsPageLimit: okInput.exceedsPageLimit, allBookCheckPassed: true
    });
    assert(PPC.isReviewablePhase(okPhase) === true && okR.proofReviewable === true,
        'preview-contract reviewable agrees with gate proofReviewable');

    // 2) A proof-affecting edit changes the fingerprint → isApprovalStale → the gate
    //    reports the stale blocker and withholds checkout (5D staleness drives 7A).
    const editedState = JSON.parse(JSON.stringify(bookState));
    editedState.sections[0].messages.push({ id: 'm4' });
    const editedFp = PAS.computeProofFingerprint(editedState, contactName);
    assert(editedFp !== fp, 'a content edit changes the proof fingerprint');
    const staleInput = gateInput(editedFp, within);
    const staleR = MBR.evaluate(staleInput);
    assert(staleInput.approvalStale === true, 'isApprovalStale true after the edit');
    assert(staleR.checkoutEligible === false, 'stale approval → not checkout eligible');
    assert(staleR.blockers.indexOf(MBR.BLOCKER.PROOF_APPROVAL_STALE) !== -1,
        'stale approval → proof-approval-stale blocker');

    // 3) Over the page limit → the readiness gate withholds proofReviewable / checkout
    //    unconditionally. For the actionable pre/post-submission phases, 6A also makes
    //    the preview-contract phase non-reviewable.
    const over = BC.computePageLimitStatus({ pageCount: 260, maxPages: 250 });
    assert(over.exceedsPageLimit === true, 'over-limit page count is over the limit');
    const overInput = gateInput(fp, over);
    const overR = MBR.evaluate(overInput);
    assert(overR.proofReviewable === false && overR.checkoutEligible === false,
        'over-limit → gate withholds proofReviewable and checkout');
    assert(overR.blockers.indexOf(MBR.BLOCKER.OVER_PAGE_LIMIT) !== -1, 'over-limit → over-page-limit blocker');

    const overPendingPhase = PPC.resolveProofPreviewPhase({
        approvalStatus: 'pending-review', hasContent: true, exceedsPageLimit: true, allBookCheckPassed: true
    });
    assert(PPC.isReviewablePhase(overPendingPhase) === false,
        'over-limit pending-review proof phase is non-reviewable (6A)');

    // 6A intentionally leaves an APPROVED phase reviewable on over-limit (5D staleness
    // handles a genuinely changed proof). The 7A checkout gate is independently stricter:
    // an over-limit approved proof is never checkout-eligible.
    const overApprovedPhase = PPC.resolveProofPreviewPhase({
        approvalStatus: 'approved', hasContent: true, exceedsPageLimit: true, allBookCheckPassed: true
    });
    assert(overApprovedPhase === 'approved', '6A leaves an approved phase as-is on over-limit');
    assert(overR.checkoutEligible === false, '7A still blocks checkout for an over-limit approved proof');

    // 4) Consistency: whenever the preview contract calls the phase non-reviewable due
    //    to empty/over-limit, the readiness gate also denies proofReviewable.
    [
        { hasContent: false, exceedsPageLimit: false },
        { hasContent: true,  exceedsPageLimit: true }
    ].forEach(function (facts) {
        const phase = PPC.resolveProofPreviewPhase(Object.assign({ approvalStatus: 'none',
            allBookCheckPassed: true }, facts));
        const rr = MBR.evaluate(Object.assign({ approvalStatus: 'none' }, facts));
        if (!PPC.isReviewablePhase(phase)) {
            assert(rr.proofReviewable === false,
                'non-reviewable phase ⇒ gate proofReviewable false for ' + JSON.stringify(facts));
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
