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
    load(ctx, 'src/core/conversation-stats.js');
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
    assert(typeof KM.ConversationStats === 'object' && KM.ConversationStats !== null,
        'KMEngine.ConversationStats is an object');
    assert(typeof KM.ConversationStats.compute === 'function',
        'compute is a function');
    const r = KM.ConversationStats.compute([mem()]);
    assert(typeof r === 'object' && r !== null,
        'compute returns an object');
    assert('busiestDay' in r,        'result has busiestDay field');
    assert('busiestDayCount' in r,   'result has busiestDayCount field');
    assert('longestStreakDays' in r,  'result has longestStreakDays field');
    assert('avgMessagesPerDay' in r,  'result has avgMessagesPerDay field');
    assert('totalDays' in r,         'result has totalDays field');
    assert('perSenderStats' in r,    'result has perSenderStats field');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — empty and invalid input → zero-state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — empty and invalid input', function () {
    const KM = makeCtx();
    const z = KM.ConversationStats.compute([]);
    assert(z.busiestDay        === null, 'compute([]) busiestDay is null');
    assert(z.busiestDayCount   === 0,   'compute([]) busiestDayCount is 0');
    assert(z.longestStreakDays  === 0,   'compute([]) longestStreakDays is 0');
    assert(z.avgMessagesPerDay === 0,   'compute([]) avgMessagesPerDay is 0');
    assert(z.totalDays         === 0,   'compute([]) totalDays is 0');
    assert(Array.isArray(z.perSenderStats) && z.perSenderStats.length === 0,
        'compute([]) perSenderStats is []');
    assert(typeof KM.ConversationStats.compute(null)      === 'object', 'compute(null) returns object');
    assert(typeof KM.ConversationStats.compute(undefined) === 'object', 'compute(undefined) returns object');
    assert(typeof KM.ConversationStats.compute('text')    === 'object', 'compute(string) returns object');
    assert(typeof KM.ConversationStats.compute(42)        === 'object', 'compute(number) returns object');
    assert(KM.ConversationStats.compute(null).busiestDay  === null, 'compute(null) busiestDay is null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — single memory
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — single memory', function () {
    const KM = makeCtx();
    const r = KM.ConversationStats.compute([mem({ timestamp: '2024-01-15T10:00:00.000Z', sender: 'Alice' })]);
    assert(r.busiestDay        === '2024-01-15', 'single memory busiestDay is that day');
    assert(r.busiestDayCount   === 1,            'single memory busiestDayCount is 1');
    assert(r.longestStreakDays  === 1,            'single memory longestStreakDays is 1');
    assert(r.totalDays         === 1,            'single memory totalDays is 1');
    assert(r.avgMessagesPerDay === 1,            'single memory avgMessagesPerDay is 1');
    assert(r.perSenderStats.length === 1,        'single memory perSenderStats has 1 entry');
    const e = r.perSenderStats[0];
    assert(e.sender === 'Alice',  'perSenderStats entry has correct sender');
    assert(e.count  === 1,        'perSenderStats entry count is 1');
    assert(e.pct    === 100,      'perSenderStats entry pct is 100');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — busiestDay
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — busiestDay', function () {
    const KM = makeCtx();

    // 3 days, Jan15 has 3 messages → busiest
    const corpus = [
        mem({ timestamp: '2024-01-14T09:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:01:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:02:00.000Z' }),
        mem({ timestamp: '2024-01-16T08:00:00.000Z' }),
    ];
    const r = KM.ConversationStats.compute(corpus);
    assert(r.busiestDay === '2024-01-15',      'busiestDay is Jan 15 (most messages)');
    assert(r.busiestDayCount === 3,            'busiestDayCount is 3');

    // all messages same day
    const sameDay = [
        mem({ timestamp: '2024-03-20T08:00:00.000Z' }),
        mem({ timestamp: '2024-03-20T09:00:00.000Z' }),
    ];
    const rSame = KM.ConversationStats.compute(sameDay);
    assert(rSame.busiestDay === '2024-03-20',  'all same day → busiestDay is that day');
    assert(rSame.busiestDayCount === 2,        'all same day → busiestDayCount is 2');

    // tie-break: two days with same count → earlier date wins
    const tie = [
        mem({ timestamp: '2024-06-01T09:00:00.000Z' }),
        mem({ timestamp: '2024-06-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-06-03T09:00:00.000Z' }),
        mem({ timestamp: '2024-06-03T10:00:00.000Z' }),
    ];
    const rTie = KM.ConversationStats.compute(tie);
    assert(rTie.busiestDay === '2024-06-01',   'tie-break: earlier date wins');
    assert(rTie.busiestDayCount === 2,         'tie-break: busiestDayCount still 2');

    // three-way tie: earliest wins
    const threeTie = [
        mem({ timestamp: '2024-07-10T09:00:00.000Z' }),
        mem({ timestamp: '2024-07-12T09:00:00.000Z' }),
        mem({ timestamp: '2024-07-14T09:00:00.000Z' }),
    ];
    const rThree = KM.ConversationStats.compute(threeTie);
    assert(rThree.busiestDay === '2024-07-10', 'three-way tie: earliest date wins');

    // null timestamps do not affect busiestDay
    const withNull = [
        mem({ timestamp: null }),
        mem({ timestamp: '2024-08-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-08-01T11:00:00.000Z' }),
    ];
    const rNull = KM.ConversationStats.compute(withNull);
    assert(rNull.busiestDay === '2024-08-01',  'null timestamps skipped for busiestDay');
    assert(rNull.busiestDayCount === 2,        'busiestDayCount ignores null-timestamp messages');

    // busiestDay format is YYYY-MM-DD
    assert(typeof r.busiestDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.busiestDay),
        'busiestDay is YYYY-MM-DD format');

    // busiestDay is null when no valid timestamps
    const noTs = [
        mem({ timestamp: null }),
        mem({ timestamp: '' }),
    ];
    const rNoTs = KM.ConversationStats.compute(noTs);
    assert(rNoTs.busiestDay === null,          'busiestDay is null when no valid timestamps');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — longestStreak
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — longestStreak', function () {
    const KM = makeCtx();

    // single day → streak=1
    const single = [mem({ timestamp: '2024-01-15T10:00:00.000Z' })];
    assert(KM.ConversationStats.compute(single).longestStreakDays === 1,
        'single day → longestStreakDays is 1');

    // 2 consecutive days → streak=2
    const two = [
        mem({ timestamp: '2024-01-14T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(two).longestStreakDays === 2,
        '2 consecutive days → longestStreakDays is 2');

    // 3 consecutive days → streak=3
    const three = [
        mem({ timestamp: '2024-01-14T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-16T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(three).longestStreakDays === 3,
        '3 consecutive days → longestStreakDays is 3');

    // gap of 2 days breaks streak: Jan1, Jan2, Jan4 → streak=2
    const gap = [
        mem({ timestamp: '2024-03-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-03-02T10:00:00.000Z' }),
        mem({ timestamp: '2024-03-04T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(gap).longestStreakDays === 2,
        'gap of 2 days: streak is 2 (Jan1+Jan2), not 3');

    // gap at start: Jan1, Jan3, Jan4 → streak=2
    const gapStart = [
        mem({ timestamp: '2024-04-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-04-03T10:00:00.000Z' }),
        mem({ timestamp: '2024-04-04T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(gapStart).longestStreakDays === 2,
        'gap at start: longest streak is 2 (Apr3+Apr4)');

    // all same day → streak=1
    const allSame = [
        mem({ timestamp: '2024-05-10T08:00:00.000Z' }),
        mem({ timestamp: '2024-05-10T09:00:00.000Z' }),
        mem({ timestamp: '2024-05-10T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(allSame).longestStreakDays === 1,
        'all same day → longestStreakDays is 1');

    // multiple gaps: pick longest segment
    const multiGap = [
        mem({ timestamp: '2024-06-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-06-05T10:00:00.000Z' }),
        mem({ timestamp: '2024-06-06T10:00:00.000Z' }),
        mem({ timestamp: '2024-06-07T10:00:00.000Z' }),
        mem({ timestamp: '2024-06-10T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(multiGap).longestStreakDays === 3,
        'multiple segments: picks longest (3)');

    // 7 consecutive days → streak=7
    const seven = [
        mem({ timestamp: '2024-07-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-07-02T10:00:00.000Z' }),
        mem({ timestamp: '2024-07-03T10:00:00.000Z' }),
        mem({ timestamp: '2024-07-04T10:00:00.000Z' }),
        mem({ timestamp: '2024-07-05T10:00:00.000Z' }),
        mem({ timestamp: '2024-07-06T10:00:00.000Z' }),
        mem({ timestamp: '2024-07-07T10:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(seven).longestStreakDays === 7,
        '7 consecutive days → longestStreakDays is 7');

    // non-consecutive across year boundary
    const dec31jan1 = [
        mem({ timestamp: '2023-12-31T23:00:00.000Z' }),
        mem({ timestamp: '2024-01-01T01:00:00.000Z' }),
    ];
    const rYearBoundary = KM.ConversationStats.compute(dec31jan1);
    assert(rYearBoundary.longestStreakDays >= 1, 'year-boundary days do not crash');

    // no valid timestamps → longestStreakDays is 0
    const noTs = [mem({ timestamp: null }), mem({ timestamp: '' })];
    assert(KM.ConversationStats.compute(noTs).longestStreakDays === 0,
        'no valid timestamps → longestStreakDays is 0');

    // multiple messages on consecutive days → streak based on unique days
    const multiMsg = [
        mem({ timestamp: '2024-09-01T08:00:00.000Z' }),
        mem({ timestamp: '2024-09-01T09:00:00.000Z' }),
        mem({ timestamp: '2024-09-02T08:00:00.000Z' }),
        mem({ timestamp: '2024-09-02T09:00:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(multiMsg).longestStreakDays === 2,
        'multiple messages per day: streak counts unique days only');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — totalDays
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — totalDays', function () {
    const KM = makeCtx();

    assert(KM.ConversationStats.compute([
        mem({ timestamp: '2024-01-15T10:00:00.000Z' })
    ]).totalDays === 1, 'single day → totalDays is 1');

    assert(KM.ConversationStats.compute([
        mem({ timestamp: '2024-01-14T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:00:00.000Z' }),
    ]).totalDays === 2, 'adjacent days → totalDays is 2');

    // span of 5: Jan14 to Jan18 inclusive
    assert(KM.ConversationStats.compute([
        mem({ timestamp: '2024-01-14T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-16T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-18T10:00:00.000Z' }),
    ]).totalDays === 5, 'Jan14–Jan18 span → totalDays is 5 (not 4 unique days)');

    // all same day → totalDays is 1
    assert(KM.ConversationStats.compute([
        mem({ timestamp: '2024-03-20T08:00:00.000Z' }),
        mem({ timestamp: '2024-03-20T20:00:00.000Z' }),
    ]).totalDays === 1, 'all same day → totalDays is 1');

    // no valid timestamps → totalDays is 0
    assert(KM.ConversationStats.compute([
        mem({ timestamp: null }),
    ]).totalDays === 0, 'no valid timestamps → totalDays is 0');

    // two days with 3-day gap
    assert(KM.ConversationStats.compute([
        mem({ timestamp: '2024-05-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-05-04T10:00:00.000Z' }),
    ]).totalDays === 4, 'May1–May4 → totalDays is 4');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — avgMessagesPerDay
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — avgMessagesPerDay', function () {
    const KM = makeCtx();

    // exact whole number
    const r5over5 = KM.ConversationStats.compute([
        mem({ timestamp: '2024-01-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-02T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-03T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-04T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-05T10:00:00.000Z' }),
    ]);
    assert(r5over5.avgMessagesPerDay === 1, 'exactly 1/day over 5 days → 1');

    // fractional: 3 messages on 2 days
    const r3over2 = KM.ConversationStats.compute([
        mem({ timestamp: '2024-02-01T10:00:00.000Z' }),
        mem({ timestamp: '2024-02-01T11:00:00.000Z' }),
        mem({ timestamp: '2024-02-02T10:00:00.000Z' }),
    ]);
    assert(r3over2.avgMessagesPerDay === 1.5, '3 messages on 2 days → 1.5');

    // rounding: 8 messages on 5-day span
    const r8over5 = KM.ConversationStats.compute([
        mem({ timestamp: '2024-01-14T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-14T11:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T11:00:00.000Z' }),
        mem({ timestamp: '2024-01-15T12:00:00.000Z' }),
        mem({ timestamp: '2024-01-16T10:00:00.000Z' }),
        mem({ timestamp: '2024-01-16T11:00:00.000Z' }),
        mem({ timestamp: '2024-01-18T10:00:00.000Z' }),
    ]);
    assert(r8over5.avgMessagesPerDay === 1.6, '8 messages / 5-day span → 1.6');

    // only timestamped messages count
    const withUnts = KM.ConversationStats.compute([
        mem({ timestamp: null }),
        mem({ timestamp: null }),
        mem({ timestamp: '2024-03-01T10:00:00.000Z' }),
    ]);
    // 1 timestamped message / 1 day = 1
    assert(withUnts.avgMessagesPerDay === 1, 'only timestamped messages counted');

    // zero totalDays → avgMessagesPerDay is 0
    assert(KM.ConversationStats.compute([
        mem({ timestamp: null }),
    ]).avgMessagesPerDay === 0, 'no valid timestamps → avgMessagesPerDay is 0');

    // result is a number
    assert(typeof r8over5.avgMessagesPerDay === 'number', 'avgMessagesPerDay is a number type');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — perSenderStats ordering and entries
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — perSenderStats ordering', function () {
    const KM = makeCtx();

    const corpus = [
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:01:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:02:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:03:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:04:00.000Z' }),
        mem({ sender: 'Carol', timestamp: '2024-01-15T10:05:00.000Z' }),
    ];
    const r = KM.ConversationStats.compute(corpus);

    assert(r.perSenderStats[0].sender === 'Alice',  'highest count sender is first');
    assert(r.perSenderStats[0].count  === 3,        'top sender count is 3');
    assert(r.perSenderStats[1].sender === 'Bob',    'second sender is Bob');
    assert(r.perSenderStats[2].sender === 'Carol',  'third sender is Carol');

    // tie-break by name: two senders with equal count
    const tieCorpus = [
        mem({ sender: 'Zara', timestamp: '2024-02-01T10:00:00.000Z' }),
        mem({ sender: 'Zara', timestamp: '2024-02-01T10:01:00.000Z' }),
        mem({ sender: 'Anna', timestamp: '2024-02-01T10:02:00.000Z' }),
        mem({ sender: 'Anna', timestamp: '2024-02-01T10:03:00.000Z' }),
    ];
    const rTie = KM.ConversationStats.compute(tieCorpus);
    assert(rTie.perSenderStats[0].sender === 'Anna', 'equal count → alphabetically earlier name first');
    assert(rTie.perSenderStats[1].sender === 'Zara', 'equal count → alphabetically later name second');

    // perSenderStats is an array
    assert(Array.isArray(r.perSenderStats), 'perSenderStats is an array');

    // each entry has sender, count, pct
    const entry = r.perSenderStats[0];
    assert(typeof entry.sender === 'string', 'entry.sender is string');
    assert(typeof entry.count  === 'number', 'entry.count is number');
    assert(typeof entry.pct    === 'number', 'entry.pct is number');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — perSenderStats includes senderRole:self
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — perSenderStats includes senderRole:self', function () {
    const KM = makeCtx();

    const corpus = [
        mem({ sender: 'Me',    senderRole: 'self',    timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: 'Me',    senderRole: 'self',    timestamp: '2024-01-15T10:01:00.000Z' }),
        mem({ sender: 'Alice', senderRole: 'contact', timestamp: '2024-01-15T10:02:00.000Z' }),
    ];
    const r = KM.ConversationStats.compute(corpus);

    const senders = r.perSenderStats.map(function (e) { return e.sender; });
    assert(senders.includes('Me'),    'senderRole:self sender included in perSenderStats');
    assert(senders.includes('Alice'), 'contact sender also included');

    const meEntry = r.perSenderStats.find(function (e) { return e.sender === 'Me'; });
    assert(meEntry.count === 2,       'self sender count is correct');
    assert(r.perSenderStats.length === 2, 'two distinct senders in result');

    // self sender with highest count should be first
    assert(r.perSenderStats[0].sender === 'Me', 'self sender with most messages is first');

    // all self messages
    const allSelf = [
        mem({ sender: 'Me', senderRole: 'self', timestamp: '2024-02-01T10:00:00.000Z' }),
        mem({ sender: 'Me', senderRole: 'self', timestamp: '2024-02-01T10:01:00.000Z' }),
    ];
    const rSelf = KM.ConversationStats.compute(allSelf);
    assert(rSelf.perSenderStats.length === 1 && rSelf.perSenderStats[0].sender === 'Me',
        'all-self corpus: Me in perSenderStats');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — perSenderStats excludes blank senders
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — perSenderStats excludes blank senders', function () {
    const KM = makeCtx();

    const corpus = [
        mem({ sender: null,    timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: '',      timestamp: '2024-01-15T10:01:00.000Z' }),
        mem({ sender: '   ',   timestamp: '2024-01-15T10:02:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:03:00.000Z' }),
    ];
    const r = KM.ConversationStats.compute(corpus);

    assert(r.perSenderStats.length === 1,             'only Alice in perSenderStats');
    assert(r.perSenderStats[0].sender === 'Alice',    'Alice is the sole entry');

    const senders = r.perSenderStats.map(function (e) { return e.sender; });
    assert(!senders.includes(null),  'null sender excluded');
    assert(!senders.includes(''),    'empty string sender excluded');
    assert(!senders.includes('   '), 'whitespace-only sender excluded');

    // all blank senders → empty perSenderStats
    const allBlank = [
        mem({ sender: null, timestamp: '2024-02-01T10:00:00.000Z' }),
        mem({ sender: '',   timestamp: '2024-02-01T10:01:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(allBlank).perSenderStats.length === 0,
        'all blank senders → perSenderStats is []');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — pct calculation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — pct calculation', function () {
    const KM = makeCtx();

    // single sender → 100%
    const single = [
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:01:00.000Z' }),
    ];
    assert(KM.ConversationStats.compute(single).perSenderStats[0].pct === 100,
        'single sender → pct is 100');

    // two equal senders → 50% each
    const twoEqual = [
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:01:00.000Z' }),
    ];
    const rTwo = KM.ConversationStats.compute(twoEqual);
    const alicePct = rTwo.perSenderStats.find(function (e) { return e.sender === 'Alice'; }).pct;
    const bobPct   = rTwo.perSenderStats.find(function (e) { return e.sender === 'Bob';   }).pct;
    assert(alicePct === 50, 'two equal senders: Alice pct is 50');
    assert(bobPct   === 50, 'two equal senders: Bob pct is 50');

    // 3 of 8 → 37.5
    const eightMsgs = [
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:01:00.000Z' }),
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:02:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:03:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:04:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:05:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:06:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:07:00.000Z' }),
    ];
    const rEight = KM.ConversationStats.compute(eightMsgs);
    const alicePct8 = rEight.perSenderStats.find(function (e) { return e.sender === 'Alice'; }).pct;
    assert(alicePct8 === 37.5, '3 of 8 messages → pct is 37.5');

    // pct is a number type
    assert(typeof alicePct8 === 'number', 'pct is a number type');

    // pct has at most 1 decimal place
    const pctStr = String(alicePct8);
    const decIdx = pctStr.indexOf('.');
    const decimals = decIdx === -1 ? 0 : pctStr.length - decIdx - 1;
    assert(decimals <= 1, 'pct has at most 1 decimal place');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — malformed entries don't throw
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — malformed entries don\'t throw', function () {
    const KM = makeCtx();

    let threw = false;

    try {
        KM.ConversationStats.compute([null, undefined, {}, { sender: null }, mem()]);
    } catch (e) {
        threw = true;
    }
    assert(!threw, 'null/undefined/empty entries do not throw');

    const withNullEntries = [null, mem({ timestamp: '2024-01-15T10:00:00.000Z', sender: 'Alice' }), undefined];
    const r = KM.ConversationStats.compute(withNullEntries);
    assert(r.busiestDay === '2024-01-15',     'valid entry processed even with null neighbors');
    assert(r.perSenderStats.length === 1,    'valid sender counted despite null neighbors');

    // non-ISO timestamp string is skipped for date stats
    const badTs = KM.ConversationStats.compute([
        mem({ timestamp: 'not-a-date', sender: 'Alice' }),
        mem({ timestamp: '2024-02-05T10:00:00.000Z', sender: 'Bob' }),
    ]);
    assert(badTs.busiestDay === '2024-02-05',  'non-ISO timestamp skipped; valid one used');
    assert(badTs.perSenderStats.length === 2,  'both senders counted regardless of timestamp validity');

    // numeric timestamp → skipped for date stats (not a string)
    const numTs = KM.ConversationStats.compute([
        mem({ timestamp: 1705305600000 }),
    ]);
    assert(numTs.busiestDay === null,           'numeric timestamp skipped for date stats');

    try {
        KM.ConversationStats.compute([{ timestamp: {}, sender: 42 }]);
    } catch (e2) {
        threw = true;
    }
    assert(!threw, 'invalid field types do not throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — immutability
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — immutability', function () {
    const KM = makeCtx();

    const inputs = [
        mem({ sender: 'Alice', timestamp: '2024-01-15T10:00:00.000Z' }),
        mem({ sender: 'Bob',   timestamp: '2024-01-15T10:01:00.000Z' }),
    ];
    const originalSender0 = inputs[0].sender;
    const originalLength  = inputs.length;

    const r1 = KM.ConversationStats.compute(inputs);
    assert(inputs.length        === originalLength,  'input array length unchanged');
    assert(inputs[0].sender     === originalSender0, 'input memory[0].sender unchanged');

    // two calls return distinct objects
    const r2 = KM.ConversationStats.compute(inputs);
    assert(r1 !== r2,                                 'each call returns a new object');
    assert(r1.perSenderStats !== r2.perSenderStats,   'perSenderStats arrays are distinct objects');

    // mutating result doesn't affect next call
    r1.perSenderStats.push({ sender: 'Injected', count: 999, pct: 0 });
    const r3 = KM.ConversationStats.compute(inputs);
    assert(r3.perSenderStats.length === 2,            'mutating previous result does not affect next call');

    // compute([]) returns fresh empty array each time
    const z1 = KM.ConversationStats.compute([]);
    const z2 = KM.ConversationStats.compute([]);
    assert(z1.perSenderStats !== z2.perSenderStats,   'zero-state perSenderStats arrays are distinct');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — semantic guards', function () {
    const src = readFileSync(
        join(__dirname, '../../src/core/conversation-stats.js'), 'utf8'
    );
    assert(!src.includes('proof-ready'),            'source does not reference proof-ready');
    assert(!src.includes('estimatedPages'),         'source does not reference estimatedPages');
    assert(!src.includes('manufacturingReady'),     'source does not reference manufacturingReady');
    assert(!src.includes('checkoutReady'),          'source does not reference checkoutReady');
    assert(!src.includes('vendorReady'),            'source does not reference vendorReady');
    assert(!src.includes('product-preflight'),      'source does not reference product-preflight');
    assert(!src.includes('import-quality-report'),  'source does not reference import-quality-report');
    assert(!src.includes('src/products'),           'source does not reference src/products');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
