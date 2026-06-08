/**
 * Facebook Messenger JSON adapter tests.
 * Run with: node src/tests/facebook-messenger-adapter-tests.mjs
 */

import { createContext, runInContext } from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

function load(ctx, rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    runInContext(code, ctx);
}

function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/core/source-platforms.js');
    load(ctx, 'src/core/normalized-memory.js');
    load(ctx, 'src/core/import-adapters.js');
    load(ctx, 'src/adapters/facebook-messenger-adapter.js');
    load(ctx, 'src/core/import-quality-report.js');
    return ctx.window.KMEngine;
}

const KMEngine = makeCtx();
const adapter  = KMEngine.facebookMessengerAdapter;

const FIXTURE_PATH = join(ROOT, 'scripts', 'fixtures', 'fake-facebook-messenger.json');
const FIXTURE      = readFileSync(FIXTURE_PATH, 'utf8');
const fixtureResult = adapter['import'](FIXTURE);

const IG_FIXTURE_PATH = join(ROOT, 'scripts', 'fixtures', 'fake-instagram-dm.json');
const IG_FIXTURE      = readFileSync(IG_FIXTURE_PATH, 'utf8');

// ── Inline test data ──────────────────────────────────────────────────────────

const MINIMAL_VALID = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":[]}';

const PHOTO_MSG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"photos":[{"uri":"photos/pic.jpg","creation_timestamp":1640000000}],"type":"Generic"}],"magic_words":[]}';

const AUDIO_MSG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"audio_files":[{"uri":"audio/clip.mp4","creation_timestamp":1640000000}],"type":"Generic"}],"magic_words":[]}';

const GIF_MSG = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"gifs":[{"uri":"gifs/anim.gif","creation_timestamp":1640000000}],"type":"Generic"}],"magic_words":[]}';

const SHARE_MSG = '{"participants":[{"name":"Bob"}],"messages":[{"sender_name":"Bob","timestamp_ms":1640000000000,"share":{"link":"https://www.facebook.com/share/FakePost/","share_text":"Check this"},"type":"Share"}],"magic_words":[]}';

const MULTI_MSG = '{"participants":[{"name":"Alice"},{"name":"Bob"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hello","type":"Generic"},{"sender_name":"Bob","timestamp_ms":1640000060000,"content":"Hey","type":"Generic"},{"sender_name":"Alice","timestamp_ms":1640000120000,"content":"How are you?","type":"Generic"}],"magic_words":[]}';

const ENTITY_SENDER_AMP  = '{"participants":[{"name":"Alice & Bob"}],"messages":[{"sender_name":"Alice &amp; Bob","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":[]}';
const ENTITY_SENDER_APOS = '{"participants":[{"name":"Ali\'s"}],"messages":[{"sender_name":"Ali&#39;s","timestamp_ms":1640000000000,"content":"Hello","type":"Generic"}],"magic_words":[]}';

const ENTITY_CONTENT_AMP  = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Fish &amp; chips","type":"Generic"}],"magic_words":[]}';
const ENTITY_CONTENT_APOS = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"It&#39;s great","type":"Generic"}],"magic_words":[]}';
const ENTITY_CONTENT_LT   = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"&lt;tag&gt;","type":"Generic"}],"magic_words":[]}';
const ENTITY_HEX          = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"&#x48;ello","type":"Generic"}],"magic_words":[]}';

// JSON with magic_words removed — should be rejected (matches Instagram DM shape)
const NO_MAGIC_WORDS = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}';

// JSON with magic_words as a non-array type — should be rejected
const MAGIC_WORDS_STRING = '{"participants":[{"name":"Alice"}],"messages":[{"sender_name":"Alice","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":"none"}';

const EMPTY_MESSAGES_JSON = '{"participants":[{"name":"Alice"}],"messages":[],"magic_words":[]}';
const NO_MESSAGES_JSON    = '{"participants":[{"name":"Alice"}],"magic_words":[]}';

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }

function assert(condition, label) {
    if (condition) {
        console.log('  PASS  ' + label);
        passed++;
    } else {
        console.error('  FAIL  ' + label);
        failed++;
    }
}

