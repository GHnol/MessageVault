import { createContext, runInContext } from 'node:vm';
import { readFileSync }               from 'node:fs';
import { join, dirname }              from 'node:path';
import { fileURLToPath }              from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

const ctx = createContext({ window: {}, console });
function load(rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    runInContext(code, ctx);
}

load('src/products/product-statuses.js');
load('src/products/product-catalog.js');
load('src/products/product-render-spec.js');
load('src/products/product-render-spec-resolver.js');

const { KMEngine } = ctx.window;

let passed = 0, failed = 0;
function suite(name) { console.log('\n' + name); }
function assert(condition, label) {
    if (condition) { console.log('  PASS  ' + label); passed++; }
    else           { console.error('  FAIL  ' + label); failed++; }
}

// ── Suite 1: Module loads ────────────────────────────────────────────────────
suite('Module loads');
assert(typeof KMEngine.ProductRenderSpecs         === 'object', 'ProductRenderSpecs exposed on KMEngine');
assert(typeof KMEngine.ProductRenderSpecResolver  === 'object', 'ProductRenderSpecResolver exposed on KMEngine');
assert(typeof KMEngine.RENDER_STATUS              === 'object', 'RENDER_STATUS constants exposed');
assert(typeof KMEngine.TEXT_DENSITY               === 'object', 'TEXT_DENSITY constants exposed');
assert(typeof KMEngine.BUBBLE_TREATMENT           === 'object', 'BUBBLE_TREATMENT constants exposed');
assert(typeof KMEngine.REACTION_POLICY            === 'object', 'REACTION_POLICY constants exposed');
assert(typeof KMEngine.ATTACHMENT_POLICY          === 'object', 'ATTACHMENT_POLICY constants exposed');

// ── Suite 2: all() ───────────────────────────────────────────────────────────
suite('all()');
const all = KMEngine.ProductRenderSpecs.all();
assert(Array.isArray(all),   'all() returns array');
assert(all.length >= 10,     'all() has at least 10 specs');
all.forEach(function (s) {
    assert(typeof s.productTypeId === 'string' && s.productTypeId.length > 0,
        'spec has non-empty productTypeId: ' + s.productTypeId);
});

// ── Suite 3: message-book gates ──────────────────────────────────────────────
suite('message-book gates');
const mbSpec = KMEngine.ProductRenderSpecs.get('message-book');
assert(mbSpec !== null,                                              'message-book spec exists');
assert(mbSpec.gates.engineSupported           === true,             'message-book: engineSupported=true');
assert(mbSpec.gates.prototypePreviewSupported === true,             'message-book: prototypePreviewSupported=true');
assert(mbSpec.gates.proofSupported            === true,             'message-book: proofSupported=true (proof shipped 5D/5E/6A/7A/7B; reconciled in 7C)');
assert(mbSpec.gates.commerceSupported         === false,            'message-book: commerceSupported=false');
assert(mbSpec.gates.manufacturingSupported    === false,            'message-book: manufacturingSupported=false');
assert(mbSpec.gates.publicClaimSupported      === false,            'message-book: publicClaimSupported=false');
assert(mbSpec.renderStatus === KMEngine.RENDER_STATUS.READY,        'message-book: renderStatus=ready');
assert(mbSpec.isRenderPlanningTarget  === true,                             'message-book: isRenderPlanningTarget=true');
assert(mbSpec.isCatalogProduct === true,                            'message-book: isCatalogProduct=true');

// ── Suite 4: all non-message-book products have all gates false ──────────────
suite('non-message-book gates (all false)');
const GATE_FIELDS = [
    'engineSupported', 'prototypePreviewSupported', 'proofSupported',
    'commerceSupported', 'manufacturingSupported', 'publicClaimSupported',
];
all.filter(function (s) { return s.productTypeId !== 'message-book'; }).forEach(function (s) {
    GATE_FIELDS.forEach(function (g) {
        assert(s.gates[g] === false, s.productTypeId + ': gates.' + g + '=false');
    });
});

