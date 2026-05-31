# AI Project OS — Changelog

**Status:** ACTIVE.
**Scope:** This changelog tracks changes to the **AI Project OS layer** of this repo — the agent operating system, the universal standards, the dev/QA protocols, the continuity files, and the AI-facing parts of `.claude/` / `.codex/` / `docs/automation/`.

It is **not** a product changelog. Product-level package history lives in `docs/ops/backlog-roadmap.md` and `docs/command-center/current-status.md`.

Newest entries first.

---

## 2026-05-31 — AI Project OS v1.6: Google Calendar Live Sync, Gate 2D Repair — Canonical OAuth Bootstrap

**Status:** IN PROGRESS — on branch `docs/google-calendar-oauth-path-alignment`, uncommitted. No OAuth run. No live API call. No product code. No Package 5B.
**Scope:** Repair Gate 2D tooling blocker. Align credential/token paths to canonical `docs/project-control/` convention. Add `scripts/google-calendar-auth-bootstrap.mjs` with `--auth-status` and `--init-oauth`. Update dry-run script with `--auth-status`, `--help`, `resolveCredPaths()`, and explicit legacy root credential fallback. Update docs, skill, runbook, credential guide, OS audit checks.

### Added

- `scripts/google-calendar-auth-bootstrap.mjs` — canonical OAuth bootstrap script: `--auth-status` (existence + gitignore checks only), `--init-oauth` (full OAuth flow — NOT RUN in this repair), `--credential-path`, `--token-path`, `--allow-legacy-root-credentials`

### Updated

- `scripts/google-calendar-sync-dry-run.mjs` — canonical credential/token path defaults (`CANONICAL_CREDENTIALS_FILE`, `CANONICAL_TOKEN_FILE`); legacy root fallback only with `--allow-legacy-root-credentials` (warns `LEGACY_ROOT_CREDENTIAL_PATH_USED`); new modes: `--auth-status`, `--help`; `resolveCredPaths()` function; missing-token message changed from `CREDENTIAL_MISSING` to `OAUTH_BOOTSTRAP_REQUIRED` with bootstrap command
- `docs/project-control/google-calendar-credentials.example.md` — canonical paths documented; one-time setup steps updated to `--init-oauth`; detecting-missing-credentials section updated
- `docs/project-control/google-calendar-sync-runbook.md` — Gate 2B prerequisites updated to canonical paths and `--auth-status` / `--init-oauth` flow; pre-flight updated
- `.claude/skills/google-calendar-sync/SKILL.md` — Gate 2B section updated with canonical paths, auth-status, and init-oauth; credential safety section updated; hard stops updated
- `scripts/os-self-audit.mjs` — added canonical credential/token path gitignore checks; added `google-calendar-auth-bootstrap.mjs` file and content checks
- `docs/project-control/google-calendar-sync-log.md` — Gate 2D Repair entry added
- `docs/ai-system/CHANGELOG.md` — this entry
- `docs/ai-system/version-history.md` — v1.6.2 row added

### Intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- `scripts/package.json`, root `package.json`, root `package-lock.json` — no dependency changes
- No live Google Calendar API calls
- No OAuth flow run
- No credential files created, read, or written
- `docs/project-control/external-sync-map.local.json` — not read or written
- `scripts/google-calendar-sync-apply.mjs` — credential path alignment deferred to future pass (Gate 3 is not yet authorized)
- No GitHub Project mutations

---

## 2026-05-31 — AI Project OS v1.6: Google Calendar Live Sync, Gate 2A

**Status:** IN PROGRESS — Gate 2A comparison logic on branch `docs/google-calendar-live-dry-run-logic`, uncommitted. Gate 2B (live dry-run) requires googleapis install approval + credentials.
**Scope:** Implement fixture-testable live comparison logic in `google-calendar-sync-dry-run.mjs`. All 11 classification values proved locally. No live API calls. No product code. No Package 5B.

### Added

- `docs/project-control/google-calendar-live-events.fixture.json` — committed fixture file with fake/mock Google Calendar event data exercising all 11 classification values: NO_OP, UPDATE, ADOPTION_REQUIRED, DUPLICATE_DETECTED, CREATE, REMOTE_DRIFT, MAPPED_EVENT_MISSING_REMOTELY, POSSIBLE_DUPLICATE, NEEDS_MANUAL_REVIEW, DELETE_CANCEL_CANDIDATE, MISSING_LOCAL_MAPPING (advisory)

### Updated

- `scripts/google-calendar-sync-dry-run.mjs` — full comparison logic implemented:
  - `--fixture <path>` mode: fixture/mock comparison, no credentials, no googleapis; writes gitignored artifact
  - `--live-readonly` mode: live Google Calendar API (dynamically imports googleapis to not block local/fixture modes); credential check; dependency check with `LIVE_READINESS_BLOCKED_DEPENDENCY_MISSING` message; not run in Gate 2A
  - `--local-only` mode: unchanged from Gate 1
  - Pure comparison functions: `extractDescMarker`, `comparePayload`, `classifySourceRecord`, `compareSourceToEvents`, `buildArtifact`
  - All 11 classification values with `apply_blocker` flags, `confidence`, `reason`, `required_resolution`
  - `POSSIBLE_DUPLICATE` is advisory (does not block Gate 3 apply)
  - `MISSING_LOCAL_MAPPING` appears as advisory flag on NO_OP/UPDATE/REMOTE_DRIFT results
  - Artifact schema: `schema_version`, `generated_at`, `mode`, `gate3_apply_allowed`, `gate3_blockers`, `delete_cancel_candidates`, `warnings`, `results`
  - Output path guard: verifies `local-sync-reports/` is gitignored before writing
