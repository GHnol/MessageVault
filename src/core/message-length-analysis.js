(function () {
    'use strict';

    var ZERO_STATE = {
        avgCharsPerMessage: 0,
        longestMessage: null,
        perSenderStats: [],
    };

    function compute(memories) {
        if (!Array.isArray(memories) || memories.length === 0) return ZERO_STATE;

        var total = 0;
        var msgCount = 0;
        var longestLen = -1;
        var longestSender = null;
        var senderChars = Object.create(null);
        var senderCount = Object.create(null);

        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.senderRole === 'system') continue;
            if (m.isAttachmentOnly === true) continue;
            if (m.type === 'attachment-placeholder') continue;
            if (typeof m.text !== 'string' || !m.text.trim()) continue;

            var len = m.text.length;
            var sender = (typeof m.sender === 'string') ? m.sender : '';

            total += len;
            msgCount++;

            if (len > longestLen) {
                longestLen = len;
                longestSender = sender;
            }

            senderChars[sender] = (senderChars[sender] || 0) + len;
            senderCount[sender] = (senderCount[sender] || 0) + 1;
        }

        if (msgCount === 0) return ZERO_STATE;

        var avgCharsPerMessage = Math.round((total / msgCount) * 10) / 10;

        var longestMessage = { sender: longestSender, length: longestLen };

        var perSenderStats = Object.keys(senderChars)
            .map(function (s) {
                var avg = Math.round((senderChars[s] / senderCount[s]) * 10) / 10;
                return { sender: s, avgCharsPerMessage: avg, messageCount: senderCount[s] };
            })
            .sort(function (a, b) {
                if (b.avgCharsPerMessage !== a.avgCharsPerMessage) return b.avgCharsPerMessage - a.avgCharsPerMessage;
                return a.sender < b.sender ? -1 : a.sender > b.sender ? 1 : 0;
            });

        return { avgCharsPerMessage: avgCharsPerMessage, longestMessage: longestMessage, perSenderStats: perSenderStats };
    }

    window.KMEngine = window.KMEngine || {};
    window.KMEngine.MessageLengthAnalysis = { compute: compute };
})();
