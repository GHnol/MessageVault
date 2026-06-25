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
    load(ctx, 'src/products/proof-approval-state.js');
    load(ctx, 'src/products/proof-approval-ux.js');
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
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    assert(typeof UX === 'object' && UX !== null,
        'KMEngine.ProofApprovalUX is an object');
    assert(typeof UX.initialize           === 'function', 'initialize is a function');
    assert(typeof UX.getState             === 'function', 'getState is a function');
    assert(typeof UX.submitForReview      === 'function', 'submitForReview is a function');
    assert(typeof UX.withdrawSubmission   === 'function', 'withdrawSubmission is a function');
    assert(typeof UX.approve              === 'function', 'approve is a function');
    assert(typeof UX.refreshStaleness     === 'function', 'refreshStaleness is a function');
    assert(typeof UX.getStatusLabel       === 'function', 'getStatusLabel is a function');
    assert(typeof UX.getAllowedUserActions === 'function', 'getAllowedUserActions is a function');
    assert(typeof UX.serialize            === 'function', 'serialize is a function');
    assert(typeof UX.restore              === 'function', 'restore is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — initialize creates message-book state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — initialize creates message-book state', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const res = UX.initialize('message-book');
    assert(res.success === true,  'initialize success is true');
    assert(res.error   === null,  'initialize error is null');
    assert(typeof res.state === 'object' && res.state !== null, 'initialize state is an object');
    assert(res.state.productTypeId === 'message-book', 'state productTypeId is message-book');
    assert(res.state.status        === 'none',         'initial status is none');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — initialize is idempotent
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — initialize is idempotent', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const res1 = UX.initialize('message-book');
    const res2 = UX.initialize('message-book');

    assert(res1.success === true, 'first initialize succeeds');
    assert(res2.success === true, 'second initialize succeeds');
    assert(res1.state.createdAt === res2.state.createdAt,
        'second initialize returns same createdAt (no new record created)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — getState before and after initialize
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — getState before and after initialize', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    assert(UX.getState('message-book') === null, 'getState before initialize returns null');

    UX.initialize('message-book');
    const st = UX.getState('message-book');
    assert(st !== null,                           'getState after initialize is not null');
    assert(st.status === 'none',                  'getState after initialize has status none');
    assert(st.productTypeId === 'message-book',   'getState returns correct productTypeId');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — submitForReview transitions none to pending-review
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — submitForReview transitions none to pending-review', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    const res = UX.submitForReview('message-book');

    assert(res.success === true,             'submitForReview success is true');
    assert(res.error   === null,             'submitForReview error is null');
    assert(res.state.status === 'pending-review', 'status transitions to pending-review');
    assert(typeof res.state.submittedAt === 'string' && res.state.submittedAt.length > 0,
        'submittedAt is set after submitForReview');

    const st = UX.getState('message-book');
    assert(st.status === 'pending-review',   'getState reflects updated status');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — submitForReview twice fails safely
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — submitForReview twice fails safely', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    const r1 = UX.submitForReview('message-book');
    assert(r1.success === true,  'first submit succeeds');

    const r2 = UX.submitForReview('message-book');
    assert(r2.success === false, 'second submit fails (already pending-review)');
    assert(typeof r2.error === 'string' && r2.error.length > 0,
        'second submit has error string');
    assert(r2.state === null,    'second submit state is null');

    const st = UX.getState('message-book');
    assert(st.status === 'pending-review',
        'state remains pending-review after failed second submit');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — getStatusLabel for all five statuses
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — getStatusLabel for all five statuses', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    assert(typeof UX.getStatusLabel('none')               === 'string' &&
           UX.getStatusLabel('none').length > 0,               'label for none');
    assert(typeof UX.getStatusLabel('pending-review')     === 'string' &&
           UX.getStatusLabel('pending-review').length > 0,     'label for pending-review');
    assert(typeof UX.getStatusLabel('approved')           === 'string' &&
           UX.getStatusLabel('approved').length > 0,           'label for approved');
    assert(typeof UX.getStatusLabel('changes-requested')  === 'string' &&
           UX.getStatusLabel('changes-requested').length > 0,  'label for changes-requested');
    assert(typeof UX.getStatusLabel('revoked')            === 'string' &&
           UX.getStatusLabel('revoked').length > 0,            'label for revoked');

    // Labels must be truthful local-only wording
    const pendingLabel = UX.getStatusLabel('pending-review');
    assert(!pendingLabel.toLowerCase().includes('sent')     &&
           !pendingLabel.toLowerCase().includes('upload')   &&
           !pendingLabel.toLowerCase().includes('order'),
        'pending-review label does not claim external action');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — getAllowedUserActions for all five statuses
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — getAllowedUserActions for all five statuses', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const noneActions = UX.getAllowedUserActions('none');
    assert(Array.isArray(noneActions),                       'none → returns array');
    assert(noneActions.includes('submit-for-review'),        'none → includes submit-for-review');

    const pendingActions = UX.getAllowedUserActions('pending-review');
    assert(Array.isArray(pendingActions),                          'pending-review → returns array');
    assert(pendingActions.includes('approve'),                     'pending-review → includes approve');
    assert(pendingActions.includes('withdraw-submission'),         'pending-review → includes withdraw-submission');
    assert(pendingActions.length === 2,                            'pending-review → exactly two user actions');
    assert(UX.getAllowedUserActions('approved').length         === 0, 'approved → no user actions');
    assert(UX.getAllowedUserActions('changes-requested').length === 0, 'changes-requested → no user actions');
    assert(UX.getAllowedUserActions('revoked').length           === 0, 'revoked → no user actions');

    const staleActions = UX.getAllowedUserActions('stale');
    assert(Array.isArray(staleActions),                  'stale → returns array');
    assert(staleActions.includes('submit-for-review'),   'stale → includes submit-for-review (re-review path)');
    assert(staleActions.length === 1,                    'stale → exactly one user action');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — serialize returns JSON-safe object
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — serialize returns JSON-safe object', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');

    const serialized = UX.serialize();
    assert(typeof serialized === 'object' && serialized !== null,
        'serialize returns an object');

    let threw = false;
    let parsed;
    try {
        parsed = JSON.parse(JSON.stringify(serialized));
    } catch (e) {
        threw = true;
    }
    assert(!threw,                                 'serialized is JSON-safe (no circular refs)');
    assert(typeof parsed['message-book'] === 'object',
        'message-book key survives JSON round-trip');
    assert(parsed['message-book'].status === 'pending-review',
        'status survives JSON round-trip');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — restore rehydrates pending-review state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — restore rehydrates pending-review state', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    const saved = JSON.parse(JSON.stringify(UX.serialize()));

    const KM2 = makeCtx();
    const UX2 = KM2.ProofApprovalUX;

    UX2.restore(saved);
    const st = UX2.getState('message-book');
    assert(st !== null,                              'restored state is not null');
    assert(st.status === 'pending-review',           'restored status is pending-review');
    assert(st.productTypeId === 'message-book',      'restored productTypeId is message-book');
    assert(typeof st.submittedAt === 'string' && st.submittedAt.length > 0,
        'submittedAt preserved through restore');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — restore null/undefined/empty data does not throw
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — restore null/undefined/empty data does not throw', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    let threw = false;
    try { UX.restore(null); }      catch (e) { threw = true; }
    assert(!threw, 'restore(null) does not throw');

    threw = false;
    try { UX.restore(undefined); } catch (e) { threw = true; }
    assert(!threw, 'restore(undefined) does not throw');

    threw = false;
    try { UX.restore({}); }        catch (e) { threw = true; }
    assert(!threw, 'restore({}) does not throw');

    UX.restore(null);
    assert(UX.getState('message-book') === null,
        'after restore(null), getState returns null');

    UX.restore({});
    assert(UX.getState('message-book') === null,
        'after restore({}), getState returns null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — restored pending-review state blocks duplicate submit
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — restored pending-review state blocks duplicate submit', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    const saved = JSON.parse(JSON.stringify(UX.serialize()));

    const KM2 = makeCtx();
    const UX2 = KM2.ProofApprovalUX;
    UX2.restore(saved);

    const res = UX2.submitForReview('message-book');
    assert(res.success === false,
        'submit on restored pending-review state fails');
    assert(UX2.getState('message-book').status === 'pending-review',
        'status remains pending-review after failed submit');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — restore tolerates unknown/extra fields on records
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — restore tolerates unknown/extra fields on records', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const dataWithExtras = {
        'message-book': {
            productTypeId: 'message-book',
            status: 'none',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            submittedAt: null,
            approvedAt: null,
            changesRequestedAt: null,
            revokedAt: null,
            changeRequestReason: null,
            revokeReason: null,
            notes: null,
            extraFutureField: 'some-value',
            anotherExtra: 42
        }
    };

    let threw = false;
    try { UX.restore(dataWithExtras); } catch (e) { threw = true; }
    assert(!threw, 'restore with extra fields does not throw');

    const st = UX.getState('message-book');
    assert(st !== null,              'state loaded despite extra fields');
    assert(st.status === 'none',     'status correct despite extra fields');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — module has no checkout/order/commerce/manufacturing/PDF/export/vendor fields
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — no prohibited fields or actions in module', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/proof-approval-ux.js'),
        'utf8'
    );

    const prohibited = [
        'checkout', 'payment', 'order', 'commerce', 'manufacturing',
        'exportReady', 'pdfExport', 'vendor', 'fulfillment'
    ];
    for (const term of prohibited) {
        assert(!src.includes(term),
            'proof-approval-ux.js does not reference "' + term + '"');
    }

    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    const st = UX.getState('message-book');

    assert(st.checkoutReady      === undefined, 'state has no checkoutReady');
    assert(st.commerceReady      === undefined, 'state has no commerceReady');
    assert(st.manufacturingReady === undefined, 'state has no manufacturingReady');
    assert(st.exportReady        === undefined, 'state has no exportReady');
    assert(st.orderReady         === undefined, 'state has no orderReady');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — submitForReview fails gracefully when not initialized
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — submitForReview fails gracefully when not initialized', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const res = UX.submitForReview('message-book');
    assert(res.success === false,          'submit without initialize fails');
    assert(typeof res.error === 'string',  'submit without initialize has error string');
    assert(res.state === null,             'submit without initialize state is null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — withdrawSubmission()
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — withdrawSubmission()', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    // Setup: initialize and submit
    UX.initialize('message-book');
    UX.submitForReview('message-book');

    // Successful withdrawal
    const res = UX.withdrawSubmission('message-book');
    assert(res.success === true,           'withdrawSubmission succeeds from pending-review');
    assert(res.error   === null,           'withdrawSubmission error is null on success');
    assert(res.state.status === 'none',    'state becomes none after withdrawal');
    assert(res.state.submittedAt === null, 'submittedAt is null after withdrawal');

    // getState reflects withdrawal
    const st = UX.getState('message-book');
    assert(st.status === 'none', 'getState reflects none after withdrawal');

    // After withdrawal, getAllowedUserActions returns submit-for-review
    const actions = UX.getAllowedUserActions('none');
    assert(actions.includes('submit-for-review'), 'after withdrawal, submit-for-review is available again');

    // Double withdrawal fails (already none)
    const r2 = UX.withdrawSubmission('message-book');
    assert(r2.success === false, 'second withdrawal (from none) fails');
    assert(typeof r2.error === 'string' && r2.error.length > 0,
        'second withdrawal has error string');
    assert(r2.state === null, 'second withdrawal state is null');

    // State remains none after failed double withdrawal
    assert(UX.getState('message-book').status === 'none', 'state remains none after failed withdrawal');

    // No prohibited fields introduced by withdrawal
    const withdrawn = UX.getState('message-book');
    assert(withdrawn.approvedAt          === null,      'approvedAt null after withdrawal');
    assert(withdrawn.changesRequestedAt  === null,      'changesRequestedAt null after withdrawal');
    assert(withdrawn.revokedAt           === null,      'revokedAt null after withdrawal');
    assert(withdrawn.checkoutReady       === undefined, 'no checkoutReady after withdrawal');
    assert(withdrawn.commerceReady       === undefined, 'no commerceReady after withdrawal');
    assert(withdrawn.manufacturingReady  === undefined, 'no manufacturingReady after withdrawal');
    assert(withdrawn.orderReady          === undefined, 'no orderReady after withdrawal');
});

