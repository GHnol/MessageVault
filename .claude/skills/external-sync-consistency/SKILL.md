---
name: external-sync-consistency
description: Run the external sync consistency validator — compare repo source records, local sync map, committed logs, and optional live read-only external state for Google Calendar and GitHub Projects. Always read-only; never mutates external systems.
---

## Purpose

Run the AI Project OS v1.7 Gate 5 external sync consistency validator. Compare four layers (source records, local sync map, committed logs, live external state) to detect drift, duplicates, missing items, and privacy violations without mutating anything.

## When to use

- Before proposing any Google Calendar or GitHub Projects apply
- At every package closeout where external sync files changed (required per `docs/dev/closeout-sync-contract.md`)
- During the weekly sync ritual when external tools are reviewed
- After a completed apply, to confirm consistency
- Any time the Coordinator requests an external sync health check

**Invocation type:** User-invoked. Also required as part of the closeout flow when external sync files changed.

## Files to read

1. `docs/project-control/external-sync-consistency-policy.md`
2. `docs/project-control/external-sync-consistency-schema.md`
3. `docs/project-control/external-sync-consistency-log.md`
4. `docs/project-control/external-sync-safety.md`
5. `AI_HANDOFF.md` (external sync state section)

## Required git preflight

```
git status --short
git check-ignore -v docs/project-control/external-sync-map.local.json
```

## Script commands

### Default (local-only, all platforms)
```
node scripts/external-sync-consistency-check.mjs
```

### Local-only explicit
```
node scripts/external-sync-consistency-check.mjs --local-only
```

### JSON output
```
node scripts/external-sync-consistency-check.mjs --json
```

### Fixture/mock validation (fake data only)
```
node scripts/external-sync-consistency-check.mjs --fixture docs/project-control/external-sync-consistency-fixture.example.json
```

### Per-platform local checks
```
node scripts/external-sync-consistency-check.mjs --google-calendar --local-only
node scripts/external-sync-consistency-check.mjs --github-projects --local-only
node scripts/external-sync-consistency-check.mjs --all --local-only
```

### Detailed output
```
node scripts/external-sync-consistency-check.mjs --explain
node scripts/external-sync-consistency-check.mjs --paths
```

### Live read-only (only after Coordinator authorization)
```
node scripts/external-sync-consistency-check.mjs --google-calendar --live-readonly --output local-sync-reports/external-sync-consistency-gcal-live.json
node scripts/external-sync-consistency-check.mjs --github-projects --live-readonly --output local-sync-reports/external-sync-consistency-ghp-live.json
```

**Live read-only prerequisites (Google Calendar):**
- `docs/project-control/google-calendar-credentials.local.json` exists and is gitignored
- `docs/project-control/google-calendar-token.local.json` exists and is gitignored
- `googleapis` installed in `scripts/node_modules/` (from `cd scripts && npm install`)
- Explicit Coordinator authorization

**Live read-only prerequisites (GitHub Projects):**
- `gh auth status` succeeds
- Token has `read:project` scope
- Explicit Coordinator authorization

If prerequisites are missing, report the blocker and complete fixture/local validation only. Do not repair credentials or auth in this gate.

## Output format

Report to chat:

1. Mode used (local-only / fixture / live-readonly)
2. Overall status (PASS / WARN / FAIL)
3. Summary counts (pass / warn / fail)
4. Local map summary (present/absent, gitignored, entry counts — no raw contents)
5. FAIL issues (if any) — with code and message
6. WARN issues (if any) — with code and message
7. PASS issues (brief summary)
8. Mutation confirmation (no mutation, no apply, no external write)

## Hard stop conditions

- Do not run any command with `--apply`.
- Do not run any Google Calendar mutation script.
- Do not run any GitHub Project mutation script.
- Do not print raw contents of `external-sync-map.local.json` or any credential/token file.
- Do not write or stage `external-sync-map.local.json`.
- Do not start Package 5B.
- If FAIL issues exist, report them and do not proceed with apply authorization.

## Approval boundaries

- Does not commit, push, or merge.
- Does not authorize external apply.
- Does not repair credentials or auth.
- Live read-only checks require explicit Coordinator authorization per run.
- All outputs are read-only reports and proposals.

## Backed by

`docs/project-control/external-sync-consistency-policy.md`
`docs/project-control/external-sync-consistency-schema.md`
`docs/project-control/external-sync-safety.md`
`docs/dev/closeout-sync-contract.md`
`scripts/external-sync-consistency-check.mjs`
