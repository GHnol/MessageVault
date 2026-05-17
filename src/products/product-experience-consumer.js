(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ProductExperienceConsumer — app-side bridge to ProductExperienceReadiness.
    // Provides null-safe access to readiness queries from browser/app code.
    // View-model layer only; does not change rendering behavior.

    function _safeGroup(group) {
        return (group && Array.isArray(group.messages)) ? group : { messages: [] };
    }

    function isAvailable() {
        return !!(KMEngine.ProductExperienceReadiness && KMEngine.EXPERIENCE_STATUS);
    }

    function resolveForGroup(group) {
        if (!KMEngine.ProductExperienceReadiness) return [];
        return KMEngine.ProductExperienceReadiness.resolveAllForGroup(_safeGroup(group));
    }

    function resolveProductForGroup(productTypeId, group) {
        if (!KMEngine.ProductExperienceReadiness) return null;
        return KMEngine.ProductExperienceReadiness.resolveForProduct(productTypeId, _safeGroup(group));
    }

    function resolvePreviewableForGroup(group) {
        if (!KMEngine.ProductExperienceReadiness) return [];
        return KMEngine.ProductExperienceReadiness.resolvePreviewableForGroup(_safeGroup(group));
    }

    KMEngine.ProductExperienceConsumer = {
        isAvailable:                isAvailable,
        resolveForGroup:            resolveForGroup,
        resolveProductForGroup:     resolveProductForGroup,
        resolvePreviewableForGroup: resolvePreviewableForGroup,
    };

}());
