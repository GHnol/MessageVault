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
    load(ctx, 'src/core/content-quality-checks.js');
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
        timestamp:        '2023-03-15T10:00:00.000Z',
        sender:           'Alice',
        senderRole:       'contact',
        text:             'Hello',
        reactions:        [],
        media:            [],
        unsupported:      false,
        isAttachmentOnly: false
    }, overrides);
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.ContentQualityChecks === 'object' && KM.ContentQualityChecks !== null,
        'KMEngine.ContentQualityChecks is an object');
    assert(typeof KM.ContentQualityChecks.compute === 'function',
        'compute is a function');

    const r = KM.ContentQualityChecks.compute([mem()]);
    assert(Array.isArray(r), 'compute returns an array');

    const issue = r[0];
    if (issue) {
        assert(typeof issue.type     === 'string',  'issue.type is a string');
        assert(typeof issue.severity === 'string',  'issue.severity is a string');
        assert(typeof issue.count    === 'number',  'issue.count is a number');
        assert(Array.isArray(issue.examples),       'issue.examples is an array');
        assert(typeof issue.message  === 'string',  'issue.message is a string');
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — empty and invalid input
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — empty and invalid input', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const empty = compute([]);
    assert(Array.isArray(empty) && empty.length === 0, 'empty array → empty issues array');

    let threw = false;
    try { compute(null); } catch (e) { threw = true; }
    assert(!threw, 'compute(null) does not throw');

    threw = false;
    try { compute(undefined); } catch (e) { threw = true; }
    assert(!threw, 'compute(undefined) does not throw');

    threw = false;
    try { compute('bad'); } catch (e) { threw = true; }
    assert(!threw, 'compute("bad") does not throw');

    threw = false;
    try { compute(42); } catch (e) { threw = true; }
    assert(!threw, 'compute(42) does not throw');

    const r = compute(null);
    assert(Array.isArray(r) && r.length === 0, 'compute(null) returns empty array');

    const rStr = compute('bad');
    assert(Array.isArray(rStr) && rStr.length === 0, 'compute("bad") returns empty array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — clean corpus produces no issues
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — clean corpus produces no issues', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const clean = [
        mem({ sender: 'Alice',   text: 'Hello there' }),
        mem({ sender: 'Bob',     text: 'Hi, how are you?' }),
        mem({ sender: 'Alice',   text: 'Doing great thanks' }),
        mem({ sender: 'Bob',     text: 'Good to hear!' }),
        mem({ sender: 'Alice',   text: '[Attachment]', isAttachmentOnly: true, type: 'attachment-placeholder' })
    ];
    const r = compute(clean);
    assert(Array.isArray(r) && r.length === 0, 'clean corpus → 0 issues');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — PHONE_NUMBER_AS_SENDER_NAME
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — PHONE_NUMBER_AS_SENDER_NAME', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const r = compute([
        mem({ sender: '+14155551234', text: 'Hello' }),
        mem({ sender: 'Alice',        text: 'Hi' })
    ]);
    const issue = r.find(function (x) { return x.type === 'PHONE_NUMBER_AS_SENDER_NAME'; });
    assert(issue !== undefined,          'PHONE_NUMBER_AS_SENDER_NAME issue present');
    assert(issue.severity === 'WARN',    'severity is WARN');
    assert(issue.count === 1,            'count 1 (one phone-number sender)');
    assert(issue.examples.includes('+14155551234'), 'example includes the phone number');
    assert(typeof issue.message === 'string' && issue.message.length > 0, 'message is non-empty');

    // Multiple phone senders
    const multi = compute([
        mem({ sender: '+14155551234', text: 'A' }),
        mem({ sender: '+14155559999', text: 'B' }),
        mem({ sender: 'Alice',        text: 'C' })
    ]);
    const multiIssue = multi.find(function (x) { return x.type === 'PHONE_NUMBER_AS_SENDER_NAME'; });
    assert(multiIssue !== undefined,  'multiple phone senders → issue present');
    assert(multiIssue.count === 2,    'count 2 for two phone-number senders');

    // Same phone sender repeated — deduplicated
    const dedup = compute([
        mem({ sender: '+14155551234', text: 'A' }),
        mem({ sender: '+14155551234', text: 'B' })
    ]);
    const dedupIssue = dedup.find(function (x) { return x.type === 'PHONE_NUMBER_AS_SENDER_NAME'; });
    assert(dedupIssue.count === 1, 'same phone sender repeated → count 1 (deduplicated)');

    // No phone senders
    const none = compute([mem({ sender: 'Alice' }), mem({ sender: 'Bob' })]);
    const noneIssue = none.find(function (x) { return x.type === 'PHONE_NUMBER_AS_SENDER_NAME'; });
    assert(noneIssue === undefined, 'no phone senders → no PHONE_NUMBER_AS_SENDER_NAME issue');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — PHONE_NUMBER_AS_SENDER_NAME false positive edge cases
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — PHONE_NUMBER_AS_SENDER_NAME edge cases', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    function hasPhone(memories) {
        return compute(memories).some(function (x) { return x.type === 'PHONE_NUMBER_AS_SENDER_NAME'; });
    }

    // Clear phone numbers
    assert(hasPhone([mem({ sender: '+14155551234' })]),  '+1 country code number → phone');
    assert(hasPhone([mem({ sender: '555-123-4567' })]),  'dash-formatted number → phone');
    assert(hasPhone([mem({ sender: '(555) 123-4567' })]), 'parenthesis-formatted → phone');

    // Not phone numbers — names, single digits, short strings
    assert(!hasPhone([mem({ sender: 'Alice' })]),        '"Alice" not a phone number');
    assert(!hasPhone([mem({ sender: 'Me' })]),            '"Me" not a phone number');
    assert(!hasPhone([mem({ sender: '123' })]),           'too short (3 digits) → not phone');
    assert(!hasPhone([mem({ sender: '+1' })]),            '+1 alone → not phone (too short)');
    assert(!hasPhone([mem({ sender: 'Bob123' })]),        '"Bob123" is a name not phone (letters present)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — RAW_URL_IN_CONTENT
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — RAW_URL_IN_CONTENT', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const r = compute([
        mem({ text: 'Check out https://example.com/page' }),
        mem({ text: 'Hello there' })
    ]);
    const issue = r.find(function (x) { return x.type === 'RAW_URL_IN_CONTENT'; });
    assert(issue !== undefined,       'RAW_URL_IN_CONTENT issue present');
    assert(issue.severity === 'WARN', 'severity is WARN');
    assert(issue.count === 1,         'count 1');
    assert(issue.examples.length > 0, 'at least one example');
    assert(issue.examples[0].startsWith('https://'), 'example is the URL');

    // http also detected
    const http = compute([mem({ text: 'Go to http://example.com' })]);
    const httpIssue = http.find(function (x) { return x.type === 'RAW_URL_IN_CONTENT'; });
    assert(httpIssue !== undefined, 'http:// URL detected');

    // Multiple messages with URLs
    const multi = compute([
        mem({ text: 'https://a.com link' }),
        mem({ text: 'Hello' }),
        mem({ text: 'See https://b.com too' })
    ]);
    const multiIssue = multi.find(function (x) { return x.type === 'RAW_URL_IN_CONTENT'; });
    assert(multiIssue.count === 2, 'two URL messages → count 2');

    // No URLs
    const none = compute([mem({ text: 'Plain text here' })]);
    const noneIssue = none.find(function (x) { return x.type === 'RAW_URL_IN_CONTENT'; });
    assert(noneIssue === undefined, 'no URLs → no RAW_URL_IN_CONTENT issue');

    // examples capped at MAX_EXAMPLES (3)
    const many = compute([
        mem({ text: 'https://a.com' }),
        mem({ text: 'https://b.com' }),
        mem({ text: 'https://c.com' }),
        mem({ text: 'https://d.com' }),
        mem({ text: 'https://e.com' })
    ]);
    const manyIssue = many.find(function (x) { return x.type === 'RAW_URL_IN_CONTENT'; });
    assert(manyIssue.count === 5,            'count reflects all 5 URL messages');
    assert(manyIssue.examples.length <= 3,   'examples capped at 3');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — RAW_URL_IN_CONTENT edge cases
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — RAW_URL_IN_CONTENT edge cases', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    function hasUrl(memories) {
        return compute(memories).some(function (x) { return x.type === 'RAW_URL_IN_CONTENT'; });
    }

    // These should NOT match
    assert(!hasUrl([mem({ text: 'example.com without scheme' })]), 'bare domain without scheme not matched');
    assert(!hasUrl([mem({ text: 'ftp://file.example.com' })]),     'ftp:// not matched (not http/https)');
    assert(!hasUrl([mem({ text: '' }) ]),                           'empty text not matched');
    assert(!hasUrl([mem({ text: null }) ]),                         'null text not matched');

    // These should match
    assert(hasUrl([mem({ text: 'See https://a.com.' })]),          'URL followed by period still matched');
    assert(hasUrl([mem({ text: 'HTTPS://A.COM/PATH' }) ]),         'case-insensitive scheme matched');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — EMPTY_MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — EMPTY_MESSAGE', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const r = compute([
        mem({ text: '' }),
        mem({ text: 'Hello' })
    ]);
    const issue = r.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(issue !== undefined,       'EMPTY_MESSAGE issue present for empty text');
    assert(issue.severity === 'WARN', 'severity is WARN');
    assert(issue.count === 1,         'count 1');

    // Whitespace-only counts as empty
    const ws = compute([mem({ text: '   ' })]);
    const wsIssue = ws.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(wsIssue !== undefined && wsIssue.count === 1, 'whitespace-only text → EMPTY_MESSAGE');

    // null text counts as empty
    const nl = compute([mem({ text: null })]);
    const nlIssue = nl.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(nlIssue !== undefined && nlIssue.count === 1, 'null text → EMPTY_MESSAGE');

    // attachment-only messages excluded
    const attach = compute([mem({ text: '', isAttachmentOnly: true, type: 'attachment-placeholder' })]);
    const attachIssue = attach.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(attachIssue === undefined, 'attachment-only message excluded from EMPTY_MESSAGE');

    // type attachment-placeholder excluded even without isAttachmentOnly flag
    const placeholder = compute([mem({ text: '[Attachment]', type: 'attachment-placeholder', isAttachmentOnly: false })]);
    const placeholderIssue = placeholder.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(placeholderIssue === undefined, 'attachment-placeholder type excluded from EMPTY_MESSAGE');

    // No empty messages
    const none = compute([mem({ text: 'Hello' }), mem({ text: 'World' })]);
    const noneIssue = none.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(noneIssue === undefined, 'no empty messages → no EMPTY_MESSAGE issue');

    // examples include sender name
    const withSender = compute([mem({ sender: 'Alice', text: '' })]);
    const senderIssue = withSender.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(senderIssue.examples.includes('Alice'), 'example includes sender name');

    // examples capped at MAX_EXAMPLES (3)
    const many = compute([
        mem({ text: '' }), mem({ text: '' }), mem({ text: '' }),
        mem({ text: '' }), mem({ text: '' })
    ]);
    const manyIssue = many.find(function (x) { return x.type === 'EMPTY_MESSAGE'; });
    assert(manyIssue.count === 5,           'count reflects all 5 empty messages');
    assert(manyIssue.examples.length <= 3,  'examples capped at 3');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — DUPLICATE_MESSAGE (adjacent only)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — DUPLICATE_MESSAGE', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    // Adjacent duplicates from same sender
    const r = compute([
        mem({ sender: 'Alice', text: 'Hello there' }),
        mem({ sender: 'Alice', text: 'Hello there' }),
        mem({ sender: 'Bob',   text: 'Hi' })
    ]);
    const issue = r.find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(issue !== undefined,       'DUPLICATE_MESSAGE issue present for adjacent same-sender duplicates');
    assert(issue.severity === 'WARN', 'severity is WARN');
    assert(issue.count === 1,         'count 1 for one adjacent duplicate pair');
    assert(issue.examples.length > 0, 'at least one example');
    assert(issue.examples[0] === 'Hello there', 'example is the duplicated text');

    // Same text but different senders — not a duplicate
    const diffSender = compute([
        mem({ sender: 'Alice', text: 'Hello' }),
        mem({ sender: 'Bob',   text: 'Hello' })
    ]);
    const dsIssue = diffSender.find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(dsIssue === undefined, 'same text different senders → no DUPLICATE_MESSAGE');

    // Same text non-adjacent — not detected
    const nonAdjacent = compute([
        mem({ sender: 'Alice', text: 'Hello' }),
        mem({ sender: 'Alice', text: 'Something else' }),
        mem({ sender: 'Alice', text: 'Hello' })
    ]);
    const naIssue = nonAdjacent.find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(naIssue === undefined, 'same text non-adjacent → no DUPLICATE_MESSAGE (adjacent-only)');

    // No duplicates
    const none = compute([
        mem({ sender: 'Alice', text: 'A' }),
        mem({ sender: 'Alice', text: 'B' }),
        mem({ sender: 'Alice', text: 'C' })
    ]);
    const noneIssue = none.find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(noneIssue === undefined, 'no duplicates → no DUPLICATE_MESSAGE issue');

    // Multiple adjacent duplicate pairs
    const multi = compute([
        mem({ sender: 'Alice', text: 'Ha ha' }),
        mem({ sender: 'Alice', text: 'Ha ha' }),
        mem({ sender: 'Bob',   text: 'OK' }),
        mem({ sender: 'Bob',   text: 'OK' })
    ]);
    const multiIssue = multi.find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(multiIssue.count === 2, 'two adjacent duplicate pairs → count 2');

    // Empty text messages not considered duplicates
    const emptyDup = compute([
        mem({ sender: 'Alice', text: '' }),
        mem({ sender: 'Alice', text: '' })
    ]);
    const emptyDupIssue = emptyDup.find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(emptyDupIssue === undefined, 'empty text messages not counted as duplicates');

    // examples capped at MAX_EXAMPLES (3)
    const manyDup = [
        mem({ sender: 'A', text: 'same' }), mem({ sender: 'A', text: 'same' }),
        mem({ sender: 'A', text: 'dup2' }), mem({ sender: 'A', text: 'dup2' }),
        mem({ sender: 'A', text: 'dup3' }), mem({ sender: 'A', text: 'dup3' }),
        mem({ sender: 'A', text: 'dup4' }), mem({ sender: 'A', text: 'dup4' })
    ];
    const manyDupIssue = compute(manyDup).find(function (x) { return x.type === 'DUPLICATE_MESSAGE'; });
    assert(manyDupIssue.count === 4,            'count reflects all 4 duplicate pairs');
    assert(manyDupIssue.examples.length <= 3,   'examples capped at 3');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — SYSTEM_MESSAGE_IN_OUTPUT
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — SYSTEM_MESSAGE_IN_OUTPUT', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    // senderRole system
    const r = compute([
        mem({ senderRole: 'system', text: 'Group created' }),
        mem({ sender: 'Alice', text: 'Hello' })
    ]);
    const issue = r.find(function (x) { return x.type === 'SYSTEM_MESSAGE_IN_OUTPUT'; });
    assert(issue !== undefined,       'SYSTEM_MESSAGE_IN_OUTPUT present for senderRole:system');
    assert(issue.severity === 'WARN', 'severity is WARN');
    assert(issue.count === 1,         'count 1');

    // Well-known WhatsApp system text
    const waSystem = compute([
        mem({ text: 'Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.' })
    ]);
    const waIssue = waSystem.find(function (x) { return x.type === 'SYSTEM_MESSAGE_IN_OUTPUT'; });
    assert(waIssue !== undefined, 'WhatsApp E2E encryption notice detected as system message');

    // "This message was deleted"
    const deleted = compute([mem({ text: 'This message was deleted' })]);
    const delIssue = deleted.find(function (x) { return x.type === 'SYSTEM_MESSAGE_IN_OUTPUT'; });
    assert(delIssue !== undefined, '"This message was deleted" detected');

    // Normal messages not flagged
    const normal = compute([
        mem({ text: 'Hello world' }),
        mem({ text: 'See you later' })
    ]);
    const normalIssue = normal.find(function (x) { return x.type === 'SYSTEM_MESSAGE_IN_OUTPUT'; });
    assert(normalIssue === undefined, 'normal messages not flagged as system messages');

    // examples capped at MAX_EXAMPLES
    const manySys = [
        mem({ senderRole: 'system', text: 'S1' }),
        mem({ senderRole: 'system', text: 'S2' }),
        mem({ senderRole: 'system', text: 'S3' }),
        mem({ senderRole: 'system', text: 'S4' })
    ];
    const manySysIssue = compute(manySys).find(function (x) { return x.type === 'SYSTEM_MESSAGE_IN_OUTPUT'; });
    assert(manySysIssue.count === 4,           'count reflects all 4 system messages');
    assert(manySysIssue.examples.length <= 3,  'examples capped at 3');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — issue structure contract
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — issue structure contract', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const corpus = [
        mem({ sender: '+14155551234', text: 'Hi at https://example.com' }),
        mem({ sender: 'Alice',        text: '' }),
        mem({ sender: 'Alice',        text: 'Repeat' }),
        mem({ sender: 'Alice',        text: 'Repeat' }),
        mem({ senderRole: 'system',   text: 'System notice' })
    ];
    const issues = compute(corpus);
    assert(Array.isArray(issues), 'result is always an array');
    issues.forEach(function (issue, idx) {
        assert(typeof issue.type     === 'string',  'issue[' + idx + '].type is string');
        assert(issue.severity        === 'WARN',    'issue[' + idx + '].severity is WARN');
        assert(typeof issue.count    === 'number' && issue.count > 0, 'issue[' + idx + '].count is positive number');
        assert(Array.isArray(issue.examples),       'issue[' + idx + '].examples is array');
        assert(typeof issue.message  === 'string' && issue.message.length > 0, 'issue[' + idx + '].message is non-empty string');
        assert(issue.examples.length <= 3,          'issue[' + idx + '].examples capped at 3');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — malformed entries in memories array
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — malformed entries in memories array', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    let threw = false;
    try {
        compute([null, undefined, 42, 'string', mem({ text: 'Good' })]);
    } catch (e) { threw = true; }
    assert(!threw, 'malformed entries in array do not throw');

    const r = compute([null, undefined, mem({ sender: '+14155551234', text: 'A' })]);
    const issue = r.find(function (x) { return x.type === 'PHONE_NUMBER_AS_SENDER_NAME'; });
    assert(issue !== undefined, 'valid entry processed even when array has malformed entries');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — known check types
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — known check types', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const corpus = [
        mem({ sender: '+14155551234', text: 'See https://example.com/p' }),
        mem({ sender: 'Alice',        text: '' }),
        mem({ sender: 'Alice',        text: 'Dup' }),
        mem({ sender: 'Alice',        text: 'Dup' }),
        mem({ senderRole: 'system',   text: 'This message was deleted' })
    ];
    const issues = compute(corpus);
    const types = issues.map(function (x) { return x.type; });

    assert(types.includes('PHONE_NUMBER_AS_SENDER_NAME'), 'PHONE_NUMBER_AS_SENDER_NAME in output');
    assert(types.includes('RAW_URL_IN_CONTENT'),          'RAW_URL_IN_CONTENT in output');
    assert(types.includes('EMPTY_MESSAGE'),               'EMPTY_MESSAGE in output');
    assert(types.includes('DUPLICATE_MESSAGE'),           'DUPLICATE_MESSAGE in output');
    assert(types.includes('SYSTEM_MESSAGE_IN_OUTPUT'),    'SYSTEM_MESSAGE_IN_OUTPUT in output');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — all severities are WARN
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — all severities are WARN', function () {
    const KM = makeCtx();
    const compute = KM.ContentQualityChecks.compute;

    const corpus = [
        mem({ sender: '+14155551234', text: 'https://example.com' }),
        mem({ sender: 'Alice',        text: '' }),
        mem({ sender: 'Alice',        text: 'X' }),
        mem({ sender: 'Alice',        text: 'X' }),
        mem({ senderRole: 'system',   text: 'This message was deleted' })
    ];
    const issues = compute(corpus);
    assert(issues.length > 0, 'corpus produces at least one issue');
    issues.forEach(function (issue) {
        assert(issue.severity === 'WARN', 'severity is WARN for: ' + issue.type);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — semantic guard: no vendor/manufacturing/product-preflight fields
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — semantic guard: no vendor/product fields', function () {
    const KM = makeCtx();
    const issues = KM.ContentQualityChecks.compute([mem()]);

    assert(issues.proofReady         === undefined, 'no proofReady on result');
    assert(issues.manufacturingReady === undefined, 'no manufacturingReady on result');
    assert(issues.commerceReady      === undefined, 'no commerceReady on result');
    assert(issues.estimatedPages     === undefined, 'no estimatedPages on result');
    assert(issues.vendorReady        === undefined, 'no vendorReady on result');
    assert(issues.checkoutReady      === undefined, 'no checkoutReady on result');

    const src = readFileSync(
        join(__dirname, '../../src/core/content-quality-checks.js'), 'utf8'
    );
    assert(!src.includes('proof-ready'),        'no "proof-ready" in implementation');
    assert(!src.includes('estimatedPages'),      'no "estimatedPages" in implementation');
    assert(!src.includes('manufacturingReady'),  'no "manufacturingReady" in implementation');
    assert(!src.includes('checkoutReady'),       'no "checkoutReady" in implementation');
    assert(!src.includes('vendorReady'),         'no "vendorReady" in implementation');
    assert(!src.includes('product-preflight'),   'no "product-preflight" in implementation');
    assert(!src.includes('import-quality-report'), 'no import from import-quality-report');
    assert(!src.includes('src/products'),        'no src/products reference');
    assert(!src.includes('src/state'),           'no src/state reference');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
