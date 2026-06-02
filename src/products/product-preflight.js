(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // Mirrors the severity constants in index.html — engine-side copy for Node testability.
    var SEVERITY = Object.freeze({
        INFO:    'info',
        WARNING: 'warning',
        ERROR:   'error'
    });

    var CHECK_STATUS = Object.freeze({
        PASSED:          'passed',
        FAILED:          'failed',
        NOT_APPLICABLE:  'not-applicable',
        SKIPPED:         'skipped'
    });

    // Mirrors the 10 check definitions from index.html — engine-side copy for Node testability.
    // These names must match index.html BOOK_PREFLIGHT_CHECK_REGISTRY keys.
    var CHECK_REGISTRY = Object.freeze({
        PAGE_COUNT_CONSISTENCY: {
            name:           'page_count_consistency',
            description:    'Paginator output page count matches the captured BookRenderSpec.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['bookRenderSpec', 'livePaginatorOutput']
        },
        PAGE_COUNT_PARITY: {
            name:           'page_count_parity',
            description:    'Total physical page count is even (parity padding applied if needed).',
            severity:       SEVERITY.WARNING,
            blocking:       false,
            requiredInputs: ['bookRenderSpec']
        },
        FONT_AVAILABILITY: {
            name:           'font_availability',
            description:    'All font faces used in the interior are present in the render environment.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['assetManifest', 'renderEnvironment']
        },
        EMOJI_STRATEGY_CONFIRMED: {
            name:           'emoji_strategy_confirmed',
            description:    'Print-safe emoji rendering strategy is confirmed and available.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['emojiRenderConfig']
        },
        SAFE_AREA_VIOLATIONS: {
            name:           'safe_area_violations',
            description:    'No live content extends into the trim or bleed zone.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['renderedPageDimensions', 'physicalSpec']
        },
        SPINE_WIDTH_KNOWN: {
            name:           'spine_width_known',
            description:    'Spine width computed from confirmed page count and stock spec.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['bookRenderSpec', 'stockSpec']
        },
        COVER_INTERIOR_CONSISTENCY: {
            name:           'cover_interior_consistency',
            description:    'Spine width was computed from the same page count as the finalized interior.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['coverSpec', 'bookRenderSpec']
        },
        LOW_RESOLUTION_IMAGES: {
            name:           'low_resolution_images',
            description:    'No embedded raster images below 300 DPI at final print size.',
            severity:       SEVERITY.WARNING,
            blocking:       false,
            requiredInputs: ['assetManifest', 'physicalSpec']
        },
        PAGINATION_STABILITY: {
            name:           'pagination_stability',
            description:    'Two independent pagination passes on the same state produce identical page counts.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['messageBookState', 'generateCompositionUnits', 'paginateUnits', 'contactName']
        },
        OVERFLOW_DETECTION: {
            name:           'overflow_detection',
            description:    'No rendered page element overflows the live area boundary.',
            severity:       SEVERITY.ERROR,
            blocking:       true,
            requiredInputs: ['renderedPageDimensions', 'physicalSpec']
        }
    });

    // ── Check runners ─────────────────────────────────────────────────────────

    function _runPaginationStability(inputs) {
        var s    = inputs.messageBookState;
        var gen  = inputs.generateCompositionUnits;
        var pag  = inputs.paginateUnits;
        var name = inputs.contactName;

        if (!s || typeof gen !== 'function' || typeof pag !== 'function') {
            return {
                checkName: CHECK_REGISTRY.PAGINATION_STABILITY.name,
                status:    CHECK_STATUS.NOT_APPLICABLE,
                severity:  SEVERITY.ERROR,
                blocking:  true,
                message:   'Required inputs missing: messageBookState, generateCompositionUnits, paginateUnits'
            };
        }

        try {
            var units1  = gen(s, name || '');
            var pages1  = pag(units1);
            var count1  = Array.isArray(pages1) ? pages1.length : 0;

            var units2  = gen(s, name || '');
            var pages2  = pag(units2);
            var count2  = Array.isArray(pages2) ? pages2.length : 0;

            var stable  = count1 === count2;
            return {
                checkName: CHECK_REGISTRY.PAGINATION_STABILITY.name,
                status:    stable ? CHECK_STATUS.PASSED : CHECK_STATUS.FAILED,
                severity:  SEVERITY.ERROR,
                blocking:  true,
                message:   stable
                    ? 'Pagination is stable: both runs produced ' + count1 + ' pages.'
                    : 'Pagination instability: run 1 = ' + count1 + ' pages, run 2 = ' + count2 + ' pages.'
            };
        } catch (e) {
            return {
                checkName: CHECK_REGISTRY.PAGINATION_STABILITY.name,
                status:    CHECK_STATUS.FAILED,
                severity:  SEVERITY.ERROR,
                blocking:  true,
                message:   'Pagination check threw: ' + e.message
            };
        }
    }

    function _notApplicable(checkKey, missingInputs) {
        var def = CHECK_REGISTRY[checkKey];
        return {
            checkName: def.name,
            status:    CHECK_STATUS.NOT_APPLICABLE,
            severity:  def.severity,
            blocking:  def.blocking,
            message:   'Required inputs not yet available: ' + missingInputs.join(', ')
        };
    }

    // ── Public API ────────────────────────────────────────────────────────────

    function createResult(opts) {
        return {
            checkName: opts.checkName,
            status:    opts.status,
            severity:  opts.severity,
            blocking:  opts.blocking,
            message:   opts.message || ''
        };
    }

    function run(checkKey, inputs) {
        if (checkKey === 'PAGINATION_STABILITY') {
            return _runPaginationStability(inputs || {});
        }

        var def = CHECK_REGISTRY[checkKey];
        if (!def) {
            return {
                checkName: checkKey,
                status:    CHECK_STATUS.SKIPPED,
                severity:  SEVERITY.INFO,
                blocking:  false,
                message:   'Unknown check: ' + checkKey
            };
        }

        return _notApplicable(checkKey, def.requiredInputs);
    }

    function createReport(results) {
        var passedCount         = 0;
        var failedCount         = 0;
        var notApplicableCount  = 0;
        var skippedCount        = 0;
        var blockingFailureCount = 0;
        var missingInputCount   = 0;

        for (var i = 0; i < results.length; i++) {
            var r = results[i];
            if (r.status === CHECK_STATUS.PASSED)         passedCount++;
            if (r.status === CHECK_STATUS.FAILED)         failedCount++;
            if (r.status === CHECK_STATUS.NOT_APPLICABLE) { notApplicableCount++; missingInputCount++; }
            if (r.status === CHECK_STATUS.SKIPPED)        skippedCount++;
            if (r.status === CHECK_STATUS.FAILED && r.blocking) blockingFailureCount++;
        }

        var runnableCount = passedCount + failedCount;

        // overallStatus rules:
        //   failed    — any blocking runnable check failed
        //   incomplete — any required check is not-applicable (inputs missing)
        //   passed    — all required checks ran and passed
        //   skipped   — no checks ran at all
        var overallStatus;
        if (blockingFailureCount > 0) {
            overallStatus = 'failed';
        } else if (notApplicableCount > 0) {
            overallStatus = 'incomplete';
        } else if (runnableCount > 0 && failedCount === 0) {
            overallStatus = 'passed';
        } else {
            overallStatus = 'skipped';
        }

        return {
            results:              results,
            passedCount:          passedCount,
            failedCount:          failedCount,
            notApplicableCount:   notApplicableCount,
            skippedCount:         skippedCount,
            blockingFailureCount: blockingFailureCount,
            runnableCount:        runnableCount,
            missingInputCount:    missingInputCount,
            overallStatus:        overallStatus
        };
    }

    function runAll(inputs) {
        var results = [];
        var keys = Object.keys(CHECK_REGISTRY);
        for (var i = 0; i < keys.length; i++) {
            results.push(run(keys[i], inputs || {}));
        }
        return createReport(results);
    }

    KMEngine.ProductPreflight = {
        SEVERITY:      SEVERITY,
        CHECK_STATUS:  CHECK_STATUS,
        CHECK_REGISTRY: CHECK_REGISTRY,
        createResult:  createResult,
        createReport:  createReport,
        run:           run,
        runAll:        runAll
    };
}());
