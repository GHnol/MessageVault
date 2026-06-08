(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'instagram-dm-json-v1';
    var PLATFORM_ID     = 'instagram-dm';
    var ADAPTER_VERSION = '1';

    // Decode common HTML character references found in Instagram DM JSON exports.
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

    // Meta exports store reaction emoji as Latin-1-escaped UTF-8 bytes (mojibake).
    // Re-decode to a proper glyph; preserve the raw string if the byte sequence is
    // incomplete or decoding throws — never drop the reaction.
    function decodeReaction(str) {
        if (typeof str !== 'string' || !str) return str;
        var needsDecode = false;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c >= 0x80 && c <= 0xFF) { needsDecode = true; break; }
        }
        if (!needsDecode) return str;
        try {
            return decodeURIComponent(escape(str));
        } catch (e) {
            return str;
        }
    }

    // Map Meta reaction objects { reaction, actor } to the canonical
    // NormalizedMemory reaction shape { reactor, emoji, label }.
    function mapReactions(rawReactions) {
        if (!Array.isArray(rawReactions)) return [];
        var out = [];
        for (var i = 0; i < rawReactions.length; i++) {
            var r = rawReactions[i];
            if (!r || typeof r !== 'object') continue;
            var hasReaction = typeof r.reaction === 'string';
            var hasActor    = typeof r.actor === 'string' && r.actor.trim() !== '';
            if (!hasReaction && !hasActor) continue;
            out.push({
                reactor: hasActor ? r.actor.trim() : null,
                emoji:   hasReaction ? decodeReaction(r.reaction) : null,
                label:   null
            });
        }
        return out;
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'Instagram DM JSON Export v1',

        // Returns true for a single Instagram DM thread JSON file.
        // Detects: top-level object with participants array, messages array,
        // and at least one message carrying a numeric timestamp_ms.
        canHandle: function (input) {
            if (typeof input !== 'string' || !input.trim()) return false;
            // Quick string probes before full parse to fail fast on large non-Instagram files.
            if (input.indexOf('"participants"') === -1) return false;
            if (input.indexOf('"messages"')     === -1) return false;
            if (input.indexOf('"timestamp_ms"') === -1) return false;
            var parsed;
            try { parsed = JSON.parse(input); } catch (e) { return false; }
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
            if (!Array.isArray(parsed.participants) || !Array.isArray(parsed.messages)) return false;
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
                    reactions:        mapReactions(msg.reactions),
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

    KMEngine.instagramDmAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
