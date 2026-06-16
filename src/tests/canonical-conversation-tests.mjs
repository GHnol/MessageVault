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
    load(ctx, 'src/core/canonical-conversation.js');
    load(ctx, 'src/core/import-adapter-contract.js');
    return ctx.window.KMEngine;
}

const KMEngine  = makeCtx();
const CC        = KMEngine.CanonicalConversation;
const Contract  = KMEngine.ImportAdapterContract;

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

// Build a fully valid Conversation from the builders (used by several suites).
function buildValidConversation() {
    const me   = CC.createParticipant({ displayName: 'You', handle: '+15550001', isSelf: true });
    const alex = CC.createParticipant({ displayName: 'Alex', handle: '+15550002', isSelf: false });
    const m1 = CC.createMessage({ conversationId: 'cnv-x', participantId: alex.id, timestamp: '2024-06-01T09:00:00.000Z', text: 'Morning', importIndex: 0 });
    const m2 = CC.createMessage({ conversationId: 'cnv-x', participantId: me.id,   timestamp: '2024-06-01T09:01:00.000Z', text: 'Hey',     importIndex: 1 });
    const m3 = CC.createMessage({
        conversationId: 'cnv-x', participantId: alex.id, timestamp: '2024-06-01T09:02:00.000Z', importIndex: 2,
        type: 'media', media: [CC.createMediaAttachment({ kind: 'image', filename: 'IMG-1.jpg', present: true })]
    });
    return CC.createConversation({
        platform:     'whatsapp',
        exportVariant:'ios',
        isGroup:      false,
        title:        'Alex',
        participants: [me, alex],
        messages:     [m1, m2, m3],
        systemEvents: [CC.createSystemEvent({ kind: 'encryption-notice', timestamp: '2024-06-01T08:59:00.000Z', text: 'E2E encrypted' })],
        source:       CC.createSourceMetadata({ platform: 'whatsapp', exportVariant: 'ios', adapterId: 'whatsapp-ios-v1' }),
        diagnostics:  CC.createImportDiagnostics({ counts: { total: 3, imported: 3 }, selfIdentified: true })
    });
}

// ─── Suite 1 — Namespace / API shape ─────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    assert(CC !== undefined && CC !== null,                        'CanonicalConversation namespace exists');
    assert(Contract !== undefined && Contract !== null,            'ImportAdapterContract namespace exists');
    ['createParticipant','createMediaAttachment','createReaction','createReply','createMessage',
     'createSystemEvent','createSourceMetadata','createImportDiagnostics','createConversation','groupMessages','hash']
        .forEach(function (fn) { assert(typeof CC[fn] === 'function', 'CC.' + fn + ' is a function'); });
    assert(Array.isArray(CC.MEDIA_KINDS) && CC.MEDIA_KINDS.length > 0,        'MEDIA_KINDS exposed');
    assert(Array.isArray(CC.MESSAGE_TYPES) && CC.MESSAGE_TYPES.length > 0,    'MESSAGE_TYPES exposed');
    assert(Array.isArray(CC.SYSTEM_EVENT_KINDS) && CC.SYSTEM_EVENT_KINDS.length > 0, 'SYSTEM_EVENT_KINDS exposed');
    assert(typeof Contract.validateConversation === 'function',   'Contract.validateConversation is a function');
    assert(typeof Contract.validateAdapter === 'function',        'Contract.validateAdapter is a function');
});

// ─── Suite 2 — createParticipant ─────────────────────────────────────────────
suite('Suite 2 — createParticipant', function () {
    const p = CC.createParticipant({ displayName: 'Alex', handle: '+15550002' });
    assert(typeof p.id === 'string' && p.id.indexOf('par-') === 0, 'participant id is a par- string');
    assert(p.displayName === 'Alex',                'displayName preserved');
    assert(p.handle === '+15550002',                'handle preserved');
    assert(p.isSelf === false,                      'isSelf defaults false');
    assert(Array.isArray(p.aliases) && p.aliases.length === 0, 'aliases defaults to empty array');
    assert(p.messageCount === 0,                    'messageCount defaults to 0');
    const self = CC.createParticipant({ displayName: 'You', isSelf: true });
    assert(self.isSelf === true,                    'isSelf honored when true');
    const explicit = CC.createParticipant({ id: 'par-custom', displayName: 'X' });
    assert(explicit.id === 'par-custom',            'explicit id honored');
    const empty = CC.createParticipant();
    assert(empty.displayName === null && empty.handle === null, 'no-arg participant has null name/handle');
});

