(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'txt-export-v1';
    var PLATFORM_ID     = 'txt-export';
    var ADAPTER_VERSION = '1';

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'Text Export (.txt) v1',

        canHandle: function (input) {
            return typeof input === 'string' && input.indexOf('|') !== -1;
        },

        // Normalize an already-parsed + reaction-applied message array.
        // Called by index.html's readTxtFile after the existing parser runs.
        // Malformed rows (no sender AND no timestamp) produce a warning and are skipped.
        normalizeAll: function (messages) {
            var warnings = [];
            var result   = [];
            for (var i = 0; i < messages.length; i++) {
                var m = messages[i];
                if (!m.sender && !m.timestamp) {
                    warnings.push({ index: i, message: 'Row missing sender and timestamp — skipped' });
                    continue;
                }
                result.push(KMEngine.NormalizedMemory.fromLegacy(m, PLATFORM_ID, ADAPTER_ID, i));
            }
            this._lastWarnings = warnings;
            return result;
        },

        // Full adapter import (raw .txt string → ImportResult).
        // The existing app flow calls normalizeAll() on already-parsed output instead.
        // This path exists to satisfy the adapter contract and support future extraction.
        import: function (rawText /*, context */) {
            var lines   = typeof rawText === 'string' ? rawText.split('\n') : [];
            var raw     = [];
            var skipped = 0;

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.indexOf('|') === -1) continue;
                var parts = line.split('|').map(function (p) { return p.trim(); });
                if (parts.length < 3) { skipped++; continue; }
                var ts     = parts[0];
                var sender = parts[1];
                var text   = parts.slice(2).join(' | ');
                if (!ts || !sender) { skipped++; continue; }
                raw.push({ timestamp: ts, sender: sender, text: text, reactions: [], isAttachmentOnly: false });
            }

            var memories     = this.normalizeAll(raw);
            var participants = [];
            var seen         = {};
            for (var j = 0; j < memories.length; j++) {
                var s = memories[j].sender;
                if (s && !seen[s]) { seen[s] = true; participants.push(s); }
            }
            return KMEngine.createImportResult({
                memories:         memories,
                participants:     participants,
                sourcePlatformId: PLATFORM_ID,
                importWarnings:   this._lastWarnings || [],
                rawCounts:        { total: raw.length + skipped, imported: memories.length, skipped: skipped },
                adapterVersion:   ADAPTER_VERSION
            });
        },

        _lastWarnings: []
    };

    KMEngine.txtExportAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
