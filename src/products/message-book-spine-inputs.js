(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book spine / stock / binding input contract ────────────────────
    // The single tested boundary that answers one question: "which spine, stock,
    // binding, and material facts must be KNOWN before a spine width can be computed
    // and a cover can be unblocked — and which are still missing?" It is an INPUT-
    // AVAILABILITY model only. It selects no vendor, confirms no stock or binding,
    // renders no cover or spine, produces no print / export / PDF file, writes nothing,
    // and reaches no vendor. Modelling which material inputs are present creates no
    // artifact; it only records, locally and deterministically, whether the spine width
    // is even computable yet — and, honestly, that several of its inputs are not.
    //
    // It decomposes 8G's `spine-known` and `cover-known` inputs honestly. 8G
    // (MessageBookRenderEnvironment) takes opaque `spineWidthKnown` / cover-gate
    // booleans among its render-environment inputs. This module says what those
    // booleans are actually made of — the internal stock/binding direction, the vendor
    // stock/binding confirmation, the paper and board thickness, the confirmed page
    // count, the derived spine-width computability, and the derived cover-unblock — and
    // only reports spine width computable (and cover unblocked) when EVERY required
    // material input is genuinely present. The whole point is honesty: it identifies
    // which facts exist versus which are still missing; it never invents a material or
    // vendor fact to force spine width or the cover past missing.
    //
    // Where each input's truth lives (this module owns no material spec and duplicates none):
    //   internal stock direction   — BOOK_PRODUCTION_DEPS.STOCK in index.html
    //                                (scope-guarded; a provisional launch direction, KNOWN)
    //   internal binding direction — BOOK_PRODUCTION_DEPS.BINDING in index.html
    //                                (scope-guarded; a locked direction, KNOWN)
    //   vendor stock confirmation  — captured production dependency `stockConfirmed`
    //                                (vendor-supplied; currently FALSE)
    //   vendor binding confirmation— captured production dependency `bindingConfirmed`
    //                                (vendor-supplied; currently FALSE)
    //   paper thickness per leaf   — vendor-supplied caliper; NOT in repo truth (MISSING)
    //   board thickness            — vendor-supplied cover board; NOT in repo truth (MISSING)
    //   page count                 — captured BookRenderSpec real paginator page count (KNOWN)
    //   cover gate                 — captured production dependency `coverGenerationBlocked`
    //                                (always blocked until vendor spec confirmed; TRUE)
    //
    // Spine width follows the formula documented in BOOK_PRODUCTION_DEPS (index.html):
    //   spine width = (pageCount × paperThicknessPerLeaf) + boardThickness — vendor-supplied.
    // The thicknesses are not in repo truth, so the spine width is NOT computable today;
    // it is computed only on the hypothetical path where every input is genuinely supplied.
    //
    // Knowing every material input is NOT a rendered spine, NOT a rendered or generated
    // cover, NOT a known render environment, NOT artifact generation, NOT a print file,
    // NOT a confirmed vendor, and NOT manufacturing readiness. Those higher rungs are
    // decided elsewhere (8G render environment, 8E artifact generation, 8A manufacturing)
    // and are reported here only as explicitly-false flags so nothing can imply they are
    // met by knowing the material inputs.
    //
    // Fully pure: a deterministic function of its inputs. No DOM, no clock, no Date, no
    // Math.random, no I/O, no network, no storage. It consumes already-decided facts
    // (a BOOK_PRODUCTION_DEPS-shaped production direction, the captured production-
    // dependency booleans, an optional vendor-supplied material spec, and a page count)
    // and references no sibling module at runtime, so it loads alone. The source carries
    // no commerce/production action verb or call-to-action (guarded by its own source-scan
    // test), so the contract can never imply that a spine or cover has been rendered, a
    // file produced, a vendor selected, or a book manufactured, packaged, or shipped.

    var CONTRACT_VERSION = 'kmsi1';
    var PRODUCT_TYPE_ID  = 'message-book';

    // The spine-input preflight ladder. The contract is always known (this module defines
    // it); the aggregate is reached only when every required material input is present.
    // The higher concerns — render environment, artifact generation, the production ladder —
    // are decided elsewhere and never climbed here.
    var LEVEL = Object.freeze({
        SPINE_INPUTS_CONTRACT_KNOWN: 'spine-inputs-contract-known',
        SPINE_INPUTS_KNOWN:          'spine-inputs-known'
    });

    // The transparency states. Each is evaluated present/missing. Internal direction is
    // distinct from vendor confirmation; spine-width-computable and cover-unblocked are
    // derived. (acceptance #2 — the model clearly separates these.)
    var STATE = Object.freeze({
        INTERNAL_STOCK_DIRECTION_KNOWN:   'internal-stock-direction-known',
        STOCK_CONFIRMED:                  'stock-confirmed',
        INTERNAL_BINDING_DIRECTION_KNOWN: 'internal-binding-direction-known',
        BINDING_CONFIRMED:                'binding-confirmed',
        PAPER_THICKNESS_KNOWN:            'paper-thickness-known',
        BOARD_THICKNESS_KNOWN:            'board-thickness-known',
        PAGE_COUNT_KNOWN:                 'page-count-known',
        SPINE_WIDTH_COMPUTABLE:           'spine-width-computable',
        COVER_UNBLOCKED:                  'cover-unblocked'
    });

    // Safe, non-private blocker codes. No message text, names, prices, or order numbers —
    // there are none. The internal directions get no blocker (they are known repo truth and
    // a missing direction is not what blocks spine width); the blocking material facts and
    // the two derived gates do. Priority order follows the material dependency chain:
    // vendor confirmations, then the physical thicknesses, then the page count, then the
    // derived spine-width computability, then the derived cover unblock.
    var BLOCKER = Object.freeze({
        STOCK_CONFIRMATION_MISSING:   'stock-confirmation-missing',
        BINDING_CONFIRMATION_MISSING: 'binding-confirmation-missing',
        PAPER_THICKNESS_MISSING:      'paper-thickness-missing',
        BOARD_THICKNESS_MISSING:      'board-thickness-missing',
        PAGE_COUNT_MISSING:           'page-count-missing',
        SPINE_WIDTH_NOT_COMPUTABLE:   'spine-width-not-computable',
        COVER_STILL_BLOCKED:          'cover-still-blocked'
    });

    var BLOCKER_ORDER = Object.freeze([
        BLOCKER.STOCK_CONFIRMATION_MISSING,
        BLOCKER.BINDING_CONFIRMATION_MISSING,
        BLOCKER.PAPER_THICKNESS_MISSING,
        BLOCKER.BOARD_THICKNESS_MISSING,
        BLOCKER.PAGE_COUNT_MISSING,
        BLOCKER.SPINE_WIDTH_NOT_COMPUTABLE,
        BLOCKER.COVER_STILL_BLOCKED
    ]);

    // Wherever a downstream rung is reported false, it is because the capability is not
    // implemented (mirrors the 7A/8A/8C/8E/8G framing). The render environment, artifact
    // generation, and the production ladder are decided elsewhere; this module never
    // advances them.
    var GATED_REASON = 'not-implemented';

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.STOCK_CONFIRMATION_MISSING]   = 'Vendor confirmation of the paper stock for this Message Book is not available yet.';
    _blockerMessages[BLOCKER.BINDING_CONFIRMATION_MISSING] = 'Vendor confirmation of the binding for this Message Book is not available yet.';
    _blockerMessages[BLOCKER.PAPER_THICKNESS_MISSING]      = 'The paper thickness for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.BOARD_THICKNESS_MISSING]      = 'The cover board thickness for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.PAGE_COUNT_MISSING]           = 'The confirmed interior page count for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.SPINE_WIDTH_NOT_COMPUTABLE]   = 'The spine width for this Message Book cannot be computed yet.';
    _blockerMessages[BLOCKER.COVER_STILL_BLOCKED]          = 'The cover for this Message Book is still blocked.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // A safe, descriptive record of each input, for docs / a future read-only UI. Frozen;
    // carries no app state. The producer note points at where the fact's truth lives today —
    // and is explicit where that truth is genuinely missing.
    var REQUIRED_INPUTS = Object.freeze([
        Object.freeze({ state: STATE.INTERNAL_STOCK_DIRECTION_KNOWN,   label: 'Known internal stock direction',   source: 'BOOK_PRODUCTION_DEPS.STOCK (index.html, scope-guarded)',         present: 'repo-truth', blocking: false }),
        Object.freeze({ state: STATE.STOCK_CONFIRMED,                  label: 'Vendor stock confirmation',         source: 'captured production dependency stockConfirmed (vendor-supplied)', present: 'missing',    blocking: true }),
        Object.freeze({ state: STATE.INTERNAL_BINDING_DIRECTION_KNOWN, label: 'Known internal binding direction', source: 'BOOK_PRODUCTION_DEPS.BINDING (index.html, scope-guarded)',       present: 'repo-truth', blocking: false }),
        Object.freeze({ state: STATE.BINDING_CONFIRMED,               label: 'Vendor binding confirmation',       source: 'captured production dependency bindingConfirmed (vendor-supplied)', present: 'missing',   blocking: true }),
        Object.freeze({ state: STATE.PAPER_THICKNESS_KNOWN,           label: 'Known paper thickness per leaf',    source: 'vendor-supplied caliper (not in repo truth)',                    present: 'missing',    blocking: true }),
        Object.freeze({ state: STATE.BOARD_THICKNESS_KNOWN,           label: 'Known cover board thickness',       source: 'vendor-supplied board (not in repo truth)',                      present: 'missing',    blocking: true }),
        Object.freeze({ state: STATE.PAGE_COUNT_KNOWN,                label: 'Known confirmed interior page count', source: 'captured BookRenderSpec real paginator page count (6B/6C)',     present: 'derived',    blocking: true }),
        Object.freeze({ state: STATE.SPINE_WIDTH_COMPUTABLE,          label: 'Spine width computable',            source: 'derived: paper + board thickness + page count all present',      present: 'derived',    blocking: true }),
        Object.freeze({ state: STATE.COVER_UNBLOCKED,                 label: 'Cover unblocked',                   source: 'derived: cover gate open + stock + binding confirmed + spine computable', present: 'derived', blocking: true })
    ]);

    function _isFiniteNumber(n) {
        return typeof n === 'number' && isFinite(n);
    }

    function _isPositiveNumber(n) {
        return _isFiniteNumber(n) && n > 0;
    }

    function _isPositiveInteger(n) {
        return _isPositiveNumber(n) && Math.floor(n) === n;
    }

    // Evaluate the spine / stock / binding input availability from already-decided facts.
    // input: {
    //   internalStockDirectionKnown   : boolean — repo has a stock direction (BOOK_PRODUCTION_DEPS.STOCK)
    //   stockConfirmed                : boolean — vendor stock confirmation (currently false)
    //   internalBindingDirectionKnown : boolean — repo has a binding direction (BOOK_PRODUCTION_DEPS.BINDING)
    //   bindingConfirmed              : boolean — vendor binding confirmation (currently false)
    //   paperThicknessPerLeafIn       : number  — vendor-supplied paper caliper (currently absent)
    //   boardThicknessIn              : number  — vendor-supplied board thickness (currently absent)
    //   pageCount                     : number  — confirmed interior page count
    //   coverGenerationBlocked        : boolean — cover gate (blocked unless explicitly false)
    // }
    function evaluate(input) {
        var i = input || {};

        var internalStockDirectionKnown   = i.internalStockDirectionKnown === true;
        var stockConfirmed                = i.stockConfirmed === true;
        var internalBindingDirectionKnown = i.internalBindingDirectionKnown === true;
        var bindingConfirmed              = i.bindingConfirmed === true;

        var paperThicknessKnown = _isPositiveNumber(i.paperThicknessPerLeafIn);
        var boardThicknessKnown = _isPositiveNumber(i.boardThicknessIn);
        var pageCountKnown      = _isPositiveInteger(i.pageCount);

        // Spine width is computable only when every required physical input is genuinely
        // present. The cover gate is treated as blocked unless explicitly opened.
        var spineWidthComputable = paperThicknessKnown && boardThicknessKnown && pageCountKnown;
        var coverBlocked = i.coverGenerationBlocked !== false;

        // Spine width follows the documented BOOK_PRODUCTION_DEPS formula. Computed ONLY on
        // the path where every input is genuinely supplied; otherwise null (never invented).
        var spineWidthIn = spineWidthComputable
            ? (i.pageCount * i.paperThicknessPerLeafIn) + i.boardThicknessIn
            : null;

        // Cover is unblocked only when the external gate is open AND stock + binding are
        // vendor-confirmed AND the spine width is computable (mirrors 8G _coverKnown).
        var coverUnblocked = (coverBlocked === false) &&
            stockConfirmed && bindingConfirmed && spineWidthComputable;

        var states = {};
        states[STATE.INTERNAL_STOCK_DIRECTION_KNOWN]   = internalStockDirectionKnown;
        states[STATE.STOCK_CONFIRMED]                  = stockConfirmed;
        states[STATE.INTERNAL_BINDING_DIRECTION_KNOWN] = internalBindingDirectionKnown;
        states[STATE.BINDING_CONFIRMED]                = bindingConfirmed;
        states[STATE.PAPER_THICKNESS_KNOWN]            = paperThicknessKnown;
        states[STATE.BOARD_THICKNESS_KNOWN]            = boardThicknessKnown;
        states[STATE.PAGE_COUNT_KNOWN]                 = pageCountKnown;
        states[STATE.SPINE_WIDTH_COMPUTABLE]           = spineWidthComputable;
        states[STATE.COVER_UNBLOCKED]                  = coverUnblocked;

        // Collect blockers in priority order. Each maps to a blocking state being false.
        var blockers = [];
        if (!stockConfirmed)        blockers.push(BLOCKER.STOCK_CONFIRMATION_MISSING);
        if (!bindingConfirmed)      blockers.push(BLOCKER.BINDING_CONFIRMATION_MISSING);
        if (!paperThicknessKnown)   blockers.push(BLOCKER.PAPER_THICKNESS_MISSING);
        if (!boardThicknessKnown)   blockers.push(BLOCKER.BOARD_THICKNESS_MISSING);
        if (!pageCountKnown)        blockers.push(BLOCKER.PAGE_COUNT_MISSING);
        if (!spineWidthComputable)  blockers.push(BLOCKER.SPINE_WIDTH_NOT_COMPUTABLE);
        if (!coverUnblocked)        blockers.push(BLOCKER.COVER_STILL_BLOCKED);

        var allInputsConfirmed = blockers.length === 0;
        var furthestLevel = allInputsConfirmed
            ? LEVEL.SPINE_INPUTS_KNOWN
            : LEVEL.SPINE_INPUTS_CONTRACT_KNOWN;

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            // Spine-input ladder (booleans).
            spineInputsContractKnown: true,
            allInputsConfirmed:       allInputsConfirmed,

            // Per-state transparency.
            states: states,

            // Internal material direction is distinct from vendor confirmation (acceptance #2).
            internalStockDirectionKnown:   internalStockDirectionKnown,
            internalBindingDirectionKnown: internalBindingDirectionKnown,
            stockConfirmed:                stockConfirmed,
            bindingConfirmed:              bindingConfirmed,

            // Derived material facts.
            paperThicknessKnown:  paperThicknessKnown,
            boardThicknessKnown:  boardThicknessKnown,
            pageCountKnown:       pageCountKnown,
            spineWidthComputable: spineWidthComputable,
            spineWidthIn:         spineWidthIn,
            coverUnblocked:       coverUnblocked,

            // Strictly separate, higher concerns — decided elsewhere, never advanced here.
            // Reported false so nothing can imply that knowing the material inputs produced a
            // known render environment, an artifact, a print file, a vendor, manufacturing, or
            // packaging (acceptance #2).
            renderEnvironmentKnown:        false,
            exportArtifactGenerationReady: false,
            printFileReady:                false,
            vendorReady:                   false,
            manufacturingReady:            false,
            packagingReady:                false,
            gatedReason:                   GATED_REASON,

            // Diagnostics.
            furthestLevel:   furthestLevel,
            blockers:        blockers,
            primaryBlocker:  blockers.length ? blockers[0] : null,
            blockerMessages: blockers.map(blockerMessage)
        };
    }

    // Honest derivation helpers from a BOOK_PRODUCTION_DEPS-shaped production direction.
    // A direction is "known" only when its value is a genuinely present, non-empty string.
    function _directionKnown(value) {
        return typeof value === 'string' && value.length > 0;
    }

    // Bridge from already-decided repo-truth facts to the evaluate() input. It reads the
    // BOOK_PRODUCTION_DEPS-shaped production direction for the internal stock/binding
    // direction, the captured production dependencies for the vendor confirmations and the
    // cover gate, an optional vendor-supplied material spec for the paper/board thickness,
    // and an explicit confirmed page count — never inventing a material or vendor fact.
    // Pure: reads only its argument and calls evaluate() / describeReadiness(); references
    // no sibling module at runtime.
    function resolveFromContext(args) {
        var a   = args || {};
        var dir = a.productionDirection    || null;
        var dep = a.productionDependencies || null;
        var mat = a.materialSpec           || null;

        var input = {
            internalStockDirectionKnown:   _directionKnown(dir && dir.STOCK),
            internalBindingDirectionKnown: _directionKnown(dir && dir.BINDING),
            stockConfirmed:                !!(dep && dep.stockConfirmed === true),
            bindingConfirmed:              !!(dep && dep.bindingConfirmed === true),
            paperThicknessPerLeafIn:       mat ? mat.paperThicknessPerLeafIn : undefined,
            boardThicknessIn:              mat ? mat.boardThicknessIn : undefined,
            pageCount:                     a.pageCount,
            // Cover gate: blocked unless the captured dependency explicitly opens it.
            coverGenerationBlocked:        !(dep && dep.coverGenerationBlocked === false)
        };
        var result = evaluate(input);
        return {
            input:   input,
            result:  result,
            display: describeReadiness(result)
        };
    }

    // Honest bridge to MessageBookRenderEnvironment (8G). 8G's resolveFromContext takes a
    // `productionDependencies` object with opaque `spineWidthKnown` / cover-gate / stock /
    // binding booleans among its render-environment inputs. This maps the 8H derived facts
    // onto exactly those fields: `spineWidthKnown` is true ONLY when the spine width is
    // genuinely computable, and `coverGenerationBlocked` opens ONLY when the cover is
    // genuinely unblocked. While the material facts remain missing, spineWidthKnown stays
    // false and the cover stays blocked, so feeding this to 8G keeps its aggregate honestly
    // false at `spine-missing`. Only a FUTURE package that supplies those material facts
    // could flip it; this package never invents them. 8G is NOT modified — it consumes
    // these booleans through its existing input path, so 8G keeps referencing no sibling
    // module at runtime. The merge with 8G's interior-structure input stays with the caller.
    function toRenderEnvironmentInput(result) {
        var r = result || {};
        return {
            spineWidthKnown:        r.spineWidthComputable === true,
            coverGenerationBlocked: r.coverUnblocked !== true,
            stockConfirmed:         r.stockConfirmed === true,
            bindingConfirmed:       r.bindingConfirmed === true
        };
    }

    // ── Read-only display layer ──────────────────────────────────────────────
    // A live caller may SHOW this preflight. The copy never says ready-to-print,
    // print-now, export-now, order, buy, pay, or ship, and never implies a confirmed
    // vendor, a rendered spine or cover, a print file, or a manufacturing step — it states
    // only which material inputs are known versus missing.
    var STATUS_TONE = Object.freeze({
        GATED: 'gated',
        KNOWN: 'known'
    });

    var _GATED_HEADLINE = 'The spine and cover inputs are not ready yet';
    var _KNOWN_HEADLINE = 'Spine and cover inputs are known';
    var _KNOWN_DETAIL   = 'Every spine and cover input is present; the render environment and export artifact generation are still not implemented.';

    // Pure display view-model for a result: { tone, headline, detail, blocker }.
    // Only an all-inputs-confirmed result is reported as known (and even then the detail
    // makes clear the render environment and artifact generation are not implemented);
    // otherwise the safe primary blocker message is the one-line detail, plus the primary
    // blocker code for theming.
    function describeReadiness(result) {
        var r = result || {};
        if (r.allInputsConfirmed) {
            return {
                tone:     STATUS_TONE.KNOWN,
                headline: _KNOWN_HEADLINE,
                detail:   _KNOWN_DETAIL,
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

    // Plain-language statement of what this contract is, what it is explicitly distinct
    // from, and — emphatically — what it does not do. Mirrors the on-device framing of the
    // 8C/8E/8G readiness copy.
    function describeBoundary() {
        return {
            version: CONTRACT_VERSION,
            decides: 'which spine, stock, binding, and material inputs must be known before a spine width can be computed and a cover can be unblocked, and which are still missing',
            isA:     'spine / stock / binding material-input availability contract computed from already-decided facts',
            doesNot: 'It does not select, confirm, or contact any vendor, render or generate any spine or cover, produce any print, export, or PDF file, write any file, build a vendor packet, or begin manufacturing, packaging, or shipping.',

            // The spine-input model is strictly distinct from each of these.
            distinctFrom: {
                renderEnvironment:      'whether every render-environment input is known once spine + cover are known (8G; aggregate still false)',
                exportPipeline:         'whether the export pipeline could actually produce a print file once the inputs are known (8E; not implemented)',
                manufacturingReadiness: 'the production ladder above checkout (8A/8B)'
            },

            // The rungs this contract keeps separate (acceptance #2).
            separates: ['internal-material-direction', 'vendor-material-confirmation', 'spine-width-computability', 'cover-unblocking', 'render-environment-known', 'export-artifact-generation', 'print-file', 'vendor', 'manufacturing', 'packaging'],

            // Spine width follows the documented BOOK_PRODUCTION_DEPS formula; the thicknesses
            // it needs are vendor-supplied and not in repo truth.
            spineWidthFormula: '(pageCount × paperThicknessPerLeaf) + boardThickness — vendor-supplied thicknesses',
            blockerCodes:      BLOCKER_ORDER.slice(),
            notImplemented:    ['vendor-confirmation', 'spine-rendering', 'cover-generation', 'render-environment-known', 'export-artifact-generation', 'print-file-generation', 'manufacturing', 'packaging'],
            materialSourceOfTruth: 'BOOK_PRODUCTION_DEPS in index.html (scope-guarded; not modified) for internal stock/binding direction; vendor-supplied paper/board thickness is not in repo truth',
            artifactFree:   true,
            recordedOnDevice: true
        };
    }

    KMEngine.MessageBookSpineInputs = {
        CONTRACT_VERSION:         CONTRACT_VERSION,
        PRODUCT_TYPE_ID:          PRODUCT_TYPE_ID,
        LEVEL:                    LEVEL,
        STATE:                    STATE,
        BLOCKER:                  BLOCKER,
        BLOCKER_ORDER:            BLOCKER_ORDER,
        REQUIRED_INPUTS:          REQUIRED_INPUTS,
        STATUS_TONE:              STATUS_TONE,
        GATED_REASON:             GATED_REASON,
        blockerMessage:           blockerMessage,
        evaluate:                 evaluate,
        resolveFromContext:       resolveFromContext,
        toRenderEnvironmentInput: toRenderEnvironmentInput,
        describeReadiness:        describeReadiness,
        describeBoundary:         describeBoundary
    };
}());
