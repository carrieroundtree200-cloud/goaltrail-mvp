# GoalTrail

A local-first prototype of a collaborative goal-execution workspace.

GoalTrail connects what a team discusses to the target it is trying to hit. A goal succeeds when its
real-world metric reaches its target by the deadline — **not** when the task list reaches 100%. The
app keeps those two ideas apart everywhere, and adds a third, health, for whether the goal looks
likely to land.

Everything runs in the browser. There is no server, no account, no API key and no environment
variable. Demo data and anything you create are stored in `localStorage`.

## Running it locally

You need Node.js 20.19 or newer (Node 22 is what this was built on) and npm.

```bash
npm install
npm run dev
```

Then open **http://127.0.0.1:43917**. On the entry screen choose any of the ten Northstar Logistics
people and click **Explore the demo**.

Other scripts:

```bash
npm run build     # typecheck and produce a production build in dist/
npm run preview   # serve the production build on http://127.0.0.1:43918
npm run test      # vitest, covering the metric and health engines and the demo data
npm run lint      # oxlint
```

To start over with clean demo data, use **Reset demo data** in the sidebar, or clear the
`goaltrail.workspace.v1` and `goaltrail.session.v1` keys from `localStorage`.

## The three signals, kept separate

This is the idea the whole app is built around, so it is worth stating plainly.

| Signal                 | Question it answers                                    | Where it comes from                                                                         |
| ---------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Target performance** | Is the real-world number going to land?                 | `src/lib/metrics.ts` — the metric against a straight line from baseline to target             |
| **Plan progress**      | How much of the agreed work is finished?                | `src/lib/plan.ts` — milestones and tasks                                                      |
| **Goal health**        | Is this goal likely to land, and what is in the way?    | `src/lib/health.ts` — pace, plus blockers, overdue work and high-impact risks                 |

Plan progress is never labelled as goal success. Health is never shown as a bare colour: every
rating carries the list of reasons that produced it, each with the numbers behind it.

### How health is decided

Reasons are collected, each with a severity, and the worst one sets the level.

- **Blocked** — a high or critical blocker is open, or two or more blockers are open at once.
- **At risk** — pace below 70% of what is needed, the deadline has passed without the target, a
  critical risk is open, three or more tasks are overdue or blocked, a milestone is overdue, or a
  single blocker is open.
- **Watch** — pace below 95%, the metric moved the wrong way at the last reading, one or two tasks
  are overdue or blocked, a high-impact risk is open, a weighty change is awaiting a decision, or
  the next milestone has not been started with the date approaching.
- **On track** — none of the above.

## Routes

| Route                  | What it is                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `/`                    | Entry screen — pick a demo person, or use the email form (any address opens the demo)       |
| `/dashboard`           | Target performance, plan progress, what needs attention, goal cards, recent activity        |
| `/goals/new`           | Four-step goal wizard ending in a SMART preview                                             |
| `/goals/:goalId`       | Goal workspace with eight tabs                                                              |
| `/meetings/:meetingId` | One meeting: minutes, decisions, action items, risks and changes raised, and what changed   |

The goal tabs are `Overview`, `Goal`, `Plan`, `Work board`, `People`, `Meetings`, `Risks & changes`
and `Files`, each with its own URL (`/goals/:goalId/plan`, and so on) so they can be linked to
directly.

## What you can do

- Create a goal through the wizard: the goal and its purpose, the metric and how it is measured,
  dates and people with optional first milestones, then a SMART review before anything is saved.
  The baseline is recorded as the first measurement so the goal has something to move from.
- Record a measurement against any goal and watch the target status, pace and health recompute.
- Add, edit and move work across the five board columns — Backlog, To do, In progress, Blocked and
  Done — using the status menu on each card. Moving a task to Blocked asks what it is waiting on.
- Log a meeting with minutes and a **What changed?** summary, then add decisions, action items and
  risks or changes from the meeting page. Meetings are never rated or scored.
- Keep risks, blockers and changes in one register with impact, status, owner and review date.
- Manage who is on a goal and what each person is accountable for.
- Link the documents and dashboards a goal depends on.

## The demo data

Northstar Logistics is a regional freight and last-mile delivery company. Ten people work across
four goals, and all dates are generated relative to today, so the demo never looks stale.

| Goal                                          | Metric                        | Health   | Why                                                         |
| --------------------------------------------- | ----------------------------- | -------- | ----------------------------------------------------------- |
| Cut late deliveries across the Midwest region | On-time delivery rate         | Watch    | Slightly behind pace, last reading dipped, some work overdue |
| Launch same-day delivery in Columbus          | Same-day orders per week      | Blocked  | A critical city permit is holding up the micro-depot         |
| Bring cost per delivery under $6.60           | Cost per delivery             | At risk  | Overtime is absorbing the route savings; tasks overdue       |
| Lift 90-day driver retention to 82%           | 90-day driver retention       | On track | Ahead of pace, nothing blocked or overdue                    |

## Project layout

```
src/
  types/                 the domain model
  lib/                   dates, formatting, metric maths, plan maths, health engine, SMART wording
  services/              dataService.ts (the interface), localDataService.ts, storage.ts
  data/seed/             the Northstar Logistics demo workspace
  state/                 WorkspaceProvider, selectors, toasts
  components/ui/         Button, Card, Badge, Dialog, Menu, Field, Progress, Avatar, states
  components/domain/     TargetCard, PlanCard, HealthBadge, GoalCard, TaskCard, MetricHistory, …
  components/layout/     AppShell, PageHeader
  routes/                one file per page, with the goal tabs under routes/goal/
```

## Replacing localStorage with Supabase later

Everything reaching for data goes through one interface, `DataService` in
`src/services/dataService.ts`. Nothing above that layer imports `localStorage` or the seed data, and
every method is already async. Each mutation returns the resulting workspace alongside the row it
touched, so a caller never has to guess what the store now holds.

To switch backends, write `SupabaseDataService implements DataService` and change one line in
`src/services/index.ts`:

```ts
export const dataService: DataService = new SupabaseDataService()
```

The table shapes map straight onto the types in `src/types/index.ts`.

## Deliberately not built yet

No AI transcript processing, calendar sync, file uploads or external integrations. The Files tab
stores links to files that live elsewhere rather than uploading them. There are no real accounts:
the entry screen picks which demo person you are.

Meetings have no rating and no score, on purpose. A meeting is worth having if something changed
because of it, which is what the **What changed?** field is for.

## Built with

React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide React, React Hook Form, Zod and
date-fns.
