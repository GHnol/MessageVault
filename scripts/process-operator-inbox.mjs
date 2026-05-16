import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, dirname, relative }                               from 'node:path';
import { fileURLToPath }                                                   from 'node:url';

const __dir     = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dir, '..');
const INBOX_DIR = join(REPO_ROOT, 'operator-inbox');
const OUTBOX_DIR = join(REPO_ROOT, 'operator-outbox');

// ── Stream classification ────────────────────────────────────────────────────

const STREAM_ALIASES = {
    'coordinator':  'Coordinator',
    'product':      'Product',
    'development':  'Development',
    'dev':          'Development',
    'claude-code':  'Claude Code',
    'claudecode':   'Claude Code',
    'codex':        'Codex',
    'design':       'Design',
    'vendor':       'Vendor',
    'packaging':    'Packaging',
    'competitors':  'Competitors',
    'competitor':   'Competitors',
    'ai-mastery':   'AI Mastery',
    'aimastery':    'AI Mastery',
    'tools':        'Tools',
    'brand':        'Brand',
};

// Maps internal stream names to routing-packet.schema.json destination enum values
const SCHEMA_DESTINATION_MAP = {
    'Coordinator':  'Coordinator',
    'Development':  'Development-ChatGPT',
    'Claude Code':  'Claude-Code',
    'Codex':        'Claude-Code',
    'Product':      'Product',
    'Design':       'Design',
    'Vendor':       'Vendor-Feasibility',
    'Packaging':    'Packaging',
    'Competitors':  'Competitors',
    'AI Mastery':   'AI-Mastery',
    'Tools':        'Coordinator',
    'Brand':        'Coordinator',
    'Unknown':      'Coordinator',
};

const SCHEMA_VALID_DESTINATIONS = new Set([
    'Coordinator', 'Development-ChatGPT', 'Claude-Code', 'Product',
    'Design', 'Vendor-Feasibility', 'Packaging', 'Competitors', 'AI-Mastery',
]);

// Default routing per stream
const STREAM_ROUTING_MAP = {
    'Coordinator':  ['Coordinator'],
    'Product':      ['Product', 'Coordinator'],
    'Development':  ['Claude Code', 'Coordinator'],
    'Claude Code':  ['Coordinator', 'Development'],
    'Codex':        ['Coordinator', 'Claude Code'],
    'Design':       ['Design', 'Coordinator'],
    'Vendor':       ['Vendor', 'Coordinator'],
    'Packaging':    ['Packaging', 'Coordinator'],
    'Competitors':  ['Competitors'],
    'AI Mastery':   ['AI Mastery', 'Coordinator'],
    'Tools':        ['Claude Code'],
    'Brand':        ['Coordinator'],
    'Unknown':      ['Coordinator'],
};

// ── Extraction functions (exported for testing) ──────────────────────────────

export function detectStream(filename, content) {
    const base  = basename(filename, '.md');
    const parts = base.split('_');
    if (parts.length >= 2) {
        const raw = parts[1].toLowerCase();
        if (STREAM_ALIASES[raw]) return STREAM_ALIASES[raw];
        const stripped = raw.replace(/-/g, '');
        for (const [alias, name] of Object.entries(STREAM_ALIASES)) {
            if (alias.replace(/-/g, '') === stripped) return name;
        }
    }
    const first600 = content.slice(0, 600).toLowerCase();
    for (const kw of ['source: ', 'stream: ', 'from: ']) {
        const idx = first600.indexOf(kw);
        if (idx >= 0) {
            const rest  = first600.slice(idx + kw.length).split('\n')[0].trim();
            const match = STREAM_ALIASES[rest] || STREAM_ALIASES[rest.replace(/-/g, '')];
            if (match) return match;
        }
    }
    return 'Unknown';
}

export function extractPackageName(content) {
    const matches = [];
    const re = /\bPackage\s+(\d+[A-Za-z]?(?:\.\d+[A-Za-z]?)?)\b/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
        const pkg = 'Package ' + m[1];
        if (!matches.includes(pkg)) matches.push(pkg);
    }
    return matches;
}

