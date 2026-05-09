/**
 * ProductEligibility and LegacyKeepsakeTypesBridge tests.
 * Run with: node src/tests/product-eligibility-tests.mjs
 */

import { readFileSync }              from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath }             from 'node:url';
import { dirname, join }             from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

const ctx = createContext({ window: {}, console });

function load(rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    try {
        runInContext(code, ctx);
    } catch (e) {
        console.error('Failed to load ' + rel + ':', e.message);
        process.exit(1);
    }
}

load('src/products/product-statuses.js');
load('src/products/product-catalog.js');
load('src/products/product-eligibility.js');
load('src/products/legacy-keepsake-types-bridge.js');

const { KMEngine } = ctx.window;
const PE   = KMEngine.ProductEligibility;
const Brdg = KMEngine.LegacyKeepsakeTypesBridge;

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }
function assert(cond, label) {
    if (cond) { console.log('  PASS  ' + label); passed++; }
    else       { console.error('  FAIL  ' + label); failed++; }
}

// helpers
function makeGroup(msgs) { return { messages: msgs || [], messageIndices: [] }; }
function msg(text, sender, opts) {
    return Object.assign({ text: text || '', sender: sender || 'Me', reactions: [] }, opts || {});
}

// ── result shape ──────────────────────────────────────────────────────────────

suite('ProductEligibility — result shape');
{
    const r = PE.evaluate(makeGroup([msg('hello')]), 'message-book');
    assert('productId'          in r, 'result has productId');
    assert('eligible'           in r, 'result has eligible');
    assert('score'              in r, 'result has score');
    assert('blockers'           in r, 'result has blockers');
    assert('warnings'           in r, 'result has warnings');
    assert('suggestions'        in r, 'result has suggestions');
    assert('requiredContent'    in r, 'result has requiredContent');
    assert('supportedContent'   in r, 'result has supportedContent');
    assert('unsupportedContent' in r, 'result has unsupportedContent');
    assert('readinessNotes'     in r, 'result has readinessNotes');
}

// ── empty group blocker ────────────────────────────────────────────────────────

suite('ProductEligibility — empty group returns blocker for all products');
{
    const emptyGroup = makeGroup([]);
    for (const id of ['message-book', 'journal', 'mug', 'sticker-pack', 'wall-art', 'gift-wrap']) {
        const r = PE.evaluate(emptyGroup, id);
        assert(r.eligible === false,      id + ': not eligible');
        assert(r.blockers.length > 0,     id + ': has blocker');
    }
}

// ── Message Book ──────────────────────────────────────────────────────────────

suite('ProductEligibility — Message Book');
{
    const textGroup = makeGroup([
        msg('Hello', 'Me'),
        msg('Hi there', 'Alice'),
        msg('How are you?', 'Me'),
        msg('I am fine', 'Alice'),
        msg('Great to hear', 'Me')
    ]);
    const r = PE.evaluate(textGroup, 'message-book');
    assert(r.eligible === true,          'eligible with text messages');
    assert(r.score > 0,                  'score is positive');
    assert(r.blockers.length === 0,      'no blockers');
    assert(r.readinessNotes.length > 0,  'readinessNotes present');
    assert(r.readinessNotes[0].includes('flagship'), 'readinessNotes mentions flagship');

    const attachGroup = makeGroup([msg('[Attachment]', 'Me', { isAttachmentOnly: true })]);
    const ra = PE.evaluate(attachGroup, 'message-book');
    assert(ra.eligible === false, 'attachment-only group is not eligible');
    assert(ra.blockers.length > 0, 'attachment-only group has blocker');
}

suite('ProductEligibility — Message Book attachment warning');
{
    const mixed = makeGroup([
        msg('Hi', 'Me'),
        msg('[Attachment]', 'Alice', { isAttachmentOnly: true }),
        msg('Bye', 'Me')
    ]);
    const r = PE.evaluate(mixed, 'message-book');
    assert(r.eligible === true,        'eligible when text + attachments mixed');
    assert(r.warnings.length > 0,      'warning about attachment-only messages');
    assert(r.unsupportedContent.length > 0, 'unsupportedContent lists attachments');
}