// ── Suite 1 — API shape ───────────────────────────────────────────────────────

suite('Suite 1 — API shape');
assert(adapter !== undefined,                                              'facebookMessengerAdapter exists on KMEngine');
assert(adapter.id === 'facebook-messenger-json-v1',                        'id is facebook-messenger-json-v1');
assert(adapter.sourcePlatformId === 'facebook-messenger',                  'sourcePlatformId is facebook-messenger');
assert(typeof adapter.label === 'string' && adapter.label.length > 0,     'label is a non-empty string');
assert(adapter.label.indexOf('Facebook') !== -1,                           'label contains Facebook');
assert(typeof adapter.canHandle === 'function',                            'canHandle is a function');
assert(typeof adapter.normalizeAll === 'function',                         'normalizeAll is a function');
assert(typeof adapter['import'] === 'function',                            'import is a function');
assert(KMEngine.adapters['facebook-messenger-json-v1'] === adapter,        'adapter registered in KMEngine.adapters');

// ── Suite 2 — canHandle: accepts ─────────────────────────────────────────────

suite('Suite 2 — canHandle: accepts');
assert(adapter.canHandle(FIXTURE) === true,       'full fixture → true');
assert(adapter.canHandle(MINIMAL_VALID) === true, 'minimal valid JSON with magic_words → true');
assert(adapter.canHandle(PHOTO_MSG) === true,     'photo-only message → true');
assert(adapter.canHandle(SHARE_MSG) === true,     'share-type message → true');
assert(adapter.canHandle(MULTI_MSG) === true,     'multi-participant multi-message thread → true');

// ── Suite 3 — canHandle: rejects Instagram DM ────────────────────────────────

suite('Suite 3 — canHandle: rejects Instagram DM');
assert(adapter.canHandle(IG_FIXTURE) === false,         'Instagram DM fixture (no magic_words) → false');
assert(adapter.canHandle(NO_MAGIC_WORDS) === false,     'valid Meta-shape JSON without magic_words → false');
assert(adapter.canHandle(MAGIC_WORDS_STRING) === false, 'magic_words as string (not array) → false');

// ── Suite 4 — canHandle: rejects non-Facebook formats ────────────────────────

suite('Suite 4 — canHandle: rejects non-Facebook formats');
assert(adapter.canHandle('') === false,          'empty string → false');
assert(adapter.canHandle(42) === false,          'number → false');
assert(adapter.canHandle(null) === false,        'null → false');
assert(adapter.canHandle('not json') === false,  'malformed JSON → false');
assert(adapter.canHandle('{}') === false,        'empty object → false');
assert(adapter.canHandle('[]') === false,        'JSON array → false');
assert(adapter.canHandle('[6/1/24, 9:00:00 AM] Alice: Hi') === false, 'WhatsApp bracket TXT → false');
assert(adapter.canHandle('<smses count="1"><sms date="1705305600000" type="1" address="+1555" body="Hi" /></smses>') === false, 'Android SMS XML → false');
assert(adapter.canHandle('2024-06-01 09:00:00 | Me | Hello') === false, 'pipe-delimited TXT → false');
assert(adapter.canHandle(EMPTY_MESSAGES_JSON) === false, 'messages array with no timestamp_ms → false');

// ── Suite 5 — canHandle: magic_words discriminator ───────────────────────────

suite('Suite 5 — canHandle: magic_words discriminator');
assert(adapter.canHandle('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":[]}') === true,  'magic_words: [] accepted');
assert(adapter.canHandle('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":["hello"]}') === true, 'magic_words: ["hello"] accepted');
assert(adapter.canHandle('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}]}') === false, 'magic_words absent → false');
assert(adapter.canHandle('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic"}],"magic_words":null}') === false, 'magic_words: null (not array) → false');

// ── Suite 6 — Fixture rawCounts ───────────────────────────────────────────────

