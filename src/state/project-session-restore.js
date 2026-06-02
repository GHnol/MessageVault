(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var KNOWN_SESSION_FIELDS = [
        'id', 'version', 'createdAt', 'updatedAt', 'contactName',
        'memories', 'selectedMemoryIds', 'keepsakeGroups',
        'productDrafts', 'proofApprovalStates', 'messageBookState'
    ];

    // Restore a deserialized project file into typed app state.
    //
    // Returns:
    //   { success: true,  appState: {...}, warnings: [...], errors: [] }
    //   { success: false, appState: null,  warnings: [...], errors: [...] }
    //
    // appState shape:
    //   memories             — NormalizedMemory array (= chatMessagesData)
    //   selectedIndices      — int[] of indices into memories
    //   groups               — keepsakeGroups array (thick: with .messages refs)
    //   contactName          — string
    //   proofApprovalStates  — plain object (defaults to {})
    //   messageBookState     — object | null
    //
    // Contract: does NOT mutate app globals. Caller applies the result.
    function restore(data) {
        var warnings = [];
        var errors   = [];

        if (!data || typeof data !== 'object') {
            return { success: false, appState: null, warnings: warnings,
                     errors: ['restore() received null or non-object data'] };
        }
        var s = data.projectSession;
        if (!s || typeof s !== 'object') {
            return { success: false, appState: null, warnings: warnings,
                     errors: ['projectSession is missing'] };
        }

        // ── Memories ──────────────────────────────────────────────────────────
        var memories = Array.isArray(s.memories) ? s.memories : [];
        var idToIndex = {};
        for (var i = 0; i < memories.length; i++) {
            var mem = memories[i];
            if (mem && mem.id) {
                idToIndex[mem.id] = i;
            } else {
                warnings.push('Memory at index ' + i + ' has no id — omitted from ID lookup');
            }
        }

        // ── selectedMemoryIds → int[] selectedIndices ─────────────────────────
        var rawIds = Array.isArray(s.selectedMemoryIds) ? s.selectedMemoryIds : [];
        var selectedIndices = [];
        for (var si = 0; si < rawIds.length; si++) {
            var mid = rawIds[si];
            if (idToIndex[mid] !== undefined) {
                selectedIndices.push(idToIndex[mid]);
            } else {
                warnings.push('selectedMemoryId "' + mid + '" not in memories — skipped');
            }
        }

        // ── keepsakeGroups ────────────────────────────────────────────────────
        var rawGroups = Array.isArray(s.keepsakeGroups) ? s.keepsakeGroups : [];
        var groups = [];
        for (var gi = 0; gi < rawGroups.length; gi++) {
            var rg = rawGroups[gi];
            if (!rg || typeof rg.id !== 'string') {
                warnings.push('Group at index ' + gi + ' has no id — skipped');
                continue;
            }

            var messageIds      = Array.isArray(rg.messageIds)      ? rg.messageIds      : [];
            var storedMi        = Array.isArray(rg.messageIndices)   ? rg.messageIndices  : [];
            var restoredMsgs    = [];
            var restoredIdxs    = [];

            for (var mi = 0; mi < messageIds.length; mi++) {
                var msgId = messageIds[mi];
                if (msgId && idToIndex[msgId] !== undefined) {
                    restoredMsgs.push(memories[idToIndex[msgId]]);
                    // Prefer stored messageIndices; fall back to derived position.
                    var storedIdx = storedMi[mi];
                    restoredIdxs.push(storedIdx != null && storedIdx >= 0
                        ? storedIdx
                        : idToIndex[msgId]);
                } else if (msgId) {
                    warnings.push(
                        'Group "' + rg.id + '": messageId "' + msgId +
                        '" not found in memories — message dropped from group'
                    );
                }
            }

            groups.push({
                id:                rg.id,
                messages:          restoredMsgs,
                messageIndices:    restoredIdxs,
                customName:        rg.customName        || null,
                chosenTypeId:      rg.chosenTypeId      || null,
                lastComposedAt:    rg.lastComposedAt    || null,
                memoryIds:         rg.memoryIds         || [],
                sourcePlatformIds: rg.sourcePlatformIds || [],
                productDrafts:     rg.productDrafts     || [],
                metadata:          rg.metadata          || {}
            });
        }

        // ── contactName ───────────────────────────────────────────────────────
        var contactName = (typeof s.contactName === 'string') ? s.contactName : '';

        // ── messageBookState ──────────────────────────────────────────────────
        var messageBookState = null;
        if (s.messageBookState && typeof s.messageBookState === 'object') {
            messageBookState = s.messageBookState;
        }

        // ── proofApprovalStates ───────────────────────────────────────────────
        var proofApprovalStates = {};
        if (s.proofApprovalStates && typeof s.proofApprovalStates === 'object' &&
                !Array.isArray(s.proofApprovalStates)) {
            proofApprovalStates = s.proofApprovalStates;
        }

        // ── Unknown fields — report but do not crash ──────────────────────────
        for (var key in s) {
            if (s.hasOwnProperty(key) && KNOWN_SESSION_FIELDS.indexOf(key) === -1) {
                warnings.push('Unknown field "' + key + '" in projectSession — ignored');
            }
        }

        return {
            success:  errors.length === 0,
            appState: {
                memories:            memories,
                selectedIndices:     selectedIndices,
                groups:              groups,
                contactName:         contactName,
                proofApprovalStates: proofApprovalStates,
                messageBookState:    messageBookState
            },
            warnings: warnings,
            errors:   errors
        };
    }

    KMEngine.ProjectSessionRestore = {
        restore: restore
    };
}());
