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
// Suite 4 — canTransition() allowed transitions (7 cases)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — canTransition() allowed transitions', function () {
    const KM = makeCtx();
    const ct = KM.ProofApprovalState.canTransition;

    assert(ct('none',              'pending-review')    === true, 'none → pending-review');
    assert(ct('pending-review',    'none')              === true, 'pending-review → none (user withdrawal)');
    assert(ct('pending-review',    'approved')          === true, 'pending-review → approved');
    assert(ct('pending-review',    'changes-requested') === true, 'pending-review → changes-requested');
    assert(ct('changes-requested', 'pending-review')    === true, 'changes-requested → pending-review');
    assert(ct('approved',          'revoked')           === true, 'approved → revoked');
    assert(ct('revoked',           'pending-review')    === true, 'revoked → pending-review');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — canTransition() blocked transitions (11 cases)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — canTransition() blocked transitions', function () {
    const KM = makeCtx();
    const ct = KM.ProofApprovalState.canTransition;

    assert(ct('none',              'approved')          === false, 'none → approved blocked');
    assert(ct('none',              'changes-requested') === false, 'none → changes-requested blocked');
    assert(ct('none',              'revoked')           === false, 'none → revoked blocked');
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
// Suite 15 — pending-review → none (user withdrawal) transition
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — pending-review → none withdrawal transition', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const s1 = PAS.transition(s0, 'pending-review').state;
    const res = PAS.transition(s1, 'none');

    assert(res.success === true,           'pending-review→none succeeds');
    assert(res.error   === null,           'pending-review→none error is null');
    assert(res.state.status === 'none',    'status is none after withdrawal');
    assert(res.state.submittedAt === null, 'submittedAt reset to null on withdrawal');
    assert(typeof res.state.updatedAt === 'string' && res.state.updatedAt.length > 0,
        'updatedAt is updated on withdrawal');
    assert(res.state.createdAt === s1.createdAt, 'createdAt preserved through withdrawal');

    // Immutability — original pending-review record unchanged
    assert(s1.status      === 'pending-review', 'original pending-review record status unchanged');
    assert(typeof s1.submittedAt === 'string',   'original submittedAt still set on pre-withdrawal record');

    // No prohibited fields introduced by withdrawal
    assert(res.state.approvedAt          === null,      'approvedAt remains null after withdrawal');
    assert(res.state.changesRequestedAt  === null,      'changesRequestedAt remains null after withdrawal');
    assert(res.state.revokedAt           === null,      'revokedAt remains null after withdrawal');
    assert(res.state.commerceReady       === undefined, 'no commerceReady after withdrawal');
    assert(res.state.manufacturingReady  === undefined, 'no manufacturingReady after withdrawal');
    assert(res.state.checkoutReady       === undefined, 'no checkoutReady after withdrawal');
    assert(res.state.orderReady          === undefined, 'no orderReady after withdrawal');

    // After withdrawal, state can be submitted again
    const resubmit = PAS.transition(res.state, 'pending-review');
    assert(resubmit.success === true, 'can resubmit after withdrawal');
    assert(resubmit.state.status === 'pending-review', 'resubmit reaches pending-review');
    assert(typeof resubmit.state.submittedAt === 'string' && resubmit.state.submittedAt.length > 0,
        'submittedAt set again on resubmit after withdrawal');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — STALE status and transitions (Package 5D)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — STALE status and transitions', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;
    const ct  = PAS.canTransition;

    assert(PAS.STATUS.STALE === 'stale', 'STATUS.STALE === "stale"');

    // Allowed
    assert(ct('approved', 'stale')          === true, 'approved → stale allowed');
    assert(ct('stale',    'pending-review') === true, 'stale → pending-review allowed (re-review)');
    assert(ct('stale',    'none')           === true, 'stale → none allowed (clear)');

    // Blocked — stale is only reachable from approved
    assert(ct('none',              'stale') === false, 'none → stale blocked');
    assert(ct('pending-review',    'stale') === false, 'pending-review → stale blocked');
    assert(ct('changes-requested', 'stale') === false, 'changes-requested → stale blocked');
    assert(ct('revoked',           'stale') === false, 'revoked → stale blocked');
    assert(ct('stale',             'stale') === false, 'stale self-transition blocked');
    assert(ct('stale', 'approved')          === false, 'stale → approved blocked (must re-review)');
    assert(ct('stale', 'changes-requested') === false, 'stale → changes-requested blocked');
    assert(ct('stale', 'revoked')           === false, 'stale → revoked blocked');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — transition() STALE field behavior
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — transition() STALE field behavior', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const s1 = PAS.transition(s0, 'pending-review').state;
    const s2 = PAS.transition(s1, 'approved', { proofFingerprint: 'kmpf1:aaaa' }).state;

    // approved → stale
    const r3 = PAS.transition(s2, 'stale');
    assert(r3.success === true, 'approved → stale succeeds');
    assert(r3.state.status === 'stale', 'status is stale');
    assert(typeof r3.state.staleAt === 'string' && r3.state.staleAt.length > 0,
        'staleAt set on approved→stale');
    assert(r3.state.approvedAt === s2.approvedAt, 'approvedAt preserved through stale (history)');
    assert(r3.state.approvedProofFingerprint === 'kmpf1:aaaa',
        'approvedProofFingerprint preserved through stale (history)');

    // stale → pending-review (re-review after edits)
    const r4 = PAS.transition(r3.state, 'pending-review');
    assert(r4.success === true, 'stale → pending-review succeeds');
    assert(typeof r4.state.submittedAt === 'string' && r4.state.submittedAt.length > 0,
        'submittedAt set on stale→pending-review');
    assert(r4.state.staleAt === r3.state.staleAt, 'staleAt preserved as history through re-review');

    // stale → none (clear)
    const r5 = PAS.transition(r3.state, 'none');
    assert(r5.success === true, 'stale → none succeeds');
    assert(r5.state.status === 'none', 'status none after clear');
    assert(r5.state.submittedAt === null, 'submittedAt cleared on stale→none');

    // Immutability — original approved record unchanged
    assert(s2.status === 'approved', 'original approved record unchanged after stale transition');
    assert(s2.staleAt === null, 'original approved record staleAt still null');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — approval captures proof fingerprint
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — approval captures proof fingerprint', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    assert(s0.approvedProofFingerprint === null, 'create() initializes approvedProofFingerprint to null');
    assert(s0.staleAt === null, 'create() initializes staleAt to null');

    const s1 = PAS.transition(s0, 'pending-review').state;

    const withFp = PAS.transition(s1, 'approved', { proofFingerprint: 'kmpf1:1234' }).state;
    assert(withFp.approvedProofFingerprint === 'kmpf1:1234', 'approvedProofFingerprint captured from opts');
    assert(typeof withFp.approvedAt === 'string', 'approvedAt set alongside fingerprint');

    const noFp = PAS.transition(s1, 'approved').state;
    assert(noFp.approvedProofFingerprint === null, 'approvedProofFingerprint null when opts omitted');

    const emptyFp = PAS.transition(s1, 'approved', { proofFingerprint: '' }).state;
    assert(emptyFp.approvedProofFingerprint === null, 'approvedProofFingerprint null when opts has empty string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — computeProofFingerprint determinism / sensitivity / exclusions
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — computeProofFingerprint determinism/sensitivity/exclusions', function () {
    const KM  = makeCtx();
    const fp  = KM.ProofApprovalState.computeProofFingerprint;

    function makeBook() {
        return {
            format:  { trimWidthIn: 7, trimHeightIn: 10, maxPages: 250 },
            opening: { title: 'Our Conversation', dedicationEnabled: false, dedicationText: '' },
            body:    { timestampMode: 'on', pageNumberMode: 'on', dividerMode: 'sparse',
                       endingMode: 'branded', flowMode: 'sectioned' },
            volumes: [ { id: 'vol-1', name: 'Volume 1', estimatedPageCount: 0, exceedsPageLimit: false } ],
            activeVolumeId: 'vol-1',
            estimatedPageCount: 0,
            exceedsPageLimit: false,
            sections: [
                { sourceGroupId: 'g1', customName: 'A', customTitle: null, volumeId: 'vol-1',
                  included: true, orderIndex: 0, featured: false, forcePageBreakBefore: false,
                  showDividerBefore: false, preserveSameSenderRuns: true,
                  preserveShortExchangeClusters: true, messages: [ { id: 'm1' }, { id: 'm2' } ] },
                { sourceGroupId: 'g2', customName: 'B', customTitle: null, volumeId: 'vol-1',
                  included: true, orderIndex: 1, featured: false, forcePageBreakBefore: false,
                  showDividerBefore: true, preserveSameSenderRuns: true,
                  preserveShortExchangeClusters: true, messages: [ { id: 'm3' } ] }
            ]
        };
    }

    const base = fp(makeBook());
    assert(typeof base === 'string' && base.indexOf('kmpf1:') === 0, 'fingerprint is a kmpf1-prefixed string');

    // Determinism
    assert(fp(makeBook()) === base, 'same content → same fingerprint');
    assert(fp(JSON.parse(JSON.stringify(makeBook()))) === base, 'deep-cloned content → same fingerprint');

    // Sensitivity — proof-affecting changes must change the fingerprint
    let b;
    b = makeBook(); b.body.timestampMode = 'off';            assert(fp(b) !== base, 'timestampMode change → different fingerprint');
    b = makeBook(); b.body.dividerMode = 'none';             assert(fp(b) !== base, 'dividerMode change → different fingerprint');
    b = makeBook(); b.body.endingMode = 'none';              assert(fp(b) !== base, 'endingMode change → different fingerprint');
    b = makeBook(); b.format.maxPages = 200;                 assert(fp(b) !== base, 'format.maxPages change → different fingerprint');
    b = makeBook(); b.opening.title = 'Changed';             assert(fp(b) !== base, 'opening.title change → different fingerprint');
    b = makeBook(); b.opening.dedicationEnabled = true;      assert(fp(b) !== base, 'dedicationEnabled change → different fingerprint');
    b = makeBook(); b.sections[0].included = false;          assert(fp(b) !== base, 'section.included toggle → different fingerprint');
    b = makeBook(); b.sections[0].orderIndex = 5;            assert(fp(b) !== base, 'section.orderIndex change → different fingerprint');
    b = makeBook(); b.sections[0].featured = true;           assert(fp(b) !== base, 'section.featured change → different fingerprint');
    b = makeBook(); b.sections[0].volumeId = 'vol-2';        assert(fp(b) !== base, 'section.volumeId change → different fingerprint');
    b = makeBook(); b.sections[0].customTitle = 'T';         assert(fp(b) !== base, 'section.customTitle change → different fingerprint');
    b = makeBook(); b.sections[0].messages.push({ id: 'm9' }); assert(fp(b) !== base, 'added message → different fingerprint');
    b = makeBook(); b.sections[0].messages = [ { id: 'm2' }, { id: 'm1' } ]; assert(fp(b) !== base, 'message reorder within section → different fingerprint');

    // Exclusions — navigation/derived state must NOT change the fingerprint
    b = makeBook(); b.activeVolumeId = 'vol-2';              assert(fp(b) === base, 'activeVolumeId change → same fingerprint (navigation only)');
    b = makeBook(); b.estimatedPageCount = 42;              assert(fp(b) === base, 'estimatedPageCount change → same fingerprint (derived)');
    b = makeBook(); b.exceedsPageLimit = true;              assert(fp(b) === base, 'exceedsPageLimit change → same fingerprint (derived)');
    b = makeBook(); b.volumes[0].estimatedPageCount = 99;   assert(fp(b) === base, 'volume.estimatedPageCount change → same fingerprint (derived)');
    b = makeBook(); b.volumes[0].exceedsPageLimit = true;   assert(fp(b) === base, 'volume.exceedsPageLimit change → same fingerprint (derived)');

    // Canonical section-array reorder (same orderIndex values) → same fingerprint
    b = makeBook(); b.sections = [ b.sections[1], b.sections[0] ];
    assert(fp(b) === base, 'section array reorder without orderIndex change → same fingerprint');

    // Malformed / empty inputs do not throw and return stable strings
    assert(typeof fp(null) === 'string' && fp(null).indexOf('kmpf1:') === 0, 'null → stable kmpf1 string (no throw)');
    assert(fp(null) === fp(null), 'null → deterministic');
    assert(typeof fp(undefined) === 'string', 'undefined → string (no throw)');
    assert(typeof fp({}) === 'string', 'empty object → string (no throw)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 20 — isApprovalStale
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 20 — isApprovalStale', function () {
    const KM    = makeCtx();
    const stale = KM.ProofApprovalState.isApprovalStale;

    const approvedA = { status: 'approved', approvedProofFingerprint: 'kmpf1:A' };
    assert(stale(approvedA, 'kmpf1:A') === false, 'approved + matching fingerprint → not stale');
    assert(stale(approvedA, 'kmpf1:B') === true,  'approved + different fingerprint → stale');
    assert(stale(approvedA, '')        === false, 'approved + empty current fingerprint → not stale');
    assert(stale(approvedA, null)      === false, 'approved + null current fingerprint → not stale');

    const approvedNoFp = { status: 'approved', approvedProofFingerprint: null };
    assert(stale(approvedNoFp, 'kmpf1:B') === false, 'approved without stored fingerprint → not stale');

    const pending = { status: 'pending-review', approvedProofFingerprint: 'kmpf1:A' };
    assert(stale(pending, 'kmpf1:B') === false, 'non-approved status → not stale');

    assert(stale(null, 'kmpf1:B')      === false, 'null record → not stale (no throw)');
    assert(stale(undefined, 'kmpf1:B') === false, 'undefined record → not stale (no throw)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 21 — STALE state introduces no commerce/manufacturing/export fields
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 21 — STALE state has no commerce/manufacturing/export fields', function () {
    const KM  = makeCtx();
    const PAS = KM.ProofApprovalState;

    const s0 = PAS.create({ productTypeId: 'message-book' }).state;
    const s1 = PAS.transition(s0, 'pending-review').state;
    const s2 = PAS.transition(s1, 'approved', { proofFingerprint: 'kmpf1:x' }).state;
    const s3 = PAS.transition(s2, 'stale').state;

    assert(s3.commerceReady      === undefined, 'STALE state has no commerceReady');
    assert(s3.manufacturingReady === undefined, 'STALE state has no manufacturingReady');
    assert(s3.exportReady        === undefined, 'STALE state has no exportReady');
    assert(s3.checkoutReady      === undefined, 'STALE state has no checkoutReady');
    assert(s3.orderReady         === undefined, 'STALE state has no orderReady');
    assert(s3.paymentReady       === undefined, 'STALE state has no paymentReady');

    // approvedProofFingerprint is a content signature only — not a readiness flag
    assert(typeof s3.approvedProofFingerprint === 'string',
        'approvedProofFingerprint retained as a content-signature string, not a readiness flag');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 22 — computeProofFingerprint contactName binding (Proof Approval 5D)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 22 — computeProofFingerprint contactName binding', function () {
    const KM = makeCtx();
    const fp = KM.ProofApprovalState.computeProofFingerprint;

    function makeBook() {
        return {
            format:  { trimWidthIn: 7, trimHeightIn: 10, maxPages: 250 },
            opening: { title: 'Our Conversation', dedicationEnabled: false, dedicationText: '' },
            body:    { timestampMode: 'on', pageNumberMode: 'on', dividerMode: 'sparse',
                       endingMode: 'branded', flowMode: 'sectioned' },
            volumes: [ { id: 'vol-1', name: 'Volume 1', estimatedPageCount: 0, exceedsPageLimit: false } ],
            activeVolumeId: 'vol-1',
            estimatedPageCount: 0,
            exceedsPageLimit: false,
            sections: [
                { sourceGroupId: 'g1', customName: 'A', customTitle: null, volumeId: 'vol-1',
                  included: true, orderIndex: 0, featured: false, forcePageBreakBefore: false,
                  showDividerBefore: false, preserveSameSenderRuns: true,
                  preserveShortExchangeClusters: true, messages: [ { id: 'm1' }, { id: 'm2' } ] }
            ]
        };
    }

    const baseNoName = fp(makeBook());

    // Backward compatibility — omitted / non-string contactName is treated as ''
    assert(fp(makeBook()) === fp(makeBook(), ''),        'omitted contactName equals empty-string contactName');
    assert(fp(makeBook(), undefined) === fp(makeBook(), ''), 'undefined contactName treated as empty string');
    assert(fp(makeBook(), null) === fp(makeBook(), ''),  'null contactName treated as empty string');
    assert(fp(makeBook(), 42) === fp(makeBook(), ''),    'non-string contactName treated as empty string');

    // Same contactName → same fingerprint; different contactName → different fingerprint
    assert(fp(makeBook(), 'Alex') === fp(makeBook(), 'Alex'), 'same contactName → same fingerprint');
    assert(fp(makeBook(), 'Alex') !== fp(makeBook(), 'Bob'),  'different contactName → different fingerprint');
    assert(fp(makeBook(), 'Alex') !== baseNoName,             'named fingerprint differs from empty-name fingerprint');

    // contactName must not pull in unrelated nav/derived state: with the name held
    // constant, activeVolumeId and derived page counts still do not change the fingerprint.
    const withName = fp(makeBook(), 'Alex');
    let b;
    b = makeBook(); b.activeVolumeId = 'vol-2';           assert(fp(b, 'Alex') === withName, 'activeVolumeId still excluded with contactName held constant');
    b = makeBook(); b.estimatedPageCount = 77;            assert(fp(b, 'Alex') === withName, 'estimatedPageCount still excluded with contactName held constant');
    b = makeBook(); b.volumes[0].estimatedPageCount = 88; assert(fp(b, 'Alex') === withName, 'volume.estimatedPageCount still excluded with contactName held constant');

    // A genuine proof-affecting book change still changes the fingerprint with name constant
    b = makeBook(); b.body.timestampMode = 'off';         assert(fp(b, 'Alex') !== withName, 'book change still changes fingerprint with contactName constant');

    // Degenerate empty-book path also binds contactName, consistently
    assert(fp(null, 'Alex') !== fp(null, 'Bob'),         'null book: contactName still differentiates');
    assert(typeof fp(null, 'Alex') === 'string' && fp(null, 'Alex').indexOf('kmpf1:') === 0,
        'null book with name → kmpf1 string');
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
