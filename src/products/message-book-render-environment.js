(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book render-environment input / preflight contract ─────────────
    // The single tested boundary that answers one question: "which render-environment
    // facts an export pipeline must KNOW before a real print artifact could ever be
    // produced are GENUINELY available, and which are still missing?" It is an INPUT-
    // AVAILABILITY model only. It produces no print file, no export file, no PDF, no
    // cover artwork, no spine, and no vendor packet; it writes nothing and reaches no
    // vendor. Modelling which render inputs are present creates no artifact; it only
    // records, locally and deterministically, whether the render environment is even
    // describable yet — and, honestly, that several of its inputs are not.
    //
    // It decomposes the 8E `render-environment-missing` blocker honestly. 8E
    // (MessageBookExportPipeline) takes a single opaque `renderEnvironmentKnown`
    // boolean. This module says what that boolean is actually made of — the cover,
    // spine, safe-area, bleed/trim, parity/padding, font/render-availability,
    // interior-structure, and export-target inputs — evaluates each present/missing
    // from already-decided repo truth, and only reports the aggregate true when EVERY
    // required input is genuinely present. The whole point is honesty: it identifies
    // which facts exist versus which are still missing; it never invents a production
    // fact to force the aggregate past missing.
    //
    // Where each input's truth lives (this module owns no geometry and duplicates none):
    //   trim / bleed / safe-area / export-target — BOOK_PRODUCTION_DEPS in index.html
    //                                              (scope-guarded; only pointed at here)
    //   parity / padding                         — BOOK_PARITY in index.html (scope-guarded)
    //   interior structure                       — captured BookRenderSpec page metadata
    //                                              (`interiorPageCountConfirmed`)
    //   spine width                              — captured BookRenderSpec
    //                                              (`spineWidthKnown` — vendor-supplied
    //                                              paper/board thickness, currently FALSE)
    //   cover                                    — cover gate (`coverGenerationBlocked` +
    //                                              stock/binding confirmation, currently
    //                                              BLOCKED/FALSE)
    //   font / emoji render availability         — ProductPreflight FONT_AVAILABILITY /
    //                                              EMOJI_STRATEGY_CONFIRMED checks (no
    //                                              render-environment input present yet)
    //
    // Knowing every render input is NOT a print file, NOT artifact generation, NOT a
    // vendor-ready output, and NOT manufacturing readiness. Those higher rungs are
    // decided elsewhere (8E artifact generation, 8A manufacturing) and are reported
    // here only as explicitly-false flags so nothing can imply they are met by knowing
    // the render inputs.
    //
    // Fully pure: a deterministic function of its inputs. No DOM, no clock, no Date,
    // no Math.random, no I/O, no network, no storage. It consumes already-decided facts
    // (BOOK_PRODUCTION_DEPS / BOOK_PARITY-shaped geometry, captured production-dependency
    // booleans, a font/emoji availability signal) and references no sibling module at
    // runtime, so it loads alone. The source carries no commerce/production action verb
    // or call-to-action (guarded by its own source-scan test), so the contract can never
    // imply that a book has been rendered to a file, exported, printed, sent to a vendor,
    // manufactured, packaged, or shipped.

    var CONTRACT_VERSION = 'kmre1';
    var PRODUCT_TYPE_ID  = 'message-book';

    // The render-environment preflight ladder. The contract is always known (this module
    // defines it); the aggregate is reached only when every required input is present.
    // Both higher concerns — artifact generation and the production ladder — are decided
    // elsewhere and never climbed here.
    var LEVEL = Object.freeze({
        RENDER_ENVIRONMENT_CONTRACT_KNOWN: 'render-environment-contract-known',
        RENDER_ENVIRONMENT_KNOWN:          'render-environment-known'
    });

    // The required render-environment inputs. Each is evaluated present/missing.
    var INPUT = Object.freeze({
        INTERIOR_STRUCTURE_KNOWN: 'interior-structure-known',
        TRIM_KNOWN:               'trim-known',
        BLEED_KNOWN:              'bleed-known',
        SAFE_AREA_KNOWN:          'safe-area-known',
        PARITY_KNOWN:             'parity-known',
        SPINE_KNOWN:              'spine-known',
        COVER_KNOWN:              'cover-known',
        FONT_RENDER_KNOWN:        'font-render-known',
        EXPORT_TARGET_KNOWN:      'export-target-known'
    });

    // Priority order following the render-pipeline dependency chain, most fundamental
    // first: the interior must exist, then its geometry, then the spine (which needs the
    // interior page count + stock), then the cover (which needs the spine), then the
    // font/render runtime, then the export target. Missing-input blockers are collected
    // in this order and primaryBlocker is the first.
    var INPUT_ORDER = Object.freeze([
        INPUT.INTERIOR_STRUCTURE_KNOWN,
        INPUT.TRIM_KNOWN,
        INPUT.BLEED_KNOWN,
        INPUT.SAFE_AREA_KNOWN,
        INPUT.PARITY_KNOWN,
        INPUT.SPINE_KNOWN,
        INPUT.COVER_KNOWN,
        INPUT.FONT_RENDER_KNOWN,
        INPUT.EXPORT_TARGET_KNOWN
    ]);

    // Safe, non-private reason codes. No message text, names, prices, or order numbers —
    // there are none. Each mirrors one required input.
    var BLOCKER = Object.freeze({
        INTERIOR_STRUCTURE_MISSING: 'interior-structure-missing',
        TRIM_MISSING:               'trim-missing',
        BLEED_MISSING:              'bleed-missing',
        SAFE_AREA_MISSING:          'safe-area-missing',
        PARITY_MISSING:             'parity-missing',
        SPINE_MISSING:              'spine-missing',
        COVER_MISSING:              'cover-missing',
        FONT_RENDER_MISSING:        'font-render-missing',
        EXPORT_TARGET_MISSING:      'export-target-missing'
    });

    var _inputBlocker = {};
    _inputBlocker[INPUT.INTERIOR_STRUCTURE_KNOWN] = BLOCKER.INTERIOR_STRUCTURE_MISSING;
    _inputBlocker[INPUT.TRIM_KNOWN]               = BLOCKER.TRIM_MISSING;
    _inputBlocker[INPUT.BLEED_KNOWN]              = BLOCKER.BLEED_MISSING;
    _inputBlocker[INPUT.SAFE_AREA_KNOWN]          = BLOCKER.SAFE_AREA_MISSING;
    _inputBlocker[INPUT.PARITY_KNOWN]             = BLOCKER.PARITY_MISSING;
    _inputBlocker[INPUT.SPINE_KNOWN]              = BLOCKER.SPINE_MISSING;
    _inputBlocker[INPUT.COVER_KNOWN]              = BLOCKER.COVER_MISSING;
    _inputBlocker[INPUT.FONT_RENDER_KNOWN]        = BLOCKER.FONT_RENDER_MISSING;
    _inputBlocker[INPUT.EXPORT_TARGET_KNOWN]      = BLOCKER.EXPORT_TARGET_MISSING;

    // Wherever a downstream rung is reported false, it is because the capability is not
    // implemented (mirrors the 7A/8A/8C/8E framing). Artifact generation and the
    // production ladder are decided elsewhere; this module never advances them.
    var GATED_REASON = 'not-implemented';

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.INTERIOR_STRUCTURE_MISSING] = 'The interior page structure for this Message Book is not confirmed yet.';
    _blockerMessages[BLOCKER.TRIM_MISSING]               = 'The trim size for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.BLEED_MISSING]              = 'The bleed allowance for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.SAFE_AREA_MISSING]          = 'The safe-area and margins for this Message Book are not known yet.';
    _blockerMessages[BLOCKER.PARITY_MISSING]             = 'The page parity (padding) rule for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.SPINE_MISSING]              = 'The spine width for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.COVER_MISSING]              = 'The cover inputs for this Message Book are not available yet.';
    _blockerMessages[BLOCKER.FONT_RENDER_MISSING]        = 'The font and emoji render availability for this Message Book is not confirmed yet.';
    _blockerMessages[BLOCKER.EXPORT_TARGET_MISSING]      = 'The export target for this Message Book is not known yet.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // A safe, descriptive record of each required render input, for docs / a future
    // read-only UI. Frozen; carries no app state. The producer note points at where the
    // fact's truth lives today — and is explicit where that truth is genuinely missing.
    var REQUIRED_INPUTS = Object.freeze([
        Object.freeze({ input: INPUT.INTERIOR_STRUCTURE_KNOWN, label: 'Confirmed interior page structure',           source: 'captured BookRenderSpec interiorPageCountConfirmed (6B/6C)', present: 'derived' }),
        Object.freeze({ input: INPUT.TRIM_KNOWN,               label: 'Known trim size',                             source: 'BOOK_PRODUCTION_DEPS.TRIM_IN (index.html, scope-guarded)', present: 'repo-truth' }),
        Object.freeze({ input: INPUT.BLEED_KNOWN,              label: 'Known bleed allowance',                       source: 'BOOK_PRODUCTION_DEPS.BLEED_IN (index.html, scope-guarded)', present: 'repo-truth' }),
        Object.freeze({ input: INPUT.SAFE_AREA_KNOWN,          label: 'Known safe-area inset and margins',           source: 'BOOK_PRODUCTION_DEPS.SAFE_INSET_IN / MARGINS_IN (index.html, scope-guarded)', present: 'repo-truth' }),
        Object.freeze({ input: INPUT.PARITY_KNOWN,             label: 'Known page parity / padding rule',            source: 'BOOK_PARITY.MODULUS (index.html, scope-guarded)', present: 'repo-truth' }),
        Object.freeze({ input: INPUT.SPINE_KNOWN,              label: 'Known spine width',                           source: 'captured BookRenderSpec spineWidthKnown — vendor-supplied paper/board thickness', present: 'missing' }),
        Object.freeze({ input: INPUT.COVER_KNOWN,              label: 'Available cover inputs',                      source: 'cover gate (coverGenerationBlocked + stock/binding confirmation)', present: 'missing' }),
        Object.freeze({ input: INPUT.FONT_RENDER_KNOWN,        label: 'Confirmed font and emoji render availability', source: 'ProductPreflight FONT_AVAILABILITY / EMOJI_STRATEGY_CONFIRMED (no render-environment input yet)', present: 'missing' }),
        Object.freeze({ input: INPUT.EXPORT_TARGET_KNOWN,      label: 'Known export target',                         source: 'BOOK_PRODUCTION_DEPS.PDF_SPEC (index.html, scope-guarded)', present: 'repo-truth' })
    ]);

    // Evaluate the render-environment input availability from already-decided facts.
    // input: {
    //   interiorStructureKnown : boolean — confirmed interior page structure (6B/6C)
    //   trimKnown              : boolean — trim size known (BOOK_PRODUCTION_DEPS)
    //   bleedKnown             : boolean — bleed allowance known (BOOK_PRODUCTION_DEPS)
    //   safeAreaKnown          : boolean — safe-area inset + margins known (BOOK_PRODUCTION_DEPS)
    //   parityKnown            : boolean — parity / padding rule known (BOOK_PARITY)
    //   spineKnown             : boolean — spine width known (vendor-supplied; currently false)
    //   coverKnown             : boolean — cover inputs available (currently false)
    //   fontRenderKnown        : boolean — font / emoji render availability confirmed (currently false)
    //   exportTargetKnown      : boolean — export target known (BOOK_PRODUCTION_DEPS.PDF_SPEC)
    // }
    function evaluate(input) {
        var i = input || {};

        var inputs = {};
        inputs[INPUT.INTERIOR_STRUCTURE_KNOWN] = i.interiorStructureKnown === true;
        inputs[INPUT.TRIM_KNOWN]               = i.trimKnown === true;
        inputs[INPUT.BLEED_KNOWN]              = i.bleedKnown === true;
        inputs[INPUT.SAFE_AREA_KNOWN]          = i.safeAreaKnown === true;
        inputs[INPUT.PARITY_KNOWN]             = i.parityKnown === true;
        inputs[INPUT.SPINE_KNOWN]              = i.spineKnown === true;
        inputs[INPUT.COVER_KNOWN]              = i.coverKnown === true;
        inputs[INPUT.FONT_RENDER_KNOWN]        = i.fontRenderKnown === true;
        inputs[INPUT.EXPORT_TARGET_KNOWN]      = i.exportTargetKnown === true;

        // Which required inputs are missing (priority order).
        var missingInputs = [];
        for (var k = 0; k < INPUT_ORDER.length; k++) {
            if (!inputs[INPUT_ORDER[k]]) missingInputs.push(INPUT_ORDER[k]);
        }
        var renderEnvironmentKnown = missingInputs.length === 0;

        var blockers = [];
        for (var m = 0; m < missingInputs.length; m++) {
            blockers.push(_inputBlocker[missingInputs[m]]);
        }

        var furthestLevel = renderEnvironmentKnown
            ? LEVEL.RENDER_ENVIRONMENT_KNOWN
            : LEVEL.RENDER_ENVIRONMENT_CONTRACT_KNOWN;

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            // Render-environment ladder (booleans).
            renderEnvironmentContractKnown: true,
            renderEnvironmentKnown:         renderEnvironmentKnown,

            // Per-input transparency: each required input present/missing.
            inputs:        inputs,
            missingInputs: missingInputs,

            // Strictly separate, higher concerns — decided elsewhere, never advanced here.
            // Reported false so nothing can imply that knowing the render inputs produced
            // an artifact, a print file, a vendor, manufacturing, or packaging (acceptance #2).
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

    // Honest helpers for deriving the geometry facts from a BOOK_PRODUCTION_DEPS-shaped
    // object. A fact is only "known" when its value is genuinely present and well-formed —
    // a finite, sensible number / a non-empty string — never merely defined.
    function _isFiniteNumber(n) {
        return typeof n === 'number' && isFinite(n);
    }

    function _trimKnown(geom) {
        var t = geom && geom.TRIM_IN;
        return !!(t && _isFiniteNumber(t.w) && _isFiniteNumber(t.h) && t.w > 0 && t.h > 0);
    }

    function _bleedKnown(geom) {
        return !!geom && _isFiniteNumber(geom.BLEED_IN) && geom.BLEED_IN >= 0;
    }

    function _safeAreaKnown(geom) {
        if (!geom || !_isFiniteNumber(geom.SAFE_INSET_IN) || geom.SAFE_INSET_IN < 0) return false;
        var m = geom.MARGINS_IN;
        if (!m) return false;
        return _isFiniteNumber(m.inner) && _isFiniteNumber(m.outer) &&
               _isFiniteNumber(m.top)   && _isFiniteNumber(m.bottom) &&
               m.inner >= 0 && m.outer >= 0 && m.top >= 0 && m.bottom >= 0;
    }

    function _exportTargetKnown(geom) {
        return !!geom && typeof geom.PDF_SPEC === 'string' && geom.PDF_SPEC.length > 0;
    }

    function _parityKnown(parity) {
        var mod = parity && parity.MODULUS;
        return _isFiniteNumber(mod) && mod >= 1 && Math.floor(mod) === mod;
    }

    // Cover inputs are "known" only when the cover gate is genuinely unblocked — mirrors
    // index.html BOOK_PRODUCTION_DEPS.isCoverUnblocked: not blocked, spine width known,
    // and stock + binding confirmed. Any of those false leaves the cover missing.
    function _coverKnown(dep, spineKnown) {
        if (!dep) return false;
        return dep.coverGenerationBlocked === false &&
               spineKnown === true &&
               dep.stockConfirmed === true &&
               dep.bindingConfirmed === true;
    }

    // Font / emoji render availability. Accepts either a boolean or a
    // { fontsAvailable, emojiStrategyConfirmed } object; both faces must be confirmed.
    // There is no render-environment input wired in the live app yet, so this is false.
    function _fontRenderKnown(fontRender) {
        if (fontRender === true) return true;
        if (!fontRender || typeof fontRender !== 'object') return false;
        return fontRender.fontsAvailable === true && fontRender.emojiStrategyConfirmed === true;
    }

    // Bridge from already-decided repo-truth facts to the evaluate() input. It reads the
    // geometry (BOOK_PRODUCTION_DEPS-shaped) and parity (BOOK_PARITY-shaped) objects for
    // the trim / bleed / safe-area / parity / export-target facts, the captured
    // production dependencies for the interior / spine / cover facts, and an explicit
    // font/emoji availability signal — never inventing a fact. The interior-structure
    // signal can be supplied explicitly (interiorStructureReady) or defaults to the
    // captured `interiorPageCountConfirmed`. Pure: reads only its argument and calls
    // evaluate() / describeReadiness(); references no sibling module at runtime.
    function resolveFromContext(args) {
        var a   = args || {};
        var geom = a.geometry || null;
        var par  = a.parity   || null;
        var dep  = a.productionDependencies || null;

        var spineKnown = !!(dep && dep.spineWidthKnown === true);

        var interiorStructureKnown = (a.interiorStructureReady !== undefined)
            ? (a.interiorStructureReady === true)
            : !!(dep && dep.interiorPageCountConfirmed === true);

        var input = {
            interiorStructureKnown: interiorStructureKnown,
            trimKnown:              _trimKnown(geom),
            bleedKnown:             _bleedKnown(geom),
            safeAreaKnown:          _safeAreaKnown(geom),
            parityKnown:            _parityKnown(par),
            spineKnown:             spineKnown,
            coverKnown:             _coverKnown(dep, spineKnown),
            fontRenderKnown:        _fontRenderKnown(a.fontRender),
            exportTargetKnown:      _exportTargetKnown(geom)
        };
        var result = evaluate(input);
        return {
            input:   input,
            result:  result,
            display: describeReadiness(result)
        };
    }

    // Honest bridge to MessageBookExportPipeline (8E). The export pipeline takes a single
    // `renderEnvironmentKnown` boolean among its required inputs. This maps the aggregate
    // to it as `renderEnvironmentKnown: result.renderEnvironmentKnown` — true ONLY when
    // every required render input is genuinely present. While cover / spine / font remain
    // missing the aggregate is false, so feeding it to 8E keeps the export preflight
    // honestly blocked at `render-environment-missing`. Only a FUTURE package that makes
    // those inputs genuinely known could flip it; this package never invents them. 8E is
    // NOT modified — it consumes this boolean through its existing input path, so 8E keeps
    // referencing no sibling module at runtime.
    function toExportPipelineInput(result) {
        var r = result || {};
        return { renderEnvironmentKnown: r.renderEnvironmentKnown === true };
    }

    // ── Read-only display layer ──────────────────────────────────────────────
    // A live caller may SHOW this preflight. The copy never says ready-to-print,
    // print-now, export-now, order, buy, pay, or ship, and never implies a cover, spine,
    // print file, vendor, or manufacturing step is available — it states only which
    // render inputs are known versus missing.
    var STATUS_TONE = Object.freeze({
        GATED: 'gated',
        KNOWN: 'known'
    });

    var _GATED_HEADLINE = 'The render environment is not ready yet';
    var _KNOWN_HEADLINE = 'Render-environment inputs are known';
    var _KNOWN_DETAIL   = 'Every render-environment input is present; export artifact generation is still not implemented.';

    // Pure display view-model for a result: { tone, headline, detail, blocker }.
    // Only an all-inputs-known result is reported as known (and even then the detail makes
    // clear artifact generation is not implemented); otherwise the safe primary blocker
    // message is the one-line detail, plus the primary blocker code for theming.
    function describeReadiness(result) {
        var r = result || {};
        if (r.renderEnvironmentKnown) {
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
    // from, and — emphatically — what it does not do. Mirrors the on-device framing of
    // the 8C/8E readiness copy.
    function describeBoundary() {
        return {
            version: CONTRACT_VERSION,
            decides: 'which render-environment inputs an export pipeline must know are genuinely available, and which are still missing',
            isA:     'render-environment input-availability contract computed from already-decided facts',
            doesNot: 'It does not render, lay out, or produce any cover, spine, print, export, or PDF file, write any file, build a vendor packet, select a vendor, or begin artifact generation, manufacturing, packaging, or shipping.',

            // The render-environment input model is strictly distinct from each of these.
            distinctFrom: {
                exportPipeline:         'whether the export pipeline could actually produce a print file once the inputs are known (8E; not implemented)',
                productPreflight:       'whether the render checks pass once the rendered outputs exist (ProductPreflight; needs rendered inputs)',
                manufacturingReadiness: 'the production ladder above checkout (8A/8B)'
            },

            // The rungs this contract keeps separate (acceptance #2).
            separates: ['render-environment-inputs', 'aggregate-render-environment-known', 'export-artifact-generation', 'print-file', 'vendor', 'manufacturing', 'packaging'],

            requiredInputs: INPUT_ORDER.slice(),
            notImplemented: ['cover', 'spine', 'font-render-availability', 'export-artifact-generation', 'print-file-generation', 'vendor-confirmation', 'manufacturing', 'packaging'],
            geometrySourceOfTruth: 'BOOK_PRODUCTION_DEPS / BOOK_PARITY in index.html (scope-guarded; not modified by this contract)',
            artifactFree:   true,
            recordedOnDevice: true
        };
    }

    KMEngine.MessageBookRenderEnvironment = {
        CONTRACT_VERSION:       CONTRACT_VERSION,
        PRODUCT_TYPE_ID:        PRODUCT_TYPE_ID,
        LEVEL:                  LEVEL,
        INPUT:                  INPUT,
        INPUT_ORDER:            INPUT_ORDER,
        REQUIRED_INPUTS:        REQUIRED_INPUTS,
        BLOCKER:                BLOCKER,
        STATUS_TONE:            STATUS_TONE,
        GATED_REASON:           GATED_REASON,
        blockerMessage:         blockerMessage,
        evaluate:               evaluate,
        resolveFromContext:     resolveFromContext,
        toExportPipelineInput:  toExportPipelineInput,
        describeReadiness:      describeReadiness,
        describeBoundary:       describeBoundary
    };
}());
