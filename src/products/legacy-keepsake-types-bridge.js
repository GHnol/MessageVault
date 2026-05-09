(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    // Mirror of the KEEPSAKE_TYPES check logic from index.html.
    // This bridge does NOT modify or reference index.html's local KEEPSAKE_TYPES array.
    // It exists to expose the same eligibility decisions through the standard
    // ProductEligibility result shape, for engine-level use.
    var LEGACY_TYPES = [
        {
            id:    'quote-card',
            label: 'Quote Card',
            check: function (msgs) {
                if (msgs.length > 3) return { eligible: false, reason: 'works best with 1–3 messages' };
                var hasSubstantial = msgs.some(function (m) { return (m.text || '').length >= 12; });
                if (!hasSubstantial) return { eligible: false, reason: 'needs a more substantial message' };
                return { eligible: true };
            }
        },
        {
            id:    'framed-print',
            label: 'Framed Print',
            check: function (msgs) {
                if (msgs.length < 2) return { eligible: false, reason: 'needs at least 2 messages' };
                if (msgs.length > 8) return { eligible: false, reason: 'works best with fewer messages' };
                var totalChars = msgs.reduce(function (s, m) { return s + (m.text || '').length; }, 0);
                if (totalChars > 600) return { eligible: false, reason: 'too much text for a single print' };
                return { eligible: true };
            }
        },
        {
            id:    'mini-story',
            label: 'Mini Story',
            check: function (msgs) {
                if (msgs.length < 5) return { eligible: false, reason: 'needs at least 5 messages' };
                var totalChars = msgs.reduce(function (s, m) { return s + (m.text || '').length; }, 0);
                if (totalChars < 80) return { eligible: false, reason: 'needs more text to tell a story' };
                return { eligible: true };
            }
        },
        {
            id:    'conversation-page',
            label: 'Conversation Page',
            check: function (msgs) {
                if (msgs.length < 4) return { eligible: false, reason: 'needs at least 4 messages' };
                var senders = {};
                var senderCount = 0;
                for (var i = 0; i < msgs.length; i++) {
                    if (msgs[i].sender && !senders[msgs[i].sender]) {
                        senders[msgs[i].sender] = true;
                        senderCount++;
                    }
                }
                if (senderCount < 2) return { eligible: false, reason: 'needs messages from both sides' };
                return { eligible: true };
            }
        }
    ];

    var _byId = {};
    for (var _i = 0; _i < LEGACY_TYPES.length; _i++) {
        _byId[LEGACY_TYPES[_i].id] = LEGACY_TYPES[_i];
    }

    function _makeResult(productId, eligible, opts) {
        var pe = KMEngine.ProductEligibility;
        if (pe && pe.makeResult) return pe.makeResult(productId, eligible, opts);
        opts = opts || {};
        return {
            productId:          productId,
            eligible:           eligible,
            score:              opts.score              || 0,
            blockers:           opts.blockers           || [],
            warnings:           opts.warnings           || [],
            suggestions:        opts.suggestions        || [],
            requiredContent:    [],
            supportedContent:   [],
            unsupportedContent: [],
            readinessNotes:     opts.readinessNotes     || []
        };
    }

    KMEngine.LegacyKeepsakeTypesBridge = {
        getTypes: function () { return LEGACY_TYPES.slice(); },

        // Evaluate a group against all 4 legacy types.
        // Returns results in the standard ProductEligibility result shape.
        evaluateAll: function (group) {
            var msgs = group.messages || [];
            return LEGACY_TYPES.map(function (t) {
                var r = t.check(msgs);
                return _makeResult(t.id, r.eligible, {
                    blockers:      r.eligible ? [] : [r.reason || 'Not eligible'],
                    readinessNotes: ['Standalone composition type. Not a physical product.']
                });
            });
        },

        evaluate: function (group, typeId) {
            var t = _byId[typeId];
            if (!t) {
                return _makeResult(typeId, false, {
                    blockers: ['Unknown legacy type: ' + typeId]
                });
            }
            var msgs = group.messages || [];
            var r = t.check(msgs);
            return _makeResult(t.id, r.eligible, {
                blockers:      r.eligible ? [] : [r.reason || 'Not eligible'],
                readinessNotes: ['Standalone composition type. Not a physical product.']
            });
        }
    };
}());
