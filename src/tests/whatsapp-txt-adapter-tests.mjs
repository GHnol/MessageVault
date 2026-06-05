import { createContext, runInContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function load(ctx, relPath) {
    const abs  = join(__dirname, '../../', relPath);
    const code = readFileSync(abs, 'utf8');
    runInContext(code, ctx);
}

function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/core/source-platforms.js');
    load(ctx, 'src/core/normalized-memory.js');
    load(ctx, 'src/core/import-adapters.js');
    load(ctx, 'src/adapters/whatsapp-txt-adapter.js');
    return ctx.window.KMEngine;
}

const KMEngine = makeCtx();
const adapter  = KMEngine.whatsappTxtAdapter;

const FIXTURE_PATH = join(__dirname, '../../scripts/fixtures/fake-whatsapp-chat.txt');
const FIXTURE      = readFileSync(FIXTURE_PATH, 'utf8');

const BRACKET_SINGLE  = '[6/1/24, 9:00:30 AM] Alice: Good morning!\n[6/1/24, 9:01:00 AM] Bob: Morning!\n';
const HYPHEN_SINGLE   = '6/1/24, 9:00 AM - Alice: Hey there\n6/1/24, 9:01 AM - Bob: Hey back\n';
const MULTILINE_TEXT  = '[6/1/24, 9:00:00 AM] Alice: First line\nSecond line here\n[6/1/24, 9:01:00 AM] Bob: Reply\n';
const SYSTEM_TEXT     = '[6/1/24, 9:00:00 AM] Messages and calls are end-to-end encrypted.\n[6/1/24, 9:00:30 AM] Alice: Hi\n';
const MEDIA_BRACKET   = '[6/1/24, 9:00:00 AM] Bob: <Media omitted>\n';
const IMAGE_BRACKET   = '[6/1/24, 9:00:00 AM] Bob: image omitted\n';
const VIDEO_BRACKET   = '[6/1/24, 9:00:00 AM] Bob: video omitted\n';
const AUDIO_BRACKET   = '[6/1/24, 9:00:00 AM] Bob: audio omitted\n';
const GIF_BRACKET     = '[6/1/24, 9:00:00 AM] Bob: GIF omitted\n';

let passed = 0;
let failed = 0;

function assert(condition, label) {
    if (condition) {
        passed++;
    } else {
        failed++;
        console.error('  FAIL:', label);
    }
}

