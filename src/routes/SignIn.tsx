import { ArrowRight, CheckCircle2, Route as RouteIcon, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { LoadingPanel } from '@/components/ui/states'
import { DEMO_PERSON_ID } from '@/data/seed'
import { useWorkspace } from '@/state/workspace'

const highlights = [
  'Track the real-world metric that decides whether the goal succeeded',
  'Keep plan progress and goal health as separate, honest signals',
  'Connect every meeting to decisions, risks, changes and accountable work',
]

export function SignIn() {
  const { status, workspace, session, signIn } = useWorkspace()
  const navigate = useNavigate()
  const [personId, setPersonId] = useState(DEMO_PERSON_ID)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true })
  }, [session, navigate])

  async function enter(id: string) {
    setBusy(true)
    await signIn(id, 'demo')
    navigate('/dashboard')
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="bg-accent-700 inline-flex size-10 items-center justify-center rounded-xl text-white">
              <RouteIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">GoalTrail</span>
          </div>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-900">
            Make meetings count towards the goal
          </h1>
          <p className="mt-3 text-slate-600">
            GoalTrail connects what a team discusses to the target it is trying to hit. Sign in to
            pick up where the Northstar Logistics team left off.
          </p>

          {status === 'loading' ? (
            <LoadingPanel label="Preparing the workspace" />
          ) : (
            <div className="mt-8 space-y-5">
              <div className="card space-y-4 p-5">
                <div className="flex items-start gap-2.5">
                  <Users aria-hidden="true" className="text-accent-700 mt-0.5 size-4.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Explore the demo</h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      No account needed. Choose who you want to be and everything you change is
                      saved in this browser.
                    </p>
                  </div>
                </div>

                <Field label="Sign in as" htmlFor="demo-person">
                  <Select
                    id="demo-person"
                    value={personId}
                    onChange={(event) => setPersonId(event.target.value)}
                  >
                    {workspace.people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} — {person.jobTitle}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Button className="w-full" disabled={busy} onClick={() => void enter(personId)}>
                  {busy ? 'Opening the workspace…' : 'Explore the demo'}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>

              <details className="card group p-5">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 marker:content-none">
                  Sign in with a work email instead
                </summary>
                <form
                  className="mt-4 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void enter(DEMO_PERSON_ID)
                  }}
                >
                  <Field
                    label="Work email"
                    htmlFor="email"
                    hint="This prototype has no real accounts yet, so any address opens the demo workspace."
                  >
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                    />
                  </Field>
                  <Button type="submit" variant="secondary" className="w-full">
                    Continue
                  </Button>
                </form>
              </details>
            </div>
          )}
        </div>
      </section>

      <section className="bg-accent-900 hidden items-center justify-center px-10 py-12 lg:flex">
        <div className="max-w-md text-white">
          <p className="text-accent-300 text-xs font-semibold tracking-wide uppercase">
            Northstar Logistics
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Four live goals, one honest view
          </h2>
          <p className="text-accent-100 mt-3 text-sm leading-relaxed">
            A regional freight team working on late deliveries, cost per delivery, a same-day
            launch and driver retention. Every goal carries its own target, plan and health —
            kept separate on purpose.
          </p>
          <ul className="mt-8 space-y-3.5">
            {highlights.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm">
                <CheckCircle2 aria-hidden="true" className="text-accent-300 mt-0.5 size-4 shrink-0" />
                <span className="text-accent-50">{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-accent-300 mt-10 text-xs">
            Nothing leaves your browser. There is no server, no account and no tracking.
          </p>
        </div>
      </section>
    </div>
  )
}