suite('Suite 16b — withdrawSubmission() uninitialized and resubmit', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    // Withdrawal before initialize fails
    const r = UX.withdrawSubmission('message-book');
    assert(r.success === false, 'withdrawal before initialize fails');
    assert(typeof r.error === 'string', 'withdrawal before initialize has error string');
    assert(r.state === null, 'withdrawal before initialize state is null');

    // After withdrawal, user can resubmit
    UX.initialize('message-book');
    UX.submitForReview('message-book');
    UX.withdrawSubmission('message-book');
    const resubmit = UX.submitForReview('message-book');
    assert(resubmit.success === true, 'can resubmit after withdrawal');
    assert(UX.getState('message-book').status === 'pending-review',
        'status is pending-review after resubmit following withdrawal');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — approve() captures fingerprint and reaches approved (Package 5D)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — approve() captures fingerprint and reaches approved', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');

    const res = UX.approve('message-book', 'kmpf1:fp-1');
    assert(res.success === true,                 'approve succeeds from pending-review');
    assert(res.state.status === 'approved',      'status is approved after approve');
    assert(res.state.approvedProofFingerprint === 'kmpf1:fp-1', 'approve captures the supplied fingerprint');
    assert(typeof res.state.approvedAt === 'string' && res.state.approvedAt.length > 0, 'approvedAt set');

    assert(UX.getState('message-book').status === 'approved', 'getState reflects approved');

    // Second approve (already approved) fails — no self-transition
    const r2 = UX.approve('message-book', 'kmpf1:fp-2');
    assert(r2.success === false, 'second approve (already approved) fails');
    assert(UX.getState('message-book').status === 'approved', 'state remains approved after failed approve');
    assert(UX.getState('message-book').approvedProofFingerprint === 'kmpf1:fp-1',
        'fingerprint unchanged after failed approve');
});

