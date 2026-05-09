(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    KMEngine.ProductStatuses = Object.freeze({
        SOFTWARE: Object.freeze({
            SUPPORTED:   'supported',
            PARTIAL:     'partial',
            STUB:        'stub',
            NOT_STARTED: 'not-started'
        }),
        COMMERCE: Object.freeze({
            READY:          'ready',
            BLOCKED:        'blocked',
            NOT_APPLICABLE: 'not-applicable'
        }),
        MANUFACTURING: Object.freeze({
            READY:          'ready',
            PLANNING:       'planning',
            NOT_STARTED:    'not-started',
            NOT_APPLICABLE: 'not-applicable'
        }),
        PUBLIC_CLAIM: Object.freeze({
            CLAIMABLE:  'claimable',
            NOT_YET:    'not-yet',
            RESTRICTED: 'restricted'
        })
    });
}());
