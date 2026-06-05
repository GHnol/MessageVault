(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    function compute(memories) {
        var result = {
            totalMessages:               0,
            dateRange:                   { first: null, last: null, spanDays: null },
            uniqueSenderCount:           0,
            senderList:                  [],
            selfMessageCount:            0,
            contactMessageCount:         0,
            attachmentOnlyCount:         0,
            messagesWithReactionsCount:  0,
            totalReactionCount:          0,
            sourcePlatformId:            null,
            messagesWithoutTimestamp:    0,
            messagesWithoutText:         0
        };

        if (!Array.isArray(memories) || memories.length === 0) return result;

        result.totalMessages = memories.length;

        var seenSenders = {};
        var firstTs = null;
        var lastTs  = null;

        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;

            // sourcePlatformId — first valid memory wins
            if (result.sourcePlatformId === null && m.sourcePlatformId) {
                result.sourcePlatformId = m.sourcePlatformId;
            }

            // sender
            var sender = typeof m.sender === 'string' && m.sender ? m.sender : null;
            if (sender && !seenSenders[sender]) {
                seenSenders[sender] = true;
                result.senderList.push(sender);
            }
            if (m.senderRole === 'self') {
                result.selfMessageCount++;
            } else {
                result.contactMessageCount++;
            }

            // timestamp
            if (!m.timestamp) {
                result.messagesWithoutTimestamp++;
            } else {
                var ts = Date.parse(m.timestamp);
                if (!isNaN(ts)) {
                    if (firstTs === null || ts < firstTs) firstTs = ts;
                    if (lastTs  === null || ts > lastTs)  lastTs  = ts;
                } else {
                    result.messagesWithoutTimestamp++;
                }
            }

            // text
            if (!m.text) {
                result.messagesWithoutText++;
            }

            // attachment-only
            if (m.isAttachmentOnly) {
                result.attachmentOnlyCount++;
            }

            // reactions
            if (Array.isArray(m.reactions) && m.reactions.length > 0) {
                result.messagesWithReactionsCount++;
                result.totalReactionCount += m.reactions.length;
            }
        }

        result.uniqueSenderCount = result.senderList.length;

        if (firstTs !== null && lastTs !== null) {
            result.dateRange.first    = new Date(firstTs).toISOString();
            result.dateRange.last     = new Date(lastTs).toISOString();
            result.dateRange.spanDays = Math.round((lastTs - firstTs) / 86400000);
        }

        return result;
    }

    KMEngine.ImportQualityReport = {
        compute: compute
    };
}());
