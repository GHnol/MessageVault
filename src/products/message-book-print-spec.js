(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book internal print-spec selection / validation contract ───────
    // The single tested boundary that answers one question: "is an INTERNAL print
    // production specification selected for this Message Book, and is it valid for
    // the current proof?" It is a SELECTION and VALIDATION contract only. It is NOT
    // print-file generation, export/PDF generation, vendor selection, vendor
    // confirmation, manufacturing, packaging, or shipping, and it implies none of
    // them. Selecting and validating an internal spec produces no file and reaches
    // no vendor; it only records, locally, that the book is internally specified.
    //
    // What it is distinct from (each strictly higher, separate, and not-implemented):
    //   internal print spec (this)    — an internal, KeepMees-owned print spec is
    //                                   selected and valid for the current proof
    //   export pipeline (separate)    — a print/export file could actually be produced
    //   vendor confirmation (separate)— a real print vendor has accepted the spec/file
    //   production readiness (8A/8B)  — the full manufacturing ladder above checkout
    //
    // An internal print spec is NOT a print file, NOT a vendor-confirmed spec, and
    // NOT manufacturing readiness. Those higher gates remain not-implemented and are
    // reported here only as explicitly-false flags so nothing can imply they are met.
    //
    // Repo source of truth. The LOCKED internal manufacturing decisions this spec
    // encodes — 7x10" trim, casebound hardcover, matte/premium interior stock,
    // even-page parity (modulus 2), separate-physical-book multi-volume, PDF/X-4
    // direction, print-safe emoji set — are the decisions recorded as LOCKED in
    // docs/ops/vendor-manufacturing-register.md ("made and encoded in the software
    // regardless of vendor"). The AUTHORITATIVE RUNTIME GEOMETRY (trim inches, bleed,
    // safe inset, margins, parity modulus) lives in BOOK_PRODUCTION_DEPS / BOOK_PARITY
    // in index.html (both scope-guarded). This module does not own, duplicate, or
    // mutate that geometry: it declares the selectable spec IDENTITY plus the
    // selection/validation rules around it, and points at those constants for the
    // numbers. The provisional dimensions remain "confirm per vendor".
    //
    // Fully pure: a deterministic function of its inputs. No DOM, no clock, no Date,
    // no Math.random, no I/O, no network, no storage, no record builders. The source
    // carries no commerce/production action verb or call-to-action (guarded by its
    // own source-scan test), so the contract can never imply that a book has been
    // exported, printed, sent to a vendor, manufactured, packaged, or shipped.

    var CONTRACT_VERSION = 'kmps1';
    var PRODUCT_TYPE_ID  = 'message-book';

    // The single internal, KeepMees-owned print spec a Message Book can be specified
    // against today. It is an INTERNAL DRAFT: locked internally, not vendor-confirmed.
    var INTERNAL_SPEC_ID = 'message-book-internal-7x10-hardcover-v1';

    // Selection states. Deliberately distinct (contract requirement):
    //   none              — no internal print spec is selected
    //   unknown           — a spec id was supplied but is not a recognized internal spec
    //   internal-selected — the internal spec is selected but not yet valid for the proof
    //   internal-valid    — the internal spec is selected AND valid for the current proof
    var SELECTION_STATE = Object.freeze({
        NONE:              'none',
        UNKNOWN:           'unknown',
        INTERNAL_SELECTED: 'internal-selected',
        INTERNAL_VALID:    'internal-valid'
    });

    // Safe, non-private reason codes for why an internal spec is not yet selected/valid.
    // No message text, names, prices, or order numbers — there are none. Collected in
    // priority order, most fundamental first; primaryBlocker = blockers[0].
    var BLOCKER = Object.freeze({
        SPEC_NOT_SELECTED:   'print-spec-not-selected',
        SPEC_UNKNOWN:        'print-spec-unknown',
        PAGE_COUNT_INVALID:  'print-spec-page-count-invalid',
        PAGE_BOUNDS_UNKNOWN: 'print-spec-page-bounds-unknown',
        OVER_PAGE_LIMIT:     'print-spec-over-page-limit'
    });

    // Wherever a downstream gate is reported false, it is because the capability is
    // not implemented (mirrors the 7A/8A framing).
    var GATED_REASON = 'not-implemented';

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.SPEC_NOT_SELECTED]   = 'An internal print specification has not been selected yet.';
    _blockerMessages[BLOCKER.SPEC_UNKNOWN]        = 'The selected specification is not a recognized internal print specification.';
    _blockerMessages[BLOCKER.PAGE_COUNT_INVALID]  = 'This Message Book does not have a valid page count yet.';
    _blockerMessages[BLOCKER.PAGE_BOUNDS_UNKNOWN] = 'The page limit for this Message Book is not known yet.';
    _blockerMessages[BLOCKER.OVER_PAGE_LIMIT]     = 'This Message Book is over the page limit for the internal print specification.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // The internal draft print-spec descriptor. Frozen. Declares the spec IDENTITY
    // (the register's LOCKED facts) and is explicit that it is NOT vendor-confirmed and
    // the export pipeline is NOT implemented. It deliberately does NOT restate the
    // provisional geometry numbers (bleed / margins / trim inches): those live,
    // authoritative, in BOOK_PRODUCTION_DEPS / BOOK_PARITY in index.html and are only
    // pointed at here, so there is one source of geometry truth, not two.
    var INTERNAL_DRAFT_SPEC = Object.freeze({
        specId:          INTERNAL_SPEC_ID,
        contractVersion: CONTRACT_VERSION,
        productTypeId:   PRODUCT_TYPE_ID,
        label:          'Message Book - 7x10 casebound hardcover (internal draft)',
        status:         'internal-draft',          // internally locked, NOT vendor-confirmed

        // Register LOCKED facts (docs/ops/vendor-manufacturing-register.md).
        locked: Object.freeze({
            trimSize:         '7x10',
            binding:          'casebound-hardcover',
            interiorStock:    'matte-premium-text',
            parityModulus:    2,                    // even page count required (BOOK_PARITY.MODULUS)
            multiVolumeModel: 'separate-physical-books'
        }),

        // Locked direction but explicitly provisional pending vendor confirmation.
        provisional: Object.freeze({
            pdfSpecTarget: 'PDF/X-4',
            emojiStrategy: 'print-safe-set',
            geometryNote:  'Authoritative runtime geometry (trim inches, bleed, safe inset, margins, parity) is BOOK_PRODUCTION_DEPS / BOOK_PARITY in index.html; values are provisional pending vendor confirmation.'
        }),

        // These remain strictly false: an internal spec is not a vendor-confirmed spec
        // and not an export pipeline.
        vendorConfirmed:           false,
        exportPipelineImplemented: false
    });

    function isKnownSpecId(specId) {
        return specId === INTERNAL_SPEC_ID;
    }

    function getInternalSpec() {
        return INTERNAL_DRAFT_SPEC;
    }

    // Validate the proof page bounds for the internal spec. Reuses the same convention
    // as BookComposition.computePageLimitStatus: a page count equal to the maximum is
    // within the limit, strictly-greater is over. It does NOT invent a hard page
    // maximum — maxPages is supplied by the caller from the existing pagination / 6A
    // page-limit signal. Parity is reported as a non-blocking note: KeepMees owns
    // even-page padding via BOOK_PARITY, so an odd raw count is padded, not rejected.
    function _evaluatePageBounds(pageCount, maxPages) {
        var pc = (typeof pageCount === 'number' && isFinite(pageCount)) ? pageCount : null;
        var mx = (typeof maxPages === 'number' && isFinite(maxPages) && maxPages > 0) ? maxPages : null;

        var pageCountValid = pc !== null && pc >= 1 && Math.floor(pc) === pc;
        var boundsKnown    = mx !== null;
        var withinBounds   = pageCountValid && boundsKnown && pc <= mx;
        var exceeds        = pageCountValid && boundsKnown && pc > mx;
        var parityOk       = pageCountValid && (pc % INTERNAL_DRAFT_SPEC.locked.parityModulus === 0);

        var blocker = null;
        if (!pageCountValid)   blocker = BLOCKER.PAGE_COUNT_INVALID;
        else if (!boundsKnown) blocker = BLOCKER.PAGE_BOUNDS_UNKNOWN;
        else if (exceeds)      blocker = BLOCKER.OVER_PAGE_LIMIT;

        return {
            pageCount:        pc,
            maxPages:         mx,
            pageCountValid:   pageCountValid,
            boundsKnown:      boundsKnown,
            withinBounds:     withinBounds,
            exceedsPageLimit: exceeds,
            parityModulus:    INTERNAL_DRAFT_SPEC.locked.parityModulus,
            parityOk:         parityOk,             // informational; padding owns parity
            blocker:          blocker
        };
    }

    // Evaluate the internal print-spec selection for a Message Book proof.
    // input: {
    //   selectedSpecId : string|null  — the internal spec id the user/app selected
    //   pageCount      : number       — the proof's current page count (from pagination)
    //   maxPages       : number       — the proof's page maximum (the existing limit signal)
    // }
    function evaluate(input) {
        var i = input || {};
        var selectedSpecId = (typeof i.selectedSpecId === 'string' && i.selectedSpecId) ? i.selectedSpecId : null;

        var blockers = [];
        var state;
        var bounds = null;
        var internalSpecSelected = false;
        var internalSpecValid    = false;

        if (selectedSpecId === null) {
            state = SELECTION_STATE.NONE;
            blockers.push(BLOCKER.SPEC_NOT_SELECTED);
        } else if (!isKnownSpecId(selectedSpecId)) {
            state = SELECTION_STATE.UNKNOWN;
            blockers.push(BLOCKER.SPEC_UNKNOWN);
        } else {
            internalSpecSelected = true;
            bounds = _evaluatePageBounds(i.pageCount, i.maxPages);
            if (bounds.blocker) {
                state = SELECTION_STATE.INTERNAL_SELECTED;
                blockers.push(bounds.blocker);
            } else {
                state = SELECTION_STATE.INTERNAL_VALID;
                internalSpecValid = true;
            }
        }

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            selectedSpecId: selectedSpecId,
            knownSpecId:    selectedSpecId !== null && isKnownSpecId(selectedSpecId),
            state:          state,

            internalSpecSelected: internalSpecSelected,
            internalSpecValid:    internalSpecValid,

            pageBounds: bounds,

            // The next gates after a valid internal spec are separate, not-started
            // concerns. They are reported here, always, so nothing can imply they are
            // met by selecting an internal spec.
            vendorConfirmationMissing: true,
            exportPipelineMissing:     true,
            vendorReady:        false,
            exportReady:        false,
            manufacturingReady: false,
            packagingReady:     false,
            gatedReason:        GATED_REASON,

            // Diagnostics.
            blockers:        blockers,
            primaryBlocker:  blockers.length ? blockers[0] : null,
            blockerMessages: blockers.map(blockerMessage)
        };
    }

    // Bridge to MessageBookManufacturingReadiness (8A/8B). Produces the capability
    // object that 8A's evaluate / resolveFromReadiness already consumes, flipping ONLY
    // printSpecSelected — and ONLY when the internal spec is selected AND valid for the
    // current proof. Every higher capability (export pipeline, vendor, manufacturing,
    // packaging) is intentionally OMITTED so 8A reads it as false: a valid internal
    // spec moves 8A from `print-spec-not-selected` to `export-pipeline-not-implemented`,
    // and no further. 8A is NOT modified — it consumes this object through its existing
    // capabilities input path. The bridge lives here (not in 8A) so 8A keeps referencing
    // no sibling module at runtime.
    function toManufacturingCapabilities(result) {
        var r = result || {};
        return { printSpecSelected: r.internalSpecValid === true };
    }

    // Plain-language statement of what this contract is and — emphatically — what it is
    // not. Mirrors the on-device framing of the 7A/7B/7D/8A readiness copy.
    function describeBoundary() {
        return {
            version: CONTRACT_VERSION,
            decides: 'whether an internal, KeepMees-owned print specification is selected and valid for the current Message Book proof',
            isA:     'internal print-spec selection and validation contract computed from already-decided facts',
            doesNot: 'It does not build any print or export file, render a PDF, reach or confirm a vendor, or begin manufacturing, packaging, or shipping.',

            // An internal print spec is strictly less than each of these.
            internalSpecIsNot: ['a print file', 'an export pipeline', 'a vendor-confirmed spec', 'manufacturing readiness'],

            distinctFrom: {
                exportPipeline:      'whether a print/export file could actually be produced (not implemented)',
                vendorConfirmation:  'whether a real print vendor has accepted the spec or file (not implemented)',
                productionReadiness: 'the full manufacturing ladder above checkout (8A/8B)'
            },

            notImplemented:        ['export-pipeline', 'vendor-confirmation', 'manufacturing', 'packaging'],
            geometrySourceOfTruth: 'BOOK_PRODUCTION_DEPS / BOOK_PARITY in index.html (scope-guarded; not modified by this contract)',
            recordedOnDevice:      true
        };
    }

    // ── Read-only display + selection-helper layer (8D live bridge) ───────────
    // A live caller may SHOW the selection and offer local select/clear controls.
    // These helpers keep the copy in the tested engine (no commerce/production CTA)
    // and never imply a vendor-confirmed spec, export readiness, or production
    // readiness. Pure: no DOM, no clock, no I/O.
    var SELECTION_TONE = Object.freeze({
        SELECTED:   'selected',
        UNSELECTED: 'unselected',
        BLOCKED:    'blocked'
    });

    var _UNSELECTED_HEADLINE = 'No print specification selected';
    var _SELECTED_HEADLINE   = 'Internal print spec selected';
    var _UNKNOWN_HEADLINE    = 'Print specification not recognized';
    var _UNSELECTED_DETAIL   = 'Select the internal Message Book print specification to continue.';
    var _VALID_DETAIL        = 'Export pipeline is still not implemented.';

    // Pure display view-model for a selection result: { tone, headline, detail }.
    // internal-valid → selected tone + the export-pipeline-still-missing reminder;
    // a selected-but-invalid spec (over the page limit, etc.) or an unknown spec →
    // blocked tone + the safe blocker message; nothing selected → unselected tone.
    function describeSelection(result) {
        var r = result || {};
        if (r.internalSpecValid) {
            return { tone: SELECTION_TONE.SELECTED, headline: _SELECTED_HEADLINE, detail: _VALID_DETAIL };
        }
        var detail = (r.blockerMessages && r.blockerMessages.length)
            ? r.blockerMessages[0]
            : (r.primaryBlocker ? blockerMessage(r.primaryBlocker) : '');
        if (r.internalSpecSelected) {
            // A known internal spec is selected but not valid for the current proof.
            return { tone: SELECTION_TONE.BLOCKED, headline: _SELECTED_HEADLINE, detail: detail };
        }
        if (r.state === SELECTION_STATE.UNKNOWN) {
            return { tone: SELECTION_TONE.BLOCKED, headline: _UNKNOWN_HEADLINE, detail: detail };
        }
        return { tone: SELECTION_TONE.UNSELECTED, headline: _UNSELECTED_HEADLINE, detail: _UNSELECTED_DETAIL };
    }

    // Pure safe action labels for a selection result. Offers a local select action when
    // no internal spec is selected, and a local clear action when one is. The labels
    // avoid any commerce/production CTA (no buy/pay/order/print-now/send-to-vendor).
    function describeActions(result) {
        var r = result || {};
        if (r.internalSpecSelected) {
            return [{ action: 'clear-spec', label: 'Clear print spec' }];
        }
        return [{ action: 'use-spec', label: 'Use internal print spec' }];
    }

    // Safe restore of a persisted local selection. Returns the known internal spec id
    // only when the stored value is exactly that id, otherwise null — so an unknown or
    // malformed persisted value can never select a spec. The live caller still
    // revalidates the restored selection against the current proof page bounds on the
    // next evaluate(), so a restored selection can never advance production on its own.
    function coerceSelectedSpecId(value) {
        return isKnownSpecId(value) ? value : null;
    }

    KMEngine.MessageBookPrintSpec = {
        CONTRACT_VERSION:            CONTRACT_VERSION,
        PRODUCT_TYPE_ID:             PRODUCT_TYPE_ID,
        INTERNAL_SPEC_ID:            INTERNAL_SPEC_ID,
        INTERNAL_DRAFT_SPEC:         INTERNAL_DRAFT_SPEC,
        SELECTION_STATE:             SELECTION_STATE,
        SELECTION_TONE:              SELECTION_TONE,
        BLOCKER:                     BLOCKER,
        GATED_REASON:                GATED_REASON,
        isKnownSpecId:               isKnownSpecId,
        getInternalSpec:             getInternalSpec,
        blockerMessage:              blockerMessage,
        evaluate:                    evaluate,
        toManufacturingCapabilities: toManufacturingCapabilities,
        describeSelection:           describeSelection,
        describeActions:             describeActions,
        coerceSelectedSpecId:        coerceSelectedSpecId,
        describeBoundary:            describeBoundary
    };
}());
