(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book checkout-readiness / product-eligibility gate ────────────
    // A single, tested source of truth for whether the CURRENT Message Book proof
    // is safe enough to proceed toward checkout LATER. It is a readiness DECISION,
    // not a commerce ACTION: it never buys, charges, creates an order or cart,
    // prints, manufactures, submits to a vendor, exports, packages, or ships
    // anything. It only reads already-computed facts about the live book and
    // reports a structured readiness matrix with safe blocking reason codes that
    // a later UI package can render.
    //
    // It is product-scoped to Message Book specifically. The existing
    // ProductExperienceReadiness resolver answers a different question — whether
    // the SYSTEM, in principle, supports a product TYPE (from the static
    // render-spec gates). Those static gates do not reflect the live, shipped
    // proof-approval state of a particular book (e.g. message-book's static
    // proofSupported gate is conservative even though proof review shipped in
    // 5D/5E/6A). This gate consumes the real instance outputs instead:
    //
    //   hasContent              — the book has readable content to print
    //                             (caller: book has >=1 included, readable message)
    //   exceedsPageLimit        — the proof is over its page limit
    //                             (caller: BookComposition.computePageLimitStatus /
    //                              the 6A vol.exceedsPageLimit input)
    //   approvalStatus          — ProofApprovalState.STATUS of the proof record
    //                             ('none' when no approval record exists yet)
    //   approvalStale           — ProofApprovalState.isApprovalStale(record, fp):
    //                             an APPROVED record bound to an old fingerprint
    //   preflightBlockingFailures
    //                           — ProductPreflight report.blockingFailureCount:
    //                             a blocking book check that actively FAILED. An
    //                             incomplete preflight (inputs not yet available,
    //                             notApplicableCount) is NOT a failure and does not
    //                             block checkout — it is the normal pre-manufacturing
    //                             state. Manufacturing readiness is a separate,
    //                             higher gate that remains false here.
    //   engineSupported         — optional; defaults true because the Message Book
    //                             renderer is shipped. Pass false only to model an
    //                             unsupported product.
    //
    // Pure: no DOM, no Date, no Math.random, no I/O, no network, no storage. The
    // source carries no commerce/production ACTION verbs or calls-to-action
    // (guarded by its own source-scan test) so the gate can never imply that the
    // book has been bought, charged, ordered, printed, produced, or shipped.

    var CONTRACT_VERSION = 'kmbr1';

    var PRODUCT_TYPE_ID = 'message-book';

    // The readiness ladder. Each rung requires every rung below it. checkout-eligible
    // is the highest rung this gate certifies; manufacturing/vendor/production/export/
    // packaging readiness are separate downstream gates that have not started and
    // remain explicitly false (see GATED_REASON).
    var LEVEL = Object.freeze({
        UNSUPPORTED:            'unsupported',
        ENGINE_SUPPORTED:       'engine-supported',
        PREVIEWABLE:            'previewable',
        PROOF_REVIEWABLE:       'proof-reviewable',
        PROOF_APPROVED_CURRENT: 'proof-approved-current',
        CHECKOUT_ELIGIBLE:      'checkout-eligible'
    });

    // Stable, safe reason codes for why checkout eligibility is withheld. They are
    // non-private enums (no message text, names, or counts beyond a preflight count)
    // suitable for powering UI later. Collected in priority order, most fundamental
    // first; blockers[0] is the primary blocker.
    var BLOCKER = Object.freeze({
        ENGINE_UNSUPPORTED:      'engine-unsupported',
        NO_CONTENT:              'no-content',
        OVER_PAGE_LIMIT:         'over-page-limit',
        PROOF_NOT_SUBMITTED:     'proof-not-submitted',
        PROOF_PENDING_REVIEW:    'proof-pending-review',
        PROOF_CHANGES_REQUESTED: 'proof-changes-requested',
        PROOF_REVOKED:           'proof-revoked',
        PROOF_APPROVAL_STALE:    'proof-approval-stale',
        PREFLIGHT_BLOCKING_FAILURE: 'preflight-blocking-failure'
    });

    // Higher readiness gates beyond checkout. They are separate concerns that have
    // not been implemented; this gate reports them as explicitly false so nothing
    // implies buying, printing, vendor submission, or production has started.
    var GATED_REASON = 'not-implemented';

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.ENGINE_UNSUPPORTED]         = 'This product is not supported yet.';
    _blockerMessages[BLOCKER.NO_CONTENT]                 = 'Add messages before this Message Book can proceed.';
    _blockerMessages[BLOCKER.OVER_PAGE_LIMIT]            = 'This Message Book is over its page limit.';
    _blockerMessages[BLOCKER.PROOF_NOT_SUBMITTED]        = 'This Message Book has not been submitted for proof review.';
    _blockerMessages[BLOCKER.PROOF_PENDING_REVIEW]       = 'This proof is still waiting to be reviewed.';
    _blockerMessages[BLOCKER.PROOF_CHANGES_REQUESTED]    = 'Changes were requested on this proof.';
    _blockerMessages[BLOCKER.PROOF_REVOKED]              = 'This proof approval was withdrawn.';
    _blockerMessages[BLOCKER.PROOF_APPROVAL_STALE]       = 'This proof changed after it was approved and needs another review.';
    _blockerMessages[BLOCKER.PREFLIGHT_BLOCKING_FAILURE] = 'A required book check still needs to pass.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // The proof-status blocker is a single code derived from the approval record.
    // Returns null only for an approved-and-current proof.
    function _proofStatusBlocker(approvalStatus, approvalStale) {
        if (approvalStatus === 'approved') {
            return approvalStale ? BLOCKER.PROOF_APPROVAL_STALE : null;
        }
        if (approvalStatus === 'stale')             return BLOCKER.PROOF_APPROVAL_STALE;
        if (approvalStatus === 'pending-review')    return BLOCKER.PROOF_PENDING_REVIEW;
        if (approvalStatus === 'changes-requested') return BLOCKER.PROOF_CHANGES_REQUESTED;
        if (approvalStatus === 'revoked')           return BLOCKER.PROOF_REVOKED;
        // 'none' or any unknown status → there is no usable approval yet.
        return BLOCKER.PROOF_NOT_SUBMITTED;
    }

    function evaluate(input) {
        var i = input || {};

        var engineSupported = (i.engineSupported !== false);
        var hasContent      = !!i.hasContent;
        var exceedsPageLimit = !!i.exceedsPageLimit;
        var approvalStatus  = (typeof i.approvalStatus === 'string' && i.approvalStatus) || 'none';
        var approvalStale   = !!i.approvalStale;
        var preflightBlockingFailures =
            (typeof i.preflightBlockingFailures === 'number' && i.preflightBlockingFailures > 0)
                ? i.preflightBlockingFailures : 0;

        // Blocking reasons in priority order, most fundamental first.
        var blockers = [];
        if (!engineSupported)  blockers.push(BLOCKER.ENGINE_UNSUPPORTED);
        if (!hasContent)       blockers.push(BLOCKER.NO_CONTENT);
        if (exceedsPageLimit)  blockers.push(BLOCKER.OVER_PAGE_LIMIT);

        var proofBlocker = _proofStatusBlocker(approvalStatus, approvalStale);
        if (proofBlocker) blockers.push(proofBlocker);

        if (preflightBlockingFailures > 0) blockers.push(BLOCKER.PREFLIGHT_BLOCKING_FAILURE);

        // Readiness ladder. Each rung requires every rung below it.
        var previewable          = engineSupported && hasContent;
        var proofReviewable      = previewable && !exceedsPageLimit;
        var proofApprovedCurrent = proofReviewable
            && approvalStatus === 'approved'
            && !approvalStale;
        var checkoutEligible     = proofApprovedCurrent && preflightBlockingFailures === 0;

        var furthestLevel = LEVEL.UNSUPPORTED;
        if (engineSupported)      furthestLevel = LEVEL.ENGINE_SUPPORTED;
        if (previewable)          furthestLevel = LEVEL.PREVIEWABLE;
        if (proofReviewable)      furthestLevel = LEVEL.PROOF_REVIEWABLE;
        if (proofApprovedCurrent) furthestLevel = LEVEL.PROOF_APPROVED_CURRENT;
        if (checkoutEligible)     furthestLevel = LEVEL.CHECKOUT_ELIGIBLE;

        var blockerMessages = blockers.map(blockerMessage);

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            // Readiness ladder (booleans).
            engineSupported:      engineSupported,
            previewable:          previewable,
            proofReviewable:      proofReviewable,
            proofApprovedCurrent: proofApprovedCurrent,
            checkoutEligible:     checkoutEligible,

            // Higher gates beyond checkout — separate, not-started concerns, always
            // false here so nothing implies production/commerce has begun.
            manufacturingReady: false,
            vendorReady:        false,
            productionReady:    false,
            exportReady:        false,
            packagingReady:     false,
            gatedReason:        GATED_REASON,

            // Diagnostics.
            furthestLevel:   furthestLevel,
            blockers:        blockers,
            primaryBlocker:  blockers.length ? blockers[0] : null,
            blockerMessages: blockerMessages
        };
    }

    function isCheckoutEligible(input) {
        return evaluate(input).checkoutEligible;
    }

    // Plain-language statement of what this gate is and — emphatically — what it is
    // not. Uses the same on-device framing as the 5E/6A proof copy: certifying
    // checkout eligibility is a readiness signal only; it does not buy, charge,
    // order, print, make, package, or ship anything.
    function describeBoundary() {
        return {
            version:  CONTRACT_VERSION,
            decides:  'whether the current on-device Message Book proof is safe enough to proceed toward checkout later',
            isA:      'readiness signal computed from your messages on this device',
            recordedOnDevice: true,
            doesNot:  'It does not buy, charge, order, print, make, package, or ship anything.',
            separateGates: ['checkout', 'manufacturing', 'vendor', 'production', 'export', 'packaging']
        };
    }

    KMEngine.MessageBookReadiness = {
        CONTRACT_VERSION:   CONTRACT_VERSION,
        PRODUCT_TYPE_ID:    PRODUCT_TYPE_ID,
        LEVEL:              LEVEL,
        BLOCKER:            BLOCKER,
        GATED_REASON:       GATED_REASON,
        evaluate:           evaluate,
        isCheckoutEligible: isCheckoutEligible,
        blockerMessage:     blockerMessage,
        describeBoundary:   describeBoundary
    };
}());
