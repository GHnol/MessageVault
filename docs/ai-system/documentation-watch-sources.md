# AI Project OS — Documentation-Watch Sources

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 6, 2026-06-01).
**Use:** Reference list of official source categories for documentation-watch reviews. Does not authorize live browsing — that requires separate Coordinator approval.
**Last reviewed:** Gate 6 — initial source list established. No live browsing performed. Current status fields reflect known state from repo behavior, not verified external docs.

---

## How to use this file

Each source category defines:
- **Why it matters** — which OS workflows depend on it
- **What to check** — what to look for in an official-docs review
- **Adoption risk** — how careful to be about behavior changes
- **Last reviewed** — date of last authorized docs check (or "not reviewed" if no check yet)
- **Next review trigger** — what should prompt the next check
- **Current status** — one of: `not reviewed in this gate`, `monitor`, `reviewed`, `adopted`, `rejected`

---

## 1. Claude Code official documentation

**Why it matters:** Claude Code is the primary agent runtime. Changes to skills, commands, hooks, keybindings, settings, MCP integration, or the harness can break OS workflows or introduce new automation opportunities.

**What to check:**
- Skill frontmatter format (name, description)
- Command file format (`.claude/commands/*.md`)
- Hook event types and payload shape
- Settings.json schema (permissions, hooks)
- MCP server integration (if applicable)
- Slash command routing behavior
- Keyboard shortcut schema
- Any changes to how agents or subagents are invoked

**Adoption risk:** High. Claude Code behavior changes can silently break skill routing, hook execution, or command file handling. Verify before adopting any new format.

**Last reviewed:** Not reviewed in this gate (Gate 6 did not authorize live docs browsing).

**Next review trigger:**
- Claude Code major version bump
- Skill or command file format change announcement
- Hooks schema change
- OS upgrade pass that touches `.claude/` configuration

**Current status:** `not reviewed in this gate`

---

## 2. Anthropic model and Claude Code release notes

**Why it matters:** Model tier definitions (Light/Default/Strongest), context window sizes, supported features (extended thinking, batch API, files API), and pricing affect model routing decisions and OS efficiency.

**What to check:**
- New model IDs and their tier placement
- Context window changes that affect the session model
- New features relevant to OS workflows (caching, citations, tool use, compaction)
- Deprecated models or API endpoints
- Policy changes relevant to Operator Mode or agentic use

**Adoption risk:** Medium. New model IDs are examples — tier routing is the contract. Feature adoption must pass the scrutinous adoption rule before implementation.

**Last reviewed:** Not reviewed in this gate. Known state: Opus 4.8 / Sonnet 4.6 / Haiku 4.5 as of the current session environment.

**Next review trigger:**
- New Claude model family announced
- Context window change affects session model recommendations
- New feature relevant to OS automation

**Current status:** `not reviewed in this gate`

---

## 3. Codex official documentation

**Why it matters:** Codex is the secondary agent runtime for some KeepMees and Puzzle tasks. Changes to Codex CLI, config format, or interchangeability behavior affect the Claude↔Codex relay protocol.

**What to check:**
- `.codex/README.md` compatibility with current Codex runtime
- Codex config file schema (`.codex/config.toml` — currently deferred as backlog)
- Any new Codex CLI modes relevant to OS handoff or branch management

**Adoption risk:** Medium. Codex config schema is not yet verified for the current runtime — any adoption must verify format before committing configuration files.

**Last reviewed:** Not reviewed in this gate.

**Next review trigger:**
- Codex major version or CLI change
- Tool-switching protocol update needed
- `.codex/config.toml` adoption being considered

**Current status:** `not reviewed in this gate`

---

## 4. GitHub CLI official docs

**Why it matters:** `gh` CLI is used for GitHub Projects GraphQL operations, issue creation, and auth probing. CLI flag changes or deprecations can break existing scripts.

**What to check:**
- `gh api graphql` behavior and stdin JSON format
- `gh auth status` and token scope verification
- Any new `gh projects` subcommands relevant to sync
- `gh issue create` format changes

**Adoption risk:** Low-to-medium. Changes are usually backward compatible, but `--input -` (stdin JSON) is a non-default usage that should be verified on major version bumps.

**Last reviewed:** Not reviewed in this gate.

**Next review trigger:**
- `gh` major version bump
- GitHub Projects GraphQL API changes announced
- Script failures related to `gh` invocation

**Current status:** `not reviewed in this gate`

---

## 5. GitHub Projects GraphQL/API docs

**Why it matters:** All GitHub Projects mutations and reads use the Projects V2 GraphQL API. Field type changes, removed mutations, or new capabilities directly affect the provisioning and sync scripts.

**What to check:**
- `projectsV2` query and mutation availability
- `ProjectV2FieldType` values (particularly single-select and date fields)
- Item creation and update mutations
- Pagination and rate limit changes
- New field types that may be worth adopting

