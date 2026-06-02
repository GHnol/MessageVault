(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var STATUS = Object.freeze({
        NONE:                 'none',
        IN_PROGRESS:          'in-progress',
        READY_FOR_PREFLIGHT:  'ready-for-preflight',
        PREFLIGHT_PASSED:     'preflight-passed',
        PREFLIGHT_FAILED:     'preflight-failed'
    });

    var _allowed = [
        ['none',                'in-progress'],
        ['in-progress',         'ready-for-preflight'],
        ['ready-for-preflight', 'preflight-passed'],
        ['ready-for-preflight', 'preflight-failed'],
        ['preflight-failed',    'in-progress'],
        ['preflight-passed',    'in-progress']
    ];

    var _validStatuses = {};
    _validStatuses[STATUS.NONE]                = true;
    _validStatuses[STATUS.IN_PROGRESS]         = true;
    _validStatuses[STATUS.READY_FOR_PREFLIGHT] = true;
    _validStatuses[STATUS.PREFLIGHT_PASSED]    = true;
    _validStatuses[STATUS.PREFLIGHT_FAILED]    = true;

    function isValidStatus(status) {
        return !!_validStatuses[status];
    }

    function canAdvance(from, to) {
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
            productTypeId:    opts.productTypeId,
            status:           STATUS.NONE,
            createdAt:        now,
            updatedAt:        now,
            preflightRunAt:   null,
            notes:            opts.notes || null
        };
        return { success: true, error: null, state: state };
    }

    function advance(stateRecord, toStatus, opts) {
        if (!isValidStatus(toStatus)) {
            return { success: false, error: 'invalid-status: ' + toStatus, state: null };
        }
        var from = stateRecord.status;
        if (!canAdvance(from, toStatus)) {
            return { success: false, error: 'transition-not-allowed: ' + from + '→' + toStatus, state: null };
        }

        var now = new Date().toISOString();
        var safeOpts = opts || {};

        var next = {
            productTypeId:    stateRecord.productTypeId,
            status:           toStatus,
            createdAt:        stateRecord.createdAt,
            updatedAt:        now,
            preflightRunAt:   stateRecord.preflightRunAt,
            notes:            safeOpts.notes !== undefined ? safeOpts.notes : stateRecord.notes
        };

        if (toStatus === STATUS.PREFLIGHT_PASSED || toStatus === STATUS.PREFLIGHT_FAILED) {
            next.preflightRunAt = now;
        }

        return { success: true, error: null, state: next };
    }

    KMEngine.ProductDraftState = {
        STATUS:        STATUS,
        isValidStatus: isValidStatus,
        canAdvance:    canAdvance,
        create:        create,
        advance:       advance
    };
}());
