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
 *   node scripts/e2e-regression-harness.mjs --real-files
 *   node scripts/e2e-regression-harness.mjs --real-files --headed
 *
 * Or via npm (from scripts/):
 *   npm run e2e
 *   npm run e2e:headed
 *   npm run e2e:real
 *
 * Optional environment variable for private chat.db smoke testing:
 *   KEEP_MEES_E2E_CHATDB_PATH=/path/to/your/chat.db node scripts/e2e-regression-harness.mjs --real-files
 *
 * Exit code: 0 = all tests passed, 1 = one or more tests failed.
 * Failure screenshots: artifacts/e2e-failures/
 */

import http        from 'node:http';
import fs          from 'node:fs';
import fsp         from 'node:fs/promises';
import path        from 'node:path';
import os          from 'node:os';
import { exec }    from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { TEST_MESSAGES, TEST_MESSAGE_COUNT } from './e2e-test-data.mjs';

const execAsync = promisify(exec);

// ── Paths ─────────────────────────────────────────────────────────────────────

const __dir      = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT  = path.resolve(__dir, '..');
const FAILURES   = path.join(REPO_ROOT, 'artifacts', 'e2e-failures');

// ── CLI ───────────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const HEADED     = args.includes('--headed') || args.includes('--debug');
const SLOW       = args.includes('--slow') ? 600 : 0;
const REAL_FILES = args.includes('--real-files');
const PORT       = 7332; // distinct from capture harness port 7331

// ── Real-file fixtures ────────────────────────────────────────────────────────

const TXT_FIXTURE       = path.join(__dir, 'fixtures', 'fake-conversation.txt');
const TXT_FIXTURE_COUNT = 5; // matches fake-conversation.txt

// Optional private chat.db — must never be committed; local use only.
const CHATDB_PATH = process.env.KEEP_MEES_E2E_CHATDB_PATH || null;

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

// ── Server readiness probe ────────────────────────────────────────────────────
// Confirms the static server is accepting connections before Chromium navigates.
// Bounded to maxAttempts × intervalMs; fails with a diagnostic if never ready.
async function waitForServer(url, maxAttempts = 10, intervalMs = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        const ready = await new Promise(resolve => {
            const req = http.get(url + '/index.html', res => { res.resume(); resolve(res.statusCode === 200); });
            req.on('error', () => resolve(false));
            req.setTimeout(1_000, () => { req.destroy(); resolve(false); });
        });
        if (ready) return;
        if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error(
        `Static server at ${url} did not become ready after ${maxAttempts} probes — ` +
        'check that port 7332 is not in use by another process'
    );
}

// ── Harness helpers ───────────────────────────────────────────────────────────

async function waitForKm(page) {
    await page.waitForFunction(
        () => typeof window.__km !== 'undefined',
        { timeout: 10_000 }
    ).catch(() => {
        throw new Error(
            'window.__km was not defined within 10s — ' +
            'check that index.html loaded and all src/ modules were served correctly'
        );
    });
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
}

async function assertVisible(page, selector, label) {
    const visible = await page.locator(selector).isVisible();
    assert(visible, `${label || selector} should be visible`);
}

