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
    load(ctx, 'src/products/product-statuses.js');
    load(ctx, 'src/products/product-catalog.js');
    load(ctx, 'src/products/product-eligibility.js');
    load(ctx, 'src/products/product-render-spec.js');
    load(ctx, 'src/products/product-render-spec-resolver.js');
    load(ctx, 'src/products/prototype-preview-registry.js');
    load(ctx, 'src/products/prototype-preview-resolver.js');
    load(ctx, 'src/products/product-experience-readiness.js');
    load(ctx, 'src/products/product-experience-consumer.js');
    return ctx.window.KMEngine;
}

function makeCtxWithout(...omit) {
    const ctx = createContext({ window: {}, console });
    const all = [
        'src/products/product-statuses.js',
        'src/products/product-catalog.js',
        'src/products/product-eligibility.js',
        'src/products/product-render-spec.js',
        'src/products/product-render-spec-resolver.js',
        'src/products/prototype-preview-registry.js',
        'src/products/prototype-preview-resolver.js',
        'src/products/product-experience-readiness.js',
        'src/products/product-experience-consumer.js',
    ];
    for (const p of all) {
        if (!omit.some(o => p.includes(o))) load(ctx, p);
    }
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

function msgs(n) {
    return Array.from({ length: n }, (_, i) => ({ id: 'msg-' + i, text: 'hi', sender: 'me' }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Module exists and exports correct shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — Module exists and exports correct shape', function () {
    const KM = makeCtx();
    assert(typeof KM.ProductExperienceConsumer === 'object' && KM.ProductExperienceConsumer !== null,
        'KMEngine.ProductExperienceConsumer is an object');
    assert(typeof KM.ProductExperienceConsumer.isAvailable           === 'function', '.isAvailable() is a function');
    assert(typeof KM.ProductExperienceConsumer.resolveForGroup       === 'function', '.resolveForGroup() is a function');
    assert(typeof KM.ProductExperienceConsumer.resolveProductForGroup === 'function', '.resolveProductForGroup() is a function');
    assert(typeof KM.ProductExperienceConsumer.resolvePreviewableForGroup === 'function', '.resolvePreviewableForGroup() is a function');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — isAvailable
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — isAvailable', function () {
    const KM = makeCtx();
    assert(KM.ProductExperienceConsumer.isAvailable() === true,
        'isAvailable() returns true when ProductExperienceReadiness and EXPERIENCE_STATUS are loaded');

    // without readiness module — consumer is still loaded, readiness is not
    const KMPartial = makeCtxWithout('product-experience-readiness');
    assert(KMPartial.ProductExperienceConsumer.isAvailable() === false,
        'isAvailable() returns false when ProductExperienceReadiness is absent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — resolveForGroup with valid group
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — resolveForGroup with valid group', function () {
    const KM = makeCtx();
    const group = { messages: msgs(3) };
    const result = KM.ProductExperienceConsumer.resolveForGroup(group);

    assert(Array.isArray(result), 'resolveForGroup returns an array');
    assert(result.length > 0, 'resolveForGroup returns at least one readiness entry');
    assert(result.every(r => typeof r.productTypeId === 'string'),
        'every entry has a productTypeId string');
    assert(result.every(r => typeof r.experienceStatus === 'string'),
        'every entry has an experienceStatus string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — resolveForGroup null safety
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — resolveForGroup null safety', function () {
    const KM = makeCtx();

    const r1 = KM.ProductExperienceConsumer.resolveForGroup(null);
    assert(Array.isArray(r1), 'resolveForGroup(null) returns an array (not a throw)');

    const r2 = KM.ProductExperienceConsumer.resolveForGroup(undefined);
    assert(Array.isArray(r2), 'resolveForGroup(undefined) returns an array');

    const r3 = KM.ProductExperienceConsumer.resolveForGroup({});
    assert(Array.isArray(r3), 'resolveForGroup({}) with no messages key returns an array');

    const r4 = KM.ProductExperienceConsumer.resolveForGroup({ messages: null });
    assert(Array.isArray(r4), 'resolveForGroup({messages:null}) returns an array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — resolveForGroup when readiness is not loaded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — resolveForGroup when readiness is not loaded', function () {
    const KMPartial = makeCtxWithout('product-experience-readiness');
    const group = { messages: msgs(3) };
    const result = KMPartial.ProductExperienceConsumer.resolveForGroup(group);
    assert(Array.isArray(result) && result.length === 0,
        'resolveForGroup returns [] when ProductExperienceReadiness is absent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — resolveProductForGroup with valid product and group
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — resolveProductForGroup with valid product and group', function () {
    const KM = makeCtx();
    const group = { messages: msgs(2) };
    const result = KM.ProductExperienceConsumer.resolveProductForGroup('message-book', group);

    assert(result !== null && typeof result === 'object', 'resolveProductForGroup returns an object for message-book');
    assert(result.productTypeId === 'message-book', 'result.productTypeId is message-book');
    assert(typeof result.experienceStatus === 'string', 'result.experienceStatus is a string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — resolveProductForGroup null safety
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — resolveProductForGroup null safety', function () {
    const KM = makeCtx();

    const r1 = KM.ProductExperienceConsumer.resolveProductForGroup('message-book', null);
    assert(r1 !== null && typeof r1 === 'object', 'resolveProductForGroup with null group still returns object (safeGroup used)');

    const r2 = KM.ProductExperienceConsumer.resolveProductForGroup('message-book', {});
    assert(r2 !== null && typeof r2 === 'object', 'resolveProductForGroup with empty group still returns object');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — resolveProductForGroup when readiness is not loaded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — resolveProductForGroup when readiness is not loaded', function () {
    const KMPartial = makeCtxWithout('product-experience-readiness');
    const result = KMPartial.ProductExperienceConsumer.resolveProductForGroup('message-book', { messages: msgs(1) });
    assert(result === null, 'resolveProductForGroup returns null when ProductExperienceReadiness is absent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — resolvePreviewableForGroup
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — resolvePreviewableForGroup', function () {
    const KM = makeCtx();

    // group with 2 messages — message-book should be previewable
    const group = { messages: msgs(2) };
    const result = KM.ProductExperienceConsumer.resolvePreviewableForGroup(group);
    assert(Array.isArray(result), 'resolvePreviewableForGroup returns an array');

    const ids = result.map(r => r.productTypeId);
    assert(ids.indexOf('message-book') !== -1,
        'resolvePreviewableForGroup includes message-book for a group with 2 messages');

    // empty group — no previewable products
    const empty = KM.ProductExperienceConsumer.resolvePreviewableForGroup({ messages: [] });
    assert(Array.isArray(empty), 'resolvePreviewableForGroup({messages:[]}) returns an array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — resolvePreviewableForGroup null safety
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — resolvePreviewableForGroup null safety', function () {
    const KM = makeCtx();

    const r1 = KM.ProductExperienceConsumer.resolvePreviewableForGroup(null);
    assert(Array.isArray(r1), 'resolvePreviewableForGroup(null) returns an array');

    const r2 = KM.ProductExperienceConsumer.resolvePreviewableForGroup(undefined);
    assert(Array.isArray(r2), 'resolvePreviewableForGroup(undefined) returns an array');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — resolvePreviewableForGroup when readiness is not loaded
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — resolvePreviewableForGroup when readiness is not loaded', function () {
    const KMPartial = makeCtxWithout('product-experience-readiness');
    const result = KMPartial.ProductExperienceConsumer.resolvePreviewableForGroup({ messages: msgs(2) });
    assert(Array.isArray(result) && result.length === 0,
        'resolvePreviewableForGroup returns [] when ProductExperienceReadiness is absent');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — Message Book has the highest current readiness path
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — Message Book has the highest current readiness path', function () {
    const KM = makeCtx();
    const STATUS = KM.EXPERIENCE_STATUS;
    const group = { messages: msgs(3) };

    const bookResult = KM.ProductExperienceConsumer.resolveProductForGroup('message-book', group);
    assert(bookResult.experienceStatus === STATUS.PROTOTYPE_PREVIEW_SUPPORTED,
        'message-book with 3 messages resolves to prototype-preview-supported (highest current path)');

    // all other render-planning products should be render-planning-known or lower
    const otherIds = ['mug', 'framed-print', 'sticker-pack', 'mini-notebook', 'fridge-magnet'];
    for (const id of otherIds) {
        const r = KM.ProductExperienceConsumer.resolveProductForGroup(id, group);
        if (r) {
            assert(
                r.experienceStatus !== STATUS.PROTOTYPE_PREVIEW_SUPPORTED &&
                r.experienceStatus !== STATUS.PROOF_READY &&
                r.experienceStatus !== STATUS.COMMERCE_READY &&
                r.experienceStatus !== STATUS.MANUFACTURING_READY &&
                r.experienceStatus !== STATUS.PUBLIC_CLAIM_READY,
                id + ' does not reach prototype-preview-supported or higher — renderer not implemented'
            );
        }
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — Consumer does not mutate the group argument
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — Consumer does not mutate the group argument', function () {
    const KM = makeCtx();
    const msgs3 = msgs(3);
    const group = { messages: msgs3, name: 'alice' };
    const before = JSON.stringify(group);

    KM.ProductExperienceConsumer.resolveForGroup(group);
    KM.ProductExperienceConsumer.resolveProductForGroup('message-book', group);
    KM.ProductExperienceConsumer.resolvePreviewableForGroup(group);

    assert(JSON.stringify(group) === before, 'group object is not mutated by any consumer call');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
