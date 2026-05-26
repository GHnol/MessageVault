#!/usr/bin/env node
/**
 * scripts/lib/github-projects-client.mjs
 *
 * Internal library for GitHub Projects via gh CLI + GraphQL.
 * Used by github-project-setup-apply.mjs and github-project-import-issues.mjs.
 *
 * Rules:
 * - No npm dependencies. Node built-ins only.
 * - No token printing, logging, or exposure.
 * - No shell string injection (execFileSync with args array).
 * - All mutation functions require { apply: true } in opts.
 * - Query functions are always read-only and safe to call.
 * - GraphQL uses --input - (stdin JSON) for correct variable typing.
 * - REST calls use GraphQL viewer query instead of /user (more reliable).
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─── Internal gh runner ──────────────────────────────────────────────────────

function runGh(args, { input, timeout = 30000 } = {}) {
  const spawnOpts = { encoding: 'utf8', timeout };
  if (input !== undefined) spawnOpts.input = input;
  try {
    const stdout = execFileSync('gh', args, spawnOpts);
    return { ok: true, stdout };
  } catch (err) {
    const stderr = typeof err.stderr === 'string' ? err.stderr
      : (err.stderr?.toString?.() ?? '');
    const stdout = typeof err.stdout === 'string' ? err.stdout
      : (err.stdout?.toString?.() ?? '');
    return { ok: false, error: err.message, stderr, stdout, exitCode: err.status ?? 1 };
  }
}

// ─── GraphQL runner (primary API surface) ────────────────────────────────────

export function gql(query, variables = {}) {
  const body = JSON.stringify({ query, variables });
  const result = runGh(['api', 'graphql', '--input', '-'], { input: body });
  if (!result.ok) {
    const scopeHint = /scope|not authorized|forbidden|insufficient/i.test(
      result.stderr + result.stdout
    );
    return { ok: false, error: result.error, stderr: result.stderr, scopeHint };
  }
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (e) {
    return { ok: false, error: `Parse error: ${e.message}`, raw: result.stdout.slice(0, 200) };
  }
  if (parsed.errors?.length) {
    const msg = parsed.errors[0]?.message ?? 'GraphQL error';
    const scopeHint = parsed.errors.some(e =>
      /scope|not authorized|forbidden/i.test(e.message ?? '') ||
      e.extensions?.code === 'FORBIDDEN'
    );
    return { ok: false, errors: parsed.errors, error: msg, scopeHint };
  }
  return { ok: true, data: parsed.data };
}

// ─── Mutation safety guard ───────────────────────────────────────────────────

function requireApply(opts) {
  if (!opts?.apply) throw new Error('BUG: mutation called without opts.apply = true');
}

// ─── gh version detection ────────────────────────────────────────────────────

export function getGhVersion() {
  const r = runGh(['--version']);
  if (!r.ok) return { ok: false, installed: false, error: r.error };
  const m = r.stdout.match(/gh version (\d+)\.(\d+)\.(\d+)/);
  if (!m) return { ok: false, installed: true, version: r.stdout.trim() };
  const [, maj, min, pat] = m.map(Number);
  return {
    ok: true,
    installed: true,
    version: `${maj}.${min}.${pat}`,
    major: maj,
    minor: min,
    patch: pat,
    supportsProjectCmd: maj > 2 || (maj === 2 && min >= 28),
  };
}

// ─── Auth probe (read-only, uses GraphQL viewer) ──────────────────────────────

export function probeAuth() {
  const r = gql('{ viewer { login } }');
  if (!r.ok) return { ok: false, authenticated: false, error: r.error };
  const login = r.data?.viewer?.login;
  if (!login) return { ok: false, authenticated: false, error: 'Empty viewer.login' };
  return { ok: true, authenticated: true, login };
}

// ─── Project scope probe (harmless read-only) ─────────────────────────────────

export function probeProjectScope() {
  const r = gql('{ viewer { projectsV2(first: 1) { totalCount } } }');
  if (!r.ok) {
    return { ok: false, hasProjectScope: false, scopeError: r.scopeHint, error: r.error };
  }
  return { ok: true, hasProjectScope: true };
}

// ─── gitignore check ─────────────────────────────────────────────────────────

export function checkGitignored(filePath, cwd) {
  try {
    const out = execFileSync('git', ['check-ignore', '-v', filePath], {
      encoding: 'utf8', cwd, stdio: 'pipe',
    });
    return { ok: true, ignored: out.trim().length > 0 };
  } catch {
    return { ok: true, ignored: false };
  }
}

// ─── Sync map read / write / merge ───────────────────────────────────────────

export function readSyncMap(filePath) {
  if (!existsSync(filePath)) return { ok: true, data: null };
  try {
    return { ok: true, data: JSON.parse(readFileSync(filePath, 'utf8')) };
  } catch (e) {
    return { ok: false, error: `Cannot parse sync map: ${e.message}` };
  }
}

export function writeSyncMap(filePath, data, opts) {
  requireApply(opts);
  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Cannot write sync map: ${e.message}` };
  }
}

export function mergeSyncMap(existing, updates) {
  const base = existing ?? {
    _format_version: '2',
    _default_board_provider: 'github_projects',
    github_projects: {},
  };
  const gp = { ...(base.github_projects ?? {}) };
  if (updates._project_meta) gp._project_meta = { ...gp._project_meta, ...updates._project_meta };
  if (updates._field_ids) gp._field_ids = { ...gp._field_ids, ...updates._field_ids };
  if (updates._option_ids) {
    gp._option_ids = gp._option_ids ?? {};
    for (const [k, v] of Object.entries(updates._option_ids)) {
      gp._option_ids[k] = { ...gp._option_ids[k], ...v };
    }
  }
  if (updates.issues) {
    for (const [osId, entry] of Object.entries(updates.issues)) {
      gp[osId] = { ...gp[osId], ...entry };
    }
  }
  return { ...base, _last_updated: new Date().toISOString().slice(0, 10), github_projects: gp };
}

// ─── Sync log append ─────────────────────────────────────────────────────────

export function appendSyncLog(logPath, entryMarkdown, opts) {
  requireApply(opts);
  try {
    const raw = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
    const marker = '## Log entries (newest first)';
    const idx = raw.indexOf(marker);
    const block = `\n---\n\n${entryMarkdown}\n`;
    const updated = idx >= 0
      ? raw.slice(0, idx + marker.length) + block + raw.slice(idx + marker.length)
      : raw + block;
    writeFileSync(logPath, updated, 'utf8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Cannot update sync log: ${e.message}` };
  }
}

// ─── Owner / repo resolution ──────────────────────────────────────────────────

export function resolveOwnerId(owner) {
  const ur = gql('query($l: String!) { user(login: $l) { id } }', { l: owner });
  if (ur.ok && ur.data.user) return { ok: true, id: ur.data.user.id, type: 'user' };
  const or = gql('query($l: String!) { organization(login: $l) { id } }', { l: owner });
  if (or.ok && or.data.organization) return { ok: true, id: or.data.organization.id, type: 'org' };
  return { ok: false, error: `Cannot resolve owner ID for: ${owner}` };
}

export function getRepositoryId(owner, repo) {
  const r = gql(
    'query($o: String!, $n: String!) { repository(owner: $o, name: $n) { id } }',
    { o: owner, n: repo }
  );
  if (!r.ok) return r;
  if (!r.data.repository) return { ok: false, error: 'Repository not found' };
  return { ok: true, id: r.data.repository.id };
}

// ─── Project discovery ────────────────────────────────────────────────────────

export function findProject(owner, projectTitle, projectNumber) {
  const fragment = 'nodes { id number title url }';
  const userR = gql(
    `query($l: String!) { user(login: $l) { id projectsV2(first: 100) { ${fragment} } } }`,
    { l: owner }
  );
  let ownerId = null;
  let projects = null;
  if (userR.ok && userR.data.user) {
    ownerId = userR.data.user.id;
    projects = userR.data.user.projectsV2.nodes;
  } else {
    const orgR = gql(
      `query($l: String!) { organization(login: $l) { id projectsV2(first: 100) { ${fragment} } } }`,
      { l: owner }
    );
    if (orgR.ok && orgR.data.organization) {
      ownerId = orgR.data.organization.id;
      projects = orgR.data.organization.projectsV2.nodes;
    }
  }
  if (!projects) return { ok: false, found: false, error: 'Cannot query projects for owner' };
  let match = null;
  if (projectNumber && projectNumber > 0) match = projects.find(p => p.number === projectNumber);
  if (!match && projectTitle) match = projects.find(p => p.title === projectTitle);
  return { ok: true, found: !!match, project: match ?? null, ownerId };
}

// ─── Project fields ───────────────────────────────────────────────────────────

export function getProjectFields(projectId) {
  const r = gql(
    `query($pid: ID!) {
      node(id: $pid) {
        ... on ProjectV2 {
          fields(first: 50) {
            nodes {
              ... on ProjectV2Field { id name dataType }
              ... on ProjectV2SingleSelectField { id name dataType options { id name } }
              ... on ProjectV2IterationField { id name dataType }
            }
          }
        }
      }
    }`,
    { pid: projectId }
  );
  if (!r.ok) return r;
  return { ok: true, fields: r.data?.node?.fields?.nodes ?? [] };
}

// ─── Project items (for dedup) ────────────────────────────────────────────────

export function getProjectItemIssueIds(projectId) {
  const r = gql(
    `query($pid: ID!) {
      node(id: $pid) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              content { ... on Issue { id number } }
            }
          }
        }
      }
    }`,
    { pid: projectId }
  );
  if (!r.ok) return r;
  return {
    ok: true,
    items: (r.data?.node?.items?.nodes ?? []).map(i => ({
      itemId: i.id,
      issueNodeId: i.content?.id ?? null,
      issueNumber: i.content?.number ?? null,
    })),
  };
}

// ─── Issue search (OS ID marker) ─────────────────────────────────────────────

export function searchIssueByOsId(owner, repo, osId) {
  const marker = `<!-- ai-os-id: ${osId} -->`;
  const q = encodeURIComponent(`${osId} in:body repo:${owner}/${repo}`);
  const r = runGh(['api', `/search/issues?q=${q}&per_page=10&state=all`]);
  if (!r.ok) return { ok: false, found: false, error: r.error };
  try {
    const data = JSON.parse(r.stdout);
    const match = (data.items ?? []).find(i => i.body?.includes(marker));
    return { ok: true, found: !!match, issue: match ?? null };
  } catch (e) {
    return { ok: false, found: false, error: e.message };
  }
}

export function getIssueNodeId(owner, repo, issueNumber) {
  const r = gql(
    'query($o: String!, $n: String!, $num: Int!) { repository(owner: $o, name: $n) { issue(number: $num) { id } } }',
    { o: owner, n: repo, num: issueNumber }
  );
  if (!r.ok) return r;
  const id = r.data?.repository?.issue?.id;
  if (!id) return { ok: false, error: `Issue #${issueNumber} not found` };
  return { ok: true, nodeId: id };
}

// ─── Mutations (all require opts.apply = true) ────────────────────────────────

export function createProject(ownerId, title, opts) {
  requireApply(opts);
  const r = gql(
    'mutation($oid: ID!, $t: String!) { createProjectV2(input: { ownerId: $oid, title: $t }) { projectV2 { id number title url } } }',
    { oid: ownerId, t: title }
  );
  if (!r.ok) return r;
  return { ok: true, project: r.data.createProjectV2.projectV2 };
}

export function copyProject(templateProjectId, ownerId, title, opts) {
  requireApply(opts);
  const r = gql(
    `mutation($pid: ID!, $oid: ID!, $t: String!) {
      copyProjectV2(input: { projectId: $pid, ownerId: $oid, title: $t, includeDraftIssues: false }) {
        projectV2 { id number title url }
      }
    }`,
    { pid: templateProjectId, oid: ownerId, t: title }
  );
  if (!r.ok) return r;
  return { ok: true, project: r.data.copyProjectV2.projectV2 };
}

export function linkProjectToRepo(projectId, repositoryId, opts) {
  requireApply(opts);
  const r = gql(
    'mutation($pid: ID!, $rid: ID!) { linkProjectV2ToRepository(input: { projectId: $pid, repositoryId: $rid }) { repository { id } } }',
    { pid: projectId, rid: repositoryId }
  );
  if (!r.ok) return r;
  return { ok: true };
}

export function createTextField(projectId, name, opts) {
  requireApply(opts);
  const r = gql(
    'mutation($pid: ID!, $n: String!) { createProjectV2Field(input: { projectId: $pid, name: $n, dataType: TEXT }) { projectV2Field { ... on ProjectV2Field { id name dataType } } } }',
    { pid: projectId, n: name }
  );
  if (!r.ok) return r;
  return { ok: true, field: r.data.createProjectV2Field.projectV2Field };
}

export function createDateField(projectId, name, opts) {
  requireApply(opts);
  const r = gql(
    'mutation($pid: ID!, $n: String!) { createProjectV2Field(input: { projectId: $pid, name: $n, dataType: DATE }) { projectV2Field { ... on ProjectV2Field { id name dataType } } } }',
    { pid: projectId, n: name }
  );
  if (!r.ok) return r;
  return { ok: true, field: r.data.createProjectV2Field.projectV2Field };
}

function safeStr(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function createSingleSelectField(projectId, name, options, opts) {
  requireApply(opts);
  const optStr = options.map(o => `{ name: "${safeStr(o)}", color: GRAY, description: "" }`).join(', ');
  const r = gql(
    `mutation($pid: ID!, $n: String!) {
      createProjectV2Field(input: {
        projectId: $pid
        name: $n
        dataType: SINGLE_SELECT
        singleSelectOptions: [${optStr}]
      }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField { id name dataType options { id name } }
        }
      }
    }`,
    { pid: projectId, n: name }
  );
  if (!r.ok) return r;
  return { ok: true, field: r.data.createProjectV2Field.projectV2Field };
}

export function addProjectItem(projectId, contentId, opts) {
  requireApply(opts);
  const r = gql(
    'mutation($pid: ID!, $cid: ID!) { addProjectV2ItemById(input: { projectId: $pid, contentId: $cid }) { item { id } } }',
    { pid: projectId, cid: contentId }
  );
  if (!r.ok) return r;
  return { ok: true, itemId: r.data.addProjectV2ItemById.item.id };
}

export function setFieldText(projectId, itemId, fieldId, text, opts) {
  requireApply(opts);
  const r = gql(
    `mutation($pid: ID!, $iid: ID!, $fid: ID!, $val: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $pid, itemId: $iid, fieldId: $fid, value: { text: $val }
      }) { projectV2Item { id } }
    }`,
    { pid: projectId, iid: itemId, fid: fieldId, val: text }
  );
  if (!r.ok) return r;
  return { ok: true };
}

export function setFieldSingleSelect(projectId, itemId, fieldId, optionId, opts) {
  requireApply(opts);
  const r = gql(
    `mutation($pid: ID!, $iid: ID!, $fid: ID!, $opt: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $pid, itemId: $iid, fieldId: $fid, value: { singleSelectOptionId: $opt }
      }) { projectV2Item { id } }
    }`,
    { pid: projectId, iid: itemId, fid: fieldId, opt: optionId }
  );
  if (!r.ok) return r;
  return { ok: true };
}

export function setFieldDate(projectId, itemId, fieldId, date, opts) {
  requireApply(opts);
  const r = gql(
    `mutation($pid: ID!, $iid: ID!, $fid: ID!, $d: Date!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $pid, itemId: $iid, fieldId: $fid, value: { date: $d }
      }) { projectV2Item { id } }
    }`,
    { pid: projectId, iid: itemId, fid: fieldId, d: date }
  );
  if (!r.ok) return r;
  return { ok: true };
}

function ensureLabel(owner, repo, labelName) {
  const check = runGh(['label', 'list', '--repo', `${owner}/${repo}`, '--search', labelName, '--json', 'name']);
  if (check.ok) {
    try {
      const found = JSON.parse(check.stdout);
      if (Array.isArray(found) && found.some(l => l.name === labelName)) return;
    } catch (_) { /* fall through to create */ }
  }
  runGh(['label', 'create', '--repo', `${owner}/${repo}`, labelName, '--color', 'ededed']);
}

