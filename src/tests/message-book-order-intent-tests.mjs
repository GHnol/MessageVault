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

// MessageBookOrderIntent consumes the readiness RESULT object and references no
// sibling module at runtime, so it loads alone for the unit suites.
function makeCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-order-intent.js');
    return ctx.window.KMEngine;
}

// The integration suite feeds the shell with the real 7A gate output.
function makeIntegrationCtx() {
    const ctx = createContext({ window: {}, console });
    load(ctx, 'src/products/message-book-readiness.js');
    load(ctx, 'src/products/message-book-order-intent.js');
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

// A readiness result that certifies checkout eligibility (the shape 7A/7B return).
const ELIGIBLE_READINESS = Object.freeze({ checkoutEligible: true, primaryBlocker: null });
// An ineligible readiness result with a representative safe blocker code.
function blockedReadiness(code) {
    return { checkoutEligible: false, primaryBlocker: code || 'no-content' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 1 — API shape
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 1 — API shape', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    assert(typeof OI === 'object' && OI !== null, 'KMEngine.MessageBookOrderIntent is an object');
    assert(OI.CONTRACT_VERSION === 'kmoi1', 'CONTRACT_VERSION is "kmoi1"');
    assert(OI.PRODUCT_TYPE_ID === 'message-book', 'PRODUCT_TYPE_ID is "message-book"');
    assert(OI.GATED_REASON === 'not-implemented', 'GATED_REASON is "not-implemented"');
    ['STATE', 'AVAILABILITY', 'REASON'].forEach(function (k) {
        assert(typeof OI[k] === 'object' && OI[k] !== null, k + ' is an object');
    });
    ['isValidStatus', 'canTransition', 'deriveAvailability', 'create', 'canStartIntent',
     'startIntent', 'clearIntent', 'reconcile', 'resolve', 'restore', 'describeIntent',
     'describeActions', 'describeBoundary'
    ].forEach(function (fn) {
        assert(typeof OI[fn] === 'function', fn + ' is a function');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 2 — constants + immutability
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 2 — STATE / AVAILABILITY / REASON constants', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    assert(OI.STATE.NONE === 'none', 'STATE.NONE');
    assert(OI.STATE.INTENT_DRAFT === 'intent-draft-local', 'STATE.INTENT_DRAFT');
    assert(OI.STATE.BLOCKED === 'blocked', 'STATE.BLOCKED');
    assert(OI.STATE.CLEARED === 'cleared', 'STATE.CLEARED');

    assert(OI.AVAILABILITY.UNAVAILABLE === 'unavailable', 'AVAILABILITY.UNAVAILABLE');
    assert(OI.AVAILABILITY.ELIGIBLE === 'eligible', 'AVAILABILITY.ELIGIBLE');

    assert(OI.REASON.NOT_ELIGIBLE === 'readiness-not-eligible', 'REASON.NOT_ELIGIBLE');
    assert(OI.REASON.NO_INTENT === 'no-intent', 'REASON.NO_INTENT');
    assert(OI.REASON.INTENT_RECORDED === 'intent-recorded', 'REASON.INTENT_RECORDED');
    assert(OI.REASON.INTENT_BLOCKED === 'intent-blocked', 'REASON.INTENT_BLOCKED');
    assert(OI.REASON.INTENT_CLEARED === 'intent-cleared', 'REASON.INTENT_CLEARED');

    // No status name implies a real order/cart/checkout placement.
    Object.keys(OI.STATE).forEach(function (k) {
        const v = OI.STATE[k].toLowerCase();
        ['cart', 'checkout', 'purchase', 'payment'].forEach(function (bad) {
            assert(v.indexOf(bad) === -1, 'STATE.' + k + ' avoids "' + bad + '"');
        });
    });

    // Frozen.
    try { 'use strict'; OI.STATE.INTENT_DRAFT = 'mutated'; } catch (e) { /* strict throw ok */ }
    assert(OI.STATE.INTENT_DRAFT === 'intent-draft-local', 'STATE is immutable (frozen)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 3 — create()
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 3 — create()', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    const r = OI.create();
    assert(r.success === true && r.error === null, 'create() succeeds');
    assert(r.state.status === 'none', 'fresh record status is none');
    assert(r.state.productTypeId === 'message-book', 'scoped to message-book');
    assert(r.state.nonTransactional === true, 'record is explicitly nonTransactional');
    assert(typeof r.state.createdAt === 'string' && typeof r.state.updatedAt === 'string',
        'record carries createdAt/updatedAt');
    ['intentAt', 'blockedAt', 'blockedReason', 'clearedAt'].forEach(function (f) {
        assert(r.state[f] === null, 'fresh record ' + f + ' is null');
    });

    // Explicit message-book productTypeId is accepted; a foreign one is rejected.
    assert(OI.create({ productTypeId: 'message-book' }).success === true, 'explicit message-book accepted');
    const bad = OI.create({ productTypeId: 'mug' });
    assert(bad.success === false && bad.state === null, 'foreign productTypeId rejected');

    // notes passthrough.
    assert(OI.create({ notes: 'hi' }).state.notes === 'hi', 'create carries notes');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 4 — transition graph
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 4 — isValidStatus / canTransition', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    ['none', 'intent-draft-local', 'blocked', 'cleared'].forEach(function (s) {
        assert(OI.isValidStatus(s) === true, s + ' is a valid status');
    });
    ['order', 'paid', 'shipped', '', null, undefined].forEach(function (s) {
        assert(OI.isValidStatus(s) === false, String(s) + ' is not a valid status');
    });

    const allowed = [
        ['none', 'intent-draft-local'],
        ['cleared', 'intent-draft-local'],
        ['intent-draft-local', 'blocked'],
        ['blocked', 'intent-draft-local'],
        ['intent-draft-local', 'cleared'],
        ['blocked', 'cleared']
    ];
    allowed.forEach(function (t) {
        assert(OI.canTransition(t[0], t[1]) === true, 'allowed: ' + t[0] + '→' + t[1]);
    });

    // A few that must NOT be allowed (no path that fabricates an active order, etc.).
    const disallowed = [
        ['none', 'blocked'], ['none', 'cleared'], ['cleared', 'blocked'],
        ['intent-draft-local', 'none'], ['blocked', 'none'], ['cleared', 'none'],
        ['intent-draft-local', 'intent-draft-local']
    ];
    disallowed.forEach(function (t) {
        assert(OI.canTransition(t[0], t[1]) === false, 'disallowed: ' + t[0] + '→' + t[1]);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 5 — deriveAvailability
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 5 — deriveAvailability', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    const ok = OI.deriveAvailability(ELIGIBLE_READINESS);
    assert(ok.eligible === true && ok.availability === 'eligible', 'eligible readiness → eligible/eligible');
    assert(ok.blocker === null, 'eligible readiness → no blocker');

    const no = OI.deriveAvailability(blockedReadiness('over-page-limit'));
    assert(no.eligible === false && no.availability === 'unavailable', 'ineligible readiness → unavailable');
    assert(no.blocker === 'over-page-limit', 'ineligible readiness → carries primaryBlocker');

    // Strict: only checkoutEligible === true counts as eligible.
    [undefined, null, {}, { checkoutEligible: 'yes' }, { checkoutEligible: 1 }].forEach(function (r) {
        assert(OI.deriveAvailability(r).eligible === false,
            'non-strict-true readiness ' + JSON.stringify(r) + ' → not eligible');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — startIntent gating (acceptance #2, #6)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 6 — startIntent', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    // none + eligible → intent-draft-local.
    const base = OI.create().state;
    const started = OI.startIntent(base, ELIGIBLE_READINESS);
    assert(started.success === true, 'eligible start succeeds');
    assert(started.state.status === 'intent-draft-local', 'started record is intent-draft-local');
    assert(typeof started.state.intentAt === 'string', 'started record stamps intentAt');
    assert(started.state.nonTransactional === true, 'started record stays nonTransactional');
    assert(base.status === 'none', 'startIntent does not mutate its input record');

    // Ineligible → refused with a safe error carrying the blocker; no record.
    const refused = OI.startIntent(base, blockedReadiness('proof-pending-review'));
    assert(refused.success === false && refused.state === null, 'ineligible start refused');
    assert(refused.error.indexOf('not-eligible') === 0, 'refusal error is not-eligible');
    assert(refused.error.indexOf('proof-pending-review') !== -1, 'refusal carries the safe blocker');

    // cleared + eligible → intent-draft-local (re-express intent).
    const cleared = OI.clearIntent(started.state).state;
    const restart = OI.startIntent(cleared, ELIGIBLE_READINESS);
    assert(restart.success === true && restart.state.status === 'intent-draft-local', 'cleared→intent on re-start');

    // From intent-draft-local or blocked, startIntent is not the right verb.
    assert(OI.startIntent(started.state, ELIGIBLE_READINESS).success === false,
        'startIntent from intent-draft-local is refused');
    const blockedRec = OI.reconcile(started.state, blockedReadiness('over-page-limit')).state;
    assert(OI.startIntent(blockedRec, ELIGIBLE_READINESS).success === false,
        'startIntent from blocked is refused (use reconcile to restore)');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — startIntent is refused for every blocking readiness condition (#3)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 7 — startIntent refused under every blocker', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const base = OI.create().state;

    ['no-content', 'over-page-limit', 'proof-not-submitted', 'proof-pending-review',
     'proof-changes-requested', 'proof-revoked', 'proof-approval-stale',
     'preflight-blocking-failure', 'engine-unsupported'].forEach(function (code) {
        const res = OI.startIntent(base, blockedReadiness(code));
        assert(res.success === false && res.state === null, code + ' → start refused');
        assert(OI.canStartIntent(base, blockedReadiness(code)) === false, code + ' → canStartIntent false');
    });

    assert(OI.canStartIntent(base, ELIGIBLE_READINESS) === true, 'eligible → canStartIntent true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — clearIntent
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 8 — clearIntent', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    const draft = OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state;
    const cleared = OI.clearIntent(draft);
    assert(cleared.success === true && cleared.state.status === 'cleared', 'intent-draft → cleared');
    assert(typeof cleared.state.clearedAt === 'string', 'cleared record stamps clearedAt');
    assert(draft.status === 'intent-draft-local', 'clearIntent does not mutate its input');

    const blocked = OI.reconcile(draft, blockedReadiness('over-page-limit')).state;
    assert(OI.clearIntent(blocked).state.status === 'cleared', 'blocked → cleared allowed');

    // Nothing to clear from none/cleared.
    assert(OI.clearIntent(OI.create().state).success === false, 'clear from none refused');
    assert(OI.clearIntent(cleared.state).success === false, 'clear from cleared refused');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — reconcile (acceptance #4, #7)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 9 — reconcile invalidation + restore', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const draft = OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state;

    // Eligibility lost → blocked, carrying the safe blocker code.
    const lost = OI.reconcile(draft, blockedReadiness('proof-approval-stale'));
    assert(lost.changed === true && lost.state.status === 'blocked', 'recorded intent → blocked when ineligible');
    assert(lost.state.blockedReason === 'proof-approval-stale', 'blocked record carries the blocker reason');
    assert(typeof lost.state.blockedAt === 'string', 'blocked record stamps blockedAt');
    assert(draft.status === 'intent-draft-local', 'reconcile does not mutate its input');

    // Eligibility returns → restored to intent-draft-local, blocker cleared, intentAt kept.
    const back = OI.reconcile(lost.state, ELIGIBLE_READINESS);
    assert(back.changed === true && back.state.status === 'intent-draft-local', 'blocked → restored when eligible again');
    assert(back.state.blockedReason === null, 'restored record clears the blocker reason');
    assert(back.state.intentAt === draft.intentAt, 'restored record preserves original intentAt');

    // No-ops never throw and report changed:false.
    assert(OI.reconcile(draft, ELIGIBLE_READINESS).changed === false, 'eligible recorded intent → no change');
    assert(OI.reconcile(lost.state, blockedReadiness('no-content')).changed === false, 'still-ineligible blocked → no change');
    assert(OI.reconcile(OI.create().state, blockedReadiness('no-content')).changed === false, 'none → no change');
    assert(OI.reconcile(OI.create().state, ELIGIBLE_READINESS).changed === false, 'none eligible → no change');
    assert(OI.reconcile(null, ELIGIBLE_READINESS).changed === false, 'null record → no change, no throw');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 10 — resolve view-model
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 10 — resolve()', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const none = OI.create().state;

    // none + eligible → eligible-to-start.
    const a = OI.resolve(none, ELIGIBLE_READINESS);
    assert(a.availability === 'eligible' && a.eligible === true, 'none/eligible → availability eligible');
    assert(a.state === 'none' && a.active === false, 'none/eligible → state none, not active');
    assert(a.reason === 'no-intent' && a.canStart === true, 'none/eligible → no-intent, canStart');

    // none + ineligible → unavailable.
    const b = OI.resolve(none, blockedReadiness('no-content'));
    assert(b.availability === 'unavailable' && b.canStart === false, 'none/ineligible → unavailable, cannot start');
    assert(b.reason === 'readiness-not-eligible' && b.blocker === 'no-content', 'none/ineligible → reason + blocker');

    // intent-draft + eligible → ACTIVE.
    const draft = OI.startIntent(none, ELIGIBLE_READINESS).state;
    const c = OI.resolve(draft, ELIGIBLE_READINESS);
    assert(c.state === 'intent-draft-local' && c.active === true, 'recorded/eligible → active');
    assert(c.reason === 'intent-recorded' && c.canClear === true, 'recorded/eligible → intent-recorded, canClear');

    // intent-draft + ineligible → effectively BLOCKED, not active (requirement #7).
    const d = OI.resolve(draft, blockedReadiness('over-page-limit'));
    assert(d.state === 'blocked' && d.active === false, 'recorded/ineligible → effective blocked, not active');
    assert(d.reason === 'intent-blocked' && d.blocker === 'over-page-limit', 'recorded/ineligible → blocked reason + blocker');
    assert(d.canClear === true, 'recorded/ineligible → still clearable');

    // durable blocked record.
    const blockedRec = OI.reconcile(draft, blockedReadiness('proof-revoked')).state;
    const e = OI.resolve(blockedRec, blockedReadiness('proof-revoked'));
    assert(e.state === 'blocked' && e.active === false && e.restorable === false, 'blocked/ineligible → blocked, not restorable');
    const f = OI.resolve(blockedRec, ELIGIBLE_READINESS);
    assert(f.state === 'blocked' && f.active === false && f.restorable === true, 'blocked/eligible → restorable, still not active');

    // cleared.
    const clearedRec = OI.clearIntent(draft).state;
    const g = OI.resolve(clearedRec, ELIGIBLE_READINESS);
    assert(g.state === 'cleared' && g.reason === 'intent-cleared' && g.canStart === true, 'cleared/eligible → cleared, canStart');

    // every resolve carries a display view-model.
    [a, b, c, d, e, f, g].forEach(function (v, i) {
        assert(v.display && typeof v.display.headline === 'string' && typeof v.display.detail === 'string',
            'resolve case ' + i + ' carries display copy');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 11 — core safety invariant: active ⇔ (recorded intent AND eligible) (#7)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 11 — active is never true under ineligible readiness', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    const records = {
        none:    OI.create().state,
        draft:   OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state,
        blocked: OI.reconcile(OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state,
                              blockedReadiness('no-content')).state,
        cleared: OI.clearIntent(OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state).state
    };
    const readinesses = [ELIGIBLE_READINESS, blockedReadiness('no-content'),
        blockedReadiness('over-page-limit'), blockedReadiness('proof-approval-stale')];

    let combos = 0;
    Object.keys(records).forEach(function (key) {
        readinesses.forEach(function (rd) {
            const v = OI.resolve(records[key], rd);
            const expectedActive = (key === 'draft' && rd.checkoutEligible === true);
            assert(v.active === expectedActive, key + ' × ' + (rd.checkoutEligible ? 'eligible' : 'ineligible') +
                ' → active ' + expectedActive);
            // Whenever readiness is ineligible, nothing is ever active.
            if (rd.checkoutEligible !== true) {
                assert(v.active === false, key + ' under ineligible readiness is never active');
            }
            combos++;
        });
    });
    assert(combos === 4 * 4, 'covered the full ' + combos + '-combination grid');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 12 — higher gates remain explicitly false (#8)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 12 — manufacturing/vendor/production/export/packaging gated false', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const draft = OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state;

    // True even when the local intent is fully active: these are separate gates.
    [OI.resolve(draft, ELIGIBLE_READINESS), OI.resolve(OI.create().state, ELIGIBLE_READINESS)]
        .forEach(function (v, i) {
            assert(v.manufacturingReady === false, 'case ' + i + ': manufacturingReady false');
            assert(v.vendorReady === false, 'case ' + i + ': vendorReady false');
            assert(v.productionReady === false, 'case ' + i + ': productionReady false');
            assert(v.exportReady === false, 'case ' + i + ': exportReady false');
            assert(v.packagingReady === false, 'case ' + i + ': packagingReady false');
            assert(v.gatedReason === 'not-implemented', 'case ' + i + ': gatedReason not-implemented');
            assert(v.nonTransactional === true, 'case ' + i + ': resolved view is nonTransactional');
        });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 13 — describeIntent copy + no unsafe commerce/production language (#7)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 13 — describeIntent copy', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const none  = OI.create().state;
    const draft = OI.startIntent(none, ELIGIBLE_READINESS).state;

    const views = [
        OI.resolve(none, ELIGIBLE_READINESS),                       // no-intent / eligible
        OI.resolve(none, blockedReadiness('no-content')),          // not-eligible
        OI.resolve(draft, ELIGIBLE_READINESS),                     // recorded / active
        OI.resolve(draft, blockedReadiness('over-page-limit')),    // recorded / blocked
        OI.resolve(OI.clearIntent(draft).state, ELIGIBLE_READINESS)// cleared
    ];

    views.forEach(function (v, i) {
        assert(typeof v.display.tone === 'string' && v.display.tone.length > 0, 'case ' + i + ' has a tone');
        assert(v.display.headline.length > 0 && v.display.detail.length > 0, 'case ' + i + ' has headline+detail');
    });

    // The eligible/active copy frames it as continuing LATER, never as an action.
    const active = OI.resolve(draft, ELIGIBLE_READINESS).display;
    assert(active.tone === 'recorded', 'active tone is "recorded"');
    assert(active.headline.toLowerCase().indexOf('later') !== -1, 'active headline says "later"');

    // No buy/print/order/send/vendor/production-ready/pay/cart/ship/purchase language
    // anywhere in the display copy (status names + copy must avoid commerce claims).
    const banned = ['buy', 'print', 'order', 'send', 'vendor', 'production-ready',
        'pay', 'cart', 'ship', 'purchase', 'place order'];
    const allCopy = views.map(function (v) {
        return v.display.tone + ' ' + v.display.headline + ' ' + v.display.detail;
    }).join(' ').toLowerCase();
    banned.forEach(function (w) {
        assert(allCopy.indexOf(w) === -1, 'display copy avoids "' + w + '"');
    });

    // Defensive: a null/garbage view degrades to the safe unavailable copy.
    const degraded = OI.describeIntent(null);
    assert(degraded.tone === 'unavailable' && degraded.headline.length > 0, 'null view → safe unavailable copy');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 14 — describeBoundary
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 14 — describeBoundary', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const d = OI.describeBoundary();

    assert(d && typeof d === 'object', 'describeBoundary returns an object');
    assert(d.version === 'kmoi1', 'carries the contract version');
    assert(d.gatedBy === 'MessageBookReadiness.checkoutEligible', 'states it is gated by the 7A gate');
    assert(d.recordedOnDevice === true && d.nonTransactional === true, 'on-device + non-transactional');
    assert(typeof d.doesNot === 'string' && d.doesNot.toLowerCase().indexOf('does not') !== -1,
        'doesNot disclaims commerce/production actions');
    assert(Array.isArray(d.createsNo) && d.createsNo.indexOf('payment') !== -1
        && d.createsNo.indexOf('cart') !== -1, 'createsNo enumerates cart/payment');
    assert(Array.isArray(d.separateGates) && d.separateGates.indexOf('manufacturing') !== -1
        && d.separateGates.indexOf('checkout') !== -1, 'separateGates enumerates downstream gates');

    // No affirmative commerce/production readiness fields.
    assert(d.orderCreated === undefined && d.purchased === undefined && d.charged === undefined,
        'boundary exposes no affirmative commerce fields');

    // Defensive copy.
    const d2 = OI.describeBoundary();
    assert(d2 !== d, 'fresh object each call');
    assert(d2.separateGates !== d.separateGates && d2.createsNo !== d.createsNo, 'fresh arrays each call');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 15 — purity of the decision layer
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 15 — purity (deterministic decisions, no input mutation)', function () {
    const OI = makeCtx().MessageBookOrderIntent;
    const draft = OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state;

    const recSnapshot = JSON.stringify(draft);
    const rdArg = blockedReadiness('over-page-limit');
    const rdSnapshot = JSON.stringify(rdArg);

    const a = OI.resolve(draft, rdArg);
    const b = OI.resolve(draft, rdArg);
    assert(JSON.stringify(a) === JSON.stringify(b), 'resolve is deterministic for the same inputs');
    assert(JSON.stringify(draft) === recSnapshot, 'resolve does not mutate the record');
    assert(JSON.stringify(rdArg) === rdSnapshot, 'resolve does not mutate the readiness result');

    // deriveAvailability is deterministic + non-mutating.
    const da1 = OI.deriveAvailability(rdArg);
    const da2 = OI.deriveAvailability(rdArg);
    assert(JSON.stringify(da1) === JSON.stringify(da2), 'deriveAvailability deterministic');
    assert(JSON.stringify(rdArg) === rdSnapshot, 'deriveAvailability does not mutate its argument');

    // Returned display object is independent per call.
    a.display.headline = 'tampered';
    assert(OI.resolve(draft, rdArg).display.headline !== 'tampered', 'mutating a result does not affect later calls');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 16 — source carries no commerce CTA/action or side effects
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 16 — no commerce CTA/action or side-effects in source', function () {
    const src = readFileSync(
        join(__dirname, '../../src/products/message-book-order-intent.js'),
        'utf8'
    ).toLowerCase();

    // The shell is ABOUT the order-intent / checkout boundary, so those nouns
    // legitimately appear (incl. the module name). What must never appear is an
    // ACTION that performs commerce/production, or a call-to-action that implies it.
    ['add to cart', 'addtocart', 'place order', 'placeorder', 'create order', 'createorder',
     'submit order', 'submitorder', 'order now', 'ordernow', 'buy now', 'buynow',
     'pay now', 'paynow', 'checkout session', 'createcheckout', 'send to vendor',
     'submit to vendor', 'send to print', 'print now', 'charge(', 'stripe', 'paypal',
     'add to bag'].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source contains no commerce CTA/action "' + term + '"');
    });

    // No network/DOM/storage/random side effects. The record builders intentionally
    // use new Date() for local-only timestamps (like the sibling state machines), so
    // Date is not scanned here; everything else must be absent.
    ['fetch(', 'xmlhttprequest', 'localstorage', 'sessionstorage', 'document.',
     'window.location', 'math.random('].forEach(function (term) {
        assert(src.indexOf(term) === -1, 'source has no side-effect token "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 17 — integration with the real MessageBookReadiness gate (#2, #8)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 17 — integration with MessageBookReadiness', function () {
    const KM  = makeIntegrationCtx();
    const MBR = KM.MessageBookReadiness;
    const OI  = KM.MessageBookOrderIntent;

    // The 7A gate is the only authority for eligibility. A fully checkout-eligible
    // proof input:
    const eligibleInput = {
        engineSupported: true, hasContent: true, exceedsPageLimit: false,
        approvalStatus: 'approved', approvalStale: false, preflightBlockingFailures: 0
    };
    const eligibleResult = MBR.evaluate(eligibleInput);
    assert(eligibleResult.checkoutEligible === true, 'gate certifies the eligible input');

    // The shell starts an intent only when the gate says eligible.
    const base = OI.create().state;
    const started = OI.startIntent(base, eligibleResult);
    assert(started.success === true && started.state.status === 'intent-draft-local',
        'startIntent succeeds against a real eligible gate result');
    assert(OI.resolve(started.state, eligibleResult).active === true, 'resolved intent is active under the real gate');

    // Every real ineligible gate result refuses the start AND blocks an existing note.
    const ineligibleInputs = [
        ['no content',          { hasContent: false }],
        ['over page limit',     { exceedsPageLimit: true }],
        ['pending review',      { approvalStatus: 'pending-review' }],
        ['stale approval',      { approvalStatus: 'approved', approvalStale: true }],
        ['missing approval',    { approvalStatus: 'none' }],
        ['preflight failure',   { preflightBlockingFailures: 1 }]
    ];
    ineligibleInputs.forEach(function (c) {
        const result = MBR.evaluate(Object.assign({}, eligibleInput, c[1]));
        assert(result.checkoutEligible === false, c[0] + ' → gate ineligible');
        assert(OI.startIntent(base, result).success === false, c[0] + ' → startIntent refused');
        // An already-recorded note is invalidated to blocked, carrying the gate's primaryBlocker.
        const blocked = OI.reconcile(started.state, result);
        assert(blocked.changed === true && blocked.state.status === 'blocked', c[0] + ' → recorded note blocked');
        assert(blocked.state.blockedReason === result.primaryBlocker, c[0] + ' → blocked reason matches gate primaryBlocker');
        assert(OI.resolve(started.state, result).active === false, c[0] + ' → no active intent under the real gate');
    });

    // 5D staleness drives the boundary end-to-end through the real gate:
    // an approved-but-stale proof is ineligible, so a recorded note cannot be active.
    const staleResult = MBR.evaluate(Object.assign({}, eligibleInput, { approvalStale: true }));
    assert(staleResult.primaryBlocker === 'proof-approval-stale', 'stale → proof-approval-stale blocker');
    const reblocked = OI.reconcile(started.state, staleResult).state;
    assert(reblocked.status === 'blocked', 'stale proof blocks the recorded note');
    // ...and it restores when the proof is eligible again.
    const restored = OI.reconcile(reblocked, eligibleResult);
    assert(restored.changed === true && restored.state.status === 'intent-draft-local',
        'note restores once the gate is eligible again');
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 18 — describeActions (7E safe UI action labels)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 18 — describeActions safe button labels', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    const START_LABEL = 'Save local intent to continue later';
    const CLEAR_LABEL = 'Clear local intent';

    // Eligible, no recorded note → only a start action.
    const eligibleNone = OI.resolve(OI.create().state, ELIGIBLE_READINESS);
    const aEligible = OI.describeActions(eligibleNone);
    assert(Array.isArray(aEligible) && aEligible.length === 1, 'eligible+no-intent → exactly one action');
    assert(aEligible[0].action === 'start-intent' && aEligible[0].label === START_LABEL,
        'eligible+no-intent → start-intent with the safe save label');

    // A recorded, active note → only a clear action.
    const draft = OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state;
    const activeView = OI.resolve(draft, ELIGIBLE_READINESS);
    assert(activeView.active === true, 'recorded note resolves active under eligible gate');
    const aActive = OI.describeActions(activeView);
    assert(aActive.length === 1 && aActive[0].action === 'clear-intent' && aActive[0].label === CLEAR_LABEL,
        'active note → clear-intent with the safe clear label');

    // A blocked note (lost eligibility) → still clearable, never startable.
    const blocked = OI.reconcile(draft, blockedReadiness('over-page-limit')).state;
    const blockedView = OI.resolve(blocked, blockedReadiness('over-page-limit'));
    const aBlocked = OI.describeActions(blockedView);
    assert(aBlocked.length === 1 && aBlocked[0].action === 'clear-intent',
        'blocked note → only a clear action (no start while ineligible)');

    // Not eligible, no note → no actions at all ("Not available yet" status only).
    const unavailable = OI.resolve(OI.create().state, blockedReadiness('no-content'));
    assert(OI.describeActions(unavailable).length === 0, 'ineligible+no-intent → no actions');

    // Cleared + eligible again → a fresh start action returns.
    const cleared = OI.clearIntent(draft).state;
    const clearedEligible = OI.resolve(cleared, ELIGIBLE_READINESS);
    const aCleared = OI.describeActions(clearedEligible);
    assert(aCleared.length === 1 && aCleared[0].action === 'start-intent',
        'cleared+eligible → start-intent available again');

    // Defensive: fresh array per call; null-safe.
    assert(OI.describeActions(eligibleNone) !== aEligible, 'returns a fresh array each call');
    assert(Array.isArray(OI.describeActions(null)) && OI.describeActions(null).length === 0,
        'describeActions(null) → empty array (null-safe)');

    // No commerce/production verb may appear in any action label, in any state.
    const allLabels = [START_LABEL, CLEAR_LABEL].join(' ').toLowerCase();
    ['buy', 'pay', 'checkout', 'cart', 'place order', 'submit order', 'order now',
     'print now', 'send to vendor', 'production ready', 'ship', 'purchase', 'charge'
    ].forEach(function (term) {
        assert(allLabels.indexOf(term) === -1, 'action labels contain no commerce/production verb "' + term + '"');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite 19 — restore + persistence-restore gating (7E)
// ─────────────────────────────────────────────────────────────────────────────
suite('Suite 19 — restore coercion + restore-then-resolve gating', function () {
    const OI = makeCtx().MessageBookOrderIntent;

    // A well-formed persisted record is returned structurally intact.
    const saved = OI.startIntent(OI.create().state, ELIGIBLE_READINESS).state;
    const savedSnapshot = JSON.stringify(saved);
    const restored = OI.restore(saved);
    assert(restored && restored.status === 'intent-draft-local', 'restore keeps a valid recorded status');
    assert(JSON.stringify(saved) === savedSnapshot, 'restore does not mutate its input');

    // Malformed / missing inputs coerce to a safe none record (never throws).
    [null, undefined, {}, { status: 'not-a-status' }, 42, 'x', []].forEach(function (bad) {
        const r = OI.restore(bad);
        assert(r && r.status === 'none' && r.productTypeId === 'message-book' && r.nonTransactional === true,
            'restore(' + JSON.stringify(bad) + ') → safe none record');
    });

    // Requirement #6/#9: a restored note remains gated by CURRENT readiness. The same
    // saved record is active only under an eligible gate, never under an ineligible one
    // — even before reconcile is called.
    assert(OI.resolve(OI.restore(saved), ELIGIBLE_READINESS).active === true,
        'restored note is active under a currently-eligible gate');
    ['no-content', 'over-page-limit', 'proof-approval-stale', 'proof-pending-review',
     'preflight-blocking-failure'
    ].forEach(function (code) {
        const view = OI.resolve(OI.restore(saved), blockedReadiness(code));
        assert(view.active === false, 'restored note is NOT active under ineligible (' + code + ')');
        assert(view.state === 'blocked', 'restored note resolves as blocked under ineligible (' + code + ')');
    });

    // Requirement scenarios: proof becomes stale / over-limit AFTER a local intent was
    // saved → reconcile durably parks the note as blocked carrying the safe blocker.
    [['proof-approval-stale'], ['over-page-limit']].forEach(function (c) {
        const rec = OI.reconcile(saved, blockedReadiness(c[0]));
        assert(rec.changed === true && rec.state.status === 'blocked',
            c[0] + ' after save → note durably blocked');
        assert(rec.state.blockedReason === c[0], c[0] + ' after save → blocked reason is the safe gate code');
        // ...and it restores cleanly once eligible again.
        const back = OI.reconcile(rec.state, ELIGIBLE_READINESS);
        assert(back.changed === true && back.state.status === 'intent-draft-local',
            c[0] + ' → restores to a live note when eligible again');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
