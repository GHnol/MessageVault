(function () {
    'use strict';

    var KMEngine = window.KMEngine = window.KMEngine || {};

    // ── Message Book page composition engine ─────────────────────────────────
    // The pure, DOM-free pagination math behind the Message Book proof preview.
    // It is the single tested source of truth for HOW composition units pack into
    // pages and what each page is — separate from how a page is drawn to the DOM
    // (the renderer in index.html owns that) and separate from the proof-review
    // phase decision (KMEngine.ProofPreviewContract, 6A, owns that).
    //
    // Pure: no DOM, no timestamps, no randomness, no I/O, and no hardcoded page
    // constants. The page geometry (page line budget, header weights) lives with
    // the renderer in index.html and is passed in as config, so this module never
    // owns or duplicates the scope-guarded pagination constants. Given the same
    // units and config it returns the same pages, which is what makes the proof a
    // user reviews predictable and testable.
    //
    // computePageLimitStatus is the one bridge between this engine and the 6A proof
    // gate: the engine produces a page count, this turns it into the over-limit
    // boolean, and ProofPreviewContract consumes that boolean. It does not restate
    // the proof contract — it only produces the input the contract reads.
    //
    // The source of this module is kept free of downstream wording about buying,
    // printing, producing, or shipping the book (guarded by its own source-scan
    // test), consistent with the proof-preview contract.

    var MODULE_VERSION = 'kmbc1';

    // ── Line-cost estimation (pure) ──────────────────────────────────────────
    // Estimate normalized lines for a single message bubble.
    // Chat bubbles occupy roughly 35 chars/line in this trim size.
    function msgLineCount(m) {
        var chars = (m.text || '').length;
        if (chars === 0) return 2;  // attachment placeholder
        var textLines = Math.max(1, Math.ceil(chars / 35));
        var rxLines   = (m.reactions && m.reactions.length) ? 1 : 0;
        return textLines + rxLines + 1; // +1 for inter-bubble gap
    }

    // Estimate normalized lines for a same-sender run block.
    function runLineCount(run) {
        // 1 attribution line + sum of message line costs
        return 1 + run.messages.reduce(function (s, m) { return s + msgLineCount(m); }, 0);
    }

    // Group consecutive same-sender messages into runs.
    function groupIntoRuns(messages) {
        var runs = [];
        for (var i = 0; i < messages.length; i++) {
            var msg  = messages[i];
            var last = runs[runs.length - 1];
            if (last && last.sender === msg.sender) {
                last.messages.push(msg);
            } else {
                runs.push({ sender: msg.sender, messages: [msg] });
            }
        }
        return runs;
    }

    // Split a sender-run unit into page-safe chunks at message boundaries.
    // maxLines is supplied by the caller so header + chunk never exceeds a page.
    // This guarantees the orphan guard can always flush a header with its first run
    // onto a single page without overflow. Continuation chunks are isContinuation:true.
    function splitRunIntoChunks(unit, maxLines) {
        var messages = unit.run.messages;
        if (messages.length <= 1) return [unit]; // single message — indivisible
        var chunks = [];
        var start = 0;
        while (start < messages.length) {
            var accumulated = 1; // attribution line
            var end = start;
            while (end < messages.length) {
                var cost = msgLineCount(messages[end]);
                if (accumulated + cost > maxLines && end > start) break;
                accumulated += cost;
                end++;
            }
            if (end === start) end = start + 1; // always advance at least one message
            var sliceRun = { sender: unit.run.sender, messages: messages.slice(start, end) };
            chunks.push({
                type: 'sender-run',
                lines: runLineCount(sliceRun),
                run: sliceRun,
                contactName: unit.contactName,
                showTs: unit.showTs,
                featured: unit.featured,
                sectionId: unit.sectionId,
                isContinuation: start > 0
            });
            start = end;
        }
        return chunks;
    }

    // Extract an opening slice of a sender-run that fits within availableLines.
    // Splits only at message boundaries; reactions stay attached to their message
    // because msgLineCount already accounts for the reaction line within each message.
    // Returns { opening: Unit|null, continuation: Unit|null }
    //   opening:      first N messages that fit (attribution + N messages ≤ availableLines),
    //                 or null if not even one message fits
    //   continuation: remaining messages as a new unit, or null if all messages fit
    function splitRunForPage(unit, availableLines) {
        var messages = unit.run.messages;
        if (messages.length === 0) return { opening: null, continuation: null };

        var accumulated = 1; // attribution line cost
        var end = 0;
        for (var i = 0; i < messages.length; i++) {
            var cost = msgLineCount(messages[i]);
            if (accumulated + cost > availableLines) break;
            accumulated += cost;
            end = i + 1;
        }

        if (end === 0) return { opening: null, continuation: unit }; // nothing fits
        if (end === messages.length) return { opening: unit, continuation: null }; // all fits

        var openRun = { sender: unit.run.sender, messages: messages.slice(0, end) };
        var tailRun = { sender: unit.run.sender, messages: messages.slice(end) };
        return {
            opening: {
                type: 'sender-run', lines: runLineCount(openRun),
                run: openRun, contactName: unit.contactName,
                showTs: unit.showTs, featured: unit.featured,
                sectionId: unit.sectionId, isContinuation: false
            },
            continuation: {
                type: 'sender-run', lines: runLineCount(tailRun),
                run: tailRun, contactName: unit.contactName,
                showTs: unit.showTs, featured: unit.featured,
                sectionId: unit.sectionId, isContinuation: true
            }
        };
    }

    // Pack composition units into page objects.
    // config: { pageLines, featuredHeaderLines, continuationLines } — page geometry
    // supplied by the renderer (this module owns no page constants).
    //
    // Returns: Array<Page>  where Page = {
    //   units, linesUsed, featured, isSectionStart, isSectionContinuation,
    //   sectionId, sectionDisplayName,
    //   -- plus physical-page metadata after enrichPageMetadata --
    // }
    //
    // Rule priority:
    //   1. force-page-break  → flush immediately; clears needsContinuation
    //   2. alwaysOwnPage     → isolate on its own page; clears section context
    //   3. section-header / featured-header smart placement (orphan guard):
    //        a. header + next full chunk fit → place both normally
    //        b. header fits but full chunk doesn't → carve an opening slice
    //           (message-boundary split); place header + slice, flush, continue
    //        c. header itself doesn't fit OR no opening slice possible →
    //           flush to new page, place header there with its full first chunk
    //   4. sender-run soft keep-together → flush to new page when run won't fit
    //   5. normal placement  → place on current page; flush when full
    //
    // Continuation injection: when a section spans a page boundary, the paginator
    // injects a synthetic section-continuation unit at the top of each continuation
    // page. Pre-processing splits oversized runs so no chunk exceeds a safe max.
    function paginateUnits(rawUnits, config) {
        var cfg  = config || {};
        var PAGE = cfg.pageLines;
        var FEAT = cfg.featuredHeaderLines;
        var CONT = cfg.continuationLines;

        // Pre-processing: split runs that exceed the safe max at message boundaries.
        // Use the larger (featured) header as the cap so chunks are safe regardless
        // of whether the section is featured.
        var RUN_MAX_LINES = PAGE - FEAT;
        var preUnits = [];
        for (var ri = 0; ri < rawUnits.length; ri++) {
            var ru = rawUnits[ri];
            if (ru.type === 'sender-run' && ru.lines > RUN_MAX_LINES) {
                var splitChunks = splitRunIntoChunks(ru, RUN_MAX_LINES);
                for (var ci = 0; ci < splitChunks.length; ci++) preUnits.push(splitChunks[ci]);
            } else {
                preUnits.push(ru);
            }
        }

        var pages = [];

        // Section-tracking state — updated as headers and content units are placed.
        var activeSectionId       = null;
        var activeSectionLabel    = null;
        var activeSectionFeatured = false;
        var needsContinuation     = false; // true after a flush while a section is active

        function newCur() {
            return { units: [], linesUsed: 0, featured: false,
                     isSectionStart: false, isSectionContinuation: false,
                     sectionId: null, sectionDisplayName: null };
        }
        var cur = newCur();
        var queue = preUnits.slice();

        function flush() {
            if (cur.units.length > 0) {
                pages.push(cur);
                needsContinuation = activeSectionId !== null;
            } else {
                needsContinuation = false;
            }
            cur = newCur();
        }

        // Mark the current page as a section start and record the active section.
        function markSectionStart(u) {
            activeSectionId        = (u.sectionId !== undefined && u.sectionId !== null) ? u.sectionId : null;
            activeSectionLabel     = u.displayName;
            activeSectionFeatured  = u.featured || false;
            needsContinuation      = false;
            cur.isSectionStart     = true;
            cur.sectionId          = activeSectionId;
            cur.sectionDisplayName = activeSectionLabel;
            if (u.featured) cur.featured = true;
        }

        while (queue.length > 0) {
            var u = queue.shift();

            // ── Continuation injection ─────────────────────────────────
            // At the very start of a fresh page, if the active section is
            // continuing from the previous page, prepend a quiet cont'd header.
            if (needsContinuation &&
                cur.units.length === 0 &&
                (u.type === 'sender-run' || u.type === 'message') &&
                u.sectionId === activeSectionId) {
                var contUnit = {
                    type: 'section-continuation',
                    lines: CONT,
                    displayName: activeSectionLabel,
                    featured: activeSectionFeatured,
                    sectionId: activeSectionId
                };
                cur.units.push(contUnit);
                cur.linesUsed         += CONT;
                cur.isSectionContinuation = true;
                cur.sectionId          = activeSectionId;
                cur.sectionDisplayName = activeSectionLabel;
                if (contUnit.featured) cur.featured = true;
                needsContinuation = false;
            }

            // Rule 1 — force-page-break
            if (u.type === 'force-page-break') {
                flush();
                needsContinuation = false; // explicit break clears continuation
                continue;
            }

            // Rule 2 — alwaysOwnPage (frontmatter / backmatter)
            if (u.alwaysOwnPage) {
                flush();
                needsContinuation  = false;
                activeSectionId    = null; // frontmatter clears section context
                cur.units.push(u);
                cur.linesUsed = PAGE;
                flush();
                continue;
            }

            // Rule 3 — section-header / featured-header smart placement (orphan guard).
            // Engages only when there is already content on the current page.
            var isHeader = u.type === 'section-header' || u.type === 'featured-header';
            if (isHeader && cur.units.length > 0) {
                var next      = queue.length > 0 ? queue[0] : null;
                var spaceLeft = PAGE - cur.linesUsed;

                if (next && !next.alwaysOwnPage && next.type !== 'force-page-break') {
                    var needed = u.lines + next.lines;

                    if (spaceLeft < needed) {
                        if (u.lines <= spaceLeft && next.type === 'sender-run') {
                            // Header fits; try to carve an opening slice from the run.
                            var spaceAfterHeader = spaceLeft - u.lines;
                            var split = splitRunForPage(next, spaceAfterHeader);

                            if (split.opening !== null) {
                                // Place header + opening slice on this page, then flush.
                                cur.units.push(u);
                                cur.linesUsed += u.lines;
                                markSectionStart(u);
                                cur.units.push(split.opening);
                                cur.linesUsed += split.opening.lines;
                                if (split.opening.featured) cur.featured = true;
                                queue.shift(); // consume the original run
                                if (split.continuation) queue.unshift(split.continuation);
                                flush();
                                continue;
                            }
                        }
                        // Header doesn't fit or no opening slice possible:
                        // push the whole section to a fresh page.
                        flush();
                    }
                }
            }

            // Update section tracking when a header lands (Rule 3 fallthrough or fresh page).
            if (isHeader) markSectionStart(u);

            // Rule 4 — sender-run soft keep-together.
            if (u.type === 'sender-run') {
                var spaceLeftRun = PAGE - cur.linesUsed;
                if (u.lines > spaceLeftRun && cur.units.length > 0) {
                    flush();
                    // The top-of-loop injection check only fires when entering a fresh
                    // iteration. Rule 4 flushes mid-iteration and then falls through to
                    // Rule 5 without going back to the loop top, so we must re-check
                    // injection here. cur is guaranteed empty after flush().
                    if (needsContinuation && u.sectionId === activeSectionId) {
                        cur.units.push({
                            type: 'section-continuation',
                            lines: CONT,
                            displayName: activeSectionLabel,
                            featured: activeSectionFeatured,
                            sectionId: activeSectionId
                        });
                        cur.linesUsed          += CONT;
                        cur.isSectionContinuation = true;
                        cur.sectionId           = activeSectionId;
                        cur.sectionDisplayName  = activeSectionLabel;
                        if (activeSectionFeatured) cur.featured = true;
                        needsContinuation       = false;
                    }
                }
            }

            // Rule 5 — place unit
            cur.units.push(u);
            cur.linesUsed += (u.lines || 0);
            if (u.featured) cur.featured = true;
            // Track sectionId / sectionDisplayName for content units landing without a header.
            if (cur.sectionId === null && u.sectionId != null) {
                cur.sectionId = u.sectionId;
                cur.sectionDisplayName = activeSectionLabel;
            }

            if (cur.linesUsed >= PAGE) flush();
        }

        flush(); // drain any remaining content
        return pages;
    }

    // Enrich page objects from paginateUnits with physical-page metadata.
    // Mutates pages in place; returns the same array.
    // context: { volumeId, hasTimestamps, pageNumberVisible }
    function enrichPageMetadata(pages, context) {
        var ctx = context || {};
        var volumeId          = ctx.volumeId;
        var hasTimestamps     = ctx.hasTimestamps;
        var pageNumberVisible = ctx.pageNumberVisible;
        pages.forEach(function (page, i) {
            page.physicalPageNumber = i + 1;
            page.rectoOrVerso       = page.physicalPageNumber % 2 === 1 ? 'recto' : 'verso';
            page.volumeId           = volumeId;
            page.hasTimestamps      = hasTimestamps;
            page.pageNumberVisible  = pageNumberVisible;
            page.isFeatured         = page.featured;
            page.isPaddingPage      = page.isPaddingPage || false;

            // Derived from unit content
            page.messageCount = page.units.filter(function (u) {
                return u.type === 'message' || u.type === 'sender-run';
            }).length;
            page.hasDivider = page.units.some(function (u) {
                return (u.type === 'section-header' && u.hasDivider) || u.type === 'divider';
            });

            // Logical page type — determined by unit content and pagination flags.
            if (page.isPaddingPage) {
                page.logicalPageType = 'padding-page';
            } else if (page.units.some(function (u) { return u.type === 'title-page'; })) {
                page.logicalPageType = 'title-page';
            } else if (page.units.some(function (u) { return u.type === 'dedication-page'; })) {
                page.logicalPageType = 'dedication-page';
            } else if (page.units.some(function (u) { return u.type === 'ending-page'; })) {
                page.logicalPageType = 'ending-page';
            } else if (page.isSectionContinuation) {
                page.logicalPageType = 'continuation-page';
            } else {
                page.logicalPageType = 'section-page';
            }
        });
        return pages;
    }

    // The single bridge between this engine and the 6A proof gate. Turns a real
    // page count and a volume's page maximum into the canonical over-limit boolean
    // that KMEngine.ProofPreviewContract consumes as `exceedsPageLimit`. It does
    // not restate the proof contract; it only produces the input the contract reads.
    // A page count equal to the maximum is within the limit (strictly-greater is over).
    function computePageLimitStatus(input) {
        var i = input || {};
        var pageCount = (typeof i.pageCount === 'number' && i.pageCount >= 0) ? i.pageCount : 0;
        var maxPages  = (typeof i.maxPages === 'number') ? i.maxPages : 0;
        return {
            pageCount:        pageCount,
            maxPages:         maxPages,
            exceedsPageLimit: pageCount > maxPages
        };
    }

    KMEngine.BookComposition = {
        MODULE_VERSION:         MODULE_VERSION,
        msgLineCount:           msgLineCount,
        runLineCount:           runLineCount,
        groupIntoRuns:          groupIntoRuns,
        splitRunIntoChunks:     splitRunIntoChunks,
        splitRunForPage:        splitRunForPage,
        paginateUnits:          paginateUnits,
        enrichPageMetadata:     enrichPageMetadata,
        computePageLimitStatus: computePageLimitStatus
    };
}());
