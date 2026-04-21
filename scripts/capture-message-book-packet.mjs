/**
 * MESSAGE BOOK — Preview Handoff Capture Harness V1
 *
 * Generates the Preview Handoff Package assets for Message Book design reconstruction.
 * Default mode: deterministic seeded scenarios (no manual setup required).
 * Optional mode: --chat-db <path>  (not supported in this pass — see note at bottom).
 *
 * Usage:
 *   node capture-message-book-packet.mjs                    # all four scenarios
 *   node capture-message-book-packet.mjs --scenarios a,c    # specific scenarios
 *   node capture-message-book-packet.mjs --clean            # delete prior artifacts first
 *
 * First time setup:
 *   npm install
 *   npx playwright install chromium
 */

import http        from 'node:http';
import fs          from 'node:fs';
import fsp         from 'node:fs/promises';
import path        from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
    ALL_SCENARIOS,
    ROUGH_AREA_FLAGS,
} from './message-book-scenarios.mjs';

// ── Paths ────────────────────────────────────────────────────────────────────

const __dir      = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dir, '..');
const APP_FILE   = path.join(REPO_ROOT, 'index.html');
const ARTIFACTS  = path.join(REPO_ROOT, 'artifacts', 'preview-handoff-v1');

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const wantClean      = args.includes('--clean');
const scenarioFilter = (() => {
    const idx = args.indexOf('--scenarios');
    if (idx === -1) return null;
    return args[idx + 1]?.split(',').map(s => s.trim().toLowerCase()) ?? null;
})();
const chatDbPath = (() => {
    const idx = args.indexOf('--chat-db');
    return idx === -1 ? null : args[idx + 1] ?? null;
})();

// ── Static server ─────────────────────────────────────────────────────────────