// ── Suite 5: renderPlanningTargets() ─────────────────────────────────────────────────
suite('renderPlanningTargets()');
const renderPlanningTargets = KMEngine.ProductRenderSpecs.renderPlanningTargets();
assert(Array.isArray(renderPlanningTargets),                               'renderPlanningTargets() returns array');
assert(renderPlanningTargets.every(function (s) { return s.isRenderPlanningTarget === true; }),
    'all renderPlanningTargets have isRenderPlanningTarget=true');
const rptIds = renderPlanningTargets.map(function (s) { return s.productTypeId; });
assert(rptIds.includes('message-book'),               'renderPlanningTargets includes message-book');
assert(rptIds.includes('framed-conversation-print'),  'renderPlanningTargets includes framed-conversation-print');
assert(rptIds.includes('mug'),                        'renderPlanningTargets includes mug');
assert(rptIds.includes('mini-keepsake-notebook'),     'renderPlanningTargets includes mini-keepsake-notebook');
assert(rptIds.includes('mini-message-sticker-pack'),  'renderPlanningTargets includes mini-message-sticker-pack');
assert(rptIds.includes('fridge-magnet'),              'renderPlanningTargets includes fridge-magnet');

// ── Suite 6: catalogAligned() ────────────────────────────────────────────────
suite('catalogAligned()');
const catalogAligned = KMEngine.ProductRenderSpecs.catalogAligned();
assert(Array.isArray(catalogAligned),                              'catalogAligned() returns array');
assert(catalogAligned.every(function (s) { return s.isCatalogProduct === true; }),
    'all catalogAligned have isCatalogProduct=true');
const caIds = catalogAligned.map(function (s) { return s.productTypeId; });
const catalogProductIds = KMEngine.ProductCatalog.all().map(function (p) { return p.id; });
catalogProductIds.forEach(function (id) {
    assert(caIds.includes(id), 'catalogAligned includes catalog product: ' + id);
});

// ── Suite 7: get() — known ids ───────────────────────────────────────────────
suite('get() — known ids');
assert(KMEngine.ProductRenderSpecs.get('message-book')              !== null, 'get(message-book) returns spec');
assert(KMEngine.ProductRenderSpecs.get('mug')                       !== null, 'get(mug) returns spec');
assert(KMEngine.ProductRenderSpecs.get('journal')                   !== null, 'get(journal) returns spec');
assert(KMEngine.ProductRenderSpecs.get('framed-conversation-print') !== null, 'get(framed-conversation-print) returns spec');
assert(KMEngine.ProductRenderSpecs.get('fridge-magnet')             !== null, 'get(fridge-magnet) returns spec');
assert(KMEngine.ProductRenderSpecs.get('mini-keepsake-notebook')    !== null, 'get(mini-keepsake-notebook) returns spec');
assert(KMEngine.ProductRenderSpecs.get('mini-message-sticker-pack') !== null, 'get(mini-message-sticker-pack) returns spec');
assert(KMEngine.ProductRenderSpecs.get('sticker-pack')              !== null, 'get(sticker-pack) returns spec');
assert(KMEngine.ProductRenderSpecs.get('wall-art')                  !== null, 'get(wall-art) returns spec');
assert(KMEngine.ProductRenderSpecs.get('gift-wrap')                 !== null, 'get(gift-wrap) returns spec');

// ── Suite 8: get() — unknown ids ─────────────────────────────────────────────
suite('get() — unknown ids');
assert(KMEngine.ProductRenderSpecs.get('nonexistent-product') === null, 'get(nonexistent) returns null');
assert(KMEngine.ProductRenderSpecs.get('')                    === null, 'get(empty string) returns null');
assert(KMEngine.ProductRenderSpecs.get(undefined)             === null, 'get(undefined) returns null');

