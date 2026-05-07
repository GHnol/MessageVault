(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'manual-entry-v1';
    var PLATFORM_ID     = 'manual';
    var ADAPTER_VERSION = '1';

    function validateManualMemory(fields) {
        var errors = [];
        if (!fields.text || !fields.text.trim()) {
            errors.push('text is required and cannot be blank');
        }
        if (!fields.sender || !fields.sender.trim()) {
            errors.push('sender is required');
        }
        if (fields.timestamp && isNaN(Date.parse(fields.timestamp))) {
            errors.push('timestamp is not a valid date string');
        }
        return errors;
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'Manual Entry v1',

        canHandle: function (input) {
            return input != null && typeof input === 'object' && typeof input.text === 'string';
        },

        // Create one NormalizedMemory from a manually-authored entry.
        // Returns { success, errors, memory }.
        createMemory: function (fields) {
            var errors = validateManualMemory(fields);
            if (errors.length) {
                return { success: false, errors: errors, memory: null };
            }
            var memory = KMEngine.NormalizedMemory.create({
                sourcePlatformId: PLATFORM_ID,
                sourceAdapterId:  ADAPTER_ID,
                type:             'manual-note',
                timestamp:        fields.timestamp || null,
                sender:           fields.sender.trim(),
                senderRole:       fields.senderRole || (fields.sender === 'Me' ? 'self' : 'contact'),
                text:             fields.text.trim(),
                reactions:        fields.reactions  || [],
                provenance: {
                    importedAt:     new Date().toISOString(),
                    adapterVersion: ADAPTER_VERSION,
                    manualEntry:    true,
                    authorNote:     fields.authorNote || null
                }
            });
            return { success: true, errors: [], memory: memory };
        },

        // Create multiple manual memories from an entries array.
        createMany: function (entries) {
            var results = [];
            for (var i = 0; i < entries.length; i++) {
                results.push(this.createMemory(entries[i]));
            }
            return results;
        },

        import: function (input /*, context */) {
            var entries  = Array.isArray(input) ? input : [input];
            var memories = [];
            var warnings = [];
            for (var i = 0; i < entries.length; i++) {
                var r = this.createMemory(entries[i]);
                if (r.success) {
                    memories.push(r.memory);
                } else {
                    warnings.push({ index: i, errors: r.errors });
                }
            }
            return KMEngine.createImportResult({
                memories:         memories,
                sourcePlatformId: PLATFORM_ID,
                importWarnings:   warnings,
                rawCounts:        { total: entries.length, imported: memories.length, skipped: entries.length - memories.length },
                adapterVersion:   ADAPTER_VERSION
            });
        }
    };

    KMEngine.manualEntryAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
