/**
 * KeepsakeGroup model tests.
 * Run with: node src/tests/keepsake-group-tests.mjs
 */

import { readFileSync }              from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath }             from 'node:url';
import { dirname, join }             from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..', '..');

const ctx = createContext({ window: {}, console });

function load(rel) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    try {
        runInContext(code, ctx);
    } catch (e) {
        console.error('Failed to load ' + rel + ':', e.message);
        process.exit(1);
    }
}

load('src/core/source-platforms.js');
load('src/core/normalized-memory.js');
load('src/core/import-adapters.js');
load('src/core/keepsake-group.js');

const { KMEngine } = ctx.window;
const KG = KMEngine.KeepsakeGroup;

let passed = 0, failed = 0;

function suite(name) { console.log('\n' + name); }
function assert(cond, label) {
    if (cond) { console.log('  PASS  ' + label); passed++; }
    else       { console.error('  FAIL  ' + label); failed++; }
}

// ── KeepsakeGroup.create ──────────────────────────────────────────────────────

suite('KeepsakeGroup.create — defaults');
{
    const g = KG.create();
    assert(typeof g.id === 'string' && g.id.length > 0,   'id is a non-empty string');
    assert(Array.isArray(g.messages),                      'messages is an array');
    assert(Array.isArray(g.messageIndices),                'messageIndices is an array');
    assert(g.customName === null,                          'customName defaults to null');
    assert(g.chosenTypeId === null,                        'chosenTypeId defaults to null');
    assert(g.lastComposedAt === null,                      'lastComposedAt defaults to null');
    assert(Array.isArray(g.memoryIds),                     'memoryIds is an array');
    assert(Array.isArray(g.sourcePlatformIds),             'sourcePlatformIds is an array');
    assert(Array.isArray(g.productDrafts),                 'productDrafts is an array');
    assert(typeof g.metadata === 'object' && g.metadata !== null, 'metadata is an object');
}

suite('KeepsakeGroup.create — with opts');
{
    const msgs = [{ text: 'hello', sender: 'Me' }];
    const g = KG.create({
        id:             'group-1',
        messages:       msgs,
        messageIndices: [0],
        customName:     'My Set',
        chosenTypeId:   'quote-card',
        lastComposedAt: 1000
    });
    assert(g.id === 'group-1',        'id set from opts');
    assert(g.messages === msgs,       'messages set from opts');
    assert(g.messageIndices[0] === 0, 'messageIndices set from opts');
    assert(g.customName === 'My Set', 'customName set from opts');
    assert(g.chosenTypeId === 'quote-card', 'chosenTypeId set from opts');
    assert(g.lastComposedAt === 1000, 'lastComposedAt set from opts');
}

// ── Existing shape compatibility ──────────────────────────────────────────────

suite('KeepsakeGroup — existing shape compatibility');
{
    // Simulate building a group the old way (as index.html does in buildKeepsakeGroups)
    const legacyGroup = {
        id: 'group-1',
        messages: [{ text: 'hi', sender: 'Alice' }],
        messageIndices: [3],
        customName: null,
        chosenTypeId: null,
        lastComposedAt: null
    };
    // KG functions must work on legacy-shaped objects
    assert(KG.getDisplayName(legacyGroup, [legacyGroup]) === 'Keepsake Set 1', 'getDisplayName works on legacy group');
    assert(Array.isArray(KG.deriveMemoryIds(legacyGroup)),        'deriveMemoryIds works on legacy group');
    assert(KG.deriveMemoryIds(legacyGroup).length === 0,          'legacy group without .id yields empty memoryIds');
    assert(Array.isArray(KG.deriveSourcePlatformIds(legacyGroup)),'deriveSourcePlatformIds works on legacy group');
    assert(KG.deriveSourcePlatformIds(legacyGroup).length === 0,  'legacy messages without sourcePlatformId yield empty array');
}

// ── KeepsakeGroup.touch ───────────────────────────────────────────────────────

suite('KeepsakeGroup.touch');
{
    const g = KG.create();
    assert(g.lastComposedAt === null, 'starts null');
    const before = Date.now();
    KG.touch(g);
    const after = Date.now();
    assert(typeof g.lastComposedAt === 'number', 'touch sets lastComposedAt to a number');
    assert(g.lastComposedAt >= before && g.lastComposedAt <= after, 'lastComposedAt is recent');
}

