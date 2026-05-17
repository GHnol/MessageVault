(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    function resolve(productTypeId, group) {
        var entry      = KMEngine.PrototypePreviewRegistry.get(productTypeId);
        var renderSpec = KMEngine.ProductRenderSpecs.get(productTypeId);

        if (!entry || !renderSpec) {
            return {
                productTypeId:             productTypeId,
                entry:                     null,
                renderSpec:                null,
                resolved:                  false,
                previewSupported:          false,
                blockers:                  ['unknown-product-type'],
                warnings:                  [],
                memoryCount:               0,
                overMaxRecommended:        false,
                underMinRequired:          false,
                hasAttachmentOnlyMessages: false,
            };
        }

        var messages       = (group && Array.isArray(group.messages)) ? group.messages : [];
        var memoryCount    = messages.length;
        var attachmentOnly = messages.filter(function (m) { return m.isAttachmentOnly; }).length;

        var blockers = [];
        var warnings = [];

        if (!entry.prototypePreviewEnabled) {
            blockers.push('preview-not-supported');
        }
        if (!renderSpec.gates.engineSupported) {
            blockers.push('engine-not-supported');
        }
        if (memoryCount < renderSpec.minMemoryCount) {
            blockers.push('below-minimum-memory-count');
        }
        if (renderSpec.maxRecommendedMemoryCount !== null && memoryCount > renderSpec.maxRecommendedMemoryCount) {
            warnings.push('exceeds-recommended-memory-count');
        }
        if (attachmentOnly > 0 && renderSpec.attachmentHandlingPolicy === 'block') {
            blockers.push('attachment-only-messages-present');
        }

        return {
            productTypeId:             productTypeId,
            entry:                     entry,
            renderSpec:                renderSpec,
            resolved:                  true,
            previewSupported:          blockers.length === 0,
            blockers:                  blockers,
            warnings:                  warnings,
            memoryCount:               memoryCount,
            overMaxRecommended:        renderSpec.maxRecommendedMemoryCount !== null && memoryCount > renderSpec.maxRecommendedMemoryCount,
            underMinRequired:          memoryCount < renderSpec.minMemoryCount,
            hasAttachmentOnlyMessages: attachmentOnly > 0,
        };
    }

    KMEngine.PrototypePreviewResolver = {
        resolve:                 resolve,
        getEntry:                function (id) { return KMEngine.PrototypePreviewRegistry.get(id); },
        allEntries:              function ()   { return KMEngine.PrototypePreviewRegistry.all(); },
        previewSupportedEntries: function ()   { return KMEngine.PrototypePreviewRegistry.prototypePreviewSupported(); },
    };

}());
