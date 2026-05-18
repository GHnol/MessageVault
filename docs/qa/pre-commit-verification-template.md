# Pre-Commit Verification

Fill this in before any commit instruction is acted on. It is the hygiene gate that precedes package closeout (`docs/automation/operator-mode/package-closeout-protocol.md`).

---

**Date:** `[YYYY-MM-DD]`
**Branch:** `[branch name]`
**Package / task:** `[name]`
**Verified by:** `[agent / human]`

---

## 1. Working tree

```
git status --short
```

- [ ] Only expected files appear
- [ ] No `index.html` / `src/**` changes (unless explicitly authorized — note below)
- [ ] No `.claude/settings.local.json`
- [ ] No `_source-intake/`
- [ ] No `artifacts/` / generated exports / PDFs / `.ics`
- [ ] No `node_modules/` additions
- [ ] No operator inbox/outbox generated files
- [ ] No secrets / credentials / `.env`
- [ ] No private or personal-path files

**Unexpected files found:** `[none / list — if any, STOP and report]`

## 2. Diff sanity

```
git diff --stat
git diff -- [each changed file]
```

- [ ] Every change is in scope for this package/task
- [ ] No unrelated rewrites or drive-by refactors
- [ ] No debug output / `console.log` left in
- [ ] No secrets or local paths in the diff

## 3. Tests / checks

| Check | Command | Result |
|---|---|---|
| | | |

- [ ] Relevant unit suites run (or N/A — reason: )
- [ ] E2E run (or N/A — reason: )
- [ ] Capture harness run (or N/A — reason: )
- [ ] All run checks green

## 4. Manual QA (UI/behavior changes only)

- [ ] Completed — record: `docs/qa/manual-qa-template.md`
- [ ] Not required — reason:

## 5. Continuity

- [ ] `AI_HANDOFF.md` reflects current state
- [ ] `CURRENT_STATE.md` / `NEXT_SESSION_PROMPT.md` updated if state changed

## 6. Git identity

- [ ] `git remote -v` correct
- [ ] `git config user.name` / `user.email` correct

---

## Verdict

- [ ] **Safe to commit**
- [ ] **Needs correction first** — details:

**Recommended commit message:**

```
<type>: <short description>

<body if needed>
```
