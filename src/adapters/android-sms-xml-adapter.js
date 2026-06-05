(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'android-sms-xml-v1';
    var PLATFORM_ID     = 'android-sms';
    var ADAPTER_VERSION = '1';

    // Extract a named attribute value from an XML opening-tag string.
    // Handles double-quoted and single-quoted attribute values.
    function getAttr(tagStr, name) {
        var dq = new RegExp(name + '="([^"]*)"');
        var sq = new RegExp(name + "='([^']*)'");
        var m = dq.exec(tagStr) || sq.exec(tagStr);
        return m ? m[1] : null;
    }

    // Convert a millisecond-epoch string (SMS Backup & Restore format) to ISO-8601.
    // Falls back to readable_date string when epoch is absent or zero.
    function parseTimestamp(dateMs, readableDate) {
        if (dateMs && /^\d+$/.test(dateMs.trim())) {
            var n = parseInt(dateMs, 10);
            if (n > 0) return new Date(n).toISOString();
        }
        return readableDate || null;
    }

    // Scan raw XML for <sms ...> and <mms ...> opening tags, preserving document
    // order. Works in Node without a DOM — no external dependencies.
    // Guards against matching <smses> or </smses> by checking the character that
    // immediately follows '<sms' or '<mms': it must be a whitespace, '/', or '>'.
    function parseElements(xml) {
        var elements = [];
        var pos = 0;
        var len = xml.length;

        while (pos < len) {
            var smsIdx = xml.indexOf('<sms', pos);
            var mmsIdx = xml.indexOf('<mms', pos);

            if (smsIdx === -1 && mmsIdx === -1) break;

            var idx, isMms;
            if      (smsIdx === -1)        { idx = mmsIdx; isMms = true;  }
            else if (mmsIdx === -1)        { idx = smsIdx; isMms = false; }
            else if (smsIdx <= mmsIdx)     { idx = smsIdx; isMms = false; }
            else                           { idx = mmsIdx; isMms = true;  }

            // '<sms' and '<mms' are both 4 characters.
            var nc = xml.charCodeAt(idx + 4);
            // Valid delimiters: space(32), tab(9), LF(10), CR(13), slash(47), gt(62)
            if (nc !== 32 && nc !== 9 && nc !== 10 && nc !== 13 && nc !== 47 && nc !== 62) {
                pos = idx + 1;
                continue;
            }

            var end = xml.indexOf('>', idx);
            if (end === -1) { pos = idx + 1; break; }

            elements.push({ tagStr: xml.slice(idx, end + 1), isMms: isMms });
            pos = end + 1;
        }

        return elements;
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'Android SMS Backup & Restore XML v1',

        // Returns true when the input string contains an SMS Backup & Restore
        // <smses> root element with at least one <sms> or <mms> message element.
        canHandle: function (input) {
            if (typeof input !== 'string' || !input.trim()) return false;
            if (input.indexOf('<smses') === -1) return false;
            return /<sms\b/.test(input) || /<mms\b/.test(input);
        },

        // Accepts an array of { tagStr, isMms } objects as produced by parseElements.
        // Returns a NormalizedMemory[] and populates this._lastWarnings.
        normalizeAll: function (elements) {
            var warnings   = [];
            var result     = [];
            var importedAt = new Date().toISOString();

            for (var i = 0; i < elements.length; i++) {
                var el  = elements[i];
                var tag = el.tagStr;

                if (el.isMms) {
                    // MMS: always normalize as attachment placeholder.
                    var mmsDate     = getAttr(tag, 'date');
                    var mmsReadable = getAttr(tag, 'readable_date');
                    var mmsContact  = getAttr(tag, 'contact_name');
                    var mmsAddr     = getAttr(tag, 'address');
                    var mmsBox      = getAttr(tag, 'msg_box') || getAttr(tag, 'type') || '1';
                    var mmsRole     = (mmsBox === '2' || mmsBox === '4') ? 'self' : 'contact';
                    var mmsSender   = mmsRole === 'self'
                        ? 'Me'
                        : ((mmsContact && mmsContact !== 'null') ? mmsContact
                           : ((mmsAddr && mmsAddr !== 'null') ? mmsAddr : null));
                    var mmsTs       = parseTimestamp(mmsDate, mmsReadable);

                    if (!mmsSender) {
                        warnings.push({ index: i, message: 'MMS skipped — missing sender/address' });
                        continue;
                    }

                    result.push(KMEngine.NormalizedMemory.create({
                        sourcePlatformId: PLATFORM_ID,
                        sourceAdapterId:  ADAPTER_ID,
                        importIndex:      i,
                        timestamp:        mmsTs,
                        sender:           mmsSender,
                        senderRole:       mmsRole,
                        text:             '[Attachment]',
                        reactions:        [],
                        isAttachmentOnly: true,
                        type:             'attachment-placeholder',
                        provenance:       { importedAt: importedAt, adapterVersion: ADAPTER_VERSION }
                    }));
                    continue;
                }

                // SMS element
                var type    = getAttr(tag, 'type');
                var dateMs  = getAttr(tag, 'date');
                var rdDate  = getAttr(tag, 'readable_date');
                var address = getAttr(tag, 'address');
                var contact = getAttr(tag, 'contact_name');
                var body    = getAttr(tag, 'body');

                var sender, senderRole;
                if (type === '2') {
                    sender     = 'Me';
                    senderRole = 'self';
                } else {
                    var resolvedContact = (contact && contact !== 'null') ? contact : null;
                    var resolvedAddr    = (address && address !== 'null') ? address : null;
                    sender     = resolvedContact || resolvedAddr || null;
                    senderRole = 'contact';
                }

                if (!sender) {
                    warnings.push({ index: i, message: 'SMS skipped — missing sender/address' });
                    continue;
                }

                var ts = parseTimestamp(dateMs, rdDate);
                if (!ts) {
                    warnings.push({ index: i, message: 'SMS skipped — missing timestamp' });
                    continue;
                }

                var text = (body !== null && body !== 'null') ? body : '';

                result.push(KMEngine.NormalizedMemory.create({
                    sourcePlatformId: PLATFORM_ID,
                    sourceAdapterId:  ADAPTER_ID,
                    importIndex:      i,
                    timestamp:        ts,
                    sender:           sender,
                    senderRole:       senderRole,
                    text:             text,
                    reactions:        [],
                    isAttachmentOnly: false,
                    type:             'message',
                    provenance:       { importedAt: importedAt, adapterVersion: ADAPTER_VERSION }
                }));
            }

            this._lastWarnings = warnings;
            return result;
        },

        import: function (rawText) {
            this._lastWarnings = [];

            if (typeof rawText !== 'string' || !rawText.trim()) {
                return KMEngine.createImportResult({
                    sourcePlatformId: PLATFORM_ID,
                    adapterVersion:   ADAPTER_VERSION,
                    rawCounts:        { total: 0, imported: 0, skipped: 0 }
                });
            }

            var elements = parseElements(rawText);
            var memories = this.normalizeAll(elements);
            var warnings = this._lastWarnings || [];

            var participants = [];
            var seen = {};
            for (var i = 0; i < memories.length; i++) {
                var s = memories[i].sender;
                if (s && !seen[s]) { seen[s] = true; participants.push(s); }
            }

            return KMEngine.createImportResult({
                memories:         memories,
                participants:     participants,
                sourcePlatformId: PLATFORM_ID,
                importWarnings:   warnings,
                rawCounts: {
                    total:    elements.length,
                    imported: memories.length,
                    skipped:  elements.length - memories.length
                },
                adapterVersion: ADAPTER_VERSION
            });
        },

        _lastWarnings: []
    };

    KMEngine.androidSmsAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
