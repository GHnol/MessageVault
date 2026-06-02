/**
 * Package 3E — ProductDraftState tests.
 * Run with: node src/tests/product-draft-state-tests.mjs
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

load('src/products/product-draft-state.js');

const PDS = ctx.window.KMEngine.ProductDraftState;

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }
function assert(cond, label) {
    if (cond) { console.log('  PASS  ' + label); passed++; }
    else       { console.error('  FAIL  ' + label); failed++; }
}

// ── Suite 1: STATUS constants ─────────────────────────────────────────────────

suite('Suite 1 — STATUS constants');
assert(PDS.STATUS.NONE                === 'none',                 'STATUS.NONE value');
assert(PDS.STATUS.IN_PROGRESS         === 'in-progress',          'STATUS.IN_PROGRESS value');
assert(PDS.STATUS.READY_FOR_PREFLIGHT === 'ready-for-preflight',  'STATUS.READY_FOR_PREFLIGHT value');
assert(PDS.STATUS.PREFLIGHT_PASSED    === 'preflight-passed',     'STATUS.PREFLIGHT_PASSED value');
assert(PDS.STATUS.PREFLIGHT_FAILED    === 'preflight-failed',     'STATUS.PREFLIGHT_FAILED value');
assert(Object.keys(PDS.STATUS).length === 5,                      '5 status values total');

// Verify STATUS is frozen (assigning to it should silently fail in non-strict outer context)
try {
    var orig = PDS.STATUS.NONE;
    PDS.STATUS.NONE = 'mutated';
    assert(PDS.STATUS.NONE === orig, 'STATUS is frozen (write silently fails)');
} catch (e) {
    // TypeError in strict mode is also acceptable
    assert(true, 'STATUS is frozen (write threw)');
}

// ── Suite 2: isValidStatus ───────────────────────────────────────────────────

suite('Suite 2 — isValidStatus');
assert(PDS.isValidStatus('none'),                'none is valid');
assert(PDS.isValidStatus('in-progress'),         'in-progress is valid');
assert(PDS.isValidStatus('ready-for-preflight'), 'ready-for-preflight is valid');
assert(PDS.isValidStatus('preflight-passed'),    'preflight-passed is valid');
assert(PDS.isValidStatus('preflight-failed'),    'preflight-failed is valid');
assert(!PDS.isValidStatus('approved'),           'approved is not valid');
assert(!PDS.isValidStatus('pending-review'),     'pending-review is not valid');
assert(!PDS.isValidStatus(''),                   'empty string is not valid');
assert(!PDS.isValidStatus(null),                 'null is not valid');
assert(!PDS.isValidStatus(undefined),            'undefined is not valid');

// ── Suite 3: canAdvance ──────────────────────────────────────────────────────

suite('Suite 3 — canAdvance allowed transitions');
assert(PDS.canAdvance('none',                'in-progress'),          'none → in-progress');
assert(PDS.canAdvance('in-progress',         'ready-for-preflight'), 'in-progress → ready-for-preflight');
assert(PDS.canAdvance('ready-for-preflight', 'preflight-passed'),    'ready-for-preflight → preflight-passed');
assert(PDS.canAdvance('ready-for-preflight', 'preflight-failed'),    'ready-for-preflight → preflight-failed');
assert(PDS.canAdvance('preflight-failed',    'in-progress'),         'preflight-failed → in-progress');
assert(PDS.canAdvance('preflight-passed',    'in-progress'),         'preflight-passed → in-progress');

suite('Suite 3b — canAdvance blocked transitions');
assert(!PDS.canAdvance('none',                'ready-for-preflight'), 'none → ready-for-preflight blocked');
assert(!PDS.canAdvance('none',                'preflight-passed'),    'none → preflight-passed blocked');
assert(!PDS.canAdvance('none',                'preflight-failed'),    'none → preflight-failed blocked');
assert(!PDS.canAdvance('in-progress',         'none'),                'in-progress → none blocked');
assert(!PDS.canAdvance('in-progress',         'preflight-passed'),    'in-progress → preflight-passed blocked');
assert(!PDS.canAdvance('in-progress',         'preflight-failed'),    'in-progress → preflight-failed blocked');
assert(!PDS.canAdvance('ready-for-preflight', 'in-progress'),        'ready-for-preflight → in-progress blocked');
assert(!PDS.canAdvance('ready-for-preflight', 'none'),               'ready-for-preflight → none blocked');
assert(!PDS.canAdvance('preflight-passed',    'ready-for-preflight'),'preflight-passed → ready-for-preflight blocked');
assert(!PDS.canAdvance('preflight-failed',    'ready-for-preflight'),'preflight-failed → ready-for-preflight blocked');
assert(!PDS.canAdvance('preflight-failed',    'preflight-passed'),   'preflight-failed → preflight-passed blocked');
assert(!PDS.canAdvance('preflight-passed',    'preflight-failed'),   'preflight-passed → preflight-failed blocked');

// ── Suite 4: create() ────────────────────────────────────────────────────────

suite('Suite 4 — create() success');
var cr = PDS.create({ productTypeId: 'message-book' });
assert(cr.success === true,                         'success is true');
assert(cr.error   === null,                         'error is null');
assert(cr.state   !== null,                         'state is not null');
assert(cr.state.productTypeId    === 'message-book','productTypeId set');
assert(cr.state.status           === 'none',        'initial status is none');
assert(typeof cr.state.createdAt === 'string',      'createdAt is string');
assert(typeof cr.state.updatedAt === 'string',      'updatedAt is string');
assert(cr.state.preflightRunAt   === null,          'preflightRunAt starts null');
assert(cr.state.notes            === null,          'notes starts null (no opts.notes)');

suite('Suite 4b — create() with notes');
var crn = PDS.create({ productTypeId: 'message-book', notes: 'draft started' });
assert(crn.success === true,                     'create with notes succeeds');
assert(crn.state.notes === 'draft started',      'notes preserved');

suite('Suite 4c — create() validation failures');
var fail1 = PDS.create(null);
assert(fail1.success === false,  'null opts → failure');
assert(fail1.state   === null,   'null opts → state null');
var fail2 = PDS.create({});
assert(fail2.success === false,  'missing productTypeId → failure');
var fail3 = PDS.create({ productTypeId: '' });
assert(fail3.success === false,  'empty productTypeId → failure');
var fail4 = PDS.create({ productTypeId: 42 });
assert(fail4.success === false,  'non-string productTypeId → failure');

// ── Suite 5: advance() ───────────────────────────────────────────────────────

suite('Suite 5 — advance() success path');
var s0 = PDS.create({ productTypeId: 'message-book' }).state;
var r1 = PDS.advance(s0, 'in-progress');
assert(r1.success === true,              'none→in-progress success');
assert(r1.state.status === 'in-progress','status updated');
assert(r1.state.createdAt === s0.createdAt, 'createdAt preserved');
assert(r1.state.updatedAt !== s0.createdAt || r1.state.updatedAt >= s0.updatedAt, 'updatedAt advances');
assert(r1.state.preflightRunAt === null, 'preflightRunAt unchanged (not a preflight transition)');

var r2 = PDS.advance(r1.state, 'ready-for-preflight');
assert(r2.success === true,                       'in-progress→ready-for-preflight success');
assert(r2.state.status === 'ready-for-preflight', 'status updated');

var r3a = PDS.advance(r2.state, 'preflight-passed');
assert(r3a.success === true,                      'ready-for-preflight→preflight-passed success');
assert(r3a.state.status === 'preflight-passed',   'status updated');
assert(r3a.state.preflightRunAt !== null,         'preflightRunAt set on preflight-passed');

var r2b = PDS.advance(r1.state, 'ready-for-preflight').state;
var r3b = PDS.advance(r2b, 'preflight-failed');
assert(r3b.success === true,                     'ready-for-preflight→preflight-failed success');
assert(r3b.state.status === 'preflight-failed',  'status updated');
assert(r3b.state.preflightRunAt !== null,        'preflightRunAt set on preflight-failed');

var r4 = PDS.advance(r3b.state, 'in-progress');
assert(r4.success === true,             'preflight-failed→in-progress success');
assert(r4.state.status === 'in-progress','status updated');

var r4b = PDS.advance(r3a.state, 'in-progress');
assert(r4b.success === true,            'preflight-passed→in-progress success');

suite('Suite 5b — advance() blocked transitions');
var blocked1 = PDS.advance(s0, 'preflight-passed');
assert(blocked1.success === false, 'none→preflight-passed blocked');
assert(blocked1.state   === null,  'blocked returns null state');
var blocked2 = PDS.advance(s0, 'ready-for-preflight');
assert(blocked2.success === false, 'none→ready-for-preflight blocked');

suite('Suite 5c — advance() invalid status');
var inv = PDS.advance(s0, 'checkout-ready');
assert(inv.success === false, 'invalid status rejected');
assert(typeof inv.error === 'string', 'error message is string');

// ── Suite 6: immutability ────────────────────────────────────────────────────

suite('Suite 6 — immutability');
var s6 = PDS.create({ productTypeId: 'message-book' }).state;
var before = s6.status;
PDS.advance(s6, 'in-progress');
assert(s6.status === before, 'advance() does not mutate input record');

// ── Suite 7: serialization round-trip ────────────────────────────────────────

suite('Suite 7 — serialization round-trip');
var fullState = PDS.advance(
    PDS.advance(PDS.create({ productTypeId: 'message-book' }).state, 'in-progress').state,
    'ready-for-preflight'
).state;
var json  = JSON.stringify(fullState);
var back  = JSON.parse(json);
assert(typeof json === 'string',                'serializes to string');
assert(back.productTypeId === 'message-book',   'productTypeId round-trips');
assert(back.status === 'ready-for-preflight',   'status round-trips');
assert(typeof back.createdAt === 'string',      'createdAt round-trips');
assert(typeof back.updatedAt === 'string',      'updatedAt round-trips');

// ── Suite 8: extra fields tolerance ──────────────────────────────────────────

suite('Suite 8 — extra unknown fields in stateRecord do not crash advance');
var extraState = Object.assign({}, s0, { unknownFuture: 'value' });
var advExtra = PDS.advance(extraState, 'in-progress');
assert(advExtra.success === true, 'advance tolerates unknown fields in input record');

// ── Suite 9: semantic guards ──────────────────────────────────────────────────

suite('Suite 9 — semantic guards (no commerce/proof/checkout fields)');
var src = readFileSync(join(ROOT, 'src/products/product-draft-state.js'), 'utf8');
var forbidden = ['checkoutReady', 'paymentReady', 'commerceReady', 'manufacturingReady',
                 'proofReady', 'exportReady', 'orderReady', 'isManufacturingReady',
                 'proofSupported', 'commerceSupported', 'manufacturingSupported'];
for (var i = 0; i < forbidden.length; i++) {
    assert(!src.includes(forbidden[i]), 'no "' + forbidden[i] + '" in product-draft-state.js');
}

// ── Final summary ─────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(44));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