suite('Suite 6 — Fixture rawCounts');
assert(fixtureResult.rawCounts.total    === 10, 'rawCounts.total = 10');
assert(fixtureResult.rawCounts.imported === 8,  'rawCounts.imported = 8');
assert(fixtureResult.rawCounts.skipped  === 2,  'rawCounts.skipped = 2');
assert(fixtureResult.memories.length    === 8,  'memories.length = 8');
assert(fixtureResult.importWarnings.length === 2, 'importWarnings.length = 2');
assert(fixtureResult.sourcePlatformId === 'facebook-messenger', 'sourcePlatformId = facebook-messenger');

// ── Suite 7 — Timestamp conversion ───────────────────────────────────────────

suite('Suite 7 — Timestamp conversion');
assert(fixtureResult.memories[0].timestamp === new Date(1609459200000).toISOString(), 'timestamp_ms 1609459200000 → ISO-8601');
assert(fixtureResult.memories[1].timestamp === new Date(1609459260000).toISOString(), 'timestamp_ms 1609459260000 → ISO-8601');
assert(fixtureResult.memories.every(function (m) { return typeof m.timestamp === 'string'; }), 'all imported memories have string timestamps');
const epochResult = adapter['import']('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":0,"content":"Hi","type":"Generic"}],"magic_words":[]}');
assert(typeof epochResult.memories[0].timestamp === 'string', 'timestamp_ms: 0 (epoch zero) produces a valid string timestamp');

// ── Suite 8 — HTML entity decoding: sender_name ──────────────────────────────

suite('Suite 8 — HTML entity decoding: sender_name');
const rAmp  = adapter['import'](ENTITY_SENDER_AMP).memories[0];
const rApos = adapter['import'](ENTITY_SENDER_APOS).memories[0];
assert(rAmp.sender  === 'Alice & Bob', '&amp; in sender_name decoded to &');
assert(rApos.sender === "Ali's",       '&#39; in sender_name decoded to single-quote');
assert(rAmp.sender.indexOf('&amp;') === -1, 'no raw &amp; entity remains in decoded sender');
assert(rApos.sender.indexOf('&#39;') === -1, 'no raw &#39; entity remains in decoded sender');

// ── Suite 9 — HTML entity decoding: content ──────────────────────────────────

suite('Suite 9 — HTML entity decoding: content');
assert(fixtureResult.memories[1].text === 'Work & family keeping me busy!', '&amp; in content decoded to &');
assert(fixtureResult.memories[6].text === "That's awesome!",                '&#39; in content decoded to single-quote');
const rLt  = adapter['import'](ENTITY_CONTENT_LT).memories[0];
assert(rLt.text === '<tag>', '&lt; and &gt; in content decoded to < and >');
const hexResult = adapter['import'](ENTITY_HEX).memories[0];
assert(hexResult.text === 'Hello', '&#x48; hex entity decoded to H');

// ── Suite 10 — senderRole always contact ─────────────────────────────────────

suite('Suite 10 — senderRole always contact');
assert(fixtureResult.memories[0].senderRole === 'contact', 'text message has senderRole contact');
assert(fixtureResult.memories[2].senderRole === 'contact', 'photo attachment message has senderRole contact');
assert(fixtureResult.memories[5].senderRole === 'contact', 'share message has senderRole contact');
assert(fixtureResult.memories.every(function (m) { return m.senderRole === 'contact'; }), 'all imported memories have senderRole contact');

// ── Suite 11 — Text message normalization ─────────────────────────────────────

suite('Suite 11 — Text message normalization');
const textMem = fixtureResult.memories[0];
assert(textMem.type === 'message',                        'text message has type message');
assert(textMem.isAttachmentOnly === false,                 'text message has isAttachmentOnly false');
assert(textMem.text === 'Hey! Long time no chat.',        'text message text is set correctly');
assert(textMem.sourcePlatformId === 'facebook-messenger', 'text message sourcePlatformId is facebook-messenger');
assert(textMem.sourceAdapterId  === 'facebook-messenger-json-v1', 'text message sourceAdapterId is facebook-messenger-json-v1');

// ── Suite 12 — Media/attachment normalization ─────────────────────────────────

