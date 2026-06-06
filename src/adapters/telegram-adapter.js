(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'telegram-json-v1';
    var PLATFORM_ID     = 'telegram';
    var ADAPTER_VERSION = '1';

    // Telegram's text field is either a plain string or an array of items
    // that are bare strings or {type, text} objects. Concatenate to plain text.
    function extractText(text) {
        if (typeof text === 'string') return text;
        if (!Array.isArray(text)) return '';
        var out = '';
        for (var i = 0; i < text.length; i++) {
            var item = text[i];
            if (typeof item === 'string') {
                out += item;
            } else if (item && typeof item.text === 'string') {
                out += item.text;
            }
        }
        return out;
    }

    // Returns true when a message has any media attachment.
    function hasMedia(msg) {
        return (typeof msg.photo      === 'string' && msg.photo.length > 0) ||
               (typeof msg.file       === 'string' && msg.file.length  > 0) ||
               (msg.media_type != null);
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'Telegram Desktop JSON Export v1',

        // Returns true for a Telegram Desktop JSON export.
        // Positive discriminators: from_id and date_unixtime are unique to
        // Telegram among current adapters — Instagram DM and Facebook Messenger
        // use sender_name and timestamp_ms instead.
        // Negative discriminators: participants (IG/FB) and magic_words (FB)
        // are absent from Telegram exports.
        canHandle: function (input) {
            if (typeof input !== 'string' || !input.trim()) return false;
            if (input.indexOf('"messages"')      === -1) return false;
            if (input.indexOf('"from_id"')       === -1) return false;
            if (input.indexOf('"date_unixtime"') === -1) return false;
            if (input.indexOf('"participants"')  !== -1) return false;
            if (input.indexOf('"magic_words"')   !== -1) return false;
            var parsed;
            try { parsed = JSON.parse(input); } catch (e) { return false; }
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
            if (!Array.isArray(parsed.messages)) return false;
            for (var i = 0; i < parsed.messages.length; i++) {
                if (typeof parsed.messages[i].from_id === 'string') return true;
            }
            return false;
        },

        // Accepts the parsed messages array. Returns NormalizedMemory[].
        normalizeAll: function (parsedMessages) {
            if (!Array.isArray(parsedMessages)) {
                this._lastWarnings = [];
                return [];
            }

            var warnings   = [];
            var result     = [];
            var importedAt = new Date().toISOString();

            for (var i = 0; i < parsedMessages.length; i++) {
                var msg = parsedMessages[i];

                if (msg.type !== 'message') {
                    warnings.push({ index: i, message: 'Non-message entry skipped (type: ' + msg.type + ')' });
                    continue;
                }

                var rawFrom = msg.from;
                if (typeof rawFrom !== 'string' || !rawFrom.trim()) {
                    warnings.push({ index: i, message: 'Message skipped — missing or null from field' });
                    continue;
                }

                var sender   = rawFrom.trim();
                var rawUnix  = typeof msg.date_unixtime === 'string' ? parseInt(msg.date_unixtime, 10) : NaN;
                var ts       = !isNaN(rawUnix) ? new Date(rawUnix * 1000).toISOString() : null;
                var isAttach = hasMedia(msg);
                var rawText  = extractText(msg.text);
                var text     = isAttach ? '[Attachment]' : (rawText || null);
                var memType  = isAttach ? 'attachment-placeholder' : 'message';

                result.push(KMEngine.NormalizedMemory.create({
                    sourcePlatformId: PLATFORM_ID,
                    sourceAdapterId:  ADAPTER_ID,
                    importIndex:      i,
                    timestamp:        ts,
                    sender:           sender,
                    senderRole:       'contact',
                    text:             text,
                    reactions:        [],
                    isAttachmentOnly: isAttach,
                    type:             memType,
                    provenance:       { importedAt: importedAt, adapterVersion: ADAPTER_VERSION }
                }));
            }

            this._lastWarnings = warnings;
            return result;
        },

        import: function (rawText) {
            this._lastWarnings = [];

            if (typeof rawText !== 'string' || !rawText.trim()) {
                return KMEngine.createImportResult({
                    sourcePlatformId: PLATFORM_ID,
                    adapterVersion:   ADAPTER_VERSION,
                    rawCounts:        { total: 0, imported: 0, skipped: 0 }
                });
            }

            var parsed;
            try {
                parsed = JSON.parse(rawText);
            } catch (e) {
                this._lastWarnings = [{ index: -1, message: 'JSON parse error: ' + e.message }];
                return KMEngine.createImportResult({
                    sourcePlatformId: PLATFORM_ID,
                    adapterVersion:   ADAPTER_VERSION,
                    importWarnings:   this._lastWarnings,
                    rawCounts:        { total: 0, imported: 0, skipped: 0 }
                });
            }

            var messages = (parsed && Array.isArray(parsed.messages)) ? parsed.messages : [];
            var memories = this.normalizeAll(messages);
            var warnings = this._lastWarnings || [];

            var participants = [];
            var seen = {};
            for (var i = 0; i < memories.length; i++) {
                var s = memories[i].sender;
                if (s && !seen[s]) { seen[s] = true; participants.push(s); }
            }

            return KMEngine.createImportResult({
                memories:         memories,
                participants:     participants,
                sourcePlatformId: PLATFORM_ID,
                importWarnings:   warnings,
                rawCounts: {
                    total:    messages.length,
                    imported: memories.length,
                    skipped:  messages.length - memories.length
                },
                adapterVersion: ADAPTER_VERSION
            });
        },

        _lastWarnings: []
    };

    KMEngine.telegramAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
