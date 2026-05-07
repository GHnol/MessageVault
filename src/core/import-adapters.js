(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    KMEngine.adapters = KMEngine.adapters || {};

    KMEngine.registerAdapter = function (adapter) {
        KMEngine.adapters[adapter.id] = adapter;
    };

    // Standard shape for everything an adapter produces.
    KMEngine.createImportResult = function (opts) {
        return {
            memories:         opts.memories         || [],
            participants:     opts.participants      || [],
            sourcePlatformId: opts.sourcePlatformId || 'unknown',
            importWarnings:   opts.importWarnings   || [],
            unsupportedItems: opts.unsupportedItems || [],
            rawCounts:        opts.rawCounts        || { total: 0, imported: 0, skipped: 0 },
            adapterVersion:   opts.adapterVersion   || '0'
        };
    };
}());
