# External Sync Consistency Log

**Status:** ACTIVE (introduced in AI Project OS v1.7 Gate 5, 2026-06-01)
**Purpose:** Committed log of significant external sync consistency check results. Records when checks were run, what mode was used, and the PASS/WARN/FAIL outcome.

This log records meaningful consistency check runs — particularly live read-only checks and pre-apply checks. Routine local-only checks during development do not require a log entry.

---

## When to add an entry

Add an entry when:

- A live read-only consistency check completes (with `--live-readonly`)
- A pre-apply consistency check is run before an external apply is authorized
- A consistency FAIL is detected and resolved
- A new gate or apply pass is completed and consistency is confirmed

Do not add entries for:
- Routine local-only checks during development
- Fixture-mode runs (these are for testing only)

---

## Log format

Each entry uses this format:

```
### <run_id> — <PASS|WARN|FAIL> — <date>

| Field | Value |
|---|---|
| Run ID | <unique identifier, e.g. EXT-SYNC-CONS-001> |
| Date | YYYY-MM-DD |
| Mode | local-only / live-readonly / fixture |
| Platforms | google-calendar / github-projects / all |
| Overall status | PASS / WARN / FAIL |
| Pass count | N |
| Warn count | N |
| Fail count | N |
| Local map present | true / false |
| GCal entries | N |
| GHP entries | N |
| Key findings | <summary of notable issues or "no issues"> |
| Artifact | <local artifact path, if any> (gitignored) |
| No mutation | true |
```

---

## Entries

_(This log starts empty. First entry will be added after Gate 5 implementation is verified and the first meaningful consistency check is completed.)_
