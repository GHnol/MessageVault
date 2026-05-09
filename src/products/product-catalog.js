(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var S   = KMEngine.ProductStatuses   || {};
    var SW  = S.SOFTWARE      || {};
    var CO  = S.COMMERCE      || {};
    var MFG = S.MANUFACTURING || {};
    var PC  = S.PUBLIC_CLAIM  || {};

    var PRODUCTS = [
        {
            id:       'message-book',
            label:    'Message Book',
            category: 'book',
            flagship: true,
            supportedContentTypes:        ['text', 'attachment-placeholder'],
            minContentGuidance:           5,
            maxContentGuidance:           null,
            sourceCompatibility:          'all',
            softwareSupportStatus:        SW.SUPPORTED   || 'supported',
            commerceReadinessStatus:      CO.BLOCKED     || 'blocked',
            manufacturingReadinessStatus: MFG.PLANNING   || 'planning',
            publicClaimStatus:            PC.NOT_YET     || 'not-yet',
            knownLimitations: [
                'No checkout or order flow implemented',
                'No PDF export or print-ready output',
                'Cover generation blocked on vendor confirmation',
                'Multi-volume splitting is estimated, not final'
            ],
            notes: 'Flagship product. Full paginator and sectioned book renderer operational.'
        },
        {
            id:       'journal',
            label:    'Journal',
            category: 'book',
            flagship: false,
            supportedContentTypes:        ['text'],
            minContentGuidance:           10,
            maxContentGuidance:           200,
            sourceCompatibility:          'all',
            softwareSupportStatus:        SW.STUB          || 'stub',
            commerceReadinessStatus:      CO.NOT_APPLICABLE || 'not-applicable',
            manufacturingReadinessStatus: MFG.NOT_STARTED  || 'not-started',
            publicClaimStatus:            PC.NOT_YET       || 'not-yet',
            knownLimitations: [
                'No renderer implemented',
                'Not commerce-ready',
                'Not manufacturing-ready'
            ],
            notes: 'Product-line-supported definition only. Not a launch-ready physical product.'
        },
        {
            id:       'mug',
            label:    'Mug',
            category: 'merchandise',
            flagship: false,
            supportedContentTypes:        ['text'],
            minContentGuidance:           1,
            maxContentGuidance:           3,
            sourceCompatibility:          'all',
            softwareSupportStatus:        SW.STUB          || 'stub',
            commerceReadinessStatus:      CO.NOT_APPLICABLE || 'not-applicable',
            manufacturingReadinessStatus: MFG.NOT_STARTED  || 'not-started',
            publicClaimStatus:            PC.NOT_YET       || 'not-yet',
            knownLimitations: [
                'No renderer implemented',
                'Very limited text capacity',
                'Attachment content not supportable on mug surface',
                'Not commerce-ready',
                'Not manufacturing-ready'
            ],
            notes: 'Product-line-supported definition only. Works best with 1–3 very short messages.'
        },
        {
            id:       'sticker-pack',
            label:    'Sticker Pack',
            category: 'merchandise',
            flagship: false,
            supportedContentTypes:        ['text'],
            minContentGuidance:           4,
            maxContentGuidance:           12,
            sourceCompatibility:          'all',
            softwareSupportStatus:        SW.STUB          || 'stub',
            commerceReadinessStatus:      CO.NOT_APPLICABLE || 'not-applicable',
            manufacturingReadinessStatus: MFG.NOT_STARTED  || 'not-started',
            publicClaimStatus:            PC.NOT_YET       || 'not-yet',
            knownLimitations: [
                'No renderer implemented',
                'Works best with short, punchy phrases',
                'Not commerce-ready',
                'Not manufacturing-ready'
            ],
            notes: 'Product-line-supported definition only. Each sticker = one short message.'
        },
        {
            id:       'wall-art',
            label:    'Wall Art',
            category: 'decor',
            flagship: false,
            supportedContentTypes:        ['text'],
            minContentGuidance:           1,
            maxContentGuidance:           5,
            sourceCompatibility:          'all',
            softwareSupportStatus:        SW.STUB          || 'stub',
            commerceReadinessStatus:      CO.NOT_APPLICABLE || 'not-applicable',
            manufacturingReadinessStatus: MFG.NOT_STARTED  || 'not-started',
            publicClaimStatus:            PC.NOT_YET       || 'not-yet',
            knownLimitations: [
                'No renderer implemented',
                'Not commerce-ready',
                'Not manufacturing-ready'
            ],
            notes: 'Product-line-supported definition only. Works best with 1–3 impactful messages.'
        },
        {
            id:       'gift-wrap',
            label:    'Gift Wrap',
            category: 'packaging',
            flagship: false,
            supportedContentTypes:        ['text'],
            minContentGuidance:           1,
            maxContentGuidance:           8,
            sourceCompatibility:          'all',
            softwareSupportStatus:        SW.STUB          || 'stub',
            commerceReadinessStatus:      CO.NOT_APPLICABLE || 'not-applicable',
            manufacturingReadinessStatus: MFG.NOT_STARTED  || 'not-started',
            publicClaimStatus:            PC.NOT_YET       || 'not-yet',
            knownLimitations: [
                'No renderer implemented',
                'Not commerce-ready',
                'Not manufacturing-ready'
            ],
            notes: 'Product-line-supported definition only. Works best with short, warm messages.'
        }
    ];

    var _byId = {};
    for (var _i = 0; _i < PRODUCTS.length; _i++) {
        _byId[PRODUCTS[_i].id] = PRODUCTS[_i];
    }

    KMEngine.ProductCatalog = {
        all:      function ()    { return PRODUCTS.slice(); },
        get:      function (id)  { return _byId[id] || null; },
        flagship: function ()    { return PRODUCTS.filter(function (p) { return p.flagship; })[0] || null; },
        byCategory: function (cat) { return PRODUCTS.filter(function (p) { return p.category === cat; }); }
    };
}());