function suite(name, fn) {
    console.log('\n' + name);
    fn();
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 1 — API shape', function () {
    assert(adapter !== undefined && adapter !== null,             'whatsappTxtAdapter exists on KMEngine');
    assert(adapter.id === 'whatsapp-txt-v1',                     'id is whatsapp-txt-v1');
    assert(adapter.sourcePlatformId === 'whatsapp',              'sourcePlatformId is whatsapp');
    assert(typeof adapter.label === 'string' && adapter.label.length > 0, 'label is a non-empty string');
    assert(typeof adapter.canHandle === 'function',              'canHandle is a function');
    assert(typeof adapter.normalizeAll === 'function',           'normalizeAll is a function');
    assert(typeof adapter['import'] === 'function',              'import is a function');
    assert(Array.isArray(adapter._lastWarnings),                 '_lastWarnings is an array');
    assert(KMEngine.adapters['whatsapp-txt-v1'] === adapter,     'adapter registered in KMEngine.adapters');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — canHandle: bracket format
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 2 — canHandle: bracket format', function () {
    assert(adapter.canHandle('[6/1/24, 9:00:00 AM] Alice: Hi'),           'bracket format with seconds → true');
    assert(adapter.canHandle('[12/31/2024, 11:59:59 PM] Bob: Bye'),       '4-digit year bracket PM → true');
    assert(adapter.canHandle('\n[6/1/24, 9:00 AM] Alice: No seconds'),    'leading newline before bracket → true');
    assert(adapter.canHandle('[6/1/24, 9:00:00 AM] Alice: Hi\n[6/1/24, 9:01:00 AM] Bob: Hey'), 'multi-message bracket → true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — canHandle: hyphen format
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 3 — canHandle: hyphen format', function () {
    assert(adapter.canHandle('6/1/24, 9:00 AM - Alice: Hey there'),       'basic hyphen format → true');
    assert(adapter.canHandle('12/25/24, 12:00 PM - Bob: Merry Christmas'), 'PM hyphen format → true');
    assert(adapter.canHandle('  6/1/24, 9:00 AM - Alice: Text'),          'leading spaces before hyphen → true');
    assert(adapter.canHandle('6/1/24, 9:00:30 AM - Alice: With seconds'), 'hyphen with seconds → true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — canHandle: rejects
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 4 — canHandle: rejects', function () {
    assert(adapter.canHandle('') === false,                      'empty string → false');
    assert(adapter.canHandle('   ') === false,                   'whitespace-only → false');
    assert(adapter.canHandle(null) === false,                    'null → false');
    assert(adapter.canHandle(123) === false,                     'number → false');
    assert(adapter.canHandle({}) === false,                      'object → false');
    assert(adapter.canHandle('2024-06-01|Alice|Hello') === false, 'pipe-delimited → false');
    assert(adapter.canHandle('Just some text') === false,        'plain text → false');
    assert(adapter.canHandle('NOT A TIMESTAMP LINE') === false,  'non-timestamp text → false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — Bracket-format import: fixture
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 5 — Bracket-format import: fixture', function () {
    const result = adapter['import'](FIXTURE);
    assert(Array.isArray(result.memories),                       'memories is an array');
    assert(result.memories.length === 8,                         'memories.length is 8 (1 system skipped)');
    assert(result.sourcePlatformId === 'whatsapp',               'sourcePlatformId is whatsapp');
    assert(result.adapterVersion === '1',                        'adapterVersion is 1');
    assert(Array.isArray(result.importWarnings),                 'importWarnings is an array');
    assert(Array.isArray(result.participants),                    'participants is an array');
    assert(result.participants.length === 2,                     'two participants extracted');
    assert(result.rawCounts !== undefined &&
           'total' in result.rawCounts &&
           'imported' in result.rawCounts &&
           'skipped' in result.rawCounts,                        'rawCounts has total/imported/skipped');
    assert(result.rawCounts.total === 9,                         'rawCounts.total is 9');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — Hyphen-format import
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 6 — Hyphen-format import', function () {
    assert(adapter.canHandle(HYPHEN_SINGLE) === true,            'canHandle returns true for hyphen text');
    const result = adapter['import'](HYPHEN_SINGLE);
    assert(Array.isArray(result.memories) && result.memories.length > 0, 'memories is non-empty');
    assert(result.memories[0].sender === 'Alice',                'first sender is Alice');
    assert(result.sourcePlatformId === 'whatsapp',               'sourcePlatformId is whatsapp');
    assert(result.rawCounts.imported === 2,                      'rawCounts.imported is 2');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — Multi-line continuation
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 7 — Multi-line continuation', function () {
    const result = adapter['import'](MULTILINE_TEXT);
    const alice  = result.memories.find(function (m) { return m.sender === 'Alice'; });
    assert(alice !== undefined,                                  'Alice message found');
    assert(typeof alice.text === 'string' && alice.text.indexOf('\n') !== -1, 'multi-line text contains \\n');
    assert(alice.text.indexOf('First line') !== -1,             'first line preserved in text');
    assert(alice.text.indexOf('Second line here') !== -1,       'continuation line appended');
    assert(result.rawCounts.total === 2,                         'total is 2 parsed messages (multi-line counts as one)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — System message filtering
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 8 — System message filtering', function () {
    const result = adapter['import'](SYSTEM_TEXT);
    assert(result.memories.length === 1,                         'only 1 memory — system message excluded');
    assert(result.rawCounts.skipped === 1,                       'rawCounts.skipped is 1');
    assert(adapter._lastWarnings.length >= 1,                    '_lastWarnings has at least one entry');
    assert(adapter._lastWarnings[0].message.toLowerCase().indexOf('system') !== -1 ||
           adapter._lastWarnings[0].message.toLowerCase().indexOf('skipped') !== -1, 'warning mentions system or skipped');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — Media / attachment placeholder
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 9 — Media / attachment placeholder', function () {
    const rMedia = adapter['import'](MEDIA_BRACKET);
    assert(rMedia.memories.length === 1 && rMedia.memories[0].isAttachmentOnly === true,  '<Media omitted> → isAttachmentOnly true');
    assert(rMedia.memories[0].text === '[Attachment]',            '<Media omitted> → text is [Attachment]');
    assert(rMedia.memories[0].type === 'attachment-placeholder', '<Media omitted> → type is attachment-placeholder');

    const rImage = adapter['import'](IMAGE_BRACKET);
    assert(rImage.memories[0].isAttachmentOnly === true,          'image omitted → isAttachmentOnly true');

    const rVideo = adapter['import'](VIDEO_BRACKET);
    assert(rVideo.memories[0].isAttachmentOnly === true,          'video omitted → isAttachmentOnly true');

    const rAudio = adapter['import'](AUDIO_BRACKET);
    assert(rAudio.memories[0].isAttachmentOnly === true,          'audio omitted → isAttachmentOnly true');

    const rGif = adapter['import'](GIF_BRACKET);
    assert(rGif.memories[0].isAttachmentOnly === true,            'GIF omitted → isAttachmentOnly true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — Participants extracted in first-seen order
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 10 — Participants: first-seen order', function () {
    const result = adapter['import'](FIXTURE);
    assert(Array.isArray(result.participants),                    'participants is array');
    assert(result.participants[0] === 'Alice',                   'Alice is first (first non-system message)');
    assert(result.participants[1] === 'Bob',                     'Bob is second');
    assert(result.participants.length === 2,                     'exactly 2 participants');
    const unique = result.participants.filter(function (p, i, arr) { return arr.indexOf(p) === i; });
    assert(unique.length === result.participants.length,         'no duplicate participants');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — rawCounts: total / imported / skipped
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 11 — rawCounts', function () {
    const result = adapter['import'](FIXTURE);
    assert(result.rawCounts.total === 9,                         'fixture rawCounts.total is 9');
    assert(result.rawCounts.imported === 8,                      'fixture rawCounts.imported is 8');
    assert(result.rawCounts.skipped === 1,                       'fixture rawCounts.skipped is 1');
    assert(result.rawCounts.total === result.rawCounts.imported + result.rawCounts.skipped, 'total === imported + skipped');

    const emptyResult = adapter['import']('');
    assert(emptyResult.rawCounts.total === 0,                    'empty input total is 0');
    assert(emptyResult.rawCounts.imported === 0,                 'empty input imported is 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — NormalizedMemory fields on imported memory
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 12 — NormalizedMemory fields', function () {
    const result  = adapter['import'](BRACKET_SINGLE);
    const mem     = result.memories[0];
    const mediaMem = adapter['import'](MEDIA_BRACKET).memories[0];

    assert(typeof mem.id === 'string' && mem.id.startsWith('mem-'),  'id starts with mem-');
    assert(mem.sourcePlatformId === 'whatsapp',                       'sourcePlatformId is whatsapp');
    assert(mem.sourceAdapterId === 'whatsapp-txt-v1',                 'sourceAdapterId is whatsapp-txt-v1');
    assert(mem.senderRole === 'contact',                              'senderRole is contact');
    assert(mem.type === 'message',                                    'regular message type is message');
    assert(mediaMem.type === 'attachment-placeholder',                'media type is attachment-placeholder');
    assert(Array.isArray(mem.reactions) && mem.reactions.length === 0, 'reactions is empty array');
    assert(mem.provenance !== null && typeof mem.provenance === 'object', 'provenance is an object');
    assert(mem.provenance.adapterVersion === '1',                     'provenance.adapterVersion is 1');
    assert(typeof mem.provenance.importedAt === 'string',             'provenance.importedAt is a string');
    assert(Array.isArray(mem.media),                                  'media is an array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — Empty / invalid input: no throw
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 13 — Empty / invalid input: no throw', function () {
    let r1, r2, r3, r4;
    assert((function () { try { r1 = adapter['import'](''); return true; } catch (e) { return false; } }()), 'import(\'\') does not throw');
    assert((function () { try { r2 = adapter['import'](null); return true; } catch (e) { return false; } }()), 'import(null) does not throw');
    assert((function () { try { r3 = adapter['import'](undefined); return true; } catch (e) { return false; } }()), 'import(undefined) does not throw');
    assert((function () { try { r4 = adapter['import'](42); return true; } catch (e) { return false; } }()), 'import(42) does not throw');
    assert(r1 !== undefined && Array.isArray(r1.memories),           'import(\'\') returns ImportResult with memories');
    assert(r1.memories.length === 0,                                  'import(\'\') memories is empty');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — Semantic guard: no proof / commerce / readiness fields
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 14 — Semantic guard', function () {
    const result = adapter['import'](BRACKET_SINGLE);
    const mem    = result.memories[0];

    assert(result.proofReady === undefined,           'ImportResult has no proofReady');
    assert(result.checkoutReady === undefined,        'ImportResult has no checkoutReady');
    assert(result.manufacturingReady === undefined,   'ImportResult has no manufacturingReady');
    assert(result.estimatedPages === undefined,       'ImportResult has no estimatedPages');
    assert(result.estimatedVolumes === undefined,     'ImportResult has no estimatedVolumes');
    assert(mem.proofReady === undefined,              'memory has no proofReady');
    assert(mem.vendor === undefined,                  'memory has no vendor');
    assert(mem.order === undefined,                   'memory has no order');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
