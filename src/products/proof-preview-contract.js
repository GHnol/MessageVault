(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book proof preview contract ──────────────────────────────────
    // Single tested source of truth for what the Message Book "proof preview" is,
    // when it is reviewable, and what reviewing or approving a proof does and does
    // not mean. It draws a clear line between four things:
    //   1. the editable, generated on-screen Message Book preview;
    //   2. the proof surface the user reviews (that same on-screen preview, whose
    //      identity is pinned by the 5D proof fingerprint);
    //   3. the proof state that can be approved (a reviewable proof);
    //   4. what is explicitly NOT covered — reviewing or approving a proof never
    //      buys, prints, or sends anything, and never implies that the book has
    //      been bought, printed, produced, or delivered.
    //
    // Pure: no DOM, no Date, no Math.random, no I/O. The phase decision is the one
    // place the proof panel asks "what should I show?". The app supplies already-
    // computed booleans (content present, over the page limit, book-check results)
    // so this module stays free of app/DOM coupling and is unit-testable. It owns
    // the phase mapping only; the 5E copy table (ProofApprovalUX.getProofPanelCopy)
    // and the 5D state machine (ProofApprovalState) remain the sources of truth for
    // wording and for transitions respectively.
    //
    // The source of this module is kept free of downstream wording about buying,
    // printing, or producing the book (guarded by its own source-scan test) so the
    // contract can never imply that the book has been bought, printed, produced, or
    // delivered.

    var CONTRACT_VERSION = 'kmppc1';

    var PHASE = Object.freeze({
        NOT_READY_EMPTY:      'not-ready-empty',
        NOT_READY_OVER_LIMIT: 'not-ready-over-limit',
        NOT_READY_FAILED:     'not-ready-failed',
        NOT_READY_CHECKING:   'not-ready-checking',
        READY:                'ready',
        PENDING_REVIEW:       'pending-review',
        APPROVED:             'approved',
        STALE:                'stale',
        CHANGES_REQUESTED:    'changes-requested',
        REVOKED:              'revoked'
    });

    // Why a not-yet-submitted proof cannot be reviewed, in priority sequence. Returns
    // a stable reason code or null when the preview is reviewable. Sequence matters:
    // empty content is reported before the page-limit problem, which is reported
    // before book-check problems, so the user is told the most fundamental gap first.
    function firstBlockingReason(input) {
        var i = input || {};
        if (!i.hasContent)         return 'empty';
        if (i.exceedsPageLimit)    return 'over-limit';
        if (i.anyBookCheckFailed)  return 'check-failed';
        if (!i.allBookCheckPassed) return 'checking';
        return null;
    }

    var _reasonToPhase = {
        'empty':        PHASE.NOT_READY_EMPTY,
        'over-limit':   PHASE.NOT_READY_OVER_LIMIT,
        'check-failed': PHASE.NOT_READY_FAILED,
        'checking':     PHASE.NOT_READY_CHECKING
    };

    // The single source of truth for the proof panel's phase. It adds the page-limit
    // gate to the prior inline mapping: a book over its page limit is not ready for
    // proof review, so it cannot be marked ready, approved, or re-reviewed.
    //
    // Priority of the page-limit blocker over the approval status matters. The
    // pre-submission 'none' status runs the full readiness gate (empty → over-limit →
    // check-failed → checking). The actionable post-submission phases — 'pending-review'
    // (offers Approve) and 'stale' (offers re-review) — are also gated by the page limit:
    // an over-limit proof in either state resolves to 'not-ready-over-limit' (no actions),
    // so the user cannot approve or re-review a book that does not fit. The gate is
    // reversible — bringing the book back under the limit restores the prior status — and
    // proof-affecting, so the 5D approved→stale path and the rest of the 5E
    // pending/approved/stale flow are otherwise untouched. Every other status (approved,
    // changes-requested, revoked) maps through 1:1: a proof-changing over-limit edit moves
    // an approved proof to 'stale' via 5D, which is then gated, and the engine-only
    // changes-requested / revoked states expose no approve/re-review action to block.
    function resolveProofPreviewPhase(input) {
        var i = input || {};
        var status = (typeof i.approvalStatus === 'string' && i.approvalStatus) || 'none';
        if (status === 'none') {
            var reason = firstBlockingReason(i);
            return reason ? _reasonToPhase[reason] : PHASE.READY;
        }
        if (i.exceedsPageLimit && (status === 'pending-review' || status === 'stale')) {
            return PHASE.NOT_READY_OVER_LIMIT;
        }
        return status;
    }

    // A phase is "reviewable" when the proof is in, or can enter, the review flow.
    // The not-ready-* phases are the only non-reviewable ones.
    function isReviewablePhase(phase) {
        return typeof phase === 'string' && phase.indexOf('not-ready') !== 0;
    }

    // Plain-language description of what the proof preview is and what it is not.
    // Deliberately uses the same on-device framing as the 5E panel copy: reviewing
    // or approving a proof never buys, prints, or sends anything. The strings here
    // are free of downstream wording about buying, printing, or producing the book
    // (guarded by this module's own source-scan test) so this contract can never
    // imply that the book has been bought, printed, produced, or delivered.
    function describeScope() {
        return {
            version:          CONTRACT_VERSION,
            reviewing:        'the current on-screen Message Book proof preview, generated from your messages on this device',
            approvalMeans:    'an on-device sign-off that this proof looks right to keep',
            recordedOnDevice: true,
            doesNot:          'It does not buy, print, or send anything.',
            notYetReady:      ['buying it', 'printing it', 'making the physical book', 'sending it to anyone']
        };
    }

    KMEngine.ProofPreviewContract = {
        CONTRACT_VERSION:         CONTRACT_VERSION,
        PHASE:                    PHASE,
        firstBlockingReason:      firstBlockingReason,
        resolveProofPreviewPhase: resolveProofPreviewPhase,
        isReviewablePhase:        isReviewablePhase,
        describeScope:            describeScope
    };
}());
