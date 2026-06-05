(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var STATUS = Object.freeze({
        NONE:               'none',
        PENDING_REVIEW:     'pending-review',
        APPROVED:           'approved',
        CHANGES_REQUESTED:  'changes-requested',
        REVOKED:            'revoked'
    });

    var _allowed = [
        ['none',               'pending-review'],
        ['pending-review',     'none'],
        ['pending-review',     'approved'],
        ['pending-review',     'changes-requested'],
        ['changes-requested',  'pending-review'],
        ['approved',           'revoked'],
        ['revoked',            'pending-review']
    ];

    var _validStatuses = {};
    _validStatuses[STATUS.NONE]               = true;
    _validStatuses[STATUS.PENDING_REVIEW]     = true;
    _validStatuses[STATUS.APPROVED]           = true;
    _validStatuses[STATUS.CHANGES_REQUESTED]  = true;
    _validStatuses[STATUS.REVOKED]            = true;

    function canTransition(from, to) {
        for (var i = 0; i < _allowed.length; i++) {
            if (_allowed[i][0] === from && _allowed[i][1] === to) return true;
        }
        return false;
    }

    function create(opts) {
        if (!opts || typeof opts.productTypeId !== 'string' || opts.productTypeId === '') {
            return { success: false, error: 'productTypeId must be a non-empty string', state: null };
        }
        var now = new Date().toISOString();
        var state = {
            productTypeId:       opts.productTypeId,
            status:              STATUS.NONE,
            createdAt:           now,
            updatedAt:           now,
            submittedAt:         null,
            approvedAt:          null,
            changesRequestedAt:  null,
            revokedAt:           null,
            changeRequestReason: null,
            revokeReason:        null,
            notes:               null
        };
        return { success: true, error: null, state: state };
    }

    function transition(stateRecord, toStatus, opts) {
        if (!_validStatuses[toStatus]) {
            return { success: false, error: 'invalid-status: ' + toStatus, state: null };
        }
        var from = stateRecord.status;
        if (!canTransition(from, toStatus)) {
            return { success: false, error: 'transition-not-allowed: ' + from + '→' + toStatus, state: null };
        }

        var now = new Date().toISOString();
        var safeOpts = opts || {};

        var next = {
            productTypeId:       stateRecord.productTypeId,
            status:              toStatus,
            createdAt:           stateRecord.createdAt,
            updatedAt:           now,
            submittedAt:         stateRecord.submittedAt,
            approvedAt:          stateRecord.approvedAt,
            changesRequestedAt:  stateRecord.changesRequestedAt,
            revokedAt:           stateRecord.revokedAt,
            changeRequestReason: stateRecord.changeRequestReason,
            revokeReason:        stateRecord.revokeReason,
            notes:               stateRecord.notes
        };

        if (from === 'none' && toStatus === 'pending-review') {
            next.submittedAt = now;
        } else if (from === 'pending-review' && toStatus === 'none') {
            next.submittedAt = null;
        } else if (from === 'pending-review' && toStatus === 'approved') {
            next.approvedAt = now;
        } else if (from === 'pending-review' && toStatus === 'changes-requested') {
            next.changesRequestedAt  = now;
            next.changeRequestReason = safeOpts.changeRequestReason || null;
        } else if (from === 'changes-requested' && toStatus === 'pending-review') {
            next.submittedAt = now;
            // changesRequestedAt and changeRequestReason preserved from stateRecord
        } else if (from === 'approved' && toStatus === 'revoked') {
            next.revokedAt    = now;
            next.revokeReason = safeOpts.revokeReason || null;
        } else if (from === 'revoked' && toStatus === 'pending-review') {
            next.submittedAt = now;
            // approvedAt, revokedAt, revokeReason preserved from stateRecord
        }

        return { success: true, error: null, state: next };
    }

    KMEngine.ProofApprovalState = {
        STATUS:        STATUS,
        canTransition: canTransition,
        create:        create,
        transition:    transition
    };
}());
