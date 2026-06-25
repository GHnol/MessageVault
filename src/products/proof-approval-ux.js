(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var _states = {};

    var _statusLabels = {
        'none':               'Not submitted',
        'pending-review':     'Marked ready for proof review',
        'approved':           'Approved',
        'changes-requested':  'Changes requested',
        'revoked':            'Approval revoked',
        'stale':              'Approval out of date — book changed since approval'
    };

    function initialize(productTypeId) {
        if (typeof productTypeId !== 'string' || productTypeId === '') {
            return { success: false, error: 'productTypeId must be a non-empty string', state: null };
        }
        if (_states[productTypeId]) {
            return { success: true, error: null, state: _states[productTypeId] };
        }
        var result = KMEngine.ProofApprovalState.create({ productTypeId: productTypeId });
        if (!result.success) return result;
        _states[productTypeId] = result.state;
        return { success: true, error: null, state: _states[productTypeId] };
    }

    function getState(productTypeId) {
        return _states[productTypeId] || null;
    }

    function submitForReview(productTypeId) {
        var current = _states[productTypeId];
        if (!current) {
            return { success: false, error: 'not-initialized: ' + productTypeId, state: null };
        }
        var result = KMEngine.ProofApprovalState.transition(current, 'pending-review');
        if (!result.success) return result;
        _states[productTypeId] = result.state;
        return { success: true, error: null, state: _states[productTypeId] };
    }

    function getStatusLabel(status) {
        return _statusLabels[status] || 'Unknown status';
    }

    // Approve the current proof, binding the approval to the supplied proof fingerprint.
    // Local-only: records an approved review status. It does not transmit anything and
    // does not imply any downstream production or purchase readiness.
    function approve(productTypeId, proofFingerprint) {
        var current = _states[productTypeId];
        if (!current) {
            return { success: false, error: 'not-initialized: ' + productTypeId, state: null };
        }
        var result = KMEngine.ProofApprovalState.transition(current, 'approved', {
            proofFingerprint: (typeof proofFingerprint === 'string' && proofFingerprint !== '')
                ? proofFingerprint
                : null
        });
        if (!result.success) return result;
        _states[productTypeId] = result.state;
        return { success: true, error: null, state: _states[productTypeId] };
    }

    // If the current proof differs from the approved one, move the approval to 'stale'.
    // No-op for any non-approved status or when the proof still matches. Returns whether
    // the status changed so callers can re-render only when needed.
    function refreshStaleness(productTypeId, currentFingerprint) {
        var current = _states[productTypeId];
        if (!current) {
            return { success: false, changed: false, error: 'not-initialized: ' + productTypeId, state: null };
        }
        var PAS = KMEngine.ProofApprovalState;
        if (!PAS.isApprovalStale(current, currentFingerprint)) {
            return { success: true, changed: false, error: null, state: current };
        }
        var result = PAS.transition(current, 'stale');
        if (!result.success) {
            return { success: false, changed: false, error: result.error, state: current };
        }
        _states[productTypeId] = result.state;
        return { success: true, changed: true, error: null, state: _states[productTypeId] };
    }

    function withdrawSubmission(productTypeId) {
        var current = _states[productTypeId];
        if (!current) {
            return { success: false, error: 'not-initialized: ' + productTypeId, state: null };
        }
        var result = KMEngine.ProofApprovalState.transition(current, 'none');
        if (!result.success) return result;
        _states[productTypeId] = result.state;
        return { success: true, error: null, state: _states[productTypeId] };
    }

    function getAllowedUserActions(status) {
        if (status === 'none') return ['submit-for-review'];
        if (status === 'pending-review') return ['approve', 'withdraw-submission'];
        if (status === 'stale') return ['submit-for-review'];
        return [];
    }

    function serialize() {
        var out = {};
        for (var key in _states) {
            if (_states.hasOwnProperty(key)) {
                out[key] = _states[key];
            }
        }
        return out;
    }

    function restore(data) {
        if (!data || typeof data !== 'object') {
            _states = {};
            return;
        }
        var next = {};
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            var record = data[key];
            if (!record || typeof record !== 'object') continue;
            if (typeof record.productTypeId !== 'string' || typeof record.status !== 'string') continue;
            next[key] = record;
        }
        _states = next;
    }

    KMEngine.ProofApprovalUX = {
        initialize:           initialize,
        getState:             getState,
        submitForReview:      submitForReview,
        withdrawSubmission:   withdrawSubmission,
        approve:              approve,
        refreshStaleness:     refreshStaleness,
        getStatusLabel:       getStatusLabel,
        getAllowedUserActions: getAllowedUserActions,
        serialize:            serialize,
        restore:              restore
    };
}());
