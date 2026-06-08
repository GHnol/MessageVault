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
    load(ctx, 'src/core/timing-analysis.js');
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

function mem(ts, overrides) {
    return Object.assign({
        id:               'mem-test',
        sourcePlatformId: 'imessage',
        sourceAdapterId:  'imessage-chatdb-v1',
        type:             'message',
        timestamp:        ts,
        sender:           'Alice',
        senderRole:       'contact',
        text:             'hello',
        reactions:        [],
        isAttachmentOnly: false
    }, overrides);
}

// UTC reference dates used in tests:
//   2026-06-07T__:00:00.000Z => Sunday    (getUTCDay() === 0)
//   2026-06-08T__:00:00.000Z => Monday    (getUTCDay() === 1)
//   2026-06-09T__:00:00.000Z => Tuesday   (getUTCDay() === 2)
//   2026-06-10T__:00:00.000Z => Wednesday (getUTCDay() === 3)
//   2026-06-11T__:00:00.000Z => Thursday  (getUTCDay() === 4)
//   2026-06-12T__:00:00.000Z => Friday    (getUTCDay() === 5)
//   2026-06-13T__:00:00.000Z => Saturday  (getUTCDay() === 6)

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.TimingAnalysis === 'object' && KM.TimingAnalysis !== null,
        'KMEngine.TimingAnalysis is an object');
    assert(typeof KM.TimingAnalysis.compute === 'function',
        'compute is a function');
    const r = KM.TimingAnalysis.compute([mem('2026-06-10T14:00:00.000Z')]);
    assert(typeof r === 'object' && r !== null,
        'compute returns an object');
    assert('peakHour' in r,
        'result has peakHour field');
    assert('peakHourCount' in r,
        'result has peakHourCount field');
    assert('peakDayOfWeek' in r,
        'result has peakDayOfWeek field');
    assert('peakDayOfWeekCount' in r,
        'result has peakDayOfWeekCount field');
    assert('hourlyDistribution' in r,
        'result has hourlyDistribution field');
    assert('dailyDistribution' in r,
        'result has dailyDistribution field');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — zero-state: compute([])
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — zero-state: compute([])', function () {
    const KM = makeCtx();
    const z = KM.TimingAnalysis.compute([]);
    assert(z.peakHour === null,
        'compute([]) peakHour === null');
    assert(z.peakHourCount === 0,
        'compute([]) peakHourCount === 0');
    assert(z.peakDayOfWeek === null,
        'compute([]) peakDayOfWeek === null');
    assert(z.peakDayOfWeekCount === 0,
        'compute([]) peakDayOfWeekCount === 0');
    assert(Array.isArray(z.hourlyDistribution) && z.hourlyDistribution.length === 24,
        'compute([]) hourlyDistribution is array of length 24');
    assert(z.hourlyDistribution.every(function (v) { return v === 0; }),
        'compute([]) hourlyDistribution all zeros');
    assert(Array.isArray(z.dailyDistribution) && z.dailyDistribution.length === 7,
        'compute([]) dailyDistribution is array of length 7');
    assert(z.dailyDistribution.every(function (v) { return v === 0; }),
        'compute([]) dailyDistribution all zeros');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — zero-state: null / non-array inputs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — zero-state: null/non-array inputs', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.peakHour === null && r.peakHourCount === 0 &&
               r.peakDayOfWeek === null && r.peakDayOfWeekCount === 0;
    }
    assert(isZero(KM.TimingAnalysis.compute(null)),
        'compute(null) returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute(undefined)),
        'compute(undefined) returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute('2026-06-10')),
        'compute(string) returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute(42)),
        'compute(number) returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute({})),
        'compute(plain object) returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute(false)),
        'compute(false) returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — zero-state: no valid timestamps
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — zero-state: no valid timestamps', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.peakHour === null && r.peakHourCount === 0 &&
               r.peakDayOfWeek === null && r.peakDayOfWeekCount === 0;
    }
    assert(isZero(KM.TimingAnalysis.compute([mem(null)])),
        'all-null-timestamp array returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute([mem('')])),
        'all-empty-timestamp array returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute([mem('not a date')])),
        'all-invalid-timestamp array returns zero-state');
    assert(isZero(KM.TimingAnalysis.compute([mem(0)])),
        'all-zero-timestamp array returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — single message
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — single message', function () {
    const KM = makeCtx();
    // 2026-06-10T14:30:00.000Z => UTC hour 14, UTC day 3 (Wednesday)
    const r = KM.TimingAnalysis.compute([mem('2026-06-10T14:30:00.000Z')]);
    assert(r.peakHour === 14,
        'single message: peakHour = UTC hour of that message');
    assert(r.peakHourCount === 1,
        'single message: peakHourCount === 1');
    assert(r.peakDayOfWeek === 3,
        'single message: peakDayOfWeek = UTC day of that message (Wednesday=3)');
    assert(r.peakDayOfWeekCount === 1,
        'single message: peakDayOfWeekCount === 1');
    assert(r.hourlyDistribution[14] === 1,
        'single message: hourlyDistribution[14] === 1');
    assert(r.dailyDistribution[3] === 1,
        'single message: dailyDistribution[3] === 1');
    assert(r.hourlyDistribution.reduce(function (a, b) { return a + b; }, 0) === 1,
        'single message: sum of hourlyDistribution === 1');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — hourlyDistribution accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — hourlyDistribution accuracy', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-10T09:00:00.000Z'),  // hour 9
        mem('2026-06-10T09:30:00.000Z'),  // hour 9
        mem('2026-06-10T14:00:00.000Z'),  // hour 14
        mem('2026-06-10T14:15:00.000Z'),  // hour 14
        mem('2026-06-10T14:45:00.000Z'),  // hour 14
        mem('2026-06-10T22:00:00.000Z'),  // hour 22
    ]);
    assert(r.hourlyDistribution.length === 24,
        'hourlyDistribution always has 24 slots');
    assert(r.hourlyDistribution[9] === 2,
        'hourlyDistribution[9] === 2 (two messages at 09:xx)');
    assert(r.hourlyDistribution[14] === 3,
        'hourlyDistribution[14] === 3 (three messages at 14:xx)');
    assert(r.hourlyDistribution[22] === 1,
        'hourlyDistribution[22] === 1 (one message at 22:xx)');
    assert(r.hourlyDistribution[0] === 0,
        'hourlyDistribution[0] === 0 (no messages at midnight)');
    assert(r.hourlyDistribution.reduce(function (a, b) { return a + b; }, 0) === 6,
        'sum of hourlyDistribution === total valid messages (6)');
    assert(r.hourlyDistribution.filter(function (v) { return v > 0; }).length === 3,
        'only 3 non-zero hour slots for 3 distinct UTC hours');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — dailyDistribution accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — dailyDistribution accuracy', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-07T12:00:00.000Z'),  // Sunday   = 0
        mem('2026-06-09T12:00:00.000Z'),  // Tuesday  = 2
        mem('2026-06-09T18:00:00.000Z'),  // Tuesday  = 2
        mem('2026-06-10T12:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-10T14:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-10T20:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-13T08:00:00.000Z'),  // Saturday  = 6
    ]);
    assert(r.dailyDistribution.length === 7,
        'dailyDistribution always has 7 slots');
    assert(r.dailyDistribution[0] === 1,
        'dailyDistribution[0] === 1 (one Sunday)');
    assert(r.dailyDistribution[2] === 2,
        'dailyDistribution[2] === 2 (two Tuesdays)');
    assert(r.dailyDistribution[3] === 3,
        'dailyDistribution[3] === 3 (three Wednesdays)');
    assert(r.dailyDistribution[6] === 1,
        'dailyDistribution[6] === 1 (one Saturday)');
    assert(r.dailyDistribution[1] === 0,
        'dailyDistribution[1] === 0 (no Mondays)');
    assert(r.dailyDistribution.reduce(function (a, b) { return a + b; }, 0) === 7,
        'sum of dailyDistribution === total valid messages (7)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — peakHour computation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — peakHour computation', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-10T09:00:00.000Z'),
        mem('2026-06-10T09:30:00.000Z'),
        mem('2026-06-10T14:00:00.000Z'),
        mem('2026-06-10T14:15:00.000Z'),
        mem('2026-06-10T14:45:00.000Z'),
        mem('2026-06-10T22:00:00.000Z'),
    ]);
    assert(r.peakHour === 14,
        'peakHour is 14 when hour 14 has the most messages (3)');
    assert(r.peakHourCount === 3,
        'peakHourCount is 3 for hour 14');
    const midnight = KM.TimingAnalysis.compute([
        mem('2026-06-10T00:00:00.000Z'),
        mem('2026-06-10T00:30:00.000Z'),
        mem('2026-06-10T00:59:59.000Z'),
        mem('2026-06-10T05:00:00.000Z'),
    ]);
    assert(midnight.peakHour === 0,
        'peakHour can be 0 (midnight UTC)');
    assert(midnight.peakHourCount === 3,
        'peakHourCount correct for midnight peak (3)');
    const lateNight = KM.TimingAnalysis.compute([
        mem('2026-06-10T23:00:00.000Z'),
        mem('2026-06-10T23:30:00.000Z'),
        mem('2026-06-10T12:00:00.000Z'),
    ]);
    assert(lateNight.peakHour === 23,
        'peakHour can be 23 (last UTC hour of day)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — peakDayOfWeek computation
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — peakDayOfWeek computation', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-10T12:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-10T14:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-10T20:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-11T12:00:00.000Z'),  // Thursday  = 4
        mem('2026-06-11T18:00:00.000Z'),  // Thursday  = 4
        mem('2026-06-09T12:00:00.000Z'),  // Tuesday   = 2
    ]);
    assert(r.peakDayOfWeek === 3,
        'peakDayOfWeek is 3 (Wednesday) when it has the most messages (3)');
    assert(r.peakDayOfWeekCount === 3,
        'peakDayOfWeekCount is 3 for Wednesday');
    const sunday = KM.TimingAnalysis.compute([
        mem('2026-06-07T12:00:00.000Z'),
        mem('2026-06-07T14:00:00.000Z'),
        mem('2026-06-07T20:00:00.000Z'),
        mem('2026-06-08T12:00:00.000Z'),
    ]);
    assert(sunday.peakDayOfWeek === 0,
        'peakDayOfWeek can be 0 (Sunday)');
    assert(sunday.peakDayOfWeekCount === 3,
        'peakDayOfWeekCount correct for Sunday peak (3)');
    const saturday = KM.TimingAnalysis.compute([
        mem('2026-06-13T12:00:00.000Z'),
        mem('2026-06-13T14:00:00.000Z'),
        mem('2026-06-09T10:00:00.000Z'),
    ]);
    assert(saturday.peakDayOfWeek === 6,
        'peakDayOfWeek can be 6 (Saturday)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — null/missing/invalid/falsy timestamps skipped
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — null/missing/invalid/falsy timestamps skipped', function () {
    const KM = makeCtx();
    const r1 = KM.TimingAnalysis.compute([
        mem(null),
        mem('2026-06-10T14:00:00.000Z'),
    ]);
    assert(r1.peakHour === 14 && r1.peakHourCount === 1,
        'null timestamp skipped; valid one counts');
    const r2 = KM.TimingAnalysis.compute([
        mem(undefined),
        mem('2026-06-10T14:00:00.000Z'),
    ]);
    assert(r2.peakHour === 14 && r2.peakHourCount === 1,
        'undefined timestamp skipped; valid one counts');
    const r3 = KM.TimingAnalysis.compute([
        mem(''),
        mem('2026-06-10T09:00:00.000Z'),
    ]);
    assert(r3.peakHour === 9,
        'empty-string timestamp skipped; valid one counts');
    const r4 = KM.TimingAnalysis.compute([
        mem('not-a-date'),
        mem('2026-06-10T22:00:00.000Z'),
    ]);
    assert(r4.peakHour === 22,
        'invalid timestamp string skipped; valid one counts');
    const r5 = KM.TimingAnalysis.compute([
        mem('INVALID'),
        mem('also bad'),
        mem('2026-06-10T05:00:00.000Z'),
        mem('2026-06-10T05:30:00.000Z'),
    ]);
    assert(r5.peakHour === 5 && r5.peakHourCount === 2,
        'multiple invalid timestamps skipped; valid ones accumulated');
    const r6 = KM.TimingAnalysis.compute([
        mem(0),
        mem(false),
        mem('2026-06-10T14:00:00.000Z'),
    ]);
    assert(r6.peakHour === 14,
        'numeric-zero and false timestamps skipped; valid one counts');
    const noField = KM.TimingAnalysis.compute([
        { id: 'x', type: 'message', sender: 'Alice' },
        mem('2026-06-10T14:00:00.000Z'),
    ]);
    assert(noField.peakHour === 14,
        'memory with no timestamp field skipped; valid one counts');
    const allInvalid = KM.TimingAnalysis.compute([
        mem(null),
        mem(''),
        mem('bad'),
        mem(undefined),
    ]);
    assert(allInvalid.peakHour === null && allInvalid.peakHourCount === 0,
        'all-invalid timestamps: zero-state returned');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — peakHour tie-break: lowest index wins
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — peakHour tie-break: lowest index wins', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-10T05:00:00.000Z'),
        mem('2026-06-11T05:00:00.000Z'),
        mem('2026-06-10T14:00:00.000Z'),
        mem('2026-06-11T14:00:00.000Z'),
    ]);
    assert(r.peakHour === 5,
        'hours 5 and 14 both have count 2; lower index (5) wins');
    assert(r.peakHourCount === 2,
        'peakHourCount is correct for tied hours');
    const r2 = KM.TimingAnalysis.compute([
        mem('2026-06-10T00:00:00.000Z'),
        mem('2026-06-10T23:00:00.000Z'),
    ]);
    assert(r2.peakHour === 0,
        'hour 0 and 23 both have count 1; lower index (0) wins');
    const triple = KM.TimingAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z'),
        mem('2026-06-10T15:00:00.000Z'),
        mem('2026-06-10T20:00:00.000Z'),
    ]);
    assert(triple.peakHour === 10,
        'hours 10, 15, 20 all have count 1; lowest index (10) wins');
    assert(triple.peakHourCount === 1,
        'peakHourCount is 1 for three-way tie at count 1');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — peakDayOfWeek tie-break: lowest index wins
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — peakDayOfWeek tie-break: lowest index wins', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-07T12:00:00.000Z'),  // Sunday    = 0
        mem('2026-06-09T12:00:00.000Z'),  // Tuesday   = 2
    ]);
    assert(r.peakDayOfWeek === 0,
        'day 0 and 2 both have count 1; lower index (0, Sunday) wins');
    const r2 = KM.TimingAnalysis.compute([
        mem('2026-06-09T12:00:00.000Z'),  // Tuesday   = 2
        mem('2026-06-11T12:00:00.000Z'),  // Thursday  = 4
    ]);
    assert(r2.peakDayOfWeek === 2,
        'day 2 and 4 both have count 1; lower index (2, Tuesday) wins');
    const triple = KM.TimingAnalysis.compute([
        mem('2026-06-10T12:00:00.000Z'),  // Wednesday = 3
        mem('2026-06-12T12:00:00.000Z'),  // Friday    = 5
        mem('2026-06-13T12:00:00.000Z'),  // Saturday  = 6
    ]);
    assert(triple.peakDayOfWeek === 3,
        'days 3, 5, 6 all have count 1; lowest (3, Wednesday) wins');
    assert(triple.peakDayOfWeekCount === 1,
        'peakDayOfWeekCount is 1 for three-way tie at count 1');
    const r3 = KM.TimingAnalysis.compute([
        mem('2026-06-07T12:00:00.000Z'),  // Sunday    = 0
        mem('2026-06-07T14:00:00.000Z'),  // Sunday    = 0
        mem('2026-06-13T12:00:00.000Z'),  // Saturday  = 6
        mem('2026-06-13T14:00:00.000Z'),  // Saturday  = 6
        mem('2026-06-10T12:00:00.000Z'),  // Wednesday = 3
    ]);
    assert(r3.peakDayOfWeek === 0,
        'Sunday and Saturday tied at 2; lowest index (0, Sunday) wins');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — multi-sender, sender-agnostic
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — multi-sender, sender-agnostic', function () {
    const KM = makeCtx();
    const r = KM.TimingAnalysis.compute([
        mem('2026-06-10T14:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T14:30:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T14:45:00.000Z', { sender: 'Charlie' }),
        mem('2026-06-10T09:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T09:30:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r.peakHour === 14,
        'peakHour is 14 regardless of which senders sent at that hour');
    assert(r.peakHourCount === 3,
        'peakHourCount counts all senders combined for that hour');
    assert(r.hourlyDistribution[14] === 3,
        'hourlyDistribution[14] sums across all senders');
    assert(r.hourlyDistribution[9] === 2,
        'hourlyDistribution[9] sums across Alice and Bob');
    assert(r.peakDayOfWeek === 3,
        'peakDayOfWeek counts across all senders for that day');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — no throw on malformed entries
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — no throw on malformed entries', function () {
    const KM = makeCtx();
    let threw = false;
    try {
        KM.TimingAnalysis.compute([null, undefined, 42, 'string', {}, mem('2026-06-10T14:00:00.000Z')]);
    } catch (e) {
        threw = true;
    }
    assert(!threw,
        'compute does not throw on null/non-object/primitive entries');
    const r = KM.TimingAnalysis.compute([null, undefined, mem('2026-06-10T14:00:00.000Z')]);
    assert(r.peakHour === 14,
        'valid entry counted correctly when mixed with null/undefined');
    let threw2 = false;
    try {
        KM.TimingAnalysis.compute([{ timestamp: { nested: 'object' } }]);
    } catch (e) {
        threw2 = true;
    }
    assert(!threw2,
        'compute does not throw when timestamp is a non-string object');
    let threw3 = false;
    try {
        KM.TimingAnalysis.compute([{ timestamp: Infinity }]);
    } catch (e) {
        threw3 = true;
    }
    assert(!threw3,
        'compute does not throw when timestamp is Infinity');
    const allBad = KM.TimingAnalysis.compute([null, undefined, 42, false]);
    assert(allBad.peakHour === null && allBad.peakHourCount === 0,
        'all-bad-entry array returns zero-state without throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — semantic guards', function () {
    const KM = makeCtx();
    assert(Object.keys(KM.TimingAnalysis).length === 1 && 'compute' in KM.TimingAnalysis,
        'TimingAnalysis only exposes compute — no extra surface area');
    assert(typeof KM.TimingAnalysis.compute === 'function',
        'compute is a function (not a class or constructor)');
    assert(KM.ProductDraftState === undefined,
        'ProductDraftState not present in this module context');
    assert(KM.BOOK_PAGINATION_VERSION === undefined,
        'BOOK_PAGINATION_VERSION not present in this module context');
    assert(KM.BOOK_PARITY === undefined,
        'BOOK_PARITY not present in this module context');
    const m = mem('2026-06-10T14:00:00.000Z');
    const r1 = KM.TimingAnalysis.compute([m]);
    const r2 = KM.TimingAnalysis.compute([m]);
    assert(r1 !== r2,
        'compute returns a new object each call for non-zero input (pure, no shared state)');
    const r1h = r1.hourlyDistribution;
    const r2h = r2.hourlyDistribution;
    assert(r1h !== r2h,
        'hourlyDistribution arrays are distinct objects for non-zero results');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
