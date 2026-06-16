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
    load(ctx, 'src/core/canonical-conversation.js');
    load(ctx, 'src/core/import-adapter-contract.js');
    load(ctx, 'src/adapters/whatsapp-txt-adapter.js');
    return ctx.window.KMEngine;
}

const KMEngine = makeCtx();
const adapter  = KMEngine.whatsappTxtAdapter;
const Contract = KMEngine.ImportAdapterContract;

const FIXTURE_PATH = join(__dirname, '../../scripts/fixtures/fake-whatsapp-chat.txt');
const FIXTURE      = readFileSync(FIXTURE_PATH, 'utf8');

const GROUP_FIXTURE = readFileSync(join(__dirname, '../../scripts/fixtures/whatsapp/ios-group-chat.txt'), 'utf8');

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
// Suite 15 — Canonical path: API + contract validity (Package P2)
// ─────────────────────────────────────────────────────────────────────────────

const NNBSP = String.fromCharCode(0x202F); // narrow no-break space (iOS puts this before AM/PM)
const LRM   = String.fromCharCode(0x200E); // left-to-right mark (iOS prefixes system / attached lines)

suite('Suite 15 — Canonical path: API + contract', function () {
    assert(typeof adapter.toCanonical === 'function',            'toCanonical is a function');
    const conv = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: Good morning\n' +
        '[6/15/24, 9:01:00' + NNBSP + 'AM] Bob: Morning\n'
    );
    assert(conv && conv.platform === 'whatsapp',                 'conversation.platform is whatsapp');
    assert(conv.source && conv.source.platform === 'whatsapp',   'source.platform is whatsapp');
    assert(conv.source.adapterId === 'whatsapp-txt-v1',          'source.adapterId is whatsapp-txt-v1');
    assert(conv.diagnostics && typeof conv.diagnostics.counts === 'object', 'diagnostics.counts present');
    assert(Contract.validateConversation(conv).valid === true,   'canonical conversation passes the adapter contract');
    assert(conv.messages.length === 2,                           'two messages produced');
    assert(conv.source.exportVariant === 'ios',                  'exportVariant defaults to ios');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — 12-hour timestamps + U+202F narrow no-break space
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 16 — 12-hour timestamps + U+202F', function () {
    const conv = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: Morning\n' +
        '[6/15/24, 1:05:30' + NNBSP + 'PM] Bob: Afternoon\n' +
        '[6/15/24, 12:00:00' + NNBSP + 'AM] Alice: Midnight\n' +
        '[6/15/24, 12:30:00' + NNBSP + 'PM] Bob: Noon\n'
    );
    assert(conv.messages[0].timestamp === '2024-06-15T09:00:00.000Z', 'AM time → 09:00 UTC');
    assert(conv.messages[1].timestamp === '2024-06-15T13:05:30.000Z', 'PM time → 13:05:30 UTC');
    assert(conv.messages[2].timestamp === '2024-06-15T00:00:00.000Z', '12:00 AM → 00:00 (midnight)');
    assert(conv.messages[3].timestamp === '2024-06-15T12:30:00.000Z', '12:30 PM → 12:30 (noon)');
    assert(conv.source.hourCycle === 'h12',                      'hourCycle detected as h12');
    assert(Contract.validateConversation(conv).valid === true,   'conversation valid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — 24-hour timestamps (no AM/PM)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 17 — 24-hour timestamps', function () {
    const conv = adapter.toCanonical(
        '[15/06/2024, 21:05:00] Alice: Evening\n' +
        '[15/06/2024, 08:09:00] Bob: Early\n'
    );
    assert(conv.messages[0].timestamp === '2024-06-15T21:05:00.000Z', '21:05 stays 21:05 (24h)');
    assert(conv.messages[1].timestamp === '2024-06-15T08:09:00.000Z', '08:09 stays 08:09 (24h)');
    assert(conv.source.hourCycle === 'h24',                      'hourCycle detected as h24');
    assert(conv.source.detectedDateFormat === 'DMY',             'DMY detected from 15 > 12');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — M/D vs D/M ambiguity handling
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 18 — date order ambiguity', function () {
    const AMBIG = '[3/4/24, 10:00:00' + NNBSP + 'AM] Alice: One\n' +
                  '[5/6/24, 11:00:00' + NNBSP + 'AM] Bob: Two\n';

    const def = adapter.toCanonical(AMBIG);
    assert(def.messages[0].timestamp === '2024-03-04T10:00:00.000Z', 'default MDY → 3/4 = March 4');
    assert(def.source.detectedDateFormat === 'MDY',              'default detected format is MDY');
    assert(def.diagnostics.ambiguousDates.length === 2,          'both ambiguous dates recorded');
    assert(def.diagnostics.formatConfidence === 0.5,             'low confidence when ambiguous + no evidence');

    const dmy = adapter.toCanonical(AMBIG, { dateOrder: 'DMY' });
    assert(dmy.messages[0].timestamp === '2024-04-03T10:00:00.000Z', 'forced DMY → 3/4 = April 3');
    assert(dmy.source.detectedDateFormat === 'DMY',              'forced format reflected in source');

    const evidence = adapter.toCanonical(
        '[13/6/24, 09:00:00] Alice: Hi\n' +
        '[2/6/24, 09:01:00] Bob: Yo\n'
    );
    assert(evidence.source.detectedDateFormat === 'DMY',         'DMY inferred from out-of-range day (13)');
    assert(evidence.messages[0].timestamp === '2024-06-13T09:00:00.000Z', '13/6 → June 13 under DMY');
    assert(evidence.messages[1].timestamp === '2024-06-02T09:01:00.000Z', 'ambiguous 2/6 follows file DMY → June 2');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — U+200E cleanup + system events preserved
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 19 — U+200E cleanup + system events', function () {
    const conv = adapter.toCanonical(
        LRM + '[6/15/24, 9:00:00' + NNBSP + 'AM] ' + LRM + 'Messages and calls are end-to-end encrypted.\n' +
        '[6/15/24, 9:01:00' + NNBSP + 'AM] Alice: Hello\n'
    );
    assert(conv.systemEvents.length === 1,                       'system line preserved as a SystemEvent (not dropped)');
    assert(conv.systemEvents[0].kind === 'encryption-notice',    'encryption notice classified');
    assert(conv.systemEvents[0].text.indexOf(LRM) === -1,        'U+200E stripped from system text');
    assert(conv.messages.length === 1,                           'one real message');
    assert(conv.messages[0].text === 'Hello',                    'message text clean');
    assert(Contract.validateConversation(conv).valid === true,   'conversation valid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — multi-line messages (incl. blank-line preservation) + colon bodies
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 20 — multi-line + colon bodies', function () {
    const conv = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: First line\n' +
        'Second line\n' +
        '\n' +
        'Fourth line\n' +
        '[6/15/24, 9:01:00' + NNBSP + 'AM] Bob: Re: the 3:00 meeting\n'
    );
    assert(conv.messages.length === 2,                           'multi-line block counts as one message');
    assert(conv.messages[0].text === 'First line\nSecond line\n\nFourth line', 'all lines incl. blank preserved');
    assert(conv.messages[0].text.indexOf('\n\n') !== -1,         'intentional blank line preserved');
    assert(conv.messages[1].text === 'Re: the 3:00 meeting',     'colon-containing body kept intact');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 21 — media: <Media omitted> placeholder + <attached: file>
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 21 — media placeholders + attachments', function () {
    const omitted = adapter.toCanonical('[6/15/24, 9:00:00' + NNBSP + 'AM] Bob: <Media omitted>\n');
    assert(omitted.messages[0].type === 'media',                 '<Media omitted> → type media');
    assert(omitted.messages[0].media.length === 1,               'one media attachment');
    assert(omitted.messages[0].media[0].present === false,       'omitted media is marked not present');
    assert(omitted.messages[0].media[0].placeholderReason === 'omitted', 'placeholderReason omitted');
    assert(omitted.messages[0].text === null,                    'omitted media has no text');

    const image = adapter.toCanonical('[6/15/24, 9:00:00' + NNBSP + 'AM] Bob: image omitted\n');
    assert(image.messages[0].media[0].kind === 'image',          'image omitted → kind image');

    const attached = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Bob: ' + LRM + '<attached: 00000042-PHOTO-2024-06-15-09-00-00.jpg>\n'
    );
    assert(attached.messages[0].type === 'media',                '<attached:> → type media');
    assert(attached.messages[0].media[0].filename === '00000042-PHOTO-2024-06-15-09-00-00.jpg', 'filename captured');
    assert(attached.messages[0].media[0].kind === 'image',       'jpg → image kind');
    assert(attached.messages[0].media[0].present === null,       'attached file present is unknown (no ZIP in P2)');
    assert(attached.messages[0].media[0].placeholderReason === 'referenced-in-text', 'attached placeholderReason');
    assert(Contract.validateConversation(attached).valid === true, 'attachment conversation valid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 22 — edited / deleted markers
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 22 — edited / deleted markers', function () {
    const edited = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Bob: I meant tomorrow <This message was edited>\n'
    );
    assert(edited.messages[0].isEdited === true,                 'edited marker → isEdited true');
    assert(edited.messages[0].text === 'I meant tomorrow',       'edited suffix stripped from text');
    assert(edited.messages[0].type === 'text',                   'edited message is still text');

    const deleted = adapter.toCanonical('[6/15/24, 9:00:00' + NNBSP + 'AM] Bob: This message was deleted\n');
    assert(deleted.messages[0].isDeleted === true,               'deleted marker → isDeleted true');
    assert(deleted.messages[0].type === 'deleted',               'deleted message → type deleted');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 23 — malformed / unparsed lines recorded in diagnostics (not dropped)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 23 — diagnostics for malformed input', function () {
    const orphan = adapter.toCanonical(
        'This is a stray line with no timestamp\n' +
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: Hi\n'
    );
    assert(orphan.diagnostics.counts.unparsed === 1,             'orphan line counted as unparsed');
    assert(orphan.diagnostics.unparsedLines.length === 1,        'unparsed line recorded, not silently dropped');
    assert(orphan.diagnostics.unparsedLines[0].line.indexOf('stray line') !== -1, 'unparsed line text preserved');
    assert(orphan.messages.length === 1,                         'the valid message still imports');

    const badTs = adapter.toCanonical('[13/13/24, 9:00:00' + NNBSP + 'AM] Alice: Hi\n');
    assert(badTs.messages.length === 1,                          'message with bad date still imported (content kept)');
    assert(badTs.messages[0].timestamp === null,                 'unparseable timestamp → null, not a bogus value');
    assert(badTs.diagnostics.warnings.length >= 1,               'bad timestamp recorded as a warning');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 24 — participants preserved as Participant objects (P3 self-ID prep)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 24 — participants preserved', function () {
    const conv = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: Hi\n' +
        '[6/15/24, 9:01:00' + NNBSP + 'AM] Bob: Yo\n' +
        '[6/15/24, 9:02:00' + NNBSP + 'AM] Alice: Again\n'
    );
    assert(conv.participants.length === 2,                       'two distinct participants');
    const alice = conv.participants[0];
    assert(typeof alice.id === 'string' && alice.id.indexOf('par-') === 0, 'participant has stable par- id');
    assert(alice.displayName === 'Alice',                       'display name preserved (not a bare string only)');
    assert(alice.isSelf === false,                              'no one is self at import time (P3 sets this)');
    assert(Array.isArray(alice.aliases),                        'aliases array present for future name changes');
    assert(alice.messageCount === 2,                            'per-participant message count tallied');
    assert(conv.participants.every(function (p) { return p.isSelf === false; }), 'all participants default to not-self');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 25 — group detection + system events (P4 prep)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 25 — group detection + group system events', function () {
    const conv = adapter.toCanonical(
        LRM + '[15/06/2024, 20:00:00] ' + LRM + 'You created group "Trip"\n' +
        LRM + '[15/06/2024, 20:00:05] ' + LRM + 'You added Alice\n' +
        LRM + '[15/06/2024, 20:00:10] ' + LRM + 'You added Bob\n' +
        '[15/06/2024, 20:01:00] Alice: Hi all\n' +
        '[15/06/2024, 20:02:00] Bob: Hey\n' +
        '[15/06/2024, 20:03:00] Carol: Hello\n' +
        LRM + '[15/06/2024, 21:00:00] ' + LRM + 'Alice left\n'
    );
    assert(conv.isGroup === true,                                'three speakers → isGroup true');
    assert(conv.participants.length === 3,                       'three participants retained (no them-collapse)');
    const kinds = conv.systemEvents.map(function (s) { return s.kind; });
    assert(kinds.indexOf('group-create') !== -1,                'group-create event preserved');
    assert(kinds.indexOf('add-participant') !== -1,             'add-participant event preserved');
    assert(kinds.indexOf('leave') !== -1,                       'leave event preserved');
    assert(conv.systemEvents.length === 4,                       'all four system events preserved');
    assert(Contract.validateConversation(conv).valid === true,   'group conversation valid');

    const oneToOne = adapter.toCanonical(
        '[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: Hi\n' +
        '[6/15/24, 9:01:00' + NNBSP + 'AM] Bob: Yo\n'
    );
    assert(oneToOne.isGroup === false,                          'two-speaker chat → isGroup false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 26 — empty / invalid input: no throw, valid empty conversation
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 26 — empty / invalid input', function () {
    let c1, c2, c3, c4;
    assert((function () { try { c1 = adapter.toCanonical(''); return true; } catch (e) { return false; } }()), 'toCanonical(\'\') does not throw');
    assert((function () { try { c2 = adapter.toCanonical(null); return true; } catch (e) { return false; } }()), 'toCanonical(null) does not throw');
    assert((function () { try { c3 = adapter.toCanonical(undefined); return true; } catch (e) { return false; } }()), 'toCanonical(undefined) does not throw');
    assert((function () { try { c4 = adapter.toCanonical(42); return true; } catch (e) { return false; } }()), 'toCanonical(42) does not throw');
    assert(c1.messages.length === 0 && c1.participants.length === 0, 'empty input → empty conversation');
    assert(Contract.validateConversation(c1).valid === true,    'empty conversation still satisfies the contract');
    assert(c1.source.detectedDateFormat === null,               'no date format detected for empty input');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 27 — legacy import() path unchanged by the canonical addition
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 27 — legacy path preserved (strangler-fig)', function () {
    const legacy = adapter['import'](FIXTURE);
    assert(legacy.memories.length === 8,                         'legacy import still yields 8 memories');
    assert(legacy.sourcePlatformId === 'whatsapp',              'legacy sourcePlatformId unchanged');
    assert(legacy.memories[0].senderRole === 'contact',         'legacy senderRole still contact');
    assert(typeof adapter.normalizeAll === 'function',          'legacy normalizeAll still present');
    assert(typeof adapter.canHandle === 'function',             'legacy canHandle still present');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 28 — canonical semantic guard (no commerce / readiness fields)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 28 — canonical semantic guard', function () {
    const conv = adapter.toCanonical('[6/15/24, 9:00:00' + NNBSP + 'AM] Alice: Hi\n');
    assert(conv.proofReady === undefined,                       'conversation has no proofReady');
    assert(conv.checkoutReady === undefined,                    'conversation has no checkoutReady');
    assert(conv.manufacturingReady === undefined,               'conversation has no manufacturingReady');
    assert(conv.messages[0].vendor === undefined,               'message has no vendor field');
    assert(conv.messages[0].order === undefined,                'message has no order field');
    assert(conv.messages[0].reactions.length === 0,             'WhatsApp txt carries no reactions (field empty)');
    assert(conv.messages[0].replyTo.available === false,        'WhatsApp txt marks replies unavailable');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 29 — committed synthetic iOS group fixture (file path, 24h, DMY, U+200E)
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 29 — synthetic iOS group fixture', function () {
    const conv = adapter.toCanonical(GROUP_FIXTURE, { originalFilename: 'ios-group-chat.txt' });
    assert(conv.isGroup === true,                                'fixture is detected as a group');
    assert(conv.participants.length === 3,                       'three participants (Amina, Kwame, Bola)');
    assert(conv.messages.length === 7,                           'seven real messages');
    assert(conv.systemEvents.length === 6,                       'six system events preserved');

    const kinds = conv.systemEvents.map(function (s) { return s.kind; });
    assert(kinds.indexOf('encryption-notice') !== -1,           'encryption notice preserved');
    assert(kinds.indexOf('group-create') !== -1,                'group-create preserved');
    assert(kinds.indexOf('add-participant') !== -1,             'add-participant preserved');
    assert(kinds.indexOf('subject-change') !== -1,              'subject-change preserved');
    assert(kinds.indexOf('leave') !== -1,                       'leave preserved');
    assert(conv.systemEvents.every(function (s) { return s.text.indexOf(LRM) === -1; }), 'U+200E stripped from all system text');

    assert(conv.source.detectedDateFormat === 'DMY',            'DD/MM/YYYY detected as DMY');
    assert(conv.source.hourCycle === 'h24',                     '24-hour clock detected');
    assert(conv.source.originalFilename === 'ios-group-chat.txt', 'originalFilename carried into source metadata');

    const multi = conv.messages.find(function (m) { return m.text && m.text.indexOf('\n') !== -1; });
    assert(multi && multi.text.indexOf('what dates') !== -1,    'multi-line message reassembled across lines');

    const omitted = conv.messages.find(function (m) { return m.media.length && m.media[0].placeholderReason === 'omitted'; });
    assert(omitted && omitted.media[0].present === false,       '<Media omitted> → not-present placeholder');

    const attached = conv.messages.find(function (m) { return m.media.length && m.media[0].filename; });
    assert(attached && /\.jpg$/.test(attached.media[0].filename), '<attached:> filename captured (.jpg)');
    assert(attached.media[0].kind === 'image' && attached.media[0].present === null, 'attached jpg → image, present unknown');

    assert(conv.messages.some(function (m) { return m.isEdited === true; }),  'an edited message detected');
    assert(conv.messages.some(function (m) { return m.isDeleted === true && m.type === 'deleted'; }), 'a deleted message detected');

    assert(Contract.validateConversation(conv).valid === true,  'fixture conversation satisfies the adapter contract');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 30 — self-ID: exact / normalized / alias / participant-id (Package P3)
// ─────────────────────────────────────────────────────────────────────────────

const TWO_PERSON = '[6/15/24, 9:00:00 AM] Amina: hi\n[6/15/24, 9:01:00 AM] Kwame: yo\n[6/15/24, 9:02:00 AM] Amina: again\n';

suite('Suite 30 — self-ID match strategies', function () {
    const exact = adapter.toCanonical(TWO_PERSON, { self: 'Amina' });
    const exactSelf = exact.participants.filter(function (p) { return p.isSelf; });
    assert(exactSelf.length === 1 && exactSelf[0].displayName === 'Amina', 'exact display-name match flips exactly one participant');
    assert(exact.diagnostics.selfMatchMethod === 'exact-name', 'method recorded as exact-name');
    assert(exact.diagnostics.selfIdentified === true,          'selfIdentified true');

    const norm = adapter.toCanonical(TWO_PERSON, { self: '  amina ' });
    const normSelf = norm.participants.filter(function (p) { return p.isSelf; });
    assert(normSelf.length === 1 && normSelf[0].displayName === 'Amina', 'normalized (case/whitespace) name match');
    assert(norm.diagnostics.selfMatchMethod === 'normalized-name', 'method recorded as normalized-name');

    // diacritic-insensitive normalization (José -> jose)
    const JOSE = 'Jos' + String.fromCharCode(0xE9);
    const diac = adapter.toCanonical('[6/15/24, 9:00:00 AM] ' + JOSE + ': hi\n[6/15/24, 9:01:00 AM] Kwame: yo\n', { self: 'jose' });
    assert(diac.participants.filter(function (p) { return p.isSelf; }).length === 1, 'diacritics stripped in normalized match');

    const alias = adapter.toCanonical(TWO_PERSON, { self: { displayName: 'Ama Owusu', aliases: ['Amina'] } });
    const aliasSelf = alias.participants.filter(function (p) { return p.isSelf; });
    assert(aliasSelf.length === 1 && aliasSelf[0].displayName === 'Amina', 'alias-list match');
    assert(alias.diagnostics.selfMatchMethod === 'alias',      'method recorded as alias');

    const base = adapter.toCanonical(TWO_PERSON);
    const aminaId = base.participants[0].id;
    const byId = adapter.toCanonical(TWO_PERSON, { self: { id: aminaId } });
    const idSelf = byId.participants.filter(function (p) { return p.isSelf; });
    assert(idSelf.length === 1 && idSelf[0].id === aminaId,     'explicit participant-id match');
    assert(byId.diagnostics.selfMatchMethod === 'participant-id', 'method recorded as participant-id');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 31 — self-ID: phone-like sender labels / handles
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 31 — self-ID by phone-like label', function () {
    const PHONE = '[6/15/24, 9:00:00 AM] +1 555-123-4567: hi\n[6/15/24, 9:01:00 AM] Kwame: yo\n';
    const byPhone = adapter.toCanonical(PHONE, { self: '+15551234567' });
    const self = byPhone.participants.filter(function (p) { return p.isSelf; });
    assert(self.length === 1 && self[0].displayName === '+1 555-123-4567', 'phone-like sender matched by digits');
    assert(byPhone.diagnostics.selfMatchMethod === 'phone',     'method recorded as phone');

    const byPhoneObj = adapter.toCanonical(PHONE, { self: { phone: '+1 (555) 123 4567' } });
    assert(byPhoneObj.participants.filter(function (p) { return p.isSelf; }).length === 1, 'phone match via opts.self.phone (reformatted)');
    assert(byPhoneObj.diagnostics.warnings.some(function (w) { return w.code === 'SELF_MATCH_BY_PHONE'; }), 'phone match disclosed as a warning');

    const noMatchPhone = adapter.toCanonical(PHONE, { self: '+44 20 7946 0000' });
    assert(noMatchPhone.participants.every(function (p) { return p.isSelf === false; }), 'non-matching phone leaves all non-self');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 32 — self-ID diagnostics: no match / ambiguous / invalid
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 32 — self-ID diagnostics', function () {
    const noMatch = adapter.toCanonical(TWO_PERSON, { self: 'Zelda' });
    assert(noMatch.diagnostics.selfIdentified === false,        'no match → not identified');
    assert(noMatch.participants.every(function (p) { return p.isSelf === false; }), 'no match → nobody flipped self');
    assert(noMatch.diagnostics.warnings.some(function (w) { return w.code === 'NO_SELF_MATCH'; }), 'NO_SELF_MATCH recorded');

    const ambiguous = adapter.toCanonical(GROUP_FIXTURE, { self: { aliases: ['Amina', 'Kwame'] } });
    assert(ambiguous.diagnostics.selfMatchAmbiguous === true,   'two distinct matches → ambiguous');
    assert(ambiguous.diagnostics.selfIdentified === false,      'ambiguous → not identified (conservative)');
    assert(ambiguous.participants.every(function (p) { return p.isSelf === false; }), 'ambiguous → nobody wrongly flipped self');
    assert(ambiguous.diagnostics.selfCandidateCount === 2,      'candidate count recorded');
    assert(ambiguous.diagnostics.warnings.some(function (w) { return w.code === 'MULTIPLE_SELF_MATCHES'; }), 'MULTIPLE_SELF_MATCHES recorded');

    const invalidNum = adapter.toCanonical(TWO_PERSON, { self: 42 });
    assert(invalidNum.diagnostics.warnings.some(function (w) { return w.code === 'INVALID_SELF_OPTION'; }), 'numeric self option → INVALID_SELF_OPTION');
    const invalidEmpty = adapter.toCanonical(TWO_PERSON, { self: {} });
    assert(invalidEmpty.diagnostics.warnings.some(function (w) { return w.code === 'INVALID_SELF_OPTION'; }), 'empty-object self option → INVALID_SELF_OPTION');
    assert(invalidEmpty.diagnostics.selfIdentified === false,   'invalid option → not identified');

    const noOpt = adapter.toCanonical(TWO_PERSON);
    assert(noOpt.diagnostics.selfIdentified === false,          'no opts.self → not identified (no UI patch)');
    assert(noOpt.diagnostics.selfMatchMethod === null,          'no opts.self → no method');
    assert(noOpt.diagnostics.warnings.every(function (w) { return ['NO_SELF_MATCH', 'INVALID_SELF_OPTION', 'MULTIPLE_SELF_MATCHES'].indexOf(w.code) === -1; }), 'no self warnings when self not requested');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 33 — FLAGSHIP: one-sided-sender regression + group preservation
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 33 — one-sided-sender regression', function () {
    // Without self-ID: messages must NOT collapse into a single "them".
    const noSelf = adapter.toCanonical(GROUP_FIXTURE);
    const distinct = {};
    noSelf.messages.forEach(function (m) { distinct[m.participantId] = true; });
    assert(Object.keys(distinct).length === 3,                  'group messages map to 3 distinct participants (no them-collapse)');
    assert(noSelf.participants.length === 3,                    'three distinct participants preserved');
    assert(noSelf.participants.every(function (p) { return p.isSelf === false; }), 'no participant is self before self-ID');

    // With self-ID: only Amina becomes self; others stay distinct non-self.
    const withSelf = adapter.toCanonical(GROUP_FIXTURE, { self: 'Amina' });
    const selfParts = withSelf.participants.filter(function (p) { return p.isSelf; });
    assert(selfParts.length === 1 && selfParts[0].displayName === 'Amina', 'exactly one self participant (Amina)');
    const selfId = selfParts[0].id;
    const selfMsgs = withSelf.messages.filter(function (m) { return m.participantId === selfId; });
    assert(selfMsgs.length === 3 && selfMsgs.length === selfParts[0].messageCount, 'all self messages reference the self participantId');

    const others = withSelf.participants.filter(function (p) { return !p.isSelf; });
    assert(others.length === 2,                                 'two non-self speakers remain distinct participants');
    const otherIds = others.map(function (p) { return p.id; });
    assert(otherIds[0] !== otherIds[1] && otherIds.indexOf(selfId) === -1, 'non-self participants keep their own distinct ids');
    assert(withSelf.messages.some(function (m) { return m.participantId === otherIds[0]; }) &&
           withSelf.messages.some(function (m) { return m.participantId === otherIds[1]; }), 'each non-self speaker still owns their messages');
    assert(Contract.validateConversation(withSelf).valid === true, 'self-identified group conversation passes the contract');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 34 — self-ID: array identifiers, isSelf persistence, contract
// ─────────────────────────────────────────────────────────────────────────────

suite('Suite 34 — self-ID array + persistence', function () {
    // An array of identifiers all describing the SAME self person.
    const arr = adapter.toCanonical(TWO_PERSON, { self: ['Nope', { displayName: 'Amina' }] });
    const arrSelf = arr.participants.filter(function (p) { return p.isSelf; });
    assert(arrSelf.length === 1 && arrSelf[0].displayName === 'Amina', 'array of identifiers resolves the single self');

    // isSelf lives on the Participant (not only on messages/render) and survives a re-validate.
    const conv = adapter.toCanonical(TWO_PERSON, { self: 'Amina' });
    const selfPart = conv.participants.filter(function (p) { return p.isSelf; })[0];
    assert(selfPart.isSelf === true,                            'isSelf stored on the Participant object');
    assert(typeof selfPart.id === 'string' && selfPart.id.indexOf('par-') === 0, 'self participant keeps its stable id');
    assert(Contract.validateConversation(conv).valid === true,  'participant-level self metadata passes the contract');
    assert(conv.diagnostics.selfCandidateCount === 1,           'unique match → candidate count 1');

    // A 1:1 chat with self identified is still not a group.
    assert(conv.isGroup === false,                             'self-identified 1:1 chat is not a group');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