suite('Suite 17b — approve() guards', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const r0 = UX.approve('message-book', 'kmpf1:x');
    assert(r0.success === false, 'approve before initialize fails');
    assert(r0.state === null,    'approve before initialize state null');

    UX.initialize('message-book');
    const r1 = UX.approve('message-book', 'kmpf1:x');
    assert(r1.success === false, 'approve from none fails (must be pending-review)');
    assert(UX.getState('message-book').status === 'none', 'state remains none after failed approve');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — refreshStaleness() flips approved → stale on content change
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — refreshStaleness() flips approved → stale on content change', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    UX.approve('message-book', 'kmpf1:original');

    const same = UX.refreshStaleness('message-book', 'kmpf1:original');
    assert(same.success === true,  'refreshStaleness succeeds with matching fingerprint');
    assert(same.changed === false, 'no change when fingerprint matches');
    assert(UX.getState('message-book').status === 'approved', 'remains approved when fingerprint matches');

    const diff = UX.refreshStaleness('message-book', 'kmpf1:edited');
    assert(diff.success === true,            'refreshStaleness succeeds with different fingerprint');
    assert(diff.changed === true,            'changed true when fingerprint differs');
    assert(diff.state.status === 'stale',    'status flips to stale on content change');
    assert(UX.getState('message-book').status === 'stale', 'getState reflects stale');

    const again = UX.refreshStaleness('message-book', 'kmpf1:edited');
    assert(again.changed === false, 'no further change once already stale');
});