suite('Suite 12 — Media/attachment normalization');
const photoMem  = fixtureResult.memories[2];
const videoMem  = fixtureResult.memories[3];
const audioMem  = fixtureResult.memories[4];
const shareMem  = fixtureResult.memories[5];
const stickerMem = fixtureResult.memories[7];
assert(photoMem.type  === 'attachment-placeholder', 'photo → type attachment-placeholder');
assert(photoMem.isAttachmentOnly === true,           'photo → isAttachmentOnly true');
assert(photoMem.text  === '[Attachment]',            'photo → text [Attachment]');
assert(videoMem.type  === 'attachment-placeholder',  'video → type attachment-placeholder');
assert(videoMem.isAttachmentOnly === true,            'video → isAttachmentOnly true');
assert(audioMem.type  === 'attachment-placeholder',  'audio_files → type attachment-placeholder');
assert(audioMem.isAttachmentOnly === true,            'audio_files → isAttachmentOnly true');
assert(shareMem.type  === 'attachment-placeholder',  'share → type attachment-placeholder');
assert(shareMem.isAttachmentOnly === true,            'share → isAttachmentOnly true');
assert(shareMem.text  === '[Attachment]',             'share → text [Attachment]');
assert(stickerMem.type === 'attachment-placeholder', 'sticker → type attachment-placeholder');
assert(stickerMem.isAttachmentOnly === true,          'sticker → isAttachmentOnly true');
const gifResult = adapter['import'](GIF_MSG);
assert(gifResult.memories[0].isAttachmentOnly === true, 'gifs → isAttachmentOnly true');

// ── Suite 13 — NormalizedMemory required fields ───────────────────────────────

suite('Suite 13 — NormalizedMemory required fields');
const mem0 = fixtureResult.memories[0];
assert(typeof mem0.id === 'string' && mem0.id.startsWith('mem-'), 'id starts with mem-');
assert(mem0.sourcePlatformId === 'facebook-messenger',             'sourcePlatformId = facebook-messenger');
assert(mem0.sourceAdapterId  === 'facebook-messenger-json-v1',    'sourceAdapterId = facebook-messenger-json-v1');
assert(Array.isArray(mem0.reactions),                             'reactions is an array');
assert(typeof mem0.sender === 'string' && mem0.sender.length > 0, 'sender is a non-empty string');
assert(typeof mem0.timestamp === 'string',                         'timestamp is a string');
assert(mem0.type === 'message' || mem0.type === 'attachment-placeholder', 'type is message or attachment-placeholder');
assert(mem0.provenance !== null && mem0.provenance.adapterVersion === '1', 'provenance.adapterVersion is 1');

// ── Suite 14 — importWarnings behavior ───────────────────────────────────────

suite('Suite 14 — importWarnings behavior');
const warns = fixtureResult.importWarnings;
assert(warns.some(function (w) { return w.message.indexOf('is_unsent') !== -1; }),   'is_unsent message produces a warning');
assert(warns.some(function (w) { return w.message.indexOf('sender_name') !== -1; }), 'missing sender_name produces a warning');
assert(typeof warns[0].index === 'number',   'warning has numeric index');
assert(typeof warns[0].message === 'string', 'warning has string message');
assert(warns.length === 2,                   'exactly 2 warnings for 2 skipped messages');

// ── Suite 15 — Empty/malformed input does not throw ──────────────────────────

suite('Suite 15 — Empty/malformed input does not throw');
const emptyResult = adapter['import']('');
assert(emptyResult.memories.length === 0 && emptyResult.rawCounts.total === 0, 'empty string → 0 memories, no throw');
const whitespaceResult = adapter['import']('   ');
assert(whitespaceResult.memories.length === 0, 'whitespace-only string → 0 memories');
const badJsonResult = adapter['import']('not json at all');
assert(badJsonResult.memories.length === 0 && badJsonResult.importWarnings.length > 0, 'malformed JSON → 0 memories + parse error warning');
const numResult = adapter['import'](42);
assert(numResult.memories.length === 0, 'number input → 0 memories');
const noMsgResult = adapter['import'](NO_MESSAGES_JSON);
assert(noMsgResult.memories.length === 0 && noMsgResult.rawCounts.total === 0, 'JSON without messages array → 0 memories');

// ── Suite 16 — Participants extraction ───────────────────────────────────────

