(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var MAX_TOP = 10;

    function extractWords(text) {
        if (typeof text !== 'string' || !text.trim()) return [];
        var raw = text.split(/\s+/);
        var result = [];
        for (var i = 0; i < raw.length; i++) {
            var w = raw[i].replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
            if (w) result.push(w);
        }
        return result;
    }

    function compute(memories) {
        var zero = { totalWords: 0, avgWordsPerMessage: 0, topWords: [], topWordSender: null };
        if (!Array.isArray(memories) || memories.length === 0) return zero;

        var wordCount = {};
        var senderWordCount = {};
        var total = 0;
        var msgCount = 0;

        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.type === 'attachment-placeholder' || m.isAttachmentOnly === true) continue;
            var text = (typeof m.text === 'string') ? m.text : '';
            var words = extractWords(text);
            if (words.length === 0) continue;

            msgCount++;
            var sender = (typeof m.sender === 'string' && m.sender.trim()) ? m.sender : null;

            for (var j = 0; j < words.length; j++) {
                var w = words[j];
                wordCount[w] = (wordCount[w] || 0) + 1;
                total++;
                if (sender) {
                    senderWordCount[sender] = (senderWordCount[sender] || 0) + 1;
                }
            }
        }

        if (total === 0) return zero;

        var sorted = Object.keys(wordCount)
            .map(function (w) { return { word: w, count: wordCount[w] }; })
            .sort(function (a, b) {
                if (b.count !== a.count) return b.count - a.count;
                return a.word < b.word ? -1 : a.word > b.word ? 1 : 0;
            });

        var topWords = sorted.slice(0, MAX_TOP).map(function (item, idx) {
            return { word: item.word, count: item.count, rank: idx + 1 };
        });

        var topWordSender = null;
        var senders = Object.keys(senderWordCount);
        if (senders.length > 0) {
            var best = { sender: senders[0], wordCount: senderWordCount[senders[0]] };
            for (var k = 1; k < senders.length; k++) {
                var s = senders[k];
                var c = senderWordCount[s];
                if (c > best.wordCount || (c === best.wordCount && s < best.sender)) {
                    best = { sender: s, wordCount: c };
                }
            }
            topWordSender = best;
        }

        var avg = Math.round((total / msgCount) * 10) / 10;

        return {
            totalWords:         total,
            avgWordsPerMessage: avg,
            topWords:           topWords,
            topWordSender:      topWordSender
        };
    }

    KMEngine.WordAnalysis = { compute: compute };
}());
