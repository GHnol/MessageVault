(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var MAX_EXAMPLES = 3;

    var PHONE_RE = /^[+\-.\s()]*\d[\d\s().\-]{5,}\d\s*$/;
    var URL_RE   = /https?:\/\/\S+/i;

    function compute(memories) {
        if (!Array.isArray(memories) || memories.length === 0) return [];

        var issues = [];

        // PHONE_NUMBER_AS_SENDER_NAME
        var phoneSenders = {};
        var phoneExamples = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            var sender = typeof m.sender === 'string' ? m.sender.trim() : '';
            if (sender && PHONE_RE.test(sender) && !phoneSenders[sender]) {
                phoneSenders[sender] = true;
                if (phoneExamples.length < MAX_EXAMPLES) phoneExamples.push(sender);
            }
        }
        var phoneCount = Object.keys(phoneSenders).length;
        if (phoneCount > 0) {
            issues.push({
                type:     'PHONE_NUMBER_AS_SENDER_NAME',
                severity: 'WARN',
                count:    phoneCount,
                examples: phoneExamples,
                message:  phoneCount + ' sender name' + (phoneCount === 1 ? '' : 's') + ' look like phone numbers'
            });
        }

        // RAW_URL_IN_CONTENT
        var urlCount = 0;
        var urlExamples = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            var text = typeof m.text === 'string' ? m.text : '';
            if (URL_RE.test(text)) {
                urlCount++;
                if (urlExamples.length < MAX_EXAMPLES) {
                    var match = text.match(URL_RE);
                    if (match) urlExamples.push(match[0]);
                }
            }
        }
        if (urlCount > 0) {
            issues.push({
                type:     'RAW_URL_IN_CONTENT',
                severity: 'WARN',
                count:    urlCount,
                examples: urlExamples,
                message:  urlCount + ' message' + (urlCount === 1 ? '' : 's') + ' contain raw URLs'
            });
        }

        // EMPTY_MESSAGE
        var emptyCount = 0;
        var emptyExamples = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.isAttachmentOnly) continue;
            if (m.type === 'attachment-placeholder') continue;
            var text = typeof m.text === 'string' ? m.text.trim() : '';
            if (!text) {
                emptyCount++;
                if (emptyExamples.length < MAX_EXAMPLES) {
                    emptyExamples.push(typeof m.sender === 'string' && m.sender ? m.sender : '(unknown)');
                }
            }
        }
        if (emptyCount > 0) {
            issues.push({
                type:     'EMPTY_MESSAGE',
                severity: 'WARN',
                count:    emptyCount,
                examples: emptyExamples,
                message:  emptyCount + ' message' + (emptyCount === 1 ? '' : 's') + ' with no text or content'
            });
        }

        // DUPLICATE_MESSAGE — adjacent only, same sender, identical non-empty text
        var dupCount = 0;
        var dupExamples = [];
        for (var i = 1; i < memories.length; i++) {
            var prev = memories[i - 1];
            var curr = memories[i];
            if (!prev || !curr || typeof prev !== 'object' || typeof curr !== 'object') continue;
            var prevText = typeof prev.text === 'string' ? prev.text.trim() : null;
            var currText = typeof curr.text === 'string' ? curr.text.trim() : null;
            if (prevText && currText && prevText === currText &&
                    typeof prev.sender === 'string' && prev.sender === curr.sender) {
                dupCount++;
                if (dupExamples.length < MAX_EXAMPLES) {
                    dupExamples.push(currText.length > 50 ? currText.substring(0, 47) + '…' : currText);
                }
            }
        }
        if (dupCount > 0) {
            issues.push({
                type:     'DUPLICATE_MESSAGE',
                severity: 'WARN',
                count:    dupCount,
                examples: dupExamples,
                message:  dupCount + ' adjacent duplicate message' + (dupCount === 1 ? '' : 's') + ' from the same sender'
            });
        }

        // SYSTEM_MESSAGE_IN_OUTPUT — senderRole system or well-known system text
        var SYSTEM_TEXT_RE = /Messages and calls are end-to-end encrypted|This message was deleted|You deleted this message/i;
        var sysCount = 0;
        var sysExamples = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            var isSys = m.senderRole === 'system';
            if (!isSys) {
                var text = typeof m.text === 'string' ? m.text : '';
                isSys = SYSTEM_TEXT_RE.test(text);
            }
            if (isSys) {
                sysCount++;
                if (sysExamples.length < MAX_EXAMPLES) {
                    var t = typeof m.text === 'string' ? m.text.trim() : '';
                    sysExamples.push(t.length > 50 ? t.substring(0, 47) + '…' : t);
                }
            }
        }
        if (sysCount > 0) {
            issues.push({
                type:     'SYSTEM_MESSAGE_IN_OUTPUT',
                severity: 'WARN',
                count:    sysCount,
                examples: sysExamples,
                message:  sysCount + ' possible system message' + (sysCount === 1 ? '' : 's') + ' in output'
            });
        }

        // HIGH_ATTACHMENT_RATIO — >80% of messages are attachment-only
        var attachCount = 0;
        var attachExamples = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.isAttachmentOnly || m.type === 'attachment-placeholder') {
                attachCount++;
                if (attachExamples.length < MAX_EXAMPLES) {
                    var s = typeof m.sender === 'string' && m.sender ? m.sender : '(unknown)';
                    attachExamples.push(s);
                }
            }
        }
        if (attachCount > 0 && attachCount / memories.length > 0.8) {
            var attachPct = Math.round(attachCount / memories.length * 100);
            issues.push({
                type:     'HIGH_ATTACHMENT_RATIO',
                severity: 'WARN',
                count:    attachCount,
                examples: attachExamples,
                message:  attachCount + ' of ' + memories.length + ' messages are attachment-only (' + attachPct + '%)'
            });
        }

        // VERY_LONG_CONTENT — text.length > 1000, skip attachment-only
        var longCount = 0;
        var longExamples = [];
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.isAttachmentOnly || m.type === 'attachment-placeholder') continue;
            var text = typeof m.text === 'string' ? m.text : '';
            if (text.length > 1000) {
                longCount++;
                if (longExamples.length < MAX_EXAMPLES) {
                    longExamples.push(text.substring(0, 47) + '…');
                }
            }
        }
        if (longCount > 0) {
            issues.push({
                type:     'VERY_LONG_CONTENT',
                severity: 'WARN',
                count:    longCount,
                examples: longExamples,
                message:  longCount + ' message' + (longCount === 1 ? '' : 's') + ' with text longer than 1 000 characters'
            });
        }

        // SHORT_CONVERSATION — fewer than 10 total messages
        if (memories.length < 10) {
            issues.push({
                type:     'SHORT_CONVERSATION',
                severity: 'WARN',
                count:    memories.length,
                examples: [],
                message:  memories.length + ' message' + (memories.length === 1 ? '' : 's') + ' in corpus — fewer than 10'
            });
        }

        // SINGLE_SENDER_DOMINANT — all non-system messages from exactly 1 unique sender
        var nonSystemSenders = {};
        var nonSystemCount = 0;
        for (var i = 0; i < memories.length; i++) {
            var m = memories[i];
            if (!m || typeof m !== 'object') continue;
            if (m.senderRole === 'system') continue;
            nonSystemCount++;
            var sender = typeof m.sender === 'string' ? m.sender : '';
            nonSystemSenders[sender] = true;
        }
        var senderKeys = Object.keys(nonSystemSenders);
        if (nonSystemCount > 0 && senderKeys.length === 1) {
            issues.push({
                type:     'SINGLE_SENDER_DOMINANT',
                severity: 'WARN',
                count:    nonSystemCount,
                examples: [senderKeys[0]],
                message:  'All messages are from 1 sender (' + senderKeys[0] + ')'
            });
        }

        return issues;
    }

    KMEngine.ContentQualityChecks = {
        compute: compute
    };
}());
