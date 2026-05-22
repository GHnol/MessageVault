# Package Verification

**Use:** Fill this in at every package boundary. It is the verification gate that runs *before* the commit/merge mechanics in `docs/automation/operator-mode/package-closeout-protocol.md`.

---

**Date:** `[YYYY-MM-DD]`
**Package:** `[name + identifier, e.g. Package 2.9 — AI Project OS Auto-Management Upgrade Pass]`
**Branch:** `[branch name]`
**Verified by:** `[agent / human]`

---

## 1. Scope confirmation

- [ ] Files changed match the authorized package scope
- [ ] No `index.html` / `src/**` / `scripts/**` changes (unless explicitly authorized — note below)
- [ ] No locked decisions touched
- [ ] No scope-guarded constants touched

**Files changed:** `[list with one-line description each]`

**Anything out of scope?** `[none / explanation]`

---

## 2. Tests — Layer 1 (Node unit suites)

| Suite | Required? | Command | Result |
|---|---|---|---|
| `km-engine-tests.mjs` | | `node src/tests/km-engine-tests.mjs` | |
| `keepsake-group-tests.mjs` | | `node src/tests/keepsake-group-tests.mjs` | |
| `product-catalog-tests.mjs` | | `node src/tests/product-catalog-tests.mjs` | |
| `product-eligibility-tests.mjs` | | `node src/tests/product-eligibility-tests.mjs` | |
| `project-persistence-tests.mjs` | | `node src/tests/project-persistence-tests.mjs` | |
| `operator-inbox-processor-tests.mjs` | | `node src/tests/operator-inbox-processor-tests.mjs` | |
| `product-render-spec-tests.mjs` | | `node src/tests/product-render-spec-tests.mjs` | |
| `prototype-preview-registry-tests.mjs` | | `node src/tests/prototype-preview-registry-tests.mjs` | |
| `product-experience-readiness-tests.mjs` | | `node src/tests/product-experience-readiness-tests.mjs` | |
| `product-experience-consumer-tests.mjs` | | `node src/tests/product-experience-consumer-tests.mjs` | |

**Aggregate result:** `[N suites green / M failing]` of 1466 expected tests.

**Skipped (and why):** `[list or none]`

---

## 3. Tests — Layer 2 (E2E seeded)

- [ ] Required? `[yes / no — reason]`
- [ ] Command: `cd scripts && npm run e2e`
- [ ] Result: `[N/41 passed]`
- [ ] Failure screenshots reviewed: `[N/A or path]`

---

## 4. Tests — Layer 3 (E2E real-files)

- [ ] Required? `[yes / no — reason]`
- [ ] Command: `cd scripts && npm run e2e:real`
- [ ] Result: `[N/64 passed (23 real + 41 seeded; or with chat.db: 65)]`

---

## 5. Tests — Layer 4 (capture harness)

- [ ] Required? `[yes / no — reason]`
- [ ] Scenario(s) run: `[A / B / C / D / all]`
- [ ] Result: `[passed / failed + details]`

---

## 6. Manual QA

- [ ] Required? `[yes / no — reason]`
- [ ] If required: filled in `docs/qa/manual-qa-template.md` (or linked record)
- [ ] Result: `[pass / pass-with-notes / fail]`

---

## 7. Docs / package verification

- [ ] All new files have purpose and ownership documented in the file itself
- [ ] All cross-references between docs are valid (no broken `[link](path.md)`)
- [ ] `docs/ai-system/CHANGELOG.md` and `version-history.md` updated if this package changes the AI Project OS layer
- [ ] `docs/ops/artifact-index.md` is queued for status-sync update (post-merge)
- [ ] `docs/ops/backlog-roadmap.md` is queued for status-sync update (post-merge)
- [ ] `docs/command-center/*` is queued for status-sync update (post-merge)
- [ ] `docs/project-control/coordinator-weekly-sync.md` weekly-log row added

---

## 8. Continuity files

- [ ] `AI_HANDOFF.md` reflects current state and the next exact action
- [ ] `CURRENT_STATE.md` reflects the closing state (last-closed package will be bumped after merge in the status sync)
- [ ] `NEXT_SESSION_PROMPT.md` points to the next action

---

## 9. Git identity + safety

- [ ] `git remote -v` correct
- [ ] `git config user.name` and `user.email` correct
- [ ] No `.claude/settings.local.json`, `_source-intake/`, `artifacts/`, generated files, secrets, or `node_modules/` staged
- [ ] Operator inbox/outbox raw files not staged

---

## 10. Recommended commit message

```
[type]: [short description]

[bullet body if needed]
```

---

## 11. Recommended merge plan

- Branch: `[name]`
- Base: `[main / other]`
- Merge flag: `--no-ff` (mandatory for package merges)
- Push order: feature push → merge → main push
- Status sync branch (post-merge): `docs/sync-command-center-after-[package-identifier]`

---

## 12. Recommended next-session prompt

```
[paste-ready prompt for the next session]
```

---

## Verdict

- [ ] **Safe to commit** — all required layers green or explicitly waived with reason
- [ ] **Hold** — blockers below

**Blockers (if any):**

1.
