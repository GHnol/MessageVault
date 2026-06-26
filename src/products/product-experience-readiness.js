(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // experienceStatus — view-model layer only; not a commerce/manufacturing/public-claim readiness gate
    var EXPERIENCE_STATUS = Object.freeze({
        UNKNOWN:                     'unknown',
        UNSUPPORTED:                 'unsupported',
        CATALOG_KNOWN:               'catalog-known',
        ELIGIBILITY_KNOWN:           'eligibility-known',
        RENDER_PLANNING_KNOWN:       'render-planning-known',
        PROTOTYPE_PREVIEW_SUPPORTED: 'prototype-preview-supported',
        PROOF_READY:                 'proof-ready',
        COMMERCE_READY:              'commerce-ready',
        MANUFACTURING_READY:         'manufacturing-ready',
        PUBLIC_CLAIM_READY:          'public-claim-ready',
        BLOCKED:                     'blocked',
    });

    var _userLabels = {};
    _userLabels[EXPERIENCE_STATUS.UNKNOWN]                     = 'Unknown product';
    _userLabels[EXPERIENCE_STATUS.UNSUPPORTED]                 = 'Not supported';
    _userLabels[EXPERIENCE_STATUS.CATALOG_KNOWN]               = 'Product planned';
    _userLabels[EXPERIENCE_STATUS.ELIGIBILITY_KNOWN]           = 'Product supported (renderer not yet available)';
    _userLabels[EXPERIENCE_STATUS.RENDER_PLANNING_KNOWN]       = 'Renderer not yet available';
    _userLabels[EXPERIENCE_STATUS.PROTOTYPE_PREVIEW_SUPPORTED] = 'Preview available';
    _userLabels[EXPERIENCE_STATUS.PROOF_READY]                 = 'Proof ready';
    _userLabels[EXPERIENCE_STATUS.COMMERCE_READY]              = 'Order ready';
    _userLabels[EXPERIENCE_STATUS.MANUFACTURING_READY]         = 'Manufacturing ready';
    _userLabels[EXPERIENCE_STATUS.PUBLIC_CLAIM_READY]          = 'Publicly claimable';
    _userLabels[EXPERIENCE_STATUS.BLOCKED]                     = 'More content needed';

    function _mergeUnique(target, source) {
        if (!source) return;
        for (var i = 0; i < source.length; i++) {
            if (target.indexOf(source[i]) === -1) target.push(source[i]);
        }
    }

    function _deriveExperienceStatus(p) {
        var anyKnown = p.catalogKnown || p.renderPlanningKnown || p.prototypePreviewKnown;
        if (!anyKnown) return EXPERIENCE_STATUS.UNKNOWN;

        if (p.canPubliclyClaim) return EXPERIENCE_STATUS.PUBLIC_CLAIM_READY;
        if (p.canManufacture)   return EXPERIENCE_STATUS.MANUFACTURING_READY;
        if (p.canOrder)         return EXPERIENCE_STATUS.COMMERCE_READY;
        if (p.canProof)         return EXPERIENCE_STATUS.PROOF_READY;
        if (p.canPreview)       return EXPERIENCE_STATUS.PROTOTYPE_PREVIEW_SUPPORTED;

        // BLOCKED only when the preview system is ready but this group fails eligibility.
        // If the renderer isn't implemented yet, prefer RENDER_PLANNING_KNOWN instead.
        if (p.systemPreviewReady && p.eligibilityKnown && p.groupEligible === false) {
            return EXPERIENCE_STATUS.BLOCKED;
        }

        if (p.renderPlanningKnown || p.prototypePreviewKnown) {
            return EXPERIENCE_STATUS.RENDER_PLANNING_KNOWN;
        }

        // Catalog-only products (no render planning layer)
        if (p.eligibilityKnown && p.groupEligible === false) {
            return EXPERIENCE_STATUS.BLOCKED;
        }
        if (p.eligibilityKnown) return EXPERIENCE_STATUS.ELIGIBILITY_KNOWN;
        if (p.catalogKnown)     return EXPERIENCE_STATUS.CATALOG_KNOWN;
        return EXPERIENCE_STATUS.UNSUPPORTED;
    }

    function _deriveNextDependency(renderSpec, previewEntry, gates) {
        if (!renderSpec && !previewEntry)              return 'product-render-spec-entry';
        if (renderSpec && !previewEntry)               return 'prototype-preview-registry-entry';
        if (previewEntry && !previewEntry.prototypePreviewEnabled) return 'prototype-preview-renderer';
        if (gates && !gates.proofSupported)            return 'proof-renderer';
        if (gates && !gates.commerceSupported)         return 'vendor-confirmation-and-commerce-gateway';
        if (gates && !gates.manufacturingSupported)    return 'manufacturing-confirmation';
        if (gates && !gates.publicClaimSupported)      return 'public-claim-authorization';
        return null;
    }

    function _deriveInternalNotes(catalog, renderSpec, previewEntry) {
        var parts = [];
        if (!catalog) parts.push('not-in-product-catalog');
        if (renderSpec && !renderSpec.isCatalogProduct) {
            parts.push('render-planning-target-only (not in software catalog)');
        }
        if (previewEntry && !previewEntry.prototypePreviewEnabled) {
            parts.push('preview-registry: ' + (previewEntry.unsupportedReason || 'unsupported'));
        }
        return parts.length ? parts.join('; ') : null;
    }

    function _safeUnknown(productTypeId) {
        return {
            productTypeId:               productTypeId,
            productName:                 productTypeId,
            catalogKnown:                false,
            eligibilityKnown:            false,
            renderPlanningKnown:         false,
            prototypePreviewKnown:       false,
            canPreview:                  false,
            canProof:                    false,
            canOrder:                    false,
            canManufacture:              false,
            canPubliclyClaim:            false,
            experienceStatus:            EXPERIENCE_STATUS.UNKNOWN,
            userLabel:                   _userLabels[EXPERIENCE_STATUS.UNKNOWN],
            blockers:                    ['unknown-product-type'],
            warnings:                    [],
            suggestions:                 [],
            eligibilityResult:           null,
            renderSpecSummary:           null,
            previewRegistrySummary:      null,
            nextImplementationDependency: 'product-render-spec-entry',
            internalNotes:               'not found in any product layer',
        };
    }

    function resolveForProduct(productTypeId, group) {
        var catalog      = KMEngine.ProductCatalog.get(productTypeId);
        var renderSpec   = KMEngine.ProductRenderSpecs.get(productTypeId);
        var previewEntry = KMEngine.PrototypePreviewRegistry.get(productTypeId);

        if (!catalog && !renderSpec && !previewEntry) {
            return _safeUnknown(productTypeId);
        }

        var productName = (renderSpec && renderSpec.displayName)
            || (catalog && catalog.label)
            || productTypeId;

        var safeGroup = (group && Array.isArray(group.messages)) ? group : { messages: [] };

        var eligibilityResult = catalog
            ? KMEngine.ProductEligibility.evaluate(safeGroup, productTypeId)
            : null;

        var renderSpecResult = renderSpec
            ? KMEngine.ProductRenderSpecResolver.resolve(productTypeId, safeGroup)
            : null;

        var previewResult = previewEntry
            ? KMEngine.PrototypePreviewResolver.resolve(productTypeId, safeGroup)
            : null;

        var gates = renderSpec ? renderSpec.gates : {
            engineSupported:           false,
            prototypePreviewSupported: false,
            proofSupported:            false,
            commerceSupported:         false,
            manufacturingSupported:    false,
            publicClaimSupported:      false,
        };

        var canPreview     = !!(previewResult && previewResult.previewSupported);
        // Proof readiness is one rung above previewability: a product is proof-ready
        // for THIS group only when it both supports proof (static gate) and has a
        // previewable (content-eligible) group. Without the canPreview guard, the
        // static gate alone would falsely report an empty/ineligible book as proof-ready.
        var canProof       = !!gates.proofSupported && canPreview;
        var canOrder       = !!gates.commerceSupported;
        var canManufacture = !!gates.manufacturingSupported;
        var canPubliclyClaim = !!gates.publicClaimSupported;

        var blockers    = [];
        var warnings    = [];
        var suggestions = [];

        if (renderSpecResult) {
            _mergeUnique(blockers, renderSpecResult.blockers);
            _mergeUnique(warnings, renderSpecResult.warnings);
        }
        if (previewResult) {
            _mergeUnique(blockers, previewResult.blockers);
            _mergeUnique(warnings, previewResult.warnings);
        }
        if (eligibilityResult) {
            _mergeUnique(warnings,    eligibilityResult.warnings);
            _mergeUnique(suggestions, eligibilityResult.suggestions);
        }

        var catalogKnown          = !!catalog;
        var eligibilityKnown      = !!eligibilityResult;
        var renderPlanningKnown   = !!(renderSpec && renderSpec.isRenderPlanningTarget);
        var prototypePreviewKnown = !!previewEntry;
        var groupEligible         = eligibilityResult ? eligibilityResult.eligible : null;
        var systemPreviewReady    = !!(previewEntry && previewEntry.prototypePreviewEnabled);

        var experienceStatus = _deriveExperienceStatus({
            catalogKnown:          catalogKnown,
            eligibilityKnown:      eligibilityKnown,
            renderPlanningKnown:   renderPlanningKnown,
            prototypePreviewKnown: prototypePreviewKnown,
            canPreview:            canPreview,
            canProof:              canProof,
            canOrder:              canOrder,
            canManufacture:        canManufacture,
            canPubliclyClaim:      canPubliclyClaim,
            groupEligible:         groupEligible,
            systemPreviewReady:    systemPreviewReady,
        });

        return {
            productTypeId:         productTypeId,
            productName:           productName,
            catalogKnown:          catalogKnown,
            eligibilityKnown:      eligibilityKnown,
            renderPlanningKnown:   renderPlanningKnown,
            prototypePreviewKnown: prototypePreviewKnown,
            canPreview:            canPreview,
            canProof:              canProof,
            canOrder:              canOrder,
            canManufacture:        canManufacture,
            canPubliclyClaim:      canPubliclyClaim,
            experienceStatus:      experienceStatus,
            userLabel:             _userLabels[experienceStatus] || experienceStatus,
            blockers:              blockers,
            warnings:              warnings,
            suggestions:           suggestions,
            eligibilityResult:     eligibilityResult,
            renderSpecSummary:     renderSpec ? {
                renderStatus:              renderSpec.renderStatus,
                minMemoryCount:            renderSpec.minMemoryCount,
                maxRecommendedMemoryCount: renderSpec.maxRecommendedMemoryCount,
                engineSupported:           gates.engineSupported,
                prototypePreviewSupported: gates.prototypePreviewSupported,
            } : null,
            previewRegistrySummary: previewEntry ? {
                prototypePreviewEnabled: previewEntry.prototypePreviewEnabled,
                previewStatus:           previewEntry.previewStatus,
                unsupportedReason:       previewEntry.unsupportedReason,
            } : null,
            nextImplementationDependency: _deriveNextDependency(renderSpec, previewEntry, gates),
            internalNotes:               _deriveInternalNotes(catalog, renderSpec, previewEntry),
        };
    }

    function resolveAllForGroup(group) {
        var rptIds = KMEngine.ProductRenderSpecs.renderPlanningTargets().map(function (s) {
            return s.productTypeId;
        });
        var catalogIds = KMEngine.ProductCatalog.all().map(function (p) { return p.id; });

        var allIds = rptIds.slice();
        catalogIds.forEach(function (id) {
            if (allIds.indexOf(id) === -1) allIds.push(id);
        });

        return allIds.map(function (id) { return resolveForProduct(id, group); });
    }

    function resolvePreviewableForGroup(group) {
        return resolveAllForGroup(group).filter(function (r) { return r.canPreview; });
    }

    function resolveBlockedForGroup(group) {
        return resolveAllForGroup(group).filter(function (r) {
            return r.experienceStatus === EXPERIENCE_STATUS.BLOCKED;
        });
    }

    function resolveByStatus(group, status) {
        return resolveAllForGroup(group).filter(function (r) {
            return r.experienceStatus === status;
        });
    }

    KMEngine.ProductExperienceReadiness = {
        resolveForProduct:          resolveForProduct,
        resolveAllForGroup:         resolveAllForGroup,
        resolvePreviewableForGroup: resolvePreviewableForGroup,
        resolveBlockedForGroup:     resolveBlockedForGroup,
        resolveByStatus:            resolveByStatus,
    };

    KMEngine.EXPERIENCE_STATUS = EXPERIENCE_STATUS;

}());
