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

function msgs(n, opts) {
    var arr = [];
    for (var i = 0; i < n; i++) {
        var m = { text: 'message number ' + i, sender: 'Alice', timestamp: 1000000 + i };
        if (opts && opts.attachmentOnly) m.isAttachmentOnly = true;
        arr.push(m);
    }
    return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Module and API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — Module and API shape', function () {
    const KM = makeCtx();
    assert(typeof KM.ProductExperienceReadiness === 'object' && KM.ProductExperienceReadiness !== null,
        'KMEngine.ProductExperienceReadiness is an object');
    assert(typeof KM.ProductExperienceReadiness.resolveForProduct          === 'function', '.resolveForProduct() exists');
    assert(typeof KM.ProductExperienceReadiness.resolveAllForGroup         === 'function', '.resolveAllForGroup() exists');
    assert(typeof KM.ProductExperienceReadiness.resolvePreviewableForGroup === 'function', '.resolvePreviewableForGroup() exists');
    assert(typeof KM.ProductExperienceReadiness.resolveBlockedForGroup     === 'function', '.resolveBlockedForGroup() exists');
    assert(typeof KM.ProductExperienceReadiness.resolveByStatus            === 'function', '.resolveByStatus() exists');
    assert(typeof KM.EXPERIENCE_STATUS === 'object' && KM.EXPERIENCE_STATUS !== null,
        'KMEngine.EXPERIENCE_STATUS is exported');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — EXPERIENCE_STATUS constants
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — EXPERIENCE_STATUS constants', function () {
    const KM = makeCtx();
    const ES = KM.EXPERIENCE_STATUS;
    assert(ES.UNKNOWN                     === 'unknown',                     'UNKNOWN value');
    assert(ES.UNSUPPORTED                 === 'unsupported',                 'UNSUPPORTED value');
    assert(ES.CATALOG_KNOWN              === 'catalog-known',               'CATALOG_KNOWN value');
    assert(ES.ELIGIBILITY_KNOWN          === 'eligibility-known',           'ELIGIBILITY_KNOWN value');
    assert(ES.RENDER_PLANNING_KNOWN      === 'render-planning-known',       'RENDER_PLANNING_KNOWN value');
    assert(ES.PROTOTYPE_PREVIEW_SUPPORTED === 'prototype-preview-supported', 'PROTOTYPE_PREVIEW_SUPPORTED value');
    assert(ES.PROOF_READY                === 'proof-ready',                 'PROOF_READY value');
    assert(ES.COMMERCE_READY             === 'commerce-ready',              'COMMERCE_READY value');
    assert(ES.MANUFACTURING_READY        === 'manufacturing-ready',         'MANUFACTURING_READY value');
    assert(ES.PUBLIC_CLAIM_READY         === 'public-claim-ready',          'PUBLIC_CLAIM_READY value');
    assert(ES.BLOCKED                    === 'blocked',                     'BLOCKED value');
    assert(Object.keys(ES).length === 11, 'EXPERIENCE_STATUS has exactly 11 keys');
    let frozen = true;
    try { ES.EXTRA = 'x'; } catch (e) { /* expected */ }
    assert(ES.EXTRA === undefined, 'EXPERIENCE_STATUS is frozen');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — resolveForProduct: unknown product returns safe result
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — resolveForProduct: unknown product returns safe result', function () {
    const KM = makeCtx();
    const r = KM.ProductExperienceReadiness.resolveForProduct('totally-unknown-product-id');
    assert(r !== null && typeof r === 'object',     'returns an object');
    assert(r.productTypeId === 'totally-unknown-product-id', 'productTypeId preserved');
    assert(r.experienceStatus === KM.EXPERIENCE_STATUS.UNKNOWN, 'experienceStatus is UNKNOWN');
    assert(r.canPreview      === false, 'canPreview is false');
    assert(r.canProof        === false, 'canProof is false');
    assert(r.canOrder        === false, 'canOrder is false');
    assert(r.canManufacture  === false, 'canManufacture is false');
    assert(r.canPubliclyClaim === false, 'canPubliclyClaim is false');
    assert(Array.isArray(r.blockers), 'blockers is array');
    assert(r.blockers.indexOf('unknown-product-type') !== -1, 'blockers contains unknown-product-type');
    assert(r.eligibilityResult      === null, 'eligibilityResult is null');
    assert(r.renderSpecSummary      === null, 'renderSpecSummary is null');
    assert(r.previewRegistrySummary === null, 'previewRegistrySummary is null');
    assert(r.catalogKnown          === false, 'catalogKnown is false');
    assert(r.renderPlanningKnown   === false, 'renderPlanningKnown is false');
    assert(r.prototypePreviewKnown === false, 'prototypePreviewKnown is false');

    const r2 = KM.ProductExperienceReadiness.resolveForProduct('unknown', null);
    assert(r2.experienceStatus === KM.EXPERIENCE_STATUS.UNKNOWN, 'null group: still UNKNOWN for unknown product');

    const r3 = KM.ProductExperienceReadiness.resolveForProduct('');
    assert(r3.experienceStatus === KM.EXPERIENCE_STATUS.UNKNOWN, 'empty string: UNKNOWN');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — resolveForProduct: message-book with adequate group
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — resolveForProduct: message-book with adequate group', function () {
    const KM = makeCtx();
    const group5 = { messages: msgs(5) };
    const r = KM.ProductExperienceReadiness.resolveForProduct('message-book', group5);

    assert(r.productTypeId          === 'message-book',   'productTypeId matches');
    assert(typeof r.productName     === 'string' && r.productName.length > 0, 'productName is non-empty string');
    assert(r.catalogKnown           === true,  'message-book: catalogKnown is true');
    assert(r.eligibilityKnown       === true,  'message-book: eligibilityKnown is true');
    assert(r.renderPlanningKnown    === true,  'message-book: renderPlanningKnown is true');
    assert(r.prototypePreviewKnown  === true,  'message-book: prototypePreviewKnown is true');
    assert(r.canPreview             === true,  'message-book(5 msgs): canPreview is true');
    assert(r.canProof               === false, 'message-book: canProof is false (gate not yet open)');
    assert(r.canOrder               === false, 'message-book: canOrder is false');
    assert(r.canManufacture         === false, 'message-book: canManufacture is false');
    assert(r.canPubliclyClaim       === false, 'message-book: canPubliclyClaim is false');
    assert(r.experienceStatus === KM.EXPERIENCE_STATUS.PROTOTYPE_PREVIEW_SUPPORTED,
        'message-book(5 msgs): experienceStatus is prototype-preview-supported');
    assert(typeof r.userLabel === 'string' && r.userLabel.length > 0, 'userLabel is non-empty string');
    assert(r.blockers.length === 0, 'message-book(5 msgs): no blockers');
    assert(r.eligibilityResult !== null, 'eligibilityResult is present');
    assert(r.eligibilityResult.eligible === true, 'eligibilityResult.eligible is true');
    assert(r.renderSpecSummary !== null, 'renderSpecSummary is present');
    assert(r.renderSpecSummary.engineSupported === true, 'renderSpecSummary.engineSupported is true');
    assert(r.previewRegistrySummary !== null, 'previewRegistrySummary is present');
    assert(r.previewRegistrySummary.prototypePreviewEnabled === true,
        'previewRegistrySummary.prototypePreviewEnabled is true');
    assert(typeof r.nextImplementationDependency === 'string',
        'nextImplementationDependency is a string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — resolveForProduct: message-book blocked by empty/null group
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — resolveForProduct: message-book with empty or null group', function () {
    const KM = makeCtx();

    const rEmpty = KM.ProductExperienceReadiness.resolveForProduct('message-book', { messages: [] });
    assert(rEmpty.canPreview         === false,  'message-book(0 msgs): canPreview is false');
    assert(rEmpty.experienceStatus === KM.EXPERIENCE_STATUS.BLOCKED,
        'message-book(0 msgs): experienceStatus is blocked');
    assert(rEmpty.blockers.indexOf('below-minimum-memory-count') !== -1,
        'message-book(0 msgs): below-minimum-memory-count blocker present');
    assert(rEmpty.eligibilityResult !== null, 'message-book(0 msgs): eligibilityResult is present');
    assert(rEmpty.eligibilityResult.eligible === false, 'message-book(0 msgs): eligibilityResult.eligible is false');

    const rNull = KM.ProductExperienceReadiness.resolveForProduct('message-book', null);
    assert(rNull.canPreview === false, 'message-book(null group): canPreview is false');
    assert(rNull.experienceStatus === KM.EXPERIENCE_STATUS.BLOCKED,
        'message-book(null group): experienceStatus is blocked');
    assert(typeof rNull.blockers !== 'undefined', 'message-book(null group): blockers is defined');

    const rUndefined = KM.ProductExperienceReadiness.resolveForProduct('message-book');
    assert(rUndefined.canPreview === false, 'message-book(undefined group): does not crash');
    assert(rUndefined.experienceStatus === KM.EXPERIENCE_STATUS.BLOCKED,
        'message-book(undefined group): experienceStatus is blocked');

    const rBadShape = KM.ProductExperienceReadiness.resolveForProduct('message-book', { notMessages: [] });
    assert(rBadShape.canPreview === false, 'message-book(bad group shape): does not crash');
    assert(rBadShape.experienceStatus === KM.EXPERIENCE_STATUS.BLOCKED,
        'message-book(bad group shape): experienceStatus is blocked');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — resolveForProduct: non-book render planning targets
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — resolveForProduct: non-book render planning targets are render-planning-known', function () {
    const KM = makeCtx();
    const nonBook = [
        'framed-conversation-print', 'mug', 'mini-keepsake-notebook',
        'mini-message-sticker-pack', 'fridge-magnet'
    ];
    const group5 = { messages: msgs(5) };

    nonBook.forEach(function (id) {
        const r = KM.ProductExperienceReadiness.resolveForProduct(id, group5);
        assert(r.renderPlanningKnown === true,
            id + ': renderPlanningKnown is true');
        assert(r.prototypePreviewKnown === true,
            id + ': prototypePreviewKnown is true (has registry entry)');
        assert(r.canPreview === false,
            id + ': canPreview is false (renderer-not-implemented)');
        assert(r.experienceStatus === KM.EXPERIENCE_STATUS.RENDER_PLANNING_KNOWN,
            id + ': experienceStatus is render-planning-known');
        assert(r.previewRegistrySummary !== null,
            id + ': previewRegistrySummary is present');
        assert(r.previewRegistrySummary.prototypePreviewEnabled === false,
            id + ': previewRegistrySummary.prototypePreviewEnabled is false');
        assert(r.previewRegistrySummary.unsupportedReason === 'renderer-not-implemented',
            id + ': previewRegistrySummary.unsupportedReason is renderer-not-implemented');
        assert(r.renderSpecSummary !== null,
            id + ': renderSpecSummary is present');
        assert(r.blockers.indexOf('preview-not-supported') !== -1,
            id + ': preview-not-supported in blockers');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — Gate invariants: non-book products cannot order/manufacture/claim
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — Gate invariants: non-book products are not commerce/manufacturing/public-claim ready', function () {
    const KM = makeCtx();
    const allProducts = KM.ProductExperienceReadiness.resolveAllForGroup({ messages: msgs(10) });

    allProducts.forEach(function (r) {
        if (r.productTypeId === 'message-book') return;
        assert(r.canOrder         === false, r.productTypeId + ': canOrder is false');
        assert(r.canManufacture   === false, r.productTypeId + ': canManufacture is false');
        assert(r.canPubliclyClaim === false, r.productTypeId + ': canPubliclyClaim is false');
        assert(r.canProof         === false, r.productTypeId + ': canProof is false');
    });

    // Message Book itself also has all gates false currently
    const mb = allProducts.find(function (r) { return r.productTypeId === 'message-book'; });
    assert(mb.canOrder         === false, 'message-book: canOrder is false (commerce blocked)');
    assert(mb.canManufacture   === false, 'message-book: canManufacture is false');
    assert(mb.canPubliclyClaim === false, 'message-book: canPubliclyClaim is false');
    assert(mb.canProof         === false, 'message-book: canProof is false');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — resolveAllForGroup: covers all expected products
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — resolveAllForGroup: covers all expected products', function () {
    const KM = makeCtx();
    const group5 = { messages: msgs(5) };
    const all = KM.ProductExperienceReadiness.resolveAllForGroup(group5);

    assert(Array.isArray(all), 'resolveAllForGroup returns array');
    assert(all.length >= 6, 'resolveAllForGroup returns at least 6 products');

    const ids = all.map(function (r) { return r.productTypeId; });

    // All 6 physical planning targets must be present
    const required = [
        'message-book', 'framed-conversation-print', 'mug',
        'mini-keepsake-notebook', 'mini-message-sticker-pack', 'fridge-magnet'
    ];
    required.forEach(function (id) {
        assert(ids.indexOf(id) !== -1, 'resolveAllForGroup includes ' + id);
    });

    // Each result must have required shape fields
    all.forEach(function (r, i) {
        assert(typeof r.productTypeId     === 'string',  'all[' + i + '].productTypeId is string');
        assert(typeof r.productName       === 'string',  'all[' + i + '].productName is string');
        assert(typeof r.experienceStatus  === 'string',  'all[' + i + '].experienceStatus is string');
        assert(typeof r.canPreview        === 'boolean', 'all[' + i + '].canPreview is boolean');
        assert(typeof r.canOrder          === 'boolean', 'all[' + i + '].canOrder is boolean');
        assert(Array.isArray(r.blockers),                'all[' + i + '].blockers is array');
    });

    // No duplicates
    var seen = {};
    var noDups = true;
    ids.forEach(function (id) { if (seen[id]) noDups = false; seen[id] = true; });
    assert(noDups, 'resolveAllForGroup has no duplicate product IDs');

    // Returns new array each call
    const all2 = KM.ProductExperienceReadiness.resolveAllForGroup(group5);
    assert(all !== all2, 'resolveAllForGroup returns a new array each call');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — resolvePreviewableForGroup and resolveBlockedForGroup
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — resolvePreviewableForGroup and resolveBlockedForGroup', function () {
    const KM = makeCtx();

    // With adequate group: message-book should be previewable
    const group5 = { messages: msgs(5) };
    const previewable = KM.ProductExperienceReadiness.resolvePreviewableForGroup(group5);
    assert(Array.isArray(previewable), 'resolvePreviewableForGroup returns array');
    previewable.forEach(function (r) {
        assert(r.canPreview === true, r.productTypeId + ': previewable list has canPreview: true');
    });
    const previewIds = previewable.map(function (r) { return r.productTypeId; });
    assert(previewIds.indexOf('message-book') !== -1,
        'message-book is in the previewable list with adequate group');
    const nonBookPreviewable = previewIds.filter(function (id) { return id !== 'message-book'; });
    assert(nonBookPreviewable.length === 0,
        'non-book products are not in the previewable list (renderer-not-implemented)');

    // With empty group: message-book should be blocked
    const emptyGroup = { messages: [] };
    const blocked = KM.ProductExperienceReadiness.resolveBlockedForGroup(emptyGroup);
    assert(Array.isArray(blocked), 'resolveBlockedForGroup returns array');
    blocked.forEach(function (r) {
        assert(r.experienceStatus === KM.EXPERIENCE_STATUS.BLOCKED,
            r.productTypeId + ': blocked list has BLOCKED status');
    });
    const blockedIds = blocked.map(function (r) { return r.productTypeId; });
    assert(blockedIds.indexOf('message-book') !== -1,
        'message-book is in the blocked list with empty group');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — resolveByStatus: filters by experienceStatus
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — resolveByStatus: filters by experienceStatus', function () {
    const KM = makeCtx();
    const ES = KM.EXPERIENCE_STATUS;
    const group5 = { messages: msgs(5) };

    const previewList = KM.ProductExperienceReadiness.resolveByStatus(group5, ES.PROTOTYPE_PREVIEW_SUPPORTED);
    assert(Array.isArray(previewList), 'resolveByStatus returns array');
    previewList.forEach(function (r) {
        assert(r.experienceStatus === ES.PROTOTYPE_PREVIEW_SUPPORTED,
            r.productTypeId + ': resolveByStatus(PROTOTYPE_PREVIEW_SUPPORTED) result has correct status');
    });

    const rptList = KM.ProductExperienceReadiness.resolveByStatus(group5, ES.RENDER_PLANNING_KNOWN);
    rptList.forEach(function (r) {
        assert(r.experienceStatus === ES.RENDER_PLANNING_KNOWN,
            r.productTypeId + ': resolveByStatus(RENDER_PLANNING_KNOWN) result has correct status');
        assert(r.canPreview === false, r.productTypeId + ': render-planning-known products cannot preview');
    });

    const unknownList = KM.ProductExperienceReadiness.resolveByStatus(group5, ES.UNKNOWN);
    assert(Array.isArray(unknownList), 'resolveByStatus(UNKNOWN) returns array');
    assert(unknownList.length === 0, 'no known products have UNKNOWN status');

    const emptyGroup = { messages: [] };
    const blockedList = KM.ProductExperienceReadiness.resolveByStatus(emptyGroup, ES.BLOCKED);
    blockedList.forEach(function (r) {
        assert(r.experienceStatus === ES.BLOCKED,
            r.productTypeId + ': resolveByStatus(BLOCKED) result has BLOCKED status');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — ProductRenderSpec blockers/warnings flow into readiness output
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — ProductRenderSpec blockers/warnings flow into readiness output', function () {
    const KM = makeCtx();

    // engine-not-supported blocker from render spec should appear for non-book products
    const r = KM.ProductExperienceReadiness.resolveForProduct('framed-conversation-print',
        { messages: msgs(5) });
    assert(r.blockers.indexOf('engine-not-supported') !== -1,
        'framed-conversation-print: engine-not-supported from render spec appears in top-level blockers');

    // exceeds-recommended-memory-count warning: mug maxRecommendedMemoryCount is 10
    const rMug = KM.ProductExperienceReadiness.resolveForProduct('mug', { messages: msgs(15) });
    assert(rMug.warnings.indexOf('exceeds-recommended-memory-count') !== -1,
        'mug(15 msgs): exceeds-recommended-memory-count warning from render spec appears');

    // below-minimum-memory-count blocker for message-book
    const rMbEmpty = KM.ProductExperienceReadiness.resolveForProduct('message-book', { messages: [] });
    assert(rMbEmpty.blockers.indexOf('below-minimum-memory-count') !== -1,
        'message-book(0 msgs): below-minimum-memory-count blocker from render spec appears');

    // renderSpecSummary is populated with the render spec summary
    const rMb = KM.ProductExperienceReadiness.resolveForProduct('message-book', { messages: msgs(3) });
    assert(rMb.renderSpecSummary !== null, 'message-book: renderSpecSummary is present');
    assert(typeof rMb.renderSpecSummary.renderStatus       === 'string',  'renderStatus in summary');
    assert(typeof rMb.renderSpecSummary.minMemoryCount     === 'number',  'minMemoryCount in summary');
    assert(typeof rMb.renderSpecSummary.engineSupported    === 'boolean', 'engineSupported in summary');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — PrototypePreviewRegistry blockers flow into readiness output
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — PrototypePreviewRegistry blockers flow into readiness output', function () {
    const KM = makeCtx();
    const group5 = { messages: msgs(5) };

    // preview-not-supported blocker from preview resolver appears for non-book products
    const nonBook = [
        'framed-conversation-print', 'mug', 'mini-keepsake-notebook',
        'mini-message-sticker-pack', 'fridge-magnet'
    ];
    nonBook.forEach(function (id) {
        const r = KM.ProductExperienceReadiness.resolveForProduct(id, group5);
        assert(r.blockers.indexOf('preview-not-supported') !== -1,
            id + ': preview-not-supported from preview resolver appears in top-level blockers');
    });

    // previewRegistrySummary carries unsupportedReason
    nonBook.forEach(function (id) {
        const r = KM.ProductExperienceReadiness.resolveForProduct(id, group5);
        assert(r.previewRegistrySummary !== null, id + ': previewRegistrySummary is present');
        assert(r.previewRegistrySummary.unsupportedReason === 'renderer-not-implemented',
            id + ': previewRegistrySummary.unsupportedReason is renderer-not-implemented');
        assert(r.previewRegistrySummary.prototypePreviewEnabled === false,
            id + ': previewRegistrySummary.prototypePreviewEnabled is false');
    });

    // Message Book preview resolver has no blockers (engine supported, preview enabled, adequate messages)
    const rMb = KM.ProductExperienceReadiness.resolveForProduct('message-book', group5);
    assert(rMb.blockers.indexOf('preview-not-supported') === -1,
        'message-book: no preview-not-supported blocker');
    assert(rMb.blockers.length === 0,
        'message-book(5 msgs): no blockers from any layer');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — No mutation of source data
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — No mutation of source data after resolve calls', function () {
    const KM = makeCtx();
    const group5 = { messages: msgs(5) };

    const catalogBefore = KM.ProductCatalog.all().map(function (p) { return p.id; }).join(',');
    const specsBefore   = KM.ProductRenderSpecs.all().map(function (s) { return s.productTypeId; }).join(',');
    const regBefore     = KM.PrototypePreviewRegistry.all().map(function (e) { return e.productTypeId; }).join(',');

    // Run all resolver functions
    KM.ProductExperienceReadiness.resolveAllForGroup(group5);
    KM.ProductExperienceReadiness.resolvePreviewableForGroup(group5);
    KM.ProductExperienceReadiness.resolveBlockedForGroup({ messages: [] });
    KM.ProductExperienceReadiness.resolveByStatus(group5, KM.EXPERIENCE_STATUS.RENDER_PLANNING_KNOWN);
    KM.ProductExperienceReadiness.resolveForProduct('message-book', group5);
    KM.ProductExperienceReadiness.resolveForProduct('mug', group5);
    KM.ProductExperienceReadiness.resolveForProduct('unknown-id');

    const catalogAfter = KM.ProductCatalog.all().map(function (p) { return p.id; }).join(',');
    const specsAfter   = KM.ProductRenderSpecs.all().map(function (s) { return s.productTypeId; }).join(',');
    const regAfter     = KM.PrototypePreviewRegistry.all().map(function (e) { return e.productTypeId; }).join(',');

    assert(catalogBefore === catalogAfter, 'ProductCatalog not mutated after resolve calls');
    assert(specsBefore   === specsAfter,   'ProductRenderSpecs not mutated after resolve calls');
    assert(regBefore     === regAfter,     'PrototypePreviewRegistry not mutated after resolve calls');

    // Group object is not mutated
    const groupCopy = { messages: msgs(3) };
    const msgsBefore = groupCopy.messages.length;
    KM.ProductExperienceReadiness.resolveForProduct('message-book', groupCopy);
    assert(groupCopy.messages.length === msgsBefore, 'group.messages not mutated by resolveForProduct');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — Catalog-only stubs have eligibility-known status (not render-planning-known)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — Catalog-only stubs resolve as eligibility-known (not render-planning-known)', function () {
    const KM = makeCtx();
    const ES = KM.EXPERIENCE_STATUS;

    // journal, sticker-pack, wall-art, gift-wrap are catalog products but not render planning targets
    const catalogOnlyStubs = ['journal', 'sticker-pack', 'wall-art', 'gift-wrap'];

    catalogOnlyStubs.forEach(function (id) {
        const rEmpty = KM.ProductExperienceReadiness.resolveForProduct(id, { messages: [] });
        assert(rEmpty.catalogKnown         === true,  id + ': catalogKnown is true');
        assert(rEmpty.eligibilityKnown     === true,  id + ': eligibilityKnown is true');
        assert(rEmpty.renderPlanningKnown  === false, id + ': renderPlanningKnown is false');
        assert(rEmpty.prototypePreviewKnown === false, id + ': prototypePreviewKnown is false');
        assert(rEmpty.canPreview           === false, id + ': canPreview is false');
        assert(rEmpty.canOrder             === false, id + ': canOrder is false');
        assert(rEmpty.canManufacture       === false, id + ': canManufacture is false');
        assert(rEmpty.canPubliclyClaim     === false, id + ': canPubliclyClaim is false');
    });

    // With adequate messages, they should be eligibility-known (not blocked, not render-planning-known)
    const journalGroup = { messages: msgs(15) };
    const rJournal = KM.ProductExperienceReadiness.resolveForProduct('journal', journalGroup);
    assert(rJournal.eligibilityResult !== null, 'journal: eligibilityResult is present');
    assert(rJournal.experienceStatus === ES.ELIGIBILITY_KNOWN,
        'journal(15 msgs): experienceStatus is eligibility-known');
    assert(rJournal.eligibilityResult.eligible === true, 'journal(15 msgs): eligibility is true');

    // With no messages, they should be blocked
    const rJournalEmpty = KM.ProductExperienceReadiness.resolveForProduct('journal', { messages: [] });
    assert(rJournalEmpty.experienceStatus === ES.BLOCKED,
        'journal(0 msgs): experienceStatus is blocked');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — System dependency blockers and content eligibility blockers coexist
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — System dependency and content eligibility issues are both preserved', function () {
    const KM = makeCtx();

    // mug with 5 messages: system dependency = renderer-not-implemented (preview-not-supported);
    // content issue = too many messages for a mug (catalog eligibility blocker)
    const r = KM.ProductExperienceReadiness.resolveForProduct('mug', { messages: msgs(5) });

    // System dependency: preview-not-supported from the preview resolver layer
    assert(r.blockers.indexOf('preview-not-supported') !== -1,
        'mug(5 msgs): preview-not-supported system blocker is present in top-level blockers');

    // System dependency also accessible via previewRegistrySummary
    assert(r.previewRegistrySummary !== null,
        'mug(5 msgs): previewRegistrySummary is present');
    assert(r.previewRegistrySummary.unsupportedReason === 'renderer-not-implemented',
        'mug(5 msgs): previewRegistrySummary carries renderer-not-implemented system dependency');

    // Content-specific eligibility issue: eligibilityResult is populated and reports ineligible
    assert(r.eligibilityResult !== null,
        'mug(5 msgs): eligibilityResult is present — eligibility was evaluated');
    assert(r.eligibilityResult.eligible === false,
        'mug(5 msgs): eligibilityResult.eligible is false — content issue detected');
    assert(Array.isArray(r.eligibilityResult.blockers) && r.eligibilityResult.blockers.length > 0,
        'mug(5 msgs): eligibilityResult.blockers is non-empty — content blockers preserved');

    // The content blocker text references the mug-specific constraint
    var contentBlockerText = r.eligibilityResult.blockers.join(' ');
    assert(contentBlockerText.toLowerCase().indexOf('mug') !== -1,
        'mug(5 msgs): eligibilityResult.blockers text contains product-specific constraint reference');

    // Both categories coexist: readiness object is not hiding either
    assert(r.blockers.length > 0,
        'mug(5 msgs): top-level blockers non-empty (system issues present)');
    assert(r.eligibilityResult.blockers.length > 0,
        'mug(5 msgs): eligibilityResult.blockers non-empty (content issues present)');

    // A second product: mug with 1 message is eligible but still has system dependency
    const rOk = KM.ProductExperienceReadiness.resolveForProduct('mug', { messages: msgs(1) });
    assert(rOk.eligibilityResult.eligible === true,
        'mug(1 msg): eligible group has eligibilityResult.eligible true');
    assert(rOk.blockers.indexOf('preview-not-supported') !== -1,
        'mug(1 msg): system dependency preview-not-supported still present even when group is eligible');
    assert(rOk.previewRegistrySummary.unsupportedReason === 'renderer-not-implemented',
        'mug(1 msg): system dependency still visible in previewRegistrySummary');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
