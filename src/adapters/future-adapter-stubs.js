(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    KMEngine.futureAdapters = {};

    function makeStub(id, platformId, label) {
        return {
            id:               id,
            sourcePlatformId: platformId,
            label:            label,
            status:           'stub',
            canHandle: function () { return false; },
            import: function () {
                throw new Error('Adapter ' + id + ' is not yet implemented.');
            },
            normalizeAll: function () {
                throw new Error('Adapter ' + id + ' is not yet implemented.');
            }
        };
    }

    var STUBS = [
        makeStub('instagram-dm-json-v1',         'instagram-dm',        'Instagram DM JSON Export v1'),
        makeStub('facebook-messenger-json-v1',   'facebook-messenger',  'Facebook Messenger JSON Export v1'),
        makeStub('telegram-json-v1',             'telegram',            'Telegram Desktop JSON Export v1')
    ];

    for (var i = 0; i < STUBS.length; i++) {
        KMEngine.futureAdapters[STUBS[i].id] = STUBS[i];
        KMEngine.adapters[STUBS[i].id]        = STUBS[i];
    }
}());
