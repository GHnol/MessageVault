/**
 * KeepMees — E2E Regression Harness
 *
 * Automated browser regression tests for core KeepMees flows.
 * Uses Playwright headless Chromium and a proper static file server.
 *
 * Usage (from repo root):
 *   node scripts/e2e-regression-harness.mjs
 *   node scripts/e2e-regression-harness.mjs --headed
 *   node scripts/e2e-regression-harness.mjs --headed --slow
 *
 * Or via npm (from scripts/):
 *   npm run e2e
 *   npm run e2e:headed
 *
 * Exit code: 0 = all tests passed, 1 = one or more tests failed.
 * Failure screenshots: artifacts/e2e-failures/
 */

import http        from 'node:http';
import fs          from 'node:fs';
import fsp         from 'node:fs/promises';
import path        from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { TEST_MESSAGES, TEST_MESSAGE_COUNT } from './e2e-test-data.mjs';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __dir      = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dir, '..');
const FAILURES   = path.join(REPO_ROOT, 'artifacts', 'e2e-failures');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const HEADED = args.includes('--headed') || args.includes('--debug');
const SLOW   = args.includes('--slow') ? 600 : 0;
const PORT   = 7332; // distinct from capture harness port 7331

// ── MIME types ────────────────────────────────────────────────────────────────

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.mjs':  'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.db':   'application/octet-stream',
};

// ── Static file server ────────────────────────────────────────────────────────

