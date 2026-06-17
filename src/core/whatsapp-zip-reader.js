(function () {
    'use strict';
    var KMEngine = window.KMEngine = window.KMEngine || {};

    // Zero-dependency WhatsApp export ZIP reader (Package P5A spike).
    //
    // Reads the central directory only — never decompresses media bytes. The engine
    // needs the decompressed _chat.txt plus a name+size manifest for media; media is
    // represented as links/placeholders, not rendered here. Reading from the central
    // directory (not local headers) sidesteps the data-descriptor problem (GP bit 3),
    // since the central directory always carries the real sizes.
    //
    // Supported: method 0 (stored) and method 8 (raw DEFLATE, via DecompressionStream
    // 'deflate-raw'). Everything outside that envelope is rejected/diagnosed loudly
    // rather than guessed: encryption, ZIP64, unsupported methods, missing central
    // directory, no/multiple chat text files, duplicate media names.

    var SIG_EOCD            = 0x06054b50;
    var SIG_CEN             = 0x02014b50;
    var SIG_LOC             = 0x04034b50;
    var SIG_ZIP64_EOCD_LOC  = 0x07064b50;

    var METHOD_STORED  = 0;
    var METHOD_DEFLATE = 8;

    var SENTINEL_32 = 0xFFFFFFFF;
    var SENTINEL_16 = 0xFFFF;

    var FLAG_ENCRYPTED = 0x0001;
    var FLAG_UTF8      = 0x0800;

    // Realm-robust normalisation: works across vm/browser realms (ArrayBuffer.isView
    // and Object.prototype.toString are brand checks, not prototype identity checks).
    function asBytes(input) {
        if (input == null) return null;
        if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        if (Object.prototype.toString.call(input) === '[object ArrayBuffer]') return new Uint8Array(input);
        return null;
    }

    function viewOf(bytes) {
        return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    }

    // Manual UTF-8 decode — keeps central-directory parsing free of any Web API so it
    // runs in a bare realm (browser, Node, vm sandbox) with no injected globals.
    function decodeUtf8(bytes, start, len) {
        var out = '', i = start, end = start + len;
        while (i < end) {
            var c = bytes[i++];
            if (c < 0x80) {
                out += String.fromCharCode(c);
            } else if (c >= 0xC0 && c < 0xE0) {
                out += String.fromCharCode(((c & 0x1F) << 6) | (bytes[i++] & 0x3F));
            } else if (c >= 0xE0 && c < 0xF0) {
                out += String.fromCharCode(((c & 0x0F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F));
            } else {
                var cp = ((c & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F);
                cp -= 0x10000;
                out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
            }
        }
        return out;
    }

    // CP437/latin-1 best-effort fallback for names without the UTF-8 flag.
    function decodeLatin1(bytes, start, len) {
        var out = '';
        for (var i = start; i < start + len; i++) out += String.fromCharCode(bytes[i]);
        return out;
    }

    function basename(name) {
        var s = String(name == null ? '' : name);
        var cut = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
        return cut === -1 ? s : s.slice(cut + 1);
    }

    // Scan backwards for the EOCD signature, validating the trailing comment length
    // so signature bytes inside file data are not mistaken for the EOCD.
    function findEocd(bytes, dv) {
        var n = bytes.length;
        if (n < 22) return -1;
        var min = Math.max(0, n - 22 - SENTINEL_16);
        for (var i = n - 22; i >= min; i--) {
            if (dv.getUint32(i, true) !== SIG_EOCD) continue;
            var commentLen = dv.getUint16(i + 20, true);
            if (i + 22 + commentLen === n) return i;
        }
        return -1;
    }

    function readCentralDirectory(input) {
        var diagnostics = [];
        var bytes = asBytes(input);
        if (!bytes || bytes.length === 0) {
            return { ok: false, reason: 'EMPTY_INPUT', entries: [], diagnostics: diagnostics };
        }
        var dv = viewOf(bytes);
        var eocd = findEocd(bytes, dv);
        if (eocd === -1) {
            return { ok: false, reason: 'NO_CENTRAL_DIRECTORY', entries: [], diagnostics: diagnostics };
        }

        var totalEntries = dv.getUint16(eocd + 10, true);
        var cdSize       = dv.getUint32(eocd + 12, true);
        var cdOffset     = dv.getUint32(eocd + 16, true);

        var zip64 = (totalEntries === SENTINEL_16 || cdSize === SENTINEL_32 || cdOffset === SENTINEL_32);
        if (!zip64 && eocd >= 20 && dv.getUint32(eocd - 20, true) === SIG_ZIP64_EOCD_LOC) zip64 = true;
        if (zip64) {
            return { ok: false, reason: 'ARCHIVE_ZIP64_UNSUPPORTED', entries: [], diagnostics: diagnostics };
        }
        if (cdOffset >= bytes.length || cdOffset + cdSize > bytes.length) {
            return { ok: false, reason: 'NO_CENTRAL_DIRECTORY', entries: [], diagnostics: diagnostics };
        }

        var entries = [];
        var encryptedAny = false;
        var p = cdOffset;
        for (var e = 0; e < totalEntries; e++) {
            if (p + 46 > bytes.length || dv.getUint32(p, true) !== SIG_CEN) {
                diagnostics.push({ code: 'TRUNCATED_CENTRAL_DIRECTORY', index: e });
                break;
            }
            var flags    = dv.getUint16(p + 8, true);
            var method   = dv.getUint16(p + 10, true);
            var compSize = dv.getUint32(p + 20, true);
            var uncSize  = dv.getUint32(p + 24, true);
            var nameLen  = dv.getUint16(p + 28, true);
            var extraLen = dv.getUint16(p + 30, true);
            var cmtLen   = dv.getUint16(p + 32, true);
            var localOff = dv.getUint32(p + 42, true);

            if (compSize === SENTINEL_32 || uncSize === SENTINEL_32 || localOff === SENTINEL_32) {
                return { ok: false, reason: 'ARCHIVE_ZIP64_UNSUPPORTED', entries: [], diagnostics: diagnostics };
            }

            var utf8      = (flags & FLAG_UTF8) !== 0;
            var encrypted = (flags & FLAG_ENCRYPTED) !== 0;
            if (encrypted) encryptedAny = true;

            var nameStart = p + 46;
            var name = utf8 ? decodeUtf8(bytes, nameStart, nameLen) : decodeLatin1(bytes, nameStart, nameLen);
            var isDir = nameLen > 0 && bytes[nameStart + nameLen - 1] === 0x2F;

            entries.push({
                name:             name,
                basename:         basename(name),
                method:           method,
                compressedSize:   compSize,
                uncompressedSize: uncSize,
                localOffset:      localOff,
                utf8:             utf8,
                encrypted:        encrypted,
                isDirectory:      isDir
            });
            p = nameStart + nameLen + extraLen + cmtLen;
        }

        if (encryptedAny) {
            return { ok: false, reason: 'ARCHIVE_ENCRYPTED', entries: entries, diagnostics: diagnostics };
        }
        return { ok: true, entries: entries, diagnostics: diagnostics, totalEntries: totalEntries };
    }

    // Locate the chat text file. Prefer an exact _chat.txt; reject zero or multiple
    // plausible candidates rather than guessing (P5A acceptance #3).
    function findChatTxt(entries) {
        var files = [];
        for (var i = 0; i < entries.length; i++) {
            if (entries[i] && !entries[i].isDirectory) files.push(entries[i]);
        }
        var exact = files.filter(function (e) { return e.basename.toLowerCase() === '_chat.txt'; });
        if (exact.length === 1) return { ok: true, entry: exact[0], candidates: exact };
        if (exact.length > 1)  return { ok: false, reason: 'MULTIPLE_TXT_IN_ARCHIVE', entry: null, candidates: exact };

        var txts = files.filter(function (e) { return /\.txt$/i.test(e.basename); });
        if (txts.length === 0) return { ok: false, reason: 'NO_CHAT_TXT_IN_ARCHIVE', entry: null, candidates: [] };
        if (txts.length === 1) return { ok: true, entry: txts[0], candidates: txts };
        return { ok: false, reason: 'MULTIPLE_TXT_IN_ARCHIVE', entry: null, candidates: txts };
    }

    // Manifest of media entries (name + size + method), WITHOUT decompressing any
    // media bytes. First occurrence of a basename wins; duplicates are diagnosed.
    function buildMediaManifest(entries, chatEntry) {
        var manifest = [];
        var diagnostics = [];
        var seen = {};
        var chatName = chatEntry ? chatEntry.name : null;
        for (var i = 0; i < entries.length; i++) {
            var en = entries[i];
            if (!en || en.isDirectory) continue;
            if (chatName && en.name === chatName) continue;
            var key = en.basename.toLowerCase();
            if (Object.prototype.hasOwnProperty.call(seen, key)) {
                diagnostics.push({ code: 'DUPLICATE_ARCHIVE_ENTRY', basename: en.basename, name: en.name });
                continue;
            }
            seen[key] = true;
            if (en.method !== METHOD_STORED && en.method !== METHOD_DEFLATE) {
                diagnostics.push({ code: 'UNSUPPORTED_COMPRESSION', name: en.name, method: en.method });
            }
            manifest.push({
                name:           en.name,
                basename:       en.basename,
                byteSize:       en.uncompressedSize,
                compressedSize: en.compressedSize,
                method:         en.method,
                present:        true
            });
        }
        return { manifest: manifest, diagnostics: diagnostics };
    }

    function localDataStart(bytes, dv, entry) {
        var off = entry.localOffset;
        if (off + 30 > bytes.length || dv.getUint32(off, true) !== SIG_LOC) return -1;
        var nameLen  = dv.getUint16(off + 26, true);
        var extraLen = dv.getUint16(off + 28, true);
        return off + 30 + nameLen + extraLen;
    }

    function inflateAvailable() {
        return typeof DecompressionStream !== 'undefined' && typeof Response !== 'undefined';
    }

    function inflateRaw(slice) {
        var ds = new DecompressionStream('deflate-raw');
        var stream = new Response(slice).body.pipeThrough(ds);
        return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
    }

    // Decompress a single entry's bytes. Async to accommodate DecompressionStream;
    // method 0 resolves synchronously-ish via a resolved Promise. Never throws.
    function extractEntryBytes(input, entry) {
        var bytes = asBytes(input);
        if (!bytes) return Promise.resolve({ ok: false, reason: 'BAD_INPUT' });
        if (!entry) return Promise.resolve({ ok: false, reason: 'BAD_ENTRY' });
        if (entry.encrypted) return Promise.resolve({ ok: false, reason: 'ARCHIVE_ENCRYPTED' });
        var dv = viewOf(bytes);
        var start = localDataStart(bytes, dv, entry);
        if (start === -1) return Promise.resolve({ ok: false, reason: 'BAD_LOCAL_HEADER' });
        var end = start + entry.compressedSize;
        if (end > bytes.length) return Promise.resolve({ ok: false, reason: 'TRUNCATED_ENTRY' });
        var slice = bytes.subarray(start, end);
        if (entry.method === METHOD_STORED) {
            return Promise.resolve({ ok: true, bytes: slice.slice() });
        }
        if (entry.method === METHOD_DEFLATE) {
            if (!inflateAvailable()) return Promise.resolve({ ok: false, reason: 'DECOMPRESSION_UNAVAILABLE' });
            return inflateRaw(slice).then(
                function (out) { return { ok: true, bytes: out }; },
                function ()    { return { ok: false, reason: 'DECOMPRESSION_FAILED' }; }
            );
        }
        return Promise.resolve({ ok: false, reason: 'UNSUPPORTED_COMPRESSION', method: entry.method });
    }

    function extractText(input, entry) {
        return extractEntryBytes(input, entry).then(function (r) {
            if (!r.ok) return r;
            var b = r.bytes;
            var start = (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) ? 3 : 0;
            var text;
            if (typeof TextDecoder !== 'undefined') {
                text = new TextDecoder('utf-8').decode(start ? b.subarray(start) : b);
            } else {
                text = decodeUtf8(b, start, b.length - start);
            }
            return { ok: true, text: text };
        });
    }

    // High-level: bytes -> { ok, chatText, mediaManifest, entries, chatEntry, diagnostics }.
    // Decompresses only the chat text; media stays a manifest. Returns ok:false with a
    // reason for any rejection, leaving the caller to fall back to a text-only path.
    function readArchive(input, opts) {
        opts = opts || {};
        var cd = readCentralDirectory(input);
        if (!cd.ok) {
            return Promise.resolve({ ok: false, reason: cd.reason, entries: cd.entries || [], diagnostics: cd.diagnostics || [] });
        }
        var diagnostics = cd.diagnostics.slice();
        var chat = findChatTxt(cd.entries);
        if (!chat.ok) {
            return Promise.resolve({ ok: false, reason: chat.reason, entries: cd.entries, candidates: chat.candidates || [], diagnostics: diagnostics });
        }
        var mm = buildMediaManifest(cd.entries, chat.entry);
        for (var d = 0; d < mm.diagnostics.length; d++) diagnostics.push(mm.diagnostics[d]);
        return extractText(input, chat.entry).then(function (tr) {
            if (!tr.ok) {
                return { ok: false, reason: tr.reason, entries: cd.entries, chatEntry: chat.entry, mediaManifest: mm.manifest, diagnostics: diagnostics };
            }
            return {
                ok:            true,
                chatText:      tr.text,
                chatEntry:     chat.entry,
                mediaManifest: mm.manifest,
                entries:       cd.entries,
                diagnostics:   diagnostics
            };
        });
    }

    KMEngine.WhatsAppZip = {
        METHOD_STORED:        METHOD_STORED,
        METHOD_DEFLATE:       METHOD_DEFLATE,
        readCentralDirectory: readCentralDirectory,
        findChatTxt:          findChatTxt,
        buildMediaManifest:   buildMediaManifest,
        extractEntryBytes:    extractEntryBytes,
        extractText:          extractText,
        readArchive:          readArchive,
        basename:             basename,
        decodeUtf8:           decodeUtf8
    };
}());
