(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    function getDraft(group, productTypeId) {
        if (!group || !Array.isArray(group.productDrafts)) return null;
        if (typeof productTypeId !== 'string' || productTypeId === '') return null;
        for (var i = 0; i < group.productDrafts.length; i++) {
            if (group.productDrafts[i] && group.productDrafts[i].productTypeId === productTypeId) {
                return group.productDrafts[i];
            }
        }
        return null;
    }

    function _findIndex(group, productTypeId) {
        for (var i = 0; i < group.productDrafts.length; i++) {
            if (group.productDrafts[i] && group.productDrafts[i].productTypeId === productTypeId) {
                return i;
            }
        }
        return -1;
    }

    function initDraft(group, productTypeId, opts) {
        if (!group || typeof group !== 'object') {
            return { success: false, error: 'group must be an object', draft: null };
        }
        if (typeof productTypeId !== 'string' || productTypeId === '') {
            return { success: false, error: 'productTypeId must be a non-empty string', draft: null };
        }
        if (!Array.isArray(group.productDrafts)) {
            group.productDrafts = [];
        }
        var existing = getDraft(group, productTypeId);
        if (existing) {
            return { success: true, error: null, draft: existing };
        }
        var safeOpts = opts || {};
        var result = KMEngine.ProductDraftState.create({
            productTypeId: productTypeId,
            notes: safeOpts.notes
        });
        if (!result.success) {
            return { success: false, error: result.error, draft: null };
        }
        group.productDrafts.push(result.state);
        return { success: true, error: null, draft: result.state };
    }

    function advanceDraft(group, productTypeId, toStatus, opts) {
        if (!group || typeof group !== 'object') {
            return { success: false, error: 'group must be an object', draft: null };
        }
        if (typeof productTypeId !== 'string' || productTypeId === '') {
            return { success: false, error: 'productTypeId must be a non-empty string', draft: null };
        }
        if (!Array.isArray(group.productDrafts)) {
            return { success: false, error: 'draft-not-found: ' + productTypeId, draft: null };
        }
        var idx = _findIndex(group, productTypeId);
        if (idx === -1) {
            return { success: false, error: 'draft-not-found: ' + productTypeId, draft: null };
        }
        var result = KMEngine.ProductDraftState.advance(group.productDrafts[idx], toStatus, opts);
        if (!result.success) {
            return { success: false, error: result.error, draft: null };
        }
        group.productDrafts[idx] = result.state;
        return { success: true, error: null, draft: result.state };
    }

    function applyPreflightResult(group, productTypeId, preflightReport) {
        if (!group || typeof group !== 'object') {
            return { success: false, error: 'group must be an object', draft: null };
        }
        if (typeof productTypeId !== 'string' || productTypeId === '') {
            return { success: false, error: 'productTypeId must be a non-empty string', draft: null };
        }
        if (!preflightReport || typeof preflightReport !== 'object' ||
                typeof preflightReport.overallStatus !== 'string') {
            return { success: false, error: 'preflightReport must be an object with overallStatus string', draft: null };
        }
        var draft = getDraft(group, productTypeId);
        if (!draft) {
            return { success: false, error: 'draft-not-found: ' + productTypeId, draft: null };
        }
        if (draft.status !== 'ready-for-preflight') {
            return {
                success: false,
                error: 'precondition-failed: draft must be ready-for-preflight, was ' + draft.status,
                draft: null
            };
        }
        var os = preflightReport.overallStatus;
        if (os === 'incomplete') {
            return { success: false, error: 'preflight-incomplete', draft: null };
        }
        if (os === 'skipped') {
            return { success: false, error: 'preflight-skipped', draft: null };
        }
        if (os === 'passed') {
            return advanceDraft(group, productTypeId, 'preflight-passed');
        }
        if (os === 'failed') {
            return advanceDraft(group, productTypeId, 'preflight-failed');
        }
        return { success: false, error: 'unknown-overall-status: ' + os, draft: null };
    }

    function resetDraft(group, productTypeId, opts) {
        if (!group || typeof group !== 'object') {
            return { success: false, error: 'group must be an object', draft: null };
        }
        if (typeof productTypeId !== 'string' || productTypeId === '') {
            return { success: false, error: 'productTypeId must be a non-empty string', draft: null };
        }
        if (!Array.isArray(group.productDrafts)) {
            return { success: false, error: 'draft-not-found: ' + productTypeId, draft: null };
        }
        var draft = getDraft(group, productTypeId);
        if (!draft) {
            return { success: false, error: 'draft-not-found: ' + productTypeId, draft: null };
        }
        var status = draft.status;
        if (status !== 'ready-for-preflight' &&
                status !== 'preflight-passed' &&
                status !== 'preflight-failed') {
            return {
                success: false,
                error: 'reset-not-allowed: cannot reset from ' + status,
                draft: null
            };
        }
        // preflight-passed and preflight-failed have a direct transition to in-progress.
        if (status === 'preflight-passed' || status === 'preflight-failed') {
            return advanceDraft(group, productTypeId, 'in-progress', opts);
        }
        // ready-for-preflight: construct in-progress record directly — this is a
        // reset-specific operation not represented in the state machine transition graph.
        var safeOpts = opts || {};
        var now = new Date().toISOString();
        var resetState = {
            productTypeId:  draft.productTypeId,
            status:         'in-progress',
            createdAt:      draft.createdAt,
            updatedAt:      now,
            preflightRunAt: draft.preflightRunAt,
            notes:          safeOpts.notes !== undefined ? safeOpts.notes : draft.notes
        };
        var idx = _findIndex(group, productTypeId);
        group.productDrafts[idx] = resetState;
        return { success: true, error: null, draft: resetState };
    }

    KMEngine.ProductDraftLifecycle = {
        getDraft:             getDraft,
        initDraft:            initDraft,
        advanceDraft:         advanceDraft,
        applyPreflightResult: applyPreflightResult,
        resetDraft:           resetDraft
    };
}());
