/**
 * ProductCatalog and ProductStatuses tests.
 * Run with: node src/tests/product-catalog-tests.mjs
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

const { KMEngine } = ctx.window;
const PS  = KMEngine.ProductStatuses;
const Cat = KMEngine.ProductCatalog;

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }
function assert(cond, label) {
    if (cond) { console.log('  PASS  ' + label); passed++; }
    else       { console.error('  FAIL  ' + label); failed++; }
}

// ── ProductStatuses ───────────────────────────────────────────────────────────

suite('ProductStatuses');
{
    assert(PS.SOFTWARE.SUPPORTED   === 'supported',      'SOFTWARE.SUPPORTED is supported');
    assert(PS.SOFTWARE.STUB        === 'stub',            'SOFTWARE.STUB is stub');
    assert(PS.COMMERCE.BLOCKED     === 'blocked',         'COMMERCE.BLOCKED is blocked');
    assert(PS.COMMERCE.NOT_APPLICABLE === 'not-applicable', 'COMMERCE.NOT_APPLICABLE is not-applicable');
    assert(PS.MANUFACTURING.PLANNING    === 'planning',   'MANUFACTURING.PLANNING is planning');
    assert(PS.MANUFACTURING.NOT_STARTED === 'not-started','MANUFACTURING.NOT_STARTED is not-started');
    assert(PS.PUBLIC_CLAIM.NOT_YET === 'not-yet',         'PUBLIC_CLAIM.NOT_YET is not-yet');
    assert(PS.PUBLIC_CLAIM.CLAIMABLE === 'claimable',     'PUBLIC_CLAIM.CLAIMABLE is claimable');
}

// ── ProductCatalog.all ────────────────────────────────────────────────────────

suite('ProductCatalog — all products present');
{
    const all = Cat.all();
    const ids = all.map(p => p.id);
    assert(ids.includes('message-book'),  'message-book is in catalog');
    assert(ids.includes('journal'),       'journal is in catalog');
    assert(ids.includes('mug'),           'mug is in catalog');
    assert(ids.includes('sticker-pack'),  'sticker-pack is in catalog');
    assert(ids.includes('wall-art'),      'wall-art is in catalog');
    assert(ids.includes('gift-wrap'),     'gift-wrap is in catalog');
    assert(all.length === 6,              'catalog has exactly 6 products');
}

// ── Message Book — flagship ───────────────────────────────────────────────────

suite('ProductCatalog — Message Book is flagship');
{
    const mb = Cat.get('message-book');
    assert(mb !== null,                                      'message-book exists');
    assert(mb.flagship === true,                             'message-book is flagship');
    assert(mb.softwareSupportStatus === 'supported',         'message-book software is supported');
    assert(mb.commerceReadinessStatus === 'blocked',         'message-book commerce is blocked');
    assert(mb.manufacturingReadinessStatus === 'planning',   'message-book manufacturing is planning');
    assert(mb.publicClaimStatus === 'not-yet',               'message-book public claim is not-yet');
    assert(mb.maxContentGuidance === null,                   'message-book has no hard max (multi-volume)');
    assert(mb.supportedContentTypes.includes('text'),        'message-book supports text');
    assert(mb.supportedContentTypes.includes('attachment-placeholder'), 'message-book includes attachment-placeholder');
    assert(mb.knownLimitations.length > 0,                   'message-book has known limitations listed');

    const flagship = Cat.flagship();
    assert(flagship !== null,                                'flagship() returns a product');
    assert(flagship.id === 'message-book',                   'flagship is message-book');
}

// ── Non-flagship products — status discipline ─────────────────────────────────

suite('ProductCatalog — future products are product-line-supported only');
{
    const nonFlagship = Cat.all().filter(p => !p.flagship);
    assert(nonFlagship.length === 5, 'five non-flagship products');

    for (const p of nonFlagship) {
        assert(p.softwareSupportStatus === 'stub',
            p.label + ': softwareSupportStatus is stub');
        assert(p.commerceReadinessStatus === 'not-applicable',
            p.label + ': commerceReadinessStatus is not-applicable');
        assert(p.manufacturingReadinessStatus === 'not-started',
            p.label + ': manufacturingReadinessStatus is not-started');
        assert(p.publicClaimStatus === 'not-yet',
            p.label + ': publicClaimStatus is not-yet');
    }
}

// ── Required fields on every product ─────────────────────────────────────────

suite('ProductCatalog — all products have required fields');
{
    for (const p of Cat.all()) {
        assert(typeof p.id === 'string' && p.id.length > 0,
            p.id + ': has id');
        assert(typeof p.label === 'string' && p.label.length > 0,
            p.id + ': has label');
        assert(typeof p.category === 'string',
            p.id + ': has category');
        assert(Array.isArray(p.supportedContentTypes),
            p.id + ': has supportedContentTypes array');
        assert(typeof p.minContentGuidance === 'number',
            p.id + ': has minContentGuidance');
        assert(p.sourceCompatibility !== undefined,
            p.id + ': has sourceCompatibility');
        assert(typeof p.softwareSupportStatus === 'string',
            p.id + ': has softwareSupportStatus');
        assert(typeof p.commerceReadinessStatus === 'string',
            p.id + ': has commerceReadinessStatus');
        assert(typeof p.manufacturingReadinessStatus === 'string',
            p.id + ': has manufacturingReadinessStatus');
        assert(typeof p.publicClaimStatus === 'string',
            p.id + ': has publicClaimStatus');
        assert(Array.isArray(p.knownLimitations),
            p.id + ': has knownLimitations array');
        assert(typeof p.notes === 'string',
            p.id + ': has notes');
    }
}

// ── byCategory ────────────────────────────────────────────────────────────────

suite('ProductCatalog.byCategory');
{
    const books = Cat.byCategory('book');
    assert(books.length === 2, 'two book products (message-book, journal)');
    assert(books.some(p => p.id === 'message-book'), 'message-book in books');
    assert(books.some(p => p.id === 'journal'),      'journal in books');

    const merch = Cat.byCategory('merchandise');
    assert(merch.length === 2, 'two merchandise products (mug, sticker-pack)');

    const decor = Cat.byCategory('decor');
    assert(decor.length === 1, 'one decor product (wall-art)');

    const packaging = Cat.byCategory('packaging');
    assert(packaging.length === 1, 'one packaging product (gift-wrap)');
}

// ── get unknown id ────────────────────────────────────────────────────────────

suite('ProductCatalog.get — unknown id returns null');
{
    assert(Cat.get('nonexistent') === null, 'unknown id returns null');
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
