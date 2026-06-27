(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book export-pipeline preflight contract ───────────────────────
    // The single tested boundary that answers one question: "what must an export
    // pipeline KNOW before a real print file could ever be produced for this
    // Message Book — and which of those inputs are present versus explicitly
    // missing?" It is an ARTIFACT-FREE PREFLIGHT contract only. It produces no
    // print file, no export file, no PDF, no vendor packet, and no shipping label;
    // it writes nothing and reaches no vendor. Defining and checking the export
    // inputs creates no artifact; it only records, locally and deterministically,
    // how close the book is to having a producible export — and that the producing
    // step itself is not implemented.
    //
    // It decomposes the 8A `export-pipeline-not-implemented` blocker honestly. 8A
    // (MessageBookManufacturingReadiness) treats the export pipeline as one opaque
    // not-implemented capability. This module says what that capability would
    // actually need to KNOW (a valid internal print spec, an approved/current proof,
    // a known page count within bounds, ready composition, a known parity/padding
    // status, the cover/spine/safe-area/render-environment inputs, and a known
    // export target) and separates that KNOWLEDGE from the GENERATION it can never
    // perform here:
    //
    //   internal print spec (8C/8D)   — an internal print spec is selected and valid
    //   export-pipeline preflight (this) — the export pipeline's required inputs are known
    //   artifact generation (separate) — a print/export file could actually be produced
    //   print file (separate)         — a validated print file has actually been produced
    //   vendor / manufacturing (8A)   — the production ladder above the export pipeline
    //
    // Knowing every export input is NOT a print file, NOT a vendor-ready output, and
    // NOT manufacturing readiness. Artifact generation and print-file production are
    // not implemented and are reported here only as explicitly-false rungs so nothing
    // can imply they are met. The geometry / spec source of truth stays where it
    // already lives — `BOOK_PRODUCTION_DEPS` / `BOOK_PARITY` in index.html (scope-
    // guarded) and `MessageBookPrintSpec.INTERNAL_DRAFT_SPEC` — and is only pointed
    // at here, never duplicated or modified.
    //
    // Fully pure: a deterministic function of its inputs. No DOM, no clock, no Date,
    // no Math.random, no I/O, no network, no storage, no record builders. It consumes
    // already-decided facts (a 8C MessageBookPrintSpec result, app-computed proof /
    // composition / render-environment booleans) and references no sibling module at
    // runtime, so it loads alone. The source carries no commerce/production action
    // verb or call-to-action (guarded by its own source-scan test), so the contract
    // can never imply that a book has been exported, printed, sent to a vendor,
    // manufactured, packaged, or shipped.

    var CONTRACT_VERSION = 'kmep1';
    var PRODUCT_TYPE_ID  = 'message-book';

    // The export-pipeline preflight ladder. Each rung requires every rung below it.
    // export-pipeline-contract-known is the floor — this module defines the contract,
    // so it is always known. The rungs above it are real downstream capabilities;
    // none is implemented yet, so the ladder never climbs past export-inputs-known in
    // the live app (and reaches export-inputs-known only once every input is supplied).
    var LEVEL = Object.freeze({
        EXPORT_PIPELINE_CONTRACT_KNOWN:   'export-pipeline-contract-known',
        EXPORT_INPUTS_KNOWN:              'export-inputs-known',
        EXPORT_ARTIFACT_GENERATION_READY: 'export-artifact-generation-ready',
        PRINT_FILE_READY:                 'print-file-ready',
        VENDOR_READY:                     'vendor-ready',
        MANUFACTURING_READY:              'manufacturing-ready',
        PACKAGING_READY:                  'packaging-ready'
    });

    // The required export-pipeline inputs — the facts an export pipeline must know
    // before a print file could ever be produced. Each is evaluated present/missing.
    var INPUT = Object.freeze({
        PRINT_SPEC_VALID:         'print-spec-valid',
        PROOF_APPROVED_CURRENT:   'proof-approved-current',
        PAGE_COUNT_KNOWN:         'page-count-known',
        COMPOSITION_READY:        'composition-ready',
        PARITY_KNOWN:             'parity-known',
        RENDER_ENVIRONMENT_KNOWN: 'render-environment-known',
        EXPORT_TARGET_KNOWN:      'export-target-known'
    });

    // Priority order, most fundamental first. A valid internal print spec is required
    // before export-pipeline preflight can proceed, so it leads; the missing-input
    // blockers are collected in this order and primaryBlocker is the first.
    var INPUT_ORDER = Object.freeze([
        INPUT.PRINT_SPEC_VALID,
        INPUT.PROOF_APPROVED_CURRENT,
        INPUT.PAGE_COUNT_KNOWN,
        INPUT.COMPOSITION_READY,
        INPUT.PARITY_KNOWN,
        INPUT.RENDER_ENVIRONMENT_KNOWN,
        INPUT.EXPORT_TARGET_KNOWN
    ]);

    // Safe, non-private reason codes. No message text, names, prices, or order
    // numbers — there are none. The first seven mirror the seven required inputs;
    // artifact-generation-not-implemented is the terminal honest blocker that remains
    // even when every input is known; print-file-not-ready guards the validated-file
    // rung above a (hypothetical) implemented generator.
    var BLOCKER = Object.freeze({
        PRINT_SPEC_NOT_VALID:                'print-spec-not-valid',
        PROOF_NOT_APPROVED_CURRENT:          'proof-not-approved-current',
        PAGE_COUNT_UNKNOWN:                  'page-count-unknown',
        COMPOSITION_NOT_READY:               'composition-not-ready',
        PARITY_UNKNOWN:                      'parity-unknown',
        RENDER_ENVIRONMENT_MISSING:          'render-environment-missing',
        EXPORT_TARGET_UNKNOWN:               'export-target-unknown',
        ARTIFACT_GENERATION_NOT_IMPLEMENTED: 'artifact-generation-not-implemented',
        PRINT_FILE_NOT_READY:                'print-file-not-ready'
    });

    var _inputBlocker = {};
    _inputBlocker[INPUT.PRINT_SPEC_VALID]         = BLOCKER.PRINT_SPEC_NOT_VALID;
    _inputBlocker[INPUT.PROOF_APPROVED_CURRENT]   = BLOCKER.PROOF_NOT_APPROVED_CURRENT;
    _inputBlocker[INPUT.PAGE_COUNT_KNOWN]         = BLOCKER.PAGE_COUNT_UNKNOWN;
    _inputBlocker[INPUT.COMPOSITION_READY]        = BLOCKER.COMPOSITION_NOT_READY;
    _inputBlocker[INPUT.PARITY_KNOWN]             = BLOCKER.PARITY_UNKNOWN;
    _inputBlocker[INPUT.RENDER_ENVIRONMENT_KNOWN] = BLOCKER.RENDER_ENVIRONMENT_MISSING;
    _inputBlocker[INPUT.EXPORT_TARGET_KNOWN]      = BLOCKER.EXPORT_TARGET_UNKNOWN;

    // Wherever a generation rung is reported false, it is because the capability is
    // not implemented (mirrors the 7A/8A/8C framing).
    var GATED_REASON = 'not-implemented';

    // The repo's CURRENT, genuine export/generation capability. Every flag is false —
    // there is no implemented artifact generator, no validated print file, no confirmed
    // vendor, no manufacturing, and no packaging. resolveFromContext applies this by
    // default, so the live answer keeps every generation rung false. A later package
    // that implements a real generator would flip artifactGenerationImplemented (and,
    // once it produces and validates a file, printFileValidated) with its implementation.
    var CAPABILITIES = Object.freeze({
        artifactGenerationImplemented: false,
        printFileValidated:            false,
        vendorConfirmed:               false,
        manufacturingImplemented:      false,
        packagingImplemented:          false
    });

    // The export target DIRECTION the export pipeline would target. It is a KNOWN
    // internal direction (the register's locked PDF/X-4 direction), NOT a vendor-
    // confirmed target and NOT a produced artifact. It points at the print-spec /
    // geometry sources of truth and duplicates none of their numbers.
    var EXPORT_TARGET = Object.freeze({
        format:            'PDF/X-4',
        status:            'internal-direction',   // a known direction, not a produced file
        vendorConfirmed:   false,
        artifactProduced:  false,
        specSourceOfTruth: 'MessageBookPrintSpec.INTERNAL_DRAFT_SPEC (provisional PDF/X-4); geometry stays BOOK_PRODUCTION_DEPS / BOOK_PARITY in index.html'
    });

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.PRINT_SPEC_NOT_VALID]                = 'A valid internal print specification has not been selected yet.';
    _blockerMessages[BLOCKER.PROOF_NOT_APPROVED_CURRENT]          = 'The proof has not been approved, or the approval is out of date.';
    _blockerMessages[BLOCKER.PAGE_COUNT_UNKNOWN]                  = 'The page count for this Message Book is not known or is out of bounds yet.';
    _blockerMessages[BLOCKER.COMPOSITION_NOT_READY]               = 'The page composition for this Message Book is not ready yet.';
    _blockerMessages[BLOCKER.PARITY_UNKNOWN]                      = 'The page parity (padding) status is not known yet.';
    _blockerMessages[BLOCKER.RENDER_ENVIRONMENT_MISSING]          = 'Cover, spine, safe-area, and render-environment inputs are not available yet.';
    _blockerMessages[BLOCKER.EXPORT_TARGET_UNKNOWN]               = 'The export target specification is not known yet.';
    _blockerMessages[BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED] = 'Print and export file generation is not implemented yet.';
    _blockerMessages[BLOCKER.PRINT_FILE_NOT_READY]                = 'A validated print file has not been produced yet.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // A safe, descriptive record of each required export input, for docs / a future
    // read-only UI. Frozen; carries no app state.
    var REQUIRED_INPUTS = Object.freeze([
        Object.freeze({ input: INPUT.PRINT_SPEC_VALID,         label: 'A valid internal print specification',                  producer: 'MessageBookPrintSpec (8C/8D)' }),
        Object.freeze({ input: INPUT.PROOF_APPROVED_CURRENT,   label: 'An approved, current proof',                            producer: 'MessageBookReadiness / ProofApprovalState (5D/7A)' }),
        Object.freeze({ input: INPUT.PAGE_COUNT_KNOWN,         label: 'A known page count within the page bounds',            producer: 'BookComposition.computePageLimitStatus (6A/6B)' }),
        Object.freeze({ input: INPUT.COMPOSITION_READY,        label: 'Ready page composition units',                         producer: 'BookComposition.generateUnits / paginateUnits (6B/6C)' }),
        Object.freeze({ input: INPUT.PARITY_KNOWN,             label: 'A known page parity / padding status',                 producer: 'BookComposition / MessageBookPrintSpec parity (6B/8C)' }),
        Object.freeze({ input: INPUT.RENDER_ENVIRONMENT_KNOWN, label: 'Cover, spine, safe-area, and render-environment inputs', producer: 'ProductPreflight render-environment checks (not yet available)' }),
        Object.freeze({ input: INPUT.EXPORT_TARGET_KNOWN,      label: 'A known export target specification',                  producer: 'MessageBookPrintSpec PDF/X-4 direction (8C)' })
    ]);

    // Evaluate the export-pipeline preflight from already-decided facts.
    // input: {
    //   printSpecValid         : boolean  — a valid internal print spec (8C internalSpecValid)
    //   proofApprovedCurrent   : boolean  — the proof is approved and current (5D/7A)
    //   pageCountKnown         : boolean  — page count known AND within bounds (6A/6B)
    //   compositionReady       : boolean  — composition units are ready (6B/6C)
    //   parityKnown            : boolean  — parity / padding status known (6B/8C)
    //   renderEnvironmentKnown : boolean  — cover/spine/safe-area/render inputs present (ProductPreflight)
    //   exportTargetKnown      : boolean  — export target spec known (PDF/X-4 direction)
    //   -- genuine generation capability (default false; not flipped by this package) --
    //   artifactGenerationImplemented : boolean
    //   printFileValidated            : boolean
    //   vendorConfirmed               : boolean
    //   manufacturingImplemented      : boolean
    //   packagingImplemented          : boolean
    // }
    function evaluate(input) {
        var i = input || {};

        var inputs = {};
        inputs[INPUT.PRINT_SPEC_VALID]         = i.printSpecValid === true;
        inputs[INPUT.PROOF_APPROVED_CURRENT]   = i.proofApprovedCurrent === true;
        inputs[INPUT.PAGE_COUNT_KNOWN]         = i.pageCountKnown === true;
        inputs[INPUT.COMPOSITION_READY]        = i.compositionReady === true;
        inputs[INPUT.PARITY_KNOWN]             = i.parityKnown === true;
        inputs[INPUT.RENDER_ENVIRONMENT_KNOWN] = i.renderEnvironmentKnown === true;
        inputs[INPUT.EXPORT_TARGET_KNOWN]      = i.exportTargetKnown === true;

        var artifactGenerationImplemented = i.artifactGenerationImplemented === true;
        var printFileValidated            = i.printFileValidated === true;
        var vendorConfirmed               = i.vendorConfirmed === true;
        var manufacturingImplemented      = i.manufacturingImplemented === true;
        var packagingImplemented          = i.packagingImplemented === true;

        // Which required inputs are missing (priority order).
        var missingInputs = [];
        for (var k = 0; k < INPUT_ORDER.length; k++) {
            if (!inputs[INPUT_ORDER[k]]) missingInputs.push(INPUT_ORDER[k]);
        }
        var exportInputsKnown = missingInputs.length === 0;

        // The preflight ladder. Each rung requires every rung below it. The contract
        // is always known; inputs-known requires every input; everything above
        // requires a genuine — and currently unimplemented — generation capability.
        var exportPipelineContractKnown   = true;
        var exportArtifactGenerationReady = exportInputsKnown && artifactGenerationImplemented;
        var printFileReady                = exportArtifactGenerationReady && printFileValidated;
        var vendorReady                   = printFileReady && vendorConfirmed;
        var manufacturingReady            = vendorReady && manufacturingImplemented;
        var packagingReady                = manufacturingReady && packagingImplemented;

        // Blockers in priority order: missing inputs first, then the generation gap.
        var blockers = [];
        for (var m = 0; m < missingInputs.length; m++) {
            blockers.push(_inputBlocker[missingInputs[m]]);
        }
        if (!artifactGenerationImplemented) {
            blockers.push(BLOCKER.ARTIFACT_GENERATION_NOT_IMPLEMENTED);
        } else if (!printFileValidated) {
            blockers.push(BLOCKER.PRINT_FILE_NOT_READY);
        }

        var furthestLevel = LEVEL.EXPORT_PIPELINE_CONTRACT_KNOWN;
        if (exportInputsKnown)             furthestLevel = LEVEL.EXPORT_INPUTS_KNOWN;
        if (exportArtifactGenerationReady) furthestLevel = LEVEL.EXPORT_ARTIFACT_GENERATION_READY;
        if (printFileReady)                furthestLevel = LEVEL.PRINT_FILE_READY;
        if (vendorReady)                   furthestLevel = LEVEL.VENDOR_READY;
        if (manufacturingReady)            furthestLevel = LEVEL.MANUFACTURING_READY;
        if (packagingReady)                furthestLevel = LEVEL.PACKAGING_READY;

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            // Preflight ladder (booleans).
            exportPipelineContractKnown:   exportPipelineContractKnown,
            exportInputsKnown:             exportInputsKnown,
            exportArtifactGenerationReady: exportArtifactGenerationReady,
            printFileReady:                printFileReady,
            vendorReady:                   vendorReady,
            manufacturingReady:            manufacturingReady,
            packagingReady:                packagingReady,

            // Per-input transparency: each required input present/missing.
            inputs:        inputs,
            missingInputs: missingInputs,

            // Genuine generation capability echoed; false in this package.
            artifactGenerationImplemented: artifactGenerationImplemented,
            gatedReason: GATED_REASON,

            // Diagnostics.
            furthestLevel:   furthestLevel,
            blockers:        blockers,
            primaryBlocker:  blockers.length ? blockers[0] : null,
            blockerMessages: blockers.map(blockerMessage)
        };
    }

    // Honest bridge to MessageBookManufacturingReadiness (8A). 8A's `exportPipelineImplemented`
    // capability means the export pipeline can actually PRODUCE a print file — it is the flag
    // that turns 8A's `export-spec-known` into `print-file-ready`. This preflight is artifact-
    // free: it defines and checks what the pipeline must KNOW but produces nothing, so
    // `exportArtifactGenerationReady` is false until a real generator exists. The bridge maps
    // ONLY to 8A's existing `exportPipelineImplemented` input as
    // `exportPipelineImplemented: result.exportArtifactGenerationReady`, which is false in this
    // package — feeding it to 8A keeps it at `export-pipeline-not-implemented`. Only a FUTURE
    // package that implements a real generator (flipping the `artifactGenerationImplemented`
    // capability) could make this true; this package never flips it. 8A is NOT modified — it
    // consumes this object through its existing capabilities input path, so 8A keeps
    // referencing no sibling module at runtime.
    function toManufacturingCapabilities(result) {
        var r = result || {};
        return { exportPipelineImplemented: r.exportArtifactGenerationReady === true };
    }

    // ── Read-only display layer ──────────────────────────────────────────────
    // A future UI may want to SHOW this preflight. The copy never says ready-to-print,
    // print-now, export-now, order, buy, pay, ship, or that a vendor/manufacturing step
    // is available — it states only which export inputs are missing and that artifact
    // generation is not implemented yet.
    var STATUS_TONE = Object.freeze({
        GATED: 'gated',
        READY: 'ready'
    });

    var _GATED_HEADLINE = 'An export pipeline is not available yet';
    var _READY_HEADLINE = 'A validated print file is available';
    var _READY_DETAIL   = 'Every export pipeline requirement is satisfied and a validated print file exists.';

    // Pure display view-model for a preflight result: { tone, headline, detail, blocker }.
    // Only a `printFileReady` result (unreachable until the repo implements a real
    // generator and a file is validated) is reported ready; otherwise the safe primary
    // blocker message is the one-line detail, plus the primary blocker code for theming.
    function describeReadiness(result) {
        var r = result || {};
        if (r.printFileReady) {
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

    // Bridge from already-decided result objects to the evaluate() input. It reads the
    // 8C MessageBookPrintSpec result for the spec / page-count / parity / export-target
    // facts (never re-deriving them) and takes explicit booleans for the proof,
    // composition, and render-environment facts the app already computed. The
    // capabilities default to CAPABILITIES (all false), so the live answer keeps every
    // generation rung false. Pure: reads only its argument and calls evaluate() /
    // describeReadiness(); references no sibling module at runtime.
    function resolveFromContext(args) {
        var a    = args || {};
        var ps   = a.printSpec || {};
        var pb   = ps.pageBounds || null;
        var caps = a.capabilities || CAPABILITIES;

        var input = {
            printSpecValid:         ps.internalSpecValid === true,
            proofApprovedCurrent:   a.proofApprovedCurrent === true,
            pageCountKnown:         !!(pb && pb.pageCountValid === true && pb.boundsKnown === true && pb.withinBounds === true),
            compositionReady:       a.compositionReady === true,
            parityKnown:            !!(pb && typeof pb.parityOk === 'boolean'),
            renderEnvironmentKnown: a.renderEnvironmentKnown === true,
            exportTargetKnown:      (a.exportTargetKnown !== undefined) ? (a.exportTargetKnown === true) : (ps.knownSpecId === true),

            artifactGenerationImplemented: !!caps.artifactGenerationImplemented,
            printFileValidated:            !!caps.printFileValidated,
            vendorConfirmed:               !!caps.vendorConfirmed,
            manufacturingImplemented:      !!caps.manufacturingImplemented,
            packagingImplemented:          !!caps.packagingImplemented
        };
        var result = evaluate(input);
        return {
            input:   input,
            result:  result,
            display: describeReadiness(result)
        };
    }

    // Plain-language statement of what this preflight is, what it is explicitly distinct
    // from, and — emphatically — what it does not do. Mirrors the on-device framing of
    // the 8A/8C readiness copy.
    function describeBoundary() {
        return {
            version: CONTRACT_VERSION,
            decides: 'what an export pipeline must know before a real print file could ever be produced later',
            isA:     'artifact-free export-pipeline preflight contract computed from already-decided facts',
            doesNot: 'It does not produce any print, export, or PDF file, write any file, build a vendor packet or shipping label, select a vendor, or begin manufacturing, packaging, or shipping.',

            // The export-pipeline preflight is strictly distinct from each of these.
            distinctFrom: {
                printSpecSelection:     'whether an internal print spec is selected and valid for the proof (8C/8D)',
                manufacturingReadiness: 'the production ladder above checkout (8A/8B)',
                printFileGeneration:    'whether a validated print file has actually been produced (not implemented)'
            },

            // The rungs this preflight keeps separate (acceptance #5).
            separates: ['export-pipeline-contract', 'export-inputs', 'artifact-generation', 'print-file', 'vendor', 'manufacturing'],

            requiredInputs: INPUT_ORDER.slice(),
            notImplemented: ['artifact-generation', 'print-file-generation', 'vendor-confirmation', 'manufacturing', 'packaging'],
            artifactFree:   true,
            recordedOnDevice: true
        };
    }

    KMEngine.MessageBookExportPipeline = {
        CONTRACT_VERSION:            CONTRACT_VERSION,
        PRODUCT_TYPE_ID:             PRODUCT_TYPE_ID,
        LEVEL:                       LEVEL,
        INPUT:                       INPUT,
        INPUT_ORDER:                 INPUT_ORDER,
        REQUIRED_INPUTS:             REQUIRED_INPUTS,
        BLOCKER:                     BLOCKER,
        STATUS_TONE:                 STATUS_TONE,
        GATED_REASON:                GATED_REASON,
        CAPABILITIES:                CAPABILITIES,
        EXPORT_TARGET:               EXPORT_TARGET,
        blockerMessage:              blockerMessage,
        evaluate:                    evaluate,
        toManufacturingCapabilities: toManufacturingCapabilities,
        describeReadiness:           describeReadiness,
        resolveFromContext:          resolveFromContext,
        describeBoundary:            describeBoundary
    };
}());
