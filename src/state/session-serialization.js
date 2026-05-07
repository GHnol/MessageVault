(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    KMEngine.SessionSerialization = {
        serialize: function (session) {
            return JSON.stringify(session, null, 2);
        },

        restore: function (data) {
            var obj;
            try {
                obj = typeof data === 'string' ? JSON.parse(data) : data;
            } catch (e) {
                return { success: false, error: 'JSON parse error: ' + e.message, session: null };
            }
            if (!KMEngine.ProjectSession.validate(obj)) {
                return { success: false, error: 'Object does not look like a valid ProjectSession', session: null };
            }
            return { success: true, error: null, session: obj };
        },

        // Snapshot the current in-app state into a ProjectSession.
        // Reads from window.__km — safe to call while the app is loaded.
        captureFromApp: function (opts) {
            opts = opts || {};
            var km = window.__km;
            if (!km) return null;

            var groups     = km.getKeepsakeGroups ? km.getKeepsakeGroups() : [];
            var memories   = [];
            var selectedIds = [];

            for (var i = 0; i < groups.length; i++) {
                var g = groups[i];
                for (var j = 0; j < g.messages.length; j++) {
                    var m = g.messages[j];
                    memories.push(m);
                    if (m.id) selectedIds.push(m.id);
                }
            }

            var keepsakeGroups = groups.map(function (g) {
                return {
                    id:             g.id,
                    customName:     g.customName    || null,
                    chosenTypeId:   g.chosenTypeId  || null,
                    messageIds:     g.messages.map(function (m) { return m.id || null; }),
                    messageIndices: g.messageIndices || []
                };
            });

            return KMEngine.ProjectSession.create({
                id:                opts.id,
                memories:          memories,
                selectedMemoryIds: selectedIds,
                keepsakeGroups:    keepsakeGroups
            });
        }
    };
}());