- `docs/project-control/google-calendar-sync-runbook.md` — Gate 2 split into Gate 2A (fixture) and Gate 2B (live); all 11 classifications documented; live mode renamed `--live-readonly`
- `docs/project-control/google-calendar-sync-log.md` — Gate 2A entry recorded
- `AI_HANDOFF.md` — updated to Gate 2A in-progress state
- `CURRENT_STATE.md` — updated: Gate 2A in progress, Gate 2B requires googleapis + credentials

### Intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- `scripts/package.json`, root `package.json`, root `package-lock.json` — no dependency changes
- No live Google Calendar mutations
- No credential files created, read, or used
- `googleapis` not installed (requires separate Coordinator approval)
- `docs/project-control/external-sync-map.local.json` — not read or written

---

## 2026-05-30 — AI Project OS v1.6: Google Calendar Live Sync, Gate 1

**Status:** IN PROGRESS — Gate 1 implementation on branch `docs/google-calendar-live-sync-gate-1`; Gate 2 (live dry-run) and Gate 3 (live apply) require separate Coordinator authorization.
**Scope:** Establish the repo-native Google Calendar live sync foundation. Real live sync (not .ics-only). Three-gate model: Gate 1 = repo foundation (this pass), Gate 2 = read-only live dry-run, Gate 3 = approved live apply. No app code; no Package 5B work; no v1.7 automation.

### Added

- `docs/project-control/google-calendar-source-schema.md` — canonical field schema for Google Calendar source records; field definitions, routing table, dry-run classification categories, duplicate prevention markers
- `docs/project-control/google-calendar-source-records.json` — 10 committed source records (8 recurring rituals + 2 milestone placeholders); `AI_OS_ID:` marker in every description; `os_id`-based `duplicate_key`
- `docs/project-control/google-calendar-sync-policy.md` — authoritative v1.6 sync policy: gate model, source-of-truth hierarchy, what belongs in calendar, GitHub Project relationship, adoption rule for 2026-05-17 imported events, duplicate prevention, apply safety rules, .ics fallback role
- `docs/project-control/google-calendar-sync-runbook.md` — step-by-step gate procedures: pre-flight, Gate 1 verification, Gate 2 live dry-run, Gate 3 live apply, delete/cancel procedure, credential blocker handling, sync log format, Puzzle alignment
- `docs/project-control/google-calendar-credentials.example.md` — credential safety rules, gitignored file list, preferred auth path (User OAuth vs service account), required API scopes, one-time setup steps, `googleapis` dependency documentation, credential blocker handling
- `docs/project-control/google-calendar-sync-log.md` — canonical v1.6+ sync log; Gate 1 entry recorded; legacy `calendar-sync-log.md` preserved as historical record for 2026-05-17 import
- `scripts/google-calendar-source-validate.mjs` — validates source records: required fields, os_id uniqueness, ISO datetime format, timezone, RRULE if present, calendar_role, status, no event IDs, no credential strings, AI_OS_ID marker matches os_id; exit 0 = pass
- `scripts/google-calendar-sync-dry-run.mjs` — local mode (Gate 1, no credentials): validates records, generates intended payloads with AI_OS_ID and extendedProperties markers, classifies READY_FOR_LIVE_COMPARE or INVALID_SOURCE; live mode (Gate 2, guarded): credential check, googleapis check, GATE_2 placeholder; structured output for v1.7 mirroring
- `scripts/google-calendar-sync-apply.mjs` — hard-stop apply scaffold: requires --apply, --approved-dry-run artifact, gitignore guards (token.json, external-sync-map.local.json), credential presence, delete requires --delete --os-id per item, GATE_3_AUTHORIZED guard (false in Gate 1); plan mode prints full expected behavior
- `scripts/generate-project-calendar.mjs` — generates `keepmees-project-calendar.ics` from source records; stable UIDs as `<os_id>@keepmees.local`; AI_OS_ID markers in descriptions; ICS line folding and escaping; --dry-run and --check modes; no API calls
- `.claude/skills/google-calendar-sync/SKILL.md` — new skill: Gate 1/2/3 distinction, dry-run-first requirement, create/update default, delete/cancel separate approval, local sync-map rules, credential safety, structured output, hard stop conditions, approval boundaries
- `.claude/commands/google-calendar-sync.md` — thin command wrapper → delegates to `google-calendar-sync` skill

### Updated

- `.gitignore` — added `token.json`, `**/token.json`, `google-calendar-token.json`, `docs/project-control/google-calendar-token.local.json`
- `docs/project-control/calendar-sync-log.md` — marked LEGACY; pointer to `google-calendar-sync-log.md`
- `docs/project-control/calendar-sync-policy.md` — marked LEGACY for static .ics model; pointer to `google-calendar-sync-policy.md`
- `docs/ai-system/os-self-audit-checklist.md` — Section 6e added (20 v1.6 checks); Scripts table updated
- `scripts/os-self-audit.mjs` — Section 6e checks added (files, skill/command, gitignore, grep-based content checks)
- `scripts/project-control-sync-dry-run.mjs` — `google-calendar-source-records.json`, `google-calendar-sync-policy.md`, `google-calendar-sync-log.md` added to required-files check
- `.claude/skills/README.md` — count updated to 16; `google-calendar-sync` row added
- `.claude/commands/README.md` — `/google-calendar-sync` row added
- `docs/ai-system/CHANGELOG.md` — this entry
- `docs/ai-system/version-history.md` — v1.6 row added

### Intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- No live Google Calendar mutations
- No credential files created or used
- No `external-sync-map.local.json` read or written
- No Package 5B planning or implementation
- No v1.7 automation (hooks, mirroring, start router, model routing changes)
- No secrets, tokens, or credentials committed

### Key design decisions

- Three-gate model: Gate 1 = repo foundation (no API), Gate 2 = read-only dry-run (separate auth), Gate 3 = apply (separate auth + artifact required)
- `google-calendar-sync-log.md` is canonical for v1.6+ operations; `calendar-sync-log.md` preserved as legacy for 2026-05-17 import record
- Duplicate prevention: `AI_OS_ID: <os_id>` in description (primary) + `extendedProperties.private.ai_os_id` in API payload (Gate 3)
- Adoption rule: 2026-05-17 imported events need manual AI_OS_ID marker addition before Gate 2 can classify safely (adoption guide in sync policy)
- GATE_3_AUTHORIZED constant in apply script: false in Gate 1; set to true only when Gate 3 is explicitly authorized
- `googleapis` dependency: not installed in Gate 1; scripts-local only (do not modify root package.json); separate Coordinator approval required for Gate 2
- `generate-project-calendar.mjs` uses `<os_id>@keepmees.local` UIDs for stable ICS regeneration
- Dependency-free Node ESM for all Gate 1 scripts (no `googleapis` calls in Gate 1)
- v1.6 complete only when Gate 3 succeeds for KeepMees (or documented credential/platform blocker)

---

## 2026-05-26 — AI Project OS v1.5: Template GitHub Project Standard

