/**
 * KeepMees — Visual Regression Baseline Harness (Package 3D)
 *
 * Captures per-page screenshots of Message Book rendering for Scenario A and
 * compares them against committed baseline images to detect visual regressions.
 *
 * Usage (from repo root):
 *   node scripts/visual-regression-harness.mjs                    # --check (default)
 *   node scripts/visual-regression-harness.mjs --update-baselines # save new baselines
 *   node scripts/visual-regression-harness.mjs --simulate-regression # verify failure detection
 *   node scripts/visual-regression-harness.mjs --headed            # show browser
 *   node scripts/visual-regression-harness.mjs --check --threshold 0.2
 *
 * Or via npm (from scripts/):
 *   npm run vr:baseline
 *   npm run vr:check
 *
 * Exit code: 0 = all pages pass, 1 = any failure.
 *
 * Baseline path:  scripts/visual-regression-baselines/scenario-a/
 * Output path:    visual-regression-output/scenario-a/  (gitignored)
 */

import http        from 'node:http';
import fs          from 'node:fs';
import fsp         from 'node:fs/promises';
import path        from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG }     from 'pngjs';
import pixelmatch  from 'pixelmatch';
import { buildScenarioA } from './message-book-scenarios.mjs';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __dir      = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dir, '..');
const BASELINES  = path.join(__dir, 'visual-regression-baselines', 'scenario-a');
const OUTPUT     = path.join(REPO_ROOT, 'visual-regression-output', 'scenario-a');
const PORT       = 7333; // distinct from capture (7331) and E2E (7332)

// ── CLI ───────────────────────────────────────────────────────────────────────

const args          = process.argv.slice(2);
const UPDATE_MODE   = args.includes('--update-baselines');
const SIMULATE_MODE = args.includes('--simulate-regression');
const HEADED        = args.includes('--headed');
const CHECK_MODE    = !UPDATE_MODE; // default is check

const thresholdArg  = args.indexOf('--threshold');
const THRESHOLD     = thresholdArg !== -1
    ? parseFloat(args[thresholdArg + 1]) / 100   // convert % to 0-1
    : 0.001;                                       // default 0.1% of pixels

// ── Static server ─────────────────────────────────────────────────────────────

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

function startServer() {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const rawPath  = req.url.split('?')[0];
            const urlPath  = rawPath === '/' ? '/index.html' : rawPath;
            const filePath = path.normalize(path.join(REPO_ROOT, urlPath));
            const ext      = path.extname(filePath).toLowerCase();
            const mime     = MIME[ext] || 'application/octet-stream';

            if (!filePath.startsWith(REPO_ROOT)) {
                res.writeHead(403); res.end(); return;
            }
            if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                res.writeHead(404); res.end(); return;
            }
            res.writeHead(200, { 'Content-Type': mime });
            fs.createReadStream(filePath).pipe(res);
        });
        server.on('error', reject);
        server.listen(PORT, '127.0.0.1', () => {
            // Readiness probe
            const probe = () => new Promise(res => {
                const req = http.get(`http://127.0.0.1:${PORT}/index.html`, r => { r.resume(); res(r.statusCode < 500); });
                req.on('error', () => res(false));
            });
            const wait = async () => {
                for (let i = 0; i < 10; i++) {
                    if (await probe()) return resolve(server);
                    await new Promise(r => setTimeout(r, 100));
                }
                reject(new Error(`Server at :${PORT} did not become ready`));
            };
            wait();
        });
    });
}

// ── Playwright helpers ────────────────────────────────────────────────────────

async function waitForKm(page) {
    await page.waitForFunction(() => typeof window.__km !== 'undefined', { timeout: 10_000 });
}

async function seedAndOpenBook(page, scenario) {
    await page.evaluate(() => {
        window.__km.setKeepsakeGroups([]);
        window.__km.messageBookState = null;
    });
    await page.evaluate((groups) => window.__km.setKeepsakeGroups(groups), scenario.groups);
    await page.evaluate((name) => window.__km.setContactName(name), scenario.contactName);
    await page.evaluate(() => window.__km.showBookView());
    await page.waitForTimeout(600);
}

async function applyBookSettings(page, settings) {
    await page.evaluate((s) => {
        const bk = window.__km.messageBookState;
        if (!bk) return;
        bk.opening.title             = s.title            ?? bk.opening.title;
        bk.opening.dedicationEnabled = s.dedicationEnabled ?? bk.opening.dedicationEnabled;
        bk.opening.dedicationText    = s.dedicationText    ?? bk.opening.dedicationText;
        bk.body.timestampMode  = s.timestampMode  ?? bk.body.timestampMode;
        bk.body.pageNumberMode = s.pageNumberMode ?? bk.body.pageNumberMode;
        bk.body.dividerMode    = s.dividerMode    ?? bk.body.dividerMode;
        window.__km.renderBookView();
    }, settings);
    await page.waitForTimeout(400);
}

