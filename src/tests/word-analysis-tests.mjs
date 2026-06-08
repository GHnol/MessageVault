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
    load(ctx, 'src/core/word-analysis.js');
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
    assert(typeof KM.WordAnalysis === 'object' && KM.WordAnalysis !== null,
        'KMEngine.WordAnalysis is an object');
    assert(typeof KM.WordAnalysis.compute === 'function',
        'compute is a function');
    const r = KM.WordAnalysis.compute([mem({ text: 'hello world' })]);
    assert(typeof r === 'object' && r !== null,
        'compute returns an object');
    assert('totalWords' in r,           'result has totalWords field');
    assert('avgWordsPerMessage' in r,   'result has avgWordsPerMessage field');
    assert('topWords' in r,             'result has topWords field');
    assert('topWordSender' in r,        'result has topWordSender field');
    assert(Array.isArray(r.topWords),   'topWords is an Array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — zero-state: compute([])
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — zero-state: compute([])', function () {
    const KM = makeCtx();
    const z = KM.WordAnalysis.compute([]);
    assert(z.totalWords === 0,                  'compute([]) totalWords === 0');
    assert(z.avgWordsPerMessage === 0,          'compute([]) avgWordsPerMessage === 0');
    assert(Array.isArray(z.topWords),           'compute([]) topWords is Array');
    assert(z.topWords.length === 0,             'compute([]) topWords is empty');
    assert(z.topWordSender === null,            'compute([]) topWordSender === null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — zero-state: null / non-array inputs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — zero-state: null/non-array inputs', function () {
    const KM = makeCtx();
    const zNull = KM.WordAnalysis.compute(null);
    assert(zNull.totalWords === 0,              'compute(null) totalWords === 0');
    assert(zNull.topWords.length === 0,         'compute(null) topWords empty');
    const zUndef = KM.WordAnalysis.compute(undefined);
    assert(zUndef.totalWords === 0,             'compute(undefined) totalWords === 0');
    const zStr = KM.WordAnalysis.compute('hello');
    assert(zStr.totalWords === 0,               'compute("hello") totalWords === 0');
    const zNum = KM.WordAnalysis.compute(42);
    assert(zNum.totalWords === 0,               'compute(42) totalWords === 0');
    const zObj = KM.WordAnalysis.compute({});
    assert(zObj.totalWords === 0,               'compute({}) totalWords === 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — attachment-only exclusion
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — attachment-only exclusion', function () {
    const KM = makeCtx();
    const rType = KM.WordAnalysis.compute([mem({ type: 'attachment-placeholder', text: 'image file' })]);
    assert(rType.totalWords === 0,
        'type=attachment-placeholder excluded even with text content');
    const rFlag = KM.WordAnalysis.compute([mem({ isAttachmentOnly: true, text: 'video file here' })]);
    assert(rFlag.totalWords === 0,
        'isAttachmentOnly=true excluded even with text content');
    const mixed = KM.WordAnalysis.compute([
        mem({ type: 'attachment-placeholder', text: 'image' }),
        mem({ text: 'hello world', isAttachmentOnly: false })
    ]);
    assert(mixed.totalWords === 2,
        'attachment excluded; text message counted in mixed array');
    assert(mixed.topWords.length > 0,
        'topWords populated when text messages present alongside attachments');
    const allAttach = KM.WordAnalysis.compute([
        mem({ type: 'attachment-placeholder', text: 'one two three' }),
        mem({ isAttachmentOnly: true, text: 'four five six' })
    ]);
    assert(allAttach.totalWords === 0,
        'all-attachment array returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — basic word extraction
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — basic word extraction', function () {
    const KM = makeCtx();
    const r = KM.WordAnalysis.compute([mem({ text: 'one two three' })]);
    assert(r.totalWords === 3,
        'three-word message produces totalWords === 3');
    assert(r.topWords.length === 3,
        'three distinct words produces topWords length 3');
    assert(r.topWords.every(function (w) { return w.count === 1; }),
        'each word appears once, count === 1');
    const r2 = KM.WordAnalysis.compute([mem({ text: 'apple apple apple' })]);
    assert(r2.topWords[0].word === 'apple' && r2.topWords[0].count === 3,
        'repeated word accumulates count correctly');
    const r3 = KM.WordAnalysis.compute([mem({ text: 'a' })]);
    assert(r3.totalWords === 1,
        'single-char word counted');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — lowercase normalization
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — lowercase normalization', function () {
    const KM = makeCtx();
    const r = KM.WordAnalysis.compute([
        mem({ text: 'Hello' }),
        mem({ text: 'hello' }),
        mem({ text: 'HELLO' })
    ]);
    assert(r.totalWords === 3,
        'three messages with uppercase variants = 3 totalWords');
    assert(r.topWords.length === 1,
        'Hello/hello/HELLO all collapse to one word entry');
    assert(r.topWords[0].word === 'hello',
        'stored word is lowercase');
    assert(r.topWords[0].count === 3,
        'count is 3 after case folding');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — punctuation stripping
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — punctuation stripping', function () {
    const KM = makeCtx();
    const r1 = KM.WordAnalysis.compute([mem({ text: 'hello!' })]);
    assert(r1.topWords[0].word === 'hello',
        'trailing ! stripped from word');
    const r2 = KM.WordAnalysis.compute([mem({ text: '"world"' })]);
    assert(r2.topWords[0].word === 'world',
        'surrounding quotes stripped from word');
    const r3 = KM.WordAnalysis.compute([mem({ text: '.end.' })]);
    assert(r3.topWords[0].word === 'end',
        'surrounding dots stripped from word');
    const r4 = KM.WordAnalysis.compute([mem({ text: 'hello! world,' })]);
    assert(r4.totalWords === 2,
        'punctuation-stripped message produces correct word count');
    const r5 = KM.WordAnalysis.compute([mem({ text: '!!!' })]);
    assert(r5.totalWords === 0,
        'punctuation-only token strips to empty and is excluded');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — word accumulation across messages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — word accumulation across messages', function () {
    const KM = makeCtx();
    const r = KM.WordAnalysis.compute([
        mem({ text: 'hello world' }),
        mem({ text: 'hello again' }),
        mem({ text: 'world peace' })
    ]);
    assert(r.totalWords === 6,
        'word totals accumulate across messages (2+2+2=6)');
    const hello = r.topWords.find(function (w) { return w.word === 'hello'; });
    const world = r.topWords.find(function (w) { return w.word === 'world'; });
    assert(hello && hello.count === 2,
        '"hello" count accumulates across messages');
    assert(world && world.count === 2,
        '"world" count accumulates across messages');
    const once = r.topWords.find(function (w) { return w.word === 'again'; });
    assert(once && once.count === 1,
        '"again" appears once across messages');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — totalWords accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — totalWords accuracy', function () {
    const KM = makeCtx();
    const r = KM.WordAnalysis.compute([
        mem({ text: 'one' }),
        mem({ text: 'two three' }),
        mem({ text: 'four five six' })
    ]);
    assert(r.totalWords === 6,
        'totalWords sums words across all messages (1+2+3=6)');
    const withPunct = KM.WordAnalysis.compute([mem({ text: 'hello! world, ok.' })]);
    assert(withPunct.totalWords === 3,
        'punctuation-stripped words counted correctly');
    const noText = KM.WordAnalysis.compute([mem({ text: '' }), mem({ text: '   ' })]);
    assert(noText.totalWords === 0,
        'blank text messages contribute 0 totalWords');
    const nullText = KM.WordAnalysis.compute([mem({ text: null })]);
    assert(nullText.totalWords === 0,
        'null text contributes 0 totalWords');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — avgWordsPerMessage rounding
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — avgWordsPerMessage rounding', function () {
    const KM = makeCtx();
    const exact = KM.WordAnalysis.compute([
        mem({ text: 'a b' }),
        mem({ text: 'c d' })
    ]);
    assert(exact.avgWordsPerMessage === 2.0,
        'integer average (4/2=2.0) returned correctly');
    const r1 = KM.WordAnalysis.compute([
        mem({ text: 'a b c' }),
        mem({ text: 'd' })
    ]);
    assert(r1.avgWordsPerMessage === 2.0,
        '4 words / 2 messages = 2.0 (exact)');
    const r2 = KM.WordAnalysis.compute([
        mem({ text: 'a b c' }),
        mem({ text: 'd e f g h i j' })
    ]);
    assert(r2.avgWordsPerMessage === 5.0,
        '10 words / 2 messages = 5.0');
    const r3 = KM.WordAnalysis.compute([
        mem({ text: 'a' }),
        mem({ text: 'b' }),
        mem({ text: 'c d e' })
    ]);
    assert(r3.avgWordsPerMessage === 1.7,
        '5 words / 3 messages = 1.666... rounds to 1.7');
    const r4 = KM.WordAnalysis.compute([
        mem({ text: 'a b' }),
        mem({ text: 'c d' }),
        mem({ text: 'e' })
    ]);
    assert(r4.avgWordsPerMessage === 1.7,
        '5 words / 3 messages = 1.666... rounds to 1.7');
    const r5 = KM.WordAnalysis.compute([mem({ text: 'hello world' })]);
    assert(r5.avgWordsPerMessage === 2.0,
        'single message avg equals its word count');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — topWords sorting: count desc, word asc tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — topWords sorting', function () {
    const KM = makeCtx();
    const r = KM.WordAnalysis.compute([
        mem({ text: 'zebra zebra zebra' }),
        mem({ text: 'apple apple' }),
        mem({ text: 'mango' })
    ]);
    assert(r.topWords[0].word === 'zebra',
        'highest-count word is rank 1 regardless of alphabetical order');
    assert(r.topWords[0].rank === 1,
        'rank property is 1 for top word');
    const tie = KM.WordAnalysis.compute([
        mem({ text: 'banana banana' }),
        mem({ text: 'apple apple' })
    ]);
    assert(tie.topWords[0].word === 'apple',
        'tie in count: alphabetically first word ranks higher');
    assert(tie.topWords[1].word === 'banana',
        'tie in count: alphabetically later word ranks second');
    assert(tie.topWords[0].rank === 1 && tie.topWords[1].rank === 2,
        'ranks are assigned sequentially starting at 1');
    const rankCheck = KM.WordAnalysis.compute([
        mem({ text: 'a a a b b c' })
    ]);
    assert(rankCheck.topWords[0].rank === 1 &&
           rankCheck.topWords[1].rank === 2 &&
           rankCheck.topWords[2].rank === 3,
        'ranks increment correctly for each position');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — MAX_TOP = 10
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — MAX_TOP = 10', function () {
    const KM = makeCtx();
    const words = 'aaa bbb ccc ddd eee fff ggg hhh iii jjj kkk lll mmm nnn';
    const r = KM.WordAnalysis.compute([mem({ text: words })]);
    assert(r.topWords.length === 10,
        'topWords capped at 10 when more than 10 unique words');
    assert(r.totalWords === 14,
        'totalWords includes all 14 words even with MAX_TOP cap');
    const few = KM.WordAnalysis.compute([mem({ text: 'one two three' })]);
    assert(few.topWords.length === 3,
        'topWords returns fewer than 10 when only 3 unique words');
    const exactly10 = 'a b c d e f g h i j';
    const r10 = KM.WordAnalysis.compute([mem({ text: exactly10 })]);
    assert(r10.topWords.length === 10,
        'topWords returns exactly 10 when exactly 10 unique words');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — topWordSender basic
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — topWordSender basic', function () {
    const KM = makeCtx();
    const noSender = KM.WordAnalysis.compute([mem({ text: 'hello world', sender: '' })]);
    assert(noSender.topWordSender === null,
        'topWordSender is null when sender is empty string');
    const one = KM.WordAnalysis.compute([
        mem({ text: 'hello world', sender: 'Alice' })
    ]);
    assert(one.topWordSender !== null,
        'topWordSender is not null when sender present');
    assert(one.topWordSender.sender === 'Alice',
        'topWordSender.sender matches the sender name');
    assert(one.topWordSender.wordCount === 2,
        'topWordSender.wordCount counts words for that sender');
    const two = KM.WordAnalysis.compute([
        mem({ text: 'hello world good', sender: 'Alice' }),
        mem({ text: 'hi', sender: 'Bob' })
    ]);
    assert(two.topWordSender.sender === 'Alice',
        'sender with more words is topWordSender');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — topWordSender tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — topWordSender tie-break', function () {
    const KM = makeCtx();
    const tied = KM.WordAnalysis.compute([
        mem({ text: 'hello world', sender: 'Zara' }),
        mem({ text: 'foo bar',     sender: 'Alice' })
    ]);
    assert(tied.topWordSender.sender === 'Alice',
        'tie in wordCount: alphabetically first sender wins');
    const tiedMore = KM.WordAnalysis.compute([
        mem({ text: 'one two three', sender: 'Charlie' }),
        mem({ text: 'four five six', sender: 'Bob' })
    ]);
    assert(tiedMore.topWordSender.sender === 'Bob',
        'tie in wordCount: "Bob" < "Charlie" alphabetically');
    const tiedCheck = KM.WordAnalysis.compute([
        mem({ text: 'a b c', sender: 'Alice' }),
        mem({ text: 'd e f', sender: 'Bob' })
    ]);
    assert(tiedCheck.topWordSender.wordCount === 3,
        'tied topWordSender.wordCount is correct');
    assert(tiedCheck.topWordSender.sender === 'Alice',
        'tied: Alice < Bob alphabetically');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — multi-sender scenario
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — multi-sender scenario', function () {
    const KM = makeCtx();
    // Alice: "hello world hello"(3) + "hello"(1) = 4 words
    // Bob: "world world world"(3) = 3 words
    const r = KM.WordAnalysis.compute([
        mem({ text: 'hello world hello', sender: 'Alice' }),
        mem({ text: 'world world world', sender: 'Bob' }),
        mem({ text: 'hello',             sender: 'Alice' })
    ]);
    assert(r.totalWords === 7,
        'total words across all senders is correct (3+3+1=7)');
    const hello = r.topWords.find(function (w) { return w.word === 'hello'; });
    assert(hello && hello.count === 3,
        '"hello" count accumulates across senders (2+1=3)');
    const world = r.topWords.find(function (w) { return w.word === 'world'; });
    assert(world && world.count === 4,
        '"world" count accumulates across senders (1+3=4)');
    assert(r.topWords[0].word === 'world',
        '"world" has count 4, is rank 1 (highest)');
    assert(r.topWordSender.sender === 'Alice',
        'Alice sent 4 words vs Bob 3: Alice is topWordSender');
    assert(r.topWordSender.wordCount === 4,
        'Alice topWordSender.wordCount === 4');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — malformed / null entries, no throw
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — malformed/null entries, no throw', function () {
    const KM = makeCtx();
    let threw = false;
    try {
        KM.WordAnalysis.compute([null, undefined, 42, 'string', mem({ text: 'hello' })]);
    } catch (e) {
        threw = true;
    }
    assert(!threw,
        'compute does not throw on null/non-object entries in array');
    const r = KM.WordAnalysis.compute([null, undefined, mem({ text: 'hello' })]);
    assert(r.totalWords === 1,
        'valid entries counted even alongside null/undefined entries');
    const rNullText = KM.WordAnalysis.compute([mem({ text: null }), mem({ text: 'ok' })]);
    assert(rNullText.totalWords === 1,
        'null text field is handled gracefully');
    const rNoText = KM.WordAnalysis.compute([{}, mem({ text: 'test' })]);
    assert(rNoText.totalWords === 1,
        'object without text field handled gracefully');
    const allNull = KM.WordAnalysis.compute([null, null, null]);
    assert(allNull.totalWords === 0 && allNull.topWords.length === 0,
        'all-null array returns zero-state without throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — blank / empty text messages
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — blank/empty text messages', function () {
    const KM = makeCtx();
    const r = KM.WordAnalysis.compute([
        mem({ text: '' }),
        mem({ text: '   ' }),
        mem({ text: '\t\n' })
    ]);
    assert(r.totalWords === 0,
        'blank/whitespace-only text messages contribute 0 words');
    assert(r.topWordSender === null,
        'topWordSender null when all messages have blank text');
    const mixed = KM.WordAnalysis.compute([
        mem({ text: '' }),
        mem({ text: 'hello world' })
    ]);
    assert(mixed.avgWordsPerMessage === 2.0,
        'blank messages excluded from message count for avg calculation');
    assert(mixed.totalWords === 2,
        'only non-blank messages contribute to totalWords');
    const r2 = KM.WordAnalysis.compute([mem({ text: '  spaces  ' })]);
    assert(r2.totalWords === 1,
        'text with leading/trailing whitespace extracts inner word correctly');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — fixture scenario
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — fixture scenario', function () {
    const KM = makeCtx();
    // Mirrors fake-word-analysis.txt word content (WhatsApp bracket format, 10 messages)
    // Alice: msgs 1,3,4,6,7,9 = 22 words   Bob: msgs 2,5,8,10 = 14 words
    const fixture = [
        mem({ text: 'hello world hello world',  sender: 'Alice' }),   // 4 words
        mem({ text: 'hello friend world',        sender: 'Bob' }),     // 3 words
        mem({ text: 'great day great day great', sender: 'Alice' }),   // 5 words
        mem({ text: 'hello hello hello',         sender: 'Alice' }),   // 3 words
        mem({ text: 'day is great today friend', sender: 'Bob' }),     // 5 words
        mem({ text: 'world of wonders world',    sender: 'Alice' }),   // 4 words
        mem({ text: 'hello again hello',         sender: 'Alice' }),   // 3 words
        mem({ text: 'friend of mine',            sender: 'Bob' }),     // 3 words
        mem({ text: 'great hello today',         sender: 'Alice' }),   // 3 words
        mem({ text: 'wonders today today',       sender: 'Bob' })      // 3 words
    ];
    const r = KM.WordAnalysis.compute(fixture);
    assert(r.totalWords === 36,
        'fixture totalWords === 36');
    assert(r.avgWordsPerMessage === 3.6,
        'fixture avgWordsPerMessage === 3.6');
    assert(r.topWords.length === 10,
        'fixture produces exactly 10 topWords (11 unique words, capped at MAX_TOP)');
    assert(r.topWords[0].word === 'hello' && r.topWords[0].count === 9,
        'fixture top word is "hello" with count 9');
    assert(r.topWordSender !== null && r.topWordSender.sender === 'Alice',
        'fixture topWordSender is Alice');
    assert(r.topWordSender.wordCount === 22,
        'fixture Alice wordCount === 22');
    assert(r.topWords[1].word === 'great',
        'fixture rank 2 is "great" (count 5, ties world, alphabetically first)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — semantic guards', function () {
    const KM = makeCtx();
    assert(Object.keys(KM.WordAnalysis).length === 1 && 'compute' in KM.WordAnalysis,
        'WordAnalysis only exposes compute — no extra surface area');
    assert(typeof KM.WordAnalysis.compute === 'function',
        'compute is a function (not a class or constructor)');
    assert(KM.ProductDraftState === undefined,
        'ProductDraftState not present in this module context');
    assert(KM.BOOK_PAGINATION_VERSION === undefined,
        'BOOK_PAGINATION_VERSION not present in this module context');
    assert(KM.BOOK_PARITY === undefined,
        'BOOK_PARITY not present in this module context');
    const r1 = KM.WordAnalysis.compute([mem({ text: 'hello' })]);
    const r2 = KM.WordAnalysis.compute([mem({ text: 'hello' })]);
    assert(r1 !== r2,
        'compute returns a new object each call (pure function, no shared state)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
