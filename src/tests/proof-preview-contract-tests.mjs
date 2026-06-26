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

function suite(name, fn) {
    console.log('\n' + name);
    fn();
}

const READY_INPUT = {
    approvalStatus:     'none',
    hasContent:         true,
    exceedsPageLimit:   false,
    anyBookCheckFailed: false,
    allBookCheckPassed: true
};

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM  = makeCtx();
    const PPC = KM.ProofPreviewContract;

    assert(typeof PPC === 'object' && PPC !== null, 'KMEngine.ProofPreviewContract is an object');
    assert(typeof PPC.CONTRACT_VERSION === 'string' && PPC.CONTRACT_VERSION === 'kmppc1',
        'CONTRACT_VERSION is "kmppc1"');
    assert(typeof PPC.PHASE === 'object' && PPC.PHASE !== null, 'PHASE is an object');
    assert(typeof PPC.firstBlockingReason      === 'function', 'firstBlockingReason is a function');
    assert(typeof PPC.resolveProofPreviewPhase === 'function', 'resolveProofPreviewPhase is a function');
    assert(typeof PPC.isReviewablePhase        === 'function', 'isReviewablePhase is a function');
    assert(typeof PPC.describeScope            === 'function', 'describeScope is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — PHASE constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — PHASE constants', function () {
    const PPC = makeCtx().ProofPreviewContract;
    const P = PPC.PHASE;

    assert(P.NOT_READY_EMPTY      === 'not-ready-empty',      'NOT_READY_EMPTY');
    assert(P.NOT_READY_OVER_LIMIT === 'not-ready-over-limit', 'NOT_READY_OVER_LIMIT');
    assert(P.NOT_READY_FAILED     === 'not-ready-failed',     'NOT_READY_FAILED');
    assert(P.NOT_READY_CHECKING   === 'not-ready-checking',   'NOT_READY_CHECKING');
    assert(P.READY                === 'ready',                'READY');
    assert(P.PENDING_REVIEW       === 'pending-review',       'PENDING_REVIEW');
    assert(P.APPROVED             === 'approved',             'APPROVED');
    assert(P.STALE                === 'stale',                'STALE');
    assert(P.CHANGES_REQUESTED    === 'changes-requested',    'CHANGES_REQUESTED');
    assert(P.REVOKED              === 'revoked',              'REVOKED');

    // PHASE is frozen.
    try {
        'use strict';
        P.NOT_READY_EMPTY = 'mutated';
    } catch (e) { /* strict-mode throw is acceptable */ }
    assert(P.NOT_READY_EMPTY === 'not-ready-empty', 'PHASE is immutable (frozen)');

    // Every not-ready phase begins with 'not-ready' (the panel relies on this prefix).
    [P.NOT_READY_EMPTY, P.NOT_READY_OVER_LIMIT, P.NOT_READY_FAILED, P.NOT_READY_CHECKING]
        .forEach(function (p) {
            assert(p.indexOf('not-ready') === 0, p + ' begins with "not-ready"');
        });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — firstBlockingReason priority + null when reviewable
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — firstBlockingReason', function () {
    const PPC = makeCtx().ProofPreviewContract;

    assert(PPC.firstBlockingReason(READY_INPUT) === null,
        'fully ready input has no blocking reason');

    assert(PPC.firstBlockingReason({ hasContent: false }) === 'empty',
        'no content → empty');

    // Empty outranks every other problem.
    assert(PPC.firstBlockingReason({
        hasContent: false, exceedsPageLimit: true, anyBookCheckFailed: true, allBookCheckPassed: false
    }) === 'empty', 'empty has the highest priority');

    // Over-limit outranks book-check problems.
    assert(PPC.firstBlockingReason({
        hasContent: true, exceedsPageLimit: true, anyBookCheckFailed: true, allBookCheckPassed: false
    }) === 'over-limit', 'over-limit outranks check-failed');

    assert(PPC.firstBlockingReason({
        hasContent: true, exceedsPageLimit: true, anyBookCheckFailed: false, allBookCheckPassed: true
    }) === 'over-limit', 'over-limit reported even when checks pass');

    // check-failed outranks still-checking.
    assert(PPC.firstBlockingReason({
        hasContent: true, exceedsPageLimit: false, anyBookCheckFailed: true, allBookCheckPassed: false
    }) === 'check-failed', 'check-failed outranks checking');

    assert(PPC.firstBlockingReason({
        hasContent: true, exceedsPageLimit: false, anyBookCheckFailed: false, allBookCheckPassed: false
    }) === 'checking', 'not-all-passed and none failed → checking');

    // Defensive: undefined / null input is treated as not-ready (empty), never throws.
    assert(PPC.firstBlockingReason(undefined) === 'empty', 'undefined input → empty (no throw)');
    assert(PPC.firstBlockingReason(null) === 'empty', 'null input → empty (no throw)');
    assert(PPC.firstBlockingReason({}) === 'empty', 'empty object → empty');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — resolveProofPreviewPhase: 'none' branch (readiness gate)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — resolveProofPreviewPhase none-branch readiness', function () {
    const PPC = makeCtx().ProofPreviewContract;
    const R = PPC.resolveProofPreviewPhase.bind(PPC);

    assert(R(READY_INPUT) === 'ready', 'all-clear none → ready');

    assert(R({ approvalStatus: 'none', hasContent: false }) === 'not-ready-empty',
        'none + no content → not-ready-empty');

    assert(R({ approvalStatus: 'none', hasContent: true, exceedsPageLimit: true,
        allBookCheckPassed: true }) === 'not-ready-over-limit',
        'none + over page limit → not-ready-over-limit (THE FIDELITY GATE)');

    assert(R({ approvalStatus: 'none', hasContent: true, exceedsPageLimit: false,
        anyBookCheckFailed: true }) === 'not-ready-failed',
        'none + failed book check → not-ready-failed');

    assert(R({ approvalStatus: 'none', hasContent: true, exceedsPageLimit: false,
        anyBookCheckFailed: false, allBookCheckPassed: false }) === 'not-ready-checking',
        'none + checks not yet all passed → not-ready-checking');

    // An over-limit book that also fails its check still reports over-limit first.
    assert(R({ approvalStatus: 'none', hasContent: true, exceedsPageLimit: true,
        anyBookCheckFailed: true, allBookCheckPassed: false }) === 'not-ready-over-limit',
        'over-limit gate outranks check-failed in the none branch');

    // Missing approvalStatus defaults to the 'none' readiness branch.
    assert(R({ hasContent: true, exceedsPageLimit: false, allBookCheckPassed: true }) === 'ready',
        'missing approvalStatus defaults to none → ready');
    assert(R({ hasContent: true, exceedsPageLimit: true, allBookCheckPassed: true }) === 'not-ready-over-limit',
        'missing approvalStatus defaults to none → over-limit gate still applies');
    assert(R(undefined) === 'not-ready-empty', 'undefined input → not-ready-empty (no throw)');
    assert(R({}) === 'not-ready-empty', 'empty object → not-ready-empty');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — resolveProofPreviewPhase: non-'none' statuses pass through unchanged
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — non-none statuses: reviewable pass-through (5D/5E preserved)', function () {
    const PPC = makeCtx().ProofPreviewContract;
    const R = PPC.resolveProofPreviewPhase.bind(PPC);

    // Under the page limit, every non-none status maps through 1:1 so the established 5D
    // staleness path and the 5E pending/approved/stale flow are untouched.
    ['pending-review', 'approved', 'stale', 'changes-requested', 'revoked'].forEach(function (s) {
        assert(R({ approvalStatus: s, hasContent: true, exceedsPageLimit: false,
            allBookCheckPassed: true }) === s, s + ' under the page limit maps through 1:1');
    });

    // Statuses with no actionable approve / re-review path are never re-gated by readiness
    // inputs (including over-limit): approved is handled by 5D staleness on a proof-changing
    // edit, and changes-requested / revoked are engine-only states with nothing to block.
    ['approved', 'changes-requested', 'revoked'].forEach(function (s) {
        assert(R({ approvalStatus: s, hasContent: false, exceedsPageLimit: true,
            anyBookCheckFailed: true, allBookCheckPassed: false }) === s,
            s + ' is not re-gated by readiness inputs (incl. over-limit)');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — isReviewablePhase
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — isReviewablePhase', function () {
    const PPC = makeCtx().ProofPreviewContract;

    ['ready', 'pending-review', 'approved', 'stale', 'changes-requested', 'revoked'].forEach(function (p) {
        assert(PPC.isReviewablePhase(p) === true, p + ' is reviewable');
    });
    ['not-ready-empty', 'not-ready-over-limit', 'not-ready-failed', 'not-ready-checking'].forEach(function (p) {
        assert(PPC.isReviewablePhase(p) === false, p + ' is not reviewable');
    });
    assert(PPC.isReviewablePhase(undefined) === false, 'undefined is not reviewable');
    assert(PPC.isReviewablePhase(null) === false, 'null is not reviewable');
    assert(PPC.isReviewablePhase(123) === false, 'non-string is not reviewable');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — describeScope: distinguishes review from checkout/print/make/send
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — describeScope', function () {
    const PPC = makeCtx().ProofPreviewContract;
    const d = PPC.describeScope();

    assert(d && typeof d === 'object', 'describeScope returns an object');
    assert(d.version === 'kmppc1', 'scope carries the contract version');
    assert(typeof d.reviewing === 'string' && d.reviewing.indexOf('on-screen') !== -1,
        'reviewing names the on-screen preview');
    assert(d.reviewing.indexOf('on this device') !== -1, 'reviewing says on this device');
    assert(typeof d.approvalMeans === 'string' && d.approvalMeans.indexOf('on-device sign-off') !== -1,
        'approvalMeans frames it as an on-device sign-off');
    assert(d.recordedOnDevice === true, 'recordedOnDevice is true');
    assert(typeof d.doesNot === 'string' && d.doesNot.toLowerCase().indexOf('does not buy, print, or send') !== -1,
        'doesNot disclaims buying, printing, or sending');
    assert(Array.isArray(d.notYetReady) && d.notYetReady.length === 4,
        'notYetReady enumerates what the proof is not yet for');

    // The descriptor must not expose any commerce/production readiness fields.
    assert(d.checkoutReady === undefined,      'scope has no checkoutReady field');
    assert(d.orderReady === undefined,         'scope has no orderReady field');
    assert(d.manufacturingReady === undefined, 'scope has no manufacturingReady field');
    assert(d.exportReady === undefined,        'scope has no exportReady field');

    // Defensive copy: two calls return independent objects/arrays.
    const d2 = PPC.describeScope();
    assert(d2 !== d, 'describeScope returns a fresh object each call');
    assert(d2.notYetReady !== d.notYetReady, 'describeScope returns a fresh notYetReady array each call');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — purity: determinism + no input mutation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — purity (deterministic, no mutation)', function () {
    const PPC = makeCtx().ProofPreviewContract;

    const input = { approvalStatus: 'none', hasContent: true, exceedsPageLimit: true,
        anyBookCheckFailed: false, allBookCheckPassed: true };
    const snapshot = JSON.stringify(input);

    const a = PPC.resolveProofPreviewPhase(input);
    const b = PPC.resolveProofPreviewPhase(input);
    assert(a === b && a === 'not-ready-over-limit', 'same input yields the same phase');
    assert(JSON.stringify(input) === snapshot, 'resolveProofPreviewPhase does not mutate its input');

    const r1 = PPC.firstBlockingReason(input);
    const r2 = PPC.firstBlockingReason(input);
    assert(r1 === r2 && r1 === 'over-limit', 'firstBlockingReason is deterministic');
    assert(JSON.stringify(input) === snapshot, 'firstBlockingReason does not mutate its input');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — source carries no commerce/production behaviour or CTA wording
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — no commerce/production vocabulary in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/proof-preview-contract.js'),
        'utf8'
    ).toLowerCase();

    // Bare commerce/production nouns (parity with the proof-approval-ux source-scan).
    ['checkout', 'payment', 'order', 'commerce', 'manufacturing', 'vendor',
     'fulfillment', 'export', 'purchase'].forEach(function (term) {
        assert(src.indexOf(term) === -1,
            'proof-preview-contract.js source does not reference "' + term + '"');
    });

    // Affirmative commerce/production calls-to-action that would imply readiness.
    ['buy now', 'order now', 'add to cart', 'pay now', 'print now', 'production ready',
     'production-ready', 'print ready', 'print-ready', 'order ready', 'send to print',
     'send to vendor', 'submit to vendor'].forEach(function (cta) {
        assert(src.indexOf(cta) === -1,
            'proof-preview-contract.js source contains no CTA "' + cta + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — over-limit blocks the actionable review phases (6A fidelity fix)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — over-limit blocks approve / re-review (pending-review, stale)', function () {
    const PPC = makeCtx().ProofPreviewContract;
    const R = PPC.resolveProofPreviewPhase.bind(PPC);

    const over  = { hasContent: true, exceedsPageLimit: true,  allBookCheckPassed: true };
    const under = { hasContent: true, exceedsPageLimit: false, allBookCheckPassed: true };

    // A proof over the page limit is not reviewable, so the page-limit blocker has
    // priority over the approve action (pending-review) and the re-review action (stale).
    assert(R(Object.assign({ approvalStatus: 'none' }, over)) === 'not-ready-over-limit',
        'ready (none) + over-limit → not-ready-over-limit');
    assert(R(Object.assign({ approvalStatus: 'pending-review' }, over)) === 'not-ready-over-limit',
        'pending-review + over-limit → not-ready-over-limit (no approve action)');
    assert(R(Object.assign({ approvalStatus: 'stale' }, over)) === 'not-ready-over-limit',
        'stale + over-limit → not-ready-over-limit (no re-review action)');

    // Under the limit, the actionable phases still expose their action (Approve / re-review).
    assert(R(Object.assign({ approvalStatus: 'pending-review' }, under)) === 'pending-review',
        'pending-review under the limit keeps the approve action');
    assert(R(Object.assign({ approvalStatus: 'stale' }, under)) === 'stale',
        'stale under the limit keeps the re-review action');

    // The blocker is reversible: clearing the over-limit condition restores the status.
    assert(R(Object.assign({ approvalStatus: 'pending-review' }, over)) === 'not-ready-over-limit'
        && R(Object.assign({ approvalStatus: 'pending-review' }, under)) === 'pending-review',
        'page-limit blocker is reversible for pending-review');
    assert(R(Object.assign({ approvalStatus: 'stale' }, over)) === 'not-ready-over-limit'
        && R(Object.assign({ approvalStatus: 'stale' }, under)) === 'stale',
        'page-limit blocker is reversible for stale');

    // approved is not re-gated here — a proof-changing over-limit edit moves it to stale
    // (5D), which IS gated; an unchanged approved proof stays approved.
    assert(R(Object.assign({ approvalStatus: 'approved' }, over)) === 'approved',
        'approved is not re-gated by over-limit (5D staleness handles changed proofs)');

    // The blocked phase is non-reviewable, so the panel renders no actions for it.
    assert(PPC.isReviewablePhase(R(Object.assign({ approvalStatus: 'pending-review' }, over))) === false,
        'pending-review + over-limit resolves to a non-reviewable phase');
    assert(PPC.isReviewablePhase(R(Object.assign({ approvalStatus: 'stale' }, over))) === false,
        'stale + over-limit resolves to a non-reviewable phase');

    // The blocker keys on the page limit specifically: a failing/incomplete book check
    // does NOT rewrite an actionable post-submission status — only over-limit does.
    assert(R({ approvalStatus: 'pending-review', hasContent: true, exceedsPageLimit: false,
        anyBookCheckFailed: true, allBookCheckPassed: false }) === 'pending-review',
        'pending-review with a failing check (under the limit) is not re-gated');
    assert(R({ approvalStatus: 'stale', hasContent: true, exceedsPageLimit: false,
        anyBookCheckFailed: true, allBookCheckPassed: false }) === 'stale',
        'stale with a failing check (under the limit) is not re-gated');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