/**
 * Capture individual .book-page screenshots.
 * Uses km-capture-mode to suppress the sticky header for clean element crops.
 */
async function capturePages(page, outDir) {
    await fsp.mkdir(outDir, { recursive: true });
    await page.evaluate(() => document.body.classList.add('km-capture-mode'));
    await page.waitForTimeout(80);

    const pageEls = page.locator('#bookCanvas .book-page');
    const count   = await pageEls.count();
    const files   = [];

    for (let i = 0; i < count; i++) {
        const el      = pageEls.nth(i);
        const name    = `page-${String(i + 1).padStart(2, '0')}.png`;
        const outPath = path.join(outDir, name);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(80);
        await el.screenshot({ path: outPath });
        files.push(name);
    }

    await page.evaluate(() => document.body.classList.remove('km-capture-mode'));
    await page.waitForTimeout(80);
    return files;
}

async function getBookPaginationVersion(page) {
    return page.evaluate(() => {
        if (typeof window.BOOK_PAGINATION_VERSION !== 'undefined') return window.BOOK_PAGINATION_VERSION;
        return window.__km?.BOOK_PAGINATION_VERSION ?? null;
    });
}

// ── PNG comparison ────────────────────────────────────────────────────────────

function loadPng(filePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(new PNG())
            .on('parsed', function () { resolve(this); })
            .on('error', reject);
    });
}

async function comparePages(baselineDir, currentDir, diffDir, pageFiles) {
    const results = [];
    let allPass = true;

    for (const name of pageFiles) {
        const baselinePath = path.join(baselineDir, name);
        const currentPath  = path.join(currentDir,  name);

        if (!fs.existsSync(baselinePath)) {
            results.push({ page: name, status: 'ERROR', reason: 'Baseline file missing' });
            allPass = false;
            continue;
        }
        if (!fs.existsSync(currentPath)) {
            results.push({ page: name, status: 'ERROR', reason: 'Current file missing' });
            allPass = false;
            continue;
        }

        const [base, curr] = await Promise.all([loadPng(baselinePath), loadPng(currentPath)]);

        if (base.width !== curr.width || base.height !== curr.height) {
            results.push({
                page: name, status: 'FAIL',
                reason: `Dimension mismatch: baseline ${base.width}×${base.height}, current ${curr.width}×${curr.height}`,
                mismatchPixels: null,
            });
            allPass = false;
            continue;
        }

        await fsp.mkdir(diffDir, { recursive: true });
        const diff = new PNG({ width: base.width, height: base.height });
        const mismatch = pixelmatch(
            base.data, curr.data, diff.data,
            base.width, base.height,
            { threshold: THRESHOLD, includeAA: false }
        );
        const totalPixels    = base.width * base.height;
        const mismatchPct    = (mismatch / totalPixels) * 100;
        const thresholdPct   = THRESHOLD * 100;
        const pass           = mismatch === 0;

        if (!pass) {
            const diffPath = path.join(diffDir, name.replace('.png', '-diff.png'));
            await new Promise((res, rej) => {
                diff.pack().pipe(fs.createWriteStream(diffPath))
                    .on('finish', res).on('error', rej);
            });
            results.push({
                page: name, status: 'FAIL',
                mismatchPixels: mismatch,
                mismatchPct: mismatchPct.toFixed(4),
                thresholdPct: thresholdPct.toFixed(4),
                diffPath: path.relative(REPO_ROOT, diffPath),
            });
            allPass = false;
        } else {
            results.push({ page: name, status: 'PASS', mismatchPixels: 0 });
        }
    }

    return { allPass, results };
}

// ── Manifest ──────────────────────────────────────────────────────────────────

async function writeManifest(dir, scenario, pageFiles, paginationVersion) {
    const manifest = {
        scenario_id:         scenario.id,
        scenario_label:      scenario.label,
        page_count:          pageFiles.length,
        pages:               pageFiles,
        capture_timestamp:   new Date().toISOString(),
        viewport:            { width: 1440, height: 900 },
        threshold_default:   '0.1%',
        book_pagination_version: paginationVersion ?? 'unknown',
        note: 'Baselines are committed snapshots of Scenario A Message Book rendering. Update only with Coordinator authorization.',
    };
    await fsp.writeFile(
        path.join(dir, 'manifest.json'),
        JSON.stringify(manifest, null, 2) + '\n',
        'utf8'
    );
    return manifest;
}

