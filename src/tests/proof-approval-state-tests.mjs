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
    load(ctx, 'src/products/proof-approval-state.js');
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

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — Constants and frozen STATUS object
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — Constants and frozen STATUS object', function () {
    const KM = makeCtx();
    const S  = KM.ProofApprovalState.STATUS;

    assert(typeof KM.ProofApprovalState === 'object' && KM.ProofApprovalState !== null,
        'KMEngine.ProofApprovalState is an object');
    assert(typeof KM.ProofApprovalState.STATUS        === 'object',  'STATUS is an object');
    assert(typeof KM.ProofApprovalState.canTransition === 'function','canTransition is a function');
    assert(typeof KM.ProofApprovalState.create        === 'function','create is a function');
    assert(typeof KM.ProofApprovalState.transition    === 'function','transition is a function');

    assert(S.NONE               === 'none',               'NONE === "none"');
    assert(S.PENDING_REVIEW     === 'pending-review',     'PENDING_REVIEW === "pending-review"');
    assert(S.APPROVED           === 'approved',           'APPROVED === "approved"');
    assert(S.CHANGES_REQUESTED  === 'changes-requested',  'CHANGES_REQUESTED === "changes-requested"');
    assert(S.REVOKED            === 'revoked',            'REVOKED === "revoked"');

    // STATUS is frozen
    try {
        S.EXTRA = 'x';
    } catch (e) { /* expected in strict mode */ }
    assert(S.EXTRA === undefined, 'STATUS is frozen — cannot add new keys');

    // "proof-ready" must not appear anywhere in the implementation file
    const src = readFileSync(
        join(__dirname, '../../src/products/proof-approval-state.js'),
        'utf8'
    );
    assert(!src.includes('proof-ready'),
        '"proof-ready" does not appear in proof-approval-state.js');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — create() success shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — create() success shape', function () {
    const KM = makeCtx();
    const res = KM.ProofApprovalState.create({ productTypeId: 'message-book' });

    assert(res.success === true,  'success is true');
    assert(res.error   === null,  'error is null');
    assert(typeof res.state === 'object' && res.state !== null, 'state is an object');

    const st = res.state;
    assert(st.productTypeId       === 'message-book', 'productTypeId matches');
    assert(st.status              === 'none',         'status is "none"');
    assert(typeof st.createdAt    === 'string' && st.createdAt.length > 0, 'createdAt is an ISO string');
    assert(typeof st.updatedAt    === 'string' && st.updatedAt.length > 0, 'updatedAt is an ISO string');
    assert(st.submittedAt         === null, 'submittedAt is null');
    assert(st.approvedAt          === null, 'approvedAt is null');
    assert(st.changesRequestedAt  === null, 'changesRequestedAt is null');
    assert(st.revokedAt           === null, 'revokedAt is null');
    assert(st.changeRequestReason === null, 'changeRequestReason is null');
    assert(st.revokeReason        === null, 'revokeReason is null');
    assert(st.notes               === null, 'notes is null');

    // No commerce/manufacturing/export fields
    assert(st.checkoutReady      === undefined, 'no checkoutReady field');
    assert(st.commerceReady      === undefined, 'no commerceReady field');
    assert(st.manufacturingReady === undefined, 'no manufacturingReady field');
    assert(st.exportReady        === undefined, 'no exportReady field');
    assert(st.orderReady         === undefined, 'no orderReady field');
    assert(st.paymentReady       === undefined, 'no paymentReady field');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — create() validation failure
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — create() validation failure', function () {
    const KM = makeCtx();

    const r1 = KM.ProofApprovalState.create({});
    assert(r1.success === false && r1.state === null && typeof r1.error === 'string',
        'missing productTypeId → failure envelope');

    const r2 = KM.ProofApprovalState.create({ productTypeId: '' });
    assert(r2.success === false && r2.state === null,
        'empty string productTypeId → failure');

    const r3 = KM.ProofApprovalState.create({ productTypeId: null });
    assert(r3.success === false && r3.state === null,
        'null productTypeId → failure');

    const r4 = KM.ProofApprovalState.create({ productTypeId: 42 });
    assert(r4.success === false && r4.state === null,
        'numeric productTypeId → failure');

    const r5 = KM.ProofApprovalState.create(null);
    assert(r5.success === false && r5.state === null,
        'null opts → failure');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — canTransition() allowed transitions (6 cases)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — canTransition() allowed transitions', function () {
    const KM = makeCtx();
    const ct = KM.ProofApprovalState.canTransition;

    assert(ct('none',              'pending-review')    === true, 'none → pending-review');
    assert(ct('pending-review',    'approved')          === true, 'pending-review → approved');
    assert(ct('pending-review',    'changes-requested') === true, 'pending-review → changes-requested');
    assert(ct('changes-requested', 'pending-review')    === true, 'changes-requested → pending-review');
    assert(ct('approved',          'revoked')           === true, 'approved → revoked');
    assert(ct('revoked',           'pending-review')    === true, 'revoked → pending-review');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — canTransition() blocked transitions (12 cases)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — canTransition() blocked transitions', function () {
    const KM = makeCtx();
    const ct = KM.ProofApprovalState.canTransition;

    assert(ct('none',              'approved')          === false, 'none → approved blocked');
    assert(ct('none',              'changes-requested') === false, 'none → changes-requested blocked');
    assert(ct('none',              'revoked')           === false, 'none → revoked blocked');
    assert(ct('pending-review',    'none')              === false, 'pending-review → none blocked');
    assert(ct('changes-requested', 'approved')          === false, 'changes-requested → approved blocked');
    assert(ct('changes-requested', 'revoked')           === false, 'changes-requested → revoked blocked');
    assert(ct('approved',          'pending-review')    === false, 'approved → pending-review blocked');
    assert(ct('approved',          'changes-requested') === false, 'approved → changes-requested blocked');
    assert(ct('approved',          'none')              === false, 'approved → none blocked');
    assert(ct('revoked',           'approved')          === false, 'revoked → approved blocked');
    assert(ct('revoked',           'changes-requested') === false, 'revoked → changes-requested blocked');
    assert(ct('revoked',           'none')              === false, 'revoked → none blocked');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — canTransition() edge cases
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — canTransition() edge cases', function () {
    const KM = makeCtx();
    const ct = KM.ProofApprovalState.canTransition;

    assert(ct('unknown-status', 'pending-review') === false, 'unknown from → false');
    assert(ct('none', 'unknown-status')           === false, 'unknown to → false');
    assert(ct(null, 'pending-review')             === false, 'null from → false');
    assert(ct('none', null)                       === false, 'null to → false');
    assert(ct(undefined, 'pending-review')        === false, 'undefined from → false');
    assert(ct('none', undefined)                  === false, 'undefined to → false');

    // self-transitions
    assert(ct('none',              'none')              === false, 'none → none self-transition blocked');
    assert(ct('pending-review',    'pending-review')    === false, 'pending-review self-transition blocked');
    assert(ct('approved',          'approved')          === false, 'approved self-transition blocked');
    assert(ct('changes-requested', 'changes-requested') === false, 'changes-requested self-transition blocked');
    assert(ct('revoked',           'revoked')           === false, 'revoked self-transition blocked');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — transition() invalid target status
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — transition() invalid target status', function () {
    const KM = makeCtx();
    const state = KM.ProofApprovalState.create({ productTypeId: 'message-book' }).state;

    const r1 = KM.ProofApprovalState.transition(state, 'bad-value');
    assert(r1.success === false, 'invalid status → success false');
    assert(r1.state   === null,  'invalid status → state null');
    assert(r1.error   === 'invalid-status: bad-value', 'invalid status error format');

    const r2 = KM.ProofApprovalState.transition(state, null);
    assert(r2.success === false && r2.state === null, 'null toStatus → failure');

    const r3 = KM.ProofApprovalState.transition(state, undefined);
    assert(r3.success === false && r3.state === null, 'undefined toStatus → failure');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — transition() blocked transition error format
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — transition() blocked transition error format', function () {
    const KM = makeCtx();
    const state = KM.ProofApprovalState.create({ productTypeId: 'message-book' }).state;

    const r1 = KM.ProofApprovalState.transition(state, 'approved');
    assert(r1.success === false, 'none→approved blocked → success false');
    assert(r1.error   === 'transition-not-allowed: none→approved',
        'none→approved blocked → correct error string');
    assert(r1.state   === null, 'none→approved blocked → state null');

    const r2 = KM.ProofApprovalState.transition(state, 'changes-requested');
    assert(r2.error === 'transition-not-allowed: none→changes-requested',
        'none→changes-requested → correct error string');

    const r3 = KM.ProofApprovalState.transition(state, 'revoked');
    assert(r3.error === 'transition-not-allowed: none→revoked',
        'none→revoked → correct error string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — transition() immutability
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — transition() immutability', function () {
    const KM     = makeCtx();
    const state  = KM.ProofApprovalState.create({ productTypeId: 'message-book' }).state;
    const before = JSON.stringify(state);

    const res = KM.ProofApprovalState.transition(state, 'pending-review');

    assert(JSON.stringify(state) === before, 'original stateRecord is not mutated');
    assert(res.state !== state, 'returned newState is a different object reference');
    assert(state.status     === 'none', 'original status unchanged after transition');
    assert(state.updatedAt  === JSON.parse(before).updatedAt, 'original updatedAt unchanged');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — Timestamp fields per transition
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — Timestamp fields per transition', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    // none → pending-review
    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const r1 = PAS.transition(s0, 'pending-review');
    assert(r1.success === true, 'none→pending-review succeeds');
    assert(typeof r1.state.submittedAt === 'string' && r1.state.submittedAt.length > 0,
        'submittedAt set on none→pending-review');
    assert(r1.state.approvedAt         === null, 'approvedAt still null after none→pending-review');
    assert(r1.state.changesRequestedAt === null, 'changesRequestedAt still null');
    assert(r1.state.revokedAt          === null, 'revokedAt still null');

    // pending-review → approved
    const r2 = PAS.transition(r1.state, 'approved');
    assert(r2.success === true, 'pending-review→approved succeeds');
    assert(typeof r2.state.approvedAt === 'string' && r2.state.approvedAt.length > 0,
        'approvedAt set on pending-review→approved');

    // pending-review → changes-requested
    const r3 = PAS.transition(r1.state, 'changes-requested');
    assert(r3.success === true, 'pending-review→changes-requested succeeds');
    assert(typeof r3.state.changesRequestedAt === 'string' && r3.state.changesRequestedAt.length > 0,
        'changesRequestedAt set');

    // changes-requested → pending-review (resubmission)
    const r4 = PAS.transition(r3.state, 'pending-review');
    assert(r4.success === true, 'changes-requested→pending-review succeeds (resubmission)');
    assert(typeof r4.state.submittedAt === 'string' && r4.state.submittedAt.length > 0,
        'submittedAt updated on resubmission');
    assert(r4.state.changesRequestedAt === r3.state.changesRequestedAt,
        'changesRequestedAt preserved from prior state on resubmission');

    // approved → revoked
    const r5 = PAS.transition(r2.state, 'revoked');
    assert(r5.success === true, 'approved→revoked succeeds');
    assert(typeof r5.state.revokedAt === 'string' && r5.state.revokedAt.length > 0,
        'revokedAt set on approved→revoked');
    assert(r5.state.approvedAt === r2.state.approvedAt, 'approvedAt preserved through revoke');

    // revoked → pending-review (re-review)
    const r6 = PAS.transition(r5.state, 'pending-review');
    assert(r6.success === true, 'revoked→pending-review succeeds (re-review)');
    assert(typeof r6.state.submittedAt === 'string' && r6.state.submittedAt.length > 0,
        'submittedAt updated on re-review');
    assert(r6.state.approvedAt  === r5.state.approvedAt,  'approvedAt preserved after re-review');
    assert(r6.state.revokedAt   === r5.state.revokedAt,   'revokedAt preserved after re-review');
    assert(r6.state.revokeReason === r5.state.revokeReason, 'revokeReason preserved after re-review');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — Reason fields
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — Reason fields', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const s1 = PAS.transition(s0, 'pending-review').state;

    // changes-requested with reason
    const r1 = PAS.transition(s1, 'changes-requested', { changeRequestReason: 'Cover contrast too low' });
    assert(r1.state.changeRequestReason === 'Cover contrast too low',
        'changeRequestReason stored from opts');

    // changes-requested without reason
    const r2 = PAS.transition(s1, 'changes-requested');
    assert(r2.state.changeRequestReason === null,
        'changeRequestReason is null when opts not provided');

    // changes-requested with empty opts
    const r3 = PAS.transition(s1, 'changes-requested', {});
    assert(r3.state.changeRequestReason === null,
        'changeRequestReason is null when opts has no changeRequestReason');

    // After resubmission, prior changeRequestReason is preserved
    const r4 = PAS.transition(r1.state, 'pending-review');
    assert(r4.state.changeRequestReason === 'Cover contrast too low',
        'changeRequestReason preserved through changes-requested→pending-review');

    // approved → revoked with reason
    const s2 = PAS.transition(s1, 'approved').state;
    const r5 = PAS.transition(s2, 'revoked', { revokeReason: 'File corrupted' });
    assert(r5.state.revokeReason === 'File corrupted', 'revokeReason stored from opts');

    // approved → revoked without reason
    const r6 = PAS.transition(s2, 'revoked');
    assert(r6.state.revokeReason === null, 'revokeReason is null when opts not provided');

    // After re-review, prior revokeReason is preserved
    const r7 = PAS.transition(r5.state, 'pending-review');
    assert(r7.state.revokeReason === 'File corrupted',
        'revokeReason preserved through revoked→pending-review');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — Serialization round-trip
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — Serialization round-trip', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const s1 = PAS.transition(s0, 'pending-review').state;
    const s2 = PAS.transition(s1, 'changes-requested', { changeRequestReason: 'Too dark' }).state;

    const serialized = JSON.stringify(s2);
    const parsed     = JSON.parse(serialized);

    assert(parsed.productTypeId       === s2.productTypeId,       'productTypeId survives round-trip');
    assert(parsed.status              === 'changes-requested',     'status survives round-trip');
    assert(parsed.submittedAt         === s2.submittedAt,          'submittedAt survives round-trip');
    assert(parsed.changesRequestedAt  === s2.changesRequestedAt,   'changesRequestedAt survives round-trip');
    assert(parsed.changeRequestReason === 'Too dark',              'changeRequestReason survives round-trip');
    assert(parsed.approvedAt          === null,                    'null approvedAt survives round-trip');

    // Parsed state can continue through allowed transitions
    const r = PAS.transition(parsed, 'pending-review');
    assert(r.success === true,
        'parsed state can continue through changes-requested→pending-review');
    assert(r.state.status === 'pending-review', 'status advances correctly from parsed state');
    assert(r.state.changesRequestedAt === parsed.changesRequestedAt,
        'changesRequestedAt preserved from parsed state');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — Extra unknown fields do not cause transition() to throw
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — Extra unknown fields do not cause transition() to throw', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const withExtra = Object.assign({}, s0, { extraField: 'foo', anotherExtra: 42 });

    let threw = false;
    let result;
    try {
        result = PAS.transition(withExtra, 'pending-review');
    } catch (e) {
        threw = true;
    }
    assert(!threw, 'transition() does not throw when stateRecord has extra fields');
    assert(result && result.success === true, 'transition succeeds with extra fields on record');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — Semantic guard tests
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — Semantic guard tests', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;
    const ct  = PAS.canTransition;

    // REVOKED is only reachable from APPROVED
    assert(ct('pending-review',    'revoked') === false, 'pending-review cannot reach revoked');
    assert(ct('changes-requested', 'revoked') === false, 'changes-requested cannot reach revoked');
    assert(ct('none',              'revoked') === false, 'none cannot reach revoked');
    assert(ct('approved',          'revoked') === true,  'only approved can reach revoked');

    // CHANGES_REQUESTED is only reachable from PENDING_REVIEW
    assert(ct('none',     'changes-requested') === false, 'none cannot reach changes-requested');
    assert(ct('approved', 'changes-requested') === false, 'approved cannot reach changes-requested');
    assert(ct('revoked',  'changes-requested') === false, 'revoked cannot reach changes-requested');
    assert(ct('pending-review', 'changes-requested') === true,
        'only pending-review can reach changes-requested');

    // CHANGES_REQUESTED → PENDING_REVIEW supports resubmission
    assert(ct('changes-requested', 'pending-review') === true,
        'changes-requested → pending-review (resubmission) allowed');

    // REVOKED → PENDING_REVIEW supports re-review
    assert(ct('revoked', 'pending-review') === true,
        'revoked → pending-review (re-review after withdrawal) allowed');

    // APPROVED does not produce commerce/manufacturing/export fields
    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const s1 = PAS.transition(s0, 'pending-review').state;
    const s2 = PAS.transition(s1, 'approved').state;
    assert(s2.commerceReady      === undefined, 'APPROVED state has no commerceReady field');
    assert(s2.manufacturingReady === undefined, 'APPROVED state has no manufacturingReady field');
    assert(s2.exportReady        === undefined, 'APPROVED state has no exportReady field');
    assert(s2.checkoutReady      === undefined, 'APPROVED state has no checkoutReady field');
    assert(s2.orderReady         === undefined, 'APPROVED state has no orderReady field');

    // CHANGES_REQUESTED does not produce commerce/manufacturing/export fields
    const s3 = PAS.transition(s1, 'changes-requested').state;
    assert(s3.commerceReady      === undefined, 'CHANGES_REQUESTED state has no commerceReady field');
    assert(s3.manufacturingReady === undefined, 'CHANGES_REQUESTED state has no manufacturingReady field');
    assert(s3.exportReady        === undefined, 'CHANGES_REQUESTED state has no exportReady field');
    assert(s3.checkoutReady      === undefined, 'CHANGES_REQUESTED state has no checkoutReady field');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