// ── Suite 9: spec shape completeness ─────────────────────────────────────────
suite('spec shape — all specs');
const REQUIRED_FIELDS = [
    'productTypeId', 'displayName', 'isRenderPlanningTarget', 'isCatalogProduct',
    'renderStatus', 'recommendedInputType', 'minMemoryCount', 'maxRecommendedMemoryCount',
    'supportedMediaTypes', 'layoutFamily', 'surfaceType', 'textDensityConstraints',
    'messageBubbleTreatment', 'metadataPolicy', 'reactionRenderingPolicy',
    'attachmentHandlingPolicy', 'privacyWarningFlags', 'manufacturingReadinessNotes',
    'unsupportedContentBlockers', 'designReadinessNotes', 'gates',
];
REQUIRED_FIELDS.forEach(function (f) {
    assert(mbSpec.hasOwnProperty(f), 'message-book: has field ' + f);
});
all.forEach(function (s) {
    assert(typeof s.productTypeId === 'string',              s.productTypeId + ': productTypeId is string');
    assert(typeof s.displayName === 'string',                s.productTypeId + ': displayName is string');
    assert(typeof s.renderStatus === 'string',               s.productTypeId + ': renderStatus is string');
    assert(typeof s.gates === 'object' && s.gates !== null,  s.productTypeId + ': gates is object');
    GATE_FIELDS.forEach(function (g) {
        assert(typeof s.gates[g] === 'boolean',              s.productTypeId + ': gates.' + g + ' is boolean');
    });
    assert(Array.isArray(s.supportedMediaTypes),             s.productTypeId + ': supportedMediaTypes is array');
    assert(Array.isArray(s.privacyWarningFlags),             s.productTypeId + ': privacyWarningFlags is array');
    assert(Array.isArray(s.unsupportedContentBlockers),      s.productTypeId + ': unsupportedContentBlockers is array');
    assert(typeof s.minMemoryCount === 'number',             s.productTypeId + ': minMemoryCount is number');
    assert(typeof s.isRenderPlanningTarget === 'boolean',            s.productTypeId + ': isRenderPlanningTarget is boolean');
    assert(typeof s.isCatalogProduct === 'boolean',          s.productTypeId + ': isCatalogProduct is boolean');
});

// ── Suite 10: Resolver — resolve() ───────────────────────────────────────────
suite('Resolver — resolve()');

const group5 = { messages: [
    { text: 'Hello',         isAttachmentOnly: false },
    { text: 'World',         isAttachmentOnly: false },
    { text: 'How are you?',  isAttachmentOnly: false },
    { text: 'Great!',        isAttachmentOnly: false },
    { text: 'Good.',         isAttachmentOnly: false },
] };

// message-book with 5 clean messages — should be eligible
const mbResolved = KMEngine.ProductRenderSpecResolver.resolve('message-book', group5);
assert(mbResolved.resolved                          === true,    'resolve(message-book): resolved=true');
assert(mbResolved.spec                              !== null,    'resolve(message-book): spec present');
assert(mbResolved.memoryCount                       === 5,       'resolve(message-book): memoryCount=5');
assert(Array.isArray(mbResolved.blockers),                      'resolve(message-book): blockers is array');
assert(Array.isArray(mbResolved.warnings),                      'resolve(message-book): warnings is array');
assert(mbResolved.eligible                          === true,    'resolve(message-book, 5 messages): eligible=true');
assert(typeof mbResolved.overMaxRecommended         === 'boolean','resolve(message-book): overMaxRecommended is boolean');
assert(mbResolved.overMaxRecommended                === false,   'resolve(message-book): not over max (no max)');
assert(mbResolved.underMinRequired                  === false,   'resolve(message-book): not under min');
assert(mbResolved.hasAttachmentOnlyMessages         === false,   'resolve(message-book): no attachment-only messages');

// stub product — engine-not-supported blocker
const mugResolved = KMEngine.ProductRenderSpecResolver.resolve('mug', group5);
assert(mugResolved.resolved                         === true,    'resolve(mug): resolved=true');
assert(mugResolved.eligible                         === false,   'resolve(mug): eligible=false (engine not supported)');
assert(mugResolved.blockers.includes('engine-not-supported'),    'resolve(mug): has engine-not-supported blocker');

