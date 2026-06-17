/**
 * WhatsApp ZIP reader tests (Package P5A — native no-dependency spike).
 * Run with: node src/tests/whatsapp-zip-reader-tests.mjs
 *
 * Synthetic ZIP archives are built IN MEMORY with Node built-ins (zlib.deflateRawSync
 * for method 8; raw byte assembly for method 0). No binary fixture is committed, and
 * no dependency is used. Web APIs (DecompressionStream/Response/TextDecoder) are
 * injected into the vm sandbox so the engine's deflate path can be exercised.
 */

import { createContext, runInContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

function load(ctx, relPath) {
    runInContext(readFileSync(join(__dirname, '../../', relPath), 'utf8'), ctx);
}

const MODULES = [
    'src/core/source-platforms.js',
    'src/core/normalized-memory.js',
    'src/core/import-adapters.js',
    'src/core/canonical-conversation.js',
    'src/core/import-adapter-contract.js',
    'src/core/whatsapp-zip-reader.js',
    'src/adapters/whatsapp-txt-adapter.js'
];

// globals lets a suite control which Web APIs the engine sees — e.g. omit
// DecompressionStream to exercise the decompression-unavailable path deterministically.
function makeCtx(globals) {
    const ctx = createContext(Object.assign({ window: {}, console }, globals || {}));
    for (const m of MODULES) load(ctx, m);
    return ctx.window.KMEngine;
}

const FULL_GLOBALS = {
    DecompressionStream: globalThis.DecompressionStream,
    Response: globalThis.Response,
    TextDecoder: globalThis.TextDecoder
};

const KMEngine = makeCtx(FULL_GLOBALS);
const Zip     = KMEngine.WhatsAppZip;
const adapter = KMEngine.whatsappTxtAdapter;
const HAS_INFLATE = typeof globalThis.DecompressionStream !== 'undefined';

// ── In-memory ZIP builder ────────────────────────────────────────────────────
const enc = new TextEncoder();
function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }
function toBytes(d) { return typeof d === 'string' ? enc.encode(d) : (d instanceof Uint8Array ? d : new Uint8Array(d)); }

