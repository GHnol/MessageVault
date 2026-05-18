# Worktree and Parallel Session Policy

**Applies to:** Claude Code and Codex in this repository
**Status:** Active — policy (worktrees optional, governed when used)

---

## Default posture

Single-branch, single-agent, sequential development is the default. One coding agent owns one branch at a time. Parallel work is allowed only under the rules below and only when it genuinely reduces wall-clock time without raising the risk of conflicting edits.

---

## Git worktrees

Git worktrees let one repository check out multiple branches into separate working directories simultaneously. They are permitted for genuinely independent workstreams (e.g. a docs pass and an unrelated test-harness fix).

Rules when using a worktree:

1. Worktree directories live outside the tracked tree or under `.claude/worktrees/` (gitignored). Never commit a worktree scratch directory.
2. Each worktree has exactly one owning agent and one branch.
3. No two worktrees may edit the same file in the same period.
4. Each worktree maintains its own `AI_HANDOFF.md` discipline on its own branch.
5. Merge order and conflict resolution are decided before parallel work starts, not after.
6. Scope-guarded areas remain off-limits in every worktree.

---

## Parallel sessions (without worktrees)

Two sessions on the same checkout editing the same branch is forbidden — it produces silent overwrites. If two sessions must run, they must be on separate branches via separate worktrees, or strictly sequential.

---

## When NOT to parallelize

- Changes that touch overlapping files
- Anything touching `index.html` or shared `src/` modules
- Package work where ordering matters (e.g. a feature and its status sync)
- Any case where the merge plan is not already agreed

When in doubt, serialize. Sequential is slower but safe; parallel conflicts are expensive.

---

## Readiness note

This policy is written ahead of heavy worktree use. `.claude/worktrees/` is gitignored. Live worktree tooling/automation is backlog, not built in this pass.
