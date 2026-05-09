(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    function makeResult(productId, eligible, opts) {
        opts = opts || {};
        return {
            productId:          productId,
            eligible:           eligible,
            score:              opts.score              || 0,
            blockers:           opts.blockers           || [],
            warnings:           opts.warnings           || [],
            suggestions:        opts.suggestions        || [],
            requiredContent:    opts.requiredContent    || [],
            supportedContent:   opts.supportedContent   || [],
            unsupportedContent: opts.unsupportedContent || [],
            readinessNotes:     opts.readinessNotes     || []
        };
    }

    function countText(msgs) {
        return msgs.reduce(function (s, m) { return s + (m.text || '').length; }, 0);
    }

    function hasAttachments(msgs) {
        return msgs.some(function (m) { return m.isAttachmentOnly || m.type === 'attachment-placeholder'; });
    }

    function uniqueSenderCount(msgs) {
        var seen = {};
        var n = 0;
        for (var i = 0; i < msgs.length; i++) {
            var s = msgs[i].sender;
            if (s && !seen[s]) { seen[s] = true; n++; }
        }
        return n;
    }

    function evaluateMessageBook(group) {
        var msgs = group.messages || [];
        var blockers = [], warnings = [], suggestions = [];

        if (msgs.length === 0) {
            blockers.push('Group has no messages.');
            return makeResult('message-book', false, {
                blockers:      blockers,
                readinessNotes: ['Software: supported (flagship). Commerce and manufacturing not yet ready.']
            });
        }

        var textMsgs = msgs.filter(function (m) { return m.text && m.text.trim() && !m.isAttachmentOnly; });
        if (textMsgs.length === 0) {
            blockers.push('No readable text messages found. Message Book requires text content.');
        }

        if (hasAttachments(msgs)) {
            warnings.push('Some messages are attachment-only and will not appear in the book.');
        }

        if (uniqueSenderCount(msgs) === 0) {
            warnings.push('No sender data found. Section headers may be incomplete.');
        }

        if (!msgs.some(function (m) { return m.timestamp; })) {
            suggestions.push('Add timestamp data for richer section headers.');
        }

        var score = 0;
        if (blockers.length === 0) {
            score = Math.min(100, 50 + Math.min(40, textMsgs.length * 2) + (msgs.some(function (m) { return m.timestamp; }) ? 10 : 0));
        }

        return makeResult('message-book', blockers.length === 0, {
            score:            score,
            blockers:         blockers,
            warnings:         warnings,
            suggestions:      suggestions,
            supportedContent:   ['text'],
            unsupportedContent: hasAttachments(msgs) ? ['attachment-only messages'] : [],
            readinessNotes:   ['Software: supported (flagship). Commerce and manufacturing not yet ready.']
        });
    }

    function evaluateJournal(group) {
        var msgs = group.messages || [];
        var blockers = [], warnings = [], suggestions = [];

        if (msgs.length === 0) {
            blockers.push('Group has no messages.');
        }

        var textCount = msgs.filter(function (m) { return m.text && m.text.trim(); }).length;
        if (msgs.length > 0 && textCount === 0) {
            blockers.push('Journal requires text content.');
        }

        if (msgs.length > 0 && msgs.length < 10) {
            suggestions.push('Journal works best with at least 10 messages.');
        }

        return makeResult('journal', blockers.length === 0, {
            score:          blockers.length === 0 ? Math.min(100, 40 + textCount * 2) : 0,
            blockers:       blockers,
            warnings:       warnings,
            suggestions:    suggestions,
            readinessNotes: ['Product-line-supported only. No renderer. Not commerce or manufacturing ready.']
        });
    }

    function evaluateMug(group) {
        var msgs = group.messages || [];
        var blockers = [], warnings = [], suggestions = [];

        if (msgs.length === 0) {
            blockers.push('Group has no messages.');
        }

        var totalChars = countText(msgs);
        var maxSingle = msgs.length > 0
            ? Math.max.apply(null, msgs.map(function (m) { return (m.text || '').length; }))
            : 0;

        if (msgs.length > 3) {
            blockers.push('Too many messages for a mug. Works best with 1–3 short messages.');
        }
        if (totalChars > 80) {
            blockers.push('Too much text for mug. Total text must be under 80 characters.');
        } else if (totalChars > 50) {
            warnings.push('Text may be too long for comfortable mug display.');
        }
        if (maxSingle > 60) {
            warnings.push('At least one message exceeds the recommended length for a mug.');
        }
        if (hasAttachments(msgs)) {
            warnings.push('Attachment content cannot be printed on a mug surface.');
        }

        if (blockers.length === 0 && msgs.length >= 1 && totalChars <= 60) {
            suggestions.push('Great fit for a mug — short and punchy.');
        } else if (blockers.length === 0) {
            suggestions.push('Consider trimming messages for a better mug fit.');
        }

        var score = 0;
        if (blockers.length === 0) {
            var lenScore   = totalChars <= 40 ? 40 : totalChars <= 80 ? 25 : 10;
            var countScore = msgs.length === 1 ? 30 : msgs.length === 2 ? 25 : 15;
            score = lenScore + countScore;
        }

        return makeResult('mug', blockers.length === 0, {
            score:          score,
            blockers:       blockers,
            warnings:       warnings,
            suggestions:    suggestions,
            readinessNotes: ['Product-line-supported only. No renderer. Not commerce or manufacturing ready.']
        });
    }

    function evaluateStickerPack(group) {
        var msgs = group.messages || [];
        var blockers = [], warnings = [], suggestions = [];

        if (msgs.length === 0) {
            blockers.push('Group has no messages.');
        }

        var shortMsgs = msgs.filter(function (m) { return (m.text || '').length > 0 && (m.text || '').length <= 50; });
        var longMsgs  = msgs.filter(function (m) { return (m.text || '').length > 80; });

        if (msgs.length > 12) {
            warnings.push('Very large sticker packs may be harder to produce. Consider splitting into sets.');
        }
        if (longMsgs.length > 0) {
            warnings.push(longMsgs.length + ' message(s) are too long for a sticker. Short phrases work best.');
        }
        if (msgs.length < 4) {
            suggestions.push('Sticker pack works best with at least 4 short messages.');
        }
        if (shortMsgs.length >= 4) {
            suggestions.push('Multiple short phrases detected — good fit for sticker pack.');
        }

        return makeResult('sticker-pack', blockers.length === 0, {
            score:          blockers.length === 0 ? Math.min(80, shortMsgs.length * 12) : 0,
            blockers:       blockers,
            warnings:       warnings,
            suggestions:    suggestions,
            readinessNotes: ['Product-line-supported only. No renderer. Not commerce or manufacturing ready.']
        });
    }

    function evaluateWallArt(group) {
        var msgs = group.messages || [];
        var blockers = [], warnings = [], suggestions = [];

        if (msgs.length === 0) {
            blockers.push('Group has no messages.');
        }
        if (msgs.length > 5) {
            blockers.push('Wall Art works best with 1–5 impactful messages.');
        }

        var textMsgs = msgs.filter(function (m) { return m.text && m.text.trim(); });
        if (msgs.length > 0 && msgs.length <= 5 && textMsgs.length === 0) {
            blockers.push('Wall Art requires text content.');
        }

        var substantialMsgs = textMsgs.filter(function (m) { return (m.text || '').length >= 20; });
        if (textMsgs.length > 0 && substantialMsgs.length === 0) {
            suggestions.push('Wall Art works best with messages of at least 20 characters.');
        }

        return makeResult('wall-art', blockers.length === 0, {
            score:          blockers.length === 0 ? Math.min(70, 30 + substantialMsgs.length * 15) : 0,
            blockers:       blockers,
            warnings:       warnings,
            suggestions:    suggestions,
            readinessNotes: ['Product-line-supported only. No renderer. Not commerce or manufacturing ready.']
        });
    }

    function evaluateGiftWrap(group) {
        var msgs = group.messages || [];
        var blockers = [], warnings = [], suggestions = [];

        if (msgs.length === 0) {
            blockers.push('Group has no messages.');
        }
        if (msgs.length > 8) {
            warnings.push('Gift wrap works best with 1–8 short messages.');
        }

        var totalChars = countText(msgs);
        if (totalChars > 200) {
            warnings.push('Total text may be too long for gift wrap display.');
        }

        if (msgs.length >= 1 && msgs.length <= 8 && totalChars <= 150) {
            suggestions.push('Good fit for gift wrap — short and warm.');
        }

        return makeResult('gift-wrap', blockers.length === 0, {
            score:          blockers.length === 0 ? Math.min(60, 20 + msgs.length * 5 + (totalChars <= 80 ? 20 : 0)) : 0,
            blockers:       blockers,
            warnings:       warnings,
            suggestions:    suggestions,
            readinessNotes: ['Product-line-supported only. No renderer. Not commerce or manufacturing ready.']
        });
    }

    var EVALUATORS = {
        'message-book': evaluateMessageBook,
        'journal':      evaluateJournal,
        'mug':          evaluateMug,
        'sticker-pack': evaluateStickerPack,
        'wall-art':     evaluateWallArt,
        'gift-wrap':    evaluateGiftWrap
    };

    KMEngine.ProductEligibility = {
        makeResult:  makeResult,

        evaluate: function (group, productId) {
            var fn = EVALUATORS[productId];
            if (!fn) {
                return makeResult(productId, false, {
                    blockers: ['Unknown product ID: ' + productId]
                });
            }
            return fn(group);
        },

        evaluateAll: function (group) {
            return Object.keys(EVALUATORS).map(function (id) {
                return EVALUATORS[id](group);
            });
        }
    };
}());
