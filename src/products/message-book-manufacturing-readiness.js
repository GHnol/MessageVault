(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book manufacturing / export / production-readiness boundary ────
    // A single, tested source of truth for what must be true before a Message Book
    // could ever become print-production / export / vendor / manufacturing ready
    // LATER. It is a readiness BOUNDARY and blocker MATRIX, not production: it
    // generates no print file, export file, vendor packet, or shipping label, it
    // selects no vendor, and it begins no manufacturing, packaging, or shipping. It
    // only reads already-decided facts and reports, with safe blocker codes, how far
    // a book is from each downstream production capability — capabilities that have
    // not been implemented and therefore remain explicitly false.
    //
    // It sits ABOVE the 7A/7B checkout-readiness gate. Those answer "is this proof
    // safe enough to proceed toward checkout later"; this answers the separate,
    // higher question "what production requirements are still missing". The two are
    // not the same, and neither is the local order intent (7D/7E):
    //
    //   proof approval (5D/5E)       — the proof content is signed off on this device
    //   checkout eligibility (7A/7B) — the proof is safe to proceed toward checkout later
    //   local order intent (7D/7E)   — a local, non-transactional note to continue later
    //   production readiness (this)  — print-spec / export / vendor / manufacturing
    //                                  / packaging requirements are met
    //
    // It is GATED by those lower layers and by the repo's genuine production
    // capability. It consumes their RESULTS (a 7A readiness result's checkoutEligible,
    // a 7D/7E intent view's active) and never recomputes proof, page-limit, preflight,
    // or eligibility logic itself. It references no sibling module at runtime (it reads
    // the result objects passed to it), so it loads alone.
    //
    // Fully pure: a deterministic function of its inputs. No DOM, no clock, no Date,
    // no Math.random, no I/O, no network, no storage, no record builders. The source
    // carries no commerce/production ACTION verb or call-to-action (guarded by its own
    // source-scan test), so the boundary can never imply that a book has been bought,
    // charged, ordered, printed, exported, manufactured, packaged, or shipped.

    var CONTRACT_VERSION = 'kmmr1';

    var PRODUCT_TYPE_ID = 'message-book';

    // The production-readiness ladder. Each rung requires every rung below it.
    // production-boundary-known is the floor — this module defines the boundary, so it
    // is always known. The rungs above it are real downstream capabilities; none are
    // implemented yet, so the ladder never climbs past the floor in the live app.
    var LEVEL = Object.freeze({
        PRODUCTION_BOUNDARY_KNOWN: 'production-boundary-known',
        EXPORT_SPEC_KNOWN:         'export-spec-known',
        PRINT_FILE_READY:          'print-file-ready',
        VENDOR_READY:              'vendor-ready',
        MANUFACTURING_READY:       'manufacturing-ready',
        PACKAGING_READY:           'packaging-ready'
    });

    // Stable, safe reason codes for why a production rung is withheld. Non-private
    // enums (no message text, names, prices, line items, or order numbers — there are
    // none) suitable for powering a later UI. Collected in priority order, most
    // fundamental first; blockers[0] is the primary blocker.
    var BLOCKER = Object.freeze({
        CHECKOUT_NOT_ELIGIBLE:           'checkout-not-eligible',
        NO_LOCAL_INTENT:                 'no-local-intent',
        PRINT_SPEC_NOT_SELECTED:         'print-spec-not-selected',
        EXPORT_PIPELINE_NOT_IMPLEMENTED: 'export-pipeline-not-implemented',
        VENDOR_NOT_SELECTED:             'vendor-not-selected',
        MANUFACTURING_NOT_IMPLEMENTED:   'manufacturing-not-implemented',
        PACKAGING_NOT_IMPLEMENTED:       'packaging-not-implemented'
    });

    // Higher production capabilities are separate, not-started concerns; wherever a
    // rung is reported false the reason is that the capability is not implemented.
    var GATED_REASON = 'not-implemented';

    // The repo's CURRENT, genuine production capability. Every capability is false —
    // there is no selected print spec, no export pipeline, no confirmed vendor, no
    // manufacturing submission, and no packaging. resolveFromReadiness applies this by
    // default, so the live answer is guaranteed to keep every production rung false
    // until the repo genuinely implements one of these pieces (a later package would
    // flip the corresponding flag with its implementation). Static product facts that
    // exist today — the 7x10 hardcover design note and the "IngramSpark vendor
    // confirmation pending" note in ProductRenderSpecs — are NOT a selected machine
    // spec or a confirmed vendor, so they do not flip any flag here.
    var CAPABILITIES = Object.freeze({
        printSpecSelected:         false,
        exportPipelineImplemented: false,
        vendorSelected:            false,
        manufacturingImplemented:  false,
        packagingImplemented:      false
    });

    // Policy: a local, non-transactional order-intent note (7D/7E) is required before
    // production readiness can begin. Checkout eligibility alone is not enough — the
    // user must have locally marked the eligible proof to continue. evaluate() honors
    // an optional per-call requireLocalIntent override so both branches are explicit
    // and testable; the default is this policy.
    var LOCAL_INTENT_REQUIRED = true;

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.CHECKOUT_NOT_ELIGIBLE]           = 'This Message Book is not checkout-eligible yet.';
    _blockerMessages[BLOCKER.NO_LOCAL_INTENT]                 = 'No local intent to continue has been saved on this device yet.';
    _blockerMessages[BLOCKER.PRINT_SPEC_NOT_SELECTED]         = 'A print production specification has not been selected yet.';
    _blockerMessages[BLOCKER.EXPORT_PIPELINE_NOT_IMPLEMENTED] = 'The print and export pipeline is not implemented yet.';
    _blockerMessages[BLOCKER.VENDOR_NOT_SELECTED]             = 'A print vendor has not been confirmed yet.';
    _blockerMessages[BLOCKER.MANUFACTURING_NOT_IMPLEMENTED]   = 'Manufacturing is not implemented yet.';
    _blockerMessages[BLOCKER.PACKAGING_NOT_IMPLEMENTED]       = 'Packaging is not implemented yet.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // Evaluate the production-readiness ladder from already-decided facts. checkoutEligible
    // and hasLocalIntent come from the lower layers (7A result / 7D-7E intent view); the
    // remaining flags describe genuine repo production capability and default false.
    function evaluate(input) {
        var i = input || {};

        var checkoutEligible          = (i.checkoutEligible === true);
        var requireLocalIntent        = (i.requireLocalIntent !== undefined)
            ? !!i.requireLocalIntent : LOCAL_INTENT_REQUIRED;
        var hasLocalIntent            = !!i.hasLocalIntent;
        var printSpecSelected         = !!i.printSpecSelected;
        var exportPipelineImplemented = !!i.exportPipelineImplemented;
        var vendorSelected            = !!i.vendorSelected;
        var manufacturingImplemented  = !!i.manufacturingImplemented;
        var packagingImplemented      = !!i.packagingImplemented;

        var localIntentSatisfied = !requireLocalIntent || hasLocalIntent;

        // Blocking reasons in priority order, most fundamental first.
        var blockers = [];
        if (!checkoutEligible)                          blockers.push(BLOCKER.CHECKOUT_NOT_ELIGIBLE);
        if (requireLocalIntent && !hasLocalIntent)      blockers.push(BLOCKER.NO_LOCAL_INTENT);
        if (!printSpecSelected)                         blockers.push(BLOCKER.PRINT_SPEC_NOT_SELECTED);
        if (!exportPipelineImplemented)                 blockers.push(BLOCKER.EXPORT_PIPELINE_NOT_IMPLEMENTED);
        if (!vendorSelected)                            blockers.push(BLOCKER.VENDOR_NOT_SELECTED);
        if (!manufacturingImplemented)                  blockers.push(BLOCKER.MANUFACTURING_NOT_IMPLEMENTED);
        if (!packagingImplemented)                      blockers.push(BLOCKER.PACKAGING_NOT_IMPLEMENTED);

        // Readiness ladder. Each rung requires every rung below it. The floor is always
        // known; each higher rung requires checkout eligibility, the local intent (when
        // required), and the genuine capability for that step.
        var productionBoundaryKnown = true;
        var exportSpecKnown         = checkoutEligible && localIntentSatisfied && printSpecSelected;
        var printFileReady          = exportSpecKnown && exportPipelineImplemented;
        var vendorReady             = printFileReady && vendorSelected;
        var manufacturingReady      = vendorReady && manufacturingImplemented;
        var packagingReady          = manufacturingReady && packagingImplemented;

        var furthestLevel = LEVEL.PRODUCTION_BOUNDARY_KNOWN;
        if (exportSpecKnown)    furthestLevel = LEVEL.EXPORT_SPEC_KNOWN;
        if (printFileReady)     furthestLevel = LEVEL.PRINT_FILE_READY;
        if (vendorReady)        furthestLevel = LEVEL.VENDOR_READY;
        if (manufacturingReady) furthestLevel = LEVEL.MANUFACTURING_READY;
        if (packagingReady)     furthestLevel = LEVEL.PACKAGING_READY;

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            // Readiness ladder (booleans).
            productionBoundaryKnown: productionBoundaryKnown,
            exportSpecKnown:         exportSpecKnown,
            printFileReady:          printFileReady,
            vendorReady:             vendorReady,
            manufacturingReady:      manufacturingReady,
            packagingReady:          packagingReady,

            // Echo the policy actually applied so a caller/UI can explain it.
            requireLocalIntent: requireLocalIntent,

            // Wherever a rung is false, it is because the capability is not implemented.
            gatedReason: GATED_REASON,

            // Diagnostics.
            furthestLevel:   furthestLevel,
            blockers:        blockers,
            primaryBlocker:  blockers.length ? blockers[0] : null,
            blockerMessages: blockers.map(blockerMessage)
        };
    }

    // ── Read-only display layer ──────────────────────────────────────────────
    // A future UI may want to SHOW this boundary. The copy never says ready-to-print,
    // print-now, order, buy, pay, ship, or that a vendor/manufacturing step is
    // available — it states only how far the book is from production and that the
    // missing steps are not implemented yet.
    var STATUS_TONE = Object.freeze({
        GATED: 'gated',
        READY: 'ready'
    });

    var _GATED_HEADLINE = 'Print production is not available yet';
    var _READY_HEADLINE = 'All print production requirements are met';
    var _READY_DETAIL   = 'Every print production requirement is satisfied.';

    // Pure display view-model for a readiness result: { tone, headline, detail, blocker }.
    // Only an all-requirements-met result (packagingReady — unreachable until the repo
    // implements every production step) is reported ready; otherwise the safe primary
    // blocker message is the one-line detail, plus the primary blocker code for theming.
    function describeReadiness(result) {
        var r = result || {};
        if (r.packagingReady) {
            return {
                tone:     STATUS_TONE.READY,
                headline: _READY_HEADLINE,
                detail:   _READY_DETAIL,
                blocker:  null
            };
        }
        var primary = r.primaryBlocker || null;
        var detail  = (r.blockerMessages && r.blockerMessages.length)
            ? r.blockerMessages[0]
            : (primary ? blockerMessage(primary) : '');
        return {
            tone:     STATUS_TONE.GATED,
            headline: _GATED_HEADLINE,
            detail:   detail,
            blocker:  primary
        };
    }

    // Read-only bridge for a live caller: map the RESULTS the lower layers already
    // produced — a 7A/7B MessageBookReadiness result (checkoutEligible) and a 7D/7E
    // MessageBookOrderIntent resolve view (active) — plus the repo's genuine production
    // capability (CAPABILITIES by default) into the evaluate() input, run the boundary,
    // and attach display copy. Because CAPABILITIES is all-false, this guarantees every
    // production rung stays false in the live app. Pure: reads only its argument and
    // calls evaluate()/describeReadiness(); references no sibling module at runtime.
    function resolveFromReadiness(args) {
        var a         = args || {};
        var readiness = a.readiness || {};
        var intent    = a.intent || {};
        var caps      = a.capabilities || CAPABILITIES;
        var input = {
            checkoutEligible:          readiness.checkoutEligible === true,
            requireLocalIntent:        (a.requireLocalIntent !== undefined)
                ? !!a.requireLocalIntent : LOCAL_INTENT_REQUIRED,
            hasLocalIntent:            intent.active === true,
            printSpecSelected:         !!caps.printSpecSelected,
            exportPipelineImplemented: !!caps.exportPipelineImplemented,
            vendorSelected:            !!caps.vendorSelected,
            manufacturingImplemented:  !!caps.manufacturingImplemented,
            packagingImplemented:      !!caps.packagingImplemented
        };
        var result = evaluate(input);
        return {
            input:   input,
            result:  result,
            display: describeReadiness(result)
        };
    }

    // Plain-language statement of what this boundary is, what it is explicitly distinct
    // from, and — emphatically — what it does not do. Mirrors the on-device framing of
    // the 7A/7B/7D readiness copy.
    function describeBoundary() {
        return {
            version: CONTRACT_VERSION,
            decides: 'what must be true before a Message Book could ever become print-production / export / vendor ready later',
            isA:     'readiness boundary and blocker matrix computed from already-decided facts',
            doesNot: 'It does not generate any print or export file, build a vendor packet or shipping label, select a vendor, or begin manufacturing, packaging, or shipping.',

            // The four layers are deliberately separate (acceptance #2).
            distinctFrom: {
                proofApproval:       'whether the proof content is signed off on this device (5D/5E)',
                checkoutEligibility: 'whether the proof is safe to proceed toward checkout later (7A/7B)',
                localOrderIntent:    'a local, non-transactional note to continue later (7D/7E)'
            },

            separateGates:  ['print-spec', 'export-pipeline', 'vendor', 'manufacturing', 'packaging'],
            notImplemented: ['print-spec-selection', 'export-pipeline', 'vendor-confirmation', 'manufacturing', 'packaging'],
            recordedOnDevice: true
        };
    }

    KMEngine.MessageBookManufacturingReadiness = {
        CONTRACT_VERSION:     CONTRACT_VERSION,
        PRODUCT_TYPE_ID:      PRODUCT_TYPE_ID,
        LEVEL:                LEVEL,
        BLOCKER:              BLOCKER,
        STATUS_TONE:          STATUS_TONE,
        GATED_REASON:         GATED_REASON,
        CAPABILITIES:         CAPABILITIES,
        LOCAL_INTENT_REQUIRED: LOCAL_INTENT_REQUIRED,
        evaluate:             evaluate,
        blockerMessage:       blockerMessage,
        describeReadiness:    describeReadiness,
        resolveFromReadiness: resolveFromReadiness,
        describeBoundary:     describeBoundary
    };
}());
