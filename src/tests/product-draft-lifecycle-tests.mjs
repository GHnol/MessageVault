/**
 * Package 3F — ProductDraftLifecycle tests.
 * Run with: node src/tests/product-draft-lifecycle-tests.mjs
 */

import { readFileSync }               from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath }              from 'node:url';
import { dirname, join }              from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

const ctx = createContext({ window: {}, console });

function load(rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    runInContext(code, ctx);
}

load('src/products/product-draft-state.js');
load('src/products/product-draft-lifecycle.js');

const PDL = ctx.window.KMEngine.ProductDraftLifecycle;
const PDS = ctx.window.KMEngine.ProductDraftState;

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }
function assert(cond, label) {
    if (cond) { console.log('  PASS  ' + label); passed++; }
    else       { console.error('  FAIL  ' + label); failed++; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGroup(opts) {
    opts = opts || {};
    return {
        id:            opts.id            || 'kg-test',
        messages:      opts.messages      || [],
        messageIndices: opts.messageIndices || [],
        customName:    opts.customName    || null,
        chosenTypeId:  opts.chosenTypeId  || null,
        lastComposedAt: opts.lastComposedAt || null,
        memoryIds:     opts.memoryIds     || [],
        sourcePlatformIds: opts.sourcePlatformIds || [],
        productDrafts: opts.productDrafts !== undefined ? opts.productDrafts : [],
        metadata:      opts.metadata      || {}
    };
}

// Advance a group draft to a given status through the full chain.
function advanceGroupTo(group, typeId, targetStatus) {
    var chain = [];
    if (targetStatus === 'in-progress')          chain = ['none→in-progress'];
    if (targetStatus === 'ready-for-preflight')  chain = ['none→in-progress', 'in-progress→ready-for-preflight'];
    if (targetStatus === 'preflight-passed')     chain = ['none→in-progress', 'in-progress→ready-for-preflight', 'ready-for-preflight→preflight-passed'];
    if (targetStatus === 'preflight-failed')     chain = ['none→in-progress', 'in-progress→ready-for-preflight', 'ready-for-preflight→preflight-failed'];

    PDL.initDraft(group, typeId);
    var steps = {
        'none→in-progress':                    ['none',                'in-progress'],
        'in-progress→ready-for-preflight':     ['in-progress',         'ready-for-preflight'],
        'ready-for-preflight→preflight-passed': ['ready-for-preflight', 'preflight-passed'],
        'ready-for-preflight→preflight-failed': ['ready-for-preflight', 'preflight-failed']
    };
    for (var i = 0; i < chain.length; i++) {
        var step = steps[chain[i]];
        PDL.advanceDraft(group, typeId, step[1]);
    }
    return PDL.getDraft(group, typeId);
}

// ── Suite 1: Module shape and API surface ─────────────────────────────────────

suite('Suite 1 — Module shape and API surface');
assert(PDL !== null && typeof PDL === 'object', 'KMEngine.ProductDraftLifecycle is an object');
assert(typeof PDL.getDraft            === 'function', 'getDraft is a function');
assert(typeof PDL.initDraft           === 'function', 'initDraft is a function');
assert(typeof PDL.advanceDraft        === 'function', 'advanceDraft is a function');
assert(typeof PDL.applyPreflightResult === 'function', 'applyPreflightResult is a function');
assert(typeof PDL.resetDraft          === 'function', 'resetDraft is a function');

// ── Suite 2: getDraft ─────────────────────────────────────────────────────────

suite('Suite 2 — getDraft');
{
    assert(PDL.getDraft(null, 'message-book') === null,
        'null group → null');
    assert(PDL.getDraft({ id: 'g1' }, 'message-book') === null,
        'group without productDrafts → null');
    assert(PDL.getDraft({ productDrafts: [] }, 'message-book') === null,
        'empty productDrafts → null');
    assert(PDL.getDraft(makeGroup(), 'message-book') === null,
        'no matching productTypeId → null');

    const g = makeGroup({ productDrafts: [
        { productTypeId: 'message-book', status: 'none', createdAt: 't', updatedAt: 't', preflightRunAt: null, notes: null }
    ]});
    assert(PDL.getDraft(g, 'message-book') !== null,
        'returns matching draft when found');
    assert(PDL.getDraft(g, 'message-book').productTypeId === 'message-book',
        'returned draft has correct productTypeId');

    assert(PDL.getDraft(makeGroup(), null) === null,
        'null productTypeId → null');
    assert(PDL.getDraft(makeGroup(), '') === null,
        'empty string productTypeId → null');
}

// ── Suite 3: initDraft ────────────────────────────────────────────────────────

suite('Suite 3 — initDraft');
{
    const r1 = PDL.initDraft(null, 'message-book');
    assert(r1.success === false, 'null group → success: false');
    assert(typeof r1.error === 'string' && r1.error.length > 0, 'null group → has error string');
    assert(r1.draft === null, 'null group → draft: null');

    const r2 = PDL.initDraft({}, '');
    assert(r2.success === false, 'empty productTypeId → success: false');

    const r3 = PDL.initDraft({}, null);
    assert(r3.success === false, 'null productTypeId → success: false');

    const g = makeGroup();
    const r4 = PDL.initDraft(g, 'message-book');
    assert(r4.success === true, 'creates draft → success: true');
    assert(r4.error === null,   'creates draft → error: null');
    assert(r4.draft !== null,   'creates draft → draft is not null');
    assert(r4.draft.productTypeId === 'message-book', 'draft.productTypeId matches');
    assert(r4.draft.status === 'none', 'new draft status is none');
    assert(g.productDrafts.length === 1, 'productDrafts array has 1 entry after initDraft');

    const r5 = PDL.initDraft(g, 'message-book');
    assert(r5.success === true,           'idempotent: second initDraft succeeds');
    assert(g.productDrafts.length === 1,  'idempotent: no duplicate appended');
    assert(r5.draft === r4.draft,         'idempotent: returns same draft reference');

    const g2 = makeGroup();
    PDL.initDraft(g2, 'message-book');
    PDL.initDraft(g2, 'journal');
    assert(g2.productDrafts.length === 2, 'separate productTypeIds create separate drafts');
    assert(PDL.getDraft(g2, 'message-book') !== null, 'message-book draft exists');
    assert(PDL.getDraft(g2, 'journal') !== null,      'journal draft exists');

    const g3 = makeGroup();
    delete g3.productDrafts;
    const r6 = PDL.initDraft(g3, 'message-book');
    assert(r6.success === true,              'initializes missing productDrafts array');
    assert(Array.isArray(g3.productDrafts),  'group.productDrafts is now an array');
    assert(g3.productDrafts.length === 1,    'group.productDrafts has 1 entry');
}

// ── Suite 4: advanceDraft ─────────────────────────────────────────────────────

suite('Suite 4 — advanceDraft');
{
    const g1 = makeGroup();
    PDL.initDraft(g1, 'message-book');
    const rA = PDL.advanceDraft(g1, 'message-book', 'in-progress');
    assert(rA.success === true,              'none → in-progress: success');
    assert(rA.draft.status === 'in-progress','none → in-progress: status updated');

    const rB = PDL.advanceDraft(g1, 'message-book', 'ready-for-preflight');
    assert(rB.success === true,                       'in-progress → ready-for-preflight: success');
    assert(rB.draft.status === 'ready-for-preflight', 'in-progress → ready-for-preflight: status updated');

    const g2 = makeGroup();
    advanceGroupTo(g2, 'message-book', 'ready-for-preflight');
    const rC = PDL.advanceDraft(g2, 'message-book', 'preflight-passed');
    assert(rC.success === true,                    'ready-for-preflight → preflight-passed: success');
    assert(rC.draft.status === 'preflight-passed', 'ready-for-preflight → preflight-passed: status updated');

    const g3 = makeGroup();
    advanceGroupTo(g3, 'message-book', 'ready-for-preflight');
    const rD = PDL.advanceDraft(g3, 'message-book', 'preflight-failed');
    assert(rD.success === true,                    'ready-for-preflight → preflight-failed: success');
    assert(rD.draft.status === 'preflight-failed', 'ready-for-preflight → preflight-failed: status updated');

    const g4 = makeGroup();
    advanceGroupTo(g4, 'message-book', 'preflight-failed');
    const rE = PDL.advanceDraft(g4, 'message-book', 'in-progress');
    assert(rE.success === true,              'preflight-failed → in-progress: success');
    assert(rE.draft.status === 'in-progress','preflight-failed → in-progress: status updated');

    const g5 = makeGroup();
    advanceGroupTo(g5, 'message-book', 'preflight-passed');
    const rF = PDL.advanceDraft(g5, 'message-book', 'in-progress');
    assert(rF.success === true,              'preflight-passed → in-progress: success');
    assert(rF.draft.status === 'in-progress','preflight-passed → in-progress: status updated');

    const g6 = makeGroup();
    PDL.initDraft(g6, 'message-book');
    const rG = PDL.advanceDraft(g6, 'message-book', 'preflight-passed');
    assert(rG.success === false,          'none → preflight-passed: blocked (invalid transition)');
    assert(typeof rG.error === 'string',  'blocked transition returns error string');

    const g7 = makeGroup();
    const rH = PDL.advanceDraft(g7, 'message-book', 'in-progress');
    assert(rH.success === false,              'missing draft returns error');
    assert(rH.error.includes('draft-not-found'), 'missing draft error message');

    const rI = PDL.advanceDraft(null, 'message-book', 'in-progress');
    assert(rI.success === false, 'null group returns error');
}

// ── Suite 5: applyPreflightResult ─────────────────────────────────────────────

suite('Suite 5 — applyPreflightResult');
{
    const g1 = makeGroup();
    advanceGroupTo(g1, 'message-book', 'ready-for-preflight');
    const rA = PDL.applyPreflightResult(g1, 'message-book', { overallStatus: 'passed' });
    assert(rA.success === true,                    'passed report → success');
    assert(rA.draft.status === 'preflight-passed', 'passed report → draft advances to preflight-passed');

    const g2 = makeGroup();
    advanceGroupTo(g2, 'message-book', 'ready-for-preflight');
    const rB = PDL.applyPreflightResult(g2, 'message-book', { overallStatus: 'failed' });
    assert(rB.success === true,                    'failed report → success');
    assert(rB.draft.status === 'preflight-failed', 'failed report → draft advances to preflight-failed');

    const g3 = makeGroup();
    advanceGroupTo(g3, 'message-book', 'ready-for-preflight');
    const rC = PDL.applyPreflightResult(g3, 'message-book', { overallStatus: 'incomplete' });
    assert(rC.success === false, 'incomplete report → success: false');
    assert(rC.error === 'preflight-incomplete', 'incomplete report → error: preflight-incomplete');
    assert(PDL.getDraft(g3, 'message-book').status === 'ready-for-preflight',
        'incomplete report → draft status unchanged');

    const g4 = makeGroup();
    advanceGroupTo(g4, 'message-book', 'ready-for-preflight');
    const rD = PDL.applyPreflightResult(g4, 'message-book', { overallStatus: 'skipped' });
    assert(rD.success === false,             'skipped report → success: false');
    assert(rD.error === 'preflight-skipped', 'skipped report → error: preflight-skipped');

    const g5 = makeGroup();
    PDL.initDraft(g5, 'message-book');
    const rE = PDL.applyPreflightResult(g5, 'message-book', { overallStatus: 'passed' });
    assert(rE.success === false, 'wrong source state (none) → precondition-failed');
    assert(rE.error.includes('precondition-failed'), 'precondition-failed error message');

    const g6 = makeGroup();
    advanceGroupTo(g6, 'message-book', 'preflight-passed');
    const rF = PDL.applyPreflightResult(g6, 'message-book', { overallStatus: 'passed' });
    assert(rF.success === false, 'wrong source state (preflight-passed) → precondition-failed');

    const rG = PDL.applyPreflightResult(makeGroup(), 'message-book', { overallStatus: 'passed' });
    assert(rG.success === false, 'no draft → draft-not-found error');

    const rH = PDL.applyPreflightResult(makeGroup(), 'message-book', null);
    assert(rH.success === false, 'null preflightReport → error');

    const rI = PDL.applyPreflightResult(makeGroup(), 'message-book', { noStatus: true });
    assert(rI.success === false, 'report missing overallStatus → error');

    const g7 = makeGroup();
    advanceGroupTo(g7, 'message-book', 'ready-for-preflight');
    const rJ = PDL.applyPreflightResult(g7, 'message-book', { overallStatus: 'unknown-value' });
    assert(rJ.success === false, 'unknown overallStatus → error');
    assert(rJ.error.includes('unknown-overall-status'), 'unknown overallStatus error message');
}

// ── Suite 6: resetDraft ───────────────────────────────────────────────────────

suite('Suite 6 — resetDraft');
{
    const g1 = makeGroup();
    advanceGroupTo(g1, 'message-book', 'ready-for-preflight');
    const rA = PDL.resetDraft(g1, 'message-book');
    assert(rA.success === true,              'resets ready-for-preflight → success');
    assert(rA.draft.status === 'in-progress','ready-for-preflight resets to in-progress');

    const g2 = makeGroup();
    advanceGroupTo(g2, 'message-book', 'preflight-passed');
    const rB = PDL.resetDraft(g2, 'message-book');
    assert(rB.success === true,              'resets preflight-passed → success');
    assert(rB.draft.status === 'in-progress','preflight-passed resets to in-progress');

    const g3 = makeGroup();
    advanceGroupTo(g3, 'message-book', 'preflight-failed');
    const rC = PDL.resetDraft(g3, 'message-book');
    assert(rC.success === true,              'resets preflight-failed → success');
    assert(rC.draft.status === 'in-progress','preflight-failed resets to in-progress');

    const g4 = makeGroup();
    PDL.initDraft(g4, 'message-book');
    const rD = PDL.resetDraft(g4, 'message-book');
    assert(rD.success === false,             'fails from none');
    assert(rD.error.includes('reset-not-allowed'), 'fails from none: reset-not-allowed error');

    const g5 = makeGroup();
    PDL.initDraft(g5, 'message-book');
    PDL.advanceDraft(g5, 'message-book', 'in-progress');
    const rE = PDL.resetDraft(g5, 'message-book');
    assert(rE.success === false,             'fails from in-progress');
    assert(rE.error.includes('reset-not-allowed'), 'fails from in-progress: reset-not-allowed error');

    const rF = PDL.resetDraft(makeGroup(), 'message-book');
    assert(rF.success === false, 'missing draft → error');

    const rG = PDL.resetDraft(null, 'message-book');
    assert(rG.success === false, 'null group → error');
}

// ── Suite 7: Mutation model ───────────────────────────────────────────────────

suite('Suite 7 — Mutation model');
{
    const g1 = makeGroup();
    PDL.initDraft(g1, 'message-book');
    assert(g1.productDrafts.length === 1, 'initDraft mutates group.productDrafts in place');

    const g2 = makeGroup();
    PDL.initDraft(g2, 'message-book');
    const before = g2.productDrafts.length;
    PDL.advanceDraft(g2, 'message-book', 'in-progress');
    assert(g2.productDrafts.length === before, 'advanceDraft does not change productDrafts length');
    assert(g2.productDrafts[0].status === 'in-progress', 'advanceDraft replaces array entry in place');

    const g3 = makeGroup();
    PDL.initDraft(g3, 'message-book');
    const r = PDL.advanceDraft(g3, 'message-book', 'in-progress');
    assert(r.draft === g3.productDrafts[0], 'returned draft is the updated array entry');

    const g4 = makeGroup();
    PDL.initDraft(g4, 'message-book');
    PDL.initDraft(g4, 'journal');
    PDL.advanceDraft(g4, 'message-book', 'in-progress');
    assert(PDL.getDraft(g4, 'journal').status === 'none',
        'unrelated drafts not modified by advanceDraft on different productTypeId');

    const g5 = makeGroup();
    PDL.initDraft(g5, 'message-book');
    PDL.advanceDraft(g5, 'message-book', 'in-progress');
    const after = PDL.getDraft(g5, 'message-book');
    assert(after !== null && after.status === 'in-progress',
        'getDraft returns updated draft after advanceDraft');

    const g6 = makeGroup();
    advanceGroupTo(g6, 'message-book', 'preflight-passed');
    PDL.resetDraft(g6, 'message-book');
    assert(g6.productDrafts[0].status === 'in-progress',
        'resetDraft mutates group.productDrafts in place');
}

// ── Suite 8: Duplicate behavior ───────────────────────────────────────────────

suite('Suite 8 — Duplicate behavior');
{
    const g1 = makeGroup({ productDrafts: [
        { productTypeId: 'message-book', status: 'none',        createdAt: 't', updatedAt: 't', preflightRunAt: null, notes: null },
        { productTypeId: 'message-book', status: 'in-progress', createdAt: 't', updatedAt: 't', preflightRunAt: null, notes: null }
    ]});
    const found = PDL.getDraft(g1, 'message-book');
    assert(found !== null && found.status === 'none',
        'getDraft returns first matching productTypeId when duplicates exist');

    const g2 = makeGroup();
    const r1 = PDL.initDraft(g2, 'message-book');
    const r2 = PDL.initDraft(g2, 'message-book');
    assert(r2.success === true,          'second initDraft succeeds (idempotent)');
    assert(g2.productDrafts.length === 1,'no duplicate appended by second initDraft');
    assert(r1.draft === r2.draft,        'second initDraft returns same draft reference');
}

// ── Suite 9: Semantic guard ───────────────────────────────────────────────────

suite('Suite 9 — Semantic guard (source file must not contain forbidden terms)');
{
    const src = readFileSync(
        join(ROOT, 'src/products/product-draft-lifecycle.js'), 'utf8'
    );
    const forbidden = [
        'proofApprovalStates',
        'proofApproved',
        'checkoutReady',
        'paymentReady',
        'commerceReady',
        'manufacturingReady',
        'proofReady',
        'exportReady',
        'orderReady',
        'isManufacturingReady',
        'proofSupported',
        'commerceSupported',
        'manufacturingSupported'
    ];
    for (var i = 0; i < forbidden.length; i++) {
        assert(!src.includes(forbidden[i]),
            'no "' + forbidden[i] + '" in product-draft-lifecycle.js');
    }
}

// ── Final summary ─────────────────────────────────────────────────────────────

console.log('\n=== Product Draft Lifecycle Tests ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);
if (failed > 0) process.exit(1);
