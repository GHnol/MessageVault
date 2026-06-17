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

function makeCtx() {
    const ctx = createContext({
        window: {}, console,
        DecompressionStream: globalThis.DecompressionStream,
        Response: globalThis.Response,
        TextDecoder: globalThis.TextDecoder
    });
    load(ctx, 'src/core/source-platforms.js');
    load(ctx, 'src/core/normalized-memory.js');
    load(ctx, 'src/core/import-adapters.js');
    load(ctx, 'src/core/canonical-conversation.js');
    load(ctx, 'src/core/import-adapter-contract.js');
    load(ctx, 'src/core/whatsapp-zip-reader.js');
    load(ctx, 'src/adapters/whatsapp-txt-adapter.js');
    return ctx.window.KMEngine;
}

const KMEngine = makeCtx();
const Zip     = KMEngine.WhatsAppZip;
const adapter = KMEngine.whatsappTxtAdapter;
const HAS_INFLATE = typeof globalThis.DecompressionStream !== 'undefined';

// ── In-memory ZIP builder ────────────────────────────────────────────────────
const enc = new TextEncoder();
function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }
function toBytes(d) { return typeof d === 'string' ? enc.encode(d) : (d instanceof Uint8Array ? d : new Uint8Array(d)); }

// entries: [{ name, data, method(0|8, default 8), encrypted, zip64, flags }]
function buildZip(entries, opts) {
    opts = opts || {};
    const local = [], central = [], records = [];
    let offset = 0;
    for (const e of entries) {
        const raw = toBytes(e.data == null ? '' : e.data);
        const method = e.method == null ? 8 : e.method;
        const stored = method === 8 ? new Uint8Array(deflateRawSync(raw)) : raw;
        const nameBytes = enc.encode(e.name);
        let flags = e.flags != null ? e.flags : 0x0800;
        if (e.encrypted) flags |= 0x0001;
        const lh = [].concat(
            u32(0x04034b50), u16(20), u16(flags), u16(method), u16(0), u16(0),
            u32(0), u32(stored.length), u32(raw.length), u16(nameBytes.length), u16(0)
        );
        records.push({ nameBytes, method, flags, comp: stored.length, unc: raw.length, offset, zip64: !!e.zip64 });
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

    const dupCd = Zip.readCentralDirectory(buildZip([
        { name: '_chat.txt', data: CHAT, method: 0 },
        { name: 'a/DUP.jpg', data: 'X', method: 0 },
        { name: 'b/DUP.jpg', data: 'Y', method: 0 }
    ]));
    const dupMm = Zip.buildMediaManifest(dupCd.entries, Zip.findChatTxt(dupCd.entries).entry);
    assert(dupMm.manifest.length === 1,                       'duplicate basename kept once');
    assert(dupMm.diagnostics.some(function (d) { return d.code === 'DUPLICATE_ARCHIVE_ENTRY'; }), 'duplicate diagnosed');

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

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60));
    console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) process.exit(1);
})();