export function extractCommitHashes(content) {
    const hashes = [];
    // Matches backtick-wrapped or plain 7–40 char hex strings
    const re = /`([0-9a-f]{7,40})`|\b([0-9a-f]{7,40})\b/g;
    let m;
    while ((m = re.exec(content)) !== null) {
        const hash = m[1] || m[2];
        // Exclude pure-decimal strings (e.g. "29", "453")
        if (!/^\d+$/.test(hash) && !hashes.includes(hash)) hashes.push(hash);
    }
    return hashes;
}

export function extractTestResults(content) {
    const results = { passing: null, failing: null, summary: null };
    const pMatch = content.match(/(\d+)\s+(?:tests?\s+)?pass(?:ing|ed)/i);
    if (pMatch) results.passing = parseInt(pMatch[1], 10);
    const fMatch = content.match(/(\d+)\s+(?:tests?\s+)?fail(?:ures?|ing|ed)/i);
    if (fMatch) results.failing = parseInt(fMatch[1], 10);
    if (/\ball\s+(?:tests?\s+)?(?:green|pass(?:ing)?)\b/i.test(content)) {
        results.summary = 'all passing';
        if (results.failing === null) results.failing = 0;
    }
    // Aggregate "N passed, M failed" pattern — e.g. "520 passed, 0 failed"
    const aggMatch = content.match(/(\d+)\s+passed[^,\n]*,\s*(\d+)\s+fail/i);
    if (aggMatch) {
        if (!results.summary) results.summary = `${aggMatch[1]} passed, ${aggMatch[2]} failed`;
        if (results.passing === null) results.passing = parseInt(aggMatch[1], 10);
        if (results.failing === null) results.failing = parseInt(aggMatch[2], 10);
    }
    // "Total: N/N" fraction pattern — e.g. "Total: 520/520"
    const totalMatch = content.match(/\bTotal:\s+(\d+)\/(\d+)/i);
    if (totalMatch && !results.summary) {
        results.summary = `${totalMatch[1]}/${totalMatch[2]}`;
        if (results.passing === null) results.passing = parseInt(totalMatch[1], 10);
    }
    return results;
}

export function extractDecisions(content) {
    const decisions = [];
    const patterns = [
        /\*\*Decision(?:[^*]*):\s*([^*]+)\*\*/gi,
        /^[*\-]?\s*Decision(?:\s+\w+)*:\s*(.+)$/gim,
        /^[*\-]?\s*(?:Decided|Authorized|Locked):\s*(.+)$/gim,
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(content)) !== null) {
            const d = m[1].trim();
            if (d && !decisions.includes(d)) decisions.push(d);
        }
    }
    return decisions;
}

export function extractRisks(content) {
    const risks = [];
    const patterns = [
        /\b(RISK-[A-Z]+-\d+)\b/g,
        /^[*\-]?\s*[Rr]isk:\s*(.+)$/gm,
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(content)) !== null) {
            const r = (m[1] || m[2] || '').trim();
            if (r && !risks.includes(r)) risks.push(r);
        }
    }
    return risks;
}

export function extractNextActions(content) {
    const actions = [];
    const patterns = [
        /^[*\-]?\s*Next\s+(?:action|step)?:\s*(.+)$/gim,
        /^[*\-]?\s*Action\s+required:\s*(.+)$/gim,
        /^[*\-]?\s*TODO:\s*(.+)$/gim,
        // "Next package: ..." lines — e.g. "Next package: Not started. Awaiting Coordinator authorization."
        /^[*\-]?\s*Next\s+package:\s*(.+)$/gim,
        // "Next package requires ..." — no colon variant
        /^[*\-]?\s*(Next\s+package\s+requires?\s+[^\n]+)$/gim,
        // "Awaiting Coordinator authorization..." standalone
        /^[*\-]?\s*(Awaiting\s+Coordinator\s+authorization[^\n]*)$/gim,
        // "Coordinator to evaluate/authorize/review ..." standalone
        /^[*\-]?\s*(Coordinator\s+to\s+(?:evaluate|authorize|review)\s+[^\n]*)$/gim,
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(content)) !== null) {
            const a = m[1].trim();
            if (a && !actions.includes(a)) actions.push(a);
        }
    }
    return actions;
}