// ─── Suite 3 — createMessage ─────────────────────────────────────────────────
suite('Suite 3 — createMessage', function () {
    const m = CC.createMessage({ participantId: 'par-1', timestamp: '2024-06-01T09:00:00.000Z', text: 'Hi', importIndex: 0 });
    assert(typeof m.id === 'string' && m.id.indexOf('msg-') === 0, 'message id is a msg- string');
    assert(m.participantId === 'par-1',             'participantId preserved');
    assert(m.type === 'text',                       'type defaults to text');
    assert(Array.isArray(m.media) && m.media.length === 0,        'media defaults to empty array');
    assert(Array.isArray(m.reactions) && m.reactions.length === 0,'reactions defaults to empty array');
    assert(m.replyTo === null,                      'replyTo defaults to null');
    assert(m.isEdited === false && m.isDeleted === false,        'isEdited/isDeleted default false');
    assert(m.importIndex === 0,                     'importIndex preserved');
    const bad = CC.createMessage({ participantId: 'par-1', type: 'totally-invalid' });
    assert(bad.type === 'text',                     'invalid type coerced to text');
    const mediaMsg = CC.createMessage({ participantId: 'par-1', type: 'media' });
    assert(mediaMsg.type === 'media',               'valid non-default type honored');
    const noPid = CC.createMessage({ timestamp: '2024-06-01T09:00:00.000Z' });
    assert(noPid.participantId === null,            'missing participantId is null (lenient builder)');
});

// ─── Suite 4 — createMediaAttachment ─────────────────────────────────────────
suite('Suite 4 — createMediaAttachment', function () {
    const a = CC.createMediaAttachment({ kind: 'image', filename: 'IMG-1.jpg', mimeType: 'image/jpeg', byteSize: 1234, present: true });
    assert(typeof a.id === 'string' && a.id.indexOf('med-') === 0, 'media id is a med- string');
    assert(a.kind === 'image',                      'kind preserved when valid');
    assert(a.filename === 'IMG-1.jpg',              'filename preserved');
    assert(a.byteSize === 1234,                     'byteSize numeric preserved');
    assert(a.present === true,                      'present true preserved');
    const omitted = CC.createMediaAttachment({ kind: 'audio', present: false, placeholderReason: 'omitted' });
    assert(omitted.present === false,               'present false preserved');
    assert(omitted.placeholderReason === 'omitted', 'placeholderReason preserved');
    const unknown = CC.createMediaAttachment({ kind: 'not-a-kind' });
    assert(unknown.kind === 'document',             'invalid kind coerced to document');
    const noPresent = CC.createMediaAttachment({ kind: 'image' });
    assert(noPresent.present === null,              'present defaults to null (tri-state unknown)');
    assert(noPresent.byteSize === null,             'byteSize defaults to null');
});

// ─── Suite 5 — createReaction ────────────────────────────────────────────────
suite('Suite 5 — createReaction', function () {
    const r = CC.createReaction({ reactor: 'par-1', emoji: '❤️', label: 'love' });
    assert(r.reactor === 'par-1' && r.emoji === '❤️' && r.label === 'love', 'reaction fields preserved');
    const empty = CC.createReaction();
    assert(empty.reactor === null && empty.emoji === null && empty.label === null, 'empty reaction is all null');
});

// ─── Suite 6 — createReply ───────────────────────────────────────────────────
suite('Suite 6 — createReply', function () {
    const withQuote = CC.createReply({ quotedMessageId: 'msg-9', quotedText: 'earlier' });
    assert(withQuote.available === true,            'available derived true when quote present');
    const none = CC.createReply({});
    assert(none.available === false,                'available derived false when no quote');
    const forced = CC.createReply({ available: true });
    assert(forced.available === true,               'explicit available honored');
});

// ─── Suite 7 — createSystemEvent ─────────────────────────────────────────────
suite('Suite 7 — createSystemEvent', function () {
    const s = CC.createSystemEvent({ kind: 'add-participant', timestamp: '2024-06-01T09:00:00.000Z', text: 'You added Alex', actors: ['par-1'] });
    assert(typeof s.id === 'string' && s.id.indexOf('sys-') === 0, 'system event id is a sys- string');
    assert(s.kind === 'add-participant',            'kind preserved when valid');
    assert(Array.isArray(s.actors) && s.actors.length === 1, 'actors preserved');
    const bad = CC.createSystemEvent({ kind: 'made-up-kind' });
    assert(bad.kind === 'unknown',                  'invalid kind coerced to unknown');
    const empty = CC.createSystemEvent();
    assert(Array.isArray(empty.actors) && empty.actors.length === 0, 'actors defaults to empty array');
});

