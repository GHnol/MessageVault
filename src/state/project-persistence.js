(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var SCHEMA_VERSION = '1';

    // Produce the thin serializable snapshot object from current app state.
    // Groups are converted from {messages:[objects]} to {messageIds:[ids]}
    // so the file is self-contained but not bloated with duplicated message data.
    function createSnapshot(opts) {
        var now       = new Date().toISOString();
        var memories  = opts.memories || [];
        var groups    = opts.keepsakeGroups || [];
        var selSet    = opts.selectedIndices; // Set or array-like of int indices
        var bookState = opts.messageBookState || null;

        // Build ID→index map for converting selectedIndices → selectedMemoryIds
        var idToIndex = {};
        for (var i = 0; i < memories.length; i++) {
            if (memories[i] && memories[i].id) idToIndex[memories[i].id] = i;
        }

        var selectedMemoryIds = [];
        if (selSet) {
            selSet.forEach(function (idx) {
                var mem = memories[idx];
                if (mem && mem.id) selectedMemoryIds.push(mem.id);
            });
        }

        // Serialize groups: store messageIds (not objects) to avoid duplication.
        // messageIndices are stored as-is because they are valid indices into the
        // memories array, which is also serialized — restoring them is exact.
        var serializedGroups = groups.map(function (g) {
            var msgs     = g.messages       || [];
            var midxs    = g.messageIndices || [];
            var msgIds   = [];
            var storedMi = [];
            for (var gi = 0; gi < msgs.length; gi++) {
                msgIds.push(msgs[gi] && msgs[gi].id ? msgs[gi].id : null);
                storedMi.push(midxs[gi] != null ? midxs[gi] : -1);
            }
            return {
                id:                g.id,
                customName:        g.customName        || null,
                chosenTypeId:      g.chosenTypeId      || null,
                messageIds:        msgIds,
                messageIndices:    storedMi,
                lastComposedAt:    g.lastComposedAt    || null,
                memoryIds:         g.memoryIds         || [],
                sourcePlatformIds: g.sourcePlatformIds || [],
                productDrafts:     Array.isArray(g.productDrafts) ? g.productDrafts : [],
                metadata:          g.metadata          || {}
            };
        });

        // Deep-clone messageBookState via JSON round-trip to strip DOM refs and
        // functions. Drop sections[].messages — syncBookSections() re-derives them.
        var safeBookState = null;
        if (bookState) {
            try {
                var raw = JSON.stringify(bookState);
                safeBookState = JSON.parse(raw);
                if (safeBookState.sections && Array.isArray(safeBookState.sections)) {
                    for (var si = 0; si < safeBookState.sections.length; si++) {
                        delete safeBookState.sections[si].messages;
                    }
                }
            } catch (_) {
                safeBookState = null;
            }
        }

        return {
            keepmeesVersion: SCHEMA_VERSION,
            exportedAt:      now,
            projectSession: {
                id:                 opts.sessionId || ('sess-' + Date.now().toString(36)),
                version:            SCHEMA_VERSION,
                createdAt:          opts.createdAt || now,
                updatedAt:          now,
                contactName:        typeof opts.contactName === 'string' ? opts.contactName : '',
                memories:           memories,
                selectedMemoryIds:  selectedMemoryIds,
                keepsakeGroups:     serializedGroups,
                productDrafts:      opts.productDrafts || [],
                proofApprovalStates: (opts.proofApprovalStates && typeof opts.proofApprovalStates === 'object' && !Array.isArray(opts.proofApprovalStates))
                    ? opts.proofApprovalStates
                    : {},
                messageBookState:   safeBookState
            }
        };
    }

    function validate(obj) {
        var errors = [];
        if (!obj || typeof obj !== 'object') {
            return { valid: false, errors: ['Input is not an object'] };
        }
        if (typeof obj.keepmeesVersion !== 'string') {
            errors.push('keepmeesVersion must be a string');
        } else if (obj.keepmeesVersion !== SCHEMA_VERSION) {
            errors.push(
                'Unsupported version "' + obj.keepmeesVersion +
                '" — this app supports version "' + SCHEMA_VERSION + '"'
            );
        }
        if (!obj.projectSession || typeof obj.projectSession !== 'object') {
            errors.push('projectSession is missing or not an object');
            return { valid: errors.length === 0, errors: errors };
        }
        var s = obj.projectSession;
        if (typeof s.id !== 'string' || !s.id) {
            errors.push('projectSession.id must be a non-empty string');
        }
        if (!Array.isArray(s.memories)) {
            errors.push('projectSession.memories must be an array');
        }
        if (!Array.isArray(s.selectedMemoryIds)) {
            errors.push('projectSession.selectedMemoryIds must be an array');
        }
        if (!Array.isArray(s.keepsakeGroups)) {
            errors.push('projectSession.keepsakeGroups must be an array');
        }
        if (s.proofApprovalStates !== undefined && s.proofApprovalStates !== null &&
                (typeof s.proofApprovalStates !== 'object' || Array.isArray(s.proofApprovalStates))) {
            errors.push('projectSession.proofApprovalStates must be a plain object if present');
        }
        if (s.productDrafts !== undefined && s.productDrafts !== null &&
                !Array.isArray(s.productDrafts)) {
            errors.push('projectSession.productDrafts must be an array if present');
        }
        return { valid: errors.length === 0, errors: errors };
    }

    function deserialize(json) {
        var obj;
        try {
            obj = (typeof json === 'string') ? JSON.parse(json) : json;
        } catch (e) {
            return { success: false, data: null, error: 'JSON parse error: ' + e.message };
        }
        var v = validate(obj);
        if (!v.valid) {
            return { success: false, data: null, error: v.errors.join('; ') };
        }
        return { success: true, data: obj, error: null };
    }

    KMEngine.ProjectPersistence = {
        VERSION:        SCHEMA_VERSION,
        FILE_EXTENSION: '.keepmees.json',
        createSnapshot: createSnapshot,
        validate:       validate,
        deserialize:    deserialize
    };
}());
