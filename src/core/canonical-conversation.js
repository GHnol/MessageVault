(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var MEDIA_KINDS = ['image', 'video', 'audio', 'voice', 'sticker', 'gif', 'document', 'contact', 'location'];
    var MESSAGE_TYPES = ['text', 'media', 'system-ref', 'deleted', 'unsupported'];
    var SYSTEM_EVENT_KINDS = [
        'encryption-notice', 'group-create', 'add-participant', 'remove-participant',
        'leave', 'subject-change', 'icon-change', 'name-change', 'number-change',
        'disappearing-messages', 'missed-call', 'deleted-message', 'edited-notice', 'unknown'
    ];

    // djb2 — deterministic, no crypto/Date/random. Same as src/core/normalized-memory.js.
    function hash(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) + h) + str.charCodeAt(i);
            h = h & h;
        }
        return (h >>> 0).toString(36);
    }

    function idFrom(prefix, parts) {
        var key = [];
        for (var i = 0; i < parts.length; i++) {
            key.push(parts[i] == null ? '' : String(parts[i]));
        }
        return prefix + '-' + hash(key.join('|'));
    }

    function asArray(v) { return Array.isArray(v) ? v : []; }
    function asString(v) { return typeof v === 'string' ? v : (v == null ? null : String(v)); }
    function asBool(v) { return v === true; }
    function asNumOrNull(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
    function triState(v) { return v === true ? true : (v === false ? false : null); }

    function createParticipant(f) {
        f = f || {};
        var displayName = asString(f.displayName);
        var handle = asString(f.handle);
        return {
            id:           f.id || idFrom('par', [handle || displayName || 'unknown']),
            displayName:  displayName,
            handle:       handle,
            isSelf:       asBool(f.isSelf),
            aliases:      asArray(f.aliases),
            messageCount: typeof f.messageCount === 'number' ? f.messageCount : 0
        };
    }

    function createMediaAttachment(f) {
        f = f || {};
        var kind = MEDIA_KINDS.indexOf(f.kind) !== -1 ? f.kind : 'document';
        var filename = asString(f.filename);
        var sourceRef = asString(f.sourceRef);
        return {
            id:                f.id || idFrom('med', [kind, filename || sourceRef || '']),
            kind:              kind,
            filename:          filename,
            mimeType:          asString(f.mimeType),
            byteSize:          asNumOrNull(f.byteSize),
            sourceRef:         sourceRef,
            present:           triState(f.present),
            width:             asNumOrNull(f.width),
            height:            asNumOrNull(f.height),
            durationMs:        asNumOrNull(f.durationMs),
            caption:           asString(f.caption),
            placeholderReason: asString(f.placeholderReason)
        };
    }

    function createReaction(f) {
        f = f || {};
        return {
            reactor: asString(f.reactor),
            emoji:   asString(f.emoji),
            label:   asString(f.label)
        };
    }

    function createReply(f) {
        f = f || {};
        var quotedMessageId = asString(f.quotedMessageId);
        var quotedText = asString(f.quotedText);
        return {
            quotedMessageId: quotedMessageId,
            quotedText:      quotedText,
            available:       (f.available === true || f.available === false) ? f.available : !!(quotedMessageId || quotedText)
        };
    }

    function createMessage(f) {
        f = f || {};
        var type = MESSAGE_TYPES.indexOf(f.type) !== -1 ? f.type : 'text';
        var conversationId = asString(f.conversationId);
        var participantId = asString(f.participantId);
        var timestamp = asString(f.timestamp);
        var text = asString(f.text);
        var importIndex = typeof f.importIndex === 'number' ? f.importIndex : 0;
        return {
            id:             f.id || idFrom('msg', [conversationId, participantId, importIndex, timestamp, (text || '').slice(0, 64)]),
            conversationId: conversationId,
            participantId:  participantId,
            timestamp:      timestamp,
            rawTs:          asString(f.rawTs),
            tzAssumption:   asString(f.tzAssumption),
            type:           type,
            text:           text,
            media:          asArray(f.media),
            reactions:      asArray(f.reactions),
            replyTo:        f.replyTo != null ? f.replyTo : null,
            isEdited:       asBool(f.isEdited),
            isDeleted:      asBool(f.isDeleted),
            sourceNativeId: asString(f.sourceNativeId),
            importIndex:    importIndex,
            raw:            f.raw != null ? f.raw : null
        };
    }

    function createSystemEvent(f) {
        f = f || {};
        var kind = SYSTEM_EVENT_KINDS.indexOf(f.kind) !== -1 ? f.kind : 'unknown';
        var timestamp = asString(f.timestamp);
        var text = asString(f.text);
        return {
            id:             f.id || idFrom('sys', [kind, timestamp, (text || '').slice(0, 64)]),
            timestamp:      timestamp,
            kind:           kind,
            actors:         asArray(f.actors),
            text:           text,
            conversationId: asString(f.conversationId),
            raw:            f.raw != null ? f.raw : null
        };
    }

    function createSourceMetadata(f) {
        f = f || {};
        return {
            platform:           asString(f.platform),
            exportVariant:      asString(f.exportVariant),
            originalFilename:   asString(f.originalFilename),
            detectedDateFormat: asString(f.detectedDateFormat),
            detectedLocale:     asString(f.detectedLocale),
            hourCycle:          asString(f.hourCycle),
            fileHash:           asString(f.fileHash),
            importedAt:         asString(f.importedAt),
            adapterId:          asString(f.adapterId),
            adapterVersion:     asString(f.adapterVersion)
        };
    }

    function createImportDiagnostics(f) {
        f = f || {};
        var c = f.counts || {};
        function n(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
        return {
            counts: {
                total:    n(c.total),
                imported: n(c.imported),
                skipped:  n(c.skipped),
                system:   n(c.system),
                media:    n(c.media),
                deleted:  n(c.deleted),
                unparsed: n(c.unparsed)
            },
            skipReasons:      asArray(f.skipReasons),
            unparsedLines:    asArray(f.unparsedLines),
            ambiguousDates:   asArray(f.ambiguousDates),
            mediaMissing:     asArray(f.mediaMissing),
            selfIdentified:     asBool(f.selfIdentified),
            selfMatchMethod:    asString(f.selfMatchMethod),
            selfMatchAmbiguous: asBool(f.selfMatchAmbiguous),
            selfCandidateCount: typeof f.selfCandidateCount === 'number' ? f.selfCandidateCount : 0,
            groupInferred:      asBool(f.groupInferred),
            groupEvidence:      asArray(f.groupEvidence),
            rosterEvidence:     asArray(f.rosterEvidence),
            formatConfidence:   typeof f.formatConfidence === 'number' ? f.formatConfidence : null,
            warnings:           asArray(f.warnings)
        };
    }

    function deriveDateRange(messages) {
        var first = null, last = null;
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            if (!m || !m.timestamp) continue;
            var t = Date.parse(m.timestamp);
            if (isNaN(t)) continue;
            if (first === null || t < first) first = t;
            if (last === null || t > last) last = t;
        }
        return {
            first: first === null ? null : new Date(first).toISOString(),
            last:  last === null ? null : new Date(last).toISOString()
        };
    }

    function createConversation(f) {
        f = f || {};
        var participants = asArray(f.participants);
        var messages = asArray(f.messages);
        var platform = asString(f.platform);
        var contacts = 0;
        for (var i = 0; i < participants.length; i++) {
            if (participants[i] && participants[i].isSelf !== true) contacts++;
        }
        return {
            id:            f.id || idFrom('cnv', [platform, (participants[0] && participants[0].id) || '', messages.length]),
            platform:      platform,
            exportVariant: asString(f.exportVariant),
            isGroup:       (f.isGroup === true || f.isGroup === false) ? f.isGroup : contacts > 1,
            title:         asString(f.title),
            participants:  participants,
            messages:      messages,
            systemEvents:  asArray(f.systemEvents),
            dateRange:     deriveDateRange(messages),
            source:        f.source != null ? f.source : null,
            diagnostics:   f.diagnostics != null ? f.diagnostics : null
        };
    }

    // Derived view: consecutive same-participant runs. Not stored on the Conversation.
    function groupMessages(messages) {
        var groups = [];
        var current = null;
        var arr = asArray(messages);
        for (var i = 0; i < arr.length; i++) {
            var m = arr[i];
            if (!m) continue;
            if (current && current.participantId === m.participantId) {
                current.messages.push(m);
                current.endTs = m.timestamp;
            } else {
                if (current) groups.push(current);
                current = { participantId: m.participantId, messages: [m], startTs: m.timestamp, endTs: m.timestamp };
            }
        }
        if (current) groups.push(current);
        return groups;
    }

    KMEngine.CanonicalConversation = {
        MEDIA_KINDS:             MEDIA_KINDS,
        MESSAGE_TYPES:           MESSAGE_TYPES,
        SYSTEM_EVENT_KINDS:      SYSTEM_EVENT_KINDS,
        hash:                    hash,
        createParticipant:       createParticipant,
        createMediaAttachment:   createMediaAttachment,
        createReaction:          createReaction,
        createReply:             createReply,
        createMessage:           createMessage,
        createSystemEvent:       createSystemEvent,
        createSourceMetadata:    createSourceMetadata,
        createImportDiagnostics: createImportDiagnostics,
        createConversation:      createConversation,
        groupMessages:           groupMessages
    };
}());
