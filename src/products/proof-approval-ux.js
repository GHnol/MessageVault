(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var _states = {};

    var _statusLabels = {
        'none':               'Not submitted',
        'pending-review':     'Marked ready for proof review',
        'approved':           'Approved',
        'changes-requested':  'Changes requested',
        'revoked':            'Approval revoked'
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

    function getAllowedUserActions(status) {
        if (status === 'none') return ['submit-for-review'];
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
        getStatusLabel:       getStatusLabel,
        getAllowedUserActions: getAllowedUserActions,
        serialize:            serialize,
        restore:              restore
    };
}());
