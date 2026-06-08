(function () {
    'use strict';

    var GAP_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours — gap that starts a new conversation

    var ZERO_STATE = {
        totalConversations: 0,
        topInitiator: null,
        perSenderStats: [],
    };

    function compute(memories) {
        if (!Array.isArray(memories) || memories.length === 0) return ZERO_STATE;

        var valid = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.senderRole === 'system') continue;
            if (!m.timestamp) continue;
            var t = new Date(m.timestamp).getTime();
            if (isNaN(t)) continue;
            valid.push({ sender: (typeof m.sender === 'string') ? m.sender : '', t: t });
        }

        if (valid.length === 0) return ZERO_STATE;

        valid.sort(function (a, b) { return a.t - b.t; });

        var senderCounts = Object.create(null);
        var totalConversations = 0;

        for (var j = 0; j < valid.length; j++) {
            var isStart = (j === 0) || ((valid[j].t - valid[j - 1].t) >= GAP_THRESHOLD_MS);
            if (!isStart) continue;
            var s = valid[j].sender;
            senderCounts[s] = (senderCounts[s] || 0) + 1;
            totalConversations++;
        }

        var perSenderStats = Object.keys(senderCounts)
            .map(function (sender) {
                var count = senderCounts[sender];
                var pct = Math.round((count / totalConversations) * 100 * 10) / 10;
                return { sender: sender, initiationCount: count, initiationPct: pct };
            })
            .sort(function (a, b) {
                if (b.initiationCount !== a.initiationCount) return b.initiationCount - a.initiationCount;
                return a.sender < b.sender ? -1 : a.sender > b.sender ? 1 : 0;
            });

        var topInitiator = perSenderStats.length > 0
            ? { sender: perSenderStats[0].sender, initiationCount: perSenderStats[0].initiationCount }
            : null;

        return { totalConversations: totalConversations, topInitiator: topInitiator, perSenderStats: perSenderStats };
    }

    window.KMEngine = window.KMEngine || {};
    window.KMEngine.ConversationInitiation = { compute: compute };
})();
