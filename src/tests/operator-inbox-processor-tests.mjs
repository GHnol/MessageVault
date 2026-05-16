import { join, dirname }                              from 'node:path';
import { fileURLToPath }                              from 'node:url';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir }                                     from 'node:os';
import {
    detectStream, extractPackageName, extractCommitHashes, extractTestResults,
    extractDecisions, extractRisks, extractNextActions, classifyRoutingTargets,
    needsCoordinatorApproval, extractAll,
    generateRoutingMd, generateRoutingJson, generateCoordinatorSummary,
    generateSuggestedPrompts, processFile,
} from '../../scripts/process-operator-inbox.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

const DEV_FIXTURE     = join(ROOT, 'scripts', 'fixtures', 'operator-inbox', 'development-closeout-sample.md');
const PRODUCT_FIXTURE = join(ROOT, 'scripts', 'fixtures', 'operator-inbox', 'product-response-sample.md');

let passed = 0, failed = 0;
function suite(name) { console.log('\n' + name); }
function assert(condition, label) {
    if (condition) { console.log('  PASS  ' + label); passed++; }
    else           { console.error('  FAIL  ' + label); failed++; }
}

// Inline deterministic test content — does not depend on fixture files for extraction tests
const DEV_CONTENT = [
    '# Development Closeout — Package 3C',
    '',
    'Source: Development',
    '',
    'Package 3C is complete.',
    '',
    'Feature commit: f8379d0',
    'Merge commit: 904cf51',
    '',
    '## Tests run',
    '',
    '29 passing, 0 failures',
    '',
    '## Decisions',
    '',
    'Decision: Package 3C complete and authorized for merge',
    '',
    '## Next actions',
    '',
    'Next action: Coordinator to evaluate and authorize Package 2.6',
].join('\n');

const PRODUCT_CONTENT = [
    '# Product Stream Response',
    '',
    'Source: Product',
    '',
    'Message Book remains flagship product.',
    '',
    'Locked: 7x10 hardcover format unchanged',
    '',
    'Risk: Vendor IngramSpark confirmation pending',
    '',
    'Next action: Coordinator to follow up on IngramSpark',
].join('\n');

const EMPTY_CONTENT   = '';
const UNKNOWN_CONTENT = 'This is an update without clear stream information.';

// ── Suite 1: detectStream ────────────────────────────────────────────────────
suite('detectStream');
assert(detectStream('2026-05-15_development_closeout.md', DEV_CONTENT) === 'Development', 'detects Development from filename');
assert(detectStream('2026-05-15_product_response.md', PRODUCT_CONTENT) === 'Product',     'detects Product from filename');
assert(detectStream('2026-05-15_vendor_response.md', '')               === 'Vendor',      'detects Vendor from filename');
assert(detectStream('2026-05-15_coordinator_sync.md', '')              === 'Coordinator', 'detects Coordinator from filename');
assert(detectStream('unknown.md', UNKNOWN_CONTENT)                     === 'Unknown',     'returns Unknown for unrecognized content');
assert(detectStream('noname.md', EMPTY_CONTENT)                        === 'Unknown',     'empty content and name → Unknown');

// ── Suite 2: extractPackageName ──────────────────────────────────────────────
suite('extractPackageName');
const pkgs = extractPackageName(DEV_CONTENT);
assert(pkgs.length > 0,              'finds at least one package name');
assert(pkgs.some(p => /3/.test(p)),  'extracts Package 3C');
assert(extractPackageName(EMPTY_CONTENT).length === 0, 'empty content → empty packages');

// ── Suite 3: extractCommitHashes ─────────────────────────────────────────────
suite('extractCommitHashes');
const commits = extractCommitHashes(DEV_CONTENT);
assert(commits.length > 0,          'finds commit hashes');
assert(commits.includes('f8379d0'), 'extracts feature commit hash');
assert(commits.includes('904cf51'), 'extracts merge commit hash');
assert(!commits.includes('29'),     'does not extract pure-decimal string as hash');
assert(extractCommitHashes(EMPTY_CONTENT).length === 0, 'empty content → empty commits');

// ── Suite 4: extractTestResults ──────────────────────────────────────────────
suite('extractTestResults');
const tr = extractTestResults(DEV_CONTENT);
assert(tr.passing === 29,  'extracts 29 passing');
assert(tr.failing  === 0,  'extracts 0 failing');
const trEmpty = extractTestResults(EMPTY_CONTENT);
assert(trEmpty.passing === null, 'no match → null passing');
assert(trEmpty.failing === null, 'no match → null failing');

// ── Suite 5: extractDecisions ────────────────────────────────────────────────
suite('extractDecisions');
const decisions = extractDecisions(DEV_CONTENT);
assert(decisions.length > 0,                        'finds at least one decision');
assert(decisions.some(d => /3C/.test(d)),           'decision mentions Package 3C');
assert(extractDecisions(EMPTY_CONTENT).length === 0,'empty content → no decisions');

// ── Suite 6: extractRisks ────────────────────────────────────────────────────
suite('extractRisks');
const risks = extractRisks(PRODUCT_CONTENT);
assert(risks.length > 0,                           'finds at least one risk');
assert(risks.some(r => /IngramSpark/.test(r)),     'risk mentions IngramSpark');
assert(extractRisks(EMPTY_CONTENT).length === 0,   'empty content → no risks');

// ── Suite 7: extractNextActions ──────────────────────────────────────────────
suite('extractNextActions');
const nextActions = extractNextActions(DEV_CONTENT);
assert(nextActions.length > 0,                       'finds at least one next action');
assert(nextActions.some(a => /Coordinator/.test(a)), 'next action mentions Coordinator');
assert(extractNextActions(EMPTY_CONTENT).length === 0,'empty content → no actions');

