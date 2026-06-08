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
    load(ctx, 'src/core/message-length-analysis.js');
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

function mem(text, overrides) {
    return Object.assign({
        id:               'mem-test',
        sourcePlatformId: 'imessage',
        sourceAdapterId:  'imessage-chatdb-v1',
        type:             'message',
        timestamp:        '2026-06-10T10:00:00.000Z',
        sender:           'Alice',
        senderRole:       'contact',
        text:             text,
        reactions:        [],
        isAttachmentOnly: false
    }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.MessageLengthAnalysis === 'object' && KM.MessageLengthAnalysis !== null,
        'KMEngine.MessageLengthAnalysis is an object');
    assert(typeof KM.MessageLengthAnalysis.compute === 'function',
        'compute is a function');
    const r = KM.MessageLengthAnalysis.compute([mem('hello')]);
    assert(typeof r === 'object' && r !== null,
        'compute returns a non-null object');
    assert('avgCharsPerMessage' in r,
        'result has avgCharsPerMessage field');
    assert('longestMessage' in r,
        'result has longestMessage field');
    assert('perSenderStats' in r,
        'result has perSenderStats field');
    assert(typeof r.avgCharsPerMessage === 'number',
        'avgCharsPerMessage is a number');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — zero-state: compute([])
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — zero-state: compute([])', function () {
    const KM = makeCtx();
    const z = KM.MessageLengthAnalysis.compute([]);
    assert(typeof z === 'object' && z !== null,
        'compute([]) returns a non-null object');
    assert(z.avgCharsPerMessage === 0,
        'compute([]) avgCharsPerMessage === 0');
    assert(z.longestMessage === null,
        'compute([]) longestMessage === null');
    assert(Array.isArray(z.perSenderStats),
        'compute([]) perSenderStats is an array');
    assert(z.perSenderStats.length === 0,
        'compute([]) perSenderStats.length === 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — zero-state: null/non-array inputs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — zero-state: null/non-array inputs', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgCharsPerMessage === 0 && r.longestMessage === null &&
               Array.isArray(r.perSenderStats) && r.perSenderStats.length === 0;
    }
    assert(isZero(KM.MessageLengthAnalysis.compute(null)),
        'compute(null) returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute(undefined)),
        'compute(undefined) returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute('2026-06-10')),
        'compute(string) returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute(42)),
        'compute(number) returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute({})),
        'compute(plain object) returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute(false)),
        'compute(false) returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — zero-state: system messages excluded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — zero-state: system messages excluded', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgCharsPerMessage === 0 && r.longestMessage === null;
    }
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('hello world', { senderRole: 'system' }),
    ])),
        'single system message returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('hello', { senderRole: 'system' }),
        mem('world', { senderRole: 'system' }),
    ])),
        'all system messages return zero-state');
    const mixed = KM.MessageLengthAnalysis.compute([
        mem('system text', { senderRole: 'system' }),
        mem('hi', { sender: 'Bob', senderRole: 'contact' }),
    ]);
    assert(mixed.avgCharsPerMessage === 2,
        'system message excluded: only valid message counted (avg = 2)');
    assert(mixed.perSenderStats.length === 1 && mixed.perSenderStats[0].sender === 'Bob',
        'system message excluded: only Bob in perSenderStats');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — zero-state: attachment-only excluded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — zero-state: attachment-only excluded', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgCharsPerMessage === 0 && r.longestMessage === null;
    }
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('image.jpg', { isAttachmentOnly: true }),
    ])),
        'single isAttachmentOnly=true message returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('a.jpg', { isAttachmentOnly: true }),
        mem('b.jpg', { isAttachmentOnly: true }),
    ])),
        'all attachment-only messages return zero-state');
    const mixed = KM.MessageLengthAnalysis.compute([
        mem('long text here', { sender: 'Alice', isAttachmentOnly: true }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(mixed.avgCharsPerMessage === 2,
        'attachment-only excluded: only non-attachment message counted (avg = 2)');
    assert(mixed.perSenderStats.length === 1,
        'attachment-only excluded: only one sender in perSenderStats');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — zero-state: attachment-placeholder type excluded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — zero-state: attachment-placeholder type excluded', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgCharsPerMessage === 0 && r.longestMessage === null;
    }
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('image.jpg', { type: 'attachment-placeholder' }),
    ])),
        'single attachment-placeholder type message returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('a.jpg', { type: 'attachment-placeholder' }),
        mem('b.jpg', { type: 'attachment-placeholder' }),
    ])),
        'all attachment-placeholder messages return zero-state');
    const mixed = KM.MessageLengthAnalysis.compute([
        mem('ignored', { type: 'attachment-placeholder' }),
        mem('hello', {}),
    ]);
    assert(mixed.avgCharsPerMessage === 5,
        'attachment-placeholder excluded: only text message counted (avg = 5)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — zero-state: blank/non-string text
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — zero-state: blank/non-string text', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgCharsPerMessage === 0 && r.longestMessage === null;
    }
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('', {}),
    ])),
        'empty string text returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('   ', {}),
    ])),
        'whitespace-only text returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem(null, {}),
    ])),
        'null text returns zero-state');
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem(42, {}),
    ])),
        'numeric text returns zero-state (non-string)');
    const mixed = KM.MessageLengthAnalysis.compute([
        mem('', {}),
        mem('   ', {}),
        mem(null, {}),
        mem('hello', {}),
    ]);
    assert(mixed.avgCharsPerMessage === 5 && mixed.perSenderStats.length === 1,
        'only non-blank string text counted: avg = 5 from the single valid message');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — avgCharsPerMessage accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — avgCharsPerMessage accuracy', function () {
    const KM = makeCtx();
    const single = KM.MessageLengthAnalysis.compute([mem('hello')]);
    assert(single.avgCharsPerMessage === 5,
        'single message "hello" (5 chars): avgCharsPerMessage === 5');

    const twoSame = KM.MessageLengthAnalysis.compute([
        mem('hi', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(twoSame.avgCharsPerMessage === 2,
        'two messages both "hi" (2 chars each): avgCharsPerMessage === 2');

    const twoDiff = KM.MessageLengthAnalysis.compute([
        mem('hi', {}),
        mem('hello', {}),
    ]);
    assert(twoDiff.avgCharsPerMessage === 3.5,
        'two messages "hi"(2) and "hello"(5): avgCharsPerMessage === 3.5');

    const three = KM.MessageLengthAnalysis.compute([
        mem('a', {}),
        mem('bb', {}),
        mem('ccc', {}),
    ]);
    assert(three.avgCharsPerMessage === 2,
        'three messages 1+2+3 chars: avgCharsPerMessage === 2');

    // Rounding: 3 messages 1+1+2=4 chars total, count=3, avg=1.333... → rounds to 1.3
    const rounded = KM.MessageLengthAnalysis.compute([
        mem('a', {}),
        mem('b', {}),
        mem('cc', {}),
    ]);
    assert(rounded.avgCharsPerMessage === 1.3,
        'avg 4/3=1.333... rounds to 1.3');

    // Rounding: 2 messages 1+2=3 chars total, count=2, avg=1.5 (exact)
    const exact = KM.MessageLengthAnalysis.compute([
        mem('a', {}),
        mem('bb', {}),
    ]);
    assert(exact.avgCharsPerMessage === 1.5,
        'avg 3/2=1.5 is exact (no rounding needed)');

    // Multiple senders contribute to global avg
    const multi = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
        mem('hey', { sender: 'Carol' }),
    ]);
    assert(multi.avgCharsPerMessage === 3.3,
        'three senders "hello"(5)+"hi"(2)+"hey"(3)=10/3=3.333... → 3.3');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — longestMessage accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — longestMessage accuracy', function () {
    const KM = makeCtx();
    const single = KM.MessageLengthAnalysis.compute([mem('hello', { sender: 'Alice' })]);
    assert(single.longestMessage !== null,
        'single message: longestMessage is non-null');
    assert(single.longestMessage.sender === 'Alice',
        'single message: longestMessage.sender === Alice');
    assert(single.longestMessage.length === 5,
        'single message "hello": longestMessage.length === 5');

    const twoFirst = KM.MessageLengthAnalysis.compute([
        mem('hello world', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(twoFirst.longestMessage.sender === 'Alice' && twoFirst.longestMessage.length === 11,
        'first message longer: longestMessage is Alice with length 11');

    const twoSecond = KM.MessageLengthAnalysis.compute([
        mem('hi', { sender: 'Alice' }),
        mem('hello world', { sender: 'Bob' }),
    ]);
    assert(twoSecond.longestMessage.sender === 'Bob' && twoSecond.longestMessage.length === 11,
        'second message longer: longestMessage is Bob with length 11');

    const exact = KM.MessageLengthAnalysis.compute([mem('abcde', { sender: 'Alice' })]);
    assert(exact.longestMessage.length === 5,
        'longestMessage.length matches text.length exactly (no trimming)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — longestMessage tie-break: earliest valid occurrence
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — longestMessage tie-break: earliest valid occurrence', function () {
    const KM = makeCtx();
    // Two messages same length → first sender wins
    const tie = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Alice' }),
        mem('world', { sender: 'Bob' }),
    ]);
    assert(tie.longestMessage.sender === 'Alice',
        'tie (both 5 chars): Alice wins as first occurrence');

    // Three messages, last two tied as longest → first of the two wins
    const threeWay = KM.MessageLengthAnalysis.compute([
        mem('hi', { sender: 'Alice' }),
        mem('hello', { sender: 'Bob' }),
        mem('world', { sender: 'Carol' }),
    ]);
    assert(threeWay.longestMessage.sender === 'Bob',
        'tie at 5 chars between Bob and Carol: Bob wins as earlier occurrence');

    // Tie-break: input order, not alphabetical
    const antiAlpha = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Zoe' }),
        mem('world', { sender: 'Alice' }),
    ]);
    assert(antiAlpha.longestMessage.sender === 'Zoe',
        'tie-break is input order, not alphabetical: Zoe (first) wins over Alice (second)');

    // Single message: no tie possible
    const noTie = KM.MessageLengthAnalysis.compute([mem('abc', { sender: 'Bob' })]);
    assert(noTie.longestMessage.sender === 'Bob',
        'single message: longestMessage.sender === Bob (no tie scenario)');

    // A longer message after a tie still wins
    const clearWinner = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Alice' }),
        mem('hello', { sender: 'Bob' }),
        mem('hello world!', { sender: 'Carol' }),
    ]);
    assert(clearWinner.longestMessage.sender === 'Carol' && clearWinner.longestMessage.length === 12,
        'clear winner after tie: Carol with "hello world!" (12) wins');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — perSenderStats accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — perSenderStats accuracy', function () {
    const KM = makeCtx();
    const single = KM.MessageLengthAnalysis.compute([mem('hello', { sender: 'Alice' })]);
    assert(single.perSenderStats.length === 1,
        'single sender: perSenderStats has 1 entry');
    assert(single.perSenderStats[0].sender === 'Alice',
        'single sender: perSenderStats[0].sender === Alice');
    assert(single.perSenderStats[0].avgCharsPerMessage === 5,
        'single sender: avgCharsPerMessage === 5 for "hello"');
    assert(single.perSenderStats[0].messageCount === 1,
        'single sender: messageCount === 1');

    const two = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(two.perSenderStats.length === 2,
        'two senders: perSenderStats has 2 entries');

    // Alice sends two messages: "hello"(5) and "world"(5) → avg=5
    const multiMsg = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Alice' }),
        mem('world', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    const alice = multiMsg.perSenderStats.find(function (s) { return s.sender === 'Alice'; });
    assert(alice && alice.messageCount === 2,
        'Alice with two messages: messageCount === 2');
    assert(alice && alice.avgCharsPerMessage === 5,
        'Alice "hello"(5)+"world"(5): avgCharsPerMessage === 5');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — perSenderStats sort order: desc avg, alpha tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — perSenderStats sort order: desc avg, alpha tie-break', function () {
    const KM = makeCtx();
    // Alice avg=5 ("hello"), Bob avg=2 ("hi") → Alice first (desc)
    const r = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(r.perSenderStats[0].sender === 'Alice',
        'Alice (avg 5) before Bob (avg 2): highest avg first');

    // Reversed order in input: Bob higher avg than Alice
    const r2 = KM.MessageLengthAnalysis.compute([
        mem('hi', { sender: 'Alice' }),
        mem('hello', { sender: 'Bob' }),
    ]);
    assert(r2.perSenderStats[0].sender === 'Bob',
        'Bob (avg 5) before Alice (avg 2): highest avg first regardless of input order');

    // Tie: Bob and Carol both avg=5 → Bob (B) before Carol (C) alphabetically
    const tied = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Bob' }),
        mem('world', { sender: 'Carol' }),
    ]);
    assert(tied.perSenderStats[0].sender === 'Bob',
        'tie at avg=5: Bob (B) before Carol (C) alphabetically');

    // Three senders: Alice(10), Bob(5), Carol(2) → Alice, Bob, Carol
    const three = KM.MessageLengthAnalysis.compute([
        mem('helloworld', { sender: 'Alice' }),
        mem('hello', { sender: 'Bob' }),
        mem('hi', { sender: 'Carol' }),
    ]);
    assert(three.perSenderStats[0].sender === 'Alice' &&
           three.perSenderStats[1].sender === 'Bob' &&
           three.perSenderStats[2].sender === 'Carol',
        'three senders sorted desc by avg: Alice(10), Bob(5), Carol(2)');

    // Aaron vs Bob tied → Aaron (Aa) before Bob (B)
    const aaron = KM.MessageLengthAnalysis.compute([
        mem('hello', { sender: 'Bob' }),
        mem('world', { sender: 'Aaron' }),
    ]);
    assert(aaron.perSenderStats[0].sender === 'Aaron',
        'tie: Aaron (Aa) alphabetically before Bob (B)');

    // Descending: higher avg first
    assert(three.perSenderStats[0].avgCharsPerMessage >= three.perSenderStats[1].avgCharsPerMessage,
        'perSenderStats is sorted descending by avgCharsPerMessage');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — skip rules combined
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — skip rules combined', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgCharsPerMessage === 0 && r.longestMessage === null;
    }

    // All skip types together → zero-state
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('system', { senderRole: 'system' }),
        mem('attach', { isAttachmentOnly: true }),
        mem('attach', { type: 'attachment-placeholder' }),
        mem('', {}),
        mem('   ', {}),
        mem(null, {}),
    ])),
        'all skip types together: zero-state');

    // Mixed: skips + one valid → only valid counted
    const mixed = KM.MessageLengthAnalysis.compute([
        mem('system', { senderRole: 'system' }),
        mem('attach', { isAttachmentOnly: true }),
        mem('attach', { type: 'attachment-placeholder' }),
        mem('', {}),
        mem('hello', { sender: 'Alice' }),
    ]);
    assert(mixed.avgCharsPerMessage === 5,
        'mixed skips + one valid: only valid message counted (avg=5)');
    assert(mixed.longestMessage !== null && mixed.longestMessage.sender === 'Alice',
        'mixed skips + one valid: longestMessage is the single valid message');

    // system + attachment-only → zero-state
    assert(isZero(KM.MessageLengthAnalysis.compute([
        mem('sys', { senderRole: 'system' }),
        mem('img', { isAttachmentOnly: true }),
    ])),
        'system + attachment-only: zero-state');

    // Blank text doesn't count toward longest
    const noBlank = KM.MessageLengthAnalysis.compute([
        mem('   ', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(noBlank.longestMessage.sender === 'Bob',
        'blank-text message does not compete for longestMessage');

    // isAttachmentOnly=true overrides even when text is present
    const attachWithText = KM.MessageLengthAnalysis.compute([
        mem('very long text here', { isAttachmentOnly: true }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(attachWithText.avgCharsPerMessage === 2,
        'isAttachmentOnly=true with text: the attachment message is excluded despite having text');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — no throw on malformed entries
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — no throw on malformed entries', function () {
    const KM = makeCtx();
    let threw = false;
    try {
        KM.MessageLengthAnalysis.compute([null, undefined, 42, 'string', {}]);
    } catch (e) {
        threw = true;
    }
    assert(!threw,
        'compute does not throw on null/non-object/primitive entries');

    const r = KM.MessageLengthAnalysis.compute([
        null,
        undefined,
        mem('hello', { sender: 'Alice' }),
        mem('hi', { sender: 'Bob' }),
    ]);
    assert(r.avgCharsPerMessage === 3.5,
        'valid entries counted correctly when mixed with null/undefined (avg = 3.5)');

    let threw2 = false;
    try {
        KM.MessageLengthAnalysis.compute([{ text: { nested: 'object' }, sender: 'A', senderRole: 'contact' }]);
    } catch (e) {
        threw2 = true;
    }
    assert(!threw2,
        'compute does not throw when text is a non-string object');

    const allBad = KM.MessageLengthAnalysis.compute([null, undefined, 42, false]);
    assert(allBad.avgCharsPerMessage === 0 && allBad.longestMessage === null,
        'all-bad-entry array returns zero-state without throw');

    let threw3 = false;
    try {
        KM.MessageLengthAnalysis.compute([{ sender: null, text: 'hi', senderRole: 'contact' }]);
    } catch (e) {
        threw3 = true;
    }
    assert(!threw3,
        'compute does not throw when sender is null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — semantic guards', function () {
    const KM = makeCtx();
    assert(Object.keys(KM.MessageLengthAnalysis).length === 1 && 'compute' in KM.MessageLengthAnalysis,
        'MessageLengthAnalysis only exposes compute — no extra surface area');
    assert(typeof KM.MessageLengthAnalysis.compute === 'function',
        'compute is a function (not a class or constructor)');
    assert(KM.ProductDraftState === undefined,
        'ProductDraftState not present in this module context');
    assert(KM.BOOK_PAGINATION_VERSION === undefined,
        'BOOK_PAGINATION_VERSION not present in this module context');
    assert(KM.BOOK_PARITY === undefined,
        'BOOK_PARITY not present in this module context');
    const m1 = mem('hello', { sender: 'Alice' });
    const r1 = KM.MessageLengthAnalysis.compute([m1]);
    const r2 = KM.MessageLengthAnalysis.compute([m1]);
    assert(r1 !== r2,
        'compute returns a new object each call for non-zero input (pure, no shared state)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