suite('Suite 18b — refreshStaleness() no-op for non-approved and uninitialized', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const r0 = UX.refreshStaleness('message-book', 'kmpf1:x');
    assert(r0.success === false, 'refreshStaleness before initialize fails');

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    const r1 = UX.refreshStaleness('message-book', 'kmpf1:anything');
    assert(r1.changed === false, 'pending-review never goes stale');
    assert(UX.getState('message-book').status === 'pending-review', 'pending-review unchanged');

    UX.approve('message-book'); // approve without a fingerprint
    const r2 = UX.refreshStaleness('message-book', 'kmpf1:anything');
    assert(r2.changed === false, 'approved without stored fingerprint never goes stale');
    assert(UX.getState('message-book').status === 'approved', 'remains approved without stored fingerprint');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — getStatusLabel("stale") is truthful local-only wording
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — getStatusLabel("stale") is truthful local-only wording', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    const label = UX.getStatusLabel('stale');
    assert(typeof label === 'string' && label.length > 0, 'stale has a non-empty label');
    const lc = label.toLowerCase();
    assert(!lc.includes('sent') && !lc.includes('upload') && !lc.includes('order'),
        'stale label does not claim external action');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — serialize/restore preserves fingerprint and stale state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 20 — serialize/restore preserves fingerprint and stale state', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    UX.approve('message-book', 'kmpf1:saved-fp');

    const saved = JSON.parse(JSON.stringify(UX.serialize()));
    assert(saved['message-book'].status === 'approved', 'serialized status is approved');
    assert(saved['message-book'].approvedProofFingerprint === 'kmpf1:saved-fp',
        'serialized record carries approvedProofFingerprint');

    const KM2 = makeCtx();
    const UX2 = KM2.ProofApprovalUX;
    UX2.restore(saved);
    const st = UX2.getState('message-book');
    assert(st.status === 'approved', 'restored status is approved');
    assert(st.approvedProofFingerprint === 'kmpf1:saved-fp', 'restored fingerprint preserved');

    assert(KM2.ProofApprovalState.isApprovalStale(st, 'kmpf1:changed') === true,
        'restored approval is detected stale against a changed proof');
    const refreshed = UX2.refreshStaleness('message-book', 'kmpf1:changed');
    assert(refreshed.changed === true && refreshed.state.status === 'stale',
        'restored approval flips to stale on changed proof');

    const savedStale = JSON.parse(JSON.stringify(UX2.serialize()));
    assert(savedStale['message-book'].status === 'stale', 'stale status survives serialize');
    const KM3 = makeCtx();
    KM3.ProofApprovalUX.restore(savedStale);
    assert(KM3.ProofApprovalUX.getState('message-book').status === 'stale', 'stale status survives restore');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 21 — approve()/stale introduce no commerce/manufacturing fields
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 21 — approve()/stale introduce no commerce/manufacturing fields', function () {
    const KM = makeCtx();
    const UX = KM.ProofApprovalUX;

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    UX.approve('message-book', 'kmpf1:z');
    UX.refreshStaleness('message-book', 'kmpf1:z2'); // → stale
    const st = UX.getState('message-book');

    assert(st.status === 'stale',                'reached stale via approve + content change');
    assert(st.checkoutReady      === undefined,  'no checkoutReady on stale state');
    assert(st.commerceReady      === undefined,  'no commerceReady on stale state');
    assert(st.manufacturingReady === undefined,  'no manufacturingReady on stale state');
    assert(st.exportReady        === undefined,  'no exportReady on stale state');
    assert(st.orderReady         === undefined,  'no orderReady on stale state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 22 — contactName change marks an approved proof stale (Proof Approval 5D)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 22 — contactName change marks an approved proof stale', function () {
    const KM  = makeCtx();
    const UX  = KM.ProofApprovalUX;
    const PAS = KM.ProofApprovalState;

    const book = {
        format: { trimWidthIn: 7, trimHeightIn: 10, maxPages: 250 },
        opening: { title: 'Our Conversation', dedicationEnabled: false, dedicationText: '' },
        body: { timestampMode: 'on', pageNumberMode: 'on', dividerMode: 'sparse',
                endingMode: 'branded', flowMode: 'sectioned' },
        volumes: [ { id: 'vol-1', name: 'Volume 1' } ],
        activeVolumeId: 'vol-1',
        sections: [ { sourceGroupId: 'g1', orderIndex: 0, included: true, messages: [ { id: 'm1' } ] } ]
    };

    UX.initialize('message-book');
    UX.submitForReview('message-book');
    UX.approve('message-book', PAS.computeProofFingerprint(book, 'Alex'));
    assert(UX.getState('message-book').status === 'approved', 'approved with contactName-bound fingerprint');

    // Re-render with the SAME contactName → not stale (no false invalidation)
    const same = UX.refreshStaleness('message-book', PAS.computeProofFingerprint(book, 'Alex'));
    assert(same.changed === false, 'same contactName → not stale');
    assert(UX.getState('message-book').status === 'approved', 'remains approved when contactName unchanged');

    // Only a derived/nav change with the same name → still not stale
    const navBook = JSON.parse(JSON.stringify(book));
    navBook.activeVolumeId = 'vol-2';
    const nav = UX.refreshStaleness('message-book', PAS.computeProofFingerprint(navBook, 'Alex'));
    assert(nav.changed === false, 'nav-only change with same contactName → not stale');

    // contactName changed → stale
    const diff = UX.refreshStaleness('message-book', PAS.computeProofFingerprint(book, 'Alexander'));
    assert(diff.changed === true, 'changed contactName → stale');
    assert(diff.state.status === 'stale', 'status flips to stale on contactName change');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