**Adoption risk:** High. GraphQL API changes are breaking if existing mutations are deprecated or field types change. Verify before any apply-mode script run.

**Last reviewed:** Not reviewed in this gate.

**Next review trigger:**
- GitHub Projects API changelog entry
- Script failure during live project setup
- New field types announced

**Current status:** `not reviewed in this gate`

---

## 6. GitHub Actions docs (if CI or hooks are considered)

**Why it matters:** Currently no CI is committed to this repo. If a future OS pass adds CI workflows or pre-commit hooks via GitHub Actions, the Actions syntax must be verified.

**What to check:**
- `actions/checkout` version compatibility
- Node.js versions available in runners
- Job environment variables
- Any security constraints on token scope in Actions workflows

**Adoption risk:** High for any new commitment. CI additions require explicit Coordinator authorization — do not adopt Actions workflows speculatively.

**Last reviewed:** Not applicable (no CI committed).

**Next review trigger:**
- Coordinator authorizes CI addition
- OS upgrade pass proposes GitHub Actions integration

**Current status:** `not reviewed in this gate`

---

## 7. Google Calendar API docs

**Why it matters:** The `googleapis` library and Google Calendar API v3 are used for the live calendar sync (Gate 2/3). API behavior changes can affect event creation, duplicate detection, and extended property handling.

**What to check:**
- `googleapis` npm package major version changes
- Google Calendar API v3 events.insert / events.list changes
- `extendedProperties.private` handling
- OAuth2 scope changes
- `calendarId` or `conferenceDataVersion` defaults

**Adoption risk:** High. Any googleapis major version bump may require script updates. Dry-run verification after any library change is mandatory.

**Last reviewed:** Not reviewed in this gate. Last known state: googleapis v173.0.0 installed in `scripts/node_modules/` (gitignored).

**Next review trigger:**
- googleapis major version release
- Google Calendar API v3 change announcement
- OAuth token issues during live dry-run

**Current status:** `not reviewed in this gate`

---

## 8. Google OAuth docs

**Why it matters:** OAuth2 authorization for Google Calendar live sync. Scope requirements, token refresh behavior, and credential file format affect the auth bootstrap script.

**What to check:**
- Required OAuth scopes for calendar read/write
- Token refresh and expiry handling
- Service account vs. user OAuth tradeoffs
- `GOCSPX-` vs. other client secret formats

**Adoption risk:** High. OAuth config changes can silently break credential bootstrap. Verify against official docs before any auth flow changes.

**Last reviewed:** Not reviewed in this gate.

**Next review trigger:**
- Google OAuth2 deprecation notice
- Auth flow failure during credential bootstrap
- New service account option announced

**Current status:** `not reviewed in this gate`

---

## 9. Node.js official docs (for scripts)

**Why it matters:** All OS scripts are dependency-free Node ESM modules. Node.js built-in API changes (e.g., `fs`, `path`, `child_process`, `url`) can affect script behavior, and Node version requirements affect compatibility.

**What to check:**
- `import.meta.url` and `fileURLToPath` availability
- `fs.existsSync`, `fs.readFileSync`, `fs.writeFileSync` behavior
- `child_process.execSync` / `execFileSync` flags
- ESM module resolution changes
- Node.js version LTS status (scripts assume an LTS version is available)

**Adoption risk:** Low. Node.js built-ins are highly stable. Only relevant for major Node version bumps.

**Last reviewed:** Not reviewed in this gate.

**Next review trigger:**
- Node.js major version LTS change
- Script syntax error on a new Node version
- ESM import behavior change

**Current status:** `not reviewed in this gate`

---

## 10. npm docs for scripts dependency handling

**Why it matters:** The `scripts/node_modules/` directory is gitignored and contains googleapis (installed locally). npm behavior affects how scripts install, pin, and resolve dependencies when running live modes.

**What to check:**
- `npm install --prefix scripts` behavior and lockfile handling
- `node_modules/` resolution with `--prefix` flag
- npm audit / security advisory behavior
- Any changes to ESM-compatible package resolution

**Adoption risk:** Low for routine use; medium if dependency management is being changed.

**Last reviewed:** Not reviewed in this gate.

**Next review trigger:**
- npm major version bump
- Dependency install failure during googleapis setup
- Security advisory for an installed package

**Current status:** `not reviewed in this gate`

---

## How to update this file

When a review is completed:

1. Update `Last reviewed` to the review date.
2. Update `Current status` to one of: `monitor`, `reviewed`, `adopted`, `rejected`.
3. Add a note if findings led to a new evaluation record in `documentation-watch-evaluation-template.md`.
4. Add an entry to `documentation-watch-log.md`.

Do not change the source categories without Coordinator authorization. Adding a new category is allowed if a new tool layer is adopted in the OS.
