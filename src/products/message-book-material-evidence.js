(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book vendor / material evidence contract ───────────────────────
    // The single tested boundary that sits BELOW 8H (MessageBookSpineInputs) and
    // answers one question: "what vendor / material EVIDENCE must exist — and be
    // accepted — before the stock confirmation, binding confirmation, paper thickness,
    // and board thickness that 8H needs can honestly be treated as known?" It is an
    // EVIDENCE-AVAILABILITY model only. It selects no vendor, confirms no vendor,
    // contacts no vendor, integrates no vendor, renders no spine or cover, produces no
    // print / export / PDF file, writes nothing, and builds no vendor packet. Modelling
    // which evidence is present creates no artifact and confirms nothing on its own; it
    // only records, locally and deterministically, whether the material facts are backed
    // by accepted evidence yet — and, honestly, that today they are not.
    //
    // It decomposes 8H's vendor confirmations and thicknesses honestly. 8H takes opaque
    // `stockConfirmed` / `bindingConfirmed` booleans and a vendor-supplied `materialSpec`
    // among its inputs. This module says what would have to be TRUE before those inputs
    // could honestly be supplied: a present evidence record, an identified evidence source
    // (who / which version / when), stock evidence, binding evidence, paper-thickness
    // evidence, board-thickness evidence, and an explicit acceptance of that evidence for
    // the spine-input feed. It only emits an 8H adapter payload that marks stock or binding
    // confirmed (or supplies a thickness) when the corresponding evidence is genuinely
    // present AND the evidence has been accepted. The whole point is honesty: it identifies
    // which evidence exists versus what is still missing; it never invents a material or
    // vendor fact, and it never treats a "vendor confirmation pending" note as confirmation.
    //
    // Where each input's truth lives (this module owns no material spec and duplicates none):
    //   internal stock direction   — BOOK_PRODUCTION_DEPS.STOCK in index.html
    //                                (scope-guarded; a provisional launch direction, KNOWN
    //                                 but explicitly NOT a vendor confirmation)
    //   internal binding direction — BOOK_PRODUCTION_DEPS.BINDING in index.html
    //                                (scope-guarded; a locked direction, KNOWN but NOT a
    //                                 vendor confirmation)
    //   evidence source            — a supplied evidence record's source identity / version /
    //                                date; NOT in repo truth today (MISSING)
    //   stock evidence             — vendor-supplied stock confirmation evidence; the vendor
    //                                register records "vendor confirmed: No" (MISSING)
    //   binding evidence           — vendor-supplied binding confirmation evidence (MISSING)
    //   paper thickness evidence   — vendor-supplied caliper evidence (MISSING)
    //   board thickness evidence   — vendor-supplied cover-board evidence (MISSING)
    //   acceptance                 — an explicit accept of the evidence for the feed (MISSING)
    //
    // The honest determination from repo truth: NO vendor / material evidence has been
    // supplied or accepted (see docs/ops/vendor-manufacturing-register.md — "Vendor
    // confirmed: No"; the paper/board thickness are listed as "capture when vendor is
    // confirmed"; ProductRenderSpec records "IngramSpark vendor confirmation pending",
    // which is NOT a confirmation). So this contract reports the evidence missing and emits
    // an adapter payload that keeps 8H exactly where it is — stock-confirmation-missing,
    // spine not computable, cover blocked. A hypothetical, explicitly-labelled fixture can
    // prove the full path works when accepted evidence is supplied, but live truth stays
    // missing because the repo contains no accepted evidence.
    //
    // Having accepted evidence is NOT a confirmed vendor, NOT a rendered spine, NOT a
    // rendered or generated cover, NOT a computed spine width, NOT a known render
    // environment, NOT artifact generation, NOT a print file, and NOT manufacturing
    // readiness. Those concerns are decided elsewhere (8H spine width / cover, 8G render
    // environment, 8E artifact generation, 8A manufacturing) and are reported here only as
    // explicitly-false flags so nothing can imply they are met by accepting the evidence.
    //
    // Fully pure: a deterministic function of its inputs. No DOM, no clock, no Date, no
    // Math.random, no I/O, no network, no storage. It consumes an already-supplied evidence
    // record plus the internal direction and references no sibling module at runtime, so it
    // loads alone. The source carries no commerce / production action verb or call-to-action
    // (guarded by its own source-scan test), so the contract can never imply that a vendor
    // was selected or confirmed, a file produced, or a book manufactured, packaged, or shipped.

    var CONTRACT_VERSION = 'kmme1';
    var PRODUCT_TYPE_ID  = 'message-book';

    // The evidence preflight ladder. The contract is always known (this module defines it);
    // the aggregate is reached only when every required piece of evidence is present AND the
    // evidence is accepted for the feed. The higher concerns — spine width, render
    // environment, the production ladder — are decided elsewhere and never climbed here.
    var LEVEL = Object.freeze({
        MATERIAL_EVIDENCE_CONTRACT_KNOWN: 'material-evidence-contract-known',
        MATERIAL_EVIDENCE_ACCEPTED:       'material-evidence-accepted'
    });

    // The transparency states. Each is evaluated present/missing. Internal direction is
    // distinct from evidence; evidence presence is distinct from acceptance. (acceptance #2 —
    // the model clearly separates these.)
    var STATE = Object.freeze({
        INTERNAL_MATERIAL_DIRECTION_KNOWN: 'internal-material-direction-known',
        EVIDENCE_SOURCE_PRESENT:           'evidence-source-present',
        EVIDENCE_SOURCE_IDENTIFIED:        'evidence-source-identified',
        STOCK_EVIDENCE_PRESENT:            'stock-evidence-present',
        BINDING_EVIDENCE_PRESENT:          'binding-evidence-present',
        PAPER_THICKNESS_EVIDENCE_PRESENT:  'paper-thickness-evidence-present',
        BOARD_THICKNESS_EVIDENCE_PRESENT:  'board-thickness-evidence-present',
        EVIDENCE_ACCEPTED:                 'evidence-accepted'
    });

    // Safe, non-private blocker codes. No message text, names, prices, or order numbers —
    // there are none. The internal direction gets no blocker (it is known repo truth and a
    // missing direction is not what blocks the evidence). Priority order follows the evidence
    // dependency chain: the evidence record must exist, then its source must be identified,
    // then each material fact must be evidenced, and finally the evidence must be accepted.
    var BLOCKER = Object.freeze({
        MATERIAL_EVIDENCE_MISSING:        'material-evidence-missing',
        EVIDENCE_SOURCE_MISSING:          'evidence-source-missing',
        STOCK_EVIDENCE_MISSING:           'stock-evidence-missing',
        BINDING_EVIDENCE_MISSING:         'binding-evidence-missing',
        PAPER_THICKNESS_EVIDENCE_MISSING: 'paper-thickness-evidence-missing',
        BOARD_THICKNESS_EVIDENCE_MISSING: 'board-thickness-evidence-missing',
        MATERIAL_EVIDENCE_NOT_ACCEPTED:   'material-evidence-not-accepted'
    });

    var BLOCKER_ORDER = Object.freeze([
        BLOCKER.MATERIAL_EVIDENCE_MISSING,
        BLOCKER.EVIDENCE_SOURCE_MISSING,
        BLOCKER.STOCK_EVIDENCE_MISSING,
        BLOCKER.BINDING_EVIDENCE_MISSING,
        BLOCKER.PAPER_THICKNESS_EVIDENCE_MISSING,
        BLOCKER.BOARD_THICKNESS_EVIDENCE_MISSING,
        BLOCKER.MATERIAL_EVIDENCE_NOT_ACCEPTED
    ]);

    // Wherever a downstream rung is reported false, it is because the capability is not
    // implemented (mirrors the 7A/8A/8C/8E/8G/8H framing). The spine width, render
    // environment, artifact generation, and the production ladder are decided elsewhere;
    // this module never advances them.
    var GATED_REASON = 'not-implemented';

    var _blockerMessages = {};
    _blockerMessages[BLOCKER.MATERIAL_EVIDENCE_MISSING]        = 'No vendor material evidence has been supplied for this Message Book yet.';
    _blockerMessages[BLOCKER.EVIDENCE_SOURCE_MISSING]          = 'The source of the vendor material evidence (who, which version, and when) is not identified yet.';
    _blockerMessages[BLOCKER.STOCK_EVIDENCE_MISSING]           = 'Vendor evidence confirming the paper stock is not available yet.';
    _blockerMessages[BLOCKER.BINDING_EVIDENCE_MISSING]         = 'Vendor evidence confirming the binding is not available yet.';
    _blockerMessages[BLOCKER.PAPER_THICKNESS_EVIDENCE_MISSING] = 'Vendor evidence for the paper thickness is not available yet.';
    _blockerMessages[BLOCKER.BOARD_THICKNESS_EVIDENCE_MISSING] = 'Vendor evidence for the cover board thickness is not available yet.';
    _blockerMessages[BLOCKER.MATERIAL_EVIDENCE_NOT_ACCEPTED]   = 'The supplied vendor material evidence has not been accepted yet.';

    function blockerMessage(code) {
        return _blockerMessages[code] || '';
    }

    // A safe, descriptive record of each piece of evidence, for docs / a future read-only UI.
    // Frozen; carries no app state. The source note points at where the fact's truth lives
    // today — and is explicit where that truth is genuinely missing.
    var REQUIRED_EVIDENCE = Object.freeze([
        Object.freeze({ state: STATE.INTERNAL_MATERIAL_DIRECTION_KNOWN, label: 'Known internal stock + binding direction', source: 'BOOK_PRODUCTION_DEPS.STOCK / .BINDING (index.html, scope-guarded)', present: 'repo-truth', blocking: false }),
        Object.freeze({ state: STATE.EVIDENCE_SOURCE_PRESENT,           label: 'Evidence record with a source',            source: 'supplied vendor material evidence record (not in repo truth)', present: 'missing', blocking: true }),
        Object.freeze({ state: STATE.EVIDENCE_SOURCE_IDENTIFIED,        label: 'Evidence source identity / version / date', source: 'supplied evidence source metadata (not in repo truth)',        present: 'missing', blocking: true }),
        Object.freeze({ state: STATE.STOCK_EVIDENCE_PRESENT,            label: 'Vendor stock confirmation evidence',        source: 'vendor-supplied (register: "vendor confirmed: No")',           present: 'missing', blocking: true }),
        Object.freeze({ state: STATE.BINDING_EVIDENCE_PRESENT,          label: 'Vendor binding confirmation evidence',      source: 'vendor-supplied (register: "vendor confirmed: No")',           present: 'missing', blocking: true }),
        Object.freeze({ state: STATE.PAPER_THICKNESS_EVIDENCE_PRESENT,  label: 'Vendor paper-thickness evidence',           source: 'vendor-supplied caliper (capture when vendor confirmed)',      present: 'missing', blocking: true }),
        Object.freeze({ state: STATE.BOARD_THICKNESS_EVIDENCE_PRESENT,  label: 'Vendor board-thickness evidence',           source: 'vendor-supplied board (capture when vendor confirmed)',        present: 'missing', blocking: true }),
        Object.freeze({ state: STATE.EVIDENCE_ACCEPTED,                 label: 'Evidence accepted for the spine-input feed', source: 'explicit acceptance of the supplied evidence (not in repo truth)', present: 'missing', blocking: true })
    ]);

    function _isFiniteNumber(n) {
        return typeof n === 'number' && isFinite(n);
    }

    function _isPositiveNumber(n) {
        return _isFiniteNumber(n) && n > 0;
    }

    function _nonEmptyString(s) {
        return typeof s === 'string' && s.length > 0;
    }

    // Evaluate the vendor / material evidence availability from already-supplied facts.
    // input: {
    //   internalStockDirectionKnown   : boolean — repo has a stock direction (BOOK_PRODUCTION_DEPS.STOCK)
    //   internalBindingDirectionKnown : boolean — repo has a binding direction (BOOK_PRODUCTION_DEPS.BINDING)
    //   evidence : {
    //     source: { identity: string, version: string, date: string } — provenance
    //     stockConfirmed          : boolean — vendor stock confirmation evidence
    //     bindingConfirmed        : boolean — vendor binding confirmation evidence
    //     paperThicknessPerLeafIn : number  — vendor-supplied paper caliper evidence
    //     boardThicknessIn        : number  — vendor-supplied board thickness evidence
    //     accepted                : boolean — explicit acceptance of the evidence for the feed
    //   } | null
    // }
    function evaluate(input) {
        var i  = input || {};
        var ev = (i.evidence && typeof i.evidence === 'object') ? i.evidence : null;
        var evidencePresent = ev !== null;

        var internalStockDirectionKnown   = i.internalStockDirectionKnown === true;
        var internalBindingDirectionKnown = i.internalBindingDirectionKnown === true;
        var internalMaterialDirectionKnown = internalStockDirectionKnown && internalBindingDirectionKnown;

        var source = (ev && ev.source && typeof ev.source === 'object') ? ev.source : null;
        var evidenceSourcePresent    = source !== null;
        var evidenceSourceIdentified = evidenceSourcePresent &&
            _nonEmptyString(source.identity) &&
            _nonEmptyString(source.version) &&
            _nonEmptyString(source.date);

        var stockEvidencePresent          = !!(ev && ev.stockConfirmed === true);
        var bindingEvidencePresent        = !!(ev && ev.bindingConfirmed === true);
        var paperThicknessEvidencePresent = !!(ev && _isPositiveNumber(ev.paperThicknessPerLeafIn));
        var boardThicknessEvidencePresent = !!(ev && _isPositiveNumber(ev.boardThicknessIn));

        // The raw acceptance flag. Acceptance is meaningful for the feed only when the
        // evidence is also provenance-identified — accepting unsourced evidence would be the
        // dishonesty this contract exists to prevent.
        var acceptedFlag      = !!(ev && ev.accepted === true);
        var evidenceAccepted  = acceptedFlag && evidenceSourceIdentified;

        // The evidence is "complete" only when the source is identified and every material
        // fact is evidenced. Acceptance is the final, separate gate on top of completeness.
        var evidenceComplete =
            evidenceSourceIdentified &&
            stockEvidencePresent &&
            bindingEvidencePresent &&
            paperThicknessEvidencePresent &&
            boardThicknessEvidencePresent;

        var states = {};
        states[STATE.INTERNAL_MATERIAL_DIRECTION_KNOWN] = internalMaterialDirectionKnown;
        states[STATE.EVIDENCE_SOURCE_PRESENT]           = evidenceSourcePresent;
        states[STATE.EVIDENCE_SOURCE_IDENTIFIED]        = evidenceSourceIdentified;
        states[STATE.STOCK_EVIDENCE_PRESENT]            = stockEvidencePresent;
        states[STATE.BINDING_EVIDENCE_PRESENT]          = bindingEvidencePresent;
        states[STATE.PAPER_THICKNESS_EVIDENCE_PRESENT]  = paperThicknessEvidencePresent;
        states[STATE.BOARD_THICKNESS_EVIDENCE_PRESENT]  = boardThicknessEvidencePresent;
        states[STATE.EVIDENCE_ACCEPTED]                 = evidenceAccepted;

        // Collect blockers in priority order. Each maps to a blocking state being false.
        var blockers = [];
        if (!evidencePresent)                blockers.push(BLOCKER.MATERIAL_EVIDENCE_MISSING);
        if (!evidenceSourceIdentified)       blockers.push(BLOCKER.EVIDENCE_SOURCE_MISSING);
        if (!stockEvidencePresent)           blockers.push(BLOCKER.STOCK_EVIDENCE_MISSING);
        if (!bindingEvidencePresent)         blockers.push(BLOCKER.BINDING_EVIDENCE_MISSING);
        if (!paperThicknessEvidencePresent)  blockers.push(BLOCKER.PAPER_THICKNESS_EVIDENCE_MISSING);
        if (!boardThicknessEvidencePresent)  blockers.push(BLOCKER.BOARD_THICKNESS_EVIDENCE_MISSING);
        // The "not accepted" blocker only applies once there is complete evidence to accept.
        if (evidenceComplete && !acceptedFlag) blockers.push(BLOCKER.MATERIAL_EVIDENCE_NOT_ACCEPTED);

        var allEvidenceAccepted = blockers.length === 0;
        var furthestLevel = allEvidenceAccepted
            ? LEVEL.MATERIAL_EVIDENCE_ACCEPTED
            : LEVEL.MATERIAL_EVIDENCE_CONTRACT_KNOWN;

        // The accepted material values that may feed 8H. Each is supplied ONLY when the
        // evidence is accepted (provenance-identified + accepted flag) AND that specific
        // evidence is present. Never invented; absent → false / null.
        var acceptedStockConfirmed   = evidenceAccepted && stockEvidencePresent;
        var acceptedBindingConfirmed = evidenceAccepted && bindingEvidencePresent;
        var acceptedPaperThicknessPerLeafIn = (evidenceAccepted && paperThicknessEvidencePresent)
            ? ev.paperThicknessPerLeafIn : null;
        var acceptedBoardThicknessIn = (evidenceAccepted && boardThicknessEvidencePresent)
            ? ev.boardThicknessIn : null;

        return {
            contractVersion: CONTRACT_VERSION,
            productTypeId:   PRODUCT_TYPE_ID,

            // Evidence ladder (booleans).
            materialEvidenceContractKnown: true,
            allEvidenceAccepted:           allEvidenceAccepted,

            // Per-state transparency.
            states: states,

            // Internal material direction is distinct from evidence (acceptance #2).
            internalStockDirectionKnown:   internalStockDirectionKnown,
            internalBindingDirectionKnown: internalBindingDirectionKnown,
            internalMaterialDirectionKnown: internalMaterialDirectionKnown,

            // Evidence presence is distinct from acceptance (acceptance #2).
            evidencePresent:              evidencePresent,
            evidenceSourcePresent:        evidenceSourcePresent,
            evidenceSourceIdentified:     evidenceSourceIdentified,
            stockEvidencePresent:         stockEvidencePresent,
            bindingEvidencePresent:       bindingEvidencePresent,
            paperThicknessEvidencePresent: paperThicknessEvidencePresent,
            boardThicknessEvidencePresent: boardThicknessEvidencePresent,
            evidenceComplete:             evidenceComplete,
            acceptedFlag:                 acceptedFlag,
            evidenceAccepted:             evidenceAccepted,

            // Accepted material values for the 8H feed (never invented).
            acceptedStockConfirmed:          acceptedStockConfirmed,
            acceptedBindingConfirmed:        acceptedBindingConfirmed,
            acceptedPaperThicknessPerLeafIn: acceptedPaperThicknessPerLeafIn,
            acceptedBoardThicknessIn:        acceptedBoardThicknessIn,

            // Strictly separate, higher concerns — decided elsewhere, never advanced here.
            // Reported false so nothing can imply that accepting the evidence produced a
            // computed spine width, an unblocked cover, a known render environment, an
            // artifact, a print file, a vendor, manufacturing, or packaging (acceptance #2).
            spineWidthComputable:          false,
            coverUnblocked:                false,
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

    // Honest derivation helper from a BOOK_PRODUCTION_DEPS-shaped production direction.
    // A direction is "known" only when its value is a genuinely present, non-empty string.
    function _directionKnown(value) {
        return _nonEmptyString(value);
    }

    // Bridge from already-decided repo-truth facts to the evaluate() input. It reads the
    // BOOK_PRODUCTION_DEPS-shaped production direction for the internal stock/binding
    // direction and an optional supplied vendor material evidence record — never inventing a
    // material or vendor fact, and never treating a "vendor confirmation pending" note as
    // evidence. With no supplied evidence (the live repo state), the evidence is reported
    // missing. Pure: reads only its argument and calls evaluate() / describeReadiness() /
    // toSpineInputMaterial(); references no sibling module at runtime.
    function resolveFromContext(args) {
        var a   = args || {};
        var dir = a.productionDirection || null;

        var input = {
            internalStockDirectionKnown:   _directionKnown(dir && dir.STOCK),
            internalBindingDirectionKnown: _directionKnown(dir && dir.BINDING),
            evidence:                      a.materialEvidence || null
        };
        var result = evaluate(input);
        return {
            input:              input,
            result:             result,
            display:            describeReadiness(result),
            spineInputMaterial: toSpineInputMaterial(result)
        };
    }

    // Honest adapter to MessageBookSpineInputs (8H). 8H's resolveFromContext consumes a
    // `productionDependencies` object with `stockConfirmed` / `bindingConfirmed` and an
    // optional vendor-supplied `materialSpec` with `paperThicknessPerLeafIn` /
    // `boardThicknessIn`. This maps the 8I accepted-evidence facts onto exactly those
    // fields: a confirmation is true ONLY when its evidence is present and the evidence has
    // been accepted, and a thickness is supplied ONLY when its evidence is present and
    // accepted. While the evidence is missing or unaccepted (the live state), every field is
    // false / absent, so feeding this to 8H keeps 8H honestly at stock-confirmation-missing,
    // spine not computable, and the cover blocked. Only a FUTURE package that supplies and
    // accepts genuine evidence could flip it; this package never invents it. 8H is NOT
    // modified — it consumes these values through its existing input path. The cover gate
    // (`coverGenerationBlocked`), the production direction, and the page count are NOT
    // material evidence and stay with the caller.
    function toSpineInputMaterial(result) {
        var r = result || {};
        var paper = (typeof r.acceptedPaperThicknessPerLeafIn === 'number') ? r.acceptedPaperThicknessPerLeafIn : undefined;
        var board = (typeof r.acceptedBoardThicknessIn === 'number') ? r.acceptedBoardThicknessIn : undefined;
        var materialSpec = (paper !== undefined || board !== undefined)
            ? { paperThicknessPerLeafIn: paper, boardThicknessIn: board }
            : null;
        return {
            stockConfirmed:   r.acceptedStockConfirmed === true,
            bindingConfirmed: r.acceptedBindingConfirmed === true,
            materialSpec:     materialSpec
        };
    }

    // ── Read-only display layer ──────────────────────────────────────────────
    // A live caller may SHOW this preflight. The copy never says ready-to-print,
    // print-now, export-now, order, buy, pay, or ship, and never implies a confirmed
    // vendor, a rendered spine or cover, a print file, or a manufacturing step — it states
    // only which vendor material evidence is present versus missing or unaccepted.
    var STATUS_TONE = Object.freeze({
        GATED: 'gated',
        KNOWN: 'known'
    });

    var _GATED_HEADLINE = 'Vendor material evidence is not ready yet';
    var _KNOWN_HEADLINE = 'Vendor material evidence is accepted';
    var _KNOWN_DETAIL   = 'Every required vendor material evidence is present and accepted; the spine width, render environment, and export artifact generation are still not implemented.';

    // Pure display view-model for a result: { tone, headline, detail, blocker }.
    // Only an all-evidence-accepted result is reported as known (and even then the detail
    // makes clear the spine width / render environment / artifact generation are not
    // implemented); otherwise the safe primary blocker message is the one-line detail, plus
    // the primary blocker code for theming.
    function describeReadiness(result) {
        var r = result || {};
        if (r.allEvidenceAccepted) {
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
    // 8C/8E/8G/8H readiness copy.
    function describeBoundary() {
        return {
            version: CONTRACT_VERSION,
            decides: 'what vendor / material evidence must exist and be accepted before the stock confirmation, binding confirmation, paper thickness, and board thickness that 8H needs can honestly be treated as known, and which evidence is still missing or unaccepted',
            isA:     'vendor / material evidence-availability contract computed from already-supplied facts',
            doesNot: 'It does not select, confirm, contact, or integrate any vendor, render or generate any spine or cover, produce any print, export, or PDF file, write any file, build a vendor packet, or begin manufacturing, packaging, or shipping. It never treats a vendor-confirmation-pending note as confirmation.',

            // The evidence model is strictly distinct from each of these.
            distinctFrom: {
                spineInputs:            'whether the spine width is computable and the cover unblockable once the material facts are known (8H; not advanced here)',
                renderEnvironment:      'whether every render-environment input is known once spine + cover are known (8G; aggregate still false)',
                manufacturingReadiness: 'the production ladder above checkout (8A/8B)'
            },

            // The rungs this contract keeps separate (acceptance #2).
            separates: ['internal-material-direction', 'evidence-availability', 'evidence-acceptance', 'stock-confirmation', 'binding-confirmation', 'paper-thickness', 'board-thickness', 'spine-width-computability', 'cover-unblocking', 'render-environment-known', 'export-artifact-generation', 'print-file', 'vendor', 'manufacturing', 'packaging'],

            blockerCodes:   BLOCKER_ORDER.slice(),
            notImplemented: ['vendor-selection', 'vendor-confirmation', 'spine-width-computation', 'spine-rendering', 'cover-generation', 'render-environment-known', 'export-artifact-generation', 'print-file-generation', 'manufacturing', 'packaging'],
            evidenceSourceOfTruth: 'docs/ops/vendor-manufacturing-register.md (vendor confirmed: No) for the live state; an accepted evidence record is not in repo truth. Internal stock/binding direction lives in BOOK_PRODUCTION_DEPS (index.html, scope-guarded; not modified) and is NOT a vendor confirmation.',
            feedsInto:      'MessageBookSpineInputs (8H) productionDependencies.stockConfirmed / .bindingConfirmed and materialSpec.paperThicknessPerLeafIn / .boardThicknessIn — only when evidence is accepted',
            artifactFree:   true,
            recordedOnDevice: true
        };
    }

    KMEngine.MessageBookMaterialEvidence = {
        CONTRACT_VERSION:    CONTRACT_VERSION,
        PRODUCT_TYPE_ID:     PRODUCT_TYPE_ID,
        LEVEL:               LEVEL,
        STATE:               STATE,
        BLOCKER:             BLOCKER,
        BLOCKER_ORDER:       BLOCKER_ORDER,
        REQUIRED_EVIDENCE:   REQUIRED_EVIDENCE,
        STATUS_TONE:         STATUS_TONE,
        GATED_REASON:        GATED_REASON,
        blockerMessage:      blockerMessage,
        evaluate:            evaluate,
        resolveFromContext:  resolveFromContext,
        toSpineInputMaterial: toSpineInputMaterial,
        describeReadiness:   describeReadiness,
        describeBoundary:    describeBoundary
    };
}());