// ─── Suite 8 — createSourceMetadata ──────────────────────────────────────────
suite('Suite 8 — createSourceMetadata', function () {
    const s = CC.createSourceMetadata({ platform: 'whatsapp', exportVariant: 'ios', detectedDateFormat: 'D/M/YY', adapterVersion: '1' });
    assert(s.platform === 'whatsapp',               'platform preserved');
    assert(s.exportVariant === 'ios',               'exportVariant preserved');
    assert(s.detectedDateFormat === 'D/M/YY',       'detectedDateFormat preserved');
    assert(s.adapterVersion === '1',                'adapterVersion preserved');
    assert(s.fileHash === null && s.importedAt === null, 'unset fields default to null');
});

// ─── Suite 9 — createImportDiagnostics ───────────────────────────────────────
suite('Suite 9 — createImportDiagnostics', function () {
    const d = CC.createImportDiagnostics({});
    assert(d.counts.total === 0 && d.counts.imported === 0 && d.counts.skipped === 0, 'counts default to 0');
    assert(d.counts.system === 0 && d.counts.media === 0 && d.counts.deleted === 0 && d.counts.unparsed === 0, 'all count buckets default 0');
    assert(Array.isArray(d.skipReasons) && Array.isArray(d.unparsedLines) && Array.isArray(d.ambiguousDates) && Array.isArray(d.mediaMissing) && Array.isArray(d.warnings), 'list fields default to arrays');
    assert(d.selfIdentified === false,              'selfIdentified defaults false');
    assert(d.formatConfidence === null,             'formatConfidence defaults null');
    const d2 = CC.createImportDiagnostics({ counts: { total: 9, imported: 8, skipped: 1 }, selfIdentified: true });
    assert(d2.counts.total === 9 && d2.counts.imported === 8 && d2.counts.skipped === 1, 'provided counts preserved');
    assert(d2.selfIdentified === true,              'provided selfIdentified preserved');
});

// ─── Suite 10 — createConversation ───────────────────────────────────────────
suite('Suite 10 — createConversation', function () {
    const conv = buildValidConversation();
    assert(typeof conv.id === 'string' && conv.id.indexOf('cnv-') === 0, 'conversation id is a cnv- string');
    assert(conv.platform === 'whatsapp',            'platform preserved');
    assert(conv.isGroup === false,                  'isGroup honored (explicit false)');
    assert(conv.participants.length === 2,          'participants preserved');
    assert(conv.messages.length === 3,              'messages preserved');
    assert(conv.systemEvents.length === 1,          'systemEvents preserved');
    assert(conv.dateRange.first === '2024-06-01T09:00:00.000Z', 'dateRange.first derived from earliest message');
    assert(conv.dateRange.last  === '2024-06-01T09:02:00.000Z', 'dateRange.last derived from latest message');
    const auto = CC.createConversation({ platform: 'whatsapp', participants: [
        CC.createParticipant({ displayName: 'You', isSelf: true }),
        CC.createParticipant({ displayName: 'A' }),
        CC.createParticipant({ displayName: 'B' })
    ] });
    assert(auto.isGroup === true,                   'isGroup auto-derives true for >1 non-self participant');
    const empty = CC.createConversation({ platform: 'whatsapp' });
    assert(empty.dateRange.first === null && empty.dateRange.last === null, 'empty conversation dateRange is null/null');
});

// ─── Suite 11 — groupMessages ────────────────────────────────────────────────
suite('Suite 11 — groupMessages', function () {
    const msgs = [
        CC.createMessage({ participantId: 'a', timestamp: '2024-06-01T09:00:00.000Z', importIndex: 0 }),
        CC.createMessage({ participantId: 'a', timestamp: '2024-06-01T09:01:00.000Z', importIndex: 1 }),
        CC.createMessage({ participantId: 'b', timestamp: '2024-06-01T09:02:00.000Z', importIndex: 2 }),
        CC.createMessage({ participantId: 'a', timestamp: '2024-06-01T09:03:00.000Z', importIndex: 3 })
    ];
    const groups = CC.groupMessages(msgs);
    assert(groups.length === 3,                     'three consecutive-speaker groups');
    assert(groups[0].participantId === 'a' && groups[0].messages.length === 2, 'first group is a×2');
    assert(groups[1].participantId === 'b' && groups[1].messages.length === 1, 'second group is b×1');
    assert(groups[2].participantId === 'a' && groups[2].messages.length === 1, 'third group is a×1');
    assert(groups[0].startTs === '2024-06-01T09:00:00.000Z' && groups[0].endTs === '2024-06-01T09:01:00.000Z', 'group startTs/endTs span its messages');
    assert(CC.groupMessages([]).length === 0,       'empty input yields no groups');
});