export function classifyRoutingTargets(stream, content) {
    const base    = STREAM_ROUTING_MAP[stream] || STREAM_ROUTING_MAP['Unknown'];
    const targets = [...base];
    if (/\b(?:implement|commit|push|branch|merge|test|code|script)\b/i.test(content)) {
        if (!targets.includes('Claude Code')) targets.push('Claude Code');
    }
    if (/\b(?:coordinator\s+(?:review|approval|authorize)|NEEDS COORDINATOR|coordinator\s+decision)\b/i.test(content)) {
        if (!targets.includes('Coordinator')) targets.push('Coordinator');
    }
    return [...new Set(targets)];
}

export function needsCoordinatorApproval(content, routingTargets) {
    if (routingTargets.includes('Coordinator')) return true;
    if (/\b(?:coordinator\s+(?:approval|review|authorization)|NEEDS COORDINATOR|needs-coordinator-decision)\b/i.test(content)) return true;
    if (/\bnext\s+package\b/i.test(content)) return true;
    return false;
}

export function inferDocsToUpdate(content) {
    const docs = [];
    const checks = [
        [/command.center|current.status/i, 'docs/command-center/current-status.md'],
        [/next.action/i,                   'docs/command-center/next-actions.md'],
        [/backlog|roadmap/i,               'docs/ops/backlog-roadmap.md'],
        [/\brisk\b/i,                      'docs/ops/risk-register.md'],
        [/\bdecision\b/i,                  'docs/ops/decision-register.md'],
        [/artifact.index/i,               'docs/ops/artifact-index.md'],
        [/ai.automation/i,                'docs/ops/ai-automation-register.md'],
        [/coordinator.dashboard/i,        'docs/command-center/coordinator-dashboard.md'],
    ];
    for (const [re, doc] of checks) {
        if (re.test(content) && !docs.includes(doc)) docs.push(doc);
    }
    return docs;
}

export function extractAll(filename, content) {
    const stream                   = detectStream(filename, content);
    const packages                 = extractPackageName(content);
    const commits                  = extractCommitHashes(content);
    const testResults              = extractTestResults(content);
    const decisions                = extractDecisions(content);
    const risks                    = extractRisks(content);
    const nextActions              = extractNextActions(content);
    const routingTargets           = classifyRoutingTargets(stream, content);
    const coordinatorApprovalRequired = needsCoordinatorApproval(content, routingTargets);
    const docsToUpdate             = inferDocsToUpdate(content);
    const date     = new Date().toISOString().slice(0, 10);
    const packetId = `RP-${date.replace(/-/g, '')}-001`;
    return {
        packetId, date, sourceFile: filename, stream,
        packages, commits, testResults, decisions, risks,
        nextActions, routingTargets, coordinatorApprovalRequired, docsToUpdate,
    };
}

// ── Output generators ────────────────────────────────────────────────────────

function list(arr, fallback = 'none detected') {
    return arr.length ? arr.map(x => `- ${x}`).join('\n') : `- ${fallback}`;
}

export function generateRoutingMd(extracted) {
    const {
        packetId, date, stream, packages, commits, testResults,
        decisions, risks, nextActions, routingTargets,
        coordinatorApprovalRequired, docsToUpdate, sourceFile,
    } = extracted;
    return [
        `# Routing Packet — ${packetId}`,
        '',
        `**Date:** ${date}`,
        `**Source file:** ${basename(sourceFile)}`,
        `**Stream:** ${stream}`,
        `**Packages mentioned:** ${packages.length ? packages.join(', ') : 'none detected'}`,
        `**Coordinator approval required:** ${coordinatorApprovalRequired ? 'YES' : 'No'}`,
        '',
        '---',
        '',
        '## Routing targets',
        '',
        list(routingTargets),
        '',
        '---',
        '',
        '## Extracted data',
        '',
        '### Commit hashes',
        '',
        commits.length ? commits.map(c => `- \`${c}\``).join('\n') : '- none detected',
        '',
        '### Test results',
        '',
        `- Passing: ${testResults.passing !== null ? testResults.passing : 'not detected'}`,
        `- Failing: ${testResults.failing !== null ? testResults.failing : 'not detected'}`,
        `- Summary: ${testResults.summary || 'not detected'}`,
        '',
        '### Decisions',
        '',
        list(decisions),
        '',
        '### Risks',
        '',
        list(risks),
        '',
        '### Next actions',
        '',
        list(nextActions),
        '',
        '---',
        '',
        '## Suggested doc updates',
        '',
        list(docsToUpdate),
        '',
        '---',
        '',
        '> Generated by `scripts/process-operator-inbox.mjs`. Review before acting. Do not apply without Coordinator approval.',
    ].join('\n');
}

