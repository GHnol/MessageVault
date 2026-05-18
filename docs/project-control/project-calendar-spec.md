# Project Calendar / Schedule Spec (NOT BUILT)

**Status:** Spec only. No calendar, `.ics`, or schedule export is generated in this pass. This describes how it will work when the Project Control Tower pass builds it.

---

## Principles

- The calendar is a **view of the schedule**, which is a view of the roadmap, which is derived from `docs/ops/backlog-roadmap.md` + gate status. The calendar never holds unique truth.
- All generated calendar/schedule files (`.ics`, CSVs) are **gitignored** and never committed.
- Dates tied to gated dependencies (vendor, designer, PDF pipeline) are explicitly marked **estimate / gated** until the gate clears.

---

## Planned export targets (future)

| Target | Format | Committed? | Notes |
|---|---|---|---|
| Google Calendar | `.ics` | No (gitignored) | Milestones + gate review dates |
| ClickUp | CSV import | No (gitignored) | Backlog + scheduled items |
| TickTick | personal checklist export | No (gitignored) | Owner execution layer |

---

## Field model (future)

| Field | Meaning |
|---|---|
| `id` | Stable item id (maps to backlog/roadmap) |
| `title` | Short item title |
| `type` | milestone / package / gate-review / decision-due |
| `start` / `due` | ISO dates; `estimate` flag if gated |
| `depends_on` | upstream item ids |
| `gate` | gate that must clear first (if any) |
| `owner` | who acts |
| `status` | not-started / in-progress / blocked / done |

---

## Consistency rule

Every regeneration must:

1. Re-read `CURRENT_STATE.md` and `docs/command-center/current-status.md`
2. Re-read `docs/ops/backlog-roadmap.md` and the gate table
3. Mark every gated date as an estimate until the gate clears
4. Never invent dates for unauthorized packages

---

## Not in scope here

No scheduling automation, no live calendar sync, no date math, no `.ics` generation. Backlog only — see `project-control-tower-plan.md`.