// entries: [{ name, data, method(0|8, default 8), encrypted, zip64, flags, rawComp, uncSize }]
//   rawComp — exact bytes to write as the stored/compressed payload (bypasses
//             deflate); lets a test inject corrupt compressed bytes to prove media
//             is never decompressed.
//   uncSize — override the declared uncompressed size in the headers.
function buildZip(entries, opts) {
    opts = opts || {};
    const local = [], central = [], records = [];
    let offset = 0;
    for (const e of entries) {
        const raw = toBytes(e.data == null ? '' : e.data);
        const method = e.method == null ? 8 : e.method;
        const stored = e.rawComp != null ? toBytes(e.rawComp)
                     : (method === 8 ? new Uint8Array(deflateRawSync(raw)) : raw);
        const unc = e.uncSize != null ? e.uncSize : raw.length;
        const nameBytes = enc.encode(e.name);
        let flags = e.flags != null ? e.flags : 0x0800;
        if (e.encrypted) flags |= 0x0001;
        const lh = [].concat(
            u32(0x04034b50), u16(20), u16(flags), u16(method), u16(0), u16(0),
            u32(0), u32(stored.length), u32(unc), u16(nameBytes.length), u16(0)
        );
        records.push({ nameBytes, method, flags, comp: stored.length, unc: unc, offset, zip64: !!e.zip64 });
        local.push(Uint8Array.from(lh), nameBytes, stored);
        offset += lh.length + nameBytes.length + stored.length;
    }
    const cdStart = offset;
    for (const r of records) {
        const unc = r.zip64 ? 0xFFFFFFFF : r.unc;
        const ch = [].concat(
            u32(0x02014b50), u16(20), u16(20), u16(r.flags), u16(r.method), u16(0), u16(0),
            u32(0), u32(r.comp), u32(unc), u16(r.nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(r.offset)
        );
        central.push(Uint8Array.from(ch), r.nameBytes);
        offset += ch.length + r.nameBytes.length;
    }
    const cdSize = offset - cdStart;
    const comment = opts.comment ? enc.encode(opts.comment) : new Uint8Array(0);
    const eocd = [].concat(
        u32(0x06054b50), u16(0), u16(0), u16(records.length), u16(records.length),
        u32(cdSize), u32(cdStart), u16(comment.length)
    );
    const parts = local.concat(central, [Uint8Array.from(eocd), comment]);
    let total = 0; for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let pos = 0; for (const p of parts) { out.set(p, pos); pos += p.length; }
    return out;
}

let passed = 0, failed = 0;
function assert(cond, label) { if (cond) { passed++; } else { failed++; console.error('  FAIL:', label); } }
function suite(name) { console.log('\n' + name); }

const CHAT = '[6/13/24, 9:02:00 AM] Amina: ‎Photo\n<attached: 00000042-PHOTO.jpg>\n[6/13/24, 9:03:00 AM] Bilal: nice\n';

(async function main() {

    // ── Suite 1 — API shape ──────────────────────────────────────────────────
    suite('Suite 1 — API shape');
    assert(Zip && typeof Zip === 'object',                       'KMEngine.WhatsAppZip exists');
    ['readCentralDirectory', 'findChatTxt', 'buildMediaManifest', 'extractEntryBytes', 'extractText', 'readArchive']
        .forEach(function (fn) { assert(typeof Zip[fn] === 'function', fn + ' is a function'); });
    assert(Zip.METHOD_STORED === 0 && Zip.METHOD_DEFLATE === 8,  'method constants exported');
    assert(typeof adapter.importZip === 'function',             'adapter.importZip is a function');

    // ── Suite 2 — central directory parse ─────────────────────────────────────
    suite('Suite 2 — central directory parse');
    const zip = buildZip([
        { name: '_chat.txt', data: CHAT, method: 8 },
        { name: '00000042-PHOTO.jpg', data: 'JPEGDATA-xxxxxxxxxx', method: 0 },
        { name: '00000043-AUDIO.opus', data: 'OPUSDATA', method: 0 }
    ]);
    const cd = Zip.readCentralDirectory(zip);
    assert(cd.ok === true,                                       'reads a valid central directory');
    assert(cd.entries.length === 3,                             'lists all 3 entries');
    assert(cd.entries[0].name === '_chat.txt',                 'archive-relative name preserved');
    assert(cd.entries[0].method === 8,                         'detects deflate method');
    assert(cd.entries[1].method === 0,                         'detects stored method');
    assert(cd.entries[1].uncompressedSize === 19,             'uncompressed size from central directory');
    assert(typeof cd.entries[1].compressedSize === 'number',   'compressed size present');
    assert(cd.entries[0].utf8 === true,                        'UTF-8 flag detected');
    assert(Zip.readCentralDirectory(zip).entries[1].basename === '00000042-PHOTO.jpg', 'basename computed');

    // central directory with an archive comment after EOCD
    const zipC = buildZip([{ name: '_chat.txt', data: CHAT, method: 0 }], { comment: 'WhatsApp Chat' });
    assert(Zip.readCentralDirectory(zipC).ok === true,         'EOCD found past a trailing comment');

    // entries with folder paths
    const zipFolder = buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: 'media/00000042-PHOTO.jpg', data: 'X', method: 0 }
    ]);
    const cdF = Zip.readCentralDirectory(zipFolder);
    assert(cdF.entries[1].name === 'media/00000042-PHOTO.jpg' && cdF.entries[1].basename === '00000042-PHOTO.jpg', 'folder path kept, basename derived');

    // ── Suite 3 — findChatTxt (reject zero / multiple) ────────────────────────
    suite('Suite 3 — findChatTxt');
    assert(Zip.findChatTxt(cd.entries).ok === true,            'finds the _chat.txt entry');
    assert(Zip.findChatTxt(cd.entries).entry.name === '_chat.txt', 'returns the _chat.txt entry');

    const onlyMedia = Zip.readCentralDirectory(buildZip([{ name: 'p.jpg', data: 'X', method: 0 }]));
    assert(Zip.findChatTxt(onlyMedia.entries).ok === false &&
           Zip.findChatTxt(onlyMedia.entries).reason === 'NO_CHAT_TXT_IN_ARCHIVE', 'rejects archive with no chat text');

    const twoTxt = Zip.readCentralDirectory(buildZip([
        { name: 'a.txt', data: 'A', method: 0 }, { name: 'b.txt', data: 'B', method: 0 }
    ]));
    assert(Zip.findChatTxt(twoTxt.entries).ok === false &&
           Zip.findChatTxt(twoTxt.entries).reason === 'MULTIPLE_TXT_IN_ARCHIVE', 'rejects multiple .txt candidates');

    const chatPlusNotes = Zip.readCentralDirectory(buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 }, { name: 'notes.txt', data: 'N', method: 0 }
    ]));
    assert(Zip.findChatTxt(chatPlusNotes.entries).ok === true, 'exact _chat.txt wins over another .txt');

    const twoChat = Zip.readCentralDirectory(buildZip([
        { name: 'a/_chat.txt', data: 'A', method: 0 }, { name: 'b/_chat.txt', data: 'B', method: 0 }
    ]));
    assert(Zip.findChatTxt(twoChat.entries).ok === false &&
           Zip.findChatTxt(twoChat.entries).reason === 'MULTIPLE_TXT_IN_ARCHIVE', 'rejects two _chat.txt entries');

    // ── Suite 4 — media manifest (no media decompression) ─────────────────────
    suite('Suite 4 — media manifest');
    const chatEntry = Zip.findChatTxt(cd.entries).entry;
    const mm = Zip.buildMediaManifest(cd.entries, chatEntry);
    assert(mm.manifest.length === 2,                           'manifest excludes the chat file');
    assert(mm.manifest.every(function (m) { return m.present === true; }), 'manifest entries marked present');
    assert(mm.manifest[0].byteSize === 19,                    'manifest carries byteSize (uncompressed)');
    assert(mm.manifest.some(function (m) { return m.basename === '00000042-PHOTO.jpg'; }), 'media basename in manifest');
    assert(mm.diagnostics.length === 0,                       'no diagnostics for clean manifest');

    // same basename under different folder paths => ambiguous for <attached:> match
    const dupCd = Zip.readCentralDirectory(buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: 'a/DUP.jpg', data: 'X', method: 0 },
        { name: 'b/DUP.jpg', data: 'Y', method: 0 }
    ]));
    const dupMm = Zip.buildMediaManifest(dupCd.entries, Zip.findChatTxt(dupCd.entries).entry);
    assert(dupMm.manifest.length === 1,                       'duplicate basename kept once');
    assert(dupMm.diagnostics.some(function (d) { return d.code === 'DUPLICATE_MEDIA_BASENAME'; }), 'duplicate basename diagnosed');
    assert(dupMm.manifest[0].ambiguous === true,              'kept entry flagged ambiguous');
    assert(dupMm.diagnostics.every(function (d) { return d.code !== 'DUPLICATE_ARCHIVE_ENTRY'; }), 'different paths are not an exact-duplicate entry');

    // the exact same archive-relative name twice => structural duplicate entry
    const dupNameCd = Zip.readCentralDirectory(buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: 'media/SAME.jpg', data: 'X', method: 0 },
        { name: 'media/SAME.jpg', data: 'Y', method: 0 }
    ]));
    const dupNameMm = Zip.buildMediaManifest(dupNameCd.entries, Zip.findChatTxt(dupNameCd.entries).entry);
    assert(dupNameMm.manifest.length === 1,                   'exact-duplicate name kept once');
    assert(dupNameMm.diagnostics.some(function (d) { return d.code === 'DUPLICATE_ARCHIVE_ENTRY'; }), 'exact-duplicate entry diagnosed');
    assert(dupNameMm.manifest[0].ambiguous !== true,          'exact-duplicate kept entry is not basename-ambiguous');

    // absolute / traversal entry names are diagnosed (sourceRef must stay archive-relative)
    const suspCd = Zip.readCentralDirectory(buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: '/etc/passwd.jpg', data: 'X', method: 0 },
        { name: '../escape.png', data: 'Y', method: 0 }
    ]));
    const suspMm = Zip.buildMediaManifest(suspCd.entries, Zip.findChatTxt(suspCd.entries).entry);
    assert(suspMm.diagnostics.filter(function (d) { return d.code === 'SUSPICIOUS_ENTRY_NAME'; }).length === 2, 'absolute + traversal names diagnosed');
    assert(Zip.isSuspiciousName('/abs.jpg') && Zip.isSuspiciousName('a/../b.jpg') && Zip.isSuspiciousName('C:\\x.jpg'), 'isSuspiciousName flags absolute/traversal');
    assert(!Zip.isSuspiciousName('media/00000042-PHOTO.jpg') && !Zip.isSuspiciousName('photo.jpg'), 'isSuspiciousName allows normal archive names');

    const badMethodCd = Zip.readCentralDirectory(buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: 'weird.bin', data: 'X', method: 99 }
    ]));
    const badMm = Zip.buildMediaManifest(badMethodCd.entries, Zip.findChatTxt(badMethodCd.entries).entry);
    assert(badMm.diagnostics.some(function (d) { return d.code === 'UNSUPPORTED_COMPRESSION'; }), 'unsupported media method diagnosed');

    // ── Suite 5 — rejections (loud, not silent) ───────────────────────────────
    suite('Suite 5 — rejections');
    assert(Zip.readCentralDirectory(new Uint8Array(0)).reason === 'EMPTY_INPUT', 'empty input rejected');
    assert(Zip.readCentralDirectory(enc.encode('not a zip file at all, no eocd here ' + 'x'.repeat(80))).reason === 'NO_CENTRAL_DIRECTORY', 'non-zip rejected');
    const encZip = buildZip([{ name: '_chat.txt', data: CHAT, method: 0, encrypted: true }]);
    assert(Zip.readCentralDirectory(encZip).reason === 'ARCHIVE_ENCRYPTED', 'encrypted archive rejected');
    const z64 = buildZip([{ name: '_chat.txt', data: CHAT, method: 0, zip64: true }]);
    assert(Zip.readCentralDirectory(z64).reason === 'ARCHIVE_ZIP64_UNSUPPORTED', 'ZIP64 sentinel rejected');
    assert(Zip.readCentralDirectory(null).reason === 'EMPTY_INPUT', 'null input rejected safely');

    // ── Suite 6 — extractText (stored) ────────────────────────────────────────
    suite('Suite 6 — extractText (stored)');
    const storedZip = buildZip([{ name: '_chat.txt', data: CHAT, method: 0 }]);
    const sEntry = Zip.findChatTxt(Zip.readCentralDirectory(storedZip).entries).entry;
    const sText = await Zip.extractText(storedZip, sEntry);
    assert(sText.ok === true,                                  'stored chat text extracted');
    assert(sText.text === CHAT,                                'stored text round-trips exactly');

    // BOM stripping
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF].concat(Array.from(enc.encode('hi'))));
    const bomZip = buildZip([{ name: '_chat.txt', data: bom, method: 0 }]);
    const bomEntry = Zip.findChatTxt(Zip.readCentralDirectory(bomZip).entries).entry;
    const bomText = await Zip.extractText(bomZip, bomEntry);
    assert(bomText.ok === true && bomText.text === 'hi',       'UTF-8 BOM stripped');

    // unsupported-method chat file rejected at extraction
    const badChat = buildZip([{ name: '_chat.txt', data: CHAT, method: 99 }]);
    const badEntry = Zip.readCentralDirectory(badChat).entries[0];
    const badText = await Zip.extractText(badChat, badEntry);
    assert(badText.ok === false && badText.reason === 'UNSUPPORTED_COMPRESSION', 'unsupported chat method rejected at extract');

    // ── Suite 7 — extractText (deflate) ───────────────────────────────────────
    suite('Suite 7 — extractText (deflate)');
    if (HAS_INFLATE) {
        const dEntry = Zip.findChatTxt(Zip.readCentralDirectory(zip).entries).entry;
        const dText = await Zip.extractText(zip, dEntry);
        assert(dText.ok === true,                              'deflated chat text extracted');
        assert(dText.text === CHAT,                            'deflated text round-trips exactly');
    } else {
        console.log('  SKIP  DecompressionStream unavailable in this runtime (deflate path not exercised)');
        const dEntry = Zip.findChatTxt(Zip.readCentralDirectory(zip).entries).entry;
        const dText = await Zip.extractText(zip, dEntry);
        assert(dText.ok === false && dText.reason === 'DECOMPRESSION_UNAVAILABLE', 'deflate path degrades loudly when unavailable');
    }

    // ── Suite 8 — readArchive end-to-end ──────────────────────────────────────
    suite('Suite 8 — readArchive');
    if (HAS_INFLATE) {
        const ra = await Zip.readArchive(zip);
        assert(ra.ok === true,                                'readArchive succeeds');
        assert(ra.chatText === CHAT,                          'chatText decompressed');
        assert(ra.mediaManifest.length === 2,                'media manifest built');
        assert(ra.chatEntry.name === '_chat.txt',            'chat entry reported');
    }
    const raNoChat = await Zip.readArchive(buildZip([{ name: 'p.jpg', data: 'X', method: 0 }]));
    assert(raNoChat.ok === false && raNoChat.reason === 'NO_CHAT_TXT_IN_ARCHIVE', 'readArchive surfaces NO_CHAT_TXT');
    const raEnc = await Zip.readArchive(encZip);
    assert(raEnc.ok === false && raEnc.reason === 'ARCHIVE_ENCRYPTED', 'readArchive surfaces encryption');

    // ── Suite 9 — importZip canonical integration ─────────────────────────────
    suite('Suite 9 — importZip canonical integration');
    if (HAS_INFLATE) {
        const e2e = buildZip([
            { name: '_chat.txt', data:
                '[6/13/24, 9:02:00 AM] Amina: <attached: 00000042-PHOTO.jpg>\n' +
                '[6/13/24, 9:03:00 AM] Amina: <attached: 00000099-MISSING.jpg>\n' +
                '[6/13/24, 9:04:00 AM] Bilal: <Media omitted>\n', method: 8 },
            { name: '00000042-PHOTO.jpg', data: 'JPEGDATAxxxxxxxxxxxx', method: 0 }
        ]);
        const conv = await adapter.importZip(e2e);
        const atts = [];
        conv.messages.forEach(function (m) { (m.media || []).forEach(function (a) { atts.push(a); }); });
        const resolved = atts.filter(function (a) { return a.present === true; });
        assert(resolved.length === 1,                         'one attachment resolved against the archive');
        assert(resolved[0].sourceRef === '00000042-PHOTO.jpg', 'sourceRef = archive-relative name');
        assert(resolved[0].mimeType === 'image/jpeg',        'mimeType inferred from extension');
        assert(resolved[0].byteSize === 20,                  'byteSize from manifest (uncompressed)');
        assert(resolved[0].placeholderReason === 'resolved-from-archive', 'resolved reason set');

        const missing = atts.filter(function (a) { return a.placeholderReason === 'missing-from-archive'; });
        assert(missing.length === 1 && missing[0].present === false, 'referenced-but-absent file marked missing');
        assert(conv.diagnostics.mediaMissing.length === 1,   'missing media recorded in diagnostics');
        assert(conv.diagnostics.mediaMissing[0].filename === '00000099-MISSING.jpg', 'missing filename recorded');

        const omitted = atts.filter(function (a) { return a.placeholderReason === 'omitted'; });
        assert(omitted.length === 1 && omitted[0].present === false, '<Media omitted> stays present:false');
        assert(KMEngine.ImportAdapterContract.validateConversation(conv).valid === true, 'importZip conversation passes the contract');
    }
    const convFail = await adapter.importZip(buildZip([{ name: 'p.jpg', data: 'X', method: 0 }]));
    assert(convFail.messages.length === 0 && convFail.diagnostics.warnings.some(function (w) { return w.code === 'ZIP_READ_FAILED'; }),
        'importZip on a no-chat archive returns empty-but-valid with ZIP_READ_FAILED');

    // ── Suite 10 — media bytes are never decompressed (P5B) ───────────────────
    suite('Suite 10 — media never decompressed');
    // A media entry declared deflate (method 8) but carrying GARBAGE compressed
    // bytes. If the manifest tried to inflate it, this would error; it must not —
    // only central-directory metadata is read for media.
    const garbageMedia = buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: '00000042-PHOTO.jpg', method: 8, rawComp: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), uncSize: 123456 }
    ]);
    const gmCd = Zip.readCentralDirectory(garbageMedia);
    const gmMm = Zip.buildMediaManifest(gmCd.entries, Zip.findChatTxt(gmCd.entries).entry);
    assert(gmMm.manifest.length === 1,                        'manifest built despite corrupt media bytes');
    assert(gmMm.manifest[0].byteSize === 123456,             'byteSize read from central directory, not by inflating');
    assert(gmMm.diagnostics.length === 0,                     'corrupt media bytes raise no decompression error');
    if (HAS_INFLATE) {
        const gmRa = await Zip.readArchive(garbageMedia);
        assert(gmRa.ok === true,                              'readArchive succeeds with corrupt media (chat is stored)');
        assert(gmRa.mediaManifest[0].byteSize === 123456,    'readArchive manifest byteSize from CD');
        assert(gmRa.chatText === CHAT,                        'only the chat text is decompressed/copied');
    }
    // manifest builds with no DecompressionStream present at all (media never inflated)
    const KM_NOINFLATE = makeCtx({ Response: globalThis.Response, TextDecoder: globalThis.TextDecoder });
    const niMm = KM_NOINFLATE.WhatsAppZip.buildMediaManifest(gmCd.entries, KM_NOINFLATE.WhatsAppZip.findChatTxt(gmCd.entries).entry);
    assert(niMm.manifest.length === 1 && niMm.manifest[0].byteSize === 123456, 'manifest built with no DecompressionStream present');

    // ── Suite 11 — malformed / truncated archives (P5B) ───────────────────────
    suite('Suite 11 — malformed archives');
    function findEocdOffset(bytes) {
        const dvv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        for (let i = bytes.length - 22; i >= 0; i--) {
            if (dvv.getUint32(i, true) === 0x06054b50) return i;
        }
        return -1;
    }
    const goodZip = buildZip([{ name: '_chat.txt', data: CHAT, method: 0 }, { name: 'p.jpg', data: 'XXXX', method: 0 }]);
    const truncated = goodZip.slice(0, Math.floor(goodZip.length / 2));
    assert(Zip.readCentralDirectory(truncated).reason === 'NO_CENTRAL_DIRECTORY', 'truncated archive => NO_CENTRAL_DIRECTORY');
    assert((await Zip.readArchive(truncated)).ok === false,   'readArchive rejects truncated archive without throwing');

    // corrupt the first central-directory record signature (EOCD still validates)
    const corrupt = goodZip.slice();
    const cdv = new DataView(corrupt.buffer, corrupt.byteOffset, corrupt.byteLength);
    const eo = findEocdOffset(corrupt);
    const cdOff = cdv.getUint32(eo + 16, true);
    corrupt[cdOff] = 0x00; corrupt[cdOff + 1] = 0x00;
    const ccd = Zip.readCentralDirectory(corrupt);
    assert(ccd.ok === true && ccd.diagnostics.some(function (d) { return d.code === 'TRUNCATED_CENTRAL_DIRECTORY'; }), 'corrupt central record => TRUNCATED_CENTRAL_DIRECTORY diagnostic');
    assert((await Zip.readArchive(corrupt)).reason === 'NO_CHAT_TXT_IN_ARCHIVE', 'corrupt central directory handled safely (no chat found)');

    // cdOffset pointing past EOF (not the ZIP64 sentinel)
    const badOffset = goodZip.slice();
    const bdv = new DataView(badOffset.buffer, badOffset.byteOffset, badOffset.byteLength);
    bdv.setUint32(findEocdOffset(badOffset) + 16, badOffset.length + 50, true);
    assert(Zip.readCentralDirectory(badOffset).reason === 'NO_CENTRAL_DIRECTORY', 'cdOffset past EOF => NO_CENTRAL_DIRECTORY');

    // ── Suite 12 — decompression unavailable (P5B) ────────────────────────────
    suite('Suite 12 — decompression unavailable');
    const NIZip = KM_NOINFLATE.WhatsAppZip;
    const NIad  = KM_NOINFLATE.whatsappTxtAdapter;
    const deflatedChat = buildZip([{ name: '_chat.txt', data: CHAT, method: 8 }]);
    const niEntry = NIZip.findChatTxt(NIZip.readCentralDirectory(deflatedChat).entries).entry;
    const niExtract = await NIZip.extractText(deflatedChat, niEntry);
    assert(niExtract.ok === false && niExtract.reason === 'DECOMPRESSION_UNAVAILABLE', 'deflate extract fails loudly without DecompressionStream');
    const niRa = await NIZip.readArchive(deflatedChat);
    assert(niRa.ok === false && niRa.reason === 'DECOMPRESSION_UNAVAILABLE', 'readArchive surfaces DECOMPRESSION_UNAVAILABLE');
    const niConv = await NIad.importZip(deflatedChat);
    assert(niConv.messages.length === 0,                      'importZip on undecompressable chat => empty conversation');
    assert(niConv.diagnostics.warnings.some(function (w) { return w.code === 'ZIP_READ_FAILED' && w.reason === 'DECOMPRESSION_UNAVAILABLE'; }), 'importZip reports DECOMPRESSION_UNAVAILABLE');
    assert(KM_NOINFLATE.ImportAdapterContract.validateConversation(niConv).valid === true, 'undecompressable importZip stays contract-valid');
    const storedNoInflate = buildZip([{ name: '_chat.txt', data: CHAT, method: 0 }]);
    const niStored = await NIZip.readArchive(storedNoInflate);
    assert(niStored.ok === true && niStored.chatText === CHAT, 'stored chat extracts without DecompressionStream');

    // ── Suite 13 — importZip failure paths are contract-valid + never throw ────
    suite('Suite 13 — importZip failure paths contract-valid');
    const Contract = KMEngine.ImportAdapterContract;
    async function failCase(label, input, reason) {
        const c = await adapter.importZip(input);
        assert(c.messages.length === 0,                       label + ': empty conversation');
        assert(Contract.validateConversation(c).valid === true, label + ': contract-valid');
        const w = c.diagnostics.warnings.find(function (x) { return x.code === 'ZIP_READ_FAILED'; });
        assert(!!w && (reason == null || w.reason === reason), label + ': ZIP_READ_FAILED' + (reason ? ' (' + reason + ')' : ''));
    }
    await failCase('empty input',   new Uint8Array(0),                                          'EMPTY_INPUT');
    await failCase('null input',    null,                                                       'EMPTY_INPUT');
    await failCase('garbage bytes', enc.encode('no zip here at all ' + 'q'.repeat(120)),        'NO_CENTRAL_DIRECTORY');
    await failCase('encrypted',     buildZip([{ name: '_chat.txt', data: CHAT, method: 0, encrypted: true }]), 'ARCHIVE_ENCRYPTED');
    await failCase('zip64',         buildZip([{ name: '_chat.txt', data: CHAT, method: 0, zip64: true }]),     'ARCHIVE_ZIP64_UNSUPPORTED');
    await failCase('no chat',       buildZip([{ name: 'p.jpg', data: 'X', method: 0 }]),                      'NO_CHAT_TXT_IN_ARCHIVE');
    await failCase('multiple chat', buildZip([{ name: 'a/_chat.txt', data: 'A', method: 0 }, { name: 'b/_chat.txt', data: 'B', method: 0 }]), 'MULTIPLE_TXT_IN_ARCHIVE');
    let threw = false;
    try { await adapter.importZip(new ArrayBuffer(64)); await adapter.importZip(undefined); await adapter.importZip({}); }
    catch (e) { threw = true; }
    assert(threw === false,                                   'importZip never throws on odd inputs (ArrayBuffer / undefined / object)');

    // ── Suite 14 — ambiguous media match surfaced through importZip (P5B) ──────
    suite('Suite 14 — ambiguous media match (importZip)');
    if (HAS_INFLATE) {
        const ambZip = buildZip([
            { name: '_chat.txt', data: '[6/13/24, 9:02:00 AM] Amina: <attached: DUP.jpg>\n', method: 8 },
            { name: 'a/DUP.jpg', data: 'AAAA', method: 0 },
            { name: 'b/DUP.jpg', data: 'BBBBBB', method: 0 }
        ]);
        const ambConv = await adapter.importZip(ambZip);
        const atts = [];
        ambConv.messages.forEach(function (m) { (m.media || []).forEach(function (a) { atts.push(a); }); });
        assert(atts.length === 1 && atts[0].present === true, 'ambiguous attachment still resolves (first occurrence kept)');
        assert(ambConv.diagnostics.warnings.some(function (w) { return w.code === 'AMBIGUOUS_MEDIA_MATCH'; }), 'ambiguous match surfaced, not silently guessed');
        assert(ambConv.diagnostics.warnings.some(function (w) { return w.code === 'DUPLICATE_MEDIA_BASENAME'; }), 'duplicate-basename diagnostic propagated to the conversation');
        assert(Contract.validateConversation(ambConv).valid === true, 'ambiguous-media conversation is contract-valid');
    }

    // ── Suite 15 — sourceRef archive-relative only + determinism (P5B) ─────────
    suite('Suite 15 — sourceRef + determinism');
    if (HAS_INFLATE) {
        const folderZip = buildZip([
            { name: '_chat.txt', data: '[6/13/24, 9:02:00 AM] Amina: <attached: 00000042-PHOTO.jpg>\n', method: 8 },
            { name: 'media/00000042-PHOTO.jpg', data: 'JPEGDATA', method: 0 }
        ]);
        const c1 = await adapter.importZip(folderZip);
        const a1 = c1.messages[0].media[0];
        assert(a1.sourceRef === 'media/00000042-PHOTO.jpg',  'sourceRef = archive-relative name (with folder)');
        assert(a1.sourceRef.indexOf('blob:') === -1 && !/^([A-Za-z]:[\\/]|[\\/])/.test(a1.sourceRef), 'sourceRef is never a blob URL or absolute path');
        const ra1 = await Zip.readArchive(folderZip);
        const ra2 = await Zip.readArchive(folderZip);
        assert(JSON.stringify(ra1.mediaManifest) === JSON.stringify(ra2.mediaManifest), 'media manifest is deterministic across reads');
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60));
    console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) process.exit(1);
})();
