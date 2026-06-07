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
    load(ctx, 'src/core/emoji-analysis.js');
    return ctx.window.KMEngine;
}

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

function mem(overrides) {
    return Object.assign({
        id:               'mem-test',
        sourcePlatformId: 'imessage',
        sourceAdapterId:  'imessage-chatdb-v1',
        type:             'message',
        timestamp:        '2024-01-15T10:00:00.000Z',
        sender:           'Alice',
        senderRole:       'contact',
        text:             'Hello',
        reactions:        [],
        isAttachmentOnly: false
    }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.EmojiAnalysis === 'object' && KM.EmojiAnalysis !== null,
        'KMEngine.EmojiAnalysis is an object');
    assert(typeof KM.EmojiAnalysis.compute === 'function',
        'compute is a function');
    const r = KM.EmojiAnalysis.compute([mem({ text: '😊' })]);
    assert(typeof r === 'object' && r !== null,
        'compute returns an object');
    assert('topEmojis' in r,            'result has topEmojis field');
    assert('totalEmojiCount' in r,      'result has totalEmojiCount field');
    assert('uniqueEmojiCount' in r,     'result has uniqueEmojiCount field');
    assert('mostEmojifiedSender' in r,  'result has mostEmojifiedSender field');
    assert(Array.isArray(r.topEmojis),  'topEmojis is an Array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — empty/null/invalid input → zero-state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — empty/null/invalid input', function () {
    const KM = makeCtx();
    const zNull = KM.EmojiAnalysis.compute(null);
    assert(zNull.totalEmojiCount === 0,         'compute(null) totalEmojiCount === 0');
    assert(Array.isArray(zNull.topEmojis) && zNull.topEmojis.length === 0,
        'compute(null) topEmojis === []');
    const zUndef = KM.EmojiAnalysis.compute(undefined);
    assert(zUndef.totalEmojiCount === 0,        'compute(undefined) totalEmojiCount === 0');
    const zNum = KM.EmojiAnalysis.compute(42);
    assert(zNum.totalEmojiCount === 0,          'compute(42) totalEmojiCount === 0');
    const zStr = KM.EmojiAnalysis.compute('string');
    assert(zStr.totalEmojiCount === 0,          'compute(string) totalEmojiCount === 0');
    const zEmpty = KM.EmojiAnalysis.compute([]);
    assert(zEmpty.totalEmojiCount === 0,        'compute([]) totalEmojiCount === 0');
    assert(Array.isArray(zEmpty.topEmojis) && zEmpty.topEmojis.length === 0,
        'compute([]) topEmojis === []');
    assert(zEmpty.uniqueEmojiCount === 0,       'compute([]) uniqueEmojiCount === 0');
    assert(zEmpty.mostEmojifiedSender === null,  'compute([]) mostEmojifiedSender === null');
    const zNullEl = KM.EmojiAnalysis.compute([null]);
    assert(zNullEl.totalEmojiCount === 0,       'compute([null]) totalEmojiCount === 0');
    const zNoEmoji = KM.EmojiAnalysis.compute([mem({ text: 'hello world' })]);
    assert(zNoEmoji.totalEmojiCount === 0,      'no-emoji text → totalEmojiCount === 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — basic emoji extraction
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — basic emoji extraction', function () {
    const KM = makeCtx();
    const r1 = KM.EmojiAnalysis.compute([mem({ text: 'Hello 😊 world' })]);
    assert(r1.totalEmojiCount === 1,        'single emoji → totalEmojiCount === 1');
    assert(r1.topEmojis.length === 1,       'single emoji → topEmojis.length === 1');
    assert(r1.topEmojis[0].emoji === '😊',  'topEmojis[0].emoji is the emoji character');
    assert(r1.topEmojis[0].count === 1,     'topEmojis[0].count === 1');
    assert(r1.topEmojis[0].rank === 1,      'topEmojis[0].rank === 1');
    const r2 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉' })]);
    assert(r2.totalEmojiCount === 2,        'two different emoji → totalEmojiCount === 2');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — repeated emoji / count accumulation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — repeated emoji / count accumulation', function () {
    const KM = makeCtx();
    const r1 = KM.EmojiAnalysis.compute([
        mem({ text: '😊', sender: 'Alice' }),
        mem({ text: '😊', sender: 'Alice' }),
    ]);
    assert(r1.totalEmojiCount === 2,        'same emoji in two messages → count 2');
    assert(r1.topEmojis[0].count === 2,     'topEmojis[0].count === 2 for repeated emoji');
    const r2 = KM.EmojiAnalysis.compute([mem({ text: '🎉🎉🎉' })]);
    assert(r2.totalEmojiCount === 3,        'same emoji 3× in one message → totalEmojiCount 3');
    assert(r2.topEmojis[0].count === 3,     'topEmojis[0].count === 3');
    const r3 = KM.EmojiAnalysis.compute([
        mem({ text: '🎉🎉 hello' }),
        mem({ text: '😊' }),
    ]);
    assert(r3.topEmojis[0].emoji === '🎉',  'most-repeated emoji is topEmojis[0]');
    const r4 = KM.EmojiAnalysis.compute([
        mem({ text: '😊', sender: 'A' }),
        mem({ text: '😊', sender: 'B' }),
        mem({ text: '🎉', sender: 'A' }),
    ]);
    assert(r4.totalEmojiCount === 3,        'multi-memory total accumulation');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — totalEmojiCount
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — totalEmojiCount', function () {
    const KM = makeCtx();
    const r1 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉🔥' })]);
    assert(r1.totalEmojiCount === 3,        '3 emoji in one message → totalEmojiCount 3');
    const r2 = KM.EmojiAnalysis.compute([
        mem({ text: '😊' }),
        mem({ text: '🎉' }),
        mem({ text: '🔥' }),
    ]);
    assert(r2.totalEmojiCount === 3,        '1 emoji each in 3 messages → totalEmojiCount 3');
    const r3 = KM.EmojiAnalysis.compute([
        mem({ text: 'no emoji here' }),
        mem({ text: '😊😊' }),
    ]);
    assert(r3.totalEmojiCount === 2,        'message without emoji does not contribute');
    const r4 = KM.EmojiAnalysis.compute([mem({ text: '' })]);
    assert(r4.totalEmojiCount === 0,        'empty text → totalEmojiCount 0');
    const r5 = KM.EmojiAnalysis.compute([mem({ text: '😊', isAttachmentOnly: true })]);
    assert(r5.totalEmojiCount === 1,        'isAttachmentOnly does not block emoji count');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — uniqueEmojiCount
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — uniqueEmojiCount', function () {
    const KM = makeCtx();
    const r1 = KM.EmojiAnalysis.compute([mem({ text: '😊😊😊' })]);
    assert(r1.uniqueEmojiCount === 1,       'same emoji repeated → uniqueEmojiCount 1');
    const r2 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉' })]);
    assert(r2.uniqueEmojiCount === 2,       'two different emoji → uniqueEmojiCount 2');
    const r3 = KM.EmojiAnalysis.compute([
        mem({ text: '😊' }),
        mem({ text: '😊' }),
    ]);
    assert(r3.uniqueEmojiCount === 1,       'same emoji across messages → uniqueEmojiCount 1');
    const r4 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉🔥💕🌟👍' })]);
    assert(r4.uniqueEmojiCount === 6,       '6 distinct emoji → uniqueEmojiCount 6');
    const r5 = KM.EmojiAnalysis.compute([
        mem({ text: 'no emoji' }),
        mem({ text: '😊' }),
    ]);
    assert(r5.uniqueEmojiCount === 1,       'message without emoji excluded from uniqueEmojiCount');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — topEmojis sorting and ranking
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — topEmojis sorting and ranking', function () {
    const KM = makeCtx();
    const r = KM.EmojiAnalysis.compute([
        mem({ text: '😊😊😊' }),
        mem({ text: '🎉🎉' }),
        mem({ text: '🔥' }),
    ]);
    assert(r.topEmojis[0].emoji === '😊',   'most frequent emoji is rank 1');
    assert(r.topEmojis[0].rank === 1,       'rank of most frequent is 1');
    assert(r.topEmojis[1].emoji === '🎉',   'second most frequent is rank 2');
    assert(r.topEmojis[1].rank === 2,       'rank of second is 2');
    assert(r.topEmojis[2].emoji === '🔥',   'third most frequent is rank 3');
    assert(r.topEmojis[2].rank === 3,       'rank of third is 3');
    assert(r.topEmojis[0].count >= r.topEmojis[1].count,
        'topEmojis[0].count >= topEmojis[1].count');
    assert(r.topEmojis[1].count >= r.topEmojis[2].count,
        'topEmojis[1].count >= topEmojis[2].count');
    assert(typeof r.topEmojis[0].emoji === 'string', 'topEmoji.emoji is a string');
    assert(typeof r.topEmojis[0].count === 'number', 'topEmoji.count is a number');
    assert(typeof r.topEmojis[0].rank === 'number',  'topEmoji.rank is a number');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — topEmojis MAX_TOP = 5
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — topEmojis MAX_TOP = 5', function () {
    const KM = makeCtx();
    const r6 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉🔥💕🌟👍' })]);
    assert(r6.topEmojis.length === 5,       '6 unique emoji → topEmojis.length === 5');
    const r7 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉🔥💕🌟👍👋' })]);
    assert(r7.topEmojis.length === 5,       '7 unique emoji → topEmojis.length still 5');
    const r5 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉🔥💕🌟' })]);
    assert(r5.topEmojis.length === 5,       '5 unique emoji → topEmojis.length === 5');
    const r4 = KM.EmojiAnalysis.compute([mem({ text: '😊🎉🔥💕' })]);
    assert(r4.topEmojis.length === 4,       '4 unique emoji → topEmojis.length === 4');
    const r1 = KM.EmojiAnalysis.compute([mem({ text: '😊' })]);
    assert(r1.topEmojis.length === 1,       '1 unique emoji → topEmojis.length === 1');
    assert(r7.topEmojis[4].rank === 5,      'last topEmoji in 7-emoji corpus has rank 5');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — topEmojis tie-breaking (emoji string ascending)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — topEmojis tie-breaking', function () {
    const KM = makeCtx();
    // 🎉 U+1F389, 😊 U+1F60A — 🎉 < 😊 so 🎉 wins rank 1 on tie
    const r = KM.EmojiAnalysis.compute([
        mem({ text: '🎉😊' }),
    ]);
    assert(r.topEmojis.length === 2,                    'tie corpus has 2 topEmojis');
    assert(r.topEmojis[0].count === r.topEmojis[1].count,
        'tie: both have equal count');
    assert(r.topEmojis[0].emoji < r.topEmojis[1].emoji,
        'tie-break: lower codepoint emoji gets rank 1');
    // Specific codepoint check: 🎉 (U+1F389) < 😊 (U+1F60A)
    assert(r.topEmojis[0].emoji === '🎉',               'tie: 🎉 wins rank 1 over 😊');
    assert(r.topEmojis[1].emoji === '😊',               'tie: 😊 is rank 2');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — mostEmojifiedSender
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — mostEmojifiedSender', function () {
    const KM = makeCtx();
    const r1 = KM.EmojiAnalysis.compute([mem({ text: '😊', sender: 'Alice' })]);
    assert(r1.mostEmojifiedSender !== null,               'single sender → mostEmojifiedSender non-null');
    assert(r1.mostEmojifiedSender.sender === 'Alice',     'single sender.sender is Alice');
    assert(r1.mostEmojifiedSender.count === 1,            'single sender.count === 1');
    assert(typeof r1.mostEmojifiedSender.sender === 'string', 'mostEmojifiedSender.sender is string');
    assert(typeof r1.mostEmojifiedSender.count === 'number',  'mostEmojifiedSender.count is number');
    const r2 = KM.EmojiAnalysis.compute([
        mem({ text: '😊😊😊', sender: 'Alice' }),
        mem({ text: '🎉', sender: 'Bob' }),
    ]);
    assert(r2.mostEmojifiedSender.sender === 'Alice',     'Alice (3 emoji) beats Bob (1 emoji)');
    assert(r2.mostEmojifiedSender.count === 3,            'Alice count === 3');
    const r3 = KM.EmojiAnalysis.compute([
        mem({ text: 'no emoji', sender: 'Carol' }),
        mem({ text: '😊', sender: 'Alice' }),
    ]);
    assert(r3.mostEmojifiedSender.sender === 'Alice',     'Carol (0 emoji) not in mostEmojifiedSender');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — mostEmojifiedSender tie-breaking (sender name ascending)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — mostEmojifiedSender tie-breaking', function () {
    const KM = makeCtx();
    // Alice < Bob alphabetically → Alice wins tie
    const r1 = KM.EmojiAnalysis.compute([
        mem({ text: '😊', sender: 'Alice' }),
        mem({ text: '🎉', sender: 'Bob' }),
    ]);
    assert(r1.mostEmojifiedSender.sender === 'Alice',   'tie: Alice < Bob → Alice wins');
    // Zara > Alice → Alice wins
    const r2 = KM.EmojiAnalysis.compute([
        mem({ text: '😊', sender: 'Zara' }),
        mem({ text: '🎉', sender: 'Alice' }),
    ]);
    assert(r2.mostEmojifiedSender.sender === 'Alice',   'tie: Alice < Zara → Alice wins');
    // Three-way tie: Alice, Bob, Carol → Alice wins
    const r3 = KM.EmojiAnalysis.compute([
        mem({ text: '😊', sender: 'Carol' }),
        mem({ text: '🎉', sender: 'Bob' }),
        mem({ text: '🔥', sender: 'Alice' }),
    ]);
    assert(r3.mostEmojifiedSender.sender === 'Alice',   'three-way tie: Alice < Bob < Carol → Alice');
    assert(r3.mostEmojifiedSender.count === 1,          'three-way tie count === 1');
    const r4 = KM.EmojiAnalysis.compute([
        mem({ text: '😊😊', sender: 'Alice' }),
        mem({ text: '🎉🎉🎉', sender: 'Bob' }),
    ]);
    assert(r4.mostEmojifiedSender.sender === 'Bob',     'no tie: higher count wins regardless of name');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — ZWJ and skin-tone modifier sequences
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — ZWJ and skin-tone sequences', function () {
    const KM = makeCtx();
    // 👋🏽 waving hand + medium skin tone modifier
    const rSkin = KM.EmojiAnalysis.compute([mem({ text: '👋🏽' })]);
    assert(rSkin.totalEmojiCount === 1,     '👋🏽 skin-tone sequence counts as 1 emoji');
    assert(rSkin.uniqueEmojiCount === 1,    '👋🏽 uniqueEmojiCount === 1');
    // 👩‍💻 woman technologist (ZWJ sequence)
    const rZwj = KM.EmojiAnalysis.compute([mem({ text: '👩‍💻' })]);
    assert(rZwj.totalEmojiCount === 1,      '👩‍💻 ZWJ sequence counts as 1 emoji');
    assert(rZwj.uniqueEmojiCount === 1,     '👩‍💻 uniqueEmojiCount === 1');
    // Two distinct ZWJ sequences in one text
    const rTwo = KM.EmojiAnalysis.compute([mem({ text: '👩‍💻👨‍🎨' })]);
    assert(rTwo.totalEmojiCount === 2,      'two ZWJ sequences → totalEmojiCount 2');
    assert(rTwo.uniqueEmojiCount === 2,     'two distinct ZWJ sequences → uniqueEmojiCount 2');
    // Skin-tone counted as sender emoji
    const rSender = KM.EmojiAnalysis.compute([mem({ text: '👋🏽', sender: 'Alice' })]);
    assert(rSender.mostEmojifiedSender !== null && rSender.mostEmojifiedSender.count === 1,
        'skin-tone sequence contributes to sender emoji count');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — keycap and special sequences
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — keycap and special sequences', function () {
    const KM = makeCtx();
    const rKey1 = KM.EmojiAnalysis.compute([mem({ text: '1️⃣' })]);
    assert(rKey1.totalEmojiCount === 1,     '1️⃣ keycap counts as 1 emoji');
    const rKeyHash = KM.EmojiAnalysis.compute([mem({ text: '#️⃣' })]);
    assert(rKeyHash.totalEmojiCount === 1,  '#️⃣ keycap counts as 1 emoji');
    const rFlag = KM.EmojiAnalysis.compute([mem({ text: '🇺🇸' })]);
    assert(rFlag.totalEmojiCount === 1,     '🇺🇸 flag counts as 1 emoji');
    const rNoCrash = KM.EmojiAnalysis.compute([mem({ text: '😀\uD800' })]);
    assert(typeof rNoCrash.totalEmojiCount === 'number',
        'does not crash on unusual Unicode sequences');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — fixture behavior
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — fixture behavior', function () {
    const KM = makeCtx();
    // Mirrors the 10-message fake-emoji-conversation.txt fixture
    const fixtureMems = [
        mem({ text: 'Hello everyone 😊',     sender: 'Alice' }),
        mem({ text: 'This is so exciting 🎉🎉🎉', sender: 'Alice' }),
        mem({ text: 'Hey Alice!',             sender: 'Bob'   }),
        mem({ text: 'Look at this 😊💕',     sender: 'Alice' }),
        mem({ text: 'Good morning',           sender: 'Carol' }),
        mem({ text: '🔥🔥 amazing stuff',    sender: 'Alice' }),
        mem({ text: 'Nice 👍',               sender: 'Bob'   }),
        mem({ text: '😊 so happy today',     sender: 'Alice' }),
        mem({ text: 'What a day 💕🌟',       sender: 'Alice' }),
        mem({ text: 'See you 👋',            sender: 'Carol' }),
    ];
    const r = KM.EmojiAnalysis.compute(fixtureMems);
    assert(r.totalEmojiCount === 13,        'fixture totalEmojiCount === 13');
    assert(r.uniqueEmojiCount === 7,        'fixture uniqueEmojiCount === 7');
    assert(r.mostEmojifiedSender !== null && r.mostEmojifiedSender.sender === 'Alice',
        'fixture mostEmojifiedSender.sender === Alice');
    assert(r.mostEmojifiedSender.count === 11,
        'fixture Alice emoji count === 11');
    assert(r.topEmojis.length === 5,        'fixture topEmojis.length === 5 (MAX_TOP)');
    assert(r.topEmojis[0].emoji === '🎉',   'fixture topEmoji rank 1 is 🎉 (count 3, ties with 😊 but lower codepoint)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — semantic guards', function () {
    const KM = makeCtx();
    assert(KM.EmojiAnalysis.ProductDraft === undefined,
        'no ProductDraft property on EmojiAnalysis');
    assert(KM.EmojiAnalysis.BOOK_PAGINATION_VERSION === undefined,
        'no BOOK_PAGINATION_VERSION on EmojiAnalysis');
    assert(KM.EmojiAnalysis.BOOK_PARITY === undefined,
        'no BOOK_PARITY on EmojiAnalysis');
    assert(KM.EmojiAnalysis.proof === undefined,
        'no proof property on EmojiAnalysis');
    assert(KM.EmojiAnalysis.vendor === undefined,
        'no vendor property on EmojiAnalysis');
    const result1 = KM.EmojiAnalysis.compute([mem({ text: '😊' })]);
    const result2 = KM.EmojiAnalysis.compute([mem({ text: '😊' })]);
    assert(result1.totalEmojiCount === result2.totalEmojiCount,
        'compute is pure — same input yields same output');
    assert(Object.keys(KM.EmojiAnalysis).length === 1 && 'compute' in KM.EmojiAnalysis,
        'KMEngine.EmojiAnalysis only exposes compute');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
