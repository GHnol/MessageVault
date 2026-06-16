(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    var ADAPTER_ID      = 'whatsapp-txt-v1';
    var PLATFORM_ID     = 'whatsapp';
    var ADAPTER_VERSION = '1';

    // Bracket format: [M/D/YY, H:MM:SS AM] Sender: text
    // Hyphen format:  M/D/YY, H:MM AM - Sender: text
    var BRACKET_RE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM))\]\s*/i;
    var HYPHEN_RE  = /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM))\s*-\s*/i;
    var MEDIA_RE   = /^(<Media omitted>|image omitted|video omitted|audio omitted|sticker omitted|GIF omitted)$/i;

    function firstNonEmptyLine(text) {
        var lines = text.split('\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim()) return lines[i].trim();
        }
        return '';
    }

    function tryParseTimestamp(raw) {
        try {
            var d = new Date(raw);
            if (!isNaN(d.getTime())) return d.toISOString();
        } catch (e) {}
        return raw;
    }

    function parseLines(rawText) {
        var lines    = rawText.split('\n');
        var messages = [];
        var current  = null;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var bm   = BRACKET_RE.exec(line);
            var hm   = !bm && HYPHEN_RE.exec(line);

            if (bm || hm) {
                if (current) messages.push(current);
                var rawTs    = bm ? bm[1] : hm[1];
                var rest     = bm ? line.slice(bm[0].length) : line.slice(hm[0].length);
                var colonIdx = rest.indexOf(': ');
                var isSystem = colonIdx === -1;
                current = {
                    rawTs:     rawTs,
                    timestamp: tryParseTimestamp(rawTs),
                    sender:    isSystem ? null : rest.slice(0, colonIdx),
                    text:      isSystem ? rest  : rest.slice(colonIdx + 2),
                    isSystem:  isSystem
                };
            } else if (current !== null && line.trim()) {
                current.text = current.text + '\n' + line;
            }
        }
        if (current) messages.push(current);
        return messages;
    }

    var adapter = {
        id:               ADAPTER_ID,
        sourcePlatformId: PLATFORM_ID,
        label:            'WhatsApp .txt Chat Export v1',

        canHandle: function (input) {
            if (typeof input !== 'string' || !input.trim()) return false;
            var first = firstNonEmptyLine(input);
            return BRACKET_RE.test(first) || HYPHEN_RE.test(first);
        },

        normalizeAll: function (parsedMessages) {
            var warnings   = [];
            var result     = [];
            var importedAt = new Date().toISOString();

            for (var i = 0; i < parsedMessages.length; i++) {
                var m = parsedMessages[i];
                if (m.isSystem) {
                    warnings.push({ index: i, message: 'System message skipped: ' + (m.text || '').slice(0, 80) });
                    continue;
                }
                if (!m.sender || !m.timestamp) {
                    warnings.push({ index: i, message: 'Malformed message skipped — missing sender or timestamp' });
                    continue;
                }
                var isMedia = MEDIA_RE.test((m.text || '').trim());
                result.push(KMEngine.NormalizedMemory.create({
                    sourcePlatformId: PLATFORM_ID,
                    sourceAdapterId:  ADAPTER_ID,
                    importIndex:      i,
                    timestamp:        m.timestamp,
                    sender:           m.sender,
                    senderRole:       'contact',
                    text:             isMedia ? '[Attachment]' : m.text,
                    reactions:        [],
                    isAttachmentOnly: isMedia,
                    type:             isMedia ? 'attachment-placeholder' : 'message',
                    provenance:       { importedAt: importedAt, adapterVersion: ADAPTER_VERSION }
                }));
            }
            this._lastWarnings = warnings;
            return result;
        },

        import: function (rawText) {
            if (typeof rawText !== 'string' || !rawText.trim()) {
                this._lastWarnings = [];
                return KMEngine.createImportResult({
                    sourcePlatformId: PLATFORM_ID,
                    adapterVersion:   ADAPTER_VERSION,
                    rawCounts:        { total: 0, imported: 0, skipped: 0 }
                });
            }

            var parsed   = parseLines(rawText);
            var memories = this.normalizeAll(parsed);
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
                    total:    parsed.length,
                    imported: memories.length,
                    skipped:  parsed.length - memories.length
                },
                adapterVersion: ADAPTER_VERSION
            });
        },

        _lastWarnings: []
    };

    // ── Canonical (hardened, iOS-aware) parse path — Package P2 ──────────────────
    // Built alongside the legacy parseLines()/normalizeAll()/import() path
    // (strangler-fig): the legacy path is untouched. This path produces a
    // KMEngine.CanonicalConversation validated by KMEngine.ImportAdapterContract,
    // and hardens iOS export realities the legacy regexes do not handle:
    // 24-hour clocks, locale date order (M/D vs D/M), the U+202F narrow no-break
    // space before AM/PM, U+200E/U+200F direction marks, multi-line bodies with
    // intentional blank lines, system lines preserved as SystemEvent (not dropped),
    // <attached:> attachments, edited/deleted markers, and diagnostics for anything
    // that cannot be parsed.

    var INVISIBLE_RE = /[\u200E\u200F\u200B\uFEFF\u202A-\u202E\u2066-\u2069]/g
    var WSC          = '[ \\t\\u00A0\\u202F\\u2009\\u200A]';
    var DATE_PART    = '(\\d{1,4}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{1,4})';
    var TIME_PART    = '(\\d{1,2}:\\d{2}(?::\\d{2})?)';
    var AMPM_PART    = '(?:' + WSC + '*([AaPp])\\.?[Mm]\\.?)?';
    var BRACKET_HDR  = new RegExp('^\\[' + WSC + '*' + DATE_PART + ',?' + WSC + '+' + TIME_PART + AMPM_PART + WSC + '*\\]' + WSC + '?(.*)$');
    var HYPHEN_HDR   = new RegExp('^' + DATE_PART + ',?' + WSC + '+' + TIME_PART + AMPM_PART + WSC + '+-' + WSC + '+(.*)$');

    var ATTACHED_IOS_RE = /^<attached:\s*([^>]+)>$/i;
    var ATTACHED_AND_RE = /^(.+?)\s*\(file attached\)$/i;
    var OMITTED_RE      = /^(?:<Media omitted>|image omitted|video omitted|audio omitted|sticker omitted|GIF omitted|document omitted|Contact card omitted|voice message omitted)\.?$/i;
    var LOCATION_RE     = /^location:\s*(\S.*)$/i;
    var EDITED_RE       = new RegExp(WSC + '*<This message was edited>' + WSC + '*$', 'i');
    var DELETED_RE      = /^(?:This message was deleted\.?|You deleted this message\.?)$/i;

    var SYSTEM_PATTERNS = [
        [/end-to-end encrypted/i,                                                  'encryption-notice'],
        [/created (this |the )?group|created group "/i,                            'group-create'],
        [/\badded\b/i,                                                             'add-participant'],
        [/\bremoved\b/i,                                                           'remove-participant'],
        [/\bleft\b/i,                                                              'leave'],
        [/changed the subject/i,                                                   'subject-change'],
        [/changed (this|the) group[’']?s icon|changed the group icon/i,  'icon-change'],
        [/changed their phone number|changed to a new number/i,                    'number-change'],
        [/disappearing messages/i,                                                 'disappearing-messages'],
        [/missed (voice|video) call|\bmissed call\b/i,                             'missed-call'],
        [/this message was deleted|deleted this message/i,                         'deleted-message']
    ];

    // ── Group-chat correctness (Package P4) ─────────────────────────────────────
    // Quote class covers straight and curly quotes (iOS uses curly). Built via
    // new RegExp from a string so the source stays ASCII.
    var QUOTE   = "['\"\\u2018\\u2019\\u201C\\u201D]";
    // "X created group "NAME"" → initial subject; "X changed the subject … to "NAME"" → current subject.
    var GROUP_NAME_RE = new RegExp('created (?:this |the )?group\\s+' + QUOTE + '(.+?)' + QUOTE + '\\s*$', 'i');
    var SUBJECT_RE    = new RegExp('changed the subject(?:\\s+from\\s+' + QUOTE + '.*?' + QUOTE + ')?\\s+to\\s+' + QUOTE + '(.+?)' + QUOTE + '\\s*$', 'i');

    function splitActorNames(s) {
        if (typeof s !== 'string') return [];
        return s.replace(/\.\s*$/, '').split(/\s*,\s*|\s+and\s+/i).map(function (x) { return x.trim(); }).filter(Boolean);
    }

    // Best-effort actor extraction from English iOS system phrasings. Returns the
    // names mentioned (roster evidence); empty when the phrasing is not recognised.
    function extractActors(kind, text) {
        var t = (text || '').trim(), m;
        if (kind === 'group-create'   && (m = /^(.+?)\s+created\s+(?:this |the )?group\b/i.exec(t)))  return [m[1].trim()];
        if (kind === 'add-participant'    && (m = /^(.+?)\s+added\s+(.+)$/i.exec(t)))    return [m[1].trim()].concat(splitActorNames(m[2]));
        if (kind === 'remove-participant' && (m = /^(.+?)\s+removed\s+(.+)$/i.exec(t)))  return [m[1].trim()].concat(splitActorNames(m[2]));
        if (kind === 'leave'          && (m = /^(.+?)\s+left\b/i.exec(t)))                return [m[1].trim()];
        if (kind === 'subject-change' && (m = /^(.+?)\s+changed the subject\b/i.exec(t))) return [m[1].trim()];
        if (kind === 'icon-change'    && (m = /^(.+?)\s+changed (?:this|the) group/i.exec(t))) return [m[1].trim()];
        if (kind === 'number-change'  && (m = /^(.+?)\s+changed (?:their|to a new)/i.exec(t))) return [m[1].trim()];
        return [];
    }

    function matchHeader(line) {
        var m = BRACKET_HDR.exec(line);
        if (m) return { date: m[1], time: m[2], ampm: m[3] || null, rest: m[4] != null ? m[4] : '' };
        m = HYPHEN_HDR.exec(line);
        if (m) return { date: m[1], time: m[2], ampm: m[3] || null, rest: m[4] != null ? m[4] : '' };
        return null;
    }

    function splitDate(dateStr) { return dateStr.split(/[\/.\-]/); }

    function dateEvidence(parts) {
        if (parts.length !== 3) return null;
        if (parts[0].length === 4) return 'YMD';
        var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10);
        if (a > 12 && b <= 12) return 'DMY';
        if (b > 12 && a <= 12) return 'MDY';
        return null;
    }

    function detectOrder(headerDates, optOrder) {
        var dmy = 0, mdy = 0, ymd = 0;
        for (var i = 0; i < headerDates.length; i++) {
            var ev = dateEvidence(splitDate(headerDates[i]));
            if (ev === 'DMY') dmy++; else if (ev === 'MDY') mdy++; else if (ev === 'YMD') ymd++;
        }
        if (optOrder === 'MDY' || optOrder === 'DMY' || optOrder === 'YMD') {
            return { order: optOrder, dmy: dmy, mdy: mdy, ymd: ymd, forced: true };
        }
        var order;
        if (dmy > 0 && mdy === 0)      order = 'DMY';
        else if (mdy > 0 && dmy === 0) order = 'MDY';
        else if (dmy > 0 && mdy > 0)   order = dmy >= mdy ? 'DMY' : 'MDY';
        else                           order = 'MDY';
        return { order: order, dmy: dmy, mdy: mdy, ymd: ymd, forced: false };
    }

    function parseDateParts(dateStr, order) {
        var parts = splitDate(dateStr);
        if (parts.length !== 3) return null;
        var y, mo, d, ambiguous = false;
        if (parts[0].length === 4) {
            y = parseInt(parts[0], 10); mo = parseInt(parts[1], 10); d = parseInt(parts[2], 10);
        } else {
            var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10), yy = parseInt(parts[2], 10);
            y = parts[2].length === 4 ? yy : (yy < 100 ? 2000 + yy : yy);
            if (a > 12 && b <= 12)      { d = a; mo = b; }
            else if (b > 12 && a <= 12) { mo = a; d = b; }
            else {
                ambiguous = true;
                if (order === 'DMY') { d = a; mo = b; } else { mo = a; d = b; }
            }
        }
        if (isNaN(y) || isNaN(mo) || isNaN(d) || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
        return { year: y, month: mo, day: d, ambiguous: ambiguous };
    }

    function parseTimeParts(timeStr, ampm) {
        var m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timeStr);
        if (!m) return null;
        var hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), ss = m[3] ? parseInt(m[3], 10) : 0;
        if (ampm) {
            var p = ampm.toUpperCase();
            if (p === 'P' && hh < 12) hh += 12;
            else if (p === 'A' && hh === 12) hh = 0;
        }
        if (hh > 23 || mm > 59 || ss > 59) return null;
        return { hh: hh, mm: mm, ss: ss };
    }

    function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }

    function toIso(d, t) {
        return pad(d.year, 4) + '-' + pad(d.month, 2) + '-' + pad(d.day, 2) +
               'T' + pad(t.hh, 2) + ':' + pad(t.mm, 2) + ':' + pad(t.ss, 2) + '.000Z';
    }

    function classifySystem(text) {
        var t = text || '';
        for (var i = 0; i < SYSTEM_PATTERNS.length; i++) {
            if (SYSTEM_PATTERNS[i][0].test(t)) return SYSTEM_PATTERNS[i][1];
        }
        return 'unknown';
    }

    function kindFromOmitted(text) {
        var t = text.toLowerCase();
        if (t.indexOf('image') !== -1)   return 'image';
        if (t.indexOf('video') !== -1)   return 'video';
        if (t.indexOf('voice') !== -1)   return 'voice';
        if (t.indexOf('audio') !== -1)   return 'audio';
        if (t.indexOf('sticker') !== -1) return 'sticker';
        if (t.indexOf('gif') !== -1)     return 'gif';
        if (t.indexOf('document') !== -1) return 'document';
        if (t.indexOf('contact') !== -1) return 'contact';
        return 'document';
    }

    function kindFromFilename(name) {
        var m = /\.([A-Za-z0-9]+)$/.exec(name || '');
        var ext = m ? m[1].toLowerCase() : '';
        if (['jpg', 'jpeg', 'png', 'heic', 'webp', 'bmp'].indexOf(ext) !== -1) return 'image';
        if (ext === 'gif')                                                     return 'gif';
        if (['mp4', 'mov', 'avi', 'mkv', '3gp', 'm4v'].indexOf(ext) !== -1)    return 'video';
        if (ext === 'opus')                                                    return 'voice';
        if (['mp3', 'm4a', 'aac', 'amr', 'ogg', 'wav'].indexOf(ext) !== -1)    return 'audio';
        if (ext === 'vcf')                                                     return 'contact';
        return 'document';
    }

    // ── Self-identification + participant mapping (Package P3) ──────────────────
    // The caller passes opts.self to set participant-level isSelf on the canonical
    // output deterministically — no post-import UI patching. opts.self accepts:
    //   - a string: participant id ('par-…'), display name, or phone-like label
    //   - an object: { id|participantId, displayName|name, aliases[], handle|phone }
    //   - an array of the above (several identifiers for the SAME self person)
    // Only the uniquely-matching participant is flipped to isSelf. Ambiguous,
    // no-match, and invalid options leave every participant non-self and are
    // recorded in diagnostics so a one-sided collapse can never be hidden.

    function normalizeName(s) {
        if (typeof s !== 'string') return '';
        var t = s.replace(INVISIBLE_RE, '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (t.normalize) t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return t;
    }

    function phoneDigits(s) {
        return typeof s === 'string' ? s.replace(/[^\d]/g, '') : '';
    }

    function isPhoneLike(s) {
        if (typeof s !== 'string') return false;
        var t = s.trim();
        return phoneDigits(t).length >= 7 && /^[+(]?\d[\d\s().+-]*$/.test(t);
    }

    function phonesMatch(a, b) {
        var da = phoneDigits(a), db = phoneDigits(b);
        if (!da || !db) return false;
        if (da === db) return true;
        var n = Math.min(da.length, db.length, 10);
        return n >= 7 && da.slice(-n) === db.slice(-n);
    }

    function buildSelfDescriptor(opt) {
        if (opt == null) return { empty: true };
        if (typeof opt === 'string') {
            var s = opt.trim();
            if (!s) return { invalid: true };
            var d = { id: /^par-/.test(s) ? s : null, primaryNames: [s], aliasNames: [], phones: [] };
            if (isPhoneLike(s)) d.phones.push(s);
            return d;
        }
        if (Array.isArray(opt)) {
            var merged = { id: null, primaryNames: [], aliasNames: [], phones: [] };
            var any = false;
            for (var i = 0; i < opt.length; i++) {
                var sub = buildSelfDescriptor(opt[i]);
                if (sub.invalid || sub.empty) continue;
                any = true;
                if (sub.id && !merged.id) merged.id = sub.id;
                merged.primaryNames = merged.primaryNames.concat(sub.primaryNames);
                merged.aliasNames   = merged.aliasNames.concat(sub.aliasNames);
                merged.phones       = merged.phones.concat(sub.phones);
            }
            return any ? merged : { invalid: true };
        }
        if (typeof opt === 'object') {
            var o = { id: null, primaryNames: [], aliasNames: [], phones: [] };
            if (typeof opt.id === 'string' && opt.id.trim()) o.id = opt.id.trim();
            if (!o.id && typeof opt.participantId === 'string' && opt.participantId.trim()) o.id = opt.participantId.trim();
            if (typeof opt.displayName === 'string' && opt.displayName.trim()) o.primaryNames.push(opt.displayName);
            if (typeof opt.name === 'string' && opt.name.trim()) o.primaryNames.push(opt.name);
            var aliases = Array.isArray(opt.aliases) ? opt.aliases : [];
            for (var a = 0; a < aliases.length; a++) {
                if (typeof aliases[a] === 'string' && aliases[a].trim()) o.aliasNames.push(aliases[a]);
            }
            if (typeof opt.handle === 'string' && opt.handle.trim()) o.phones.push(opt.handle);
            if (typeof opt.phone === 'string' && opt.phone.trim()) o.phones.push(opt.phone);
            for (var p = 0; p < o.primaryNames.length; p++) {
                if (isPhoneLike(o.primaryNames[p])) o.phones.push(o.primaryNames[p]);
            }
            if (!o.id && !o.primaryNames.length && !o.aliasNames.length && !o.phones.length) return { invalid: true };
            return o;
        }
        return { invalid: true };
    }

    // Returns the highest-priority match method for a participant, or null.
    function matchSelfMethod(participant, desc) {
        var i;
        if (desc.id && participant.id === desc.id) return 'participant-id';
        var pName = participant.displayName || '';
        var pNorm = normalizeName(pName);
        for (i = 0; i < desc.primaryNames.length; i++) {
            if (desc.primaryNames[i] === pName) return 'exact-name';
        }
        for (i = 0; i < desc.primaryNames.length; i++) {
            if (pNorm && normalizeName(desc.primaryNames[i]) === pNorm) return 'normalized-name';
        }
        var pAliases = [];
        var pa = participant.aliases || [];
        for (i = 0; i < pa.length; i++) pAliases.push(normalizeName(pa[i]));
        for (i = 0; i < desc.aliasNames.length; i++) {
            var an = normalizeName(desc.aliasNames[i]);
            if (an && (an === pNorm || pAliases.indexOf(an) !== -1)) return 'alias';
        }
        for (i = 0; i < desc.primaryNames.length; i++) {
            var pn = normalizeName(desc.primaryNames[i]);
            if (pn && pAliases.indexOf(pn) !== -1) return 'alias';
        }
        for (i = 0; i < desc.phones.length; i++) {
            if (phonesMatch(desc.phones[i], pName) || (participant.handle && phonesMatch(desc.phones[i], participant.handle))) return 'phone';
        }
        return null;
    }

    // Flip isSelf on the uniquely-matching participant; record diagnostics.
    function resolveSelf(participants, selfOpt, warnings) {
        var none = { identified: false, method: null, ambiguous: false, candidateCount: 0 };
        if (selfOpt == null) return none;
        var desc = buildSelfDescriptor(selfOpt);
        if (desc.empty) return none;
        if (desc.invalid) {
            warnings.push({ code: 'INVALID_SELF_OPTION', message: 'opts.self had no usable id / name / handle' });
            return none;
        }
        var matches = [];
        for (var i = 0; i < participants.length; i++) {
            var m = matchSelfMethod(participants[i], desc);
            if (m) matches.push({ p: participants[i], method: m });
        }
        if (matches.length === 0) {
            warnings.push({ code: 'NO_SELF_MATCH', message: 'opts.self matched no participant' });
            return none;
        }
        if (matches.length > 1) {
            warnings.push({ code: 'MULTIPLE_SELF_MATCHES', candidateIds: matches.map(function (x) { return x.p.id; }) });
            return { identified: false, method: null, ambiguous: true, candidateCount: matches.length };
        }
        matches[0].p.isSelf = true;
        var method = matches[0].method;
        if (method === 'alias' || method === 'normalized-name' || method === 'phone') {
            warnings.push({ code: 'SELF_MATCH_BY_' + method.toUpperCase().replace(/-/g, '_'), participantId: matches[0].p.id });
        }
        return { identified: true, method: method, ambiguous: false, candidateCount: 1 };
    }

    // Produce a canonical Conversation (validated against the adapter contract).
    // Never throws; non-WhatsApp or empty input yields an empty-but-valid Conversation.
    adapter.toCanonical = function (rawText, opts) {
        opts = opts || {};
        var CC       = KMEngine.CanonicalConversation;
        var Contract = KMEngine.ImportAdapterContract;

        var importedAt     = opts.importedAt || new Date().toISOString();
        var warnings       = [];
        var unparsedLines  = [];
        var skipReasons    = [];
        var ambiguousDates = [];

        var lines = (typeof rawText === 'string') ? rawText.split(/\r\n|\r|\n/) : [];

        // Pass 1 — tokenize into header groups, preserving multi-line bodies
        // including intentional blank lines (the legacy parser dropped these).
        var groups  = [];
        var current = null;
        for (var i = 0; i < lines.length; i++) {
            var rawLine = lines[i];
            var clean   = rawLine.replace(INVISIBLE_RE, '');
            var hdr     = matchHeader(clean);
            if (hdr) {
                current = {
                    date: hdr.date, time: hdr.time, ampm: hdr.ampm,
                    bodyLines: [hdr.rest], raw: rawLine, index: groups.length
                };
                groups.push(current);
            } else if (current) {
                // Drop only the empty line produced by a file-final newline.
                if (i === lines.length - 1 && rawLine === '') continue;
                current.bodyLines.push(clean);
            } else if (rawLine.trim()) {
                unparsedLines.push({ index: i, line: rawLine.trim() });
            }
        }

        var headerDates = [];
        for (var g = 0; g < groups.length; g++) headerDates.push(groups[g].date);
        var orderInfo = detectOrder(headerDates, opts.dateOrder);

        // Pass 2 — build participants, messages, and system events.
        var participants     = [];
        var participantIndex = {};
        var messages         = [];
        var systemEvents     = [];
        var mediaCount = 0, deletedCount = 0;
        var sawH12 = false, sawH24 = false;

        function getParticipant(name) {
            if (Object.prototype.hasOwnProperty.call(participantIndex, name)) return participantIndex[name];
            var par = CC.createParticipant({ displayName: name, isSelf: false });
            participantIndex[name] = par;
            participants.push(par);
            return par;
        }

        for (var k = 0; k < groups.length; k++) {
            var grp      = groups[k];
            var headLine = grp.bodyLines[0] || '';
            var restLines = grp.bodyLines.slice(1);
            if (grp.ampm) sawH12 = true; else sawH24 = true;

            var dParts = parseDateParts(grp.date, orderInfo.order);
            var tParts = parseTimeParts(grp.time, grp.ampm);
            var rawTs  = grp.date + ', ' + grp.time + (grp.ampm ? ' ' + grp.ampm.toUpperCase() + 'M' : '');
            var iso = null, tzAssumption = null;
            if (dParts && tParts) {
                iso = toIso(dParts, tParts);
                tzAssumption = 'naive-local-as-utc';
                if (dParts.ambiguous) ambiguousDates.push({ index: grp.index, rawTs: grp.date, chosen: orderInfo.order });
            } else {
                warnings.push({ index: grp.index, code: 'BAD_TIMESTAMP', message: 'Unparseable timestamp: ' + rawTs });
            }

            var headColon = headLine.indexOf(': ');
            var sender    = headColon === -1 ? '' : headLine.slice(0, headColon);

            if (headColon === -1 || !sender.trim()) {
                // No "Sender: " on the header line → a system line. Preserved, not dropped.
                var sysText = grp.bodyLines.join('\n');
                var sysKind = headColon === -1 ? classifySystem(sysText) : 'unknown';
                systemEvents.push(CC.createSystemEvent({
                    kind: sysKind, timestamp: iso, text: sysText,
                    actors: extractActors(sysKind, sysText), raw: grp.raw
                }));
                continue;
            }

            var firstBody = headLine.slice(headColon + 2);
            var fullText  = restLines.length ? [firstBody].concat(restLines).join('\n') : firstBody;

            var par  = getParticipant(sender);
            par.messageCount += 1;

            var type = 'text', media = [], isEdited = false, isDeleted = false, text = fullText, mm2;

            if (DELETED_RE.test(fullText.trim())) {
                type = 'deleted'; isDeleted = true; deletedCount++;
            } else if ((mm2 = ATTACHED_IOS_RE.exec(firstBody.trim())) || (mm2 = ATTACHED_AND_RE.exec(firstBody.trim()))) {
                var fname = mm2[1].trim();
                media.push(CC.createMediaAttachment({
                    kind: kindFromFilename(fname), filename: fname, sourceRef: fname,
                    present: null, placeholderReason: 'referenced-in-text'
                }));
                type = 'media'; mediaCount++;
                var cap = restLines.length ? restLines.join('\n') : '';
                text = cap.trim() ? cap : null;
            } else if (OMITTED_RE.test(firstBody.trim())) {
                media.push(CC.createMediaAttachment({
                    kind: kindFromOmitted(firstBody.trim()), present: false, placeholderReason: 'omitted'
                }));
                type = 'media'; mediaCount++;
                text = null;
            } else if ((mm2 = LOCATION_RE.exec(firstBody.trim()))) {
                media.push(CC.createMediaAttachment({
                    kind: 'location', sourceRef: mm2[1].trim(), present: false, placeholderReason: 'location'
                }));
                type = 'media'; mediaCount++;
            } else if (EDITED_RE.test(fullText)) {
                isEdited = true;
                text = fullText.replace(EDITED_RE, '');
            }

            messages.push(CC.createMessage({
                participantId: par.id,
                timestamp:     iso,
                rawTs:         rawTs,
                tzAssumption:  tzAssumption,
                type:          type,
                text:          text,
                media:         media,
                reactions:     [],
                replyTo:       CC.createReply({ available: false }),
                isEdited:      isEdited,
                isDeleted:     isDeleted,
                importIndex:   messages.length,
                raw:           grp.raw
            }));
        }

        var hourCycle = sawH12 && sawH24 ? 'mixed' : (sawH12 ? 'h12' : (sawH24 ? 'h24' : null));

        // ── Group detection + title / roster inference (Package P4) ────────────
        // Distinct human speakers are the participants; system events add evidence.
        // Strong evidence (>2 speakers, group create, add/remove) → certainly a
        // group. Moderate (leave) and weak (subject/icon change) still imply a
        // group (none of these occur in a 1:1) but a weak-only basis is flagged.
        var speakerCount   = participants.length;
        var groupEvidence  = [];
        var rosterSet      = {};
        var rosterEvidence = [];
        var inferredTitle  = null;
        var hasStrong = speakerCount > 2, hasModerate = false, hasWeak = false;
        if (hasStrong) groupEvidence.push('multiple-speakers');

        function noteEvidence(code) { if (groupEvidence.indexOf(code) === -1) groupEvidence.push(code); }

        for (var se = 0; se < systemEvents.length; se++) {
            var ev = systemEvents[se];
            for (var ai = 0; ai < ev.actors.length; ai++) {
                var nm = ev.actors[ai];
                if (nm && !Object.prototype.hasOwnProperty.call(rosterSet, nm)) { rosterSet[nm] = true; rosterEvidence.push(nm); }
            }
            if (ev.kind === 'group-create')                                    { hasStrong = true; noteEvidence('group-create'); }
            else if (ev.kind === 'add-participant' || ev.kind === 'remove-participant') { hasStrong = true; noteEvidence('add-remove-participant'); }
            else if (ev.kind === 'leave')                                      { hasModerate = true; noteEvidence('leave'); }
            else if (ev.kind === 'subject-change')                             { hasWeak = true; noteEvidence('subject-change'); }
            else if (ev.kind === 'icon-change')                                { hasWeak = true; noteEvidence('icon-change'); }

            var tm;
            if (ev.kind === 'subject-change' && (tm = SUBJECT_RE.exec(ev.text || '')))     inferredTitle = tm[1].trim();
            else if (ev.kind === 'group-create' && (tm = GROUP_NAME_RE.exec(ev.text || ''))) inferredTitle = tm[1].trim();
        }

        var isGroup, groupInferred = false;
        if (opts.isGroup === true || opts.isGroup === false) {
            isGroup = opts.isGroup;
        } else {
            isGroup = hasStrong || hasModerate || hasWeak;
            groupInferred = isGroup;
        }
        if (isGroup && groupInferred && !hasStrong && !hasModerate && hasWeak) {
            warnings.push({ code: 'WEAK_GROUP_EVIDENCE', evidence: groupEvidence.slice() });
        }

        // Participant-level self-identification (Package P3). Mutates the
        // uniquely-matching participant's isSelf; non-self speakers stay distinct.
        var selfResult = resolveSelf(participants, opts.self, warnings);

        var skipped = groups.length - messages.length - systemEvents.length;
        if (skipped < 0) skipped = 0;

        var confidence;
        if (groups.length === 0)            confidence = null;
        else if (ambiguousDates.length === 0) confidence = 1;
        else if (orderInfo.forced)          confidence = 0.9;
        else if (orderInfo.dmy + orderInfo.mdy > 0) confidence = 0.75;
        else                                confidence = 0.5;

        var diagnostics = CC.createImportDiagnostics({
            counts: {
                total:    groups.length,
                imported: messages.length,
                skipped:  skipped,
                system:   systemEvents.length,
                media:    mediaCount,
                deleted:  deletedCount,
                unparsed: unparsedLines.length
            },
            skipReasons:      skipReasons,
            unparsedLines:    unparsedLines,
            ambiguousDates:   ambiguousDates,
            mediaMissing:       [],
            selfIdentified:     selfResult.identified,
            selfMatchMethod:    selfResult.method,
            selfMatchAmbiguous: selfResult.ambiguous,
            selfCandidateCount: selfResult.candidateCount,
            groupInferred:      groupInferred,
            groupEvidence:      groupEvidence,
            rosterEvidence:     rosterEvidence,
            formatConfidence:   confidence,
            warnings:           warnings
        });

        var source = CC.createSourceMetadata({
            platform:           PLATFORM_ID,
            exportVariant:      opts.exportVariant || 'ios',
            originalFilename:   opts.originalFilename || null,
            detectedDateFormat: groups.length ? orderInfo.order : null,
            detectedLocale:     null,
            hourCycle:          hourCycle,
            fileHash:           null,
            importedAt:         importedAt,
            adapterId:          ADAPTER_ID,
            adapterVersion:     ADAPTER_VERSION
        });

        var conv = CC.createConversation({
            platform:      PLATFORM_ID,
            exportVariant: opts.exportVariant || 'ios',
            isGroup:       isGroup,
            title:         opts.title || inferredTitle || null,
            participants:  participants,
            messages:      messages,
            systemEvents:  systemEvents,
            source:        source,
            diagnostics:   diagnostics
        });

        for (var mi = 0; mi < conv.messages.length; mi++) conv.messages[mi].conversationId = conv.id;
        for (var si = 0; si < conv.systemEvents.length; si++) conv.systemEvents[si].conversationId = conv.id;

        if (Contract && typeof Contract.validateConversation === 'function') {
            var v = Contract.validateConversation(conv);
            if (!v.valid) diagnostics.warnings.push({ code: 'CONTRACT_INVALID', errors: v.errors });
        }

        return conv;
    };

    KMEngine.whatsappTxtAdapter = adapter;
    KMEngine.adapters[ADAPTER_ID] = adapter;
}());