function startServer(port = 7331) {
    const html = fs.readFileSync(APP_FILE);
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${port}` }));
    });
}

// ── Playwright utilities ──────────────────────────────────────────────────────

async function waitForKm(page) {
    await page.waitForFunction(() => typeof window.__km !== 'undefined', { timeout: 10_000 });
}

/** Seed keepsakeGroups + contact name, then open the book view from scratch. */
async function seedAndOpenBook(page, scenario) {
    // Ensure a clean slate between scenarios
    await page.evaluate(() => {
        window.__km.setKeepsakeGroups([]);
        window.__km.messageBookState = null;
    });

    // Seed the groups
    await page.evaluate((groups) => {
        window.__km.setKeepsakeGroups(groups);
    }, scenario.groups);

    // Set contact name
    await page.evaluate((name) => window.__km.setContactName(name), scenario.contactName);

    // Open book view — this calls initMessageBookState() + syncBookSections() + renderBookView()
    await page.evaluate(() => window.__km.showBookView());
    await page.waitForTimeout(600); // let layout settle
}

/** Apply book settings to the current messageBookState and re-render. */
async function applyBookSettings(page, bookSettings, sectionConfig = [], overrides = {}) {
    await page.evaluate(({ settings, sectionCfg, overrides }) => {
        const s = window.__km.messageBookState;
        if (!s) return;

        // Merge opening settings
        const merged = Object.assign({}, settings, overrides);
        s.opening.title             = merged.title            ?? s.opening.title;
        s.opening.dedicationEnabled = merged.dedicationEnabled ?? s.opening.dedicationEnabled;
        s.opening.dedicationText    = merged.dedicationText    ?? s.opening.dedicationText;

        // Merge body settings
        s.body.timestampMode  = merged.timestampMode  ?? s.body.timestampMode;
        s.body.pageNumberMode = merged.pageNumberMode ?? s.body.pageNumberMode;
        s.body.dividerMode    = merged.dividerMode    ?? s.body.dividerMode;

        // Apply per-section config (featured, customTitle, excluded)
        if (sectionCfg.length > 0) {
            const sorted = [...s.sections].sort((a, b) => a.orderIndex - b.orderIndex);
            for (const cfg of sectionCfg) {
                const sec = sorted[cfg.sectionIndex];
                if (!sec) continue;
                if (cfg.featured    !== undefined) sec.featured    = cfg.featured;
                if (cfg.customTitle !== undefined) sec.customTitle = cfg.customTitle;
                if (cfg.included    !== undefined) sec.included    = cfg.included;
            }
        }

        window.__km.renderBookView();
    }, { settings: bookSettings, sectionCfg: sectionConfig, overrides });

    await page.waitForTimeout(400);
}

/** Move sections belonging to the given sourceGroupIds to Volume 2. */
async function applyVolumeSplit(page, splitGroupIds) {
    await page.evaluate((groupIds) => {
        const s = window.__km.messageBookState;
        if (!s) return;

        // Ensure Volume 2 exists
        if (!s.volumes.find(v => v.id === 'vol-2')) {
            s.volumes.push({ id: 'vol-2', name: 'Volume 2', estimatedPageCount: 0, exceedsPageLimit: false });
        }

        // Move matching sections
        for (const sec of s.sections) {
            if (groupIds.includes(sec.sourceGroupId)) sec.volumeId = 'vol-2';
        }
        window.__km.renderBookView();
    }, splitGroupIds);

    await page.waitForTimeout(400);
}

/** Exclude sections by sourceGroupId. */
async function applyExclusions(page, excludedGroupIds) {
    await page.evaluate((groupIds) => {
        const s = window.__km.messageBookState;
        if (!s) return;
        for (const sec of s.sections) {
            if (groupIds.includes(sec.sourceGroupId)) sec.included = false;
        }
        window.__km.renderBookView();
    }, excludedGroupIds);

    await page.waitForTimeout(400);
}

// ── Screenshot utilities ──────────────────────────────────────────────────────

/** Expand the canvas to its full scroll height, screenshot it, then restore. */
async function screenshotFullCanvas(page, outPath) {
    await page.evaluate(() => {
        const c = document.getElementById('bookCanvas');
        c.dataset._savedMaxHeight = c.style.maxHeight || '';
        c.dataset._savedOverflow  = c.style.overflowY  || '';
        c.dataset._savedHeight    = c.style.height     || '';
        c.style.maxHeight = 'none';
        c.style.overflowY = 'visible';
        c.style.height    = c.scrollHeight + 'px';
    });
    await page.locator('#bookCanvas').screenshot({ path: outPath });
    await page.evaluate(() => {
        const c = document.getElementById('bookCanvas');
        c.style.maxHeight = c.dataset._savedMaxHeight;
        c.style.overflowY = c.dataset._savedOverflow;
        c.style.height    = c.dataset._savedHeight;
    });
}

/**
 * Screenshot each .book-page element individually. Returns array of file paths written.
 *
 * Capture strategy:
 *   1. Add body.km-capture-mode before any captures. This CSS class (defined in index.html)
 *      drops .book-header to position:static, preventing it from painting over page crops.
 *   2. For each page: scroll it into view, wait for layout to settle, then take an
 *      element-based screenshot. Element screenshots clip to the element's bounding box —
 *      clean and isolated with no sticky chrome interference.
 *   3. Remove body.km-capture-mode after all captures to restore normal sticky behavior.
 */
async function screenshotIndividualPages(page, outDir) {
    // Enter capture mode — neutralizes sticky book-header overlay for clean element crops
    await page.evaluate(() => document.body.classList.add('km-capture-mode'));
    await page.waitForTimeout(80); // let position:static reflow settle

    const pageEls = page.locator('#bookCanvas .book-page');
    const count   = await pageEls.count();
    const written = [];

    for (let i = 0; i < count; i++) {
        const el      = pageEls.nth(i);
        const outPath = path.join(outDir, `page-${String(i + 1).padStart(2, '0')}.png`);

        // Scroll into view then wait for any scroll animation to finish
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(80);

        await el.screenshot({ path: outPath });
        written.push(path.basename(outPath));
    }

    // Exit capture mode — restore sticky header for supplemental UI captures
    await page.evaluate(() => document.body.classList.remove('km-capture-mode'));
    await page.waitForTimeout(80);

    return written;
}

/** Screenshot the controls bar. */
async function screenshotControlsBar(page, outPath) {
    const el = page.locator('#bookControlsBar');
    if (await el.count() > 0) await el.screenshot({ path: outPath });
}

/** Screenshot the sections bar. */
async function screenshotSectionsBar(page, outPath) {
    const el = page.locator('#bookSectionsBar');
    if (await el.count() > 0) await el.screenshot({ path: outPath });
}

// ── Metadata extraction ───────────────────────────────────────────────────────

async function extractRenderSpec(page) {
    return page.evaluate(() => {
        const s  = window.__km.messageBookState;
        if (!s) return null;
        const cn    = window.__km.getContactName();
        const units = window.__km.generateCompositionUnits(s, cn);
        const pages = window.__km.paginateUnits(units);
        window.__km.enrichPageMetadata(pages, {
            volumeId:          s.activeVolumeId,
            hasTimestamps:     s.body.timestampMode  === 'on',
            pageNumberVisible: s.body.pageNumberMode === 'on',
        });
        const spec = window.__km.captureBookRenderSpec(s, pages, s.activeVolumeId, cn);
        // Also return raw page metadata separately for convenience
        return { spec, pageMetadata: spec.pages };
    });
}

async function extractCurrentSettings(page, scenario) {
    return page.evaluate((scenarioLabel) => {
        const s = window.__km.messageBookState;
        if (!s) return null;
        return {
            scenario:        scenarioLabel,
            capturedAt:      new Date().toISOString(),
            browser:         navigator.userAgent,
            zoomLevel:       '100%',
            darkMode:        window.matchMedia('(prefers-color-scheme: dark)').matches,
            bookSettings: {
                title:            s.opening.title,
                dedicationEnabled: s.opening.dedicationEnabled,
                dedicationText:   s.opening.dedicationText ? s.opening.dedicationText.slice(0, 60) : null,
                timestampMode:    s.body.timestampMode,
                pageNumberMode:   s.body.pageNumberMode,
                dividerMode:      s.body.dividerMode,
                volumeCount:      s.volumes.length,
                activeVolumeId:   s.activeVolumeId,
            },
            sectionSummary: [...s.sections]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map(sec => ({
                    id:           sec.id,
                    customTitle:  sec.customTitle || null,
                    customName:   sec.customName  || null,
                    volumeId:     sec.volumeId,
                    included:     sec.included,
                    featured:     sec.featured,
                    messageCount: sec.messages?.length ?? 0,
                })),
            estimatedPageCount: s.estimatedPageCount,
        };
    }, scenario.label);
}

// ── Output utilities ──────────────────────────────────────────────────────────

async function ensureDir(dir) {
    await fsp.mkdir(dir, { recursive: true });
}

async function writeJSON(filePath, data) {
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function writeText(filePath, text) {
    await fsp.writeFile(filePath, text, 'utf8');
}

// ── Scenario runner ───────────────────────────────────────────────────────────

async function runScenario(page, scenario, scenarioDir) {
    console.log(`\n  ▸ ${scenario.label}`);
    await ensureDir(scenarioDir);

    // Seed data and open book view
    await seedAndOpenBook(page, scenario);

    const stepResults = [];

    for (const step of scenario.captureSteps) {
        const stepDir = scenario.captureSteps.length > 1
            ? path.join(scenarioDir, `step-${step.label}`)
            : scenarioDir;
        await ensureDir(stepDir);

        console.log(`    step: ${step.label} — ${step.description}`);

        // Fresh state for each step (re-seed and re-open)
        if (scenario.captureSteps.indexOf(step) > 0) {
            await seedAndOpenBook(page, scenario);
        }

        // Apply base settings + per-step overrides
        await applyBookSettings(
            page,
            scenario.bookSettings,
            scenario.sectionConfig,
            step.overrides ?? {}
        );

        // Apply volume split if requested for this step
        if (step.volumeSplit && step.splitGroupIds?.length) {
            await applyVolumeSplit(page, step.splitGroupIds);
        }

        // Apply exclusions if requested
        if (step.excludedGroupIds?.length) {
            await applyExclusions(page, step.excludedGroupIds);
        }

        await page.waitForTimeout(300);

        // ── Capture screenshots ───────────────────────────────────────────────
        const pageFiles = await screenshotIndividualPages(page, stepDir);
        console.log(`      ${pageFiles.length} pages captured`);

        await screenshotFullCanvas(page, path.join(stepDir, 'full-canvas-scroll.png'));

        await screenshotControlsBar(page, path.join(stepDir, 'controls-ui.png'));
        await screenshotSectionsBar(page, path.join(stepDir, 'sections-ui.png'));

        // For multi-volume scenarios, also capture Volume 2 canvas
        if (step.volumeSplit) {
            await page.evaluate(() => {
                const s = window.__km.messageBookState;
                s.activeVolumeId = 'vol-2';
                window.__km.renderBookView();
            });
            await page.waitForTimeout(400);

            const vol2Dir = path.join(stepDir, 'volume-2');
            await ensureDir(vol2Dir);
            await screenshotIndividualPages(page, vol2Dir);
            await screenshotFullCanvas(page, path.join(vol2Dir, 'full-canvas-scroll.png'));
            await screenshotControlsBar(page, path.join(vol2Dir, 'controls-ui.png'));

            // Restore Volume 1
            await page.evaluate(() => {
                const s = window.__km.messageBookState;
                s.activeVolumeId = 'vol-1';
                window.__km.renderBookView();
            });
            await page.waitForTimeout(300);
        }

        // ── Extract metadata ─────────────────────────────────────────────────
        const { spec, pageMetadata } = await extractRenderSpec(page) ?? {};
        const settingsSheet = await extractCurrentSettings(page, scenario);

        if (spec)          await writeJSON(path.join(stepDir, 'book-render-spec.json'), spec);
        if (pageMetadata)  await writeJSON(path.join(stepDir, 'page-metadata.json'),   pageMetadata);
        if (settingsSheet) await writeJSON(path.join(stepDir, 'settings-sheet.json'),  settingsSheet);

        await writeJSON(
            path.join(stepDir, 'rough-area-flags.json'),
            { flags: ROUGH_AREA_FLAGS, note: 'Do not interpret current browser styling as final print design.' }
        );

        stepResults.push({
            label:     step.label,
            folder:    path.basename(stepDir),
            pageCount: pageFiles.length,
            files:     [
                ...pageFiles,
                'full-canvas-scroll.png',
                'controls-ui.png',
                'sections-ui.png',
                'book-render-spec.json',
                'page-metadata.json',
                'settings-sheet.json',
                'rough-area-flags.json',
            ],
        });
    }

    return { id: scenario.id, label: scenario.label, steps: stepResults, status: 'success' };
}

// ── Packet README ─────────────────────────────────────────────────────────────

function buildReadme(manifest) {
    const dt = new Date(manifest.capturedAt).toDateString();
    const lines = [
        '# Message Book — Preview Handoff Package V1',
        '',
        `Captured: ${dt}  |  Mode: ${manifest.mode}  |  Scenarios: ${manifest.scenarios.length}`,
        '',
        '## Purpose',
        '',
        'This package provides structured captures of the current Message Book engine behavior',
        'for design reconstruction. It captures **compositional and structural truth** — not',
        'final visual styling. All typography, color, spacing, and bubble treatment in these',
        'screenshots are placeholder CSS. Do not use them as design specifications.',
        '',
        '## Scenarios',
        '',
        ...manifest.scenarios.map(s => [
            `### ${s.label}`,
            `Folder: \`${s.id}/\`  |  Status: ${s.status}`,
            '',
            s.steps.map(st => `- **${st.label}**: ${st.pageCount} pages, ${st.files.length} files`).join('\n'),
            '',
        ].join('\n')),
        '## Per-scenario files',
        '',
        '| File | Contents |',
        '|---|---|',
        '| `page-NN.png` | Individual .book-page element screenshots |',
        '| `full-canvas-scroll.png` | Full canvas at scroll height |',
        '| `controls-ui.png` | Controls bar (volume tabs, settings, inputs) |',
        '| `sections-ui.png` | Sections management bar |',
        '| `book-render-spec.json` | BookRenderSpec snapshot — editorial state, page metadata, production deps |',
        '| `page-metadata.json` | Per-page production metadata array |',
        '| `settings-sheet.json` | Filled settings sheet for this capture |',
        '| `rough-area-flags.json` | Known rough areas — do not interpret as final styling |',
        '',
        '## Known rough areas',
        '',
        ...ROUGH_AREA_FLAGS.map(f => `- ${f}`),
        '',
        '## What is structurally real',
        '',
        '- Pagination is real — page breaks reflect actual line-budget rules',
        '- Continuation markers are real — they fire on pages 2, 3, 4+ of multi-page sections',
        '- Orphan guard is real — section header + first content always appear on the same page',
        '- Featured sections always start on a fresh page',
        '- Dividers are bound to section headers — they cannot strand without their section',
        '- Page count is real paginator output — not an estimate',
        '- BookRenderSpec is a genuine snapshot of the render state at capture time',
        '',
        '---',
        '_Generated by scripts/capture-message-book-packet.mjs_',
        '',
    ];
    return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  Message Book — Preview Handoff Capture    ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // ── chat.db mode check ───────────────────────────────────────────────────
    if (chatDbPath) {
        console.warn(
            '⚠  --chat-db flag detected but chat.db import mode is not supported in this harness pass.\n' +
            '   Seeded mode will be used for all canonical scenarios.\n' +
            '   See scripts/capture-message-book-packet.mjs for implementation notes.\n'
        );
    }

    // ── Determine which scenarios to run ─────────────────────────────────────
    const toRun = scenarioFilter
        ? Object.entries(ALL_SCENARIOS).filter(([k]) => scenarioFilter.includes(k))
        : Object.entries(ALL_SCENARIOS);

    if (toRun.length === 0) {
        console.error('No scenarios matched. Available: a, b, c, d');
        process.exit(1);
    }

    console.log(`Mode:      seeded (deterministic)`);
    console.log(`Scenarios: ${toRun.map(([k]) => k).join(', ')}`);
    console.log(`Output:    ${ARTIFACTS}\n`);

    // ── Clean prior artifacts if requested ───────────────────────────────────
    if (wantClean && fs.existsSync(ARTIFACTS)) {
        console.log('Cleaning prior artifacts...');
        await fsp.rm(ARTIFACTS, { recursive: true, force: true });
    }
    await ensureDir(ARTIFACTS);

    // ── Start static server ──────────────────────────────────────────────────
    console.log('Starting local server...');
    const { server, url } = await startServer(7331);
    console.log(`Serving at ${url}\n`);

    // ── Launch browser ───────────────────────────────────────────────────────
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport:        { width: 1440, height: 900 },
        deviceScaleFactor: 2,   // retina-quality screenshots
        colorScheme:     'light',
    });
    const page = await context.newPage();

    // Suppress console noise from the app
    page.on('console', msg => {
        if (msg.type() === 'error') console.error('  [app error]', msg.text());
    });

    // ── Navigate and verify harness exposure ─────────────────────────────────
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    try {
        await waitForKm(page);
    } catch {
        console.error('✗  window.__km not available. Check that the harness exposure block is present in index.html.');
        await browser.close();
        server.close();
        process.exit(1);
    }
    console.log('App loaded. window.__km verified.\n');

    // ── Run scenarios ─────────────────────────────────────────────────────────
    const capturedAt = new Date().toISOString();
    const scenarioResults = [];
    const failures = [];

    for (const [key, buildFn] of toRun) {
        const scenario    = buildFn();
        const scenarioDir = path.join(ARTIFACTS, scenario.id);

        try {
            const result = await runScenario(page, scenario, scenarioDir);
            scenarioResults.push(result);
            const totalPages = result.steps.reduce((s, st) => s + st.pageCount, 0);
            console.log(`  ✓ ${scenario.label} (${totalPages} pages across ${result.steps.length} steps)`);
        } catch (err) {
            console.error(`  ✗ ${scenario.label}: ${err.message}`);
            failures.push({ id: scenario.id, label: scenario.label, error: err.message });
            scenarioResults.push({ id: scenario.id, label: scenario.label, status: 'failed', error: err.message, steps: [] });
        }
    }

    // ── Write packet-level files ──────────────────────────────────────────────
    const manifest = {
        version:      '1',
        capturedAt,
        mode:         'seeded',
        chatDbMode:   'not-supported',
        paginationVersion: await page.evaluate(() => window.__km?.BOOK_PAGINATION_VERSION ?? 'unknown'),
        scenarios:    scenarioResults,
    };

    await writeJSON(path.join(ARTIFACTS, 'manifest.json'), manifest);
    await writeText(path.join(ARTIFACTS, 'README.md'), buildReadme(manifest));

    // ── Teardown ──────────────────────────────────────────────────────────────
    await browser.close();
    server.close();

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────────');
    console.log(`Packet written to:\n  ${ARTIFACTS}`);
    console.log(`\nScenarios captured: ${scenarioResults.filter(s => s.status !== 'failed').length} / ${toRun.length}`);
    if (failures.length) {
        console.log(`\nFailures (${failures.length}):`);
        for (const f of failures) console.log(`  ✗ ${f.label}: ${f.error}`);
    }
    console.log(`\nMode: seeded (deterministic)`);
    if (chatDbPath) console.log('chat.db mode: not supported in this pass');
    console.log('────────────────────────────────────────────\n');

    if (failures.length) process.exit(1);
}

