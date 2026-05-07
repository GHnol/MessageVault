(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    // djb2 hash — deterministic, no crypto API required.
    function hashString(str) {
        var hash = 5381;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // keep 32-bit
        }
        return (hash >>> 0).toString(36);
    }

    // Stable ID: incorporates adapter, import position, timestamp, sender, and
    // a short text prefix. Position (importIndex) prevents collisions when two
    // messages share the same timestamp/sender/text.
    function generateMemoryId(sourcePlatformId, adapterId, importIndex, timestamp, sender, textPrefix) {
        var key = [
            sourcePlatformId || '',
            adapterId        || '',
            String(importIndex != null ? importIndex : 0),
            timestamp        || '',
            sender           || '',
            (textPrefix      || '').slice(0, 64)
        ].join('|');
        return 'mem-' + hashString(key);
    }

    KMEngine.NormalizedMemory = {
        generate_id: generateMemoryId,

        // Build a NormalizedMemory from scratch.
        create: function (fields) {
            var id = fields.id || generateMemoryId(
                fields.sourcePlatformId,
                fields.sourceAdapterId,
                fields.importIndex != null ? fields.importIndex : 0,
                fields.timestamp,
                fields.sender,
                fields.text
            );
            return {
                id:               id,
                sourcePlatformId: fields.sourcePlatformId || 'unknown',
                sourceAdapterId:  fields.sourceAdapterId  || 'unknown',
                sourceNativeId:   fields.sourceNativeId   || null,
                type:             fields.type             || 'message',
                timestamp:        fields.timestamp        || null,
                sender:           fields.sender           || null,
                senderRole:       fields.senderRole || (fields.sender === 'Me' ? 'self' : 'contact'),
                text:             fields.text             || null,
                reactions:        fields.reactions        || [],
                media:            fields.media            || [],
                unsupported:      fields.unsupported      || false,
                provenance:       fields.provenance       || null,
                raw:              fields.raw              || null,
                // Legacy compat — preserved so existing renderers keep working unchanged.
                isAttachmentOnly: fields.isAttachmentOnly || false
            };
        },

        // Lift a legacy message object (from existing parsers) into NormalizedMemory.
        // Object.assign preserves all existing fields so renderers and groups are unaffected.
        fromLegacy: function (msg, sourcePlatformId, adapterId, importIndex) {
            var type = msg.isAttachmentOnly ? 'attachment-placeholder' : 'message';
            var id   = generateMemoryId(
                sourcePlatformId,
                adapterId,
                importIndex,
                msg.timestamp,
                msg.sender,
                msg.text
            );
            return Object.assign({}, msg, {
                id:               id,
                sourcePlatformId: sourcePlatformId,
                sourceAdapterId:  adapterId,
                sourceNativeId:   msg.rowid != null ? String(msg.rowid) : null,
                type:             type,
                senderRole:       msg.sender === 'Me' ? 'self' : 'contact',
                media:            [],
                unsupported:      false,
                provenance:       { importedAt: null, adapterVersion: null },
                raw:              null
            });
        }
    };
}());
