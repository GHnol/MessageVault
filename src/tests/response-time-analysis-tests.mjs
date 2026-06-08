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
    load(ctx, 'src/core/response-time-analysis.js');
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

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.ResponseTimeAnalysis === 'object' && KM.ResponseTimeAnalysis !== null,
        'KMEngine.ResponseTimeAnalysis is an object');
    assert(typeof KM.ResponseTimeAnalysis.compute === 'function',
        'compute is a function');
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
    ]);
    assert(typeof r === 'object' && r !== null,
        'compute returns a non-null object');
    assert('avgResponseTimeMs' in r,
        'result has avgResponseTimeMs field');
    assert('fastestResponder' in r,
        'result has fastestResponder field');
    assert('perSenderStats' in r,
        'result has perSenderStats field');
    assert(typeof r.avgResponseTimeMs === 'number',
        'avgResponseTimeMs is a number');
    assert(Array.isArray(r.perSenderStats),
        'perSenderStats is an array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — zero-state: compute([])
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — zero-state: compute([])', function () {
    const KM = makeCtx();
    const z = KM.ResponseTimeAnalysis.compute([]);
    assert(typeof z === 'object' && z !== null,
        'compute([]) returns a non-null object');
    assert(z.avgResponseTimeMs === 0,
        'compute([]) avgResponseTimeMs === 0');
    assert(z.fastestResponder === null,
        'compute([]) fastestResponder === null');
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
        return r.avgResponseTimeMs === 0 && r.fastestResponder === null &&
               Array.isArray(r.perSenderStats) && r.perSenderStats.length === 0;
    }
    assert(isZero(KM.ResponseTimeAnalysis.compute(null)),
        'compute(null) returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute(undefined)),
        'compute(undefined) returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute('2026-06-10')),
        'compute(string) returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute(42)),
        'compute(number) returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute({})),
        'compute(plain object) returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute(false)),
        'compute(false) returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — zero-state: no valid timestamps
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — zero-state: no valid timestamps', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgResponseTimeMs === 0 && r.fastestResponder === null;
    }
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem(null, { sender: 'Alice' }),
        mem(null, { sender: 'Bob' }),
    ])),
        'all-null-timestamp array returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('', { sender: 'Alice' }),
        mem('', { sender: 'Bob' }),
    ])),
        'all-empty-timestamp array returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('not a date', { sender: 'Alice' }),
        mem('not a date', { sender: 'Bob' }),
    ])),
        'all-invalid-timestamp array returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem(0, { sender: 'Alice' }),
        mem(0, { sender: 'Bob' }),
    ])),
        'all-zero-timestamp array returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — zero-state: system messages excluded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — zero-state: system messages excluded', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgResponseTimeMs === 0 && r.fastestResponder === null;
    }
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice', senderRole: 'system' }),
    ])),
        'single system message returns zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice', senderRole: 'system' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob', senderRole: 'system' }),
    ])),
        'two system messages (different senders) return zero-state');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice', senderRole: 'system' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob', senderRole: 'system' }),
        mem('2026-06-10T10:10:00.000Z', { sender: 'Alice', senderRole: 'system' }),
    ])),
        'three system messages return zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — zero-state: single message or all-same-sender
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — zero-state: single message or all-same-sender', function () {
    const KM = makeCtx();
    function isZero(r) {
        return r.avgResponseTimeMs === 0 && r.fastestResponder === null;
    }
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
    ])),
        'single message returns zero-state (no response pair possible)');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Alice' }),
    ])),
        'two same-sender messages return zero-state (no response pair)');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:10:00.000Z', { sender: 'Alice' }),
    ])),
        'three same-sender messages return zero-state (no response pair)');
    assert(isZero(KM.ResponseTimeAnalysis.compute([
        mem(null, { sender: 'Alice' }),
        mem('bad-date', { sender: 'Bob' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
    ])),
        'single valid entry (others invalid/skipped) returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — basic two-sender response pair detection
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — basic two-sender response pair detection', function () {
    const KM = makeCtx();
    // Alice at T=0, Bob at T=300000 (5 min later)
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r.avgResponseTimeMs > 0,
        'two-message pair: avgResponseTimeMs > 0');
    assert(r.perSenderStats.length === 1,
        'two-message pair: exactly one sender in perSenderStats');
    assert(r.fastestResponder !== null,
        'two-message pair: fastestResponder is non-null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — avgResponseTimeMs accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — avgResponseTimeMs accuracy', function () {
    const KM = makeCtx();
    // Alice at T=0, Bob at T=300000 → one pair: Bob 300000ms
    const single = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
    ]);
    assert(single.avgResponseTimeMs === 300000,
        'single pair (300000ms): avgResponseTimeMs === 300000');

    // Alice(0), Bob(300000), Alice(360000) → Bob:300000, Alice:60000 → avg=180000
    const two = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
    ]);
    assert(two.avgResponseTimeMs === 180000,
        'two pairs (300000+60000)/2=180000: avgResponseTimeMs === 180000');

    // Three pairs: 60000, 120000, 180000 → avg = 120000
    const three = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:01:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:03:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Bob' }),
    ]);
    assert(three.avgResponseTimeMs === 120000,
        'three pairs (60000+120000+180000)/3=120000: avgResponseTimeMs === 120000');

    // Math.round: 5 pairs summing to 250001ms → avg=50000.2 → round to 50000
    const rounded = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:01:00.000Z', { sender: 'Bob' }),       // +60000
        mem('2026-06-10T10:01:00.001Z', { sender: 'Alice' }),     // +1
        mem('2026-06-10T10:02:00.001Z', { sender: 'Bob' }),       // +60000
        mem('2026-06-10T10:02:00.002Z', { sender: 'Alice' }),     // +1
    ]);
    // allDeltas = [60000, 1, 60000, 1] → sum=120002, count=4 → avg=30000.5 → round=30001
    assert(rounded.avgResponseTimeMs === 30001,
        'Math.round: (60000+1+60000+1)/4 = 30000.5 rounds to 30001');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — perSenderStats accuracy
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — perSenderStats accuracy', function () {
    const KM = makeCtx();
    // Alice(0), Bob(300000), Alice(360000) → Bob:300000ms, Alice:60000ms
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
    ]);
    assert(r.perSenderStats.length === 2,
        'two-sender conversation: perSenderStats has 2 entries');
    // Sorted ascending: Alice (60000) first, Bob (300000) second
    assert(r.perSenderStats[0].sender === 'Alice',
        'perSenderStats[0].sender === Alice (faster)');
    assert(r.perSenderStats[0].avgResponseTimeMs === 60000,
        'perSenderStats[0].avgResponseTimeMs === 60000');
    assert(r.perSenderStats[0].responseCount === 1,
        'perSenderStats[0].responseCount === 1');
    assert(r.perSenderStats[1].sender === 'Bob',
        'perSenderStats[1].sender === Bob (slower)');
    assert(r.perSenderStats[1].avgResponseTimeMs === 300000,
        'perSenderStats[1].avgResponseTimeMs === 300000');

    // Multiple responses: Alice responds twice (60000ms + 120000ms → avg 90000ms)
    // Bob T=0, Alice T=60000 (Alice:60000ms), Bob T=120000, Alice T=240000 (Alice:120000ms)
    const r2 = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:01:00.000Z', { sender: 'Alice' }),  // Alice: 60000ms
        mem('2026-06-10T10:02:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:04:00.000Z', { sender: 'Alice' }),  // Alice: 120000ms
    ]);
    const aliceStats = r2.perSenderStats.find(function (s) { return s.sender === 'Alice'; });
    assert(aliceStats && aliceStats.responseCount === 2,
        'perSenderStats.responseCount reflects multiple responses (Alice: 2 responses)');
    assert(aliceStats && aliceStats.avgResponseTimeMs === 90000,
        'perSenderStats avgResponseTimeMs === (60000+120000)/2 = 90000 for Alice');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — perSenderStats sort order
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — perSenderStats sort order', function () {
    const KM = makeCtx();
    // Alice:60000, Bob:300000 → Alice first (lower avg)
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
    ]);
    assert(r.perSenderStats[0].avgResponseTimeMs <= r.perSenderStats[1].avgResponseTimeMs,
        'perSenderStats sorted ascending by avgResponseTimeMs');

    // Tie-break: Bob and Carol both 120000ms avg → Bob (B) before Carol (C) alphabetically
    // Bob(0), Carol(120000) → Carol:120000ms; Carol→Bob(240000) → Bob:120000ms; Bob→Carol(360000) → Carol:120000ms
    // Bob: [120000] avg=120000; Carol: [120000,120000] avg=120000 — tie → Bob wins
    const tied = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:02:00.000Z', { sender: 'Carol' }),  // Carol: 120000ms
        mem('2026-06-10T10:04:00.000Z', { sender: 'Bob' }),    // Bob: 120000ms
        mem('2026-06-10T10:06:00.000Z', { sender: 'Carol' }),  // Carol: 120000ms
    ]);
    assert(tied.perSenderStats[0].sender === 'Bob' || tied.perSenderStats[0].sender === 'Carol',
        'tied avg: first entry is one of the tied senders');
    assert(tied.perSenderStats[0].sender === 'Bob',
        'tie-break: Bob (B) comes before Carol (C) alphabetically');

    // Three senders: Charlie:60000, Alice:120000, Bob:300000
    const three = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),      // Bob: 300000ms
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:08:00.000Z', { sender: 'Charlie' }), // Charlie: 120000ms
        mem('2026-06-10T10:09:00.000Z', { sender: 'Alice' }),
    ]);
    // Alice: 60000ms (responds to Bob at 10:06→ 10:09 = 180000ms, wait no...)
    // Let me recalculate:
    // msg 1: Alice T=0
    // msg 2: Bob T=300000 → Bob: 300000ms
    // msg 3: Alice T=360000 → Alice: 60000ms
    // msg 4: Charlie T=480000 → Charlie: 120000ms
    // msg 5: Alice T=540000 → Alice: 60000ms
    // Alice: [60000, 60000] avg=60000; Bob: [300000] avg=300000; Charlie: [120000] avg=120000
    // Sorted: Alice(60000), Charlie(120000), Bob(300000)
    assert(three.perSenderStats.length === 3,
        'three-sender conversation: perSenderStats has 3 entries');
    assert(three.perSenderStats[0].sender === 'Alice' && three.perSenderStats[2].sender === 'Bob',
        'three senders sorted by avg: Alice(60000) < Charlie(120000) < Bob(300000)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — fastestResponder
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — fastestResponder', function () {
    const KM = makeCtx();
    // Alice:60000, Bob:300000 → fastestResponder is Alice
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
    ]);
    assert(r.fastestResponder !== null,
        'fastestResponder is non-null when there are valid response pairs');
    assert(r.fastestResponder.sender === 'Alice',
        'fastestResponder.sender === Alice (60000ms < 300000ms)');
    assert(r.fastestResponder.avgResponseTimeMs === 60000,
        'fastestResponder.avgResponseTimeMs === 60000');
    assert(r.fastestResponder === r.perSenderStats[0],
        'fastestResponder is the same reference as perSenderStats[0]');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — system messages skipped in pairs
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — system messages skipped in pairs', function () {
    const KM = makeCtx();
    // System message in the middle is excluded from valid[]
    // Alice(contact), System(system), Bob(contact) → only Alice+Bob remain
    // valid after filter: [{Alice,T0}, {Bob,T2}]
    // Pair: Bob responds to Alice, delta = T2-T0
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice', senderRole: 'contact' }),
        mem('2026-06-10T10:03:00.000Z', { sender: 'System', senderRole: 'system' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob', senderRole: 'contact' }),
    ]);
    assert(r.avgResponseTimeMs === 300000,
        'system message excluded: Bob responds to Alice across system message gap (5min=300000ms)');

    // All system → zero-state (already Suite 5, confirm again for chained context)
    assert(r.perSenderStats.length === 1,
        'system message excluded: only Bob credited as responder');

    // System between two same-contact senders → system stripped, same-sender pair skipped
    const r2 = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice', senderRole: 'contact' }),
        mem('2026-06-10T10:03:00.000Z', { sender: 'System', senderRole: 'system' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Alice', senderRole: 'contact' }),
    ]);
    assert(r2.fastestResponder === null,
        'system between two Alice messages: valid = [Alice, Alice], no different-sender pair, zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — same-sender consecutive pairs skipped
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — same-sender consecutive pairs skipped', function () {
    const KM = makeCtx();
    // Alice(0), Alice(60000), Bob(360000) → pair i=1 skipped; pair i=2: Alice→Bob, delta=300000
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:01:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r.perSenderStats.length === 1,
        'Alice Alice Bob: only Bob credited (Alice→Bob pair only)');
    assert(r.perSenderStats[0].sender === 'Bob' && r.perSenderStats[0].avgResponseTimeMs === 300000,
        'Bob responds to second Alice message: delta = 5min = 300000ms');

    // Alice, Bob, Alice, Alice, Bob → Bob:300000, Alice:60000 (second Bob→Alice), then same-sender Alice skip, Bob:300000
    // msg1: Alice T=0
    // msg2: Bob T=300000 → Bob: 300000ms
    // msg3: Alice T=360000 → Alice: 60000ms
    // msg4: Alice T=420000 → same sender (Alice), skip
    // msg5: Bob T=720000 → Bob: 720000-420000=300000ms
    // Bob: [300000, 300000] avg=300000; Alice: [60000] avg=60000
    const r2 = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:07:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:12:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r2.perSenderStats[0].sender === 'Alice' && r2.perSenderStats[0].responseCount === 1,
        'consecutive same-sender messages only generate one response pair for that sender');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — unsorted input handled; zero delta counted
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — unsorted input handled; zero delta counted', function () {
    const KM = makeCtx();
    // Unsorted input: Bob(10min), Alice(0), Charlie(5min) → sorted: Alice(0), Charlie(5), Bob(10)
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:10:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Charlie' }),
    ]);
    // After sort: Alice(0), Charlie(300000), Bob(600000)
    // i=1: Alice→Charlie: Charlie 300000ms
    // i=2: Charlie→Bob: Bob 300000ms
    assert(r.avgResponseTimeMs === 300000,
        'unsorted input: sorted before pairing; avgResponseTimeMs = 300000');
    assert(r.perSenderStats.length === 2,
        'unsorted input: 2 senders credited (Charlie and Bob)');

    // Zero delta: Alice and Bob at same timestamp
    const zero = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Bob' }),
    ]);
    assert(zero.avgResponseTimeMs === 0 && zero.fastestResponder !== null,
        'zero delta (simultaneous messages): counted as 0ms response, not skipped');

    // Reversed input: Bob first in array but earlier timestamp
    const reversed = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
    ]);
    // After sort: Alice(0), Bob(300000) → Bob responds 300000ms
    assert(reversed.fastestResponder !== null && reversed.fastestResponder.sender === 'Bob',
        'reversed input sorted correctly: Bob is the responder (300000ms after Alice)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — null/missing/invalid timestamps skipped
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — null/missing/invalid timestamps skipped', function () {
    const KM = makeCtx();
    // Null timestamp skipped; Alice+Bob pair counted
    const r1 = KM.ResponseTimeAnalysis.compute([
        mem(null, { sender: 'Alice' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r1.avgResponseTimeMs === 300000,
        'null timestamp skipped; remaining Alice+Bob pair counted (300000ms)');

    // Undefined timestamp skipped
    const r2 = KM.ResponseTimeAnalysis.compute([
        mem(undefined, { sender: 'Bob' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r2.fastestResponder !== null,
        'undefined timestamp skipped; valid Alice+Bob pair credited');

    // Empty-string timestamp skipped
    const r3 = KM.ResponseTimeAnalysis.compute([
        mem('', { sender: 'Alice' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:01:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r3.avgResponseTimeMs === 60000,
        'empty-string timestamp skipped; valid Alice+Bob pair counted (60000ms)');

    // Invalid-string timestamp skipped
    const r4 = KM.ResponseTimeAnalysis.compute([
        mem('not-a-date', { sender: 'Alice' }),
        mem('2026-06-10T10:00:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Alice' }),
    ]);
    assert(r4.fastestResponder.sender === 'Alice',
        'invalid timestamp skipped; Alice responds to Bob (60000ms is fastest)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — fastestResponder tie-break: alphabetical
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — fastestResponder tie-break: alphabetical', function () {
    const KM = makeCtx();
    // Bob and Carol both respond in 300000ms → Bob (B) wins alphabetically
    const r = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:06:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:11:00.000Z', { sender: 'Carol' }),
    ]);
    // Alice→Bob: Bob 300000ms; Bob→Alice: Alice 60000ms; Alice→Carol: Carol 300000ms
    // Wait: Bob(300000), Alice(60000), Carol(300000) → sorted: Alice(60000), Bob(300000), Carol(300000)
    // fastest is Alice, not tie. Let me use a scenario where Alice doesn't participate.
    // Bob(0), Carol(300000), Bob(600000), Carol(900000)
    // valid: Bob(0), Carol(300000), Bob(600000), Carol(900000)
    // i=1: Bob→Carol: Carol 300000ms
    // i=2: Carol→Bob: Bob 300000ms
    // i=3: Bob→Carol: Carol 300000ms
    // Carol: [300000, 300000] avg=300000; Bob: [300000] avg=300000
    // tie at 300000ms → alphabetically Bob(B) before Carol(C)
    const tied = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Carol' }),
        mem('2026-06-10T10:10:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:15:00.000Z', { sender: 'Carol' }),
    ]);
    assert(tied.fastestResponder.sender === 'Bob',
        'tie at 300000ms: Bob (B) wins alphabetically over Carol (C)');

    // Alice and Bob both at 60000ms → Alice (A) wins
    const ab = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Carol' }),
        mem('2026-06-10T10:01:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:02:00.000Z', { sender: 'Carol' }),
        mem('2026-06-10T10:03:00.000Z', { sender: 'Bob' }),
    ]);
    // Carol→Alice: Alice 60000ms; Alice→Carol: Carol 60000ms; Carol→Bob: Bob 60000ms
    // Alice: [60000] avg=60000; Carol: [60000] avg=60000; Bob: [60000] avg=60000
    // tie: Alice(A) < Bob(B) < Carol(C) → Alice wins
    assert(ab.fastestResponder.sender === 'Alice',
        'three-way tie at 60000ms: Alice (A) wins alphabetically');

    // Aaron vs Bob → Aaron wins
    const aaron = KM.ResponseTimeAnalysis.compute([
        mem('2026-06-10T10:00:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Aaron' }),
        mem('2026-06-10T10:10:00.000Z', { sender: 'Bob' }),
        mem('2026-06-10T10:15:00.000Z', { sender: 'Aaron' }),
    ]);
    assert(aaron.fastestResponder.sender === 'Aaron',
        'tie: Aaron (Aa) wins alphabetically over Bob (B)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — no throw on malformed entries
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — no throw on malformed entries', function () {
    const KM = makeCtx();
    let threw = false;
    try {
        KM.ResponseTimeAnalysis.compute([null, undefined, 42, 'string', {}]);
    } catch (e) {
        threw = true;
    }
    assert(!threw,
        'compute does not throw on null/non-object/primitive entries');

    const r = KM.ResponseTimeAnalysis.compute([
        null,
        undefined,
        mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' }),
        mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' }),
    ]);
    assert(r.fastestResponder !== null,
        'valid entries counted correctly when mixed with null/undefined');

    let threw2 = false;
    try {
        KM.ResponseTimeAnalysis.compute([{ timestamp: { nested: 'object' }, sender: 'A', senderRole: 'contact' }]);
    } catch (e) {
        threw2 = true;
    }
    assert(!threw2,
        'compute does not throw when timestamp is a non-string object');

    const allBad = KM.ResponseTimeAnalysis.compute([null, undefined, 42, false]);
    assert(allBad.avgResponseTimeMs === 0 && allBad.fastestResponder === null,
        'all-bad-entry array returns zero-state without throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — semantic guards
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — semantic guards', function () {
    const KM = makeCtx();
    assert(Object.keys(KM.ResponseTimeAnalysis).length === 1 && 'compute' in KM.ResponseTimeAnalysis,
        'ResponseTimeAnalysis only exposes compute — no extra surface area');
    assert(typeof KM.ResponseTimeAnalysis.compute === 'function',
        'compute is a function (not a class or constructor)');
    assert(KM.ProductDraftState === undefined,
        'ProductDraftState not present in this module context');
    assert(KM.BOOK_PAGINATION_VERSION === undefined,
        'BOOK_PAGINATION_VERSION not present in this module context');
    assert(KM.BOOK_PARITY === undefined,
        'BOOK_PARITY not present in this module context');
    const m1 = mem('2026-06-10T10:00:00.000Z', { sender: 'Alice' });
    const m2 = mem('2026-06-10T10:05:00.000Z', { sender: 'Bob' });
    const r1 = KM.ResponseTimeAnalysis.compute([m1, m2]);
    const r2 = KM.ResponseTimeAnalysis.compute([m1, m2]);
    assert(r1 !== r2,
        'compute returns a new object each call for non-zero input (pure, no shared state)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
