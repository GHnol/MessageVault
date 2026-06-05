(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'facebook-messenger-json-v1';
    var PLATFORM_ID     = 'facebook-messenger';
    var ADAPTER_VERSION = '1';

    // Decode common HTML character references found in Facebook Messenger JSON exports.
    // &amp; must be last to avoid double-decoding (e.g. &amp;lt; → &lt; not <).
    function decodeEntities(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&#x([0-9a-fA-F]+);/g, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); })
            .replace(/&#([0-9]+);/g,         function (_, dec) { return String.fromCharCode(parseInt(dec, 10)); })
            .replace(/&apos;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g,   '<')
            .replace(/&gt;/g,   '>')
            .replace(/&amp;/g,  '&');
    }

    // Returns true when a message object has any media attachment.
    function hasMedia(msg) {
        return (Array.isArray(msg.photos)      && msg.photos.length      > 0) ||
               (Array.isArray(msg.videos)      && msg.videos.length      > 0) ||
               (Array.isArray(msg.audio_files) && msg.audio_files.length > 0) ||
               (Array.isArray(msg.gifs)        && msg.gifs.length        > 0) ||
               (Array.isArray(msg.files)       && msg.files.length       > 0) ||
               (msg.sticker != null);
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'Facebook Messenger JSON Export v1',

        // Returns true for a Facebook Messenger thread JSON file.
        // Discriminator: the root-level "magic_words" array is present in all
        // Facebook Messenger exports but absent from Instagram DM exports.
        canHandle: function (input) {
            if (typeof input !== 'string' || !input.trim()) return false;
            if (input.indexOf('"participants"') === -1) return false;
            if (input.indexOf('"messages"')     === -1) return false;
            if (input.indexOf('"timestamp_ms"') === -1) return false;
            if (input.indexOf('"magic_words"')  === -1) return false;
            var parsed;
            try { parsed = JSON.parse(input); } catch (e) { return false; }
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
            if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.messages)) return false;
            if (!Array.isArray(parsed.magic_words)) return false;
            for (var i = 0; i < parsed.messages.length; i++) {
                if (typeof parsed.messages[i].timestamp_ms === 'number') return true;
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

                if (msg.is_unsent === true) {
                    warnings.push({ index: i, message: 'Unsent message skipped (is_unsent: true)' });
                    continue;
                }

                var rawSender = msg.sender_name;
                if (typeof rawSender !== 'string' || !rawSender.trim()) {
                    warnings.push({ index: i, message: 'Message skipped — missing sender_name' });
                    continue;
                }

                var sender = decodeEntities(rawSender.trim());
                var ts     = typeof msg.timestamp_ms === 'number'
                    ? new Date(msg.timestamp_ms).toISOString()
                    : null;

                var isMedia  = hasMedia(msg);
                var isShare  = msg.share != null && !Array.isArray(msg.share);
                var isAttach = isMedia || isShare;

                var rawContent = (typeof msg.content === 'string') ? msg.content : '';
                var text       = isAttach ? '[Attachment]' : (decodeEntities(rawContent) || null);
                var memType    = isAttach ? 'attachment-placeholder' : 'message';

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

    KMEngine.facebookMessengerAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
