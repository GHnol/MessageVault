(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    function generateGroupId() {
        return 'kg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    }

    // Extracts memory IDs from messages that carry a .id (NormalizedMemory).
    // Returns empty array for legacy plain message objects that lack .id.
    function deriveMemoryIds(group) {
        var ids = [];
        var msgs = group.messages || [];
        for (var i = 0; i < msgs.length; i++) {
            if (msgs[i].id) ids.push(msgs[i].id);
        }
        return ids;
    }

    // Extracts unique sourcePlatformIds from messages that carry one.
    // Returns empty array for legacy messages that predate the NormalizedMemory adapter.
    function deriveSourcePlatformIds(group) {
        var seen = {};
        var ids = [];
        var msgs = group.messages || [];
        for (var i = 0; i < msgs.length; i++) {
            var pid = msgs[i].sourcePlatformId;
            if (pid && !seen[pid]) {
                seen[pid] = true;
                ids.push(pid);
            }
        }
        return ids;
    }

    // Returns the visible display name for a group.
    // Mirrors the getGroupDisplayName() logic in index.html — the canonical version
    // stays there for UI use; this helper is for engine/test contexts.
    // Caller must supply allGroups (the full keepsakeGroups array) for position lookup.
    function getDisplayName(group, allGroups) {
        if (group.id === 'group-staging') return 'Newly Selected';
        if (group.customName && group.customName.trim()) return group.customName.trim();
        var realGroups = (allGroups || []).filter(function (g) { return g.id !== 'group-staging'; });
        var idx = realGroups.indexOf(group);
        return 'Keepsake Set ' + (idx >= 0 ? idx + 1 : '?');
    }

    KMEngine.KeepsakeGroup = {
        // Produces a new group object compatible with the existing keepsakeGroups array shape.
        // All existing fields are preserved so the result can be dropped into keepsakeGroups
        // without any changes to index.html UI logic.
        create: function (opts) {
            opts = opts || {};
            return {
                id:             opts.id             || generateGroupId(),
                messages:       opts.messages       || [],
                messageIndices: opts.messageIndices || [],
                customName:     opts.customName     || null,
                chosenTypeId:   opts.chosenTypeId   || null,
                lastComposedAt: opts.lastComposedAt || null,
                memoryIds:         opts.memoryIds         || [],
                sourcePlatformIds: opts.sourcePlatformIds || [],
                productDrafts:     opts.productDrafts     || [],
                metadata:          opts.metadata          || {}
            };
        },

        // Update lastComposedAt to now (mirrors touchGroup() in index.html).
        touch: function (group) {
            group.lastComposedAt = Date.now();
            return group;
        },

        getDisplayName:          getDisplayName,
        deriveMemoryIds:         deriveMemoryIds,
        deriveSourcePlatformIds: deriveSourcePlatformIds
    };
}());
