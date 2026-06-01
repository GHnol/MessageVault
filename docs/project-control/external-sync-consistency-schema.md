# External Sync Consistency Schema

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 5, 2026-06-01)
**Use:** Defines all issue codes, severities, field definitions, and output structure for `scripts/external-sync-consistency-check.mjs`.

---

## Output schema

The validator produces a JSON object with the following top-level fields:

| Field | Type | Description |
|---|---|---|
| `schema_version` | string | Schema version (currently `1.7.5`) |
| `generated_at` | ISO datetime string | When this report was generated |
| `mode` | string | `local-only`, `fixture`, or `live-readonly` |
| `flags` | object | CLI flags used for this run |
| `overall_status` | string | `PASS`, `WARN`, or `FAIL` |
| `summary` | object | `{ pass, warn, fail }` counts |
| `local_map_summary` | object | Privacy-safe summary of local map state (no raw contents) |
| `issues` | array | Array of issue objects |
| `no_mutation_occurred` | boolean | Always `true` — confirms no external write happened |
| `no_apply_run` | boolean | Always `true` — confirms no apply was executed |
| `no_external_write` | boolean | Always `true` — confirms no external write of any kind |
| `paths_checked` | array (optional) | With `--paths` flag only |

---

## Local map summary schema

The `local_map_summary` field contains only privacy-safe diagnostics. Raw map contents are never included.

| Field | Type | Description |
|---|---|---|
| `local_map_present` | boolean | Whether `external-sync-map.local.json` exists locally |
| `local_map_gitignored` | boolean | Whether the path is correctly gitignored |
| `google_calendar_entries_count` | integer | Number of entries in the `google_calendar` section |
| `github_projects_entries_count` | integer | Number of non-metadata entries in the `github_projects` section |
| `unresolved_os_ids` | array of strings | os_ids with missing or placeholder `external_id` values |
| `duplicate_os_ids` | array of strings | os_ids appearing more than once across sections |
| `map_shape_detected` | string | `apply-script-shape`, `example-shape`, `parse_error`, or `null` |

---

## Issue object schema

Each issue in the `issues` array has:

| Field | Type | Description |
|---|---|---|
| `code` | string | Issue code (see tables below) |
| `severity` | string | `PASS`, `WARN`, or `FAIL` |
| `message` | string | Human-readable description |
| `detail` | string (optional) | With `--explain` flag only — additional context |

---

## Google Calendar issue codes

| Code | Severity | Meaning |
|---|---|---|
| `PASS_GCAL_SOURCE_RECORDS_VALID` | PASS | Source records are valid JSON with required fields, unique os_ids, and AI_OS_ID markers |
| `PASS_GCAL_LOCAL_MAP_PRESENT` | PASS | Local sync map is present with a `google_calendar` section |
| `PASS_GCAL_SOURCE_TO_MAP_ALIGNED` | PASS | All source record os_ids are present in the local sync map |
| `PASS_GCAL_LIVE_NO_OP` | PASS | Live check confirms all source records have confirmed events with no drift or duplicates |
| `WARN_GCAL_LOCAL_MAP_MISSING` | WARN | Local sync map is absent; expected before first apply |
| `WARN_GCAL_LIVE_NOT_RUN` | WARN | Live read-only check was not run |
| `WARN_GCAL_LOG_LAG` | WARN | Sync log is missing or does not show Gate 3 COMPLETE |
| `FAIL_GCAL_SOURCE_INVALID` | FAIL | Source records are missing, invalid JSON, or fail schema validation |
| `FAIL_GCAL_LOCAL_MAP_REQUIRED_MISSING` | FAIL | Local map is required for live check but is absent; or credentials are missing |
| `FAIL_GCAL_SOURCE_MISSING_LOCAL_MAP_ENTRY` | FAIL | Source record os_id not found in local sync map after apply-complete context |
| `FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY` | FAIL | Local map entry exists but no matching live event found |
| `FAIL_GCAL_DUPLICATE_DETECTED` | FAIL | Multiple live events found for the same AI_OS_ID |
| `FAIL_GCAL_POSSIBLE_DUPLICATE` | FAIL | Live events with identical title+date may be duplicates (no AI_OS_ID marker match) |
| `FAIL_GCAL_REMOTE_DRIFT` | FAIL | Live calendar check failed with an error |
| `FAIL_GCAL_DELETE_CANCEL_UNAPPROVED` | FAIL | Delete/cancel candidate exists without explicit approval |
| `FAIL_GCAL_APPLY_PENDING_WITHOUT_DRY_RUN` | FAIL | Apply appears authorized without a valid approved dry-run artifact |

---

## GitHub Projects issue codes