export function generateRoutingJson(extracted) {
    const {
        packetId, date, stream, packages, routingTargets,
        coordinatorApprovalRequired, decisions, sourceFile,
    } = extracted;
    const destination = [...new Set(
        routingTargets
            .map(t => SCHEMA_DESTINATION_MAP[t] || 'Coordinator')
            .filter(t => SCHEMA_VALID_DESTINATIONS.has(t))
    )];
    if (!destination.length) destination.push('Coordinator');
    // Only include properties defined in routing-packet.schema.json
    // (schema has additionalProperties: false)
    const packet = {
        packetId,
        date,
        origin:  stream,
        destination,
        subject: packages.length
            ? `${stream} update — ${packages.join(', ')}`
            : `${stream} stream update`,
        urgency: coordinatorApprovalRequired ? 'this-session' : 'next-session',
        summary: `Auto-extracted from ${basename(sourceFile)}. Stream: ${stream}. Packages: ${packages.join(', ') || 'none'}. Decisions: ${decisions.length}.`,
        coordinatorApprovalRequired,
        approvalStatus: 'pending',
    };
    return JSON.stringify(packet, null, 2);
}

export function generateCoordinatorSummary(extracted) {
    const {
        date, stream, packages, commits, testResults,
        decisions, risks, nextActions, coordinatorApprovalRequired,
    } = extracted;
    const lines = [
        `# Coordinator Summary — ${stream} Stream`,
        '',
        `**Date:** ${date}`,
        `**Approval required:** ${coordinatorApprovalRequired ? 'YES' : 'No'}`,
        '',
        '---',
        '',
        '## At a glance',
        '',
        `- **Stream:** ${stream}`,
        `- **Packages:** ${packages.join(', ') || 'none detected'}`,
        `- **Commits:** ${commits.length ? commits.slice(0, 3).map(c => `\`${c}\``).join(', ') : 'none detected'}`,
        `- **Tests:** ${testResults.passing !== null ? testResults.passing + ' passing' : 'not detected'}${testResults.failing ? ', ' + testResults.failing + ' failing' : ''}`,
        '',
    ];
    if (decisions.length) { lines.push('## Decisions', '', ...decisions.map(d => `- ${d}`), ''); }
    if (nextActions.length) { lines.push('## Next actions', '', ...nextActions.map(a => `- ${a}`), ''); }
    if (risks.length) { lines.push('## Risks surfaced', '', ...risks.map(r => `- ${r}`), ''); }
    lines.push('---', '', '> Auto-extracted summary. Verify against source file before acting.');
    return lines.join('\n');
}

export function generateSuggestedPrompts(extracted) {
    const { stream, packages, nextActions, coordinatorApprovalRequired } = extracted;
    const pkgLine     = packages.length ? `Packages involved: ${packages.join(', ')}.` : '';
    const approvalLine = coordinatorApprovalRequired
        ? 'This requires your review and authorization before any action is taken.' : '';
    const lines = [
        `# Suggested Prompts — ${stream} Stream`,
        '',
        '> Copy-paste these prompts to route this update to the appropriate stream or agent.',
        '> Review before sending. Do not route without Coordinator approval for actions that require it.',
        '',
        '---',
        '',
        '## To Coordinator (ChatGPT Chat 01)',
        '',
        '```',
        `I have a new update from the ${stream} stream.`,
        pkgLine,
        approvalLine,
        '',
        'Please review the routing packet and indicate:',
        '1. Whether any action is authorized',
        '2. What the next package or scope decision should be',
        '3. Any updates needed to locked decisions or command-center docs',
        '```',
        '',
        '---',
        '',
        '## To Claude Code (Development)',
        '',
        '```',
        `This is a routing update from the ${stream} stream.`,
        pkgLine,
        '',
        'Before taking any action:',
        '1. Read the routing packet in operator-outbox/',
        '2. Confirm the Coordinator has authorized any development work',
        '3. Do not start a new package without explicit Coordinator authorization',
        '```',
        '',
    ];
    if (nextActions.length) {
        lines.push('---', '', '## Extracted next actions (review before routing)', '');
        nextActions.forEach(a => lines.push(`- ${a}`));
        lines.push('');
    }
    lines.push('---', '', '> Generated by `scripts/process-operator-inbox.mjs`. Suggestions only.');
    // Collapse accidental double blank lines
    return lines.filter((l, i, arr) => !(l === '' && i > 0 && arr[i - 1] === '')).join('\n');
}

