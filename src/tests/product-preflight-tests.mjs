/**
 * Package 3E — ProductPreflight tests.
 * Run with: node src/tests/product-preflight-tests.mjs
 *
 * PAGINATION_STABILITY check is tested with lightweight mock functions —
 * the real generateCompositionUnits/paginateUnits live in index.html and
 * are not loadable in Node.js without a browser. The mock strategy is
 * correct because the runner's logic under test is: "call the injected
 * functions twice and compare page counts."
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
    runInContext(code, ctx);
}

load('src/products/product-preflight.js');

const PP = ctx.window.KMEngine.ProductPreflight;

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }
function assert(cond, label) {
    if (cond) { console.log('  PASS  ' + label); passed++; }
    else       { console.error('  FAIL  ' + label); failed++; }
}

// ── Mock helpers ──────────────────────────────────────────────────────────────

// Stable mock: returns same page count every call.
function stableMockGen(state, contactName) {
    return state && state.sections
        ? state.sections.map(function (s, i) { return { type: 'content', idx: i }; })
        : [{ type: 'content', idx: 0 }, { type: 'content', idx: 1 }];
}
function stableMockPag(units) {
    // 1 unit = 1 page for simplicity
    return units.map(function (u, i) { return { pageNumber: i + 1, units: [u] }; });
}

// Unstable mock: returns different counts on successive calls (simulates instability).
var _callCount = 0;
function unstableMockGen(state, contactName) {
    _callCount++;
    // First call: 3 units; second call: 4 units
    var count = _callCount % 2 === 1 ? 3 : 4;
    var units = [];
    for (var i = 0; i < count; i++) units.push({ type: 'content', idx: i });
    return units;
}
function unstableMockPag(units) {
    return units.map(function (u, i) { return { pageNumber: i + 1, units: [u] }; });
}

// ── Suite 1: SEVERITY and CHECK_STATUS constants ──────────────────────────────

suite('Suite 1 — SEVERITY constants');
assert(PP.SEVERITY.INFO    === 'info',    'SEVERITY.INFO');
assert(PP.SEVERITY.WARNING === 'warning', 'SEVERITY.WARNING');
assert(PP.SEVERITY.ERROR   === 'error',   'SEVERITY.ERROR');

suite('Suite 2 — CHECK_STATUS constants');
assert(PP.CHECK_STATUS.PASSED         === 'passed',         'CHECK_STATUS.PASSED');
assert(PP.CHECK_STATUS.FAILED         === 'failed',         'CHECK_STATUS.FAILED');
assert(PP.CHECK_STATUS.NOT_APPLICABLE === 'not-applicable', 'CHECK_STATUS.NOT_APPLICABLE');
assert(PP.CHECK_STATUS.SKIPPED        === 'skipped',        'CHECK_STATUS.SKIPPED');

// ── Suite 3: CHECK_REGISTRY ───────────────────────────────────────────────────

suite('Suite 3 — CHECK_REGISTRY has all 10 checks');
var requiredKeys = [
    'PAGE_COUNT_CONSISTENCY', 'PAGE_COUNT_PARITY', 'FONT_AVAILABILITY',
    'EMOJI_STRATEGY_CONFIRMED', 'SAFE_AREA_VIOLATIONS', 'SPINE_WIDTH_KNOWN',
    'COVER_INTERIOR_CONSISTENCY', 'LOW_RESOLUTION_IMAGES',
    'PAGINATION_STABILITY', 'OVERFLOW_DETECTION'
];
assert(Object.keys(PP.CHECK_REGISTRY).length === 10, '10 checks in registry');
for (var i = 0; i < requiredKeys.length; i++) {
    var k = requiredKeys[i];
    assert(PP.CHECK_REGISTRY[k] !== undefined,       k + ' exists');
    assert(typeof PP.CHECK_REGISTRY[k].name === 'string',      k + '.name is string');
    assert(typeof PP.CHECK_REGISTRY[k].severity === 'string',  k + '.severity is string');
    assert(typeof PP.CHECK_REGISTRY[k].blocking === 'boolean', k + '.blocking is boolean');
    assert(Array.isArray(PP.CHECK_REGISTRY[k].requiredInputs), k + '.requiredInputs is array');
}

// ── Suite 4: run() unknown check ──────────────────────────────────────────────

suite('Suite 4 — run() unknown check returns skipped');
var unknown = PP.run('UNKNOWN_CHECK_XYZ', {});
assert(unknown.status   === 'skipped', 'unknown check → skipped');
assert(unknown.blocking === false,     'unknown check → non-blocking');

// ── Suite 5: PAGINATION_STABILITY — stable ────────────────────────────────────

suite('Suite 5 — PAGINATION_STABILITY passes when stable');
var stableResult = PP.run('PAGINATION_STABILITY', {
    messageBookState:        { sections: [{ id: 's1' }, { id: 's2' }] },
    generateCompositionUnits: stableMockGen,
    paginateUnits:           stableMockPag,
    contactName:             'Alex'
});
assert(stableResult.status   === 'passed',         'PAGINATION_STABILITY passes on stable output');
assert(stableResult.blocking === true,             'PAGINATION_STABILITY is blocking');
assert(stableResult.severity === 'error',          'PAGINATION_STABILITY severity is error');
assert(typeof stableResult.message === 'string',   'message is string');
assert(stableResult.message.includes('stable') || stableResult.message.includes('Stable'),
    'message mentions stability');

// ── Suite 6: PAGINATION_STABILITY — unstable ─────────────────────────────────

suite('Suite 6 — PAGINATION_STABILITY fails when unstable');
_callCount = 0; // reset counter before test
var unstableResult = PP.run('PAGINATION_STABILITY', {
    messageBookState:        { sections: [] },
    generateCompositionUnits: unstableMockGen,
    paginateUnits:           unstableMockPag,
    contactName:             'Alex'
});
assert(unstableResult.status   === 'failed', 'PAGINATION_STABILITY fails on unstable output');
assert(unstableResult.blocking === true,     'still blocking on failure');
assert(unstableResult.message.includes('run 1') || unstableResult.message.includes('instab'),
    'failure message explains divergence');

// ── Suite 7: PAGINATION_STABILITY — missing inputs ────────────────────────────

suite('Suite 7 — PAGINATION_STABILITY returns not-applicable when inputs missing');
var noInputs = PP.run('PAGINATION_STABILITY', {});
assert(noInputs.status === 'not-applicable', 'missing inputs → not-applicable');

var noGen = PP.run('PAGINATION_STABILITY', {
    messageBookState: {},
    paginateUnits: stableMockPag
});
assert(noGen.status === 'not-applicable', 'missing generateCompositionUnits → not-applicable');

var noPag = PP.run('PAGINATION_STABILITY', {
    messageBookState: {},
    generateCompositionUnits: stableMockGen
});
assert(noPag.status === 'not-applicable', 'missing paginateUnits → not-applicable');

// ── Suite 8: all other 9 checks → not-applicable ──────────────────────────────

suite('Suite 8 — all other 9 checks return not-applicable');
var gatedChecks = requiredKeys.filter(function (k) { return k !== 'PAGINATION_STABILITY'; });
for (var gi = 0; gi < gatedChecks.length; gi++) {
    var gk = gatedChecks[gi];
    var gr = PP.run(gk, {}); // no inputs provided
    assert(gr.status === 'not-applicable', gk + ' → not-applicable without inputs');
    assert(typeof gr.message === 'string' && gr.message.length > 0,
        gk + ' → not-applicable message is non-empty');
}

// ── Suite 9: createReport() and runAll() ──────────────────────────────────────

suite('Suite 9 — createReport() aggregation');

// All not-applicable → overallStatus: incomplete
var allNA = Array(10).fill(null).map(function (_, i) {
    return { checkName: 'check_' + i, status: 'not-applicable', severity: 'error', blocking: true };
});
var reportNA = PP.createReport(allNA);
assert(reportNA.notApplicableCount   === 10,           '10 not-applicable');
assert(reportNA.passedCount          === 0,            '0 passed');
assert(reportNA.failedCount          === 0,            '0 failed');
assert(reportNA.runnableCount        === 0,            '0 runnable');
assert(reportNA.missingInputCount    === 10,           '10 missing inputs');
assert(reportNA.blockingFailureCount === 0,            '0 blocking failures');
assert(reportNA.overallStatus        === 'incomplete', 'incomplete when all NA');

// One blocking failure → overallStatus: failed
var withFailure = [
    { checkName: 'pagination_stability', status: 'failed',         severity: 'error',   blocking: true },
    { checkName: 'page_count_parity',    status: 'not-applicable', severity: 'warning', blocking: false }
];
var reportFail = PP.createReport(withFailure);
assert(reportFail.blockingFailureCount === 1,      '1 blocking failure');
assert(reportFail.overallStatus        === 'failed', 'failed when blocking runnable check fails');

// All passed → overallStatus: passed
var allPass = [
    { checkName: 'check_a', status: 'passed', severity: 'error', blocking: true },
    { checkName: 'check_b', status: 'passed', severity: 'error', blocking: true }
];
var reportPass = PP.createReport(allPass);
assert(reportPass.passedCount    === 2,      '2 passed');
assert(reportPass.overallStatus  === 'passed', 'passed when all checks ran and passed');

// No checks ran → overallStatus: skipped
var empty = PP.createReport([]);
assert(empty.overallStatus === 'skipped', 'skipped when no checks ran');

suite('Suite 10 — runAll() returns incomplete with only PAGINATION_STABILITY input');
var stableReport = PP.runAll({
    messageBookState:        { sections: [{ id: 's1' }] },
    generateCompositionUnits: stableMockGen,
    paginateUnits:           stableMockPag,
    contactName:             'Alex'
});
assert(stableReport.overallStatus     === 'incomplete',    'runAll is incomplete (9 checks have NA inputs)');
assert(stableReport.runnableCount     >= 1,                'at least 1 runnable check (PAGINATION_STABILITY)');
assert(stableReport.notApplicableCount >= 9,               'at least 9 not-applicable');
assert(stableReport.passedCount       >= 1,                'PAGINATION_STABILITY passes');
assert(Array.isArray(stableReport.results),                'results is array');
assert(stableReport.results.length    === 10,              '10 results in report');

// ── Suite 11: semantic guards ─────────────────────────────────────────────────

suite('Suite 11 — semantic guards (no manufacturing/commerce/proof fields)');
var preflightSrc = readFileSync(join(ROOT, 'src/products/product-preflight.js'), 'utf8');
var forbidden2 = ['isManufacturingReady', 'manufacturingReady', 'checkoutReady',
                  'proofReady', 'orderReady', 'exportReady', 'commerceReady'];
for (var fi = 0; fi < forbidden2.length; fi++) {
    assert(!preflightSrc.includes(forbidden2[fi]),
        'no "' + forbidden2[fi] + '" in product-preflight.js');
}

// overallStatus field present, no manufacturing-ready equivalent
assert(stableReport.overallStatus !== undefined,    'overallStatus exists');
assert(stableReport.overallStatus !== 'manufacturing-ready',  'overallStatus is not manufacturing-ready');
assert(stableReport['isManufacturingReady']     === undefined, 'no isManufacturingReady function');
assert(stableReport['manufacturingReady']       === undefined, 'no manufacturingReady field');
assert(stableReport['proofReady']               === undefined, 'no proofReady field');

// ── Final summary ─────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(44));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