**Status:** COMPLETE — Gate 1 merged `7c2c511`; Gate 2 complete 2026-05-27
**Scope:** Establish the canonical AI Project OS GitHub Project template standard. Template-copy becomes the preferred setup path; create-from-scratch is fallback only. Canonical Status vocabulary updated (v1.5). Two-gate closeout model. Gate 2: dedicated "AI Project OS Template" project created under GHnol (Project #2); 13 canonical custom fields provisioned; 14 views created by Founder; Status field set to v1.5 canonical. No app code; no Package 5B work.

### Added

- `docs/project-control/github-projects-template-standard.md` — canonical template standard: two-gate closeout model; v1.5 Status vocabulary; canonical field set, view set, status/owner-role/external-sync options; migration table from v1.3/v1.4
- `docs/project-control/github-projects-template-copy-runbook.md` — step-by-step Gate 1/Gate 2 runbook: pre-flight, template source options, validation, copy-from-template, Gate 2 closeout
- `docs/project-control/github-projects-template-config.example.json` — committed example config (placeholder IDs only); shows full spec including v1.5 status options, all 13 fields, 14 views, 9 owner roles
- `scripts/github-project-template-dry-run.mjs` — read-only dry-run: docs check, template config detection (Gate 2 status), example config validation, gitignore check, gh CLI check, planned apply behavior
- `scripts/github-project-template-validate.mjs` — config validation: required keys, placeholder safety, old vocabulary check, status options, required fields, views, owner roles, external sync status, optional live GitHub probe (read-only)
- `scripts/github-project-template-apply.mjs` — Gate 2 apply: `--create-template`, `--copy-from-template`, `--validate-template`; all Gate 2 mutations guarded by `--apply`; Gate 1 is plan mode only
- `.claude/skills/github-project-template/SKILL.md` — new skill: template dry-run, validate, Gate 2 apply; two-gate model; approval boundaries; canonical vocabulary reference
- `.claude/commands/github-project-template.md` — thin command wrapper → delegates to `github-project-template` skill; `/github-project-template`

### Updated

- `scripts/lib/github-projects-client.mjs` — REQUIRED_STATUSES and VALID_STATUSES updated to v1.5 canonical vocabulary (8 values: Backlog, Ready, In Progress, Review / QA, Waiting / Blocked, Done / Shipped, Deferred, Cancelled)
- `scripts/github-project-setup-apply.mjs` — config-driven template-copy-first logic: auto-detects `github-projects-template-config.local.json`; selects `--from-template` path if real template IDs present; falls back to create-from-scratch if no config
- `scripts/github-project-setup-dry-run.mjs` — adds template config detection section to dry-run output
- `scripts/os-self-audit.mjs` — Section 6d checks added for v1.5 template standard layer
- `docs/project-control/github-projects-setup-policy.md` — Status vocabulary updated to v1.5 canonical (8 options); view filters updated; template-copy preferred path section added
- `docs/project-control/github-projects-import-runbook.md` — template copy section added (Step 1b)
- `docs/project-control/external-sync-safety.md` — template config safety rules added
- `docs/project-control/project-sync-policy.md` — template-copy as preferred setup path added
- `docs/ai-system/universal-standards.md` — github-project-template skill added to automation table
- `docs/ai-system/bootstrap-template.md` — § 6 updated: template-copy preferred, create-from-scratch fallback
- `docs/ai-system/os-self-audit-checklist.md` — Section 6d added (AI Project OS v1.5 template standard layer)
- `.claude/skills/README.md` — `github-project-template` skill added to roster
- `.claude/commands/README.md` — `/github-project-template` command added to roster
- `.claude/skills/github-project-setup/SKILL.md` — references template-copy as preferred path
- `.gitignore` — `docs/project-control/github-projects-template-config.local.json` added
- `docs/project-control/github-projects-source-records.json` — status vocabulary migrated to v1.5; KM-PC-011 status updated to reflect v1.5 activation
- `docs/ai-system/CHANGELOG.md` — v1.4 status corrected (IN PROGRESS → COMPLETE); this v1.5 entry added
- `docs/ai-system/version-history.md` — v1.4 row corrected; v1.5 row added

### Intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- No live GitHub API apply during Gate 1 implementation
- No GitHub Project created during Gate 1
- No GitHub Issues imported during Gate 1
- No `github-projects-template-config.local.json` written during Gate 1
- No `external-sync-map.local.json` written during Gate 1
- No Package 5B planning or implementation
- No secrets, tokens, or credentials committed

### Key design decisions

- Two-gate model: Gate 1 is repo infrastructure; Gate 2 is live template creation (separate Coordinator authorization — completed 2026-05-27)
- Template-copy preferred over create-from-scratch: auto-detected from local config; no user flag needed
- REQUIRED_STATUSES updated from 9 (v1.4) to 8 (v1.5): removes Not Started, In Review, Blocked, Waiting, Approved, Done; adds Backlog, Ready, Review / QA, Waiting / Blocked, Done / Shipped
- Vocabulary migration: source records in repo migrated to v1.5; live KeepMees board Status options confirmed as v1.5 canonical via read-only live check (2026-05-27 — no field repair needed)
- `github-projects-template-config.local.json` gitignored (contains real template IDs); example file committed (placeholder IDs only)
- Canonical risk view is "High Risks" (Risk Level = High only) — GitHub Projects does not support OR across different fields; original spec "Risks / Decisions" (Risk Level = High OR Decision Needed = true) is split into "High Risks" + "Decision Needed" as separate views
- Gate 2 (2026-05-27): "AI Project OS Template" (Project #2) created under GHnol; 13/13 canonical custom fields provisioned via script; Status options configured to 8 v1.5 values; 14 views created by Founder in GitHub UI; local config written (gitignored)

---

## 2026-05-25 — AI Project OS v1.4: GitHub Projects Live Provisioning Integration

**Status:** COMPLETE — merged to `main` as `1623e7e` on 2026-05-26
**Scope:** Make GitHub Projects apply scripts real and apply-capable. No app code; no live apply during implementation; no Package 5B work. Implements client library, three-layer duplicate detection, sync map writing, incremental apply, and all script dry-runs verified against live GitHub auth.

### Added

- `scripts/lib/github-projects-client.mjs` — core helper module for all GitHub ProjectV2 GraphQL and REST operations; uses `gh api graphql --input -` (stdin JSON); `execFileSync` with args array (no shell injection); all mutations require `{ apply: true }`; exports: `gql`, `getGhVersion`, `probeAuth`, `probeProjectScope`, `checkGitignored`, `readSyncMap`, `writeSyncMap`, `mergeSyncMap`, `appendSyncLog`, `resolveOwnerId`, `getRepositoryId`, `findProject`, `getProjectFields`, `getProjectItemIssueIds`, `searchIssueByOsId`, `getIssueNodeId`, `createProject`, `copyProject`, `linkProjectToRepo`, `createTextField`, `createDateField`, `createSingleSelectField`, `addProjectItem`, `setFieldText`, `setFieldSingleSelect`, `setFieldDate`, `createGhIssue`, `parseSourceRecords`, `REQUIRED_FIELDS`, `REQUIRED_STATUSES`, `REQUIRED_VIEWS`, `VALID_STATUSES`, `VALID_OWNER_ROLES`, `VALID_RISK_LEVELS`
- `docs/project-control/github-projects-source-records.example.json` — 3 example source records (KMVT-OS-001, KMVT-PKG-5A, KMVT-PKG-5B) for dry-run testing; shows full schema with all fields

### Rewritten (full implementation replacing skeleton)

- `scripts/github-project-setup-apply.mjs` — fully apply-capable; plan mode probes auth/scope/existing-project, prints numbered operation list; apply mode: creates/reuses project, links repo, detects existing fields, creates 13 custom fields, writes sync map, appends sync log; all mutations guarded by `requireApply`
- `scripts/github-project-import-issues.mjs` — fully apply-capable; dry-run: parses/validates source records, 3-layer dedup (local sync map → external OS ID search → title warning), prints create/skip plan; apply: `createGhIssue`, `addProjectItem`, `setField*` per record, incremental sync map write (safe on partial failure), sync log append

### Enhanced

- `scripts/github-project-setup-dry-run.mjs` — now probes gh CLI version, GitHub auth (GraphQL `viewer { login }`), project scope, gitignore, and existing project; prints full numbered operation list with field option counts; no external writes
- `scripts/github-project-sync-status.mjs` — added `--live` flag for read-only GitHub API queries (finds project, reads fields, cross-references item count vs sync map); local mode unchanged
- `scripts/github-project-field-map.mjs` — added `--local-map` flag to also validate a local sync map if present; validates structure, token safety, field/option counts

### Updated

- `.claude/skills/github-project-setup/SKILL.md` — removed skeleton-era "never execute apply scripts" hard stop; updated dry-run section to list all new probes; added `--live` and `--local-map` documentation
- `docs/project-control/github-projects-import-runbook.md` — removed "do not apply in this pass" notices; updated Steps 1 and 2 with real apply-script behavior (dedup, incremental sync map, rollback safety)

### Intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- No live GitHub API apply during implementation verification
- No GitHub Project created during this pass
- No GitHub Issues imported during this pass
- No Package 5B planning or implementation
- No secrets or credentials committed

### Key design decisions

- `probeAuth()` uses GraphQL `{ viewer { login } }` — REST `/user` endpoint returns 404 with this token
- `gh api graphql --input -` (stdin JSON) for all ProjectV2 mutations — avoids shell injection and handles variable types correctly
- `external-sync-map.local.json` written incrementally after each issue (safe re-run on partial failure)
- OS ID body marker `<!-- ai-os-id: <os_id> -->` embedded in issue body for external dedup
- Status field options cannot be created via GraphQL API — must be configured manually in GitHub Projects UI
- View creation not available via GraphQL API — must be created manually in GitHub Projects UI
- `probeProjectScope()` uses `viewer { projectsV2(first: 1) { totalCount } }` — if token lacks `read:project`, the probe fails with a warning (not abort) in dry-run mode

---

## 2026-05-25 — AI Project OS v1.3: External Board Provider Update

**Status:** COMPLETE — merged to `main` as `3dcf917` on 2026-05-25
**Scope:** GitHub Projects selected as default external board provider. ClickUp demoted to optional adapter. Dry-run/apply script scaffolding added. No app code; no live API integration; no Package 5B work.

### Added

- `docs/project-control/github-projects-setup-policy.md` — defines GitHub Projects as the default external board; approved project structure, views (14), statuses (9), custom fields (13); Owner Role rule; approval gates; sync map rule
- `docs/project-control/github-projects-source-schema.md` — repo-native source model for generating GitHub Issues and Project rows; field routing table (Issue title/body, labels, milestone, Project custom fields, local sync map only)
- `docs/project-control/github-projects-import-runbook.md` — step-by-step import process: gh CLI preflight, project setup, issue import, field sync, sync map writing, rollback strategy; approval-gated throughout
- `docs/project-control/github-projects-field-map.example.json` — committed example field map (placeholder IDs only); shows owner, repo, project_title, project_number, fields, views, labels, statuses, sync map path, example issue mappings
- `docs/project-control/github-projects-sync-log.md` — log of GitHub Projects operations; initial v1.3 entry records policy change with no live API writes
- `scripts/github-project-setup-dry-run.mjs` — reads policy docs; prints planned project structure, fields, statuses, views; validates example field map; no external writes
- `scripts/github-project-setup-apply.mjs` — apply skeleton (not yet live); prints planned gh CLI / GraphQL steps; exits with error if --apply called; no external mutation in this version
- `scripts/github-project-import-issues.mjs` — dry-run by default; prints planned issue import; --apply + --input required for actual creation; not executable in apply mode in this pass
- `scripts/github-project-sync-status.mjs` — reports local structural sync status; compares local source records to local sync map if present; no API calls
- `scripts/github-project-field-map.mjs` — validates example field map structure; checks placeholder safety; no external calls
- `.claude/skills/github-project-setup/SKILL.md` — new skill: plan, dry-run, approval-gate GitHub Projects setup; YAML frontmatter; full protocol including preflight, dry-run, approval boundaries, hard stops
- `.claude/commands/github-project-setup.md` — thin command wrapper → delegates to `github-project-setup` skill; `/github-project-setup`

### Updated

- `docs/project-control/project-sync-policy.md` — GitHub Projects is default board provider; ClickUp optional adapter; unified local sync map section; external tool routing table updated
- `docs/project-control/external-platform-mapping-guide.md` — reframed around GitHub Projects first; ClickUp section relabeled "Optional Adapter"; GitHub Issues + GitHub Projects mapping explained; AI agent Owner Role rule clarified; sync map routing updated
- `docs/project-control/external-sync-safety.md` — added GitHub Projects safety section: GitHub token and gh auth safety rules; committed vs non-committed files for GitHub Projects; no destructive project item deletion; no silent field overwrites; apply scripts must require --apply; dry-run scripts must perform no external mutation
- `.claude/skills/README.md` — added `github-project-setup` skill to roster
- `.claude/commands/README.md` — added `/github-project-setup` command to roster

### Intentionally NOT changed

- `index.html`, `src/**` — no product or app code
- `scripts/` (existing OS scripts) — not modified
- `docs/project-control/clickup-import.csv` — remains valid for ClickUp import; structural change not warranted
- `docs/project-control/clickup-setup-policy.md` — preserved as-is; ClickUp remains supported as optional adapter
- No live GitHub API integration added
- No GitHub Project created by this patch
- No GitHub Issues imported by this patch
- No external writes of any kind
- No Package 5B planning or implementation
- No secrets or credentials

---

## 2026-05-25 — AI Project OS v1.2: External Setup Alignment Patch

**Status:** COMPLETE — merged to main (`328d81e`). Implementation commit: `1c76444`.
**Branch:** `docs/align-clickup-setup-ai-os-v1-2` (merged)
**Scope:** ClickUp setup standardization, external platform mapping guide, sync policy clarification. No `index.html`, `src/**`, `scripts/**`, no product implementation, no live API integration.

### Added

- `docs/project-control/clickup-setup-policy.md` — defines the approved ClickUp structure: one KeepMees Space, one 00 Project Control Folder, one 01 Project Control Board List; AI OS workflow lanes as saved views/filters (not default separate Lists); hybrid status set; 13 required custom fields; Owner Role rule (AI agents as custom field values, not ClickUp assignees); sync map rule (one list_id, per-task external_id, local map gitignored)
- `docs/project-control/external-platform-mapping-guide.md` — explains the mapping between repo project-control docs and ClickUp, Google Calendar, and TickTick; repo doc to ClickUp field mapping table; calendar item type guidance; TickTick scope boundaries; external sync safety summary

### Updated

- `docs/project-control/project-sync-policy.md` — added "ClickUp structure (approved)" section explicitly defining one Space, one Folder, one primary List, saved views/filters, one list_id, per-task external_id; external tool routing table updated to name "01 Project Control Board"; companion docs updated to include new files; live API noted as future approval-gated
- `docs/project-control/external-sync-safety.md` — added "Approved structure" note to ClickUp section; clarified that external-sync-map.local.json must never be committed; clarified that external-sync-map.example.json must contain only placeholder IDs; clarified that ClickUp tokens must never be committed; added rule that AI agents must not be ClickUp assignees unless real users

### Intentionally NOT changed

- `index.html`, `src/**`, `scripts/**` — no product or app code
- `docs/project-control/clickup-import.csv` — inspected; remains valid for import into 01 Project Control Board; columns map to approved custom fields; no "List" column present; no structural change required
- No live ClickUp API integration added
- No Google Calendar API implementation
- No external writes of any kind
- No Package 5B planning or implementation
- No secrets or credentials

---

## 2026-05-24 — AI Project OS Framework Groundwork Pass

**Status:** COMPLETE — merged to main (`cc7139a`). Implementation commit: `219f0b3`.
**Branch:** `docs/ai-project-os-framework-groundwork` (merged)
**Scope:** AI Project OS framework completion. No `index.html`, `src/**`, no product implementation.

### Added (Skills — canonical layer)
- `.claude/skills/start/SKILL.md`
- `.claude/skills/handoff/SKILL.md`
- `.claude/skills/precommit/SKILL.md`
- `.claude/skills/closeout/SKILL.md`
- `.claude/skills/package-start/SKILL.md`
- `.claude/skills/switch-to-codex/SKILL.md`
- `.claude/skills/switch-to-claude/SKILL.md`
- `.claude/skills/weekly-sync/SKILL.md`
- `.claude/skills/status-summary/SKILL.md`
- `.claude/skills/os-audit/SKILL.md`
- `.claude/skills/project-sync-dry-run/SKILL.md`
- `.claude/skills/project-sync-apply/SKILL.md`
- `.claude/skills/notification-setup-wizard/SKILL.md`

### Updated (Command wrappers — now thin delegates to skills)
All existing `.claude/commands/*.md` updated to reference matching skill.
New command wrappers added: `os-audit.md`, `project-sync-dry-run.md`, `project-sync-apply.md`, `notification-setup-wizard.md`.

### Added (Closeout Sync Contract)
- `docs/dev/closeout-sync-contract.md` — what every meaningful closeout must verify; internal vs external sync; classification guide; required closeout report format

### Added (Project Control Sync Foundation)
- `docs/project-control/project-sync-policy.md` — source of truth hierarchy, stable IDs, dry-run/apply workflow, scheduling model, external tool routing
- `docs/project-control/project-sync-source-schema.md` — schema for ritual/milestone/package/task items and external ID map format
- `docs/project-control/project-sync-dry-run-format.md` — exact format for dry-run delta output
- `docs/project-control/external-sync-safety.md` — non-negotiable rules for Google Calendar, ClickUp, TickTick writes
- `docs/project-control/external-sync-map.example.json` — committed example only; local map is gitignored
- `docs/project-control/project-sync-log.md` — log of every project-control sync operation

### Added (OS Self-Audit)
- `docs/ai-system/os-self-audit-checklist.md` — required checklist before claiming bootstrap complete

### Added (Scripts — safe, dependency-free, read-only)
- `scripts/os-self-audit.mjs` — checks all required OS files, skills, commands, gitignore protections, Post-Commit State Rule cross-references
- `scripts/project-control-sync-dry-run.mjs` — reads repo docs, reports drift vs expected state, outputs dry-run format
- `scripts/project-control-sync-validate.mjs` — validates project-control docs are internally consistent
- `scripts/setup-claude-notification.ps1` — walks notification hook setup; dry-run by default; -Apply to modify settings.json

### Updated (Universal standards)
- `docs/ai-system/universal-standards.md` — "Skills are canonical / commands are compatibility wrappers" section; "Closeout sync rule" section; automation table updated (skills: Backlog → User-invoked; commands: updated count and notes; new rows for closeout sync, OS self-audit, notification wizard)

### Updated (Bootstrap template)
- `docs/ai-system/bootstrap-template.md` — Step 2 updated (skill folders + thin command wrappers); Step 10 verification updated (OS self-audit required; closeout sync contract required); "What this template does" updated for v0.5.0

### Updated (Dev protocols — event-triggered sync rule)
- `docs/dev/auto-management-protocol.md` — Duty 2 expanded with internal sync check requirement; Quick reference rows added
- `docs/dev/package-boundary-closeout-protocol.md` — Step 8 (internal sync check) added before Status sync plan
- `docs/dev/closeout-sync-contract.md` — new file (listed above)

### Updated (Agent layers — event-triggered sync rule)
- `AGENTS.md` — event-triggered sync rule added; protocol table updated
- `CLAUDE.md` — Short Command Interface table expanded with new commands and skill column; event-triggered sync rule section added
- `.codex/README.md` — event-triggered sync rule section added

### Updated (Project-control docs — stale state corrected)
- `docs/project-control/current-sprint.md` — updated to reflect Package 5A complete, AI Project OS Framework Groundwork Pass active
- `docs/project-control/kanban-board.md` — Package 5A moved to Done; cards updated post-Package 5A

### Updated (Gitignore)
- `.gitignore` — added `external-sync-map.local.json` and generated dry-run output patterns

### Intentionally NOT changed
- `index.html`, `src/**`, `scripts/**` (except new OS scripts above)
- Pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`
- Standalone keepsake flows, Review view
- No Google Calendar API implementation
- Product roadmap content in Tower (unchanged except stale-state corrections)
- No live Claude hooks committed

---

## 2026-05-24 — AI Project OS Usability Patch

**Status:** IN PROGRESS — docs/config only; no product/app changes.
**Branch:** `docs/ai-project-os-usability-patch` (pending)
**Scope:** AI Project OS usability improvements only. No `index.html`, `src/**`, `scripts/**`, no product implementation, no vendor/design/checkout work.

### Added (Short Command Interface — universal)
- `.claude/commands/start.md` — session startup from repo truth
- `.claude/commands/handoff.md` — AI_HANDOFF.md update + transfer packet
- `.claude/commands/precommit.md` — pre-commit verification gate
- `.claude/commands/closeout.md` — package boundary closeout
- `.claude/commands/package-start.md` — new package pre-flight
- `.claude/commands/switch-to-codex.md` — Codex handoff
- `.claude/commands/switch-to-claude.md` — resume from Codex
- `.claude/commands/weekly-sync.md` — Coordinator weekly sync
- `.claude/commands/calendar-sync-plan.md` — calendar delta dry run
- `.claude/commands/status-summary.md` — internal + shareable status

### Added (Calendar Sync Layer planning)
- `docs/project-control/calendar-sync-policy.md` — when/how to sync the calendar, dry-run/apply workflow, future script plan
- `docs/project-control/calendar-source-template.md` — repo-native format for calendar events (stable UIDs, all current events catalogued)
- `docs/project-control/calendar-sync-log.md` — record of every calendar change applied

### Added (Shareable Status Summary)
- `docs/project-control/shareable-status-summary.md` — internal + public-safe status in one file

### Updated (universal standards)
- `docs/ai-system/universal-standards.md` — new "Short Command Interface" section; automation table updated (custom slash commands: Backlog → User-invoked)
- `docs/ai-system/bootstrap-template.md` — Step 2 updated to include live command files; bootstrap instructions clarified
- `docs/ai-system/CHANGELOG.md` — Post-Commit State Rule entry corrected (PROPOSED → COMPLETE); this entry
- `docs/ai-system/version-history.md` — version 0.3.1 corrected; version 0.4.0 row added

### Updated (dev protocols)
- `docs/dev/auto-management-protocol.md` — Short Command Interface reference added to quick reference
- `docs/dev/session-restart-protocol.md` — `/start` command reference added
- `docs/dev/notification-setup.md` — PermissionRequest hook guidance, double-beep warning, Windows toast fallback, CLAUDE_CONFIG_DIR troubleshooting

### Updated (agent layers)
- `AGENTS.md` — Short Command Interface row added to protocol table
- `CLAUDE.md` — new "Short Command Interface" section with full command table
- `.codex/README.md` — note about Claude Code commands vs Codex equivalents
- `.claude/commands/README.md` — updated from placeholder to live; old planned roster replaced with live roster
- `.claude/skills/README.md` — Commands vs Skills distinction added

### Corrected (stale state)
- `CURRENT_STATE.md` — HEAD updated to `926ec37`; stale status-sync branch removed
- `AI_HANDOFF.md` — status-sync "in progress" language corrected; work-remaining cleared
- `NEXT_SESSION_PROMPT.md` — HEAD updated; stale "status sync will bump this" language removed

### Intentionally NOT changed
- `index.html`, `src/**`, `scripts/**`
- Pagination constants, `BOOK_PAGINATION_VERSION`, `BOOK_PRODUCTION_DEPS`, `BOOK_PARITY`
- Standalone keepsake flows, Review view
- Live Claude hooks, subagents, skill packages
- No Google Calendar API implementation (planning docs only)
- Product roadmap content in `docs/project-control/` (Tower content unchanged)

---

## 2026-05-22 — AI Project OS Patch: Post-Commit State Rule

**Status:** COMPLETE — merged to main (`9be0f81` merge).
**Branch:** `docs/post-commit-state-rule`
**Scope:** AI Project OS process correction only — no product/app changes; Package 5A remains paused.

### Added (universal)
- `docs/ai-system/universal-standards.md` — new top-level section "Post-Commit State Rule" with full wording (seven numbered clauses, "what counts as misdirection" examples, "what does NOT justify a follow-up sync" examples)

### Updated (dev protocols — cross-links to the canonical rule)
- `docs/dev/package-boundary-closeout-protocol.md` — new "Post-Commit State Rule (applies to status sync decisions)" section after the existing "Status sync as a separate commit" section
- `docs/dev/session-restart-protocol.md` — new "HEAD verification at preflight (Post-Commit State Rule)" subsection under "Verification rules"
- `docs/dev/auto-management-protocol.md` — Post-Commit State Rule bound on Duty 1 (Maintain repo-native memory continuously) + new quick-reference row

### Updated (bootstrap)
- `docs/ai-system/bootstrap-template.md` — new § 8a confirming the rule travels to every repo bootstrapped from this OS

### Intentionally NOT changed (per scope limits)
- `index.html`, `src/**`, `scripts/**`
- `CURRENT_STATE.md`, `AI_HANDOFF.md`, `NEXT_SESSION_PROMPT.md` — the `main HEAD` value in these files lags by one commit (cosmetic only); under the new rule this is **not** a reason for a follow-up state-sync commit
- `docs/command-center/*`, `docs/project-control/*` — no conflicting wording was found
- Package 5A — remains paused

### Rule purpose

Prevent recursive state-sync loops where durable state files try to perfectly describe the commit that is currently being created. Commit hashes belong in post-commit reports and next-session preflight verification — not amended into the committed file itself.

### Universality

The rule applies to KeepMees, Puzzle, and every future repo bootstrapped from `docs/ai-system/bootstrap-template.md`.

---

## 2026-05-22 — Package 2.9: AI Project OS Auto-Management Upgrade Pass

**Status:** COMPLETE — merged to main.
**Branch:** `docs/ai-project-os-auto-management-upgrade`
**Implementation commit:** `81c5069` — docs: upgrade AI Project OS auto-management
**Merge commit:** `a20af30` — merge: upgrade AI Project OS auto-management
**main HEAD after merge:** `a20af30` (post-merge status sync follows on a separate branch)

**Scope (docs / config / infrastructure only — no app code):**

### Added (universal)
- `docs/ai-system/README.md` — entry point to the AI Project OS layer
- `docs/ai-system/universal-standards.md` — repo-agnostic standards
- `docs/ai-system/bootstrap-template.md` — reusable bootstrap pattern for future repos
- `docs/ai-system/CHANGELOG.md` — this file
- `docs/ai-system/version-history.md` — OS upgrade pass history

### Added (dev workflow)
- `docs/dev/auto-management-protocol.md` — umbrella protocol tying the OS together
- `docs/dev/model-routing-protocol.md` — which model for which task (distinct from model-switching)
- `docs/dev/token-efficiency-protocol.md` — context-cost discipline
- `docs/dev/context-budget-checklist.md` — short pre-flight checklist
- `docs/dev/tool-batching-protocol.md` — batching plan format and rules
- `docs/dev/package-boundary-closeout-protocol.md` — boundary closeout + fresh-session preference
- `docs/dev/notification-setup.md` — user-level permission notification setup (Windows / macOS / Linux)

### Added (QA)
- `docs/qa/test-strategy.md` — first-class testing strategy
- `docs/qa/package-verification-template.md` — per-package verification gate

### Added (placeholders)
- `.claude/commands/README.md` — readiness placeholder for custom slash commands (no live commands shipped)

### Updated (universal layer)
- `AGENTS.md` — protocol pointer table extended with Package 2.9 protocols; auto-management rule added
- `CLAUDE.md` — Package 2.9 protocol pointers; explicit guidance that long `claude --continue` of stale sessions is not the default
- `.codex/README.md` — Package 2.9 protocol pointers
- `.claude/agents/README.md` — cross-references updated
- `.claude/skills/README.md` — cross-references updated

### Updated (existing protocols)
- `docs/dev/context-hygiene-protocol.md` — high-uncached-context section (300k+ / 500k+ trigger) + fresh-session-from-repo-truth preference
- `docs/dev/model-switching-protocol.md` — cross-link to `model-routing-protocol.md`

### Updated (gitignore)
- `.gitignore` — added IDE/OS/log noise patterns (`*.log`, `.DS_Store`, `*.swp`/`*.swo`, `.idea/`, `.vscode/`), Codex defensive patterns

### Updated (PR template)
- `.github/PULL_REQUEST_TEMPLATE.md` — pointer additions for AI-OS protocol checks

### Updated (Project Control compatibility — light touches only)
- `docs/project-control/README.md` — note that `docs/ai-system/` is the universal OS home
- `docs/project-control/coordinator-weekly-sync.md` — weekly-log row for the 2026-05-22 sync

### Continuity files (Phase 3)
- `AI_HANDOFF.md` — Package 2.9 status snapshot
- `CURRENT_STATE.md` — refresh
- `NEXT_SESSION_PROMPT.md` — Package 2.9 pointer

### Intentionally NOT changed
- `index.html`, `src/**`, `scripts/**` (app/product code) — off limits for this pass
- `BOOK_PAGINATION_VERSION` and other scope-guarded constants
- Locked product, vendor, design, manufacturing decisions
- Live Claude hooks, live subagent YAML, live skill packages, live custom slash command files
- `.codex/config.toml`
- n8n / Make / Zapier flows
- Project Control Tower content (roadmap, backlog, kanban, gates — not rewritten)
- `docs/ops/` registers (deferred to a post-merge status sync; same pattern as Package 2.7 and 2.8)
- `docs/command-center/*` (deferred to the same post-merge status sync)
- Package 5A — remains paused

### Backlog created by this pass
See `version-history.md` row for Package 2.9 and the "Advanced backlog" section at the bottom of `docs/ai-system/version-history.md`.

---

## 2026-05-17 — Package 2.8: KeepMees Project Control Tower

(Pre-existing event; logged here for OS-layer continuity.)

OS-layer effect: introduced the live `docs/project-control/` Tower as the project's repo-native coordination layer. The Tower is project-specific (KeepMees roadmap, schedule, gates, etc.) and does not travel via the bootstrap template, but the *pattern* of having a Tower does. Documented in `docs/ai-system/bootstrap-template.md` § 6.

---

## 2026-05-17 — Package 2.7: AI Development Operating System Upgrade Pass

(Pre-existing event; logged here for OS-layer continuity.)

OS-layer effect: introduced `AGENTS.md` as the universal contract, `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md` as durable continuity files, and the initial `docs/dev/` protocols (session-restart, context-hygiene, model-switching, tool-switching, scope-boundaries, worktree, Claude/Codex interchangeability). Pre-Package 2.9, these protocols existed but the AI System layer (`docs/ai-system/`) did not — Package 2.9 introduces that layer.

---

## How to add a new entry

Each entry should be self-contained: scope, what was added, what was updated, what was intentionally not changed, backlog created. New entries go at the top.

When an entry refers to commits, fill in the hashes at closeout, not before — placeholder hashes are misleading.