// ── Mug ───────────────────────────────────────────────────────────────────────

suite('ProductEligibility — Mug: long message is a blocker or warning');
{
    const longGroup = makeGroup([
        msg('This is a very long message that would never fit on a mug surface because it has too many characters', 'Me')
    ]);
    const r = PE.evaluate(longGroup, 'mug');
    assert(r.eligible === false,     'long message group not eligible for mug');
    assert(r.blockers.length > 0,    'blocker produced for too much text');
}

suite('ProductEligibility — Mug: short message is eligible');
{
    const shortGroup = makeGroup([msg('Miss you!', 'Me')]);
    const r = PE.evaluate(shortGroup, 'mug');
    assert(r.eligible === true,   'short message eligible for mug');
    assert(r.score > 0,           'positive score for short mug content');
}

suite('ProductEligibility — Mug: too many messages is a blocker');
{
    const manyGroup = makeGroup([
        msg('hi', 'Me'), msg('hey', 'Alice'), msg('yo', 'Me'),
        msg('ok', 'Alice'), msg('bye', 'Me')
    ]);
    const r = PE.evaluate(manyGroup, 'mug');
    assert(r.eligible === false,  'too many messages blocks mug');
    assert(r.blockers.length > 0, 'blocker for too many messages');
}

// ── Sticker Pack ──────────────────────────────────────────────────────────────

suite('ProductEligibility — Sticker Pack: short phrases are a good fit');
{
    const stickerGroup = makeGroup([
        msg('Sending love', 'Me'),
        msg('Miss you tons', 'Alice'),
        msg('You got this!', 'Me'),
        msg('Thank you!', 'Alice'),
        msg('Be right back', 'Me')
    ]);
    const r = PE.evaluate(stickerGroup, 'sticker-pack');
    assert(r.eligible === true,      'short phrases eligible for sticker pack');
    assert(r.suggestions.length > 0, 'suggestion for good sticker pack fit');
}

suite('ProductEligibility — Sticker Pack: long messages are warnings');
{
    const longGroup = makeGroup([
        msg('This is a very long message that goes on and on and really should not be a sticker', 'Me'),
        msg('Short', 'Alice')
    ]);
    const r = PE.evaluate(longGroup, 'sticker-pack');
    assert(r.warnings.length > 0, 'warning for overly long sticker messages');
}

// ── Wall Art ──────────────────────────────────────────────────────────────────

suite('ProductEligibility — Wall Art: too many messages is a blocker');
{
    const manyGroup = makeGroup([
        msg('One', 'Me'), msg('Two', 'Alice'), msg('Three', 'Me'),
        msg('Four', 'Alice'), msg('Five', 'Me'), msg('Six', 'Alice')
    ]);
    const r = PE.evaluate(manyGroup, 'wall-art');
    assert(r.eligible === false,  'too many messages blocks wall art');
}

suite('ProductEligibility — Wall Art: 1–5 substantial messages eligible');
{
    const wallGroup = makeGroup([
        msg('I love you to the moon and back', 'Me'),
        msg('You make everything better', 'Alice')
    ]);
    const r = PE.evaluate(wallGroup, 'wall-art');
    assert(r.eligible === true, 'substantial messages eligible for wall art');
}

// ── Gift Wrap ─────────────────────────────────────────────────────────────────

suite('ProductEligibility — Gift Wrap');
{
    const warmGroup = makeGroup([
        msg('Happy birthday!', 'Me'),
        msg('Thinking of you', 'Alice')
    ]);
    const r = PE.evaluate(warmGroup, 'gift-wrap');
    assert(r.eligible === true,      'short warm messages eligible for gift wrap');
    assert(r.suggestions.length > 0, 'suggestion for good gift wrap fit');
}

// ── evaluateAll ────────────────────────────────────────────────────────────────