main().catch(err => {
    console.error('\nFatal error:', err);
    process.exit(1);
});

/*
 * ── CHAT.DB MODE — NOT SUPPORTED IN THIS PASS ────────────────────────────────
 *
 * Why not supported:
 *   Supporting chat.db import would require either:
 *   (a) Triggering the app's own file import flow (fragile — depends on browser
 *       file-picker interaction and the app's internal sqlite parsing pipeline), or
 *   (b) Parsing the chat.db independently in this script (requires the SQLite schema
 *       and the same message normalization logic the app uses — non-trivial to replicate).
 *
 * What would be needed to implement it cleanly:
 *   1. Expose the app's internal parsed message array (chatMessagesData) via window.__km
 *   2. Expose the contact name / group-build logic so the harness can call it directly
 *   3. Either: use Playwright to simulate a file upload to the app's file input
 *      Or: parse the db externally with better-sqlite3 and reconstruct keepsakeGroups format
 *
 * Recommended next step for chat.db support:
 *   Add a window.__km.loadFromParsedMessages(messages, contactName) helper to index.html
 *   that accepts pre-parsed message data and feeds it into the app's keepsake flow.
 *   Then the harness can use better-sqlite3 to read the db and call that helper.
 *
 * This is left unsupported rather than shipping a fragile half-solution.
 */