function startServer(port) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const rawPath  = req.url.split('?')[0];
            const urlPath  = rawPath === '/' ? '/index.html' : rawPath;
            const filePath = path.normalize(path.join(REPO_ROOT, urlPath));

            // Guard against path traversal outside repo root
            if (!filePath.startsWith(REPO_ROOT + path.sep) && filePath !== path.join(REPO_ROOT, 'index.html')) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden');
                return;
            }

            const ext         = path.extname(filePath);
            const contentType = MIME[ext] || 'application/octet-stream';

            try {
                const content = fs.readFileSync(filePath);
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            } catch {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found: ' + urlPath);
            }
        });
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${port}` }));
    });
}

// ── Harness helpers ───────────────────────────────────────────────────────────

async function waitForKm(page) {
    await page.waitForFunction(() => typeof window.__km !== 'undefined', { timeout: 10_000 });
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
}

async function assertVisible(page, selector, label) {
    const visible = await page.locator(selector).isVisible();
    assert(visible, `${label || selector} should be visible`);
}

// ── Test runner ───────────────────────────────────────────────────────────────

class Harness {
    constructor(page, failuresDir) {
        this.page        = page;
        this.failuresDir = failuresDir;
        this.results     = [];
    }

    async run(name, fn) {
        const start = Date.now();
        try {
            await fn(this.page);
            this.results.push({ name, passed: true, ms: Date.now() - start });
            console.log(`  ✓  ${name}`);
        } catch (err) {
            this.results.push({ name, passed: false, ms: Date.now() - start, error: err.message });
            console.error(`  ✗  ${name}`);
            console.error(`     ${err.message}`);
            await this._screenshot(name);
        }
    }

    async _screenshot(name) {
        try {
            await fsp.mkdir(this.failuresDir, { recursive: true });
            const safe = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60);
            const dest = path.join(this.failuresDir, `${safe}-${Date.now()}.png`);
            await this.page.screenshot({ path: dest, fullPage: true });
            console.log(`     Screenshot saved: ${path.relative(REPO_ROOT, dest)}`);
        } catch (_) { /* screenshots are best-effort */ }
    }

    get passed()  { return this.results.filter(r => r.passed).length; }
    get failed()  { return this.results.filter(r => !r.passed).length; }
    get total()   { return this.results.length; }

    printSummary() {
        const W = 52;
        console.log('\n' + '─'.repeat(W));
        for (const r of this.results) {
            const icon = r.passed ? '✓' : '✗';
            const ms   = `${r.ms}ms`;
            const name = r.name.slice(0, 42).padEnd(43, ' ');
            console.log(`  ${icon}  ${name}${ms}`);
            if (r.error) console.log(`       ↳ ${r.error.slice(0, 120)}`);
        }
        console.log('─'.repeat(W));
        console.log(`  ${this.passed} passed  /  ${this.failed} failed  /  ${this.total} total`);
        console.log('─'.repeat(W) + '\n');
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║  KeepMees — E2E Regression Harness            ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    // ── Server ────────────────────────────────────────────────────────────────
    const { server, url } = await startServer(PORT);
    console.log(`  Server : ${url}`);
    console.log(`  Mode   : ${HEADED ? 'headed (debug)' : 'headless'}\n`);

    // ── Browser ───────────────────────────────────────────────────────────────
    const browser = await chromium.launch({ headless: !HEADED, slowMo: SLOW });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page    = await context.newPage();

    const fatalErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') fatalErrors.push(msg.text());
    });

    const harness = new Harness(page, FAILURES);

    // savedSnapshot holds the JSON string produced in Phase 7; used in Phase 8.
    let savedSnapshot = null;

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1 — App load
    // ─────────────────────────────────────────────────────────────────────────
    console.log('── PHASE 1 — App load ──\n');

    await harness.run('navigate to app and wait for window.__km', async page => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await waitForKm(page);
    });

    await harness.run('landing page visible', async page => {
        await assertVisible(page, '#landing', 'Landing page');
    });

    await harness.run('no fatal console errors on load', async page => {
        await page.waitForTimeout(400); // let async script errors surface
        assert(fatalErrors.length === 0,
            `${fatalErrors.length} console error(s):\n  ${fatalErrors.slice(0, 3).join('\n  ')}`);
    });

    await harness.run('KMEngine modules loaded (src/ scripts served correctly)', async page => {
        const loaded = await page.evaluate(() => ({
            base: !!window.KMEngine,
            pp:   !!(window.KMEngine && window.KMEngine.ProjectPersistence),
            psr:  !!(window.KMEngine && window.KMEngine.ProjectSessionRestore),
        }));
        assert(loaded.base, 'window.KMEngine not defined — src/ scripts may not have loaded with correct MIME type');
        assert(loaded.pp,   'KMEngine.ProjectPersistence missing');
        assert(loaded.psr,  'KMEngine.ProjectSessionRestore missing');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2 — Seed deterministic messages
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 2 — Seed messages ──\n');

    await harness.run('seedChatMessages populates chatMessagesData', async page => {
        await page.evaluate(msgs => window.__km.seedChatMessages(msgs), TEST_MESSAGES);
        const count = await page.evaluate(() => (window.chatMessagesData || []).length);
        assert(count === TEST_MESSAGE_COUNT, `Expected ${TEST_MESSAGE_COUNT} messages, got ${count}`);
    });

    await harness.run('chat view visible after seed', async page => {
        await assertVisible(page, '#chatView', 'Chat view');
    });

    await harness.run('message rows rendered in DOM', async page => {
        const rows = await page.locator('.message-row.selectable').count();
        assert(rows === TEST_MESSAGE_COUNT, `Expected ${TEST_MESSAGE_COUNT} DOM rows, got ${rows}`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3 — Message selection
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 3 — Selection ──\n');

    await harness.run('select all messages via Select All button', async page => {
        await page.click('#selectAllBtn');
        const count = await page.evaluate(() => window.__km.getSelectedCount());
        assert(count === TEST_MESSAGE_COUNT, `Expected ${TEST_MESSAGE_COUNT} selected, got ${count}`);
    });

    await harness.run('selection bar becomes active', async page => {
        const active = await page.evaluate(() =>
            document.getElementById('selectionBar').classList.contains('active'));
        assert(active, 'Selection bar should have class "active"');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 4 — Review Your Moments
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 4 — Review Your Moments ──\n');

    await harness.run('Continue button navigates to Review view', async page => {
        await page.click('#selectionContinue');
        await assertVisible(page, '#reviewView', 'Review view');
    });

    await harness.run('review body has rendered content', async page => {
        const html = await page.locator('#reviewBody').innerHTML();
        assert(html.trim().length > 0, 'Review body is empty');
    });

    await harness.run('keepsake groups built from selection', async page => {
        const groups = await page.evaluate(() => window.__km.getKeepsakeGroups());
        assert(groups.length > 0,          'No keepsake groups after Continue');
        assert(groups[0].messages.length > 0, 'First group has no messages');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 5 — Your Keepsakes
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 5 — Your Keepsakes ──\n');

    await harness.run('showKeepsakesView() renders Keepsakes view', async page => {
        await page.evaluate(() => window.__km.showKeepsakesView());
        await assertVisible(page, '#keepsakesView', 'Keepsakes view');
    });

    await harness.run('keepsakes body has rendered content', async page => {
        const html = await page.locator('#ksBody').innerHTML();
        assert(html.trim().length > 0, 'Keepsakes body is empty');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 6 — Message Book
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 6 — Message Book ──\n');

    await harness.run('Message Book button opens book view with pages', async page => {
        await page.click('#ksBookBtn');
        await assertVisible(page, '#bookView', 'Book view');
        await page.waitForSelector('#bookCanvas .book-page', { timeout: 5_000 });
        const pageCount = await page.locator('#bookCanvas .book-page').count();
        assert(pageCount > 0, 'Book canvas has no pages');
    });

    await harness.run('estimated page count is positive', async page => {
        const count = await page.evaluate(() =>
            window.__km.messageBookState ? window.__km.messageBookState.estimatedPageCount : 0);
        assert(count > 0, `estimatedPageCount should be > 0, got ${count}`);
    });

    await harness.run('safe book setting toggle (timestampMode) round-trips correctly', async page => {
        const before = await page.evaluate(() =>
            window.__km.messageBookState && window.__km.messageBookState.body.timestampMode);
        assert(before !== undefined, 'messageBookState.body.timestampMode not accessible');
        const toggled = before === 'on' ? 'off' : 'on';
        await page.evaluate(mode => {
            const s = window.__km.messageBookState;
            s.body.timestampMode = mode;
            window.__km.renderBookView();
        }, toggled);
        await page.waitForTimeout(300);
        // Restore original
        await page.evaluate(mode => {
            const s = window.__km.messageBookState;
            s.body.timestampMode = mode;
            window.__km.renderBookView();
        }, before);
        await page.waitForTimeout(200);
        const restored = await page.evaluate(() =>
            window.__km.messageBookState && window.__km.messageBookState.body.timestampMode);
        assert(restored === before, `timestampMode should be restored to "${before}", got "${restored}"`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 7 — Save project (Package 3A)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 7 — Save project ──\n');

    await harness.run('captureProjectSnapshot returns valid JSON envelope', async page => {
        const json = await page.evaluate(() => window.__km.captureProjectSnapshot());
        assert(json !== null, 'captureProjectSnapshot returned null (KMEngine.ProjectPersistence may not be loaded)');
        const obj = JSON.parse(json);
        assert(obj.keepmeesVersion === '1', `keepmeesVersion should be "1", got "${obj.keepmeesVersion}"`);
        assert(Array.isArray(obj.projectSession?.memories), 'projectSession.memories missing');
        assert(obj.projectSession.memories.length === TEST_MESSAGE_COUNT,
            `Expected ${TEST_MESSAGE_COUNT} memories in snapshot, got ${obj.projectSession.memories.length}`);
        savedSnapshot = json;
    });

    await harness.run('snapshot passes ProjectPersistence.validate()', async page => {
        assert(savedSnapshot !== null, 'No snapshot from previous test');
        const valid = await page.evaluate(json => {
            const PP = window.KMEngine && window.KMEngine.ProjectPersistence;
            if (!PP) return false;
            return PP.validate(JSON.parse(json)).valid;
        }, savedSnapshot);
        assert(valid, 'Snapshot did not pass ProjectPersistence.validate()');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 8 — Reload and restore
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 8 — Reload and restore ──\n');

    await harness.run('reload app returns to clean landing state', async page => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        await assertVisible(page, '#landing', 'Landing after reload');
    });

    await harness.run('load saved project restores chat view', async page => {
        assert(savedSnapshot !== null, 'No snapshot from Phase 7 — save test may have failed');
        await page.evaluate(async json => {
            const file = new File([json], 'test.keepmees.json', { type: 'application/json' });
            await window.__km.handleProjectFileLoad(file);
        }, savedSnapshot);
        await assertVisible(page, '#chatView', 'Chat view after project restore');
    });

    await harness.run('restored messages match original count', async page => {
        const dataCount = await page.evaluate(() => (window.chatMessagesData || []).length);
        assert(dataCount === TEST_MESSAGE_COUNT,
            `chatMessagesData has ${dataCount} messages after restore, expected ${TEST_MESSAGE_COUNT}`);
        const domCount = await page.locator('.message-row.selectable').count();
        assert(domCount === TEST_MESSAGE_COUNT,
            `DOM has ${domCount} message rows after restore, expected ${TEST_MESSAGE_COUNT}`);
    });

    await harness.run('restored keepsake groups match original', async page => {
        const groups = await page.evaluate(() => window.__km.getKeepsakeGroups());
        assert(groups.length > 0, 'No keepsake groups after restore');
        assert(groups[0].messages.length > 0, 'Restored group has no messages');
    });

    await harness.run('Your Keepsakes opens correctly after restore', async page => {
        await page.evaluate(() => window.__km.showKeepsakesView());
        await assertVisible(page, '#keepsakesView', 'Keepsakes view after restore');
        const html = await page.locator('#ksBody').innerHTML();
        assert(html.trim().length > 0, 'Keepsakes body is empty after restore');
    });

    await harness.run('Message Book opens correctly after restore', async page => {
        await page.evaluate(() => window.__km.showBookView());
        await assertVisible(page, '#bookView', 'Book view after restore');
        await page.waitForSelector('#bookCanvas .book-page', { timeout: 5_000 });
        const pageCount = await page.locator('#bookCanvas .book-page').count();
        assert(pageCount > 0, 'Book has no pages after restore');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 9 — Invalid project file handling
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 9 — Invalid file handling ──\n');

    await harness.run('reload to clean state for invalid-file tests', async page => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
    });

    await harness.run('invalid JSON: no crash, app remains functional', async page => {
        await page.evaluate(async () => {
            const file = new File(['{not valid json {{'], 'bad.keepmees.json', { type: 'application/json' });
            await window.__km.handleProjectFileLoad(file);
        });
        const alive = await page.evaluate(() => typeof window.__km === 'object');
        assert(alive, 'window.__km inaccessible after invalid JSON — app may have crashed');
    });

    await harness.run('wrong schema version: no crash, app remains functional', async page => {
        const badVer = JSON.stringify({
            keepmeesVersion: '999',
            projectSession: { id: 'x', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
        });
        await page.evaluate(async json => {
            const file = new File([json], 'wrong-ver.keepmees.json', { type: 'application/json' });
            await window.__km.handleProjectFileLoad(file);
        }, badVer);
        const alive = await page.evaluate(() => typeof window.__km === 'object');
        assert(alive, 'window.__km inaccessible after wrong-version load — app may have crashed');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 10 — Capture harness smoke compatibility
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 10 — Capture harness smoke ──\n');

    await harness.run('capture harness bridge functions present on fresh load', async page => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        const present = await page.evaluate(() => !!(
            typeof window.__km.showBookView          === 'function' &&
            typeof window.__km.renderBookView        === 'function' &&
            typeof window.__km.generateCompositionUnits === 'function' &&
            typeof window.__km.paginateUnits         === 'function' &&
            typeof window.__km.captureBookRenderSpec === 'function'
        ));
        assert(present, 'One or more capture harness bridge functions are missing from window.__km');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Teardown
    // ─────────────────────────────────────────────────────────────────────────
    await browser.close();
    server.close();

    harness.printSummary();

    if (harness.failed > 0) {
        if (harness.failed > 0) {
            console.log(`${harness.failed} test(s) failed.`);
            if (fs.existsSync(FAILURES)) console.log(`Failure screenshots: artifacts/e2e-failures/\n`);
        }
        process.exit(1);
    }

    console.log('All tests passed.\n');
}

main().catch(err => {
    console.error('\nFatal harness error:', err);
    process.exit(1);
});