// ── File processor ───────────────────────────────────────────────────────────

export function processFile(inputPath, outboxDir = OUTBOX_DIR) {
    const content   = readFileSync(inputPath, 'utf8');
    const extracted = extractAll(inputPath, content);
    if (!existsSync(outboxDir)) mkdirSync(outboxDir, { recursive: true });
    const base    = basename(inputPath, '.md');
    const outputs = {
        routing_md:          join(outboxDir, base + '.routing.md'),
        routing_json:        join(outboxDir, base + '.routing.json'),
        coordinator_summary: join(outboxDir, base + '.coordinator-summary.md'),
        suggested_prompts:   join(outboxDir, base + '.suggested-prompts.md'),
    };
    writeFileSync(outputs.routing_md,          generateRoutingMd(extracted));
    writeFileSync(outputs.routing_json,        generateRoutingJson(extracted));
    writeFileSync(outputs.coordinator_summary, generateCoordinatorSummary(extracted));
    writeFileSync(outputs.suggested_prompts,   generateSuggestedPrompts(extracted));
    return { extracted, outputs };
}

// ── CLI entry point ──────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
    process.argv[1].replace(/\\/g, '/').split('/').pop() === 'process-operator-inbox.mjs';

if (isMain) {
    const args = process.argv.slice(2);
    let inputFile = null;

    if (args.includes('--latest')) {
        if (!existsSync(INBOX_DIR)) {
            console.error('operator-inbox/ directory not found.');
            process.exit(1);
        }
        const files = readdirSync(INBOX_DIR)
            .filter(f => f.endsWith('.md') && f !== 'README.md')
            .sort().reverse();
        if (!files.length) {
            console.error('No inbox files found in operator-inbox/');
            process.exit(1);
        }
        inputFile = join(INBOX_DIR, files[0]);
        console.log('Processing latest:', files[0]);
    } else {
        const idx = args.indexOf('--file');
        if (idx >= 0 && args[idx + 1]) {
            inputFile = join(process.cwd(), args[idx + 1]);
        }
    }

    if (!inputFile) {
        console.error([
            'Usage:',
            '  node scripts/process-operator-inbox.mjs --latest',
            '  node scripts/process-operator-inbox.mjs --file operator-inbox/2026-05-15_development_example.md',
        ].join('\n'));
        process.exit(1);
    }

    if (!existsSync(inputFile)) {
        console.error('File not found:', inputFile);
        process.exit(1);
    }

    const { extracted, outputs } = processFile(inputFile, OUTBOX_DIR);

    console.log('\nStream:     ' + extracted.stream);
    console.log('Packages:   ' + (extracted.packages.join(', ') || 'none'));
    console.log('Commits:    ' + extracted.commits.length);
    console.log('Decisions:  ' + extracted.decisions.length);
    console.log('Routing:    ' + extracted.routingTargets.join(', '));
    console.log('Coordinator approval required: ' + extracted.coordinatorApprovalRequired);
    console.log('\nOutputs written:');
    for (const [, p] of Object.entries(outputs)) {
        console.log('  ' + relative(process.cwd(), p));
    }
}