async function loadManifest(dir) {
    const p = path.join(dir, 'manifest.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(await fsp.readFile(p, 'utf8'));
}

// ── Modes ─────────────────────────────────────────────────────────────────────

async function runUpdateBaselines(page) {
    console.log('\n[vr:baseline] Scenario A — capturing baselines…');
    const scenario = buildScenarioA();
    await seedAndOpenBook(page, scenario);
    await applyBookSettings(page, scenario.bookSettings);

    await fsp.mkdir(BASELINES, { recursive: true });
    const files   = await capturePages(page, BASELINES);
    const version = await getBookPaginationVersion(page);
    const manifest = await writeManifest(BASELINES, scenario, files, version);

    console.log(`\n  Scenario:  ${scenario.label}`);
    console.log(`  Pages:     ${files.length}`);
    console.log(`  Version:   BOOK_PAGINATION_VERSION = ${manifest.book_pagination_version}`);
    console.log(`  Baseline:  ${path.relative(REPO_ROOT, BASELINES)}`);
    files.forEach(f => {
        const size = fs.statSync(path.join(BASELINES, f)).size;
        console.log(`    ${f}  (${(size / 1024).toFixed(1)} KB)`);
    });
    console.log(`\n[vr:baseline] Done. Review baselines before committing.`);
    return 0;
}

async function runCheck(page, simulate = false) {
    const label = simulate ? '[vr:check --simulate-regression]' : '[vr:check]';
    console.log(`\n${label} Scenario A — checking against baselines…`);

    const manifest = await loadManifest(BASELINES);
    if (!manifest) {
        console.error(`\nERROR: No manifest found at ${BASELINES}/manifest.json`);
        console.error('Run --update-baselines first.');
        return 1;
    }

    const scenario = buildScenarioA();
    await seedAndOpenBook(page, scenario);
    await applyBookSettings(page, scenario.bookSettings);

    if (simulate) {
        // Inject a visible regression at runtime: force one page to show an error background.
        // Never writes to repo files — operates only in the browser.
        await page.evaluate(() => {
            const pages = document.querySelectorAll('#bookCanvas .book-page');
            if (pages.length > 0) {
                pages[0].style.outline = '8px solid red';
                pages[0].style.background = '#ffe0e0';
            }
        });
        await page.waitForTimeout(100);
        console.log('  [simulate] Applied runtime CSS regression to page 1.');
    }

    const currentDir = path.join(OUTPUT, 'current');
    const diffDir    = path.join(OUTPUT, 'diff');
    await fsp.mkdir(currentDir, { recursive: true });

    const files = await capturePages(page, currentDir);

    console.log(`\n  Baseline page count:  ${manifest.page_count}`);
    console.log(`  Current page count:   ${files.length}`);

    if (files.length !== manifest.page_count) {
        console.error(`\nFAIL: Page count mismatch (baseline=${manifest.page_count}, current=${files.length})`);
        return 1;
    }

    const { allPass, results } = await comparePages(BASELINES, currentDir, diffDir, manifest.pages);

    console.log(`\n  Per-page results:`);
    for (const r of results) {
        if (r.status === 'PASS') {
            console.log(`    PASS  ${r.page}`);
        } else {
            const detail = r.mismatchPixels != null
                ? `${r.mismatchPixels} px (${r.mismatchPct}% > threshold ${r.thresholdPct}%)`
                : r.reason;
            console.log(`    FAIL  ${r.page}  —  ${detail}`);
            if (r.diffPath) console.log(`          diff: ${r.diffPath}`);
        }
    }

    const outcome = allPass ? 'PASS' : 'FAIL';
    console.log(`\n${label} Result: ${outcome}`);
    if (!allPass) {
        console.log(`  Diff images: ${path.relative(REPO_ROOT, diffDir)}/`);
        console.log(`  Current:     ${path.relative(REPO_ROOT, currentDir)}/`);
    }
    return allPass ? 0 : 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const mode = UPDATE_MODE ? 'UPDATE BASELINES'
               : SIMULATE_MODE ? 'CHECK (simulate regression)'
               : 'CHECK';

    console.log(`\n=== Visual Regression Harness — ${mode} ===`);
    console.log(`    Port:      ${PORT}`);
    console.log(`    Viewport:  1440×900`);
    console.log(`    Threshold: ${(THRESHOLD * 100).toFixed(3)}%`);
    console.log(`    Baselines: ${path.relative(REPO_ROOT, BASELINES)}`);
    console.log(`    Output:    ${path.relative(REPO_ROOT, OUTPUT)}`);

    let server;
    let browser;
    let exitCode = 1;

    try {
        server  = await startServer();
        browser = await chromium.launch({ headless: !HEADED });
        const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const page = await ctx.newPage();

        await page.goto(`http://127.0.0.1:${PORT}/index.html`);
        await waitForKm(page);

        if (UPDATE_MODE) {
            exitCode = await runUpdateBaselines(page);
        } else {
            exitCode = await runCheck(page, SIMULATE_MODE);
        }
    } catch (err) {
        console.error(`\nFATAL: ${err.message}`);
        exitCode = 1;
    } finally {
        await browser?.close();
        await new Promise(res => server ? server.close(res) : res());
    }

    process.exit(exitCode);
}

main();