export function createGhIssue(owner, repo, title, body, labels, milestone, opts) {
  requireApply(opts);
  for (const label of (labels ?? [])) ensureLabel(owner, repo, label);
  const args = ['issue', 'create',
    '--repo', `${owner}/${repo}`,
    '--title', title,
    '--body', body,
  ];
  for (const label of (labels ?? [])) args.push('--label', label);
  if (milestone) args.push('--milestone', String(milestone));
  const r = runGh(args);
  if (!r.ok) return { ok: false, error: r.error, stderr: r.stderr };
  const url = r.stdout.trim().split('\n').filter(Boolean).pop() ?? '';
  const m = url.match(/\/issues\/(\d+)$/);
  if (!m) return { ok: false, error: `Cannot parse issue URL: ${url}` };
  return { ok: true, number: parseInt(m[1], 10), url };
}

// ─── Field definition constants ───────────────────────────────────────────────

export const REQUIRED_FIELDS = [
  { name: 'OS ID',               key: 'os_id',                dataType: 'TEXT' },
  { name: 'Package',             key: 'package',              dataType: 'TEXT' },
  { name: 'Phase',               key: 'phase',                dataType: 'TEXT' },
  { name: 'Lane',                key: 'lane',                 dataType: 'SINGLE_SELECT',
    options: ['Development', 'Product', 'Design', 'QA', 'Vendor', 'Operations',
              'Growth', 'Legal', 'Finance', 'OS Infrastructure', 'AI Agent',
              'Coordinator', 'Founder', 'Backlog'] },
  { name: 'Source File',         key: 'source_file',          dataType: 'TEXT' },
  { name: 'Last Repo Sync',      key: 'last_repo_sync',       dataType: 'DATE' },
  { name: 'External Sync Status', key: 'external_sync_status', dataType: 'SINGLE_SELECT',
    options: ['in-sync', 'drift', 'unknown', 'not-tracked'] },
  { name: 'Risk Level',          key: 'risk_level',           dataType: 'SINGLE_SELECT',
    options: ['Low', 'Medium', 'High'] },
  { name: 'Decision Needed',     key: 'decision_needed',      dataType: 'TEXT' },
  { name: 'Calendar Relevant',   key: 'calendar_relevant',    dataType: 'TEXT' },
  { name: 'TickTick Relevant',   key: 'ticktick_relevant',    dataType: 'TEXT' },
  { name: 'Owner Role',          key: 'owner_role',           dataType: 'SINGLE_SELECT',
    options: ['Founder', 'Coordinator', 'Claude', 'Codex', 'Development',
              'Vendor', 'Design', 'Product', 'QA'] },
  { name: 'Success Criteria',    key: 'success_criteria',     dataType: 'TEXT' },
];

