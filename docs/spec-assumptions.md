# Spec assumptions

The build brief (`goaltrail_mvp_build_brief.md`) was not present in this repository when GoalTrail
was built — the repo contained a single empty root commit and no such file anywhere in its history.
The written requirements were detailed enough to build from directly, but three of them deferred to
the brief for specifics. This file records what was chosen instead, so the decisions are easy to
find and correct if the original brief turns up.

## 1. The five work board statuses

> "Include the five statuses from the brief."

Chosen: **Backlog → To do → In progress → Blocked → Done**.

Defined in `taskStatusOrder` in `src/components/domain/status.ts`, with the union type `TaskStatus`
in `src/types/index.ts`. Changing them means editing those two places plus any seed data that uses
the old names.

Blocked sits between In progress and Done on purpose: it reads as work that has started and then
stopped, which is what the board is trying to make visible. Moving a task into Blocked requires a
reason, so the column explains itself rather than becoming a silent dumping ground.

## 2. The four goal wizard steps

> "Implement a four-step goal creation flow described in the build brief."

Chosen:

1. **The goal** — title, why it matters, who feels the difference, tags.
2. **The measure** — metric name, unit, direction, baseline, target, source, reading cadence.
3. **Dates and people** — start date, deadline, owner, sponsor, contributors, optional first
   milestones.
4. **Review** — the SMART preview, then create.

The ordering is the argument: you name the number before you name the plan, because the number is
what decides success. Step 2 says so in plain text on the form.

On save the wizard writes the goal, an owner membership plus any contributors, any milestones, and
the baseline as the goal's first measurement, then navigates to the new goal's overview.

## 3. The Northstar Logistics demo data

> "Create the full Northstar Logistics demo data from the build brief."

Northstar Logistics is built here as a regional freight and last-mile delivery company in the US
Midwest: ten people, four goals, roughly 50 tasks, 18 milestones, 12 meetings, 10 decisions, 19
risks, blockers and changes, 34 metric readings, 12 linked files, and an activity feed derived from
all of it.

The four goals were chosen so each one demonstrates a different health rating, and so the health
engine can be checked by reading the screen:

| Goal                 | Health   | What produces it                                                                        |
| -------------------- | -------- | ---------------------------------------------------------------------------------------- |
| Late deliveries      | Watch    | Pace at roughly 0.86, the last reading dipped, one blocked task and one overdue task       |
| Same-day in Columbus | Blocked  | A critical open blocker (city permit), on top of a pace well below what is needed          |
| Cost per delivery    | At risk  | Pace at roughly 0.58, a critical risk, three overdue tasks, one open medium blocker        |
| Driver retention     | On track | Pace above 1.2, nothing blocked, nothing overdue, only medium-impact risks open            |

All dates are generated relative to `today()` at seed time (`src/data/seed/helpers.ts`), so the
demo reads sensibly whenever it is opened rather than drifting into the past.

The two cross-goal threads are intentional: dock dwell at the Joliet hub hurts both the late
delivery goal and the cost goal, and the same-day launch works against the cost goal. They give the
risk register and meeting notes something real to connect.

## Smaller judgement calls

- **Action items** are tasks with a `meetingId`, so an action item agreed in a meeting is the same
  row that appears on the work board. There is no separate action-item entity to fall out of sync.
- **Risks, blockers and changes** share one `TrackedItem` shape and one register. They differ by
  `kind` and by which statuses apply to each (`itemStatusesByKind`).
- **Files** are links only. The tab says so, since uploads are explicitly out of scope.
- **Sign-in** has no real accounts. Choosing a person sets who is recorded as the actor on every
  change. The email form accepts any address and opens the same demo workspace.
- **Pace** is measured against a straight line from baseline to target across the goal's dates. It
  is the simplest model a non-expert can reason about, and every screen that uses it also shows
  where that straight line would put the metric today.