// ── Suite 8: classifyRoutingTargets ──────────────────────────────────────────
suite('classifyRoutingTargets');
const targets = classifyRoutingTargets('Development', DEV_CONTENT);
assert(Array.isArray(targets),           'returns array');
assert(targets.length > 0,              'non-empty');
assert(targets.includes('Coordinator'), 'Development stream → includes Coordinator');
const unknownTargets = classifyRoutingTargets('Unknown', UNKNOWN_CONTENT);
assert(Array.isArray(unknownTargets),   'unknown stream → returns array');
assert(unknownTargets.length > 0,       'unknown stream → has at least one target');

// ── Suite 9: generateRoutingMd ───────────────────────────────────────────────
suite('generateRoutingMd');
const extracted = extractAll('2026-05-15_development_closeout.md', DEV_CONTENT);
const routingMd = generateRoutingMd(extracted);
assert(typeof routingMd === 'string',          'returns string');
assert(routingMd.includes('# Routing Packet'), 'contains routing packet header');
assert(routingMd.includes('Development'),      'mentions stream name');
assert(routingMd.length > 100,                 'produces substantial output');
assert(routingMd.includes('f8379d0'),          'includes extracted commit hash');

// ── Suite 10: generateRoutingJson ────────────────────────────────────────────
suite('generateRoutingJson');
const routingJson = generateRoutingJson(extracted);
assert(typeof routingJson === 'string', 'returns string');
let parsed = {};
try { parsed = JSON.parse(routingJson); assert(true, 'routing JSON is valid JSON'); }
catch { assert(false, 'routing JSON is valid JSON'); }
assert(typeof parsed.packetId === 'string',                     'JSON has packetId');
assert(Array.isArray(parsed.destination),                       'JSON has destination array');
assert(parsed.destination.length > 0,                           'destination is non-empty');
assert(typeof parsed.coordinatorApprovalRequired === 'boolean', 'JSON has coordinatorApprovalRequired boolean');
assert(typeof parsed.urgency === 'string',                      'JSON has urgency');
assert(['immediate', 'this-session', 'next-session', 'low'].includes(parsed.urgency), 'urgency is valid enum');

// ── Suite 11: unknown stream handled safely ───────────────────────────────────
suite('unknown stream handling');
const unknownExtracted = extractAll('noname.md', UNKNOWN_CONTENT);
assert(unknownExtracted.stream === 'Unknown',                        'assigns Unknown stream');
assert(Array.isArray(unknownExtracted.routingTargets),               'routing targets still array');
assert(unknownExtracted.routingTargets.length > 0,                   'still has routing target');
assert(typeof generateRoutingMd(unknownExtracted) === 'string',      'generateRoutingMd: no crash');
let unknownParsed = {};
try { unknownParsed = JSON.parse(generateRoutingJson(unknownExtracted)); assert(true, 'unknown stream JSON valid'); }
catch { assert(false, 'unknown stream JSON valid'); }
assert(Array.isArray(unknownParsed.destination) && unknownParsed.destination.length > 0, 'unknown stream has valid destination');

// ── Suite 12: missing fields do not crash ─────────────────────────────────────
suite('missing fields / empty content');
const emptyExtracted = extractAll('empty.md', EMPTY_CONTENT);
assert(emptyExtracted.packages.length    === 0, 'empty → empty packages');
assert(emptyExtracted.commits.length     === 0, 'empty → empty commits');
assert(emptyExtracted.decisions.length   === 0, 'empty → empty decisions');
assert(emptyExtracted.risks.length       === 0, 'empty → empty risks');
assert(emptyExtracted.nextActions.length === 0, 'empty → empty nextActions');
assert(typeof generateRoutingMd(emptyExtracted)          === 'string', 'generateRoutingMd: no crash on empty');
assert(typeof generateRoutingJson(emptyExtracted)        === 'string', 'generateRoutingJson: no crash on empty');
assert(typeof generateCoordinatorSummary(emptyExtracted) === 'string', 'generateCoordinatorSummary: no crash on empty');
assert(typeof generateSuggestedPrompts(emptyExtracted)   === 'string', 'generateSuggestedPrompts: no crash on empty');
try { JSON.parse(generateRoutingJson(emptyExtracted)); assert(true, 'empty → JSON still valid'); }
catch { assert(false, 'empty → JSON still valid'); }

// ── Suite 13: processFile with fixture ───────────────────────────────────────
suite('processFile with development fixture');
const tmpDir = join(tmpdir(), 'keepmees-inbox-test-' + Date.now());
mkdirSync(tmpDir, { recursive: true });
let result;
try {
    result = processFile(DEV_FIXTURE, tmpDir);
    assert(true, 'processFile does not throw');
} catch (e) {
    assert(false, 'processFile does not throw: ' + e.message);
}
if (result) {
    assert(existsSync(result.outputs.routing_md),          'writes routing.md');
    assert(existsSync(result.outputs.routing_json),        'writes routing.json');
    assert(existsSync(result.outputs.coordinator_summary), 'writes coordinator-summary.md');
    assert(existsSync(result.outputs.suggested_prompts),   'writes suggested-prompts.md');
    try {
        JSON.parse(readFileSync(result.outputs.routing_json, 'utf8'));
        assert(true, 'written routing.json is valid JSON');
    } catch {
        assert(false, 'written routing.json is valid JSON');
    }
}
try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────');
console.log(`  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