export const REQUIRED_STATUSES = [
  'Not Started', 'In Progress', 'In Review', 'Blocked',
  'Waiting', 'Approved', 'Done', 'Deferred', 'Cancelled',
];

export const REQUIRED_VIEWS = [
  'Board', 'Table', 'Current Sprint', 'Backlog', 'Review / QA',
  'Waiting / Blocked', 'Done', 'Risks / Decisions', 'Calendar Relevant',
  'TickTick Relevant', 'By Package', 'By Phase', 'By Lane', 'Decision Needed',
];

export const VALID_STATUSES = new Set([
  'Not Started', 'In Progress', 'In Review', 'Blocked',
  'Waiting', 'Approved', 'Done', 'Deferred', 'Cancelled',
]);

export const VALID_OWNER_ROLES = new Set([
  'Founder', 'Coordinator', 'Claude', 'Codex', 'Development',
  'Vendor', 'Design', 'Product', 'QA',
]);

export const VALID_RISK_LEVELS = new Set(['Low', 'Medium', 'High']);

// ─── Source record parser ─────────────────────────────────────────────────────

export function parseSourceRecords(raw) {
  let records;
  try {
    records = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `JSON parse error: ${e.message}` };
  }
  if (!Array.isArray(records)) records = [records];

  const errors = [];
  const seen = new Set();
  const out = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const prefix = `Record[${i}]`;

    if (!r.os_id || typeof r.os_id !== 'string') {
      errors.push(`${prefix}: missing or invalid os_id`); continue;
    }
    if (seen.has(r.os_id)) {
      errors.push(`${prefix}: duplicate os_id "${r.os_id}"`); continue;
    }
    seen.add(r.os_id);

    if (!r.title || typeof r.title !== 'string' || !r.title.trim()) {
      errors.push(`${prefix} (${r.os_id}): missing title`); continue;
    }
    if (r.status && !VALID_STATUSES.has(r.status)) {
      errors.push(`${prefix} (${r.os_id}): invalid status "${r.status}"`); continue;
    }
    if (r.owner_role && !VALID_OWNER_ROLES.has(r.owner_role)) {
      errors.push(`${prefix} (${r.os_id}): invalid owner_role "${r.owner_role}"`); continue;
    }
    if (r.risk_level && !VALID_RISK_LEVELS.has(r.risk_level)) {
      errors.push(`${prefix} (${r.os_id}): invalid risk_level "${r.risk_level}"`); continue;
    }

    const body = buildIssueBody(r);
    const labels = buildLabels(r);

    out.push({
      os_id: r.os_id,
      title: r.title.trim(),
      body,
      type: r.type ?? 'task',
      package: r.package ?? '',
      phase: r.phase != null ? String(r.phase) : '',
      lane: r.lane ?? '',
      status: r.status ?? 'Not Started',
      priority: r.priority ?? '',
      risk_level: r.risk_level ?? '',
      decision_needed: r.decision_needed === true || r.decision_needed === 'true' ? 'true' : 'false',
      calendar_relevant: r.calendar_relevant === true || r.calendar_relevant === 'true' ? 'true' : 'false',
      ticktick_relevant: r.ticktick_relevant === true || r.ticktick_relevant === 'true' ? 'true' : 'false',
      owner_role: r.owner_role ?? '',
      source_file: r.source_file ?? '',
      success_criteria: r.success_criteria ?? '',
      dependencies: Array.isArray(r.dependencies) ? r.dependencies : [],
      labels,
      milestone: r.milestone ?? '',
      last_repo_sync: r.last_repo_sync ?? new Date().toISOString().slice(0, 10),
      external_sync_status: r.external_sync_status ?? 'not-tracked',
      _raw: r,
    });
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, records: out };
}

function buildIssueBody(r) {
  const marker = `<!-- ai-os-id: ${r.os_id} -->`;
  const parts = [];
  if (r.body) parts.push(r.body.trim());
  if (r.success_criteria) parts.push(`\n## Success Criteria\n${r.success_criteria}`);
  if (r.dependencies?.length) {
    parts.push(`\n## Dependencies\n${r.dependencies.map(d => `- \`${d}\``).join('\n')}`);
  }
  parts.push(`\n## OS Metadata\n- **OS ID:** \`${r.os_id}\`\n- **Type:** ${r.type ?? 'task'}\n- **Source:** \`${r.source_file ?? ''}\`\n\n${marker}`);
  return parts.join('\n');
}

function buildLabels(r) {
  const labels = new Set(Array.isArray(r.labels) ? r.labels : []);
  if (r.type) labels.add(r.type);
  if (r.risk_level === 'High') labels.add('risk-high');
  if (r.decision_needed === true || r.decision_needed === 'true') labels.add('decision-needed');
  if (r.calendar_relevant === true || r.calendar_relevant === 'true') labels.add('calendar');
  return [...labels];
}