suite('Suite 16 — Participants extraction');
const parts = fixtureResult.participants;
assert(Array.isArray(parts),                 'participants is an array');
assert(parts.length === 2,                   'participant count = 2 unique senders');
assert(parts[0] === 'Alice Johnson',         'first participant is Alice Johnson (first-seen order)');
assert(parts[1] === 'charlie_b_99',          'second participant is charlie_b_99');

// ── Suite 17 — Semantic guards ────────────────────────────────────────────────

suite('Suite 17 — Semantic guards');
assert(mem0.proof           === undefined, 'no proof field on NormalizedMemory');
assert(mem0.checkout        === undefined, 'no checkout field on NormalizedMemory');
assert(mem0.manufacturing   === undefined, 'no manufacturing field on NormalizedMemory');
assert(mem0.estimatedPages  === undefined, 'no estimatedPages field on NormalizedMemory');
assert(adapter.isManufacturingReady === undefined, 'no isManufacturingReady field on adapter');

// ── Suite 18 — Reaction capture (Package 3AG) ────────────────────────────────

suite('Suite 18 — Reaction capture');
const FB_THUMBSUP = String.fromCodePoint(0x1F44D);
const FB_HEART    = String.fromCodePoint(0x2764, 0xFE0F);
const fbNoReact = fixtureResult.memories[0];
const fbReact1  = fixtureResult.memories[1];
const fbReact6  = fixtureResult.memories[6];
assert(Array.isArray(fbNoReact.reactions) && fbNoReact.reactions.length === 0, 'message without reactions → reactions []');
assert(fbReact1.reactions.length === 1,                     'reacted message → 1 reaction captured');
assert(fbReact1.reactions[0].reactor === 'Alice Johnson',  'reaction reactor mapped from actor');
assert(fbReact1.reactions[0].emoji === FB_THUMBSUP,        'mojibake reaction decoded to thumbs-up emoji');
assert(fbReact1.reactions[0].label === null,               'reaction label is null');
assert(fbReact6.reactions.length === 1 && fbReact6.reactions[0].emoji === FB_HEART, 'clean unicode reaction preserved');
assert(Object.keys(fbReact1.reactions[0]).sort().join(',') === 'emoji,label,reactor', 'canonical reaction shape is { reactor, emoji, label }');
const fbFallbackJson = '{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic","reactions":[{"reaction":"' + String.fromCharCode(0xF0) + '","actor":"B"}]}],"magic_words":[]}';
const fbFallback = adapter['import'](fbFallbackJson).memories[0];
assert(fbFallback.reactions.length === 1, 'undecodable reaction is preserved, not dropped');
assert(typeof fbFallback.reactions[0].emoji === 'string' && fbFallback.reactions[0].emoji.length > 0, 'undecodable reaction keeps a raw string');
const fbMalformed = adapter['import']('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic","reactions":"notarray"}],"magic_words":[]}').memories[0];
assert(Array.isArray(fbMalformed.reactions) && fbMalformed.reactions.length === 0, 'non-array reactions → []');
const fbPartial = adapter['import']('{"participants":[{"name":"A"}],"messages":[{"sender_name":"A","timestamp_ms":1640000000000,"content":"Hi","type":"Generic","reactions":[null,42,{"foo":"bar"},{"reaction":"x","actor":"B"}]}],"magic_words":[]}').memories[0];
assert(fbPartial.reactions.length === 1 && fbPartial.reactions[0].emoji === 'x', 'malformed reaction entries ignored; valid one kept');
assert(fbReact1.type === 'message' && fbReact1.text === 'Work & family keeping me busy!', 'reacted message text/type unchanged');
assert(fbReact1.sender === 'charlie_b_99' && fbReact1.senderRole === 'contact', 'reacted message sender/role unchanged');
const fbIqr = KMEngine.ImportQualityReport.compute(fixtureResult.memories);
assert(fbIqr.totalReactionCount === 2,         'ImportQualityReport totalReactionCount = 2 for enriched fixture');
assert(fbIqr.messagesWithReactionsCount === 2, 'ImportQualityReport messagesWithReactionsCount = 2 for enriched fixture');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
