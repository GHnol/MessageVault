(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'imessage-chatdb-v1';
    var PLATFORM_ID     = 'imessage';
    var ADAPTER_VERSION = '1';

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'iMessage chat.db (SQL.js) v1',

        canHandle: function (input) {
            return input != null && typeof input === 'object' && typeof input.exec === 'function';
        },

        // Normalize an already-extracted message array from extractMessagesForChat().
        // Called by index.html's extractMessagesForChat before it returns.
        // Expects messages to carry rowid and guid (forwarded from the SQL row).
        normalizeAll: function (messages) {
            var now      = new Date().toISOString();
            var warnings = [];
            var result   = [];

            for (var i = 0; i < messages.length; i++) {
                var m   = messages[i];
                var mem = KMEngine.NormalizedMemory.fromLegacy(m, PLATFORM_ID, ADAPTER_ID, i);

                // sourceNativeId: prefer rowid (integer primary key), fall back to guid.
                if (m.rowid != null) {
                    mem.sourceNativeId = String(m.rowid);
                } else if (m.guid) {
                    mem.sourceNativeId = m.guid;
                } else {
                    mem.sourceNativeId = null;
                    warnings.push({ index: i, message: 'Native identifier unavailable: rowid and guid both absent' });
                }

                // Provenance: record when this normalization happened and which adapter version ran.
                mem.provenance = {
                    importedAt:     now,
                    adapterVersion: ADAPTER_VERSION
                };

                // Raw: preserve minimal native identifiers only — not the full payload.
                mem.raw = { rowid: m.rowid != null ? m.rowid : null, guid: m.guid || null };

                if (!m.sender && !m.timestamp) {
                    warnings.push({ index: i, message: 'Row missing sender and timestamp' });
                }

                result.push(mem);
            }

            this._lastWarnings = warnings;
            return result;
        },

        // Full adapter import. Caller must supply context.extractMessagesForChat —
        // the extraction function from index.html — because that logic is not
        // registered on KMEngine. The existing UI path calls normalizeAll() directly
        // and does not use this method.
        import: function (db, context) {
            var extractFn = context && typeof context.extractMessagesForChat === 'function'
                ? context.extractMessagesForChat
                : null;

            if (!extractFn) {
                return KMEngine.createImportResult({
                    memories:         [],
                    unsupportedItems: [{ message: 'Direct import requires context.extractMessagesForChat. Current UI integration uses normalizeAll() as the compatibility wrapper.' }],
                    sourcePlatformId: PLATFORM_ID,
                    adapterVersion:   ADAPTER_VERSION
                });
            }

            var chatId   = context.chatId;
            var raw      = extractFn(db, chatId);
            var memories = this.normalizeAll(raw);
            var participants = [];
            var seen = {};
            for (var j = 0; j < memories.length; j++) {
                var s = memories[j].sender;
                if (s && !seen[s]) { seen[s] = true; participants.push(s); }
            }
            return KMEngine.createImportResult({
                memories:         memories,
                participants:     participants,
                sourcePlatformId: PLATFORM_ID,
                importWarnings:   this._lastWarnings || [],
                rawCounts:        { total: raw.length, imported: memories.length, skipped: 0 },
                adapterVersion:   ADAPTER_VERSION
            });
        },

        _lastWarnings: []
    };

    KMEngine.chatDbAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
