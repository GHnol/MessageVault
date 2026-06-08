/**
 * Reaction Analysis engine tests.
 * Run with: node src/tests/reaction-analysis-tests.mjs
 */

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
    load(ctx, 'src/core/reaction-analysis.js');
    load(ctx, 'src/core/import-quality-report.js');
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

function react(reactor, emoji, label) {
    return { reactor: reactor, emoji: emoji, label: label === undefined ? null : label };
}

function mem(overrides) {
    return Object.assign({
        id:               'mem-test',
        sourcePlatformId: 'instagram-dm',
        sourceAdapterId:  'instagram-dm-json-v1',
        type:             'message',
        timestamp:        '2026-06-10T09:00:00.000Z',
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
    assert(typeof KM.ReactionAnalysis === 'object' && KM.ReactionAnalysis !== null,
        'KMEngine.ReactionAnalysis is an object');
    assert(typeof KM.ReactionAnalysis.compute === 'function',
        'compute is a function');
    const r = KM.ReactionAnalysis.compute([mem({ reactions: [react('Bob', '❤️')] })]);
    assert(typeof r === 'object' && r !== null,
        'compute returns a non-null object');
    assert(typeof r.totalReactions === 'number',
        'totalReactions is a number');
    assert(typeof r.messagesWithReactions === 'number',
        'messagesWithReactions is a number');
    assert(Array.isArray(r.topReactionEmojis),
        'topReactionEmojis is an array');
    assert('topReactor' in r,
        'result has topReactor key');
    assert('mostReactedToSender' in r,
        'result has mostReactedToSender key');
    const keys = Object.keys(r).sort().join(',');
    assert(keys === 'messagesWithReactions,mostReactedToSender,topReactionEmojis,topReactor,totalReactions',
        'result has exactly the contracted keys');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — empty / null / non-array zero-state
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — empty/null/non-array zero-state', function () {
    const KM = makeCtx();
    const expectZero = function (r, label) {
        assert(r.totalReactions === 0 &&
               r.messagesWithReactions === 0 &&
               Array.isArray(r.topReactionEmojis) && r.topReactionEmojis.length === 0 &&
               r.topReactor === null &&
               r.mostReactedToSender === null,
            label);
    };
    expectZero(KM.ReactionAnalysis.compute([]),        'compute([]) returns zero-state');
    expectZero(KM.ReactionAnalysis.compute(null),      'compute(null) returns zero-state');
    expectZero(KM.ReactionAnalysis.compute(undefined), 'compute(undefined) returns zero-state');
    expectZero(KM.ReactionAnalysis.compute('nope'),    'compute(string) returns zero-state');
    expectZero(KM.ReactionAnalysis.compute(42),        'compute(number) returns zero-state');
    expectZero(KM.ReactionAnalysis.compute({}),        'compute(object) returns zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — no-reactions zero-state (messages present, no reactions)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — no-reactions zero-state', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [] }),
        mem({ sender: 'Bob',   reactions: [] }),
        mem({ sender: 'Carol' })  // default reactions []
    ]);
    assert(r.totalReactions === 0 && r.messagesWithReactions === 0,
        'all-empty reactions → zero counts');
    assert(r.topReactionEmojis.length === 0 && r.topReactor === null && r.mostReactedToSender === null,
        'all-empty reactions → empty/null aggregates');

    const missing = KM.ReactionAnalysis.compute([
        mem({ reactions: undefined }),
        mem({ reactions: null })
    ]);
    assert(missing.totalReactions === 0 && missing.messagesWithReactions === 0,
        'missing/null reactions field → zero-state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — totalReactions counting
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — totalReactions', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('Bob', '❤️'), react('Carol', '😂')] }),
        mem({ sender: 'Bob',   reactions: [react('Alice', '❤️')] }),
        mem({ sender: 'Carol', reactions: [] })
    ]);
    assert(r.totalReactions === 3,
        'totalReactions counts every reaction entry across messages (3)');

    const single = KM.ReactionAnalysis.compute([mem({ reactions: [react('Bob', '👍')] })]);
    assert(single.totalReactions === 1,
        'single reaction → totalReactions 1');

    // valid object entry with null emoji and null reactor still counts toward total
    const nullFields = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react(null, null)] })
    ]);
    assert(nullFields.totalReactions === 1,
        'reaction object with null emoji + null reactor still counts toward totalReactions');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — messagesWithReactions counting
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — messagesWithReactions', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('Bob', '❤️'), react('Carol', '😂')] }),
        mem({ sender: 'Bob',   reactions: [react('Alice', '❤️')] }),
        mem({ sender: 'Carol', reactions: [] }),
        mem({ sender: 'Dave' })
    ]);
    assert(r.messagesWithReactions === 2,
        'messagesWithReactions counts messages with >=1 reaction (2), not reaction total');

    const none = KM.ReactionAnalysis.compute([mem({ reactions: [] }), mem({ reactions: [] })]);
    assert(none.messagesWithReactions === 0,
        'no reactions → messagesWithReactions 0');

    // a message whose reactions array contains only malformed entries counts 0
    const onlyMalformed = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [null, 42, 'x'] })
    ]);
    assert(onlyMalformed.messagesWithReactions === 0 && onlyMalformed.totalReactions === 0,
        'message with only malformed reaction entries contributes nothing');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — topReactionEmojis sorting / ranking / MAX_TOP / tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — topReactionEmojis', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('B', '❤️'), react('C', '❤️'), react('D', '😂')] }),
        mem({ sender: 'Bob',   reactions: [react('A', '😂'), react('E', '🔥')] })
    ]);
    assert(r.topReactionEmojis[0].emoji === '❤️' && r.topReactionEmojis[0].count === 2 && r.topReactionEmojis[0].rank === 1,
        'most frequent emoji ranked first with correct count');
    assert(r.topReactionEmojis[1].emoji === '😂' && r.topReactionEmojis[1].count === 2 && r.topReactionEmojis[1].rank === 2,
        'second emoji ranked second');
    assert(r.topReactionEmojis[2].emoji === '🔥' && r.topReactionEmojis[2].count === 1 && r.topReactionEmojis[2].rank === 3,
        'third emoji ranked third with rank field');

    // rank is sequential 1..n
    const ranks = r.topReactionEmojis.map(function (e) { return e.rank; }).join(',');
    assert(ranks === '1,2,3', 'ranks are sequential starting at 1');

    // tie-break: equal count sorts by emoji string asc — build a deterministic tie
    const tie = KM.ReactionAnalysis.compute([
        mem({ reactions: [react('X', 'b'), react('Y', 'a')] })
    ]);
    assert(tie.topReactionEmojis[0].emoji === 'a' && tie.topReactionEmojis[1].emoji === 'b',
        'count tie broken by emoji string ascending');

    // MAX_TOP = 5
    const many = KM.ReactionAnalysis.compute([
        mem({ reactions: [
            react('a', '1'), react('b', '2'), react('c', '3'),
            react('d', '4'), react('e', '5'), react('f', '6'), react('g', '7')
        ] })
    ]);
    assert(many.topReactionEmojis.length === 5,
        'topReactionEmojis capped at MAX_TOP = 5');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — topReactor accuracy / tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — topReactor', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('Bob', '❤️')] }),
        mem({ sender: 'Carol', reactions: [react('Bob', '😂'), react('Dave', '🔥')] }),
        mem({ sender: 'Eve',   reactions: [react('Bob', '👍')] })
    ]);
    assert(r.topReactor !== null && r.topReactor.reactor === 'Bob' && r.topReactor.count === 3,
        'top reactor is the reactor giving the most reactions');
    const keys = Object.keys(r.topReactor).sort().join(',');
    assert(keys === 'count,reactor', 'topReactor shape is { reactor, count }');

    // tie-break: equal count → reactor name ascending
    const tie = KM.ReactionAnalysis.compute([
        mem({ sender: 'X', reactions: [react('Zoe', '❤️'), react('Amy', '😂')] })
    ]);
    assert(tie.topReactor.reactor === 'Amy' && tie.topReactor.count === 1,
        'reactor count tie broken by name ascending');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — mostReactedToSender accuracy / tie-break
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — mostReactedToSender', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('Bob', '❤️'), react('Carol', '😂')] }),
        mem({ sender: 'Alice', reactions: [react('Dave', '🔥')] }),
        mem({ sender: 'Bob',   reactions: [react('Alice', '👍')] })
    ]);
    assert(r.mostReactedToSender !== null && r.mostReactedToSender.sender === 'Alice' && r.mostReactedToSender.count === 3,
        'sender whose messages received the most reactions');
    const keys = Object.keys(r.mostReactedToSender).sort().join(',');
    assert(keys === 'count,sender', 'mostReactedToSender shape is { sender, count }');

    // tie-break: equal count → sender name ascending
    const tie = KM.ReactionAnalysis.compute([
        mem({ sender: 'Zoe', reactions: [react('X', '❤️')] }),
        mem({ sender: 'Amy', reactions: [react('Y', '😂')] })
    ]);
    assert(tie.mostReactedToSender.sender === 'Amy' && tie.mostReactedToSender.count === 1,
        'sender count tie broken by name ascending');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — malformed reactions[] no-throw
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — malformed reactions[] no-throw', function () {
    const KM = makeCtx();
    let threw = false;
    let r;
    try {
        r = KM.ReactionAnalysis.compute([
            mem({ sender: 'Alice', reactions: 'notarray' }),
            mem({ sender: 'Bob',   reactions: [null, 42, 'x', { foo: 'bar' }, react('Carol', '❤️')] }),
            null, undefined, 42, false, 'str',
            { /* object missing fields */ },
            mem({ sender: 'Dave', reactions: [{}] })
        ]);
    } catch (e) {
        threw = true;
    }
    assert(!threw, 'malformed memories + reactions do not throw');
    assert(r.totalReactions === 3,
        'three valid reaction objects ({foo:bar}, {}, react Carol) counted — non-object entries skipped');
    assert(r.topReactor !== null && r.topReactor.reactor === 'Carol',
        'valid reactor extracted from mixed malformed array');

    // non-array reactions → ignored entirely
    const nonArray = KM.ReactionAnalysis.compute([mem({ sender: 'Alice', reactions: { reactor: 'Bob', emoji: '❤️' } })]);
    assert(nonArray.totalReactions === 0,
        'object (non-array) reactions field is ignored');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — null/empty emoji handling
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — null/empty emoji handling', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('Bob', null), react('Carol', ''), react('Dave', '   '), react('Eve', '❤️')] })
    ]);
    assert(r.totalReactions === 4,
        'all four reaction entries count toward totalReactions regardless of emoji');
    assert(r.topReactionEmojis.length === 1 && r.topReactionEmojis[0].emoji === '❤️',
        'only the non-empty emoji is tallied for topReactionEmojis');
    assert(r.topReactor.count === 1,
        'reactors with null/empty emoji still tally toward topReactor');

    const allNullEmoji = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react('Bob', null), react('Carol', undefined)] })
    ]);
    assert(allNullEmoji.totalReactions === 2 && allNullEmoji.topReactionEmojis.length === 0,
        'all-null-emoji reactions still count but produce no top emoji');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — null/empty reactor handling
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — null/empty reactor handling', function () {
    const KM = makeCtx();
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react(null, '❤️'), react('', '😂'), react('   ', '🔥'), react('Bob', '👍')] })
    ]);
    assert(r.totalReactions === 4,
        'all reactions count toward totalReactions regardless of reactor');
    assert(r.topReactor !== null && r.topReactor.reactor === 'Bob' && r.topReactor.count === 1,
        'only the non-empty reactor is tallied for topReactor');
    assert(r.topReactionEmojis.length === 4,
        'emoji still tallied even when reactor is null/empty');

    const allNullReactor = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice', reactions: [react(null, '❤️'), react('', '😂')] })
    ]);
    assert(allNullReactor.totalReactions === 2 && allNullReactor.topReactor === null,
        'all-null-reactor reactions count but produce no top reactor');
    assert(allNullReactor.mostReactedToSender !== null && allNullReactor.mostReactedToSender.sender === 'Alice',
        'mostReactedToSender still derived from message sender when reactor is null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — fixture behavior (mirrors fake-instagram-dm.json)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — fixture behavior', function () {
    const KM = makeCtx();
    // fake-instagram-dm.json: bob_jones_99 receives ❤️ (Alice Smith) and 😂 (Alice Smith).
    const r = KM.ReactionAnalysis.compute([
        mem({ sender: 'Alice Smith',  reactions: [] }),
        mem({ sender: 'bob_jones_99', reactions: [react('Alice Smith', '❤️')] }),
        mem({ sender: 'Alice Smith',  reactions: [], isAttachmentOnly: true, type: 'attachment-placeholder' }),
        mem({ sender: 'bob_jones_99', reactions: [] }),
        mem({ sender: 'Alice Smith',  reactions: [] }),
        mem({ sender: 'bob_jones_99', reactions: [react('Alice Smith', '😂')] })
    ]);
    assert(r.totalReactions === 2,
        'fixture: totalReactions === 2');
    assert(r.messagesWithReactions === 2,
        'fixture: messagesWithReactions === 2');
    assert(r.topReactor.reactor === 'Alice Smith' && r.topReactor.count === 2,
        'fixture: topReactor is Alice Smith (2)');
    assert(r.mostReactedToSender.sender === 'bob_jones_99' && r.mostReactedToSender.count === 2,
        'fixture: mostReactedToSender is bob_jones_99 (2)');
    assert(r.topReactionEmojis.length === 2,
        'fixture: two distinct emoji captured (❤️, 😂)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — ImportQualityReport preservation (regression)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — ImportQualityReport preservation', function () {
    const KM = makeCtx();
    const memories = [
        mem({ sender: 'Alice Smith',  reactions: [] }),
        mem({ sender: 'bob_jones_99', reactions: [react('Alice Smith', '❤️')] }),
        mem({ sender: 'bob_jones_99', reactions: [react('Alice Smith', '😂')] })
    ];
    const iqrBefore = KM.ImportQualityReport.compute(memories);
    KM.ReactionAnalysis.compute(memories);
    const iqrAfter = KM.ImportQualityReport.compute(memories);

    assert(iqrBefore.totalReactionCount === 2,
        'IQR totalReactionCount === 2 for reacted memories');
    assert(iqrBefore.messagesWithReactionsCount === 2,
        'IQR messagesWithReactionsCount === 2 for reacted memories');
    assert(iqrAfter.totalReactionCount === iqrBefore.totalReactionCount &&
           iqrAfter.messagesWithReactionsCount === iqrBefore.messagesWithReactionsCount,
        'ReactionAnalysis.compute does not alter ImportQualityReport reaction counts');
    assert(memories[1].reactions.length === 1 && memories[2].reactions.length === 1,
        'ReactionAnalysis.compute does not mutate memory.reactions arrays');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — semantic guards (pure, no DOM, no scope-guarded constants)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — semantic guards', function () {
    const KM = makeCtx();
    assert(Object.keys(KM.ReactionAnalysis).length === 1 && 'compute' in KM.ReactionAnalysis,
        'ReactionAnalysis only exposes compute — no extra surface area');
    assert(typeof KM.ReactionAnalysis.compute === 'function',
        'compute is a function (not a class or constructor)');
    assert(KM.ProductDraftState === undefined,
        'ProductDraftState not present in this module context');
    assert(KM.BOOK_PAGINATION_VERSION === undefined,
        'BOOK_PAGINATION_VERSION not present in this module context');
    assert(KM.BOOK_PRODUCTION_DEPS === undefined,
        'BOOK_PRODUCTION_DEPS not present in this module context');
    assert(KM.BOOK_PARITY === undefined,
        'BOOK_PARITY not present in this module context');

    const input = [mem({ sender: 'Alice', reactions: [react('Bob', '❤️')] })];
    const snapshot = JSON.stringify(input);
    const r1 = KM.ReactionAnalysis.compute(input);
    const r2 = KM.ReactionAnalysis.compute(input);
    assert(JSON.stringify(input) === snapshot,
        'compute does not mutate its input');
    assert(r1 !== r2,
        'compute returns a new object each call for non-zero input (pure, no shared state)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