// ── getDisplayName ────────────────────────────────────────────────────────────

suite('KeepsakeGroup.getDisplayName');
{
    const g1 = KG.create({ id: 'group-1' });
    const g2 = KG.create({ id: 'group-2' });
    const staging = KG.create({ id: 'group-staging' });
    const all = [g1, g2, staging];

    assert(KG.getDisplayName(staging, all) === 'Newly Selected',  'staging group returns Newly Selected');
    assert(KG.getDisplayName(g1, all) === 'Keepsake Set 1',       'first real group is Keepsake Set 1');
    assert(KG.getDisplayName(g2, all) === 'Keepsake Set 2',       'second real group is Keepsake Set 2');

    const named = KG.create({ id: 'group-x', customName: 'Summer Memories' });
    assert(KG.getDisplayName(named, [named]) === 'Summer Memories', 'customName overrides default');

    const blankName = KG.create({ id: 'group-y', customName: '   ' });
    assert(KG.getDisplayName(blankName, [blankName]) === 'Keepsake Set 1', 'blank customName falls back to default');
}

// ── deriveMemoryIds ───────────────────────────────────────────────────────────

suite('KeepsakeGroup.deriveMemoryIds');
{
    // Messages with NormalizedMemory .id fields
    const msgs = [
        { id: 'mem-abc', text: 'hello', sender: 'Me' },
        { id: 'mem-def', text: 'world', sender: 'Alice' },
        { text: 'no id', sender: 'Bob' }   // legacy message without id
    ];
    const g = KG.create({ messages: msgs });
    const ids = KG.deriveMemoryIds(g);
    assert(ids.length === 2,           'only messages with .id are included');
    assert(ids[0] === 'mem-abc',       'first memory id correct');
    assert(ids[1] === 'mem-def',       'second memory id correct');
}

// ── deriveSourcePlatformIds ───────────────────────────────────────────────────

suite('KeepsakeGroup.deriveSourcePlatformIds');
{
    const msgs = [
        { text: 'hi',    sender: 'Me',    sourcePlatformId: 'imessage' },
        { text: 'hello', sender: 'Alice', sourcePlatformId: 'imessage' },
        { text: 'hey',   sender: 'Bob',   sourcePlatformId: 'txt-export' }
    ];
    const g = KG.create({ messages: msgs });
    const pids = KG.deriveSourcePlatformIds(g);
    assert(pids.length === 2,              'deduplicates platform IDs');
    assert(pids.indexOf('imessage') >= 0,  'imessage included');
    assert(pids.indexOf('txt-export') >= 0,'txt-export included');
}

// ── staging group behavior ────────────────────────────────────────────────────

suite('KeepsakeGroup — staging group behavior');
{
    const staging = KG.create({ id: 'group-staging' });
    assert(KG.getDisplayName(staging, [staging]) === 'Newly Selected', 'staging always returns Newly Selected');
    assert(staging.messages.length === 0,       'staging starts empty');
    assert(staging.messageIndices.length === 0, 'staging messageIndices starts empty');
}

// ── empty group ───────────────────────────────────────────────────────────────

suite('KeepsakeGroup — empty group handling');
{
    const empty = KG.create();
    assert(empty.messages.length === 0,              'empty group has zero messages');
    assert(KG.deriveMemoryIds(empty).length === 0,   'deriveMemoryIds safe on empty group');
    assert(KG.deriveSourcePlatformIds(empty).length === 0, 'deriveSourcePlatformIds safe on empty group');
}

// ── chosenTypeId preserved ────────────────────────────────────────────────────

suite('KeepsakeGroup — chosenTypeId preserved');
{
    const g = KG.create({ chosenTypeId: 'framed-print' });
    assert(g.chosenTypeId === 'framed-print', 'chosenTypeId survives create()');
    // Touching should not clear chosenTypeId
    KG.touch(g);
    assert(g.chosenTypeId === 'framed-print', 'chosenTypeId survives touch()');
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