suite('ProductEligibility.evaluateAll');
{
    const group = makeGroup([msg('Hey', 'Me'), msg('Hi!', 'Alice')]);
    const results = PE.evaluateAll(group);
    assert(results.length === 6,    'evaluateAll returns 6 results');
    assert(results.every(r => 'productId' in r && 'eligible' in r), 'all results have shape');
    assert(results.some(r => r.readinessNotes.length > 0), 'at least one result has readinessNotes');
}

// ── unknown product id ────────────────────────────────────────────────────────

suite('ProductEligibility — unknown product id');
{
    const r = PE.evaluate(makeGroup([msg('hi')]), 'nonexistent-product');
    assert(r.eligible === false,  'unknown product id returns not eligible');
    assert(r.blockers.length > 0, 'unknown product id has a blocker');
}

// ── product-line-supported readiness notes ────────────────────────────────────

suite('ProductEligibility — product-line-supported products surface readiness notes');
{
    const group = makeGroup([msg('hi', 'Me')]);
    for (const id of ['journal', 'mug', 'sticker-pack', 'wall-art', 'gift-wrap']) {
        const r = PE.evaluate(group, id);
        assert(r.readinessNotes.length > 0, id + ': readinessNotes present');
        assert(r.readinessNotes[0].toLowerCase().includes('not'), id + ': readinessNotes mentions not-ready');
    }
}

// ── LegacyKeepsakeTypesBridge ─────────────────────────────────────────────────

suite('LegacyKeepsakeTypesBridge — getTypes');
{
    const types = Brdg.getTypes();
    assert(types.length === 4, 'bridge exposes 4 legacy types');
    const ids = types.map(t => t.id);
    assert(ids.includes('quote-card'),        'quote-card present');
    assert(ids.includes('framed-print'),      'framed-print present');
    assert(ids.includes('mini-story'),        'mini-story present');
    assert(ids.includes('conversation-page'), 'conversation-page present');
}

suite('LegacyKeepsakeTypesBridge — evaluateAll');
{
    const group = makeGroup([
        msg('Hello there, I really enjoy your company', 'Me')
    ]);
    const results = Brdg.evaluateAll(group);
    assert(results.length === 4, 'evaluateAll returns 4 results');
    assert(results.every(r => 'eligible' in r && 'blockers' in r), 'all results have shape');
    // quote-card should be eligible (1 message, >12 chars)
    const qc = results.find(r => r.productId === 'quote-card');
    assert(qc !== undefined,    'quote-card result present');
    assert(qc.eligible === true, 'quote-card eligible for single substantial message');
}

suite('LegacyKeepsakeTypesBridge — evaluate single type');
{
    const oneMsg = makeGroup([msg('hi', 'Me')]);
    const r = Brdg.evaluate(oneMsg, 'framed-print');
    assert(r.eligible === false,  'framed-print needs >= 2 messages');
    assert(r.blockers.length > 0, 'blocker produced');
    assert(r.readinessNotes.some(n => n.toLowerCase().includes('standalone')), 'readinessNotes mentions standalone');
}

suite('LegacyKeepsakeTypesBridge — preserves existing eligibility logic');
{
    // Conversation page needs >=4 messages from both sides
    const convGroup = makeGroup([
        msg('Hey', 'Me'),
        msg('Hi!', 'Alice'),
        msg('How are you?', 'Me'),
        msg('Good!', 'Alice')
    ]);
    const r = Brdg.evaluate(convGroup, 'conversation-page');
    assert(r.eligible === true, 'conversation-page eligible with 4 messages from 2 senders');

    const oneSender = makeGroup([
        msg('A', 'Me'), msg('B', 'Me'), msg('C', 'Me'), msg('D', 'Me')
    ]);
    const r2 = Brdg.evaluate(oneSender, 'conversation-page');
    assert(r2.eligible === false, 'conversation-page not eligible with single sender');
}

suite('LegacyKeepsakeTypesBridge — unknown type id');
{
    const r = Brdg.evaluate(makeGroup([msg('hi')]), 'unknown-type');
    assert(r.eligible === false,  'unknown type id returns not eligible');
    assert(r.blockers.length > 0, 'unknown type id has a blocker');
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
