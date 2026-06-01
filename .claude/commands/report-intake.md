# /report-intake

**Canonical skill:** `.claude/skills/report-intake/SKILL.md`

Run the report mirror intake sequence: sanitize and preview a closeout or planning report, then (after review) apply a sanitized summary to `docs/project-control/report-mirror-log.md`.

**Approval boundaries:** Dry-run requires no approval. `--apply` requires agent or Coordinator review of the dry-run output. Commit requires explicit user instruction.

Backed by: `docs/project-control/report-mirror-policy.md`, `docs/project-control/report-intake-runbook.md`, `scripts/report-mirror-intake.mjs`