| Code | Severity | Meaning |
|---|---|---|
| `PASS_GHP_SOURCE_RECORDS_VALID` | PASS | Source records are valid JSON with required fields and unique os_ids |
| `PASS_GHP_FIELD_MAP_VALID` | PASS | Field map example is valid JSON with placeholder IDs only |
| `PASS_GHP_LOCAL_MAP_PRESENT` | PASS | Local sync map is present with a `github_projects` section |
| `PASS_GHP_SOURCE_TO_MAP_ALIGNED` | PASS | All source record os_ids are present in the GitHub Projects local sync map |
| `PASS_GHP_LIVE_PROJECT_FOUND` | PASS | Live GitHub Project was found and queried successfully |
| `PASS_GHP_LIVE_ITEMS_ALIGNED` | PASS | Live Project items confirmed aligned with source records and local map |
| `WARN_GHP_LOCAL_MAP_MISSING` | WARN | Local sync map is absent or lacks `github_projects` section |
| `WARN_GHP_LIVE_NOT_RUN` | WARN | Live GitHub Projects check was not run |
| `WARN_GHP_VIEW_MANUAL_ONLY` | WARN | GitHub Project views cannot be fully validated by script — manual review required |
| `WARN_GHP_LOG_LAG` | WARN | GitHub Projects sync log is missing or unreadable |
| `FAIL_GHP_SOURCE_INVALID` | FAIL | Source records are missing, invalid JSON, or fail schema validation |
| `FAIL_GHP_FIELD_MAP_INVALID` | FAIL | Field map example is invalid JSON or may contain real IDs |
| `FAIL_GHP_LOCAL_MAP_REQUIRED_MISSING` | FAIL | Local map is required for live check but is absent; or gh auth is missing |
| `FAIL_GHP_SOURCE_MISSING_LOCAL_MAP_ENTRY` | FAIL | Source record os_id not found in GitHub Projects local sync map |
| `FAIL_GHP_PROJECT_NOT_FOUND` | FAIL | Live GitHub Project not found or query failed |
| `FAIL_GHP_ISSUE_MISSING` | FAIL | Project item exists but has no linked GitHub Issue |
| `FAIL_GHP_PROJECT_ITEM_MISSING` | FAIL | Local map entry exists but no matching live Project item found |
| `FAIL_GHP_FIELD_VALUE_DRIFT` | FAIL | Project item field value differs from source record |
| `FAIL_GHP_STATUS_OPTION_DRIFT` | FAIL | Status option in live Project does not match expected v1.5 vocabulary |
| `FAIL_GHP_DUPLICATE_OS_ID` | FAIL | Duplicate os_id values in source records or live Project items |
| `FAIL_GHP_APPLY_PENDING_WITHOUT_DRY_RUN` | FAIL | GHP apply appears authorized without a valid dry-run |

---

## Cross-platform issue codes

| Code | Severity | Meaning |
|---|---|---|
| `PASS_EXTERNAL_LOCAL_PRIVATE_PATHS_IGNORED` | PASS | All local/private paths are correctly gitignored |
| `PASS_EXTERNAL_NO_APPLY_PENDING` | PASS | No unauthorized external apply is pending |
| `WARN_EXTERNAL_LIVE_NOT_RUN` | WARN | No live read-only checks were run in this execution |
| `WARN_EXTERNAL_LOG_STATUS_LAG` | WARN | One or more external sync logs are missing or unreadable |
| `FAIL_EXTERNAL_LOCAL_PRIVATE_FILE_NOT_IGNORED` | FAIL | A local private file path is not gitignored |
| `FAIL_EXTERNAL_SYNC_MAP_IN_GIT_STATUS` | FAIL | `external-sync-map.local.json` appears in `git status` — must not be tracked |
| `FAIL_EXTERNAL_CREDENTIAL_OR_TOKEN_IN_GIT_STATUS` | FAIL | A credential or token file appears in `git status` |
| `FAIL_EXTERNAL_APPLY_AUTH_MISMATCH` | FAIL | State doc suggests external apply is authorized when it is not |
| `FAIL_EXTERNAL_PLATFORM_DRIFT_BLOCKS_PACKAGE` | FAIL | External sync blockers exist that would block the next package |
| `FAIL_EXTERNAL_UNRESOLVED_BLOCKERS` | FAIL | Unresolved blockers detected in state docs |

---

## Exit codes

| Exit code | Meaning |
|---|---|
| `0` | PASS or WARN only — no FAILs (or no FAILs under `--strict`) |
| `1` | One or more FAILs exist (or one or more WARNs under `--strict`) |

---

## Fixture schema

Fixture files (fake data only) may contain:

| Field | Type | Description |
|---|---|---|
| `google_calendar_source_records` | array | Fake source records with all required fields and AI_OS_ID markers |
| `local_sync_map` | object | Fake local map with `google_calendar` and/or `github_projects` sections |
| `google_calendar_live_events` | array | Fake live events to compare against source records |
| `github_projects_source_records` | array | Fake GHP source records |
| `github_project_live_items` | array | Fake live Project items with `os_id`, `body`, and `field_values` |

Fixture files must never contain:
- Real Google Calendar event IDs
- Real GitHub Project item IDs or issue numbers
- Real tokens, credentials, or auth data
- Real local sync map entries

Example fixture: `docs/project-control/external-sync-consistency-fixture.example.json`
