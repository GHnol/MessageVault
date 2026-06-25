(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var STATUS = Object.freeze({
        NONE:               'none',
        PENDING_REVIEW:     'pending-review',
        APPROVED:           'approved',
        CHANGES_REQUESTED:  'changes-requested',
        REVOKED:            'revoked',
        STALE:              'stale'
    });

    var _allowed = [
        ['none',               'pending-review'],
        ['pending-review',     'none'],
        ['pending-review',     'approved'],
        ['pending-review',     'changes-requested'],
        ['changes-requested',  'pending-review'],
        ['approved',           'revoked'],
        ['revoked',            'pending-review'],
        // Staleness: an approved proof whose underlying Message Book content/settings
        // changed is no longer a valid approval. It transitions to 'stale' (explicit,
        // durable), and from there is re-submitted for review or cleared.
        ['approved',           'stale'],
        ['stale',              'pending-review'],
        ['stale',              'none']
    ];

    var _validStatuses = {};
    _validStatuses[STATUS.NONE]               = true;
    _validStatuses[STATUS.PENDING_REVIEW]     = true;
    _validStatuses[STATUS.APPROVED]           = true;
    _validStatuses[STATUS.CHANGES_REQUESTED]  = true;
    _validStatuses[STATUS.REVOKED]            = true;
    _validStatuses[STATUS.STALE]              = true;

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
            productTypeId:            opts.productTypeId,
            status:                   STATUS.NONE,
            createdAt:                now,
            updatedAt:                now,
            submittedAt:              null,
            approvedAt:               null,
            changesRequestedAt:       null,
            revokedAt:                null,
            staleAt:                  null,
            changeRequestReason:      null,
            revokeReason:             null,
            approvedProofFingerprint: null,
            notes:                    null
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
            productTypeId:            stateRecord.productTypeId,
            status:                   toStatus,
            createdAt:                stateRecord.createdAt,
            updatedAt:                now,
            submittedAt:              stateRecord.submittedAt,
            approvedAt:               stateRecord.approvedAt,
            changesRequestedAt:       stateRecord.changesRequestedAt,
            revokedAt:                stateRecord.revokedAt,
            staleAt:                  stateRecord.staleAt != null ? stateRecord.staleAt : null,
            changeRequestReason:      stateRecord.changeRequestReason,
            revokeReason:             stateRecord.revokeReason,
            approvedProofFingerprint: stateRecord.approvedProofFingerprint != null
                ? stateRecord.approvedProofFingerprint : null,
            notes:                    stateRecord.notes
        };

        if (from === 'none' && toStatus === 'pending-review') {
            next.submittedAt = now;
        } else if (from === 'pending-review' && toStatus === 'none') {
            next.submittedAt = null;
        } else if (from === 'pending-review' && toStatus === 'approved') {
            next.approvedAt = now;
            // Bind this approval to the exact proof it approved. A later content change
            // produces a different fingerprint, which makes the approval detectably stale.
            next.approvedProofFingerprint =
                (typeof safeOpts.proofFingerprint === 'string' && safeOpts.proofFingerprint !== '')
                    ? safeOpts.proofFingerprint
                    : null;
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
        } else if (from === 'approved' && toStatus === 'stale') {
            next.staleAt = now;
            // approvedAt and approvedProofFingerprint preserved as history of what was
            // approved; the approval is no longer valid for the current proof.
        } else if (from === 'stale' && toStatus === 'pending-review') {
            next.submittedAt = now;
            // staleAt / approvedAt / approvedProofFingerprint preserved as history
        } else if (from === 'stale' && toStatus === 'none') {
            next.submittedAt = null;
            // approval fully cleared; staleAt/approvedAt preserved as history
        }

        return { success: true, error: null, state: next };
    }

    // ── Proof content fingerprint ────────────────────────────────────────────
    // A stable, deterministic signature of the proof-affecting Message Book state.
    // It is intentionally scoped to content/settings that change the rendered proof
    // and excludes view/navigation-only state (activeVolumeId) and derived display
    // values (page-count estimates) so that merely looking at a different volume or a
    // re-pagination does not falsely invalidate an approval.
    //
    // contactName is an optional second argument: it is rendered on the proof title
    // page, so it is part of the proof identity. Callers pass the same trimmed display
    // value the renderer uses; omitting it (or a non-string) is treated as '' so the
    // single-argument form remains backward compatible.

    function _fnv1a(str, seed) {
        var h = seed >>> 0;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return h >>> 0;
    }

    function _hex8(n) {
        var s = (n >>> 0).toString(16);
        return '00000000'.slice(s.length) + s;
    }

    // Two independent FNV-1a seeds combined → 16 hex chars; collision risk negligible
    // for this scale. Pure: no Date, no Math.random, no DOM.
    function _hashString(str) {
        return _hex8(_fnv1a(str, 0x811c9dc5)) + _hex8(_fnv1a(str, 0x7a3b1f17));
    }

    function _projectMessageIds(messages) {
        var ids = [];
        if (Array.isArray(messages)) {
            for (var i = 0; i < messages.length; i++) {
                var m = messages[i];
                ids.push(m && m.id != null ? String(m.id) : ('@' + i));
            }
        }
        return ids;
    }

    function computeProofFingerprint(bookState, contactName) {
        var contact = (typeof contactName === 'string') ? contactName : '';
        if (!bookState || typeof bookState !== 'object') {
            return 'kmpf1:' + _hashString('empty|' + contact);
        }

        var fmt      = bookState.format   || {};
        var opening  = bookState.opening  || {};
        var body     = bookState.body     || {};
        var volumes  = Array.isArray(bookState.volumes)  ? bookState.volumes  : [];
        var sections = Array.isArray(bookState.sections) ? bookState.sections : [];

        var projVolumes = volumes.map(function (v) {
            v = v || {};
            return { id: v.id != null ? v.id : null, name: v.name != null ? v.name : null };
        });

        var projSections = sections.map(function (s) {
            s = s || {};
            return {
                sourceGroupId:                 s.sourceGroupId != null ? s.sourceGroupId : null,
                customName:                    s.customName    != null ? s.customName    : null,
                customTitle:                   s.customTitle   != null ? s.customTitle   : null,
                volumeId:                      s.volumeId      != null ? s.volumeId      : null,
                included:                      s.included !== false,
                orderIndex:                    typeof s.orderIndex === 'number' ? s.orderIndex : null,
                featured:                      !!s.featured,
                forcePageBreakBefore:          !!s.forcePageBreakBefore,
                showDividerBefore:             !!s.showDividerBefore,
                preserveSameSenderRuns:        s.preserveSameSenderRuns !== false,
                preserveShortExchangeClusters: s.preserveShortExchangeClusters !== false,
                messageIds:                    _projectMessageIds(s.messages)
            };
        });

        // Canonicalize section array order by a stable key so that re-ordering the
        // backing array without changing orderIndex does not change the fingerprint.
        // orderIndex is itself a captured field, so a genuine re-order still changes it.
        projSections.sort(function (a, b) {
            var ka = String(a.sourceGroupId) + '#' + (a.orderIndex == null ? '' : a.orderIndex);
            var kb = String(b.sourceGroupId) + '#' + (b.orderIndex == null ? '' : b.orderIndex);
            if (ka < kb) return -1;
            if (ka > kb) return 1;
            return 0;
        });

        var canonical = {
            contactName: contact,
            format: {
                trimWidthIn:  fmt.trimWidthIn  != null ? fmt.trimWidthIn  : null,
                trimHeightIn: fmt.trimHeightIn != null ? fmt.trimHeightIn : null,
                maxPages:     fmt.maxPages     != null ? fmt.maxPages     : null
            },
            opening: {
                title:             opening.title != null ? opening.title : null,
                dedicationEnabled: !!opening.dedicationEnabled,
                dedicationText:    opening.dedicationText != null ? opening.dedicationText : null
            },
            body: {
                timestampMode:  body.timestampMode  != null ? body.timestampMode  : null,
                pageNumberMode: body.pageNumberMode != null ? body.pageNumberMode : null,
                dividerMode:    body.dividerMode    != null ? body.dividerMode    : null,
                endingMode:     body.endingMode     != null ? body.endingMode     : null,
                flowMode:       body.flowMode       != null ? body.flowMode       : null
            },
            volumes:  projVolumes,
            sections: projSections
        };

        return 'kmpf1:' + _hashString(JSON.stringify(canonical));
    }

    // True only when an APPROVED record is bound to a fingerprint that differs from the
    // current proof. Any non-approved status, a missing stored fingerprint, or a missing
    // current fingerprint is treated as not-stale (the caller decides those cases).
    function isApprovalStale(stateRecord, currentFingerprint) {
        if (!stateRecord || stateRecord.status !== STATUS.APPROVED) return false;
        if (typeof stateRecord.approvedProofFingerprint !== 'string' ||
                stateRecord.approvedProofFingerprint === '') return false;
        if (typeof currentFingerprint !== 'string' || currentFingerprint === '') return false;
        return stateRecord.approvedProofFingerprint !== currentFingerprint;
    }

    KMEngine.ProofApprovalState = {
        STATUS:                  STATUS,
        canTransition:           canTransition,
        create:                  create,
        transition:              transition,
        computeProofFingerprint: computeProofFingerprint,
        isApprovalStale:         isApprovalStale
    };
}());