// unknown product
const unknownResolved = KMEngine.ProductRenderSpecResolver.resolve('unknown-product', group5);
assert(unknownResolved.resolved                     === false,   'resolve(unknown): resolved=false');
assert(unknownResolved.eligible                     === false,   'resolve(unknown): eligible=false');
assert(unknownResolved.blockers.includes('unknown-product-type'), 'resolve(unknown): has unknown-product-type blocker');

// empty group — below-minimum blocker
const emptyResolved = KMEngine.ProductRenderSpecResolver.resolve('message-book', { messages: [] });
assert(emptyResolved.underMinRequired               === true,    'resolve(message-book, empty): underMinRequired=true');
assert(emptyResolved.eligible                       === false,   'resolve(message-book, empty): eligible=false (below min)');
assert(emptyResolved.blockers.includes('below-minimum-memory-count'),
    'resolve(message-book, empty): has below-minimum-memory-count blocker');

// null group — treated as empty
const nullResolved = KMEngine.ProductRenderSpecResolver.resolve('message-book', null);
assert(nullResolved.memoryCount                     === 0,       'resolve(message-book, null group): memoryCount=0');
assert(nullResolved.underMinRequired                === true,    'resolve(message-book, null group): underMinRequired=true');

// fridge-magnet with 10 messages — over recommended
const bigGroup = { messages: Array.from({ length: 10 }, function (_, i) {
    return { text: 'msg' + i, isAttachmentOnly: false };
}) };
const magnetResolved = KMEngine.ProductRenderSpecResolver.resolve('fridge-magnet', bigGroup);
assert(magnetResolved.overMaxRecommended            === true,    'resolve(fridge-magnet, 10): overMaxRecommended=true');
assert(magnetResolved.warnings.includes('exceeds-recommended-memory-count'),
    'resolve(fridge-magnet, 10): warning for exceeds-recommended-memory-count');

// attachment-only block
const attachGroup = { messages: [
    { text: null, isAttachmentOnly: true },
    { text: null, isAttachmentOnly: true },
] };
const frameAttach = KMEngine.ProductRenderSpecResolver.resolve('framed-conversation-print', attachGroup);
assert(frameAttach.hasAttachmentOnlyMessages        === true,    'resolve(framed-print, attachments): hasAttachmentOnlyMessages=true');
assert(frameAttach.blockers.includes('attachment-only-messages-present'),
    'resolve(framed-print, attachments): has attachment-only-messages-present blocker');

// resolver passthrough methods
assert(KMEngine.ProductRenderSpecResolver.getSpec('message-book') !== null,    'resolver.getSpec(message-book) works');
assert(Array.isArray(KMEngine.ProductRenderSpecResolver.allSpecs()),           'resolver.allSpecs() returns array');
assert(Array.isArray(KMEngine.ProductRenderSpecResolver.renderPlanningTargetSpecs()),  'resolver.renderPlanningTargetSpecs() returns array');
assert(KMEngine.ProductRenderSpecResolver.allSpecs().length >= 10,             'resolver.allSpecs() has at least 10 entries');
assert(KMEngine.ProductRenderSpecResolver.renderPlanningTargetSpecs().length >= 6,     'resolver.renderPlanningTargetSpecs() has at least 6 entries');

// ── Suite 11: isRenderPlanningTarget does NOT imply commerce/manufacturing/publicClaim readiness ──
suite('render planning targets: no commerce/manufacturing/publicClaim readiness implied');
renderPlanningTargets.forEach(function (s) {
    assert(s.gates.commerceSupported      === false,
        s.productTypeId + ': isRenderPlanningTarget does not imply commerceSupported');
    assert(s.gates.manufacturingSupported === false,
        s.productTypeId + ': isRenderPlanningTarget does not imply manufacturingSupported');
    assert(s.gates.publicClaimSupported   === false,
        s.productTypeId + ': isRenderPlanningTarget does not imply publicClaimSupported');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────');
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
