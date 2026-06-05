(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'whatsapp-txt-v1';
    var PLATFORM_ID     = 'whatsapp';
    var ADAPTER_VERSION = '1';

    // Bracket format: [M/D/YY, H:MM:SS AM] Sender: text
    // Hyphen format:  M/D/YY, H:MM AM - Sender: text
    var BRACKET_RE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM))\]\s*/i;
    var HYPHEN_RE  = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*/i;
    var MEDIA_RE   = /^(<Media omitted>|image omitted|video omitted|audio omitted|sticker omitted|GIF omitted)$/i;

    function firstNonEmptyLine(text) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim()) return lines[i].trim();
        }
        return '';
    }

    function tryParseTimestamp(raw) {
        try {
            var d = new Date(raw);
            if (!isNaN(d.getTime())) return d.toISOString();
        } catch (e) {}
        return raw;
    }

    function parseLines(rawText) {
        var lines    = rawText.split('\n');
        var messages = [];
        var current  = null;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var bm   = BRACKET_RE.exec(line);
            var hm   = !bm && HYPHEN_RE.exec(line);

            if (bm || hm) {
                if (current) messages.push(current);
                var rawTs    = bm ? bm[1] : hm[1];
                var rest     = bm ? line.slice(bm[0].length) : line.slice(hm[0].length);
                var colonIdx = rest.indexOf(': ');
                var isSystem = colonIdx === -1;
                current = {
                    rawTs:     rawTs,
                    timestamp: tryParseTimestamp(rawTs),
                    sender:    isSystem ? null : rest.slice(0, colonIdx),
                    text:      isSystem ? rest  : rest.slice(colonIdx + 2),
                    isSystem:  isSystem
                };
            } else if (current !== null && line.trim()) {
                current.text = current.text + '\n' + line;
            }
        }
        if (current) messages.push(current);
        return messages;
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'WhatsApp .txt Chat Export v1',

        canHandle: function (input) {
            if (typeof input !== 'string' || !input.trim()) return false;
            var first = firstNonEmptyLine(input);
            return BRACKET_RE.test(first) || HYPHEN_RE.test(first);
        },

        normalizeAll: function (parsedMessages) {
            var warnings   = [];
            var result     = [];
            var importedAt = new Date().toISOString();

            for (var i = 0; i < parsedMessages.length; i++) {
                var m = parsedMessages[i];
                if (m.isSystem) {
                    warnings.push({ index: i, message: 'System message skipped: ' + (m.text || '').slice(0, 80) });
                    continue;
                }
                if (!m.sender || !m.timestamp) {
                    warnings.push({ index: i, message: 'Malformed message skipped — missing sender or timestamp' });
                    continue;
                }
                var isMedia = MEDIA_RE.test((m.text || '').trim());
                result.push(KMEngine.NormalizedMemory.create({
                    sourcePlatformId: PLATFORM_ID,
                    sourceAdapterId:  ADAPTER_ID,
                    importIndex:      i,
                    timestamp:        m.timestamp,
                    sender:           m.sender,
                    senderRole:       'contact',
                    text:             isMedia ? '[Attachment]' : m.text,
                    reactions:        [],
                    isAttachmentOnly: isMedia,
                    type:             isMedia ? 'attachment-placeholder' : 'message',
                    provenance:       { importedAt: importedAt, adapterVersion: ADAPTER_VERSION }
                }));
            }
            this._lastWarnings = warnings;
            return result;
        },

        import: function (rawText) {
            if (typeof rawText !== 'string' || !rawText.trim()) {
                this._lastWarnings = [];
                return KMEngine.createImportResult({
                    sourcePlatformId: PLATFORM_ID,
                    adapterVersion:   ADAPTER_VERSION,
                    rawCounts:        { total: 0, imported: 0, skipped: 0 }
                });
            }

            var parsed   = parseLines(rawText);
            var memories = this.normalizeAll(parsed);
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
                    total:    parsed.length,
                    imported: memories.length,
                    skipped:  parsed.length - memories.length
                },
                adapterVersion: ADAPTER_VERSION
            });
        },

        _lastWarnings: []
    };

    KMEngine.whatsappTxtAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
