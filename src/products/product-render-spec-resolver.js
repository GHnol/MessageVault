(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    function resolve(productTypeId, group) {
        var spec = KMEngine.ProductRenderSpecs.get(productTypeId);
        if (!spec) {
            return {
                productTypeId:             productTypeId,
                spec:                      null,
                resolved:                  false,
                eligible:                  false,
                blockers:                  ['unknown-product-type'],
                warnings:                  [],
                memoryCount:               0,
                overMaxRecommended:        false,
                underMinRequired:          false,
                hasAttachmentOnlyMessages: false,
            };
        }

        var messages          = (group && Array.isArray(group.messages)) ? group.messages : [];
        var memoryCount       = messages.length;
        var attachmentOnly    = messages.filter(function (m) { return m.isAttachmentOnly; }).length;

        var blockers = [];
        var warnings = [];

        if (memoryCount < spec.minMemoryCount) {
            blockers.push('below-minimum-memory-count');
        }
        if (spec.maxRecommendedMemoryCount !== null && memoryCount > spec.maxRecommendedMemoryCount) {
            warnings.push('exceeds-recommended-memory-count');
        }
        if (!spec.gates.engineSupported) {
            blockers.push('engine-not-supported');
        }
        if (attachmentOnly > 0 && spec.attachmentHandlingPolicy === 'block') {
            blockers.push('attachment-only-messages-present');
        }

        return {
            productTypeId:             productTypeId,
            spec:                      spec,
            resolved:                  true,
            eligible:                  blockers.length === 0,
            blockers:                  blockers,
            warnings:                  warnings,
            memoryCount:               memoryCount,
            overMaxRecommended:        spec.maxRecommendedMemoryCount !== null && memoryCount > spec.maxRecommendedMemoryCount,
            underMinRequired:          memoryCount < spec.minMemoryCount,
            hasAttachmentOnlyMessages: attachmentOnly > 0,
        };
    }

    KMEngine.ProductRenderSpecResolver = {
        resolve:           resolve,
        getSpec:           function (id) { return KMEngine.ProductRenderSpecs.get(id); },
        allSpecs:          function ()   { return KMEngine.ProductRenderSpecs.all(); },
        renderPlanningTargetSpecs: function () { return KMEngine.ProductRenderSpecs.renderPlanningTargets(); },
    };

}());
