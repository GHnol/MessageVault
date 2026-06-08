(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var MAX_TOP = 5;

    function topByCount(countMap, keyName) {
        var keys = Object.keys(countMap);
        if (keys.length === 0) return null;
        var bestName  = keys[0];
        var bestCount = countMap[keys[0]];
        for (var i = 1; i < keys.length; i++) {
            var k = keys[i];
            var c = countMap[k];
            if (c > bestCount || (c === bestCount && k < bestName)) {
                bestName  = k;
                bestCount = c;
            }
        }
        var out = {};
        out[keyName] = bestName;
        out.count    = bestCount;
        return out;
    }

    function compute(memories) {
        var zero = {
            totalReactions:        0,
            messagesWithReactions: 0,
            topReactionEmojis:     [],
            topReactor:            null,
            mostReactedToSender:   null
        };
        if (!Array.isArray(memories) || memories.length === 0) return zero;

        var emojiCount   = {};
        var reactorCount = {};
        var senderCount  = {};
        var total = 0;
        var messagesWithReactions = 0;

        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            var reactions = m.reactions;
            if (!Array.isArray(reactions) || reactions.length === 0) continue;

            var sender = (typeof m.sender === 'string' && m.sender.trim()) ? m.sender : null;
            var countedOnMessage = 0;

            for (var j = 0; j < reactions.length; j++) {
                var r = reactions[j];
                if (!r || typeof r !== 'object') continue;
                total++;
                countedOnMessage++;

                var emoji = (typeof r.emoji === 'string' && r.emoji.trim()) ? r.emoji : null;
                if (emoji) emojiCount[emoji] = (emojiCount[emoji] || 0) + 1;

                var reactor = (typeof r.reactor === 'string' && r.reactor.trim()) ? r.reactor : null;
                if (reactor) reactorCount[reactor] = (reactorCount[reactor] || 0) + 1;

                if (sender) senderCount[sender] = (senderCount[sender] || 0) + 1;
            }

            if (countedOnMessage > 0) messagesWithReactions++;
        }

        if (total === 0) return zero;

        var topReactionEmojis = Object.keys(emojiCount)
            .map(function (e) { return { emoji: e, count: emojiCount[e] }; })
            .sort(function (a, b) {
                if (b.count !== a.count) return b.count - a.count;
                return a.emoji < b.emoji ? -1 : a.emoji > b.emoji ? 1 : 0;
            })
            .slice(0, MAX_TOP)
            .map(function (item, idx) {
                return { emoji: item.emoji, count: item.count, rank: idx + 1 };
            });

        return {
            totalReactions:        total,
            messagesWithReactions: messagesWithReactions,
            topReactionEmojis:     topReactionEmojis,
            topReactor:            topByCount(reactorCount, 'reactor'),
            mostReactedToSender:   topByCount(senderCount, 'sender')
        };
    }

    KMEngine.ReactionAnalysis = { compute: compute };
}());
