# Package Closeout Protocol

**Last updated:** 2026-05-10
**Applies to:** Claude Code (Operator) after each package is authorized for commit

---

## Purpose

Define the exact steps Claude Code follows to close out a package and hand it back to the Coordinator and Development stream for review.

---

## When this protocol activates

This protocol activates when the user (Coordinator via Development stream) issues a commit instruction for a completed package.

---

## Step 1 — Pre-commit verification

Before committing, run:

```bash
git status --short
```

Confirm:
- Only approved files are staged (no app code, no `_source-intake/`, no `.claude/settings.local.json`)
- For docs packages: only `docs/` and `.gitignore` modifications
- Working tree shows only expected files

If unexpected files appear: stop, report, ask before proceeding.

---

## Step 2 — Run a file tree summary

For the affected directories, run:

```bash
find docs/[directory] -type f | sort
```

Confirm the file list matches the authorized package scope.

---

## Step 3 — Stage only authorized files

Stage files explicitly by path — never use `git add -A` or `git add .` without first verifying what will be staged.

```bash
git add docs/strategy/ docs/architecture/ docs/ops/ .gitignore
# (adjust paths to match the authorized package scope)
```

---

## Step 4 — Verify staging

Run `git status --short` again. Confirm staged files show `A` (added) or `M` (modified) for exactly the authorized files — nothing else.

---

## Step 5 — Commit with approved message

Use the HEREDOC format to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
[type]: [short description]

[bullet body if needed]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Never skip pre-commit hooks (`--no-verify`). If a hook fails, fix the underlying issue and create a NEW commit.

---

## Step 6 — Post-commit verification

Run:

```bash
git status --short
git log --oneline -5
```

Confirm:
- Working tree is clean
- Commit appears in log with expected hash and message

---

## Step 7 — Push (only when explicitly instructed)

```bash
git push origin [branch-name]
```

---

## Step 8 — Merge to main (only when explicitly instructed)

```bash
git checkout main
git merge --no-ff [branch-name] -m "merge: [same short description as feature commit]"
git push origin main
```

Never force-push to main. Never skip the --no-ff flag for package merges (preserves merge history).

---

## Step 9 — Produce closeout report

After commit and merge, produce a closeout report using the template at `docs/automation/templates/package-closeout-packet.md`.

Required fields:
1. Feature branch name
2. Feature commit hash
3. Merge commit hash
4. Final main commit hash
5. Files committed (list)
6. Final test results
7. Final git status
8. Whether main is pushed
9. Whether working tree is clean
10. Scope confirmation (what was explicitly excluded)

---

## Step 10 — Update command center (if applicable)

If the project has command center docs (`docs/command-center/`), update `current-status.md` to reflect the newly completed package.

---

## Things that are NEVER part of package closeout

- Do not commit `_source-intake/`
- Do not commit `.claude/settings.local.json`
- Do not commit `artifacts/` zips or generated files
- Do not self-authorize scope expansion (if unexpected files need to go in, flag and ask)
- Do not amend published commits — create new commits instead
- Do not force-push to main

---

## Error recovery

If a pre-commit hook fails:
1. Do NOT use `--no-verify`
2. Fix the underlying issue
3. Re-stage the files
4. Create a NEW commit

If a merge conflict occurs:
1. Resolve the conflict by reading both sides carefully
2. Do not discard changes without understanding them
3. Report any non-obvious conflicts to the user before resolving