// ─── Suite 12 — Deterministic IDs ────────────────────────────────────────────
suite('Suite 12 — Deterministic IDs', function () {
    const a1 = CC.createParticipant({ displayName: 'Alex', handle: '+15550002' });
    const a2 = CC.createParticipant({ displayName: 'Alex', handle: '+15550002' });
    assert(a1.id === a2.id,                          'same participant inputs → same id');
    const b = CC.createParticipant({ displayName: 'Bob', handle: '+15550003' });
    assert(a1.id !== b.id,                           'different participant inputs → different id');
    const m1 = CC.createMessage({ conversationId: 'c', participantId: 'p', timestamp: 't', text: 'Hi', importIndex: 5 });
    const m2 = CC.createMessage({ conversationId: 'c', participantId: 'p', timestamp: 't', text: 'Hi', importIndex: 5 });
    assert(m1.id === m2.id,                          'same message inputs → same id');
    const m3 = CC.createMessage({ conversationId: 'c', participantId: 'p', timestamp: 't', text: 'Hi', importIndex: 6 });
    assert(m1.id !== m3.id,                          'importIndex disambiguates otherwise-identical messages');
    assert(CC.hash('abc') === CC.hash('abc'),        'hash is deterministic');
    assert(CC.hash('abc') !== CC.hash('abd'),        'hash differs for different input');
});

// ─── Suite 13 — validateConversation: valid + top-level required ─────────────
suite('Suite 13 — validateConversation valid / required', function () {
    const conv = buildValidConversation();
    const res = Contract.validateConversation(conv);
    assert(res.valid === true,                       'fully-built conversation is valid');
    assert(Array.isArray(res.errors) && res.errors.length === 0, 'no errors for valid conversation');
    assert(Contract.validateConversation(null).valid === false,  'null conversation is invalid');
    assert(Contract.validateConversation({}).valid === false,    'empty object is invalid');
    const noPlatform = CC.createConversation({ participants: [], messages: [], source: CC.createSourceMetadata({ platform: 'x' }), diagnostics: CC.createImportDiagnostics({}) });
    noPlatform.platform = '';
    const r2 = Contract.validateConversation(noPlatform);
    assert(r2.valid === false && r2.errors.some(function (e) { return e.path === 'platform'; }), 'missing platform flagged');
});

// ─── Suite 14 — validateConversation: participant/message linkage ────────────
suite('Suite 14 — participant/message linkage', function () {
    const me = CC.createParticipant({ displayName: 'You', isSelf: true });
    const orphan = CC.createMessage({ participantId: 'par-ghost', timestamp: '2024-06-01T09:00:00.000Z', importIndex: 0 });
    const conv = CC.createConversation({
        platform: 'whatsapp', participants: [me], messages: [orphan],
        source: CC.createSourceMetadata({ platform: 'whatsapp' }), diagnostics: CC.createImportDiagnostics({})
    });
    const res = Contract.validateConversation(conv);
    assert(res.valid === false,                      'message referencing unknown participant is invalid');
    assert(res.errors.some(function (e) { return e.code === 'UNKNOWN_PARTICIPANT'; }), 'UNKNOWN_PARTICIPANT error reported');
    const noPid = CC.createMessage({ timestamp: '2024-06-01T09:00:00.000Z', importIndex: 0 });
    const conv2 = CC.createConversation({
        platform: 'whatsapp', participants: [me], messages: [noPid],
        source: CC.createSourceMetadata({ platform: 'whatsapp' }), diagnostics: CC.createImportDiagnostics({})
    });
    assert(Contract.validateConversation(conv2).errors.some(function (e) { return e.code === 'MISSING_PARTICIPANT'; }), 'MISSING_PARTICIPANT error reported');
});

