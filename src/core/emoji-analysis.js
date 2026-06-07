(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var MAX_TOP = 5;

    function extractEmojis(text) {
        if (typeof text !== 'string' || !text) return [];
        try {
            var re = new RegExp(
                '(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}|\\p{Extended_Pictographic}\\uFE0F?)' +
                '(?:\\u200D(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}|\\p{Extended_Pictographic}\\uFE0F?))*' +
                '|[#*0-9]\\uFE0F?\\u20E3' +
                '|\\p{Regional_Indicator}\\p{Regional_Indicator}',
                'gu'
            );
            return text.match(re) || [];
        } catch (e) {
            return [];
        }
    }

    function compute(memories) {
        var zero = { topEmojis: [], totalEmojiCount: 0, uniqueEmojiCount: 0, mostEmojifiedSender: null };
        if (!Array.isArray(memories) || memories.length === 0) return zero;

        var emojiCount = {};
        var senderEmojiCount = {};
        var total = 0;

        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            var text = (typeof m.text === 'string') ? m.text : '';
            var emojis = extractEmojis(text);
            var sender = (typeof m.sender === 'string' && m.sender.trim()) ? m.sender : null;

            for (var j = 0; j < emojis.length; j++) {
                var e = emojis[j];
                emojiCount[e] = (emojiCount[e] || 0) + 1;
                total++;
                if (sender) {
                    senderEmojiCount[sender] = (senderEmojiCount[sender] || 0) + 1;
                }
            }
        }

        if (total === 0) return zero;

        var sorted = Object.keys(emojiCount)
            .map(function (e) { return { emoji: e, count: emojiCount[e] }; })
            .sort(function (a, b) {
                if (b.count !== a.count) return b.count - a.count;
                return a.emoji < b.emoji ? -1 : a.emoji > b.emoji ? 1 : 0;
            });

        var topEmojis = sorted.slice(0, MAX_TOP).map(function (item, idx) {
            return { emoji: item.emoji, count: item.count, rank: idx + 1 };
        });

        var mostEmojifiedSender = null;
        var senders = Object.keys(senderEmojiCount);
        if (senders.length > 0) {
            var best = { sender: senders[0], count: senderEmojiCount[senders[0]] };
            for (var k = 1; k < senders.length; k++) {
                var s = senders[k];
                var c = senderEmojiCount[s];
                if (c > best.count || (c === best.count && s < best.sender)) {
                    best = { sender: s, count: c };
                }
            }
            mostEmojifiedSender = best;
        }

        return {
            topEmojis:           topEmojis,
            totalEmojiCount:     total,
            uniqueEmojiCount:    Object.keys(emojiCount).length,
            mostEmojifiedSender: mostEmojifiedSender
        };
    }

    KMEngine.EmojiAnalysis = { compute: compute };
}());
