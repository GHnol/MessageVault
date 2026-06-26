(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var _states = {};

    var _statusLabels = {
        'none':               'Not submitted',
        'pending-review':     'Marked ready for proof review',
        'approved':           'Proof approved',
        'changes-requested':  'Changes requested',
        'revoked':            'Approval revoked',
        'stale':              'Approval out of date'
    };

    // ── Customer-facing proof-panel copy (single source of truth) ──────────────
    // The Message Book proof panel renders its label, status class, hint, and action
    // buttons from this table so the wording stays consistent and is unit-testable.
    // Phases are a superset of ProofApprovalState statuses: the 'none' status splits
    // into the readiness sub-states the panel computes from app content + book-check.
    //
    // Framing is local-only sign-off: approving a proof means "I approve this proof".
    // It never buys, prints, or sends anything anywhere. The hints reassure using that
    // plain language; no copy may imply any such downstream readiness. The engine source
    // itself is also kept free of such vocabulary (guarded by a source-scan test).
    var _panelCopy = {
        'not-ready-empty': {
            label:       'Not ready for proof review',
            statusClass: 'book-proof-notready',
            hint:        'Add messages to a keepsake group to enable proof review.',
            actions:     []
        },
        'not-ready-checking': {
            label:       'Not ready for proof review',
            statusClass: 'book-proof-notready',
            hint:        'Checking whether this book is ready for proof review.',
            actions:     []
        },
        'not-ready-failed': {
            label:       'Not ready for proof review',
            statusClass: 'book-proof-notready',
            hint:        'The book check needs attention before this book can go to proof review.',
            actions:     []
        },
        'not-ready-over-limit': {
            label:       'Not ready for proof review',
            statusClass: 'book-proof-notready',
            hint:        'This volume is longer than its page limit. Move or remove sections until it fits, then it can go to proof review.',
            actions:     []
        },
        'ready': {
            label:       'Ready for proof review',
            statusClass: 'book-proof-ready',
            hint:        'Reviewing a proof happens on this device. It does not buy, print, or send anything.',
            actions:     [{ action: 'submit-for-review', id: 'bookProofSubmitBtn', label: 'Mark ready for proof review' }]
        },
        'pending-review': {
            label:       'Marked ready for proof review',
            statusClass: 'book-proof-pending',
            hint:        'Approving means you approve this proof to keep. It is recorded on this device — it does not buy, print, or send anything.',
            actions:     [
                { action: 'approve',             id: 'bookProofApproveBtn', label: 'Approve proof' },
                { action: 'withdraw-submission', id: 'bookProofCancelBtn',  label: 'Cancel proof review' }
            ]
        },
        'approved': {
            label:       'Proof approved',
            statusClass: 'book-proof-approved',
            hint:        'You approved this proof and it matches the current book. Your approval is recorded on this device — it does not buy, print, or send anything. Editing the book will mark it for re-approval.',
            actions:     []
        },
        'stale': {
            label:       'Approval out of date',
            statusClass: 'book-proof-stale',
            hint:        'This proof changed after it was approved. Review the book and approve it again. Recorded on this device only.',
            actions:     [{ action: 'submit-for-review', id: 'bookProofResubmitBtn', label: 'Mark ready for proof review again' }]
        },
        'changes-requested': {
            label:       'Changes requested',
            statusClass: 'book-proof-changes',
            hint:        null,
            actions:     []
        },
        'revoked': {
            label:       'Approval revoked',
            statusClass: 'book-proof-revoked',
            hint:        null,
            actions:     []
        }
    };

    // Returns a defensive copy of the panel view-model for a phase, or null for an
    // unknown phase (caller hides the panel). Pure: no DOM, no Date, no mutation.
    function getProofPanelCopy(phase) {
        var entry = _panelCopy[phase];
        if (!entry) return null;
        return {
            phase:       phase,
            label:       entry.label,
            statusClass: entry.statusClass,
            hint:        entry.hint,
            actions:     entry.actions.map(function (a) {
                return { action: a.action, id: a.id, label: a.label };
            })
        };
    }

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
        getProofPanelCopy:    getProofPanelCopy,
        getAllowedUserActions: getAllowedUserActions,
        serialize:            serialize,
        restore:              restore
    };
}());
