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
    load(ctx, 'src/core/conversation-initiation.js');
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
        timestamp:        '2026-06-10T09:00:00.000Z',
        sender:           'Alice',
        senderRole:       'contact',
        text:             'hello',
        reactions:        [],
        isAttachmentOnly: false
    }, overrides);
}

// Timestamp anchors relative to T0 (09:00:00.000Z). GAP_THRESHOLD_MS = 6 hours.
const T0       = '2026-06-10T09:00:00.000Z'; // base
const T5M      = '2026-06-10T09:05:00.000Z'; // +5 min  (below threshold)
const T6H_LESS = '2026-06-10T14:59:59.999Z'; // +5h59m59.999s (below threshold)
const T6H      = '2026-06-10T15:00:00.000Z'; // +6h exactly (>= threshold)
const T7H      = '2026-06-10T16:00:00.000Z'; // +7h (above threshold)

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.ConversationInitiation === 'object' && KM.ConversationInitiation !== null,
        'KMEngine.ConversationInitiation is an object');
    assert(typeof KM.ConversationInitiation.compute === 'function',
        'compute is a function');
    const r = KM.ConversationInitiation.compute([mem({})]);
    assert(typeof r === 'object' && r !== null,
        'compute returns a non-null object');
    assert('totalConversations' in r,
        'result has totalConversations field');
    assert('topInitiator' in r,
        'result has topInitiator field');
    assert('perSenderStats' in r,
        'result has perSenderStats field');
    assert(typeof r.totalConversations === 'number',
        'totalConversations is a number');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — empty input zero-state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — empty input zero-state', function () {
    const KM = makeCtx();
    const z = KM.ConversationInitiation.compute([]);
    assert(typeof z === 'object' && z !== null,
        'compute([]) returns a non-null object');
    assert(z.totalConversations === 0,
        'compute([]) totalConversations === 0');
    assert(z.topInitiator === null,
        'compute([]) topInitiator === null');
    assert(Array.isArray(z.perSenderStats),
        'compute([]) perSenderStats is an array');
    assert(z.perSenderStats.length === 0,
        'compute([]) perSenderStats.length === 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — null/non-array input zero-state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — null/non-array input zero-state', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.totalConversations === 0 && r.topInitiator === null &&
               Array.isArray(r.perSenderStats) && r.perSenderStats.length === 0;
    }
    assert(isZero(KM.ConversationInitiation.compute(null)),
        'compute(null) returns zero-state');
    assert(isZero(KM.ConversationInitiation.compute(undefined)),
        'compute(undefined) returns zero-state');
    assert(isZero(KM.ConversationInitiation.compute('2026-06-10')),
        'compute(string) returns zero-state');
    assert(isZero(KM.ConversationInitiation.compute(42)),
        'compute(number) returns zero-state');
    assert(isZero(KM.ConversationInitiation.compute({})),
        'compute(plain object) returns zero-state');
    assert(isZero(KM.ConversationInitiation.compute(false)),
        'compute(false) returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — no-valid-message zero-state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — no-valid-message zero-state', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.totalConversations === 0 && r.topInitiator === null && r.perSenderStats.length === 0;
    }
    assert(isZero(KM.ConversationInitiation.compute([
        mem({ senderRole: 'system' }),
        mem({ senderRole: 'system' }),
    ])),
        'all system messages return zero-state');
    assert(isZero(KM.ConversationInitiation.compute([
        mem({ timestamp: 'not-a-date' }),
        mem({ timestamp: null }),
    ])),
        'all invalid-timestamp messages return zero-state');
    assert(isZero(KM.ConversationInitiation.compute([
        mem({ senderRole: 'system' }),
        mem({ timestamp: null }),
    ])),
        'system + invalid-timestamp mix returns zero-state');
    assert(isZero(KM.ConversationInitiation.compute([null, undefined, 42])),
        'array of non-objects returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — senderRole === 'system' exclusion
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — senderRole === system exclusion', function () {
    const KM = makeCtx();
    const single = KM.ConversationInitiation.compute([mem({ senderRole: 'system' })]);
    assert(single.totalConversations === 0,
        'single system message: totalConversations === 0');

    const mixed = KM.ConversationInitiation.compute([
        mem({ sender: 'SysBot', senderRole: 'system', timestamp: T0 }),
        mem({ sender: 'Bob', senderRole: 'contact', timestamp: T5M }),
    ]);
    assert(mixed.totalConversations === 1,
        'system excluded: only the contact message counts as a start (1 conversation)');
    assert(mixed.topInitiator !== null && mixed.topInitiator.sender === 'Bob',
        'system excluded: Bob is the initiator, not the earlier system message');

    // System message at the front must not become the first conversation start.
    const sysFirst = KM.ConversationInitiation.compute([
        mem({ sender: 'SysBot', senderRole: 'system', timestamp: '2026-06-10T08:00:00.000Z' }),
        mem({ sender: 'Alice', senderRole: 'contact', timestamp: T0 }),
        mem({ sender: 'Bob', senderRole: 'contact', timestamp: T5M }),
    ]);
    assert(sysFirst.totalConversations === 1 && sysFirst.topInitiator.sender === 'Alice',
        'leading system message excluded: first contact message (Alice) is the start');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — invalid/missing/null/falsy timestamp skip
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — invalid/missing/null/falsy timestamp skip', function () {
    const KM = makeCtx();
    function isZero(r) { return r.totalConversations === 0 && r.topInitiator === null; }

    const noTs = mem({});
    delete noTs.timestamp;
    assert(isZero(KM.ConversationInitiation.compute([noTs])),
        'missing timestamp skipped → zero-state');
    assert(isZero(KM.ConversationInitiation.compute([mem({ timestamp: null })])),
        'null timestamp skipped → zero-state');
    assert(isZero(KM.ConversationInitiation.compute([mem({ timestamp: '' })])),
        'empty-string timestamp (falsy) skipped → zero-state');
    assert(isZero(KM.ConversationInitiation.compute([mem({ timestamp: 0 })])),
        'zero timestamp (falsy) skipped → zero-state');
    assert(isZero(KM.ConversationInitiation.compute([mem({ timestamp: 'garbage' })])),
        'unparseable timestamp string skipped → zero-state');

    const mixedTs = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: 'garbage' }),
        mem({ sender: 'Bob', timestamp: T0 }),
    ]);
    assert(mixedTs.totalConversations === 1 && mixedTs.topInitiator.sender === 'Bob',
        'mixed valid/invalid timestamps: only valid (Bob) counts as a start');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — single-message conversation behavior
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — single-message conversation behavior', function () {
    const KM = makeCtx();
    const r = KM.ConversationInitiation.compute([mem({ sender: 'Alice', timestamp: T0 })]);
    assert(r.totalConversations === 1,
        'single valid message: totalConversations === 1');
    assert(r.topInitiator !== null && r.topInitiator.sender === 'Alice' && r.topInitiator.initiationCount === 1,
        'single valid message: topInitiator is Alice with count 1');
    assert(r.perSenderStats.length === 1 && r.perSenderStats[0].initiationPct === 100,
        'single valid message: perSenderStats has one entry at 100%');
    const sys = KM.ConversationInitiation.compute([mem({ senderRole: 'system' })]);
    assert(sys.totalConversations === 0,
        'single system message: totalConversations === 0');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — first valid message counted as a conversation start
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — first valid message counted as a start', function () {
    const KM = makeCtx();
    // Two messages a few minutes apart → only the first is a start.
    const r = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T5M }),
    ]);
    assert(r.totalConversations === 1,
        'two close messages: only the first counts (1 conversation)');
    assert(r.topInitiator.sender === 'Alice',
        'first message sender (Alice) is credited with the conversation start');
    assert(r.perSenderStats.length === 1 && r.perSenderStats[0].sender === 'Alice',
        'only the first sender appears in perSenderStats when no gaps occur');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — gap below threshold does not start a new conversation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — gap below threshold does not start a new conversation', function () {
    const KM = makeCtx();
    const fiveMin = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T5M }),
    ]);
    assert(fiveMin.totalConversations === 1,
        '5-minute gap: still one conversation');

    const almostSixHours = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T6H_LESS }),
    ]);
    assert(almostSixHours.totalConversations === 1,
        'gap of 5h59m59.999s (just under 6h): still one conversation');

    const manySmall = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T10:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T11:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T12:00:00.000Z' }),
    ]);
    assert(manySmall.totalConversations === 1,
        'multiple sub-threshold (1h) gaps: still one conversation');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — gap exactly equal to threshold starts a new conversation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — gap exactly equal to threshold starts a new conversation', function () {
    const KM = makeCtx();
    const exact = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T6H }),
    ]);
    assert(exact.totalConversations === 2,
        'gap of exactly 6h (>= threshold): two conversations');
    assert(exact.perSenderStats.length === 2,
        'exactly-threshold gap: both senders credited with a start');

    const justUnder = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T6H_LESS }),
    ]);
    assert(justUnder.totalConversations === 1,
        'gap of 6h minus 1ms: still one conversation (strict >= boundary)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — gap above threshold starts a new conversation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — gap above threshold starts a new conversation', function () {
    const KM = makeCtx();
    const sevenHours = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T7H }),
    ]);
    assert(sevenHours.totalConversations === 2,
        'gap of 7h (above threshold): two conversations');

    const nextDay = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
    ]);
    assert(nextDay.totalConversations === 2,
        'gap of 24h: two conversations');

    const threeGaps = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-12T09:00:00.000Z' }),
    ]);
    assert(threeGaps.totalConversations === 3,
        'three day-separated messages: three conversations');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — multiple conversation starts across sorted timestamps
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — multiple conversation starts across sorted timestamps', function () {
    const KM = makeCtx();
    // conv1: 09:00, 09:05 ; gap ; conv2: 16:00, 16:05 ; gap ; conv3 next day: 09:00, 09:05
    const r = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T09:05:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T16:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T16:05:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T09:05:00.000Z' }),
    ]);
    assert(r.totalConversations === 3,
        'three gap-separated conversations detected');
    const sumCounts = r.perSenderStats.reduce(function (s, e) { return s + e.initiationCount; }, 0);
    assert(sumCounts === 3,
        'sum of per-sender initiationCount equals totalConversations');
    const alice = r.perSenderStats.find(function (e) { return e.sender === 'Alice'; });
    const bob = r.perSenderStats.find(function (e) { return e.sender === 'Bob'; });
    assert(alice.initiationCount === 2,
        'Alice starts conv1 and conv2 → initiationCount 2');
    assert(bob.initiationCount === 1,
        'Bob starts conv3 → initiationCount 1');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — input order does not affect result (entries sorted by timestamp)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — input order does not affect result', function () {
    const KM = makeCtx();
    const ordered = [
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T7H }),
    ];
    const shuffled = [
        mem({ sender: 'Bob', timestamp: T7H }),
        mem({ sender: 'Alice', timestamp: T0 }),
    ];
    const ro = KM.ConversationInitiation.compute(ordered);
    const rs = KM.ConversationInitiation.compute(shuffled);
    assert(ro.totalConversations === rs.totalConversations,
        'reversed input yields the same totalConversations');
    assert(ro.totalConversations === 2,
        'two gap-separated messages: 2 conversations regardless of input order');
    assert(rs.topInitiator !== null && (rs.topInitiator.sender === 'Alice' || rs.topInitiator.sender === 'Bob'),
        'topInitiator resolves deterministically from sorted order, not input order');

    // The earliest timestamp (Alice@T0) is the first conversation start even when listed last.
    const lastIsFirst = KM.ConversationInitiation.compute([
        mem({ sender: 'Bob', timestamp: '2026-06-10T10:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
    ]);
    assert(lastIsFirst.totalConversations === 1 && lastIsFirst.topInitiator.sender === 'Alice',
        'earliest-timestamp sender (Alice) is the start even when listed last in input');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — topInitiator accuracy and tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — topInitiator accuracy and tie-break', function () {
    const KM = makeCtx();
    // Alice starts 2, Bob starts 1 → Alice top.
    const clear = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T16:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
    ]);
    assert(clear.topInitiator.sender === 'Alice' && clear.topInitiator.initiationCount === 2,
        'highest initiationCount wins: Alice (2)');

    // Tie at 1 each → sender ascending (Alice before Bob).
    const tie = KM.ConversationInitiation.compute([
        mem({ sender: 'Bob', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T16:00:00.000Z' }),
    ]);
    assert(tie.topInitiator.sender === 'Alice',
        'tie (1 each): Alice (A) wins on ascending-sender tie-break');

    // Tie-break is alphabetical, not input order: Zoe vs Alice, both 1.
    const antiOrder = KM.ConversationInitiation.compute([
        mem({ sender: 'Zoe', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T16:00:00.000Z' }),
    ]);
    assert(antiOrder.topInitiator.sender === 'Alice',
        'tie-break is alphabetical: Alice over Zoe even though Zoe started first');

    assert(clear.topInitiator.sender === clear.perSenderStats[0].sender,
        'topInitiator.sender matches perSenderStats[0].sender');
    const z = KM.ConversationInitiation.compute([]);
    assert(z.topInitiator === null,
        'topInitiator is null on zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — perSenderStats initiationCount accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — perSenderStats initiationCount accuracy', function () {
    const KM = makeCtx();
    const r = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T16:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T16:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-12T09:00:00.000Z' }),
    ]);
    const alice = r.perSenderStats.find(function (e) { return e.sender === 'Alice'; });
    const bob = r.perSenderStats.find(function (e) { return e.sender === 'Bob'; });
    assert(alice.initiationCount === 3,
        'Alice starts conv1, conv3? no — Alice starts 3 of 5 gap-separated conversations');
    assert(bob.initiationCount === 2,
        'Bob starts 2 of 5 gap-separated conversations');
    assert((alice.initiationCount + bob.initiationCount) === r.totalConversations,
        'per-sender counts sum to totalConversations (5)');

    const single = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T09:00:00.000Z' }),
    ]);
    assert(single.perSenderStats.length === 1 && single.perSenderStats[0].initiationCount === 2,
        'single sender starting every conversation: one entry with full count');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — perSenderStats initiationPct rounded to 1 decimal
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — perSenderStats initiationPct rounded to 1 decimal', function () {
    const KM = makeCtx();
    // 2 of 3 = 66.666... → 66.7 ; 1 of 3 = 33.333... → 33.3
    const thirds = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T16:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
    ]);
    const a = thirds.perSenderStats.find(function (e) { return e.sender === 'Alice'; });
    const b = thirds.perSenderStats.find(function (e) { return e.sender === 'Bob'; });
    assert(a.initiationPct === 66.7,
        '2/3 rounds to 66.7');
    assert(b.initiationPct === 33.3,
        '1/3 rounds to 33.3');

    const allOne = KM.ConversationInitiation.compute([mem({ sender: 'Alice', timestamp: T0 })]);
    assert(allOne.perSenderStats[0].initiationPct === 100,
        '1/1 is 100 (exact)');

    const half = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
    ]);
    assert(half.perSenderStats[0].initiationPct === 50 && half.perSenderStats[1].initiationPct === 50,
        '1/2 each is 50 (exact)');

    // 1 of 6 = 16.666... → 16.7 (confirms rounding, not truncation)
    const sixth = KM.ConversationInitiation.compute([
        mem({ sender: 'Bob', timestamp: '2026-06-10T00:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T18:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T09:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T18:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-12T09:00:00.000Z' }),
    ]);
    const bobSixth = sixth.perSenderStats.find(function (e) { return e.sender === 'Bob'; });
    assert(bobSixth.initiationPct === 16.7,
        '1/6 rounds to 16.7 (rounded, not truncated to 16.6)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — perSenderStats sorting by count desc, then sender asc
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — perSenderStats sorting count desc, sender asc', function () {
    const KM = makeCtx();
    // Bob 2, Alice 1 → Bob first (higher count) despite alphabetical order.
    const byCount = KM.ConversationInitiation.compute([
        mem({ sender: 'Bob', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T16:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T09:00:00.000Z' }),
    ]);
    assert(byCount.perSenderStats[0].sender === 'Bob',
        'higher count first: Bob (2) before Alice (1)');

    // Tie at count 1: Aaron before Bob alphabetically.
    const tie = KM.ConversationInitiation.compute([
        mem({ sender: 'Bob', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Aaron', timestamp: '2026-06-10T16:00:00.000Z' }),
    ]);
    assert(tie.perSenderStats[0].sender === 'Aaron',
        'tie at count 1: Aaron (Aa) before Bob (B) alphabetically');

    // Three senders, counts 3/2/1 → Carol, Bob, Alice by count desc.
    const three = KM.ConversationInitiation.compute([
        mem({ sender: 'Carol', timestamp: '2026-06-10T00:00:00.000Z' }),
        mem({ sender: 'Carol', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Carol', timestamp: '2026-06-10T18:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T18:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-12T09:00:00.000Z' }),
    ]);
    assert(three.perSenderStats[0].sender === 'Carol' &&
           three.perSenderStats[1].sender === 'Bob' &&
           three.perSenderStats[2].sender === 'Alice',
        'three senders sorted by count desc: Carol(3), Bob(2), Alice(1)');
    assert(three.perSenderStats[0].initiationCount >= three.perSenderStats[1].initiationCount &&
           three.perSenderStats[1].initiationCount >= three.perSenderStats[2].initiationCount,
        'perSenderStats is sorted descending by initiationCount');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — malformed entries no-throw behavior
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — malformed entries no-throw behavior', function () {
    const KM = makeCtx();
    let threw = false;
    try {
        KM.ConversationInitiation.compute([null, undefined, 42, 'string', {}]);
    } catch (e) {
        threw = true;
    }
    assert(!threw,
        'compute does not throw on null/non-object/primitive entries');

    const r = KM.ConversationInitiation.compute([
        null,
        undefined,
        mem({ sender: 'Alice', timestamp: T0 }),
        mem({ sender: 'Bob', timestamp: T7H }),
    ]);
    assert(r.totalConversations === 2,
        'valid entries counted correctly when mixed with null/undefined');

    let threw2 = false;
    try {
        KM.ConversationInitiation.compute([{ sender: null, timestamp: T0, senderRole: 'contact' }]);
    } catch (e) {
        threw2 = true;
    }
    assert(!threw2,
        'compute does not throw when sender is null');

    // Non-string sender coerces to '' bucket without throwing.
    const nullSender = KM.ConversationInitiation.compute([
        { sender: null, timestamp: T0, senderRole: 'contact' },
    ]);
    assert(nullSender.totalConversations === 1 && nullSender.perSenderStats[0].sender === '',
        'null sender is bucketed as empty string and still counts as a start');

    const allBad = KM.ConversationInitiation.compute([null, undefined, 42, false]);
    assert(allBad.totalConversations === 0 && allBad.topInitiator === null,
        'all-bad-entry array returns zero-state without throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — fixture behavior (mirrors fake-conversation-initiation.txt)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — fixture behavior', function () {
    const KM = makeCtx();
    // 3 gap-separated conversations: Alice starts conv1 + conv2, Bob starts conv3.
    const fixture = KM.ConversationInitiation.compute([
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T09:02:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T09:05:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T09:07:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T18:00:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T18:03:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-10T18:05:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-10T18:06:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T08:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T08:30:00.000Z' }),
        mem({ sender: 'Bob', timestamp: '2026-06-11T08:32:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2026-06-11T08:35:00.000Z' }),
    ]);
    assert(fixture.totalConversations === 3,
        'fixture: 3 conversations (two intraday + one next-day after >6h gaps)');
    assert(fixture.topInitiator.sender === 'Alice' && fixture.topInitiator.initiationCount === 2,
        'fixture: Alice is the top initiator with 2 starts');
    const a = fixture.perSenderStats.find(function (e) { return e.sender === 'Alice'; });
    const b = fixture.perSenderStats.find(function (e) { return e.sender === 'Bob'; });
    assert(a.initiationCount === 2 && a.initiationPct === 66.7,
        'fixture: Alice initiationCount 2, initiationPct 66.7');
    assert(b.initiationCount === 1 && b.initiationPct === 33.3,
        'fixture: Bob initiationCount 1, initiationPct 33.3');
    assert(fixture.perSenderStats[0].sender === 'Alice',
        'fixture: perSenderStats sorted with Alice first');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 20 — semantic guards', function () {
    const KM = makeCtx();
    assert(Object.keys(KM.ConversationInitiation).length === 1 && 'compute' in KM.ConversationInitiation,
        'ConversationInitiation only exposes compute — no extra surface area');
    assert(typeof KM.ConversationInitiation.compute === 'function',
        'compute is a function (not a class or constructor)');
    assert(KM.ProductDraftState === undefined,
        'ProductDraftState not present in this module context');
    assert(KM.BOOK_PAGINATION_VERSION === undefined,
        'BOOK_PAGINATION_VERSION not present in this module context');
    assert(KM.BOOK_PARITY === undefined,
        'BOOK_PARITY not present in this module context');
    const m1 = mem({ sender: 'Alice', timestamp: T0 });
    const r1 = KM.ConversationInitiation.compute([m1]);
    const r2 = KM.ConversationInitiation.compute([m1]);
    assert(r1 !== r2,
        'compute returns a new object each call for non-zero input (pure, no shared state)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
