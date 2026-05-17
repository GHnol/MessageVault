(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    var PREVIEW_STATUS = Object.freeze({
        READY:          'ready',
        STUB:           'stub',
        NOT_APPLICABLE: 'not-applicable',
    });

    // prototypePreviewEnabled — preview architecture scope only; not commerce/manufacturing/public-claim readiness
    function makePreviewEntry(fields) {
        return {
            productTypeId:           fields.productTypeId,
            previewTypeId:           fields.previewTypeId,
            displayName:             fields.displayName,
            previewStatus:           fields.previewStatus,
            architectureKnown:       fields.architectureKnown,
            prototypePreviewEnabled: fields.prototypePreviewEnabled,
            previewRendererNotes:    fields.previewRendererNotes,
            unsupportedReason:       fields.unsupportedReason !== undefined ? fields.unsupportedReason : null,
        };
    }

    var _entries = [
        // ── Hero ──────────────────────────────────────────────────────────────
        makePreviewEntry({
            productTypeId:           'message-book',
            previewTypeId:           'message-book-preview',
            displayName:             'Message Book',
            previewStatus:           PREVIEW_STATUS.READY,
            architectureKnown:       true,
            prototypePreviewEnabled: true,
            previewRendererNotes:    'Paginated book renderer operational; prototype preview supported',
            unsupportedReason:       null,
        }),
        makePreviewEntry({
            productTypeId:           'framed-conversation-print',
            previewTypeId:           'framed-conversation-print-preview',
            displayName:             'Framed Conversation Print',
            previewStatus:           PREVIEW_STATUS.STUB,
            architectureKnown:       false,
            prototypePreviewEnabled: false,
            previewRendererNotes:    'No preview renderer; portrait print layout not yet designed',
            unsupportedReason:       'renderer-not-implemented',
        }),
        // ── Core ──────────────────────────────────────────────────────────────
        makePreviewEntry({
            productTypeId:           'mug',
            previewTypeId:           'mug-preview',
            displayName:             'Mug',
            previewStatus:           PREVIEW_STATUS.STUB,
            architectureKnown:       false,
            prototypePreviewEnabled: false,
            previewRendererNotes:    'No preview renderer; mug wrap layout not yet designed',
            unsupportedReason:       'renderer-not-implemented',
        }),
        makePreviewEntry({
            productTypeId:           'mini-keepsake-notebook',
            previewTypeId:           'mini-keepsake-notebook-preview',
            displayName:             'Mini Keepsake Notebook',
            previewStatus:           PREVIEW_STATUS.STUB,
            architectureKnown:       false,
            prototypePreviewEnabled: false,
            previewRendererNotes:    'No preview renderer; cover-only layout not yet designed',
            unsupportedReason:       'renderer-not-implemented',
        }),
        // ── Add-on ────────────────────────────────────────────────────────────
        makePreviewEntry({
            productTypeId:           'mini-message-sticker-pack',
            previewTypeId:           'mini-message-sticker-pack-preview',
            displayName:             'Mini Message Sticker Pack',
            previewStatus:           PREVIEW_STATUS.STUB,
            architectureKnown:       false,
            prototypePreviewEnabled: false,
            previewRendererNotes:    'No preview renderer; sticker sheet layout not yet designed',
            unsupportedReason:       'renderer-not-implemented',
        }),
        makePreviewEntry({
            productTypeId:           'fridge-magnet',
            previewTypeId:           'fridge-magnet-preview',
            displayName:             'Fridge Magnet',
            previewStatus:           PREVIEW_STATUS.STUB,
            architectureKnown:       false,
            prototypePreviewEnabled: false,
            previewRendererNotes:    'No preview renderer; magnet layout not yet designed',
            unsupportedReason:       'renderer-not-implemented',
        }),
    ];

    var _byProductTypeId = {};
    var _byPreviewTypeId = {};
    _entries.forEach(function (e) {
        _byProductTypeId[e.productTypeId] = e;
        _byPreviewTypeId[e.previewTypeId]  = e;
    });

    KMEngine.PrototypePreviewRegistry = {
        all:                       function ()            { return _entries.slice(); },
        get:                       function (productTypeId) { return _byProductTypeId[productTypeId] || null; },
        getByPreviewTypeId:        function (previewTypeId) { return _byPreviewTypeId[previewTypeId]  || null; },
        architectureKnown:         function ()            { return _entries.filter(function (e) { return e.architectureKnown; }); },
        prototypePreviewSupported: function ()            { return _entries.filter(function (e) { return e.prototypePreviewEnabled; }); },
    };

    KMEngine.PREVIEW_STATUS   = PREVIEW_STATUS;
    KMEngine.makePreviewEntry = makePreviewEntry;

}());