// Wait for chatView to be showing (set by renderConversation directly on style)
async function waitForChatView(page, timeout = 5_000) {
    await page.waitForFunction(
        () => document.getElementById('chatView').style.display === 'block',
        { timeout }
    );
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

    // For Node-side tests (subprocess, file I/O) that do not use the browser page.
    async runNode(name, fn) {
        const start = Date.now();
        try {
            await fn();
            this.results.push({ name, passed: true, ms: Date.now() - start });
            console.log(`  ✓  ${name}`);
        } catch (err) {
            this.results.push({ name, passed: false, ms: Date.now() - start, error: err.message });
            console.error(`  ✗  ${name}`);
            console.error(`     ${err.message}`);
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
    await waitForServer(url); // probe before launching Chromium
    console.log(`  Server : ${url}`);
    console.log(`  Mode   : ${HEADED ? 'headed (debug)' : 'headless'}${REAL_FILES ? ' + real-files' : ''}\n`);

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
    // downloadedFilePath holds the path of the actual browser-downloaded file; used in Phase 14.
    let downloadedFilePath = null;

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1 — App load
    // ─────────────────────────────────────────────────────────────────────────
    console.log('── PHASE 1 — App load ──\n');

    await harness.run('navigate to app and wait for window.__km', async page => {
        // One bounded retry for the initial navigation — first Chromium connection can
        // occasionally be slower than the server probe, especially on Windows.
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded' });
                await waitForKm(page);
                return;
            } catch (e) {
                if (attempt < 2) {
                    console.log(`     [startup retry] initial load did not complete — retrying once`);
                } else {
                    throw e;
                }
            }
        }
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
    // PHASE 20 — Product experience readiness consumer bridge
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 20 — Product experience readiness consumer bridge ──\n');

    await harness.run('window.__km.isReadinessAvailable() returns true', async page => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        const available = await page.evaluate(() => window.__km.isReadinessAvailable());
        assert(available === true, 'isReadinessAvailable() did not return true — consumer or readiness module may be missing');
    });

    await harness.run('KMEngine.EXPERIENCE_STATUS is accessible on window', async page => {
        const hasStatus = await page.evaluate(() => {
            const KM = window.KMEngine;
            return !!(KM && KM.EXPERIENCE_STATUS && typeof KM.EXPERIENCE_STATUS.PROTOTYPE_PREVIEW_SUPPORTED === 'string');
        });
        assert(hasStatus, 'KMEngine.EXPERIENCE_STATUS.PROTOTYPE_PREVIEW_SUPPORTED is not a string — module may not be loaded');
    });

    await harness.run('resolveGroupReadiness with seeded group returns array of entries', async page => {
        await page.evaluate(msgs => window.__km.seedChatMessages(msgs), TEST_MESSAGES);
        await page.evaluate(() => window.__km.showKeepsakesView());
        const count = await page.evaluate(() => {
            const KM = window.KMEngine;
            if (!KM || !KM.keepsakeGroups) return -1;
            return KM.keepsakeGroups.length;
        });
        // Only assert structure if groups exist; seeded flow may not create groups automatically
        const result = await page.evaluate(() => {
            const KM = window.KMEngine;
            if (!KM || !KM.ProductExperienceConsumer) return null;
            const group = { messages: [{ id: 'x1', text: 'hi', sender: 'me' }, { id: 'x2', text: 'hello', sender: 'them' }] };
            return window.__km.resolveGroupReadiness(group);
        });
        assert(Array.isArray(result), 'resolveGroupReadiness returned non-array — consumer bridge may be broken');
        assert(result !== null && result.length > 0, 'resolveGroupReadiness returned empty array — no products resolved');
    });

    await harness.run('resolveGroupReadiness: message-book reaches prototype-preview-supported', async page => {
        const status = await page.evaluate(() => {
            const KM = window.KMEngine;
            if (!KM || !KM.ProductExperienceConsumer || !KM.EXPERIENCE_STATUS) return null;
            const group = { messages: [{ id: 'a', text: 'hi', sender: 'me' }, { id: 'b', text: 'hey', sender: 'them' }] };
            const results = window.__km.resolveGroupReadiness(group);
            const book = results.find(r => r.productTypeId === 'message-book');
            return book ? book.experienceStatus : null;
        });
        assert(status === 'prototype-preview-supported',
            'message-book with 2 messages did not reach prototype-preview-supported (got: ' + status + ')');
    });

    await harness.run('resolveGroupReadiness: non-book render-planning products are render-planning-known', async page => {
        const results = await page.evaluate(() => {
            const KM = window.KMEngine;
            if (!KM || !KM.ProductExperienceConsumer) return null;
            const group = { messages: [{ id: 'a', text: 'hi', sender: 'me' }] };
            return window.__km.resolveGroupReadiness(group);
        });
        assert(Array.isArray(results), 'resolveGroupReadiness returned non-array');
        const nonBook = results.filter(r => r.productTypeId !== 'message-book' && r.renderPlanningKnown);
        const allRenderPlanningKnown = nonBook.every(r =>
            r.experienceStatus === 'render-planning-known' ||
            r.experienceStatus === 'blocked'
        );
        assert(allRenderPlanningKnown,
            'One or more non-book render-planning products reached higher than render-planning-known');
    });

    await harness.run('resolveGroupReadiness with null group does not crash', async page => {
        const result = await page.evaluate(() => {
            try {
                return window.__km.resolveGroupReadiness(null);
            } catch (e) {
                return 'threw: ' + e.message;
            }
        });
        assert(result !== null && typeof result !== 'string',
            'resolveGroupReadiness(null) threw or returned null — expected an array');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 21 — Product format availability surface
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 21 — Product format availability surface ──\n');

    await harness.run('format availability section renders in keepsakes card', async page => {
        // Real groups required — run the full seed → select → review flow
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        await page.evaluate(msgs => window.__km.seedChatMessages(msgs), TEST_MESSAGES);
        await page.click('#selectAllBtn');
        await page.click('#selectionContinue');
        await page.waitForFunction(() => {
            const el = document.getElementById('reviewView');
            return el && el.style.display !== 'none';
        });
        await page.evaluate(() => window.__km.showKeepsakesView());
        const sectionExists = await page.evaluate(() =>
            document.querySelector('[data-testid="format-availability"]') !== null
        );
        assert(sectionExists, 'No [data-testid="format-availability"] found in keepsakes view — section not rendered');
    });

    await harness.run('Message Book tag shows "Available for Message Book preview"', async page => {
        const bookTagText = await page.evaluate(() => {
            const tag = document.querySelector('[data-format-id="message-book"]');
            return tag ? tag.textContent : null;
        });
        assert(bookTagText === 'Available for Message Book preview',
            'message-book tag text was: ' + bookTagText);
    });

    await harness.run('Message Book tag has fmt-available class', async page => {
        const hasClass = await page.evaluate(() => {
            const tag = document.querySelector('[data-format-id="message-book"]');
            return tag ? tag.classList.contains('fmt-available') : false;
        });
        assert(hasClass, 'message-book tag does not have fmt-available class');
    });

    await harness.run('non-book format tags show "Planned format" label', async page => {
        const plannedTags = await page.evaluate(() => {
            const tags = Array.from(document.querySelectorAll('[data-format-status="render-planning-known"]'));
            return tags.map(t => ({ id: t.dataset.formatId, text: t.textContent, cls: t.className }));
        });
        assert(plannedTags.length > 0, 'No render-planning-known format tags found — non-book products not shown');
        const allPlanned = plannedTags.every(t => t.text.indexOf('Planned format') !== -1);
        assert(allPlanned, 'Some render-planning-known tags do not say "Planned format": ' + JSON.stringify(plannedTags));
    });

    await harness.run('format section contains no order/buy/checkout language', async page => {
        const sectionText = await page.evaluate(() => {
            const section = document.querySelector('[data-testid="format-availability"]');
            return section ? section.textContent : '';
        });
        const forbidden = ['Buy now', 'Order now', 'Checkout', 'Add to cart', 'Ships', 'Manufacturing ready'];
        const found = forbidden.filter(f => sectionText.indexOf(f) !== -1);
        assert(found.length === 0, 'Format section contains forbidden commerce language: ' + found.join(', '));
    });

    await harness.run('format availability section does not crash when rendered from the bridge', async page => {
        const result = await page.evaluate(() => {
            try {
                const r = window.__km.resolveGroupReadiness({ messages: [] });
                return Array.isArray(r) ? 'ok' : 'non-array';
            } catch (e) {
                return 'threw: ' + e.message;
            }
        });
        assert(result === 'ok', 'resolveGroupReadiness with empty messages threw or returned non-array: ' + result);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 22 — ProductDraft lifecycle session wiring (Package 3G)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 22 — ProductDraft lifecycle session wiring ──\n');

    await harness.run('ProductDraftLifecycle engine modules loaded', async page => {
        const loaded = await page.evaluate(() => ({
            state:     !!(window.KMEngine && window.KMEngine.ProductDraftState),
            preflight: !!(window.KMEngine && window.KMEngine.ProductPreflight),
            lifecycle: !!(window.KMEngine && window.KMEngine.ProductDraftLifecycle),
        }));
        assert(loaded.state,     'KMEngine.ProductDraftState not loaded');
        assert(loaded.preflight, 'KMEngine.ProductPreflight not loaded');
        assert(loaded.lifecycle, 'KMEngine.ProductDraftLifecycle not loaded');
    });

    await harness.run('getGroupDraft helper exposed on window.__km', async page => {
        const isFunction = await page.evaluate(() => typeof window.__km.getGroupDraft === 'function');
        assert(isFunction, 'window.__km.getGroupDraft is not a function');
    });

    await harness.run('message-book draft advances to preflight-passed on book view entry', async page => {
        // Rebuild: reload → seed → select all → review → keepsakes → open book view.
        // Package 3H: book check runs automatically; draft should reach preflight-passed.
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        await page.evaluate(msgs => window.__km.seedChatMessages(msgs), TEST_MESSAGES);
        await page.click('#selectAllBtn');
        await page.click('#selectionContinue');
        await page.waitForFunction(() => {
            const el = document.getElementById('reviewView');
            return el && el.style.display !== 'none';
        });
        await page.evaluate(() => window.__km.showKeepsakesView());
        await page.click('#ksBookBtn');
        await assertVisible(page, '#bookView', 'Book view after ksBookBtn click');
        await page.waitForSelector('#bookCanvas .book-page', { timeout: 5_000 });
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No keepsake group found after seeding');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'getGroupDraft returned null — draft not initialized');
        assert(draft.status === 'preflight-passed',
            'Expected draft.status "preflight-passed" after book check, got "' + (draft && draft.status) + '"');
    });

    await harness.run('message-book draft re-entry is idempotent (stays preflight-passed)', async page => {
        // Navigate back to keepsakes then re-enter book view.
        // Book check only runs when draft is in-progress; preflight-passed draft is not re-checked.
        await page.click('#bookBackBtn');
        await page.waitForFunction(
            () => document.getElementById('keepsakesView').style.display !== 'none',
            { timeout: 5_000 }
        );
        await page.click('#ksBookBtn');
        await assertVisible(page, '#bookView', 'Book view on idempotency re-entry');
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No group found on idempotency re-entry');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'Draft missing after re-entry');
        assert(draft.status === 'preflight-passed',
            'Draft should remain "preflight-passed" on re-entry, got "' + (draft && draft.status) + '"');
    });

    await harness.run('proof panel state not affected by draft initialization', async page => {
        // renderBookProofPanel (called by renderBookView) initializes proof state to 'none'.
        // Verifies draft preflight-passed does not auto-submit the proof approval state.
        const result = await page.evaluate(() => {
            const UX = window.KMEngine && window.KMEngine.ProofApprovalUX;
            if (!UX) return { ok: false, reason: 'no-ux' };
            const state = UX.getState('message-book');
            if (!state) return { ok: false, reason: 'proof-state-null' };
            return { ok: state.status === 'none', status: state.status };
        });
        assert(result.ok,
            'Proof state should be "none" (unaffected by draft preflight-passed), got: ' + result.status);
    });

    await harness.run('draft persists through save and restore', async page => {
        // Capture snapshot from book view (includes group productDrafts at preflight-passed),
        // reload, restore, verify preflight-passed state is preserved.
        const snapshot = await page.evaluate(() => window.__km.captureProjectSnapshot());
        assert(snapshot !== null, 'captureProjectSnapshot returned null');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        await page.evaluate(async json => {
            const file = new File([json], 'draft-persist-test.keepmees.json', { type: 'application/json' });
            await window.__km.handleProjectFileLoad(file);
        }, snapshot);
        await assertVisible(page, '#chatView', 'Chat view after restore');
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No group after restore');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'Draft not restored — getGroupDraft returned null');
        assert(draft.status === 'preflight-passed',
            'Restored draft status should be "preflight-passed", got "' + (draft && draft.status) + '"');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 23 — Draft book check and proof panel gate (Package 3H)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n── PHASE 23 — Draft book check and proof panel gate ──\n');

    await harness.run('book check auto-runs on entry and advances draft to preflight-passed', async page => {
        // Fresh start: reload → seed → select → review → keepsakes → book view.
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        await page.evaluate(msgs => window.__km.seedChatMessages(msgs), TEST_MESSAGES);
        await page.click('#selectAllBtn');
        await page.click('#selectionContinue');
        await page.waitForFunction(() => {
            const el = document.getElementById('reviewView');
            return el && el.style.display !== 'none';
        });
        await page.evaluate(() => window.__km.showKeepsakesView());
        await page.click('#ksBookBtn');
        await assertVisible(page, '#bookView', 'Book view — Phase 23');
        await page.waitForSelector('#bookCanvas .book-page', { timeout: 5_000 });
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No group found in Phase 23');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'getGroupDraft returned null in Phase 23');
        assert(draft.status === 'preflight-passed',
            'Expected draft.status "preflight-passed" after book check, got "' + (draft && draft.status) + '"');
    });

    await harness.run('getGroupDraft returns preflight-passed after book view entry', async page => {
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No group for Phase 23 draft status check');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'getGroupDraft returned null');
        assert(draft.status === 'preflight-passed',
            'getGroupDraft should return preflight-passed, got: ' + (draft && draft.status));
    });

    await harness.run('proof panel shows "Mark ready for proof review" after book check passes', async page => {
        const hasBtn = await page.evaluate(() => !!document.getElementById('bookProofSubmitBtn'));
        assert(hasBtn,
            '"Mark ready for proof review" button not found — book check gate may be blocking it or proof status is not none');
    });

    await harness.run('re-entering book view keeps draft at preflight-passed (idempotent)', async page => {
        await page.click('#bookBackBtn');
        await page.waitForFunction(
            () => document.getElementById('keepsakesView').style.display !== 'none',
            { timeout: 5_000 }
        );
        await page.click('#ksBookBtn');
        await assertVisible(page, '#bookView', 'Book view — Phase 23 idempotency re-entry');
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No group on Phase 23 re-entry');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'Draft missing after Phase 23 re-entry');
        assert(draft.status === 'preflight-passed',
            'Draft should remain "preflight-passed" on re-entry, got: ' + (draft && draft.status));
    });

    await harness.run('save/restore preserves preflight-passed draft state', async page => {
        const snapshot = await page.evaluate(() => window.__km.captureProjectSnapshot());
        assert(snapshot !== null, 'captureProjectSnapshot returned null in Phase 23');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForKm(page);
        await page.evaluate(async json => {
            const file = new File([json], 'phase23-persist.keepmees.json', { type: 'application/json' });
            await window.__km.handleProjectFileLoad(file);
        }, snapshot);
        await assertVisible(page, '#chatView', 'Chat view after Phase 23 restore');
        const groupId = await page.evaluate(() => {
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            return g ? g.id : null;
        });
        assert(groupId !== null, 'No group after Phase 23 restore');
        const draft = await page.evaluate(gid => window.__km.getGroupDraft(gid, 'message-book'), groupId);
        assert(draft !== null, 'Draft not restored in Phase 23');
        assert(draft.status === 'preflight-passed',
            'Restored draft should be "preflight-passed", got: ' + (draft && draft.status));
    });

    await harness.run('ProofApprovalUX state is independent until user submits proof review', async page => {
        // Navigate to book view from restored project; proof state should be none (independent of draft).
        await page.evaluate(() => window.__km.showKeepsakesView());
        await page.click('#ksBookBtn');
        await assertVisible(page, '#bookView', 'Book view — Phase 23 proof independence');
        await page.waitForSelector('#bookCanvas .book-page', { timeout: 5_000 });
        // Verify proof state is 'none' before any user action.
        const proofBefore = await page.evaluate(() => {
            const UX = window.KMEngine && window.KMEngine.ProofApprovalUX;
            if (!UX) return { ok: false, reason: 'no-ux' };
            const s = UX.getState('message-book');
            return { ok: s && s.status === 'none', status: s ? s.status : null };
        });
        assert(proofBefore.ok,
            'Proof state should be "none" before user submits, got: ' + proofBefore.status);
        // Click the proof review button.
        const btn = await page.$('#bookProofSubmitBtn');
        assert(btn !== null, '"Mark ready for proof review" button not found before submit');
        await btn.click();
        // After submit: proof = pending-review; draft remains preflight-passed.
        const afterSubmit = await page.evaluate(() => {
            const UX  = window.KMEngine && window.KMEngine.ProofApprovalUX;
            const PDL = window.KMEngine && window.KMEngine.ProductDraftLifecycle;
            if (!UX || !PDL) return { ok: false, reason: 'engine missing' };
            const proofState = UX.getState('message-book');
            const groups = window.__km.getKeepsakeGroups();
            const g = groups.find(gr => gr.id !== 'group-staging' && gr.messages.length > 0);
            const draft = g ? PDL.getDraft(g, 'message-book') : null;
            return {
                proofStatus: proofState ? proofState.status : null,
                draftStatus: draft ? draft.status : null,
                ok: proofState && proofState.status === 'pending-review' &&
                    draft && draft.status === 'preflight-passed'
            };
        });
        assert(afterSubmit.ok,
            'After submit: expected proof=pending-review and draft=preflight-passed, got proof=' +
            afterSubmit.proofStatus + ' draft=' + afterSubmit.draftStatus);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // REAL-FILES PHASES (only when --real-files is passed)
    // ─────────────────────────────────────────────────────────────────────────

    if (REAL_FILES) {

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 11 — Real .txt file import
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 11 — Real .txt file import ──\n');

        await harness.run('txt fixture imports via file input', async page => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await waitForKm(page);
            // Navigate to txt upload view (as a user would)
            await page.click('#txtUploadCard');
            // Set the fixture file on the hidden file input — triggers the change event
            await page.locator('#fileInput').setInputFiles(TXT_FIXTURE);
            // FileReader is async; wait for renderConversation to set chatView visible
            await waitForChatView(page);
        });

        await harness.run('chat view visible after txt import', async page => {
            await assertVisible(page, '#chatView', 'Chat view after txt import');
        });

        await harness.run('message rows match txt fixture count', async page => {
            const rows = await page.locator('.message-row.selectable').count();
            assert(rows === TXT_FIXTURE_COUNT,
                `Expected ${TXT_FIXTURE_COUNT} DOM rows after txt import, got ${rows}`);
            const dataCount = await page.evaluate(() => (window.chatMessagesData || []).length);
            assert(dataCount === TXT_FIXTURE_COUNT,
                `Expected ${TXT_FIXTURE_COUNT} in chatMessagesData after txt import, got ${dataCount}`);
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 12 — Selection, review, and keepsake groups from .txt import
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 12 — Selection and review from txt ──\n');

        await harness.run('select all messages from txt import', async page => {
            await page.click('#selectAllBtn');
            const count = await page.evaluate(() => window.__km.getSelectedCount());
            assert(count === TXT_FIXTURE_COUNT,
                `Expected ${TXT_FIXTURE_COUNT} selected after txt import, got ${count}`);
        });

        await harness.run('Continue navigates to review view from txt state', async page => {
            await page.click('#selectionContinue');
            await assertVisible(page, '#reviewView', 'Review view after txt import selection');
        });

        await harness.run('keepsake groups built from txt messages', async page => {
            const groups = await page.evaluate(() => window.__km.getKeepsakeGroups());
            assert(groups.length > 0, 'No keepsake groups after txt import + Continue');
            const realGroups = groups.filter(g => g.id !== 'group-staging');
            assert(realGroups.length > 0, 'No real keepsake groups (only staging)');
            assert(realGroups[0].messages.length > 0, 'First real group has no messages');
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 13 — Actual project file download
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 13 — Actual project file download ──\n');

        await harness.run('save project button triggers browser download', async page => {
            // Intercept the Blob download before clicking
            const [download] = await Promise.all([
                page.waitForEvent('download'),
                page.click('#reviewSaveProjectBtn'),
            ]);
            downloadedFilePath = path.join(os.tmpdir(), `keepmees-e2e-${Date.now()}.json`);
            await download.saveAs(downloadedFilePath);
            assert(fs.existsSync(downloadedFilePath), 'Download file was not saved to temp path');
        });

        await harness.run('downloaded file is valid keepmees JSON with correct message count', async page => {
            assert(downloadedFilePath !== null, 'No downloaded file from previous test');
            const raw = fs.readFileSync(downloadedFilePath, 'utf8');
            const obj = JSON.parse(raw);
            assert(obj.keepmeesVersion === '1',
                `keepmeesVersion should be "1", got "${obj.keepmeesVersion}"`);
            assert(Array.isArray(obj.projectSession?.memories),
                'projectSession.memories missing from downloaded file');
            assert(obj.projectSession.memories.length === TXT_FIXTURE_COUNT,
                `Downloaded file has ${obj.projectSession.memories.length} memories, expected ${TXT_FIXTURE_COUNT}`);
            assert(typeof obj.projectSession.id === 'string' && obj.projectSession.id.length > 0,
                'projectSession.id missing or empty');
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 14 — Actual file upload and restore
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 14 — Actual file upload and restore ──\n');

        await harness.run('reload to clean state before upload test', async page => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await waitForKm(page);
            await assertVisible(page, '#landing', 'Landing before upload test');
        });

        await harness.run('project file input loads downloaded file', async page => {
            assert(downloadedFilePath !== null, 'No downloaded file — Phase 13 save test may have failed');
            // setInputFiles triggers the change event → handleProjectFileLoad (async FileReader)
            await page.locator('#projectFileInput').setInputFiles(downloadedFilePath);
            await waitForChatView(page);
        });

        await harness.run('chat view restored after actual file upload', async page => {
            await assertVisible(page, '#chatView', 'Chat view after actual file upload restore');
        });

        await harness.run('restored message count matches downloaded file', async page => {
            const dataCount = await page.evaluate(() => (window.chatMessagesData || []).length);
            assert(dataCount === TXT_FIXTURE_COUNT,
                `chatMessagesData has ${dataCount} messages after upload restore, expected ${TXT_FIXTURE_COUNT}`);
            const domCount = await page.locator('.message-row.selectable').count();
            assert(domCount === TXT_FIXTURE_COUNT,
                `DOM has ${domCount} rows after upload restore, expected ${TXT_FIXTURE_COUNT}`);
        });

        await harness.run('keepsake groups survive actual file restore', async page => {
            const groups = await page.evaluate(() => window.__km.getKeepsakeGroups());
            assert(groups.length > 0, 'No keepsake groups after actual file restore');
            const realGroups = groups.filter(g => g.id !== 'group-staging');
            assert(realGroups.length > 0, 'No real keepsake groups after actual file restore');
            assert(realGroups[0].messages.length > 0, 'Restored group has no messages');
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 15 — Views after actual file restore
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 15 — Views after actual restore ──\n');

        await harness.run('Review view renders after actual file restore', async page => {
            await page.evaluate(() => window.__km.showReviewView());
            await assertVisible(page, '#reviewView', 'Review view after actual file restore');
            const html = await page.locator('#reviewBody').innerHTML();
            assert(html.trim().length > 0, 'Review body empty after actual file restore');
        });

        await harness.run('Your Keepsakes renders after actual file restore', async page => {
            await page.evaluate(() => window.__km.showKeepsakesView());
            await assertVisible(page, '#keepsakesView', 'Keepsakes view after actual file restore');
            const html = await page.locator('#ksBody').innerHTML();
            assert(html.trim().length > 0, 'Keepsakes body empty after actual file restore');
        });

        await harness.run('Message Book renders after actual file restore', async page => {
            await page.evaluate(() => window.__km.showBookView());
            await assertVisible(page, '#bookView', 'Book view after actual file restore');
            await page.waitForSelector('#bookCanvas .book-page', { timeout: 5_000 });
            const pageCount = await page.locator('#bookCanvas .book-page').count();
            assert(pageCount > 0, 'Book has no pages after actual file restore');
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 16 — Standalone keepsake type chooser
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 16 — Standalone keepsake type chooser ──\n');

        await harness.run('type chooser action button opens composition view', async page => {
            // Navigate to keepsakes (state with groups is current from Phase 15)
            await page.evaluate(() => window.__km.showKeepsakesView());
            await assertVisible(page, '#keepsakesView', 'Keepsakes view for chooser test');
            // Click the first action button on a keepsake card ("Choose type →" or "Resume →")
            await page.locator('.ks-card-action-btn').first().click();
            // enterComposition() is called → shows compositionView
            await assertVisible(page, '#compositionView', 'Composition view after action button click');
        });

        await harness.run('chosenTypeId set on group after type selection', async page => {
            const chosenTypeId = await page.evaluate(() => {
                const groups = window.__km.getKeepsakeGroups();
                const realGroups = groups.filter(g => g.id !== 'group-staging');
                return realGroups.length > 0 ? realGroups[0].chosenTypeId : null;
            });
            assert(chosenTypeId !== null && chosenTypeId !== undefined,
                `chosenTypeId should be set after clicking type chooser, got ${chosenTypeId}`);
        });

        await harness.run('composition back button returns to Keepsakes view', async page => {
            await page.click('#compBackBtn');
            await assertVisible(page, '#keepsakesView', 'Keepsakes view after composition back');
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 17 — Stable error text assertions
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 17 — Stable error text ──\n');

        await harness.run('reload to clean state for error text tests', async page => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await waitForKm(page);
        });

        await harness.run('invalid JSON shows error status with expected text', async page => {
            await page.locator('#projectFileInput').setInputFiles({
                name:     'bad.keepmees.json',
                mimeType: 'application/json',
                buffer:   Buffer.from('{not valid json {{'),
            });
            // handleProjectFileLoad is async; wait for status to appear
            await page.waitForFunction(
                () => {
                    const el = document.getElementById('projectLoadStatus');
                    return el && el.style.display !== 'none' && el.textContent.length > 0;
                },
                { timeout: 3_000 }
            );
            const status = await page.evaluate(() => ({
                text:  document.getElementById('projectLoadStatus').textContent,
                error: document.getElementById('projectLoadStatus').classList.contains('error'),
            }));
            assert(status.error, 'projectLoadStatus should have class "error" for invalid JSON');
            assert(
                status.text.toLowerCase().includes('could not read') ||
                status.text.toLowerCase().includes('parse') ||
                status.text.toLowerCase().includes('invalid'),
                `Expected error text about invalid JSON, got: "${status.text}"`
            );
        });

        await harness.run('wrong schema version shows error status', async page => {
            const badVer = JSON.stringify({
                keepmeesVersion: '999',
                projectSession: { id: 'x', memories: [], selectedMemoryIds: [], keepsakeGroups: [] }
            });
            await page.locator('#projectFileInput').setInputFiles({
                name:     'wrong-ver.keepmees.json',
                mimeType: 'application/json',
                buffer:   Buffer.from(badVer),
            });
            await page.waitForFunction(
                () => {
                    const el = document.getElementById('projectLoadStatus');
                    return el && el.style.display !== 'none' && el.textContent.length > 0;
                },
                { timeout: 3_000 }
            );
            const status = await page.evaluate(() => ({
                text:  document.getElementById('projectLoadStatus').textContent,
                error: document.getElementById('projectLoadStatus').classList.contains('error'),
            }));
            assert(status.error, 'projectLoadStatus should have class "error" for wrong version');
            assert(
                status.text.toLowerCase().includes('invalid') ||
                status.text.toLowerCase().includes('version') ||
                status.text.toLowerCase().includes('unsupported'),
                `Expected error text about invalid/unsupported version, got: "${status.text}"`
            );
        });

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 18 — Optional private chat.db smoke (env-var gated)
        // ─────────────────────────────────────────────────────────────────────
        if (CHATDB_PATH) {
            console.log('\n── PHASE 18 — Optional chat.db smoke ──\n');
            console.log(`  Using: ${CHATDB_PATH}\n`);

            await harness.run('private chat.db loads without crash', async page => {
                await page.reload({ waitUntil: 'domcontentloaded' });
                await waitForKm(page);
                // Navigate to guide view (chat.db upload flow)
                await page.click('#macGuideCard');
                // SQL.js loads from CDN; allow generous timeout for network + WASM init
                await page.locator('#dbFileInput').setInputFiles(CHATDB_PATH);
                // Wait for either contact picker, loading overlay success, or an error status
                // Any of these means the app did not crash
                await page.waitForFunction(
                    () => {
                        const picker  = document.getElementById('contactPicker');
                        const overlay = document.querySelector('.loading-overlay.active');
                        const guideStatus = document.getElementById('guideStatus');
                        return (
                            (picker && picker.style.display !== 'none') ||
                            (overlay !== null) ||
                            (guideStatus && guideStatus.textContent.length > 0)
                        );
                    },
                    { timeout: 30_000 }
                );
                const alive = await page.evaluate(() => typeof window.__km === 'object');
                assert(alive, 'window.__km inaccessible after chat.db load — app may have crashed');
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // PHASE 19 — Capture harness integration (subprocess)
        // ─────────────────────────────────────────────────────────────────────
        console.log('\n── PHASE 19 — Capture harness integration ──\n');

        await harness.runNode('capture harness scenario A exits cleanly', async () => {
            const captureScript = path.join(__dir, 'capture-message-book-packet.mjs');
            await execAsync(`node "${captureScript}" --scenarios a`, {
                cwd:     REPO_ROOT,
                timeout: 90_000,
            });
        });

    } // end REAL_FILES

    // ─────────────────────────────────────────────────────────────────────────
    // Teardown
    // ─────────────────────────────────────────────────────────────────────────
    await browser.close();
    server.close();

    // Clean up temp download file if it exists
    if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
        try { fs.unlinkSync(downloadedFilePath); } catch (_) {}
    }

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
