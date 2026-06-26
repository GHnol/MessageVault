(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book order-intent shell (commerce boundary) ───────────────────
    // A local-only, NON-TRANSACTIONAL record of the user's intent to proceed
    // toward a later checkout flow — and nothing more. It is a commerce BOUNDARY,
    // not commerce: it never opens a payment provider or checkout flow, builds a
    // cart, places or submits an order, collects an address, calculates tax, prints,
    // manufactures, hands off to a vendor, exports, packages, or ships anything. It
    // only remembers, on this device, that an eligible proof may be
    // continued later, and it forgets that the moment the proof stops being
    // eligible.
    //
    // It is GATED by the 7A/7B gate. The only authority for "is this book's proof
    // safe enough to proceed toward checkout later" is
    // KMEngine.MessageBookReadiness; this shell consumes that gate's RESULT
    // (checkoutEligible / primaryBlocker) and never recomputes proof, page-limit,
    // or preflight logic itself. It references no sibling module at runtime (it
    // reads the readiness result object passed to it), so it loads alone.
    //
    // The safety-critical decisions — deriveAvailability / resolve / canStartIntent
    // / describeIntent / describeBoundary — are pure: deterministic, no clock, no
    // I/O, no mutation. The record builders (create / startIntent / clearIntent /
    // reconcile) stamp the record with new Date().toISOString() exactly like the
    // sibling state machines (ProofApprovalState / ProductDraftState); that is the
    // only effect and it never mutates its input. The source carries no commerce
    // call-to-action and no network/DOM/storage/random side effect (guarded by the
    // suite's source-scan), so the shell can never imply that a book was bought,
    // charged, ordered, printed, produced, or shipped.

    var CONTRACT_VERSION = 'kmoi1';

    var PRODUCT_TYPE_ID = 'message-book';

    // Durable record status. None of these names imply real order placement:
    //   none               — no intent expressed
    //   intent-draft-local — a local, non-transactional note that the user may
    //                        continue later (only reachable while eligible)
    //   blocked            — a note that lost eligibility (paused, not lost)
    //   cleared            — the user cleared their local note
    var STATE = Object.freeze({
        NONE:         'none',
        INTENT_DRAFT: 'intent-draft-local',
        BLOCKED:      'blocked',
        CLEARED:      'cleared'
    });

    // Derived availability of the boundary, from the readiness gate only.
    var AVAILABILITY = Object.freeze({
        UNAVAILABLE: 'unavailable',
        ELIGIBLE:    'eligible'
    });

    // Safe reason codes for the resolved view. Non-private enums (no message text,
    // names, prices, or order numbers — there are none) suitable for a later UI.
    var REASON = Object.freeze({
        NOT_ELIGIBLE:    'readiness-not-eligible',
        NO_INTENT:       'no-intent',
        INTENT_RECORDED: 'intent-recorded',
        INTENT_BLOCKED:  'intent-blocked',
        INTENT_CLEARED:  'intent-cleared'
    });

    // Higher gates beyond checkout. They are separate, not-started concerns; this
    // shell reports them as explicitly false so nothing implies production/commerce.
    var GATED_REASON = 'not-implemented';

    var _validStatuses = {};
    _validStatuses[STATE.NONE]         = true;
    _validStatuses[STATE.INTENT_DRAFT] = true;
    _validStatuses[STATE.BLOCKED]      = true;
    _validStatuses[STATE.CLEARED]      = true;

    function isValidStatus(status) {
        return !!_validStatuses[status];
    }

    // The full transition graph. startIntent uses only the none/cleared edges;
    // reconcile owns the intent-draft↔blocked edges; clearIntent uses the cleared
    // edges. There is no edge into a "real order" — there is no such state.
    var _allowed = [
        ['none',               'intent-draft-local'],
        ['cleared',            'intent-draft-local'],
        ['intent-draft-local', 'blocked'],
        ['blocked',            'intent-draft-local'],
        ['intent-draft-local', 'cleared'],
        ['blocked',            'cleared']
    ];

    function canTransition(from, to) {
        for (var i = 0; i < _allowed.length; i++) {
            if (_allowed[i][0] === from && _allowed[i][1] === to) return true;
        }
        return false;
    }

    // Pure: read the readiness RESULT only. Eligibility is true strictly when the
    // gate certified checkoutEligible; the primary blocker (a safe code) is carried
    // through for theming when it is not.
    function deriveAvailability(readiness) {
        var r = readiness || {};
        var eligible = (r.checkoutEligible === true);
        return {
            availability: eligible ? AVAILABILITY.ELIGIBLE : AVAILABILITY.UNAVAILABLE,
            eligible:     eligible,
            blocker:      eligible ? null
                : (typeof r.primaryBlocker === 'string' ? r.primaryBlocker : null)
        };
    }

    function _coerce(record) {
        if (record && typeof record === 'object' && isValidStatus(record.status)) {
            return record;
        }
        return {
            productTypeId:    PRODUCT_TYPE_ID,
            status:           STATE.NONE,
            nonTransactional: true,
            createdAt:        null,
            updatedAt:        null,
            intentAt:         null,
            blockedAt:        null,
            blockedReason:    null,
            clearedAt:        null,
            notes:            null
        };
    }

    function _baseNext(rec, toStatus, now) {
        return {
            productTypeId:    rec.productTypeId || PRODUCT_TYPE_ID,
            status:           toStatus,
            nonTransactional: true,
            createdAt:        rec.createdAt != null ? rec.createdAt : now,
            updatedAt:        now,
            intentAt:         rec.intentAt != null ? rec.intentAt : null,
            blockedAt:        rec.blockedAt != null ? rec.blockedAt : null,
            blockedReason:    rec.blockedReason != null ? rec.blockedReason : null,
            clearedAt:        rec.clearedAt != null ? rec.clearedAt : null,
            notes:            rec.notes != null ? rec.notes : null
        };
    }

    function create(opts) {
        if (opts && typeof opts.productTypeId === 'string' && opts.productTypeId !== ''
                && opts.productTypeId !== PRODUCT_TYPE_ID) {
            return { success: false, error: 'productTypeId must be "message-book"', state: null };
        }
        var now = new Date().toISOString();
        var state = {
            productTypeId:    PRODUCT_TYPE_ID,
            status:           STATE.NONE,
            nonTransactional: true,
            createdAt:        now,
            updatedAt:        now,
            intentAt:         null,
            blockedAt:        null,
            blockedReason:    null,
            clearedAt:        null,
            notes:            (opts && opts.notes != null) ? opts.notes : null
        };
        return { success: true, error: null, state: state };
    }

    function canStartIntent(record, readiness) {
        var rec = _coerce(record);
        if (!deriveAvailability(readiness).eligible) return false;
        return rec.status === STATE.NONE || rec.status === STATE.CLEARED;
    }

    // Express a local, non-transactional intent to continue later. Allowed only
    // from none/cleared AND only when the readiness gate says checkoutEligible.
    // Restoring a blocked note is reconcile's job, not startIntent's.
    function startIntent(record, readiness, opts) {
        var rec   = _coerce(record);
        var from  = rec.status;
        var avail = deriveAvailability(readiness);

        if (!avail.eligible) {
            return { success: false, error: 'not-eligible:' + (avail.blocker || 'unknown'), state: null };
        }
        if (from !== STATE.NONE && from !== STATE.CLEARED) {
            return { success: false, error: 'transition-not-allowed: ' + from + '→' + STATE.INTENT_DRAFT, state: null };
        }

        var now  = new Date().toISOString();
        var next = _baseNext(rec, STATE.INTENT_DRAFT, now);
        next.intentAt      = now;
        next.blockedAt     = null;
        next.blockedReason = null;
        next.clearedAt     = null;
        if (opts && opts.notes !== undefined) next.notes = opts.notes;
        return { success: true, error: null, state: next };
    }

    // Clear the local note. Allowed from intent-draft-local or blocked.
    function clearIntent(record, opts) {
        var rec  = _coerce(record);
        var from = rec.status;
        if (!canTransition(from, STATE.CLEARED)) {
            return { success: false, error: 'transition-not-allowed: ' + from + '→' + STATE.CLEARED, state: null };
        }
        var now  = new Date().toISOString();
        var next = _baseNext(rec, STATE.CLEARED, now);
        next.clearedAt = now;
        if (opts && opts.notes !== undefined) next.notes = opts.notes;
        return { success: true, error: null, state: next };
    }

    // Re-bind a durable record to current readiness. A recorded note that lost
    // eligibility transitions to blocked (carrying the safe primary blocker); a
    // blocked note whose proof is eligible again is restored to intent-draft-local.
    // Every other combination is a no-op (changed:false). Never throws.
    function reconcile(record, readiness) {
        var rec   = _coerce(record);
        var from  = rec.status;
        var avail = deriveAvailability(readiness);
        var now   = new Date().toISOString();

        if (from === STATE.INTENT_DRAFT && !avail.eligible) {
            var blocked = _baseNext(rec, STATE.BLOCKED, now);
            blocked.blockedAt     = now;
            blocked.blockedReason = avail.blocker;
            return { success: true, error: null, state: blocked, changed: true };
        }
        if (from === STATE.BLOCKED && avail.eligible) {
            var restored = _baseNext(rec, STATE.INTENT_DRAFT, now);
            restored.intentAt      = rec.intentAt != null ? rec.intentAt : now;
            restored.blockedAt     = null;
            restored.blockedReason = null;
            return { success: true, error: null, state: restored, changed: true };
        }
        return { success: true, error: null, state: rec, changed: false };
    }

    // Pure structured view of the boundary for a given record + readiness result.
    // The core safety invariant lives here: an intent is reported ACTIVE only when
    // the record holds a local note AND readiness is currently eligible. A recorded
    // note under an ineligible proof is reported as effectively BLOCKED with
    // active:false even if reconcile has not yet been called — so the boundary can
    // never present an active intent for an ineligible book (requirement #7).
    function resolve(record, readiness) {
        var avail    = deriveAvailability(readiness);
        var rec      = _coerce(record);
        var status   = rec.status;
        var eligible = avail.eligible;

        var effectiveState, reason, active = false, blocker = null;

        if (status === STATE.INTENT_DRAFT) {
            if (eligible) {
                effectiveState = STATE.INTENT_DRAFT;
                reason         = REASON.INTENT_RECORDED;
                active         = true;
            } else {
                effectiveState = STATE.BLOCKED;
                reason         = REASON.INTENT_BLOCKED;
                blocker        = avail.blocker;
            }
        } else if (status === STATE.BLOCKED) {
            effectiveState = STATE.BLOCKED;
            reason         = REASON.INTENT_BLOCKED;
            blocker        = (rec.blockedReason != null) ? rec.blockedReason : avail.blocker;
        } else if (status === STATE.CLEARED) {
            effectiveState = STATE.CLEARED;
            reason         = REASON.INTENT_CLEARED;
        } else {
            effectiveState = STATE.NONE;
            reason         = eligible ? REASON.NO_INTENT : REASON.NOT_ELIGIBLE;
            if (!eligible) blocker = avail.blocker;
        }

        var view = {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            availability: avail.availability,
            eligible:     eligible,
            recordStatus: status,
            state:        effectiveState,

            // active is the one signal a caller should trust to mean "the user has a
            // live local note on an eligible proof". It is never true when ineligible.
            active:    active,
            canStart:  eligible && (status === STATE.NONE || status === STATE.CLEARED),
            canClear:  status === STATE.INTENT_DRAFT || status === STATE.BLOCKED,
            restorable: status === STATE.BLOCKED && eligible,

            reason:           reason,
            blocker:          blocker,
            nonTransactional: true,

            // Higher gates beyond checkout — separate, not-started concerns, always
            // false here so nothing implies production/commerce has begun.
            manufacturingReady: false,
            vendorReady:        false,
            productionReady:    false,
            exportReady:        false,
            packagingReady:     false,
            gatedReason:        GATED_REASON
        };
        view.display = describeIntent(view);
        return view;
    }

    // Pure display copy for a resolved view: { tone, headline, detail }. The copy
    // deliberately avoids buy / pay / order / print / send / vendor / production-ready
    // / cart / ship language entirely (guarded by the suite) and frames the eligible
    // and recorded states as continuing toward checkout LATER — never as an action.
    function describeIntent(view) {
        var v = view || {};
        switch (v.reason) {
            case REASON.INTENT_RECORDED:
                return {
                    tone:     'recorded',
                    headline: 'Saved your intent to continue later',
                    detail:   'This is a local note on this device. Checkout is not open yet, and nothing has been charged or confirmed.'
                };
            case REASON.NO_INTENT:
                return {
                    tone:     'eligible',
                    headline: 'Eligible to continue later',
                    detail:   'This proof is eligible. You can note your intent to continue later — it stays on this device only and nothing is charged.'
                };
            case REASON.INTENT_BLOCKED:
                return {
                    tone:     'blocked',
                    headline: 'Your intent note is on hold',
                    detail:   'This Message Book is no longer eligible to continue, so the local note is paused until it becomes eligible again.'
                };
            case REASON.INTENT_CLEARED:
                return {
                    tone:     'cleared',
                    headline: 'Intent note cleared',
                    detail:   'You cleared the local note. You can save a new one when the proof is eligible to continue.'
                };
            case REASON.NOT_ELIGIBLE:
            default:
                return {
                    tone:     'unavailable',
                    headline: 'Not available to continue yet',
                    detail:   'This Message Book is not eligible to continue yet.'
                };
        }
    }

    // Pure safe button labels for a resolved view. Returns only the actions the
    // boundary actually permits for this view: a start action when canStart, a clear
    // action when canClear. Mirrors the proof-panel view-model's actions array. The
    // labels deliberately avoid buy / pay / order / checkout / cart / print / vendor /
    // ship language (guarded by the suite source-scan) and frame the start action as
    // continuing LATER, never as a transaction. The caller maps action → DOM id.
    function describeActions(view) {
        var v = view || {};
        var actions = [];
        if (v.canStart) {
            actions.push({ action: 'start-intent', label: 'Save local intent to continue later' });
        }
        if (v.canClear) {
            actions.push({ action: 'clear-intent', label: 'Clear local intent' });
        }
        return actions;
    }

    // Safe restore of a persisted record. A live caller that reloads a saved project
    // session passes the stored record (or null) through here to get a valid, defensive
    // record back: a well-formed record is returned unchanged; anything malformed or
    // missing coerces to a fresh 'none' record. The current readiness gate still
    // governs the record on the next resolve/reconcile — restore never re-activates an
    // intent on its own; it only guarantees a structurally safe record to gate.
    function restore(record) {
        return _coerce(record);
    }

    // Plain-language statement of what this boundary is and — emphatically — what it
    // is not. Mirrors the on-device framing of the 7A/7B readiness copy.
    function describeBoundary() {
        return {
            version:          CONTRACT_VERSION,
            represents:       'a local, on-device note that an eligible Message Book proof may be continued toward checkout later',
            gatedBy:          'MessageBookReadiness.checkoutEligible',
            recordedOnDevice: true,
            nonTransactional: true,
            doesNot:          'It does not buy, charge, order, print, make, package, or ship anything.',
            createsNo:        ['cart', 'payment', 'checkout-session', 'real-order', 'shipment'],
            separateGates:    ['checkout', 'manufacturing', 'vendor', 'production', 'export', 'packaging']
        };
    }

    KMEngine.MessageBookOrderIntent = {
        CONTRACT_VERSION:  CONTRACT_VERSION,
        PRODUCT_TYPE_ID:   PRODUCT_TYPE_ID,
        STATE:             STATE,
        AVAILABILITY:      AVAILABILITY,
        REASON:            REASON,
        GATED_REASON:      GATED_REASON,
        isValidStatus:     isValidStatus,
        canTransition:     canTransition,
        deriveAvailability: deriveAvailability,
        create:            create,
        canStartIntent:    canStartIntent,
        startIntent:       startIntent,
        clearIntent:       clearIntent,
        reconcile:         reconcile,
        resolve:           resolve,
        restore:           restore,
        describeIntent:    describeIntent,
        describeActions:   describeActions,
        describeBoundary:  describeBoundary
    };
}());