// ─── Suite 15 — validateConversation: media / system / source / diagnostics ──
suite('Suite 15 — nested shape validation', function () {
    const me = CC.createParticipant({ displayName: 'You', isSelf: true });
    const badMediaMsg = CC.createMessage({ participantId: me.id, type: 'media', timestamp: '2024-06-01T09:00:00.000Z', importIndex: 0 });
    badMediaMsg.media = [{ id: 'med-1', kind: 'hologram' }];
    const conv = CC.createConversation({
        platform: 'whatsapp', participants: [me], messages: [badMediaMsg],
        systemEvents: [{ id: 'sys-1', kind: 'warp-drive', actors: [] }],
        source: CC.createSourceMetadata({ platform: 'whatsapp' }), diagnostics: CC.createImportDiagnostics({})
    });
    const res = Contract.validateConversation(conv);
    assert(res.errors.some(function (e) { return e.code === 'BAD_ENUM' && e.path.indexOf('media') !== -1; }), 'invalid media.kind flagged');
    assert(res.errors.some(function (e) { return e.code === 'BAD_ENUM' && e.path.indexOf('systemEvents') !== -1; }), 'invalid systemEvent.kind flagged');
    const noSource = CC.createConversation({ platform: 'whatsapp', participants: [me], messages: [], diagnostics: CC.createImportDiagnostics({}) });
    assert(Contract.validateConversation(noSource).errors.some(function (e) { return e.path === 'source'; }), 'missing source flagged');
    const noDiag = CC.createConversation({ platform: 'whatsapp', participants: [me], messages: [], source: CC.createSourceMetadata({ platform: 'whatsapp' }) });
    assert(Contract.validateConversation(noDiag).errors.some(function (e) { return e.path === 'diagnostics'; }), 'missing diagnostics flagged');
});

// ─── Suite 16 — Semantic guard (no commerce/readiness fields) ────────────────
suite('Suite 16 — semantic guard', function () {
    const conv = buildValidConversation();
    assert(conv.proofReady === undefined && conv.checkoutReady === undefined && conv.vendor === undefined, 'builder emits no commerce/readiness fields on conversation');
    assert(conv.messages[0].order === undefined && conv.messages[0].price === undefined, 'builder emits no commerce fields on message');
    const tainted = buildValidConversation();
    tainted.proofReady = true;
    assert(Contract.validateConversation(tainted).errors.some(function (e) { return e.code === 'FORBIDDEN_FIELD'; }), 'forbidden field on conversation flagged');
    const taintedMsg = buildValidConversation();
    taintedMsg.messages[0].manufacturingReady = true;
    assert(Contract.validateConversation(taintedMsg).errors.some(function (e) { return e.code === 'FORBIDDEN_FIELD' && e.path.indexOf('messages') !== -1; }), 'forbidden field on message flagged');
});

// ─── Suite 17 — validateAdapter (adapter interface contract) ─────────────────
suite('Suite 17 — validateAdapter', function () {
    const good = { id: 'whatsapp-ios-v1', sourcePlatformId: 'whatsapp', canHandle: function () {}, import: function () {} };
    assert(Contract.validateAdapter(good).valid === true, 'well-formed adapter satisfies the contract');
    const noImport = { id: 'x', sourcePlatformId: 'whatsapp', canHandle: function () {} };
    const r1 = Contract.validateAdapter(noImport);
    assert(r1.valid === false && r1.errors.some(function (e) { return e.code === 'MISSING_METHOD'; }), 'missing import() flagged');
    const noId = { sourcePlatformId: 'whatsapp', canHandle: function () {}, import: function () {} };
    assert(Contract.validateAdapter(noId).errors.some(function (e) { return e.code === 'MISSING_PROP'; }), 'missing id flagged');
    assert(Contract.validateAdapter(null).valid === false, 'null adapter is invalid');
    assert(Contract.validateAdapter(42).valid === false,   'non-object adapter is invalid');
});

// ─── Suite 18 — Immutability of inputs (builders copy arrays via defaults) ────
suite('Suite 18 — input safety', function () {
    const aliases = ['Old Name'];
    const p = CC.createParticipant({ displayName: 'Alex', aliases: aliases });
    assert(p.aliases === aliases,                   'aliases reference passed through (documented: builders do not deep-clone)');
    const conv = buildValidConversation();
    const res = Contract.validateConversation(conv);
    assert(res.errors.length === 0,                 'validation does not mutate a valid conversation into an invalid one');
    const res2 = Contract.validateConversation(conv);
    assert(res2.valid === true,                     'validation is repeatable / side-effect free');
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
