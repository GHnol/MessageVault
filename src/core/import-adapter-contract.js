(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_REQUIRED_PROPS   = ['id', 'sourcePlatformId'];
    var ADAPTER_REQUIRED_METHODS = ['canHandle', 'import'];

    // Semantic guard: the canonical model never carries commerce / manufacturing / readiness.
    var FORBIDDEN_FIELDS = [
        'proofReady', 'checkoutReady', 'manufacturingReady',
        'estimatedPages', 'estimatedVolumes', 'vendor', 'order', 'price'
    ];

    function isObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
    function err(errors, path, code, message) { errors.push({ path: path, code: code, message: message }); }
    function enums() { return KMEngine.CanonicalConversation || {}; }

    function checkForbidden(obj, base, errors) {
        for (var i = 0; i < FORBIDDEN_FIELDS.length; i++) {
            if (obj[FORBIDDEN_FIELDS[i]] !== undefined) {
                err(errors, (base ? base + '.' : '') + FORBIDDEN_FIELDS[i], 'FORBIDDEN_FIELD', 'forbidden commerce/readiness field present');
            }
        }
    }

    function validateAdapter(adapter) {
        var errors = [];
        if (!isObj(adapter)) {
            err(errors, '', 'NOT_OBJECT', 'adapter is not an object');
            return { valid: false, errors: errors };
        }
        for (var i = 0; i < ADAPTER_REQUIRED_PROPS.length; i++) {
            var p = ADAPTER_REQUIRED_PROPS[i];
            if (typeof adapter[p] !== 'string' || !adapter[p]) {
                err(errors, p, 'MISSING_PROP', p + ' must be a non-empty string');
            }
        }
        for (var j = 0; j < ADAPTER_REQUIRED_METHODS.length; j++) {
            var m = ADAPTER_REQUIRED_METHODS[j];
            if (typeof adapter[m] !== 'function') {
                err(errors, m, 'MISSING_METHOD', m + ' must be a function');
            }
        }
        return { valid: errors.length === 0, errors: errors };
    }

    function validateParticipant(p, idx, errors, ids) {
        var base = 'participants[' + idx + ']';
        if (!isObj(p)) { err(errors, base, 'NOT_OBJECT', 'participant must be an object'); return; }
        if (typeof p.id !== 'string' || !p.id) err(errors, base + '.id', 'MISSING_ID', 'participant.id required');
        else ids[p.id] = true;
        if (p.displayName != null && typeof p.displayName !== 'string') err(errors, base + '.displayName', 'BAD_TYPE', 'displayName must be string or null');
        if (typeof p.isSelf !== 'boolean') err(errors, base + '.isSelf', 'BAD_TYPE', 'isSelf must be boolean');
        if (!Array.isArray(p.aliases)) err(errors, base + '.aliases', 'BAD_TYPE', 'aliases must be an array');
    }

    function validateMedia(med, base, errors) {
        if (!isObj(med)) { err(errors, base, 'NOT_OBJECT', 'media must be an object'); return; }
        if (typeof med.id !== 'string' || !med.id) err(errors, base + '.id', 'MISSING_ID', 'media.id required');
        if ((enums().MEDIA_KINDS || []).indexOf(med.kind) === -1) err(errors, base + '.kind', 'BAD_ENUM', 'media.kind not in MEDIA_KINDS');
    }

    function validateMessage(m, idx, errors, participantIds) {
        var base = 'messages[' + idx + ']';
        if (!isObj(m)) { err(errors, base, 'NOT_OBJECT', 'message must be an object'); return; }
        if (typeof m.id !== 'string' || !m.id) err(errors, base + '.id', 'MISSING_ID', 'message.id required');
        if (typeof m.participantId !== 'string' || !m.participantId) err(errors, base + '.participantId', 'MISSING_PARTICIPANT', 'message.participantId required');
        else if (!participantIds[m.participantId]) err(errors, base + '.participantId', 'UNKNOWN_PARTICIPANT', 'message.participantId not in participants roster');
        if ((enums().MESSAGE_TYPES || []).indexOf(m.type) === -1) err(errors, base + '.type', 'BAD_ENUM', 'message.type not in MESSAGE_TYPES');
        if (!Array.isArray(m.media)) err(errors, base + '.media', 'BAD_TYPE', 'media must be an array');
        else for (var k = 0; k < m.media.length; k++) validateMedia(m.media[k], base + '.media[' + k + ']', errors);
        if (!Array.isArray(m.reactions)) err(errors, base + '.reactions', 'BAD_TYPE', 'reactions must be an array');
        checkForbidden(m, base, errors);
    }

    function validateSystemEvent(s, idx, errors) {
        var base = 'systemEvents[' + idx + ']';
        if (!isObj(s)) { err(errors, base, 'NOT_OBJECT', 'systemEvent must be an object'); return; }
        if (typeof s.id !== 'string' || !s.id) err(errors, base + '.id', 'MISSING_ID', 'systemEvent.id required');
        if ((enums().SYSTEM_EVENT_KINDS || []).indexOf(s.kind) === -1) err(errors, base + '.kind', 'BAD_ENUM', 'systemEvent.kind not in SYSTEM_EVENT_KINDS');
        if (!Array.isArray(s.actors)) err(errors, base + '.actors', 'BAD_TYPE', 'actors must be an array');
    }

    function validateConversation(conv) {
        var errors = [];
        if (!isObj(conv)) {
            err(errors, '', 'NOT_OBJECT', 'conversation is not an object');
            return { valid: false, errors: errors };
        }
        if (typeof conv.id !== 'string' || !conv.id) err(errors, 'id', 'MISSING_ID', 'conversation.id required');
        if (typeof conv.platform !== 'string' || !conv.platform) err(errors, 'platform', 'MISSING', 'conversation.platform required');
        if (typeof conv.isGroup !== 'boolean') err(errors, 'isGroup', 'BAD_TYPE', 'conversation.isGroup must be boolean');

        var ids = {};
        if (!Array.isArray(conv.participants)) err(errors, 'participants', 'BAD_TYPE', 'participants must be an array');
        else for (var i = 0; i < conv.participants.length; i++) validateParticipant(conv.participants[i], i, errors, ids);

        if (!Array.isArray(conv.messages)) err(errors, 'messages', 'BAD_TYPE', 'messages must be an array');
        else for (var j = 0; j < conv.messages.length; j++) validateMessage(conv.messages[j], j, errors, ids);

        if (!Array.isArray(conv.systemEvents)) err(errors, 'systemEvents', 'BAD_TYPE', 'systemEvents must be an array');
        else for (var k = 0; k < conv.systemEvents.length; k++) validateSystemEvent(conv.systemEvents[k], k, errors);

        if (!isObj(conv.source)) err(errors, 'source', 'MISSING', 'source must be an object');
        else if (typeof conv.source.platform !== 'string' || !conv.source.platform) err(errors, 'source.platform', 'MISSING', 'source.platform required');

        if (!isObj(conv.diagnostics)) err(errors, 'diagnostics', 'MISSING', 'diagnostics must be an object');
        else if (!isObj(conv.diagnostics.counts)) err(errors, 'diagnostics.counts', 'BAD_TYPE', 'diagnostics.counts must be an object');

        checkForbidden(conv, '', errors);
        return { valid: errors.length === 0, errors: errors };
    }

    KMEngine.ImportAdapterContract = {
        ADAPTER_REQUIRED_PROPS:   ADAPTER_REQUIRED_PROPS,
        ADAPTER_REQUIRED_METHODS: ADAPTER_REQUIRED_METHODS,
        FORBIDDEN_FIELDS:         FORBIDDEN_FIELDS,
        validateAdapter:          validateAdapter,
        validateConversation:     validateConversation
    };
}());
