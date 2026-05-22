# Next Session Prompt — after Package 2.8 (Project Control Tower)

**Last updated:** 2026-05-17 (America/New_York)
**Use:** Copy the block below into the next session once you have reviewed the Tower. It is self-contained and assumes no chat memory.

---

## What Package 2.8 did

Built the full KeepMees Project Control Tower under `docs/project-control/`: README, master roadmap (Phases 0–15 with package history mapped in), master schedule (dated, confidence-labelled), current sprint, backlog (16 lanes), Kanban board, 11 phase gates, decision log, project risk register, calendar spec + importable `.ics`, ClickUp CSV, TickTick CSV + weekly checklist + recurring routines, next-7/30/90-day plans, Coordinator weekly sync process, and this prompt. Added a surgical `.gitignore` exception so the repo-native `.ics` is trackable. No app code touched. Package 5A remains paused.

---

## Copy-paste prompt for the next session

> You are Claude Code on the KeepMees / MessageVault repo, Operator Mode. Do not trust chat memory. Read in order: `AGENTS.md`, `CLAUDE.md`, `AI_HANDOFF.md`, `CURRENT_STATE.md`, then `docs/project-control/README.md`, `current-sprint.md`, `next-7-days.md`, `phase-gates.md`. Run `git status` and `git log --oneline -10`.
>
> Context: Package 2.8 (Project Control Tower) was built on branch `docs/project-control-tower` and is awaiting Coordinator review. It is NOT committed yet unless `git log` shows it merged.
>
> Then do exactly what I authorize below — nothing more:
>
> 1. If I say "Tower approved, run closeout": perform the Operator Mode closeout for Package 2.8 (pre-commit hygiene check, commit with the recommended message, push branch, merge to main with `--no-ff`, push main, then status-sync `CURRENT_STATE.md` / `docs/command-center/*` / `AI_HANDOFF.md`). Do not touch app code. Report all hashes.
> 2. If I say "Tower changes: <list>": apply only those changes under `docs/project-control/`, re-validate, do not commit.
> 3. After the Tower is merged AND I explicitly say "authorize Package 5A": prepare a scoped Package 5A (Message Book Proof Approval State Foundation) package prompt — proof approval STATE model + tests only, NO checkout, NO PDF, NO preview renderers, NO app-scope creep. Do not start 5A implementation until I approve the prompt.
>
> Hard rules: do not start Package 5A before the Tower is merged and 5A is explicitly authorized (Foundation Operating System Gate). Do not change `index.html`, `src/**`, or `scripts/**`. Do not reopen locked decisions. Do not commit or push without explicit instruction. Keep vendor/design/packaging gated; no external outreach.

---

## How to import the layers (founder, optional)

- **Google Calendar:** Calendar → Settings → Import & export → Import → `docs/project-control/keepmees-project-calendar.ics` → choose a "KeepMees" calendar → Import.
- **ClickUp:** new List → Import → CSV → `docs/project-control/clickup-import.csv` → map columns to fields → import.
- **TickTick:** import `docs/project-control/ticktick-import.csv` (set recurrence in-app afterward — CSV recurrence is unreliable), then follow `ticktick-weekly-checklist.md` and create routines from `ticktick-recurring-routines.md`.

These are optional. The repo works without them. They never become source of truth.

## What Claude should NOT do yet

Start Package 5A before Tower merge + explicit authorization · change app code · build checkout/PDF/preview renderers · restart design hiring · create vendor outreach · build n8n/Make/Zapier · make public product/manufacturing/launch claims · commit/push without instruction.
