# External Sync Consistency Policy

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 5 — External Sync Consistency Validators, 2026-06-01)
**Owner:** Coordinator / Project Control
**Companion to:** `docs/project-control/external-sync-safety.md`, `docs/dev/closeout-sync-contract.md`

---

## What external sync consistency means

External sync consistency is the property that:

1. Repo source records (committed) match the local sync map (gitignored, local-only)
2. The local sync map matches live external state (Google Calendar events, GitHub Project items)
3. Committed logs accurately reflect completed apply operations
4. No drift, duplicate, or missing item exists without a known resolution plan

Consistency does NOT mean:
- That apply has been run (local map is absent before first apply — this is expected)
- That live state perfectly mirrors every source record at every moment (some drift is expected between syncs)
- That the repo can verify live state without explicit `--live-readonly` authorization

---

## The four layers

| Layer | Source | When required |
|---|---|---|
| Layer 1 | Repo source records — `google-calendar-source-records.json`, `github-projects-source-records.json` | Always |
| Layer 2 | Local ignored sync map — `external-sync-map.local.json` | After first apply; absent before is expected |
| Layer 3 | Live external read-only state | Only with `--live-readonly` and explicit Coordinator authorization |
| Layer 4 | Committed logs and status docs — sync logs, AI_HANDOFF.md, kanban-board.md | Always (structural only) |

---

## When to run the consistency validator

Run `node scripts/external-sync-consistency-check.mjs` after:

- Any Google Calendar apply (Gate 3 or later)
- Any GitHub Projects import apply
- Any external sync pass closeout
- Before proposing external apply to confirm source records and map are aligned
- At every package closeout where external sync files changed (required per `docs/dev/closeout-sync-contract.md`)
- During the weekly sync ritual when external tools are involved

Do not run live mode (`--live-readonly`) without explicit Coordinator authorization. Local-only mode is sufficient for pre-commit checks and routine closeout.

---

## FAIL, WARN, PASS classification

### FAIL — must resolve before claiming external sync state is consistent

- Source record is invalid or missing required fields
- Local map is required but missing (after apply-complete context)
- Local map is present but missing entries for source records
- Mapped external item is missing from live state
- Duplicate OS IDs in source records
- Duplicate live events for one OS ID
- Field values drift materially between source and live
- Delete/cancel candidate exists without explicit approval
- Apply appears pending without approved dry-run artifact
- Credential/token/local map paths are not gitignored
- Local private files appear in git status
- Package 5B or product work unblocked while external sync blockers exist

### WARN — disclose in closeout report; no sync commit required unless escalated

- Live read-only mode was not run (default for routine checks)
- Sync log has safe cosmetic lag
- Views are manual-only and cannot be fully validated by script
- Local map absent before first apply and no live check requested
- External auth is missing but live check was not required

### PASS — no action required

- Source records validate
- Local map is gitignored and, when present, parses safely
- Source record os_ids match local map where expected
- Live checks (when run) show no drift
- No apply is pending without authorization
- No local/private files are staged
- Package 5B remains blocked

---

## Privacy and safety rules for the validator

The consistency validator (`scripts/external-sync-consistency-check.mjs`) must follow these rules at all times:

1. **Never print raw local map contents.** Only safe summaries: map present/missing, gitignored status, entry counts, unresolved os_id counts.
2. **Never write the local sync map.** Read-only access only.
3. **Never stage or commit the local sync map.**
4. **Never print credential, token, event ID, or project item ID values** except where required for a specific FAIL explanation, in which case use os_id references only.
5. **Never call external APIs without `--live-readonly` flag and credentials already in place.**
6. **Never mutate external systems.** This validator is always read-only.
7. **Output path must be under `local-sync-reports/` and gitignored** when `--output` is used.

---

## Integration with closeout and precommit

Per `docs/dev/closeout-sync-contract.md`, the consistency validator is required before closing any external sync pass:

- Run `node scripts/external-sync-consistency-check.mjs` (local-only mode)
- If FAILs exist, resolve before proposing commit
- If WARNs exist, disclose in the closeout report
- Include the consistency result in the closeout report

The `closeout` and `precommit` skills enforce this requirement when external sync files have changed.

---

## Fixture/mock validation

Fixture files with fake data (never real IDs) allow proving validator logic without credentials or live API access:

```
node scripts/external-sync-consistency-check.mjs --fixture docs/project-control/external-sync-consistency-fixture.example.json
```

Required fixture scenarios:

| Scenario | Expected code |
|---|---|
| Source record maps to local map and live event | `PASS_GCAL_LIVE_NO_OP` |
| Source record has no local map entry after apply-complete context | `FAIL_GCAL_SOURCE_MISSING_LOCAL_MAP_ENTRY` |
| Local map entry exists but no live event | `FAIL_GCAL_MAPPED_EVENT_MISSING_REMOTELY` |
| Duplicate live events for one os_id | `FAIL_GCAL_DUPLICATE_DETECTED` |
| Title+date duplicate without AI_OS_ID marker | `FAIL_GCAL_POSSIBLE_DUPLICATE` |
| GHP source record maps to item, status matches | `PASS_GHP_LIVE_ITEMS_ALIGNED` |
| GHP source record has no live item | `FAIL_GHP_PROJECT_ITEM_MISSING` |
| Duplicate os_id in GHP source records | `FAIL_GHP_DUPLICATE_OS_ID` |
| GHP field value differs from source | `FAIL_GHP_FIELD_VALUE_DRIFT` |

---

## Scope guard

The validator must not:

- Create, update, delete, or cancel Google Calendar events
- Create, update, delete, or archive GitHub Project items, issues, or fields
- Modify any external system
- Write committed files (only local `local-sync-reports/` output is permitted with `--output`)
- Read or expose credential, token, or raw sync map contents

This scope guard is absolute. Any apply behavior requires a separate dedicated apply script (`google-calendar-sync-apply.mjs` or `github-project-import-issues.mjs`) with explicit Coordinator authorization.
